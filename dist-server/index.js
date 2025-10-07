var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { Router } from "express";

// server/storage.ts
import { eq, desc } from "drizzle-orm";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  customers: () => customers,
  expenseCategories: () => expenseCategories,
  expenses: () => expenses,
  ingredients: () => ingredients,
  insertCustomerSchema: () => insertCustomerSchema,
  insertExpenseCategorySchema: () => insertExpenseCategorySchema,
  insertExpenseSchema: () => insertExpenseSchema,
  insertIngredientSchema: () => insertIngredientSchema,
  insertInventoryMovementSchema: () => insertInventoryMovementSchema,
  insertSaleSchema: () => insertSaleSchema,
  inventoryMovements: () => inventoryMovements,
  sales: () => sales,
  settings: () => settings
});
import { pgTable, serial, text, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  businessName: text("business_name"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var inventoryMovements = pgTable("inventory_movements", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  // 'addition' or 'sale'
  quantity: integer("quantity").notNull(),
  balance: integer("balance").notNull(),
  // Running balance after this movement
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name"),
  // For one-time customers
  quantity: integer("quantity").notNull(),
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("completed"),
  // 'pending' or 'completed'
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var expenseCategories = pgTable("expense_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").default("blue"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => expenseCategories.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("approved"),
  // 'pending' or 'approved'
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  multiplier: decimal("multiplier", { precision: 10, scale: 4 }).notNull(),
  // Ratio per 1kg flour
  unit: text("unit").notNull().default("g"),
  // 'g', 'ml', 'kg', 'l'
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true
}).extend({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  businessName: z.string().optional(),
  location: z.string().optional()
});
var insertInventoryMovementSchema = createInsertSchema(inventoryMovements).omit({
  id: true,
  createdAt: true,
  balance: true
}).extend({
  type: z.enum(["addition", "sale"]),
  quantity: z.number().positive("Quantity must be positive"),
  note: z.string().optional()
});
var insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
  totalPrice: true
}).extend({
  customerId: z.number().optional(),
  customerName: z.string().optional(),
  quantity: z.number().positive("Quantity must be positive"),
  pricePerUnit: z.number().positive("Price must be positive"),
  status: z.enum(["pending", "completed"]).default("completed")
});
var insertExpenseCategorySchema = createInsertSchema(expenseCategories).omit({
  id: true,
  createdAt: true
}).extend({
  name: z.string().min(1, "Category name is required"),
  color: z.string().default("blue")
});
var insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true
}).extend({
  categoryId: z.number().optional(),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required"),
  notes: z.string().optional(),
  status: z.enum(["pending", "approved"]).default("approved")
});
var insertIngredientSchema = createInsertSchema(ingredients).omit({
  id: true,
  createdAt: true
}).extend({
  name: z.string().min(1, "Ingredient name is required"),
  multiplier: z.number().positive("Multiplier must be positive"),
  unit: z.string().default("g")
});

// server/db.ts
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
var DrizzleStorage = class {
  async getCustomers() {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }
  async getCustomer(id) {
    const result = await db.select().from(customers).where(eq(customers.id, id));
    return result[0];
  }
  async createCustomer(customer) {
    const result = await db.insert(customers).values(customer).returning();
    return result[0];
  }
  async updateCustomer(id, customer) {
    const result = await db.update(customers).set(customer).where(eq(customers.id, id)).returning();
    return result[0];
  }
  async deleteCustomer(id) {
    await db.delete(customers).where(eq(customers.id, id));
    return true;
  }
  async getInventoryMovements() {
    return await db.select().from(inventoryMovements).orderBy(desc(inventoryMovements.createdAt));
  }
  async getInventoryMovement(id) {
    const result = await db.select().from(inventoryMovements).where(eq(inventoryMovements.id, id));
    return result[0];
  }
  async createInventoryMovement(movement) {
    const currentStock = await this.getCurrentStock();
    const newBalance = movement.type === "addition" ? currentStock + movement.quantity : currentStock - movement.quantity;
    const result = await db.insert(inventoryMovements).values({
      ...movement,
      balance: newBalance
    }).returning();
    return result[0];
  }
  async getCurrentStock() {
    const result = await db.select().from(inventoryMovements).orderBy(desc(inventoryMovements.createdAt)).limit(1);
    return result[0]?.balance || 0;
  }
  async updateInventoryMovement(id, movement) {
    const result = await db.update(inventoryMovements).set(movement).where(eq(inventoryMovements.id, id)).returning();
    return result[0];
  }
  async deleteInventoryMovement(id) {
    await db.delete(inventoryMovements).where(eq(inventoryMovements.id, id));
    return true;
  }
  async getSales() {
    return await db.select().from(sales).orderBy(desc(sales.createdAt));
  }
  async getSale(id) {
    const result = await db.select().from(sales).where(eq(sales.id, id));
    return result[0];
  }
  async createSale(sale) {
    const totalPrice = sale.pricePerUnit * sale.quantity;
    const result = await db.insert(sales).values({
      ...sale,
      totalPrice: totalPrice.toString()
    }).returning();
    const currentStock = await this.getCurrentStock();
    await db.insert(inventoryMovements).values({
      type: "sale",
      quantity: sale.quantity,
      balance: currentStock - sale.quantity,
      note: `Sale to ${sale.customerName || "Customer"}`
    });
    return result[0];
  }
  async updateSale(id, sale) {
    const updateData = { ...sale };
    if (sale.pricePerUnit !== void 0 && sale.quantity !== void 0) {
      updateData.totalPrice = (sale.pricePerUnit * sale.quantity).toString();
    }
    const result = await db.update(sales).set(updateData).where(eq(sales.id, id)).returning();
    return result[0];
  }
  async deleteSale(id) {
    await db.delete(sales).where(eq(sales.id, id));
    return true;
  }
  async getExpenseCategories() {
    return await db.select().from(expenseCategories).orderBy(expenseCategories.id);
  }
  async getExpenseCategory(id) {
    const result = await db.select().from(expenseCategories).where(eq(expenseCategories.id, id));
    return result[0];
  }
  async createExpenseCategory(category) {
    const result = await db.insert(expenseCategories).values(category).returning();
    return result[0];
  }
  async updateExpenseCategory(id, category) {
    const result = await db.update(expenseCategories).set(category).where(eq(expenseCategories.id, id)).returning();
    return result[0];
  }
  async deleteExpenseCategory(id) {
    await db.delete(expenseCategories).where(eq(expenseCategories.id, id));
    return true;
  }
  async getExpenses() {
    return await db.select().from(expenses).orderBy(desc(expenses.createdAt));
  }
  async getExpense(id) {
    const result = await db.select().from(expenses).where(eq(expenses.id, id));
    return result[0];
  }
  async createExpense(expense) {
    const result = await db.insert(expenses).values(expense).returning();
    return result[0];
  }
  async updateExpense(id, expense) {
    const result = await db.update(expenses).set(expense).where(eq(expenses.id, id)).returning();
    return result[0];
  }
  async deleteExpense(id) {
    await db.delete(expenses).where(eq(expenses.id, id));
    return true;
  }
  async getIngredients() {
    return await db.select().from(ingredients).orderBy(desc(ingredients.createdAt));
  }
  async getIngredient(id) {
    const result = await db.select().from(ingredients).where(eq(ingredients.id, id));
    return result[0];
  }
  async createIngredient(ingredient) {
    const result = await db.insert(ingredients).values(ingredient).returning();
    return result[0];
  }
  async updateIngredient(id, ingredient) {
    const result = await db.update(ingredients).set(ingredient).where(eq(ingredients.id, id)).returning();
    return result[0];
  }
  async deleteIngredient(id) {
    await db.delete(ingredients).where(eq(ingredients.id, id));
    return true;
  }
  async getSetting(key) {
    const result = await db.select().from(settings).where(eq(settings.key, key));
    return result[0]?.value;
  }
  async setSetting(key, value) {
    const existing = await this.getSetting(key);
    if (existing) {
      await db.update(settings).set({ value, updatedAt: /* @__PURE__ */ new Date() }).where(eq(settings.key, key));
    } else {
      await db.insert(settings).values({ key, value });
    }
  }
};
var storage = new DrizzleStorage();

// server/routes.ts
import { z as z2 } from "zod";

// server/predict/trends.ts
import fs from "fs/promises";
import path from "path";
function toLusakaDate(d) {
  return new Date(d.getTime() + 2 * 60 * 60 * 1e3);
}
function dateKey(d) {
  return d.toISOString().slice(0, 10);
}
async function ensurePredictionsDir() {
  const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "data", "predictions");
  await fs.mkdir(dir, { recursive: true });
  return dir;
}
function rangeDays(start, end) {
  const out = [];
  let cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur <= last) {
    out.push(dateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}
async function predictTrends(opts) {
  const start = opts.start ? new Date(opts.start) : new Date(Date.now() - 365 * 24 * 3600 * 1e3);
  const end = opts.end ? new Date(opts.end) : /* @__PURE__ */ new Date();
  const granularity = opts.granularity || "daily";
  const horizon = opts.horizon ?? 30;
  const minHistory = opts.minHistory ?? 90;
  const sales2 = await storage.getSales();
  const perDay = {};
  for (const s of sales2) {
    const dt = toLusakaDate(new Date(s.createdAt));
    const key = dateKey(dt);
    perDay[key] = (perDay[key] || 0) + Number(s.totalPrice || 0);
  }
  const days = rangeDays(start, end);
  const series = days.map((d) => ({ date: d, value: perDay[d] ?? 0 }));
  const nonEmptyDays = series.filter((x) => x.value > 0).length;
  let methodUsed = opts.method || "auto";
  let reason = "";
  if (nonEmptyDays < minHistory) {
    reason = `insufficient_history: only ${nonEmptyDays} non-empty days (<${minHistory})`;
    methodUsed = "fallback_moving_average";
  }
  for (let i = 0; i < series.length; i++) {
    if (series[i].value === 0) {
      let j = i + 1;
      while (j < series.length && series[j].value === 0 && j - i <= 2) j++;
      if (j < series.length && series[j].value !== 0 && j - i <= 2) {
        const prevVal = i - 1 >= 0 ? series[i - 1].value : series[j].value;
        const nextVal = series[j].value;
        const gap = j - i + 1;
        for (let k = i; k < j; k++) {
          const t = (k - (i - 1)) / gap;
          series[k].value = Math.round((prevVal * (1 - t) + nextVal * t) * 100) / 100;
        }
        i = j;
      }
    }
  }
  const values = series.map((s) => s.value).slice();
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)] ?? 0;
  const q3 = sorted[Math.floor(sorted.length * 0.75)] ?? 0;
  const iqr = q3 - q1;
  const outliers = [];
  for (const s of series) {
    if (s.value > q3 + 1.5 * iqr || s.value < q1 - 1.5 * iqr) outliers.push(s.date);
  }
  const lastN = series.slice(-Math.min(series.length, 90));
  const mean = lastN.reduce((a, b) => a + b.value, 0) / (lastN.length || 1);
  let preds = [];
  const dowSums = {};
  for (const s of series) {
    const d = /* @__PURE__ */ new Date(s.date + "T00:00:00Z");
    const dow = toLusakaDate(d).getDay();
    dowSums[dow] = dowSums[dow] || { sum: 0, count: 0 };
    dowSums[dow].sum += s.value;
    dowSums[dow].count++;
  }
  const dowAvg = {};
  for (let i = 0; i < 7; i++) dowAvg[i] = (dowSums[i]?.sum || 0) / (dowSums[i]?.count || 1);
  const dowValues = Object.values(dowAvg);
  const dowMean = dowValues.reduce((a, b) => a + b, 0) / 7 || 0;
  const seasonalityStrength = dowMean === 0 ? 0 : Math.max(...dowValues) / (dowMean || 1);
  if (methodUsed === "auto" && series.length >= 60 && seasonalityStrength > 1.1) {
    methodUsed = "holt-winters-weekly";
  }
  function holtWintersAdditive(values2, seasonLen = 7, alpha = 0.4, beta = 0.1, gamma = 0.2, nPred = 14) {
    const m = seasonLen;
    const n = values2.length;
    if (n < m * 2) return null;
    const seasonAverages = [];
    for (let i = 0; i < Math.floor(n / m); i++) {
      const slice = values2.slice(i * m, (i + 1) * m);
      seasonAverages.push(slice.reduce((a, b) => a + b, 0) / slice.length);
    }
    const initialTrend = seasonAverages.length >= 2 ? (seasonAverages[1] - seasonAverages[0]) / m : 0;
    const initialLevel = seasonAverages[0] || 0;
    const seasonals = new Array(m).fill(0);
    const seasons = Math.floor(n / m);
    for (let i = 0; i < m; i++) {
      let sum = 0;
      for (let j = 0; j < seasons; j++) {
        sum += values2[j * m + i] - seasonAverages[j];
      }
      seasonals[i] = sum / Math.max(1, seasons);
    }
    let level = initialLevel;
    let trend = initialTrend;
    const result = [];
    for (let i = 0; i < n; i++) {
      const val = values2[i];
      const seasonal = seasonals[i % m];
      const lastLevel = level;
      level = alpha * (val - seasonal) + (1 - alpha) * (level + trend);
      trend = beta * (level - lastLevel) + (1 - beta) * trend;
      seasonals[i % m] = gamma * (val - level) + (1 - gamma) * seasonal;
      result.push(level + trend + seasonals[i % m]);
    }
    const forecasts = [];
    for (let h = 1; h <= nPred; h++) {
      const idx = (n + h - 1) % m;
      forecasts.push(level + h * trend + seasonals[idx]);
    }
    return forecasts.map((f) => Math.max(0, Math.round(f * 100) / 100));
  }
  if (methodUsed === "holt-winters-weekly") {
    const values2 = series.map((s) => s.value);
    const hw = holtWintersAdditive(values2, 7, 0.4, 0.05, 0.2, horizon);
    if (hw && hw.length > 0) {
      const now = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      for (let h = 1; h <= hw.length; h++) {
        const d = new Date(now);
        d.setDate(d.getDate() + h);
        preds.push({ date: dateKey(d), pred: hw[h - 1] });
      }
      reason = reason || "holt-winters-weekly";
    } else {
      for (let h = 1; h <= horizon; h++) {
        const d = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        d.setDate(d.getDate() + h);
        preds.push({ date: dateKey(d), pred: Math.round(mean * 100) / 100 });
      }
      reason = reason || "moving-average-fallback";
    }
  } else {
    for (let h = 1; h <= horizon; h++) {
      const d = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      d.setDate(d.getDate() + h);
      preds.push({ date: dateKey(d), pred: Math.round(mean * 100) / 100 });
    }
    reason = reason || "moving-average-fallback";
  }
  const residuals = series.map((s, i) => s.value - (series[i] ? series[i].value : mean));
  const absResiduals = residuals.map((r) => Math.abs(r));
  const std = Math.sqrt(absResiduals.reduce((a, b) => a + b * b, 0) / (absResiduals.length || 1));
  const outPreds = preds.map((p) => {
    const lower95 = Math.max(0, Math.round((p.pred - 1.96 * std) * 100) / 100);
    const upper95 = Math.round((p.pred + 1.96 * std) * 100) / 100;
    return { date: p.date, pred: p.pred, lower95, upper95, model: methodUsed, reason };
  });
  const recommendations = {};
  const inc = opts.thresholds?.increase ?? 0.2;
  const dec = opts.thresholds?.decrease ?? -0.15;
  const baseline = mean || 1;
  for (const p of outPreds) {
    const change = (p.pred - baseline) / (baseline || 1);
    if (change >= inc) recommendations[p.date] = `predicted increase ${Math.round(change * 100)}% - recommend ramp-up (reorder)`;
    else if (change <= dec) recommendations[p.date] = `predicted decrease ${Math.round(change * 100)}% - recommend scale-down`;
    else recommendations[p.date] = "no action";
  }
  const dir = await ensurePredictionsDir();
  const filename = `trends_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
  const outPayload = {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    params: opts,
    series,
    predictions: outPreds.map((p) => ({ ...p, recommended_action: recommendations[p.date] })),
    outliers
  };
  await fs.writeFile(path.join(dir, filename), JSON.stringify(outPayload, null, 2), "utf8");
  if (opts.storeDb) {
    try {
      await storage.setSetting(`predictions:${filename}`, JSON.stringify(outPayload));
    } catch (e) {
    }
  }
  if (opts.notify) {
    await storage.setSetting(`predictions-notify:${filename}`, JSON.stringify({ notifiedAt: (/* @__PURE__ */ new Date()).toISOString(), note: "notify flag set (implementation: console/logging only)" }));
  }
  return outPayload;
}
var trends_default = predictTrends;

// server/routes.ts
var router = Router();
router.get("/api/inventory", async (req, res) => {
  try {
    const movements = await storage.getInventoryMovements();
    res.json(movements);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});
router.get("/api/inventory/stock", async (req, res) => {
  try {
    const currentStock = await storage.getCurrentStock();
    res.json({ stock: currentStock });
  } catch (error) {
    console.error("Error fetching current stock:", error);
    res.status(500).json({ error: "Failed to fetch current stock" });
  }
});
router.post("/api/inventory", async (req, res) => {
  try {
    const validatedData = insertInventoryMovementSchema.parse(req.body);
    const movement = await storage.createInventoryMovement(validatedData);
    res.status(201).json(movement);
  } catch (error) {
    if (error instanceof z2.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
    } else {
      console.error("Error creating inventory movement:", error);
      res.status(500).json({ error: "Failed to create inventory movement" });
    }
  }
});
router.put("/api/inventory/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertInventoryMovementSchema.partial().parse(req.body);
    const movement = await storage.updateInventoryMovement(id, validatedData);
    if (!movement) {
      return res.status(404).json({ error: "Inventory movement not found" });
    }
    res.json(movement);
  } catch (error) {
    if (error instanceof z2.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
    } else {
      console.error("Error updating inventory movement:", error);
      res.status(500).json({ error: "Failed to update inventory movement" });
    }
  }
});
router.delete("/api/inventory/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteInventoryMovement(id);
    if (!deleted) {
      return res.status(404).json({ error: "Inventory movement not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting inventory movement:", error);
    res.status(500).json({ error: "Failed to delete inventory movement" });
  }
});
router.get("/api/sales", async (req, res) => {
  try {
    const sales2 = await storage.getSales();
    res.json(sales2);
  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(500).json({ error: "Failed to fetch sales" });
  }
});
router.post("/api/sales", async (req, res) => {
  try {
    const body = { ...req.body };
    console.log("POST /api/sales body:", JSON.stringify(body));
    if (body.quantity !== void 0) body.quantity = Number(body.quantity);
    if (body.pricePerUnit !== void 0) body.pricePerUnit = Number(body.pricePerUnit);
    if (body.customerId === null) delete body.customerId;
    else if (body.customerId !== void 0) body.customerId = Number(body.customerId);
    const validatedData = insertSaleSchema.parse(body);
    const sale = await storage.createSale(validatedData);
    res.status(201).json(sale);
  } catch (error) {
    if (error instanceof z2.ZodError) {
      console.error("Sale validation error:", JSON.stringify(error.errors, null, 2));
      res.status(400).json({ error: "Validation failed", details: error.errors });
    } else {
      console.error("Error creating sale:", error);
      res.status(500).json({ error: "Failed to create sale" });
    }
  }
});
router.put("/api/sales/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = { ...req.body };
    if (body.quantity !== void 0) body.quantity = Number(body.quantity);
    if (body.pricePerUnit !== void 0) body.pricePerUnit = Number(body.pricePerUnit);
    if (body.customerId !== void 0) body.customerId = body.customerId === null ? null : Number(body.customerId);
    const validatedData = insertSaleSchema.partial().parse(body);
    const sale = await storage.updateSale(id, validatedData);
    if (!sale) {
      return res.status(404).json({ error: "Sale not found" });
    }
    res.json(sale);
  } catch (error) {
    if (error instanceof z2.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
    } else {
      console.error("Error updating sale:", error);
      res.status(500).json({ error: "Failed to update sale" });
    }
  }
});
router.delete("/api/sales/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteSale(id);
    if (!deleted) {
      return res.status(404).json({ error: "Sale not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting sale:", error);
    res.status(500).json({ error: "Failed to delete sale" });
  }
});
router.get("/api/customers", async (req, res) => {
  try {
    const customers2 = await storage.getCustomers();
    res.json(customers2);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});
router.post("/api/customers", async (req, res) => {
  try {
    const validatedData = insertCustomerSchema.parse(req.body);
    const customer = await storage.createCustomer(validatedData);
    res.status(201).json(customer);
  } catch (error) {
    if (error instanceof z2.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
    } else {
      console.error("Error creating customer:", error);
      res.status(500).json({ error: "Failed to create customer" });
    }
  }
});
router.put("/api/customers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertCustomerSchema.partial().parse(req.body);
    const customer = await storage.updateCustomer(id, validatedData);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(customer);
  } catch (error) {
    if (error instanceof z2.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
    } else {
      console.error("Error updating customer:", error);
      res.status(500).json({ error: "Failed to update customer" });
    }
  }
});
router.delete("/api/customers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteCustomer(id);
    if (!deleted) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ error: "Failed to delete customer" });
  }
});
router.get("/api/expense-categories", async (req, res) => {
  try {
    const categories = await storage.getExpenseCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching expense categories:", error);
    res.status(500).json({ error: "Failed to fetch expense categories" });
  }
});
router.post("/api/expense-categories", async (req, res) => {
  try {
    const validatedData = insertExpenseCategorySchema.parse(req.body);
    const category = await storage.createExpenseCategory(validatedData);
    res.status(201).json(category);
  } catch (error) {
    if (error instanceof z2.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
    } else {
      console.error("Error creating expense category:", error);
      res.status(500).json({ error: "Failed to create expense category" });
    }
  }
});
router.delete("/api/expense-categories/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteExpenseCategory(id);
    if (!deleted) {
      return res.status(404).json({ error: "Expense category not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting expense category:", error);
    res.status(500).json({ error: "Failed to delete expense category" });
  }
});
router.get("/api/expenses", async (req, res) => {
  try {
    const expenses2 = await storage.getExpenses();
    res.json(expenses2);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});
router.post("/api/expenses/units", async (req, res) => {
  try {
    const { categoryId, units, description, notes } = req.body;
    const u = Number(units || 0);
    const amount = Number((u * 2.34).toFixed(2));
    const payload = {
      categoryId: categoryId ?? null,
      amount,
      description: description || "Units expense",
      notes: notes ? String(notes) : `units:${u}`,
      status: "approved"
    };
    const validated = insertExpenseSchema.parse(payload);
    const expense = await storage.createExpense(validated);
    res.status(201).json(expense);
  } catch (e) {
    if (e instanceof z2.ZodError) {
      res.status(400).json({ error: "Validation failed", details: e.errors });
    } else {
      console.error("Error creating units expense", e);
      res.status(500).json({ error: "Failed to create expense" });
    }
  }
});
router.post("/api/expenses", async (req, res) => {
  try {
    const body = { ...req.body };
    try {
      if (body.units !== void 0 && (body.amount === void 0 || body.amount === null || body.amount === "")) {
        const units = Number(body.units) || 0;
        body.amount = Number((units * 2.34).toFixed(2));
        body.notes = (body.notes ? body.notes + " " : "") + `units:${units}`;
      } else {
        try {
          const categories = await storage.getExpenseCategories();
          const cat = categories.find((c) => c.id === body.categoryId);
          if (cat && typeof cat.name === "string" && cat.name.toLowerCase() === "electricity units" && body.units !== void 0) {
            const units = Number(body.units) || 0;
            body.amount = Number((units * 2.34).toFixed(2));
            body.notes = (body.notes ? body.notes + " " : "") + `units:${units}`;
          }
        } catch (e) {
        }
      }
    } catch (e) {
    }
    console.log("Creating expense, body before validation:", JSON.stringify(body));
    let validatedData;
    try {
      validatedData = insertExpenseSchema.parse(body);
    } catch (err) {
      if (err instanceof z2.ZodError) {
        const hasAmountIssue = err.errors.some((e) => e.path?.[0] === "amount");
        if (hasAmountIssue && body.units !== void 0) {
          try {
            const units = Number(body.units) || 0;
            body.amount = Number((units * 2.34).toFixed(2));
            body.notes = (body.notes ? body.notes + " " : "") + `units:${units}`;
            validatedData = insertExpenseSchema.parse(body);
          } catch (e2) {
          }
        }
      }
      if (!validatedData) throw err;
    }
    const expense = await storage.createExpense(validatedData);
    res.status(201).json(expense);
  } catch (error) {
    if (error instanceof z2.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
    } else {
      console.error("Error creating expense:", error);
      res.status(500).json({ error: "Failed to create expense" });
    }
  }
});
router.put("/api/expenses/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertExpenseSchema.partial().parse(req.body);
    const expense = await storage.updateExpense(id, validatedData);
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json(expense);
  } catch (error) {
    if (error instanceof z2.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
    } else {
      console.error("Error updating expense:", error);
      res.status(500).json({ error: "Failed to update expense" });
    }
  }
});
router.delete("/api/expenses/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteExpense(id);
    if (!deleted) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});
router.get("/api/ingredients", async (req, res) => {
  try {
    const ingredients2 = await storage.getIngredients();
    res.json(ingredients2);
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    res.status(500).json({ error: "Failed to fetch ingredients" });
  }
});
router.post("/api/ingredients", async (req, res) => {
  try {
    const validatedData = insertIngredientSchema.parse(req.body);
    const ingredient = await storage.createIngredient(validatedData);
    res.status(201).json(ingredient);
  } catch (error) {
    if (error instanceof z2.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
    } else {
      console.error("Error creating ingredient:", error);
      res.status(500).json({ error: "Failed to create ingredient" });
    }
  }
});
router.put("/api/ingredients/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertIngredientSchema.partial().parse(req.body);
    const ingredient = await storage.updateIngredient(id, validatedData);
    if (!ingredient) {
      return res.status(404).json({ error: "Ingredient not found" });
    }
    res.json(ingredient);
  } catch (error) {
    if (error instanceof z2.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
    } else {
      console.error("Error updating ingredient:", error);
      res.status(500).json({ error: "Failed to update ingredient" });
    }
  }
});
router.delete("/api/ingredients/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteIngredient(id);
    if (!deleted) {
      return res.status(404).json({ error: "Ingredient not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    res.status(500).json({ error: "Failed to delete ingredient" });
  }
});
router.get("/api/analytics/dashboard", async (req, res) => {
  try {
    const [sales2, expenses2, currentStock, customers2] = await Promise.all([
      storage.getSales(),
      storage.getExpenses(),
      storage.getCurrentStock(),
      storage.getCustomers()
    ]);
    const totalSales = sales2.reduce((sum, sale) => sum + Number(sale.totalPrice), 0);
    const totalExpenses = expenses2.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const netProfit = totalSales - totalExpenses;
    const currentMonth = (/* @__PURE__ */ new Date()).getMonth();
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    const monthlySales = sales2.filter((sale) => {
      const saleDate = new Date(sale.createdAt);
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    });
    const monthlyExpenses = expenses2.filter((expense) => {
      const expenseDate = new Date(expense.createdAt);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    const monthlyTotalSales = monthlySales.reduce((sum, sale) => sum + Number(sale.totalPrice), 0);
    const monthlyTotalExpenses = monthlyExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const stats = {
      totalSales,
      totalExpenses,
      netProfit,
      currentStock,
      totalCustomers: customers2.length,
      // aliases expected by client
      stockRemaining: currentStock,
      avgOrderValue: sales2.length > 0 ? totalSales / sales2.length : 0,
      monthlySales: monthlyTotalSales,
      monthlyExpenses: monthlyTotalExpenses,
      monthlyProfit: monthlyTotalSales - monthlyTotalExpenses,
      totalQuantitySold: sales2.reduce((sum, sale) => sum + sale.quantity, 0),
      averageOrderValue: sales2.length > 0 ? totalSales / sales2.length : 0
    };
    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    res.status(500).json({ error: "Failed to fetch dashboard analytics" });
  }
});
router.get("/api/analytics/recent-activity", async (req, res) => {
  try {
    const [sales2, inventoryMovements2, expenses2] = await Promise.all([
      storage.getSales(),
      storage.getInventoryMovements(),
      storage.getExpenses()
    ]);
    const activities = [
      ...sales2.slice(0, 5).map((sale) => ({
        id: `sale-${sale.id}`,
        type: "sale",
        description: `Sale to ${sale.customerName || "Customer"}`,
        amount: `ZMW ${Number(sale.totalPrice).toLocaleString()}`,
        quantity: `${sale.quantity} pcs`,
        time: sale.createdAt,
        status: sale.status
      })),
      ...inventoryMovements2.slice(0, 5).filter((m) => m.type === "addition").map((movement) => ({
        id: `production-${movement.id}`,
        type: "production",
        description: movement.note || "Stock addition",
        amount: "",
        quantity: `${movement.quantity} pcs`,
        time: movement.createdAt,
        status: "completed"
      })),
      ...expenses2.slice(0, 3).map((expense) => ({
        id: `expense-${expense.id}`,
        type: "expense",
        description: expense.description,
        amount: `ZMW ${Number(expense.amount).toLocaleString()}`,
        quantity: "",
        time: expense.createdAt,
        status: expense.status
      }))
    ];
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    res.json(activities.slice(0, 10));
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({ error: "Failed to fetch recent activity" });
  }
});
router.get("/api/analytics/top-customers", async (req, res) => {
  try {
    const sales2 = await storage.getSales();
    const customers2 = await storage.getCustomers();
    const agg = {};
    for (const s of sales2) {
      const cid = s.customerId ?? 0;
      if (!agg[cid]) agg[cid] = { id: cid, name: s.customerName || customers2.find((c) => c.id === cid)?.name || "Walk-in", purchases: 0, total: 0 };
      agg[cid].purchases += 1;
      agg[cid].total += Number(s.totalPrice || 0);
    }
    const arr = Object.values(agg).sort((a, b) => b.total - a.total).slice(0, 5);
    res.json(arr);
  } catch (e) {
    console.error("Error computing top customers", e);
    res.status(500).json({ error: "Failed to compute top customers" });
  }
});
var routes_default = router;
router.get("/api/analytics/sales-over-time", async (req, res) => {
  try {
    const sales2 = await storage.getSales();
    const now = /* @__PURE__ */ new Date();
    const days = 30;
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateKey2 = d.toISOString().slice(0, 10);
      const daySales = sales2.filter((s) => new Date(s.createdAt).toISOString().slice(0, 10) === dateKey2);
      const total = daySales.reduce((sum, s) => sum + Number(s.totalPrice), 0);
      out.push({ date: dateKey2, total, count: daySales.length });
    }
    res.json(out);
  } catch (e) {
    console.error("Error sales-over-time", e);
    res.status(500).json({ error: "Failed to compute sales over time" });
  }
});
router.get("/api/analytics/production-over-time", async (req, res) => {
  try {
    const movements = await storage.getInventoryMovements();
    const now = /* @__PURE__ */ new Date();
    const days = 30;
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateKey2 = d.toISOString().slice(0, 10);
      const dayMovements = movements.filter((m) => new Date(m.createdAt).toISOString().slice(0, 10) === dateKey2);
      const produced = dayMovements.filter((m) => m.type === "addition").reduce((s, m) => s + m.quantity, 0);
      const sold = dayMovements.filter((m) => m.type === "sale").reduce((s, m) => s + m.quantity, 0);
      out.push({ date: dateKey2, produced, sold });
    }
    res.json(out);
  } catch (e) {
    console.error("Error production-over-time", e);
    res.status(500).json({ error: "Failed to compute production over time" });
  }
});
router.get("/api/analytics/aggregates", async (req, res) => {
  try {
    const [sales2, expenses2] = await Promise.all([storage.getSales(), storage.getExpenses()]);
    const now = /* @__PURE__ */ new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daySales = sales2.filter((s) => new Date(s.createdAt) >= startOfDay);
    const weekSales = sales2.filter((s) => new Date(s.createdAt) >= startOfWeek);
    const monthSales = sales2.filter((s) => new Date(s.createdAt) >= startOfMonth);
    const dayExpenses = expenses2.filter((e) => new Date(e.createdAt) >= startOfDay);
    const weekExpenses = expenses2.filter((e) => new Date(e.createdAt) >= startOfWeek);
    const monthExpenses = expenses2.filter((e) => new Date(e.createdAt) >= startOfMonth);
    const sum = (arr, key) => arr.reduce((s, x) => s + Number(x[key] || 0), 0);
    res.json({
      dailyProfit: sum(daySales, "totalPrice") - sum(dayExpenses, "amount"),
      weeklyProfit: sum(weekSales, "totalPrice") - sum(weekExpenses, "amount"),
      monthlyProfit: sum(monthSales, "totalPrice") - sum(monthExpenses, "amount"),
      lastSaleTime: sales2.length ? sales2[0].createdAt : null,
      lastExpenseTime: expenses2.length ? expenses2[0].createdAt : null
    });
  } catch (e) {
    console.error("Error aggregates", e);
    res.status(500).json({ error: "Failed to compute aggregates" });
  }
});
router.post("/api/v1/predict/trends", async (req, res) => {
  try {
    const payload = req.body || {};
    const result = await trends_default(payload);
    res.status(200).json(result.predictions || result);
  } catch (e) {
    console.error("Error running predict/trends", e);
    res.status(500).json({ error: "Failed to run predictions" });
  }
});

// server/auth.ts
import { Router as Router2 } from "express";
var router2 = Router2();
var DEFAULT_PIN = "4207";
router2.post("/api/auth/verify-pin", async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ error: "PIN is required" });
    }
    let storedPin = await storage.getSetting("app_pin");
    if (!storedPin) {
      await storage.setSetting("app_pin", DEFAULT_PIN);
      storedPin = DEFAULT_PIN;
    }
    if (pin === storedPin) {
      return res.json({ success: true });
    }
    return res.status(401).json({ error: "Invalid PIN" });
  } catch (error) {
    console.error("PIN verification error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
router2.post("/api/auth/change-pin", async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    if (!currentPin || !newPin) {
      return res.status(400).json({ error: "Current PIN and new PIN are required" });
    }
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      return res.status(400).json({ error: "PIN must be 4 digits" });
    }
    let storedPin = await storage.getSetting("app_pin");
    if (!storedPin) {
      await storage.setSetting("app_pin", DEFAULT_PIN);
      storedPin = DEFAULT_PIN;
    }
    if (currentPin !== storedPin) {
      return res.status(401).json({ error: "Current PIN is incorrect" });
    }
    await storage.setSetting("app_pin", newPin);
    return res.json({ success: true });
  } catch (error) {
    console.error("PIN change error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
var auth_default = router2;

// server/emailExport.ts
import { Router as Router3 } from "express";
import nodemailer from "nodemailer";
var router3 = Router3();
router3.post("/api/export/email", async (req, res) => {
  try {
    const { pdfBase64, filename } = req.body;
    if (!pdfBase64 || !filename) {
      console.error("Missing PDF or filename", { pdfBase64Length: pdfBase64?.length, filename });
      return res.status(400).json({ error: "Missing PDF or filename" });
    }
    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    console.log(`Received PDF for email export: filename=${filename}, size=${pdfBuffer.length} bytes`);
    if (pdfBuffer.length < 1e3) {
      console.error("PDF buffer too small, likely invalid PDF", { size: pdfBuffer.length });
      return res.status(400).json({ error: "PDF data too small or invalid" });
    }
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "bntalasha@gmail.com",
        pass: "rewu owtj xbkt qyay"
      }
    });
    try {
      await transporter.sendMail({
        from: "no-reply@crackerbase.com",
        to: "bntalasha@gmail.com",
        subject: "Crackerbase Report PDF",
        text: "Attached is your exported PDF report.",
        attachments: [
          {
            filename,
            content: pdfBuffer,
            contentType: "application/pdf"
          }
        ]
      });
      console.log("Email sent successfully");
      res.json({ success: true });
    } catch (emailErr) {
      console.error("Nodemailer sendMail error:", emailErr);
      res.status(500).json({ error: "Failed to send email", details: emailErr?.toString() });
    }
  } catch (error) {
    console.error("Email export failed:", error);
    res.status(500).json({ error: "Failed to send email", details: error?.toString() });
  }
});
var emailExport_default = router3;

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    // Put the client build at /dist so Netlify can serve index.html from the project root
    outDir: path2.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith("/api")) return next();
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  console.log(`REQ ${req.method} ${req.path} (content-type: ${req.headers["content-type"] || ""})`);
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  app.use(auth_default);
  app.use(routes_default);
  app.use(emailExport_default);
  const server = (await import("http")).createServer(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
