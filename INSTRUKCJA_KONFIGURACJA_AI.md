# 🤖 INSTRUKCJA KONFIGURACJI AI - KOMPLETNA

## 📋 OBECNY STAN SYSTEMU

✅ **GOTOWE DO UŻYCIA:**
- **GPT-4o mini** - pełna integracja z OpenAI API
- **Google Gemini Pro** - pełna integracja z Google AI API  
- **Klasyczne AI** - działający system bazowy (fallback)
- **Frontend** - przełączniki AI w trybie developerskim

✅ **BIBLIOTEKI ZAINSTALOWANE:**
- `openai@4.67.3` - OpenAI API
- `@google/generative-ai@0.21.0` - Google Gemini API

## 🔧 KONFIGURACJA KLUCZY API

### 1️⃣ OpenAI GPT-4o mini (PŁATNE - ~0.15$ za rozmowę)

**Krok 1: Rejestracja**
1. Idź na https://platform.openai.com
2. Zarejestruj się (email + weryfikacja telefonu)
3. Zaloguj się na konto

**Krok 2: Płatność**
1. Przejdź do **Billing** → **Payment methods**
2. Dodaj kartę kredytową/debetową
3. Ustaw **Usage limit** (np. 20$)
4. **WAŻNE:** Minimum 5$ start credit

**Krok 3: Klucz API**
1. Przejdź do **API keys**
2. Kliknij **"Create new secret key"**
3. Skopiuj klucz (zaczyna się od `sk-...`)

**Krok 4: Konfiguracja**
Otwórz plik `.env.local` i zamień:
```
OPENAI_API_KEY=your-openai-api-key-here
```
na:
```
OPENAI_API_KEY=sk-twoj-prawdziwy-klucz-tutaj
```

### 2️⃣ Google Gemini Pro (DARMOWE - 60 zapytań/min)

**Krok 1: Google AI Studio**
1. Idź na https://makersuite.google.com/app/apikey
2. Zaloguj się kontem Google
3. Kliknij **"Create API Key"**

**Krok 2: Konfiguracja**
Dodaj do pliku `.env.local`:
```
GOOGLE_GEMINI_API_KEY=twoj-gemini-klucz-tutaj
```

**Krok 3: Aktualizacja kodu**
Otwórz `pages/api/gemini-chat.js` i zamień linię:
```javascript
const apiKey = 'AIzaSyBvNrJdYJhSZJzLb-wOGCQTn4kxUOtYT7w';
```
na:
```javascript
const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
```

## 🎯 JAK TESTOWAĆ

### Testowanie w Aplikacji
1. Uruchom serwer: `npm run dev`
2. Otwórz http://localhost:3000
3. Kliknij ikonę chatu (prawy dolny róg)
4. W trybie development zobaczysz 3 przyciski:
   - 🔷 **Gemini Pro** (darmowe)
   - 🤖 **GPT-4o mini** (płatne)  
   - 🔧 **Klasyczne** (zawsze działa)

### Kolejność Testowania
1. **Najpierw:** 🔧 Klasyczne AI (zawsze działa)
2. **Potem:** 🔷 Gemini Pro (jeśli skonfigurujesz klucz)
3. **Na końcu:** 🤖 GPT-4o mini (gdy dodasz płatność)

## 💰 KOSZTY I LIMITY

| AI System | Koszt | Limit | Jakość | Status |
|-----------|-------|-------|--------|--------|
| **Klasyczne** | 🆓 Darmowe | Bez limitu | Podstawowa | ✅ Działa |
| **Gemini Pro** | 🆓 Darmowe | 60/min | Wysoka | ⚠️ Wymaga klucza |
| **GPT-4o mini** | 💰 ~0.15$/rozmowa | Płatny | Najwyższa | ⚠️ Wymaga płatności |

## 🚀 ZALECANA STRATEGIA

### Dla Testów (TERAZ):
1. **Gemini Pro** - najlepszy stosunek jakość/koszt (darmowe)
2. Skonfiguruj klucz Google AI w 5 minut
3. Testuj pełne możliwości AI za darmo

### Dla Produkcji (PÓŹNIEJ):
1. **GPT-4o mini** - najwyższa jakość
2. Dodaj billing w OpenAI
3. Przełącz na płatną wersję gdy będziesz zadowolony

## 🔧 SZYBKA KONFIGURACJA GEMINI (5 MINUT)

```bash
# 1. Pobierz klucz API
# Idź na: https://makersuite.google.com/app/apikey

# 2. Edytuj .env.local
echo "GOOGLE_GEMINI_API_KEY=twoj-klucz-tutaj" >> .env.local

# 3. Aktualizuj kod
# Otwórz pages/api/gemini-chat.js
# Zmień: const apiKey = 'demo-key'
# Na: const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

# 4. Restart serwera
npm run dev
```

## 🐛 ROZWIĄZYWANIE PROBLEMÓW

### Błąd: "API key not valid"
- **OpenAI:** Sprawdź czy klucz zaczyna się od `sk-`
- **Gemini:** Sprawdź czy klucz jest z https://makersuite.google.com

### Błąd: "Rate limit exceeded"  
- **OpenAI:** Dodaj środki do konta
- **Gemini:** Poczekaj minutę (limit 60/min)

### Błąd: "Network error"
- Sprawdź połączenie internetowe
- Restart serwera: `Ctrl+C` → `npm run dev`

## 📱 INTERFEJS UŻYTKOWNIKA

W trybie development (NODE_ENV=development) zobaczysz:
- **🔷** - Gemini Pro (fioletowy gdy aktywny)
- **🤖** - GPT-4o mini (zielony gdy aktywny) 
- **🔧** - Klasyczne AI (pomarańczowy gdy aktywny)

W produkcji system automatycznie wybierze najlepsze dostępne AI.

## 📄 PLIKI DO EDYCJI

1. **`.env.local`** - klucze API
2. **`pages/api/gemini-chat.js`** - konfiguracja Gemini
3. **`components/LiveChatAI.js`** - przełączniki AI (gotowe)

---

## 🎉 PODSUMOWANIE

**Masz teraz 3 systemy AI:**
- ✅ Klasyczne AI - zawsze działa
- 🔷 Gemini Pro - 5 min konfiguracji, darmowe  
- 🤖 GPT-4o mini - najlepsze, ale płatne

**Zalecenie:** Zacznij od Gemini Pro - darmowe i potężne! 🚀