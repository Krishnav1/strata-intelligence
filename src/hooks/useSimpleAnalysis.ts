import { useState, useEffect } from 'react';

const API_BASE = 'https://strata-intelligence.onrender.com/api/v1/simple';

interface FileStatus {
  id: string;
  file_type: string;
  original_filename: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  error?: string;
}

interface AnalysisSession {
  session_id: string | null;
  files: Record<string, FileStatus>;
  analysis_results: any;
}

export const useSimpleAnalysis = () => {
  const [session, setSession] = useState<AnalysisSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Manual session fetching function
  const fetchSession = async () => {
    try {
      const response = await fetch(`${API_BASE}/session`);
      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }
      const data = await response.json();
      setSession(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Upload file function
  const uploadFile = async ({ 
    file, 
    fileType 
  }: { 
    file: File; 
    fileType: 'assets' | 'factors' | 'benchmarks' | 'sector_holdings';
  }) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('file_type', fileType);

      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Upload failed');
      }

      const result = await response.json();
      
      // Refresh session after successful upload
      setTimeout(() => {
        fetchSession();
      }, 1000);
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  // Reset session function
  const resetSession = async () => {
    try {
      const response = await fetch(`${API_BASE}/reset`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset session');
      }

      const result = await response.json();
      
      // Refresh session after reset
      setTimeout(() => {
        fetchSession();
      }, 500);
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
      throw err;
    }
  };

  // Manual function to fetch analysis results
  const fetchAnalysisResults = async () => {
    try {
      const response = await fetch(`${API_BASE}/analysis`);
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No results yet
        }
        throw new Error('Failed to fetch analysis results');
      }
      return await response.json();
    } catch (error) {
      console.log('Analysis fetch error:', error);
      return null;
    }
  };

  const getFilesByType = (fileType: string) => {
    if (!session?.files) return [];
    const file = session.files[fileType];
    return file ? [file] : [];
  };

  const getRequiredFileTypes = () => {
    return [
      { type: 'assets', label: 'Assets Data', description: 'Historical asset prices and returns' },
      { type: 'factors', label: 'Risk Factors', description: 'Market risk factors (equity, rates, etc.)' },
      { type: 'benchmarks', label: 'Benchmarks', description: 'Benchmark indices for comparison' },
      { type: 'sector_holdings', label: 'Sector Holdings', description: 'Portfolio sector allocation data' },
    ] as const;
  };

  // Simplified boolean values to avoid circular dependencies
  const isAllFilesUploaded = Boolean(
    session?.files?.assets?.status === 'completed'
  );

  const hasAnalysisResults = Boolean(
    session?.analysis_results?.status === 'completed'
  );

  return {
    // Session data
    session,
    files: session?.files || {},
    isLoading,
    error,
    
    // File operations
    uploadFile,
    isUploading,
    resetSession,
    refetchSession: fetchSession, // Manual refresh function
    
    // Analysis results
    analysisResults: session?.analysis_results || null,
    isAnalysisLoading: false, // Simplified - no automatic loading
    hasAnalysisResults,
    fetchAnalysisResults,
    
    // Helper functions
    getFilesByType,
    getRequiredFileTypes,
    isAllFilesUploaded,
  };
};
