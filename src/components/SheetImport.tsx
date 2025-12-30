import { useState } from "react";
import { parseGoogleSheet } from "../utils/sheetParser.ts";
import type { ReportData } from "../types";

interface SheetsImportProps {
  onSuccess: (data: ReportData) => void;
  onEditInForm?: (data: ReportData) => void;
}

function SheetsImport({ onSuccess, onEditInForm }: SheetsImportProps) {
  const [sheetsUrl, setSheetsUrl] = useState<string>("");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleLoadSheet = async () => {
    if (!sheetsUrl.trim()) {
      setError("Please enter a Google Sheets URL");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const parsedReport = await parseGoogleSheet(sheetsUrl);
      setReportData(parsedReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse Google Sheets");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    if (!reportData) return;
    onSuccess(reportData);
  };

  const handleEditInForm = () => {
    if (!reportData || !onEditInForm) return;
    onEditInForm(reportData);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Load from Google Sheets</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Google Sheets URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={sheetsUrl}
              onChange={(e) => setSheetsUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            />
            <button
              onClick={handleLoadSheet}
              disabled={loading || !sheetsUrl.trim()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? "Loading..." : "Load Preview"}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Make sure the spreadsheet is shared with "Anyone with the link"
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {reportData && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-800">
                ✅ Loaded: {reportData.token} • {reportData.exchanges.length} exchanges •{" "}
                {reportData.balances.length} balances
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Date</label>
                <input
                  type="text"
                  value={reportData.date}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Token</label>
                <input
                  type="text"
                  value={reportData.token}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Commentary</label>
              <div className="block w-full px-4 py-3 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-700 break-words leading-relaxed">
                {reportData.commentary}
              </div>
            </div>

            {reportData.balances.length > 0 && (
              <div className="pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Balances</h4>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-1/5">
                          Asset
                        </th>
                        <th className="px-3 py-2 w-1/5"></th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-1/5">
                          Price
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-1/5">
                          Amount
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-1/5">
                          Notional
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.balances.map((balance, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">
                            {balance.asset}
                          </td>
                          <td className="px-3 py-2"></td>
                          <td className="px-3 py-2 text-sm text-right text-gray-900">
                            ${balance.price.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-sm text-right text-gray-900">
                            {balance.amount.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-sm text-right text-gray-900">
                            ${balance.notional.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportData.exchanges.length > 0 && (
              <div className="pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Liquidity Statistics</h4>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-1/5">
                          Exchange
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-1/5">
                          Symbol
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-1/5">
                          2% Liq
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-1/5">
                          JPEG 2% Liq
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-1/5">
                          Liq Share
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.exchanges.map((exchange, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">
                            {exchange.venue}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">{exchange.symbol}</td>
                          <td className="px-3 py-2 text-sm text-right text-gray-900">
                            ${exchange.liquidity2pct.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-sm text-right text-gray-900">
                            ${exchange.jpegLiquidity2pct.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-sm text-right text-gray-600">
                            {exchange.liquidityShare.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportData.exchanges.length > 0 && (
              <div className="pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Volume Statistics</h4>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-1/5">
                          Exchange
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-1/5">
                          Symbol
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-1/5">
                          JPEG Volume
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-1/5">
                          Market Volume
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-1/5">
                          Market Share
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.exchanges.map((exchange, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">
                            {exchange.venue}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">{exchange.symbol}</td>
                          <td className="px-3 py-2 text-sm text-right text-gray-900">
                            ${exchange.jpegVolume.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-sm text-right text-gray-900">
                            ${exchange.marketVolume.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-sm text-right text-gray-600">
                            {exchange.marketShare.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportData.historicalPrices && reportData.historicalPrices.length > 0 && (
              <div className="pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Reporting Prices (OHLC)
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-1">Open</div>
                    <div className="text-lg font-semibold text-gray-900">
                      ${reportData.historicalPrices[0].price.toFixed(3)}
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-1">High</div>
                    <div className="text-lg font-semibold text-gray-900">
                      ${Math.max(...reportData.historicalPrices.map((p) => p.price)).toFixed(3)}
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-1">Low</div>
                    <div className="text-lg font-semibold text-gray-900">
                      ${Math.min(...reportData.historicalPrices.map((p) => p.price)).toFixed(3)}
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-1">Close</div>
                    <div className="text-lg font-semibold text-gray-900">
                      $
                      {reportData.historicalPrices[
                        reportData.historicalPrices.length - 1
                      ].price.toFixed(3)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {onEditInForm && (
                <button
                  onClick={handleEditInForm}
                  className="flex-1 px-6 py-3 bg-white text-indigo-600 font-medium rounded-md border-2 border-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  ✏️ Edit in Form
                </button>
              )}
              <button
                onClick={handleGenerateReport}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Generate PDF Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SheetsImport;
