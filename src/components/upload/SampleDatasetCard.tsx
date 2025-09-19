import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Download, ChevronDown, Info, FileText, Database } from 'lucide-react';
import { sampleDatasets, downloadSampleDataset } from '@/data/sampleDatasets';

interface SampleDatasetCardProps {
  datasetType: keyof typeof sampleDatasets;
  className?: string;
}

export const SampleDatasetCard: React.FC<SampleDatasetCardProps> = ({
  datasetType,
  className = '',
}) => {
  const dataset = sampleDatasets[datasetType];
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleDownload = () => {
    downloadSampleDataset(datasetType);
  };

  const getTypeIcon = () => {
    switch (datasetType) {
      case 'assets':
        return <Database className="h-5 w-5 text-blue-500" />;
      case 'factors':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'benchmarks':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'sector_holdings':
        return <FileText className="h-5 w-5 text-orange-500" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeBadge = () => {
    const badges = {
      assets: { label: 'Assets', variant: 'default' as const },
      factors: { label: 'Risk Factors', variant: 'secondary' as const },
      benchmarks: { label: 'Benchmarks', variant: 'outline' as const },
      sector_holdings: { label: 'Holdings', variant: 'destructive' as const },
    };
    
    const badge = badges[datasetType];
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  return (
    <Card className={`${className} hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {getTypeIcon()}
            <div>
              <CardTitle className="text-lg">{dataset.filename}</CardTitle>
              <CardDescription className="mt-1">
                {dataset.description}
              </CardDescription>
            </div>
          </div>
          {getTypeBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Download Button */}
        <Button onClick={handleDownload} className="w-full" variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Sample Dataset
        </Button>

        {/* Expandable Details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <span className="flex items-center text-sm text-muted-foreground">
                <Info className="h-4 w-4 mr-2" />
                View Details & Format
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 mt-4">
            {/* Headers */}
            <div>
              <h4 className="text-sm font-medium mb-2">Expected Columns:</h4>
              <div className="flex flex-wrap gap-1">
                {dataset.headers.map((header, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {header}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Sample Data Preview */}
            <div>
              <h4 className="text-sm font-medium mb-2">Sample Data Preview:</h4>
              <div className="bg-muted/50 rounded-md p-3 text-xs font-mono overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    {dataset.sampleData.slice(0, 4).map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex === 0 ? 'font-semibold' : ''}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="pr-4 py-1 whitespace-nowrap">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Important Notes */}
            <div>
              <h4 className="text-sm font-medium mb-2">Important Notes:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {dataset.notes.map((note, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block w-1 h-1 bg-muted-foreground rounded-full mt-2 mr-2 flex-shrink-0" />
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
