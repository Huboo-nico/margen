import React, { useState } from 'react';
import { CalculationResults } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatEur } from '../utils/calculations';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface LiveDateSchedulerProps {
  goLiveDate?: string;
  results: CalculationResults;
  onChange: (dateStr: string) => void;
  compact?: boolean;
}

export const LiveDateScheduler: React.FC<LiveDateSchedulerProps> = ({
  goLiveDate,
  results,
  onChange,
  compact = false,
}) => {
  const { language } = useLanguage();
  const [showCalendarView, setShowCalendarView] = useState(false);

  // Current selected date or default
  const currentDateStr = goLiveDate || results.goLiveDate || '2026-10-01';
  const selectedDate = new Date(currentDateStr + 'T00:00:00');
  const validSelectedDate = isNaN(selectedDate.getTime()) ? new Date() : selectedDate;

  // State for browsing calendar month
  const [viewYear, setViewYear] = useState(validSelectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(validSelectedDate.getMonth()); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Quick preset dates
  const setPreset = (type: 'twoWeeks' | 'nextMonth1st' | 'thirtyDays' | 'sixtyDays') => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);

    if (type === 'twoWeeks') {
      d.setDate(d.getDate() + 14);
    } else if (type === 'nextMonth1st') {
      d.setMonth(d.getMonth() + 1, 1);
    } else if (type === 'thirtyDays') {
      d.setDate(d.getDate() + 30);
    } else if (type === 'sixtyDays') {
      d.setDate(d.getDate() + 60);
    }

    const iso = d.toISOString().split('T')[0];
    onChange(iso);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  // Build days for month grid
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun, 1 = Mon...
  // Convert so Monday = 0, Sunday = 6
  const startOffset = (firstDayOfWeek + 6) % 7;

  const monthNamesEs = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const currentMonthName = language === 'en' ? monthNamesEn[viewMonth] : monthNamesEs[viewMonth];
  const weekDays = language === 'en' ? ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] : ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

  const daysUntil = results.goLiveDaysRemaining;
  const isPast = daysUntil < 0;
  const isToday = daysUntil === 0;

  return (
    <div className={`bg-gradient-to-br from-white to-gray-50/60 rounded-xl border border-gray-200 ${compact ? 'p-3' : 'p-4'} shadow-2xs`}>
      {/* Header and Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                {language === 'en' ? 'Scheduled Live Date' : 'Fecha Prevista Go-Live'}
              </h4>
              <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded">
                {language === 'en' ? 'Internal Schedule (No Real)' : 'Planificación Interna (No Real)'}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              {language === 'en'
                ? 'Target onboarding date to project YRR (In-Year) and annual ARR.'
                : 'Fecha estimada de operativa para proyectar YRR (año en curso) y ARR anual recurrente.'}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <span
            className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${
              isToday
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : isPast
                ? 'bg-gray-100 text-gray-700 border-gray-300'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            <Clock className="w-3 h-3" />
            {isToday
              ? (language === 'en' ? 'Live Today!' : '¡Lanzamiento Hoy!')
              : isPast
              ? (language === 'en' ? `Live for ${Math.abs(daysUntil)} days` : `Activo hace ${Math.abs(daysUntil)} días`)
              : (language === 'en' ? `In ${daysUntil} days` : `Faltan ${daysUntil} días`)}
          </span>
          <button
            type="button"
            onClick={() => setShowCalendarView(!showCalendarView)}
            className="text-[11px] font-semibold text-gray-600 hover:text-red-600 px-2 py-0.5 rounded border border-gray-200 bg-white hover:border-red-200 transition cursor-pointer"
          >
            {showCalendarView
              ? (language === 'en' ? 'Close Calendar' : 'Cerrar Calendario')
              : (language === 'en' ? 'Open Calendar' : 'Ver Calendario')}
          </button>
        </div>
      </div>

      {/* Main input & quick presets */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Date input */}
        <div className="md:col-span-5 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="date"
              value={currentDateStr}
              onChange={(e) => {
                if (e.target.value) {
                  onChange(e.target.value);
                  const parsed = new Date(e.target.value + 'T00:00:00');
                  if (!isNaN(parsed.getTime())) {
                    setViewYear(parsed.getFullYear());
                    setViewMonth(parsed.getMonth());
                  }
                }
              }}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-gray-900 shadow-2xs focus:ring-2 focus:ring-red-500 focus:border-red-500 cursor-pointer"
            />
          </div>
          <span className="text-[11px] text-gray-500 font-mono shrink-0">
            {results.goLiveMonthsRemainingInYear.toFixed(1)} {language === 'en' ? `mo in ${results.goLiveYear}` : `meses en ${results.goLiveYear}`}
          </span>
        </div>

        {/* Quick presets buttons */}
        <div className="md:col-span-7 flex items-center gap-1.5 flex-wrap justify-start md:justify-end">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mr-0.5">
            {language === 'en' ? 'Quick presets:' : 'Presets:'}
          </span>
          <button
            type="button"
            onClick={() => setPreset('twoWeeks')}
            className="px-2 py-1 text-[11px] font-medium bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-md transition cursor-pointer"
          >
            {language === 'en' ? '+2 Weeks' : '+2 Semanas'}
          </button>
          <button
            type="button"
            onClick={() => setPreset('nextMonth1st')}
            className="px-2 py-1 text-[11px] font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md transition cursor-pointer"
          >
            {language === 'en' ? '1st Next Month' : '1º Próximo Mes'}
          </button>
          <button
            type="button"
            onClick={() => setPreset('thirtyDays')}
            className="px-2 py-1 text-[11px] font-medium bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-md transition cursor-pointer"
          >
            {language === 'en' ? '+30 Days' : '+30 Días'}
          </button>
          <button
            type="button"
            onClick={() => setPreset('sixtyDays')}
            className="px-2 py-1 text-[11px] font-medium bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-md transition cursor-pointer"
          >
            {language === 'en' ? '+60 Days' : '+60 Días'}
          </button>
        </div>
      </div>

      {/* Mini Visual Calendar Picker (Toggleable) */}
      {showCalendarView && (
        <div className="mt-3.5 pt-3 border-t border-gray-200/80 bg-white p-3 rounded-lg border border-gray-200 shadow-sm max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 hover:bg-gray-100 rounded text-gray-600 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-gray-900">
              {currentMonthName} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 hover:bg-gray-100 rounded text-gray-600 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-1">
            {weekDays.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots for previous month offset */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7" />
            ))}

            {/* Days in month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const cellDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = cellDateStr === currentDateStr;
              const todayStr = new Date().toISOString().split('T')[0];
              const isCellToday = cellDateStr === todayStr;

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => {
                    onChange(cellDateStr);
                  }}
                  className={`h-7 w-full text-xs font-mono rounded flex items-center justify-center transition cursor-pointer ${
                    isSelected
                      ? 'bg-red-600 text-white font-bold shadow-xs'
                      : isCellToday
                      ? 'bg-red-50 text-red-700 font-bold border border-red-300'
                      : 'hover:bg-gray-100 text-gray-800'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Real-Time ARR & YRR Calculated Impact Box */}
      <div className="mt-3 pt-3 border-t border-gray-200/70 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* ARR Block */}
        <div className="bg-white p-2.5 rounded-lg border border-gray-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[10.5px] font-bold text-gray-700 uppercase tracking-wide">
                ARR (Annual Recurring Revenue)
              </span>
              <span className="text-[9px] font-mono text-gray-400">12 mo</span>
            </div>
            <span className="text-base font-black font-mono text-gray-900">
              {formatEur(results.arrRevenue)}
            </span>
            <span className="text-[10px] text-gray-500 block">
              {language === 'en' ? 'Annualized run-rate revenue' : 'Facturación anual recurrente normalizada'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-emerald-700 font-mono block">
              +{formatEur(results.arrProfit)}
            </span>
            <span className="text-[9px] text-gray-400">
              {language === 'en' ? 'Annual net profit' : 'Beneficio neto anual'}
            </span>
          </div>
        </div>

        {/* YRR Block */}
        <div className="bg-red-50/40 p-2.5 rounded-lg border border-red-200/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[10.5px] font-bold text-red-900 uppercase tracking-wide">
                YRR (Year Run Rate · {results.goLiveYear})
              </span>
              <span className="text-[9px] font-mono font-bold text-red-700 bg-red-100 px-1 py-0.2 rounded">
                {results.goLiveMonthsRemainingInYear.toFixed(1)} mo
              </span>
            </div>
            <span className="text-base font-black font-mono text-red-700">
              {formatEur(results.yrrRevenue)}
            </span>
            <span className="text-[10px] text-red-600/80 block">
              {language === 'en'
                ? `Revenue in ${results.goLiveYear} from go-live`
                : `Ingresos en ${results.goLiveYear} desde fecha go-live`}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-emerald-700 font-mono block">
              +{formatEur(results.yrrProfit)}
            </span>
            <span className="text-[9px] text-gray-500">
              {language === 'en' ? `Profit in ${results.goLiveYear}` : `Beneficio en ${results.goLiveYear}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
