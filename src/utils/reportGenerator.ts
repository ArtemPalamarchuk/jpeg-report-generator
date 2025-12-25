import { renderToString } from "react-dom/server";
import React from "react";
import ReportTemplate from "../components/ReportTemplate";
import type { ReportData } from "../types";

export const generateAndOpenReport = (data: ReportData) => {
  try {
    const htmlContent = renderToString(React.createElement(ReportTemplate, { data }));

    const fullHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Monthly Liquidity Report - ${data.token} - ${data.date}</title>
      <style>
        body {
          font-family: 'Bai Jamjuree', Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
      </style>
    </head>
    <body>
      ${htmlContent}
      
      <script>
        const printButton = document.createElement('button');
        printButton.textContent = '🖨️ Print / Save as PDF';
        printButton.style.cssText = 
          'position: fixed;' +
          'top: 20px;' +
          'right: 20px;' +
          'padding: 12px 24px;' +
          'background: #8B9AFD;' +
          'color: white;' +
          'border: none;' +
          'border-radius: 8px;' +
          'font-family: \\'Bai Jamjuree\\', Arial, sans-serif;' +
          'font-size: 16px;' +
          'font-weight: 600;' +
          'cursor: pointer;' +
          'box-shadow: 0 4px 12px rgba(139, 154, 253, 0.4);' +
          'z-index: 9999;';
        
        printButton.addEventListener('mouseover', () => {
          printButton.style.background = '#223FFA';
        });
        
        printButton.addEventListener('mouseout', () => {
          printButton.style.background = '#8B9AFD';
        });
        
        printButton.addEventListener('click', () => {
          window.print();
        });
        
        document.body.appendChild(printButton);
        
        window.addEventListener('beforeprint', () => {
          printButton.style.display = 'none';
        });
        
        window.addEventListener('afterprint', () => {
          printButton.style.display = 'block';
        });
        
        window.addEventListener('load', () => {
          const container = document.querySelector(".report-container");
          if (!container) return;

          const totalHeightPx = container.getBoundingClientRect().height;
          const COMPRESSION_FACTOR = 0.69; 
          const PX_TO_MM = 0.2646;

          const adjustedHeightPx = totalHeightPx * COMPRESSION_FACTOR;
          const heightMm = Math.ceil(adjustedHeightPx * PX_TO_MM);
          
          console.log('Original:', totalHeightPx, 'px');
          console.log('Adjusted:', adjustedHeightPx, 'px');
          console.log('Final:', heightMm, 'mm');
          
          const styleElement = document.createElement('style');
          styleElement.textContent = 
            '@media print {' +
            '  @page { size: 210mm ' + heightMm + 'mm; margin: 0; }' +
            '  html, body { margin: 0; padding: 0; }' +
            '  .report-container { margin: 0; padding: 0; }' +
            '}';
          document.head.appendChild(styleElement);
        });
      </script>
    </body>
    </html>
  `;

    const newWindow = window.open("", "_blank");
    if (newWindow) {
      const blob = new Blob([fullHTML], { type: "text/html" });
      const blobUrl = URL.createObjectURL(blob);
      newWindow.location.href = blobUrl;
    } else {
      alert(
        "Please allow pop-ups to view the report.\n\nAlternatively, try using the 'Download HTML' option.",
      );
    }
  } catch (error) {
    console.error("Failed to generate report:", error);
    alert(
      "Failed to generate report. Please check your data and try again.\n\nError: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }
};
