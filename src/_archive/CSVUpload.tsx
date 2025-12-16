// import { useState } from "react";
// import Papa from "papaparse";
// import type { ReportData } from "../types";
//
// interface CSVUploadProps {
//   onUpload: (data: ReportData) => void;
// }
//
// function CSVUpload({ onUpload }: CSVUploadProps) {
//   const [file, setFile] = useState<File | null>(null);
//   const [error, setError] = useState<string>("");
//   const [isDragging, setIsDragging] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//
//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       setFile(e.target.files[0]);
//       setError("");
//     }
//   };
//
//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     setIsDragging(true);
//   };
//
//   const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     setIsDragging(false);
//   };
//
//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     setIsDragging(false);
//
//     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//       const droppedFile = e.dataTransfer.files[0];
//       if (droppedFile.name.endsWith(".csv")) {
//         setFile(droppedFile);
//         setError("");
//       } else {
//         setError("Please drop a CSV file");
//       }
//     }
//   };
//
//   const handleUpload = () => {
//     if (!file) {
//       setError("Please select a file first");
//       return;
//     }
//
//     setIsProcessing(true);
//     setError("");
//
//     Papa.parse(file, {
//       skipEmptyLines: true,
//       complete: (results) => {
//         try {
//           const rows = results.data as string[][];
//
//           // Знаходимо token (перший непорожній рядок)
//           let token = "PTB";
//           for (const row of rows) {
//             const firstCell = row[0]?.trim();
//             if (
//               firstCell &&
//               firstCell !== "Exchange" &&
//               !firstCell.startsWith("$")
//             ) {
//               token = firstCell;
//               break;
//             }
//           }
//
//           // Парсимо exchanges
//           const exchanges: any[] = [];
//           let foundHeader = false;
//
//           for (const row of rows) {
//             // Шукаємо header row
//             if (row[0] === "Exchange") {
//               foundHeader = true;
//               continue;
//             }
//
//             // Пропускаємо якщо ще не знайшли header
//             if (!foundHeader) continue;
//
//             // Пропускаємо порожні рядки та total rows
//             if (!row[0] || row[0].trim() === "") continue;
//
//             // Функція для очищення чисел
//             const cleanNumber = (val: string) => {
//               if (!val) return 0;
//               return parseFloat(val.replace(/[$,]/g, "")) || 0;
//             };
//
//             const exchange = {
//               venue: row[0]?.trim() || "",
//               symbol: row[1]?.trim() || "",
//               jpegVolume: cleanNumber(row[2]),
//               marketVolume: cleanNumber(row[3]),
//               marketShare: cleanNumber(row[4]),
//               liquidity2pct: cleanNumber(row[5]), // Column F: 2% Liquidity Avg
//               jpegLiquidity2pct: cleanNumber(row[6]), // Column G: 2% Liquidity
//               liquidityShare: cleanNumber(row[7]), // Column H: 2% Share
//               liquidity1pct: cleanNumber(row[8]), // Column I: 1% Liquidity Avg
//               jpegLiquidity1pct: cleanNumber(row[9]), // Column J: 1% Liquidity
//               share1pct: cleanNumber(row[10]), // Column K: 1% Share
//               avgSpread: cleanNumber(row[11]), // Column L: Avg Spread (bps)
//             };
//
//             exchanges.push(exchange);
//           }
//
//           const reportData: ReportData = {
//             token: token,
//             date: new Date().toISOString().split("T")[0],
//             commentary: `Data imported from CSV file for ${token}`,
//             balances: [
//               { asset: token, price: 0, amount: 0, notional: 0 },
//               { asset: "STABLES", price: 1, amount: 0, notional: 0 },
//             ],
//             exchanges: exchanges,
//             prices: { open: 0, high: 0, low: 0, close: 0 },
//             historicalPrices: [],
//           };
//
//           console.log("Parsed data:", reportData);
//           onUpload(reportData);
//           setIsProcessing(false);
//         } catch (err) {
//           setError("Error parsing CSV file: " + (err as Error).message);
//           console.error(err);
//           setIsProcessing(false);
//         }
//       },
//       error: (error) => {
//         setError(`Error reading file: ${error.message}`);
//         setIsProcessing(false);
//       },
//     });
//   };
//
//   return (
//     <div className="space-y-6">
//       <div
//         className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
//           isDragging
//             ? "border-indigo-500 bg-indigo-50"
//             : "border-gray-300 bg-white"
//         }`}
//         onDragOver={handleDragOver}
//         onDragLeave={handleDragLeave}
//         onDrop={handleDrop}
//       >
//         <div className="space-y-4">
//           <div className="flex justify-center">
//             <svg
//               className={`w-16 h-16 transition-colors ${
//                 isDragging ? "text-indigo-500" : "text-gray-400"
//               }`}
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
//               />
//             </svg>
//           </div>
//           <div>
//             <label
//               htmlFor="file-upload"
//               className="cursor-pointer inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
//             >
//               <span>Choose CSV File</span>
//               <input
//                 id="file-upload"
//                 type="file"
//                 accept=".csv"
//                 onChange={handleFileChange}
//                 className="sr-only"
//               />
//             </label>
//           </div>
//           <p className="text-sm text-gray-500">
//             or drag and drop CSV file here
//           </p>
//           {file && (
//             <p className="text-sm text-gray-600">
//               Selected: <span className="font-medium">{file.name}</span>
//             </p>
//           )}
//         </div>
//       </div>
//
//       {error && (
//         <div className="bg-red-50 border border-red-200 rounded-md p-4">
//           <p className="text-sm text-red-600">{error}</p>
//         </div>
//       )}
//
//       {file && (
//         <div className="flex justify-center">
//           <button
//             onClick={handleUpload}
//             disabled={isProcessing}
//             className={`px-6 py-3 font-medium rounded-md transition-colors ${
//               isProcessing
//                 ? "bg-gray-400 cursor-not-allowed"
//                 : "bg-indigo-600 hover:bg-indigo-700"
//             } text-white`}
//           >
//             {isProcessing ? "Processing..." : "Upload and Parse CSV"}
//           </button>
//         </div>
//       )}
//
//       {/* Instructions */}
//       <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
//         <h4 className="text-sm font-medium text-blue-900 mb-2">
//           CSV Format Instructions
//         </h4>
//         <p className="text-sm text-blue-700">
//           Your CSV should contain the following columns: Exchange, Symbol, JPEG
//           Volume, Market Volume, 2% Liquidity, JPEG 2% Liquidity, Avg Spread
//           (bps), and other relevant fields.
//         </p>
//       </div>
//     </div>
//   );
// }
//
// export default CSVUpload;
