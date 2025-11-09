import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";
import { cn } from "@/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "success" | "destructive" | "warning" | "secondary";
  className?: string;
  loading?: boolean;
}

const variantStyles = {
  default: "border-border/30",
  secondary: "border-border/30 bg-gradient-to-br from-secondary/30 to-secondary/10",
  success: "border-green-300/40 bg-gradient-to-br from-green-50/80 to-emerald-50/60 dark:border-green-700/40 dark:from-green-950/60 dark:to-emerald-950/40",
  destructive: "border-red-300/40 bg-gradient-to-br from-red-50/80 to-orange-50/60 dark:border-red-700/40 dark:from-red-950/60 dark:to-orange-950/40",
  warning: "border-amber-300/40 bg-gradient-to-br from-amber-50/80 to-yellow-50/60 dark:border-amber-700/40 dark:from-amber-950/60 dark:to-yellow-950/40",
};

const iconVariantStyles = {
  default: "text-primary",
  secondary: "text-secondary-600 dark:text-secondary-400",
  success: "text-green-600 dark:text-green-400",
  destructive: "text-red-600 dark:text-red-400", 
  warning: "text-amber-600 dark:text-amber-400",
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  actionLabel,
  onAction,
  variant = "default",
  className,
  loading = false,
}: StatsCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.03] animate-fade-in group",
      variantStyles[variant],
      "backdrop-blur-md border",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-amber-600/10 group-hover:from-primary/20 group-hover:to-amber-600/20 transition-all duration-300 group-hover:scale-110">
            <Icon className={cn("h-5 w-5", iconVariantStyles[variant])} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-28" />
            {subtitle && <Skeleton className="h-4 w-36" />}
          </div>
        ) : (
          <>
            <div className="text-3xl font-bold animate-slide-up bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              {typeof value === "number" ? value.toLocaleString() : value}
            </div>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-2 animate-fade-in">{subtitle}</p>
            )}
          </>
        )}
        {actionLabel && onAction && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4 w-full transition-all hover:shadow-md hover:scale-105"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default StatsCard;