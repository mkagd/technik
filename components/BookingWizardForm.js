import React, { useState, useRef, useEffect } from 'react';
import { FaMapMarkerAlt, FaPhone, FaCheckCircle, FaUndo, FaCalendarAlt, FaTools, FaShieldAlt, FaClock, FaWrench, FaLightbulb, FaTint, FaCouch, FaSpinner, FaCog, FaHome, FaPlug, FaPaintRoller, FaBolt, FaFaucet, FaChevronRight } from 'react-icons/fa';
import Calendar from 'react-calendar';
import { format, addDays, isSameDay, isToday, isTomorrow } from 'date-fns';
import { pl } from 'date-fns/locale';

const BookingWizardForm = () => {
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [reportNumber, setReportNumber] = useState('');

  // Stan dla autouzupełniania adresów
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const addressInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Funkcja pobierania sugestii adresów z Nominatim API
  const fetchAddressSuggestions = async (query) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingAddresses(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}, Polska`);
      const data = await response.json();

      const suggestions = data.map(item => ({
        display_name: item.display_name,
        address: `${item.address?.road || ''} ${item.address?.house_number || ''}`.trim() || item.display_name,
        city: item.address?.city || item.address?.town || item.address?.village || '',
        postcode: item.address?.postcode || ''
      }));

      setAddressSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Błąd podczas pobierania adresów:', error);
      setAddressSuggestions([]);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  // Obsługa zmian w polu adresu
  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);
    fetchAddressSuggestions(value);
  };

  // Obsługa wyboru adresu z listy
  const handleAddressSelect = (suggestion) => {
    setAddress(suggestion.address + (suggestion.city ? `, ${suggestion.city}` : ''));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  // Obsługa klikania poza sugestiami
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
        addressInputRef.current && !addressInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Kategorie usług inspirowane usterka.pl
  const categories = [
    {
      id: 'popularne',
      name: 'Popularne',
      icon: FaHome,
      color: 'blue',
      services: [
        { id: 'zmywarka', name: 'Naprawa zmywarek', price: 219, refs: '10 056', realizations: '8282', specialists: 52 },
        { id: 'pralka', name: 'Naprawa pralek', price: 219, refs: '9113', realizations: '8657', specialists: 72 },
        { id: 'elektryk-basic', name: 'Elektryk', price: 299, refs: '3884', realizations: '2745', specialists: 68 }
      ]
    },
    {
      id: 'naprawa-agd',
      name: 'Naprawa AGD',
      icon: FaCog,
      color: 'orange',
      services: [
        { id: 'lodowka', name: 'Naprawa lodówek', price: 189, refs: '4521', realizations: '3890', specialists: 45 },
        { id: 'piekarnik', name: 'Naprawa piekarników', price: 249, refs: '3120', realizations: '2654', specialists: 38 },
        { id: 'mikrofalowka', name: 'Naprawa mikrofalówek', price: 159, refs: '2890', realizations: '2234', specialists: 29 }
      ]
    },
    {
      id: 'elektryk',
      name: 'Elektryk',
      icon: FaBolt,
      color: 'yellow',
      services: [
        { id: 'instalacja', name: 'Instalacje elektryczne', price: 350, refs: '5234', realizations: '4123', specialists: 89 },
        { id: 'kontakty', name: 'Montaż kontaktów', price: 120, refs: '2890', realizations: '2654', specialists: 67 },
        { id: 'oswietlenie', name: 'Montaż oświetlenia', price: 180, refs: '3456', realizations: '2890', specialists: 54 }
      ]
    },
    {
      id: 'hydraulik',
      name: 'Hydraulik',
      icon: FaFaucet,
      color: 'blue',
      services: [
        { id: 'kran', name: 'Wymiana kranów', price: 150, refs: '4567', realizations: '3890', specialists: 78 },
        { id: 'rury', name: 'Naprawa rur', price: 200, refs: '3234', realizations: '2567', specialists: 65 },
        { id: 'toaleta', name: 'Naprawa toalet', price: 180, refs: '2890', realizations: '2234', specialists: 43 }
      ]
    },
    {
      id: 'slusarskie',
      name: 'Usługi ślusarskie',
      icon: FaTools,
      color: 'gray',
      services: [
        { id: 'zamki', name: 'Wymiana zamków', price: 189, refs: '2567', realizations: '1890', specialists: 34 },
        { id: 'klucze', name: 'Dorabianie kluczy', price: 80, refs: '1890', realizations: '1567', specialists: 28 },
        { id: 'drzwi', name: 'Regulacja drzwi', price: 120, refs: '2234', realizations: '1789', specialists: 31 }
      ]
    },
    {
      id: 'kuchenki',
      name: 'Kuchenki gazowe i usługi gazowe',
      icon: FaPlug,
      color: 'red',
      services: [
        { id: 'kuchenka-gaz', name: 'Naprawa kuchenek gazowych', price: 229, refs: '1890', realizations: '1456', specialists: 23 },
        { id: 'instalacja-gaz', name: 'Instalacje gazowe', price: 399, refs: '1234', realizations: '987', specialists: 18 },
        { id: 'podlaczenie-gaz', name: 'Podłączenie gazu', price: 189, refs: '1567', realizations: '1234', specialists: 21 }
      ]
    },
    {
      id: 'zlota-raczka',
      name: 'Złota rączka',
      icon: FaWrench,
      color: 'green',
      services: [
        { id: 'montaz-mebli', name: 'Montaż mebli', price: 150, refs: '3456', realizations: '2890', specialists: 56 },
        { id: 'wieszanie-obrazow', name: 'Wieszanie obrazów', price: 80, refs: '2123', realizations: '1789', specialists: 42 },
        { id: 'drobne-naprawy', name: 'Drobne naprawy', price: 120, refs: '2890', realizations: '2234', specialists: 38 }
      ]
    },
    {
      id: 'skrecanie-mebli',
      name: 'Skręcanie mebli',
      icon: FaCouch,
      color: 'purple',
      services: [
        { id: 'ikea', name: 'Montaż mebli IKEA', price: 99, refs: '4567', realizations: '3890', specialists: 67 },
        { id: 'szafy', name: 'Montaż szaf', price: 189, refs: '2890', realizations: '2345', specialists: 45 },
        { id: 'komody', name: 'Montaż komód', price: 129, refs: '2345', realizations: '1890', specialists: 38 }
      ]
    },
    {
      id: 'udroznieniai-rur',
      name: 'Udrażnianie rur',
      icon: FaTint,
      color: 'cyan',
      services: [
        { id: 'zlew', name: 'Udrożnienie zlewu', price: 189, refs: '2890', realizations: '2234', specialists: 43 },
        { id: 'wc', name: 'Udrożnienie WC', price: 229, refs: '2456', realizations: '1890', specialists: 38 },
        { id: 'rury-kanalizacyjne', name: 'Udrożnienie kanalizacji', price: 299, refs: '1890', realizations: '1456', specialists: 29 }
      ]
    }
  ];

  const timeSlots = [
    '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  const getSelectedService = () => {
    if (!selectedCategory || !selectedService) return null;
    const category = categories.find(cat => cat.id === selectedCategory);
    return category?.services.find(service => service.id === selectedService);
  };

  const calculatePrice = () => {
    const service = getSelectedService();
    if (!service) return 0;

    let basePrice = service.price;
    let surcharge = 0;

    if (selectedTime && parseInt(selectedTime.split(':')[0]) >= 16) {
      surcharge += 30; // Dopłata za godziny wieczorne
    }

    if (selectedDate && isTomorrow(selectedDate)) {
      surcharge += 50; // Dopłata za ekspres (następny dzień)
    }

    return basePrice + surcharge;
  };

  const formatPrice = (price) => {
    return `${price},00 zł`;
  };

  const nextStep = async () => {
    if (step === 4) {
      // Przed przejściem do kroku 5 - zapisz dane i wygeneruj numer zgłoszenia
      try {
        // Import dataManager dynamicznie (dla komponentu klienta)
        const { dataManager } = await import('../utils/dataManager');

        // Generuj numer zgłoszenia
        const reportNumber = dataManager.getNextReportNumber();

        // Przygotuj dane rezerwacji
        const bookingData = {
          id: Date.now(),
          reportNumber: reportNumber,
          type: 'wizard',
          address: address,
          phone: phone,
          category: selectedCategory,
          service: getSelectedService()?.name,
          servicePrice: getSelectedService()?.price,
          date: selectedDate ? selectedDate.toISOString() : null,
          selectedTime: selectedTime,
          totalPrice: calculatePrice(),
          createdAt: new Date().toISOString(),
          status: 'pending',
          orderNumber: null // będzie nadany przy zmianie statusu na "w realizacji"
        };

        // Zapisz do localStorage
        const existingBookings = JSON.parse(localStorage.getItem('wizardBookings') || '[]');
        existingBookings.push(bookingData);
        localStorage.setItem('wizardBookings', JSON.stringify(existingBookings));

        // Zapisz numer zgłoszenia do stanu
        setReportNumber(reportNumber);

        console.log('Zapisano rezerwację z numerem:', reportNumber);
      } catch (error) {
        console.error('Błąd podczas zapisywania rezerwacji:', error);
      }
    }

    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return address !== '' && phone !== '';
      case 2: return selectedCategory !== '';
      case 3: return selectedService !== '';
      case 4: return selectedDate !== null && selectedTime !== '';
      default: return true;
    }
  };

  const getColorClasses = (color, isSelected = false) => {
    const colors = {
      blue: isSelected ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
      orange: isSelected ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100',
      yellow: isSelected ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
      red: isSelected ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100',
      green: isSelected ? 'bg-green-500 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100',
      purple: isSelected ? 'bg-purple-500 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100',
      gray: isSelected ? 'bg-gray-500 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100',
      cyan: isSelected ? 'bg-cyan-500 text-white' : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4">

        {/* Pasek postępu */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${step >= stepNumber
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-500'
                  }`}>
                  {stepNumber}
                </div>
                {stepNumber < 5 && (
                  <div className={`h-1 w-12 mx-2 transition-all duration-300 ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-gray-600 font-medium">
              {step === 1 && 'Dane kontaktowe'}
              {step === 2 && 'Wybierz kategorię'}
              {step === 3 && 'Wybierz usługę'}
              {step === 4 && 'Wybierz termin'}
              {step === 5 && 'Potwierdzenie'}
            </p>
          </div>
        </div>

        {/* Krok 1: Dane kontaktowe z lokalizacją */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <div className="relative mb-6">
                  <input
                    type="text"
                    placeholder="Szukaj usług"
                    className="w-full p-4 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <label className="block font-medium mb-2 text-gray-700">
                    Kod pocztowy
                  </label>
                  <input
                    ref={addressInputRef}
                    type="text"
                    value={address}
                    onChange={handleAddressChange}
                    placeholder="np. 39-200"
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />

                  {/* Lista sugestii adresów */}
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-60 overflow-y-auto"
                    >
                      {addressSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-200"
                          onClick={() => handleAddressSelect(suggestion)}
                        >
                          <div className="font-medium text-gray-800">{suggestion.address}</div>
                          {suggestion.city && (
                            <div className="text-sm text-gray-600">{suggestion.city}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Loading spinner */}
                  {isLoadingAddresses && (
                    <div className="absolute right-3 top-12 text-blue-500">
                      <FaSpinner className="animate-spin" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-medium mb-2 text-gray-700">
                    Numer telefonu
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+48 123 456 789"
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Krok 2: Wybór kategorii */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Wybierz kategorię</h2>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map((category) => {
                  const IconComponent = category.icon;
                  const isSelected = selectedCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`p-6 rounded-xl border-2 transition-all duration-200 text-left group ${isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                        }`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-200 ${getColorClasses(category.color, isSelected)
                          }`}>
                          <IconComponent className="text-xl" />
                        </div>
                        <h3 className="font-medium text-gray-800 text-sm leading-tight">
                          {category.name}
                        </h3>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Krok 3: Lista usług w kategorii */}
        {step === 3 && selectedCategory && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {categories.find(cat => cat.id === selectedCategory)?.name}
              </h2>
            </div>

            <div className="p-8">
              <div className="space-y-4">
                {categories.find(cat => cat.id === selectedCategory)?.services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => setSelectedService(service.id)}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer ${selectedService === service.id
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">!</span>
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-800">{service.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>5,9/6 ★ {service.refs} referencji i {service.realizations} zdjęć realizacji</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              Liczba realizacji: {service.realizations}
                            </div>
                            <div className="text-sm text-gray-600">
                              {service.specialists} dostępnych fachowców
                            </div>
                            <div className="text-blue-600 text-sm font-medium mt-1">
                              Ostatnie realizacje
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-1">Od</div>
                        <div className="text-2xl font-bold text-gray-800">{formatPrice(service.price)}</div>
                        <div className="text-sm text-green-600 font-medium">Elastyczna zmiana terminu</div>
                        <button className="mt-3 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors">
                          Wybierz termin
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Krok 4: Wybór terminu */}
        {step === 4 && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Wybierz termin</h2>

            {/* Podsumowanie usługi */}
            {getSelectedService() && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-800">
                    Usługa: {getSelectedService().name}
                  </span>
                  <span className="font-bold text-blue-800">
                    Aktualna cena: {formatPrice(calculatePrice())}
                  </span>
                </div>
                {selectedDate && isTomorrow(selectedDate) && (
                  <div className="mt-2 text-sm text-red-600">
                    <FaClock className="inline mr-1" />
                    Usługa ekspresowa: +50 zł
                  </div>
                )}
                {selectedTime && parseInt(selectedTime.split(':')[0]) >= 16 && (
                  <div className="mt-1 text-sm text-red-600">
                    <FaClock className="inline mr-1" />
                    Godziny wieczorne: +30 zł
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Kalendarz */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Wybierz datę</h3>
                <div className="custom-calendar">
                  <Calendar
                    onChange={setSelectedDate}
                    value={selectedDate}
                    minDate={new Date()}
                    locale="pl"
                    tileDisabled={({ date }) => date.getDay() === 0}
                    tileClassName={({ date }) => {
                      let classes = [];
                      if (isToday(date)) classes.push('today');
                      if (isTomorrow(date)) classes.push('tomorrow');
                      if (selectedDate && isSameDay(date, selectedDate)) classes.push('selected');
                      return classes.join(' ');
                    }}
                    formatMonthYear={(locale, date) => format(date, 'LLLL yyyy', { locale: pl })}
                    formatShortWeekday={(locale, date) => format(date, 'EEE', { locale: pl })}
                  />
                </div>
              </div>

              {/* Godziny */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Wybierz godzinę</h3>
                {selectedDate ? (
                  <div className="grid grid-cols-3 gap-3">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-3 rounded-xl font-medium transition-all duration-200 ${selectedTime === time
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700'
                          }`}
                      >
                        {time}
                        {parseInt(time.split(':')[0]) >= 16 && (
                          <div className="text-xs mt-1 opacity-75">+30 zł</div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    Najpierw wybierz datę
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Krok 5: Potwierdzenie */}
        {step === 5 && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="text-3xl text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">Rezerwacja złożona!</h2>
              <p className="text-gray-600 mt-2">Dziękujemy za wybór naszych usług</p>
            </div>

            {/* Numer zgłoszenia */}
            {reportNumber && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-blue-600 mb-1">Numer zgłoszenia:</p>
                  <p className="text-xl font-bold text-blue-900">{reportNumber}</p>
                  <p className="text-xs text-blue-500 mt-1">Zachowaj ten numer do kontaktu z nami</p>
                </div>
              </div>
            )}

            {/* Podsumowanie rezerwacji */}
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl mb-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4">Podsumowanie rezerwacji</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Kod pocztowy:</span>
                  <span className="font-medium text-gray-800">{address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Telefon:</span>
                  <span className="font-medium text-gray-800">{phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Usługa:</span>
                  <span className="font-medium text-gray-800">{getSelectedService()?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Termin:</span>
                  <span className="font-medium text-gray-800">
                    {selectedDate && format(selectedDate, 'dd.MM.yyyy', { locale: pl })} o {selectedTime}
                  </span>
                </div>

                {/* Rozbicie ceny */}
                <div className="border-t pt-3 mt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Cena bazowa:</span>
                    <span>{formatPrice(getSelectedService()?.price)}</span>
                  </div>
                  {selectedDate && isTomorrow(selectedDate) && (
                    <div className="flex justify-between text-red-600">
                      <span>Usługa ekspresowa:</span>
                      <span>+50,00 zł</span>
                    </div>
                  )}
                  {selectedTime && parseInt(selectedTime.split(':')[0]) >= 16 && (
                    <div className="flex justify-between text-red-600">
                      <span>Godziny wieczorne:</span>
                      <span>+30,00 zł</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2 flex justify-between text-lg font-bold">
                    <span>Łączna cena:</span>
                    <span className="text-green-600">{formatPrice(calculatePrice())}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 p-6 rounded-xl mb-6">
              <div className="flex items-center justify-center gap-2 text-green-700 font-semibold">
                <FaPhone />
                <span>Skontaktujemy się z Tobą w ciągu 24 godzin</span>
              </div>
            </div>

            <button
              onClick={() => {
                setStep(1);
                setAddress('');
                setPhone('');
                setSelectedDate(null);
                setSelectedTime('');
                setSelectedCategory('');
                setSelectedService('');
                setReportNumber('');
                setAddressSuggestions([]);
                setShowSuggestions(false);
              }}
              className="mt-6 bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:bg-gray-700 flex items-center justify-center gap-2 mx-auto"
            >
              <FaUndo />
              Nowa rezerwacja
            </button>
          </div>
        )}

        {/* Przyciski nawigacji */}
        {step < 5 && (
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="bg-gray-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:bg-gray-600 flex items-center gap-2"
              >
                <FaUndo />
                Wstecz
              </button>
            )}

            <button
              onClick={nextStep}
              disabled={!isStepValid()}
              className={`ml-auto px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${isStepValid()
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              {step === 1 ? 'Rozpocznij' : 'Dalej'}
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingWizardForm;
