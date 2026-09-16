import React, { useState } from 'react';
import { CalculationResults } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
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
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  DollarSign,
  PackageCheck,
  Percent,
} from 'lucide-react';

interface DesgloseTabProps {
  results: CalculationResults;
}

const PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#84cc16', // lime
];

export const DesgloseTab: React.FC<DesgloseTabProps> = ({ results }) => {
  const { language, currencySymbol } = useLanguage();
  const { isDark } = useTheme();
  const [distributionMode, setDistributionMode] = useState<'costs' | 'revenue' | 'profit'>('costs');

  const translateLine = (lineName: string) => {
    if (language !== 'en') return lineName;
    const map: Record<string, string> = {
      'Preparación base (Pack)': 'Base preparation (Pack)',
      '1er Pick': '1st Pick',
      'Picks adicionales (>1 unidad)': 'Additional picks (>1 unit)',
      'Inserts publicitarios': 'Promotional inserts',
      'Packaging personalizado': 'Custom packaging',
      'Recargo manual pedidos': 'Manual order surcharge',
      'Gestión de devoluciones': 'Returns management',
      'Descarga / Recepción': 'Goods In / Receiving',
      'Almacenaje (pallets)': 'Storage (pallets)',
      'Envío de pedidos': 'Order shipping',
      TOTAL: 'TOTAL',
    };
    return map[lineName] || lineName;
  };

  // Grouped Bar chart data (Ingresos vs Costes)
  const barChartData = results.lines.map((l) => ({
    linea: translateLine(l.linea),
    Ingresos: Math.round(l.ingresos * 100) / 100,
    Costes: Math.round(l.costes * 100) / 100,
  }));

  barChartData.push({
    linea: 'TOTAL',
    Ingresos: Math.round(results.totalRevenueMonth * 100) / 100,
    Costes: Math.round(results.totalCostMonth * 100) / 100,
  });

  // Donut chart data depending on mode
  const donutData = (() => {
    if (distributionMode === 'costs') {
      const total = results.totalCostMonth || 1;
      return results.lines
        .filter((l) => l.costes > 0)
        .map((l, idx) => ({
          name: translateLine(l.linea),
          value: Math.round(l.costes * 100) / 100,
          pct: (l.costes / total) * 100,
          color: PALETTE[idx % PALETTE.length],
        }));
    } else if (distributionMode === 'revenue') {
      const total = results.totalRevenueMonth || 1;
      return results.lines
        .filter((l) => l.ingresos > 0)
        .map((l, idx) => ({
          name: translateLine(l.linea),
          value: Math.round(l.ingresos * 100) / 100,
          pct: (l.ingresos / total) * 100,
          color: PALETTE[idx % PALETTE.length],
        }));
    } else {
      // Net Profit distribution (only positive contributors to visualize share of profits)
      const positiveLines = results.lines.filter((l) => l.beneficio > 0);
      const totalPositive = positiveLines.reduce((acc, l) => acc + l.beneficio, 0) || 1;
      return positiveLines.map((l, idx) => ({
        name: translateLine(l.linea),
        value: Math.round(l.beneficio * 100) / 100,
        pct: (l.beneficio / totalPositive) * 100,
        color: PALETTE[idx % PALETTE.length],
      }));
    }
  })();

  const currentDonutTotal =
    distributionMode === 'costs'
      ? results.totalCostMonth
      : distributionMode === 'revenue'
      ? results.totalRevenueMonth
      : results.totalProfitMonth;

  // Profit Contribution Bar Chart data
  const profitChartData = results.lines.map((l) => ({
    name: translateLine(l.linea),
    profit: Math.round(l.beneficio * 100) / 100,
    margin: l.margen,
    markup: l.markup,
    revenue: l.ingresos,
    cost: l.costes,
  }));

  const tooltipBg = isDark ? '#1E1B2E' : '#ffffff';
  const tooltipBorder = isDark ? '#2E2A48' : '#E5DDD0';
  const tooltipTextColor = isDark ? '#ffffff' : '#2D2825';
  const gridStroke = isDark ? '#2E2A48' : '#EFE8DC';
  const axisTickColor = isDark ? '#9CA3AF' : '#6D635B';

  return (
    <div className="space-y-8">
      {/* 1. KPIs RESUMEN EJECUTIVO */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className={`p-3.5 rounded-lg border shadow-2xs ${
          isDark ? 'bg-[#1E1B2E] border-[#2E2A48]' : 'bg-white border-[#E5DDD0]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en' ? 'Monthly Revenue' : 'Facturación Mensual'}
            </span>
            <DollarSign className={`w-4 h-4 ${isDark ? 'text-[#47D2BF]' : 'text-blue-600'}`} />
          </div>
          <div className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
            {formatEur(results.totalRevenueMonth)}
          </div>
          <div className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-[#8C8278]'}`}>
            {language === 'en' ? 'Total billed to client' : 'Total facturado cliente'}
          </div>
        </div>

        <div className={`p-3.5 rounded-lg border shadow-2xs ${
          isDark ? 'bg-[#1E1B2E] border-[#2E2A48]' : 'bg-white border-[#E5DDD0]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en' ? 'Operating Costs' : 'Costes Operativos'}
            </span>
            <PackageCheck className="w-4 h-4 text-red-500" />
          </div>
          <div className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
            {formatEur(results.totalCostMonth)}
          </div>
          <div className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-[#8C8278]'}`}>
            {language === 'en' ? 'Handling + transport + storage' : 'Handling + envío + almacén'}
          </div>
        </div>

        <div className={`p-3.5 rounded-lg border shadow-2xs ${
          isDark ? 'bg-[#1E1B2E] border-[#2E2A48]' : 'bg-white border-[#E5DDD0]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en' ? 'Net Profit' : 'Beneficio Neto'}
            </span>
            <TrendingUp className={`w-4 h-4 ${isDark ? 'text-[#47D2BF]' : 'text-emerald-600'}`} />
          </div>
          <div
            className={`text-lg font-bold font-mono ${
              results.totalProfitMonth >= 0
                ? isDark
                  ? 'text-[#47D2BF]'
                  : 'text-emerald-700'
                : 'text-red-500'
            }`}
          >
            {formatEur(results.totalProfitMonth)}
          </div>
          <div className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-[#8C8278]'}`}>
            {language === 'en' ? 'Net monthly margin' : 'Margen neto mensual'}
          </div>
        </div>

        <div className={`p-3.5 rounded-lg border shadow-2xs ${
          isDark ? 'bg-[#1E1B2E] border-[#2E2A48]' : 'bg-white border-[#E5DDD0]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en' ? 'Global Margin' : 'Margen Global'}
            </span>
            <Percent className={`w-4 h-4 ${isDark ? 'text-[#47D2BF]' : 'text-purple-600'}`} />
          </div>
          <div className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
            {formatPct(results.marginTotal)}
          </div>
          <div className={`text-[10px] mt-0.5 font-mono ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
            Markup: <strong className={`font-bold ${isDark ? 'text-[#47D2BF]' : 'text-blue-700'}`}>{formatMarkup(results.markupTotal)}</strong>
          </div>
        </div>

        <div className={`p-3.5 rounded-lg border shadow-2xs col-span-2 sm:col-span-1 ${
          isDark ? 'bg-[#1E1B2E] border-[#2E2A48]' : 'bg-white border-[#E5DDD0]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en' ? 'Profit / Order' : 'Margen / Pedido'}
            </span>
            <TrendingUp className={`w-4 h-4 ${isDark ? 'text-[#47D2BF]' : 'text-blue-600'}`} />
          </div>
          <div className={`text-lg font-bold font-mono ${isDark ? 'text-[#47D2BF]' : 'text-blue-800'}`}>
            {formatEur(results.profitPerOrder)}
          </div>
          <div className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-[#8C8278]'}`}>
            {language === 'en' ? 'Average gain per order' : 'Ganancia neta media/ped.'}
          </div>
        </div>
      </div>

      {/* 2. TABLA DESGLOSE MENSUAL */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
            {language === 'en' ? 'Detailed Monthly Breakdown' : 'Desglose Operativo Mensual Detallado'}
          </h2>
          <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
            {language === 'en'
              ? 'Real-time calculation based on operational parameters and margins'
              : 'Cálculo en tiempo real según parámetros y márgenes fijados'}
          </span>
        </div>

        <div className={`rounded-lg border overflow-x-auto shadow-xs ${
          isDark ? 'bg-[#1E1B2E] border-[#2E2A48]' : 'bg-white border-[#E5DDD0]'
        }`}>
          <table className="w-full text-sm text-left">
            <thead className={`text-xs font-semibold uppercase border-b ${
              isDark
                ? 'bg-[#151226] text-gray-400 border-[#2E2A48]'
                : 'bg-[#FAF7F2] text-[#4D453E] border-[#E5DDD0]'
            }`}>
              <tr>
                <th className="px-5 py-3">{language === 'en' ? 'Line' : 'Línea'}</th>
                <th className="px-5 py-3 text-right">{language === 'en' ? 'Revenue' : 'Ingresos'}</th>
                <th className="px-5 py-3 text-right">{language === 'en' ? 'Costs' : 'Costes'}</th>
                <th className="px-5 py-3 text-right">{language === 'en' ? 'Profit' : 'Beneficio'}</th>
                <th className="px-5 py-3 text-right">{language === 'en' ? 'Margin' : 'Margen'}</th>
                <th className={`px-5 py-3 text-right ${isDark ? 'text-[#47D2BF]' : 'text-blue-700'}`}>Markup</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#2E2A48]' : 'divide-[#EFE8DC]'}`}>
              {results.lines.map((line, idx) => (
                <tr key={idx} className={`transition ${
                  isDark ? 'hover:bg-[#25203D]/60' : 'hover:bg-[#FAF7F2]'
                }`}>
                  <td className={`px-5 py-3 font-medium ${isDark ? 'text-gray-200' : 'text-[#2D2825]'}`}>
                    {translateLine(line.linea)}
                  </td>
                  <td className={`px-5 py-3 text-right font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
                    {formatEur(line.ingresos)}
                  </td>
                  <td className={`px-5 py-3 text-right font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
                    {formatEur(line.costes)}
                  </td>
                  <td
                    className={`px-5 py-3 text-right font-mono font-medium ${
                      line.beneficio >= 0
                        ? isDark ? 'text-white' : 'text-[#2D2825]'
                        : 'text-red-500'
                    }`}
                  >
                    {formatEur(line.beneficio)}
                  </td>
                  <td className={`px-5 py-3 text-right font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
                    {formatPct(line.margen)}
                  </td>
                  <td className={`px-5 py-3 text-right font-mono font-semibold ${isDark ? 'text-[#47D2BF]' : 'text-blue-700'}`}>
                    {formatMarkup(line.markup)}
                  </td>
                </tr>
              ))}
              {/* TOTAL Row */}
              <tr className={`font-bold border-t-2 ${
                isDark
                  ? 'bg-[#151226] border-[#2E2A48]'
                  : 'bg-[#F4EEE4] border-[#D5C9B8]'
              }`}>
                <td className={`px-5 py-3.5 ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>TOTAL</td>
                <td className={`px-5 py-3.5 text-right font-mono ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                  {formatEur(results.totalRevenueMonth)}
                </td>
                <td className={`px-5 py-3.5 text-right font-mono ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                  {formatEur(results.totalCostMonth)}
                </td>
                <td
                  className={`px-5 py-3.5 text-right font-mono ${
                    results.totalProfitMonth >= 0
                      ? isDark
                        ? 'text-[#47D2BF]'
                        : 'text-emerald-700'
                      : 'text-red-500'
                  }`}
                >
                  {formatEur(results.totalProfitMonth)}
                </td>
                <td className={`px-5 py-3.5 text-right font-mono ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                  {formatPct(results.marginTotal)}
                </td>
                <td className={`px-5 py-3.5 text-right font-mono font-extrabold ${isDark ? 'text-[#47D2BF]' : 'text-blue-800'}`}>
                  {formatMarkup(results.markupTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className={`mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
          {language === 'en' ? (
            <>
              <span>
                <strong className={`font-medium ${isDark ? 'text-gray-200' : 'text-[#2D2825]'}`}>Margin (%):</strong> Profit over selling price = (Revenue - Cost) / Revenue
              </span>
              <span className={`hidden sm:inline ${isDark ? 'text-gray-600' : 'text-[#D5C9B8]'}`}>•</span>
              <span>
                <strong className={`font-medium ${isDark ? 'text-[#47D2BF]' : 'text-blue-700'}`}>Markup (%):</strong> Markup over cost = (Revenue - Cost) / Cost
              </span>
            </>
          ) : (
            <>
              <span>
                <strong className={`font-medium ${isDark ? 'text-gray-200' : 'text-[#2D2825]'}`}>Margen (%):</strong> Beneficio sobre precio venta = (Ingreso - Coste) / Ingreso
              </span>
              <span className={`hidden sm:inline ${isDark ? 'text-gray-600' : 'text-[#D5C9B8]'}`}>•</span>
              <span>
                <strong className={`font-medium ${isDark ? 'text-[#47D2BF]' : 'text-blue-700'}`}>Markup (%):</strong> Incremento sobre coste = (Ingreso - Coste) / Coste
              </span>
            </>
          )}
        </div>
      </div>

      <hr className={isDark ? 'border-[#2E2A48]' : 'border-[#E5DDD0]'} />

      {/* 3. GRÁFICOS ANALÍTICOS (NUEVOS & ENRIQUECIDOS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRÁFICO A: ESTRUCTURA Y REPARTO PORCENTUAL (DONUT CHART) */}
        <div className={`p-5 rounded-lg border shadow-xs flex flex-col justify-between ${
          isDark ? 'bg-[#1E1B2E] border-[#2E2A48]' : 'bg-white border-[#E5DDD0]'
        }`}>
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-2">
                <PieIcon className={`w-5 h-5 ${isDark ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`} />
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                  {language === 'en'
                    ? 'Operational Weight & Distribution'
                    : 'Estructura y Reparto Porcentual'}
                </h3>
              </div>

              {/* Toggle Switcher */}
              <div className={`inline-flex rounded-md shadow-2xs p-0.5 text-xs font-semibold border ${
                isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
              }`}>
                <button
                  onClick={() => setDistributionMode('costs')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    distributionMode === 'costs'
                      ? isDark
                        ? 'bg-[#25203D] text-rose-300 font-bold shadow-2xs'
                        : 'bg-white text-red-700 font-bold shadow-2xs'
                      : isDark
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-[#6D635B] hover:text-[#2D2825]'
                  }`}
                >
                  {language === 'en' ? 'Costs' : 'Costes'}
                </button>
                <button
                  onClick={() => setDistributionMode('revenue')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    distributionMode === 'revenue'
                      ? isDark
                        ? 'bg-[#25203D] text-blue-300 font-bold shadow-2xs'
                        : 'bg-white text-blue-700 font-bold shadow-2xs'
                      : isDark
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-[#6D635B] hover:text-[#2D2825]'
                  }`}
                >
                  {language === 'en' ? 'Revenue' : 'Ingresos'}
                </button>
                <button
                  onClick={() => setDistributionMode('profit')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    distributionMode === 'profit'
                      ? isDark
                        ? 'bg-[#25203D] text-[#47D2BF] font-bold shadow-2xs'
                        : 'bg-white text-emerald-700 font-bold shadow-2xs'
                      : isDark
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-[#6D635B] hover:text-[#2D2825]'
                  }`}
                >
                  {language === 'en' ? 'Profit' : 'Beneficio'}
                </button>
              </div>
            </div>

            <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {distributionMode === 'costs'
                ? language === 'en'
                  ? 'Visual distribution of operational costs by service activity.'
                  : 'Distribución porcentual de los costes operativos del cliente por actividad.'
                : distributionMode === 'revenue'
                ? language === 'en'
                  ? 'Visual share of monthly billed revenue by service line.'
                  : 'Distribución porcentual de la facturación mensual emitida por línea.'
                : language === 'en'
                ? 'Contribution share of positive profit generating service activities.'
                : 'Aportación relativa de cada línea que genera beneficio positivo.'}
            </p>

            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(val, name) => [
                      `${formatEur(Number(val))} (${(
                        (Number(val) / (currentDonutTotal || 1)) *
                        100
                      ).toFixed(1)}%)`,
                      String(name),
                    ]}
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderRadius: '8px',
                      borderColor: tooltipBorder,
                      color: tooltipTextColor,
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: tooltipTextColor }}
                  />
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Donut Center Metric */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`text-[11px] uppercase tracking-wider font-semibold ${isDark ? 'text-gray-400' : 'text-[#8C8278]'}`}>
                  {distributionMode === 'costs'
                    ? language === 'en'
                      ? 'Total Cost'
                      : 'Coste Total'
                    : distributionMode === 'revenue'
                    ? language === 'en'
                      ? 'Total Rev.'
                      : 'Fact. Total'
                    : language === 'en'
                    ? 'Total Profit'
                    : 'Beneficio'}
                </span>
                <span className={`text-sm font-bold font-mono ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                  {formatEur(currentDonutTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Legend Grid */}
          <div className={`grid grid-cols-2 gap-1.5 pt-3 border-t text-xs mt-2 ${
            isDark ? 'border-[#2E2A48]' : 'border-[#EFE8DC]'
          }`}>
            {donutData.map((item, idx) => (
              <div key={idx} className={`flex items-center justify-between text-[11px] p-1.5 rounded border ${
                isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#EFE8DC]'
              }`}>
                <div className="flex items-center gap-1.5 truncate mr-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className={`truncate font-medium ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`} title={item.name}>
                    {item.name}
                  </span>
                </div>
                <div className={`font-mono shrink-0 font-semibold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                  {item.pct.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GRÁFICO B: APORTACIÓN AL BENEFICIO NETO POR LÍNEA */}
        <div className={`p-5 rounded-lg border shadow-xs flex flex-col justify-between ${
          isDark ? 'bg-[#1E1B2E] border-[#2E2A48]' : 'bg-white border-[#E5DDD0]'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className={`w-5 h-5 ${isDark ? 'text-[#47D2BF]' : 'text-emerald-600'}`} />
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                  {language === 'en'
                    ? `Net Profit Contribution by Line (${currencySymbol})`
                    : `Aportación al Beneficio Neto por Línea (${currencySymbol})`}
                </h3>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                isDark
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {language === 'en' ? 'Margin Engine' : 'Motor de Rentabilidad'}
              </span>
            </div>

            <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en'
                ? `Absolute profit in ${currencySymbol} generated by each operational service.`
                : `Beneficio absoluto en ${currencySymbol} generado por cada servicio operativo.`}
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={profitChartData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: axisTickColor }}
                    tickFormatter={(v) => `${v} ${currencySymbol}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: axisTickColor }}
                    width={95}
                  />
                  <Tooltip
                    formatter={(value, _, item) => {
                      const pl = item.payload;
                      return [
                        `${formatEur(Number(value))} (Margen: ${(pl.margin * 100).toFixed(1)}%)`,
                        language === 'en' ? 'Net Profit' : 'Beneficio Neto',
                      ];
                    }}
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderRadius: '8px',
                      borderColor: tooltipBorder,
                      color: tooltipTextColor,
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: tooltipTextColor }}
                  />
                  <Bar dataKey="profit" name={language === 'en' ? 'Profit' : 'Beneficio'} radius={[0, 4, 4, 0]}>
                    {profitChartData.map((entry, index) => (
                      <Cell
                        key={`cell-profit-${index}`}
                        fill={entry.profit >= 0 ? (isDark ? '#47D2BF' : '#10b981') : '#ef4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`pt-3 border-t flex items-center justify-between text-xs ${
            isDark ? 'border-[#2E2A48] text-gray-400' : 'border-[#EFE8DC] text-[#6D635B]'
          }`}>
            <span className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded inline-block ${isDark ? 'bg-[#47D2BF]' : 'bg-emerald-500'}`} />
              {language === 'en' ? `Positive Margin (${currencySymbol})` : `Margen positivo (${currencySymbol})`}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-red-500 inline-block" />
              {language === 'en' ? 'Deficit / Cost' : 'Déficit / Coste'}
            </span>
            <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
              Total: {formatEur(results.totalProfitMonth)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. COMPARATIVA DETALLADA: INGRESOS VS COSTES */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
            {language === 'en' ? 'Revenue vs Costs by Line' : 'Comparativa: Ingresos vs Costes por Línea'}
          </h2>
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
            {language === 'en' ? `Direct comparison (${currencySymbol})` : `Comparativa directa (${currencySymbol})`}
          </span>
        </div>

        <div className={`p-4 rounded-lg border shadow-xs ${
          isDark ? 'bg-[#1E1B2E] border-[#2E2A48]' : 'bg-white border-[#E5DDD0]'
        }`}>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis
                  dataKey="linea"
                  tick={{ fontSize: 11, fill: axisTickColor }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: axisTickColor }}
                  tickFormatter={(v) => `${v.toLocaleString(language === 'en' ? 'en-US' : 'es-ES')} ${currencySymbol}`}
                />
                <Tooltip
                  formatter={(value, name) => [
                    formatEur(Number(value) || 0),
                    name === 'Ingresos' && language === 'en'
                      ? 'Revenue'
                      : name === 'Costes' && language === 'en'
                      ? 'Costs'
                      : String(name),
                  ]}
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderRadius: '8px',
                    borderColor: tooltipBorder,
                    color: tooltipTextColor,
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '13px',
                  }}
                  itemStyle={{ color: tooltipTextColor }}
                />
                <Legend
                  verticalAlign="top"
                  wrapperStyle={{ paddingBottom: '12px' }}
                  formatter={(value) =>
                    value === 'Ingresos' && language === 'en'
                      ? 'Revenue'
                      : value === 'Costes' && language === 'en'
                      ? 'Costs'
                      : value
                  }
                />
                <Bar
                  dataKey="Ingresos"
                  name={language === 'en' ? 'Revenue' : 'Ingresos'}
                  fill={isDark ? '#38bdf8' : '#3b82f6'}
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="Costes"
                  name={language === 'en' ? 'Costs' : 'Costes'}
                  fill={isDark ? '#fb7185' : '#ef4444'}
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

