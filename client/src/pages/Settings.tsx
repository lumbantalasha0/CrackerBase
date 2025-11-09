import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/queryClient";
import { useExpenseUnitsQuery, ExpenseUnit } from "@/hooks/useExpenseUnits";
import useTheme from "@/hooks/useTheme";
import DataTable, { TableColumn } from "@/components/DataTable";
import FormModal from "@/components/FormModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Category = { id?: number; name: string };

async function fetchCategories(): Promise<Category[]> {
  const res = await apiRequest("GET", "/api/expense-categories");
  return res.json();
}

export default function Settings(): JSX.Element {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  // Expense Units hook (list + create + remove + update)
  const expenseUnitsQ = useExpenseUnitsQuery();

  // Expense categories queries/mutations (lightweight inline)
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/expense-categories"],
    queryFn: fetchCategories,
  });

  const [isAddExpenseUnitOpen, setIsAddExpenseUnitOpen] = useState(false);
  const [newExpenseUnit, setNewExpenseUnit] = useState<{ item: string; unitCost: string; unit: string }>({ 
    item: "", 
    unitCost: "0", 
    unit: "Kwacha/kg" 
  });
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerLocation, setNewCustomerLocation] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const expenseUnitColumns: TableColumn[] = [
    { key: "item", label: "Item" },
    { key: "unitCost", label: "Unit Cost (K)", render: (v: any) => `K${parseFloat(v).toFixed(2)}` },
    { key: "unit", label: "Unit" },
  ];

  const categoryColumns: TableColumn[] = [
    { key: "name", label: "Name" },
  ];

  const customerColumns: TableColumn[] = [
    { key: "id", label: "#", render: (v: any, row: any) => row.id ?? '-' },
    { key: "name", label: "Name" },
    { key: "phone", label: "Number", render: (v: any) => v || '-' },
  ];

  async function addCategory() {
    if (!newCategoryName.trim()) return;
    try {
      await apiRequest("POST", "/api/expense-categories", { name: newCategoryName });
      await queryClient.invalidateQueries({ queryKey: ["/api/expense-categories"] });
      setNewCategoryName("");
      setIsAddCategoryOpen(false);
      toast({ title: "Category added" });
    } catch (e: any) {
      toast({ title: "Error adding category", description: e.message || String(e), variant: "destructive" });
    }
  }

  async function deleteCategory(row: any) {
    try {
      await apiRequest("DELETE", `/api/expense-categories/${row.id}`);
      await queryClient.invalidateQueries({ queryKey: ["/api/expense-categories"] });
      toast({ title: "Category removed" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || String(e), variant: "destructive" });
    }
  }

  // Customers
  async function fetchCustomers(): Promise<{ id?: number; name: string }[]> {
    const res = await apiRequest("GET", "/api/customers");
    return res.json();
  }

  async function addCustomer() {
    if (!newCustomerName.trim()) return;
    try {
      await apiRequest("POST", "/api/customers", { name: newCustomerName, phone: newCustomerPhone || undefined, location: newCustomerLocation || undefined });
      await queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerLocation("");
      setIsAddCustomerOpen(false);
      toast({ title: "Customer added" });
    } catch (e: any) {
      toast({ title: "Error adding customer", description: e.message || String(e), variant: "destructive" });
    }
  }

  async function deleteCustomer(row: any) {
    try {
      await apiRequest("DELETE", `/api/customers/${row.id}`);
      await queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Customer removed" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || String(e), variant: "destructive" });
    }
  }

  const { data: customers = [], isLoading: customersLoading } = useQuery<{ id?: number; name: string }[]>({
    queryKey: ["/api/customers"],
    queryFn: fetchCustomers,
  });

  async function handleAddExpenseUnit() {
    if (!newExpenseUnit.item || Number(newExpenseUnit.unitCost) <= 0 || !newExpenseUnit.unit) return;
    try {
      await expenseUnitsQ.create.mutateAsync({ 
        item: newExpenseUnit.item, 
        unitCost: Number(newExpenseUnit.unitCost),
        unit: newExpenseUnit.unit
      });
      setNewExpenseUnit({ item: "", unitCost: "0", unit: "Kwacha/kg" });
      setIsAddExpenseUnitOpen(false);
      toast({ title: "Expense unit added successfully" });
    } catch (e: any) {
      toast({ title: "Error adding expense unit", description: e.message || String(e), variant: "destructive" });
    }
  }

  async function handleDeleteExpenseUnit(row: any) {
    try {
      await expenseUnitsQ.remove.mutateAsync(row.id);
      toast({ title: "Expense unit removed successfully" });
    } catch (e: any) {
      toast({ title: "Error removing expense unit", description: e.message || String(e), variant: "destructive" });
    }
  }

  async function handleChangePin() {
    if (!currentPin || !newPin || !confirmPin) {
      toast({ title: "Error", description: "All PIN fields are required", variant: "destructive" });
      return;
    }
    if (newPin.length !== 4 || confirmPin.length !== 4) {
      toast({ title: "Error", description: "PIN must be 4 digits", variant: "destructive" });
      return;
    }
    if (newPin !== confirmPin) {
      toast({ title: "Error", description: "New PIN and confirmation do not match", variant: "destructive" });
      return;
    }
    try {
      const res = await apiRequest("POST", "/api/auth/change-pin", { currentPin, newPin });
      if (res.ok) {
        toast({ title: "PIN changed successfully" });
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "Failed to change PIN", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || String(e), variant: "destructive" });
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Configure application options and reference data.</p>
      </div>

      {/* Theme */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-2">Theme</h2>
        <div className="flex gap-2">
          <Button variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")}>Light</Button>
          <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")}>Dark</Button>
          <Button variant={theme === "system" ? "default" : "outline"} onClick={() => setTheme("system")}>System</Button>
        </div>
      </section>

      {/* Change PIN */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-3">Change PIN</h2>
        <div className="max-w-md space-y-4">
          <div>
            <Label>Current PIN</Label>
            <Input 
              type="password" 
              inputMode="numeric"
              maxLength={4}
              value={currentPin} 
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter current PIN"
              data-testid="input-current-pin"
            />
          </div>
          <div>
            <Label>New PIN</Label>
            <Input 
              type="password" 
              inputMode="numeric"
              maxLength={4}
              value={newPin} 
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter new 4-digit PIN"
              data-testid="input-new-pin"
            />
          </div>
          <div>
            <Label>Confirm New PIN</Label>
            <Input 
              type="password" 
              inputMode="numeric"
              maxLength={4}
              value={confirmPin} 
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Confirm new PIN"
              data-testid="input-confirm-pin"
            />
          </div>
          <Button onClick={handleChangePin} data-testid="button-change-pin">Change PIN</Button>
        </div>
      </section>

      {/* Expense Units */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Expense Units</h2>
          <div>
            <Button onClick={() => setIsAddExpenseUnitOpen(true)} data-testid="button-add-expense-unit">Add Expense Unit</Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Configure costs per unit for production batch calculations (e.g., Flour at K20/kg, Sugar at K15/kg)
        </p>

        <DataTable
          title="Expense Units"
          columns={expenseUnitColumns}
          data={(expenseUnitsQ.data || []).map((unit: ExpenseUnit) => ({ 
            id: unit.id, 
            item: unit.item, 
            unitCost: unit.unitCost,
            unit: unit.unit 
          }))}
          isLoading={expenseUnitsQ.isLoading}
          onDelete={handleDeleteExpenseUnit}
          emptyMessage="No expense units configured yet"
        />

        <FormModal 
          isOpen={isAddExpenseUnitOpen} 
          onClose={() => setIsAddExpenseUnitOpen(false)} 
          title="Add Expense Unit" 
          onSubmit={handleAddExpenseUnit} 
          submitLabel="Add" 
          isLoading={expenseUnitsQ.create.isPending}
        >
          <div className="space-y-4">
            <div>
              <Label>Item Name</Label>
              <Input 
                value={newExpenseUnit.item} 
                onChange={(e) => setNewExpenseUnit((p) => ({ ...p, item: e.target.value }))}
                placeholder="e.g., Flour, Sugar, Oil"
                data-testid="input-expense-unit-item"
              />
            </div>
            <div>
              <Label>Unit Cost (Kwacha)</Label>
              <Input 
                type="number" 
                step="0.01"
                value={newExpenseUnit.unitCost} 
                onChange={(e) => setNewExpenseUnit((p) => ({ ...p, unitCost: e.target.value }))}
                placeholder="e.g., 20.00"
                data-testid="input-expense-unit-cost"
              />
            </div>
            <div>
              <Label>Unit Type</Label>
              <Input 
                value={newExpenseUnit.unit} 
                onChange={(e) => setNewExpenseUnit((p) => ({ ...p, unit: e.target.value }))}
                placeholder="e.g., Kwacha/kg, Kwacha/litre, Kwacha/unit"
                data-testid="input-expense-unit-type"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Examples: Kwacha/kg, Kwacha/litre, Kwacha/unit
              </p>
            </div>
          </div>
        </FormModal>
      </section>

      {/* Customers */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Customers</h2>
          <div>
            <Button onClick={() => setIsAddCustomerOpen(true)}>Add Customer</Button>
          </div>
        </div>

        <DataTable
          title="Customers"
          columns={customerColumns}
          data={(customers || []).map((c: any) => ({ id: c.id, name: c.name, phone: c.phone }))}
          isLoading={customersLoading}
          onDelete={deleteCustomer}
          emptyMessage="No customers found"
        />

        <FormModal isOpen={isAddCustomerOpen} onClose={() => setIsAddCustomerOpen(false)} title="Add Customer" onSubmit={addCustomer} submitLabel="Add" isLoading={false}>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} />
            </div>
            <div>
              <Label>Phone (Optional)</Label>
              <Input value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} placeholder="Contact phone" />
            </div>
            <div>
              <Label>Location (Optional)</Label>
              <Input value={newCustomerLocation} onChange={(e) => setNewCustomerLocation(e.target.value)} placeholder="e.g., Warehouse A" />
            </div>
          </div>
        </FormModal>
      </section>

      {/* Expense categories */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Expense Categories</h2>
          <div>
            <Button onClick={() => setIsAddCategoryOpen(true)}>Add Category</Button>
          </div>
        </div>

        <DataTable
          title="Categories"
          columns={categoryColumns}
          data={(categories || []).map((c: Category) => ({ id: c.id, name: c.name }))}
          isLoading={categoriesLoading}
          onDelete={deleteCategory}
          emptyMessage="No categories found"
        />

        <FormModal isOpen={isAddCategoryOpen} onClose={() => setIsAddCategoryOpen(false)} title="Add Category" onSubmit={addCategory} submitLabel="Add" isLoading={false}>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
            </div>
          </div>
        </FormModal>
      </section>
    </div>
  );
}