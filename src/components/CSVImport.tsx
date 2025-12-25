import { useState } from "react";
import { csvToReportData } from "../utils/csvParser";
import type { ReportData } from "../types";

interface CSVImportProps {
  onSuccess: (data: ReportData) => void;
  onEditInForm?: (data: ReportData) => void;
}

function CSVImport({ onSuccess, onEditInForm }: CSVImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
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
    setLoading(true);

    try {
      const text = await selectedFile.text();
      const parsed = csvToReportData(text, date, commentary);
      setReportData(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV file");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    if (!reportData) return;

    const updatedData: ReportData = {
      ...reportData,
      date,
      commentary,
    };

    onSuccess(updatedData);
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

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Upload CSV File</h3>

        <div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={loading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer disabled:opacity-50"
          />
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
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
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
                onChange={(e) => setCommentary(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter commentary..."
              />
            </div>

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

export default CSVImport;
