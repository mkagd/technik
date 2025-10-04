# 🔧 Minimalna konfiguracja Vercel Environment Variables

## ✅ WYMAGANE (bez tych strona może nie działać):

```env
# Admin Panel - ZMIEŃ na własne hasło!
NEXT_PUBLIC_ADMIN_PASS=twoje_nowe_haslo_admin
```

## 🔄 OPCJONALNE (możesz dodać później):

```env
# Google Maps (dla geolokalizacji - jeśli chcesz dokładniejsze mapy)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCxxxxxx_twoj_klucz

# Email (Resend - jeśli chcesz wysyłać emaile)
RESEND_API_KEY=re_xxxxxxxxx_twoj_klucz
RESEND_EMAIL_FROM=noreply@twojadomena.pl

# OpenAI (jeśli używasz AI Scanner)
OPENAI_API_KEY=sk-xxxxxxxxx_twoj_klucz

# Supabase (jeśli używasz external database)
SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚀 SZYBKI START (tylko z admin hasłem):

### Krok 1: Idź na Vercel
https://vercel.com/new

### Krok 2: Import repo
Znajdź: **mkagd/technik** → kliknij **Import**

### Krok 3: Dodaj TYLKO tę zmienną:
```
Name: NEXT_PUBLIC_ADMIN_PASS
Value: moje_super_haslo_123
Environment: Production, Preview, Development (zaznacz wszystkie 3)
```

### Krok 4: Deploy!
Kliknij **Deploy** - projekt się zbuduje!

---

## 📱 Po deployment:

URL będzie wyglądał tak:
```
https://technik-xxxx.vercel.app/index-serwis-agd
```

### Testuj:
1. **Geolokalizacja będzie działać** (HTTPS!)
2. **Multi-city system** - 5 miast gotowych
3. **Admin panel**: https://technik-xxxx.vercel.app/admin (z Twoim hasłem)

---

## 🔑 Klucze API - gdzie je zdobyć (później):

### Google Maps API:
1. https://console.cloud.google.com/
2. Enable: Geocoding API + Maps JavaScript API
3. Create API Key
4. Dodaj do Vercel: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### Resend (email):
1. https://resend.com/
2. Sign up (darmowe 3000 email/miesiąc)
3. Create API Key
4. Dodaj do Vercel: `RESEND_API_KEY`

### OpenAI (AI features):
1. https://platform.openai.com/
2. Create API Key ($5-20/miesiąc)
3. Dodaj do Vercel: `OPENAI_API_KEY`

---

## ⚡ Najszybsza opcja:

**MOŻESZ DEPLOYOWAĆ TERAZ TYLKO Z HASŁEM ADMIN!** 

Reszta API to dodatki. Podstawowe funkcje (multi-city, geolokalizacja, strony miast) będą działać bez dodatkowych kluczy! 🎉