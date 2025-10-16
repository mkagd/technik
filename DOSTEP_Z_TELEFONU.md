# 📱 Dostęp do aplikacji z telefonu/tabletu

## ✅ Serwer jest uruchomiony!

Twoja aplikacja jest dostępna w całej sieci lokalnej.

---

## 🌐 Adresy dostępu

### 💻 Z tego komputera:
```
http://localhost:3000
```

### 📱 Z telefonu/tabletu/innego komputera:
```
http://192.168.0.2:3000
```

---

## 🔐 Panele logowania

### Panel Admina
```
http://192.168.0.2:3000/admin/login
```
- Login: admin@serwisagd.pl
- Hasło: (twoje hasło)

### Panel Technika
```
http://192.168.0.2:3000/technician/login
```
- Login: (ID technika)
- Hasło: (hasło technika)

### Panel Klienta
```
http://192.168.0.2:3000/client/login
```
- Login: (numer telefonu klienta)
- Hasło: (hasło klienta)

---

## 📋 Instrukcja krok po kroku

### 1️⃣ Przygotowanie telefonu
- ✅ Połącz telefon z tą samą siecią WiFi co komputer
- ✅ Upewnij się że WiFi jest aktywne
- ✅ Sprawdź czy jesteś w sieci lokalnej (nie na danych mobilnych)

### 2️⃣ Otwórz przeglądarkę
- Chrome (Android)
- Safari (iPhone)
- Firefox lub inna przeglądarka

### 3️⃣ Wpisz adres
```
http://192.168.0.2:3000
```

### 4️⃣ Gotowe! 🎉
Powinna załadować się strona główna aplikacji.

---

## 🔧 Rozwiązywanie problemów

### ❌ "Nie można połączyć się ze stroną"

**Przyczyna 1: Telefon w innej sieci**
- ✅ Sprawdź czy telefon jest w tej samej sieci WiFi
- ✅ Sprawdź ustawienia WiFi na telefonie
- ✅ Wyłącz dane mobilne

**Przyczyna 2: Firewall blokuje połączenie**
- ✅ Windows Defender może blokować port 3000
- ✅ Dodaj wyjątek dla Node.js w Firewallu
- ✅ Tymczasowo wyłącz Firewall dla testu

**Przyczyna 3: Serwer nie działa**
- ✅ Sprawdź czy serwer jest uruchomiony (terminal "Dev Server")
- ✅ Zrestartuj serwer: `npm run dev -- -H 0.0.0.0`

### ❌ "Strona ładuje się bardzo wolno"

**Rozwiązanie:**
- ✅ Sprawdź siłę sygnału WiFi
- ✅ Przesuń się bliżej routera
- ✅ Zrestartuj router jeśli potrzeba

### ❌ "Niektóre funkcje nie działają"

**Uwaga:**
- ⚠️ Geolokalizacja wymaga HTTPS (nie działa na HTTP)
- ⚠️ Powiadomienia push wymagają HTTPS
- ⚠️ Niektóre API przeglądarki mogą być ograniczone na HTTP

---

## 🚀 Tryb produkcyjny (opcjonalnie)

Jeśli chcesz udostępnić aplikację przez internet (nie tylko sieć lokalna):

### Opcja 1: Ngrok (najprostsze)
```bash
# Zainstaluj ngrok
npm install -g ngrok

# Uruchom tunel
ngrok http 3000
```

### Opcja 2: Cloudflare Tunnel
```bash
# Zainstaluj cloudflared
# Uruchom tunel
cloudflared tunnel --url http://localhost:3000
```

### Opcja 3: Deploy na serwer
- Vercel (darmowe dla Next.js)
- Netlify
- Railway
- Własny serwer VPS

---

## 📊 Informacje techniczne

### Sieć
- **Interfejs:** Wi-Fi
- **Adres IP:** 192.168.0.2
- **Port:** 3000
- **Protokół:** HTTP (niezaszyfrowany)

### Serwer
- **Framework:** Next.js 14.2.30
- **Node.js:** (wersja z twojego systemu)
- **Tryb:** Development
- **Hot Reload:** Włączony

### Kompatybilność
- ✅ Android 5.0+
- ✅ iOS 12+
- ✅ Chrome, Safari, Firefox
- ✅ Tablety iPad/Android
- ✅ Laptopy Windows/Mac/Linux

---

## 💡 Wskazówki

### Dodanie do ekranu głównego (PWA)

**Android (Chrome):**
1. Otwórz stronę
2. Menu (⋮) → "Dodaj do ekranu głównego"
3. Ikona pojawi się na pulpicie

**iOS (Safari):**
1. Otwórz stronę
2. Udostępnij (📤) → "Dodaj do ekranu początkowego"
3. Ikona pojawi się na ekranie głównym

### Tryb offline
- ✅ Service Worker umożliwia pracę offline
- ✅ Wizyty można zakończyć bez internetu
- ✅ Dane zsynchronizują się po powrocie połączenia

---

## 📞 Potrzebujesz pomocy?

1. Sprawdź logi serwera w terminalu "Dev Server"
2. Sprawdź konsolę przeglądarki (F12)
3. Sprawdź Network tab w DevTools

---

**Data utworzenia:** 15 października 2025  
**Adres serwera:** http://192.168.0.2:3000  
**Status:** ✅ Aktywny
