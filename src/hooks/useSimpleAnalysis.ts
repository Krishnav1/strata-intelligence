import { useState, useEffect, useCallback } from 'react';

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

  const fetchSession = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 3000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  const uploadFile = useCallback(async ({ file, fileType }: { file: File; fileType: string }) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Upload failed');
      }

      await response.json();
      await fetchSession(); // Refresh session data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      throw err; // Re-throw to be caught in the component
    } finally {
      setIsUploading(false);
    }
  }, [fetchSession]);

  const resetSession = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/reset`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to reset session');
      }
      await response.json();
      await fetchSession(); // Refresh session data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    }
  }, [fetchSession]);

  const fetchAnalysisResults = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/analysis`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch analysis results');
      }
      return await response.json();
    } catch (error) {
      console.error('Analysis fetch error:', error);
      return null;
    }
  }, []);

  const getFilesByType = useCallback((fileType: string) => {
    if (!session?.files) return [];
    return Object.values(session.files).filter(f => f.file_type === fileType);
  }, [session]);

  const getRequiredFileTypes = useCallback(() => [
    { type: 'assets', label: 'Assets Data', description: 'Historical asset prices and returns' },
    { type: 'factors', label: 'Risk Factors', description: 'Market risk factors (equity, rates, etc.)' },
    { type: 'benchmarks', label: 'Benchmarks', description: 'Benchmark indices for comparison' },
    { type: 'sector_holdings', label: 'Sector Holdings', description: 'Portfolio sector allocation data' },
  ], []);

  const isAllFilesUploaded = !!session?.files?.assets && session.files.assets.status === 'completed';
  const hasAnalysisResults = !!session?.analysis_results && session.analysis_results.status === 'completed';

  return {
    session,
    files: session?.files || {},
    isLoading,
    error,
    uploadFile,
    isUploading,
    resetSession,
    refetchSession: fetchSession,
    analysisResults: session?.analysis_results || null,
    isAnalysisLoading: isLoading, // Reflect general loading state
    hasAnalysisResults,
    fetchAnalysisResults,
    getFilesByType,
    getRequiredFileTypes,
    isAllFilesUploaded,
  };
};
