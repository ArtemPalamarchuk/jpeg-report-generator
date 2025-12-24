// Exchange data for liquidity and volume tables
export interface ExchangeData {
  venue: string;
  symbol: string;
  jpegVolume: number;
  marketVolume: number;
  marketShare: number;
  liquidity2pct: number;
  jpegLiquidity2pct: number;
  liquidityShare: number;
  liquidity1pct: number;
  jpegLiquidity1pct: number;
  share1pct: number;
  avgSpread: number;
}

// Balance data
export interface Balance {
  asset: string;
  price: number;
  amount: number;
  notional: number;
}

// Price data
export interface PriceData {
  open: number;
  high: number;
  low: number;
  close: number;
}

// Historical price point for chart
export interface PricePoint {
  date: string;
  price: number;
}

// Complete report data
export interface ReportData {
  token: string;
  date: string;
  commentary: string;
  balances: Balance[];
  exchanges: ExchangeData[];
  prices: PriceData;
  historicalPrices: PricePoint[];
}
