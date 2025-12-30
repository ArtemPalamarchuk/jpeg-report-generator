import type { ReportData, ExchangeData, Balance } from "../types";

const GOOGLE_API_KEY = "AIzaSyBKKZqqqgtEGz_2Is6P7vSS-BqL1TdAEvY";

function parseNumber(value: string | number): number {
  if (typeof value === "number") return value;
  if (!value || value === "") return 0;
  const cleaned = value.toString().replace(/[$,"\s]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function extractSheetId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

interface SheetData {
  values: string[][];
}

interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
}

interface CoinGeckoSearchResponse {
  coins: CoinGeckoCoin[];
}

export async function parseGoogleSheet(url: string): Promise<ReportData> {
  const sheetId = extractSheetId(url);
  if (!sheetId) {
    throw new Error("Invalid Google Sheets URL");
  }

  try {
    const [liqData, balData, blurbData] = await Promise.all([
      fetchSheetData(sheetId, "Liq"),
      fetchSheetData(sheetId, "Bal"),
      fetchSheetData(sheetId, "Blurb"),
    ]);

    const token = parseLiquiditySheet(liqData).token;
    const exchanges = parseLiquiditySheet(liqData).exchanges;
    const { balances, balanceDate } = await parseBalanceSheet(balData);
    const blurbText = parseBlurbSheet(blurbData);
    const historicalPrices = await fetchHistoricalPrices(token);
    const date = new Date().toISOString().split("T")[0];

    // Check if balance date matches report date
    let balanceWarning: string | undefined;
    if (balanceDate && balanceDate !== date) {
      balanceWarning = `⚠️ Balance data is outdated (dated: ${balanceDate})`;
    }

    const reportData: ReportData = {
      token,
      date,
      commentary: blurbText,
      balances,
      exchanges,
      prices: {
        open: 0,
        high: 0,
        low: 0,
        close: 0,
      },
      historicalPrices,
      balanceWarning,
    };

    return reportData;
  } catch (error) {
    console.error("❌ Error parsing Google Sheets:", error);
    throw error;
  }
}

async function fetchSheetData(sheetId: string, sheetName: string): Promise<SheetData> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}?key=${GOOGLE_API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch ${sheetName}: ${error.error?.message || "Unknown error"}`);
  }

  return await response.json();
}

function parseLiquiditySheet(data: SheetData): { token: string; exchanges: ExchangeData[] } {
  const rows = data.values;
  const token = rows[0]?.[0]?.trim() || "";
  const headers = rows[1] || [];

  const colMap: Record<string, number> = {};
  headers.forEach((header, index) => {
    if (header) colMap[header.trim()] = index;
  });

  const exchanges: ExchangeData[] = [];
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const venue = row[colMap["Exchange"]]?.trim();
    if (!venue) continue;

    exchanges.push({
      venue,
      symbol: row[colMap["Symbol"]]?.trim() || "",
      jpegVolume: parseNumber(row[colMap["JPEG Volume ($)"]] || "0"),
      marketVolume: parseNumber(row[colMap["Market Volume ($)"]] || "0"),
      marketShare: parseNumber(row[colMap["% Market Share"]] || "0"),
      jpegLiquidity2pct: parseNumber(row[colMap["2% Liquidity Avg ($)"]] || "0"),
      liquidity2pct: parseNumber(row[colMap["2% Liquidity"]] || "0"),
      liquidityShare: parseNumber(row[colMap["2% Share"]] || "0"),
      avgSpread: parseNumber(row[colMap["Avg Spread (bps)"]] || "0"),
    });
  }

  return { token, exchanges };
}

async function parseBalanceSheet(
  data: SheetData,
): Promise<{ balances: Balance[]; balanceDate: string | null }> {
  const rows = data.values;
  if (rows.length === 0) return { balances: [], balanceDate: null };

  const balances: Balance[] = [];
  let balanceDate: string | null = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const asset = row[1]?.trim();
    if (!asset) continue;

    // Extract date from column D (index 3) if not already extracted
    if (!balanceDate && row[3]) {
      balanceDate = row[3].trim();
    }

    const amount = parseNumber(row[2] || "0");

    // Set fixed price for stablecoins
    const isStablecoin = ["STABLES", "USDC", "USDT"].includes(asset.toUpperCase());
    const price = isStablecoin ? 1.0 : await fetchCurrentPrice(asset);

    balances.push({
      asset,
      price,
      amount,
      notional: price * amount,
    });
  }

  return { balances, balanceDate };
}

function parseBlurbSheet(data: SheetData): string {
  const rows = data.values;
  if (rows.length === 0) return "";

  return rows
    .map((row) => row.join(" ").trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

async function fetchHistoricalPrices(
  tokenSymbol: string,
): Promise<Array<{ date: string; price: number }>> {
  try {
    const searchUrl = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(tokenSymbol)}`;
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) return [];

    const searchData: CoinGeckoSearchResponse = await searchResponse.json();
    const coin = searchData.coins?.find(
      (c) => c.symbol?.toLowerCase() === tokenSymbol.toLowerCase(),
    );
    if (!coin) return [];

    const chartUrl = `https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=30&interval=daily`;
    const chartResponse = await fetch(chartUrl);
    if (!chartResponse.ok) return [];

    const chartData = await chartResponse.json();
    return (
      chartData.prices?.map((point: [number, number]) => ({
        date: new Date(point[0]).toISOString().split("T")[0],
        price: point[1],
      })) || []
    );
  } catch (error) {
    console.error("Error fetching historical prices:", error);
    return [];
  }
}

async function fetchCurrentPrice(tokenSymbol: string): Promise<number> {
  try {
    const searchUrl = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(tokenSymbol)}`;
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) return 0;

    const searchData: CoinGeckoSearchResponse = await searchResponse.json();
    const coin = searchData.coins?.find(
      (c) => c.symbol?.toLowerCase() === tokenSymbol.toLowerCase(),
    );
    if (!coin) return 0;

    const priceUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coin.id}&vs_currencies=usd`;
    const priceResponse = await fetch(priceUrl);
    if (!priceResponse.ok) return 0;

    const priceData = await priceResponse.json();
    return priceData[coin.id]?.usd || 0;
  } catch (error) {
    console.error("Error fetching current price:", error);
    return 0;
  }
}
