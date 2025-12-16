// import { useState } from "react";
// import DataInputForm from "../components/DataInputForm";
// import CSVUpload from "../components/CSVUpload";
// import type { ReportData } from "../types";
//
// type TabType = "manual" | "csv";
//
// function HomePage() {
//   const [activeTab, setActiveTab] = useState<TabType>("manual");
//   const [reportData, setReportData] = useState<ReportData | null>(null);
//
//   const handleDataSubmit = (data: ReportData) => {
//     setReportData(data);
//   };
//
//   const handleCSVUpload = (data: ReportData) => {
//     setReportData(data);
//   };
//
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
//       {/* Header */}
//       <header className="bg-white shadow-sm border-b border-gray-200">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//           <h1 className="text-3xl font-bold text-gray-900">
//             JPEG Trading Report Generator
//           </h1>
//           <p className="mt-2 text-sm text-gray-600">
//             Generate professional monthly liquidity reports
//           </p>
//         </div>
//       </header>
//
//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Tabs */}
//         <div className="bg-white rounded-lg shadow-sm mb-6">
//           <div className="border-b border-gray-200">
//             <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
//               <button
//                 onClick={() => setActiveTab("manual")}
//                 className={`${
//                   activeTab === "manual"
//                     ? "border-indigo-500 text-indigo-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
//               >
//                 📝 Manual Input
//               </button>
//               <button
//                 onClick={() => setActiveTab("csv")}
//                 className={`${
//                   activeTab === "csv"
//                     ? "border-indigo-500 text-indigo-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
//               >
//                 📁 CSV Upload
//               </button>
//             </nav>
//           </div>
//
//           {/* Tab Content */}
//           <div className="p-6">
//             {activeTab === "manual" && (
//               <DataInputForm onSubmit={handleDataSubmit} />
//             )}
//             {activeTab === "csv" && <CSVUpload onUpload={handleCSVUpload} />}
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }
//
// export default HomePage;
