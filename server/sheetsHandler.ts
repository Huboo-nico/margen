import type { Request, Response } from 'express';
import {
  isGoogleServiceAccountConfigured,
  getGoogleSheetsClient,
  getSpreadsheetId,
  getGoogleServiceAccountEmail,
  ensureSheetAndHeaders,
  clientToRow,
  rowToClient,
} from './googleSheetsService';

// Fallback a URL de Apps Script si el usuario aún tiene esa variable
export function getBackendGoogleSheetsUrl(): string {
  return (
    process.env.GOOGLE_SHEETS_WEBAPP_URL ||
    process.env.GOOGLE_SHEETS_URL ||
    process.env.VITE_GOOGLE_SHEETS_WEBAPP_URL ||
    ''
  ).trim();
}

export async function handleSheetsRequest(req: Request | any, res: Response | any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-custom-webhook-url');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = (req.query?.action as string) || (req.body?.action as string) || 'load_clients';
  const hasServiceAccount = isGoogleServiceAccountConfigured();
  const legacyWebAppUrl = getBackendGoogleSheetsUrl();

  // 1. STATUS & DIAGNOSTICS
  if (action === 'status') {
    if (hasServiceAccount) {
      try {
        const { sheets, spreadsheetId, clientEmail } = getGoogleSheetsClient();
        const meta = await sheets.spreadsheets.get({
          spreadsheetId,
          fields: 'properties.title,sheets.properties.title',
        });
        const title = meta.data.properties?.title || 'Google Sheet';
        const sheetTabs = (meta.data.sheets || []).map((s: any) => s.properties?.title);

        return res.status(200).json({
          configured: true,
          connected: true,
          mode: 'google_api',
          sheetName: title,
          tabs: sheetTabs,
          serviceAccountEmail: clientEmail,
          spreadsheetId,
          message: `Conectado vía Google Sheets API a "${title}". Cuenta de servicio autorizada: ${clientEmail}`,
          isServerEnv: true,
          supportsLoadClients: true,
        });
      } catch (err: any) {
        const email = getGoogleServiceAccountEmail();
        const spreadsheetId = getSpreadsheetId();
        let message = `Error al conectar con Google Sheets API: ${err.message}`;

        if (err.code === 404) {
          message = `Hoja no encontrada (ID: ${spreadsheetId}). Verifica que GOOGLE_SHEETS_SPREADSHEET_ID sea correcto.`;
        } else if (err.code === 403) {
          message = `Permiso denegado. Recuerda compartir tu hoja de Google Sheet con la cuenta de servicio: ${email} dándole permiso de "Editor".`;
        }

        return res.status(200).json({
          configured: true,
          connected: false,
          mode: 'google_api',
          errorType: err.code === 403 ? 'PERMISSION_DENIED' : 'API_ERROR',
          serviceAccountEmail: email,
          spreadsheetId,
          message,
          isServerEnv: true,
        });
      }
    }

    // Si no hay Service Account pero hay Apps Script Web App URL
    if (legacyWebAppUrl) {
      return handleLegacyWebAppRequest(req, res, legacyWebAppUrl, 'status');
    }

    return res.status(200).json({
      configured: false,
      connected: false,
      message:
        'No se han configurado credenciales en Vercel. Configura GOOGLE_SHEETS_SPREADSHEET_ID y GOOGLE_SERVICE_ACCOUNT_KEY (o GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY).',
      isServerEnv: false,
    });
  }

  // 2. MODO GOOGLE SHEETS API DIRECTA (Si está configurada la Service Account)
  if (hasServiceAccount) {
    try {
      const { sheets, spreadsheetId } = getGoogleSheetsClient();

      // ACCIÓN: LOAD / LOAD_CLIENTS
      if (action === 'load' || action === 'load_clients') {
        // Leemos de las pestañas habituales: Spain, UK, USA y Hoja 1/Resumen General
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const sheetTitles = (meta.data.sheets || [])
          .map((s: any) => s.properties?.title)
          .filter(Boolean);

        const clientsMap = new Map<string, any>();

        // Si no hay pestañas territoriales, leemos la primera hoja
        const tabsToRead = sheetTitles.length > 0 ? sheetTitles : ['Sheet1'];

        for (const tab of tabsToRead) {
          try {
            const resp = await sheets.spreadsheets.values.get({
              spreadsheetId,
              range: `'${tab}'!A2:V500`,
            });
            const rows = resp.data.values || [];
            for (const row of rows) {
              const client = rowToClient(row);
              if (client && client.id && client.name) {
                clientsMap.set(client.id, client);
              }
            }
          } catch {
            // Pestaña vacía o no formateada, ignorar
          }
        }

        const clients = Array.from(clientsMap.values());
        const sheetTitle = meta.data.properties?.title || 'Margen';

        return res.status(200).json({
          status: 'success',
          success: true,
          configured: true,
          mode: 'google_api',
          clients,
          totalClients: clients.length,
          sheetName: sheetTitle,
          isServerEnv: true,
          message: `Cargados ${clients.length} clientes desde Google Sheets API ("${sheetTitle}")`,
        });
      }

      // ACCIÓN: SAVE_CLIENT
      if (action === 'save_client') {
        const client = req.body.client;
        if (!client) {
          return res.status(400).json({ status: 'error', message: 'No se recibieron datos del cliente a guardar.' });
        }

        const profile = client.profile || client;
        const inputs = client.inputs || profile.inputs || {};
        const territory = String(inputs.warehouse || 'Spain').trim();
        const tabName = territory || 'Spain';

        // Asegurar que la pestaña existe
        await ensureSheetAndHeaders(sheets, spreadsheetId, tabName);

        const rowValues = clientToRow(client);
        const clientId = String(profile.id);

        // Buscar si ya existe la fila con ese ID en la pestaña
        const existingData = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `'${tabName}'!A2:A500`,
        });
        const existingIds = (existingData.data.values || []).map((r: any[]) => r[0]);
        const rowIndex = existingIds.findIndex((id: string) => String(id) === clientId);

        if (rowIndex >= 0) {
          // Actualizar fila existente (A2 -> fila 2, etc.)
          const targetRowNumber = rowIndex + 2;
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${tabName}'!A${targetRowNumber}:V${targetRowNumber}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [rowValues],
            },
          });
        } else {
          // Agregar al final
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `'${tabName}'!A:V`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [rowValues],
            },
          });
        }

        return res.status(200).json({
          status: 'success',
          success: true,
          mode: 'google_api',
          clientName: profile.name || inputs.clientName,
          territory: tabName,
          message: `Cliente "${profile.name || inputs.clientName}" guardado correctamente en la pestaña "${tabName}".`,
        });
      }

      // ACCIÓN: SYNC_ALL
      if (action === 'sync_all') {
        const rawClients = req.body.clients || [];
        const clientsByTerritory: Record<string, any[]> = {
          Spain: [],
          UK: [],
          USA: [],
        };

        for (const c of rawClients) {
          const inputs = c.inputs || (c.profile && c.profile.inputs) || {};
          const territory = String(inputs.warehouse || 'Spain').trim();
          const target = clientsByTerritory[territory] ? territory : 'Spain';
          clientsByTerritory[target].push(clientToRow(c));
        }

        for (const [territory, rows] of Object.entries(clientsByTerritory)) {
          await ensureSheetAndHeaders(sheets, spreadsheetId, territory);

          // Limpiar datos previos de la pestaña (desde fila 2) y reescribir ordenado
          await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: `'${territory}'!A2:V500`,
          });

          if (rows.length > 0) {
            await sheets.spreadsheets.values.update({
              spreadsheetId,
              range: `'${territory}'!A2:V${rows.length + 1}`,
              valueInputOption: 'USER_ENTERED',
              requestBody: {
                values: rows,
              },
            });
          }
        }

        return res.status(200).json({
          status: 'success',
          success: true,
          mode: 'google_api',
          totalClients: rawClients.length,
          spainCount: clientsByTerritory.Spain.length,
          ukCount: clientsByTerritory.UK.length,
          usaCount: clientsByTerritory.USA.length,
          message: `Sincronizados ${rawClients.length} clientes en Google Sheets mediante Google Sheets API directa.`,
        });
      }

      return res.status(400).json({
        status: 'error',
        message: `Acción desconocida: ${action}`,
      });
    } catch (apiErr: any) {
      const email = getGoogleServiceAccountEmail();
      let errorMsg = apiErr.message;
      if (apiErr.code === 403) {
        errorMsg = `Permiso denegado en Google Sheets API. Asegúrate de haber compartido el documento con ${email} con permisos de Editor.`;
      }
      return res.status(500).json({
        status: 'error',
        success: false,
        errorType: apiErr.code === 403 ? 'PERMISSION_DENIED' : 'API_ERROR',
        serviceAccountEmail: email,
        message: errorMsg,
      });
    }
  }

  // 3. MODO RETROCOMPATIBILIDAD (Web App Apps Script) si no hay Service Account
  if (legacyWebAppUrl) {
    return handleLegacyWebAppRequest(req, res, legacyWebAppUrl, action);
  }

  // Si no hay ningún método configurado
  return res.status(400).json({
    status: 'error',
    success: false,
    configured: false,
    message:
      'Configura en Vercel las variables para Google Sheets API: GOOGLE_SHEETS_SPREADSHEET_ID y GOOGLE_SERVICE_ACCOUNT_KEY (o GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY). Comparte luego la hoja de cálculo con el email de la Service Account.',
  });
}

// Manejador legacy para Apps Script
async function handleLegacyWebAppRequest(req: any, res: any, targetUrl: string, action: string) {
  try {
    if (action === 'status') {
      const pingResp = await fetch(targetUrl, { method: 'GET', redirect: 'follow' });
      const text = await pingResp.text();
      if (text.includes('<!DOCTYPE') || text.includes('accounts.google.com')) {
        return res.status(200).json({
          configured: true,
          connected: false,
          mode: 'webapp',
          errorType: 'AUTH_REQUIRED',
          message: 'Google Apps Script solicita inicio de sesión. Cambia acceso a "Cualquier persona".',
        });
      }
      let pingData: any = {};
      try {
        pingData = JSON.parse(text);
      } catch {
        pingData = {};
      }
      return res.status(200).json({
        configured: true,
        connected: true,
        mode: 'webapp',
        sheetName: pingData.sheetName || 'Margen',
        message: 'Conectado a Google Sheets vía Web App.',
      });
    }

    if (action === 'load' || action === 'load_clients') {
      const resp = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'load_clients' }),
        redirect: 'follow',
      });
      const data = await resp.json();
      return res.status(200).json(data);
    }

    const payload = {
      ...req.body,
      action: req.body?.action || (req.body?.client ? 'save_client' : 'sync_all'),
    };
    const resp = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
    const result = await resp.json();
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      status: 'error',
      message: `Error comunicando con Web App: ${err.message}`,
    });
  }
}
