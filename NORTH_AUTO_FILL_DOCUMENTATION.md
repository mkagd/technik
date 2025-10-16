# 🛒 North.pl Auto-Fill - Dokumentacja

## Jak to działa?

System automatycznie pobiera dane produktu z North.pl i wypełnia formularz zamówienia.

### Krok 1: Znajdź część na North.pl

1. Otwórz katalog North.pl przez przycisk "🔍 Szukaj na North.pl"
2. Wybierz kategorię (np. Pralka)
3. Przeglądaj części i znajdź odpowiednią
4. **Skopiuj link do produktu** (prawy przycisk → Kopiuj adres linku)

### Krok 2: Wklej link w formularzu

1. Kliknij "Dodaj część do zamówienia"
2. **Wklej link** w pole "Link do produktu z North.pl"
3. System automatycznie pobierze:
   - ✅ Nazwę części
   - ✅ Numer katalogowy
   - ✅ Cenę
   - ✅ Zdjęcia produktu

### Krok 3: Sprawdź i dodaj

1. Sprawdź czy wszystkie dane się pobrały poprawnie
2. Możesz edytować ilość lub dodać notatki
3. Kliknij "✓ Dodaj do zamówienia"

## Przykładowy link

```
https://north.pl/karta/00611474-zaczep-grzebienia-do-zmywarki,631-TC-0173.html
```

## Jakie dane są pobierane?

### 1. Nazwa produktu
Pełna nazwa z North.pl, np:
> Zaczep grzebienia górnego kosza do zmywarki Bosch 00611474

### 2. Numer katalogowy / Indeks
Oryginalny kod części, np:
> 00611474

### 3. Cena
Aktualna cena w złotówkach, np:
> 51.90 zł

### 4. Zdjęcia (do 5 sztuk)
Wysokiej jakości zdjęcia produktu z różnych stron

### 5. Dostępność
Informacja czy część jest dostępna w magazynie

## API Endpoint

### POST `/api/scrape/north-product`

**Request:**
```json
{
  "url": "https://north.pl/karta/nazwa-czesci,123-ABC-0456.html"
}
```

**Response (Success):**
```json
{
  "success": true,
  "product": {
    "name": "Zaczep grzebienia górnego kosza do zmywarki Bosch 00611474",
    "partNumber": "00611474",
    "price": "51.90",
    "images": [
      "https://north.pl/thumb/thumb.php?...",
      "https://north.pl/thumb/thumb.php?..."
    ],
    "description": "Opis produktu...",
    "availability": "Wyślemy jutro",
    "originalUrl": "https://north.pl/karta/..."
  }
}
```

**Response (Error):**
```json
{
  "error": "Nie udało się pobrać danych produktu"
}
```

## Selektory HTML (North.pl)

System używa następujących selektorów do wyciągania danych:

| Dane | Selektor CSS |
|------|--------------|
| Nazwa | `h1.product-name`, `h1[itemprop="name"]` |
| Nr katalogowy | `.product-code`, `[itemprop="sku"]` |
| Cena | `.price`, `[itemprop="price"]` |
| Zdjęcia | `img[itemprop="image"]`, `.gallery img` |
| Dostępność | `.availability`, `.stock-status` |

## Troubleshooting

### Problem: "Nie udało się pobrać danych"

**Możliwe przyczyny:**
1. Link nie jest z North.pl
2. North.pl zmienił strukturę strony
3. Problem z połączeniem internetowym
4. Produkt został usunięty

**Rozwiązanie:**
- Sprawdź czy link jest poprawny
- Wypełnij dane ręcznie
- Zgłoś problem administratorowi

### Problem: "Niektóre pola są puste"

**Możliwe przyczyny:**
- North.pl nie ma wszystkich danych
- Struktura strony jest inna dla tego produktu

**Rozwiązanie:**
- Uzupełnij brakujące pola ręcznie
- Cena i nazwa są wymagane

## Bezpieczeństwo

- ✅ System pobiera tylko publiczne dane z North.pl
- ✅ Nie zapisuje haseł ani danych osobowych
- ✅ Link źródłowy jest zapisywany w zamówieniu (track

ability)
- ✅ Timeout 10 sekund dla każdego zapytania

## Technologia

- **Backend**: Next.js API Route
- **HTTP Client**: Axios
- **HTML Parser**: Cheerio
- **Timeout**: 10s
- **User-Agent**: Emulacja przeglądarki Chrome
