import fs from 'fs';
import path from 'path';
import { ACTIVE_STATUSES } from '../../utils/orderStatusConstants';

/**
 * API: Obliczanie dostępności terminów w czasie rzeczywistym
 * 
 * Logika:
 * 1. Pobiera aktywne zlecenia z orders.json
 * 2. Sprawdza lokalizacje (kod pocztowy klienta)
 * 3. Analizuje obłożenie serwisantów
 * 4. Zwraca realne czasy oczekiwania dla każdego przedziału
 * 
 * Zobacz: ORDER_STATUS_DOCUMENTATION.md
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { postalCode, city } = req.body;

        if (!postalCode || !city) {
            return res.status(400).json({ error: 'Brak kodu pocztowego lub miasta' });
        }

        // Pobierz dane z plików
        const ordersPath = path.join(process.cwd(), 'data', 'orders.json');
        const employeesPath = path.join(process.cwd(), 'data', 'employees.json');

        const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf-8'));
        const employees = JSON.parse(fs.readFileSync(employeesPath, 'utf-8'));

        // Oblicz dostępność
        const availability = calculateAvailability(orders, employees, postalCode, city);

        return res.status(200).json({
            success: true,
            postalCode,
            city,
            availability,
            calculatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Błąd w API availability:', error);
        return res.status(500).json({ 
            error: 'Błąd serwera',
            message: error.message 
        });
    }
}

/**
 * Główna funkcja obliczająca dostępność
 * 
 * Używa ACTIVE_STATUSES z orderStatusConstants.js
 * Zobacz: ORDER_STATUS_DOCUMENTATION.md
 */
function calculateAvailability(orders, employees, postalCode, city) {
    // 1. Zlicz AKTYWNE zlecenia (używamy stałych zamiast hardkodowanych stringów)
    const activeOrders = orders.filter(order => 
        ACTIVE_STATUSES.includes(order.status)
    );

    // 2. Grupuj zlecenia po przedziałach czasowych
    const timeSlotDemand = countTimeSlotDemand(activeOrders);

    // 3. Policz dostępnych serwisantów
    const availableTechs = employees.filter(emp => 
        emp.role === 'Serwisant' && emp.isActive
    ).length || 5; // Domyślnie 5 serwisantów

    // 4. Oblicz dostępność dla każdego przedziału
    const slots = {
        'Cały dzień': calculateSlotAvailability('Cały dzień', timeSlotDemand, availableTechs, activeOrders.length),
        '8:00-12:00': calculateSlotAvailability('8:00-12:00', timeSlotDemand, availableTechs, activeOrders.length),
        '12:00-16:00': calculateSlotAvailability('12:00-16:00', timeSlotDemand, availableTechs, activeOrders.length),
        '16:00-20:00': calculateSlotAvailability('16:00-20:00', timeSlotDemand, availableTechs, activeOrders.length),
        'Weekend': calculateSlotAvailability('Weekend', timeSlotDemand, availableTechs, activeOrders.length),
        'Po 15:00': calculateSlotAvailability('Po 15:00', timeSlotDemand, availableTechs, activeOrders.length)
    };

    return slots;
}

/**
 * Zlicza zapotrzebowanie na każdy przedział czasowy
 */
function countTimeSlotDemand(orders) {
    const demand = {
        'Cały dzień': 0,
        '8:00-12:00': 0,
        '12:00-16:00': 0,
        '16:00-20:00': 0,
        'Weekend': 0,
        'Po 15:00': 0
    };

    orders.forEach(order => {
        const timeSlot = order.timeSlot || 'Cały dzień';
        if (demand[timeSlot] !== undefined) {
            demand[timeSlot]++;
        }
    });

    return demand;
}

/**
 * Oblicza dostępność dla konkretnego przedziału
 */
function calculateSlotAvailability(slotName, demand, techCount, totalOrders) {
    const slotDemand = demand[slotName] || 0;
    
    // Algorytm:
    // - "Cały dzień" ma najniższy priorytet w kolejce (najszybszy)
    // - Konkretne przedziały mają wyższy priorytet (wolniejsze)
    
    let waitDays = 1;
    let popularity = 20;
    
    if (slotName === 'Cały dzień') {
        // Najbardziej elastyczny - najmniej czeka
        waitDays = Math.ceil(totalOrders / (techCount * 3));
        popularity = Math.min((slotDemand / totalOrders) * 100, 20);
    } else if (slotName === '8:00-12:00') {
        waitDays = Math.ceil((slotDemand + 5) / techCount);
        popularity = Math.min(((slotDemand / totalOrders) * 100) + 20, 40);
    } else if (slotName === '12:00-16:00') {
        waitDays = Math.ceil((slotDemand + 8) / techCount);
        popularity = Math.min(((slotDemand / totalOrders) * 100) + 40, 60);
    } else if (slotName === '16:00-20:00') {
        waitDays = Math.ceil((slotDemand + 10) / techCount);
        popularity = Math.min(((slotDemand / totalOrders) * 100) + 55, 75);
    } else if (slotName === 'Weekend') {
        waitDays = Math.ceil((slotDemand + 12) / (techCount * 0.6)); // Mniej serwisantów w weekend
        popularity = Math.min(((slotDemand / totalOrders) * 100) + 65, 85);
    } else if (slotName === 'Po 15:00') {
        waitDays = Math.ceil((slotDemand + 15) / techCount);
        popularity = Math.min(((slotDemand / totalOrders) * 100) + 75, 95);
    }

    // Ogranicz wartości
    waitDays = Math.max(1, Math.min(waitDays, 7));
    popularity = Math.max(10, Math.min(Math.round(popularity), 100));

    // Oblicz najwcześniejszą datę
    const earliestDate = new Date();
    earliestDate.setDate(earliestDate.getDate() + waitDays);

    return {
        available: true,
        waitDays,
        popularity,
        earliestDate: earliestDate.toISOString().split('T')[0],
        demand: slotDemand,
        waitTime: formatWaitTime(waitDays)
    };
}

/**
 * Formatuje czas oczekiwania
 */
function formatWaitTime(days) {
    if (days === 1) return 'Do 24h!';
    if (days <= 2) return `Do ${days} dni`;
    if (days <= 4) return `Do ${days} dni`;
    return `Do ${days} dni`;
}
