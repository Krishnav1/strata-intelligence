import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from 'react';

const mockData = [
  { date: 'Jan 2024', portfolio: 100, nifty50: 100, sensex: 100, nasdaq: 100 },
  { date: 'Feb 2024', portfolio: 102.5, nifty50: 101.2, sensex: 101.8, nasdaq: 103.2 },
  { date: 'Mar 2024', portfolio: 98.7, nifty50: 99.5, sensex: 99.1, nasdaq: 101.5 },
  { date: 'Apr 2024', portfolio: 105.3, nifty50: 103.1, sensex: 102.7, nasdaq: 106.8 },
  { date: 'May 2024', portfolio: 108.9, nifty50: 105.4, sensex: 104.9, nasdaq: 109.2 },
  { date: 'Jun 2024', portfolio: 112.4, nifty50: 107.8, sensex: 106.5, nasdaq: 111.7 },
  { date: 'Jul 2024', portfolio: 115.6, nifty50: 109.2, sensex: 108.1, nasdaq: 114.3 },
  { date: 'Aug 2024', portfolio: 118.2, nifty50: 111.5, sensex: 110.2, nasdaq: 116.8 },
];

const benchmarks = [
  { value: 'nifty50', label: 'Nifty 50' },
  { value: 'sensex', label: 'Sensex' },
  { value: 'nasdaq', label: 'NASDAQ' },
];

export const PerformanceChart = () => {
  const [selectedBenchmark, setSelectedBenchmark] = useState('nifty50');

  return (
    <div className="chart-container">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Performance vs. Benchmark</h3>
        <Select value={selectedBenchmark} onValueChange={setSelectedBenchmark}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select benchmark" />
          </SelectTrigger>
          <SelectContent>
            {benchmarks.map((benchmark) => (
              <SelectItem key={benchmark.value} value={benchmark.value}>
                {benchmark.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={mockData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--popover-foreground))'
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="portfolio"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            name="Portfolio"
            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
          />
          <Line
            type="monotone"
            dataKey={selectedBenchmark}
            stroke="hsl(var(--secondary))"
            strokeWidth={2}
            name={benchmarks.find(b => b.value === selectedBenchmark)?.label}
            dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};