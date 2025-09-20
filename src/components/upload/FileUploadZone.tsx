import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSimpleAnalysis } from '@/hooks/useSimpleAnalysis';
import { SampleDatasetCard } from './SampleDatasetCard';
import { DataPreview } from './DataPreview';
import { DataSuggestions } from './DataSuggestions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, File, CheckCircle, AlertCircle, Trash2, Loader2, Download, Info } from 'lucide-react';
import { format } from 'date-fns';

interface FileUploadZoneProps {
  portfolioId?: string;
  onAllFilesUploaded?: () => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  portfolioId = 'simple-analysis', // Default session ID for simple analysis
  onAllFilesUploaded,
}) => {
  const {
    session,
    files,
    uploadFile,
    isUploading,
    getFilesByType,
    getRequiredFileTypes,
    isAllFilesUploaded,
    hasAnalysisResults,
  } = useSimpleAnalysis();

  // Call onAllFilesUploaded when analysis is ready
  useEffect(() => {
    if (hasAnalysisResults && onAllFilesUploaded) {
      onAllFilesUploaded();
    }
  }, [hasAnalysisResults, onAllFilesUploaded]);

  const [selectedFileType, setSelectedFileType] = useState<string>('assets');

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        uploadFile({
          file,
          fileType: selectedFileType as 'assets' | 'factors' | 'benchmarks' | 'sector_holdings',
        });
      });
    },
    [uploadFile, selectedFileType]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: true,
  });

  const requiredFileTypes = getRequiredFileTypes();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      succeeded: 'default',
      failed: 'destructive',
      running: 'secondary',
      queued: 'outline',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };

  React.useEffect(() => {
    if (isAllFilesUploaded && onAllFilesUploaded) {
      onAllFilesUploaded();
    }
  }, [isAllFilesUploaded, onAllFilesUploaded]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Data Upload</h2>
        <p className="text-muted-foreground">
          Upload the required data files to start your portfolio analysis
        </p>
      </div>

      {/* Tabs for Upload vs Sample Data */}
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Your Data</TabsTrigger>
          <TabsTrigger value="samples">
            <Download className="h-4 w-4 mr-2" />
            Sample Datasets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6 mt-6">

      {/* File Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select File Type</CardTitle>
          <CardDescription>
            Choose the type of data you're uploading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {requiredFileTypes.map(({ type, label }) => (
              <Button
                key={type}
                variant={selectedFileType === type ? 'default' : 'outline'}
                onClick={() => setSelectedFileType(type)}
                className="h-auto p-3 flex flex-col items-center"
              >
                <File className="h-4 w-4 mb-1" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-muted-foreground">
                  Uploading as: <strong>{requiredFileTypes.find(t => t.type === selectedFileType)?.label}</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports CSV, XLS, XLSX files
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>


      {/* Files Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requiredFileTypes.map(({ type, label, description }) => {
          const typeFiles = getFilesByType(type);
          const hasSuccessfulFile = typeFiles.some(f => f.status === 'succeeded');

          return (
            <Card key={type} className={hasSuccessfulFile ? 'border-green-200' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{label}</span>
                  {hasSuccessfulFile && <CheckCircle className="h-5 w-5 text-green-500" />}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent>
                {typeFiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No files uploaded</p>
                ) : (
                  <div className="space-y-2">
                    {typeFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded"
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          {getStatusIcon(file.status)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {file.original_filename}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(file.created_at), 'MMM d, HH:mm')}
                              {file.file_size && ` • ${Math.round(file.file_size / 1024)} KB`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(file.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Data Suggestions */}
      <DataSuggestions 
        portfolioId={portfolioId} 
        uploadedFileTypes={Object.values(files).map(f => f.file_type)} 
      />

      {/* Data Preview */}
      {Object.keys(files).length > 0 && (
        <DataPreview portfolioId={portfolioId} files={Object.values(files)} />
      )}

      {/* Status Alert */}
      {isAllFilesUploaded && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            All required files have been uploaded successfully! You can now proceed to analysis.
          </AlertDescription>
        </Alert>
      )}
        </TabsContent>

        <TabsContent value="samples" className="space-y-6 mt-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Sample Datasets</h3>
            <p className="text-muted-foreground mb-6">
              Download sample datasets to understand the expected data format and structure. 
              These datasets contain realistic Indian market data that you can use to test the platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SampleDatasetCard datasetType="assets" />
            <SampleDatasetCard datasetType="factors" />
            <SampleDatasetCard datasetType="benchmarks" />
            <SampleDatasetCard datasetType="sector_holdings" />
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Pro Tip:</strong> Download all four sample datasets to see how they work together. 
              You can modify these files with your own data while maintaining the same structure.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};
