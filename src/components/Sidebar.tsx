import React, { useState } from 'react';
import {
  CalculatorInputs,
  CalculationResults,
  ProductType,
} from '../types';
import { PRODUCT_PROFILES } from '../data/constants';
import { ChevronDown, ChevronRight, AlertCircle, Package, Truck, Layers, User } from 'lucide-react';
import { formatEur } from '../utils/calculations';
import { CleanNumberInput } from './CleanNumberInput';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  inputs: CalculatorInputs;
  results: CalculationResults;
  onChange: (updated: Partial<CalculatorInputs>) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ inputs, results, onChange }) => {
  const { currencySymbol, language } = useLanguage();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const handleProductChange = (newProduct: ProductType) => {
    const prof = PRODUCT_PROFILES[newProduct];
    onChange({
      productType: newProduct,
      surchargePrice: 0,
      surchargeCost: 0,
      returnRate: prof.returnRate,
    });
  };

  const mixTotal =
    inputs.mixSpk + inputs.mixSpl + inputs.mixMpl + inputs.mixLpl;

  return (
    <aside className="w-full lg:w-88 bg-white border-r border-gray-200 p-5 shrink-0 overflow-y-auto max-h-[calc(100vh-65px)]">
      {/* 1. Cliente & Operativa */}
      <section className="mb-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 mb-3">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <User className="w-4 h-4 text-red-600" />
            <span>1. Datos del Cliente</span>
          </h2>
        </div>

        <div className="space-y-3">
          <div className="bg-red-50/40 p-2.5 rounded-lg border border-red-100">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-800">
                Nombre del Cliente
              </label>
              <span className="text-[10px] text-red-600 font-semibold bg-white px-1.5 py-0.2 rounded border border-red-200">
                Personalizable
              </span>
            </div>
            <input
              type="text"
              value={inputs.clientName}
              onChange={(e) => onChange({ clientName: e.target.value })}
              placeholder="Ej: Cliente Cosmética Bio"
              className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Número de SKUs activos
            </label>
            <CleanNumberInput
              min={1}
              max={50000}
              step={1}
              integerOnly={true}
              fallbackValue={1}
              value={inputs.skuCount}
              onChange={(val) => onChange({ skuCount: val })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-red-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Tipo de producto
            </label>
            <select
              value={inputs.productType}
              onChange={(e) => handleProductChange(e.target.value as ProductType)}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-red-500 bg-white"
            >
              {(Object.keys(PRODUCT_PROFILES) as ProductType[]).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Fuente de coste pack base
            </label>
            <div className="w-full border border-gray-200 bg-gray-50 rounded px-2.5 py-1.5 text-xs text-gray-800 font-medium flex items-center justify-between">
              <span>Calculadora (negociado)</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">Siempre activo</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Los costes de pack base se rigen por la calculadora operativa.</p>
          </div>

          <div className="bg-gray-50 p-2.5 rounded-md border border-gray-200 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Tier SKU:</span>
              <span className="font-semibold text-gray-800">
                {results.tierName} (×{results.skuMultiplier.toFixed(2)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Factor complejidad producto:</span>
              <span className="font-semibold text-gray-800">
                ×{results.productPickMultiplier.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Parámetros Operativos del Cliente */}
          <div className="pt-2 border-t border-gray-100 space-y-2.5">
            <div className="text-[11px] font-bold text-gray-800 flex items-center justify-between">
              <span>Operativa & Embalaje Cliente</span>
              <span className="text-[9px] text-gray-400 font-normal">Almacén & Picks</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                  Palet x week
                </label>
                <CleanNumberInput
                  min={0}
                  step={1}
                  fallbackValue={0}
                  value={inputs.storagePalletWeeksMonth}
                  onChange={(val) => onChange({ storagePalletWeeksMonth: val })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono"
                  placeholder="0"
                />
                <span className="text-[9px] text-gray-400">Pallets almacenados</span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                  Inbound palets
                </label>
                <CleanNumberInput
                  min={0}
                  step={1}
                  fallbackValue={0}
                  value={inputs.goodsInPalletsMonth}
                  onChange={(val) => onChange({ goodsInPalletsMonth: val })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono"
                  placeholder="0"
                />
                <span className="text-[9px] text-gray-400">Entradas / mes</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                Cantidad de inserts x pick
              </label>
              <CleanNumberInput
                min={0}
                step={1}
                fallbackValue={0}
                value={inputs.insertsPerOrder}
                onChange={(val) => onChange({ insertsPerOrder: val })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono"
                placeholder="0"
              />
              <span className="text-[9px] text-gray-400">Inserts o folletos por pedido</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-gray-700">
                  Packaging personalizado
                </label>
                {inputs.customPackaging && (
                  <span className="text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1 rounded">
                    Cancelado Base
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onChange({ customPackaging: true })}
                  className={`py-1 text-xs font-bold rounded border transition cursor-pointer ${
                    inputs.customPackaging
                      ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Sí (Propio)
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ customPackaging: false })}
                  className={`py-1 text-xs font-bold rounded border transition cursor-pointer ${
                    !inputs.customPackaging
                      ? 'bg-gray-800 text-white border-gray-900 shadow-xs'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  No (Estándar)
                </button>
              </div>
              <p className="text-[9.5px] text-gray-500 mt-1 leading-tight">
                {inputs.customPackaging
                  ? `Packaging propio del cliente activo: el packaging base se cancela (0,00 ${currencySymbol}).`
                  : 'Se factura packaging base estándar.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Volumen */}
      <section className="mb-6">
        <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-1.5 mb-3 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-red-600" />
          <span>{language === 'en' ? '2. Volume & Basket' : '2. Volumen y Órdenes'}</span>
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Modalidad de volumen
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange({ volumeMode: 'Pedidos/día' })}
                className={`py-1 text-xs font-medium rounded border ${
                  inputs.volumeMode === 'Pedidos/día'
                    ? 'border-red-600 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
              >
                Pedidos / día
              </button>
              <button
                type="button"
                onClick={() => onChange({ volumeMode: 'Pedidos/mes' })}
                className={`py-1 text-xs font-medium rounded border ${
                  inputs.volumeMode === 'Pedidos/mes'
                    ? 'border-red-600 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
              >
                Pedidos / mes
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Días laborables
              </label>
              <CleanNumberInput
                min={1}
                max={31}
                step={1}
                integerOnly={true}
                fallbackValue={22}
                value={inputs.workingDays}
                onChange={(val) => onChange({ workingDays: val })}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs font-mono"
              />
            </div>

            {inputs.volumeMode === 'Pedidos/día' ? (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Pedidos / día
                </label>
                <CleanNumberInput
                  min={0}
                  step={1}
                  fallbackValue={0}
                  value={inputs.ordersPerDay}
                  onChange={(val) =>
                    onChange({
                      ordersPerDay: val,
                      ordersMonth: val * inputs.workingDays,
                    })
                  }
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs font-mono font-semibold"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Pedidos / mes
                </label>
                <CleanNumberInput
                  min={0}
                  step={10}
                  fallbackValue={0}
                  value={inputs.ordersMonth}
                  onChange={(val) =>
                    onChange({
                      ordersMonth: val,
                      ordersPerDay:
                        inputs.workingDays > 0
                          ? val / inputs.workingDays
                          : 0,
                    })
                  }
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs font-mono font-semibold"
                />
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
              <span>{language === 'en' ? 'Units per order (Basket)' : 'Units por pedido (órdenes)'}</span>
              <span className="font-mono font-bold text-gray-800">{inputs.unitsPerOrder}</span>
            </div>
            <CleanNumberInput
              min={1.0}
              max={50.0}
              step={0.1}
              decimals={1}
              fallbackValue={1.0}
              value={inputs.unitsPerOrder}
              onChange={(val) => onChange({ unitsPerOrder: val })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs font-mono"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              {inputs.unitsPerOrder === 1
                ? 'Pedidos de 1 sola unidad (solo 1er Pick).'
                : `Incluye 1er Pick + ${(inputs.unitsPerOrder - 1).toFixed(1)} picks adicionales.`}
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
              <span>{language === 'en' ? 'Returns rate (%)' : '% Devoluciones'}</span>
              <span className="font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 text-[11px]">
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
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs font-mono"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              {language === 'en'
                ? `≈ ${Math.round(results.ordersMonth * inputs.returnRate)} returns / month`
                : `≈ ${Math.round(results.ordersMonth * inputs.returnRate)} devoluciones / mes`}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Mix de Pack */}
      <section className="mb-6">
        <div className="flex justify-between items-center border-b border-gray-100 pb-1.5 mb-3">
          <h2 className="text-sm font-bold text-gray-900">3. Mix de Pack</h2>
          <span className="text-[11px] font-mono font-medium text-gray-500">
            Coste mix: {formatEur(results.packCost)}
          </span>
        </div>

        <div className="space-y-2">
          {(['mixSpk', 'mixSpl', 'mixMpl', 'mixLpl'] as const).map((key) => {
            const label =
              key === 'mixSpk'
                ? 'SPK (Small Packet)'
                : key === 'mixSpl'
                ? 'SPL (Small Parcel)'
                : key === 'mixMpl'
                ? 'MPL (Medium Parcel)'
                : 'LPL (Large Parcel)';
            return (
              <div key={key}>
                <div className="flex justify-between text-[11px] text-gray-600 mb-0.5">
                  <span>{label}</span>
                  <span className="font-mono font-semibold">{inputs[key]}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={inputs[key]}
                  onChange={(e) => onChange({ [key]: Number(e.target.value) })}
                  className="w-full accent-red-600 h-1.5 bg-gray-200 rounded cursor-pointer"
                />
              </div>
            );
          })}

          {mixTotal === 0 && (
            <div className="bg-amber-50 text-amber-800 p-2 rounded text-[11px] flex items-start gap-1.5 border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>Mix vacío: usando distribución uniforme (25% cada pack).</span>
            </div>
          )}
        </div>
      </section>

      {/* 4. PREPARACIÓN BASE (PACK) */}
      <section className="mb-6 bg-red-50/30 p-3 rounded-lg border border-red-100">
        <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-red-200/60">
          <div className="flex items-center gap-1.5">
            <Package className="w-4 h-4 text-red-600" />
            <h2 className="text-sm font-bold text-gray-900">4. Preparación Base (Pack)</h2>
          </div>
          <span className="text-[10px] font-mono text-gray-500">Coste: {formatEur(results.packCost)}</span>
        </div>

        <div className="bg-white p-2.5 rounded border border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">Margen %</label>
              <div className="flex items-center gap-1">
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.01"
                  value={inputs.packMarginTarget}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    onChange({
                      packMarginTarget: m,
                      packPriceMode: 'margin',
                    });
                  }}
                  className="w-full accent-red-600 h-1 bg-gray-200 rounded"
                />
                <span className="text-[10px] font-mono text-gray-700 w-8">
                  {Math.round(inputs.packMarginTarget * 100)}%
                </span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">Precio Pack ({currencySymbol})</label>
              <CleanNumberInput
                step={0.01}
                min={0}
                decimals={2}
                fallbackValue={0}
                value={Number(results.packPrice.toFixed(2))}
                onChange={(p) => {
                  const m = results.packCost > 0 && p > 0 ? (p - results.packCost) / p : 0;
                  onChange({
                    packPriceManual: p,
                    packMarginTarget: Math.max(0, Math.min(0.95, m)),
                    packPriceMode: 'price',
                  });
                }}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono font-bold text-gray-900 bg-amber-50/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. 1ER PICK DE PEDIDO */}
      <section className="mb-6 bg-red-50/30 p-3 rounded-lg border border-red-100">
        <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-red-200/60">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-red-600" />
            <h2 className="text-sm font-bold text-gray-900">5. 1er Pick de Pedido</h2>
          </div>
          <span className="text-[10px] font-mono text-gray-500">Coste: {formatEur(results.firstPickCost)}</span>
        </div>

        <div className="bg-white p-2.5 rounded border border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">Margen %</label>
              <div className="flex items-center gap-1">
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.01"
                  value={inputs.firstPickMarginTarget}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    onChange({
                      firstPickMarginTarget: m,
                      firstPickPriceMode: 'margin',
                    });
                  }}
                  className="w-full accent-red-600 h-1 bg-gray-200 rounded"
                />
                <span className="text-[10px] font-mono text-gray-700 w-8">
                  {Math.round(inputs.firstPickMarginTarget * 100)}%
                </span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">Precio 1er Pick ({currencySymbol})</label>
              <CleanNumberInput
                step={0.01}
                min={0}
                decimals={2}
                fallbackValue={0}
                value={Number(results.firstPickPrice.toFixed(2))}
                onChange={(p) => {
                  const m = results.firstPickCost > 0 && p > 0 ? (p - results.firstPickCost) / p : 0;
                  onChange({
                    firstPickPriceManual: p,
                    firstPickMarginTarget: Math.max(0, Math.min(0.95, m)),
                    firstPickPriceMode: 'price',
                  });
                }}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono font-bold text-gray-900 bg-amber-50/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. Picks Adicionales */}
      <section className="mb-6">
        <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-1.5 mb-3">
          6. Picks Adicionales (desde 2ª unidad)
        </h2>

        <div className="bg-gray-50 p-2.5 rounded border border-gray-200 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600">Coste base pick adicional:</span>
            <span className="font-mono font-semibold">{formatEur(results.additionalPickCost)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 items-center pt-1 border-t border-gray-200">
            <div>
              <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                <span>Margen</span>
                <span className="font-mono">{Math.round(inputs.additionalPickMarginTarget * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.01"
                value={inputs.additionalPickMarginTarget}
                onChange={(e) =>
                  onChange({
                    additionalPickMarginTarget: Number(e.target.value),
                    additionalPickPriceMode: 'margin',
                  })
                }
                className="w-full accent-red-600 h-1 bg-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">Precio venta / pick</label>
              <CleanNumberInput
                step={0.01}
                min={0}
                decimals={2}
                fallbackValue={0}
                value={Number(results.additionalPickPrice.toFixed(2))}
                onChange={(p) => {
                  const m = results.additionalPickCost > 0 && p > 0 ? (p - results.additionalPickCost) / p : 0;
                  onChange({
                    additionalPickPriceManual: p,
                    additionalPickMarginTarget: Math.max(0, Math.min(0.95, m)),
                    additionalPickPriceMode: 'price',
                  });
                }}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono font-bold text-gray-900 bg-white"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 7. Envío (Carrier) - Coste + Margen Modificable */}
      <section className="mb-6 bg-blue-50/40 p-3 rounded-lg border border-blue-100">
        <h2 className="text-sm font-bold text-gray-900 border-b border-blue-200/60 pb-1.5 mb-2.5 flex items-center gap-1.5">
          <Truck className="w-4 h-4 text-blue-600" />
          <span>7. Envío (Carrier: Coste + Margen)</span>
        </h2>

        <div className="space-y-2.5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Carrier Cost ({currencySymbol})
            </label>
            <CleanNumberInput
              step={0.01}
              min={0}
              decimals={2}
              fallbackValue={0}
              value={inputs.carrierCost}
              onChange={(cost) => onChange({ carrierCost: cost })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs font-mono"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Margen envío objetivo:</span>
              <span className="font-mono font-bold text-blue-700">
                {(inputs.shippingMarginTarget * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min={0.0}
              max={0.7}
              step={0.01}
              value={inputs.shippingMarginTarget}
              onChange={(e) =>
                onChange({
                  shippingMarginTarget: Number(e.target.value),
                  shippingPriceMode: 'margin',
                })
              }
              className="w-full accent-blue-600 h-1.5 bg-gray-200 rounded cursor-pointer"
            />
          </div>

          <div className="bg-white p-2.5 rounded border border-blue-200">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-semibold text-gray-800">Precio Venta Envío ({currencySymbol})</span>
              <span className="text-[10px] text-emerald-700 font-medium">
                +{formatEur(results.shippingProfitPerOrder)} / pedido
              </span>
            </div>
            <CleanNumberInput
              step={0.01}
              min={0}
              decimals={2}
              fallbackValue={0}
              value={Number(results.shippingPrice.toFixed(2))}
              onChange={(p) => {
                const m = inputs.carrierCost > 0 && p > 0 ? (p - inputs.carrierCost) / p : 0;
                onChange({
                  shippingPriceManual: p,
                  shippingMarginTarget: Math.max(0, Math.min(0.95, m)),
                  shippingPriceMode: 'price',
                });
              }}
              className="w-full border border-blue-300 rounded px-2.5 py-1 text-xs font-mono font-extrabold text-blue-900 bg-blue-50/50"
            />
          </div>
        </div>
      </section>

      {/* 8. Servicios Avanzados (Inserts, Packaging, Surcharge, Almacén) */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition"
        >
          <span>8. Servicios Adicionales & Almacén</span>
          {advancedOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {advancedOpen && (
          <div className="p-3 bg-white space-y-3 border-t border-gray-200">
            {/* Packaging */}
            <div className="border-b border-gray-100 pb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-800">Packaging Base</span>
                {inputs.customPackaging && (
                  <span className="text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-1 rounded">
                    Cancelado (0,00 {currencySymbol})
                  </span>
                )}
              </div>
              {inputs.customPackaging ? (
                <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[10px] text-amber-900">
                  Packaging propio activo: tarifa y coste cancelados a 0,00 {currencySymbol} / pedido.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500">Precio {currencySymbol}</label>
                    <CleanNumberInput
                      step={0.01}
                      min={0}
                      decimals={2}
                      fallbackValue={0}
                      value={inputs.packagingPrice}
                      onChange={(val) => onChange({ packagingPrice: val })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500">Coste {currencySymbol}</label>
                    <CleanNumberInput
                      step={0.01}
                      min={0}
                      decimals={2}
                      fallbackValue={0}
                      value={inputs.packagingCost}
                      onChange={(val) => onChange({ packagingCost: val })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Inserts */}
            <div className="border-b border-gray-100 pb-2">
              <span className="text-xs font-semibold text-gray-800 block mb-1">Inserts</span>
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="block text-[10px] text-gray-500">Cant.</label>
                  <CleanNumberInput
                    min={0}
                    max={10}
                    step={1}
                    integerOnly={true}
                    fallbackValue={0}
                    value={inputs.insertsPerOrder}
                    onChange={(val) => onChange({ insertsPerOrder: val })}
                    className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500">Precio {currencySymbol}</label>
                  <CleanNumberInput
                    step={0.01}
                    min={0}
                    decimals={2}
                    fallbackValue={0}
                    value={inputs.insertPrice}
                    onChange={(val) => onChange({ insertPrice: val })}
                    className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500">Coste {currencySymbol}</label>
                  <CleanNumberInput
                    step={0.01}
                    min={0}
                    decimals={2}
                    fallbackValue={0}
                    value={inputs.insertCost}
                    onChange={(val) => onChange({ insertCost: val })}
                    className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Devoluciones */}
            <div className="border-b border-gray-100 pb-2">
              <span className="text-xs font-semibold text-gray-800 block mb-1">Devoluciones (Returns)</span>
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="block text-[10px] text-gray-500">Tasa %</label>
                  <CleanNumberInput
                    step={0.5}
                    min={0}
                    max={50}
                    decimals={1}
                    fallbackValue={0}
                    value={Math.round(inputs.returnRate * 1000) / 10}
                    onChange={(val) => onChange({ returnRate: val / 100 })}
                    className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500">Precio {currencySymbol}</label>
                  <CleanNumberInput
                    step={0.05}
                    min={0}
                    decimals={2}
                    fallbackValue={0}
                    value={inputs.returnHandlingPrice}
                    onChange={(val) => onChange({ returnHandlingPrice: val })}
                    className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500">Coste {currencySymbol}</label>
                  <CleanNumberInput
                    step={0.05}
                    min={0}
                    decimals={2}
                    fallbackValue={0}
                    value={inputs.returnHandlingCost}
                    onChange={(val) => onChange({ returnHandlingCost: val })}
                    className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Almacenaje & Recepción */}
            <div>
              <span className="text-xs font-semibold text-gray-800 block mb-1">Almacén & Recepción</span>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-[10px] text-gray-500">Pallets Goods-in/mes</label>
                  <CleanNumberInput
                    step={0.5}
                    min={0}
                    fallbackValue={0}
                    value={inputs.goodsInPalletsMonth}
                    onChange={(val) => onChange({ goodsInPalletsMonth: val })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500">Pallet-weeks storage/mes</label>
                  <CleanNumberInput
                    step={0.5}
                    min={0}
                    fallbackValue={0}
                    value={inputs.storagePalletWeeksMonth}
                    onChange={(val) => onChange({ storagePalletWeeksMonth: val })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
