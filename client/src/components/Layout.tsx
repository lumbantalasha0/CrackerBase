import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, Package, ShoppingCart, Receipt, TrendingUp, Settings, Calculator } from "lucide-react";
import { cn } from "@/utils";

interface LayoutProps {
  children: ReactNode;
}

const navigationItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/reports", label: "Reports", icon: TrendingUp },
  { href: "/calculator", label: "Calculator", icon: Calculator },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">
              BEMACHO Crackers Manager
            </h1>
            <p className="text-sm text-muted-foreground">
              Professional business management system
            </p>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r border-border min-h-[calc(100vh-81px)]">
          <nav className="p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link href={item.href}>
                      <a
                        className={cn(
                          "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </a>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}