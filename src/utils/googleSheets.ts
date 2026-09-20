import { ClientProfile } from '../types';
import { calculateAll } from './calculations';
import { DEFAULT_INPUTS } from '../data/constants';
import { parseSheetNumber } from './numberParser';

export { parseSheetNumber };

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
  'Datos Completos (JSON)',
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
 *   - GET: Cargar clientes desde Google Sheet a cualquier ordenador
 *   - POST (load_clients): Cargar clientes sin bloqueos de red
 *   - POST (save_client): Guardar/actualizar cliente individual en tiempo real
 *   - POST (sync_all): Sincronizar toda la cartera de clientes
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
  "Última Actualización",
  "Datos Completos (JSON)"
];

// Función universal de lectura de clientes desde Google Sheet
function readClientsFromSpreadsheet(ss) {
  if (!ss) {
    throw new Error("No hay hoja de cálculo vinculada activa.");
  }

  // Buscar la hoja con datos más completa
  var targetSheets = ["Resumen General", "Margen", "Spain", "UK", "USA"];
  var sheet = null;

  for (var s = 0; s < targetSheets.length; s++) {
    var cand = ss.getSheetByName(targetSheets[s]);
    if (cand && cand.getLastRow() > 1) {
      sheet = cand;
      break;
    }
  }

  if (!sheet) {
    var all = ss.getSheets();
    for (var i = 0; i < all.length; i++) {
      if (all[i].getLastRow() > 1) {
        sheet = all[i];
        break;
      }
    }
  }

  if (!sheet) {
    sheet = ss.getSheetByName("Resumen General") || ss.getSheets()[0];
  }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var clients = [];

  if (lastRow > 1 && lastCol >= 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    clients = data.map(function(row, index) {
      // 1. Si existe JSON completo en la columna 22 (índice 21), cargarlo directamente para 100% de precisión
      var jsonStr = (row.length > 21) ? row[21] : null;
      if (jsonStr && typeof jsonStr === "string" && jsonStr.trim().charAt(0) === "{") {
        try {
          var parsed = JSON.parse(jsonStr);
          if (parsed) {
            var profile = parsed.profile || parsed;
            if (profile && (profile.inputs || profile.name)) {
              return profile;
            }
          }
        } catch (e) {
          // fallback a columnas individuales
        }
      }

      // 2. Reconstrucción por columnas individuales con soporte para 1,000 = 1.000 = 1000
      function parseVal(v, isInt) {
        if (v === null || v === undefined) return 0;
        if (typeof v === "number") return isNaN(v) ? 0 : (isInt ? Math.round(v) : v);
        var s = String(v).trim().replace(/[€$£%'"\s\u00A0\u202F]/g, "");
        if (!s) return 0;
        var d = s.lastIndexOf("."), c = s.lastIndexOf(",");
        if (d !== -1 && c !== -1) {
          s = (d > c) ? s.replace(/,/g, "") : s.replace(/\./g, "").replace(",", ".");
          var n = parseFloat(s);
          return isNaN(n) ? 0 : (isInt ? Math.round(n) : n);
        }
        if (c !== -1) {
          var pC = s.split(",");
          if (pC.length > 2) { s = s.replace(/,/g, ""); }
          else if (pC[1] && (pC[1].length === 3 || isInt)) { s = (pC[1].length === 3) ? s.replace(/,/g, "") : (pC[1] === "0" || pC[1] === "00") ? pC[0] : s.replace(",", "."); }
          else { s = s.replace(",", "."); }
        } else if (d !== -1) {
          var pD = s.split(".");
          if (pD.length > 2) { s = s.replace(/\./g, ""); }
          else if (pD[1] && (pD[1].length === 3 || isInt)) { s = (pD[1].length === 3) ? s.replace(/\./g, "") : (pD[1] === "0" || pD[1] === "00") ? pD[0] : s; }
        }
        var res = parseFloat(s);
        return isNaN(res) ? 0 : (isInt ? Math.round(res) : res);
      }

      var clientId = String(row[0] || ("client-" + (index + 1)));
      var clientName = String(row[1] || ("Cliente " + (index + 1)));
      var warehouse = String(row[2] || "Spain");
      var productType = String(row[3] || "Suplementos");
      var skuCount = parseVal(row[4], true) || 1;
      var ordersMonth = parseVal(row[5], true) || 100;
      var unitsPerOrder = parseVal(row[6], false) || 1;
      var packPrice = parseVal(row[7], false) || 0;
      var firstPickPrice = parseVal(row[8], false) || 0;
      var addPickPrice = parseVal(row[9], false) || 0;
      var shippingPrice = parseVal(row[10], false) || 0;
      var goLiveDate = String(row[17] || "");
      var techs = row[18] ? String(row[18]).split(",").map(function(item) { return item.trim(); }).filter(Boolean) : [];
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

  return {
    status: "success",
    sheetName: ss.getName(),
    currentSheet: sheet.getName(),
    totalClients: clients.length,
    clients: clients,
    supportsLoadClients: true,
    message: "Cargados " + clients.length + " clientes desde " + ss.getName() + " (" + sheet.getName() + ")"
  };
}

// GET: Cargar clientes o verificar conexión
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "No se encontró la hoja activa vinculada. Abre tu hoja 'Margen' y ve a Extensiones > Apps Script."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var paramAction = (e && e.parameter && e.parameter.action) || "";
    if (paramAction === "ping" || paramAction === "status" || paramAction === "test") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        sheetName: ss.getName(),
        supportsLoadClients: true,
        message: "Conexión activa con Google Sheet: " + ss.getName()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var result = readClientsFromSpreadsheet(ss);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Error al leer clientes: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// POST: Guardar, sincronizar o leer clientes sin bloqueos de red
function doPost(e) {
  try {
    var raw = e.postData ? e.postData.contents : "";
    var payload = {};
    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch (err) {
        payload = {};
      }
    }

    var action = payload.action || (e && e.parameter && e.parameter.action) || "save_client";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "No se encontró la hoja vinculada. Crea el script desde Extensiones > Apps Script en tu hoja."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1. Cargar clientes vía POST
    if (action === "load_clients" || action === "get_clients" || action === "read") {
      var loadResult = readClientsFromSpreadsheet(ss);
      return ContentService.createTextOutput(JSON.stringify(loadResult)).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Ping de verificación
    if (action === "ping" || action === "status" || action === "test") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        sheetName: ss.getName(),
        supportsLoadClients: true,
        message: "Conexión activa con Google Sheet: " + ss.getName()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Guardar / Actualizar cliente individual
    if ((action === "save_client" || !payload.clients) && (payload.client || (payload.clients && payload.clients.length === 1))) {
      var item = payload.client || (payload.clients && payload.clients[0]);
      var p = item.profile || item;
      var inp = p.inputs || {};
      var territory = inp.warehouse || "Spain";

      // Asegurar pestañas
      var tSheet = ensureSheet(ss, territory, "#2563EB");
      var rSheet = ensureSheet(ss, "Resumen General", "#6B4ABF");

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

    // 4. Sincronizar todos los clientes
    var clients = payload.clients || [];
    if (payload.client && clients.length === 0) {
      clients = [payload.client];
    }

    var territories = ["Spain", "UK", "USA"];
    var territoryCounts = {};

    territories.forEach(function(territory) {
      var filtered = clients.filter(function(c) {
        var prof = c.profile || c;
        var w = (prof.inputs && prof.inputs.warehouse) || "Spain";
        return w.toLowerCase().trim() === territory.toLowerCase().trim();
      });
      territoryCounts[territory] = filtered.length;
      syncFullSheet(ss, territory, filtered, "#2563EB");
    });

    syncFullSheet(ss, "Resumen General", clients, "#6B4ABF");

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      action: "sync_all",
      totalClients: clients.length,
      spainCount: territoryCounts["Spain"] || 0,
      ukCount: territoryCounts["UK"] || 0,
      usaCount: territoryCounts["USA"] || 0,
      timestamp: new Date().toISOString(),
      message: "Todos los " + clients.length + " clientes sincronizados correctamente en la hoja Margen."
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Error en Google Sheet: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function ensureSheet(ss, name, headerBgColor) {
  var s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name);
  }
  if (s.getMaxColumns() < COLUMNS.length) {
    s.insertColumnsAfter(s.getMaxColumns(), COLUMNS.length - s.getMaxColumns());
  }
  if (s.getLastRow() === 0) {
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
  if (sheet.getMaxColumns() < COLUMNS.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), COLUMNS.length - sheet.getMaxColumns());
  }

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
    new Date().toLocaleString(),
    JSON.stringify(p)
  ];

  var lastRow = sheet.getLastRow();
  var targetRow = -1;

  var normTargetName = (p.name || inp.clientName || "").toLowerCase().trim();
  var isGenericName = !normTargetName || normTargetName === "cliente" || normTargetName === "nuevo cliente" || normTargetName === "client";
  var isGenericId = !p.id || p.id === "client-1" || p.id === "client-2" || String(p.id).indexOf("demo") >= 0;

  if (lastRow > 1) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    var names = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      var rowName = String(names[i][0] || "").toLowerCase().trim();
      var rowId = String(ids[i][0] || "").trim();

      if (!isGenericName && rowName === normTargetName) {
        targetRow = i + 2;
        break;
      }
      if (!isGenericId && rowId === String(p.id)) {
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
  var sheet = ensureSheet(ss, sheetName, headerBgColor);

  if (!clientsList || clientsList.length === 0) {
    sheet.autoResizeColumns(1, COLUMNS.length);
    return;
  }

  // Fusionar clientes de forma segura sin borrar nada previo
  clientsList.forEach(function(item) {
    upsertClientInSheet(sheet, item);
  });
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
    }
    if (s.getMaxColumns() < COLUMNS.length) {
      s.insertColumnsAfter(s.getMaxColumns(), COLUMNS.length - s.getMaxColumns());
    }
    s.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
    var r = s.getRange(1, 1, 1, COLUMNS.length);
    r.setBackground("#2563EB");
    r.setFontColor("#FFFFFF");
    r.setFontWeight("bold");
    s.setFrozenRows(1);
    s.autoResizeColumns(1, COLUMNS.length);
  });

  var res = ss.getSheetByName("Resumen General");
  if (!res) {
    res = ss.insertSheet("Resumen General");
  }
  if (res.getMaxColumns() < COLUMNS.length) {
    res.insertColumnsAfter(res.getMaxColumns(), COLUMNS.length - res.getMaxColumns());
  }
  res.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
  var r2 = res.getRange(1, 1, 1, COLUMNS.length);
  r2.setBackground("#6B4ABF");
  r2.setFontColor("#FFFFFF");
  r2.setFontWeight("bold");
  res.setFrozenRows(1);
  res.autoResizeColumns(1, COLUMNS.length);

  SpreadsheetApp.getUi().alert("✅ Pestañas preparadas: Spain, UK, USA y Resumen General listas para sincronizar.");
}`;

export interface ServerStatusResponse {
  configured: boolean;
  isServerEnv?: boolean;
  connected?: boolean;
  sheetName?: string;
  tabs?: string[];
  serviceAccountEmail?: string;
  spreadsheetId?: string;
  diagnostics?: {
    spreadsheetIdSet: boolean;
    individualVars: {
      emailSet: boolean;
      privateKeySet: boolean;
      projectIdSet: boolean;
      emailValue?: string;
      privateKeyLength?: number;
    };
    jsonBlob: {
      keySet: boolean;
      keyParsable: boolean;
      hasClientEmail: boolean;
      hasPrivateKey: boolean;
      jsonLength?: number;
    };
    resolvedStrategy: 'INDIVIDUAL_VARS' | 'JSON_BLOB' | 'NONE';
  };
  supportsLoadClients?: boolean;
  needsScriptUpdate?: boolean;
  errorType?: string;
  message?: string;
  error?: string;
}

export async function checkServerSheetsStatus(customUrl?: string): Promise<ServerStatusResponse> {
  try {
    const query = customUrl ? `?action=status&webhookUrl=${encodeURIComponent(customUrl)}` : '?action=status';
    const res = await fetch(`/api/sheets${query}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // API endpoint not reachable
  }
  return { configured: false, message: 'API no disponible' };
}

// URL configurada en Vercel Dashboard -> Settings -> Environment Variables
export const VERCEL_ENV_GOOGLE_SHEETS_URL: string = (
  (import.meta.env.VITE_GOOGLE_SHEETS_WEBAPP_URL as string | undefined) ||
  (import.meta.env.VITE_GOOGLE_SHEETS_URL as string | undefined) ||
  ''
).trim();

export function hasVercelEnvGoogleSheetsUrl(): boolean {
  return (
    VERCEL_ENV_GOOGLE_SHEETS_URL.length > 0 &&
    VERCEL_ENV_GOOGLE_SHEETS_URL.startsWith('https://script.google.com/')
  );
}

export function isUsingVercelEnvUrl(): boolean {
  try {
    const local = localStorage.getItem(GOOGLE_SHEETS_STORAGE_KEY);
    if (!local || local.trim().length === 0) {
      return hasVercelEnvGoogleSheetsUrl();
    }
    return local.trim() === VERCEL_ENV_GOOGLE_SHEETS_URL;
  } catch {
    return hasVercelEnvGoogleSheetsUrl();
  }
}

export function getSavedGoogleSheetsUrl(): string {
  try {
    const local = localStorage.getItem(GOOGLE_SHEETS_STORAGE_KEY);
    if (local && local.trim().length > 0) {
      return local.trim();
    }
  } catch {
    // ignore
  }
  return VERCEL_ENV_GOOGLE_SHEETS_URL;
}

export function saveGoogleSheetsUrl(url: string): void {
  try {
    localStorage.setItem(GOOGLE_SHEETS_STORAGE_KEY, url.trim());
  } catch {
    // ignore
  }
}

export function resetGoogleSheetsUrlToEnv(): string {
  try {
    localStorage.removeItem(GOOGLE_SHEETS_STORAGE_KEY);
  } catch {
    // ignore
  }
  return VERCEL_ENV_GOOGLE_SHEETS_URL;
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
  isServerEnv?: boolean;
}

export function mergeClientProfiles(
  currentList: ClientProfile[],
  incomingList: ClientProfile[]
): ClientProfile[] {
  if (!incomingList || incomingList.length === 0) return currentList;
  if (!currentList || currentList.length === 0) return incomingList;

  const result = [...currentList];

  for (const incoming of incomingList) {
    const incNameLower = (incoming.name || incoming.id || '').trim().toLowerCase();
    if (!incNameLower) continue;

    const existingIdx = result.findIndex((c) => {
      const cName = (c.name || c.id || '').trim().toLowerCase();
      const cId = (c.id || '').trim().toLowerCase();
      return cName === incNameLower || cId === incNameLower;
    });

    if (existingIdx >= 0) {
      // Actualizar cliente existente con los datos reales de Google Sheet manteniendo propiedades locales no sobreescritas
      result[existingIdx] = {
        ...result[existingIdx],
        ...incoming,
        id: incoming.name || incoming.id,
        name: incoming.name || incoming.id,
        inputs: {
          ...result[existingIdx].inputs,
          ...incoming.inputs,
          clientName: incoming.name || incoming.id,
        },
      };
    } else {
      // Incorporar nuevo cliente proveniente de Google Sheet
      result.push(incoming);
    }
  }

  return result;
}

function sanitizeClientList(rawList: any[]): ClientProfile[] {
  return rawList.map((c: any, idx: number) => {
    const rawInputs = c.inputs || {};
    const name = String(c.name || rawInputs.clientName || (c.profile && c.profile.name) || `Cliente ${idx + 1}`).trim();
    // El ID es idéntico al nombre del cliente
    const id = name;

    const packPrice = parseSheetNumber(rawInputs.packPriceManual, false);
    const firstPickPrice = parseSheetNumber(rawInputs.firstPickPriceManual, false);
    const addPickPrice = parseSheetNumber(rawInputs.additionalPickPriceManual, false);
    const shippingPrice = parseSheetNumber(rawInputs.shippingPriceManual, false);

    const parsedOrdersMonth = parseSheetNumber(rawInputs.ordersMonth, true);
    const ordersMonth = parsedOrdersMonth > 0 ? parsedOrdersMonth : (Number(rawInputs.ordersMonth) || DEFAULT_INPUTS.ordersMonth);

    const parsedSkuCount = parseSheetNumber(rawInputs.skuCount, true);
    const skuCount = parsedSkuCount > 0 ? parsedSkuCount : (Number(rawInputs.skuCount) || DEFAULT_INPUTS.skuCount);

    const parsedUnits = parseSheetNumber(rawInputs.unitsPerOrder, false);
    const unitsPerOrder = parsedUnits > 0 ? parsedUnits : (Number(rawInputs.unitsPerOrder) || DEFAULT_INPUTS.unitsPerOrder);

    const parsedWorkingDays = parseSheetNumber(rawInputs.workingDays, true);
    const workingDays = parsedWorkingDays > 0 ? parsedWorkingDays : (Number(rawInputs.workingDays) || DEFAULT_INPUTS.workingDays);

    const parsedOrdersPerDay = parseSheetNumber(rawInputs.ordersPerDay, false);
    const ordersPerDay = parsedOrdersPerDay > 0 ? parsedOrdersPerDay : Math.round(ordersMonth / (workingDays || 22));

    return {
      id,
      name,
      notes: String(c.notes || rawInputs.clientNotes || ''),
      updatedAt: String(c.updatedAt || new Date().toISOString()),
      inputs: {
        ...DEFAULT_INPUTS,
        ...rawInputs,
        clientName: name,
        ordersMonth: ordersMonth,
        unitsPerOrder: unitsPerOrder,
        skuCount: skuCount,
        workingDays: workingDays,
        ordersPerDay: ordersPerDay,
        mixSpk: Number(rawInputs.mixSpk) ?? DEFAULT_INPUTS.mixSpk,
        mixSpl: Number(rawInputs.mixSpl) ?? DEFAULT_INPUTS.mixSpl,
        mixMpl: Number(rawInputs.mixMpl) ?? DEFAULT_INPUTS.mixMpl,
        mixLpl: Number(rawInputs.mixLpl) ?? DEFAULT_INPUTS.mixLpl,
        packPriceManual: packPrice,
        packPriceMode: rawInputs.packPriceMode || (packPrice > 0 ? 'manual' : 'margin'),
        firstPickPriceManual: firstPickPrice,
        firstPickPriceMode: rawInputs.firstPickPriceMode || (firstPickPrice > 0 ? 'manual' : 'margin'),
        additionalPickPriceManual: addPickPrice,
        additionalPickPriceMode: rawInputs.additionalPickPriceMode || (addPickPrice > 0 ? 'manual' : 'margin'),
        shippingPriceManual: shippingPrice,
        shippingPriceMode: rawInputs.shippingPriceMode || (shippingPrice > 0 ? 'manual' : 'margin'),
        subscriptionTier: rawInputs.subscriptionTier || 'none',
        subscriptionPrice: parseSheetNumber(rawInputs.subscriptionPrice, false),
        technologies: Array.isArray(rawInputs.technologies) ? rawInputs.technologies : ['Shopify'],
      },
    };
  });
}

export async function saveSingleClientToGoogleSheets(
  client: ClientProfile,
  webhookUrl?: string
): Promise<{
  status: 'success' | 'error';
  message: string;
  clientName?: string;
  territory?: string;
  isDuplicate?: boolean;
  isUpdated?: boolean;
  matchedRow?: number;
  warning?: string;
}> {
  const effectiveUrl = (webhookUrl || getSavedGoogleSheetsUrl()).trim();

  const clientName = String(client.name || client.inputs?.clientName || 'Cliente').trim();
  const normalizedClient: ClientProfile = {
    ...client,
    id: clientName,
    name: clientName,
    inputs: {
      ...client.inputs,
      clientName: clientName,
    },
  };

  const enrichedClient = {
    profile: normalizedClient,
    inputs: normalizedClient.inputs,
    results: calculateAll(normalizedClient.inputs),
  };

  const payload = {
    action: 'save_client',
    client: enrichedClient,
    clients: [enrichedClient], // Retrocompatibilidad para scripts previos
    exportedAt: new Date().toISOString(),
    webhookUrl: effectiveUrl,
  };

  // 1. Intentar a través de la API segura del servidor /api/sheets
  try {
    const apiResp = await fetch('/api/sheets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (apiResp.ok) {
      const data = await apiResp.json();
      if (data && (data.status === 'success' || data.success)) {
        return data;
      }
      if (data && data.message) {
        throw new Error(data.message);
      }
    } else {
      const errData = await apiResp.json().catch(() => null);
      if (errData && errData.message) {
        throw new Error(errData.message);
      }
    }
  } catch (apiErr: any) {
    if (apiErr.message && !apiErr.message.includes('Failed to fetch')) {
      throw apiErr;
    }
  }

  // 2. Fallback a llamada directa si se tiene una URL directa en el navegador
  if (effectiveUrl && effectiveUrl.startsWith('https://script.google.com/')) {
    const response = await fetch(effectiveUrl, {
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

  throw new Error(
    'Configura las variables de Google Sheets API en Vercel (GOOGLE_SHEETS_SPREADSHEET_ID y GOOGLE_SERVICE_ACCOUNT_KEY) o la URL de la Web App.'
  );
}

export async function fetchClientsFromGoogleSheets(webhookUrl?: string): Promise<{
  success: boolean;
  message: string;
  clients: ClientProfile[];
  sheetName?: string;
  isServerEnv?: boolean;
  needsScriptUpdate?: boolean;
}> {
  const effectiveUrl = (webhookUrl || getSavedGoogleSheetsUrl()).trim();

  // 1. Intentar a través de la API segura del servidor /api/sheets
  try {
    const apiResp = await fetch('/api/sheets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'load_clients',
        webhookUrl: effectiveUrl,
      }),
    });

    if (apiResp.ok) {
      const apiData = await apiResp.json();
      if (apiData && (apiData.status === 'success' || apiData.success) && Array.isArray(apiData.clients)) {
        return {
          success: true,
          message: apiData.message || `Cargados ${apiData.clients.length} clientes`,
          clients: sanitizeClientList(apiData.clients),
          sheetName: apiData.sheetName || 'Margen',
          isServerEnv: Boolean(apiData.isServerEnv),
          needsScriptUpdate: Boolean(apiData.needsScriptUpdate),
        };
      }
      if (apiData && apiData.message) {
        throw new Error(apiData.message);
      }
    } else {
      const errData = await apiResp.json().catch(() => null);
      if (errData && errData.message) {
        throw new Error(errData.message);
      }
    }
  } catch (apiErr: any) {
    if (apiErr.message && !apiErr.message.includes('Failed to fetch')) {
      throw apiErr;
    }
  }

  // 2. Fallback a llamada directa si se tiene una URL en el navegador
  if (!effectiveUrl || !effectiveUrl.startsWith('https://script.google.com/')) {
    throw new Error(
      'Para que todos los ordenadores carguen los datos automáticamente, configura GOOGLE_SHEETS_SPREADSHEET_ID y GOOGLE_SERVICE_ACCOUNT_KEY en las variables de entorno de Vercel (o GOOGLE_SHEETS_WEBAPP_URL).'
    );
  }

  let data: any = null;
  let fetchError: Error | null = null;

  try {
    const postResponse = await fetch(effectiveUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'load_clients' }),
    });

    if (postResponse.ok) {
      const parsed = await postResponse.json();
      if (parsed && parsed.status === 'success' && Array.isArray(parsed.clients)) {
        data = parsed;
      }
    }
  } catch (err: unknown) {
    fetchError = err instanceof Error ? err : new Error(String(err));
  }

  if (!data || !Array.isArray(data.clients)) {
    try {
      const getResponse = await fetch(effectiveUrl, {
        method: 'GET',
      });

      if (!getResponse.ok) {
        throw new Error(`Error HTTP (${getResponse.status}): ${getResponse.statusText}`);
      }

      data = await getResponse.json();
    } catch (getErr: unknown) {
      const errMsg = getErr instanceof Error ? getErr.message : String(getErr);
      throw new Error(`Error al conectar con Google Sheets (${errMsg}). ${fetchError ? `(POST también falló: ${fetchError.message})` : ''}`);
    }
  }

  if (data && data.status === 'success' && Array.isArray(data.clients)) {
    return {
      success: true,
      message: data.message || `Cargados ${data.clients.length} clientes`,
      clients: sanitizeClientList(data.clients),
      sheetName: data.sheetName,
    };
  }

  throw new Error(data?.message || 'Respuesta inválida al cargar clientes de Google Sheet');
}

export async function syncClientsToGoogleSheets(
  clients: ClientProfile[],
  webhookUrl?: string
): Promise<SyncResponse> {
  const effectiveUrl = (webhookUrl || getSavedGoogleSheetsUrl()).trim();

  const enrichedClients = clients.map((c) => {
    const clientName = String(c.name || c.inputs?.clientName || 'Cliente').trim();
    const normalizedClient: ClientProfile = {
      ...c,
      id: clientName,
      name: clientName,
      inputs: {
        ...c.inputs,
        clientName: clientName,
      },
    };
    return {
      profile: normalizedClient,
      inputs: normalizedClient.inputs,
      results: calculateAll(normalizedClient.inputs),
    };
  });

  const payload = {
    action: 'sync_all',
    clients: enrichedClients,
    exportedAt: new Date().toISOString(),
    webhookUrl: effectiveUrl,
  };

  // 1. Intentar a través de la API segura del servidor /api/sheets
  try {
    const apiResp = await fetch('/api/sheets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (apiResp.ok) {
      const result: SyncResponse = await apiResp.json();
      if (result && (result.status === 'success' || (result as any).success)) {
        return result;
      }
      if (result && result.message) {
        throw new Error(result.message);
      }
    } else {
      const errData = await apiResp.json().catch(() => null);
      if (errData && errData.message) {
        throw new Error(errData.message);
      }
    }
  } catch (apiErr: any) {
    if (apiErr.message && !apiErr.message.includes('Failed to fetch')) {
      throw apiErr;
    }
  }

  // 2. Fallback a llamada directa
  if (effectiveUrl && effectiveUrl.startsWith('https://script.google.com/')) {
    const response = await fetch(effectiveUrl, {
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

  throw new Error('Configura GOOGLE_SHEETS_WEBAPP_URL en Vercel o introduce la URL en la calculadora.');
}

export async function testGoogleSheetsConnection(webhookUrl?: string): Promise<{
  success: boolean;
  message: string;
  sheetName?: string;
  isServerEnv?: boolean;
  needsScriptUpdate?: boolean;
  supportsLoadClients?: boolean;
  errorType?: string;
}> {
  const effectiveUrl = (webhookUrl || getSavedGoogleSheetsUrl()).trim();

  // 1. Verificar estado a través de la API
  try {
    const apiResp = await fetch(
      `/api/sheets?action=status${effectiveUrl ? `&webhookUrl=${encodeURIComponent(effectiveUrl)}` : ''}`
    );
    if (apiResp.ok) {
      const statusData = await apiResp.json();
      if (statusData.configured && statusData.connected) {
        return {
          success: true,
          message: statusData.message || 'Conexión con Google Sheet exitosa vía API Segura',
          sheetName: statusData.sheetName || 'Margen',
          isServerEnv: Boolean(statusData.isServerEnv),
          needsScriptUpdate: Boolean(statusData.needsScriptUpdate),
          supportsLoadClients: Boolean(statusData.supportsLoadClients),
        };
      } else if (statusData.configured && !statusData.connected) {
        return {
          success: false,
          message: statusData.message || 'Error al conectar con Google Sheets',
          isServerEnv: Boolean(statusData.isServerEnv),
          errorType: statusData.errorType,
        };
      }
    } else {
      const errData = await apiResp.json().catch(() => null);
      if (errData && errData.message) {
        return {
          success: false,
          message: errData.message,
          errorType: errData.errorType,
        };
      }
    }
  } catch {
    // fallback to direct check
  }

  if (!effectiveUrl || !effectiveUrl.startsWith('https://script.google.com/')) {
    return {
      success: false,
      message: 'La URL no tiene el formato de Google Apps Script (https://script.google.com/...)',
    };
  }

  try {
    const response = await fetch(effectiveUrl, {
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
        supportsLoadClients: Boolean(data.supportsLoadClients || Array.isArray(data.clients)),
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
