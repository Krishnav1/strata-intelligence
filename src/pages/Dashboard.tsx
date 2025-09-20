import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPICard } from '@/components/dashboard/KPICard';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { AssetAllocation } from '@/components/dashboard/AssetAllocation';
import { AutomatedInsights } from '@/components/dashboard/AutomatedInsights';
import { RiskDiagnostics } from '@/components/dashboard/RiskDiagnostics';
import { SensitivityTesting } from '@/components/dashboard/SensitivityTesting';
import { OptimizerBacktesting } from '@/components/dashboard/OptimizerBacktesting';
import { useSimpleAnalysis } from '@/hooks/useSimpleAnalysis';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { BarChart3, Target, TrendingUp, Shield } from 'lucide-react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { analysisResults, isAnalysisLoading, hasAnalysisResults } = useSimpleAnalysis();

  if (isAnalysisLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analysis results...</span>
      </div>
    );
  }

  if (!hasAnalysisResults) {
    return (
      <Alert>
        <AlertDescription>
          No analysis results available yet. Please upload your data files first.
        </AlertDescription>
      </Alert>
    );
  }

  // Use analysis results if available, otherwise show mock data
  const performanceMetrics = analysisResults?.performance_metrics || {};
  const riskMetrics = analysisResults?.risk_metrics || {};
  
  const kpiData = [
    {
      title: 'Total Return',
      value: performanceMetrics.total_return ? `${(performanceMetrics.total_return * 100).toFixed(1)}%` : '15.0%',
      trend: 1.8,
      subtitle: 'Portfolio performance',
      sparklineData: [100, 103, 101, 107, 110, 115, 118, 122]
    },
    {
      title: 'Volatility',
      value: performanceMetrics.volatility ? `${(performanceMetrics.volatility * 100).toFixed(1)}%` : '12.0%',
      trend: 0.5,
      subtitle: 'Risk measure',
      sparklineData: [100, 105, 108, 112, 115, 118, 120, 125]
    },
    {
      title: 'Sharpe Ratio',
      value: performanceMetrics.sharpe_ratio ? performanceMetrics.sharpe_ratio.toFixed(2) : '1.25',
      trend: 2.1,
      subtitle: 'Risk-adjusted return',
      sparklineData: [100, 102, 98, 105, 108, 112, 115, 118]
    },
    {
      title: 'Max Drawdown',
      value: performanceMetrics.max_drawdown ? `${(performanceMetrics.max_drawdown * 100).toFixed(1)}%` : '-8.0%',
      trend: -0.3,
      subtitle: 'Worst decline',
      sparklineData: [100, 98, 95, 97, 94, 92, 90, 88]
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'risk', label: 'Risk Diagnostics', icon: Shield },
    { id: 'sensitivity', label: 'Stress Testing', icon: Target },
    { id: 'optimizer', label: 'Optimizer', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Retirement Fund</h1>
              <p className="text-muted-foreground">Professional Portfolio Intelligence Dashboard</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Last Updated</div>
              <div className="text-sm font-medium">Dec 19, 2024 • 2:30 PM IST</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Navigation Tabs */}
          <TabsList className="grid w-full grid-cols-4 bg-card border border-border mb-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="nav-tab flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpiData.map((kpi, index) => (
                <KPICard key={index} {...kpi} />
              ))}
            </div>

            {/* Main Performance Chart */}
            <PerformanceChart />

            {/* Asset Allocation & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AssetAllocation />
              <AutomatedInsights />
            </div>
          </TabsContent>

          {/* Risk Diagnostics Tab */}
          <TabsContent value="risk">
            <RiskDiagnostics />
          </TabsContent>

          {/* Sensitivity Testing Tab */}
          <TabsContent value="sensitivity">
            <SensitivityTesting />
          </TabsContent>

          {/* Optimizer Tab */}
          <TabsContent value="optimizer">
            <OptimizerBacktesting />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;