import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { Eye, TrendingUp, TrendingDown, BarChart3, Info, RefreshCw } from 'lucide-react';

interface DataPreviewProps {
  portfolioId: string;
  files: any[];
}

interface PreviewData {
  stats: Record<string, string | number>;
  headers: string[];
  rows: (string | number)[][];
}


export const DataPreview: React.FC<DataPreviewProps> = ({
  portfolioId,
  files,
}) => {
  const [activeTab, setActiveTab] = useState('assets');

  const { data: previewData, isLoading: isPreviewLoading } = useQuery<PreviewData | null>({
    queryKey: ['preview', portfolioId, activeTab],
    queryFn: async () => {
      const file = getFileByType(activeTab);
      if (!file) return null;

      const response = await fetch(`/api/v1/data/preview/${file.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch preview data');
      }
      return response.json();
    },
    enabled: !!getFileByType(activeTab),
  });

  const getFileByType = (type: string) => {
    return files.find(file => file.file_type === type && file.status === 'succeeded');
  };

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'assets':
        return <TrendingUp className="h-4 w-4" />;
      case 'factors':
        return <BarChart3 className="h-4 w-4" />;
      case 'benchmarks':
        return <TrendingDown className="h-4 w-4" />;
      case 'sector_holdings':
        return <Eye className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const renderDataTable = (type: string) => {
    if (isPreviewLoading) {
      return <div>Loading preview...</div>;
    }

    const data = previewData;
    if (!data) return null;

    return (
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(data.stats).map(([key, value]) => (
            <Card key={key}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{String(value)}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Data Preview</span>
              <Badge variant="outline">First 5 rows</Badge>
            </CardTitle>
            <CardDescription>
              Sample of your uploaded {type.replace('_', ' ')} data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    {data.headers.map((header, index) => (
                      <TableHead key={index} className="whitespace-nowrap">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex} className="whitespace-nowrap">
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  };

  const availableDataTypes = ['assets', 'factors', 'benchmarks', 'sector_holdings'].filter(
    type => getFileByType(type)
  );

  if (availableDataTypes.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Upload your data files to see a preview of the processed data here.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Eye className="h-5 w-5 mr-2" />
          Data Preview
        </CardTitle>
        <CardDescription>
          Preview of your uploaded and processed data. This shows the first few rows and key statistics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            {['assets', 'factors', 'benchmarks', 'sector_holdings'].map((type) => {
              const file = getFileByType(type);
              const isAvailable = !!file;
              const Icon = getTabIcon(type);
              
              return (
                <TabsTrigger
                  key={type}
                  value={type}
                  disabled={!isAvailable}
                  className="flex items-center space-x-2"
                >
                  <Icon />
                  <span className="hidden sm:inline capitalize">
                    {type.replace('_', ' ')}
                  </span>
                  {isAvailable && (
                    <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                      ✓
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {availableDataTypes.map((type) => (
            <TabsContent key={type} value={type} className="mt-6">
              {renderDataTable(type)}
            </TabsContent>
          ))}
        </Tabs>

        {/* Data Quality Alert */}
        <Alert className="mt-6">
          <RefreshCw className="h-4 w-4" />
          <AlertDescription>
            <strong>Data Processing Complete:</strong> Your files have been processed and validated. 
            {availableDataTypes.length === 4 
              ? ' All required datasets are ready for analysis!'
              : ` ${4 - availableDataTypes.length} more file(s) needed for complete analysis.`
            }
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
