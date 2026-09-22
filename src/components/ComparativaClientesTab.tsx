import React, { useState, useMemo } from 'react';
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
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  DollarSign,
  AlertTriangle,
  Award,
  ShieldCheck,
  Target,
  Sparkles,
  Scale,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

const STRATEGIC_PALETTE = [
  '#6B4ABF', // Huboo Purple
  '#47D2BF', // Teal
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
];

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

  // Estados para el Panel Estratégico y Toma de Decisiones
  const [showAnalytics, setShowAnalytics] = useState<boolean>(true);
  const [analyticsTab, setAnalyticsTab] = useState<'arr_performance' | 'decision_matrix' | 'concentration'>('arr_performance');
  const [chartMetric, setChartMetric] = useState<'arr' | 'monthly'>('arr');
  const [donutGroupBy, setDonutGroupBy] = useState<'clients' | 'warehouses' | 'sectors'>('clients');

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

  // Métricas estratégicas agregadas para la dirección comercial y operativa (Decisiones de Cartera)
  const portfolioMetrics = useMemo(() => {
    const totalClientsCount = calculatedClients.length;
    const totalArr = calculatedClients.reduce((acc, c) => acc + c.res.arrRevenue, 0);
    const totalMrr = calculatedClients.reduce((acc, c) => acc + c.res.totalRevenueMonth, 0);
    const totalCostMonth = calculatedClients.reduce((acc, c) => acc + c.res.totalCostMonth, 0);
    const totalProfitMonth = calculatedClients.reduce((acc, c) => acc + c.res.totalProfitMonth, 0);
    const totalAnnualProfit = totalProfitMonth * 12;
    const blendedMargin = totalMrr > 0 ? totalProfitMonth / totalMrr : 0;
    const totalOrders = calculatedClients.reduce((acc, c) => acc + c.res.ordersMonth, 0);
    const totalUnits = calculatedClients.reduce((acc, c) => acc + (c.res.ordersMonth * c.res.unitsPerOrder), 0);
    const avgUnitsPerOrder = totalOrders > 0 ? totalUnits / totalOrders : 1;
    const avgRevenuePerOrder = totalOrders > 0 ? totalMrr / totalOrders : 0;
    const avgProfitPerOrder = totalOrders > 0 ? totalProfitMonth / totalOrders : 0;

    // Cuotas fijas de plataforma / SaaS
    const totalSubscriptionsMonth = calculatedClients.reduce((acc, c) => acc + c.subscriptionPrice, 0);
    const totalSubscriptionsArr = totalSubscriptionsMonth * 12;
    const subscriptionShareArr = totalArr > 0 ? (totalSubscriptionsArr / totalArr) * 100 : 0;

    // Rankings y clientes clave para decisiones
    const sortedByArr = [...calculatedClients].sort((a, b) => b.res.arrRevenue - a.res.arrRevenue);
    const topArrClient = sortedByArr[0];
    const sortedByMargin = [...calculatedClients].sort((a, b) => (b.res.marginTotal ?? 0) - (a.res.marginTotal ?? 0));
    const topMarginClient = sortedByMargin[0];
    const topVolumeClient = [...calculatedClients].sort((a, b) => b.res.ordersMonth - a.res.ordersMonth)[0];

    // Clientes con margen ajustado (<20%) o en riesgo
    const atRiskClients = calculatedClients.filter(c => (c.res.marginTotal ?? 0) < 0.20 || c.res.totalProfitMonth < 0);

    // Concentración de ingresos (Índice Pareto)
    const top1Share = (totalArr > 0 && topArrClient) ? (topArrClient.res.arrRevenue / totalArr) * 100 : 0;
    const top2Share = (totalArr > 0 && sortedByArr.length >= 2)
      ? ((sortedByArr[0].res.arrRevenue + sortedByArr[1].res.arrRevenue) / totalArr) * 100
      : top1Share;

    // Desglose por Almacén / Territorio
    const warehouseMap: Record<string, { name: string; count: number; arr: number; orders: number; profit: number }> = {};
    calculatedClients.forEach(c => {
      const wh = c.profile.inputs.warehouse || 'Spain';
      if (!warehouseMap[wh]) {
        warehouseMap[wh] = { name: wh, count: 0, arr: 0, orders: 0, profit: 0 };
      }
      warehouseMap[wh].count += 1;
      warehouseMap[wh].arr += c.res.arrRevenue;
      warehouseMap[wh].orders += c.res.ordersMonth;
      warehouseMap[wh].profit += c.res.totalProfitMonth;
    });
    const warehouseData = Object.values(warehouseMap);

    // Desglose por Sector
    const sectorMap: Record<string, { name: string; count: number; arr: number; orders: number; profit: number }> = {};
    calculatedClients.forEach(c => {
      const sec = c.profile.inputs.productType || 'General / Estándar';
      if (!sectorMap[sec]) {
        sectorMap[sec] = { name: sec, count: 0, arr: 0, orders: 0, profit: 0 };
      }
      sectorMap[sec].count += 1;
      sectorMap[sec].arr += c.res.arrRevenue;
      sectorMap[sec].orders += c.res.ordersMonth;
      sectorMap[sec].profit += c.res.totalProfitMonth;
    });
    const sectorData = Object.values(sectorMap);

    // Datos para gráfico de barras comparativo
    const clientChartData = sortedByArr.map(c => ({
      name: c.profile.name.length > 15 ? c.profile.name.slice(0, 14) + '…' : c.profile.name,
      fullName: c.profile.name,
      arr: Math.round(c.res.arrRevenue),
      annualProfit: Math.round(c.res.totalProfitMonth * 12),
      monthlyRevenue: Math.round(c.res.totalRevenueMonth),
      monthlyProfit: Math.round(c.res.totalProfitMonth),
      margin: Math.round(((c.res.marginTotal ?? 0) * 100) * 10) / 10,
      orders: c.res.ordersMonth,
      warehouse: c.profile.inputs.warehouse || 'Spain',
      isActive: c.profile.id === activeClientId,
    }));

    // Datos para gráfico circular / donut según el agrupador seleccionado
    let donutData: { name: string; value: number; pct: number }[] = [];
    if (donutGroupBy === 'clients') {
      donutData = sortedByArr.map(c => ({
        name: c.profile.name,
        value: Math.round(c.res.arrRevenue),
        pct: totalArr > 0 ? (c.res.arrRevenue / totalArr) * 100 : 0,
      }));
    } else if (donutGroupBy === 'warehouses') {
      donutData = warehouseData.map(w => ({
        name: w.name,
        value: Math.round(w.arr),
        pct: totalArr > 0 ? (w.arr / totalArr) * 100 : 0,
      }));
    } else {
      donutData = sectorData.map(s => ({
        name: s.name,
        value: Math.round(s.arr),
        pct: totalArr > 0 ? (s.arr / totalArr) * 100 : 0,
      }));
    }

    // Matriz de 4 cuadrantes (Umbral: volumen promedio y margen objetivo del 22%)
    const avgOrders = totalClientsCount > 0 ? Math.round(totalOrders / totalClientsCount) : 300;
    const marginThreshold = 0.22;

    const quadrantMatrix = {
      stars: calculatedClients.filter(c => c.res.ordersMonth >= avgOrders && (c.res.marginTotal ?? 0) >= marginThreshold),
      optimize: calculatedClients.filter(c => c.res.ordersMonth >= avgOrders && (c.res.marginTotal ?? 0) < marginThreshold),
      scale: calculatedClients.filter(c => c.res.ordersMonth < avgOrders && (c.res.marginTotal ?? 0) >= marginThreshold),
      review: calculatedClients.filter(c => c.res.ordersMonth < avgOrders && (c.res.marginTotal ?? 0) < marginThreshold),
    };

    return {
      totalClientsCount,
      totalArr,
      totalMrr,
      totalCostMonth,
      totalProfitMonth,
      totalAnnualProfit,
      blendedMargin,
      totalOrders,
      totalUnits,
      avgUnitsPerOrder,
      avgRevenuePerOrder,
      avgProfitPerOrder,
      totalSubscriptionsMonth,
      totalSubscriptionsArr,
      subscriptionShareArr,
      topArrClient,
      topMarginClient,
      topVolumeClient,
      atRiskClients,
      top1Share,
      top2Share,
      warehouseData,
      sectorData,
      clientChartData,
      donutData,
      quadrantMatrix,
      avgOrders,
      marginThreshold,
    };
  }, [calculatedClients, activeClientId, donutGroupBy]);

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

            {/* Toggle Analytics Dashboard */}
            <button
              type="button"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                showAnalytics
                  ? isDark
                    ? 'bg-[#25203D] text-[#47D2BF] border-[#47D2BF]/40'
                    : 'bg-purple-100 text-[#6B4ABF] border-purple-300'
                  : isDark
                  ? 'bg-[#151226] text-gray-300 border-[#2E2A48]'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
              title={language === 'en' ? 'Toggle Executive Analytics' : 'Mostrar/Ocultar Panel Estratégico'}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{language === 'en' ? (showAnalytics ? 'Hide Analytics' : 'Show Analytics') : (showAnalytics ? 'Ocultar Métricas' : 'Panel Estratégico')}</span>
            </button>

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

      {/* Panel Estratégico & Toma de Decisiones de Cartera (Executive Analytics) */}
      {showAnalytics && (
        <div className={`p-5 rounded-xl border transition shadow-sm space-y-5 ${
          isDark ? 'bg-[#1E1B2E] border-[#2E2A48]' : 'bg-white border-[#E5DDD0]'
        }`}>
          {/* Header del Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-inherit">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="p-1.5 rounded-lg bg-[#6B4ABF]/10 text-[#6B4ABF] dark:text-[#47D2BF]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                  {language === 'en' ? 'Executive Portfolio & Decision-Making Analytics' : 'Panel Estratégico & Toma de Decisiones de Cartera'}
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                  ARR {formatEur(portfolioMetrics.totalArr)}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border font-mono ${
                  portfolioMetrics.blendedMargin >= 0.22
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20'
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                }`}>
                  Margen {formatPct(portfolioMetrics.blendedMargin)}
                </span>
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
                {language === 'en'
                  ? 'Strategic KPIs, ARR run-rate, 4-quadrant decision matrix, and risk concentration to guide pricing, account retention, and operations.'
                  : 'Cálculos ejecutivos, proyección de ARR, matriz de 4 cuadrantes y análisis de riesgo para orientar pricing, retención y operaciones.'}
              </p>
            </div>

            {/* Selector de sub-vistas analíticas */}
            <div className={`flex items-center p-1 rounded-lg border text-xs gap-1 ${
              isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
            }`}>
              <button
                type="button"
                onClick={() => setAnalyticsTab('arr_performance')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded font-semibold transition cursor-pointer ${
                  analyticsTab === 'arr_performance'
                    ? isDark ? 'bg-[#6B4ABF] text-white shadow-2xs' : 'bg-white text-[#6B4ABF] shadow-2xs'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'ARR & Growth' : 'Rendimiento & ARR'}</span>
              </button>

              <button
                type="button"
                onClick={() => setAnalyticsTab('decision_matrix')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded font-semibold transition cursor-pointer ${
                  analyticsTab === 'decision_matrix'
                    ? isDark ? 'bg-[#6B4ABF] text-white shadow-2xs' : 'bg-white text-[#6B4ABF] shadow-2xs'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Decision Matrix' : 'Matriz de Decisión'}</span>
              </button>

              <button
                type="button"
                onClick={() => setAnalyticsTab('concentration')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded font-semibold transition cursor-pointer ${
                  analyticsTab === 'concentration'
                    ? isDark ? 'bg-[#6B4ABF] text-white shadow-2xs' : 'bg-white text-[#6B4ABF] shadow-2xs'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                <PieIcon className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Concentration & Hubs' : 'Concentración & Hubs'}</span>
              </button>
            </div>
          </div>

          {/* 4 Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: ARR Total */}
            <div className={`p-4 rounded-xl border transition ${
              isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
            }`}>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  {language === 'en' ? 'Total Portfolio ARR' : 'ARR Total Cartera'}
                </span>
                <div className="p-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-2xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                {formatEur(portfolioMetrics.totalArr)}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 border-t pt-2 border-inherit">
                <span>MRR: <strong className={isDark ? 'text-purple-300' : 'text-purple-700'}>{formatEur(portfolioMetrics.totalMrr)}/mes</strong></span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">×12 meses</span>
              </div>
            </div>

            {/* Card 2: Beneficio Anual & Margen Blended */}
            <div className={`p-4 rounded-xl border transition ${
              isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
            }`}>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  {language === 'en' ? 'Annual Gross Profit' : 'Beneficio Neto Anualizado'}
                </span>
                <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                {formatEur(portfolioMetrics.totalAnnualProfit)}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] border-t pt-2 border-inherit">
                <span className="text-gray-500">
                  {language === 'en' ? 'Blended Margin:' : 'Margen Medio:'}{' '}
                  <strong className={portfolioMetrics.blendedMargin >= 0.22 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}>
                    {formatPct(portfolioMetrics.blendedMargin)}
                  </strong>
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  portfolioMetrics.blendedMargin >= 0.22
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-600'
                }`}>
                  {portfolioMetrics.blendedMargin >= 0.22 ? 'Saludable' : 'Seguimiento'}
                </span>
              </div>
            </div>

            {/* Card 3: Volumen & Unit Economics */}
            <div className={`p-4 rounded-xl border transition ${
              isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
            }`}>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  {language === 'en' ? 'Network Volume & AOV' : 'Volumen & Unit Economics'}
                </span>
                <div className="p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-2xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                {portfolioMetrics.totalOrders.toLocaleString()} <span className="text-xs font-normal text-gray-400 font-sans">ped/mes</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 border-t pt-2 border-inherit font-mono">
                <span>Ingreso: <strong>{formatEur(portfolioMetrics.avgRevenuePerOrder)}</strong>/ped</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{formatEur(portfolioMetrics.avgProfitPerOrder)} neto</span>
              </div>
            </div>

            {/* Card 4: Suscripciones Fijas / SaaS */}
            <div className={`p-4 rounded-xl border transition ${
              isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
            }`}>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  {language === 'en' ? 'SaaS / Platform Fees ARR' : 'Cuotas Suscripción SaaS (ARR)'}
                </span>
                <div className="p-1 rounded-md bg-[#47D2BF]/10 text-[#47D2BF]">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-2xl font-black font-mono tracking-tight text-[#6B4ABF] dark:text-[#47D2BF]`}>
                {formatEur(portfolioMetrics.totalSubscriptionsArr)}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 border-t pt-2 border-inherit">
                <span>{formatEur(portfolioMetrics.totalSubscriptionsMonth)}/mes fijas</span>
                <span className="font-semibold text-purple-600 dark:text-purple-300">
                  {portfolioMetrics.subscriptionShareArr.toFixed(1)}% del ARR
                </span>
              </div>
            </div>
          </div>

          {/* Sub-vista 1: Rendimiento & ARR por Cliente */}
          {analyticsTab === 'arr_performance' && (
            <div className="space-y-4 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    {language === 'en' ? 'Client Contribution Ranking: ARR & Gross Profit' : 'Ranking de Contribución por Cliente: ARR y Beneficio'}
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
                    {language === 'en'
                      ? 'Comparison of annual recurring revenue and annual profit contribution per client, highlighting key business drivers.'
                      : 'Comparación de la facturación recurrente anualizada y la aportación neta de beneficio de cada cliente.'}
                  </p>
                </div>

                <div className={`flex items-center p-1 rounded-lg border text-xs gap-1 self-start sm:self-auto ${
                  isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
                }`}>
                  <button
                    type="button"
                    onClick={() => setChartMetric('arr')}
                    className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                      chartMetric === 'arr'
                        ? isDark ? 'bg-[#6B4ABF] text-white shadow-2xs' : 'bg-white text-[#6B4ABF] shadow-2xs'
                        : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    {language === 'en' ? 'Annual (ARR)' : 'Proyección Anual (ARR)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric('monthly')}
                    className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                      chartMetric === 'monthly'
                        ? isDark ? 'bg-[#6B4ABF] text-white shadow-2xs' : 'bg-white text-[#6B4ABF] shadow-2xs'
                        : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    {language === 'en' ? 'Monthly (MRR)' : 'Facturación Mensual (MRR)'}
                  </button>
                </div>
              </div>

              {/* Bar Chart con Recharts */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
              }`}>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={portfolioMetrics.clientChartData}
                      margin={{ top: 15, right: 20, left: 15, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2E2A48' : '#E5DDD0'} vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke={isDark ? '#9CA3AF' : '#6D635B'}
                        tick={{ fontSize: 11 }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={40}
                      />
                      <YAxis
                        stroke={isDark ? '#9CA3AF' : '#6D635B'}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k €`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className={`p-3 rounded-xl border text-xs shadow-xl min-w-[210px] ${
                                isDark ? 'bg-[#1E1B2E] border-[#47D2BF]/40 text-white' : 'bg-white border-[#6B4ABF]/30 text-[#2D2825]'
                              }`}>
                                <div className="font-bold text-sm mb-1.5 border-b pb-1 flex items-center justify-between">
                                  <span>{d.fullName}</span>
                                  <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-400">
                                    {d.warehouse}
                                  </span>
                                </div>
                                <div className="space-y-1 font-mono">
                                  <div className="flex justify-between items-center text-[#6B4ABF] dark:text-[#a78bfa]">
                                    <span>{language === 'en' ? 'ARR (12m):' : 'ARR Anual:'}</span>
                                    <strong className="font-bold">{formatEur(d.arr)}</strong>
                                  </div>
                                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                                    <span>{language === 'en' ? 'Annual Profit:' : 'Beneficio Anual:'}</span>
                                    <strong className="font-bold">{formatEur(d.annualProfit)}</strong>
                                  </div>
                                  <div className="flex justify-between items-center text-gray-500 border-t pt-1 mt-1">
                                    <span>{language === 'en' ? 'Monthly Revenue:' : 'Ingreso/Mes:'}</span>
                                    <span>{formatEur(d.monthlyRevenue)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-gray-500">
                                    <span>{language === 'en' ? 'Margin:' : 'Margen:'}</span>
                                    <span className={`font-semibold ${d.margin >= 20 ? 'text-emerald-500' : 'text-amber-500'}`}>{d.margin}%</span>
                                  </div>
                                  <div className="flex justify-between items-center text-gray-500">
                                    <span>{language === 'en' ? 'Orders:' : 'Pedidos:'}</span>
                                    <span>{d.orders.toLocaleString()} /mes</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                      <Bar
                        dataKey={chartMetric === 'arr' ? 'arr' : 'monthlyRevenue'}
                        name={
                          chartMetric === 'arr'
                            ? (language === 'en' ? 'ARR (12m) (€)' : 'ARR Anual (€)')
                            : (language === 'en' ? 'Monthly Revenue (€)' : 'Ingresos Mensuales (€)')
                        }
                        fill="#6B4ABF"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey={chartMetric === 'arr' ? 'annualProfit' : 'monthlyProfit'}
                        name={
                          chartMetric === 'arr'
                            ? (language === 'en' ? 'Annual Profit (€)' : 'Beneficio Anual (€)')
                            : (language === 'en' ? 'Monthly Profit (€)' : 'Beneficio Mensual (€)')
                        }
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 4 Actionable Strategic Decision Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                {/* Insight 1: Cliente Clave */}
                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
                }`}>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#6B4ABF] dark:text-[#47D2BF] mb-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Key Enterprise Account' : 'Cliente Clave (Mayor ARR)'}</span>
                  </div>
                  <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    {portfolioMetrics.topArrClient?.profile.name || '-'}
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">
                    {formatEur(portfolioMetrics.topArrClient?.res.arrRevenue || 0)}{' '}
                    <span className="text-[10px] text-purple-600 dark:text-purple-300 font-bold">
                      ({portfolioMetrics.top1Share.toFixed(1)}% {language === 'en' ? 'of ARR' : 'del ARR total'})
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2 border-t pt-1.5 border-inherit">
                    <strong>Decisión:</strong> Auditar SLAs trimestrales, asignar gestor de cuenta prioritario y asegurar SLA de preparación 99.8%.
                  </p>
                </div>

                {/* Insight 2: Mayor Eficiencia de Margen */}
                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
                }`}>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Top Margin Efficiency' : 'Máxima Rentabilidad (%)'}</span>
                  </div>
                  <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    {portfolioMetrics.topMarginClient?.profile.name || '-'}
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">
                    Margen:{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {formatPct(portfolioMetrics.topMarginClient?.res.marginTotal ?? 0)}
                    </strong>{' '}
                    <span>({formatEur(portfolioMetrics.topMarginClient?.res.totalProfitMonth || 0)}/mes)</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2 border-t pt-1.5 border-inherit">
                    <strong>Decisión:</strong> Usar su estructura tarifaria como plantilla modelo para cotizar nuevos clientes de su misma categoría.
                  </p>
                </div>

                {/* Insight 3: Alerta de Renegociación */}
                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
                }`}>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Renegotiation Alerts (<20%)' : 'Alerta de Renegociación (<20%)'}</span>
                  </div>
                  <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    {portfolioMetrics.atRiskClients.length}{' '}
                    <span className="text-xs font-normal text-gray-400">
                      {language === 'en' ? 'client(s) with tight margin' : 'cliente(s) con margen ajustado'}
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 truncate mt-0.5 font-semibold">
                    {portfolioMetrics.atRiskClients.length > 0
                      ? portfolioMetrics.atRiskClients.map(c => c.profile.name).join(', ')
                      : (language === 'en' ? 'All accounts above 20%' : 'Todos los clientes ≥ 20%')}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2 border-t pt-1.5 border-inherit">
                    <strong>Decisión:</strong> Ajustar tarifa de picking en pedidos de {'>'}1 unidad, empaque custom o actualizar suplementos de transporte.
                  </p>
                </div>

                {/* Insight 4: Oportunidad de Expansión */}
                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
                }`}>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Volume Scaling Potential' : 'Potencial de Escala'}</span>
                  </div>
                  <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    {portfolioMetrics.quadrantMatrix.scale.length}{' '}
                    <span className="text-xs font-normal text-gray-400">
                      {language === 'en' ? 'high-margin accounts' : 'cuentas de alto margen'}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 font-mono mt-0.5 truncate">
                    Volumen medio red: <strong>{portfolioMetrics.avgOrders} ped/mes</strong>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2 border-t pt-1.5 border-inherit">
                    <strong>Decisión:</strong> Conectar canales de venta adicionales (Amazon, TikTok Shop, Mirakl) para duplicar su volumen sin perder margen.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sub-vista 2: Matriz de Decisión Estratégica (Margen vs Volumen) */}
          {analyticsTab === 'decision_matrix' && (
            <div className="space-y-4 pt-1">
              <div>
                <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                  {language === 'en' ? 'Strategic 4-Quadrant Matrix (Volume vs Gross Margin)' : 'Matriz Estratégica de 4 Cuadrantes: Margen vs Volumen de Pedidos'}
                </h4>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
                  {language === 'en'
                    ? `Divides the portfolio using the network average volume (${portfolioMetrics.avgOrders} orders/month) and target gross margin (${(portfolioMetrics.marginThreshold * 100).toFixed(0)}%) to drive clear commercial actions.`
                    : `Segmenta la cartera cruzando el volumen medio (${portfolioMetrics.avgOrders} pedidos/mes) y el margen objetivo (${(portfolioMetrics.marginThreshold * 100).toFixed(0)}%) para asignar acciones comerciales inmediatas.`}
                </p>
              </div>

              {/* 2x2 Grid de Cuadrantes de Decisión */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cuadrante 1: Clientes Estrella */}
                <div className={`p-4 rounded-xl border relative overflow-hidden ${
                  isDark ? 'bg-emerald-950/20 border-emerald-800/50' : 'bg-emerald-50/60 border-emerald-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">⭐</span>
                      <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        {language === 'en' ? '1. Stars (High Volume + High Margin)' : '1. Clientes Estrella (Alto Volumen + Alto Margen)'}
                      </h5>
                    </div>
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      {portfolioMetrics.quadrantMatrix.stars.length} {language === 'en' ? 'accounts' : 'cuentas'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 my-2.5">
                    {portfolioMetrics.quadrantMatrix.stars.length > 0 ? (
                      portfolioMetrics.quadrantMatrix.stars.map(c => (
                        <span
                          key={c.profile.id}
                          onClick={() => onSelectClient(c.profile.id)}
                          className={`text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer transition hover:scale-105 ${
                            c.profile.id === activeClientId
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : isDark ? 'bg-[#151226] text-white border-emerald-800/60' : 'bg-white text-emerald-900 border-emerald-300'
                          }`}
                          title="Clic para seleccionar cliente"
                        >
                          {c.profile.name} <span className="font-mono text-[10px] opacity-80">({c.res.ordersMonth} ped · {formatPct(c.res.marginTotal)})</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">Sin clientes en este cuadrante</span>
                    )}
                  </div>

                  <div className={`text-[11px] p-2.5 rounded-lg border mt-3 ${
                    isDark ? 'bg-[#151226]/80 border-emerald-900/40 text-gray-300' : 'bg-white/80 border-emerald-200 text-emerald-950'
                  }`}>
                    <strong>Estrategia Comercial:</strong> Máxima prioridad operativa. Asignar Key Account Manager dedicado, garantizar 99.8% de despacho en el mismo día y proponer expansión de catálogo a UK o USA.
                  </div>
                </div>

                {/* Cuadrante 2: Optimizar y Renegociar */}
                <div className={`p-4 rounded-xl border relative overflow-hidden ${
                  isDark ? 'bg-amber-950/20 border-amber-800/50' : 'bg-amber-50/60 border-amber-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">⚡</span>
                      <h5 className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        {language === 'en' ? '2. Optimize & Renegotiate (High Volume + Tight Margin)' : '2. Optimizar & Renegociar (Alto Volumen + Margen Bajo)'}
                      </h5>
                    </div>
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                      {portfolioMetrics.quadrantMatrix.optimize.length} {language === 'en' ? 'accounts' : 'cuentas'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 my-2.5">
                    {portfolioMetrics.quadrantMatrix.optimize.length > 0 ? (
                      portfolioMetrics.quadrantMatrix.optimize.map(c => (
                        <span
                          key={c.profile.id}
                          onClick={() => onSelectClient(c.profile.id)}
                          className={`text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer transition hover:scale-105 ${
                            c.profile.id === activeClientId
                              ? 'bg-amber-600 text-white border-amber-500'
                              : isDark ? 'bg-[#151226] text-white border-amber-800/60' : 'bg-white text-amber-900 border-amber-300'
                          }`}
                          title="Clic para seleccionar cliente"
                        >
                          {c.profile.name} <span className="font-mono text-[10px] opacity-80">({c.res.ordersMonth} ped · {formatPct(c.res.marginTotal)})</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">Sin clientes en este cuadrante</span>
                    )}
                  </div>

                  <div className={`text-[11px] p-2.5 rounded-lg border mt-3 ${
                    isDark ? 'bg-[#151226]/80 border-amber-900/40 text-gray-300' : 'bg-white/80 border-amber-200 text-amber-950'
                  }`}>
                    <strong>Estrategia Comercial:</strong> Alto consumo de recursos en almacén sin margen suficiente. Renegociar tarifas de picking adicional, aplicar recargos por pedidos de múltiples referencias o ajustar tarifa de envío.
                  </div>
                </div>

                {/* Cuadrante 3: Potencial de Crecimiento */}
                <div className={`p-4 rounded-xl border relative overflow-hidden ${
                  isDark ? 'bg-blue-950/20 border-blue-800/50' : 'bg-blue-50/60 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🌱</span>
                      <h5 className="font-bold text-xs uppercase tracking-wider text-blue-700 dark:text-blue-400">
                        {language === 'en' ? '3. Scale Potential (Low Volume + High Margin)' : '3. Potencial de Escala (Bajo Volumen + Alto Margen)'}
                      </h5>
                    </div>
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300">
                      {portfolioMetrics.quadrantMatrix.scale.length} {language === 'en' ? 'accounts' : 'cuentas'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 my-2.5">
                    {portfolioMetrics.quadrantMatrix.scale.length > 0 ? (
                      portfolioMetrics.quadrantMatrix.scale.map(c => (
                        <span
                          key={c.profile.id}
                          onClick={() => onSelectClient(c.profile.id)}
                          className={`text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer transition hover:scale-105 ${
                            c.profile.id === activeClientId
                              ? 'bg-blue-600 text-white border-blue-500'
                              : isDark ? 'bg-[#151226] text-white border-blue-800/60' : 'bg-white text-blue-900 border-blue-300'
                          }`}
                          title="Clic para seleccionar cliente"
                        >
                          {c.profile.name} <span className="font-mono text-[10px] opacity-80">({c.res.ordersMonth} ped · {formatPct(c.res.marginTotal)})</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">Sin clientes en este cuadrante</span>
                    )}
                  </div>

                  <div className={`text-[11px] p-2.5 rounded-lg border mt-3 ${
                    isDark ? 'bg-[#151226]/80 border-blue-900/40 text-gray-300' : 'bg-white/80 border-blue-200 text-blue-950'
                  }`}>
                    <strong>Estrategia Comercial:</strong> Estructura tarifaria muy rentable por unidad. Apoyar comercialmente para acelerar ventas en Shopify, TikTok Shop o Amazon para escalar su facturación mensual.
                  </div>
                </div>

                {/* Cuadrante 4: Revisión de Viabilidad */}
                <div className={`p-4 rounded-xl border relative overflow-hidden ${
                  isDark ? 'bg-rose-950/20 border-rose-800/50' : 'bg-rose-50/60 border-rose-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🔍</span>
                      <h5 className="font-bold text-xs uppercase tracking-wider text-rose-700 dark:text-rose-400">
                        {language === 'en' ? '4. Viability Review (Low Volume + Tight Margin)' : '4. Revisión de Viabilidad (Bajo Volumen + Margen Bajo)'}
                      </h5>
                    </div>
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300">
                      {portfolioMetrics.quadrantMatrix.review.length} {language === 'en' ? 'accounts' : 'cuentas'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 my-2.5">
                    {portfolioMetrics.quadrantMatrix.review.length > 0 ? (
                      portfolioMetrics.quadrantMatrix.review.map(c => (
                        <span
                          key={c.profile.id}
                          onClick={() => onSelectClient(c.profile.id)}
                          className={`text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer transition hover:scale-105 ${
                            c.profile.id === activeClientId
                              ? 'bg-rose-600 text-white border-rose-500'
                              : isDark ? 'bg-[#151226] text-white border-rose-800/60' : 'bg-white text-rose-900 border-rose-300'
                          }`}
                          title="Clic para seleccionar cliente"
                        >
                          {c.profile.name} <span className="font-mono text-[10px] opacity-80">({c.res.ordersMonth} ped · {formatPct(c.res.marginTotal)})</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">Sin clientes en este cuadrante</span>
                    )}
                  </div>

                  <div className={`text-[11px] p-2.5 rounded-lg border mt-3 ${
                    isDark ? 'bg-[#151226]/80 border-rose-900/40 text-gray-300' : 'bg-white/80 border-rose-200 text-rose-950'
                  }`}>
                    <strong>Estrategia Comercial:</strong> Riego de ineficiencia por costes fijos de atención al cliente. Migrar a cuota mínima de suscripción (Tier 50€/150€) o establecer facturación mínima mensual.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-vista 3: Concentración & Territorios */}
          {analyticsTab === 'concentration' && (
            <div className="space-y-4 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    {language === 'en' ? 'Portfolio Diversification & Hub Concentration' : 'Diversificación de Cartera y Concentración en Hubs'}
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
                    {language === 'en'
                      ? 'Analyze revenue dependency (Pareto Index) and geographical distribution across fulfillment centers.'
                      : 'Análisis de riesgo por dependencia de clientes (Índice Pareto) y desglose geográfico por centros de cumplimiento.'}
                  </p>
                </div>

                <div className={`flex items-center p-1 rounded-lg border text-xs gap-1 self-start sm:self-auto ${
                  isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
                }`}>
                  <button
                    type="button"
                    onClick={() => setDonutGroupBy('clients')}
                    className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                      donutGroupBy === 'clients'
                        ? isDark ? 'bg-[#6B4ABF] text-white shadow-2xs' : 'bg-white text-[#6B4ABF] shadow-2xs'
                        : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    {language === 'en' ? 'By Client' : 'Por Cliente'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDonutGroupBy('warehouses')}
                    className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                      donutGroupBy === 'warehouses'
                        ? isDark ? 'bg-[#6B4ABF] text-white shadow-2xs' : 'bg-white text-[#6B4ABF] shadow-2xs'
                        : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    {language === 'en' ? 'By Hub / Warehouse' : 'Por Almacén'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDonutGroupBy('sectors')}
                    className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                      donutGroupBy === 'sectors'
                        ? isDark ? 'bg-[#6B4ABF] text-white shadow-2xs' : 'bg-white text-[#6B4ABF] shadow-2xs'
                        : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    {language === 'en' ? 'By Sector' : 'Por Sector'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                {/* Donut Chart */}
                <div className={`lg:col-span-6 p-4 rounded-xl border ${
                  isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
                }`}>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={portfolioMetrics.donutData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                        >
                          {portfolioMetrics.donutData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={STRATEGIC_PALETTE[index % STRATEGIC_PALETTE.length]}
                              stroke={isDark ? '#151226' : '#FAF7F2'}
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className={`p-2.5 rounded-lg border text-xs shadow-xl ${
                                  isDark ? 'bg-[#1E1B2E] border-[#2E2A48] text-white' : 'bg-white border-[#E5DDD0] text-[#2D2825]'
                                }`}>
                                  <p className="font-bold mb-1">{d.name}</p>
                                  <p className="flex items-center justify-between gap-3 text-purple-600 dark:text-purple-400 font-mono">
                                    <span>ARR:</span>
                                    <strong>{formatEur(d.value)}</strong>
                                  </p>
                                  <p className="flex items-center justify-between gap-3 text-gray-500 font-mono text-[11px]">
                                    <span>Cuota:</span>
                                    <span>{d.pct.toFixed(1)}%</span>
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
                          layout="horizontal"
                          align="center"
                          verticalAlign="bottom"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pareto Risk & Hubs Breakdown */}
                <div className="lg:col-span-6 space-y-4">
                  {/* Pareto Risk Card */}
                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        {language === 'en' ? 'Pareto Concentration Index' : 'Índice de Concentración (Pareto)'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        portfolioMetrics.top1Share > 40
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {portfolioMetrics.top1Share > 40 ? 'Concentración Elevada' : 'Cartera Equilibrada'}
                      </span>
                    </div>

                    <div className="space-y-3 font-mono text-xs pt-1">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-500">Top 1 Cliente ({portfolioMetrics.topArrClient?.profile.name || '-'})</span>
                          <strong className="text-purple-600 dark:text-purple-300">{portfolioMetrics.top1Share.toFixed(1)}% del ARR</strong>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              portfolioMetrics.top1Share > 40 ? 'bg-amber-500' : 'bg-[#6B4ABF]'
                            }`}
                            style={{ width: `${Math.min(100, portfolioMetrics.top1Share)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-500">Top 2 Clientes Acumulados</span>
                          <strong className="text-purple-600 dark:text-purple-300">{portfolioMetrics.top2Share.toFixed(1)}% del ARR</strong>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              portfolioMetrics.top2Share > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, portfolioMetrics.top2Share)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-500 mt-3 pt-2 border-t border-inherit">
                      {portfolioMetrics.top1Share > 40
                        ? '⚠️ Alerta de concentración: La cuenta principal supera el 40% del ARR. Se recomienda impulsar prospección para diversificar el riesgo de churn.'
                        : '✅ Diversificación saludable: Ninguna cuenta individual excede un umbral crítico de dependencia comercial.'}
                    </p>
                  </div>

                  {/* Hubs / Almacenes Distribution */}
                  <div className="grid grid-cols-3 gap-2">
                    {portfolioMetrics.warehouseData.map((w) => (
                      <div
                        key={w.name}
                        className={`p-3 rounded-xl border text-center ${
                          isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-gray-400">
                          {w.name}
                        </span>
                        <span className="font-bold text-sm block font-mono text-purple-600 dark:text-purple-300 mt-0.5">
                          {formatEur(w.arr)}
                        </span>
                        <span className="text-[10px] text-gray-500 block font-mono">
                          {w.count} {w.count === 1 ? 'cliente' : 'clientes'} · {w.orders} ped
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
