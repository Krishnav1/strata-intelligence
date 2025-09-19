import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const riskDecompositionData = [
  { name: 'Nifty 50', riskContribution: 45, color: 'hsl(var(--chart-primary))' },
  { name: 'Mid Cap', riskContribution: 30, color: 'hsl(var(--chart-secondary))' },
  { name: 'Small Cap', riskContribution: 20, color: 'hsl(var(--chart-tertiary))' },
  { name: 'Bonds', riskContribution: 5, color: 'hsl(var(--chart-quaternary))' },
];

const riskMetrics = [
  { asset: 'Nifty 50', weight: '50%', volatility: '16.2%', riskContribution: '45%' },
  { asset: 'Mid Cap', weight: '25%', volatility: '22.8%', riskContribution: '30%' },
  { asset: 'Small Cap', weight: '15%', volatility: '28.5%', riskContribution: '20%' },
  { asset: 'Bonds', weight: '10%', volatility: '4.1%', riskContribution: '5%' },
];

const standardDeviation = [
  { metric: 'Daily Standard Deviation', value: '1.85%' },
  { metric: 'Annual Standard Deviation', value: '29.4%' },
];

const correlationData = [
  { benchmark: 'Nifty 50', correlation: '0.87' },
  { benchmark: 'Sensex', correlation: '0.84' },
  { benchmark: 'NASDAQ', correlation: '0.42' },
];

const varData = [
  { confidence: '95% VaR (1 Day)', value: '-₹2,85,000' },
  { confidence: '99% VaR (1 Day)', value: '-₹4,12,000' },
  { confidence: '95% VaR (10 Days)', value: '-₹9,01,000' },
  { confidence: 'Expected Shortfall (95%)', value: '-₹3,67,000' },
];

export const RiskDiagnostics = () => {
  return (
    <div className="space-y-6">
      {/* Risk Metrics Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="data-table">
          <div className="table-header p-4">
            <h3 className="font-semibold">Standard Deviation</h3>
          </div>
          <div className="divide-y divide-border">
            {standardDeviation.map((item, index) => (
              <div key={index} className="table-row p-4 flex justify-between">
                <span className="text-sm">{item.metric}</span>
                <span className="text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="data-table">
          <div className="table-header p-4">
            <h3 className="font-semibold">Portfolio Correlation</h3>
          </div>
          <div className="divide-y divide-border">
            {correlationData.map((item, index) => (
              <div key={index} className="table-row p-4 flex justify-between">
                <span className="text-sm">{item.benchmark}</span>
                <span className="text-sm font-medium">{item.correlation}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Decomposition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-container">
          <h3 className="text-lg font-semibold mb-4">Risk Contribution by Asset</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={riskDecompositionData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="riskContribution"
                label={({ name, riskContribution }) => `${name}: ${riskContribution}%`}
              >
                {riskDecompositionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--popover-foreground))'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="data-table">
          <div className="table-header p-4">
            <h3 className="font-semibold">Risk Decomposition Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="text-left p-3 text-xs">Asset</th>
                  <th className="text-left p-3 text-xs">Weight</th>
                  <th className="text-left p-3 text-xs">Volatility</th>
                  <th className="text-left p-3 text-xs">Risk Contrib.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {riskMetrics.map((row, index) => (
                  <tr key={index} className="table-row">
                    <td className="p-3 text-sm font-medium">{row.asset}</td>
                    <td className="p-3 text-sm">{row.weight}</td>
                    <td className="p-3 text-sm">{row.volatility}</td>
                    <td className="p-3 text-sm font-medium">{row.riskContribution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Value at Risk Summary */}
      <div className="data-table">
        <div className="table-header p-4">
          <h3 className="font-semibold">Value at Risk (VaR) Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
          {varData.map((item, index) => (
            <div key={index} className="bg-muted/30 rounded-lg p-4 text-center">
              <div className="text-xs text-muted-foreground mb-2">{item.confidence}</div>
              <div className="text-lg font-bold danger-text">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};