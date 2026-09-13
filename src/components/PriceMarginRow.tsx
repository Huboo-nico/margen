import React, { useState, useEffect } from 'react';
import { PricingControlMode } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { priceFromCostMargin, marginFromPrice, markupFromPrice, formatEur, formatMarkup } from '../utils/calculations';
import { RotateCcw } from 'lucide-react';

interface PriceMarginRowProps {
  label: string;
  subLabel?: string;
  cost: number;
  defaultCost?: number;
  mode: PricingControlMode;
  marginTarget: number;
  manualPrice: number;
  onModeChange: (mode: PricingControlMode) => void;
  onMarginChange: (margin: number) => void;
  onPriceChange: (price: number) => void;
  onCostChange?: (cost: number) => void;
  onResetCost?: () => void;
  allowCostEdit?: boolean;
  badge?: React.ReactNode;
  hideMarginButton?: boolean;
}

export const PriceMarginRow: React.FC<PriceMarginRowProps> = ({
  label,
  subLabel,
  cost,
  defaultCost,
  mode,
  marginTarget,
  manualPrice,
  onModeChange,
  onMarginChange,
  onPriceChange,
  onCostChange,
  onResetCost,
  allowCostEdit = false,
  badge,
  hideMarginButton = false,
}) => {
  const { language } = useLanguage();

  // Price calculations
  const currentPrice =
    mode === 'margin' ? priceFromCostMargin(cost, marginTarget) : manualPrice;
  const currentMargin = marginFromPrice(currentPrice, cost);
  const currentMarkup = markupFromPrice(currentPrice, cost);
  const profit = currentPrice - cost;

  // Local string states for fluid editing (prevents input cursor jumps / dot swallowing)
  const [costStr, setCostStr] = useState<string>(cost.toFixed(2));
  const [isCostFocused, setIsCostFocused] = useState<boolean>(false);

  const [priceStr, setPriceStr] = useState<string>(currentPrice.toFixed(2));
  const [isPriceFocused, setIsPriceFocused] = useState<boolean>(false);

  const [marginPctStr, setMarginPctStr] = useState<string>((marginTarget * 100).toFixed(1));
  const [isMarginFocused, setIsMarginFocused] = useState<boolean>(false);

  // Synchronize local strings when external props change and field is NOT focused
  useEffect(() => {
    if (!isCostFocused) {
      setCostStr(cost.toFixed(2));
    }
  }, [cost, isCostFocused]);

  useEffect(() => {
    if (!isPriceFocused) {
      setPriceStr(currentPrice.toFixed(2));
    }
  }, [currentPrice, isPriceFocused]);

  useEffect(() => {
    if (!isMarginFocused) {
      const activeMargin = mode === 'margin' ? marginTarget : (currentMargin ?? marginTarget);
      setMarginPctStr((activeMargin * 100).toFixed(1));
    }
  }, [marginTarget, currentMargin, mode, isMarginFocused]);

  // Handler: Cost input change
  const handleCostChange = (raw: string) => {
    setCostStr(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= 0 && onCostChange) {
      onCostChange(parsed);
      if (mode === 'margin') {
        const newPrice = priceFromCostMargin(parsed, marginTarget);
        onPriceChange(Number(newPrice.toFixed(2)));
      } else if (mode === 'price' && manualPrice > 0) {
        const newMargin = Math.max(-0.5, Math.min(0.95, (manualPrice - parsed) / manualPrice));
        onMarginChange(newMargin);
      }
    }
  };

  const handleCostBlur = () => {
    setIsCostFocused(false);
    const parsed = parseFloat(costStr);
    if (isNaN(parsed) || parsed < 0) {
      setCostStr(cost.toFixed(2));
    } else {
      setCostStr(parsed.toFixed(2));
    }
  };

  // Handler: Price input change
  const handlePriceChange = (raw: string) => {
    setPriceStr(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= 0) {
      onPriceChange(parsed);
      onModeChange('price');
      if (parsed > 0 && cost >= 0) {
        const calculatedMargin = Math.max(-0.5, Math.min(0.95, (parsed - cost) / parsed));
        onMarginChange(calculatedMargin);
      }
    }
  };

  const handlePriceBlur = () => {
    setIsPriceFocused(false);
    const parsed = parseFloat(priceStr);
    if (isNaN(parsed) || parsed < 0) {
      setPriceStr(currentPrice.toFixed(2));
    } else {
      setPriceStr(parsed.toFixed(2));
    }
  };

  // Handler: Margin % text change
  const handleMarginPctChange = (raw: string) => {
    setMarginPctStr(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      const marginFrac = Math.max(-0.5, Math.min(0.95, parsed / 100));
      onMarginChange(marginFrac);
      onModeChange('margin');
      const calculatedPrice = priceFromCostMargin(cost, marginFrac);
      onPriceChange(Number(calculatedPrice.toFixed(2)));
    }
  };

  const handleMarginBlur = () => {
    setIsMarginFocused(false);
    const parsed = parseFloat(marginPctStr);
    if (isNaN(parsed)) {
      setMarginPctStr((marginTarget * 100).toFixed(1));
    } else {
      setMarginPctStr(parsed.toFixed(1));
    }
  };

  // Handler: Slider change
  const handleSliderChange = (val: number) => {
    onMarginChange(val);
    onModeChange('margin');
    setMarginPctStr((val * 100).toFixed(1));
    const calculatedPrice = priceFromCostMargin(cost, val);
    onPriceChange(Number(calculatedPrice.toFixed(2)));
  };

  const isCostCustomized = defaultCost !== undefined && Math.abs(cost - defaultCost) > 0.005;

  return (
    <div className="bg-white p-3.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors shadow-2xs">
      <div className="flex items-start justify-between mb-2.5 flex-wrap gap-2">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-gray-900">{label}</h4>
            {badge}
            {isCostCustomized && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                {language === 'en' ? 'Custom cost' : 'Coste personalizado'}
              </span>
            )}
          </div>
          {subLabel && <p className="text-xs text-gray-500 mt-0.5">{subLabel}</p>}
        </div>

        {/* Mode Toggle */}
        <div className="inline-flex rounded-md p-0.5 bg-gray-100 text-[11px] border border-gray-200">
          {!hideMarginButton && (
            <button
              type="button"
              onClick={() => onModeChange('margin')}
              className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                mode === 'margin'
                  ? 'bg-white text-red-600 shadow-xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {language === 'en' ? 'Via Margin %' : 'Vía Margen %'}
            </button>
          )}
          <button
            type="button"
            onClick={() => onModeChange('price')}
            className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
              mode === 'price' || hideMarginButton
                ? 'bg-white text-red-600 shadow-xs font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {language === 'en' ? 'Direct Price' : 'Precio Directo'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-center">
        {/* 1. Coste */}
        <div className="bg-gray-50/70 p-2 rounded-md border border-gray-100">
          <div className="flex items-center justify-between text-[11px] font-medium text-gray-600 mb-1">
            <span>{language === 'en' ? 'Base Cost' : 'Coste Base'}</span>
            {isCostCustomized && onResetCost && (
              <button
                type="button"
                onClick={onResetCost}
                title={language === 'en' ? `Reset to default standard (${formatEur(defaultCost)})` : `Restablecer a estándar (${formatEur(defaultCost)})`}
                className="flex items-center gap-1 text-[10px] text-red-600 hover:text-red-800 font-semibold cursor-pointer underline"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                {language === 'en' ? 'Reset' : 'Restablecer'}
              </button>
            )}
          </div>

          {allowCostEdit && onCostChange ? (
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={costStr}
                onFocus={() => setIsCostFocused(true)}
                onChange={(e) => handleCostChange(e.target.value)}
                onBlur={handleCostBlur}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs font-mono font-bold text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
              />
              <span className="absolute right-2.5 top-1 text-xs text-gray-400 font-semibold">€</span>
            </div>
          ) : (
            <div className="text-xs font-mono font-bold text-gray-800 bg-white border border-gray-200 rounded px-2.5 py-1">
              {formatEur(cost)}
            </div>
          )}

          {defaultCost !== undefined && (
            <div className="text-[10px] text-gray-400 mt-1 font-mono flex items-center justify-between">
              <span>{language === 'en' ? 'Standard rate:' : 'Tarifa estándar:'}</span>
              <span>{formatEur(defaultCost)}</span>
            </div>
          )}
        </div>

        {/* 2. Margen % y Markup % */}
        <div className={`p-2 rounded-md border transition-colors ${mode === 'margin' ? 'bg-red-50/40 border-red-200' : 'bg-gray-50/70 border-gray-100'}`}>
          <div className="flex justify-between items-center text-[11px] font-medium text-gray-600 mb-1">
            <span className={mode === 'margin' ? 'text-red-700 font-bold' : ''}>
              {language === 'en' ? 'Margin / Markup' : 'Margen / Markup'}
            </span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="font-bold text-gray-900 text-xs">
                {currentMargin !== null ? `${(currentMargin * 100).toFixed(1)}%` : '0%'}
              </span>
              <span
                className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded font-semibold"
                title={language === 'en' ? 'Markup: percentage increment over cost' : 'Markup: incremento porcentual sobre el coste'}
              >
                +{formatMarkup(currentMarkup)}
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
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="flex-1 accent-red-600 h-1.5 bg-gray-200 rounded cursor-pointer"
            />
            <div className="relative w-16">
              <input
                type="text"
                inputMode="decimal"
                value={marginPctStr}
                onFocus={() => setIsMarginFocused(true)}
                onChange={(e) => handleMarginPctChange(e.target.value)}
                onBlur={handleMarginBlur}
                className="w-full border border-gray-300 rounded px-1.5 py-0.5 text-center text-xs font-mono font-bold text-gray-800 bg-white focus:ring-1 focus:ring-red-500"
              />
              <span className="absolute right-1 top-0.5 text-[10px] text-gray-400">%</span>
            </div>
          </div>
        </div>

        {/* 3. Precio de Venta */}
        <div className={`p-2 rounded-md border transition-colors ${mode === 'price' ? 'bg-amber-50/50 border-amber-300' : 'bg-gray-50/70 border-gray-100'}`}>
          <div className="flex justify-between items-center text-[11px] font-medium text-gray-600 mb-1">
            <span className={mode === 'price' ? 'text-amber-800 font-bold' : ''}>
              {language === 'en' ? 'Selling Price' : 'Precio de Venta'}
            </span>
            <span
              className={`text-[10px] font-bold ${
                profit >= 0 ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded' : 'text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded'
              }`}
            >
              {profit >= 0 ? '+' : ''}
              {formatEur(profit)}
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={priceStr}
              onFocus={() => setIsPriceFocused(true)}
              onChange={(e) => handlePriceChange(e.target.value)}
              onBlur={handlePriceBlur}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs font-mono font-bold text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
            />
            <span className="absolute right-2.5 top-1 text-xs text-gray-400 font-semibold">€</span>
          </div>
        </div>
      </div>
    </div>
  );
};
