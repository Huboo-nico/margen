import React from 'react';
import {
  PACK_TYPES,
  PACK_LABELS,
  PACK_PRICES,
  PACK_COSTS_CALCULATOR,
  PACK_COSTS_STANDARD_ES,
  BASE_FIRST_PICK_COST,
  BASE_ADDITIONAL_PICK_COST,
  INSERT_PRICE,
  INSERT_COST,
  PACKAGING_BASE_PRICE,
  PACKAGING_BASE_COST,
  GOODS_IN_PALLET_PRICE,
  GOODS_IN_PALLET_COST,
  STORAGE_PALLET_PRICE,
  STORAGE_PALLET_COST,
  RETURN_HANDLING_PRICE,
  RETURN_HANDLING_COST,
  PRODUCT_PROFILES,
} from '../data/constants';
import { formatEur, formatPct } from '../utils/calculations';
import { ProductType } from '../types';

export const RateCardTab: React.FC = () => {
  const baseRates = [
    { concepto: 'Base first pick cost ES', valor: BASE_FIRST_PICK_COST, unidad: 'por pick' },
    { concepto: 'Base additional pick cost ES', valor: BASE_ADDITIONAL_PICK_COST, unidad: 'por pick' },
    { concepto: 'Insert price', valor: INSERT_PRICE, unidad: 'por insert' },
    { concepto: 'Insert cost', valor: INSERT_COST, unidad: 'por insert' },
    { concepto: 'Packaging base price', valor: PACKAGING_BASE_PRICE, unidad: 'por pedido' },
    { concepto: 'Packaging base cost', valor: PACKAGING_BASE_COST, unidad: 'por pedido' },
    { concepto: 'Goods-in pallet price', valor: GOODS_IN_PALLET_PRICE, unidad: 'por pallet' },
    { concepto: 'Goods-in pallet cost', valor: GOODS_IN_PALLET_COST, unidad: 'por pallet' },
    { concepto: 'Storage pallet price', valor: STORAGE_PALLET_PRICE, unidad: 'por pallet-week' },
    { concepto: 'Storage pallet cost', valor: STORAGE_PALLET_COST, unidad: 'por pallet-week' },
    { concepto: 'Return handling price', valor: RETURN_HANDLING_PRICE, unidad: 'por retorno' },
    { concepto: 'Return handling cost', valor: RETURN_HANDLING_COST, unidad: 'por retorno' },
  ];

  return (
    <div className="space-y-8">
      {/* Supuestos base */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Supuestos base</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-xs">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">
              <tr>
                <th className="px-5 py-3">Concepto</th>
                <th className="px-5 py-3 text-right">Valor</th>
                <th className="px-5 py-3 text-left">Unidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {baseRates.map((rate, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 font-medium text-gray-800">{rate.concepto}</td>
                  <td className="px-5 py-3 text-right font-mono font-medium text-gray-900">
                    {formatEur(rate.valor)}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{rate.unidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Precios de pack */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Precios de pack</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-xs">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">
              <tr>
                <th className="px-5 py-3">Pack</th>
                <th className="px-5 py-3 text-center">Código</th>
                <th className="px-5 py-3 text-right">Precio propuesto</th>
                <th className="px-5 py-3 text-right">Coste calculadora</th>
                <th className="px-5 py-3 text-right">Coste estándar ES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {PACK_TYPES.map((type) => (
                <tr key={type} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 font-medium text-gray-800">{PACK_LABELS[type]}</td>
                  <td className="px-5 py-3 text-center font-mono text-xs font-semibold text-gray-600">
                    <span className="bg-gray-100 px-2 py-0.5 rounded">{type}</span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-gray-900 font-medium">
                    {formatEur(PACK_PRICES[type])}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-gray-700">
                    {formatEur(PACK_COSTS_CALCULATOR[type])}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-gray-700">
                    {formatEur(PACK_COSTS_STANDARD_ES[type])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Perfiles de producto */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Perfiles de producto</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-xs">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">
              <tr>
                <th className="px-5 py-3">Producto</th>
                <th className="px-5 py-3 text-right">Multiplicador pick</th>
                <th className="px-5 py-3 text-right">Tasa de Devolución (Return rate)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(Object.keys(PRODUCT_PROFILES) as ProductType[]).map((prod) => {
                const p = PRODUCT_PROFILES[prod];
                return (
                  <tr key={prod} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 font-medium text-gray-800">{prod}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-900 font-medium">
                      {p.pickMultiplier.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-700">
                      {formatPct(p.returnRate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
