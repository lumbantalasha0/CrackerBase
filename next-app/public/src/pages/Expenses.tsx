import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DataTable, { TableColumn, TableRow } from "@/components/DataTable";
import FormModal from "@/components/FormModal";
import StatsCard from "@/components/StatsCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, TrendingDown, Calendar, Tag } from "lucide-react";
import Badge from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/queryClient";


const expenseColumns: TableColumn[] = [
  {
    key: 'date',
    label: 'Date',
    sortable: true
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true,
    render: (value) => (
      <Badge variant="outline">{value}</Badge>
    )
  },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true,
    render: (value) => `ZMW ${value.toLocaleString()}`
  },
  {
    key: 'description',
    label: 'Description'
  },
  {
    key: 'status',
    label: 'Status',
    render: (value) => (
      <Badge variant={value === 'approved' ? 'default' : 'secondary'}>
        {value}
      </Badge>
    )
  }
];

interface ExpenseForm {
  category: string;
  amount: string;
  description: string;
  notes: string;
}

export default function Expenses() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>({ 
    category: '', 
    amount: '', 
    description: '',
    notes: ''
  });
  const { toast } = useToast();

  // Fetch expenses data
  const { data: expensesDataRaw, isLoading: expensesLoading } = useQuery<any[]>({
    queryKey: ['/api/expenses']
  });
  const expensesData: any[] = Array.isArray(expensesDataRaw) ? expensesDataRaw : [];

  // Fetch expense categories
  const { data: categoriesDataRaw } = useQuery<any[]>({
    queryKey: ['/api/expense-categories']
  });
  const categoriesData: any[] = Array.isArray(categoriesDataRaw) ? categoriesDataRaw : [];

  // Calculate stats from real data
  const stats = {
    totalExpenses: expensesData.reduce((sum: number, expense: any) => sum + Number(expense.amount), 0),
    thisMonth: expensesData.filter((expense: any) => {
      const expenseDate = new Date(expense.createdAt);
      const now = new Date();
      return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
    }).reduce((sum: number, expense: any) => sum + Number(expense.amount), 0),
    categories: categoriesData.length,
    avgExpense: expensesData.length > 0 ? expensesData.reduce((sum: number, expense: any) => sum + Number(expense.amount), 0) / expensesData.length : 0
  };

  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: (data: any) => {
      return apiRequest('POST', '/api/expenses', data);
    },
    onSuccess: () => {
      toast({
        title: "Expense Added",
        description: `Successfully recorded expense of ZMW ${parseFloat(expenseForm.amount).toLocaleString()}.`,
      });
      setExpenseForm({ category: '', amount: '', description: '', notes: '' });
      setIsAddModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add expense",
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/expenses/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Expense Deleted",
        description: "Expense record has been removed.",
        variant: "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete expense",
        variant: "destructive"
      });
    }
  });

  const handleAddExpense = () => {
    if (!isFormValid) return;
    
    const category = categoriesData.find((cat: any) => cat.name === expenseForm.category);
    const expenseData: any = {
      amount: parseFloat(expenseForm.amount),
      description: expenseForm.description,
      notes: expenseForm.notes || undefined
    };
    if (category && typeof category.id === 'number') {
      expenseData.categoryId = category.id;
    }
    addExpenseMutation.mutate(expenseData);
  };

  const handleEdit = (row: TableRow) => {
    setEditingExpense(row);
    setExpenseForm({
      category: row.category || '',
      amount: row.amount?.toString() ?? '',
      description: row.description || '',
      notes: row.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const editExpenseMutation = useMutation({
    mutationFn: (data: any) => {
      return apiRequest('PUT', `/api/expenses/${editingExpense?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Expense Updated",
        description: `Expense record has been updated.`,
      });
      setExpenseForm({ category: '', amount: '', description: '', notes: '' });
      setEditingExpense(null);
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update expense",
        variant: "destructive"
      });
    }
  });

  const handleEditExpense = () => {
    if (!isFormValid) return;
    const category = categoriesData.find((cat: any) => cat.name === expenseForm.category);
    const expenseData: any = {
      amount: parseFloat(expenseForm.amount),
      description: expenseForm.description,
      notes: expenseForm.notes || undefined
    };
    if (category && typeof category.id === 'number') {
      expenseData.categoryId = category.id;
    }
    editExpenseMutation.mutate(expenseData);
  };

  const handleDelete = (row: TableRow) => {
    deleteMutation.mutate(row.id as number);
  };

  const isFormValid = expenseForm.category && expenseForm.amount && expenseForm.description &&
    parseFloat(expenseForm.amount) > 0;

  // Format data for display
  const formattedExpensesData = expensesData.map((expense: any) => {
    const category = categoriesData.find((cat: any) => cat.id === expense.categoryId);
    return {
      ...expense,
      date: new Date(expense.createdAt).toLocaleDateString(),
      category: category?.name || 'Other',
      amount: Number(expense.amount)
    };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          Expense Management
        </h1>
        <p className="text-muted-foreground">
          Track and manage your business expenses
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Expenses"
          value={`ZMW ${stats.totalExpenses.toLocaleString()}`}
          subtitle="all time"
          icon={Receipt}
          variant="destructive"
        />
        
        <StatsCard
          title="This Month"
          value={`ZMW ${stats.thisMonth.toLocaleString()}`}
          subtitle="current month"
          icon={Calendar}
          variant="default"
        />
        
        <StatsCard
          title="Categories"
          value={stats.categories}
          subtitle="expense types"
          icon={Tag}
          variant="default"
        />
        
        <StatsCard
          title="Average Expense"
          value={`ZMW ${stats.avgExpense.toLocaleString()}`}
          subtitle="per transaction"
          icon={TrendingDown}
          variant="default"
        />
      </div>

      {/* Expenses Table */}
      <DataTable
        title="Expense Records"
        columns={expenseColumns}
        data={formattedExpensesData}
        isLoading={expensesLoading}
        searchPlaceholder="Search expenses..."
        onAdd={() => setIsAddModalOpen(true)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        addLabel="Add Expense"
        emptyMessage="No expense records found"
      />

      {/* Add Expense Modal */}
      <FormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Expense"
        description="Record a new business expense"
        onSubmit={handleAddExpense}
        submitLabel="Add Expense"
        isLoading={addExpenseMutation.isPending}
        submitDisabled={!isFormValid}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={expenseForm.category} onValueChange={(value) => 
              setExpenseForm(prev => ({ ...prev, category: value }))
            }>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Select expense category" />
              </SelectTrigger>
              <SelectContent>
                {categoriesData.map((category: any) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Amount (ZMW)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              min="0.01"
              data-testid="input-amount"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the expense"
              data-testid="input-description"
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={expenseForm.notes}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional details, invoice numbers, etc."
              rows={3}
              data-testid="input-notes"
            />
          </div>
        </div>
      </FormModal>

      {/* Edit Expense Modal */}
      <FormModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingExpense(null); }}
        title="Edit Expense"
        description="Edit this expense record"
        onSubmit={handleEditExpense}
        submitLabel="Save Changes"
        isLoading={editExpenseMutation.isPending}
        submitDisabled={!isFormValid}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={expenseForm.category} onValueChange={(value) => 
              setExpenseForm(prev => ({ ...prev, category: value }))
            }>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Select expense category" />
              </SelectTrigger>
              <SelectContent>
                {categoriesData.map((category: any) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Amount (ZMW)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              min="0.01"
              data-testid="input-amount"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the expense"
              data-testid="input-description"
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={expenseForm.notes}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional details, invoice numbers, etc."
              rows={3}
              data-testid="input-notes"
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
}