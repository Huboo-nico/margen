import React from 'react';
import { CalculationResults } from '../types';
import { formatEur, formatPct, formatMarkup } from '../utils/calculations';
import { AlertTriangle, CheckCircle, Package, Truck, Info, ArrowUpRight } from 'lucide-react';

interface ResumenTabProps {
  results: CalculationResults;
  onOpenPricingSimulator?: () => void;
}

export const ResumenTab: React.FC<ResumenTabProps> = ({ results, onOpenPricingSimulator }) => {
  return (
    <div className="space-y-6">
      {/* Client Headline Banner */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-bold uppercase rounded bg-red-100 text-red-700 tracking-wide">
              Cliente
            </span>
            <h2 className="text-lg font-bold text-gray-900">{results.clientName || 'Cliente sin nombre'}</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {results.ordersMonth.toLocaleString('es-ES', { maximumFractionDigits: 0 })} pedidos/mes (
            {results.ordersPerDay.toFixed(1)} pedidos/día) · {results.unitsPerOrder.toFixed(1)} units/pedido · Tier SKU:{' '}
            <span className="font-semibold text-gray-700">{results.tierName}</span>
          </p>
        </div>

        {onOpenPricingSimulator && (
          <button
            type="button"
            onClick={onOpenPricingSimulator}
            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer self-start md:self-auto"
          >
            <span>Ajustar precios & márgenes</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-medium text-gray-500 block mb-1">Ingresos / mes</span>
          <span className="text-2xl font-extrabold text-gray-900 tracking-tight block">
            {formatEur(results.totalRevenueMonth)}
          </span>
          <span className="text-[11px] text-gray-400 mt-1 block">
            Costes: {formatEur(results.totalCostMonth)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-medium text-gray-500 block mb-1">Beneficio neto / mes</span>
          <span
            className={`text-2xl font-extrabold tracking-tight block ${
              results.totalProfitMonth >= 0 ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {formatEur(results.totalProfitMonth)}
          </span>
          <span className="text-[11px] text-gray-400 mt-1 block">
            {formatEur(results.profitPerOrder)} por pedido
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">Margen Total</span>
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
            Objetivo general &gt;= 20%
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">Sin Envío</span>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-mono border border-blue-200">
              Markup {formatMarkup(results.markupExShipping)}
            </span>
          </div>
          <span className="text-2xl font-extrabold text-gray-900 tracking-tight block">
            {formatPct(results.marginExShipping)}
          </span>
          <span className="text-[11px] text-gray-400 mt-1 block">
            Margen Envío: {formatPct(results.marginShipping)} (Markup {formatMarkup(results.shippingMarkup)})
          </span>
        </div>
      </div>

      {/* SPECIAL SPOTLIGHT: PREPARACIÓN + 1ER PICK */}
      <div className="bg-linear-to-r from-red-50/70 via-white to-amber-50/40 rounded-xl border-2 border-red-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-200/80 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-red-600" />
              <h3 className="text-base font-bold text-gray-900">
                Preparación de Pedido: Preparación (Pack) + 1er Pick
              </h3>
            </div>
            <p className="text-xs text-gray-600 mt-1 max-w-xl">
              Estructura estándar de cotización: precio base que cubre el empaquetado inicial y la recogida de la primera unidad del pedido.
            </p>
          </div>

          <div className="bg-white px-5 py-3 rounded-lg border border-red-300 shadow-2xs text-right">
            <span className="text-xs text-gray-500 block font-medium">Total Preparación + 1er Pick</span>
            <span className="text-2xl font-black text-red-600 font-mono">
              {formatEur(results.prepPlusFirstPickPrice)}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 block">
              Margen: {formatPct(results.prepPlusFirstPickMargin)} · Markup: {formatMarkup(results.prepPlusFirstPickMarkup)}
            </span>
            <span className="text-[10px] text-gray-500 block">
              +{formatEur(results.prepPlusFirstPickProfit)} beneficio/pedido
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pack Component */}
          <div className="bg-white p-3.5 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-gray-700">1. Preparación base (Pack)</span>
              <span className="text-xs font-mono font-bold text-gray-900">{formatEur(results.packPrice)}</span>
            </div>
            <div className="text-[11px] text-gray-500 space-y-0.5">
              <div className="flex justify-between">
                <span>Coste operativo:</span>
                <span className="font-mono text-gray-700">{formatEur(results.packCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Margen aplicado:</span>
                <span className="font-mono font-medium text-emerald-700">{formatPct(results.packMargin)}</span>
              </div>
              <div className="flex justify-between">
                <span>Markup s/coste:</span>
                <span className="font-mono font-medium text-blue-700">{formatMarkup(results.packMarkup)}</span>
              </div>
            </div>
          </div>

          {/* 1st Pick Component */}
          <div className="bg-white p-3.5 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-gray-700">2. Primer Pick (1ª unidad)</span>
              <span className="text-xs font-mono font-bold text-gray-900">{formatEur(results.firstPickPrice)}</span>
            </div>
            <div className="text-[11px] text-gray-500 space-y-0.5">
              <div className="flex justify-between">
                <span>Coste operativo:</span>
                <span className="font-mono text-gray-700">{formatEur(results.firstPickCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Margen aplicado:</span>
                <span className="font-mono font-medium text-emerald-700">{formatPct(results.firstPickMargin)}</span>
              </div>
              <div className="flex justify-between">
                <span>Markup s/coste:</span>
                <span className="font-mono font-medium text-blue-700">{formatMarkup(results.firstPickMarkup)}</span>
              </div>
            </div>
          </div>

          {/* Additional Picks Component */}
          <div className="bg-white p-3.5 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-gray-700">3. Picks adicionales (&gt; 1 unit)</span>
              <span className="text-xs font-mono font-bold text-gray-900">{formatEur(results.additionalPickPrice)}</span>
            </div>
            <div className="text-[11px] text-gray-500 space-y-0.5">
              <div className="flex justify-between">
                <span>Coste operativo / pick:</span>
                <span className="font-mono text-gray-700">{formatEur(results.additionalPickCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Margen aplicado:</span>
                <span className="font-mono font-medium text-emerald-700">{formatPct(results.additionalPickMargin)}</span>
              </div>
              <div className="flex justify-between">
                <span>Markup s/coste:</span>
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
          <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-900">Desglose Detallado por Pedido</h3>
            <span className="text-xs text-gray-500 font-mono">
              Total factura medio: {formatEur(results.orderRevenueExShipping + results.shippingPrice)}
            </span>
          </div>

          <table className="w-full text-xs text-left">
            <tbody className="divide-y divide-gray-100">
              {results.orderSummary.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/80 transition">
                  <td className="px-5 py-2.5 font-medium text-gray-800">
                    <div>{item.concepto}</div>
                    {item.detalle && <div className="text-[11px] text-gray-400">{item.detalle}</div>}
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono font-bold text-gray-900">
                    {item.valor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right 1 Col: Envío & Alertas */}
        <div className="space-y-4">
          {/* Carrier Card */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 mb-3 border-b border-gray-100">
              <Truck className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                Envío (Carrier Cost + Margen)
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Carrier Coste base:</span>
                <span className="font-mono text-gray-800">{formatEur(results.carrierCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Margen carrier objetivo:</span>
                <div className="text-right">
                  <span className="font-mono font-semibold text-blue-600 block">{formatPct(results.shippingMargin)}</span>
                  <span className="text-[10px] text-gray-500 font-mono">Markup: {formatMarkup(results.shippingMarkup)}</span>
                </div>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100 items-baseline">
                <span className="font-bold text-gray-900">Precio Venta Envío:</span>
                <span className="font-mono font-extrabold text-sm text-blue-700">
                  {formatEur(results.shippingPrice)}
                </span>
              </div>
              <div className="text-[11px] text-emerald-700 font-medium text-right">
                Contribución neta: +{formatEur(results.shippingProfitPerOrder)} / envío
              </div>
            </div>
          </div>

          {/* Alertas Operativas */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-gray-500" />
              <span>Validaciones y Alertas</span>
            </h3>

            {results.alerts.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Márgenes y precios equilibrados sin alertas operativas detectadas.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {results.alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{alert}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
