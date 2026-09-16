import { ClientProfile } from '../types';
import { calculateAll } from './calculations';

export const GOOGLE_SHEETS_STORAGE_KEY = 'huboo_google_sheets_webapp_url_v1';

export const GOOGLE_SHEET_COLUMNS = [
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

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ====================================================================
 * HUBOO CALCULADORA DE MARGEN - SINCRONIZADOR GOOGLE SHEETS
 * Hoja: "Margen"
 * Pestañas creadas automáticamente por Territorio:
 *   - "Spain"
 *   - "UK"
 *   - "USA"
 *   - "Resumen General"
 * ====================================================================
 */

var COLUMNS = [
  "ID",
  "Cliente",
  "Territorio",
  "Perfil / Sector",
  "SKUs Activos",
  "Pedidos / Mes",
  "Picks / Pedido Promedio",
  "Tarifa Pack (€)",
  "Tarifa 1er Pick (€)",
  "Tarifa Pick Adicional (€)",
  "Tarifa Envío (€)",
  "Ingresos / Mes (€)",
  "Coste / Mes (€)",
  "Margen Bruto (%)",
  "Markup",
  "Beneficio / Mes (€)",
  "ARR (12 meses) (€)",
  "Fecha Go-Live",
  "Canales / Integraciones",
  "Notas Comerciales",
  "Última Actualización"
];

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      sheetName: ss.getName(),
      sheets: ss.getSheets().map(function(s) { return s.getName(); }),
      message: "Conexión activa con Google Sheet: " + ss.getName()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var raw = e.postData ? e.postData.contents : "";
    if (!raw) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "No se recibieron datos en el cuerpo de la petición."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = JSON.parse(raw);
    var clients = payload.clients || [];
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Territorios definidos
    var territories = ["Spain", "UK", "USA"];

    // 1. Sincronizar cada pestaña de territorio
    territories.forEach(function(territory) {
      var filteredClients = clients.filter(function(c) {
        var w = (c.inputs && c.inputs.warehouse) || "Spain";
        return w.toLowerCase().trim() === territory.toLowerCase().trim();
      });
      syncSheet(ss, territory, filteredClients, "#2563EB");
    });

    // 2. Sincronizar pestaña Resumen General con todos los clientes
    syncSheet(ss, "Resumen General", clients, "#6B4ABF");

    var spainCount = clients.filter(function(c) { return ((c.inputs && c.inputs.warehouse) || "Spain").toLowerCase() === "spain"; }).length;
    var ukCount = clients.filter(function(c) { return ((c.inputs && c.inputs.warehouse) || "").toLowerCase() === "uk"; }).length;
    var usaCount = clients.filter(function(c) { return ((c.inputs && c.inputs.warehouse) || "").toLowerCase() === "usa"; }).length;

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Datos sincronizados correctamente en la hoja Margen.",
      totalClients: clients.length,
      spainCount: spainCount,
      ukCount: ukCount,
      usaCount: usaCount,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Error al procesar los datos: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function syncSheet(ss, sheetName, clientsList, headerBgColor) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  sheet.clear();

  // Cabecera
  sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
  var headerRange = sheet.getRange(1, 1, 1, COLUMNS.length);
  headerRange.setBackground(headerBgColor);
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  headerRange.setFontFamily("Arial");
  headerRange.setFontSize(10);
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);

  if (!clientsList || clientsList.length === 0) {
    sheet.autoResizeColumns(1, COLUMNS.length);
    return;
  }

  // Filas de datos
  var rows = clientsList.map(function(item) {
    var p = item.profile || item;
    var inp = p.inputs || {};
    var res = item.results || {};

    var channels = (inp.technologies && inp.technologies.length > 0) ? inp.technologies.join(", ") : "";
    var marginPct = res.marginTotal !== null && res.marginTotal !== undefined ? res.marginTotal : 0;

    return [
      p.id || "",
      p.name || inp.clientName || "",
      inp.warehouse || "Spain",
      inp.productType || "",
      inp.skuCount || 0,
      res.ordersMonth || inp.ordersMonth || 0,
      res.unitsPerOrder || inp.unitsPerOrder || 1,
      res.packPrice || inp.packPriceManual || 0,
      res.firstPickPrice || inp.firstPickPriceManual || 0,
      res.additionalPickPrice || inp.additionalPickPriceManual || 0,
      res.shippingPrice || 0,
      res.totalRevenueMonth || 0,
      res.totalCostMonth || 0,
      marginPct,
      res.markupAverage || 0,
      res.totalProfitMonth || 0,
      res.annualRunRate || ((res.totalRevenueMonth || 0) * 12),
      res.goLiveDate || inp.goLiveDate || "",
      channels,
      p.notes || inp.clientNotes || "",
      new Date().toLocaleString()
    ];
  });

  var dataRange = sheet.getRange(2, 1, rows.length, COLUMNS.length);
  dataRange.setValues(rows);
  dataRange.setFontFamily("Arial");
  dataRange.setFontSize(10);

  // Formato de moneda (€): columnas 8, 9, 10, 11, 12, 13, 16, 17
  [8, 9, 10, 11, 12, 13, 16, 17].forEach(function(colIndex) {
    sheet.getRange(2, colIndex, rows.length, 1).setNumberFormat("€#,##0.00");
  });

  // Formato de porcentaje (%): columna 14 (Margen)
  sheet.getRange(2, 14, rows.length, 1).setNumberFormat("0.0%");

  // Formato numérico: SKUs (5), Pedidos (6), Picks/ord (7), Markup (15)
  sheet.getRange(2, 5, rows.length, 1).setNumberFormat("#,##0");
  sheet.getRange(2, 6, rows.length, 1).setNumberFormat("#,##0");
  sheet.getRange(2, 7, rows.length, 1).setNumberFormat("0.0");
  sheet.getRange(2, 15, rows.length, 1).setNumberFormat("0.00");

  // Alineación
  sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment("center"); // ID
  sheet.getRange(2, 3, rows.length, 1).setHorizontalAlignment("center"); // Territorio
  sheet.getRange(2, 18, rows.length, 1).setHorizontalAlignment("center"); // Go-Live
  sheet.getRange(2, 21, rows.length, 1).setHorizontalAlignment("center"); // Updated

  sheet.autoResizeColumns(1, COLUMNS.length);
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🚀 Huboo Margen")
    .addItem("🔄 Crear / Verificar Pestañas y Formatos", "setupInitialSheets")
    .addToUi();
}

function setupInitialSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var territories = ["Spain", "UK", "USA"];
  territories.forEach(function(t) {
    var s = ss.getSheetByName(t);
    if (!s) {
      s = ss.insertSheet(t);
      s.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
      var r = s.getRange(1, 1, 1, COLUMNS.length);
      r.setBackground("#2563EB");
      r.setFontColor("#FFFFFF");
      r.setFontWeight("bold");
      s.setFrozenRows(1);
      s.autoResizeColumns(1, COLUMNS.length);
    }
  });

  var res = ss.getSheetByName("Resumen General");
  if (!res) {
    res = ss.insertSheet("Resumen General");
    res.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
    var r2 = res.getRange(1, 1, 1, COLUMNS.length);
    r2.setBackground("#6B4ABF");
    r2.setFontColor("#FFFFFF");
    r2.setFontWeight("bold");
    res.setFrozenRows(1);
    res.autoResizeColumns(1, COLUMNS.length);
  }

  SpreadsheetApp.getUi().alert("✅ Pestañas preparadas: Spain, UK, USA y Resumen General creadas correctamente.");
}`;

export function getSavedGoogleSheetsUrl(): string {
  try {
    return localStorage.getItem(GOOGLE_SHEETS_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveGoogleSheetsUrl(url: string): void {
  try {
    localStorage.setItem(GOOGLE_SHEETS_STORAGE_KEY, url.trim());
  } catch {
    // ignore
  }
}

export interface SyncResponse {
  status: 'success' | 'error';
  message: string;
  totalClients?: number;
  spainCount?: number;
  ukCount?: number;
  usaCount?: number;
  timestamp?: string;
}

export async function syncClientsToGoogleSheets(
  clients: ClientProfile[],
  webhookUrl: string
): Promise<SyncResponse> {
  if (!webhookUrl || !webhookUrl.startsWith('https://script.google.com/')) {
    throw new Error('La URL de Google Apps Script debe comenzar con https://script.google.com/...');
  }

  // Empaquetar clientes con sus resultados calculados
  const enrichedClients = clients.map((c) => ({
    profile: c,
    inputs: c.inputs,
    results: calculateAll(c.inputs),
  }));

  const payload = {
    action: 'sync_all',
    clients: enrichedClients,
    exportedAt: new Date().toISOString(),
  };

  // Usamos text/plain para evitar problemas de CORS preflight con Google Apps Script
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Error en el servidor de Google (${response.status}): ${response.statusText}`);
  }

  const result: SyncResponse = await response.json();
  return result;
}

export async function testGoogleSheetsConnection(webhookUrl: string): Promise<{
  success: boolean;
  message: string;
  sheetName?: string;
}> {
  if (!webhookUrl || !webhookUrl.startsWith('https://script.google.com/')) {
    return {
      success: false,
      message: 'La URL no tiene el formato de Google Apps Script (https://script.google.com/...)',
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      return {
        success: false,
        message: `HTTP Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    if (data.status === 'success') {
      return {
        success: true,
        message: data.message || 'Conexión exitosa',
        sheetName: data.sheetName,
      };
    } else {
      return {
        success: false,
        message: data.message || 'Respuesta inválida del script',
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `No se pudo conectar: ${errorMsg}. Asegúrate de haber implementado con acceso 'Cualquier persona'.`,
    };
  }
}
