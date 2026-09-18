import {
  PackType,
  ProductProfile,
  ProductType,
  CalculatorInputs,
  ClientProfile,
  SubscriptionTier,
  SubscriptionConfig,
} from '../types';

export const PACK_TYPES: PackType[] = ['SPK', 'SPL', 'MPL', 'LPL'];

export const PACK_LABELS: Record<PackType, string> = {
  SPK: 'Small Packet',
  SPL: 'Small Parcel',
  MPL: 'Medium Parcel',
  LPL: 'Large Parcel',
};

// Precios de pack propuestos en la calculadora actual
export const PACK_PRICES: Record<PackType, number> = {
  SPK: 1.62,
  SPL: 1.62,
  MPL: 1.73,
  LPL: 1.78,
};

// Costes actuales usados en la calculadora (versión negociada / operativa actual)
export const PACK_COSTS_CALCULATOR: Record<PackType, number> = {
  SPK: 0.66,
  SPL: 0.66,
  MPL: 1.00,
  LPL: 1.15,
};

// Costes estándar ES del rate card (más conservadores)
export const PACK_COSTS_STANDARD_ES: Record<PackType, number> = {
  SPK: 0.66,
  SPL: 1.00,
  MPL: 1.32,
  LPL: 1.66,
};

// Picking España (ES Cost)
export const BASE_FIRST_PICK_COST = 0.33;
export const BASE_ADDITIONAL_PICK_COST = 0.17;

// Inserts
export const INSERT_PRICE = 0.08;
export const INSERT_COST = 0.06;

// Packaging base
export const PACKAGING_BASE_PRICE = 0.10;
export const PACKAGING_BASE_COST = 0.01;

// Goods-in / Storage usados en la calculadora actual
export const GOODS_IN_PALLET_PRICE = 6.43;
export const GOODS_IN_PALLET_COST = 3.50;

export const STORAGE_PALLET_PRICE = 8.96;
export const STORAGE_PALLET_COST = 3.76;

// Returns España
export const RETURN_HANDLING_PRICE = 4.75;
export const RETURN_HANDLING_COST = 3.33;

// Perfiles de producto e industrias
export const PRODUCT_PROFILES: Record<ProductType, ProductProfile> = {
  // Nuevas industrias solicitadas
  Adult: { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.05 },
  'Alcohol and soft drinks': { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.04 },
  'Arts and craft': { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.03 },
  'Automotive and parts': { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.05 },
  'Baby and toddler': { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.04 },
  'Beauty and cosmetics': { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.04 },
  'CDs, vinyl, DVDs, books and magazines': { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.03 },
  'Cleaning and Laundry': { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.03 },
  DIY: { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.04 },
  'Fitness and sporting goods': { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.05 },
  Food: { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.02 },
  'Health and nutrition': { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.02 },
  Homeware: { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.05 },
  'Jewellery and watches': { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.04 },
  'Male Grooming': { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.03 },
  Medical: { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.02 },
  'Mobile phones and accessories': { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.04 },
  Other: { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.04 },
  'Pet products, foods and supplements': { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.03 },
  'Tech and gadgets': { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.04 },
  'Toys and games': { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.04 },
  'Vapes and Nicotine': { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.04 },

  // Perfiles tradicionales / retrocompatibilidad
  Suplementos: { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.02 },
  Cosmética: { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.04 },
  Perfume: { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.05 },
  Vidrio: { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.07 },
  'Perfume + vidrio': { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.08 },
  'Apparel & Merch': { pickMultiplier: 1.00, surchargePrice: 0, surchargeCost: 0, returnRate: 0.05 },
};

// Planes de suscripción mensual Huboo
export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionConfig> = {
  'tier-50': {
    id: 'tier-50',
    label: '50€ / mes (hasta 300 pedidos)',
    price: 50,
    maxOrders: 300,
    description: 'Suscripción base: 50€ al mes para volúmenes de hasta 300 pedidos/mes.',
  },
  'tier-150': {
    id: 'tier-150',
    label: '150€ / mes (hasta 1.500 pedidos)',
    price: 150,
    maxOrders: 1500,
    description: 'Suscripción intermedia: 150€ al mes para volúmenes de hasta 1.500 pedidos/mes.',
  },
  'tier-450': {
    id: 'tier-450',
    label: '450€ / mes (hasta 5.000 pedidos)',
    price: 450,
    maxOrders: 5000,
    description: 'Suscripción pro/alta escala: 450€ al mes para volúmenes de hasta 5.000 pedidos/mes.',
  },
  none: {
    id: 'none',
    label: 'Sin suscripción (0€)',
    price: 0,
    maxOrders: Infinity,
    description: 'Sin cuota fija mensual de suscripción.',
  },
  custom: {
    id: 'custom',
    label: 'Personalizada',
    price: 0,
    maxOrders: Infinity,
    description: 'Cuota de suscripción definida manualmente.',
  },
};

// Lista ordenada de industrias para selectores de interfaz
export const PRIMARY_INDUSTRIES: ProductType[] = [
  'Adult',
  'Alcohol and soft drinks',
  'Arts and craft',
  'Automotive and parts',
  'Baby and toddler',
  'Beauty and cosmetics',
  'CDs, vinyl, DVDs, books and magazines',
  'Cleaning and Laundry',
  'DIY',
  'Fitness and sporting goods',
  'Food',
  'Health and nutrition',
  'Homeware',
  'Jewellery and watches',
  'Male Grooming',
  'Medical',
  'Mobile phones and accessories',
  'Other',
  'Pet products, foods and supplements',
  'Tech and gadgets',
  'Toys and games',
  'Vapes and Nicotine',
];

// Tecnologías y plataformas e-commerce soportadas para la ficha del cliente
export const AVAILABLE_TECHNOLOGIES = [
  'Shopify',
  'TikTok Shop',
  'PrestaShop',
  'WooCommerce',
  'Temu',
  'Amazon',
  'Mirakl',
  'Magento',
  'eBay',
  'BigCommerce',
  'Shein',
  'AliExpress',
  'Custom API / ERP',
];

// Territorios / Hubs de fulfillment disponibles (informativo)
export const AVAILABLE_WAREHOUSES = [
  'Spain',
  'UK',
  'USA',
];

export const DEFAULT_INPUTS: CalculatorInputs = {
  // 1. Cliente
  clientName: 'Cliente Ejemplo A',
  clientNotes: 'Propuesta estándar e-commerce',
  technologies: ['Shopify'],
  warehouse: 'Spain',
  goLiveDate: '2026-10-01',
  skuCount: 15,
  productType: 'Suplementos',
  packCostSource: 'Calculadora (negociado)',
  customPackaging: false,
  subscriptionTier: 'tier-150',
  subscriptionPrice: 150,

  // 2. Volumen
  volumeMode: 'Pedidos/día',
  workingDays: 22,
  ordersPerDay: 30.0,
  ordersMonth: 660.0,
  unitsPerOrder: 1.5,

  // 3. Mix de pack
  mixSpk: 0,
  mixSpl: 0,
  mixMpl: 50,
  mixLpl: 50,

  // 4. Preparación (Pack base)
  packPriceMode: 'margin',
  packMarginTarget: 0.38,
  packPriceManual: 1.75,
  packCostOverride: null,

  // 5. 1er Pick
  firstPickPriceMode: 'margin',
  firstPickMarginTarget: 0.28,
  firstPickPriceManual: 0.56,
  firstPickCostOverride: null,

  // 6. Pick Adicional
  additionalPickPriceMode: 'margin',
  additionalPickMarginTarget: 0.28,
  additionalPickPriceManual: 0.39,
  additionalPickCostOverride: null,

  // Preparación + 1er Pick Combinado
  prepPlusFirstPickPriceManual: null,
  prepPlusFirstPickCostOverride: null,
  prepPlusFirstPickPriceMode: 'margin',
  prepPlusFirstPickMarginTarget: 0.35,

  // 7. Envío (Carrier)
  shippingPriceMode: 'margin',
  carrierCost: 4.47,
  shippingMarginTarget: 0.20,
  shippingPriceManual: 5.59,

  // 8. Servicios Adicionales
  insertsPerOrder: 0,
  insertPrice: INSERT_PRICE,
  insertCost: INSERT_COST,

  packagingPrice: PACKAGING_BASE_PRICE,
  packagingCost: PACKAGING_BASE_COST,

  surchargePrice: PRODUCT_PROFILES['Suplementos'].surchargePrice,
  surchargeCost: PRODUCT_PROFILES['Suplementos'].surchargeCost,

  returnRate: PRODUCT_PROFILES['Suplementos'].returnRate,
  returnHandlingPrice: RETURN_HANDLING_PRICE,
  returnHandlingCost: RETURN_HANDLING_COST,

  // 9. Almacenaje & Recepción
  goodsInPalletsMonth: 0.0,
  goodsInPrice: GOODS_IN_PALLET_PRICE,
  goodsInCost: GOODS_IN_PALLET_COST,

  storagePalletWeeksMonth: 0.0,
  storagePrice: STORAGE_PALLET_PRICE,
  storageCost: STORAGE_PALLET_COST,
};

export const INITIAL_CLIENT_PROFILES: ClientProfile[] = [
  {
    id: 'client-1',
    name: 'NutriLife (Suplementos)',
    notes: 'Volumen medio, mix MPL/LPL estándar',
    updatedAt: new Date().toISOString(),
    inputs: {
      ...DEFAULT_INPUTS,
      clientName: 'NutriLife (Suplementos)',
      warehouse: 'Spain',
      technologies: ['Shopify', 'TikTok Shop'],
      goLiveDate: '2026-10-01',
    },
  },
  {
    id: 'client-2',
    name: 'Aura Glow (Cosmética & Perfume)',
    notes: 'Volumen alto, pedidos multi-unidad cosmética',
    updatedAt: new Date().toISOString(),
    inputs: {
      ...DEFAULT_INPUTS,
      clientName: 'Aura Glow (Cosmética & Perfume)',
      warehouse: 'UK',
      technologies: ['WooCommerce', 'PrestaShop', 'Temu'],
      goLiveDate: '2026-11-01',
      productType: 'Perfume + vidrio',
      skuCount: 45,
      ordersPerDay: 50,
      ordersMonth: 1100,
      unitsPerOrder: 2.2,
      mixSpk: 20,
      mixSpl: 40,
      mixMpl: 40,
      mixLpl: 0,
      surchargePrice: 0,
      surchargeCost: 0,
      returnRate: 0.08,
      carrierCost: 4.80,
      shippingMarginTarget: 0.22,
    },
  },
];
