# 🔧 Nowa Wersja Homepage - Dedykowana dla Serwisu AGD

## 🎯 Problem z poprzednią wersją

Poprzednia strona główna była **zbyt futurystyczna i "elektroniczna"**:
- ❌ Gradienty, efekty świetlne, 51 kolorów tytułu
- ❌ Bardziej pasowała do firmy IT/software niż serwisu AGD
- ❌ Za dużo wizualnych "fajerwerków"
- ❌ Nie budowała zaufania typowego dla firm serwisowych

## ✅ Co zostało zmienione?

### 1️⃣ **Prostszy, bardziej przyziemny design**
- 🟦 Jeden główny kolor: niebieski (zaufanie, profesjonalizm)
- 📱 Czytelne ikony i duże przyciski CTA
- 🎨 Bez efektów gradient, bez przesadnych animacji
- 📐 Więcej białej przestrzeni, mniej przytłaczające

### 2️⃣ **Skupienie na serwisie AGD**
- 🔧 Tytuł: "Profesjonalny Serwis Sprzętu AGD"
- 📊 Statystyki: lata doświadczenia, naprawy, oceny
- 🏠 Ikony urządzeń: pralki, lodówki, zmywarki, piekarniki
- 💬 Język bardziej "ludzki", mniej techniczny

### 3️⃣ **Prostsze nawigacje i CTA**
- 📱 **"Zamów Naprawę"** - główny przycisk
- 🔍 **"Sprawdź Status"** - drugie najważniejsze
- 💰 **"Cennik"** - zawsze widoczny
- ☎️ Numer telefonu i godziny otwarcia od razu na górze

### 4️⃣ **4 kroki procesu**
Prosta wizualizacja jak działamy:
1. Zgłoszenie (telefon/formularz)
2. Diagnoza (serwisant)
3. Naprawa (oryginalne części)
4. Gwarancja (12 miesięcy)

### 5️⃣ **Sekcja "Dlaczego my?"**
6 kart z korzyściami:
- ✅ Gwarancja do 12 miesięcy
- ⏱️ Szybkie naprawy (tego samego dnia)
- 🏆 15+ lat doświadczenia
- 👥 Profesjonalni serwisanci
- 🔧 Oryginalne części
- ⭐ 4.9/5 oceny

### 6️⃣ **Prosty cennik**
3 kategorie:
- Diagnoza: **GRATIS**
- Naprawa podstawowa: **od 150 zł**
- Naprawa zaawansowana: **od 300 zł**

## 📂 Pliki

**Nowa wersja:** `/pages/index-serwis-agd.js`
**Oryginalna:** `/pages/index.js` (zachowana)

## 🚀 Jak używać?

### Opcja 1: Link w przełączniku
1. Otwórz http://localhost:3000/
2. W lewym dolnym rogu kliknij **"🔧 SERWIS AGD (NOWA!)"**
3. Zobacz nową wersję

### Opcja 2: Bezpośredni link
Otwórz: http://localhost:3000/index-serwis-agd

### Opcja 3: Ustaw jako domyślną (recommended)
Jeśli chcesz aby to była główna strona:

**Metoda A - Przekierowanie:**
Edytuj `pages/index.js` i dodaj na początku:
```javascript
export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/index-serwis-agd',
      permanent: false
    }
  };
}
```

**Metoda B - Zmiana nazwy pliku:**
```bash
# Backup oryginalnej
mv pages/index.js pages/index-original.js

# Ustaw nową jako główną
mv pages/index-serwis-agd.js pages/index.js
```

## 🎨 Paleta kolorów

### Wersja Light (jasna):
- Tło główne: **białe** (#FFFFFF)
- Tło sekundarne: **szare 50** (#F9FAFB)
- Akcent: **niebieski 600** (#2563EB)
- Tekst: **szary 900** (#111827)

### Wersja Dark (ciemna):
- Tło główne: **szary 900** (#111827)
- Tło sekundarne: **szary 800** (#1F2937)
- Akcent: **niebieski 500** (#3B82F6)
- Tekst: **biały** (#FFFFFF)

## 📊 Porównanie

| Aspekt | Oryginalna | Nowa (Serwis AGD) |
|--------|-----------|-------------------|
| **Kolory** | 51 kolorów + gradienty | 1 główny (niebieski) |
| **Efekty** | Blur, świecenie, animacje | Minimalne, subtelne |
| **Fokus** | Elektronika + Serwis | **Tylko Serwis AGD** |
| **Ton** | Futurystyczny, tech | Przyziemny, zaufanie |
| **CTA** | 2 działy równoważne | **Zamów Naprawę** główne |
| **Statystyki** | Projekty, lata | **Naprawy, oceny** |
| **Sekcje** | Elektronika + Serwis | **Tylko AGD** |

## 🔮 Przyszłość

Gdy będziecie rozwijać **dział elektronika** (sterowniki):
- Stwórzcie `/index-elektronika.js` dla tego działu
- Główna strona `/` może być "hub" z wyborem działu
- Lub 2 osobne domeny: `serwis.technik.pl` i `elektronika.technik.pl`

## ✅ Zalecenia

**Dla serwisu AGD polecam NOWĄ wersję**, ponieważ:
1. ✅ Buduje zaufanie (prostota, czytelność)
2. ✅ Jasno komunikuje usługi (naprawy AGD)
3. ✅ Łatwa nawigacja (3 główne CTA)
4. ✅ Profesjonalna bez przesady
5. ✅ Mobilnie responsywna
6. ✅ Szybkie ładowanie (mniej efektów)

**Oryginalną zostaw na przyszłość** gdy będziecie rozwijać dział elektroniki/sterowników - tam futurystyczny styl będzie bardziej pasował!

---

**Status:** ✅ Gotowa do użycia
**URL:** http://localhost:3000/index-serwis-agd
**Rekomendacja:** Ustaw jako główną stronę dla serwisu AGD
