// pages/api/orders/[id].js
// API endpoint dla operacji na pojedynczym zleceniu

import fs from 'fs';
import path from 'path';
import {
    readOrders,
    updateOrder,
    patchOrder,
    deleteOrder
} from '../../../utils/clientOrderStorage';

export default async function handler(req, res) {
    const { id } = req.query;
    
    console.log(`📞 API ${req.method} /api/orders/${id}`);

    if (req.method === 'GET') {
        try {
            const orders = await readOrders();
            const order = orders.find(o => o.id == id || o.orderNumber == id);
            
            if (order) {
                console.log(`✅ Found order: ${order.orderNumber}`);
                return res.status(200).json({ 
                    success: true,
                    order 
                });
            } else {
                console.log(`❌ Order not found: ${id}`);
                return res.status(404).json({ 
                    success: false,
                    message: 'Zamówienie nie znalezione' 
                });
            }
        } catch (error) {
            console.error('❌ Error reading order:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Błąd odczytu zamówienia',
                error: error.message
            });
        }
    }

    if (req.method === 'PATCH') {
        try {
            const updateData = req.body;
            console.log(`📝 Patching order ${id} with:`, updateData);
            
            const orders = await readOrders();
            const orderIndex = orders.findIndex(o => o.id == id || o.orderNumber == id);
            
            if (orderIndex === -1) {
                console.log(`❌ Order not found: ${id}`);
                return res.status(404).json({ 
                    success: false,
                    message: 'Zamówienie nie znalezione' 
                });
            }
            
            const existingOrder = orders[orderIndex];
            
            // 🔥 AUTO-TWORZENIE WIZYTY: Jeśli przypisujemy technika + datę + czas, stwórz wizytę
            if (updateData.assignedTo && updateData.scheduledDate && updateData.scheduledTime) {
                const hasExistingVisit = existingOrder.visits && existingOrder.visits.length > 0;
                
                // Jeśli nie ma jeszcze wizyty, utwórz ją
                if (!hasExistingVisit) {
                    console.log(`📅 Tworzę nową wizytę dla zlecenia ${id}`);
                    
                    // Pobierz dane pracownika
                    const employeesPath = path.join(process.cwd(), 'data', 'employees.json');
                    let technicianName = 'Nieprzydzielony';
                    try {
                        const employeesData = fs.readFileSync(employeesPath, 'utf8');
                        const employees = JSON.parse(employeesData);
                        const technician = employees.find(emp => emp.id === updateData.assignedTo);
                        if (technician) {
                            technicianName = technician.name;
                        }
                    } catch (err) {
                        console.warn('⚠️ Nie udało się pobrać danych pracownika');
                    }
                    
                    // Generuj visitId - GLOBALNIE UNIKALNY
                    const now = new Date();
                    const year = now.getFullYear().toString().slice(-2);
                    const month = (now.getMonth() + 1).toString().padStart(2, '0');
                    const day = now.getDate().toString().padStart(2, '0');
                    
                    // Pobierz wszystkie zlecenia aby znaleźć najwyższy numer wizyty
                    const allOrders = await readOrders();
                    const allVisits = allOrders.flatMap(o => o.visits || []);
                    const todayVisits = allVisits.filter(v => {
                        if (!v.visitId) return false;
                        // Sprawdź czy visitId ma format VIS + data dzisiejsza
                        const visitDatePart = v.visitId.substring(3, 9); // YYMMDD
                        const todayDatePart = `${year}${month}${day}`;
                        return visitDatePart === todayDatePart;
                    });
                    
                    const visitCounter = todayVisits.length + 1;
                    const visitId = `VIS${year}${month}${day}${visitCounter.toString().padStart(3, '0')}`;
                    
                    // Utwórz obiekt wizyty
                    const newVisit = {
                        visitId,
                        visitNumber: visitCounter,
                        type: updateData.visitType || 'repair', // diagnosis, repair, installation, control
                        status: 'scheduled',
                        scheduledDate: updateData.scheduledDate,
                        scheduledTime: updateData.scheduledTime,
                        date: updateData.scheduledDate,
                        time: updateData.scheduledTime,
                        assignedTo: updateData.assignedTo,
                        technicianId: updateData.assignedTo,
                        technicianName,
                        estimatedDuration: updateData.estimatedDuration || 60,
                        notes: [],
                        createdAt: now.toISOString(),
                        createdBy: 'planner-system',
                        updatedAt: now.toISOString(),
                        statusHistory: [],
                        partPhotos: [],
                        allPhotos: []
                    };
                    
                    console.log(`🏗️ Tworzę obiekt wizyty:`, JSON.stringify(newVisit, null, 2));
                    
                    // Dodaj wizytę do updateData
                    updateData.visits = [newVisit];
                    
                    console.log(`📦 updateData.visits ustawione na:`, JSON.stringify(updateData.visits, null, 2));
                    
                    // 📋 AUTO-ZMIANA STATUSU: Zmień status na 'scheduled' gdy dodajemy wizytę
                    updateData.status = 'scheduled';
                    console.log(`✅ Utworzono wizytę ${visitId} dla technika ${technicianName}`);
                    console.log(`📌 Zmieniono status zlecenia na: scheduled`);
                } else {
                    // 🔄 Aktualizacja istniejącej wizyty - zaktualizuj datę i czas
                    if (existingOrder.visits && existingOrder.visits.length > 0) {
                        const updatedVisits = existingOrder.visits.map(visit => ({
                            ...visit,
                            scheduledDate: updateData.scheduledDate || visit.scheduledDate,
                            scheduledTime: updateData.scheduledTime || visit.scheduledTime,
                            date: updateData.scheduledDate || visit.date, // ⚡ KLUCZOWE!
                            time: updateData.scheduledTime || visit.time,
                            estimatedDuration: updateData.estimatedDuration || visit.estimatedDuration,
                            updatedAt: new Date().toISOString()
                        }));
                        updateData.visits = updatedVisits;
                        console.log(`🔄 Zaktualizowano wizytę: date=${updateData.scheduledDate}, time=${updateData.scheduledTime}`);
                    }
                    
                    if (!updateData.status) {
                        updateData.status = 'scheduled';
                        console.log(`📌 Zlecenie ma już wizytę, status ustawiony na: scheduled`);
                    }
                }
            }
            
            // 🔄 COFNIĘCIE Z KALENDARZA: Jeśli usuwamy przypisanie, zmień status na 'unscheduled'
            if (updateData.assignedTo === null || updateData.assignedTo === '' || 
                (updateData.hasOwnProperty('scheduledDate') && !updateData.scheduledDate)) {
                updateData.status = 'unscheduled';
                // Usuń wizytę jeśli była
                if (existingOrder.visits && existingOrder.visits.length > 0) {
                    updateData.visits = [];
                    console.log(`🔄 Usunięto wizytę, status zmieniony na: unscheduled`);
                }
            }
            
            // Zaktualizuj tylko podane pola
            const updatedOrder = {
                ...existingOrder,
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            
            // Zapisz przy użyciu patchOrder
            const success = await patchOrder(id, updateData);
            
            if (success) {
                console.log(`✅ Order ${id} patched successfully`);
                return res.status(200).json({ 
                    success: true,
                    order: updatedOrder,
                    message: 'Zamówienie zaktualizowane'
                });
            } else {
                console.error(`❌ Failed to patch order ${id}`);
                return res.status(500).json({ 
                    success: false,
                    message: 'Błąd aktualizacji zamówienia' 
                });
            }
        } catch (error) {
            console.error('❌ Error patching order:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Błąd aktualizacji zamówienia',
                error: error.message
            });
        }
    }

    if (req.method === 'PUT') {
        try {
            const orderData = req.body;
            console.log(`📝 Updating order ${id}`);
            
            // Pełna aktualizacja zamówienia
            orderData.updatedAt = new Date().toISOString();
            
            const success = await updateOrder(id, orderData);
            
            if (success) {
                console.log(`✅ Order ${id} updated successfully`);
                return res.status(200).json({ 
                    success: true,
                    order: orderData,
                    message: 'Zamówienie zaktualizowane'
                });
            } else {
                console.error(`❌ Failed to update order ${id}`);
                return res.status(404).json({ 
                    success: false,
                    message: 'Zamówienie nie znalezione' 
                });
            }
        } catch (error) {
            console.error('❌ Error updating order:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Błąd aktualizacji zamówienia',
                error: error.message
            });
        }
    }

    if (req.method === 'DELETE') {
        try {
            console.log(`🗑️ Deleting order ${id}`);
            
            const success = await deleteOrder(id);
            
            if (success) {
                console.log(`✅ Order ${id} deleted successfully`);
                return res.status(200).json({ 
                    success: true,
                    message: 'Zamówienie usunięte'
                });
            } else {
                console.error(`❌ Failed to delete order ${id}`);
                return res.status(404).json({ 
                    success: false,
                    message: 'Zamówienie nie znalezione' 
                });
            }
        } catch (error) {
            console.error('❌ Error deleting order:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Błąd usuwania zamówienia',
                error: error.message
            });
        }
    }

    // Nieobsługiwana metoda
    res.setHeader('Allow', ['GET', 'PATCH', 'PUT', 'DELETE']);
    return res.status(405).json({ 
        success: false,
        message: `Metoda ${req.method} nie jest obsługiwana` 
    });
}
