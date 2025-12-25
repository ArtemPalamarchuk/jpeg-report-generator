import { useState } from "react";
import { csvToReportData } from "../utils/csvParser";
import type { ReportData } from "../types";

interface CSVUploaderProps {
  onSubmit: (data: ReportData) => void;
  onEditInForm?: (data: ReportData) => void;
}

function CSVUploader({ onSubmit, onEditInForm }: CSVUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [commentary, setCommentary] = useState<string>("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a CSV file");
      return;
    }

    setFile(selectedFile);
    setError("");

    try {
      const text = await selectedFile.text();
      const parsed = csvToReportData(text, date, commentary);
      setReportData(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV file");
      setReportData(null);
    }
  };

  const handleGenerateReport = () => {
    if (!reportData) {
      setError("Please upload a CSV file first");
      return;
    }

    const updatedData: ReportData = {
      ...reportData,
      date,
      commentary,
    };

    onSubmit(updatedData);
  };

  const handleEditInForm = () => {
    if (!reportData || !onEditInForm) return;

    const updatedData: ReportData = {
      ...reportData,
      date,
      commentary,
    };

    onEditInForm(updatedData);
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (reportData) {
      setReportData({ ...reportData, date: newDate });
    }
  };

  const handleCommentaryChange = (newCommentary: string) => {
    setCommentary(newCommentary);
    if (reportData) {
      setReportData({ ...reportData, commentary: newCommentary });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h3>
          <div className="flex items-center space-x-4">
            <label className="flex-1">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
            </label>
          </div>

          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: <span className="font-medium">{file.name}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {reportData && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Commentary</label>
              <textarea
                value={commentary}
                onChange={(e) => handleCommentaryChange(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter commentary about market conditions and strategy..."
              />
            </div>
          </div>
        )}
      </div>

      {reportData && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Data Preview ({reportData.exchanges.length} exchanges)
          </h3>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exchange
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    JPEG Volume
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Market Volume
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Market Share
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    2% Liquidity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Spread
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.exchanges.map((exchange, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {exchange.venue}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {exchange.symbol}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      ${exchange.jpegVolume.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      ${exchange.marketVolume.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                      {exchange.marketShare > 0 ? `${exchange.marketShare.toFixed(2)}%` : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      ${exchange.liquidity2pct.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                      {exchange.avgSpread > 0 ? exchange.avgSpread.toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-4">
            {onEditInForm && (
              <button
                onClick={handleEditInForm}
                className="px-6 py-3 bg-white text-indigo-600 font-medium rounded-md border-2 border-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                ✏️ Edit in Form
              </button>
            )}
            <button
              onClick={handleGenerateReport}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors shadow-sm ml-auto"
            >
              Generate PDF Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CSVUploader;
