import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const AyudaTab: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="space-y-6 text-gray-800 max-w-4xl">
      <h2 className="text-xl font-bold text-gray-900">
        {language === 'en' ? 'How this calculator works' : 'Cómo funciona esta calculadora'}
      </h2>

      <p className="text-sm leading-relaxed text-gray-600">
        {language === 'en'
          ? 'This profitability calculator computes detailed operational fulfilment margins and client tariffs dynamically in real-time.'
          : 'Esta calculadora calcula márgenes operativos y tarifas de fulfilment de manera dinámica y en tiempo real.'}
      </p>

      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          {language === 'en' ? 'Core Financial Formulas' : 'Fórmulas principales'}
        </h3>

        <div className="space-y-3 text-sm">
          <div>
            <p className="font-semibold text-gray-700 mb-1">
              {language === 'en' ? 'Commercial Margin (% of revenue):' : 'Margen comercial (% sobre venta):'}
            </p>
            <pre className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-800 border border-gray-200">
              {language === 'en'
                ? 'Margin = (Price - Cost) / Price'
                : 'Margen = (Precio - Coste) / Precio'}
            </pre>
          </div>

          <div>
            <p className="font-semibold text-gray-700 mb-1">
              {language === 'en' ? 'Markup (% markup over cost):' : 'Markup (% de incremento sobre coste):'}
            </p>
            <pre className="bg-blue-50 p-3 rounded text-xs font-mono text-blue-900 border border-blue-200">
              {language === 'en'
                ? 'Markup = (Price - Cost) / Cost'
                : 'Markup = (Precio - Coste) / Coste'}
            </pre>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'en'
                ? 'Example: A service with a cost of 4.00 € sold at 5.00 € has a 20% Margin and a 25% Markup.'
                : 'Ejemplo: Un servicio con coste de 4,00 € vendido a 5,00 € tiene un Margen del 20% y un Markup del 25%.'}
            </p>
          </div>

          <div>
            <p className="font-semibold text-gray-700 mb-1">
              {language === 'en' ? 'Target Price by Margin:' : 'Precio objetivo por margen:'}
            </p>
            <pre className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-800 border border-gray-200">
              {language === 'en'
                ? 'Price = Cost / (1 - Target Margin)'
                : 'Precio = Coste / (1 - Margen objetivo)'}
            </pre>
          </div>

          <div>
            <p className="font-semibold text-gray-700 mb-1">
              {language === 'en' ? 'Order Prep + 1st Pick:' : 'Preparación + 1er Pick:'}
            </p>
            <pre className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-800 border border-gray-200">
              {language === 'en'
                ? `Prep + 1st Pick Price = Pack Price + First Pick Price\nCost = Pack Cost + First Pick Cost`
                : `Precio Preparación + 1er Pick = Precio Pack + Precio Primer Pick\nCoste = Coste Pack + Coste Primer Pick`}
            </pre>
          </div>

          <div>
            <p className="font-semibold text-gray-700 mb-1">
              {language === 'en' ? 'Picking per order:' : 'Pick por pedido:'}
            </p>
            <pre className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-800 border border-gray-200">
              {language === 'en'
                ? `Pick revenue = First pick + (Units - 1) * Additional pick\nPick cost = First pick cost + (Units - 1) * Additional pick cost`
                : `Pick revenue = Primer pick + (Units - 1) * Pick adicional\nPick cost = Coste primer pick + (Units - 1) * Coste pick adicional`}
            </pre>
          </div>

          <div>
            <p className="font-semibold text-gray-700 mb-1">
              {language === 'en' ? 'Shipping (Carrier + Margin):' : 'Envío (Carrier + Margen):'}
            </p>
            <pre className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-800 border border-gray-200">
              {language === 'en'
                ? 'Shipping price = Carrier cost / (1 - Target shipping margin)'
                : 'Precio envío = Carrier cost / (1 - Margen envío objetivo)'}
            </pre>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          {language === 'en' ? 'SKU Segmentation' : 'Segmentación SKU'}
        </h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>
            <strong>{language === 'en' ? 'Simple:' : 'Simple:'}</strong>{' '}
            {language === 'en' ? 'up to 20 SKUs.' : 'hasta 20 SKUs.'}
          </li>
          <li>
            <strong>{language === 'en' ? 'Medium:' : 'Medio:'}</strong>{' '}
            {language === 'en' ? '21 to 100 SKUs.' : '21 a 100 SKUs.'}
          </li>
          <li>
            <strong>{language === 'en' ? 'Complex:' : 'Complejo:'}</strong>{' '}
            {language === 'en' ? 'over 100 SKUs.' : 'más de 100 SKUs.'}
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          {language === 'en' ? 'Complexity Multipliers' : 'Multiplicadores de Complejidad'}
        </h3>
        <p className="text-sm text-gray-700 mb-2">
          {language === 'en'
            ? 'The operational picking cost is adjusted by:'
            : 'El coste operativo de picking se ajusta por:'}
        </p>
        <pre className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-800 border border-gray-200">
          {language === 'en'
            ? `Adjusted pick cost =\nBase pick cost\n* SKU Multiplier\n* Product Multiplier`
            : `Coste pick ajustado =\nCoste pick base\n* Multiplicador SKU\n* Multiplicador producto`}
        </pre>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-950 mb-1">
          {language === 'en' ? 'Note' : 'Nota'}
        </h3>
        <p className="text-xs text-blue-900 leading-relaxed">
          {language === 'en'
            ? 'Your client profiles and inputs are saved locally in your browser so you can return anytime without losing progress.'
            : 'Tus perfiles de clientes y datos se guardan en el almacenamiento local del navegador para que no pierdas el progreso.'}
        </p>
      </div>
    </div>
  );
};
