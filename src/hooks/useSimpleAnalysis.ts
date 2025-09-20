import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = 'https://strata-intelligence.onrender.com/api/v1/simple';

interface FileStatus {
  id: string;
  file_type: string;
  original_filename: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  error?: string;
  file_size?: number;
  created_at: string;
}

interface AnalysisSession {
  session_id: string | null;
  files: Record<string, FileStatus>;
  analysis_results: any;
}

// Stable query keys
const QUERY_KEYS = {
  session: ['simple-analysis', 'session'] as const,
  analysis: ['simple-analysis', 'analysis'] as const,
} as const;

export const useSimpleAnalysis = () => {
  const queryClient = useQueryClient();

  // Session query with polling
  const {
    data: session,
    isLoading,
    error,
    refetch: refetchSession,
  } = useQuery<AnalysisSession>({
    queryKey: QUERY_KEYS.session,
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/session`);
      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }
      return response.json();
    },
    refetchInterval: 3000, // Poll every 3 seconds
    refetchIntervalInBackground: true,
    staleTime: 1000, // Consider data stale after 1 second
  });

  // Upload mutation
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
        const errorText = await response.text();
        throw new Error(errorText || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      // Use setQueryData for immediate update instead of invalidation to prevent loops
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.session,
        exact: true 
      });
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
      // Invalidate both session and analysis queries with exact matching
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.session,
        exact: true 
      });
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.analysis,
        exact: true 
      });
    },
  });

  // Analysis results query (manual fetch)
  const fetchAnalysisResults = async () => {
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
  };

  // Helper functions
  const getFilesByType = (fileType: string) => {
    if (!session?.files) return [];
    const file = session.files[fileType];
    return file ? [file] : [];
  };

  const getRequiredFileTypes = () => [
    { type: 'assets', label: 'Assets Data', description: 'Historical asset prices and returns' },
    { type: 'factors', label: 'Risk Factors', description: 'Market risk factors (equity, rates, etc.)' },
    { type: 'benchmarks', label: 'Benchmarks', description: 'Benchmark indices for comparison' },
    { type: 'sector_holdings', label: 'Sector Holdings', description: 'Portfolio sector allocation data' },
  ] as const;

  // Computed values
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
    error: error as Error | null,
    
    // File operations
    uploadFile: uploadFileMutation.mutate,
    isUploading: uploadFileMutation.isPending,
    resetSession: resetSessionMutation.mutate,
    refetchSession,
    
    // Analysis results
    analysisResults: session?.analysis_results || null,
    isAnalysisLoading: false, // No automatic loading for analysis
    hasAnalysisResults,
    fetchAnalysisResults,
    
    // Helper functions
    getFilesByType,
    getRequiredFileTypes,
    isAllFilesUploaded,
  };
};
