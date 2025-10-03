# 📱 Jak zobaczyć stronę na telefonie w sieci lokalnej

## ✅ Gotowe! Serwer działa

### 🌐 Adresy dostępu:

**Na komputerze (localhost):**
```
http://localhost:3000/index-serwis-agd
```

**Na telefonie/tablecie (sieć lokalna):**
```
http://192.168.0.2:3000/index-serwis-agd
```

---

## 📱 Instrukcja krok po kroku:

### 1️⃣ **Upewnij się że telefon jest w tej samej sieci WiFi**
- Telefon musi być podłączony do **tego samego WiFi** co komputer
- Sprawdź nazwę sieci WiFi na telefonie - powinna być taka sama

### 2️⃣ **Otwórz przeglądarkę na telefonie**
- Chrome, Safari, Firefox - dowolna

### 3️⃣ **Wpisz adres:**
```
http://192.168.0.2:3000/index-serwis-agd
```

### 4️⃣ **Testuj różne strony:**
- **Nowa wersja AGD:** http://192.168.0.2:3000/index-serwis-agd
- **Oryginalna:** http://192.168.0.2:3000/
- **Rezerwacja:** http://192.168.0.2:3000/rezerwacja
- **Status zamówienia:** http://192.168.0.2:3000/moje-zamowienie
- **Panel Admin:** http://192.168.0.2:3000/admin

---

## 🔧 Co zostało naprawione:

### ✅ **Szerokość strony**
- Zmieniono `max-w-7xl` → `container mx-auto`
- Teraz strona zajmuje pełną szerokość ekranu
- Responsive na wszystkich urządzeniach (mobile, tablet, desktop)

### ✅ **Serwer w sieci lokalnej**
- Serwer działa na `0.0.0.0:3000` (dostępny w sieci)
- Skonfigurowano w `package.json`: `"dev": "next dev -p 3000 -H 0.0.0.0"`

---

## 🔍 Troubleshooting

### Problem: Strona nie ładuje się na telefonie
**Rozwiązania:**
1. ✅ Sprawdź czy telefon i komputer są w **tej samej sieci WiFi**
2. ✅ Sprawdź czy IP komputera nadal to `192.168.0.2` (może się zmienić):
   ```powershell
   ipconfig
   ```
   Szukaj: `Wireless LAN adapter Wi-Fi` → `IPv4 Address`

3. ✅ Sprawdź czy firewall nie blokuje portu 3000:
   ```powershell
   # Dodaj regułę firewall (uruchom jako Administrator):
   netsh advfirewall firewall add rule name="Next.js Dev Server" dir=in action=allow protocol=TCP localport=3000
   ```

4. ✅ Zrestartuj serwer:
   ```powershell
   # Zatrzymaj (Ctrl+C)
   # Uruchom ponownie:
   npm run dev
   ```

### Problem: IP się zmienia po restarcie komputera
**Rozwiązanie:** Ustaw statyczne IP w ustawieniach routera lub Windows

### Problem: Powolne ładowanie
- To normalne w trybie deweloperskim
- Hot reload może spowalniać
- W produkcji będzie szybciej (użyj `npm run build && npm start`)

---

## 🎯 Porównanie wersji na telefonie:

| Wersja | URL | Opis |
|--------|-----|------|
| **🔧 NOWA - Serwis AGD** | http://192.168.0.2:3000/index-serwis-agd | ✅ Dedykowana dla serwisu |
| 🎨 Oryginalna | http://192.168.0.2:3000/ | Elektronika + Serwis |
| 🧘 Clean Modern | http://192.168.0.2:3000/index-clean-modern | Minimalistyczna |
| 💼 Profesjonalna | http://192.168.0.2:3000/index-professional-subtle | Business style |

---

## 📊 QR Code (opcjonalnie)

Możesz wygenerować QR kod prowadzący do:
```
http://192.168.0.2:3000/index-serwis-agd
```

Użyj: https://www.qr-code-generator.com/

---

## 🚀 Następne kroki:

### Jeśli chcesz aby nowa wersja była domyślna:

**Opcja 1 - Przekierowanie (łatwiejsze):**
Edytuj `pages/index.js` i dodaj na samej górze:
```javascript
export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/index-serwis-agd',
      permanent: false
    }
  };
}
```

**Opcja 2 - Zmiana nazwy (czyściej):**
```powershell
# Backup
mv pages/index.js pages/index-oryginalna.js
# Nowa jako główna
mv pages/index-serwis-agd.js pages/index.js
```

---

**Status:** ✅ Gotowe do testowania na telefonie
**IP komputera:** 192.168.0.2
**Port:** 3000
**Główny URL:** http://192.168.0.2:3000/index-serwis-agd
