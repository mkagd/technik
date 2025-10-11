import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  FiTool,
  FiArrowLeft,
  FiChevronRight,
  FiCheck,
  FiMapPin,
  FiCalendar,
  FiAlertCircle,
  FiX,
  FiUpload,
  FiImage,
} from 'react-icons/fi';

export default function EditOrder() {
  const router = useRouter();
  const { orderId } = router.query;

  // States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    deviceType: '',
    brand: '',
    model: '',
    serialNumber: '',
    issueDescription: '',
    priority: 'Średni',
    preferredDate: '',
    preferredTime: '',
    notes: '',
    photos: [],
    useCustomAddress: false,
    customAddress: {
      street: '',
      buildingNumber: '',
      apartmentNumber: '',
      city: '',
      postalCode: '',
    },
  });
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [dateError, setDateError] = useState('');

  // Fetch order data
  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem('clientToken');
        if (!token) {
          router.push('/client/login');
          return;
        }

        const response = await fetch(`/api/client/order?orderId=${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Nie udało się pobrać danych zamówienia');
        }

        const data = await response.json();

        // Check if order can be edited
        if (data.order.status !== 'pending') {
          setError('To zamówienie nie może być już edytowane');
          setLoading(false);
          return;
        }

        setOrder(data.order);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  // Pre-fill form data when order is loaded
  useEffect(() => {
    if (!order) return;

    const hasCustomAddress = order.serviceAddress && 
                             typeof order.serviceAddress === 'object' &&
                             order.serviceAddress.street;

    setFormData({
      deviceType: order.deviceType || '',
      brand: order.brand || '',
      model: order.model || '',
      serialNumber: order.serialNumber || '',
      issueDescription: order.issueDescription || '',
      priority: order.priority || 'Średni',
      preferredDate: order.preferredDate || '',
      preferredTime: order.preferredTime || '',
      notes: order.notes || '',
      photos: order.photos || [],
      useCustomAddress: hasCustomAddress,
      customAddress: hasCustomAddress ? order.serviceAddress : {
        street: '',
        buildingNumber: '',
        apartmentNumber: '',
        city: '',
        postalCode: '',
      },
    });

    setUploadedPhotos(order.photos || []);
  }, [order]);

  // Validate date when it changes
  useEffect(() => {
    if (!formData.preferredDate) {
      setDateError('');
      return;
    }

    const selectedDate = new Date(formData.preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 30);

    if (selectedDate < today || selectedDate > maxDate) {
      setDateError('Data musi być w ciągu najbliższych 30 dni');
    } else {
      setDateError('');
    }
  }, [formData.preferredDate]);

  // Debug: Monitor currentStep changes
  useEffect(() => {
    console.log('Current step changed to:', currentStep);
  }, [currentStep]);

  // Form validation
  const isStep1Valid = () => {
    return formData.deviceType.trim() !== '' && formData.brand.trim() !== '';
  };

  const isStep2Valid = () => {
    return formData.issueDescription.trim().length >= 10;
  };

  const isStep3Valid = () => {
    if (!formData.preferredDate) return false;

    const selectedDate = new Date(formData.preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 30);

    if (selectedDate < today || selectedDate > maxDate) {
      return false;
    }

    return true;
  };

  const isStep4Valid = () => {
    if (!formData.useCustomAddress) return true;

    // Check if customAddress exists
    if (!formData.customAddress) return false;

    const { street, buildingNumber, city, postalCode } = formData.customAddress;
    return (
      street?.trim() !== '' &&
      buildingNumber?.trim() !== '' &&
      city?.trim() !== '' &&
      postalCode && /^\d{2}-\d{3}$/.test(postalCode)
    );
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCustomAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      customAddress: {
        ...prev.customAddress,
        [name]: value,
      },
    }));
  };

  // 📸 Upload zdjęcia przez API (zamiast base64)
  const [uploadProgress, setUploadProgress] = useState({});

  const uploadPhotoToServer = async (file, index) => {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('orderId', orderId); // Użyj prawdziwego ID zamówienia
    formData.append('category', 'client-order');
    formData.append('userId', client?.id || 'GUEST');

    try {
      setUploadProgress(prev => ({ ...prev, [index]: 0 }));

      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setUploadProgress(prev => ({ ...prev, [index]: 100 }));

      return {
        url: data.data.url,
        thumbnailUrl: data.data.thumbnailUrl,
        filename: data.data.filename,
        uploadedAt: data.data.uploadedAt,
        metadata: data.data.metadata
      };
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(prev => ({ ...prev, [index]: -1 }));
      throw error;
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingPhotos(true);

    try {
      const uploadPromises = files.map(async (file, index) => {
        // Walidacja rozmiaru (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name} jest za duży (max 10MB)`);
        }

        // Upload do serwera
        const photoData = await uploadPhotoToServer(file, uploadedPhotos.length + index);
        return photoData;
      });

      const newPhotos = await Promise.all(uploadPromises);
      const allPhotos = [...uploadedPhotos, ...newPhotos];

      setUploadedPhotos(allPhotos);
      setFormData((prev) => ({
        ...prev,
        photos: allPhotos,
      }));
    } catch (err) {
      console.error('Error uploading photos:', err);
      alert(err.message || 'Błąd podczas przesyłania zdjęć');
    } finally {
      setUploadingPhotos(false);
      setUploadProgress({});
    }
  };

  const removePhoto = (index) => {
    const newPhotos = uploadedPhotos.filter((_, i) => i !== index);
    setUploadedPhotos(newPhotos);
    setFormData((prev) => ({
      ...prev,
      photos: newPhotos,
    }));
  };

  // Submit form
  const handleSubmit = async () => {
    console.log('handleSubmit called!');
    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('clientToken');
      if (!token) {
        console.log('No token, redirecting to login');
        router.push('/client/login');
        return;
      }
      
      console.log('Submitting order update...', { orderId, formData });

      // Prepare data
      const updateData = {
        orderId: orderId,
        deviceType: formData.deviceType,
        brand: formData.brand,
        model: formData.model,
        serialNumber: formData.serialNumber,
        issueDescription: formData.issueDescription,
        priority: formData.priority,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        notes: formData.notes,
        photos: formData.photos,
        serviceAddress: formData.useCustomAddress ? formData.customAddress : null,
      };

      const response = await fetch('/api/client/edit-order', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Nie udało się zapisać zmian');
      }

      // Redirect to order details
      router.push(`/client/order/${orderId}`);
    } catch (err) {
      console.error('Error updating order:', err);
      setError(err.message);
      setSubmitting(false);
    }
  };

  // Navigation
  const handleNext = () => {
    console.log('handleNext called, currentStep:', currentStep);
    if (currentStep < 4) {
      console.log('Moving to step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    } else {
      console.log('Attempting to submit from step 4');
      // Confirm before submitting
      const confirmed = window.confirm(
        'Czy na pewno chcesz zapisać zmiany w zamówieniu?\n\n' +
        'Zmiany zostaną zapisane w historii zamówienia.'
      );
      if (confirmed) {
        console.log('User confirmed, submitting...');
        handleSubmit();
      } else {
        console.log('User cancelled submission');
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return isStep1Valid();
      case 2:
        return isStep2Valid();
      case 3:
        return isStep3Valid();
      case 4:
        return isStep4Valid();
      default:
        return false;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error && !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Błąd</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/client/orders">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Powrót do zamówień
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { number: 1, title: 'Urządzenie', icon: FiTool },
    { number: 2, title: 'Problem', icon: FiAlertCircle },
    { number: 3, title: 'Termin', icon: FiCalendar },
    { number: 4, title: 'Adres', icon: FiMapPin },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/client/order/${orderId}`}>
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors">
              <FiArrowLeft />
              <span>Powrót do szczegółów</span>
            </button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edytuj Zamówienie</h1>
          <p className="text-gray-600 mt-2">ID: {orderId}</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{
                      scale: currentStep === step.number ? 1.1 : 1,
                      backgroundColor:
                        currentStep > step.number
                          ? '#10b981'
                          : currentStep === step.number
                          ? '#3b82f6'
                          : '#e5e7eb',
                    }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      currentStep >= step.number ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <FiCheck className="text-xl" />
                    ) : (
                      <step.icon className="text-xl" />
                    )}
                  </motion.div>
                  <span
                    className={`text-sm mt-2 ${
                      currentStep === step.number
                        ? 'text-blue-600 font-semibold'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded ${
                      currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            {/* Step 1: Device */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Informacje o urządzeniu
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Typ urządzenia <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="deviceType"
                    value={formData.deviceType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Wybierz typ urządzenia</option>
                    <option value="Lodówka">Lodówka</option>
                    <option value="Pralka">Pralka</option>
                    <option value="Zmywarka">Zmywarka</option>
                    <option value="Kuchenka">Kuchenka</option>
                    <option value="Piekarnik">Piekarnik</option>
                    <option value="Mikrofalówka">Mikrofalówka</option>
                    <option value="Odkurzacz">Odkurzacz</option>
                    <option value="Inne">Inne</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marka <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    placeholder="Np. Samsung, LG, Bosch"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    placeholder="Numer modelu (opcjonalnie)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numer seryjny
                  </label>
                  <input
                    type="text"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleInputChange}
                    placeholder="Numer seryjny (opcjonalnie)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Problem */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Opis problemu
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opis usterki <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="issueDescription"
                    value={formData.issueDescription}
                    onChange={handleInputChange}
                    rows={6}
                    placeholder="Opisz szczegółowo problem z urządzeniem (minimum 10 znaków)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.issueDescription.length} / minimum 10 znaków
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priorytet
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Niski">Niski</option>
                    <option value="Średni">Średni</option>
                    <option value="Wysoki">Wysoki</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dodatkowe uwagi
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Dodatkowe informacje (opcjonalnie)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Photos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zdjęcia
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Przeciągnij zdjęcia lub kliknij aby wybrać
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                      disabled={uploadingPhotos}
                    />
                    <label
                      htmlFor="photo-upload"
                      className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                    >
                      {uploadingPhotos ? 'Przesyłanie...' : 'Wybierz zdjęcia'}
                    </label>
                  </div>

                  {uploadedPhotos.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      {uploadedPhotos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo}
                            alt={`Zdjęcie ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FiX className="text-sm" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Schedule */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Preferowany termin
                </h2>

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
                        endOfMonth.setDate(0); // Last day of current month
                        // If end of month is more than 30 days away, use 30 days from now
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
                    Lub wybierz konkretną datę <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="preferredDate"
                    value={formData.preferredDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    max={
                      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .split('T')[0]
                    }
                    onKeyDown={(e) => e.preventDefault()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {dateError && (
                    <p className="text-red-500 text-sm mt-1">{dateError}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Wybierz datę w ciągu najbliższych 30 dni
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferowany czas
                  </label>
                  <select
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Dowolna pora</option>
                    <option value="Rano (8:00-12:00)">Rano (8:00-12:00)</option>
                    <option value="Popołudnie (12:00-16:00)">
                      Popołudnie (12:00-16:00)
                    </option>
                    <option value="Wieczór (16:00-20:00)">
                      Wieczór (16:00-20:00)
                    </option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <FiAlertCircle className="text-blue-600 flex-shrink-0 mt-1" />
                    <div className="text-sm text-gray-700">
                      <p className="font-medium mb-1">Informacja</p>
                      <p>
                        Podany termin jest preferencją. Dokładna data i godzina
                        wizyty zostanie ustalona przez naszego pracownika i
                        wyślemy Ci potwierdzenie.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Address */}
            {currentStep === 4 && (() => {
              console.log('Rendering Step 4');
              return (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Adres serwisu
                </h2>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.useCustomAddress}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          useCustomAddress: e.target.checked,
                        }))
                      }
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        Użyj innego adresu
                      </p>
                      <p className="text-sm text-gray-600">
                        Zaznacz jeśli naprawa ma odbyć się pod innym adresem
                        niż Twój adres zamieszkania
                      </p>
                    </div>
                  </label>
                </div>

                {formData.useCustomAddress && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ulica <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="street"
                          value={formData.customAddress.street}
                          onChange={handleCustomAddressChange}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.preventDefault();
                          }}
                          placeholder="Nazwa ulicy"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Numer budynku <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="buildingNumber"
                          value={formData.customAddress.buildingNumber}
                          onChange={handleCustomAddressChange}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.preventDefault();
                          }}
                          placeholder="Nr budynku"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Numer mieszkania
                        </label>
                        <input
                          type="text"
                          name="apartmentNumber"
                          value={formData.customAddress.apartmentNumber}
                          onChange={handleCustomAddressChange}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.preventDefault();
                          }}
                          placeholder="Nr mieszkania (opcjonalnie)"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Kod pocztowy <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          value={formData.customAddress.postalCode}
                          onChange={handleCustomAddressChange}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.preventDefault();
                          }}
                          placeholder="00-000"
                          maxLength={6}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Miasto <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.customAddress.city}
                        onChange={handleCustomAddressChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.preventDefault();
                        }}
                        placeholder="Nazwa miasta"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {!isStep4Valid() && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex gap-3">
                          <FiAlertCircle className="text-orange-600 flex-shrink-0 mt-1" />
                          <div className="text-sm text-orange-800">
                            <p className="font-medium">Uwaga</p>
                            <p>Uzupełnij wszystkie wymagane pola adresu</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {!formData.useCustomAddress && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <FiCheck className="text-green-600 flex-shrink-0 mt-1" />
                      <div className="text-sm text-gray-700">
                        <p className="font-medium mb-1">
                          Użyj adres z mojego konta
                        </p>
                        <p>
                          Serwis zostanie wykonany pod adresem przypisanym do
                          Twojego konta klienta
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <FiAlertCircle className="text-blue-600 flex-shrink-0 mt-1" />
                    <div className="text-sm text-gray-700">
                      <p className="font-medium mb-1">Informacja</p>
                      <p>
                        Po zapisaniu zmian, zaktualizowane dane zostaną dodane do
                        historii zmian zamówienia.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
            })()}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                <div className="flex gap-3">
                  <FiAlertCircle className="text-red-600 flex-shrink-0 mt-1" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Błąd</p>
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FiArrowLeft />
                Wstecz
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed() || submitting}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                  canProceed() && !submitting
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Zapisywanie...
                  </>
                ) : currentStep === 4 ? (
                  <>
                    <FiCheck />
                    Zapisz zmiany
                  </>
                ) : (
                  <>
                    Dalej
                    <FiChevronRight />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
