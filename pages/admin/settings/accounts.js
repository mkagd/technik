import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiLock, FiUnlock, FiShield, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

export default function AccountsManagement() {
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    // Sprawdź czy użytkownik to admin
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      
      if (user.role !== 'admin') {
        router.push('/admin');
        return;
      }
    }
    
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/accounts');
      const data = await response.json();
      
      if (data.success) {
        setAccounts(data.accounts);
      }
    } catch (err) {
      console.error('Error loading accounts:', err);
      setError('Błąd ładowania kont użytkowników');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { color: 'bg-red-100 text-red-800', icon: '👑', label: 'Administrator' },
      manager: { color: 'bg-blue-100 text-blue-800', icon: '📊', label: 'Kierownik' },
      logistyk: { color: 'bg-purple-100 text-purple-800', icon: '📦', label: 'Logistyk' },
      employee: { color: 'bg-green-100 text-green-800', icon: '👤', label: 'Pracownik' }
    };
    
    const badge = badges[role] || badges.employee;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <span>{badge.icon}</span>
        <span>{badge.label}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout title="Zarządzanie Kontami">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Zarządzanie Kontami"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Ustawienia', href: '/admin/ustawienia' },
        { label: 'Konta użytkowników' }
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Zarządzanie Kontami</h1>
              <p className="mt-2 text-gray-600">Tylko administratorzy mogą zarządzać kontami użytkowników</p>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <FiPlus />
              <span>Dodaj konto</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <FiAlertCircle className="text-red-600 text-xl flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Błąd</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <FiCheckCircle className="text-green-600 text-xl flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-800 font-medium">Sukces</p>
              <p className="text-green-600 text-sm mt-1">{success}</p>
            </div>
          </div>
        )}

        {/* Accounts Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Użytkownik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rola
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ostatnie logowanie
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiUsers className="text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{account.name}</div>
                        <div className="text-sm text-gray-500">ID: {account.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{account.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(account.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {account.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <FiCheckCircle />
                        Aktywne
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <FiLock />
                        Nieaktywne
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account.lastLogin ? new Date(account.lastLogin).toLocaleString('pl-PL') : 'Nigdy'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        title="Edytuj"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className="text-yellow-600 hover:text-yellow-900"
                        title={account.isActive ? 'Dezaktywuj' : 'Aktywuj'}
                      >
                        {account.isActive ? <FiLock /> : <FiUnlock />}
                      </button>
                      {account.id !== currentUser?.id && (
                        <button
                          className="text-red-600 hover:text-red-900"
                          title="Usuń"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <FiShield className="text-blue-600 text-xl flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-900 font-medium">Zarządzanie kontami</p>
              <p className="text-blue-700 text-sm mt-1">
                Ta sekcja jest dostępna tylko dla administratorów. Możesz tutaj dodawać nowych użytkowników,
                edytować ich uprawnienia oraz deaktywować konta.
              </p>
              <p className="text-blue-700 text-sm mt-2">
                <strong>Dostępne role:</strong> Administrator, Kierownik, Logistyk, Pracownik
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
