# 🌐 SYSTEM ZARZĄDZANIA TREŚCIĄ STRONY GŁÓWNEJ

**Data utworzenia:** 04.10.2025  
**Status:** ✅ Zaimplementowane i działające  
**Autor:** System CMS dla strony internetowej

---

## 📋 SPIS TREŚCI

1. [Przegląd](#przegląd)
2. [Struktura plików](#struktura-plików)
3. [Funkcjonalności](#funkcjonalności)
4. [Instrukcja użycia](#instrukcja-użycia)
5. [API Endpoints](#api-endpoints)
6. [Bezpieczeństwo](#bezpieczeństwo)

---

## 🎯 PRZEGLĄD

System pozwala administratorowi na **dynamiczne zarządzanie treścią strony głównej** bez potrzeby edycji kodu.

### **Główne zalety:**
- ✅ **Brak hardkodowanych wartości** - wszystko w bazie danych (JSON)
- ✅ **Panel admina** - intuicyjny interfejs do edycji
- ✅ **SEO-friendly** - zarządzanie meta tagami
- ✅ **Automatyczna synchronizacja** - zmiany widoczne natychmiast
- ✅ **Bezpieczne** - tylko admin może edytować

---

## 📁 STRUKTURA PLIKÓW

### **1. Plik konfiguracji**
```
📄 data/site-settings.json
```

**Zawiera:**
- Dane kontaktowe (telefon, email, adres)
- Godziny otwarcia (Pn-Nd)
- Social media (Facebook, Instagram, LinkedIn)
- Meta tagi SEO (title, description, keywords)
- Statystyki (lata doświadczenia, ilość napraw)
- Dane firmy (nazwa, slogan)

### **2. API Endpoint**
```
📄 pages/api/site-settings.js
```

**Metody:**
- `GET` - Odczyt ustawień (publiczny)
- `PUT` - Zapis ustawień (tylko admin)

### **3. Panel administracyjny**
```
📄 pages/admin/ustawienia-strony.js
```

Pełen interfejs do edycji wszystkich ustawień.

### **4. Strona główna (zmodyfikowana)**
```
📄 pages/index.js
```

Pobiera ustawienia przez `getServerSideProps` i wyświetla dynamicznie.

### **5. Menu admina (zaktualizowane)**
```
📄 components/AdminLayout.js
```

Dodano link: "🌐 Ustawienia strony"

---

## ⚙️ FUNKCJONALNOŚCI

### **1️⃣ Dane kontaktowe**

```json
{
  "contact": {
    "phone": "+48 792 392 870",
    "email": "kontakt@techserwis.pl",
    "address": "ul. Przykładowa 123, 39-200 Dębica"
  }
}
```

**Wyświetlane w:**
- Hero section (szybki kontakt)
- Sekcja "Skontaktuj się z nami"
- Stopka (footer)

---

### **2️⃣ Godziny otwarcia**

```json
{
  "businessHours": {
    "monday": "8:00 - 18:00",
    "tuesday": "8:00 - 18:00",
    "wednesday": "8:00 - 18:00",
    "thursday": "8:00 - 18:00",
    "friday": "8:00 - 18:00",
    "saturday": "9:00 - 14:00",
    "sunday": "Zamknięte"
  }
}
```

**Zastosowanie:**
- Wyświetlanie w hero section (Pn-Pt: 8:00-18:00)
- Potencjalnie w sekcji kontakt

---

### **3️⃣ Social Media**

```json
{
  "socialMedia": {
    "facebook": "https://facebook.com/twoja-strona",
    "instagram": "https://instagram.com/twoj-profil",
    "linkedin": "https://linkedin.com/company/firma"
  }
}
```

**Zastosowanie:**
- Linki w stopce (jeśli dodane)
- Przyszłe integracje

---

### **4️⃣ SEO Meta Tagi**

```json
{
  "seo": {
    "title": "TECHNIK - Profesjonalny Serwis AGD Dębica",
    "description": "Profesjonalny serwis AGD w Dębicy. Naprawiamy pralki, lodówki, zmywarki, piekarniki. 30 lat doświadczenia. Gwarancja na usługi.",
    "keywords": "serwis agd dębica, naprawa pralki dębica, naprawa lodówki, serwis zmywarek, naprawa piekarnika"
  }
}
```

**Zastosowanie:**
- `<title>` tag w HTML
- `<meta name="description">`
- `<meta name="keywords">`

**Limity rekomendowane:**
- **Title:** 50-60 znaków
- **Description:** 150-160 znaków
- **Keywords:** max 10-15 słów

---

### **5️⃣ Statystyki**

```json
{
  "stats": {
    "yearsExperience": "15+",
    "repairsCompleted": "2500+",
    "happyClients": "849+",
    "rating": "4.9"
  }
}
```

**Wyświetlane w:**
- Hero section (animowane liczniki)
- Sekcja z wartościami firmy

---

### **6️⃣ Dane firmy**

```json
{
  "companyName": "TECHNIK Serwis AGD",
  "slogan": "Profesjonalne naprawy sprzętu AGD"
}
```

**Wyświetlane w:**
- Stopka
- Hero section (nazwa firmy)

---

## 📖 INSTRUKCJA UŻYCIA

### **Krok 1: Zaloguj się jako admin**

```
1. Przejdź do: https://twoja-strona.pl/auth/signin
2. Zaloguj się kontem administratora
```

---

### **Krok 2: Wejdź w panel ustawień**

```
1. W panelu admina znajdź: "🌐 Ustawienia strony"
2. Kliknij na link
```

---

### **Krok 3: Edytuj dane**

#### **Sekcja: Dane kontaktowe**
- **Telefon:** Format `+48 XXX XXX XXX`
- **Email:** Poprawny format email
- **Adres:** Pełny adres z kodem pocztowym

#### **Sekcja: Godziny otwarcia**
- Każdy dzień osobno
- Format: `8:00 - 18:00` lub `Zamknięte`

#### **Sekcja: Social Media**
- **Facebook:** `https://facebook.com/nazwa-strony`
- **Instagram:** `https://instagram.com/nazwa-profilu`
- **LinkedIn:** `https://linkedin.com/company/nazwa-firmy`
- *Jeśli nie masz, zostaw puste*

#### **Sekcja: SEO**
- **Title:** Krótki, opisowy tytuł (50-60 znaków)
- **Description:** Opis strony (150-160 znaków)
- **Keywords:** Słowa kluczowe rozdzielone przecinkami

#### **Sekcja: Statystyki**
- Możesz używać znaków `+` dla lepszego efektu
- Przykład: `15+`, `2500+`, `4.9★`

#### **Sekcja: Dane firmy**
- **Nazwa firmy:** Pełna nazwa
- **Slogan:** Krótki opis działalności

---

### **Krok 4: Zapisz zmiany**

```
1. Kliknij przycisk: "✅ Zapisz wszystkie zmiany" (na górze lub na dole)
2. Poczekaj na komunikat: "✅ Ustawienia zapisane pomyślnie"
```

---

### **Krok 5: Sprawdź efekt**

```
1. Przejdź do: https://twoja-strona.pl
2. Odśwież stronę (F5)
3. Sprawdź, czy dane się zmieniły
```

---

## 🔌 API ENDPOINTS

### **GET /api/site-settings**

**Dostęp:** Publiczny (każdy może odczytać)

**Request:**
```bash
curl https://twoja-strona.pl/api/site-settings
```

**Response:**
```json
{
  "success": true,
  "settings": {
    "contact": { ... },
    "businessHours": { ... },
    "socialMedia": { ... },
    "seo": { ... },
    "stats": { ... },
    "companyName": "...",
    "slogan": "...",
    "lastUpdated": "2025-01-04T10:00:00.000Z"
  }
}
```

---

### **PUT /api/site-settings**

**Dostęp:** Tylko admin (wymaga sesji)

**Request:**
```bash
curl -X PUT https://twoja-strona.pl/api/site-settings \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "contact": {
      "phone": "+48 792 392 870",
      "email": "nowy@email.pl",
      "address": "Nowy adres"
    },
    ...
  }'
```

**Response (success):**
```json
{
  "success": true,
  "message": "Ustawienia zapisane pomyślnie",
  "settings": { ... }
}
```

**Response (brak uprawnień):**
```json
{
  "success": false,
  "message": "Tylko administrator może zmieniać ustawienia strony"
}
```

---

## 🔒 BEZPIECZEŃSTWO

### **1. Autoryzacja**

```javascript
const session = await getSession({ req });

if (req.method === 'PUT' && (!session || session.user.role !== 'admin')) {
  return res.status(403).json({ 
    success: false, 
    message: 'Tylko administrator może zmieniać ustawienia strony' 
  });
}
```

**Zabezpieczenia:**
- ✅ Tylko zalogowani użytkownicy
- ✅ Tylko rola `admin`
- ✅ Odczyt publiczny (GET), zapis tylko admin (PUT)

---

### **2. Walidacja danych**

**Zalecane dodatkowe walidacje (opcjonalnie):**

```javascript
// Przykład walidacji telefonu
if (!/^\+48\s?\d{3}\s?\d{3}\s?\d{3}$/.test(phone)) {
  return res.status(400).json({ error: 'Nieprawidłowy format telefonu' });
}

// Przykład walidacji email
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  return res.status(400).json({ error: 'Nieprawidłowy format email' });
}
```

---

### **3. Backup automatyczny**

System zapisuje `lastUpdated` timestamp przy każdej zmianie:

```json
{
  "lastUpdated": "2025-01-04T10:00:00.000Z"
}
```

**Zalecenia:**
- Regularnie rób backup `data/site-settings.json`
- Używaj systemu kontroli wersji (Git)

---

## 🎨 INTEGRACJA Z HOMEPAGE

### **Przed (hardkodowane):**

```jsx
<a href="tel:+48123456789">
  <span>+48 123 456 789</span>
</a>
```

### **Po (dynamiczne):**

```jsx
<a href={`tel:${settings.contact.phone.replace(/\s/g, '')}`}>
  <span>{settings.contact.phone}</span>
</a>
```

---

## 📊 UŻYCIE W KODZIE

### **Pobieranie ustawień w komponencie:**

```javascript
export default function MyPage({ siteSettings }) {
  return (
    <div>
      <h1>{siteSettings.companyName}</h1>
      <p>{siteSettings.slogan}</p>
      <a href={`tel:${siteSettings.contact.phone.replace(/\s/g, '')}`}>
        {siteSettings.contact.phone}
      </a>
    </div>
  );
}

export async function getServerSideProps() {
  const fs = require('fs/promises');
  const path = require('path');
  const settingsPath = path.join(process.cwd(), 'data', 'site-settings.json');
  
  try {
    const data = await fs.readFile(settingsPath, 'utf-8');
    const siteSettings = JSON.parse(data);
    
    return {
      props: { siteSettings }
    };
  } catch (error) {
    return {
      props: { siteSettings: defaultSettings }
    };
  }
}
```

---

## 🧪 TESTOWANIE

### **Test 1: Zmiana numeru telefonu**

```
1. Zaloguj się jako admin
2. Zmień telefon na: +48 111 222 333
3. Zapisz
4. Odśwież homepage
5. Sprawdź 3 miejsca: Hero, Kontakt, Stopka
```

### **Test 2: Zmiana SEO**

```
1. Zmień title na: "TEST - Moja Firma"
2. Zapisz
3. Odśwież homepage
4. Sprawdź w kodzie źródłowym: <title>TEST - Moja Firma</title>
```

### **Test 3: Bezpieczeństwo**

```
1. Wyloguj się
2. Spróbuj otworzyć: /admin/ustawienia-strony
3. Powinno przekierować do logowania
```

---

## 📝 LISTA KONTROLNA

Przed wdrożeniem sprawdź:

- [ ] Plik `data/site-settings.json` istnieje i ma poprawny JSON
- [ ] API `/api/site-settings` zwraca status 200
- [ ] Panel `/admin/ustawienia-strony` otwiera się dla admina
- [ ] Tylko admin ma dostęp do edycji
- [ ] Zmiany są widoczne na homepage po odświeżeniu
- [ ] Telefon jest klikalny (href="tel:...")
- [ ] Email jest klikalny (href="mailto:...")
- [ ] Meta tagi SEO są poprawnie wstawione w <head>

---

## 🚀 PRZYSZŁE ROZSZERZENIA

### **1. Upload logo firmy**
```json
{
  "branding": {
    "logo": "/uploads/logo.png",
    "favicon": "/uploads/favicon.ico"
  }
}
```

### **2. Kolory motywu**
```json
{
  "theme": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#10B981"
  }
}
```

### **3. Google Analytics**
```json
{
  "analytics": {
    "googleAnalyticsId": "G-XXXXXXXXXX",
    "facebookPixel": "123456789"
  }
}
```

### **4. Historia zmian**
- Tracking wszystkich edycji
- Możliwość przywrócenia poprzedniej wersji

---

## ❓ FAQ

### **Q: Czy mogę dodać więcej pól?**
A: Tak! Edytuj `data/site-settings.json`, dodaj pole w API i interfejsie admina.

### **Q: Co jeśli usunę `site-settings.json`?**
A: Strona użyje domyślnych wartości z fallbacku w `getServerSideProps`.

### **Q: Czy zmiany są widoczne natychmiast?**
A: Tak! Next.js pobiera ustawienia przy każdym załadowaniu strony (`getServerSideProps`).

### **Q: Czy mogę dodać więcej języków?**
A: Można rozszerzyć o wielojęzyczność dodając:
```json
{
  "translations": {
    "pl": { ... },
    "en": { ... }
  }
}
```

---

## 🎉 PODSUMOWANIE

✅ **Zaimplementowano:**
- Dynamiczne zarządzanie treścią
- Panel admina z pełnym interfejsem
- API endpoints z zabezpieczeniami
- Integrację z homepage
- SEO meta tagi

✅ **Korzyści:**
- Brak potrzeby edycji kodu przy zmianach
- Łatwa aktualizacja danych kontaktowych
- Lepsza kontrola nad SEO
- Szybsze wdrożenie zmian

✅ **Gotowe do użycia!**

---

**Autor:** System CMS  
**Wersja:** 1.0  
**Data ostatniej aktualizacji:** 04.10.2025
