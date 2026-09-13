import React, { useState } from 'react';
import { CalculationResults, CalculatorInputs } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatEur, formatPct, formatMarkup } from '../utils/calculations';
import { AlertTriangle, CheckCircle, Package, Truck, Info, ArrowUpRight, FileText } from 'lucide-react';
import { InternalReportModal } from './InternalReportModal';

interface ResumenTabProps {
  results: CalculationResults;
  inputs?: CalculatorInputs;
  onOpenPricingSimulator?: () => void;
}

export const ResumenTab: React.FC<ResumenTabProps> = ({ results, inputs, onOpenPricingSimulator }) => {
  const [showPdfModal, setShowPdfModal] = useState(false);
  const { language } = useLanguage();

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
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 text-xs font-bold uppercase rounded bg-red-100 text-red-700 tracking-wide">
                {language === 'en' ? 'Client' : 'Cliente'}
              </span>
              <h2 className="text-lg font-bold text-gray-900">
                {results.clientName || (language === 'en' ? 'Unnamed Client' : 'Cliente sin nombre')}
              </h2>
              {results.technologies && results.technologies.length > 0 && (
                <div className="flex items-center gap-1">
                  {results.technologies.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200 px-1.5 py-0.5 rounded"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {results.ordersMonth.toLocaleString(language === 'en' ? 'en-US' : 'es-ES', { maximumFractionDigits: 0 })}{' '}
              {language === 'en' ? 'orders/month' : 'pedidos/mes'} (
              {results.ordersPerDay.toFixed(1)} {language === 'en' ? 'orders/day' : 'pedidos/día'}) ·{' '}
              {results.unitsPerOrder.toFixed(1)} {language === 'en' ? 'units/order' : 'units/pedido'} · Tier SKU:{' '}
              <span className="font-semibold text-gray-700">{results.tierName}</span>
            </p>
          </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Internal PDF Presentation Button */}
          <button
            type="button"
            onClick={() => setShowPdfModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
            title={language === 'en' ? 'Generate confidential internal PDF report with operational breakdown' : 'Generar informe PDF confidencial para presentar internamente con desglose operativo'}
          >
            <FileText className="w-3.5 h-3.5 text-red-400" />
            <span>{language === 'en' ? 'Create Internal PDF' : 'Crear PDF Interno'}</span>
          </button>

          {onOpenPricingSimulator && (
            <button
              type="button"
              onClick={onOpenPricingSimulator}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
            >
              <span>{language === 'en' ? 'Adjust prices & margins' : 'Ajustar precios & márgenes'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-medium text-gray-500 block mb-1">
            {language === 'en' ? 'Revenue / month' : 'Ingresos / mes'}
          </span>
          <span className="text-2xl font-extrabold text-gray-900 tracking-tight block">
            {formatEur(results.totalRevenueMonth)}
          </span>
          <span className="text-[11px] text-gray-400 mt-1 block">
            {language === 'en' ? 'Costs: ' : 'Costes: '}{formatEur(results.totalCostMonth)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-medium text-gray-500 block mb-1">
            {language === 'en' ? 'Net profit / month' : 'Beneficio neto / mes'}
          </span>
          <span
            className={`text-2xl font-extrabold tracking-tight block ${
              results.totalProfitMonth >= 0 ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {formatEur(results.totalProfitMonth)}
          </span>
          <span className="text-[11px] text-gray-400 mt-1 block">
            {formatEur(results.profitPerOrder)} {language === 'en' ? 'per order' : 'por pedido'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">
              {language === 'en' ? 'Total Margin' : 'Margen Total'}
            </span>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-mono border border-blue-200">
              Markup {formatMarkup(results.markupTotal)}
            </span>
          </div>
          <span
            className={`text-2xl font-extrabold tracking-tight block ${
              results.marginTotal !== null && results.marginTotal >= 0.2
                ? 'text-gray-900'
                : 'text-amber-600'
            }`}
          >
            {formatPct(results.marginTotal)}
          </span>
          <span className="text-[11px] text-gray-400 mt-1 block">
            {language === 'en' ? 'General target >= 20%' : 'Objetivo general >= 20%'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">
              {language === 'en' ? 'Excl. Shipping' : 'Sin Envío'}
            </span>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-mono border border-blue-200">
              Markup {formatMarkup(results.markupExShipping)}
            </span>
          </div>
          <span className="text-2xl font-extrabold text-gray-900 tracking-tight block">
            {formatPct(results.marginExShipping)}
          </span>
          <span className="text-[11px] text-gray-400 mt-1 block">
            {language === 'en' ? 'Shipping Margin: ' : 'Margen Envío: '}
            {formatPct(results.marginShipping)} (Markup {formatMarkup(results.shippingMarkup)})
          </span>
        </div>
      </div>

      {/* OPERACIONES DE PREPARACIÓN & PICKING: PACK Y 1ER PICK SEPARADOS */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
          <Package className="w-5 h-5 text-red-600" />
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              {language === 'en'
                ? 'Order Preparation & Picking (Pack & 1st Pick)'
                : 'Preparación de Pedido & Picking (Pack & 1er Pick)'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {language === 'en'
                ? 'Separate operational rates: base packaging material and physical picking per unit.'
                : 'Tarifas operativas separadas: material de packaging base y picking físico por unidad.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pack Component */}
          <div className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-gray-800">
                {language === 'en' ? '1. Base preparation (Pack)' : '1. Preparación base (Pack)'}
              </span>
              <span className="text-sm font-mono font-bold text-gray-900">{formatEur(results.packPrice)}</span>
            </div>
            <div className="text-[11px] text-gray-500 space-y-0.5 mt-2">
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Operational cost:' : 'Coste operativo:'}</span>
                <span className="font-mono text-gray-700">{formatEur(results.packCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Applied margin:' : 'Margen aplicado:'}</span>
                <span className="font-mono font-medium text-emerald-700">{formatPct(results.packMargin)}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Markup over cost:' : 'Markup s/coste:'}</span>
                <span className="font-mono font-medium text-blue-700">{formatMarkup(results.packMarkup)}</span>
              </div>
            </div>
          </div>

          {/* 1st Pick Component */}
          <div className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-gray-800">
                {language === 'en' ? '2. First Pick (1st unit)' : '2. Primer Pick (1ª unidad)'}
              </span>
              <span className="text-sm font-mono font-bold text-gray-900">{formatEur(results.firstPickPrice)}</span>
            </div>
            <div className="text-[11px] text-gray-500 space-y-0.5 mt-2">
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Operational cost:' : 'Coste operativo:'}</span>
                <span className="font-mono text-gray-700">{formatEur(results.firstPickCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Applied margin:' : 'Margen aplicado:'}</span>
                <span className="font-mono font-medium text-emerald-700">{formatPct(results.firstPickMargin)}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Markup over cost:' : 'Markup s/coste:'}</span>
                <span className="font-mono font-medium text-blue-700">{formatMarkup(results.firstPickMarkup)}</span>
              </div>
            </div>
          </div>

          {/* Additional Picks Component */}
          <div className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-gray-800">
                {language === 'en' ? '3. Additional picks (> 1 unit)' : '3. Picks adicionales (> 1 unit)'}
              </span>
              <span className="text-sm font-mono font-bold text-gray-900">{formatEur(results.additionalPickPrice)}</span>
            </div>
            <div className="text-[11px] text-gray-500 space-y-0.5 mt-2">
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Operating cost / pick:' : 'Coste operativo / pick:'}</span>
                <span className="font-mono text-gray-700">{formatEur(results.additionalPickCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Applied margin:' : 'Margen aplicado:'}</span>
                <span className="font-mono font-medium text-emerald-700">{formatPct(results.additionalPickMargin)}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Markup over cost:' : 'Markup s/coste:'}</span>
                <span className="font-mono font-medium text-blue-700">{formatMarkup(results.additionalPickMarkup)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CARRIER & DETAILED SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Resumen por Pedido */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-sm font-bold text-gray-900">
              {language === 'en' ? 'Detailed Breakdown per Order' : 'Desglose Detallado por Pedido'}
            </h3>
            <span className="text-xs text-gray-500 font-mono">
              {language === 'en' ? 'Average invoice total: ' : 'Total factura medio: '}
              {formatEur(results.orderRevenueExShipping + results.shippingPrice)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-100 text-gray-600 font-semibold uppercase text-[10px] border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5">{language === 'en' ? 'Operational Item' : 'Concepto Operativo'}</th>
                  <th className="px-3 py-2.5 text-right">{language === 'en' ? 'Cost' : 'Coste'}</th>
                  <th className="px-3 py-2.5 text-right">{language === 'en' ? 'Margin' : 'Margen'}</th>
                  <th className="px-3 py-2.5 text-right text-blue-700">Markup</th>
                  <th className="px-4 py-2.5 text-right font-bold text-gray-900">{language === 'en' ? 'Sale Price' : 'Precio Venta'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* 1. Preparación base Pack */}
                <tr className="hover:bg-gray-50/80 transition">
                  <td className="px-4 py-2.5 font-medium text-gray-900">
                    <div>{language === 'en' ? 'Base preparation (Pack)' : 'Preparación base (Pack)'}</div>
                    <div className="text-[11px] text-gray-400">
                      {language === 'en'
                        ? 'Box/envelope, packaging material and base handling (Calculator)'
                        : 'Caja/sobre, packaging y manipulado base (Calculadora)'}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-gray-700">
                    {formatEur(results.packCost)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-700">
                    {formatPct(results.packMargin)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-blue-700">
                    {formatMarkup(results.packMarkup)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-900">
                    {formatEur(results.packPrice)}
                  </td>
                </tr>

                {/* 2. 1er Pick */}
                <tr className="hover:bg-gray-50/80 transition">
                  <td className="px-4 py-2.5 font-medium text-gray-900">
                    <div>{language === 'en' ? '1st Pick (1st unit)' : '1er Pick (1ª unidad)'}</div>
                    <div className="text-[11px] text-gray-400">
                      {language === 'en' ? 'Picking of the first unit in the order' : 'Picking de la primera unidad del pedido'}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-gray-700">
                    {formatEur(results.firstPickCost)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-700">
                    {formatPct(results.firstPickMargin)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-blue-700">
                    {formatMarkup(results.firstPickMarkup)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-900">
                    {formatEur(results.firstPickPrice)}
                  </td>
                </tr>

                {/* 3. Picks adicionales */}
                <tr className="hover:bg-gray-50/80 transition">
                  <td className="px-4 py-2.5 font-medium text-gray-900">
                    <div>{language === 'en' ? 'Additional picks (> 1 unit)' : 'Picks adicionales (> 1 unidad)'}</div>
                    <div className="text-[11px] text-gray-400">
                      {language === 'en'
                        ? `Per extra unit (current average: ${(results.unitsPerOrder - 1).toFixed(1)} extra units)`
                        : `Por unidad extra (media actual: ${(results.unitsPerOrder - 1).toFixed(1)} uds extras)`}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-gray-700">
                    {formatEur(results.additionalPickCost)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-700">
                    {formatPct(results.additionalPickMargin)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-blue-700">
                    {formatMarkup(results.additionalPickMarkup)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-900">
                    {formatEur(results.additionalPickPrice)}
                  </td>
                </tr>

                {/* 5. Envío Transporte */}
                <tr className="hover:bg-gray-50/80 transition">
                  <td className="px-4 py-2.5 font-medium text-gray-900">
                    <div>{language === 'en' ? 'Shipping (Carrier)' : 'Envío Transporte (Carrier)'}</div>
                    <div className="text-[11px] text-gray-400">
                      {language === 'en' ? 'National standard 24-48h parcel delivery' : 'Tarifa nacional peninsular 24-48h'}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-gray-700">
                    {formatEur(results.carrierCost)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-700">
                    {formatPct(results.shippingMargin)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-blue-700">
                    {formatMarkup(results.shippingMarkup)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-blue-700">
                    {formatEur(results.shippingPrice)}
                  </td>
                </tr>

                {/* 6. Total Facturado Pedido */}
                <tr className="bg-gray-50 font-bold border-t border-gray-200">
                  <td className="px-4 py-3 text-gray-900">
                    {language === 'en' ? 'TOTAL ESTIMATED PER ORDER (WITH SHIPPING)' : 'TOTAL ESTIMADO POR PEDIDO (CON ENVÍO)'}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-gray-700">
                    {formatEur(results.orderCostExShipping + results.carrierCost)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-gray-900">
                    {formatPct(results.marginTotal)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-blue-700">
                    {formatMarkup(results.markupTotal)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-black text-gray-900 text-sm">
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
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 mb-3 border-b border-gray-100">
              <Truck className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                {language === 'en' ? 'Shipping (Carrier Cost + Margin)' : 'Envío (Carrier Cost + Margen)'}
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">{language === 'en' ? 'Carrier base cost:' : 'Carrier Coste base:'}</span>
                <span className="font-mono text-gray-800">{formatEur(results.carrierCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{language === 'en' ? 'Target carrier margin:' : 'Margen carrier objetivo:'}</span>
                <div className="text-right">
                  <span className="font-mono font-semibold text-blue-600 block">{formatPct(results.shippingMargin)}</span>
                  <span className="text-[10px] text-gray-500 font-mono">Markup: {formatMarkup(results.shippingMarkup)}</span>
                </div>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100 items-baseline">
                <span className="font-bold text-gray-900">{language === 'en' ? 'Shipping Sale Price:' : 'Precio Venta Envío:'}</span>
                <span className="font-mono font-extrabold text-sm text-blue-700">
                  {formatEur(results.shippingPrice)}
                </span>
              </div>
              <div className="text-[11px] text-emerald-700 font-medium text-right">
                {language === 'en' ? 'Net contribution: +' : 'Contribución neta: +'}{formatEur(results.shippingProfitPerOrder)} {language === 'en' ? '/ shipment' : '/ envío'}
              </div>
            </div>
          </div>

          {/* Alertas Operativas */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-gray-500" />
              <span>{language === 'en' ? 'Validations & Alerts' : 'Validaciones y Alertas'}</span>
            </h3>

            {results.alerts.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
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
                    className="flex items-start gap-2 text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
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
