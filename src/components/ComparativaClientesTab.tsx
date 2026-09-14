import React, { useState } from 'react';
import { ClientProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { calculateAll, formatEur, formatPct, formatMarkup } from '../utils/calculations';
import { ArrowRight, Plus, Edit2, Check, Trash2, Tag } from 'lucide-react';

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

  const calculatedClients = clients.map((c) => ({
    profile: c,
    res: calculateAll(c.inputs),
  }));

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
              ? 'Click on any client’s name or notes to edit directly.'
              : 'Puedes hacer clic en el nombre o notas de cualquier cliente para editarlo directamente.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateClient}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-2xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'Add new client' : 'Añadir nuevo cliente'}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase">
              <tr>
                <th className="px-4 py-3 min-w-[200px]">
                  {language === 'en' ? 'Client (Click to edit)' : 'Cliente (Nombre editable)'}
                </th>
                <th className="px-3 py-3">{language === 'en' ? 'Profile' : 'Perfil'}</th>
                <th className="px-3 py-3 text-right">{language === 'en' ? 'Orders / mo' : 'Pedidos / mes'}</th>
                <th className="px-3 py-3 text-right">{language === 'en' ? 'Units / order' : 'Units / order'}</th>
                <th className="px-3 py-3 text-right bg-red-50/50 text-red-900">
                  {language === 'en' ? 'Prep. + 1st Pick' : 'Prep. + 1er Pick'}
                </th>
                <th className="px-3 py-3 text-right">{language === 'en' ? 'Add. Pick' : 'Pick adicional'}</th>
                <th className="px-3 py-3 text-right">{language === 'en' ? 'Shipping' : 'Envío'}</th>
                <th className="px-3 py-3 text-right">{language === 'en' ? 'Revenue / mo' : 'Ingresos / mes'}</th>
                <th className="px-3 py-3 text-right">{language === 'en' ? 'Margin' : 'Margen'}</th>
                <th className="px-3 py-3 text-right text-blue-700">Markup</th>
                <th className="px-3 py-3 text-right font-bold text-emerald-800">
                  {language === 'en' ? 'Profit / mo' : 'Beneficio / mes'}
                </th>
                <th className="px-3 py-3 text-left">{language === 'en' ? 'Go-Live Target' : 'Fecha Go-Live'}</th>
                <th className="px-3 py-3 text-right">{language === 'en' ? 'ARR (12m)' : 'ARR (12m)'}</th>
                <th className="px-3 py-3 text-right text-red-700">{language === 'en' ? 'YRR' : 'YRR'}</th>
                <th className="px-4 py-3 text-center">{language === 'en' ? 'Actions' : 'Acciones'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {calculatedClients.map(({ profile, res }) => {
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
