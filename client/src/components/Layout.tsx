import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Home, Package, ShoppingCart, Receipt, TrendingUp, Settings, Calculator, Sparkles, X } from "lucide-react";
import { cn } from "@/utils";

interface LayoutProps {
  children: ReactNode;
}

const navigationItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/ai-assistant", label: "AI Assistant", icon: Sparkles, highlight: true },
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
    <div className="min-h-screen gradient-warm">
      {/* Header */}
      <header className="border-b border-border/50 glass-light sticky top-0 z-40 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-amber-600 to-primary bg-clip-text text-transparent">BEMACHO Crackers</h1>
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
                <div className="fixed left-4 top-16 z-50 w-64 glass border border-border/50 rounded-xl shadow-2xl p-3 animate-slide-up">
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
                                item.highlight && !isActive && "border border-primary/30",
                                isActive 
                                  ? item.highlight
                                    ? 'bg-gradient-to-r from-primary to-amber-600 text-primary-foreground shadow-md'
                                    : 'bg-primary text-primary-foreground shadow-sm'
                                  : item.highlight
                                  ? 'text-primary hover:bg-primary/10 hover:border-primary/50'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                              )}
                              data-testid={`link-mobile-${item.href.slice(1) || 'dashboard'}`}
                            >
                              <Icon className={cn("h-4 w-4", item.highlight && !isActive && "text-primary")} />
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
        <aside className="hidden sm:block w-64 glass-light border-r border-border/50 min-h-[calc(100vh-81px)] sticky top-[81px]">
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
                          "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                          item.highlight && !isActive && "border border-primary/30 shadow-sm",
                          isActive
                            ? "bg-gradient-to-r from-primary to-amber-600 text-primary-foreground shadow-lg scale-105"
                            : item.highlight
                            ? "text-primary hover:bg-primary/10 hover:shadow-lg hover:scale-102 hover:border-primary/50"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/40 hover:shadow-md hover:scale-102"
                        )}
                        data-testid={`link-${item.href.slice(1) || 'dashboard'}`}
                      >
                        <Icon className={cn("h-4 w-4", item.highlight && !isActive && "text-primary animate-pulse")} />
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