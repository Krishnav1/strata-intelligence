import { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";

const assetData = [
  { name: 'Nifty 50', risk: 16.2, return: 12.5, allocation: 50 },
  { name: 'Mid Cap', risk: 22.8, return: 15.2, allocation: 25 },
  { name: 'Small Cap', risk: 28.5, return: 18.7, allocation: 15 },
  { name: 'Bonds', risk: 4.1, return: 6.8, allocation: 10 },
];

const currentPortfolio = { 
  name: 'Current Portfolio', 
  risk: 18.9, 
  return: 13.8,
  color: 'hsl(var(--primary))'
};

const optimalPortfolio = { 
  name: 'Markowitz Optimal', 
  risk: 16.5, 
  return: 14.2,
  color: 'hsl(var(--success))'
};

const calculateOptimizedPortfolio = (targetReturn: number) => {
  // Simplified optimization logic
  const riskFreeRate = 6.8;
  const marketReturn = 13.8;
  const baseRisk = 16.5;
  
  // Simple linear interpolation for demo
  const riskAdjustment = (targetReturn - riskFreeRate) / (marketReturn - riskFreeRate);
  const calculatedRisk = riskFreeRate + (baseRisk - riskFreeRate) * riskAdjustment;
  
  return {
    name: 'Optimized Portfolio',
    risk: Math.max(4, Math.min(30, calculatedRisk)),
    return: targetReturn,
    color: 'hsl(var(--secondary))'
  };
};

const calculateOptimizedWeights = (targetReturn: number) => {
  // Simplified weight calculation based on target return
  const baseWeights = [0.50, 0.25, 0.15, 0.10]; // Current allocation
  const targetAdjustment = (targetReturn - 13.8) / 5; // Scale factor
  
  return assetData.map((asset, index) => {
    let weight = baseWeights[index];
    
    // Adjust weights based on target return
    if (targetReturn > 13.8) {
      // Higher target - increase risky assets
      if (asset.name === 'Small Cap' || asset.name === 'Mid Cap') {
        weight += targetAdjustment * 0.1;
      } else if (asset.name === 'Bonds') {
        weight -= targetAdjustment * 0.05;
      }
    } else {
      // Lower target - increase safe assets
      if (asset.name === 'Bonds') {
        weight += Math.abs(targetAdjustment) * 0.1;
      } else if (asset.name === 'Small Cap') {
        weight -= Math.abs(targetAdjustment) * 0.08;
      }
    }
    
    return {
      asset: asset.name,
      weight: Math.max(0, Math.min(1, weight))
    };
  });
};

export const OptimizerBacktesting = () => {
  const [targetReturn, setTargetReturn] = useState([13.8]);
  
  const optimizedPortfolio = calculateOptimizedPortfolio(targetReturn[0]);
  const optimizedWeights = calculateOptimizedWeights(targetReturn[0]);
  
  // Normalize weights to sum to 100%
  const totalWeight = optimizedWeights.reduce((sum, item) => sum + item.weight, 0);
  const normalizedWeights = optimizedWeights.map(item => ({
    ...item,
    weight: (item.weight / totalWeight) * 100
  }));

  const scatterData = [
    ...assetData.map(asset => ({
      ...asset,
      fill: 'hsl(var(--muted-foreground))',
      size: 60
    })),
    { ...currentPortfolio, fill: currentPortfolio.color, size: 120 },
    { ...optimalPortfolio, fill: optimalPortfolio.color, size: 120 },
    { ...optimizedPortfolio, fill: optimizedPortfolio.color, size: 120 },
  ];

  return (
    <div className="space-y-6">
      {/* Risk vs Return Scatter Plot */}
      <div className="chart-container">
        <h3 className="text-lg font-semibold mb-4">Risk vs. Return Analysis</h3>
        
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              dataKey="risk"
              name="Risk (Volatility %)"
              domain={[0, 35]}
              tickFormatter={(value) => `${value}%`}
              stroke="hsl(var(--muted-foreground))"
              label={{ value: 'Risk (Volatility %)', position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              type="number"
              dataKey="return"
              name="Expected Return %"
              domain={[5, 25]}
              tickFormatter={(value) => `${value}%`}
              stroke="hsl(var(--muted-foreground))"
              label={{ value: 'Expected Return %', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value, name) => [`${value}%`, name]}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return payload[0].payload.name;
                }
                return '';
              }}
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--popover-foreground))'
              }}
            />
            <Scatter
              data={scatterData}
              fill="hsl(var(--primary))"
            />
          </ScatterChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-muted-foreground"></div>
            <span>Individual Assets</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span>Current Portfolio</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-success"></div>
            <span>Markowitz Optimal</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-secondary"></div>
            <span>Target Optimized</span>
          </div>
        </div>
      </div>

      {/* Target Return Slider */}
      <div className="chart-container">
        <h3 className="text-lg font-semibold mb-4">Portfolio Optimization</h3>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Target Return</label>
              <span className="text-lg font-bold text-primary">
                {targetReturn[0].toFixed(1)}%
              </span>
            </div>
            <Slider
              value={targetReturn}
              onValueChange={setTargetReturn}
              min={6}
              max={20}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>6% (Conservative)</span>
              <span>20% (Aggressive)</span>
            </div>
          </div>

          {/* Optimized Portfolio Weights */}
          <Card className="p-6">
            <h4 className="font-semibold mb-4">Optimized Asset Allocation</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {normalizedWeights.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">{item.asset}</div>
                  <div className="text-2xl font-bold text-primary">
                    {item.weight.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span>Expected Return:</span>
                <span className="font-semibold success-text">{targetReturn[0].toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Expected Risk:</span>
                <span className="font-semibold">{optimizedPortfolio.risk.toFixed(1)}%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};