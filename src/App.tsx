import { useState } from "react";
import DataInputForm from "./components/DataInputForm";
import CSVUploader from "./components/CSVUploader";
import { generateAndOpenReport } from "./utils/reportGenerator";
import type { ReportData } from "./types";

type TabType = "manual" | "csv";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("manual");

  const handleGenerateReport = (data: ReportData) => {
    generateAndOpenReport(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-8 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">
            Monthly Liquidity Report Generator
          </h1>
          <p className="text-indigo-100">
            Create professional PDF reports for your trading data
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === "manual"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📝 Manual Input
          </button>
          <button
            onClick={() => setActiveTab("csv")}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === "csv"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📄 CSV Upload
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {activeTab === "manual" ? (
            <DataInputForm onSubmit={handleGenerateReport} />
          ) : (
            <CSVUploader onSubmit={handleGenerateReport} />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-4 py-6 mt-8">
        <div className="text-center text-gray-500 text-sm">
          <p>Powered by JPEG Trading Team</p>
        </div>
      </div>
    </div>
  );
}

export default App;
