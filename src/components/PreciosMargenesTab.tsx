import React from 'react';
import { CalculatorInputs, CalculationResults } from '../types';
import { PriceMarginRow } from './PriceMarginRow';
import { formatEur, formatPct, formatMarkup, priceFromCostMargin } from '../utils/calculations';
import { Sliders } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      {/* Top Explanation Banner */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-red-600" />
              <h2 className="text-base font-bold text-gray-900">
                Matriz de Precios y Márgenes por Línea (Como Carrier)
              </h2>
            </div>
            <p className="text-xs text-gray-600 mt-1 max-w-2xl">
              Modifica directamente el precio final o ajusta el margen objetivo (%) para cada concepto.
              Al cambiar el margen se recalcula el precio sugerido ({' '}
              <span className="font-mono text-[11px] bg-gray-100 px-1 py-0.5 rounded">
                Precio = Coste / (1 - Margen)
              </span>{' '}
              ), y al cambiar el precio se recalcula el margen resultante.
            </p>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-gray-400 font-medium">Presets rápidos:</span>
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

        {/* Global Impact Bar */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* 1. Preparación de Pedido (Pack + 1er Pick) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            1. Preparación de Pedido (Pack + 1er Pick)
          </h3>
          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
            Total Preparación + 1er Pick: {formatEur(results.prepPlusFirstPickPrice)} (Margen:{' '}
            {formatPct(results.prepPlusFirstPickMargin)} | Markup:{' '}
            {formatMarkup(results.prepPlusFirstPickMarkup)})
          </span>
        </div>

        <PriceMarginRow
          label="Preparación base (Pack)"
          subLabel="Coste del material de embalaje según mix o negociado"
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
          label="Primer Pick del pedido"
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
      </div>

      {/* 2. Picking Adicional */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          2. Picks Adicionales (Unidades extra &gt; 1)
        </h3>

        <PriceMarginRow
          label="Pick adicional por unidad"
          subLabel={`Aplica a partir de la 2ª unidad. Con ${results.unitsPerOrder} units/pedido = ${(
            results.unitsPerOrder - 1
          ).toFixed(1)} picks extras/pedido`}
          cost={results.additionalPickCost}
          mode={inputs.additionalPickPriceMode}
          marginTarget={inputs.additionalPickMarginTarget}
          manualPrice={results.additionalPickPrice}
          onModeChange={(m) => onChange({ additionalPickPriceMode: m })}
          onMarginChange={(mg) => onChange({ additionalPickMarginTarget: mg })}
          onPriceChange={(p) => onChange({ additionalPickPriceManual: p })}
        />
      </div>

      {/* 3. Envío (Carrier) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            3. Envío (Carrier Cost + Margen)
          </h3>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Venta Envío: {formatEur(results.shippingPrice)} (Margen: {formatPct(results.shippingMargin)} | Markup:{' '}
            {formatMarkup(results.shippingMarkup)})
          </span>
        </div>

        <PriceMarginRow
          label="Envío Carrier nacional / estándar"
          subLabel="Coste de transporte + margen de intermediación/gestión de envíos"
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
      </div>

      {/* 4. Servicios Adicionales & Almacenaje */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          4. Servicios Adicionales & Almacenaje
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
          subLabel="Folleto, muestra o tarjeta incluida en el paquete"
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
          label="Incidencias / Fragilidad (Surcharge)"
          subLabel={`Cobertura especial para ${inputs.productType} (roturas, manipulado especial)`}
          cost={inputs.surchargeCost}
          mode="price"
          marginTarget={
            inputs.surchargePrice > 0
              ? (inputs.surchargePrice - inputs.surchargeCost) / inputs.surchargePrice
              : 0
          }
          manualPrice={inputs.surchargePrice}
          allowCostEdit={true}
          onCostChange={(c) => onChange({ surchargeCost: c })}
          onModeChange={() => {}}
          onMarginChange={(mg) => {
            const p = priceFromCostMargin(inputs.surchargeCost, mg);
            onChange({ surchargePrice: Number(p.toFixed(2)) });
          }}
          onPriceChange={(p) => onChange({ surchargePrice: p })}
        />

        <PriceMarginRow
          label="Recepción de pallets (Goods-in por pallet)"
          subLabel="Descarga, control de albarán y ubicación en rack"
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
      </div>
    </div>
  );
};
