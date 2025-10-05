// pages/admin/rezerwacje/[id].js
// Szczegóły i edycja rezerwacji

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import CommentsSection from '../../../components/CommentsSection';
import { 
  FiEdit, FiChevronLeft, FiCalendar, FiClock, 
  FiUser, FiPhone, FiMail, FiMapPin, FiFileText
} from 'react-icons/fi';

export default function RezerwacjaDetale() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);

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

  const handleBack = () => {
    router.push('/admin/rezerwacje');
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
          onClick={handleBack}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <FiChevronLeft className="h-5 w-5 mr-1" />
          Powrót do listy
        </button>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push(`/admin/rezerwacje/edytuj/${id}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <FiEdit className="inline mr-2 h-4 w-4" />
            Edytuj rezerwację
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

            {/* Typ klienta */}
            {rezerwacja.clientType && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-blue-900">
                    {rezerwacja.clientType === 'company' ? '🏢 Firma' : '👤 Klient prywatny'}
                  </span>
                </div>
              </div>
            )}

            {/* Dane firmowe (jeśli firma) */}
            {rezerwacja.clientType === 'company' && rezerwacja.companyData && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="text-sm font-semibold text-purple-900 mb-3">🏢 Dane firmowe</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {rezerwacja.companyData.name && (
                    <div>
                      <span className="text-gray-600">Nazwa:</span>
                      <span className="ml-2 font-medium text-gray-900">{rezerwacja.companyData.name}</span>
                    </div>
                  )}
                  {rezerwacja.companyData.nip && (
                    <div>
                      <span className="text-gray-600">NIP:</span>
                      <span className="ml-2 font-medium text-gray-900">{rezerwacja.companyData.nip}</span>
                    </div>
                  )}
                  {rezerwacja.companyData.regon && (
                    <div>
                      <span className="text-gray-600">REGON:</span>
                      <span className="ml-2 font-medium text-gray-900">{rezerwacja.companyData.regon}</span>
                    </div>
                  )}
                  {rezerwacja.companyData.krs && (
                    <div>
                      <span className="text-gray-600">KRS:</span>
                      <span className="ml-2 font-medium text-gray-900">{rezerwacja.companyData.krs}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imię i nazwisko
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-900 font-medium">{rezerwacja.name || 'Brak'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-900">{rezerwacja.email || 'Brak'}</span>
                </div>
              </div>
            </div>

            {/* Telefony */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefony
              </label>
              {rezerwacja.phones && rezerwacja.phones.length > 0 ? (
                <div className="space-y-2">
                  {rezerwacja.phones.map((phone, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <FiPhone className="h-4 w-4 text-gray-500 mr-3" />
                      <span className="font-medium text-gray-900">{phone.number}</span>
                      {phone.label && phone.label !== 'Główny' && (
                        <span className="ml-2 text-sm text-gray-600">({phone.label})</span>
                      )}
                      {phone.isPrimary && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          Główny
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <FiPhone className="h-4 w-4 text-gray-500 mr-3" />
                    <span className="font-medium text-gray-900">{rezerwacja.phone || 'Brak'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Adresy */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresy
              </label>
              {rezerwacja.addresses && rezerwacja.addresses.length > 0 ? (
                <div className="space-y-2">
                  {rezerwacja.addresses.map((addr, index) => (
                    <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <FiMapPin className="h-4 w-4 text-gray-500 mr-3 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {addr.street}, {addr.postalCode} {addr.city}
                        </div>
                        {addr.label && addr.label !== 'Główny' && (
                          <div className="text-sm text-gray-600 mt-1">({addr.label})</div>
                        )}
                      </div>
                      {addr.isPrimary && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          Główny
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start">
                    <FiMapPin className="h-4 w-4 text-gray-500 mr-3 mt-0.5" />
                    <div>
                      {rezerwacja.address && <div className="font-medium text-gray-900">{rezerwacja.address}</div>}
                      {rezerwacja.city && (
                        <div className="text-sm text-gray-600">
                          {rezerwacja.postalCode && `${rezerwacja.postalCode} `}{rezerwacja.city}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Urządzenia */}
          {rezerwacja.devices && rezerwacja.devices.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiFileText className="mr-2 h-5 w-5" />
                Zgłoszone urządzenia ({rezerwacja.devices.length})
              </h3>
              <div className="space-y-4">
                {rezerwacja.devices.map((device, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded mr-3">
                            #{index + 1}
                          </span>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {device.name || 'Urządzenie AGD'}
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                          {device.brand && (
                            <div className="flex items-center text-sm">
                              <span className="text-gray-600">Marka:</span>
                              <span className="ml-2 font-medium text-gray-900">{device.brand}</span>
                            </div>
                          )}
                          {device.model && (
                            <div className="flex items-center text-sm">
                              <span className="text-gray-600">Model:</span>
                              <span className="ml-2 font-medium text-gray-900">{device.model}</span>
                            </div>
                          )}
                          {device.serialNumber && (
                            <div className="flex items-center text-sm">
                              <span className="text-gray-600">Nr seryjny:</span>
                              <span className="ml-2 font-medium text-gray-900">{device.serialNumber}</span>
                            </div>
                          )}
                          {device.purchaseYear && (
                            <div className="flex items-center text-sm">
                              <span className="text-gray-600">Rok zakupu:</span>
                              <span className="ml-2 font-medium text-gray-900">{device.purchaseYear}</span>
                            </div>
                          )}
                        </div>

                        {device.description && (
                          <div className="mt-3 p-3 bg-white rounded border border-blue-100">
                            <div className="text-sm text-gray-600 mb-1">Opis problemu:</div>
                            <div className="text-sm text-gray-900">{device.description}</div>
                          </div>
                        )}

                        {device.warrantyStatus && (
                          <div className="mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              device.warrantyStatus === 'warranty' 
                                ? 'bg-green-100 text-green-800' 
                                : device.warrantyStatus === 'post-warranty'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {device.warrantyStatus === 'warranty' && '✓ Gwarancja'}
                              {device.warrantyStatus === 'post-warranty' && '⚠ Pogwarancyjne'}
                              {device.warrantyStatus === 'unknown' && '? Nieznane'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Szczegóły rezerwacji */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiCalendar className="mr-2 h-5 w-5" />
              Szczegóły rezerwacji
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategoria
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-900 font-medium">{rezerwacja.category || 'Brak'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="p-3 rounded-lg">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>

              {/* Data wizyty - pojedyncza lub zakres */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {rezerwacja.dateMode === 'range' || rezerwacja.isFlexibleDate || (rezerwacja.dateRange?.from && rezerwacja.dateRange?.to) 
                    ? '📅 Elastyczny zakres dat' 
                    : '📆 Data wizyty'}
                </label>
                
                {/* Zakres dat */}
                {(rezerwacja.dateMode === 'range' || rezerwacja.isFlexibleDate || (rezerwacja.dateRange?.from && rezerwacja.dateRange?.to)) ? (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-start">
                      <FiCalendar className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900 mb-2">
                          Klient elastyczny - dowolny dzień z zakresu:
                        </div>
                        <div className="flex items-center text-base font-medium text-gray-900">
                          <span>
                            {new Date(rezerwacja.dateRange.from + 'T00:00:00').toLocaleDateString('pl-PL', { 
                              day: 'numeric', 
                              month: 'long',
                              year: 'numeric',
                              weekday: 'short'
                            })}
                          </span>
                          <span className="mx-3 text-blue-600">→</span>
                          <span>
                            {new Date(rezerwacja.dateRange.to + 'T00:00:00').toLocaleDateString('pl-PL', { 
                              day: 'numeric', 
                              month: 'long',
                              year: 'numeric',
                              weekday: 'short'
                            })}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-blue-700">
                          {Math.ceil((new Date(rezerwacja.dateRange.to) - new Date(rezerwacja.dateRange.from)) / (1000 * 60 * 60 * 24)) + 1} dni do wyboru
                        </div>
                        {rezerwacja.time && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <div className="flex items-center text-sm text-gray-700">
                              <FiClock className="h-4 w-4 mr-2" />
                              <span>Preferowana godzina: <strong>{rezerwacja.time}</strong></span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Pojedyncza data */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Data</div>
                      <div className="text-gray-900 font-medium">
                        {rezerwacja.date ? new Date(rezerwacja.date + 'T00:00:00').toLocaleDateString('pl-PL', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        }) : 'Nie ustalono'}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Godzina</div>
                      <div className="text-gray-900 font-medium">
                        {rezerwacja.time || 'Nie ustalono'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {rezerwacja.availability && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dostępność klienta
                  </label>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center text-sm">
                      <FiClock className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="font-medium text-blue-900">{rezerwacja.availability}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opis problemu
                </label>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[80px]">
                  <p className="text-gray-900 whitespace-pre-wrap">{rezerwacja.description || rezerwacja.problem || 'Brak opisu'}</p>
                </div>
              </div>

              {rezerwacja.notes && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notatki wewnętrzne
                  </label>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 min-h-[100px]">
                    <p className="text-gray-900 whitespace-pre-wrap">{rezerwacja.notes}</p>
                  </div>
                </div>
              )}
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
