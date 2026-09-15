import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { language } = useLanguage();

  const isDark = theme === 'dark';

  return (
    <div
      className={`flex items-center gap-0.5 p-0.5 rounded-lg border transition shadow-2xs ${
        isDark
          ? 'bg-[#1E1B2E] border-[#2E2A48]'
          : 'bg-gray-100/90 hover:bg-gray-100 border-gray-200'
      }`}
      role="group"
      aria-label={language === 'en' ? 'Theme switcher' : 'Selector de tema'}
    >
      {/* Sol / Light button */}
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition cursor-pointer ${
          !isDark
            ? 'bg-white text-[#6B4ABF] font-bold shadow-2xs'
            : 'text-gray-400 hover:text-gray-200 font-medium'
        }`}
        title={language === 'en' ? 'Light mode (Sun)' : 'Modo Claro (Sol)'}
      >
        <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-500 fill-amber-500/20' : 'text-gray-400'}`} />
        <span className="text-[11px] hidden sm:inline">
          {language === 'en' ? 'Sun' : 'Sol'}
        </span>
      </button>

      <span className={isDark ? 'text-gray-600 text-xs font-light' : 'text-gray-300 text-xs font-light'}>|</span>

      {/* Luna / Dark button */}
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition cursor-pointer ${
          isDark
            ? 'bg-[#120e26] text-[#47D2BF] font-bold border border-[#47D2BF]/40 shadow-2xs'
            : 'text-gray-500 hover:text-gray-900 font-medium'
        }`}
        title={language === 'en' ? 'Dark mode (Moon)' : 'Modo Oscuro (Luna)'}
      >
        <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-[#47D2BF] fill-[#47D2BF]/20' : 'text-gray-500'}`} />
        <span className="text-[11px] hidden sm:inline">
          {language === 'en' ? 'Moon' : 'Luna'}
        </span>
      </button>
    </div>
  );
};
