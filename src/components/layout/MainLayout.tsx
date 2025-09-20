import React from 'react';
import { TrendingUp } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Strata Intelligence</h1>
                <p className="text-xs text-muted-foreground">Portfolio Intelligence Platform</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Demo Mode</div>
              <div className="text-xs text-muted-foreground">No authentication required</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};
