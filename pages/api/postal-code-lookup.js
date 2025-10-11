// pages/api/postal-code-lookup.js
import { PostalCodeService } from '../../lib/postal-code/service.ts';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Brak kodu pocztowego' });
  }

  try {
    const service = PostalCodeService.getInstance();
    const result = await service.getCityFromPostalCode(code);

    if (result) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json({ error: 'Nie znaleziono miasta dla podanego kodu' });
    }
  } catch (error) {
    console.error('Error in postal-code-lookup:', error);
    return res.status(500).json({ error: 'Błąd serwera' });
  }
}
