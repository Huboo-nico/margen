import React, { useState } from 'react';
import { ClientProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { calculateAll, formatEur, formatPct, formatMarkup } from '../utils/calculations';
import { ArrowRight, Plus, Edit2, Check, Trash2, Tag, Warehouse, ArrowUpDown, Download } from 'lucide-react';

interface ComparativaClientesTabProps {
  clients: ClientProfile[];
  activeClientId: string;
  onSelectClient: (id: string) => void;
  onCreateClient: () => void;
  onRenameClient: (id: string, newName: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onDeleteClient: (id: string) => void;
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

export const ComparativaClientesTab: React.FC<ComparativaClientesTabProps> = ({
  clients,
  activeClientId,
  onSelectClient,
  onCreateClient,
  onRenameClient,
  onUpdateNotes,
  onDeleteClient,
}) => {
  const { language } = useLanguage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState<string>('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'warehouse' | 'orders' | 'revenue' | 'profit'>('name');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const calculatedClients = clients.map((c) => ({
    profile: c,
    res: calculateAll(c.inputs),
  }));

  const sortedClients = [...calculatedClients].sort((a, b) => {
    let comp = 0;
    if (sortBy === 'name') {
      comp = a.profile.name.localeCompare(b.profile.name);
    } else if (sortBy === 'warehouse') {
      const wA = a.profile.inputs.warehouse || 'Spain';
      const wB = b.profile.inputs.warehouse || 'Spain';
      comp = wA.localeCompare(wB) || a.profile.name.localeCompare(b.profile.name);
    } else if (sortBy === 'orders') {
      comp = a.res.ordersMonth - b.res.ordersMonth;
    } else if (sortBy === 'revenue') {
      comp = a.res.totalRevenueMonth - b.res.totalRevenueMonth;
    } else if (sortBy === 'profit') {
      comp = a.res.totalProfitMonth - b.res.totalProfitMonth;
    }
    return sortAsc ? comp : -comp;
  });

  const handleSort = (field: 'name' | 'warehouse' | 'orders' | 'revenue' | 'profit') => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
  };

  const exportToCsv = () => {
    const headers = [
      'ID',
      'Cliente',
      'Warehouse',
      'Perfil',
      'SKUs',
      'Pedidos/mes',
      'Picks x envio standard',
      'Tarifa Pack (EUR)',
      '1er Pick (EUR)',
      'Pick Adicional (EUR)',
      'Envio (EUR)',
      'Ingresos/mes (EUR)',
      'Margen (%)',
      'Beneficio/mes (EUR)',
      'Fecha Go-Live',
      'Canales',
      'Notas',
    ];
    const rows = sortedClients.map(({ profile, res }) => [
      `"${profile.id}"`,
      `"${profile.name.replace(/"/g, '""')}"`,
      `"${(profile.inputs.warehouse || 'Spain').replace(/"/g, '""')}"`,
      `"${profile.inputs.productType}"`,
      profile.inputs.skuCount,
      res.ordersMonth,
      res.unitsPerOrder,
      res.packPrice.toFixed(2),
      res.firstPickPrice.toFixed(2),
      res.additionalPickPrice.toFixed(2),
      res.shippingPrice.toFixed(2),
      res.totalRevenueMonth.toFixed(2),
      res.marginTotal !== null ? (res.marginTotal * 100).toFixed(1) : '0.0',
      res.totalProfitMonth.toFixed(2),
      `"${res.goLiveDate}"`,
      `"${(profile.inputs.technologies || []).join(', ')}"`,
      `"${(profile.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `huboo_clientes_${new Date().toISOString().slice(0, 10)}.csv`);
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {language === 'en' ? 'Client Comparison' : 'Comparativa de Clientes'}
          </h2>
          <p className="text-xs text-gray-500">
            {language === 'en'
              ? 'Click on any client’s name or notes to edit directly. Order by Name or Warehouse.'
              : 'Haz clic en el nombre o notas para editar. Ordena por Nombre o Warehouse.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Export to CSV */}
          <button
            type="button"
            onClick={exportToCsv}
            title={language === 'en' ? 'Download CSV for Google Sheets' : 'Descargar CSV para importar en Google Sheets'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'en' ? 'Export CSV' : 'Exportar CSV'}</span>
          </button>

          <button
            type="button"
            onClick={onCreateClient}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Add new client' : 'Añadir nuevo cliente'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Card View (visible on screens smaller than md) */}
      <div className="block md:hidden space-y-3">
        {sortedClients.map(({ profile, res }) => {
          const isActive = profile.id === activeClientId;
          const productLabel =
            productTypeLabels[profile.inputs.productType]?.[language] ||
            profile.inputs.productType;

          return (
            <div
              key={profile.id}
              className={`p-4 rounded-xl border transition ${
                isActive
                  ? 'bg-red-50/40 border-red-300 shadow-xs'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-gray-900">{profile.name}</h3>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-700 font-bold">
                        {language === 'en' ? 'Active' : 'Activo'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-medium text-[#6B4ABF]">
                      <Warehouse className="w-3 h-3" />
                      {profile.inputs.warehouse || 'Spain'}
                    </span>
                    <span>•</span>
                    <span>{productLabel}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectClient(profile.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  <span>{isActive ? (language === 'en' ? 'Active' : 'Editando') : (language === 'en' ? 'Select' : 'Abrir')}</span>
                  {!isActive && <ArrowRight className="w-3 h-3" />}
                </button>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50 rounded-lg text-xs mb-3">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block font-semibold">
                    {language === 'en' ? 'Orders' : 'Pedidos'}
                  </span>
                  <span className="font-bold text-gray-900">
                    {res.ordersMonth.toLocaleString(language === 'en' ? 'en-US' : 'es-ES', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block font-semibold">
                    {language === 'en' ? 'Revenue' : 'Facturación'}
                  </span>
                  <span className="font-bold text-gray-900">{formatEur(res.totalRevenueMonth)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block font-semibold">
                    {language === 'en' ? 'Profit' : 'Beneficio'}
                  </span>
                  <span className="font-bold text-emerald-700 font-mono">{formatEur(res.totalProfitMonth)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
                <div className="flex items-center gap-3">
                  <span>
                    Margen:{' '}
                    <strong className={res.marginTotal !== null && res.marginTotal >= 0.2 ? 'text-gray-900' : 'text-amber-600'}>
                      {formatPct(res.marginTotal)}
                    </strong>
                  </span>
                  <span>
                    Markup: <strong className="text-blue-700">{formatMarkup(res.markupTotal)}</strong>
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
                    className="p-1 text-gray-400 hover:text-red-600 transition cursor-pointer"
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

      {/* Desktop Spreadsheet Table View (visible on md+) */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-4 py-3 min-w-[200px] cursor-pointer hover:bg-gray-100 transition"
                  title="Ordenar por nombre"
                >
                  <div className="flex items-center gap-1">
                    <span>{language === 'en' ? 'Client (Click to edit)' : 'Cliente (Nombre editable)'}</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'name' ? 'text-red-600' : 'text-gray-400'}`} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('warehouse')}
                  className="px-3 py-3 cursor-pointer hover:bg-gray-100 transition"
                  title="Ordenar por Warehouse"
                >
                  <div className="flex items-center gap-1">
                    <Warehouse className="w-3.5 h-3.5 text-[#6B4ABF]" />
                    <span>{language === 'en' ? 'Territory' : 'Territorio'}</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'warehouse' ? 'text-[#6B4ABF]' : 'text-gray-400'}`} />
                  </div>
                </th>
                <th className="px-3 py-3">{language === 'en' ? 'Profile' : 'Perfil'}</th>
                <th
                  onClick={() => handleSort('orders')}
                  className="px-3 py-3 text-right cursor-pointer hover:bg-gray-100 transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{language === 'en' ? 'Orders / mo' : 'Pedidos / mes'}</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'orders' ? 'text-red-600' : 'text-gray-400'}`} />
                  </div>
                </th>
                <th className="px-3 py-3 text-right">{language === 'en' ? 'Units / order' : 'Units / order'}</th>
                <th className="px-3 py-3 text-right bg-red-50/50 text-red-900">
                  {language === 'en' ? 'Prep. + 1st Pick' : 'Prep. + 1er Pick'}
                </th>
                <th className="px-3 py-3 text-right">{language === 'en' ? 'Add. Pick' : 'Pick adicional'}</th>
                <th className="px-3 py-3 text-right">{language === 'en' ? 'Shipping' : 'Envío'}</th>
                <th
                  onClick={() => handleSort('revenue')}
                  className="px-3 py-3 text-right cursor-pointer hover:bg-gray-100 transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{language === 'en' ? 'Revenue / mo' : 'Ingresos / mes'}</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'revenue' ? 'text-red-600' : 'text-gray-400'}`} />
                  </div>
                </th>
                <th className="px-3 py-3 text-right">{language === 'en' ? 'Margin' : 'Margen'}</th>
                <th className="px-3 py-3 text-right text-blue-700">Markup</th>
                <th
                  onClick={() => handleSort('profit')}
                  className="px-3 py-3 text-right font-bold text-emerald-800 cursor-pointer hover:bg-gray-100 transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{language === 'en' ? 'Profit / mo' : 'Beneficio / mes'}</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'profit' ? 'text-emerald-700' : 'text-gray-400'}`} />
                  </div>
                </th>
                <th className="px-3 py-3 text-left">{language === 'en' ? 'Go-Live Target' : 'Fecha Go-Live'}</th>
                <th className="px-3 py-3 text-right">{language === 'en' ? 'ARR (12m)' : 'ARR (12m)'}</th>
                <th className="px-3 py-3 text-right text-red-700">{language === 'en' ? 'YRR' : 'YRR'}</th>
                <th className="px-4 py-3 text-center">{language === 'en' ? 'Actions' : 'Acciones'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedClients.map(({ profile, res }) => {
                const isActive = profile.id === activeClientId;
                const isEditingThis = editingId === profile.id;
                const isEditingNotesThis = editingNotesId === profile.id;
                const productLabel =
                  productTypeLabels[profile.inputs.productType]?.[language] ||
                  profile.inputs.productType;

                return (
                  <tr
                    key={profile.id}
                    className={`transition hover:bg-gray-50/80 ${
                      isActive ? 'bg-red-50/20 font-medium' : ''
                    }`}
                  >
                    {/* Editable Client Name & Notes */}
                    <td className="px-4 py-3 font-bold text-gray-900">
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
                            className="border border-red-400 rounded px-2 py-0.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 w-full"
                          />
                          <button
                            type="button"
                            onClick={() => saveName(profile.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group">
                          <span
                            onClick={() => startEditName(profile.id, profile.name)}
                            className="cursor-pointer hover:text-red-600 hover:underline"
                            title={language === 'en' ? 'Click to edit name' : 'Haz clic para editar el nombre'}
                          >
                            {profile.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => startEditName(profile.id, profile.name)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-600 transition cursor-pointer"
                            title={language === 'en' ? 'Edit name' : 'Editar nombre'}
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {isActive && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-100 text-red-700 font-semibold shrink-0">
                              {language === 'en' ? 'Active' : 'Activo'}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Notes subrow */}
                      {isEditingNotesThis ? (
                        <div className="flex items-center gap-1 mt-1">
                          <input
                            type="text"
                            value={tempNotes}
                            onChange={(e) => setTempNotes(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveNotes(profile.id);
                              if (e.key === 'Escape') setEditingNotesId(null);
                            }}
                            autoFocus
                            placeholder={language === 'en' ? 'Note / tag...' : 'Nota / etiqueta...'}
                            className="border border-gray-300 rounded px-1.5 py-0.2 text-[10px] text-gray-700 w-full"
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
                          className="text-[10px] text-gray-400 font-normal mt-0.5 cursor-pointer hover:text-gray-600 flex items-center gap-1"
                          title={language === 'en' ? 'Click to edit note' : 'Haz clic para editar nota'}
                        >
                          <Tag className="w-2.5 h-2.5 text-gray-300" />
                          <span>{profile.notes || (language === 'en' ? '+ Add note' : '+ Añadir nota')}</span>
                        </div>
                      )}
                    </td>

                    {/* Warehouse Hub */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#6B4ABF] border border-[#D5C9B8]">
                        <Warehouse className="w-3 h-3" />
                        {profile.inputs.warehouse || 'Spain'}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-gray-600">
                      <div>{productLabel}</div>
                      <div className="text-[10px] text-gray-400">{profile.inputs.skuCount} SKUs</div>
                    </td>

                    <td className="px-3 py-3 text-right font-mono text-gray-900">
                      {res.ordersMonth.toLocaleString(language === 'en' ? 'en-US' : 'es-ES', { maximumFractionDigits: 0 })}
                    </td>

                    <td className="px-3 py-3 text-right font-mono text-gray-700">
                      {res.unitsPerOrder.toFixed(1)}
                    </td>

                    <td className="px-3 py-3 text-right font-mono font-bold text-red-700 bg-red-50/30">
                      {formatEur(res.prepPlusFirstPickPrice)}
                    </td>

                    <td className="px-3 py-3 text-right font-mono text-gray-800">
                      {formatEur(res.additionalPickPrice)}
                    </td>

                    <td className="px-3 py-3 text-right font-mono text-blue-700">
                      {formatEur(res.shippingPrice)}
                    </td>

                    <td className="px-3 py-3 text-right font-mono text-gray-900">
                      {formatEur(res.totalRevenueMonth)}
                    </td>

                    <td className="px-3 py-3 text-right font-mono">
                      <span
                        className={`font-semibold ${
                          res.marginTotal !== null && res.marginTotal >= 0.2
                            ? 'text-gray-900'
                            : 'text-amber-600'
                        }`}
                      >
                        {formatPct(res.marginTotal)}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-right font-mono font-semibold text-blue-700">
                      {formatMarkup(res.markupTotal)}
                    </td>

                    <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700">
                      {formatEur(res.totalProfitMonth)}
                    </td>

                    <td className="px-3 py-3 text-left font-mono text-[11px] text-gray-700">
                      <div className="font-semibold">{res.goLiveDate}</div>
                      <div className="text-[9.5px] text-gray-400">
                        {res.goLiveDaysRemaining >= 0 ? `En ${res.goLiveDaysRemaining}d` : `-${Math.abs(res.goLiveDaysRemaining)}d`}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right font-mono font-bold text-gray-900">
                      <div>{formatEur(res.arrRevenue)}</div>
                      <div className="text-[9.5px] text-emerald-600 font-normal">+{formatEur(res.arrProfit)}</div>
                    </td>

                    <td className="px-3 py-3 text-right font-mono font-bold text-red-700 bg-red-50/30">
                      <div>{formatEur(res.yrrRevenue)}</div>
                      <div className="text-[9.5px] text-red-500 font-normal">{res.goLiveMonthsRemainingInYear.toFixed(1)}m in {res.goLiveYear}</div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectClient(profile.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition ${
                            isActive
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          <span>
                            {isActive
                              ? (language === 'en' ? 'Active' : 'Editando')
                              : (language === 'en' ? 'Calculate' : 'Calcular')}
                          </span>
                          {!isActive && <ArrowRight className="w-3 h-3" />}
                        </button>

                        {clients.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const confirmMsg =
                                language === 'en'
                                  ? `Delete client "${profile.name}"?`
                                  : `¿Eliminar cliente "${profile.name}"?`;
                              if (window.confirm(confirmMsg)) {
                                onDeleteClient(profile.id);
                              }
                            }}
                            title={language === 'en' ? 'Delete client' : 'Eliminar cliente'}
                            className="p-1 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
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
      </div>
    </div>
  );
};
