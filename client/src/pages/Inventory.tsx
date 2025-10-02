import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DataTable, { TableColumn, TableRow } from "@/components/DataTable";
import FormModal from "@/components/FormModal";
import StatsCard from "@/components/StatsCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, Plus, TrendingUp, AlertTriangle } from "lucide-react";
import Badge from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/queryClient";


const inventoryColumns: TableColumn[] = [
  {
    key: 'date',
    label: 'Date',
    sortable: true
  },
  {
    key: 'type',
    label: 'Type',
    render: (value) => (
      <Badge variant={"default" as any}>
        {value === 'addition' ? 'Stock In' : 'Stock Out'}
      </Badge>
    )
  },
  {
    key: 'quantity',
    label: 'Quantity',
    sortable: true,
    render: (value, row) => (
      <span className={row.type === 'addition' ? 'text-green-600' : 'text-red-600'}>
        {row.type === 'addition' ? '+' : '-'}{value} pcs
      </span>
    )
  },
  {
    key: 'balance',
    label: 'Balance',
    sortable: true,
    render: (value) => `${value} pcs`
  },
  {
    key: 'note',
    label: 'Notes'
  }
];

interface StockForm {
  quantity: string;
  note: string;
  location?: string;
  phone?: string;
}

export default function Inventory() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [stockForm, setStockForm] = useState<StockForm>({ quantity: '', note: '' });
  const { toast } = useToast();

  // Fetch inventory movements
    const { data: inventoryData = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ['/api/inventory']
  });

  // Fetch current stock
    const { data: stockData } = useQuery<any>({
    queryKey: ['/api/inventory/stock']
  });

  // Calculate stats from real data
  const stats = {
    available: stockData?.stock || 0,
    totalIn: inventoryData.filter((item: any) => item.type === 'addition').reduce((sum: number, item: any) => sum + item.quantity, 0),
    totalOut: inventoryData.filter((item: any) => item.type === 'sale').reduce((sum: number, item: any) => sum + item.quantity, 0),
    threshold: 200
  };

  // Add stock mutation
  const addStockMutation = useMutation({
    mutationFn: (data: { type: string; quantity: number; note?: string; location?: string; phone?: string }) => {
      return apiRequest('POST', '/api/inventory', data);
    },
    onSuccess: () => {
      toast({
        title: "Stock Added",
        description: `Successfully added ${stockForm.quantity} pieces to inventory.`,
      });
      setStockForm({ quantity: '', note: '' });
      setIsAddModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/stock'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add stock",
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/inventory/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Record Deleted",
        description: "Inventory record has been removed.",
        variant: "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/stock'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete record",
        variant: "destructive"
      });
    }
  });

  const handleAddStock = () => {
    if (!isFormValid) return;
    
    addStockMutation.mutate({
      type: 'addition',
      quantity: parseInt(stockForm.quantity),
      note: stockForm.note || undefined,
    });
  };

  const handleEdit = (row: TableRow) => {
    console.log('Edit inventory item:', row);
    // TODO: implement edit functionality
  };

  const handleDelete = (row: TableRow) => {
    deleteMutation.mutate(row.id as number);
  };

  const isFormValid = stockForm.quantity && parseInt(stockForm.quantity) > 0;

  // Format data for display
  const formattedInventoryData = inventoryData.map((item: any) => ({
    ...item,
    date: new Date(item.createdAt).toLocaleDateString()
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          Crackers Inventory
        </h1>
        <p className="text-muted-foreground">
          Manage your crackers stock and track inventory movements
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Available Stock"
          value={stats.available}
          subtitle="pieces in inventory"
          icon={Package}
          variant="default"
        />
        
        <StatsCard
          title="Total Stock In"
          value={stats.totalIn}
          subtitle="all time"
          icon={TrendingUp}
          variant="success"
        />
        
        <StatsCard
          title="Total Stock Out"
          value={stats.totalOut}
          subtitle="all time"
          icon={Package}
          variant="secondary"
        />
        
        <StatsCard
          title="Low Stock Alert"
          value={stats.available < stats.threshold ? "Low" : "OK"}
          subtitle={`Threshold: ${stats.threshold} pcs`}
          icon={AlertTriangle}
          variant={stats.available < stats.threshold ? "warning" : "success"}
        />
      </div>

      {/* Inventory Table */}
      <DataTable
        title="Stock Movements"
        columns={inventoryColumns}
        data={formattedInventoryData}
        searchPlaceholder="Search inventory records..."
        onAdd={() => setIsAddModalOpen(true)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        addLabel="Add Stock"
        emptyMessage="No inventory records found"
        loading={isLoading}
      />

      {/* Add Stock Modal */}
      <FormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Stock"
        description="Add crackers to your inventory"
        onSubmit={handleAddStock}
        submitLabel="Add Stock"
        isSubmitting={addStockMutation.isPending}
        submitDisabled={!isFormValid}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="quantity">Quantity (pieces)</Label>
            <Input
              id="quantity"
              type="number"
              value={stockForm.quantity}
              onChange={(e) => setStockForm(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder="Enter quantity"
              min="1"
              data-testid="input-quantity"
            />
          </div>
          {/* Location and phone moved to Customer settings - keep inventory focused on quantity/note */}
          
          <div>
            <Label htmlFor="note">Notes (Optional)</Label>
            <Textarea
              id="note"
              value={stockForm.note}
              onChange={(e) => setStockForm(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Production notes, batch details, etc."
              rows={3}
              data-testid="input-notes"
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
}