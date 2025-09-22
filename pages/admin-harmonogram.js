// pages/admin-harmonogram.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dataManager from '../utils/dataManager';
import TimelineView from '../components/TimelineView';
import {
    FiCalendar,
    FiClock,
    FiUsers,
    FiPlus,
    FiEdit,
    FiTrash2,
    FiEye,
    FiSave,
    FiX,
    FiFilter,
    FiRefreshCw,
    FiUser,
    FiPhone,
    FiTool,
    FiCheck,
    FiAlertCircle,
    FiChevronLeft,
    FiChevronRight,
    FiMove
} from 'react-icons/fi';

export default function AdminHarmonogram() {
    const [employees, setEmployees] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [timelineView, setTimelineView] = useState('day'); // 'day', 'week'
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [schedules, setSchedules] = useState({});
    const [bookings, setBookings] = useState({});
    const [showAddBookingModal, setShowAddBookingModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newBooking, setNewBooking] = useState({
        employeeId: '',
        clientName: '',
        clientPhone: '',
        serviceType: '',
        description: '',
        scheduledDate: '',
        scheduledTime: '',
        estimatedDuration: 60,
        status: 'scheduled',
        deviceType: '',
        postalCode: '',
        city: '',
        street: '',
        houseNumber: ''
    });
    const [editingBooking, setEditingBooking] = useState(null);
    const [message, setMessage] = useState('');

    // Drag and Drop state
    const [draggedBooking, setDraggedBooking] = useState(null);
    const [dragOverSlot, setDragOverSlot] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const router = useRouter();

    // Przykładowi pracownicy (w rzeczywistości z DataManager)
    const mockEmployees = [
        {
            id: 'emp_001',
            firstName: 'Jan',
            lastName: 'Kowalski',
            specialization: ['Mechanika', 'Elektryka'],
            isActive: true
        },
        {
            id: 'emp_002',
            firstName: 'Anna',
            lastName: 'Nowak',
            specialization: ['Diagnostyka', 'Lakiernictwo'],
            isActive: true
        },
        {
            id: 'emp_003',
            firstName: 'Piotr',
            lastName: 'Wiśniewski',
            specialization: ['Elektronika', 'Klimatyzacja'],
            isActive: true
        }
    ];

    // Godziny pracy (8:00 - 18:00)
    const workingHours = [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
        '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
        '17:00', '17:30', '18:00'
    ];

    const handleAddBookingFromTimeline = (employeeId, time) => {
        setNewBooking(prev => ({
            ...prev,
            employeeId: employeeId,
            scheduledTime: time
        }));
        setShowAddBookingModal(true);
    };

    const handleEditBookingFromTimeline = (booking) => {
        setEditingBooking(booking);
        setShowEditModal(true);
    };

    const navigateDate = (direction) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + direction);
        setSelectedDate(newDate);
    };

    useEffect(() => {
        loadData();
    }, [selectedDate]);

    const loadData = async () => {
        try {
            // Załaduj pracowników
            setEmployees(mockEmployees);

            // Załaduj harmonogramy dla każdego pracownika
            const schedulesData = {};
            const bookingsData = {};

            for (const emp of mockEmployees) {
                try {
                    const empSchedules = await dataManager.getEmployeeSchedules(emp.id);
                    const empBookings = await dataManager.getEmployeeBookings(
                        emp.id,
                        selectedDate.toISOString().split('T')[0],
                        selectedDate.toISOString().split('T')[0]
                    );

                    schedulesData[emp.id] = empSchedules;
                    bookingsData[emp.id] = empBookings || [];
                } catch (error) {
                    console.log(`Brak danych dla pracownika ${emp.id}`);
                    schedulesData[emp.id] = [];
                    bookingsData[emp.id] = [];
                }
            }

            // Dodaj przykładowe harmonogramy jeśli brak danych
            for (const emp of mockEmployees) {
                if (!schedulesData[emp.id] || schedulesData[emp.id].length === 0) {
                    schedulesData[emp.id] = [{
                        id: `sch_${emp.id}`,
                        employeeId: emp.id,
                        type: 'weekly',
                        isActive: true,
                        data: {
                            quickSchedule: {
                                mondayToFriday: { working: true, start: '08:00', end: '16:00', break: '12:00-13:00' },
                                saturday: { working: false, start: '09:00', end: '14:00', break: '' },
                                sunday: { working: false, start: '10:00', end: '14:00', break: '' }
                            }
                        }
                    }];
                }
            }

            // Dodaj przykładowe rezerwacje
            const today = selectedDate.toISOString().split('T')[0];
            if (today === new Date().toISOString().split('T')[0]) {
                if (!bookingsData['emp_001'] || bookingsData['emp_001'].length === 0) {
                    bookingsData['emp_001'] = [
                        {
                            id: 'book_001',
                            employeeId: 'emp_001',
                            clientName: 'Anna Kowalska',
                            clientPhone: '+48 123 456 789',
                            serviceType: 'Przegląd',
                            description: 'Przegląd okresowy pralki automatycznej',
                            deviceType: 'pralka',
                            postalCode: '00-001',
                            city: 'Warszawa',
                            street: 'Marszałkowska',
                            houseNumber: '15/3',
                            scheduledDate: today,
                            scheduledTime: '09:00',
                            estimatedDuration: 120,
                            status: 'scheduled'
                        },
                        {
                            id: 'book_002',
                            employeeId: 'emp_001',
                            clientName: 'Piotr Nowak',
                            clientPhone: '+48 987 654 321',
                            serviceType: 'Naprawa',
                            description: 'Naprawa silnika zmywarki - dziwne dźwięki',
                            deviceType: 'zmywarka',
                            postalCode: '02-123',
                            city: 'Warszawa',
                            street: 'Puławska',
                            houseNumber: '142/7',
                            scheduledDate: today,
                            scheduledTime: '14:00',
                            estimatedDuration: 90,
                            status: 'confirmed'
                        }
                    ];
                }

                if (!bookingsData['emp_002'] || bookingsData['emp_002'].length === 0) {
                    bookingsData['emp_002'] = [
                        {
                            id: 'book_003',
                            employeeId: 'emp_002',
                            clientName: 'Maria Zielińska',
                            clientPhone: '+48 555 666 777',
                            serviceType: 'Diagnostyka',
                            description: 'Diagnostyka lodówki - nie chłodzi',
                            deviceType: 'lodowka',
                            postalCode: '03-456',
                            city: 'Warszawa',
                            street: 'Grochowska',
                            houseNumber: '278',
                            scheduledDate: today,
                            scheduledTime: '10:00',
                            estimatedDuration: 60,
                            status: 'in_progress'
                        }
                    ];
                }
            }

            setSchedules(schedulesData);
            setBookings(bookingsData);

        } catch (error) {
            console.error('Błąd ładowania danych:', error);
        }
    };

    const handleAddBooking = async () => {
        try {
            const bookingData = {
                ...newBooking,
                id: `book_${Date.now()}`,
                scheduledDate: selectedDate.toISOString().split('T')[0]
            };

            const result = await dataManager.saveBooking(bookingData);

            if (result.success) {
                setMessage('✅ Zlecenie dodane pomyślnie!');
                setShowAddBookingModal(false);
                setNewBooking({
                    employeeId: '',
                    clientName: '',
                    clientPhone: '',
                    serviceType: '',
                    description: '',
                    scheduledDate: '',
                    scheduledTime: '',
                    estimatedDuration: 60,
                    status: 'scheduled',
                    deviceType: '',
                    postalCode: '',
                    city: '',
                    street: '',
                    houseNumber: ''
                });
                loadData();
            } else {
                setMessage('❌ Błąd dodawania zlecenia');
            }

            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Błąd dodawania zlecenia:', error);
            setMessage('❌ Błąd dodawania zlecenia');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleEditBooking = async () => {
        try {
            // Aktualizuj booking w lokalnym stanie
            setBookings(prevBookings => {
                const updatedBookings = { ...prevBookings };
                const employeeId = editingBooking.employeeId;

                if (updatedBookings[employeeId]) {
                    updatedBookings[employeeId] = updatedBookings[employeeId].map(booking =>
                        booking.id === editingBooking.id ? editingBooking : booking
                    );
                }

                return updatedBookings;
            });

            // W rzeczywistości tu byłaby aktualizacja w bazie
            const result = await dataManager.updateBooking(editingBooking);

            setMessage('✅ Zlecenie zaktualizowane - czas trwania zmieniony!');
            setShowEditModal(false);
            setEditingBooking(null);
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Błąd edycji zlecenia:', error);
            setMessage('❌ Błąd edycji zlecenia');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleDeleteBooking = async (bookingId) => {
        if (confirm('Czy na pewno chcesz usunąć to zlecenie?')) {
            try {
                // W rzeczywistości tu byłoby usunięcie z bazy
                setMessage('✅ Zlecenie usunięte!');
                loadData();
                setTimeout(() => setMessage(''), 3000);
            } catch (error) {
                console.error('Błąd usuwania zlecenia:', error);
                setMessage('❌ Błąd usuwania zlecenia');
                setTimeout(() => setMessage(''), 3000);
            }
        }
    };

    // Drag and Drop handlers
    const handleDragStart = (e, booking) => {
        setDraggedBooking(booking);
        setIsDragging(true);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', booking.id);

        // Add drag visual feedback
        e.target.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1';
        setDraggedBooking(null);
        setIsDragging(false);
        setDragOverSlot(null);
    };

    const handleDragOver = (e, employeeId, timeSlot) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverSlot({ employeeId, timeSlot });
    };

    const handleDragLeave = (e) => {
        // Only clear if we're really leaving the drop zone
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOverSlot(null);
        }
    };

    const handleDrop = async (e, targetEmployeeId, targetTimeSlot) => {
        e.preventDefault();
        setDragOverSlot(null);

        if (!draggedBooking) return;

        // Don't move if dropped on the same slot
        if (draggedBooking.employeeId === targetEmployeeId &&
            draggedBooking.scheduledTime === targetTimeSlot) {
            return;
        }

        try {
            // Calculate if the booking would overlap with existing bookings
            const targetBookings = bookings[targetEmployeeId] || [];
            const conflictBooking = targetBookings.find(booking =>
                booking.id !== draggedBooking.id &&
                booking.scheduledTime === targetTimeSlot
            );

            if (conflictBooking) {
                setMessage('❌ Konflikt czasu! W tym terminie jest już inne zlecenie.');
                setTimeout(() => setMessage(''), 3000);
                return;
            }

            // Update the booking
            const updatedBooking = {
                ...draggedBooking,
                employeeId: targetEmployeeId,
                scheduledTime: targetTimeSlot,
                scheduledDate: selectedDate.toISOString().split('T')[0]
            };

            // Update bookings state
            setBookings(prev => {
                const newBookings = { ...prev };

                // Remove from old employee
                if (newBookings[draggedBooking.employeeId]) {
                    newBookings[draggedBooking.employeeId] = newBookings[draggedBooking.employeeId]
                        .filter(b => b.id !== draggedBooking.id);
                }

                // Add to new employee
                if (!newBookings[targetEmployeeId]) {
                    newBookings[targetEmployeeId] = [];
                }
                newBookings[targetEmployeeId].push(updatedBooking);

                return newBookings;
            });

            setMessage(`✅ Zlecenie przeniesione do ${employees.find(e => e.id === targetEmployeeId)?.firstName || 'pracownika'} na ${targetTimeSlot}`);
            setTimeout(() => setMessage(''), 3000);

            // Here you would normally save to database
            // await dataManager.updateBooking(updatedBooking);

        } catch (error) {
            console.error('Błąd przenoszenia zlecenia:', error);
            setMessage('❌ Błąd przenoszenia zlecenia');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleAutoSuggestDuration = () => {
        const suggestions = {
            'Przegląd': 120,
            'Naprawa': 180,
            'Diagnostyka': 90,
            'Serwis': 150,
            'Konserwacja': 120,
            'Instalacja': 240,
            'Wymiana': 90,
            'Remont': 300,
            default: 60
        };

        const serviceType = editingBooking.serviceType || '';
        let suggestedTime = suggestions.default;

        // Sprawdź czy typ usługi zawiera któryś z kluczy
        for (const [key, time] of Object.entries(suggestions)) {
            if (key !== 'default' && serviceType.toLowerCase().includes(key.toLowerCase())) {
                suggestedTime = time;
                break;
            }
        }

        setEditingBooking(prev => ({
            ...prev,
            estimatedDuration: suggestedTime
        }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                📅 Panel Harmonogramów - Administrator
                            </h1>
                            <p className="text-gray-600">
                                Zarządzanie harmonogramami pracowników i zleceniami
                            </p>
                            <p className="text-sm text-blue-600 mt-2 flex items-center">
                                <FiMove className="h-4 w-4 mr-1" />
                                Przeciągaj zlecenia między pracownikami i terminami używając drag & drop
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/admin')}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            ← Powrót do panelu admin
                        </button>
                    </div>

                    {/* Kontrolki daty i widoku */}
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center bg-white border border-gray-300 rounded-lg">
                            <button
                                onClick={() => navigateDate(-1)}
                                className="p-2 hover:bg-gray-50 border-r border-gray-300"
                            >
                                <FiChevronLeft className="h-4 w-4" />
                            </button>
                            <div className="flex items-center px-3">
                                <FiCalendar className="h-5 w-5 text-gray-600 mr-2" />
                                <input
                                    type="date"
                                    value={selectedDate.toISOString().split('T')[0]}
                                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                    className="py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-none outline-none"
                                />
                            </div>
                            <button
                                onClick={() => navigateDate(1)}
                                className="p-2 hover:bg-gray-50 border-l border-gray-300"
                            >
                                <FiChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setTimelineView('day')}
                                className={`px-4 py-2 rounded ${timelineView === 'day' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
                            >
                                📅 Dzień
                            </button>
                            <button
                                onClick={() => setTimelineView('week')}
                                className={`px-4 py-2 rounded ${timelineView === 'week' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
                            >
                                📊 Tydzień
                            </button>
                        </div>

                        <button
                            onClick={() => setShowAddBookingModal(true)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <FiPlus className="h-4 w-4 mr-2" />
                            Dodaj zlecenie
                        </button>

                        <button
                            onClick={loadData}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                        >
                            <FiRefreshCw className="h-4 w-4 mr-2" />
                            Odśwież
                        </button>

                        <button
                            onClick={() => setSelectedDate(new Date())}
                            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                        >
                            <FiCalendar className="h-4 w-4 mr-2" />
                            Dziś
                        </button>
                    </div>

                    {message && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-blue-800">{message}</p>
                        </div>
                    )}

                    {/* Drag & Drop Legend */}
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                            <FiMove className="h-4 w-4 mr-1 text-blue-600" />
                            Instrukcje Drag & Drop
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="flex items-center text-gray-600">
                                <div className="w-3 h-3 bg-blue-200 rounded mr-2 cursor-move"></div>
                                Przeciągnij zlecenie aby je przenieść
                            </div>
                            <div className="flex items-center text-gray-600">
                                <div className="w-3 h-3 bg-blue-300 border-2 border-dashed border-blue-500 rounded mr-2"></div>
                                Niebieska ramka = dostępny termin
                            </div>
                            <div className="flex items-center text-gray-600">
                                <div className="w-3 h-3 bg-gray-200 rounded mr-2"></div>
                                Szare pola = czas wolny od pracy
                            </div>
                            <div className="flex items-center text-gray-600">
                                <div className="w-3 h-3 bg-orange-200 rounded mr-2"></div>
                                Pomarańczowe pola = przerwa
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline Component */}
                <TimelineView
                    employees={employees}
                    selectedDate={selectedDate}
                    schedules={schedules}
                    bookings={bookings}
                    onAddBooking={handleAddBookingFromTimeline}
                    onEditBooking={handleEditBookingFromTimeline}
                    onDeleteBooking={handleDeleteBooking}
                    viewType={timelineView}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    draggedBooking={draggedBooking}
                    dragOverSlot={dragOverSlot}
                    isDragging={isDragging}
                />
            </div>

            {/* Modal dodawania zlecenia */}
            {showAddBookingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900">
                                    📋 Dodaj nowe zlecenie
                                </h3>
                                <button
                                    onClick={() => setShowAddBookingModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <FiX className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pracownik
                                    </label>
                                    <select
                                        value={newBooking.employeeId}
                                        onChange={(e) => setNewBooking(prev => ({ ...prev, employeeId: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Wybierz pracownika</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.firstName} {emp.lastName} - {emp.specialization.join(', ')}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Godzina
                                    </label>
                                    <select
                                        value={newBooking.scheduledTime}
                                        onChange={(e) => setNewBooking(prev => ({ ...prev, scheduledTime: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Wybierz godzinę</option>
                                        {workingHours.map(hour => (
                                            <option key={hour} value={hour}>{hour}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Imię i nazwisko klienta
                                    </label>
                                    <input
                                        type="text"
                                        value={newBooking.clientName}
                                        onChange={(e) => setNewBooking(prev => ({ ...prev, clientName: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="np. Jan Kowalski"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Telefon klienta
                                    </label>
                                    <input
                                        type="tel"
                                        value={newBooking.clientPhone}
                                        onChange={(e) => setNewBooking(prev => ({ ...prev, clientPhone: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="+48 123 456 789"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Rodzaj usługi
                                    </label>
                                    <select
                                        value={newBooking.serviceType}
                                        onChange={(e) => setNewBooking(prev => ({ ...prev, serviceType: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Wybierz usługę</option>
                                        <option value="Przegląd">Przegląd</option>
                                        <option value="Naprawa">Naprawa</option>
                                        <option value="Diagnostyka">Diagnostyka</option>
                                        <option value="Wymiana oleju">Wymiana oleju</option>
                                        <option value="Wymiana opon">Wymiana opon</option>
                                        <option value="Klimatyzacja">Klimatyzacja</option>
                                        <option value="Lakiernictwo">Lakiernictwo</option>
                                        <option value="Inne">Inne</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Czas trwania (minuty)
                                    </label>
                                    <select
                                        value={newBooking.estimatedDuration}
                                        onChange={(e) => setNewBooking(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value={30}>30 minut</option>
                                        <option value={60}>1 godzina</option>
                                        <option value={90}>1.5 godziny</option>
                                        <option value={120}>2 godziny</option>
                                        <option value={180}>3 godziny</option>
                                        <option value={240}>4 godziny</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Opis (opcjonalnie)
                                    </label>
                                    <textarea
                                        value={newBooking.description}
                                        onChange={(e) => setNewBooking(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Dodatkowe informacje o zleceniu..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleAddBooking}
                                    disabled={!newBooking.employeeId || !newBooking.clientName || !newBooking.clientPhone || !newBooking.serviceType}
                                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    <FiSave className="h-4 w-4 mr-2" />
                                    Dodaj zlecenie
                                </button>
                                <button
                                    onClick={() => setShowAddBookingModal(false)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Anuluj
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal edycji zlecenia */}
            {showEditModal && editingBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900">
                                    ✏️ Edytuj zlecenie
                                </h3>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <FiX className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status zlecenia
                                    </label>
                                    <select
                                        value={editingBooking.status}
                                        onChange={(e) => setEditingBooking(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="scheduled">Zaplanowane</option>
                                        <option value="confirmed">Potwierdzone</option>
                                        <option value="in_progress">W trakcie</option>
                                        <option value="completed">Zakończone</option>
                                        <option value="cancelled">Anulowane</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Rodzaj urządzenia
                                    </label>
                                    <select
                                        value={editingBooking.deviceType || ''}
                                        onChange={(e) => setEditingBooking(prev => ({ ...prev, deviceType: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Wybierz urządzenie</option>
                                        <option value="pralka">Pralka</option>
                                        <option value="lodowka">Lodówka</option>
                                        <option value="zmywarka">Zmywarka</option>
                                        <option value="kuchenka">Kuchenka</option>
                                        <option value="piekarnik">Piekarnik</option>
                                        <option value="mikrofalowka">Mikrofalówka</option>
                                        <option value="tv">Telewizor</option>
                                        <option value="laptop">Laptop</option>
                                        <option value="komputer">Komputer</option>
                                        <option value="telefon">Telefon</option>
                                        <option value="tablet">Tablet</option>
                                        <option value="konsola">Konsola</option>
                                        <option value="inne">Inne</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Klient
                                    </label>
                                    <input
                                        type="text"
                                        value={editingBooking.clientName}
                                        onChange={(e) => setEditingBooking(prev => ({ ...prev, clientName: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Telefon
                                    </label>
                                    <input
                                        type="tel"
                                        value={editingBooking.clientPhone}
                                        onChange={(e) => setEditingBooking(prev => ({ ...prev, clientPhone: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Pola adresowe */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Kod pocztowy
                                        </label>
                                        <input
                                            type="text"
                                            value={editingBooking.postalCode || ''}
                                            onChange={(e) => {
                                                let value = e.target.value.replace(/[^0-9-]/g, '');
                                                if (value.length === 2 && !value.includes('-')) {
                                                    value = value + '-';
                                                }
                                                if (value.length > 6) {
                                                    value = value.slice(0, 6);
                                                }
                                                setEditingBooking(prev => ({ ...prev, postalCode: value }));
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="00-000"
                                            maxLength="6"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ulica
                                        </label>
                                        <input
                                            type="text"
                                            value={editingBooking.street || ''}
                                            onChange={(e) => setEditingBooking(prev => ({ ...prev, street: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="np. Marszałkowska"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Miasto
                                        </label>
                                        <select
                                            value={editingBooking.city || ''}
                                            onChange={(e) => setEditingBooking(prev => ({ ...prev, city: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Wybierz miasto</option>
                                            <option value="Warszawa">Warszawa</option>
                                            <option value="Kraków">Kraków</option>
                                            <option value="Łódź">Łódź</option>
                                            <option value="Wrocław">Wrocław</option>
                                            <option value="Poznań">Poznań</option>
                                            <option value="Gdańsk">Gdańsk</option>
                                            <option value="Szczecin">Szczecin</option>
                                            <option value="Bydgoszcz">Bydgoszcz</option>
                                            <option value="Lublin">Lublin</option>
                                            <option value="Białystok">Białystok</option>
                                            <option value="Katowice">Katowice</option>
                                            <option value="Gdynia">Gdynia</option>
                                            <option value="Częstochowa">Częstochowa</option>
                                            <option value="Radom">Radom</option>
                                            <option value="Sosnowiec">Sosnowiec</option>
                                            <option value="Toruń">Toruń</option>
                                            <option value="Kielce">Kielce</option>
                                            <option value="Gliwice">Gliwice</option>
                                            <option value="Inne">Inne</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Numer/Miejscowość
                                        </label>
                                        <input
                                            type="text"
                                            value={editingBooking.houseNumber || ''}
                                            onChange={(e) => setEditingBooking(prev => ({ ...prev, houseNumber: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="np. 15/3 lub Centrum"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Czas trwania
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => handleAutoSuggestDuration()}
                                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                                        >
                                            🤖 Auto-sugestia
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <input
                                            type="number"
                                            value={editingBooking.estimatedDuration || 60}
                                            onChange={(e) => setEditingBooking(prev => ({
                                                ...prev,
                                                estimatedDuration: parseInt(e.target.value) || 60
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            min="15"
                                            max="480"
                                            step="15"
                                            placeholder="Czas w minutach"
                                        />

                                        {/* Quick duration buttons */}
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-xs text-gray-500 self-center">Szybki wybór:</span>
                                            {[30, 60, 90, 120, 180, 240].map(minutes => (
                                                <button
                                                    key={minutes}
                                                    type="button"
                                                    onClick={() => setEditingBooking(prev => ({
                                                        ...prev,
                                                        estimatedDuration: minutes
                                                    }))}
                                                    className={`px-2 py-1 text-xs rounded border transition-colors ${(editingBooking.estimatedDuration || 60) === minutes
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {minutes < 60 ? `${minutes}min` : `${Math.floor(minutes / 60)}h${minutes % 60 > 0 ? ` ${minutes % 60}min` : ''}`}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="text-sm">
                                            {editingBooking.estimatedDuration && editingBooking.estimatedDuration > 0 ? (
                                                <span className="text-blue-700">
                                                    📅 Czas zlecenia: <strong>{Math.floor(editingBooking.estimatedDuration / 60)}h {editingBooking.estimatedDuration % 60}min</strong>
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">Wprowadź czas w minutach</span>
                                            )}
                                        </div>

                                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                            💡 <strong>Wytyczne:</strong> Proste zlecenia 30-60 min • Średnie 60-120 min • Złożone 120+ min
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Opis problemu/zlecenia
                                    </label>
                                    <textarea
                                        value={editingBooking.description || ''}
                                        onChange={(e) => setEditingBooking(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Opisz problem z urządzeniem lub szczegóły zlecenia..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notatki
                                    </label>
                                    <textarea
                                        value={editingBooking.notes || ''}
                                        onChange={(e) => setEditingBooking(prev => ({ ...prev, notes: e.target.value }))}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Dodatkowe notatki..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleEditBooking}
                                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <FiSave className="h-4 w-4 mr-2" />
                                    Zapisz zmiany
                                </button>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Anuluj
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
