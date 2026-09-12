import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-gray-100/90 hover:bg-gray-100 p-0.5 rounded-lg border border-gray-200 transition shadow-2xs">
      <div className="pl-1.5 pr-0.5 text-gray-400 hidden sm:flex items-center">
        <Globe className="w-3.5 h-3.5 text-gray-500" />
      </div>
      <button
        type="button"
        onClick={() => setLanguage('es')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
          language === 'es'
            ? 'bg-white text-red-600 shadow-2xs'
            : 'text-gray-500 hover:text-gray-800'
        }`}
        title="Cambiar a Español"
      >
        <span className="text-xs">🇪🇸</span>
        <span>ES</span>
      </button>

      <span className="text-gray-300 text-xs font-light">|</span>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
          language === 'en'
            ? 'bg-white text-red-600 shadow-2xs'
            : 'text-gray-500 hover:text-gray-800'
        }`}
        title="Switch to English"
      >
        <span className="text-xs">🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
};
