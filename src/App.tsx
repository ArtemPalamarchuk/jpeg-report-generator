import { useState } from "react";
import CSVUploader from "./components/CSVUploader";
import DataInputForm from "./components/DataInputForm";
import { generateAndOpenReport } from "./utils/reportGenerator.ts";
import type { ReportData } from "./types";

type ViewMode = "csv" | "form";

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("csv");
  const [formData, setFormData] = useState<ReportData | undefined>(undefined);

  const handleCSVToForm = (data: ReportData) => {
    setFormData(data);
    setViewMode("form");
  };

  const handleGenerateReport = async (data: ReportData) => {
    await generateAndOpenReport(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Market Report Generator</h1>
          <p className="text-gray-600">Upload CSV data or fill the form manually</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setViewMode("csv")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                viewMode === "csv"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📤 Upload CSV
            </button>
            <button
              onClick={() => setViewMode("form")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                viewMode === "form"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              ✏️ Manual Input
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {viewMode === "csv" ? (
            <CSVUploader onSubmit={handleGenerateReport} onEditInForm={handleCSVToForm} />
          ) : (
            <DataInputForm onSubmit={handleGenerateReport} initialData={formData} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
