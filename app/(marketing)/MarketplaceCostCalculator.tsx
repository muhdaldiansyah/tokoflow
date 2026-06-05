"use client";

import { useState, useMemo } from "react";
import { Calculator } from "lucide-react";
import Link from "next/link";

const PLATFORM_PRESETS = [
  { label: "10%", value: 10 },
  { label: "15%", value: 15 },
  { label: "20%", value: 20 },
  { label: "Custom", value: -1 },
];

function formatMYR(val: number): string {
  return val.toLocaleString("en-MY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function MarketplaceCostCalculator() {
  const [avgOrderValue, setAvgOrderValue] = useState(50);
  const [ordersPerMonth, setOrdersPerMonth] = useState(50);
  const [selectedPreset, setSelectedPreset] = useState(15);
  const [isCustom, setIsCustom] = useState(false);
  const [customPct, setCustomPct] = useState(15);

  const effectivePct = isCustom ? customPct : selectedPreset;

  const results = useMemo(() => {
    const platformCost =
      (avgOrderValue * ordersPerMonth * effectivePct) / 100;
    const tokoflowCost = 49;
    const saving = platformCost - tokoflowCost;
    const breakEvenOrders =
      effectivePct > 0 && avgOrderValue > 0
        ? Math.ceil(tokoflowCost / ((avgOrderValue * effectivePct) / 100))
        : 0;
    return { platformCost, tokoflowCost, saving, breakEvenOrders };
  }, [avgOrderValue, ordersPerMonth, effectivePct]);

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 lg:p-8 shadow-sm max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-9 w-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
          <Calculator className="h-5 w-5 text-warm-green" />
        </div>
        <div>
          <h3 className="font-semibold text-[#1E293B]">
            Marketplace Cost Calculator
          </h3>
          <p className="text-xs text-[#94A3B8]">
            Calculate the real cost of selling on marketplaces
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-[#1E293B] block mb-1.5">
            Average order value (RM)
          </label>
          <input
            type="number"
            min={1}
            value={avgOrderValue}
            onChange={(e) =>
              setAvgOrderValue(Math.max(1, Number(e.target.value)))
            }
            className="w-full h-11 px-3 rounded-lg border border-[#E2E8F0] bg-white text-[#1E293B] text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-warm-green/30"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-[#1E293B] block mb-1.5">
            Orders per month
          </label>
          <input
            type="number"
            min={1}
            value={ordersPerMonth}
            onChange={(e) =>
              setOrdersPerMonth(Math.max(1, Number(e.target.value)))
            }
            className="w-full h-11 px-3 rounded-lg border border-[#E2E8F0] bg-white text-[#1E293B] text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-warm-green/30"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-[#1E293B] block mb-1.5">
            Estimated effective platform cost
          </label>
          <p className="text-xs text-[#94A3B8] mb-2.5">
            Includes commission, transaction fees, vouchers, ads, and other costs.
            You know your numbers best.
          </p>
          <div className="flex gap-2 flex-wrap">
            {PLATFORM_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  if (preset.value === -1) {
                    setIsCustom(true);
                  } else {
                    setIsCustom(false);
                    setSelectedPreset(preset.value);
                  }
                }}
                className={`h-9 px-4 rounded-lg text-sm font-medium border transition-colors ${
                  preset.value === -1
                    ? isCustom
                      ? "bg-warm-green text-white border-warm-green"
                      : "bg-white text-[#475569] border-[#E2E8F0] hover:border-warm-green/50"
                    : !isCustom && selectedPreset === preset.value
                    ? "bg-warm-green text-white border-warm-green"
                    : "bg-white text-[#475569] border-[#E2E8F0] hover:border-warm-green/50"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {isCustom && (
            <input
              type="number"
              min={1}
              max={100}
              value={customPct}
              onChange={(e) =>
                setCustomPct(
                  Math.min(100, Math.max(1, Number(e.target.value)))
                )
              }
              placeholder="Enter custom %"
              className="mt-2.5 w-full h-11 px-3 rounded-lg border border-[#E2E8F0] bg-white text-[#1E293B] text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-warm-green/30"
            />
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mt-6 rounded-xl bg-slate-50 border border-[#E2E8F0] p-5 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#475569]">
            Estimated monthly platform cost
          </span>
          <span className="font-semibold text-[#1E293B]">
            RM {formatMYR(results.platformCost)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#475569]">Tokoflow cost (Pro)</span>
          <span className="font-semibold text-[#1E293B]">RM 49</span>
        </div>
        <div className="border-t border-[#E2E8F0] pt-3">
          {results.saving > 0 ? (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-warm-green">
                  Potential monthly saving
                </span>
                <span className="font-bold text-warm-green text-lg">
                  RM {formatMYR(results.saving)}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-2">
                At {ordersPerMonth} orders/month, Tokoflow pays for itself after
                your first {results.breakEvenOrders} orders.
              </p>
            </>
          ) : (
            <p className="text-xs text-[#94A3B8]">
              Increase order volume or adjust the platform cost estimate to see
              the full comparison.
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-[#94A3B8]">
        This is an estimate only. Actual costs vary by platform, product
        category, and selling type.
      </p>

      {results.saving > 0 && (
        <div className="mt-4">
          <Link
            href="/register"
            className="inline-flex items-center justify-center w-full h-11 rounded-xl text-sm font-semibold bg-warm-green text-white hover:bg-warm-green-hover transition-colors"
          >
            Build my own order website — RM 49/month
          </Link>
        </div>
      )}
    </div>
  );
}
