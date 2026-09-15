import React, { useState, useMemo, useEffect } from 'react';
import { CalculatorInputs, ClientProfile } from './types';
import { DEFAULT_INPUTS, INITIAL_CLIENT_PROFILES } from './data/constants';
import { calculateAll } from './utils/calculations';
import { ClientManagerHeader } from './components/ClientManagerHeader';
import { ResumenTab } from './components/ResumenTab';
import { PreciosMargenesTab } from './components/PreciosMargenesTab';
import { DesgloseTab } from './components/DesgloseTab';
import { PropuestaClienteTab } from './components/PropuestaClienteTab';
import { ComparativaClientesTab } from './components/ComparativaClientesTab';
import { RateCardTab } from './components/RateCardTab';
import { AyudaTab } from './components/AyudaTab';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { CurrencySwitcher } from './components/CurrencySwitcher';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { useLanguage } from './context/LanguageContext';
import { useTheme } from './context/ThemeContext';
import { PackageCheck } from 'lucide-react';

const STORAGE_KEY = 'fulfilment_calculator_clients_v2';

export const App: React.FC = () => {
  // Load clients from localStorage or fallback
  const [clients, setClients] = useState<ClientProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_CLIENT_PROFILES;
  });

  const [activeClientId, setActiveClientId] = useState<string>(() => clients[0]?.id || 'client-1');
  const [activeTab, setActiveTab] = useState<
    'Resumen' | 'Precios & Margen' | 'Desglose' | 'Propuesta Cliente' | 'Comparativa' | 'Rate card' | 'Ayuda'
  >('Resumen');

  // Active client & inputs
  const currentClient = clients.find((c) => c.id === activeClientId) || clients[0];
  const [inputs, setInputs] = useState<CalculatorInputs>(currentClient.inputs);

  // When activeClientId changes, update inputs
  useEffect(() => {
    const client = clients.find((c) => c.id === activeClientId);
    if (client) {
      setInputs(client.inputs);
    }
  }, [activeClientId]);

  // Persist clients to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    } catch {
      // ignore
    }
  }, [clients]);

  // Calculation results
  const results = useMemo(() => calculateAll(inputs), [inputs]);

  // Update inputs and sync into active client
  const handleInputChange = (updated: Partial<CalculatorInputs>) => {
    setInputs((prev) => {
      const next = { ...prev, ...updated };
      setClients((prevClients) =>
        prevClients.map((c) =>
          c.id === activeClientId
            ? {
                ...c,
                name: next.clientName || c.name,
                updatedAt: new Date().toISOString(),
                inputs: next,
              }
            : c
        )
      );
      return next;
    });
  };

  // Client management handlers
  const handleCreateClient = () => {
    const newId = `client-${Date.now()}`;
    const newName = `Cliente ${clients.length + 1}`;
    const newClient: ClientProfile = {
      id: newId,
      name: newName,
      notes: '',
      updatedAt: new Date().toISOString(),
      inputs: {
        ...DEFAULT_INPUTS,
        clientName: newName,
      },
    };
    setClients((prev) => [...prev, newClient]);
    setActiveClientId(newId);
    setInputs(newClient.inputs);
    setActiveTab('Resumen');
  };

  const handleDuplicateClient = () => {
    const newId = `client-${Date.now()}`;
    const newName = `${inputs.clientName || 'Cliente'} (Copia)`;
    const newClient: ClientProfile = {
      id: newId,
      name: newName,
      notes: `Duplicado de ${inputs.clientName}`,
      updatedAt: new Date().toISOString(),
      inputs: {
        ...inputs,
        clientName: newName,
      },
    };
    setClients((prev) => [...prev, newClient]);
    setActiveClientId(newId);
    setInputs(newClient.inputs);
  };

  const handleDeleteClient = (id: string) => {
    if (clients.length <= 1) return;
    const filtered = clients.filter((c) => c.id !== id);
    setClients(filtered);
    const nextActive = filtered[0];
    setActiveClientId(nextActive.id);
    setInputs(nextActive.inputs);
  };

  const handleRenameActiveClient = (name: string) => {
    handleInputChange({ clientName: name });
  };

  const handleRenameClientById = (id: string, newName: string) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            name: newName,
            updatedAt: new Date().toISOString(),
            inputs: {
              ...c.inputs,
              clientName: newName,
            },
          };
        }
        return c;
      })
    );
    if (id === activeClientId) {
      setInputs((prev) => ({ ...prev, clientName: newName }));
    }
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              notes,
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
  };

  const { t } = useLanguage();
  const { isDark } = useTheme();

  const tabs = [
    { id: 'Resumen', label: t('tab.resumen') },
    { id: 'Precios & Margen', label: t('tab.preciosMargen') },
    { id: 'Desglose', label: t('tab.desglose') },
    { id: 'Propuesta Cliente', label: t('tab.propuesta') },
    { id: 'Comparativa', label: t('tab.comparativa') },
    { id: 'Rate card', label: t('tab.rateCard') },
    { id: 'Ayuda', label: t('tab.ayuda') },
  ] as const;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#120e26] text-[#F0F0F0]' : 'bg-[#F8F9FA] text-gray-900'
    }`}>
      {/* Top Header with Brand styling and Theme / Currency / Language Switchers */}
      <header className={`px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs gap-4 no-print print:hidden transition-colors duration-200 ${
        isDark ? 'bg-[#1E1B2E] border-b border-[#2E2A48]' : 'bg-white border-b border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          {/* Huboo Brand Badge */}
          <div className="w-9 h-9 rounded-lg bg-[#6B4ABF] border border-[#47D2BF]/40 flex items-center justify-center text-white shadow-2xs shrink-0">
            <PackageCheck className="w-5 h-5 text-[#47D2BF]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`text-lg sm:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('app.title')}
              </h1>
              <span className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                isDark
                  ? 'bg-[#25203D] text-[#47D2BF] border border-[#47D2BF]/40'
                  : 'bg-purple-100 text-[#6B4ABF] border border-purple-200'
              }`}>
                {t('app.clientByClient')}
              </span>
            </div>
            <p className={`text-xs hidden sm:block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('app.subtitle')}
            </p>
          </div>
        </div>

        {/* Right side: Luna/Sol Theme, Currency & Language Switcher Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <ThemeSwitcher />
          <CurrencySwitcher />
          <LanguageSwitcher />
        </div>
      </header>

      {/* Client Switcher & Name Editor Bar */}
      <div className="no-print">
        <ClientManagerHeader
          clients={clients}
          activeClientId={activeClientId}
          onSelectClient={(id) => {
            setActiveClientId(id);
            const c = clients.find((item) => item.id === id);
            if (c) setInputs(c.inputs);
          }}
          onCreateClient={handleCreateClient}
          onDuplicateClient={handleDuplicateClient}
          onDeleteClient={handleDeleteClient}
          onRenameClient={handleRenameActiveClient}
          onUpdateNotes={(notes) => handleUpdateNotes(activeClientId, notes)}
          currentInputs={inputs}
        />
      </div>

      {/* Main Responsive Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0 print:m-0 print:max-w-none">
        {/* Navigation Tabs */}
        <div className={`border-b mb-6 flex gap-1 overflow-x-auto pb-0.5 scrollbar-none no-print ${
          isDark ? 'border-[#2E2A48]' : 'border-gray-200'
        }`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold transition border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? isDark
                    ? 'border-[#47D2BF] text-[#47D2BF]'
                    : 'border-[#6B4ABF] text-[#6B4ABF]'
                  : isDark
                    ? 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

          {/* Active Tab Content */}
          <div className="transition-all">
            {activeTab === 'Resumen' && (
              <ResumenTab
                results={results}
                inputs={inputs}
                onOpenPricingSimulator={() => setActiveTab('Precios & Margen')}
                onUpdateInputs={handleInputChange}
              />
            )}
            {activeTab === 'Precios & Margen' && (
              <PreciosMargenesTab inputs={inputs} results={results} onChange={handleInputChange} />
            )}
            {activeTab === 'Desglose' && <DesgloseTab results={results} />}
            {activeTab === 'Propuesta Cliente' && (
              <PropuestaClienteTab inputs={inputs} results={results} />
            )}
            {activeTab === 'Comparativa' && (
              <ComparativaClientesTab
                clients={clients}
                activeClientId={activeClientId}
                onSelectClient={(id) => {
                  setActiveClientId(id);
                  const c = clients.find((item) => item.id === id);
                  if (c) setInputs(c.inputs);
                  setActiveTab('Resumen');
                }}
                onCreateClient={handleCreateClient}
                onRenameClient={handleRenameClientById}
                onUpdateNotes={handleUpdateNotes}
                onDeleteClient={handleDeleteClient}
              />
            )}
            {activeTab === 'Rate card' && <RateCardTab />}
            {activeTab === 'Ayuda' && <AyudaTab />}
          </div>
        </main>
    </div>
  );
};
export default App;
