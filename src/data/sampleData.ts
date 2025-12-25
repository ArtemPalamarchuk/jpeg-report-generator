import type { ReportData } from "../types";

// Empty template for users to fill
export const emptyReportData: ReportData = {
  token: "",
  date: new Date().toISOString().split("T")[0],
  commentary: "",
  balances: [
    {
      asset: "",
      price: "" as never,
      amount: "" as never,
      notional: 0,
    },
  ],
  exchanges: [
    {
      venue: "",
      symbol: "",
      jpegVolume: "" as never,
      marketVolume: "" as never,
      marketShare: 0,
      liquidity2pct: "" as never,
      jpegLiquidity2pct: "" as never,
      liquidityShare: 0,
      avgSpread: 0,
    },
  ],
  prices: {
    open: 0,
    high: 0,
    low: 0,
    close: 0,
  },
  historicalPrices: [],
};
