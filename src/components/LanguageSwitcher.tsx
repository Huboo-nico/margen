import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { isDark } = useTheme();

  return (
    <div className={`flex items-center gap-1 p-0.5 rounded-lg border transition shadow-2xs ${
      isDark
        ? 'bg-[#1E1B2E] border-[#2E2A48]'
        : 'bg-[#F6F0E8] border-[#E5DDD0]'
    }`}>
      <div className={`pl-1.5 pr-0.5 hidden sm:flex items-center ${isDark ? 'text-gray-400' : 'text-[#8C5D1E]'}`}>
        <Globe className="w-3.5 h-3.5" />
      </div>
      <button
        type="button"
        onClick={() => setLanguage('es')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
          language === 'es'
            ? isDark
              ? 'bg-[#120e26] text-[#47D2BF] border border-[#47D2BF]/40 shadow-2xs'
              : 'bg-white text-[#6B4ABF] shadow-2xs border border-[#E5DDD0]'
            : isDark
              ? 'text-gray-400 hover:text-gray-200'
              : 'text-[#6D635B] hover:text-[#2D2825]'
        }`}
        title="Cambiar a Español"
      >
        <span className="text-xs">🇪🇸</span>
        <span>ES</span>
      </button>

      <span className={isDark ? 'text-gray-600 text-xs font-light' : 'text-[#D5C9B8] text-xs font-light'}>|</span>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
          language === 'en'
            ? isDark
              ? 'bg-[#120e26] text-[#47D2BF] border border-[#47D2BF]/40 shadow-2xs'
              : 'bg-white text-[#6B4ABF] shadow-2xs border border-[#E5DDD0]'
            : isDark
              ? 'text-gray-400 hover:text-gray-200'
              : 'text-[#6D635B] hover:text-[#2D2825]'
        }`}
        title="Switch to English"
      >
        <span className="text-xs">🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
};
