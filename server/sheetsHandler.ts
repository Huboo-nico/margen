import type { Request, Response } from 'express';

// Variable de entorno de backend segura en Vercel / Cloud Run
// NO usa prefijo VITE_, garantizando que NUNCA sea expuesta al navegador
export function getBackendGoogleSheetsUrl(): string {
  const envUrl = (
    process.env.GOOGLE_SHEETS_WEBAPP_URL ||
    process.env.GOOGLE_SHEETS_URL ||
    process.env.VITE_GOOGLE_SHEETS_WEBAPP_URL ||
    ''
  ).trim();
  return envUrl;
}

export async function handleSheetsRequest(req: Request | any, res: Response | any) {
  // Configurar cabeceras CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-custom-webhook-url');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const configuredUrl = getBackendGoogleSheetsUrl();

  // Permitir URL opcional enviada en header o body para pruebas específicas
  const requestedUrl = (
    (req.headers && (req.headers['x-custom-webhook-url'] as string)) ||
    (req.body && (req.body.webhookUrl as string)) ||
    (req.query && (req.query.webhookUrl as string)) ||
    ''
  ).trim();

  // Si se solicita status con una URL específica en query, probar esa URL; si no, usar la del servidor
  const targetUrl = (req.query?.action === 'status' && requestedUrl)
    ? requestedUrl
    : (configuredUrl || requestedUrl);

  const action = (req.query?.action as string) || (req.body?.action as string) || 'load_clients';

  // 1. Verificación de formato básico de URL
  if (targetUrl) {
    if (targetUrl.includes('docs.google.com/spreadsheets')) {
      return res.status(400).json({
        status: 'error',
        success: false,
        configured: true,
        errorType: 'IS_SPREADSHEET_URL',
        message:
          'Has configurado la URL de la hoja de cálculo de Google (docs.google.com/spreadsheets/...) en lugar de la URL de la Web App de Apps Script (script.google.com/macros/s/.../exec). Abre tu hoja de cálculo > Extensiones > Apps Script > Implementar > Nueva implementación > Tipo: Aplicación web > Copiar URL.',
      });
    }

    if (targetUrl.endsWith('/dev')) {
      return res.status(400).json({
        status: 'error',
        success: false,
        configured: true,
        errorType: 'IS_DEV_URL',
        message:
          'La URL termina en /dev. Las URLs de desarrollo de Google Apps Script requieren inicio de sesión de desarrollador. En Apps Script haz clic en: Implementar > Administrar implementaciones y copia la URL terminada en /exec.',
      });
    }
  }

  // 2. Acción STATUS / DIAGNÓSTICO
  if (action === 'status') {
    if (!targetUrl) {
      return res.status(200).json({
        configured: false,
        connected: false,
        message:
          'Variable GOOGLE_SHEETS_WEBAPP_URL no configurada en Vercel ni URL local ingresada.',
      });
    }

    try {
      // Probar GET inicial
      const pingResponse = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
      });

      const text = await pingResponse.text();

      // Detección de bloqueo de Google Accounts (HTML Login)
      if (text.includes('<!DOCTYPE') || text.includes('accounts.google.com') || text.includes('ServiceLogin')) {
        return res.status(200).json({
          configured: true,
          isServerEnv: Boolean(configuredUrl),
          connected: false,
          errorType: 'AUTH_REQUIRED',
          message:
            'Google Apps Script solicita inicio de sesión. La Web App no está abierta al público: en Google Apps Script ve a Implementar > Administrar implementaciones > Editar > Quién tiene acceso > cambia a "Cualquier persona" (Anyone) > Implementar.',
        });
      }

      let pingData: any = {};
      try {
        pingData = JSON.parse(text);
      } catch {
        return res.status(200).json({
          configured: true,
          isServerEnv: Boolean(configuredUrl),
          connected: false,
          errorType: 'INVALID_JSON',
          message: `Google Apps Script respondió con un formato no válido: ${text.slice(0, 150)}`,
        });
      }

      // Probar si el script soporta lectura de clientes (load_clients)
      let supportsLoadClients = false;
      try {
        const testLoad = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'load_clients' }),
          redirect: 'follow',
        });
        const loadText = await testLoad.text();
        const loadJson = JSON.parse(loadText);
        if (loadJson && loadJson.status === 'success' && Array.isArray(loadJson.clients)) {
          supportsLoadClients = true;
        }
      } catch {
        supportsLoadClients = false;
      }

      const isConnected = pingData.status === 'success';

      return res.status(200).json({
        configured: true,
        isServerEnv: Boolean(configuredUrl),
        connected: isConnected,
        sheetName: pingData.sheetName || 'Margen',
        supportsLoadClients,
        needsScriptUpdate: isConnected && !supportsLoadClients,
        message: isConnected
          ? supportsLoadClients
            ? `Conexión activa con Google Sheet: "${pingData.sheetName || 'Margen'}" (Lectura y Escritura operativas).`
            : `Conexión detectada con "${pingData.sheetName || 'Margen'}", pero el script en Google Apps Script necesita actualizarse a la nueva versión para permitir leer clientes en otros ordenadores.`
          : pingData.message || 'Error de conexión con el script de Google',
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return res.status(200).json({
        configured: true,
        isServerEnv: Boolean(configuredUrl),
        connected: false,
        error: errMsg,
        message: `Error al conectar con el Webhook de Google Sheets: ${errMsg}`,
      });
    }
  }

  if (!targetUrl) {
    return res.status(400).json({
      status: 'error',
      success: false,
      configured: false,
      message:
        'No se ha configurado la variable de entorno GOOGLE_SHEETS_WEBAPP_URL en el servidor de Vercel.',
    });
  }

  // 3. Acción LOAD / LOAD_CLIENTS
  if (action === 'load' || action === 'load_clients') {
    let googleData: any = null;
    let postError: string | null = null;

    // A) Intentar vía POST con { action: 'load_clients' }
    try {
      const postResp = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action: 'load_clients' }),
        redirect: 'follow',
      });

      const postText = await postResp.text();
      if (!postText.includes('<!DOCTYPE')) {
        const parsed = JSON.parse(postText);
        if (parsed && parsed.status === 'success' && Array.isArray(parsed.clients)) {
          googleData = parsed;
        }
      }
    } catch (err: unknown) {
      postError = err instanceof Error ? err.message : String(err);
    }

    // B) Fallback a GET si el script responde por doGet
    if (!googleData || !Array.isArray(googleData.clients)) {
      try {
        const getResp = await fetch(targetUrl, {
          method: 'GET',
          redirect: 'follow',
        });
        const getText = await getResp.text();

        if (getText.includes('<!DOCTYPE') || getText.includes('accounts.google.com')) {
          return res.status(403).json({
            status: 'error',
            success: false,
            errorType: 'AUTH_REQUIRED',
            message:
              'Google Apps Script solicita inicio de sesión. Cambia "Quién tiene acceso" a "Cualquier persona" (Anyone) en Administrar implementaciones.',
          });
        }

        const parsed = JSON.parse(getText);
        if (parsed && parsed.status === 'success') {
          googleData = parsed;
        }
      } catch (getErr: unknown) {
        const getMsg = getErr instanceof Error ? getErr.message : String(getErr);
        return res.status(500).json({
          status: 'error',
          success: false,
          message: `Error al leer clientes desde Google Sheets: ${getMsg}. ${postError ? `(POST también falló: ${postError})` : ''}`,
        });
      }
    }

    if (googleData && googleData.status === 'success') {
      const clientsList = Array.isArray(googleData.clients) ? googleData.clients : [];
      return res.status(200).json({
        status: 'success',
        success: true,
        configured: true,
        isServerEnv: Boolean(configuredUrl),
        clients: clientsList,
        totalClients: clientsList.length,
        sheetName: googleData.sheetName || 'Margen',
        needsScriptUpdate: !Array.isArray(googleData.clients),
        message: googleData.message || `Recuperados ${clientsList.length} clientes desde Google Sheets`,
      });
    }

    return res.status(500).json({
      status: 'error',
      success: false,
      message: googleData?.message || 'Respuesta inválida desde Google Sheets al cargar clientes',
    });
  }

  // 4. Acción SAVE_CLIENT o SYNC_ALL
  try {
    const rawBody = req.body || {};
    
    // Retrocompatibilidad total: enviamos tanto `client` como `clients`
    const client = rawBody.client;
    const clients = rawBody.clients || (client ? [client] : []);

    const payload = {
      ...rawBody,
      action: rawBody.action || (client ? 'save_client' : 'sync_all'),
      client: client,
      clients: clients,
      exportedAt: rawBody.exportedAt || new Date().toISOString(),
    };

    const googleResp = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    const respText = await googleResp.text();

    if (respText.includes('<!DOCTYPE') || respText.includes('accounts.google.com')) {
      return res.status(403).json({
        status: 'error',
        success: false,
        errorType: 'AUTH_REQUIRED',
        message:
          'Google Apps Script requiere inicio de sesión. Cambia "Quién tiene acceso" a "Cualquier persona" (Anyone) en Administrar implementaciones.',
      });
    }

    try {
      const result = JSON.parse(respText);
      return res.status(200).json(result);
    } catch {
      return res.status(500).json({
        status: 'error',
        success: false,
        message: `Google Apps Script respondió con un formato inesperado: ${respText.slice(0, 200)}`,
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error en /api/sheets proxy:', message);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: `Error al comunicar con Google Sheets: ${message}`,
    });
  }
}
