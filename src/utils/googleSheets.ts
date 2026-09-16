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
 * Pestañas automáticas:
 *   - "Spain"
 *   - "UK"
 *   - "USA"
 *   - "Resumen General"
 * Soporta:
 *   - GET: Cargar clientes desde Google Sheet a la calculadora
 *   - POST (save_client): Guardar/Actualizar el cliente actual que estás cotizando
 *   - POST (sync_all): Sincronizar todos los clientes de una vez
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

// GET: Cargar clientes desde la hoja hacia la aplicación web
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Resumen General");
    if (!sheet) {
      sheet = ss.getSheets()[0];
    }

    var lastRow = sheet.getLastRow();
    var clients = [];

    if (lastRow > 1) {
      var data = sheet.getRange(2, 1, lastRow - 1, COLUMNS.length).getValues();
      clients = data.map(function(row, index) {
        var clientId = String(row[0] || ("client-" + (index + 1)));
        var clientName = String(row[1] || ("Cliente " + (index + 1)));
        var warehouse = String(row[2] || "Spain");
        var productType = String(row[3] || "Suplementos");
        var skuCount = Number(row[4]) || 1;
        var ordersMonth = Number(row[5]) || 100;
        var unitsPerOrder = Number(row[6]) || 1;
        var packPrice = Number(row[7]) || 0;
        var firstPickPrice = Number(row[8]) || 0;
        var addPickPrice = Number(row[9]) || 0;
        var shippingPrice = Number(row[10]) || 0;
        var goLiveDate = String(row[17] || "");
        var techs = row[18] ? String(row[18]).split(",").map(function(s) { return s.trim(); }).filter(Boolean) : [];
        var notes = String(row[19] || "");
        var updatedAt = String(row[20] || new Date().toISOString());

        return {
          id: clientId,
          name: clientName,
          notes: notes,
          updatedAt: updatedAt,
          inputs: {
            clientName: clientName,
            warehouse: warehouse,
            productType: productType,
            skuCount: skuCount,
            ordersMonth: ordersMonth,
            unitsPerOrder: unitsPerOrder,
            packCostSource: "Calculadora (negociado)",
            volumeMode: "Pedidos/mes",
            workingDays: 22,
            ordersPerDay: Math.round(ordersMonth / 22),
            mixSpk: 40,
            mixSpl: 40,
            mixMpl: 15,
            mixLpl: 5,
            packPriceManual: packPrice,
            firstPickPriceManual: firstPickPrice,
            additionalPickPriceManual: addPickPrice,
            shippingPriceManual: shippingPrice,
            goLiveDate: goLiveDate,
            technologies: techs,
            clientNotes: notes
          }
        };
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      sheetName: ss.getName(),
      totalClients: clients.length,
      clients: clients,
      message: "Cargados " + clients.length + " clientes desde " + ss.getName()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Error al leer clientes: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// POST: Guardar cliente cotizado o sincronizar todo
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
    var action = payload.action || "save_client";
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Guardar / Actualizar cliente individual (en tiempo real mientras cotizas)
    if (action === "save_client" && payload.client) {
      var item = payload.client;
      var p = item.profile || item;
      var inp = p.inputs || {};
      var territory = inp.warehouse || "Spain";

      // Asegurar pestañas
      var tSheet = ensureSheet(ss, territory, "#2563EB");
      var rSheet = ensureSheet(ss, "Resumen General", "#6B4ABF");

      // Actualizar o insertar en su territorio y en resumen general
      upsertClientInSheet(tSheet, item);
      upsertClientInSheet(rSheet, item);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "save_client",
        clientName: p.name || inp.clientName,
        territory: territory,
        message: "Cliente '" + (p.name || inp.clientName) + "' guardado y actualizado en pestañas '" + territory + "' y 'Resumen General'."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Sincronizar todos los clientes
    var clients = payload.clients || [];
    var territories = ["Spain", "UK", "USA"];

    territories.forEach(function(territory) {
      var filtered = clients.filter(function(c) {
        var w = (c.inputs && c.inputs.warehouse) || "Spain";
        return w.toLowerCase().trim() === territory.toLowerCase().trim();
      });
      syncFullSheet(ss, territory, filtered, "#2563EB");
    });

    syncFullSheet(ss, "Resumen General", clients, "#6B4ABF");

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      action: "sync_all",
      totalClients: clients.length,
      message: "Todos los " + clients.length + " clientes sincronizados correctamente en la hoja Margen."
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Error al guardar: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function ensureSheet(ss, name, headerBgColor) {
  var s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name);
    s.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
    var r = s.getRange(1, 1, 1, COLUMNS.length);
    r.setBackground(headerBgColor);
    r.setFontColor("#FFFFFF");
    r.setFontWeight("bold");
    r.setFontFamily("Arial");
    r.setFontSize(10);
    r.setHorizontalAlignment("center");
    s.setFrozenRows(1);
    s.autoResizeColumns(1, COLUMNS.length);
  }
  return s;
}

function upsertClientInSheet(sheet, item) {
  var p = item.profile || item;
  var inp = p.inputs || {};
  var res = item.results || {};
  var channels = (inp.technologies && inp.technologies.length > 0) ? inp.technologies.join(", ") : "";
  var marginPct = res.marginTotal !== null && res.marginTotal !== undefined ? res.marginTotal : 0;

  var rowData = [
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

  var lastRow = sheet.getLastRow();
  var targetRow = -1;

  if (lastRow > 1) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    var names = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if ((p.id && String(ids[i][0]) === String(p.id)) ||
          (p.name && String(names[i][0]).toLowerCase().trim() === String(p.name).toLowerCase().trim())) {
        targetRow = i + 2;
        break;
      }
    }
  }

  if (targetRow > 1) {
    sheet.getRange(targetRow, 1, 1, COLUMNS.length).setValues([rowData]);
  } else {
    targetRow = Math.max(lastRow + 1, 2);
    sheet.getRange(targetRow, 1, 1, COLUMNS.length).setValues([rowData]);
  }

  // Estilos
  sheet.getRange(targetRow, 1, 1, COLUMNS.length).setFontFamily("Arial").setFontSize(10);
  [8, 9, 10, 11, 12, 13, 16, 17].forEach(function(colIndex) {
    sheet.getRange(targetRow, colIndex).setNumberFormat("€#,##0.00");
  });
  sheet.getRange(targetRow, 14).setNumberFormat("0.0%");
  sheet.getRange(targetRow, 5).setNumberFormat("#,##0");
  sheet.getRange(targetRow, 6).setNumberFormat("#,##0");
  sheet.getRange(targetRow, 7).setNumberFormat("0.0");
  sheet.getRange(targetRow, 15).setNumberFormat("0.00");
  sheet.getRange(targetRow, 1).setHorizontalAlignment("center");
  sheet.getRange(targetRow, 3).setHorizontalAlignment("center");
  sheet.getRange(targetRow, 18).setHorizontalAlignment("center");
  sheet.getRange(targetRow, 21).setHorizontalAlignment("center");
  sheet.autoResizeColumns(1, COLUMNS.length);
}

function syncFullSheet(ss, sheetName, clientsList, headerBgColor) {
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

  [8, 9, 10, 11, 12, 13, 16, 17].forEach(function(colIndex) {
    sheet.getRange(2, colIndex, rows.length, 1).setNumberFormat("€#,##0.00");
  });
  sheet.getRange(2, 14, rows.length, 1).setNumberFormat("0.0%");
  sheet.getRange(2, 5, rows.length, 1).setNumberFormat("#,##0");
  sheet.getRange(2, 6, rows.length, 1).setNumberFormat("#,##0");
  sheet.getRange(2, 7, rows.length, 1).setNumberFormat("0.0");
  sheet.getRange(2, 15, rows.length, 1).setNumberFormat("0.00");
  sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment("center");
  sheet.getRange(2, 3, rows.length, 1).setHorizontalAlignment("center");
  sheet.getRange(2, 18, rows.length, 1).setHorizontalAlignment("center");
  sheet.getRange(2, 21, rows.length, 1).setHorizontalAlignment("center");
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
  clientName?: string;
  territory?: string;
}

export async function saveSingleClientToGoogleSheets(
  client: ClientProfile,
  webhookUrl: string
): Promise<{ status: 'success' | 'error'; message: string; clientName?: string; territory?: string }> {
  if (!webhookUrl || !webhookUrl.startsWith('https://script.google.com/')) {
    throw new Error('La URL de Google Apps Script debe comenzar con https://script.google.com/...');
  }

  const enrichedClient = {
    profile: client,
    inputs: client.inputs,
    results: calculateAll(client.inputs),
  };

  const payload = {
    action: 'save_client',
    client: enrichedClient,
    exportedAt: new Date().toISOString(),
  };

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

  return await response.json();
}

export async function fetchClientsFromGoogleSheets(webhookUrl: string): Promise<{
  success: boolean;
  message: string;
  clients: ClientProfile[];
  sheetName?: string;
}> {
  if (!webhookUrl || !webhookUrl.startsWith('https://script.google.com/')) {
    throw new Error('La URL de Google Apps Script debe comenzar con https://script.google.com/...');
  }

  const response = await fetch(webhookUrl, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Error HTTP (${response.status}): ${response.statusText}`);
  }

  const data = await response.json();
  if (data.status === 'success' && Array.isArray(data.clients)) {
    return {
      success: true,
      message: data.message || `Cargados ${data.clients.length} clientes`,
      clients: data.clients,
      sheetName: data.sheetName,
    };
  }

  throw new Error(data.message || 'Respuesta inválida al cargar clientes de Google Sheet');
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
