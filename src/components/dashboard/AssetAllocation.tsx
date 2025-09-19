import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const allocationData = [
  { name: 'Nifty 50', value: 50, color: 'hsl(var(--chart-primary))' },
  { name: 'Mid Cap', value: 25, color: 'hsl(var(--chart-secondary))' },
  { name: 'Small Cap', value: 15, color: 'hsl(var(--chart-tertiary))' },
  { name: 'Bonds', value: 10, color: 'hsl(var(--chart-quaternary))' },
];

export const AssetAllocation = () => {
  return (
    <div className="chart-container h-80">
      <h3 className="text-lg font-semibold mb-4">Asset Allocation</h3>
      
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={allocationData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}%`}
          >
            {allocationData.map((entry, index) => (
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
  );
};