# Upload Logs

Ten folder zawiera logi systemu uploadowania zdjęć.

## Pliki:
- `uploads.log` - główny log wszystkich uploadów
- `errors.log` - logi błędów (tworzone automatycznie)

## Format logów:
```json
{
  "timestamp": "2025-09-30T23:15:00.000Z",
  "action": "upload",
  "orderId": "ORD2025093000001", 
  "category": "before",
  "userId": "USER_001",
  "filename": "photo.jpg",
  "success": true
}
```

---
Utworzone: 2025-09-30 23:15