import { useState } from 'react';

export default function NotesEditor({ visit, onNoteAdded, onClose }) {
  const [formData, setFormData] = useState({
    type: 'general',
    content: '',
    priority: 'normal',
    tags: '',
    isPrivate: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Note types configuration
  const noteTypes = [
    { value: 'general', label: 'Ogólna', icon: '📝', color: 'bg-gray-100 text-gray-800' },
    { value: 'diagnosis', label: 'Diagnoza', icon: '🔍', color: 'bg-blue-100 text-blue-800' },
    { value: 'work', label: 'Praca', icon: '🔧', color: 'bg-green-100 text-green-800' },
    { value: 'parts', label: 'Części', icon: '⚙️', color: 'bg-purple-100 text-purple-800' },
    { value: 'issue', label: 'Problem', icon: '⚠️', color: 'bg-red-100 text-red-800' },
    { value: 'recommendation', label: 'Rekomendacja', icon: '💡', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'client', label: 'Klient', icon: '👤', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'internal', label: 'Wewnętrzna', icon: '🔒', color: 'bg-orange-100 text-orange-800' }
  ];

  const priorities = [
    { value: 'low', label: 'Niski', color: 'text-gray-600' },
    { value: 'normal', label: 'Normalny', color: 'text-blue-600' },
    { value: 'high', label: 'Wysoki', color: 'text-red-600' }
  ];

  // Popular tags suggestions
  const suggestedTags = [
    'pilne', 'do sprawdzenia', 'ważne', 'gwarancja', 
    'części', 'diagnostyka', 'naprawa', 'kontakt z klientem',
    'follow-up', 'test', 'weryfikacja', 'dokument'
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      setError('Treść notatki jest wymagana');
      return;
    }

    setLoading(true);
    setError('');

    const token = localStorage.getItem('technicianToken');

    try {
      // Parse tags (comma or space separated)
      const tagsArray = formData.tags
        .split(/[,\s]+/)
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const response = await fetch('/api/technician/add-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          visitId: visit.visitId,
          type: formData.type,
          content: formData.content,
          priority: formData.priority,
          tags: tagsArray,
          isPrivate: formData.isPrivate
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Błąd dodawania notatki');
      }

      // Success! Call callback
      if (onNoteAdded) {
        onNoteAdded(data.visit);
      }

      // Reset form
      setFormData({
        type: 'general',
        content: '',
        priority: 'normal',
        tags: '',
        isPrivate: false
      });

      // Close modal if callback provided
      if (onClose) {
        onClose();
      }

    } catch (err) {
      console.error('Error adding note:', err);
      setError(err.message || 'Błąd dodawania notatki');
    } finally {
      setLoading(false);
    }
  };

  const addSuggestedTag = (tag) => {
    const currentTags = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag].filter(t => t).join(', ');
      handleChange('tags', newTags);
    }
  };

  const getTypeInfo = () => {
    return noteTypes.find(t => t.value === formData.type) || noteTypes[0];
  };

  const typeInfo = getTypeInfo();

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl mr-3">
            📝
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Dodaj notatkę</h3>
            <p className="text-sm text-gray-500">Wizyta: {visit.visitId}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Note Type Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Typ notatki
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {noteTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleChange('type', type.value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.type === type.value
                    ? `${type.color} border-current`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{type.icon}</div>
                <div className="text-xs font-medium">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Special info for diagnosis type */}
        {formData.type === 'diagnosis' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 Notatka typu "Diagnoza" automatycznie zaktualizuje pole diagnozy wizyty.
            </p>
          </div>
        )}

        {/* Special info for parts type */}
        {formData.type === 'parts' && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-800">
              ⚙️ Notatka typu "Części" automatycznie doda części do listy potrzebnych części.
            </p>
          </div>
        )}

        {/* Content */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Treść notatki *
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => handleChange('content', e.target.value)}
            rows={5}
            placeholder="Wpisz treść notatki..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.content.length} znaków
          </p>
        </div>

        {/* Priority */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priorytet
          </label>
          <div className="flex space-x-2">
            {priorities.map((priority) => (
              <button
                key={priority.value}
                type="button"
                onClick={() => handleChange('priority', priority.value)}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                  formData.priority === priority.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                } ${priority.color}`}
              >
                {priority.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tagi
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => handleChange('tags', e.target.value)}
            placeholder="pilne, ważne, do sprawdzenia..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Oddziel przecinkami lub spacjami
          </p>
          
          {/* Suggested tags */}
          <div className="mt-2">
            <p className="text-xs text-gray-600 mb-1">Sugerowane:</p>
            <div className="flex flex-wrap gap-1">
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addSuggestedTag(tag)}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Private checkbox */}
        <div className="mb-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPrivate}
              onChange={(e) => handleChange('isPrivate', e.target.checked)}
              className="mr-2 text-blue-600 focus:ring-blue-500"
              disabled={loading}
            />
            <div className="flex items-center">
              <svg className="w-4 h-4 text-gray-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm text-gray-700">Notatka prywatna (widoczna tylko dla pracowników)</span>
            </div>
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Anuluj
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !formData.content.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Zapisywanie...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Dodaj notatkę
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
