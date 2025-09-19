// Sample datasets for demonstration purposes
export const sampleDatasets = {
  assets: {
    filename: 'sample_assets.csv',
    description: 'Historical asset prices and returns for major Indian equity indices and ETFs',
    headers: ['Date', 'NIFTY_50', 'NIFTY_MIDCAP_150', 'NIFTY_SMALLCAP_250', 'NIFTY_BANK', 'GOLD_ETF', 'LIQUID_FUND'],
    sampleData: [
      ['Date', 'NIFTY_50', 'NIFTY_MIDCAP_150', 'NIFTY_SMALLCAP_250', 'NIFTY_BANK', 'GOLD_ETF', 'LIQUID_FUND'],
      ['2023-01-01', '18197.45', '31348.90', '8234.15', '42273.80', '5234.20', '4156.78'],
      ['2023-01-02', '18232.55', '31456.20', '8267.45', '42456.90', '5245.60', '4157.12'],
      ['2023-01-03', '18156.30', '31234.80', '8198.75', '42134.50', '5221.40', '4157.45'],
      ['2023-01-04', '18298.75', '31567.40', '8345.20', '42678.30', '5267.80', '4157.89'],
      ['2023-01-05', '18345.20', '31678.90', '8389.60', '42789.45', '5289.30', '4158.23'],
      ['...', '...', '...', '...', '...', '...', '...'],
      ['2024-12-31', '24781.20', '54234.80', '16789.45', '51234.60', '6789.40', '4234.56']
    ],
    notes: [
      'Date format: YYYY-MM-DD',
      'All values represent closing prices/NAV',
      'Data should be daily frequency',
      'Missing values should be handled appropriately',
      'Minimum 2 years of data recommended for robust analysis'
    ]
  },
  
  factors: {
    filename: 'sample_factors.csv',
    description: 'Market risk factors including interest rates, currency, and economic indicators',
    headers: ['Date', 'INTEREST_RATE_10Y', 'USD_INR', 'CRUDE_OIL', 'VIX_INDIA', 'INFLATION_CPI'],
    sampleData: [
      ['Date', 'INTEREST_RATE_10Y', 'USD_INR', 'CRUDE_OIL', 'VIX_INDIA', 'INFLATION_CPI'],
      ['2023-01-01', '7.25', '82.45', '78.90', '16.45', '5.72'],
      ['2023-01-02', '7.28', '82.52', '79.15', '16.23', '5.72'],
      ['2023-01-03', '7.22', '82.38', '78.65', '16.78', '5.72'],
      ['2023-01-04', '7.31', '82.67', '79.45', '15.89', '5.72'],
      ['2023-01-05', '7.29', '82.59', '79.23', '16.12', '5.72'],
      ['...', '...', '...', '...', '...', '...'],
      ['2024-12-31', '6.85', '83.12', '82.34', '14.56', '4.85']
    ],
    notes: [
      'Interest rates in percentage (e.g., 7.25 = 7.25%)',
      'USD_INR exchange rate (1 USD = X INR)',
      'Crude oil prices in USD per barrel',
      'VIX India volatility index',
      'CPI inflation rate (annualized %)'
    ]
  },
  
  benchmarks: {
    filename: 'sample_benchmarks.csv',
    description: 'Benchmark indices for performance comparison',
    headers: ['Date', 'NIFTY_50_TR', 'NIFTY_500_TR', 'SENSEX_TR', 'MSCI_INDIA', 'BSE_MIDCAP_TR'],
    sampleData: [
      ['Date', 'NIFTY_50_TR', 'NIFTY_500_TR', 'SENSEX_TR', 'MSCI_INDIA', 'BSE_MIDCAP_TR'],
      ['2023-01-01', '23456.78', '18934.56', '61234.45', '2345.67', '28456.78'],
      ['2023-01-02', '23523.45', '19012.34', '61456.78', '2356.89', '28567.89'],
      ['2023-01-03', '23398.90', '18876.54', '61098.76', '2334.56', '28234.56'],
      ['2023-01-04', '23634.56', '19145.67', '61567.89', '2378.90', '28678.90'],
      ['2023-01-05', '23689.45', '19203.45', '61634.56', '2389.45', '28734.56'],
      ['...', '...', '...', '...', '...', '...'],
      ['2024-12-31', '31234.56', '25678.90', '78456.78', '3123.45', '38456.78']
    ],
    notes: [
      'TR = Total Return indices (includes dividends)',
      'MSCI India in USD terms',
      'All other indices in INR terms',
      'Use total return indices for accurate performance comparison',
      'Ensure date alignment with asset data'
    ]
  },
  
  sector_holdings: {
    filename: 'sample_sector_holdings.csv',
    description: 'Portfolio sector allocation and holdings breakdown',
    headers: ['Asset_Name', 'Sector', 'Weight_Percent', 'Market_Value_INR', 'Beta', 'Dividend_Yield'],
    sampleData: [
      ['Asset_Name', 'Sector', 'Weight_Percent', 'Market_Value_INR', 'Beta', 'Dividend_Yield'],
      ['ICICI_PRUD_NIFTY_50_ETF', 'Large_Cap_Equity', '35.5', '5325000', '0.98', '1.45'],
      ['HDFC_MIDCAP_OPPORTUNITIES', 'Mid_Cap_Equity', '25.2', '3780000', '1.15', '0.85'],
      ['SBI_SMALL_CAP_FUND', 'Small_Cap_Equity', '15.8', '2370000', '1.32', '0.65'],
      ['HDFC_BANK_ETF', 'Banking', '10.5', '1575000', '1.08', '2.15'],
      ['GOLD_BEES_ETF', 'Commodities', '8.0', '1200000', '0.12', '0.00'],
      ['LIQUID_BEES_ETF', 'Debt', '5.0', '750000', '0.05', '3.25'],
      ['...', '...', '...', '...', '...', '...']
    ],
    notes: [
      'Weight_Percent: Portfolio allocation (should sum to 100%)',
      'Market_Value_INR: Current market value in Indian Rupees',
      'Beta: Sensitivity to market movements (1.0 = market average)',
      'Dividend_Yield: Annual dividend yield in percentage',
      'Sector classification should be consistent'
    ]
  }
};

export const generateCSVContent = (datasetType: keyof typeof sampleDatasets): string => {
  const dataset = sampleDatasets[datasetType];
  return dataset.sampleData.map(row => row.join(',')).join('\n');
};

export const downloadSampleDataset = (datasetType: keyof typeof sampleDatasets) => {
  const dataset = sampleDatasets[datasetType];
  const csvContent = generateCSVContent(datasetType);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', dataset.filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
