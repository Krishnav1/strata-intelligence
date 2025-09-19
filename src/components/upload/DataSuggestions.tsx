import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Database, 
  Users, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  X, 
  Download,
  Sparkles,
  Clock,
  BarChart3
} from 'lucide-react';

interface DataSuggestion {
  id: string;
  type: 'similar_assets' | 'same_period' | 'same_structure' | 'popular_dataset';
  title: string;
  description: string;
  similarity_score: number;
  data_info: {
    asset_count?: number;
    date_range?: string;
    users_count?: number;
    file_type: string;
    sample_assets?: string[];
  };
  status: 'pending' | 'accepted' | 'dismissed';
}

interface DataSuggestionsProps {
  portfolioId: string;
  uploadedFileTypes: string[];
}

// Mock suggestions - in real implementation, this would come from the similarity detection system
const mockSuggestions: DataSuggestion[] = [
  {
    id: '1',
    type: 'similar_assets',
    title: 'Similar Asset Portfolio Found',
    description: 'We found a dataset with 85% similar assets to your portfolio',
    similarity_score: 0.85,
    data_info: {
      asset_count: 12,
      date_range: '2020-2024',
      users_count: 3,
      file_type: 'assets',
      sample_assets: ['NIFTY_50', 'NIFTY_MIDCAP_150', 'GOLD_ETF', 'HDFC_BANK']
    },
    status: 'pending'
  },
  {
    id: '2',
    type: 'same_period',
    title: 'Exact Time Period Match',
    description: 'Dataset covering the same period (Jan 2023 - Dec 2024) with Indian market factors',
    similarity_score: 1.0,
    data_info: {
      date_range: 'Jan 2023 - Dec 2024',
      users_count: 8,
      file_type: 'factors',
      sample_assets: ['INTEREST_RATE_10Y', 'USD_INR', 'CRUDE_OIL', 'VIX_INDIA']
    },
    status: 'pending'
  },
  {
    id: '3',
    type: 'popular_dataset',
    title: 'Most Popular Benchmark Set',
    description: 'Comprehensive Indian benchmark indices used by 15+ users',
    similarity_score: 0.92,
    data_info: {
      users_count: 18,
      file_type: 'benchmarks',
      date_range: '2020-2024',
      sample_assets: ['NIFTY_50_TR', 'SENSEX_TR', 'NIFTY_500_TR', 'MSCI_INDIA']
    },
    status: 'pending'
  },
  {
    id: '4',
    type: 'same_structure',
    title: 'Matching Data Structure',
    description: 'Sector holdings with identical format and comprehensive Indian equity coverage',
    similarity_score: 0.78,
    data_info: {
      asset_count: 25,
      file_type: 'sector_holdings',
      users_count: 5,
      sample_assets: ['Large_Cap_Equity', 'Mid_Cap_Equity', 'Banking', 'Technology']
    },
    status: 'pending'
  }
];

export const DataSuggestions: React.FC<DataSuggestionsProps> = ({
  portfolioId,
  uploadedFileTypes,
}) => {
  const [suggestions, setSuggestions] = useState<DataSuggestion[]>(mockSuggestions);
  const [loading, setLoading] = useState(false);

  const handleAcceptSuggestion = async (suggestionId: string) => {
    setLoading(true);
    // In real implementation, this would:
    // 1. Copy the suggested data to user's portfolio
    // 2. Update the suggestion status
    // 3. Refresh the data preview
    
    setTimeout(() => {
      setSuggestions(prev => 
        prev.map(s => 
          s.id === suggestionId 
            ? { ...s, status: 'accepted' as const }
            : s
        )
      );
      setLoading(false);
    }, 1000);
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => 
      prev.map(s => 
        s.id === suggestionId 
          ? { ...s, status: 'dismissed' as const }
          : s
      )
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'similar_assets':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'same_period':
        return <Calendar className="h-4 w-4 text-green-500" />;
      case 'same_structure':
        return <Database className="h-4 w-4 text-purple-500" />;
      case 'popular_dataset':
        return <Users className="h-4 w-4 text-orange-500" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'similar_assets':
        return 'Similar Assets';
      case 'same_period':
        return 'Same Period';
      case 'same_structure':
        return 'Same Structure';
      case 'popular_dataset':
        return 'Popular Dataset';
      default:
        return 'Suggestion';
    }
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-blue-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const acceptedSuggestions = suggestions.filter(s => s.status === 'accepted');

  if (pendingSuggestions.length === 0 && acceptedSuggestions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
          Smart Data Suggestions
        </CardTitle>
        <CardDescription>
          We found similar datasets that might be useful for your analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {/* Pending Suggestions */}
            {pendingSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getTypeIcon(suggestion.type)}
                        <Badge variant="outline">
                          {getTypeLabel(suggestion.type)}
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className={getSimilarityColor(suggestion.similarity_score)}
                        >
                          {Math.round(suggestion.similarity_score * 100)}% match
                        </Badge>
                      </div>
                      
                      <h4 className="font-semibold text-sm mb-1">
                        {suggestion.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {suggestion.description}
                      </p>

                      {/* Data Info */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                        {suggestion.data_info.asset_count && (
                          <div className="flex items-center">
                            <Database className="h-3 w-3 mr-1" />
                            {suggestion.data_info.asset_count} assets
                          </div>
                        )}
                        {suggestion.data_info.date_range && (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {suggestion.data_info.date_range}
                          </div>
                        )}
                        {suggestion.data_info.users_count && (
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {suggestion.data_info.users_count} users
                          </div>
                        )}
                        <div className="flex items-center">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          {suggestion.data_info.file_type}
                        </div>
                      </div>

                      {/* Sample Assets */}
                      {suggestion.data_info.sample_assets && (
                        <div className="mb-3">
                          <div className="text-xs text-muted-foreground mb-1">Sample data:</div>
                          <div className="flex flex-wrap gap-1">
                            {suggestion.data_info.sample_assets.slice(0, 3).map((asset, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {asset}
                              </Badge>
                            ))}
                            {suggestion.data_info.sample_assets.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{suggestion.data_info.sample_assets.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptSuggestion(suggestion.id)}
                        disabled={loading}
                        className="text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Use Data
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDismissSuggestion(suggestion.id)}
                        className="text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Accepted Suggestions */}
            {acceptedSuggestions.length > 0 && (
              <>
                <Separator />
                <div className="text-sm font-medium text-muted-foreground">
                  Recently Used Suggestions
                </div>
                {acceptedSuggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="border-l-4 border-l-green-500 bg-green-50/50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">{suggestion.title}</span>
                          <Badge variant="secondary" className="text-green-600">
                            Applied
                          </Badge>
                        </div>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </ScrollArea>

        {pendingSuggestions.length > 0 && (
          <Alert className="mt-4">
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              <strong>Smart Suggestions:</strong> These datasets have been used successfully by other users 
              with similar portfolios. Using them can save you time and improve your analysis quality.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
