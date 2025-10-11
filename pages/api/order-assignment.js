// pages/api/order-assignment.js
// 🚀 API dla systemu przydzielania zleceń z wizytami
// ✅ Automatyczne przydzielanie na podstawie algorytmów
// ✅ Ręczne przydzielanie przez operatora
// ✅ Optymalizacja terminów i tras
// ✅ Monitoring obciążenia serwisantów
// ✅ Obsługa wizyt - diagnoza, naprawa, kontrola
// ✅ Przepisywanie wizyt między technikami

import {
    readOrders,
    updateOrder,
    writeOrders
} from '../../utils/clientOrderStorage';

import {
    readEmployees,
    updateEmployee
} from '../../utils/employeeStorage';

export default async function handler(req, res) {
    console.log(`📋 API ${req.method} /api/order-assignment`);

    try {
        if (req.method === 'POST') {
            // Rozróżniaj między przydzielaniem zlecenia a dodawaniem wizyty
            if (req.body.action === 'assign-employee') {
                return await assignEmployeeToQueue(req, res);
            }
            if (req.body.action === 'add-visit') {
                return await addVisit(req, res);
            }
            if (req.body.action === 'reassign-visit') {
                return await reassignVisit(req, res);
            }
            return await handleAssignment(req, res);
        }
        
        if (req.method === 'GET') {
            const { action } = req.query;
            if (action === 'pending-visits') {
                return await getPendingVisits(req, res);
            }
            if (action === 'visits-by-employee') {
                return await getVisitsByEmployee(req, res);
            }
            return await getOrdersWithVisits(req, res);
        }
        
        if (req.method === 'PUT') {
            if (req.body.action === 'update-visit-status') {
                return await updateVisitStatus(req, res);
            }
            return await updateAssignment(req, res);
        }

        return res.status(405).json({ message: 'Method not allowed' });
        
    } catch (error) {
        console.error('❌ Error in order-assignment API:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Błąd serwera podczas przydzielania zleceń',
            error: error.message 
        });
    }
}

// Funkcja przydzielania zlecenia
async function handleAssignment(req, res) {
    const { orderId, employeeId, assignmentType, scheduledDate, scheduledTime, priority } = req.body;

    console.log('🎯 Przydzielanie zlecenia:', { orderId, employeeId, assignmentType });

    // Walidacja danych
    if (!orderId || !employeeId) {
        return res.status(400).json({
            success: false,
            message: 'Wymagane: orderId i employeeId'
        });
    }

    try {
        // Pobierz zlecenie i pracownika
        const orders = await readOrders();
        const employees = await readEmployees();
        
        const order = orders.find(o => o.id == orderId);
        const employee = employees.find(e => e.id == employeeId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Zlecenie nie znalezione'
            });
        }

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Pracownik nie znaleziony'
            });
        }

        // Sprawdź dostępność pracownika
        const currentWorkload = await calculateEmployeeWorkload(employeeId);
        if (currentWorkload.percentage >= 100) {
            return res.status(400).json({
                success: false,
                message: `Pracownik ${employee.name} ma już maksymalne obciążenie`
            });
        }

        // Algorytm automatycznego przydzielania terminów
        let suggestedSchedule = null;
        if (assignmentType === 'auto' || !scheduledDate) {
            suggestedSchedule = await calculateOptimalSchedule(order, employee);
        }

        // Aktualizuj zlecenie
        const updatedOrder = {
            ...order,
            assignedTo: employeeId,
            assignedAt: new Date().toISOString(),
            assignmentType: assignmentType || 'manual',
            scheduledDate: scheduledDate || suggestedSchedule?.date,
            scheduledTime: scheduledTime || suggestedSchedule?.time,
            priority: priority || order.priority || 'medium',
            status: 'assigned',
            estimatedDuration: order.estimatedDuration || 60,
            assignmentDetails: {
                assignedBy: 'system', // W przyszłości z session
                assignmentReason: assignmentType === 'auto' ? 'Automatyczne przydzielenie' : 'Ręczne przydzielenie',
                compatibility: await calculateCompatibilityScore(order, employee),
                suggestedSchedule
            }
        };

        // Zapisz aktualizacje
        await updateOrder(orderId, updatedOrder);

        // Aktualizuj statystyki pracownika
        await updateEmployeeStats(employeeId, 'assign');

        // Logowanie
        console.log('✅ Zlecenie przydzielone:', {
            order: order.orderNumber || orderId,
            employee: employee.name,
            date: updatedOrder.scheduledDate,
            time: updatedOrder.scheduledTime
        });

        return res.status(200).json({
            success: true,
            message: `Zlecenie ${order.orderNumber || orderId} przydzielone do ${employee.name}`,
            data: {
                orderId,
                employeeId,
                employeeName: employee.name,
                scheduledDate: updatedOrder.scheduledDate,
                scheduledTime: updatedOrder.scheduledTime,
                compatibility: updatedOrder.assignmentDetails.compatibility,
                workloadAfter: await calculateEmployeeWorkload(employeeId)
            }
        });

    } catch (error) {
        console.error('❌ Błąd podczas przydzielania:', error);
        return res.status(500).json({
            success: false,
            message: 'Błąd podczas przydzielania zlecenia',
            error: error.message
        });
    }
}

// Pobieranie zleceń z wizytami
async function getOrdersWithVisits(req, res) {
    try {
        const orders = await readOrders();
        const employees = readEmployees();
        
        // Filtruj zlecenia które mają wizyty lub potrzebują przydziału
        // USUŃ usunięte zlecenia (isDeleted flag)
        const activeOrders = orders.filter(order => 
            !order.isDeleted && // Nie pokazuj usuniętych zleceń
            order.status !== 'completed' && 
            order.status !== 'cancelled' &&
            order.status !== 'contacted' // Nie pokazuj zleceń "contacted" (czekają na konwersję)
        );

        // Sortuj według priorytetu i daty otrzymania
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        activeOrders.sort((a, b) => {
            const priorityDiff = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
            if (priorityDiff !== 0) return priorityDiff;
            
            // Jeśli ten sam priorytet, sortuj według daty
            return new Date(a.createdAt || a.receivedAt) - new Date(b.createdAt || b.receivedAt);
        });

        // Wzbogać zlecenia o informacje o wizytach i sugerowanych pracownikach
        const enrichedOrders = activeOrders.map(order => {
            const visits = order.visits || [];
            const pendingVisits = visits.filter(v => v.status === 'scheduled' || v.status === 'pending');
            const needsVisit = visits.length === 0 && order.status === 'pending';
            
            // Znajdź sugerowanego pracownika
            const suggestedEmployee = findBestEmployeeForOrder(order, employees);
            
            return {
                ...order,
                visits: visits.map(visit => ({
                    ...visit,
                    employeeName: employees.find(e => e.id === visit.technicianId || e.id === visit.assignedTo)?.name || 'Nieprzydzielony'
                })),
                pendingVisitsCount: pendingVisits.length,
                needsVisit,
                suggestedEmployee,
                waitingTime: Date.now() - new Date(order.createdAt || order.receivedAt || '2025-01-01').getTime(),
                urgencyScore: calculateUrgencyScore(order)
            };
        });

        return res.status(200).json({
            success: true,
            count: enrichedOrders.length,
            orders: enrichedOrders,
            statistics: {
                total: enrichedOrders.length,
                needingVisit: enrichedOrders.filter(o => o.needsVisit).length,
                withPendingVisits: enrichedOrders.filter(o => o.pendingVisitsCount > 0).length,
                urgent: enrichedOrders.filter(o => o.priority === 'urgent').length
            }
        });

    } catch (error) {
        console.error('❌ Błąd pobierania zleceń:', error);
        return res.status(500).json({
            success: false,
            message: 'Błąd pobierania zleceń'
        });
    }
}

// Aktualizacja przydzielenia
async function updateAssignment(req, res) {
    const { orderId, newEmployeeId, newDate, newTime, reason } = req.body;

    try {
        const orders = await readOrders();
        const order = orders.find(o => o.id == orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Zlecenie nie znalezione'
            });
        }

        const oldEmployeeId = order.assignedTo;

        // Aktualizuj zlecenie
        const updatedOrder = {
            ...order,
            assignedTo: newEmployeeId,
            scheduledDate: newDate || order.scheduledDate,
            scheduledTime: newTime || order.scheduledTime,
            reassignedAt: new Date().toISOString(),
            reassignmentReason: reason || 'Zmiana przydzielenia',
            assignmentHistory: [
                ...(order.assignmentHistory || []),
                {
                    previousEmployee: oldEmployeeId,
                    newEmployee: newEmployeeId,
                    changedAt: new Date().toISOString(),
                    reason
                }
            ]
        };

        await updateOrder(orderId, updatedOrder);

        // Aktualizuj statystyki pracowników
        if (oldEmployeeId) {
            await updateEmployeeStats(oldEmployeeId, 'unassign');
        }
        if (newEmployeeId) {
            await updateEmployeeStats(newEmployeeId, 'assign');
        }

        return res.status(200).json({
            success: true,
            message: 'Przydzielenie zaktualizowane',
            data: updatedOrder
        });

    } catch (error) {
        console.error('❌ Błąd aktualizacji przydzielenia:', error);
        return res.status(500).json({
            success: false,
            message: 'Błąd aktualizacji przydzielenia'
        });
    }
}

// Algorytm znajdowania najlepszego pracownika
function findBestEmployeeForOrder(order, employees = null) {
    try {
        if (!employees) {
            employees = readEmployees();
        }
        
        let bestScore = -1;
        let bestEmployee = null;

        for (const employee of employees) {
            if (!employee.isActive) continue;
            
            const score = calculateCompatibilityScore(order, employee);
            
            if (score > bestScore) {
                bestScore = score;
                bestEmployee = {
                    id: employee.id,
                    name: employee.name,
                    specializations: employee.specializations || [],
                    compatibilityScore: score,
                    rating: employee.rating || 4.0,
                    completedJobs: employee.completedJobs || 0,
                    address: employee.address || 'Nie określono'
                };
            }
        }

        return bestEmployee;
    } catch (error) {
        console.error('❌ Błąd znajdowania najlepszego pracownika:', error);
        return null;
    }
}

// Obliczanie wyniku kompatybilności
function calculateCompatibilityScore(order, employee) {
    let score = 0;

    // Specjalizacja (40% wagi)
    if (employee.specializations && Array.isArray(employee.specializations)) {
        const deviceType = order.deviceType || order.category;
        const brand = order.brand;
        
        // Sprawdź podstawową specjalizację
        if (employee.specializations.some(spec => 
            spec.toLowerCase().includes('agd') || 
            spec.toLowerCase().includes(deviceType?.toLowerCase() || ''))) {
            score += 30;
        }
        
        // Sprawdź specjalizację w AGD
        if (employee.agdSpecializations?.devices) {
            const deviceMatch = employee.agdSpecializations.devices.find(d => 
                d.type?.toLowerCase() === deviceType?.toLowerCase()
            );
            
            if (deviceMatch) {
                score += 20; // Bazowa specjalizacja w urządzeniu
                
                // Sprawdź markę
                if (brand && deviceMatch.brands?.includes(brand)) {
                    score += 15; // Bonus za znajomość marki
                }
                
                // Sprawdź poziom doświadczenia
                if (deviceMatch.level === 'expert') {
                    score += 10;
                } else if (deviceMatch.level === 'intermediate') {
                    score += 5;
                }
            }
        }
    } else {
        // Fallback jeśli brak specjalizacji
        score += 15;
    }

    // Region geograficzny (25% wagi)
    if (order.address && employee.address) {
        const orderCity = extractCityFromAddress(order.address);
        const employeeCity = employee.address;
        
        if (orderCity && employeeCity.toLowerCase().includes(orderCity.toLowerCase())) {
            score += 25;
        } else {
            // Może dojechać do innego regionu, ale z mniejszym punktami
            score += 10;
        }
    } else {
        score += 15; // Średnia jeśli brak danych o regionie
    }

    // Ocena i doświadczenie pracownika (20% wagi)
    const rating = employee.rating || 4.0;
    score += (rating / 5) * 15;
    
    const completedJobs = employee.completedJobs || 0;
    if (completedJobs > 200) {
        score += 10; // Bardzo doświadczony
    } else if (completedJobs > 100) {
        score += 7; // Doświadczony
    } else if (completedJobs > 50) {
        score += 5; // Średnio doświadczony
    } else {
        score += 2; // Początkujący
    }

    // Premia za aktywność (5% wagi)
    if (employee.isActive) {
        score += 5;
    }

    return Math.round(score * 10) / 10; // Zaokrąglij do 1 miejsca po przecinku
}

// Funkcja pomocnicza do wyciągania miasta z adresu
function extractCityFromAddress(address) {
    if (!address) return null;
    
    // Miasto zwykle jest na końcu po przecinku
    const parts = address.split(',');
    if (parts.length >= 2) {
        return parts[parts.length - 1].trim();
    }
    
    // Sprawdź czy zawiera znane miasta
    const cities = ['Warszawa', 'Kraków', 'Gdańsk', 'Wrocław', 'Poznań', 'Łódź'];
    for (const city of cities) {
        if (address.toLowerCase().includes(city.toLowerCase())) {
            return city;
        }
    }
    
    return null;
}

// Obliczanie obciążenia pracownika na podstawie wizyt
async function calculateEmployeeWorkload(employeeId) {
    try {
        const orders = await readOrders();
        const employees = readEmployees();
        
        const employee = employees.find(e => e.id == employeeId);
        if (!employee) {
            return { current: 0, max: 8, percentage: 0 };
        }

        // Policz aktywne wizyty w tym tygodniu
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        let activeVisits = 0;
        
        orders.forEach(order => {
            if (order.visits) {
                order.visits.forEach(visit => {
                    if (visit.technicianId === employeeId && 
                        (visit.status === 'scheduled' || visit.status === 'in-progress')) {
                        
                        const visitDate = new Date(visit.scheduledDate || '2025-01-01');
                        if (visitDate >= weekStart && visitDate <= weekEnd) {
                            activeVisits++;
                        }
                    }
                });
            }
        });

        const maxVisitsPerWeek = employee.maxVisitsPerWeek || 15;
        const percentage = (activeVisits / maxVisitsPerWeek) * 100;

        return {
            current: activeVisits,
            max: maxVisitsPerWeek,
            percentage: Math.round(percentage),
            activeOrders
        };
        
    } catch (error) {
        console.error('❌ Błąd obliczania obciążenia:', error);
        return { current: 0, max: 8, percentage: 0 };
    }
}

// Obliczanie optymalnego harmonogramu
async function calculateOptimalSchedule(order, employee) {
    try {
        // Pobierz preferencje klienta
        const preferredDates = order.preferredDates || [];
        const preferredTimes = order.preferredTimeSlots || order.preferredTimes || ['09:00-17:00'];

        // Sprawdź dostępność pracownika
        const today = new Date();
        let suggestedDate = null;
        let suggestedTime = null;

        // Jeśli zlecenie pilne, spróbuj dzisiaj
        if (order.priority === 'high') {
            const todayStr = today.toISOString().split('T')[0];
            if (await isEmployeeAvailable(employee.id, todayStr)) {
                suggestedDate = todayStr;
                suggestedTime = '14:00'; // Popołudniowy slot
            }
        }

        // Jeśli nie dziś, sprawdź preferencje klienta
        if (!suggestedDate && preferredDates.length > 0) {
            for (const date of preferredDates) {
                if (await isEmployeeAvailable(employee.id, date)) {
                    suggestedDate = date;
                    break;
                }
            }
        }

        // Fallback: znajdź pierwszą dostępną datę
        if (!suggestedDate) {
            for (let i = 1; i <= 7; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(today.getDate() + i);
                const dateStr = checkDate.toISOString().split('T')[0];
                
                if (await isEmployeeAvailable(employee.id, dateStr)) {
                    suggestedDate = dateStr;
                    break;
                }
            }
        }

        // Sugerowany czas na podstawie preferencji
        if (preferredTimes.length > 0) {
            const timeRange = preferredTimes[0].split('-');
            if (timeRange.length === 2) {
                suggestedTime = timeRange[0];
            }
        }
        
        suggestedTime = suggestedTime || '10:00';

        return {
            date: suggestedDate,
            time: suggestedTime,
            confidence: suggestedDate ? 0.8 : 0.3
        };

    } catch (error) {
        console.error('❌ Błąd obliczania harmonogramu:', error);
        return {
            date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: '10:00',
            confidence: 0.2
        };
    }
}

// Sprawdzenie dostępności pracownika
async function isEmployeeAvailable(employeeId, date) {
    try {
        const orders = await readOrders();
        
        // Sprawdź czy pracownik ma już zlecenia w tym dniu
        const dayOrders = orders.filter(order =>
            order.assignedTo == employeeId &&
            order.scheduledDate === date &&
            ['assigned', 'in_progress', 'scheduled'].includes(order.status)
        );

        // Załóżmy że pracownik może mieć maksymalnie 3 zlecenia dziennie
        return dayOrders.length < 3;
        
    } catch (error) {
        console.error('❌ Błąd sprawdzania dostępności:', error);
        return false;
    }
}

// Obliczanie wyniku pilności
function calculateUrgencyScore(order) {
    let score = 0;
    
    // Priorytet
    const priorityScores = { high: 50, medium: 25, low: 10 };
    score += priorityScores[order.priority] || 25;
    
    // Czas oczekiwania
    const waitingHours = (Date.now() - new Date(order.createdAt || order.receivedAt)) / (1000 * 60 * 60);
    score += Math.min(waitingHours * 2, 30); // Max 30 punktów za oczekiwanie
    
    // Typ urządzenia (niektóre są bardziej krytyczne)
    const criticalDevices = ['Lodówka', 'Piec', 'Bojler'];
    if (criticalDevices.includes(order.deviceType)) {
        score += 20;
    }
    
    return Math.round(score);
}

// Aktualizacja statystyk pracownika
async function updateEmployeeStats(employeeId, action) {
    try {
        const employees = readEmployees();
        const employee = employees.find(e => e.id == employeeId);
        
        if (!employee) return;

        const stats = employee.stats || {
            totalAssigned: 0,
            completedThisMonth: 0,
            avgRating: 4.0,
            lastAssignment: null
        };

        if (action === 'assign') {
            stats.totalAssigned = (stats.totalAssigned || 0) + 1;
            stats.lastAssignment = new Date().toISOString();
        }

        await updateEmployee(employeeId, {
            ...employee,
            stats,
            lastActivity: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Błąd aktualizacji statystyk pracownika:', error);
    }
}

// ================================
// 🆕 FUNKCJE OBSŁUGI WIZYT
// ================================

// Dodanie nowej wizyty do zlecenia
async function addVisit(req, res) {
    const { orderId, visitType, scheduledDate, scheduledTime, employeeId, notes } = req.body;

    try {
        const orders = await readOrders();
        const order = orders.find(o => o.id == orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Zlecenie nie znalezione'
            });
        }

        const employees = readEmployees();
        const employee = employees.find(e => e.id === employeeId);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Pracownik nie znaleziony'
            });
        }

        // Stwórz nową wizytę
        const newVisit = {
            visitId: `VIS${Date.now()}`,
            visitNumber: (order.visits || []).length + 1,
            type: visitType || 'diagnosis',
            scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
            scheduledTime,
            actualStartTime: null,
            actualEndTime: null,
            status: 'scheduled',
            technicianId: employeeId,
            technicianName: employee.name, 
            workDescription: notes || `${visitType === 'diagnosis' ? 'Diagnoza' : visitType === 'repair' ? 'Naprawa' : 'Kontrola'} urządzenia`,
            findings: '',
            duration: null,
            photos: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Dodaj wizytę do zlecenia
        const updatedOrder = {
            ...order,
            visits: [...(order.visits || []), newVisit],
            status: 'assigned',
            updatedAt: new Date().toISOString()
        };

        // Zapisz zlecenie
        const updatedOrders = orders.map(o => o.id == orderId ? updatedOrder : o);
        await writeOrders(updatedOrders);

        console.log('✅ Wizyta dodana:', { visitId: newVisit.visitId, orderId, employee: employee.name });

        return res.status(200).json({
            success: true,
            message: `Wizyta ${visitType} zaplanowana dla ${employee.name}`,
            data: {
                visit: newVisit,
                order: updatedOrder
            }
        });

    } catch (error) {
        console.error('❌ Błąd dodawania wizyty:', error);
        return res.status(500).json({
            success: false,
            message: 'Błąd podczas dodawania wizyty'
        });
    }
}

// Przepisanie wizyty do innego technika
async function reassignVisit(req, res) {
    const { orderId, visitId, newEmployeeId, reason } = req.body;

    try {
        const orders = await readOrders();
        const order = orders.find(o => o.id == orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Zlecenie nie znalezione'
            });
        }

        const visit = order.visits?.find(v => v.visitId === visitId);
        if (!visit) {
            return res.status(404).json({
                success: false,
                message: 'Wizyta nie znaleziona'
            });
        }

        const employees = readEmployees();
        const newEmployee = employees.find(e => e.id === newEmployeeId);
        
        if (!newEmployee) {
            return res.status(404).json({
                success: false,
                message: 'Nowy pracownik nie znaleziony'
            });
        }

        // Aktualizuj wizytę
        const updatedVisit = {
            ...visit,
            technicianId: newEmployeeId,
            technicianName: newEmployee.name,
            reassignedAt: new Date().toISOString(),
            reassignedReason: reason || 'Przepisano wizytę',
            updatedAt: new Date().toISOString()
        };

        // Aktualizuj zlecenie
        const updatedOrder = {
            ...order,
            visits: order.visits.map(v => v.visitId === visitId ? updatedVisit : v),
            updatedAt: new Date().toISOString()
        };

        // Zapisz
        const updatedOrders = orders.map(o => o.id == orderId ? updatedOrder : o);
        await writeOrders(updatedOrders);

        console.log('✅ Wizyta przepisana:', { visitId, from: visit.technicianName, to: newEmployee.name });

        return res.status(200).json({
            success: true,
            message: `Wizyta przepisana do ${newEmployee.name}`,
            data: {
                visit: updatedVisit,
                order: updatedOrder
            }
        });

    } catch (error) {
        console.error('❌ Błąd przepisywania wizyty:', error);
        return res.status(500).json({
            success: false,
            message: 'Błąd podczas przepisywania wizyty'
        });
    }
}

// Pobranie wizyt oczekujących
async function getPendingVisits(req, res) {
    try {
        const orders = await readOrders();
        const employees = readEmployees();
        
        const pendingVisits = [];
        
        orders.forEach(order => {
            if (order.visits) {
                order.visits.forEach(visit => {
                    if (visit.status === 'scheduled' || visit.status === 'pending') {
                        const employee = employees.find(e => e.id === visit.technicianId);
                        pendingVisits.push({
                            ...visit,
                            orderId: order.id,
                            orderNumber: order.orderNumber,
                            clientName: order.clientName,
                            address: order.address,
                            deviceType: order.deviceType || order.category,
                            brand: order.brand,
                            model: order.model,
                            priority: order.priority,
                            employeeName: employee?.name || 'Nieprzydzielony'
                        });
                    }
                });
            }
        });

        // Sortuj według daty i priorytetu
        pendingVisits.sort((a, b) => {
            if (a.scheduledDate && b.scheduledDate) {
                return new Date(a.scheduledDate) - new Date(b.scheduledDate);
            }
            return 0;
        });

        return res.status(200).json({
            success: true,
            count: pendingVisits.length,
            visits: pendingVisits
        });

    } catch (error) {
        console.error('❌ Błąd pobierania oczekujących wizyt:', error);
        return res.status(500).json({
            success: false,
            message: 'Błąd pobierania wizyt'
        });
    }
}

// Pobranie wizyt dla konkretnego pracownika
async function getVisitsByEmployee(req, res) {
    const { employeeId } = req.query;
    
    try {
        const orders = await readOrders();
        const employees = readEmployees();
        const employee = employees.find(e => e.id === employeeId);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Pracownik nie znaleziony'
            });
        }

        const employeeVisits = [];
        
        orders.forEach(order => {
            if (order.visits) {
                order.visits.forEach(visit => {
                    if (visit.technicianId === employeeId) {
                        employeeVisits.push({
                            ...visit,
                            orderId: order.id,
                            orderNumber: order.orderNumber,
                            clientName: order.clientName,
                            address: order.address,
                            deviceType: order.deviceType || order.category,
                            priority: order.priority
                        });
                    }
                });
            }
        });

        // Sortuj według statusu i daty
        employeeVisits.sort((a, b) => {
            const statusOrder = { 'scheduled': 1, 'in-progress': 2, 'completed': 3 };
            const statusDiff = (statusOrder[a.status] || 1) - (statusOrder[b.status] || 1);
            
            if (statusDiff !== 0) return statusDiff;
            
            if (a.scheduledDate && b.scheduledDate) {
                return new Date(a.scheduledDate) - new Date(b.scheduledDate);
            }
            return 0;
        });

        return res.status(200).json({
            success: true,
            employee: {
                id: employee.id,
                name: employee.name
            },
            count: employeeVisits.length,
            visits: employeeVisits
        });

    } catch (error) {
        console.error('❌ Błąd pobierania wizyt pracownika:', error);
        return res.status(500).json({
            success: false,
            message: 'Błąd pobierania wizyt'
        });
    }
}

// Aktualizacja statusu wizyty
async function updateVisitStatus(req, res) {
    const { orderId, visitId, status, findings, actualStartTime, actualEndTime, duration } = req.body;

    try {
        const orders = await readOrders();
        const order = orders.find(o => o.id == orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Zlecenie nie znalezione'
            });
        }

        const visit = order.visits?.find(v => v.visitId === visitId);
        if (!visit) {
            return res.status(404).json({
                success: false,
                message: 'Wizyta nie znaleziona'
            });
        }

        // Aktualizuj wizytę
        const updatedVisit = {
            ...visit,
            status,
            findings: findings || visit.findings,
            actualStartTime: actualStartTime || visit.actualStartTime,
            actualEndTime: actualEndTime || visit.actualEndTime,
            duration: duration || visit.duration,
            updatedAt: new Date().toISOString()
        };

        // Aktualizuj zlecenie
        const updatedOrder = {
            ...order,
            visits: order.visits.map(v => v.visitId === visitId ? updatedVisit : v),
            updatedAt: new Date().toISOString()
        };

        // Jeśli wszystkie wizyty zakończone, zmień status zlecenia
        const allVisitsCompleted = updatedOrder.visits.every(v => v.status === 'completed');
        if (allVisitsCompleted && status === 'completed') {
            updatedOrder.status = 'completed';
            updatedOrder.completedAt = new Date().toISOString();
        }

        // Zapisz
        const updatedOrders = orders.map(o => o.id == orderId ? updatedOrder : o);
        await writeOrders(updatedOrders);

        console.log('✅ Status wizyty zaktualizowany:', { visitId, status });

        return res.status(200).json({
            success: true,
            message: `Status wizyty zmieniony na: ${status}`,
            data: {
                visit: updatedVisit,
                order: updatedOrder
            }
        });

    } catch (error) {
        console.error('❌ Błąd aktualizacji statusu wizyty:', error);
        return res.status(500).json({
            success: false,
            message: 'Błąd podczas aktualizacji statusu'
        });
    }
}

// 🎯 Nowa funkcja: Przydziel pracownika do kolejki (bez od razu tworzenia wizyty)
async function assignEmployeeToQueue(req, res) {
    const { orderId, employeeId } = req.body;

    console.log('📥 Dodawanie do kolejki:', { orderId, employeeId });

    if (!orderId || !employeeId) {
        return res.status(400).json({
            success: false,
            message: 'Wymagane: orderId i employeeId'
        });
    }

    try {
        const orders = await readOrders();
        const employees = await readEmployees();

        const order = orders.find(o => o.id == orderId);
        const employee = employees.find(e => e.id === employeeId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Zlecenie nie znalezione'
            });
        }

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Pracownik nie znaleziony'
            });
        }

        // Stwórz wizytę oczekującą (pending) - bez konkretnego terminu
        const newVisit = {
            visitId: `VIS${Date.now()}`,
            visitNumber: (order.visits || []).length + 1,
            type: 'diagnosis', // Domyślnie diagnoza
            scheduledDate: null, // Brak terminu - do ustalenia później
            scheduledTime: null,
            actualStartTime: null,
            actualEndTime: null,
            status: 'pending', // STATUS: pending = oczekuje na ustalenie terminu
            technicianId: employeeId,
            technicianName: employee.name,
            workDescription: 'Wizyta oczekuje na ustalenie terminu',
            findings: '',
            duration: null,
            photos: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Aktualizuj zlecenie - przypisz pracownika + dodaj wizytę pending
        const updatedOrder = {
            ...order,
            assignedTo: employeeId,
            assignedToName: employee.name,
            assignedDate: new Date().toISOString(),
            status: 'assigned', // Zmień status na "przydzielone"
            visits: [...(order.visits || []), newVisit], // Dodaj wizytę pending
            updatedAt: new Date().toISOString()
        };

        // Zapisz
        const updatedOrders = orders.map(o => o.id == orderId ? updatedOrder : o);
        await writeOrders(updatedOrders);

        console.log('✅ Pracownik przydzielony + wizyta pending utworzona:', { 
            orderId, 
            employeeName: employee.name,
            visitId: newVisit.visitId 
        });

        return res.status(200).json({
            success: true,
            message: `Zlecenie przydzielone do: ${employee.name}`,
            data: {
                order: updatedOrder,
                visit: newVisit,
                employee: {
                    id: employee.id,
                    name: employee.name,
                    role: employee.role
                }
            }
        });

    } catch (error) {
        console.error('❌ Błąd przydzielania do kolejki:', error);
        return res.status(500).json({
            success: false,
            message: 'Błąd podczas przydzielania pracownika'
        });
    }
}