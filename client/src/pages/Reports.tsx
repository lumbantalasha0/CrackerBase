import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/StatsCard";
import { BarChart3, Download, Mail, TrendingUp, DollarSign, Package, Receipt, Users } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { formatDateTime } from '@/utils/date';
import Badge from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/queryClient";
import { exportEntriesToPDF } from "@/utils/pdfExport";
import { sendPDFByEmail } from "@/utils/emailExport";
import PredictionsWidget from '@/components/PredictionsWidget';


export default function Reports() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const { toast } = useToast();

  // Fetch analytics summary
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics/dashboard"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/analytics/dashboard");
      return res.json();
    },
  });

  // Fetch sales over time (for chart)
  const { data: salesOverTime = [], isLoading: salesLoading } = useQuery({
    queryKey: ["/api/analytics/sales-over-time"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/analytics/sales-over-time");
      return res.json();
    },
  });

  const { data: productionOverTime = [], isLoading: productionLoading } = useQuery({
    queryKey: ["/api/analytics/production-over-time"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/analytics/production-over-time");
      return res.json();
    },
  });

  const [granularity, setGranularity] = useState<'daily' | 'monthly'>('daily');

  // client-side monthly aggregation when granularity === 'monthly'
  const salesChartData = useMemo(() => {
    if (granularity === 'daily') return salesOverTime;
    // aggregate by YYYY-MM
    const map: Record<string, { date: string; total: number; count: number }> = {};
    (salesOverTime || []).forEach((d: any) => {
      const key = d.date.slice(0, 7);
      if (!map[key]) map[key] = { date: key, total: 0, count: 0 };
      map[key].total += Number(d.total || 0);
      map[key].count += Number(d.count || 0);
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [granularity, salesOverTime]);

  const productionChartData = useMemo(() => {
    if (granularity === 'daily') return productionOverTime;
    const map: Record<string, { date: string; produced: number; sold: number }> = {};
    (productionOverTime || []).forEach((d: any) => {
      const key = d.date.slice(0, 7);
      if (!map[key]) map[key] = { date: key, produced: 0, sold: 0 };
      map[key].produced += Number(d.produced || 0);
      map[key].sold += Number(d.sold || 0);
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [granularity, productionOverTime]);

  const { data: aggregates = {}, isLoading: aggregatesLoading } = useQuery({
    queryKey: ["/api/analytics/aggregates"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/analytics/aggregates");
      return res.json();
    },
  });

  // Fetch top customers
  const { data: topCustomers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["/api/analytics/top-customers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/analytics/top-customers");
      return res.json();
    },
  });

  // Fetch all sales and expenses for PDF export
  const { data: allSales = [] } = useQuery({
    queryKey: ["/api/sales"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/sales");
      return res.json();
    },
  });
  const { data: allExpenses = [] } = useQuery({
    queryKey: ["/api/expenses"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/expenses");
      return res.json();
    },
  });

  // Fetch all inventory movements for PDF export
  const { data: allInventory = [] } = useQuery({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/inventory");
      return res.json();
    },
  });

  // refs for chart capture
  const salesChartRef: any = useRef(null);
  const productionChartRef: any = useRef(null);
  const salesChartRefContainer: any = useRef(null);
  const productionChartRefContainer: any = useRef(null);

  async function captureChartImage(containerRef: any): Promise<string | null> {
    try {
      if (typeof window === 'undefined') return null;
      const el = containerRef?.current;
      if (!el) return null;
      const svg: SVGElement | null = el.querySelector('svg');
      if (!svg) return null;
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      return await new Promise((resolve) => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = svg.clientWidth || 800;
            canvas.height = svg.clientHeight || 300;
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/png'));
          } catch (e) {
            URL.revokeObjectURL(url);
            resolve(null);
          }
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
        img.src = url;
      });
    } catch (e) {
      return null;
    }
  }

  const handleExportPDF = async () => {
    setIsGenerating(true);
    try {
      // Add category name to expenses for PDF
      let expensesWithCategory = allExpenses;
      if (Array.isArray(allExpenses) && allExpenses.length > 0) {
        // Fetch categories if not already available
        let categories = [];
        try {
          const res = await apiRequest("GET", "/api/expense-categories");
          categories = await res.json();
        } catch {}
        expensesWithCategory = allExpenses.map((exp) => ({
          ...exp,
          categoryName: categories.find((cat: any) => cat.id === exp.categoryId)?.name || "-",
        }));
      }
      // capture charts as images and include them in the PDF
      const chartImages: string[] = [];
      try {
        const salesImg = await captureChartImage(salesChartRef);
        if (salesImg) chartImages.push(salesImg);
      } catch (e) {}
      try {
        const prodImg = await captureChartImage(productionChartRef);
        if (prodImg) chartImages.push(prodImg);
      } catch (e) {}

      exportEntriesToPDF({ sales: allSales, expenses: expensesWithCategory, inventory: allInventory, download: true, chartImages });
      toast({
        title: "PDF Generated",
        description: "Report has been downloaded successfully.",
      });
    } catch (e) {
      toast({
        title: "PDF Export Failed",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive"
      });
    }
    setIsGenerating(false);
  };

  const handleEmailReport = async () => {
    setIsEmailing(true);
    try {
      // Add category name to expenses for PDF
      let expensesWithCategory = allExpenses;
      if (Array.isArray(allExpenses) && allExpenses.length > 0) {
        let categories = [];
        try {
          const res = await apiRequest("GET", "/api/expense-categories");
          categories = await res.json();
        } catch {}
        expensesWithCategory = allExpenses.map((exp) => ({
          ...exp,
          categoryName: categories.find((cat: any) => cat.id === exp.categoryId)?.name || "-",
        }));
      }
  // capture charts to include in the emailed PDF
  const chartImages: string[] = [];
  try {
    const salesImg = await captureChartImage(salesChartRef);
    if (salesImg) chartImages.push(salesImg);
  } catch (e) {}
  try {
    const prodImg = await captureChartImage(productionChartRef);
    if (prodImg) chartImages.push(prodImg);
  } catch (e) {}

  // Generate PDF as Blob (no download)
  const doc = exportEntriesToPDF({ sales: allSales, expenses: expensesWithCategory, inventory: allInventory, download: false, chartImages });
  const pdfBlob = doc.output("blob");
  await sendPDFByEmail(pdfBlob, "business-entries-report.pdf");
      toast({
        title: "Report Emailed",
        description: "Monthly report has been sent to bntalasha@gmail.com.",
      });
    } catch (e) {
      toast({
        title: "Email Export Failed",
        description: "Could not send email. Please try again.",
        variant: "destructive"
      });
    }
    setIsEmailing(false);
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
          {aggregates?.lastSaleTime && (
            <p className="text-xs text-muted-foreground mt-1">Last sale: {formatDateTime(aggregates.lastSaleTime)}</p>
          )}
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
          value={analyticsLoading ? 'Loading...' : `ZMW ${analytics?.totalSales?.toLocaleString?.() ?? 0}`}
          subtitle="all time"
          icon={DollarSign}
          variant="success"
        />
        <StatsCard
          title="Total Expenses"
          value={analyticsLoading ? 'Loading...' : `ZMW ${analytics?.totalExpenses?.toLocaleString?.() ?? 0}`}
          subtitle="all time"
          icon={Receipt}
          variant="destructive"
        />
        <StatsCard
          title="Net Profit"
          value={analyticsLoading ? 'Loading...' : `ZMW ${analytics?.netProfit?.toLocaleString?.() ?? 0}`}
          subtitle="Net profit"
          icon={TrendingUp}
          variant="success"
        />
        <StatsCard
          title="Stock Remaining"
          value={analyticsLoading ? 'Loading...' : analytics?.stockRemaining?.toLocaleString?.() ?? 0}
          subtitle="pieces"
          icon={Package}
          variant="default"
        />
        <StatsCard
          title="Total Customers"
          value={analyticsLoading ? 'Loading...' : analytics?.totalCustomers ?? 0}
          subtitle="active customers"
          icon={Users}
          variant="default"
        />
        <StatsCard
          title="Daily Profit"
          value={aggregatesLoading ? 'Loading...' : `ZMW ${Number(aggregates?.dailyProfit || 0).toLocaleString()}`}
          subtitle="today"
          icon={TrendingUp}
          variant="success"
        />
        <StatsCard
          title="Weekly Profit"
          value={aggregatesLoading ? 'Loading...' : `ZMW ${Number(aggregates?.weeklyProfit || 0).toLocaleString()}`}
          subtitle="this week"
          icon={TrendingUp}
          variant="success"
        />
        <StatsCard
          title="Avg Order Value"
          value={analyticsLoading ? 'Loading...' : `ZMW ${analytics?.avgOrderValue?.toLocaleString?.() ?? 0}`}
          subtitle="per transaction"
          icon={DollarSign}
          variant="default"
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
              <div className="mb-4">
                <PredictionsWidget />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  className={`px-2 py-1 rounded ${granularity === 'daily' ? 'bg-primary text-white' : 'bg-muted'}`}
                  onClick={() => setGranularity('daily')}
                >
                  Daily
                </button>
                <button
                  className={`px-2 py-1 rounded ${granularity === 'monthly' ? 'bg-primary text-white' : 'bg-muted'}`}
                  onClick={() => setGranularity('monthly')}
                >
                  Monthly
                </button>
              </div>

              {salesLoading ? (
                <div>Loading chart...</div>
              ) : (
                <div style={{ width: '100%', height: 260 }} ref={salesChartRefContainer}>
                  <ResponsiveContainer>
                    <LineChart data={salesChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }} ref={salesChartRef}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value: any, name: any, props: any) => {
                        if (name === 'total') return [`ZMW ${Number(value).toLocaleString()}`, 'Sales'];
                        return [value, name];
                      }} labelFormatter={(label: any) => `Period: ${label}`} />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#4ade80" name="Sales (ZMW)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
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

        {/* Production / Top Customers Column */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="font-medium">Production (produced vs sold)</h3>
              {productionLoading ? (
                <div>Loading production...</div>
              ) : (
                <div style={{ width: '100%', height: 200 }} ref={productionChartRefContainer}>
                  <ResponsiveContainer>
                    <BarChart data={productionChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }} ref={productionChartRef}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value: any, name: any) => [value, name]} />
                      <Legend />
                      <Bar dataKey="produced" stackId="a" fill="#60a5fa" name="Produced" />
                      <Bar dataKey="sold" stackId="a" fill="#fb7185" name="Sold" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {customersLoading ? (
                <div>Loading customers...</div>
              ) : (
                topCustomers.map((customer: any, index: number) => (
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
                ))
              )}
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