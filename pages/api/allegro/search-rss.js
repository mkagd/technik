// UWAGA: Allegro wyłączyło publiczny dostęp do RSS
// Ten endpoint nie jest już używany - wyszukiwanie wymaga OAuth API

export default async function handler(req, res) {
  return res.status(503).json({
    error: 'RSS Allegro nie jest już dostępne',
    message: 'Allegro wyłączyło publiczny dostęp do RSS. Musisz użyć OAuth API z własnymi kluczami.',
    solution: 'Przejdź do /admin/allegro/settings i skonfiguruj OAuth',
    offers: [],
    count: 0,
    totalCount: 0,
  });
}
