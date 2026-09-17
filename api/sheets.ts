import { handleSheetsRequest } from '../server/sheetsHandler';

export default async function handler(req: any, res: any) {
  return handleSheetsRequest(req, res);
}
