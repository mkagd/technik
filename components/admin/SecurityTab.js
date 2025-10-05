import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaLock, 
  FaUnlock, 
  FaKey, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaHistory,
  FaCopy,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';

/**
 * SecurityTab Component
 * Zarządzanie hasłami pracowników w panelu admina
 * 
 * Features:
 * - Wyświetlanie statusu hasła
 * - Reset hasła (admin podaje nowe)
 * - Generowanie tymczasowego hasła
 * - Wymuszanie zmiany hasła
 * - Odblokowywanie konta
 * - Historia zmian
 */
export default function SecurityTab({ employeeId, employeeEmail, employeeName }) {
  // Stan
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Formularz resetu hasła
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Tymczasowe hasło (pokazujemy tylko raz)
  const [temporaryPassword, setTemporaryPassword] = useState(null);

  // Pobierz status hasła przy montowaniu
  useEffect(() => {
    fetchPasswordStatus();
  }, [employeeId]);

  // Pobierz status hasła
  const fetchPasswordStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/employee-password?employeeId=${employeeId}`);
      const data = await response.json();
      
      if (data.success) {
        setPasswordStatus(data.data);
      } else {
        setError(data.message || 'Nie udało się pobrać statusu hasła');
      }
    } catch (err) {
      console.error('Error fetching password status:', err);
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  // Reset hasła (admin podaje nowe)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 8) {
      setError('Hasło musi mieć minimum 8 znaków');
      return;
    }
    
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/admin/employee-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset',
          employeeId,
          newPassword,
          adminId: 'ADMIN001' // TODO: pobrać z sesji admina
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('✅ Hasło zostało zmienione');
        setNewPassword('');
        fetchPasswordStatus();
      } else {
        setError(data.message || 'Nie udało się zmienić hasła');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('Błąd połączenia z serwerem');
    } finally {
      setActionLoading(false);
    }
  };

  // Wygeneruj tymczasowe hasło
  const handleGeneratePassword = async () => {
    if (!confirm(`Wygenerować tymczasowe hasło dla ${employeeName}?\n\nPracownik będzie musiał je zmienić przy następnym logowaniu.`)) {
      return;
    }
    
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      setTemporaryPassword(null);
      
      const response = await fetch('/api/admin/employee-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          employeeId,
          adminId: 'ADMIN001' // TODO: pobrać z sesji admina
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTemporaryPassword(data.data.temporaryPassword);
        setSuccess('✅ Wygenerowano tymczasowe hasło (pokazane tylko raz!)');
        fetchPasswordStatus();
      } else {
        setError(data.message || 'Nie udało się wygenerować hasła');
      }
    } catch (err) {
      console.error('Error generating password:', err);
      setError('Błąd połączenia z serwerem');
    } finally {
      setActionLoading(false);
    }
  };

  // Wymaga zmiany hasła
  const handleRequirePasswordChange = async () => {
    if (!confirm(`Wymusić zmianę hasła dla ${employeeName}?\n\nPracownik będzie musiał zmienić hasło przy następnym logowaniu.`)) {
      return;
    }
    
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/admin/employee-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'require-change',
          employeeId,
          adminId: 'ADMIN001' // TODO: pobrać z sesji admina
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('✅ Wymagana zmiana hasła przy następnym logowaniu');
        fetchPasswordStatus();
      } else {
        setError(data.message || 'Nie udało się wymusić zmiany hasła');
      }
    } catch (err) {
      console.error('Error requiring password change:', err);
      setError('Błąd połączenia z serwerem');
    } finally {
      setActionLoading(false);
    }
  };

  // Odblokuj konto
  const handleUnlockAccount = async () => {
    if (!confirm(`Odblokować konto ${employeeName}?`)) {
      return;
    }
    
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/admin/employee-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unlock',
          employeeId,
          adminId: 'ADMIN001' // TODO: pobrać z sesji admina
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('✅ Konto zostało odblokowane');
        fetchPasswordStatus();
      } else {
        setError(data.message || 'Nie udało się odblokować konta');
      }
    } catch (err) {
      console.error('Error unlocking account:', err);
      setError('Błąd połączenia z serwerem');
    } finally {
      setActionLoading(false);
    }
  };

  // Zablokuj konto (ręcznie)
  const handleLockAccount = async () => {
    if (!confirm(`⚠️ ZABLOKOWAĆ KONTO ${employeeName}?\n\nPracownik nie będzie mógł się zalogować do momentu odblokowania przez admina.`)) {
      return;
    }
    
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/admin/employee-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'lock',
          employeeId,
          adminId: 'ADMIN001' // TODO: pobrać z sesji admina
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('🔒 Konto zostało zablokowane');
        fetchPasswordStatus();
      } else {
        setError(data.message || 'Nie udało się zablokować konta');
      }
    } catch (err) {
      console.error('Error locking account:', err);
      setError('Błąd połączenia z serwerem');
    } finally {
      setActionLoading(false);
    }
  };

  // Kopiuj hasło do schowka
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('📋 Skopiowano do schowka!');
    setTimeout(() => setSuccess(null), 2000);
  };

  // Format daty
  const formatDate = (dateString) => {
    if (!dateString) return 'Nigdy';
    const date = new Date(dateString);
    return date.toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Komunikaty */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2"
        >
          <FaExclamationTriangle />
          <span>{error}</span>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2"
        >
          <FaCheckCircle />
          <span>{success}</span>
        </motion.div>
      )}

      {/* Status Hasła */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FaKey className="text-blue-500" />
          Status Hasła
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ma hasło? */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Hasło ustawione:</span>
            <span className={`font-semibold flex items-center gap-2 ${
              passwordStatus?.hasPassword ? 'text-green-600' : 'text-red-600'
            }`}>
              {passwordStatus?.hasPassword ? (
                <>
                  <FaLock /> TAK
                </>
              ) : (
                <>
                  <FaUnlock /> NIE
                </>
              )}
            </span>
          </div>

          {/* Ostatnia zmiana */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Ostatnia zmiana:</span>
            <span className="font-semibold text-gray-900">
              {formatDate(passwordStatus?.lastPasswordChange)}
            </span>
          </div>

          {/* Kto zmienił */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Zmienione przez:</span>
            <span className="font-semibold text-gray-900">
              {passwordStatus?.passwordChangedBy || 'System'}
            </span>
          </div>

          {/* Wymaga zmiany? */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Wymaga zmiany:</span>
            <span className={`font-semibold ${
              passwordStatus?.requirePasswordChange ? 'text-orange-600' : 'text-green-600'
            }`}>
              {passwordStatus?.requirePasswordChange ? 'TAK' : 'NIE'}
            </span>
          </div>

          {/* Konto zablokowane? */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Status konta:</span>
            <span className={`font-semibold flex items-center gap-2 ${
              passwordStatus?.isLocked ? 'text-red-600' : 'text-green-600'
            }`}>
              {passwordStatus?.isLocked ? (
                <>
                  <FaLock /> ZABLOKOWANE
                </>
              ) : (
                <>
                  <FaUnlock /> AKTYWNE
                </>
              )}
            </span>
          </div>

          {/* Nieudane próby */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Nieudane próby:</span>
            <span className={`font-semibold ${
              passwordStatus?.failedLoginAttempts >= 3 ? 'text-orange-600' : 'text-gray-900'
            }`}>
              {passwordStatus?.failedLoginAttempts || 0} / 5
            </span>
          </div>
        </div>
      </div>

      {/* Tymczasowe hasło (pokazujemy tylko raz) */}
      {temporaryPassword && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-yellow-800">
            <FaExclamationTriangle />
            Tymczasowe hasło (pokazane tylko raz!)
          </h3>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-white px-4 py-3 rounded-lg text-2xl font-mono font-bold text-center text-gray-900 border-2 border-yellow-400">
              {temporaryPassword}
            </code>
            <button
              onClick={() => copyToClipboard(temporaryPassword)}
              className="px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2 font-semibold"
            >
              <FaCopy /> Kopiuj
            </button>
          </div>
          <p className="mt-3 text-sm text-yellow-800">
            ⚠️ Zapisz to hasło! Nie będzie można go ponownie wyświetlić. Pracownik będzie musiał je zmienić przy następnym logowaniu.
          </p>
        </motion.div>
      )}

      {/* Akcje - Reset hasła */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FaKey className="text-blue-500" />
          Ustaw nowe hasło
        </h3>
        
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nowe hasło (min. 8 znaków)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Wprowadź nowe hasło..."
                minLength={8}
                disabled={actionLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={actionLoading || !newPassword || newPassword.length < 8}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold"
          >
            {actionLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Zapisywanie...
              </>
            ) : (
              <>
                <FaKey /> Zmień hasło
              </>
            )}
          </button>
        </form>
      </div>

      {/* Akcje - Przyciski */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wygeneruj tymczasowe */}
        <button
          onClick={handleGeneratePassword}
          disabled={actionLoading}
          className="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold"
        >
          <FaKey /> Wygeneruj tymczasowe
        </button>

        {/* Wymaga zmiany */}
        <button
          onClick={handleRequirePasswordChange}
          disabled={actionLoading || passwordStatus?.requirePasswordChange}
          className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold"
        >
          <FaExclamationTriangle /> Wymaga zmiany
        </button>

        {/* Zablokuj konto (jeśli odblokowane) */}
        {!passwordStatus?.isLocked && (
          <button
            onClick={handleLockAccount}
            disabled={actionLoading}
            className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold"
          >
            <FaLock /> Zablokuj konto
          </button>
        )}

        {/* Odblokuj konto (jeśli zablokowane) */}
        {passwordStatus?.isLocked && (
          <button
            onClick={handleUnlockAccount}
            disabled={actionLoading}
            className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold"
          >
            <FaUnlock /> Odblokuj konto
          </button>
        )}
      </div>

      {/* Informacje */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <FaHistory /> Informacje
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Reset hasła:</strong> Admin ustawia nowe hasło (pracownik może z niego korzystać od razu)</li>
          <li>• <strong>Tymczasowe hasło:</strong> System generuje losowe hasło (pokazane tylko raz!) - pracownik musi je zmienić przy logowaniu</li>
          <li>• <strong>Wymaga zmiany:</strong> Pracownik będzie musiał zmienić hasło przy następnym logowaniu</li>
          <li>• <strong>Zablokuj konto:</strong> Ręczna blokada konta przez admina (np. podejrzenie włamania, pracownik odszedł z firmy)</li>
          <li>• <strong>Odblokuj konto:</strong> Konto blokuje się automatycznie po 5 nieudanych próbach logowania lub ręcznie przez admina</li>
        </ul>
      </div>

      {/* Ostrzeżenie o automatycznej blokadzie */}
      {passwordStatus?.failedLoginAttempts >= 3 && !passwordStatus?.isLocked && (
        <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-4">
          <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
            <FaExclamationTriangle className="text-orange-600" />
            Ostrzeżenie - Wielokrotne nieudane próby logowania
          </h4>
          <p className="text-sm text-orange-800">
            Pracownik ma już <strong>{passwordStatus.failedLoginAttempts} nieudane próby</strong> z 5 możliwych. 
            Po przekroczeniu limitu konto zostanie <strong>automatycznie zablokowane</strong>.
          </p>
          <p className="text-sm text-orange-800 mt-2">
            💡 Rozważ reset hasła lub kontakt z pracownikiem.
          </p>
        </div>
      )}
    </div>
  );
}
