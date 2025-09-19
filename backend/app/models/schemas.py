from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

# Enums
class FileType(str, Enum):
    assets = "assets"
    factors = "factors"
    benchmarks = "benchmarks"
    sector_holdings = "sector_holdings"

class RunStatus(str, Enum):
    queued = "queued"
    running = "running"
    succeeded = "succeeded"
    failed = "failed"

class AnalysisRunType(str, Enum):
    performance = "performance"
    risk = "risk"
    sensitivity = "sensitivity"
    optimizer = "optimizer"
    report = "report"

class ResultType(str, Enum):
    table = "table"
    series = "series"
    metric = "metric"
    image = "image"
    json = "json"

# Base Models
class BaseResponse(BaseModel):
    success: bool = True
    message: str = "Operation completed successfully"
    timestamp: datetime = Field(default_factory=datetime.now)

class ErrorResponse(BaseResponse):
    success: bool = False
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

# Portfolio Models
class PortfolioCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class PortfolioResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

# File Models
class FileUploadResponse(BaseModel):
    file_id: str
    upload_url: str
    expires_at: datetime

class FileStatusResponse(BaseModel):
    id: str
    portfolio_id: str
    file_type: FileType
    original_filename: str
    file_size: Optional[int]
    status: RunStatus
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime

# Analysis Models
class AnalysisRunCreate(BaseModel):
    portfolio_id: str
    run_type: AnalysisRunType
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict)

class AnalysisRunResponse(BaseModel):
    id: str
    portfolio_id: str
    run_type: AnalysisRunType
    parameters: Dict[str, Any]
    status: RunStatus
    progress: int
    error_message: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

class AnalysisRunStatus(BaseModel):
    run_id: str
    status: RunStatus
    progress: int
    message: Optional[str] = None
    estimated_completion: Optional[datetime] = None

# Performance Analysis Models
class PerformanceMetrics(BaseModel):
    total_return: float
    annualized_return: float
    volatility: float
    sharpe_ratio: float
    max_drawdown: float
    calmar_ratio: float
    sortino_ratio: float
    var_95: float
    cvar_95: float

class PerformanceComparison(BaseModel):
    portfolio_metrics: PerformanceMetrics
    benchmark_metrics: PerformanceMetrics
    alpha: float
    beta: float
    information_ratio: float
    tracking_error: float

class PerformanceAnalysisResponse(BaseResponse):
    run_id: str
    metrics: PerformanceMetrics
    benchmark_comparison: Optional[PerformanceComparison]
    attribution: Dict[str, float]
    time_series: List[Dict[str, Any]]

# Risk Analysis Models
class RiskMetrics(BaseModel):
    portfolio_volatility: float
    portfolio_beta: float
    systematic_risk: float
    specific_risk: float
    correlation_matrix: Dict[str, Dict[str, float]]
    var_breakdown: Dict[str, float]

class RiskDecomposition(BaseModel):
    asset_contributions: Dict[str, float]
    sector_contributions: Dict[str, float]
    factor_contributions: Dict[str, float]

class RiskAnalysisResponse(BaseResponse):
    run_id: str
    risk_metrics: RiskMetrics
    risk_decomposition: RiskDecomposition
    rolling_metrics: List[Dict[str, Any]]

# Sensitivity Analysis Models
class SensitivityShock(BaseModel):
    factor_name: str
    shock_value: float
    shock_type: str = "absolute"  # absolute or percentage

class SensitivityRequest(BaseModel):
    portfolio_id: str
    shocks: List[SensitivityShock]
    scenario_name: Optional[str] = None

class SensitivityResult(BaseModel):
    factor_name: str
    shock_value: float
    portfolio_impact: float
    asset_impacts: Dict[str, float]

class SensitivityAnalysisResponse(BaseResponse):
    run_id: str
    scenario_name: Optional[str]
    individual_results: List[SensitivityResult]
    combined_impact: float
    stress_test_matrix: Dict[str, Dict[str, float]]

# Optimization Models
class OptimizationConstraints(BaseModel):
    min_weights: Optional[Dict[str, float]] = None
    max_weights: Optional[Dict[str, float]] = None
    sector_limits: Optional[Dict[str, Dict[str, float]]] = None
    turnover_limit: Optional[float] = None

class MarkowitzRequest(BaseModel):
    portfolio_id: str
    target_return: Optional[float] = None
    risk_aversion: Optional[float] = None
    constraints: Optional[OptimizationConstraints] = None

class OptimizationResult(BaseModel):
    optimal_weights: Dict[str, float]
    expected_return: float
    expected_risk: float
    sharpe_ratio: float
    efficient_frontier: List[Dict[str, float]]

class OptimizationResponse(BaseResponse):
    run_id: str
    optimization_type: str
    result: OptimizationResult
    current_vs_optimal: Dict[str, Any]

# Monte Carlo Models
class MonteCarloRequest(BaseModel):
    portfolio_id: str
    time_horizon: int  # in days
    num_simulations: int = Field(default=1000, le=10000)
    confidence_levels: List[float] = Field(default=[0.05, 0.25, 0.5, 0.75, 0.95])

class MonteCarloResult(BaseModel):
    simulations: List[List[float]]
    percentiles: Dict[str, List[float]]
    final_values: Dict[str, float]
    probability_of_loss: float
    expected_shortfall: float

class MonteCarloResponse(BaseResponse):
    run_id: str
    parameters: MonteCarloRequest
    result: MonteCarloResult

# Scenario Models
class ScenarioCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    shocks: Dict[str, float]
    is_preset: bool = False

class ScenarioResponse(BaseModel):
    id: str
    name: str
    version: str
    description: Optional[str]
    shocks: Dict[str, float]
    is_preset: bool
    created_by: Optional[str]
    created_at: datetime

# Report Models
class ReportRequest(BaseModel):
    portfolio_id: str
    sections: List[str] = Field(default=["performance", "risk", "sensitivity", "optimization"])
    include_charts: bool = True
    format: str = Field(default="pdf", regex="^(pdf|excel|both)$")

class ReportResponse(BaseResponse):
    run_id: str
    report_id: str
    pdf_url: Optional[str]
    excel_url: Optional[str]
    generated_at: datetime

# Data Models
class DataPreview(BaseModel):
    file_type: FileType
    headers: List[str]
    sample_rows: List[List[str]]
    total_rows: int
    date_range: Optional[Dict[str, str]]
    data_quality: Dict[str, Any]

class DataSuggestion(BaseModel):
    id: str
    suggestion_type: str
    title: str
    description: str
    similarity_score: float
    data_info: Dict[str, Any]
    status: str = "pending"

# Validation
@validator('shocks', pre=True)
def validate_shocks(cls, v):
    if not isinstance(v, dict):
        raise ValueError('Shocks must be a dictionary')
    for key, value in v.items():
        if not isinstance(value, (int, float)):
            raise ValueError(f'Shock value for {key} must be numeric')
    return v
