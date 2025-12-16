import { useState } from "react";
import type { ReportData, ExchangeData, Balance } from "../types.ts";
import { emptyReportData, exampleReportData } from "../data/sampleData";

interface DataInputFormProps {
  onSubmit: (data: ReportData) => void;
}

function DataInputForm({ onSubmit }: DataInputFormProps) {
  const [formData, setFormData] =
    useState<Partial<ReportData>>(emptyReportData);

  const loadExampleData = () => {
    setFormData(exampleReportData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.token && formData.date) {
      onSubmit(formData as ReportData);
    }
  };

  const updateBalance = (
    index: number,
    field: keyof Balance,
    value: string | number,
  ) => {
    const newBalances = [...(formData.balances || [])];
    newBalances[index] = {
      ...newBalances[index],
      [field]: typeof value === "string" ? parseFloat(value) || 0 : value,
    };

    // Auto-calculate notional
    if (field === "price" || field === "amount") {
      newBalances[index].notional =
        newBalances[index].price * newBalances[index].amount;
    }

    setFormData({ ...formData, balances: newBalances });
  };

  const addBalance = () => {
    const newBalance: Balance = {
      asset: "",
      price: 0,
      amount: 0,
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
      liquidity1pct: 0,
      jpegLiquidity1pct: 0,
      share1pct: 0,
      avgSpread: 0,
    };
    setFormData({
      ...formData,
      exchanges: [...(formData.exchanges || []), newExchange],
    });
  };

  const updateExchange = (
    index: number,
    field: keyof ExchangeData,
    value: string | number,
  ) => {
    const newExchanges = [...(formData.exchanges || [])];
    newExchanges[index] = {
      ...newExchanges[index],
      [field]:
        typeof value === "string" && field !== "venue" && field !== "symbol"
          ? parseFloat(value) || 0
          : value,
    };

    // Auto-calculate percentages
    if (field === "jpegVolume" || field === "marketVolume") {
      newExchanges[index].marketShare =
        newExchanges[index].marketVolume > 0
          ? (newExchanges[index].jpegVolume /
              newExchanges[index].marketVolume) *
            100
          : 0;
    }
    if (field === "jpegLiquidity2pct" || field === "liquidity2pct") {
      newExchanges[index].liquidityShare =
        newExchanges[index].liquidity2pct > 0
          ? (newExchanges[index].jpegLiquidity2pct /
              newExchanges[index].liquidity2pct) *
            100
          : 0;
    }

    setFormData({ ...formData, exchanges: newExchanges });
  };

  const removeExchange = (index: number) => {
    const newExchanges = [...(formData.exchanges || [])];
    // Не дозволяємо видалити якщо залишився тільки 1
    if (newExchanges.length <= 1) {
      alert("You must have at least one exchange");
      return;
    }
    newExchanges.splice(index, 1);
    setFormData({ ...formData, exchanges: newExchanges });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Basic Information
          </h3>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token Name
            </label>
            <input
              type="text"
              value={formData.token || ""}
              onChange={(e) =>
                setFormData({ ...formData, token: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Date
            </label>
            <input
              type="date"
              value={formData.date || ""}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Commentary
          </label>
          <textarea
            value={formData.commentary || ""}
            onChange={(e) =>
              setFormData({ ...formData, commentary: e.target.value })
            }
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter commentary about market conditions and strategy..."
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
        {formData.balances?.map((balance, index) => (
          <div
            key={index}
            className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-md relative"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset
              </label>
              <input
                type="text"
                value={balance.asset}
                onChange={(e) => updateBalance(index, "asset", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <input
                type="number"
                step="0.000001"
                value={balance.price}
                onChange={(e) => updateBalance(index, "price", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                value={balance.amount}
                onChange={(e) => updateBalance(index, "amount", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notional
              </label>
              <input
                type="number"
                value={balance.notional.toFixed(2)}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            {formData.balances && formData.balances.length > 1 && (
              <button
                type="button"
                onClick={() => removeBalance(index)}
                className="absolute top-2 right-2 text-red-600 hover:text-red-700 text-sm"
                title="Remove balance"
              >
                Remove
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
            <div
              key={index}
              className="p-4 bg-gray-50 rounded-md border border-gray-200"
            >
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-700">
                  Exchange #{index + 1}
                </h4>
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={exchange.venue}
                    onChange={(e) =>
                      updateExchange(index, "venue", e.target.value)
                    }
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
                    onChange={(e) =>
                      updateExchange(index, "jpegVolume", e.target.value)
                    }
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
                    onChange={(e) =>
                      updateExchange(index, "marketVolume", e.target.value)
                    }
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
                    onChange={(e) =>
                      updateExchange(index, "jpegLiquidity2pct", e.target.value)
                    }
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
                    onChange={(e) =>
                      updateExchange(index, "liquidity2pct", e.target.value)
                    }
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
                    onChange={(e) =>
                      updateExchange(index, "avgSpread", e.target.value)
                    }
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
        <h3 className="text-lg font-semibold text-gray-900">
          Reporting Prices
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Open
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              High
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Low
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Close
            </label>
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
