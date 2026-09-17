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
  // Configurar cabeceras CORS por si Vercel Serverless Function es llamada desde distintos orígenes
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-custom-webhook-url');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const configuredUrl = getBackendGoogleSheetsUrl();

  // Permitir URL opcional enviada en header o body solo si no está configurada en el servidor (para pruebas locales)
  const fallbackUrl = (
    (req.headers && (req.headers['x-custom-webhook-url'] as string)) ||
    (req.body && (req.body.webhookUrl as string)) ||
    (req.query && (req.query.webhookUrl as string)) ||
    ''
  ).trim();

  const targetUrl = configuredUrl || fallbackUrl;

  // Manejar acción de estado / verificación
  const action = (req.query?.action as string) || (req.body?.action as string) || 'load_clients';

  if (action === 'status') {
    if (!targetUrl) {
      return res.status(200).json({
        configured: false,
        message: 'Variable GOOGLE_SHEETS_WEBAPP_URL no configurada en las variables de entorno de Vercel.',
      });
    }

    try {
      const pingResponse = await fetch(targetUrl, {
        method: 'GET',
      });
      const pingData: any = await pingResponse.json();
      return res.status(200).json({
        configured: true,
        isServerEnv: Boolean(configuredUrl),
        connected: pingData.status === 'success',
        sheetName: pingData.sheetName || 'Margen',
        message: pingData.message || 'Conexión exitosa con Google Sheet',
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

  try {
    // Si la acción es load_clients (tanto por GET como por POST)
    if (action === 'load' || action === 'load_clients') {
      // 1. Intentar POST con { action: 'load_clients' } (Node sigue los 302 de Google transparentemente)
      let googleData: any = null;
      let postError: string | null = null;

      try {
        const postResp = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({ action: 'load_clients' }),
        });

        if (postResp.ok) {
          const parsed = await postResp.json();
          if (parsed && parsed.status === 'success' && Array.isArray(parsed.clients)) {
            googleData = parsed;
          }
        }
      } catch (err: unknown) {
        postError = err instanceof Error ? err.message : String(err);
      }

      // 2. Fallback a GET si el script responde por doGet
      if (!googleData || !Array.isArray(googleData.clients)) {
        try {
          const getResp = await fetch(targetUrl, { method: 'GET' });
          if (getResp.ok) {
            googleData = await getResp.json();
          }
        } catch (getErr: unknown) {
          const getMsg = getErr instanceof Error ? getErr.message : String(getErr);
          throw new Error(`Fallo en GET: ${getMsg}. ${postError ? `(Fallo en POST: ${postError})` : ''}`);
        }
      }

      if (googleData && googleData.status === 'success') {
        return res.status(200).json({
          status: 'success',
          success: true,
          configured: true,
          isServerEnv: Boolean(configuredUrl),
          clients: googleData.clients || [],
          sheetName: googleData.sheetName || 'Margen',
          message: googleData.message || 'Clientes recuperados con éxito',
        });
      }

      return res.status(500).json({
        status: 'error',
        success: false,
        message: googleData?.message || 'Respuesta inválida desde Google Sheets',
      });
    }

    // Si es save_client o sync_all (enviar datos al script)
    const payload = {
      ...req.body,
      exportedAt: req.body?.exportedAt || new Date().toISOString(),
    };

    const googleResp = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!googleResp.ok) {
      throw new Error(`Google Apps Script devolvió código ${googleResp.status}: ${googleResp.statusText}`);
    }

    const result = await googleResp.json();
    return res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error en /api/sheets proxy:', message);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: `Error en la API de sincronización con Google Sheets: ${message}`,
    });
  }
}
