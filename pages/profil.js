// pages/profil.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit, FiSave, FiX, FiCalendar, FiClock, FiSettings, FiLogOut } from 'react-icons/fi';

export default function Profil() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sprawdzenie czy użytkownik jest zalogowany
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      router.push('/logowanie?returnUrl=/profil');
      return;
    }

    const userData = JSON.parse(currentUser);
    setUser(userData);
    setEditData(userData);

    // Pobranie rezerwacji użytkownika (symulacja)
    const mockBookings = [
      {
        id: 1,
        date: '2024-02-15T10:00:00',
        category: 'Naprawa laptopa',
        device: 'Dell Inspiron 15',
        status: 'confirmed',
        price: 150
      },
      {
        id: 2,
        date: '2024-01-20T14:00:00',
        category: 'Wymiana ekranu telefonu',
        device: 'iPhone 13',
        status: 'completed',
        price: 280
      }
    ];
    setUserBookings(mockBookings);
    setLoading(false);
  }, [router]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditData(user);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      // Aktualizacja danych użytkownika
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.map(u =>
        u.id === user.id ? { ...u, ...editData } : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));

      // Aktualizacja danych w sesji
      const updatedUser = { ...user, ...editData };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditing(false);

      alert('Profil został zaktualizowany!');
    } catch (error) {
      console.error('Błąd podczas aktualizacji profilu:', error);
      alert('Wystąpił błąd podczas aktualizacji profilu.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('rememberUser');
    router.push('/logowanie');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Oczekuje';
      case 'confirmed': return 'Potwierdzona';
      case 'completed': return 'Zakończona';
      case 'cancelled': return 'Anulowana';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mój Profil</h1>
              <p className="text-gray-600">Zarządzaj swoimi danymi i rezerwacjami</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Strona główna
              </Link>
              <Link
                href="/historia-napraw"
                className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                Historia napraw
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <FiLogOut className="h-4 w-4" />
                Wyloguj
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Informacje osobiste</h2>
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FiEdit className="h-4 w-4" />
                    Edytuj
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <FiSave className="h-4 w-4" />
                      Zapisz
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <FiX className="h-4 w-4" />
                      Anuluj
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Imię */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imię
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.firstName || ''}
                      onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center">
                      <FiUser className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">{user.firstName}</span>
                    </div>
                  )}
                </div>

                {/* Nazwisko */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nazwisko
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.lastName || ''}
                      onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center">
                      <FiUser className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">{user.lastName}</span>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="flex items-center">
                    <FiMail className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-900">{user.email}</span>
                    <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Nie można zmienić
                    </span>
                  </div>
                </div>

                {/* Telefon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editData.phone || ''}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center">
                      <FiPhone className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">{user.phone}</span>
                    </div>
                  )}
                </div>

                {/* Miasto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Miasto
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.city || ''}
                      onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center">
                      <FiMapPin className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">{user.city}</span>
                    </div>
                  )}
                </div>

                {/* Adres */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adres
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.address || ''}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center">
                      <FiMapPin className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">{user.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bookings History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Historia rezerwacji</h2>

              {userBookings.length === 0 ? (
                <div className="text-center py-8">
                  <FiCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nie masz jeszcze żadnych rezerwacji</p>
                  <Link
                    href="/"
                    className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Zarezerwuj serwis
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {userBookings.map((booking) => (
                    <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <h3 className="font-medium text-gray-900">{booking.category}</h3>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                              {getStatusText(booking.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{booking.device}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <FiCalendar className="h-4 w-4 mr-1" />
                              {new Date(booking.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <FiClock className="h-4 w-4 mr-1" />
                              {new Date(booking.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{booking.price} zł</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Statystyki konta</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Łączne rezerwacje:</span>
                  <span className="font-medium">{userBookings.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ukończone:</span>
                  <span className="font-medium">{userBookings.filter(b => b.status === 'completed').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Łączna wartość:</span>
                  <span className="font-medium">{userBookings.reduce((sum, b) => sum + b.price, 0)} zł</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Członek od:</span>
                  <span className="font-medium">{new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Szybkie akcje</h3>
              <div className="space-y-3">
                <Link
                  href="/"
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiCalendar className="h-4 w-4 mr-2" />
                  Nowa rezerwacja
                </Link>
                <Link
                  href="/ustawienia"
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiSettings className="h-4 w-4 mr-2" />
                  Ustawienia
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
