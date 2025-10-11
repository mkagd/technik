# ✅ Naprawa usuwania draftów po wysłaniu zgłoszenia

**Data:** 2025-10-08  
**Problem:** Błąd 400 przy usuwaniu draftu po wysłaniu zgłoszenia

---

## 🔍 Problem

Po pomyślnym wysłaniu zgłoszenia, system próbował usunąć draft z serwera, ale otrzymywał błąd **400 Bad Request**:

```
DELETE http://localhost:3000/api/drafts?id=DRAFT-1759889991701 400 (Bad Request)
```

### Przyczyna:
- **Kod wysyłał:** `/api/drafts?id=${currentDraftId}`
- **API oczekiwało:** `/api/drafts?draftId=${currentDraftId}`
- Niezgodność nazwy parametru query powodowała błąd walidacji

---

## 🔧 Rozwiązanie

### 1. Poprawiono nazwę parametru w `pages/rezerwacja.js`

**Przed:**
```javascript
await fetch(`/api/drafts?id=${currentDraftId}`, { method: 'DELETE' });
```

**Po:**
```javascript
const deleteResponse = await fetch(`/api/drafts?draftId=${currentDraftId}`, { method: 'DELETE' });
const deleteResult = await deleteResponse.json();

if (deleteResponse.ok) {
    console.log('🗑️ Draft usunięty po wysłaniu:', deleteResult.message);
} else {
    console.warn('⚠️ Problem z usunięciem draftu:', deleteResult.message);
}
```

### 2. Poprawiono obsługę błędów w API `pages/api/drafts.js`

**Zmiana:** Gdy draft nie istnieje (np. został już usunięty), zwracamy **200 OK** zamiast **404 Not Found**.

**Uzasadnienie:**
- Draft mógł być już usunięty przez inny proces
- Użytkownik nie musi wiedzieć o technicznym problemie
- Cel operacji został osiągnięty (draft nie istnieje)

```javascript
if (filteredDrafts.length < drafts.length) {
    saveDrafts(filteredDrafts);
    console.log(`🗑️ Deleted draft: ${draftId}`);
    return res.status(200).json({ 
        success: true, 
        message: 'Draft usunięty' 
    });
} else {
    // Draft nie znaleziony - może był już usunięty, zwróć sukces
    console.log(`ℹ️ Draft not found (already deleted?): ${draftId}`);
    return res.status(200).json({ 
        success: true, 
        message: 'Draft już nie istnieje (prawdopodobnie był usunięty wcześniej)' 
    });
}
```

---

## ✅ Wynik

- ✅ Poprawione usuwanie draftu po wysłaniu zgłoszenia
- ✅ Brak błędów 400 w konsoli
- ✅ Lepsze logowanie z informacjami o statusie operacji
- ✅ Graceful handling - błąd usuwania draftu nie wpływa na sukces zgłoszenia

---

## 🧪 Testowanie

1. Wypełnij formularz rezerwacji
2. Wyślij zgłoszenie
3. Sprawdź konsolę - powinno być:
   ```
   🗑️ Draft usunięty po wysłaniu: Draft usunięty
   ```
4. Brak błędów 400 lub 404

---

## 📝 Powiązane pliki

- `pages/rezerwacja.js` - frontend formularza
- `pages/api/drafts.js` - API endpoint dla draftów
- `data/drafts.json` - przechowywanie draftów

---

**Status:** ✅ Naprawione i przetestowane
