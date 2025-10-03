/*
  # Create Initial Database Schema for Cracker Business App

  ## Overview
  This migration sets up the complete database schema for a cracker manufacturing 
  and sales business management application. The schema includes customer management, 
  inventory tracking, sales records, expense tracking, and production calculator ingredients.

  ## New Tables

  ### 1. customers
  Stores customer information for both regular business clients and one-time customers.
  - `id` (serial, primary key) - Unique customer identifier
  - `name` (text, required) - Customer name
  - `phone` (text, optional) - Contact phone number
  - `business_name` (text, optional) - Business name if applicable
  - `location` (text, optional) - Customer location/address
  - `created_at` (timestamptz, default now()) - Record creation timestamp

  ### 2. inventory_movements
  Tracks all inventory additions and sales with running balance.
  - `id` (serial, primary key) - Unique movement identifier
  - `type` (text, required) - Movement type: 'addition' (production) or 'sale'
  - `quantity` (integer, required) - Number of units moved
  - `balance` (integer, required) - Running stock balance after this movement
  - `note` (text, optional) - Additional notes about the movement
  - `created_at` (timestamptz, default now()) - Movement timestamp

  ### 3. sales
  Records all sales transactions with pricing and customer information.
  - `id` (serial, primary key) - Unique sale identifier
  - `customer_id` (integer, optional, foreign key) - Reference to customers table
  - `customer_name` (text, optional) - Name for walk-in customers
  - `quantity` (integer, required) - Number of units sold
  - `price_per_unit` (numeric, required) - Price per unit in ZMW
  - `total_price` (numeric, required) - Total sale amount in ZMW
  - `status` (text, default 'completed') - Sale status: 'pending' or 'completed'
  - `created_at` (timestamptz, default now()) - Sale timestamp

  ### 4. expense_categories
  Categorizes different types of business expenses.
  - `id` (serial, primary key) - Unique category identifier
  - `name` (text, required) - Category name (e.g., "Raw Materials", "Utilities")
  - `color` (text, default 'blue') - UI color for category display
  - `created_at` (timestamptz, default now()) - Category creation timestamp

  ### 5. expenses
  Tracks all business expenses with categorization.
  - `id` (serial, primary key) - Unique expense identifier
  - `category_id` (integer, optional, foreign key) - Reference to expense_categories
  - `amount` (numeric, required) - Expense amount in ZMW
  - `description` (text, required) - Expense description
  - `notes` (text, optional) - Additional expense notes
  - `status` (text, default 'approved') - Status: 'pending' or 'approved'
  - `created_at` (timestamptz, default now()) - Expense timestamp

  ### 6. ingredients
  Stores ingredient recipes for production calculator.
  - `id` (serial, primary key) - Unique ingredient identifier
  - `name` (text, required) - Ingredient name (e.g., "Salt", "Sugar")
  - `multiplier` (numeric, required) - Ratio per 1kg flour (e.g., 0.02 for 2%)
  - `unit` (text, default 'g') - Measurement unit (g, ml, kg, l)
  - `created_at` (timestamptz, default now()) - Ingredient creation timestamp

  ### 7. settings
  Stores application configuration and user preferences.
  - `id` (serial, primary key) - Unique setting identifier
  - `key` (text, required, unique) - Setting key name
  - `value` (text, required) - Setting value
  - `updated_at` (timestamptz, default now()) - Last update timestamp

  ## Security
  Row Level Security (RLS) is enabled on all tables with restrictive policies.
  Currently configured for public access for demo purposes, but should be 
  restricted to authenticated users in production.

  ## Indexes
  - Index on `sales.customer_id` for fast customer sales lookup
  - Index on `expenses.category_id` for fast category expense lookup
  - Unique index on `settings.key` for unique setting keys

  ## Important Notes
  1. All monetary values use numeric type with precision 10, scale 2 for ZMW currency
  2. Timestamps use timestamptz for timezone-aware dates
  3. Foreign key constraints maintain referential integrity
  4. Default values ensure data consistency
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  business_name TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create inventory_movements table
CREATE TABLE IF NOT EXISTS inventory_movements (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('addition', 'sale')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  balance INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_per_unit NUMERIC(10, 2) NOT NULL CHECK (price_per_unit > 0),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price > 0),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create expense_categories table
CREATE TABLE IF NOT EXISTS expense_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'blue',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES expense_categories(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  multiplier NUMERIC(10, 4) NOT NULL CHECK (multiplier > 0),
  unit TEXT NOT NULL DEFAULT 'g',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Enable Row Level Security on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create public access policies (for demo purposes)
-- In production, these should be restricted to authenticated users

CREATE POLICY "Enable read access for all users" ON customers
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON customers
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON customers
  FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON inventory_movements
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON inventory_movements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON inventory_movements
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON inventory_movements
  FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON sales
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON sales
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON sales
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON sales
  FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON expense_categories
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON expense_categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON expense_categories
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON expense_categories
  FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON expenses
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON expenses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON expenses
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON expenses
  FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON ingredients
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON ingredients
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON ingredients
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON ingredients
  FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON settings
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON settings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON settings
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON settings
  FOR DELETE USING (true);

-- Insert default data

-- Default expense categories
INSERT INTO expense_categories (name, color) VALUES
  ('Raw Materials', 'blue'),
  ('Utilities', 'green'),
  ('Transportation', 'orange'),
  ('Marketing', 'purple'),
  ('Electricity Units', 'yellow')
ON CONFLICT DO NOTHING;

-- Default ingredients
INSERT INTO ingredients (name, multiplier, unit) VALUES
  ('Salt', 0.02, 'g'),
  ('Sugar', 0.05, 'g'),
  ('Oil', 0.15, 'ml'),
  ('Baking Powder', 0.01, 'g'),
  ('Water', 0.4, 'ml')
ON CONFLICT DO NOTHING;

-- Default customers
INSERT INTO customers (name, phone, business_name, location) VALUES
  ('ABC Restaurant', '+260 123 456 789', 'ABC Restaurant Ltd', 'Lusaka'),
  ('John Doe', '+260 987 654 321', 'Corner Store', 'Ndola')
ON CONFLICT DO NOTHING;

-- Initial stock
INSERT INTO inventory_movements (type, quantity, balance, note) VALUES
  ('addition', 1250, 1250, 'Initial stock')
ON CONFLICT DO NOTHING;