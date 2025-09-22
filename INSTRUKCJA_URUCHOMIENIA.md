# 🚀 Instrukcja uruchomienia serwera

## Metoda 1: Użyj gotowego skryptu (ZALECANE)
```
start-server.bat
```
Kliknij dwukrotnie na plik `start-server.bat` lub uruchom go z linii poleceń.

## Metoda 2: Ręcznie przez PowerShell
1. Otwórz PowerShell jako Administrator
2. Przejdź do katalogu projektu:
   ```powershell
   cd "c:\Users\Admin\Technik"
   ```
3. Uruchom serwer:
   ```powershell
   npm run dev
   ```

## Metoda 3: Ręcznie przez CMD
1. Otwórz Wiersz polecenia (CMD)
2. Przejdź do katalogu:
   ```cmd
   cd "c:\Users\Admin\Technik"
   ```
3. Uruchom serwer:
   ```cmd
   npm run dev
   ```

## 🌐 Po uruchomieniu serwera

Serwer będzie dostępny pod adresami:
- **Strona główna**: http://localhost:3000
- **Formularz zgłoszeń**: http://localhost:3000/rezerwacja
- **Mapa klientów**: http://localhost:3000/mapa
- **API endpoint**: http://localhost:3000/api/rezerwacje

## 🧪 Testowanie

1. **Test czy serwer działa**:
   ```
   test-server.bat
   ```

2. **Test integracji formularza z mapą**:
   ```
   node test-mapa-integration.js
   ```

## 🔧 Rozwiązywanie problemów

### Problem: "npm nie jest rozpoznane"
- Zainstaluj Node.js z https://nodejs.org
- Zrestartuj komputer po instalacji

### Problem: "Błąd portu 3000"
- Port może być zajęty przez inny proces
- Zakończ inne aplikacje lub zmień port w package.json

### Problem: "Cannot find module"
- Uruchom: `npm install`
- Sprawdź czy jesteś w poprawnym katalogu

### Problem: "Błąd kompilacji"
- Sprawdź logi w terminalu
- Upewnij się że wszystkie pliki są poprawne

## 📋 Checklist przed uruchomieniem

- [ ] Node.js jest zainstalowany
- [ ] Jesteś w katalogu `c:\Users\Admin\Technik`
- [ ] Plik `package.json` istnieje
- [ ] Folder `node_modules` istnieje (jeśli nie, uruchom `npm install`)
- [ ] Port 3000 jest wolny

## 🎯 Co dalej po uruchomieniu

1. **Przetestuj formularz**:
   - Idź do http://localhost:3000/rezerwacja
   - Wypełnij formularz z prawdziwym adresem
   - Wyślij zgłoszenie

2. **Sprawdź mapę**:
   - Idź do http://localhost:3000/mapa
   - Sprawdź czy widzisz swoje zgłoszenie
   - Otwórz konsolę deweloperską (F12) aby zobaczyć logi

3. **Debugowanie**:
   - Sprawdź konsolę przeglądarki
   - Sprawdź terminal gdzie uruchomiony jest serwer
   - Użyj narzędzi deweloperskich

---

**🚀 Gotowe! Teraz możesz uruchomić serwer i przetestować aplikację!**
