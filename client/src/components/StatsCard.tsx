import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "success" | "destructive" | "warning";
  className?: string;
}

const variantStyles = {
  default: "border-border",
  success: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
  destructive: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
  warning: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950",
};

const iconVariantStyles = {
  default: "text-muted-foreground",
  success: "text-green-600 dark:text-green-400",
  destructive: "text-red-600 dark:text-red-400", 
  warning: "text-yellow-600 dark:text-yellow-400",
};

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  actionLabel,
  onAction,
  variant = "default",
  className,
}: StatsCardProps) {
  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && (
          <Icon className={cn("h-4 w-4", iconVariantStyles[variant])} />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {actionLabel && onAction && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}