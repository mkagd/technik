# 🔍 Debugging Login Error - Step by Step

## Problem
Internal server error podczas logowania na Vercel.

## Możliwe przyczyny

### 1. ✅ Middleware auth.js - NAPRAWIONE
- Usunięto `fs` dependency
- Dodano Supabase integration
- **Status**: Fixed w commit e8982f4

### 2. 🔍 Zmienne środowiskowe - DO SPRAWDZENIA

Wymagane env variables w Vercel:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ibwllqynynxcflpqlaeh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=your-secret-key (opcjonalne)
ADMIN_EMAIL=admin@technik.pl (opcjonalne - fallback)
ADMIN_PASSWORD=admin123 (opcjonalne - fallback)
```

### 3. 🔍 Import path - DO SPRAWDZENIA

W `pages/api/auth/login.js`:
```javascript
import { createToken } from '../../../middleware/auth.js';
```

Może być problem z rozszerzeniem `.js` na Vercel.

### 4. 🔍 bcryptjs compatibility - DO SPRAWDZENIA

```javascript
import bcrypt from 'bcryptjs';
```

Może być problem z bcrypt na serverless.

---

## 🧪 Plan Testowania

### Test 1: Sprawdź Vercel Dashboard
1. Otwórz https://vercel.com/dashboard
2. Kliknij projekt "technik"
3. Kliknij "Deployments"
4. Kliknij najnowszy deployment (d1ee037 lub e8982f4)
5. Kliknij "View Function Logs"
6. Znajdź błąd podczas logowania

### Test 2: Sprawdź Environment Variables
1. Vercel Dashboard → Project Settings
2. Environment Variables
3. Verify wszystkie 3 klucze Supabase są ustawione

### Test 3: Test przez curl
```bash
curl -X POST https://[your-url]/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@technik.pl","password":"admin123"}' \
  -v
```

---

## 🔧 Quick Fixes

### Fix 1: Usuń .js z importów
```javascript
// BEFORE
import { createToken } from '../../../middleware/auth.js';

// AFTER
import { createToken } from '../../../middleware/auth';
```

### Fix 2: Inline createToken (emergency fallback)
Jeśli import nie działa, skopiuj funkcję bezpośrednio do login.js:

```javascript
// W pages/api/auth/login.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

function createToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions || [],
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'technik-system',
    audience: 'technik-users'
  });
}

// Reszta kodu login handler...
```

### Fix 3: Add error logging
W `pages/api/auth/login.js`, dodaj więcej logów:

```javascript
export default async function handler(req, res) {
  console.log('🔐 Login handler started');
  console.log('Method:', req.method);
  console.log('Body:', req.body);
  
  try {
    // ... existing code
    console.log('🔐 About to create token for user:', user.email);
    const token = createToken(user);
    console.log('🔐 Token created successfully');
    // ...
  } catch (error) {
    console.error('🔐 DETAILED ERROR:', error);
    console.error('Stack:', error.stack);
    // ... existing error handling
  }
}
```

---

## 📋 Checklist Veryfikacji

- [ ] Sprawdź Vercel Function Logs
- [ ] Verify Environment Variables
- [ ] Test curl request
- [ ] Check import paths (.js extension)
- [ ] Verify bcryptjs installed
- [ ] Check Supabase connection
- [ ] Test env fallback (admin@technik.pl)

---

## 🎯 Najprawdopodobniejsza przyczyna

**Import path issue** - Vercel może mieć problem z `.js` extension w:
```javascript
import { createToken } from '../../../middleware/auth.js';
```

**Rozwiązanie**: Usuń `.js`:
```javascript
import { createToken } from '../../../middleware/auth';
```

---

## 🚀 Szybki Fix

Jeśli chcesz szybko naprawić:

1. Usuń `.js` z importu w `pages/api/auth/login.js`
2. Commit i push
3. Poczekaj 1-2 min na deployment
4. Test login

Chcesz żebym to zrobił? Odpowiedz "tak" i naprawię.
