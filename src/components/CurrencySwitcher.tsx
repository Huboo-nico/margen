import React from 'react';
import { useLanguage, Currency } from '../context/LanguageContext';
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

  return (
    <div
      className="flex items-center gap-0.5 bg-gray-100/90 hover:bg-gray-100 p-0.5 rounded-lg border border-gray-200 transition shadow-2xs"
      role="group"
      aria-label={language === 'en' ? 'Select currency' : 'Seleccionar moneda'}
    >
      <div className="pl-1.5 pr-1 text-gray-400 hidden sm:flex items-center" title={language === 'en' ? 'Currency (display)' : 'Moneda (ilustrativa)'}>
        <Coins className="w-3.5 h-3.5 text-gray-500" />
      </div>

      {CURRENCIES.map((curr, idx) => {
        const isActive = currency === curr.code;
        return (
          <React.Fragment key={curr.code}>
            {idx > 0 && <span className="text-gray-300 text-xs font-light">|</span>}
            <button
              type="button"
              onClick={() => setCurrency(curr.code)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition cursor-pointer ${
                isActive
                  ? 'bg-white text-red-600 shadow-2xs font-black'
                  : 'text-gray-600 hover:text-gray-900 font-medium'
              }`}
              title={language === 'en' ? curr.nameEn : curr.nameEs}
            >
              <span className={`font-mono ${isActive ? 'text-red-600 font-black' : 'text-gray-700'}`}>
                {curr.symbol}
              </span>
              <span className={`text-[10px] ${isActive ? 'text-red-700 font-bold' : 'text-gray-500'}`}>
                {curr.code}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};
