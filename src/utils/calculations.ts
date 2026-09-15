import {
  CalculatorInputs,
  CalculationResults,
  MonthlyLine,
  OrderSummaryItem,
  PackType,
  Currency,
} from '../types';
import {
  PACK_TYPES,
  PACK_PRICES,
  PACK_COSTS_CALCULATOR,
  BASE_FIRST_PICK_COST,
  BASE_ADDITIONAL_PICK_COST,
} from '../data/constants';

export function getSkuTier(skuCount: number): {
  tierName: string;
  skuMultiplier: number;
  targetPickMarginDefault: number;
} {
  if (skuCount <= 20) {
    return { tierName: 'Simple', skuMultiplier: 1.0, targetPickMarginDefault: 0.28 };
  } else if (skuCount <= 100) {
    return { tierName: 'Medio', skuMultiplier: 1.1, targetPickMarginDefault: 0.35 };
  } else {
    return { tierName: 'Complejo', skuMultiplier: 1.3, targetPickMarginDefault: 0.42 };
  }
}

export function priceFromCostMargin(cost: number, targetMargin: number): number {
  const c = Number(cost) || 0.0;
  let tm = Number(targetMargin) || 0.0;
  tm = Math.max(0.0, Math.min(tm, 0.95));
  const denom = 1.0 - tm;
  return denom > 0 ? c / denom : c;
}

export function marginFromPrice(price: number, cost: number): number | null {
  const p = Number(price);
  const c = Number(cost);
  if (isNaN(p) || isNaN(c) || p === 0) {
    return null;
  }
  return (p - c) / p;
}

export function markupFromPrice(price: number, cost: number): number | null {
  const p = Number(price);
  const c = Number(cost);
  if (isNaN(p) || isNaN(c) || c <= 0) {
    return null;
  }
  return (p - c) / c;
}

let currentCurrency: Currency = 'EUR';

export function setActiveCurrency(curr: Currency): void {
  currentCurrency = curr;
}

export function getActiveCurrency(): Currency {
  return currentCurrency;
}

export function getCurrencySymbol(curr: Currency = currentCurrency): string {
  switch (curr) {
    case 'GBP':
      return '£';
    case 'USD':
      return '$';
    case 'EUR':
    default:
      return '€';
  }
}

export function formatCurrency(
  value: number | null | undefined,
  curr: Currency = currentCurrency
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'n/a';
  }
  const num = Number(value);
  switch (curr) {
    case 'GBP':
      return `£${num.toLocaleString('en-GB', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    case 'USD':
      return `$${num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    case 'EUR':
    default:
      return `${num.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} €`;
  }
}

export function formatEur(
  value: number | null | undefined,
  curr?: Currency
): string {
  return formatCurrency(value, curr || currentCurrency);
}

export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'n/a';
  }
  return `${(value * 100).toFixed(1)}%`;
}

export function formatMarkup(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'n/a';
  }
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${(value * 100).toFixed(1)}%`;
}

export function calculateAll(inputs: CalculatorInputs): CalculationResults {
  const {
    clientName,
    skuCount,
    volumeMode,
    workingDays,
    unitsPerOrder,
    mixSpk,
    mixSpl,
    mixMpl,
    mixLpl,
    packPriceMode,
    packMarginTarget,
    packPriceManual,
    packCostOverride,
    firstPickPriceMode,
    firstPickMarginTarget,
    firstPickPriceManual,
    firstPickCostOverride,
    additionalPickPriceMode,
    additionalPickMarginTarget,
    additionalPickPriceManual,
    additionalPickCostOverride,
    prepPlusFirstPickPriceManual,
    prepPlusFirstPickCostOverride,
    prepPlusFirstPickPriceMode,
    prepPlusFirstPickMarginTarget,
    shippingPriceMode,
    carrierCost,
    shippingMarginTarget,
    shippingPriceManual,
    customPackaging = false,
    insertsPerOrder,
    insertPrice,
    insertCost,
    packagingPrice,
    packagingCost,
    returnRate,
    returnHandlingPrice,
    returnHandlingCost,
    goodsInPalletsMonth,
    goodsInPrice,
    goodsInCost,
    storagePalletWeeksMonth,
    storagePrice,
    storageCost,
  } = inputs;

  const { tierName, skuMultiplier, targetPickMarginDefault } = getSkuTier(Number(skuCount));
  const productPickMultiplier = 1.0;

  // Orders volume
  let ordersPerDay = inputs.ordersPerDay;
  let ordersMonth = inputs.ordersMonth;

  if (volumeMode === 'Pedidos/día') {
    ordersMonth = Number(ordersPerDay) * Number(workingDays);
  } else {
    ordersPerDay = workingDays > 0 ? Number(ordersMonth) / Number(workingDays) : 0;
  }

  // Pack costs & mix: Siempre calculadora
  const packCosts = PACK_COSTS_CALCULATOR;

  const mixRaw: Record<PackType, number> = {
    SPK: Number(mixSpk),
    SPL: Number(mixSpl),
    MPL: Number(mixMpl),
    LPL: Number(mixLpl),
  };

  const mixTotal = Object.values(mixRaw).reduce((a, b) => a + b, 0);
  const mix: Record<PackType, number> =
    mixTotal === 0
      ? { SPK: 0.25, SPL: 0.25, MPL: 0.25, LPL: 0.25 }
      : {
          SPK: mixRaw.SPK / mixTotal,
          SPL: mixRaw.SPL / mixTotal,
          MPL: mixRaw.MPL / mixTotal,
          LPL: mixRaw.LPL / mixTotal,
        };

  let defaultPackPriceFromMix = 0;
  let defaultPackCostFromMix = 0;
  for (const k of PACK_TYPES) {
    defaultPackPriceFromMix += mix[k] * PACK_PRICES[k];
    defaultPackCostFromMix += mix[k] * packCosts[k];
  }

  // 1. Preparación (Pack base)
  const defaultPackCost = defaultPackCostFromMix;
  const packCost =
    packCostOverride !== undefined && packCostOverride !== null && packCostOverride > 0
      ? Number(packCostOverride)
      : defaultPackCost;

  let packPrice = 0;
  if (packPriceMode === 'margin') {
    packPrice = priceFromCostMargin(packCost, packMarginTarget);
  } else {
    packPrice = Number(packPriceManual) || defaultPackPriceFromMix;
  }
  const packMargin = marginFromPrice(packPrice, packCost);

  // 2. 1er Pick
  const defaultFirstPickCost = BASE_FIRST_PICK_COST * skuMultiplier;
  const firstPickCost =
    firstPickCostOverride !== undefined && firstPickCostOverride !== null && firstPickCostOverride > 0
      ? Number(firstPickCostOverride)
      : defaultFirstPickCost;

  let firstPickPrice = 0;
  if (firstPickPriceMode === 'margin') {
    firstPickPrice = priceFromCostMargin(firstPickCost, firstPickMarginTarget);
  } else {
    firstPickPrice = Number(firstPickPriceManual) || 0.0;
  }
  const firstPickMargin = marginFromPrice(firstPickPrice, firstPickCost);

  // 3. COMBINADO: Preparación (Pack) + 1er Pick
  const defaultPrepPlusFirstPickCost = packCost + firstPickCost;
  const prepPlusFirstPickCost =
    prepPlusFirstPickCostOverride !== undefined && prepPlusFirstPickCostOverride !== null && prepPlusFirstPickCostOverride > 0
      ? Number(prepPlusFirstPickCostOverride)
      : defaultPrepPlusFirstPickCost;

  let prepPlusFirstPickPrice = packPrice + firstPickPrice;
  if (
    prepPlusFirstPickPriceMode === 'margin' &&
    prepPlusFirstPickMarginTarget !== undefined &&
    prepPlusFirstPickMarginTarget !== null
  ) {
    prepPlusFirstPickPrice = priceFromCostMargin(prepPlusFirstPickCost, prepPlusFirstPickMarginTarget);
  } else if (
    prepPlusFirstPickPriceManual !== undefined &&
    prepPlusFirstPickPriceManual !== null &&
    prepPlusFirstPickPriceManual > 0
  ) {
    prepPlusFirstPickPrice = Number(prepPlusFirstPickPriceManual);
  } else {
    prepPlusFirstPickPrice = packPrice + firstPickPrice;
  }
  const prepPlusFirstPickMargin = marginFromPrice(prepPlusFirstPickPrice, prepPlusFirstPickCost);
  const prepPlusFirstPickProfit = prepPlusFirstPickPrice - prepPlusFirstPickCost;

  // 4. Picks Adicionales (>1 unidad)
  const defaultAdditionalPickCost = BASE_ADDITIONAL_PICK_COST * skuMultiplier;
  const additionalPickCost =
    additionalPickCostOverride !== undefined && additionalPickCostOverride !== null && additionalPickCostOverride > 0
      ? Number(additionalPickCostOverride)
      : defaultAdditionalPickCost;

  let additionalPickPrice = 0;
  if (additionalPickPriceMode === 'margin') {
    additionalPickPrice = priceFromCostMargin(additionalPickCost, additionalPickMarginTarget);
  } else {
    additionalPickPrice = Number(additionalPickPriceManual) || 0.0;
  }
  const additionalPickMargin = marginFromPrice(additionalPickPrice, additionalPickCost);

  const additionalPicksPerOrder = Math.max(0.0, Number(unitsPerOrder) - 1.0);
  const additionalPicksCostTotal = additionalPicksPerOrder * additionalPickCost;
  const additionalPicksPriceTotal = additionalPicksPerOrder * additionalPickPrice;

  // Picking total (1st + Adicionales)
  const totalPickPricePerOrder = firstPickPrice + additionalPicksPriceTotal;
  const totalPickCostPerOrder = firstPickCost + additionalPicksCostTotal;
  const marginPick = marginFromPrice(totalPickPricePerOrder, totalPickCostPerOrder);

  // 5. Envío (Carrier)
  let shippingPrice = 0;
  if (shippingPriceMode === 'margin') {
    shippingPrice =
      Number(carrierCost) / Math.max(1.0 - Number(shippingMarginTarget), 0.01);
  } else {
    shippingPrice = Number(shippingPriceManual) || Number(carrierCost);
  }
  const shippingMargin = marginFromPrice(shippingPrice, Number(carrierCost));
  const shippingProfitPerOrder = shippingPrice - Number(carrierCost);

  // 6. Servicios Unitarios por Pedido
  const hasCustomPackaging = Boolean(customPackaging);
  const insertRevenuePerOrder = Number(insertsPerOrder) * Number(insertPrice);
  const insertCostPerOrder = Number(insertsPerOrder) * Number(insertCost);

  // Si el cliente tiene packaging personalizado propio, nuestro packaging base se cancela (0€)
  const packagingPricePerOrder = hasCustomPackaging ? 0 : Number(packagingPrice);
  const packagingCostPerOrder = hasCustomPackaging ? 0 : Number(packagingCost);

  const surchargePricePerOrder = 0;
  const surchargeCostPerOrder = 0;

  const returnRevenuePerOrder = Number(returnRate) * Number(returnHandlingPrice);
  const returnCostPerOrder = Number(returnRate) * Number(returnHandlingCost);

  // Pedido sin envío (Preparación + Picking + Servicios)
  const orderRevenueExShipping =
    prepPlusFirstPickPrice +
    additionalPicksPriceTotal +
    insertRevenuePerOrder +
    packagingPricePerOrder +
    returnRevenuePerOrder;

  const orderCostExShipping =
    prepPlusFirstPickCost +
    additionalPicksCostTotal +
    insertCostPerOrder +
    packagingCostPerOrder +
    returnCostPerOrder;

  const orderProfitExShipping = orderRevenueExShipping - orderCostExShipping;
  const marginOrderExShipping = marginFromPrice(orderRevenueExShipping, orderCostExShipping);

  // 7. Mensual Operativo
  const orderRevenueMonth = orderRevenueExShipping * Number(ordersMonth);
  const orderCostMonth = orderCostExShipping * Number(ordersMonth);

  const goodsInRevenueMonth = Number(goodsInPalletsMonth) * Number(goodsInPrice);
  const goodsInCostMonth = Number(goodsInPalletsMonth) * Number(goodsInCost);

  const storageRevenueMonth = Number(storagePalletWeeksMonth) * Number(storagePrice);
  const storageCostMonth = Number(storagePalletWeeksMonth) * Number(storageCost);

  const fulfilmentRevenueMonthExShipping =
    orderRevenueMonth + goodsInRevenueMonth + storageRevenueMonth;
  const fulfilmentCostMonthExShipping =
    orderCostMonth + goodsInCostMonth + storageCostMonth;

  // Mensual Envío
  const shippingRevenueMonth = shippingPrice * Number(ordersMonth);
  const shippingCostMonth = Number(carrierCost) * Number(ordersMonth);

  // Totales Mensuales
  const totalRevenueMonth = fulfilmentRevenueMonthExShipping + shippingRevenueMonth;
  const totalCostMonth = fulfilmentCostMonthExShipping + shippingCostMonth;
  const totalProfitMonth = totalRevenueMonth - totalCostMonth;

  // Márgenes Globales
  const marginTotal = marginFromPrice(totalRevenueMonth, totalCostMonth);
  const marginExShipping = marginFromPrice(
    fulfilmentRevenueMonthExShipping,
    fulfilmentCostMonthExShipping
  );
  const marginShipping = marginFromPrice(shippingRevenueMonth, shippingCostMonth);

  const profitPerOrder =
    Number(ordersMonth) > 0 ? totalProfitMonth / Number(ordersMonth) : 0.0;

  // Alertas inteligentes
  const alerts: string[] = [];

  if (ordersMonth > 0 && marginTotal !== null && marginTotal < 0.2) {
    alerts.push('El margen total mensual está por debajo del 20%. Considera ajustar márgenes o precios.');
  }

  if (prepPlusFirstPickPrice < prepPlusFirstPickCost) {
    alerts.push('¡Atención! El fee de Preparación + 1er Pick está por debajo de su coste operativo.');
  }

  if (firstPickPrice < firstPickCost) {
    alerts.push('El primer pick se está cobrando por debajo de su coste ajustado.');
    if (additionalPickPrice > additionalPickCost) {
      const breakevenUnits =
        1 + (firstPickCost - firstPickPrice) / (additionalPickPrice - additionalPickCost);
      if (Number(unitsPerOrder) < breakevenUnits) {
        alerts.push(
          `Con primer pick subsidiado, el break-even es ${breakevenUnits.toFixed(
            2
          )} units/pedido. Tu units/order es ${Number(unitsPerOrder).toFixed(2)}.`
        );
      }
    } else {
      alerts.push(
        'El pick adicional no tiene contribución positiva; no compensa el primer pick subsidiado.'
      );
    }
  }

  if (shippingMargin !== null && shippingMargin < 0.1) {
    alerts.push('El margen de envío es bajo (<10%). Podría absorber subidas de tarifas de carrier.');
  }

  if (Number(carrierCost) >= shippingPrice) {
    alerts.push('El precio de venta de envío es igual o inferior al coste del carrier (margen negativo o nulo).');
  }

  // Monthly breakdown lines
  const lines: MonthlyLine[] = [
    {
      linea: 'Preparación base (Pack)',
      categoria: 'Preparación',
      unitPrice: packPrice,
      unitCost: packCost,
      ingresos: packPrice * Number(ordersMonth),
      costes: packCost * Number(ordersMonth),
      beneficio: (packPrice - packCost) * Number(ordersMonth),
      margen: marginFromPrice(packPrice * Number(ordersMonth), packCost * Number(ordersMonth)),
      markup: markupFromPrice(packPrice, packCost),
    },
    {
      linea: '1er Pick',
      categoria: 'Pick',
      unitPrice: firstPickPrice,
      unitCost: firstPickCost,
      ingresos: firstPickPrice * Number(ordersMonth),
      costes: firstPickCost * Number(ordersMonth),
      beneficio: (firstPickPrice - firstPickCost) * Number(ordersMonth),
      margen: marginFromPrice(firstPickPrice * Number(ordersMonth), firstPickCost * Number(ordersMonth)),
      markup: markupFromPrice(firstPickPrice, firstPickCost),
    },
    {
      linea: 'Picks adicionales (>1 unidad)',
      categoria: 'Pick',
      unitPrice: additionalPicksPriceTotal,
      unitCost: additionalPicksCostTotal,
      ingresos: additionalPicksPriceTotal * Number(ordersMonth),
      costes: additionalPicksCostTotal * Number(ordersMonth),
      beneficio: (additionalPicksPriceTotal - additionalPicksCostTotal) * Number(ordersMonth),
      margen: marginFromPrice(
        additionalPicksPriceTotal * Number(ordersMonth),
        additionalPicksCostTotal * Number(ordersMonth)
      ),
      markup: markupFromPrice(additionalPicksPriceTotal, additionalPicksCostTotal),
    },
    {
      linea: 'Inserts publicitarios',
      categoria: 'Servicios',
      unitPrice: insertRevenuePerOrder,
      unitCost: insertCostPerOrder,
      ingresos: insertRevenuePerOrder * Number(ordersMonth),
      costes: insertCostPerOrder * Number(ordersMonth),
      beneficio: (insertRevenuePerOrder - insertCostPerOrder) * Number(ordersMonth),
      margen: marginFromPrice(
        insertRevenuePerOrder * Number(ordersMonth),
        insertCostPerOrder * Number(ordersMonth)
      ),
      markup: markupFromPrice(insertRevenuePerOrder, insertCostPerOrder),
    },
    {
      linea: hasCustomPackaging
        ? 'Packaging base (Cancelado - Propio cliente)'
        : 'Packaging base',
      categoria: 'Servicios',
      unitPrice: packagingPricePerOrder,
      unitCost: packagingCostPerOrder,
      ingresos: packagingPricePerOrder * Number(ordersMonth),
      costes: packagingCostPerOrder * Number(ordersMonth),
      beneficio: (packagingPricePerOrder - packagingCostPerOrder) * Number(ordersMonth),
      margen: marginFromPrice(
        packagingPricePerOrder * Number(ordersMonth),
        packagingCostPerOrder * Number(ordersMonth)
      ),
      markup: markupFromPrice(packagingPricePerOrder, packagingCostPerOrder),
    },
    {
      linea: 'Devoluciones (Returns)',
      categoria: 'Servicios',
      unitPrice: returnRevenuePerOrder,
      unitCost: returnCostPerOrder,
      ingresos: returnRevenuePerOrder * Number(ordersMonth),
      costes: returnCostPerOrder * Number(ordersMonth),
      beneficio: (returnRevenuePerOrder - returnCostPerOrder) * Number(ordersMonth),
      margen: marginFromPrice(
        returnRevenuePerOrder * Number(ordersMonth),
        returnCostPerOrder * Number(ordersMonth)
      ),
      markup: markupFromPrice(returnRevenuePerOrder, returnCostPerOrder),
    },
    {
      linea: 'Goods-in (Recepción)',
      categoria: 'Almacén',
      unitPrice: Number(goodsInPrice),
      unitCost: Number(goodsInCost),
      ingresos: goodsInRevenueMonth,
      costes: goodsInCostMonth,
      beneficio: goodsInRevenueMonth - goodsInCostMonth,
      margen: marginFromPrice(goodsInRevenueMonth, goodsInCostMonth),
      markup: markupFromPrice(goodsInRevenueMonth, goodsInCostMonth),
    },
    {
      linea: 'Almacenaje (Storage)',
      categoria: 'Almacén',
      unitPrice: Number(storagePrice),
      unitCost: Number(storageCost),
      ingresos: storageRevenueMonth,
      costes: storageCostMonth,
      beneficio: storageRevenueMonth - storageCostMonth,
      margen: marginFromPrice(storageRevenueMonth, storageCostMonth),
      markup: markupFromPrice(storageRevenueMonth, storageCostMonth),
    },
    {
      linea: 'Envío (Carrier)',
      categoria: 'Envío',
      unitPrice: shippingPrice,
      unitCost: Number(carrierCost),
      ingresos: shippingRevenueMonth,
      costes: shippingCostMonth,
      beneficio: shippingRevenueMonth - shippingCostMonth,
      margen: marginFromPrice(shippingRevenueMonth, shippingCostMonth),
      markup: markupFromPrice(shippingRevenueMonth, shippingCostMonth),
    },
  ];

  const packMarkup = markupFromPrice(packPrice, packCost);
  const firstPickMarkup = markupFromPrice(firstPickPrice, firstPickCost);
  const prepPlusFirstPickMarkup = markupFromPrice(prepPlusFirstPickPrice, prepPlusFirstPickCost);
  const additionalPickMarkup = markupFromPrice(additionalPickPrice, additionalPickCost);
  const marginPickMarkup = markupFromPrice(totalPickPricePerOrder, totalPickCostPerOrder);
  const shippingMarkup = markupFromPrice(shippingPrice, Number(carrierCost));
  const markupOrderExShipping = markupFromPrice(orderRevenueExShipping, orderCostExShipping);
  const markupTotal = markupFromPrice(totalRevenueMonth, totalCostMonth);
  const markupExShipping = markupFromPrice(fulfilmentRevenueMonthExShipping, fulfilmentCostMonthExShipping);
  const markupShipping = markupFromPrice(shippingRevenueMonth, shippingCostMonth);

  const orderSummary: OrderSummaryItem[] = [
    {
      concepto: 'Preparación base (Pack)',
      valor: formatEur(packPrice),
      detalle: `Coste: ${formatEur(packCost)} | Margen: ${formatPct(packMargin)} | Markup: ${formatMarkup(packMarkup)}`,
    },
    {
      concepto: '1er Pick',
      valor: formatEur(firstPickPrice),
      detalle: `Coste: ${formatEur(firstPickCost)} | Margen: ${formatPct(firstPickMargin)} | Markup: ${formatMarkup(firstPickMarkup)}`,
    },
    {
      concepto: 'Total Preparación + 1er Pick (Base Pedido)',
      valor: formatEur(prepPlusFirstPickPrice),
      detalle: `Coste: ${formatEur(prepPlusFirstPickCost)} | Margen: ${formatPct(
        prepPlusFirstPickMargin
      )} | Markup: ${formatMarkup(prepPlusFirstPickMarkup)} | Beneficio: ${formatEur(prepPlusFirstPickProfit)}`,
    },
    {
      concepto: 'Picks adicionales (por unidad extra)',
      valor: formatEur(additionalPickPrice),
      detalle: `Coste: ${formatEur(additionalPickCost)} | Margen: ${formatPct(additionalPickMargin)} | Markup: ${formatMarkup(additionalPickMarkup)}`,
    },
    {
      concepto: 'Precio de venta Carrier (Envío)',
      valor: formatEur(shippingPrice),
      detalle: `Coste carrier: ${formatEur(carrierCost)} | Margen: ${formatPct(shippingMargin)} | Markup: ${formatMarkup(shippingMarkup)}`,
    },
    {
      concepto: 'Total facturado estimado por pedido (con envío)',
      valor: formatEur(orderRevenueExShipping + shippingPrice),
      detalle: `Coste total medio: ${formatEur(orderCostExShipping + carrierCost)} | Margen: ${formatPct(marginTotal)} | Markup: ${formatMarkup(markupTotal)}`,
    },
    {
      concepto: 'Beneficio neto estimado por pedido',
      valor: formatEur(profitPerOrder),
      detalle: `Beneficio operativo mensual estimado: ${formatEur(totalProfitMonth)}`,
    },
  ];

  // Proyecciones Anuales (ARR) y Planificación Go-Live (YRR)
  const arrRevenue = totalRevenueMonth * 12;
  const arrCost = totalCostMonth * 12;
  const arrProfit = totalProfitMonth * 12;

  // Fecha Go-Live (Planificación interna)
  const rawDateStr = inputs.goLiveDate || '2026-10-01';
  let liveDateObj = new Date(rawDateStr + 'T00:00:00');
  if (isNaN(liveDateObj.getTime())) {
    liveDateObj = new Date();
  }
  const goLiveDate = rawDateStr;
  const goLiveYear = liveDateObj.getFullYear();

  // Días y meses activos restantes en el año de go-live
  const startOfYear = new Date(goLiveYear, 0, 1, 0, 0, 0);
  const endOfYear = new Date(goLiveYear, 11, 31, 23, 59, 59, 999);
  const totalDaysInYear = Math.round((endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const daysActiveInYear = Math.max(
    0,
    Math.min(
      totalDaysInYear,
      Math.ceil((endOfYear.getTime() - liveDateObj.getTime()) / (1000 * 60 * 60 * 24))
    )
  );
  const goLiveMonthsRemainingInYear = (daysActiveInYear / totalDaysInYear) * 12;

  // Días desde hoy hasta el go-live
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const goLiveDaysRemaining = Math.ceil((liveDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // YRR (Year Remaining Revenue / Run-Rate de ingresos del año de lanzamiento)
  const yrrRevenue = totalRevenueMonth * goLiveMonthsRemainingInYear;
  const yrrCost = totalCostMonth * goLiveMonthsRemainingInYear;
  const yrrProfit = totalProfitMonth * goLiveMonthsRemainingInYear;

  return {
    clientName,
    technologies: inputs.technologies || [],
    tierName,
    skuMultiplier,
    targetPickMarginDefault,
    productPickMultiplier,
    ordersPerDay,
    ordersMonth,
    unitsPerOrder: Number(unitsPerOrder),

    // Go-Live Schedule & Annual Projections (ARR & YRR)
    goLiveDate,
    goLiveDaysRemaining,
    goLiveMonthsRemainingInYear,
    goLiveYear,
    arrRevenue,
    arrCost,
    arrProfit,
    yrrRevenue,
    yrrCost,
    yrrProfit,

    packCost,
    packDefaultCost: defaultPackCost,
    packPrice,
    packMargin,

    firstPickCost,
    firstPickDefaultCost: defaultFirstPickCost,
    firstPickPrice,
    firstPickMargin,

    prepPlusFirstPickCost,
    prepPlusFirstPickDefaultCost: defaultPrepPlusFirstPickCost,
    prepPlusFirstPickPrice,
    prepPlusFirstPickMargin,
    prepPlusFirstPickProfit,

    additionalPickCost,
    additionalPickDefaultCost: defaultAdditionalPickCost,
    additionalPickPrice,
    additionalPickMargin,
    additionalPicksPerOrder,
    additionalPicksCostTotal,
    additionalPicksPriceTotal,

    totalPickPricePerOrder,
    totalPickCostPerOrder,
    marginPick,

    carrierCost: Number(carrierCost),
    shippingPrice,
    shippingMargin,
    shippingProfitPerOrder,

    orderRevenueExShipping,
    orderCostExShipping,
    orderProfitExShipping,
    marginOrderExShipping,

    // Servicios unitarios
    customPackaging: hasCustomPackaging,
    insertRevenuePerOrder,
    insertCostPerOrder,
    packagingPricePerOrder,
    packagingCostPerOrder,
    surchargePricePerOrder,
    surchargeCostPerOrder,
    returnRevenuePerOrder,
    returnCostPerOrder,

    orderRevenueMonth,
    orderCostMonth,
    goodsInRevenueMonth,
    goodsInCostMonth,
    storageRevenueMonth,
    storageCostMonth,

    fulfilmentRevenueMonthExShipping,
    fulfilmentCostMonthExShipping,
    shippingRevenueMonth,
    shippingCostMonth,

    totalRevenueMonth,
    totalCostMonth,
    totalProfitMonth,
    profitPerOrder,

    marginTotal,
    marginExShipping,
    marginShipping,

    packMarkup,
    firstPickMarkup,
    prepPlusFirstPickMarkup,
    additionalPickMarkup,
    marginPickMarkup,
    shippingMarkup,
    markupOrderExShipping,
    markupTotal,
    markupExShipping,
    markupShipping,

    alerts,
    lines,
    orderSummary,
  };
}
