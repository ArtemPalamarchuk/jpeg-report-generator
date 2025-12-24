import { useState } from "react";
import type { ReportData, ExchangeData, Balance } from "../types.ts";
import { emptyReportData, exampleReportData } from "../data/sampleData";

interface DataInputFormProps {
  onSubmit: (data: ReportData) => void;
}

function DataInputForm({ onSubmit }: DataInputFormProps) {
  const [formData, setFormData] = useState<Partial<ReportData>>(emptyReportData);

  const loadExampleData = () => {
    setFormData(exampleReportData);
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.token && formData.date) {
      const dataToSubmit = {
        ...formData,
        balances: formData.balances?.map((b) => ({
          asset: b.asset,
          price: typeof b.price === "string" ? parseFloat(b.price) || 0 : b.price,
          amount: typeof b.amount === "string" ? parseFloat(b.amount) || 0 : b.amount,
          notional: b.notional,
        })),
      };
      onSubmit(dataToSubmit as ReportData);
    }
  };

  const updateBalance = (index: number, field: keyof Balance, value: string | number) => {
    const newBalances = [...(formData.balances || [])];
    newBalances[index] = {
      ...newBalances[index],
      [field]: value,
    };

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
      jpegVolume: 0,
      marketVolume: 0,
      marketShare: 0,
      liquidity2pct: 0,
      jpegLiquidity2pct: 0,
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
      [field]:
        typeof value === "string" && field !== "venue" && field !== "symbol"
          ? parseFloat(value) || 0
          : value,
    };

    if (field === "jpegVolume" || field === "marketVolume") {
      newExchanges[index].marketShare =
        newExchanges[index].marketVolume > 0
          ? (newExchanges[index].jpegVolume / newExchanges[index].marketVolume) * 100
          : 0;
    }
    if (field === "jpegLiquidity2pct" || field === "liquidity2pct") {
      newExchanges[index].liquidityShare =
        newExchanges[index].liquidity2pct > 0
          ? (newExchanges[index].jpegLiquidity2pct / newExchanges[index].liquidity2pct) * 100
          : 0;
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
          <button
            type="button"
            onClick={loadExampleData}
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors text-sm font-medium"
          >
            Try Example Data
          </button>
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
          <textarea
            value={formData.commentary || ""}
            onChange={(e) => setFormData({ ...formData, commentary: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter commentary about market conditions and strategy..."
          />
        </div>
      </div>

      {/* Balances - ОБНОВЛЕННАЯ СЕКЦИЯ */}
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
        {formData.balances?.map((balance, index) => (
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                type="text"
                value={balance.price}
                onChange={(e) => handleNumericChange(index, "price", e.target.value)}
                onBlur={(e) => {
                  const formatted = formatNumericValue(e.target.value);
                  updateBalance(index, "price", formatted);
                }}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Notional (USD)</label>
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
        ))}
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
                    JPEG Volume
                  </label>
                  <input
                    type="number"
                    value={exchange.jpegVolume}
                    onChange={(e) => updateExchange(index, "jpegVolume", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Market Volume
                  </label>
                  <input
                    type="number"
                    value={exchange.marketVolume}
                    onChange={(e) => updateExchange(index, "marketVolume", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    JPEG 2% Liquidity
                  </label>
                  <input
                    type="number"
                    value={exchange.jpegLiquidity2pct}
                    onChange={(e) => updateExchange(index, "jpegLiquidity2pct", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    2% Liquidity
                  </label>
                  <input
                    type="number"
                    value={exchange.liquidity2pct}
                    onChange={(e) => updateExchange(index, "liquidity2pct", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Avg Spread (bps)
                  </label>
                  <input
                    type="number"
                    value={exchange.avgSpread}
                    onChange={(e) => updateExchange(index, "avgSpread", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
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
              type="number"
              step="0.000001"
              value={formData.prices?.open || 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  prices: {
                    ...formData.prices!,
                    open: parseFloat(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">High</label>
            <input
              type="number"
              step="0.000001"
              value={formData.prices?.high || 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  prices: {
                    ...formData.prices!,
                    high: parseFloat(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Low</label>
            <input
              type="number"
              step="0.000001"
              value={formData.prices?.low || 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  prices: {
                    ...formData.prices!,
                    low: parseFloat(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Close</label>
            <input
              type="number"
              step="0.000001"
              value={formData.prices?.close || 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  prices: {
                    ...formData.prices!,
                    close: parseFloat(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
