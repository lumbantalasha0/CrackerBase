import { eq, desc } from 'drizzle-orm';
import { db } from './db';
import * as schema from '@shared/schema';
import type {
  InsertCustomer,
  InsertInventoryMovement,
  InsertSale,
  InsertExpenseCategory,
  InsertExpense,
  InsertIngredient,
} from '@shared/schema';

export interface IStorage {
  getCustomers(): Promise<any[]>;
  getCustomer(id: number): Promise<any | undefined>;
  createCustomer(customer: InsertCustomer): Promise<any>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<any | undefined>;
  deleteCustomer(id: number): Promise<boolean>;

  getInventoryMovements(): Promise<any[]>;
  getInventoryMovement(id: number): Promise<any | undefined>;
  createInventoryMovement(movement: InsertInventoryMovement): Promise<any>;
  getCurrentStock(): Promise<number>;
  updateInventoryMovement(id: number, movement: Partial<InsertInventoryMovement>): Promise<any | undefined>;
  deleteInventoryMovement(id: number): Promise<boolean>;

  getSales(): Promise<any[]>;
  getSale(id: number): Promise<any | undefined>;
  createSale(sale: InsertSale): Promise<any>;
  updateSale(id: number, sale: Partial<InsertSale>): Promise<any | undefined>;
  deleteSale(id: number): Promise<boolean>;

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

  getIngredients(): Promise<any[]>;
  getIngredient(id: number): Promise<any | undefined>;
  createIngredient(ingredient: InsertIngredient): Promise<any>;
  updateIngredient(id: number, ingredient: Partial<InsertIngredient>): Promise<any | undefined>;
  deleteIngredient(id: number): Promise<boolean>;

  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<void>;
}

export class DrizzleStorage implements IStorage {
  async getCustomers(): Promise<any[]> {
    return await db.select().from(schema.customers).orderBy(desc(schema.customers.createdAt));
  }

  async getCustomer(id: number): Promise<any | undefined> {
    const result = await db.select().from(schema.customers).where(eq(schema.customers.id, id));
    return result[0];
  }

  async createCustomer(customer: InsertCustomer): Promise<any> {
    const result = await db.insert(schema.customers).values(customer).returning();
    return result[0];
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<any | undefined> {
    const result = await db.update(schema.customers)
      .set(customer)
      .where(eq(schema.customers.id, id))
      .returning();
    return result[0];
  }

  async deleteCustomer(id: number): Promise<boolean> {
    await db.delete(schema.customers).where(eq(schema.customers.id, id));
    return true;
  }

  async getInventoryMovements(): Promise<any[]> {
    return await db.select().from(schema.inventoryMovements).orderBy(desc(schema.inventoryMovements.createdAt));
  }

  async getInventoryMovement(id: number): Promise<any | undefined> {
    const result = await db.select().from(schema.inventoryMovements).where(eq(schema.inventoryMovements.id, id));
    return result[0];
  }

  async createInventoryMovement(movement: InsertInventoryMovement & { balance?: number }): Promise<any> {
    const currentStock = await this.getCurrentStock();
    const newBalance = movement.type === 'addition' 
      ? currentStock + movement.quantity 
      : currentStock - movement.quantity;
    
    const result = await db.insert(schema.inventoryMovements)
      .values({
        ...movement,
        balance: newBalance,
      })
      .returning();
    return result[0];
  }

  async getCurrentStock(): Promise<number> {
    const result = await db.select()
      .from(schema.inventoryMovements)
      .orderBy(desc(schema.inventoryMovements.createdAt))
      .limit(1);
    return result[0]?.balance || 0;
  }

  async updateInventoryMovement(id: number, movement: Partial<InsertInventoryMovement>): Promise<any | undefined> {
    const result = await db.update(schema.inventoryMovements)
      .set(movement)
      .where(eq(schema.inventoryMovements.id, id))
      .returning();
    return result[0];
  }

  async deleteInventoryMovement(id: number): Promise<boolean> {
    await db.delete(schema.inventoryMovements).where(eq(schema.inventoryMovements.id, id));
    return true;
  }

  async getSales(): Promise<any[]> {
    return await db.select().from(schema.sales).orderBy(desc(schema.sales.createdAt));
  }

  async getSale(id: number): Promise<any | undefined> {
    const result = await db.select().from(schema.sales).where(eq(schema.sales.id, id));
    return result[0];
  }

  async createSale(sale: InsertSale): Promise<any> {
    const totalPrice = sale.pricePerUnit * sale.quantity;
    const result = await db.insert(schema.sales)
      .values({
        ...sale,
        totalPrice: totalPrice.toString(),
      })
      .returning();
    
    const currentStock = await this.getCurrentStock();
    await db.insert(schema.inventoryMovements)
      .values({
        type: 'sale',
        quantity: sale.quantity,
        balance: currentStock - sale.quantity,
        note: `Sale to ${sale.customerName || 'Customer'}`,
      });
    
    return result[0];
  }

  async updateSale(id: number, sale: Partial<InsertSale>): Promise<any | undefined> {
    const updateData: any = { ...sale };
    if (sale.pricePerUnit !== undefined && sale.quantity !== undefined) {
      updateData.totalPrice = (sale.pricePerUnit * sale.quantity).toString();
    }
    
    const result = await db.update(schema.sales)
      .set(updateData)
      .where(eq(schema.sales.id, id))
      .returning();
    return result[0];
  }

  async deleteSale(id: number): Promise<boolean> {
    await db.delete(schema.sales).where(eq(schema.sales.id, id));
    return true;
  }

  async getExpenseCategories(): Promise<any[]> {
    return await db.select().from(schema.expenseCategories).orderBy(schema.expenseCategories.id);
  }

  async getExpenseCategory(id: number): Promise<any | undefined> {
    const result = await db.select().from(schema.expenseCategories).where(eq(schema.expenseCategories.id, id));
    return result[0];
  }

  async createExpenseCategory(category: InsertExpenseCategory): Promise<any> {
    const result = await db.insert(schema.expenseCategories).values(category).returning();
    return result[0];
  }

  async updateExpenseCategory(id: number, category: Partial<InsertExpenseCategory>): Promise<any | undefined> {
    const result = await db.update(schema.expenseCategories)
      .set(category)
      .where(eq(schema.expenseCategories.id, id))
      .returning();
    return result[0];
  }

  async deleteExpenseCategory(id: number): Promise<boolean> {
    await db.delete(schema.expenseCategories).where(eq(schema.expenseCategories.id, id));
    return true;
  }

  async getExpenses(): Promise<any[]> {
    return await db.select().from(schema.expenses).orderBy(desc(schema.expenses.createdAt));
  }

  async getExpense(id: number): Promise<any | undefined> {
    const result = await db.select().from(schema.expenses).where(eq(schema.expenses.id, id));
    return result[0];
  }

  async createExpense(expense: InsertExpense): Promise<any> {
    const result = await db.insert(schema.expenses).values(expense).returning();
    return result[0];
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<any | undefined> {
    const result = await db.update(schema.expenses)
      .set(expense)
      .where(eq(schema.expenses.id, id))
      .returning();
    return result[0];
  }

  async deleteExpense(id: number): Promise<boolean> {
    await db.delete(schema.expenses).where(eq(schema.expenses.id, id));
    return true;
  }

  async getIngredients(): Promise<any[]> {
    return await db.select().from(schema.ingredients).orderBy(desc(schema.ingredients.createdAt));
  }

  async getIngredient(id: number): Promise<any | undefined> {
    const result = await db.select().from(schema.ingredients).where(eq(schema.ingredients.id, id));
    return result[0];
  }

  async createIngredient(ingredient: InsertIngredient): Promise<any> {
    const result = await db.insert(schema.ingredients).values(ingredient).returning();
    return result[0];
  }

  async updateIngredient(id: number, ingredient: Partial<InsertIngredient>): Promise<any | undefined> {
    const result = await db.update(schema.ingredients)
      .set(ingredient)
      .where(eq(schema.ingredients.id, id))
      .returning();
    return result[0];
  }

  async deleteIngredient(id: number): Promise<boolean> {
    await db.delete(schema.ingredients).where(eq(schema.ingredients.id, id));
    return true;
  }

  async getSetting(key: string): Promise<string | undefined> {
    const result = await db.select().from(schema.settings).where(eq(schema.settings.key, key));
    return result[0]?.value;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const existing = await this.getSetting(key);
    if (existing) {
      await db.update(schema.settings)
        .set({ value, updatedAt: new Date() })
        .where(eq(schema.settings.key, key));
    } else {
      await db.insert(schema.settings).values({ key, value });
    }
  }
}

export const storage: IStorage = new DrizzleStorage();
