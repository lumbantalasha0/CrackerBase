export type ProductRow = {
  id: number;
  name: string;
  threshold: number;
  total_in?: number;
  total_out?: number;
  balance?: number;
};

export type StockEntryRow = {
  id: number;
  product_id: number;
  qty: number;
  supplier?: string;
  date?: string;
};

export type SaleRow = {
  id: number;
  product_id: number;
  qty: number;
  price: number;
  // buyer can be resolved to a customer id (buyerId) or a free-form buyerName for quick entries
  buyerId?: number;
  buyerName?: string;
  date?: string;
  productName?: string;
  // resolved customer name (convenience)
  customerName?: string;
};

export type ExpenseRow = {
  id: number;
  category: string;
  amount: number;
  date?: string;
  notes?: string;
};

export type CustomerRow = {
  id: number;
  name: string;
  phone?: string;
  businessName?: string;
  location?: string;
};

export type CalculatorUnit = {
  ingredient: string;
  unitName: string; // e.g. "bag", "kg", "L"
  unitValue: number; // how many grams/liters per unit (standardized base value)
};

export type CalculatorResult = {
  id: number;
  title?: string;
  result: number; // number of crackers producible
  details?: Record<string, number>; // per-ingredient production limits
  date: string;
};

export type ExpenseType = {
  id: number;
  name: string;
};

export type IngredientMultiplier = {
  id: number;
  ingredient: string;
  // grams (or ml) required per 1 kg of flour
  perKg: number;
};

export type ExportData = {
  products: ProductRow[];
  stock_entries: StockEntryRow[];
  sales: SaleRow[];
  expenses: ExpenseRow[];
  customers: CustomerRow[];
  calculator_units: CalculatorUnit[];
  calculator_results: CalculatorResult[];
  expense_types: ExpenseType[];
  ingredient_multipliers: IngredientMultiplier[];
};
