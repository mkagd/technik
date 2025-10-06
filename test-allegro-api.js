// Diagnostic script to test Allegro API without rate limits
const fs = require('fs');
const path = require('path');

async function testAllegroAPI() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   ALLEGRO API - DIAGNOSTIC TEST');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Check config file
  console.log('1️⃣  Sprawdzam plik konfiguracyjny...');
  const configPath = path.join(__dirname, 'data', 'allegro-config.json');
  
  if (!fs.existsSync(configPath)) {
    console.log('❌ Plik allegro-config.json NIE ISTNIEJE');
    return;
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log('✅ Plik istnieje');
  console.log(`   Client ID: ${config.clientId ? config.clientId.substring(0, 10) + '...' : 'BRAK'}`);
  console.log(`   Client Secret: ${config.clientSecret ? '✅ Ustawiony' : '❌ BRAK'}`);
  console.log(`   Sandbox: ${config.sandbox}`);
  console.log();

  // 2. Check token cache
  console.log('2️⃣  Sprawdzam cache tokenu...');
  const tokenPath = path.join(__dirname, 'data', 'allegro-token.json');
  
  if (fs.existsSync(tokenPath)) {
    const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    const expiresAt = new Date(tokenData.expiresAt);
    const now = new Date();
    const isValid = expiresAt > now;
    
    console.log(`   Token cache istnieje`);
    console.log(`   Wygasa: ${expiresAt.toLocaleString()}`);
    console.log(`   Status: ${isValid ? '✅ WAŻNY' : '❌ WYGASŁ'}`);
  } else {
    console.log('   Brak cache (zostanie utworzony przy pierwszym użyciu)');
  }
  console.log();

  // 3. Test OAuth token fetch
  console.log('3️⃣  Testuję pobieranie tokenu OAuth...');
  
  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  const authUrl = config.sandbox 
    ? 'https://allegro.pl.allegrosandbox.pl/auth/oauth/token'
    : 'https://allegro.pl/auth/oauth/token';

  console.log(`   URL: ${authUrl}`);
  console.log(`   Sandbox: ${config.sandbox ? 'TAK' : 'NIE'}`);
  
  try {
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Błąd ${response.status}: ${response.statusText}`);
      console.log(`   Odpowiedź: ${errorText}`);
      
      if (response.status === 401) {
        console.log('\n⚠️  DIAGNOZA: Nieprawidłowe credentials!');
        console.log('   Sprawdź czy:');
        console.log('   - Client ID jest poprawny');
        console.log('   - Client Secret jest poprawny');
        console.log('   - Aplikacja jest aktywna w Allegro Developer Portal');
        console.log('   - Używasz credentials z właściwego środowiska (Sandbox vs Production)');
      }
      return;
    }

    const data = await response.json();
    console.log('✅ Token OAuth pobrany pomyślnie!');
    console.log(`   Access Token: ${data.access_token.substring(0, 20)}...`);
    console.log(`   Wygasa za: ${data.expires_in} sekund (${Math.floor(data.expires_in / 3600)} godzin)`);
    console.log();

    // 4. Test API call
    console.log('4️⃣  Testuję wywołanie Allegro API...');
    
    const apiUrl = config.sandbox
      ? 'https://api.allegro.pl.allegrosandbox.pl/sale/categories'
      : 'https://api.allegro.pl/sale/categories';
    
    console.log(`   URL: ${apiUrl}`);
    
    const apiResponse = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${data.access_token}`,
        'Accept': 'application/vnd.allegro.public.v1+json'
      }
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.log(`❌ Błąd API ${apiResponse.status}: ${apiResponse.statusText}`);
      console.log(`   Odpowiedź: ${errorText}`);
      return;
    }

    const categories = await apiResponse.json();
    console.log('✅ Allegro API działa poprawnie!');
    console.log(`   Pobrano ${categories.categories?.length || 0} kategorii`);
    console.log();

    // 5. Test search
    console.log('5️⃣  Testuję wyszukiwanie produktów...');
    
    const searchUrl = config.sandbox
      ? 'https://api.allegro.pl.allegrosandbox.pl/offers/listing'
      : 'https://api.allegro.pl/offers/listing';
    
    const searchResponse = await fetch(`${searchUrl}?phrase=test&limit=5`, {
      headers: {
        'Authorization': `Bearer ${data.access_token}`,
        'Accept': 'application/vnd.allegro.public.v1+json'
      }
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.log(`❌ Błąd wyszukiwania ${searchResponse.status}`);
      console.log(`   Odpowiedź: ${errorText}`);
      return;
    }

    const searchData = await searchResponse.json();
    const items = searchData.items?.promoted || [];
    const regular = searchData.items?.regular || [];
    const total = items.length + regular.length;
    
    console.log(`✅ Wyszukiwanie działa!`);
    console.log(`   Znaleziono ${total} ofert`);
    
    if (total > 0) {
      const firstItem = items[0] || regular[0];
      console.log(`   Przykład: "${firstItem.name}"`);
      console.log(`   Cena: ${firstItem.sellingMode?.price?.amount} ${firstItem.sellingMode?.price?.currency}`);
    }

  } catch (error) {
    console.log(`❌ Błąd: ${error.message}`);
    console.log();
    console.log('⚠️  Sprawdź połączenie internetowe i spróbuj ponownie.');
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   TEST ZAKOŃCZONY');
  console.log('═══════════════════════════════════════════════════════\n');
}

// Run test
testAllegroAPI().catch(console.error);
