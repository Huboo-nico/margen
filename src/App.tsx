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
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { CurrencySwitcher } from './components/CurrencySwitcher';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { useLanguage } from './context/LanguageContext';
import { useTheme } from './context/ThemeContext';
import { PackageCheck, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import {
  getSavedGoogleSheetsUrl,
  saveSingleClientToGoogleSheets,
  fetchClientsFromGoogleSheets,
} from './utils/googleSheets';

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
  const [isGoogleSheetsOpen, setIsGoogleSheetsOpen] = useState<boolean>(false);
  const [isSavingToSheets, setIsSavingToSheets] = useState<boolean>(false);
  const [isLoadingFromSheets, setIsLoadingFromSheets] = useState<boolean>(false);
  const [saveToSheetsSuccess, setSaveToSheetsSuccess] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [activeTab, setActiveTab] = useState<
    'Resumen' | 'Precios & Margen' | 'Desglose' | 'Propuesta Cliente' | 'Comparativa' | 'Rate card' | 'Ayuda'
  >('Resumen');

  // Active client & inputs
  const currentClient = clients.find((c) => c.id === activeClientId) || clients[0];
  const [inputs, setInputs] = useState<CalculatorInputs>(currentClient.inputs);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage((cur) => (cur?.message === message ? null : cur));
    }, 4500);
  };

  const handleQuickSaveCurrentClient = async () => {
    const url = getSavedGoogleSheetsUrl();
    if (!url) {
      showToast('Introduce la URL de tu Web App de Google Apps Script para guardar en este ordenador.', 'info');
      setIsGoogleSheetsOpen(true);
      return;
    }

    const clientToSave = clients.find((c) => c.id === activeClientId) || clients[0];
    if (!clientToSave) return;

    setIsSavingToSheets(true);
    try {
      const res = await saveSingleClientToGoogleSheets(clientToSave, url);
      if (res.status === 'success') {
        setSaveToSheetsSuccess(true);
        showToast(res.message || `Cliente "${clientToSave.name}" guardado en Google Sheet.`, 'success');
        setTimeout(() => setSaveToSheetsSuccess(false), 3000);
      } else {
        showToast(res.message || 'Error al guardar en Google Sheet', 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Error al guardar en Sheet: ${msg}`, 'error');
    } finally {
      setIsSavingToSheets(false);
    }
  };

  const handleQuickLoadClients = async () => {
    const url = getSavedGoogleSheetsUrl();
    if (!url) {
      showToast('Introduce la URL de tu Web App de Google Apps Script para cargar los datos en este ordenador.', 'info');
      setIsGoogleSheetsOpen(true);
      return;
    }

    setIsLoadingFromSheets(true);
    try {
      const res = await fetchClientsFromGoogleSheets(url);
      if (res.success && res.clients.length > 0) {
        setClients(res.clients);
        setActiveClientId(res.clients[0].id);
        setInputs(res.clients[0].inputs);
        showToast(`Cargados ${res.clients.length} clientes desde Google Sheet ("${res.sheetName || 'Margen'}").`, 'success');
      } else if (res.success && res.clients.length === 0) {
        showToast('Conexión con Google Sheet exitosa, pero la hoja no tiene clientes guardados aún. Guarda algún cliente primero con "Guardar en Sheet".', 'info');
      } else {
        showToast(res.message || 'No se pudieron recuperar clientes de Google Sheet.', 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Error al cargar desde Sheet: ${msg}`, 'error');
    } finally {
      setIsLoadingFromSheets(false);
    }
  };

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
      isDark ? 'bg-[#120e26] text-[#F0F0F0]' : 'bg-[#FAF7F2] text-[#2D2825]'
    }`}>
      {/* Top Header with Brand styling and Theme / Currency / Language Switchers */}
      <header className={`px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs gap-4 no-print print:hidden transition-colors duration-200 ${
        isDark ? 'bg-[#1E1B2E] border-b border-[#2E2A48]' : 'bg-[#FAF7F2] border-b border-[#E5DDD0]'
      }`}>
        <div className="flex items-center gap-3">
          {/* Huboo Brand Badge */}
          <div className="w-9 h-9 rounded-lg bg-[#6B4ABF] border border-[#47D2BF]/40 flex items-center justify-center text-white shadow-2xs shrink-0">
            <PackageCheck className="w-5 h-5 text-[#47D2BF]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`text-lg sm:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                {t('app.title')}
              </h1>
              <span className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                isDark
                  ? 'bg-[#25203D] text-[#47D2BF] border border-[#47D2BF]/40'
                  : 'bg-[#F4EEE4] text-[#6B4ABF] border border-[#E5DDD0]'
              }`}>
                {t('app.clientByClient')}
              </span>
            </div>
            <p className={`text-xs hidden sm:block ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {t('app.subtitle')}
            </p>
          </div>
        </div>

        {/* Right side: Theme Switcher (Icons only), Currency & Language Switcher Controls */}
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
          onQuickSaveToSheets={handleQuickSaveCurrentClient}
          onQuickLoadFromSheets={handleQuickLoadClients}
          isSavingToSheets={isSavingToSheets}
          isLoadingFromSheets={isLoadingFromSheets}
          saveToSheetsSuccess={saveToSheetsSuccess}
        />
      </div>

      {/* Main Responsive Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0 print:m-0 print:max-w-none">
        {/* Navigation Tabs */}
        <div className={`border-b mb-6 flex gap-1 overflow-x-auto pb-0.5 scrollbar-none no-print ${
          isDark ? 'border-[#2E2A48]' : 'border-[#E5DDD0]'
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
                    : 'border-transparent text-[#7D736A] hover:text-[#2D2825] hover:border-[#D5C9B8]'
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

      {/* Google Sheets Sync Modal */}
      <GoogleSheetsModal
        isOpen={isGoogleSheetsOpen}
        onClose={() => setIsGoogleSheetsOpen(false)}
        clients={clients}
        activeClient={currentClient}
        onLoadClients={(loadedClients) => {
          setClients(loadedClients);
          if (loadedClients.length > 0) {
            setActiveClientId(loadedClients[0].id);
            setInputs(loadedClients[0].inputs);
          }
        }}
      />

      {/* Floating Action Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-md">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-[#121B17] text-emerald-300 border-emerald-500/40 shadow-emerald-950/40'
                : toastMessage.type === 'info'
                ? 'bg-[#141A29] text-blue-300 border-blue-500/40 shadow-blue-950/40'
                : 'bg-[#221316] text-red-300 border-red-500/40 shadow-red-950/40'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toastMessage.type === 'info' ? (
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{toastMessage.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
