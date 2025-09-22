// pages/admin-zgloszenia.js

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    FiArrowLeft,
    FiPhone,
    FiMail,
    FiMapPin,
    FiClock,
    FiCheck,
    FiX,
    FiEye,
    FiTrash2,
    FiRefreshCw,
    FiDownload
} from 'react-icons/fi';

export default function AdminZgloszenia() {
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [filter, setFilter] = useState('all'); // all, pending, completed, cancelled
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBookings();
    }, []);

    useEffect(() => {
        filterBookings();
    }, [bookings, filter]);

    const loadBookings = () => {
        setLoading(true);
        try {
            const data = JSON.parse(localStorage.getItem('simpleBookings') || '[]');
            // Sortuj po dacie utworzenia (najnowsze pierwsze)
            const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setBookings(sortedData);
        } catch (error) {
            console.error('Błąd podczas ładowania zgłoszeń:', error);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const filterBookings = () => {
        if (filter === 'all') {
            setFilteredBookings(bookings);
        } else {
            setFilteredBookings(bookings.filter(booking => booking.status === filter));
        }
    };

    const updateBookingStatus = async (id, newStatus) => {
        try {
            // Import dataManager dynamicznie
            const { dataManager } = await import('../utils/dataManager');

            const updatedBookings = bookings.map(booking => {
                if (booking.id === id) {
                    const updatedBooking = {
                        ...booking,
                        status: newStatus,
                        updatedAt: new Date().toISOString()
                    };

                    // Jeśli status zmienia się na "in_progress" (w realizacji) i nie ma jeszcze numeru zlecenia
                    if (newStatus === 'in_progress' && !booking.orderNumber) {
                        updatedBooking.orderNumber = dataManager.getNextOrderNumber();
                    }

                    return updatedBooking;
                }
                return booking;
            });

            setBookings(updatedBookings);
            localStorage.setItem('simpleBookings', JSON.stringify(updatedBookings));
        } catch (error) {
            console.error('Błąd podczas aktualizacji statusu:', error);
        }
    };

    const deleteBooking = (id) => {
        if (confirm('Czy na pewno chcesz usunąć to zgłoszenie?')) {
            const updatedBookings = bookings.filter(booking => booking.id !== id);
            setBookings(updatedBookings);
            localStorage.setItem('simpleBookings', JSON.stringify(updatedBookings));
        }
    };

    const exportBookings = () => {
        const dataStr = JSON.stringify(bookings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `zgloszenia_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('pl-PL');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending':
                return 'Oczekujące';
            case 'in_progress':
                return 'W realizacji';
            case 'completed':
                return 'Wykonane';
            case 'cancelled':
                return 'Anulowane';
            default:
                return status;
        }
    };

    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        in_progress: bookings.filter(b => b.status === 'in_progress').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Ładowanie zgłoszeń...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/admin"
                                    className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    <FiArrowLeft className="w-5 h-5 mr-2" />
                                    Powrót do panelu
                                </Link>
                                <div className="h-6 w-px bg-gray-300"></div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Zgłoszenia serwisowe
                                </h1>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={loadBookings}
                                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <FiRefreshCw className="w-4 h-4 mr-2" />
                                    Odśwież
                                </button>
                                <button
                                    onClick={exportBookings}
                                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <FiDownload className="w-4 h-4 mr-2" />
                                    Eksport
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Statystyki */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <FiEye className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Wszystkie</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <FiClock className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Oczekujące</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <FiRefreshCw className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">W realizacji</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.in_progress}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <FiCheck className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Wykonane</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <FiX className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Anulowane</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtry */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Filtry</h2>
                        <div className="flex space-x-4">
                            {[
                                { key: 'all', label: 'Wszystkie' },
                                { key: 'pending', label: 'Oczekujące' },
                                { key: 'in_progress', label: 'W realizacji' },
                                { key: 'completed', label: 'Wykonane' },
                                { key: 'cancelled', label: 'Anulowane' }
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setFilter(key)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === key
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Lista zgłoszeń */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">
                            Zgłoszenia ({filteredBookings.length})
                        </h2>
                    </div>

                    {filteredBookings.length === 0 ? (
                        <div className="p-12 text-center">
                            <FiEye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">
                                {filter === 'all' ? 'Brak zgłoszeń' : `Brak zgłoszeń o statusie "${getStatusLabel(filter)}"`}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {filteredBookings.map((booking) => (
                                <div key={booking.id} className="p-6 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-4 mb-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                                    {getStatusLabel(booking.status)}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {booking.reportNumber || `#${booking.id}`}
                                                </span>
                                                {booking.orderNumber && (
                                                    <span className="text-sm text-blue-600 font-medium">
                                                        {booking.orderNumber}
                                                    </span>
                                                )}
                                                <span className="text-sm text-gray-500">
                                                    {formatDate(booking.createdAt)}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex items-center text-gray-700">
                                                    <FiMapPin className="w-4 h-4 mr-2 text-gray-400" />
                                                    <span className="text-sm">{booking.address}</span>
                                                </div>
                                                <div className="flex items-center text-gray-700">
                                                    <FiPhone className="w-4 h-4 mr-2 text-gray-400" />
                                                    <span className="text-sm">{booking.phone}</span>
                                                </div>
                                                {booking.email && (
                                                    <div className="flex items-center text-gray-700 md:col-span-2">
                                                        <FiMail className="w-4 h-4 mr-2 text-gray-400" />
                                                        <span className="text-sm">{booking.email}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Nowe pola - opis i dostępność */}
                                            {(booking.description || booking.availability) && (
                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                    {booking.description && (
                                                        <div className="mb-2">
                                                            <div className="flex items-start text-gray-700">
                                                                <div className="w-4 h-4 mr-2 mt-0.5 text-gray-400">💬</div>
                                                                <div>
                                                                    <span className="text-xs font-medium text-gray-500 block">Opis problemu:</span>
                                                                    <span className="text-sm">{booking.description}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {booking.availability && (
                                                        <div>
                                                            <div className="flex items-start text-gray-700">
                                                                <div className="w-4 h-4 mr-2 mt-0.5 text-gray-400">🕒</div>
                                                                <div>
                                                                    <span className="text-xs font-medium text-gray-500 block">Dostępność:</span>
                                                                    <span className="text-sm">{booking.availability}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {booking.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => updateBookingStatus(booking.id, 'in_progress')}
                                                        className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                                    >
                                                        <FiClock className="w-3 h-3 mr-1" />
                                                        W realizacji
                                                    </button>
                                                    <button
                                                        onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                                        className="flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                                                    >
                                                        <FiX className="w-3 h-3 mr-1" />
                                                        Anuluj
                                                    </button>
                                                </>
                                            )}

                                            {booking.status === 'in_progress' && (
                                                <>
                                                    <button
                                                        onClick={() => updateBookingStatus(booking.id, 'completed')}
                                                        className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                                                    >
                                                        <FiCheck className="w-3 h-3 mr-1" />
                                                        Wykonane
                                                    </button>
                                                    <button
                                                        onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                                        className="flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                                                    >
                                                        <FiX className="w-3 h-3 mr-1" />
                                                        Anuluj
                                                    </button>
                                                </>
                                            )}

                                            {(booking.status === 'completed' || booking.status === 'cancelled') && (
                                                <button
                                                    onClick={() => updateBookingStatus(booking.id, 'pending')}
                                                    className="flex items-center px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                                                >
                                                    <FiRefreshCw className="w-3 h-3 mr-1" />
                                                    Przywróć
                                                </button>
                                            )}

                                            <button
                                                onClick={() => deleteBooking(booking.id)}
                                                className="flex items-center px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                                            >
                                                <FiTrash2 className="w-3 h-3 mr-1" />
                                                Usuń
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
