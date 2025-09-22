# 📋 Prosty System Zgłoszeń Serwisowych

## ✅ Co zostało uprościone

Zgodnie z Twoimi wymaganiami, formularz rezerwacji został maksymalnie uproszczony:

### 🎯 **Nowy prosty formularz zawiera tylko:**
- **Adres** - z autouzupełnianiem z OpenStreetMap
- **Numer telefonu** - z walidacją formatu
- **Brak** wyszukiwania usług, kategorii, kalendarzy itp.

---

## 🔧 Nowe komponenty

### 1. **SimpleBookingForm.js**
Prosty formularz zastępujący skomplikowany BookingWizardForm:
- Tylko 2 pola: adres + telefon
- Autouzupełnianie adresów z API OpenStreetMap
- Walidacja danych
- Responsive design
- Potwierdzenie wysłania

### 2. **Strona admin-zgloszenia.js**
Panel administratora do zarządzania zgłoszeniami:
- Lista wszystkich zgłoszeń
- Filtry: Wszystkie, Oczekujące, Wykonane, Anulowane
- Zmiana statusów zgłoszeń
- Usuwanie zgłoszeń
- Eksport do JSON
- Statystyki

---

## 🚀 Jak używać

### **Dla klientów:**
1. Otwórz stronę główną: http://localhost:3000
2. Wpisz adres (pojawią się sugestie)
3. Podaj numer telefonu
4. Kliknij "Wyślij zgłoszenie"
5. Gotowe! Otrzymasz potwierdzenie

### **Dla administratorów:**
1. Przejdź do panelu admin: http://localhost:3000/admin
2. Kliknij "📋 Zgłoszenia serwisowe"
3. Przeglądaj, filtruj i zarządzaj zgłoszeniami
4. Zmieniaj statusy: Oczekujące → Wykonane/Anulowane

---

## 📊 Dane są przechowywane w localStorage

Zgłoszenia są zapisywane w `localStorage` pod kluczem `simpleBookings`:

```javascript
{
  "id": 1672531200000,
  "address": "ul. Przykładowa 123, Warszawa",
  "phone": "+48 123 456 789",
  "status": "pending",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

### Statusy zgłoszeń:
- `pending` - Oczekujące (żółte)
- `completed` - Wykonane (zielone)
- `cancelled` - Anulowane (czerwone)

---

## 🎨 Funkcje formularza

### **Autouzupełnianie adresów:**
- Używa API OpenStreetMap Nominatim
- Wyszukuje adresy w Polsce
- Pokazuje sugestie po wpisaniu 3+ znaków
- Można wybrać z listy lub wpisać ręcznie

### **Walidacja:**
- Adres: minimum 5 znaków
- Telefon: format +48 xxx xxx xxx lub podobny
- Błędy wyświetlane na żywo

### **UX/UI:**
- Responsive design
- Loading states
- Potwierdzenie wysłania
- Możliwość wysłania kolejnego zgłoszenia

---

## 🔧 Panel administratora

### **Statystyki:**
- Liczba wszystkich zgłoszeń
- Liczba oczekujących
- Liczba wykonanych
- Liczba anulowanych

### **Filtry:**
- Wszystkie zgłoszenia
- Tylko oczekujące
- Tylko wykonane
- Tylko anulowane

### **Akcje:**
- Zmiana statusu zgłoszenia
- Usuwanie zgłoszeń
- Eksport danych do JSON
- Odświeżanie listy

---

## 📁 Struktura plików

### **Nowe pliki:**
```
components/
  SimpleBookingForm.js       # Prosty formularz zgłoszeń

pages/
  admin-zgloszenia.js        # Panel administratora zgłoszeń
```

### **Zmodyfikowane pliki:**
```
pages/
  index.js                   # Zamieniono BookingWizardForm na SimpleBookingForm
  admin.js                   # Dodano link do panelu zgłoszeń
```

---

## 🎯 Główne zmiany

1. **Usunięto skomplikowany BookingWizardForm** z wieloma krokami
2. **Dodano SimpleBookingForm** z tylko 2 polami
3. **Stworzono panel administratora** do zarządzania zgłoszeniami
4. **Zachowano funkcjonalność resetowania haseł** z poprzedniej implementacji

---

## 🔄 Migracja na serwer (opcjonalnie)

Jeśli chcesz przenieść dane na serwer:

1. **Stwórz tabelę w bazie danych:**
```sql
CREATE TABLE simple_bookings (
    id BIGINT PRIMARY KEY,
    address VARCHAR(500) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

2. **Zamień localStorage na API calls** w SimpleBookingForm.js

3. **Stwórz endpointy API** dla CRUD operacji

---

## ✅ Rezultat

**Teraz masz maksymalnie prosty system:**
- Klient: wpisuje adres + telefon → wysyła
- Administrator: zarządza zgłoszeniami w przejrzystym panelu
- Brak skomplikowanych formularzy, kategorii, kalendarzy
- Wszystko działa lokalnie bez potrzeby serwera

**Aplikacja gotowa do użycia!** 🎉
