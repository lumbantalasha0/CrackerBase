import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DataTable, { TableColumn, TableRow } from "@/components/DataTable";
import FormModal from "@/components/FormModal";
import StatsCard from "@/components/StatsCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, Users, Calendar } from "lucide-react";
import Badge from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/queryClient";


const salesColumns: TableColumn[] = [
  {
    key: 'date',
    label: 'Date',
    sortable: true
  },
  {
    key: 'customer',
    label: 'Customer',
    sortable: true
  },
  {
    key: 'quantity',
    label: 'Quantity',
    sortable: true,
    render: (value) => `${value} pcs`
  },
  {
    key: 'pricePerUnit',
    label: 'Price/Unit',
    sortable: true,
    render: (value) => `ZMW ${value.toFixed(2)}`
  },
  {
    key: 'totalPrice',
    label: 'Total',
    sortable: true,
    render: (value) => `ZMW ${value.toLocaleString()}`
  },
  {
    key: 'status',
    label: 'Status',
    render: (value) => (
      <Badge variant={value === 'completed' ? 'default' : 'secondary'}>
        {value}
      </Badge>
    )
  }
];

interface SaleForm {
  customerId: string;
  newCustomerName: string;
  quantity: string;
  pricePerUnit: string;
}

export default function Sales() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [saleForm, setSaleForm] = useState<SaleForm>({ 
    customerId: '', 
    newCustomerName: '',
    quantity: '', 
    pricePerUnit: '' 
  });
  const { toast } = useToast();

  // Fetch sales data
  const { data: salesData = [], isLoading: salesLoading, refetch } = useQuery<any[]>({
    queryKey: ['/api/sales']
  });

  // Fetch customers
  const { data: customersData = [] } = useQuery<any[]>({
    queryKey: ['/api/customers']
  });

  // Calculate stats from real data
  const stats = {
    totalSales: salesData.reduce((sum: number, sale: any) => sum + Number(sale.totalPrice), 0),
    totalQuantity: salesData.reduce((sum: number, sale: any) => sum + sale.quantity, 0),
    avgPrice: salesData.length > 0 ? salesData.reduce((sum: number, sale: any) => sum + Number(sale.pricePerUnit), 0) / salesData.length : 0,
    thisMonth: salesData.filter((sale: any) => {
      const saleDate = new Date(sale.createdAt);
      const now = new Date();
      return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
    }).length
  };

  // Add sale mutation
  const addSaleMutation = useMutation({
    mutationFn: (data: any) => {
      return apiRequest('POST', '/api/sales', data);
    },
    onSuccess: () => {
      const total = parseFloat(saleForm.quantity) * parseFloat(saleForm.pricePerUnit);
      toast({
        title: "Sale Recorded",
        description: `Successfully recorded sale of ${saleForm.quantity} pieces for ZMW ${total.toLocaleString()}.`,
      });
      setSaleForm({ customerId: '', newCustomerName: '', quantity: '', pricePerUnit: '' });
      setIsAddModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record sale",
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/sales/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Sale Deleted",
        description: "Sale record has been removed.",
        variant: "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete sale",
        variant: "destructive"
      });
    }
  });

  const handleAddSale = () => {
    if (!isFormValid) return;
    
    const saleData = {
      customerId: saleForm.customerId ? parseInt(saleForm.customerId) : null,
      customerName: saleForm.newCustomerName || (customersData.find((c: any) => c.id === parseInt(saleForm.customerId))?.name),
      quantity: parseInt(saleForm.quantity),
      pricePerUnit: parseFloat(saleForm.pricePerUnit)
    };
    
    addSaleMutation.mutate(saleData);
  };

  const handleEdit = (row: TableRow) => {
    setEditingSale(row);
    setSaleForm({
      customerId: row.customerId ? row.customerId.toString() : '',
      newCustomerName: row.customerId ? '' : row.customer,
      quantity: row.quantity?.toString() ?? '',
      pricePerUnit: row.pricePerUnit?.toString() ?? ''
    });
    setIsEditModalOpen(true);
  };

  const editSaleMutation = useMutation({
    mutationFn: (data: any) => {
      return apiRequest('PUT', `/api/sales/${editingSale?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Sale Updated",
        description: `Sale record has been updated.`,
      });
      setSaleForm({ customerId: '', newCustomerName: '', quantity: '', pricePerUnit: '' });
      setEditingSale(null);
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update sale",
        variant: "destructive"
      });
    }
  });

  const handleEditSale = () => {
    if (!isFormValid) return;
    const saleData = {
      customerId: saleForm.customerId ? parseInt(saleForm.customerId) : null,
      customerName: saleForm.newCustomerName || (customersData.find((c: any) => c.id === parseInt(saleForm.customerId))?.name),
      quantity: parseInt(saleForm.quantity),
      pricePerUnit: parseFloat(saleForm.pricePerUnit)
    };
    editSaleMutation.mutate(saleData);
  };

  const handleDelete = (row: TableRow) => {
    deleteMutation.mutate(row.id as number);
  };

  const isFormValid = saleForm.quantity && saleForm.pricePerUnit && 
    parseFloat(saleForm.quantity) > 0 && parseFloat(saleForm.pricePerUnit) > 0 &&
    (saleForm.customerId || saleForm.newCustomerName);

  // Format data for display
  const formattedSalesData = salesData.map((sale: any) => ({
    ...sale,
    date: new Date(sale.createdAt).toLocaleDateString(),
    customer: sale.customerName || 'Unknown',
    pricePerUnit: Number(sale.pricePerUnit),
    totalPrice: Number(sale.totalPrice)
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          Sales Management
        </h1>
        <p className="text-muted-foreground">
          Track and manage your crackers sales
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Sales"
          value={`ZMW ${stats.totalSales.toLocaleString()}`}
          subtitle="all time"
          icon={DollarSign}
          variant="success"
        />
        
        <StatsCard
          title="Units Sold"
          value={stats.totalQuantity.toLocaleString()}
          subtitle="pieces"
          icon={TrendingUp}
          variant="default"
        />
        
        <StatsCard
          title="Average Price"
          value={`ZMW ${stats.avgPrice.toFixed(2)}`}
          subtitle="per piece"
          icon={DollarSign}
          variant="secondary"
        />
        
        <StatsCard
          title="Sales This Month"
          value={stats.thisMonth}
          subtitle="transactions"
          icon={Calendar}
          variant="default"
        />
      </div>

      {/* Sales Table */}
      <DataTable
        title="Sales Records"
        columns={salesColumns}
        data={formattedSalesData}
        loading={salesLoading}
        searchPlaceholder="Search sales records..."
        onAdd={() => setIsAddModalOpen(true)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        addLabel="Record Sale"
        emptyMessage="No sales records found"
      />

      {/* Add Sale Modal */}
      <FormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Sale"
        description="Record a new crackers sale"
        onSubmit={handleAddSale}
        submitLabel="Record Sale"
        isSubmitting={addSaleMutation.isPending}
        submitDisabled={!isFormValid}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="customer">Customer</Label>
            <Select value={saleForm.customerId} onValueChange={(value) => 
              setSaleForm(prev => ({ ...prev, customerId: value, newCustomerName: '' }))
            }>
              <SelectTrigger data-testid="select-customer">
                <SelectValue placeholder="Select existing customer" />
              </SelectTrigger>
              <SelectContent>
                {customersData.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="newCustomer">Or add new customer</Label>
            <Input
              id="newCustomer"
              value={saleForm.newCustomerName}
              onChange={(e) => setSaleForm(prev => ({ 
                ...prev, 
                newCustomerName: e.target.value, 
                customerId: '' 
              }))}
              placeholder="New customer name"
              data-testid="input-new-customer"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity (pieces)</Label>
              <Input
                id="quantity"
                type="number"
                value={saleForm.quantity}
                onChange={(e) => setSaleForm(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="0"
                min="1"
                data-testid="input-quantity"
              />
            </div>
            
            <div>
              <Label htmlFor="pricePerUnit">Price per Unit (ZMW)</Label>
              <Input
                id="pricePerUnit"
                type="number"
                step="0.01"
                value={saleForm.pricePerUnit}
                onChange={(e) => setSaleForm(prev => ({ ...prev, pricePerUnit: e.target.value }))}
                placeholder="0.00"
                min="0.01"
                data-testid="input-price"
              />
            </div>
          </div>

          {saleForm.quantity && saleForm.pricePerUnit && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">
                Total: ZMW {(parseFloat(saleForm.quantity) * parseFloat(saleForm.pricePerUnit)).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </FormModal>

      {/* Edit Sale Modal */}
      <FormModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingSale(null); }}
        title="Edit Sale"
        description="Edit this sale record"
        onSubmit={handleEditSale}
        submitLabel="Save Changes"
        isSubmitting={editSaleMutation.isPending}
        submitDisabled={!isFormValid}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="customer">Customer</Label>
            <Select value={saleForm.customerId} onValueChange={(value) => 
              setSaleForm(prev => ({ ...prev, customerId: value, newCustomerName: '' }))
            }>
              <SelectTrigger data-testid="select-customer">
                <SelectValue placeholder="Select existing customer" />
              </SelectTrigger>
              <SelectContent>
                {customersData.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="newCustomer">Or add new customer</Label>
            <Input
              id="newCustomer"
              value={saleForm.newCustomerName}
              onChange={(e) => setSaleForm(prev => ({ 
                ...prev, 
                newCustomerName: e.target.value, 
                customerId: '' 
              }))}
              placeholder="New customer name"
              data-testid="input-new-customer"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity (pieces)</Label>
              <Input
                id="quantity"
                type="number"
                value={saleForm.quantity}
                onChange={(e) => setSaleForm(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="0"
                min="1"
                data-testid="input-quantity"
              />
            </div>
            
            <div>
              <Label htmlFor="pricePerUnit">Price per Unit (ZMW)</Label>
              <Input
                id="pricePerUnit"
                type="number"
                step="0.01"
                value={saleForm.pricePerUnit}
                onChange={(e) => setSaleForm(prev => ({ ...prev, pricePerUnit: e.target.value }))}
                placeholder="0.00"
                min="0.01"
                data-testid="input-price"
              />
            </div>
          </div>

          {saleForm.quantity && saleForm.pricePerUnit && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">
                Total: ZMW {(parseFloat(saleForm.quantity) * parseFloat(saleForm.pricePerUnit)).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </FormModal>
    </div>
  );
}