import { useState } from "react";
import { useExpenseUnitsQuery } from "@/hooks/useExpenseUnits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator as CalculatorIcon, DollarSign, Info, TrendingUp } from "lucide-react";
import Badge from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CostBreakdown {
  item: string;
  amount: number;
}

interface CalculationResult {
  batchSize: number;
  totalCost: number;
  breakdown: CostBreakdown[];
}

export default function Calculator() {
  const [batchSize, setBatchSize] = useState("");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const { data: expenseUnits = [], isLoading } = useExpenseUnitsQuery();

  const handleCalculate = async () => {
    const amount = parseFloat(batchSize);
    if (!amount || amount <= 0) {
      return;
    }

    setIsCalculating(true);
    
    // Calculate costs based on kg input
    setTimeout(() => {
      const breakdown: CostBreakdown[] = expenseUnits.map((unit: any) => ({
        item: unit.item,
        amount: amount * parseFloat(unit.unitCost)
      }));

      const totalCost = breakdown.reduce((sum, item) => sum + item.amount, 0);

      setResult({
        batchSize: amount,
        totalCost,
        breakdown
      });
      setIsCalculating(false);
    }, 500);
  };

  const resetCalculation = () => {
    setBatchSize("");
    setResult(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading expense units...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          Production Cost Calculator
        </h1>
        <p className="text-muted-foreground">
          Calculate total production costs based on batch size (kg of flour)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calculator Input */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalculatorIcon className="h-5 w-5 text-primary" />
              Calculate Batch Cost
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="batch-size">Batch Size (kg of flour)</Label>
              <Input
                id="batch-size"
                type="number"
                step="0.1"
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
                placeholder="Enter batch size in kg"
                min="0.1"
                data-testid="input-batch-size"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Example: Enter 25 for a 25kg batch
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCalculate}
                disabled={!batchSize || parseFloat(batchSize) <= 0 || isCalculating || expenseUnits.length === 0}
                className="flex-1"
                data-testid="button-calculate"
              >
                {isCalculating ? "Calculating..." : "Calculate Cost"}
              </Button>
              
              {result && (
                <Button 
                  variant="outline" 
                  onClick={resetCalculation}
                  data-testid="button-reset"
                >
                  Reset
                </Button>
              )}
            </div>

            {expenseUnits.length === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  No expense units configured. Please add expense units in Settings first.
                </AlertDescription>
              </Alert>
            )}

            {expenseUnits.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Costs are calculated by multiplying each expense unit cost by the batch size (kg).
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Expense Units Reference */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Expense Units (per kg/unit)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenseUnits.map((unit: any) => (
                <div 
                  key={unit.id} 
                  className="flex justify-between items-center p-3 bg-accent/30 rounded-lg border border-border/30 hover-elevate"
                >
                  <span className="font-medium">
                    {unit.item}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      K{parseFloat(unit.unitCost).toFixed(2)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      /{unit.unit.split('/')[1] || 'unit'}
                    </span>
                  </div>
                </div>
              ))}

              {expenseUnits.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No expense units configured yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calculation Results */}
      {result && (
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Production Cost for {result.batchSize}kg Batch</span>
              <Badge variant="default" className="text-lg px-4 py-1">
                K{result.totalCost.toFixed(2)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {result.breakdown.map((item) => (
                <div 
                  key={item.item} 
                  className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg"
                  data-testid={`result-${item.item.replace(' ', '-')}`}
                >
                  <div className="font-medium text-muted-foreground mb-1">
                    {item.item}
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    K{item.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-gradient-to-r from-green-50 to-amber-50 dark:from-green-950/30 dark:to-amber-950/30 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">
                  Total Production Cost
                </span>
              </div>
              <p className="text-3xl font-bold text-primary mb-2">
                K{result.totalCost.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                For {result.batchSize}kg batch • Estimated {Math.round(result.batchSize * 200)} crackers at 200 pieces/kg
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
