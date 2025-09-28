import { pgTable, serial, text, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Customers table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  businessName: text("business_name"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Inventory movements table
export const inventoryMovements = pgTable("inventory_movements", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'addition' or 'sale'
  quantity: integer("quantity").notNull(),
  balance: integer("balance").notNull(), // Running balance after this movement
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sales table
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name"), // For one-time customers
  quantity: integer("quantity").notNull(),
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("completed"), // 'pending' or 'completed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Expense categories table
export const expenseCategories = pgTable("expense_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").default("blue"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Expenses table
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => expenseCategories.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("approved"), // 'pending' or 'approved'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ingredients table for calculator
export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  multiplier: decimal("multiplier", { precision: 10, scale: 4 }).notNull(), // Ratio per 1kg flour
  unit: text("unit").notNull().default("g"), // 'g', 'ml', 'kg', 'l'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Settings table for app configuration
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Create insert schemas with validation
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  businessName: z.string().optional(),
  location: z.string().optional(),
});

export const insertInventoryMovementSchema = createInsertSchema(inventoryMovements).omit({
  id: true,
  createdAt: true,
  balance: true,
}).extend({
  type: z.enum(["addition", "sale"]),
  quantity: z.number().positive("Quantity must be positive"),
  note: z.string().optional(),
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
  totalPrice: true,
}).extend({
  customerId: z.number().optional(),
  customerName: z.string().optional(),
  quantity: z.number().positive("Quantity must be positive"),
  pricePerUnit: z.number().positive("Price must be positive"),
  status: z.enum(["pending", "completed"]).default("completed"),
});

export const insertExpenseCategorySchema = createInsertSchema(expenseCategories).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Category name is required"),
  color: z.string().default("blue"),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
}).extend({
  categoryId: z.number().optional(),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required"),
  notes: z.string().optional(),
  status: z.enum(["pending", "approved"]).default("approved"),
});

export const insertIngredientSchema = createInsertSchema(ingredients).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Ingredient name is required"),
  multiplier: z.number().positive("Multiplier must be positive"),
  unit: z.string().default("g"),
});

// Type exports
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type InsertInventoryMovement = z.infer<typeof insertInventoryMovementSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = z.infer<typeof insertExpenseCategorySchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;

export type Setting = typeof settings.$inferSelect;