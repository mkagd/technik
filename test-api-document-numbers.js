// Test API numeracji dokumentów (uruchom po starcie serwera Next.js)

async function testDocumentNumbersAPI() {
  console.log('=== TEST API NUMERACJI DOKUMENTÓW ===\n');

  try {
    // Test aktualnego stanu
    console.log('1. Sprawdzenie aktualnego stanu...');
    const currentResponse = await fetch('http://localhost:3000/api/document-numbers?type=current');
    const currentData = await currentResponse.json();
    console.log('Aktualny stan:', currentData);
    console.log('');

    // Test generowania faktury
    console.log('2. Generowanie numeru faktury...');
    const invoiceResponse = await fetch('http://localhost:3000/api/document-numbers?type=invoice');
    const invoiceData = await invoiceResponse.json();
    console.log('Numer faktury:', invoiceData.number);
    console.log('');

    // Test generowania protokołu
    console.log('3. Generowanie numeru protokołu...');
    const protocolResponse = await fetch('http://localhost:3000/api/document-numbers?type=protocol');
    const protocolData = await protocolResponse.json();
    console.log('Numer protokołu:', protocolData.number);
    console.log('');

    // Sprawdzenie stanu po wygenerowaniu
    console.log('4. Stan po wygenerowaniu numerów...');
    const finalResponse = await fetch('http://localhost:3000/api/document-numbers?type=current');
    const finalData = await finalResponse.json();
    console.log('Faktury - następny numer:', finalData.numbers.invoices.currentNumber);
    console.log('Protokoły - następny numer:', finalData.numbers.protocols.currentNumber);

  } catch (error) {
    console.error('Błąd testowania API:', error.message);
    console.log('\nUpewnij się, że serwer Next.js jest uruchomiony (npm run dev)');
  }
}

// Uruchom test tylko jeśli jest to środowisko Node.js
if (typeof window === 'undefined') {
  testDocumentNumbersAPI();
} else {
  console.log('Ten test wymaga uruchomienia serwera Next.js. Uruchom: npm run dev');
}