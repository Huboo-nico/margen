import React, { useState, useEffect } from 'react';
import { PricingControlMode } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
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
  const { language, currencySymbol } = useLanguage();
  const { isDark } = useTheme();

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
    <div className={`p-3.5 rounded-lg border transition-colors shadow-2xs ${
      isDark
        ? 'bg-[#1E1B2E] border-[#2E2A48] hover:border-[#47D2BF]/40'
        : 'bg-white border-[#E5DDD0] hover:border-[#D5C9B8]'
    }`}>
      <div className="flex items-start justify-between mb-2.5 flex-wrap gap-2">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>{label}</h4>
            {badge}
            {isCostCustomized && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                isDark
                  ? 'text-amber-300 bg-amber-950/60 border-amber-800/60'
                  : 'text-amber-700 bg-amber-50 border-amber-200'
              }`}>
                {language === 'en' ? 'Custom cost' : 'Coste personalizado'}
              </span>
            )}
          </div>
          {subLabel && <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>{subLabel}</p>}
        </div>

        {/* Mode Toggle */}
        <div className={`inline-flex rounded-md p-0.5 text-[11px] border ${
          isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
        }`}>
          {!hideMarginButton && (
            <button
              type="button"
              onClick={() => onModeChange('margin')}
              className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                mode === 'margin'
                  ? isDark
                    ? 'bg-[#25203D] text-[#47D2BF] shadow-xs font-semibold'
                    : 'bg-white text-[#6B4ABF] shadow-xs font-semibold'
                  : isDark
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-[#6D635B] hover:text-[#2D2825]'
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
                ? isDark
                  ? 'bg-[#25203D] text-[#47D2BF] shadow-xs font-semibold'
                  : 'bg-white text-[#6B4ABF] shadow-xs font-semibold'
                : isDark
                ? 'text-gray-400 hover:text-gray-200'
                : 'text-[#6D635B] hover:text-[#2D2825]'
            }`}
          >
            {language === 'en' ? 'Direct Price' : 'Precio Directo'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-center">
        {/* 1. Coste */}
        <div className={`p-2 rounded-md border ${
          isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
        }`}>
          <div className={`flex items-center justify-between text-[11px] font-medium mb-1 ${
            isDark ? 'text-gray-400' : 'text-[#6D635B]'
          }`}>
            <span>{language === 'en' ? 'Base Cost' : 'Coste Base'}</span>
            {isCostCustomized && onResetCost && (
              <button
                type="button"
                onClick={onResetCost}
                title={language === 'en' ? `Reset to default standard (${formatEur(defaultCost)})` : `Restablecer a estándar (${formatEur(defaultCost)})`}
                className={`flex items-center gap-1 text-[10px] font-semibold cursor-pointer underline ${
                  isDark ? 'text-[#47D2BF] hover:text-[#47D2BF]/80' : 'text-[#6B4ABF] hover:text-[#583aa3]'
                }`}
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
                className={`w-full border rounded px-2.5 py-1 text-xs font-mono font-bold ${
                  isDark
                    ? 'bg-[#120e26] border-[#2E2A48] text-white focus:border-[#47D2BF] focus:ring-1 focus:ring-[#47D2BF]'
                    : 'bg-white border-[#E5DDD0] text-[#2D2825] focus:border-[#6B4ABF] focus:ring-1 focus:ring-[#6B4ABF]'
                }`}
              />
              <span className={`absolute right-2.5 top-1 text-xs font-semibold ${
                isDark ? 'text-gray-500' : 'text-[#8C8278]'
              }`}>{currencySymbol}</span>
            </div>
          ) : (
            <div className={`text-xs font-mono font-bold rounded px-2.5 py-1 border ${
              isDark
                ? 'text-white bg-[#120e26] border-[#2E2A48]'
                : 'text-[#2D2825] bg-white border-[#E5DDD0]'
            }`}>
              {formatEur(cost)}
            </div>
          )}

          {defaultCost !== undefined && (
            <div className={`text-[10px] mt-1 font-mono flex items-center justify-between ${
              isDark ? 'text-gray-500' : 'text-[#8C8278]'
            }`}>
              <span>{language === 'en' ? 'Standard rate:' : 'Tarifa estándar:'}</span>
              <span>{formatEur(defaultCost)}</span>
            </div>
          )}
        </div>

        {/* 2. Margen % y Markup % */}
        <div className={`p-2 rounded-md border transition-colors ${
          mode === 'margin'
            ? isDark
              ? 'bg-[#20172e] border-[#3E2748]'
              : 'bg-[#F4EEE4] border-[#D5C9B8]'
            : isDark
            ? 'bg-[#151226] border-[#2E2A48]'
            : 'bg-[#FAF7F2] border-[#E5DDD0]'
        }`}>
          <div className={`flex justify-between items-center text-[11px] font-medium mb-1 ${
            isDark ? 'text-gray-400' : 'text-[#6D635B]'
          }`}>
            <span className={mode === 'margin' ? (isDark ? 'text-rose-300 font-bold' : 'text-[#6B4ABF] font-bold') : ''}>
              {language === 'en' ? 'Margin / Markup' : 'Margen / Markup'}
            </span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                {currentMargin !== null ? `${(currentMargin * 100).toFixed(1)}%` : '0%'}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${
                  isDark
                    ? 'text-[#47D2BF] bg-[#25203D] border-[#47D2BF]/40'
                    : 'text-[#6B4ABF] bg-[#F4EEE4] border-[#D5C9B8]'
                }`}
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
              className={`flex-1 h-1.5 rounded cursor-pointer ${
                isDark ? 'accent-[#47D2BF] bg-[#2E2A48]' : 'accent-[#6B4ABF] bg-[#E5DDD0]'
              }`}
            />
            <div className="relative w-16">
              <input
                type="text"
                inputMode="decimal"
                value={marginPctStr}
                onFocus={() => setIsMarginFocused(true)}
                onChange={(e) => handleMarginPctChange(e.target.value)}
                onBlur={handleMarginBlur}
                className={`w-full border rounded px-1.5 py-0.5 text-center text-xs font-mono font-bold ${
                  isDark
                    ? 'border-[#2E2A48] text-white bg-[#120e26] focus:ring-1 focus:ring-[#47D2BF]'
                    : 'border-[#E5DDD0] text-[#2D2825] bg-white focus:ring-1 focus:ring-[#6B4ABF]'
                }`}
              />
              <span className={`absolute right-1 top-0.5 text-[10px] ${isDark ? 'text-gray-500' : 'text-[#8C8278]'}`}>%</span>
            </div>
          </div>
        </div>

        {/* 3. Precio de Venta */}
        <div className={`p-2 rounded-md border transition-colors ${
          mode === 'price'
            ? isDark
              ? 'bg-[#25203D] border-[#47D2BF]/40'
              : 'bg-amber-50/70 border-amber-300'
            : isDark
            ? 'bg-[#151226] border-[#2E2A48]'
            : 'bg-[#FAF7F2] border-[#E5DDD0]'
        }`}>
          <div className={`flex justify-between items-center text-[11px] font-medium mb-1 ${
            isDark ? 'text-gray-400' : 'text-[#6D635B]'
          }`}>
            <span className={mode === 'price' ? (isDark ? 'text-[#47D2BF] font-bold' : 'text-amber-800 font-bold') : ''}>
              {language === 'en' ? 'Selling Price' : 'Precio de Venta'}
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                profit >= 0
                  ? isDark
                    ? 'text-emerald-300 bg-emerald-950/60 border-emerald-700/60'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : isDark
                  ? 'text-rose-300 bg-rose-950/60 border-rose-800/50'
                  : 'text-red-700 bg-red-50 border-red-200'
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
              className={`w-full border rounded px-2.5 py-1 text-xs font-mono font-bold ${
                isDark
                  ? 'border-[#2E2A48] text-white bg-[#120e26] focus:border-[#47D2BF] focus:ring-1 focus:ring-[#47D2BF]'
                  : 'border-[#E5DDD0] text-[#2D2825] bg-white focus:border-[#6B4ABF] focus:ring-1 focus:ring-[#6B4ABF]'
              }`}
            />
            <span className={`absolute right-2.5 top-1 text-xs font-semibold ${
              isDark ? 'text-gray-500' : 'text-[#8C8278]'
            }`}>{currencySymbol}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
