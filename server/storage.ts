import fs from 'fs';
import path from 'path';
import { dbQuery, dbEnabled } from './supabase';
import {
  InsertCustomer,
  InsertInventoryMovement,
  InsertSale,
  InsertExpenseCategory,
  InsertExpense,
  InsertIngredient,
} from './schema';

// Minimal IStorage interface used by the server. Methods return broad types to keep the
// implementation simple while TypeScript types originate from `server/schema.ts`.
export interface IStorage {
  // Customers
  getCustomers(): Promise<any[]>;
  getCustomer(id: number): Promise<any | undefined>;
  createCustomer(customer: InsertCustomer): Promise<any>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<any | undefined>;
  deleteCustomer(id: number): Promise<boolean>;

  // Inventory
  getInventoryMovements(): Promise<any[]>;
  getInventoryMovement(id: number): Promise<any | undefined>;
  createInventoryMovement(movement: InsertInventoryMovement): Promise<any>;
  getCurrentStock(): Promise<number>;
  updateInventoryMovement(id: number, movement: Partial<InsertInventoryMovement>): Promise<any | undefined>;
  deleteInventoryMovement(id: number): Promise<boolean>;

  // Sales
  getSales(): Promise<any[]>;
  getSale(id: number): Promise<any | undefined>;
  createSale(sale: InsertSale): Promise<any>;
  updateSale(id: number, sale: Partial<InsertSale>): Promise<any | undefined>;
  deleteSale(id: number): Promise<boolean>;

  // Expense categories & expenses
  getExpenseCategories(): Promise<any[]>;
  getExpenseCategory(id: number): Promise<any | undefined>;
  createExpenseCategory(category: InsertExpenseCategory): Promise<any>;
  updateExpenseCategory(id: number, category: Partial<InsertExpenseCategory>): Promise<any | undefined>;
  deleteExpenseCategory(id: number): Promise<boolean>;

  getExpenses(): Promise<any[]>;
  getExpense(id: number): Promise<any | undefined>;
  createExpense(expense: InsertExpense): Promise<any>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<any | undefined>;
  deleteExpense(id: number): Promise<boolean>;

  // Ingredients
  getIngredients(): Promise<any[]>;
  getIngredient(id: number): Promise<any | undefined>;
  createIngredient(ingredient: InsertIngredient): Promise<any>;
  updateIngredient(id: number, ingredient: Partial<InsertIngredient>): Promise<any | undefined>;
  deleteIngredient(id: number): Promise<boolean>;

  // Settings
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<void>;
}

// Simple in-memory fallback storage used when no database is configured.
class MemStorage implements IStorage {
  private filePath = path.resolve(process.cwd(), 'data', 'storage.json');
  private data: any = null;

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8') || '{}';
        this.data = JSON.parse(raw);
      } else {
        this.data = { customers: [], sales: [], expenses: [], inventoryMovements: [], ingredients: [], expenseCategories: [], settings: {} };
      }
    } catch (e) {
      this.data = { customers: [], sales: [], expenses: [], inventoryMovements: [], ingredients: [], expenseCategories: [], settings: {} };
    }
  }

  private save() {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      // ignore save errors for fallback storage
    }
  }

  // Customers
  async getCustomers() { return this.data.customers || []; }
  async getCustomer(id: number) { return (this.data.customers || []).find((c: any) => c.id === id); }
  async createCustomer(customer: InsertCustomer) { const id = Date.now(); const rec = { id, ...customer, createdAt: new Date().toISOString() }; (this.data.customers ||= []).unshift(rec); this.save(); return rec; }
  async updateCustomer(id: number, customer: Partial<InsertCustomer>) { const idx = (this.data.customers || []).findIndex((c: any) => c.id === id); if (idx === -1) return undefined; this.data.customers[idx] = { ...this.data.customers[idx], ...customer }; this.save(); return this.data.customers[idx]; }
  async deleteCustomer(id: number) { this.data.customers = (this.data.customers || []).filter((c: any) => c.id !== id); this.save(); return true; }

  // Inventory
  async getInventoryMovements() { return this.data.inventoryMovements || []; }
  async getInventoryMovement(id: number) { return (this.data.inventoryMovements || []).find((m: any) => m.id === id); }
  async createInventoryMovement(movement: InsertInventoryMovement) { const id = Date.now(); const rec = { id, ...movement, createdAt: new Date().toISOString() }; (this.data.inventoryMovements ||= []).unshift(rec); this.save(); return rec; }
  async getCurrentStock() { const last = (this.data.inventoryMovements || [])[0]; return last ? Number(last.balance || 0) : 0; }
  async updateInventoryMovement(id: number, movement: Partial<InsertInventoryMovement>) { const idx = (this.data.inventoryMovements || []).findIndex((m: any) => m.id === id); if (idx === -1) return undefined; this.data.inventoryMovements[idx] = { ...this.data.inventoryMovements[idx], ...movement }; this.save(); return this.data.inventoryMovements[idx]; }
  async deleteInventoryMovement(id: number) { this.data.inventoryMovements = (this.data.inventoryMovements || []).filter((m: any) => m.id !== id); this.save(); return true; }

  // Sales
  async getSales() { return this.data.sales || []; }
  async getSale(id: number) { return (this.data.sales || []).find((s: any) => s.id === id); }
  async createSale(sale: InsertSale) { const id = Date.now(); const rec = { id, ...sale, createdAt: new Date().toISOString() }; (this.data.sales ||= []).unshift(rec); // create movement
    try { (this.data.inventoryMovements ||= []).unshift({ id: Date.now()+1, type: 'sale', quantity: sale.quantity, balance: null, note: `Sale to ${sale.customerId ?? 'Customer'}`, createdAt: new Date().toISOString() }); } catch(e){}
    this.save(); return rec; }
  async updateSale(id: number, sale: Partial<InsertSale>) { const idx = (this.data.sales || []).findIndex((s: any) => s.id === id); if (idx === -1) return undefined; this.data.sales[idx] = { ...this.data.sales[idx], ...sale }; this.save(); return this.data.sales[idx]; }
  async deleteSale(id: number) { this.data.sales = (this.data.sales || []).filter((s: any) => s.id !== id); this.save(); return true; }

  // Expense categories
  async getExpenseCategories() { return this.data.expenseCategories || []; }
  async getExpenseCategory(id: number) { return (this.data.expenseCategories || []).find((c: any) => c.id === id); }
  async createExpenseCategory(category: InsertExpenseCategory) { const id = Date.now(); const rec = { id, ...category, createdAt: new Date().toISOString() }; (this.data.expenseCategories ||= []).push(rec); this.save(); return rec; }
  async updateExpenseCategory(id: number, category: Partial<InsertExpenseCategory>) { const idx = (this.data.expenseCategories || []).findIndex((c: any) => c.id === id); if (idx === -1) return undefined; this.data.expenseCategories[idx] = { ...this.data.expenseCategories[idx], ...category }; this.save(); return this.data.expenseCategories[idx]; }
  async deleteExpenseCategory(id: number) { this.data.expenseCategories = (this.data.expenseCategories || []).filter((c: any) => c.id !== id); this.save(); return true; }

  // Expenses
  async getExpenses() { return this.data.expenses || []; }
  async getExpense(id: number) { return (this.data.expenses || []).find((e: any) => e.id === id); }
  async createExpense(expense: InsertExpense) { const id = Date.now(); const rec = { id, ...expense, createdAt: new Date().toISOString() }; (this.data.expenses ||= []).unshift(rec); this.save(); return rec; }
  async updateExpense(id: number, expense: Partial<InsertExpense>) { const idx = (this.data.expenses || []).findIndex((e: any) => e.id === id); if (idx === -1) return undefined; this.data.expenses[idx] = { ...this.data.expenses[idx], ...expense }; this.save(); return this.data.expenses[idx]; }
  async deleteExpense(id: number) { this.data.expenses = (this.data.expenses || []).filter((e: any) => e.id !== id); this.save(); return true; }

  // Ingredients
  async getIngredients() { return this.data.ingredients || []; }
  async getIngredient(id: number) { return (this.data.ingredients || []).find((i: any) => i.id === id); }
  async createIngredient(ingredient: InsertIngredient) { const id = Date.now(); const rec = { id, ...ingredient, createdAt: new Date().toISOString() }; (this.data.ingredients ||= []).unshift(rec); this.save(); return rec; }
  async updateIngredient(id: number, ingredient: Partial<InsertIngredient>) { const idx = (this.data.ingredients || []).findIndex((i: any) => i.id === id); if (idx === -1) return undefined; this.data.ingredients[idx] = { ...this.data.ingredients[idx], ...ingredient }; this.save(); return this.data.ingredients[idx]; }
  async deleteIngredient(id: number) { this.data.ingredients = (this.data.ingredients || []).filter((i: any) => i.id !== id); this.save(); return true; }

  // Settings
  async getSetting(key: string) { const s = this.data.settings || {}; return s[key]; }
  async setSetting(key: string, value: string) { (this.data.settings ||= {})[key] = value; this.save(); }
}

// Postgres-backed storage implementation using dbQuery (Neon)
export class PostgresStorage implements IStorage {
  // Customers
  async getCustomers(): Promise<any[]> {
    const rows = await dbQuery('SELECT * FROM public.customers ORDER BY created_at DESC', []);
    return rows || [];
  }

  async getCustomer(id: number) {
    const rows = await dbQuery('SELECT * FROM public.customers WHERE id = $1 LIMIT 1', [id]);
    return (rows && rows[0]) ? rows[0] : undefined;
  }

  async createCustomer(customer: InsertCustomer) {
    const payload = [customer.name, customer.phone ?? null, customer.businessName ?? null, customer.location ?? null, new Date().toISOString()];
    const rows = await dbQuery('INSERT INTO public.customers (name, phone, business_name, location, created_at) VALUES ($1,$2,$3,$4,$5) RETURNING *', payload);
    return (rows && rows[0]) ? rows[0] : rows;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>) {
    const mapped: any = {};
    if ((customer as any).name !== undefined) mapped.name = (customer as any).name;
    if ((customer as any).phone !== undefined) mapped.phone = (customer as any).phone;
    if ((customer as any).businessName !== undefined) mapped.business_name = (customer as any).businessName;
    if ((customer as any).location !== undefined) mapped.location = (customer as any).location;
    const setParts: string[] = [];
    const params: any[] = [];
    let idx = 1;
    for (const k of Object.keys(mapped)) {
      setParts.push(`${k} = $${idx}`);
      params.push((mapped as any)[k]);
      idx++;
    }
    if (setParts.length === 0) return this.getCustomer(id);
    params.push(id);
    const q = `UPDATE public.customers SET ${setParts.join(', ')} WHERE id = $${idx} RETURNING *`;
    const rows = await dbQuery(q, params);
    return (rows && rows[0]) ? rows[0] : undefined;
  }

  async deleteCustomer(id: number) {
    await dbQuery('DELETE FROM public.customers WHERE id = $1', [id]);
    return true;
  }

  // Inventory
  async getInventoryMovements() {
    const rows = await dbQuery('SELECT * FROM public.inventory_movements ORDER BY created_at DESC', []);
    return rows || [];
  }

  async getInventoryMovement(id: number) {
    const rows = await dbQuery('SELECT * FROM public.inventory_movements WHERE id = $1 LIMIT 1', [id]);
    return (rows && rows[0]) ? rows[0] : undefined;
  }

  async createInventoryMovement(movement: InsertInventoryMovement) {
  // movement may not include balance in the InsertInventoryMovement type; coerce safely
  const params = [movement.type, movement.quantity, (movement as any).balance ?? null, movement.note ?? null, new Date().toISOString()];
    const rows = await dbQuery('INSERT INTO public.inventory_movements (type, quantity, balance, note, created_at) VALUES ($1,$2,$3,$4,$5) RETURNING *', params);
    return (rows && rows[0]) ? rows[0] : rows;
  }

  async getCurrentStock() {
    const rows = await dbQuery('SELECT balance FROM public.inventory_movements ORDER BY created_at DESC LIMIT 1', []);
    return (rows && rows[0] && Number(rows[0].balance)) || 0;
  }

  async updateInventoryMovement(id: number, movement: Partial<InsertInventoryMovement>) {
    const mapped: any = {};
    if ((movement as any).type !== undefined) mapped.type = (movement as any).type;
    if ((movement as any).quantity !== undefined) mapped.quantity = (movement as any).quantity;
    if ((movement as any).balance !== undefined) mapped.balance = (movement as any).balance;
    if ((movement as any).note !== undefined) mapped.note = (movement as any).note;
    const setParts: string[] = [];
    const params: any[] = [];
    let idx = 1;
    for (const k of Object.keys(mapped)) {
      setParts.push(`${k} = $${idx}`);
      params.push((mapped as any)[k]);
      idx++;
    }
    if (setParts.length === 0) return this.getInventoryMovement(id);
    params.push(id);
    const q = `UPDATE public.inventory_movements SET ${setParts.join(', ')} WHERE id = $${idx} RETURNING *`;
    const rows = await dbQuery(q, params);
    return (rows && rows[0]) ? rows[0] : undefined;
  }

  async deleteInventoryMovement(id: number) {
    await dbQuery('DELETE FROM public.inventory_movements WHERE id = $1', [id]);
    return true;
  }

  // Sales
  async getSales() {
    const rows = await dbQuery('SELECT * FROM public.sales ORDER BY created_at DESC', []);
    return rows || [];
  }

  async getSale(id: number) {
    const rows = await dbQuery('SELECT * FROM public.sales WHERE id = $1 LIMIT 1', [id]);
    return (rows && rows[0]) ? rows[0] : undefined;
  }

  async createSale(sale: InsertSale) {
  const params = [sale.customerId ?? null, sale.customerName ?? null, sale.quantity, (sale as any).pricePerUnit, (sale as any).totalPrice ?? (sale.quantity * (sale as any).pricePerUnit), sale.status ?? 'completed', new Date().toISOString()];
    const rows = await dbQuery('INSERT INTO public.sales (customer_id, customer_name, quantity, price_per_unit, total_price, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', params);
    // attempt to update inventory movements; ignore errors
    try {
      await dbQuery('INSERT INTO public.inventory_movements (type, quantity, balance, note, created_at) VALUES ($1,$2,$3,$4,$5)', ['sale', sale.quantity, null, `Sale to ${sale.customerId ?? 'Customer'}`, new Date().toISOString()]);
    } catch (e) {}
    return (rows && rows[0]) ? rows[0] : rows;
  }

  async updateSale(id: number, sale: Partial<InsertSale>) {
    const mapped: any = {};
    if ((sale as any).quantity !== undefined) mapped.quantity = (sale as any).quantity;
    if ((sale as any).pricePerUnit !== undefined) mapped.price_per_unit = (sale as any).pricePerUnit;
    if ((sale as any).totalPrice !== undefined) mapped.total_price = (sale as any).totalPrice;
    if ((sale as any).status !== undefined) mapped.status = (sale as any).status;
    const setParts: string[] = [];
    const params: any[] = [];
    let idx = 1;
    for (const k of Object.keys(mapped)) {
      setParts.push(`${k} = $${idx}`);
      params.push((mapped as any)[k]);
      idx++;
    }
    if (setParts.length === 0) return this.getSale(id);
    params.push(id);
    const q = `UPDATE public.sales SET ${setParts.join(', ')} WHERE id = $${idx} RETURNING *`;
    const rows = await dbQuery(q, params);
    return (rows && rows[0]) ? rows[0] : undefined;
  }

  async deleteSale(id: number) {
    await dbQuery('DELETE FROM public.sales WHERE id = $1', [id]);
    return true;
  }

  // Expense categories
  async getExpenseCategories() { const rows = await dbQuery('SELECT * FROM public.expense_categories ORDER BY id', []); return rows || []; }
  async getExpenseCategory(id: number) { const rows = await dbQuery('SELECT * FROM public.expense_categories WHERE id = $1 LIMIT 1', [id]); return (rows && rows[0]) ? rows[0] : undefined; }
  async createExpenseCategory(category: InsertExpenseCategory) { const rows = await dbQuery('INSERT INTO public.expense_categories (name, color, created_at) VALUES ($1,$2,$3) RETURNING *', [category.name, category.color ?? null, new Date().toISOString()]); return (rows && rows[0]) ? rows[0] : rows; }
  async updateExpenseCategory(id: number, category: Partial<InsertExpenseCategory>) { const mapped: any = {}; if ((category as any).name !== undefined) mapped.name = (category as any).name; if ((category as any).color !== undefined) mapped.color = (category as any).color; const setParts: string[] = []; const params: any[] = []; let idx = 1; for (const k of Object.keys(mapped)) { setParts.push(`${k} = $${idx}`); params.push((mapped as any)[k]); idx++; } if (setParts.length === 0) return this.getExpenseCategory(id); params.push(id); const q = `UPDATE public.expense_categories SET ${setParts.join(', ')} WHERE id = $${idx} RETURNING *`; const rows = await dbQuery(q, params); return (rows && rows[0]) ? rows[0] : undefined; }
  async deleteExpenseCategory(id: number) { await dbQuery('DELETE FROM public.expense_categories WHERE id = $1', [id]); return true; }

  // Expenses
  async getExpenses() { const rows = await dbQuery('SELECT * FROM public.expenses ORDER BY created_at DESC', []); return rows || []; }
  async getExpense(id: number) { const rows = await dbQuery('SELECT * FROM public.expenses WHERE id = $1 LIMIT 1', [id]); return (rows && rows[0]) ? rows[0] : undefined; }
  async createExpense(expense: InsertExpense) { const rows = await dbQuery('INSERT INTO public.expenses (category_id, amount, description, notes, status, created_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [expense.categoryId ?? (expense as any).category_id ?? null, typeof expense.amount === 'number' ? expense.amount : Number(expense.amount), expense.description, expense.notes ?? null, expense.status ?? 'approved', new Date().toISOString()]); return (rows && rows[0]) ? rows[0] : rows; }
  async updateExpense(id: number, expense: Partial<InsertExpense>) { const mapped: any = {}; if ((expense as any).categoryId !== undefined) mapped.category_id = (expense as any).categoryId; if ((expense as any).description !== undefined) mapped.description = (expense as any).description; if ((expense as any).notes !== undefined) mapped.notes = (expense as any).notes; if ((expense as any).status !== undefined) mapped.status = (expense as any).status; if ((expense as any).amount !== undefined) mapped.amount = typeof (expense as any).amount === 'number' ? (expense as any).amount : Number((expense as any).amount); const setParts: string[] = []; const params: any[] = []; let idx = 1; for (const k of Object.keys(mapped)) { setParts.push(`${k} = $${idx}`); params.push((mapped as any)[k]); idx++; } if (setParts.length === 0) return this.getExpense(id); params.push(id); const q = `UPDATE public.expenses SET ${setParts.join(', ')} WHERE id = $${idx} RETURNING *`; const rows = await dbQuery(q, params); return (rows && rows[0]) ? rows[0] : undefined; }
  async deleteExpense(id: number) { await dbQuery('DELETE FROM public.expenses WHERE id = $1', [id]); return true; }

  // Ingredients
  async getIngredients() { const rows = await dbQuery('SELECT * FROM public.ingredients ORDER BY created_at DESC', []); return rows || []; }
  async getIngredient(id: number) { const rows = await dbQuery('SELECT * FROM public.ingredients WHERE id = $1 LIMIT 1', [id]); return (rows && rows[0]) ? rows[0] : undefined; }
  async createIngredient(ingredient: InsertIngredient) { const rows = await dbQuery('INSERT INTO public.ingredients (name, multiplier, unit, created_at) VALUES ($1,$2,$3,$4) RETURNING *', [ingredient.name, typeof ingredient.multiplier === 'number' ? ingredient.multiplier : Number(ingredient.multiplier), ingredient.unit ?? 'g', new Date().toISOString()]); return (rows && rows[0]) ? rows[0] : rows; }
  async updateIngredient(id: number, ingredient: Partial<InsertIngredient>) { const mapped: any = {}; if ((ingredient as any).name !== undefined) mapped.name = (ingredient as any).name; if ((ingredient as any).unit !== undefined) mapped.unit = (ingredient as any).unit; if ((ingredient as any).multiplier !== undefined) mapped.multiplier = typeof (ingredient as any).multiplier === 'number' ? (ingredient as any).multiplier : Number((ingredient as any).multiplier); const setParts: string[] = []; const params: any[] = []; let idx = 1; for (const k of Object.keys(mapped)) { setParts.push(`${k} = $${idx}`); params.push((mapped as any)[k]); idx++; } if (setParts.length === 0) return this.getIngredient(id); params.push(id); const q = `UPDATE public.ingredients SET ${setParts.join(', ')} WHERE id = $${idx} RETURNING *`; const rows = await dbQuery(q, params); return (rows && rows[0]) ? rows[0] : undefined; }
  async deleteIngredient(id: number) { await dbQuery('DELETE FROM public.ingredients WHERE id = $1', [id]); return true; }

  // Settings
  async getSetting(key: string) { const rows = await dbQuery('SELECT value FROM public.settings WHERE key = $1 LIMIT 1', [key]); return (rows && rows[0] && rows[0].value) || undefined; }
  async setSetting(key: string, value: string) { await dbQuery('INSERT INTO public.settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [key, value]); return; }
}

// Choose implementation at runtime based on environment variable instead of relying on
// an imported `dbEnabled` symbol which may be elided by bundlers. This keeps the
// built `dist-server` self-contained and avoids ReferenceError when importing.
const _conn = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || '';
export const storage: IStorage = _conn ? new PostgresStorage() : new MemStorage();