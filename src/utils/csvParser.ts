import Papa from "papaparse";
import type { ExchangeData, ReportData } from "../types";

// Helper function to clean and parse numbers from CSV (removes $ and ,)
function parseNumber(value: string | number): number {
  if (typeof value === "number") return value;
  if (!value || value === "") return 0;

  // Remove $, commas, and quotes
  const cleaned = value.toString().replace(/[$,"\s]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export interface ParsedCSVData {
  token: string;
  exchanges: ExchangeData[];
}

export function parseCSV(csvContent: string): ParsedCSVData {
  // Parse without headers first to handle the non-standard format
  const result = Papa.parse<string[]>(csvContent, {
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    console.error("CSV parsing errors:", result.errors);
  }

  const exchanges: ExchangeData[] = [];
  let token = "";
  // let headerRow: string[] = [];

  // Find ALL header rows (there might be multiple datasets)
  const headerIndices: number[] = [];
  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    // Check if this row contains the expected headers
    if (
      row.some((cell) => cell && cell.includes("Exchange")) &&
      row.some((cell) => cell && cell.includes("Symbol"))
    ) {
      headerIndices.push(i);
    }
  }

  if (headerIndices.length === 0) {
    throw new Error("Could not find header row with 'Exchange' and 'Symbol'");
  }

  // Process each dataset
  headerIndices.forEach((headerIndex, datasetIndex) => {
    const currentHeaderRow = result.data[headerIndex].map((h) => (h ? h.trim() : ""));

    // Extract token from rows before THIS header
    const startSearchIndex = datasetIndex === 0 ? 0 : headerIndices[datasetIndex - 1] + 1;
    let datasetToken = "";

    for (let i = startSearchIndex; i < headerIndex; i++) {
      const row = result.data[i];
      const firstCell = row[0] ? row[0].trim() : "";
      // Check if it's a standalone token (short, no commas, no special chars)
      if (
        firstCell &&
        firstCell.length < 10 &&
        !/[,$]/.test(firstCell) &&
        !firstCell.toLowerCase().includes("exchange")
      ) {
        datasetToken = firstCell;
        break;
      }
    }

    // Use first found token as main token
    if (!token && datasetToken) {
      token = datasetToken;
    }

    // Create column index map
    const colMap: { [key: string]: number } = {};
    currentHeaderRow.forEach((header, index) => {
      if (header) colMap[header] = index;
    });

    // Determine where this dataset ends (either at next header or end of file)
    const nextHeaderIndex =
      datasetIndex < headerIndices.length - 1
        ? headerIndices[datasetIndex + 1]
        : result.data.length;

    // Process data rows (after current header, before next header)
    for (let i = headerIndex + 1; i < nextHeaderIndex; i++) {
      const row = result.data[i];

      // Get exchange name (first column or by header)
      const exchangeCol = colMap["Exchange"] ?? 0;
      const venue = row[exchangeCol] ? row[exchangeCol].trim() : "";

      // Skip empty rows or if venue is empty
      if (!venue || venue === "") continue;

      // Skip if this looks like a token row (single word, no symbol in second column)
      const symbolCol = colMap["Symbol"] ?? 1;
      const symbol = row[symbolCol] ? row[symbolCol].trim() : "";

      // If venue is short (< 10 chars), has no symbol, and has no volume data, it's likely a token row
      if (
        venue.length < 10 &&
        !symbol &&
        !row[colMap["JPEG Volume ($)"] ?? 2] &&
        !row[colMap["Market Volume ($)"] ?? 3]
      ) {
        continue;
      }

      // Extract token from symbol if we don't have it yet
      if (!token && symbol) {
        const symbolParts = symbol.split("/");
        token = symbolParts[0];
      }

      // Parse all numeric fields
      const exchangeData: ExchangeData = {
        venue: venue,
        symbol: symbol,
        jpegVolume: parseNumber(row[colMap["JPEG Volume ($)"] ?? 2] || "0"),
        marketVolume: parseNumber(row[colMap["Market Volume ($)"] ?? 3] || "0"),
        marketShare: parseNumber(row[colMap["% Market Share"] ?? 4] || "0"),
        liquidity2pct: parseNumber(row[colMap["2% Liquidity Avg ($)"] ?? 5] || "0"),
        jpegLiquidity2pct: parseNumber(row[colMap["2% Liquidity"] ?? 6] || "0"),
        liquidityShare: parseNumber(row[colMap["2% Share"] ?? 7] || "0"),
        avgSpread: parseNumber(row[colMap["Avg Spread (bps)"] ?? 11] || "0"),
      };

      // Only add if we have actual data
      if (venue) {
        exchanges.push(exchangeData);
      }
    }
  });

  if (exchanges.length === 0) {
    throw new Error("No valid exchange data found in CSV");
  }

  if (!token) {
    throw new Error("Could not determine token name from CSV");
  }

  return { token, exchanges };
}

export function csvToReportData(
  csvContent: string,
  date: string,
  commentary: string = "",
): ReportData {
  const parsedData = parseCSV(csvContent);

  // Create minimal report data with CSV exchanges
  const reportData: ReportData = {
    token: parsedData.token,
    date: date,
    commentary: commentary,
    balances: [
      {
        asset: "USDT",
        price: 1.0,
        amount: 0,
        notional: 0,
      },
    ],
    exchanges: parsedData.exchanges,
    prices: {
      open: 0,
      high: 0,
      low: 0,
      close: 0,
    },
    historicalPrices: [],
  };

  return reportData;
}
