import React, { useState, useEffect } from 'react';
import { CalculationResults, CalculatorInputs } from '../types';
import { formatEur, formatPct, formatMarkup } from '../utils/calculations';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
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
  Warehouse,
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  Sun,
  Moon,
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
  '#6B4ABF', // brand purple
  '#47D2BF', // brand turquoise
  '#2563eb', // blue-600
  '#059669', // emerald-600
  '#d97706', // amber-600
  '#ec4899', // pink-500
  '#0891b2', // cyan-600
  '#7c3aed', // violet-600
  '#ea580c', // orange-600
  '#0d9488', // teal-600
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
  const { theme: appTheme } = useTheme();
  const [reportTheme, setReportTheme] = useState<'light' | 'dark'>(appTheme);

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

  // Sync report theme with app theme when modal opens
  useEffect(() => {
    if (isOpen) {
      setReportTheme(appTheme);
    }
  }, [isOpen, appTheme]);

  // Isolate body in print and apply theme attribute for print styling
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('report-modal-open');
      document.body.setAttribute('data-print-theme', reportTheme);
    } else {
      document.body.classList.remove('report-modal-open');
      document.body.removeAttribute('data-print-theme');
    }
    return () => {
      document.body.classList.remove('report-modal-open');
      document.body.removeAttribute('data-print-theme');
    };
  }, [isOpen, reportTheme]);

  const isDarkReport = reportTheme === 'dark';

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
    <div className={`fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 print:p-0 ${isDarkReport ? 'print:bg-[#120e26]' : 'print:bg-[#FAF7F2]'} print:static`}>
      <div className={`${isDarkReport ? 'bg-[#120e26] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E8DFD3]'} rounded-2xl shadow-2xl border w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden print:max-h-none print:max-w-none print:border-none print:shadow-none print:rounded-none`}>
        
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

            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap justify-end">
              {/* PDF Theme Switcher (Día / Noche) */}
              <div className="flex items-center bg-gray-950 p-1 rounded-lg border border-gray-800 shadow-inner">
                <span className="text-[10px] text-gray-400 font-medium pl-2 pr-1 hidden sm:inline">
                  {language === 'en' ? 'Day / Night:' : 'Día / Noche:'}
                </span>
                <button
                  type="button"
                  onClick={() => setReportTheme('light')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    reportTheme === 'light'
                      ? 'bg-[#FAF7F2] text-[#8C5D1E] border border-[#E5D7C2] shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title={language === 'en' ? 'Day mode (warm light tone)' : 'Modo Día (tono cálido)'}
                >
                  <Sun className={`w-3.5 h-3.5 ${reportTheme === 'light' ? 'text-amber-500 fill-amber-400/40' : 'text-gray-400'}`} />
                  <span>{language === 'en' ? 'Day' : 'Día'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReportTheme('dark')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    reportTheme === 'dark'
                      ? 'bg-[#1E1B2E] text-[#47D2BF] border border-[#47D2BF]/60 shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title={language === 'en' ? 'Night mode (dark theme)' : 'Modo Noche (tema oscuro)'}
                >
                  <Moon className={`w-3.5 h-3.5 ${reportTheme === 'dark' ? 'text-[#47D2BF] fill-[#47D2BF]/30' : 'text-gray-400'}`} />
                  <span>{language === 'en' ? 'Night' : 'Noche'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#6B4ABF] hover:bg-[#583aa3] text-white text-xs font-bold rounded-lg shadow-sm border border-[#47D2BF]/40 transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#47D2BF]" />
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
          className={`p-5 sm:p-7 overflow-y-auto print:p-4 print:overflow-visible ${
            compactMode ? 'space-y-3.5 print:space-y-2.5' : 'space-y-5 print:space-y-4'
          } ${
            isDarkReport ? 'bg-[#120e26] text-[#F0F0F0]' : 'bg-[#FAF7F2] text-[#2D2825] print:text-black'
          }`}
        >
          {/* Document Header */}
          <div className={`border-b-2 pb-3 ${isDarkReport ? 'border-[#47D2BF]' : 'border-[#6B4ABF]'}`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                    isDarkReport
                      ? 'text-[#47D2BF] bg-[#1E1B2E] border-[#47D2BF]/40'
                      : 'text-[#6B4ABF] bg-[#F5EFE6] border-[#E5DDD0]'
                  }`}>
                    {language === 'en' ? 'Confidential · Internal Use' : 'Confidencial · Uso Interno'}
                  </span>
                  <span className={`text-[10px] font-mono ${isDarkReport ? 'text-gray-400' : 'text-[#7D7063]'}`}>
                    ID: {results.clientName ? results.clientName.replace(/\s+/g, '-').toLowerCase() : (language === 'en' ? 'client' : 'cliente')}
                  </span>
                </div>
                <h1 className={`text-xl font-black tracking-tight print:text-lg ${isDarkReport ? 'text-white' : 'text-[#2D2825]'}`}>
                  {language === 'en'
                    ? 'Operational Proposal & Profitability Breakdown'
                    : 'Propuesta Operativa & Desglose de Rentabilidad'}
                </h1>
                <div className={`flex flex-wrap items-center gap-y-0.5 gap-x-3 text-xs mt-1 print:text-[11px] ${isDarkReport ? 'text-gray-300' : 'text-[#5A4E42]'}`}>
                  <span className={`flex items-center gap-1 font-bold ${isDarkReport ? 'text-white' : 'text-[#2D2825]'}`}>
                    <Building2 className={`w-3.5 h-3.5 ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#8C5D1E]'}`} />
                    {results.clientName || (language === 'en' ? 'Unnamed Client' : 'Cliente sin nombre')}
                  </span>
                  <span className={`flex items-center gap-1 ${isDarkReport ? 'text-gray-400' : 'text-[#7D7063]'}`}>
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {currentDate}
                  </span>
                  <span>
                    {language === 'en' ? 'Sector:' : 'Sector:'} <strong className={isDarkReport ? 'text-white' : 'text-[#2D2825]'}>{productTypeDisplay}</strong> ({inputs.skuCount} SKUs, Tier {results.tierName})
                  </span>
                  <span className={`flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded ${
                    isDarkReport
                      ? 'bg-[#1E1B2E] border border-[#2E2A48] text-gray-200'
                      : 'text-[#4D453E] bg-[#F6F0E8] border border-[#E6DCD0]'
                  }`}>
                    <Warehouse className={`w-3 h-3 ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`} />
                    {language === 'en' ? 'Territory:' : 'Territorio:'} <strong className={isDarkReport ? 'text-white' : 'text-[#2D2825]'}>{results.warehouse || 'Spain'}</strong>
                  </span>
                  <span className={`flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded ${
                    isDarkReport
                      ? 'bg-[#1E1B2E] border border-[#47D2BF]/40 text-[#47D2BF]'
                      : 'text-[#7D4A08] bg-[#FFF8EE] border border-[#F3DFBF]'
                  }`}>
                    <Clock className={`w-3 h-3 ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#8C5D1E]'}`} />
                    {language === 'en' ? 'Go-Live Target:' : 'Go-Live Previsto:'} <strong className={isDarkReport ? 'text-white' : 'text-[#2D2825]'}>{results.goLiveDate}</strong>
                    <span className={`text-[10px] font-normal ${isDarkReport ? 'text-gray-300' : 'text-[#8C5D1E]'}`}>
                      ({results.goLiveDaysRemaining >= 0 ? `${results.goLiveDaysRemaining}d` : `-${Math.abs(results.goLiveDaysRemaining)}d`} · {results.goLiveMonthsRemainingInYear.toFixed(1)}m {results.goLiveYear})
                    </span>
                  </span>
                </div>

                {/* Technology Badges */}
                {showTech && inputs.technologies && inputs.technologies.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    <span className={`text-[10px] font-semibold flex items-center gap-1 ${isDarkReport ? 'text-gray-400' : 'text-[#7D7063]'}`}>
                      <Globe className={`w-3 h-3 ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#8C5D1E]'}`} />
                      {language === 'en' ? 'Technology / Platforms:' : 'Tecnología / Plataformas:'}
                    </span>
                    {inputs.technologies.map((t) => (
                      <span
                        key={t}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          isDarkReport
                            ? 'bg-[#1E1B2E] text-[#47D2BF] border-[#2E2A48]'
                            : 'bg-[#F6F0E8] text-[#3D352E] border-[#E6DCD0]'
                        }`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {showVolume && (
                <div className={`text-left sm:text-right px-3 py-2 rounded-lg border shrink-0 ${
                  isDarkReport
                    ? 'bg-[#1E1B2E] border-[#2E2A48] text-white'
                    : 'bg-[#F6F0E8] border-[#E6DCD0] text-[#2D2825]'
                }`}>
                  <span className={`text-[9px] uppercase font-bold tracking-wider block ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#8C5D1E]'}`}>
                    {language === 'en' ? 'Estimated Volume' : 'Volumen Estimado'}
                  </span>
                  <span className={`text-sm font-black font-mono block ${isDarkReport ? 'text-white' : 'text-[#2D2825]'}`}>
                    {results.ordersMonth.toLocaleString(language === 'en' ? 'en-US' : 'es-ES', { maximumFractionDigits: 0 })}{' '}
                    {language === 'en' ? 'orders/month' : 'pedidos/mes'}
                  </span>
                  <span className={`text-[10px] block ${isDarkReport ? 'text-gray-400' : 'text-[#7D7063]'}`}>
                    {results.ordersPerDay.toFixed(1)} {language === 'en' ? 'ord/day' : 'ped/día'} · {results.unitsPerOrder.toFixed(1)} {language === 'en' ? 'units/order' : 'units/ped'}
                  </span>
                </div>
              )}
            </div>

            {showNotes && inputs.clientNotes && (
              <div className={`mt-2 rounded-md p-2 text-xs border print:text-[10.5px] ${
                isDarkReport
                  ? 'bg-[#1E1B2E] border-[#6B4ABF]/50 text-[#F0F0F0]'
                  : 'bg-[#FFF8EC] border-[#EED8A8] text-[#553F1A]'
              }`}>
                <strong className={isDarkReport ? 'font-semibold text-[#47D2BF]' : 'font-semibold text-[#8C5D1E]'}>
                  {language === 'en' ? 'Client / Operational Notes:' : 'Notas del cliente / Operativa:'}
                </strong>{' '}
                {inputs.clientNotes}
              </div>
            )}
          </div>

          {/* 1. Resumen Ejecutivo Mensual (KPIs) */}
          {showKpis && (
            <div className="break-inside-avoid">
              <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1 ${
                isDarkReport ? 'text-[#47D2BF]' : 'text-[#8C5D1E]'
              }`}>
                <Layers className={`w-3 h-3 ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`} />
                {language === 'en' ? '1. Monthly Financial Summary' : '1. Resumen Financiero Mensual'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className={`p-2.5 rounded-lg border ${
                  isDarkReport
                    ? 'bg-[#1E1B2E] border-[#2E2A48]'
                    : 'bg-white border-[#E8DFD3]'
                }`}>
                  <span className={`text-[10px] font-medium block ${isDarkReport ? 'text-gray-400' : 'text-[#7D7063]'}`}>
                    {language === 'en' ? 'Revenue / month' : 'Facturación / mes'}
                  </span>
                  <span className={`text-base font-black font-mono block mt-0.5 print:text-sm ${
                    isDarkReport ? 'text-white' : 'text-[#2D2825]'
                  }`}>
                    {formatEur(results.totalRevenueMonth)}
                  </span>
                  <span className={`text-[9px] ${isDarkReport ? 'text-gray-400' : 'text-[#8C7F72]'}`}>
                    {language === 'en' ? 'Total with shipping' : 'Total con transporte'}
                  </span>
                </div>

                <div className={`p-2.5 rounded-lg border ${
                  isDarkReport
                    ? 'bg-[#221B2B] border-[#3E253A]'
                    : 'bg-white border-[#E8DFD3]'
                }`}>
                  <span className={`text-[10px] font-medium block ${isDarkReport ? 'text-gray-400' : 'text-[#7D7063]'}`}>
                    {language === 'en' ? 'Operating costs / month' : 'Costes operativos / mes'}
                  </span>
                  <span className={`text-base font-black font-mono block mt-0.5 print:text-sm ${
                    isDarkReport ? 'text-red-400' : 'text-[#5A4E42]'
                  }`}>
                    {formatEur(results.totalCostMonth)}
                  </span>
                  <span className={`text-[9px] ${isDarkReport ? 'text-gray-400' : 'text-[#8C7F72]'}`}>
                    {language === 'en' ? 'Warehouse + carrier' : 'Almacén + carrier'}
                  </span>
                </div>

                <div className={`p-2.5 rounded-lg border ${
                  isDarkReport
                    ? 'bg-[#142926] border-[#47D2BF]/40'
                    : 'bg-[#F0FAF7] border-[#BBECE2]'
                }`}>
                  <span className={`text-[10px] font-bold block ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#0D7A68]'}`}>
                    {language === 'en' ? 'Net profit / month' : 'Beneficio neto / mes'}
                  </span>
                  <span className={`text-base font-black font-mono block mt-0.5 print:text-sm ${
                    isDarkReport ? 'text-[#47D2BF]' : 'text-[#096052]'
                  }`}>
                    {formatEur(results.totalProfitMonth)}
                  </span>
                  <span className={`text-[9px] font-medium ${isDarkReport ? 'text-[#47D2BF]/80' : 'text-[#0D7A68]'}`}>
                    {formatEur(results.profitPerOrder)} {language === 'en' ? 'per order' : 'por pedido'}
                  </span>
                </div>

                <div className={`p-2.5 rounded-lg border ${
                  isDarkReport
                    ? 'bg-[#1A2038] border-[#2E3C66]'
                    : 'bg-[#F2F5FD] border-[#D0DCF8]'
                }`}>
                  <span className={`text-[10px] font-bold block ${isDarkReport ? 'text-blue-300' : 'text-blue-800'}`}>
                    {language === 'en' ? 'Overall Margin & Markup' : 'Margen & Markup Global'}
                  </span>
                  <span className={`text-base font-black font-mono block mt-0.5 print:text-sm ${
                    isDarkReport ? 'text-blue-200' : 'text-blue-950'
                  }`}>
                    {formatPct(results.marginTotal)}
                  </span>
                  <span className={`text-[9px] font-semibold font-mono ${isDarkReport ? 'text-blue-300' : 'text-blue-700'}`}>
                    Markup: {formatMarkup(results.markupTotal)}
                  </span>
                </div>
              </div>

              {/* Split Almacén vs Carrier */}
              <div className="mt-1.5 grid grid-cols-2 gap-2 text-[10.5px]">
                <div className={`px-2 py-1 rounded border flex justify-between items-center ${
                  isDarkReport
                    ? 'bg-[#1E1B2E] border-[#2E2A48]'
                    : 'bg-[#F6F0E8] border-[#E6DCD0]'
                }`}>
                  <span className={isDarkReport ? 'text-gray-300' : 'text-[#5A4E42]'}>
                    {language === 'en' ? 'Warehouse Operations Margin (Ex Shipping):' : 'Margen Operativa Almacén (Sin Envío):'}
                  </span>
                  <span className={`font-bold font-mono ${isDarkReport ? 'text-white' : 'text-[#2D2825]'}`}>
                    {formatPct(results.marginExShipping)}{' '}
                    <span className={`text-[9px] font-normal ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`}>
                      (Markup {formatMarkup(results.markupExShipping)})
                    </span>
                  </span>
                </div>
                <div className={`px-2 py-1 rounded border flex justify-between items-center ${
                  isDarkReport
                    ? 'bg-[#1E1B2E] border-[#2E2A48]'
                    : 'bg-[#F6F0E8] border-[#E6DCD0]'
                }`}>
                  <span className={isDarkReport ? 'text-gray-300' : 'text-[#5A4E42]'}>
                    {language === 'en' ? 'Shipping Margin (Carrier):' : 'Margen Transporte (Carrier):'}
                  </span>
                  <span className={`font-bold font-mono ${isDarkReport ? 'text-white' : 'text-[#2D2825]'}`}>
                    {formatPct(results.marginShipping)}{' '}
                    <span className={`text-[9px] font-normal ${isDarkReport ? 'text-[#47D2BF]' : 'text-blue-700'}`}>
                      (Markup {formatMarkup(results.shippingMarkup)})
                    </span>
                  </span>
                </div>
              </div>

              {/* Annualized Run Rate (ARR) & In-Year Revenue (YRR) */}
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className={`p-2 rounded-lg border flex items-center justify-between ${
                  isDarkReport
                    ? 'bg-[#1E1B2E] border-[#2E2A48]'
                    : 'bg-[#F6F0E8] border-[#E6DCD0]'
                }`}>
                  <div>
                    <span className={`text-[9.5px] font-bold uppercase tracking-wider block ${isDarkReport ? 'text-gray-400' : 'text-[#7D7063]'}`}>
                      ARR (Annual Recurring Revenue · 12 {language === 'en' ? 'months' : 'meses'})
                    </span>
                    <span className={`text-sm font-black font-mono ${isDarkReport ? 'text-white' : 'text-[#2D2825]'}`}>
                      {formatEur(results.arrRevenue)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-[9.5px] block ${isDarkReport ? 'text-gray-400' : 'text-[#7D7063]'}`}>
                      {language === 'en' ? 'Annual Profit' : 'Beneficio Anual'}
                    </span>
                    <span className={`text-xs font-bold font-mono ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#0D7A68]'}`}>
                      +{formatEur(results.arrProfit)}
                    </span>
                  </div>
                </div>

                <div className={`p-2 rounded-lg border flex items-center justify-between ${
                  isDarkReport
                    ? 'bg-[#241E38] border-[#6B4ABF]/50'
                    : 'bg-[#F7F2FC] border-[#DDD0F5]'
                }`}>
                  <div>
                    <span className={`text-[9.5px] font-bold uppercase tracking-wider flex items-center gap-1 ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`}>
                      <span>YRR (Year Run Rate · {results.goLiveYear})</span>
                      <span className={`text-[8.5px] font-mono px-1 py-0.2 rounded font-bold ${
                        isDarkReport ? 'bg-[#1E1B2E] text-[#47D2BF]' : 'text-[#6B4ABF] bg-purple-100'
                      }`}>
                        {results.goLiveMonthsRemainingInYear.toFixed(1)} {language === 'en' ? 'mo' : 'meses'}
                      </span>
                    </span>
                    <span className={`text-sm font-black font-mono ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`}>
                      {formatEur(results.yrrRevenue)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-[9.5px] block ${isDarkReport ? 'text-gray-400' : 'text-[#7D7063]'}`}>
                      {language === 'en' ? `Profit in ${results.goLiveYear}` : `Beneficio en ${results.goLiveYear}`}
                    </span>
                    <span className={`text-xs font-bold font-mono ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#0D7A68]'}`}>
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
                <h3 className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                  isDarkReport ? 'text-[#47D2BF]' : 'text-[#8C5D1E]'
                }`}>
                  <Package className={`w-3 h-3 ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`} />
                  {language === 'en'
                    ? '2. Detailed Order Breakdown (Cost, Margin, Markup & Rate)'
                    : '2. Desglose Detallado por Pedido (Coste, Margen, Markup y Tarifa)'}
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  isDarkReport
                    ? 'bg-[#1E1B2E] border-[#2E2A48] text-gray-300'
                    : 'bg-[#F6F0E8] border-[#E6DCD0] text-[#5A4E42]'
                }`}>
                  {language === 'en' ? 'Average revenue:' : 'Facturación media:'}{' '}
                  <strong className={isDarkReport ? 'text-white' : 'text-[#2D2825]'}>
                    {formatEur(results.orderRevenueExShipping + results.shippingPrice)}
                  </strong> /{' '}
                  {language === 'en' ? 'order' : 'ped'}
                </span>
              </div>

              <div className={`border rounded-lg overflow-x-auto shadow-2xs ${
                isDarkReport ? 'border-[#2E2A48] bg-[#1E1B2E]' : 'border-[#E5DDD0] bg-white'
              }`}>
                <table className="w-full text-xs text-left min-w-[340px] print:text-[10.5px]">
                  <thead className={`font-semibold uppercase text-[9px] border-b ${
                    isDarkReport
                      ? 'bg-[#252238] text-gray-200 border-[#2E2A48]'
                      : 'bg-[#F4EEE4] text-[#42382E] border-[#E2D8CA]'
                  }`}>
                    <tr>
                      <th className="px-3 py-1.5">{language === 'en' ? 'Operational Concept' : 'Concepto Operativo'}</th>
                      <th className="px-2 py-1.5 text-right">{language === 'en' ? 'Base Cost' : 'Coste Base'}</th>
                      <th className="px-2 py-1.5 text-right">{language === 'en' ? 'Margin %' : 'Margen %'}</th>
                      <th className={`px-2 py-1.5 text-right ${isDarkReport ? 'text-blue-300' : 'text-blue-700'}`}>{language === 'en' ? 'Markup %' : 'Markup %'}</th>
                      <th className={`px-3 py-1.5 text-right font-bold ${isDarkReport ? 'text-white' : 'text-[#2D2825]'}`}>{language === 'en' ? 'Sale Rate' : 'Tarifa Venta'}</th>
                      <th className={`px-2.5 py-1.5 text-right ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#0D7A68]'}`}>{language === 'en' ? 'Profit' : 'Beneficio'}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkReport ? 'divide-[#2E2A48]' : 'divide-[#EFE8DC]'}`}>
                    {/* Preparación base Pack */}
                    <tr className={isDarkReport ? 'bg-[#1E1B2E] hover:bg-[#252238]/50' : 'bg-white hover:bg-[#FAF6F0]'}>
                      <td className="px-3 py-1.5 font-medium">
                        <div className={isDarkReport ? 'text-white' : 'text-[#2D2825]'}>{language === 'en' ? 'Base preparation (Pack)' : 'Preparación base (Pack)'}</div>
                        <div className={`text-[9px] ${isDarkReport ? 'text-gray-400' : 'text-[#7D7063]'}`}>
                          {language === 'en'
                            ? 'Base packaging and handling (Calculator)'
                            : 'Embalaje y manipulado base (Calculadora)'}
                        </div>
                      </td>
                      <td className={`px-2 py-1.5 text-right font-mono ${isDarkReport ? 'text-gray-300' : 'text-[#5A4E42]'}`}>
                        {formatEur(results.packCost)}
                      </td>
                      <td className={`px-2 py-1.5 text-right font-mono font-medium ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#0D7A68]'}`}>
                        {formatPct(results.packMargin)}
                      </td>
                      <td className={`px-2 py-1.5 text-right font-mono font-semibold ${isDarkReport ? 'text-blue-300' : 'text-blue-700'}`}>
                        {formatMarkup(results.packMarkup)}
                      </td>
                      <td className={`px-3 py-1.5 text-right font-mono font-bold ${isDarkReport ? 'text-white' : 'text-[#2D2825]'}`}>
                        {formatEur(results.packPrice)}
                      </td>
                      <td className={`px-2.5 py-1.5 text-right font-mono font-semibold ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#0D7A68]'}`}>
                        +{formatEur(results.packPrice - results.packCost)}
                      </td>
                    </tr>

                    {/* 1er Pick */}
                    <tr className={isDarkReport ? 'bg-[#1E1B2E] hover:bg-[#252238]/50' : 'bg-white hover:bg-[#FAF6F0]'}>
                      <td className="px-3 py-1.5 font-medium">
                        <div className={isDarkReport ? 'text-white' : 'text-[#2D2825]'}>{language === 'en' ? '1st Pick (1st unit)' : '1er Pick (1ª unidad)'}</div>
                        <div className={`text-[9px] ${isDarkReport ? 'text-gray-400' : 'text-[#7D7063]'}`}>
                          {language === 'en'
                            ? 'Picking 1st unit from warehouse shelf'
                            : 'Picking primera unidad en estantería'}
                        </div>
                      </td>
                      <td className={`px-2 py-1.5 text-right font-mono ${isDarkReport ? 'text-gray-300' : 'text-[#5A4E42]'}`}>
                        {formatEur(results.firstPickCost)}
                      </td>
                      <td className={`px-2 py-1.5 text-right font-mono font-medium ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#0D7A68]'}`}>
                        {formatPct(results.firstPickMargin)}
                      </td>
                      <td className={`px-2 py-1.5 text-right font-mono font-semibold ${isDarkReport ? 'text-blue-300' : 'text-blue-700'}`}>
                        {formatMarkup(results.firstPickMarkup)}
                      </td>
                      <td className={`px-3 py-1.5 text-right font-mono font-bold ${isDarkReport ? 'text-white' : 'text-[#2D2825]'}`}>
                        {formatEur(results.firstPickPrice)}
                      </td>
                      <td className={`px-2.5 py-1.5 text-right font-mono font-semibold ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#0D7A68]'}`}>
                        +{formatEur(results.firstPickPrice - results.firstPickCost)}
                      </td>
                    </tr>

                    {/* Picks adicionales */}
                    <tr className={isDarkReport ? 'bg-[#1E1B2E] hover:bg-[#252238]/50' : 'bg-white hover:bg-[#FAF6F0]'}>
                      <td className="px-3 py-1.5 font-medium">
                        <div className={isDarkReport ? 'text-white' : 'text-[#2D2825]'}>{language === 'en' ? 'Additional Picks (> 1 unit)' : 'Picks adicionales (> 1 unidad)'}</div>
                        <div className={`text-[9px] ${isDarkReport ? 'text-gray-400' : 'text-[#7D7063]'}`}>
                          {language === 'en'
                            ? `Per additional unit (current avg: ${(results.unitsPerOrder - 1).toFixed(1)} extra units)`
                            : `Por unidad adicional (media actual: ${(results.unitsPerOrder - 1).toFixed(1)} uds extras)`}
                        </div>
                      </td>
                      <td className={`px-2 py-1.5 text-right font-mono ${isDarkReport ? 'text-gray-300' : 'text-[#5A4E42]'}`}>
                        {formatEur(results.additionalPickCost)}
                      </td>
                      <td className={`px-2 py-1.5 text-right font-mono font-medium ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#0D7A68]'}`}>
                        {formatPct(results.additionalPickMargin)}
                      </td>
                      <td className={`px-2 py-1.5 text-right font-mono font-semibold ${isDarkReport ? 'text-blue-300' : 'text-blue-700'}`}>
                        {formatMarkup(results.additionalPickMarkup)}
                      </td>
                      <td className={`px-3 py-1.5 text-right font-mono font-bold ${isDarkReport ? 'text-white' : 'text-[#2D2825]'}`}>
                        {formatEur(results.additionalPickPrice)}
                      </td>
                      <td className={`px-2.5 py-1.5 text-right font-mono font-semibold ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#0D7A68]'}`}>
                        +{formatEur(results.additionalPickPrice - results.additionalPickCost)}
                      </td>
                    </tr>

                    {/* Envío Carrier */}
                    <tr className={isDarkReport ? 'bg-[#1E1B2E] hover:bg-[#252238]/50' : 'bg-white hover:bg-[#FAF6F0]'}>
                      <td className="px-3 py-1.5 font-medium">
                        <div className={isDarkReport ? 'text-white' : 'text-[#2D2825]'}>{language === 'en' ? 'Shipping Transport (Carrier)' : 'Envío Transporte (Carrier)'}</div>
                        <div className={`text-[9px] ${isDarkReport ? 'text-gray-400' : 'text-[#7D7063]'}`}>
                          {language === 'en' ? 'Standard courier transit rate' : 'Tarifa peninsular estándar'}
                        </div>
                      </td>
                      <td className={`px-2 py-1.5 text-right font-mono ${isDarkReport ? 'text-gray-300' : 'text-[#5A4E42]'}`}>
                        {formatEur(results.carrierCost)}
                      </td>
                      <td className={`px-2 py-1.5 text-right font-mono font-medium ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#0D7A68]'}`}>
                        {formatPct(results.shippingMargin)}
                      </td>
                      <td className={`px-2 py-1.5 text-right font-mono font-semibold ${isDarkReport ? 'text-blue-300' : 'text-blue-700'}`}>
                        {formatMarkup(results.shippingMarkup)}
                      </td>
                      <td className={`px-3 py-1.5 text-right font-mono font-bold ${isDarkReport ? 'text-blue-300' : 'text-blue-700'}`}>
                        {formatEur(results.shippingPrice)}
                      </td>
                      <td className={`px-2.5 py-1.5 text-right font-mono font-semibold ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#0D7A68]'}`}>
                        +{formatEur(results.shippingProfitPerOrder)}
                      </td>
                    </tr>

                    {/* TOTAL MEDIO POR PEDIDO */}
                    <tr className={isDarkReport ? 'bg-[#161228] text-white font-bold border-t-2 border-[#47D2BF]' : 'bg-[#282329] text-[#FFF6EE] font-bold border-t-2 border-[#E2D8CA] print:bg-[#EDE6DC] print:text-black'}>
                      <td className="px-3 py-2 text-white print:text-black">
                        {language === 'en'
                          ? 'TOTAL ESTIMATED AVERAGE PER ORDER (WITH SHIPPING)'
                          : 'TOTAL MEDIO ESTIMADO POR PEDIDO (CON ENVÍO)'}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-gray-300 print:text-black">
                        {formatEur(results.orderCostExShipping + results.carrierCost)}
                      </td>
                      <td className={`px-2 py-2 text-right font-mono ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#5EEAD4]'} print:text-black`}>
                        {formatPct(results.marginTotal)}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-blue-300 print:text-black">
                        {formatMarkup(results.markupTotal)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-black text-white text-xs sm:text-sm print:text-black">
                        {formatEur(results.orderRevenueExShipping + results.shippingPrice)}
                      </td>
                      <td className={`px-2.5 py-2 text-right font-mono font-black ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#5EEAD4]'} text-xs sm:text-sm print:text-black`}>
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
                <h3 className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isDarkReport ? 'text-[#47D2BF]' : 'text-[#8C5D1E]'
                }`}>
                  <PieIcon className={`w-3.5 h-3.5 ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`} />
                  {language === 'en'
                    ? '3. Operational Analytics & Visual Distribution'
                    : '3. Análisis Gráfico y Distribución Operativa'}
                </h3>
                <span className={`text-[9.5px] font-mono ${isDarkReport ? 'text-gray-400' : 'text-[#7D7063]'}`}>
                  {language === 'en'
                    ? `Monthly Turnover: ${formatEur(results.totalRevenueMonth)}`
                    : `Facturación Mensual: ${formatEur(results.totalRevenueMonth)}`}
                </span>
              </div>

              {/* Grid 2 Columnas: Donut (Solo Ingresos) & Comparativa Ingresos vs Costes */}
              <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-2.5">
                {/* GRÁFICO A: ESTRUCTURA Y REPARTO PORCENTUAL (SOLO INGRESOS) */}
                <div className={`border rounded-lg p-2.5 flex flex-col justify-between shadow-2xs break-inside-avoid ${
                  isDarkReport ? 'border-[#2E2A48] bg-[#1E1B2E]' : 'border-[#E5DDD0] bg-white'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <PieIcon className={`w-3.5 h-3.5 shrink-0 ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`} />
                        <h4 className={`text-[11px] font-bold ${isDarkReport ? 'text-white' : 'text-[#2D2825]'}`}>
                          {language === 'en'
                            ? 'Operational Weight & Distribution'
                            : 'Estructura y Reparto Porcentual'}
                        </h4>
                      </div>
                      <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded border ${
                        isDarkReport
                          ? 'bg-[#25203D] text-[#47D2BF] border-[#47D2BF]/40'
                          : 'bg-[#F2F5FD] text-blue-800 border-blue-200'
                      }`}>
                        {language === 'en' ? 'Revenue Only' : 'Solo Ingresos'}
                      </span>
                    </div>
                    <p className={`text-[9.5px] mb-1.5 ${isDarkReport ? 'text-gray-400' : 'text-[#7D7063]'}`}>
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
                              backgroundColor: isDarkReport ? '#1E1B2E' : '#FAF7F2',
                              borderRadius: '6px',
                              borderColor: isDarkReport ? '#2E2A48' : '#E5DDD0',
                              color: isDarkReport ? '#F0F0F0' : '#2D2825',
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
                        <span className={`text-[11px] font-bold font-mono ${isDarkReport ? 'text-white' : 'text-[#2D2825]'}`}>
                          {formatEur(results.totalRevenueMonth)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Detalle porcentual por línea */}
                  <div className={`mt-1.5 pt-1.5 border-t max-h-32 overflow-y-auto space-y-0.5 ${
                    isDarkReport ? 'border-[#2E2A48]' : 'border-[#EFE8DC]'
                  }`}>
                    {revenueDonutData.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between text-[9.5px] py-0.5 px-1 rounded ${
                          isDarkReport ? 'bg-[#252238] text-gray-200' : 'bg-[#FAF6F0]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate mr-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className={`truncate font-medium ${isDarkReport ? 'text-gray-200' : 'text-[#3D352E]'}`} title={item.name}>
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 font-mono">
                          <span className={`text-[9px] ${isDarkReport ? 'text-gray-400' : 'text-[#7D7063]'}`}>
                            {formatEur(item.value)}
                          </span>
                          <span className={`font-bold w-10 text-right ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#2D2825]'}`}>
                            {item.pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* GRÁFICO B: COMPARATIVA INGRESOS VS COSTES POR LÍNEA */}
                <div className={`border rounded-lg p-2.5 flex flex-col justify-between shadow-2xs break-inside-avoid ${
                  isDarkReport ? 'border-[#2E2A48] bg-[#1E1B2E]' : 'border-[#E5DDD0] bg-white'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <BarChart3 className={`w-3.5 h-3.5 shrink-0 ${isDarkReport ? 'text-[#47D2BF]' : 'text-blue-600'}`} />
                        <h4 className={`text-[11px] font-bold ${isDarkReport ? 'text-white' : 'text-[#2D2825]'}`}>
                          {language === 'en'
                            ? 'Revenue vs Costs by Line'
                            : 'Comparativa: Ingresos vs Costes'}
                        </h4>
                      </div>
                      <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded border ${
                        isDarkReport
                          ? 'bg-[#252238] text-gray-200 border-[#2E2A48]'
                          : 'bg-[#F6F0E8] text-[#42382E] border-[#E5DDD0]'
                      }`}>
                        {language === 'en' ? `Direct (${currencySymbol})` : `Directa (${currencySymbol})`}
                      </span>
                    </div>
                    <p className={`text-[9.5px] mb-1.5 ${isDarkReport ? 'text-gray-400' : 'text-[#7D7063]'}`}>
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
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkReport ? '#2E2A48' : '#E5DDD0'} />
                          <XAxis
                            dataKey="shortName"
                            tick={{ fontSize: 8.5, fill: isDarkReport ? '#a1a1aa' : '#7D7063' }}
                            angle={-25}
                            textAnchor="end"
                            interval={0}
                          />
                          <YAxis
                            tick={{ fontSize: 8.5, fill: isDarkReport ? '#a1a1aa' : '#7D7063' }}
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
                              backgroundColor: isDarkReport ? '#1E1B2E' : '#FAF7F2',
                              borderRadius: '6px',
                              borderColor: isDarkReport ? '#2E2A48' : '#E5DDD0',
                              color: isDarkReport ? '#F0F0F0' : '#2D2825',
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
                            fill={isDarkReport ? '#6B4ABF' : '#4F46E5'}
                            radius={[2, 2, 0, 0]}
                          />
                          <Bar
                            dataKey="Costes"
                            name={language === 'en' ? 'Costs' : 'Costes'}
                            fill={isDarkReport ? '#f87171' : '#E11D48'}
                            radius={[2, 2, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Resumen comparativo inferior */}
                  <div className={`mt-1.5 pt-1.5 border-t flex items-center justify-between text-[9.5px] ${
                    isDarkReport ? 'border-[#2E2A48]' : 'border-[#EFE8DC]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded bg-purple-500 inline-block" />
                        <span className={isDarkReport ? 'text-gray-400' : 'text-[#7D7063]'}>{language === 'en' ? 'Rev:' : 'Ing:'}</span>
                        <strong className={`font-mono ${isDarkReport ? 'text-white' : 'text-[#2D2825]'}`}>{formatEur(results.totalRevenueMonth)}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded bg-red-400 inline-block" />
                        <span className={isDarkReport ? 'text-gray-400' : 'text-[#7D7063]'}>{language === 'en' ? 'Cost:' : 'Cos:'}</span>
                        <strong className={`font-mono ${isDarkReport ? 'text-white' : 'text-[#2D2825]'}`}>{formatEur(results.totalCostMonth)}</strong>
                      </span>
                    </div>
                    <span className={`font-mono font-bold ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#0D7A68]'}`}>
                      +{formatEur(results.totalProfitMonth)} ({formatPct(results.marginTotal)})
                    </span>
                  </div>
                </div>
              </div>

              {/* GRÁFICO C: APORTACIÓN AL BENEFICIO NETO POR LÍNEA */}
              <div className={`border rounded-lg p-2.5 shadow-2xs break-inside-avoid ${
                isDarkReport ? 'border-[#2E2A48] bg-[#1E1B2E]' : 'border-[#E5DDD0] bg-white'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className={`w-3.5 h-3.5 shrink-0 ${isDarkReport ? 'text-[#47D2BF]' : 'text-emerald-600'}`} />
                    <h4 className={`text-[11px] font-bold ${isDarkReport ? 'text-white' : 'text-[#2D2825]'}`}>
                      {language === 'en'
                        ? `Net Profit Contribution by Service Line (${currencySymbol})`
                        : `Aportación al Beneficio Neto por Línea (${currencySymbol})`}
                    </h4>
                  </div>
                  <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded border ${
                    isDarkReport
                      ? 'bg-[#142926] text-[#47D2BF] border-[#47D2BF]/40'
                      : 'bg-[#F0FAF7] text-[#0D7A68] border-[#BBECE2]'
                  }`}>
                    {language === 'en' ? 'Profitability Driver' : 'Motor de Margen'}
                  </span>
                </div>
                <p className={`text-[9.5px] mb-1.5 ${isDarkReport ? 'text-gray-400' : 'text-[#7D7063]'}`}>
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
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkReport ? '#2E2A48' : '#E5DDD0'} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 8.5, fill: isDarkReport ? '#a1a1aa' : '#7D7063' }}
                        tickFormatter={(v) => `${v}${currencySymbol}`}
                      />
                      <YAxis
                        type="category"
                        dataKey="shortName"
                        tick={{ fontSize: 8.5, fill: isDarkReport ? '#d4d4d8' : '#42382E' }}
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
                          backgroundColor: isDarkReport ? '#1E1B2E' : '#FAF7F2',
                          borderRadius: '6px',
                          borderColor: isDarkReport ? '#2E2A48' : '#E5DDD0',
                          color: isDarkReport ? '#F0F0F0' : '#2D2825',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="profit" name={language === 'en' ? 'Profit' : 'Beneficio'} radius={[0, 2, 2, 0]}>
                        {profitChartData.map((entry, index) => (
                          <Cell
                            key={`cell-profit-report-${index}`}
                            fill={entry.profit >= 0 ? (isDarkReport ? '#47D2BF' : '#10b981') : '#ef4444'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className={`mt-1.5 pt-1.5 border-t flex items-center justify-between text-[9px] ${
                  isDarkReport ? 'border-[#2E2A48] text-gray-400' : 'border-[#EFE8DC] text-[#7D7063]'
                }`}>
                  <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded inline-block ${isDarkReport ? 'bg-[#47D2BF]' : 'bg-emerald-500'}`} />
                    {language === 'en' ? `Positive Margin (${currencySymbol})` : `Margen positivo (${currencySymbol})`}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-red-400 inline-block" />
                    {language === 'en' ? 'Deficit / Cost' : 'Déficit / Coste'}
                  </span>
                  <span className={`font-mono font-bold ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#0D7A68]'}`}>
                    {language === 'en' ? 'Total Net Profit:' : 'Beneficio Neto Total:'} {formatEur(results.totalProfitMonth)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 4. Desglose Operativo Mensual Completo (P&L por Línea) */}
          {showMonthlyPL && (
            <div className="break-inside-avoid">
              <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1 ${
                isDarkReport ? 'text-[#47D2BF]' : 'text-[#8C5D1E]'
              }`}>
                <Layers className={`w-3 h-3 ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`} />
                {language === 'en'
                  ? (showCharts ? '4. Monthly P&L Account by Service Line' : '3. Monthly P&L Account by Service Line')
                  : (showCharts ? '4. Cuenta de Explotación Mensual por Líneas de Servicio' : '3. Cuenta de Explotación Mensual por Líneas de Servicio')}
              </h3>

              <div className={`border rounded-lg overflow-x-auto shadow-2xs ${
                isDarkReport ? 'border-[#2E2A48] bg-[#1E1B2E]' : 'border-[#E5DDD0] bg-white'
              }`}>
                <table className="w-full text-xs text-left min-w-[380px] print:text-[10px]">
                  <thead className={`font-semibold uppercase text-[9px] border-b ${
                    isDarkReport
                      ? 'bg-[#252238] text-gray-200 border-[#2E2A48]'
                      : 'bg-[#F4EEE4] text-[#42382E] border-[#E2D8CA]'
                  }`}>
                    <tr>
                      <th className="px-3 py-1.5">{language === 'en' ? 'Service Line' : 'Línea de Servicio'}</th>
                      <th className="px-2 py-1.5">{language === 'en' ? 'Category' : 'Categoría'}</th>
                      <th className="px-2 py-1.5 text-right">{language === 'en' ? 'Revenue' : 'Facturación'}</th>
                      <th className="px-2 py-1.5 text-right">{language === 'en' ? 'Costs' : 'Costes'}</th>
                      <th className={`px-2.5 py-1.5 text-right ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#0D7A68]'}`}>{language === 'en' ? 'Profit' : 'Beneficio'}</th>
                      <th className="px-2.5 py-1.5 text-right">{language === 'en' ? 'Margin' : 'Margen'}</th>
                      <th className={`px-2 py-1.5 text-right ${isDarkReport ? 'text-blue-300' : 'text-blue-700'}`}>{language === 'en' ? 'Markup' : 'Markup'}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkReport ? 'divide-[#2E2A48]' : 'divide-[#EFE8DC]'}`}>
                    {results.lines.map((line, idx) => (
                      <tr key={idx} className={isDarkReport ? 'hover:bg-[#252238]/60 text-[#F0F0F0]' : 'hover:bg-[#FAF6F0] text-[#2D2825]'}>
                        <td className={`px-3 py-1.5 font-medium ${isDarkReport ? 'text-white' : 'text-[#2D2825]'}`}>{translateLine(line.linea)}</td>
                        <td className="px-2 py-1.5 text-[10px] text-gray-400">{translateCategory(line.categoria)}</td>
                        <td className={`px-2 py-1.5 text-right font-mono ${isDarkReport ? 'text-white' : 'text-[#2D2825]'}`}>
                          {formatEur(line.ingresos)}
                        </td>
                        <td className={`px-2 py-1.5 text-right font-mono ${isDarkReport ? 'text-gray-300' : 'text-[#5A4E42]'}`}>
                          {formatEur(line.costes)}
                        </td>
                        <td className={`px-2.5 py-1.5 text-right font-mono font-bold ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#0D7A68]'}`}>
                          {formatEur(line.beneficio)}
                        </td>
                        <td className={`px-2.5 py-1.5 text-right font-mono ${isDarkReport ? 'text-gray-200' : 'text-[#2D2825]'}`}>
                          {formatPct(line.margen)}
                        </td>
                        <td className={`px-2 py-1.5 text-right font-mono font-semibold ${isDarkReport ? 'text-blue-300' : 'text-blue-700'}`}>
                          {formatMarkup(line.markup)}
                        </td>
                      </tr>
                    ))}
                    <tr className={`font-bold border-t-2 ${
                      isDarkReport
                        ? 'bg-[#161228] text-white border-[#47D2BF]'
                        : 'bg-[#F4EEE4] text-[#2D2825] border-t-2 border-[#6B4ABF]'
                    }`}>
                      <td className={`px-3 py-2 ${isDarkReport ? 'text-white' : 'text-[#2D2825]'}`} colSpan={2}>
                        {language === 'en' ? 'MONTHLY TOTAL' : 'TOTAL MENSUAL'}
                      </td>
                      <td className={`px-2 py-2 text-right font-mono font-black ${isDarkReport ? 'text-white' : 'text-[#2D2825]'}`}>
                        {formatEur(results.totalRevenueMonth)}
                      </td>
                      <td className={`px-2 py-2 text-right font-mono ${isDarkReport ? 'text-gray-300' : 'text-[#5A4E42]'}`}>
                        {formatEur(results.totalCostMonth)}
                      </td>
                      <td className={`px-2.5 py-2 text-right font-mono font-black ${isDarkReport ? 'text-[#47D2BF]' : 'text-[#0D7A68]'}`}>
                        {formatEur(results.totalProfitMonth)}
                      </td>
                      <td className={`px-2 py-2 text-right font-mono font-black ${isDarkReport ? 'text-gray-200' : 'text-[#2D2825]'}`}>
                        {formatPct(results.marginTotal)}
                      </td>
                      <td className={`px-2 py-2 text-right font-mono font-black ${isDarkReport ? 'text-blue-300' : 'text-blue-700'}`}>
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
            <div className={`rounded-lg p-2.5 border text-xs break-inside-avoid print:p-2 ${
              isDarkReport
                ? 'bg-[#1E1B2E] border-[#2E2A48] text-gray-300'
                : 'bg-[#F6F0E8] border-[#E6DCD0] text-[#554A3E]'
            }`}>
              <h4 className={`font-bold mb-1 uppercase text-[9px] tracking-wider ${
                isDarkReport ? 'text-[#47D2BF]' : 'text-[#8C5D1E]'
              }`}>
                {language === 'en' ? 'Operating Parameters of the Quote' : 'Parámetros Operativos de la Oferta'}
              </h4>
              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-y-1.5 gap-x-3 text-[10.5px] print:text-[10px] ${
                isDarkReport ? 'text-gray-300' : 'text-[#554A3E]'
              }`}>
                <div>
                  {language === 'en' ? 'Pack cost source:' : 'Fuente coste pack:'}{' '}
                  <strong className={isDarkReport ? 'text-white' : 'text-[#2D2825]'}>{language === 'en' ? 'Calculator (negotiated)' : 'Calculadora (negociado)'}</strong>
                </div>
                <div>
                  {language === 'en' ? 'Working days:' : 'Días laborables:'}{' '}
                  <strong className={isDarkReport ? 'text-white' : 'text-[#2D2825]'}>{inputs.workingDays} {language === 'en' ? 'days/month' : 'días/mes'}</strong>
                </div>
                <div>
                  {language === 'en' ? 'Pack mix:' : 'Mix de pack:'}{' '}
                  <strong className={isDarkReport ? 'text-white' : 'text-[#2D2825]'}>SPK {inputs.mixSpk}%, SPL {inputs.mixSpl}%, MPL {inputs.mixMpl}%, LPL {inputs.mixLpl}%</strong>
                </div>
                <div>
                  {language === 'en' ? 'Territory / Warehouse:' : 'Territorio / Warehouse:'}{' '}
                  <strong className={isDarkReport ? 'text-white' : 'text-[#2D2825]'}>{results.warehouse || 'Spain'}</strong>
                </div>
                <div>
                  {language === 'en' ? 'Base carrier cost:' : 'Coste carrier base:'}{' '}
                  <strong className={isDarkReport ? 'text-white' : 'text-[#2D2825]'}>{formatEur(results.carrierCost)}</strong>
                </div>
                <div>
                  {language === 'en' ? 'Picks / std shipment:' : 'Picks x envío standard:'}{' '}
                  <strong className={isDarkReport ? 'text-white' : 'text-[#2D2825]'}>
                    {inputs.unitsPerOrder} {language === 'en' ? 'picks' : 'picks'}
                  </strong>
                </div>
                <div>
                  {language === 'en' ? 'Packaging:' : 'Packaging:'}{' '}
                  <strong className={isDarkReport ? 'text-white' : 'text-[#2D2825]'}>
                    {inputs.customPackaging
                      ? (language === 'en' ? 'Custom (Client)' : 'Personalizado (Cliente)')
                      : (language === 'en' ? 'Standard Huboo' : 'Estándar Huboo')}
                  </strong>
                </div>
                <div>
                  {language === 'en' ? 'Estimated storage:' : 'Almacenaje estimado:'}{' '}
                  <strong className={isDarkReport ? 'text-white' : 'text-[#2D2825]'}>
                    {inputs.storagePalletWeeksMonth} {language === 'en' ? 'pallet·wk/month' : 'pallet·sem/mes'}
                  </strong>
                </div>
                <div>
                  {language === 'en' ? 'Goods-In inbound:' : 'Recepción Goods-In:'}{' '}
                  <strong className={isDarkReport ? 'text-white' : 'text-[#2D2825]'}>
                    {inputs.goodsInPalletsMonth} {language === 'en' ? 'pal/month' : 'pal/mes'}
                  </strong>
                </div>
                <div>
                  {language === 'en' ? 'Inserts per order:' : 'Inserts por pedido:'}{' '}
                  <strong className={isDarkReport ? 'text-white' : 'text-[#2D2825]'}>
                    {inputs.insertsPerOrder} {language === 'en' ? 'units' : 'uds'}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className={`border-t pt-2 flex items-center justify-between text-[9px] print:text-[8.5px] ${
            isDarkReport ? 'border-[#2E2A48] text-gray-400' : 'border-[#E5DDD0] text-[#8C7F72]'
          }`}>
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
