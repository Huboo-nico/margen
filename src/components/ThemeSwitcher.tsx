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
          : 'bg-[#F4EEE4] border-[#E5DDD0]'
      }`}
      role="group"
      aria-label={language === 'en' ? 'Theme switcher' : 'Selector de tema'}
    >
      {/* Sol / Light button */}
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex items-center justify-center p-1.5 rounded-md text-xs transition cursor-pointer ${
          !isDark
            ? 'bg-white text-amber-600 font-bold shadow-2xs border border-[#E5DDD0]'
            : 'text-gray-400 hover:text-gray-200'
        }`}
        title={language === 'en' ? 'Day mode (warm tone)' : 'Modo Día (tono cálido)'}
        aria-label={language === 'en' ? 'Day mode' : 'Modo Día'}
      >
        <Sun className={`w-4 h-4 ${!isDark ? 'text-amber-500 fill-amber-400/30' : 'text-gray-400'}`} />
      </button>

      <span className={isDark ? 'text-[#2E2A48] text-xs font-light' : 'text-[#E5DDD0] text-xs font-light'}>|</span>

      {/* Luna / Dark button */}
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex items-center justify-center p-1.5 rounded-md text-xs transition cursor-pointer ${
          isDark
            ? 'bg-[#120e26] text-[#47D2BF] font-bold border border-[#47D2BF]/50 shadow-2xs'
            : 'text-[#8C8278] hover:text-[#2D2825]'
        }`}
        title={language === 'en' ? 'Night mode' : 'Modo Noche'}
        aria-label={language === 'en' ? 'Night mode' : 'Modo Noche'}
      >
        <Moon className={`w-4 h-4 ${isDark ? 'text-[#47D2BF] fill-[#47D2BF]/30' : 'text-[#8C8278]'}`} />
      </button>
    </div>
  );
};
