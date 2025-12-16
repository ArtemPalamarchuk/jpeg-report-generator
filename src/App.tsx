import DataInputForm from "./components/DataInputForm";
import { generateAndOpenReport } from "./utils/reportGenerator";
import type { ReportData } from "./types";

function App() {
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

      {/* Main Form */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <DataInputForm onSubmit={handleGenerateReport} />
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
