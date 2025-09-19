from supabase import create_client, Client
from typing import Dict, Any, List, Optional
import pandas as pd
import asyncio
from datetime import datetime, date
import json

from .config import settings

class SupabaseDatabase:
    """
    Database service for Supabase operations
    """
    
    def __init__(self):
        self.client: Client = create_client(
            settings.SUPABASE_URL, 
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
    
    # Portfolio Operations
    async def get_user_portfolios(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all portfolios for a user"""
        try:
            response = self.client.table("portfolios").select("*").eq("user_id", user_id).execute()
            return response.data
        except Exception as e:
            print(f"Error fetching portfolios: {e}")
            return []
    
    async def get_portfolio(self, portfolio_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific portfolio"""
        try:
            response = self.client.table("portfolios").select("*").eq("id", portfolio_id).eq("user_id", user_id).single().execute()
            return response.data
        except Exception as e:
            print(f"Error fetching portfolio: {e}")
            return None
    
    # File Operations
    async def get_portfolio_files(self, portfolio_id: str) -> List[Dict[str, Any]]:
        """Get all files for a portfolio"""
        try:
            response = self.client.table("files").select("*").eq("portfolio_id", portfolio_id).execute()
            return response.data
        except Exception as e:
            print(f"Error fetching files: {e}")
            return []
    
    async def update_file_status(self, file_id: str, status: str, error_message: str = None) -> bool:
        """Update file processing status"""
        try:
            update_data = {"status": status, "updated_at": datetime.now().isoformat()}
            if error_message:
                update_data["error_message"] = error_message
            
            self.client.table("files").update(update_data).eq("id", file_id).execute()
            return True
        except Exception as e:
            print(f"Error updating file status: {e}")
            return False
    
    # Analysis Run Operations
    async def create_analysis_run(self, portfolio_id: str, run_type: str, parameters: Dict[str, Any] = None) -> str:
        """Create a new analysis run"""
        try:
            run_data = {
                "portfolio_id": portfolio_id,
                "run_type": run_type,
                "parameters": parameters or {},
                "status": "queued",
                "progress": 0,
                "started_at": datetime.now().isoformat()
            }
            
            response = self.client.table("analysis_runs").insert(run_data).execute()
            return response.data[0]["id"]
        except Exception as e:
            print(f"Error creating analysis run: {e}")
            raise
    
    async def update_analysis_run(self, run_id: str, status: str, progress: int = None, error_message: str = None) -> bool:
        """Update analysis run status"""
        try:
            update_data = {"status": status}
            if progress is not None:
                update_data["progress"] = progress
            if error_message:
                update_data["error_message"] = error_message
            if status == "succeeded":
                update_data["completed_at"] = datetime.now().isoformat()
            
            self.client.table("analysis_runs").update(update_data).eq("id", run_id).execute()
            return True
        except Exception as e:
            print(f"Error updating analysis run: {e}")
            return False
    
    async def get_analysis_run(self, run_id: str) -> Optional[Dict[str, Any]]:
        """Get analysis run details"""
        try:
            response = self.client.table("analysis_runs").select("*").eq("id", run_id).single().execute()
            return response.data
        except Exception as e:
            print(f"Error fetching analysis run: {e}")
            return None
    
    # Results Operations
    async def store_result(self, analysis_run_id: str, result_type: str, key: str, payload: Dict[str, Any] = None, storage_path: str = None) -> bool:
        """Store analysis result"""
        try:
            result_data = {
                "analysis_run_id": analysis_run_id,
                "result_type": result_type,
                "key": key,
                "payload": payload,
                "storage_path": storage_path
            }
            
            self.client.table("results").insert(result_data).execute()
            return True
        except Exception as e:
            print(f"Error storing result: {e}")
            return False
    
    async def get_results(self, analysis_run_id: str, result_type: str = None) -> List[Dict[str, Any]]:
        """Get results for an analysis run"""
        try:
            query = self.client.table("results").select("*").eq("analysis_run_id", analysis_run_id)
            if result_type:
                query = query.eq("result_type", result_type)
            
            response = query.execute()
            return response.data
        except Exception as e:
            print(f"Error fetching results: {e}")
            return []
    
    # Data Storage Operations
    async def store_asset_data(self, portfolio_id: str, df: pd.DataFrame) -> bool:
        """Store processed asset data"""
        try:
            # Convert DataFrame to records
            records = []
            for _, row in df.iterrows():
                for col in df.columns:
                    if col != 'Date':
                        record = {
                            "portfolio_id": portfolio_id,
                            "date": row['Date'].strftime('%Y-%m-%d') if isinstance(row['Date'], (pd.Timestamp, datetime, date)) else str(row['Date']),
                            "asset_name": col,
                            "price": float(row[col]) if pd.notna(row[col]) else None
                        }
                        records.append(record)
            
            # Batch insert
            if records:
                self.client.table("asset_data").upsert(records).execute()
            return True
        except Exception as e:
            print(f"Error storing asset data: {e}")
            return False
    
    async def store_factor_data(self, portfolio_id: str, df: pd.DataFrame) -> bool:
        """Store processed factor data"""
        try:
            records = []
            for _, row in df.iterrows():
                for col in df.columns:
                    if col != 'Date':
                        record = {
                            "portfolio_id": portfolio_id,
                            "date": row['Date'].strftime('%Y-%m-%d') if isinstance(row['Date'], (pd.Timestamp, datetime, date)) else str(row['Date']),
                            "factor_name": col,
                            "value": float(row[col]) if pd.notna(row[col]) else None
                        }
                        records.append(record)
            
            if records:
                self.client.table("factor_data").upsert(records).execute()
            return True
        except Exception as e:
            print(f"Error storing factor data: {e}")
            return False
    
    async def store_benchmark_data(self, portfolio_id: str, df: pd.DataFrame) -> bool:
        """Store processed benchmark data"""
        try:
            records = []
            for _, row in df.iterrows():
                for col in df.columns:
                    if col != 'Date':
                        record = {
                            "portfolio_id": portfolio_id,
                            "date": row['Date'].strftime('%Y-%m-%d') if isinstance(row['Date'], (pd.Timestamp, datetime, date)) else str(row['Date']),
                            "benchmark_name": col,
                            "value": float(row[col]) if pd.notna(row[col]) else None
                        }
                        records.append(record)
            
            if records:
                self.client.table("benchmark_data").upsert(records).execute()
            return True
        except Exception as e:
            print(f"Error storing benchmark data: {e}")
            return False
    
    async def store_holding_data(self, portfolio_id: str, df: pd.DataFrame) -> bool:
        """Store processed holding data"""
        try:
            records = []
            for _, row in df.iterrows():
                record = {
                    "portfolio_id": portfolio_id,
                    "asset_name": str(row.get('Asset_Name', '')),
                    "sector": str(row.get('Sector', '')),
                    "weight_percent": float(row.get('Weight_Percent', 0)) if pd.notna(row.get('Weight_Percent')) else None,
                    "market_value_inr": float(row.get('Market_Value_INR', 0)) if pd.notna(row.get('Market_Value_INR')) else None,
                    "beta": float(row.get('Beta', 0)) if pd.notna(row.get('Beta')) else None,
                    "dividend_yield": float(row.get('Dividend_Yield', 0)) if pd.notna(row.get('Dividend_Yield')) else None
                }
                records.append(record)
            
            if records:
                self.client.table("holding_data").upsert(records).execute()
            return True
        except Exception as e:
            print(f"Error storing holding data: {e}")
            return False
    
    # Data Retrieval Operations
    async def get_asset_data(self, portfolio_id: str, asset_names: List[str] = None, start_date: str = None, end_date: str = None) -> pd.DataFrame:
        """Get asset data as DataFrame"""
        try:
            query = self.client.table("asset_data").select("*").eq("portfolio_id", portfolio_id)
            
            if asset_names:
                query = query.in_("asset_name", asset_names)
            if start_date:
                query = query.gte("date", start_date)
            if end_date:
                query = query.lte("date", end_date)
            
            response = query.execute()
            
            if not response.data:
                return pd.DataFrame()
            
            df = pd.DataFrame(response.data)
            df['date'] = pd.to_datetime(df['date'])
            return df.pivot(index='date', columns='asset_name', values='price').reset_index()
        except Exception as e:
            print(f"Error fetching asset data: {e}")
            return pd.DataFrame()
    
    async def get_factor_data(self, portfolio_id: str, factor_names: List[str] = None) -> pd.DataFrame:
        """Get factor data as DataFrame"""
        try:
            query = self.client.table("factor_data").select("*").eq("portfolio_id", portfolio_id)
            
            if factor_names:
                query = query.in_("factor_name", factor_names)
            
            response = query.execute()
            
            if not response.data:
                return pd.DataFrame()
            
            df = pd.DataFrame(response.data)
            df['date'] = pd.to_datetime(df['date'])
            return df.pivot(index='date', columns='factor_name', values='value').reset_index()
        except Exception as e:
            print(f"Error fetching factor data: {e}")
            return pd.DataFrame()
    
    # Scenarios Operations
    async def get_scenarios(self, is_preset: bool = None) -> List[Dict[str, Any]]:
        """Get available scenarios"""
        try:
            query = self.client.table("scenarios").select("*")
            if is_preset is not None:
                query = query.eq("is_preset", is_preset)
            
            response = query.execute()
            return response.data
        except Exception as e:
            print(f"Error fetching scenarios: {e}")
            return []

# Global database instance
async def init_db():
    """Initialize database connection"""
    global db
    db = SupabaseDatabase()
    print("✅ Database connection initialized")

# Global database instance
db: SupabaseDatabase = None
