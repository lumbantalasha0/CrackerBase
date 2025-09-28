import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DataTable, { TableColumn, TableRow } from "@/components/DataTable";
import FormModal from "@/components/FormModal";
import { Settings as SettingsIcon, Users, Tag, Calculator, Shield, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Mock data - todo: remove mock functionality
const mockCustomers: TableRow[] = [
  {
    id: 1,
    name: "ABC Restaurant",
    phone: "+260 123 456 789",
    businessName: "ABC Restaurant Ltd",
    location: "Lusaka"
  },
  {
    id: 2,
    name: "John Doe",
    phone: "+260 987 654 321",
    businessName: "Corner Store",
    location: "Ndola"
  }
];

const mockExpenseTypes: TableRow[] = [
  { id: 1, name: "Raw Materials", color: "blue" },
  { id: 2, name: "Utilities", color: "green" },
  { id: 3, name: "Transportation", color: "orange" },
  { id: 4, name: "Marketing", color: "purple" }
];

const mockIngredients = [
  { name: "Salt", multiplier: 0.02 },
  { name: "Sugar", multiplier: 0.05 },
  { name: "Oil", multiplier: 0.15 },
  { name: "Baking Powder", multiplier: 0.01 },
  { name: "Water", multiplier: 0.4 }
];

const customerColumns: TableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'phone', label: 'Phone' },
  { key: 'businessName', label: 'Business', sortable: true },
  { key: 'location', label: 'Location' }
];

const expenseTypeColumns: TableColumn[] = [
  { 
    key: 'name', 
    label: 'Expense Type', 
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full bg-${row.color}-500`} />
        {value}
      </div>
    )
  }
];

interface CustomerForm {
  name: string;
  phone: string;
  businessName: string;
  location: string;
}

interface ExpenseTypeForm {
  name: string;
}

interface IngredientForm {
  name: string;
  multiplier: string;
}

export default function Settings() {
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isExpenseTypeModalOpen, setIsExpenseTypeModalOpen] = useState(false);
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  
  const [customerForm, setCustomerForm] = useState<CustomerForm>({
    name: '', phone: '', businessName: '', location: ''
  });
  const [expenseTypeForm, setExpenseTypeForm] = useState<ExpenseTypeForm>({ name: '' });
  const [ingredientForm, setIngredientForm] = useState<IngredientForm>({ name: '', multiplier: '' });
  const [pinForm, setPinForm] = useState({ currentPin: '', newPin: '', confirmPin: '' });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAddCustomer = async () => {
    setIsSubmitting(true);
    setTimeout(() => {
      console.log('Adding customer:', customerForm);
      toast({
        title: "Customer Added",
        description: `${customerForm.name} has been added successfully.`,
      });
      setCustomerForm({ name: '', phone: '', businessName: '', location: '' });
      setIsCustomerModalOpen(false);
      setIsSubmitting(false);
    }, 1000);
  };

  const handleAddExpenseType = async () => {
    setIsSubmitting(true);
    setTimeout(() => {
      console.log('Adding expense type:', expenseTypeForm);
      toast({
        title: "Expense Type Added",
        description: `${expenseTypeForm.name} has been added successfully.`,
      });
      setExpenseTypeForm({ name: '' });
      setIsExpenseTypeModalOpen(false);
      setIsSubmitting(false);
    }, 1000);
  };

  const handleAddIngredient = async () => {
    setIsSubmitting(true);
    setTimeout(() => {
      console.log('Adding ingredient:', ingredientForm);
      toast({
        title: "Ingredient Added",
        description: `${ingredientForm.name} ratio has been set successfully.`,
      });
      setIngredientForm({ name: '', multiplier: '' });
      setIsIngredientModalOpen(false);
      setIsSubmitting(false);
    }, 1000);
  };

  const handleUpdatePin = async () => {
    if (pinForm.newPin !== pinForm.confirmPin) {
      toast({
        title: "Error",
        description: "New PIN and confirmation don't match.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    setTimeout(() => {
      console.log('Updating PIN');
      toast({
        title: "PIN Updated",
        description: "Your PIN has been updated successfully.",
      });
      setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
      setIsPinModalOpen(false);
      setIsSubmitting(false);
    }, 1000);
  };

  const handleExportData = async () => {
    toast({
      title: "Export Started",
      description: "Your data export is being prepared...",
    });
    
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: "All data has been exported successfully.",
      });
    }, 2000);
  };

  const handleDeleteCustomer = (row: TableRow) => {
    console.log('Delete customer:', row);
    toast({
      title: "Customer Deleted",
      description: "Customer has been removed.",
      variant: "destructive"
    });
  };

  const handleDeleteExpenseType = (row: TableRow) => {
    console.log('Delete expense type:', row);
    toast({
      title: "Expense Type Deleted", 
      description: "Expense type has been removed.",
      variant: "destructive"
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your business settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Customers Management */}
        <div className="space-y-6">
          <DataTable
            title="Customers"
            columns={customerColumns}
            data={mockCustomers}
            searchPlaceholder="Search customers..."
            onAdd={() => setIsCustomerModalOpen(true)}
            onDelete={handleDeleteCustomer}
            addLabel="Add Customer"
            emptyMessage="No customers found"
          />

          <DataTable
            title="Expense Types"
            columns={expenseTypeColumns}
            data={mockExpenseTypes}
            searchPlaceholder="Search expense types..."
            onAdd={() => setIsExpenseTypeModalOpen(true)}
            onDelete={handleDeleteExpenseType}
            addLabel="Add Type"
            emptyMessage="No expense types found"
          />
        </div>

        {/* Other Settings */}
        <div className="space-y-6">
          {/* Ingredient Multipliers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Ingredient Multipliers (per 1kg flour)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockIngredients.map((ingredient, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">{ingredient.name}</span>
                  <Badge variant="outline">
                    {ingredient.multiplier} {['Oil', 'Water'].includes(ingredient.name) ? 'L' : 'kg'}
                  </Badge>
                </div>
              ))}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsIngredientModalOpen(true)}
                data-testid="button-add-ingredient"
              >
                Add Ingredient
              </Button>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">PIN Protection</p>
                  <p className="text-sm text-muted-foreground">Current PIN: ****</p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setIsPinModalOpen(true)}
                  data-testid="button-change-pin"
                >
                  Change PIN
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Export & Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export & Backup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Export all your business data for backup or analysis
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleExportData}
                  data-testid="button-export-data"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Customer Modal */}
      <FormModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Add Customer"
        description="Add a new customer to your database"
        onSubmit={handleAddCustomer}
        submitLabel="Add Customer"
        isSubmitting={isSubmitting}
        submitDisabled={!customerForm.name}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={customerForm.name}
              onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Customer name"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={customerForm.phone}
              onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+260 123 456 789"
            />
          </div>
          <div>
            <Label htmlFor="business">Business Name</Label>
            <Input
              id="business"
              value={customerForm.businessName}
              onChange={(e) => setCustomerForm(prev => ({ ...prev, businessName: e.target.value }))}
              placeholder="Business name"
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={customerForm.location}
              onChange={(e) => setCustomerForm(prev => ({ ...prev, location: e.target.value }))}
              placeholder="City/Location"
            />
          </div>
        </div>
      </FormModal>

      {/* Add Expense Type Modal */}
      <FormModal
        isOpen={isExpenseTypeModalOpen}
        onClose={() => setIsExpenseTypeModalOpen(false)}
        title="Add Expense Type"
        description="Create a new expense category"
        onSubmit={handleAddExpenseType}
        submitLabel="Add Type"
        isSubmitting={isSubmitting}
        submitDisabled={!expenseTypeForm.name}
      >
        <div>
          <Label htmlFor="expenseTypeName">Expense Type Name</Label>
          <Input
            id="expenseTypeName"
            value={expenseTypeForm.name}
            onChange={(e) => setExpenseTypeForm({ name: e.target.value })}
            placeholder="e.g. Office Supplies, Equipment"
          />
        </div>
      </FormModal>

      {/* Add Ingredient Modal */}
      <FormModal
        isOpen={isIngredientModalOpen}
        onClose={() => setIsIngredientModalOpen(false)}
        title="Add Ingredient"
        description="Set ingredient ratio per 1kg flour"
        onSubmit={handleAddIngredient}
        submitLabel="Add Ingredient"
        isSubmitting={isSubmitting}
        submitDisabled={!ingredientForm.name || !ingredientForm.multiplier}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="ingredientName">Ingredient Name</Label>
            <Input
              id="ingredientName"
              value={ingredientForm.name}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Salt, Eggs"
            />
          </div>
          <div>
            <Label htmlFor="multiplier">Multiplier (ratio per 1kg flour)</Label>
            <Input
              id="multiplier"
              type="number"
              step="0.01"
              value={ingredientForm.multiplier}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, multiplier: e.target.value }))}
              placeholder="0.02"
            />
          </div>
        </div>
      </FormModal>

      {/* Change PIN Modal */}
      <FormModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title="Change PIN"
        description="Update your security PIN"
        onSubmit={handleUpdatePin}
        submitLabel="Update PIN"
        isSubmitting={isSubmitting}
        submitDisabled={!pinForm.currentPin || !pinForm.newPin || !pinForm.confirmPin}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="currentPin">Current PIN</Label>
            <Input
              id="currentPin"
              type="password"
              value={pinForm.currentPin}
              onChange={(e) => setPinForm(prev => ({ ...prev, currentPin: e.target.value }))}
              placeholder="Enter current PIN"
            />
          </div>
          <div>
            <Label htmlFor="newPin">New PIN</Label>
            <Input
              id="newPin"
              type="password"
              value={pinForm.newPin}
              onChange={(e) => setPinForm(prev => ({ ...prev, newPin: e.target.value }))}
              placeholder="Enter new PIN"
            />
          </div>
          <div>
            <Label htmlFor="confirmPin">Confirm New PIN</Label>
            <Input
              id="confirmPin"
              type="password"
              value={pinForm.confirmPin}
              onChange={(e) => setPinForm(prev => ({ ...prev, confirmPin: e.target.value }))}
              placeholder="Confirm new PIN"
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
}