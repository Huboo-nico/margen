export type PackType = 'SPK' | 'SPL' | 'MPL' | 'LPL';

export type ProductType = 
  | 'Suplementos'
  | 'Cosmética'
  | 'Perfume'
  | 'Vidrio'
  | 'Perfume + vidrio';

export type PackCostSource = 'Calculadora (negociado)' | 'Rate card ES (estándar)';

export type VolumeMode = 'Pedidos/día' | 'Pedidos/mes';

export type PricingControlMode = 'margin' | 'price';

export interface ProductProfile {
  pickMultiplier: number;
  surchargePrice: number;
  surchargeCost: number;
  returnRate: number;
}

export interface ClientProfile {
  id: string;
  name: string;
  notes?: string;
  updatedAt: string;
  inputs: CalculatorInputs;
}

export interface CalculatorInputs {
  // 1. Cliente
  clientName: string;
  clientNotes: string;
  technologies?: string[];
  skuCount: number;
  productType: ProductType;
  packCostSource: PackCostSource;

  // 2. Volumen
  volumeMode: VolumeMode;
  workingDays: number;
  ordersPerDay: number;
  ordersMonth: number;
  unitsPerOrder: number;

  // 3. Mix de pack
  mixSpk: number;
  mixSpl: number;
  mixMpl: number;
  mixLpl: number;

  // 4. Preparación (Pack base)
  packPriceMode: PricingControlMode;
  packMarginTarget: number;
  packPriceManual: number;
  packCostOverride?: number | null;

  // 5. 1er Pick
  firstPickPriceMode: PricingControlMode;
  firstPickMarginTarget: number;
  firstPickPriceManual: number;
  firstPickCostOverride?: number | null;

  // 6. Pick Adicional
  additionalPickPriceMode: PricingControlMode;
  additionalPickMarginTarget: number;
  additionalPickPriceManual: number;
  additionalPickCostOverride?: number | null;

  // Preparación + 1er Pick (Total Combinado)
  prepPlusFirstPickPriceManual?: number | null;
  prepPlusFirstPickCostOverride?: number | null;
  prepPlusFirstPickPriceMode?: PricingControlMode;
  prepPlusFirstPickMarginTarget?: number;

  // 7. Envío (Carrier)
  shippingPriceMode: PricingControlMode;
  carrierCost: number;
  shippingMarginTarget: number;
  shippingPriceManual: number;

  // 8. Servicios Adicionales
  insertsPerOrder: number;
  insertPrice: number;
  insertCost: number;

  packagingPrice: number;
  packagingCost: number;

  surchargePrice: number;
  surchargeCost: number;

  returnRate: number;
  returnHandlingPrice: number;
  returnHandlingCost: number;

  // 9. Almacenaje & Recepción
  goodsInPalletsMonth: number;
  goodsInPrice: number;
  goodsInCost: number;

  storagePalletWeeksMonth: number;
  storagePrice: number;
  storageCost: number;
}

export interface MonthlyLine {
  linea: string;
  categoria: 'Preparación' | 'Pick' | 'Servicios' | 'Almacén' | 'Envío';
  ingresos: number;
  costes: number;
  beneficio: number;
  margen: number | null;
  markup: number | null;
  unitPrice: number;
  unitCost: number;
}

export interface OrderSummaryItem {
  concepto: string;
  valor: string;
  detalle?: string;
}

export interface CalculationResults {
  // Client & metadata
  clientName: string;
  technologies: string[];
  tierName: string;
  skuMultiplier: number;
  targetPickMarginDefault: number;
  productPickMultiplier: number;
  ordersPerDay: number;
  ordersMonth: number;
  unitsPerOrder: number;

  // Preparación (Pack base)
  packCost: number;
  packDefaultCost: number;
  packPrice: number;
  packMargin: number | null;

  // 1er Pick
  firstPickCost: number;
  firstPickDefaultCost: number;
  firstPickPrice: number;
  firstPickMargin: number | null;

  // PREPARACIÓN + 1ER PICK (Total Base Pedido)
  prepPlusFirstPickCost: number;
  prepPlusFirstPickDefaultCost: number;
  prepPlusFirstPickPrice: number;
  prepPlusFirstPickMargin: number | null;
  prepPlusFirstPickProfit: number;

  // Picks Adicionales
  additionalPickCost: number;
  additionalPickDefaultCost: number;
  additionalPickPrice: number;
  additionalPickMargin: number | null;
  additionalPicksPerOrder: number;
  additionalPicksCostTotal: number;
  additionalPicksPriceTotal: number;

  // Total Picking (1st + Additionals)
  totalPickPricePerOrder: number;
  totalPickCostPerOrder: number;
  marginPick: number | null;

  // Envío
  carrierCost: number;
  shippingPrice: number;
  shippingMargin: number | null;
  shippingProfitPerOrder: number;

  // Pedido sin envío
  orderRevenueExShipping: number;
  orderCostExShipping: number;
  orderProfitExShipping: number;
  marginOrderExShipping: number | null;

  // Servicios unitarios
  insertRevenuePerOrder: number;
  insertCostPerOrder: number;
  packagingPricePerOrder: number;
  packagingCostPerOrder: number;
  surchargePricePerOrder: number;
  surchargeCostPerOrder: number;
  returnRevenuePerOrder: number;
  returnCostPerOrder: number;

  // Totales Mensuales
  orderRevenueMonth: number;
  orderCostMonth: number;
  goodsInRevenueMonth: number;
  goodsInCostMonth: number;
  storageRevenueMonth: number;
  storageCostMonth: number;

  fulfilmentRevenueMonthExShipping: number;
  fulfilmentCostMonthExShipping: number;
  shippingRevenueMonth: number;
  shippingCostMonth: number;

  totalRevenueMonth: number;
  totalCostMonth: number;
  totalProfitMonth: number;
  profitPerOrder: number;

  // Márgenes globales
  marginTotal: number | null;
  marginExShipping: number | null;
  marginShipping: number | null;

  // Markups (% incremento sobre coste)
  packMarkup: number | null;
  firstPickMarkup: number | null;
  prepPlusFirstPickMarkup: number | null;
  additionalPickMarkup: number | null;
  marginPickMarkup: number | null;
  shippingMarkup: number | null;
  markupOrderExShipping: number | null;
  markupTotal: number | null;
  markupExShipping: number | null;
  markupShipping: number | null;

  alerts: string[];
  lines: MonthlyLine[];
  orderSummary: OrderSummaryItem[];
}
