// pages/admin.js

import { useState, useEffect } from 'react';
import { FiCalendar, FiUsers, FiTrendingUp, FiDownload, FiEye, FiTrash2, FiEdit, FiFilter, FiX, FiPhone, FiMapPin, FiClock, FiDollarSign, FiUserPlus, FiUserCheck, FiUserX, FiMail, FiShield, FiSettings, FiToggleLeft, FiToggleRight } from 'react-icons/fi';

export default function Admin() {
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [rezerwacje, setRezerwacje] = useState([]);
  const [filteredRezerwacje, setFilteredRezerwacje] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings', 'users', 'employees', lub 'settings'
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    category: '',
    status: ''
  });
  const [userFilters, setUserFilters] = useState({
    name: '',
    email: '',
    city: '',
    status: ''
  });
  const [employeeFilters, setEmployeeFilters] = useState({
    name: '',
    email: '',
    specialization: '',
    status: ''
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [showEmployeeDetailsModal, setShowEmployeeDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUserDeleteModal, setShowUserDeleteModal] = useState(false);
  const [showEmployeeDeleteModal, setShowEmployeeDeleteModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // Nowe stany dla ustawień wyświetlania kontaktu
  const [contactDisplaySettings, setContactDisplaySettings] = useState({
    showPhone: true,
    showEmail: true,
    showCity: true,
    phoneFormat: 'full', // 'full', 'masked', 'hidden'
    emailFormat: 'full', // 'full', 'masked', 'hidden'
    cityFormat: 'full' // 'full', 'initials', 'hidden'
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Nowe stany dla edycji
  const [showEditBookingModal, setShowEditBookingModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editBookingForm, setEditBookingForm] = useState({});
  const [editUserForm, setEditUserForm] = useState({});
  const [editEmployeeForm, setEditEmployeeForm] = useState({});

  // Rozszerzone statusy
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

  const userStatuses = [
    { value: 'active', label: 'Aktywny', color: 'bg-green-100 text-green-800' },
    { value: 'inactive', label: 'Nieaktywny', color: 'bg-red-100 text-red-800' },
    { value: 'suspended', label: 'Zawieszony', color: 'bg-orange-100 text-orange-800' },
    { value: 'premium', label: 'Premium', color: 'bg-purple-100 text-purple-800' },
    { value: 'vip', label: 'VIP', color: 'bg-yellow-100 text-yellow-800' }
  ];

  // Symulowane dane - w rzeczywistej aplikacji byłyby z bazy danych
  const mockData = [
    {
      id: 1,
      date: '2024-01-15T10:00:00',
      selectedDate: '2024-01-15',
      selectedTime: '10:00',
      name: 'Jan Kowalski',
      phone: '+48 123 456 789',
      email: 'jan.kowalski@email.com',
      city: 'Warszawa',
      street: 'ul. Marszałkowska 123',
      category: 'Naprawa laptopa',
      device: 'Dell Inspiron 15',
      description: 'Laptop się nie włącza, prawdopodobnie problem z zasilaczem',
      price: 150,
      status: 'pending',
      createdAt: '2024-01-10T09:30:00'
    },
    {
      id: 2,
      date: '2024-01-16T14:00:00',
      selectedDate: '2024-01-16',
      selectedTime: '14:00',
      name: 'Anna Nowak',
      phone: '+48 987 654 321',
      email: 'anna.nowak@email.com',
      city: 'Kraków',
      street: 'ul. Floriańska 45',
      category: 'Wymiana ekranu telefonu',
      device: 'iPhone 13',
      description: 'Pęknięty ekran po upadku',
      price: 280,
      status: 'confirmed',
      createdAt: '2024-01-12T15:20:00'
    },
    {
      id: 3,
      date: '2024-01-17T11:30:00',
      selectedDate: '2024-01-17',
      selectedTime: '11:30',
      name: 'Piotr Wiśniewski',
      phone: '+48 555 666 777',
      email: 'piotr.wisniewski@email.com',
      city: 'Gdańsk',
      street: 'ul. Długa 78',
      category: 'Czyszczenie komputera',
      device: 'PC Desktop',
      description: 'Komputer bardzo głośno pracuje, wymaga czyszczenia',
      price: 80,
      status: 'completed',
      createdAt: '2024-01-13T11:45:00'
    }
  ];

  // Symulowane dane użytkowników
  const mockUsers = [
    {
      id: 1,
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'jan.kowalski@email.com',
      phone: '+48 123 456 789',
      city: 'Warszawa',
      address: 'ul. Marszałkowska 123',
      createdAt: '2024-01-10T09:30:00',
      isActive: true,
      lastLogin: '2024-01-20T14:30:00',
      totalBookings: 3,
      totalSpent: 450
    },
    {
      id: 2,
      firstName: 'Anna',
      lastName: 'Nowak',
      email: 'anna.nowak@email.com',
      phone: '+48 987 654 321',
      city: 'Kraków',
      address: 'ul. Floriańska 45',
      createdAt: '2024-01-12T15:20:00',
      isActive: true,
      lastLogin: '2024-01-19T11:15:00',
      totalBookings: 2,
      totalSpent: 330
    },
    {
      id: 3,
      firstName: 'Piotr',
      lastName: 'Wiśniewski',
      email: 'piotr.wisniewski@email.com',
      phone: '+48 555 666 777',
      city: 'Gdańsk',
      address: 'ul. Długa 78',
      createdAt: '2024-01-13T11:45:00',
      isActive: false,
      lastLogin: '2024-01-15T16:20:00',
      totalBookings: 1,
      totalSpent: 80
    }
  ];

  useEffect(() => {
    if (auth) {
      loadRealData();
    }
  }, [auth]);

  // Funkcja do ładowania rzeczywistych danych
  const loadRealData = async () => {
    try {
      console.log('🔄 Ładowanie rzeczywistych danych...');

      // Pobierz rezerwacje z API
      const rezerwacjeResponse = await fetch('/api/rezerwacje');
      if (rezerwacjeResponse.ok) {
        const rezerwacjeData = await rezerwacjeResponse.json();
        console.log('✅ Załadowano rezerwacje:', rezerwacjeData);

        // API zwraca { rezerwacje: [...] } więc wyciągamy tablicę
        const rezerwacjeArray = Array.isArray(rezerwacjeData)
          ? rezerwacjeData
          : (rezerwacjeData.rezerwacje || []);

        console.log('📊 Processed reservations array:', rezerwacjeArray.length, 'items');
        setRezerwacje(rezerwacjeArray);
        setFilteredRezerwacje(rezerwacjeArray);
      } else {
        console.log('⚠️ Brak danych rezerwacji, używam mock data');
        setRezerwacje(mockData);
        setFilteredRezerwacje(mockData);
      }

      // Pobierz klientów z API
      const clientsResponse = await fetch('/api/clients');
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        console.log('✅ Załadowano klientów:', clientsData);

        // Konwertuj klientów na format użytkowników dla panelu admin
        const convertedUsers = clientsData.map(client => ({
          id: client.id,
          firstName: client.name.split(' ')[0] || client.name,
          lastName: client.name.split(' ').slice(1).join(' ') || '',
          email: client.email || 'brak@email.com',
          phone: client.phone || 'Brak telefonu',
          city: client.city || 'Nie podano',
          address: client.address || 'Nie podano',
          createdAt: client.dateAdded || new Date().toISOString(),
          isActive: true,
          lastLogin: null,
          totalBookings: 0,
          totalSpent: 0
        }));

        setUsers(convertedUsers);
        setFilteredUsers(convertedUsers);
      } else {
        console.log('⚠️ Brak danych klientów, używam mock data');
        setUsers(mockUsers);
        setFilteredUsers(mockUsers);
      }

      // Pobierz pracowników z API
      const employeesResponse = await fetch('/api/employees');
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        console.log('✅ Załadowano pracowników:', employeesData);
        console.log('👥 Liczba pracowników:', employeesData.employees?.length || 0);

        setEmployees(employeesData.employees || []);
        setFilteredEmployees(employeesData.employees || []);
        setSpecializations(employeesData.specializations || []);
      } else {
        console.log('⚠️ Brak danych pracowników - response not ok');
        setEmployees([]);
        setFilteredEmployees([]);
        setSpecializations([]);
      }

    } catch (error) {
      console.error('❌ Błąd ładowania danych:', error);
      // Fallback do mock data
      setRezerwacje(mockData);
      setFilteredRezerwacje(mockData);
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [filters, rezerwacje]);

  useEffect(() => {
    applyUserFilters();
  }, [userFilters, users]);

  useEffect(() => {
    applyEmployeeFilters();
  }, [employeeFilters, employees]);

  const checkLogin = () => {
    if (password === 'admin123') { // W rzeczywistej aplikacji to byłoby bezpieczne
      setAuth(true);
    } else {
      alert('Błędne hasło');
    }
  };

  const applyFilters = () => {
    // Zabezpieczenie - upewnij się, że rezerwacje to tablica
    const rezervacjeArray = Array.isArray(rezerwacje) ? rezerwacje : [];
    let filtered = [...rezervacjeArray];

    if (filters.dateFrom) {
      filtered = filtered.filter(r => new Date(r.date) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(r => new Date(r.date) <= new Date(filters.dateTo));
    }
    if (filters.category) {
      filtered = filtered.filter(r => r.category && r.category.toLowerCase().includes(filters.category.toLowerCase()));
    }
    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    setFilteredRezerwacje(filtered);
  };

  const applyUserFilters = () => {
    // Zabezpieczenie - upewnij się, że users to tablica
    const usersArray = Array.isArray(users) ? users : [];
    let filtered = [...usersArray];

    if (userFilters.name) {
      filtered = filtered.filter(u =>
        `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(userFilters.name.toLowerCase())
      );
    }
    if (userFilters.email) {
      filtered = filtered.filter(u => u.email && u.email.toLowerCase().includes(userFilters.email.toLowerCase()));
    }
    if (userFilters.city) {
      filtered = filtered.filter(u => u.city && u.city.toLowerCase().includes(userFilters.city.toLowerCase()));
    }
    if (userFilters.status) {
      filtered = filtered.filter(u => userFilters.status === 'active' ? u.isActive : !u.isActive);
    }

    setFilteredUsers(filtered);
  };

  const applyEmployeeFilters = () => {
    // Zabezpieczenie - upewnij się, że employees to tablica
    const employeesArray = Array.isArray(employees) ? employees : [];
    let filtered = [...employeesArray];

    if (employeeFilters.name) {
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(employeeFilters.name.toLowerCase())
      );
    }
    if (employeeFilters.email) {
      filtered = filtered.filter(e => e.email && e.email.toLowerCase().includes(employeeFilters.email.toLowerCase()));
    }
    if (employeeFilters.specialization) {
      filtered = filtered.filter(e =>
        e.specializations && e.specializations.some(spec =>
          spec.toLowerCase().includes(employeeFilters.specialization.toLowerCase())
        )
      );
    }
    if (employeeFilters.status) {
      filtered = filtered.filter(e => employeeFilters.status === 'active' ? e.isActive : !e.isActive);
    }

    setFilteredEmployees(filtered);
  };

  const exportToCSV = () => {
    if (activeTab === 'bookings') {
      // Zabezpieczenie - upewnij się, że filteredRezerwacje to tablica
      const rezervacjeArray = Array.isArray(filteredRezerwacje) ? filteredRezerwacje : [];

      const headers = ['Data', 'Imię', 'Telefon', 'Email', 'Miasto', 'Adres', 'Usługa', 'Urządzenie', 'Cena', 'Status'];
      const csvContent = [
        headers.join(','),
        ...rezervacjeArray.map(r => [
          new Date(r.date || new Date()).toLocaleString(),
          r.name || '',
          formatPhone(r.phone || ''),
          formatEmail(r.email || ''),
          formatCity(r.city || ''),
          r.street || '',
          r.category || '',
          r.device || '',
          (r.price || 0) + ' zł',
          r.status || ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rezerwacje_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } else if (activeTab === 'users') {
      const headers = ['Imię', 'Nazwisko', 'Email', 'Telefon', 'Miasto', 'Adres', 'Data rejestracji', 'Status', 'Ostatnie logowanie', 'Rezerwacje', 'Wydano'];
      const csvContent = [
        headers.join(','),
        ...filteredUsers.map(u => [
          u.firstName,
          u.lastName,
          formatEmail(u.email),
          formatPhone(u.phone),
          formatCity(u.city),
          u.address,
          new Date(u.createdAt).toLocaleDateString(),
          u.isActive ? 'Aktywny' : 'Nieaktywny',
          new Date(u.lastLogin).toLocaleDateString(),
          u.totalBookings,
          u.totalSpent + ' zł'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `uzytkownicy_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } else if (activeTab === 'employees') {
      const headers = ['ID', 'Imię', 'Email', 'Telefon', 'Specjalizacje', 'Status', 'Ocena', 'Wykonane zlecenia', 'Adres', 'Godziny pracy'];
      const csvContent = [
        headers.join(','),
        ...filteredEmployees.map(e => [
          e.id,
          e.name,
          e.email || 'Brak',
          e.phone || 'Brak',
          (e.specializations || []).join('; '),
          e.isActive ? 'Aktywny' : 'Nieaktywny',
          e.rating || '0.0',
          e.completedJobs || 0,
          e.address || 'Nie podano',
          e.workingHours || 'Nie określono'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pracownicy_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
  };

  const getStatusColor = (status) => {
    const statusObj = bookingStatuses.find(s => s.value === status);
    return statusObj ? statusObj.color : 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const statusObj = bookingStatuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  const getUserStatusColor = (status) => {
    const statusObj = userStatuses.find(s => s.value === status);
    return statusObj ? statusObj.color : 'bg-gray-100 text-gray-800';
  };

  const getUserStatusText = (status) => {
    const statusObj = userStatuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  // Funkcje edycji
  const startEditBooking = (booking) => {
    setEditingBooking(booking);
    setEditBookingForm({
      name: booking.name,
      phone: booking.phone,
      email: booking.email,
      city: booking.city,
      street: booking.street,
      category: booking.category,
      device: booking.device,
      description: booking.description,
      availability: booking.availability || 'Nie określono', // Add availability field
      price: booking.price,
      status: booking.status,
      selectedDate: booking.selectedDate,
      selectedTime: booking.selectedTime
    });
    setShowEditBookingModal(true);
  };

  const startEditUser = (user) => {
    setEditingUser(user);
    setEditUserForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      city: user.city,
      address: user.address,
      status: user.isActive ? 'active' : 'inactive'
    });
    setShowEditUserModal(true);
  };

  const saveBookingEdit = async () => {
    try {
      console.log('💾 Zapisywanie zmian w rezerwacji...', editBookingForm);

      // Aktualizuj lokalne dane natychmiast dla UX
      setRezerwacje(prev => prev.map(r =>
        r.id === editingBooking.id
          ? { ...r, ...editBookingForm }
          : r
      ));

      // Spróbuj zapisać do API (jeśli będziemy mieć endpoint do aktualizacji)
      try {
        const response = await fetch(`/api/rezerwacje/${editingBooking.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editBookingForm),
        });

        if (response.ok) {
          console.log('✅ Rezerwacja zaktualizowana w API');
        } else {
          console.log('⚠️ API update failed, but local data updated');
        }
      } catch (apiError) {
        console.log('⚠️ API not available, but local data updated:', apiError);
      }

      setShowEditBookingModal(false);
      setEditingBooking(null);
      setEditBookingForm({});

      // Przeładuj dane po zapisaniu
      loadRealData();

    } catch (error) {
      console.error('❌ Błąd zapisywania:', error);
      alert('Błąd podczas zapisywania zmian');
    }
  };

  const saveUserEdit = async () => {
    try {
      console.log('💾 Zapisywanie zmian w danych klienta...', editUserForm);

      // Aktualizuj lokalne dane natychmiast dla UX
      setUsers(prev => prev.map(u =>
        u.id === editingUser.id
          ? {
            ...u,
            ...editUserForm,
            isActive: editUserForm.status === 'active',
            userStatus: editUserForm.status
          }
          : u
      ));

      // Spróbuj zapisać do API klientów
      try {
        const response = await fetch(`/api/clients/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: `${editUserForm.firstName} ${editUserForm.lastName}`.trim(),
            phone: editUserForm.phone,
            email: editUserForm.email,
            city: editUserForm.city,
            address: editUserForm.address,
            isActive: editUserForm.status === 'active'
          }),
        });

        if (response.ok) {
          console.log('✅ Dane klienta zaktualizowane w API');
        } else {
          console.log('⚠️ API update failed, but local data updated');
        }
      } catch (apiError) {
        console.log('⚠️ API not available, but local data updated:', apiError);
      }

      setShowEditUserModal(false);
      setEditingUser(null);
      setEditUserForm({});

      // Przeładuj dane po zapisaniu
      loadRealData();

    } catch (error) {
      console.error('❌ Błąd zapisywania danych klienta:', error);
      alert('Błąd podczas zapisywania zmian klienta');
    }
  };

  const deleteBooking = async (id) => {
    try {
      console.log('🗑️ Usuwanie rezerwacji:', id);

      // Usuń lokalnie natychmiast dla UX
      setRezerwacje(prev => prev.filter(r => r.id !== id));

      // Spróbuj usunąć przez API
      try {
        const response = await fetch(`/api/rezerwacje/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          console.log('✅ Rezerwacja usunięta z API');
        } else {
          console.log('⚠️ API delete failed, but local data updated');
        }
      } catch (apiError) {
        console.log('⚠️ API not available, but local data updated:', apiError);
      }

      setShowDeleteModal(false);
      setBookingToDelete(null);

      // Przeładuj dane po usunięciu
      loadRealData();

    } catch (error) {
      console.error('❌ Błąd usuwania:', error);
      alert('Błąd podczas usuwania rezerwacji');
    }
  };

  const deleteUser = async (id) => {
    try {
      console.log('🗑️ Usuwanie klienta:', id);

      // Usuń lokalnie natychmiast dla UX
      setUsers(prev => prev.filter(u => u.id !== id));

      // Spróbuj usunąć przez API
      try {
        const response = await fetch(`/api/clients/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Klient usunięty z API:', result);
        } else {
          console.log('⚠️ API delete failed, but local data updated');
        }
      } catch (apiError) {
        console.log('⚠️ API not available, but local data updated:', apiError);
      }

      setShowUserDeleteModal(false);
      setUserToDelete(null);

      // Przeładuj dane po usunięciu
      loadRealData();

    } catch (error) {
      console.error('❌ Błąd usuwania klienta:', error);
      alert('Błąd podczas usuwania klienta');
    }
  };

  const toggleUserStatus = (id) => {
    setUsers(prev => prev.map(u =>
      u.id === id ? { ...u, isActive: !u.isActive } : u
    ));
  };

  // Employee management functions
  const startEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setEditEmployeeForm({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      specializations: employee.specializations || [],
      address: employee.address,
      workingHours: employee.workingHours,
      experience: employee.experience,
      isActive: employee.isActive
    });
    setShowEditEmployeeModal(true);
  };

  const saveEmployeeEdit = async () => {
    try {
      console.log('💾 Zapisywanie zmian w danych pracownika...', editEmployeeForm);

      // Aktualizuj lokalne dane natychmiast dla UX
      setEmployees(prev => prev.map(e =>
        e.id === editingEmployee.id
          ? { ...e, ...editEmployeeForm }
          : e
      ));

      // Spróbuj zapisać do API
      try {
        const response = await fetch(`/api/employees/${editingEmployee.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editEmployeeForm),
        });

        if (response.ok) {
          console.log('✅ Dane pracownika zaktualizowane w API');
        } else {
          console.log('⚠️ API update failed, but local data updated');
        }
      } catch (apiError) {
        console.log('⚠️ API not available, but local data updated:', apiError);
      }

      setShowEditEmployeeModal(false);
      setEditingEmployee(null);
      setEditEmployeeForm({});

      // Przeładuj dane po zapisaniu
      loadRealData();

    } catch (error) {
      console.error('❌ Błąd zapisywania danych pracownika:', error);
      alert('Błąd podczas zapisywania zmian pracownika');
    }
  };

  const deleteEmployee = async (id) => {
    try {
      console.log('🗑️ Usuwanie pracownika:', id);

      // Usuń lokalnie natychmiast dla UX
      setEmployees(prev => prev.filter(e => e.id !== id));

      // Spróbuj usunąć przez API
      try {
        const response = await fetch(`/api/employees/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          console.log('✅ Pracownik usunięty z API');
        } else {
          console.log('⚠️ API delete failed, but local data updated');
        }
      } catch (apiError) {
        console.log('⚠️ API not available, but local data updated:', apiError);
      }

      setShowEmployeeDeleteModal(false);
      setEmployeeToDelete(null);

      // Przeładuj dane po usunięciu
      loadRealData();

    } catch (error) {
      console.error('❌ Błąd usuwania pracownika:', error);
      alert('Błąd podczas usuwania pracownika');
    }
  };

  const addEmployee = async (employeeData) => {
    try {
      console.log('➕ Dodawanie nowego pracownika...', employeeData);

      // Spróbuj dodać przez API
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Pracownik dodany przez API:', result);

        // Przeładuj dane po dodaniu
        await loadRealData();
        console.log('🔄 Dane przeładowane po dodaniu pracownika');
      } else {
        const errorData = await response.json();
        console.log('⚠️ API add failed:', errorData);
        alert(`Błąd podczas dodawania pracownika: ${errorData.message || 'Nieznany błąd'}`);
      }

      setShowAddEmployeeModal(false);

    } catch (error) {
      console.error('❌ Błąd dodawania pracownika:', error);
      alert('Błąd podczas dodawania pracownika');
    }
  };

  const calculateStats = () => {
    // Zabezpieczenie - upewnij się, że to są tablice
    const rezervacjeArray = Array.isArray(filteredRezerwacje) ? filteredRezerwacje : [];
    const usersArray = Array.isArray(users) ? users : [];

    const total = rezervacjeArray.length;
    const pending = rezervacjeArray.filter(r => r.status === 'pending').length;
    const revenue = rezervacjeArray.reduce((sum, r) => sum + (parseFloat(r.price) || 0), 0);
    const completed = rezervacjeArray.filter(r => r.status === 'completed').length;
    const totalUsers = usersArray.length;
    const activeUsers = usersArray.filter(u => u.isActive).length;

    return { total, pending, revenue, completed, totalUsers, activeUsers };
  };

  const stats = calculateStats();

  // Funkcje do formatowania danych kontaktowych
  const formatPhone = (phone) => {
    if (!contactDisplaySettings.showPhone || contactDisplaySettings.phoneFormat === 'hidden') {
      return '***-***-***';
    }
    if (contactDisplaySettings.phoneFormat === 'masked') {
      return phone.substring(0, 6) + '***' + phone.substring(phone.length - 3);
    }
    return phone; // full
  };

  const formatEmail = (email) => {
    if (!contactDisplaySettings.showEmail || contactDisplaySettings.emailFormat === 'hidden') {
      return '***@***.***';
    }
    if (contactDisplaySettings.emailFormat === 'masked') {
      const [username, domain] = email.split('@');
      return username.substring(0, 2) + '***@' + domain;
    }
    return email; // full
  };

  const formatCity = (city) => {
    if (!contactDisplaySettings.showCity || contactDisplaySettings.cityFormat === 'hidden') {
      return '***';
    }
    if (contactDisplaySettings.cityFormat === 'initials') {
      return city.split(' ').map(word => word.charAt(0).toUpperCase()).join('.');
    }
    return city; // full
  };

  // Funkcja do zapisywania ustawień
  const saveContactSettings = () => {
    localStorage.setItem('adminContactSettings', JSON.stringify(contactDisplaySettings));
    setShowSettingsModal(false);
    alert('Ustawienia zostały zapisane!');
  };

  // Ładowanie ustawień przy starcie
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('adminContactSettings');
      if (savedSettings) {
        setContactDisplaySettings(JSON.parse(savedSettings));
      }
    }
  }, []);

  if (!auth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Panel Administratora</h2>
            <p className="text-gray-600">Zaloguj się, aby uzyskać dostęp</p>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Wprowadź hasło"
              onChange={e => setPassword(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && checkLogin()}
            />
            <button
              onClick={checkLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium"
            >
              Zaloguj się
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel Administratora</h1>
              <p className="text-gray-600">Zarządzanie rezerwacjami serwisu</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadRealData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>Odśwież dane</span>
              </button>
              <button
                onClick={() => setAuth(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Wyloguj
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'bookings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Rezerwacje
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Użytkownicy
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'employees'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Pracownicy
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Ustawienia
              </button>
            </nav>
          </div>

          {/* Panel harmonogramów */}
          <div className="mt-4 space-x-4">
            <a
              href="/admin-zgloszenia"
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <FiEye className="h-4 w-4 mr-2" />
              📋 Zgłoszenia serwisowe
            </a>
            <a
              href="/admin-harmonogram"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiCalendar className="h-4 w-4 mr-2" />
              📅 Panel Harmonogramów i Zleceń
            </a>
            <a
              href="/admin-wyglaad"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              🎨 Wygląd strony
            </a>
            <a
              href="/admin-bezpieczenstwo"
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <FiShield className="h-4 w-4 mr-2" />
              🛡️ Bezpieczeństwo
            </a>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {activeTab === 'bookings' ? (
            <>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FiCalendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Wszystkie rezerwacje</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <FiClock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Oczekujące</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FiTrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Zakończone</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FiDollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Przychód</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.revenue} zł</p>
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'users' ? (
            <>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FiUsers className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Wszyscy użytkownicy</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FiUserCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Aktywni</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <FiUserX className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Nieaktywni</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers - stats.activeUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FiUserPlus className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Nowi (ostatnie 30 dni)</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {users.filter(u => {
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return new Date(u.createdAt) > thirtyDaysAgo;
                      }).length}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'employees' ? (
            <>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FiUsers className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Wszyscy pracownicy</p>
                    <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FiUserCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Aktywni</p>
                    <p className="text-2xl font-bold text-gray-900">{employees.filter(e => e.isActive).length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <FiShield className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Specjalizacje</p>
                    <p className="text-2xl font-bold text-gray-900">{specializations.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FiTrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Średnia ocena</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {employees.length > 0
                        ? (employees.reduce((sum, e) => sum + (e.rating || 0), 0) / employees.length).toFixed(1)
                        : '0.0'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FiSettings className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Ustawienia wyświetlania kontaktu</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Wyświetl telefon</span>
                  <button
                    onClick={() => setContactDisplaySettings(prev => ({ ...prev, showPhone: !prev.showPhone }))}
                    className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200"
                    title={contactDisplaySettings.showPhone ? 'Ukryj telefon' : 'Pokaż telefon'}
                  >
                    {contactDisplaySettings.showPhone ? (
                      <FiToggleRight className="h-5 w-5 text-green-600" />
                    ) : (
                      <FiToggleLeft className="h-5 w-5 text-red-600" />
                    )}
                  </button>
                </div>

                {contactDisplaySettings.showPhone && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Format telefonu</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={contactDisplaySettings.phoneFormat}
                      onChange={(e) => setContactDisplaySettings(prev => ({ ...prev, phoneFormat: e.target.value }))}
                    >
                      <option value="full">Pełny</option>
                      <option value="masked">Ukryty</option>
                      <option value="hidden">Ukryty całkowicie</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Wyświetl email</span>
                  <button
                    onClick={() => setContactDisplaySettings(prev => ({ ...prev, showEmail: !prev.showEmail }))}
                    className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200"
                    title={contactDisplaySettings.showEmail ? 'Ukryj email' : 'Pokaż email'}
                  >
                    {contactDisplaySettings.showEmail ? (
                      <FiToggleRight className="h-5 w-5 text-green-600" />
                    ) : (
                      <FiToggleLeft className="h-5 w-5 text-red-600" />
                    )}
                  </button>
                </div>

                {contactDisplaySettings.showEmail && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Format emaila</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={contactDisplaySettings.emailFormat}
                      onChange={(e) => setContactDisplaySettings(prev => ({ ...prev, emailFormat: e.target.value }))}
                    >
                      <option value="full">Pełny</option>
                      <option value="masked">Ukryty</option>
                      <option value="hidden">Ukryty całkowicie</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Wyświetl miasto</span>
                  <button
                    onClick={() => setContactDisplaySettings(prev => ({ ...prev, showCity: !prev.showCity }))}
                    className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200"
                    title={contactDisplaySettings.showCity ? 'Ukryj miasto' : 'Pokaż miasto'}
                  >
                    {contactDisplaySettings.showCity ? (
                      <FiToggleRight className="h-5 w-5 text-green-600" />
                    ) : (
                      <FiToggleLeft className="h-5 w-5 text-red-600" />
                    )}
                  </button>
                </div>

                {contactDisplaySettings.showCity && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Format miasta</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={contactDisplaySettings.cityFormat}
                      onChange={(e) => setContactDisplaySettings(prev => ({ ...prev, cityFormat: e.target.value }))}
                    >
                      <option value="full">Pełny</option>
                      <option value="initials">Inicjały</option>
                      <option value="hidden">Ukryty całkowicie</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Przycisk zapisywania ustawień */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={saveContactSettings}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Zapisz ustawienia
                </button>
              </div>

              {/* Podgląd formatowania */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Podgląd formatowania:</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <FiPhone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Telefon: {formatPhone('+48 123 456 789')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiMail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Email: {formatEmail('jan.kowalski@example.com')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiMapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Miasto: {formatCity('Warszawa')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        {(activeTab === 'bookings' || activeTab === 'users' || activeTab === 'employees') && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
            <div className="flex items-center mb-4">
              <FiFilter className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Filtry</h3>
            </div>

            {activeTab === 'bookings' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data od</label>
                    <input
                      type="date"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data do</label>
                    <input
                      type="date"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria</label>
                    <input
                      type="text"
                      placeholder="Szukaj kategorii..."
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                      <option value="">Wszystkie</option>
                      {bookingStatuses.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setFilters({ dateFrom: '', dateTo: '', category: '', status: '' })}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Wyczyść filtry
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <FiDownload className="h-4 w-4" />
                    Eksport CSV
                  </button>
                </div>
              </>
            )}

            {activeTab === 'users' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Imię i nazwisko</label>
                    <input
                      type="text"
                      placeholder="Szukaj użytkownika..."
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={userFilters.name}
                      onChange={(e) => setUserFilters({ ...userFilters, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="text"
                      placeholder="Szukaj email..."
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={userFilters.email}
                      onChange={(e) => setUserFilters({ ...userFilters, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Miasto</label>
                    <input
                      type="text"
                      placeholder="Szukaj miasto..."
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={userFilters.city}
                      onChange={(e) => setUserFilters({ ...userFilters, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={userFilters.status}
                      onChange={(e) => setUserFilters({ ...userFilters, status: e.target.value })}
                    >
                      <option value="">Wszystkie</option>
                      <option value="active">Aktywni</option>
                      <option value="inactive">Nieaktywni</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setUserFilters({ name: '', email: '', city: '', status: '' })}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Wyczyść filtry
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <FiDownload className="h-4 w-4" />
                    Eksport CSV
                  </button>
                </div>
              </>
            )}

            {activeTab === 'employees' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Imię i nazwisko</label>
                    <input
                      type="text"
                      placeholder="Szukaj pracownika..."
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={employeeFilters.name}
                      onChange={(e) => setEmployeeFilters({ ...employeeFilters, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="text"
                      placeholder="Szukaj email..."
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={employeeFilters.email}
                      onChange={(e) => setEmployeeFilters({ ...employeeFilters, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specjalizacja</label>
                    <input
                      type="text"
                      placeholder="Szukaj specjalizację..."
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={employeeFilters.specialization}
                      onChange={(e) => setEmployeeFilters({ ...employeeFilters, specialization: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={employeeFilters.status}
                      onChange={(e) => setEmployeeFilters({ ...employeeFilters, status: e.target.value })}
                    >
                      <option value="">Wszystkie</option>
                      <option value="active">Aktywni</option>
                      <option value="inactive">Nieaktywni</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setEmployeeFilters({ name: '', email: '', specialization: '', status: '' })}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Wyczyść filtry
                  </button>
                  <button
                    onClick={() => setShowAddEmployeeModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FiUserPlus className="h-4 w-4" />
                    Dodaj pracownika
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <FiDownload className="h-4 w-4" />
                    Eksport CSV
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Table */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Rezerwacje ({filteredRezerwacje.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Klient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontakt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokalizacja</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usługa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cena</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRezerwacje.map((rezerwacja) => (
                    <tr key={rezerwacja.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{new Date(rezerwacja.date).toLocaleDateString()}</div>
                          <div className="text-gray-500">{rezerwacja.selectedTime}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{rezerwacja.name}</div>
                        <div className="text-sm text-gray-500">{rezerwacja.device}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <FiPhone className="h-4 w-4 mr-1" />
                            {formatPhone(rezerwacja.phone)}
                          </div>
                          <div className="flex items-center">
                            <FiMail className="h-4 w-4 mr-1" />
                            {formatEmail(rezerwacja.email)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiMapPin className="h-4 w-4 mr-1" />
                          <div>
                            <div>{formatCity(rezerwacja.city)}</div>
                            <div className="text-xs">{rezerwacja.street}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rezerwacja.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {rezerwacja.price} zł
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(rezerwacja.status)}`}>
                          {getStatusText(rezerwacja.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedBooking(rezerwacja);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setBookingToDelete(rezerwacja);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingBooking(rezerwacja);
                              setEditBookingForm({
                                date: rezerwacja.date.split('T')[0],
                                time: rezerwacja.selectedTime,
                                name: rezerwacja.name,
                                phone: rezerwacja.phone,
                                email: rezerwacja.email,
                                city: rezerwacja.city,
                                street: rezerwacja.street,
                                category: rezerwacja.category,
                                device: rezerwacja.device,
                                description: rezerwacja.description,
                                price: rezerwacja.price,
                                status: rezerwacja.status
                              });
                              setShowEditBookingModal(true);
                            }}
                            className="text-green-600 hover:text-green-900 transition-colors"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Table */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Użytkownicy ({filteredUsers.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Użytkownik</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontakt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokalizacja</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statystyki</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <FiPhone className="h-4 w-4 mr-1" />
                            {formatPhone(user.phone)}
                          </div>
                          <div className="flex items-center">
                            <FiMail className="h-4 w-4 mr-1" />
                            {formatEmail(user.email)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiMapPin className="h-4 w-4 mr-1" />
                          <div>
                            <div>{formatCity(user.city)}</div>
                            <div className="text-xs">{user.address}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {user.isActive ? 'Aktywny' : 'Nieaktywny'}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          Ostatnie logowanie: {new Date(user.lastLogin).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="font-medium">{user.totalBookings} rezerwacji</div>
                          <div className="text-green-600 font-medium">{user.totalSpent} zł wydano</div>
                          <div className="text-xs">Zarejestrowany: {new Date(user.createdAt).toLocaleDateString()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Zobacz szczegóły"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleUserStatus(user.id)}
                            className={`${user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} transition-colors`}
                            title={user.isActive ? 'Dezaktywuj użytkownika' : 'Aktywuj użytkownika'}
                          >
                            {user.isActive ? <FiUserX className="h-4 w-4" /> : <FiUserCheck className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(user);
                              setShowUserDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Usuń użytkownika"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setEditUserForm({
                                firstName: user.firstName,
                                lastName: user.lastName,
                                email: user.email,
                                phone: user.phone,
                                city: user.city,
                                address: user.address,
                                status: user.isActive ? 'active' : 'inactive'
                              });
                              setShowEditUserModal(true);
                            }}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="Edytuj użytkownika"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Employees Table */}
        {activeTab === 'employees' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Pracownicy ({filteredEmployees.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pracownik</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontakt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specjalizacje</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ocena</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wykonane zlecenia</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500">{employee.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contactDisplaySettings.showPhone && employee.phone && (
                            <div className="flex items-center">
                              <FiPhone className="h-4 w-4 text-gray-400 mr-1" />
                              {formatContact(employee.phone, contactDisplaySettings.phoneFormat)}
                            </div>
                          )}
                          {contactDisplaySettings.showEmail && employee.email && (
                            <div className="flex items-center mt-1">
                              <FiMail className="h-4 w-4 text-gray-400 mr-1" />
                              {formatContact(employee.email, contactDisplaySettings.emailFormat)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {employee.specializations && employee.specializations.slice(0, 2).map((spec, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {spec}
                            </span>
                          ))}
                          {employee.specializations && employee.specializations.length > 2 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              +{employee.specializations.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${employee.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {employee.isActive ? 'Aktywny' : 'Nieaktywny'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          ⭐ {employee.rating || '0.0'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.completedJobs || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setShowEmployeeDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Zobacz szczegóły"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEmployeeToDelete(employee);
                              setShowEmployeeDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Usuń pracownika"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingEmployee(employee);
                              setEditEmployeeForm(employee);
                              setShowEditEmployeeModal(true);
                            }}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="Edytuj pracownika"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Szczegóły rezerwacji</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Informacje o kliencie</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium">Imię:</span> {selectedBooking.name}</p>
                      <p><span className="font-medium">Telefon:</span> {selectedBooking.phone}</p>
                      <p><span className="font-medium">Email:</span> {selectedBooking.email}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Lokalizacja</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium">Miasto:</span> {selectedBooking.city}</p>
                      <p><span className="font-medium">Adres:</span> {selectedBooking.street}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Szczegóły usługi</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Kategoria:</span> {selectedBooking.category}</p>
                    <p><span className="font-medium">Urządzenie:</span> {selectedBooking.device}</p>
                    <p><span className="font-medium">Opis problemu:</span> {selectedBooking.description}</p>
                    <p><span className="font-medium">Cena:</span> {selectedBooking.price} zł</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Termin</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Data:</span> {new Date(selectedBooking.date).toLocaleDateString()}</p>
                    <p><span className="font-medium">Godzina:</span> {selectedBooking.selectedTime}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Status</h4>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                    {getStatusText(selectedBooking.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && bookingToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-red-100 rounded-lg mr-4">
                  <FiTrash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Usuń rezerwację</h3>
                  <p className="text-gray-600">Czy na pewno chcesz usunąć tę rezerwację?</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p><span className="font-medium">Klient:</span> {bookingToDelete.name}</p>
                <p><span className="font-medium">Data:</span> {new Date(bookingToDelete.date).toLocaleDateString()}</p>
                <p><span className="font-medium">Usługa:</span> {bookingToDelete.category}</p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => deleteBooking(bookingToDelete.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Usuń
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Szczegóły użytkownika</h3>
                <button
                  onClick={() => setShowUserDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Dane osobowe</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="mb-2"><span className="font-medium">Imię i nazwisko:</span> {selectedUser.firstName} {selectedUser.lastName}</p>
                      <p className="mb-2"><span className="font-medium">ID:</span> {selectedUser.id}</p>
                      <p className="mb-2">
                        <span className="font-medium">Status:</span>
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {selectedUser.isActive ? 'Aktywny' : 'Nieaktywny'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Kontakt</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <FiMail className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{formatEmail(selectedUser.email)}</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <FiPhone className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{formatPhone(selectedUser.phone)}</span>
                      </div>
                      <div className="flex items-start">
                        <FiMapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                        <div>
                          <div>{formatCity(selectedUser.city)}</div>
                          <div className="text-sm text-gray-600">{selectedUser.address}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Statystyki</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{selectedUser.totalBookings}</div>
                        <div className="text-sm text-gray-600">Rezerwacji</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{selectedUser.totalSpent} zł</div>
                        <div className="text-sm text-gray-600">Wydano</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-600">{new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-600">Rejestracja</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-600">{new Date(selectedUser.lastLogin).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-600">Ostatnie logowanie</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => toggleUserStatus(selectedUser.id)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${selectedUser.isActive
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                  {selectedUser.isActive ? 'Dezaktywuj użytkownika' : 'Aktywuj użytkownika'}
                </button>
                <button
                  onClick={() => setShowUserDetailsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Zamknij
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Delete Modal */}
      {showUserDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-red-100 rounded-lg mr-4">
                  <FiTrash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Usuń użytkownika</h3>
                  <p className="text-gray-600">Czy na pewno chcesz usunąć tego użytkownika?</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p><span className="font-medium">Użytkownik:</span> {userToDelete.firstName} {userToDelete.lastName}</p>
                <p><span className="font-medium">Email:</span> {formatEmail(userToDelete.email)}</p>
                <p><span className="font-medium">Rezerwacje:</span> {userToDelete.totalBookings}</p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUserDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => deleteUser(userToDelete.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Usuń
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {showEditBookingModal && editingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edytuj rezerwację</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editBookingForm.date}
                  onChange={(e) => setEditBookingForm({ ...editBookingForm, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Godzina</label>
                <input
                  type="time"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editBookingForm.time}
                  onChange={(e) => setEditBookingForm({ ...editBookingForm, time: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imię i nazwisko</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editBookingForm.name}
                  onChange={(e) => setEditBookingForm({ ...editBookingForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editBookingForm.phone}
                  onChange={(e) => setEditBookingForm({ ...editBookingForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editBookingForm.email}
                  onChange={(e) => setEditBookingForm({ ...editBookingForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Miasto</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editBookingForm.city}
                  onChange={(e) => setEditBookingForm({ ...editBookingForm, city: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ulica i numer</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editBookingForm.street}
                  onChange={(e) => setEditBookingForm({ ...editBookingForm, street: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria usługi</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editBookingForm.category}
                  onChange={(e) => setEditBookingForm({ ...editBookingForm, category: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urządzenie</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editBookingForm.device}
                  onChange={(e) => setEditBookingForm({ ...editBookingForm, device: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opis problemu</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editBookingForm.description}
                  onChange={(e) => setEditBookingForm({ ...editBookingForm, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kiedy klient jest dostępny? 📅</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  value={editBookingForm.availability || ''}
                  onChange={(e) => setEditBookingForm({ ...editBookingForm, availability: e.target.value })}
                  placeholder="np. Jutro po 16:00, w weekend, pon-pt 9-17..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cena</label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editBookingForm.price}
                  onChange={(e) => setEditBookingForm({ ...editBookingForm, price: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editBookingForm.status}
                  onChange={(e) => setEditBookingForm({ ...editBookingForm, status: e.target.value })}
                >
                  {bookingStatuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setShowEditBookingModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={() => {
                  setRezerwacje(prev => prev.map(r => r.id === editingBooking.id ? { ...r, ...editBookingForm } : r));
                  setShowEditBookingModal(false);
                  setEditingBooking(null);
                  setEditBookingForm({});
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Zapisz zmiany
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edytuj użytkownika</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imię</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editUserForm.firstName}
                  onChange={(e) => setEditUserForm({ ...editUserForm, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nazwisko</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editUserForm.lastName}
                  onChange={(e) => setEditUserForm({ ...editUserForm, lastName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editUserForm.phone}
                  onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Miasto</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editUserForm.city}
                  onChange={(e) => setEditUserForm({ ...editUserForm, city: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editUserForm.address}
                  onChange={(e) => setEditUserForm({ ...editUserForm, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editUserForm.status}
                  onChange={(e) => setEditUserForm({ ...editUserForm, status: e.target.value })}
                >
                  {userStatuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setShowEditUserModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={saveUserEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Zapisz zmiany
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Details Modal */}
      {showEmployeeDetailsModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Szczegóły pracownika</h3>
                <button
                  onClick={() => setShowEmployeeDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Informacje podstawowe</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium">ID:</span> {selectedEmployee.id}</p>
                      <p><span className="font-medium">Imię:</span> {selectedEmployee.name}</p>
                      <p><span className="font-medium">Email:</span> {selectedEmployee.email}</p>
                      <p><span className="font-medium">Telefon:</span> {selectedEmployee.phone}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Lokalizacja i praca</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium">Adres:</span> {selectedEmployee.address || 'Nie podano'}</p>
                      <p><span className="font-medium">Godziny pracy:</span> {selectedEmployee.workingHours || 'Nie określono'}</p>
                      <p><span className="font-medium">Doświadczenie:</span> {selectedEmployee.experience || 'Nie podano'}</p>
                      <p><span className="font-medium">Status:</span>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedEmployee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {selectedEmployee.isActive ? 'Aktywny' : 'Nieaktywny'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Specjalizacje</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmployee.specializations && selectedEmployee.specializations.map((spec, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Statystyki</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Ocena</p>
                      <p className="text-2xl font-bold text-gray-900">⭐ {selectedEmployee.rating || '0.0'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Wykonane zlecenia</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedEmployee.completedJobs || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Dodano: {new Date(selectedEmployee.dateAdded || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowEmployeeDetailsModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Zamknij
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Delete Modal */}
      {showEmployeeDeleteModal && employeeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-red-100 rounded-lg mr-4">
                  <FiTrash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Usuń pracownika</h3>
                  <p className="text-gray-600">Czy na pewno chcesz usunąć tego pracownika?</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p><span className="font-medium">Pracownik:</span> {employeeToDelete.name}</p>
                <p><span className="font-medium">Email:</span> {employeeToDelete.email}</p>
                <p><span className="font-medium">Specjalizacje:</span> {(employeeToDelete.specializations || []).join(', ')}</p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEmployeeDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => deleteEmployee(employeeToDelete.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Usuń
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Dodaj nowego pracownika</h3>
                <button
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <AddEmployeeForm
                onSubmit={addEmployee}
                onCancel={() => setShowAddEmployeeModal(false)}
                specializations={specializations}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditEmployeeModal && editingEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Edytuj pracownika</h3>
                <button
                  onClick={() => setShowEditEmployeeModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Imię i nazwisko *</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editEmployeeForm.name || ''}
                      onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, name: e.target.value })}
                      placeholder="Jan Kowalski"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editEmployeeForm.email || ''}
                      onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, email: e.target.value })}
                      placeholder="jan.kowalski@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                    <input
                      type="tel"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editEmployeeForm.phone || ''}
                      onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, phone: e.target.value })}
                      placeholder="+48 123 456 789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editEmployeeForm.address || ''}
                      onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, address: e.target.value })}
                      placeholder="Warszawa"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Godziny pracy</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editEmployeeForm.workingHours || ''}
                      onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, workingHours: e.target.value })}
                      placeholder="8:00-16:00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Doświadczenie</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editEmployeeForm.experience || ''}
                      onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, experience: e.target.value })}
                      placeholder="5 lat"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specjalizacje (oddzielone przecinkami)</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    value={(editEmployeeForm.specializations || []).join(', ')}
                    onChange={(e) => setEditEmployeeForm({
                      ...editEmployeeForm,
                      specializations: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    })}
                    placeholder="Serwis AGD, Naprawa pralek, Instalacje elektryczne"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={editEmployeeForm.isActive || false}
                      onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, isActive: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-gray-700">Pracownik aktywny</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditEmployeeModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={saveEmployeeEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Zapisz zmiany
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add Employee Form Component
function AddEmployeeForm({ onSubmit, onCancel, specializations }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specializations: [],
    address: '',
    workingHours: '',
    experience: '',
    isActive: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('Proszę wypełnić wymagane pola: Imię i telefon');
      return;
    }
    onSubmit(formData);
    setFormData({
      name: '',
      email: '',
      phone: '',
      specializations: [],
      address: '',
      workingHours: '',
      experience: '',
      isActive: true
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Imię i nazwisko *</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Jan Kowalski"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="jan.kowalski@email.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
          <input
            type="tel"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+48 123 456 789"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Warszawa"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Godziny pracy</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.workingHours}
            onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
            placeholder="8:00-16:00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Doświadczenie</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.experience}
            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
            placeholder="5 lat"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Specjalizacje (oddzielone przecinkami)</label>
        <textarea
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="3"
          value={formData.specializations.join(', ')}
          onChange={(e) => setFormData({
            ...formData,
            specializations: e.target.value.split(',').map(s => s.trim()).filter(s => s)
          })}
          placeholder="Serwis AGD, Naprawa pralek, Instalacje elektryczne"
        />
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            className="mr-2"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          />
          <span className="text-sm font-medium text-gray-700">Pracownik aktywny</span>
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Anuluj
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Dodaj pracownika
        </button>
      </div>
    </form>
  );
}