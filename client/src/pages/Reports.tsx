import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/StatsCard";
import { BarChart3, Download, Mail, TrendingUp, DollarSign, Package, Receipt, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Mock chart data - todo: remove mock functionality
const mockSalesData = [
  { month: "Jan", sales: 4500, expenses: 2100 },
  { month: "Feb", sales: 5200, expenses: 2300 },
  { month: "Mar", sales: 4800, expenses: 1900 },
  { month: "Apr", sales: 6100, expenses: 2800 },
  { month: "May", sales: 5700, expenses: 2600 },
  { month: "Jun", sales: 6800, expenses: 3100 }
];

const mockTopCustomers = [
  { name: "ABC Restaurant", purchases: 12, total: 8500 },
  { name: "XYZ Cafe", purchases: 8, total: 5200 },
  { name: "Super Market Ltd", purchases: 15, total: 9800 },
  { name: "Corner Store", purchases: 6, total: 3200 }
];

export default function Reports() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const { toast } = useToast();

  // Mock summary stats - todo: remove mock functionality
  const summary = {
    totalSales: 45230,
    totalExpenses: 12450,
    netProfit: 32780,
    stockRemaining: 1250,
    totalCustomers: 28,
    avgOrderValue: 615
  };

  const handleExportPDF = async () => {
    setIsGenerating(true);
    
    // Mock PDF generation - todo: implement real PDF export
    setTimeout(() => {
      toast({
        title: "PDF Generated",
        description: "Report has been downloaded successfully.",
      });
      setIsGenerating(false);
    }, 2000);
  };

  const handleEmailReport = async () => {
    setIsEmailing(true);
    
    // Mock email sending - todo: implement real email functionality
    setTimeout(() => {
      toast({
        title: "Report Emailed", 
        description: "Monthly report has been sent to bntalasha@gmail.com.",
      });
      setIsEmailing(false);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
            Business Reports
          </h1>
          <p className="text-muted-foreground">
            Analytics and insights for your crackers business
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportPDF}
            disabled={isGenerating}
            data-testid="button-export-pdf"
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Export PDF"}
          </Button>
          
          <Button 
            onClick={handleEmailReport}
            disabled={isEmailing}
            data-testid="button-email-report"
          >
            <Mail className="h-4 w-4 mr-2" />
            {isEmailing ? "Sending..." : "Email Report"}
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Total Sales"
          value={`ZMW ${summary.totalSales.toLocaleString()}`}
          subtitle="all time"
          icon={DollarSign}
          variant="success"
        />
        
        <StatsCard
          title="Total Expenses"
          value={`ZMW ${summary.totalExpenses.toLocaleString()}`}
          subtitle="all time"
          icon={Receipt}
          variant="destructive"
        />
        
        <StatsCard
          title="Net Profit"
          value={`ZMW ${summary.netProfit.toLocaleString()}`}
          subtitle="+18% vs last period"
          icon={TrendingUp}
          variant="success"
        />
        
        <StatsCard
          title="Stock Remaining"
          value={summary.stockRemaining.toLocaleString()}
          subtitle="pieces"
          icon={Package}
          variant="default"
        />
        
        <StatsCard
          title="Total Customers"
          value={summary.totalCustomers}
          subtitle="active customers"
          icon={Users}
          variant="default"
        />
        
        <StatsCard
          title="Avg Order Value"
          value={`ZMW ${summary.avgOrderValue}`}
          subtitle="per transaction"
          icon={DollarSign}
          variant="secondary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales vs Expenses Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Sales vs Expenses (6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSalesData.map((data, index) => (
                <div key={data.month} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{data.month}</span>
                    <div className="flex gap-4">
                      <span className="text-green-600">ZMW {data.sales.toLocaleString()}</span>
                      <span className="text-red-600">ZMW {data.expenses.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div 
                      className="bg-green-500 rounded-l"
                      style={{ width: `${(data.sales / 7000) * 70}%` }}
                    />
                    <div 
                      className="bg-red-500 rounded-r"
                      style={{ width: `${(data.expenses / 7000) * 30}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="flex justify-center gap-6 pt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span>Sales</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded" />
                  <span>Expenses</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTopCustomers.map((customer, index) => (
                <div 
                  key={customer.name} 
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  data-testid={`customer-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {customer.purchases} orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">ZMW {customer.total.toLocaleString()}</p>
                    <Badge variant="outline" className="text-xs">
                      Top {index + 1}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>About BEMACHO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Business Information</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Property of BEMACHO 2007 - 2025</p>
                <p>Crackers Manufacturing & Distribution</p>
                <p>Professional Business Management System</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">System Information</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Developed by LumbaNtalasha@2025</p>
                <p>Version 1.0.0</p>
                <p>Last Updated: January 2024</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}