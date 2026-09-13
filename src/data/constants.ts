import { PackType, ProductProfile, ProductType, CalculatorInputs, ClientProfile } from '../types';

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

// Perfiles de producto
export const PRODUCT_PROFILES: Record<ProductType, ProductProfile> = {
  Suplementos: {
    pickMultiplier: 1.00,
    surchargePrice: 0,
    surchargeCost: 0,
    returnRate: 0.02,
  },
  Cosmética: {
    pickMultiplier: 1.05,
    surchargePrice: 0,
    surchargeCost: 0,
    returnRate: 0.04,
  },
  Perfume: {
    pickMultiplier: 1.15,
    surchargePrice: 0,
    surchargeCost: 0,
    returnRate: 0.05,
  },
  Vidrio: {
    pickMultiplier: 1.25,
    surchargePrice: 0,
    surchargeCost: 0,
    returnRate: 0.07,
  },
  'Perfume + vidrio': {
    pickMultiplier: 1.35,
    surchargePrice: 0,
    surchargeCost: 0,
    returnRate: 0.08,
  },
};

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

export const DEFAULT_INPUTS: CalculatorInputs = {
  // 1. Cliente
  clientName: 'Cliente Ejemplo A',
  clientNotes: 'Propuesta estándar e-commerce',
  technologies: ['Shopify'],
  skuCount: 15,
  productType: 'Suplementos',
  packCostSource: 'Calculadora (negociado)',
  customPackaging: false,

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
      technologies: ['Shopify', 'TikTok Shop'],
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
      technologies: ['WooCommerce', 'PrestaShop', 'Temu'],
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
