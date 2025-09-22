# 🚀 Instrukcje wdrożenia na Vercel

## Kroki wdrożenia Twojej aplikacji rezerwacji online

### 📋 **Wymagania przed wdrożeniem:**
1. Konto GitHub (jeśli nie masz - załóż na [github.com](https://github.com))
2. Konto Vercel (darmowe - załóż na [vercel.com](https://vercel.com))

---

### **KROK 1: Umieść kod na GitHub**

1. **Jeśli nie masz jeszcze repozytorium GitHub:**
   - Wejdź na [github.com](https://github.com)
   - Kliknij "New repository" 
   - Nazwij np. "rezerwacja-serwis"
   - **WAŻNE:** Zaznacz "Public" (dla darmowego planu Vercel)
   - Kliknij "Create repository"

2. **Połącz lokalne repozytorium z GitHub:**
   ```bash
   git remote add origin https://github.com/TWOJA-NAZWA/rezerwacja-serwis.git
   git branch -M main
   git push -u origin main
   ```

---

### **KROK 2: Wdróż na Vercel**

1. **Wejdź na [vercel.com](https://vercel.com)**
2. **Zaloguj się przez GitHub**
3. **Kliknij "Import Project"**
4. **Wybierz swoje repozytorium "rezerwacja-serwis"**
5. **Konfiguracja:**
   - Framework: Next.js ✅ (zostanie wykryty automatycznie)
   - Build Command: `npm run build`
   - Install Command: `npm install --legacy-peer-deps`
   - Output Directory: `.next` (domyślne)

6. **WAŻNE - Environment Variables:**
   Dodaj zmienne środowiskowe w Vercel:
   ```
   SUPABASE_URL=https://twoj-projekt.supabase.co
   SUPABASE_ANON_KEY=twoj_anon_key
   RESEND_API_KEY=twoj_resend_api_key  
   RESEND_EMAIL_FROM=noreply@twojadomena.pl
   NEXT_PUBLIC_ADMIN_PASS=twoje_bezpieczne_haslo
   ```

7. **Kliknij "Deploy"**

---

### **KROK 3: Konfiguracja po wdrożeniu**

1. **Otrzymasz link typu:** `https://rezerwacja-serwis.vercel.app`
2. **Każda zmiana w kodzie = automatyczne wdrożenie!**
3. **Domena własna (opcjonalnie):**
   - W ustawieniach Vercel możesz dodać własną domenę
   - Instrukcje DNS znajdziesz w panelu

---

### **🔧 Rozwiązywanie problemów:**

#### **Problem: Błędy buildu**
```bash
# Sprawdź lokalnie:
npm run build

# Jeśli są błędy, usuń problematyczne pliki:
# rm pages/plik-z-bledem.js
```

#### **Problem: Missing dependencies**
W ustawieniach Vercel zmień Install Command na:
```
npm install --legacy-peer-deps --force
```

#### **Problem: Environment variables**
- Sprawdź czy wszystkie zmienne są ustawione
- Zmienne zaczynające się od `NEXT_PUBLIC_` są widoczne w przeglądarce
- Restart deployment po dodaniu nowych zmiennych

---

### **📱 Funkcje działające po wdrożeniu:**

✅ **Działające bez dodatkowej konfiguracji:**
- Podstawowa strona główna
- System rezerwacji (frontend)
- Interfejs kalendarza
- Panel administracyjny (frontend)
- PWA (aplikacja webowa)

⚠️ **Wymagające konfiguracji zewnętrznych serwisów:**
- **Supabase** (baza danych) - załóż konto na [supabase.com](https://supabase.com)
- **Google Maps** - klucz API na [console.cloud.google.com](https://console.cloud.google.com)
- **Google Auth** - konfiguracja OAuth na Google Cloud Console
- **Email** (Resend) - konto na [resend.com](https://resend.com)

---

### **🎉 Gotowe!**

Twoja aplikacja jest teraz dostępna na całym świecie pod adresem:
**https://rezerwacja-serwis-TWOJE-ID.vercel.app**

#### **Następne kroki:**
1. Skonfiguruj Supabase dla pełnej funkcjonalności bazy danych
2. Dodaj klucz Google Maps dla map
3. Skonfiguruj Google OAuth dla logowania
4. Przetestuj wszystkie funkcje

#### **Aktualizacje:**
Każdy `git push` automatycznie aktualizuje stronę! 🚀

---

**🆘 Potrzebujesz pomocy?**
- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Next.js Deployment: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)