import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/queryClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

type Pred = { date: string; pred: number; lower95: number; upper95: number; recommended_action?: string };

export default function PredictionsWidget() {
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<Pred[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function fetchPredictions() {
    setLoading(true); setError(null);
    try {
      const res = await apiRequest('POST', '/api/v1/predict/trends', { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ horizon: 14, method: 'auto' }) });
      const data = await res.json();
      // data may be array or object
      const preds = Array.isArray(data) ? data : (data.predictions || data);
      setPredictions(preds.map((p: any) => ({ date: p.date, pred: Number(p.pred), lower95: Number(p.lower95), upper95: Number(p.upper95), recommended_action: p.recommended_action || p.recommendation || '' })));
    } catch (e: any) {
      setError(String(e?.message || e));
    }
    setLoading(false);
  }

  useEffect(() => { fetchPredictions(); }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Predicted Demand (next 14 days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div style={{ width: '100%', height: 200 }}>
            {predictions.length === 0 ? (
              <div className="text-sm text-muted-foreground">{loading ? 'Computing predictions...' : (error ? `Error: ${error}` : 'No predictions yet')}</div>
            ) : (
              <ResponsiveContainer>
                <AreaChart data={predictions} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(v:any) => `ZMW ${Number(v).toLocaleString()}`} />
                  <Area type="monotone" dataKey="upper95" stroke="rgba(99,102,241,0.1)" fill="rgba(99,102,241,0.08)" isAnimationActive={false} />
                  <Area type="monotone" dataKey="lower95" stroke="rgba(99,102,241,0.1)" fill="rgba(99,102,241,0.08)" isAnimationActive={false} />
                  <Line type="monotone" dataKey="pred" stroke="#6366f1" dot={{ r: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-1 text-sm">
            {predictions.slice(0,5).map((p) => (
              <div key={p.date} className="flex justify-between items-center">
                <div className="text-sm">{p.date}</div>
                <div className="text-right">
                  <div className="font-semibold">ZMW {Number(p.pred).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{p.recommended_action}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" onClick={fetchPredictions} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
