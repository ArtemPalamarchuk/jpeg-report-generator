import React from "react";
import type { ReportData } from "../types";
import { images } from "../utils/images-base64";
import { fonts } from "../utils/fonts-base64";

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
  const leftPadding = 70;
  const rightPadding = 40;
  const topPadding = 40;
  const bottomPadding = 40;

  const chartWidth = width - leftPadding - rightPadding;
  const chartHeight = height - topPadding - bottomPadding;

  const priceValues = prices.map((p) => p.price);
  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);
  const priceRange = maxPrice - minPrice || 1;

  const points = prices
    .map((p, i) => {
      const x = leftPadding + (i / (prices.length - 1)) * chartWidth;
      const y = topPadding + chartHeight - ((p.price - minPrice) / priceRange) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  const pathD = `M ${points.replace(/ /g, " L ")}`;
  const areaD = `${pathD} L ${leftPadding + chartWidth},${topPadding + chartHeight} L ${leftPadding},${topPadding + chartHeight} Z`;

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

      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
        <line
          key={`h-${i}`}
          x1={leftPadding}
          y1={topPadding + chartHeight * ratio}
          x2={leftPadding + chartWidth}
          y2={topPadding + chartHeight * ratio}
          stroke="#D1D5DB"
          strokeWidth="1"
        />
      ))}

      {verticalGridPositions.map((ratio, i) => (
        <line
          key={`v-${i}`}
          x1={leftPadding + chartWidth * ratio}
          y1={topPadding}
          x2={leftPadding + chartWidth * ratio}
          y2={topPadding + chartHeight}
          stroke="#D1D5DB"
          strokeWidth="1"
        />
      ))}

      <path d={areaD} fill="url(#chartGradient)" />

      <path
        d={pathD}
        fill="none"
        stroke="#223FFA"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {[0, 0.5, 1].map((ratio, i) => {
        const price = minPrice + priceRange * (1 - ratio);
        return (
          <text
            key={i}
            x={leftPadding - 10}
            y={topPadding + chartHeight * ratio + 5}
            textAnchor="end"
            fontSize="14"
            fontWeight="500"
            fill="#374151"
          >
            ${price.toFixed(3)}
          </text>
        );
      })}

      {verticalGridPositions.map((ratio, i) => {
        const dateIndex = Math.round(ratio * (prices.length - 1));
        const datePoint = prices[dateIndex];
        if (!datePoint) return null;

        return (
          <text
            key={`x-label-${i}`}
            x={leftPadding + chartWidth * ratio}
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
  const totalNotional = data.balances.reduce((sum, b) => sum + b.notional, 0);

  const historicalPrices = data.historicalPrices || [];

  const ohlcPrices =
    historicalPrices.length > 0
      ? {
          open: historicalPrices[0].price,
          close: historicalPrices[historicalPrices.length - 1].price,
          high: Math.max(...historicalPrices.map((p) => p.price)),
          low: Math.min(...historicalPrices.map((p) => p.price)),
        }
      : data.prices;

  const globalAvgLiquidity = data.exchanges.reduce((sum, e) => sum + e.liquidity2pct, 0);
  const jpegAvgLiquidity = data.exchanges.reduce((sum, e) => sum + e.jpegLiquidity2pct, 0);
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
        @font-face {
          font-family: 'Bai Jamjuree';
          src: url('${fonts.light}') format('truetype');
          font-weight: 300;
          font-style: normal;
          font-display: block;
        }
        
        @font-face {
          font-family: 'Bai Jamjuree';
          src: url('${fonts.regular}') format('truetype');
          font-weight: 400;
          font-style: normal;
          font-display: block;
        }
        
        @font-face {
          font-family: 'Bai Jamjuree';
          src: url('${fonts.medium}') format('truetype');
          font-weight: 500;
          font-style: normal;
          font-display: block;
        }
        
        @font-face {
          font-family: 'Bai Jamjuree';
          src: url('${fonts.semibold}') format('truetype');
          font-weight: 600;
          font-style: normal;
          font-display: block;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Bai Jamjuree', Arial, sans-serif;
          background: #f5f5f5;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .report-container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        /* Logo Header */
        .logo-header {
          padding: 18px 36px;
          border-bottom: 1px solid #e0e0e0;
          background: white;
        }
        
        /* Header Section */
        .header-section {
          display: flex;
          gap: 0;
          margin: 120px 36px;
        }
        
        .header-left {
          width: 50%;
          min-height: 420px;
          padding: 40px;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
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
          font-weight: 600;
          font-size: 16px;
          line-height: 20px;
          color: white;
          text-transform: uppercase;
        }
        
        .main-title {
          font-weight: 500;
          font-size: 60px;
          line-height: 90%;
          letter-spacing: -0.08em;
          color: #000000;
        }
        
        .token-name {
          color: #8B9AFD;
        }
        
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
          gap: 50px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .commentary-title {
          font-weight: 500;
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
        
        /* Sections */
        .balances-section,
        .liquidity-statistics,
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
          font-weight: 600;
          font-size: 20px;
          color: black;
        }
        
        .section-title {
          font-weight: 500;
          font-size: 32px;
          text-transform: capitalize;
          color: white;
        }
        
        /* Tables */
        .table-container,
        .exchange-table {
          background: white;
        }
        
        .table-header,
        .exchange-header {
          display: flex;
        }
        
        .table-header-cell,
        .exchange-header-cell {
          flex: 1;
          padding: 20px;
          background: rgba(139, 154, 253, 0.2);
          border: 1px solid #CCCCCC;
          font-weight: 600;
          font-size: 22px;
          line-height: 30px;
          color: black;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .table-row,
        .exchange-row {
          display: flex;
        }
        
        .table-cell,
        .exchange-cell {
          flex: 1;
          padding: 20px;
          border: 1px solid #CCCCCC;
          opacity: 0.6;
          font-weight: 400;
          font-size: 24px;
          line-height: 30px;
          color: black;
        }
        
        .exchange-cell {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .exchange-cell.with-indicator {
          justify-content: space-between;
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
          border: 1px solid #CCCCCC;
          font-weight: 600;
          font-size: 24px;
          color: black;
        }
        
        .table-footer-value {
          flex: 1;
          padding: 20px;
          background: #8B9AFD;
          border: 1px solid #CCCCCC;
          font-weight: 600;
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
        
        .stat-card,
        .price-card {
          display: flex;
          flex-direction: column;
          padding: 20px;
          gap: 100px;
          background: #E8EBFF;
          border: 1px solid rgba(0, 0, 0, 0.2);
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .stat-value {
          font-weight: 600;
          font-size: 28px;
          color: #000;
        }
        
        .price-card .stat-value {
          font-size: 32px;
        }
        
        .stat-label {
          font-weight: 400;
          font-size: 20px;
          color: rgba(0, 0, 0, 0.7);
        }
        
        .price-card .stat-label {
          font-weight: 500;
        }
        
        /* Footer */
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
          font-weight: 500;
        }
        
        /* Print Styles */
        @media print {
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
          }
          
          * {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="logo-header">
        <img src={images.logo} alt="JPEG Trading" />
      </div>

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

          <img src={images.headerDecorativeLines} alt="" className="decorative-lines" />
        </div>
        <div className="header-right">
          <h2 className="commentary-title">Commentary from the JPEG Trading team</h2>
          <p className="commentary-text">{data.commentary}</p>
        </div>
      </div>

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
            <div className="table-footer-cell" style={{ borderRight: "none" }}>
              Sum
            </div>
            <div
              className="table-footer-cell"
              style={{ borderLeft: "none", borderRight: "none" }}
            ></div>
            <div
              className="table-footer-cell"
              style={{ borderLeft: "none", borderRight: "none" }}
            ></div>
            <div className="table-footer-value">{formatCurrency(totalNotional)}</div>
          </div>
        </div>
      </div>

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
            <div className="exchange-header-cell" style={{ letterSpacing: "-0.6px" }}>
              Market Share by Venue
            </div>
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

      <div className="reporting-prices">
        <div className="section-header">
          <div className="section-number">4</div>
          <div className="section-title">Reporting Prices</div>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <div className="price-card">
            <div className="stat-value">{formatPrice(ohlcPrices.open)}</div>
            <div className="stat-label">Open Price</div>
          </div>
          <div className="price-card">
            <div className="stat-value">{formatPrice(ohlcPrices.high)}</div>
            <div className="stat-label">High Price</div>
          </div>
          <div className="price-card">
            <div className="stat-value">{formatPrice(ohlcPrices.low)}</div>
            <div className="stat-label">Low Price</div>
          </div>
          <div className="price-card">
            <div className="stat-value">{formatPrice(ohlcPrices.close)}</div>
            <div className="stat-label">Close Price</div>
          </div>
        </div>

        <div style={{ marginTop: "40px" }}>
          <PriceChart prices={historicalPrices} />
        </div>
      </div>

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
