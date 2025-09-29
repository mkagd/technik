// pages/zlecenie-szczegoly.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import jsPDF from 'jspdf';
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

  // Funkcja generowania protokołu naprawy w PDF
  const generateServiceReport = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const pageWidth = doc.internal.pageSize.width;
    const maxWidth = pageWidth - 40; // Margines z obu stron
    let yPosition = 20;
    
    // Helper function do formatowania czasu
    const formatTimeForPDF = (seconds) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    };

    // Helper function - konwersja polskich znaków dla protokołu
    const convertPolishChars = (text) => {
      return text
        .replace(/ą/g, 'a').replace(/Ą/g, 'A')
        .replace(/ć/g, 'c').replace(/Ć/g, 'C')
        .replace(/ę/g, 'e').replace(/Ę/g, 'E')
        .replace(/ł/g, 'l').replace(/Ł/g, 'L')
        .replace(/ń/g, 'n').replace(/Ń/g, 'N')
        .replace(/ó/g, 'o').replace(/Ó/g, 'O')
        .replace(/ś/g, 's').replace(/Ś/g, 'S')
        .replace(/ź/g, 'z').replace(/Ź/g, 'Z')
        .replace(/ż/g, 'z').replace(/Ż/g, 'Z');
    };

    // Helper function do zawijania tekstu
    const addWrappedText = (text, x, y, maxWidth, lineHeight = 5) => {      
      const safeText = convertPolishChars(text);
      const lines = doc.splitTextToSize(safeText, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * lineHeight);
    };

    // NAGŁÓWEK Z RAMKĄ
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, pageWidth - 20, 25);
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(convertPolishChars('PROTOKÓŁ NAPRAWY AGD'), pageWidth / 2, yPosition + 5, { align: 'center' });
    yPosition += 20;

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(convertPolishChars(`Nr zlecenia: ${orderDetails.orderNumber}`), 20, yPosition);
    doc.text(convertPolishChars(`Data wykonania: ${new Date().toLocaleDateString('pl-PL')}`), pageWidth - 80, yPosition);
    yPosition += 5;
    doc.text(convertPolishChars(`Priorytet: ${orderDetails.priority === 'high' ? 'WYSOKI' : orderDetails.priority === 'normal' ? 'NORMALNY' : 'NISKI'}`), 20, yPosition);
    doc.text(convertPolishChars(`Godzina: ${new Date().toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'})}`), pageWidth - 80, yPosition);
    yPosition += 8;

    // DANE KLIENTA I FAKTURY
    const leftColumnX = 20;
    const rightColumnX = pageWidth * 0.55;
    const columnWidth = (pageWidth * 0.45) - 20;
    
    // Lewa kolumna - Dane klienta
    doc.setFont(undefined, 'bold');
    doc.text(convertPolishChars('DANE KLIENTA:'), leftColumnX, yPosition);
    doc.text(convertPolishChars('DANE FAKTURY:'), rightColumnX, yPosition);
    yPosition += 5;
    
    doc.setFont(undefined, 'normal');
    doc.text(convertPolishChars(`Imie i nazwisko: ${orderDetails.client.name}`), leftColumnX, yPosition);
    const invoiceNumber = `F/${new Date().getFullYear()}/${String(orderDetails.id).padStart(4, '0')}`;
    doc.text(convertPolishChars(`Nr faktury: ${invoiceNumber}`), rightColumnX, yPosition);
    yPosition += 5;
    
    doc.text(convertPolishChars(`Telefon: ${orderDetails.client.phone}`), leftColumnX, yPosition);
    doc.text(convertPolishChars(`Data wystawienia: ${new Date().toLocaleDateString('pl-PL')}`), rightColumnX, yPosition);
    yPosition += 5;
    
    // Zawijanie długiego adresu
    const addressLines = doc.splitTextToSize(convertPolishChars(`Adres: ${orderDetails.client.address}`), columnWidth);
    doc.text(addressLines, leftColumnX, yPosition);
    doc.text(convertPolishChars(`Metoda platnosci: Gotowka`), rightColumnX, yPosition);
    yPosition += Math.max(addressLines.length * 5, 5) + 6;

    // DANE URZADZENIA
    doc.setFont(undefined, 'bold');
    doc.text(convertPolishChars('DANE URZADZENIA:'), 20, yPosition);
    yPosition += 5;
    doc.setFont(undefined, 'normal');
    
    // Zawijanie długich nazw
    yPosition = addWrappedText(`Typ: ${orderDetails.device.type}`, 20, yPosition, maxWidth);
    yPosition = addWrappedText(`Marka: ${orderDetails.device.brand}`, 20, yPosition, maxWidth);
    yPosition = addWrappedText(`Model: ${orderDetails.device.model}`, 20, yPosition, maxWidth);
    yPosition = addWrappedText(`Numer seryjny: ${orderDetails.device.serialNumber}`, 20, yPosition, maxWidth);
    yPosition = addWrappedText(`Status gwarancji: ${orderDetails.device.warrantyStatus}`, 20, yPosition, maxWidth);
    yPosition = addWrappedText(`Data zakupu: ${orderDetails.device.purchaseDate}`, 20, yPosition, maxWidth);
    yPosition += 5;

    // OPIS PROBLEMU
    doc.setFont(undefined, 'bold');
    doc.text(convertPolishChars('OPIS PROBLEMU:'), 20, yPosition);
    yPosition += 5;
    doc.setFont(undefined, 'normal');
    yPosition = addWrappedText(orderDetails.problem.description, 20, yPosition, maxWidth);
    yPosition += 6;

    // DANE SERWISANTA
    doc.setFont(undefined, 'bold');
    doc.text(convertPolishChars('SERWISANT:'), 20, yPosition);
    yPosition += 5;
    doc.setFont(undefined, 'normal');
    const technicianName = employee?.name && employee.name !== 'undefined' ? employee.name : 'Jan Kowalski';
    const specialization = orderDetails.technician?.specialization || 'AGD Samsung';
    doc.text(convertPolishChars(`Imię i nazwisko: ${technicianName}`), 20, yPosition);
    yPosition += 4;
    doc.text(convertPolishChars(`Specjalizacja: ${specialization}`), 20, yPosition);
    yPosition += 6;

    // DIAGNOZA I WYKONANE PRACE
    doc.setFont(undefined, 'bold');
    doc.text(convertPolishChars('DIAGNOZA:'), 20, yPosition);
    yPosition += 5;
    doc.setFont(undefined, 'normal');
    const diagnosis = orderDetails.diagnosis || 'Uszkodzenie elementu grzejnego, brak reakcji na przyciski sterujące.';
    yPosition = addWrappedText(diagnosis, 20, yPosition, maxWidth);
    yPosition += 5;

    doc.setFont(undefined, 'bold');
    doc.text(convertPolishChars('WYKONANE PRACE:'), 20, yPosition);
    yPosition += 5;
    doc.setFont(undefined, 'normal');
    const workDone = orderDetails.workDone || 'Wymiana elementu grzejnego, czyszczenie filtrów, test działania, kalibracja programów.';
    yPosition = addWrappedText(workDone, 20, yPosition, maxWidth);
    yPosition += 6;

    // CZAS PRACY
    doc.setFont(undefined, 'bold');
    doc.text(convertPolishChars('CZAS PRACY:'), 20, yPosition);
    yPosition += 6;
    doc.setFont(undefined, 'normal');
    
    const totalTime = workSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    doc.text(convertPolishChars(`Łączny czas: ${formatTimeForPDF(totalTime)}`), 20, yPosition);
    yPosition += 5;
    doc.text(convertPolishChars(`Liczba sesji: ${workSessions.filter(s => s.end).length}`), 20, yPosition);
    yPosition += 8;

    // UŻYTE CZĘŚCI I MATERIAŁY
    if (partsUsed.length > 0) {
      doc.setFont(undefined, 'bold');
      doc.text(convertPolishChars('UŻYTE CZĘŚCI I MATERIAŁY:'), 20, yPosition);
      yPosition += 6;
      doc.setFont(undefined, 'normal');
      
      partsUsed.forEach(part => {
        doc.text(convertPolishChars(`• ${part.name} - ${part.quantity} szt. - ${part.price} PLN`), 25, yPosition);
        yPosition += 4;
      });
      
      // Dodaj gwarancję na części
      doc.setFontSize(10);
      doc.setFont(undefined, 'italic');
      doc.text(convertPolishChars('* Gwarancja na wymienione części: 12 miesięcy'), 25, yPosition);
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      yPosition += 6;
    } else {
      doc.setFont(undefined, 'bold');
      doc.text(convertPolishChars('UŻYTE CZĘŚCI I MATERIAŁY:'), 20, yPosition);
      yPosition += 5;
      doc.setFont(undefined, 'normal');
      doc.text(convertPolishChars('Brak wymienionych części - naprawa bez wymiany elementów'), 25, yPosition);
      yPosition += 6;
    }

    // PARAMETRY USŁUGI
    doc.setFont(undefined, 'bold');
    doc.text(convertPolishChars('PARAMETRY USŁUGI:'), 20, yPosition);
    yPosition += 5;
    doc.setFont(undefined, 'normal');
    doc.text(convertPolishChars(`Typ usługi: ${pricingSettings.serviceType === 'diagnosis' ? 'Diagnoza' : 'Naprawa kompleksowa'}`), 20, yPosition);
    yPosition += 4;
    doc.text(convertPolishChars(`Kategoria urządzenia: ${pricingSettings.deviceCategory}`), 20, yPosition);
    yPosition += 4;
    doc.text(convertPolishChars(`Dystans dojazdu: ${pricingSettings.distance} km`), 20, yPosition);
    yPosition += 4;
    doc.text(convertPolishChars(`Stopień skomplikowania: Średni`), 20, yPosition);
    yPosition += 6;

    // ROZLICZENIE W RAMCE
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(15, yPosition - 5, pageWidth - 30, 35);
    
    doc.setFont(undefined, 'bold');
    doc.text(convertPolishChars('ROZLICZENIE FINANSOWE:'), 20, yPosition);
    yPosition += 5;
    doc.setFont(undefined, 'normal');
    
    const totalCost = parseFloat(billingData.laborCost || 0) + parseFloat(billingData.partsCost || 0) + parseFloat(billingData.travelCost || 0);
    const protocolTotalTime = workSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    
    // Używamy krótszych linii tekstu
    doc.text(convertPolishChars(`Koszt robocizny: ${(billingData.laborCost || 0).toFixed(2)} PLN`), 20, yPosition);
    yPosition += 4;
    doc.text(convertPolishChars(`Czas pracy: ${formatTimeForPDF(protocolTotalTime)}`), 20, yPosition);
    yPosition += 4;
    doc.text(convertPolishChars(`Koszt części: ${(billingData.partsCost || 0).toFixed(2)} PLN`), 20, yPosition);
    yPosition += 4;
    doc.text(convertPolishChars(`Koszt dojazdu: ${(billingData.travelCost || 0).toFixed(2)} PLN`), 20, yPosition);
    yPosition += 4;
    doc.text(convertPolishChars(`Dystans: ${pricingSettings.distance} km`), 20, yPosition);
    yPosition += 6;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(convertPolishChars(`SUMA DO ZAPLATY: ${totalCost.toFixed(2)} PLN`), 20, yPosition);
    doc.setFontSize(12);
    yPosition += 15;

    // NOTATKI
    if (workNotes.trim()) {
      doc.setFont(undefined, 'bold');
      doc.text('NOTATKI SERWISANTA:', 20, yPosition);
      yPosition += 5;
      doc.setFont(undefined, 'normal');
      const notesLines = doc.splitTextToSize(workNotes, pageWidth - 40);
      doc.text(notesLines, 20, yPosition);
      yPosition += notesLines.length * 5 + 8;
    }

    // GWARANCJA I ZALECENIA
    doc.setFont(undefined, 'bold');
    doc.text(convertPolishChars('GWARANCJA I ZALECENIA:'), 20, yPosition);
    yPosition += 5;
    doc.setFont(undefined, 'normal');
    const warranty = 'Gwarancja na wykonaną naprawę: 6 miesięcy. Zaleca się regularne czyszczenie filtrów co 3 miesiące.';
    const warrantyLines = doc.splitTextToSize(convertPolishChars(warranty), maxWidth);
    doc.text(warrantyLines, 20, yPosition);
    yPosition += warrantyLines.length * 4 + 6;

    // DANE TECHNIKA
    doc.setFont(undefined, 'bold');
    doc.text(convertPolishChars('WYKONAŁ:'), 20, yPosition);
    yPosition += 5;
    doc.setFont(undefined, 'normal');
    doc.text(convertPolishChars('Technik: Jan Kowalski'), 20, yPosition);
    yPosition += 4;
    doc.text(convertPolishChars('Uprawnienia: AGD/RTV, Certyfikat Samsung'), 20, yPosition);
    yPosition += 4;
    doc.text(convertPolishChars('Numer licencji: TK/2024/001'), 20, yPosition);
    yPosition += 10;

    // OŚWIADCZENIA I PODPISY (zoptymalizowane)
    const pageHeight = doc.internal.pageSize.height;
    const minimumBottomSpace = 50; // Zmniejszone miejsce na podpisy
    let bottomY = Math.max(yPosition + 5, pageHeight - minimumBottomSpace);
    
    // Kompaktowa ramka z oświadczeniem
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(15, bottomY - 10, pageWidth - 30, 25);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'italic');
    // Skrócone oświadczenie
    doc.text(convertPolishChars('Usługa wykonana zgodnie z umową. Klient poinformowany o kosztach.'), 20, bottomY - 5);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(convertPolishChars('Podpis serwisanta:'), 20, bottomY + 20);
    doc.text(convertPolishChars('Podpis klienta:'), pageWidth - 90, bottomY + 20);
    
    // Linie pod podpisy
    doc.line(20, bottomY + 30, 80, bottomY + 30); // linia pod podpis serwisanta
    doc.line(pageWidth - 90, bottomY + 30, pageWidth - 20, bottomY + 30); // linia pod podpis klienta
    
    // Daty pod podpisami
    doc.setFontSize(8);
    doc.text(convertPolishChars(`Data: ${new Date().toLocaleDateString('pl-PL')}`), 20, bottomY + 35);
    doc.text(convertPolishChars(`Data: ${new Date().toLocaleDateString('pl-PL')}`), pageWidth - 90, bottomY + 35);

    // Zapisz PDF
    doc.save(`protokol_naprawy_${orderDetails.orderNumber}_${new Date().getTime()}.pdf`);
  };

  // Funkcja generowania faktury VAT
  const generateInvoice = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const pageWidth = doc.internal.pageSize.width;
    const maxWidth = pageWidth - 20;
    let yPosition = 15;

    // Używamy tej samej logiki co protokół
    const convertPolishChars = (text) => {
      if (!text) return '';
      const str = String(text);
      return str
        .replace(/ą/g, 'a')
        .replace(/ć/g, 'c')
        .replace(/ę/g, 'e')
        .replace(/ł/g, 'l')
        .replace(/ń/g, 'n')
        .replace(/ó/g, 'o')
        .replace(/ś/g, 's')
        .replace(/ź/g, 'z')
        .replace(/ż/g, 'z')
        .replace(/Ą/g, 'A')
        .replace(/Ć/g, 'C')
        .replace(/Ę/g, 'E')
        .replace(/Ł/g, 'L')
        .replace(/Ń/g, 'N')
        .replace(/Ó/g, 'O')
        .replace(/Ś/g, 'S')
        .replace(/Ź/g, 'Z')
        .replace(/Ż/g, 'Z');
    };

    // Helper function do zawijania tekstu - taka sama jak w protokole
    const addWrappedText = (text, x, y, maxWidth, lineHeight = 5) => {      
      const safeText = convertPolishChars(text);
      const lines = doc.splitTextToSize(safeText, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * lineHeight);
    };

    // DATY W PRAWYM GÓRNYM ROGU  
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(convertPolishChars('Data wystawienia:'), pageWidth - 60, yPosition);
    doc.text(new Date().toLocaleDateString('pl-PL'), pageWidth - 10, yPosition, { align: 'right' });
    yPosition += 5;
    doc.text(convertPolishChars('Data sprzedaży:'), pageWidth - 60, yPosition);
    doc.text(new Date().toLocaleDateString('pl-PL'), pageWidth - 10, yPosition, { align: 'right' });
    yPosition += 15;

    // SEKCJE SPRZEDAWCA I NABYWCA - bez ramek jak na wzorcu
    const leftColumnX = 10;
    const rightColumnX = pageWidth / 2 + 5;
    const boxWidth = (pageWidth / 2) - 15;
    const boxHeight = 50;
    
    // Nagłówki
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(convertPolishChars('Sprzedawca'), leftColumnX + 5, yPosition + 8);
    doc.text(convertPolishChars('Nabywca'), rightColumnX + 5, yPosition + 8);
    
    // Dane sprzedawcy
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    let sprzedawcaY = yPosition + 15;
    doc.text(convertPolishChars('TECHNIK SPÓŁKA Z OGRANICZONĄ'), leftColumnX + 5, sprzedawcaY);
    sprzedawcaY += 4;
    doc.text(convertPolishChars('ODPOWIEDZIALNOŚCIĄ'), leftColumnX + 5, sprzedawcaY);
    sprzedawcaY += 4;
    doc.text(convertPolishChars('ul. Lipowa 17'), leftColumnX + 5, sprzedawcaY);
    sprzedawcaY += 4;
    doc.text(convertPolishChars('39-200 Dębica'), leftColumnX + 5, sprzedawcaY);
    sprzedawcaY += 4;
    doc.text(convertPolishChars('NIP: 8722453198'), leftColumnX + 5, sprzedawcaY);
    
    // Dane nabywcy
    let nabywcaY = yPosition + 15;
    const clientName = orderDetails.client?.name || 'Jan Kowalski';
    const clientAddress = orderDetails.client?.address || 'ul. Długa 5, 00-001 Warszawa';
    
    doc.text(convertPolishChars(clientName), rightColumnX + 5, nabywcaY);
    nabywcaY += 4;
    
    // Podziel adres na linie
    const addressParts = clientAddress.split(',');
    addressParts.forEach(part => {
      doc.text(convertPolishChars(part.trim()), rightColumnX + 5, nabywcaY);
      nabywcaY += 4;
    });
    doc.text(convertPolishChars('Polska'), rightColumnX + 5, nabywcaY);
    
    yPosition += boxHeight + 15;

    // FORMA PŁATNOŚCI I TERMIN - z szarym tłem jak na wzorcu
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    // Ramka z szarym tłem
    doc.setDrawColor(0, 0, 0);
    doc.setFillColor(240, 240, 240);
    doc.rect(leftColumnX, yPosition, pageWidth - 20, 10, 'FD');
    
    doc.text(convertPolishChars('Forma płatności: karta'), leftColumnX + 5, yPosition + 7);
    doc.text(convertPolishChars(`Termin płatności: ${new Date().toLocaleDateString('pl-PL')}`), rightColumnX + 5, yPosition + 7);
    
    yPosition += 18;

    // NUMER FAKTURY
    const invoiceNumber = `S/0008/09/25`;
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(convertPolishChars(`Faktura ${invoiceNumber}`), pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    // TABELA USŁUG - uproszczona bez linii pionowych, pełna szerokość
    const tableStartY = yPosition;
    const tableWidth = pageWidth - 20;
    const leftMargin = 10;
    const rightMargin = pageWidth - 10; // Prawa krawędź
    
    // DEBUG: Wyświetl wymiary w konsoli
    console.log('=== WYMIARY TABELI FAKTURY ===');
    console.log('Szerokość strony (pageWidth):', pageWidth, 'px');
    console.log('Szerokość tabeli (tableWidth):', tableWidth, 'px');
    console.log('Lewy margines (leftMargin):', leftMargin, 'px');
    console.log('Prawy margines (rightMargin):', rightMargin, 'px');
    console.log('Dostępna szerokość:', rightMargin - leftMargin, 'px');
    
    // Nagłówki tabeli - proporcjonalne rozłożenie na pełną szerokość z "Wartość"
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    let headerY = yPosition + 5;
    
    // Przeproporcjonowane pozycje kolumn - kompaktowe Ilość i Jm
    const col1 = leftMargin; // Lp
    const col2 = leftMargin + 8; // Nazwa (zmniejszone z 12)
    const col3 = leftMargin + 75; // Ilość 
    const col4 = leftMargin + 85; // Jm 
    const col5 = leftMargin + 95; // Cena netto 
    const col6 = leftMargin + 115; // VAT 
    const col7 = leftMargin + 130; // Wartość netto 
    const col8 = leftMargin + 155; // Wartość VAT 
    const col9 = leftMargin + 175; // Wartość brutto (przesunięte z -30 do -3)
    
    // DEBUG: Wyświetl pozycje kolumn
    console.log('=== POZYCJE KOLUMN ===');
    console.log('Lp:', col1, 'px');
    console.log('Nazwa:', col2, 'px');
    console.log('Ilość:', col3, 'px');
    console.log('Jm:', col4, 'px');
    console.log('Cena netto:', col5, 'px');
    console.log('VAT:', col6, 'px');
    console.log('Wartość netto:', col7, 'px');
    console.log('Wartość VAT:', col8, 'px');
    console.log('Wartość brutto:', col9, 'px');
    
    // Mniejsza czcionka dla większości kolumn
    doc.setFontSize(7);
    doc.text(convertPolishChars('Lp'), col1, headerY);
    doc.text(convertPolishChars('Nazwa towaru/usługi'), col2, headerY);
    doc.text(convertPolishChars('Ilość'), col3, headerY);
    doc.text(convertPolishChars('Jm'), col4, headerY);
    doc.text(convertPolishChars('Cena netto'), col5, headerY);
    doc.text(convertPolishChars('VAT'), col6, headerY);
    doc.text(convertPolishChars('Wartość netto'), col7, headerY);
    doc.text(convertPolishChars('Wartość VAT'), col8, headerY);
    doc.text(convertPolishChars('Wartość brutto'), col9, headerY);
    
    // Linia pod nagłówkami - GRUBSZA ale mniejsza
    yPosition += 10;
    doc.setLineWidth(0.3);
    doc.line(leftMargin, yPosition, leftMargin + tableWidth, yPosition);
    yPosition += 5;

    // Wiersz z danymi - Serwis sprzętu AGD
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    
    const totalCost = parseFloat(billingData.laborCost || 0) + parseFloat(billingData.partsCost || 0) + parseFloat(billingData.travelCost || 0);
    const netAmount = totalCost / 1.23;
    const vatAmount = totalCost - netAmount;
    
    let rowY = yPosition;
    doc.setFontSize(9);
    doc.text(convertPolishChars('1'), col1, rowY);
    doc.text(convertPolishChars('Serwis sprzętu AGD'), col2, rowY);
    doc.text(convertPolishChars('1'), col3, rowY);
    doc.text(convertPolishChars('szt.'), col4, rowY);
    doc.text(convertPolishChars(netAmount.toFixed(2)), col5, rowY);
    doc.text(convertPolishChars('23%'), col6, rowY);
    doc.text(convertPolishChars(netAmount.toFixed(2)), col7, rowY);  // wartość netto
    doc.text(convertPolishChars(vatAmount.toFixed(2)), col8, rowY);  // wartość VAT
    doc.text(convertPolishChars(totalCost.toFixed(2)), col9, rowY);  // wartość brutto
    
    // Linia pod wierszem - BARDZO BARDZO CIENKA
    yPosition += 8;
    doc.setLineWidth(0.02);
    doc.line(leftMargin, yPosition, leftMargin + tableWidth, yPosition);
    yPosition += 5;
    
    // Wiersz "W tym"
    rowY = yPosition;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text(convertPolishChars('W tym'), col5, rowY);
    doc.text(convertPolishChars('23%'), col6, rowY);
    doc.text(convertPolishChars(netAmount.toFixed(2)), col7, rowY);  // wartość netto
    doc.text(convertPolishChars(vatAmount.toFixed(2)), col8, rowY);  // wartość VAT
    doc.text(convertPolishChars(totalCost.toFixed(2)), col9, rowY);  // wartość brutto
    
    // Linia pod "W tym" - BARDZO BARDZO CIENKA od col5
    yPosition += 8;
    doc.setLineWidth(0.05);
    doc.line(col5, yPosition, rightMargin, yPosition);
    yPosition += 5;
    
    // Wiersz "Razem do zapłaty" - na wysokości kolumny "Cena netto"
    rowY = yPosition;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text(convertPolishChars('Razem do zapłaty:'), col5, rowY);  // Na wysokości "Cena netto"
    doc.text(convertPolishChars(netAmount.toFixed(2)), col7, rowY);  // wartość netto
    doc.text(convertPolishChars(vatAmount.toFixed(2)), col8, rowY);  // wartość VAT  
    doc.text(convertPolishChars(totalCost.toFixed(2)), col9, rowY);  // wartość brutto
    
    // Linia od "Razem do zapłaty" do prawej krawędzi - BARDZO BARDZO CIENKA
    yPosition += 8;
    doc.setLineWidth(0.05);
    doc.line(col5, yPosition, rightMargin, yPosition);  // Krótsza linia
    yPosition += 15;
    
    // SEKCJA ZAPŁACONO / POZOSTAŁO - z szarym tłem jak na wzorcu
    const summaryBoxWidth = 110;
    const summaryBoxX = pageWidth - summaryBoxWidth - 10;
    
    // Ramka "Zapłacono" - z szarym tłem
    doc.setDrawColor(0, 0, 0);
    doc.setFillColor(220, 220, 220);
    doc.rect(summaryBoxX, yPosition, summaryBoxWidth, 10, 'FD');
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(convertPolishChars('Zapłacono:'), summaryBoxX + 5, yPosition + 7);
    doc.text(convertPolishChars('0,00 PLN'), summaryBoxX + summaryBoxWidth - 25, yPosition + 7);
    
    // Ramka "Pozostało do zapłaty" - z jasnoszarym tłem
    yPosition += 10;
    doc.setFillColor(240, 240, 240);
    doc.rect(summaryBoxX, yPosition, summaryBoxWidth, 15, 'FD');
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(convertPolishChars('Pozostało do zapłaty:'), summaryBoxX + 5, yPosition + 6);
    doc.text(convertPolishChars(`${totalCost.toFixed(2)} PLN`), summaryBoxX + 5, yPosition + 12);
    
    yPosition += 15;

    // STOPKA
    const bottomY = doc.internal.pageSize.height - 20;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(convertPolishChars('Kwoty w pozycjach faktury liczone od ceny łącznej'), 10, bottomY);
    
    // Numer strony
    doc.text(convertPolishChars('Strona 1/1'), pageWidth - 20, bottomY);
    
    // Dodatkowy tekst w lewym dolnym rogu
    doc.text('KonektoSmart. Nowoczesne wsparcie dla biur księgowych konektosmart.pl', 10, bottomY + 5);

    // Zapisz PDF
    const finalInvoiceNumber = `S/0008/09/25`;
    doc.save(`faktura_${finalInvoiceNumber.replace(/\//g, '_')}_${new Date().getTime()}.pdf`);
  };

  // Funkcja mapowania typu urządzenia na kategorię cenową
  const mapDeviceTypeToCategory = (deviceType) => {
    const mapping = {
      'Pralka': 'washing_machine',
      'pralka': 'washing_machine',
      'Lodówka': 'refrigerator',
      'lodówka': 'refrigerator',
      'Chłodziarko-zamrażarka': 'refrigerator',
      'Suszarka': 'dryer',
      'suszarka': 'dryer',
      'Zmywarka': 'dishwasher',
      'zmywarka': 'dishwasher',
      'Piekarnik': 'oven',
      'piekarnik': 'oven',
      'Kuchenka': 'cooktop',
      'kuchenka': 'cooktop',
      'Płyta grzewcza': 'cooktop',
      'Mikrofalówka': 'microwave',
      'mikrofalówka': 'microwave',
      'Odkurzacz': 'vacuum_cleaner',
      'odkurzacz': 'vacuum_cleaner',
      'Klimatyzacja': 'air_conditioner',
      'klimatyzacja': 'air_conditioner',
      'Klimatyzator': 'air_conditioner'
    };
    
    return mapping[deviceType] || 'other';
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const employeeSession = localStorage.getItem('employeeSession');
      if (!employeeSession) {
        router.push('/pracownik-logowanie');
        return;
      }
      setEmployee(JSON.parse(employeeSession));
      
      // Załaduj reguły cenowe
      loadPricingRules();
    }
  }, [router]);
  
  // Funkcja ładowania reguł cenowych
  const loadPricingRules = async () => {
    try {
      const response = await fetch('/data/pricingRules.json');
      const rules = await response.json();
      setPricingRules(rules);
    } catch (error) {
      console.error('Błąd ładowania reguł cenowych:', error);
      // Fallback - podstawowe reguły
      setPricingRules({
        deviceCategories: {
          other: {
            name: "Inne urządzenie",
            diagnosis: { hourlyRate: 150 },
            repair: { baseRate: 200, hourlyRateAfter30min: 250 }
          }
        }
      });
    }
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

  useEffect(() => {
    if (id) {
      // Mock danych zlecenia - rozszerzony zestaw
      const mockOrderDetails = {
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
            description: 'Pralka nie włącza się, brak reakcji na przyciski. Po podłączeniu do prądu nie świeci się żadna lampka kontrolna.',
            reportedBy: 'Właściciel',
            symptoms: ['Brak zasilania', 'Nie świeci się display', 'Nie reaguje na przyciski'],
            category: 'Elektronika'
          },
          technician: {
            name: 'Michał Kowalski',
            specialization: 'AGD Samsung',
            experience: '8 lat'
          },
          serviceHistory: [
            {
              date: '2023-05-12',
              service: 'Wymiana pompy odpływowej',
              technician: 'Anna Nowak'
            }
          ]
        },
        2: {
          id: 2,
          orderNumber: 'ZL2025-002',
          created: '2025-09-23 09:30',
          priority: 'normal',
          estimatedDuration: 120,
          client: {
            name: 'Anna Nowak',
            phone: '+48 987 654 321',
            email: 'anna.nowak@email.com',
            address: 'ul. Krótka 12, 30-001 Kraków',
            coordinates: { lat: 50.0647, lng: 19.9450 }
          },
          device: {
            brand: 'Bosch',
            model: 'SMS46GI01E',
            type: 'Zmywarka',
            serialNumber: 'B9876543210',
            warrantyStatus: 'Na gwarancji',
            purchaseDate: '2024-01-20'
          },
          problem: {
            description: 'Zmywarka nie myje naczyń dokładnie, słaba cyrkulacja wody. Naczynia wychodzą brudne.',
            reportedBy: 'Właściciel',
            symptoms: ['Słabe mycie', 'Brudne naczynia', 'Słaba cyrkulacja'],
            category: 'Hydraulika'
          },
          technician: {
            name: 'Michał Kowalski',
            specialization: 'AGD Bosch',
            experience: '8 lat'
          },
          serviceHistory: []
        },
        3: {
          id: 3,
          orderNumber: 'ZL2025-003',
          created: '2025-09-28 10:30',
          priority: 'normal',
          estimatedDuration: 120,
          client: {
            name: 'Anna Wiśniewska',
            phone: '+48 555 666 777',
            email: 'anna.wisniewska@email.com',
            address: 'ul. Słoneczna 8, 80-001 Gdańsk',
            coordinates: { lat: 54.3520, lng: 18.6466 }
          },
          device: {
            brand: 'Samsung',
            model: 'RB34T675FSA',
            type: 'Lodówka',
            serialNumber: 'L1234567890',
            warrantyStatus: 'Gwarancja wygasła',
            purchaseDate: '2019-05-10'
          },
          problem: {
            description: 'Lodówka nie chłodzi, kompressor pracuje ciągle. Temperatura w komorze chłodniczej około 15°C.',
            reportedBy: 'Właściciel',
            symptoms: ['Brak chłodzenia', 'Ciągła praca kompresora', 'Wysoka temperatura'],
            category: 'Chłodzenie'
          },
          technician: {
            name: 'Michał Kowalski',
            specialization: 'AGD Samsung',
            experience: '8 lat'
          },
          serviceHistory: [
            {
              date: '2022-08-15',
              service: 'Wymiana termostatu',
              technician: 'Jan Nowak'
            }
          ]
        }
      };

      const details = mockOrderDetails[id];
      if (details) {
        setOrderDetails(details);
        
        // Automatyczne mapowanie kategorii urządzenia na podstawie typu
        if (details.device && details.device.type) {
          const mappedCategory = mapDeviceTypeToCategory(details.device.type);
          setPricingSettings(prev => ({
            ...prev,
            deviceCategory: mappedCategory
          }));
        }
        
        // Załaduj zapisane dane sesji pracy dla tego zlecenia
        const savedSession = localStorage.getItem(`workSession_${id}`);
        if (savedSession) {
          const sessionData = JSON.parse(savedSession);
          setWorkSessions(sessionData.sessions || []);
          setTotalWorkTime(sessionData.totalTime || 0);
          setWorkNotes(sessionData.notes || '');
          setPartsUsed(sessionData.parts || []);
          setBillingData(sessionData.billing || billingData);
          setWorkStatus(sessionData.status || 'in_progress');
        }
      }
      setIsLoading(false);
    }
  }, [id]);

  // Timer functions
  const startTimer = () => {
    const now = new Date();
    setTimerStartTime(now);
    setIsTimerRunning(true);
    
    // Zapisz rozpoczęcie sesji
    const newSession = {
      start: now.toISOString(),
      end: null,
      duration: 0,
      type: 'work'
    };
    setWorkSessions(prev => [...prev, newSession]);
  };

  const pauseTimer = () => {
    if (isTimerRunning && timerStartTime) {
      const now = new Date();
      const sessionDuration = Math.floor((now - timerStartTime) / 1000);
      
      // Aktualizuj ostatnią sesję
      setWorkSessions(prev => {
        const updated = [...prev];
        const lastSession = updated[updated.length - 1];
        if (lastSession && !lastSession.end) {
          lastSession.end = now.toISOString();
          lastSession.duration = sessionDuration;
        }
        return updated;
      });
      
      setIsTimerRunning(false);
      setTimerStartTime(null);
    }
  };

  const stopTimer = () => {
    pauseTimer();
    saveWorkSession();
  };

  const saveWorkSession = () => {
    const sessionData = {
      sessions: workSessions,
      totalTime: totalWorkTime,
      notes: workNotes,
      parts: partsUsed,
      billing: billingData,
      status: workStatus,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(`workSession_${id}`, JSON.stringify(sessionData));
    alert('Sesja pracy została zapisana!');
  };

  // Parts management
  const addPart = () => {
    if (newPart.name && newPart.price > 0) {
      const part = {
        id: Date.now(),
        name: newPart.name,
        quantity: newPart.quantity,
        price: newPart.price,
        total: newPart.quantity * newPart.price
      };
      setPartsUsed(prev => [...prev, part]);
      setNewPart({ name: '', quantity: 1, price: 0 });
      setShowAddPartModal(false);
      
      // Aktualizuj koszt części w rozliczeniu
      setBillingData(prev => ({
        ...prev,
        partsCost: prev.partsCost + part.total
      }));
    }
  };

  // Models management
  const handleModelsUpdate = (models, orderedParts) => {
    setDeviceModels(models);
    
    // Dodaj zamówione części do listy części
    if (orderedParts && orderedParts.length > 0) {
      const newParts = orderedParts.map(item => ({
        id: Date.now() + Math.random(),
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.totalPrice,
        partNumber: item.part_number,
        supplier: item.supplier,
        modelInfo: `${item.modelBrand} ${item.modelNumber}`
      }));
      setPartsUsed(prev => [...prev, ...newParts]);
    }
    
    // Zapisz modele w localStorage
    localStorage.setItem(`models_${id}`, JSON.stringify(models));
  };

  // Funkcja kopiowania modelu do schowka
  const copyModelToClipboard = async (model) => {
    const textToCopy = `${model.brand} ${model.model}`;
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // Nowoczesne API
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback dla starszych przeglądarek
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      // Pokaż potwierdzenie
      setCopiedModel(model.id);
      setTimeout(() => setCopiedModel(null), 2000);
      
    } catch (err) {
      console.error('Błąd kopiowania:', err);
      alert('Nie udało się skopiować tekstu');
    }
  };

  // Funkcja wyszukiwania modelu w internecie
  const searchModelOnline = (model) => {
    const searchQuery = `${model.brand} ${model.model}`;
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    window.open(googleSearchUrl, '_blank');
  };

  // Funkcja zakończenia zlecenia
  const handleCompleteOrder = () => {
    // Ustaw końcową kwotę z rozliczenia
    setCompletionData(prev => ({
      ...prev,
      finalAmount: billingData.totalCost
    }));
    setShowCompletionModal(true);
  };

  // Funkcja obliczania kosztu robocizny na podstawie czasu pracy
  const calculateLaborCost = () => {
    if (!pricingRules) return 0;
    
    const totalWorkTimeInMinutes = workSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const category = pricingRules.deviceCategories[pricingSettings.deviceCategory] || pricingRules.deviceCategories.other;
    
    let calculatedCost = 0;
    
    if (pricingSettings.serviceType === 'diagnosis') {
      // Diagnoza - stawka godzinowa z minimalną opłatą
      const totalWorkTimeInHours = totalWorkTimeInMinutes / 60;
      const hourlyRate = category.diagnosis?.hourlyRate || pricingSettings.customRates.diagnosis;
      const minCharge = category.diagnosis?.minCharge || 120;
      
      const calculatedByTime = totalWorkTimeInHours * hourlyRate;
      calculatedCost = Math.max(calculatedByTime, minCharge); // wybierz większą wartość
    } else {
      // Naprawa - podstawowa stawka do 30 min, potem godzinowa
      const baseRate = category.repair?.baseRate || pricingSettings.customRates.repairBase;
      const hourlyRate = category.repair?.hourlyRateAfter30min || pricingSettings.customRates.repairHourly;
      
      if (totalWorkTimeInMinutes <= 30) {
        calculatedCost = baseRate;
      } else {
        const additionalMinutes = totalWorkTimeInMinutes - 30;
        const additionalHours = additionalMinutes / 60;
        calculatedCost = baseRate + (additionalHours * hourlyRate);
      }
    }
    
    return Math.round(calculatedCost * 100) / 100; // zaokrąglij do 2 miejsc po przecinku
  };

  // Automatyczne obliczanie kosztu robocizny gdy zmienia się czas pracy
  useEffect(() => {
    if (pricingSettings.autoCalculateLaborCost && pricingRules) {
      const newLaborCost = calculateLaborCost();
      setBillingData(prev => ({ ...prev, laborCost: newLaborCost }));
    }
  }, [workSessions, pricingSettings.serviceType, pricingSettings.deviceCategory, pricingSettings.autoCalculateLaborCost, pricingRules]);

  // Funkcja finalizacji zlecenia
  const finalizeOrder = () => {
    // Tutaj można dodać logikę zapisu do bazy danych
    console.log('Finalizing order with data:', completionData);
    
    // Zapisz dane do localStorage
    const completionInfo = {
      orderId: id,
      completedAt: new Date().toISOString(),
      signature: completionData.customerSignature,
      notes: completionData.technicianNotes,
      paymentReceived: completionData.paymentReceived,
      paymentMethod: completionData.paymentMethod,
      finalAmount: completionData.finalAmount,
      totalWorkTime: totalWorkTime,
      workSessions: workSessions
    };
    
    localStorage.setItem(`completion_${id}`, JSON.stringify(completionInfo));
    
    alert('Zlecenie zostało zakończone pomyślnie!');
    setShowCompletionModal(false);
    
    // Można przekierować do listy zleceń
    // router.push('/');
  };

  const removePart = (partId) => {
    const partToRemove = partsUsed.find(p => p.id === partId);
    if (partToRemove) {
      setPartsUsed(prev => prev.filter(p => p.id !== partId));
      setBillingData(prev => ({
        ...prev,
        partsCost: prev.partsCost - partToRemove.total
      }));
    }
  };

  // Billing functions
  const calculateTotalCost = () => {
    const { laborCost, partsCost, travelCost } = billingData;
    const total = parseFloat(laborCost) + parseFloat(partsCost) + parseFloat(travelCost);
    setBillingData(prev => ({ ...prev, totalCost: total }));
  };

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

  // Format time helper
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'normal': return 'text-blue-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie szczegółów zlecenia...</p>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Zlecenie nie zostało znalezione</h2>
          <p className="text-gray-600 mb-4">Nie można znaleźć zlecenia o ID: {id}</p>
          <button
            onClick={() => router.push('/pracownik-panel')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Powrót do panelu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/pracownik-panel')}
                className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
            
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(workStatus)}`}>
                {workStatus === 'pending' && 'Oczekuje'}
                {workStatus === 'in_progress' && 'W trakcie'}
                {workStatus === 'completed' && 'Zakończone'}
                {workStatus === 'cancelled' && 'Anulowane'}
              </span>
              <span className={`text-sm font-medium ${getPriorityColor(orderDetails.priority)}`}>
                Priorytet: {orderDetails.priority === 'high' ? 'Wysoki' : orderDetails.priority === 'normal' ? 'Normalny' : 'Niski'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Timer Bar */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <FiClock className="h-5 w-5" />
                <span className="font-mono text-lg">{formatTime(totalWorkTime)}</span>
                <span className="text-blue-200">| Czas pracy</span>
              </div>
              {workSessions.length > 0 && (
                <div className="text-sm text-blue-200">
                  Sesji: {workSessions.filter(s => s.end).length} | 
                  Łączny czas: {formatTime(workSessions.reduce((acc, s) => acc + (s.duration || 0), 0))}
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:space-x-2">
              {!isTimerRunning ? (
                <button
                  onClick={startTimer}
                  className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <FiPlay className="h-4 w-4 mr-2" />
                  Start
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                >
                  <FiPause className="h-4 w-4 mr-2" />
                  Pauza
                </button>
              )}
              
              <button
                onClick={stopTimer}
                className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <FiSquare className="h-4 w-4 mr-2" />
                Stop
              </button>
              
              <button
                onClick={saveWorkSession}
                className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                <FiSave className="h-4 w-4 mr-2" />
                Zapisz
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Lewa kolumna - Główne informacje */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Klient */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiUser className="h-5 w-5 mr-2" />
                Informacje o kliencie
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

            {/* Location Timer */}
            <LocationTimer 
              orderLocation={orderDetails.client.address}
              onTimerStart={startTimer}
              onTimerStop={stopTimer}
              isTimerRunning={isTimerRunning}
              timerStartTime={timerStartTime}
              workSessions={workSessions}
            />

            {/* Urządzenie */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiTool className="h-5 w-5 mr-2" />
                  Urządzenie
                </h2>
                <button
                  onClick={() => setShowModelManager(true)}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-colors shadow-md"
                >
                  <FiCamera className="h-4 w-4 mr-2" />
                  <span className="mr-1">Skanuj z AI</span>
                  <span className="bg-white bg-opacity-20 px-1 py-0.5 rounded text-xs">🤖</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Marka i model</label>
                  <p className="text-gray-900 font-medium">{orderDetails.device.brand} {orderDetails.device.model}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Typ</label>
                  <p className="text-gray-900">{orderDetails.device.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Numer seryjny</label>
                  <p className="text-gray-900 font-mono text-sm">{orderDetails.device.serialNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status gwarancji</label>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    orderDetails.device.warrantyStatus === 'Na gwarancji' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {orderDetails.device.warrantyStatus}
                  </span>
                </div>
              </div>
              
              {/* Lista dodanych modeli */}
              {deviceModels.length > 0 && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <FiPackage className="h-4 w-4 mr-2" />
                    Dodane modele ({deviceModels.length})
                  </h3>
                  <div className="grid gap-4">
                    {deviceModels.map((model) => (
                      <div key={model.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <button
                                onClick={() => copyModelToClipboard(model)}
                                className={`font-semibold transition-colors cursor-pointer text-left ${
                                  copiedModel === model.id 
                                    ? 'text-green-600' 
                                    : 'text-gray-900 hover:text-blue-600'
                                }`}
                                title="Kliknij aby skopiować model"
                              >
                                {model.brand} {model.model}
                                {copiedModel === model.id && (
                                  <span className="ml-2 text-xs text-green-500">✓ Skopiowano!</span>
                                )}
                              </button>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                model.source === 'ocr' ? 'bg-blue-100 text-blue-800' :
                                model.source === 'database' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {model.source === 'ocr' ? 'OCR' :
                                 model.source === 'database' ? 'Baza' : 'Ręczny'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{model.name}</p>
                            <p className="text-xs text-gray-500">{model.type}</p>
                            {model.serialNumber && (
                              <p className="text-xs text-gray-500 mt-1">S/N: {model.serialNumber}</p>
                            )}
                            {model.parts && model.parts.length > 0 && (
                              <p className="text-xs text-blue-600 mt-1">
                                <FiPackage className="inline mr-1" />
                                {model.parts.length} części dostępnych
                              </p>
                            )}
                            <div className="mt-2 flex items-center space-x-2">
                              <button
                                onClick={() => searchModelOnline(model)}
                                className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                                title="Wyszukaj urządzenie w Google"
                              >
                                <FiSearch className="h-3 w-3 mr-1" />
                                Wyszukaj online
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-400">
                              {new Date(model.dateAdded).toLocaleDateString()}
                            </span>
                            <button
                              onClick={() => searchModelOnline(model)}
                              className="text-purple-600 hover:text-purple-800 text-sm transition-colors"
                              title="Wyszukaj urządzenie w internecie"
                            >
                              <FiExternalLink className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => copyModelToClipboard(model)}
                              className={`text-sm transition-colors ${
                                copiedModel === model.id 
                                  ? 'text-green-600 hover:text-green-800' 
                                  : 'text-gray-600 hover:text-blue-800'
                              }`}
                              title="Kopiuj model do schowka"
                            >
                              {copiedModel === model.id ? (
                                <FiCheck className="h-4 w-4" />
                              ) : (
                                <FiCopy className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setShowModelManager(true)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                              title="Zarządzaj modelami"
                            >
                              <FiSettings className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        {model.notes && (
                          <p className="text-xs text-gray-600 mt-2 italic">{model.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Problem */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiAlertCircle className="h-5 w-5 mr-2" />
                Opis problemu
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Zgłoszony problem</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{orderDetails.problem.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Objawy</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {orderDetails.problem.symptoms.map((symptom, index) => (
                      <span key={index} className="inline-block px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Kategoria</label>
                  <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full ml-2">
                    {orderDetails.problem.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Notatki z pracy */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiFileText className="h-5 w-5 mr-2" />
                Notatki z pracy
              </h2>
              <textarea
                value={workNotes}
                onChange={(e) => setWorkNotes(e.target.value)}
                placeholder="Opisz wykonane czynności, diagnozy, napotykane problemy..."
                className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="mt-3 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Ostatnia aktualizacja: {new Date().toLocaleString('pl-PL')}
                </div>
                <button
                  onClick={saveWorkSession}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Zapisz notatki
                </button>
              </div>
            </div>
          </div>

          {/* Prawa kolumna */}
          <div className="space-y-6">
            
            {/* Status i akcje */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status zlecenia</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Zmień status</label>
                  <select
                    value={workStatus}
                    onChange={(e) => setWorkStatus(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Oczekuje</option>
                    <option value="in_progress">W trakcie</option>
                    <option value="completed">Zakończone</option>
                    <option value="cancelled">Anulowane</option>
                  </select>
                </div>
                
                <div className="pt-4 space-y-2">
                  <button 
                    onClick={handleCompleteOrder}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FiCheckCircle className="h-4 w-4 mr-2" />
                    Zakończ zlecenie
                  </button>
                  <button 
                    onClick={() => setShowBillingModal(true)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FiDollarSign className="h-4 w-4 mr-2" />
                    Rozliczenie
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    <FiCamera className="h-4 w-4 mr-2" />
                    Dodaj zdjęcia
                  </button>
                </div>
              </div>
            </div>

            {/* Użyte części */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiPackage className="h-5 w-5 mr-2" />
                  Użyte części
                </h2>
                <button
                  onClick={() => setShowAddPartModal(true)}
                  className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <FiPlus className="h-4 w-4 mr-1" />
                  Dodaj
                </button>
              </div>
              
              {partsUsed.length === 0 ? (
                <p className="text-gray-500 text-sm">Brak użytych części</p>
              ) : (
                <div className="space-y-2">
                  {partsUsed.map((part) => (
                    <div key={part.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{part.name}</p>
                        <p className="text-xs text-gray-600">{part.quantity}x {part.price} PLN</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{part.total} PLN</span>
                        <button
                          onClick={() => removePart(part.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Suma części:</span>
                      <span>{billingData.partsCost} PLN</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Podsumowanie czasu */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiClock className="h-5 w-5 mr-2" />
                Podsumowanie czasu
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Czas bieżący:</span>
                  <span className="font-mono font-medium">{formatTime(totalWorkTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sesji pracy:</span>
                  <span className="font-medium">{workSessions.filter(s => s.end).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Łączny czas:</span>
                  <span className="font-mono font-medium">
                    {formatTime(workSessions.reduce((acc, s) => acc + (s.duration || 0), 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Szacowany:</span>
                  <span className="text-gray-600">{orderDetails.estimatedDuration} min</span>
                </div>
              </div>
            </div>

            {/* Historia serwisu */}
            {orderDetails.serviceHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiClipboard className="h-5 w-5 mr-2" />
                  Historia serwisu
                </h2>
                <div className="space-y-2">
                  {orderDetails.serviceHistory.map((entry, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-md">
                      <p className="font-medium text-sm">{entry.service}</p>
                      <p className="text-xs text-gray-600">{entry.date} | {entry.technician}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal dodawania części */}
      {showAddPartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Dodaj część</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nazwa części</label>
                <input
                  type="text"
                  value={newPart.name}
                  onChange={(e) => setNewPart(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="np. Pompa odpływowa"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ilość</label>
                  <input
                    type="number"
                    min="1"
                    value={newPart.quantity}
                    onChange={(e) => setNewPart(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cena (PLN)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newPart.price}
                    onChange={(e) => setNewPart(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowAddPartModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={addPart}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Dodaj część
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal rozliczenia */}
      {showBillingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiDollarSign className="h-5 w-5 mr-2" />
              Rozliczenie zlecenia
            </h3>
            
            <div className="space-y-6">
              {/* Ustawienia kosztów */}
              {pricingRules && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Ustawienia kosztów</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Typ usługi */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Typ usługi</label>
                      <select
                        value={pricingSettings.serviceType}
                        onChange={(e) => setPricingSettings(prev => ({ ...prev, serviceType: e.target.value }))}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="diagnosis">🔍 Diagnoza</option>
                        <option value="repair">🔧 Naprawa</option>
                      </select>
                    </div>

                    {/* Kategoria urządzenia */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kategoria urządzenia</label>
                      <select
                        value={pricingSettings.deviceCategory}
                        onChange={(e) => setPricingSettings(prev => ({ ...prev, deviceCategory: e.target.value }))}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      >
                        {Object.entries(pricingRules.deviceCategories).map(([key, category]) => (
                          <option key={key} value={key}>
                            {category.icon} {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Dystans */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Dystans (km)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={pricingSettings.distance}
                        onChange={(e) => setPricingSettings(prev => ({ ...prev, distance: parseFloat(e.target.value) || 0 }))}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="Odległość od bazy"
                      />
                    </div>
                  </div>

                  {/* Auto-obliczanie */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={pricingSettings.autoCalculateLaborCost}
                        onChange={(e) => setPricingSettings(prev => ({ ...prev, autoCalculateLaborCost: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Auto-oblicz koszt robocizny</span>
                    </label>
                    {pricingSettings.autoCalculateLaborCost && (
                      <button
                        onClick={() => setBillingData(prev => ({ ...prev, laborCost: calculateLaborCost() }))}
                        className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Przelicz teraz
                      </button>
                    )}
                  </div>

                  {/* Podgląd obliczeń */}
                  {pricingSettings.autoCalculateLaborCost && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                      <h5 className="font-medium text-blue-900 mb-2">Kalkulacja kosztów</h5>
                      {(() => {
                        const category = pricingRules.deviceCategories[pricingSettings.deviceCategory];
                        const totalMinutes = workSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
                        
                        if (pricingSettings.serviceType === 'diagnosis') {
                          const hourlyRate = category.diagnosis?.hourlyRate || 150;
                          const minCharge = category.diagnosis?.minCharge || 120;
                          const hours = totalMinutes / 60;
                          const calculatedByTime = hours * hourlyRate;
                          const finalCost = Math.max(calculatedByTime, minCharge);
                          
                          return (
                            <div className="text-sm text-blue-800">
                              <p><strong>Diagnoza:</strong> {formatTime(totalMinutes)} ({hours.toFixed(2)}h)</p>
                              <p><strong>Stawka:</strong> {hourlyRate} PLN/h</p>
                              <p><strong>Wyliczenie:</strong> {hours.toFixed(2)}h × {hourlyRate} PLN/h = {calculatedByTime.toFixed(2)} PLN</p>
                              <p><strong>Minimum:</strong> {minCharge} PLN</p>
                              <p className="border-t border-blue-200 pt-1 mt-1">
                                <strong>Końcowy koszt:</strong> <span className="font-semibold">{finalCost.toFixed(2)} PLN</span>
                                {finalCost === minCharge && calculatedByTime < minCharge && (
                                  <span className="text-xs ml-2">(zastosowano minimum)</span>
                                )}
                              </p>
                            </div>
                          );
                        } else {
                          const baseRate = category.repair?.baseRate || 200;
                          const hourlyRate = category.repair?.hourlyRateAfter30min || 250;
                          
                          if (totalMinutes <= 30) {
                            return (
                              <div className="text-sm text-blue-800">
                                <p><strong>Naprawa:</strong> {formatTime(totalMinutes)} (≤ 30 min)</p>
                                <p><strong>Stawka podstawowa:</strong> <span className="font-semibold">{baseRate} PLN</span></p>
                              </div>
                            );
                          } else {
                            const additionalMinutes = totalMinutes - 30;
                            const additionalHours = additionalMinutes / 60;
                            return (
                              <div className="text-sm text-blue-800">
                                <p><strong>Naprawa:</strong> {formatTime(totalMinutes)} (30 min + {formatTime(additionalMinutes)})</p>
                                <p><strong>Podstawa:</strong> {baseRate} PLN (30 min)</p>
                                <p><strong>Dodatkowo:</strong> {additionalHours.toFixed(2)}h × {hourlyRate} PLN/h = {(additionalHours * hourlyRate).toFixed(2)} PLN</p>
                                <p><strong>Razem:</strong> <span className="font-semibold">{calculateLaborCost().toFixed(2)} PLN</span></p>
                              </div>
                            );
                          }
                        }
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Koszty */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Koszt robocizny (PLN)
                    {pricingSettings.autoCalculateLaborCost && (
                      <span className="text-xs text-blue-600 ml-1">(auto-obliczany)</span>
                    )}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={billingData.laborCost}
                    onChange={(e) => setBillingData(prev => ({ ...prev, laborCost: parseFloat(e.target.value) || 0 }))}
                    readOnly={pricingSettings.autoCalculateLaborCost}
                    className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      pricingSettings.autoCalculateLaborCost ? 'bg-blue-50' : ''
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Koszt części (PLN)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={billingData.partsCost}
                    readOnly
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Koszt dojazdu (PLN)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={billingData.travelCost}
                    onChange={(e) => setBillingData(prev => ({ ...prev, travelCost: parseFloat(e.target.value) || 0 }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Podsumowanie */}
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Suma do zapłaty:</span>
                  <span className="text-green-600">{billingData.totalCost.toFixed(2)} PLN</span>
                </div>
              </div>

              {/* Sposób płatności */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sposób płatności</label>
                <div className="grid grid-cols-3 gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="cash"
                      checked={billingData.paymentMethod === 'cash'}
                      onChange={(e) => setBillingData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="mr-2"
                    />
                    Gotówka
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="card"
                      checked={billingData.paymentMethod === 'card'}
                      onChange={(e) => setBillingData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="mr-2"
                    />
                    Karta
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="transfer"
                      checked={billingData.paymentMethod === 'transfer'}
                      onChange={(e) => setBillingData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="mr-2"
                    />
                    Przelew
                  </label>
                </div>
              </div>

              {/* Status płatności */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={billingData.isPaid}
                    onChange={(e) => setBillingData(prev => ({ ...prev, isPaid: e.target.checked }))}
                    className="mr-2"
                  />
                  Płatność otrzymana
                </label>
              </div>

              {/* Notatki do faktury */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Dodatkowe notatki</label>
                <textarea
                  value={billingData.notes}
                  onChange={(e) => setBillingData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notatki do faktury, dodatkowe informacje..."
                  className="mt-1 block w-full h-24 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Czas pracy */}
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-medium text-blue-900 mb-2">Czas pracy</h4>
                <div className="text-sm text-blue-800">
                  <p>Łączny czas: {formatTime(workSessions.reduce((acc, s) => acc + (s.duration || 0), 0))}</p>
                  <p>Liczba sesji: {workSessions.filter(s => s.end).length}</p>
                  {workSessions.filter(s => s.end).map((session, index) => (
                    <p key={index} className="text-xs">
                      Sesja {index + 1}: {new Date(session.start).toLocaleString('pl-PL')} - {new Date(session.end).toLocaleString('pl-PL')} ({formatTime(session.duration)})
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
              <button
                onClick={() => setShowBillingModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={() => {
                  saveWorkSession();
                  setShowBillingModal(false);
                  // Cichy zapis bez alertu
                }}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <FiSave className="h-4 w-4 mr-2" />
                Zapisz rozliczenie
              </button>
              <button
                onClick={() => {
                  saveWorkSession();
                  generateServiceReport();
                  setShowBillingModal(false);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <FiPrinter className="h-4 w-4 mr-2" />
                Generuj protokół
              </button>
              <button
                onClick={() => {
                  saveWorkSession();
                  generateInvoice();
                  setShowBillingModal(false);
                }}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                <FiFileText className="h-4 w-4 mr-2" />
                Generuj fakturę
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Model Manager Modal */}
      <ModelManagerModal 
        isOpen={showModelManager}
        onClose={() => setShowModelManager(false)}
        visitId={id}
        currentModels={deviceModels}
        onModelsUpdate={handleModelsUpdate}
      />

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Zakończ zlecenie</h2>
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Podsumowanie rozliczenia */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Podsumowanie rozliczenia</h3>
                  <div className="text-sm text-blue-800">
                    <p>Koszt robocizny: {billingData.laborCost.toFixed(2)} zł</p>
                    <p>Koszt części: {billingData.partsCost.toFixed(2)} zł</p>
                    <p>Koszt dojazdu: {billingData.travelCost.toFixed(2)} zł</p>
                    <div className="border-t border-blue-200 mt-2 pt-2 font-semibold">
                      Suma: {billingData.totalCost.toFixed(2)} zł
                    </div>
                  </div>
                </div>

                {/* Płatność */}
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={completionData.paymentReceived}
                      onChange={(e) => setCompletionData(prev => ({ ...prev, paymentReceived: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Płatność została pobrana</span>
                  </label>
                  
                  {completionData.paymentReceived && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700">Metoda płatności</label>
                      <select
                        value={completionData.paymentMethod}
                        onChange={(e) => setCompletionData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="cash">Gotówka</option>
                        <option value="card">Karta</option>
                        <option value="transfer">Przelew</option>
                        <option value="blik">BLIK</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Podpis klienta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Podpis klienta (lub imię i nazwisko)
                  </label>
                  <input
                    type="text"
                    value={completionData.customerSignature}
                    onChange={(e) => setCompletionData(prev => ({ ...prev, customerSignature: e.target.value }))}
                    placeholder="Jan Kowalski"
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Notatki serwisanta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notatki końcowe serwisanta
                  </label>
                  <textarea
                    value={completionData.technicianNotes}
                    onChange={(e) => setCompletionData(prev => ({ ...prev, technicianNotes: e.target.value }))}
                    placeholder="Dodatkowe uwagi, zalecenia dla klienta..."
                    rows={3}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Przyciski */}
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={finalizeOrder}
                  disabled={!completionData.customerSignature}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <FiCheckCircle className="inline h-4 w-4 mr-2" />
                  Finalizuj zlecenie
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}