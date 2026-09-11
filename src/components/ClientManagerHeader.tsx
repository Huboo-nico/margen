import React, { useState, useRef } from 'react';
import { ClientProfile, CalculatorInputs } from '../types';
import { Plus, Copy, Trash2, Check, Download, Users, Edit3, Tag } from 'lucide-react';

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
}) => {
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [showNotesInput, setShowNotesInput] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const activeClient = clients.find((c) => c.id === activeClientId) || clients[0];

  const handleCopyQuote = () => {
    const prepPlus1stPick = (currentInputs.packPriceManual || 1.62) + (currentInputs.firstPickPriceManual || 0.56);
    const shippingPrice = currentInputs.carrierCost / (1 - currentInputs.shippingMarginTarget);

    const text = `COTIZACIÓN FULFILMENT - ${currentInputs.clientName}
Volumen estimado: ${currentInputs.ordersMonth} pedidos/mes (${currentInputs.unitsPerOrder} units/pedido)

1. TARIFAS OPERATIVAS:
- Preparación + 1er Pick: ${prepPlus1stPick.toFixed(2)} € / pedido
  (Pack: ${(currentInputs.packPriceManual || 1.62).toFixed(2)} € | 1er Pick: ${(currentInputs.firstPickPriceManual || 0.56).toFixed(2)} €)
- Pick adicional (desde 2ª unidad): ${(currentInputs.additionalPickPriceManual || 0.39).toFixed(2)} € / unidad
- Envío (Carrier): ${shippingPrice.toFixed(2)} € / envío
- Packaging base: ${currentInputs.packagingPrice.toFixed(2)} € / pedido
- Almacenaje: ${currentInputs.storagePrice.toFixed(2)} € / pallet / semana
- Recepción goods-in: ${currentInputs.goodsInPrice.toFixed(2)} € / pallet`;

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
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left section: Client switcher & DIRECT NAME EDITOR */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Selector */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-500 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-red-600" />
            <span className="hidden sm:inline">Seleccionar:</span>
          </span>
          <select
            value={activeClientId}
            onChange={(e) => onSelectClient(e.target.value)}
            className="border border-gray-300 rounded px-2.5 py-1 text-xs font-bold text-gray-900 bg-gray-50 hover:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 cursor-pointer max-w-[150px] sm:max-w-[180px] truncate"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* INLINE EDITABLE CLIENT NAME */}
        <div className="flex items-center gap-1.5 bg-red-50/50 border border-red-200/90 rounded-md px-2 py-0.5 shadow-2xs">
          <Edit3 className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <span className="text-[11px] font-bold text-red-700 whitespace-nowrap">Nombre cliente:</span>
          <input
            ref={nameInputRef}
            type="text"
            value={currentInputs.clientName || ''}
            onChange={(e) => onRenameClient(e.target.value)}
            placeholder="Escribe el nombre del cliente..."
            className="bg-white border border-red-300 rounded px-2 py-0.5 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none w-36 sm:w-52 md:w-64 transition shadow-inner"
          />
        </div>

        {/* Optional Notes / Tag */}
        <div className="flex items-center gap-1">
          {showNotesInput ? (
            <input
              type="text"
              value={activeClient.notes || ''}
              onChange={(e) => onUpdateNotes && onUpdateNotes(e.target.value)}
              onBlur={() => setShowNotesInput(false)}
              placeholder="Nota (ej: Ecommerce cosmética)..."
              autoFocus
              className="bg-gray-50 border border-gray-300 rounded px-2 py-0.5 text-[11px] text-gray-700 w-44 focus:ring-1 focus:ring-red-500"
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowNotesInput(true)}
              title="Añadir nota o referencia interna al cliente"
              className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800 px-1.5 py-0.5 rounded hover:bg-gray-100 transition cursor-pointer"
            >
              <Tag className="w-3 h-3 text-gray-400" />
              <span className="max-w-[120px] truncate">
                {activeClient.notes ? activeClient.notes : '+ Añadir nota'}
              </span>
            </button>
          )}
        </div>

        {/* Quick actions for client */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCreateAndFocus}
            title="Crear un nuevo cliente y ponerle nombre"
            className="flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo cliente</span>
          </button>

          <button
            type="button"
            onClick={onDuplicateClient}
            title="Duplicar este cliente para probar otra tarifa o propuesta"
            className="flex items-center gap-1 px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded border border-gray-200 transition cursor-pointer"
          >
            <Copy className="w-3 h-3" />
            <span className="hidden sm:inline">Duplicar</span>
          </button>

          {clients.length > 1 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`¿Seguro que deseas eliminar el cliente "${currentInputs.clientName}"?`)) {
                  onDeleteClient(activeClientId);
                }
              }}
              title="Eliminar este cliente"
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right side: Quick stats & export */}
      <div className="flex items-center gap-2.5">
        <span className="text-[11px] text-gray-400 hidden md:inline">
          {clients.length} {clients.length === 1 ? 'cliente guardado' : 'clientes guardados'}
        </span>

        <button
          type="button"
          onClick={handleCopyQuote}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white rounded transition shadow-2xs cursor-pointer"
        >
          {copiedNotification ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span>¡Copiado!</span>
            </>
          ) : (
            <>
              <Download className="w-3 h-3" />
              <span>Copiar cotización</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
