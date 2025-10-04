# Dark Mode - Globalny System 🌙

## Implementacja (October 2025)

Dark mode działa teraz **GLOBALNIE** w całej aplikacji dzięki React Context API.

## Jak to działa?

### 1. Context Provider (`contexts/DarkModeContext.js`)
- Przechowuje globalny stan dark mode
- Synchronizuje z `localStorage`
- Automatycznie aplikuje klasę `dark` na `<html>`
- Wykrywa system preference użytkownika

### 2. Provider Wrapper (`pages/_app.js`)
```javascript
<DarkModeProvider>
  <ThemeProvider>
    <ToastProvider>
      <Component {...pageProps} />
    </ToastProvider>
  </ThemeProvider>
</DarkModeProvider>
```

### 3. Anti-Flash Script (`pages/_document.js`)
- Wykonuje się PRZED React hydration
- Zapobiega miganiu przy pierwszym ładowaniu
- Odczytuje localStorage i aplikuje dark mode natychmiast

### 4. Toggle Component (`components/DarkModeToggle.js`)
- Używa `useDarkMode()` hook z Context
- Ikona słońca ☀️ (gdy dark mode aktywny)
- Ikona księżyca 🌙 (gdy light mode aktywny)

## Jak używać?

### W komponencie:
```javascript
import { useDarkMode } from '../contexts/DarkModeContext';

function MyComponent() {
  const { darkMode, toggleDarkMode } = useDarkMode();
  
  return (
    <div>
      <p>Dark mode: {darkMode ? 'ON' : 'OFF'}</p>
      <button onClick={toggleDarkMode}>Toggle</button>
    </div>
  );
}
```

### W JSX (Tailwind):
```javascript
<div className="bg-white dark:bg-gray-900">
  <h1 className="text-gray-900 dark:text-white">Tytuł</h1>
  <p className="text-gray-600 dark:text-gray-300">Tekst</p>
</div>
```

## Persistence

✅ **localStorage** - ustawienie zapisywane jako `'darkMode': 'true' | 'false'`
✅ **System preference** - fallback do `prefers-color-scheme: dark`
✅ **Globalne** - działa na wszystkich stronach aplikacji
✅ **Zero flash** - dzięki inline script w _document.js

## Testing

1. Otwórz dowolną stronę: `/logistyka/magazyn`
2. Kliknij toggle 🌙/☀️ w headerze
3. Przejdź na inną stronę: `/serwis/magazyn`
4. **Dark mode powinien zostać zachowany!**
5. Odśwież stronę (F5) - **dark mode dalej aktywny!**
6. Zamknij i otwórz przeglądarkę - **dark mode zapamiętany!**

## Strony z Dark Mode

✅ `/logistyka/magazyn` - Dashboard
✅ `/logistyka/magazyn/zamowienia` - Zamówienia
✅ `/logistyka/magazyn/konsolidacja` - Konsolidacja  
✅ `/logistyka/magazyn/admin-order` - Admin ordering
✅ `/logistyka/magazyn/magazyny` - Przegląd magazynów
✅ `/serwis/magazyn` - Dashboard serwisanta
✅ `/serwis/magazyn/moj-magazyn` - Mój magazyn
✅ `/serwis/magazyn/zamow` - Zamów części
✅ `/serwis/magazyn/zamowienia` - Moje zamówienia

## Color Scheme

```css
/* Backgrounds */
bg-gray-50    → dark:bg-gray-900  (body)
bg-white      → dark:bg-gray-800  (cards, headers)
bg-gray-100   → dark:bg-gray-700  (tertiary)

/* Text */
text-gray-900 → dark:text-white   (headings)
text-gray-600 → dark:text-gray-300 (body text)
text-gray-500 → dark:text-gray-400 (muted)

/* Borders */
border-gray-200 → dark:border-gray-700
border-gray-300 → dark:border-gray-600

/* Badges (semi-transparent) */
bg-red-100    → dark:bg-red-900/30
text-red-800  → dark:text-red-300
```

## API Integration (opcjonalne - przyszłość)

Możesz rozszerzyć system o zapisywanie w API:

```javascript
// W DarkModeContext.js dodaj:
const saveDarkModeToAPI = async (isDark) => {
  try {
    await fetch('/api/user/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ darkMode: isDark })
    });
  } catch (error) {
    console.error('Failed to save dark mode to API:', error);
  }
};

// W toggleDarkMode():
const toggleDarkMode = () => {
  setDarkMode(prev => {
    const newMode = !prev;
    saveDarkModeToAPI(newMode); // Zapisz w API
    return newMode;
  });
};
```

## Troubleshooting

**Problem**: Dark mode się resetuje po przejściu na inną stronę
**Rozwiązanie**: Upewnij się że `DarkModeProvider` opakowuje `<Component>` w `_app.js`

**Problem**: Flash białego ekranu przy ładowaniu
**Rozwiązanie**: Sprawdź czy istnieje `pages/_document.js` z inline script

**Problem**: Toggle nie działa
**Rozwiązanie**: Sprawdź czy component importuje `useDarkMode` z Context, nie z hooka

## Files Modified

✅ `contexts/DarkModeContext.js` - CREATED (Context API)
✅ `pages/_app.js` - UPDATED (dodano DarkModeProvider)
✅ `pages/_document.js` - CREATED (anti-flash script)
✅ `components/DarkModeToggle.js` - UPDATED (używa Context)
✅ `hooks/useDarkMode.js` - DEPRECATED (nie używać, użyj Context)

---

**Status**: ✅ GOTOWE i działa globalnie!
**Last updated**: October 3, 2025
