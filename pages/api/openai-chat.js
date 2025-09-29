// pages/api/openai-chat.js - PRAWDZIWE AI z GPT-4o mini
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model i ustawienia
const MODEL = 'gpt-4o-mini';
const MAX_TOKENS = 800;
const TEMPERATURE = 0.7;

// System prompt dla serwису AGD TECHNIK - IDENTYCZNY JAK GPT-4!
const SYSTEM_PROMPT = `Jesteś AI asystentem firmy TECHNIK - serwisu sprzętu AGD z Rzeszowa. 

🚨 **KRYTYCZNE: ZAWSZE REAGUJ NA POJEDYNCZE SŁOWA!**

⚡ **PRIORYTETOWE REAKCJE:**
- "zamów" → NATYCHMIAST pokazuj opcje AUTO/CHAT
- "naprawa" → NATYCHMIAST pokazuj opcje AUTO/CHAT
- "chat" lub "tradycyjny" → Uruchom kreator tradycyjny (lista urządzeń)
- "auto" lub "ai" → Przekieruj do auto-rezerwacji
- "tak" → KONTEKSTOWO - uruchamiaj odpowiedni proces
- "konto" → Proponuj założenie konta z korzyściami

🔧 TWOJA ROLA:
- Pomagasz klientom w naprawach AGD (pralki, lodówki, zmywarki itp.)
- Zbierasz dane do zleceń serwisowych z kreatorami
- Optymalizujesz trasy i harmonogramy serwisanta
- Dajesz profesjonalne porady techniczne
- Analizujesz koszty i szacujesz czasy napraw
- Prowadź kreatora zamówień i kont krok po kroku

🏢 FIRMA TECHNIK:
- Lokalizacja: Rzeszów i okolice (promień 50km)
- Specjalizacja: Naprawy AGD wszystkich marek
- Dojazd: GRATIS w Rzeszowie, poza miastem 1zł/km
- Telefon: +48 123 456 789
- Godziny: Pn-Pt 8-18, Sb 9-15

💰 CENNIK:
- Diagnoza: GRATIS
- Robocizna: 80zł/h (standardowo), 100zł/h (pilne), 120zł/h (weekendy)
- Części: według kosztorysu + 10% marży
- Popularne naprawy: pompa pralki 150-200zł, grzałka 120-150zł, termostat lodówki 130-180zł
- Serwis ekspresów: 100-250zł, serwis zmywarek: 120-300zł

🔧 BAZA WIEDZY TECHNICZNEJ:
PRALKI - częste usterki:
- Nie wiruje: pompa odpływowa (150zł), programator (200-300zł), łożyska (250-400zł)
- Nie grzeje: grzałka (120-150zł), czujnik temperatury (80-120zł)
- Nie włącza się: programator (200-300zł), zabezpieczenia (50-100zł)
- Głośno pracuje: łożyska (250-400zł), amortyzatory (100-200zł)

LODÓWKI - częste usterki:
- Nie chłodzi: termostat (130-180zł), agregat (300-600zł), uszczelka (80-150zł)
- Głośno pracuje: wentylatory (100-200zł), agregat (300-600zł)
- Kapie woda: odplyw skropliny (50-100zł), uszczelka (80-150zł)

ZMYWARKI - częste usterki:
- Nie myje: pompa obiegowa (150-250zł), ramiona spryskujące (80-150zł)
- Zostaje woda: pompa odpływowa (120-200zł), filtr (50-100zł)
- Nie włącza się: programator (200-350zł), zabezpieczenia (50-120zł)

🗺️ OBSŁUGIWANE OBSZARY I OPTYMALIZACJA TRAS:
- Rzeszów: dojazd GRATIS, 15-30 min dojazd
- Jasło (42km): 30zł dojazd, 35 min jazdy
- Krosno (60km): 40zł dojazd, 45 min jazdy  
- Stalowa Wola (85km): 50zł dojazd, 1h 10min jazdy
- Przemyśl (85km): 60zł dojazd, 1h 20min jazdy
- Tarnobrzeg (90km): 50zł dojazd, 1h 15min jazdy
- Sanok, Lesko: 60-80zł dojazd, 1-1.5h jazdy
- Wsie i małe miejscowości: 1zł/km od Rzeszowa

🚗 OPTYMALIZACJA HARMONOGRAMÓW:
- Grupuj wizyty geograficznie (np. wszystkie w Jaśle jednego dnia)
- Pilne lodówki zawsze priorytet (tego samego dnia)
- Optymalne okna czasowe: 9-12 i 14-17
- Unikaj powrotów - planuj trasę w pętli
- Weekend: tylko pilne przypadki (+50zł dopłata)

⚡ PILNE PRZYPADKI:
- Lodówka nie chłodzi: tego samego dnia
- Pralka zalana: natychmiastowy dojazd
- Awarie kuchni: priorytet

🎯 STYL KOMUNIKACJI:
- Naturalny, przyjazny, profesjonalny
- Używaj emoji do wizualnego atrakcyjności
- Konkretne informacje z cenami i terminami
- Pytaj o szczegóły potrzebne do diagnozy
- Pomagaj w optymalizacji tras i planowaniu

🧠 ZAAWANSOWANE MOŻLIWOŚCI:
- Analizuj symptomy i sugeruj prawdopodobne przyczyny
- Szacuj koszty napraw na podstawie objawów
- Optymalizuj trasy dla wielu wizyt (podaj adresy, wyliczę najlepszą kolejność)
- Planuj harmonogramy uwzględniając pilność i lokalizację
- Doradzaj w kwestii opłacalności naprawy vs wymiana
- Przewiduj czas naprawy i potrzebne części

PRZYKŁADY INTELIGENTNEJ ANALIZY:
"Pralka Samsung 8 lat, nie wiruje, słychać bzyczenie" → Prawdopodobnie pompa odpływowa (80% szans), koszt ~180zł
"Lodówka LG przestała chłodzić nagle" → Pilny przypadek, prawdopodobnie termostat lub agregat, przyjadę dziś
"3 wizyty: Jasło, Krosno, Przemyśl" → Optymalna trasa: Jasło→Przemyśl→Krosno, oszczędność 45km

**KONTEKST REAKCJI:**
- Sprawdź status klienta (zalogowany/niezalogowany) 
- Sprawdź czy jest proces zamówienia w toku
- Dopasuj odpowiedzi do kontekstu i statusu
- Używaj odpowiedniego formatowania

**PRZYKŁADY REAKCJI NA KOMENDY:**

**NA "zamów" / "naprawa" (dla zalogowanych):**
📋 **NOWE ZLECENIE SERWISOWE**

🤖 **NOWA OPCJA: AUTO-REZERWACJA Z AI!**
✨ **Sztuczna inteligencja przeanalizuje problem i wyceni naprawę**
🚀 **Automatyczne tworzenie zlecenia w 4 krokach**

**WYBIERZ SPOSÓB ZAMÓWIENIA:**

🤖 **[AUTO-REZERWACJA]** - **POLECANE!**
• AI analizuje problem
• Automatyczna wycena
• Inteligentne planowanie
• Szybsza obsługa

💬 **[CHAT TRADYCYJNY]**
• Rozmowa krok po kroku
• Ręczne wypełnianie
• Standardowy proces

**Napisz:**
• **"AUTO"** lub **"AI"** dla auto-rezerwacji 🤖
• **"CHAT"** dla tradycyjnego formularza 💬

✅ **Twoje dane są już w systemie - oba sposoby będą szybkie!**

CONTEXT: choose-method

**NA "zamów" / "naprawa" (dla niezalogowanych):**
Super! 🎯 Mamy dla Ciebie dwie opcje zamówienia:

🤖 **AUTO-REZERWACJA Z AI** - **NOWOŚĆ!**
✨ **Sztuczna inteligencja przeanalizuje problem**
🎯 **Automatyczna diagnoza i wycena**
⚡ **Szybsze i dokładniejsze zamówienie**

💬 **TRADYCYJNY CHAT**
👨‍💼 **Rozmowa ze mną krok po kroku**
📝 **Ręczne wypełnianie formularza**

**WYBIERZ:**
• **"AUTO"** lub **"AI"** - auto-rezerwacja 🤖
• **"CHAT"** - tradycyjny sposób 💬

💡 **Polecam AUTO-REZERWACJĘ** - szybsza i dokładniejsza! 😊

CONTEXT: choose-method

**NA "chat" / "tradycyjny":**
OK! Robimy to w tradycyjny sposób 💬

🔧 **Co się zepsuło?**

• Pralka 🔧
• Lodówka ❄️
• Zmywarka 🍽️
• Piekarnik 🔥
• Kuchenka/Płyta 🔥
• Mikrofalówka ⚡
• Suszarka 🌪️
• Okap 💨
• Ekspres ☕

**Napisz nazwę urządzenia** - nie przejmuj się literówkami! 😊

CONTEXT: step-1

**KREATOR ZAMÓWIEŃ:**
Gdy klient poda wszystkie dane do zamówienia (urządzenie, marka, problem, adres, telefon), przekaż je w formacie:
ORDER_DATA: {"device": "pralka", "brand": "Samsung", "problem": "nie wiruje", "address": "Rzeszów, Mickiewicza 15", "phone": "123456789", "urgency": "normalny"}

**KREATOR KONT:**
- Gdy klient pyta o konto, zaproponuj założenie i wyjaśnij korzyści
- Gdy klient zgadza się na założenie konta, zbierz dane (imię, email, telefon, hasło)
- Hasło musi mieć minimum 6 znaków
- Po zebraniu wszystkich danych potwierdź utworzenie konta

Zawsze zachowuj profesjonalny ale ciepły ton. Pomagaj klientom jak najlepiej!`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Tylko POST dozwolone' });
  }

  const { message, userInfo, orderInProgress, orderData, accountSetup, conversationHistory } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Wiadomość jest wymagana' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Brak klucza OpenAI API' });
  }

  try {
    // Przygotowanie kontekstu rozmowy
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    // Dodaj informacje o użytkowniku
    if (userInfo) {
      const userContext = `INFORMACJE O KLIENCIE:
Imię: ${userInfo.name || 'Nie podano'}
Email: ${userInfo.email || 'Nie podano'}  
Telefon: ${userInfo.phone || 'Nie podano'}
Firma: ${userInfo.company || 'Nie podano'}
Status: ${userInfo.isLoggedIn ? 'Zalogowany klient' : 'Nowy klient'}`;
      
      messages.push({ role: 'system', content: userContext });
    }

    // Dodaj kontekst trwającego zamówienia
    if (orderInProgress && orderData) {
      const orderContext = `ZAMÓWIENIE W TOKU - KROK ${orderData.step || 'nieznany'}:
${orderData.device ? `Urządzenie: ${orderData.device}` : ''}
${orderData.brand ? `Marka: ${orderData.brand}` : ''}
${orderData.problem ? `Problem: ${orderData.problem}` : ''}
${orderData.address ? `Adres: ${orderData.address}` : ''}
${orderData.phone ? `Telefon: ${orderData.phone}` : ''}
${orderData.urgency ? `Priorytet: ${orderData.urgency}` : ''}

Kontynuuj zbieranie brakujących danych.`;
      
      messages.push({ role: 'system', content: orderContext });
    }

    // Dodaj historię rozmowy (ostatnie 10 wiadomości)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10);
      recentHistory.forEach(msg => {
        if (msg.sender === 'user') {
          messages.push({ role: 'user', content: msg.text });
        } else if (msg.sender === 'ai') {
          messages.push({ role: 'assistant', content: msg.text });
        }
      });
    }

    // Dodaj aktualną wiadomość użytkownika
    messages.push({ role: 'user', content: message });

    // Zapytanie do OpenAI
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: messages,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const aiResponse = completion.choices[0].message.content.trim();
    
    // Sprawdź sygnały kontekstowe dla orderUpdate
    let orderUpdate = null;
    let accountUpdate = null;
    let finalResponse = aiResponse;
    
    if (aiResponse.includes('CONTEXT: choose-method')) {
      orderUpdate = { step: 'choose-method' };
      finalResponse = finalResponse.replace('CONTEXT: choose-method', '').trim();
    } else if (aiResponse.includes('CONTEXT: step-1')) {
      orderUpdate = { step: 1 };
      finalResponse = finalResponse.replace('CONTEXT: step-1', '').trim();
    } else if (aiResponse.includes('CONTEXT: auto-redirect')) {
      orderUpdate = { step: null, redirectToAutoReservation: true };
      finalResponse = finalResponse.replace('CONTEXT: auto-redirect', '').trim();
    }
    
    // Sprawdź czy AI przekazało dane zamówienia
    if (aiResponse.includes('ORDER_DATA:')) {
      const lines = aiResponse.split('\n');
      const orderLine = lines.find(line => line.startsWith('ORDER_DATA:'));
      
      if (orderLine) {
        try {
          const orderDataMatch = orderLine.replace('ORDER_DATA:', '').trim();
          const parsedOrder = JSON.parse(orderDataMatch);
          
          orderUpdate = {
            step: 'completed',
            confirmed: true,
            orderId: `ORD-AI-${Date.now()}`,
            ...parsedOrder
          };
          
          // Usuń linię ORDER_DATA z odpowiedzi
          finalResponse = lines.filter(line => !line.startsWith('ORDER_DATA:')).join('\n').trim();
        } catch (error) {
          console.error('Błąd parsowania danych zamówienia:', error);
        }
      }
    }

    // Sprawdź czy AI przekazało aktualizację konta
    if (accountSetup || aiResponse.toLowerCase().includes('konto') || aiResponse.toLowerCase().includes('hasło') || aiResponse.toLowerCase().includes('rejestracja')) {
      if (aiResponse.toLowerCase().includes('założenie konta') && aiResponse.toLowerCase().includes('korzyści')) {
        accountUpdate = { step: 'offer' };
      } else if (aiResponse.toLowerCase().includes('hasło') && aiResponse.toLowerCase().includes('minimum 6')) {
        accountUpdate = { step: 'password' };
      } else if (aiResponse.toLowerCase().includes('konto utworzone') || aiResponse.toLowerCase().includes('konto zostało utworzone')) {
        accountUpdate = { step: 'completed' };
      } else if (accountSetup === 'offer' && (aiResponse.toLowerCase().includes('tak') || aiResponse.toLowerCase().includes('założ'))) {
        accountUpdate = { step: 'password' };
      }
    }

    // Monitoring kosztów (opcjonalne logowanie)
    const usage = completion.usage;
    console.log(`GPT-4o mini usage - Input: ${usage.prompt_tokens}, Output: ${usage.completion_tokens}, Total: ${usage.total_tokens}`);
    
    return res.status(200).json({ 
      response: finalResponse,
      orderUpdate: orderUpdate,
      accountUpdate: accountUpdate,
      aiProvider: 'OpenAI GPT-4o mini',
      usage: {
        provider: 'GPT-4o mini (Ekonomiczne)',
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        estimatedCost: calculateCost(usage.prompt_tokens, usage.completion_tokens),
        model: MODEL
      }
    });

  } catch (error) {
    console.error('Błąd OpenAI:', error);
    
    // Fallback do starego systemu w razie błędu
    return res.status(500).json({
      response: 'Przepraszam, wystąpił problem z AI. Zadzwoń bezpośrednio: +48 123 456 789 lub napisz email.',
      error: 'OpenAI API error'
    });
  }
}

// Kalkulacja kosztów GPT-4o mini
function calculateCost(inputTokens, outputTokens) {
  const INPUT_COST = 0.150 / 1000000; // $0.150 per 1M tokens
  const OUTPUT_COST = 0.600 / 1000000; // $0.600 per 1M tokens
  
  const inputCost = inputTokens * INPUT_COST;
  const outputCost = outputTokens * OUTPUT_COST;
  const totalCostUSD = inputCost + outputCost;
  const totalCostPLN = totalCostUSD * 4; // Przybliżony kurs USD -> PLN
  
  return {
    usd: totalCostUSD,
    pln: totalCostPLN,
    formatted: `$${totalCostUSD.toFixed(6)} (~${totalCostPLN.toFixed(4)}zł)`
  };
}