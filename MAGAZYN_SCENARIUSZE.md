# 📖 SYSTEM MAGAZYNU - SCENARIUSZE UŻYCIA
## Praktyczne przykłady dla serwisu AGD

---

## 👨‍🔧 SCENARIUSZ 1: Serwisant Adam naprawia pralkę

### SYTUACJA WYJŚCIOWA:
- **Klient:** Pani Kowalska
- **Urządzenie:** Pralka Samsung WW90T4540AE
- **Problem:** Głośny hałas podczas wirowania, wibracje
- **Zlecenie:** #ORD1024

### KROK PO KROKU:

#### 1. Adam otwiera zlecenie w aplikacji mobilnej
```
🔧 Zlecenie #ORD1024
Pralka Samsung WW90T4540AE
Problem: Hałas podczas wirowania

[📦 Sprawdź części] <--- klika tutaj
```

#### 2. System automatycznie sugeruje części
```
💡 SUGEROWANE CZĘŚCI (na podstawie objawów):

⭐⭐⭐ Łożysko bębna Samsung (DC97-16151A)
• Dopasowanie: 95%
• Cena: 85 zł
• ✅ Dostępne: 10 szt w magazynie
• Lokalizacja: A-12-03
• ⚠️ Trudny montaż (~120 min)
[ℹ️ Objawy] [📦 Zarezerwuj]

⭐⭐ Amortyzator pralki (DC66-00343A)
• Dopasowanie: 75%
• Cena: 45 zł
• ✅ Dostępne: 6 szt
[📦 Zarezerwuj]
```

#### 3. Adam rezerwuje części
```
Kliknął [Zarezerwuj] na łożysko

✅ Zarezerwowano!
• Łożysko bębna Samsung × 2 szt
• Wartość: 170 zł
• Odbiór: Magazyn A-12-03
• Kod odbioru: **RES-1024-A**
• Wygasa: 2025-10-05 10:00

[🗺️ Pokaż na mapie magazynu]
[📋 Moje rezerwacje]
```

#### 4. Adam odbiera części z magazynu
```
W magazynie:
1. Skanuje kod QR: RES-1024-A
2. System pokazuje: "Półka A-12-03, Rząd 3"
3. Pobiera 2 łożyska
4. Skanuje kody EAN części (weryfikacja)
5. ✅ Potwierdza odbiór w aplikacji
```

#### 5. Po zakończeniu naprawy
```
✅ ZAKOŃCZENIE ZLECENIA #ORD1024

🔧 UŻYTE CZĘŚCI:
☑️ Łożysko bębna Samsung × 2 szt = 170 zł
   Status: Wymienione ✅
   
☑️ Uszczelka drzwi × 1 szt = 45 zł
   (dodana ręcznie podczas naprawy)
   
❌ ZWROT (niezużyte):
   Amortyzator × 1 szt
   Powód: Nie wymagał wymiany

RAZEM: 215 zł (części)
Robocizna: 180 zł
─────────────────
CAŁOŚĆ: 395 zł

[💾 Zapisz i wygeneruj fakturę]
```

#### 6. System automatycznie:
- ✅ Odejmuje użyte części ze stanu magazynu
- ✅ Zwraca niezużyte części (amortyzator)
- ✅ Dodaje części do faktury
- ✅ Aktualizuje historię: "Adam użył PART001 w zleceniu #ORD1024"
- ✅ Sprawdza stan - jeśli łożysko < 3 szt → alert do admina

---

## 👔 SCENARIUSZ 2: Admin Anna dostaje alert o niskim stanie

### SYTUACJA:
Codziennie o 8:00 rano system sprawdza stany magazynowe

### EMAIL OTRZYMANY:
```
Od: System Magazynu <magazyn@techserwis.pl>
Do: anna.admin@techserwis.pl
Temat: 🚨 ALERT: 5 części z niskim stanem magazynowym

Dzień dobry Anna,

System wykrył następujące części z niskim stanem:

🔴 KRYTYCZNE (poniżej minimum):
1. Uszczelka drzwi (DC63-00563A): 1 szt (min: 5)
   Ostatnie użycie: wczoraj przez Adam Nowak
   Sugerowane zamówienie: 10 szt

2. Pompa odpływowa (DC96-01414G): 2 szt (min: 5)
   Trend: -3 szt w tym tygodniu
   Sugerowane zamówienie: 8 szt

⚠️ NISKIE (blisko minimum):
3. Łożysko Samsung (DC97-16151A): 3 szt (min: 3)
4. Pasek HTD (6PH1871): 5 szt (min: 5)

💰 Szacowany koszt zamówienia: ~650 zł
📦 Rekomendowany dostawca: Samsung Parts Europe (dostawa 24h)

[🛒 Utwórz zamówienie] [📊 Zobacz raport]
```

### Anna klika [Utwórz zamówienie]:

#### KROK 1: System przygotował draft zamówienia
```
📦 SUGEROWANE ZAMÓWIENIE

Dostawca: Samsung Parts Europe
Min. wartość: 200 zł ✅ | Darmowa dostawa: 500 zł ✅

┌────────────────────────────────────────────────────┐
│ Część                  │ Stan │ Zamów │ Cena │ Suma│
├────────────────────────────────────────────────────┤
│ Uszczelka drzwi       │ 1/15 │  [10] │  45  │ 450│
│ 🔴 Krytyczny stan!                                 │
├────────────────────────────────────────────────────┤
│ Pompa odpływowa       │ 2/15 │  [8]  │  90  │ 720│
│ ⚠️ Trend spadkowy                                  │
├────────────────────────────────────────────────────┤
│ Łożysko Samsung       │ 3/20 │  [5]  │  65  │ 325│
│ ℹ️ Popularna część - zapas                        │
└────────────────────────────────────────────────────┘

[+ Dodaj część] [🤖 Optymalizuj zamówienie]

PODSUMOWANIE:
Wartość: 1,495 zł
Dostawa: GRATIS (>500 zł) ✅
VAT 23%: 343,85 zł
─────────────────
RAZEM: 1,838,85 zł

Oczekiwana dostawa: 2025-10-04 (24h)

💡 TIP: Dodaj jeszcze części za 5 zł aby wykorzystać rabat 
    za zamówienie >2000 zł (-5%)

[Anuluj] [Zapisz draft] [📧 Wyślij do dostawcy]
```

#### KROK 2: Anna klika [Wyślij do dostawcy]
```
✅ ZAMÓWIENIE WYSŁANE!

Nr zamówienia: ZC/2025/10/003
Status: Oczekuje na potwierdzenie
Dostawca: Samsung Parts Europe

Email wysłany do: parts@samsung.pl
CC: jan.kowalski@samsung.pl

Spodziewana dostawa: 2025-10-04 10:00

[📧 Zobacz email] [📋 Moje zamówienia]
```

#### KROK 3: Następnego dnia - dostawa
```
📦 PRZYJĘCIE DOSTAWY - ZC/2025/10/003

Dostawca: Samsung Parts Europe
Kurier: DPD - tracking: 123456789PL

┌────────────────────────────────────────────────────┐
│ Część             │ Zamówione │ Dostarczone │ Status│
├────────────────────────────────────────────────────┤
│ Uszczelka drzwi   │    10     │    [10]     │  ✅  │
│ Pompa odpływowa   │     8     │    [8]      │  ✅  │
│ Łożysko Samsung   │     5     │    [5]      │  ✅  │
└────────────────────────────────────────────────────┘

Wszystkie pozycje: ✅ Komplet

Dokument dostawy:
• Faktura: FV/2025/10/45678 [📄 Zeskanuj]
• WZ: WZ/2025/10/12345

[Potwierdź przyjęcie] [❌ Zgłoś różnicę]
```

#### Anna klika [Potwierdź przyjęcie]:
```
✅ DOSTAWA PRZYJĘTA!

Stan magazynowy zaktualizowany:
• Uszczelka drzwi: 1 → 11 szt ✅
• Pompa odpływowa: 2 → 10 szt ✅
• Łożysko Samsung: 3 → 8 szt ✅

Wartość magazynu: +1,495 zł
Nowy stan: 47,280 zł

Historia ruchu magazynowego zapisana ✅
Faktura przypisana do zamówienia ✅

[📊 Zobacz raport] [🔙 Powrót]
```

---

## 📱 SCENARIUSZ 3: Mobile - Serwisant w terenie

### SYTUACJA:
Tomek jest u klienta, diagnozuje zmywarkę. Odkrywa że potrzebna jest pompa, której nie ma przy sobie.

#### 1. Otwiera AGD Mobile
```
🔧 Zlecenie #ORD1089
Zmywarka Bosch SMS46KI03E
Status: W trakcie diagnozy

[📦 Sprawdź części] <--- klika
```

#### 2. Wyszukuje część
```
🔍 [pompa zmywarka bosch___________] 🔎

Znaleziono 3 wyniki:

┌──────────────────────────────────────────┐
│ ⭐ Pompa myjąca zmywarki Bosch          │
│ DW-PUMP-001 | 180 zł                    │
│ ✅ Dostępne: 4 szt | Magazyn A-15-02    │
│ Kompatybilne: SMS46*, SMS68*            │
│ [ℹ️] [📦 Zarezerwuj]                    │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ Pompa odpływowa uniwersalna              │
│ DW-DRAIN-UNI | 120 zł                   │
│ ⚠️ Niski stan: 2 szt                    │
│ [📦 Zarezerwuj] [🔔 Zgłoś potrzebę]    │
└──────────────────────────────────────────┘
```

#### 3. Tomek rezerwuje część
```
Kliknął [Zarezerwuj] na pompę myjącą

✅ Zarezerwowano!
Pompa myjąca × 1 szt

⏰ Kiedy potrzebujesz?
○ Dziś (odbiór w magazynie)
● Jutro (dostarczenie na adres) <--- wybrał
○ Za 2 dni

📍 Adres dostawy:
[x] Adres klienta (ul. Słoneczna 12, Kraków)
[ ] Mój adres domowy
[ ] Magazyn centralny

Preferowana godzina: [10:00 - 12:00]

[Anuluj] [✅ Potwierdź rezerwację]
```

#### 4. Komunikat dla klienta
```
Tomek (w terenie, do klienta):

"Proszę Pana, zdiagnozowałem problem - to pompa myjąca. 
Zamówiłem już część, przyjadę jutro między 10-12 i wymienię. 
Część kosztuje 180 zł, robocizna 150 zł. Jutro kończymy sprawę!"

Klient: "Super, dziękuję!"
```

#### 5. Następnego dnia - powiadomienie push
```
📦 DOSTAWA CZĘŚCI

Twoja część została dostarczona!
• Pompa myjąca (DW-PUMP-001) × 1 szt
• Adres: ul. Słoneczna 12, Kraków
• Odbiorca: Pan Kowalski ✅

Możesz kontynuować zlecenie #ORD1089

[🗺️ Nawiguj do klienta] [📋 Otwórz zlecenie]
```

---

## 🤖 SCENARIUSZ 4: AI Sugestie - Smart ordering

### SYTUACJA:
System analizuje dane historyczne i przewiduje zapotrzebowanie

#### Algorytm działający w tle (co tydzień):
```python
# Pseudo-kod algorytmu

1. Analiza ostatnich 90 dni:
   - Łożysko Samsung: użyto 45 razy (0.5/dzień)
   - Trend: +15% (sezon zimowy - więcej prania)
   - Czas dostawy: 24h
   - Aktualny stan: 8 szt

2. Przewidywanie:
   - Za 7 dni: ~4 użycia = zostanie 4 szt
   - Za 14 dni: ~8 użyć = BRAK! (poniżej minimum)
   
3. Rekomendacja:
   - Zamów teraz: 10 szt
   - Zapas na: ~20 dni
   - Koszt: 650 zł
   - Priorytet: ŚREDNI

4. Optymalizacja zamówienia:
   - Sprawdź inne części od tego samego dostawcy
   - Dołącz: Uszczelki (4 szt), Pasy (5 szt)
   - Całość: 1,200 zł → przekroczone 500 zł = DARMOWA DOSTAWA ✅
```

#### Email do admina w poniedziałek:
```
Od: System Magazynu AI <ai@techserwis.pl>
Do: anna.admin@techserwis.pl
Temat: 🤖 AI Sugestia: Optymalne zamówienie na ten tydzień

Dzień dobry Anna!

Na podstawie analizy danych z ostatnich 3 miesięcy, 
rekomuduję następujące zamówienie:

📊 ANALIZA TRENDÓW:
• Wzrost zapotrzebowania: +12% (sezon zimowy)
• Najpopularniejsze części: łożyska, pompy, uszczelki
• Średni czas realizacji naprawy: -15% (dzięki dostępności części)

🛒 REKOMENDOWANE ZAMÓWIENIE:
Samsung Parts Europe (dostawa 24h, darmowa >500 zł)

┌────────────────────────────────────────────────────┐
│ Część            │ Priorytet │ Ilość │ Koszt │ AI  │
├────────────────────────────────────────────────────┤
│ Łożysko Samsung  │ 🔴 WYSOKI │  10   │  650  │ 95%│
│ Pompa odpływowa  │ 🟡 ŚREDNI │   5   │  450  │ 78%│
│ Uszczelka drzwi  │ 🟢 NISKI  │   8   │  360  │ 65%│
└────────────────────────────────────────────────────┘

Razem: 1,460 zł + VAT = 1,795,80 zł

💡 DLACZEGO TERAZ?
• Łożysko: przewiduję brak zapasu za 12 dni
• Pompa: popularność rośnie +20% w tym miesiącu
• Uszczelki: sezonowy wzrost - lepiej mieć zapas

📈 ROI:
• Koszt magazynowania: ~50 zł/mies
• Uniknięte opóźnienia: ~1,200 zł (4 zlecenia)
• Net benefit: +1,150 zł ✅

[🛒 Utwórz zamówienie] [📊 Zobacz szczegóły] [🔕 Ignoruj]
```

---

## 📊 SCENARIUSZ 5: Raportowanie i analiza

### Anna sprawdza dashboard magazynu

#### Widok główny:
```
📦 DASHBOARD MAGAZYNU - Październik 2025

┌─ STATYSTYKI OGÓLNE ─────────────────────────────┐
│ Wartość magazynu:    47,280 zł                  │
│ Części w magazynie:  245 pozycji                │
│ Średnia rotacja:     12 dni                     │
│ Marża średnia:       28.5%                      │
└──────────────────────────────────────────────────┘

┌─ ALERTY ────────────────────────────────────────┐
│ 🔴 Krytyczny stan:     2 części                 │
│ ⚠️ Niski stan:         5 części                 │
│ 📦 Oczekujące dostawy: 1 (jutro)                │
└──────────────────────────────────────────────────┘

┌─ TOP 5 NAJCZĘŚCIEJ UŻYWANE (ten miesiąc) ──────┐
│ 1. Łożysko Samsung       - 15 użyć              │
│ 2. Pompa odpływowa       - 12 użyć              │
│ 3. Uszczelka drzwi       - 10 użyć              │
│ 4. Pasek HTD             -  8 użyć              │
│ 5. Amortyzator           -  6 użyć              │
└──────────────────────────────────────────────────┘

┌─ WYKORZYSTANIE PRZEZ SERWISANTÓW ──────────────┐
│ Adam Nowak:    28 części | wartość: 2,340 zł   │
│ Tomek Wiśniewski: 22 części | wartość: 1,890 zł│
│ Marek Kowal:   18 części | wartość: 1,520 zł   │
└──────────────────────────────────────────────────┘

[📊 Pełny raport] [📥 Export Excel] [📄 PDF]
```

#### Anna klika [Pełny raport]:
```
📊 RAPORT MAGAZYNOWY - Październik 2025

══════════════════════════════════════════════════

1. WARTOŚĆ MAGAZYNU
   ┌────────────────────────────────────────────┐
   │ █████████████████░░░░░ 47,280 zł / 60,000 │
   └────────────────────────────────────────────┘
   
   Kategorie:
   • AGD - Pralki:     18,500 zł (39%)
   • AGD - Zmywarki:   14,200 zł (30%)
   • AGD - Lodówki:     8,100 zł (17%)
   • Inne:              6,480 zł (14%)

2. RUCHY MAGAZYNOWE
   • Przyjęcia:  85 szt  |  +12,450 zł
   • Wydania:    92 szt  |  -13,120 zł
   • Bilans:     -7 szt  |     -670 zł
   
   Wykres:
   │     ╭─╮
   │     │ │   ╭╮
   │  ╭──╯ ╰───╯╰─╮
   │  │           │╭─
   │──╯           ╰╯
   └──────────────────
   
3. ZAMÓWIENIA U DOSTAWCÓW
   • Ilość zamówień: 8
   • Wartość: 18,920 zł
   • Średnia wartość: 2,365 zł
   • Średni czas dostawy: 26 godzin ✅
   
   Dostawcy:
   1. Samsung Parts:     5 zamówień | 11,200 zł
   2. Universal Parts:   2 zamówienia | 5,800 zł
   3. Bosch Service:     1 zamówienie | 1,920 zł

4. WYKORZYSTANIE CZĘŚCI
   • Części użyte: 92 szt
   • W 68 zleceniach
   • Średnio: 1.35 części/zlecenie
   • Wartość: 13,120 zł
   
   Najpopularniejsze:
   ┌────────────────────────────────────────┐
   │ Część              │ Użyto │ Wartość  │
   ├────────────────────────────────────────┤
   │ Łożysko Samsung    │  15×  │ 1,275 zł│
   │ Pompa odpływowa    │  12×  │ 1,440 zł│
   │ Uszczelka drzwi    │  10×  │   450 zł│
   └────────────────────────────────────────┘

5. PERFORMANCE SERWISANTÓW
   ┌────────────────────────────────────────┐
   │ Serwisant       │ Części │ Wartość │ Avg│
   ├────────────────────────────────────────┤
   │ Adam Nowak      │  28×   │2,340 zł│ 84 │
   │ Tomek Wiśniewski│  22×   │1,890 zł│ 86 │
   │ Marek Kowal     │  18×   │1,520 zł│ 84 │
   └────────────────────────────────────────┘
   
   Avg = średnia wartość części na zlecenie

6. TRENDY I PRZEWIDYWANIA
   📈 Wzrost zapotrzebowania: +12% vs wrzesień
   🔮 Przewidywanie na listopad: +8%
   💡 Rekomendacja: zwiększ stan łożysk o 20%
   
══════════════════════════════════════════════════

Raport wygenerowany: 2025-10-15 09:30
Przez: Anna Admin

[📥 Pobierz Excel] [📄 Pobierz PDF] [📧 Wyślij email]
```

---

## 🎯 SCENARIUSZ 6: Integracja z fakturowaniem

### SYTUACJA:
Adam kończy zlecenie i generuje fakturę

#### Automatyczne dodanie części do faktury:
```
🧾 FAKTURA #FV/2025/10/125

Dla: Pani Kowalska
Zlecenie: #ORD1024
Data: 2025-10-03

┌──────────────────────────────────────────────────┐
│ Usługa                    │ Ilość │ Cena │ Suma  │
├──────────────────────────────────────────────────┤
│ ROBOCIZNA                                        │
│ Diagnoza i naprawa        │   1   │ 180  │ 180  │
│                                                  │
│ CZĘŚCI ZAMIENNE                                  │
│ • Łożysko bębna Samsung   │   2   │  85  │ 170  │
│   (DC97-16151A)                                  │
│ • Uszczelka drzwi pralki  │   1   │  45  │  45  │
│   (DC63-00563A)                                  │
├──────────────────────────────────────────────────┤
│ SUMA NETTO:                                395   │
│ VAT 23%:                                    91   │
│ ────────────────────────────────────────────────│
│ RAZEM:                                     486 zł│
└──────────────────────────────────────────────────┘

Gwarancja:
• Na usługę: 12 miesięcy
• Na części: 12 miesięcy (gwarancja producenta)

[📄 Podgląd PDF] [📧 Wyślij email] [✅ Zatwierdź]
```

System automatycznie:
1. ✅ Pobrał listę użytych części z magazynu
2. ✅ Dodał je do faktury z prawidłowymi cenami
3. ✅ Uwzględnił VAT i marżę
4. ✅ Zaktualizował stan magazynowy
5. ✅ Zapisał historię użycia części

---

## 💡 DODATKOWE SCENARIUSZE

### SCENARIUSZ 7: Zwrot części
Serwisant zarezerwował 3 części, użył tylko 2.

### SCENARIUSZ 8: Reklamacja części
Część była wadliwa, zwrot do dostawcy.

### SCENARIUSZ 9: Inwentaryzacja
Fizyczne liczenie magazynu raz na kwartał.

### SCENARIUSZ 10: Przeniesienie części
Z magazynu głównego do furgonetki serwisanta.

---

**Czy te scenariusze są jasne i kompletne?** 🎯
**Które funkcje są najważniejsze do zaimplementowania najpierw?**
