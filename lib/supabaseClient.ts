// All Supabase-based methods removed — this project uses Neon/Postgres.
// If you previously used this lib to talk directly to Supabase from the server,
// switch to the server helper at `server/supabase.ts` (which exports `dbQuery` and `dbEnabled`) or
// call your Netlify function endpoints which interact with Neon.

function notSupported() {
  throw new Error('Direct Supabase usage removed. Use Neon via server/supabase.ts or server API endpoints.');
}

export const supabase = null;
export const fetchCustomers = () => notSupported();
export const fetchCustomer = (_id: number) => notSupported();
export const insertCustomer = (_payload: any) => notSupported();
export const updateCustomer = (_id: number, _payload: any) => notSupported();
export const deleteCustomer = (_id: number) => notSupported();

export const fetchInventoryMovements = () => notSupported();
export const insertInventoryMovement = (_p: any) => notSupported();
export const updateInventoryMovement = (_id: number, _p: any) => notSupported();
export const deleteInventoryMovement = (_id: number) => notSupported();

export const fetchSales = () => notSupported();
export const insertSale = (_p: any) => notSupported();
export const updateSale = (_id: number, _p: any) => notSupported();
export const deleteSale = (_id: number) => notSupported();

export const fetchIngredients = () => notSupported();
export const insertIngredient = (_p: any) => notSupported();
export const updateIngredient = (_id: number, _p: any) => notSupported();
export const deleteIngredient = (_id: number) => notSupported();

export const fetchExpenseCategories = () => notSupported();
export const insertExpenseCategory = (_p: any) => notSupported();

export const fetchExpenses = () => notSupported();
export const insertExpense = (_p: any) => notSupported();

export const fetchSetting = (_k: string) => notSupported();
export const upsertSetting = (_k: string, _v: string) => notSupported();
