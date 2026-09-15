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
import { useLanguage } from '../context/LanguageContext';
import { formatEur, formatPct } from '../utils/calculations';
import { ProductType } from '../types';

const productTypeLabels: Record<string, { es: string; en: string }> = {
  'Suplementos': { es: 'Suplementos', en: 'Supplements' },
  'Cosmética': { es: 'Cosmética', en: 'Cosmetics' },
  'Perfume': { es: 'Perfume', en: 'Perfume' },
  'Vidrio': { es: 'Vidrio', en: 'Glass' },
  'Perfume + vidrio': { es: 'Perfume + vidrio', en: 'Perfume + glass' },
  'Apparel & Merch': { es: 'Apparel & Merch', en: 'Apparel & Merch' },
  'Moda / Ropa': { es: 'Moda / Ropa', en: 'Fashion / Apparel' },
  'Cosmética / Belleza': { es: 'Cosmética / Belleza', en: 'Cosmetics / Beauty' },
  'Electrónica': { es: 'Electrónica', en: 'Electronics' },
  'Hogar / Voluminoso': { es: 'Hogar / Voluminoso', en: 'Home / Bulky' },
  'General / Estándar': { es: 'General / Estándar', en: 'General / Standard' },
};

const packTypeEnLabels: Record<string, string> = {
  S: 'Envelope / Mailer (< 1kg)',
  M: 'Small Box (1 - 3kg)',
  L: 'Medium Box (3 - 5kg)',
  XL: 'Large Box (5 - 10kg)',
  BULK: 'Bulky / Heavy (> 10kg)',
};

export const RateCardTab: React.FC = () => {
  const { language } = useLanguage();

  const baseRates = [
    {
      concepto: language === 'en' ? 'Base 1st pick cost (ES)' : 'Coste base 1er pick ES',
      valor: BASE_FIRST_PICK_COST,
      unidad: language === 'en' ? 'per pick' : 'por pick',
    },
    {
      concepto: language === 'en' ? 'Base additional pick cost (ES)' : 'Coste pick adicional ES',
      valor: BASE_ADDITIONAL_PICK_COST,
      unidad: language === 'en' ? 'per pick' : 'por pick',
    },
    {
      concepto: language === 'en' ? 'Promotional insert price' : 'Precio insert publicitario',
      valor: INSERT_PRICE,
      unidad: language === 'en' ? 'per insert' : 'por insert',
    },
    {
      concepto: language === 'en' ? 'Promotional insert cost' : 'Coste insert publicitario',
      valor: INSERT_COST,
      unidad: language === 'en' ? 'per insert' : 'por insert',
    },
    {
      concepto: language === 'en' ? 'Base packaging price' : 'Precio base packaging',
      valor: PACKAGING_BASE_PRICE,
      unidad: language === 'en' ? 'per order' : 'por pedido',
    },
    {
      concepto: language === 'en' ? 'Base packaging cost' : 'Coste base packaging',
      valor: PACKAGING_BASE_COST,
      unidad: language === 'en' ? 'per order' : 'por pedido',
    },
    {
      concepto: language === 'en' ? 'Goods-in pallet price' : 'Precio descarga (Goods-in)',
      valor: GOODS_IN_PALLET_PRICE,
      unidad: language === 'en' ? 'per pallet' : 'por pallet',
    },
    {
      concepto: language === 'en' ? 'Goods-in pallet cost' : 'Coste descarga (Goods-in)',
      valor: GOODS_IN_PALLET_COST,
      unidad: language === 'en' ? 'per pallet' : 'por pallet',
    },
    {
      concepto: language === 'en' ? 'Storage pallet price' : 'Precio almacenaje pallet',
      valor: STORAGE_PALLET_PRICE,
      unidad: language === 'en' ? 'per pallet-week' : 'por pallet-semana',
    },
    {
      concepto: language === 'en' ? 'Storage pallet cost' : 'Coste almacenaje pallet',
      valor: STORAGE_PALLET_COST,
      unidad: language === 'en' ? 'per pallet-week' : 'por pallet-semana',
    },
    {
      concepto: language === 'en' ? 'Return handling price' : 'Precio gestión devolución',
      valor: RETURN_HANDLING_PRICE,
      unidad: language === 'en' ? 'per return' : 'por retorno',
    },
    {
      concepto: language === 'en' ? 'Return handling cost' : 'Coste gestión devolución',
      valor: RETURN_HANDLING_COST,
      unidad: language === 'en' ? 'per return' : 'por retorno',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Supuestos base */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {language === 'en' ? 'Base Operational Assumptions' : 'Supuestos base'}
        </h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-xs">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">
              <tr>
                <th className="px-5 py-3">{language === 'en' ? 'Concept' : 'Concepto'}</th>
                <th className="px-5 py-3 text-right">{language === 'en' ? 'Value' : 'Valor'}</th>
                <th className="px-5 py-3 text-left">{language === 'en' ? 'Unit' : 'Unidad'}</th>
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
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {language === 'en' ? 'Packaging & Box Type Rates' : 'Precios de pack'}
        </h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-xs">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">
              <tr>
                <th className="px-5 py-3">Pack</th>
                <th className="px-5 py-3 text-center">{language === 'en' ? 'Code' : 'Código'}</th>
                <th className="px-5 py-3 text-right">{language === 'en' ? 'Proposed Price' : 'Precio propuesto'}</th>
                <th className="px-5 py-3 text-right">{language === 'en' ? 'Calculator Cost' : 'Coste calculadora'}</th>
                <th className="px-5 py-3 text-right">{language === 'en' ? 'Standard ES Cost' : 'Coste estándar ES'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {PACK_TYPES.map((type) => (
                <tr key={type} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 font-medium text-gray-800">
                    {language === 'en' ? (packTypeEnLabels[type] || PACK_LABELS[type]) : PACK_LABELS[type]}
                  </td>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {language === 'en' ? 'Product Profiles & Returns' : 'Perfiles de producto y Devoluciones'}
          </h2>
          <span className="text-xs text-gray-500">
            {language === 'en'
              ? 'Categorization and return rate estimation without pick price surcharge'
              : 'Clasificación y estimación de retorno sin recargo en tarifa de pick'}
          </span>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-xs">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">
              <tr>
                <th className="px-5 py-3">{language === 'en' ? 'Product Profile' : 'Perfil de Producto'}</th>
                <th className="px-5 py-3 text-right">{language === 'en' ? 'Estimated Return Rate' : 'Tasa Estimada Devolución'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(Object.keys(PRODUCT_PROFILES) as ProductType[]).map((prod) => {
                const p = PRODUCT_PROFILES[prod];
                const label = productTypeLabels[prod]?.[language] || prod;
                return (
                  <tr key={prod} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 font-medium text-gray-800">{label}</td>
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
