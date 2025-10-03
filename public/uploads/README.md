# Struktura folderów dla systemu uploadowania zdjęć

## 📁 /public/uploads/

### 📋 orders/ 
Zdjęcia powiązane ze zleceniami serwisowymi
- Organizacja: `/orders/{orderID}/{category}/`
- Kategorie: `before/`, `after/`, `models/`, `general/`

### 🔧 models/
Zdjęcia tabliczek znamionowych pogrupowane według marek
- Organizacja: `/models/{brand}/`
- Przykład: `/models/samsung/`, `/models/bosch/`

### ⏳ temp/
Tymczasowe zdjęcia nieprzypisane do konkretnych zleceń
- `unassigned/` - zdjęcia oczekujące na przypisanie

## 🛡️ Bezpieczeństwo
- Tylko autoryzowani użytkownicy mogą uploadować
- Walidacja formatów: JPG, PNG, WEBP
- Maksymalny rozmiar: 10MB per plik
- Sanityzacja nazw plików

## 📏 Naming Convention
Format: `{orderID}_{category}_{timestamp}_{userId}.{ext}`
Przykład: `ORD2025093000001_before_20250930_143022_USER001.jpg`

---
Utworzone: 2025-09-30 23:05
System: Technik Upload System v1.0