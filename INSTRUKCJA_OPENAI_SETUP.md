# 🚀 INSTRUKCJA KONFIGURACJI OpenAI GPT-4o mini

## 📋 KROK 1: Założ konto OpenAI

1. Idź na: https://platform.openai.com/
2. Kliknij "Sign up" i załóż konto
3. Potwierdź email

## 💳 KROK 2: Dodaj metodę płatności

1. Idź do: https://platform.openai.com/account/billing/overview
2. Kliknij "Add payment method"
3. Dodaj kartę lub BLIK
4. Dodaj minimum $5 (20zł) - starczy na miesiące!

## 🔑 KROK 3: Wygeneruj API Key

1. Idź do: https://platform.openai.com/api-keys
2. Kliknij "Create new secret key"
3. Nazwij klucz: "TECHNIK-Chat-AI"
4. Skopiuj klucz (zaczyna się od sk-...)

## ⚙️ KROK 4: Skonfiguruj aplikację

1. Otwórz plik `.env.local` w głównym folderze projektu
2. Znajdź linię: `OPENAI_API_KEY=your-openai-api-key-here`
3. Zamień na: `OPENAI_API_KEY=sk-twój-prawdziwy-klucz-tutaj`
4. Zapisz plik

## 📦 KROK 5: Zainstaluj bibliotekę OpenAI

Uruchom w terminalu (w folderze projektu):
```bash
npm install openai
```

## ✅ KROK 6: Restart serwera

Zatrzymaj serwer (Ctrl+C) i uruchom ponownie:
```bash
npm run dev
```

## 🎯 GOTOWE!

Chat AI będzie teraz używał prawdziwego GPT-4o mini zamiast prostych reguł!

## 💰 MONITORING KOSZTÓW

- Dashboard: https://platform.openai.com/usage
- Ustawiaj limity w: https://platform.openai.com/account/billing/limits
- Polecane limity: $10/miesiąc (40zł) na start

## 🔧 ROZWIĄZYWANIE PROBLEMÓW

**Błąd "Invalid API Key":**
- Sprawdź czy klucz zaczyna się od `sk-`
- Sprawdź czy nie ma spacji na początku/końcu
- Upewnij się że klucz jest w pliku `.env.local`

**Błąd "Insufficient quota":**
- Dodaj więcej środków na konto OpenAI
- Sprawdź limit wydatków w ustawieniach

**Błąd "Model not found":**
- Upewnij się że masz dostęp do GPT-4o mini
- Sprawdź status swojego konta na OpenAI

## 📞 POTRZEBUJESZ POMOCY?

Jeśli coś nie działa, wyślij zrzut ekranu błędu!