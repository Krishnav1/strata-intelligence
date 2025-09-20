import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type FileRecord = Database['public']['Tables']['files']['Row'];
type FileInsert = Database['public']['Tables']['files']['Insert'];

export const useFileUpload = (portfolioId: string | null) => {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const {
    data: files,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['files', portfolioId],
    queryFn: async () => {
      if (!portfolioId) return [];
      
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FileRecord[];
    },
    enabled: !!portfolioId,
  });

  const uploadFileMutation = useMutation({
    mutationFn: async ({ 
      file, 
      fileType 
    }: { 
      file: File; 
      fileType: 'assets' | 'factors' | 'benchmarks' | 'sector_holdings';
    }) => {
      if (!portfolioId) throw new Error('Portfolio not available');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${portfolioId}/${fileType}/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('portfolio-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create file record in database
      const { data, error: dbError } = await supabase
        .from('files')
        .insert({
          portfolio_id: portfolioId,
          file_type: fileType,
          original_filename: file.name,
          file_size: file.size,
          storage_path: filePath,
          status: 'queued',
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Clear upload progress
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[file.name];
        return newProgress;
      });

      return data as FileRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', portfolioId] });
    },
    onError: (error, variables) => {
      console.error('Upload error:', error);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[variables.file.name];
        return newProgress;
      });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      // Get file info first
      const { data: fileData, error: fetchError } = await supabase
        .from('files')
        .select('storage_path')
        .eq('id', fileId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('portfolio-files')
        .remove([fileData.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', portfolioId] });
    },
  });

  const getFilesByType = (fileType: string) => {
    return files?.filter(file => file.file_type === fileType) || [];
  };

  const getRequiredFileTypes = () => {
    return [
      { type: 'assets', label: 'Assets Data', description: 'Historical asset prices and returns' },
      { type: 'factors', label: 'Risk Factors', description: 'Market risk factors (equity, rates, etc.)' },
      { type: 'benchmarks', label: 'Benchmarks', description: 'Benchmark indices for comparison' },
      { type: 'sector_holdings', label: 'Sector Holdings', description: 'Portfolio sector allocation data' },
    ] as const;
  };

  const isAllFilesUploaded = () => {
    const requiredTypes = getRequiredFileTypes();
    return requiredTypes.every(({ type }) => 
      getFilesByType(type).some(file => file.status === 'succeeded')
    );
  };

  return {
    files: files || [],
    isLoading,
    error,
    uploadFile: uploadFileMutation.mutate,
    deleteFile: deleteFileMutation.mutate,
    isUploading: uploadFileMutation.isPending,
    isDeleting: deleteFileMutation.isPending,
    uploadProgress,
    getFilesByType,
    getRequiredFileTypes,
    isAllFilesUploaded,
  };
};
