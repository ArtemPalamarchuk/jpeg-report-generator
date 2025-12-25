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

export async function parseGoogleSheet(url: string): Promise<ReportData> {
  console.log("🔍 Parsing Google Sheets...");

  const sheetId = extractSheetId(url);
  if (!sheetId) {
    throw new Error("Invalid Google Sheets URL");
  }

  console.log(`📊 Sheet ID: ${sheetId}`);

  try {
    // Fetch all three sheets
    console.log("\n📄 Fetching data from sheets:");

    const [liqData, balData, blurbData] = await Promise.all([
      fetchSheetData(sheetId, "Liq"),
      fetchSheetData(sheetId, "Bal"),
      fetchSheetData(sheetId, "Blurb"),
    ]);

    console.log(`✅ Liq: ${liqData.values.length} rows`);
    console.log(`✅ Bal: ${balData.values.length} rows`);
    console.log(`✅ Blurb: ${blurbData.values.length} rows`);

    // Parse each sheet
    const token = parseLiquiditySheet(liqData).token;
    const exchanges = parseLiquiditySheet(liqData).exchanges;
    const balances = parseBalanceSheet(balData);
    const blurbText = parseBlurbSheet(blurbData);

    console.log(
      `\n✅ Parsed: ${token}, ${exchanges.length} exchanges, ${balances.length} balances`,
    );

    const reportData: ReportData = {
      token,
      date: new Date().toISOString().split("T")[0],
      commentary: blurbText,
      balances,
      exchanges,
      prices: {
        open: 0,
        high: 0,
        low: 0,
        close: 0,
      },
      historicalPrices: [],
    };

    return reportData;
  } catch (error) {
    console.error("❌ Error parsing Google Sheets:", error);
    throw error;
  }
}

async function fetchSheetData(sheetId: string, sheetName: string): Promise<SheetData> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}?key=${GOOGLE_API_KEY}`;

  console.log(`  Fetching ${sheetName}...`);

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch ${sheetName}: ${error.error?.message || "Unknown error"}`);
  }

  return await response.json();
}

function parseLiquiditySheet(data: SheetData): { token: string; exchanges: ExchangeData[] } {
  const rows = data.values;

  console.log("\n🏦 Parsing Liq sheet:");

  // Row 0: Token
  const token = rows[0]?.[0]?.trim() || "";
  console.log(`  Token: ${token}`);

  // Row 1: Headers
  const headers = rows[1] || [];
  const colMap: Record<string, number> = {};
  headers.forEach((header, index) => {
    if (header) colMap[header.trim()] = index;
  });

  // Rows 2+: Exchanges
  const exchanges: ExchangeData[] = [];
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
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

    console.log(`  ✓ ${venue}`);
    exchanges.push(exchange);
  }

  return { token, exchanges };
}

function parseBalanceSheet(data: SheetData): Balance[] {
  const rows = data.values;

  console.log("\n💰 Parsing Bal sheet:");

  if (rows.length === 0) {
    console.log("  No balance data");
    return [];
  }

  // Rows without headers - just data
  // Column A: Entity, B: Asset, C: Amount, D: Date
  const balances: Balance[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Column B = Asset (USDT, NEAR, etc)
    const asset = row[1]?.trim();
    if (!asset) continue;

    // Column C = Amount
    const amount = parseNumber(row[2] || "0");

    const balance: Balance = {
      asset,
      price: 0,
      amount,
      notional: 0, // Will be calculated when we have price
    };

    console.log(`  ✓ ${asset}: ${amount} (entity: ${row[0]})`);
    balances.push(balance);
  }

  return balances;
}

function parseBlurbSheet(data: SheetData): string {
  const rows = data.values;

  console.log("\n📝 Parsing Blurb sheet:");

  if (rows.length === 0) {
    console.log("  No blurb data");
    return "";
  }

  // Combine all cells into text
  const text = rows
    .map((row) => row.join(" ").trim())
    .filter((line) => line.length > 0)
    .join("\n");

  console.log(`  ✓ ${text.length} characters`);

  return text;
}
