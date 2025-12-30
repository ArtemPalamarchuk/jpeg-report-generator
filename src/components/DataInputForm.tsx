import { FormEvent, useState } from "react";
import type { ReportData, ExchangeData, Balance } from "../types.ts";
import { emptyReportData } from "../data/sampleData";

interface DataInputFormProps {
  onSubmit: (data: ReportData) => void;
  initialData?: ReportData;
}

function DataInputForm({ onSubmit, initialData }: DataInputFormProps) {
  const [formData, setFormData] = useState<ReportData>(initialData || emptyReportData);

  const handleNumericInput = (value: string): string => {
    const normalized = value.replace(",", ".");
    if (/^\d*\.?\d*$/.test(normalized) || normalized === "") {
      return normalized;
    }
    return value;
  };

  const formatNumericValue = (value: string): string => {
    if (value && !isNaN(parseFloat(value))) {
      return parseFloat(value).toString();
    }
    return value;
  };

  const handleNumericChange = (index: number, field: "price" | "amount", value: string) => {
    const normalized = handleNumericInput(value);
    updateBalance(index, field, normalized);
  };

  const handleExchangeNumericChange = (
    index: number,
    field: "liquidity2pct" | "jpegLiquidity2pct" | "marketVolume" | "jpegVolume",
    value: string,
  ) => {
    const normalized = handleNumericInput(value);
    updateExchange(index, field, normalized);
  };

  const handlePriceChange = (field: "open" | "high" | "low" | "close", value: string) => {
    const normalized = handleNumericInput(value);
    setFormData({
      ...formData,
      prices: {
        ...formData.prices,
        [field]: normalized,
      },
    });
  };

  const parseNumericField = (value: string | number): number => {
    return typeof value === "string" ? parseFloat(value) || 0 : value;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.token && formData.date) {
      onSubmit({
        ...formData,
        balances: formData.balances?.map((b) => ({
          asset: b.asset,
          price: parseNumericField(b.price),
          amount: parseNumericField(b.amount),
          notional: b.notional,
        })),
        exchanges: formData.exchanges?.map((e) => ({
          venue: e.venue,
          symbol: e.symbol,
          liquidity2pct: parseNumericField(e.liquidity2pct),
          jpegLiquidity2pct: parseNumericField(e.jpegLiquidity2pct),
          marketVolume: parseNumericField(e.marketVolume),
          jpegVolume: parseNumericField(e.jpegVolume),
          marketShare: e.marketShare,
          liquidityShare: e.liquidityShare,
          avgSpread: e.avgSpread,
        })),
        prices: formData.prices
          ? {
              open: parseNumericField(formData.prices.open),
              high: parseNumericField(formData.prices.high),
              low: parseNumericField(formData.prices.low),
              close: parseNumericField(formData.prices.close),
            }
          : { open: 0, high: 0, low: 0, close: 0 },
      });
    }
  };

  const updateBalance = (index: number, field: keyof Balance, value: string | number) => {
    const newBalances = [...(formData.balances || [])];
    newBalances[index] = {
      ...newBalances[index],
      [field]: value,
    };

    if (field === "asset" && typeof value === "string") {
      const isStablecoin = ["STABLES", "USDC", "USDT"].includes(value.toUpperCase());
      if (isStablecoin) {
        newBalances[index].price = 1.0;
      }
    }

    if (field === "price" || field === "amount") {
      const price = parseFloat(String(newBalances[index].price)) || 0;
      const amount = parseFloat(String(newBalances[index].amount)) || 0;
      newBalances[index].notional = price * amount;
    }

    setFormData({ ...formData, balances: newBalances });
  };

  const addBalance = () => {
    const newBalance: Balance = {
      asset: "",
      price: "" as never,
      amount: "" as never,
      notional: 0,
    };
    setFormData({
      ...formData,
      balances: [...(formData.balances || []), newBalance],
    });
  };

  const removeBalance = (index: number) => {
    const newBalances = [...(formData.balances || [])];
    newBalances.splice(index, 1);
    setFormData({ ...formData, balances: newBalances });
  };

  const addExchange = () => {
    const newExchange: ExchangeData = {
      venue: "",
      symbol: formData.token || "",
      jpegVolume: "" as never,
      marketVolume: "" as never,
      marketShare: 0,
      liquidity2pct: "" as never,
      jpegLiquidity2pct: "" as never,
      liquidityShare: 0,
      avgSpread: 0,
    };
    setFormData({
      ...formData,
      exchanges: [...(formData.exchanges || []), newExchange],
    });
  };

  const updateExchange = (index: number, field: keyof ExchangeData, value: string | number) => {
    const newExchanges = [...(formData.exchanges || [])];
    newExchanges[index] = {
      ...newExchanges[index],
      [field]: value,
    };

    if (field === "jpegVolume" || field === "marketVolume") {
      const jpegVol = parseFloat(String(newExchanges[index].jpegVolume)) || 0;
      const marketVol = parseFloat(String(newExchanges[index].marketVolume)) || 0;
      newExchanges[index].marketShare = marketVol > 0 ? (jpegVol / marketVol) * 100 : 0;
    }
    if (field === "jpegLiquidity2pct" || field === "liquidity2pct") {
      const jpegLiq = parseFloat(String(newExchanges[index].jpegLiquidity2pct)) || 0;
      const totalLiq = parseFloat(String(newExchanges[index].liquidity2pct)) || 0;
      newExchanges[index].liquidityShare = totalLiq > 0 ? (jpegLiq / totalLiq) * 100 : 0;
    }

    setFormData({ ...formData, exchanges: newExchanges });
  };

  const removeExchange = (index: number) => {
    const newExchanges = [...(formData.exchanges || [])];
    newExchanges.splice(index, 1);
    setFormData({ ...formData, exchanges: newExchanges });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Token Name</label>
            <input
              type="text"
              value={formData.token || ""}
              onChange={(e) => setFormData({ ...formData, token: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Date</label>
            <input
              type="date"
              value={formData.date || ""}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Commentary</label>
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) =>
              setFormData({ ...formData, commentary: e.currentTarget.textContent || "" })
            }
            dangerouslySetInnerHTML={{ __html: formData.commentary || "" }}
            className="block w-full min-h-[120px] px-4 py-3 border border-gray-200 rounded-md bg-white text-sm text-gray-900 break-words leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Balances */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Balances</h3>
          <button
            type="button"
            onClick={addBalance}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            + Add Balance
          </button>
        </div>
        {formData.balances?.map((balance, index) => {
          const isStablecoin = ["STABLES", "USDC", "USDT"].includes(
            balance.asset?.toUpperCase() || "",
          );

          return (
            <div key={index} className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-md relative">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
                <input
                  type="text"
                  value={balance.asset || ""}
                  onChange={(e) => updateBalance(index, "asset", e.target.value)}
                  placeholder="BTC"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price {isStablecoin && <span className="text-xs text-gray-500">(fixed)</span>}
                </label>
                <input
                  type="text"
                  value={balance.price}
                  onChange={(e) => handleNumericChange(index, "price", e.target.value)}
                  onBlur={(e) => {
                    const formatted = formatNumericValue(e.target.value);
                    updateBalance(index, "price", formatted);
                  }}
                  placeholder="0.00"
                  disabled={isStablecoin}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isStablecoin ? "bg-gray-100 cursor-not-allowed" : ""}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="text"
                  value={balance.amount}
                  onChange={(e) => handleNumericChange(index, "amount", e.target.value)}
                  onBlur={(e) => {
                    const formatted = formatNumericValue(e.target.value);
                    updateBalance(index, "amount", formatted);
                  }}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notional (USD)
                </label>
                <input
                  type="text"
                  value={balance.notional === 0 ? "" : balance.notional.toFixed(2)}
                  disabled
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>
              {formData.balances && formData.balances.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBalance(index)}
                  className="absolute top-2 right-2 text-red-600 hover:text-red-700 text-sm font-medium"
                  title="Remove balance"
                >
                  ✕ Remove
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Exchanges */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Exchanges</h3>
          <button
            type="button"
            onClick={addExchange}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            + Add Exchange
          </button>
        </div>

        <div className="space-y-4">
          {formData.exchanges?.map((exchange, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-md border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-700">Exchange #{index + 1}</h4>
                {(formData.exchanges?.length || 0) > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExchange(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Venue</label>
                  <input
                    type="text"
                    value={exchange.venue}
                    onChange={(e) => updateExchange(index, "venue", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="e.g., Bitget"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    2% Liquidity
                  </label>
                  <input
                    type="text"
                    value={exchange.liquidity2pct}
                    onChange={(e) =>
                      handleExchangeNumericChange(index, "liquidity2pct", e.target.value)
                    }
                    onBlur={(e) => {
                      const formatted = formatNumericValue(e.target.value);
                      updateExchange(index, "liquidity2pct", formatted);
                    }}
                    placeholder="0"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    JPEG 2% Liquidity
                  </label>
                  <input
                    type="text"
                    value={exchange.jpegLiquidity2pct}
                    onChange={(e) =>
                      handleExchangeNumericChange(index, "jpegLiquidity2pct", e.target.value)
                    }
                    onBlur={(e) => {
                      const formatted = formatNumericValue(e.target.value);
                      updateExchange(index, "jpegLiquidity2pct", formatted);
                    }}
                    placeholder="0"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div></div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Market Volume
                  </label>
                  <input
                    type="text"
                    value={exchange.marketVolume}
                    onChange={(e) =>
                      handleExchangeNumericChange(index, "marketVolume", e.target.value)
                    }
                    onBlur={(e) => {
                      const formatted = formatNumericValue(e.target.value);
                      updateExchange(index, "marketVolume", formatted);
                    }}
                    placeholder="0"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    JPEG Volume
                  </label>
                  <input
                    type="text"
                    value={exchange.jpegVolume}
                    onChange={(e) =>
                      handleExchangeNumericChange(index, "jpegVolume", e.target.value)
                    }
                    onBlur={(e) => {
                      const formatted = formatNumericValue(e.target.value);
                      updateExchange(index, "jpegVolume", formatted);
                    }}
                    placeholder="0"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prices */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Reporting Prices</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Open</label>
            <input
              type="text"
              value={formData.prices?.open || ""}
              onChange={(e) => handlePriceChange("open", e.target.value)}
              onBlur={(e) => {
                const formatted = formatNumericValue(e.target.value);
                handlePriceChange("open", formatted);
              }}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">High</label>
            <input
              type="text"
              value={formData.prices?.high || ""}
              onChange={(e) => handlePriceChange("high", e.target.value)}
              onBlur={(e) => {
                const formatted = formatNumericValue(e.target.value);
                handlePriceChange("high", formatted);
              }}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Low</label>
            <input
              type="text"
              value={formData.prices?.low || ""}
              onChange={(e) => handlePriceChange("low", e.target.value)}
              onBlur={(e) => {
                const formatted = formatNumericValue(e.target.value);
                handlePriceChange("low", formatted);
              }}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Close</label>
            <input
              type="text"
              value={formData.prices?.close || ""}
              onChange={(e) => handlePriceChange("close", e.target.value)}
              onBlur={(e) => {
                const formatted = formatNumericValue(e.target.value);
                handlePriceChange("close", formatted);
              }}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
        >
          Generate PDF Report
        </button>
      </div>
    </form>
  );
}

export default DataInputForm;
