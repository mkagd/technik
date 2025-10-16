// pages/api/comments.js
// API dla komentarzy do rezerwacji/zleceń

export default async function handler(req, res) {
  const { method } = req;
  const { type, id } = req.query;

  console.log(`📝 API /api/comments - ${method} - type: ${type}, id: ${id}`);

  // Tymczasowa pusta tablica - komentarze będziemy dodawać później
  const comments = [];

  if (method === 'GET') {
    // Zwróć puste komentarze (będzie rozbudowane później)
    return res.status(200).json({
      success: true,
      comments: []
    });
  }

  if (method === 'POST') {
    // Dodawanie komentarza
    const { comment, text, author } = req.body;
    
    // Obsłuż zarówno 'comment' jak i 'text' dla kompatybilności
    const commentText = comment || text;
    
    if (!commentText || !commentText.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Treść komentarza jest wymagana' 
      });
    }
    
    const newComment = {
      id: Date.now(),
      type,
      entityId: id,
      comment: commentText.trim(),
      author: author || 'Admin',
      createdAt: new Date().toISOString()
    };

    console.log('✅ Utworzono komentarz:', newComment);

    return res.status(201).json({
      success: true,
      comment: newComment
    });
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
