import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gncsoanjpxfhhioknzkr.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Customers
export async function fetchCustomers() {
	const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
	return { data, error }
}

export async function fetchCustomer(id: number) {
	const { data, error } = await supabase.from('customers').select('*').eq('id', id).limit(1)
	return { data: data && data[0], error }
}

export async function insertCustomer(payload: any) {
	const { data, error } = await supabase.from('customers').insert({ ...payload }).select().limit(1)
	return { data: data && data[0], error }
}

export async function updateCustomer(id: number, payload: any) {
	const { data, error } = await supabase.from('customers').update(payload).eq('id', id).select().limit(1)
	return { data: data && data[0], error }
}

export async function deleteCustomer(id: number) {
	const { error } = await supabase.from('customers').delete().eq('id', id)
	return { error }
}

// Inventory movements
export async function fetchInventoryMovements() {
	const { data, error } = await supabase.from('inventory_movements').select('*').order('created_at', { ascending: false })
	return { data, error }
}

export async function insertInventoryMovement(payload: any) {
	const { data, error } = await supabase.from('inventory_movements').insert({ ...payload }).select().limit(1)
	return { data: data && data[0], error }
}

export async function updateInventoryMovement(id: number, payload: any) {
	const { data, error } = await supabase.from('inventory_movements').update(payload).eq('id', id).select().limit(1)
	return { data: data && data[0], error }
}

export async function deleteInventoryMovement(id: number) {
	const { error } = await supabase.from('inventory_movements').delete().eq('id', id)
	return { error }
}

// Sales
export async function fetchSales() {
	const { data, error } = await supabase.from('sales').select('*').order('created_at', { ascending: false })
	return { data, error }
}

export async function insertSale(payload: any) {
	const { data, error } = await supabase.from('sales').insert({ ...payload }).select().limit(1)
	return { data: data && data[0], error }
}

export async function updateSale(id: number, payload: any) {
	const { data, error } = await supabase.from('sales').update(payload).eq('id', id).select().limit(1)
	return { data: data && data[0], error }
}

export async function deleteSale(id: number) {
	const { error } = await supabase.from('sales').delete().eq('id', id)
	return { error }
}

// Ingredients
export async function fetchIngredients() {
	const { data, error } = await supabase.from('ingredients').select('*').order('created_at', { ascending: false })
	return { data, error }
}

export async function insertIngredient(payload: any) {
	const { data, error } = await supabase.from('ingredients').insert({ ...payload }).select().limit(1)
	return { data: data && data[0], error }
}

export async function updateIngredient(id: number, payload: any) {
	const { data, error } = await supabase.from('ingredients').update(payload).eq('id', id).select().limit(1)
	return { data: data && data[0], error }
}

export async function deleteIngredient(id: number) {
	const { error } = await supabase.from('ingredients').delete().eq('id', id)
	return { error }
}

// Expense categories
export async function fetchExpenseCategories() {
	const { data, error } = await supabase.from('expense_categories').select('*').order('created_at', { ascending: false })
	return { data, error }
}

export async function insertExpenseCategory(payload: any) {
	const { data, error } = await supabase.from('expense_categories').insert({ ...payload }).select().limit(1)
	return { data: data && data[0], error }
}

// Expenses
export async function fetchExpenses() {
	const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false })
	return { data, error }
}

export async function insertExpense(payload: any) {
	const { data, error } = await supabase.from('expenses').insert({ ...payload }).select().limit(1)
	return { data: data && data[0], error }
}

// Settings
export async function fetchSetting(key: string) {
	const { data, error } = await supabase.from('settings').select('value').eq('key', key).limit(1)
	return { data: data && data[0] && data[0].value, error }
}

export async function upsertSetting(key: string, value: string) {
	const { data, error } = await supabase.from('settings').upsert({ key, value }).select().limit(1)
	return { data: data && data[0], error }
}
