// pages/admin/rezerwacje/nowa.js
// Formularz dodawania nowej rezerwacji

import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { 
  FiSave, FiArrowLeft, FiUser, FiPhone, FiMail, FiMapPin, 
  FiCalendar, FiTool, FiFileText, FiAlertCircle
} from 'react-icons/fi';

export default function NowaRezerwacja() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    street: '',
    address: '',
    category: '',
    device: '',
    problem: '',
    date: '',
    time: '',
    availability: '',
    status: 'pending'
  });

  const categories = [
    'Pralki', 
    'Lodówki', 
    'Zmywarki', 
    'Piekarniki', 
    'Kuchenki', 
    'Płyty indukcyjne', 
    'Suszarki', 
    'Inne'
  ];

  const bookingStatuses = [
    { value: 'pending', label: 'Oczekuje na kontakt' },
    { value: 'contacted', label: 'Skontaktowano się' },
    { value: 'scheduled', label: 'Umówiona wizyta' },
    { value: 'confirmed', label: 'Potwierdzona' }
  ];

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Usuń błąd dla tego pola
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Imię i nazwisko wymagane (min. 2 znaki)';
    }

    if (!formData.phone || formData.phone.trim().length < 9) {
      newErrors.phone = 'Telefon wymagany (min. 9 cyfr)';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Nieprawidłowy format email';
    }

    if (!formData.city || formData.city.trim().length < 2) {
      newErrors.city = 'Miasto wymagane';
    }

    if (!formData.address && !formData.street) {
      newErrors.address = 'Adres lub ulica wymagana';
    }

    if (!formData.category) {
      newErrors.category = 'Kategoria wymagana';
    }

    if (!formData.date) {
      newErrors.date = 'Data wizyty wymagana';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      // Przygotuj dane do wysłania
      const submitData = {
        ...formData,
        fullAddress: formData.address || `${formData.street}, ${formData.city}`,
        problem: formData.problem || 'Brak opisu problemu',
        device: formData.device || formData.category
      };

      const response = await fetch('/api/rezerwacje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Rezerwacja utworzona:', result);
        
        // Przekieruj do listy rezerwacji
        router.push('/admin/rezerwacje');
      } else {
        const error = await response.json();
        alert(`Błąd: ${error.message || 'Nie udało się utworzyć rezerwacji'}`);
      }
    } catch (error) {
      console.error('❌ Błąd:', error);
      alert('Błąd połączenia z serwerem');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout 
      title="Nowa rezerwacja"
      breadcrumbs={[
        { label: 'Rezerwacje', href: '/admin/rezerwacje' },
        { label: 'Nowa rezerwacja' }
      ]}
    >
      {/* Action bar */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => router.push('/admin/rezerwacje')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft className="mr-2 h-4 w-4" />
          Powrót do listy
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main form - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Dane klienta */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiUser className="mr-2 h-5 w-5 text-blue-600" />
                Dane klienta
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imię i nazwisko *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Jan Kowalski"
                    required
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="mr-1 h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="123456789"
                    required
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="mr-1 h-3 w-3" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="jan@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="mr-1 h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Miasto *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Kraków"
                    required
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="mr-1 h-3 w-3" />
                      {errors.city}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ulica i numer *
                  </label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => handleChange('street', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="ul. Główna 123"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="mr-1 h-3 w-3" />
                      {errors.address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Szczegóły wizyty */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiTool className="mr-2 h-5 w-5 text-blue-600" />
                Szczegóły wizyty
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategoria urządzenia *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Wybierz kategorię</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="mr-1 h-3 w-3" />
                      {errors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model urządzenia
                  </label>
                  <input
                    type="text"
                    value={formData.device}
                    onChange={(e) => handleChange('device', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="np. Samsung WW70J5346MW"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data wizyty *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.date ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="mr-1 h-3 w-3" />
                      {errors.date}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferowana godzina
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleChange('time', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dostępność
                  </label>
                  <input
                    type="text"
                    value={formData.availability}
                    onChange={(e) => handleChange('availability', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="np. od 14:00 do 18:00"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opis problemu
                  </label>
                  <textarea
                    value={formData.problem}
                    onChange={(e) => handleChange('problem', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Opisz problem z urządzeniem..."
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Status rezerwacji</h3>
              
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {bookingStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <div className="flex items-start">
                <FiFileText className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    Informacja
                  </h4>
                  <p className="text-sm text-gray-600">
                    Po utworzeniu rezerwacji zostanie automatycznie utworzony:
                  </p>
                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                    <li>• Klient w bazie</li>
                    <li>• Zamówienie serwisowe</li>
                    <li>• Powiadomienie email (jeśli skonfigurowane)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <FiSave className="mr-2 h-4 w-4" />
                {saving ? 'Zapisywanie...' : 'Utwórz rezerwację'}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/admin/rezerwacje')}
                className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Anuluj
              </button>
            </div>
          </div>

        </div>
      </form>
    </AdminLayout>
  );
}
