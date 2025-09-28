import { Router } from "express";
import { storage } from "./storage";
import { 
  insertCustomerSchema,
  insertInventoryMovementSchema,
  insertSaleSchema,
  insertExpenseCategorySchema,
  insertExpenseSchema,
  insertIngredientSchema
} from "@shared/schema";
import { z } from "zod";

const router = Router();

// Inventory Routes
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
    if (error instanceof z.ZodError) {
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
    if (error instanceof z.ZodError) {
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

// Sales Routes
router.get("/api/sales", async (req, res) => {
  try {
    const sales = await storage.getSales();
    res.json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(500).json({ error: "Failed to fetch sales" });
  }
});

router.post("/api/sales", async (req, res) => {
  try {
    const validatedData = insertSaleSchema.parse(req.body);
    const sale = await storage.createSale(validatedData);
    res.status(201).json(sale);
  } catch (error) {
    if (error instanceof z.ZodError) {
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
    const validatedData = insertSaleSchema.partial().parse(req.body);
    const sale = await storage.updateSale(id, validatedData);
    
    if (!sale) {
      return res.status(404).json({ error: "Sale not found" });
    }
    
    res.json(sale);
  } catch (error) {
    if (error instanceof z.ZodError) {
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

// Customer Routes
router.get("/api/customers", async (req, res) => {
  try {
    const customers = await storage.getCustomers();
    res.json(customers);
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
    if (error instanceof z.ZodError) {
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
    if (error instanceof z.ZodError) {
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

// Expense Categories Routes
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
    if (error instanceof z.ZodError) {
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

// Expenses Routes
router.get("/api/expenses", async (req, res) => {
  try {
    const expenses = await storage.getExpenses();
    res.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

router.post("/api/expenses", async (req, res) => {
  try {
    const validatedData = insertExpenseSchema.parse(req.body);
    const expense = await storage.createExpense(validatedData);
    res.status(201).json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
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
    if (error instanceof z.ZodError) {
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

// Ingredients Routes
router.get("/api/ingredients", async (req, res) => {
  try {
    const ingredients = await storage.getIngredients();
    res.json(ingredients);
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
    if (error instanceof z.ZodError) {
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
    if (error instanceof z.ZodError) {
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

// Analytics Routes
router.get("/api/analytics/dashboard", async (req, res) => {
  try {
    const [sales, expenses, currentStock, customers] = await Promise.all([
      storage.getSales(),
      storage.getExpenses(),
      storage.getCurrentStock(),
      storage.getCustomers()
    ]);

    // Calculate totals
    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.totalPrice), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const netProfit = totalSales - totalExpenses;
    
    // Calculate monthly stats (current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlySales = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    });
    
    const monthlyExpenses = expenses.filter(expense => {
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
      totalCustomers: customers.length,
      monthlySales: monthlyTotalSales,
      monthlyExpenses: monthlyTotalExpenses,
      monthlyProfit: monthlyTotalSales - monthlyTotalExpenses,
      totalQuantitySold: sales.reduce((sum, sale) => sum + sale.quantity, 0),
      averageOrderValue: sales.length > 0 ? totalSales / sales.length : 0
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    res.status(500).json({ error: "Failed to fetch dashboard analytics" });
  }
});

// Recent Activity Route
router.get("/api/analytics/recent-activity", async (req, res) => {
  try {
    const [sales, inventoryMovements, expenses] = await Promise.all([
      storage.getSales(),
      storage.getInventoryMovements(),
      storage.getExpenses()
    ]);

    const activities = [
      ...sales.slice(0, 5).map(sale => ({
        id: `sale-${sale.id}`,
        type: 'sale',
        description: `Sale to ${sale.customerName || 'Customer'}`,
        amount: `ZMW ${Number(sale.totalPrice).toLocaleString()}`,
        quantity: `${sale.quantity} pcs`,
        time: sale.createdAt,
        status: sale.status
      })),
      ...inventoryMovements.slice(0, 5).filter(m => m.type === 'addition').map(movement => ({
        id: `production-${movement.id}`,
        type: 'production',
        description: movement.note || 'Stock addition',
        amount: '',
        quantity: `${movement.quantity} pcs`,
        time: movement.createdAt,
        status: 'completed'
      })),
      ...expenses.slice(0, 3).map(expense => ({
        id: `expense-${expense.id}`,
        type: 'expense',
        description: expense.description,
        amount: `ZMW ${Number(expense.amount).toLocaleString()}`,
        quantity: '',
        time: expense.createdAt,
        status: expense.status
      }))
    ];

    // Sort by time and limit to 10 most recent
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    
    res.json(activities.slice(0, 10));
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({ error: "Failed to fetch recent activity" });
  }
});

export default router;