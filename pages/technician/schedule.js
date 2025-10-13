// pages/technician/schedule.js
// 📅 Harmonogram pracy technika - timeline z osią czasu (15 min)

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TechnicianLayout from '../../components/TechnicianLayout';

export default function TechnicianSchedule() {
  const router = useRouter();
  const [employee, setEmployee] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [stats, setStats] = useState(null);
  const [incentives, setIncentives] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 🆕 Wizyty/zlecenia technika
  const [visits, setVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(false);
  
  // Tydzień (domyślnie bieżący)
  const [currentWeekStart, setCurrentWeekStart] = useState(null);
  
  // Dodawanie slotu
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedStartTime, setSelectedStartTime] = useState('08:00');
  const [selectedEndTime, setSelectedEndTime] = useState('16:00');
  const [slotType, setSlotType] = useState('work'); // 'work' or 'break'
  const [slotNotes, setSlotNotes] = useState('');
  
  // Zaznaczanie myszką
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingDay, setDrawingDay] = useState(null);
  const [drawStartY, setDrawStartY] = useState(null);
  const [drawEndY, setDrawEndY] = useState(null);
  const [drawMode, setDrawMode] = useState('work'); // 'work' or 'break'
  
  // Toast notifications
  const [toast, setToast] = useState(null);

  const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
  const dayNamesShort = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Auth & Load
  useEffect(() => {
    const token = localStorage.getItem('technicianToken');
    const employeeData = localStorage.getItem('technicianEmployee');

    if (!token || !employeeData) {
      router.push('/technician/login');
      return;
    }

    try {
      const emp = JSON.parse(employeeData);
      setEmployee(emp);
      
      // Oblicz poniedziałek bieżącego tygodnia
      // ⚠️ CRITICAL: Używamy daty lokalnej z przeglądarki (nie UTC!)
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const day = now.getDate();
      const localNow = new Date(year, month, day, 12, 0, 0); // Noon lokalne
      
      const dayOfWeek = localNow.getDay(); // 0=Nd, 1=Pn, ..., 6=So
      console.log('🗓️ Today:', localNow.toDateString(), 'Day of week:', dayOfWeek, ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'][dayOfWeek]);
      
      // Oblicz offset do poniedziałku: jeśli Niedziela (0) → -6 dni wstecz, w przeciwnym razie -(dayOfWeek-1)
      const daysToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
      const monday = new Date(localNow);
      monday.setDate(localNow.getDate() + daysToMonday);
      const weekStart = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      
      console.log('📅 Calculated weekStart:', weekStart);
      setCurrentWeekStart(weekStart);
      loadSchedule(token, weekStart);
      loadVisits(token); // 🆕 Załaduj wizyty
    } catch (err) {
      console.error('❌ Auth error:', err);
      router.push('/technician/login');
    }
  }, [router]);

  // 🆕 Auto-refresh wizyt co 30 sekund
  useEffect(() => {
    const token = localStorage.getItem('technicianToken');
    if (!token) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh wizyt...');
      loadVisits(token);
    }, 30000); // 30 sekund

    return () => clearInterval(interval);
  }, []);

  // 🆕 Nasłuchuj na zmiany wizyt (np. z intelligent-planner)
  useEffect(() => {
    const handleVisitsChanged = () => {
      console.log('🔔 Wykryto zmianę wizyt - odświeżam kalendarz...');
      const token = localStorage.getItem('technicianToken');
      if (token) {
        loadVisits(token);
      }
    };

    // Nasłuchuj na custom event
    window.addEventListener('visitsChanged', handleVisitsChanged);
    
    // Nasłuchuj na focus - odśwież gdy użytkownik wraca do zakładki
    window.addEventListener('focus', handleVisitsChanged);

    return () => {
      window.removeEventListener('visitsChanged', handleVisitsChanged);
      window.removeEventListener('focus', handleVisitsChanged);
    };
  }, []);

  const loadSchedule = async (token, weekStart) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/technician/work-schedule?weekStart=${weekStart}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        setSchedule(data.schedule);
        setStats(data.stats);
        setIncentives(data.incentives);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('❌ Load error:', err);
      setError('Nie udało się załadować harmonogramu');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Ładowanie wizyt technika
  const loadVisits = async (token) => {
    setVisitsLoading(true);
    
    try {
      const res = await fetch('/api/technician/visits', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        console.log(`📅 Załadowano ${data.visits.length} wizyt`);
        
        // 🔍 DEBUG: Sprawdź czy są duplikaty w danych z API
        const visitIds = data.visits.map(v => v.visitId);
        const uniqueIds = [...new Set(visitIds)];
        if (visitIds.length !== uniqueIds.length) {
          console.error(`⚠️ API zwróciło DUPLIKATY wizyt:`, {
            total: visitIds.length,
            unique: uniqueIds.length,
            duplicates: visitIds.filter((id, idx) => visitIds.indexOf(id) !== idx)
          });
          
          // Pokaż szczegóły duplikatów
          const duplicateIds = visitIds.filter((id, idx) => visitIds.indexOf(id) !== idx);
          duplicateIds.forEach(dupId => {
            const dupVisits = data.visits.filter(v => v.visitId === dupId);
            console.error(`   Wizyta ${dupId} występuje ${dupVisits.length}x:`, dupVisits);
          });
        } else {
          console.log(`✅ Wszystkie wizyty są unikalne`);
        }
        
        // Lista wizyt z datami
        console.table(data.visits.map(v => ({
          visitId: v.visitId,
          date: v.scheduledDate || v.date,
          time: v.time,
          status: v.status,
          client: v.clientName
        })));
        
        setVisits(data.visits || []);
      } else {
        console.error('❌ Błąd ładowania wizyt:', data.message);
      }
    } catch (err) {
      console.error('❌ Error loading visits:', err);
    } finally {
      setVisitsLoading(false);
    }
  };

  const handleAddSlot = async () => {
    if (selectedDay === null) {
      alert('Wybierz dzień tygodnia');
      return;
    }

    if (!currentWeekStart) {
      alert('Błąd: Brak daty tygodnia. Odśwież stronę.');
      return;
    }

    const token = localStorage.getItem('technicianToken');

    const slotData = {
      dayOfWeek: selectedDay,
      startTime: selectedStartTime,
      endTime: selectedEndTime,
      type: slotType,
      notes: slotNotes
    };

    try {
      const res = await fetch('/api/technician/work-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          slotData: slotData,
          weekStart: currentWeekStart
        })
      });

      const data = await res.json();

      if (data.success) {
        // Płynna aktualizacja bez alertów
        setSchedule(data.schedule || schedule);
        setStats(data.stats);
        setIncentives(data.incentives);
        setIsAddingSlot(false);
        setSlotNotes('');
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (err) {
      console.error('❌ Add error:', err);
      alert('Nie udało się dodać slotu');
    }
  };

  // Stan dla potwierdzenia usunięcia
  const [slotToDelete, setSlotToDelete] = useState(null);

  const handleDeleteSlot = async (slotId) => {
    // Jeśli to już drugi klik na ten sam slot - usuń
    if (slotToDelete === slotId) {
      if (!currentWeekStart) {
        showToast('❌ Błąd: Brak daty tygodnia', 'error');
        return;
      }

      const token = localStorage.getItem('technicianToken');

      try {
        const res = await fetch(`/api/technician/work-schedule?slotId=${slotId}&weekStart=${currentWeekStart}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await res.json();

        if (data.success) {
          // Płynna aktualizacja bez przeładowania
          setSchedule(data.schedule);
          setStats(data.stats);
          setIncentives(data.incentives);
          showToast('🗑️ Slot usunięty');
          setSlotToDelete(null);
        } else {
          // Jeśli slot nie został znaleziony, odśwież harmonogram z serwera
          if (data.error === 'SLOT_NOT_FOUND' || data.error === 'NOT_FOUND') {
            showToast('⚠️ Slot już nie istnieje - odświeżam...', 'warning');
            const token = localStorage.getItem('technicianToken');
            await loadSchedule(token, currentWeekStart);
            setSlotToDelete(null);
          } else {
            showToast('❌ ' + data.message, 'error');
          }
        }
      } catch (err) {
        console.error('❌ Delete error:', err);
        showToast('❌ Nie udało się usunąć slotu', 'error');
      }
    } else {
      // Pierwszy klik - zaznacz do usunięcia
      setSlotToDelete(slotId);
      showToast('⚠️ Kliknij ponownie aby usunąć', 'info');
      
      // Resetuj po 3 sekundach
      setTimeout(() => setSlotToDelete(null), 3000);
    }
  };

  const handleCopyPreviousWeek = async () => {
    if (!confirm('Skopiować harmonogram z poprzedniego tygodnia?')) return;

    if (!currentWeekStart) {
      alert('Błąd: Brak daty tygodnia. Odśwież stronę.');
      return;
    }

    const token = localStorage.getItem('technicianToken');

    try {
      const res = await fetch('/api/technician/work-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'copy_previous_week',
          weekStart: currentWeekStart
        })
      });

      const data = await res.json();

      if (data.success) {
        setSchedule(data.schedule);
        setStats(data.stats);
        setIncentives(data.incentives);
        alert('✅ Harmonogram skopiowany!');
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (err) {
      console.error('❌ Copy error:', err);
      alert('Nie udało się skopiować harmonogramu');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('technicianToken');
    localStorage.removeItem('technicianEmployee');
    router.push('/technician/login');
  };

  const changeWeek = (direction) => {
    if (!currentWeekStart) {
      alert('Błąd: Brak daty tygodnia. Odśwież stronę.');
      return;
    }

    const currentDate = new Date(currentWeekStart);
    currentDate.setDate(currentDate.getDate() + (direction * 7));
    const newWeekStart = currentDate.toISOString().split('T')[0];
    setCurrentWeekStart(newWeekStart);
    
    const token = localStorage.getItem('technicianToken');
    loadSchedule(token, newWeekStart);
    loadVisits(token); // 🆕 Odśwież też wizyty
  };

  // Generuj wszystkie 15-minutowe interwały (00:00 - 23:45)
  const generateTimeSlots = () => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hour = h.toString().padStart(2, '0');
        const minute = m.toString().padStart(2, '0');
        slots.push(`${hour}:${minute}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Konwertuj czas do pixeli (dla wizualizacji)
  const timeToPixels = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    return (totalMinutes / 1440) * 100; // % wysokości dnia (1440 minut = 24h)
  };

  // Konwertuj pixele (%) do czasu
  const pixelsToTime = (percent) => {
    const totalMinutes = Math.round((percent / 100) * 1440);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor((totalMinutes % 60) / 15) * 15; // Zaokrąglij do 15 min
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Konwertuj czas (HH:MM) do minut
  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Obsługa rysowania myszką
  const handleMouseDown = (e, dayIndex) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentY = (y / rect.height) * 100;
    
    setIsDrawing(true);
    setDrawingDay(dayIndex);
    setDrawStartY(percentY);
    setDrawEndY(percentY);
  };

  const handleMouseMove = (e, dayIndex) => {
    if (!isDrawing || drawingDay !== dayIndex) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentY = Math.max(0, Math.min(100, (y / rect.height) * 100));
    
    setDrawEndY(percentY);
  };

  const handleMouseUp = async (dayIndex) => {
    if (!isDrawing || drawingDay !== dayIndex) return;
    
    const startPercent = Math.min(drawStartY, drawEndY);
    const endPercent = Math.max(drawStartY, drawEndY);
    
    const startTime = pixelsToTime(startPercent);
    const endTime = pixelsToTime(endPercent);
    
    // Reset drawing state
    setIsDrawing(false);
    setDrawingDay(null);
    setDrawStartY(null);
    setDrawEndY(null);
    
    // Walidacja: sprawdź czy slot ma sensowną długość
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const duration = endMinutes - startMinutes;
    
    // Minimalna długość: 15 minut
    if (duration < 15) {
      console.log(`⚠️ Slot zbyt krótki: ${duration} minut (${startTime}-${endTime})`);
      return; // Pomijamy bez błędu
    }
    
    // Zapisz nowy slot
    await saveDrawnSlot(dayIndex, startTime, endTime);
  };

  const saveDrawnSlot = async (dayIndex, startTime, endTime) => {
    if (!currentWeekStart) {
      console.error('❌ currentWeekStart is null');
      alert('Błąd: Brak daty tygodnia. Odśwież stronę.');
      return;
    }

    // 🔍 LOGOWANIE: Co wysyłamy
    console.log(`📤 Saving slot: day=${dayIndex}, ${startTime}-${endTime}, type=${drawMode}`);

    // Sprawdź lokalnie czy slot się nakłada
    const targetArray = drawMode === 'break' ? schedule?.breaks : schedule?.workSlots;
    const existingSlots = targetArray?.filter(s => s.dayOfWeek === dayIndex) || [];
    
    const newStartMinutes = timeToMinutes(startTime);
    const newEndMinutes = timeToMinutes(endTime);
    
    // Dodatkowa walidacja
    if (newStartMinutes >= newEndMinutes) {
      console.error(`❌ INVALID TIME RANGE: ${startTime} >= ${endTime}`);
      showToast('❌ Nieprawidłowy czas: koniec nie może być przed początkiem', 'error');
      return;
    }
    
    // Sprawdź nakładanie
    for (const existing of existingSlots) {
      const existingStart = timeToMinutes(existing.startTime);
      const existingEnd = timeToMinutes(existing.endTime);
      
      // Sprawdź czy się nakładają
      if (newStartMinutes < existingEnd && newEndMinutes > existingStart) {
        console.log(`⚠️ Slot nakłada się z ${existing.startTime}-${existing.endTime} - pomijam zapis`);
        return; // Pomijamy bez błędu
      }
    }

    const token = localStorage.getItem('technicianToken');
    
    const slotData = {
      dayOfWeek: dayIndex,
      startTime,
      endTime,
      type: drawMode,
      notes: drawMode === 'work' ? 'Praca' : 'Przerwa'
    };

    const payload = {
      slotData: slotData,
      weekStart: currentWeekStart
    };
    
    console.log('📦 Payload:', JSON.stringify(payload));

    try {
      const res = await fetch('/api/technician/work-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (data.success) {
        // ✅ ZAWSZE używaj danych z serwera (źródło prawdy)
        setSchedule(data.schedule);
        setStats(data.stats);
        setIncentives(data.incentives);
        showToast(drawMode === 'work' ? '✅ Dodano blok pracy' : '☕ Dodano przerwę');
        
        // Dodatkowa weryfikacja - załaduj ponownie z API aby upewnić się że dane są aktualne
        console.log('✅ Slot saved, schedule updated from server');
      } else {
        // 🔍 LOGOWANIE BŁĘDU
        console.error(`❌ API Error: ${data.error}`, data);
        
        // Specjalna obsługa nakładania się slotów
        if (data.error === 'OVERLAP') {
          // Nie pokazuj toasta dla nakładania - to normalne podczas rysowania
          console.log('⚠️ Slot overlaps with existing slot - silently ignored');
        } else {
          // Wszystkie inne błędy - pokaż użytkownikowi
          showToast('❌ ' + data.message, 'error');
          // Odśwież dane z serwera
          const token = localStorage.getItem('technicianToken');
          await loadSchedule(token, currentWeekStart);
        }
      }
    } catch (err) {
      console.error('Error saving slot:', err);
      showToast('❌ Błąd podczas zapisywania', 'error');
      // Odśwież dane z serwera w przypadku błędu
      const token = localStorage.getItem('technicianToken');
      await loadSchedule(token, currentWeekStart);
    }
  };

  // Renderuj timeline dla jednego dnia
  const renderDayTimeline = (dayIndex) => {
    const workSlotsForDay = schedule?.workSlots?.filter(s => s.dayOfWeek === dayIndex) || [];
    const breaksForDay = schedule?.breaks?.filter(s => s.dayOfWeek === dayIndex) || [];
    
    // 📅 Oblicz datę dla tego dnia (dayIndex: 0=Niedziela, 1=Poniedziałek, ..., 6=Sobota)
    const getDateForDay = (dayIdx) => {
      if (!currentWeekStart) return null;
      const monday = new Date(currentWeekStart + 'T00:00:00'); // Force local timezone
      // currentWeekStart to poniedziałek (dayOfWeek=1)
      // Oblicz offset od poniedziałku: 
      // 1(Pn)=0, 2(Wt)=1, 3(Śr)=2, 4(Cz)=3, 5(Pt)=4, 6(So)=5, 0(Nd)=6
      let offset;
      if (dayIdx === 0) {
        offset = 6; // Niedziela - koniec tygodnia
      } else {
        offset = dayIdx - 1; // Poniedziałek-Sobota
      }
      const date = new Date(monday);
      date.setDate(monday.getDate() + offset);
      return date;
    };
    
    const dayDate = getDateForDay(dayIndex);
    const dayDateStr = dayDate ? `${dayDate.getDate()}.${dayDate.getMonth() + 1}` : '';
    
    // 🆕 Filtruj wizyty dla tego dnia (według DOKŁADNEJ daty, nie tylko dnia tygodnia)
    const visitsForDay = visits.filter(visit => {
      if (!visit.scheduledDate && !visit.date) return false;
      if (!dayDate) return false;
      
      const visitDate = new Date(visit.scheduledDate || visit.date);
      
      // Porównaj dokładną datę (rok, miesiąc, dzień) - ignoruj godziny
      const matches = (
        visitDate.getFullYear() === dayDate.getFullYear() &&
        visitDate.getMonth() === dayDate.getMonth() &&
        visitDate.getDate() === dayDate.getDate()
      );
      
      if (matches) {
        console.log(`✅ Wizyta ${visit.visitId} pasuje do ${dayNames[dayIndex]} (${dayDateStr}):`, {
          visitDate: visit.scheduledDate || visit.date,
          dayDate: dayDate.toISOString().split('T')[0]
        });
      }
      
      return matches;
    });
    
    // 🔍 DEBUG: Sprawdź czy są duplikaty
    const visitIds = visitsForDay.map(v => v.visitId);
    const uniqueIds = [...new Set(visitIds)];
    if (visitIds.length !== uniqueIds.length) {
      console.warn(`⚠️ DUPLIKATY dla ${dayNames[dayIndex]} (${dayDateStr}):`, {
        total: visitIds.length,
        unique: uniqueIds.length,
        ids: visitIds,
        duplicates: visitIds.filter((id, idx) => visitIds.indexOf(id) !== idx)
      });
    }

    return (
      <div key={dayIndex} className="flex-1 min-w-[80px] lg:min-w-[120px] border-r border-gray-200 last:border-r-0">
        {/* Nagłówek dnia */}
        <div className="sticky top-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white p-2 lg:p-3 text-center font-semibold shadow-sm z-10">
          <div className="text-[10px] lg:text-xs opacity-90">{dayNamesShort[dayIndex]}</div>
          <div className="text-xs lg:text-sm hidden sm:block">{dayNames[dayIndex]}</div>
          <div className="text-[10px] lg:text-xs opacity-75 mt-0.5">📅 {dayDateStr}</div>
        </div>

        {/* Timeline (siatka 15-minutowa) */}
        <div 
          className="relative h-[600px] lg:h-[1440px] bg-gray-50 cursor-crosshair touch-none"
          onMouseDown={(e) => handleMouseDown(e, dayIndex)}
          onMouseMove={(e) => handleMouseMove(e, dayIndex)}
          onMouseUp={() => handleMouseUp(dayIndex)}
          onMouseLeave={() => {
            if (isDrawing && drawingDay === dayIndex) {
              handleMouseUp(dayIndex);
            }
          }}
        >
          {/* Siatka godzin */}
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="absolute w-full border-t border-gray-200 pointer-events-none"
              style={{ top: `${(h / 24) * 100}%` }}
            >
              <span className="text-[9px] lg:text-xs text-gray-400 ml-0.5 lg:ml-1">{h.toString().padStart(2, '0')}:00</span>
            </div>
          ))}

          {/* Podgląd zaznaczanego obszaru */}
          {isDrawing && drawingDay === dayIndex && drawStartY !== null && drawEndY !== null && (
            <div
              className="absolute w-full pointer-events-none z-30"
              style={{
                top: `${Math.min(drawStartY, drawEndY)}%`,
                height: `${Math.abs(drawEndY - drawStartY)}%`,
                background: drawMode === 'work' 
                  ? 'linear-gradient(to right, rgba(74, 222, 128, 0.5), rgba(34, 197, 94, 0.5))'
                  : 'linear-gradient(to right, rgba(251, 146, 60, 0.5), rgba(249, 115, 22, 0.5))',
                border: drawMode === 'work' ? '2px dashed #10b981' : '2px dashed #f97316',
                borderRadius: '8px'
              }}
            >
              <div className="text-center text-xs font-semibold text-white pt-2">
                {drawMode === 'work' ? '💼 Praca' : '☕ Przerwa'}
              </div>
            </div>
          )}

          {/* Sloty pracy (zielone) */}
          {workSlotsForDay.map(slot => (
            <div
              key={slot.id}
              className="absolute w-full px-1 cursor-pointer group z-20 pointer-events-auto"
              style={{
                top: `${timeToPixels(slot.startTime)}%`,
                height: `${timeToPixels(slot.endTime) - timeToPixels(slot.startTime)}%`
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteSlot(slot.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className={`h-full rounded-lg shadow-md border-2 flex flex-col justify-center items-center text-white text-[10px] lg:text-xs font-semibold p-1 lg:p-2 transition-all ${
                slotToDelete === slot.id 
                  ? 'bg-gradient-to-r from-red-400 to-red-500 border-red-600 animate-pulse'
                  : 'bg-gradient-to-r from-green-400 to-green-500 border-green-600 group-hover:from-red-400 group-hover:to-red-500 group-hover:border-red-600'
              }`}>
                <div className={slotToDelete === slot.id ? 'block' : 'group-hover:hidden'}>
                  {slotToDelete === slot.id ? (
                    <div className="text-[9px] lg:text-xs">⚠️ Kliknij ponownie</div>
                  ) : (
                    <>
                      <div className="text-sm lg:text-base">💼</div>
                      <div className="text-[9px] lg:text-xs">{slot.startTime}</div>
                      <div className="text-[9px] lg:text-xs">{slot.endTime}</div>
                      <div className="text-[8px] lg:text-[10px] opacity-80 hidden lg:block">{slot.duration} min</div>
                    </>
                  )}
                </div>
                <div className={slotToDelete === slot.id ? 'hidden' : 'hidden group-hover:block'}>
                  <div>🗑️ Usuń</div>
                </div>
              </div>
            </div>
          ))}

          {/* Przerwy (pomarańczowe) */}
          {breaksForDay.map(breakSlot => (
            <div
              key={breakSlot.id}
              className="absolute w-full px-1 cursor-pointer group z-20 pointer-events-auto"
              style={{
                top: `${timeToPixels(breakSlot.startTime)}%`,
                height: `${timeToPixels(breakSlot.endTime) - timeToPixels(breakSlot.startTime)}%`
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteSlot(breakSlot.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className={`h-full rounded-lg shadow-md border-2 flex flex-col justify-center items-center text-white text-[10px] lg:text-xs font-semibold p-1 lg:p-2 transition-all ${
                slotToDelete === breakSlot.id 
                  ? 'bg-gradient-to-r from-red-400 to-red-500 border-red-600 animate-pulse'
                  : 'bg-gradient-to-r from-orange-300 to-orange-400 border-orange-500 group-hover:from-red-400 group-hover:to-red-500 group-hover:border-red-600'
              }`}>
                <div className={slotToDelete === breakSlot.id ? 'block' : 'group-hover:hidden'}>
                  {slotToDelete === breakSlot.id ? (
                    <div className="text-[9px] lg:text-xs">⚠️ Kliknij ponownie</div>
                  ) : (
                    <>
                      <div className="text-sm lg:text-base">☕</div>
                      <div className="text-[9px] lg:text-xs">{breakSlot.startTime}</div>
                      <div className="text-[9px] lg:text-xs">{breakSlot.endTime}</div>
                    </>
                  )}
                </div>
                <div className={slotToDelete === breakSlot.id ? 'hidden' : 'hidden group-hover:block'}>
                  <div>🗑️ Usuń</div>
                </div>
              </div>
            </div>
          ))}

          {/* 🆕 WIZYTY/ZLECENIA (niebieskie kafelki) */}
          {visitsForDay.map(visit => {
            const visitTime = visit.time || visit.scheduledTime || '09:00';
            const estimatedDuration = visit.estimatedDuration || 60; // domyślnie 60 min
            
            // Oblicz czas końca
            const [hours, minutes] = visitTime.split(':').map(Number);
            const startMinutes = hours * 60 + minutes;
            const endMinutes = startMinutes + estimatedDuration;
            const endHours = Math.floor(endMinutes / 60);
            const endMins = endMinutes % 60;
            const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
            
            // Kolor według statusu (zgodny z orderStatusConstants.js)
            const getStatusColor = (status) => {
              switch(status) {
                case 'pending': 
                  return 'from-yellow-400 to-yellow-500 border-yellow-600'; // ⏳ Oczekuje na kontakt
                case 'contacted': 
                  return 'from-blue-400 to-blue-500 border-blue-600'; // 📞 Skontaktowano się
                case 'unscheduled': 
                  return 'from-orange-400 to-orange-500 border-orange-600'; // 📦 Nieprzypisane
                case 'scheduled': 
                  return 'from-purple-400 to-purple-500 border-purple-600'; // 📅 Umówiona wizyta
                case 'confirmed': 
                  return 'from-green-400 to-green-500 border-green-600'; // ✅ Potwierdzona
                case 'in_progress': 
                  return 'from-indigo-400 to-indigo-500 border-indigo-600'; // 🔧 W trakcie realizacji
                case 'waiting_parts': 
                  return 'from-amber-400 to-amber-500 border-amber-600'; // 🔩 Oczekuje na części
                case 'ready': 
                  return 'from-teal-400 to-teal-500 border-teal-600'; // 🎉 Gotowe do odbioru
                case 'completed': 
                  return 'from-emerald-400 to-emerald-500 border-emerald-600'; // ✔️ Zakończone
                case 'cancelled': 
                  return 'from-red-400 to-red-500 border-red-600'; // ❌ Anulowane
                case 'no_show': 
                  return 'from-gray-400 to-gray-500 border-gray-600'; // 👻 Nie stawił się
                default: 
                  return 'from-slate-400 to-slate-500 border-slate-600'; // Nieznany status
              }
            };
            
            // Ikona i label statusu
            const getStatusInfo = (status) => {
              switch(status) {
                case 'pending': return { icon: '⏳', label: 'Oczekuje na kontakt' };
                case 'contacted': return { icon: '📞', label: 'Skontaktowano się' };
                case 'unscheduled': return { icon: '📦', label: 'Nieprzypisane' };
                case 'scheduled': return { icon: '📅', label: 'Umówiona wizyta' };
                case 'confirmed': return { icon: '✅', label: 'Potwierdzona' };
                case 'in_progress': return { icon: '🔧', label: 'W trakcie realizacji' };
                case 'waiting_parts': return { icon: '🔩', label: 'Oczekuje na części' };
                case 'ready': return { icon: '🎉', label: 'Gotowe do odbioru' };
                case 'completed': return { icon: '✔️', label: 'Zakończone' };
                case 'cancelled': return { icon: '❌', label: 'Anulowane' };
                case 'no_show': return { icon: '👻', label: 'Nie stawił się' };
                default: return { icon: '📋', label: 'Nieznany' };
              }
            };
            
            const statusInfo = getStatusInfo(visit.status);
            
            return (
              <div
                key={visit.visitId || visit.orderId}
                className="absolute w-full px-1 cursor-pointer group z-25 pointer-events-auto"
                style={{
                  top: `${timeToPixels(visitTime)}%`,
                  height: `${timeToPixels(endTime) - timeToPixels(visitTime)}%`,
                  minHeight: '40px'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/technician/visit/${visit.visitId || visit.orderId}`);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                title={`${statusInfo.icon} ${statusInfo.label}\n${visit.clientName}\n${visit.deviceType || visit.device}\n${visit.orderNumber}\n${visitTime} - ${endTime} (${estimatedDuration} min)`}
              >
                <div className={`h-full rounded-lg shadow-lg border-2 flex flex-col justify-start items-start text-white text-[9px] lg:text-xs font-semibold p-1.5 lg:p-2 transition-all bg-gradient-to-r ${getStatusColor(visit.status)} group-hover:scale-[1.02] group-hover:shadow-xl`}>
                  <div className="flex items-center justify-between w-full mb-0.5">
                    <div className="text-[10px] lg:text-xs font-bold truncate flex-1">
                      {visit.clientName}
                    </div>
                    <div className="text-xs lg:text-sm ml-1">
                      {statusInfo.icon}
                    </div>
                  </div>
                  <div className="text-[8px] lg:text-[10px] opacity-90 truncate w-full">
                    {visit.deviceType || visit.device}
                  </div>
                  <div className="text-[8px] lg:text-[10px] opacity-80">
                    {visitTime} - {endTime}
                  </div>
                  <div className="text-[7px] lg:text-[9px] opacity-70 truncate w-full">
                    {visit.orderNumber}
                  </div>
                  {/* Status badge (pokazuje się na hover) */}
                  <div className="hidden group-hover:block absolute bottom-1 right-1 bg-black bg-opacity-70 rounded px-1.5 py-0.5 text-[7px] lg:text-[9px]">
                    {statusInfo.label}
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie harmonogramu...</p>
        </div>
      </div>
    );
  }

  return (
    <TechnicianLayout employee={employee} currentPage="schedule">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-4xl font-bold text-gray-800 mb-2">
            📅 Harmonogram Pracy
          </h1>
          <p className="text-sm lg:text-base text-gray-600">
            Ustaw swoje godziny dostępności • Więcej godzin = więcej zleceń i zarobków! 💰
          </p>
        </div>

        {/* Statystyki + Gamifikacja */}
        {stats && incentives && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Statystyki tygodnia */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Ten tydzień</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Godziny pracy:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {stats.totalHours}h {stats.totalMinutes}min
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Dni z pracą:</span>
                  <span className="text-xl font-semibold text-green-600">{stats.daysPerWeek}/7</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Średnio/dzień:</span>
                  <span className="text-lg font-semibold text-purple-600">{stats.averageHoursPerDay}h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Przerwy:</span>
                  <span className="text-sm text-orange-600">{stats.breakHours}h {stats.breakMinutes}min</span>
                </div>
              </div>
            </div>

            {/* Potencjalne zarobki */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6 border-2 border-green-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 Zarobki (szacowane)</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Tygodniowy przychód:</p>
                  <p className="text-3xl font-bold text-green-600">{incentives.weeklyEarnings} PLN</p>
                </div>
                {incentives.bonus > 0 && (
                  <div className="bg-yellow-100 rounded-lg p-3 border border-yellow-300">
                    <p className="text-sm font-semibold text-yellow-800">{incentives.bonusDescription}</p>
                    <p className="text-2xl font-bold text-yellow-600">+{incentives.bonus} PLN</p>
                  </div>
                )}
                <div className="border-t border-green-300 pt-3">
                  <p className="text-sm text-gray-600">Razem z bonusem:</p>
                  <p className="text-3xl font-bold text-green-700">{incentives.totalWithBonus} PLN</p>
                </div>
                {incentives.potentialExtraHours > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-blue-600">
                      💡 Dodaj {incentives.potentialExtraHours}h więcej = +{incentives.potentialExtraEarnings} PLN
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Motywacja + Badges */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-6 border-2 border-purple-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🏆 Osiągnięcia</h3>
              <div className="mb-4 p-3 bg-white rounded-lg border border-purple-200">
                <p className="text-sm font-semibold text-purple-700">{incentives.motivationMessage}</p>
              </div>
              <div className="space-y-2">
                {incentives.badges.length > 0 ? (
                  incentives.badges.map((badge, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-purple-200">
                      <span className="text-2xl">{badge.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-800">{badge.name}</p>
                        <p className="text-xs text-gray-600">{badge.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">Dodaj więcej godzin aby zdobyć odznaki!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Nawigacja tygodnia */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex items-center justify-between">
          <button
            onClick={() => changeWeek(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            ← Poprzedni tydzień
          </button>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">Tydzień od</p>
            <p className="text-xl font-bold text-gray-800">{currentWeekStart}</p>
          </div>

          <button
            onClick={() => changeWeek(1)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Następny tydzień →
          </button>
        </div>

        {/* Tryb rysowania */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 text-white">
            <div>
              <h3 className="font-semibold text-base lg:text-lg mb-1">🖱️ Tryb rysowania</h3>
              <p className="text-xs lg:text-sm opacity-90">Zaznacz obszar na osi czasu</p>
            </div>
            <div className="flex gap-2 lg:gap-3">
              <button
                onClick={() => setDrawMode('work')}
                className={`flex-1 lg:flex-none px-4 lg:px-6 py-2 lg:py-3 rounded-lg text-sm lg:text-base font-semibold transition-all ${
                  drawMode === 'work'
                    ? 'bg-white text-green-600 shadow-lg scale-105'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                💼 Praca
              </button>
              <button
                onClick={() => setDrawMode('break')}
                className={`flex-1 lg:flex-none px-4 lg:px-6 py-2 lg:py-3 rounded-lg text-sm lg:text-base font-semibold transition-all ${
                  drawMode === 'break'
                    ? 'bg-white text-orange-600 shadow-lg scale-105'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                ☕ Przerwa
              </button>
            </div>
          </div>
        </div>

        {/* Akcje */}
        <div className="bg-white rounded-xl shadow-lg p-3 lg:p-4 mb-6 flex flex-col sm:flex-row gap-2 lg:gap-4">
          <button
            onClick={() => setIsAddingSlot(true)}
            className="flex-1 px-4 lg:px-6 py-2 lg:py-3 text-sm lg:text-base bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md font-semibold"
          >
            ➕ Dodaj blok pracy
          </button>
          
          <button
            onClick={handleCopyPreviousWeek}
            className="flex-1 px-4 lg:px-6 py-2 lg:py-3 text-sm lg:text-base bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md font-semibold"
          >
            📋 Kopiuj poprzedni
          </button>
        </div>

        {/* Timeline (7 dni) */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="flex overflow-x-auto">
            {[1, 2, 3, 4, 5, 6, 0].map(dayIndex => renderDayTimeline(dayIndex))}
          </div>
        </div>

        {/* Legenda statusów wizyt */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">🎨 Kolory statusów wizyt</h4>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-blue-600 font-semibold">{visits.length} wizyt</span>
              {visitsLoading && <span className="text-xs text-gray-400 animate-pulse">🔄 Odświeżanie...</span>}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded border-2 border-yellow-600 flex items-center justify-center text-xs">⏳</div>
              <span className="text-xs text-gray-600">Oczekuje</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-blue-500 rounded border-2 border-blue-600 flex items-center justify-center text-xs">📞</div>
              <span className="text-xs text-gray-600">Kontakt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-purple-500 rounded border-2 border-purple-600 flex items-center justify-center text-xs">📅</div>
              <span className="text-xs text-gray-600">Umówiona</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-green-500 rounded border-2 border-green-600 flex items-center justify-center text-xs">✅</div>
              <span className="text-xs text-gray-600">Potwierdz.</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-indigo-400 to-indigo-500 rounded border-2 border-indigo-600 flex items-center justify-center text-xs">🔧</div>
              <span className="text-xs text-gray-600">W trakcie</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-amber-400 to-amber-500 rounded border-2 border-amber-600 flex items-center justify-center text-xs">🔩</div>
              <span className="text-xs text-gray-600">Części</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-teal-400 to-teal-500 rounded border-2 border-teal-600 flex items-center justify-center text-xs">🎉</div>
              <span className="text-xs text-gray-600">Gotowe</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded border-2 border-emerald-600 flex items-center justify-center text-xs">✔️</div>
              <span className="text-xs text-gray-600">Zakończ.</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-red-400 to-red-500 rounded border-2 border-red-600 flex items-center justify-center text-xs">❌</div>
              <span className="text-xs text-gray-600">Anulowane</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-gray-400 to-gray-500 rounded border-2 border-gray-600 flex items-center justify-center text-xs">👻</div>
              <span className="text-xs text-gray-600">Nie przysz.</span>
            </div>
          </div>
        </div>

        {/* Legenda ogólna */}
        <div className="mt-4 bg-white rounded-xl shadow-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">ℹ️ Jak korzystać?</h4>
          <div className="flex gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-green-500 rounded border-2 border-green-600"></div>
              <span className="text-sm text-gray-600">� Blok pracy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-orange-300 to-orange-400 rounded border-2 border-orange-500"></div>
              <span className="text-sm text-gray-600">☕ Przerwa</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">🖱️ <strong>Zaznacz myszką</strong> na osi czasu aby dodać blok</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">🗑️ Kliknij slot aby usunąć</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">🔧 Kliknij wizytę aby zobaczyć szczegóły</span>
            </div>
          </div>
        </div>

      {/* Modal dodawania slotu */}
      {isAddingSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">➕ Dodaj blok czasowy</h3>
            
            <div className="space-y-4">
              {/* Typ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Typ:</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSlotType('work')}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                      slotType === 'work'
                        ? 'bg-green-500 text-white shadow-md'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    💼 Praca
                  </button>
                  <button
                    onClick={() => setSlotType('break')}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                      slotType === 'break'
                        ? 'bg-orange-400 text-white shadow-md'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    ☕ Przerwa
                  </button>
                </div>
              </div>

              {/* Dzień */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dzień:</label>
                <select
                  value={selectedDay !== null ? selectedDay : ''}
                  onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                >
                  <option value="">Wybierz dzień</option>
                  {[1, 2, 3, 4, 5, 6, 0].map(dayIdx => (
                    <option key={dayIdx} value={dayIdx}>{dayNames[dayIdx]}</option>
                  ))}
                </select>
              </div>

              {/* Czas Start */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Od:</label>
                <select
                  value={selectedStartTime}
                  onChange={(e) => setSelectedStartTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                >
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              {/* Czas End */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Do:</label>
                <select
                  value={selectedEndTime}
                  onChange={(e) => setSelectedEndTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                >
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              {/* Notatki */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notatki (opcjonalne):</label>
                <input
                  type="text"
                  value={slotNotes}
                  onChange={(e) => setSlotNotes(e.target.value)}
                  placeholder="np. Wizyta u klienta, Przegląd..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>
            </div>

            {/* Przyciski */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsAddingSlot(false)}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
              >
                Anuluj
              </button>
              <button
                onClick={handleAddSlot}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md font-semibold"
              >
                Dodaj ✅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div 
          className="fixed top-4 right-4 z-[100] transition-all duration-300 ease-out"
          style={{
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <div className={`px-6 py-4 rounded-lg shadow-2xl border-2 flex items-center gap-3 backdrop-blur-sm ${
            toast.type === 'error' 
              ? 'bg-red-500 border-red-600 text-white' 
              : toast.type === 'info'
              ? 'bg-blue-500 border-blue-600 text-white'
              : 'bg-green-500 border-green-600 text-white'
          }`}>
            <span className="text-xl">
              {toast.type === 'error' ? '❌' : toast.type === 'info' ? '⚠️' : '✅'}
            </span>
            <span className="font-semibold">{toast.message}</span>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </TechnicianLayout>
  );
}
