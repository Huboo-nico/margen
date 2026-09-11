import React from 'react';
import { CalculationResults, CalculatorInputs } from '../types';
import { formatEur, formatPct, formatMarkup } from '../utils/calculations';
import { Printer, X, FileText, Package, Layers, Building2, Calendar } from 'lucide-react';

interface InternalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: CalculationResults;
  inputs: CalculatorInputs;
}

export const InternalReportModal: React.FC<InternalReportModalProps> = ({
  isOpen,
  onClose,
  results,
  inputs,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden print:max-h-none print:max-w-none print:border-none print:shadow-none print:rounded-none">
        {/* Modal Toolbar (hidden on print) */}
        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-red-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Informe Interno de Rentabilidad & Operativa</h2>
              <p className="text-[11px] text-gray-400">
                Documento ejecutivo con desglose operativo completo para presentación interna
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-gray-900 print:p-6 print:overflow-visible print:text-black">
          {/* Document Header */}
          <div className="border-b-2 border-red-600 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    Confidencial · Uso Interno
                  </span>
                  <span className="text-xs text-gray-500 font-mono">ID: {results.clientName ? results.clientName.replace(/\s+/g, '-').toLowerCase() : 'cliente'}</span>
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  Informe de Rentabilidad & Desglose Operativo
                </h1>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-600 mt-1.5">
                  <span className="flex items-center gap-1 font-semibold text-gray-800">
                    <Building2 className="w-3.5 h-3.5 text-gray-500" />
                    Cliente: {results.clientName || 'Cliente sin nombre'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    Fecha: {currentDate}
                  </span>
                  <span>
                    Sector: <strong>{inputs.productType}</strong> ({inputs.skuCount} SKUs, Tier {results.tierName})
                  </span>
                </div>
              </div>

              <div className="text-right sm:text-right bg-gray-50 p-3 rounded-lg border border-gray-200 shrink-0">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">
                  Volumen Estimado
                </span>
                <span className="text-base font-black font-mono text-gray-900 block">
                  {results.ordersMonth.toLocaleString('es-ES', { maximumFractionDigits: 0 })} pedidos/mes
                </span>
                <span className="text-[11px] text-gray-500 block">
                  {results.ordersPerDay.toFixed(1)} pedidos/día · {results.unitsPerOrder.toFixed(1)} units/pedido
                </span>
              </div>
            </div>

            {inputs.clientNotes && (
              <div className="mt-3 bg-amber-50/70 border border-amber-200/80 rounded-md p-2.5 text-xs text-amber-900">
                <strong className="font-semibold">Notas del cliente / Operativa:</strong> {inputs.clientNotes}
              </div>
            )}
          </div>

          {/* 1. Resumen Ejecutivo Mensual */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-red-600" />
              1. Resumen Ejecutivo Mensual
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                <span className="text-[11px] font-medium text-gray-500 block">Facturación / mes</span>
                <span className="text-xl font-black font-mono text-gray-900 block mt-0.5">
                  {formatEur(results.totalRevenueMonth)}
                </span>
                <span className="text-[10px] text-gray-400">Total con transporte</span>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                <span className="text-[11px] font-medium text-gray-500 block">Costes operativos / mes</span>
                <span className="text-xl font-black font-mono text-gray-700 block mt-0.5">
                  {formatEur(results.totalCostMonth)}
                </span>
                <span className="text-[10px] text-gray-400">Almacén + carrier</span>
              </div>

              <div className="bg-emerald-50/70 p-3.5 rounded-lg border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-800 block">Beneficio neto / mes</span>
                <span className="text-xl font-black font-mono text-emerald-700 block mt-0.5">
                  {formatEur(results.totalProfitMonth)}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">
                  {formatEur(results.profitPerOrder)} por pedido
                </span>
              </div>

              <div className="bg-blue-50/70 p-3.5 rounded-lg border border-blue-200">
                <span className="text-[11px] font-bold text-blue-800 block">Margen & Markup Global</span>
                <span className="text-xl font-black font-mono text-blue-950 block mt-0.5">
                  {formatPct(results.marginTotal)}
                </span>
                <span className="text-[10px] font-semibold text-blue-700 font-mono">
                  Markup: {formatMarkup(results.markupTotal)}
                </span>
              </div>
            </div>

            {/* Split Sin Envío vs Con Envío */}
            <div className="mt-2.5 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50/80 p-2.5 rounded-md border border-gray-200 flex justify-between items-center">
                <span className="text-gray-600">Margen Operativa Almacén (Sin Envío):</span>
                <div className="text-right">
                  <span className="font-bold text-gray-900 font-mono">{formatPct(results.marginExShipping)}</span>
                  <span className="text-[10px] text-blue-700 font-mono ml-1 font-semibold">
                    (Markup {formatMarkup(results.markupExShipping)})
                  </span>
                </div>
              </div>
              <div className="bg-gray-50/80 p-2.5 rounded-md border border-gray-200 flex justify-between items-center">
                <span className="text-gray-600">Margen Transporte (Carrier):</span>
                <div className="text-right">
                  <span className="font-bold text-gray-900 font-mono">{formatPct(results.marginShipping)}</span>
                  <span className="text-[10px] text-blue-700 font-mono ml-1 font-semibold">
                    (Markup {formatMarkup(results.shippingMarkup)})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Desglose Detallado por Pedido (Coste de pack + Margen + Precio) */}
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-red-600" />
                2. Desglose Detallado por Pedido (Tarifas Unitarias & Márgenes)
              </h3>
              <span className="text-[11px] text-gray-500 font-mono">
                Total pedido medio: {formatEur(results.orderRevenueExShipping + results.shippingPrice)}
              </span>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 text-gray-700 font-semibold uppercase text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="px-3.5 py-2.5">Concepto Operativo</th>
                    <th className="px-3.5 py-2.5 text-right">Coste Base</th>
                    <th className="px-3.5 py-2.5 text-right">Margen %</th>
                    <th className="px-3.5 py-2.5 text-right text-blue-700">Markup %</th>
                    <th className="px-3.5 py-2.5 text-right font-bold text-gray-900">Precio Venta</th>
                    <th className="px-3.5 py-2.5 text-right text-emerald-800">Margen Unit. €</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Preparación base Pack */}
                  <tr className="bg-white">
                    <td className="px-3.5 py-2.5 font-semibold text-gray-900">
                      <div>Preparación base (Pack)</div>
                      <div className="text-[10px] text-gray-400">
                        Caja/sobre, manipulado base y precinto (Fuente: Calculadora)
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-gray-700">
                      {formatEur(results.packCost)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-medium text-emerald-700">
                      {formatPct(results.packMargin)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-blue-700">
                      {formatMarkup(results.packMarkup)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-gray-900">
                      {formatEur(results.packPrice)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-emerald-700">
                      +{formatEur(results.packPrice - results.packCost)}
                    </td>
                  </tr>

                  {/* 1er Pick */}
                  <tr className="bg-white">
                    <td className="px-3.5 py-2.5 font-semibold text-gray-900">
                      <div>1er Pick (1ª unidad)</div>
                      <div className="text-[10px] text-gray-400">
                        Picking primera unidad del pedido en estantería
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-gray-700">
                      {formatEur(results.firstPickCost)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-medium text-emerald-700">
                      {formatPct(results.firstPickMargin)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-blue-700">
                      {formatMarkup(results.firstPickMarkup)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-gray-900">
                      {formatEur(results.firstPickPrice)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-emerald-700">
                      +{formatEur(results.firstPickPrice - results.firstPickCost)}
                    </td>
                  </tr>

                  {/* Subtotal Prep + 1er Pick */}
                  <tr className="bg-red-50/40 border-y border-red-100 font-semibold">
                    <td className="px-3.5 py-2.5 text-red-950 font-bold">
                      <div>Total Preparación + 1er Pick (Base Pedido)</div>
                      <div className="text-[10px] text-red-700 font-normal">
                        Tarifa fija mínima aplicada por procesar el paquete
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-red-950">
                      {formatEur(results.prepPlusFirstPickCost)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-red-700">
                      {formatPct(results.prepPlusFirstPickMargin)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-blue-800">
                      {formatMarkup(results.prepPlusFirstPickMarkup)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-black text-red-700 text-sm">
                      {formatEur(results.prepPlusFirstPickPrice)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-emerald-800">
                      +{formatEur(results.prepPlusFirstPickProfit)}
                    </td>
                  </tr>

                  {/* Picks adicionales */}
                  <tr className="bg-white">
                    <td className="px-3.5 py-2.5 font-semibold text-gray-900">
                      <div>Picks adicionales (&gt; 1 unidad)</div>
                      <div className="text-[10px] text-gray-400">
                        Por cada unidad adicional (media actual: {(results.unitsPerOrder - 1).toFixed(1)} uds extras)
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-gray-700">
                      {formatEur(results.additionalPickCost)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-medium text-emerald-700">
                      {formatPct(results.additionalPickMargin)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-blue-700">
                      {formatMarkup(results.additionalPickMarkup)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-gray-900">
                      {formatEur(results.additionalPickPrice)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-emerald-700">
                      +{formatEur(results.additionalPickPrice - results.additionalPickCost)}
                    </td>
                  </tr>

                  {/* Envío Carrier */}
                  <tr className="bg-white">
                    <td className="px-3.5 py-2.5 font-semibold text-gray-900">
                      <div>Envío Transporte (Carrier)</div>
                      <div className="text-[10px] text-gray-400">
                        Entrega 24-48h peninsular estándar
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-gray-700">
                      {formatEur(results.carrierCost)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-medium text-emerald-700">
                      {formatPct(results.shippingMargin)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-blue-700">
                      {formatMarkup(results.shippingMarkup)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-blue-700">
                      {formatEur(results.shippingPrice)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-emerald-700">
                      +{formatEur(results.shippingProfitPerOrder)}
                    </td>
                  </tr>

                  {/* TOTAL MEDIO POR PEDIDO */}
                  <tr className="bg-gray-900 text-white font-bold">
                    <td className="px-3.5 py-3 text-white">
                      TOTAL MEDIO ESTIMADO POR PEDIDO (CON ENVÍO)
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono text-gray-300">
                      {formatEur(results.orderCostExShipping + results.carrierCost)}
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono text-emerald-400">
                      {formatPct(results.marginTotal)}
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono text-blue-300">
                      {formatMarkup(results.markupTotal)}
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono font-black text-white text-sm">
                      {formatEur(results.orderRevenueExShipping + results.shippingPrice)}
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono font-black text-emerald-400 text-sm">
                      +{formatEur(results.profitPerOrder)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Desglose Operativo Mensual Completo */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-red-600" />
              3. Desglose Operativo Completo Mensual (Cuenta de Explotación por Línea)
            </h3>

            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 text-gray-700 font-semibold uppercase text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="px-3.5 py-2">Línea de Servicio</th>
                    <th className="px-3.5 py-2">Categoría</th>
                    <th className="px-3.5 py-2 text-right">Facturación / mes</th>
                    <th className="px-3.5 py-2 text-right">Costes / mes</th>
                    <th className="px-3.5 py-2 text-right text-emerald-800">Beneficio / mes</th>
                    <th className="px-3.5 py-2 text-right">Margen</th>
                    <th className="px-3.5 py-2 text-right text-blue-700">Markup</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80">
                      <td className="px-3.5 py-2 font-medium text-gray-800">{line.linea}</td>
                      <td className="px-3.5 py-2 text-[11px] text-gray-400">{line.categoria}</td>
                      <td className="px-3.5 py-2 text-right font-mono text-gray-900">
                        {formatEur(line.ingresos)}
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono text-gray-600">
                        {formatEur(line.costes)}
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono font-bold text-emerald-700">
                        {formatEur(line.beneficio)}
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono text-gray-800">
                        {formatPct(line.margen)}
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono font-semibold text-blue-700">
                        {formatMarkup(line.markup)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                    <td className="px-3.5 py-2.5 text-gray-900" colSpan={2}>
                      TOTAL GLOBAL MENSUAL
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-gray-900 font-black">
                      {formatEur(results.totalRevenueMonth)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-gray-700">
                      {formatEur(results.totalCostMonth)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-emerald-700 font-black">
                      {formatEur(results.totalProfitMonth)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-black text-gray-900">
                      {formatPct(results.marginTotal)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-black text-blue-700">
                      {formatMarkup(results.markupTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Parámetros Operativos & Packaging */}
          <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-200 text-xs">
            <h4 className="font-bold text-gray-800 mb-2 uppercase text-[10px] tracking-wider">
              Parámetros de Configuración del Cliente
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-1.5 gap-x-4 text-[11px] text-gray-600">
              <div>
                Fuente coste pack: <strong>Calculadora (negociado)</strong>
              </div>
              <div>
                Días laborables: <strong>{inputs.workingDays} días/mes</strong>
              </div>
              <div>
                Mix de pack: <strong>SPK {inputs.mixSpk}%, SPL {inputs.mixSpl}%, MPL {inputs.mixMpl}%, LPL {inputs.mixLpl}%</strong>
              </div>
              <div>
                Coste carrier base: <strong>{formatEur(results.carrierCost)}</strong>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-3 flex items-center justify-between text-[10px] text-gray-400">
            <span>HUBOO FULFILMENT · CALCULADORA OPERATIVA DE RENTABILIDAD</span>
            <span>Documento interno confidencial · Página 1 de 1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
