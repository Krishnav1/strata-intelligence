import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime, timedelta
from scipy import stats
from scipy.optimize import minimize
import warnings
warnings.filterwarnings('ignore')

from ..core.database import db
from ..core.config import settings

class AnalyticsEngine:
    """
    Core analytics engine for portfolio analysis
    """
    
    def __init__(self):
        self.risk_free_rate = settings.DEFAULT_RISK_FREE_RATE
        self.confidence_level = settings.DEFAULT_CONFIDENCE_LEVEL
    
    # Performance Analysis Methods
    async def calculate_historical_performance(self, portfolio_id: str, benchmark_name: str = None) -> Dict[str, Any]:
        """Calculate comprehensive historical performance metrics"""
        try:
            # Get asset data
            asset_df = await db.get_asset_data(portfolio_id)
            if asset_df.empty:
                raise ValueError("No asset data found")
            
            # Get holdings data for weights
            holdings_response = await db.client.table("holding_data").select("*").eq("portfolio_id", portfolio_id).execute()
            if not holdings_response.data:
                raise ValueError("No holdings data found")
            
            holdings_df = pd.DataFrame(holdings_response.data)
            
            # Calculate portfolio returns
            portfolio_returns = self._calculate_portfolio_returns(asset_df, holdings_df)
            
            # Calculate performance metrics
            metrics = self._calculate_performance_metrics(portfolio_returns)
            
            # Benchmark comparison if provided
            benchmark_comparison = None
            if benchmark_name:
                benchmark_df = await db.get_benchmark_data(portfolio_id, [benchmark_name])
                if not benchmark_df.empty:
                    benchmark_returns = benchmark_df[benchmark_name].pct_change().dropna()
                    benchmark_comparison = self._compare_with_benchmark(portfolio_returns, benchmark_returns)
            
            return {
                'portfolio_metrics': metrics,
                'benchmark_comparison': benchmark_comparison,
                'time_series': portfolio_returns.to_dict(),
                'attribution': self._calculate_return_attribution(asset_df, holdings_df)
            }
            
        except Exception as e:
            raise ValueError(f"Performance calculation failed: {str(e)}")
    
    def _calculate_portfolio_returns(self, asset_df: pd.DataFrame, holdings_df: pd.DataFrame) -> pd.Series:
        """Calculate weighted portfolio returns"""
        # Get weights
        weights = {}
        for _, row in holdings_df.iterrows():
            asset_name = row['asset_name']
            weight = row['weight_percent'] / 100.0
            weights[asset_name] = weight
        
        # Calculate returns for each asset
        returns_df = asset_df.set_index('date').pct_change().dropna()
        
        # Calculate weighted portfolio returns
        portfolio_returns = pd.Series(0.0, index=returns_df.index)
        for asset, weight in weights.items():
            if asset in returns_df.columns:
                portfolio_returns += returns_df[asset] * weight
        
        return portfolio_returns
    
    def _calculate_performance_metrics(self, returns: pd.Series) -> Dict[str, float]:
        """Calculate comprehensive performance metrics"""
        # Basic metrics
        total_return = (1 + returns).prod() - 1
        annualized_return = (1 + returns.mean()) ** 252 - 1
        volatility = returns.std() * np.sqrt(252)
        
        # Risk-adjusted metrics
        excess_returns = returns - self.risk_free_rate / 252
        sharpe_ratio = excess_returns.mean() / returns.std() * np.sqrt(252) if returns.std() > 0 else 0
        
        # Downside metrics
        downside_returns = returns[returns < 0]
        downside_deviation = downside_returns.std() * np.sqrt(252) if len(downside_returns) > 0 else 0
        sortino_ratio = excess_returns.mean() / downside_deviation * np.sqrt(252) if downside_deviation > 0 else 0
        
        # Drawdown metrics
        cumulative_returns = (1 + returns).cumprod()
        rolling_max = cumulative_returns.expanding().max()
        drawdowns = (cumulative_returns - rolling_max) / rolling_max
        max_drawdown = drawdowns.min()
        
        # Calmar ratio
        calmar_ratio = annualized_return / abs(max_drawdown) if max_drawdown != 0 else 0
        
        # VaR and CVaR
        var_95 = np.percentile(returns, (1 - self.confidence_level) * 100)
        cvar_95 = returns[returns <= var_95].mean()
        
        return {
            'total_return': total_return,
            'annualized_return': annualized_return,
            'volatility': volatility,
            'sharpe_ratio': sharpe_ratio,
            'sortino_ratio': sortino_ratio,
            'max_drawdown': max_drawdown,
            'calmar_ratio': calmar_ratio,
            'var_95': var_95,
            'cvar_95': cvar_95
        }
    
    def _compare_with_benchmark(self, portfolio_returns: pd.Series, benchmark_returns: pd.Series) -> Dict[str, Any]:
        """Compare portfolio with benchmark"""
        # Align dates
        aligned_data = pd.DataFrame({
            'portfolio': portfolio_returns,
            'benchmark': benchmark_returns
        }).dropna()
        
        if aligned_data.empty:
            return None
        
        portfolio_aligned = aligned_data['portfolio']
        benchmark_aligned = aligned_data['benchmark']
        
        # Calculate benchmark metrics
        benchmark_metrics = self._calculate_performance_metrics(benchmark_aligned)
        
        # Calculate relative metrics
        excess_returns = portfolio_aligned - benchmark_aligned
        
        # Beta calculation
        covariance = np.cov(portfolio_aligned, benchmark_aligned)[0, 1]
        benchmark_variance = np.var(benchmark_aligned)
        beta = covariance / benchmark_variance if benchmark_variance > 0 else 0
        
        # Alpha calculation
        alpha = portfolio_aligned.mean() - (self.risk_free_rate / 252 + beta * (benchmark_aligned.mean() - self.risk_free_rate / 252))
        alpha_annualized = alpha * 252
        
        # Information ratio
        tracking_error = excess_returns.std() * np.sqrt(252)
        information_ratio = excess_returns.mean() / excess_returns.std() * np.sqrt(252) if excess_returns.std() > 0 else 0
        
        return {
            'benchmark_metrics': benchmark_metrics,
            'alpha': alpha_annualized,
            'beta': beta,
            'information_ratio': information_ratio,
            'tracking_error': tracking_error
        }
    
    def _calculate_return_attribution(self, asset_df: pd.DataFrame, holdings_df: pd.DataFrame) -> Dict[str, float]:
        """Calculate return attribution by asset"""
        attribution = {}
        
        # Calculate returns for each asset
        returns_df = asset_df.set_index('date').pct_change().dropna()
        
        for _, row in holdings_df.iterrows():
            asset_name = row['asset_name']
            weight = row['weight_percent'] / 100.0
            
            if asset_name in returns_df.columns:
                asset_return = returns_df[asset_name].mean() * 252  # Annualized
                contribution = weight * asset_return
                attribution[asset_name] = contribution
        
        return attribution
    
    # Risk Analysis Methods
    async def generate_risk_diagnostics(self, portfolio_id: str) -> Dict[str, Any]:
        """Generate comprehensive risk diagnostics"""
        try:
            # Get data
            asset_df = await db.get_asset_data(portfolio_id)
            holdings_response = await db.client.table("holding_data").select("*").eq("portfolio_id", portfolio_id).execute()
            
            if asset_df.empty or not holdings_response.data:
                raise ValueError("Insufficient data for risk analysis")
            
            holdings_df = pd.DataFrame(holdings_response.data)
            
            # Calculate portfolio returns and weights
            portfolio_returns = self._calculate_portfolio_returns(asset_df, holdings_df)
            weights = {row['asset_name']: row['weight_percent'] / 100.0 for _, row in holdings_df.iterrows()}
            
            # Risk metrics
            risk_metrics = self._calculate_risk_metrics(asset_df, weights)
            
            # Risk decomposition
            risk_decomposition = self._calculate_risk_decomposition(asset_df, weights)
            
            # Rolling metrics
            rolling_metrics = self._calculate_rolling_metrics(portfolio_returns)
            
            return {
                'risk_metrics': risk_metrics,
                'risk_decomposition': risk_decomposition,
                'rolling_metrics': rolling_metrics
            }
            
        except Exception as e:
            raise ValueError(f"Risk analysis failed: {str(e)}")
    
    def _calculate_risk_metrics(self, asset_df: pd.DataFrame, weights: Dict[str, float]) -> Dict[str, Any]:
        """Calculate portfolio risk metrics"""
        # Calculate returns
        returns_df = asset_df.set_index('date').pct_change().dropna()
        
        # Portfolio volatility
        portfolio_returns = pd.Series(0.0, index=returns_df.index)
        for asset, weight in weights.items():
            if asset in returns_df.columns:
                portfolio_returns += returns_df[asset] * weight
        
        portfolio_volatility = portfolio_returns.std() * np.sqrt(252)
        
        # Correlation matrix
        correlation_matrix = returns_df.corr().to_dict()
        
        # Covariance matrix
        cov_matrix = returns_df.cov() * 252  # Annualized
        
        # Portfolio variance decomposition
        weights_array = np.array([weights.get(col, 0) for col in returns_df.columns])
        portfolio_variance = np.dot(weights_array, np.dot(cov_matrix.values, weights_array))
        
        # VaR breakdown by asset
        var_breakdown = {}
        for i, asset in enumerate(returns_df.columns):
            if asset in weights:
                marginal_var = 2 * np.dot(cov_matrix.iloc[i].values, weights_array)
                component_var = weights[asset] * marginal_var
                var_breakdown[asset] = component_var / portfolio_variance if portfolio_variance > 0 else 0
        
        return {
            'portfolio_volatility': portfolio_volatility,
            'correlation_matrix': correlation_matrix,
            'var_breakdown': var_breakdown,
            'portfolio_variance': portfolio_variance
        }
    
    def _calculate_risk_decomposition(self, asset_df: pd.DataFrame, weights: Dict[str, float]) -> Dict[str, Any]:
        """Calculate risk decomposition by various factors"""
        returns_df = asset_df.set_index('date').pct_change().dropna()
        
        # Asset contribution to risk
        asset_contributions = {}
        cov_matrix = returns_df.cov() * 252
        weights_array = np.array([weights.get(col, 0) for col in returns_df.columns])
        portfolio_variance = np.dot(weights_array, np.dot(cov_matrix.values, weights_array))
        
        for i, asset in enumerate(returns_df.columns):
            if asset in weights:
                marginal_contribution = np.dot(cov_matrix.iloc[i].values, weights_array)
                asset_contributions[asset] = weights[asset] * marginal_contribution / portfolio_variance if portfolio_variance > 0 else 0
        
        return {
            'asset_contributions': asset_contributions,
            'sector_contributions': {},  # Would need sector mapping
            'factor_contributions': {}   # Would need factor model
        }
    
    def _calculate_rolling_metrics(self, returns: pd.Series, window: int = 60) -> List[Dict[str, Any]]:
        """Calculate rolling risk metrics"""
        rolling_data = []
        
        for i in range(window, len(returns)):
            window_returns = returns.iloc[i-window:i]
            
            rolling_data.append({
                'date': returns.index[i].isoformat(),
                'volatility': window_returns.std() * np.sqrt(252),
                'var_95': np.percentile(window_returns, 5),
                'skewness': stats.skew(window_returns),
                'kurtosis': stats.kurtosis(window_returns)
            })
        
        return rolling_data
    
    # Sensitivity Analysis Methods
    async def run_sensitivity_analysis(self, portfolio_id: str, shocks: Dict[str, float]) -> Dict[str, Any]:
        """Run sensitivity analysis with factor shocks"""
        try:
            # Get portfolio data
            asset_df = await db.get_asset_data(portfolio_id)
            factor_df = await db.get_factor_data(portfolio_id)
            holdings_response = await db.client.table("holding_data").select("*").eq("portfolio_id", portfolio_id).execute()
            
            if asset_df.empty or factor_df.empty or not holdings_response.data:
                raise ValueError("Insufficient data for sensitivity analysis")
            
            holdings_df = pd.DataFrame(holdings_response.data)
            weights = {row['asset_name']: row['weight_percent'] / 100.0 for _, row in holdings_df.iterrows()}
            
            # Calculate factor loadings (simplified approach)
            factor_loadings = self._calculate_factor_loadings(asset_df, factor_df)
            
            # Apply shocks and calculate impacts
            results = {}
            for factor_name, shock_value in shocks.items():
                if factor_name in factor_loadings:
                    impact = self._calculate_shock_impact(factor_loadings[factor_name], shock_value, weights)
                    results[factor_name] = {
                        'shock_value': shock_value,
                        'portfolio_impact': impact['portfolio_impact'],
                        'asset_impacts': impact['asset_impacts']
                    }
            
            # Calculate combined impact
            combined_impact = sum(result['portfolio_impact'] for result in results.values())
            
            return {
                'individual_results': results,
                'combined_impact': combined_impact,
                'stress_test_matrix': self._generate_stress_test_matrix(factor_loadings, weights)
            }
            
        except Exception as e:
            raise ValueError(f"Sensitivity analysis failed: {str(e)}")
    
    def _calculate_factor_loadings(self, asset_df: pd.DataFrame, factor_df: pd.DataFrame) -> Dict[str, Dict[str, float]]:
        """Calculate factor loadings for each asset (simplified regression)"""
        asset_returns = asset_df.set_index('date').pct_change().dropna()
        factor_returns = factor_df.set_index('date').pct_change().dropna()
        
        # Align dates
        aligned_data = asset_returns.join(factor_returns, how='inner')
        
        factor_loadings = {}
        for factor in factor_returns.columns:
            factor_loadings[factor] = {}
            for asset in asset_returns.columns:
                if factor in aligned_data.columns and asset in aligned_data.columns:
                    # Simple correlation as proxy for factor loading
                    correlation = aligned_data[asset].corr(aligned_data[factor])
                    factor_loadings[factor][asset] = correlation if not np.isnan(correlation) else 0
        
        return factor_loadings
    
    def _calculate_shock_impact(self, loadings: Dict[str, float], shock: float, weights: Dict[str, float]) -> Dict[str, Any]:
        """Calculate impact of factor shock on portfolio"""
        asset_impacts = {}
        portfolio_impact = 0
        
        for asset, loading in loadings.items():
            if asset in weights:
                asset_impact = loading * shock
                asset_impacts[asset] = asset_impact
                portfolio_impact += weights[asset] * asset_impact
        
        return {
            'portfolio_impact': portfolio_impact,
            'asset_impacts': asset_impacts
        }
    
    def _generate_stress_test_matrix(self, factor_loadings: Dict[str, Dict[str, float]], weights: Dict[str, float]) -> Dict[str, Dict[str, float]]:
        """Generate stress test matrix for different shock levels"""
        stress_levels = [-0.02, -0.01, 0, 0.01, 0.02]  # -2% to +2%
        matrix = {}
        
        for factor in factor_loadings:
            matrix[factor] = {}
            for level in stress_levels:
                impact = self._calculate_shock_impact(factor_loadings[factor], level, weights)
                matrix[factor][f"{level:.1%}"] = impact['portfolio_impact']
        
        return matrix
    
    # Optimization Methods
    async def run_markowitz_optimization(self, portfolio_id: str, target_return: float = None, risk_aversion: float = None) -> Dict[str, Any]:
        """Run Markowitz mean-variance optimization"""
        try:
            # Get data
            asset_df = await db.get_asset_data(portfolio_id)
            if asset_df.empty:
                raise ValueError("No asset data found")
            
            # Calculate expected returns and covariance matrix
            returns_df = asset_df.set_index('date').pct_change().dropna()
            expected_returns = returns_df.mean() * 252  # Annualized
            cov_matrix = returns_df.cov() * 252  # Annualized
            
            n_assets = len(expected_returns)
            
            # Optimization constraints
            constraints = [{'type': 'eq', 'fun': lambda x: np.sum(x) - 1}]  # Weights sum to 1
            bounds = tuple((0, 1) for _ in range(n_assets))  # Long-only
            
            if target_return:
                # Target return constraint
                constraints.append({'type': 'eq', 'fun': lambda x: np.dot(x, expected_returns) - target_return})
                
                # Minimize risk for target return
                def objective(weights):
                    return np.dot(weights, np.dot(cov_matrix, weights))
                
            elif risk_aversion:
                # Maximize utility (return - risk_aversion * risk)
                def objective(weights):
                    portfolio_return = np.dot(weights, expected_returns)
                    portfolio_risk = np.dot(weights, np.dot(cov_matrix, weights))
                    return -(portfolio_return - 0.5 * risk_aversion * portfolio_risk)
            else:
                # Maximize Sharpe ratio
                def objective(weights):
                    portfolio_return = np.dot(weights, expected_returns)
                    portfolio_risk = np.sqrt(np.dot(weights, np.dot(cov_matrix, weights)))
                    return -(portfolio_return - self.risk_free_rate) / portfolio_risk if portfolio_risk > 0 else -np.inf
            
            # Initial guess (equal weights)
            x0 = np.array([1/n_assets] * n_assets)
            
            # Optimize
            result = minimize(objective, x0, method='SLSQP', bounds=bounds, constraints=constraints)
            
            if result.success:
                optimal_weights = dict(zip(returns_df.columns, result.x))
                
                # Calculate metrics for optimal portfolio
                opt_return = np.dot(result.x, expected_returns)
                opt_risk = np.sqrt(np.dot(result.x, np.dot(cov_matrix, result.x)))
                opt_sharpe = (opt_return - self.risk_free_rate) / opt_risk if opt_risk > 0 else 0
                
                # Generate efficient frontier
                efficient_frontier = self._generate_efficient_frontier(expected_returns, cov_matrix)
                
                return {
                    'optimal_weights': optimal_weights,
                    'expected_return': opt_return,
                    'expected_risk': opt_risk,
                    'sharpe_ratio': opt_sharpe,
                    'efficient_frontier': efficient_frontier
                }
            else:
                raise ValueError("Optimization failed to converge")
                
        except Exception as e:
            raise ValueError(f"Optimization failed: {str(e)}")
    
    def _generate_efficient_frontier(self, expected_returns: pd.Series, cov_matrix: pd.DataFrame, n_points: int = 50) -> List[Dict[str, float]]:
        """Generate efficient frontier points"""
        min_ret = expected_returns.min()
        max_ret = expected_returns.max()
        target_returns = np.linspace(min_ret, max_ret, n_points)
        
        frontier = []
        n_assets = len(expected_returns)
        
        for target_ret in target_returns:
            try:
                constraints = [
                    {'type': 'eq', 'fun': lambda x: np.sum(x) - 1},
                    {'type': 'eq', 'fun': lambda x: np.dot(x, expected_returns) - target_ret}
                ]
                bounds = tuple((0, 1) for _ in range(n_assets))
                
                def objective(weights):
                    return np.dot(weights, np.dot(cov_matrix, weights))
                
                x0 = np.array([1/n_assets] * n_assets)
                result = minimize(objective, x0, method='SLSQP', bounds=bounds, constraints=constraints)
                
                if result.success:
                    risk = np.sqrt(result.fun)
                    frontier.append({'return': target_ret, 'risk': risk})
            except:
                continue
        
        return frontier
    
    # Monte Carlo Simulation
    async def run_monte_carlo_simulation(self, portfolio_id: str, time_horizon: int, num_simulations: int = 1000) -> Dict[str, Any]:
        """Run Monte Carlo simulation for portfolio projections"""
        try:
            # Get data
            asset_df = await db.get_asset_data(portfolio_id)
            holdings_response = await db.client.table("holding_data").select("*").eq("portfolio_id", portfolio_id).execute()
            
            if asset_df.empty or not holdings_response.data:
                raise ValueError("Insufficient data for Monte Carlo simulation")
            
            holdings_df = pd.DataFrame(holdings_response.data)
            weights = {row['asset_name']: row['weight_percent'] / 100.0 for _, row in holdings_df.iterrows()}
            
            # Calculate portfolio statistics
            returns_df = asset_df.set_index('date').pct_change().dropna()
            portfolio_returns = self._calculate_portfolio_returns(asset_df, holdings_df)
            
            mean_return = portfolio_returns.mean()
            std_return = portfolio_returns.std()
            
            # Run simulations
            simulations = []
            for _ in range(num_simulations):
                simulation = self._run_single_simulation(mean_return, std_return, time_horizon)
                simulations.append(simulation)
            
            # Calculate statistics
            final_values = [sim[-1] for sim in simulations]
            percentiles = {
                '5%': np.percentile(final_values, 5),
                '25%': np.percentile(final_values, 25),
                '50%': np.percentile(final_values, 50),
                '75%': np.percentile(final_values, 75),
                '95%': np.percentile(final_values, 95)
            }
            
            probability_of_loss = sum(1 for val in final_values if val < 1.0) / num_simulations
            expected_shortfall = np.mean([val for val in final_values if val <= percentiles['5%']])
            
            return {
                'simulations': simulations[:100],  # Return first 100 for visualization
                'percentiles': percentiles,
                'final_values': {
                    'mean': np.mean(final_values),
                    'std': np.std(final_values),
                    'min': np.min(final_values),
                    'max': np.max(final_values)
                },
                'probability_of_loss': probability_of_loss,
                'expected_shortfall': expected_shortfall
            }
            
        except Exception as e:
            raise ValueError(f"Monte Carlo simulation failed: {str(e)}")
    
    def _run_single_simulation(self, mean_return: float, std_return: float, time_horizon: int) -> List[float]:
        """Run a single Monte Carlo simulation path"""
        path = [1.0]  # Start with $1
        
        for _ in range(time_horizon):
            random_return = np.random.normal(mean_return, std_return)
            new_value = path[-1] * (1 + random_return)
            path.append(new_value)
        
        return path

# Global analytics engine instance
analytics_engine = AnalyticsEngine()
