import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mdmghgcsvfzsafteuiqi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kbWdoZ2NzdmZ6c2FmdGV1aXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDU4MDEsImV4cCI6MjA3Mzg4MTgwMX0.t03A-zAz7R8GU-fj_av1UlUKOvCOBbS02D61ealXUk8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      portfolios: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      files: {
        Row: {
          id: string;
          portfolio_id: string;
          file_type: 'assets' | 'factors' | 'benchmarks' | 'sector_holdings';
          original_filename: string;
          file_size: number | null;
          storage_path: string;
          status: 'queued' | 'running' | 'succeeded' | 'failed';
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          portfolio_id: string;
          file_type: 'assets' | 'factors' | 'benchmarks' | 'sector_holdings';
          original_filename: string;
          file_size?: number | null;
          storage_path: string;
          status?: 'queued' | 'running' | 'succeeded' | 'failed';
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          portfolio_id?: string;
          file_type?: 'assets' | 'factors' | 'benchmarks' | 'sector_holdings';
          original_filename?: string;
          file_size?: number | null;
          storage_path?: string;
          status?: 'queued' | 'running' | 'succeeded' | 'failed';
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      analysis_runs: {
        Row: {
          id: string;
          portfolio_id: string;
          run_type: 'performance' | 'risk' | 'sensitivity' | 'optimizer' | 'report';
          parameters: any;
          status: 'queued' | 'running' | 'succeeded' | 'failed';
          progress: number;
          error_message: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          portfolio_id: string;
          run_type: 'performance' | 'risk' | 'sensitivity' | 'optimizer' | 'report';
          parameters?: any;
          status?: 'queued' | 'running' | 'succeeded' | 'failed';
          progress?: number;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          portfolio_id?: string;
          run_type?: 'performance' | 'risk' | 'sensitivity' | 'optimizer' | 'report';
          parameters?: any;
          status?: 'queued' | 'running' | 'succeeded' | 'failed';
          progress?: number;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
      };
      scenarios: {
        Row: {
          id: string;
          name: string;
          version: string;
          shocks: any;
          description: string | null;
          is_preset: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          version?: string;
          shocks: any;
          description?: string | null;
          is_preset?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          version?: string;
          shocks?: any;
          description?: string | null;
          is_preset?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
