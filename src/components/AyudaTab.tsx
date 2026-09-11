import React from 'react';

export const AyudaTab: React.FC = () => {
  return (
    <div className="space-y-6 text-gray-800 max-w-4xl">
      <h2 className="text-xl font-bold text-gray-900">Cómo funciona esta calculadora</h2>

      <p className="text-sm leading-relaxed text-gray-600">
        Esta MVP calcula márgenes operativos sin guardar datos.
      </p>

      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-2">Fórmulas principales</h3>

        <div className="space-y-3 text-sm">
          <div>
            <p className="font-semibold text-gray-700 mb-1">Margen comercial (% sobre venta):</p>
            <pre className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-800 border border-gray-200">
              Margen = (Precio - Coste) / Precio
            </pre>
          </div>

          <div>
            <p className="font-semibold text-gray-700 mb-1">Markup (% de incremento sobre coste):</p>
            <pre className="bg-blue-50 p-3 rounded text-xs font-mono text-blue-900 border border-blue-200">
              Markup = (Precio - Coste) / Coste
            </pre>
            <p className="text-xs text-gray-500 mt-1">
              Ejemplo: Un servicio con coste de 4,00 € vendido a 5,00 € tiene un <strong>Margen del 20%</strong> y un <strong>Markup del 25%</strong>.
            </p>
          </div>

          <div>
            <p className="font-semibold text-gray-700 mb-1">Precio objetivo por margen:</p>
            <pre className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-800 border border-gray-200">
              Precio = Coste / (1 - Margen objetivo)
            </pre>
          </div>

          <div>
            <p className="font-semibold text-gray-700 mb-1">Preparación + 1er Pick:</p>
            <pre className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-800 border border-gray-200">
              {`Precio Preparación + 1er Pick = Precio Pack + Precio Primer Pick\nCoste = Coste Pack + Coste Primer Pick`}
            </pre>
          </div>

          <div>
            <p className="font-semibold text-gray-700 mb-1">Pick por pedido:</p>
            <pre className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-800 border border-gray-200">
              {`Pick revenue = Primer pick + (Units - 1) * Pick adicional\nPick cost = Coste primer pick + (Units - 1) * Coste pick adicional`}
            </pre>
          </div>

          <div>
            <p className="font-semibold text-gray-700 mb-1">Envío (Carrier + Margen):</p>
            <pre className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-800 border border-gray-200">
              Precio envío = Carrier cost / (1 - Margen envío objetivo)
            </pre>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-2">Segmentación SKU</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li><strong>Simple:</strong> hasta 20 SKUs.</li>
          <li><strong>Medio:</strong> 21 a 100 SKUs.</li>
          <li><strong>Complejo:</strong> más de 100 SKUs.</li>
        </ul>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-2">Multiplicadores de Complejidad</h3>
        <p className="text-sm text-gray-700 mb-2">El coste operativo de picking se ajusta por:</p>
        <pre className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-800 border border-gray-200">
          {`Coste pick ajustado =\nCoste pick base\n* Multiplicador SKU\n* Multiplicador producto`}
        </pre>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-950 mb-1">Importante</h3>
        <p className="text-xs text-blue-900 leading-relaxed">
          Esta herramienta no guarda datos. Si refrescas o cambias de sesión, se vuelve a calcular desde cero.
        </p>
      </div>
    </div>
  );
};
