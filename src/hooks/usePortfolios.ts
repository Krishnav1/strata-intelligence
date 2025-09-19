import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { Database } from '@/lib/supabase';

type Portfolio = Database['public']['Tables']['portfolios']['Row'];
type PortfolioInsert = Database['public']['Tables']['portfolios']['Insert'];

export const usePortfolios = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: portfolios,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['portfolios', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Portfolio[];
    },
    enabled: !!user,
  });

  const createPortfolioMutation = useMutation({
    mutationFn: async (portfolio: Omit<PortfolioInsert, 'user_id'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('portfolios')
        .insert({
          ...portfolio,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Portfolio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios', user?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['portfolios', user?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['portfolios', user?.id] });
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
  const { user } = useAuth();

  return useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: async () => {
      if (!portfolioId || !user) return null;

      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('id', portfolioId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as Portfolio;
    },
    enabled: !!portfolioId && !!user,
  });
};
