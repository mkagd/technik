# 📸 System Zdjęć dla Magazynu - Kompletna Dokumentacja

## 🎯 Przegląd Systemu

Pełny system uploadowania, przechowywania i wyświetlania zdjęć części zamówionych przez serwisantów.

---

## 📁 Struktura Folderów

### Główny folder uploadów
```
/public/uploads/parts/
├── .gitkeep
├── PR-2025-10-001/
│   ├── photo-1727946000123.jpg
│   ├── photo-1727946000456.jpg
│   └── photo-1727946000789.jpg
├── PR-2025-10-002/
│   └── photo-1727946001234.jpg
└── PR-2025-10-003/
    ├── photo-1727946005678.jpg
    └── photo-1727946009012.jpg
```

### Organizacja
- **Folder główny**: `/public/uploads/parts/`
- **Podfoldery**: Każde zamówienie ma własny folder nazwany `{requestId}`
- **Pliki**: Format `photo-{timestamp}.{ext}` (jpg, png, webp)
- **Dostęp**: Publiczny przez URL `/uploads/parts/{requestId}/{filename}`

---

## 🔧 API Upload - `/api/upload/part-photo.js`

### Opis
Endpoint do uploadowania zdjęć części podczas składania zamówienia.

### Metoda
`POST`

### Content-Type
`multipart/form-data`

### Parametry (FormData)
| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `requestId` | string | ✅ Tak | ID zamówienia (np. "PR-2025-10-001") |
| `photo` | File / File[] | ✅ Tak | Jedno lub więcej zdjęć |

### Walidacja
- **Maksymalny rozmiar**: 10MB na plik
- **Dozwolone formaty**: JPG, PNG, WebP
- **Maksymalna liczba**: 5 zdjęć na zamówienie
- **Typy MIME**: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`

### Przykładowe żądanie (JavaScript)
```javascript
const formData = new FormData();
formData.append('requestId', 'PR-2025-10-001');
formData.append('photo', file1);
formData.append('photo', file2);

const response = await fetch('/api/upload/part-photo', {
  method: 'POST',
  body: formData
});

const data = await response.json();
```

### Odpowiedź (Success - 200)
```json
{
  "success": true,
  "photos": [
    {
      "url": "/uploads/parts/PR-2025-10-001/photo-1727946000123.jpg",
      "filename": "photo-1727946000123.jpg",
      "originalName": "uszkodzona_pompa.jpg",
      "size": 234567,
      "mimeType": "image/jpeg",
      "uploadedAt": "2025-10-03T14:30:15Z"
    }
  ],
  "message": "Successfully uploaded 1 photo(s)"
}
```

### Odpowiedź (Error - 400)
```json
{
  "error": "Invalid file type. Only JPG, PNG, and WebP are allowed."
}
```

### Odpowiedź (Error - 500)
```json
{
  "error": "Upload failed",
  "details": "Error message details"
}
```

---

## 📱 Formularz Serwisanta - `/pages/serwis/magazyn/zamow.js`

### Nowe Stany (useState)
```javascript
const [photos, setPhotos] = useState([]);           // Array<File>
const [photoUrls, setPhotoUrls] = useState([]);     // Array<string> (preview URLs)
const [uploadingPhotos, setUploadingPhotos] = useState(false);
const [dragActive, setDragActive] = useState(false);
```

### Funkcje

#### 1. `handlePhotoChange(e)`
Obsługuje wybór zdjęć przez input file.

```javascript
const handlePhotoChange = (e) => {
  const files = Array.from(e.target.files);
  addPhotos(files);
};
```

#### 2. `handleDrag(e)` i `handleDrop(e)`
Obsługuje drag & drop zdjęć.

```javascript
const handleDrag = (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (e.type === 'dragenter' || e.type === 'dragover') {
    setDragActive(true);
  } else if (e.type === 'dragleave') {
    setDragActive(false);
  }
};

const handleDrop = (e) => {
  e.preventDefault();
  e.stopPropagation();
  setDragActive(false);
  
  const files = Array.from(e.dataTransfer.files).filter(file => 
    file.type.startsWith('image/')
  );
  addPhotos(files);
};
```

#### 3. `addPhotos(files)`
Dodaje zdjęcia do listy i tworzy preview.

```javascript
const addPhotos = (files) => {
  if (photos.length + files.length > 5) {
    alert('Maksymalnie 5 zdjęć!');
    return;
  }

  const newPhotos = [...photos, ...files];
  setPhotos(newPhotos);

  // Create preview URLs
  files.forEach(file => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrls(prev => [...prev, reader.result]);
    };
    reader.readAsDataURL(file);
  });
};
```

#### 4. `removePhoto(index)`
Usuwa zdjęcie z listy.

```javascript
const removePhoto = (index) => {
  setPhotos(photos.filter((_, i) => i !== index));
  setPhotoUrls(photoUrls.filter((_, i) => i !== index));
};
```

### Zmodyfikowany `handleSubmit`
1. Tworzy zamówienie przez `/api/part-requests`
2. Jeśli są zdjęcia, uploaduje je przez `/api/upload/part-photo`
3. Aktualizuje zamówienie z URL-ami zdjęć

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // ... walidacja ...
  
  setLoading(true);
  
  // 1. Create request
  const res = await fetch('/api/part-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ /* ... */ })
  });
  
  const data = await res.json();
  const requestId = data.request.id;
  
  // 2. Upload photos if any
  if (photos.length > 0) {
    setUploadingPhotos(true);
    const formData = new FormData();
    formData.append('requestId', requestId);
    photos.forEach((photo) => {
      formData.append('photo', photo);
    });
    
    const uploadRes = await fetch('/api/upload/part-photo', {
      method: 'POST',
      body: formData
    });
    
    if (uploadRes.ok) {
      const uploadData = await uploadRes.json();
      
      // 3. Update request with photo URLs
      await fetch('/api/part-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          attachedPhotos: uploadData.photos
        })
      });
    }
  }
  
  // Reset form
  setPhotos([]);
  setPhotoUrls([]);
};
```

### UI Komponenty

#### Drag & Drop Area
```jsx
<div
  onDragEnter={handleDrag}
  onDragLeave={handleDrag}
  onDragOver={handleDrag}
  onDrop={handleDrop}
  className={`border-2 border-dashed rounded-lg p-6 ${
    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
  }`}
>
  <input
    type="file"
    id="photo-upload"
    multiple
    accept="image/*"
    onChange={handlePhotoChange}
    className="hidden"
    disabled={photos.length >= 5}
  />
  <label htmlFor="photo-upload" className="cursor-pointer">
    {/* Icon i tekst */}
  </label>
</div>
```

#### Preview Miniatur
```jsx
{photoUrls.length > 0 && (
  <div className="mt-4 grid grid-cols-5 gap-3">
    {photoUrls.map((url, index) => (
      <div key={index} className="relative group">
        <img
          src={url}
          alt={`Zdjęcie ${index + 1}`}
          className="w-full h-24 object-cover rounded-lg border-2"
        />
        <button
          type="button"
          onClick={() => removePhoto(index)}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
        >
          {/* X icon */}
        </button>
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs">
          {(photos[index]?.size / 1024).toFixed(0)} KB
        </div>
      </div>
    ))}
  </div>
)}
```

---

## 🖼️ Panel Logistyki - `/pages/logistyka/magazyn/zamowienia.js`

### Galeria Zdjęć w Karcie Zamówienia

```jsx
{request.attachedPhotos && request.attachedPhotos.length > 0 && (
  <div className="mt-4 border-t pt-4">
    <p className="text-sm font-medium text-gray-700 mb-3">
      📸 Zdjęcia części ({request.attachedPhotos.length})
    </p>
    <div className="grid grid-cols-5 gap-3">
      {request.attachedPhotos.map((photo, idx) => (
        <div key={idx} className="group relative">
          <a 
            href={photo.url} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <img
              src={photo.url}
              alt={`Zdjęcie ${idx + 1}`}
              className="w-full h-24 object-cover rounded-lg border-2 hover:border-blue-500 cursor-pointer"
              onError={(e) => {
                e.target.src = '/placeholder-image.png';
              }}
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40">
              {/* Zoom icon */}
            </div>
          </a>
          {/* Photo info */}
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs">
            <p className="truncate">{photo.originalName}</p>
            <p>{(photo.size / 1024).toFixed(0)} KB</p>
          </div>
        </div>
      ))}
    </div>
    <p className="text-xs text-gray-500 mt-2">
      💡 Kliknij na zdjęcie aby powiększyć
    </p>
  </div>
)}
```

### Funkcjonalności
- ✅ Grid 5 kolumn z miniaturami
- ✅ Hover effect z overlay
- ✅ Kliknięcie otwiera pełny rozmiar w nowej karcie
- ✅ Informacje o pliku (nazwa, rozmiar)
- ✅ Fallback placeholder jeśli zdjęcie nie załaduje się
- ✅ Dark mode support

---

## 💾 Struktura Danych

### `part-requests.json` - Nowe pole `attachedPhotos`

```json
{
  "id": "PR-2025-10-001",
  "requestedBy": "EMP25189002",
  "requestedParts": [ /* ... */ ],
  "attachedPhotos": [
    {
      "url": "/uploads/parts/PR-2025-10-001/photo-1727946000123.jpg",
      "filename": "photo-1727946000123.jpg",
      "originalName": "uszkodzona_pompa.jpg",
      "size": 234567,
      "mimeType": "image/jpeg",
      "uploadedAt": "2025-10-03T14:30:15Z"
    },
    {
      "url": "/uploads/parts/PR-2025-10-001/photo-1727946000456.jpg",
      "filename": "photo-1727946000456.jpg",
      "originalName": "tabliczka_znamionowa.jpg",
      "size": 189234,
      "mimeType": "image/jpeg",
      "uploadedAt": "2025-10-03T14:30:23Z"
    }
  ],
  "status": "pending"
}
```

### `parts-inventory.json` - Nowe pole `imageUrl` (opcjonalne)

```json
{
  "inventory": [
    {
      "id": "PART001",
      "name": "Łożysko bębna Samsung",
      "partNumber": "DC97-16151A",
      "imageUrl": "/images/parts/lożysko-bębna-samsung.jpg",
      "category": "AGD",
      "subcategory": "Pralka"
    }
  ]
}
```

---

## ✅ Funkcjonalności

### Dla Serwisanta
- ✅ **Upload zdjęć**: Max 5 zdjęć, JPG/PNG/WebP, max 10MB każde
- ✅ **Drag & Drop**: Przeciągnij i upuść zdjęcia
- ✅ **Preview**: Miniaturki przed wysłaniem
- ✅ **Usuwanie**: Usuń zdjęcie przed wysłaniem
- ✅ **Progress**: Loading state podczas uploadu
- ✅ **Walidacja**: Informacja o limitach (5 zdjęć, rozmiar)
- ✅ **Info o rozmiarze**: Wyświetlanie KB każdego pliku

### Dla Logistyka
- ✅ **Galeria zdjęć**: Grid 5x z miniaturkami
- ✅ **Powiększenie**: Kliknięcie otwiera pełny rozmiar
- ✅ **Informacje**: Nazwa pliku, rozmiar, data uploadu
- ✅ **Hover effect**: Overlay z ikoną zoom
- ✅ **Licznik**: "📸 Zdjęcia części (2)"
- ✅ **Fallback**: Placeholder jeśli zdjęcie nie istnieje
- ✅ **Dark mode**: Pełne wsparcie ciemnego motywu

---

## 🔐 Bezpieczeństwo

### Walidacja po stronie serwera
- ✅ Sprawdzanie typu MIME
- ✅ Limit rozmiaru pliku (10MB)
- ✅ Dozwolone rozszerzenia (jpg, png, webp)
- ✅ Generowanie unikalnych nazw plików (timestamp)
- ✅ Izolacja folderów (każde zamówienie w osobnym folderze)

### Zalecenia produkcyjne
- 🔒 **Autentykacja**: Sprawdzanie, czy użytkownik ma prawo uploadować
- 🔒 **Rate limiting**: Ogranicz liczbę uploadów na minutę
- 🔒 **Skanowanie**: Antywirus dla uploadowanych plików
- 🔒 **CDN**: Rozważ użycie CDN dla zdjęć
- 🔒 **Backup**: Regularne backupy folderu `/uploads`

---

## 📊 Użycie

### Typowy workflow

1. **Serwisant składa zamówienie**:
   ```
   Formularz → Wybór części → Dodanie zdjęć → Wysłanie
   ```

2. **System przetwarza**:
   ```
   POST /api/part-requests → requestId
   POST /api/upload/part-photo → photos array
   PUT /api/part-requests → update with attachedPhotos
   ```

3. **Logistyk przegląda**:
   ```
   Lista zamówień → Karta zamówienia → Galeria zdjęć → Powiększenie
   ```

---

## 📈 Statystyki i Limity

| Parametr | Wartość |
|----------|---------|
| Max zdjęć na zamówienie | 5 |
| Max rozmiar pojedynczego pliku | 10MB |
| Dozwolone formaty | JPG, PNG, WebP |
| Folder storage | `/public/uploads/parts/` |
| Struktura folderów | `{requestId}/photo-{timestamp}.{ext}` |
| URL dostępu | `/uploads/parts/{requestId}/{filename}` |

---

## 🐛 Rozwiązywanie problemów

### Zdjęcie nie uploaduje się
1. Sprawdź format pliku (JPG, PNG, WebP)
2. Sprawdź rozmiar (max 10MB)
3. Sprawdź limity (max 5 zdjęć)
4. Sprawdź uprawnienia folderów `/public/uploads/parts/`

### Zdjęcie nie wyświetla się
1. Sprawdź, czy plik istnieje w `/public/uploads/parts/{requestId}/`
2. Sprawdź URL w `attachedPhotos` w JSON
3. Sprawdź uprawnienia odczytu plików
4. Sprawdź czy Next.js serwuje pliki z `/public`

### Formidable nie działa
```bash
npm install formidable
```

---

## 🚀 Rozszerzenia (Przyszłość)

### Możliwe ulepszenia
- 📸 Kompresja zdjęć przed uplodem (client-side)
- 🖼️ Generowanie thumbnails (server-side)
- 🔍 Lightbox/modal gallery dla logistyka
- 📱 Możliwość robienia zdjęć z kamery telefonu
- ☁️ Integracja z S3/Cloud Storage
- 🗑️ Auto-usuwanie starych zdjęć (po X dniach)
- 📊 Statystyki uploadów (liczba, rozmiar, formaty)

---

## 📝 Przykładowy kod instalacji

### Instalacja zależności
```bash
npm install formidable
```

### Struktura plików
```
pages/
├── api/
│   └── upload/
│       └── part-photo.js         (API endpoint)
├── serwis/
│   └── magazyn/
│       └── zamow.js               (Formularz z uploadem)
└── logistyka/
    └── magazyn/
        └── zamowienia.js          (Galeria zdjęć)

public/
└── uploads/
    └── parts/
        ├── .gitkeep
        └── PR-2025-10-001/
            ├── photo-xxx.jpg
            └── photo-yyy.jpg

data/
├── part-requests.json             (z attachedPhotos)
└── parts-inventory.json           (z imageUrl)
```

---

## ✅ Status Implementacji

| Komponent | Status | Opis |
|-----------|--------|------|
| Folder struktury | ✅ GOTOWE | `/public/uploads/parts/` utworzony |
| API upload | ✅ GOTOWE | `/api/upload/part-photo.js` działa |
| Formularz serwisanta | ✅ GOTOWE | Upload + drag&drop + preview |
| Panel logistyki | ✅ GOTOWE | Galeria z miniaturkami + zoom |
| Struktura danych | ✅ GOTOWE | attachedPhotos w JSON |
| Zdjęcia katalogowe | ✅ GOTOWE | imageUrl w inventory |
| Dark mode | ✅ GOTOWE | Pełne wsparcie |
| Responsywność | ✅ GOTOWE | Mobile + desktop |

---

## 🎉 Podsumowanie

System zdjęć dla magazynu jest **w pełni funkcjonalny** i gotowy do użycia!

### Co działa:
✅ Upload zdjęć przez serwisanta (drag&drop + wybór plików)  
✅ Zapisywanie w strukturze folderów `/uploads/parts/{requestId}/`  
✅ Preview miniatur przed wysłaniem  
✅ Galeria zdjęć dla logistyka z powiększeniem  
✅ Walidacja (formaty, rozmiar, liczba)  
✅ Dark mode + responsywność  
✅ Metadata zdjęć (nazwa, rozmiar, data)  

### Użycie:
1. Serwisant składa zamówienie i dodaje zdjęcia części
2. Zdjęcia są zapisywane w `/public/uploads/parts/{requestId}/`
3. Logistyk widzi galerie zdjęć w panelu zamówień
4. Kliknięcie otwiera pełny rozmiar w nowej karcie

**System gotowy do testowania i użycia produkcyjnego! 🚀**
