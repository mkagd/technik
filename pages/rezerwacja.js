import { useState, useEffect, useRef } from 'react';
import { FiTool, FiMapPin, FiUser, FiClock, FiArrowRight, FiArrowLeft, FiCheck } from 'react-icons/fi';
import GoogleGeocoder from '../geocoding/simple/GoogleGeocoder.js';
import ModelAIScanner from '../components/ModelAIScanner';

export default function RezerwacjaNowa() {
    const geocoder = useRef(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [showSummary, setShowSummary] = useState(false);
    const [showBrandSuggestions, setShowBrandSuggestions] = useState(null);
    const [showProblemSuggestions, setShowProblemSuggestions] = useState(null);
    const [showAIScanner, setShowAIScanner] = useState(false);
    const [scanningDeviceIndex, setScanningDeviceIndex] = useState(null);
    const [availabilityData, setAvailabilityData] = useState(null);
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    
    const [formData, setFormData] = useState({
        // Multi-device support
        categories: [], // Tablica typów urządzeń
        devices: [], // Tablica modeli
        brands: [], // Tablica marek
        problems: [], // Tablica problemów
        hasBuiltIn: [], // Czy w zabudowie
        hasDemontaz: [], // Czy wymaga demontażu
        hasMontaz: [], // Czy wymaga montażu
        hasTrudnaZabudowa: [], // Czy trudna zabudowa
        // Krok 2: Lokalizacja
        postalCode: '',
        city: '',
        street: '',
        // Krok 3: Dane kontaktowe
        name: '',
        phone: '',
        email: '',
        // Krok 4: Dostępność
        timeSlot: '',
        additionalNotes: ''
    });

    // Inicjalizacja geocodera
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (apiKey) {
            try {
                geocoder.current = new GoogleGeocoder(apiKey);
                console.log('🌍 Geocoder zainicjalizowany w formularzu');
            } catch (error) {
                console.error('❌ Błąd inicjalizacji geocodera:', error);
            }
        }
    }, []);

    // Lista popularnych marek AGD
    const brands = [
        'Amica', 'Aeg', 'Beko', 'Bosch', 'Candy', 'Electrolux', 'Gorenje', 
        'Haier', 'Hotpoint', 'Indesit', 'LG', 'Miele', 'Panasonic', 'Samsung', 
        'Sharp', 'Siemens', 'Whirlpool', 'Zanussi'
    ];

    // Typowe usterki dla każdego typu urządzenia
    const getCommonProblems = (category) => {
        const problems = {
            'Pralka': ['Nie włącza się', 'Nie pobiera wody', 'Nie odpompowuje wody', 'Nie wiruje', 'Wycieka woda', 'Głośno pracuje/wibruje', 'Nie grzeje wody', 'Nie kończy programu', 'Błąd na wyświetlaczu'],
            'Zmywarka': ['Nie włącza się', 'Nie pobiera wody', 'Nie odpompowuje wody', 'Nie myje naczyń', 'Wycieka woda', 'Nie grzeje wody', 'Głośno pracuje', 'Nie kończy programu', 'Błąd na wyświetlaczu'],
            'Lodówka': ['Nie chłodzi', 'Za głośno pracuje', 'Wycieka woda', 'Nie świeci oświetlenie', 'Lód w zamrażalniku', 'Nie włącza się', 'Nieprzyjemny zapach'],
            'Piekarnik': ['Nie włącza się', 'Nie grzeje', 'Nierównomiernie piecze', 'Nie działa termostat', 'Wyświetlacz pokazuje błąd', 'Nie świeci oświetlenie'],
            'Suszarka': ['Nie włącza się', 'Nie suszy', 'Za długo suszy', 'Głośno pracuje', 'Nie grzeje', 'Zablokowany bęben', 'Błąd na wyświetlaczu'],
            'Kuchenka': ['Nie włącza się', 'Palniki nie zapalają się', 'Nierównomierne płomienie', 'Zapach gazu', 'Piekarnik nie grzeje', 'Nie działa timer'],
            'Mikrofalówka': ['Nie włącza się', 'Nie grzeje', 'Dziwne dźwięki', 'Talerz się nie obraca', 'Drzwi się nie domykają', 'Wyświetlacz nie działa'],
            'Okap': ['Nie włącza się', 'Słabo wyciąga', 'Głośno pracuje', 'Nie świeci oświetlenie', 'Filtr zanieczyszczony'],
            'Inne AGD': ['Nie włącza się', 'Dziwne dźwięki', 'Przegrzewa się', 'Nie działa zgodnie z przeznaczeniem', 'Wyświetlacz pokazuje błąd']
        };
        return problems[category] || problems['Inne AGD'];
    };

    // Funkcja do wyboru/odznaczenia kategorii (checkboxy)
    const handleCategoryToggle = (e) => {
        const category = e.target.value;
        const newCategories = formData.categories.includes(category)
            ? formData.categories.filter(cat => cat !== category)
            : [...formData.categories, category];
        
        // Jeśli usuwamy kategorię, usuń też jej detale
        if (formData.categories.includes(category)) {
            const index = formData.categories.indexOf(category);
            const newBrands = [...formData.brands];
            const newDevices = [...formData.devices];
            const newProblems = [...formData.problems];
            
            newBrands.splice(index, 1);
            newDevices.splice(index, 1);
            newProblems.splice(index, 1);
            
            setFormData({
                ...formData,
                categories: newCategories,
                brands: newBrands,
                devices: newDevices,
                problems: newProblems
            });
        } else {
            // Dodajemy nową kategorię
            setFormData({
                ...formData,
                categories: newCategories
            });
        }
    };

    // Funkcja do zmiany detali urządzeń (marka, model, problem)
    const handleDeviceDetailChange = (index, field, value) => {
        const newArray = [...(formData[field + 's'] || [])];
        newArray[index] = value;
        
        setFormData({
            ...formData,
            [field + 's']: newArray
        });
    };

    // Funkcja do wyboru marki z listy
    const handleBrandSelect = (brand, index) => {
        const newBrands = [...formData.brands];
        newBrands[index] = brand;
        setFormData({
            ...formData,
            brands: newBrands
        });
        setShowBrandSuggestions(null);
    };

    // Funkcja do wyboru problemu z listy
    const handleProblemSelect = (problem, index) => {
        const newProblems = [...formData.problems];
        newProblems[index] = problem;
        setFormData({
            ...formData,
            problems: newProblems
        });
        setShowProblemSuggestions(null);
    };

    // Filtrowanie marek
    const getFilteredBrands = (searchTerm = '') => {
        const term = searchTerm || '';
        if (!term) return brands.slice(0, 8);
        return brands.filter(brand => 
            brand.toLowerCase().includes(term.toLowerCase())
        ).slice(0, 6);
    };

    // Filtrowanie problemów
    const getFilteredProblems = (category, searchTerm = '') => {
        const commonProblems = getCommonProblems(category);
        if (!searchTerm.trim()) {
            return commonProblems.slice(0, 12);
        }
        
        return commonProblems.filter(problem => 
            problem.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const nextStep = async () => {
        if (currentStep < 5) {
            // Jeśli przechodzimy do kroku 4 (dostępność), pobierz dane
            if (currentStep === 3 && formData.postalCode && formData.city) {
                await fetchAvailability();
            }
            setCurrentStep(currentStep + 1);
        }
    };

    // Pobierz dostępność w czasie rzeczywistym
    const fetchAvailability = async () => {
        setLoadingAvailability(true);
        try {
            const response = await fetch('/api/availability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    postalCode: formData.postalCode,
                    city: formData.city
                }),
            });

            const data = await response.json();
            
            if (data.success) {
                setAvailabilityData(data.availability);
                console.log('✅ Pobrano dostępność:', data.availability);
            } else {
                console.error('❌ Błąd pobierania dostępności:', data.error);
            }
        } catch (error) {
            console.error('❌ Błąd przy pobieraniu dostępności:', error);
        } finally {
            setLoadingAvailability(false);
        }
    };

    const prevStep = () => {
        if (currentStep > 1 && currentStep !== 5) {
            setCurrentStep(currentStep - 1);
            setShowSummary(false);
        }
    };

    // Handler dla AI skanera - wypełnia brand i model dla konkretnego urządzenia
    const handleAIModelDetected = (models) => {
        console.log('🔍 handleAIModelDetected - models:', models);
        
        if (!models || models.length === 0 || scanningDeviceIndex === null) {
            alert('❌ Nie wykryto modelu na tabliczce');
            setShowAIScanner(false);
            setScanningDeviceIndex(null);
            return;
        }

        const detectedModel = models[0];
        
        // Dodatkowa walidacja - sprawdź czy detectedModel nie jest undefined/null
        if (!detectedModel || typeof detectedModel !== 'object') {
            console.error('❌ Nieprawidłowy format modelu:', detectedModel);
            alert('❌ Błąd: Nieprawidłowe dane z skanera');
            setShowAIScanner(false);
            setScanningDeviceIndex(null);
            return;
        }

        const deviceInfo = {
            brand: detectedModel.brand || '',
            model: detectedModel.model || detectedModel.finalModel || '',
            type: detectedModel.type || detectedModel.finalType || '',
        };

        // Sprawdź czy wykryto przynajmniej markę lub model
        if (!deviceInfo.brand && !deviceInfo.model) {
            alert('❌ Nie udało się rozpoznać marki ani modelu');
            setShowAIScanner(false);
            setScanningDeviceIndex(null);
            return;
        }

        // Aktualizuj dane dla konkretnego urządzenia
        setFormData(prev => {
            const newBrands = [...prev.brands];
            const newDevices = [...prev.devices];
            
            newBrands[scanningDeviceIndex] = deviceInfo.brand;
            newDevices[scanningDeviceIndex] = deviceInfo.model;
            
            return {
                ...prev,
                brands: newBrands,
                devices: newDevices
            };
        });

        alert(`✅ Rozpoznano:\n${deviceInfo.brand} ${deviceInfo.model}\nTyp: ${deviceInfo.type}`);
        setShowAIScanner(false);
        setScanningDeviceIndex(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');

        // Walidacja
        if (formData.categories.length === 0) {
            setMessage('❌ Wybierz przynajmniej jeden typ urządzenia');
            setIsSubmitting(false);
            return;
        }

        if (formData.categories.some((_, index) => !formData.problems[index]?.trim())) {
            setMessage('❌ Opisz problemy dla wszystkich wybranych urządzeń');
            setIsSubmitting(false);
            return;
        }

        console.log('🚀 Wysyłam dane:', formData);

        // 🌍 GEOCODING - Pobierz współrzędne GPS dla adresu
        let clientLocation = null;
        const fullAddress = `${formData.street}, ${formData.postalCode} ${formData.city}`;
        
        if (geocoder.current) {
            try {
                console.log('📍 Geocoding adresu:', fullAddress);
                const geocodeResult = await geocoder.current.geocode(fullAddress);
                
                if (geocodeResult.success) {
                    clientLocation = {
                        address: geocodeResult.data.address,
                        coordinates: {
                            lat: geocodeResult.data.lat,
                            lng: geocodeResult.data.lng
                        },
                        accuracy: geocodeResult.data.accuracy,
                        confidence: geocodeResult.data.confidence
                    };
                    console.log('✅ Geocoding sukces:', clientLocation);
                } else {
                    console.warn('⚠️ Geocoding nie powiódł się, kontynuuję bez współrzędnych');
                }
            } catch (geocodeError) {
                console.error('❌ Błąd geocodingu:', geocodeError);
                // Nie przerywamy - kontynuujemy bez współrzędnych
            }
        }

        const submitData = {
            ...formData,
            address: fullAddress,
            clientLocation: clientLocation, // ← DODANE: Współrzędne GPS!
            // Dla kompatybilności z API, wysyłamy również stare pola z pierwszego urządzenia
            category: formData.categories[0] || '',
            brand: formData.brands[0] || '',
            device: formData.devices[0] || '',
            problem: formData.problems[0] || '',
            hasBuiltIn: formData.hasBuiltIn[0] || false,
            hasDemontaz: formData.hasDemontaz[0] || false,
            hasMontaz: formData.hasMontaz[0] || false,
            hasTrudnaZabudowa: formData.hasTrudnaZabudowa[0] || false
        };

        try {
            const response = await fetch('/api/rezerwacje', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData)
            });

            console.log('📡 Response status:', response.status);
            const result = await response.json();
            console.log('📦 Response data:', result);
            console.log('📋 Order object:', result.order);
            console.log('📋 Order.orderNumber:', result.order?.orderNumber);
            console.log('📋 Order.orderId:', result.order?.orderId);

            if (response.ok) {
                const deviceCount = formData.categories.length;
                const deviceText = deviceCount === 1 ? 'urządzenie' : deviceCount < 5 ? 'urządzenia' : 'urządzeń';
                const orderNumber = result.order?.orderNumber || 'będzie przydzielony wkrótce';
                
                // Dodaj informację o emailu na podstawie rzeczywistego statusu
                let emailInfo = '';
                console.log('📧 Email status check:', { 
                    hasEmail: !!formData.email, 
                    emailSent: result.emailSent, 
                    emailError: result.emailError 
                });
                
                if (formData.email) {
                    if (result.emailSent === true) {
                        emailInfo = `\n\n📧 ✅ Potwierdzenie wysłane na: ${formData.email}\n(Sprawdź także folder SPAM)`;
                    } else {
                        emailInfo = `\n\n⚠️ Email nie został wysłany\nPowód: ${result.emailError || 'Nieznany błąd'}`;
                    }
                } else {
                    emailInfo = '\n\n💡 Nie podałeś/aś emaila - potwierdzenie nie zostanie wysłane';
                }
                
                const successMessage = `✅ Zgłoszenie na ${deviceCount} ${deviceText} zostało wysłane!\n\n📋 Numer zlecenia: ${orderNumber}${emailInfo}\n\nSkontaktujemy się z Tobą wkrótce!`;
                console.log('✅ Sukces! Ustawiam komunikat:', successMessage);
                setMessage(successMessage);
                
                // Scroll do komunikatu
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 100);
            } else {
                const errorMessage = `❌ Błąd: ${result.message || 'Nie udało się wysłać zgłoszenia'}`;
                console.log('❌ Błąd! Ustawiam komunikat:', errorMessage);
                setMessage(errorMessage);
            }
        } catch (error) {
            console.error('❌ Błąd wysyłania:', error);
            setMessage(`❌ Błąd połączenia: ${error.message}`);
        }

        setIsSubmitting(false);
    };

    const isStepValid = (step) => {
        switch (step) {
            case 1: 
                // Multi-device: musi być wybrana przynajmniej jedna kategoria i każda musi mieć opis problemu
                return formData.categories.length > 0 && 
                       formData.categories.every((_, index) => formData.problems[index]?.trim());
            case 2: return formData.postalCode && formData.city && formData.street;
            case 3: return formData.name && formData.phone;
            case 4: return formData.timeSlot;
            case 5: return true; // Podsumowanie - zawsze valid
            default: return false;
        }
    };

    const goToSummary = () => {
        setShowSummary(true);
        setCurrentStep(5);
    };

    const editStep = (step) => {
        setShowSummary(false);
        setCurrentStep(step);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🛠️ Zamów naprawę AGD
                    </h1>
                    <p className="text-gray-600">Szybko i profesjonalnie</p>
                </div>

                {/* Progress Bar */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        {[1, 2, 3, 4, 5].map((step) => (
                            <div key={step} className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                    currentStep === step 
                                        ? 'bg-blue-600 text-white' 
                                        : currentStep > step 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-gray-200 text-gray-600'
                                }`}>
                                    {currentStep > step ? '✓' : step}
                                </div>
                                {step < 5 && (
                                    <div className={`w-12 h-1 ${currentStep > step ? 'bg-green-500' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>Urządzenie</span>
                        <span>Lokalizacja</span>
                        <span>Kontakt</span>
                        <span>Termin</span>
                        <span>Podsumowanie</span>
                    </div>
                </div>

                {/* Message Display - Na górze */}
                {message && (
                    <div className={`mb-6 p-6 rounded-lg shadow-lg ${
                        message.includes('✅') 
                            ? 'bg-green-50 border-2 border-green-500' 
                            : 'bg-red-50 border-2 border-red-500'
                    }`}>
                        <div className={`text-lg font-semibold mb-2 ${
                            message.includes('✅') ? 'text-green-800' : 'text-red-800'
                        }`}>
                            {message.includes('✅') ? '🎉 Sukces!' : '⚠️ Wystąpił błąd'}
                        </div>
                        <pre className={`whitespace-pre-wrap font-sans ${
                            message.includes('✅') ? 'text-green-700' : 'text-red-700'
                        }`}>{message}</pre>
                    </div>
                )}

                {/* Form Card */}
                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-lg shadow-lg">
                        {/* Step 1: Urządzenie - Multi-select z checkboxami */}
                        {currentStep === 1 && (
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <FiTool className="w-6 h-6 text-blue-600 mr-3" />
                                    <h2 className="text-xl font-semibold text-gray-900">Co naprawiamy?</h2>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Typ urządzenia AGD * (możesz wybrać kilka)
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {[
                                                { value: 'Pralka', icon: '/icons/agd/pralka.svg', label: 'Pralka', desc: 'Automatyczna', color: 'from-blue-400 to-blue-600' },
                                                { value: 'Zmywarka', icon: '/icons/agd/zmywarka.svg', label: 'Zmywarka', desc: 'Do naczyń', color: 'from-cyan-400 to-cyan-600' },
                                                { value: 'Lodówka', icon: '/icons/agd/lodowka.svg', label: 'Lodówka', desc: 'Chłodzenie', color: 'from-indigo-400 to-indigo-600' },
                                                { value: 'Piekarnik', icon: '/icons/agd/piekarnik.svg', label: 'Piekarnik', desc: 'Do pieczenia', color: 'from-orange-400 to-orange-600' },
                                                { value: 'Suszarka', icon: '/icons/agd/suszarka.svg', label: 'Suszarka', desc: 'Do ubrań', color: 'from-purple-400 to-purple-600' },
                                                { value: 'Kuchenka', icon: '/icons/agd/kuchenka.svg', label: 'Kuchenka', desc: 'Gazowa/elektr.', color: 'from-red-400 to-red-600' },
                                                { value: 'Mikrofalówka', icon: '/icons/agd/mikrofalowka.svg', label: 'Mikrofalówka', desc: 'Do podgrzewania', color: 'from-yellow-400 to-yellow-600' },
                                                { value: 'Okap', icon: '/icons/agd/okap.svg', label: 'Okap', desc: 'Wyciąg kuchenny', color: 'from-gray-400 to-gray-600' },
                                                { value: 'Inne AGD', icon: '/icons/agd/inne.svg', label: 'Inne AGD', desc: 'Pozostałe', color: 'from-green-400 to-green-600' },
                                            ].map((option) => (
                                                <label key={option.value} className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all duration-300 transform hover:scale-105 ${
                                                    formData.categories.includes(option.value)
                                                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg' 
                                                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                                                }`}>
                                                    <input
                                                        type="checkbox"
                                                        name="categories"
                                                        value={option.value}
                                                        checked={formData.categories.includes(option.value)}
                                                        onChange={handleCategoryToggle}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br ${option.color} flex items-center justify-center text-white shadow-md p-2`}>
                                                        <img 
                                                            src={option.icon} 
                                                            alt={option.label}
                                                            className="w-8 h-8 filter brightness-0 invert"
                                                        />
                                                    </div>
                                                    <div className="text-sm font-semibold text-gray-800 mb-1">{option.label}</div>
                                                    <div className="text-xs text-gray-500">{option.desc}</div>
                                                    {formData.categories.includes(option.value) && (
                                                        <div className="mt-2 text-blue-600 text-sm font-semibold">✓ Wybrane</div>
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Detale dla każdego wybranego urządzenia */}
                                    {formData.categories.length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                                                Szczegóły urządzeń ({formData.categories.length})
                                            </h3>
                                            {formData.categories.map((category, index) => (
                                                <div key={category} className="border rounded-lg p-4 bg-gray-50">
                                                    <h4 className="text-md font-semibold mb-3 flex items-center">
                                                        <span className="w-6 h-6 mr-2 flex items-center justify-center">
                                                            <img 
                                                                src={`/icons/agd/${category === 'Pralka' ? 'pralka' : category === 'Zmywarka' ? 'zmywarka' : category === 'Lodówka' ? 'lodowka' : category === 'Piekarnik' ? 'piekarnik' : category === 'Suszarka' ? 'suszarka' : category === 'Kuchenka' ? 'kuchenka' : category === 'Mikrofalówka' ? 'mikrofalowka' : category === 'Okap' ? 'okap' : 'inne'}.svg`}
                                                                alt={category}
                                                                className="w-6 h-6"
                                                            />
                                                        </span>
                                                        {category}
                                                    </h4>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Marka
                                                            </label>
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    value={formData.brands[index] || ''}
                                                                    onChange={(e) => handleDeviceDetailChange(index, 'brand', e.target.value)}
                                                                    onFocus={() => setShowBrandSuggestions(index)}
                                                                    onBlur={() => setTimeout(() => setShowBrandSuggestions(null), 200)}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                    placeholder="np. Samsung, Bosch..."
                                                                />
                                                                {showBrandSuggestions === index && (
                                                                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-36 overflow-y-auto">
                                                                        {getFilteredBrands(formData.brands[index] || '').map((brand) => (
                                                                            <button
                                                                                key={brand}
                                                                                type="button"
                                                                                onClick={() => handleBrandSelect(brand, index)}
                                                                                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                                                                            >
                                                                                {brand}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Model (opcjonalnie)
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={formData.devices[index] || ''}
                                                                onChange={(e) => handleDeviceDetailChange(index, 'device', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                placeholder="np. WW80T4020EE"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Przycisk AI Scanner */}
                                                    <div className="mt-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setScanningDeviceIndex(index);
                                                                setShowAIScanner(true);
                                                            }}
                                                            className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-lg hover:from-emerald-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg text-sm"
                                                        >
                                                            🤖 Zeskanuj tabliczkę AI
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="mt-3">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Opis problemu *
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                value={formData.problems[index] || ''}
                                                                onChange={(e) => handleDeviceDetailChange(index, 'problem', e.target.value)}
                                                                onFocus={() => setShowProblemSuggestions(index)}
                                                                onBlur={() => setTimeout(() => setShowProblemSuggestions(null), 200)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                placeholder="Wpisz problem lub wybierz z listy..."
                                                            />
                                                            {showProblemSuggestions === index && (
                                                                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                                                                    {getFilteredProblems(category, formData.problems[index] || '').map((problem, problemIndex) => (
                                                                        <button
                                                                            key={problemIndex}
                                                                            type="button"
                                                                            onClick={() => handleProblemSelect(problem, index)}
                                                                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0"
                                                                        >
                                                                            {problem}
                                                                        </button>
                                                                    ))}
                                                                    {getFilteredProblems(category, formData.problems[index] || '').length === 0 && (
                                                                        <div className="px-3 py-2 text-sm text-gray-500">
                                                                            Brak dopasowań. Wpisz własny opis problemu.
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            💡 Zacznij pisać, a pokażemy typowe usterki
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Dodatkowe informacje o zabudowie i montażu */}
                                    {formData.categories.length > 0 && (
                                        <div className="mt-6 border-t pt-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                                <span className="mr-2">🔧</span>
                                                Informacje o zabudowie
                                            </h3>
                                            <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600 mb-3">
                                                    💡 Ta informacja pomoże nam lepiej przygotować się do naprawy
                                                </p>
                                                
                                                <label className="flex items-start cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.hasBuiltIn[0] || false}
                                                        onChange={(e) => {
                                                            const isChecked = e.target.checked;
                                                            setFormData({
                                                                ...formData, 
                                                                hasBuiltIn: [isChecked],
                                                                hasDemontaz: [isChecked], // Automatycznie zaznacz
                                                                hasMontaz: [isChecked],   // Automatycznie zaznacz
                                                                hasTrudnaZabudowa: formData.hasTrudnaZabudowa // Zostaw jak jest
                                                            });
                                                        }}
                                                        className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                    <span className="ml-3 text-sm">
                                                        <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors text-base">
                                                            Urządzenie w zabudowie
                                                        </span>
                                                        <span className="block text-gray-600 text-xs mt-1">
                                                            Urządzenie jest wbudowane w meble kuchenne (automatycznie oznacza potrzebę demontażu i montażu)
                                                        </span>
                                                    </span>
                                                </label>

                                                {/* Opcjonalna trudna zabudowa */}
                                                {formData.hasBuiltIn[0] && (
                                                    <label className="flex items-start cursor-pointer group ml-8 mt-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.hasTrudnaZabudowa[0] || false}
                                                            onChange={(e) => setFormData({
                                                                ...formData, 
                                                                hasTrudnaZabudowa: [e.target.checked]
                                                            })}
                                                            className="mt-1 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                                        />
                                                        <span className="ml-3 text-sm">
                                                            <span className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                                                                Trudna zabudowa
                                                            </span>
                                                            <span className="block text-gray-600 text-xs mt-0.5">
                                                                Ograniczony dostęp do urządzenia (wąska przestrzeń, trudny dostęp)
                                                            </span>
                                                        </span>
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Lokalizacja */}
                        {currentStep === 2 && (
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <FiMapPin className="w-6 h-6 text-blue-600 mr-3" />
                                    <h2 className="text-xl font-semibold text-gray-900">Gdzie jesteś?</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Kod pocztowy *
                                        </label>
                                        <input
                                            type="text"
                                            name="postalCode"
                                            value={formData.postalCode}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="00-000"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Miasto *
                                        </label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Warszawa"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ulica i numer *
                                        </label>
                                        <input
                                            type="text"
                                            name="street"
                                            value={formData.street}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="ul. Główna 123"
                                        />
                                    </div>

                                    {formData.postalCode && formData.city && formData.street && (
                                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="text-sm text-green-700">
                                                <strong>📍 Twój adres:</strong><br/>
                                                {formData.street}, {formData.postalCode} {formData.city}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Dane kontaktowe */}
                        {currentStep === 3 && (
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <FiUser className="w-6 h-6 text-blue-600 mr-3" />
                                    <h2 className="text-xl font-semibold text-gray-900">Twoje dane</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Imię i nazwisko *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Jan Kowalski"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Telefon *
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="+48 123 456 789"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email (opcjonalnie)
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="jan@example.com"
                                        />
                                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-800 flex items-start">
                                                <span className="mr-2 mt-0.5">📧</span>
                                                <span>
                                                    <strong>Podaj email, a otrzymasz:</strong><br/>
                                                    • Potwierdzenie rezerwacji z numerem zamówienia<br/>
                                                    • Link do sprawdzenia statusu online<br/>
                                                    • Wszystkie ważne informacje o wizycie
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Dostępność */}
                        {currentStep === 4 && (
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <FiClock className="w-6 h-6 text-blue-600 mr-3" />
                                    <h2 className="text-xl font-semibold text-gray-900">Kiedy jesteś dostępny?</h2>
                                </div>

                                {/* Banner informacyjny - elegancki */}
                                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                    <div className="flex items-start">
                                        <span className="text-2xl mr-3 mt-0.5">💡</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-900 mb-2">
                                                Im większa elastyczność terminowa, tym szybciej do Ciebie dotrzemy!
                                            </p>
                                            {availabilityData ? (
                                                <div className="flex items-center gap-2 text-xs text-green-600">
                                                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                    <span className="font-medium">Czasy oczekiwania obliczone na podstawie aktualnego obłożenia dla Twojej lokalizacji</span>
                                                </div>
                                            ) : loadingAvailability ? (
                                                <div className="flex items-center gap-2 text-xs text-blue-600">
                                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                                    <span>Obliczam dostępność...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-4 text-xs text-gray-600">
                                                    <div className="flex items-center">
                                                        <span className="font-bold text-gray-900 mr-1">24h</span>
                                                        <span>- Cały dzień</span>
                                                    </div>
                                                    <span className="text-gray-400">→</span>
                                                    <div className="flex items-center">
                                                        <span className="font-bold text-gray-900 mr-1">2-3 dni</span>
                                                        <span>- Konkretne godziny</span>
                                                    </div>
                                                    <span className="text-gray-400">→</span>
                                                    <div className="flex items-center">
                                                        <span className="font-bold text-gray-900 mr-1">5 dni</span>
                                                        <span>- Po 15:00</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Preferowany przedział czasowy *
                                        </label>
                                        <div className="grid grid-cols-3 gap-2 mb-3">
                                            {[
                                                { 
                                                    value: 'Cały dzień', 
                                                    label: 'Cały dzień', 
                                                    icon: '⏰', 
                                                    time: '8:00-20:00', 
                                                    recommended: true, 
                                                    waitTime: 'Do 24h!', 
                                                    badge: '⭐ POLECAMY', 
                                                    popularity: 20,
                                                    benefit: 'Najszybsza realizacja',
                                                    tooltip: 'Możemy dopasować nasz grafik do Twojej dostępności - to najszybsza opcja!'
                                                },
                                                { 
                                                    value: '8:00-12:00', 
                                                    label: 'Rano', 
                                                    icon: '🌅', 
                                                    time: '8:00-12:00', 
                                                    waitTime: 'Do 2 dni', 
                                                    popularity: 40,
                                                    benefit: 'Dobra dostępność',
                                                    tooltip: 'Poranne godziny są popularne, ale wciąż mamy dużo wolnych terminów'
                                                },
                                                { 
                                                    value: '12:00-16:00', 
                                                    label: 'Popołudnie', 
                                                    icon: '☀️', 
                                                    time: '12:00-16:00', 
                                                    waitTime: 'Do 2 dni', 
                                                    popularity: 60,
                                                    benefit: 'Średnia dostępność',
                                                    tooltip: 'Popularne godziny - może wydłużyć czas oczekiwania'
                                                },
                                                { 
                                                    value: '16:00-20:00', 
                                                    label: 'Wieczór', 
                                                    icon: '🌆', 
                                                    time: '16:00-20:00', 
                                                    waitTime: 'Do 3 dni', 
                                                    popularity: 75,
                                                    benefit: 'Ograniczona dostępność',
                                                    tooltip: 'Bardzo popularne godziny - często wydłuża czas oczekiwania o 1-2 dni'
                                                },
                                                { 
                                                    value: 'Weekend', 
                                                    label: 'Weekend', 
                                                    icon: '📅', 
                                                    time: 'Sobota/Niedziela', 
                                                    waitTime: 'Do 4 dni', 
                                                    popularity: 85,
                                                    benefit: 'Weekendowa naprawa',
                                                    tooltip: 'Ograniczona liczba ekip pracujących w weekend'
                                                },
                                                { 
                                                    value: 'Po 15:00', 
                                                    label: 'Po 15:00', 
                                                    icon: '🌙', 
                                                    time: 'Późne popołudnie', 
                                                    waitTime: 'Do 5 dni', 
                                                    warning: true, 
                                                    badge: '⚠️ DUŻE OBŁOŻENIE', 
                                                    popularity: 95,
                                                    benefit: 'Najdłuższy czas oczekiwania',
                                                    tooltip: 'To najczęściej wybierany przedział - może znacznie wydłużyć realizację'
                                                }
                                            ].map((option) => {
                                                // Nadpisz dane z API jeśli są dostępne
                                                const dynamicData = availabilityData && availabilityData[option.value];
                                                if (dynamicData) {
                                                    option.popularity = dynamicData.popularity;
                                                    option.waitTime = dynamicData.waitTime;
                                                    option.waitDays = dynamicData.waitDays;
                                                }

                                                const isSelected = formData.timeSlot === option.value;
                                                const baseClasses = 'cursor-pointer border rounded-lg transition-all duration-200 relative overflow-hidden';
                                                
                                                // Kolory w zależności od typu opcji - subtelne
                                                let colorClasses = '';
                                                if (option.recommended) {
                                                    colorClasses = isSelected 
                                                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                                                        : 'border-blue-300 hover:border-blue-400 bg-white hover:shadow-md hover:ring-1 hover:ring-blue-200';
                                                } else if (option.warning) {
                                                    colorClasses = isSelected 
                                                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                                                        : 'border-gray-300 hover:border-gray-400 bg-white hover:shadow-sm';
                                                } else {
                                                    colorClasses = isSelected 
                                                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                                                        : 'border-gray-300 hover:border-gray-400 bg-white hover:shadow-sm';
                                                }

                                                // Kompaktowy rozmiar dla wszystkich
                                                const sizeClasses = 'p-3';

                                                return (
                                                    <label key={option.value} className={`${baseClasses} ${colorClasses} ${sizeClasses} group`}>
                                                        <input
                                                            type="radio"
                                                            name="timeSlot"
                                                            value={option.value}
                                                            checked={isSelected}
                                                            onChange={handleChange}
                                                            className="sr-only"
                                                        />
                                                        
                                                        {/* Badge w rogu - kompaktowy */}
                                                        {option.badge && (
                                                            <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs font-bold whitespace-nowrap z-10 ${
                                                                option.recommended 
                                                                    ? 'bg-blue-500 text-white' 
                                                                    : 'bg-gray-500 text-white'
                                                            }`}>
                                                                {option.recommended ? '⭐' : '⚠️'}
                                                            </div>
                                                        )}

                                                        <div className="text-center relative z-10">
                                                            {/* Ikona i tytuł w jednej linii dla małych kart */}
                                                            <div className="flex flex-col items-center">
                                                                <div className="text-2xl mb-1">{option.icon}</div>
                                                                <div className="font-semibold text-gray-800 text-sm">
                                                                    {option.label}
                                                                </div>
                                                                <div className="text-xs text-gray-500">{option.time}</div>
                                                            </div>
                                                            
                                                            {/* Progress bar - kompaktowy */}
                                                            {option.popularity && (
                                                                <div className="mt-2">
                                                                    <div className="flex items-center justify-between text-xs mb-0.5">
                                                                        <span className="text-gray-500 text-xs">Obłożenie</span>
                                                                        <span className="font-semibold text-gray-700 text-xs">
                                                                            {option.popularity}%
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                                                                        <div 
                                                                            className="h-full transition-all duration-500 rounded-full bg-gray-700"
                                                                            style={{ width: `${option.popularity}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {/* Czas oczekiwania */}
                                                            {option.waitTime && (
                                                                <div className={`mt-2 text-xs font-bold ${
                                                                    option.recommended ? 'text-blue-600' : 'text-gray-700'
                                                                }`}>
                                                                    ⏱️ {option.waitTime}
                                                                </div>
                                                            )}

                                                            {isSelected && (
                                                                <div className="mt-1 text-xs font-semibold text-blue-600">
                                                                    ✓ Wybrane
                                                                </div>
                                                            )}
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>

                                        {/* Kompaktowa zachęta */}
                                        <div className="mt-3 p-2 bg-gray-50 rounded-lg text-center text-xs text-gray-600">
                                            💡 Elastyczne terminy = Szybsza realizacja
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Dodatkowe uwagi (opcjonalnie)
                                        </label>
                                        <textarea
                                            name="additionalNotes"
                                            value={formData.additionalNotes}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="np. Najlepiej dzwonić wieczorem..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 5: Podsumowanie */}
                        {currentStep === 5 && (
                            <div className="p-6">
                                <div className="flex items-center mb-6">
                                    <FiCheck className="w-6 h-6 text-blue-600 mr-3" />
                                    <h2 className="text-xl font-semibold text-gray-900">Podsumowanie zgłoszenia</h2>
                                </div>

                                <div className="space-y-6">
                                    {/* Urządzenia - multi-device */}
                                    <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 mb-3">
                                                    🔧 Urządzenia do naprawy ({formData.categories.length})
                                                </h3>
                                                <div className="space-y-3">
                                                    {formData.categories.map((category, index) => (
                                                        <div key={category} className="pl-3 border-l-2 border-blue-300">
                                                            <div className="text-sm text-gray-700">
                                                                <div className="font-semibold mb-1 flex items-center">
                                                                    <img 
                                                                        src={`/icons/agd/${category === 'Pralka' ? 'pralka' : category === 'Zmywarka' ? 'zmywarka' : category === 'Lodówka' ? 'lodowka' : category === 'Piekarnik' ? 'piekarnik' : category === 'Suszarka' ? 'suszarka' : category === 'Kuchenka' ? 'kuchenka' : category === 'Mikrofalówka' ? 'mikrofalowka' : category === 'Okap' ? 'okap' : 'inne'}.svg`}
                                                                        alt={category}
                                                                        className="w-4 h-4 mr-1"
                                                                    />
                                                                    {category}
                                                                    {(formData.brands[index] || formData.devices[index]) && ' - '}
                                                                    {formData.brands[index] && `${formData.brands[index]} `}
                                                                    {formData.devices[index]}
                                                                </div>
                                                                <div className="text-gray-600">
                                                                    <strong>Problem:</strong> {formData.problems[index] || 'Nie opisano'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Informacje o zabudowie */}
                                                {formData.hasBuiltIn[0] && (
                                                    <div className="mt-4 pt-3 border-t border-blue-200">
                                                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                                                            🔧 Informacje o zabudowie:
                                                        </h4>
                                                        <div className="text-sm text-gray-700">
                                                            <div className="flex items-center mb-1">
                                                                <span className="text-blue-600 mr-2">✓</span>
                                                                <span className="font-medium">Urządzenie w zabudowie</span>
                                                            </div>
                                                            <div className="ml-6 text-xs text-gray-600">
                                                                (wymaga demontażu i montażu{formData.hasTrudnaZabudowa[0] ? ', trudna zabudowa - ograniczony dostęp' : ''})
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => editStep(1)}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                                Edytuj
                                            </button>
                                        </div>
                                    </div>

                                    {/* Lokalizacja */}
                                    <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 mb-2">📍 Lokalizacja</h3>
                                                <div className="space-y-1 text-sm text-gray-700">
                                                    <div>{formData.street}</div>
                                                    <div>{formData.postalCode} {formData.city}</div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => editStep(2)}
                                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                                            >
                                                Edytuj
                                            </button>
                                        </div>
                                    </div>

                                    {/* Dane kontaktowe */}
                                    <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 mb-2">👤 Dane kontaktowe</h3>
                                                <div className="space-y-1 text-sm text-gray-700">
                                                    <div><strong>Imię i nazwisko:</strong> {formData.name}</div>
                                                    <div><strong>Telefon:</strong> {formData.phone}</div>
                                                    {formData.email && <div><strong>Email:</strong> {formData.email}</div>}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => editStep(3)}
                                                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                            >
                                                Edytuj
                                            </button>
                                        </div>
                                    </div>

                                    {/* Dostępność */}
                                    <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 mb-2">🕒 Dostępność</h3>
                                                <div className="space-y-1 text-sm text-gray-700">
                                                    <div><strong>Preferowany czas:</strong> {formData.timeSlot}</div>
                                                    {formData.additionalNotes && (
                                                        <div><strong>Uwagi:</strong> {formData.additionalNotes}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => editStep(4)}
                                                className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                                            >
                                                Edytuj
                                            </button>
                                        </div>
                                    </div>

                                    {/* Info box */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-start">
                                            <div className="text-3xl mr-3">ℹ️</div>
                                            <div className="text-sm text-gray-700">
                                                <p className="font-semibold mb-1">Sprawdź dokładnie wszystkie dane przed wysłaniem.</p>
                                                <p>Po kliknięciu "Wyślij zgłoszenie" utworzymy dla Ciebie zlecenie i wkrótce się z Tobą skontaktujemy.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="border-t p-6 flex justify-between">
                            {currentStep > 1 && currentStep < 5 && (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="flex items-center px-6 py-3 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
                                >
                                    <FiArrowLeft className="mr-2" />
                                    Wstecz
                                </button>
                            )}

                            {currentStep < 4 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={!isStepValid(currentStep)}
                                    className={`flex items-center px-6 py-3 rounded-lg font-medium ml-auto ${
                                        isStepValid(currentStep)
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    Dalej
                                    <FiArrowRight className="ml-2" />
                                </button>
                            ) : currentStep === 4 ? (
                                <button
                                    type="button"
                                    onClick={goToSummary}
                                    disabled={!isStepValid(currentStep)}
                                    className={`flex items-center px-6 py-3 rounded-lg font-medium ml-auto ${
                                        isStepValid(currentStep)
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    Przejdź do podsumowania
                                    <FiArrowRight className="ml-2" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`flex items-center justify-center w-full px-6 py-4 rounded-lg font-semibold text-lg ${
                                        !isSubmitting
                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3" />
                                            Wysyłam zgłoszenie...
                                        </>
                                    ) : (
                                        <>
                                            <FiCheck className="mr-3 text-xl" />
                                            Wyślij zgłoszenie
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            {/* Modal AI Scanner */}
            {showAIScanner && (
                <ModelAIScanner
                    isOpen={showAIScanner}
                    onClose={() => {
                        setShowAIScanner(false);
                        setScanningDeviceIndex(null);
                    }}
                    onModelDetected={handleAIModelDetected}
                />
            )}

            {/* Custom animations */}
            <style jsx>{`
                @keyframes bounce-slow {
                    0%, 100% {
                        transform: translateY(0) translateX(-50%);
                    }
                    50% {
                        transform: translateY(-5px) translateX(-50%);
                    }
                }
                
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .animate-bounce-slow {
                    animation: bounce-slow 2s ease-in-out infinite;
                }

                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }

                .hover\:scale-102:hover {
                    transform: scale(1.02);
                }

                .hover\:scale-105:hover {
                    transform: scale(1.05);
                }

                /* Smooth scroll dla progress bara */
                .transition-all {
                    transition-property: all;
                    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
                }
            `}</style>
        </div>
    );
}
