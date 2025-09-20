import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();

  // Get current session with polling to keep it updated
  const { data: session, isLoading, error, refetch: refetchSession } = useQuery({
    queryKey: ['simple-analysis-session'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/session`);
      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }
      return response.json();
    },
    refetchInterval: 2000, // Poll every 2 seconds to keep session updated
    refetchIntervalInBackground: false,
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async ({ 
      file, 
      fileType 
    }: { 
      file: File; 
      fileType: 'assets' | 'factors' | 'benchmarks' | 'sector_holdings';
    }) => {
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

      return response.json();
    },
    onSuccess: () => {
      // Don't invalidate queries to prevent circular dependency errors
      // The session will be refetched naturally on next render
    },
  });

  // Reset session mutation
  const resetSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/reset`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset session');
      }

      return response.json();
    },
    onSuccess: () => {
      // Don't invalidate queries to prevent circular dependency errors
    },
  });

  // Get analysis results - simplified to avoid circular dependencies
  const {
    data: analysisResults,
    isLoading: isAnalysisLoading,
  } = useQuery({
    queryKey: ['analysis-results'],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE}/analysis`);
        if (!response.ok) {
          if (response.status === 404) {
            return null; // No results yet
          }
          throw new Error('Failed to fetch analysis results');
        }
        return response.json();
      } catch (error) {
        console.log('Analysis fetch error:', error);
        return null;
      }
    },
    enabled: false, // Disable automatic fetching to prevent loops
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

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

  // Manual function to fetch analysis results
  const fetchAnalysisResults = async () => {
    if (hasAnalysisResults) {
      try {
        const response = await fetch(`${API_BASE}/analysis`);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.log('Error fetching analysis:', error);
      }
    }
    return null;
  };

  return {
    // Session data
    session,
    files: session?.files || {},
    isLoading,
    error,
    
    // File operations
    uploadFile: uploadFileMutation.mutate,
    isUploading: uploadFileMutation.isPending,
    resetSession: resetSessionMutation.mutate,
    refetchSession, // Manual refresh function
    
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
