import React, { useState, useEffect } from 'react';
import { CalculationResults, CalculatorInputs } from '../types';
import { formatEur, formatPct, formatMarkup } from '../utils/calculations';
import { useLanguage } from '../context/LanguageContext';
import {
  Printer,
  X,
  FileText,
  Package,
  Layers,
  Building2,
  Calendar,
  SlidersHorizontal,
  Globe,
  Clock,
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface InternalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: CalculationResults;
  inputs: CalculatorInputs;
}

const CHART_PALETTE = [
  '#2563eb', // blue-600
  '#059669', // emerald-600
  '#d97706', // amber-600
  '#7c3aed', // violet-600
  '#db2777', // pink-600
  '#0891b2', // cyan-600
  '#ea580c', // orange-600
  '#0d9488', // teal-600
  '#4f46e5', // indigo-600
  '#65a30d', // lime-600
];

const productTypeLabels: Record<string, string> = {
  'Suplementos': 'Supplements',
  'Cosmética': 'Cosmetics',
  'Perfume': 'Perfume',
  'Vidrio': 'Glass',
  'Perfume + vidrio': 'Perfume + glass',
  'Apparel & Merch': 'Apparel & Merch',
  'Moda / Ropa': 'Fashion / Apparel',
  'Cosmética / Belleza': 'Cosmetics / Beauty',
  'Electrónica': 'Electronics',
  'Hogar / Voluminoso': 'Home / Bulky',
  'General / Estándar': 'General / Standard',
};

export const InternalReportModal: React.FC<InternalReportModalProps> = ({
  isOpen,
  onClose,
  results,
  inputs,
}) => {
  const { language, currencySymbol } = useLanguage();

  // Section toggle state (defaulted for 1-page A4 printing)
  const [showVolume, setShowVolume] = useState(true);
  const [showTech, setShowTech] = useState(true);
  const [showKpis, setShowKpis] = useState(true);
  const [showOrderBreakdown, setShowOrderBreakdown] = useState(true);
  const [showCharts, setShowCharts] = useState(true); // Analytics charts
  const [showMonthlyPL, setShowMonthlyPL] = useState(false); // Off by default to guarantee 1 single page!
  const [showParams, setShowParams] = useState(true);
  const [showNotes, setShowNotes] = useState(Boolean(inputs.clientNotes));
  const [compactMode, setCompactMode] = useState(true);

  // Isolate body in print when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('report-modal-open');
    } else {
      document.body.classList.remove('report-modal-open');
    }
    return () => {
      document.body.classList.remove('report-modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    const originalTitle = document.title;
    const clientSlug = results.clientName
      ? results.clientName.replace(/\s+/g, '-').toLowerCase()
      : language === 'en' ? 'client' : 'cliente';
    document.title = language === 'en'
      ? `Huboo-Profitability-Report-${clientSlug}`
      : `Huboo-Informe-Rentabilidad-${clientSlug}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const currentDate = new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const productTypeDisplay = language === 'en'
    ? (productTypeLabels[inputs.productType] || inputs.productType)
    : inputs.productType;

  const translateLine = (lineName: string) => {
    if (language !== 'en') return lineName;
    const map: Record<string, string> = {
      'Preparación base (Pack)': 'Base Preparation (Pack)',
      '1er Pick': '1st Pick',
      'Picks adicionales (>1 unidad)': 'Additional Picks (>1 unit)',
      'Inserts publicitarios': 'Promotional Inserts',
      'Packaging personalizado': 'Custom Packaging',
      'Recargo manual pedidos': 'Manual Order Surcharge',
      'Gestión de devoluciones': 'Returns Management',
      'Descarga / Recepción': 'Inbound Goods-In / Receiving',
      'Almacenaje (pallets)': 'Storage (pallets)',
      'Envío de pedidos': 'Order Shipping',
      TOTAL: 'TOTAL',
    };
    return map[lineName] || lineName;
  };

  const translateLineShort = (lineName: string) => {
    if (language !== 'en') {
      const mapShortEs: Record<string, string> = {
        'Preparación base (Pack)': 'Prep. Pack',
        '1er Pick': '1er Pick',
        'Picks adicionales (>1 unidad)': 'Picks Extra',
        'Inserts publicitarios': 'Inserts',
        'Packaging personalizado': 'Packaging',
        'Recargo manual pedidos': 'Recargo Man.',
        'Gestión de devoluciones': 'Devoluciones',
        'Descarga / Recepción': 'Goods-In',
        'Almacenaje (pallets)': 'Almacenaje',
        'Envío de pedidos': 'Transporte',
        TOTAL: 'TOTAL',
      };
      return mapShortEs[lineName] || lineName;
    }
    const mapShortEn: Record<string, string> = {
      'Preparación base (Pack)': 'Prep. Pack',
      '1er Pick': '1st Pick',
      'Picks adicionales (>1 unidad)': 'Extra Picks',
      'Inserts publicitarios': 'Inserts',
      'Packaging personalizado': 'Packaging',
      'Recargo manual pedidos': 'Manual Surch.',
      'Gestión de devoluciones': 'Returns',
      'Descarga / Recepción': 'Goods-In',
      'Almacenaje (pallets)': 'Storage',
      'Envío de pedidos': 'Shipping',
      TOTAL: 'TOTAL',
    };
    return mapShortEn[lineName] || lineName;
  };

  const translateCategory = (cat: string) => {
    if (language !== 'en') return cat;
    const map: Record<string, string> = {
      'Picking & Pack': 'Pick & Pack',
      'Almacenaje': 'Storage',
      'Transporte': 'Shipping',
      'Servicios Extra': 'Additional Services',
    };
    return map[cat] || cat;
  };

  // 1. Estructura y Reparto Porcentual (SOLO INGRESOS según petición explícita)
  const revenueDonutData = results.lines
    .filter((l) => l.ingresos > 0)
    .map((l, idx) => ({
      name: translateLine(l.linea),
      shortName: translateLineShort(l.linea),
      value: Math.round(l.ingresos * 100) / 100,
      pct: results.totalRevenueMonth > 0 ? (l.ingresos / results.totalRevenueMonth) * 100 : 0,
      color: CHART_PALETTE[idx % CHART_PALETTE.length],
    }));

  // 2. Comparativa: Ingresos vs Costes por Línea
  const barChartData = results.lines.map((l) => ({
    linea: translateLine(l.linea),
    shortName: translateLineShort(l.linea),
    Ingresos: Math.round(l.ingresos * 100) / 100,
    Costes: Math.round(l.costes * 100) / 100,
  }));

  // 3. Aportación al Beneficio Neto por Línea
  const profitChartData = results.lines.map((l) => ({
    name: translateLine(l.linea),
    shortName: translateLineShort(l.linea),
    profit: Math.round(l.beneficio * 100) / 100,
    margin: l.margen,
  }));

  const applyPresetOnePage = () => {
    setShowVolume(true);
    setShowTech(true);
    setShowKpis(true);
    setShowOrderBreakdown(true);
    setShowMonthlyPL(false);
    setShowCharts(false);
    setShowParams(true);
    setShowNotes(Boolean(inputs.clientNotes));
    setCompactMode(true);
  };

  const applyPresetFull = () => {
    setShowVolume(true);
    setShowTech(true);
    setShowKpis(true);
    setShowOrderBreakdown(true);
    setShowMonthlyPL(true);
    setShowCharts(true);
    setShowParams(true);
    setShowNotes(true);
    setCompactMode(false);
  };

  const applyPresetRatesOnly = () => {
    setShowVolume(true);
    setShowTech(true);
    setShowKpis(false);
    setShowOrderBreakdown(true);
    setShowMonthlyPL(false);
    setShowCharts(false);
    setShowParams(false);
    setShowNotes(false);
    setCompactMode(true);
  };

  const isOnePageEstimated = !showMonthlyPL && !showCharts;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden print:max-h-none print:max-w-none print:border-none print:shadow-none print:rounded-none">
        
        {/* Modal Header & Interactive Config Toolbar (Hidden on Print) */}
        <div className="bg-gray-900 text-white shrink-0 print:hidden border-b border-gray-800">
          <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>
                    {language === 'en'
                      ? 'Profitability & Operations PDF Report'
                      : 'Informe PDF de Rentabilidad & Operativa'}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      isOnePageEstimated
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {isOnePageEstimated
                      ? (language === 'en' ? 'Fitted to 1 A4 Page' : 'Ajustado a 1 Hoja A4')
                      : (language === 'en' ? 'Extended Format (2 Pages)' : 'Formato Extendido (2 Hojas)')}
                  </span>
                </h2>
                <p className="text-[11px] text-gray-400">
                  {language === 'en'
                    ? 'Select the information you want to include in the document before printing or exporting to PDF.'
                    : 'Selecciona la información que deseas incluir en el documento antes de imprimir o exportar a PDF.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{language === 'en' ? 'Print / Save PDF' : 'Imprimir / Guardar PDF'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition cursor-pointer"
                title={language === 'en' ? 'Close modal' : 'Cerrar modal'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Section Selection Bar & Presets */}
          <div className="px-5 py-3 bg-gray-950/70 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            {/* Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-400 text-[11px] font-medium flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-gray-400" />
                {language === 'en' ? 'Quick presets:' : 'Presets rápidos:'}
              </span>
              <button
                type="button"
                onClick={applyPresetOnePage}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                  !showMonthlyPL && compactMode
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {language === 'en' ? '📄 1 A4 Page (Recommended)' : '📄 1 Hoja A4 (Recomendado)'}
              </button>
              <button
                type="button"
                onClick={applyPresetFull}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                  showMonthlyPL && showCharts
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {language === 'en' ? '📑 Full Report (2 Pages)' : '📑 Informe Completo (2 Hojas)'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowVolume(true);
                  setShowTech(true);
                  setShowKpis(true);
                  setShowOrderBreakdown(false);
                  setShowMonthlyPL(false);
                  setShowCharts(true);
                  setShowParams(true);
                  setShowNotes(false);
                  setCompactMode(false);
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                  showCharts && !showOrderBreakdown && !showMonthlyPL
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {language === 'en' ? '📊 Executive & Charts' : '📊 Ejecutivo & Gráficos'}
              </button>
              <button
                type="button"
                onClick={applyPresetRatesOnly}
                className="px-2.5 py-1 rounded text-[11px] font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition cursor-pointer"
              >
                {language === 'en' ? '🎯 Order Rates Only' : '🎯 Solo Tarifas Pedido'}
              </button>
            </div>

            {/* Checkbox Toggles */}
            <div className="flex items-center gap-2.5 flex-wrap text-[11px]">
              <span className="text-gray-400 font-medium">
                {language === 'en' ? 'Include:' : 'Incluir:'}
              </span>
              
              <label className="flex items-center gap-1 text-gray-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showVolume}
                  onChange={(e) => setShowVolume(e.target.checked)}
                  className="rounded text-red-600 focus:ring-0 w-3.5 h-3.5 accent-red-600 cursor-pointer"
                />
                <span>{language === 'en' ? 'Volume' : 'Volumen'}</span>
              </label>

              {inputs.technologies && inputs.technologies.length > 0 && (
                <label className="flex items-center gap-1 text-gray-300 hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showTech}
                    onChange={(e) => setShowTech(e.target.checked)}
                    className="rounded text-red-600 focus:ring-0 w-3.5 h-3.5 accent-red-600 cursor-pointer"
                  />
                  <span>{language === 'en' ? 'Technology' : 'Tecnología'}</span>
                </label>
              )}

              <label className="flex items-center gap-1 text-gray-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showKpis}
                  onChange={(e) => setShowKpis(e.target.checked)}
                  className="rounded text-red-600 focus:ring-0 w-3.5 h-3.5 accent-red-600 cursor-pointer"
                />
                <span>{language === 'en' ? 'Monthly KPIs' : 'KPIs Mensuales'}</span>
              </label>

              <label className="flex items-center gap-1 text-gray-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showOrderBreakdown}
                  onChange={(e) => setShowOrderBreakdown(e.target.checked)}
                  className="rounded text-red-600 focus:ring-0 w-3.5 h-3.5 accent-red-600 cursor-pointer"
                />
                <span>{language === 'en' ? 'Rates per Order' : 'Tarifas por Pedido'}</span>
              </label>

              <label className="flex items-center gap-1 text-gray-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showCharts}
                  onChange={(e) => setShowCharts(e.target.checked)}
                  className="rounded text-red-600 focus:ring-0 w-3.5 h-3.5 accent-red-600 cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  <PieIcon className="w-3 h-3 text-red-400" />
                  <span>{language === 'en' ? 'Charts' : 'Gráficos'}</span>
                </span>
              </label>

              <label className="flex items-center gap-1 text-gray-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showMonthlyPL}
                  onChange={(e) => setShowMonthlyPL(e.target.checked)}
                  className="rounded text-red-600 focus:ring-0 w-3.5 h-3.5 accent-red-600 cursor-pointer"
                />
                <span>{language === 'en' ? 'P&L Service Lines' : 'Cuenta P&L Líneas'}</span>
              </label>

              <label className="flex items-center gap-1 text-gray-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showParams}
                  onChange={(e) => setShowParams(e.target.checked)}
                  className="rounded text-red-600 focus:ring-0 w-3.5 h-3.5 accent-red-600 cursor-pointer"
                />
                <span>{language === 'en' ? 'Parameters' : 'Parámetros'}</span>
              </label>

              {inputs.clientNotes && (
                <label className="flex items-center gap-1 text-gray-300 hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showNotes}
                    onChange={(e) => setShowNotes(e.target.checked)}
                    className="rounded text-red-600 focus:ring-0 w-3.5 h-3.5 accent-red-600 cursor-pointer"
                  />
                  <span>{language === 'en' ? 'Notes' : 'Notas'}</span>
                </label>
              )}

              <button
                type="button"
                onClick={() => setCompactMode(!compactMode)}
                className={`ml-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                  compactMode
                    ? 'bg-blue-900/40 border-blue-500/50 text-blue-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}
              >
                {compactMode
                  ? (language === 'en' ? 'A4 Compact Mode: ON' : 'Modo Compacto A4: ON')
                  : (language === 'en' ? 'Compact Mode: OFF' : 'Modo Compacto: OFF')}
              </button>
            </div>
          </div>
        </div>

        {/* Printable Document Body */}
        <div
          className={`p-5 sm:p-7 overflow-y-auto text-gray-900 print:p-4 print:overflow-visible print:text-black ${
            compactMode ? 'space-y-3.5 print:space-y-2.5' : 'space-y-5 print:space-y-4'
          }`}
        >
          {/* Document Header */}
          <div className="border-b-2 border-red-600 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.2 rounded border border-red-200">
                    {language === 'en' ? 'Confidential · Internal Use' : 'Confidencial · Uso Interno'}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    ID: {results.clientName ? results.clientName.replace(/\s+/g, '-').toLowerCase() : (language === 'en' ? 'client' : 'cliente')}
                  </span>
                </div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight print:text-lg">
                  {language === 'en'
                    ? 'Operational Proposal & Profitability Breakdown'
                    : 'Propuesta Operativa & Desglose de Rentabilidad'}
                </h1>
                <div className="flex flex-wrap items-center gap-y-0.5 gap-x-3 text-xs text-gray-600 mt-1 print:text-[11px]">
                  <span className="flex items-center gap-1 font-bold text-gray-900">
                    <Building2 className="w-3.5 h-3.5 text-gray-500" />
                    {results.clientName || (language === 'en' ? 'Unnamed Client' : 'Cliente sin nombre')}
                  </span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {currentDate}
                  </span>
                  <span>
                    {language === 'en' ? 'Sector:' : 'Sector:'} <strong>{productTypeDisplay}</strong> ({inputs.skuCount} SKUs, Tier {results.tierName})
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-gray-800 bg-amber-50/80 border border-amber-200 px-1.5 py-0.5 rounded print:bg-white">
                    <Clock className="w-3 h-3 text-amber-700" />
                    {language === 'en' ? 'Go-Live Target:' : 'Go-Live Previsto:'} <strong>{results.goLiveDate}</strong>
                    <span className="text-[10px] text-amber-800 font-normal">
                      ({results.goLiveDaysRemaining >= 0 ? `${results.goLiveDaysRemaining}d` : `-${Math.abs(results.goLiveDaysRemaining)}d`} · {results.goLiveMonthsRemainingInYear.toFixed(1)}m {results.goLiveYear})
                    </span>
                  </span>
                </div>

                {/* Technology Badges */}
                {showTech && inputs.technologies && inputs.technologies.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    <span className="text-[10px] text-gray-500 font-semibold flex items-center gap-1">
                      <Globe className="w-3 h-3 text-gray-400" />
                      {language === 'en' ? 'Technology / Platforms:' : 'Tecnología / Plataformas:'}
                    </span>
                    {inputs.technologies.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-bold bg-gray-100 text-gray-800 border border-gray-300 px-2 py-0.5 rounded-md"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {showVolume && (
                <div className="text-left sm:text-right bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 shrink-0 print:bg-white">
                  <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block">
                    {language === 'en' ? 'Estimated Volume' : 'Volumen Estimado'}
                  </span>
                  <span className="text-sm font-black font-mono text-gray-900 block">
                    {results.ordersMonth.toLocaleString(language === 'en' ? 'en-US' : 'es-ES', { maximumFractionDigits: 0 })}{' '}
                    {language === 'en' ? 'orders/month' : 'pedidos/mes'}
                  </span>
                  <span className="text-[10px] text-gray-500 block">
                    {results.ordersPerDay.toFixed(1)} {language === 'en' ? 'ord/day' : 'ped/día'} · {results.unitsPerOrder.toFixed(1)} {language === 'en' ? 'units/order' : 'units/ped'}
                  </span>
                </div>
              )}
            </div>

            {showNotes && inputs.clientNotes && (
              <div className="mt-2 bg-amber-50/70 border border-amber-200/80 rounded-md p-2 text-xs text-amber-950 print:text-[10.5px]">
                <strong className="font-semibold">
                  {language === 'en' ? 'Client / Operational Notes:' : 'Notas del cliente / Operativa:'}
                </strong>{' '}
                {inputs.clientNotes}
              </div>
            )}
          </div>

          {/* 1. Resumen Ejecutivo Mensual (KPIs) */}
          {showKpis && (
            <div className="break-inside-avoid">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
                <Layers className="w-3 h-3 text-red-600" />
                {language === 'en' ? '1. Monthly Financial Summary' : '1. Resumen Financiero Mensual'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 print:bg-white">
                  <span className="text-[10px] font-medium text-gray-500 block">
                    {language === 'en' ? 'Revenue / month' : 'Facturación / mes'}
                  </span>
                  <span className="text-base font-black font-mono text-gray-900 block mt-0.5 print:text-sm">
                    {formatEur(results.totalRevenueMonth)}
                  </span>
                  <span className="text-[9px] text-gray-400">
                    {language === 'en' ? 'Total with shipping' : 'Total con transporte'}
                  </span>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 print:bg-white">
                  <span className="text-[10px] font-medium text-gray-500 block">
                    {language === 'en' ? 'Operating costs / month' : 'Costes operativos / mes'}
                  </span>
                  <span className="text-base font-black font-mono text-gray-700 block mt-0.5 print:text-sm">
                    {formatEur(results.totalCostMonth)}
                  </span>
                  <span className="text-[9px] text-gray-400">
                    {language === 'en' ? 'Warehouse + carrier' : 'Almacén + carrier'}
                  </span>
                </div>

                <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200 print:bg-white">
                  <span className="text-[10px] font-bold text-emerald-800 block">
                    {language === 'en' ? 'Net profit / month' : 'Beneficio neto / mes'}
                  </span>
                  <span className="text-base font-black font-mono text-emerald-700 block mt-0.5 print:text-sm">
                    {formatEur(results.totalProfitMonth)}
                  </span>
                  <span className="text-[9px] text-emerald-600 font-medium">
                    {formatEur(results.profitPerOrder)} {language === 'en' ? 'per order' : 'por pedido'}
                  </span>
                </div>

                <div className="bg-blue-50/70 p-2.5 rounded-lg border border-blue-200 print:bg-white">
                  <span className="text-[10px] font-bold text-blue-800 block">
                    {language === 'en' ? 'Overall Margin & Markup' : 'Margen & Markup Global'}
                  </span>
                  <span className="text-base font-black font-mono text-blue-950 block mt-0.5 print:text-sm">
                    {formatPct(results.marginTotal)}
                  </span>
                  <span className="text-[9px] font-semibold text-blue-700 font-mono">
                    Markup: {formatMarkup(results.markupTotal)}
                  </span>
                </div>
              </div>

              {/* Split Almacén vs Carrier */}
              <div className="mt-1.5 grid grid-cols-2 gap-2 text-[10.5px]">
                <div className="bg-gray-50/80 px-2 py-1 rounded border border-gray-200 flex justify-between items-center print:bg-white">
                  <span className="text-gray-600">
                    {language === 'en' ? 'Warehouse Operations Margin (Ex Shipping):' : 'Margen Operativa Almacén (Sin Envío):'}
                  </span>
                  <span className="font-bold text-gray-900 font-mono">
                    {formatPct(results.marginExShipping)}{' '}
                    <span className="text-[9px] text-blue-700 font-normal">
                      (Markup {formatMarkup(results.markupExShipping)})
                    </span>
                  </span>
                </div>
                <div className="bg-gray-50/80 px-2 py-1 rounded border border-gray-200 flex justify-between items-center print:bg-white">
                  <span className="text-gray-600">
                    {language === 'en' ? 'Shipping Margin (Carrier):' : 'Margen Transporte (Carrier):'}
                  </span>
                  <span className="font-bold text-gray-900 font-mono">
                    {formatPct(results.marginShipping)}{' '}
                    <span className="text-[9px] text-blue-700 font-normal">
                      (Markup {formatMarkup(results.shippingMarkup)})
                    </span>
                  </span>
                </div>
              </div>

              {/* Annualized Run Rate (ARR) & In-Year Revenue (YRR) */}
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-100/80 p-2 rounded-lg border border-gray-200 print:bg-white flex items-center justify-between">
                  <div>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-gray-600 block">
                      ARR (Annual Recurring Revenue · 12 {language === 'en' ? 'months' : 'meses'})
                    </span>
                    <span className="text-sm font-black font-mono text-gray-900">
                      {formatEur(results.arrRevenue)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9.5px] text-gray-500 block">
                      {language === 'en' ? 'Annual Profit' : 'Beneficio Anual'}
                    </span>
                    <span className="text-xs font-bold font-mono text-emerald-700">
                      +{formatEur(results.arrProfit)}
                    </span>
                  </div>
                </div>

                <div className="bg-red-50/70 p-2 rounded-lg border border-red-200 print:bg-white flex items-center justify-between">
                  <div>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-red-900 flex items-center gap-1">
                      <span>YRR (Year Run Rate · {results.goLiveYear})</span>
                      <span className="text-[8.5px] font-mono text-red-700 bg-red-100 px-1 py-0.2 rounded font-bold">
                        {results.goLiveMonthsRemainingInYear.toFixed(1)} {language === 'en' ? 'mo' : 'meses'}
                      </span>
                    </span>
                    <span className="text-sm font-black font-mono text-red-700">
                      {formatEur(results.yrrRevenue)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9.5px] text-gray-500 block">
                      {language === 'en' ? `Profit in ${results.goLiveYear}` : `Beneficio en ${results.goLiveYear}`}
                    </span>
                    <span className="text-xs font-bold font-mono text-emerald-700">
                      +{formatEur(results.yrrProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Desglose Detallado por Pedido (Coste de pack + Margen + Precio) */}
          {showOrderBreakdown && (
            <div className="break-inside-avoid">
              <div className="flex justify-between items-center mb-1.5">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                  <Package className="w-3 h-3 text-red-600" />
                  {language === 'en'
                    ? '2. Detailed Order Breakdown (Cost, Margin, Markup & Rate)'
                    : '2. Desglose Detallado por Pedido (Coste, Margen, Markup y Tarifa)'}
                </h3>
                <span className="text-[10px] text-gray-500 font-mono">
                  {language === 'en' ? 'Average revenue:' : 'Facturación media:'}{' '}
                  {formatEur(results.orderRevenueExShipping + results.shippingPrice)} /{' '}
                  {language === 'en' ? 'order' : 'ped'}
                </span>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
                <table className="w-full text-xs text-left print:text-[10.5px]">
                  <thead className="bg-gray-100 text-gray-700 font-semibold uppercase text-[9px] border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-1.5">{language === 'en' ? 'Operational Concept' : 'Concepto Operativo'}</th>
                      <th className="px-2 py-1.5 text-right">{language === 'en' ? 'Base Cost' : 'Coste Base'}</th>
                      <th className="px-2 py-1.5 text-right">{language === 'en' ? 'Margin %' : 'Margen %'}</th>
                      <th className="px-2 py-1.5 text-right text-blue-700">{language === 'en' ? 'Markup %' : 'Markup %'}</th>
                      <th className="px-3 py-1.5 text-right font-bold text-gray-900">{language === 'en' ? 'Sale Rate' : 'Tarifa Venta'}</th>
                      <th className="px-2.5 py-1.5 text-right text-emerald-800">{language === 'en' ? 'Profit' : 'Beneficio'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* Preparación base Pack */}
                    <tr className="bg-white">
                      <td className="px-3 py-1.5 font-medium text-gray-900">
                        <div>{language === 'en' ? 'Base preparation (Pack)' : 'Preparación base (Pack)'}</div>
                        <div className="text-[9px] text-gray-400">
                          {language === 'en'
                            ? 'Base packaging and handling (Calculator)'
                            : 'Embalaje y manipulado base (Calculadora)'}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-gray-700">
                        {formatEur(results.packCost)}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono font-medium text-emerald-700">
                        {formatPct(results.packMargin)}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono font-semibold text-blue-700">
                        {formatMarkup(results.packMarkup)}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono font-bold text-gray-900">
                        {formatEur(results.packPrice)}
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-mono font-semibold text-emerald-700">
                        +{formatEur(results.packPrice - results.packCost)}
                      </td>
                    </tr>

                    {/* 1er Pick */}
                    <tr className="bg-white">
                      <td className="px-3 py-1.5 font-medium text-gray-900">
                        <div>{language === 'en' ? '1st Pick (1st unit)' : '1er Pick (1ª unidad)'}</div>
                        <div className="text-[9px] text-gray-400">
                          {language === 'en'
                            ? 'Picking 1st unit from warehouse shelf'
                            : 'Picking primera unidad en estantería'}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-gray-700">
                        {formatEur(results.firstPickCost)}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono font-medium text-emerald-700">
                        {formatPct(results.firstPickMargin)}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono font-semibold text-blue-700">
                        {formatMarkup(results.firstPickMarkup)}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono font-bold text-gray-900">
                        {formatEur(results.firstPickPrice)}
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-mono font-semibold text-emerald-700">
                        +{formatEur(results.firstPickPrice - results.firstPickCost)}
                      </td>
                    </tr>

                    {/* Picks adicionales */}
                    <tr className="bg-white">
                      <td className="px-3 py-1.5 font-medium text-gray-900">
                        <div>{language === 'en' ? 'Additional Picks (> 1 unit)' : 'Picks adicionales (> 1 unidad)'}</div>
                        <div className="text-[9px] text-gray-400">
                          {language === 'en'
                            ? `Per additional unit (current avg: ${(results.unitsPerOrder - 1).toFixed(1)} extra units)`
                            : `Por unidad adicional (media actual: ${(results.unitsPerOrder - 1).toFixed(1)} uds extras)`}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-gray-700">
                        {formatEur(results.additionalPickCost)}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono font-medium text-emerald-700">
                        {formatPct(results.additionalPickMargin)}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono font-semibold text-blue-700">
                        {formatMarkup(results.additionalPickMarkup)}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono font-bold text-gray-900">
                        {formatEur(results.additionalPickPrice)}
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-mono font-semibold text-emerald-700">
                        +{formatEur(results.additionalPickPrice - results.additionalPickCost)}
                      </td>
                    </tr>

                    {/* Envío Carrier */}
                    <tr className="bg-white">
                      <td className="px-3 py-1.5 font-medium text-gray-900">
                        <div>{language === 'en' ? 'Shipping Transport (Carrier)' : 'Envío Transporte (Carrier)'}</div>
                        <div className="text-[9px] text-gray-400">
                          {language === 'en' ? 'Standard courier transit rate' : 'Tarifa peninsular estándar'}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-gray-700">
                        {formatEur(results.carrierCost)}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono font-medium text-emerald-700">
                        {formatPct(results.shippingMargin)}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono font-semibold text-blue-700">
                        {formatMarkup(results.shippingMarkup)}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono font-bold text-blue-700">
                        {formatEur(results.shippingPrice)}
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-mono font-semibold text-emerald-700">
                        +{formatEur(results.shippingProfitPerOrder)}
                      </td>
                    </tr>

                    {/* TOTAL MEDIO POR PEDIDO */}
                    <tr className="bg-gray-900 text-white font-bold print:bg-gray-200 print:text-black">
                      <td className="px-3 py-2 text-white print:text-black">
                        {language === 'en'
                          ? 'TOTAL ESTIMATED AVERAGE PER ORDER (WITH SHIPPING)'
                          : 'TOTAL MEDIO ESTIMADO POR PEDIDO (CON ENVÍO)'}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-gray-300 print:text-black">
                        {formatEur(results.orderCostExShipping + results.carrierCost)}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-emerald-400 print:text-black">
                        {formatPct(results.marginTotal)}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-blue-300 print:text-black">
                        {formatMarkup(results.markupTotal)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-black text-white text-xs sm:text-sm print:text-black">
                        {formatEur(results.orderRevenueExShipping + results.shippingPrice)}
                      </td>
                      <td className="px-2.5 py-2 text-right font-mono font-black text-emerald-400 text-xs sm:text-sm print:text-black">
                        +{formatEur(results.profitPerOrder)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Gráficos Analíticos: Estructura de Ingresos y Rentabilidad */}
          {showCharts && (
            <div className="break-inside-avoid space-y-2.5">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <PieIcon className="w-3.5 h-3.5 text-red-600" />
                  {language === 'en'
                    ? '3. Operational Analytics & Visual Distribution'
                    : '3. Análisis Gráfico y Distribución Operativa'}
                </h3>
                <span className="text-[9.5px] text-gray-500 font-mono">
                  {language === 'en'
                    ? `Monthly Turnover: ${formatEur(results.totalRevenueMonth)}`
                    : `Facturación Mensual: ${formatEur(results.totalRevenueMonth)}`}
                </span>
              </div>

              {/* Grid 2 Columnas: Donut (Solo Ingresos) & Comparativa Ingresos vs Costes */}
              <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-2.5">
                {/* GRÁFICO A: ESTRUCTURA Y REPARTO PORCENTUAL (SOLO INGRESOS) */}
                <div className="border border-gray-200 rounded-lg p-2.5 bg-white flex flex-col justify-between shadow-2xs break-inside-avoid">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <PieIcon className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <h4 className="text-[11px] font-bold text-gray-900">
                          {language === 'en'
                            ? 'Operational Weight & Distribution'
                            : 'Estructura y Reparto Porcentual'}
                        </h4>
                      </div>
                      <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {language === 'en' ? 'Revenue Only' : 'Solo Ingresos'}
                      </span>
                    </div>
                    <p className="text-[9.5px] text-gray-500 mb-1.5">
                      {language === 'en'
                        ? 'Distribution of monthly billed revenue by service line.'
                        : 'Distribución porcentual de la facturación mensual por línea.'}
                    </p>

                    <div className="h-40 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip
                            formatter={(val, name) => [
                              `${formatEur(Number(val))} (${(
                                (Number(val) / (results.totalRevenueMonth || 1)) *
                                100
                              ).toFixed(1)}%)`,
                              String(name),
                            ]}
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              borderRadius: '6px',
                              borderColor: '#e5e7eb',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                              fontSize: '11px',
                            }}
                          />
                          <Pie
                            data={revenueDonutData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={38}
                            outerRadius={65}
                            paddingAngle={2}
                          >
                            {revenueDonutData.map((entry, index) => (
                              <Cell key={`cell-report-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Donut Center Metric */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[8.5px] uppercase tracking-wider font-semibold text-gray-400">
                          {language === 'en' ? 'Total Rev.' : 'Fact. Total'}
                        </span>
                        <span className="text-[11px] font-bold font-mono text-gray-900">
                          {formatEur(results.totalRevenueMonth)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Detalle porcentual por línea */}
                  <div className="mt-1.5 pt-1.5 border-t border-gray-100 max-h-32 overflow-y-auto space-y-0.5">
                    {revenueDonutData.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[9.5px] py-0.5 px-1 rounded bg-gray-50/70"
                      >
                        <div className="flex items-center gap-1.5 truncate mr-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate text-gray-700 font-medium" title={item.name}>
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 font-mono">
                          <span className="text-gray-500 text-[9px]">
                            {formatEur(item.value)}
                          </span>
                          <span className="text-gray-900 font-bold w-10 text-right">
                            {item.pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* GRÁFICO B: COMPARATIVA INGRESOS VS COSTES POR LÍNEA */}
                <div className="border border-gray-200 rounded-lg p-2.5 bg-white flex flex-col justify-between shadow-2xs break-inside-avoid">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <h4 className="text-[11px] font-bold text-gray-900">
                          {language === 'en'
                            ? 'Revenue vs Costs by Line'
                            : 'Comparativa: Ingresos vs Costes'}
                        </h4>
                      </div>
                      <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                        {language === 'en' ? `Direct (${currencySymbol})` : `Directa (${currencySymbol})`}
                      </span>
                    </div>
                    <p className="text-[9.5px] text-gray-500 mb-1.5">
                      {language === 'en'
                        ? 'Direct comparison of monthly revenue vs operational costs.'
                        : 'Comparativa directa de facturación y coste operativo mensual.'}
                    </p>

                    <div className="h-40 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={barChartData}
                          margin={{ top: 8, right: 8, left: -14, bottom: 26 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis
                            dataKey="shortName"
                            tick={{ fontSize: 8.5, fill: '#4b5563' }}
                            angle={-25}
                            textAnchor="end"
                            interval={0}
                          />
                          <YAxis
                            tick={{ fontSize: 8.5, fill: '#4b5563' }}
                            tickFormatter={(v) => `${v}${currencySymbol}`}
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
                              backgroundColor: '#ffffff',
                              borderRadius: '6px',
                              borderColor: '#e5e7eb',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                              fontSize: '11px',
                            }}
                          />
                          <Legend
                            verticalAlign="top"
                            wrapperStyle={{ paddingBottom: '4px', fontSize: '9.5px' }}
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
                            fill="#2563eb"
                            radius={[2, 2, 0, 0]}
                          />
                          <Bar
                            dataKey="Costes"
                            name={language === 'en' ? 'Costs' : 'Costes'}
                            fill="#ef4444"
                            radius={[2, 2, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Resumen comparativo inferior */}
                  <div className="mt-1.5 pt-1.5 border-t border-gray-100 flex items-center justify-between text-[9.5px]">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded bg-blue-600 inline-block" />
                        <span className="text-gray-600">{language === 'en' ? 'Rev:' : 'Ing:'}</span>
                        <strong className="font-mono text-gray-900">{formatEur(results.totalRevenueMonth)}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded bg-red-500 inline-block" />
                        <span className="text-gray-600">{language === 'en' ? 'Cost:' : 'Cos:'}</span>
                        <strong className="font-mono text-gray-900">{formatEur(results.totalCostMonth)}</strong>
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-700">
                      +{formatEur(results.totalProfitMonth)} ({formatPct(results.marginTotal)})
                    </span>
                  </div>
                </div>
              </div>

              {/* GRÁFICO C: APORTACIÓN AL BENEFICIO NETO POR LÍNEA */}
              <div className="border border-gray-200 rounded-lg p-2.5 bg-white shadow-2xs break-inside-avoid">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <h4 className="text-[11px] font-bold text-gray-900">
                      {language === 'en'
                        ? `Net Profit Contribution by Service Line (${currencySymbol})`
                        : `Aportación al Beneficio Neto por Línea (${currencySymbol})`}
                    </h4>
                  </div>
                  <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {language === 'en' ? 'Profitability Driver' : 'Motor de Margen'}
                  </span>
                </div>
                <p className="text-[9.5px] text-gray-500 mb-1.5">
                  {language === 'en'
                    ? `Absolute net profit in ${currencySymbol} generated by each operational service.`
                    : `Beneficio absoluto en ${currencySymbol} generado por cada servicio operativo.`}
                </p>

                <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={profitChartData}
                      layout="vertical"
                      margin={{ top: 4, right: 24, left: 16, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 8.5, fill: '#4b5563' }}
                        tickFormatter={(v) => `${v}${currencySymbol}`}
                      />
                      <YAxis
                        type="category"
                        dataKey="shortName"
                        tick={{ fontSize: 8.5, fill: '#374151' }}
                        width={75}
                      />
                      <Tooltip
                        formatter={(value, _, item) => {
                          const pl = item.payload;
                          return [
                            `${formatEur(Number(value))} (${language === 'en' ? 'Margin' : 'Margen'}: ${(pl.margin * 100).toFixed(1)}%)`,
                            language === 'en' ? 'Net Profit' : 'Beneficio Neto',
                          ];
                        }}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '6px',
                          borderColor: '#e5e7eb',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="profit" name={language === 'en' ? 'Profit' : 'Beneficio'} radius={[0, 2, 2, 0]}>
                        {profitChartData.map((entry, index) => (
                          <Cell
                            key={`cell-profit-report-${index}`}
                            fill={entry.profit >= 0 ? '#10b981' : '#ef4444'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-1.5 pt-1.5 border-t border-gray-100 flex items-center justify-between text-[9px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-emerald-500 inline-block" />
                    {language === 'en' ? `Positive Margin (${currencySymbol})` : `Margen positivo (${currencySymbol})`}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-red-500 inline-block" />
                    {language === 'en' ? 'Deficit / Cost' : 'Déficit / Coste'}
                  </span>
                  <span className="font-mono text-gray-800 font-bold">
                    {language === 'en' ? 'Total Net Profit:' : 'Beneficio Neto Total:'} {formatEur(results.totalProfitMonth)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 4. Desglose Operativo Mensual Completo (P&L por Línea) */}
          {showMonthlyPL && (
            <div className="break-inside-avoid">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
                <Layers className="w-3 h-3 text-red-600" />
                {language === 'en'
                  ? (showCharts ? '4. Monthly P&L Account by Service Line' : '3. Monthly P&L Account by Service Line')
                  : (showCharts ? '4. Cuenta de Explotación Mensual por Líneas de Servicio' : '3. Cuenta de Explotación Mensual por Líneas de Servicio')}
              </h3>

              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
                <table className="w-full text-xs text-left print:text-[10px]">
                  <thead className="bg-gray-100 text-gray-700 font-semibold uppercase text-[9px] border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-1.5">{language === 'en' ? 'Service Line' : 'Línea de Servicio'}</th>
                      <th className="px-2 py-1.5">{language === 'en' ? 'Category' : 'Categoría'}</th>
                      <th className="px-2 py-1.5 text-right">{language === 'en' ? 'Revenue' : 'Facturación'}</th>
                      <th className="px-2 py-1.5 text-right">{language === 'en' ? 'Costs' : 'Costes'}</th>
                      <th className="px-2.5 py-1.5 text-right text-emerald-800">{language === 'en' ? 'Profit' : 'Beneficio'}</th>
                      <th className="px-2.5 py-1.5 text-right">{language === 'en' ? 'Margin' : 'Margen'}</th>
                      <th className="px-2 py-1.5 text-right text-blue-700">{language === 'en' ? 'Markup' : 'Markup'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.lines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80">
                        <td className="px-3 py-1.5 font-medium text-gray-800">{translateLine(line.linea)}</td>
                        <td className="px-2 py-1.5 text-[10px] text-gray-400">{translateCategory(line.categoria)}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-gray-900">
                          {formatEur(line.ingresos)}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono text-gray-600">
                          {formatEur(line.costes)}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono font-bold text-emerald-700">
                          {formatEur(line.beneficio)}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono text-gray-800">
                          {formatPct(line.margen)}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono font-semibold text-blue-700">
                          {formatMarkup(line.markup)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                      <td className="px-3 py-2 text-gray-900" colSpan={2}>
                        {language === 'en' ? 'MONTHLY TOTAL' : 'TOTAL MENSUAL'}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-gray-900 font-black">
                        {formatEur(results.totalRevenueMonth)}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-gray-700">
                        {formatEur(results.totalCostMonth)}
                      </td>
                      <td className="px-2.5 py-2 text-right font-mono text-emerald-700 font-black">
                        {formatEur(results.totalProfitMonth)}
                      </td>
                      <td className="px-2 py-2 text-right font-mono font-black text-gray-900">
                        {formatPct(results.marginTotal)}
                      </td>
                      <td className="px-2 py-2 text-right font-mono font-black text-blue-700">
                        {formatMarkup(results.markupTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Parámetros Operativos & Packaging */}
          {showParams && (
            <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200 text-xs break-inside-avoid print:bg-white print:p-2">
              <h4 className="font-bold text-gray-800 mb-1 uppercase text-[9px] tracking-wider">
                {language === 'en' ? 'Operating Parameters of the Quote' : 'Parámetros Operativos de la Oferta'}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-1.5 gap-x-3 text-[10.5px] text-gray-600 print:text-[10px]">
                <div>
                  {language === 'en' ? 'Pack cost source:' : 'Fuente coste pack:'}{' '}
                  <strong>{language === 'en' ? 'Calculator (negotiated)' : 'Calculadora (negociado)'}</strong>
                </div>
                <div>
                  {language === 'en' ? 'Working days:' : 'Días laborables:'}{' '}
                  <strong>{inputs.workingDays} {language === 'en' ? 'days/month' : 'días/mes'}</strong>
                </div>
                <div>
                  {language === 'en' ? 'Pack mix:' : 'Mix de pack:'}{' '}
                  <strong>SPK {inputs.mixSpk}%, SPL {inputs.mixSpl}%, MPL {inputs.mixMpl}%, LPL {inputs.mixLpl}%</strong>
                </div>
                <div>
                  {language === 'en' ? 'Base carrier cost:' : 'Coste carrier base:'}{' '}
                  <strong>{formatEur(results.carrierCost)}</strong>
                </div>
                <div>
                  {language === 'en' ? 'Packaging:' : 'Packaging:'}{' '}
                  <strong>
                    {inputs.customPackaging
                      ? (language === 'en' ? 'Custom (Client)' : 'Personalizado (Cliente)')
                      : (language === 'en' ? 'Standard Huboo' : 'Estándar Huboo')}
                  </strong>
                </div>
                <div>
                  {language === 'en' ? 'Estimated storage:' : 'Almacenaje estimado:'}{' '}
                  <strong>
                    {inputs.storagePalletWeeksMonth} {language === 'en' ? 'pallet·wk/month' : 'pallet·sem/mes'}
                  </strong>
                </div>
                <div>
                  {language === 'en' ? 'Goods-In inbound:' : 'Recepción Goods-In:'}{' '}
                  <strong>
                    {inputs.goodsInPalletsMonth} {language === 'en' ? 'pal/month' : 'pal/mes'}
                  </strong>
                </div>
                <div>
                  {language === 'en' ? 'Inserts per order:' : 'Inserts por pedido:'}{' '}
                  <strong>
                    {inputs.insertsPerOrder} {language === 'en' ? 'units' : 'uds'}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 pt-2 flex items-center justify-between text-[9px] text-gray-400 print:text-[8.5px]">
            <span>
              {language === 'en'
                ? 'HUBOO FULFILMENT · OPERATIONAL PROFITABILITY CALCULATOR'
                : 'HUBOO FULFILMENT · CALCULADORA OPERATIVA DE RENTABILIDAD'}
            </span>
            <span>
              {language === 'en'
                ? `Confidential internal document · Page ${showMonthlyPL || showCharts ? '1 of 2' : '1 of 1'}`
                : `Documento interno confidencial · Página ${showMonthlyPL || showCharts ? '1 de 2' : '1 de 1'}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
