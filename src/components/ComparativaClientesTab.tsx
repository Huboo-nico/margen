import React, { useState } from 'react';
import { ClientProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { calculateAll, formatEur, formatPct, formatMarkup } from '../utils/calculations';
import {
  ArrowRight,
  Plus,
  Edit2,
  Check,
  Trash2,
  Tag,
  Warehouse,
  ArrowUpDown,
  Download,
  RefreshCw,
  Search,
  Table,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';

interface ComparativaClientesTabProps {
  clients: ClientProfile[];
  activeClientId: string;
  onSelectClient: (id: string) => void;
  onCreateClient: () => void;
  onRenameClient: (id: string, newName: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onDeleteClient: (id: string) => void;
  onRefreshFromSheets?: () => void;
  onSaveToSheets?: () => void;
  isLoadingSheets?: boolean;
  onOpenSheetsModal?: () => void;
}

const productTypeLabels: Record<string, { es: string; en: string }> = {
  'Suplementos': { es: 'Suplementos', en: 'Supplements' },
  'Cosmética': { es: 'Cosmética', en: 'Cosmetics' },
  'Perfume': { es: 'Perfume', en: 'Perfume' },
  'Vidrio': { es: 'Vidrio', en: 'Glass' },
  'Perfume + vidrio': { es: 'Perfume + vidrio', en: 'Perfume + glass' },
  'Apparel & Merch': { es: 'Apparel & Merch', en: 'Apparel & Merch' },
  'Moda / Ropa': { es: 'Moda / Ropa', en: 'Fashion / Apparel' },
  'Cosmética / Belleza': { es: 'Cosmética / Belleza', en: 'Cosmetics / Beauty' },
  'Electrónica': { es: 'Electrónica', en: 'Electronics' },
  'Hogar / Voluminoso': { es: 'Hogar / Voluminoso', en: 'Home / Bulky' },
  'General / Estándar': { es: 'General / Estándar', en: 'General / Standard' },
};

type SortField =
  | 'id'
  | 'name'
  | 'warehouse'
  | 'productType'
  | 'skuCount'
  | 'orders'
  | 'units'
  | 'packPrice'
  | 'firstPickPrice'
  | 'addPickPrice'
  | 'shippingPrice'
  | 'subscription'
  | 'revenue'
  | 'cost'
  | 'margin'
  | 'markup'
  | 'profit'
  | 'arr'
  | 'goLive'
  | 'updatedAt';

export const ComparativaClientesTab: React.FC<ComparativaClientesTabProps> = ({
  clients,
  activeClientId,
  onSelectClient,
  onCreateClient,
  onRenameClient,
  onUpdateNotes,
  onDeleteClient,
  onRefreshFromSheets,
  isLoadingSheets = false,
}) => {
  const { language } = useLanguage();
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState<string>('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Calcular métricas completas para cada cliente según las columnas del Sheet
  const calculatedClients = clients.map((c, index) => {
    const res = calculateAll(c.inputs);
    const subTier = c.inputs.subscriptionTier || 'none';
    const subscriptionVal =
      res.subscriptionRevenueMonth !== undefined
        ? res.subscriptionRevenueMonth
        : subTier === 'tier-50'
        ? 50
        : subTier === 'tier-150'
        ? 150
        : subTier === 'tier-450'
        ? 450
        : Number(c.inputs.subscriptionPrice || 0);

    return {
      profile: c,
      res,
      sheetRowIndex: index + 2, // Fila en Google Sheet (cabecera en fila 1)
      subscriptionPrice: subscriptionVal,
    };
  });

  // Filtrado por búsqueda
  const filteredClients = calculatedClients.filter(({ profile }) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = profile.name.toLowerCase().includes(term);
    const warehouseMatch = (profile.inputs.warehouse || 'Spain').toLowerCase().includes(term);
    const sectorMatch = (profile.inputs.productType || '').toLowerCase().includes(term);
    const notesMatch = (profile.notes || '').toLowerCase().includes(term);
    return nameMatch || warehouseMatch || sectorMatch || notesMatch;
  });

  // Ordenación por columnas del Sheet
  const sortedClients = [...filteredClients].sort((a, b) => {
    let comp = 0;
    switch (sortBy) {
      case 'id':
        comp = a.profile.id.localeCompare(b.profile.id);
        break;
      case 'name':
        comp = a.profile.name.localeCompare(b.profile.name);
        break;
      case 'warehouse':
        comp = (a.profile.inputs.warehouse || 'Spain').localeCompare(b.profile.inputs.warehouse || 'Spain');
        break;
      case 'productType':
        comp = (a.profile.inputs.productType || '').localeCompare(b.profile.inputs.productType || '');
        break;
      case 'skuCount':
        comp = (a.profile.inputs.skuCount || 0) - (b.profile.inputs.skuCount || 0);
        break;
      case 'orders':
        comp = a.res.ordersMonth - b.res.ordersMonth;
        break;
      case 'units':
        comp = a.res.unitsPerOrder - b.res.unitsPerOrder;
        break;
      case 'packPrice':
        comp = a.res.packPrice - b.res.packPrice;
        break;
      case 'firstPickPrice':
        comp = a.res.firstPickPrice - b.res.firstPickPrice;
        break;
      case 'addPickPrice':
        comp = a.res.additionalPickPrice - b.res.additionalPickPrice;
        break;
      case 'shippingPrice':
        comp = a.res.shippingPrice - b.res.shippingPrice;
        break;
      case 'subscription':
        comp = a.subscriptionPrice - b.subscriptionPrice;
        break;
      case 'revenue':
        comp = a.res.totalRevenueMonth - b.res.totalRevenueMonth;
        break;
      case 'cost':
        comp = a.res.totalCostMonth - b.res.totalCostMonth;
        break;
      case 'margin':
        comp = (a.res.marginTotal ?? 0) - (b.res.marginTotal ?? 0);
        break;
      case 'markup':
        comp = (a.res.markupTotal ?? 0) - (b.res.markupTotal ?? 0);
        break;
      case 'profit':
        comp = a.res.totalProfitMonth - b.res.totalProfitMonth;
        break;
      case 'arr':
        comp = a.res.arrRevenue - b.res.arrRevenue;
        break;
      case 'goLive':
        comp = a.res.goLiveDate.localeCompare(b.res.goLiveDate);
        break;
      case 'updatedAt':
        comp = (a.profile.updatedAt || '').localeCompare(b.profile.updatedAt || '');
        break;
      default:
        comp = 0;
    }
    return sortAsc ? comp : -comp;
  });

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
  };

  const exportToCsv = () => {
    // Exactamente las 22 columnas visibles del Google Sheet
    const headers = [
      'ID',
      'Cliente',
      'Territorio',
      'Perfil / Sector',
      'SKUs Activos',
      'Pedidos / Mes',
      'Picks / Pedido Promedio',
      'Tarifa Pack (€)',
      'Tarifa 1er Pick (€)',
      'Tarifa Pick Adicional (€)',
      'Tarifa Envío (€)',
      'Suscripción Mensual (€)',
      'Ingresos / Mes (€)',
      'Coste / Mes (€)',
      'Margen Bruto (%)',
      'Markup',
      'Beneficio / Mes (€)',
      'ARR (12 meses) (€)',
      'Fecha Go-Live',
      'Canales / Integraciones',
      'Notas Comerciales',
      'Última Actualización',
    ];

    const rows = sortedClients.map(({ profile, res, subscriptionPrice }) => [
      `"${profile.id}"`,
      `"${profile.name.replace(/"/g, '""')}"`,
      `"${(profile.inputs.warehouse || 'Spain').replace(/"/g, '""')}"`,
      `"${profile.inputs.productType}"`,
      profile.inputs.skuCount,
      res.ordersMonth,
      res.unitsPerOrder.toFixed(2),
      res.packPrice.toFixed(2),
      res.firstPickPrice.toFixed(2),
      res.additionalPickPrice.toFixed(2),
      res.shippingPrice.toFixed(2),
      subscriptionPrice.toFixed(2),
      res.totalRevenueMonth.toFixed(2),
      res.totalCostMonth.toFixed(2),
      res.marginTotal !== null ? `${(res.marginTotal * 100).toFixed(1)}%` : '0.0%',
      res.markupTotal !== null ? `${(res.markupTotal * 100).toFixed(1)}%` : '0.0%',
      res.totalProfitMonth.toFixed(2),
      res.arrRevenue.toFixed(2),
      `"${res.goLiveDate}"`,
      `"${(profile.inputs.technologies || []).join(', ')}"`,
      `"${(profile.notes || '').replace(/"/g, '""')}"`,
      `"${profile.updatedAt || new Date().toISOString()}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `huboo_sheet_comparativa_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startEditName = (id: string, currentName: string) => {
    setEditingId(id);
    setTempName(currentName);
  };

  const saveName = (id: string) => {
    if (tempName.trim()) {
      onRenameClient(id, tempName.trim());
    }
    setEditingId(null);
  };

  const startEditNotes = (id: string, currentNotes: string) => {
    setEditingNotesId(id);
    setTempNotes(currentNotes);
  };

  const saveNotes = (id: string) => {
    onUpdateNotes(id, tempNotes.trim());
    setEditingNotesId(null);
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Google Sheet Status Banner */}
      <div className={`p-4 rounded-xl border transition shadow-2xs ${
        isDark ? 'bg-[#1E1B2E] border-[#2E2A48]' : 'bg-white border-[#E5DDD0]'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`p-1.5 rounded-lg ${isDark ? 'bg-emerald-950/60 text-emerald-400' : 'bg-emerald-100 text-emerald-800'}`}>
                <Table className="w-4 h-4" />
              </div>
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                {language === 'en' ? 'Client Comparison (Google Sheets Mirror)' : 'Comparativa de Clientes (Espejo Google Sheet)'}
              </h2>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                isDark ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{language === 'en' ? 'Connected Sheet: "Margen"' : 'Hoja vinculada: "Margen"'}</span>
              </span>
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
                ({clients.length} {language === 'en' ? 'clients' : 'clientes registrados'})
              </span>
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en'
                ? 'Displays exactly the 21 columns configured in Google Sheets, including the new Monthly Subscription (€) tiers.'
                : 'Muestra exactamente las 21 columnas configuradas en Google Sheet, integrando los nuevos tramos de Suscripción Mensual (€) y cruce por cliente.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search filter input */}
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'en' ? 'Search client...' : 'Buscar cliente o territorio...'}
                className={`pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none transition w-44 sm:w-56 ${
                  isDark
                    ? 'bg-[#151226] border-[#2E2A48] text-white focus:border-[#47D2BF]'
                    : 'bg-[#FAF7F2] border-[#E5DDD0] text-[#2D2825] focus:border-[#6B4ABF]'
                }`}
              />
            </div>

            {/* Reload from sheets */}
            {onRefreshFromSheets && (
              <button
                type="button"
                onClick={onRefreshFromSheets}
                disabled={isLoadingSheets}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                  isDark
                    ? 'bg-[#25203D] hover:bg-[#2F294C] text-[#47D2BF] border-[#47D2BF]/30'
                    : 'bg-purple-50 hover:bg-purple-100 text-[#6B4ABF] border-purple-200'
                } ${isLoadingSheets ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={language === 'en' ? 'Reload clients from Google Sheets' : 'Recargar clientes desde Google Sheet'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSheets ? 'animate-spin' : ''}`} />
                <span>{isLoadingSheets ? (language === 'en' ? 'Syncing...' : 'Sincronizando...') : (language === 'en' ? 'Sync Sheet' : 'Sincronizar Sheet')}</span>
              </button>
            )}

            {/* Export to CSV */}
            <button
              type="button"
              onClick={exportToCsv}
              title={language === 'en' ? 'Download CSV matching Sheet columns' : 'Descargar CSV con las 22 columnas del Sheet'}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                isDark
                  ? 'bg-[#151226] hover:bg-[#25203D] text-gray-200 border-[#2E2A48]'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>{language === 'en' ? 'Export CSV' : 'Exportar CSV'}</span>
            </button>

            {/* Add new client */}
            <button
              type="button"
              onClick={onCreateClient}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#6B4ABF] hover:bg-[#583ca3] text-white rounded-lg shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'New Client' : 'Nuevo Cliente'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Card View (para pantallas pequeñas) */}
      <div className="block lg:hidden space-y-3">
        {sortedClients.map(({ profile, res, sheetRowIndex, subscriptionPrice }) => {
          const isActive = profile.id === activeClientId;
          const productLabel =
            productTypeLabels[profile.inputs.productType]?.[language] ||
            profile.inputs.productType;

          return (
            <div
              key={profile.id}
              className={`p-4 rounded-xl border transition ${
                isActive
                  ? isDark
                    ? 'bg-[#25203D] border-[#47D2BF] ring-1 ring-[#47D2BF]/40'
                    : 'bg-purple-50/60 border-[#6B4ABF] ring-1 ring-[#6B4ABF]/30'
                  : isDark
                  ? 'bg-[#1E1B2E] border-[#2E2A48]'
                  : 'bg-white border-[#E5DDD0]'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-400">
                      Fila {sheetRowIndex}
                    </span>
                    <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                      {profile.name}
                    </h3>
                    {isActive && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isDark ? 'bg-[#47D2BF]/20 text-[#47D2BF]' : 'bg-purple-100 text-[#6B4ABF]'
                      }`}>
                        {language === 'en' ? 'Active' : 'Activo'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#6B4ABF] dark:text-[#47D2BF]">
                      <Warehouse className="w-3 h-3" />
                      {profile.inputs.warehouse || 'Spain'}
                    </span>
                    <span>•</span>
                    <span>{productLabel}</span>
                    <span>•</span>
                    <span>{profile.inputs.skuCount} SKUs</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectClient(profile.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                    isActive
                      ? isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                      : 'bg-[#6B4ABF] text-white hover:bg-[#583ca3]'
                  }`}
                >
                  <span>{isActive ? (language === 'en' ? 'Active' : 'Editando') : (language === 'en' ? 'Select' : 'Abrir')}</span>
                  {!isActive && <ArrowRight className="w-3 h-3" />}
                </button>
              </div>

              {/* Grid de métricas completas del Sheet */}
              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-lg text-xs mb-3 ${
                isDark ? 'bg-[#151226]' : 'bg-[#FAF7F2]'
              }`}>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block font-semibold">Pedidos / Mes</span>
                  <span className={`font-bold font-mono ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    {res.ordersMonth.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block font-semibold">Suscripción</span>
                  <span className="font-bold font-mono text-[#6B4ABF] dark:text-[#47D2BF]">
                    {subscriptionPrice > 0 ? formatEur(subscriptionPrice) : '0 €'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block font-semibold">Ingresos / Mes</span>
                  <span className={`font-bold font-mono ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    {formatEur(res.totalRevenueMonth)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block font-semibold">Beneficio / Mes</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatEur(res.totalProfitMonth)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <div className="flex items-center gap-3">
                  <span>
                    Margen:{' '}
                    <strong className={res.marginTotal !== null && res.marginTotal >= 0.2 ? (isDark ? 'text-white' : 'text-[#2D2825]') : 'text-amber-500'}>
                      {formatPct(res.marginTotal)}
                    </strong>
                  </span>
                  <span>
                    ARR: <strong className={isDark ? 'text-purple-300' : 'text-purple-700'}>{formatEur(res.arrRevenue)}</strong>
                  </span>
                </div>

                {clients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(language === 'en' ? `Delete ${profile.name}?` : `¿Eliminar a ${profile.name}?`)) {
                        onDeleteClient(profile.id);
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition cursor-pointer"
                    title={language === 'en' ? 'Delete client' : 'Eliminar cliente'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Spreadsheet Table View (Exact Mirror of the 21 Google Sheet Columns) */}
      <div className={`hidden lg:block rounded-xl border overflow-hidden shadow-2xs transition-colors duration-200 ${
        isDark ? 'bg-[#1E1B2E] border-[#2E2A48]' : 'bg-white border-[#E5DDD0]'
      }`}>
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-xs text-left border-collapse">
            <thead className={`border-b text-[11px] font-bold uppercase sticky top-0 z-10 select-none ${
              isDark ? 'bg-[#171426] text-gray-300 border-[#2E2A48]' : 'bg-[#F4EEE4] text-[#4D453E] border-[#E5DDD0]'
            }`}>
              <tr>
                {/* 1. ID / Fila */}
                <th
                  onClick={() => handleSort('id')}
                  className="px-2.5 py-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition whitespace-nowrap"
                  title="Fila en el Sheet / ID único"
                >
                  <div className="flex items-center gap-1">
                    <span>Sheet #</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'id' ? 'text-[#6B4ABF] dark:text-[#47D2BF]' : 'text-gray-400'}`} />
                  </div>
                </th>

                {/* 2. Cliente */}
                <th
                  onClick={() => handleSort('name')}
                  className="px-3 py-3 min-w-[160px] cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition"
                  title="Nombre del cliente"
                >
                  <div className="flex items-center gap-1">
                    <span>Cliente</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'name' ? 'text-[#6B4ABF] dark:text-[#47D2BF]' : 'text-gray-400'}`} />
                  </div>
                </th>

                {/* 3. Territorio */}
                <th
                  onClick={() => handleSort('warehouse')}
                  className="px-2.5 py-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition"
                  title="Territorio / Warehouse"
                >
                  <div className="flex items-center gap-1">
                    <span>Territorio</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'warehouse' ? 'text-[#6B4ABF] dark:text-[#47D2BF]' : 'text-gray-400'}`} />
                  </div>
                </th>

                {/* 4. Perfil / Sector */}
                <th
                  onClick={() => handleSort('productType')}
                  className="px-2.5 py-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition whitespace-nowrap"
                  title="Perfil / Sector"
                >
                  <div className="flex items-center gap-1">
                    <span>Perfil</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'productType' ? 'text-[#6B4ABF] dark:text-[#47D2BF]' : 'text-gray-400'}`} />
                  </div>
                </th>

                {/* 5. SKUs Activos */}
                <th
                  onClick={() => handleSort('skuCount')}
                  className="px-2 py-3 text-right cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition whitespace-nowrap"
                  title="SKUs Activos"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>SKUs</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'skuCount' ? 'text-[#6B4ABF] dark:text-[#47D2BF]' : 'text-gray-400'}`} />
                  </div>
                </th>

                {/* 6. Pedidos / Mes */}
                <th
                  onClick={() => handleSort('orders')}
                  className="px-2.5 py-3 text-right cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition whitespace-nowrap"
                  title="Pedidos / Mes"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Pedidos/Mes</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'orders' ? 'text-[#6B4ABF] dark:text-[#47D2BF]' : 'text-gray-400'}`} />
                  </div>
                </th>

                {/* 7. Picks / Pedido Promedio */}
                <th
                  onClick={() => handleSort('units')}
                  className="px-2 py-3 text-right cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition whitespace-nowrap"
                  title="Picks / Pedido Promedio"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Picks/Ped</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'units' ? 'text-[#6B4ABF] dark:text-[#47D2BF]' : 'text-gray-400'}`} />
                  </div>
                </th>

                {/* 8. Tarifa Pack (€) */}
                <th
                  onClick={() => handleSort('packPrice')}
                  className="px-2 py-3 text-right cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition whitespace-nowrap"
                  title="Tarifa Pack (€)"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Pack</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'packPrice' ? 'text-[#6B4ABF] dark:text-[#47D2BF]' : 'text-gray-400'}`} />
                  </div>
                </th>

                {/* 9. Tarifa 1er Pick (€) */}
                <th
                  onClick={() => handleSort('firstPickPrice')}
                  className="px-2 py-3 text-right cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition whitespace-nowrap"
                  title="Tarifa 1er Pick (€)"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>1er Pick</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'firstPickPrice' ? 'text-[#6B4ABF] dark:text-[#47D2BF]' : 'text-gray-400'}`} />
                  </div>
                </th>

                {/* 10. Tarifa Pick Adicional (€) */}
                <th
                  onClick={() => handleSort('addPickPrice')}
                  className="px-2 py-3 text-right cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition whitespace-nowrap"
                  title="Tarifa Pick Adicional (€)"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Add Pick</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'addPickPrice' ? 'text-[#6B4ABF] dark:text-[#47D2BF]' : 'text-gray-400'}`} />
                  </div>
                </th>

                {/* 11. Tarifa Envío (€) */}
                <th
                  onClick={() => handleSort('shippingPrice')}
                  className="px-2.5 py-3 text-right cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition whitespace-nowrap"
                  title="Tarifa Envío (€)"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Envío</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'shippingPrice' ? 'text-[#6B4ABF] dark:text-[#47D2BF]' : 'text-gray-400'}`} />
                  </div>
                </th>

                {/* 12. Suscripción Mensual (€) -> NEW COLUMN IN GOOGLE SHEET */}
                <th
                  onClick={() => handleSort('subscription')}
                  className={`px-3 py-3 text-right cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition whitespace-nowrap font-extrabold ${
                    isDark ? 'text-[#47D2BF] bg-[#25203D]' : 'text-[#6B4ABF] bg-purple-50'
                  }`}
                  title="Suscripción Mensual (€) (50€, 150€ o 450€)"
                >
                  <div className="flex items-center justify-end gap-1">
                    <CreditCard className="w-3 h-3" />
                    <span>Suscripción</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'subscription' ? 'text-[#6B4ABF] dark:text-[#47D2BF]' : 'text-gray-400'}`} />
                  </div>
                </th>

                {/* 13. Ingresos / Mes (€) */}
                <th
                  onClick={() => handleSort('revenue')}
                  className="px-3 py-3 text-right cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition whitespace-nowrap"
                  title="Ingresos / Mes (€)"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Ingresos/Mes</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'revenue' ? 'text-[#6B4ABF] dark:text-[#47D2BF]' : 'text-gray-400'}`} />
                  </div>
                </th>

                {/* 14. Coste / Mes (€) */}
                <th
                  onClick={() => handleSort('cost')}
                  className="px-2.5 py-3 text-right cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition whitespace-nowrap text-gray-500"
                  title="Coste / Mes (€)"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Coste/Mes</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'cost' ? 'text-[#6B4ABF] dark:text-[#47D2BF]' : 'text-gray-400'}`} />
                  </div>
                </th>

                {/* 15. Margen Bruto (%) */}
                <th
                  onClick={() => handleSort('margin')}
                  className="px-2.5 py-3 text-right cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition whitespace-nowrap"
                  title="Margen Bruto (%)"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Margen</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'margin' ? 'text-[#6B4ABF] dark:text-[#47D2BF]' : 'text-gray-400'}`} />
                  </div>
                </th>

                {/* 16. Markup */}
                <th
                  onClick={() => handleSort('markup')}
                  className="px-2.5 py-3 text-right cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition whitespace-nowrap text-blue-600 dark:text-blue-400"
                  title="Markup s/coste"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Markup</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'markup' ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                </th>

                {/* 17. Beneficio / Mes (€) */}
                <th
                  onClick={() => handleSort('profit')}
                  className="px-3 py-3 text-right font-black text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition whitespace-nowrap"
                  title="Beneficio Neto / Mes (€)"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Beneficio/Mes</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'profit' ? 'text-emerald-500' : 'text-gray-400'}`} />
                  </div>
                </th>

                {/* 18. ARR (12 meses) (€) */}
                <th
                  onClick={() => handleSort('arr')}
                  className="px-2.5 py-3 text-right cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition whitespace-nowrap"
                  title="ARR (12 meses) (€)"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>ARR (12m)</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'arr' ? 'text-[#6B4ABF] dark:text-[#47D2BF]' : 'text-gray-400'}`} />
                  </div>
                </th>

                {/* 19. Fecha Go-Live */}
                <th
                  onClick={() => handleSort('goLive')}
                  className="px-2.5 py-3 text-left cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition whitespace-nowrap"
                  title="Fecha Go-Live"
                >
                  <div className="flex items-center gap-1">
                    <span>Go-Live</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'goLive' ? 'text-[#6B4ABF] dark:text-[#47D2BF]' : 'text-gray-400'}`} />
                  </div>
                </th>

                {/* 20. Canales / Integraciones */}
                <th className="px-2.5 py-3 text-left whitespace-nowrap" title="Canales / Integraciones">
                  Canales
                </th>

                {/* 21. Notas Comerciales */}
                <th className="px-3 py-3 text-left min-w-[130px]" title="Notas Comerciales">
                  Notas
                </th>

                {/* Acciones */}
                <th className="px-3 py-3 text-center sticky right-0 z-10 bg-inherit whitespace-nowrap">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className={`divide-y text-xs ${isDark ? 'divide-[#2E2A48]' : 'divide-[#EFE8DC]'}`}>
              {sortedClients.map(({ profile, res, sheetRowIndex, subscriptionPrice }) => {
                const isActive = profile.id === activeClientId;
                const isEditingThis = editingId === profile.id;
                const isEditingNotesThis = editingNotesId === profile.id;
                const productLabel =
                  productTypeLabels[profile.inputs.productType]?.[language] ||
                  profile.inputs.productType;

                return (
                  <tr
                    key={profile.id}
                    className={`transition ${
                      isActive
                        ? isDark
                          ? 'bg-[#25203D]/70 font-medium'
                          : 'bg-purple-50/70 font-medium'
                        : isDark
                        ? 'hover:bg-[#1a172c]'
                        : 'hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {/* 1. Sheet # (Fila en Google Sheet) */}
                    <td className="px-2.5 py-2.5 font-mono text-[11px] text-gray-400 whitespace-nowrap">
                      <span
                        className="cursor-help"
                        title={`Fila ${sheetRowIndex} en Google Sheet. ID: ${profile.id}`}
                      >
                        {sheetRowIndex}
                      </span>
                    </td>

                    {/* 2. Cliente (Nombre editable) */}
                    <td className="px-3 py-2.5 font-bold whitespace-nowrap">
                      {isEditingThis ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveName(profile.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            autoFocus
                            className={`border rounded px-2 py-0.5 text-xs font-bold focus:outline-none w-36 ${
                              isDark
                                ? 'bg-[#151226] border-[#47D2BF] text-white'
                                : 'bg-white border-[#6B4ABF] text-[#2D2825]'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => saveName(profile.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group">
                          <span
                            onClick={() => onSelectClient(profile.id)}
                            className={`cursor-pointer hover:underline ${
                              isDark ? 'text-white hover:text-[#47D2BF]' : 'text-[#2D2825] hover:text-[#6B4ABF]'
                            }`}
                            title="Clic para seleccionar y abrir calculadora"
                          >
                            {profile.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => startEditName(profile.id, profile.name)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-[#6B4ABF] dark:hover:text-[#47D2BF] transition cursor-pointer"
                            title="Renombrar cliente"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {isActive && (
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              isDark ? 'bg-[#47D2BF]/20 text-[#47D2BF]' : 'bg-purple-100 text-[#6B4ABF]'
                            }`}>
                              Activo
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 3. Territorio */}
                    <td className="px-2.5 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded border ${
                        isDark ? 'bg-[#151226] text-purple-300 border-[#2E2A48]' : 'bg-[#FAF7F2] text-[#6B4ABF] border-[#E5DDD0]'
                      }`}>
                        <Warehouse className="w-3 h-3" />
                        {profile.inputs.warehouse || 'Spain'}
                      </span>
                    </td>

                    {/* 4. Perfil / Sector */}
                    <td className={`px-2.5 py-2.5 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-[#6D635B]'}`}>
                      {productLabel}
                    </td>

                    {/* 5. SKUs Activos */}
                    <td className={`px-2 py-2.5 text-right font-mono ${isDark ? 'text-gray-300' : 'text-[#6D635B]'}`}>
                      {profile.inputs.skuCount}
                    </td>

                    {/* 6. Pedidos / Mes */}
                    <td className={`px-2.5 py-2.5 text-right font-mono font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                      {res.ordersMonth.toLocaleString()}
                    </td>

                    {/* 7. Picks / Pedido Promedio */}
                    <td className={`px-2 py-2.5 text-right font-mono ${isDark ? 'text-gray-300' : 'text-[#6D635B]'}`}>
                      {res.unitsPerOrder.toFixed(1)}
                    </td>

                    {/* 8. Tarifa Pack (€) */}
                    <td className={`px-2 py-2.5 text-right font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
                      {formatEur(res.packPrice)}
                    </td>

                    {/* 9. Tarifa 1er Pick (€) */}
                    <td className={`px-2 py-2.5 text-right font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
                      {formatEur(res.firstPickPrice)}
                    </td>

                    {/* 10. Tarifa Pick Adicional (€) */}
                    <td className={`px-2 py-2.5 text-right font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
                      {formatEur(res.additionalPickPrice)}
                    </td>

                    {/* 11. Tarifa Envío (€) */}
                    <td className={`px-2.5 py-2.5 text-right font-mono font-medium text-blue-600 dark:text-blue-400`}>
                      {formatEur(res.shippingPrice)}
                    </td>

                    {/* 12. Suscripción Mensual (€) */}
                    <td className={`px-3 py-2.5 text-right font-mono font-bold whitespace-nowrap ${
                      subscriptionPrice > 0
                        ? isDark ? 'text-[#47D2BF] bg-[#25203D]/60' : 'text-[#6B4ABF] bg-purple-50/70'
                        : isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {subscriptionPrice > 0 ? (
                        <span>+{formatEur(subscriptionPrice)}</span>
                      ) : (
                        <span>0,00 €</span>
                      )}
                    </td>

                    {/* 13. Ingresos / Mes (€) */}
                    <td className={`px-3 py-2.5 text-right font-mono font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                      {formatEur(res.totalRevenueMonth)}
                    </td>

                    {/* 14. Coste / Mes (€) */}
                    <td className={`px-2.5 py-2.5 text-right font-mono text-[11px] ${isDark ? 'text-gray-400' : 'text-[#8C8278]'}`}>
                      {formatEur(res.totalCostMonth)}
                    </td>

                    {/* 15. Margen Bruto (%) */}
                    <td className="px-2.5 py-2.5 text-right font-mono font-semibold">
                      <span
                        className={
                          res.marginTotal !== null && res.marginTotal >= 0.2
                            ? isDark ? 'text-[#47D2BF]' : 'text-emerald-700'
                            : 'text-amber-500'
                        }
                      >
                        {formatPct(res.marginTotal)}
                      </span>
                    </td>

                    {/* 16. Markup */}
                    <td className={`px-2.5 py-2.5 text-right font-mono text-[11px] text-blue-600 dark:text-blue-400 font-semibold`}>
                      {formatMarkup(res.markupTotal)}
                    </td>

                    {/* 17. Beneficio / Mes (€) */}
                    <td className="px-3 py-2.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {formatEur(res.totalProfitMonth)}
                    </td>

                    {/* 18. ARR (12 meses) (€) */}
                    <td className={`px-2.5 py-2.5 text-right font-mono text-xs font-semibold ${
                      isDark ? 'text-purple-300' : 'text-purple-800'
                    }`}>
                      {formatEur(res.arrRevenue)}
                    </td>

                    {/* 19. Fecha Go-Live */}
                    <td className={`px-2.5 py-2.5 text-left font-mono text-[11px] whitespace-nowrap ${
                      isDark ? 'text-gray-300' : 'text-[#6D635B]'
                    }`}>
                      {res.goLiveDate}
                    </td>

                    {/* 20. Canales / Integraciones */}
                    <td className={`px-2.5 py-2.5 text-left text-[11px] max-w-[120px] truncate ${
                      isDark ? 'text-gray-400' : 'text-[#8C8278]'
                    }`} title={(profile.inputs.technologies || []).join(', ')}>
                      {(profile.inputs.technologies || []).join(', ') || '-'}
                    </td>

                    {/* 21. Notas Comerciales */}
                    <td className="px-3 py-2.5 text-left">
                      {isEditingNotesThis ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={tempNotes}
                            onChange={(e) => setTempNotes(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveNotes(profile.id);
                              if (e.key === 'Escape') setEditingNotesId(null);
                            }}
                            autoFocus
                            placeholder="Nota..."
                            className={`border rounded px-1.5 py-0.5 text-[11px] w-28 focus:outline-none ${
                              isDark
                                ? 'bg-[#151226] border-[#47D2BF] text-white'
                                : 'bg-white border-[#6B4ABF] text-[#2D2825]'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => saveNotes(profile.id)}
                            className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => startEditNotes(profile.id, profile.notes || '')}
                          className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer truncate max-w-[130px] flex items-center gap-1"
                          title="Clic para editar nota comercial"
                        >
                          <Tag className="w-2.5 h-2.5 shrink-0 opacity-60" />
                          <span>{profile.notes || '+ Nota'}</span>
                        </div>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-3 py-2.5 text-center sticky right-0 z-10 bg-inherit whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectClient(profile.id)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold cursor-pointer transition ${
                            isActive
                              ? isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'
                              : isDark
                              ? 'bg-[#47D2BF]/20 text-[#47D2BF] hover:bg-[#47D2BF]/30'
                              : 'bg-purple-100 text-[#6B4ABF] hover:bg-purple-200'
                          }`}
                        >
                          <span>{isActive ? 'Activo' : 'Abrir'}</span>
                          {!isActive && <ArrowRight className="w-3 h-3" />}
                        </button>

                        {clients.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`¿Eliminar cliente "${profile.name}"?`)) {
                                onDeleteClient(profile.id);
                              }
                            }}
                            title="Eliminar cliente"
                            className="p-1 text-gray-400 hover:text-red-500 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className={`p-3 border-t flex flex-wrap items-center justify-between text-xs gap-2 ${
          isDark ? 'bg-[#151226] border-[#2E2A48] text-gray-400' : 'bg-[#FAF7F2] border-[#E5DDD0] text-[#6D635B]'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>
              Mostrando <strong>{sortedClients.length}</strong> de <strong>{clients.length}</strong> clientes en la hoja.
            </span>
            <span>·</span>
            <span>Columnas sincronizadas: <strong>21 campos</strong> idénticos al Google Sheet.</span>
          </div>
          <div className="text-[11px] font-mono">
            Suma ARR Cartera:{' '}
            <strong className={isDark ? 'text-purple-300' : 'text-purple-700'}>
              {formatEur(sortedClients.reduce((acc, c) => acc + c.res.arrRevenue, 0))}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
