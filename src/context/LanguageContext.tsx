import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  es: {
    // Header & Global
    'app.title': 'Calculadora Rentabilidad Fulfilment',
    'app.subtitle': 'Preparación (Pack + 1er Pick), picks adicionales, packaging, envío y almacenaje con márgenes modificables.',
    'app.clientByClient': 'Cliente por Cliente',
    'app.language': 'Idioma',
    'lang.es': 'Español',
    'lang.en': 'English',

    // Tabs
    'tab.resumen': 'Resumen Cliente',
    'tab.preciosMargen': 'Precios & Margen',
    'tab.desglose': 'Desglose Operativo',
    'tab.propuesta': 'Propuesta Comercial',
    'tab.comparativa': 'Comparativa Clientes',
    'tab.rateCard': 'Rate Card',
    'tab.ayuda': 'Ayuda',

    // Client Manager Header
    'client.select': 'Seleccionar:',
    'client.name': 'Nombre cliente:',
    'client.placeholderName': 'Escribe el nombre del cliente...',
    'client.placeholderNote': 'Nota (ej: Ecommerce cosmética)...',
    'client.addNote': '+ Añadir nota',
    'client.new': 'Nuevo cliente',
    'client.duplicate': 'Duplicar',
    'client.delete': 'Eliminar',
    'client.copyQuote': 'Copiar Cotización',
    'client.copied': '¡Copiado!',
    'client.reset': 'Restablecer',
    'client.exportJson': 'Exportar JSON',
    'client.importJson': 'Importar JSON',
    'client.deleteConfirm': '¿Estás seguro de que deseas eliminar este cliente?',
    'client.resetConfirm': '¿Deseas restablecer los clientes a los valores iniciales por defecto?',

    // Quote template (Copy Quote)
    'quote.title': 'COTIZACIÓN FULFILMENT',
    'quote.estVolume': 'Volumen estimado:',
    'quote.ordersMonth': 'pedidos/mes',
    'quote.unitsOrder': 'units/pedido',
    'quote.operatingRates': '1. TARIFAS OPERATIVAS:',
    'quote.prepFirstPick': 'Preparación + 1er Pick:',
    'quote.perOrder': 'por pedido',
    'quote.pack': 'Pack',
    'quote.firstPick': '1er Pick',
    'quote.addPick': 'Pick adicional (desde 2ª unidad):',
    'quote.perExtraUnit': 'por unidad extra',
    'quote.shipping': 'Envío (Carrier):',
    'quote.perShipment': 'por envío',
    'quote.packaging': 'Packaging base:',
    'quote.storage': 'Almacenaje:',
    'quote.perPalletWeek': 'por pallet / semana',
    'quote.goodsIn': 'Recepción goods-in:',
    'quote.perPallet': 'por pallet',

    // Precios & Margen Tab
    'pm.titleClient': '1. Datos del Cliente & Perfil Operativo',
    'pm.companyName': 'Nombre Empresa / Cliente',
    'pm.sector': 'Sector / Tipo de Producto',
    'pm.sector.supplements': 'Suplementos',
    'pm.sector.cosmetics': 'Cosmética',
    'pm.sector.perfume': 'Perfume',
    'pm.sector.glass': 'Vidrio',
    'pm.sector.perfumeGlass': 'Perfume + vidrio',
    'pm.activeSkus': 'SKUs activos en almacén',
    'pm.skusDispersion': 'Multiplicador de dispersión',
    'pm.packCostSource': 'Coste base de pack fijado en',
    'pm.notesLabel': 'Notas Comerciales y Operativas',
    'pm.notesPlaceholder': 'Añade detalles sobre el cliente, integraciones, requerimientos de packaging especial o acuerdos comerciales...',

    'pm.titleVolume': '2. Volumen de Pedidos y Cesta Media',
    'pm.volumeMode': 'Modalidad de volumen',
    'pm.ordersPerDay': 'Pedidos / día',
    'pm.ordersPerMonth': 'Pedidos / mes',
    'pm.workingDays': 'Días laborables / mes',
    'pm.estOrdersMonth': 'Pedidos / mes estimados:',
    'pm.equivOrdersDay': 'Pedidos / día equivalentes:',
    'pm.basketUnits': 'Unidades por pedido (cesta media)',
    'pm.additionalPicks': 'Picks adicionales',
    'pm.monthlyHandledUnits': 'Unidades manipuladas al mes',

    'pm.titleMix': '3. Mix de Pack de Embalaje',
    'pm.resultingPackCost': 'Coste medio ponderado resultante del pack:',
    'pm.currentMixSum': 'Suma actual del mix:',
    'pm.normalize100': 'Normalizar al 100%',
    'pm.quickPresets': 'Presets rápidos:',
    'pm.presetStandard': '50% MPL / 50% LPL Estándar',
    'pm.presetSmall': '50% SPK / 50% SPL Pequeño',
    'pm.presetUniform': '25% Uniforme',
    'pm.presetMpl': '100% MPL Estándar',

    'pm.titleRates': '4. Matriz de Tarifas y Márgenes por Línea',
    'pm.globalMarginPresets': 'Presets rápidos de margen global:',
    'pm.presetCompetitive': 'Competitivo (18%)',
    'pm.presetDefault': 'Estándar (25%)',
    'pm.presetPremium': 'Premium (35%)',
    'pm.avgOrderRevenue': 'Facturación Pedido Medio',
    'pm.avgOrderCost': 'Coste Total Pedido',
    'pm.avgOrderProfit': 'Beneficio Neto Pedido',
    'pm.avgOrderMarginMarkup': 'Margen / Markup Total',

    // Rate Table Headers
    'th.line': 'LÍNEA / CONCEPTO',
    'th.unitCost': 'COSTE UNIT.',
    'th.marginPct': 'MARGEN %',
    'th.markupPct': 'MARKUP %',
    'th.salePrice': 'PRECIO VENTA',
    'th.mode': 'MODO',
    'th.autoMargin': 'Auto (Margen)',
    'th.manualPrice': 'Manual (€)',

    // Rate Line Names
    'line.pack': 'Preparación Pack (Base)',
    'line.packDesc': 'Montaje de caja/sobre, etiqueta, inspección y cierre del pedido.',
    'line.firstPick': '1er Pick (1ª unidad incluida)',
    'line.firstPickDesc': 'Picking del primer producto del pedido en almacén.',
    'line.prepFirstPick': 'Pack + 1er Pick (Tarifa Base Pedido)',
    'line.prepFirstPickDesc': 'Tarifa combinada cobrada al cliente por la preparación completa del pedido básico.',
    'line.additionalPick': 'Pick Adicional (desde 2ª unidad)',
    'line.additionalPickDesc': 'Picking por cada unidad suplementaria en el mismo pedido.',
    'line.carrier': 'Envío Transporte (Carrier)',
    'line.carrierDesc': 'Coste de transporte repercutido con margen comercial.',
    'line.packaging': 'Packaging (Caja / sobre)',
    'line.packagingDesc': 'Material consumible de embalaje estándar por pedido.',
    'line.inserts': 'Inserts / Folletos',
    'line.insertsDesc': 'Inserción de folleto publicitario o muestra por pedido.',
    'line.returns': 'Gestión Devoluciones',
    'line.returnsDesc': 'Recepción, inspección y reubicación por devolución.',
    'line.goodsIn': 'Recepción Goods-In (por Pallet)',
    'line.goodsInDesc': 'Descarga, conteo y registro de entrada por pallet recibido.',
    'line.storage': 'Almacenaje (por Pallet / Semana)',
    'line.storageDesc': 'Tarifa de almacenaje por pallet ocupado por semana.',

    // Resumen Tab
    'resumen.kpiRevenue': 'Facturación Mensual',
    'resumen.kpiCosts': 'Costes Totales Mensuales',
    'resumen.kpiProfit': 'Beneficio Neto Mensual',
    'resumen.kpiMargin': 'Margen Global s/ Venta',
    'resumen.kpiMarkup': 'Markup Global s/ Coste',
    'resumen.kpiProfitPerOrder': 'Beneficio por Pedido',
    'resumen.btnPdf': 'Generar Informe PDF Interno',
    'resumen.pdfFitted': 'Ajustado a 1 hoja A4 con selector de secciones',
    'resumen.orderEconomics': 'Resumen económico por pedido medio',
    'resumen.monthlyPL': 'Cuenta de Explotación Mensual (P&L)',
    'resumen.breakEven': 'Umbral de Rentabilidad (Break-even)',
    'resumen.alerts': 'Alertas operativas y financieras',

    // Internal Report Modal
    'report.modalTitle': 'INFORME INTERNO DE RENTABILIDAD FULFILMENT',
    'report.configSections': 'Configurar Secciones Visibles para Imprimir / Guardar en PDF',
    'report.pagePresets': 'Presets rápidos de página:',
    'report.presetOnePage': '1 Hoja A4 (Recomendado)',
    'report.presetFull': 'Informe Completo (2 Hojas)',
    'report.presetRatesOnly': 'Solo Tarifas Pedido',
    'report.sectionsIncluded': 'Secciones incluidas:',
    'report.secKpis': 'Resumen Financiero (KPIs)',
    'report.secRates': 'Tarifas por Pedido (Coste/Margen/Precio)',
    'report.secPL': 'Cuenta de Explotación (P&L)',
    'report.secParams': 'Parámetros Operativos & Mix',
    'report.secNotes': 'Notas del Cliente',
    'report.btnPrint': 'Imprimir / Guardar en PDF',
    'report.btnClose': 'Cerrar',
    'report.fittedBadge': 'Ajustado a 1 Hoja A4',
    'report.extendedBadge': 'Formato Extendido',
    'report.date': 'Fecha informe:',
    'report.client': 'Cliente:',

    // Desglose Tab
    'desglose.title': 'Desglose mensual',
    'desglose.chartTitle': 'Gráfico comparativo de ingresos vs costes',
    'desglose.revenue': 'Ingresos',
    'desglose.costs': 'Costes',
    'desglose.profit': 'Beneficio',
    'desglose.margin': 'Margen',
    'desglose.markup': 'Markup',

    // Propuesta Tab
    'propuesta.title': 'PROPUESTA ECONÓMICA DE SERVICIOS DE FULFILMENT',
    'propuesta.copy': 'Copiar texto',
    'propuesta.print': 'Imprimir propuesta',

    // Comparativa Tab
    'comp.title': 'Comparativa de Clientes',
    'comp.subtitle': 'Analiza la rentabilidad relativa y volumen de todos tus clientes cotizados',
    'comp.thClient': 'Cliente',
    'comp.thVolume': 'Volumen',
    'comp.thRevenue': 'Facturación',
    'comp.thCosts': 'Costes',
    'comp.thProfit': 'Beneficio',
    'comp.thMargin': 'Margen %',
    'comp.thMarkup': 'Markup %',
    'comp.thProfitOrder': 'Beneficio/Pedido',

    // Rate Card Tab
    'rc.title': 'Tarifario Estándar de Referencia (Rate Card ES)',
    'rc.subtitle': 'Costes de referencia del almacén en España y tarifas estándar sugeridas.',

    // Ayuda Tab
    'help.title': 'Guía y Conceptos Clave de Rentabilidad',
    'help.subtitle': 'Explicación didáctica sobre cómo se calculan los márgenes, costes y tarifas.',
    'help.marginVsMarkup': 'Diferencia fundamental entre Margen y Markup',
  },
  en: {
    // Header & Global
    'app.title': 'Fulfilment Profitability Calculator',
    'app.subtitle': 'Preparation (Pack + 1st Pick), additional picks, packaging, shipping and storage with customizable margins.',
    'app.clientByClient': 'Client by Client',
    'app.language': 'Language',
    'lang.es': 'Español',
    'lang.en': 'English',

    // Tabs
    'tab.resumen': 'Client Summary',
    'tab.preciosMargen': 'Prices & Margins',
    'tab.desglose': 'Operational Breakdown',
    'tab.propuesta': 'Commercial Proposal',
    'tab.comparativa': 'Client Comparison',
    'tab.rateCard': 'Rate Card',
    'tab.ayuda': 'Help',

    // Client Manager Header
    'client.select': 'Select:',
    'client.name': 'Client name:',
    'client.placeholderName': 'Enter client name...',
    'client.placeholderNote': 'Note (e.g. Cosmetics ecommerce)...',
    'client.addNote': '+ Add note',
    'client.new': 'New client',
    'client.duplicate': 'Duplicate',
    'client.delete': 'Delete',
    'client.copyQuote': 'Copy Quote',
    'client.copied': 'Copied!',
    'client.reset': 'Reset',
    'client.exportJson': 'Export JSON',
    'client.importJson': 'Import JSON',
    'client.deleteConfirm': 'Are you sure you want to delete this client?',
    'client.resetConfirm': 'Do you want to reset clients to initial default values?',

    // Quote template (Copy Quote)
    'quote.title': 'FULFILMENT QUOTATION',
    'quote.estVolume': 'Estimated volume:',
    'quote.ordersMonth': 'orders/month',
    'quote.unitsOrder': 'units/order',
    'quote.operatingRates': '1. OPERATING RATES:',
    'quote.prepFirstPick': 'Preparation + 1st Pick:',
    'quote.perOrder': 'per order',
    'quote.pack': 'Pack',
    'quote.firstPick': '1st Pick',
    'quote.addPick': 'Additional pick (from 2nd unit):',
    'quote.perExtraUnit': 'per extra unit',
    'quote.shipping': 'Shipping (Carrier):',
    'quote.perShipment': 'per shipment',
    'quote.packaging': 'Base packaging:',
    'quote.storage': 'Storage:',
    'quote.perPalletWeek': 'per pallet / week',
    'quote.goodsIn': 'Goods-in intake:',
    'quote.perPallet': 'per pallet',

    // Precios & Margen Tab
    'pm.titleClient': '1. Client Data & Operational Profile',
    'pm.companyName': 'Company / Client Name',
    'pm.sector': 'Industry / Product Type',
    'pm.sector.supplements': 'Supplements',
    'pm.sector.cosmetics': 'Cosmetics',
    'pm.sector.perfume': 'Perfume',
    'pm.sector.glass': 'Glass',
    'pm.sector.perfumeGlass': 'Perfume + glass',
    'pm.activeSkus': 'Active SKUs in warehouse',
    'pm.skusDispersion': 'Dispersion multiplier',
    'pm.packCostSource': 'Base pack cost set in',
    'pm.notesLabel': 'Commercial & Operational Notes',
    'pm.notesPlaceholder': 'Add details about the client, integrations, special packaging requirements or commercial agreements...',

    'pm.titleVolume': '2. Order Volume & Average Basket',
    'pm.volumeMode': 'Volume mode',
    'pm.ordersPerDay': 'Orders / day',
    'pm.ordersPerMonth': 'Orders / month',
    'pm.workingDays': 'Working days / month',
    'pm.estOrdersMonth': 'Estimated orders / month:',
    'pm.equivOrdersDay': 'Equivalent orders / day:',
    'pm.basketUnits': 'Units per order (average basket)',
    'pm.additionalPicks': 'Additional picks',
    'pm.monthlyHandledUnits': 'Units handled per month',

    'pm.titleMix': '3. Packaging Pack Mix',
    'pm.resultingPackCost': 'Resulting weighted average pack cost:',
    'pm.currentMixSum': 'Current mix total:',
    'pm.normalize100': 'Normalize to 100%',
    'pm.quickPresets': 'Quick presets:',
    'pm.presetStandard': '50% MPL / 50% LPL Standard',
    'pm.presetSmall': '50% SPK / 50% SPL Small',
    'pm.presetUniform': '25% Uniform',
    'pm.presetMpl': '100% MPL Standard',

    'pm.titleRates': '4. Rates & Margins Matrix by Line',
    'pm.globalMarginPresets': 'Quick global margin presets:',
    'pm.presetCompetitive': 'Competitive (18%)',
    'pm.presetDefault': 'Standard (25%)',
    'pm.presetPremium': 'Premium (35%)',
    'pm.avgOrderRevenue': 'Average Order Revenue',
    'pm.avgOrderCost': 'Total Order Cost',
    'pm.avgOrderProfit': 'Net Profit per Order',
    'pm.avgOrderMarginMarkup': 'Total Margin / Markup',

    // Rate Table Headers
    'th.line': 'LINE / CONCEPT',
    'th.unitCost': 'UNIT COST',
    'th.marginPct': 'MARGIN %',
    'th.markupPct': 'MARKUP %',
    'th.salePrice': 'SALE PRICE',
    'th.mode': 'MODE',
    'th.autoMargin': 'Auto (Margin)',
    'th.manualPrice': 'Manual (€)',

    // Rate Line Names
    'line.pack': 'Pack Preparation (Base)',
    'line.packDesc': 'Box/flyer assembly, label application, inspection and order sealing.',
    'line.firstPick': '1st Pick (1st unit included)',
    'line.firstPickDesc': 'Picking the first item of the order in warehouse.',
    'line.prepFirstPick': 'Pack + 1st Pick (Base Order Rate)',
    'line.prepFirstPickDesc': 'Combined fee billed to the customer for complete basic order fulfillment.',
    'line.additionalPick': 'Additional Pick (from 2nd unit)',
    'line.additionalPickDesc': 'Picking for each supplementary unit within the same order.',
    'line.carrier': 'Shipping Carrier',
    'line.carrierDesc': 'Carrier transport cost passed through with commercial margin.',
    'line.packaging': 'Packaging (Box / flyer)',
    'line.packagingDesc': 'Standard packaging consumable material per order.',
    'line.inserts': 'Inserts / Flyers',
    'line.insertsDesc': 'Flyer insertion or marketing sample per order.',
    'line.returns': 'Returns Handling',
    'line.returnsDesc': 'Receiving, inspection and restocking per customer return.',
    'line.goodsIn': 'Goods-In Intake (per Pallet)',
    'line.goodsInDesc': 'Unloading, piece count and entry logging per received pallet.',
    'line.storage': 'Storage (per Pallet / Week)',
    'line.storageDesc': 'Storage fee per occupied pallet per week.',

    // Resumen Tab
    'resumen.kpiRevenue': 'Monthly Revenue',
    'resumen.kpiCosts': 'Total Monthly Costs',
    'resumen.kpiProfit': 'Net Monthly Profit',
    'resumen.kpiMargin': 'Global Margin on Sales',
    'resumen.kpiMarkup': 'Global Markup on Cost',
    'resumen.kpiProfitPerOrder': 'Profit per Order',
    'resumen.btnPdf': 'Generate Internal PDF Report',
    'resumen.pdfFitted': 'Fitted to 1 A4 page with interactive section selector',
    'resumen.orderEconomics': 'Economic summary per average order',
    'resumen.monthlyPL': 'Monthly Profit & Loss (P&L)',
    'resumen.breakEven': 'Break-even Point',
    'resumen.alerts': 'Operational & financial alerts',

    // Internal Report Modal
    'report.modalTitle': 'INTERNAL FULFILMENT PROFITABILITY REPORT',
    'report.configSections': 'Configure Visible Sections to Print / Save as PDF',
    'report.pagePresets': 'Quick page presets:',
    'report.presetOnePage': '1 A4 Page (Recommended)',
    'report.presetFull': 'Full Report (2 Pages)',
    'report.presetRatesOnly': 'Rates Only',
    'report.sectionsIncluded': 'Included sections:',
    'report.secKpis': 'Financial Summary (KPIs)',
    'report.secRates': 'Rates per Order (Cost/Margin/Price)',
    'report.secPL': 'Profit & Loss (P&L)',
    'report.secParams': 'Operating Parameters & Mix',
    'report.secNotes': 'Client Notes',
    'report.btnPrint': 'Print / Save as PDF',
    'report.btnClose': 'Close',
    'report.fittedBadge': 'Fitted to 1 A4 Page',
    'report.extendedBadge': 'Extended Format',
    'report.date': 'Report date:',
    'report.client': 'Client:',

    // Desglose Tab
    'desglose.title': 'Monthly breakdown',
    'desglose.chartTitle': 'Comparative chart: Revenue vs Costs',
    'desglose.revenue': 'Revenue',
    'desglose.costs': 'Costs',
    'desglose.profit': 'Profit',
    'desglose.margin': 'Margin',
    'desglose.markup': 'Markup',

    // Propuesta Tab
    'propuesta.title': 'ECONOMIC PROPOSAL FOR FULFILMENT SERVICES',
    'propuesta.copy': 'Copy text',
    'propuesta.print': 'Print proposal',

    // Comparativa Tab
    'comp.title': 'Client Comparison',
    'comp.subtitle': 'Analyze relative profitability and volume across all quoted clients',
    'comp.thClient': 'Client',
    'comp.thVolume': 'Volume',
    'comp.thRevenue': 'Revenue',
    'comp.thCosts': 'Costs',
    'comp.thProfit': 'Profit',
    'comp.thMargin': 'Margin %',
    'comp.thMarkup': 'Markup %',
    'comp.thProfitOrder': 'Profit/Order',

    // Rate Card Tab
    'rc.title': 'Reference Standard Rate Card (ES Warehouse)',
    'rc.subtitle': 'Reference fulfillment warehouse costs in Spain and suggested standard rates.',

    // Ayuda Tab
    'help.title': 'Fulfillment Profitability Guide & Key Concepts',
    'help.subtitle': 'Practical explanation of how margins, markups, costs and rates are calculated.',
    'help.marginVsMarkup': 'Fundamental difference between Margin and Markup',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('fulfilment_calc_lang');
    if (saved === 'en' || saved === 'es') {
      return saved;
    }
    // Check browser preference
    if (typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('en')) {
      return 'en';
    }
    return 'es';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('fulfilment_calc_lang', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  const t = (key: string, fallback?: string): string => {
    const dict = translations[language];
    if (dict && dict[key]) {
      return dict[key];
    }
    const esDict = translations.es;
    if (esDict && esDict[key]) {
      return esDict[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
