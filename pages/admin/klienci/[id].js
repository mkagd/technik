// pages/admin/klienci/[id].js
// Szczegóły i edycja klienta + historia wizyt

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import AvailabilityScheduler from '../../../components/AvailabilityScheduler';
import { 
  FiSave, FiX, FiChevronLeft, FiUser, FiPhone, FiMail, 
  FiMapPin, FiCalendar, FiAlertCircle, FiClock, FiTool, FiHome,
  FiShield, FiLock, FiUnlock, FiKey, FiActivity, FiLogOut
} from 'react-icons/fi';
import { showToast } from '../../../utils/toast';

export default function KlientDetale() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Security state
  const [securityInfo, setSecurityInfo] = useState(null);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityAction, setSecurityAction] = useState(null); // 'reset', 'lock', 'unlock', 'sessions'
  const [newPassword, setNewPassword] = useState('');
  const [lockReason, setLockReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  const [klient, setKlient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    street: '',
    postalCode: '',
    clientId: '',
    source: '',
    sourceDetails: '',
    userId: null,
    isAuthenticated: false,
    createdAt: '',
    updatedAt: '',
    history: [],
    physicalAvailability: null
  });

  useEffect(() => {
    if (id) {
      loadKlient();
      loadSecurityInfo();
    }
  }, [id]);

  const loadKlient = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients?id=${id}`);
      const data = await response.json();
      
      console.log('📞 Odpowiedź z API clients:', data);
      
      // API zwraca obiekt klienta bezpośrednio, nie tablicę
      if (response.ok && data && data.id) {
        console.log('✅ Załadowano klienta:', data.name);
        
        // Jeśli address jest obiektem, wypełnij poszczególne pola
        if (typeof data.address === 'object' && data.address !== null) {
          data.city = data.address.city || '';
          data.street = data.address.street || '';
          data.postalCode = data.address.postalCode || '';
        }
        
        setKlient(data);
      } else if (response.status === 404) {
        showToast.error('Nie znaleziono klienta o ID: ' + id);
        router.push('/admin/klienci');
      } else {
        showToast.error(data.message || 'Nie znaleziono klienta');
        router.push('/admin/klienci');
      }
    } catch (error) {
      console.error('❌ Błąd pobierania klienta:', error);
      showToast.error('Błąd połączenia z serwerem');
      router.push('/admin/klienci');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setKlient(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!klient.name?.trim()) {
      newErrors.name = 'Imię i nazwisko jest wymagane';
    }
    if (!klient.phone?.trim()) {
      newErrors.phone = 'Telefon jest wymagany';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      showToast.warning('Proszę wypełnić wszystkie wymagane pola');
      return;
    }

    try {
      setSaving(true);
      
      // Debug: sprawdź co zapisujemy
      console.log('💾 Zapisywanie klienta:', {
        id: klient.id,
        name: klient.name,
        hasPhysicalAvailability: !!klient.physicalAvailability,
        physicalAvailabilityDetails: klient.physicalAvailability
      });
      
      const response = await fetch('/api/clients', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...klient,
          updatedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        setHasChanges(false);
        showToast.success('Dane klienta zostały zaktualizowane');
        await loadKlient();
      } else {
        const data = await response.json();
        showToast.error(data.message || 'Błąd podczas zapisywania');
      }
    } catch (error) {
      console.error('Błąd:', error);
      showToast.error('Błąd połączenia z serwerem');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      showToast.confirm(
        'Masz niezapisane zmiany. Czy na pewno chcesz wyjść?',
        () => router.push('/admin/klienci')
      );
    } else {
      router.push('/admin/klienci');
    }
  };

  // ===========================
  // SECURITY FUNCTIONS
  // ===========================
  
  const loadSecurityInfo = async () => {
    try {
      setLoadingSecurity(true);
      const response = await fetch(`/api/admin/client-accounts?action=getSecurityInfo&clientId=${id}`);
      const data = await response.json();
      
      if (data.success) {
        setSecurityInfo(data.securityInfo);
      }
    } catch (error) {
      console.error('Błąd ładowania informacji bezpieczeństwa:', error);
    } finally {
      setLoadingSecurity(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showToast.warning('Hasło musi mieć minimum 6 znaków');
      return;
    }

    showToast.confirm(
      `Czy na pewno chcesz zresetować hasło dla ${klient.name}?\n\nWszystkie sesje użytkownika zostaną unieważnione.`,
      async () => {
        try {
          setProcessingAction(true);
      const response = await fetch('/api/admin/client-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resetPassword',
          clientId: id,
          newPassword,
          adminId: 'admin', // TODO: Pobierz z sesji admina
          adminName: 'Administrator'
        })
      });

      const data = await response.json();

      if (data.success) {
        showToast.success(data.message);
        setShowSecurityModal(false);
        setNewPassword('');
        await loadSecurityInfo();
        await loadKlient();
      } else {
        showToast.error(data.message);
      }
    } catch (error) {
      console.error('Błąd resetowania hasła:', error);
      showToast.error('Błąd połączenia z serwerem');
    } finally {
      setProcessingAction(false);
    }
      }
    );
  };

  const handleLockAccount = async () => {
    if (!lockReason.trim()) {
      showToast.warning('Podaj powód blokady konta');
      return;
    }

    showToast.confirm(
      `Czy na pewno chcesz ZABLOKOWAĆ konto ${klient.name}?\n\nUżytkownik nie będzie mógł się zalogować.`,
      async () => {
        try {
          setProcessingAction(true);
      const response = await fetch('/api/admin/client-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'lockAccount',
          clientId: id,
          reason: lockReason,
          adminId: 'admin',
          adminName: 'Administrator'
        })
      });

      const data = await response.json();

      if (data.success) {
        showToast.success(data.message);
        setShowSecurityModal(false);
        setLockReason('');
        await loadSecurityInfo();
        await loadKlient();
      } else {
        showToast.error(data.message);
      }
    } catch (error) {
      console.error('Błąd blokowania konta:', error);
      showToast.error('Błąd połączenia z serwerem');
    } finally {
      setProcessingAction(false);
    }
      }
    );
  };

  const handleUnlockAccount = async () => {
    showToast.confirm(
      `Czy na pewno chcesz ODBLOKOWAĆ konto ${klient.name}?\n\nUżytkownik będzie mógł się ponownie zalogować.`,
      async () => {
        try {
          setProcessingAction(true);
          const response = await fetch('/api/admin/client-accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'unlockAccount',
              clientId: id,
              adminId: 'admin',
              adminName: 'Administrator'
            })
          });

          const data = await response.json();

          if (data.success) {
            showToast.success(data.message);
            await loadSecurityInfo();
            await loadKlient();
          } else {
            showToast.error(data.message);
          }
        } catch (error) {
          console.error('Błąd odblokowywania konta:', error);
          showToast.error('Błąd połączenia z serwerem');
        } finally {
          setProcessingAction(false);
        }
      }
    );
  };

  const handleInvalidateAllSessions = async () => {
    showToast.confirm(
      `Czy na pewno chcesz unieważnić WSZYSTKIE SESJE użytkownika ${klient.name}?\n\nUżytkownik będzie musiał zalogować się ponownie.`,
      async () => {
        try {
          setProcessingAction(true);
          const response = await fetch('/api/admin/client-accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'invalidateAllSessions',
              clientId: id,
              adminId: 'admin',
              adminName: 'Administrator'
            })
          });

          const data = await response.json();

          if (data.success) {
            showToast.success(data.message);
            setShowSecurityModal(false);
            await loadSecurityInfo();
          } else {
            showToast.error(data.message);
          }
        } catch (error) {
          console.error('Błąd unieważniania sesji:', error);
          showToast.error('Błąd połączenia z serwerem');
        } finally {
          setProcessingAction(false);
        }
      }
    );
  };

  const openSecurityModal = (action) => {
    setSecurityAction(action);
    setShowSecurityModal(true);
    setNewPassword('');
    setLockReason('');
  };

  if (loading) {
    return (
      <AdminLayout 
        title="Ładowanie..."
        breadcrumbs={[
          { label: 'Klienci', path: '/admin/klienci' },
          { label: 'Ładowanie...' }
        ]}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Ładowanie danych klienta...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title={klient.name}
      breadcrumbs={[
        { label: 'Klienci', path: '/admin/klienci' },
        { label: klient.name }
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

      {/* Info badges */}
      <div className="mb-6 flex items-center space-x-3">
        <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-800">
          ID: {klient.clientId || id}
        </span>
        {klient.source && (
          <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-green-100 text-green-800">
            Źródło: {klient.source}
          </span>
        )}
        {klient.createdAt && (
          <span className="text-sm text-gray-500">
            Dodano: {new Date(klient.createdAt).toLocaleDateString('pl-PL')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Main form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiUser className="mr-2 h-5 w-5" />
            Dane klienta
          </h3>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imię i nazwisko <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={klient.name}
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
                    value={klient.phone}
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
                    value={klient.email}
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
                    value={klient.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ulica
                  </label>
                  <input
                    type="text"
                    value={klient.street}
                    onChange={(e) => updateField('street', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kod pocztowy
                  </label>
                  <input
                    type="text"
                    value={klient.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    placeholder="00-000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pełny adres
                  </label>
                  <input
                    type="text"
                    value={
                      typeof klient.address === 'object' && klient.address !== null
                        ? `${klient.address.street || ''} ${klient.address.buildingNumber || ''}${klient.address.apartmentNumber ? '/' + klient.address.apartmentNumber : ''}, ${klient.address.postalCode || ''} ${klient.address.city || ''}`
                        : klient.address || ''
                    }
                    onChange={(e) => updateField('address', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="ul. Przykładowa 123/45, 00-000 Miasto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sekcja dostępności fizycznej */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiHome className="mr-2 h-5 w-5 text-green-600" />
            Dostępność fizyczna klienta
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Określ, kiedy klient jest w domu i dostępny na wizytę technika.
            System automatycznie podpowie najlepszy czas i ostrzeże przed wizytami w złych godzinach.
          </p>
          
          <AvailabilityScheduler
            value={klient.physicalAvailability}
            onChange={(availability) => {
              updateField('physicalAvailability', availability);
            }}
          />
        </div>

        {/* Grid z historią i metadanymi */}
        {/* Security Section */}
        {securityInfo && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiShield className="mr-2 h-5 w-5 text-blue-600" />
              Bezpieczeństwo konta
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Status konta */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Status konta</div>
                <div className="flex items-center space-x-2">
                  {securityInfo.isLocked ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      <FiLock className="mr-1 h-4 w-4" />
                      Zablokowane
                    </span>
                  ) : securityInfo.hasPassword ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <FiUnlock className="mr-1 h-4 w-4" />
                      Aktywne
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      <FiUser className="mr-1 h-4 w-4" />
                      Bez konta
                    </span>
                  )}
                </div>
              </div>

              {/* Hasło */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Hasło</div>
                <div className="text-sm font-medium text-gray-900">
                  {securityInfo.hasPassword ? (
                    <span className="text-green-600">✓ Ustawione</span>
                  ) : (
                    <span className="text-gray-400">— Nie ustawione</span>
                  )}
                </div>
                {securityInfo.passwordResetAt && (
                  <div className="text-xs text-gray-500 mt-1">
                    Reset: {new Date(securityInfo.passwordResetAt).toLocaleDateString('pl-PL')}
                  </div>
                )}
              </div>

              {/* Nieudane próby logowania */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Nieudane próby logowania</div>
                <div className="text-sm font-medium">
                  <span className={`${securityInfo.failedLoginAttempts >= 3 ? 'text-red-600' : 'text-gray-900'}`}>
                    {securityInfo.failedLoginAttempts} / {securityInfo.maxFailedAttempts}
                  </span>
                </div>
                {securityInfo.failedLoginAttempts > 0 && (
                  <div className="text-xs text-orange-600 mt-1">
                    ⚠️ Wykryto nieudane próby
                  </div>
                )}
              </div>

              {/* Ostatnie logowanie */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Ostatnie logowanie</div>
                <div className="text-sm font-medium text-gray-900">
                  {securityInfo.lastLogin ? (
                    <>
                      {new Date(securityInfo.lastLogin).toLocaleDateString('pl-PL')}
                      <div className="text-xs text-gray-500">
                        {new Date(securityInfo.lastLogin).toLocaleTimeString('pl-PL')}
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-400">Nigdy</span>
                  )}
                </div>
                {securityInfo.lastLoginMethod && (
                  <div className="text-xs text-blue-600 mt-1">
                    {securityInfo.lastLoginMethod === 'email' ? '📧 Email' : 
                     securityInfo.lastLoginMethod === 'phone' ? '📱 Telefon' : 
                     '📦 Zamówienie'}
                  </div>
                )}
              </div>

              {/* Aktywne sesje */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Aktywne sesje</div>
                <div className="text-sm font-medium text-gray-900">
                  {securityInfo.activeSessions || 0}
                  {securityInfo.totalSessions > 0 && (
                    <span className="text-xs text-gray-500"> / {securityInfo.totalSessions} całk.</span>
                  )}
                </div>
                {securityInfo.activeSessions > 0 && (
                  <button
                    onClick={() => openSecurityModal('sessions')}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                  >
                    Zobacz szczegóły →
                  </button>
                )}
              </div>

              {/* Info o blokadzie */}
              {securityInfo.isLocked && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200 md:col-span-2 lg:col-span-3">
                  <div className="flex items-start">
                    <FiLock className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-red-900 mb-1">
                        Konto zablokowane
                      </div>
                      {securityInfo.lockReason && (
                        <div className="text-xs text-red-700 mb-1">
                          Powód: {securityInfo.lockReason}
                        </div>
                      )}
                      {securityInfo.lockedAt && (
                        <div className="text-xs text-red-600">
                          Zablokowano: {new Date(securityInfo.lockedAt).toLocaleString('pl-PL')}
                          {securityInfo.lockedByName && ` przez ${securityInfo.lockedByName}`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {securityInfo.hasPassword && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => openSecurityModal('reset')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FiKey className="mr-2 h-4 w-4" />
                    Resetuj hasło
                  </button>

                  {securityInfo.isLocked ? (
                    <button
                      onClick={handleUnlockAccount}
                      disabled={processingAction}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <FiUnlock className="mr-2 h-4 w-4" />
                      Odblokuj konto
                    </button>
                  ) : (
                    <button
                      onClick={() => openSecurityModal('lock')}
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <FiLock className="mr-2 h-4 w-4" />
                      Zablokuj konto
                    </button>
                  )}

                  {securityInfo.activeSessions > 0 && (
                    <button
                      onClick={handleInvalidateAllSessions}
                      disabled={processingAction}
                      className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                      <FiLogOut className="mr-2 h-4 w-4" />
                      Wyloguj ze wszystkich urządzeń
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Historia wizyt */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiClock className="mr-2 h-5 w-5" />
              Historia wizyt
            </h3>

            {klient.history && klient.history.length > 0 ? (
              <div className="space-y-3">
                {klient.history.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center text-sm text-gray-900 mb-1">
                      <FiTool className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium">{item.service || 'Wizyta serwisowa'}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <FiCalendar className="h-3 w-3 mr-1" />
                      {new Date(item.date).toLocaleDateString('pl-PL')}
                    </div>
                    {item.description && (
                      <p className="mt-2 text-xs text-gray-600">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiClock className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  Brak historii wizyt
                </p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Metadane</h4>
            <div className="space-y-2 text-xs text-gray-600">
              {klient.createdBy && (
                <div>
                  <span className="font-medium">Utworzono przez:</span> {klient.createdByName || klient.createdBy}
                </div>
              )}
              {klient.sourceDetails && (
                <div>
                  <span className="font-medium">Źródło szczegóły:</span> {klient.sourceDetails}
                </div>
              )}
              {klient.updatedAt && (
                <div>
                  <span className="font-medium">Ostatnia aktualizacja:</span><br />
                  {new Date(klient.updatedAt).toLocaleString('pl-PL')}
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Security Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {securityAction === 'reset' && '🔑 Resetuj hasło'}
                  {securityAction === 'lock' && '🔒 Zablokuj konto'}
                  {securityAction === 'sessions' && '📱 Aktywne sesje'}
                </h3>
                <button
                  onClick={() => setShowSecurityModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                {securityAction === 'reset' && (
                  <>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start">
                        <FiAlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">Resetowanie hasła</p>
                          <p>Ustaw nowe hasło dla użytkownika {klient.name}. Wszystkie sesje zostaną unieważnione.</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nowe hasło (min. 6 znaków)
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Wprowadź nowe hasło..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={() => setShowSecurityModal(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Anuluj
                      </button>
                      <button
                        onClick={handleResetPassword}
                        disabled={processingAction || !newPassword || newPassword.length < 6}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingAction ? 'Resetowanie...' : 'Resetuj hasło'}
                      </button>
                    </div>
                  </>
                )}

                {securityAction === 'lock' && (
                  <>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-start">
                        <FiAlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-red-800">
                          <p className="font-medium mb-1">Blokada konta</p>
                          <p>Użytkownik {klient.name} nie będzie mógł się zalogować do systemu. Wszystkie sesje zostaną unieważnione.</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Powód blokady
                      </label>
                      <textarea
                        value={lockReason}
                        onChange={(e) => setLockReason(e.target.value)}
                        placeholder="Np. Podejrzana aktywność, naruszenie regulaminu..."
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={() => setShowSecurityModal(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Anuluj
                      </button>
                      <button
                        onClick={handleLockAccount}
                        disabled={processingAction || !lockReason.trim()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingAction ? 'Blokowanie...' : 'Zablokuj konto'}
                      </button>
                    </div>
                  </>
                )}

                {securityAction === 'sessions' && securityInfo && (
                  <>
                    <div className="space-y-3">
                      {securityInfo.sessions && securityInfo.sessions.length > 0 ? (
                        securityInfo.sessions.map((session, index) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center text-sm font-medium text-gray-900">
                                <FiActivity className="mr-2 h-4 w-4 text-green-600" />
                                Aktywna sesja
                              </div>
                              <span className="text-xs text-gray-500">
                                {session.token}
                              </span>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>
                                <span className="font-medium">Metoda:</span>{' '}
                                {session.loginMethod === 'email' ? '📧 Email' : 
                                 session.loginMethod === 'phone' ? '📱 Telefon' : '📦 Zamówienie'}
                              </div>
                              <div>
                                <span className="font-medium">Zalogowano:</span>{' '}
                                {new Date(session.createdAt).toLocaleString('pl-PL')}
                              </div>
                              <div>
                                <span className="font-medium">Ostatnia aktywność:</span>{' '}
                                {new Date(session.lastActivity).toLocaleString('pl-PL')}
                              </div>
                              {session.ip !== 'unknown' && (
                                <div>
                                  <span className="font-medium">IP:</span> {session.ip}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Brak aktywnych sesji
                        </div>
                      )}
                    </div>

                    {securityInfo.activeSessions > 0 && (
                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => setShowSecurityModal(false)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Zamknij
                        </button>
                        <button
                          onClick={handleInvalidateAllSessions}
                          disabled={processingAction}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                        >
                          {processingAction ? 'Wylogowywanie...' : 'Wyloguj ze wszystkich'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
