# 🔐 TECHNICIAN PANEL - Backend API Documentation

## 📋 Overview

Nowy system panelu pracownika z pełną autoryzacją JWT i systemem wizyt.

**Status:** ✅ Backend w budowie  
**Data:** 3 października 2025

---

## 🎯 Architecture

```
📁 Backend Structure:
├── pages/api/technician/
│   ├── auth.js              ✅ DONE - Login, logout, validate, refresh token
│   ├── visits.js            🔄 TODO - Pobieranie wizyt pracownika
│   ├── visit-details.js     🔄 TODO - Szczegóły pojedynczej wizyty
│   ├── update-status.js     🔄 TODO - Aktualizacja statusu wizyty
│   ├── add-notes.js         🔄 TODO - Dodawanie notatek
│   ├── upload-photo.js      🔄 TODO - Upload zdjęć
│   ├── time-tracking.js     🔄 TODO - Śledzenie czasu pracy
│   └── stats.js             🔄 TODO - Statystyki pracownika
│
└── data/
    ├── employees.json            ✅ Existing - Dane pracowników
    ├── orders.json               ✅ Existing - Zlecenia z wizytami
    └── technician-sessions.json  ✅ NEW - Sesje JWT
```

---

## 🔐 API: Authentication (`/api/technician/auth`)

### ✅ **1. LOGIN - Logowanie pracownika**

**Endpoint:** `POST /api/technician/auth`

**Request:**
```json
{
  "action": "login",
  "email": "jan.kowalski@techserwis.pl",
  "password": "haslo123",
  "rememberMe": false
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "ddba751e2fb1aed74dcd8423c7f1d067...",
  "employee": {
    "id": "EMP25189001",
    "email": "jan.kowalski@techserwis.pl",
    "name": "Jan Kowalski",
    "firstName": "Jan",
    "lastName": "Kowalski",
    "specializations": ["Serwis AGD", "Naprawa pralek"],
    "agdSpecializations": {
      "primaryCategory": "AGD",
      "devices": [...],
      "specialSkills": [...]
    },
    "workingHours": "8:00-16:00",
    "phone": "+48 123 456 789",
    "rating": 4.8,
    "completedJobs": 245
  },
  "expiresIn": "7d"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid password"
}
```

**Test Command (PowerShell):**
```powershell
$body = @{
  action='login'
  email='jan.kowalski@techserwis.pl'
  password='haslo123'
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:3000/api/technician/auth' `
  -Method Post -Body $body -ContentType 'application/json'
```

---

### ✅ **2. VALIDATE - Walidacja tokenu**

**Endpoint:** `GET /api/technician/auth?action=validate`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Token is valid",
  "employee": {
    "id": "EMP25189001",
    "name": "Jan Kowalski",
    ...
  },
  "session": {
    "createdAt": "2025-10-03T09:17:06.042Z",
    "lastActivity": "2025-10-03T09:17:06.042Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**Test Command:**
```powershell
$token = "ddba751e2fb1aed74dcd8423c7f1d067..."

Invoke-RestMethod -Uri 'http://localhost:3000/api/technician/auth?action=validate' `
  -Method Get -Headers @{Authorization="Bearer $token"}
```

---

### ✅ **3. LOGOUT - Wylogowanie**

**Endpoint:** `POST /api/technician/auth`

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "action": "logout"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Test Command:**
```powershell
$token = "ddba751e2fb1aed74dcd8423c7f1d067..."
$body = @{action='logout'} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:3000/api/technician/auth' `
  -Method Post -Body $body -ContentType 'application/json' `
  -Headers @{Authorization="Bearer $token"}
```

---

### ✅ **4. REFRESH - Odświeżenie tokenu**

**Endpoint:** `POST /api/technician/auth`

**Headers:**
```
Authorization: Bearer {old_token}
```

**Request:**
```json
{
  "action": "refresh"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "token": "new_token_here...",
  "expiresIn": "7d"
}
```

---

## 🔒 Security Features

### ✅ **Implemented:**
- JWT-like tokens (64-character hex)
- Password hashing (SHA256)
- Token expiration (7 days)
- Session tracking with IP and User-Agent
- Invalid token cleanup
- Remember me functionality

### 🔄 **TODO:**
- Rate limiting (prevent brute force)
- Stronger password hashing (bcrypt)
- Multi-device session management
- Token blacklisting
- 2FA (optional)

---

## 📁 Data Files

### `data/technician-sessions.json`
```json
[
  {
    "token": "ddba751e2fb1aed74dcd8423c7f1d067...",
    "employeeId": "EMP25189001",
    "email": "jan.kowalski@techserwis.pl",
    "createdAt": "2025-10-03T09:17:06.042Z",
    "lastActivity": "2025-10-03T09:17:06.042Z",
    "isValid": true,
    "rememberMe": false,
    "ip": "::1",
    "userAgent": "Mozilla/5.0..."
  }
]
```

### `data/employees.json` (existing)
- Already contains employee data
- Uses employee IDs like `EMP25189001`
- Has specializations, ratings, completed jobs

---

## 🧪 Testing Checklist

### Auth API:
- [x] Login with valid credentials → Returns token
- [x] Login with invalid password → Error 401
- [x] Login with inactive account → Error 401
- [x] Validate valid token → Returns employee data
- [x] Validate expired token → Error 401
- [ ] Logout → Invalidates token
- [ ] Refresh token → Returns new token

---

## 🚀 Next Steps

1. **Create visits.js API** - Pobieranie wizyt pracownika z `data/orders.json`
2. **Create visit-details.js API** - Szczegóły pojedynczej wizyty
3. **Create update-status.js API** - Zmiana statusu wizyty
4. **Create add-notes.js API** - Dodawanie notatek serwisanta
5. **Create upload-photo.js API** - Upload zdjęć przed/po
6. **Create time-tracking.js API** - Timer czasu pracy
7. **Create stats.js API** - Statystyki pracownika

---

## 📝 Notes

- **Password:** Currently using default `haslo123` for all employees
- **Token Storage:** Stored in `data/technician-sessions.json`
- **Expiration:** 7 days (can be configured)
- **Old Panel:** `pages/pracownik-panel.js` remains untouched

---

**Last Updated:** 2025-10-03  
**Author:** AI Assistant  
**Status:** Auth API complete, ready for next endpoints
