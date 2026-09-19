import { google } from 'googleapis';

// Cache client instance
let sheetsClientCache: any = null;
let cachedSpreadsheetId: string = '';

export interface ServiceAccountCredentials {
  clientEmail: string;
  privateKey: string;
  projectId?: string;
  clientId?: string;
  privateKeyId?: string;
  authSource: 'individual_vars' | 'json_key' | 'incomplete';
}

export function cleanPrivateKey(rawKey: string): string {
  if (!rawKey) return '';
  let key = rawKey.trim();

  // Strip leading and trailing quotes if present
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  // Replace literal '\n' and '\r' with actual newlines
  key = key.replace(/\\n/g, '\n').replace(/\\r/g, '');

  // Ensure BEGIN and END markers are on separate lines
  if (!key.includes('\n') && key.includes('-----BEGIN PRIVATE KEY-----') && key.includes('-----END PRIVATE KEY-----')) {
    key = key
      .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
      .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
  }

  return key.trim();
}

function tryParseJsonCredentials(raw: string): Partial<ServiceAccountCredentials> | null {
  if (!raw) return null;
  let str = raw.trim();

  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1);
  }

  if (str.includes('\\"') && !str.includes('{"')) {
    str = str.replace(/\\"/g, '"');
  }

  try {
    const parsed = JSON.parse(str);
    if (parsed && typeof parsed === 'object') {
      return {
        clientEmail: (parsed.client_email || parsed.clientEmail || '').trim(),
        privateKey: cleanPrivateKey(parsed.private_key || parsed.privateKey || ''),
        projectId: (parsed.project_id || parsed.projectId || '').trim(),
        clientId: (parsed.client_id || parsed.clientId || '').trim(),
        privateKeyId: (parsed.private_key_id || parsed.privateKeyId || '').trim(),
      };
    }
  } catch {
    try {
      const unescaped = str.replace(/\\n/g, '\n').replace(/\\r/g, '');
      const parsed = JSON.parse(unescaped);
      if (parsed && typeof parsed === 'object') {
        return {
          clientEmail: (parsed.client_email || parsed.clientEmail || '').trim(),
          privateKey: cleanPrivateKey(parsed.private_key || parsed.privateKey || ''),
          projectId: (parsed.project_id || parsed.projectId || '').trim(),
          clientId: (parsed.client_id || parsed.clientId || '').trim(),
          privateKeyId: (parsed.private_key_id || parsed.privateKeyId || '').trim(),
        };
      }
    } catch {
      return null;
    }
  }
  return null;
}

export function getSpreadsheetId(): string {
  let raw = (
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID ||
    process.env.SPREADSHEET_ID ||
    process.env.GOOGLE_SHEET_ID ||
    process.env.SHEET_ID ||
    ''
  ).trim();

  // Si el usuario pegó la URL completa de Google Sheets:
  // https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit...
  if (raw.includes('/spreadsheets/d/')) {
    const match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }

  return raw;
}

export function getGoogleServiceAccountCredentials(): ServiceAccountCredentials {
  // 1. Extraer de variables de entorno individuales
  const clientEmail = (
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    process.env.GOOGLE_CLIENT_EMAIL ||
    process.env.CLIENT_EMAIL ||
    process.env.SERVICE_ACCOUNT_EMAIL ||
    ''
  ).trim();

  const rawPrivateKey = (
    process.env.GOOGLE_PRIVATE_KEY ||
    process.env.PRIVATE_KEY ||
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
    ''
  ).trim();

  const projectId = (
    process.env.GOOGLE_PROJECT_ID ||
    process.env.PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    ''
  ).trim();

  const clientId = (
    process.env.GOOGLE_CLIENT_ID ||
    process.env.CLIENT_ID ||
    ''
  ).trim();

  const privateKeyId = (
    process.env.GOOGLE_PRIVATE_KEY_ID ||
    process.env.PRIVATE_KEY_ID ||
    ''
  ).trim();

  let finalPrivateKey = cleanPrivateKey(rawPrivateKey);
  let finalEmail = clientEmail;
  let finalProjectId = projectId;
  let finalClientId = clientId;
  let finalPrivateKeyId = privateKeyId;
  let authSource: 'individual_vars' | 'json_key' | 'incomplete' =
    finalEmail && finalPrivateKey ? 'individual_vars' : 'incomplete';

  // 2. Si faltan email o privateKey, buscar en JSON completo
  if (!finalEmail || !finalPrivateKey) {
    const fullJson = (
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
      process.env.GOOGLE_CREDENTIALS ||
      ''
    ).trim();

    if (fullJson) {
      const fromJson = tryParseJsonCredentials(fullJson);
      if (fromJson) {
        if (!finalEmail && fromJson.clientEmail) finalEmail = fromJson.clientEmail;
        if (!finalPrivateKey && fromJson.privateKey) finalPrivateKey = fromJson.privateKey;
        if (!finalProjectId && fromJson.projectId) finalProjectId = fromJson.projectId;
        if (!finalClientId && fromJson.clientId) finalClientId = fromJson.clientId;
        if (!finalPrivateKeyId && fromJson.privateKeyId) finalPrivateKeyId = fromJson.privateKeyId;
        if (finalEmail && finalPrivateKey) {
          authSource = 'json_key';
        }
      }
    }
  }

  return {
    clientEmail: finalEmail,
    privateKey: finalPrivateKey,
    projectId: finalProjectId,
    clientId: finalClientId,
    privateKeyId: finalPrivateKeyId,
    authSource,
  };
}

export function isGoogleServiceAccountConfigured(): boolean {
  const spreadsheetId = getSpreadsheetId();
  if (!spreadsheetId) return false;

  const creds = getGoogleServiceAccountCredentials();
  return Boolean(creds.clientEmail && creds.privateKey);
}

export function getGoogleServiceAccountEmail(): string {
  const creds = getGoogleServiceAccountCredentials();
  return creds.clientEmail;
}

export function getGoogleCredentialsDiagnostic() {
  const spreadsheetId = getSpreadsheetId();
  const creds = getGoogleServiceAccountCredentials();

  return {
    hasSpreadsheetId: Boolean(spreadsheetId),
    spreadsheetIdPreview: spreadsheetId ? `${spreadsheetId.slice(0, 8)}...${spreadsheetId.slice(-4)}` : '',
    hasClientEmail: Boolean(creds.clientEmail),
    clientEmail: creds.clientEmail,
    hasPrivateKey: Boolean(creds.privateKey && creds.privateKey.includes('PRIVATE KEY')),
    hasProjectId: Boolean(creds.projectId),
    projectId: creds.projectId,
    hasClientId: Boolean(creds.clientId),
    hasPrivateKeyId: Boolean(creds.privateKeyId),
    authSource: creds.authSource,
  };
}

export function getGoogleSheetsClient() {
  const spreadsheetId = getSpreadsheetId();
  if (!spreadsheetId) {
    throw new Error('Falta la variable de entorno GOOGLE_SHEETS_SPREADSHEET_ID (o SPREADSHEET_ID).');
  }

  if (sheetsClientCache && cachedSpreadsheetId === spreadsheetId) {
    return { sheets: sheetsClientCache, spreadsheetId };
  }

  const creds = getGoogleServiceAccountCredentials();

  if (!creds.clientEmail || !creds.privateKey) {
    throw new Error(
      'Faltan las credenciales de Google Service Account. Puedes proporcionarlas una por una en tus variables de entorno:\n' +
      '- GOOGLE_SHEETS_SPREADSHEET_ID\n' +
      '- GOOGLE_SERVICE_ACCOUNT_EMAIL\n' +
      '- GOOGLE_PRIVATE_KEY\n' +
      '- GOOGLE_PROJECT_ID (opcional)\n' +
      'o bien como JSON completo en GOOGLE_SERVICE_ACCOUNT_KEY.'
    );
  }

  const auth = new google.auth.JWT({
    email: creds.clientEmail,
    key: creds.privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  sheetsClientCache = sheets;
  cachedSpreadsheetId = spreadsheetId;

  return { sheets, spreadsheetId, clientEmail: creds.clientEmail };
}

// Columnas que coinciden con el esquema de la calculadora
export const SHEET_HEADERS = [
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

export function clientToRow(c: any, overrideId?: string): any[] {
  const profile = c.profile || c;
  const inputs = c.inputs || profile.inputs || {};
  const results = c.results || {};

  let id = String(overrideId || profile.id || '').trim();
  if (!id) {
    id = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }
  const name = String(inputs.clientName || profile.name || 'Cliente');
  const warehouse = String(inputs.warehouse || 'Spain');
  const productType = String(inputs.productType || 'Suplementos');
  const skuCount = Number(inputs.skuCount) || 15;
  const ordersMonth = Number(inputs.ordersMonth) || 0;
  const unitsPerOrder = Number(inputs.unitsPerOrder) || 1.0;

  const packPrice = Number(results.packPriceManual || results.packPrice || inputs.packPriceManual || 0);
  const firstPickPrice = Number(results.firstPickPriceManual || results.firstPickPrice || inputs.firstPickPriceManual || 0);
  const addPickPrice = Number(results.additionalPickPriceManual || results.additionalPickPrice || inputs.additionalPickPriceManual || 0);
  const shippingPrice = Number(results.shippingPriceManual || results.shippingPrice || 0);

  // Suscripción mensual Huboo
  const subTier = inputs.subscriptionTier || 'none';
  const subPrice = Number(
    results.subscriptionRevenueMonth !== undefined
      ? results.subscriptionRevenueMonth
      : inputs.subscriptionPrice !== undefined
      ? inputs.subscriptionPrice
      : (subTier === 'tier-50' ? 50 : subTier === 'tier-150' ? 150 : subTier === 'tier-450' ? 450 : 0)
  );

  const totalRev = Number(results.totalRevenueMonth) || 0;
  const totalCost = Number(results.totalCostMonth) || 0;
  const marginGross = results.marginTotal !== null && results.marginTotal !== undefined ? `${(Number(results.marginTotal) * 100).toFixed(1)}%` : '0.0%';
  const markup = results.markupTotal !== null && results.markupTotal !== undefined ? `${(Number(results.markupTotal) * 100).toFixed(1)}%` : '0.0%';
  const profitMonth = Number(results.totalProfitMonth) || 0;
  const arr = totalRev * 12;

  const goLive = String(inputs.goLiveDate || '');
  const channels = Array.isArray(inputs.technologies) ? inputs.technologies.join(', ') : '';
  const notes = String(inputs.clientNotes || profile.notes || '');
  const updatedAt = String(profile.updatedAt || new Date().toISOString());

  // Serializar datos completos para no perder ninguna propiedad
  const fullJson = JSON.stringify({
    id: id,
    name: name,
    notes: notes,
    updatedAt: updatedAt,
    inputs: {
      ...inputs,
      clientName: name,
      subscriptionTier: subTier,
      subscriptionPrice: subPrice,
    },
  });

  return [
    id,
    name,
    warehouse,
    productType,
    skuCount,
    ordersMonth,
    unitsPerOrder,
    Number(packPrice.toFixed(2)),
    Number(firstPickPrice.toFixed(2)),
    Number(addPickPrice.toFixed(2)),
    Number(shippingPrice.toFixed(2)),
    Number(subPrice.toFixed(2)),
    Number(totalRev.toFixed(2)),
    Number(totalCost.toFixed(2)),
    marginGross,
    markup,
    Number(profitMonth.toFixed(2)),
    Number(arr.toFixed(2)),
    goLive,
    channels,
    notes,
    updatedAt,
    fullJson,
  ];
}

export function rowToClient(row: any[]): any | null {
  if (!row || row.length === 0) return null;

  // Buscar si alguna celda contiene el JSON completo (suele ser la última columna)
  for (let i = row.length - 1; i >= 0; i--) {
    const val = row[i];
    if (typeof val === 'string' && val.trim().startsWith('{') && val.includes('"inputs"')) {
      try {
        const parsed = JSON.parse(val);
        if (parsed && (parsed.id || parsed.name || parsed.inputs)) {
          return parsed;
        }
      } catch {
        // Fallback a columnas sueltas
      }
    }
  }

  const clientId = String(row[0] || `client-${Date.now()}`);
  const clientName = String(row[1] || 'Cliente');
  const warehouse = String(row[2] || 'Spain');
  const productType = String(row[3] || 'Suplementos');
  const skuCount = Number(row[4]) || 15;
  const ordersMonth = Number(row[5]) || 0;
  const unitsPerOrder = Number(row[6]) || 1.0;

  const packPrice = Number(row[7]) || 0;
  const firstPickPrice = Number(row[8]) || 0;
  const addPickPrice = Number(row[9]) || 0;
  const shippingPrice = Number(row[10]) || 0;

  // Detectar si la columna 11 es la suscripción (esquema 23 cols) o si es ingresos (esquema 22 cols antiguo)
  let subPrice = 0;
  let subTier = 'none';
  let goLiveDate = '';
  let channelsStr = '';
  let notes = '';
  let updatedAt = new Date().toISOString();

  if (row.length >= 23) {
    // Nuevo esquema con Suscripción en col 11
    subPrice = Number(row[11]) || 0;
    if (subPrice === 50) subTier = 'tier-50';
    else if (subPrice === 150) subTier = 'tier-150';
    else if (subPrice === 450) subTier = 'tier-450';
    else if (subPrice > 0) subTier = 'custom';

    goLiveDate = String(row[18] || '');
    channelsStr = String(row[19] || '');
    notes = String(row[20] || '');
    updatedAt = String(row[21] || new Date().toISOString());
  } else {
    // Esquema de 22 columnas
    goLiveDate = String(row[17] || '');
    channelsStr = String(row[18] || '');
    notes = String(row[19] || '');
    updatedAt = String(row[20] || new Date().toISOString());
  }

  const techs = channelsStr
    ? channelsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

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
      subscriptionTier: subTier,
      subscriptionPrice: subPrice,
      packCostSource: 'Calculadora (negociado)',
      volumeMode: 'Pedidos/mes',
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
      clientNotes: notes,
    },
  };
}

// Asegura que las pestañas (Spain, UK, USA, etc.) existen y tienen cabeceras
export async function ensureSheetAndHeaders(sheets: any, spreadsheetId: string, sheetTitle: string) {
  try {
    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    const sheetExists = (meta.data.sheets || []).some(
      (s: any) => s.properties && s.properties.title === sheetTitle
    );

    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetTitle,
                },
              },
            },
          ],
        },
      });
    }

    // Verificar si la fila 1 tiene cabeceras
    const headerCheck = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetTitle}'!A1:V1`,
    });

    if (!headerCheck.data.values || headerCheck.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheetTitle}'!A1:V1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [SHEET_HEADERS],
        },
      });
    }
  } catch (err) {
    console.error(`Error asegurando pestaña ${sheetTitle}:`, err);
  }
}
