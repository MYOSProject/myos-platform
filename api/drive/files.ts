import { timingSafeEqual } from 'node:crypto';
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const expectedToken = process.env.MYOS_DRIVE_API_TOKEN || '';
  const authorization = req.headers.authorization || '';
  const suppliedToken = authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : '';
  const expected = Buffer.from(expectedToken);
  const supplied = Buffer.from(suppliedToken);
  const authorized = expected.length > 0 &&
    expected.length === supplied.length &&
    timingSafeEqual(expected, supplied);

  if (!authorized) return res.status(401).json({ error: 'No autorizado.' });

  const folderId = process.env.MYOS_DRIVE_FOLDER_ID;
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!folderId || !serviceAccountJson) {
    return res.status(503).json({ error: 'Faltan variables de configuración de Google Drive.' });
  }

  try {
    const credentials = JSON.parse(serviceAccountJson);
    if (!credentials.client_email || !credentials.private_key) {
      return res.status(503).json({ error: 'La credencial de Google Drive no tiene el formato esperado.' });
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly']
    });
    const drive = google.drive({ version: 'v3', auth });
    const result = await drive.files.list({
      q: `'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false`,
      pageSize: 100,
      orderBy: 'name',
      fields: 'nextPageToken,files(id,name,mimeType,modifiedTime,webViewLink)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    });

    return res.status(200).json({
      folderId,
      files: (result.data.files || []).map(file => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink
      })),
      nextPageToken: result.data.nextPageToken || null
    });
  } catch (error) {
    console.error('Google Drive metadata listing failed:', error?.message || 'unknown error');
    return res.status(502).json({
      error: 'No se pudieron consultar los archivos de Google Drive. Verifica que la cuenta de servicio tenga acceso a la carpeta.'
    });
  }
}
