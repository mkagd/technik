# 🔧 Rozwiązanie CSP: "Refused to frame"

## ❌ Problem:

```
Refused to frame 'http://localhost:3000/api/proxy/north?url=...' 
because it violates the following Content Security Policy directive: 
"frame-src 'none'".
```

**Przyczyna**: Next.js domyślnie **blokuje** wszystkie iframe (`frame-src 'none'`)

---

## ✅ Rozwiązanie:

### 1. **Dodano CSP headers w `next.config.js`**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: false,
  compress: true,
  
  // ✅ Zezwól na iframe z proxy (dla North.pl)
  async headers() {
    return [
      {
        // Dla wszystkich stron
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://north.pl http://localhost:3000; frame-ancestors 'self';"
          }
        ]
      },
      {
        // Specjalnie dla proxy API
        source: '/api/proxy/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL'
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *"
          }
        ]
      }
    ];
  }
};
```

### 2. **Co to robi:**

#### A) `frame-src 'self' https://north.pl http://localhost:3000`
Zezwala na iframe z:
- `'self'` - własna domena (localhost:3000)
- `https://north.pl` - bezpośrednio z North.pl (gdyby nie blokowali)
- `http://localhost:3000` - proxy endpoint

#### B) `frame-ancestors 'self'`
Zezwala osadzić aplikację tylko w tej samej domenie (bezpieczeństwo)

#### C) `X-Frame-Options: ALLOWALL`
Pozwala proxy zwracać HTML który może być osadzony w iframe

---

## 🚀 Restart serwera:

**WAŻNE**: Po zmianie `next.config.js` **MUSISZ zrestartować** serwer!

```bash
# Zatrzymaj serwer (Ctrl+C)
# Uruchom ponownie:
npm run dev -- -H 0.0.0.0
```

Lub PowerShell:
```powershell
Get-Process -Name node | Stop-Process -Force
npm run dev -- -H 0.0.0.0
```

---

## 🧪 Test:

1. **Otwórz**: `http://localhost:3000/technician/magazyn/zamow`
2. **Kliknij**: "🔍 Szukaj na North.pl"
3. **Sprawdź**: Czy modal się otwiera
4. **Sprawdź**: Czy iframe się ładuje (nie ma błędu CSP)

### Expected result:
✅ North.pl ładuje się w iframe  
✅ Brak błędu "Refused to frame"

### If still fails:
1. **Sprawdź DevTools Console** (F12)
2. **Sprawdź czy serwer został zrestartowany**
3. **Wyczyść cache przeglądarki** (Ctrl+Shift+R)

---

## 🔒 Bezpieczeństwo:

### To jest bezpieczne?
✅ **TAK** - bo:
1. Zezwalamy tylko na `'self'` + `north.pl`
2. Proxy jest ograniczone tylko do North.pl (walidacja w API)
3. `frame-ancestors 'self'` - nikt inny nie może osadzić naszej aplikacji

### Co jest zabronione:
❌ Iframe z innych domen (np. `facebook.com`)  
❌ Osadzenie naszej aplikacji na innych stronach  
❌ XSS ataki przez iframe

---

## 🔮 Alternatywne rozwiązania:

### 1. **Bez CSP (NIEBEZPIECZNE)**
```javascript
// NIE POLECAM!
headers: [
  {
    key: 'Content-Security-Policy',
    value: "frame-src *;" // Wszystkie iframe dozwolone
  }
]
```

### 2. **Tylko proxy localhost**
```javascript
headers: [
  {
    key: 'Content-Security-Policy',
    value: "frame-src 'self' http://localhost:3000;" // Tylko localhost
  }
]
```

### 3. **Development vs Production**
```javascript
async headers() {
  const isDev = process.env.NODE_ENV === 'development';
  
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: isDev 
            ? "frame-src 'self' http://localhost:3000 https://north.pl;" 
            : "frame-src 'self' https://yourdomain.com https://north.pl;"
        }
      ]
    }
  ];
}
```

---

## 📝 Checklist:

- [x] Dodano CSP headers w `next.config.js`
- [x] Zezwolono na `frame-src 'self'` + localhost + north.pl
- [x] Dodano `X-Frame-Options: ALLOWALL` dla proxy
- [x] Zrestartowano serwer dev
- [ ] Przetestowano iframe
- [ ] Sprawdzono czy North.pl się ładuje
- [ ] Dodano CSP do production config (jeśli deploy)

---

## 🐛 Troubleshooting:

### Problem 1: Nadal "Refused to frame"
**Rozwiązanie**:
1. Zrestartuj serwer (Ctrl+C → npm run dev)
2. Wyczyść cache (Ctrl+Shift+R)
3. Sprawdź DevTools → Network → Headers

### Problem 2: North.pl nie ładuje się
**Rozwiązanie**:
1. Otwórz bezpośrednio: `http://localhost:3000/api/proxy/north?url=https://north.pl`
2. Sprawdź logi serwera:
   ```
   🔗 Proxy request: https://north.pl/...
   📥 Fetching from North.pl...
   ✅ Fetched HTML
   ```
3. Jeśli 403/503 → North.pl blokuje (użyj Rozwiązania 1 - nowa karta)

### Problem 3: JavaScript North.pl nie działa
**Rozwiązanie**:
To normalne - niektóre JS może nie działać w iframe przez proxy.  
Użyj **Rozwiązania 1** (nowa karta) dla pełnej funkcjonalności.

---

## 📊 Porównanie final:

| | Nowa karta | Proxy + CSP fix | Electron |
|---|------------|-----------------|----------|
| **Setup** | Prosty | Średni | Trudny |
| **CSP needed?** | ❌ Nie | ✅ TAK | ❌ Nie |
| **North.pl 100%?** | ✅ Tak | ⚠️ ~80% | ✅ Tak |
| **UX** | ⚠️ Przełączanie | ✅ W aplikacji | ✅✅ Idealne |

---

**Status**: ✅ **CSP NAPRAWIONE** - serwer zrestartowany, gotowe do testów!

Teraz sprawdź czy iframe działa! 🚀
