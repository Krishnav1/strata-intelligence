import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type Portfolio = Database['public']['Tables']['portfolios']['Row'];
type PortfolioInsert = Database['public']['Tables']['portfolios']['Insert'];

export const usePortfolios = () => {
  const queryClient = useQueryClient();

  const {
    data: portfolios,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['portfolios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Portfolio[];
    },
  });

  const createPortfolioMutation = useMutation({
    mutationFn: async (portfolio: Omit<PortfolioInsert, 'user_id'>) => {
      const { data, error } = await supabase
        .from('portfolios')
        .insert({
          ...portfolio,
          user_id: 'demo-user', // Use a dummy user ID for demo
        })
        .select()
        .single();

      if (error) throw error;
      return data as Portfolio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });

  const updatePortfolioMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Portfolio>) => {
      const { data, error } = await supabase
        .from('portfolios')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Portfolio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });

  const deletePortfolioMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });

  return {
    portfolios: portfolios || [],
    isLoading,
    error,
    createPortfolio: createPortfolioMutation.mutate,
    updatePortfolio: updatePortfolioMutation.mutate,
    deletePortfolio: deletePortfolioMutation.mutate,
    isCreating: createPortfolioMutation.isPending,
    isUpdating: updatePortfolioMutation.isPending,
    isDeleting: deletePortfolioMutation.isPending,
  };
};

export const usePortfolio = (portfolioId: string | null) => {
  return useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: async () => {
      if (!portfolioId) return null;

      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('id', portfolioId)
        .single();

      if (error) throw error;
      return data as Portfolio;
    },
    enabled: !!portfolioId,
  });
};
