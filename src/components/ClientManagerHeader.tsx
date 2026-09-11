import React, { useState } from 'react';
import { ClientProfile, CalculatorInputs } from '../types';
import { Plus, Copy, Trash2, Check, Download, Users } from 'lucide-react';

interface ClientManagerHeaderProps {
  clients: ClientProfile[];
  activeClientId: string;
  onSelectClient: (id: string) => void;
  onCreateClient: () => void;
  onDuplicateClient: () => void;
  onDeleteClient: (id: string) => void;
  onRenameClient?: (name: string) => void;
  currentInputs: CalculatorInputs;
}

export const ClientManagerHeader: React.FC<ClientManagerHeaderProps> = ({
  clients,
  activeClientId,
  onSelectClient,
  onCreateClient,
  onDuplicateClient,
  onDeleteClient,
  currentInputs,
}) => {
  const [copiedNotification, setCopiedNotification] = useState(false);

  const handleCopyQuote = () => {
    const text = `COTIZACIÓN FULFILMENT - ${currentInputs.clientName}
Volumen estimado: ${currentInputs.ordersMonth} pedidos/mes (${currentInputs.unitsPerOrder} units/pedido)

1. TARIFAS OPERATIVAS:
- Preparación + 1er Pick: ${((currentInputs.packPriceManual || 1.62) + (currentInputs.firstPickPriceManual || 0.56)).toFixed(2)} € / pedido
  (Pack: ${(currentInputs.packPriceManual || 1.62).toFixed(2)} € | 1er Pick: ${(currentInputs.firstPickPriceManual || 0.56).toFixed(2)} €)
- Pick adicional (desde 2ª unidad): ${(currentInputs.additionalPickPriceManual || 0.39).toFixed(2)} € / unidad
- Envío (Carrier): ${(currentInputs.carrierCost / (1 - currentInputs.shippingMarginTarget)).toFixed(2)} € / envío
- Packaging base: ${currentInputs.packagingPrice.toFixed(2)} € / pedido
- Almacenaje: ${currentInputs.storagePrice.toFixed(2)} € / pallet / semana
- Recepción goods-in: ${currentInputs.goodsInPrice.toFixed(2)} € / pallet`;

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left: Client selector & switcher */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-gray-500 flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-red-600" />
          <span>Cliente activo:</span>
        </span>

        <select
          value={activeClientId}
          onChange={(e) => onSelectClient(e.target.value)}
          className="border border-gray-300 rounded px-2.5 py-1 text-xs font-bold text-gray-900 bg-gray-50 hover:bg-white focus:ring-1 focus:ring-red-500 cursor-pointer"
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Quick actions for client */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onCreateClient}
            title="Calcular nuevo cliente"
            className="flex items-center gap-1 px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded border border-red-200 transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Nuevo cliente</span>
          </button>

          <button
            type="button"
            onClick={onDuplicateClient}
            title="Duplicar cliente para otro escenario u oferta"
            className="flex items-center gap-1 px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded border border-gray-200 transition cursor-pointer"
          >
            <Copy className="w-3 h-3" />
            <span>Duplicar</span>
          </button>

          {clients.length > 1 && (
            <button
              type="button"
              onClick={() => onDeleteClient(activeClientId)}
              title="Eliminar este cliente"
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Quick actions (copy proposal, count) */}
      <div className="flex items-center gap-2.5">
        <span className="text-[11px] text-gray-400">
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
              <span>¡Copiado al portapapeles!</span>
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
