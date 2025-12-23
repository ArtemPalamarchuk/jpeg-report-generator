import { renderToString } from "react-dom/server";
import React from "react";
import ReportTemplate from "../components/ReportTemplate";
import type { ReportData } from "../types";
import { validateReportData } from "./reportGenerator.ts";

// Generate the print button HTML/JS
const getPrintButtonScript = () => `
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
    'font-family: "Bai Jamjuree", sans-serif;' +
    'font-size: 16px;' +
    'font-weight: 600;' +
    'cursor: pointer;' +
    'box-shadow: 0 4px 12px rgba(139, 154, 253, 0.4);' +
    'z-index: 9999;';
  
  printButton.addEventListener('mouseover', () => { printButton.style.background = '#223FFA';});
  printButton.addEventListener('mouseout', () => { printButton.style.background = '#8B9AFD';});
  printButton.addEventListener('click', () => { window.print();});
  
  document.body.appendChild(printButton);
  
  window.addEventListener('beforeprint', () => { printButton.style.display = 'none';});  
  window.addEventListener('afterprint', () => { printButton.style.display = 'block';});
`;

// Calculate and set dynamic page size based on content height
const getPageSizeScript = () => `
  window.addEventListener('load', () => {
    const container = document.querySelector('.report-container');
    if (!container) return;
    
    let totalHeight = 0;
    const children = container.children;
    
    // Sum up all non-absolute/fixed children heights
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const style = window.getComputedStyle(child);
      
      // Skip absolutely positioned elements
      if (style.position === 'absolute' || style.position === 'fixed') {
        continue;
      }
      
      const rect = child.getBoundingClientRect();
      const marginTop = parseFloat(style.marginTop) || 0;
      const marginBottom = parseFloat(style.marginBottom) || 0;
      
      totalHeight += rect.height + marginTop + marginBottom;
    }
    
    // Convert pixels to mm (rough conversion: 1px ≈ 0.19mm at 96 DPI)
    // Add 10mm buffer to prevent content from being cut off
    const heightMM = Math.ceil(totalHeight * 0.19) + 10;
    
    // Inject print styles with dynamic page size
    const styleElement = document.createElement('style');
    styleElement.textContent = 
      '@media print {' +
      '  @page { size: 210mm ' + heightMM + 'mm; margin: 0; }' +
      '  html, body { height: auto; overflow: visible; font-family: "Bai Jamjuree", sans-serif; }' +
      '  .report-container { max-width: 100%; page-break-after: avoid; }' +
      '}';
    document.head.appendChild(styleElement);
  });
`;

// Build complete HTML document
const buildHTMLDocument = (data: ReportData, contentHTML: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Monthly Liquidity Report - ${data.token} - ${data.date}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <body>
      ${contentHTML}
      
      <script>
        ${getPrintButtonScript()}
        ${getPageSizeScript()}
      </script>
    </body>
    </html>
  `;
};

// Main function to generate and open report
export const generateAndOpenReport = (data: ReportData) => {
  try {
    // Step 1: Validate data
    const errors = validateReportData(data);
    if (errors.length > 0) {
      alert("Validation errors:\n\n" + errors.map((e) => "• " + e).join("\n"));
      return;
    }

    // Step 2: Render React component to HTML string
    const htmlContent = renderToString(React.createElement(ReportTemplate, { data }));

    // Step 3: Build complete HTML document
    const fullHTML = buildHTMLDocument(data, htmlContent);

    // Step 4: Open in new window
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(fullHTML);
      newWindow.document.close();
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
