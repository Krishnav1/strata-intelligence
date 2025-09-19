import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime, timedelta
import hashlib
import json
from io import StringIO

from ..core.database import db
from ..core.config import settings

class DataProcessor:
    """
    Service for processing and cleaning uploaded data files
    """
    
    def __init__(self):
        self.required_columns = {
            'assets': ['Date'],
            'factors': ['Date'],
            'benchmarks': ['Date'],
            'sector_holdings': ['Asset_Name', 'Sector', 'Weight_Percent']
        }
    
    async def clean_and_format_timeseries_csv(self, file_content: str, file_type: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Clean and format time series CSV data
        Returns: (cleaned_dataframe, metadata)
        """
        try:
            # Read CSV content
            df = pd.read_csv(StringIO(file_content))
            
            # Basic validation
            validation_result = self._validate_dataframe(df, file_type)
            if not validation_result['is_valid']:
                raise ValueError(f"Validation failed: {validation_result['errors']}")
            
            # Clean the dataframe based on file type
            if file_type in ['assets', 'factors', 'benchmarks']:
                df_cleaned = self._clean_timeseries_data(df)
            elif file_type == 'sector_holdings':
                df_cleaned = self._clean_holdings_data(df)
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
            
            # Generate metadata
            metadata = self._generate_metadata(df_cleaned, file_type)
            
            return df_cleaned, metadata
            
        except Exception as e:
            raise ValueError(f"Data processing failed: {str(e)}")
    
    def _validate_dataframe(self, df: pd.DataFrame, file_type: str) -> Dict[str, Any]:
        """Validate dataframe structure and content"""
        errors = []
        warnings = []
        
        # Check if dataframe is empty
        if df.empty:
            errors.append("File is empty")
            return {'is_valid': False, 'errors': errors, 'warnings': warnings}
        
        # Check required columns
        required_cols = self.required_columns.get(file_type, [])
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            errors.append(f"Missing required columns: {missing_cols}")
        
        # Validate date column for time series data
        if file_type in ['assets', 'factors', 'benchmarks'] and 'Date' in df.columns:
            try:
                pd.to_datetime(df['Date'])
            except:
                errors.append("Date column contains invalid date formats")
        
        # Check for numeric columns in time series data
        if file_type in ['assets', 'factors', 'benchmarks']:
            numeric_cols = [col for col in df.columns if col != 'Date']
            for col in numeric_cols:
                if not pd.api.types.is_numeric_dtype(df[col]):
                    try:
                        pd.to_numeric(df[col], errors='coerce')
                    except:
                        warnings.append(f"Column {col} may contain non-numeric values")
        
        # Validate holdings data
        if file_type == 'sector_holdings':
            if 'Weight_Percent' in df.columns:
                try:
                    weights = pd.to_numeric(df['Weight_Percent'], errors='coerce')
                    total_weight = weights.sum()
                    if abs(total_weight - 100) > 5:  # Allow 5% tolerance
                        warnings.append(f"Portfolio weights sum to {total_weight:.2f}%, expected ~100%")
                except:
                    errors.append("Weight_Percent column contains invalid numeric values")
        
        return {
            'is_valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }
    
    def _clean_timeseries_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean time series data (assets, factors, benchmarks)"""
        df_clean = df.copy()
        
        # Convert date column
        df_clean['Date'] = pd.to_datetime(df_clean['Date'])
        
        # Sort by date
        df_clean = df_clean.sort_values('Date').reset_index(drop=True)
        
        # Convert numeric columns
        numeric_cols = [col for col in df_clean.columns if col != 'Date']
        for col in numeric_cols:
            df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')
        
        # Remove rows with all NaN values (except Date)
        df_clean = df_clean.dropna(subset=numeric_cols, how='all')
        
        # Forward fill missing values (common in financial data)
        df_clean[numeric_cols] = df_clean[numeric_cols].fillna(method='ffill')
        
        # Remove any remaining rows with NaN values
        df_clean = df_clean.dropna()
        
        return df_clean
    
    def _clean_holdings_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean holdings/sector data"""
        df_clean = df.copy()
        
        # Clean asset names
        df_clean['Asset_Name'] = df_clean['Asset_Name'].astype(str).str.strip()
        
        # Clean sector names
        if 'Sector' in df_clean.columns:
            df_clean['Sector'] = df_clean['Sector'].astype(str).str.strip()
        
        # Convert numeric columns
        numeric_cols = ['Weight_Percent', 'Market_Value_INR', 'Beta', 'Dividend_Yield']
        for col in numeric_cols:
            if col in df_clean.columns:
                df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')
        
        # Remove rows with missing essential data
        df_clean = df_clean.dropna(subset=['Asset_Name', 'Weight_Percent'])
        
        # Normalize weights to sum to 100%
        if 'Weight_Percent' in df_clean.columns:
            total_weight = df_clean['Weight_Percent'].sum()
            if total_weight > 0:
                df_clean['Weight_Percent'] = (df_clean['Weight_Percent'] / total_weight) * 100
        
        return df_clean
    
    def _generate_metadata(self, df: pd.DataFrame, file_type: str) -> Dict[str, Any]:
        """Generate metadata for processed data"""
        metadata = {
            'file_type': file_type,
            'row_count': len(df),
            'column_count': len(df.columns),
            'columns': list(df.columns),
            'processing_timestamp': datetime.now().isoformat(),
            'data_quality': {}
        }
        
        # Add type-specific metadata
        if file_type in ['assets', 'factors', 'benchmarks']:
            metadata['date_range'] = {
                'start': df['Date'].min().isoformat(),
                'end': df['Date'].max().isoformat(),
                'days': (df['Date'].max() - df['Date'].min()).days
            }
            
            # Calculate data quality metrics
            numeric_cols = [col for col in df.columns if col != 'Date']
            metadata['data_quality'] = {
                'completeness': (1 - df[numeric_cols].isnull().sum().sum() / (len(df) * len(numeric_cols))) * 100,
                'asset_count': len(numeric_cols),
                'missing_values': df[numeric_cols].isnull().sum().to_dict()
            }
        
        elif file_type == 'sector_holdings':
            metadata['portfolio_summary'] = {
                'total_assets': len(df),
                'sectors': df['Sector'].nunique() if 'Sector' in df.columns else 0,
                'total_weight': df['Weight_Percent'].sum() if 'Weight_Percent' in df.columns else 0,
                'total_value': df['Market_Value_INR'].sum() if 'Market_Value_INR' in df.columns else 0
            }
        
        return metadata
    
    def generate_data_fingerprint(self, df: pd.DataFrame, file_type: str) -> Dict[str, Any]:
        """Generate fingerprint for data similarity detection"""
        try:
            # Create content hash
            content_str = df.to_string()
            content_hash = hashlib.md5(content_str.encode()).hexdigest()
            
            # Create column fingerprint
            column_fingerprint = hashlib.md5(str(sorted(df.columns)).encode()).hexdigest()
            
            # Extract asset/factor names
            if file_type in ['assets', 'factors', 'benchmarks']:
                asset_names = [col for col in df.columns if col != 'Date']
            elif file_type == 'sector_holdings':
                asset_names = df['Asset_Name'].tolist() if 'Asset_Name' in df.columns else []
            else:
                asset_names = []
            
            # Generate similarity tags
            similarity_tags = self._generate_similarity_tags(df, file_type)
            
            fingerprint = {
                'data_hash': content_hash,
                'column_fingerprint': column_fingerprint,
                'asset_names': asset_names,
                'similarity_tags': similarity_tags,
                'row_count': len(df),
                'column_count': len(df.columns)
            }
            
            # Add date range for time series
            if file_type in ['assets', 'factors', 'benchmarks'] and 'Date' in df.columns:
                fingerprint['date_range_start'] = df['Date'].min().date()
                fingerprint['date_range_end'] = df['Date'].max().date()
            
            return fingerprint
            
        except Exception as e:
            print(f"Error generating fingerprint: {e}")
            return {}
    
    def _generate_similarity_tags(self, df: pd.DataFrame, file_type: str) -> List[str]:
        """Generate tags for similarity matching"""
        tags = [file_type]
        
        if file_type in ['assets', 'factors', 'benchmarks']:
            # Add market-specific tags
            asset_names = [col for col in df.columns if col != 'Date']
            
            # Indian market indicators
            indian_indicators = ['NIFTY', 'SENSEX', 'BSE', 'NSE', 'INR', 'INDIA']
            if any(indicator in ' '.join(asset_names).upper() for indicator in indian_indicators):
                tags.append('indian_market')
            
            # Asset class tags
            if any('GOLD' in name.upper() for name in asset_names):
                tags.append('commodities')
            if any('BANK' in name.upper() for name in asset_names):
                tags.append('banking')
            if any('TECH' in name.upper() for name in asset_names):
                tags.append('technology')
            
            # Time period tags
            if 'Date' in df.columns:
                date_range = (df['Date'].max() - df['Date'].min()).days
                if date_range > 1095:  # 3+ years
                    tags.append('long_term')
                elif date_range > 365:  # 1+ years
                    tags.append('medium_term')
                else:
                    tags.append('short_term')
        
        elif file_type == 'sector_holdings':
            # Add sector-specific tags
            if 'Sector' in df.columns:
                sectors = df['Sector'].unique()
                for sector in sectors:
                    if 'equity' in sector.lower():
                        tags.append('equity')
                    if 'debt' in sector.lower():
                        tags.append('debt')
                    if 'bank' in sector.lower():
                        tags.append('banking')
        
        return tags
    
    async def process_and_store_file(self, portfolio_id: str, file_id: str, file_content: str, file_type: str) -> bool:
        """
        Process file and store in database
        """
        try:
            # Update file status to running
            await db.update_file_status(file_id, "running")
            
            # Clean and process data
            df_cleaned, metadata = await self.clean_and_format_timeseries_csv(file_content, file_type)
            
            # Store processed data based on type
            if file_type == 'assets':
                success = await db.store_asset_data(portfolio_id, df_cleaned)
            elif file_type == 'factors':
                success = await db.store_factor_data(portfolio_id, df_cleaned)
            elif file_type == 'benchmarks':
                success = await db.store_benchmark_data(portfolio_id, df_cleaned)
            elif file_type == 'sector_holdings':
                success = await db.store_holding_data(portfolio_id, df_cleaned)
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
            
            if success:
                # Generate and store data fingerprint
                fingerprint = self.generate_data_fingerprint(df_cleaned, file_type)
                if fingerprint:
                    fingerprint_data = {
                        'portfolio_id': portfolio_id,
                        'file_type': file_type,
                        **fingerprint
                    }
                    # Store fingerprint (would need to add this method to database)
                    # await db.store_data_fingerprint(fingerprint_data)
                
                # Update file status to succeeded
                await db.update_file_status(file_id, "succeeded")
                return True
            else:
                await db.update_file_status(file_id, "failed", "Failed to store processed data")
                return False
                
        except Exception as e:
            error_msg = f"Processing failed: {str(e)}"
            await db.update_file_status(file_id, "failed", error_msg)
            return False

# Global processor instance
data_processor = DataProcessor()
