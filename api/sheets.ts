import { handleSheetsRequest } from './_lib/sheetsHandler.ts';

export default async function handler(req: any, res: any) {
  try {
    return await handleSheetsRequest(req, res);
  } catch (err: any) {
    console.error('Vercel sheets serverless function caught error:', err);
    if (!res.headersSent) {
      return res.status(200).json({
        status: 'error',
        configured: false,
        connected: false,
        message: `Error en función de Vercel: ${err?.message || String(err)}`,
      });
    }
  }
}

