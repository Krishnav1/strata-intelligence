from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from typing import List, Dict, Any

from ...core.database import db
from ...services.analytics_engine import analytics_engine
from ...models.schemas import (
    AnalysisRunCreate, AnalysisRunResponse, AnalysisRunStatus,
    PerformanceAnalysisResponse, RiskAnalysisResponse, 
    SensitivityAnalysisResponse, OptimizationResponse,
    MonteCarloRequest, MonteCarloResponse, BaseResponse
)

router = APIRouter()

# Background task functions
async def run_performance_analysis_task(run_id: str, portfolio_id: str, benchmark_name: str = None):
    """Background task for performance analysis"""
    try:
        await db.update_analysis_run(run_id, "running", 10)
        
        # Run analysis
        result = await analytics_engine.calculate_historical_performance(portfolio_id, benchmark_name)
        
        await db.update_analysis_run(run_id, "running", 50)
        
        # Store results
        await db.store_result(run_id, "performance", "metrics", result)
        
        await db.update_analysis_run(run_id, "succeeded", 100)
        
    except Exception as e:
        await db.update_analysis_run(run_id, "failed", error_message=str(e))

async def run_risk_analysis_task(run_id: str, portfolio_id: str):
    """Background task for risk analysis"""
    try:
        await db.update_analysis_run(run_id, "running", 10)
        
        result = await analytics_engine.generate_risk_diagnostics(portfolio_id)
        
        await db.update_analysis_run(run_id, "running", 70)
        
        await db.store_result(run_id, "risk", "diagnostics", result)
        
        await db.update_analysis_run(run_id, "succeeded", 100)
        
    except Exception as e:
        await db.update_analysis_run(run_id, "failed", error_message=str(e))

async def run_sensitivity_analysis_task(run_id: str, portfolio_id: str, shocks: Dict[str, float]):
    """Background task for sensitivity analysis"""
    try:
        await db.update_analysis_run(run_id, "running", 20)
        
        result = await analytics_engine.run_sensitivity_analysis(portfolio_id, shocks)
        
        await db.update_analysis_run(run_id, "running", 80)
        
        await db.store_result(run_id, "sensitivity", "results", result)
        
        await db.update_analysis_run(run_id, "succeeded", 100)
        
    except Exception as e:
        await db.update_analysis_run(run_id, "failed", error_message=str(e))

async def run_optimization_task(run_id: str, portfolio_id: str, target_return: float = None, risk_aversion: float = None):
    """Background task for portfolio optimization"""
    try:
        await db.update_analysis_run(run_id, "running", 15)
        
        result = await analytics_engine.run_markowitz_optimization(portfolio_id, target_return, risk_aversion)
        
        await db.update_analysis_run(run_id, "running", 85)
        
        await db.store_result(run_id, "optimization", "markowitz", result)
        
        await db.update_analysis_run(run_id, "succeeded", 100)
        
    except Exception as e:
        await db.update_analysis_run(run_id, "failed", error_message=str(e))

# API Endpoints
@router.post("/performance", response_model=AnalysisRunResponse)
async def start_performance_analysis(
    background_tasks: BackgroundTasks,
    portfolio_id: str,
    benchmark_name: str = None
):
    """Start performance analysis"""
    try:
        # Skip ownership check for development
        response = db.client.table("portfolios").select("*").eq("id", portfolio_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Portfolio not found")
        
        # Create analysis run
        run_id = await db.create_analysis_run(
            portfolio_id, 
            "performance", 
            {"benchmark_name": benchmark_name}
        )
        
        # Start background task
        background_tasks.add_task(run_performance_analysis_task, run_id, portfolio_id, benchmark_name)
        
        # Return run info
        run_info = await db.get_analysis_run(run_id)
        return run_info
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start performance analysis: {str(e)}"
        )

@router.post("/risk", response_model=AnalysisRunResponse)
async def start_risk_analysis(
    background_tasks: BackgroundTasks,
    portfolio_id: str
):
    """Start risk analysis"""
    try:
        # Skip portfolio ownership check for demo mode
        
        run_id = await db.create_analysis_run(portfolio_id, "risk")
        
        background_tasks.add_task(run_risk_analysis_task, run_id, portfolio_id)
        
        run_info = await db.get_analysis_run(run_id)
        return run_info
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start risk analysis: {str(e)}"
        )

@router.post("/sensitivity", response_model=AnalysisRunResponse)
async def start_sensitivity_analysis(
    background_tasks: BackgroundTasks,
    portfolio_id: str,
    shocks: Dict[str, float],
    scenario_name: str = None,
):
    """Start sensitivity analysis"""
    try:
        # Skip portfolio ownership check for demo mode
        
        run_id = await db.create_analysis_run(
            portfolio_id, 
            "sensitivity",
            {"shocks": shocks, "scenario_name": scenario_name}
        )
        
        background_tasks.add_task(run_sensitivity_analysis_task, run_id, portfolio_id, shocks)
        
        run_info = await db.get_analysis_run(run_id)
        return run_info
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start sensitivity analysis: {str(e)}"
        )

@router.post("/optimize", response_model=AnalysisRunResponse)
async def start_optimization(
    background_tasks: BackgroundTasks,
    portfolio_id: str,
    target_return: float = None,
    risk_aversion: float = None,
):
    """Start portfolio optimization"""
    try:
        # Skip portfolio ownership check for demo mode
        
        run_id = await db.create_analysis_run(
            portfolio_id, 
            "optimizer",
            {"target_return": target_return, "risk_aversion": risk_aversion}
        )
        
        background_tasks.add_task(run_optimization_task, run_id, portfolio_id, target_return, risk_aversion)
        
        run_info = await db.get_analysis_run(run_id)
        return run_info
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start optimization: {str(e)}"
        )

@router.post("/monte-carlo", response_model=MonteCarloResponse)
async def run_monte_carlo(
    request: MonteCarloRequest,
):
    """Run Monte Carlo simulation"""
    try:
        # Skip portfolio ownership check for demo mode
        
        # Create analysis run
        run_id = await db.create_analysis_run(
            request.portfolio_id, 
            "optimizer",
            {
                "time_horizon": request.time_horizon,
                "num_simulations": request.num_simulations,
                "confidence_levels": request.confidence_levels
            }
        )
        
        # Run simulation
        result = await analytics_engine.run_monte_carlo_simulation(
            request.portfolio_id,
            request.time_horizon,
            request.num_simulations
        )
        
        # Store result
        await db.store_result(run_id, "monte_carlo", "simulation", result)
        await db.update_analysis_run(run_id, "succeeded", 100)
        
        return MonteCarloResponse(
            run_id=run_id,
            parameters=request,
            result=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Monte Carlo simulation failed: {str(e)}"
        )

@router.get("/runs/{run_id}/status", response_model=AnalysisRunStatus)
async def get_analysis_status(
    run_id: str,
):
    """Get analysis run status"""
    try:
        run_info = await db.get_analysis_run(run_id)
        
        if not run_info:
            raise HTTPException(status_code=404, detail="Analysis run not found")
        
        # Skip portfolio ownership check for demo mode
        
        return AnalysisRunStatus(
            run_id=run_id,
            status=run_info['status'],
            progress=run_info['progress'],
            message=run_info.get('error_message')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get analysis status: {str(e)}"
        )

@router.get("/runs/{run_id}/results")
async def get_analysis_results(
    run_id: str,
    result_type: str = None,
):
    """Get analysis results"""
    try:
        run_info = await db.get_analysis_run(run_id)
        
        if not run_info:
            raise HTTPException(status_code=404, detail="Analysis run not found")
        
        # Skip portfolio ownership check for demo mode
        
        if run_info['status'] != 'succeeded':
            raise HTTPException(status_code=400, detail="Analysis not completed successfully")
        
        # Get results
        results = await db.get_results(run_id, result_type)
        
        return {
            'run_info': run_info,
            'results': results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get analysis results: {str(e)}"
        )

@router.get("/scenarios")
async def get_scenarios():
    """Get available stress test scenarios"""
    try:
        scenarios = await db.get_scenarios(is_preset=True)
        return scenarios
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get scenarios: {str(e)}"
        )
