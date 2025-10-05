# 🐛 DEBUG - Problem z uploadem zdjęć do magazynu

**Data:** 2025-10-04  
**Problem:** Nie można dodać nowych zdjęć, widoczne tylko miniaturki SVG

---

## 🔍 CHECKLIST DIAGNOSTYCZNY

### **1. Sprawdź Console (F12)**

Otwórz przeglądarkę → F12 → Console i szukaj:

```javascript
// Możliwe błędy:

❌ POST http://localhost:3000/api/upload-photo 404 (Not Found)
   → API endpoint nie istnieje lub źle skonfigurowany

❌ POST http://localhost:3000/api/upload-photo 500 (Internal Server Error)
   → Błąd serwera (brak folderów, brak uprawnień)

❌ TypeError: Cannot read property 'map' of undefined
   → Problem ze stanem images w komponencie

❌ CORS error / Network error
   → Problem z połączeniem do API

❌ Upload failed
   → Ogólny błąd uploadu
```

### **2. Sprawdź Network (F12 → Network)**

Gdy próbujesz uploadować zdjęcie:

```
1. Network tab → XHR/Fetch
2. Znajdź request: POST /api/upload-photo
3. Sprawdź:
   - Status: 200 OK ✅ / 404/500 ❌
   - Response: { success: true, filePath: "..." }
   - Request Payload: FormData z photo
```

### **3. Sprawdź czy folder istnieje**

W terminalu (PowerShell):

```powershell
# Sprawdź czy folder istnieje
Test-Path "D:\Projekty\Technik\Technik\public\uploads\parts"

# Powinno zwrócić: True

# Jeśli False, stwórz folder:
mkdir -Force public\uploads\parts
```

### **4. Test Upload API ręcznie**

Użyj Postman lub curl:

```powershell
# Test w PowerShell
$file = "C:\path\to\test-image.jpg"
$uri = "http://localhost:3000/api/upload-photo"

$form = @{
    photo = Get-Item -Path $file
    category = "parts"
    orderId = "TEST_001"
}

Invoke-RestMethod -Uri $uri -Method Post -Form $form
```

Oczekiwany wynik:
```json
{
  "success": true,
  "filePath": "/uploads/parts/TEST_001_parts_..._test-image.jpg",
  "message": "Zdjęcie zostało pomyślnie przesłane"
}
```

---

## 🔧 MOŻLIWE PRZYCZYNY

### **Problem #1: Brak folderu uploads/parts**

**Objawy:**
```
❌ 500 Internal Server Error
❌ ENOENT: no such file or directory
```

**Rozwiązanie:**
```powershell
mkdir -Force public\uploads\parts
```

---

### **Problem #2: Brak uprawnień zapisu**

**Objawy:**
```
❌ EACCES: permission denied
❌ Cannot write to directory
```

**Rozwiązanie:**
```powershell
# Sprawdź uprawnienia
icacls "public\uploads\parts"

# Nadaj pełne uprawnienia (Windows)
icacls "public\uploads\parts" /grant Everyone:F
```

---

### **Problem #3: PhotoUploadZone nie jest widoczny w modal**

**Objawy:**
- Modal się otwiera
- Brak sekcji "📸 Zdjęcia części"
- Brak drag & drop area

**Rozwiązanie:**
Sprawdź w kodzie czy PhotoUploadZone jest renderowany:

```javascript
// W AddPartModal powinno być:
<PhotoUploadZone
  images={newPart.images}
  onChange={(images) => setNewPart({ ...newPart, images })}
  maxImages={8}
  uploadCategory="parts"
/>
```

---

### **Problem #4: Images nie są inicjalizowane jako array**

**Objawy:**
```
❌ TypeError: Cannot read property 'map' of undefined
❌ images.map is not a function
```

**Rozwiązanie:**
W `newPart` state dodaj:
```javascript
const [newPart, setNewPart] = useState({
  name: '',
  // ... inne pola
  images: [],  // ⬅️ To musi być pusta tablica!
  model3D: null
});
```

---

### **Problem #5: API endpoint zwraca złą ścieżkę**

**Objawy:**
- Upload się udaje (200 OK)
- Ale zdjęcia nie są widoczne (404)

**Rozwiązanie:**
Sprawdź w response czy ścieżka jest poprawna:
```javascript
// Poprawna ścieżka:
{
  "filePath": "/uploads/parts/filename.jpg"  // ✅
}

// Niepoprawna:
{
  "filePath": "/images/parts/filename.jpg"   // ❌
}
```

---

## 🧪 SZYBKI TEST

### **Test 1: Sprawdź czy modal się otwiera**

```
1. Kliknij "+ Dodaj część"
2. Modal powinien się otworzyć
3. Przewiń w dół
4. Szukaj sekcji "📸 Zdjęcia części"
```

✅ Widzisz sekcję → OK  
❌ Nie widzisz → PhotoUploadZone nie jest renderowany

### **Test 2: Sprawdź drag & drop area**

```
1. W sekcji "Zdjęcia" powinien być prostokąt
2. Z ikoną 📷 i tekstem "Przeciągnij zdjęcia tutaj"
3. Lub button "Wybierz pliki"
```

✅ Widzisz → Komponent działa  
❌ Nie widzisz → Problem z renderowaniem

### **Test 3: Próba uploadu**

```
1. Kliknij "Wybierz pliki" (lub drag & drop)
2. Wybierz zdjęcie (JPG/PNG)
3. Sprawdź Console (F12)
```

Oczekiwane logi:
```javascript
📤 Uploading image...
✅ Upload successful: /uploads/parts/...
```

---

## 📋 CO MI POWIEDZ

Sprawdź te rzeczy i powiedz mi:

### **A. Console Errors**
```
F12 → Console → Jakie błędy widzisz?
Wklej tutaj pełny tekst błędu
```

### **B. Network Request**
```
F12 → Network → POST /api/upload-photo
Status: ??? (200/404/500?)
Response: ???
```

### **C. Czy widzisz PhotoUploadZone?**
```
✅ TAK - widzę drag & drop area
❌ NIE - modal nie ma sekcji zdjęć
```

### **D. Folder exists?**
```powershell
Test-Path "public\uploads\parts"
# True or False?
```

---

## 🚀 QUICK FIX (jeśli folder nie istnieje)

```powershell
# 1. Stwórz folder
mkdir -Force public\uploads\parts

# 2. Dodaj .gitkeep (żeby git śledził pusty folder)
New-Item -Path "public\uploads\parts\.gitkeep" -ItemType File -Force

# 3. Zrestartuj serwer
taskkill /F /IM node.exe
npm run dev

# 4. Hard refresh przeglądarki
# Ctrl + Shift + R
```

---

## 📞 NASTĘPNY KROK

**Wykonaj testy powyżej i powiedz mi:**
1. Co pokazuje Console (F12)?
2. Status Network request?
3. Czy widzisz PhotoUploadZone w modal?
4. Czy folder `public/uploads/parts` istnieje?

**Na podstawie tego naprawię problem!** 🔧
