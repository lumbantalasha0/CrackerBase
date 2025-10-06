import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Home, Package, ShoppingCart, Receipt, TrendingUp, Settings, Calculator, X } from "lucide-react";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-foreground">BEMACHO Crackers</h1>
            <p className="hidden sm:inline text-sm text-muted-foreground">Professional business management</p>
          </div>

          {/* Mobile nav: hamburger + full menu */}
          <div className="sm:hidden">
            <button
              aria-label="Toggle menu"
              onClick={() => setMobileOpen((v) => !v)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-mobile-menu"
            >
              {mobileOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            {mobileOpen && (
              <>
                <div 
                  className="fixed inset-0 bg-black/20 z-40 sm:hidden animate-in fade-in duration-200"
                  onClick={() => setMobileOpen(false)}
                />
                <div className="fixed left-4 top-16 z-50 w-64 bg-card border border-border rounded-lg shadow-lg p-3 animate-in slide-in-from-top-5 duration-200">
                  <ul className="space-y-1">
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location === item.href;
                      return (
                        <li key={item.href}>
                          <Link href={item.href}>
                            <a 
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all",
                                isActive 
                                  ? 'bg-primary text-primary-foreground shadow-sm' 
                                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                              )}
                              data-testid={`link-mobile-${item.href.slice(1) || 'dashboard'}`}
                            >
                              <Icon className="h-4 w-4" />
                              <span>{item.label}</span>
                            </a>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar (hidden on small screens) */}
        <aside className="hidden sm:block w-64 bg-card border-r border-border min-h-[calc(100vh-81px)] sticky top-0">
          <nav className="p-4">
            <ul className="space-y-1.5">
              {navigationItems.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link href={item.href}>
                      <a
                        className={cn(
                          "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent hover:shadow-sm"
                        )}
                        data-testid={`link-${item.href.slice(1) || 'dashboard'}`}
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}