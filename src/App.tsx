import React, { useState, useMemo, useEffect } from 'react';
import { CalculatorInputs, ClientProfile } from './types';
import { DEFAULT_INPUTS, INITIAL_CLIENT_PROFILES } from './data/constants';
import { calculateAll } from './utils/calculations';
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
import { PackageCheck, CheckCircle2, AlertCircle, Info, Users, FileSpreadsheet, Save } from 'lucide-react';
import {
  getSavedGoogleSheetsUrl,
  saveSingleClientToGoogleSheets,
  fetchClientsFromGoogleSheets,
  mergeClientProfiles,
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

  const [activeClientId, setActiveClientId] = useState<string>(() => clients[0]?.id || clients[0]?.name || 'NutriLife (Suplementos)');
  const [isGoogleSheetsOpen, setIsGoogleSheetsOpen] = useState<boolean>(false);
  const [isSavingToSheets, setIsSavingToSheets] = useState<boolean>(false);
  const [isLoadingFromSheets, setIsLoadingFromSheets] = useState<boolean>(false);
  const [saveToSheetsSuccess, setSaveToSheetsSuccess] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [activeTab, setActiveTab] = useState<
    'Resumen' | 'Precios & Margen' | 'Desglose' | 'Propuesta Cliente' | 'Comparativa' | 'Rate card' | 'Ayuda'
  >('Resumen');

  // Active client & inputs
  const currentClient =
    clients.find((c) => c.id.toLowerCase() === activeClientId.toLowerCase() || c.name.toLowerCase() === activeClientId.toLowerCase()) ||
    clients[0];
  const [inputs, setInputs] = useState<CalculatorInputs>(currentClient.inputs);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage((cur) => (cur?.message === message ? null : cur));
    }, 4500);
  };

  const handleQuickSaveCurrentClient = async () => {
    const url = getSavedGoogleSheetsUrl();
    const clientToSave =
      clients.find((c) => c.id.toLowerCase() === activeClientId.toLowerCase() || c.name.toLowerCase() === activeClientId.toLowerCase()) ||
      currentClient;
    if (!clientToSave) return;

    setIsSavingToSheets(true);
    try {
      const res = await saveSingleClientToGoogleSheets(clientToSave, url || undefined);
      if (res.status === 'success' || (res as any).success) {
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
    setIsLoadingFromSheets(true);
    try {
      const res = await fetchClientsFromGoogleSheets(url || undefined);
      if (res.success && res.clients.length > 0) {
        setClients((prev) => {
          const merged = mergeClientProfiles(prev, res.clients);
          return merged;
        });
        showToast(
          `Sincronizados ${res.clients.length} clientes desde Google Sheet ("${res.sheetName || 'Margen'}"). Tus clientes locales se han mantenido intactos.`,
          'success'
        );
      } else if (res.success && res.clients.length === 0) {
        showToast(
          'Conexión con Google Sheet exitosa, pero la hoja no tiene clientes guardados aún. Guarda algún cliente primero con "Guardar en Sheet".',
          'info'
        );
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

  // Eliminamos la carga forzada automática al inicio para respetar la preferencia del usuario
  // (los clientes de Sheet solo se cargan si el usuario pulsa explícitamente "Cargar Sheet")

  // Selector sincronizado de cliente para evitar pérdida de datos entre cotizaciones
  const handleSelectClient = (id: string) => {
    // 1. Guardar primero los datos del cliente actual antes de cambiar
    setClients((prev) =>
      prev.map((c) =>
        c.id.toLowerCase() === activeClientId.toLowerCase() || c.name.toLowerCase() === activeClientId.toLowerCase()
          ? { ...c, inputs: { ...inputs }, updatedAt: new Date().toISOString() }
          : c
      )
    );

    // 2. Cargar el cliente seleccionado
    const found = clients.find(
      (c) => c.id.toLowerCase() === id.toLowerCase() || c.name.toLowerCase() === id.toLowerCase()
    );
    if (found) {
      setActiveClientId(found.id);
      setInputs(found.inputs);
    }
  };

  // When activeClientId changes, update inputs without circular reset
  useEffect(() => {
    const client = clients.find(
      (c) => c.id.toLowerCase() === activeClientId.toLowerCase() || c.name.toLowerCase() === activeClientId.toLowerCase()
    );
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

  // Update inputs and sync into active client (El ID es idéntico al nombre del cliente)
  const handleInputChange = (updated: Partial<CalculatorInputs>) => {
    setInputs((prev) => {
      const next = { ...prev, ...updated };
      return next;
    });

    const activeIdLower = activeClientId.toLowerCase();
    const hasNameChange = updated.clientName !== undefined && updated.clientName.trim().length > 0;
    const nextClientName = hasNameChange ? updated.clientName!.trim() : undefined;

    setClients((prevClients) =>
      prevClients.map((c) => {
        if (c.id.toLowerCase() === activeIdLower || c.name.toLowerCase() === activeIdLower) {
          const nameToUse = nextClientName || c.name;
          return {
            ...c,
            id: nameToUse,
            name: nameToUse,
            updatedAt: new Date().toISOString(),
            inputs: {
              ...c.inputs,
              ...updated,
              clientName: nameToUse,
            },
          };
        }
        return c;
      })
    );

    if (nextClientName) {
      setActiveClientId(nextClientName);
    }
  };

  // Client management handlers
  const handleCreateClient = () => {
    // 1. Guardar el estado actual del cliente que se estaba editando antes de crear uno nuevo
    setClients((prev) =>
      prev.map((c) =>
        c.id.toLowerCase() === activeClientId.toLowerCase() || c.name.toLowerCase() === activeClientId.toLowerCase()
          ? { ...c, inputs: { ...inputs }, updatedAt: new Date().toISOString() }
          : c
      )
    );

    let count = clients.length + 1;
    let newName = `Cliente ${count}`;
    while (clients.some((c) => c.name.trim().toLowerCase() === newName.toLowerCase())) {
      count++;
      newName = `Cliente ${count}`;
    }
    const newClient: ClientProfile = {
      id: newName,
      name: newName,
      notes: '',
      updatedAt: new Date().toISOString(),
      inputs: {
        ...DEFAULT_INPUTS,
        clientName: newName,
      },
    };
    // Añadir nuevo cliente sin borrar ninguno de los existentes
    setClients((prev) => [...prev, newClient]);
    setActiveClientId(newName);
    setInputs(newClient.inputs);
    setActiveTab('Resumen');
    showToast(`Nuevo cliente "${newName}" creado. Tus cotizaciones anteriores siguen disponibles en la lista.`, 'info');
  };

  const handleDeleteClient = (id: string) => {
    if (clients.length <= 1) return;
    const targetLower = id.toLowerCase();
    const filtered = clients.filter((c) => c.id.toLowerCase() !== targetLower && c.name.toLowerCase() !== targetLower);
    setClients(filtered);
    const nextActive = filtered[0];
    setActiveClientId(nextActive.id);
    setInputs(nextActive.inputs);
    showToast(`Cliente eliminado.`, 'info');
  };

  const handleRenameClientById = (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const targetLower = id.toLowerCase();
    setClients((prev) =>
      prev.map((c) => {
        if (c.id.toLowerCase() === targetLower || c.name.toLowerCase() === targetLower) {
          return {
            ...c,
            id: trimmed,
            name: trimmed,
            updatedAt: new Date().toISOString(),
            inputs: {
              ...c.inputs,
              clientName: trimmed,
            },
          };
        }
        return c;
      })
    );
    if (activeClientId.toLowerCase() === targetLower) {
      setActiveClientId(trimmed);
      setInputs((prev) => ({ ...prev, clientName: trimmed }));
    }
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    const targetLower = id.toLowerCase();
    setClients((prev) =>
      prev.map((c) =>
        c.id.toLowerCase() === targetLower || c.name.toLowerCase() === targetLower
          ? {
              ...c,
              notes,
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
  };

  const { t, language } = useLanguage();
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
      {/* Top Header with Brand styling, Client Selector, Google Sheets button and Switchers */}
      <header className={`px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-wrap items-center justify-between sticky top-0 z-20 shadow-2xs gap-2.5 sm:gap-4 no-print print:hidden transition-colors duration-200 ${
        isDark ? 'bg-[#1E1B2E] border-b border-[#2E2A48]' : 'bg-[#FAF7F2] border-b border-[#E5DDD0]'
      }`}>
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap min-w-0">
          {/* Huboo Brand Badge */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#6B4ABF] border border-[#47D2BF]/40 flex items-center justify-center text-white shadow-2xs shrink-0">
            <PackageCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#47D2BF]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`text-base sm:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                {t('app.title')}
              </h1>
              <span className={`hidden sm:inline-block px-2 py-0.5 text-[11px] font-bold rounded ${
                isDark
                  ? 'bg-[#25203D] text-[#47D2BF] border border-[#47D2BF]/40'
                  : 'bg-[#F4EEE4] text-[#6B4ABF] border border-[#E5DDD0]'
              }`}>
                {t('app.clientByClient')}
              </span>
            </div>
            <p className={`text-[11px] sm:text-xs hidden md:block ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {t('app.subtitle')}
            </p>
          </div>

          {/* Clean In-Header Client Selector */}
          <div className="flex items-center gap-1.5 ml-1 sm:ml-2">
            <span className={`font-semibold flex items-center gap-1 text-xs ${isDark ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`}>
              <Users className="w-3.5 h-3.5 shrink-0" />
            </span>
            <select
              value={activeClientId}
              onChange={(e) => handleSelectClient(e.target.value)}
              aria-label="Seleccionar cliente cotizado"
              className={`rounded-lg px-2 sm:px-2.5 py-1 text-xs font-bold cursor-pointer max-w-[150px] sm:max-w-[210px] truncate transition border shadow-2xs ${
                isDark
                  ? 'bg-[#120e26] border-[#2E2A48] text-[#47D2BF] focus:ring-1 focus:ring-[#47D2BF]'
                  : 'border-[#E5DDD0] bg-white text-[#6B4ABF] focus:ring-1 focus:ring-[#6B4ABF]'
              }`}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id} className={isDark ? 'bg-[#1E1B2E] text-white' : 'bg-white text-[#2D2825]'}>
                  {c.name} {c.inputs.warehouse ? `· ${c.inputs.warehouse}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right side: Google Sheets Sync & Save, Theme Switcher, Currency & Language Switcher Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
          {/* Quick Save to Google Sheets */}
          <button
            type="button"
            onClick={handleQuickSaveCurrentClient}
            disabled={isSavingToSheets}
            title={language === 'en' ? 'Quick save active client to Google Sheet' : 'Guardar cliente actual en Google Sheet'}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs font-bold rounded-lg border transition shadow-2xs cursor-pointer ${
              saveToSheetsSuccess
                ? 'bg-emerald-600 text-white border-emerald-500'
                : isDark
                ? 'bg-[#151226] hover:bg-[#25203D] text-gray-200 border-[#2E2A48]'
                : 'bg-white hover:bg-[#FAF7F2] text-[#4D453E] border-[#E5DDD0]'
            }`}
          >
            <Save className={`w-3.5 h-3.5 ${isSavingToSheets ? 'animate-spin text-amber-400' : 'text-emerald-500'}`} />
            <span className="hidden md:inline">
              {saveToSheetsSuccess
                ? language === 'en'
                  ? 'Saved'
                  : 'Guardado'
                : language === 'en'
                ? 'Save'
                : 'Guardar'}
            </span>
          </button>

          {/* Quick Google Sheets Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsGoogleSheetsOpen(true)}
            title={language === 'en' ? 'Google Sheets Sync & Settings' : 'Sincronización y Configuración de Google Sheets'}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-bold rounded-lg border transition shadow-2xs cursor-pointer ${
              isDark
                ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-700/60'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="hidden xs:inline">Sheets</span>
          </button>

          <ThemeSwitcher />
          <CurrencySwitcher />
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Responsive Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 print:p-0 print:m-0 print:max-w-none">
        {/* Navigation Tabs (Smooth Horizontal Scroll on Mobile) */}
        <div className={`border-b mb-5 sm:mb-6 flex gap-1 overflow-x-auto pb-0.5 scrollbar-none no-print ${
          isDark ? 'border-[#2E2A48]' : 'border-[#E5DDD0]'
        }`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2.5 sm:pb-3 px-3 sm:px-3.5 text-xs sm:text-sm font-semibold transition border-b-2 -mb-px whitespace-nowrap cursor-pointer shrink-0 ${
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
                onRefreshFromSheets={handleQuickLoadClients}
                onSaveToSheets={handleQuickSaveCurrentClient}
                isLoadingSheets={isLoadingFromSheets}
                onOpenSheetsModal={() => setIsGoogleSheetsOpen(true)}
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
          setClients((prev) => mergeClientProfiles(prev, loadedClients));
          showToast(
            `Sincronizados ${loadedClients.length} clientes desde Google Sheet sin borrar tus clientes locales.`,
            'success'
          );
        }}
      />

      {/* Floating Action Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300 sm:max-w-md pointer-events-none">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold pointer-events-auto ${
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
