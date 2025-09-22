// components/TimelineView.js

import { useState, useEffect } from 'react';
import {
    FiUser,
    FiClock,
    FiEdit,
    FiTrash2,
    FiPlus,
    FiPhone,
    FiTool,
    FiEye,
    FiCalendar,
    FiMove
} from 'react-icons/fi';

export default function TimelineView({
    employees,
    selectedDate,
    schedules,
    bookings,
    onAddBooking,
    onEditBooking,
    onDeleteBooking,
    viewType = 'day',
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
    draggedBooking,
    dragOverSlot,
    isDragging
}) {
    // State for client-side date formatting to prevent hydration mismatch
    const [formattedDate, setFormattedDate] = useState('');

    // Format date only on client side to prevent hydration mismatch
    useEffect(() => {
        setFormattedDate(selectedDate.toLocaleDateString('pl-PL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }));
    }, [selectedDate]);

    // Add drag feedback styling
    const getDragFeedbackStyle = (isValidDropZone, isCurrentDragTarget) => {
        if (isDragging && isValidDropZone) {
            if (isCurrentDragTarget) {
                return {
                    backgroundColor: '#dbeafe',
                    borderColor: '#3b82f6',
                    borderWidth: '2px',
                    borderStyle: 'dashed'
                };
            } else {
                return {
                    backgroundColor: '#f0f9ff',
                    borderColor: '#93c5fd',
                    borderWidth: '1px',
                    borderStyle: 'dashed'
                };
            }
        }
        return {};
    };

    // Generuj godziny pracy (6:00 - 24:00)
    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 6; hour < 24; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            if (hour < 23) { // Nie dodawaj :30 dla ostatniej godziny
                slots.push(`${hour.toString().padStart(2, '0')}:30`);
            }
        }
        return slots;
    };

    const timeSlots = generateTimeSlots();

    const getEmployeeWorkHours = (employeeId, date) => {
        const schedule = schedules[employeeId]?.find(s => s.isActive && s.type === 'weekly');
        if (!schedule || !schedule.data.quickSchedule) {
            return null;
        }

        const dayOfWeek = date.getDay();
        const quickSchedule = schedule.data.quickSchedule;

        if (dayOfWeek >= 1 && dayOfWeek <= 5 && quickSchedule.mondayToFriday.working) {
            return {
                start: quickSchedule.mondayToFriday.start,
                end: quickSchedule.mondayToFriday.end,
                break: quickSchedule.mondayToFriday.break
            };
        } else if (dayOfWeek === 6 && quickSchedule.saturday.working) {
            return {
                start: quickSchedule.saturday.start,
                end: quickSchedule.saturday.end,
                break: quickSchedule.saturday.break
            };
        } else if (dayOfWeek === 0 && quickSchedule.sunday.working) {
            return {
                start: quickSchedule.sunday.start,
                end: quickSchedule.sunday.end,
                break: quickSchedule.sunday.break
            };
        }

        return null;
    };

    const getTimeSlotBooking = (employeeId, time) => {
        const empBookings = bookings[employeeId] || [];
        return empBookings.find(booking => {
            const bookingTime = booking.scheduledTime;
            const bookingDuration = booking.estimatedDuration || 60;

            // Sprawdź czy czas mieści się w zakresie rezerwacji
            const bookingStart = parseInt(bookingTime.replace(':', ''));
            const bookingEnd = bookingStart + Math.floor(bookingDuration / 60) * 100 + (bookingDuration % 60);
            const currentTime = parseInt(time.replace(':', ''));

            return currentTime >= bookingStart && currentTime < bookingEnd;
        });
    };

    const isTimeInWorkHours = (employeeId, time, workHours) => {
        if (!workHours) return false;

        const timeNum = parseInt(time.replace(':', ''));
        const startNum = parseInt(workHours.start.replace(':', ''));
        const endNum = parseInt(workHours.end.replace(':', ''));

        return timeNum >= startNum && timeNum < endNum;
    };

    const isTimeInBreak = (time, breakTime) => {
        if (!breakTime || !breakTime.includes('-')) return false;

        const [breakStart, breakEnd] = breakTime.split('-');
        const timeNum = parseInt(time.replace(':', ''));
        const breakStartNum = parseInt(breakStart.replace(':', ''));
        const breakEndNum = parseInt(breakEnd.replace(':', ''));

        return timeNum >= breakStartNum && timeNum < breakEndNum;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'scheduled': return '📅';
            case 'confirmed': return '✅';
            case 'in_progress': return '🔧';
            case 'completed': return '✅';
            case 'cancelled': return '❌';
            default: return '📋';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                        🕐 Harmonogram - {formattedDate || 'Ładowanie...'}
                    </h2>

                    <div className="flex items-center text-sm text-gray-500">
                        <FiClock className="h-4 w-4 mr-1" />
                        Zakres: 06:00 - 24:00
                    </div>
                </div>

                {/* Timeline Header */}
                <div className="overflow-x-auto">
                    <div className="min-w-full">
                        <div className="grid grid-cols-[250px_repeat(36,_minmax(50px,1fr))] gap-1 mb-4">
                            <div className="p-3 font-bold text-gray-800 bg-gray-50 rounded-lg">
                                👥 Pracownik
                            </div>
                            {timeSlots.map((time, index) => (
                                <div
                                    key={time}
                                    className={`p-2 text-center text-xs font-medium rounded-lg ${time.endsWith(':00')
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'bg-gray-50 text-gray-600'
                                        }`}
                                >
                                    {time}
                                </div>
                            ))}
                        </div>

                        {/* Employee Rows */}
                        {employees.map(employee => {
                            const workHours = getEmployeeWorkHours(employee.id, selectedDate);

                            return (
                                <div
                                    key={employee.id}
                                    className="grid grid-cols-[250px_repeat(36,_minmax(50px,1fr))] gap-1 mb-4 border-b border-gray-100 pb-4"
                                >
                                    {/* Employee Info Column */}
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                        <div className="flex items-start">
                                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                                <FiUser className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-gray-900 text-sm">
                                                    {employee.firstName} {employee.lastName}
                                                </div>
                                                <div className="text-xs text-gray-600 mt-1">
                                                    {employee.specialization.join(', ')}
                                                </div>
                                                {workHours && (
                                                    <div className="text-xs text-green-600 mt-2 font-medium">
                                                        🕐 {workHours.start} - {workHours.end}
                                                        {workHours.break && (
                                                            <div className="text-orange-600">
                                                                ☕ {workHours.break}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {!workHours && (
                                                    <div className="text-xs text-red-600 mt-2 font-medium">
                                                        🚫 Dzień wolny
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Time Slots */}
                                    {timeSlots.map(time => {
                                        const isWorking = isTimeInWorkHours(employee.id, time, workHours);
                                        const isBreak = workHours && isTimeInBreak(time, workHours.break);
                                        const booking = getTimeSlotBooking(employee.id, time);

                                        let cellClass = 'p-1 min-h-[80px] border border-gray-200 relative cursor-pointer transition-all duration-200 rounded-lg';

                                        if (!isWorking) {
                                            cellClass += ' bg-gray-100 hover:bg-gray-200';
                                        } else if (isBreak) {
                                            cellClass += ' bg-orange-100 hover:bg-orange-200';
                                        } else if (booking) {
                                            cellClass += ' bg-blue-50 hover:bg-blue-100';
                                        } else {
                                            cellClass += ' bg-white hover:bg-green-50 border-dashed hover:border-green-300';
                                        }

                                        return (
                                            <div
                                                key={`${employee.id}-${time}`}
                                                className={cellClass}
                                                onClick={() => {
                                                    if (isWorking && !isBreak && !booking) {
                                                        onAddBooking(employee.id, time);
                                                    }
                                                }}
                                                onDragOver={(e) => {
                                                    if (isWorking && !isBreak && onDragOver) {
                                                        onDragOver(e, employee.id, time);
                                                    }
                                                }}
                                                onDragLeave={(e) => {
                                                    if (onDragLeave) {
                                                        onDragLeave(e);
                                                    }
                                                }}
                                                onDrop={(e) => {
                                                    if (isWorking && !isBreak && onDrop) {
                                                        onDrop(e, employee.id, time);
                                                    }
                                                }}
                                                style={{
                                                    ...getDragFeedbackStyle(isWorking && !isBreak, dragOverSlot &&
                                                        dragOverSlot.employeeId === employee.id &&
                                                        dragOverSlot.timeSlot === time)
                                                }}
                                            >
                                                {!isWorking && (
                                                    <div className="text-xs text-gray-500 text-center p-1">
                                                        🚫 Wolne
                                                    </div>
                                                )}

                                                {isWorking && isBreak && (
                                                    <div className="text-xs text-orange-600 text-center p-1">
                                                        ☕ Przerwa
                                                    </div>
                                                )}

                                                {booking && (
                                                    <div
                                                        className={`text-xs p-2 rounded-lg border-2 ${getStatusColor(booking.status)} h-full cursor-move select-none transition-all duration-200 ${draggedBooking && draggedBooking.id === booking.id ? 'opacity-50 scale-95' : ''
                                                            }`}
                                                        draggable={true}
                                                        onDragStart={(e) => {
                                                            if (onDragStart) {
                                                                onDragStart(e, booking);
                                                            }
                                                        }}
                                                        onDragEnd={(e) => {
                                                            if (onDragEnd) {
                                                                onDragEnd(e);
                                                            }
                                                        }}
                                                        title="Przeciągnij aby przenieść zlecenie"
                                                    >
                                                        <div className="font-bold truncate text-center mb-1 flex items-center justify-center">
                                                            <FiMove className="h-3 w-3 mr-1 opacity-50" />
                                                            {getStatusIcon(booking.status)} {booking.clientName}
                                                        </div>
                                                        <div className="truncate text-center text-xs mb-1">
                                                            <FiTool className="inline h-3 w-3 mr-1" />
                                                            {booking.serviceType}
                                                        </div>
                                                        <div className="text-center text-xs mb-2 flex items-center justify-center">
                                                            <FiClock className="inline h-3 w-3 mr-1" />
                                                            {Math.floor(booking.estimatedDuration / 60)}h {booking.estimatedDuration % 60}min
                                                        </div>
                                                        <div className="flex justify-center space-x-1">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onEditBooking(booking);
                                                                }}
                                                                className="p-1 hover:bg-white rounded text-blue-600 hover:text-blue-800"
                                                                title="Edytuj zlecenie"
                                                            >
                                                                <FiEdit className="h-3 w-3" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onDeleteBooking(booking.id);
                                                                }}
                                                                className="p-1 hover:bg-white rounded text-red-600 hover:text-red-800"
                                                                title="Usuń"
                                                            >
                                                                <FiTrash2 className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {isWorking && !isBreak && !booking && (
                                                    <div className="text-xs text-green-600 text-center opacity-0 hover:opacity-100 transition-opacity p-1 h-full flex flex-col justify-center">
                                                        <FiPlus className="h-4 w-4 mx-auto mb-1" />
                                                        <span>Dodaj zlecenie</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {employees.filter(emp => getEmployeeWorkHours(emp.id, selectedDate)).length}
                            </div>
                            <div className="text-sm text-blue-700">Pracuje dziś</div>
                        </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {Object.values(bookings).flat().length}
                            </div>
                            <div className="text-sm text-green-700">Zleceń dziś</div>
                        </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                                {Object.values(bookings).flat().filter(b => b.status === 'in_progress').length}
                            </div>
                            <div className="text-sm text-yellow-700">W trakcie</div>
                        </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {Object.values(bookings).flat().reduce((sum, booking) => sum + (booking.estimatedDuration || 60), 0)}
                            </div>
                            <div className="text-sm text-purple-700">Minut łącznie</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
