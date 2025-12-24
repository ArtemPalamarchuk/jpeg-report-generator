import React from "react";
import type { ReportData } from "../types";
import { images } from "../utils/images-base64";

interface ReportTemplateProps {
  data: ReportData;
}

const CircularProgress = ({ percentage }: { percentage: number }) => {
  const size = 56;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="circular-progress" style={{ width: `${size}px`, height: `${size}px` }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="circular-progress-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          style={{
            fill: "none",
            stroke: "#C5CEFF",
            strokeWidth: strokeWidth,
          }}
        />
        <circle
          className="circular-progress-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          style={{
            fill: "none",
            stroke: "#6B7FFF",
            strokeWidth: strokeWidth,
            strokeLinecap: "round",
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
            transition: "stroke-dashoffset 0.3s ease",
          }}
        />
      </svg>
    </div>
  );
};

const PriceChart = ({ prices }: { prices: Array<{ date: string; price: number }> }) => {
  if (!prices || prices.length === 0) return null;

  const width = 1130;
  const height = 400;
  const padding = 40;

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const priceValues = prices.map((p) => p.price);
  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);
  const priceRange = maxPrice - minPrice || 1;

  // Create path for line chart
  const points = prices
    .map((p, i) => {
      const x = padding + (i / (prices.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((p.price - minPrice) / priceRange) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  const pathD = `M ${points.replace(/ /g, " L ")}`;

  // Create gradient fill area
  const areaD = `${pathD} L ${padding + chartWidth},${padding + chartHeight} L ${padding},${padding + chartHeight} Z`;

  // Calculate vertical grid line positions (about 4-5 vertical lines)
  const verticalGridCount = 4;
  const verticalGridPositions = Array.from(
    { length: verticalGridCount + 1 },
    (_, i) => i / verticalGridCount,
  );

  return (
    <svg width={width} height={height} style={{ display: "block", margin: "0 auto" }}>
      <defs>
        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#8B9AFD", stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: "#8B9AFD", stopOpacity: 0 }} />
        </linearGradient>
      </defs>

      {/* Horizontal grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
        <line
          key={`h-${i}`}
          x1={padding}
          y1={padding + chartHeight * ratio}
          x2={padding + chartWidth}
          y2={padding + chartHeight * ratio}
          stroke="#D1D5DB"
          strokeWidth="1"
        />
      ))}

      {/* Vertical grid lines */}
      {verticalGridPositions.map((ratio, i) => (
        <line
          key={`v-${i}`}
          x1={padding + chartWidth * ratio}
          y1={padding}
          x2={padding + chartWidth * ratio}
          y2={padding + chartHeight}
          stroke="#D1D5DB"
          strokeWidth="1"
        />
      ))}

      {/* Area fill */}
      <path d={areaD} fill="url(#chartGradient)" />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke="#223FFA"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Y-axis labels - larger and darker */}
      {[0, 0.5, 1].map((ratio, i) => {
        const price = minPrice + priceRange * (1 - ratio);
        return (
          <text
            key={i}
            x={padding - 10}
            y={padding + chartHeight * ratio + 5}
            textAnchor="end"
            fontSize="14"
            fontWeight="500"
            fill="#374151"
          >
            ${price.toFixed(3)}
          </text>
        );
      })}

      {/* X-axis labels - larger and darker, more labels */}
      {verticalGridPositions.map((ratio, i) => {
        const dateIndex = Math.round(ratio * (prices.length - 1));
        const datePoint = prices[dateIndex];
        if (!datePoint) return null;

        return (
          <text
            key={`x-label-${i}`}
            x={padding + chartWidth * ratio}
            y={height - 10}
            textAnchor="middle"
            fontSize="14"
            fontWeight="500"
            fill="#374151"
          >
            {new Date(datePoint.date).toLocaleDateString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
            })}
          </text>
        );
      })}
    </svg>
  );
};

const ReportTemplate: React.FC<ReportTemplateProps> = ({ data }) => {
  // Calculate totals
  const totalNotional = data.balances.reduce((sum, b) => sum + b.notional, 0);

  // Generate historical prices from OHLC if not provided
  const getHistoricalPrices = () => {
    if (data.historicalPrices && data.historicalPrices.length > 0) {
      return data.historicalPrices;
    }

    // Auto-generate simple price chart from OHLC data
    // Create interpolated points from start to end date
    const startDate = new Date(data.date);
    const endDate = new Date(data.date);

    // Assume the report covers the previous month
    startDate.setMonth(startDate.getMonth() - 1);

    const points: Array<{ date: string; price: number }> = [];
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Generate points with realistic price movement (deterministic)
    for (let i = 0; i <= Math.min(daysDiff, 30); i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      // Interpolate price between open and close with some variation
      const progress = i / Math.min(daysDiff, 30);
      const basePrice = data.prices.open + (data.prices.close - data.prices.open) * progress;

      // Add some realistic variation using high/low bounds (deterministic using sin wave)
      const range = data.prices.high - data.prices.low;
      // Use multiple sine waves with different frequencies for more realistic variation
      const variation =
        (Math.sin(i * 0.5) * 0.3 + Math.sin(i * 0.3) * 0.2 + Math.cos(i * 0.7) * 0.15) *
        range *
        0.3;
      const price = Math.max(data.prices.low, Math.min(data.prices.high, basePrice + variation));

      points.push({
        date: currentDate.toISOString().split("T")[0],
        price: parseFloat(price.toFixed(6)),
      });
    }

    return points;
  };

  const historicalPrices = getHistoricalPrices();

  // Calculate summary statistics
  const globalAvgLiquidity =
    data.exchanges.reduce((sum, e) => sum + e.liquidity2pct, 0) / data.exchanges.length;
  const jpegAvgLiquidity =
    data.exchanges.reduce((sum, e) => sum + e.jpegLiquidity2pct, 0) / data.exchanges.length;
  const jpegLiquidityShare =
    globalAvgLiquidity > 0 ? (jpegAvgLiquidity / globalAvgLiquidity) * 100 : 0;

  const globalTotalVolume = data.exchanges.reduce((sum, e) => sum + e.marketVolume, 0);
  const jpegTotalVolume = data.exchanges.reduce((sum, e) => sum + e.jpegVolume, 0);
  const jpegMarketShare = globalTotalVolume > 0 ? (jpegTotalVolume / globalTotalVolume) * 100 : 0;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(Math.round(num));
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPrice = (num: number) => {
    if (num >= 1) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 3,
      }).format(num);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 3,
      maximumFractionDigits: 6,
    }).format(num);
  };

  return (
    <div className="report-container">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Bai Jamjuree', sans-serif;
          background: #f5f5f5;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color-adjust: exact;
        }
        
        .report-container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          position: relative;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        /* Logo Header */
        .logo-header {
          padding: 18px 36px;
          border-bottom: 1px solid #e0e0e0;
          position: relative;
          z-index: 1;
          background: white;
        }
        
        /* Header Section */
        .header-section {
          display: flex;
          justify-content: space-between;
          gap: 0;
          margin: 120px 36px;
          position: relative;
          z-index: 1;
        }
        
        .header-left {
          width: 50%;
          min-height: 420px;
          padding: 40px;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.2);
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .date-badge {
          width: 171px;
          padding: 20px;
          background: #8B9AFD;
          text-align: center;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .date-text {
          font-weight: 700;
          font-size: 16px;
          line-height: 20px;
          color: white;
          text-transform: uppercase;
        }
        
        .main-title {
          width: 100%;
          font-weight: 500;
          font-size: 60px;
          line-height: 90%;
          letter-spacing: -0.08em;
          color: #000000;
        }
        
        .token-name {
          color: #8B9AFD;
        }
        
        /* Decorative elements */
        .decorative-lines {
          position: absolute;
          right: 0;
          top: 0;
          width: 300px;
          height: 300px;
          pointer-events: none;
        }
        
        .header-right {
          width: 50%;
          min-height: 420px;
          padding: 40px;
          background: #8B9AFD;
          display: flex;
          flex-direction: column;
          justify-content: between;
          gap: 50px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .commentary-title {
          font-weight: 600;
          font-size: 32px;
          line-height: 40px;
          color: white;
        }
        
        .commentary-text {
          font-weight: 300;
          font-size: 18px;
          line-height: 22px;
          color: white;
        }
        
        .balances-section {
          padding: 0 36px;
          margin-bottom: 120px;
        }
        
        .liquidity-statistics {
          padding: 0 36px;
          margin-bottom: 120px;
        }
        
        .volume-statistics {
          padding: 0 36px;
          margin-bottom: 120px;
        }
        
        .reporting-prices {
          padding: 0 36px 60px 36px;
        }
        
        /* Section Headers */
        .section-header {
          display: flex;
          align-items: center;
          padding: 20px;
          gap: 16px;
          background: linear-gradient(90deg, #8B9AFD 0%, #FFFFFF 100%);
          margin-bottom: 20px;
          position: relative;
          z-index: 1;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .section-number {
          width: 49px;
          height: 49px;
          background: white;
          border-radius: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 20px;
          line-height: 85%;
          letter-spacing: -0.08em;
          color: black;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .section-title {
          font-weight: 600;
          font-size: 32px;
          line-height: 120%;
          letter-spacing: -0.02em;
          text-transform: capitalize;
          color: white;
        }
        
        /* Tables */
        .table-container {
          background: white;
          position: relative;
          z-index: 1;
        }
        
        .table-header {
          display: flex;
          border-bottom: 1px solid #CCCCCC;
        }
        
        .table-header-cell {
          flex: 1;
          padding: 20px;
          background: rgba(139, 154, 253, 0.2);
          border: 1px solid #CCCCCC;
          font-weight: 700;
          font-size: 24px;
          line-height: 30px;
          color: black;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .table-row {
          display: flex;
        }
        
        .table-cell {
          flex: 1;
          padding: 20px;
          border: 1px solid #CCCCCC;
          font-weight: 400;
          font-size: 24px;
          line-height: 30px;
          color: black;
        }
        
        .table-cell.right {
          text-align: right;
        }
        
        .table-footer {
          display: flex;
        }
        
        .table-footer-cell {
          flex: 1;
          padding: 20px;
          border-top: 1px solid #CCCCCC;
          border-bottom: 1px solid #CCCCCC;
          font-weight: 700;
          font-size: 24px;
          color: black;
        }
        
        .table-footer-cell:first-child {
          border-left: 1px solid #CCCCCC;
        }
        
        .table-footer-value {
          border-right: 1px solid #CCCCCC;
        }
        
        .table-footer-value {
          flex: 1;
          padding: 20px;
          background: #8B9AFD;
          font-weight: 700;
          font-size: 24px;
          color: white;
          text-align: right;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        /* Statistics Cards */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .stat-card {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 20px;
          gap: 100px;
          background: #E8EBFF;
          border: 1px solid rgba(0, 0, 0, 0.2);
          position: relative;
          z-index: 1;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        /* Price Cards (OHLC) - different styling */
        .price-card {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 20px;
          gap: 100px;
          background: #E8EBFF;
          border: 1px solid rgba(0, 0, 0, 0.2);
          position: relative;
          z-index: 1;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .price-card .stat-value {
          font-weight: 700;
          font-size: 32px;
          line-height: 40px;
          color: #000;
          margin-bottom: 0;
        }
        
        .price-card .stat-label {
          font-weight: 500;
          font-size: 20px;
          line-height: 25px;
          letter-spacing: -0.04em;
          color: rgba(0, 0, 0, 0.7);
        }
        
        .stat-value {
          font-weight: 700;
          font-size: 28px;
          line-height: 1;
          color: #000;
          margin-bottom: 8px;
        }
        
        .stat-label {
          font-family: 'Bai Jamjuree', sans-serif;
          font-weight: 400;
          font-size: 20px;
          color: #666;
        }
        
        /* Exchange Table - same style as Balances table */
        .exchange-table {
          background: white;
          position: relative;
          z-index: 1;
        }
        
        .exchange-header {
          display: flex;
          border-bottom: 1px solid #CCCCCC;
        }
        
        .exchange-header-cell {
          flex: 1;
          padding: 24px 20px;
          background: rgba(139, 154, 253, 0.2);
          border: 1px solid #CCCCCC;
          font-weight: 700;
          font-size: 24px;
          line-height: 30px;
          color: black;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .exchange-row {
          display: flex;
          border-bottom: 1px solid #CCCCCC;
        }
        
        .exchange-cell {
          flex: 1;
          padding: 24px 20px;
          border: 1px solid #CCCCCC;
          font-weight: 400;
          font-size: 24px;
          line-height: 30px;
          color: black;
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .exchange-cell.with-indicator {
          justify-content: space-between;
        }
        
        .exchange-cell span {
          margin-left: auto; 
        }
        
        /* Circular Progress Indicator */
        .circular-progress {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .progress-bar {
          width: 80px;
          height: 8px;
          background: #E5E7EB;
          border-radius: 4px;
          overflow: hidden;
          position: relative;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #8B9AFD 0%, #223FFA 100%);
          border-radius: 4px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        /* Background decorations */
        .section-bg-decoration {
          position: absolute;
          width: 100%;
          height: 433px;
          left: 0;
          pointer-events: none;
          opacity: 0.5;
          z-index: -1;
        }
        
        .section-wrapper {
          position: relative;
        }
        
        .footer-center {
          height: 62px;
          margin-top: -62px;
          gap: 32px;
          background-color: white;
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          border: 1px solid #ccc;
          border-bottom: 0;
        }
        
        .footer-text {
          text-transform: uppercase;
          margin-top: auto; 
          margin-bottom: 4px;
          font-size: 18px;
          font-weight: 600;
        }
        
        /* Print Styles with Page Break Control */
        @media print {
          /* Dynamic @page size will be injected by JavaScript */
          html,
          body {
            height: auto;
            overflow: visible;
            margin: 0;
            padding: 0;
            background: white;
          }
        
          .report-container {
            max-width: 100%;
            margin: 0 auto;
            page-break-after: avoid;
          }
          
          /* Keep everything on one page */
          * {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      {/* Logo */}
      <div className="logo-header">
        <img src={images.logo} alt="JPEG Trading" />
      </div>

      {/* Header */}
      <div className="header-section">
        <div className="header-left">
          <div className="date-badge">
            <div className="date-text">
              {new Date(data.date).toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              })}
            </div>
          </div>

          <h1 className="main-title">
            Monthly Liquidity Report for <span className="token-name">{data.token}</span>
          </h1>

          {/* Decorative lines SVG */}
          <img src={images.headerDecorativeLines} alt="" className="decorative-lines" />
        </div>
        <div className="header-right">
          <h2 className="commentary-title">Commentary from the JPEG Trading team</h2>
          <p className="commentary-text">{data.commentary}</p>
        </div>
      </div>

      {/* Balances */}
      <div className="balances-section">
        <div className="section-header">
          <div className="section-number">1</div>
          <div className="section-title">Balances</div>
        </div>

        <div className="table-container">
          <div className="table-header">
            <div className="table-header-cell">Asset</div>
            <div className="table-header-cell">Price</div>
            <div className="table-header-cell">Amount</div>
            <div className="table-header-cell right">Notional</div>
          </div>

          {data.balances.map((balance, idx) => (
            <div key={idx} className="table-row">
              <div className="table-cell">{balance.asset}</div>
              <div className="table-cell">{formatPrice(balance.price)}</div>
              <div className="table-cell">{formatNumber(balance.amount)}</div>
              <div className="table-cell right">{formatCurrency(balance.notional)}</div>
            </div>
          ))}

          <div className="table-footer">
            <div className="table-footer-cell">Sum</div>
            <div className="table-footer-cell"></div>
            <div className="table-footer-cell"></div>
            <div className="table-footer-value">{formatCurrency(totalNotional)}</div>
          </div>
        </div>
      </div>

      {/* Liquidity Statistics */}
      <div className="liquidity-statistics">
        <div className="section-header">
          <div className="section-number">2</div>
          <div className="section-title">Liquidity Statistics</div>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{formatCurrency(globalAvgLiquidity)}</div>
            <div className="stat-label">Global Avg. Liquidity</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatCurrency(jpegAvgLiquidity)}</div>
            <div className="stat-label">JPEG Avg. Liquidity</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{jpegLiquidityShare.toFixed(2)}%</div>
            <div className="stat-label">JPEG Liquidity Share</div>
          </div>
        </div>
        <div className="exchange-table">
          <div className="exchange-header">
            <div className="exchange-header-cell">Venue</div>
            <div className="exchange-header-cell">2% Liquidity</div>
            <div className="exchange-header-cell">JPEG 2% Liquidity</div>
            <div className="exchange-header-cell">JPEG % of Liquidity</div>
          </div>

          {data.exchanges.map((exchange, idx) => (
            <div key={idx} className="exchange-row">
              <div className="exchange-cell">{exchange.venue}</div>
              <div className="exchange-cell">{formatCurrency(exchange.liquidity2pct)}</div>
              <div className="exchange-cell">{formatCurrency(exchange.jpegLiquidity2pct)}</div>
              <div className="exchange-cell with-indicator">
                <span>{exchange.liquidityShare.toFixed(2)}%</span>
                <CircularProgress percentage={exchange.liquidityShare} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Volume Statistics */}
      <div className="volume-statistics">
        <div className="section-header">
          <div className="section-number">3</div>
          <div className="section-title">Volume Statistics</div>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{formatCurrency(globalTotalVolume)}</div>
            <div className="stat-label">Global Total Volume</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatCurrency(jpegTotalVolume)}</div>
            <div className="stat-label">JPEG Total Volume</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{jpegMarketShare.toFixed(2)}%</div>
            <div className="stat-label">JPEG Market Share</div>
          </div>
        </div>
        <div className="exchange-table">
          <div className="exchange-header">
            <div className="exchange-header-cell">Venue</div>
            <div className="exchange-header-cell">Venue Volume</div>
            <div className="exchange-header-cell">JPEG Volume</div>
            <div className="exchange-header-cell">Market Share by Venue</div>
          </div>

          {data.exchanges.map((exchange, idx) => (
            <div key={idx} className="exchange-row">
              <div className="exchange-cell">{exchange.venue}</div>
              <div className="exchange-cell">{formatCurrency(exchange.marketVolume)}</div>
              <div className="exchange-cell">{formatCurrency(exchange.jpegVolume)}</div>
              <div className="exchange-cell with-indicator">
                <span>{exchange.marketShare.toFixed(2)}%</span>
                <CircularProgress percentage={exchange.marketShare} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reporting Prices */}
      <div className="reporting-prices">
        <div className="section-header">
          <div className="section-number">4</div>
          <div className="section-title">Reporting Prices</div>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <div className="price-card">
            <div className="stat-value">{formatPrice(data.prices.open)}</div>
            <div className="stat-label">Open Price</div>
          </div>
          <div className="price-card">
            <div className="stat-value">{formatPrice(data.prices.high)}</div>
            <div className="stat-label">High Price</div>
          </div>
          <div className="price-card">
            <div className="stat-value">{formatPrice(data.prices.low)}</div>
            <div className="stat-label">Low Price</div>
          </div>
          <div className="price-card">
            <div className="stat-value">{formatPrice(data.prices.close)}</div>
            <div className="stat-label">Close Price</div>
          </div>
        </div>

        {/* Price Chart */}
        <div style={{ marginTop: "40px" }}>
          <PriceChart prices={historicalPrices} />
        </div>
      </div>

      {/* Footer */}
      <img
        src={images.logoFooter}
        alt=""
        style={{
          width: "100%",
          display: "block",
          position: "relative",
        }}
      />
      <div className="footer-center">
        <div style={{ width: "1px", height: "100%", backgroundColor: "#CCCCCC" }} />
        <span className="footer-text">© 2025 JPEG Trading. All rights reserved.</span>
        <div style={{ width: "1px", height: "100%", backgroundColor: "#CCCCCC" }} />
      </div>
    </div>
  );
};

export default ReportTemplate;
