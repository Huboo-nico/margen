import type { Request, Response } from 'express';
import {
  isGoogleServiceAccountConfigured,
  getGoogleSheetsClient,
  getSpreadsheetId,
  getGoogleServiceAccountEmail,
  getGoogleCredentialsDiagnostic,
  ensureSheetAndHeaders,
  clientToRow,
  rowToClient,
} from './googleSheetsService.ts';

// Helper to determine if an ID or name is generic and shouldn't be used for fuzzy collision
function isGenericClientId(id: string): boolean {
  const s = String(id || '').trim().toLowerCase();
  return !s || s === 'client-1' || s === 'client-2' || s.startsWith('client-demo');
}

function isGenericClientName(name: string): boolean {
  const s = String(name || '').trim().toLowerCase();
  return (
    !s ||
    s === 'cliente' ||
    s === 'cliente nuevo' ||
    s === 'nuevo cliente' ||
    s === 'client' ||
    s === 'new client' ||
    /^cliente\s*\d*$/i.test(s) ||
    /^client\s*\d*$/i.test(s)
  );
}

// Comprueba si una fila de Google Sheet coincide con un cliente objetivo.
// El ID es el mismo que el nombre del cliente, revisando mayúsculas y minúsculas (insensible).
function doesRowMatchClient(row: any[], clientName: string, clientId?: string): boolean {
  if (!row || row.length === 0) return false;
  const targetName = String(clientName || '').trim().toLowerCase();
  const targetId = String(clientId || '').trim().toLowerCase();
  if (!targetName && !targetId) return false;

  // Si el nombre que se guarda es genérico (ej. "Cliente 1", "Cliente 2", "Cliente"), NUNCA debe sobreescribir una fila anterior
  if (isGenericClientName(targetName)) {
    return false;
  }

  // En la fila de la hoja:
  // Columna 0 (A): ID (que es el nombre del cliente o un ID legacy)
  // Columna 1 (B): Nombre del cliente
  const colA = String(row[0] || '').trim().toLowerCase();
  const colB = String(row[1] || '').trim().toLowerCase();

  if (targetName) {
    if (colB === targetName || colA === targetName) {
      return true;
    }
  }

  if (targetId && !isGenericClientId(targetId) && !isGenericClientName(targetId)) {
    if (colA === targetId || colB === targetId) {
      return true;
    }
  }

  return false;
}

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
  try {
    // CORS Headers
    if (typeof res.setHeader === 'function') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-custom-webhook-url');
    }

    if (req.method === 'OPTIONS') {
      return typeof res.status === 'function' ? res.status(200).end() : res.end();
    }

    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch {
        // mantener como string si no es JSON válido
      }
    }

    const action = (req.query?.action as string) || (req.body?.action as string) || 'load_clients';
    const hasServiceAccount = isGoogleServiceAccountConfigured();
    const legacyWebAppUrl = getBackendGoogleSheetsUrl();

  // 1. STATUS & DIAGNOSTICS
  if (action === 'status') {
    const diagnostics = getGoogleCredentialsDiagnostic();

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
          diagnostics,
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
          diagnostics,
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
      diagnostics,
      message:
        'No se han configurado credenciales en Vercel. Configura GOOGLE_SHEETS_SPREADSHEET_ID y las variables individuales (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY) o GOOGLE_SERVICE_ACCOUNT_KEY con el JSON completo.',
      isServerEnv: false,
    });
  }

  // 2. MODO GOOGLE SHEETS API DIRECTA (Si está configurada la Service Account)
  if (hasServiceAccount) {
    try {
      const { sheets, spreadsheetId } = getGoogleSheetsClient();

      // ACCIÓN: LOAD / LOAD_CLIENTS
      if (action === 'load' || action === 'load_clients') {
        // Leemos de las pestañas territoriales: Spain, UK, USA y Resumen General
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const sheetTitles = (meta.data.sheets || [])
          .map((s: any) => s.properties?.title)
          .filter(Boolean);

        const clientsMap = new Map<string, any>();

        // Prioridad de lectura: primero las pestañas territoriales
        const territorialTabs = ['Spain', 'UK', 'USA'].filter((t) => sheetTitles.includes(t));
        const otherTabs = sheetTitles.filter(
          (t: string) => !territorialTabs.includes(t) && t !== 'Resumen General' && t !== 'Margen'
        );
        const tabsToRead = [...territorialTabs, ...otherTabs, 'Resumen General'].filter((t) =>
          sheetTitles.includes(t)
        );

        for (const tab of (tabsToRead.length > 0 ? tabsToRead : ['Sheet1'])) {
          try {
            const resp = await sheets.spreadsheets.values.get({
              spreadsheetId,
              range: `'${tab}'!A2:W1000`,
            });
            const rows = resp.data.values || [];
            for (const row of rows) {
              const client = rowToClient(row);
              if (client && (client.id || client.name)) {
                const uniqueKey = (client.name || client.id).trim().toLowerCase();
                const clientTerritory = String(client.inputs?.warehouse || '').trim().toLowerCase();
                const tabLower = tab.toLowerCase();

                if (!clientsMap.has(uniqueKey)) {
                  // Si no existía aún en el mapa, añadirlo
                  clientsMap.set(uniqueKey, client);
                } else {
                  // Si ya existía, pero esta fila viene de la pestaña territorial que coincide exactamente con su warehouse
                  const currentInMap = clientsMap.get(uniqueKey);
                  const currentInMapTerritory = String(currentInMap.inputs?.warehouse || '').trim().toLowerCase();

                  if (clientTerritory === tabLower && currentInMapTerritory !== tabLower) {
                    clientsMap.set(uniqueKey, client);
                  }
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

      // ACCIÓN: SAVE_CLIENT
      // Algoritmo seguro: NUNCA sobreescribe un cliente anterior si el nombre es diferente
      if (action === 'save_client') {
        const client = req.body.client;
        if (!client) {
          return res.status(400).json({ status: 'error', message: 'No se recibieron datos del cliente a guardar.' });
        }

        const profile = client.profile || client;
        const inputs = client.inputs || profile.inputs || {};
        const territory = String(inputs.warehouse || 'Spain').trim() || 'Spain';
        const clientName = String(profile.name || inputs.clientName || 'Cliente').trim();
        const incomingId = String(profile.id || '').trim();
        const clientNameNorm = clientName.toLowerCase();

        // Función interna para upsert seguro en una pestaña específica
        const upsertInTab = async (tabName: string) => {
          await ensureSheetAndHeaders(sheets, spreadsheetId, tabName);

          const existingData = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${tabName}'!A2:B1000`,
          });
          const existingRows = existingData.data.values || [];

          // Reglas de coincidencia: El ID es el mismo que el nombre del cliente (revisando mayúsculas y minúsculas)
          const matchedIndex = existingRows.findIndex((r: any[]) =>
            doesRowMatchClient(r, clientName, incomingId)
          );

          if (matchedIndex >= 0) {
            // El cliente YA EXISTÍA: Actualizar su fila específica
            const targetRowNumber = matchedIndex + 2;
            const rowValues = clientToRow(client, clientName, targetRowNumber);

            await sheets.spreadsheets.values.update({
              spreadsheetId,
              range: `'${tabName}'!A${targetRowNumber}:W${targetRowNumber}`,
              valueInputOption: 'USER_ENTERED',
              requestBody: {
                values: [rowValues],
              },
            });

            return { updated: true, rowNumber: targetRowNumber };
          } else {
            // Es un NUEVO cliente: Append en la siguiente fila vacía
            // NUNCA se sobreescribe ningún cliente anterior
            const newRowNumber = existingRows.length + 2;
            const rowValues = clientToRow(client, clientName, newRowNumber);

            await sheets.spreadsheets.values.update({
              spreadsheetId,
              range: `'${tabName}'!A${newRowNumber}:W${newRowNumber}`,
              valueInputOption: 'USER_ENTERED',
              requestBody: {
                values: [rowValues],
              },
            });

            return { updated: false, rowNumber: newRowNumber };
          }
        };

        // 1. Guardar en la pestaña del territorio (ej. Spain, UK, USA)
        const territoryResult = await upsertInTab(territory);

        // 2. Guardar también en la pestaña maestra "Resumen General"
        try {
          await upsertInTab('Resumen General');
        } catch {
          // Si falla Resumen General no interrumpe el flujo principal
        }

        if (territoryResult.updated) {
          return res.status(200).json({
            status: 'success',
            success: true,
            mode: 'google_api',
            isDuplicate: true,
            isUpdated: true,
            matchedRow: territoryResult.rowNumber,
            clientName: clientName,
            territory: territory,
            message: `Cliente "${clientName}" actualizado exitosamente en la fila ${territoryResult.rowNumber} de "${territory}" (y sincronizado en "Resumen General").`,
          });
        } else {
          return res.status(200).json({
            status: 'success',
            success: true,
            mode: 'google_api',
            isDuplicate: false,
            isUpdated: false,
            matchedRow: territoryResult.rowNumber,
            clientName: clientName,
            territory: territory,
            message: `Nuevo cliente "${clientName}" añadido correctamente en la fila ${territoryResult.rowNumber} de "${territory}" sin modificar ningún cliente anterior.`,
          });
        }
      }

      // ACCIÓN: SYNC_ALL (Merge seguro: NUNCA borra clientes existentes en la hoja)
      if (action === 'sync_all') {
        const rawClients = req.body.clients || [];
        const clientsByTerritory: Record<string, any[]> = {
          Spain: [],
          UK: [],
          USA: [],
        };

        for (const c of rawClients) {
          const inputs = c.inputs || (c.profile && c.profile.inputs) || {};
          const territory = String(inputs.warehouse || 'Spain').trim().toLowerCase();
          const target = territory === 'uk' ? 'UK' : territory === 'usa' ? 'USA' : 'Spain';
          clientsByTerritory[target].push(c);
        }

        let totalUpdated = 0;
        let totalAppended = 0;

        for (const [territory, incomingClients] of Object.entries(clientsByTerritory)) {
          if (incomingClients.length === 0) continue;
          await ensureSheetAndHeaders(sheets, spreadsheetId, territory);

          // 1. Leer todas las filas existentes en la hoja
          const existingData = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${territory}'!A2:W1000`,
          });
          const existingRows = existingData.data.values || [];

          for (const incClient of incomingClients) {
            const incProfile = incClient.profile || incClient;
            const incInputs = incClient.inputs || incProfile.inputs || {};
            const incName = String(incInputs.clientName || incProfile.name || '').trim();
            const incId = String(incProfile.id || '').trim();

            const matchIdx = existingRows.findIndex((r: any[]) =>
              doesRowMatchClient(r, incName, incId)
            );

            if (matchIdx >= 0) {
              existingRows[matchIdx] = clientToRow(incClient, incName, matchIdx + 2);
              totalUpdated++;
            } else {
              existingRows.push(clientToRow(incClient, incName, existingRows.length + 2));
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

        // Sincronizar también Resumen General con todos los clientes
        try {
          await ensureSheetAndHeaders(sheets, spreadsheetId, 'Resumen General');
          const genData = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'Resumen General'!A2:W1000`,
          });
          const genRows = genData.data.values || [];

          for (const incClient of rawClients) {
            const incProfile = incClient.profile || incClient;
            const incInputs = incClient.inputs || incProfile.inputs || {};
            const incName = String(incInputs.clientName || incProfile.name || '').trim();
            const incId = String(incProfile.id || '').trim();

            const matchIdx = genRows.findIndex((r: any[]) =>
              doesRowMatchClient(r, incName, incId)
            );

            if (matchIdx >= 0) {
              genRows[matchIdx] = clientToRow(incClient, incName, matchIdx + 2);
            } else {
              genRows.push(clientToRow(incClient, incName, genRows.length + 2));
            }
          }

          if (genRows.length > 0) {
            await sheets.spreadsheets.values.update({
              spreadsheetId,
              range: `'Resumen General'!A2:W${genRows.length + 1}`,
              valueInputOption: 'USER_ENTERED',
              requestBody: {
                values: genRows,
              },
            });
          }
        } catch {
          // Ignorar error secundario
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
      let errorMsg = apiErr?.message || String(apiErr);
      if (apiErr?.code === 403) {
        errorMsg = `Permiso denegado en Google Sheets API. Asegúrate de haber compartido el documento con ${email} con permisos de Editor.`;
      } else if (apiErr?.code === 404) {
        errorMsg = `Hoja no encontrada. Verifica GOOGLE_SHEETS_SPREADSHEET_ID.`;
      }
      return res.status(200).json({
        status: 'error',
        success: false,
        errorType: apiErr?.code === 403 ? 'PERMISSION_DENIED' : 'API_ERROR',
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
  return res.status(200).json({
    status: 'error',
    success: false,
    configured: false,
    message:
      'Configura en Vercel las variables para Google Sheets API: GOOGLE_SHEETS_SPREADSHEET_ID y GOOGLE_SERVICE_ACCOUNT_KEY (o GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY). Comparte luego la hoja de cálculo con el email de la Service Account.',
  });
  } catch (outerErr: any) {
    console.error('Unhandled error in handleSheetsRequest:', outerErr);
    return res.status(200).json({
      status: 'error',
      success: false,
      errorType: 'SERVER_ERROR',
      message: `Error en el servidor: ${outerErr?.message || String(outerErr)}`,
    });
  }
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
