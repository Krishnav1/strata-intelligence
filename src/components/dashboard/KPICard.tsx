import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  trend?: number;
  subtitle?: string;
  sparklineData?: number[];
}

export const KPICard = ({ title, value, trend, subtitle, sparklineData }: KPICardProps) => {
  const isPositive = trend !== undefined ? trend >= 0 : null;
  
  // Simple sparkline using CSS
  const SparkLine = () => {
    if (!sparklineData) return null;
    
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min;
    
    return (
      <div className="flex items-end space-x-1 h-8 w-16">
        {sparklineData.map((value, index) => {
          const height = range === 0 ? 50 : ((value - min) / range) * 100;
          return (
            <div
              key={index}
              className="bg-primary/60 rounded-sm flex-1"
              style={{ height: `${Math.max(height, 5)}%` }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="kpi-card">
      <div className="flex justify-between items-start mb-4">
        <div className="kpi-label">{title}</div>
        <SparkLine />
      </div>
      
      <div className="space-y-1">
        <div className="kpi-value">{value}</div>
        
        {(trend !== undefined || subtitle) && (
          <div className="flex items-center space-x-2">
            {trend !== undefined && (
              <div className={`flex items-center space-x-1 ${isPositive ? 'success-text' : 'danger-text'}`}>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {Math.abs(trend).toFixed(2)}%
                </span>
              </div>
            )}
            
            {subtitle && (
              <span className="text-muted-foreground text-sm">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};