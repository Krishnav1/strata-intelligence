import { useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const factors = [
  { id: 'interestRate', label: 'Interest Rates', unit: '%', min: -2, max: 3, initial: 0, step: 0.1 },
  { id: 'usdInr', label: 'USD/INR', unit: '₹', min: -10, max: 15, initial: 0, step: 1 },
  { id: 'cpi', label: 'CPI Inflation', unit: '%', min: -2, max: 4, initial: 0, step: 0.1 },
];

const generateHeatmapData = (interestRate: number, usdInr: number, cpi: number) => {
  const data = [];
  const rows = ['High', 'Medium', 'Low'];
  const cols = ['Conservative', 'Moderate', 'Aggressive'];
  
  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < cols.length; j++) {
      const baseImpact = (i - 1) * 2 + (j - 1) * 1.5;
      const impact = baseImpact + (interestRate * 0.8) + (usdInr * 0.3) + (cpi * 0.5);
      data.push({
        row: rows[i],
        col: cols[j],
        impact: impact,
        x: j,
        y: i
      });
    }
  }
  return data;
};

const getHeatmapColor = (value: number) => {
  if (value > 1) return 'bg-success/80';
  if (value > 0.5) return 'bg-success/60';
  if (value > 0) return 'bg-success/40';
  if (value > -0.5) return 'bg-danger/40';
  if (value > -1) return 'bg-danger/60';
  return 'bg-danger/80';
};

export const SensitivityTesting = () => {
  const [factorValues, setFactorValues] = useState({
    interestRate: 0,
    usdInr: 0,
    cpi: 0,
  });

  const handleFactorChange = (factorId: string, value: number[]) => {
    setFactorValues(prev => ({
      ...prev,
      [factorId]: value[0]
    }));
  };

  const heatmapData = generateHeatmapData(
    factorValues.interestRate,
    factorValues.usdInr,
    factorValues.cpi
  );

  const individualImpacts = {
    interestRate: [
      { scenario: 'Conservative', impact: factorValues.interestRate * -0.8 },
      { scenario: 'Moderate', impact: factorValues.interestRate * -1.2 },
      { scenario: 'Aggressive', impact: factorValues.interestRate * -1.6 },
    ],
    usdInr: [
      { scenario: 'Conservative', impact: factorValues.usdInr * 0.2 },
      { scenario: 'Moderate', impact: factorValues.usdInr * 0.35 },
      { scenario: 'Aggressive', impact: factorValues.usdInr * 0.5 },
    ],
    cpi: [
      { scenario: 'Conservative', impact: factorValues.cpi * -0.3 },
      { scenario: 'Moderate', impact: factorValues.cpi * -0.6 },
      { scenario: 'Aggressive', impact: factorValues.cpi * -0.9 },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Interactive Sliders */}
      <div className="chart-container">
        <h3 className="text-lg font-semibold mb-6">Macroeconomic Factor Adjustments</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {factors.map((factor) => (
            <div key={factor.id} className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">{factor.label}</label>
                <span className="text-sm font-bold text-primary">
                  {factorValues[factor.id as keyof typeof factorValues].toFixed(1)}{factor.unit}
                </span>
              </div>
              <Slider
                value={[factorValues[factor.id as keyof typeof factorValues]]}
                onValueChange={(value) => handleFactorChange(factor.id, value)}
                min={factor.min}
                max={factor.max}
                step={factor.step}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{factor.min}{factor.unit}</span>
                <span>{factor.max}{factor.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sensitivity Matrices */}
      <Tabs defaultValue="combined" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="interestRate">Interest Rate</TabsTrigger>
          <TabsTrigger value="usdInr">USD/INR</TabsTrigger>
          <TabsTrigger value="cpi">CPI Impact</TabsTrigger>
          <TabsTrigger value="combined">Combined</TabsTrigger>
        </TabsList>

        {/* Individual Factor Impacts */}
        {Object.entries(individualImpacts).map(([factorKey, impacts]) => (
          <TabsContent key={factorKey} value={factorKey}>
            <div className="chart-container">
              <h3 className="text-lg font-semibold mb-4">
                {factors.find(f => f.id === factorKey)?.label} Impact Matrix
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {impacts.map((impact, index) => (
                  <div 
                    key={index} 
                    className={`p-6 rounded-lg text-center ${
                      impact.impact > 0 ? 'bg-success/20' : 'bg-danger/20'
                    }`}
                  >
                    <div className="text-sm text-muted-foreground mb-2">{impact.scenario}</div>
                    <div className={`text-2xl font-bold ${
                      impact.impact > 0 ? 'success-text' : 'danger-text'
                    }`}>
                      {impact.impact > 0 ? '+' : ''}{impact.impact.toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        ))}

        {/* Combined Impact Heatmap */}
        <TabsContent value="combined">
          <div className="chart-container">
            <h3 className="text-lg font-semibold mb-4">Combined Impact Heatmap</h3>
            
            <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
              {/* Headers */}
              <div></div>
              <div className="text-center text-xs font-medium text-muted-foreground p-2">Conservative</div>
              <div className="text-center text-xs font-medium text-muted-foreground p-2">Moderate</div>
              <div className="text-center text-xs font-medium text-muted-foreground p-2">Aggressive</div>
              
              {/* Heatmap Grid */}
              {['High', 'Medium', 'Low'].map((rowLabel, rowIndex) => (
                <>
                  <div key={`row-${rowIndex}`} className="text-xs font-medium text-muted-foreground p-2 flex items-center">
                    {rowLabel}
                  </div>
                  {[0, 1, 2].map((colIndex) => {
                    const cellData = heatmapData.find(d => d.x === colIndex && d.y === rowIndex);
                    return (
                      <div
                        key={`cell-${rowIndex}-${colIndex}`}
                        className={`p-4 rounded-md ${getHeatmapColor(cellData?.impact || 0)} flex items-center justify-center`}
                      >
                        <span className="text-sm font-bold text-white">
                          {cellData?.impact ? `${cellData.impact > 0 ? '+' : ''}${cellData.impact.toFixed(1)}%` : '0%'}
                        </span>
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
            
            <div className="flex justify-center mt-6">
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-danger/80 rounded"></div>
                  <span>High Loss</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-muted rounded"></div>
                  <span>Neutral</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/80 rounded"></div>
                  <span>High Gain</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};