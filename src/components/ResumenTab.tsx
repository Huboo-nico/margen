import React, { useState } from 'react';
import { CalculationResults, CalculatorInputs } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { formatEur, formatPct, formatMarkup } from '../utils/calculations';
import { AlertTriangle, CheckCircle, Package, Truck, Info, ArrowUpRight, FileText, CreditCard, Sparkles, Check } from 'lucide-react';
import { InternalReportModal } from './InternalReportModal';
import { LiveDateScheduler } from './LiveDateScheduler';
import { SUBSCRIPTION_TIERS } from '../data/constants';
import { SubscriptionTier } from '../types';

interface ResumenTabProps {
  results: CalculationResults;
  inputs?: CalculatorInputs;
  onOpenPricingSimulator?: () => void;
  onUpdateInputs?: (partial: Partial<CalculatorInputs>) => void;
}

export const ResumenTab: React.FC<ResumenTabProps> = ({
  results,
  inputs,
  onOpenPricingSimulator,
  onUpdateInputs,
}) => {
  const [showPdfModal, setShowPdfModal] = useState(false);
  const { language } = useLanguage();
  const { isDark } = useTheme();

  const translateAlert = (alert: string) => {
    if (language !== 'en') return alert;
    if (alert.includes('El margen total mensual está por debajo')) {
      return 'Total monthly margin is below 20%. Consider adjusting margins or prices.';
    }
    if (alert.includes('El fee de Preparación + 1er Pick está por debajo')) {
      return 'Warning! Preparation + 1st Pick fee is below its operational cost.';
    }
    if (alert.includes('El primer pick se está cobrando por debajo')) {
      return 'The first pick is priced below its adjusted cost.';
    }
    if (alert.includes('Con primer pick subsidiado')) {
      return alert
        .replace('Con primer pick subsidiado, el break-even es', 'With subsidized first pick, break-even is')
        .replace('uds/pedido (actual:', 'units/order (current:')
        .replace('uds). Margen en riesgo.', 'units). Margin at risk.');
    }
    if (alert.includes('El coste de carrier supera al precio de venta del envío')) {
      return 'Carrier cost exceeds shipping sale price (negative margin on transport).';
    }
    return alert;
  };

  // Fallback default inputs if not passed
  const effectiveInputs: CalculatorInputs = inputs || {
    clientName: results.clientName,
    clientNotes: '',
    skuCount: 15,
    productType: 'Suplementos',
    packCostSource: 'Calculadora (negociado)',
    volumeMode: 'Pedidos/día',
    workingDays: 22,
    ordersPerDay: results.ordersPerDay,
    ordersMonth: results.ordersMonth,
    unitsPerOrder: results.unitsPerOrder,
    mixSpk: 0,
    mixSpl: 0,
    mixMpl: 50,
    mixLpl: 50,
    packPriceMode: 'margin',
    packMarginTarget: results.packMargin || 0.38,
    packPriceManual: results.packPrice,
    firstPickPriceMode: 'margin',
    firstPickMarginTarget: results.firstPickMargin || 0.28,
    firstPickPriceManual: results.firstPickPrice,
    additionalPickPriceMode: 'margin',
    additionalPickMarginTarget: results.additionalPickMargin || 0.28,
    additionalPickPriceManual: results.additionalPickPrice,
    shippingPriceMode: 'margin',
    carrierCost: results.carrierCost,
    shippingMarginTarget: results.shippingMargin || 0.2,
    shippingPriceManual: results.shippingPrice,
    insertsPerOrder: 0,
    insertPrice: 0.15,
    insertCost: 0.05,
    packagingPrice: 0.3,
    packagingCost: 0.15,
    surchargePrice: 0,
    surchargeCost: 0,
    returnRate: 0.02,
    returnHandlingPrice: 1.5,
    returnHandlingCost: 0.8,
    goodsInPalletsMonth: 0,
    goodsInPrice: 12.5,
    goodsInCost: 7.0,
    storagePalletWeeksMonth: 0,
    storagePrice: 3.5,
    storageCost: 1.8,
  };

  return (
    <div className="space-y-6">
      {/* Dashboard View (Hidden when internal report modal is open during print) */}
      <div id="main-dashboard-content" className={`space-y-6 ${showPdfModal ? 'print:hidden' : ''}`}>
        {/* Client Headline Banner */}
        <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs transition-colors duration-200 ${
          isDark
            ? 'bg-[#1E1B2E] border-[#2E2A48]'
            : 'bg-white border-[#E5DDD0]'
        }`}>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded tracking-wide ${
                isDark
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                  : 'bg-red-100 text-red-700'
              }`}>
                {language === 'en' ? 'Client' : 'Cliente'}
              </span>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                {results.clientName || (language === 'en' ? 'Unnamed Client' : 'Cliente sin nombre')}
              </h2>
              {results.technologies && results.technologies.length > 0 && (
                <div className="flex items-center gap-1">
                  {results.technologies.map((t) => (
                    <span
                      key={t}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        isDark
                          ? 'bg-[#252238] text-gray-200 border-[#2E2A48]'
                          : 'bg-[#F4EEE4] text-[#4D453E] border-[#E5DDD0]'
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {results.ordersMonth.toLocaleString(language === 'en' ? 'en-US' : 'es-ES', { maximumFractionDigits: 0 })}{' '}
              {language === 'en' ? 'orders/month' : 'pedidos/mes'} (
              {results.ordersPerDay.toFixed(1)} {language === 'en' ? 'orders/day' : 'pedidos/día'}) ·{' '}
              {results.unitsPerOrder.toFixed(1)} {language === 'en' ? 'units/order' : 'units/pedido'} · Tier SKU:{' '}
              <span className={`font-semibold ${isDark ? 'text-[#47D2BF]' : 'text-[#2D2825]'}`}>{results.tierName}</span>
            </p>
          </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Internal PDF Presentation Button */}
          <button
            type="button"
            onClick={() => setShowPdfModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#6B4ABF] hover:bg-[#583aa3] text-white text-xs font-semibold rounded-lg shadow-xs border border-[#47D2BF]/40 transition cursor-pointer"
            title={language === 'en' ? 'Generate confidential internal PDF report with operational breakdown' : 'Generar informe PDF confidencial para presentar internamente con desglose operativo'}
          >
            <FileText className="w-3.5 h-3.5 text-[#47D2BF]" />
            <span>{language === 'en' ? 'Create Internal PDF' : 'Crear PDF Interno'}</span>
          </button>

          {onOpenPricingSimulator && (
            <button
              type="button"
              onClick={onOpenPricingSimulator}
              className={`inline-flex items-center gap-1 text-xs font-semibold hover:underline cursor-pointer ${
                isDark ? 'text-[#47D2BF] hover:text-[#38bca9]' : 'text-red-600 hover:text-red-700'
              }`}
            >
              <span>{language === 'en' ? 'Adjust prices & margins' : 'Ajustar precios & márgenes'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className={`p-4 rounded-xl border shadow-2xs transition-colors duration-200 ${
          isDark
            ? 'bg-[#1E1B2E] border-[#2E2A48]'
            : 'bg-white border-[#E5DDD0]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium block ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en' ? 'Revenue / month' : 'Ingresos / mes'}
            </span>
            {results.subscriptionRevenueMonth > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isDark ? 'bg-[#25203D] text-[#47D2BF] border border-[#47D2BF]/30' : 'bg-purple-100 text-purple-800'
              }`}>
                +{formatEur(results.subscriptionRevenueMonth)} suscripción
              </span>
            )}
          </div>
          <span className={`text-2xl font-extrabold tracking-tight block ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
            {formatEur(results.totalRevenueMonth)}
          </span>
          <span className={`text-[11px] mt-1 block ${isDark ? 'text-gray-400' : 'text-[#8C8278]'}`}>
            {language === 'en' ? 'Costs: ' : 'Costes: '}{formatEur(results.totalCostMonth)}
          </span>
        </div>

        <div className={`p-4 rounded-xl border shadow-2xs transition-colors duration-200 ${
          isDark
            ? 'bg-[#1E1B2E] border-[#2E2A48]'
            : 'bg-white border-[#E5DDD0]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium block ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en' ? 'Net profit / month' : 'Beneficio neto / mes'}
            </span>
            {results.subscriptionRevenueMonth > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isDark ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40' : 'bg-emerald-100 text-emerald-800'
              }`}>
                100% margen cuota
              </span>
            )}
          </div>
          <span
            className={`text-2xl font-extrabold tracking-tight block ${
              results.totalProfitMonth >= 0
                ? isDark ? 'text-[#47D2BF]' : 'text-emerald-700'
                : 'text-red-500'
            }`}
          >
            {formatEur(results.totalProfitMonth)}
          </span>
          <span className={`text-[11px] mt-1 block ${isDark ? 'text-gray-400' : 'text-[#8C8278]'}`}>
            {formatEur(results.profitPerOrder)} {language === 'en' ? 'per order' : 'por pedido'}
          </span>
        </div>

        <div className={`p-4 rounded-xl border shadow-2xs transition-colors duration-200 ${
          isDark
            ? 'bg-[#1E1B2E] border-[#2E2A48]'
            : 'bg-white border-[#E5DDD0]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en' ? 'Total Margin' : 'Margen Total'}
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded font-mono border ${
              isDark
                ? 'bg-[#25203D] text-[#47D2BF] border-[#47D2BF]/40'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              Markup {formatMarkup(results.markupTotal)}
            </span>
          </div>
          <span
            className={`text-2xl font-extrabold tracking-tight block ${
              results.marginTotal !== null && results.marginTotal >= 0.2
                ? isDark ? 'text-white' : 'text-[#2D2825]'
                : 'text-amber-500'
            }`}
          >
            {formatPct(results.marginTotal)}
          </span>
          <span className={`text-[11px] mt-1 block ${isDark ? 'text-gray-400' : 'text-[#8C8278]'}`}>
            {language === 'en' ? 'General target >= 20%' : 'Objetivo general >= 20%'}
          </span>
        </div>

        <div className={`p-4 rounded-xl border shadow-2xs transition-colors duration-200 ${
          isDark
            ? 'bg-[#1E1B2E] border-[#2E2A48]'
            : 'bg-white border-[#E5DDD0]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en' ? 'Excl. Shipping' : 'Sin Envío'}
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded font-mono border ${
              isDark
                ? 'bg-[#25203D] text-[#47D2BF] border-[#47D2BF]/40'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              Markup {formatMarkup(results.markupExShipping)}
            </span>
          </div>
          <span className={`text-2xl font-extrabold tracking-tight block ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
            {formatPct(results.marginExShipping)}
          </span>
          <span className={`text-[11px] mt-1 block ${isDark ? 'text-gray-400' : 'text-[#8C8278]'}`}>
            {language === 'en' ? 'Shipping Margin: ' : 'Margen Envío: '}
            {formatPct(results.marginShipping)} (Markup {formatMarkup(results.shippingMarkup)})
          </span>
        </div>
      </div>

      {/* PLANES DE SUSCRIPCIÓN HUBOO */}
      {(() => {
        const currentOrders = results.ordersMonth || 0;

        // Detección automática según volumen mensual de envíos / pedidos
        let autoTier: SubscriptionTier = 'tier-50';
        let autoPrice = 50;
        if (currentOrders <= 300) {
          autoTier = 'tier-50';
          autoPrice = 50;
        } else if (currentOrders <= 1500) {
          autoTier = 'tier-150';
          autoPrice = 150;
        } else {
          autoTier = 'tier-450';
          autoPrice = 450;
        }

        // Si no se ha especificado o era 'none', se asigna automáticamente según pedidos
        const rawTier = effectiveInputs.subscriptionTier;
        const currentTier = (!rawTier || rawTier === 'none') ? autoTier : (rawTier as SubscriptionTier);
        const isAutoDetected = (!rawTier || rawTier === 'none') || rawTier === autoTier;

        const tierConfigs = [
          {
            key: 'tier-50' as SubscriptionTier,
            name: language === 'en' ? 'Plan €50/mo' : 'Plan 50 €/mes',
            badge: language === 'en' ? 'Up to 300 orders' : 'Hasta 300 pedidos',
            price: 50,
            maxOrders: 300,
            desc: language === 'en' ? 'Starter & scaling brands (≤ 300 orders/mo).' : 'Para clientes iniciales o en despegue (≤ 300 pedidos/mes).',
          },
          {
            key: 'tier-150' as SubscriptionTier,
            name: language === 'en' ? 'Plan €150/mo' : 'Plan 150 €/mes',
            badge: language === 'en' ? '301 to 1,500 orders' : 'De 301 a 1.500 pedidos',
            price: 150,
            maxOrders: 1500,
            desc: language === 'en' ? 'Established growing brands (301–1,500 orders/mo).' : 'Marcas consolidadas en crecimiento continuado (≤ 1.500 pedidos/mes).',
          },
          {
            key: 'tier-450' as SubscriptionTier,
            name: language === 'en' ? 'Plan €450/mo' : 'Plan 450 €/mes',
            badge: language === 'en' ? 'Over 1,500 orders' : 'Más de 1.500 pedidos',
            price: 450,
            maxOrders: 5000,
            desc: language === 'en' ? 'High volume & enterprise scale (> 1,500 orders/mo).' : 'Grandes volúmenes y alta escala logística (> 1.500 pedidos/mes).',
          },
        ];

        const selectedConfig = SUBSCRIPTION_TIERS[currentTier] || SUBSCRIPTION_TIERS['tier-50'];
        const isExceeding = currentTier !== 'custom' && selectedConfig.maxOrders < currentOrders;

        return (
          <div
            id="subscription-plans-section"
            className={`rounded-xl border p-3.5 sm:p-4 shadow-2xs transition-colors duration-200 ${
              isDark ? 'bg-[#1E1B2E] border-[#2E2A48]' : 'bg-white border-[#E5DDD0]'
            }`}
          >
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b pb-2.5 mb-3 ${
              isDark ? 'border-[#2E2A48]' : 'border-[#EFE8DC]'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg shrink-0 ${isDark ? 'bg-[#6B4ABF]/20 text-[#47D2BF]' : 'bg-purple-100 text-[#6B4ABF]'}`}>
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                      {language === 'en' ? 'Huboo Subscription Plans' : 'Planes de Suscripción Huboo'}
                    </h3>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isDark ? 'bg-[#47D2BF]/20 text-[#47D2BF] border border-[#47D2BF]/40' : 'bg-purple-100 text-[#6B4ABF] border border-purple-200'
                    }`}>
                      {formatEur(results.subscriptionRevenueMonth)} {language === 'en' ? '/ mo' : '/ mes'}
                    </span>
                    {isAutoDetected && (
                      <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {language === 'en' ? 'Auto-detected' : 'Detectado auto'}
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] mt-0.5 leading-snug ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
                    {language === 'en'
                      ? 'Fixed monthly platform plan based on monthly order volume tiers. 100% direct gross margin.'
                      : 'Cuota fija mensual de plataforma según tramos de pedidos. Margen bruto directo al 100% al beneficio operativo.'}
                  </p>
                </div>
              </div>

              {/* Indicador de detección automática */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                <div className={`px-2.5 py-1 rounded-md border text-[11px] flex items-center gap-1.5 ${
                  isDark ? 'bg-[#25203D] border-[#6B4ABF]/40 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-900'
                }`}>
                  <Sparkles className="w-3 h-3 text-[#47D2BF]" />
                  <span>
                    {language === 'en' ? 'Volume: ' : 'Volumen: '}
                    <strong>{currentOrders.toLocaleString()} {language === 'en' ? 'orders/mo' : 'pedidos/mes'}</strong>
                    {' → '}
                    {language === 'en' ? 'Auto-tier: ' : 'Auto: '}
                    <strong className="text-[#6B4ABF] dark:text-[#47D2BF]">
                      {autoTier === 'tier-50' && (language === 'en' ? '€50/mo (≤300)' : '50 €/mes (≤300)')}
                      {autoTier === 'tier-150' && (language === 'en' ? '€150/mo (≤1,500)' : '150 €/mes (≤1.500)')}
                      {autoTier === 'tier-450' && (language === 'en' ? '€450/mo (>1,500)' : '450 €/mes (>1.500)')}
                    </strong>
                  </span>
                </div>
                {!isAutoDetected && onUpdateInputs && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateInputs({
                        subscriptionTier: autoTier,
                        subscriptionPrice: autoPrice,
                      });
                    }}
                    className={`px-2 py-1 rounded-md text-[10px] font-semibold border transition cursor-pointer ${
                      isDark
                        ? 'bg-[#151226] hover:bg-[#25203D] text-[#47D2BF] border-[#47D2BF]/40'
                        : 'bg-white hover:bg-purple-50 text-[#6B4ABF] border-purple-200'
                    }`}
                    title={language === 'en' ? 'Revert to auto-detected tier' : 'Restablecer tramo detectado automáticamente'}
                  >
                    {language === 'en' ? 'Reset Auto' : 'Restablecer Auto'}
                  </button>
                )}
              </div>
            </div>

            {/* Alerta si el plan seleccionado excede el tope */}
            {isExceeding && (
              <div className="mb-2.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span>
                  <strong>{language === 'en' ? 'Volume Notice:' : 'Aviso de volumen:'}</strong>{' '}
                  {language === 'en'
                    ? `Client estimated volume of ${currentOrders.toLocaleString()} orders/mo exceeds the limit of ${selectedConfig.label}. Recommended: ${autoTier === 'tier-150' ? 'Plan €150/mo' : 'Plan €450/mo'}.`
                    : `El volumen de ${currentOrders.toLocaleString()} pedidos/mes supera el cupo de ${selectedConfig.label}. Recomendado: ${autoTier === 'tier-150' ? 'Plan 150 €/mes' : 'Plan 450 €/mes'}.`}
                </span>
              </div>
            )}

            {/* Grid de los 3 Planes interactivos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {tierConfigs.map((tier) => {
                const isSelected = currentTier === tier.key;
                const isAuto = autoTier === tier.key;

                return (
                  <button
                    key={tier.key}
                    type="button"
                    onClick={() => {
                      if (onUpdateInputs) {
                        onUpdateInputs({
                          subscriptionTier: tier.key,
                          subscriptionPrice: tier.price,
                        });
                      }
                    }}
                    className={`p-2.5 rounded-lg border text-left transition relative cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? isDark
                          ? 'bg-[#2A2346] border-[#47D2BF] ring-1.5 ring-[#47D2BF]/40 shadow-xs'
                          : 'bg-purple-50/70 border-[#6B4ABF] ring-1.5 ring-[#6B4ABF]/30 shadow-xs'
                        : isDark
                        ? 'bg-[#151226] border-[#2E2A48] hover:border-[#47D2BF]/50 hover:bg-[#1f1b36]'
                        : 'bg-[#FAF7F2] border-[#E5DDD0] hover:border-[#6B4ABF]/40 hover:bg-[#f4efe6]'
                    }`}
                  >
                    {isAuto && !isSelected && (
                      <span className="absolute -top-2 right-2.5 px-1.5 py-0.2 text-[8.5px] font-bold uppercase rounded-full bg-emerald-500 text-white shadow-xs">
                        {language === 'en' ? 'Auto-detect' : 'Detectado auto'}
                      </span>
                    )}
                    {isSelected && (
                      <span className={`absolute -top-2 right-2.5 px-1.5 py-0.2 text-[8.5px] font-bold uppercase rounded-full flex items-center gap-1 shadow-xs ${
                        isDark ? 'bg-[#47D2BF] text-gray-950' : 'bg-[#6B4ABF] text-white'
                      }`}>
                        <Check className="w-2.5 h-2.5 stroke-[3]" /> {language === 'en' ? 'Active' : 'Activo'}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? (isDark ? 'text-white' : 'text-[#6B4ABF]') : (isDark ? 'text-gray-200' : 'text-[#2D2825]')}`}>
                          {tier.name}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-baseline gap-1">
                        <span className={`text-lg font-black tracking-tight font-mono ${
                          isSelected ? (isDark ? 'text-[#47D2BF]' : 'text-[#6B4ABF]') : (isDark ? 'text-white' : 'text-[#2D2825]')
                        }`}>
                          {formatEur(tier.price)}
                        </span>
                        <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
                          {language === 'en' ? '/ mo' : '/ mes'}
                        </span>
                      </div>
                      <div className={`mt-0.5 text-[10px] font-semibold ${
                        isSelected ? (isDark ? 'text-[#47D2BF]' : 'text-purple-700') : (isDark ? 'text-gray-400' : 'text-[#8C8278]')
                      }`}>
                        {tier.badge}
                      </div>
                      <p className={`mt-1 text-[10.5px] leading-snug line-clamp-2 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
                        {tier.desc}
                      </p>
                    </div>

                    <div className={`mt-2 pt-1.5 border-t text-[10px] flex justify-between items-center ${
                      isDark ? 'border-[#2E2A48]' : 'border-[#E5DDD0]'
                    }`}>
                      <span className={isDark ? 'text-gray-400' : 'text-[#8C8278]'}>
                        {language === 'en' ? 'Margin:' : 'Margen:'}
                      </span>
                      <span className="font-mono font-bold text-emerald-500">
                        {language === 'en' ? '100% (€0 cost)' : '100% (Coste 0€)'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Resumen Económico del Plan Activo */}
            <div className={`mt-2.5 p-2 rounded-lg flex flex-wrap items-center justify-between gap-2 text-[11px] border ${
              isDark ? 'bg-[#151226] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
            }`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={isDark ? 'text-gray-400' : 'text-[#6D635B]'}>
                  {language === 'en' ? 'Account impact:' : 'Impacto en cuenta:'}
                </span>
                <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                  {language === 'en' ? 'Monthly fee: ' : 'Facturación mensual: '}
                  <strong className={isDark ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}>
                    +{formatEur(results.subscriptionRevenueMonth)}{language === 'en' ? '/mo' : '/mes'}
                  </strong>
                </span>
                <span className="text-gray-400">·</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {language === 'en'
                    ? `Gross margin: 100% (+${formatEur(results.subscriptionRevenueMonth)} direct profit)`
                    : `Margen bruto: 100% (+${formatEur(results.subscriptionRevenueMonth)} beneficio directo)`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className={isDark ? 'text-gray-400' : 'text-[#8C8278]'}>
                  {language === 'en' ? 'Subscription ARR:' : 'ARR Suscripción:'}
                </span>
                <span className={`font-extrabold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                  +{formatEur(results.subscriptionRevenueMonth * 12)} {language === 'en' ? '/ yr' : '/ año'}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Planificación Go-Live & Proyecciones ARR / YRR */}
      <LiveDateScheduler
        goLiveDate={inputs?.goLiveDate || results.goLiveDate}
        results={results}
        onChange={(dateStr) => {
          if (onUpdateInputs) {
            onUpdateInputs({ goLiveDate: dateStr });
          }
        }}
      />

      {/* OPERACIONES DE PREPARACIÓN & PICKING: PACK Y 1ER PICK SEPARADOS */}
      <div className={`rounded-xl border p-5 shadow-2xs transition-colors duration-200 ${
        isDark
          ? 'bg-[#1E1B2E] border-[#2E2A48]'
          : 'bg-white border-[#E5DDD0]'
      }`}>
        <div className={`flex items-center gap-2 border-b pb-3 mb-4 ${
          isDark ? 'border-[#2E2A48]' : 'border-[#EFE8DC]'
        }`}>
          <Package className={`w-5 h-5 ${isDark ? 'text-[#47D2BF]' : 'text-[#6B4ABF]'}`} />
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-wide ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
              {language === 'en'
                ? 'Order Preparation & Picking (Pack & 1st Pick)'
                : 'Preparación de Pedido & Picking (Pack & 1er Pick)'}
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en'
                ? 'Separate operational rates: base packaging material and physical picking per unit.'
                : 'Tarifas operativas separadas: material de packaging base y picking físico por unidad.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pack Component */}
          <div className={`p-3.5 rounded-lg border ${
            isDark
              ? 'bg-[#151226] border-[#2E2A48]'
              : 'bg-[#FAF7F2] border-[#E5DDD0]'
          }`}>
            <div className="flex justify-between items-center mb-1">
              <span className={`text-xs font-bold ${isDark ? 'text-gray-200' : 'text-[#2D2825]'}`}>
                {language === 'en' ? '1. Base preparation (Pack)' : '1. Preparación base (Pack)'}
              </span>
              <span className={`text-sm font-mono font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                {formatEur(results.packPrice)}
              </span>
            </div>
            <div className={`text-[11px] space-y-0.5 mt-2 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Operational cost:' : 'Coste operativo:'}</span>
                <span className={`font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>{formatEur(results.packCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Applied margin:' : 'Margen aplicado:'}</span>
                <span className={`font-mono font-medium ${isDark ? 'text-[#47D2BF]' : 'text-emerald-700'}`}>
                  {formatPct(results.packMargin)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Markup over cost:' : 'Markup s/coste:'}</span>
                <span className={`font-mono font-medium ${isDark ? 'text-purple-300' : 'text-blue-700'}`}>
                  {formatMarkup(results.packMarkup)}
                </span>
              </div>
            </div>
          </div>

          {/* 1st Pick Component */}
          <div className={`p-3.5 rounded-lg border ${
            isDark
              ? 'bg-[#151226] border-[#2E2A48]'
              : 'bg-[#FAF7F2] border-[#E5DDD0]'
          }`}>
            <div className="flex justify-between items-center mb-1">
              <span className={`text-xs font-bold ${isDark ? 'text-gray-200' : 'text-[#2D2825]'}`}>
                {language === 'en' ? '2. First Pick (1st unit)' : '2. Primer Pick (1ª unidad)'}
              </span>
              <span className={`text-sm font-mono font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                {formatEur(results.firstPickPrice)}
              </span>
            </div>
            <div className={`text-[11px] space-y-0.5 mt-2 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Operational cost:' : 'Coste operativo:'}</span>
                <span className={`font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>{formatEur(results.firstPickCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Applied margin:' : 'Margen aplicado:'}</span>
                <span className={`font-mono font-medium ${isDark ? 'text-[#47D2BF]' : 'text-emerald-700'}`}>
                  {formatPct(results.firstPickMargin)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Markup over cost:' : 'Markup s/coste:'}</span>
                <span className={`font-mono font-medium ${isDark ? 'text-purple-300' : 'text-blue-700'}`}>
                  {formatMarkup(results.firstPickMarkup)}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Picks Component */}
          <div className={`p-3.5 rounded-lg border ${
            isDark
              ? 'bg-[#151226] border-[#2E2A48]'
              : 'bg-[#FAF7F2] border-[#E5DDD0]'
          }`}>
            <div className="flex justify-between items-center mb-1">
              <span className={`text-xs font-bold ${isDark ? 'text-gray-200' : 'text-[#2D2825]'}`}>
                {language === 'en' ? '3. Additional picks (> 1 unit)' : '3. Picks adicionales (> 1 unit)'}
              </span>
              <span className={`text-sm font-mono font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                {formatEur(results.additionalPickPrice)}
              </span>
            </div>
            <div className={`text-[11px] space-y-0.5 mt-2 ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Operating cost / pick:' : 'Coste operativo / pick:'}</span>
                <span className={`font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>{formatEur(results.additionalPickCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Applied margin:' : 'Margen aplicado:'}</span>
                <span className={`font-mono font-medium ${isDark ? 'text-[#47D2BF]' : 'text-emerald-700'}`}>
                  {formatPct(results.additionalPickMargin)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Markup over cost:' : 'Markup s/coste:'}</span>
                <span className={`font-mono font-medium ${isDark ? 'text-purple-300' : 'text-blue-700'}`}>
                  {formatMarkup(results.additionalPickMarkup)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CARRIER & DETAILED SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Resumen por Pedido */}
        <div className={`lg:col-span-2 rounded-xl border overflow-hidden shadow-2xs transition-colors duration-200 ${
          isDark
            ? 'bg-[#1E1B2E] border-[#2E2A48]'
            : 'bg-white border-[#E5DDD0]'
        }`}>
          <div className={`px-5 py-3.5 border-b flex justify-between items-center flex-wrap gap-2 ${
            isDark
              ? 'bg-[#252238] border-[#2E2A48]'
              : 'bg-[#F4EEE4] border-[#E5DDD0]'
          }`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
              {language === 'en' ? 'Detailed Breakdown per Order' : 'Desglose Detallado por Pedido'}
            </h3>
            <span className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-[#6D635B]'}`}>
              {language === 'en' ? 'Average invoice total: ' : 'Total factura medio: '}
              <strong className={isDark ? 'text-white' : 'text-[#2D2825]'}>
                {formatEur(results.orderRevenueExShipping + results.shippingPrice)}
              </strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className={`font-semibold uppercase text-[10px] border-b ${
                isDark
                  ? 'bg-[#1c182d] text-gray-300 border-[#2E2A48]'
                  : 'bg-[#EFE8DC] text-[#4D453E] border-[#E5DDD0]'
              }`}>
                <tr>
                  <th className="px-4 py-2.5">{language === 'en' ? 'Operational Item' : 'Concepto Operativo'}</th>
                  <th className="px-3 py-2.5 text-right">{language === 'en' ? 'Cost' : 'Coste'}</th>
                  <th className="px-3 py-2.5 text-right">{language === 'en' ? 'Margin' : 'Margen'}</th>
                  <th className={`px-3 py-2.5 text-right ${isDark ? 'text-purple-300' : 'text-blue-700'}`}>Markup</th>
                  <th className={`px-4 py-2.5 text-right font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>{language === 'en' ? 'Sale Price' : 'Precio Venta'}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#2E2A48]' : 'divide-[#EFE8DC]'}`}>
                {/* 1. Preparación base Pack */}
                <tr className={`transition ${isDark ? 'hover:bg-[#25203D]' : 'hover:bg-[#FAF7F2]'}`}>
                  <td className={`px-4 py-2.5 font-medium ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    <div>{language === 'en' ? 'Base preparation (Pack)' : 'Preparación base (Pack)'}</div>
                    <div className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-[#8C8278]'}`}>
                      {language === 'en'
                        ? 'Box/envelope, packaging material and base handling (Calculator)'
                        : 'Caja/sobre, packaging y manipulado base (Calculadora)'}
                    </div>
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
                    {formatEur(results.packCost)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono font-semibold ${isDark ? 'text-[#47D2BF]' : 'text-emerald-700'}`}>
                    {formatPct(results.packMargin)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono font-semibold ${isDark ? 'text-purple-300' : 'text-blue-700'}`}>
                    {formatMarkup(results.packMarkup)}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    {formatEur(results.packPrice)}
                  </td>
                </tr>

                {/* 2. 1er Pick */}
                <tr className={`transition ${isDark ? 'hover:bg-[#25203D]' : 'hover:bg-[#FAF7F2]'}`}>
                  <td className={`px-4 py-2.5 font-medium ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    <div>{language === 'en' ? '1st Pick (1st unit)' : '1er Pick (1ª unidad)'}</div>
                    <div className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-[#8C8278]'}`}>
                      {language === 'en' ? 'Picking of the first unit in the order' : 'Picking de la primera unidad del pedido'}
                    </div>
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
                    {formatEur(results.firstPickCost)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono font-semibold ${isDark ? 'text-[#47D2BF]' : 'text-emerald-700'}`}>
                    {formatPct(results.firstPickMargin)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono font-semibold ${isDark ? 'text-purple-300' : 'text-blue-700'}`}>
                    {formatMarkup(results.firstPickMarkup)}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    {formatEur(results.firstPickPrice)}
                  </td>
                </tr>

                {/* 3. Picks adicionales */}
                <tr className={`transition ${isDark ? 'hover:bg-[#25203D]' : 'hover:bg-[#FAF7F2]'}`}>
                  <td className={`px-4 py-2.5 font-medium ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    <div>{language === 'en' ? 'Additional picks (> 1 unit)' : 'Picks adicionales (> 1 unidad)'}</div>
                    <div className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-[#8C8278]'}`}>
                      {language === 'en'
                        ? `Per extra unit (current average: ${(results.unitsPerOrder - 1).toFixed(1)} extra units)`
                        : `Por unidad extra (media actual: ${(results.unitsPerOrder - 1).toFixed(1)} uds extras)`}
                    </div>
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
                    {formatEur(results.additionalPickCost)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono font-semibold ${isDark ? 'text-[#47D2BF]' : 'text-emerald-700'}`}>
                    {formatPct(results.additionalPickMargin)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono font-semibold ${isDark ? 'text-purple-300' : 'text-blue-700'}`}>
                    {formatMarkup(results.additionalPickMarkup)}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    {formatEur(results.additionalPickPrice)}
                  </td>
                </tr>

                {/* 5. Envío Transporte */}
                <tr className={`transition ${isDark ? 'hover:bg-[#25203D]' : 'hover:bg-[#FAF7F2]'}`}>
                  <td className={`px-4 py-2.5 font-medium ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    <div>{language === 'en' ? 'Shipping (Carrier)' : 'Envío Transporte (Carrier)'}</div>
                    <div className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-[#8C8278]'}`}>
                      {language === 'en' ? 'National standard 24-48h parcel delivery' : 'Tarifa nacional peninsular 24-48h'}
                    </div>
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
                    {formatEur(results.carrierCost)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono font-semibold ${isDark ? 'text-[#47D2BF]' : 'text-emerald-700'}`}>
                    {formatPct(results.shippingMargin)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono font-semibold ${isDark ? 'text-purple-300' : 'text-blue-700'}`}>
                    {formatMarkup(results.shippingMarkup)}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono font-bold ${isDark ? 'text-[#47D2BF]' : 'text-blue-700'}`}>
                    {formatEur(results.shippingPrice)}
                  </td>
                </tr>

                {/* Cuota Suscripción Mensual Huboo */}
                {results.subscriptionRevenueMonth > 0 && (
                  <tr className={`transition ${isDark ? 'hover:bg-[#25203D]' : 'hover:bg-[#FAF7F2]'}`}>
                    <td className={`px-4 py-2.5 font-medium ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                      <div className="flex items-center gap-1.5">
                        <span>{language === 'en' ? 'Huboo Monthly Subscription' : 'Cuota Suscripción Huboo'}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          isDark ? 'bg-[#47D2BF]/20 text-[#47D2BF]' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {results.subscriptionTier === 'tier-50' && (language === 'en' ? 'Plan €50/mo' : 'Plan 50€/mes')}
                          {results.subscriptionTier === 'tier-150' && (language === 'en' ? 'Plan €150/mo' : 'Plan 150€/mes')}
                          {results.subscriptionTier === 'tier-450' && (language === 'en' ? 'Plan €450/mo' : 'Plan 450€/mes')}
                          {results.subscriptionTier === 'custom' && (language === 'en' ? 'Custom' : 'Personalizado')}
                        </span>
                      </div>
                      <div className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-[#8C8278]'}`}>
                        {language === 'en'
                          ? `Fixed monthly platform plan: ${formatEur(results.subscriptionRevenueMonth)}/mo (prorated ~${formatEur(results.subscriptionRevenueMonth / (results.ordersMonth || 1))}/order)`
                          : `Cuota fija mensual de plataforma: ${formatEur(results.subscriptionRevenueMonth)}/mes (~${formatEur(results.subscriptionRevenueMonth / (results.ordersMonth || 1))}/pedido prorrateado)`}
                      </div>
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
                      {formatEur(0)}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono font-semibold text-emerald-500`}>
                      100.0%
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono font-semibold ${isDark ? 'text-purple-300' : 'text-blue-700'}`}>
                      N/A
                    </td>
                    <td className={`px-4 py-2.5 text-right font-mono font-bold ${isDark ? 'text-[#47D2BF]' : 'text-purple-700'}`}>
                      {formatEur(results.subscriptionRevenueMonth / (results.ordersMonth || 1))} <span className="text-[10px] font-normal opacity-70">{language === 'en' ? '/order' : '/ped'}</span>
                    </td>
                  </tr>
                )}

                {/* 6. Total Facturado Pedido */}
                <tr className={`font-bold border-t ${
                  isDark
                    ? 'bg-[#252238] border-[#2E2A48]'
                    : 'bg-[#F4EEE4] border-[#E5DDD0]'
                }`}>
                  <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    {language === 'en' ? 'TOTAL ESTIMATED PER ORDER (WITH SHIPPING)' : 'TOTAL ESTIMADO POR PEDIDO (CON ENVÍO)'}
                  </td>
                  <td className={`px-3 py-3 text-right font-mono ${isDark ? 'text-gray-300' : 'text-[#4D453E]'}`}>
                    {formatEur(results.orderCostExShipping + results.carrierCost)}
                  </td>
                  <td className={`px-3 py-3 text-right font-mono font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                    {formatPct(results.marginTotal)}
                  </td>
                  <td className={`px-3 py-3 text-right font-mono font-bold ${isDark ? 'text-purple-300' : 'text-blue-700'}`}>
                    {formatMarkup(results.markupTotal)}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono font-black text-sm ${isDark ? 'text-[#47D2BF]' : 'text-[#2D2825]'}`}>
                    {formatEur(results.orderRevenueExShipping + results.shippingPrice)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Envío & Alertas */}
        <div className="space-y-4">
          {/* Carrier Card */}
          <div className={`p-4 rounded-xl border shadow-2xs transition-colors duration-200 ${
            isDark
              ? 'bg-[#1E1B2E] border-[#2E2A48]'
              : 'bg-white border-[#E5DDD0]'
          }`}>
            <div className={`flex items-center gap-2 pb-2 mb-3 border-b ${
              isDark ? 'border-[#2E2A48]' : 'border-[#EFE8DC]'
            }`}>
              <Truck className={`w-4 h-4 ${isDark ? 'text-[#47D2BF]' : 'text-blue-600'}`} />
              <h3 className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                {language === 'en' ? 'Shipping (Carrier Cost + Margin)' : 'Envío (Carrier Cost + Margen)'}
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className={isDark ? 'text-gray-400' : 'text-[#6D635B]'}>
                  {language === 'en' ? 'Carrier base cost:' : 'Carrier Coste base:'}
                </span>
                <span className={`font-mono font-bold ${isDark ? 'text-gray-200' : 'text-[#2D2825]'}`}>
                  {formatEur(results.carrierCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-gray-400' : 'text-[#6D635B]'}>
                  {language === 'en' ? 'Target carrier margin:' : 'Margen carrier objetivo:'}
                </span>
                <div className="text-right">
                  <span className={`font-mono font-semibold block ${isDark ? 'text-[#47D2BF]' : 'text-blue-600'}`}>
                    {formatPct(results.shippingMargin)}
                  </span>
                  <span className={`text-[10px] font-mono ${isDark ? 'text-gray-400' : 'text-[#8C8278]'}`}>
                    Markup: {formatMarkup(results.shippingMarkup)}
                  </span>
                </div>
              </div>
              <div className={`flex justify-between pt-2 border-t items-baseline ${
                isDark ? 'border-[#2E2A48]' : 'border-[#EFE8DC]'
              }`}>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-[#2D2825]'}`}>
                  {language === 'en' ? 'Shipping Sale Price:' : 'Precio Venta Envío:'}
                </span>
                <span className={`font-mono font-extrabold text-sm ${isDark ? 'text-[#47D2BF]' : 'text-blue-700'}`}>
                  {formatEur(results.shippingPrice)}
                </span>
              </div>
              <div className={`text-[11px] font-medium text-right ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {language === 'en' ? 'Net contribution: +' : 'Contribución neta: +'}{formatEur(results.shippingProfitPerOrder)} {language === 'en' ? '/ shipment' : '/ envío'}
              </div>
            </div>
          </div>

          {/* Alertas Operativas */}
          <div className={`p-4 rounded-xl border shadow-2xs transition-colors duration-200 ${
            isDark
              ? 'bg-[#1E1B2E] border-[#2E2A48]'
              : 'bg-white border-[#E5DDD0]'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wide mb-2.5 flex items-center gap-1.5 ${
              isDark ? 'text-white' : 'text-[#2D2825]'
            }`}>
              <Info className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <span>{language === 'en' ? 'Validations & Alerts' : 'Validaciones y Alertas'}</span>
            </h3>

            {results.alerts.length === 0 ? (
              <div className={`flex items-center gap-2 text-xs p-2.5 rounded-lg border ${
                isDark
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>
                  {language === 'en'
                    ? 'Balanced margins and prices with no operational warnings detected.'
                    : 'Márgenes y precios equilibrados sin alertas operativas detectadas.'}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {results.alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 text-[11px] p-2.5 rounded-lg border ${
                      isDark
                        ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                        : 'bg-amber-50 text-amber-900 border-amber-200'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{translateAlert(alert)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Modal for Internal PDF Presentation */}
      <InternalReportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        results={results}
        inputs={effectiveInputs}
      />
    </div>
  );
};
