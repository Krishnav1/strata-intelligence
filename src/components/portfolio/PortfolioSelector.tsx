import React, { useState } from 'react';
import { usePortfolios } from '@/hooks/usePortfolios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Briefcase, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface PortfolioSelectorProps {
  selectedPortfolioId: string | null;
  onPortfolioSelect: (portfolioId: string) => void;
}

export const PortfolioSelector: React.FC<PortfolioSelectorProps> = ({
  selectedPortfolioId,
  onPortfolioSelect,
}) => {
  const { portfolios, isLoading, createPortfolio, isCreating } = usePortfolios();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioDescription, setNewPortfolioDescription] = useState('');

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolioName.trim()) return;

    createPortfolio(
      {
        name: newPortfolioName.trim(),
        description: newPortfolioDescription.trim() || null,
      },
      {
        onSuccess: (portfolio) => {
          setIsCreateDialogOpen(false);
          setNewPortfolioName('');
          setNewPortfolioDescription('');
          onPortfolioSelect(portfolio.id);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Selection</h2>
          <p className="text-muted-foreground">
            Choose a portfolio to analyze or create a new one
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Portfolio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Portfolio</DialogTitle>
              <DialogDescription>
                Create a new portfolio to start analyzing your investments.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePortfolio} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Portfolio Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Retirement Fund, Growth Portfolio"
                  value={newPortfolioName}
                  onChange={(e) => setNewPortfolioName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this portfolio..."
                  value={newPortfolioDescription}
                  onChange={(e) => setNewPortfolioDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Portfolio
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {portfolios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Portfolios Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first portfolio to start analyzing your investments with our professional-grade tools.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Portfolio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolios.map((portfolio) => (
            <Card
              key={portfolio.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedPortfolioId === portfolio.id
                  ? 'ring-2 ring-primary border-primary'
                  : ''
              }`}
              onClick={() => onPortfolioSelect(portfolio.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  {portfolio.name}
                </CardTitle>
                {portfolio.description && (
                  <CardDescription>{portfolio.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  Created {format(new Date(portfolio.created_at), 'MMM d, yyyy')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {portfolios.length > 0 && (
        <div className="flex items-center space-x-4">
          <Label htmlFor="portfolio-select">Quick Select:</Label>
          <Select
            value={selectedPortfolioId || ''}
            onValueChange={onPortfolioSelect}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Choose a portfolio" />
            </SelectTrigger>
            <SelectContent>
              {portfolios.map((portfolio) => (
                <SelectItem key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
