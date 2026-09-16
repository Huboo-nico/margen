import React, { useState } from 'react';
import { CalculationResults } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
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
  const { isDark } = useTheme();
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
    <div className={`rounded-xl border ${compact ? 'p-3' : 'p-4'} shadow-2xs transition-colors duration-200 ${
      isDark
        ? 'bg-[#1E1B2E] border-[#2E2A48]'
        : 'bg-white border-[#E5DDD0]'
    }`}>
      {/* Header and Tag */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5 mb-3 ${
        isDark ? 'border-[#2E2A48]' : 'border-[#EFE8DC]'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
            isDark
              ? 'bg-[#25203D] text-[#47D2BF] border-[#47D2BF]/40'
              : 'bg-[#F4EEE4] text-[#6B4ABF] border-[#E5DDD0]'
          }`}>
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                {language === 'en' ? 'Scheduled Live Date' : 'Fecha Prevista Go-Live'}
              </h4>
              <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                isDark
                  ? 'bg-amber-950/50 text-amber-300 border-amber-800/60'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {language === 'en' ? 'Internal Schedule (No Real)' : 'Planificación Interna (No Real)'}
              </span>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
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
                ? isDark
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : isPast
                ? isDark
                  ? 'bg-[#151226] text-gray-400 border-[#2E2A48]'
                  : 'bg-gray-100 text-gray-700 border-gray-300'
                : isDark
                ? 'bg-rose-950/60 text-rose-300 border-rose-800/50'
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
            className={`text-[11px] font-semibold px-2 py-0.5 rounded border transition cursor-pointer ${
              isDark
                ? 'bg-[#151226] text-gray-300 border-[#2E2A48] hover:border-[#47D2BF] hover:text-[#47D2BF]'
                : 'bg-[#FAF7F2] text-[#4D453E] border-[#E5DDD0] hover:border-[#6B4ABF] hover:text-[#6B4ABF]'
            }`}
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
              className={`w-full border rounded-lg px-3 py-1.5 text-xs font-mono font-bold shadow-2xs cursor-pointer ${
                isDark
                  ? 'bg-[#120e26] border-[#2E2A48] text-white focus:border-[#47D2BF] focus:ring-1 focus:ring-[#47D2BF]'
                  : 'bg-[#FAF7F2] border-[#E5DDD0] text-[#2D2825] focus:border-[#6B4ABF] focus:ring-1 focus:ring-[#6B4ABF]'
              }`}
            />
          </div>
          <span className={`text-[11px] font-mono shrink-0 ${isDark ? 'text-gray-400' : 'text-[#7D736A]'}`}>
            {results.goLiveMonthsRemainingInYear.toFixed(1)} {language === 'en' ? `mo in ${results.goLiveYear}` : `meses en ${results.goLiveYear}`}
          </span>
        </div>

        {/* Quick presets buttons */}
        <div className="md:col-span-7 flex items-center gap-1.5 flex-wrap justify-start md:justify-end">
          <span className={`text-[10px] font-semibold uppercase tracking-wider mr-0.5 ${isDark ? 'text-gray-500' : 'text-[#8C8278]'}`}>
            {language === 'en' ? 'Quick presets:' : 'Presets:'}
          </span>
          <button
            type="button"
            onClick={() => setPreset('twoWeeks')}
            className={`px-2 py-1 text-[11px] font-medium rounded-md border transition cursor-pointer ${
              isDark
                ? 'bg-[#151226] hover:bg-[#25203D] text-gray-300 border-[#2E2A48]'
                : 'bg-[#FAF7F2] hover:bg-white text-[#4D453E] border-[#E5DDD0]'
            }`}
          >
            {language === 'en' ? '+2 Weeks' : '+2 Semanas'}
          </button>
          <button
            type="button"
            onClick={() => setPreset('nextMonth1st')}
            className={`px-2 py-1 text-[11px] font-semibold rounded-md border transition cursor-pointer ${
              isDark
                ? 'bg-[#25203D] text-[#47D2BF] border-[#47D2BF]/40'
                : 'bg-[#F4EEE4] text-[#6B4ABF] border-[#D5C9B8]'
            }`}
          >
            {language === 'en' ? '1st Next Month' : '1º Próximo Mes'}
          </button>
          <button
            type="button"
            onClick={() => setPreset('thirtyDays')}
            className={`px-2 py-1 text-[11px] font-medium rounded-md border transition cursor-pointer ${
              isDark
                ? 'bg-[#151226] hover:bg-[#25203D] text-gray-300 border-[#2E2A48]'
                : 'bg-[#FAF7F2] hover:bg-white text-[#4D453E] border-[#E5DDD0]'
            }`}
          >
            {language === 'en' ? '+30 Days' : '+30 Días'}
          </button>
          <button
            type="button"
            onClick={() => setPreset('sixtyDays')}
            className={`px-2 py-1 text-[11px] font-medium rounded-md border transition cursor-pointer ${
              isDark
                ? 'bg-[#151226] hover:bg-[#25203D] text-gray-300 border-[#2E2A48]'
                : 'bg-[#FAF7F2] hover:bg-white text-[#4D453E] border-[#E5DDD0]'
            }`}
          >
            {language === 'en' ? '+60 Days' : '+60 Días'}
          </button>
        </div>
      </div>

      {/* Mini Visual Calendar Picker (Toggleable) */}
      {showCalendarView && (
        <div className={`mt-3.5 pt-3 border-t p-3 rounded-lg border shadow-sm max-w-sm ${
          isDark
            ? 'bg-[#151226] border-[#2E2A48]'
            : 'bg-white border-[#E5DDD0]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className={`p-1 rounded transition cursor-pointer ${
                isDark ? 'hover:bg-[#25203D] text-gray-300' : 'hover:bg-[#F4EEE4] text-[#4D453E]'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
              {currentMonthName} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className={`p-1 rounded transition cursor-pointer ${
                isDark ? 'hover:bg-[#25203D] text-gray-300' : 'hover:bg-[#F4EEE4] text-[#4D453E]'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className={`grid grid-cols-7 gap-1 text-center text-[10px] font-bold mb-1 ${
            isDark ? 'text-gray-500' : 'text-[#8C8278]'
          }`}>
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
                      ? isDark
                        ? 'bg-[#47D2BF] text-[#120e26] font-bold shadow-xs'
                        : 'bg-[#6B4ABF] text-white font-bold shadow-xs'
                      : isCellToday
                      ? isDark
                        ? 'bg-[#25203D] text-[#47D2BF] font-bold border border-[#47D2BF]/40'
                        : 'bg-[#F4EEE4] text-[#6B4ABF] font-bold border border-[#6B4ABF]'
                      : isDark
                      ? 'hover:bg-[#25203D] text-gray-300'
                      : 'hover:bg-[#FAF7F2] text-[#2D2825]'
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
      <div className={`mt-3 pt-3 border-t grid grid-cols-1 sm:grid-cols-2 gap-3 ${
        isDark ? 'border-[#2E2A48]' : 'border-[#EFE8DC]'
      }`}>
        {/* ARR Block */}
        <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
          isDark
            ? 'bg-[#151226] border-[#2E2A48]'
            : 'bg-[#FAF7F2] border-[#E5DDD0]'
        }`}>
          <div>
            <div className="flex items-center gap-1">
              <span className={`text-[10.5px] font-bold uppercase tracking-wide ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
                ARR (Annual Recurring Revenue)
              </span>
              <span className={`text-[9px] font-mono ${isDark ? 'text-gray-500' : 'text-[#8C8278]'}`}>12 mo</span>
            </div>
            <span className={`text-base font-black font-mono block ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
              {formatEur(results.arrRevenue)}
            </span>
            <span className={`text-[10px] block ${isDark ? 'text-gray-400' : 'text-[#7D736A]'}`}>
              {language === 'en' ? 'Annualized run-rate revenue' : 'Facturación anual recurrente normalizada'}
            </span>
          </div>
          <div className="text-right">
            <span className={`text-[10px] font-bold font-mono block ${isDark ? 'text-[#47D2BF]' : 'text-emerald-700'}`}>
              +{formatEur(results.arrProfit)}
            </span>
            <span className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-[#8C8278]'}`}>
              {language === 'en' ? 'Annual net profit' : 'Beneficio neto anual'}
            </span>
          </div>
        </div>

        {/* YRR Block */}
        <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
          isDark
            ? 'bg-[#20172e] border-[#3E2748]'
            : 'bg-[#F7F2EB] border-[#DCD2C3]'
        }`}>
          <div>
            <div className="flex items-center gap-1">
              <span className={`text-[10.5px] font-bold uppercase tracking-wide ${isDark ? 'text-rose-300' : 'text-red-900'}`}>
                YRR (Year Run Rate · {results.goLiveYear})
              </span>
              <span className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded ${
                isDark
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                  : 'bg-red-100 text-red-700'
              }`}>
                {results.goLiveMonthsRemainingInYear.toFixed(1)} mo
              </span>
            </div>
            <span className={`text-base font-black font-mono block ${isDark ? 'text-rose-300' : 'text-red-700'}`}>
              {formatEur(results.yrrRevenue)}
            </span>
            <span className={`text-[10px] block ${isDark ? 'text-rose-400/80' : 'text-red-600/80'}`}>
              {language === 'en'
                ? `Revenue in ${results.goLiveYear} from go-live`
                : `Ingresos en ${results.goLiveYear} desde fecha go-live`}
            </span>
          </div>
          <div className="text-right">
            <span className={`text-[10px] font-bold font-mono block ${isDark ? 'text-[#47D2BF]' : 'text-emerald-700'}`}>
              +{formatEur(results.yrrProfit)}
            </span>
            <span className={`text-[9px] ${isDark ? 'text-gray-400' : 'text-[#7D736A]'}`}>
              {language === 'en' ? `Profit in ${results.goLiveYear}` : `Beneficio en ${results.goLiveYear}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
