import { renderToString } from "react-dom/server";
import React from "react";
import ReportTemplate from "../components/ReportTemplate";
import type { ReportData } from "../types";

// Validate report data before generation
const validateReportData = (data: ReportData): string[] => {
  const errors: string[] = [];

  if (!data.token) errors.push("Token name is required");
  if (!data.date) errors.push("Report date is required");

  // Validate balances
  data.balances?.forEach((balance, idx) => {
    if (balance.notional < 0) {
      errors.push(`Balance #${idx + 1}: Notional value cannot be negative`);
    }
    if (balance.price < 0) {
      errors.push(`Balance #${idx + 1}: Price cannot be negative`);
    }
  });

  // Validate exchanges
  data.exchanges?.forEach((exchange, idx) => {
    if (!exchange.venue) {
      errors.push(`Exchange #${idx + 1}: Venue name is required`);
    }
    if (exchange.marketVolume < 0) {
      errors.push(`Exchange #${idx + 1}: Market volume cannot be negative`);
    }
    if (exchange.jpegVolume < 0) {
      errors.push(`Exchange #${idx + 1}: JPEG volume cannot be negative`);
    }
    if (exchange.marketShare < 0 || exchange.marketShare > 200) {
      errors.push(
        `Exchange #${idx + 1}: Market share must be between 0% and 200%`,
      );
    }
  });

  return errors;
};

export const generateAndOpenReport = (data: ReportData) => {
  try {
    // Validate data first
    const errors = validateReportData(data);
    if (errors.length > 0) {
      alert("Validation errors:\n\n" + errors.map((e) => "• " + e).join("\n"));
      return;
    }

    // Render React component to HTML string
    const htmlContent = renderToString(
      React.createElement(ReportTemplate, { data }),
    );

    // Create complete HTML document
    const fullHTML = `
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
      ${htmlContent}
      
      <script>
        // Print button
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
          const container = document.querySelector('.report-container');
          if (!container) return;
          
          let totalHeight = 0;
          const children = container.children;
          
          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const style = window.getComputedStyle(child);
            
            if (style.position === 'absolute' || style.position === 'fixed') {
              continue;
            }
            
            const rect = child.getBoundingClientRect();
            const marginTop = parseFloat(style.marginTop) || 0;
            const marginBottom = parseFloat(style.marginBottom) || 0;
            
            totalHeight += rect.height + marginTop + marginBottom;
          }
          
          const heightMM = Math.ceil(totalHeight * 0.19) + 10;
          
          const styleElement = document.createElement('style');
          styleElement.textContent = 
            '@media print {' +
            '  @page { size: 210mm ' + heightMM + 'mm; margin: 0; }' +
            '  html, body { height: auto; overflow: visible; font-family: "Bai Jamjuree", sans-serif; }' +
            '  .report-container { max-width: 100%; page-break-after: avoid; }' +
            '}';
          document.head.appendChild(styleElement);
        });
      </script>
    </body>
    </html>
  `;

    // Open in new window
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

// Alternative: Download as HTML file
export const downloadReportHTML = (data: ReportData) => {
  const htmlContent = renderToString(
    React.createElement(ReportTemplate, { data }),
  );

  const fullHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Monthly Liquidity Report - ${data.token} - ${data.date}</title>
      <link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;

  const blob = new Blob([fullHTML], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `liquidity-report-${data.token}-${data.date}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
