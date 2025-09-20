from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from datetime import datetime, date

from ...core.auth import get_current_user_id
from ...core.database import db
from ...models.schemas import DataPreview, DataSuggestion, BaseResponse

router = APIRouter()

@router.get("/{portfolio_id}/preview")
async def get_data_preview(
    portfolio_id: str,
    file_type: Optional[str] = None,
):
    """Get data preview for uploaded files"""
    try:
        # In auth-free mode, we don't check portfolio ownership
        
        files = await db.get_portfolio_files(portfolio_id)
        
        if file_type:
            files = [f for f in files if f['file_type'] == file_type and f['status'] == 'succeeded']
        else:
            files = [f for f in files if f['status'] == 'succeeded']
        
        previews = {}
        
        for file_info in files:
            file_type_key = file_info['file_type']
            
            if file_type_key in ['assets', 'factors', 'benchmarks']:
                # Get time series data preview
                if file_type_key == 'assets':
                    df = await db.get_asset_data(portfolio_id)
                elif file_type_key == 'factors':
                    df = await db.get_factor_data(portfolio_id)
                else:  # benchmarks
                    df = await db.get_benchmark_data(portfolio_id)
                
                if not df.empty:
                    # Convert to preview format
                    headers = list(df.columns)
                    sample_rows = df.head(5).values.tolist()
                    
                    # Convert datetime objects to strings
                    for i, row in enumerate(sample_rows):
                        sample_rows[i] = [
                            item.strftime('%Y-%m-%d') if isinstance(item, (datetime, date)) 
                            else str(item) for item in row
                        ]
                    
                    date_range = None
                    if 'date' in df.columns:
                        date_range = {
                            'start': df['date'].min().strftime('%Y-%m-%d'),
                            'end': df['date'].max().strftime('%Y-%m-%d')
                        }
                    
                    previews[file_type_key] = {
                        'headers': headers,
                        'sample_rows': sample_rows,
                        'total_rows': len(df),
                        'date_range': date_range,
                        'data_quality': {
                            'completeness': 95.0,  # Would calculate from actual data
                            'missing_values': 0
                        }
                    }
            
            elif file_type_key == 'sector_holdings':
                # Get holdings data preview
                response = db.client.table("holding_data").select("*").eq("portfolio_id", portfolio_id).limit(5).execute()
                
                if response.data:
                    holdings_data = response.data
                    headers = ['asset_name', 'sector', 'weight_percent', 'market_value_inr', 'beta']
                    sample_rows = []
                    
                    for holding in holdings_data:
                        row = [
                            holding.get('asset_name', ''),
                            holding.get('sector', ''),
                            holding.get('weight_percent', 0),
                            holding.get('market_value_inr', 0),
                            holding.get('beta', 0)
                        ]
                        sample_rows.append([str(item) for item in row])
                    
                    # Get total count
                    count_response = db.client.table("holding_data").select("id", count="exact").eq("portfolio_id", portfolio_id).execute()
                    total_rows = count_response.count if hasattr(count_response, 'count') else len(sample_rows)
                    
                    previews[file_type_key] = {
                        'headers': headers,
                        'sample_rows': sample_rows,
                        'total_rows': total_rows,
                        'date_range': None,
                        'data_quality': {
                            'completeness': 100.0,
                            'missing_values': 0
                        }
                    }
        
        return previews
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get data preview: {str(e)}"
        )

@router.get("/{portfolio_id}/suggestions")
async def get_data_suggestions(
    portfolio_id: str,
):
    """Get smart data suggestions for portfolio"""
    try:
        # In auth-free mode, we don't check portfolio ownership
        
        # Get existing suggestions
        response = db.client.table("data_suggestions").select("*").eq("portfolio_id", portfolio_id).eq("status", "pending").execute()
        
        suggestions = []
        if response.data:
            for suggestion_data in response.data:
                # Get the suggested fingerprint details
                fingerprint_response = db.client.table("data_fingerprints").select("*").eq("id", suggestion_data["suggested_fingerprint_id"]).single().execute()
                
                if fingerprint_response.data:
                    fingerprint = fingerprint_response.data
                    
                    suggestions.append({
                        'id': suggestion_data['id'],
                        'suggestion_type': suggestion_data['suggestion_type'],
                        'title': f"Similar {fingerprint['file_type'].title()} Dataset",
                        'description': f"Found dataset with {suggestion_data['similarity_score']:.0%} similarity",
                        'similarity_score': suggestion_data['similarity_score'],
                        'data_info': {
                            'file_type': fingerprint['file_type'],
                            'asset_count': len(fingerprint.get('asset_names', [])),
                            'date_range': f"{fingerprint.get('date_range_start', '')} to {fingerprint.get('date_range_end', '')}",
                            'sample_assets': fingerprint.get('asset_names', [])[:4]
                        },
                        'status': suggestion_data['status']
                    })
        
        # If no suggestions exist, create some mock ones for demo
        if not suggestions:
            mock_suggestions = [
                {
                    'id': 'mock-1',
                    'suggestion_type': 'similar_assets',
                    'title': 'Similar Indian Equity Portfolio',
                    'description': 'Dataset with 85% similar assets including major Indian indices',
                    'similarity_score': 0.85,
                    'data_info': {
                        'file_type': 'assets',
                        'asset_count': 12,
                        'date_range': '2020-01-01 to 2024-12-31',
                        'sample_assets': ['NIFTY_50', 'NIFTY_MIDCAP_150', 'GOLD_ETF', 'HDFC_BANK']
                    },
                    'status': 'pending'
                },
                {
                    'id': 'mock-2',
                    'suggestion_type': 'same_period',
                    'title': 'Matching Time Period Factors',
                    'description': 'Risk factors covering the same time period with Indian market data',
                    'similarity_score': 0.92,
                    'data_info': {
                        'file_type': 'factors',
                        'asset_count': 5,
                        'date_range': '2023-01-01 to 2024-12-31',
                        'sample_assets': ['INTEREST_RATE_10Y', 'USD_INR', 'CRUDE_OIL', 'VIX_INDIA']
                    },
                    'status': 'pending'
                }
            ]
            suggestions.extend(mock_suggestions)
        
        return suggestions
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get data suggestions: {str(e)}"
        )

@router.post("/{portfolio_id}/suggestions/{suggestion_id}/accept")
async def accept_data_suggestion(
    portfolio_id: str,
    suggestion_id: str,
):
    """Accept a data suggestion"""
    try:
        # In auth-free mode, we don't check portfolio ownership
        
        # For mock suggestions, just return success
        if suggestion_id.startswith('mock-'):
            return BaseResponse(message="Suggestion accepted successfully (demo mode)")
        
        # Update suggestion status
        db.client.table("data_suggestions").update({"status": "accepted"}).eq("id", suggestion_id).execute()
        
        # Here you would implement the logic to copy the suggested data
        # to the user's portfolio
        
        return BaseResponse(message="Suggestion accepted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to accept suggestion: {str(e)}"
        )

@router.post("/{portfolio_id}/suggestions/{suggestion_id}/dismiss")
async def dismiss_data_suggestion(
    portfolio_id: str,
    suggestion_id: str,
):
    """Dismiss a data suggestion"""
    try:
        # In auth-free mode, we don't check portfolio ownership
        
        # For mock suggestions, just return success
        if suggestion_id.startswith('mock-'):
            return BaseResponse(message="Suggestion dismissed successfully (demo mode)")
        
        # Update suggestion status
        db.client.table("data_suggestions").update({"status": "dismissed"}).eq("id", suggestion_id).execute()
        
        return BaseResponse(message="Suggestion dismissed successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to dismiss suggestion: {str(e)}"
        )

@router.get("/{portfolio_id}/statistics")
async def get_portfolio_statistics(
    portfolio_id: str,
):
    """Get portfolio data statistics"""
    try:
        # In auth-free mode, we don't check portfolio ownership
        
        stats = {
            'data_completeness': 0,
            'total_assets': 0,
            'date_coverage': {},
            'data_quality_score': 0,
            'last_updated': None
        }
        
        # Get asset data stats
        asset_df = await db.get_asset_data(portfolio_id)
        if not asset_df.empty:
            stats['total_assets'] = len([col for col in asset_df.columns if col != 'date'])
            if 'date' in asset_df.columns:
                stats['date_coverage'] = {
                    'start': asset_df['date'].min().strftime('%Y-%m-%d'),
                    'end': asset_df['date'].max().strftime('%Y-%m-%d'),
                    'days': (asset_df['date'].max() - asset_df['date'].min()).days
                }
        
        # Get holdings data stats
        holdings_response = db.client.table("holding_data").select("*").eq("portfolio_id", portfolio_id).execute()
        if holdings_response.data:
            holdings_df = holdings_response.data
            total_weight = sum(h.get('weight_percent', 0) for h in holdings_df)
            stats['portfolio_weight_sum'] = total_weight
            stats['holdings_count'] = len(holdings_df)
        
        # Calculate completeness
        files = await db.get_portfolio_files(portfolio_id)
        required_types = ['assets', 'factors', 'benchmarks', 'sector_holdings']
        completed_types = [f['file_type'] for f in files if f['status'] == 'succeeded']
        stats['data_completeness'] = len(completed_types) / len(required_types) * 100
        
        # Data quality score (simplified)
        quality_factors = []
        if stats['data_completeness'] > 0:
            quality_factors.append(stats['data_completeness'] / 100)
        if stats.get('portfolio_weight_sum', 0) > 95:  # Weights close to 100%
            quality_factors.append(1.0)
        if stats['total_assets'] > 0:
            quality_factors.append(min(stats['total_assets'] / 10, 1.0))  # More assets = better
        
        stats['data_quality_score'] = sum(quality_factors) / len(quality_factors) * 100 if quality_factors else 0
        
        # Last updated
        if files:
            latest_file = max(files, key=lambda x: x['updated_at'])
            stats['last_updated'] = latest_file['updated_at']
        
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get portfolio statistics: {str(e)}"
        )

@router.get("/preview/{file_id}")
async def get_file_preview(file_id: str):
    """Get a preview for a specific file."""
    try:
        # Get file info
        file_response = db.client.table("files").select("*").eq("id", file_id).single().execute()
        if not file_response.data:
            raise HTTPException(status_code=404, detail="File not found")

        file_info = file_response.data
        file_type = file_info.get("file_type")
        portfolio_id = file_info.get("portfolio_id")

        if not file_type or not portfolio_id:
            raise HTTPException(status_code=400, detail="File metadata is incomplete")

        # Fetch the corresponding data
        if file_type == 'assets':
            df = await db.get_asset_data(portfolio_id)
        elif file_type == 'factors':
            df = await db.get_factor_data(portfolio_id)
        elif file_type == 'benchmarks':
            df = await db.get_benchmark_data(portfolio_id)
        elif file_type == 'sector_holdings':
            # For holdings, we fetch directly
            response = db.client.table("holding_data").select("*").eq("portfolio_id", portfolio_id).limit(5).execute()
            if response.data:
                headers = ['asset_name', 'sector', 'weight_percent', 'market_value_inr', 'beta']
                rows = [[str(h.get(col, '')) for col in headers] for h in response.data]
                return {"stats": {"total_rows": len(rows)}, "headers": headers, "rows": rows}
            else:
                return {"stats": {}, "headers": [], "rows": []}
        else:
            raise HTTPException(status_code=400, detail=f"Unknown file type: {file_type}")

        if df.empty:
            return {"stats": {}, "headers": [], "rows": []}

        # Format for preview
        headers = list(df.columns)
        rows = df.head(5).values.tolist()
        stats = {
            "total_rows": len(df),
            "date_range": f"{df['date'].min().strftime('%Y-%m-%d')} to {df['date'].max().strftime('%Y-%m-%d')}",
            "columns": len(headers)
        }

        return {"stats": stats, "headers": headers, "rows": rows}

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
