import React from 'react';
import { CalculationResults, CalculatorInputs } from '../types';
import { formatEur } from '../utils/calculations';
import { Printer, Copy, Check, Package, Truck, Box, ShieldCheck } from 'lucide-react';

interface PropuestaClienteTabProps {
  inputs: CalculatorInputs;
  results: CalculationResults;
}

export const PropuestaClienteTab: React.FC<PropuestaClienteTabProps> = ({
  inputs,
  results,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const text = `================================================
PROPUESTA ECONÓMICA DE SERVICIOS DE FULFILMENT
Cliente: ${results.clientName}
Fecha: ${new Date().toLocaleDateString('es-ES')}
================================================

1. TARIFA DE PREPARACIÓN DE PEDIDO (BASE):
- Tarifa Preparación + 1er Pick: ${formatEur(results.prepPlusFirstPickPrice)} por pedido
  (Incluye empaquetado del pedido y preparación de la primera unidad)

2. PICKING ADICIONAL:
- Pick por cada unidad adicional (> 1 unit): ${formatEur(results.additionalPickPrice)} por unidad extra

3. ENVÍO Y TRANSPORTE (CARRIER):
- Tarifa de envío estándar: ${formatEur(results.shippingPrice)} por envío

4. SERVICIOS ADICIONALES:
- Packaging base estándar: ${formatEur(inputs.packagingPrice)} por pedido
- Inserts publicitarios: ${formatEur(inputs.insertPrice)} por folleto
- Cobertura incidencias / fragilidad: ${formatEur(inputs.surchargePrice)} por pedido

5. ALMACENAJE Y RECEPCIÓN:
- Almacenaje en estantería/rack: ${formatEur(inputs.storagePrice)} por pallet / semana
- Recepción y descarga (Goods-in): ${formatEur(inputs.goodsInPrice)} por pallet

ESTIMACIÓN MENSUAL APROXIMADA:
- Volumen base estimado: ${results.ordersMonth} pedidos/mes (${results.unitsPerOrder} units/pedido)
- Total factura mensual estimada (con envío): ${formatEur(results.totalRevenueMonth)}
================================================`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Action Bar */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Propuesta Comercial del Cliente</h2>
          <p className="text-xs text-gray-500">
            Formato limpio y formal listo para presentar o enviar al cliente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg shadow-2xs transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Copiado!' : 'Copiar texto'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-2xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Proposal Card (Printable) */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-xs print:border-none print:p-0">
        {/* Document Header */}
        <div className="border-b border-gray-200 pb-6 mb-6 flex justify-between items-start">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 block mb-1">
              Propuesta Tarifaria de Fulfilment
            </span>
            <h1 className="text-2xl font-black text-gray-900">{results.clientName}</h1>
            <p className="text-xs text-gray-500 mt-1">
              Perfil: {inputs.productType} · {inputs.skuCount} SKUs activos
            </p>
          </div>

          <div className="text-right text-xs text-gray-400">
            <div>Fecha: <span className="text-gray-700 font-semibold">{new Date().toLocaleDateString('es-ES')}</span></div>
            <div>Ref: <span className="font-mono text-gray-700">COT-{new Date().getFullYear()}-{inputs.skuCount}S</span></div>
          </div>
        </div>

        {/* Volume Context */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 grid grid-cols-3 gap-4 text-center border border-gray-100">
          <div>
            <span className="text-[11px] text-gray-500 block">Volumen mensual estimado</span>
            <span className="text-base font-bold text-gray-900 font-mono">
              {results.ordersMonth.toLocaleString('es-ES', { maximumFractionDigits: 0 })} pedidos / mes
            </span>
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block">Cadencia diaria media</span>
            <span className="text-base font-bold text-gray-900 font-mono">
              {results.ordersPerDay.toFixed(1)} pedidos / día
            </span>
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block">Cesta media</span>
            <span className="text-base font-bold text-gray-900 font-mono">
              {results.unitsPerOrder.toFixed(1)} units / pedido
            </span>
          </div>
        </div>

        {/* Core Rates Section */}
        <div className="space-y-6">
          {/* 1. Preparación de Pedido */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                1. Tarifas de Preparación & Picking
              </h3>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5">Servicio</th>
                    <th className="px-4 py-2.5">Descripción</th>
                    <th className="px-4 py-2.5 text-right">Tarifa acordada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="bg-red-50/30">
                    <td className="px-4 py-3 font-bold text-gray-900">
                      Preparación de Pedido (Pack + 1er Pick)
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      Fee base por pedido que incluye material de empaque y picking de la 1ª unidad
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-extrabold text-sm text-red-600">
                      {formatEur(results.prepPlusFirstPickPrice)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-gray-800">
                      Pick Adicional (desde 2ª unidad)
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      Por cada unidad adicional que contenga el mismo pedido
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-900">
                      {formatEur(results.additionalPickPrice)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-gray-800">
                      Packaging base estándar
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      Caja o sobre homologado, cinta y etiqueta de envío
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-900">
                      {formatEur(inputs.packagingPrice)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Envío */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                2. Transporte y Entrega
              </h3>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5">Servicio</th>
                    <th className="px-4 py-2.5">Condiciones</th>
                    <th className="px-4 py-2.5 text-right">Tarifa acordada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-gray-800">
                      Envío Nacional Peninsular
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      Entrega en 24-48h con seguimiento y aviso al destinatario
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-blue-700">
                      {formatEur(results.shippingPrice)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Almacenaje y Recepción */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Box className="w-4 h-4 text-gray-700" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                3. Almacenaje y Recepción de Mercancía
              </h3>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5">Servicio</th>
                    <th className="px-4 py-2.5">Unidad de medida</th>
                    <th className="px-4 py-2.5 text-right">Tarifa acordada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-gray-800">
                      Almacenaje en estantería (Pallet Rack)
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">Por pallet europeo / semana</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-900">
                      {formatEur(inputs.storagePrice)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-gray-800">
                      Recepción de mercancía (Goods-in)
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      Por pallet recibido y ubicado con control de albarán
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-900">
                      {formatEur(inputs.goodsInPrice)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-gray-800">
                      Gestión de devoluciones (Returns)
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      Recepción, inspección y reubicación en stock
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-900">
                      {formatEur(inputs.returnHandlingPrice)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Summary */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Precios netos sin IVA. Cotización válida por 30 días naturales.</span>
          </div>
          <div className="text-right">
            <span className="block text-gray-400 text-[11px]">Facturación estimada / pedido medio:</span>
            <span className="text-sm font-bold font-mono text-gray-900">
              {formatEur(results.orderRevenueExShipping + results.shippingPrice)} (sin IVA)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
