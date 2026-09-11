import React from 'react';
import { CalculationResults } from '../types';
import { formatEur, formatPct, formatMarkup } from '../utils/calculations';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface DesgloseTabProps {
  results: CalculationResults;
}

export const DesgloseTab: React.FC<DesgloseTabProps> = ({ results }) => {
  const chartData = results.lines.map((l) => ({
    linea: l.linea,
    Ingresos: Math.round(l.ingresos * 100) / 100,
    Costes: Math.round(l.costes * 100) / 100,
  }));

  // Append TOTAL to chart data just like df_numeric
  chartData.push({
    linea: 'TOTAL',
    Ingresos: Math.round(results.totalRevenueMonth * 100) / 100,
    Costes: Math.round(results.totalCostMonth * 100) / 100,
  });

  return (
    <div className="space-y-8">
      {/* Desglose mensual */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Desglose mensual</h2>

        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-xs">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">
              <tr>
                <th className="px-5 py-3">Línea</th>
                <th className="px-5 py-3 text-right">Ingresos</th>
                <th className="px-5 py-3 text-right">Costes</th>
                <th className="px-5 py-3 text-right">Beneficio</th>
                <th className="px-5 py-3 text-right">Margen</th>
                <th className="px-5 py-3 text-right text-blue-700">Markup</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 font-medium text-gray-800">{line.linea}</td>
                  <td className="px-5 py-3 text-right font-mono text-gray-700">
                    {formatEur(line.ingresos)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-gray-700">
                    {formatEur(line.costes)}
                  </td>
                  <td
                    className={`px-5 py-3 text-right font-mono font-medium ${
                      line.beneficio >= 0 ? 'text-gray-900' : 'text-red-600'
                    }`}
                  >
                    {formatEur(line.beneficio)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-gray-700">
                    {formatPct(line.margen)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-semibold text-blue-700">
                    {formatMarkup(line.markup)}
                  </td>
                </tr>
              ))}
              {/* TOTAL Row */}
              <tr className="bg-gray-100/70 font-semibold border-t-2 border-gray-300">
                <td className="px-5 py-3.5 text-gray-900">TOTAL</td>
                <td className="px-5 py-3.5 text-right font-mono text-gray-900">
                  {formatEur(results.totalRevenueMonth)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-gray-900">
                  {formatEur(results.totalCostMonth)}
                </td>
                <td
                  className={`px-5 py-3.5 text-right font-mono ${
                    results.totalProfitMonth >= 0 ? 'text-gray-900' : 'text-red-600'
                  }`}
                >
                  {formatEur(results.totalProfitMonth)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-gray-900">
                  {formatPct(results.marginTotal)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono font-bold text-blue-800">
                  {formatMarkup(results.markupTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <span><strong className="text-gray-700 font-medium">Margen (%):</strong> Beneficio sobre precio venta = (Ingreso - Coste) / Ingreso</span>
          <span className="hidden sm:inline text-gray-300">•</span>
          <span><strong className="text-blue-700 font-medium">Markup (%):</strong> Incremento sobre coste = (Ingreso - Coste) / Coste</span>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Ingresos vs costes por línea */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Ingresos vs costes por línea</h2>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="linea"
                  tick={{ fontSize: 12, fill: '#4b5563' }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#4b5563' }}
                  tickFormatter={(v) => `${v.toLocaleString('es-ES')} €`}
                />
                <Tooltip
                  formatter={(value) => [
                    formatEur(Number(value) || 0),
                    '',
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '6px',
                    borderColor: '#e5e7eb',
                    fontSize: '13px',
                  }}
                />
                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '10px' }} />
                <Bar dataKey="Ingresos" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Costes" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
