import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { formatEur } from '../utils/calculations';

export const AyudaTab: React.FC = () => {
  const { language } = useLanguage();
  const { isDark } = useTheme();

  return (
    <div className={`space-y-6 max-w-4xl ${isDark ? 'text-gray-200' : 'text-[#2D2825]'}`}>
      <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
        {language === 'en' ? 'How this calculator works' : 'Cómo funciona esta calculadora'}
      </h2>

      <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-[#6D635B]'}`}>
        {language === 'en'
          ? 'This profitability calculator computes detailed operational fulfilment margins and client tariffs dynamically in real-time.'
          : 'Esta calculadora calcula márgenes operativos y tarifas de fulfilment de manera dinámica y en tiempo real.'}
      </p>

      <div>
        <h3 className={`text-base font-semibold mb-2 ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
          {language === 'en' ? 'Core Financial Formulas' : 'Fórmulas principales'}
        </h3>

        <div className="space-y-3 text-sm">
          <div>
            <p className={`font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
              {language === 'en' ? 'Commercial Margin (% of revenue):' : 'Margen comercial (% sobre venta):'}
            </p>
            <pre className={`p-3 rounded-lg text-xs font-mono border ${
              isDark
                ? 'bg-[#151226] text-gray-200 border-[#2E2A48]'
                : 'bg-[#FAF7F2] text-[#2D2825] border-[#E5DDD0]'
            }`}>
              {language === 'en'
                ? 'Margin = (Price - Cost) / Price'
                : 'Margen = (Precio - Coste) / Precio'}
            </pre>
          </div>

          <div>
            <p className={`font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
              {language === 'en' ? 'Markup (% markup over cost):' : 'Markup (% de incremento sobre coste):'}
            </p>
            <pre className={`p-3 rounded-lg text-xs font-mono border ${
              isDark
                ? 'bg-[#1A1535] text-[#47D2BF] border-[#47D2BF]/30'
                : 'bg-blue-50 text-blue-900 border-blue-200'
            }`}>
              {language === 'en'
                ? 'Markup = (Price - Cost) / Cost'
                : 'Markup = (Precio - Coste) / Coste'}
            </pre>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-[#8C8278]'}`}>
              {language === 'en'
                ? `Example: A service with a cost of ${formatEur(4)} sold at ${formatEur(5)} has a 20% Margin and a 25% Markup.`
                : `Ejemplo: Un servicio con coste de ${formatEur(4)} vendido a ${formatEur(5)} tiene un Margen del 20% y un Markup del 25%.`}
            </p>
          </div>

          <div>
            <p className={`font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
              {language === 'en' ? 'Target Price by Margin:' : 'Precio objetivo por margen:'}
            </p>
            <pre className={`p-3 rounded-lg text-xs font-mono border ${
              isDark
                ? 'bg-[#151226] text-gray-200 border-[#2E2A48]'
                : 'bg-[#FAF7F2] text-[#2D2825] border-[#E5DDD0]'
            }`}>
              {language === 'en'
                ? 'Price = Cost / (1 - Target Margin)'
                : 'Precio = Coste / (1 - Margen objetivo)'}
            </pre>
          </div>

          <div>
            <p className={`font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
              {language === 'en' ? 'Order Prep + 1st Pick:' : 'Preparación + 1er Pick:'}
            </p>
            <pre className={`p-3 rounded-lg text-xs font-mono border ${
              isDark
                ? 'bg-[#151226] text-gray-200 border-[#2E2A48]'
                : 'bg-[#FAF7F2] text-[#2D2825] border-[#E5DDD0]'
            }`}>
              {language === 'en'
                ? `Prep + 1st Pick Price = Pack Price + First Pick Price\nCost = Pack Cost + First Pick Cost`
                : `Precio Preparación + 1er Pick = Precio Pack + Precio Primer Pick\nCoste = Coste Pack + Coste Primer Pick`}
            </pre>
          </div>

          <div>
            <p className={`font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
              {language === 'en' ? 'Picking per order:' : 'Pick por pedido:'}
            </p>
            <pre className={`p-3 rounded-lg text-xs font-mono border ${
              isDark
                ? 'bg-[#151226] text-gray-200 border-[#2E2A48]'
                : 'bg-[#FAF7F2] text-[#2D2825] border-[#E5DDD0]'
            }`}>
              {language === 'en'
                ? `Pick revenue = First pick + (Units - 1) * Additional pick\nPick cost = First pick cost + (Units - 1) * Additional pick cost`
                : `Pick revenue = Primer pick + (Units - 1) * Pick adicional\nPick cost = Coste primer pick + (Units - 1) * Coste pick adicional`}
            </pre>
          </div>

          <div>
            <p className={`font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
              {language === 'en' ? 'Shipping (Carrier + Margin):' : 'Envío (Carrier + Margen):'}
            </p>
            <pre className={`p-3 rounded-lg text-xs font-mono border ${
              isDark
                ? 'bg-[#151226] text-gray-200 border-[#2E2A48]'
                : 'bg-[#FAF7F2] text-[#2D2825] border-[#E5DDD0]'
            }`}>
              {language === 'en'
                ? 'Shipping price = Carrier cost / (1 - Target shipping margin)'
                : 'Precio envío = Carrier cost / (1 - Margen envío objetivo)'}
            </pre>
          </div>
        </div>
      </div>

      <div>
        <h3 className={`text-base font-semibold mb-2 ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
          {language === 'en' ? 'SKU Segmentation' : 'Segmentación SKU'}
        </h3>
        <ul className={`list-disc list-inside space-y-1 text-sm ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
          <li>
            <strong className={isDark ? 'text-white' : 'text-[#2D2825]'}>{language === 'en' ? 'Simple:' : 'Simple:'}</strong>{' '}
            {language === 'en' ? 'up to 20 SKUs.' : 'hasta 20 SKUs.'}
          </li>
          <li>
            <strong className={isDark ? 'text-white' : 'text-[#2D2825]'}>{language === 'en' ? 'Medium:' : 'Medio:'}</strong>{' '}
            {language === 'en' ? '21 to 100 SKUs.' : '21 a 100 SKUs.'}
          </li>
          <li>
            <strong className={isDark ? 'text-white' : 'text-[#2D2825]'}>{language === 'en' ? 'Complex:' : 'Complejo:'}</strong>{' '}
            {language === 'en' ? 'over 100 SKUs.' : 'más de 100 SKUs.'}
          </li>
        </ul>
      </div>

      <div>
        <h3 className={`text-base font-semibold mb-2 ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
          {language === 'en' ? 'SKU Complexity Multiplier' : 'Multiplicador de Complejidad por SKU'}
        </h3>
        <p className={`text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-[#6D635B]'}`}>
          {language === 'en'
            ? 'The operational picking cost is adjusted exclusively by warehouse walking distance (SKU count). Product profiles are descriptive and do not affect final price:'
            : 'El coste operativo de picking se ajusta exclusivamente por la dispersión en nave (número de SKUs). Los perfiles de producto son informativos y no influyen en el precio final:'}
        </p>
        <pre className={`p-3 rounded-lg text-xs font-mono border ${
          isDark
            ? 'bg-[#151226] text-gray-200 border-[#2E2A48]'
            : 'bg-[#FAF7F2] text-[#2D2825] border-[#E5DDD0]'
        }`}>
          {language === 'en'
            ? `Adjusted pick cost =\nBase pick cost\n* SKU Dispersion Multiplier\n(No product multiplier applied)`
            : `Coste pick ajustado =\nCoste pick base\n* Multiplicador SKU por dispersión\n(Sin multiplicador por perfil de producto)`}
        </pre>
      </div>

      <div className={`p-4 rounded-xl border ${
        isDark
          ? 'bg-[#1E1B2E] border-[#47D2BF]/30'
          : 'bg-blue-50 border-blue-200'
      }`}>
        <h3 className={`text-sm font-semibold mb-1 ${
          isDark ? 'text-[#47D2BF]' : 'text-blue-950'
        }`}>
          {language === 'en' ? 'Note' : 'Nota'}
        </h3>
        <p className={`text-xs leading-relaxed ${
          isDark ? 'text-gray-300' : 'text-blue-900'
        }`}>
          {language === 'en'
            ? 'Your client profiles and inputs are saved locally in your browser so you can return anytime without losing progress.'
            : 'Tus perfiles de clientes y datos se guardan en el almacenamiento local del navegador para que no pierdas el progreso.'}
        </p>
      </div>
    </div>
  );
};

