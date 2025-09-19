import { Lightbulb, TrendingUp, AlertTriangle, Target } from "lucide-react";

const insights = [
  {
    icon: TrendingUp,
    type: "positive",
    title: "Strong Performance",
    description: "Your portfolio has outperformed the Nifty 50 by 6.8% over the last quarter, driven primarily by your mid-cap holdings."
  },
  {
    icon: AlertTriangle,
    type: "warning", 
    title: "Risk Alert",
    description: "Current portfolio volatility is 18% higher than your target risk profile. Consider rebalancing towards lower-risk assets."
  },
  {
    icon: Target,
    type: "neutral",
    title: "Rebalancing Opportunity",
    description: "Your large-cap allocation has drifted 5% above target. Consider booking some profits to maintain optimal allocation."
  }
];

export const AutomatedInsights = () => {
  return (
    <div className="chart-container h-80">
      <div className="flex items-center space-x-2 mb-4">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Automated Insights</h3>
      </div>
      
      <div className="space-y-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          const typeStyles = {
            positive: "border-l-success bg-success/5",
            warning: "border-l-danger bg-danger/5",
            neutral: "border-l-primary bg-primary/5"
          };
          
          return (
            <div 
              key={index}
              className={`border-l-4 p-4 rounded-r-lg ${typeStyles[insight.type as keyof typeof typeStyles]}`}
            >
              <div className="flex items-start space-x-3">
                <Icon className="h-5 w-5 mt-1 text-muted-foreground" />
                <div>
                  <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};