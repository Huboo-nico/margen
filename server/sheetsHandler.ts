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
              range: `'${tab}'!A2:W1000`,
            });
            const rows = resp.data.values || [];
            for (const row of rows) {
              const client = rowToClient(row);
              if (client && (client.id || client.name)) {
                // Clave única por nombre normalizado de cliente para cruzar datos
                const uniqueKey = client.name ? client.name.trim().toLowerCase() : String(client.id);
                // Si no existía o si esta pestaña tiene datos más completos, guardar
                if (!clientsMap.has(uniqueKey) || tab !== 'Resumen General') {
                  clientsMap.set(uniqueKey, client);
                }
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

      // ACCIÓN: SAVE_CLIENT (Cruce de datos por nombre "Cliente" e ID para no borrar ni duplicar)
      if (action === 'save_client') {
        const client = req.body.client;
        if (!client) {
          return res.status(400).json({ status: 'error', message: 'No se recibieron datos del cliente a guardar.' });
        }

        const profile = client.profile || client;
        const inputs = client.inputs || profile.inputs || {};
        const territory = String(inputs.warehouse || 'Spain').trim();
        const tabName = territory || 'Spain';

        // Asegurar que la pestaña existe con cabeceras completas
        await ensureSheetAndHeaders(sheets, spreadsheetId, tabName);

        const clientName = String(profile.name || inputs.clientName || 'Cliente').trim();
        const clientId = String(profile.id || '').trim();
        const clientNameNorm = clientName.toLowerCase();

        const rowValues = clientToRow(client);

        // Cruce de datos: Buscar en columnas A y B (ID y Cliente)
        const existingData = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `'${tabName}'!A2:B1000`,
        });
        const existingRows = existingData.data.values || [];

        // Buscar coincidencia por nombre de Cliente (exacto sin mayúsculas) o por ID
        const matchedIndex = existingRows.findIndex((r: any[]) => {
          const rowId = String(r[0] || '').trim();
          const rowName = String(r[1] || '').trim().toLowerCase();
          return (clientNameNorm && rowName === clientNameNorm) || (clientId && rowId === clientId);
        });

        if (matchedIndex >= 0) {
          // El cliente YA EXISTÍA en el Sheet: ACTUALIZAR su fila exacta sin tocar las demás
          const targetRowNumber = matchedIndex + 2;
          
          // Preservar el ID original de la hoja si existía
          const originalId = existingRows[matchedIndex][0];
          if (originalId && !clientId) {
            rowValues[0] = originalId;
          }

          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${tabName}'!A${targetRowNumber}:W${targetRowNumber}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [rowValues],
            },
          });

          return res.status(200).json({
            status: 'success',
            success: true,
            mode: 'google_api',
            isDuplicate: true,
            isUpdated: true,
            matchedRow: targetRowNumber,
            clientName: clientName,
            territory: tabName,
            warning: `El cliente "${clientName}" ya existía en la fila ${targetRowNumber}. Se ha actualizado su registro existente.`,
            message: `⚠️ Aviso: Ya existía un cliente registrado como "${clientName}" en la fila ${targetRowNumber}. Se ha actualizado su registro existente para no crear duplicados.`,
          });
        } else {
          // Es un NUEVO cliente: Agregar al final sin borrar nada existente
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `'${tabName}'!A:W`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [rowValues],
            },
          });

          return res.status(200).json({
            status: 'success',
            success: true,
            mode: 'google_api',
            isDuplicate: false,
            isUpdated: false,
            clientName: clientName,
            territory: tabName,
            message: `Nuevo cliente "${clientName}" guardado correctamente en la pestaña "${tabName}".`,
          });
        }
      }

      // ACCIÓN: SYNC_ALL (Merge seguro con cruce por "Cliente": NUNCA borra clientes previos)
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
          clientsByTerritory[target].push(c);
        }

        let totalUpdated = 0;
        let totalAppended = 0;

        for (const [territory, incomingClients] of Object.entries(clientsByTerritory)) {
          await ensureSheetAndHeaders(sheets, spreadsheetId, territory);

          // 1. Leer todas las filas existentes en la hoja
          const existingData = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${territory}'!A2:W1000`,
          });
          const existingRows = existingData.data.values || [];

          // 2. Fusionar los clientes que entran cruzando datos por Nombre (Cliente) e ID
          const norm = (s: any) => String(s || '').trim().toLowerCase();

          for (const incClient of incomingClients) {
            const incProfile = incClient.profile || incClient;
            const incInputs = incClient.inputs || incProfile.inputs || {};
            const incName = norm(incProfile.name || incInputs.clientName);
            const incId = String(incProfile.id || '').trim();
            const incRow = clientToRow(incClient);

            const matchIdx = existingRows.findIndex((r: any[]) => {
              const rId = String(r[0] || '').trim();
              const rName = norm(r[1]);
              return (incName && rName === incName) || (incId && rId === incId);
            });

            if (matchIdx >= 0) {
              existingRows[matchIdx] = incRow;
              totalUpdated++;
            } else {
              existingRows.push(incRow);
              totalAppended++;
            }
          }

          // 3. Escribir todas las filas combinadas SIN BORRAR nada previo
          if (existingRows.length > 0) {
            await sheets.spreadsheets.values.update({
              spreadsheetId,
              range: `'${territory}'!A2:W${existingRows.length + 1}`,
              valueInputOption: 'USER_ENTERED',
              requestBody: {
                values: existingRows,
              },
            });
          }
        }

        return res.status(200).json({
          status: 'success',
          success: true,
          mode: 'google_api',
          totalReceived: rawClients.length,
          totalUpdated,
          totalAppended,
          message: `Sincronización completada: ${totalUpdated} clientes actualizados y ${totalAppended} nuevos clientes añadidos sin borrar datos existentes.`,
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
