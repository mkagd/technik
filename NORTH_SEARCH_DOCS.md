# North.pl Search Components - Dokumentacja

## 🏪 Komponenty wyszukiwania North.pl

System zawiera dwa komponenty do integracji z North.pl:

### 1. NorthQuickSearch (dla części zamiennych)

**Użycie:**
```jsx
import NorthQuickSearch from '../components/NorthQuickSearch';

<NorthQuickSearch
  partName="Termostat lodówki"
  partNumber="K59-L1287"
  compact={true}
  maxResults={20}
/>
```

**Props:**
- `partName` (string) - Nazwa części
- `partNumber` (string, opcjonalny) - Numer części (priorytet)
- `compact` (boolean) - Tryb kompaktowy (ikona 🏪)
- `maxResults` (number) - Max wyników w modalu

**URL generowany:**
```
https://north.pl/catalogsearch/result/?q=K59-L1287
```

---

### 2. NorthDeviceSearch (dla urządzeń)

**Użycie:**
```jsx
import NorthDeviceSearch from '../components/NorthDeviceSearch';

<NorthDeviceSearch
  brand="Samsung"
  deviceType="Pralka"
  model="WW90T4540"
  compact={true}
/>
```

**Props:**
- `brand` (string) - Marka urządzenia
- `deviceType` (string) - Typ (Pralka, Lodówka, Zmywarka, etc.)
- `model` (string, opcjonalny) - Model urządzenia
- `compact` (boolean) - Tryb kompaktowy

**URL generowany:**
```
https://north.pl/pralki?manufacturer=Samsung
```

---

## 📋 Mapowanie kategorii

| Typ urządzenia | Kategoria North.pl |
|----------------|-------------------|
| Pralka | /pralki |
| Lodówka | /chlodnictwo-lodowki |
| Zmywarka | /zmywarki |
| Piekarnik | /piekarniki |
| Kuchenka | /kuchenki |
| Okap | /okapy |
| Suszarka | /suszarki |

---

## 🎨 Funkcje

### Modal z wynikami
- Automatyczne scrapowanie North.pl
- Wyświetlanie w siatce (1-3 kolumny)
- Zdjęcia, ceny, dostępność
- Przycisk do otworzenia pełnej strony

### Fallback
Jeśli API nie zwróci wyników:
- Wyświetla przycisk "Otwórz North.pl"
- Otwiera bezpośrednio stronę z wynikami

---

## 💡 Przykłady użycia

### W katalogu części
```jsx
<NorthQuickSearch
  partName={part.name}
  partNumber={part.partNumber}
  compact={true}
/>
```

### W karcie wizyty (dla urządzenia)
```jsx
<NorthDeviceSearch
  brand={visit.device.brand}
  deviceType={visit.device.type}
  model={visit.device.model}
  compact={false}
/>
```

---

## ⚙️ API Endpoint

**GET** `/api/north/search`

Query params:
- `query` - Wyszukiwana fraza
- `limit` - Max wyników (default: 20)
- `isDevice` - true/false (dla urządzeń)

Response:
```json
{
  "success": true,
  "results": [...],
  "count": 15,
  "searchUrl": "https://north.pl/..."
}
```
