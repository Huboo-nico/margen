import React from 'react';
import { PricingControlMode } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { priceFromCostMargin, marginFromPrice, markupFromPrice, formatEur, formatMarkup } from '../utils/calculations';

interface PriceMarginRowProps {
  label: string;
  subLabel?: string;
  cost: number;
  mode: PricingControlMode;
  marginTarget: number;
  manualPrice: number;
  onModeChange: (mode: PricingControlMode) => void;
  onMarginChange: (margin: number) => void;
  onPriceChange: (price: number) => void;
  onCostChange?: (cost: number) => void;
  allowCostEdit?: boolean;
}

export const PriceMarginRow: React.FC<PriceMarginRowProps> = ({
  label,
  subLabel,
  cost,
  mode,
  marginTarget,
  manualPrice,
  onModeChange,
  onMarginChange,
  onPriceChange,
  onCostChange,
  allowCostEdit = false,
}) => {
  const { language } = useLanguage();
  const currentPrice =
    mode === 'margin' ? priceFromCostMargin(cost, marginTarget) : manualPrice;
  const currentMargin = marginFromPrice(currentPrice, cost);
  const currentMarkup = markupFromPrice(currentPrice, cost);
  const profit = currentPrice - cost;

  const handlePriceInput = (val: number) => {
    onPriceChange(val);
    if (val > 0 && cost >= 0) {
      const calculatedMargin = Math.max(-0.5, Math.min(0.95, (val - cost) / val));
      onMarginChange(calculatedMargin);
    }
  };

  const handleMarginInput = (val: number) => {
    onMarginChange(val);
    const calculatedPrice = priceFromCostMargin(cost, val);
    onPriceChange(Number(calculatedPrice.toFixed(2)));
  };

  return (
    <div className="bg-white p-3.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{label}</h4>
          {subLabel && <p className="text-xs text-gray-500">{subLabel}</p>}
        </div>

        {/* Mode Toggle */}
        <div className="inline-flex rounded-md shadow-2xs p-0.5 bg-gray-100 text-[11px]">
          <button
            type="button"
            onClick={() => onModeChange('margin')}
            className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
              mode === 'margin'
                ? 'bg-white text-red-600 shadow-2xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {language === 'en' ? 'Via Margin %' : 'Vía Margen %'}
          </button>
          <button
            type="button"
            onClick={() => onModeChange('price')}
            className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
              mode === 'price'
                ? 'bg-white text-red-600 shadow-2xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {language === 'en' ? 'Direct price' : 'Precio directo'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        {/* 1. Coste */}
        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-0.5">
            {language === 'en' ? 'Unit base cost' : 'Coste base unitario'}
          </label>
          {allowCostEdit && onCostChange ? (
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={cost}
                onChange={(e) => onCostChange(Math.max(0, Number(e.target.value)))}
                className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs font-mono text-gray-800 focus:ring-1 focus:ring-red-500"
              />
              <span className="absolute right-2.5 top-1 text-xs text-gray-400">€</span>
            </div>
          ) : (
            <div className="text-xs font-mono font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded px-2.5 py-1">
              {formatEur(cost)}
            </div>
          )}
        </div>

        {/* 2. Margen % y Markup % */}
        <div>
          <div className="flex justify-between items-center text-[11px] font-medium text-gray-500 mb-0.5">
            <span>{language === 'en' ? 'Margin / Markup' : 'Margen / Markup'}</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="font-bold text-gray-800">
                {currentMargin !== null ? `${(currentMargin * 100).toFixed(1)}%` : '0%'}
              </span>
              <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded font-semibold" title={language === 'en' ? 'Markup: percentage over cost' : 'Markup: incremento sobre el coste'}>
                Markup {formatMarkup(currentMarkup)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0.0"
              max="0.80"
              step="0.01"
              value={marginTarget}
              onChange={(e) => handleMarginInput(Number(e.target.value))}
              className="flex-1 accent-red-600 h-1.5 bg-gray-200 rounded cursor-pointer"
            />
            <input
              type="number"
              step="1"
              min="0"
              max="95"
              value={Math.round(marginTarget * 100)}
              onChange={(e) => handleMarginInput(Number(e.target.value) / 100)}
              className="w-12 border border-gray-300 rounded px-1 py-0.5 text-center text-xs font-mono text-gray-800"
            />
            <span className="text-xs text-gray-400">%</span>
          </div>
        </div>

        {/* 3. Precio de Venta */}
        <div>
          <div className="flex justify-between items-center text-[11px] font-medium text-gray-500 mb-0.5">
            <span>{language === 'en' ? 'Final selling price' : 'Precio final de venta'}</span>
            <span
              className={`text-[10px] font-semibold ${
                profit >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {language === 'en' ? 'Profit: ' : 'Beneficio: '}{profit >= 0 ? '+' : ''}
              {formatEur(profit)}
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              value={Number(currentPrice.toFixed(2))}
              onChange={(e) => handlePriceInput(Math.max(0, Number(e.target.value)))}
              className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs font-mono font-bold text-gray-900 focus:ring-1 focus:ring-red-500 bg-amber-50/40"
            />
            <span className="absolute right-2.5 top-1 text-xs text-gray-400">€</span>
          </div>
        </div>
      </div>
    </div>
  );
};

