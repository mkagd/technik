// pages/admin/rezerwacje/[id].js
// Szczegóły i edycja rezerwacji

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import CommentsSection from '../../../components/CommentsSection';
import { 
  FiSave, FiX, FiChevronLeft, FiCalendar, FiClock, 
  FiUser, FiPhone, FiMail, FiMapPin, FiFileText, FiAlertCircle
} from 'react-icons/fi';

export default function RezerwacjaDetale() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState({});

  const [rezerwacja, setRezerwacja] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    category: '',
    description: '',
    date: '',
    time: '',
    status: 'pending',
    notes: '',
    createdAt: ''
  });

  const bookingStatuses = [
    { value: 'pending', label: 'Oczekuje na kontakt', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'contacted', label: 'Skontaktowano się', color: 'bg-blue-100 text-blue-800' },
    { value: 'scheduled', label: 'Umówiona wizyta', color: 'bg-purple-100 text-purple-800' },
    { value: 'confirmed', label: 'Potwierdzona', color: 'bg-green-100 text-green-800' },
    { value: 'in-progress', label: 'W trakcie realizacji', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'waiting-parts', label: 'Oczekuje na części', color: 'bg-orange-100 text-orange-800' },
    { value: 'ready', label: 'Gotowe do odbioru', color: 'bg-teal-100 text-teal-800' },
    { value: 'completed', label: 'Zakończone', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Anulowane', color: 'bg-red-100 text-red-800' },
    { value: 'no-show', label: 'Nie stawił się', color: 'bg-gray-100 text-gray-800' }
  ];

  const categories = [
    'Pralki', 'Lodówki', 'Zmywarki', 'Piekarniki', 'Kuchenki', 
    'Płyty indukcyjne', 'Suszarki', 'Inne'
  ];

  useEffect(() => {
    if (id) {
      loadRezerwacja();
    }
  }, [id]);

  const loadRezerwacja = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rezerwacje?id=${id}`);
      const data = await response.json();
      
      if (response.ok && data) {
        // API może zwrócić obiekt lub tablicę
        const reservationData = Array.isArray(data) ? data[0] : data;
        if (reservationData) {
          setRezerwacja(reservationData);
        } else {
          alert('Nie znaleziono rezerwacji');
          router.push('/admin/rezerwacje');
        }
      } else {
        alert('Nie znaleziono rezerwacji');
        router.push('/admin/rezerwacje');
      }
    } catch (error) {
      console.error('Błąd:', error);
      alert('Błąd pobierania danych');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setRezerwacja(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!rezerwacja.name?.trim()) {
      newErrors.name = 'Imię i nazwisko jest wymagane';
    }
    if (!rezerwacja.phone?.trim()) {
      newErrors.phone = 'Telefon jest wymagany';
    }
    if (!rezerwacja.date) {
      newErrors.date = 'Data jest wymagana';
    }
    if (!rezerwacja.category) {
      newErrors.category = 'Kategoria jest wymagana';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      alert('Proszę wypełnić wszystkie wymagane pola');
      return;
    }

    try {
      setSaving(true);
      
      const response = await fetch('/api/rezerwacje', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: parseInt(id),
          ...rezerwacja,
          updatedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        setHasChanges(false);
        alert('Rezerwacja została zaktualizowana');
        await loadRezerwacja();
      } else {
        const data = await response.json();
        alert(data.message || 'Błąd podczas zapisywania');
      }
    } catch (error) {
      console.error('Błąd:', error);
      alert('Błąd połączenia z serwerem');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('Masz niezapisane zmiany. Czy na pewno chcesz wyjść?')) {
        router.push('/admin/rezerwacje');
      }
    } else {
      router.push('/admin/rezerwacje');
    }
  };

  if (loading) {
    return (
      <AdminLayout 
        title="Ładowanie..."
        breadcrumbs={[
          { label: 'Rezerwacje', path: '/admin/rezerwacje' },
          { label: 'Ładowanie...' }
        ]}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Ładowanie danych rezerwacji...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const statusInfo = bookingStatuses.find(s => s.value === rezerwacja.status) || bookingStatuses[0];

  return (
    <AdminLayout 
      title={`Rezerwacja #${id}`}
      breadcrumbs={[
        { label: 'Rezerwacje', path: '/admin/rezerwacje' },
        { label: `#${id}` }
      ]}
    >
      {/* Action bar */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={handleCancel}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <FiChevronLeft className="h-5 w-5 mr-1" />
          Powrót do listy
        </button>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FiX className="inline mr-2 h-4 w-4" />
            Anuluj
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Zapisywanie...
              </>
            ) : (
              <>
                <FiSave className="inline mr-2 h-4 w-4" />
                Zapisz zmiany
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${statusInfo.color}`}>
          Status: {statusInfo.label}
        </span>
        {rezerwacja.createdAt && (
          <span className="ml-4 text-sm text-gray-500">
            Utworzono: {new Date(rezerwacja.createdAt).toLocaleString('pl-PL')}
          </span>
        )}
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-8">
          {/* Dane klienta */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiUser className="mr-2 h-5 w-5" />
              Dane klienta
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imię i nazwisko <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={rezerwacja.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <FiAlertCircle className="mr-1 h-4 w-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={rezerwacja.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <FiAlertCircle className="mr-1 h-4 w-4" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={rezerwacja.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Miasto
                </label>
                <input
                  type="text"
                  value={rezerwacja.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adres
                </label>
                <input
                  type="text"
                  value={rezerwacja.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kod pocztowy
                </label>
                <input
                  type="text"
                  value={rezerwacja.postalCode}
                  onChange={(e) => updateField('postalCode', e.target.value)}
                  placeholder="00-000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Szczegóły rezerwacji */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiCalendar className="mr-2 h-5 w-5" />
              Szczegóły rezerwacji
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategoria <span className="text-red-500">*</span>
                </label>
                <select
                  value={rezerwacja.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Wybierz kategorię</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <FiAlertCircle className="mr-1 h-4 w-4" />
                    {errors.category}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={rezerwacja.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {bookingStatuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={rezerwacja.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <FiAlertCircle className="mr-1 h-4 w-4" />
                    {errors.date}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Godzina
                </label>
                <input
                  type="time"
                  value={rezerwacja.time}
                  onChange={(e) => updateField('time', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opis problemu
                </label>
                <textarea
                  value={rezerwacja.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Opisz problem..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notatki wewnętrzne
                </label>
                <textarea
                  value={rezerwacja.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Notatki widoczne tylko dla administratorów..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments and Activity Log */}
      <div className="mt-6">
        <CommentsSection 
          entityType="reservation" 
          entityId={parseInt(id)} 
        />
      </div>
    </AdminLayout>
  );
}
