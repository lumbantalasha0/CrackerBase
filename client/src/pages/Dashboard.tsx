import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import StatsCard from "@/components/StatsCard";
import DataTable, { TableColumn, TableRow } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, DollarSign, Receipt, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import Badge from "@/components/ui/badge";

// Utility function to format time
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};


const activityColumns: TableColumn[] = [
  {
    key: 'type',
    label: 'Type',
    render: (value) => {
      const variants = {
        sale: 'default',
        production: 'secondary',
        expense: 'outline'
      };
  return <Badge variant={variants[value as keyof typeof variants] as any}>{value}</Badge>;
    }
  },
  {
    key: 'description',
    label: 'Description'
  },
  {
    key: 'quantity',
    label: 'Quantity',
    render: (value) => value || '-'
  },
  {
    key: 'amount',
    label: 'Amount',
    render: (value) => value || '-'
  },
  {
    key: 'time',
    label: 'Time',
    render: (value) => (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Clock className="h-3 w-3" />
        {value}
      </div>
    )
  }
];

export default function Dashboard() {
  const [, setLocation] = useLocation();

  // Fetch dashboard analytics
  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ['/api/analytics/dashboard']
  });

  // Fetch recent activity
  const { data: recentActivity = [], isLoading: activityLoading } = useQuery<any[]>({
    queryKey: ['/api/analytics/recent-activity']
  });

  // Calculate low stock items based on real data
  const lowStockItems = stats && stats.currentStock < 500 ? [
    { name: "Crackers Stock", current: stats.currentStock, threshold: 500 }
  ] : [];

  const handleNavigateToInventory = () => {
    setLocation('/inventory');
  };

  const handleNavigateToSales = () => {
    setLocation('/sales');
  };

  const handleNavigateToExpenses = () => {
    setLocation('/expenses');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          BEMACHO Crackers Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of your crackers business performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Stock Available"
          value={stats?.currentStock || 0}
          subtitle="pieces in inventory"
          icon={Package}
          actionLabel="Manage Stock"
          onAction={handleNavigateToInventory}
          variant={stats && stats.currentStock < 500 ? "warning" : "default"}
          loading={statsLoading}
        />
        
        <StatsCard
          title="Monthly Sales"
          value={stats ? `ZMW ${stats.monthlySales.toLocaleString()}` : "ZMW 0"}
          subtitle="this month"
          icon={DollarSign}
          actionLabel="Record Sale"
          onAction={handleNavigateToSales}
          variant="success"
          loading={statsLoading}
        />
        
        <StatsCard
          title="Monthly Expenses"
          value={stats ? `ZMW ${stats.monthlyExpenses.toLocaleString()}` : "ZMW 0"}
          subtitle="this month"
          icon={Receipt}
          actionLabel="Add Expense"
          onAction={handleNavigateToExpenses}
          variant="destructive"
          loading={statsLoading}
        />
        
        <StatsCard
          title="Monthly Profit"
          value={stats ? `ZMW ${stats.monthlyProfit.toLocaleString()}` : "ZMW 0"}
          subtitle={stats && stats.monthlyProfit > 0 ? "Positive" : "Needs attention"}
          icon={TrendingUp}
          variant={stats && stats.monthlyProfit > 0 ? "success" : "warning"}
          loading={statsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <DataTable
            title="Recent Activity"
            columns={activityColumns}
            data={recentActivity.map((activity: any) => ({
              ...activity,
              time: formatTimeAgo(activity.time)
            }))}
            searchPlaceholder="Search activity..."
            emptyMessage="No recent activity"
            loading={activityLoading}
          />
        </div>

        {/* Alerts and Quick Actions */}
        <div className="space-y-6">
          {/* Low Stock Alert */}
          {lowStockItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-5 w-5" />
                  Low Stock Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockItems.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.current} / {item.threshold} threshold
                        </p>
                      </div>
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        Low
                      </Badge>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={handleNavigateToInventory}
                  >
                    Manage Inventory
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={handleNavigateToSales}
                data-testid="button-quick-record-sale"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Record Sale
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={handleNavigateToExpenses}
                data-testid="button-quick-add-expense"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={handleNavigateToInventory}
                data-testid="button-quick-add-stock"
              >
                <Package className="h-4 w-4 mr-2" />
                Add Stock
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}