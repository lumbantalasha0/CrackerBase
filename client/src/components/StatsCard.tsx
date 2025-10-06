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
  default: "border-border",
  secondary: "border-border bg-secondary-50 dark:bg-secondary-950",
  success: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
  destructive: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
  warning: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950",
};

const iconVariantStyles = {
  default: "text-muted-foreground",
  secondary: "text-secondary-600 dark:text-secondary-400",
  success: "text-green-600 dark:text-green-400",
  destructive: "text-red-600 dark:text-red-400", 
  warning: "text-yellow-600 dark:text-yellow-400",
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
      variantStyles[variant], 
      "transition-all duration-200 hover:shadow-md hover:scale-[1.02]",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && (
          <div className="p-2 rounded-lg bg-background/50">
            <Icon className={cn("h-4 w-4", iconVariantStyles[variant])} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            {subtitle && <Skeleton className="h-4 w-32" />}
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold animate-in fade-in duration-500">
              {typeof value === "number" ? value.toLocaleString() : value}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </>
        )}
        {actionLabel && onAction && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full transition-all hover:shadow-sm"
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