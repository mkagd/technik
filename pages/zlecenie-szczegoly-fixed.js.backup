// pages/zlecenie-szczegoly-fixed.js
// POPRAWIONA WERSJA - Połączenie z prawdziwą bazą danych

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import jsPDF from 'jspdf';
import { getNextInvoiceNumber, getNextProtocolNumber } from '../utils/documentNumbers';
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUser,
  FiPhone,
  FiMail,
  FiTool,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
  FiCamera,
  FiDollarSign,
  FiPlay,
  FiPause,
  FiSquare,
  FiSave,
  FiPrinter,
  FiPlus,
  FiMinus,
  FiX,
  FiCheck,
  FiPackage,
  FiClipboard,
  FiCopy,
  FiSearch,
  FiExternalLink,
  FiSettings
} from 'react-icons/fi';
import ModelManagerModal from '../components/ModelManagerModal';
import LocationTimer from '../components/LocationTimer';

export default function ZlecenieSzczegoly() {
  const router = useRouter();
  const { id } = router.query;
  const [employee, setEmployee] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  
  // Timer states
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState(null);
  const [totalWorkTime, setTotalWorkTime] = useState(0);
  const [workSessions, setWorkSessions] = useState([]);
  
  // Billing states
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [billingData, setBillingData] = useState({
    laborCost: 0,
    partsCost: 0,
    travelCost: 0,
    totalCost: 0,
    paymentMethod: 'cash',
    isPaid: false,
    notes: ''
  });
  
  // Parts used
  const [partsUsed, setPartsUsed] = useState([]);
  
  // Models management
  const [showModelManager, setShowModelManager] = useState(false);
  const [deviceModels, setDeviceModels] = useState([]);
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [newPart, setNewPart] = useState({ name: '', quantity: 1, price: 0 });
  const [copiedModel, setCopiedModel] = useState(null);
  
  // Completion states
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState({
    customerSignature: '',
    technicianNotes: '',
    completionPhotos: [],
    paymentReceived: false,
    paymentMethod: 'cash',
    finalAmount: 0
  });
  
  // Pricing settings
  const [pricingSettings, setPricingSettings] = useState({
    serviceType: 'repair', // 'diagnosis' lub 'repair'
    deviceCategory: 'other',
    distance: 10, // km od miejsca zgłoszenia
    autoCalculateLaborCost: true, // Włączone domyślnie
    customRates: {
      diagnosis: 150,
      repairBase: 200,
      repairHourly: 250
    }
  });
  
  // Pricing rules (będą później załadowane z pliku)
  const [pricingRules, setPricingRules] = useState(null);
  
  // Work notes
  const [workNotes, setWorkNotes] = useState('');
  const [workStatus, setWorkStatus] = useState('in_progress');

  // Funkcja do ładowania prawdziwych danych zlecenia z API
  const loadOrderData = async (orderId) => {
    try {
      console.log(`🔍 Ładowanie zlecenia ID: ${orderId}`);
      const response = await fetch('/api/orders');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📊 Pobrano ${data.orders?.length || 0} zleceń z API`);
      
      const order = data.orders.find(o => o.id.toString() === orderId.toString());
      
      if (!order) {
        throw new Error(`Zlecenie o ID ${orderId} nie zostało znalezione`);
      }
      
      console.log(`✅ Znaleziono zlecenie: ${order.orderNumber} - ${order.clientName}`);
      
      // Mapuj dane z API na format oczekiwany przez UI
      return mapOrderToUIFormat(order);
    } catch (error) {
      console.error('❌ Błąd ładowania zlecenia:', error);
      throw error;
    }
  };

  // Funkcja mapująca dane z API na format UI
  const mapOrderToUIFormat = (order) => {
    console.log('🔄 Mapowanie danych zlecenia:', order.orderNumber);
    
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      created: order.createdAt ? new Date(order.createdAt).toLocaleDateString('pl-PL') : 'Brak daty',
      priority: order.priority || 'medium',
      estimatedDuration: order.estimatedDuration || 90,
      
      // Dane klienta - struktura płaska w API → zagnieżdżona w UI
      client: {
        name: order.clientName || 'Brak nazwy',
        phone: order.clientPhone || 'Brak telefonu',
        email: order.clientEmail || order.email || 'Brak email',
        address: order.address || 'Brak adresu',
        coordinates: { lat: 0, lng: 0 } // TODO: dodać prawdziwe współrzędne jeśli dostępne
      },
      
      // Dane urządzenia - częściowo płaskie w API → zagnieżdżona w UI
      device: {
        brand: order.brand || 'Nieznana marka',
        model: order.model || 'Nieznany model', 
        type: order.deviceType || 'Nieznane urządzenie',
        serialNumber: order.serialNumber || 'Brak numeru',
        warrantyStatus: 'Na gwarancji', // TODO: dodać do API jeśli potrzebne
        purchaseDate: '2020-03-15' // TODO: dodać do API jeśli potrzebne
      },
      
      // Problem - mapowanie z różnych pól
      problem: {
        description: order.description || 'Brak opisu',
        reportedBy: 'Właściciel',
        symptoms: Array.isArray(order.symptoms) ? order.symptoms : [],
        category: order.category || 'Ogólne'
      },
      
      // Technik - z danych wizyty lub domyślne
      technician: {
        name: 'Michał Kowalski', // TODO: pobrać z danych wizyty jeśli dostępne
        specialization: `AGD ${order.brand || 'Ogólne'}`,
        experience: '8 lat'
      },
      
      // Historia serwisowa z wizyt
      serviceHistory: Array.isArray(order.visits) ? order.visits.map(visit => ({
        date: visit.scheduledDate || visit.createdAt,
        service: visit.workDescription || 'Serwis',
        technician: visit.technicianName || 'Nieznany'
      })) : [],
      
      // Pozostałe pola z API
      diagnosis: order.diagnosis || '',
      solution: order.solution || '',
      status: order.status || 'pending',
      estimatedCost: order.estimatedCost || 0,
      partsCost: order.partsCost || 0,
      laborCost: order.laborCost || 0,
      totalCost: order.totalCost || 0,
      partsUsed: Array.isArray(order.partsUsed) ? order.partsUsed : [],
      photos: Array.isArray(order.photos) ? order.photos : [],
      statusHistory: Array.isArray(order.statusHistory) ? order.statusHistory : [],
      clientFeedback: order.clientFeedback || null,
      
      // Dodatkowe informacje z API
      warrantyMonths: order.warrantyMonths || 6,
      workNotes: order.workNotes || order.internalNotes || '',
      clientNotes: order.clientNotes || ''
    };
  };

  // Funkcja do mapowania kategorii urządzenia
  const mapDeviceTypeToCategory = (deviceType) => {
    const mapping = {
      'Pralka': 'washing_machine',
      'Zmywarka': 'dishwasher', 
      'Lodówka': 'refrigerator',
      'Piekarnik': 'oven',
      'Kuchenka': 'cooktop',
      'Mikrofalówka': 'microwave'
    };
    return mapping[deviceType] || 'other';
  };

  // Główny useEffect do ładowania danych
  useEffect(() => {
    if (!id) return;
    
    const initializeData = async () => {
      setIsLoading(true);
      setLoadError(null);
      
      try {
        // Sprawdź sesję pracownika
        const employeeSession = localStorage.getItem('employeeSession');
        if (!employeeSession) {
          router.push('/pracownik-logowanie');
          return;
        }
        setEmployee(JSON.parse(employeeSession));
        
        // Załaduj prawdziwe dane zlecenia
        const orderData = await loadOrderData(id);
        setOrderDetails(orderData);
        
        // Automatyczne mapowanie kategorii urządzenia
        if (orderData.device?.type) {
          const mappedCategory = mapDeviceTypeToCategory(orderData.device.type);
          setPricingSettings(prev => ({
            ...prev,
            deviceCategory: mappedCategory
          }));
        }
        
        // Załaduj zapisane dane sesji pracy
        const savedSession = localStorage.getItem(`workSession_${id}`);
        if (savedSession) {
          try {
            const sessionData = JSON.parse(savedSession);
            setWorkSessions(sessionData.sessions || []);
            setTotalWorkTime(sessionData.totalTime || 0);
            setWorkNotes(sessionData.notes || '');
            setPartsUsed(sessionData.parts || []);
            setBillingData(sessionData.billing || billingData);
            setWorkStatus(sessionData.status || 'in_progress');
          } catch (error) {
            console.error('Błąd ładowania sesji pracy:', error);
          }
        }
        
        console.log('✅ Dane zlecenia załadowane pomyślnie');
        
      } catch (error) {
        console.error('❌ Błąd inicjalizacji:', error);
        setLoadError(error.message);
        
        // Fallback do mock danych tylko dla ID 1-3
        if (['1', '2', '3'].includes(id.toString())) {
          console.log('🔄 Używam mock danych jako fallback');
          setOrderDetails(getMockOrderData(id));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeData();
  }, [id, router]);

  // Mock data jako fallback
  const getMockOrderData = (orderId) => {
    const mockData = {
      1: {
        id: 1,
        orderNumber: 'ZL2025-001',
        created: '2025-09-23 08:00',
        priority: 'high',
        estimatedDuration: 90,
        client: {
          name: 'Jan Kowalski',
          phone: '+48 123 456 789',
          email: 'jan.kowalski@email.com',
          address: 'ul. Długa 5, 00-001 Warszawa',
          coordinates: { lat: 52.2297, lng: 21.0122 }
        },
        device: {
          brand: 'Samsung',
          model: 'WW70J5346MW',
          type: 'Pralka',
          serialNumber: 'S1234567890',
          warrantyStatus: 'Gwarancja wygasła',
          purchaseDate: '2020-03-15'
        },
        problem: {
          description: 'Pralka nie włącza się, brak reakcji na przyciski.',
          reportedBy: 'Właściciel',
          symptoms: ['Brak zasilania', 'Nie świeci się display'],
          category: 'Elektronika'
        },
        technician: {
          name: 'Michał Kowalski',
          specialization: 'AGD Samsung',
          experience: '8 lat'
        },
        serviceHistory: []
      }
    };
    
    return mockData[orderId] || null;
  };

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now - timerStartTime) / 1000);
        setTotalWorkTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerStartTime]);

  // Funkcje do wyceny
  useEffect(() => {
    calculateTotalCost();
  }, [billingData.laborCost, billingData.partsCost, billingData.travelCost]);

  // Load saved models from localStorage
  useEffect(() => {
    if (id) {
      const savedModels = localStorage.getItem(`models_${id}`);
      if (savedModels) {
        try {
          setDeviceModels(JSON.parse(savedModels));
        } catch (error) {
          console.error('Error loading saved models:', error);
        }
      }
    }
  }, [id]);

  // Funkcje pomocnicze (pozostaw istniejące)
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateTotalCost = () => {
    const total = parseFloat(billingData.laborCost || 0) + 
                  parseFloat(billingData.partsCost || 0) + 
                  parseFloat(billingData.travelCost || 0);
    setBillingData(prev => ({ ...prev, totalCost: total }));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie szczegółów zlecenia...</p>
          <p className="mt-2 text-sm text-gray-500">Połączenie z bazą danych...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError && !orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Błąd ładowania zlecenia</h2>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Spróbuj ponownie
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Wróć
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No order found
  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Zlecenie nie zostało znalezione</h2>
          <p className="text-gray-600 mb-4">Zlecenie o ID {id} nie istnieje w systemie.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Wróć do listy zleceń
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header z informacją o źródle danych */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Zlecenie #{orderDetails.orderNumber}
                </h1>
                <p className="text-sm text-gray-600">
                  {orderDetails.device.brand} {orderDetails.device.model} - {orderDetails.device.type}
                </p>
              </div>
            </div>
            
            {/* Wskaźnik źródła danych */}
            <div className="flex items-center space-x-2">
              {loadError ? (
                <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                  Mock Data
                </span>
              ) : (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  ✅ Live Data
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dane klienta */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiUser className="h-5 w-5 mr-2" />
            Dane klienta
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Imię i nazwisko</label>
              <p className="text-gray-900 font-medium">{orderDetails.client.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Telefon</label>
              <div className="flex items-center space-x-2">
                <p className="text-gray-900">{orderDetails.client.phone}</p>
                <button className="text-blue-600 hover:text-blue-800">
                  <FiPhone className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Adres</label>
              <div className="flex items-center space-x-2">
                <p className="text-gray-900">{orderDetails.client.address}</p>
                <button className="text-green-600 hover:text-green-800">
                  <FiMapPin className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <p className="text-gray-900">{orderDetails.client.email}</p>
            </div>
          </div>
        </div>

        {/* Informacje o urządzeniu */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiTool className="h-5 w-5 mr-2" />
            Urządzenie
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Marka i model</label>
              <p className="text-gray-900 font-medium">{orderDetails.device.brand} {orderDetails.device.model}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Typ urządzenia</label>
              <p className="text-gray-900">{orderDetails.device.type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Numer seryjny</label>
              <p className="text-gray-900">{orderDetails.device.serialNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status gwarancji</label>
              <p className="text-gray-900">{orderDetails.device.warrantyStatus}</p>
            </div>
          </div>
        </div>

        {/* Problem */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiAlertCircle className="h-5 w-5 mr-2" />
            Opis problemu
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Opis problemu</label>
              <p className="text-gray-900 mt-1">{orderDetails.problem.description}</p>
            </div>
            {orderDetails.problem.symptoms.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700">Objawy</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {orderDetails.problem.symptoms.map((symptom, index) => (
                    <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-sm">
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status i akcje */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status zlecenia</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Status: <span className="font-medium">{orderDetails.status}</span>
            </span>
            <span className="text-sm text-gray-600">
              Priorytet: <span className="font-medium">{orderDetails.priority}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}