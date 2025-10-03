-- Ensure required tables exist for Crackerbase app
-- Run this in the Supabase SQL editor (SQL -> New query) for your project.

-- Enable the pgcrypto extension for gen_random_uuid() if not present
create extension if not exists pgcrypto;

-- Customers
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  business_name text,
  location text,
  created_at timestamptz default now()
);

-- Sales
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  customer_id text,
  customer_name text,
  quantity integer,
  price_per_unit numeric,
  total_price numeric,
  status text,
  created_at timestamptz default now()
);

-- Inventory movements
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  type text,
  quantity integer,
  balance numeric,
  note text,
  created_at timestamptz default now()
);

-- Ingredients
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text,
  multiplier numeric,
  unit text,
  created_at timestamptz default now()
);

-- Expense categories
create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text,
  color text,
  created_at timestamptz default now()
);

-- Expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  category_id text,
  amount numeric,
  description text,
  notes text,
  status text,
  created_at timestamptz default now()
);

-- Settings
create table if not exists public.settings (
  key text primary key,
  value text
);

-- Debug table used by debug-supabase function
create table if not exists public.debug_table (
  id serial primary key,
  note text,
  created_at timestamptz default now()
);
