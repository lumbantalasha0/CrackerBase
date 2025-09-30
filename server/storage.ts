import { 
  type Customer, type InsertCustomer,
  type InventoryMovement, type InsertInventoryMovement,
  type Sale, type InsertSale,
  type ExpenseCategory, type InsertExpenseCategory,
  type Expense, type InsertExpense,
  type Ingredient, type InsertIngredient,
  type Setting
} from "@shared/schema";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { fileURLToPath } from "url";
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);

// Storage interface for all business entities
export interface IStorage {
  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;

  // Inventory
  getInventoryMovements(): Promise<InventoryMovement[]>;
  getInventoryMovement(id: number): Promise<InventoryMovement | undefined>;
  createInventoryMovement(movement: InsertInventoryMovement): Promise<InventoryMovement>;
  getCurrentStock(): Promise<number>;
  updateInventoryMovement(id: number, movement: Partial<InsertInventoryMovement>): Promise<InventoryMovement | undefined>;
  deleteInventoryMovement(id: number): Promise<boolean>;

  // Sales
  getSales(): Promise<Sale[]>;
  getSale(id: number): Promise<Sale | undefined>;
  createSale(sale: InsertSale): Promise<Sale>;
  updateSale(id: number, sale: Partial<InsertSale>): Promise<Sale | undefined>;
  deleteSale(id: number): Promise<boolean>;

  // Expense Categories
  getExpenseCategories(): Promise<ExpenseCategory[]>;
  getExpenseCategory(id: number): Promise<ExpenseCategory | undefined>;
  createExpenseCategory(category: InsertExpenseCategory): Promise<ExpenseCategory>;
  updateExpenseCategory(id: number, category: Partial<InsertExpenseCategory>): Promise<ExpenseCategory | undefined>;
  deleteExpenseCategory(id: number): Promise<boolean>;

  // Expenses
  getExpenses(): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;

  // Ingredients
  getIngredients(): Promise<Ingredient[]>;
  getIngredient(id: number): Promise<Ingredient | undefined>;
  createIngredient(ingredient: InsertIngredient): Promise<Ingredient>;
  updateIngredient(id: number, ingredient: Partial<InsertIngredient>): Promise<Ingredient | undefined>;
  deleteIngredient(id: number): Promise<boolean>;

  // Settings
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private customers: Map<number, Customer> = new Map();
  private inventoryMovements: Map<number, InventoryMovement> = new Map();
  private sales: Map<number, Sale> = new Map();
  private expenseCategories: Map<number, ExpenseCategory> = new Map();
  private expenses: Map<number, Expense> = new Map();
  private ingredients: Map<number, Ingredient> = new Map();
  private settings: Map<string, string> = new Map();
  
  private nextCustomerId = 1;
  private nextInventoryId = 1;
  private nextSaleId = 1;
  private nextExpenseCategoryId = 1;
  private nextExpenseId = 1;
  private nextIngredientId = 1;

  // file persistence
  private dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
  private dataFile = path.join(this.dataDir, 'storage.json');

  constructor() {
    // attempt to load persisted data; if none exists, initialize defaults and persist
    this.loadFromDisk().then((loaded) => {
      if (!loaded) {
        this.initializeDefaultData();
        // best-effort persist
        this.saveToDisk().catch(() => {});
      }
    }).catch(() => {
      // fallback to defaults on any read error
      this.initializeDefaultData();
      this.saveToDisk().catch(() => {});
    });
  }

  private async ensureDataDir() {
    try {
      await mkdir(this.dataDir, { recursive: true });
    } catch (e) {
      // ignore
    }
  }

  private async saveToDisk() {
    try {
      await this.ensureDataDir();
      const payload = {
        nextIds: {
          nextCustomerId: this.nextCustomerId,
          nextInventoryId: this.nextInventoryId,
          nextSaleId: this.nextSaleId,
          nextExpenseCategoryId: this.nextExpenseCategoryId,
          nextExpenseId: this.nextExpenseId,
          nextIngredientId: this.nextIngredientId,
        },
        customers: Array.from(this.customers.values()),
        inventoryMovements: Array.from(this.inventoryMovements.values()),
        sales: Array.from(this.sales.values()),
        expenseCategories: Array.from(this.expenseCategories.values()),
        expenses: Array.from(this.expenses.values()),
        ingredients: Array.from(this.ingredients.values()),
        settings: Array.from(this.settings.entries()),
      };
      await writeFile(this.dataFile, JSON.stringify(payload, null, 2), 'utf8');
    } catch (e) {
      // swallow write errors but log
      // console.error('Failed to save storage to disk', e);
    }
  }

  private async loadFromDisk(): Promise<boolean> {
    try {
      const content = await readFile(this.dataFile, 'utf8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        const ids = parsed.nextIds || {};
        this.nextCustomerId = ids.nextCustomerId ?? this.nextCustomerId;
        this.nextInventoryId = ids.nextInventoryId ?? this.nextInventoryId;
        this.nextSaleId = ids.nextSaleId ?? this.nextSaleId;
        this.nextExpenseCategoryId = ids.nextExpenseCategoryId ?? this.nextExpenseCategoryId;
        this.nextExpenseId = ids.nextExpenseId ?? this.nextExpenseId;
        this.nextIngredientId = ids.nextIngredientId ?? this.nextIngredientId;

        const loadArrayToMap = (arr: any[] = [], map: Map<number, any>, key = 'id') => {
          for (const item of arr) {
            if (item && item[key] !== undefined) {
              map.set(item[key], item);
            }
          }
        };

        loadArrayToMap(parsed.customers, this.customers);
        loadArrayToMap(parsed.inventoryMovements, this.inventoryMovements);
        loadArrayToMap(parsed.sales, this.sales);
        loadArrayToMap(parsed.expenseCategories, this.expenseCategories);
        loadArrayToMap(parsed.expenses, this.expenses);
        loadArrayToMap(parsed.ingredients, this.ingredients);

        if (Array.isArray(parsed.settings)) {
          for (const [k, v] of parsed.settings) {
            this.settings.set(k, v);
          }
        }
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  private initializeDefaultData() {
    // Default expense categories
    this.createExpenseCategory({ name: "Raw Materials", color: "blue" });
    this.createExpenseCategory({ name: "Utilities", color: "green" });
    this.createExpenseCategory({ name: "Transportation", color: "orange" });
    this.createExpenseCategory({ name: "Marketing", color: "purple" });

    // Default ingredients
    this.createIngredient({ name: "Salt", multiplier: 0.02, unit: "g" });
    this.createIngredient({ name: "Sugar", multiplier: 0.05, unit: "g" });
    this.createIngredient({ name: "Oil", multiplier: 0.15, unit: "ml" });
    this.createIngredient({ name: "Baking Powder", multiplier: 0.01, unit: "g" });
    this.createIngredient({ name: "Water", multiplier: 0.4, unit: "ml" });

    // Default customers
    this.createCustomer({ name: "ABC Restaurant", phone: "+260 123 456 789", businessName: "ABC Restaurant Ltd", location: "Lusaka" });
    this.createCustomer({ name: "John Doe", phone: "+260 987 654 321", businessName: "Corner Store", location: "Ndola" });

    // Initialize with some stock
    this.createInventoryMovement({ type: "addition", quantity: 1250, note: "Initial stock" });
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const id = this.nextCustomerId++;
    const newCustomer: Customer = {
      id,
      name: customer.name,
      phone: customer.phone ?? null,
      businessName: customer.businessName ?? null,
      location: customer.location ?? null,
      createdAt: new Date(),
    };
    this.customers.set(id, newCustomer);
    // persist
    this.saveToDisk().catch(() => {});
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existing = this.customers.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...customer };
    this.customers.set(id, updated);
    // persist
    this.saveToDisk().catch(() => {});
    return updated;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const ok = this.customers.delete(id);
    this.saveToDisk().catch(() => {});
    return ok;
  }

  // Inventory
  async getInventoryMovements(): Promise<InventoryMovement[]> {
    return Array.from(this.inventoryMovements.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getInventoryMovement(id: number): Promise<InventoryMovement | undefined> {
    return this.inventoryMovements.get(id);
  }

  async createInventoryMovement(movement: InsertInventoryMovement): Promise<InventoryMovement> {
    const id = this.nextInventoryId++;
    const currentStock = await this.getCurrentStock();
    
    let newBalance: number;
    if (movement.type === "addition") {
      newBalance = currentStock + movement.quantity;
    } else {
      newBalance = currentStock - movement.quantity;
    }
    
    const newMovement: InventoryMovement = {
      id,
      type: movement.type,
      quantity: movement.quantity,
      balance: newBalance,
      note: movement.note ?? null,
      createdAt: new Date(),
    };
    this.inventoryMovements.set(id, newMovement);
    this.saveToDisk().catch(() => {});
    return newMovement;
  }

  async getCurrentStock(): Promise<number> {
    const movements = await this.getInventoryMovements();
    if (movements.length === 0) return 0;
    
    // Return the balance from the most recent movement
    return movements[0].balance;
  }

  async updateInventoryMovement(id: number, movement: Partial<InsertInventoryMovement>): Promise<InventoryMovement | undefined> {
    const existing = this.inventoryMovements.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...movement };
    this.inventoryMovements.set(id, updated);
    this.saveToDisk().catch(() => {});
    return updated;
  }

  async deleteInventoryMovement(id: number): Promise<boolean> {
    const ok = this.inventoryMovements.delete(id);
    this.saveToDisk().catch(() => {});
    return ok;
  }

  // Sales
  async getSales(): Promise<Sale[]> {
    return Array.from(this.sales.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getSale(id: number): Promise<Sale | undefined> {
    return this.sales.get(id);
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    const id = this.nextSaleId++;
    const pricePerUnit = typeof sale.pricePerUnit === 'number' ? sale.pricePerUnit : Number(sale.pricePerUnit);
    const totalPrice = pricePerUnit * sale.quantity;
    
    const newSale: Sale = {
      id,
      customerId: sale.customerId ?? null,
      customerName: sale.customerName ?? null,
      quantity: sale.quantity,
      pricePerUnit: pricePerUnit.toString(),
      totalPrice: totalPrice.toString(),
      status: sale.status ?? "completed",
      createdAt: new Date(),
    };
    this.sales.set(id, newSale);
    
    // Create inventory movement for sale
    await this.createInventoryMovement({
      type: "sale",
      quantity: sale.quantity,
      note: `Sale to ${sale.customerName || 'Customer'}`,
    });
    this.saveToDisk().catch(() => {});
    
    return newSale;
  }

  async updateSale(id: number, sale: Partial<InsertSale>): Promise<Sale | undefined> {
    const existing = this.sales.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing };
    if (sale.customerId !== undefined) updated.customerId = sale.customerId ?? null;
    if (sale.customerName !== undefined) updated.customerName = sale.customerName ?? null;
    if (sale.quantity !== undefined) updated.quantity = sale.quantity;
    if (sale.status !== undefined) updated.status = sale.status;
    
    if (sale.pricePerUnit !== undefined) {
      const pricePerUnit = typeof sale.pricePerUnit === 'number' ? sale.pricePerUnit : Number(sale.pricePerUnit);
      updated.pricePerUnit = pricePerUnit.toString();
      updated.totalPrice = (pricePerUnit * updated.quantity).toString();
    } else if (sale.quantity !== undefined) {
      const pricePerUnit = Number(existing.pricePerUnit);
      updated.totalPrice = (pricePerUnit * sale.quantity).toString();
    }
    
    this.sales.set(id, updated);
    this.saveToDisk().catch(() => {});
    return updated;
  }

  async deleteSale(id: number): Promise<boolean> {
    const ok = this.sales.delete(id);
    this.saveToDisk().catch(() => {});
    return ok;
  }

  // Expense Categories
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    return Array.from(this.expenseCategories.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getExpenseCategory(id: number): Promise<ExpenseCategory | undefined> {
    return this.expenseCategories.get(id);
  }

  async createExpenseCategory(category: InsertExpenseCategory): Promise<ExpenseCategory> {
    const id = this.nextExpenseCategoryId++;
    const newCategory: ExpenseCategory = {
      ...category,
      id,
      createdAt: new Date(),
    };
    this.expenseCategories.set(id, newCategory);
    this.saveToDisk().catch(() => {});
    return newCategory;
  }

  async updateExpenseCategory(id: number, category: Partial<InsertExpenseCategory>): Promise<ExpenseCategory | undefined> {
    const existing = this.expenseCategories.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...category };
    this.expenseCategories.set(id, updated);
    this.saveToDisk().catch(() => {});
    return updated;
  }

  async deleteExpenseCategory(id: number): Promise<boolean> {
    const ok = this.expenseCategories.delete(id);
    this.saveToDisk().catch(() => {});
    return ok;
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const id = this.nextExpenseId++;
    const amount = typeof expense.amount === 'number' ? expense.amount : Number(expense.amount);
    
    const newExpense: Expense = {
      id,
      categoryId: expense.categoryId ?? null,
      amount: amount.toString(),
      description: expense.description,
      notes: expense.notes ?? null,
      status: expense.status ?? "approved",
      createdAt: new Date(),
    };
    this.expenses.set(id, newExpense);
    this.saveToDisk().catch(() => {});
    return newExpense;
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const existing = this.expenses.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing };
    if (expense.categoryId !== undefined) updated.categoryId = expense.categoryId ?? null;
    if (expense.description !== undefined) updated.description = expense.description;
    if (expense.notes !== undefined) updated.notes = expense.notes ?? null;
    if (expense.status !== undefined) updated.status = expense.status;
    if (expense.amount !== undefined) {
      const amount = typeof expense.amount === 'number' ? expense.amount : Number(expense.amount);
      updated.amount = amount.toString();
    }
    
    this.expenses.set(id, updated);
    this.saveToDisk().catch(() => {});
    return updated;
  }

  async deleteExpense(id: number): Promise<boolean> {
    const ok = this.expenses.delete(id);
    this.saveToDisk().catch(() => {});
    return ok;
  }

  // Ingredients
  async getIngredients(): Promise<Ingredient[]> {
    return Array.from(this.ingredients.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getIngredient(id: number): Promise<Ingredient | undefined> {
    return this.ingredients.get(id);
  }

  async createIngredient(ingredient: InsertIngredient): Promise<Ingredient> {
    const id = this.nextIngredientId++;
    const multiplier = typeof ingredient.multiplier === 'number' ? ingredient.multiplier : Number(ingredient.multiplier);
    
    const newIngredient: Ingredient = {
      id,
      name: ingredient.name,
      multiplier: multiplier.toString(),
      unit: ingredient.unit ?? "g",
      createdAt: new Date(),
    };
    this.ingredients.set(id, newIngredient);
    this.saveToDisk().catch(() => {});
    return newIngredient;
  }

  async updateIngredient(id: number, ingredient: Partial<InsertIngredient>): Promise<Ingredient | undefined> {
    const existing = this.ingredients.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing };
    if (ingredient.name !== undefined) updated.name = ingredient.name;
    if (ingredient.unit !== undefined) updated.unit = ingredient.unit;
    if (ingredient.multiplier !== undefined) {
      const multiplier = typeof ingredient.multiplier === 'number' ? ingredient.multiplier : Number(ingredient.multiplier);
      updated.multiplier = multiplier.toString();
    }
    
    this.ingredients.set(id, updated);
    this.saveToDisk().catch(() => {});
    return updated;
  }

  async deleteIngredient(id: number): Promise<boolean> {
    const ok = this.ingredients.delete(id);
    this.saveToDisk().catch(() => {});
    return ok;
  }

  // Settings
  async getSetting(key: string): Promise<string | undefined> {
    return this.settings.get(key);
  }

  async setSetting(key: string, value: string): Promise<void> {
    this.settings.set(key, value);
    this.saveToDisk().catch(() => {});
  }
}

export const storage = new MemStorage();