import React, { useState } from 'react';
import { CalculationResults, CalculatorInputs } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatEur } from '../utils/calculations';
import {
  Printer,
  Copy,
  Check,
  Package,
  Truck,
  Box,
  ShieldCheck,
  SlidersHorizontal,
  FileCheck,
  Layers,
  FileText,
} from 'lucide-react';

interface PropuestaClienteTabProps {
  inputs: CalculatorInputs;
  results: CalculationResults;
}

const productTypeLabels: Record<string, { es: string; en: string }> = {
  'Suplementos': { es: 'Suplementos (Picks pequeños)', en: 'Supplements (Small Picks)' },
  'Moda / Ropa': { es: 'Moda / Ropa (Doblado & embolsado)', en: 'Fashion / Apparel (Folding & Bagging)' },
  'Cosmética / Belleza': { es: 'Cosmética / Belleza (Frágil / múltiples skus)', en: 'Cosmetics / Beauty (Fragile / Multi-SKU)' },
  'Electrónica': { es: 'Electrónica (Número de serie / alto valor)', en: 'Electronics (Serial Number / High Value)' },
  'Hogar / Voluminoso': { es: 'Hogar / Voluminoso (Picks pesados)', en: 'Home / Bulky (Heavy Picks)' },
  'General / Estándar': { es: 'General / Estándar', en: 'General / Standard' },
};

export const PropuestaClienteTab: React.FC<PropuestaClienteTabProps> = ({
  inputs,
  results,
}) => {
  const [copied, setCopied] = useState(false);
  const { language } = useLanguage();

  // Section selection toggles (User request: "o que pueda ir seleccionando la info que quiera agregar")
  const [includeVolume, setIncludeVolume] = useState(true);
  const [includePrepPick, setIncludePrepPick] = useState(true);
  const [includeShipping, setIncludeShipping] = useState(true);
  const [includeStorage, setIncludeStorage] = useState(true);
  const [includeFooter, setIncludeFooter] = useState(true);

  // Compact 1-page mode (User request: "el .pdf , mas simple , que entre todo en 1 hoja")
  const [compactMode, setCompactMode] = useState(true);

  // Optional custom notes
  const [customNotes, setCustomNotes] = useState('');
  const [showNotesField, setShowNotesField] = useState(false);

  // Toggle filter panel
  const [showSectionSelector, setShowSectionSelector] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const currentProductType =
    productTypeLabels[inputs.productType]?.[language] || inputs.productType;

  // Presets
  const handlePresetAll = () => {
    setIncludeVolume(true);
    setIncludePrepPick(true);
    setIncludeShipping(true);
    setIncludeStorage(true);
    setIncludeFooter(true);
  };

  const handlePresetRatesOnly = () => {
    setIncludeVolume(false);
    setIncludePrepPick(true);
    setIncludeShipping(true);
    setIncludeStorage(true);
    setIncludeFooter(true);
  };

  const handlePresetMinimal = () => {
    setIncludeVolume(false);
    setIncludePrepPick(true);
    setIncludeShipping(true);
    setIncludeStorage(false);
    setIncludeFooter(true);
  };

  const handleCopy = () => {
    const isEn = language === 'en';
    const lines: string[] = [];

    lines.push('================================================');
    lines.push(isEn ? 'ECONOMIC PROPOSAL FOR FULFILMENT SERVICES' : 'PROPUESTA ECONÓMICA DE SERVICIOS DE FULFILMENT');
    lines.push(`${isEn ? 'Client' : 'Cliente'}: ${results.clientName || (isEn ? 'Client' : 'Cliente')}`);
    lines.push(`${isEn ? 'Date' : 'Fecha'}: ${new Date().toLocaleDateString(isEn ? 'en-US' : 'es-ES')}`);
    lines.push(`Ref: COT-${new Date().getFullYear()}-${inputs.skuCount}S`);
    if (inputs.technologies && inputs.technologies.length > 0) {
      lines.push(`${isEn ? 'Channels / Platforms' : 'Canales / Plataformas'}: ${inputs.technologies.join(', ')}`);
    }
    lines.push('================================================\n');

    if (includeVolume) {
      lines.push(isEn ? 'OPERATING CONTEXT & BASKET:' : 'CONTEXTO OPERATIVO Y CESTA:');
      lines.push(`- ${isEn ? 'Estimated monthly volume' : 'Volumen mensual estimado'}: ${results.ordersMonth} ${isEn ? 'orders/month' : 'pedidos/mes'}`);
      lines.push(`- ${isEn ? 'Daily cadence' : 'Cadencia diaria'}: ${results.ordersPerDay.toFixed(1)} ${isEn ? 'orders/day' : 'pedidos/día'}`);
      lines.push(`- ${isEn ? 'Average basket' : 'Cesta media'}: ${results.unitsPerOrder.toFixed(1)} ${isEn ? 'units/order' : 'units/pedido'}\n`);
    }

    if (includePrepPick) {
      lines.push(isEn ? '1. PREPARATION & PICKING RATES:' : '1. TARIFAS DE PREPARACIÓN & PICKING:');
      lines.push(`- ${isEn ? 'Base Preparation (Pack)' : 'Preparación base (Pack)'}: ${formatEur(results.packPrice)} ${isEn ? 'per order' : 'por pedido'}`);
      lines.push(`- ${isEn ? '1st Unit Pick' : '1er Pick del pedido (1ª ud)'}: ${formatEur(results.firstPickPrice)} ${isEn ? 'per order' : 'por pedido'}`);
      lines.push(`- ${isEn ? 'Additional Pick (> 1st unit)' : 'Pick adicional (> 1ª unidad)'}: ${formatEur(results.additionalPickPrice)} ${isEn ? 'per extra unit' : 'por unidad extra'}`);
      if (inputs.packagingPrice > 0) {
        lines.push(`- ${isEn ? 'Base packaging' : 'Packaging base'}: ${formatEur(inputs.packagingPrice)} ${isEn ? 'per order' : 'por pedido'}`);
      }
      lines.push('');
    }

    if (includeShipping) {
      lines.push(isEn ? '2. TRANSPORT & SHIPPING:' : '2. TRANSPORTE Y ENVÍOS:');
      lines.push(`- ${isEn ? 'Standard mainland delivery' : 'Envío estándar peninsular'}: ${formatEur(results.shippingPrice)} ${isEn ? 'per shipment' : 'por envío'}\n`);
    }

    if (includeStorage) {
      lines.push(isEn ? '3. STORAGE & RECEIVING:' : '3. ALMACENAJE Y RECEPCIÓN:');
      lines.push(`- ${isEn ? 'Pallet storage' : 'Almacenaje en estantería'}: ${formatEur(inputs.storagePrice)} ${isEn ? 'per pallet / week' : 'por pallet / semana'}`);
      lines.push(`- ${isEn ? 'Goods-in pallet' : 'Recepción descarga (Goods-in)'}: ${formatEur(inputs.goodsInPrice)} ${isEn ? 'per pallet' : 'por pallet'}`);
      lines.push(`- ${isEn ? 'Returns processing' : 'Gestión devoluciones'}: ${formatEur(inputs.returnHandlingPrice)} ${isEn ? 'per return' : 'por retorno'}\n`);
    }

    if (customNotes.trim()) {
      lines.push(isEn ? 'OBSERVATIONS & CONDITIONS:' : 'OBSERVACIONES & CONDICIONES:');
      lines.push(`${customNotes.trim()}\n`);
    }

    if (includeFooter) {
      lines.push('------------------------------------------------');
      lines.push(`${isEn ? 'Estimated monthly billing' : 'Facturación estimada por pedido medio'}: ${formatEur(results.orderRevenueExShipping + results.shippingPrice)} ${isEn ? '(excl. VAT)' : '(sin IVA)'}`);
      lines.push(isEn ? 'Prices excluding VAT. Quote valid for 30 calendar days.' : 'Precios netos sin IVA. Cotización válida por 30 días naturales.');
      lines.push('================================================');
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Top Action & Configuration Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs no-print space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                {language === 'en' ? 'Commercial Client Proposal' : 'Propuesta Comercial del Cliente'}
              </h2>
              {compactMode && (
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <FileCheck className="w-3 h-3 text-emerald-600" />
                  {language === 'en' ? '1 Page Fit' : '1 Hoja Compacto'}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {language === 'en'
                ? 'Select which sections to include and export a simplified, 1-page PDF proposal.'
                : 'Selecciona la información que quieras incluir y genera un PDF limpio en 1 sola hoja.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle 1-Page Compact Mode */}
            <button
              type="button"
              onClick={() => setCompactMode(!compactMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                compactMode
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              title={
                language === 'en'
                  ? 'Compact layout mathematically formatted to fit within a single printed sheet'
                  : 'Formato compacto formateado para entrar exactamente en 1 sola hoja impresa'
              }
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'en' ? (compactMode ? '1 Page (Active)' : '1 Page Fit') : (compactMode ? '1 Hoja (Activo)' : 'Ajustar a 1 Hoja')}</span>
            </button>

            {/* Configure Sections Button */}
            <button
              type="button"
              onClick={() => setShowSectionSelector(!showSectionSelector)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                showSectionSelector
                  ? 'bg-gray-900 border-gray-900 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Select info' : 'Seleccionar info'}</span>
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg shadow-2xs transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (language === 'en' ? 'Copied!' : '¡Copiado!') : (language === 'en' ? 'Copy' : 'Copiar')}</span>
            </button>

            {/* Print / PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-2xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Print / PDF (1 Page)' : 'Imprimir / PDF (1 Hoja)'}</span>
            </button>
          </div>
        </div>

        {/* Expandable Section Selection Bar */}
        {showSectionSelector && (
          <div className="pt-3 border-t border-gray-100 space-y-2.5 bg-gray-50/70 p-3 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-red-600" />
                {language === 'en' ? 'Choose proposal sections:' : 'Selecciona las secciones a incluir en el PDF:'}
              </span>

              {/* Preset quick buttons */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-gray-400 mr-1">{language === 'en' ? 'Presets:' : 'Preajustes:'}</span>
                <button
                  type="button"
                  onClick={handlePresetAll}
                  className="px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-medium cursor-pointer"
                >
                  {language === 'en' ? 'All' : 'Todo'}
                </button>
                <button
                  type="button"
                  onClick={handlePresetRatesOnly}
                  className="px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-medium cursor-pointer"
                >
                  {language === 'en' ? 'Rates only' : 'Solo tarifas'}
                </button>
                <button
                  type="button"
                  onClick={handlePresetMinimal}
                  className="px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-medium cursor-pointer"
                >
                  {language === 'en' ? 'Minimal' : 'Mínimo'}
                </button>
              </div>
            </div>

            {/* Checkbox matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
              <label className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200 cursor-pointer hover:border-gray-300">
                <input
                  type="checkbox"
                  checked={includeVolume}
                  onChange={(e) => setIncludeVolume(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                />
                <span className="text-gray-800 text-[11px] font-medium">
                  {language === 'en' ? 'Volume Context' : 'Contexto volumen'}
                </span>
              </label>

              <label className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200 cursor-pointer hover:border-gray-300">
                <input
                  type="checkbox"
                  checked={includePrepPick}
                  onChange={(e) => setIncludePrepPick(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                />
                <span className="text-gray-800 text-[11px] font-medium">
                  {language === 'en' ? '1. Prep & Picking' : '1. Prep & Pick'}
                </span>
              </label>

              <label className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200 cursor-pointer hover:border-gray-300">
                <input
                  type="checkbox"
                  checked={includeShipping}
                  onChange={(e) => setIncludeShipping(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                />
                <span className="text-gray-800 text-[11px] font-medium">
                  {language === 'en' ? '2. Shipping Rate' : '2. Envíos'}
                </span>
              </label>

              <label className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200 cursor-pointer hover:border-gray-300">
                <input
                  type="checkbox"
                  checked={includeStorage}
                  onChange={(e) => setIncludeStorage(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                />
                <span className="text-gray-800 text-[11px] font-medium">
                  {language === 'en' ? '3. Storage & Intake' : '3. Almacén'}
                </span>
              </label>

              <label className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200 cursor-pointer hover:border-gray-300">
                <input
                  type="checkbox"
                  checked={includeFooter}
                  onChange={(e) => setIncludeFooter(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                />
                <span className="text-gray-800 text-[11px] font-medium">
                  {language === 'en' ? 'Footer & Totals' : 'Total & Validez'}
                </span>
              </label>
            </div>

            {/* Custom Notes Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowNotesField(!showNotesField)}
                className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer flex items-center gap-1"
              >
                <span>{showNotesField ? (language === 'en' ? '▲ Hide custom notes' : '▲ Ocultar notas personalizadas') : (language === 'en' ? '▼ Add custom notes / payment terms' : '▼ Añadir notas u observaciones personalizadas')}</span>
              </button>

              {showNotesField && (
                <div className="mt-2">
                  <textarea
                    rows={2}
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder={
                      language === 'en'
                        ? 'E.g.: Payment terms: 30 days invoice date. Rates effective during current fiscal year...'
                        : 'Ejemplo: Forma de pago: confirming a 30 días. Tarifas válidas durante el ejercicio fiscal 2025...'
                    }
                    className="w-full text-xs p-2 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Proposal Card (Printable Sheet) */}
      <div
        className={`bg-white border border-gray-200 rounded-xl shadow-xs print:border-none print:shadow-none print:m-0 print:p-0 fit-one-page ${
          compactMode ? 'p-5 sm:p-6 space-y-4 text-xs' : 'p-6 sm:p-8 space-y-6 text-sm'
        }`}
      >
        {/* Document Header */}
        <div
          className={`border-b border-gray-200 flex justify-between items-start ${
            compactMode ? 'pb-3.5' : 'pb-5'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 block mb-0.5">
              {language === 'en' ? 'Fulfilment Pricing Proposal' : 'Propuesta Tarifaria de Fulfilment'}
            </span>
            <h1 className={`${compactMode ? 'text-xl' : 'text-2xl'} font-black text-gray-900 tracking-tight`}>
              {results.clientName || (language === 'en' ? 'Unnamed Client' : 'Cliente sin nombre')}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-1.5">
              <span>
                {language === 'en'
                  ? `Profile: ${currentProductType} · ${inputs.skuCount} active SKUs`
                  : `Perfil: ${currentProductType} · ${inputs.skuCount} SKUs activos`}
              </span>
              {inputs.technologies && inputs.technologies.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  · <span className="font-semibold text-gray-700">{language === 'en' ? 'Channels:' : 'Canales:'}</span>
                  {inputs.technologies.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-bold bg-gray-100 text-gray-800 border border-gray-200 px-1.5 py-0.2 rounded"
                    >
                      {t}
                    </span>
                  ))}
                </span>
              )}
            </p>
          </div>

          <div className="text-right text-xs text-gray-400">
            <div>
              {language === 'en' ? 'Date: ' : 'Fecha: '}
              <span className="text-gray-700 font-semibold">
                {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES')}
              </span>
            </div>
            <div>Ref: <span className="font-mono text-gray-700">COT-{new Date().getFullYear()}-{inputs.skuCount}S</span></div>
          </div>
        </div>

        {/* Volume Context (Optional block) */}
        {includeVolume && (
          <div
            className={`bg-gray-50 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3 text-center border border-gray-100 ${
              compactMode ? 'p-2.5 text-xs' : 'p-4'
            }`}
          >
            <div>
              <span className="text-[10.5px] text-gray-500 block">
                {language === 'en' ? 'Estimated monthly volume' : 'Volumen mensual estimado'}
              </span>
              <span className="text-sm sm:text-base font-bold text-gray-900 font-mono">
                {results.ordersMonth.toLocaleString(language === 'en' ? 'en-US' : 'es-ES', { maximumFractionDigits: 0 })}{' '}
                {language === 'en' ? 'orders / mo' : 'pedidos / mes'}
              </span>
            </div>
            <div>
              <span className="text-[10.5px] text-gray-500 block">
                {language === 'en' ? 'Average daily cadence' : 'Cadencia diaria media'}
              </span>
              <span className="text-sm sm:text-base font-bold text-gray-900 font-mono">
                {results.ordersPerDay.toFixed(1)} {language === 'en' ? 'orders / day' : 'pedidos / día'}
              </span>
            </div>
            <div>
              <span className="text-[10.5px] text-gray-500 block">
                {language === 'en' ? 'Average basket' : 'Cesta media'}
              </span>
              <span className="text-sm sm:text-base font-bold text-gray-900 font-mono">
                {results.unitsPerOrder.toFixed(1)} {language === 'en' ? 'units / order' : 'units / pedido'}
              </span>
            </div>
          </div>
        )}

        {/* Core Rates Section */}
        <div className={compactMode ? 'space-y-3.5' : 'space-y-5'}>
          {/* 1. Preparación de Pedido */}
          {includePrepPick && (
            <div className="break-inside-avoid">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Package className="w-3.5 h-3.5 text-red-600" />
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                  {language === 'en' ? '1. Preparation & Picking Rates' : '1. Tarifas de Preparación & Picking'}
                </h3>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] font-semibold border-b border-gray-200">
                    <tr>
                      <th className={`font-semibold ${compactMode ? 'px-3 py-1.5' : 'px-4 py-2.5'}`}>
                        {language === 'en' ? 'Service' : 'Servicio'}
                      </th>
                      <th className={`font-semibold ${compactMode ? 'px-3 py-1.5' : 'px-4 py-2.5'}`}>
                        {language === 'en' ? 'Description' : 'Descripción'}
                      </th>
                      <th className={`font-semibold text-right ${compactMode ? 'px-3 py-1.5' : 'px-4 py-2.5'}`}>
                        {language === 'en' ? 'Agreed rate' : 'Tarifa acordada'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className={`font-bold text-gray-900 ${compactMode ? 'px-3 py-2 text-xs' : 'px-4 py-3'}`}>
                        {language === 'en'
                          ? 'Base Preparation (Pack)'
                          : 'Preparación Base (Pack)'}
                      </td>
                      <td className={`text-gray-600 ${compactMode ? 'px-3 py-2 text-[11px]' : 'px-4 py-3'}`}>
                        {language === 'en'
                          ? 'Certified packaging material (box, mailer, label, tape)'
                          : 'Preparación de embalaje homologado (caja o sobre certificado)'}
                      </td>
                      <td className={`text-right font-mono font-bold text-gray-900 ${compactMode ? 'px-3 py-2 text-xs sm:text-sm' : 'px-4 py-3 text-sm'}`}>
                        {formatEur(results.packPrice)}
                      </td>
                    </tr>
                    <tr>
                      <td className={`font-bold text-gray-900 ${compactMode ? 'px-3 py-2 text-xs' : 'px-4 py-3'}`}>
                        {language === 'en'
                          ? 'First Pick (1st unit included)'
                          : 'Primer Pick de Pedido (1ª unidad)'}
                      </td>
                      <td className={`text-gray-600 ${compactMode ? 'px-3 py-2 text-[11px]' : 'px-4 py-3'}`}>
                        {language === 'en'
                          ? 'Picking and verification of the initial unit of the order'
                          : 'Picking y verificación de la 1ª unidad incluida en el pedido'}
                      </td>
                      <td className={`text-right font-mono font-bold text-gray-900 ${compactMode ? 'px-3 py-2 text-xs sm:text-sm' : 'px-4 py-3 text-sm'}`}>
                        {formatEur(results.firstPickPrice)}
                      </td>
                    </tr>
                    <tr>
                      <td className={`font-medium text-gray-800 ${compactMode ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5'}`}>
                        {language === 'en'
                          ? 'Additional Pick (from 2nd unit)'
                          : 'Pick Adicional (desde 2ª unidad)'}
                      </td>
                      <td className={`text-gray-500 ${compactMode ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2.5'}`}>
                        {language === 'en'
                          ? 'For each extra unit picked within the same order'
                          : 'Por cada unidad adicional que contenga el mismo pedido'}
                      </td>
                      <td className={`text-right font-mono font-bold text-gray-900 ${compactMode ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5'}`}>
                        {formatEur(results.additionalPickPrice)}
                      </td>
                    </tr>
                    <tr>
                      <td className={`font-medium text-gray-800 ${compactMode ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5'}`}>
                        {language === 'en' ? 'Standard base packaging' : 'Packaging base estándar'}
                      </td>
                      <td className={`text-gray-500 ${compactMode ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2.5'}`}>
                        {language === 'en'
                          ? 'Certified box or mailer, security tape, and shipping label'
                          : 'Caja o sobre homologado, precinto y etiqueta de envío'}
                      </td>
                      <td className={`text-right font-mono font-bold text-gray-900 ${compactMode ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5'}`}>
                        {formatEur(inputs.packagingPrice)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Envío */}
          {includeShipping && (
            <div className="break-inside-avoid">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                  {language === 'en' ? '2. Transportation & Delivery' : '2. Transporte y Entrega'}
                </h3>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] font-semibold border-b border-gray-200">
                    <tr>
                      <th className={`font-semibold ${compactMode ? 'px-3 py-1.5' : 'px-4 py-2.5'}`}>
                        {language === 'en' ? 'Service' : 'Servicio'}
                      </th>
                      <th className={`font-semibold ${compactMode ? 'px-3 py-1.5' : 'px-4 py-2.5'}`}>
                        {language === 'en' ? 'Terms & Conditions' : 'Condiciones'}
                      </th>
                      <th className={`font-semibold text-right ${compactMode ? 'px-3 py-1.5' : 'px-4 py-2.5'}`}>
                        {language === 'en' ? 'Agreed rate' : 'Tarifa acordada'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className={`font-medium text-gray-800 ${compactMode ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5'}`}>
                        {language === 'en' ? 'Domestic Mainland Shipping' : 'Envío Nacional Peninsular'}
                      </td>
                      <td className={`text-gray-500 ${compactMode ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2.5'}`}>
                        {language === 'en'
                          ? '24-48h delivery with tracking and recipient notifications'
                          : 'Entrega en 24-48h con seguimiento y aviso al destinatario'}
                      </td>
                      <td className={`text-right font-mono font-bold text-blue-700 ${compactMode ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5'}`}>
                        {formatEur(results.shippingPrice)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Almacenaje y Recepción */}
          {includeStorage && (
            <div className="break-inside-avoid">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Box className="w-3.5 h-3.5 text-gray-700" />
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                  {language === 'en' ? '3. Storage & Goods Inbound' : '3. Almacenaje y Recepción de Mercancía'}
                </h3>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] font-semibold border-b border-gray-200">
                    <tr>
                      <th className={`font-semibold ${compactMode ? 'px-3 py-1.5' : 'px-4 py-2.5'}`}>
                        {language === 'en' ? 'Service' : 'Servicio'}
                      </th>
                      <th className={`font-semibold ${compactMode ? 'px-3 py-1.5' : 'px-4 py-2.5'}`}>
                        {language === 'en' ? 'Unit of measurement' : 'Unidad de medida'}
                      </th>
                      <th className={`font-semibold text-right ${compactMode ? 'px-3 py-1.5' : 'px-4 py-2.5'}`}>
                        {language === 'en' ? 'Agreed rate' : 'Tarifa acordada'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className={`font-medium text-gray-800 ${compactMode ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5'}`}>
                        {language === 'en' ? 'Pallet rack storage' : 'Almacenaje en estantería (Pallet Rack)'}
                      </td>
                      <td className={`text-gray-500 ${compactMode ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2.5'}`}>
                        {language === 'en' ? 'Per EUR pallet / week' : 'Por pallet europeo / semana'}
                      </td>
                      <td className={`text-right font-mono font-bold text-gray-900 ${compactMode ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5'}`}>
                        {formatEur(inputs.storagePrice)}
                      </td>
                    </tr>
                    <tr>
                      <td className={`font-medium text-gray-800 ${compactMode ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5'}`}>
                        {language === 'en' ? 'Goods-in / Receiving' : 'Recepción de mercancía (Goods-in)'}
                      </td>
                      <td className={`text-gray-500 ${compactMode ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2.5'}`}>
                        {language === 'en'
                          ? 'Per pallet received and putaway with packing slip verification'
                          : 'Por pallet recibido y ubicado con control de albarán'}
                      </td>
                      <td className={`text-right font-mono font-bold text-gray-900 ${compactMode ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5'}`}>
                        {formatEur(inputs.goodsInPrice)}
                      </td>
                    </tr>
                    <tr>
                      <td className={`font-medium text-gray-800 ${compactMode ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5'}`}>
                        {language === 'en' ? 'Returns processing' : 'Gestión de devoluciones (Returns)'}
                      </td>
                      <td className={`text-gray-500 ${compactMode ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2.5'}`}>
                        {language === 'en'
                          ? 'Receiving, inspection, and restocking'
                          : 'Recepción, inspección y reubicación en stock'}
                      </td>
                      <td className={`text-right font-mono font-bold text-gray-900 ${compactMode ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5'}`}>
                        {formatEur(inputs.returnHandlingPrice)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Custom Notes Section (if entered) */}
          {customNotes.trim() && (
            <div className="bg-amber-50/50 border border-amber-200/80 rounded-lg p-2.5 text-xs text-amber-950 break-inside-avoid">
              <span className="font-bold text-[11px] uppercase tracking-wide block text-amber-900 mb-0.5">
                {language === 'en' ? 'Observations & Specific Conditions:' : 'Observaciones y Condiciones Específicas:'}
              </span>
              <p className="text-[11px] leading-relaxed whitespace-pre-line text-gray-800">
                {customNotes.trim()}
              </p>
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {includeFooter && (
          <div
            className={`border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500 break-inside-avoid ${
              compactMode ? 'pt-3 mt-3 text-[11px]' : 'pt-5 mt-6'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {language === 'en'
                  ? 'Net prices excluding VAT. Quote valid for 30 calendar days.'
                  : 'Precios netos sin IVA. Cotización válida por 30 días naturales.'}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-gray-400 text-[10px]">
                {language === 'en' ? 'Estimated billing / average order:' : 'Facturación estimada / pedido medio:'}
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono text-gray-900">
                {formatEur(results.orderRevenueExShipping + results.shippingPrice)} {language === 'en' ? '(excl. VAT)' : '(sin IVA)'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
