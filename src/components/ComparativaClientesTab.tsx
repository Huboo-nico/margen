import React from 'react';
import { ClientProfile } from '../types';
import { calculateAll, formatEur, formatPct } from '../utils/calculations';
import { ArrowRight, Plus } from 'lucide-react';

interface ComparativaClientesTabProps {
  clients: ClientProfile[];
  activeClientId: string;
  onSelectClient: (id: string) => void;
  onCreateClient: () => void;
}

export const ComparativaClientesTab: React.FC<ComparativaClientesTabProps> = ({
  clients,
  activeClientId,
  onSelectClient,
  onCreateClient,
}) => {
  const calculatedClients = clients.map((c) => ({
    profile: c,
    res: calculateAll(c.inputs),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Comparativa de Clientes</h2>
          <p className="text-xs text-gray-500">
            Vista global para contrastar márgenes, tarifas de preparación y rentabilidad cliente por cliente.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateClient}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-2xs transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Añadir nuevo cliente</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-3 py-3">Perfil</th>
                <th className="px-3 py-3 text-right">Pedidos / mes</th>
                <th className="px-3 py-3 text-right">Units / order</th>
                <th className="px-3 py-3 text-right bg-red-50/50 text-red-900">
                  Prep. + 1er Pick
                </th>
                <th className="px-3 py-3 text-right">Pick adicional</th>
                <th className="px-3 py-3 text-right">Envío</th>
                <th className="px-3 py-3 text-right">Ingresos / mes</th>
                <th className="px-3 py-3 text-right">Margen Total</th>
                <th className="px-3 py-3 text-right font-bold text-emerald-800">
                  Beneficio / mes
                </th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {calculatedClients.map(({ profile, res }) => {
                const isActive = profile.id === activeClientId;
                return (
                  <tr
                    key={profile.id}
                    className={`transition hover:bg-gray-50 ${
                      isActive ? 'bg-red-50/20 font-medium' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-bold text-gray-900">
                      <div className="flex items-center gap-1.5">
                        <span>{profile.name}</span>
                        {isActive && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-100 text-red-700 font-semibold">
                            Activo
                          </span>
                        )}
                      </div>
                      {profile.notes && (
                        <div className="text-[10px] text-gray-400 font-normal mt-0.5">
                          {profile.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      <div>{profile.inputs.productType}</div>
                      <div className="text-[10px] text-gray-400">{profile.inputs.skuCount} SKUs</div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-gray-900">
                      {res.ordersMonth.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
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
                    <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700">
                      {formatEur(res.totalProfitMonth)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectClient(profile.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition ${
                          isActive
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        <span>{isActive ? 'Editando' : 'Calcular'}</span>
                        {!isActive && <ArrowRight className="w-3 h-3" />}
                      </button>
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
