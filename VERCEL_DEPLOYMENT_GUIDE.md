# 🚀 Wdrożenie na Vercel - Kompletny Przewodnik

## 📋 Spis treści
1. [Przygotowanie projektu](#przygotowanie-projektu)
2. [Konfiguracja zmiennych środowiskowych](#konfiguracja-zmiennych-środowiskowych)
3. [Wdrożenie przez Vercel CLI](#wdrożenie-przez-vercel-cli)
4. [Wdrożenie przez dashboard Vercel](#wdrożenie-przez-dashboard-vercel)
5. [Konfiguracja domeny](#konfiguracja-domeny)
6. [Problemy z danymi (pliki JSON)](#problemy-z-danymi-pliki-json)
7. [Migracja na bazę danych](#migracja-na-bazę-danych)

---

## 🛠️ Przygotowanie projektu

### 1. Sprawdź konfigurację Next.js

**next.config.js** (powinien już istnieć):
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true
});

module.exports = withPWA({
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'twojadomena.vercel.app'],
    unoptimized: false
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },
});
```

### 2. Sprawdź `vercel.json`

✅ **Plik już istnieje i jest skonfigurowany poprawnie!**

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "headers": [...]
}
```

### 3. Sprawdź `.gitignore`

✅ **Plik już istnieje i jest poprawny!**

**⚠️ KRYTYCZNE:** Upewnij się że te linie są w `.gitignore`:
```
.env
.env.local
.env.production.local
node_modules/
.next/
.vercel
data/*.json  # ← To jest WAŻNE!
```

---

## 🔐 Konfiguracja zmiennych środowiskowych

### Zmienne wymagane:

#### 1. **OPENAI_API_KEY** (AI Scanner)
```
https://platform.openai.com/api-keys
```

#### 2. **NEXT_PUBLIC_GOOGLE_MAPS_API_KEY** (Mapy Google)
```
https://console.cloud.google.com/google/maps-apis
```

#### 3. **SUPABASE_URL** i **SUPABASE_ANON_KEY** (Baza danych - opcjonalne na początek)
```
https://supabase.com/dashboard
```

#### 4. **NEXT_PUBLIC_ADMIN_PASS** (Hasło administratora)
```
NEXT_PUBLIC_ADMIN_PASS=admin123
```

#### 5. **Allegro API** (jeśli używasz integracji)
```
ALLEGRO_CLIENT_ID=twoj_client_id
ALLEGRO_CLIENT_SECRET=twoj_secret
ALLEGRO_REDIRECT_URI=https://twojadomena.vercel.app/api/auth/allegro/callback
ALLEGRO_MODE=sandbox
```

---

## 🚀 Wdrożenie przez Vercel CLI

### Krok 1: Instalacja Vercel CLI

```bash
npm install -g vercel
```

### Krok 2: Logowanie

```bash
vercel login
```

### Krok 3: Deploy

```bash
# Przejdź do katalogu projektu
cd d:\Projekty\Technik\Technik

# Deploy do produkcji
vercel --prod
```

**Vercel zapyta:**
```
? Set up and deploy "d:\Projekty\Technik\Technik"? [Y/n] y
? Which scope do you want to deploy to? [Twój account]
? Link to existing project? [y/N] n
? What's your project's name? technik-agd
? In which directory is your code located? ./
```

### Krok 4: Konfiguracja zmiennych przez CLI

```bash
# Dodaj zmienne środowiskowe
vercel env add OPENAI_API_KEY
# Wprowadź wartość klucza

vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
# Wprowadź wartość klucza

vercel env add NEXT_PUBLIC_ADMIN_PASS
# Wprowadź: admin123

# Itd. dla pozostałych zmiennych
```

### Krok 5: Rebuild z nowymi zmiennymi

```bash
vercel --prod
```

---

## 🌐 Wdrożenie przez Dashboard Vercel

### Krok 1: Połącz GitHub

1. Zaloguj się na https://vercel.com
2. Kliknij **"Add New..."** → **"Project"**
3. Import z GitHub:
   - Autoryzuj Vercel w GitHub
   - Wybierz repozytorium `mkagd/technik`

### Krok 2: Konfiguracja projektu

```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### Krok 3: Dodaj zmienne środowiskowe

W sekcji **"Environment Variables"**:

```
OPENAI_API_KEY = sk-...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = AIza...
NEXT_PUBLIC_ADMIN_PASS = admin123
SUPABASE_URL = https://xxx.supabase.co
SUPABASE_ANON_KEY = eyJ...
```

### Krok 4: Deploy

Kliknij **"Deploy"** i poczekaj 2-5 minut.

---

## 🌍 Konfiguracja domeny

### Darmowa domena Vercel:

Po wdrożeniu otrzymasz:
```
https://technik-agd.vercel.app
```

### Własna domena:

1. **Dashboard Vercel** → **Settings** → **Domains**
2. Dodaj domenę: `twojadomena.pl`
3. Vercel pokaże rekordy DNS do dodania:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

4. Dodaj te rekordy w panelu swojego rejestratora domen
5. Poczekaj 24-48h na propagację DNS

---

## ⚠️ KRYTYCZNY PROBLEM: Pliki JSON jako baza danych

### Problem:

Vercel jest **serverless** - każde wdrożenie tworzy nowy kontener.  
**Pliki JSON w folderze `data/` NIE BĘDĄ PERSYSTOWANE!**

```
❌ data/clients.json    - Zniknie po każdym deploy
❌ data/orders.json     - Zniknie po każdym deploy
❌ data/employees.json  - Zniknie po każdym deploy
❌ data/reservations.json - Zniknie po każdym deploy
```

### Rozwiązania:

#### **Opcja 1: Szybkie rozwiązanie (Vercel Blob Storage)**

```bash
npm install @vercel/blob
```

**Kod przykładowy:**
```javascript
// pages/api/clients.js
import { put, get } from '@vercel/blob';

// Zapisz dane
await put('clients.json', JSON.stringify(clients), {
  access: 'public',
});

// Odczytaj dane
const blob = await get('clients.json');
const clients = await blob.json();
```

**Koszt:** $0.15/GB storage, $2.00/GB transfer (pierwszy GB gratis)

#### **Opcja 2: Zalecane rozwiązanie (Supabase)**

**Już masz Supabase w zależnościach!** 🎉

1. **Utwórz projekt:** https://supabase.com/dashboard
2. **Utwórz tabele:**

```sql
-- Tabela klientów
CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postalCode TEXT,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Tabela zleceń
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  orderNumber TEXT UNIQUE,
  clientId TEXT REFERENCES clients(id),
  clientName TEXT,
  deviceType TEXT,
  brand TEXT,
  model TEXT,
  problemDescription TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Tabela pracowników
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT,
  specialization TEXT[],
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Tabela rezerwacji
CREATE TABLE reservations (
  id TEXT PRIMARY KEY,
  clientId TEXT REFERENCES clients(id),
  categories TEXT[],
  devices TEXT[],
  brands TEXT[],
  problems TEXT[],
  scheduledDate DATE,
  timeSlot TEXT,
  status TEXT DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Tabela wizyt
CREATE TABLE visits (
  id TEXT PRIMARY KEY,
  visitId TEXT UNIQUE,
  orderId TEXT REFERENCES orders(id),
  employeeId TEXT REFERENCES employees(id),
  scheduledDate DATE,
  scheduledTime TIME,
  status TEXT DEFAULT 'scheduled',
  type TEXT,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

3. **Zmień API na Supabase:**

**Przykład - pages/api/clients.js:**
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  
  if (req.method === 'POST') {
    const { data, error } = await supabase
      .from('clients')
      .insert([req.body])
      .select();
    
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data[0]);
  }
}
```

**Koszt:** FREE do 500MB database + 1GB file storage + 50K monthly active users

#### **Opcja 3: PostgreSQL (Railway / Neon)**

**Railway.app:**
```
Free tier: 512MB RAM, $5 credit/month
```

**Neon.tech:**
```
Free tier: 0.5GB storage, 3 projects
```

---

## 📊 Migracja danych z JSON do Supabase

### Skrypt migracyjny:

**scripts/migrate-to-supabase.js:**
```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Service key - pełne uprawnienia
);

async function migrate() {
  console.log('🚀 Migracja danych do Supabase...');
  
  // 1. Migruj klientów
  const clients = JSON.parse(fs.readFileSync('./data/clients.json', 'utf8'));
  const { data: clientsData, error: clientsError } = await supabase
    .from('clients')
    .insert(clients);
  
  if (clientsError) {
    console.error('❌ Błąd migracji klientów:', clientsError);
  } else {
    console.log(`✅ Zmigrowano ${clients.length} klientów`);
  }
  
  // 2. Migruj zlecenia
  const orders = JSON.parse(fs.readFileSync('./data/orders.json', 'utf8'));
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .insert(orders);
  
  if (ordersError) {
    console.error('❌ Błąd migracji zleceń:', ordersError);
  } else {
    console.log(`✅ Zmigrowano ${orders.length} zleceń`);
  }
  
  // 3. Migruj pracowników
  const employees = JSON.parse(fs.readFileSync('./data/employees.json', 'utf8'));
  const { data: employeesData, error: employeesError } = await supabase
    .from('employees')
    .insert(employees);
  
  if (employeesError) {
    console.error('❌ Błąd migracji pracowników:', employeesError);
  } else {
    console.log(`✅ Zmigrowano ${employees.length} pracowników`);
  }
  
  console.log('🎉 Migracja zakończona!');
}

migrate();
```

**Uruchom:**
```bash
node scripts/migrate-to-supabase.js
```

---

## 🔧 Checklist przed deploymentem

### ✅ Pliki i konfiguracja
- [ ] `vercel.json` - istnieje i skonfigurowany
- [ ] `.gitignore` - pliki wrażliwe są ignorowane
- [ ] `package.json` - wszystkie zależności zainstalowane
- [ ] `.env.local.example` - dokumentacja zmiennych

### ✅ Zmienne środowiskowe w Vercel
- [ ] `OPENAI_API_KEY`
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- [ ] `NEXT_PUBLIC_ADMIN_PASS`
- [ ] `SUPABASE_URL` (jeśli używasz)
- [ ] `SUPABASE_ANON_KEY` (jeśli używasz)
- [ ] `ALLEGRO_CLIENT_ID` (jeśli używasz)
- [ ] `ALLEGRO_CLIENT_SECRET` (jeśli używasz)

### ✅ Kod
- [ ] Usuń `console.log` z produkcji
- [ ] Sprawdź hardcoded URLs (zmień localhost na zmienne środowiskowe)
- [ ] Sprawdź ścieżki do plików (używaj `path.join` zamiast relatywnych)
- [ ] Usuń debugowanie i testy

### ✅ Dane
- [ ] ⚠️ **KRYTYCZNE:** Zdecyduj co z plikami JSON w `data/`
- [ ] Rozważ migrację do Supabase/bazy danych
- [ ] Backup danych przed deploymentem

---

## 🚨 Częste problemy i rozwiązania

### Problem 1: "Module not found: Can't resolve 'fs'"

**Rozwiązanie:** Używaj `fs` tylko w API routes (server-side), nie w komponentach.

```javascript
// ❌ NIE DZIAŁA w komponencie
import fs from 'fs';

// ✅ DZIAŁA w pages/api/
import fs from 'fs';
```

### Problem 2: "ENOENT: no such file or directory, open './data/clients.json'"

**Rozwiązanie:** Użyj absolutnej ścieżki:

```javascript
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'clients.json');
const data = fs.readFileSync(filePath, 'utf8');
```

### Problem 3: Dane znikają po deploy

**Rozwiązanie:** Vercel jest serverless - użyj bazy danych (Supabase).

### Problem 4: Build timeout

**Rozwiązanie:** Zwiększ limit w `vercel.json`:

```json
{
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 60
    }
  }
}
```

---

## 📱 Po wdrożeniu

### 1. Sprawdź aplikację

```
https://twoj-projekt.vercel.app
```

### 2. Sprawdź logi

```bash
vercel logs
```

### 3. Sprawdź metryki

Dashboard Vercel → **Analytics** → **Web Vitals**

### 4. Skonfiguruj monitoring

**Vercel Analytics:**
```bash
npm install @vercel/analytics
```

```javascript
// pages/_app.js
import { Analytics } from '@vercel/analytics/react';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

---

## 💰 Koszty Vercel

### Free Plan (Hobby):
```
✅ 100GB bandwidth/month
✅ Unlimited deployments
✅ Automatic HTTPS
✅ 100 serverless functions
✅ 1 concurrent build
✅ 100 GB-hours compute
```

**Ograniczenia:**
- ❌ Tylko projekty osobiste (nie komercyjne)
- ❌ 1 użytkownik
- ❌ Limit 30s execution time (można zwiększyć do 60s)

### Pro Plan ($20/month):
```
✅ 1TB bandwidth/month
✅ Unlimited concurrent builds
✅ Password protection
✅ Priority support
✅ Team collaboration
✅ Commercial use
```

---

## 🎯 Następne kroki

### Natychmiastowe:
1. ✅ Deploy na Vercel (test environment)
2. ✅ Skonfiguruj zmienne środowiskowe
3. ✅ Sprawdź czy aplikacja działa

### Krótkoterminowe (1-2 dni):
1. 🔄 Migracja z JSON na Supabase
2. 🔄 Konfiguracja własnej domeny
3. 🔄 Dodanie SSL certificates
4. 🔄 Konfiguracja email notifications

### Długoterminowe (tydzień):
1. 📊 Analytics i monitoring
2. 🔒 Security hardening
3. ⚡ Performance optimization
4. 📱 PWA offline functionality

---

## 📞 Pomoc i wsparcie

**Dokumentacja Vercel:**
https://vercel.com/docs

**Supabase Docs:**
https://supabase.com/docs

**Next.js Deployment:**
https://nextjs.org/docs/deployment

---

**Data utworzenia:** 2025-10-06  
**Status:** ✅ Gotowe do użycia  
**Następny krok:** Uruchom `vercel --prod`
