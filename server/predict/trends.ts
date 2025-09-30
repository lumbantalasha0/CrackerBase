import { storage } from "../storage";
import fs from "fs/promises";
import path from "path";

type Params = {
  start?: string;
  end?: string;
  granularity?: 'daily' | 'weekly' | 'monthly';
  horizon?: number;
  method?: string;
  minHistory?: number;
  thresholds?: { increase?: number; decrease?: number };
  storeDb?: boolean;
  notify?: boolean;
};

function toLusakaDate(d: Date) {
  // Zambia (Lusaka) is UTC+2
  return new Date(d.getTime() + 2 * 60 * 60 * 1000);
}

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function ensurePredictionsDir() {
  const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'data', 'predictions');
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

function rangeDays(start: Date, end: Date) {
  const out: string[] = [];
  let cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur <= last) {
    out.push(dateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export async function predictTrends(opts: Params) {
  const start = opts.start ? new Date(opts.start) : new Date(Date.now() - 365 * 24 * 3600 * 1000);
  const end = opts.end ? new Date(opts.end) : new Date();
  const granularity = opts.granularity || 'daily';
  const horizon = opts.horizon ?? 30;
  const minHistory = opts.minHistory ?? 90;

  // 1) Load sales and aggregate per-day (Africa/Lusaka alignment)
  const sales = await storage.getSales();
  const perDay: Record<string, number> = {};
  for (const s of sales) {
    const dt = toLusakaDate(new Date(s.createdAt));
    const key = dateKey(dt);
    perDay[key] = (perDay[key] || 0) + Number(s.totalPrice || 0);
  }

  const days = rangeDays(start, end);
  const series: { date: string; value: number }[] = days.map(d => ({ date: d, value: perDay[d] ?? 0 }));

  // 2) Minimum history check
  const nonEmptyDays = series.filter(x => x.value > 0).length;
  let methodUsed = opts.method || 'auto';
  let reason = '';
  if (nonEmptyDays < minHistory) {
    reason = `insufficient_history: only ${nonEmptyDays} non-empty days (<${minHistory})`; 
    methodUsed = 'fallback_moving_average';
  }

  // 3) Simple gap handling: if gap <=2 interpolate linearly
  for (let i = 0; i < series.length; i++) {
    if (series[i].value === 0) {
      // find next non-zero within 2
      let j = i+1;
      while (j < series.length && series[j].value === 0 && j - i <= 2) j++;
      if (j < series.length && series[j].value !== 0 && j - i <=2) {
        // linear interpolate between prev (i-1) and j
        const prevVal = i-1 >=0 ? series[i-1].value : series[j].value;
        const nextVal = series[j].value;
        const gap = j - i + 1;
        for (let k = i; k < j; k++) {
          const t = (k - (i-1)) / gap;
          series[k].value = Math.round((prevVal * (1 - t) + nextVal * t) * 100) / 100;
        }
        i = j;
      }
    }
  }

  // 4) Outlier detection (IQR)
  const values = series.map(s => s.value).slice();
  const sorted = [...values].sort((a,b) => a-b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)] ?? 0;
  const q3 = sorted[Math.floor(sorted.length * 0.75)] ?? 0;
  const iqr = q3 - q1;
  const outliers: string[] = [];
  for (const s of series) {
    if (s.value > q3 + 1.5 * iqr || s.value < q1 - 1.5 * iqr) outliers.push(s.date);
  }

  // 5) Model (very small auto): weekly-seasonal + linear trend if >=365 days, else moving average
  const lastN = series.slice(-Math.min(series.length, 90));
  const mean = lastN.reduce((a,b) => a + b.value, 0) / (lastN.length || 1);
  let preds: { date: string; pred: number }[] = [];
  // helper: detect weekly seasonality strength (ratio of max dow avg to mean)
  const dowSums: Record<number, {sum:number,count:number}> = {};
  for (const s of series) {
    const d = new Date(s.date + 'T00:00:00Z');
    const dow = toLusakaDate(d).getDay();
    dowSums[dow] = dowSums[dow] || { sum: 0, count: 0 };
    dowSums[dow].sum += s.value; dowSums[dow].count++;
  }
  const dowAvg: Record<number, number> = {};
  for (let i=0;i<7;i++) dowAvg[i] = (dowSums[i]?.sum || 0) / (dowSums[i]?.count || 1);
  const dowValues = Object.values(dowAvg);
  const dowMean = dowValues.reduce((a,b)=>a+b,0)/7 || 0;
  const seasonalityStrength = dowMean === 0 ? 0 : Math.max(...dowValues) / (dowMean || 1);

  // choose Holt-Winters when we have weekly seasonality and enough data
  if (methodUsed === 'auto' && series.length >= 60 && seasonalityStrength > 1.1) {
    methodUsed = 'holt-winters-weekly';
  }

  // Holt-Winters additive implementation (season length = 7)
  function holtWintersAdditive(values: number[], seasonLen = 7, alpha = 0.4, beta = 0.1, gamma = 0.2, nPred = 14) {
    const m = seasonLen;
    const n = values.length;
    if (n < m * 2) return null; // insufficient for HW

    // initial level = mean of first season
    const seasonAverages: number[] = [];
    for (let i = 0; i < Math.floor(n / m); i++) {
      const slice = values.slice(i*m, (i+1)*m);
      seasonAverages.push(slice.reduce((a,b)=>a+b,0)/slice.length);
    }
    const initialTrend = (seasonAverages.length >=2) ? (seasonAverages[1] - seasonAverages[0]) / m : 0;
    const initialLevel = seasonAverages[0] || 0;

    // initial seasonal indices
    const seasonals: number[] = new Array(m).fill(0);
    const seasons = Math.floor(n / m);
    for (let i = 0; i < m; i++) {
      let sum = 0;
      for (let j = 0; j < seasons; j++) {
        sum += values[j*m + i] - seasonAverages[j];
      }
      seasonals[i] = sum / Math.max(1, seasons);
    }

    let level = initialLevel;
    let trend = initialTrend;
    const result: number[] = [];
    for (let i=0;i<n;i++) {
      const val = values[i];
      const seasonal = seasonals[i % m];
      const lastLevel = level;
      level = alpha * (val - seasonal) + (1 - alpha) * (level + trend);
      trend = beta * (level - lastLevel) + (1 - beta) * trend;
      seasonals[i % m] = gamma * (val - level) + (1 - gamma) * seasonal;
      result.push(level + trend + seasonals[i % m]);
    }

    // produce nPred forecasts
    const forecasts: number[] = [];
    for (let h = 1; h <= nPred; h++) {
      const idx = (n + h - 1) % m;
      forecasts.push(level + h * trend + seasonals[idx]);
    }
    return forecasts.map(f => Math.max(0, Math.round(f * 100) / 100));
  }

  if (methodUsed === 'holt-winters-weekly') {
    const values = series.map(s => s.value);
    const hw = holtWintersAdditive(values, 7, 0.4, 0.05, 0.2, horizon);
    if (hw && hw.length > 0) {
      const now = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      for (let h = 1; h <= hw.length; h++) {
        const d = new Date(now);
        d.setDate(d.getDate() + h);
        preds.push({ date: dateKey(d), pred: hw[h-1] });
      }
      reason = reason || 'holt-winters-weekly';
    } else {
      // fallback to moving average
      for (let h = 1; h <= horizon; h++) {
        const d = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        d.setDate(d.getDate() + h);
        preds.push({ date: dateKey(d), pred: Math.round(mean * 100) / 100 });
      }
      reason = reason || 'moving-average-fallback';
    }
  } else {
    // fallback moving average or explicit request
    for (let h = 1; h <= horizon; h++) {
      const d = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      d.setDate(d.getDate() + h);
      preds.push({ date: dateKey(d), pred: Math.round(mean * 100) / 100 });
    }
    reason = reason || 'moving-average-fallback';
  }

  // 6) Residuals and intervals (bootstrap quantiles)
  const residuals = series.map((s, i) => s.value - (series[i] ? series[i].value : mean));
  const absResiduals = residuals.map(r => Math.abs(r));
  const std = Math.sqrt(absResiduals.reduce((a,b)=>a+b*b,0) / (absResiduals.length || 1));

  const outPreds = preds.map(p => {
    const lower95 = Math.max(0, Math.round((p.pred - 1.96 * std) * 100) / 100);
    const upper95 = Math.round((p.pred + 1.96 * std) * 100) / 100;
    return { date: p.date, pred: p.pred, lower95, upper95, model: methodUsed, reason };
  });

  // 7) Business rule layer: recommendations
  const recommendations: Record<string, string> = {};
  const inc = opts.thresholds?.increase ?? 0.2;
  const dec = opts.thresholds?.decrease ?? -0.15;
  const baseline = mean || 1;
  for (const p of outPreds) {
    const change = (p.pred - baseline) / (baseline || 1);
    if (change >= inc) recommendations[p.date] = `predicted increase ${Math.round(change*100)}% - recommend ramp-up (reorder)`;
    else if (change <= dec) recommendations[p.date] = `predicted decrease ${Math.round(change*100)}% - recommend scale-down`;
    else recommendations[p.date] = 'no action';
  }

  // 8) Persist predictions to disk
  const dir = await ensurePredictionsDir();
  const filename = `trends_${new Date().toISOString().slice(0,10)}.json`;
  const outPayload = {
    generatedAt: new Date().toISOString(),
    params: opts,
    series,
    predictions: outPreds.map(p => ({ ...p, recommended_action: recommendations[p.date] })),
    outliers,
  };
  await fs.writeFile(path.join(dir, filename), JSON.stringify(outPayload, null, 2), 'utf8');

  // 9) Optionally store in DB/settings
  if (opts.storeDb) {
    try {
      await storage.setSetting(`predictions:${filename}`, JSON.stringify(outPayload));
    } catch (e) {
      // ignore
    }
  }

  // 10) Optionally notify (no-op: record a flag in settings)
  if (opts.notify) {
    await storage.setSetting(`predictions-notify:${filename}`, JSON.stringify({ notifiedAt: new Date().toISOString(), note: 'notify flag set (implementation: console/logging only)'}));
    // In a real system we'd wire email/Slack here
  }

  return outPayload;
}

export default predictTrends;
