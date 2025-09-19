import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, TrendingUp, TrendingDown, BarChart3, Info, RefreshCw } from 'lucide-react';

interface DataPreviewProps {
  portfolioId: string;
  files: any[];
}

// Mock data for preview - in real implementation, this would come from Supabase
const mockPreviewData = {
  assets: {
    headers: ['Date', 'NIFTY_50', 'NIFTY_MIDCAP_150', 'GOLD_ETF', 'LIQUID_FUND'],
    rows: [
      ['2024-01-01', '21731.40', '47123.80', '5234.20', '4156.78'],
      ['2024-01-02', '21856.75', '47456.20', '5245.60', '4157.12'],
      ['2024-01-03', '21723.90', '47234.80', '5221.40', '4157.45'],
      ['2024-01-04', '21945.60', '47567.40', '5267.80', '4157.89'],
      ['2024-01-05', '22012.30', '47678.90', '5289.30', '4158.23'],
    ],
    stats: {
      totalRows: 252,
      dateRange: '2024-01-01 to 2024-12-31',
      assets: 4,
      completeness: 98.5
    }
  },
  factors: {
    headers: ['Date', 'INTEREST_RATE_10Y', 'USD_INR', 'CRUDE_OIL', 'VIX_INDIA'],
    rows: [
      ['2024-01-01', '7.25', '82.45', '78.90', '16.45'],
      ['2024-01-02', '7.28', '82.52', '79.15', '16.23'],
      ['2024-01-03', '7.22', '82.38', '78.65', '16.78'],
      ['2024-01-04', '7.31', '82.67', '79.45', '15.89'],
      ['2024-01-05', '7.29', '82.59', '79.23', '16.12'],
    ],
    stats: {
      totalRows: 252,
      dateRange: '2024-01-01 to 2024-12-31',
      factors: 4,
      completeness: 99.2
    }
  },
  benchmarks: {
    headers: ['Date', 'NIFTY_50_TR', 'SENSEX_TR', 'MSCI_INDIA'],
    rows: [
      ['2024-01-01', '28456.78', '71234.45', '2345.67'],
      ['2024-01-02', '28623.45', '71456.78', '2356.89'],
      ['2024-01-03', '28398.90', '71098.76', '2334.56'],
      ['2024-01-04', '28734.56', '71567.89', '2378.90'],
      ['2024-01-05', '28789.45', '71634.56', '2389.45'],
    ],
    stats: {
      totalRows: 252,
      dateRange: '2024-01-01 to 2024-12-31',
      benchmarks: 3,
      completeness: 100.0
    }
  },
  sector_holdings: {
    headers: ['Asset_Name', 'Sector', 'Weight_Percent', 'Market_Value_INR', 'Beta'],
    rows: [
      ['ICICI_PRUD_NIFTY_50_ETF', 'Large_Cap_Equity', '35.5', '5325000', '0.98'],
      ['HDFC_MIDCAP_OPPORTUNITIES', 'Mid_Cap_Equity', '25.2', '3780000', '1.15'],
      ['SBI_SMALL_CAP_FUND', 'Small_Cap_Equity', '15.8', '2370000', '1.32'],
      ['HDFC_BANK_ETF', 'Banking', '10.5', '1575000', '1.08'],
      ['GOLD_BEES_ETF', 'Commodities', '8.0', '1200000', '0.12'],
    ],
    stats: {
      totalRows: 12,
      totalValue: '₹15,00,00,000',
      sectors: 5,
      completeness: 100.0
    }
  }
};

export const DataPreview: React.FC<DataPreviewProps> = ({
  portfolioId,
  files,
}) => {
  const [activeTab, setActiveTab] = useState('assets');

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
    const data = mockPreviewData[type as keyof typeof mockPreviewData];
    if (!data) return null;

    return (
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(data.stats).map(([key, value]) => (
            <Card key={key}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{value}</div>
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
