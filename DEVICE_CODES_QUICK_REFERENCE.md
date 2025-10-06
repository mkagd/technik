# 🎯 Kody Urządzeń - Quick Reference

## 📱 Strona Rezerwacji

### Krok 1: Wybór urządzenia

```
╔════════════════════════════════════════════════════════╗
║  Typ urządzenia AGD * (możesz wybrać kilka)           ║
╚════════════════════════════════════════════════════════╝

┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│  [PR]   │  │  [SU]   │  │  [LO]   │  │  [ZA]   │
│ ┌─────┐ │  │ ┌─────┐ │  │ ┌─────┐ │  │ ┌─────┐ │
│ │  🔵 │ │  │ │  🟣 │ │  │ │  🟦 │ │  │ │  🟦 │ │
│ └─────┘ │  │ └─────┘ │  │ └─────┘ │  │ └─────┘ │
│ Pralka  │  │Suszarka │  │ Lodówka │  │Zamrażar.│
│Automat. │  │Do ubrań │  │Chłodzenie│ │Mroźnia  │
│✓Wybrane │  │         │  │         │  │         │
└─────────┘  └─────────┘  └─────────┘  └─────────┘

┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│  [ZM]   │  │  [PI]   │  │  [KU]   │  │  [MI]   │
│ ┌─────┐ │  │ ┌─────┐ │  │ ┌─────┐ │  │ ┌─────┐ │
│ │  🟩 │ │  │ │  🟧 │ │  │ │  🔴 │ │  │ │  🟡 │ │
│ └─────┘ │  │ └─────┘ │  │ └─────┘ │  │ └─────┘ │
│Zmywarka │  │Piekarnik│  │Kuchenka │  │Mikrofal.│
│Do naczyń│  │Do piecz.│  │Gaz/elek.│  │Podgrzew.│
│         │  │         │  │✓Wybrane │  │         │
└─────────┘  └─────────┘  └─────────┘  └─────────┘
```

### Szczegóły wybranych urządzeń

```
╔════════════════════════════════════════════════════════╗
║  Szczegóły urządzeń (2)                                ║
╚════════════════════════════════════════════════════════╝

┌────────────────────────────────────────────────────────┐
│ [PR] 🔧 Pralka                                         │
├────────────────────────────────────────────────────────┤
│ Marka:     [Bosch          ▼]  Model: [WAW28560PL    ]│
│ Problem:   [Nie wiruje                               ▼]│
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ [KU] 🔧 Kuchenka                                       │
├────────────────────────────────────────────────────────┤
│ Marka:     [Amica          ▼]  Model: [ACGM510       ]│
│ Problem:   [Palniki nie zapalają się                 ▼]│
└────────────────────────────────────────────────────────┘
```

### Krok 5: Podsumowanie

```
╔════════════════════════════════════════════════════════╗
║ ✓ Podsumowanie zgłoszenia                             ║
╚════════════════════════════════════════════════════════╝

┌────────────────────────────────────────────────────────┐
│ 🔧 Urządzenia do naprawy (2)                [Edytuj]  │
├────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐ │
│ │ [PR] 🔧 Pralka - Bosch WAW28560PL                 │ │
│ │ Problem: Nie wiruje, głośno pracuje                │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [KU] 🔧 Kuchenka - Amica ACGM510                  │ │
│ │ Problem: Palniki nie zapalają się                  │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

## 👨‍💼 Panel Administratora

### Widok kartkowy (Card View)

```
┌──────────────────────┬──────────────────────┬──────────────────────┐
│ [PR]          PILNE  │ [LO]        WYSOKIE  │ [ZM]         ŚREDNIE │
│ ╔══════════════════╗ │ ╔══════════════════╗ │ ╔══════════════════╗ │
│ ║ 📍 ul. Polna 12  ║ │ ║ 📍 ul. Słoneczna ║ │ ║ 📍 ul. Lipowa 5  ║ │
│ ║    30-100 Warsza ║ │ ║    31-000 Kraków ║ │ ║    60-100 Poznań ║ │
│ ╚══════════════════╝ │ ╚══════════════════╝ │ ╚══════════════════╝ │
│                      │                      │                      │
│ 🔧 Bosch Pralka      │ 🔧 Samsung Lodówka   │ 🔧 Bosch Zmywarka    │
│ 💰 150 zł            │ 💰 200 zł            │ 💰 180 zł            │
│                      │                      │                      │
│ ┌──────────────────┐ │ ┌──────────────────┐ │ ┌──────────────────┐ │
│ │   Przydziel      │ │ │   Przydziel      │ │ │   Przydziel      │ │
│ └──────────────────┘ │ └──────────────────┘ │ └──────────────────┘ │
│ 2025-10-06           │ 2025-10-06           │ 2025-10-05           │
└──────────────────────┴──────────────────────┴──────────────────────┘

┌──────────────────────┬──────────────────────┬──────────────────────┐
│ [PI]          PILNE  │ [OK]         NISKIE  │ [MI]         ŚREDNIE │
│ ╔══════════════════╗ │ ╔══════════════════╗ │ ╔══════════════════╗ │
│ ║ 📍 ul. Kwiatowa  ║ │ ║ 📍 ul. Różana 7  ║ │ ║ 📍 ul. Zielona   ║ │
│ ║    00-001 Warsza ║ │ ║    50-500 Wrocław║ │ ║    80-800 Gdańsk ║ │
│ ╚══════════════════╝ │ ╚══════════════════╝ │ ╚══════════════════╝ │
│                      │                      │                      │
│ 🔧 Electrolux        │ 🔧 Amica Okap        │ 🔧 Samsung Mikrofal. │
│ 💰 250 zł            │ 💰 120 zł            │ 💰 180 zł            │
│                      │                      │                      │
│ ┌──────────────────┐ │ ┌──────────────────┐ │ ┌──────────────────┐ │
│ │   Przydziel      │ │ │   Przydziel      │ │ │   Przydziel      │ │
│ └──────────────────┘ │ └──────────────────┘ │ └──────────────────┘ │
│ 2025-10-06           │ 2025-10-07           │ 2025-10-06           │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

### Widok listy (List View)

```
╔══════════════════════════════════════════════════════════════════════╗
║  Zlecenia przychodzące (8)                                           ║
╚══════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────┐
│ [PR] #ORD2025001234      [PILNE] [WIZYTA]                            │
├──────────────────────────────────────────────────────────────────────┤
│ ╔═══════════════════════════════════════════════════════════════╗   │
│ ║ 📍 ul. Kwiatowa 15                                            ║   │
│ ║    30-100 Kraków                                              ║   │
│ ╚═══════════════════════════════════════════════════════════════╝   │
│                                                                       │
│ 📱 601234567  │  Jan Kowalski  │  🔧 Bosch WAW28560PL  │  💰 ~150zł │
│                                                                       │
│ 📋 Szczegóły klienta:                                                │
│ Email: jan.kowalski@example.com                                      │
│ Pełny adres: ul. Kwiatowa 15, 30-100 Kraków                         │
│ 🕐 Preferowane godziny: 14:00-18:00                                  │
│ 📅 Preferowane daty: 06.10.2025, 07.10.2025                         │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ [LO] #ORD2025001235      [WYSOKIE]                                   │
├──────────────────────────────────────────────────────────────────────┤
│ ╔═══════════════════════════════════════════════════════════════╗   │
│ ║ 📍 ul. Słoneczna 8                                            ║   │
│ ║    00-001 Warszawa                                            ║   │
│ ╚═══════════════════════════════════════════════════════════════╝   │
│                                                                       │
│ 📱 602345678  │  Anna Nowak  │  🔧 Samsung RB31  │  💰 ~200zł       │
│                                                                       │
│ 📋 Szczegóły klienta:                                                │
│ Email: anna.nowak@example.com                                        │
│ Pełny adres: ul. Słoneczna 8, 00-001 Warszawa                       │
│ 🕐 Preferowane godziny: 10:00-13:00                                  │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ [ZM] #ORD2025001236      [ŚREDNIE] [WIZYTA] [2 WIZYT OCZEKUJE]      │
├──────────────────────────────────────────────────────────────────────┤
│ ╔═══════════════════════════════════════════════════════════════╗   │
│ ║ 📍 ul. Lipowa 5                                               ║   │
│ ║    60-100 Poznań                                              ║   │
│ ╚═══════════════════════════════════════════════════════════════╝   │
│                                                                       │
│ 📱 603456789  │  Piotr Kowalczyk  │  🔧 Bosch SMS  │  💰 ~180zł     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Legenda kolorów

### Kody urządzeń:

```
┌──────┬──────────────────┬──────────┐
│ KOD  │ URZĄDZENIE       │  KOLOR   │
├──────┼──────────────────┼──────────┤
│ [PR] │ Pralka           │ 🔵 Niebie│
│ [SU] │ Suszarka         │ 🔵 Niebie│
│ [LO] │ Lodówka          │ 🟦 Cyan  │
│ [ZA] │ Zamrażarka       │ 🟦 Cyan  │
│ [ZM] │ Zmywarka         │ 🟩 Teal  │
│ [PI] │ Piekarnik        │ 🟧 Pomarań│
│ [KU] │ Kuchenka         │ 🟧 Pomarań│
│ [PC] │ Płyta ceramiczna │ 🔴 Czerwo│
│ [PG] │ Płyta gazowa     │ 🔴 Czerwo│
│ [PL] │ Płyta indukcyjna │ 🔴 Czerwo│
│ [OK] │ Okap             │ 🟣 Fiolet│
│ [MI] │ Mikrofalówka     │ 🟡 Żółty │
└──────┴──────────────────┴──────────┘
```

### Priorytety zleceń:

```
┌────────┬────────────┐
│ PILNE  │ 🔴 Czerwony│
│ WYSOKIE│ 🟧 Pomarań.│
│ ŚREDNIE│ 🟡 Żółty   │
│ NISKIE │ 🟢 Zielony │
└────────┴────────────┘
```

---

## 🔄 Przepływ użytkownika

### Klient tworzy rezerwację:

```
1. WYBÓR URZĄDZENIA
   ┌─────────────────┐
   │ Klikam [PR]     │
   │ Pralka          │
   └─────────────────┘
         ↓
2. SZCZEGÓŁY
   ┌─────────────────┐
   │ [PR] 🔧 Pralka  │
   │ Marka: Bosch    │
   │ Model: WAW...   │
   │ Problem: Nie... │
   └─────────────────┘
         ↓
3. LOKALIZACJA
   ul. Kwiatowa 15
         ↓
4. KONTAKT
   Jan Kowalski
         ↓
5. PODSUMOWANIE
   ┌─────────────────┐
   │ [PR] 🔧 Pralka  │
   │ Bosch WAW...    │
   │ Problem: Nie... │
   └─────────────────┘
         ↓
   [Zatwierdź zgłoszenie]
```

### Administrator widzi zlecenie:

```
PANEL PRZYDZIAŁU ZLECEŃ
┌─────────────────────┐
│ [PR]         PILNE  │
│ ╔═════════════════╗ │
│ ║ 📍 ul. Kwiatowa ║ │
│ ║    Kraków       ║ │
│ ╚═════════════════╝ │
│ 🔧 Bosch Pralka     │
│ [Przydziel]         │
└─────────────────────┘
      ↓
  Klik [Przydziel]
      ↓
┌─────────────────────┐
│ Wybierz serwisanta: │
│ [Mariusz Bielaszka ▼│
│ Data: [06.10.2025]  │
│ Godzina: [14:00]    │
│ [Dodaj wizytę]      │
└─────────────────────┘
```

### Serwisant widzi wizytę:

```
LISTA WIZYT
┌─────────────────────┐
│ [PR] Zaplanowane    │
│ 📍 ul. Kwiatowa 15  │
│    Kraków           │
│ 🔧 Bosch WAW28560PL │
│ 👤 Jan Kowalski     │
└─────────────────────┘
```

---

## 💡 Wskazówki

### Dla klientów:
- ✅ Możesz wybrać **wiele urządzeń** naraz
- ✅ Kody pomagają zidentyfikować typ urządzenia
- ✅ Kolory ułatwiają wizualną kategoryzację

### Dla administratorów:
- ✅ Sortuj zlecenia według **kodów** (grupuj pralki, lodówki, etc.)
- ✅ **Adres jest teraz główną informacją** - planuj trasy!
- ✅ Używaj kolorów do szybkiej identyfikacji kategorii
- ✅ Filtruj po priorytetach (PILNE = czerwone)

### Dla serwisantów:
- ✅ Kod **[PR]** = przygotuj narzędzia do pralek
- ✅ Kod **[LO]** = weź gazométr (możliwy wyciek freonu)
- ✅ Kod **[ZM]** = spakuj części do zmywarek
- ✅ **Adres widoczny od razu** = wprowadź do nawigacji

---

**Szybka ściąga:**
- **[PR]** 🔵 = Pralka
- **[LO]** 🟦 = Lodówka
- **[ZM]** 🟩 = Zmywarka
- **[PI]** 🟧 = Piekarnik
- **[OK]** 🟣 = Okap
