# 🏭 RESET SYSTEMU I NOWI KLIENCI

**Data:** 2025-10-04  
**Status:** ✅ ZAKOŃCZONO

---

## 🎯 CEL

Wyczyszczenie starego systemu (wizyty, zlecenia, klienci) i wygenerowanie nowych, realistycznych danych dla miast: **Dębica**, **Ropczyce**, **Mielec**.

---

## ✅ CO ZROBIONO

### **1. Wyczyszczono stare dane**
- ✅ `data/visits.json` - nie istniał (OK)
- ✅ `data/orders.json` - wyczyszczono (było pusto)
- ✅ `data/clients.json` - usunięto starych klientów

### **2. Wygenerowano 18 nowych klientów**

#### **Dębica (6 klientów):**
1. **Jan Kowalski** - ul. Krakowska 15/3, 39-200 Dębica
2. **Anna Nowak** - ul. Piłsudskiego 28, 39-200 Dębica
3. **Piotr Wiśniewski** - ul. Rzeszowska 42/12, 39-200 Dębica
4. **Maria Wójcik** - ul. Ogrodowa 7/5, 39-200 Dębica
5. **Firma TECH-AGD Sp. z o.o.** 🏢 - ul. Przemysłowa 10, 39-200 Dębica
6. **Tomasz Kamiński** - ul. Słoneczna 22, 39-200 Dębica

#### **Ropczyce (5 klientów):**
7. **Katarzyna Lewandowska** - ul. Rynek 5/2, 39-100 Ropczyce
8. **Marek Zieliński** - ul. Kościuszki 18, 39-100 Ropczyce
9. **Agnieszka Szymańska** - ul. Dębicka 33/7, 39-100 Ropczyce
10. **Restaurant "Pod Kogutem"** 🏢 - ul. Mickiewicza 12, 39-100 Ropczyce
11. **Paweł Dąbrowski** - ul. Słowackiego 8, 39-100 Ropczyce

#### **Mielec (7 klientów):**
12. **Joanna Krawczyk** - ul. Żeromskiego 25/10, 39-300 Mielec
13. **Michał Piotrowski** - ul. Sienkiewicza 40, 39-300 Mielec
14. **Ewa Grabowska** - ul. Obrońców Pokoju 15/4, 39-300 Mielec
15. **Hotel PLAZA Mielec** 🏢 - ul. Legionów 55, 39-300 Mielec
16. **Robert Pawlak** - ul. Rejtana 30, 39-300 Mielec
17. **Centrum Medyczne MEDYK** 🏢 - ul. Kościuszki 88, 39-300 Mielec
18. **Barbara Król** - ul. Armii Krajowej 12/8, 39-300 Mielec

**Typy klientów:**
- 👤 Osoby prywatne: **14**
- 🏢 Firmy: **4**

### **3. Wygenerowano 44 zlecenia AGD**

#### **Statystyki zleceń:**

**Status:**
- ⏳ Oczekujące (`pending`): **13**
- 🔧 W trakcie (`in-progress`): **14**
- ✅ Zakończone (`completed`): **6**
- 📅 Zaplanowane (`scheduled`): **3**
- ❌ Anulowane (`cancelled`): **8**

**Miasto:**
- Dębica: **15 zleceń**
- Ropczyce: **11 zleceń**
- Mielec: **18 zleceń**

**Priorytet:**
- 🔴 Pilne (`urgent`): **2**
- 🟠 Wysokie (`high`): **8**
- 🟢 Normalne (`normal`): **34**

**Urządzenia AGD:**
- Lodówka, Pralka, Zmywarka, Piekarnik, Kuchenka
- Mikrofalówka, Okap, Płyta indukcyjna, Suszarka
- Zamrażarka, Ekspres do kawy

**Marki:**
- Bosch, Samsung, LG, Whirlpool, Electrolux, Beko
- Siemens, Amica, Sharp, Faber, DeLonghi, Philips, Krups

---

## 📁 ZMIENIONE PLIKI

| Plik | Zmiana |
|------|--------|
| `data/clients.json` | 18 nowych klientów z pełnymi danymi |
| `data/orders.json` | 44 nowe zlecenia |
| `scripts/reset-and-generate-clients.js` | Nowy skrypt generujący klientów |
| `scripts/generate-orders.js` | Nowy skrypt generujący zlecenia |

---

## 🔐 HASŁA KLIENTÓW

**Wszyscy klienci mają hasło:** `haslo123`

Hasła są **zahashowane bcrypt** i można się nimi zalogować do systemu klienta.

---

## 📊 PRZYKŁADOWE DANE

### **Przykład klienta (Jan Kowalski):**
```json
{
  "id": "CLI2025000001",
  "name": "Jan Kowalski",
  "phone": "146814523",
  "mobile": "512345678",
  "email": "jan.kowalski@gmail.com",
  "nip": "8721234567",
  "address": {
    "street": "ul. Krakowska",
    "buildingNumber": "15",
    "apartmentNumber": "3",
    "city": "Dębica",
    "postalCode": "39-200",
    "voivodeship": "Podkarpackie",
    "country": "Polska"
  },
  "type": "individual",
  "status": "active",
  "passwordHash": "$2a$10$...",
  "passwordSetAt": "2025-10-04T...",
  "requirePasswordChange": false,
  "isLocked": false,
  "failedLoginAttempts": 0
}
```

### **Przykład zlecenia (Piekarnik Siemens):**
```json
{
  "id": "ORD2025000001",
  "clientId": "CLI2025000001",
  "clientName": "Jan Kowalski",
  "clientPhone": "146814523",
  "clientAddress": {
    "street": "ul. Krakowska",
    "buildingNumber": "15",
    "apartmentNumber": "3",
    "city": "Dębica",
    "postalCode": "39-200"
  },
  "deviceType": "Piekarnik",
  "brand": "Siemens",
  "model": "Siemens 5432",
  "serialNumber": "SN234567",
  "issueDescription": "Uszkodzone drzwi",
  "detailedDescription": "Uszkodzone drzwi. Klient zgłasza problem z urządzeniem Piekarnik Siemens.",
  "status": "in-progress",
  "priority": "high",
  "assignedTo": "EMP25092003",
  "assignedToName": "Piotr Chłodnictwo",
  "createdAt": "2025-09-28T...",
  "estimatedCost": 250,
  "warranty": false,
  "source": "phone"
}
```

---

## 🧪 TESTOWANIE

### **Test 1: Sprawdź klientów w admin panelu**
1. Uruchom: http://localhost:3000/admin/klienci
2. Powinno być **18 klientów**
3. Sprawdź filtrowanie po mieście: Dębica, Ropczyce, Mielec

### **Test 2: Sprawdź zlecenia**
1. Uruchom: http://localhost:3000/admin/zamowienia
2. Powinno być **44 zlecenia**
3. Sprawdź filtry: status, priorytet, miasto

### **Test 3: Logowanie klienta**
1. Uruchom: http://localhost:3000/client/login
2. Email: `jan.kowalski@gmail.com`
3. Hasło: `haslo123`
4. Powinien się zalogować ✅

### **Test 4: Dodaj nowe zlecenie**
1. Admin panel → Zlecenia → Nowe zlecenie
2. Wybierz klienta z listy (np. Jan Kowalski)
3. Uzupełnij dane urządzenia
4. Zapisz

### **Test 5: Przydziel zlecenie do pracownika**
1. Admin panel → Zlecenia → wybierz zlecenie "pending"
2. Przydziel do pracownika (np. Jan Serwisant)
3. Zmień status na "in-progress"

---

## 🛠️ JAK URUCHOMIĆ PONOWNIE

Jeśli chcesz **zresetować dane jeszcze raz**:

```powershell
# 1. Wygeneruj nowych klientów (zastąpi starych + wyczyści zlecenia)
node scripts/reset-and-generate-clients.js

# 2. Wygeneruj zlecenia dla nowych klientów
node scripts/generate-orders.js
```

---

## 📈 STATYSTYKI KOŃCOWE

```
✅ Klienci: 18
   ├─ Dębica: 6
   ├─ Ropczyce: 5
   └─ Mielec: 7

✅ Zlecenia: 44
   ├─ Pending: 13
   ├─ In-progress: 14
   ├─ Completed: 6
   ├─ Scheduled: 3
   └─ Cancelled: 8

✅ Pracownicy: 8 (bez zmian)
   - Wszyscy mają hasło: haslo123

✅ Hasła: Wszystkie zahashowane bcrypt
```

---

## 🎉 SYSTEM GOTOWY DO TESTOWANIA!

Możesz teraz:
- ✅ Testować system blokady konta (pracownicy)
- ✅ Testować logowanie klientów
- ✅ Testować przydzielanie zleceń
- ✅ Testować filtrowanie po mieście
- ✅ Testować intelligent planner
- ✅ Testować mapy (Google Maps API)

---

**Enjoy! 🚀**

