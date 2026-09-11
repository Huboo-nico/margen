import React from 'react';
import { CalculatorInputs, CalculationResults, ProductType } from '../types';
import { PriceMarginRow } from './PriceMarginRow';
import { PRODUCT_PROFILES } from '../data/constants';
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

  return (
    <div className="space-y-6">
      {/* Top Banner: Global Impact and Margin Presets */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-red-600" />
              <h2 className="text-base font-bold text-gray-900">
                Panel Completo de Configuración, Precios & Márgenes
              </h2>
            </div>
            <p className="text-xs text-gray-600 mt-1 max-w-3xl">
              Configura los datos del cliente, volumen, mix de pack y ajusta las tarifas operativas.
              Puedes definir precios directamente o establecer el margen objetivo (%) por cada línea.
            </p>
          </div>

          {/* Quick preset margin buttons */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">Margen rápido:</span>
            <button
              type="button"
              onClick={() => applyPresetMarginToAll(0.18)}
              className="px-2.5 py-1 text-xs font-medium rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 cursor-pointer"
            >
              18% (Competitivo)
            </button>
            <button
              type="button"
              onClick={() => applyPresetMarginToAll(0.25)}
              className="px-2.5 py-1 text-xs font-medium rounded border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 cursor-pointer"
            >
              25% (Estándar)
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
            <span className="text-[11px] text-gray-500 block">Facturación / pedido medio:</span>
            <span className="text-base font-bold font-mono text-gray-900">
              {formatEur(results.orderRevenueExShipping + results.shippingPrice)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block">Coste total / pedido medio:</span>
            <span className="text-base font-bold font-mono text-gray-900">
              {formatEur(results.orderCostExShipping + results.carrierCost)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block">Beneficio neto / pedido:</span>
            <span
              className={`text-base font-bold font-mono ${
                results.profitPerOrder >= 0 ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {formatEur(results.profitPerOrder)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block">Margen & Markup Global:</span>
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
              1. Datos del Cliente & Perfil Operativo
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
              Nombre del Cliente / Empresa
            </label>
            <input
              type="text"
              value={inputs.clientName}
              onChange={(e) => onChange({ clientName: e.target.value })}
              placeholder="Ej: Cliente Cosmética Bio"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-2xs"
            />
            <p className="text-[10px] text-gray-400 mt-1">Aparece en presupuestos e informes PDF.</p>
          </div>

          {/* Sector / Tipo Producto */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Tipo de producto / Perfil de picking
            </label>
            <select
              value={inputs.productType}
              onChange={(e) => handleProductChange(e.target.value as ProductType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-red-500 bg-white font-medium text-gray-800"
            >
              {(Object.keys(PRODUCT_PROFILES) as ProductType[]).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-1">
              Factor complejidad: ×{results.productPickMultiplier.toFixed(2)} | Retorno: {formatPct(inputs.returnRate)}
            </p>
          </div>

          {/* Número de SKUs */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Número de SKUs activos
            </label>
            <input
              type="number"
              min={1}
              max={50000}
              value={inputs.skuCount}
              onChange={(e) => onChange({ skuCount: Math.max(1, Number(e.target.value)) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-red-500"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Ajusta el coste de picking por dispersión en nave ({results.tierName}).
            </p>
          </div>
        </div>

        {/* Client Notes & Pack Cost Source */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-3 border-t border-gray-100">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Notas del cliente / Especificaciones de la operativa
            </label>
            <textarea
              rows={2}
              value={inputs.clientNotes || ''}
              onChange={(e) => onChange({ clientNotes: e.target.value })}
              placeholder="Ej: Embalaje especial con papel kraft, cliente requiere integración Shopify, 2 colecciones anuales..."
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Fuente de coste pack base
            </label>
            <div className="w-full border border-emerald-200 bg-emerald-50/50 rounded-lg p-2.5 text-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950">Calculadora (negociado)</span>
                <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                  Activo
                </span>
              </div>
              <p className="text-[10px] text-emerald-800/80 mt-1">
                Costes reales de material pactados con compras y proveedores de cartón.
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
              2. Volumen y Cesta Media
            </h3>
          </div>
          <span className="text-xs font-mono text-gray-600">
            Total mes: <strong>{results.ordersMonth.toLocaleString('es-ES')}</strong> pedidos (
            <strong>{(results.ordersMonth * results.unitsPerOrder).toLocaleString('es-ES', { maximumFractionDigits: 0 })}</strong> units/mes)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Modalidad de volumen */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Modalidad de cálculo
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
                Pedidos / día
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
                Pedidos / mes
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Define si el cliente cotiza por día o mes.</p>
          </div>

          {/* Días Laborables */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Días laborables / mes
            </label>
            <input
              type="number"
              min={1}
              max={31}
              value={inputs.workingDays}
              onChange={(e) => onChange({ workingDays: Math.max(1, Number(e.target.value)) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono font-medium focus:ring-2 focus:ring-red-500"
            />
            <p className="text-[10px] text-gray-400 mt-1">Estándar nacional: 21-22 días/mes.</p>
          </div>

          {/* Pedidos por día / mes sincronizados */}
          {inputs.volumeMode === 'Pedidos/día' ? (
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1">
                Pedidos / día (Entrada)
              </label>
              <input
                type="number"
                step="1"
                min={0}
                value={inputs.ordersPerDay}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value));
                  onChange({
                    ordersPerDay: val,
                    ordersMonth: val * inputs.workingDays,
                  });
                }}
                className="w-full border-2 border-red-300 rounded-lg px-3 py-2 text-xs font-mono font-black text-gray-900 focus:ring-2 focus:ring-red-500 bg-red-50/20"
              />
              <p className="text-[10px] text-gray-500 mt-1 font-mono">
                = {results.ordersMonth.toLocaleString()} ped/mes
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1">
                Pedidos / mes (Entrada)
              </label>
              <input
                type="number"
                step="10"
                min={0}
                value={inputs.ordersMonth}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value));
                  onChange({
                    ordersMonth: val,
                    ordersPerDay: inputs.workingDays > 0 ? val / inputs.workingDays : 0,
                  });
                }}
                className="w-full border-2 border-red-300 rounded-lg px-3 py-2 text-xs font-mono font-black text-gray-900 focus:ring-2 focus:ring-red-500 bg-red-50/20"
              />
              <p className="text-[10px] text-gray-500 mt-1 font-mono">
                = {results.ordersPerDay.toFixed(1)} ped/día
              </p>
            </div>
          )}

          {/* Unidades por pedido */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-gray-700">
                Units por pedido (Cesta)
              </label>
              <span className="font-mono font-bold text-xs text-red-600 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                {inputs.unitsPerOrder} uds
              </span>
            </div>
            <input
              type="number"
              step="0.1"
              min={1.0}
              max={50.0}
              value={inputs.unitsPerOrder}
              onChange={(e) => onChange({ unitsPerOrder: Math.max(1.0, Number(e.target.value)) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono font-medium focus:ring-2 focus:ring-red-500"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              {inputs.unitsPerOrder === 1
                ? '1er Pick únicamente (1 ud/ped).'
                : `1er Pick + ${(inputs.unitsPerOrder - 1).toFixed(1)} picks extra.`}
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
              3. Mix de Pack de Embalaje
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono">
              Coste medio ponderado del pack:{' '}
              <strong className="text-gray-900 text-sm">{formatEur(results.packCost)}</strong>
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                mixTotal === 100
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              Suma: {mixTotal}%
            </span>
          </div>
        </div>

        {/* Quick Presets & Normalizer */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-gray-500 text-[11px] font-medium">Distribuciones comunes:</span>
            <button
              type="button"
              onClick={() => applyMixPreset(0, 0, 50, 50)}
              className="px-2 py-1 text-[11px] bg-white hover:bg-gray-100 border border-gray-200 rounded text-gray-700 font-medium cursor-pointer"
            >
              50% MPL / 50% LPL (Estándar)
            </button>
            <button
              type="button"
              onClick={() => applyMixPreset(50, 50, 0, 0)}
              className="px-2 py-1 text-[11px] bg-white hover:bg-gray-100 border border-gray-200 rounded text-gray-700 font-medium cursor-pointer"
            >
              50% SPK / 50% SPL (Pequeño)
            </button>
            <button
              type="button"
              onClick={() => applyMixPreset(25, 25, 25, 25)}
              className="px-2 py-1 text-[11px] bg-white hover:bg-gray-100 border border-gray-200 rounded text-gray-700 font-medium cursor-pointer"
            >
              25% Uniforme
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
              Normalizar al 100%
            </button>
          )}
        </div>

        {/* 4 Pack Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(
            [
              { key: 'mixSpk', label: 'SPK (Small Packet)', cost: 0.66, desc: 'Sobre / paquete pequeño' },
              { key: 'mixSpl', label: 'SPL (Small Parcel)', cost: 0.66, desc: 'Caja pequeña (hasta 1-2kg)' },
              { key: 'mixMpl', label: 'MPL (Medium Parcel)', cost: 1.00, desc: 'Caja mediana estándar' },
              { key: 'mixLpl', label: 'LPL (Large Parcel)', cost: 1.15, desc: 'Caja grande voluminosa' },
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
                <span className="font-mono font-semibold">Coste: {formatEur(item.cost)}</span>
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
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={inputs[item.key]}
                  onChange={(e) => onChange({ [item.key]: Math.max(0, Math.min(100, Number(e.target.value))) })}
                  className="w-16 text-right border border-gray-300 rounded px-1.5 py-0.5 text-xs font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. PREPARACIÓN DE PEDIDO (PACK + 1ER PICK) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              4. Preparación de Pedido (Pack Base + 1er Pick)
            </h3>
          </div>
          <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
            Total Preparación + 1er Pick: {formatEur(results.prepPlusFirstPickPrice)} (Margen:{' '}
            {formatPct(results.prepPlusFirstPickMargin)} | Markup:{' '}
            {formatMarkup(results.prepPlusFirstPickMarkup)})
          </span>
        </div>

        <PriceMarginRow
          label="Preparación base (Pack)"
          subLabel="Coste del material de embalaje según mix ponderado o coste directo"
          cost={results.packCost}
          mode={inputs.packPriceMode}
          marginTarget={inputs.packMarginTarget}
          manualPrice={results.packPrice}
          allowCostEdit={true}
          onCostChange={(c) => onChange({ packCostOverride: c })}
          onModeChange={(m) => onChange({ packPriceMode: m })}
          onMarginChange={(mg) => onChange({ packMarginTarget: mg })}
          onPriceChange={(p) => onChange({ packPriceManual: p })}
        />

        <PriceMarginRow
          label="Primer Pick del pedido (1ª unidad)"
          subLabel={`Coste ajustado por SKU (×${results.skuMultiplier.toFixed(
            2
          )}) y producto (×${results.productPickMultiplier.toFixed(2)})`}
          cost={results.firstPickCost}
          mode={inputs.firstPickPriceMode}
          marginTarget={inputs.firstPickMarginTarget}
          manualPrice={results.firstPickPrice}
          onModeChange={(m) => onChange({ firstPickPriceMode: m })}
          onMarginChange={(mg) => onChange({ firstPickMarginTarget: mg })}
          onPriceChange={(p) => onChange({ firstPickPriceManual: p })}
        />
      </section>

      {/* 5. PICKS ADICIONALES */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            5. Picks Adicionales (Unidades extra &gt; 1)
          </h3>
          <span className="text-xs text-gray-500 font-mono">
            Con {results.unitsPerOrder} units/pedido = {(results.unitsPerOrder - 1).toFixed(1)} picks extra / ped
          </span>
        </div>

        <PriceMarginRow
          label="Pick adicional por unidad"
          subLabel="Aplica a partir de la 2ª unidad en la cesta de compra"
          cost={results.additionalPickCost}
          mode={inputs.additionalPickPriceMode}
          marginTarget={inputs.additionalPickMarginTarget}
          manualPrice={results.additionalPickPrice}
          onModeChange={(m) => onChange({ additionalPickPriceMode: m })}
          onMarginChange={(mg) => onChange({ additionalPickMarginTarget: mg })}
          onPriceChange={(p) => onChange({ additionalPickPriceManual: p })}
        />
      </section>

      {/* 6. ENVÍO (CARRIER) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              6. Envío (Carrier Cost + Margen de Transporte)
            </h3>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            Venta Envío: {formatEur(results.shippingPrice)} (Margen: {formatPct(results.shippingMargin)} | Markup:{' '}
            {formatMarkup(results.shippingMarkup)})
          </span>
        </div>

        <PriceMarginRow
          label="Envío Carrier nacional / estándar peninsular"
          subLabel="Coste de transporte contratado + margen de intermediación comercial"
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

      {/* 7. SERVICIOS ADICIONALES & ALMACENAJE */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          7. Servicios Adicionales & Almacenaje
        </h3>

        <PriceMarginRow
          label="Packaging base por pedido"
          subLabel="Cajas estándar, cinta personalizada o precinto"
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
          label="Inserts publicitarios / flyers (por unidad)"
          subLabel="Folleto promocional, muestra o tarjeta incluida en el paquete"
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
          label="Gestión de Devoluciones (Returns por unidad)"
          subLabel="Inspección, control de estado, reacondicionamiento y retorno a stock"
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
          label="Recepción de pallets (Goods-in por pallet)"
          subLabel="Descarga de camión, control contra albarán y ubicación en rack"
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
          label="Almacenaje (Storage pallet / semana)"
          subLabel="Coste de metro cúbico / posición de pallet por semana"
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
