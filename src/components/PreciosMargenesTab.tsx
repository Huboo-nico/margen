import React, { useState } from 'react';
import { CalculatorInputs, CalculationResults, ProductType } from '../types';
import { PriceMarginRow } from './PriceMarginRow';
import { PRODUCT_PROFILES, AVAILABLE_TECHNOLOGIES, AVAILABLE_WAREHOUSES } from '../data/constants';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { CleanNumberInput } from './CleanNumberInput';
import { LiveDateScheduler } from './LiveDateScheduler';
import {
  formatEur,
  formatPct,
  formatMarkup,
  priceFromCostMargin,
} from '../utils/calculations';
import {
  Sliders,
  User,
  Layers,
  Package,
  Truck,
  Globe,
  Warehouse,
  Check,
  Plus,
  X,
  Save,
  Loader2,
} from 'lucide-react';

interface PreciosMargenesTabProps {
  inputs: CalculatorInputs;
  results: CalculationResults;
  onChange: (updated: Partial<CalculatorInputs>) => void;
  onSaveClient?: () => void;
  isSavingClient?: boolean;
}

export const PreciosMargenesTab: React.FC<PreciosMargenesTabProps> = ({
  inputs,
  results,
  onChange,
  onSaveClient,
  isSavingClient,
}) => {
  const { language } = useLanguage();
  const { isDark } = useTheme();
  const [customTechInput, setCustomTechInput] = useState('');

  const handleProductChange = (newProduct: ProductType) => {
    onChange({
      productType: newProduct,
    });
  };

  const applyPresetMarginToAll = (margin: number) => {
    onChange({
      packMarginTarget: margin,
      packPriceMode: 'margin',
      firstPickMarginTarget: margin,
      firstPickPriceMode: 'margin',
      additionalPickMarginTarget: margin,
      additionalPickPriceMode: 'margin',
      shippingMarginTarget: margin,
      shippingPriceMode: 'margin',
    });
  };

  const mixTotal = inputs.mixSpk + inputs.mixSpl + inputs.mixMpl + inputs.mixLpl;

  const normalizeMix = () => {
    if (mixTotal === 0) {
      onChange({ mixSpk: 25, mixSpl: 25, mixMpl: 25, mixLpl: 25 });
      return;
    }
    const factor = 100 / mixTotal;
    const spk = Math.round(inputs.mixSpk * factor);
    const spl = Math.round(inputs.mixSpl * factor);
    const mpl = Math.round(inputs.mixMpl * factor);
    const lpl = 100 - (spk + spl + mpl);
    onChange({ mixSpk: spk, mixSpl: spl, mixMpl: mpl, mixLpl: lpl });
  };

  const applyMixPreset = (spk: number, spl: number, mpl: number, lpl: number) => {
    onChange({ mixSpk: spk, mixSpl: spl, mixMpl: mpl, mixLpl: lpl });
  };

  const productTypeLabels: Partial<Record<ProductType, string>> = {
    'Suplementos': language === 'en' ? 'Supplements' : 'Suplementos',
    'Cosmética': language === 'en' ? 'Cosmetics' : 'Cosmética',
    'Perfume': 'Perfume',
    'Vidrio': language === 'en' ? 'Glass' : 'Vidrio',
    'Perfume + vidrio': language === 'en' ? 'Perfume + glass' : 'Perfume + vidrio',
    'Apparel & Merch': 'Apparel & Merch',
  };

  const currentTechs = inputs.technologies || [];

  const toggleTechnology = (tech: string) => {
    if (currentTechs.includes(tech)) {
      onChange({ technologies: currentTechs.filter((t) => t !== tech) });
    } else {
      onChange({ technologies: [...currentTechs, tech] });
    }
  };

  const addCustomTech = (tech: string) => {
    const trimmed = tech.trim();
    if (trimmed && !currentTechs.includes(trimmed)) {
      onChange({ technologies: [...currentTechs, trimmed] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Global Impact and Margin Presets */}
      <div className={`p-5 rounded-xl border shadow-2xs ${
        isDark ? 'bg-[#1E1B2E] border-[#2E2A48]' : 'bg-white border-[#E5DDD0]'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className={`w-5 h-5 ${isDark ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`} />
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                {language === 'en'
                  ? 'Complete Configuration, Prices & Margins Panel'
                  : 'Panel Completo de Configuración, Precios & Márgenes'}
              </h2>
            </div>
            <p className={`text-xs mt-1 max-w-3xl ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en'
                ? 'Configure client details, order volume, packaging mix and adjust operating rates. Set prices directly or define target margin (%) per line.'
                : 'Configura los datos del cliente, volumen, mix de pack y ajusta las tarifas operativas. Puedes definir precios directamente o establecer el margen objetivo (%) por cada línea.'}
            </p>
          </div>

          {/* Quick preset margin buttons */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-[#8C8278]'}`}>
              {language === 'en' ? 'Quick margin:' : 'Margen rápido:'}
            </span>
            <button
              type="button"
              onClick={() => applyPresetMarginToAll(0.18)}
              className={`px-2.5 py-1 text-xs font-medium rounded border transition cursor-pointer ${
                isDark
                  ? 'border-[#2E2A48] bg-[#151226] hover:bg-[#25203D] text-gray-300'
                  : 'border-[#E5DDD0] bg-[#FAF7F2] hover:bg-white text-[#2D2825]'
              }`}
            >
              18% ({language === 'en' ? 'Competitive' : 'Competitivo'})
            </button>
            <button
              type="button"
              onClick={() => applyPresetMarginToAll(0.25)}
              className={`px-2.5 py-1 text-xs font-semibold rounded border transition cursor-pointer ${
                isDark
                  ? 'border-[#47D2BF]/50 bg-[#25203D] text-[#47D2BF]'
                  : 'border-[#D5C9B8] bg-[#F4EEE4] text-[#6B4ABF]'
              }`}
            >
              25% ({language === 'en' ? 'Standard' : 'Estándar'})
            </button>
            <button
              type="button"
              onClick={() => applyPresetMarginToAll(0.35)}
              className={`px-2.5 py-1 text-xs font-medium rounded border transition cursor-pointer ${
                isDark
                  ? 'border-[#2E2A48] bg-[#151226] hover:bg-[#25203D] text-gray-300'
                  : 'border-[#E5DDD0] bg-[#FAF7F2] hover:bg-white text-[#2D2825]'
              }`}
            >
              35% (Premium)
            </button>
          </div>
        </div>

        {/* Global KPI Metrics Bar */}
        <div className={`mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 ${
          isDark ? 'border-[#2E2A48]' : 'border-[#E5DDD0]'
        }`}>
          <div>
            <span className={`text-[11px] block ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en' ? 'Avg order revenue:' : 'Facturación / pedido medio:'}
            </span>
            <span className={`text-base font-bold font-mono ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
              {formatEur(results.orderRevenueExShipping + results.shippingPrice)}
            </span>
          </div>
          <div>
            <span className={`text-[11px] block ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en' ? 'Total cost / avg order:' : 'Coste total / pedido medio:'}
            </span>
            <span className={`text-base font-bold font-mono ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
              {formatEur(results.orderCostExShipping + results.carrierCost)}
            </span>
          </div>
          <div>
            <span className={`text-[11px] block ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en' ? 'Net profit / order:' : 'Beneficio neto / pedido:'}
            </span>
            <span
              className={`text-base font-bold font-mono ${
                results.profitPerOrder >= 0
                  ? isDark ? 'text-[#47D2BF]' : 'text-emerald-700'
                  : isDark ? 'text-rose-400' : 'text-red-600'
              }`}
            >
              {formatEur(results.profitPerOrder)}
            </span>
          </div>
          <div>
            <span className={`text-[11px] block ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en' ? 'Global Margin & Markup:' : 'Margen & Markup Global:'}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-base font-bold font-mono ${
                  results.marginTotal !== null && results.marginTotal >= 0.2
                    ? isDark ? 'text-white' : 'text-[#2D2825]'
                    : isDark ? 'text-amber-300' : 'text-amber-700'
                }`}
              >
                {formatPct(results.marginTotal)}
              </span>
              <span className={`text-xs font-semibold font-mono px-1.5 py-0.2 rounded border ${
                isDark
                  ? 'text-[#47D2BF] bg-[#25203D] border-[#47D2BF]/40'
                  : 'text-[#6B4ABF] bg-[#F4EEE4] border-[#D5C9B8]'
              }`}>
                Markup {formatMarkup(results.markupTotal)}
              </span>
            </div>
          </div>

          {/* ARR Metric */}
          <div className={`p-2 rounded-lg border ${
            isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
          }`}>
            <span className={`text-[10px] font-bold block uppercase tracking-wide ${
              isDark ? 'text-gray-400' : 'text-[#6D635B]'
            }`}>
              ARR (12 {language === 'en' ? 'months' : 'meses'})
            </span>
            <span className={`text-sm font-black font-mono block ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
              {formatEur(results.arrRevenue)}
            </span>
            <span className={`text-[9.5px] font-bold font-mono ${
              isDark ? 'text-[#47D2BF]' : 'text-emerald-700'
            }`}>
              +{formatEur(results.arrProfit)} {language === 'en' ? 'net' : 'neto'}
            </span>
          </div>

          {/* YRR Metric */}
          <div className={`p-2 rounded-lg border ${
            isDark ? 'bg-[#20172e] border-[#3E2748]' : 'bg-[#F4EEE4] border-[#D5C9B8]'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold block uppercase tracking-wide ${
                isDark ? 'text-rose-300' : 'text-[#6B4ABF]'
              }`}>
                YRR ({results.goLiveYear})
              </span>
              <span className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded ${
                isDark ? 'bg-rose-950/80 text-rose-300' : 'bg-purple-100/80 text-[#6B4ABF]'
              }`}>
                {results.goLiveMonthsRemainingInYear.toFixed(1)}m
              </span>
            </div>
            <span className={`text-sm font-black font-mono block ${isDark ? 'text-white' : 'text-[#6B4ABF]'}`}>
              {formatEur(results.yrrRevenue)}
            </span>
            <span className={`text-[9.5px] font-bold font-mono ${
              isDark ? 'text-[#47D2BF]' : 'text-emerald-700'
            }`}>
              +{formatEur(results.yrrProfit)} {language === 'en' ? 'net' : 'neto'}
            </span>
          </div>
        </div>
      </div>

      {/* 1. DATOS DEL CLIENTE & OPERATIVA */}
      <section className={`rounded-xl border p-5 shadow-2xs ${
        isDark ? 'bg-[#1E1B2E] border-[#2E2A48]' : 'bg-white border-[#E5DDD0]'
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 mb-4 gap-2 flex-wrap ${
          isDark ? 'border-[#2E2A48]' : 'border-[#E5DDD0]'
        }`}>
          <div className="flex items-center gap-2">
            <User className={`w-5 h-5 ${isDark ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`} />
            <h3 className={`text-sm font-bold uppercase tracking-wide ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
              {language === 'en' ? '1. Client Data & Operational Profile' : '1. Datos del Cliente & Perfil Operativo'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {onSaveClient && (
              <button
                type="button"
                onClick={onSaveClient}
                disabled={isSavingClient}
                title={language === 'en' ? 'Save client information' : 'Guardar información del cliente'}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white shadow-2xs border border-emerald-400/40 transition cursor-pointer"
              >
                {isSavingClient ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-white" />
                )}
                <span>{language === 'en' ? 'Save client' : 'Guardar cliente'}</span>
              </button>
            )}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
              isDark ? 'text-gray-300 bg-[#151226] border-[#2E2A48]' : 'text-[#6D635B] bg-[#FAF7F2] border-[#E5DDD0]'
            }`}>
              Tier {results.tierName} (×{results.skuMultiplier.toFixed(2)})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Nombre Cliente */}
          <div>
            <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-gray-300' : 'text-[#2D2825]'}`}>
              {language === 'en' ? 'Company / Client Name' : 'Nombre del Cliente / Empresa'}
            </label>
            <input
              type="text"
              value={inputs.clientName}
              onChange={(e) => onChange({ clientName: e.target.value })}
              placeholder={language === 'en' ? 'e.g. Bio Cosmetics Client' : 'Ej: Cliente Cosmética Bio'}
              className={`w-full border rounded-lg px-3 py-2 text-xs font-bold shadow-2xs focus:outline-none ${
                isDark
                  ? 'bg-[#120e26] border-[#2E2A48] text-white focus:border-[#47D2BF]'
                  : 'bg-white border-[#E5DDD0] text-[#2D2825] focus:border-[#6B4ABF]'
              }`}
            />
            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-[#8C8278]'}`}>
              {language === 'en' ? 'Appears on proposals and PDF reports.' : 'Aparece en presupuestos e informes PDF.'}
            </p>
          </div>

          {/* Warehouse / Almacén de Salida */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`block text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-gray-300' : 'text-[#2D2825]'}`}>
                <Warehouse className={`w-3.5 h-3.5 ${isDark ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`} />
                <span>{language === 'en' ? 'Territory / Warehouse' : 'Territorio / Warehouse'}</span>
              </label>
              <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded border ${
                isDark
                  ? 'text-[#47D2BF] bg-[#25203D] border-[#47D2BF]/40'
                  : 'text-[#6B4ABF] bg-[#F4EEE4] border-[#D5C9B8]'
              }`}>
                {inputs.warehouse || 'Spain'}
              </span>
            </div>
            <select
              value={inputs.warehouse || 'Spain'}
              onChange={(e) => onChange({ warehouse: e.target.value })}
              className={`w-full border rounded-lg px-3 py-2 text-xs font-bold cursor-pointer focus:outline-none ${
                isDark
                  ? 'bg-[#120e26] border-[#2E2A48] text-white focus:border-[#47D2BF]'
                  : 'bg-white border-[#E5DDD0] text-[#2D2825] focus:border-[#6B4ABF]'
              }`}
            >
              {AVAILABLE_WAREHOUSES.map((wh) => (
                <option key={wh} value={wh} className={isDark ? 'bg-[#120e26] text-white' : 'bg-white text-gray-900'}>
                  {wh}
                </option>
              ))}
              {inputs.warehouse && !AVAILABLE_WAREHOUSES.includes(inputs.warehouse) && (
                <option value={inputs.warehouse} className={isDark ? 'bg-[#120e26] text-white' : 'bg-white text-gray-900'}>
                  {inputs.warehouse} (Custom)
                </option>
              )}
            </select>
            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-[#8C8278]'}`}>
              {language === 'en'
                ? 'Territory hub: Spain, UK, USA (informational · no rate impact)'
                : 'Territorio de origen: Spain, UK, USA (informativo · no altera tarifas)'}
            </p>
          </div>

          {/* Sector / Tipo Producto */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-[#2D2825]'}`}>
              {language === 'en' ? 'Product type / Profile' : 'Tipo de producto / Perfil'}
            </label>
            <select
              value={inputs.productType}
              onChange={(e) => handleProductChange(e.target.value as ProductType)}
              className={`w-full border rounded-lg px-3 py-2 text-xs font-medium cursor-pointer focus:outline-none ${
                isDark
                  ? 'bg-[#120e26] border-[#2E2A48] text-white focus:border-[#47D2BF]'
                  : 'bg-white border-[#E5DDD0] text-[#2D2825] focus:border-[#6B4ABF]'
              }`}
            >
              {(Object.keys(PRODUCT_PROFILES) as ProductType[]).map((type) => (
                <option key={type} value={type} className={isDark ? 'bg-[#120e26] text-white' : 'bg-white text-gray-900'}>
                  {productTypeLabels[type] || type}
                </option>
              ))}
            </select>
            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-[#8C8278]'}`}>
              {language === 'en'
                ? 'Informational profile (does not affect final price)'
                : 'Perfil informativo (no influye en el precio final)'}
            </p>
          </div>

          {/* Número de SKUs */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-[#2D2825]'}`}>
              {language === 'en' ? 'Active SKUs in warehouse' : 'Número de SKUs activos'}
            </label>
            <CleanNumberInput
              min={1}
              max={50000}
              step={1}
              integerOnly={true}
              fallbackValue={1}
              value={inputs.skuCount}
              onChange={(val) => onChange({ skuCount: val })}
              className={`w-full border rounded-lg px-3 py-2 text-xs font-mono ${
                isDark
                  ? 'bg-[#120e26] border-[#2E2A48] text-white focus:border-[#47D2BF]'
                  : 'bg-white border-[#E5DDD0] text-[#2D2825] focus:border-[#6B4ABF]'
              }`}
            />
            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-[#8C8278]'}`}>
              {language === 'en'
                ? `Adjusts picking cost based on warehouse walking distance (${results.tierName}).`
                : `Ajusta el coste de picking por dispersión en nave (${results.tierName}).`}
            </p>
          </div>
        </div>

        {/* 1.2 Parámetros Operativos del Cliente: Almacenaje, Inbound, Inserts y Packaging */}
        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-[#2E2A48]' : 'border-[#E5DDD0]'}`}>
          <h4 className={`text-xs font-bold mb-2.5 flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
            <Package className={`w-4 h-4 ${isDark ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`} />
            <span>
              {language === 'en'
                ? 'Client Operational Parameters & Packaging'
                : 'Parámetros Operativos del Cliente & Embalaje'}
            </span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
            {/* Cantidad de picks x envío standard */}
            <div className={`p-3 rounded-lg border ${
              isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <label className={`block text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-[#2D2825]'}`}>
                  {language === 'en' ? 'Picks / std shipment' : 'Picks x envío standard'}
                </label>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                  isDark
                    ? 'text-[#47D2BF] bg-[#25203D] border-[#47D2BF]/40'
                    : 'text-[#6B4ABF] bg-white border-[#D5C9B8]'
                }`}>
                  {inputs.unitsPerOrder} {language === 'en' ? 'picks' : 'picks'}
                </span>
              </div>
              <CleanNumberInput
                min={1.0}
                max={50.0}
                step={0.1}
                decimals={1}
                fallbackValue={1.0}
                value={inputs.unitsPerOrder}
                onChange={(val) => onChange({ unitsPerOrder: val })}
                className={`w-full border rounded-md px-2.5 py-1.5 text-xs font-mono font-bold ${
                  isDark
                    ? 'bg-[#120e26] border-[#2E2A48] text-white focus:border-[#47D2BF]'
                    : 'bg-white border-[#E5DDD0] text-[#2D2825] focus:border-[#6B4ABF]'
                }`}
              />
              <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
                {inputs.unitsPerOrder === 1
                  ? (language === 'en' ? '1 base pick included (1st Pick)' : '1 pick base incluido (1er Pick)')
                  : (language === 'en'
                      ? `1st Pick + ${(inputs.unitsPerOrder - 1).toFixed(1)} add. picks`
                      : `1er Pick + ${(inputs.unitsPerOrder - 1).toFixed(1)} picks adic.`)}
              </p>
            </div>

            {/* Palet x week storage */}
            <div className={`p-3 rounded-lg border ${
              isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
            }`}>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-[#2D2825]'}`}>
                {language === 'en' ? 'Palet x week storage' : 'Palet x week storage'}
              </label>
              <CleanNumberInput
                min={0}
                step={1}
                fallbackValue={0}
                value={inputs.storagePalletWeeksMonth}
                onChange={(val) => onChange({ storagePalletWeeksMonth: val })}
                className={`w-full border rounded-md px-2.5 py-1.5 text-xs font-mono font-bold ${
                  isDark
                    ? 'bg-[#120e26] border-[#2E2A48] text-white focus:border-[#47D2BF]'
                    : 'bg-white border-[#E5DDD0] text-[#2D2825] focus:border-[#6B4ABF]'
                }`}
              />
              <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
                {language === 'en'
                  ? 'Pallet locations per week / month'
                  : 'Pallets almacenados por semana'}
              </p>
            </div>

            {/* Inbound goods palets */}
            <div className={`p-3 rounded-lg border ${
              isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
            }`}>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-[#2D2825]'}`}>
                {language === 'en' ? 'Inbound goods palets' : 'Inbound goods palets'}
              </label>
              <CleanNumberInput
                min={0}
                step={1}
                fallbackValue={0}
                value={inputs.goodsInPalletsMonth}
                onChange={(val) => onChange({ goodsInPalletsMonth: val })}
                className={`w-full border rounded-md px-2.5 py-1.5 text-xs font-mono font-bold ${
                  isDark
                    ? 'bg-[#120e26] border-[#2E2A48] text-white focus:border-[#47D2BF]'
                    : 'bg-white border-[#E5DDD0] text-[#2D2825] focus:border-[#6B4ABF]'
                }`}
              />
              <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
                {language === 'en'
                  ? 'Pallets received & unloaded per month'
                  : 'Pallets de entrada al mes (recepción)'}
              </p>
            </div>

            {/* Cantidad de inserts x pick */}
            <div className={`p-3 rounded-lg border ${
              isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
            }`}>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-[#2D2825]'}`}>
                {language === 'en' ? 'Cantidad de inserts x pick' : 'Cantidad de inserts x pick'}
              </label>
              <CleanNumberInput
                min={0}
                step={1}
                fallbackValue={0}
                value={inputs.insertsPerOrder}
                onChange={(val) => onChange({ insertsPerOrder: val })}
                className={`w-full border rounded-md px-2.5 py-1.5 text-xs font-mono font-bold ${
                  isDark
                    ? 'bg-[#120e26] border-[#2E2A48] text-white focus:border-[#47D2BF]'
                    : 'bg-white border-[#E5DDD0] text-[#2D2825] focus:border-[#6B4ABF]'
                }`}
              />
              <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
                {language === 'en'
                  ? 'Flyers or promotional cards / order'
                  : 'Flyers / muestras por pedido enviado'}
              </p>
            </div>

            {/* Packaging personalizado (si o no) */}
            <div className={`p-3 rounded-lg border transition-colors ${
              inputs.customPackaging
                ? isDark
                  ? 'bg-[#25203D] border-[#47D2BF]/50'
                  : 'bg-[#F4EEE4] border-[#D5C9B8]'
                : isDark
                ? 'bg-[#151226] border-[#2E2A48]'
                : 'bg-[#FAF7F2] border-[#E5DDD0]'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-[#2D2825]'}`}>
                  {language === 'en' ? 'Packaging personalizado' : 'Packaging personalizado'}
                </label>
                {inputs.customPackaging && (
                  <span className={`text-[9px] font-bold px-1 py-0.2 rounded border ${
                    isDark
                      ? 'text-[#47D2BF] bg-[#120e26] border-[#47D2BF]/40'
                      : 'text-[#6B4ABF] bg-[#FAF7F2] border-[#D5C9B8]'
                  }`}>
                    {language === 'en' ? 'Active' : 'Activo'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onChange({ customPackaging: true })}
                  className={`py-1 text-xs font-bold rounded border transition cursor-pointer flex items-center justify-center gap-1 ${
                    inputs.customPackaging
                      ? isDark
                        ? 'bg-[#47D2BF] text-[#120e26] border-[#47D2BF] shadow-xs'
                        : 'bg-[#6B4ABF] text-white border-[#6B4ABF] shadow-xs'
                      : isDark
                      ? 'bg-[#120e26] text-gray-400 border-[#2E2A48] hover:bg-[#151226]'
                      : 'bg-white text-[#6D635B] border-[#E5DDD0] hover:bg-gray-50'
                  }`}
                >
                  <Check className={`w-3 h-3 ${inputs.customPackaging ? 'opacity-100' : 'opacity-0'}`} />
                  {language === 'en' ? 'Yes' : 'Sí'}
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ customPackaging: false })}
                  className={`py-1 text-xs font-bold rounded border transition cursor-pointer flex items-center justify-center gap-1 ${
                    !inputs.customPackaging
                      ? isDark
                        ? 'bg-[#2E2A48] text-white border-[#47D2BF]/40 shadow-xs'
                        : 'bg-[#2D2825] text-white border-[#2D2825] shadow-xs'
                      : isDark
                      ? 'bg-[#120e26] text-gray-400 border-[#2E2A48] hover:bg-[#151226]'
                      : 'bg-white text-[#6D635B] border-[#E5DDD0] hover:bg-gray-50'
                  }`}
                >
                  {!inputs.customPackaging && <Check className="w-3 h-3" />}
                  No
                </button>
              </div>

              <p className={`text-[10px] mt-1.5 leading-tight ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
                {inputs.customPackaging
                  ? (language === 'en'
                      ? `✓ Own custom packaging. Base packaging per order is cancelled (${formatEur(0)}).`
                      : `✓ Embalaje propio. El packaging base por pedido se cancela (${formatEur(0)}).`)
                  : (language === 'en'
                      ? 'Client uses standard base packaging.'
                      : 'Se aplica packaging base estándar.')}
              </p>
            </div>
          </div>
        </div>

        {/* Tecnología / Plataformas de Venta */}
        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-[#2E2A48]' : 'border-[#E5DDD0]'}`}>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Globe className={`w-4 h-4 ${isDark ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`} />
              <label className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                {language === 'en' ? 'Technology / E-commerce Platforms' : 'Tecnología / Plataformas de Venta'}
              </label>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isDark
                  ? 'text-[#47D2BF] bg-[#25203D] border-[#47D2BF]/30'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200'
              }`}>
                {language === 'en' ? 'No price impact · For client sheet & operations' : 'No varía el precio · Informativo para la ficha'}
              </span>
            </div>
            <span className={`text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {currentTechs.length}{' '}
              {language === 'en'
                ? currentTechs.length === 1 ? 'platform selected' : 'platforms selected'
                : currentTechs.length === 1 ? 'canal seleccionado' : 'canales seleccionados'}
            </span>
          </div>

          <p className={`text-[11px] mb-2.5 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
            {language === 'en'
              ? 'Select all the platforms or marketplaces the client sells through to include in the client sheet, quote, and report.'
              : 'Selecciona todas las plataformas o marketplaces con los que opera el cliente para incluirlos en su ficha, cotización e informe.'}
          </p>

          {/* Chips list */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            {AVAILABLE_TECHNOLOGIES.map((tech) => {
              const isSelected = currentTechs.includes(tech);
              return (
                <button
                  key={tech}
                  type="button"
                  onClick={() => toggleTechnology(tech)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition cursor-pointer border ${
                    isSelected
                      ? isDark
                        ? 'bg-[#47D2BF] text-[#120e26] border-[#47D2BF] font-bold shadow-2xs'
                        : 'bg-[#6B4ABF] text-white border-[#6B4ABF] font-bold shadow-2xs'
                      : isDark
                      ? 'bg-[#151226] hover:bg-[#25203D] text-gray-300 border-[#2E2A48] hover:border-[#47D2BF]/40 font-medium'
                      : 'bg-[#FAF7F2] hover:bg-white text-[#2D2825] border-[#E5DDD0] hover:border-[#D5C9B8] font-medium'
                  }`}
                >
                  {isSelected ? (
                    <Check className={`w-3 h-3 stroke-[3] ${isDark ? 'text-[#120e26]' : 'text-white'}`} />
                  ) : (
                    <Plus className={`w-3 h-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  )}
                  <span>{tech}</span>
                </button>
              );
            })}

            {/* Custom tags that aren't in AVAILABLE_TECHNOLOGIES */}
            {currentTechs
              .filter((t) => !AVAILABLE_TECHNOLOGIES.includes(t))
              .map((customTech) => (
                <button
                  key={customTech}
                  type="button"
                  onClick={() => toggleTechnology(customTech)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer border ${
                    isDark
                      ? 'bg-[#25203D] text-[#47D2BF] border-[#47D2BF]/40'
                      : 'bg-[#2D2825] text-white border-[#2D2825]'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>{customTech}</span>
                  <X className="w-3 h-3 opacity-70 hover:opacity-100" />
                </button>
              ))}
          </div>

          {/* Custom tech input */}
          <div className="flex items-center gap-2 max-w-md">
            <input
              type="text"
              value={customTechInput}
              onChange={(e) => setCustomTechInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (customTechInput.trim()) {
                    addCustomTech(customTechInput);
                    setCustomTechInput('');
                  }
                }
              }}
              placeholder={
                language === 'en'
                  ? 'Add other technology (e.g. Mirakl, Odoo, Custom ERP...)'
                  : 'Añadir otra tecnología (ej: Mirakl, Odoo, ERP Propio...)'
              }
              className={`flex-1 border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none ${
                isDark
                  ? 'bg-[#120e26] border-[#2E2A48] text-white focus:border-[#47D2BF]'
                  : 'bg-white border-[#E5DDD0] text-[#2D2825] focus:border-[#6B4ABF]'
              }`}
            />
            <button
              type="button"
              onClick={() => {
                if (customTechInput.trim()) {
                  addCustomTech(customTechInput);
                  setCustomTechInput('');
                }
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer shrink-0 ${
                isDark
                  ? 'bg-[#47D2BF] hover:bg-[#47D2BF]/80 text-[#120e26]'
                  : 'bg-[#6B4ABF] hover:bg-[#583aa3] text-white'
              }`}
            >
              {language === 'en' ? '+ Add' : '+ Añadir'}
            </button>
          </div>
        </div>

        {/* Client Notes & Pack Cost Source */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-3 border-t ${isDark ? 'border-[#2E2A48]' : 'border-[#E5DDD0]'}`}>
          <div className="md:col-span-2">
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-[#2D2825]'}`}>
              {language === 'en' ? 'Client notes / Operational specifications' : 'Notas del cliente / Especificaciones de la operativa'}
            </label>
            <textarea
              rows={2}
              value={inputs.clientNotes || ''}
              onChange={(e) => onChange({ clientNotes: e.target.value })}
              placeholder={language === 'en' ? 'e.g. Special packaging with kraft paper, Shopify integration, 2 yearly collections...' : 'Ej: Embalaje especial con papel kraft, cliente requiere integración Shopify, 2 colecciones anuales...'}
              className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none ${
                isDark
                  ? 'bg-[#120e26] border-[#2E2A48] text-white focus:border-[#47D2BF]'
                  : 'bg-white border-[#E5DDD0] text-[#2D2825] focus:border-[#6B4ABF]'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-[#2D2825]'}`}>
              {language === 'en' ? 'Base pack cost source' : 'Fuente de coste pack base'}
            </label>
            <div className={`w-full border rounded-lg p-2.5 text-xs flex flex-col justify-between ${
              isDark
                ? 'border-emerald-700/50 bg-emerald-950/40'
                : 'border-emerald-200 bg-emerald-50/70'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-950'}`}>
                  {language === 'en' ? 'Calculator (negotiated)' : 'Calculadora (negociado)'}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  isDark
                    ? 'bg-emerald-900/80 text-emerald-200'
                    : 'bg-emerald-200/80 text-emerald-900'
                }`}>
                  {language === 'en' ? 'Active' : 'Activo'}
                </span>
              </div>
              <p className={`text-[10px] mt-1 ${isDark ? 'text-emerald-400/90' : 'text-emerald-800/80'}`}>
                {language === 'en'
                  ? 'Real material costs agreed with procurement and cardboard suppliers.'
                  : 'Costes reales de material pactados con compras y proveedores de cartón.'}
              </p>
            </div>
          </div>
        </div>

        {/* Planificación Interna: Calendario Go-Live & ARR / YRR */}
        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-[#2E2A48]' : 'border-[#E5DDD0]'}`}>
          <LiveDateScheduler
            goLiveDate={inputs.goLiveDate}
            results={results}
            onChange={(dateStr) => onChange({ goLiveDate: dateStr })}
          />
        </div>
      </section>

      {/* 2. VOLUMEN Y ÓRDENES */}
      <section className={`rounded-xl border p-5 shadow-2xs ${
        isDark ? 'bg-[#1E1B2E] border-[#2E2A48]' : 'bg-white border-[#E5DDD0]'
      }`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 mb-4 gap-2 ${
          isDark ? 'border-[#2E2A48]' : 'border-[#E5DDD0]'
        }`}>
          <div className="flex items-center gap-2">
            <Layers className={`w-5 h-5 ${isDark ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`} />
            <h3 className={`text-sm font-bold uppercase tracking-wide ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
              {language === 'en' ? '2. Order Volume & Average Basket' : '2. Volumen y Órdenes Medias'}
            </h3>
          </div>
          <span className={`text-xs font-mono ${isDark ? 'text-gray-300' : 'text-[#6D635B]'}`}>
            {language === 'en' ? 'Monthly total: ' : 'Total mes: '}
            <strong className={isDark ? 'text-white' : 'text-[#2D2825]'}>{results.ordersMonth.toLocaleString(language === 'en' ? 'en-US' : 'es-ES')}</strong> {language === 'en' ? 'orders' : 'pedidos'} (
            <strong className={isDark ? 'text-white' : 'text-[#2D2825]'}>{(results.ordersMonth * results.unitsPerOrder).toLocaleString(language === 'en' ? 'en-US' : 'es-ES', { maximumFractionDigits: 0 })}</strong> {language === 'en' ? 'units/month' : 'units/mes'})
            {inputs.returnRate > 0 && (
              <> · <span className={isDark ? 'text-amber-300 font-semibold' : 'text-amber-700 font-semibold'}>{Math.round(results.ordersMonth * inputs.returnRate).toLocaleString(language === 'en' ? 'en-US' : 'es-ES')} {language === 'en' ? 'returns' : 'devoluciones'} ({(inputs.returnRate * 100).toFixed(1)}%)</span></>
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Modalidad de volumen */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-[#2D2825]'}`}>
              {language === 'en' ? 'Calculation mode' : 'Modalidad de cálculo'}
            </label>
            <div className={`grid grid-cols-2 gap-1.5 p-0.5 rounded-lg border ${
              isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
            }`}>
              <button
                type="button"
                onClick={() => onChange({ volumeMode: 'Pedidos/día' })}
                className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                  inputs.volumeMode === 'Pedidos/día'
                    ? isDark
                      ? 'bg-[#25203D] text-[#47D2BF] shadow-xs'
                      : 'bg-white text-[#6B4ABF] shadow-xs'
                    : isDark
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-[#6D635B] hover:text-[#2D2825]'
                }`}
              >
                {language === 'en' ? 'Orders / day' : 'Pedidos / día'}
              </button>
              <button
                type="button"
                onClick={() => onChange({ volumeMode: 'Pedidos/mes' })}
                className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                  inputs.volumeMode === 'Pedidos/mes'
                    ? isDark
                      ? 'bg-[#25203D] text-[#47D2BF] shadow-xs'
                      : 'bg-white text-[#6B4ABF] shadow-xs'
                    : isDark
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-[#6D635B] hover:text-[#2D2825]'
                }`}
              >
                {language === 'en' ? 'Orders / month' : 'Pedidos / mes'}
              </button>
            </div>
            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-[#8C8278]'}`}>
              {language === 'en' ? 'Define if quote is based on daily or monthly volume.' : 'Define si el cliente cotiza por día o mes.'}
            </p>
          </div>

          {/* Días Laborables */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-[#2D2825]'}`}>
              {language === 'en' ? 'Working days / month' : 'Días laborables / mes'}
            </label>
            <CleanNumberInput
              min={1}
              max={31}
              step={1}
              integerOnly={true}
              fallbackValue={22}
              value={inputs.workingDays}
              onChange={(val) => onChange({ workingDays: val })}
              className={`w-full border rounded-lg px-3 py-2 text-xs font-mono font-medium ${
                isDark
                  ? 'bg-[#120e26] border-[#2E2A48] text-white focus:border-[#47D2BF]'
                  : 'bg-white border-[#E5DDD0] text-[#2D2825] focus:border-[#6B4ABF]'
              }`}
            />
            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-[#8C8278]'}`}>
              {language === 'en' ? 'Standard reference: 21-22 days/month.' : 'Estándar nacional: 21-22 días/mes.'}
            </p>
          </div>

          {/* Pedidos por día / mes sincronizados */}
          {inputs.volumeMode === 'Pedidos/día' ? (
            <div>
              <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                {language === 'en' ? 'Orders / day (Input)' : 'Pedidos / día (Entrada)'}
              </label>
              <CleanNumberInput
                min={0}
                step={1}
                fallbackValue={0}
                value={inputs.ordersPerDay}
                onChange={(val) => {
                  onChange({
                    ordersPerDay: val,
                    ordersMonth: val * inputs.workingDays,
                  });
                }}
                className={`w-full border-2 rounded-lg px-3 py-2 text-xs font-mono font-black ${
                  isDark
                    ? 'bg-[#20172e] border-[#47D2BF]/60 text-white'
                    : 'bg-[#F4EEE4] border-[#D5C9B8] text-[#2D2825]'
                }`}
              />
              <p className={`text-[10px] mt-1 font-mono ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
                = {results.ordersMonth.toLocaleString(language === 'en' ? 'en-US' : 'es-ES')} {language === 'en' ? 'ord/month' : 'ped/mes'}
              </p>
            </div>
          ) : (
            <div>
              <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                {language === 'en' ? 'Orders / month (Input)' : 'Pedidos / mes (Entrada)'}
              </label>
              <CleanNumberInput
                min={0}
                step={10}
                integerOnly={true}
                fallbackValue={0}
                value={inputs.ordersMonth}
                onChange={(val) => {
                  onChange({
                    ordersMonth: val,
                    ordersPerDay: inputs.workingDays > 0 ? val / inputs.workingDays : 0,
                  });
                }}
                className={`w-full border-2 rounded-lg px-3 py-2 text-xs font-mono font-black ${
                  isDark
                    ? 'bg-[#20172e] border-[#47D2BF]/60 text-white'
                    : 'bg-[#F4EEE4] border-[#D5C9B8] text-[#2D2825]'
                }`}
              />
              <p className={`text-[10px] mt-1 font-mono ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
                = {results.ordersPerDay.toFixed(1)} {language === 'en' ? 'ord/day' : 'ped/día'}
              </p>
            </div>
          )}

          {/* Unidades por pedido */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className={`block text-xs font-medium ${isDark ? 'text-gray-300' : 'text-[#2D2825]'}`}>
                {language === 'en' ? 'Picks / units per shipment (Basket)' : 'Picks / units x envío standard (Cesta)'}
              </label>
              <span className={`font-mono font-bold text-xs px-1.5 py-0.2 rounded border ${
                isDark
                  ? 'text-[#47D2BF] bg-[#25203D] border-[#47D2BF]/40'
                  : 'text-[#6B4ABF] bg-[#FAF7F2] border-[#D5C9B8]'
              }`}>
                {inputs.unitsPerOrder} {language === 'en' ? 'picks' : 'picks'}
              </span>
            </div>
            <CleanNumberInput
              min={1.0}
              max={50.0}
              step={0.1}
              decimals={1}
              fallbackValue={1.0}
              value={inputs.unitsPerOrder}
              onChange={(val) => onChange({ unitsPerOrder: val })}
              className={`w-full border rounded-lg px-3 py-2 text-xs font-mono font-medium ${
                isDark
                  ? 'bg-[#120e26] border-[#2E2A48] text-white focus:border-[#47D2BF]'
                  : 'bg-white border-[#E5DDD0] text-[#2D2825] focus:border-[#6B4ABF]'
              }`}
            />
            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-[#8C8278]'}`}>
              {inputs.unitsPerOrder === 1
                ? (language === 'en' ? '1st Pick only (1 unit/order).' : '1er Pick únicamente (1 ud/ped).')
                : (language === 'en'
                    ? `1st Pick + ${(inputs.unitsPerOrder - 1).toFixed(1)} extra picks.`
                    : `1er Pick + ${(inputs.unitsPerOrder - 1).toFixed(1)} picks extra.`)}
            </p>
          </div>

          {/* % Devoluciones */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className={`block text-xs font-medium ${isDark ? 'text-gray-300' : 'text-[#2D2825]'}`}>
                {language === 'en' ? 'Return rate (%)' : '% Devoluciones'}
              </label>
              <span className={`font-mono font-bold text-xs px-1.5 py-0.2 rounded border ${
                isDark
                  ? 'text-amber-300 bg-amber-950/60 border-amber-800/60'
                  : 'text-amber-700 bg-amber-50 border-amber-200'
              }`}>
                {(inputs.returnRate * 100).toFixed(1)}%
              </span>
            </div>
            <CleanNumberInput
              min={0}
              max={100}
              step={0.5}
              decimals={1}
              fallbackValue={0}
              value={Math.round(inputs.returnRate * 1000) / 10}
              onChange={(val) => onChange({ returnRate: val / 100 })}
              className={`w-full border rounded-lg px-3 py-2 text-xs font-mono font-medium ${
                isDark
                  ? 'bg-[#120e26] border-[#2E2A48] text-white focus:border-[#47D2BF]'
                  : 'bg-white border-[#E5DDD0] text-[#2D2825] focus:border-[#6B4ABF]'
              }`}
            />
            <p className={`text-[10px] mt-1 font-mono ${isDark ? 'text-gray-500' : 'text-[#8C8278]'}`}>
              {language === 'en'
                ? `≈ ${Math.round(results.ordersMonth * inputs.returnRate).toLocaleString('en-US')} returns/month`
                : `≈ ${Math.round(results.ordersMonth * inputs.returnRate).toLocaleString('es-ES')} devoluciones/mes`}
            </p>
          </div>
        </div>
      </section>

      {/* 3. MIX DE PACK */}
      <section className={`rounded-xl border p-5 shadow-2xs ${
        isDark ? 'bg-[#1E1B2E] border-[#2E2A48]' : 'bg-white border-[#E5DDD0]'
      }`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 mb-4 gap-2 ${
          isDark ? 'border-[#2E2A48]' : 'border-[#E5DDD0]'
        }`}>
          <div className="flex items-center gap-2">
            <Package className={`w-5 h-5 ${isDark ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`} />
            <h3 className={`text-sm font-bold uppercase tracking-wide ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
              {language === 'en' ? '3. Packaging Pack Mix' : '3. Mix de Pack de Embalaje'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono ${isDark ? 'text-gray-300' : 'text-[#6D635B]'}`}>
              {language === 'en' ? 'Weighted average pack cost: ' : 'Coste medio ponderado del pack: '}
              <strong className={`text-sm ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>{formatEur(results.packCost)}</strong>
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                mixTotal === 100
                  ? isDark
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isDark
                  ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {language === 'en' ? 'Sum: ' : 'Suma: '}{mixTotal}%
            </span>
          </div>
        </div>

        {/* Quick Presets & Normalizer */}
        <div className={`flex flex-wrap items-center justify-between gap-2 mb-4 p-2.5 rounded-lg border ${
          isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
        }`}>
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className={`text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en' ? 'Common distributions:' : 'Distribuciones comunes:'}
            </span>
            <button
              type="button"
              onClick={() => applyMixPreset(0, 0, 50, 50)}
              className={`px-2 py-1 text-[11px] rounded font-medium cursor-pointer border transition ${
                isDark
                  ? 'bg-[#1E1B2E] hover:bg-[#25203D] text-gray-200 border-[#2E2A48]'
                  : 'bg-white hover:bg-gray-100 text-[#4D453E] border-[#E5DDD0]'
              }`}
            >
              50% MPL / 50% LPL ({language === 'en' ? 'Standard' : 'Estándar'})
            </button>
            <button
              type="button"
              onClick={() => applyMixPreset(50, 50, 0, 0)}
              className={`px-2 py-1 text-[11px] rounded font-medium cursor-pointer border transition ${
                isDark
                  ? 'bg-[#1E1B2E] hover:bg-[#25203D] text-gray-200 border-[#2E2A48]'
                  : 'bg-white hover:bg-gray-100 text-[#4D453E] border-[#E5DDD0]'
              }`}
            >
              50% SPK / 50% SPL ({language === 'en' ? 'Small' : 'Pequeño'})
            </button>
            <button
              type="button"
              onClick={() => applyMixPreset(25, 25, 25, 25)}
              className={`px-2 py-1 text-[11px] rounded font-medium cursor-pointer border transition ${
                isDark
                  ? 'bg-[#1E1B2E] hover:bg-[#25203D] text-gray-200 border-[#2E2A48]'
                  : 'bg-white hover:bg-gray-100 text-[#4D453E] border-[#E5DDD0]'
              }`}
            >
              25% {language === 'en' ? 'Uniform' : 'Uniforme'}
            </button>
            <button
              type="button"
              onClick={() => applyMixPreset(0, 0, 100, 0)}
              className={`px-2 py-1 text-[11px] rounded font-medium cursor-pointer border transition ${
                isDark
                  ? 'bg-[#1E1B2E] hover:bg-[#25203D] text-gray-200 border-[#2E2A48]'
                  : 'bg-white hover:bg-gray-100 text-[#4D453E] border-[#E5DDD0]'
              }`}
            >
              100% MPL
            </button>
          </div>

          {mixTotal !== 100 && (
            <button
              type="button"
              onClick={normalizeMix}
              className={`px-2.5 py-1 text-xs font-bold rounded shadow-2xs transition cursor-pointer ${
                isDark
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              {language === 'en' ? 'Normalize to 100%' : 'Normalizar al 100%'}
            </button>
          )}
        </div>

        {/* 4 Pack Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(
            [
              {
                key: 'mixSpk',
                label: 'SPK (Small Packet)',
                cost: 0.66,
                desc: language === 'en' ? 'Flyer / small envelope' : 'Sobre / paquete pequeño',
              },
              {
                key: 'mixSpl',
                label: 'SPL (Small Parcel)',
                cost: 0.66,
                desc: language === 'en' ? 'Small box (up to 1-2kg)' : 'Caja pequeña (hasta 1-2kg)',
              },
              {
                key: 'mixMpl',
                label: 'MPL (Medium Parcel)',
                cost: 1.00,
                desc: language === 'en' ? 'Medium standard box' : 'Caja mediana estándar',
              },
              {
                key: 'mixLpl',
                label: 'LPL (Large Parcel)',
                cost: 1.15,
                desc: language === 'en' ? 'Large bulky box' : 'Caja grande voluminosa',
              },
            ] as const
          ).map((item) => (
            <div key={item.key} className={`p-3 rounded-lg border ${
              isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>{item.label}</span>
                <span className={`text-xs font-mono font-black px-1.5 py-0.2 rounded border ${
                  isDark
                    ? 'text-[#47D2BF] bg-[#25203D] border-[#47D2BF]/40'
                    : 'text-[#6B4ABF] bg-white border-[#E5DDD0]'
                }`}>
                  {inputs[item.key]}%
                </span>
              </div>
              <div className={`text-[10px] mb-2 flex justify-between ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
                <span>{item.desc}</span>
                <span className="font-mono font-semibold">{language === 'en' ? 'Cost: ' : 'Coste: '}{formatEur(item.cost)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={inputs[item.key]}
                onChange={(e) => onChange({ [item.key]: Number(e.target.value) })}
                className={`w-full h-1.5 rounded cursor-pointer ${
                  isDark ? 'accent-[#47D2BF] bg-[#2E2A48]' : 'accent-[#6B4ABF] bg-[#E5DDD0]'
                }`}
              />
              <div className="flex justify-end mt-1">
                <CleanNumberInput
                  min={0}
                  max={100}
                  step={1}
                  integerOnly={true}
                  fallbackValue={0}
                  value={inputs[item.key]}
                  onChange={(val) => onChange({ [item.key]: val })}
                  className={`w-16 text-right border rounded px-1.5 py-0.5 text-xs font-mono ${
                    isDark
                      ? 'bg-[#120e26] border-[#2E2A48] text-white'
                      : 'bg-white border-[#E5DDD0] text-[#2D2825]'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. PREPARACIÓN BASE (PACK) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Package className={`w-5 h-5 ${isDark ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`} />
            <h3 className={`text-sm font-bold uppercase tracking-wide ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
              {language === 'en' ? '4. Base Preparation (Pack)' : '4. Preparación Base (Pack)'}
            </h3>
          </div>
          <span className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
            {language === 'en' ? 'Pack material mix cost: ' : 'Coste mix material packaging: '}
            <strong className={isDark ? 'text-white' : 'text-[#2D2825]'}>{formatEur(results.packCost)}</strong>
          </span>
        </div>

        <PriceMarginRow
          label={language === 'en' ? 'Base preparation (Pack)' : 'Preparación base (Pack)'}
          subLabel={
            language === 'en'
              ? 'Packaging material cost according to weighted mix or custom negotiated cost'
              : 'Coste del material de embalaje según mix ponderado o coste directo'
          }
          cost={results.packCost}
          defaultCost={results.packDefaultCost}
          mode={inputs.packPriceMode}
          marginTarget={inputs.packMarginTarget}
          manualPrice={results.packPrice}
          allowCostEdit={true}
          onCostChange={(c) => onChange({ packCostOverride: c })}
          onResetCost={() => onChange({ packCostOverride: null })}
          onModeChange={(m) => onChange({ packPriceMode: m })}
          onMarginChange={(mg) => onChange({ packMarginTarget: mg })}
          onPriceChange={(p) => onChange({ packPriceManual: p })}
        />
      </section>

      {/* 5. PRIMER PICK DEL PEDIDO */}
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Layers className={`w-5 h-5 ${isDark ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`} />
            <h3 className={`text-sm font-bold uppercase tracking-wide ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
              {language === 'en' ? '5. First Pick of Order (1st Unit)' : '5. Primer Pick del Pedido (1ª Unidad)'}
            </h3>
          </div>
          <span className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
            {language === 'en' ? 'Adjusted pick cost: ' : 'Coste ajustado pick: '}
            <strong className={isDark ? 'text-white' : 'text-[#2D2825]'}>{formatEur(results.firstPickCost)}</strong>
          </span>
        </div>

        <PriceMarginRow
          label={language === 'en' ? 'First Pick of order (1st unit included)' : 'Primer Pick del pedido (1ª unidad)'}
          subLabel={
            language === 'en'
              ? `Cost adjusted by SKU tier (×${results.skuMultiplier.toFixed(2)})`
              : `Coste ajustado por SKU (×${results.skuMultiplier.toFixed(2)})`
          }
          cost={results.firstPickCost}
          defaultCost={results.firstPickDefaultCost}
          mode={inputs.firstPickPriceMode}
          marginTarget={inputs.firstPickMarginTarget}
          manualPrice={results.firstPickPrice}
          allowCostEdit={true}
          onCostChange={(c) => onChange({ firstPickCostOverride: c })}
          onResetCost={() => onChange({ firstPickCostOverride: null })}
          onModeChange={(m) => onChange({ firstPickPriceMode: m })}
          onMarginChange={(mg) => onChange({ firstPickMarginTarget: mg })}
          onPriceChange={(p) => onChange({ firstPickPriceManual: p })}
        />
      </section>

      {/* 6. PICKS ADICIONALES */}
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className={`text-sm font-bold uppercase tracking-wide ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
            {language === 'en' ? '6. Additional Picks (Extra units > 1)' : '6. Picks Adicionales (Unidades extra > 1)'}
          </h3>
          <span className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
            {language === 'en'
              ? `With ${results.unitsPerOrder} units/order = ${(results.unitsPerOrder - 1).toFixed(1)} extra picks / order`
              : `Con ${results.unitsPerOrder} units/pedido = ${(results.unitsPerOrder - 1).toFixed(1)} picks extra / ped`}
          </span>
        </div>

        <PriceMarginRow
          label={language === 'en' ? 'Additional pick per unit' : 'Pick adicional por unidad'}
          subLabel={
            language === 'en'
              ? `Applies starting from 2nd unit in basket (Standard cost: ${formatEur(results.additionalPickDefaultCost)})`
              : `Aplica a partir de la 2ª unidad en la orden de compra (Coste estándar: ${formatEur(results.additionalPickDefaultCost)})`
          }
          cost={results.additionalPickCost}
          defaultCost={results.additionalPickDefaultCost}
          mode={inputs.additionalPickPriceMode}
          marginTarget={inputs.additionalPickMarginTarget}
          manualPrice={results.additionalPickPrice}
          allowCostEdit={true}
          onCostChange={(c) => onChange({ additionalPickCostOverride: c })}
          onResetCost={() => onChange({ additionalPickCostOverride: null })}
          onModeChange={(m) => onChange({ additionalPickPriceMode: m })}
          onMarginChange={(mg) => onChange({ additionalPickMarginTarget: mg })}
          onPriceChange={(p) => onChange({ additionalPickPriceManual: p })}
        />
      </section>

      {/* 7. ENVÍO (CARRIER) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Truck className={`w-5 h-5 ${isDark ? 'text-[#47D2BF]' : 'text-blue-600'}`} />
            <h3 className={`text-sm font-bold uppercase tracking-wide ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
              {language === 'en' ? '7. Shipping (Carrier Cost + Transport Margin)' : '7. Envío (Carrier Cost + Margen de Transporte)'}
            </h3>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
            isDark
              ? 'text-[#47D2BF] bg-[#25203D] border-[#47D2BF]/40'
              : 'text-blue-700 bg-blue-50 border-blue-200'
          }`}>
            {language === 'en' ? 'Shipping sale price: ' : 'Venta Envío: '}
            {formatEur(results.shippingPrice)} ({language === 'en' ? 'Margin: ' : 'Margen: '}{formatPct(results.shippingMargin)} | Markup:{' '}
            {formatMarkup(results.shippingMarkup)})
          </span>
        </div>

        <PriceMarginRow
          label={language === 'en' ? 'National standard carrier shipment' : 'Envío Carrier nacional / estándar peninsular'}
          subLabel={language === 'en' ? 'Contracted transport cost + commercial intermediation margin' : 'Coste de transporte contratado + margen de intermediación comercial'}
          cost={inputs.carrierCost}
          mode={inputs.shippingPriceMode}
          marginTarget={inputs.shippingMarginTarget}
          manualPrice={results.shippingPrice}
          allowCostEdit={true}
          onCostChange={(c) => onChange({ carrierCost: c })}
          onModeChange={(m) => onChange({ shippingPriceMode: m })}
          onMarginChange={(mg) => onChange({ shippingMarginTarget: mg })}
          onPriceChange={(p) => onChange({ shippingPriceManual: p })}
        />
      </section>

      {/* 8. SERVICIOS ADICIONALES & ALMACENAJE */}
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className={`text-sm font-bold uppercase tracking-wide ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
            {language === 'en' ? '8. Additional Services & Storage' : '8. Servicios Adicionales & Almacenaje'}
          </h3>
          <span className={`text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
            {language === 'en' ? 'Direct unit rates & margins' : 'Tarifas unitarias directas y márgenes'}
          </span>
        </div>

        {inputs.customPackaging && (
          <div className={`rounded-lg p-3 text-xs flex items-center justify-between gap-3 shadow-2xs border ${
            isDark
              ? 'bg-[#25203D] border-[#47D2BF]/40 text-gray-200'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-2">
              <Package className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#47D2BF]' : 'text-amber-600'}`} />
              <span>
                {language === 'en'
                  ? `Client custom packaging is ACTIVE: Base packaging fee and cost are cancelled (${formatEur(0)} / order) in operational calculations and client quote.`
                  : `Packaging personalizado del cliente ACTIVO: El coste y tarifa de packaging base están cancelados (${formatEur(0)} / pedido) en los cálculos e informe.`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onChange({ customPackaging: false })}
              className={`text-[11px] font-semibold underline shrink-0 cursor-pointer ${
                isDark ? 'text-[#47D2BF] hover:text-[#47D2BF]/80' : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              {language === 'en' ? 'Revert to Base' : 'Revertir a Base'}
            </button>
          </div>
        )}

        <PriceMarginRow
          label={language === 'en' ? 'Base packaging per order' : 'Packaging base por pedido'}
          subLabel={
            inputs.customPackaging
              ? (language === 'en'
                  ? `Client supplies own packaging · Base fee is ${formatEur(0)}`
                  : `El cliente suministra su propio packaging · Tarifa de base es ${formatEur(0)}`)
              : (language === 'en'
                  ? 'Standard boxes, branded tape or void fill'
                  : 'Cajas estándar, cinta personalizada o precinto')
          }
          cost={inputs.customPackaging ? 0 : inputs.packagingCost}
          mode="price"
          hideMarginButton={true}
          badge={
            inputs.customPackaging ? (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                isDark
                  ? 'text-[#47D2BF] bg-[#120e26] border-[#47D2BF]/40'
                  : 'text-amber-700 bg-amber-50 border-amber-300'
              }`}>
                {language === 'en' ? 'Cancelled (Custom Packaging)' : 'Cancelado (Packaging Personalizado)'}
              </span>
            ) : undefined
          }
          marginTarget={
            inputs.customPackaging
              ? 0
              : inputs.packagingPrice > 0
              ? (inputs.packagingPrice - inputs.packagingCost) / inputs.packagingPrice
              : 0
          }
          manualPrice={inputs.customPackaging ? 0 : inputs.packagingPrice}
          allowCostEdit={!inputs.customPackaging}
          onCostChange={(c) => onChange({ packagingCost: c })}
          onModeChange={() => {}}
          onMarginChange={(mg) => {
            const p = priceFromCostMargin(inputs.packagingCost, mg);
            onChange({ packagingPrice: Number(p.toFixed(2)) });
          }}
          onPriceChange={(p) => onChange({ packagingPrice: p })}
        />

        <PriceMarginRow
          label={language === 'en' ? 'Marketing inserts / flyers (per unit)' : 'Inserts publicitarios / flyers (por unidad)'}
          subLabel={language === 'en' ? 'Promotional brochure, sample or thank-you card included in parcel' : 'Folleto promocional, muestra o tarjeta incluida en el paquete'}
          cost={inputs.insertCost}
          mode="price"
          hideMarginButton={true}
          marginTarget={
            inputs.insertPrice > 0
              ? (inputs.insertPrice - inputs.insertCost) / inputs.insertPrice
              : 0
          }
          manualPrice={inputs.insertPrice}
          allowCostEdit={true}
          onCostChange={(c) => onChange({ insertCost: c })}
          onModeChange={() => {}}
          onMarginChange={(mg) => {
            const p = priceFromCostMargin(inputs.insertCost, mg);
            onChange({ insertPrice: Number(p.toFixed(2)) });
          }}
          onPriceChange={(p) => onChange({ insertPrice: p })}
        />

        <PriceMarginRow
          label={language === 'en' ? 'Returns Handling (per returned unit)' : 'Gestión de Devoluciones (Returns por unidad)'}
          subLabel={language === 'en' ? 'Inspection, condition check, refurbishing and restocking' : 'Inspección, control de estado, reacondicionamiento y retorno a stock'}
          cost={inputs.returnHandlingCost}
          mode="price"
          hideMarginButton={true}
          marginTarget={
            inputs.returnHandlingPrice > 0
              ? (inputs.returnHandlingPrice - inputs.returnHandlingCost) / inputs.returnHandlingPrice
              : 0
          }
          manualPrice={inputs.returnHandlingPrice}
          allowCostEdit={true}
          onCostChange={(c) => onChange({ returnHandlingCost: c })}
          onModeChange={() => {}}
          onMarginChange={(mg) => {
            const p = priceFromCostMargin(inputs.returnHandlingCost, mg);
            onChange({ returnHandlingPrice: Number(p.toFixed(2)) });
          }}
          onPriceChange={(p) => onChange({ returnHandlingPrice: p })}
        />

        <PriceMarginRow
          label={language === 'en' ? 'Pallet Goods-in (intake per pallet)' : 'Recepción de pallets (Goods-in por pallet)'}
          subLabel={language === 'en' ? 'Truck unloading, ASN matching and rack put-away' : 'Descarga de camión, control contra albarán y ubicación en rack'}
          cost={inputs.goodsInCost}
          mode="price"
          hideMarginButton={true}
          marginTarget={
            inputs.goodsInPrice > 0
              ? (inputs.goodsInPrice - inputs.goodsInCost) / inputs.goodsInPrice
              : 0
          }
          manualPrice={inputs.goodsInPrice}
          allowCostEdit={true}
          onCostChange={(c) => onChange({ goodsInCost: c })}
          onModeChange={() => {}}
          onMarginChange={(mg) => {
            const p = priceFromCostMargin(inputs.goodsInCost, mg);
            onChange({ goodsInPrice: Number(p.toFixed(2)) });
          }}
          onPriceChange={(p) => onChange({ goodsInPrice: p })}
        />

        <PriceMarginRow
          label={language === 'en' ? 'Storage (pallet / week)' : 'Almacenaje (Storage pallet / semana)'}
          subLabel={language === 'en' ? 'Cubic meter / pallet rack location per week' : 'Coste de metro cúbico / posición de pallet por semana'}
          cost={inputs.storageCost}
          mode="price"
          hideMarginButton={true}
          marginTarget={
            inputs.storagePrice > 0
              ? (inputs.storagePrice - inputs.storageCost) / inputs.storagePrice
              : 0
          }
          manualPrice={inputs.storagePrice}
          allowCostEdit={true}
          onCostChange={(c) => onChange({ storageCost: c })}
          onModeChange={() => {}}
          onMarginChange={(mg) => {
            const p = priceFromCostMargin(inputs.storageCost, mg);
            onChange({ storagePrice: Number(p.toFixed(2)) });
          }}
          onPriceChange={(p) => onChange({ storagePrice: p })}
        />
      </section>
    </div>
  );
};
