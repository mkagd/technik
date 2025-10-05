# 🔄 Allegro Integration - Change Log

## 🎉 v2.0 - Sandbox Support (Current)
**Data:** 2024 (Dzisiaj)

### ✨ Nowe funkcje
- ✅ **Sandbox Mode** - pełne wsparcie środowiska testowego
- ✅ **Checkbox toggle** - łatwe przełączanie Sandbox ↔ Production
- ✅ **Badge indicator** - widoczny "🧪 SANDBOX" gdy aktywny
- ✅ **Dual URL routing** - automatyczne przełączanie endpoint-ów
- ✅ **Config persistence** - zapisywanie preferencji sandbox
- ✅ **Environment variables** - ALLEGRO_SANDBOX flag
- ✅ **Updated UI banners** - instrukcje dla Sandbox + Production

### 📝 Zmodyfikowane pliki
```
lib/allegro-oauth.js              - dodano isSandbox(), dual URL support
pages/api/allegro/search.js       - dodano sandbox detection, dual API URL
pages/api/allegro/config.js       - dodano sandbox flag save/load
pages/admin/allegro/settings.js   - dodano checkbox Sandbox, updated UI
pages/admin/allegro/search.js     - dodano badge "🧪 SANDBOX", sandbox check
.env.local                        - dodano ALLEGRO_SANDBOX=true
```

### 📚 Nowa dokumentacja
```
✅ ALLEGRO_SANDBOX_GUIDE.md       - kompletny przewodnik Sandbox
✅ ALLEGRO_API_STATUS.md          - zaktualizowany status (v2.0)
✅ ALLEGRO_INTEGRATION_CHANGELOG.md - ten plik
```

### 🔧 Techniczne szczegóły
**URL Sandbox:**
- Auth: `https://allegro.pl.allegrosandbox.pl/auth/oauth/token`
- API: `https://api.allegro.pl.allegrosandbox.pl/offers/listing`

**URL Production:**
- Auth: `https://allegro.pl/auth/oauth/token`
- API: `https://api.allegro.pl/offers/listing`

**Config structure:**
```json
{
  "clientId": "...",
  "clientSecret": "...",
  "sandbox": true  // <-- nowe pole
}
```

### 🎯 User flow
1. User otwiera Settings
2. Widzi checkbox "🧪 Używaj Sandbox"
3. Zaznacza (dla testów) lub odznacza (dla produkcji)
4. Wkleja credentials z odpowiedniego portalu
5. System automatycznie używa właściwych URL-i
6. Badge "🧪 SANDBOX" pokazuje aktywny tryb

### 🐛 Bugfixes
- ✅ Naprawiono brak instrukcji Sandbox w bannerze demo
- ✅ Dodano sprawdzanie trybu przy załadowaniu strony

---

## 🎊 v1.0 - Full OAuth 2.0 Implementation
**Data:** 2024 (Wcześniej dzisiaj)

### ✨ Pierwsze wdrożenie
- ✅ **OAuth 2.0 Client Credentials** - pełna implementacja
- ✅ **Token caching** - 12h cache w filesystem
- ✅ **Auto refresh** - automatyczne odświeżanie tokenów
- ✅ **Settings UI** - interfejs konfiguracji credentials
- ✅ **Test connection** - przycisk testowania połączenia
- ✅ **Real API search** - prawdziwe wyszukiwanie przez Allegro API
- ✅ **Demo mode fallback** - przykładowe dane gdy nie skonfigurowane

### 📝 Utworzone pliki
```
lib/allegro-oauth.js              - OAuth token manager
pages/api/allegro/search.js       - Search endpoint z OAuth
pages/api/allegro/config.js       - Config save/load
pages/api/allegro/test.js         - Connection test
pages/api/allegro/clear-cache.js  - Token cache management
pages/admin/allegro/settings.js   - OAuth settings UI
```

### 📚 Dokumentacja
```
✅ ALLEGRO_API_STATUS.md          - status i instrukcje
✅ .env.local template            - przykładowa konfiguracja
```

### 🔐 Security
- ✅ Client Secret w .env.local (git ignored)
- ✅ Token cache w data/ (git ignored)
- ✅ Bezpieczne Basic Auth dla token request
- ✅ Bearer token dla API requests

### 🎯 User benefits
- ✅ Prawdziwe oferty z Allegro
- ✅ Aktualne ceny i dostępność
- ✅ Wszystkie filtry działają
- ✅ Integracja z lokalnym magazynem
- ✅ Lista zakupów z prawdziwymi linkami

---

## 🎭 v0.5 - Demo Mode
**Data:** 2024 (Przed OAuth)

### ✨ Funkcje
- ✅ Mockowe dane produktów
- ✅ Pełny UI wyszukiwania
- ✅ Filtry (cena, dostawa, sortowanie)
- ✅ Multi-select z checkboxami
- ✅ Generator listy zakupów
- ✅ Porównanie z lokalnymi częściami

### 💡 Cel
Prezentacja interfejsu i funkcjonalności przed wdrożeniem API

---

## 📊 Porównanie wersji

| Feature | v0.5 Demo | v1.0 OAuth | v2.0 Sandbox |
|---------|-----------|------------|--------------|
| UI wyszukiwania | ✅ | ✅ | ✅ |
| Filtry i sortowanie | ✅ | ✅ | ✅ |
| Lista zakupów | ✅ | ✅ | ✅ |
| **Prawdziwe dane** | ❌ | ✅ | ✅ |
| **OAuth 2.0** | ❌ | ✅ | ✅ |
| **Token management** | ❌ | ✅ | ✅ |
| **Settings UI** | ❌ | ✅ | ✅ |
| **Sandbox support** | ❌ | ❌ | ✅ |
| **Production support** | ❌ | ✅ | ✅ |
| **Badge indicator** | ❌ | ❌ | ✅ |
| **Dual-mode toggle** | ❌ | ❌ | ✅ |

---

## 🚀 Co dalej?

### v2.1 - Planning (Opcjonalne)
- 🔜 Rate limiting monitoring
- 🔜 Detailed error messages
- 🔜 Retry logic for failed requests
- 🔜 Cache search results (optional)
- 🔜 Advanced filters (kategorie, stan)
- 🔜 Bulk selection tools
- 🔜 Export to Excel

### v3.0 - Future (Długoterminowe)
- 🔮 OAuth Authorization Code flow (user login)
- 🔮 Składanie zamówień przez API
- 🔮 Tracking dostaw
- 🔮 Integracja z płatnościami
- 🔮 Automatyczne zamówienia (low stock → auto order)

---

## 📝 Notes

**Sandbox vs Production:**
- Sandbox jest **idealny** do developmentu i testów
- Production wymaga biznesowej weryfikacji
- Oba tryby mają identyczne API - łatwa migracja

**Token Management:**
- Tokeny cached w `data/allegro-token-cache.json`
- Auto refresh 1h przed wygaśnięciem
- Separate tokens dla Sandbox vs Production

**Maintenance:**
- Config w `data/allegro-config.json`
- Secrets w `.env.local` (git ignored)
- Logi w console (check `[Allegro OAuth]`)

---

## 🎉 Podsumowanie

**v2.0 dodaje pełne wsparcie Sandbox!**

Teraz masz 3 tryby:
1. 🎭 **Demo** - mockowe dane (gdy nie skonfigurowane)
2. 🧪 **Sandbox** - testowe Allegro API (bezpieczne testy)
3. 🚀 **Production** - prawdziwe oferty Allegro (live)

**Przełączanie jest jednokliknięciem!** ✅

System jest w pełni gotowy do użycia 🎊
