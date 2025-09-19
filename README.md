# Strata Intelligence - Portfolio Intelligence Platform

A comprehensive, professional-grade portfolio intelligence platform built with React, FastAPI, and Supabase. Provides 360-degree portfolio analysis including performance attribution, risk diagnostics, stress testing, and optimization.

## 🚀 Features

### Core Platform
- **Authentication System**: Secure Supabase auth with JWT tokens
- **Portfolio Management**: Create, manage, and analyze multiple portfolios
- **Smart File Upload**: Drag-and-drop upload with validation for 4 data types
- **Sample Datasets**: Download realistic Indian market data examples
- **Data Preview**: Interactive preview of uploaded and processed data
- **Smart Suggestions**: AI-powered data similarity detection and recommendations

### Advanced Analytics
- **Performance Analysis**: Comprehensive historical performance metrics
- **Risk Diagnostics**: Multi-dimensional risk analysis
- **Sensitivity & Stress Testing**: Scenario-based risk assessment
- **Portfolio Optimization**: Modern portfolio theory implementation
- **Monte Carlo Simulation**: Forward-looking portfolio projections

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **shadcn/ui** for beautiful, accessible components
- **TanStack Query** for data fetching and caching
- **Supabase** for backend services

### Backend
- **FastAPI** with Python 3.11+
- **Supabase** for database, auth, and storage
- **Pandas/NumPy** for data processing
- **SciPy** for optimization algorithms

## 🚀 Quick Start

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start the server
python start.py
```

### Access the Application
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📊 Data Requirements

The platform supports 4 types of data files:

1. **Assets**: Historical price data for portfolio assets
2. **Risk Factors**: Market risk factors for sensitivity analysis
3. **Benchmarks**: Benchmark indices for performance comparison
4. **Holdings**: Portfolio composition and sector allocation

Sample datasets are provided for download within the application.

## 📱 Usage

1. **Sign Up/Login**: Create account or sign in
2. **Create Portfolio**: Set up a new portfolio for analysis
3. **Upload Data**: Upload your 4 required data files or use samples
4. **View Preview**: Review uploaded data quality
5. **Run Analysis**: Execute comprehensive analytics
6. **Review Results**: Explore insights and recommendations

## 🏗️ Architecture

- **Frontend**: React components with TypeScript
- **Backend**: FastAPI with async processing
- **Database**: Supabase PostgreSQL with RLS
- **Storage**: Supabase Storage for file management
- **Analytics**: Python-based financial calculations
