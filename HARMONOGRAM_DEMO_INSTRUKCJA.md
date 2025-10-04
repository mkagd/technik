# 🎬 HARMONOGRAM PRACY - INSTRUKCJA DEMO

**Czas trwania:** ~5 minut  
**Cel:** Pokazać pracownikowi jak korzystać z systemu harmonogramu  

---

## 🎥 SCENARIUSZ DEMO

### **SCENA 1: Wejście do systemu** (30 sekund)

**Narrator:**
> "Witaj! Dziś pokażę Ci jak ustawić swój harmonogram pracy w panelu pracownika."

**Akcja:**
1. Otwórz przeglądarkę
2. Wejdź na `http://localhost:3000/technician/login`
3. Zaloguj się:
   - Email: `jan.kowalski@techserwis.pl`
   - Hasło: `haslo123`
4. Kliknij "Zaloguj"

**Narrator:**
> "Po zalogowaniu widzisz główny dashboard. Zwróć uwagę na menu po lewej stronie."

---

### **SCENA 2: Wejście do harmonogramu** (30 sekund)

**Akcja:**
1. Pokaż kursorem menu po lewej
2. Zatrzymaj się na "Harmonogram ⭐"
3. Kliknij

**Narrator:**
> "Kliknij 'Harmonogram' z gwiazdką. To nowa funkcja, która pozwoli Ci zarządzać swoim czasem pracy!"

**Pokaż ekran:**
- Timeline z 7 dniami (Pn-Nd)
- 3 karty statystyk (puste na początku)
- Przyciski akcji u góry

**Narrator:**
> "Widzisz tutaj oś czasu dla całego tygodnia. Każdy dzień to 24 godziny, podzielone na 15-minutowe przedziały."

---

### **SCENA 3: Dodawanie pierwszego bloku** (1 minuta)

**Narrator:**
> "Zacznijmy od dodania bloku pracy. Zobaczysz jak to jest proste!"

**Akcja:**
1. Przewiń w dół do "Poniedziałek"
2. Kliknij ➕ u dołu kolumny Poniedziałek
3. Modal się otwiera

**Narrator:**
> "Modal pozwala wybrać wszystkie szczegóły. Najpierw typ bloku..."

**Akcja:**
4. Kliknij "💼 Praca" (już zaznaczone)
5. Wybierz dzień: "Poniedziałek" (już wybrany)

**Narrator:**
> "Teraz ustaw godziny pracy. Wybierzmy standardową zmianę 8:00 - 16:00."

**Akcja:**
6. Od: ustaw `08:00`
7. Do: ustaw `16:00`
8. Notatki: wpisz "Standardowa zmiana"

**Narrator:**
> "I kliknij Dodaj!"

**Akcja:**
9. Kliknij "Dodaj ✅"

**Efekt:**
- Zielony blok pojawia się na timelinei
- Karty statystyk się aktualizują:
  - Godziny pracy: 8h 0min
  - Dni: 1/7
  - Zarobki: 400 PLN

**Narrator:**
> "Świetnie! Widzisz zielony blok na osi czasu. Twoje statystyki się zaktualizowały - 8 godzin pracy to 400 złotych!"

---

### **SCENA 4: Dodawanie więcej bloków** (1 minuta)

**Narrator:**
> "Teraz dodajmy więcej dni, aby zobaczyć jak rosną zarobki!"

**Akcja (szybkie tempo):**
1. Kliknij ➕ na Wtorek
2. Od: 08:00, Do: 16:00 → Dodaj
3. Kliknij ➕ na Środa
4. Od: 08:00, Do: 16:00 → Dodaj
5. Kliknij ➕ na Czwartek
6. Od: 08:00, Do: 16:00 → Dodaj
7. Kliknij ➕ na Piątek
8. Od: 08:00, Do: 16:00 → Dodaj

**Efekt (ZOOM na statystyki):**
- Godziny: 40h 0min ✨
- Dni: 5/7
- Zarobki: **2000 PLN**
- 🏆 **BONUS 15%: +300 PLN**
- **RAZEM: 2300 PLN!**

**Narrator:**
> "WOW! Zobacz co się stało! 40 godzin w tygodniu = bonus 15%! To dodatkowe 300 złotych! Razem 2300 złotych!"

---

### **SCENA 5: Odznaki i motywacja** (45 sekund)

**Narrator:**
> "System nagradza Cię za wysoką dostępność. Spójrz na odznaki!"

**Akcja:**
1. ZOOM na kartę "🏆 Osiągnięcia"

**Pokaż:**
- 🔥 Streak Master (5+ dni)
- 💪 Full Timer (40+ godzin)
- Komunikat: "🎉 Świetna robota! Maksymalny harmonogram pracy!"

**Narrator:**
> "Zdobyłeś już dwie odznaki! Streak Master za 5 dni pracy i Full Timer za 40 godzin. Im więcej godzin, tym więcej zleceń otrzymasz!"

---

### **SCENA 6: Dodawanie przerwy** (45 sekund)

**Narrator:**
> "Możesz też zaznaczyć przerwy. Zobaczmy jak to działa."

**Akcja:**
1. Kliknij ➕ na Poniedziałek
2. Przełącz na "☕ Przerwa"
3. Dzień: Poniedziałek
4. Od: 12:00
5. Do: 12:30
6. Notatki: "Lunch break"
7. Kliknij "Dodaj ✅"

**Efekt:**
- Pomarańczowy blok pojawia się w środku zielonego bloku (12:00-12:30)
- Statystyki: Przerwy: 0h 30min
- Efektywność: 98.8%

**Narrator:**
> "Pomarańczowy blok to przerwa. System automatycznie liczy efektywność - ile czasu faktycznie pracujesz."

---

### **SCENA 7: Usuwanie slotu** (30 sekund)

**Narrator:**
> "Jeśli się pomyliłeś, łatwo usuniesz slot. Wystarczy na niego kliknąć."

**Akcja:**
1. Najedź myszką na blok przerwy (pomarańczowy)
2. Blok zmienia się na czerwony
3. Pojawia się tekst "🗑️ Usuń"
4. Kliknij
5. Potwierdź "OK"

**Efekt:**
- Blok znika
- Statystyki się aktualizują

**Narrator:**
> "Proste! Kliknij na slot aby go usunąć."

---

### **SCENA 8: Kopiowanie tygodnia** (45 sekund)

**Narrator:**
> "Nie chcesz ustawiać tego samo każdego tygodnia? Jest rozwiązanie!"

**Akcja:**
1. Kliknij "Następny tydzień →" u góry
2. Timeline jest pusty (nowy tydzień)
3. Kliknij "📋 Kopiuj poprzedni tydzień"
4. Potwierdź "OK"

**Efekt:**
- Wszystkie bloki z poprzedniego tygodnia się kopiują!
- Alert: "✅ Harmonogram skopiowany!"

**Narrator:**
> "Gotowe! Cały harmonogram z poprzedniego tygodnia został skopiowany. Możesz go teraz edytować jeśli potrzebujesz."

---

### **SCENA 9: Podsumowanie i motywacja** (30 sekunds)

**Narrator:**
> "Podsumujmy najważniejsze rzeczy!"

**Pokaż tekst na ekranie:**
```
✅ Dodawaj bloki pracy (15-minutowa dokładność)
✅ Dodawaj przerwy (opcjonalnie)
✅ Usuwaj sloty jednym kliknięciem
✅ Kopiuj harmonogramy między tygodniami
✅ Zobacz zarobki w czasie rzeczywistym

💰 40h/tydzień = 2300 PLN (z bonusem)
🏆 Zdobywaj odznaki
📈 Więcej godzin = więcej zleceń!
```

**Narrator:**
> "Pamiętaj: Im więcej godzin dostępności ustawisz, tym więcej zleceń otrzymasz! A więcej zleceń to więcej zarobków!"

---

### **SCENA 10: Call to Action** (15 sekund)

**Ekran:**
```
📅 USTAW SWÓJ HARMONOGRAM JUŻ DZIŚ!

Kliknij "Harmonogram ⭐" w menu
i zacznij zarabiać więcej! 💰

Pytania? Skontaktuj się z administratorem.
```

**Narrator:**
> "To wszystko! Teraz Twoja kolej. Zaloguj się, ustaw harmonogram i zacznij zarabiać więcej! Powodzenia!"

---

## 🎯 KLUCZOWE KOMUNIKATY (dla głosu lektora)

### **Wprowadzenie:**
- "Witaj! Dziś pokażę Ci jak ustawić harmonogram pracy."
- "To bardzo proste i zajmie tylko kilka minut."

### **Podczas demo:**
- "Zobacz jak to jest intuicyjne!"
- "Im więcej godzin, tym więcej zarobków!"
- "System automatycznie liczy bonusy!"
- "Zdobywasz odznaki za osiągnięcia!"

### **Motywacja:**
- "40 godzin to bonus 15% - dodatkowe 300 złotych!"
- "Więcej godzin = więcej zleceń dla Ciebie!"
- "Pamiętaj: to Ty decydujesz ile zarabiasz!"

### **Zakończenie:**
- "To wszystko! Teraz Twoja kolej!"
- "Ustaw harmonogram i zacznij zarabiać więcej!"

---

## 📝 TEKST DO NAPISÓW (jeśli wideo bez dźwięku)

```
00:00 - "Witaj w systemie harmonogramu pracy!"
00:30 - "Kliknij Harmonogram ⭐ w menu"
01:00 - "Dodaj blok pracy: 08:00 - 16:00"
01:30 - "Dodaj więcej dni..."
02:00 - "40h = 2300 PLN (z bonusem 15%!)"
02:30 - "Zdobywasz odznaki! 🏆"
03:00 - "Dodaj przerwę (opcjonalnie)"
03:30 - "Usuń slot jednym kliknięciem"
04:00 - "Kopiuj poprzedni tydzień 📋"
04:30 - "Im więcej godzin → tym więcej zarobków!"
05:00 - "Ustaw harmonogram już dziś! 💰"
```

---

## 🎨 GRAFIKI DO UŻYCIA

### **Intro slide:**
```
📅 HARMONOGRAM PRACY
System zarządzania dostępnością

Więcej godzin = Więcej zleceń = Więcej zarobków! 💰
```

### **Outro slide:**
```
✅ GRATULACJE!

Teraz wiesz jak:
✓ Dodawać bloki pracy
✓ Ustawiać przerwy
✓ Kopiować tygodnie
✓ Zarabiać więcej!

📅 Zaloguj się i zacznij już dziś!
```

---

## 🎬 PRODUKCJA WIDEO

### **Narzędzia:**
- **Screen recording:** OBS Studio / Camtasia
- **Edycja:** DaVinci Resolve / Adobe Premiere
- **Voice-over:** Audacity
- **Grafiki:** Canva / Figma

### **Parametry:**
- Rozdzielczość: 1920×1080 (Full HD)
- FPS: 30
- Format: MP4 (H.264)
- Długość: ~5 minut
- Język: Polski
- Napisy: TAK (opcjonalne)

### **Muzyka (background, cicho):**
- Styl: upbeat, motywujący
- BPM: 120-140
- Źródło: Epidemic Sound / AudioJungle
- Głośność: -20dB (nie przeszkadza w narracji)

---

## 📊 METRYKI SUKCESU WIDEO

Po wdrożeniu, mierz:
- ✅ % pracowników którzy obejrzeli wideo
- ✅ % pracowników którzy ustawili harmonogram
- ✅ Średnia liczba godzin na pracownika
- ✅ Wzrost dostępności (przed/po wideo)
- ✅ Feedback (5-star rating)

**Cel:** 90%+ pracowników ustawia harmonogram po obejrzeniu wideo! 🎯

---

**Przygotowane:** 3 października 2025  
**Dla:** Panel Pracownika - System Harmonogramu  
**Czas trwania:** ~5 minut  
**Status:** ✅ Gotowy do nagrania  
