// pages/api/chat-ai.js - PROSTY chat dla zwykłych ludzi

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Tylko POST dozwolone' });
  }

  const { message, userInfo, orderInProgress, orderData, accountSetup } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Wiadomość jest wymagana' });
  }

  try {
    const response = getBotResponse(message.toLowerCase(), userInfo, orderInProgress, orderData, accountSetup);
    return res.status(200).json({ 
      response: response.message,
      orderUpdate: response.orderUpdate || null,
      accountUpdate: response.accountUpdate || null
    });
  } catch (error) {
    console.error('Błąd chat:', error);
    return res.status(200).json({
      response: 'Przepraszam, wystąpił problem. Zadzwoń: +48 123 456 789'
    });
  }
}

// PROSTY BOT - jak rozmawiałby normalny człowiek
function getBotResponse(message, userInfo, orderInProgress, orderData, accountSetup) {
  const name = userInfo?.name ? userInfo.name.split(' ')[0] : '';
  
  // PROCES ZAKŁADANIA KONTA
  if (accountSetup) {
    return handleAccountProcess(message, name, userInfo, accountSetup);
  }
  
  // PROCES ZAMÓWIENIA SERWISU
  if (orderInProgress && orderData) {
    return handleOrderProcess(message, name, orderData);
  }
  
  // ZAŁOŻENIE KONTA
  if (message.toLowerCase().includes('załóż konto') || message.toLowerCase().includes('zaloz konto') || 
      message.toLowerCase().includes('konto') || message.toLowerCase().includes('rejestracja') ||
      message.toLowerCase().includes('zarejestruj')) {
    return { 
      message: `Świetnie ${name}! 🎉 Założenie konta daje Ci wiele korzyści:\n\n✅ **KORZYŚCI KONTA:**\n📋 **Historia napraw** - dostęp do wszystkich wcześniejszych zleceń\n⚡ **Szybsze zamawianie** - zapisane dane kontaktowe\n🔔 **Powiadomienia** - SMS o statusie naprawy\n💰 **Rabaty stałego klienta** - zniżki na kolejne naprawy\n📊 **Panel klienta** - podgląd kosztów i terminów\n\n🎯 **KREATOR KONTA:**\n**Kliknij przycisk "👤 Załóż konto"** poniżej czatu - otworzy się wygodny kreator!\n\n🔐 **SZYBKI SPOSÓB (tutaj w czacie):**\n• Napisz **"TAK"** żeby założyć przez chat\n• **"PÓŹNIEJ"** żeby założyć po naprawie\n\n💡 *Kreator jest wygodniejszy - polecam!* 😊`,
      accountUpdate: { step: 'offer' },
      openWizard: true
    };
  }
  
  // PODSTAWOWE PYTANIA O NAPRAWĘ
  if (message.includes('kiedy') && (message.includes('przyjdzie') || message.includes('może') || message.includes('termin'))) {
    return { message: `Cześć ${name}! 😊 Mogę przyjechać:\n\n⏰ **Dziś:** 15:00-17:00 ✅\n⏰ **Jutro:** 9:00-12:00 lub 14:00-17:00\n⏰ **Pojutrze:** 8:00-11:00\n\nKtóry termin Ci pasuje?\n📞 Możesz też zadzwonić: +48 123 456 789` };
  }

  if (message.includes('ile') && (message.includes('koszt') || message.includes('zapłac') || message.includes('kosztuje'))) {
    return { message: `${name}, koszt zależy od usterki:\n\n💰 **Dojazd:** GRATIS (w promocji!)\n💰 **Diagnoza:** GRATIS\n💰 **Naprawa:** zazwyczaj 100-250zł\n\n🔧 Dopiero po obejrzeniu powiem dokładną cenę. Czy to OK?\n📞 Tel: +48 123 456 789` };
  }

  // ZAMÓWIENIE NAPRAWY - START PROCESU Z OPCJĄ AUTO-REZERWACJI
  if (message.includes('chcę') || message.includes('potrzebuję') || message.includes('zamów')) {
    // Sprawdź czy użytkownik jest zalogowany
    const isLoggedIn = userInfo && userInfo.isLoggedIn;
    
    if (isLoggedIn) {
      // Wiadomość dla zalogowanych użytkowników z opcją AI
      return {
        message: `📋 **NOWE ZLECENIE SERWISOWE**\n\n🤖 **NOWA OPCJA: AUTO-REZERWACJA Z AI!**\n✨ **Sztuczna inteligencja przeanalizuje problem i wyceni naprawę**\n🚀 **Automatyczne tworzenie zlecenia w 4 krokach**\n\n**WYBIERZ SPOSÓB ZAMÓWIENIA:**\n\n🤖 **[AUTO-REZERWACJA]** - **POLECANE!**\n• AI analizuje problem\n• Automatyczna wycena\n• Inteligentne planowanie\n• Szybsza obsługa\n\n� **[CHAT TRADYCYJNY]**\n• Rozmowa krok po kroku\n• Ręczne wypełnianie\n• Standardowy proces\n\n**Napisz:**\n• **"AUTO"** lub **"AI"** dla auto-rezerwacji 🤖\n• **"CHAT"** dla tradycyjnego formularza 💬\n\n✅ **Twoje dane są już w systemie - oba sposoby będą szybkie!**`,
        orderUpdate: { step: 'choose-method' },
        showAutoReservationButton: true
      };
    } else {
      // Wiadomość dla niezalogowanych użytkowników
      return {
        message: `Super ${name}! 🎯 Mamy dla Ciebie dwie opcje zamówienia:\n\n🤖 **AUTO-REZERWACJA Z AI** - **NOWOŚĆ!**\n✨ **Sztuczna inteligencja przeanalizuje problem**\n🎯 **Automatyczna diagnoza i wycena**\n⚡ **Szybsze i dokładniejsze zamówienie**\n\n💬 **TRADYCYJNY CHAT**\n👨‍💼 **Rozmowa ze mną krok po kroku**\n📝 **Ręczne wypełnianie formularza**\n\n**WYBIERZ:**\n• **"AUTO"** lub **"AI"** - auto-rezerwacja 🤖\n• **"CHAT"** - tradycyjny sposób 💬\n\n💡 **Polecam AUTO-REZERWACJĘ** - szybsza i dokładniejsza! 😊`,
        orderUpdate: { step: 'choose-method' },
        showAutoReservationButton: true
      };
    }
  }

  // OBSŁUGA WYBORU METODY ZAMÓWIENIA
  if (orderInProgress && orderData?.step === 'choose-method') {
    if (message.toLowerCase().includes('auto') || message.toLowerCase().includes('ai')) {
      return {
        message: `Świetny wybór ${name}! 🤖\n\n🚀 **PRZEKIEROWUJĘ DO AUTO-REZERWACJI**\n\n✨ **Co Cię czeka:**\n• Inteligentna analiza problemu\n• Automatyczna diagnoza AI\n• Precyzyjna wycena kosztów\n• Szybkie utworzenie zlecenia\n\n**Kliknij przycisk "🤖 Auto-Rezerwacja"** poniżej lub przejdź na stronę auto-rezerwacji!\n\n📱 **Link:** /auto-rezerwacja\n\n💡 *System wypełni dane automatycznie jeśli jesteś zalogowany*`,
        orderUpdate: { step: null },
        redirectToAutoReservation: true
      };
    } else if (message.toLowerCase().includes('chat') || message.toLowerCase().includes('tradycyjny')) {
      return {
        message: `OK ${name}! Robimy to w tradycyjny sposób 💬\n\n🔧 **Co się zepsuło?**\n\n• Pralka 🔧\n• Lodówka ❄️\n• Zmywarka 🍽️\n• Piekarnik 🔥\n• Kuchenka/Płyta 🔥\n• Mikrofalówka ⚡\n• Suszarka 🌪️\n• Okap 💨\n• Ekspres ☕\n\n**Napisz nazwę urządzenia** - nie przejmuj się literówkami! 😊`,
        orderUpdate: { step: 1 }
      };
    } else {
      return {
        message: `${name}, wybierz jedną z opcji:\n\n🤖 **"AUTO"** - auto-rezerwacja z AI (POLECANE!)\n💬 **"CHAT"** - tradycyjny formularz\n\n💡 *Auto-rezerwacja jest szybsza i dokładniejsza dzięki AI!*`,
        orderUpdate: { step: 'choose-method' }
      };
    }
  }

  // ROZPOZNAWANIE URZĄDZEŃ Z OBSŁUGĄ LITERÓWEK
  const normalizeText = (text) => {
    return text.toLowerCase().replace(/[ąćęłńóśźż]/g, (char) => {
      const map = {'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z'};
      return map[char] || char;
    });
  };
  
  const normalizedMessage = normalizeText(message);

  // PRALKA - z obsługą literówek
  if (normalizedMessage.match(/(pralka|pralk|pralke|pralki|pralko|pralkę)/)) {
    if (message.includes('nie') && (message.includes('wiruje') || message.includes('suszy') || message.includes('odpompowywa'))) {
      return { message: `Rozumiem ${name} - pralka nie wiruje? 🔧\n\nTo częsta usterka, zazwyczaj:\n• Zatkany filtr (50zł za czyszczenie)\n• Uszkodzona pompa (150zł + części)\n• Problem z programatorem (200zł)\n\nPotrzebne 1-2 godziny na naprawę.\n\n📍 **Gdzie jesteś?** Mogę przyjechać dziś po 15:00\n\n🎯 **Chcesz zamówić naprawę?** Napisz "zamów"` };
    }
    return { message: `${name}, z pralką problem? 🔧\n\nCo dokładnie się dzieje?\n• Nie włącza się?\n• Nie grzeje wody?\n• Głośno pracuje?\n• Nie wiruje?\n\nNapisz mi, a powiem od razu co może być 😊\n\n🎯 **Chcesz od razu zamówić naprawę?** Napisz "zamów"` };
  }

  // LODÓWKA - z obsługą literówek
  if (normalizedMessage.match(/(lodowka|lodówka|chlodziarka|chlodziar|frigo)/)) {
    if (message.includes('nie chłodzi') || message.includes('za ciepłe') || message.includes('popsut')) {
      return { message: `O nie ${name}! Lodówka nie chłodzi? ❄️\n\nTo pilne - jedzenie się psuje!\n\n🚨 **Mogę przyjechać DZIŚ do 18:00**\n\n⚡ Najczęściej to:\n• Termostat (100-150zł)\n• Problem z agregatem (200-400zł)\n• Uszczelka drzwi (80-120zł)\n\n📞 **DZWOŃ TERAZ:** +48 123 456 789\n\n🎯 **Chcesz zamówić naprawę?** Napisz "zamów"` };
    }
    return { message: `Lodówka robi problemy ${name}? ❄️\n\nCo się dzieje?\n• Nie chłodzi?\n• Głośno pracuje?\n• Kapie woda?\n• Miga lampka?\n\nNapisz więcej a pomogę! 😊\n\n🎯 **Chcesz od razu zamówić naprawę?** Napisz "zamów"` };
  }

  // ZMYWARKA - z obsługą literówek
  if (normalizedMessage.match(/(zmywarka|zmywar|zmywarke|zmywarką)/)) {
    return { message: `Zmywarka nie działa ${name}? 🍽️\n\nCo robi:\n• Nie myje dobrze?\n• Zostaje woda na dole?\n• Nie włącza się?\n• Dziwnie pachnie?\n\nTe rzeczy naprawiam szybko - zazwyczaj 1 wizyta wystarczy! 💪\n\n🎯 **Chcesz zamówić naprawę?** Napisz "zamów"` };
  }

  // PIEKARNIK - z obsługą literówek
  if (normalizedMessage.match(/(piekarnik|piekarn|piekar|oven|spiritual)/)) {
    return { message: `${name}, piekarnik nie działa? 🔥\n\nCo się dzieje?\n• Nie grzeje?\n• Nie włącza się?\n• Pali się lampka błędu?\n• Problem z termostatem?\n\nPiekarniki to moja specjalność! 💪\n\n🎯 **Chcesz zamówić naprawę?** Napisz "zamów"` };
  }

  // KUCHENKA/PŁYTA - z obsługą literówek
  if (normalizedMessage.match(/(kuchenka|plyta|palnik|gaz|indukcja)/)) {
    return { message: `${name}, kuchenka/płyta nie działa? 🔥\n\nCo się dzieje?\n• Palniki nie zapalają?\n• Nie grzeje?\n• Iskra nie działa?\n• Problem z gazem?\n\nTe rzeczy szybko naprawiam! 🔧\n\n🎯 **Chcesz zamówić naprawę?** Napisz "zamów"` };
  }

  // MIKROFALÓWKA - z obsługą literówek
  if (normalizedMessage.match(/(mikrofalowka|mikrofala|mikro|microwave)/)) {
    return { message: `${name}, mikrofalówka szwankuje? ⚡\n\nCo robi:\n• Nie grzeje?\n• Nie włącza się?\n• Dziwnie brzmi?\n• Iskrzy w środku?\n\nMikrofalówki naprawiam często! 💪\n\n🎯 **Chcesz zamówić naprawę?** Napisz "zamów"` };
  }

  // EKSPRES DO KAWY - z obsługą literówek
  if (normalizedMessage.match(/(ekspres|kawa|coffee|espresso)/)) {
    return { message: `${name}, ekspres nie parzy kawy? ☕\n\nCo się dzieje?\n• Nie włącza się?\n• Nie parzy?\n• Kapie?\n• Błąd na wyświetlaczu?\n\nEkspresy to moja pasja - uratuje Twoją kawę! 😊\n\n🎯 **Chcesz zamówić naprawę?** Napisz "zamów"` };
  }

  // POWITANIA
  if (message.includes('cześć') || message.includes('dzień dobry') || message.includes('hej')) {
    const greetings = [
      `Cześć ${name}! 😊 W czym mogę pomóc? Coś się zepsuło?`,
      `Hej ${name}! 👋 Masz jakiś problem z AGD?`,
      `Dzień dobry ${name}! ☀️ Co mogę dla Ciebie naprawić?`
    ];
    return { message: greetings[Math.floor(Math.random() * greetings.length)] };
  }

  // PYTANIE O FIRMĘ
  if (message.includes('kim jesteś') || message.includes('o sobie') || message.includes('firma')) {
    return { message: `Cześć ${name}! Jestem Marek z firmy TECHNIK 😊\n\n🔧 **Naprawiam:** pralki, lodówki, zmywarki, piekarniki, kuchenki, mikrofalówki\n📍 **Gdzie:** Rzeszów i okolice\n⏰ **Od:** 15 lat na rynku\n⭐ **Opinie:** 98% zadowolonych klientów\n\n👨‍🔧 Jestem uczciwy - nie naprawiam co nie trzeba!\n📞 **Pogadajmy:** +48 123 456 789` };
  }

  // SZCZEGÓŁOWE INFORMACJE O SPRZĘCIE
  if (normalizedMessage.match(/(jaki sprzet|co naprawia|agd|urzadzenia|sprzet|co robisz|naprawa)/)) {
    return { message: `${name}, naprawiam praktycznie wszystkie AGD! 🔧\n\n**🏠 DUŻY SPRZĘT AGD:**\n• Pralki (wszystkie marki) 🔧\n• Lodówki i zamrażarki ❄️\n• Zmywarki 🍽️\n• Piekarniki i духовки 🔥\n• Kuchenki gazowe/indukcyjne 🔥\n• Suszarki 🌪️\n• Okapy kuchenne 💨\n\n**⚡ MAŁE AGD:**\n• Mikrofalówki ⚡\n• Ekspresy do kawy ☕\n• Czajniki elektryczne\n• Tostery\n• Roboty kuchenne\n\n**🔧 SPECJALIZACJA:**\n• Naprawy elektroniki\n• Wymiana części\n• Modernizacja starszych urządzeń\n\n**📞 Zadzwoń:** +48 123 456 789` };
  }

  // LOKALIZACJE I OBSZAR DZIAŁANIA
  if (normalizedMessage.match(/(gdzie|miejscowosc|dojazd|obsluguj|lokalizacja|miasto|rzeszow)/)) {
    return { message: `${name}, obsługuję duży obszar! 🚗\n\n**🎯 GŁÓWNE MIASTA:**\n• **Rzeszów** - dojazd GRATIS! 🎁\n• Jasło - 30zł dojazd\n• Krosno - 40zł dojazd\n• Stalowa Wola - 50zł dojazd\n• Tarnobrzeg - 50zł dojazd\n• Przemyśl - 60zł dojazd\n\n**🏘️ OKOLICE:**\n• Wszystkie wsie w promieniu 50km od Rzeszowa\n• Małe miasta i gminy\n• Dojazd ustalamy indywidualnie\n\n**⏰ CZAS DOJAZDU:**\n• Rzeszów: 30 min od telefonu\n• Pozostałe miasta: następny dzień\n\n**📞 Umów wizytę:** +48 123 456 789\n\nPowiedz gdzie jesteś a wyliczę koszt dojazdu! 😊` };
  }

  // GODZINY PRACY I DOSTĘPNOŚĆ
  if (normalizedMessage.match(/(godziny|dostepny|kiedy pracuj|otwarte|o ktorej|czas pracy)/)) {
    return { message: `${name}, jestem bardzo elastyczny z godzinami! ⏰\n\n**🕐 STANDARDOWE GODZINY:**\n• **Poniedziałek-Piątek:** 8:00-18:00\n• **Sobota:** 9:00-15:00\n• **Niedziela:** tylko pilne przypadki\n\n**🚨 SYTUACJE PILNE:**\n• Lodówka nie chłodzi: przyjadę tego samego dnia!\n• Pralka zalana: natychmiastowy dojazd\n• Dostępny 24/7 dla stałych klientów\n\n**� ELASTYCZNOŚĆ:**\n• Mogę przyjechać wieczorem (do 20:00)\n• Weekendy za dopłatą +50zł\n• Święta: tylko awarie\n\n**⚡ NAJSZYBCIEJ:**\n• Rzeszów: mogę być za 30 min\n• Inne miasta: umówimy na jutro\n\n**�📞 Dzwoń:** +48 123 456 789\nNawet wieczorem odbieram! 😊` };
  }

  // SZCZEGÓŁOWY CENNIK
  if (normalizedMessage.match(/(cennik|ceny|kosztuje|place|ile kosztuje|cena|drogo)/)) {
    return { message: `${name}, mam uczciwe ceny! 💰\n\n**🎁 GRATIS:**\n• Dójazd w Rzeszowie\n• Diagnoza problemu\n• Wycena naprawy\n\n**🔧 ROBOCIZNA:**\n• Standardowa: 80zł/godz\n• Pilna (tego samego dnia): 100zł/godz\n• Weekend/święta: 120zł/godz\n\n**⚙️ POPULARNE NAPRAWY:**\n• Pompa pralki: 150-200zł + część\n• Grzałka pralki: 120-150zł + część\n• Termostat lodówki: 130-180zł + część\n• Filtr zmywarki: 80-120zł + część\n• Programator: 200-300zł + część\n\n**🚚 DOJAZDY:**\n• Rzeszów: GRATIS\n• Do 30km: 30zł\n• Do 50km: 50zł\n• Powyżej 50km: 1zł/km\n\n**💸 FORMY PŁATNOŚCI:**\n• Gotówka, karta, BLIK\n• Faktura VAT możliwa\n\n**📞 Konkretna wycena:** +48 123 456 789` };
  }

  // DOMYŚLNE ODPOWIEDZI
  const isLoggedIn = userInfo && userInfo.isLoggedIn;
  
  if (isLoggedIn) {
    // Odpowiedzi dla zalogowanych użytkowników
    const loggedDefaults = [
      `🔧 **W czym mogę Ci pomóc, ${name}?**\n\n📋 **Dostępne opcje:**\n• **"zamów naprawę"** - nowe zlecenie serwisowe\n• **"historia"** - poprzednie naprawy\n• **"cennik"** - aktualne ceny usług\n• **"kontakt"** - informacje kontaktowe\n\n💡 *Twoje dane są już w systemie - zamówienie będzie szybsze!*`,
      `Dzień dobry ${name}! 👋\n\n🎯 **Panel klienta jest aktywny**\n\n📞 **Szybkie akcje:**\n• Napisz **"naprawa"** - zamów serwis\n• **"faktury"** - dokumenty księgowe\n• **"ustawienia"** - zarządzanie kontem\n\n✅ **Jako zalogowany klient masz priorytet w obsłudze!**`,
      `Witaj ${name}! 😊\n\n💼 **Panel klienta dostępny**\n\n🔧 **Co dzisiaj potrzebujesz?**\n• Nowe zlecenie serwisowe\n• Sprawdzenie statusu naprawy\n• Informacje o cenach\n• Zarządzanie kontem\n\n⚡ **Zalogowani klienci mają szybszą obsługę!**`
    ];
    return { message: loggedDefaults[Math.floor(Math.random() * loggedDefaults.length)] };
  } else {
    // Odpowiedzi dla niezalogowanych użytkowników
    const defaults = [
      `Cześć ${name}! 😊 Jestem serwisantem AGD. Co się zepsuło?\n\n🔧 Naprawiam: pralki, lodówki, zmywarki\n📞 Telefon: +48 123 456 789`,
      `Hej ${name}! Masz problem z AGD? 🛠️\n\nPowiedz mi:\n• Co się zepsuło?\n• Gdzie mieszkasz?\n• Kiedy Ci pasuje?\n\nI od razu się umówimy! 😊`,
      `${name}, potrzebujesz naprawy? 🎯\n\n✅ Szybko, uczciwie, tanio\n✅ Gwarancja na naprawę\n✅ Dojazd GRATIS w promocji\n\n📞 Zadzwoń: +48 123 456 789`
    ];
    return { message: defaults[Math.floor(Math.random() * defaults.length)] };
  }
}

// OBSŁUGA PROCESU ZAKŁADANIA KONTA
function handleAccountProcess(message, name, userInfo, accountSetup) {
  // Krok 1: Potwierdzenie chęci założenia konta
  if (accountSetup === 'offer' && message.toLowerCase().includes('tak')) {
    return {
      message: `Świetnie ${name}! 🎯 Zakładam Twoje konto...\n\n📝 **DANE DO KONTA:**\n• **Imię:** ${userInfo?.name || 'Potrzebuję Twoje imię'}\n• **Email:** ${userInfo?.email || 'Potrzebuję Twój email'}\n• **Telefon:** ${userInfo?.phone || 'Podaj numer telefonu'}\n\n🔐 **OSTATNI KROK:**\nWymyśl hasło (minimum 6 znaków):\n\n**Napisz swoje hasło:** 🔒\n\n💡 *Bezpieczne hasło powinno zawierać litery i cyfry*`,
      accountUpdate: { step: 'password' }
    };
  }
  
  // Krok 2: Wpisanie hasła
  if (accountSetup === 'password' && message.length >= 6 && !message.includes(' ')) {
    const accountId = `ACC${Date.now()}`;
    return {
      message: `🎉 **KONTO ZAŁOŻONE POMYŚLNIE!** 🎉\n\n✅ **Twoje dane:**\n👤 **Nazwa użytkownika:** ${userInfo?.name?.toLowerCase().replace(' ', '.') || 'user'}\n📧 **Email:** ${userInfo?.email || 'email@example.com'}\n🆔 **ID konta:** ${accountId}\n\n📱 **CO DALEJ:**\n• Na email wysłałem link aktywacyjny\n• Kliknij link żeby aktywować konto\n\n✨ **GRATULACJE ${name.toUpperCase()}!**\n\n🔐 **CHCESZ SIĘ TERAZ ZALOGOWAĆ?**\n• Napisz **"ZALOGUJ"** żeby się zalogować\n• **"PÓŹNIEJ"** żeby zalogować się później\n\n💡 *Po zalogowaniu będziesz mieć dostęp do panelu klienta!*`,
      accountUpdate: { step: 'ask-login', accountId: accountId, password: message }
    };
  }

  // Krok 3: Pytanie o logowanie po założeniu konta
  if (accountSetup === 'ask-login') {
    if (message.toLowerCase().includes('zaloguj') || message.toLowerCase().includes('tak')) {
      return {
        message: `Świetnie ${name}! 🎯 Loguję Cię do systemu...\n\n🔐 **LOGOWANIE W TOKU:**\n• Sprawdzam dane logowania...\n• Aktywuję sesję użytkownika...\n• Ładuję panel klienta...\n\n✅ **ZALOGOWANO POMYŚLNIE!**\n\n🎉 **Witaj w panelu klienta!**\n📋 **Dostępne opcje:**\n• Historia napraw\n• Nowe zamówienie serwisu\n• Ustawienia konta\n• Faktury i płatności\n\n💬 **Co chcesz zrobić?**\n• "zamów naprawę" - nowe zlecenie\n• "historia" - poprzednie naprawy\n• "ustawienia" - zarządzanie kontem`,
        accountUpdate: { step: 'logged-in', isLoggedIn: true }
      };
    }
    
    if (message.toLowerCase().includes('później') || message.toLowerCase().includes('nie')) {
      return {
        message: `Rozumiem ${name}! 😊\n\n✅ **Konto utworzone** - możesz się zalogować później\n📧 **Link aktywacyjny** wysłany na email\n� **Logowanie:** www.technik-serwis.pl/login\n\n💬 **W czym mogę Ci jeszcze pomóc?**\n• Zamówić naprawę\n• Sprawdzić cennik\n• Odpowiedzieć na pytania\n• Wyjaśnić jak działa panel klienta`,
        accountUpdate: { step: 'completed' }
      };
    }
    
    return {
      message: `${name}, nie rozumiem. 🤔\n\n**Chcesz się zalogować do nowego konta?**\n• Napisz **"ZALOGUJ"** żeby się zalogować teraz\n• **"PÓŹNIEJ"** żeby zalogować się później\n\n💡 *Po zalogowaniu będziesz mieć dostęp do panelu klienta!*`,
      accountUpdate: { step: 'ask-login' }
    };
  }
  
  // Jeśli hasło za krótkie
  if (accountSetup === 'password' && message.length < 6) {
    return {
      message: `${name}, hasło jest za krótkie! 🔒\n\n❌ **Twoje hasło:** "${message}" (${message.length} znaków)\n✅ **Wymagane:** minimum 6 znaków\n\n💡 **Przykłady dobrych haseł:**\n• "technik123"\n• "naprawa2024"\n• "serwis456"\n\n**Spróbuj ponownie - napisz hasło:**`,
      accountUpdate: { step: 'password' }
    };
  }
  
  // Anulowanie procesu
  if (message.toLowerCase().includes('anuluj') || message.toLowerCase().includes('później')) {
    return {
      message: `Rozumiem ${name}! 😊\n\nProces zakładania konta został przerwany.\n\n💡 **Możesz założyć konto później:**\n• Napisz "załóż konto"\n• Kliknij przycisk "👤 Załóż konto"\n\n💬 **W czym mogę Ci jeszcze pomóc?**`,
      accountUpdate: { step: null }
    };
  }
  
  // Domyślna odpowiedź
  return {
    message: `${name}, nie rozumiem. 🤔\n\n**Proces zakładania konta:**\n• Napisz **"TAK"** żeby kontynuować\n• **"ANULUJ"** żeby przerwać\n• **"PÓŹNIEJ"** żeby założyć konto później`,
    accountUpdate: { step: accountSetup }
  };
}

// OBSŁUGA PROCESU ZAMÓWIENIA KROK PO KROKU
function handleOrderProcess(message, name, orderData) {
  const step = orderData.step;
  
  // Sprawdź czy użytkownik chce anulować zamówienie
  if (message.toLowerCase().includes('anuluj') || message.toLowerCase().includes('cancel') || message.toLowerCase().includes('stop')) {
    return {
      message: `Rozumiem ${name}! 😊\n\nZamówienie zostało anulowane.\n\n💬 **Mogę Ci jeszcze pomóc w czymś?**\n• Informacje o sprzęcie\n• Godziny pracy\n• Ceny usług\n• Nowe zamówienie`,
      orderUpdate: { step: null, cancelled: true }
    };
  }

  // Sprawdź czy użytkownik chce wrócić do poprzedniego kroku
  if (message.toLowerCase().includes('wstecz') || message.toLowerCase().includes('cofnij') || 
      message.toLowerCase().includes('poprzedni') || message.toLowerCase().includes('back') ||
      message.toLowerCase().includes('wroc') || message.toLowerCase().includes('wróć')) {
    
    let previousStep = 1;
    let backMessage = '';
    
    if (step === 2) {
      previousStep = 1;
      backMessage = `OK ${name}! Wracamy do wyboru urządzenia 🔧\n\n**Co naprawiam:**\n• Pralka 🔧\n• Lodówka ❄️\n• Zmywarka 🍽️\n• Piekarnik 🔥\n• Kuchenka/Płyta 🔥\n• Mikrofalówka ⚡\n• Suszarka 🌪️\n• Okap 💨\n• Ekspres ☕\n\n**Napisz nazwę urządzenia:**`;
    } else if (step === 3) {
      previousStep = 2;
      backMessage = `OK ${name}! Wracamy do marki 🏷️\n\n**Jaka marka Twojego urządzenia ${orderData.device || 'sprzętu'}?**\n\n**Popularne marki:**\n• Bosch, Siemens, Samsung\n• LG, Whirlpool, Electrolux\n• Beko, Indesit, Candy\n• Amica, Gorenje\n\n📝 **Napisz markę** (lub "nie wiem" jeśli nie pamiętasz):`;
    } else if (step === 4) {
      previousStep = 3;
      backMessage = `OK ${name}! Wracamy do opisu problemu 📝\n\n**Co dokładnie się dzieje z Twoim urządzeniem ${orderData.device} ${orderData.brand || ''}?**\n\n💡 **Przykłady:**\n• "Nie włącza się"\n• "Dziwne dźwięki podczas pracy"\n• "Nie grzeje wody"\n• "Wyświetla błąd F03"\n\n📋 **Opisz problem** (minimum 10 znaków):`;
    } else if (step === 5) {
      previousStep = 4;
      backMessage = `OK ${name}! Wracamy do adresu 📍\n\n**Gdzie mam przyjechać?**\n\n💡 **Podaj dokładny adres:**\n• Miasto, ulica i numer\n• Np: "Rzeszów, Słowackiego 15"\n• Minimum 15 znaków\n\n📍 **Napisz adres:**`;
    } else if (step === 6) {
      previousStep = 5;
      backMessage = `OK ${name}! Wracamy do terminu ⏰\n\n**Kiedy Ci pasuje wizyta?**\n\n⚡ **OPCJE:**\n• **"dziś"** lub **"pilne"** - dziś po południu\n• **"jutro rano"** - jutro 9:00-12:00  \n• **"jutro"** - jutro po południu 14:00-17:00\n• **"pojutrze"** - pojutrze rano 9:00-12:00\n• **Inny termin** - napisz jaki (np. "piątek rano")\n\n📅 **Kiedy Ci pasuje?**`;
    } else if (step === 1) {
      return {
        message: `${name}, jesteś już na pierwszym kroku! 😊\n\n**Nie można cofnąć się dalej.**\n\n**Aktualny krok:** Wybór urządzenia 🔧\n\n💡 **Możesz:**\n• Napisać "anuluj" żeby przerwać\n• Wybrać urządzenie z listy\n• Zapytać o coś innego`,
        orderUpdate: { step: 1 }
      };
    }
    
    return {
      message: backMessage,
      orderUpdate: { step: previousStep }
    };
  }
  
  // KROK 1: Rodzaj urządzenia - z obsługą literówek
  if (step === 1) {
    const msg = message.toLowerCase().replace(/[ąćęłńóśźż]/g, (char) => {
      const map = {'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z'};
      return map[char] || char;
    });
    
    // PRALKA - różne warianty i literówki
    if (msg.match(/(pralka|pralk|pralke|pralki|pralko|pralke|pralką|pralkę)/)) {
      return {
        message: `OK ${name}, pralka! 🔧\n\nJaka to marka?\n\n• Samsung\n• LG\n• Bosch\n• Whirlpool\n• Beko\n• Electrolux\n• Inna (napisz jaką)`,
        orderUpdate: { device: 'pralka', step: 2 }
      };
    }
    
    // LODÓWKA - różne warianty i literówki  
    if (msg.match(/(lodowka|lodówka|lodowke|chlodziarka|chlodziar|zamrazarka|zamrażarka|frigo)/)) {
      return {
        message: `Rozumiem ${name}, lodówka! ❄️\n\nJaka marka?\n\n• Samsung\n• LG\n• Bosch\n• Whirlpool\n• Beko\n• Electrolux\n• Inna (napisz jaką)`,
        orderUpdate: { device: 'lodówka', step: 2 }
      };
    }
    
    // ZMYWARKA - różne warianty i literówki
    if (msg.match(/(zmywarka|zmywar|zmywarke|zmywarką|zmyware|zmywarki)/)) {
      return {
        message: `Super ${name}, zmywarka! 🍽️\n\nJaka marka?\n\n• Bosch\n• Samsung\n• Whirlpool\n• Beko\n• Electrolux\n• Inna (napisz jaką)`,
        orderUpdate: { device: 'zmywarka', step: 2 }
      };
    }
    
    // PIEKARNIK - różne warianty i literówki
    if (msg.match(/(piekarnik|piekarn|piekar|piekarnk|oven|spiritualka|spiritual)/)) {
      return {
        message: `Aha ${name}, piekarnik! 🔥\n\nJaka marka?\n\n• Bosch\n• Samsung\n• Electrolux\n• Whirlpool\n• Beko\n• Inna (napisz jaką)`,
        orderUpdate: { device: 'piekarnik', step: 2 }
      };
    }
    
    // KUCHENKA - różne warianty i literówki
    if (msg.match(/(kuchenka|kuchen|kuchnia|plyta|plyty|palnik|palniki|gaz)/)) {
      return {
        message: `OK ${name}, kuchenka/płyta! 🔥\n\nJaka marka?\n\n• Bosch\n• Samsung\n• Electrolux\n• Whirlpool\n• Beko\n• Inna (napisz jaką)`,
        orderUpdate: { device: 'kuchenka', step: 2 }
      };
    }
    
    // OKAP - różne warianty i literówki
    if (msg.match(/(okap|okapy|wywietrznik|wentylator|wyciag)/)) {
      return {
        message: `Rozumiem ${name}, okap! 💨\n\nJaka marka?\n\n• Bosch\n• Samsung\n• Electrolux\n• Whirlpool\n• Inna (napisz jaką)`,
        orderUpdate: { device: 'okap', step: 2 }
      };
    }
    
    // MIKROFALÓWKA - różne warianty i literówki  
    if (msg.match(/(mikrofalowka|mikrofala|mikro|mikrofalówka|microwave)/)) {
      return {
        message: `OK ${name}, mikrofalówka! ⚡\n\nJaka marka?\n\n• Samsung\n• LG\n• Bosch\n• Whirlpool\n• Sharp\n• Inna (napisz jaką)`,
        orderUpdate: { device: 'mikrofalówka', step: 2 }
      };
    }
    
    // SUSZARKA - różne warianty i literówki
    if (msg.match(/(suszarka|suszar|susząca|suszace|dryer)/)) {
      return {
        message: `Aha ${name}, suszarka! 🌪️\n\nJaka marka?\n\n• Bosch\n• Samsung\n• LG\n• Whirlpool\n• Beko\n• Inna (napisz jaką)`,
        orderUpdate: { device: 'suszarka', step: 2 }
      };
    }
    
    // EKSPRES DO KAWY - różne warianty i literówki
    if (msg.match(/(ekspres|kawa|coffee|espresso|kawowar)/)) {
      return {
        message: `Super ${name}, ekspres do kawy! ☕\n\nJaka marka?\n\n• Delonghi\n• Saeco\n• Krups\n• Bosch\n• Siemens\n• Inna (napisz jaką)`,
        orderUpdate: { device: 'ekspres', step: 2 }
      };
    }
    
    return {
      message: `${name}, co dokładnie się zepsuło?\n\n🔧 **AGD które naprawiam:**\n• Pralka 🔧\n• Lodówka ❄️\n• Zmywarka 🍽️\n• Piekarnik 🔥\n• Kuchenka/Płyta 🔥\n• Mikrofalówka ⚡\n• Suszarka 🌪️\n• Okap 💨\n• Ekspres ☕\n\n**Napisz nazwa urządzenia** (nie przejmuj się literówkami! 😊)`
    };
  }
  
  // KROK 2: Marka
  if (step === 2) {
    const brand = message.includes('samsung') ? 'Samsung' :
                 message.includes('lg') ? 'LG' :
                 message.includes('bosch') ? 'Bosch' :
                 message.includes('whirlpool') ? 'Whirlpool' :
                 message.includes('beko') ? 'Beko' :
                 message.includes('electrolux') ? 'Electrolux' :
                 message.includes('delonghi') ? 'DeLonghi' :
                 message.includes('saeco') ? 'Saeco' :
                 message.includes('krups') ? 'Krups' :
                 message.includes('siemens') ? 'Siemens' :
                 message.includes('sharp') ? 'Sharp' :
                 message.charAt(0).toUpperCase() + message.slice(1);
    
    return {
      message: `${brand} - super wybór ${name}! 👍\n\nTeraz opisz problem:\n\n🔍 **Co się dzieje?**\n• Nie włącza się?\n• Dziwnie pracuje?\n• Nie grzeje?\n• Inne... (opisz)\n\n💡 **Możesz też napisać "wstecz" żeby zmienić urządzenie**`,
      orderUpdate: { brand: brand, step: 3 }
    };
  }
  
  // KROK 3: Problem
  if (step === 3) {
    // Sprawdź czy opis jest wystarczający
    if (message.length < 10) {
      return {
        message: `${name}, opisz problem dokładniej! 🔍\n\nPotrzebuję więcej szczegółów:\n\n❓ **Co dokładnie się dzieje?**\n• Jakie są objawy?\n• Kiedy zaczął się problem?\n• Czy urządzenie w ogóle się włącza?\n• Czy wydaje dziwne dźwięki?\n\nIm więcej napiszesz, tym lepiej przygotuję się do naprawy! 😊`,
        orderUpdate: { step: 3 } // Zostań na tym samym kroku
      };
    }
    
    return {
      message: `Rozumiem problem ${name}! 📝\n\n"${message}"\n\nTeraz potrzebuję dokładny adres:\n\n🏠 **Napisz:**\n• Miasto (np. Rzeszów, Jasło, Krosno)\n• Ulica i numer (np. Mickiewicza 15/3)\n• Kod pocztowy (opcjonalnie)\n\n💡 **Napisz "wstecz" żeby wrócić do opisu problemu**`,
      orderUpdate: { problem: message, step: 4 }
    };
  }
  
  // KROK 4: Adres
  if (step === 4) {
    // Sprawdź czy adres zawiera podstawowe informacje
    if (message.length < 15 || !message.includes(' ')) {
      return {
        message: `${name}, potrzebuję pełniejszy adres! 📍\n\n❌ **Za mało informacji**\n\n✅ **Napisz tak:**\n• "Rzeszów, Mickiewicza 15/3"\n• "Jasło, Słowackiego 8"\n• "Krosno, Rynek 12"\n\nPotrzebuję miasto i ulicę z numerem! 😊`,
        orderUpdate: { step: 4 } // Zostań na tym samym kroku
      };
    }
    
    // Rozpoznaj miasto
    const msgLower = message.toLowerCase();
    const isRzeszow = msgLower.includes('rzeszów');
    const isJaslo = msgLower.includes('jasło');
    const isKrosno = msgLower.includes('krosno');
    const isStalowa = msgLower.includes('stalowa');
    const isTarnobrzeg = msgLower.includes('tarnobrzeg');
    
    let city = 'inne';
    let travelCost = 50;
    let travelInfo = '';
    
    if (isRzeszow) {
      city = 'Rzeszów';
      travelCost = 0;
      travelInfo = '🎁 **Rzeszów - dojazd GRATIS!**';
    } else if (isJaslo) {
      city = 'Jasło';
      travelCost = 30;
      travelInfo = '🚗 **Jasło - dojazd 30zł**';
    } else if (isKrosno) {
      city = 'Krosno';
      travelCost = 40;
      travelInfo = '🚗 **Krosno - dojazd 40zł**';
    } else if (isStalowa) {
      city = 'Stalowa Wola';
      travelCost = 50;
      travelInfo = '🚗 **Stalowa Wola - dojazd 50zł**';
    } else if (isTarnobrzeg) {
      city = 'Tarnobrzeg';
      travelCost = 50;
      travelInfo = '🚗 **Tarnobrzeg - dojazd 50zł**';
    } else {
      travelInfo = '🚗 **Dojazd:** wyliczę indywidualnie (zwykle 30-60zł)';
    }
    
    return {
      message: `Adres zapisany ${name}! 📍\n\n**${message}**\n\n${travelInfo}\n\n⏰ **Kiedy Ci pasuje wizyta?**\n• 🌅 **Jutro rano** (9:00-12:00)\n• 🌞 **Jutro po południu** (14:00-17:00)\n• 🌅 **Pojutrze rano** (9:00-12:00)\n• 🌞 **Pojutrze po południu** (14:00-17:00)\n• ⏰ **Inny termin** (napisz jaki)\n\n💡 **Pilne naprawy** mogę zrobić dziś wieczorem!`,
      orderUpdate: { 
        address: message,
        city: city,
        travelCost: travelCost,
        step: 5 
      }
    };
  }
  
  // KROK 5: Termin
  if (step === 5) {
    // Określ priorytet naprawy
    let urgency = 'normalny';
    let urgencyIcon = '⏰';
    let urgencyText = '';
    
    if (message.toLowerCase().includes('pilne') || message.toLowerCase().includes('dziś') || message.toLowerCase().includes('dzisiaj')) {
      urgency = 'pilny';
      urgencyIcon = '🚨';
      urgencyText = ' (PILNE!)';
    } else if (message.toLowerCase().includes('jutro rano') || message.toLowerCase().includes('rano')) {
      urgency = 'szybki';
      urgencyIcon = '⚡';
      urgencyText = ' (priorytet)';
    }
    
    const travelCostText = orderData.travelCost === 0 ? 'GRATIS 🎁' : `${orderData.travelCost}zł 🚗`;
    
    return {
      message: `Termin ustalony ${name}! ${urgencyIcon}\n\n📋 **PODSUMOWANIE ZAMÓWIENIA:**\n• **Urządzenie:** ${orderData.device} ${orderData.brand}\n• **Problem:** ${orderData.problem}\n• **Adres:** ${orderData.address}\n• **Termin:** ${message}${urgencyText}\n• **Dojazd:** ${travelCostText}\n• **Diagnoza:** GRATIS ✅\n\n📞 **Podaj numer telefonu** (do potwierdzenia wizyty):\n\n💡 **Napisz swój numer** lub powiedz czy wszystko się zgadza!`,
      orderUpdate: { 
        preferredTime: message,
        urgency: urgency,
        step: 6 
      }
    };
  }
  
  // KROK 6: Potwierdzenie i telefon
  if (step === 6) {
    // Sprawdź czy to numer telefonu
    if (message.match(/\d{9}/)) {
      const phone = message.match(/\d{9,}/)[0];
      return {
        message: `Telefon zapisany ${name}: ${phone} 📞\n\n🎯 **OSTATECZNE POTWIERDZENIE:**\n\n📋 **TWOJE ZAMÓWIENIE:**\n• **Urządzenie:** ${orderData.device} ${orderData.brand}\n• **Problem:** ${orderData.problem}\n• **Adres:** ${orderData.address}\n• **Termin:** ${orderData.preferredTime}\n• **Dojazd:** ${orderData.travelCost === 0 ? 'GRATIS' : orderData.travelCost + 'zł'}\n• **Telefon:** ${phone}\n\n✅ **Napisz "TAK" żeby potwierdzić zamówienie**\n🔄 **Lub "ZMIEŃ" żeby coś poprawić**`,
        orderUpdate: { phone: phone }
      };
    }
    
    if (message.toLowerCase().includes('tak') || message.toLowerCase().includes('zgadza') || message.toLowerCase().includes('ok') || message.toLowerCase().includes('potwierdz')) {
      const orderId = `ORD${Date.now()}`;
      const urgencyMsg = orderData.urgency === 'pilny' ? 'tego samego dnia' : 
                        orderData.urgency === 'szybki' ? 'jutro rano' : 'w ustalonym terminie';
      
      return {
        message: `ŚWIETNIE ${name}! 🎉\n\n✅ **ZAMÓWIENIE PRZYJĘTE!**\n📞 **Numer:** ${orderId}\n\n� **CO DALEJ:**\n�📱 **Telefon:** Zadzwonię ${urgencyMsg} (godz. 18:00-20:00)\n🔧 **Serwisant:** Przyjedzie punktualnie w ustalonym terminie\n� **Diagnoza:** Całkowicie GRATIS\n� **Płatność:** Po wykonaniu naprawy\n\n**🚨 PILNE?** Dzwoń: +48 123 456 789\n\n**Dzięki za zaufanie firmie TECHNIK!** 😊\n\n✅ **Zamówienie zostało zapisane w systemie**`,
        orderUpdate: { 
          confirmed: true,
          orderId: orderId,
          step: 'completed'
        }
      };
    }
    
    if (message.toLowerCase().includes('zmień') || message.toLowerCase().includes('popraw')) {
      return {
        message: `Bez problemu ${name}! 🔄\n\n**Co chcesz zmienić?**\n\n1️⃣ **Urządzenie/marka** - napisz "urządzenie"\n2️⃣ **Opis problemu** - napisz "problem"\n3️⃣ **Adres** - napisz "adres"\n4️⃣ **Termin** - napisz "termin"\n5️⃣ **Telefon** - napisz "telefon"\n\n💡 **Lub napisz co konkretnie chcesz zmienić!**`,
        orderUpdate: { step: 'edit' }
      };
    }
    
    // Jeśli nie ma telefonu, poproś o niego
    if (!orderData.phone) {
      return {
        message: `${name}, potrzebuję Twój numer telefonu! 📞\n\n**Dlaczego?**\n• Potwierdzenie wizyty\n• Kontakt przed przyjazdem\n• Informacje o ewentualnych opóźnieniach\n\n📱 **Napisz swój numer telefonu** (9 cyfr):`
      };
    }
  }
  
  // KROK EDYCJI - pozwala zmienić dane
  if (step === 'edit') {
    if (message.toLowerCase().includes('urządzenie') || message.toLowerCase().includes('sprzęt')) {
      return {
        message: `OK ${name}! Zmiana urządzenia 🔧\n\n**Co naprawiam:**\n• Pralka 🔧\n• Lodówka ❄️\n• Zmywarka 🍽️\n• Piekarnik 🔥\n• Kuchenka/Płyta 🔥\n• Mikrofalówka ⚡\n• Suszarka 🌪️\n• Okap 💨\n• Ekspres ☕\n\n**Napisz nową nazwę urządzenia:**`,
        orderUpdate: { step: 1 }
      };
    }
    
    if (message.toLowerCase().includes('problem') || message.toLowerCase().includes('usterka')) {
      return {
        message: `OK ${name}! Zmiana opisu problemu �\n\n**Obecny opis:**\n"${orderData.problem}"\n\n**Napisz nowy opis problemu:**\n(Opisz dokładnie co się dzieje)`,
        orderUpdate: { step: 3 }
      };
    }
    
    if (message.toLowerCase().includes('adres') || message.toLowerCase().includes('miejsce')) {
      return {
        message: `OK ${name}! Zmiana adresu 📍\n\n**Obecny adres:**\n"${orderData.address}"\n\n**Napisz nowy adres:**\n(Miasto, ulica i numer)`,
        orderUpdate: { step: 4 }
      };
    }
    
    if (message.toLowerCase().includes('termin') || message.toLowerCase().includes('czas')) {
      return {
        message: `OK ${name}! Zmiana terminu ⏰\n\n**Obecny termin:**\n"${orderData.preferredTime}"\n\n**Kiedy Ci teraz pasuje?**\n• Jutro rano (9-12)\n• Jutro po południu (14-17)\n• Pojutrze rano (9-12)\n• Inny termin (napisz jaki)`,
        orderUpdate: { step: 5 }
      };
    }
    
    if (message.toLowerCase().includes('telefon') || message.toLowerCase().includes('numer')) {
      return {
        message: `OK ${name}! Zmiana telefonu 📞\n\n**Obecny numer:**\n"${orderData.phone || 'brak'}"\n\n**Napisz nowy numer telefonu:**\n(9 cyfr)`,
        orderUpdate: { step: 6 }
      };
    }
  }
  
  // Domyślna odpowiedź w trakcie zamówienia
  return {
    message: `${name}, pomóż mi dokończyć zamówienie 😊\n\nJesteśmy na kroku ${step}/6.\nCo chciałeś napisać?`
  };
}