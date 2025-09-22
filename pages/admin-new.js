// pages/admin-new.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiCalendar, FiUsers, FiTrendingUp, FiDownload, FiEye, FiTrash2, FiEdit, FiFilter, FiX, FiPhone, FiMapPin, FiClock, FiDollarSign, FiUserPlus, FiUserCheck, FiUserX, FiMail, FiToggleLeft, FiToggleRight, FiSettings } from 'react-icons/fi';
import { FaCheckCircle } from 'react-icons/fa';
import Link from 'next/link';

export default function AdminNew() {
  const router = useRouter();
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [rezerwacje, setRezerwacje] = useState([]);
  const [filteredRezerwacje, setFilteredRezerwacje] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings', 'users', 'employees', lub 'working-hours'
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
    specialization: '',
    city: '',
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
      totalSpent: 450,
      provider: 'local',
      googleId: null,
      picture: null
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
      totalSpent: 330,
      provider: 'google',
      googleId: 'google_12345',
      picture: 'https://lh3.googleusercontent.com/a/example',
      lastGoogleSync: '2024-01-19T11:15:00'
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
      totalSpent: 80,
      provider: 'local',
      googleId: null,
      picture: null
    }
  ];

  // Symulowane dane pracowników (serwisantów)
  const mockEmployees = [
    {
      id: 1,
      firstName: 'Marek',
      lastName: 'Kowalski',
      email: 'marek.kowalski@techserwis.pl',
      personalEmail: 'marek.kowalski@gmail.com',
      phone: '+48 111 222 333',
      city: 'Warszawa',
      address: 'ul. Techniczna 15',
      specialization: ['Naprawa AGD', 'Elektronika'],
      experience: 5,
      rating: 4.8,
      totalRepairs: 245,
      isActive: true,
      hiredAt: '2019-03-15T09:00:00',
      salary: 4500,
      availability: 'full-time',
      googleId: 'google_emp_123',
      picture: 'https://lh3.googleusercontent.com/a/emp1',
      lastGoogleSync: '2024-01-15T10:30:00',
      googleContactsEnabled: true,
      workingHours: {
        monday: { start: '08:00', end: '16:00', isWorking: true },
        tuesday: { start: '08:00', end: '16:00', isWorking: true },
        wednesday: { start: '08:00', end: '16:00', isWorking: true },
        thursday: { start: '08:00', end: '16:00', isWorking: true },
        friday: { start: '08:00', end: '16:00', isWorking: true },
        saturday: { start: '09:00', end: '13:00', isWorking: true },
        sunday: { start: '', end: '', isWorking: false }
      },
      currentStatus: 'available', // available, busy, break, offline
      lastActivity: '2024-01-15T10:30:00',
      todayHours: 6.5,
      weeklyHours: 42,
      certifications: ['Elektryk', 'Serwis AGD Samsung', 'Serwis AGD Bosch'],
      description: 'Doświadczony serwisant AGD z 5-letnim stażem. Specjalizuje się w naprawach zmywarek i pralek.'
    },
    {
      id: 2,
      firstName: 'Anna',
      lastName: 'Nowak',
      email: 'anna.nowak@techserwis.pl',
      personalEmail: 'anna.nowak@gmail.com',
      phone: '+48 222 333 444',
      city: 'Kraków',
      address: 'ul. Serwisowa 8',
      specialization: ['Elektryk', 'Instalacje'],
      experience: 8,
      rating: 4.9,
      totalRepairs: 389,
      isActive: true,
      hiredAt: '2016-06-01T09:00:00',
      salary: 5200,
      availability: 'full-time',
      googleId: 'google_emp_456',
      picture: 'https://lh3.googleusercontent.com/a/emp2',
      lastGoogleSync: '2024-01-15T11:45:00',
      googleContactsEnabled: true,
      workingHours: {
        monday: { start: '07:00', end: '15:00', isWorking: true },
        tuesday: { start: '07:00', end: '15:00', isWorking: true },
        wednesday: { start: '07:00', end: '15:00', isWorking: true },
        thursday: { start: '07:00', end: '15:00', isWorking: true },
        friday: { start: '07:00', end: '15:00', isWorking: true },
        saturday: { start: '', end: '', isWorking: false },
        sunday: { start: '', end: '', isWorking: false }
      },
      currentStatus: 'busy', // available, busy, break, offline
      lastActivity: '2024-01-15T11:45:00',
      todayHours: 4.75,
      weeklyHours: 40,
      certifications: ['Uprawnienia SEP', 'Elektryk budowlany', 'Instalacje fotowoltaiczne'],
      description: 'Wykwalifikowany elektryk z wieloletnim doświadczeniem w instalacjach elektrycznych.'
    },
    {
      id: 3,
      firstName: 'Piotr',
      lastName: 'Wiśniewski',
      email: 'piotr.wisniewski@techserwis.pl',
      personalEmail: null,
      phone: '+48 333 444 555',
      city: 'Gdańsk',
      address: 'ul. Hydrauliczna 22',
      specialization: ['Hydraulik', 'Instalacje wodne'],
      experience: 3,
      rating: 4.6,
      totalRepairs: 156,
      isActive: true,
      hiredAt: '2021-09-10T09:00:00',
      salary: 3800,
      availability: 'part-time',
      googleId: null,
      picture: null,
      lastGoogleSync: null,
      googleContactsEnabled: false,
      workingHours: {
        monday: { start: '12:00', end: '20:00', isWorking: true },
        tuesday: { start: '12:00', end: '20:00', isWorking: true },
        wednesday: { start: '12:00', end: '20:00', isWorking: true },
        thursday: { start: '', end: '', isWorking: false },
        friday: { start: '12:00', end: '20:00', isWorking: true },
        saturday: { start: '10:00', end: '18:00', isWorking: true },
        sunday: { start: '', end: '', isWorking: false }
      },
      currentStatus: 'break', // available, busy, break, offline
      lastActivity: '2024-01-15T09:15:00',
      todayHours: 3.25,
      weeklyHours: 32,
      certifications: ['Instalator wodociągów', 'Instalator kanalizacji'],
      description: 'Młody i energiczny hydraulik, specjalizuje się w naprawach instalacji wodnych.'
    },
    {
      id: 4,
      firstName: 'Katarzyna',
      lastName: 'Lewandowska',
      email: 'katarzyna.lewandowska@techserwis.pl',
      personalEmail: 'katarzyna.lewandowska@gmail.com',
      phone: '+48 444 555 666',
      city: 'Wrocław',
      address: 'ul. Złota Rączka 5',
      specialization: ['Złota rączka', 'Montaż mebli'],
      experience: 2,
      rating: 4.7,
      totalRepairs: 98,
      isActive: true,
      hiredAt: '2022-11-20T09:00:00',
      salary: 3200,
      availability: 'part-time',
      googleId: 'google_emp_789',
      picture: 'https://lh3.googleusercontent.com/a/emp4',
      lastGoogleSync: '2024-01-15T08:30:00',
      googleContactsEnabled: true,
      workingHours: {
        monday: { start: '09:00', end: '13:00', isWorking: true },
        tuesday: { start: '09:00', end: '13:00', isWorking: true },
        wednesday: { start: '09:00', end: '13:00', isWorking: true },
        thursday: { start: '09:00', end: '13:00', isWorking: true },
        friday: { start: '09:00', end: '13:00', isWorking: true },
        saturday: { start: '', end: '', isWorking: false },
        sunday: { start: '', end: '', isWorking: false }
      },
      currentStatus: 'available', // available, busy, break, offline
      lastActivity: '2024-01-15T08:30:00',
      todayHours: 2.0,
      weeklyHours: 20,
      certifications: ['Montaż mebli IKEA', 'Drobne naprawy domowe'],
      description: 'Precyzyjna w wykonywaniu montażu mebli i drobnych napraw domowych.'
    },
    {
      id: 5,
      firstName: 'Tomasz',
      lastName: 'Zieliński',
      email: 'tomasz.zielinski@techserwis.pl',
      personalEmail: null,
      phone: '+48 555 666 777',
      city: 'Poznań',
      address: 'ul. Gasowa 12',
      specialization: ['Instalacje gazowe', 'Kuchenki gazowe'],
      experience: 12,
      rating: 4.9,
      totalRepairs: 567,
      isActive: false,
      hiredAt: '2012-02-01T09:00:00',
      salary: 6000,
      availability: 'full-time',
      googleId: null,
      picture: null,
      lastGoogleSync: null,
      googleContactsEnabled: false,
      workingHours: {
        monday: { start: '', end: '', isWorking: false },
        tuesday: { start: '', end: '', isWorking: false },
        wednesday: { start: '', end: '', isWorking: false },
        thursday: { start: '', end: '', isWorking: false },
        friday: { start: '', end: '', isWorking: false },
        saturday: { start: '', end: '', isWorking: false },
        sunday: { start: '', end: '', isWorking: false }
      },
      currentStatus: 'offline', // available, busy, break, offline
      lastActivity: '2023-12-20T16:00:00',
      todayHours: 0,
      weeklyHours: 0,
      certifications: ['Uprawnienia gazowe G1', 'Uprawnienia gazowe G2', 'Serwis Junkers'],
      description: 'Bardzo doświadczony specjalista od instalacji gazowych. Obecnie na urlopie zdrowotnym.'
    }
  ];

  // Sprawdź istniejącą sesję administratora przy ładowaniu strony
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminSession = localStorage.getItem('adminSession');
      if (adminSession) {
        setAuth(true);
      }
    }
  }, []);

  useEffect(() => {
    if (auth) {
      setRezerwacje(mockData);
      setFilteredRezerwacje(mockData);
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);

      // Zaktualizuj dane pracowników z obliczonymi godzinami
      const updatedEmployees = mockEmployees.map(emp => ({
        ...emp,
        todayHours: calculateTodayHours(emp),
        weeklyHours: calculateWeeklyHours(emp)
      }));

      setEmployees(updatedEmployees);
      setFilteredEmployees(updatedEmployees);
    }
  }, [auth]);

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
    if (password === 'admin123') {
      setAuth(true);
      // Zapisz sesję administratora do localStorage
      localStorage.setItem('adminSession', JSON.stringify({
        id: 'admin',
        role: 'administrator',
        loginTime: new Date().toISOString()
      }));
    } else {
      alert('Błędne hasło');
    }
  };

  const applyFilters = () => {
    let filtered = [...rezerwacje];

    if (filters.dateFrom) {
      filtered = filtered.filter(r => new Date(r.date) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(r => new Date(r.date) <= new Date(filters.dateTo));
    }
    if (filters.category) {
      filtered = filtered.filter(r => r.category.toLowerCase().includes(filters.category.toLowerCase()));
    }
    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    setFilteredRezerwacje(filtered);
  };

  const applyUserFilters = () => {
    let filtered = [...users];

    if (userFilters.name) {
      filtered = filtered.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(userFilters.name.toLowerCase())
      );
    }
    if (userFilters.email) {
      filtered = filtered.filter(u => u.email.toLowerCase().includes(userFilters.email.toLowerCase()));
    }
    if (userFilters.city) {
      filtered = filtered.filter(u => u.city.toLowerCase().includes(userFilters.city.toLowerCase()));
    }
    if (userFilters.status) {
      filtered = filtered.filter(u => userFilters.status === 'active' ? u.isActive : !u.isActive);
    }

    setFilteredUsers(filtered);
  };

  const applyEmployeeFilters = () => {
    let filtered = [...employees];

    if (employeeFilters.name) {
      filtered = filtered.filter(e =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(employeeFilters.name.toLowerCase())
      );
    }
    if (employeeFilters.specialization) {
      filtered = filtered.filter(e =>
        e.specialization.some(spec =>
          spec.toLowerCase().includes(employeeFilters.specialization.toLowerCase())
        )
      );
    }
    if (employeeFilters.city) {
      filtered = filtered.filter(e => e.city.toLowerCase().includes(employeeFilters.city.toLowerCase()));
    }
    if (employeeFilters.status) {
      filtered = filtered.filter(e => employeeFilters.status === 'active' ? e.isActive : !e.isActive);
    }

    setFilteredEmployees(filtered);
  };

  const exportToCSV = () => {
    if (activeTab === 'bookings') {
      const headers = ['Data', 'Imię', 'Telefon', 'Email', 'Miasto', 'Adres', 'Usługa', 'Urządzenie', 'Cena', 'Status'];
      const csvContent = [
        headers.join(','),
        ...filteredRezerwacje.map(r => [
          new Date(r.date).toLocaleString(),
          r.name,
          r.phone,
          r.email,
          r.city,
          r.street,
          r.category,
          r.device,
          r.price + ' zł',
          r.status
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
          u.email,
          u.phone,
          u.city,
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
    } else {
      const headers = ['Imię', 'Nazwisko', 'Email', 'Telefon', 'Miasto', 'Specjalizacja', 'Doświadczenie', 'Ocena', 'Naprawy', 'Status', 'Zatrudniony', 'Pensja'];
      const csvContent = [
        headers.join(','),
        ...filteredEmployees.map(e => [
          e.firstName,
          e.lastName,
          e.email,
          e.phone,
          e.city,
          e.specialization.join('; '),
          e.experience + ' lat',
          e.rating,
          e.totalRepairs,
          e.isActive ? 'Aktywny' : 'Nieaktywny',
          new Date(e.hiredAt).toLocaleDateString(),
          e.salary + ' zł'
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

  const deleteBooking = (id) => {
    setRezerwacje(prev => prev.filter(r => r.id !== id));
    setShowDeleteModal(false);
    setBookingToDelete(null);
  };

  const deleteUser = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    setShowUserDeleteModal(false);
    setUserToDelete(null);
  };

  const toggleUserStatus = (id) => {
    setUsers(prev => prev.map(u =>
      u.id === id ? { ...u, isActive: !u.isActive } : u
    ));
  };

  const deleteEmployee = (id) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    setShowEmployeeDeleteModal(false);
    setEmployeeToDelete(null);
  };

  const toggleEmployeeStatus = (id) => {
    setEmployees(prev => prev.map(e =>
      e.id === id ? { ...e, isActive: !e.isActive } : e
    ));
  };

  const calculateStats = () => {
    const total = filteredRezerwacje.length;
    const pending = filteredRezerwacje.filter(r => r.status === 'pending').length;
    const revenue = filteredRezerwacje.reduce((sum, r) => sum + (r.price || 0), 0);
    const completed = filteredRezerwacje.filter(r => r.status === 'completed').length;
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.isActive).length;

    return { total, pending, revenue, completed, totalUsers, activeUsers, totalEmployees, activeEmployees };
  };

  const stats = calculateStats();

  // Funkcja do obliczania rzeczywistych godzin dziennych
  const calculateTodayHours = (employee) => {
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[today.getDay()];

    const daySchedule = employee.workingHours[currentDay];
    if (!daySchedule || !daySchedule.isWorking) {
      return 0;
    }

    // Oblicz różnicę między start i end
    const [startHour, startMinute] = daySchedule.start.split(':').map(Number);
    const [endHour, endMinute] = daySchedule.end.split(':').map(Number);

    const startTime = startHour + startMinute / 60;
    const endTime = endHour + endMinute / 60;

    const workingHours = endTime - startTime;

    // Jeśli pracownik jest obecnie w pracy, oblicz rzeczywiste przepracowane godziny
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    const currentTime = currentHour + currentMinute / 60;

    // Sprawdź czy obecna godzina jest w przedziale pracy
    if (currentTime >= startTime && currentTime <= endTime) {
      // Pracownik jest obecnie w pracy - oblicz ile już przepracował
      const workedSoFar = currentTime - startTime;
      return Math.round(workedSoFar * 4) / 4; // Zaokrąglij do 15 minut
    } else if (currentTime > endTime) {
      // Pracownik skończył pracę - zwróć pełne godziny
      return workingHours;
    } else {
      // Pracownik jeszcze nie zaczął pracy
      return 0;
    }
  };

  // Funkcja do obliczania godzin tygodniowych
  const calculateWeeklyHours = (employee) => {
    let totalHours = 0;
    Object.keys(employee.workingHours).forEach(day => {
      const daySchedule = employee.workingHours[day];
      if (daySchedule.isWorking) {
        const [startHour, startMinute] = daySchedule.start.split(':').map(Number);
        const [endHour, endMinute] = daySchedule.end.split(':').map(Number);
        const startTime = startHour + startMinute / 60;
        const endTime = endHour + endMinute / 60;
        totalHours += endTime - startTime;
      }
    });
    return totalHours;
  };

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
              <p className="text-gray-600">Zarządzanie rezerwacjami i użytkownikami</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin-wyglaad"
                className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <FiSettings className="mr-2 h-4 w-4" />
                Wygląd strony
              </Link>
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
                onClick={() => setActiveTab('working-hours')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'working-hours'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Godziny pracy
              </button>
              <button
                onClick={() => router.push('/zgloszenia-admin')}
                className="py-2 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Zgłoszenia
              </button>
            </nav>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {activeTab === 'working-hours' ? (
            <>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FiUserCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Obecnie w pracy</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {employees.filter(e => e.currentStatus === 'available' || e.currentStatus === 'busy').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <FiClock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Na przerwie</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {employees.filter(e => e.currentStatus === 'break').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <FiUserX className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Offline</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {employees.filter(e => e.currentStatus === 'offline').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FiTrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Średnie godziny/tydzień</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {employees.length > 0 ? Math.round(employees.reduce((sum, e) => sum + e.weeklyHours, 0) / employees.length) : 0}h
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'bookings' ? (
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
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FiUsers className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Wszyscy pracownicy</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{stats.activeEmployees}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees - stats.activeEmployees}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FiTrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Średnia ocena</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {employees.length > 0 ? (employees.reduce((sum, e) => sum + e.rating, 0) / employees.length).toFixed(1) : '0'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Filters */}
        {activeTab !== 'working-hours' && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
            <div className="flex items-center mb-4">
              <FiFilter className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Filtry {activeTab === 'bookings' ? 'rezerwacji' : activeTab === 'users' ? 'użytkowników' : 'pracowników'}
              </h3>
            </div>

            {activeTab === 'bookings' ? (
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
                    <option value="pending">Oczekujące</option>
                    <option value="confirmed">Potwierdzone</option>
                    <option value="completed">Zakończone</option>
                    <option value="cancelled">Anulowane</option>
                  </select>
                </div>
              </div>
            ) : activeTab === 'users' ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imię i nazwisko</label>
                  <input
                    type="text"
                    placeholder="Szukaj po imieniu..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={userFilters.name}
                    onChange={(e) => setUserFilters({ ...userFilters, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="text"
                    placeholder="Szukaj po email..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={userFilters.email}
                    onChange={(e) => setUserFilters({ ...userFilters, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Miasto</label>
                  <input
                    type="text"
                    placeholder="Szukaj po mieście..."
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imię i nazwisko</label>
                  <input
                    type="text"
                    placeholder="Szukaj po imieniu..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={employeeFilters.name}
                    onChange={(e) => setEmployeeFilters({ ...employeeFilters, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specjalizacja</label>
                  <input
                    type="text"
                    placeholder="Szukaj specjalizacji..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={employeeFilters.specialization}
                    onChange={(e) => setEmployeeFilters({ ...employeeFilters, specialization: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Miasto</label>
                  <input
                    type="text"
                    placeholder="Szukaj po mieście..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={employeeFilters.city}
                    onChange={(e) => setEmployeeFilters({ ...employeeFilters, city: e.target.value })}
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
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  if (activeTab === 'bookings') {
                    setFilters({ dateFrom: '', dateTo: '', category: '', status: '' });
                  } else if (activeTab === 'users') {
                    setUserFilters({ name: '', email: '', city: '', status: '' });
                  } else {
                    setEmployeeFilters({ name: '', specialization: '', city: '', status: '' });
                  }
                }}
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
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {activeTab === 'bookings'
                ? `Rezerwacje (${filteredRezerwacje.length})`
                : activeTab === 'users'
                  ? `Użytkownicy (${filteredUsers.length})`
                  : activeTab === 'employees'
                    ? `Pracownicy (${filteredEmployees.length})`
                    : `Godziny pracy pracowników (${employees.filter(e => e.isActive).length})`
              }
            </h3>
          </div>
          <div className="overflow-x-auto">
            {activeTab === 'bookings' ? (
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
                        <div className="flex items-center">
                          <FiPhone className="h-4 w-4 mr-1" />
                          {rezerwacja.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiMapPin className="h-4 w-4 mr-1" />
                          <div>
                            <div>{rezerwacja.city}</div>
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : activeTab === 'users' ? (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Użytkownik</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontakt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokalizacja</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rejestracja</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statystyki</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{`${user.firstName} ${user.lastName}`}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiPhone className="h-4 w-4 mr-1" />
                          {user.phone}
                        </div>
                        <div className="flex items-center mt-1">
                          <FiMail className="h-4 w-4 mr-1" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiMapPin className="h-4 w-4 mr-1" />
                          <div>
                            <div>{user.city}</div>
                            <div className="text-xs">{user.address}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs">Ostatnie: {new Date(user.lastLogin).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>Rezerwacje: {user.totalBookings}</div>
                        <div>Wydano: {user.totalSpent} zł</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${user.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                            } transition-colors`}
                        >
                          {user.isActive ? <FiToggleRight className="h-4 w-4 mr-1" /> : <FiToggleLeft className="h-4 w-4 mr-1" />}
                          {user.isActive ? 'Aktywny' : 'Nieaktywny'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(user);
                              setShowUserDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pracownik</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontakt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specjalizacja</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doświadczenie</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ocena</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{`${employee.firstName} ${employee.lastName}`}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiPhone className="h-4 w-4 mr-1" />
                          {employee.phone}
                        </div>
                        <div className="flex items-center mt-1">
                          <FiMapPin className="h-4 w-4 mr-1" />
                          {employee.city}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {employee.specialization.slice(0, 2).map((spec, index) => (
                            <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {spec}
                            </span>
                          ))}
                          {employee.specialization.length > 2 && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              +{employee.specialization.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{employee.experience} lat</div>
                        <div className="text-xs">Naprawy: {employee.totalRepairs}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="text-yellow-400">⭐</span>
                          <span className="ml-1 font-medium">{employee.rating}</span>
                        </div>
                        <div className="text-xs">{employee.availability}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleEmployeeStatus(employee.id)}
                          className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${employee.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                            } transition-colors`}
                        >
                          {employee.isActive ? <FiToggleRight className="h-4 w-4 mr-1" /> : <FiToggleLeft className="h-4 w-4 mr-1" />}
                          {employee.isActive ? 'Aktywny' : 'Nieaktywny'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setShowEmployeeDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEmployeeToDelete(employee);
                              setShowEmployeeDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sekcja godzin pracy */}
        {activeTab === 'working-hours' && (
          <div className="space-y-6">
            {employees.filter(emp => emp.isActive).map((employee) => (
              <div key={employee.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {employee.specialization.join(', ')} • {employee.city}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Status:</p>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${employee.currentStatus === 'available' ? 'bg-green-100 text-green-800' :
                          employee.currentStatus === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                            employee.currentStatus === 'break' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                          }`}>
                          {employee.currentStatus === 'available' ? 'Dostępny' :
                            employee.currentStatus === 'busy' ? 'Zajęty' :
                              employee.currentStatus === 'break' ? 'Przerwa' :
                                'Offline'}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Dziś:</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-lg font-bold text-gray-900">{employee.todayHours}h</p>
                          {(() => {
                            const today = new Date();
                            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                            const currentDay = dayNames[today.getDay()];
                            const daySchedule = employee.workingHours[currentDay];

                            if (!daySchedule || !daySchedule.isWorking) {
                              return <span className="text-xs text-gray-500">(nie pracuje)</span>;
                            }

                            const [startHour, startMinute] = daySchedule.start.split(':').map(Number);
                            const [endHour, endMinute] = daySchedule.end.split(':').map(Number);
                            const currentHour = today.getHours();
                            const currentMinute = today.getMinutes();
                            const currentTime = currentHour + currentMinute / 60;
                            const startTime = startHour + startMinute / 60;
                            const endTime = endHour + endMinute / 60;

                            if (currentTime >= startTime && currentTime <= endTime) {
                              return <span className="text-xs text-green-600 font-medium">(w pracy)</span>;
                            } else if (currentTime > endTime) {
                              return <span className="text-xs text-blue-600">(po pracy)</span>;
                            } else {
                              return <span className="text-xs text-orange-600">(przed pracą)</span>;
                            }
                          })()}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Tydzień:</p>
                        <p className="text-lg font-bold text-gray-900">{employee.weeklyHours}h</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Plan tygodniowy:</h4>
                  <div className="grid grid-cols-7 gap-4">
                    {Object.entries({
                      monday: 'Poniedziałek',
                      tuesday: 'Wtorek',
                      wednesday: 'Środa',
                      thursday: 'Czwartek',
                      friday: 'Piątek',
                      saturday: 'Sobota',
                      sunday: 'Niedziela'
                    }).map(([day, dayName]) => {
                      const daySchedule = employee.workingHours[day];
                      return (
                        <div key={day} className="text-center">
                          <div className="text-xs font-medium text-gray-600 mb-2">
                            {dayName}
                          </div>
                          <div className={`p-3 rounded-lg border-2 ${daySchedule.isWorking
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                            }`}>
                            {daySchedule.isWorking ? (
                              <div className="space-y-1">
                                <div className="text-sm font-semibold text-green-800">
                                  {daySchedule.start}
                                </div>
                                <div className="text-xs text-gray-600">-</div>
                                <div className="text-sm font-semibold text-green-800">
                                  {daySchedule.end}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">
                                Wolne
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
                    <div>
                      Ostatnia aktywność: {new Date(employee.lastActivity).toLocaleString()}
                    </div>
                    <div>
                      Typ umowy: <span className="font-medium">{employee.availability === 'full-time' ? 'Pełny etat' : 'Część etatu'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal szczegółów rezerwacji */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-90vh overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Szczegóły rezerwacji</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Data i godzina</p>
                  <p className="font-medium">{new Date(selectedBooking.date).toLocaleDateString()} {selectedBooking.selectedTime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                    {getStatusText(selectedBooking.status)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Klient</p>
                  <p className="font-medium">{selectedBooking.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Telefon</p>
                  <p className="font-medium">{selectedBooking.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{selectedBooking.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cena</p>
                  <p className="font-medium">{selectedBooking.price} zł</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Adres</p>
                <p className="font-medium">{selectedBooking.city}, {selectedBooking.street}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Kategoria usługi</p>
                <p className="font-medium">{selectedBooking.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Urządzenie</p>
                <p className="font-medium">{selectedBooking.device}</p>
              </div>
              {selectedBooking.description && (
                <div>
                  <p className="text-sm text-gray-600">Opis problemu</p>
                  <p className="font-medium">{selectedBooking.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal usuwania rezerwacji */}
      {showDeleteModal && bookingToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Usuń rezerwację</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Czy na pewno chcesz usunąć rezerwację dla <strong>{bookingToDelete.name}</strong> z dnia <strong>{new Date(bookingToDelete.date).toLocaleDateString()}</strong>?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
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
      )}

      {/* Modal szczegółów użytkownika */}
      {showUserDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-90vh overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Szczegóły użytkownika</h3>
              <button
                onClick={() => setShowUserDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Profil użytkownika z informacją o Google */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                {selectedUser.picture ? (
                  <img
                    src={selectedUser.picture}
                    alt="Profil"
                    className="w-16 h-16 rounded-full"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                    <FiUsers className="w-8 h-8 text-gray-600" />
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-lg">{selectedUser.firstName} {selectedUser.lastName}</h4>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <div className="flex items-center mt-1">
                    {selectedUser.provider === 'google' ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        <FaCheckCircle className="w-3 h-3 mr-1" />
                        Google
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        Lokalne konto
                      </span>
                    )}
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedUser.isActive ? 'Aktywny' : 'Nieaktywny'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Telefon</p>
                  <p className="font-medium">{selectedUser.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Miasto</p>
                  <p className="font-medium">{selectedUser.city}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Data rejestracji</p>
                  <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ostatnie logowanie</p>
                  <p className="font-medium">{new Date(selectedUser.lastLogin).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Łączne wydatki</p>
                  <p className="font-medium">{selectedUser.totalSpent} zł</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Liczba rezerwacji</p>
                  <p className="font-medium">{selectedUser.totalBookings}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Adres</p>
                <p className="font-medium">{selectedUser.address}</p>
              </div>

              {/* Google-specific information */}
              {selectedUser.provider === 'google' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-semibold text-green-900 mb-2">Informacje Google</h5>
                  <div className="text-sm text-green-800 space-y-1">
                    <p><strong>Google ID:</strong> {selectedUser.googleId}</p>
                    {selectedUser.lastGoogleSync && (
                      <p><strong>Ostatnia synchronizacja:</strong> {new Date(selectedUser.lastGoogleSync).toLocaleString()}</p>
                    )}
                    <p><strong>Weryfikacja:</strong> {selectedUser.verified ? '✅ Zweryfikowany' : '❌ Niezweryfikowany'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal usuwania użytkownika */}
      {showUserDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Usuń użytkownika</h3>
              <button
                onClick={() => setShowUserDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Czy na pewno chcesz usunąć użytkownika <strong>{userToDelete.firstName} {userToDelete.lastName}</strong>?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowUserDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
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
      )}

      {/* Modal szczegółów pracownika */}
      {showEmployeeDetailsModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-3xl max-h-90vh overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Szczegóły pracownika</h3>
              <button
                onClick={() => setShowEmployeeDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-6">
              {/* Profil pracownika z informacją o Google */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                {selectedEmployee.picture ? (
                  <img
                    src={selectedEmployee.picture}
                    alt="Profil pracownika"
                    className="w-16 h-16 rounded-full"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                    <FiUsers className="w-8 h-8 text-gray-600" />
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-lg">{selectedEmployee.firstName} {selectedEmployee.lastName}</h4>
                  <p className="text-gray-600">{selectedEmployee.email}</p>
                  {selectedEmployee.personalEmail && (
                    <p className="text-sm text-gray-500">Prywatny: {selectedEmployee.personalEmail}</p>
                  )}
                  <div className="flex items-center mt-1 space-x-2">
                    {selectedEmployee.googleContactsEnabled ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        <FaCheckCircle className="w-3 h-3 mr-1" />
                        Google sync
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        Brak sync
                      </span>
                    )}
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedEmployee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedEmployee.isActive ? 'Aktywny' : 'Nieaktywny'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Telefon</p>
                  <p className="font-medium">{selectedEmployee.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Miasto</p>
                  <p className="font-medium">{selectedEmployee.city}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Doświadczenie</p>
                  <p className="font-medium">{selectedEmployee.experience} lat</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ocena</p>
                  <div className="flex items-center">
                    <span className="text-yellow-400">⭐</span>
                    <span className="ml-1 font-medium">{selectedEmployee.rating}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Liczba napraw</p>
                  <p className="font-medium">{selectedEmployee.totalRepairs}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Data zatrudnienia</p>
                  <p className="font-medium">{new Date(selectedEmployee.hiredAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pensja</p>
                  <p className="font-medium">{selectedEmployee.salary} zł</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dostępność</p>
                  <p className="font-medium">{selectedEmployee.availability}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Adres</p>
                <p className="font-medium">{selectedEmployee.address}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Specjalizacje</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedEmployee.specialization.map((spec, index) => (
                    <span key={index} className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Certyfikaty</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedEmployee.certifications.map((cert, index) => (
                    <span key={index} className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              {/* Google-specific information for employees */}
              {selectedEmployee.googleContactsEnabled && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-semibold text-green-900 mb-2">Integracja Google</h5>
                  <div className="text-sm text-green-800 space-y-1">
                    {selectedEmployee.googleId && <p><strong>Google ID:</strong> {selectedEmployee.googleId}</p>}
                    {selectedEmployee.personalEmail && <p><strong>Prywatny email:</strong> {selectedEmployee.personalEmail}</p>}
                    {selectedEmployee.lastGoogleSync && (
                      <p><strong>Ostatnia synchronizacja:</strong> {new Date(selectedEmployee.lastGoogleSync).toLocaleString()}</p>
                    )}
                    <p><strong>Status sync:</strong> ✅ Kontakty Google synchronizowane</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Opis</p>
                <p className="font-medium">{selectedEmployee.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal usuwania pracownika */}
      {showEmployeeDeleteModal && employeeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Usuń pracownika</h3>
              <button
                onClick={() => setShowEmployeeDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Czy na pewno chcesz usunąć pracownika <strong>{employeeToDelete.firstName} {employeeToDelete.lastName}</strong>?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowEmployeeDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
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
      )}
    </div>
  );
}
