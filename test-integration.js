// Test script to verify form-to-map integration
const testFormSubmission = async () => {
    const testData = {
        name: 'Test Użytkownik',
        phone: '+48 123 456 789',
        email: 'test@example.com',
        city: 'Warszawa',
        street: 'Testowa 123',
        category: 'Naprawa komputera',
        device: 'Dell Laptop',
        problem: 'Test zgłoszenia z skryptu',
        date: new Date().toISOString()
    };

    try {
        console.log('🔄 Wysyłanie testowego zgłoszenia...');
        const response = await fetch('http://localhost:3000/api/rezerwacje', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData),
        });

        const result = await response.json();
        console.log('📤 Wysłano:', result);

        // Sprawdź czy dane są dostępne
        console.log('🔄 Sprawdzam czy dane są dostępne...');
        const getResponse = await fetch('http://localhost:3000/api/rezerwacje');
        const getData = await getResponse.json();
        console.log('📥 Pobrane dane:', getData);

        return result;
    } catch (error) {
        console.error('❌ Błąd testu:', error);
    }
};

// Uruchom test jeśli skrypt jest wywołany bezpośrednio
if (require.main === module) {
    testFormSubmission();
}

module.exports = { testFormSubmission };
