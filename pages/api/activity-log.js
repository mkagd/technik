// pages/api/activity-log.js
// API dla logów aktywności rezerwacji/zleceń

export default async function handler(req, res) {
  const { method } = req;
  const { type, id } = req.query;

  console.log(`📊 API /api/activity-log - ${method} - type: ${type}, id: ${id}`);

  // Tymczasowa pusta tablica - logi będą dodawane później
  const activities = [];

  if (method === 'GET') {
    // Zwróć pusty log (będzie rozbudowane później)
    return res.status(200).json({
      success: true,
      activities: []
    });
  }

  if (method === 'POST') {
    // Dodawanie aktywności (placeholder)
    const { action, description, author } = req.body;
    
    const newActivity = {
      id: Date.now(),
      type,
      entityId: id,
      action,
      description,
      author: author || 'System',
      createdAt: new Date().toISOString()
    };

    return res.status(201).json({
      success: true,
      activity: newActivity
    });
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
