import { useState } from 'react';

export default function AllegroQuickSearch({ partName, partNumber = null, compact = false, maxResults = 50 }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  const searchOnAllegro = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = partNumber ? `${partName} ${partNumber}` : partName;
      const res = await fetch(`/api/allegro/search?query=${encodeURIComponent(query)}&limit=${maxResults}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
        setShowModal(true);

        // ✅ Save search to history (non-blocking)
        try {
          await fetch('/api/allegro/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query,
              partName,
              partNumber,
              results: data.results || [],
              userId: null, // Can be populated from session
              employeeId: null // Can be populated from session
            })
          });
          console.log('✅ Search saved to history');
        } catch (historyError) {
          console.warn('⚠️ Failed to save search to history:', historyError);
          // Don't show error to user - history is optional
        }
      } else {
        setError(data.message || 'Błąd wyszukiwania');
      }
    } catch (err) {
      setError('Nie można połączyć się z API');
    } finally {
      setLoading(false);
    }
  };

  const openAllegro = () => {
    const q = encodeURIComponent(partNumber ? `${partName} ${partNumber}` : partName);
    window.open(`https://allegro.pl/listing?string=${q}`, '_blank');
  };

  if (compact) {
    return (
      <>
        <button onClick={searchOnAllegro} disabled={loading} className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors" title="Sprawdź na Allegro">
          {loading ? '⏳' : '🛒'}
        </button>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{zIndex:9999}} onClick={() => setShowModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b flex justify-between bg-purple-600 text-white">
                <h2 className="text-xl font-bold">🛒 Wyniki z Allegro</h2>
                <button onClick={() => setShowModal(false)} className="hover:bg-white/20 p-2 rounded text-2xl">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {error ? (
                  <div className="text-center py-8 text-red-600">{error}</div>
                ) : results.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Brak wyników</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.map((item, i) => (
                      <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="block bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-lg border hover:border-purple-500">
                        {item.image && <img src={item.image} alt={item.name} className="w-full h-40 object-contain mb-3 bg-white rounded"/>}
                        <h3 className="font-medium text-sm mb-2 line-clamp-2">{item.name}</h3>
                        <span className="text-lg font-bold text-purple-600">{item.price} zł</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 border-t flex justify-between">
                <span className="text-sm">Znaleziono {results.length} ofert</span>
                <button onClick={openAllegro} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Otwórz Allegro </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <button onClick={searchOnAllegro} disabled={loading} className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 font-medium flex items-center justify-center gap-2 disabled:opacity-50">
      {loading ? <><span className="animate-spin">⏳</span><span>Szukam...</span></> : <><span>🛒</span><span>Sprawdź na Allegro</span></>}
    </button>
  );
}
