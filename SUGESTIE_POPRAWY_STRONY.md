# 🎨 SUGESTIE POPRAWY STRONY GŁÓWNEJ

**Data:** 04.10.2025  
**Status:** Proponowane zmiany

---

## ✅ CO DZIAŁA DOBRZE:

1. **Design** - Nowoczesny, czysty, profesjonalny
2. **Statystyki** - Dobrze widoczne (15+ lat, 2500+ napraw, 849+ klientów, 4.9★)
3. **Struktura** - Logiczny układ sekcji
4. **Responsywność** - Działa na mobile i desktop

---

## 🔧 PROPONOWANE POPRAWKI:

### 1️⃣ **NUMER TELEFONU (KRYTYCZNE)**

**Problem:** Placeholder `+48 123 456 789` w 3 miejscach

**Gdzie zmienić:**
- Linia ~361: Hero section - "Szybki kontakt"
- Linia ~600: Sekcja kontakt
- Linia ~684: Stopka

**Na co zmienić:**
```javascript
// ZAMIAST:
href="tel:+48123456789"
<span>+48 123 456 789</span>

// POWINNO BYĆ:
href="tel:+48792392870"
<span>+48 792 392 870</span>
```

---

### 2️⃣ **EMAIL (OPCJONALNE)**

**Aktualny:** `serwis@technik.pl` (linia ~611)

**Jeśli masz inny email, zmień na:**
```javascript
<a href="mailto:jan.kowalski@techserwis.pl">
  jan.kowalski@techserwis.pl
</a>
```

---

### 3️⃣ **RESPONSYWNOŚĆ PRZYCISKÓW CTA**

**Aktualne:** Przyciski w hero section (linia ~336-353)

**Proponowana poprawa:**
```javascript
// PRZED:
<div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">

// PO (lepsze na mobile):
<div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch mb-12">
```

**Plus dodaj `w-full sm:w-auto` do każdego przycisku:**
```javascript
<Link
  href="/rezerwacja"
  className="w-full sm:w-auto group px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg text-white"
>
```

---

### 4️⃣ **SZYBKI KONTAKT - RESPONSYWNOŚĆ**

**Problem:** Może się rozjechać na małych ekranach

**Gdzie:** Linia ~357-367

**Proponowana zmiana:**
```javascript
// PRZED:
<div className={`inline-flex items-center gap-6 px-6 py-4 ${colors.secondary} ${colors.border} border rounded-xl`}>

// PO:
<div className={`inline-flex flex-wrap items-center justify-center gap-4 md:gap-6 px-6 py-4 ${colors.secondary} ${colors.border} border rounded-xl`}>
```

**Plus ukryj separator na mobile:**
```javascript
<div className={`hidden sm:block w-px h-6 ${colors.border} border-l`}></div>
```

---

### 5️⃣ **STOPKA - RESPONSYWNOŚĆ**

**Problem:** Może się źle łamać na mobile

**Gdzie:** Linia ~680-687

**Proponowana zmiana:**
```javascript
// PRZED:
<div className={`flex flex-wrap items-center justify-center gap-2 text-sm ${colors.textTertiary}`}>

// PO (dodaj transition do linku):
<a href="tel:+48792392870" className="hover:text-blue-600 transition-colors">
  +48 792 392 870
</a>
```

---

## 🎨 OPCJONALNE ULEPSZENIA:

### 6️⃣ **Animacje przy scrollu**

Dodaj smooth scroll animations:

```javascript
// Zainstaluj:
npm install framer-motion

// Użyj w sekcjach:
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  viewport={{ once: true }}
>
  {/* Treść sekcji */}
</motion.div>
```

---

### 7️⃣ **Dodaj więcej social proof**

W sekcji statystyk lub poniżej dodaj:

```jsx
<div className="mt-12 text-center">
  <h3 className="text-2xl font-bold mb-6">Zaufali nam</h3>
  <div className="flex justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition">
    {/* Logo firm - jeśli masz partnerów */}
    <img src="/logos/partner1.png" alt="Partner 1" className="h-12" />
    <img src="/logos/partner2.png" alt="Partner 2" className="h-12" />
    <img src="/logos/partner3.png" alt="Partner 3" className="h-12" />
  </div>
</div>
```

---

### 8️⃣ **Dodaj FAQ sekcję**

Przed stopką dodaj:

```jsx
<section className="py-20">
  <div className="container mx-auto px-4">
    <h2 className="text-4xl font-bold text-center mb-12">
      Często zadawane pytania
    </h2>
    <div className="max-w-3xl mx-auto space-y-4">
      <details className="bg-white dark:bg-gray-800 rounded-xl p-6 border">
        <summary className="font-semibold cursor-pointer">
          Ile kosztuje naprawa pralki?
        </summary>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Ceny zaczynają się od 150 zł za diagnostykę...
        </p>
      </details>
      {/* Więcej pytań */}
    </div>
  </div>
</section>
```

---

### 9️⃣ **Dodaj trust badges**

Pod przyciskami CTA dodaj:

```jsx
<div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
  <div className="flex items-center gap-2">
    <FiShield className="text-green-600" />
    <span>Gwarancja na usługi</span>
  </div>
  <div className="flex items-center gap-2">
    <FiClock className="text-blue-600" />
    <span>Szybka realizacja</span>
  </div>
  <div className="flex items-center gap-2">
    <FiAward className="text-yellow-600" />
    <span>Certyfikowani technicy</span>
  </div>
</div>
```

---

### 🔟 **Poprawa meta tagów (SEO)**

W `<Head>`:

```jsx
<Head>
  <title>TECHNIK - Profesjonalny Serwis AGD Dębica | Naprawa pralek, lodówek, zmywarek</title>
  <meta name="description" content="Profesjonalny serwis AGD w Dębicy. Naprawiamy pralki, lodówki, zmywarki, piekarniki. 30 lat doświadczenia. Gwarancja na usługi. ☎️ +48 792 392 870" />
  <meta name="keywords" content="serwis agd dębica, naprawa pralki dębica, naprawa lodówki, serwis zmywarek, naprawa piekarnika" />
  
  {/* Open Graph dla social media */}
  <meta property="og:title" content="TECHNIK - Serwis AGD Dębica" />
  <meta property="og:description" content="Profesjonalne naprawy sprzętu AGD. Szybko, tanio, z gwarancją." />
  <meta property="og:image" content="/og-image.jpg" />
  
  {/* Telefon w formacie kliknym */}
  <link rel="canonical" href="https://techserwis.pl" />
</Head>
```

---

## 📊 PRIORYTET ZMIAN:

### 🔴 WYSOKI (zrób najpierw):
1. ✅ Zmień numer telefonu (3 miejsca)
2. ✅ Dodaj responsywność do przycisków CTA
3. ✅ Poprawa szybkiego kontaktu (flex-wrap)

### 🟡 ŚREDNI (jeśli masz czas):
4. ⏳ Animacje scroll
5. ⏳ Trust badges
6. ⏳ Meta tagi SEO

### 🟢 NISKI (opcjonalnie):
7. ⏳ Social proof (loga partnerów)
8. ⏳ FAQ sekcja
9. ⏳ Więcej ikon i grafik

---

## 🛠️ JAK ZASTOSOWAĆ ZMIANY:

### Metoda 1: Ręczna edycja
1. Otwórz `pages/index.js`
2. Użyj Ctrl+F do znalezienia `+48 123 456 789`
3. Zamień na `+48 792 392 870`
4. Zapisz plik

### Metoda 2: Bulk replace (szybsze)
```bash
# W PowerShell:
(Get-Content pages/index.js) -replace '\+48 123 456 789', '+48 792 392 870' | Set-Content pages/index.js
```

---

**Autor:** Analiza UX/UI  
**Do wdrożenia:** 5-30 minut (zależnie od zakresu)
