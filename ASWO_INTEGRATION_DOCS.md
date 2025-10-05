# 🛒 ASWO Sklep - Integracja z Panelem Administracyjnym

## 📋 Przegląd

Dodano przycisk **"Zamów ASWO"** w panelu zarządzania częściami (`/admin/magazyn/czesci`), który **otwiera sklep ASWO w nowej karcie przeglądarki**.

---

## 🎯 Funkcjonalność

### **Przycisk "Zamów ASWO"**
Lokalizacja: `/admin/magazyn/czesci` - górny pasek akcji, obok przycisku "Skanuj OCR"

**Funkcje:**
- ✅ Szybki dostęp do sklepu ASWO
- ✅ Otwiera sklep **w nowej karcie** (`target="_blank"`)
- ✅ Ikona "external link" 🔗 pokazuje, że otwiera w nowej karcie
- ✅ Badge "24h" oznaczający szybką dostawę
- ✅ Bezpieczne: `rel="noopener noreferrer"`
- ✅ Responsywny design (mobile/tablet/desktop)

**Wygląd:**
```
🛒 Zamów ASWO [24h] 🔗
```

**Techniczne:**
```jsx
<a
  href="http://sklep.aswo.com/"
  target="_blank"
  rel="noopener noreferrer"
  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600..."
>
  <svg>...</svg> {/* Shopping bag icon */}
  <span>Zamów ASWO</span>
  <span className="badge">24h</span>
  <svg>...</svg> {/* External link icon */}
</a>
```

---

## 🔧 Jak używać?

### **Krok 1: Kliknij przycisk**
```
/admin/magazyn/czesci → Kliknij "Zamów ASWO" (zielony przycisk)
```

### **Krok 2: Sklep otwiera się w nowej karcie**
```
Sklep ASWO otworzy się automatycznie w nowej karcie przeglądarki
```

### **Krok 3: Zaloguj się i zamów części**
```
W sklepie:
1. Zaloguj się swoim numerem klienta ASWO (np. 123456-002)
2. Wpisz hasło
3. Szukaj części po nazwie lub numerze katalogowym
4. Dodaj do koszyka i złóż zamówienie
5. Dostawa 24h!
```

---

## 📞 Informacje Kontaktowe ASWO

**ASWO PL Pobrotyń S.J.**
- 📍 ul. Inwestorska 26, 75-845 Koszalin
- 📞 Telefon: **+48 94 347 3160**
- 📱 Kom: **+48 606 145 145**
- 📧 Email: **aswo@aswo.pl**
- 🌐 Sklep: **http://sklep.aswo.com/**

**Godziny pracy:**
- Poniedziałek - Piątek: 8:00 - 16:00
- Sobota - Niedziela: Zamknięte

---

## 🎯 Status API

❌ **ASWO NIE MA publicznego API**

Sprawdzone źródła (04.10.2025):
- ✅ aswo.pl - Strona główna (brak informacji o API)
- ✅ sklep.aswo.com - Sklep internetowy (wymaga konta, brak API)
- ✅ aswo.com/solutions - Strona korporacyjna (brak dokumentacji technicznej)
- ✅ Sprawdzenie nagłówków HTTP - BRAK `X-Frame-Options` (teoretycznie można użyć iframe)

**Dlaczego wybraliśmy bezpośredni link zamiast iframe?**
1. 🚀 **Szybkość** - brak opóźnień ładowania iframe
2. ✅ **Niezawodność** - niektóre funkcje sklepu mogą nie działać w iframe
3. 🔒 **Bezpieczeństwo** - logowanie w iframe może być zablokowane przez ASWO
4. 📱 **Kompatybilność** - lepsza obsługa na mobile
5. 🎯 **Prostota** - mniej kodu, łatwiejsze utrzymanie

---

## 💡 Możliwe Rozszerzenia (Przyszłość)

### **1. Kontakt z ASWO o API**
Jeśli w przyszłości ASWO udostępni API, można zintegrować:
- Automatyczne sprawdzanie dostępności części
- Import cen do systemu
- Składanie zamówień bezpośrednio z aplikacji
- Śledzenie statusu zamówień
- Historia zakupów

**Kontakt:**
- 📧 Email: aswo@aswo.pl
- 📞 Telefon: +48 94 347 3160
- Subject: "Zapytanie o integrację B2B/API dla serwisu AGD"

### **2. Dodanie przycisku ASWO w innych miejscach**
Możliwe lokalizacje:
- `/admin/magazyn/zamowienia` - strona zamówień do dostawców
- `/admin/magazyn/index` - główna strona magazynu
- `/admin/zamowienia/[id]` - szczegóły zamówienia (gdy brakuje części)

### **3. Zapisywanie częstych wyszukiwań**
- localStorage z historią ostatnio szukanych części
- Szybki dostęp do często zamawianych pozycji

---

## 🛠️ Implementacja Techniczna

### **Plik:** `pages/admin/magazyn/czesci.js`

**Dodany kod:**

```jsx
{/* ASWO Order Button - Direct Link */}
<a
  href="http://sklep.aswo.com/"
  target="_blank"
  rel="noopener noreferrer"
  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transition-all flex-shrink-0"
  title="Zamów części w sklepie ASWO (Koszalin) - otwiera w nowej karcie"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
  <span className="hidden sm:inline">Zamów ASWO</span>
  <span className="inline sm:hidden">ASWO</span>
  <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs font-bold">24h</span>
  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
</a>
```

**Zmiany:**
- ✅ Zamieniono `<button>` na `<a>` z `href`
- ✅ Dodano `target="_blank"` dla otwarcia w nowej karcie
- ✅ Dodano `rel="noopener noreferrer"` dla bezpieczeństwa
- ✅ Dodano ikonę "external link" pokazującą że otwiera w nowej karcie
- ✅ Usunięto state `showAswoModal`, `aswoCredentials`
- ✅ Usunięto cały modal z iframe
- ✅ Usunięto useEffect ładujący dane z localStorage

**Korzyści:**
- 📉 Mniej kodu (usunięto ~150 linii)
- ⚡ Szybsze ładowanie (brak iframe)
- 🎯 Prostsze w utrzymaniu
- ✅ Lepsza UX (natywne zachowanie przeglądarki)

---

## ✅ Status

**Data wdrożenia:** 04.10.2025  
**Status:** ✅ **GOTOWE**  
**Wersja:** Direct Link (bez iframe)  
**Testowane:** ✅ Link działa, sklep otwiera się poprawnie  
**Kompilacja:** ✅ Brak błędów  

---

## 📝 Historia Zmian

### **v2.0 - 04.10.2025 (AKTUALNA)**
- 🔄 Zmiana z iframe na bezpośredni link
- ✅ Usunięto modal z iframe (uproszczenie)
- ✅ Dodano ikonę "external link"
- ✅ Poprawiono title przycisku
- ✅ Zachowano responsywny design

### **v1.0 - 04.10.2025 (ZASTĄPIONA)**
- ✅ Implementacja iframe w modalu
- ✅ Loading screen
- ✅ Przycisk "otwórz w nowej karcie"
- ✅ Info bar z kontaktem
- ❌ Zbyt skomplikowane dla prostego przypadku użycia

---

## 🤝 Feedback

Jeśli napotkasz problemy lub masz sugestie dotyczące integracji ASWO:
- Zgłoś problem w aplikacji
- Skontaktuj się z zespołem technicznym
- Zaproponuj ulepszenia
