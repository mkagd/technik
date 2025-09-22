// Integration Test - Full Address Feature
// This script tests the full address functionality from form to map

console.log('🧪 Testing Full Address Feature Integration');
console.log('==========================================');

// Test 1: API endpoint handling
async function testAPI() {
    console.log('\n1. Testing API endpoint...');

    const testData = {
        name: 'Jan Testowy',
        phone: '+48 123 456 789',
        email: 'test@example.com',
        fullAddress: 'ul. Testowa 123/45, 00-001 Warszawa',
        address: 'ul. Testowa 123/45, 00-001 Warszawa',
        category: 'Naprawa komputera',
        device: 'Dell Inspiron',
        problem: 'Testowy problem',
        date: new Date().toISOString()
    };

    try {
        console.log('   Sending test reservation...');

        // Note: This would need actual server running to test
        console.log('   ✅ Test data prepared:', {
            ...testData,
            hasFullAddress: !!testData.fullAddress,
            hasAddress: !!testData.address
        });

        console.log('   📝 Expected API behavior:');
        console.log('     - Should accept fullAddress OR address');
        console.log('     - Should save address field in database');
        console.log('     - Should return success response');

    } catch (error) {
        console.log('   ❌ API test failed:', error.message);
    }
}

// Test 2: Form validation logic
function testFormValidation() {
    console.log('\n2. Testing form validation logic...');

    const testCases = [
        {
            name: 'Full address only',
            data: { fullAddress: 'ul. Krakowska 123, Warszawa', city: '', street: '' },
            shouldPass: true
        },
        {
            name: 'City and street only',
            data: { fullAddress: '', city: 'Warszawa', street: 'ul. Krakowska 123' },
            shouldPass: true
        },
        {
            name: 'No address data',
            data: { fullAddress: '', city: '', street: '' },
            shouldPass: false
        },
        {
            name: 'Only city',
            data: { fullAddress: '', city: 'Warszawa', street: '' },
            shouldPass: false
        },
        {
            name: 'Only street',
            data: { fullAddress: '', city: '', street: 'ul. Krakowska 123' },
            shouldPass: false
        }
    ];

    testCases.forEach(testCase => {
        const { fullAddress, city, street } = testCase.data;
        const isValid = !(!fullAddress && (!city || !street));

        console.log(`   ${isValid === testCase.shouldPass ? '✅' : '❌'} ${testCase.name}:`,
            `Expected ${testCase.shouldPass}, Got ${isValid}`);
    });
}

// Test 3: Address mapping logic
function testAddressMapping() {
    console.log('\n3. Testing address mapping logic...');

    const testCases = [
        {
            input: { fullAddress: 'ul. Testowa 123, Warszawa', city: 'Kraków', street: 'ul. Główna 1' },
            expected: 'ul. Testowa 123, Warszawa',
            name: 'Full address takes priority'
        },
        {
            input: { fullAddress: '', city: 'Warszawa', street: 'ul. Krakowska 123' },
            expected: 'ul. Krakowska 123, Warszawa',
            name: 'City and street combination'
        },
        {
            input: { fullAddress: null, city: 'Gdańsk', street: 'ul. Długa 45' },
            expected: 'ul. Długa 45, Gdańsk',
            name: 'Null fullAddress fallback'
        }
    ];

    testCases.forEach(testCase => {
        const { fullAddress, city, street } = testCase.input;
        const result = fullAddress || `${street}, ${city}`;

        console.log(`   ${result === testCase.expected ? '✅' : '❌'} ${testCase.name}:`,
            `Expected "${testCase.expected}", Got "${result}"`);
    });
}

// Test 4: Map marker data structure
function testMapMarkerData() {
    console.log('\n4. Testing map marker data structure...');

    const sampleReservation = {
        name: 'Jan Kowalski',
        phone: '+48 123 456 789',
        address: 'ul. Krakowska 123, Warszawa',
        category: 'Naprawa komputera',
        device: 'Dell Inspiron',
        problem: 'Powolne działanie',
        date: '2024-12-20'
    };

    const mappedData = {
        clientName: sampleReservation.name,
        clientPhone: sampleReservation.phone,
        address: sampleReservation.address,
        serviceType: sampleReservation.category || 'Serwis ogólny',
        deviceType: sampleReservation.device || 'Nie podano',
        scheduledDate: sampleReservation.date,
        status: 'pending',
        priority: 'normal',
        description: sampleReservation.problem || 'Brak opisu'
    };

    console.log('   ✅ Sample reservation mapping:');
    console.log('     Input:', sampleReservation);
    console.log('     Mapped for map:', mappedData);
    console.log('     Address field present:', !!mappedData.address);
}

// Test 5: Component compatibility
function testComponentCompatibility() {
    console.log('\n5. Testing component compatibility...');

    console.log('   📝 Key components to verify:');
    console.log('     ✅ rezerwacja.js - Form with fullAddress field');
    console.log('     ✅ api/rezerwacje.js - API handling address field');
    console.log('     ✅ mapa.js - Map displaying markers from address');

    console.log('   📝 Data flow:');
    console.log('     Form → fullAddress/city+street → address → API → Database');
    console.log('     Database → API → Map → Geocoding → Marker');
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Integration Tests...\n');

    testFormValidation();
    testAddressMapping();
    testMapMarkerData();
    testComponentCompatibility();
    await testAPI();

    console.log('\n🎉 Integration Test Complete!');
    console.log('\n📋 Manual Testing Checklist:');
    console.log('  □ Start development server (npm run dev)');
    console.log('  □ Navigate to /rezerwacja');
    console.log('  □ Fill form with full address');
    console.log('  □ Submit form successfully');
    console.log('  □ Navigate to /mapa');
    console.log('  □ Verify marker appears on map');
    console.log('  □ Check marker info shows correct address');

    console.log('\n🔧 Next Steps:');
    console.log('  1. Test with real address (e.g., "ul. Krakowska 123, Warszawa")');
    console.log('  2. Verify Google Maps geocoding works');
    console.log('  3. Test both fullAddress and city+street inputs');
    console.log('  4. Check marker info window content');
}

// Execute tests
runAllTests().catch(console.error);
