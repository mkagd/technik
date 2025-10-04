# 📱 Jak połączyć się z telefonu przez WiFi

## 🚀 Szybki start

### 1️⃣ Otwórz port w firewall (tylko raz)
```
1. Kliknij prawym przyciskiem na plik: open-firewall-port.ps1
2. Wybierz "Uruchom jako administrator"
3. Zatwierdź, jeśli pojawi się pytanie UAC
```

### 2️⃣ Upewnij się, że serwer działa
```bash
npm run dev
```

### 3️⃣ Otwórz plik z kodem QR
```
Otwórz plik: qr-code-wifi-access.html
```

### 4️⃣ Na telefonie:
1. **Połącz się z tą samą siecią WiFi** co komputer
2. **Zeskanuj kod QR** aparatem telefonu
3. **Lub wpisz ręcznie w przeglądarce:**
   ```
   http://192.168.0.2:3000
   ```

---

## 🔗 Dostępne strony

| Strona | URL | Opis |
|--------|-----|------|
| **Admin Panel** | `http://192.168.0.2:3000/admin` | Panel administratora |
| **Technician Login** | `http://192.168.0.2:3000/technician/login` | Logowanie technika |
| **Technician Schedule** | `http://192.168.0.2:3000/technician/schedule` | Harmonogram technika |
| **Employee Login** | `http://192.168.0.2:3000/pracownik-logowanie` | Logowanie pracownika |
| **Login Choice** | `http://192.168.0.2:3000/logowanie-wybor` | Wybór typu konta |

---

## ⚠️ Rozwiązywanie problemów

### ❌ Strona nie ładuje się na telefonie

**1. Sprawdź czy jesteś w tej samej sieci WiFi**
```bash
# Na komputerze:
ipconfig | findstr /i "IPv4"

# Na telefonie:
Ustawienia > WiFi > Nazwa sieci (musi być taka sama!)
```

**2. Sprawdź czy serwer działa**
```bash
# Sprawdź czy port 3000 jest otwarty:
netstat -ano | findstr :3000

# Jeśli nie ma wyniku, uruchom:
npm run dev
```

**3. Wyłącz VPN na telefonie**
- VPN może blokować dostęp do sieci lokalnej
- Wyłącz tymczasowo i spróbuj ponownie

**4. Sprawdź firewall**
```powershell
# Sprawdź czy reguła istnieje:
Get-NetFirewallRule -DisplayName "Next.js Dev Server Port 3000"

# Jeśli nie, uruchom ponownie: open-firewall-port.ps1 jako admin
```

**5. Restart routera**
- Czasami router blokuje komunikację między urządzeniami
- Włącz "Izolację AP" lub "Client Isolation" w ustawieniach routera

---

## 📝 Dane logowania (testowe)

### 👔 Admin
- Email: `admin@techserwis.pl`
- Hasło: (sprawdź w kodzie źródłowym)

### 🔧 Technik
- Email: `jan.kowalski@techserwis.pl`
- Token: (generowany przy logowaniu)

### 👷 Pracownik
- ID: `EMP25189001`
- PIN: `1234`

---

## 🛠️ Dodatkowe komendy

### Sprawdź IP komputera
```bash
ipconfig
```

### Sprawdź otwarte porty
```bash
netstat -ano | findstr :3000
```

### Zatrzymaj wszystkie procesy Node.js
```powershell
Get-Process node | Stop-Process -Force
```

### Restart dev server
```bash
# Zatrzymaj (Ctrl+C)
# Uruchom ponownie:
npm run dev
```

---

## 🎯 Testowanie na telefonie

### Harmonogram Technika (główne testowanie)
```
http://192.168.0.2:3000/technician/schedule
```

**Funkcje do przetestowania:**
- ✅ Zaznaczanie myszką/palcem na timeline
- ✅ Tryb Praca / Przerwa
- ✅ Usuwanie slotów (double-click)
- ✅ Toast notifications
- ✅ Responsywność na telefonie
- ✅ Płynne animacje

---

## 📱 Responsywność

Aplikacja automatycznie dostosuje się do ekranu telefonu dzięki Tailwind CSS i responsive design.

**Testowane rozdzielczości:**
- 📱 Mobile: 375px - 767px
- 📱 Tablet: 768px - 1023px
- 💻 Desktop: 1024px+

---

## 🔒 Bezpieczeństwo

⚠️ **UWAGA:** Ten serwer jest przeznaczony **tylko do developmentu**!

**Nie używaj w produkcji bez:**
- ✅ HTTPS (certyfikat SSL)
- ✅ Właściwej autentykacji
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Environment variables dla secretów

---

## 💡 Wskazówki

1. **Trzymaj komputer podłączony do prądu** - WiFi może się wyłączyć przy oszczędzaniu energii
2. **Nie zamykaj terminala** z `npm run dev`
3. **Użyj Chrome/Safari na telefonie** - najlepsza kompatybilność
4. **Wyczyść cache przeglądarki** jeśli widzisz starą wersję

---

## 📞 Pomoc

Jeśli nic nie działa:
1. Zrestartuj router
2. Zrestartuj komputer
3. Zrestartuj telefon
4. Sprawdź czy antywirus nie blokuje
5. Spróbuj wyłączyć Windows Firewall całkowicie (tymczasowo!)

---

**Utworzono:** 2025-10-03
**Wersja:** 1.0.0
**IP:** 192.168.0.2
**Port:** 3000
