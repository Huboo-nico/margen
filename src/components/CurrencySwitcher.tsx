import React from 'react';
import { useLanguage, Currency } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Coins } from 'lucide-react';

interface CurrencyOption {
  code: Currency;
  symbol: string;
  nameEs: string;
  nameEn: string;
}

const CURRENCIES: CurrencyOption[] = [
  { code: 'EUR', symbol: '€', nameEs: 'Euro (€)', nameEn: 'Euro (€)' },
  { code: 'GBP', symbol: '£', nameEs: 'Libra (£)', nameEn: 'Pound (£)' },
  { code: 'USD', symbol: '$', nameEs: 'Dólar ($)', nameEn: 'US Dollar ($)' },
];

export const CurrencySwitcher: React.FC = () => {
  const { currency, setCurrency, language } = useLanguage();
  const { isDark } = useTheme();

  return (
    <div
      className={`flex items-center gap-0.5 p-0.5 rounded-lg border transition shadow-2xs ${
        isDark
          ? 'bg-[#1E1B2E] border-[#2E2A48]'
          : 'bg-[#F6F0E8] border-[#E5DDD0]'
      }`}
      role="group"
      aria-label={language === 'en' ? 'Select currency' : 'Seleccionar moneda'}
    >
      <div className={`pl-1.5 pr-1 hidden sm:flex items-center ${isDark ? 'text-gray-400' : 'text-[#8C5D1E]'}`} title={language === 'en' ? 'Currency (display)' : 'Moneda (ilustrativa)'}>
        <Coins className="w-3.5 h-3.5" />
      </div>

      {CURRENCIES.map((curr, idx) => {
        const isActive = currency === curr.code;
        return (
          <React.Fragment key={curr.code}>
            {idx > 0 && <span className={isDark ? 'text-gray-600 text-xs font-light' : 'text-[#D5C9B8] text-xs font-light'}>|</span>}
            <button
              type="button"
              onClick={() => setCurrency(curr.code)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition cursor-pointer ${
                isActive
                  ? isDark
                    ? 'bg-[#120e26] text-[#47D2BF] border border-[#47D2BF]/40 shadow-2xs font-bold'
                    : 'bg-white text-[#6B4ABF] shadow-2xs font-bold border border-[#E5DDD0]'
                  : isDark
                    ? 'text-gray-400 hover:text-gray-200 font-medium'
                    : 'text-[#6D635B] hover:text-[#2D2825] font-medium'
              }`}
              title={language === 'en' ? curr.nameEn : curr.nameEs}
            >
              <span className={`font-mono font-bold ${
                isActive
                  ? isDark ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'
                  : isDark ? 'text-gray-300' : 'text-[#4D453E]'
              }`}>
                {curr.symbol}
              </span>
              <span className={`text-[10px] font-semibold ${
                isActive
                  ? isDark ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'
                  : isDark ? 'text-gray-400' : 'text-[#7D736A]'
              }`}>
                {curr.code}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};
