// new file: lib/crackersBackend.ts

import { Alert } from "react-native";

// Try to load native modules at runtime. If they are not available (e.g., Snack/web),
// we fall back to AsyncStorage or an in-memory store so the app doesn't crash.
let SQLite: any = null;
let FileSystem: any = null;
let AsyncStorage: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SQLite = require("expo-sqlite");
} catch (e) {
  SQLite = null;
}

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  FileSystem = require("expo-file-system");
} catch (e) {
  FileSystem = null;
}

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch (e) {
  AsyncStorage = null;
}

// In-memory fallback store
const memoryStoreKey = "@crackers:store";
let memoryStore: any = null;

// Utility: safe JSON parsing
function safeParse(v: any) {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

// Generic storage interface: getItem/setItem
async function storageGet(key: string) {
  if (AsyncStorage) return await AsyncStorage.getItem(key);
  if (memoryStore) return memoryStore[key] ?? null;
  return null;
}
async function storageSet(key: string, value: string) {
  if (AsyncStorage) return await AsyncStorage.setItem(key, value);
  if (memoryStore) {
    memoryStore[key] = value;
    return;
  }
  return;
}

// Basic in-memory model used when SQLite isn't available
const defaultModel = {
  stock: [], // {id, quantity, supplier, date, note}
  customers: [], // {id, name, phone, business_name, location}
  sales: [], // {id, customer_id, quantity, price_per_unit, total_price, date, note}
  expense_types: [], // {id, name}
  expenses: [], // {id, expense_type_id, amount, date, note}
  ingredient_units: [], // {id, ingredient, multiplier}
  counters: {
    stock: 1,
    customers: 1,
    sales: 1,
    expense_types: 1,
    expenses: 1,
    ingredient_units: 1,
  },
};

// SQLite helpers (if available)
let db: any = null;
function openSqliteDb() {
  try {
    if (!SQLite) return null;
    // expo-sqlite sometimes returns a module with .default or the function directly
    const sqliteModule = SQLite.openDatabase
      ? SQLite
      : SQLite.default || SQLite;
    return sqliteModule.openDatabase("crackers.db");
  } catch (e) {
    return null;
  }
}

async function runSql(sql: string, params: any[] = []) {
  if (!db) throw new Error("SQLite DB not initialized");
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        sql,
        params,
        (_: any, result: any) => resolve(result),
        (_: any, err: any) => {
          reject(err);
          return false;
        },
      );
    });
  });
}

// Initialize DB either via SQLite or AsyncStorage fallback
export async function initDB() {
  // If sqlite is available, try to init tables
  db = openSqliteDb();
  if (db) {
    try {
      await runSql(
        `CREATE TABLE IF NOT EXISTS stock (id INTEGER PRIMARY KEY AUTOINCREMENT, quantity INTEGER NOT NULL, supplier TEXT, date TEXT NOT NULL, note TEXT);`,
      );
      await runSql(
        `CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT, business_name TEXT, location TEXT);`,
      );
      await runSql(
        `CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER, quantity INTEGER NOT NULL, price_per_unit REAL NOT NULL, total_price REAL NOT NULL, date TEXT NOT NULL, note TEXT, FOREIGN KEY(customer_id) REFERENCES customers(id));`,
      );
      await runSql(
        `CREATE TABLE IF NOT EXISTS expense_types (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL);`,
      );
      await runSql(
        `CREATE TABLE IF NOT EXISTS expenses (id INTEGER PRIMARY KEY AUTOINCREMENT, expense_type_id INTEGER NOT NULL, amount REAL NOT NULL, date TEXT NOT NULL, note TEXT, FOREIGN KEY(expense_type_id) REFERENCES expense_types(id));`,
      );
      await runSql(
        `CREATE TABLE IF NOT EXISTS ingredient_units (id INTEGER PRIMARY KEY AUTOINCREMENT, ingredient TEXT UNIQUE NOT NULL, multiplier REAL NOT NULL);`,
      );

      // seed expense types
      await runSql(
        `INSERT OR IGNORE INTO expense_types (name) VALUES ('Packaging'),('Transport'),('Utilities'),('Wages');`,
      );
      // seed ingredients
      const defaultIngredients = [
        "BBQ",
        "Chips",
        "Salt",
        "Garlic",
        "Water",
        "VegOil",
      ];
      for (const ing of defaultIngredients) {
        await runSql(
          `INSERT OR IGNORE INTO ingredient_units (ingredient, multiplier) VALUES (?,?);`,
          [ing, 0],
        );
      }

      return { success: true, message: "SQLite DB initialized" };
    } catch (err) {
      // SQLite init failed — fall back to storage. Avoid noisy console logs in production.
      // console.warn('SQLite init failed, falling back to storage', err);
      db = null; // fall back
    }
  }

  // AsyncStorage / memory fallback initialization
  try {
    const raw = await storageGet(memoryStoreKey);
    if (!raw) {
      memoryStore = { ...defaultModel };
      await storageSet(memoryStoreKey, JSON.stringify(memoryStore));
    } else {
      memoryStore = safeParse(raw) || { ...defaultModel };
      // ensure counters exist
      memoryStore.counters = memoryStore.counters || {
        stock: 1,
        customers: 1,
        sales: 1,
        expense_types: 1,
        expenses: 1,
        ingredient_units: 1,
      };
      // ensure settings store exists (default PIN 4207)
      memoryStore.settings = memoryStore.settings || { pin: "4207" };
    }

    // seed expense types if missing
    if (memoryStore.expense_types.length === 0) {
      const names = ["Packaging", "Transport", "Utilities", "Wages"];
      for (const n of names)
        memoryStore.expense_types.push({
          id: memoryStore.counters.expense_types++,
          name: n,
        });
    }
    // seed ingredients
    const defaultIngredients = [
      "BBQ",
      "Chips",
      "Salt",
      "Garlic",
      "Water",
      "VegOil",
    ];
    for (const ing of defaultIngredients) {
      if (
        !memoryStore.ingredient_units.find((r: any) => r.ingredient === ing)
      ) {
        memoryStore.ingredient_units.push({
          id: memoryStore.counters.ingredient_units++,
          ingredient: ing,
          multiplier: 0,
        });
      }
    }

    await storageSet(memoryStoreKey, JSON.stringify(memoryStore));
    return {
      success: true,
      message: "Storage DB initialized (AsyncStorage/memory)",
    };
  } catch (err) {
    // Last resort: build in-memory store
    memoryStore = { ...defaultModel };
    return { success: false, message: "Using volatile in-memory DB" };
  }
}

/* ---------------------------
   Helpers to operate on the fallback memory store
   --------------------------- */
function ensureMemory() {
  if (!memoryStore) memoryStore = { ...defaultModel };
}

async function persistMemory() {
  if (AsyncStorage)
    await storageSet(memoryStoreKey, JSON.stringify(memoryStore));
}

/* ---------------------------
   1) Stock operations
   --------------------------- */
export async function addStock({
  quantity,
  supplier = null,
  date = null,
  note = null,
}: any) {
  if (!quantity || quantity <= 0)
    return { success: false, message: "Quantity must be > 0" };
  const dateIso = date || new Date().toISOString();
  if (db) {
    try {
      await runSql(
        `INSERT INTO stock (quantity, supplier, date, note) VALUES (?,?,?,?);`,
        [quantity, supplier, dateIso, note],
      );
      return { success: true, message: "Stock added" };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  }
  ensureMemory();
  const id = memoryStore.counters.stock++;
  memoryStore.stock.push({ id, quantity, supplier, date: dateIso, note });
  await persistMemory();
  return { success: true, id, message: "Stock added (storage)" };
}

export async function getTotalStockIn() {
  if (db) {
    const res: any = await runSql(
      `SELECT COALESCE(SUM(quantity),0) AS total_in FROM stock;`,
    );
    return res.rows.item(0).total_in || 0;
  }
  ensureMemory();
  return memoryStore.stock.reduce(
    (s: number, r: any) => s + (Number(r.quantity) || 0),
    0,
  );
}

export async function getTotalSold() {
  if (db) {
    const res: any = await runSql(
      `SELECT COALESCE(SUM(quantity),0) AS total_out FROM sales;`,
    );
    return res.rows.item(0).total_out || 0;
  }
  ensureMemory();
  return memoryStore.sales.reduce(
    (s: number, r: any) => s + (Number(r.quantity) || 0),
    0,
  );
}

export async function getAvailableStock() {
  const totalIn = await getTotalStockIn();
  const totalOut = await getTotalSold();
  const available = totalIn - totalOut;
  return Math.max(0, available);
}

/* ---------------------------
   2) Customers CRUD
   --------------------------- */
export async function addCustomer({
  name,
  phone = null,
  business_name = null,
  location = null,
}: any) {
  if (!name) return { success: false, message: "Customer name required" };
  if (db) {
    try {
      const res: any = await runSql(
        `INSERT INTO customers (name, phone, business_name, location) VALUES (?,?,?,?);`,
        [name, phone, business_name, location],
      );
      let newId =
        res && (res as any).insertId ? (res as any).insertId : undefined;
      if (!newId) {
        // Fallback: query last inserted id
        try {
          const last: any = await runSql(
            `SELECT id FROM customers ORDER BY id DESC LIMIT 1;`,
          );
          if (last && last.rows && last.rows.length)
            newId = last.rows.item(0).id;
        } catch (err) {
          /* ignore */
        }
      }
      return { success: true, id: newId, message: "Customer added" };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  }
  ensureMemory();
  const id = memoryStore.counters.customers++;
  memoryStore.customers.push({ id, name, phone, business_name, location });
  await persistMemory();
  return { success: true, id, message: "Customer added (storage)" };
}

export async function editCustomer({
  id,
  name,
  phone,
  business_name,
  location,
}: any) {
  if (!id) return { success: false, message: "Customer id required" };
  if (db) {
    try {
      await runSql(
        `UPDATE customers SET name=?, phone=?, business_name=?, location=? WHERE id=?;`,
        [name, phone, business_name, location, id],
      );
      return { success: true, message: "Customer updated" };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  }
  ensureMemory();
  const idx = memoryStore.customers.findIndex((c: any) => c.id === id);
  if (idx === -1) return { success: false, message: "Customer not found" };
  memoryStore.customers[idx] = { id, name, phone, business_name, location };
  await persistMemory();
  return { success: true, message: "Customer updated (storage)" };
}

export async function deleteCustomer(id: number) {
  if (!id) return { success: false, message: "Customer id required" };
  if (db) {
    try {
      await runSql(`DELETE FROM customers WHERE id=?;`, [id]);
      return { success: true, message: "Customer deleted" };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  }
  ensureMemory();
  memoryStore.customers = memoryStore.customers.filter((c: any) => c.id !== id);
  await persistMemory();
  return { success: true, message: "Customer deleted (storage)" };
}

export async function listCustomers() {
  if (db) {
    const res: any = await runSql(`SELECT * FROM customers ORDER BY name;`);
    const out: any[] = [];
    for (let i = 0; i < res.rows.length; i++) out.push(res.rows.item(i));
    return out;
  }
  ensureMemory();
  return [...memoryStore.customers].sort((a: any, b: any) =>
    (a.name || "").localeCompare(b.name || ""),
  );
}

/* ---------------------------
   3) Sales
   --------------------------- */
export async function saveSale({
  customerId = null,
  quantity,
  pricePerUnit,
  date = null,
  note = null,
}: any) {
  if (!quantity || quantity <= 0)
    return { success: false, message: "Quantity must be > 0" };
  if (!pricePerUnit || pricePerUnit <= 0)
    return { success: false, message: "Price per unit must be > 0" };
  const dateIso = date || new Date().toISOString();
  const available = await getAvailableStock();
  if (quantity > available)
    return {
      success: false,
      message: `Insufficient stock. Available: ${available}`,
    };
  const total = quantity * pricePerUnit;
  if (db) {
    try {
      const res: any = await runSql(
        `INSERT INTO sales (customer_id, quantity, price_per_unit, total_price, date, note) VALUES (?,?,?,?,?,?);`,
        [customerId || null, quantity, pricePerUnit, total, dateIso, note],
      );
      let newId =
        res && (res as any).insertId ? (res as any).insertId : undefined;
      if (!newId) {
        try {
          const last: any = await runSql(
            `SELECT id FROM sales ORDER BY id DESC LIMIT 1;`,
          );
          if (last && last.rows && last.rows.length)
            newId = last.rows.item(0).id;
        } catch (err) {
          /* ignore */
        }
      }
      return { success: true, message: "Sale recorded", total, id: newId };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  }
  ensureMemory();
  const id = memoryStore.counters.sales++;
  memoryStore.sales.push({
    id,
    customer_id: customerId,
    quantity,
    price_per_unit: pricePerUnit,
    total_price: total,
    date: dateIso,
    note,
  });
  await persistMemory();
  return { success: true, id, message: "Sale recorded (storage)", total };
}

export async function editSale({
  id,
  customerId = null,
  quantity,
  pricePerUnit,
  date = null,
  note = null,
}: any) {
  if (!id) return { success: false, message: "Sale id required" };
  if (!quantity || quantity <= 0)
    return { success: false, message: "Quantity must be > 0" };
  if (!pricePerUnit || pricePerUnit <= 0)
    return { success: false, message: "Price per unit must be > 0" };
  const dateIso = date || new Date().toISOString();

  if (db) {
    try {
      const origRes: any = await runSql(
        `SELECT quantity FROM sales WHERE id=?;`,
        [id],
      );
      if (origRes.rows.length === 0)
        return { success: false, message: "Sale not found" };
      const origQty = origRes.rows.item(0).quantity || 0;
      const totalIn = await getTotalStockIn();
      const totalOut = await getTotalSold();
      const availableIfRemoved = totalIn - (totalOut - origQty);
      if (quantity > availableIfRemoved)
        return {
          success: false,
          message: `Insufficient stock for update. Available if current sale removed: ${availableIfRemoved}`,
        };
      const total = quantity * pricePerUnit;
      await runSql(
        `UPDATE sales SET customer_id=?, quantity=?, price_per_unit=?, total_price=?, date=?, note=? WHERE id=?;`,
        [customerId || null, quantity, pricePerUnit, total, dateIso, note, id],
      );
      return { success: true, message: "Sale updated" };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  }

  ensureMemory();
  const idx = memoryStore.sales.findIndex((s: any) => s.id === id);
  if (idx === -1) return { success: false, message: "Sale not found" };
  // compute available if current sale removed
  const totalIn = memoryStore.stock.reduce(
    (s: number, r: any) => s + (Number(r.quantity) || 0),
    0,
  );
  const totalOut = memoryStore.sales.reduce(
    (s: number, r: any) => s + (Number(r.quantity) || 0),
    0,
  );
  const origQty = memoryStore.sales[idx].quantity || 0;
  const availableIfRemoved = totalIn - (totalOut - origQty);
  if (quantity > availableIfRemoved)
    return {
      success: false,
      message: `Insufficient stock for update. Available if current sale removed: ${availableIfRemoved}`,
    };
  const total = quantity * pricePerUnit;
  memoryStore.sales[idx] = {
    id,
    customer_id: customerId,
    quantity,
    price_per_unit: pricePerUnit,
    total_price: total,
    date: dateIso,
    note,
  };
  await persistMemory();
  return { success: true, message: "Sale updated (storage)" };
}

export async function deleteSale(id: number) {
  if (!id) return { success: false, message: "Sale id required" };
  if (db) {
    try {
      await runSql(`DELETE FROM sales WHERE id=?;`, [id]);
      return { success: true, message: "Sale deleted" };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  }
  ensureMemory();
  memoryStore.sales = memoryStore.sales.filter((s: any) => s.id !== id);
  await persistMemory();
  return { success: true, message: "Sale deleted (storage)" };
}

export async function listSales({ start = null, end = null }: any = {}) {
  if (db) {
    try {
      if (start && end) {
        const res: any = await runSql(
          `SELECT * FROM sales WHERE date BETWEEN ? AND ? ORDER BY date DESC;`,
          [start, end],
        );
        const rows: any[] = [];
        for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
        return rows;
      }
      const res: any = await runSql(`SELECT * FROM sales ORDER BY date DESC;`);
      const rows: any[] = [];
      for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
      return rows;
    } catch (err) {
      throw err;
    }
  }
  ensureMemory();
  let rows = [...memoryStore.sales];
  rows.sort((a: any, b: any) => (b.date || "").localeCompare(a.date || ""));
  if (start && end)
    rows = rows.filter((r: any) => r.date >= start && r.date <= end);
  return rows;
}

/* ---------------------------
   4) Expense Types & Expenses
   --------------------------- */
export async function addExpenseType(name: string) {
  if (!name) return { success: false, message: "Name required" };
  if (db) {
    try {
      await runSql(`INSERT INTO expense_types (name) VALUES (?);`, [name]);
      return { success: true, message: "Expense type added" };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  }
  ensureMemory();
  const id = memoryStore.counters.expense_types++;
  memoryStore.expense_types.push({ id, name });
  await persistMemory();
  return { success: true, message: "Expense type added (storage)" };
}

export async function listExpenseTypes() {
  if (db) {
    const res: any = await runSql(`SELECT * FROM expense_types ORDER BY name;`);
    const rows: any[] = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
  }
  ensureMemory();
  return [...memoryStore.expense_types].sort((a: any, b: any) =>
    (a.name || "").localeCompare(b.name || ""),
  );
}

export async function deleteExpenseType(id: number) {
  if (!id) return { success: false, message: "Expense type id required" };
  if (db) {
    try {
      await runSql(`DELETE FROM expense_types WHERE id=?;`, [id]);
      return { success: true, message: "Expense type deleted" };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  }
  ensureMemory();
  memoryStore.expense_types = memoryStore.expense_types.filter(
    (e: any) => e.id !== id,
  );
  await persistMemory();
  return { success: true, message: "Expense type deleted (storage)" };
}

export async function addExpense({
  expenseTypeId,
  amount,
  date = null,
  note = null,
}: any) {
  if (!expenseTypeId)
    return { success: false, message: "Expense type required" };
  if (amount == null || amount < 0)
    return { success: false, message: "Amount must be >= 0" };
  const dateIso = date || new Date().toISOString();
  if (db) {
    try {
      await runSql(
        `INSERT INTO expenses (expense_type_id, amount, date, note) VALUES (?,?,?,?);`,
        [expenseTypeId, amount, dateIso, note],
      );
      return { success: true, message: "Expense added" };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  }
  ensureMemory();
  const id = memoryStore.counters.expenses++;
  memoryStore.expenses.push({
    id,
    expense_type_id: expenseTypeId,
    amount,
    date: dateIso,
    note,
  });
  await persistMemory();
  return { success: true, message: "Expense added (storage)" };
}

export async function editExpense({
  id,
  expenseTypeId,
  amount,
  date = null,
  note = null,
}: any) {
  if (!id) return { success: false, message: "Expense id required" };
  if (!expenseTypeId)
    return { success: false, message: "Expense type required" };
  const dateIso = date || new Date().toISOString();
  if (db) {
    try {
      await runSql(
        `UPDATE expenses SET expense_type_id=?, amount=?, date=?, note=? WHERE id=?;`,
        [expenseTypeId, amount, dateIso, note, id],
      );
      return { success: true, message: "Expense updated" };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  }
  ensureMemory();
  const idx = memoryStore.expenses.findIndex((e: any) => e.id === id);
  if (idx === -1) return { success: false, message: "Expense not found" };
  memoryStore.expenses[idx] = {
    id,
    expense_type_id: expenseTypeId,
    amount,
    date: dateIso,
    note,
  };
  await persistMemory();
  return { success: true, message: "Expense updated (storage)" };
}

export async function deleteExpense(id: number) {
  if (!id) return { success: false, message: "Expense id required" };
  if (db) {
    try {
      await runSql(`DELETE FROM expenses WHERE id=?;`, [id]);
      return { success: true, message: "Expense deleted" };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  }
  ensureMemory();
  memoryStore.expenses = memoryStore.expenses.filter((e: any) => e.id !== id);
  await persistMemory();
  return { success: true, message: "Expense deleted (storage)" };
}

export async function listExpenses({ start = null, end = null }: any = {}) {
  if (db) {
    try {
      if (start && end) {
        const res: any = await runSql(
          `SELECT e.*, et.name as expense_type FROM expenses e LEFT JOIN expense_types et ON e.expense_type_id=et.id WHERE date BETWEEN ? AND ? ORDER BY date DESC;`,
          [start, end],
        );
        const rows: any[] = [];
        for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
        return rows;
      }
      const res: any = await runSql(
        `SELECT e.*, et.name as expense_type FROM expenses e LEFT JOIN expense_types et ON e.expense_type_id=et.id ORDER BY date DESC;`,
      );
      const rows: any[] = [];
      for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
      return rows;
    } catch (err) {
      throw err;
    }
  }
  ensureMemory();
  let rows = [...memoryStore.expenses].map((e: any) => ({
    ...e,
    expense_type: (
      memoryStore.expense_types.find((t: any) => t.id === e.expense_type_id) ||
      {}
    ).name,
  }));
  rows.sort((a: any, b: any) => (b.date || "").localeCompare(a.date || ""));
  if (start && end)
    rows = rows.filter((r: any) => r.date >= start && r.date <= end);
  return rows;
}

/* ---------------------------
   5) Ingredient units & calculator
   --------------------------- */
export async function setIngredientUnit(
  ingredient: string,
  multiplier: number,
) {
  if (!ingredient) return { success: false, message: "Ingredient required" };
  if (multiplier == null || isNaN(multiplier))
    return { success: false, message: "Multiplier required (number)" };
  if (db) {
    try {
      // upsert
      await runSql(
        `INSERT OR REPLACE INTO ingredient_units (id, ingredient, multiplier) VALUES (COALESCE((SELECT id FROM ingredient_units WHERE ingredient = ?), NULL), ?, ?);`,
        [ingredient, ingredient, multiplier],
      );
      return { success: true, message: "Ingredient multiplier saved" };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  }
  ensureMemory();
  // update existing or insert new
  let existing = memoryStore.ingredient_units.find(
    (u: any) => u.ingredient === ingredient,
  );
  if (existing) {
    existing.multiplier = multiplier;
  } else {
    const newObj = {
      id: memoryStore.counters.ingredient_units++,
      ingredient,
      multiplier,
    };
    memoryStore.ingredient_units.push(newObj);
  }
  await persistMemory();
  return { success: true, message: "Ingredient multiplier saved (storage)" };
}

export async function getIngredientUnits() {
  if (db) {
    const res: any = await runSql(
      `SELECT ingredient, multiplier FROM ingredient_units;`,
    );
    const out: any = {};
    for (let i = 0; i < res.rows.length; i++) {
      const r = res.rows.item(i);
      out[r.ingredient] = parseFloat(r.multiplier);
    }
    return out;
  }
  ensureMemory();
  const out: any = {};
  for (const u of memoryStore.ingredient_units)
    out[u.ingredient] = Number(u.multiplier) || 0;
  return out;
}

export async function calculateIngredients(kgOfFlour: number) {
  if (kgOfFlour == null || isNaN(kgOfFlour) || kgOfFlour <= 0)
    return {
      success: false,
      message: "Enter a valid kg of flour (number > 0)",
    };
  const units = await getIngredientUnits();
  const results: any = {};
  for (const ing of Object.keys(units)) {
    const mult = Number(units[ing]) || 0;
    results[ing] = mult * kgOfFlour;
  }
  return { success: true, flourKg: kgOfFlour, ingredients: results };
}

/* ---------------------------
   6) Reports helpers
   --------------------------- */
export async function totalSales({ start = null, end = null }: any = {}) {
  if (db) {
    if (start && end) {
      const res: any = await runSql(
        `SELECT COALESCE(SUM(total_price),0) as total_sales FROM sales WHERE date BETWEEN ? AND ?;`,
        [start, end],
      );
      return res.rows.item(0).total_sales || 0;
    }
    const res: any = await runSql(
      `SELECT COALESCE(SUM(total_price),0) as total_sales FROM sales;`,
    );
    return res.rows.item(0).total_sales || 0;
  }
  ensureMemory();
  let rows = [...memoryStore.sales];
  if (start && end)
    rows = rows.filter((r: any) => r.date >= start && r.date <= end);
  return rows.reduce(
    (s: number, r: any) => s + (Number(r.total_price) || 0),
    0,
  );
}

export async function totalExpenses({ start = null, end = null }: any = {}) {
  if (db) {
    if (start && end) {
      const res: any = await runSql(
        `SELECT COALESCE(SUM(amount),0) as total_expenses FROM expenses WHERE date BETWEEN ? AND ?;`,
        [start, end],
      );
      return res.rows.item(0).total_expenses || 0;
    }
    const res: any = await runSql(
      `SELECT COALESCE(SUM(amount),0) as total_expenses FROM expenses;`,
    );
    return res.rows.item(0).total_expenses || 0;
  }
  ensureMemory();
  let rows = [...memoryStore.expenses];
  if (start && end)
    rows = rows.filter((r: any) => r.date >= start && r.date <= end);
  return rows.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
}

export async function salesOverTime({ start, end }: any) {
  if (db) {
    const res: any = await runSql(
      `SELECT DATE(date) as day, COALESCE(SUM(total_price),0) as sales FROM sales WHERE date BETWEEN ? AND ? GROUP BY day ORDER BY day;`,
      [start, end],
    );
    const rows: any[] = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
  }
  ensureMemory();
  // Aggregate per day
  const map: any = {};
  const rows = memoryStore.sales.filter(
    (r: any) => r.date >= start && r.date <= end,
  );
  for (const s of rows) {
    const day = (s.date || "").slice(0, 10);
    map[day] = (map[day] || 0) + Number(s.total_price || 0);
  }
  const out: any[] = [];
  Object.keys(map)
    .sort()
    .forEach((d) => out.push({ day: d, sales: map[d] }));
  return out;
}

export async function topCustomers({ limit = 10 }: any = {}) {
  if (db) {
    const res: any = await runSql(
      `SELECT c.id, c.name, c.business_name, COALESCE(SUM(s.quantity),0) as total_quantity, COUNT(s.id) as times_bought FROM customers c LEFT JOIN sales s ON s.customer_id = c.id GROUP BY c.id HAVING total_quantity > 0 ORDER BY total_quantity DESC LIMIT ?;`,
      [limit],
    );
    const rows: any[] = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
  }
  ensureMemory();
  const map: any = {};
  for (const s of memoryStore.sales) {
    const cid = s.customer_id;
    if (!cid) continue;
    map[cid] = map[cid] || { id: cid, total_quantity: 0, times_bought: 0 };
    map[cid].total_quantity += Number(s.quantity || 0);
    map[cid].times_bought += 1;
  }
  const arr: any[] = [];
  for (const cid of Object.keys(map)) {
    const c = memoryStore.customers.find((x: any) => x.id === Number(cid)) || {
      name: "Unknown",
    };
    arr.push({
      id: Number(cid),
      name: c.name,
      business_name: c.business_name,
      total_quantity: map[cid].total_quantity,
      times_bought: map[cid].times_bought,
    });
  }
  arr.sort((a: any, b: any) => b.total_quantity - a.total_quantity);
  return arr.slice(0, limit);
}

export async function leastCustomers({ limit = 10 }: any = {}) {
  if (db) {
    const res: any = await runSql(
      `SELECT c.id, c.name, c.business_name, COALESCE(SUM(s.quantity),0) as total_quantity, COUNT(s.id) as times_bought FROM customers c LEFT JOIN sales s ON s.customer_id = c.id GROUP BY c.id ORDER BY total_quantity ASC LIMIT ?;`,
      [limit],
    );
    const rows: any[] = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
  }
  ensureMemory();
  const totals: any[] = memoryStore.customers.map((c: any) => {
    const sold = memoryStore.sales
      .filter((s: any) => s.customer_id === c.id)
      .reduce((sum: number, r: any) => sum + Number(r.quantity || 0), 0);
    const times = memoryStore.sales.filter(
      (s: any) => s.customer_id === c.id,
    ).length;
    return {
      id: c.id,
      name: c.name,
      business_name: c.business_name,
      total_quantity: sold,
      times_bought: times,
    };
  });
  totals.sort((a: any, b: any) => a.total_quantity - b.total_quantity);
  return totals.slice(0, limit);
}

/* ---------------------------
   7) CSV Export
   --------------------------- */
export async function exportTableCSV(
  tableName: string,
  start: string | null = null,
  end: string | null = null,
  filename: string | null = null,
) {
  const allowed = [
    "stock",
    "customers",
    "sales",
    "expense_types",
    "expenses",
    "ingredient_units",
  ];
  if (!allowed.includes(tableName))
    return { success: false, message: "Table not allowed for export" };
  try {
    let rows: any[] = [];
    if (db) {
      let query = `SELECT * FROM ${tableName}`;
      const params: any[] = [];
      if (
        start &&
        end &&
        (tableName === "sales" ||
          tableName === "expenses" ||
          tableName === "stock")
      ) {
        query += ` WHERE date BETWEEN ? AND ?`;
        params.push(start, end);
      }
      query += ` ORDER BY date DESC;`;
      const res: any = await runSql(query, params);
      for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    } else {
      ensureMemory();
      if (tableName === "stock") rows = memoryStore.stock.slice().reverse();
      else if (tableName === "customers")
        rows = memoryStore.customers.slice().reverse();
      else if (tableName === "sales")
        rows = memoryStore.sales.slice().reverse();
      else if (tableName === "expense_types")
        rows = memoryStore.expense_types.slice().reverse();
      else if (tableName === "expenses")
        rows = memoryStore.expenses
          .slice()
          .reverse()
          .map((e: any) => ({
            ...e,
            expense_type: (
              memoryStore.expense_types.find(
                (t: any) => t.id === e.expense_type_id,
              ) || {}
            ).name,
          }));
      else if (tableName === "ingredient_units")
        rows = memoryStore.ingredient_units.slice().reverse();
      if (
        start &&
        end &&
        (tableName === "sales" ||
          tableName === "expenses" ||
          tableName === "stock")
      )
        rows = rows.filter((r: any) => r.date >= start && r.date <= end);
    }

    const csvLines: string[] = [];
    if (rows.length === 0) csvLines.push("No rows");
    for (let i = 0; i < rows.length; i++) {
      const obj = rows[i];
      if (i === 0) csvLines.push(Object.keys(obj).join(","));
      const line = Object.values(obj)
        .map((v: any) => (v == null ? "" : String(v).replace(/"/g, '""')))
        .join(",");
      csvLines.push(line);
    }
    const csvString = csvLines.join("\n");
    const name =
      filename || `${tableName}_${new Date().toISOString().slice(0, 10)}.csv`;
    if (FileSystem && FileSystem.documentDirectory) {
      const dir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const uri = `${dir}${name}`;
      (await FileSystem.writeAsStringAsync)
        ? FileSystem.writeAsStringAsync(uri, csvString, {
            encoding: FileSystem.EncodingType.UTF8,
          })
        : FileSystem.writeFileAsync(uri, csvString, {
            encoding: FileSystem.EncodingType.UTF8,
          });
      return { success: true, uri, message: `Exported to ${uri}` };
    }
    // fallback: return csv text in response
    return {
      success: true,
      csv: csvString,
      message: "CSV generated (no file storage available in this environment)",
    };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

// ---------------------------
// New: listStock, deleteStock, exportAllToPDF
// ---------------------------
export async function listStock() {
  if (db) {
    try {
      const res: any = await runSql(`SELECT * FROM stock ORDER BY date DESC;`);
      const rows: any[] = [];
      for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
      return rows;
    } catch (err) {
      throw err;
    }
  }
  ensureMemory();
  const rows = [...memoryStore.stock];
  rows.sort((a: any, b: any) => (b.date || "").localeCompare(a.date || ""));
  return rows;
}

export async function deleteStock(id: number) {
  if (!id) return { success: false, message: "Stock id required" };
  if (db) {
    try {
      await runSql(`DELETE FROM stock WHERE id=?;`, [id]);
      return { success: true, message: "Stock entry deleted" };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  }
  ensureMemory();
  const before = memoryStore.stock.length;
  memoryStore.stock = memoryStore.stock.filter((s: any) => s.id !== id);
  await persistMemory();
  return {
    success: true,
    message: `Deleted ${before - memoryStore.stock.length} stock entries (storage)`,
  };
}

export async function exportAllToPDF(filename: string | null = null) {
  if (!FileSystem)
    return { success: false, message: "FileSystem not available" };
  // try to require expo-print
  let Print: any = null;
  try {
    Print = require("expo-print");
  } catch (e) {
    Print = null;
  }
  if (!Print || !Print.printToFileAsync)
    return {
      success: false,
      message:
        "expo-print not available. Install expo-print to enable PDF export.",
    };

  try {
    // gather data
    const stock = await listStock();
    const customers = await listCustomers();
    const sales = await listSales();
    const expenses = await listExpenses();
    const totalsales = await totalSales();
    const totalexpenses = await totalExpenses();
    const profit = totalsales - totalexpenses;

    // Simple HTML generator for PDF
    const headerDate = new Date().toLocaleDateString();
    const name =
      filename || `BEMACHO_Report_${new Date().toISOString().slice(0, 10)}.pdf`;

    function tableHTML(title: string, rows: any[], columns: string[]) {
      let html = `<h3>${title}</h3><table style="width:100%;border-collapse:collapse;border:1px solid #ddd"><thead><tr>`;
      for (const c of columns)
        html += `<th style="border:1px solid #ddd;padding:6px;background:#f8f5f0;text-align:left">${c}</th>`;
      html += `</tr></thead><tbody>`;
      for (const r of rows) {
        html += `<tr>`;
        for (const c of columns) {
          const key = c.toLowerCase().replace(/ /g, "_");
          const v = r[key] != null ? String(r[key]) : "";
          html += `<td style="border:1px solid #eee;padding:6px">${v}</td>`;
        }
        html += `</tr>`;
      }
      html += `</tbody></table>`;
      return html;
    }

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: Arial, Helvetica, sans-serif; color: #3B2F2F; background: #fff; padding: 16px }
            h1 { color: #C49A6C }
            table { margin-bottom: 12px }
          </style>
        </head>
        <body>
          <h1>BEMACHO Crackers</h1>
          <h2>Monthly Report</h2>
          <p>Date: ${headerDate}</p>
          <h3>Summary</h3>
          <p>Total Sales: ${totalsales}</p>
          <p>Total Expenses: ${totalexpenses}</p>
          <p>Net Profit: ${profit}</p>
          ${tableHTML("Stock Entries", stock, Object.keys(stock[0] || {}))}
          ${tableHTML("Sales", sales, Object.keys(sales[0] || {}))}
          ${tableHTML("Expenses", expenses, Object.keys(expenses[0] || {}))}
          ${tableHTML("Customers", customers, Object.keys(customers[0] || {}))}
        </body>
      </html>
    `;

    const printed = await Print.printToFileAsync({ html });
    const tmpUri = printed.uri;

    // move to Documents folder inside app documentDirectory
    const docDir = FileSystem.documentDirectory
      ? `${FileSystem.documentDirectory}Documents/`
      : null;
    if (!docDir)
      return {
        success: true,
        uri: tmpUri,
        message: "PDF generated (no documentDirectory available to move file).",
      };
    try {
      await FileSystem.makeDirectoryAsync(docDir, { intermediates: true });
    } catch (e) {
      /* ignore if exists */
    }
    const dest = `${docDir}${name}`;
    try {
      await FileSystem.moveAsync({ from: tmpUri, to: dest });
    } catch (e) {
      try {
        await FileSystem.copyAsync({ from: tmpUri, to: dest });
      } catch (e2) {
        /* ignore */
      }
    }
    return { success: true, uri: dest, message: `PDF exported to ${dest}` };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

/* ---------------------------
   Quick health
   --------------------------- */
export async function quickHealthCheck() {
  try {
    if (db) {
      await runSql("SELECT 1;");
    }
    const available = await getAvailableStock();
    return {
      success: true,
      message: "DB accessible",
      availableStock: available,
    };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

/* ---------------------------
   Settings helpers
   --------------------------- */
export async function getSetting(key: string, defaultValue: any = null) {
  if (db) {
    // No dedicated settings table in SQLite mode; fall back to AsyncStorage where available
    try {
      const raw = await storageGet(memoryStoreKey);
      const store = safeParse(raw) || {};
      if (store.settings && store.settings[key] !== undefined)
        return store.settings[key];
    } catch (e) {
      /* ignore */
    }
    return defaultValue;
  }
  ensureMemory();
  return memoryStore.settings && memoryStore.settings[key] !== undefined
    ? memoryStore.settings[key]
    : defaultValue;
}

export async function setSetting(key: string, value: any) {
  if (db) {
    // No SQLite settings table — persist into AsyncStorage if available
    try {
      const raw = await storageGet(memoryStoreKey);
      const store = safeParse(raw) || { ...defaultModel };
      store.settings = store.settings || {};
      store.settings[key] = value;
      await storageSet(memoryStoreKey, JSON.stringify(store));
      return { success: true };
    } catch (e) {
      return { success: false, message: String(e) };
    }
  }
  ensureMemory();
  memoryStore.settings = memoryStore.settings || {};
  memoryStore.settings[key] = value;
  await persistMemory();
  return { success: true };
}

// default export
export default {
  initDB,
  addStock,
  getTotalStockIn,
  getTotalSold,
  getAvailableStock,
  // stock list/delete
  listStock,
  deleteStock,
  // settings
  getSetting,
  setSetting,
  // Customers
  addCustomer,
  editCustomer,
  deleteCustomer,
  listCustomers,
  // Sales
  saveSale,
  editSale,
  deleteSale,
  listSales,
  // Expense types & expenses
  addExpenseType,
  listExpenseTypes,
  deleteExpenseType,
  addExpense,
  editExpense,
  deleteExpense,
  listExpenses,
  // Ingredients / Calculator
  setIngredientUnit,
  getIngredientUnits,
  calculateIngredients,
  // Reports
  totalSales,
  totalExpenses,
  salesOverTime,
  topCustomers,
  leastCustomers,
  // Export
  exportTableCSV,
  exportAllToPDF,
  // Utility
  quickHealthCheck,
};
