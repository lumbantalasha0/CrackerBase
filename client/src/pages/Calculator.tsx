import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator as CalculatorIcon, Package, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Mock ingredient ratios - todo: remove mock functionality
const ingredientRatios = {
  salt: 0.02,      // 20g per kg flour
  sugar: 0.05,     // 50g per kg flour  
  oil: 0.15,       // 150ml per kg flour
  baking_powder: 0.01, // 10g per kg flour
  water: 0.4       // 400ml per kg flour
};

interface CalculationResult {
  flourKg: number;
  ingredients: Record<string, string>;
}

export default function Calculator() {
  const [flourAmount, setFlourAmount] = useState("");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    const amount = parseFloat(flourAmount);
    if (!amount || amount <= 0) {
      return;
    }

    setIsCalculating(true);
    
    // Mock calculation delay
    setTimeout(() => {
      const ingredients: Record<string, string> = {};
      
      Object.entries(ingredientRatios).forEach(([ingredient, ratio]) => {
        const calculatedAmount = amount * ratio;
        const unit = ['oil', 'water'].includes(ingredient) ? 'ml' : 'g';
        ingredients[ingredient.replace('_', ' ')] = `${calculatedAmount.toFixed(1)}${unit}`;
      });

      setResult({
        flourKg: amount,
        ingredients
      });
      
      setIsCalculating(false);
    }, 800);
  };

  const resetCalculation = () => {
    setFlourAmount("");
    setResult(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          Ingredients Calculator
        </h1>
        <p className="text-muted-foreground">
          Calculate ingredient quantities based on flour amount
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calculator Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalculatorIcon className="h-5 w-5" />
              Calculate Ingredients
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="flour">Flour Amount (kg)</Label>
              <Input
                id="flour"
                type="number"
                step="0.1"
                value={flourAmount}
                onChange={(e) => setFlourAmount(e.target.value)}
                placeholder="Enter flour amount in kg"
                min="0.1"
                data-testid="input-flour-amount"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCalculate}
                disabled={!flourAmount || parseFloat(flourAmount) <= 0 || isCalculating}
                className="flex-1"
                data-testid="button-calculate"
              >
                {isCalculating ? "Calculating..." : "Calculate"}
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

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                These ratios are based on standard crackers recipes. Adjust according to your specific requirements.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Ingredient Ratios Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Standard Ratios (per 1kg flour)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(ingredientRatios).map(([ingredient, ratio]) => {
                const unit = ['oil', 'water'].includes(ingredient) ? 'ml' : 'g';
                const amount = (ratio * 1000).toFixed(0);
                
                return (
                  <div key={ingredient} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium capitalize">
                      {ingredient.replace('_', ' ')}
                    </span>
                    <Badge variant="outline">
                      {amount}{unit}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calculation Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>
              Calculation Results for {result.flourKg}kg Flour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(result.ingredients).map(([ingredient, amount]) => (
                <div 
                  key={ingredient} 
                  className="p-4 bg-primary/5 border border-primary/20 rounded-lg"
                  data-testid={`result-${ingredient.replace(' ', '-')}`}
                >
                  <div className="font-medium text-primary capitalize mb-1">
                    {ingredient}
                  </div>
                  <div className="text-2xl font-bold">
                    {amount}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Total Production Estimate
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                With {result.flourKg}kg of flour, you can produce approximately {Math.round(result.flourKg * 200)} pieces of crackers.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}