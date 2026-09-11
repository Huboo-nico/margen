import React, { useState, useMemo, useEffect } from 'react';
import { CalculatorInputs, ClientProfile } from './types';
import { DEFAULT_INPUTS, INITIAL_CLIENT_PROFILES } from './data/constants';
import { calculateAll } from './utils/calculations';
import { Sidebar } from './components/Sidebar';
import { ClientManagerHeader } from './components/ClientManagerHeader';
import { ResumenTab } from './components/ResumenTab';
import { PreciosMargenesTab } from './components/PreciosMargenesTab';
import { DesgloseTab } from './components/DesgloseTab';
import { PropuestaClienteTab } from './components/PropuestaClienteTab';
import { ComparativaClientesTab } from './components/ComparativaClientesTab';
import { RateCardTab } from './components/RateCardTab';
import { AyudaTab } from './components/AyudaTab';
import { SlidersHorizontal, PackageCheck } from 'lucide-react';

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  const tabs = [
    { id: 'Resumen', label: 'Resumen Cliente' },
    { id: 'Precios & Margen', label: 'Precios & Margen (Carrier Style)' },
    { id: 'Desglose', label: 'Desglose Operativo' },
    { id: 'Propuesta Cliente', label: 'Propuesta Comercial' },
    { id: 'Comparativa', label: 'Comparativa Clientes' },
    { id: 'Rate card', label: 'Rate Card' },
    { id: 'Ayuda', label: 'Ayuda' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-2xs">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">
                Calculadora Rentabilidad Fulfilment
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-amber-100 text-amber-800">
                Cliente por Cliente
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Preparación (Pack + 1er Pick), picks adicionales, incidencias, almacenamiento y envío con márgenes modificables.
            </p>
          </div>
        </div>

        {/* Mobile sidebar toggle button */}
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="lg:hidden flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Configuración</span>
        </button>
      </header>

      {/* Client Switcher & Name Editor Bar */}
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

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <div className={`${mobileSidebarOpen ? 'block' : 'hidden'} lg:block`}>
          <Sidebar inputs={inputs} results={results} onChange={handleInputChange} />
        </div>

        {/* Main Panel */}
        <main className="flex-1 p-6 max-w-6xl">
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-6 flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold transition border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-red-600 text-red-600'
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
                onOpenPricingSimulator={() => setActiveTab('Precios & Margen')}
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
    </div>
  );
};
export default App;
