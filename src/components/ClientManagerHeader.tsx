import React, { useState, useRef } from 'react';
import { ClientProfile, CalculatorInputs } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  Plus,
  Copy,
  Trash2,
  Check,
  Download,
  Users,
  Edit3,
  Tag,
  Warehouse,
  Save,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { formatEur } from '../utils/calculations';

interface ClientManagerHeaderProps {
  clients: ClientProfile[];
  activeClientId: string;
  onSelectClient: (id: string) => void;
  onCreateClient: () => void;
  onDuplicateClient: () => void;
  onDeleteClient: (id: string) => void;
  onRenameClient: (name: string) => void;
  onUpdateNotes?: (notes: string) => void;
  currentInputs: CalculatorInputs;
  onQuickSaveToSheets?: () => void;
  onQuickLoadFromSheets?: () => void;
  isSavingToSheets?: boolean;
  isLoadingFromSheets?: boolean;
  saveToSheetsSuccess?: boolean;
}

export const ClientManagerHeader: React.FC<ClientManagerHeaderProps> = ({
  clients,
  activeClientId,
  onSelectClient,
  onCreateClient,
  onDuplicateClient,
  onDeleteClient,
  onRenameClient,
  onUpdateNotes,
  currentInputs,
  onQuickSaveToSheets,
  onQuickLoadFromSheets,
  isSavingToSheets = false,
  isLoadingFromSheets = false,
  saveToSheetsSuccess = false,
}) => {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [showNotesInput, setShowNotesInput] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const activeClient = clients.find((c) => c.id === activeClientId) || clients[0];

  const handleCopyQuote = () => {
    const shippingPrice = currentInputs.carrierCost / (1 - currentInputs.shippingMarginTarget);

    const packPrice = currentInputs.packPriceManual || 1.62;
    const firstPickPrice = currentInputs.firstPickPriceManual || 0.56;
    const addPickPrice = currentInputs.additionalPickPriceManual || 0.39;
    const packagingPriceFormatted = currentInputs.customPackaging
      ? `${formatEur(0)} (${language === 'en' ? 'Client custom packaging' : 'Packaging propio'})`
      : `${formatEur(currentInputs.packagingPrice)} / ${language === 'en' ? 'order' : 'pedido'}`;

    const text = language === 'en'
      ? `FULFILMENT QUOTATION - ${currentInputs.clientName}
${currentInputs.warehouse ? `Warehouse / Origin: ${currentInputs.warehouse}\n` : ''}${currentInputs.technologies && currentInputs.technologies.length > 0 ? `Channels/Tech: ${currentInputs.technologies.join(', ')}\n` : ''}Estimated volume: ${currentInputs.ordersMonth} orders/month (${currentInputs.unitsPerOrder} units/order)

1. OPERATING RATES:
- Base Preparation (Pack): ${formatEur(packPrice)} / order
- 1st Pick of order: ${formatEur(firstPickPrice)} / order
- Additional Pick (from 2nd unit): ${formatEur(addPickPrice)} / unit
- Shipping (Carrier): ${formatEur(shippingPrice)} / shipment
- Base packaging: ${packagingPriceFormatted}
- Storage: ${formatEur(currentInputs.storagePrice)} / pallet / week
- Goods-in intake: ${formatEur(currentInputs.goodsInPrice)} / pallet`
      : `COTIZACIÓN FULFILMENT - ${currentInputs.clientName}
${currentInputs.warehouse ? `Warehouse / Almacén: ${currentInputs.warehouse}\n` : ''}${currentInputs.technologies && currentInputs.technologies.length > 0 ? `Canales/Tecnología: ${currentInputs.technologies.join(', ')}\n` : ''}Volumen estimado: ${currentInputs.ordersMonth} pedidos/mes (${currentInputs.unitsPerOrder} units/pedido)

1. TARIFAS OPERATIVAS:
- Preparación Base (Pack): ${formatEur(packPrice)} / pedido
- 1er Pick de pedido: ${formatEur(firstPickPrice)} / pedido
- Pick adicional (desde 2ª unidad): ${formatEur(addPickPrice)} / unidad
- Envío (Carrier): ${formatEur(shippingPrice)} / envío
- Packaging base: ${packagingPriceFormatted}
- Almacenaje: ${formatEur(currentInputs.storagePrice)} / pallet / semana
- Recepción goods-in: ${formatEur(currentInputs.goodsInPrice)} / pallet`;

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleCreateAndFocus = () => {
    onCreateClient();
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
        nameInputRef.current.select();
      }
    }, 50);
  };

  return (
    <div className={`px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs no-print print:hidden transition-colors duration-200 ${
      isDark
        ? 'bg-[#1A162B] border-b border-[#2E2A48] text-gray-200'
        : 'bg-[#FAF7F2] border-b border-[#E5DDD0] text-[#2D2825]'
    }`}>
      {/* Left section: Client switcher & DIRECT NAME EDITOR */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Selector */}
        <div className="flex items-center gap-1.5">
          <span className={`font-semibold flex items-center gap-1 ${isDark ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`}>
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('client.select')}</span>
          </span>
          <select
            value={activeClientId}
            onChange={(e) => onSelectClient(e.target.value)}
            className={`rounded px-2.5 py-1 text-xs font-bold cursor-pointer max-w-[150px] sm:max-w-[200px] truncate transition ${
              isDark
                ? 'bg-[#120e26] border border-[#2E2A48] text-white focus:ring-2 focus:ring-[#47D2BF]'
                : 'border border-[#E5DDD0] bg-white text-[#2D2825] focus:ring-2 focus:ring-[#6B4ABF]'
            }`}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id} className={isDark ? 'bg-[#1E1B2E] text-white' : 'bg-white text-[#2D2825]'}>
                {c.name} {c.inputs.warehouse ? `· ${c.inputs.warehouse}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* INLINE EDITABLE CLIENT NAME */}
        <div className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 shadow-2xs ${
          isDark
            ? 'bg-[#25203D] border border-[#47D2BF]/40'
            : 'bg-[#F4EEE4] border border-[#D5C9B8]'
        }`}>
          <Edit3 className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`} />
          <span className={`text-[11px] font-bold whitespace-nowrap ${isDark ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`}>
            {t('client.name')}
          </span>
          <input
            ref={nameInputRef}
            type="text"
            value={currentInputs.clientName || ''}
            onChange={(e) => onRenameClient(e.target.value)}
            placeholder={t('client.placeholderName')}
            className={`rounded px-2 py-0.5 text-xs font-bold focus:outline-none w-36 sm:w-52 md:w-64 transition shadow-inner ${
              isDark
                ? 'bg-[#120e26] border border-[#2E2A48] text-white focus:ring-2 focus:ring-[#47D2BF]'
                : 'bg-white border border-[#D5C9B8] text-[#2D2825] focus:ring-2 focus:ring-[#6B4ABF]'
            }`}
          />
        </div>

        {/* Origin Warehouse badge */}
        <div className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
          isDark
            ? 'bg-[#151226] text-[#47D2BF] border-[#2E2A48]'
            : 'bg-[#FAF7F2] text-[#6B4ABF] border-[#D5C9B8]'
        }`} title={language === 'en' ? 'Territory / Fulfillment Warehouse' : 'Territorio / Almacén de salida'}>
          <Warehouse className="w-3.5 h-3.5" />
          <span>{currentInputs.warehouse || 'Spain'}</span>
        </div>

        {/* Selected Technologies quick badges */}
        {currentInputs.technologies && currentInputs.technologies.length > 0 && (
          <div className="hidden md:flex items-center gap-1">
            {currentInputs.technologies.slice(0, 3).map((tech) => (
              <span
                key={tech}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  isDark
                    ? 'bg-[#252238] text-gray-200 border border-[#2E2A48]'
                    : 'bg-[#F4EEE4] text-[#4D453E] border border-[#E5DDD0]'
                }`}
              >
                {tech}
              </span>
            ))}
            {currentInputs.technologies.length > 3 && (
              <span className={`text-[10px] font-semibold px-1 py-0.5 rounded ${
                isDark ? 'text-gray-400 bg-[#252238] border border-[#2E2A48]' : 'text-[#7D736A] bg-[#F4EEE4] border border-[#E5DDD0]'
              }`}>
                +{currentInputs.technologies.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Optional Notes / Tag */}
        <div className="flex items-center gap-1">
          {showNotesInput ? (
            <input
              type="text"
              value={activeClient.notes || ''}
              onChange={(e) => onUpdateNotes && onUpdateNotes(e.target.value)}
              onBlur={() => setShowNotesInput(false)}
              placeholder={t('client.placeholderNote')}
              autoFocus
              className={`rounded px-2 py-0.5 text-[11px] w-44 focus:ring-1 ${
                isDark
                  ? 'bg-[#120e26] border border-[#2E2A48] text-white focus:ring-[#47D2BF]'
                  : 'bg-white border border-[#E5DDD0] text-[#2D2825] focus:ring-[#6B4ABF]'
              }`}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowNotesInput(true)}
              title={language === 'en' ? 'Add note or internal reference to client' : 'Añadir nota o referencia interna al cliente'}
              className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded transition cursor-pointer ${
                isDark
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-[#252238]'
                  : 'text-[#6D635B] hover:text-[#2D2825] hover:bg-[#F4EEE4]'
              }`}
            >
              <Tag className="w-3 h-3 text-gray-400" />
              <span className="max-w-[120px] truncate">
                {activeClient.notes ? activeClient.notes : t('client.addNote')}
              </span>
            </button>
          )}
        </div>

        {/* Quick actions for client */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCreateAndFocus}
            title={language === 'en' ? 'Create a new client' : 'Crear un nuevo cliente y ponerle nombre'}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#6B4ABF] hover:bg-[#583aa3] text-white font-semibold rounded shadow-2xs border border-[#47D2BF]/30 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#47D2BF]" />
            <span>{t('client.new')}</span>
          </button>

          <button
            type="button"
            onClick={onDuplicateClient}
            title={language === 'en' ? 'Duplicate this client to test another tariff or proposal' : 'Duplicar este cliente para probar otra tarifa o propuesta'}
            className={`flex items-center gap-1 px-2 py-1 font-medium rounded border transition cursor-pointer ${
              isDark
                ? 'bg-[#252238] hover:bg-[#2e2a44] text-gray-200 border-[#2E2A48]'
                : 'bg-white hover:bg-[#F4EEE4] text-[#4D453E] border-[#E5DDD0]'
            }`}
          >
            <Copy className="w-3 h-3" />
            <span className="hidden sm:inline">{t('client.duplicate')}</span>
          </button>

          {clients.length > 1 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(language === 'en' ? `Are you sure you want to delete client "${currentInputs.clientName}"?` : `¿Seguro que deseas eliminar el cliente "${currentInputs.clientName}"?`)) {
                  onDeleteClient(activeClientId);
                }
              }}
              title={t('client.delete')}
              className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right side: Quick stats & export */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gray-400 hidden lg:inline">
          {clients.length} {language === 'en' ? (clients.length === 1 ? 'saved client' : 'saved clients') : (clients.length === 1 ? 'cliente' : 'clientes')}
        </span>

        {/* Botón: Guardar / Actualizar cliente que se está cotizando en Google Sheets */}
        {onQuickSaveToSheets && (
          <button
            type="button"
            onClick={onQuickSaveToSheets}
            disabled={isSavingToSheets}
            title={
              language === 'en'
                ? `Save or update "${currentInputs.clientName}" in Google Sheet "Margen"`
                : `Guardar o actualizar "${currentInputs.clientName}" en la hoja Google Sheet "Margen"`
            }
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition shadow-2xs border cursor-pointer ${
              saveToSheetsSuccess
                ? 'bg-emerald-500 text-white border-emerald-400'
                : isDark
                ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-700/60'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
            }`}
          >
            {isSavingToSheets ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{language === 'en' ? 'Saving...' : 'Guardando...'}</span>
              </>
            ) : saveToSheetsSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Saved to Sheet!' : '¡Guardado en Sheet!'}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Save to Sheet' : 'Guardar en Sheet'}</span>
              </>
            )}
          </button>
        )}

        {/* Botón: Cargar clientes desde Google Sheet */}
        {onQuickLoadFromSheets && (
          <button
            type="button"
            onClick={onQuickLoadFromSheets}
            disabled={isLoadingFromSheets}
            title={
              language === 'en'
                ? 'Fetch and load saved clients from Google Sheet'
                : 'Descargar y cargar los clientes guardados en Google Sheet'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition shadow-2xs border cursor-pointer ${
              isDark
                ? 'bg-[#252238] hover:bg-[#2e2a44] text-purple-300 border-purple-500/30'
                : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-200'
            }`}
          >
            <Download className={`w-3.5 h-3.5 text-purple-500 ${isLoadingFromSheets ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">
              {isLoadingFromSheets
                ? language === 'en'
                  ? 'Loading...'
                  : 'Cargando...'
                : language === 'en'
                ? 'Load Sheet'
                : 'Cargar Sheet'}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={handleCopyQuote}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded transition shadow-2xs cursor-pointer ${
            isDark
              ? 'bg-[#252238] hover:bg-[#2e2a44] text-white border border-[#47D2BF]/40'
              : 'bg-[#2D2825] hover:bg-[#1E1B2E] text-white'
          }`}
        >
          {copiedNotification ? (
            <>
              <Check className="w-3 h-3 text-[#47D2BF]" />
              <span>{t('client.copied')}</span>
            </>
          ) : (
            <>
              <Download className="w-3 h-3" />
              <span>{t('client.copyQuote')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

