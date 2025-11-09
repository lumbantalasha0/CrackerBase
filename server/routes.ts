import { Router } from "express";
import { storage } from "./storage";
import { 
  insertCustomerSchema,
  insertInventoryMovementSchema,
  insertSaleSchema,
  insertExpenseCategorySchema,
  insertExpenseSchema,
  insertExpenseUnitSchema
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
    const body: any = { ...req.body };
    // debug: log incoming payload to troubleshoot occasional validation failures
    // eslint-disable-next-line no-console
    console.log('POST /api/sales body:', JSON.stringify(body));
    // coerce numeric fields if sent as strings
  if (body.quantity !== undefined) body.quantity = Number(body.quantity);
  if (body.pricePerUnit !== undefined) body.pricePerUnit = Number(body.pricePerUnit);
  // normalize customerId: treat null as undefined so z.number().optional() accepts missing value
  if (body.customerId === null) delete body.customerId;
  else if (body.customerId !== undefined) body.customerId = Number(body.customerId);
    const validatedData = insertSaleSchema.parse(body);
    const sale = await storage.createSale(validatedData);
    res.status(201).json(sale);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // eslint-disable-next-line no-console
      console.error('Sale validation error:', JSON.stringify(error.errors, null, 2));
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
    const body: any = { ...req.body };
    if (body.quantity !== undefined) body.quantity = Number(body.quantity);
    if (body.pricePerUnit !== undefined) body.pricePerUnit = Number(body.pricePerUnit);
    if (body.customerId !== undefined) body.customerId = body.customerId === null ? null : Number(body.customerId);
    const validatedData = insertSaleSchema.partial().parse(body);
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

// Create expense from units (helper endpoint) - computes amount = units * 2.34
router.post('/api/expenses/units', async (req, res) => {
  try {
    const { categoryId, units, description, notes } = req.body as any;
    const u = Number(units || 0);
    const amount = Number((u * 2.34).toFixed(2));
    const payload = {
      categoryId: categoryId ?? null,
      amount,
      description: description || 'Units expense',
      notes: notes ? String(notes) : `units:${u}`,
      status: 'approved'
    };
    const validated = insertExpenseSchema.parse(payload);
    const expense = await storage.createExpense(validated);
    res.status(201).json(expense);
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: e.errors });
    } else {
      console.error('Error creating units expense', e);
      res.status(500).json({ error: 'Failed to create expense' });
    }
  }
});

router.post("/api/expenses", async (req, res) => {
  try {
    // Support special handling for unit-based expenses where client may send { units }
    const body: any = { ...req.body };
    try {
      // If client included `units` and didn't include `amount`, compute amount using default rate.
      // This makes the flow robust even if category naming differs or client omits amount.
      if (body.units !== undefined && (body.amount === undefined || body.amount === null || body.amount === '')) {
        const units = Number(body.units) || 0;
        // 1 Unit = ZMW 2.34 (business rule)
        body.amount = Number((units * 2.34).toFixed(2));
        body.notes = (body.notes ? body.notes + ' ' : '') + `units:${units}`;
      } else {
        // legacy: also check specific category name and compute if necessary
        try {
          const categories = await storage.getExpenseCategories();
          const cat = categories.find((c: any) => c.id === body.categoryId);
          if (cat && typeof cat.name === 'string' && cat.name.toLowerCase() === 'electricity units' && body.units !== undefined) {
            const units = Number(body.units) || 0;
            body.amount = Number((units * 2.34).toFixed(2));
            body.notes = (body.notes ? body.notes + ' ' : '') + `units:${units}`;
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore and proceed with validation
    }

    // debug: log body to troubleshoot unit->amount conversion issues
    // eslint-disable-next-line no-console
    console.log('Creating expense, body before validation:', JSON.stringify(body));
    let validatedData;
    try {
      validatedData = insertExpenseSchema.parse(body);
    } catch (err) {
      // If validation failed because amount was missing, but units are provided, compute amount and retry
      if (err instanceof z.ZodError) {
        const hasAmountIssue = err.errors.some(e => e.path?.[0] === 'amount');
        if (hasAmountIssue && body.units !== undefined) {
          try {
            const units = Number(body.units) || 0;
            body.amount = Number((units * 2.34).toFixed(2));
            body.notes = (body.notes ? body.notes + ' ' : '') + `units:${units}`;
            validatedData = insertExpenseSchema.parse(body);
          } catch (e2) {
            // fallthrough to rethrow original
          }
        }
      }
      if (!validatedData) throw err;
    }
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

// Expense Units Routes - tracks cost per unit for production calculations
router.get("/api/expense-units", async (req, res) => {
  try {
    const expenseUnits = await storage.getExpenseUnits();
    res.json(expenseUnits);
  } catch (error) {
    console.error("Error fetching expense units:", error);
    res.status(500).json({ error: "Failed to fetch expense units" });
  }
});

router.post("/api/expense-units", async (req, res) => {
  try {
    const validatedData = insertExpenseUnitSchema.parse(req.body);
    const expenseUnit = await storage.createExpenseUnit(validatedData);
    res.status(201).json(expenseUnit);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
    } else {
      console.error("Error creating expense unit:", error);
      res.status(500).json({ error: "Failed to create expense unit" });
    }
  }
});

router.put("/api/expense-units/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertExpenseUnitSchema.partial().parse(req.body);
    const expenseUnit = await storage.updateExpenseUnit(id, validatedData);
    
    if (!expenseUnit) {
      return res.status(404).json({ error: "Expense unit not found" });
    }
    
    res.json(expenseUnit);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
    } else {
      console.error("Error updating expense unit:", error);
      res.status(500).json({ error: "Failed to update expense unit" });
    }
  }
});

router.delete("/api/expense-units/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteExpenseUnit(id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Expense unit not found" });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting expense unit:", error);
    res.status(500).json({ error: "Failed to delete expense unit" });
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
      // aliases expected by client
      stockRemaining: currentStock,
      avgOrderValue: sales.length > 0 ? totalSales / sales.length : 0,
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

// Top customers (for Reports page)
router.get('/api/analytics/top-customers', async (req, res) => {
  try {
    const sales = await storage.getSales();
    const customers = await storage.getCustomers();

    // aggregate by customerId
    const agg: Record<number, { id: number; name: string; purchases: number; total: number }> = {};
    for (const s of sales) {
      const cid = s.customerId ?? 0;
      if (!agg[cid]) agg[cid] = { id: cid, name: (s.customerName || (customers.find(c=>c.id===cid)?.name) || 'Walk-in'), purchases: 0, total: 0 };
      agg[cid].purchases += 1;
      agg[cid].total += Number(s.totalPrice || 0);
    }

    const arr = Object.values(agg).sort((a,b) => b.total - a.total).slice(0,5);
    res.json(arr);
  } catch (e) {
    console.error('Error computing top customers', e);
    res.status(500).json({ error: 'Failed to compute top customers' });
  }
});

// AI Assistant Routes
router.post("/api/ai/chat", async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API key not configured" });
    }

    const systemPrompt = `You are the BEMACHO AI Assistant — an intelligent operations helper inside the "BEMACHO Crackers Manager" system.

Your role:
- Interpret natural language input from the user describing their daily activities (sales, purchases, expenses, or production).
- Convert the described information into structured data that can be directly entered into the system's database.
- Ask clarifying questions if the input is incomplete or ambiguous.
- Never invent data — only use what's provided or confirmed by the user.

System Overview:
BEMACHO Crackers Manager is a business management web app for a crackers manufacturing and retail business in Zambia (currency: Kwacha/K or ZMW). It manages:
- Inventory (crackers, ingredients, packaging)
- Sales (customer transactions)
- Expenses (supplies, utilities, packaging, etc.)
- Production (batch size, ingredients used)

Database Entities:
- **Sales**: {date, customerName, quantity, pricePerUnit, totalAmount, notes}
- **Expenses**: {date, categoryName, amount, description} - categoryName will be mapped to actual category ID
- **Inventory Movements**: {date, type ("addition" | "removal"), quantity, notes}
- **Customers**: {name, phone, location}

Your task:
1. Understand user input like:
   - "I sold 15 packs for K30 each to John."
   - "We bought 25kg of flour for K350."
   - "Produced 200 packs today."
   - "Electricity bill K650 today."

2. Output a JSON object representing the action to take:
   {
     "action": "create_sale" | "create_expense" | "create_inventory" | "create_customer" | "clarify",
     "data": { ...fields based on action... },
     "message": "Brief confirmation message"
   }

3. If something's unclear, use action "clarify" and ask a question.

Examples:
User: "Sold 10 packs for K25 each to Chanda"
AI: {"action": "create_sale", "data": {"customerName": "Chanda", "quantity": 10, "pricePerUnit": 25, "totalAmount": 250, "date": "${new Date().toISOString().split('T')[0]}"}, "message": "Recorded sale of 10 packs to Chanda for K250"}

User: "Bought sugar K400"
AI: {"action": "create_expense", "data": {"categoryName": "Sugar", "amount": 400, "description": "Purchased sugar", "date": "${new Date().toISOString().split('T')[0]}"}, "message": "Recorded expense: Sugar K400"}

User: "Bought flour K500"
AI: {"action": "create_expense", "data": {"categoryName": "Flour", "amount": 500, "description": "Purchased flour", "date": "${new Date().toISOString().split('T')[0]}"}, "message": "Recorded expense: Flour K500"}

User: "Produced 200 packs"
AI: {"action": "create_inventory", "data": {"type": "addition", "quantity": 200, "notes": "Production batch", "date": "${new Date().toISOString().split('T')[0]}"}, "message": "Added 200 packs to inventory"}

Behavior Rules:
- Always output valid JSON only (no markdown, no extra text)
- Use today's date unless specified
- Use title case for names
- For expenses, return the categoryName (e.g., "Flour", "Sugar", "Oil", "Packaging", "Electricity") - it will be mapped to the correct ID
- Ask for missing info only once before assuming defaults`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      return res.status(response.status).json({ error: "AI service error" });
    }

    const aiResponse = await response.json();
    const aiMessage = aiResponse.choices[0].message.content;

    // Try to parse the AI response as JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiMessage);
    } catch (e) {
      // If AI didn't return JSON, treat it as a clarification
      parsedResponse = {
        action: "clarify",
        message: aiMessage
      };
    }

    // Handle the action
    let result: any = { success: false, message: parsedResponse.message };

    if (parsedResponse.action === "create_sale") {
      try {
        const saleData = insertSaleSchema.parse(parsedResponse.data);
        const sale = await storage.createSale(saleData);
        result = { success: true, data: sale, message: parsedResponse.message };
      } catch (error) {
        console.error("Error creating sale:", error);
        result = { success: false, message: "Failed to create sale. Please try again." };
      }
    } else if (parsedResponse.action === "create_expense") {
      try {
        // Fetch expense categories to map category name to ID
        const categories = await storage.getExpenseCategories();
        const categoryName = parsedResponse.data.categoryName;
        
        if (!categoryName) {
          result = { success: false, message: "Please specify which expense category (e.g., Flour, Sugar, Oil, Packaging, Electricity)" };
        } else {
          // Find matching category (case-insensitive)
          const category = categories.find(
            (cat: any) => cat.name.toLowerCase() === categoryName.toLowerCase()
          );
          
          if (!category) {
            result = { success: false, message: `Category "${categoryName}" not found. Available categories: ${categories.map((c: any) => c.name).join(', ')}` };
          } else {
            // Replace categoryName with categoryId
            const expenseDataWithId = {
              ...parsedResponse.data,
              categoryId: category.id
            };
            delete expenseDataWithId.categoryName;
            
            const expenseData = insertExpenseSchema.parse(expenseDataWithId);
            const expense = await storage.createExpense(expenseData);
            result = { success: true, data: expense, message: parsedResponse.message };
          }
        }
      } catch (error) {
        console.error("Error creating expense:", error);
        result = { success: false, message: "Failed to create expense. Please try again." };
      }
    } else if (parsedResponse.action === "create_inventory") {
      try {
        const inventoryData = insertInventoryMovementSchema.parse(parsedResponse.data);
        const movement = await storage.createInventoryMovement(inventoryData);
        result = { success: true, data: movement, message: parsedResponse.message };
      } catch (error) {
        console.error("Error creating inventory movement:", error);
        result = { success: false, message: "Failed to create inventory movement. Please try again." };
      }
    } else if (parsedResponse.action === "create_customer") {
      try {
        const customerData = insertCustomerSchema.parse(parsedResponse.data);
        const customer = await storage.createCustomer(customerData);
        result = { success: true, data: customer, message: parsedResponse.message };
      } catch (error) {
        console.error("Error creating customer:", error);
        result = { success: false, message: "Failed to create customer. Please try again." };
      }
    } else if (parsedResponse.action === "clarify") {
      result = { success: true, clarification: true, message: parsedResponse.message };
    }

    res.json(result);
  } catch (error) {
    console.error("Error in AI chat:", error);
    res.status(500).json({ error: "Failed to process AI request" });
  }
});

export default router;

// Additional analytics endpoints
router.get('/api/analytics/sales-over-time', async (req, res) => {
  try {
    const sales = await storage.getSales();
    // Return data grouped by day for last 30 days
    const now = new Date();
    const days = 30;
    const out: any[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const daySales = sales.filter(s => (new Date(s.createdAt)).toISOString().slice(0,10) === dateKey);
      const total = daySales.reduce((sum, s) => sum + Number(s.totalPrice), 0);
      out.push({ date: dateKey, total, count: daySales.length });
    }
    res.json(out);
  } catch (e) {
    console.error('Error sales-over-time', e);
    res.status(500).json({ error: 'Failed to compute sales over time' });
  }
});

router.get('/api/analytics/production-over-time', async (req, res) => {
  try {
    const movements = await storage.getInventoryMovements();
    const now = new Date();
    const days = 30;
    const out: any[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const dayMovements = movements.filter(m => (new Date(m.createdAt)).toISOString().slice(0,10) === dateKey);
      const produced = dayMovements.filter(m => m.type === 'addition').reduce((s, m) => s + m.quantity, 0);
      const sold = dayMovements.filter(m => m.type === 'sale').reduce((s, m) => s + m.quantity, 0);
      out.push({ date: dateKey, produced, sold });
    }
    res.json(out);
  } catch (e) {
    console.error('Error production-over-time', e);
    res.status(500).json({ error: 'Failed to compute production over time' });
  }
});

router.get('/api/analytics/aggregates', async (req, res) => {
  try {
    const [sales, expenses] = await Promise.all([storage.getSales(), storage.getExpenses()]);
    const now = new Date();

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const daySales = sales.filter(s => new Date(s.createdAt) >= startOfDay);
    const weekSales = sales.filter(s => new Date(s.createdAt) >= startOfWeek);
    const monthSales = sales.filter(s => new Date(s.createdAt) >= startOfMonth);

    const dayExpenses = expenses.filter(e => new Date(e.createdAt) >= startOfDay);
    const weekExpenses = expenses.filter(e => new Date(e.createdAt) >= startOfWeek);
    const monthExpenses = expenses.filter(e => new Date(e.createdAt) >= startOfMonth);

    const sum = (arr: any[], key: string) => arr.reduce((s, x) => s + Number(x[key] || 0), 0);

    res.json({
      dailyProfit: sum(daySales, 'totalPrice') - sum(dayExpenses, 'amount'),
      weeklyProfit: sum(weekSales, 'totalPrice') - sum(weekExpenses, 'amount'),
      monthlyProfit: sum(monthSales, 'totalPrice') - sum(monthExpenses, 'amount'),
      lastSaleTime: sales.length ? sales[0].createdAt : null,
      lastExpenseTime: expenses.length ? expenses[0].createdAt : null
    });
  } catch (e) {
    console.error('Error aggregates', e);
    res.status(500).json({ error: 'Failed to compute aggregates' });
  }
});

// Prediction endpoint (simple, runs in-process)
import predictTrends from './predict/trends';

router.post('/api/v1/predict/trends', async (req, res) => {
  try {
    const payload = req.body || {};
    const result = await predictTrends(payload);
    res.status(200).json(result.predictions || result);
  } catch (e) {
    console.error('Error running predict/trends', e);
    res.status(500).json({ error: 'Failed to run predictions' });
  }
});