import React, { useState } from 'react';
import { CalculationResults, CalculatorInputs } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { formatEur, formatPct, formatMarkup } from '../utils/calculations';
import { AlertTriangle, CheckCircle, Package, Truck, Info, ArrowUpRight, FileText } from 'lucide-react';
import { InternalReportModal } from './InternalReportModal';
import { LiveDateScheduler } from './LiveDateScheduler';

interface ResumenTabProps {
  results: CalculationResults;
  inputs?: CalculatorInputs;
  onOpenPricingSimulator?: () => void;
  onUpdateInputs?: (partial: Partial<CalculatorInputs>) => void;
}

export const ResumenTab: React.FC<ResumenTabProps> = ({
  results,
  inputs,
  onOpenPricingSimulator,
  onUpdateInputs,
}) => {
  const [showPdfModal, setShowPdfModal] = useState(false);
  const { language } = useLanguage();
  const { isDark } = useTheme();

  const translateAlert = (alert: string) => {
    if (language !== 'en') return alert;
    if (alert.includes('El margen total mensual está por debajo')) {
      return 'Total monthly margin is below 20%. Consider adjusting margins or prices.';
    }
    if (alert.includes('El fee de Preparación + 1er Pick está por debajo')) {
      return 'Warning! Preparation + 1st Pick fee is below its operational cost.';
    }
    if (alert.includes('El primer pick se está cobrando por debajo')) {
      return 'The first pick is priced below its adjusted cost.';
    }
    if (alert.includes('Con primer pick subsidiado')) {
      return alert
        .replace('Con primer pick subsidiado, el break-even es', 'With subsidized first pick, break-even is')
        .replace('uds/pedido (actual:', 'units/order (current:')
        .replace('uds). Margen en riesgo.', 'units). Margin at risk.');
    }
    if (alert.includes('El coste de carrier supera al precio de venta del envío')) {
      return 'Carrier cost exceeds shipping sale price (negative margin on transport).';
    }
    return alert;
  };

  // Fallback default inputs if not passed
  const effectiveInputs: CalculatorInputs = inputs || {
    clientName: results.clientName,
    clientNotes: '',
    skuCount: 15,
    productType: 'Suplementos',
    packCostSource: 'Calculadora (negociado)',
    volumeMode: 'Pedidos/día',
    workingDays: 22,
    ordersPerDay: results.ordersPerDay,
    ordersMonth: results.ordersMonth,
    unitsPerOrder: results.unitsPerOrder,
    mixSpk: 0,
    mixSpl: 0,
    mixMpl: 50,
    mixLpl: 50,
    packPriceMode: 'margin',
    packMarginTarget: results.packMargin || 0.38,
    packPriceManual: results.packPrice,
    firstPickPriceMode: 'margin',
    firstPickMarginTarget: results.firstPickMargin || 0.28,
    firstPickPriceManual: results.firstPickPrice,
    additionalPickPriceMode: 'margin',
    additionalPickMarginTarget: results.additionalPickMargin || 0.28,
    additionalPickPriceManual: results.additionalPickPrice,
    shippingPriceMode: 'margin',
    carrierCost: results.carrierCost,
    shippingMarginTarget: results.shippingMargin || 0.2,
    shippingPriceManual: results.shippingPrice,
    insertsPerOrder: 0,
    insertPrice: 0.15,
    insertCost: 0.05,
    packagingPrice: 0.3,
    packagingCost: 0.15,
    surchargePrice: 0,
    surchargeCost: 0,
    returnRate: 0.02,
    returnHandlingPrice: 1.5,
    returnHandlingCost: 0.8,
    goodsInPalletsMonth: 0,
    goodsInPrice: 12.5,
    goodsInCost: 7.0,
    storagePalletWeeksMonth: 0,
    storagePrice: 3.5,
    storageCost: 1.8,
  };

  return (
    <div className="space-y-6">
      {/* Dashboard View (Hidden when internal report modal is open during print) */}
      <div id="main-dashboard-content" className={`space-y-6 ${showPdfModal ? 'print:hidden' : ''}`}>
        {/* Client Headline Banner */}
        <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs transition-colors duration-200 ${
          isDark
            ? 'bg-[#1E1B2E] border-[#2E2A48]'
            : 'bg-white border-[#E5DDD0]'
        }`}>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded tracking-wide ${
                isDark
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                  : 'bg-red-100 text-red-700'
              }`}>
                {language === 'en' ? 'Client' : 'Cliente'}
              </span>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                {results.clientName || (language === 'en' ? 'Unnamed Client' : 'Cliente sin nombre')}
              </h2>
              {results.technologies && results.technologies.length > 0 && (
                <div className="flex items-center gap-1">
                  {results.technologies.map((t) => (
                    <span
                      key={t}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        isDark
                          ? 'bg-[#252238] text-gray-200 border-[#2E2A48]'
                          : 'bg-[#F4EEE4] text-[#4D453E] border-[#E5DDD0]'
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {results.ordersMonth.toLocaleString(language === 'en' ? 'en-US' : 'es-ES', { maximumFractionDigits: 0 })}{' '}
              {language === 'en' ? 'orders/month' : 'pedidos/mes'} (
              {results.ordersPerDay.toFixed(1)} {language === 'en' ? 'orders/day' : 'pedidos/día'}) ·{' '}
              {results.unitsPerOrder.toFixed(1)} {language === 'en' ? 'units/order' : 'units/pedido'} · Tier SKU:{' '}
              <span className={`font-semibold ${isDark ? 'text-[#47D2BF]' : 'text-[#2D2825]'}`}>{results.tierName}</span>
            </p>
          </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Internal PDF Presentation Button */}
          <button
            type="button"
            onClick={() => setShowPdfModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#6B4ABF] hover:bg-[#583aa3] text-white text-xs font-semibold rounded-lg shadow-xs border border-[#47D2BF]/40 transition cursor-pointer"
            title={language === 'en' ? 'Generate confidential internal PDF report with operational breakdown' : 'Generar informe PDF confidencial para presentar internamente con desglose operativo'}
          >
            <FileText className="w-3.5 h-3.5 text-[#47D2BF]" />
            <span>{language === 'en' ? 'Create Internal PDF' : 'Crear PDF Interno'}</span>
          </button>

          {onOpenPricingSimulator && (
            <button
              type="button"
              onClick={onOpenPricingSimulator}
              className={`inline-flex items-center gap-1 text-xs font-semibold hover:underline cursor-pointer ${
                isDark ? 'text-[#47D2BF] hover:text-[#38bca9]' : 'text-red-600 hover:text-red-700'
              }`}
            >
              <span>{language === 'en' ? 'Adjust prices & margins' : 'Ajustar precios & márgenes'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className={`p-4 rounded-xl border shadow-2xs transition-colors duration-200 ${
          isDark
            ? 'bg-[#1E1B2E] border-[#2E2A48]'
            : 'bg-white border-[#E5DDD0]'
        }`}>
          <span className={`text-xs font-medium block mb-1 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
            {language === 'en' ? 'Revenue / month' : 'Ingresos / mes'}
          </span>
          <span className={`text-2xl font-extrabold tracking-tight block ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
            {formatEur(results.totalRevenueMonth)}
          </span>
          <span className={`text-[11px] mt-1 block ${isDark ? 'text-gray-400' : 'text-[#8C8278]'}`}>
            {language === 'en' ? 'Costs: ' : 'Costes: '}{formatEur(results.totalCostMonth)}
          </span>
        </div>

        <div className={`p-4 rounded-xl border shadow-2xs transition-colors duration-200 ${
          isDark
            ? 'bg-[#1E1B2E] border-[#2E2A48]'
            : 'bg-white border-[#E5DDD0]'
        }`}>
          <span className={`text-xs font-medium block mb-1 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
            {language === 'en' ? 'Net profit / month' : 'Beneficio neto / mes'}
          </span>
          <span
            className={`text-2xl font-extrabold tracking-tight block ${
              results.totalProfitMonth >= 0
                ? isDark ? 'text-[#47D2BF]' : 'text-emerald-700'
                : 'text-red-500'
            }`}
          >
            {formatEur(results.totalProfitMonth)}
          </span>
          <span className={`text-[11px] mt-1 block ${isDark ? 'text-gray-400' : 'text-[#8C8278]'}`}>
            {formatEur(results.profitPerOrder)} {language === 'en' ? 'per order' : 'por pedido'}
          </span>
        </div>

        <div className={`p-4 rounded-xl border shadow-2xs transition-colors duration-200 ${
          isDark
            ? 'bg-[#1E1B2E] border-[#2E2A48]'
            : 'bg-white border-[#E5DDD0]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en' ? 'Total Margin' : 'Margen Total'}
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded font-mono border ${
              isDark
                ? 'bg-[#25203D] text-[#47D2BF] border-[#47D2BF]/40'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              Markup {formatMarkup(results.markupTotal)}
            </span>
          </div>
          <span
            className={`text-2xl font-extrabold tracking-tight block ${
              results.marginTotal !== null && results.marginTotal >= 0.2
                ? isDark ? 'text-white' : 'text-[#2D2825]'
                : 'text-amber-500'
            }`}
          >
            {formatPct(results.marginTotal)}
          </span>
          <span className={`text-[11px] mt-1 block ${isDark ? 'text-gray-400' : 'text-[#8C8278]'}`}>
            {language === 'en' ? 'General target >= 20%' : 'Objetivo general >= 20%'}
          </span>
        </div>

        <div className={`p-4 rounded-xl border shadow-2xs transition-colors duration-200 ${
          isDark
            ? 'bg-[#1E1B2E] border-[#2E2A48]'
            : 'bg-white border-[#E5DDD0]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en' ? 'Excl. Shipping' : 'Sin Envío'}
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded font-mono border ${
              isDark
                ? 'bg-[#25203D] text-[#47D2BF] border-[#47D2BF]/40'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              Markup {formatMarkup(results.markupExShipping)}
            </span>
          </div>
          <span className={`text-2xl font-extrabold tracking-tight block ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
            {formatPct(results.marginExShipping)}
          </span>
          <span className={`text-[11px] mt-1 block ${isDark ? 'text-gray-400' : 'text-[#8C8278]'}`}>
            {language === 'en' ? 'Shipping Margin: ' : 'Margen Envío: '}
            {formatPct(results.marginShipping)} (Markup {formatMarkup(results.shippingMarkup)})
          </span>
        </div>
      </div>

      {/* Planificación Go-Live & Proyecciones ARR / YRR */}
      <LiveDateScheduler
        goLiveDate={inputs?.goLiveDate || results.goLiveDate}
        results={results}
        onChange={(dateStr) => {
          if (onUpdateInputs) {
            onUpdateInputs({ goLiveDate: dateStr });
          }
        }}
      />

      {/* OPERACIONES DE PREPARACIÓN & PICKING: PACK Y 1ER PICK SEPARADOS */}
      <div className={`rounded-xl border p-5 shadow-2xs transition-colors duration-200 ${
        isDark
          ? 'bg-[#1E1B2E] border-[#2E2A48]'
          : 'bg-white border-[#E5DDD0]'
      }`}>
        <div className={`flex items-center gap-2 border-b pb-3 mb-4 ${
          isDark ? 'border-[#2E2A48]' : 'border-[#EFE8DC]'
        }`}>
          <Package className={`w-5 h-5 ${isDark ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`} />
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-wide ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
              {language === 'en'
                ? 'Order Preparation & Picking (Pack & 1st Pick)'
                : 'Preparación de Pedido & Picking (Pack & 1er Pick)'}
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en'
                ? 'Separate operational rates: base packaging material and physical picking per unit.'
                : 'Tarifas operativas separadas: material de packaging base y picking físico por unidad.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pack Component */}
          <div className={`p-3.5 rounded-lg border ${
            isDark
              ? 'bg-[#151226] border-[#2E2A48]'
              : 'bg-[#FAF7F2] border-[#E5DDD0]'
          }`}>
            <div className="flex justify-between items-center mb-1">
              <span className={`text-xs font-bold ${isDark ? 'text-gray-200' : 'text-[#2D2825]'}`}>
                {language === 'en' ? '1. Base preparation (Pack)' : '1. Preparación base (Pack)'}
              </span>
              <span className={`text-sm font-mono font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                {formatEur(results.packPrice)}
              </span>
            </div>
            <div className={`text-[11px] space-y-0.5 mt-2 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Operational cost:' : 'Coste operativo:'}</span>
                <span className={`font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>{formatEur(results.packCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Applied margin:' : 'Margen aplicado:'}</span>
                <span className={`font-mono font-medium ${isDark ? 'text-[#47D2BF]' : 'text-emerald-700'}`}>
                  {formatPct(results.packMargin)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Markup over cost:' : 'Markup s/coste:'}</span>
                <span className={`font-mono font-medium ${isDark ? 'text-purple-300' : 'text-blue-700'}`}>
                  {formatMarkup(results.packMarkup)}
                </span>
              </div>
            </div>
          </div>

          {/* 1st Pick Component */}
          <div className={`p-3.5 rounded-lg border ${
            isDark
              ? 'bg-[#151226] border-[#2E2A48]'
              : 'bg-[#FAF7F2] border-[#E5DDD0]'
          }`}>
            <div className="flex justify-between items-center mb-1">
              <span className={`text-xs font-bold ${isDark ? 'text-gray-200' : 'text-[#2D2825]'}`}>
                {language === 'en' ? '2. First Pick (1st unit)' : '2. Primer Pick (1ª unidad)'}
              </span>
              <span className={`text-sm font-mono font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                {formatEur(results.firstPickPrice)}
              </span>
            </div>
            <div className={`text-[11px] space-y-0.5 mt-2 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Operational cost:' : 'Coste operativo:'}</span>
                <span className={`font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>{formatEur(results.firstPickCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Applied margin:' : 'Margen aplicado:'}</span>
                <span className={`font-mono font-medium ${isDark ? 'text-[#47D2BF]' : 'text-emerald-700'}`}>
                  {formatPct(results.firstPickMargin)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Markup over cost:' : 'Markup s/coste:'}</span>
                <span className={`font-mono font-medium ${isDark ? 'text-purple-300' : 'text-blue-700'}`}>
                  {formatMarkup(results.firstPickMarkup)}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Picks Component */}
          <div className={`p-3.5 rounded-lg border ${
            isDark
              ? 'bg-[#151226] border-[#2E2A48]'
              : 'bg-[#FAF7F2] border-[#E5DDD0]'
          }`}>
            <div className="flex justify-between items-center mb-1">
              <span className={`text-xs font-bold ${isDark ? 'text-gray-200' : 'text-[#2D2825]'}`}>
                {language === 'en' ? '3. Additional picks (> 1 unit)' : '3. Picks adicionales (> 1 unit)'}
              </span>
              <span className={`text-sm font-mono font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                {formatEur(results.additionalPickPrice)}
              </span>
            </div>
            <div className={`text-[11px] space-y-0.5 mt-2 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Operating cost / pick:' : 'Coste operativo / pick:'}</span>
                <span className={`font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>{formatEur(results.additionalPickCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Applied margin:' : 'Margen aplicado:'}</span>
                <span className={`font-mono font-medium ${isDark ? 'text-[#47D2BF]' : 'text-emerald-700'}`}>
                  {formatPct(results.additionalPickMargin)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Markup over cost:' : 'Markup s/coste:'}</span>
                <span className={`font-mono font-medium ${isDark ? 'text-purple-300' : 'text-blue-700'}`}>
                  {formatMarkup(results.additionalPickMarkup)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CARRIER & DETAILED SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Resumen por Pedido */}
        <div className={`lg:col-span-2 rounded-xl border overflow-hidden shadow-2xs transition-colors duration-200 ${
          isDark
            ? 'bg-[#1E1B2E] border-[#2E2A48]'
            : 'bg-white border-[#E5DDD0]'
        }`}>
          <div className={`px-5 py-3.5 border-b flex justify-between items-center flex-wrap gap-2 ${
            isDark
              ? 'bg-[#252238] border-[#2E2A48]'
              : 'bg-[#F4EEE4] border-[#E5DDD0]'
          }`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
              {language === 'en' ? 'Detailed Breakdown per Order' : 'Desglose Detallado por Pedido'}
            </h3>
            <span className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en' ? 'Average invoice total: ' : 'Total factura medio: '}
              <strong className={isDark ? 'text-white' : 'text-[#2D2825]'}>
                {formatEur(results.orderRevenueExShipping + results.shippingPrice)}
              </strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className={`font-semibold uppercase text-[10px] border-b ${
                isDark
                  ? 'bg-[#1c182d] text-gray-300 border-[#2E2A48]'
                  : 'bg-[#EFE8DC] text-[#4D453E] border-[#E5DDD0]'
              }`}>
                <tr>
                  <th className="px-4 py-2.5">{language === 'en' ? 'Operational Item' : 'Concepto Operativo'}</th>
                  <th className="px-3 py-2.5 text-right">{language === 'en' ? 'Cost' : 'Coste'}</th>
                  <th className="px-3 py-2.5 text-right">{language === 'en' ? 'Margin' : 'Margen'}</th>
                  <th className={`px-3 py-2.5 text-right ${isDark ? 'text-purple-300' : 'text-blue-700'}`}>Markup</th>
                  <th className={`px-4 py-2.5 text-right font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>{language === 'en' ? 'Sale Price' : 'Precio Venta'}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#2E2A48]' : 'divide-[#EFE8DC]'}`}>
                {/* 1. Preparación base Pack */}
                <tr className={`transition ${isDark ? 'hover:bg-[#25203D]' : 'hover:bg-[#FAF7F2]'}`}>
                  <td className={`px-4 py-2.5 font-medium ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    <div>{language === 'en' ? 'Base preparation (Pack)' : 'Preparación base (Pack)'}</div>
                    <div className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-[#8C8278]'}`}>
                      {language === 'en'
                        ? 'Box/envelope, packaging material and base handling (Calculator)'
                        : 'Caja/sobre, packaging y manipulado base (Calculadora)'}
                    </div>
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
                    {formatEur(results.packCost)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono font-semibold ${isDark ? 'text-[#47D2BF]' : 'text-emerald-700'}`}>
                    {formatPct(results.packMargin)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono font-semibold ${isDark ? 'text-purple-300' : 'text-blue-700'}`}>
                    {formatMarkup(results.packMarkup)}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    {formatEur(results.packPrice)}
                  </td>
                </tr>

                {/* 2. 1er Pick */}
                <tr className={`transition ${isDark ? 'hover:bg-[#25203D]' : 'hover:bg-[#FAF7F2]'}`}>
                  <td className={`px-4 py-2.5 font-medium ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    <div>{language === 'en' ? '1st Pick (1st unit)' : '1er Pick (1ª unidad)'}</div>
                    <div className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-[#8C8278]'}`}>
                      {language === 'en' ? 'Picking of the first unit in the order' : 'Picking de la primera unidad del pedido'}
                    </div>
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
                    {formatEur(results.firstPickCost)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono font-semibold ${isDark ? 'text-[#47D2BF]' : 'text-emerald-700'}`}>
                    {formatPct(results.firstPickMargin)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono font-semibold ${isDark ? 'text-purple-300' : 'text-blue-700'}`}>
                    {formatMarkup(results.firstPickMarkup)}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    {formatEur(results.firstPickPrice)}
                  </td>
                </tr>

                {/* 3. Picks adicionales */}
                <tr className={`transition ${isDark ? 'hover:bg-[#25203D]' : 'hover:bg-[#FAF7F2]'}`}>
                  <td className={`px-4 py-2.5 font-medium ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    <div>{language === 'en' ? 'Additional picks (> 1 unit)' : 'Picks adicionales (> 1 unidad)'}</div>
                    <div className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-[#8C8278]'}`}>
                      {language === 'en'
                        ? `Per extra unit (current average: ${(results.unitsPerOrder - 1).toFixed(1)} extra units)`
                        : `Por unidad extra (media actual: ${(results.unitsPerOrder - 1).toFixed(1)} uds extras)`}
                    </div>
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
                    {formatEur(results.additionalPickCost)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono font-semibold ${isDark ? 'text-[#47D2BF]' : 'text-emerald-700'}`}>
                    {formatPct(results.additionalPickMargin)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono font-semibold ${isDark ? 'text-purple-300' : 'text-blue-700'}`}>
                    {formatMarkup(results.additionalPickMarkup)}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    {formatEur(results.additionalPickPrice)}
                  </td>
                </tr>

                {/* 5. Envío Transporte */}
                <tr className={`transition ${isDark ? 'hover:bg-[#25203D]' : 'hover:bg-[#FAF7F2]'}`}>
                  <td className={`px-4 py-2.5 font-medium ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    <div>{language === 'en' ? 'Shipping (Carrier)' : 'Envío Transporte (Carrier)'}</div>
                    <div className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-[#8C8278]'}`}>
                      {language === 'en' ? 'National standard 24-48h parcel delivery' : 'Tarifa nacional peninsular 24-48h'}
                    </div>
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
                    {formatEur(results.carrierCost)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono font-semibold ${isDark ? 'text-[#47D2BF]' : 'text-emerald-700'}`}>
                    {formatPct(results.shippingMargin)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono font-semibold ${isDark ? 'text-purple-300' : 'text-blue-700'}`}>
                    {formatMarkup(results.shippingMarkup)}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono font-bold ${isDark ? 'text-[#47D2BF]' : 'text-blue-700'}`}>
                    {formatEur(results.shippingPrice)}
                  </td>
                </tr>

                {/* 6. Total Facturado Pedido */}
                <tr className={`font-bold border-t ${
                  isDark
                    ? 'bg-[#252238] border-[#2E2A48]'
                    : 'bg-[#F4EEE4] border-[#E5DDD0]'
                }`}>
                  <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    {language === 'en' ? 'TOTAL ESTIMATED PER ORDER (WITH SHIPPING)' : 'TOTAL ESTIMADO POR PEDIDO (CON ENVÍO)'}
                  </td>
                  <td className={`px-3 py-3 text-right font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
                    {formatEur(results.orderCostExShipping + results.carrierCost)}
                  </td>
                  <td className={`px-3 py-3 text-right font-mono font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    {formatPct(results.marginTotal)}
                  </td>
                  <td className={`px-3 py-3 text-right font-mono font-bold ${isDark ? 'text-purple-300' : 'text-blue-700'}`}>
                    {formatMarkup(results.markupTotal)}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono font-black text-sm ${isDark ? 'text-[#47D2BF]' : 'text-[#2D2825]'}`}>
                    {formatEur(results.orderRevenueExShipping + results.shippingPrice)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Envío & Alertas */}
        <div className="space-y-4">
          {/* Carrier Card */}
          <div className={`p-4 rounded-xl border shadow-2xs transition-colors duration-200 ${
            isDark
              ? 'bg-[#1E1B2E] border-[#2E2A48]'
              : 'bg-white border-[#E5DDD0]'
          }`}>
            <div className={`flex items-center gap-2 pb-2 mb-3 border-b ${
              isDark ? 'border-[#2E2A48]' : 'border-[#EFE8DC]'
            }`}>
              <Truck className={`w-4 h-4 ${isDark ? 'text-[#47D2BF]' : 'text-blue-600'}`} />
              <h3 className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                {language === 'en' ? 'Shipping (Carrier Cost + Margin)' : 'Envío (Carrier Cost + Margen)'}
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className={isDark ? 'text-gray-400' : 'text-[#6D635B]'}>
                  {language === 'en' ? 'Carrier base cost:' : 'Carrier Coste base:'}
                </span>
                <span className={`font-mono font-bold ${isDark ? 'text-gray-200' : 'text-[#2D2825]'}`}>
                  {formatEur(results.carrierCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-gray-400' : 'text-[#6D635B]'}>
                  {language === 'en' ? 'Target carrier margin:' : 'Margen carrier objetivo:'}
                </span>
                <div className="text-right">
                  <span className={`font-mono font-semibold block ${isDark ? 'text-[#47D2BF]' : 'text-blue-600'}`}>
                    {formatPct(results.shippingMargin)}
                  </span>
                  <span className={`text-[10px] font-mono ${isDark ? 'text-gray-400' : 'text-[#8C8278]'}`}>
                    Markup: {formatMarkup(results.shippingMarkup)}
                  </span>
                </div>
              </div>
              <div className={`flex justify-between pt-2 border-t items-baseline ${
                isDark ? 'border-[#2E2A48]' : 'border-[#EFE8DC]'
              }`}>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                  {language === 'en' ? 'Shipping Sale Price:' : 'Precio Venta Envío:'}
                </span>
                <span className={`font-mono font-extrabold text-sm ${isDark ? 'text-[#47D2BF]' : 'text-blue-700'}`}>
                  {formatEur(results.shippingPrice)}
                </span>
              </div>
              <div className={`text-[11px] font-medium text-right ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {language === 'en' ? 'Net contribution: +' : 'Contribución neta: +'}{formatEur(results.shippingProfitPerOrder)} {language === 'en' ? '/ shipment' : '/ envío'}
              </div>
            </div>
          </div>

          {/* Alertas Operativas */}
          <div className={`p-4 rounded-xl border shadow-2xs transition-colors duration-200 ${
            isDark
              ? 'bg-[#1E1B2E] border-[#2E2A48]'
              : 'bg-white border-[#E5DDD0]'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wide mb-2.5 flex items-center gap-1.5 ${
              isDark ? 'text-white' : 'text-[#2D2825]'
            }`}>
              <Info className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <span>{language === 'en' ? 'Validations & Alerts' : 'Validaciones y Alertas'}</span>
            </h3>

            {results.alerts.length === 0 ? (
              <div className={`flex items-center gap-2 text-xs p-2.5 rounded-lg border ${
                isDark
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>
                  {language === 'en'
                    ? 'Balanced margins and prices with no operational warnings detected.'
                    : 'Márgenes y precios equilibrados sin alertas operativas detectadas.'}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {results.alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 text-[11px] p-2.5 rounded-lg border ${
                      isDark
                        ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                        : 'bg-amber-50 text-amber-900 border-amber-200'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{translateAlert(alert)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Modal for Internal PDF Presentation */}
      <InternalReportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        results={results}
        inputs={effectiveInputs}
      />
    </div>
  );
};
