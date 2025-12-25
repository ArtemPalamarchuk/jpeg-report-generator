import { useState } from "react";
import CSVImport from "./components/CSVImport";
import SheetsImport from "./components/SheetImport.tsx";
import DataInputForm from "./components/DataInputForm";
import { generateAndOpenReport } from "./utils/reportGenerator.ts";
import type { ReportData } from "./types";

type TabMode = "sheets" | "csv" | "form";

function App() {
  const [activeTab, setActiveTab] = useState<TabMode>("sheets");
  const [formData, setFormData] = useState<ReportData | undefined>(undefined);

  const handleLoadToForm = (data: ReportData) => {
    setFormData(data);
    setActiveTab("form");
  };

  const handleGenerateReport = async (data: ReportData) => {
    await generateAndOpenReport(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Market Report Generator</h1>
          <p className="text-gray-600">Import data from CSV, Google Sheets, or enter manually</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("sheets")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "sheets"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              🔗 Google Sheets
            </button>
            {/*<button*/}
            {/*  onClick={() => setActiveTab("csv")}*/}
            {/*  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${*/}
            {/*    activeTab === "csv"*/}
            {/*      ? "border-indigo-600 text-indigo-600"*/}
            {/*      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"*/}
            {/*  }`}*/}
            {/*>*/}
            {/*  📤 Upload CSV*/}
            {/*</button>*/}
            <button
              onClick={() => setActiveTab("form")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "form"
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
          {activeTab === "sheets" && (
            <SheetsImport onSuccess={handleGenerateReport} onEditInForm={handleLoadToForm} />
          )}
          {activeTab === "csv" && (
            <CSVImport onSuccess={handleGenerateReport} onEditInForm={handleLoadToForm} />
          )}
          {activeTab === "form" && (
            <DataInputForm onSubmit={handleGenerateReport} initialData={formData} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
