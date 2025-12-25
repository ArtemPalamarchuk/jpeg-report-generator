import Papa from "papaparse";
import type { ExchangeData, ReportData } from "../types";

function parseNumber(value: string | number): number {
  if (typeof value === "number") return value;
  if (!value || value === "") return 0;
  const cleaned = value.toString().replace(/[$,"\s]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

interface ParsedCSVData {
  token: string;
  exchanges: ExchangeData[];
}

function parseCSV(csvContent: string): ParsedCSVData {
  const result = Papa.parse<string[]>(csvContent, { skipEmptyLines: true });

  let token = "";
  let headerIndex = -1;

  // Find token (first non-empty cell in first row)
  token = result.data[0]?.[0]?.trim() || "";
  console.log(`🪙 Token: ${token}`);

  // Find header row (contains "Exchange" and "Symbol")
  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    if (
      row.some((cell) => cell?.includes("Exchange")) &&
      row.some((cell) => cell?.includes("Symbol"))
    ) {
      headerIndex = i;
      console.log(`📋 Found header at row ${i}`);
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error("Could not find header row");
  }

  // Map columns
  const headers = result.data[headerIndex].map((h) => h?.trim() || "");

  const colMap: Record<string, number> = {};
  headers.forEach((header, index) => {
    if (header) colMap[header] = index;
  });

  console.log("\n🏦 Parsing exchanges:");

  // Parse exchanges
  const exchanges: ExchangeData[] = [];
  for (let i = headerIndex + 1; i < result.data.length; i++) {
    const row = result.data[i];
    const venue = row[colMap["Exchange"]]?.trim();

    if (!venue) continue;

    const exchange: ExchangeData = {
      venue,
      symbol: row[colMap["Symbol"]]?.trim() || "",
      jpegVolume: parseNumber(row[colMap["JPEG Volume ($)"]] || "0"),
      marketVolume: parseNumber(row[colMap["Market Volume ($)"]] || "0"),
      marketShare: parseNumber(row[colMap["% Market Share"]] || "0"),
      jpegLiquidity2pct: parseNumber(row[colMap["2% Liquidity Avg ($)"]] || "0"),
      liquidity2pct: parseNumber(row[colMap["2% Liquidity"]] || "0"),
      liquidityShare: parseNumber(row[colMap["2% Share"]] || "0"),
      avgSpread: parseNumber(row[colMap["Avg Spread (bps)"]] || "0"),
    };

    exchanges.push(exchange);
  }

  return { token, exchanges };
}

export function csvToReportData(
  csvContent: string,
  date: string,
  commentary: string = "",
): ReportData {
  const parsedData = parseCSV(csvContent);

  return {
    token: parsedData.token,
    date: date,
    commentary: commentary,
    balances: [],
    exchanges: parsedData.exchanges,
    prices: {
      open: 0,
      high: 0,
      low: 0,
      close: 0,
    },
    historicalPrices: [],
  };
}
