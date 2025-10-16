# 📋 Dodawanie Nowego Zlecenia Po Zeskanowaniu

## Scenariusz:
Technik jest u klienta, skanuje tabliczkę znamionową **nowego urządzenia** (np. drugiej pralki) i chce utworzyć **nowe zlecenie** dla tego samego klienta.

---

## 🎯 Dwie opcje:

### Opcja 1: Dodaj urządzenie do TEGO SAMEGO zlecenia
**Kiedy?** 
- Klient zgłasza problemy z wieloma urządzeniami jednocześnie
- Wszystkie urządzenia mają być naprawione w ramach jednej wizyty

**Jak?**
1. Otwórz istniejące zlecenie
2. Kliknij **"📷 Skanuj tabliczkę"**
3. Zeskanuj tabliczkę drugiego urządzenia
4. Kliknij **"Zapisz zmiany"**
5. ✅ Zlecenie teraz ma **2 urządzenia**

---

### Opcja 2: Utwórz NOWE zlecenie dla tego klienta
**Kiedy?**
- Drugie urządzenie to osobna naprawa (inny termin, inna diagnoza)
- Klient chce osobne faktury/rozliczenia

**Jak?**
1. Przejdź do **Panel Admina → Zamówienia**
2. Kliknij **"+ Nowe zamówienie"**
3. **Wybierz klienta z listy** (wyszukaj po nazwisku/telefonie)
   - ✅ System automatycznie uzupełni dane kontaktowe
   - ✅ Zachowa historię napraw dla tego klienta
4. W sekcji "Urządzenia" kliknij **"📷 Skanuj tabliczkę"**
5. Zeskanuj tabliczkę nowego urządzenia
6. Uzupełnij opis problemu
7. Kliknij **"Zapisz"**
8. ✅ Klient ma teraz **2 oddzielne zlecenia**

---

## 🔗 Powiązanie zleceń klienta

System automatycznie:
- ✅ Linkuje wszystkie zlecenia po `clientId`
- ✅ Pokazuje historię napraw klienta
- ✅ Pozwala zobaczyć poprzednie urządzenia i problemy

### Gdzie zobaczyć wszystkie zlecenia klienta?

**Panel Admina → Klienci → [Wybierz klienta]**
- 📋 Zakładka "Zlecenia" pokazuje wszystkie zamówienia
- 📅 Zakładka "Historia" pokazuje wszystkie wizyty

---

## 📸 Flow dla technika w terenie:

### Scenariusz: Technik u klienta, drugi sprzęt również wymaga naprawy

```
1. 🏠 Technik jest u klienta #275513 (np. Jan Kowalski)
   
2. 🔧 Naprawia pralkę (zlecenie ORDW252750001)
   
3. 👀 Klient mówi: "A może by pan zajrzał też do zmywarki?"
   
4. 🤔 Decyzja technika:
   
   OPCJA A: Dodać do tego samego zlecenia?
   ✅ TAK - jeśli:
      - Zmywarka to drobna sprawa (można naprawić teraz)
      - Klient chce jedną fakturę
      - Ta sama wizyta
   
   ❌ NIE - jeśli:
      - Zmywarka wymaga części (trzeba zamówić)
      - Trzeba wrócić w innym terminie
      - Klient chce osobne rozliczenie
   
5. Wykonanie:
   
   OPCJA A (TO SAMO ZLECENIE):
   - Otwórz zlecenie ORDW252750001 na telefonie
   - Kliknij "📷 Skanuj tabliczkę"
   - Zeskanuj tabliczkę zmywarki
   - Dodaj opis problemu w notatkach
   - Zapisz
   - ✅ Jedno zlecenie, 2 urządzenia
   
   OPCJA B (NOWE ZLECENIE):
   - Panel Admin → "+ Nowe zamówienie"
   - Wybierz klienta: Jan Kowalski (CLI275513)
   - Kliknij "📷 Skanuj tabliczkę"
   - Zeskanuj tabliczkę zmywarki
   - Opisz problem ze zmywarką
   - Status: "Oczekuje na części" / "Nieprzypisane"
   - Zapisz
   - ✅ Dwa oddzielne zlecenia dla tego samego klienta
```

---

## 💡 Zalety systemu wielourządzeniowego:

### Dla klienta z wieloma urządzeniami (np. restauracja):
```
Klient: "Restauracja Bella Vista"
Adres: ul. Lipowa 17, Dębica

Zlecenie 1 (ORDW252750001):
├── Urządzenie 1: Zmywarka Bosch SPV25CX00E
└── Status: Zakończone (2025-10-10)

Zlecenie 2 (ORDW252760015):
├── Urządzenie 1: Piekarnik Electrolux EOC5851FOX
├── Urządzenie 2: Płyta indukcyjna Bosch PXX675DV1E
└── Status: W trakcie naprawy

Zlecenie 3 (ORDW252780042):
├── Urządzenie 1: Lodówka Samsung RS68N8941SL
└── Status: Oczekuje na części
```

### Korzyści:
- ✅ Osobne statusy dla każdego zlecenia
- ✅ Różne daty realizacji
- ✅ Osobne faktury/rozliczenia
- ✅ Historia napraw per urządzenie
- ✅ Łatwe śledzenie gwarancji

---

## 🧪 Test scenariusza:

### Krok 1: Utwórz klienta testowego
```
Imię: Jan Kowalski
Telefon: 123456789
Adres: ul. Testowa 1, Kraków
```

### Krok 2: Pierwsze zlecenie - Pralka
```
- Nowe zamówienie → Wybierz: Jan Kowalski
- Skanuj tabliczkę: Pralka Samsung
- Problem: "Nie wiruje"
- Status: W trakcie naprawy
- Zapisz
```

### Krok 3: Drugie zlecenie - Zmywarka
```
- Nowe zamówienie → Wybierz: Jan Kowalski
- Skanuj tabliczkę: Zmywarka Bosch
- Problem: "Nie grzeje wody"
- Status: Oczekuje na części
- Zapisz
```

### Krok 4: Weryfikacja
```
Panel Admin → Klienci → Jan Kowalski
✅ Powinno pokazać 2 zlecenia
✅ Każde z innym statusem
✅ Każde z innym urządzeniem
```

---

## ⚠️ Częste błędy:

### ❌ BŁĄD: Dodanie drugiego urządzenia tworzy nowego klienta
**Powód**: Użyto "Nowe zamówienie" → "Nowy klient" zamiast wybrać z listy

**Rozwiązanie**: 
- W formularzu nowego zamówienia zawsze **wybierz istniejącego klienta**
- Pole "Wybierz klienta" ma wyszukiwarkę - wpisz nazwisko/telefon

### ❌ BŁĄD: Nie mogę znaleźć klienta na liście
**Powód**: Klient nie istnieje w bazie

**Rozwiązanie**:
1. Panel Admin → **Klienci** → "+ Dodaj klienta"
2. Uzupełnij dane klienta
3. Zapisz
4. Teraz utwórz zlecenie i wybierz tego klienta z listy

### ❌ BŁĄD: Dwa urządzenia w jednym zleceniu, ale chcę osobne
**Powód**: Dodano przez "📷 Skanuj tabliczkę" zamiast utworzyć nowe zlecenie

**Rozwiązanie**:
1. Otwórz zlecenie z 2 urządzeniami
2. Kliknij "📷 Skanuj tabliczkę"
3. Usuń drugie urządzenie (kliknij X)
4. Zapisz
5. Utwórz **nowe zlecenie** dla tego klienta
6. Dodaj drugie urządzenie do nowego zlecenia

---

## 📊 Diagram przepływu:

```
┌─────────────────────────────────┐
│  Technik u klienta              │
│  Klient: Jan Kowalski           │
└───────────┬─────────────────────┘
            │
            ▼
    ┌───────────────────┐
    │ Nowe urządzenie?  │
    └───────┬───────────┘
            │
     ┌──────┴──────┐
     │             │
     ▼             ▼
┌─────────┐   ┌──────────┐
│  TA     │   │  NOWA    │
│  SAMA   │   │  WIZYTA  │
│ WIZYTA  │   │          │
└────┬────┘   └────┬─────┘
     │             │
     ▼             ▼
┌──────────────┐ ┌────────────────┐
│ Otwórz       │ │ Panel Admin    │
│ istniejące   │ │ → Nowe         │
│ zlecenie     │ │   zamówienie   │
└──────┬───────┘ └────┬───────────┘
       │              │
       ▼              ▼
┌──────────────┐ ┌────────────────┐
│ 📷 Skanuj    │ │ Wybierz        │
│   tabliczkę  │ │ klienta z      │
│              │ │ listy          │
└──────┬───────┘ └────┬───────────┘
       │              │
       ▼              ▼
┌──────────────┐ ┌────────────────┐
│ Zapisz       │ │ 📷 Skanuj      │
│ zmiany       │ │   tabliczkę    │
└──────┬───────┘ └────┬───────────┘
       │              │
       ▼              ▼
┌──────────────┐ ┌────────────────┐
│ Jedno        │ │ Dwa oddzielne  │
│ zlecenie,    │ │ zlecenia,      │
│ 2 urządzenia │ │ 1 urządzenie   │
│              │ │ każde          │
└──────────────┘ └────────────────┘
```

---

## ✅ Podsumowanie

| Scenariusz | Metoda | Rezultat |
|-----------|--------|----------|
| Ta sama wizyta, wiele urządzeń | Dodaj do istniejącego zlecenia | 1 zlecenie, wiele urządzeń |
| Różne wizyty, różne terminy | Utwórz nowe zlecenie | Osobne zlecenia per urządzenie |
| Serwis firmowy (np. restauracja) | Wiele zleceń dla jednego klienta | Historia napraw per klient |

**Zalecenie**: 
- 🏠 **Klienci prywatni**: Częściej 1 urządzenie = 1 zlecenie
- 🏢 **Firmy/restauracje**: Często wiele zleceń (różne urządzenia, różne terminy)
