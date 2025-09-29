// Funkcje klienckie do komunikacji z API numeracji dokumentów

// Wygeneruj następny numer faktury (asynchronicznie)
export async function getNextInvoiceNumber() {
  try {
    const response = await fetch('/api/document-numbers?type=invoice');
    const data = await response.json();
    
    if (data.success) {
      return data.number;
    } else {
      throw new Error(data.error || 'Błąd generowania numeru faktury');
    }
  } catch (error) {
    console.error('Błąd pobierania numeru faktury:', error);
    // Fallback - wygeneruj numer lokalnie
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `S/0001/${month}/${year}`;
  }
}

// Wygeneruj następny numer protokołu (asynchronicznie)
export async function getNextProtocolNumber() {
  try {
    const response = await fetch('/api/document-numbers?type=protocol');
    const data = await response.json();
    
    if (data.success) {
      return data.number;
    } else {
      throw new Error(data.error || 'Błąd generowania numeru protokołu');
    }
  } catch (error) {
    console.error('Błąd pobierania numeru protokołu:', error);
    // Fallback - wygeneruj numer lokalnie
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `P/0001/${month}/${year}`;
  }
}

// Pobierz aktualny stan numeracji (bez zwiększania)
export async function getCurrentNumbers() {
  try {
    const response = await fetch('/api/document-numbers?type=current');
    const data = await response.json();
    
    if (data.success) {
      return data.numbers;
    } else {
      throw new Error(data.error || 'Błąd pobierania stanu numeracji');
    }
  } catch (error) {
    console.error('Błąd pobierania stanu numeracji:', error);
    return null;
  }
}