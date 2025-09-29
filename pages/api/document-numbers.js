// pages/api/document-numbers.js
import fs from 'fs';
import path from 'path';

const DOCUMENT_NUMBERS_PATH = path.join(process.cwd(), 'data', 'documentNumbers.json');

// Wczytaj aktualne numery dokumentów
function loadDocumentNumbers() {
  try {
    const data = fs.readFileSync(DOCUMENT_NUMBERS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Błąd wczytywania numerów dokumentów:', error);
    // Zwróć domyślną konfigurację
    return {
      invoices: {
        prefix: "S",
        currentNumber: 1,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        format: "S/{number:04d}/{month:02d}/{year:02d}"
      },
      protocols: {
        prefix: "P",
        currentNumber: 1,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        format: "P/{number:04d}/{month:02d}/{year:02d}"
      },
      lastUpdate: new Date().toISOString()
    };
  }
}

// Zapisz numery dokumentów
function saveDocumentNumbers(numbers) {
  try {
    numbers.lastUpdate = new Date().toISOString();
    fs.writeFileSync(DOCUMENT_NUMBERS_PATH, JSON.stringify(numbers, null, 2));
    return true;
  } catch (error) {
    console.error('Błąd zapisywania numerów dokumentów:', error);
    return false;
  }
}

// Sprawdź czy trzeba zresetować numery na nowy miesiąc/rok
function checkAndResetNumbers(numbers) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  let changed = false;
  
  // Sprawdź faktury
  if (numbers.invoices.year !== currentYear || numbers.invoices.month !== currentMonth) {
    numbers.invoices.year = currentYear;
    numbers.invoices.month = currentMonth;
    numbers.invoices.currentNumber = 1;
    changed = true;
  }
  
  // Sprawdź protokoły
  if (numbers.protocols.year !== currentYear || numbers.protocols.month !== currentMonth) {
    numbers.protocols.year = currentYear;
    numbers.protocols.month = currentMonth;
    numbers.protocols.currentNumber = 1;
    changed = true;
  }
  
  if (changed) {
    saveDocumentNumbers(numbers);
  }
  
  return numbers;
}

// Wygeneruj następny numer faktury
function getNextInvoiceNumber() {
  let numbers = loadDocumentNumbers();
  numbers = checkAndResetNumbers(numbers);
  
  const invoiceConfig = numbers.invoices;
  const nextNumber = invoiceConfig.currentNumber;
  
  // Sformatuj numer według wzorca
  const formattedNumber = invoiceConfig.format
    .replace('{number:04d}', nextNumber.toString().padStart(4, '0'))
    .replace('{month:02d}', invoiceConfig.month.toString().padStart(2, '0'))
    .replace('{year:02d}', invoiceConfig.year.toString().slice(-2));
  
  // Zwiększ numer dla następnej faktury
  numbers.invoices.currentNumber++;
  saveDocumentNumbers(numbers);
  
  return formattedNumber;
}

// Wygeneruj następny numer protokołu
function getNextProtocolNumber() {
  let numbers = loadDocumentNumbers();
  numbers = checkAndResetNumbers(numbers);
  
  const protocolConfig = numbers.protocols;
  const nextNumber = protocolConfig.currentNumber;
  
  // Sformatuj numer według wzorca
  const formattedNumber = protocolConfig.format
    .replace('{number:04d}', nextNumber.toString().padStart(4, '0'))
    .replace('{month:02d}', protocolConfig.month.toString().padStart(2, '0'))
    .replace('{year:02d}', protocolConfig.year.toString().slice(-2));
  
  // Zwiększ numer dla następnego protokołu
  numbers.protocols.currentNumber++;
  saveDocumentNumbers(numbers);
  
  return formattedNumber;
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    const { type } = req.query;
    
    try {
      if (type === 'invoice') {
        const number = getNextInvoiceNumber();
        res.status(200).json({ success: true, number });
      } else if (type === 'protocol') {
        const number = getNextProtocolNumber();
        res.status(200).json({ success: true, number });
      } else if (type === 'current') {
        let numbers = loadDocumentNumbers();
        numbers = checkAndResetNumbers(numbers);
        res.status(200).json({ success: true, numbers });
      } else {
        res.status(400).json({ success: false, error: 'Invalid type parameter' });
      }
    } catch (error) {
      console.error('Error generating document number:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}