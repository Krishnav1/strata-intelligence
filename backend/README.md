# Strata Intelligence Backend

Professional Portfolio Intelligence Platform Backend built with FastAPI and Supabase.

## Features

- **Authentication**: Supabase JWT token verification
- **Portfolio Management**: Create, manage, and analyze portfolios
- **Data Processing**: Upload and process CSV/Excel files for portfolio analysis
- **Analytics Engine**: Comprehensive portfolio analytics including:
  - Historical performance analysis
  - Risk diagnostics and decomposition
  - Sensitivity and stress testing
  - Portfolio optimization (Markowitz)
  - Monte Carlo simulations
- **Smart Data Suggestions**: AI-powered data similarity detection
- **Real-time Processing**: Background tasks for data processing and analysis

## Tech Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **Supabase**: Backend-as-a-Service with PostgreSQL database
- **Pandas/NumPy**: Data processing and analysis
- **SciPy**: Scientific computing for optimization
- **Celery**: Distributed task queue (optional)
- **Redis**: Message broker for background tasks

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd strata-intelligence/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

5. **Run the application**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication
All endpoints require Bearer token authentication with Supabase JWT.

### Portfolios
- `GET /api/v1/portfolios/` - List user portfolios
- `POST /api/v1/portfolios/` - Create new portfolio
- `GET /api/v1/portfolios/{id}` - Get portfolio details
- `DELETE /api/v1/portfolios/{id}` - Delete portfolio

### File Management
- `POST /api/v1/files/upload/{portfolio_id}` - Upload data file
- `GET /api/v1/files/{portfolio_id}` - List portfolio files
- `GET /api/v1/files/status/{file_id}` - Get file processing status
- `DELETE /api/v1/files/{file_id}` - Delete file

### Analytics
- `POST /api/v1/analysis/performance` - Start performance analysis
- `POST /api/v1/analysis/risk` - Start risk analysis
- `POST /api/v1/analysis/sensitivity` - Start sensitivity analysis
- `POST /api/v1/analysis/optimize` - Start portfolio optimization
- `POST /api/v1/analysis/monte-carlo` - Run Monte Carlo simulation
- `GET /api/v1/analysis/runs/{run_id}/status` - Get analysis status
- `GET /api/v1/analysis/runs/{run_id}/results` - Get analysis results

### Data
- `GET /api/v1/data/{portfolio_id}/preview` - Get data preview
- `GET /api/v1/data/{portfolio_id}/suggestions` - Get smart suggestions
- `POST /api/v1/data/{portfolio_id}/suggestions/{id}/accept` - Accept suggestion
- `GET /api/v1/data/{portfolio_id}/statistics` - Get portfolio statistics

## Data File Formats

### Assets (assets.csv)
```csv
Date,NIFTY_50,NIFTY_MIDCAP_150,GOLD_ETF,LIQUID_FUND
2023-01-01,18197.45,31348.90,5234.20,4156.78
2023-01-02,18232.55,31456.20,5245.60,4157.12
```

### Risk Factors (factors.csv)
```csv
Date,INTEREST_RATE_10Y,USD_INR,CRUDE_OIL,VIX_INDIA
2023-01-01,7.25,82.45,78.90,16.45
2023-01-02,7.28,82.52,79.15,16.23
```

### Benchmarks (benchmarks.csv)
```csv
Date,NIFTY_50_TR,SENSEX_TR,MSCI_INDIA
2023-01-01,28456.78,71234.45,2345.67
2023-01-02,28623.45,71456.78,2356.89
```

### Holdings (sector_holdings.csv)
```csv
Asset_Name,Sector,Weight_Percent,Market_Value_INR,Beta,Dividend_Yield
ICICI_PRUD_NIFTY_50_ETF,Large_Cap_Equity,35.5,5325000,0.98,1.45
HDFC_MIDCAP_OPPORTUNITIES,Mid_Cap_Equity,25.2,3780000,1.15,0.85
```

## Development

### Project Structure
```
backend/
├── app/
│   ├── api/v1/          # API endpoints
│   ├── core/            # Core functionality (auth, config, database)
│   ├── models/          # Pydantic models and schemas
│   ├── services/        # Business logic services
│   └── __init__.py
├── main.py              # FastAPI application entry point
├── requirements.txt     # Python dependencies
└── README.md
```

### Adding New Analytics

1. **Add method to AnalyticsEngine** (`app/services/analytics_engine.py`)
2. **Create Pydantic schemas** (`app/models/schemas.py`)
3. **Add API endpoint** (`app/api/v1/analysis.py`)
4. **Add background task** for long-running processes

### Database Schema

The application uses Supabase with the following main tables:
- `profiles` - User profiles
- `portfolios` - User portfolios
- `files` - Uploaded files tracking
- `analysis_runs` - Analysis execution tracking
- `results` - Analysis results storage
- `asset_data`, `factor_data`, `benchmark_data`, `holding_data` - Processed data storage

## Deployment

### Docker (Recommended)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `SUPABASE_JWT_SECRET` - JWT secret for token verification
- `REDIS_URL` - Redis connection string (if using Celery)

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License.
