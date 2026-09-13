import React, { useState } from 'react';
import { CalculatorInputs, CalculationResults, ProductType } from '../types';
import { PriceMarginRow } from './PriceMarginRow';
import { PRODUCT_PROFILES, AVAILABLE_TECHNOLOGIES } from '../data/constants';
import { useLanguage } from '../context/LanguageContext';
import { CleanNumberInput } from './CleanNumberInput';
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
  Check,
  Plus,
  X,
} from 'lucide-react';

interface PreciosMargenesTabProps {
  inputs: CalculatorInputs;
  results: CalculationResults;
  onChange: (updated: Partial<CalculatorInputs>) => void;
}

export const PreciosMargenesTab: React.FC<PreciosMargenesTabProps> = ({
  inputs,
  results,
  onChange,
}) => {
  const { language } = useLanguage();
  const [customTechInput, setCustomTechInput] = useState('');

  const handleProductChange = (newProduct: ProductType) => {
    const prof = PRODUCT_PROFILES[newProduct];
    onChange({
      productType: newProduct,
      surchargePrice: 0,
      surchargeCost: 0,
      returnRate: prof.returnRate,
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

  const productTypeLabels: Record<ProductType, string> = {
    'Suplementos': language === 'en' ? 'Supplements' : 'Suplementos',
    'Cosmética': language === 'en' ? 'Cosmetics' : 'Cosmética',
    'Perfume': 'Perfume',
    'Vidrio': language === 'en' ? 'Glass' : 'Vidrio',
    'Perfume + vidrio': language === 'en' ? 'Perfume + glass' : 'Perfume + vidrio',
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
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-red-600" />
              <h2 className="text-base font-bold text-gray-900">
                {language === 'en'
                  ? 'Complete Configuration, Prices & Margins Panel'
                  : 'Panel Completo de Configuración, Precios & Márgenes'}
              </h2>
            </div>
            <p className="text-xs text-gray-600 mt-1 max-w-3xl">
              {language === 'en'
                ? 'Configure client details, order volume, packaging mix and adjust operating rates. Set prices directly or define target margin (%) per line.'
                : 'Configura los datos del cliente, volumen, mix de pack y ajusta las tarifas operativas. Puedes definir precios directamente o establecer el margen objetivo (%) por cada línea.'}
            </p>
          </div>

          {/* Quick preset margin buttons */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">
              {language === 'en' ? 'Quick margin:' : 'Margen rápido:'}
            </span>
            <button
              type="button"
              onClick={() => applyPresetMarginToAll(0.18)}
              className="px-2.5 py-1 text-xs font-medium rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 cursor-pointer"
            >
              18% ({language === 'en' ? 'Competitive' : 'Competitivo'})
            </button>
            <button
              type="button"
              onClick={() => applyPresetMarginToAll(0.25)}
              className="px-2.5 py-1 text-xs font-medium rounded border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 cursor-pointer"
            >
              25% ({language === 'en' ? 'Standard' : 'Estándar'})
            </button>
            <button
              type="button"
              onClick={() => applyPresetMarginToAll(0.35)}
              className="px-2.5 py-1 text-xs font-medium rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 cursor-pointer"
            >
              35% (Premium)
            </button>
          </div>
        </div>

        {/* Global KPI Metrics Bar */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-[11px] text-gray-500 block">
              {language === 'en' ? 'Avg order revenue:' : 'Facturación / pedido medio:'}
            </span>
            <span className="text-base font-bold font-mono text-gray-900">
              {formatEur(results.orderRevenueExShipping + results.shippingPrice)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block">
              {language === 'en' ? 'Total cost / avg order:' : 'Coste total / pedido medio:'}
            </span>
            <span className="text-base font-bold font-mono text-gray-900">
              {formatEur(results.orderCostExShipping + results.carrierCost)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block">
              {language === 'en' ? 'Net profit / order:' : 'Beneficio neto / pedido:'}
            </span>
            <span
              className={`text-base font-bold font-mono ${
                results.profitPerOrder >= 0 ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {formatEur(results.profitPerOrder)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block">
              {language === 'en' ? 'Global Margin & Markup:' : 'Margen & Markup Global:'}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-base font-bold font-mono ${
                  results.marginTotal !== null && results.marginTotal >= 0.2
                    ? 'text-gray-900'
                    : 'text-amber-600'
                }`}
              >
                {formatPct(results.marginTotal)}
              </span>
              <span className="text-xs font-semibold font-mono text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                Markup {formatMarkup(results.markupTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. DATOS DEL CLIENTE & OPERATIVA */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              {language === 'en' ? '1. Client Data & Operational Profile' : '1. Datos del Cliente & Perfil Operativo'}
            </h3>
          </div>
          <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
            Tier {results.tierName} (×{results.skuMultiplier.toFixed(2)})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Nombre Cliente */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1">
              {language === 'en' ? 'Company / Client Name' : 'Nombre del Cliente / Empresa'}
            </label>
            <input
              type="text"
              value={inputs.clientName}
              onChange={(e) => onChange({ clientName: e.target.value })}
              placeholder={language === 'en' ? 'e.g. Bio Cosmetics Client' : 'Ej: Cliente Cosmética Bio'}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-2xs"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              {language === 'en' ? 'Appears on proposals and PDF reports.' : 'Aparece en presupuestos e informes PDF.'}
            </p>
          </div>

          {/* Sector / Tipo Producto */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {language === 'en' ? 'Product type / Picking profile' : 'Tipo de producto / Perfil de picking'}
            </label>
            <select
              value={inputs.productType}
              onChange={(e) => handleProductChange(e.target.value as ProductType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-red-500 bg-white font-medium text-gray-800 cursor-pointer"
            >
              {(Object.keys(PRODUCT_PROFILES) as ProductType[]).map((type) => (
                <option key={type} value={type}>
                  {productTypeLabels[type]}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-1">
              {language === 'en' ? 'Complexity factor: ' : 'Factor complejidad: '}×{results.productPickMultiplier.toFixed(2)} | {language === 'en' ? 'Return rate: ' : 'Retorno: '}{formatPct(inputs.returnRate)}
            </p>
          </div>

          {/* Número de SKUs */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-red-500"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              {language === 'en'
                ? `Adjusts picking cost based on warehouse walking distance (${results.tierName}).`
                : `Ajusta el coste de picking por dispersión en nave (${results.tierName}).`}
            </p>
          </div>
        </div>

        {/* Tecnología / Plataformas de Venta (Shopify, TikTok Shop, PrestaShop, WooCommerce, Temu, etc.) */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-red-600" />
              <label className="text-xs font-bold text-gray-900">
                {language === 'en' ? 'Technology / E-commerce Platforms' : 'Tecnología / Plataformas de Venta'}
              </label>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                {language === 'en' ? 'No price impact · For client sheet & operations' : 'No varía el precio · Informativo para la ficha'}
              </span>
            </div>
            <span className="text-[11px] text-gray-500 font-medium">
              {currentTechs.length}{' '}
              {language === 'en'
                ? currentTechs.length === 1 ? 'platform selected' : 'platforms selected'
                : currentTechs.length === 1 ? 'canal seleccionado' : 'canales seleccionados'}
            </span>
          </div>

          <p className="text-[11px] text-gray-500 mb-2.5">
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
                      ? 'bg-red-600 text-white border-red-600 font-bold shadow-2xs'
                      : 'bg-gray-50 hover:bg-white text-gray-700 border-gray-300 hover:border-gray-400 font-medium'
                  }`}
                >
                  {isSelected ? (
                    <Check className="w-3 h-3 text-white stroke-[3]" />
                  ) : (
                    <Plus className="w-3 h-3 text-gray-400" />
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
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-900 text-white border border-gray-900 shadow-2xs transition cursor-pointer"
                >
                  <Check className="w-3 h-3 text-white stroke-[3]" />
                  <span>{customTech}</span>
                  <X className="w-3 h-3 text-gray-300 hover:text-white" />
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
              className="flex-1 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (customTechInput.trim()) {
                  addCustomTech(customTechInput);
                  setCustomTechInput('');
                }
              }}
              className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition cursor-pointer shrink-0"
            >
              {language === 'en' ? '+ Add' : '+ Añadir'}
            </button>
          </div>
        </div>

        {/* Client Notes & Pack Cost Source */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-3 border-t border-gray-100">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {language === 'en' ? 'Client notes / Operational specifications' : 'Notas del cliente / Especificaciones de la operativa'}
            </label>
            <textarea
              rows={2}
              value={inputs.clientNotes || ''}
              onChange={(e) => onChange({ clientNotes: e.target.value })}
              placeholder={language === 'en' ? 'e.g. Special packaging with kraft paper, Shopify integration, 2 yearly collections...' : 'Ej: Embalaje especial con papel kraft, cliente requiere integración Shopify, 2 colecciones anuales...'}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {language === 'en' ? 'Base pack cost source' : 'Fuente de coste pack base'}
            </label>
            <div className="w-full border border-emerald-200 bg-emerald-50/50 rounded-lg p-2.5 text-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950">
                  {language === 'en' ? 'Calculator (negotiated)' : 'Calculadora (negociado)'}
                </span>
                <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                  {language === 'en' ? 'Active' : 'Activo'}
                </span>
              </div>
              <p className="text-[10px] text-emerald-800/80 mt-1">
                {language === 'en'
                  ? 'Real material costs agreed with procurement and cardboard suppliers.'
                  : 'Costes reales de material pactados con compras y proveedores de cartón.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VOLUMEN Y CESTA */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              {language === 'en' ? '2. Order Volume & Average Basket' : '2. Volumen y Cesta Media'}
            </h3>
          </div>
          <span className="text-xs font-mono text-gray-600">
            {language === 'en' ? 'Monthly total: ' : 'Total mes: '}
            <strong>{results.ordersMonth.toLocaleString(language === 'en' ? 'en-US' : 'es-ES')}</strong> {language === 'en' ? 'orders' : 'pedidos'} (
            <strong>{(results.ordersMonth * results.unitsPerOrder).toLocaleString(language === 'en' ? 'en-US' : 'es-ES', { maximumFractionDigits: 0 })}</strong> {language === 'en' ? 'units/month' : 'units/mes'})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Modalidad de volumen */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {language === 'en' ? 'Calculation mode' : 'Modalidad de cálculo'}
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-gray-100 rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => onChange({ volumeMode: 'Pedidos/día' })}
                className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                  inputs.volumeMode === 'Pedidos/día'
                    ? 'bg-white text-red-600 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {language === 'en' ? 'Orders / day' : 'Pedidos / día'}
              </button>
              <button
                type="button"
                onClick={() => onChange({ volumeMode: 'Pedidos/mes' })}
                className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                  inputs.volumeMode === 'Pedidos/mes'
                    ? 'bg-white text-red-600 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {language === 'en' ? 'Orders / month' : 'Pedidos / mes'}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {language === 'en' ? 'Define if quote is based on daily or monthly volume.' : 'Define si el cliente cotiza por día o mes.'}
            </p>
          </div>

          {/* Días Laborables */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono font-medium focus:ring-2 focus:ring-red-500"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              {language === 'en' ? 'Standard reference: 21-22 days/month.' : 'Estándar nacional: 21-22 días/mes.'}
            </p>
          </div>

          {/* Pedidos por día / mes sincronizados */}
          {inputs.volumeMode === 'Pedidos/día' ? (
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1">
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
                className="w-full border-2 border-red-300 rounded-lg px-3 py-2 text-xs font-mono font-black text-gray-900 focus:ring-2 focus:ring-red-500 bg-red-50/20"
              />
              <p className="text-[10px] text-gray-500 mt-1 font-mono">
                = {results.ordersMonth.toLocaleString(language === 'en' ? 'en-US' : 'es-ES')} {language === 'en' ? 'ord/month' : 'ped/mes'}
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1">
                {language === 'en' ? 'Orders / month (Input)' : 'Pedidos / mes (Entrada)'}
              </label>
              <CleanNumberInput
                min={0}
                step={10}
                fallbackValue={0}
                value={inputs.ordersMonth}
                onChange={(val) => {
                  onChange({
                    ordersMonth: val,
                    ordersPerDay: inputs.workingDays > 0 ? val / inputs.workingDays : 0,
                  });
                }}
                className="w-full border-2 border-red-300 rounded-lg px-3 py-2 text-xs font-mono font-black text-gray-900 focus:ring-2 focus:ring-red-500 bg-red-50/20"
              />
              <p className="text-[10px] text-gray-500 mt-1 font-mono">
                = {results.ordersPerDay.toFixed(1)} {language === 'en' ? 'ord/day' : 'ped/día'}
              </p>
            </div>
          )}

          {/* Unidades por pedido */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-gray-700">
                {language === 'en' ? 'Units per order (Basket)' : 'Units por pedido (Cesta)'}
              </label>
              <span className="font-mono font-bold text-xs text-red-600 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                {inputs.unitsPerOrder} {language === 'en' ? 'units' : 'uds'}
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono font-medium focus:ring-2 focus:ring-red-500"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              {inputs.unitsPerOrder === 1
                ? (language === 'en' ? '1st Pick only (1 unit/order).' : '1er Pick únicamente (1 ud/ped).')
                : (language === 'en'
                    ? `1st Pick + ${(inputs.unitsPerOrder - 1).toFixed(1)} extra picks.`
                    : `1er Pick + ${(inputs.unitsPerOrder - 1).toFixed(1)} picks extra.`)}
            </p>
          </div>
        </div>
      </section>

      {/* 3. MIX DE PACK */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 mb-4 gap-2">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              {language === 'en' ? '3. Packaging Pack Mix' : '3. Mix de Pack de Embalaje'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono">
              {language === 'en' ? 'Weighted average pack cost: ' : 'Coste medio ponderado del pack: '}
              <strong className="text-gray-900 text-sm">{formatEur(results.packCost)}</strong>
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                mixTotal === 100
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {language === 'en' ? 'Sum: ' : 'Suma: '}{mixTotal}%
            </span>
          </div>
        </div>

        {/* Quick Presets & Normalizer */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-gray-500 text-[11px] font-medium">
              {language === 'en' ? 'Common distributions:' : 'Distribuciones comunes:'}
            </span>
            <button
              type="button"
              onClick={() => applyMixPreset(0, 0, 50, 50)}
              className="px-2 py-1 text-[11px] bg-white hover:bg-gray-100 border border-gray-200 rounded text-gray-700 font-medium cursor-pointer"
            >
              50% MPL / 50% LPL ({language === 'en' ? 'Standard' : 'Estándar'})
            </button>
            <button
              type="button"
              onClick={() => applyMixPreset(50, 50, 0, 0)}
              className="px-2 py-1 text-[11px] bg-white hover:bg-gray-100 border border-gray-200 rounded text-gray-700 font-medium cursor-pointer"
            >
              50% SPK / 50% SPL ({language === 'en' ? 'Small' : 'Pequeño'})
            </button>
            <button
              type="button"
              onClick={() => applyMixPreset(25, 25, 25, 25)}
              className="px-2 py-1 text-[11px] bg-white hover:bg-gray-100 border border-gray-200 rounded text-gray-700 font-medium cursor-pointer"
            >
              25% {language === 'en' ? 'Uniform' : 'Uniforme'}
            </button>
            <button
              type="button"
              onClick={() => applyMixPreset(0, 0, 100, 0)}
              className="px-2 py-1 text-[11px] bg-white hover:bg-gray-100 border border-gray-200 rounded text-gray-700 font-medium cursor-pointer"
            >
              100% MPL
            </button>
          </div>

          {mixTotal !== 100 && (
            <button
              type="button"
              onClick={normalizeMix}
              className="px-2.5 py-1 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded shadow-2xs transition cursor-pointer"
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
            <div key={item.key} className="bg-gray-50/70 p-3 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-900">{item.label}</span>
                <span className="text-xs font-mono font-black text-red-600 bg-white px-1.5 py-0.2 rounded border border-gray-200">
                  {inputs[item.key]}%
                </span>
              </div>
              <div className="text-[10px] text-gray-500 mb-2 flex justify-between">
                <span>{item.desc}</span>
                <span className="font-mono font-semibold">{language === 'en' ? 'Cost: ' : 'Coste: '}{formatEur(item.cost)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={inputs[item.key]}
                onChange={(e) => onChange({ [item.key]: Number(e.target.value) })}
                className="w-full accent-red-600 h-1.5 bg-gray-200 rounded cursor-pointer"
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
                  className="w-16 text-right border border-gray-300 rounded px-1.5 py-0.5 text-xs font-mono"
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
            <Package className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              {language === 'en' ? '4. Base Preparation (Pack)' : '4. Preparación Base (Pack)'}
            </h3>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {language === 'en' ? 'Pack material mix cost: ' : 'Coste mix material packaging: '}
            <strong className="text-gray-900">{formatEur(results.packCost)}</strong>
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
            <Layers className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              {language === 'en' ? '5. First Pick of Order (1st Unit)' : '5. Primer Pick del Pedido (1ª Unidad)'}
            </h3>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {language === 'en' ? 'Adjusted pick cost: ' : 'Coste ajustado pick: '}
            <strong className="text-gray-900">{formatEur(results.firstPickCost)}</strong>
          </span>
        </div>

        <PriceMarginRow
          label={language === 'en' ? 'First Pick of order (1st unit included)' : 'Primer Pick del pedido (1ª unidad)'}
          subLabel={
            language === 'en'
              ? `Cost adjusted by SKU tier (×${results.skuMultiplier.toFixed(2)}) and product profile (×${results.productPickMultiplier.toFixed(2)})`
              : `Coste ajustado por SKU (×${results.skuMultiplier.toFixed(2)}) y perfil de producto (×${results.productPickMultiplier.toFixed(2)})`
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
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            {language === 'en' ? '6. Additional Picks (Extra units > 1)' : '6. Picks Adicionales (Unidades extra > 1)'}
          </h3>
          <span className="text-xs text-gray-500 font-mono">
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
              : `Aplica a partir de la 2ª unidad en la cesta de compra (Coste estándar: ${formatEur(results.additionalPickDefaultCost)})`
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
            <Truck className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              {language === 'en' ? '7. Shipping (Carrier Cost + Transport Margin)' : '7. Envío (Carrier Cost + Margen de Transporte)'}
            </h3>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
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
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          {language === 'en' ? '8. Additional Services & Storage' : '8. Servicios Adicionales & Almacenaje'}
        </h3>

        <PriceMarginRow
          label={language === 'en' ? 'Base packaging per order' : 'Packaging base por pedido'}
          subLabel={language === 'en' ? 'Standard boxes, branded tape or void fill' : 'Cajas estándar, cinta personalizada o precinto'}
          cost={inputs.packagingCost}
          mode="price"
          marginTarget={
            inputs.packagingPrice > 0
              ? (inputs.packagingPrice - inputs.packagingCost) / inputs.packagingPrice
              : 0
          }
          manualPrice={inputs.packagingPrice}
          allowCostEdit={true}
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
