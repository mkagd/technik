import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FiArrowLeft, 
  FiPackage, 
  FiUpload,
  FiX,
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle,
  FiImage,
  FiMapPin
} from 'react-icons/fi';
import FlexibleAvailabilitySelector from '../../components/FlexibleAvailabilitySelector';

/**
 * New Order Form
 * Formularz zgłoszenia nowej naprawy AGD
 */
export default function NewOrder() {
  const router = useRouter();
  
  const [client, setClient] = useState(null);
  const [step, setStep] = useState(1); // 1: Urządzenie, 2: Problem, 3: Termin, 4: Adres
  
  const [formData, setFormData] = useState({
    deviceType: '',
    brand: '',
    model: '',
    serialNumber: '',
    issueDescription: '',
    priority: 'normal',
    preferredDate: '',
    preferredTime: '',
    notes: '',
    // Nowy adres naprawy
    useCustomAddress: false,
    customAddress: {
      street: '',
      buildingNumber: '',
      apartmentNumber: '',
      city: '',
      postalCode: ''
    },
    // Dostępność fizyczna - elastyczne sloty czasowe
    availabilitySlots: []
  });
  
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [newOrderId, setNewOrderId] = useState(null);

  // Typy urządzeń AGD
  const deviceTypes = [
    'Lodówka',
    'Pralka',
    'Zmywarka',
    'Piekarnik',
    'Mikrofalówka',
    'Okap',
    'Płyta indukcyjna',
    'Suszarka',
    'Zamrażarka',
    'Ekspres do kawy',
    'Inne'
  ];

  // Popularne marki
  const brands = [
    'Bosch',
    'Samsung',
    'LG',
    'Whirlpool',
    'Electrolux',
    'Beko',
    'Siemens',
    'Amica',
    'Sharp',
    'Indesit',
    'Hotpoint',
    'Candy',
    'Gorenje',
    'Inne'
  ];

  // Sprawdź token i pobierz dane klienta
  useEffect(() => {
    const token = localStorage.getItem('clientToken');
    const clientData = localStorage.getItem('clientData');
    
    if (!token || !clientData) {
      router.push('/client/login');
      return;
    }

    try {
      setClient(JSON.parse(clientData));
    } catch (err) {
      console.error('Error parsing client data:', err);
      router.push('/client/login');
    }
  }, [router]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  // Handle photo upload
  // Kompresja zdjęcia przed dodaniem
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Twórz canvas do kompresji
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Maksymalne wymiary (1920x1080)
          let width = img.width;
          let height = img.height;
          const maxWidth = 1920;
          const maxHeight = 1080;
          
          // Zachowaj proporcje
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Rysuj obraz w zmniejszonej rozdzielczości
          ctx.drawImage(img, 0, 0, width, height);
          
          // Konwertuj do base64 z kompresją (0.7 = 70% jakości)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (photos.length + files.length > 5) {
      setError('Możesz dodać maksymalnie 5 zdjęć');
      return;
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Rozmiar zdjęcia nie może przekraczać 5MB');
        continue;
      }

      try {
        // Kompresuj zdjęcie
        const compressedUrl = await compressImage(file);
        
        setPhotos(prev => [...prev, {
          url: compressedUrl,
          file: file
        }]);
      } catch (err) {
        console.error('Error compressing image:', err);
        setError('Błąd podczas przetwarzania zdjęcia');
      }
    }
  };

  // Remove photo
  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Walidacja kroku 1
  const validateStep1 = () => {
    if (!formData.deviceType) {
      setError('Wybierz typ urządzenia');
      return false;
    }
    if (!formData.brand) {
      setError('Wybierz markę');
      return false;
    }
    return true;
  };

  // Walidacja kroku 2
  const validateStep2 = () => {
    if (!formData.issueDescription.trim()) {
      setError('Opisz problem z urządzeniem');
      return false;
    }
    if (formData.issueDescription.length < 10) {
      setError('Opis problemu powinien mieć minimum 10 znaków');
      return false;
    }
    return true;
  };

  // Walidacja kroku 4
  const validateStep4 = () => {
    if (!formData.useCustomAddress) return true; // Jeśli nie używa custom address, OK
    
    // Walidacja custom address
    if (!formData.customAddress.street.trim()) {
      setError('Podaj ulicę');
      return false;
    }
    if (!formData.customAddress.buildingNumber.trim()) {
      setError('Podaj numer budynku');
      return false;
    }
    if (!formData.customAddress.city.trim()) {
      setError('Podaj miasto');
      return false;
    }
    if (!/^\d{2}-\d{3}$/.test(formData.customAddress.postalCode)) {
      setError('Kod pocztowy musi mieć format XX-XXX (np. 39-200)');
      return false;
    }
    return true;
  };

  // Przejście do następnego kroku
  const handleNext = () => {
    setError(null);
    
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    } else if (step === 3) {
      setStep(4); // Step 3 nie wymaga walidacji (opcjonalne pola)
    }
  };

  // Powrót
  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };

  // Wyślij zgłoszenie
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Walidacja Step 4 przed wysłaniem
    if (!validateStep4()) {
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('clientToken');
      
      // Przygotuj dane - dodaj serviceAddress
      const orderData = {
        ...formData,
        photos: photos.map(p => p.url), // W produkcji upload do serwera
        serviceAddress: formData.useCustomAddress 
          ? formData.customAddress 
          : null // Jeśli null, API użyje adresu klienta
      };

      const response = await fetch('/api/client/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setNewOrderId(data.order.id);
        
        // Redirect po 3 sekundach
        setTimeout(() => {
          router.push(`/client/order/${data.order.id}`);
        }, 3000);
      } else {
        setError(data.message || 'Błąd podczas tworzenia zgłoszenia');
      }
    } catch (err) {
      console.error('Error creating order:', err);
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  // Jeśli sukces
  if (success) {
    return (
      <>
        <Head>
          <title>Zgłoszenie Wysłane - Panel Klienta</title>
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <FiCheckCircle className="text-green-600 text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Zgłoszenie Wysłane!
            </h2>
            <p className="text-gray-600 mb-2">
              Twoje zgłoszenie zostało przyjęte.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Numer zgłoszenia: <strong>{newOrderId}</strong>
            </p>
            <p className="text-gray-600 mb-6">
              Za chwilę zostaniesz przekierowany do szczegółów zamówienia.
            </p>
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Nowe Zgłoszenie - Panel Klienta</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4">
              <Link href="/client/dashboard">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <FiArrowLeft className="text-xl text-gray-600" />
                </button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Nowe Zgłoszenie Naprawy
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Wypełnij formularz aby zgłosić naprawę urządzenia AGD
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                      step >= s
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {s}
                  </div>
                  {s < 4 && (
                    <div
                      className={`w-12 h-1 mx-2 transition-all ${
                        step > s ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-8 mt-2">
              <span className={`text-sm ${step === 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                Urządzenie
              </span>
              <span className={`text-sm ${step === 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                Problem
              </span>
              <span className={`text-sm ${step === 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                Szczegóły
              </span>
              <span className={`text-sm ${step === 4 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                Adres
              </span>
            </div>
          </div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <form onSubmit={step === 4 ? handleSubmit : (e) => e.preventDefault()}>
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
                >
                  <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </motion.div>
              )}

              {/* Step 1: Device Info */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FiPackage className="text-blue-600" />
                    Informacje o urządzeniu
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Typ urządzenia *
                      </label>
                      <select
                        name="deviceType"
                        value={formData.deviceType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Wybierz typ urządzenia</option>
                        {deviceTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Marka *
                      </label>
                      <select
                        name="brand"
                        value={formData.brand}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Wybierz markę</option>
                        {brands.map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Model (opcjonalnie)
                      </label>
                      <input
                        type="text"
                        name="model"
                        value={formData.model}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="np. WMB61234PL"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numer seryjny (opcjonalnie)
                      </label>
                      <input
                        type="text"
                        name="serialNumber"
                        value={formData.serialNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Znajduje się na tabliczce znamionowej"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Issue Description */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Opis problemu
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Opisz problem *
                      </label>
                      <textarea
                        name="issueDescription"
                        value={formData.issueDescription}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                          // Pozwól na Enter w textarea (nowa linia), ale nie triggeruj submit
                          if (e.key === 'Enter' && !e.shiftKey) {
                            // Enter bez Shift - dozwolone w textarea
                          }
                        }}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Opisz szczegółowo jaki problem występuje z urządzeniem..."
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Minimum 10 znaków ({formData.issueDescription.length}/10)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priorytet
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, priority: 'normal' })}
                          className={`p-3 border-2 rounded-lg transition-all ${
                            formData.priority === 'normal'
                              ? 'border-blue-600 bg-blue-50 text-blue-600'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">Normalny</div>
                          <div className="text-xs text-gray-500">Do 7 dni</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, priority: 'high' })}
                          className={`p-3 border-2 rounded-lg transition-all ${
                            formData.priority === 'high'
                              ? 'border-orange-600 bg-orange-50 text-orange-600'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">Wysoki</div>
                          <div className="text-xs text-gray-500">Do 3 dni</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, priority: 'urgent' })}
                          className={`p-3 border-2 rounded-lg transition-all ${
                            formData.priority === 'urgent'
                              ? 'border-red-600 bg-red-50 text-red-600'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">Pilny</div>
                          <div className="text-xs text-gray-500">24h</div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zdjęcia (max 5, opcjonalnie)
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <FiUpload className="text-4xl text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Dodaj zdjęcia urządzenia lub uszkodzenia
                        </p>
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                          <FiImage />
                          Wybierz zdjęcia
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                          Max 5MB na zdjęcie, formaty: JPG, PNG
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          ℹ️ Zdjęcia są automatycznie kompresowane
                        </p>
                      </div>

                      {photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          {photos.map((photo, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                              <img
                                src={photo.url}
                                alt={`Zdjęcie ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                              >
                                <FiX />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Preferred Date */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FiCalendar className="text-blue-600" />
                    Preferowany termin
                  </h2>

                  <div className="space-y-4">
                    {/* Quick Date Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Szybki wybór terminu
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            setFormData({ ...formData, preferredDate: tomorrow.toISOString().split('T')[0] });
                          }}
                          className="px-4 py-3 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          🚀 Jak najszybciej
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const threeDays = new Date();
                            threeDays.setDate(threeDays.getDate() + 3);
                            setFormData({ ...formData, preferredDate: threeDays.toISOString().split('T')[0] });
                          }}
                          className="px-4 py-3 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                        >
                          📅 W ciągu 3 dni
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const today = new Date();
                            const dayOfWeek = today.getDay();
                            const daysUntilFriday = dayOfWeek === 0 ? 5 : (5 - dayOfWeek + 7) % 7;
                            const thisWeek = new Date();
                            thisWeek.setDate(thisWeek.getDate() + (daysUntilFriday || 7));
                            setFormData({ ...formData, preferredDate: thisWeek.toISOString().split('T')[0] });
                          }}
                          className="px-4 py-3 bg-purple-50 border-2 border-purple-200 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                        >
                          📆 W tym tygodniu
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const nextWeek = new Date();
                            const dayOfWeek = nextWeek.getDay();
                            const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
                            nextWeek.setDate(nextWeek.getDate() + daysUntilMonday);
                            setFormData({ ...formData, preferredDate: nextWeek.toISOString().split('T')[0] });
                          }}
                          className="px-4 py-3 bg-orange-50 border-2 border-orange-200 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
                        >
                          🗓️ Przyszły tydzień
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const endOfMonth = new Date();
                            endOfMonth.setMonth(endOfMonth.getMonth() + 1);
                            endOfMonth.setDate(0);
                            const thirtyDaysFromNow = new Date();
                            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                            const targetDate = endOfMonth > thirtyDaysFromNow ? thirtyDaysFromNow : endOfMonth;
                            setFormData({ ...formData, preferredDate: targetDate.toISOString().split('T')[0] });
                          }}
                          className="px-4 py-3 bg-pink-50 border-2 border-pink-200 text-pink-700 rounded-lg hover:bg-pink-100 transition-colors text-sm font-medium"
                        >
                          📅 W tym miesiącu
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, preferredDate: '' });
                          }}
                          className="px-4 py-3 bg-gray-50 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                        >
                          ❌ Wyczyść
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lub wybierz konkretną datę (opcjonalnie)
                      </label>
                      <input
                        type="date"
                        name="preferredDate"
                        value={formData.preferredDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Możesz wybrać datę maksymalnie do 30 dni w przód
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferowana godzina (opcjonalnie)
                      </label>
                      <select
                        name="preferredTime"
                        value={formData.preferredTime}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Wybierz godzinę</option>
                        <option value="8:00-10:00">8:00 - 10:00</option>
                        <option value="10:00-12:00">10:00 - 12:00</option>
                        <option value="12:00-14:00">12:00 - 14:00</option>
                        <option value="14:00-16:00">14:00 - 16:00</option>
                        <option value="16:00-18:00">16:00 - 18:00</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dodatkowe uwagi (opcjonalnie)
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                          // Pozwól na Enter w textarea (nowa linia), ale blokuj submit
                          if (e.key === 'Enter' && !e.shiftKey) {
                            // Enter bez Shift - dozwolone w textarea
                          }
                        }}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Dodatkowe informacje, np. kod do bramy, preferowany kontakt..."
                      />
                    </div>

                    {/* Dostępność fizyczna - elastyczne sloty */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                      <FlexibleAvailabilitySelector
                        value={formData.availabilitySlots}
                        onChange={(slots) => setFormData({ ...formData, availabilitySlots: slots })}
                        minDate={new Date().toISOString().split('T')[0]}
                        compact={true}
                      />
                      
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-700">
                          💡 <strong>Wskazówka:</strong> Podanie przedziałów dostępności pomoże nam dopasować wizytę do Twojego harmonogramu.
                          Możesz dodać wiele terminów jeśli Twoja dostępność się zmienia.
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                      <p className="text-sm text-blue-700 font-medium">
                        📋 Harmonogram wizyt
                      </p>
                      <ul className="text-sm text-blue-600 space-y-1 ml-4">
                        <li>• Możesz wybrać termin do 30 dni w przód</li>
                        <li>• Skontaktujemy się z Tobą w ciągu 24h</li>
                        <li>• Potwierdzimy dokładną godzinę wizyty</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Address */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FiMapPin className="text-blue-600" />
                    Adres naprawy
                  </h2>

                  {/* Current Address Display */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Twój adres z konta:
                    </p>
                    <p className="text-gray-900">
                      {client.address?.street} {client.address?.buildingNumber}
                      {client.address?.apartmentNumber ? `/${client.address.apartmentNumber}` : ''}
                    </p>
                    <p className="text-gray-900">
                      {client.address?.postalCode} {client.address?.city}
                    </p>
                  </div>

                  {/* Checkbox to use custom address */}
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="useCustomAddress"
                      checked={formData.useCustomAddress}
                      onChange={(e) => setFormData({ ...formData, useCustomAddress: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="useCustomAddress" className="text-sm font-medium text-gray-700">
                      Użyj innego adresu naprawy (np. dla kogoś innego)
                    </label>
                  </div>

                  {/* Custom Address Form */}
                  {formData.useCustomAddress && (
                    <div className="space-y-4 border border-blue-200 bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-700 mb-3">
                        📍 Podaj adres, pod którym ma być wykonana naprawa:
                      </p>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ulica *
                        </label>
                        <input
                          type="text"
                          value={formData.customAddress.street}
                          onChange={(e) => setFormData({
                            ...formData,
                            customAddress: { ...formData.customAddress, street: e.target.value }
                          })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                            }
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="np. ul. Krakowska"
                          required={formData.useCustomAddress}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nr budynku *
                          </label>
                          <input
                            type="text"
                            value={formData.customAddress.buildingNumber}
                            onChange={(e) => setFormData({
                              ...formData,
                              customAddress: { ...formData.customAddress, buildingNumber: e.target.value }
                            })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                              }
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="15"
                            required={formData.useCustomAddress}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nr mieszkania
                          </label>
                          <input
                            type="text"
                            value={formData.customAddress.apartmentNumber}
                            onChange={(e) => setFormData({
                              ...formData,
                              customAddress: { ...formData.customAddress, apartmentNumber: e.target.value }
                            })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                              }
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="3"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Miasto *
                          </label>
                          <input
                            type="text"
                            value={formData.customAddress.city}
                            onChange={(e) => setFormData({
                              ...formData,
                              customAddress: { ...formData.customAddress, city: e.target.value }
                            })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                              }
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Dębica"
                            required={formData.useCustomAddress}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kod pocztowy *
                          </label>
                          <input
                            type="text"
                            value={formData.customAddress.postalCode}
                            onChange={(e) => setFormData({
                              ...formData,
                              customAddress: { ...formData.customAddress, postalCode: e.target.value }
                            })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                              }
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="39-200"
                            pattern="[0-9]{2}-[0-9]{3}"
                            required={formData.useCustomAddress}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {!formData.useCustomAddress && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-700">
                        ✓ Naprawa zostanie wykonana pod Twoim adresem z konta
                      </p>
                    </div>
                  )}

                  {/* Warning if custom address selected but not filled */}
                  {formData.useCustomAddress && (
                    !formData.customAddress.street.trim() ||
                    !formData.customAddress.buildingNumber.trim() ||
                    !formData.customAddress.city.trim() ||
                    !formData.customAddress.postalCode.trim()
                  ) && (
                    <div className="mt-4 bg-orange-50 border border-orange-300 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <FiAlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-orange-700">
                          <strong>Wypełnij wszystkie wymagane pola adresu</strong> przed wysłaniem zgłoszenia.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Info box - final step */}
                  <div className="mt-6 bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FiAlertCircle className="text-blue-600 flex-shrink-0 mt-0.5 text-xl" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900 mb-1">
                          Ostatni krok - gotowe do wysłania!
                        </p>
                        <p className="text-sm text-blue-700">
                          Sprawdź jeszcze raz adres naprawy. Po kliknięciu "Wyślij Zgłoszenie" utworzymy Twoje zamówienie i skontaktujemy się z Tobą w ciągu 24h.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex gap-3">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Wstecz
                  </button>
                )}
                
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Dalej
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={
                      loading || 
                      (formData.useCustomAddress && (
                        !formData.customAddress.street.trim() ||
                        !formData.customAddress.buildingNumber.trim() ||
                        !formData.customAddress.city.trim() ||
                        !formData.customAddress.postalCode.trim() ||
                        !/^\d{2}-\d{3}$/.test(formData.customAddress.postalCode)
                      ))
                    }
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Wysyłanie...
                      </>
                    ) : (
                      <>
                        <FiCheckCircle />
                        Wyślij Zgłoszenie
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
}
