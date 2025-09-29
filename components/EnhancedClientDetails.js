import React, { useState } from 'react';
import { FiPhone, FiMapPin, FiMail, FiEdit3, FiTag, FiClock, FiUser, FiBuilding, FiCalendar, FiMessageSquare, FiStar, FiEye, FiEyeOff } from 'react-icons/fi';

/**
 * 🎯 ENHANCED CLIENT DETAILS COMPONENT
 * 
 * Komponent do wyświetlania szczegółowych informacji o kliencie w nowej strukturze:
 * - Multiple telefony z etykietami i oznaczeniem głównego
 * - Multiple adresy z etykietami  
 * - Notatki z typami i historią
 * - Tagi kategoryzujące
 * - Harmonogram dostępności
 * - Dane firmowe
 * - Statystyki klienta
 * - Historia kontaktów
 * 
 * Obsługuje zarówno starą jak i nową strukturę danych.
 */

const EnhancedClientDetails = ({ client, onEdit, onClose }) => {
  const [showContactHistory, setShowContactHistory] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);

  if (!client) {
    return (
      <div className="p-6 text-center text-gray-500">
        Brak danych klienta do wyświetlenia
      </div>
    );
  }

  // Sprawdź czy klient ma nową strukturę
  const isEnhanced = client.enhanced === true;
  
  // Przygotuj dane telefonu dla kompatybilności
  const phones = isEnhanced && client.phones ? client.phones : [
    { number: client.phone || '', label: 'Główny', isPrimary: true, notes: '' }
  ];
  
  // Przygotuj dane adresów dla kompatybilności  
  const addresses = isEnhanced && client.addresses ? client.addresses : [
    { address: client.address || '', label: 'Główny', isPrimary: true, notes: client.city ? `Miasto: ${client.city}` : '' }
  ];

  const formatDate = (dateString) => {
    if (!dateString) return 'Brak danych';
    return new Date(dateString).toLocaleString('pl-PL');
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // Formatuj numer telefonu: 123456789 -> 123 456 789
    return phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      cash: '💰 Gotówka',
      transfer: '🏦 Przelew',
      card: '💳 Karta',
      invoice: '📄 Faktura'
    };
    return labels[method] || method;
  };

  const getCommunicationLabel = (method) => {
    const labels = {
      phone: '📞 Telefon',
      email: '📧 Email',
      sms: '📱 SMS'
    };
    return labels[method] || method;
  };

  const getNoteTypeLabel = (type) => {
    const labels = {
      general: '📝 Ogólne',
      contact: '📞 Kontakt',
      technical: '🔧 Techniczne',
      payment: '💰 Płatności',
      complaint: '⚠️ Reklamacja'
    };
    return labels[type] || type;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* NAGŁÓWEK */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            {client.companyInfo?.isCompany ? <FiBuilding className="mr-2" /> : <FiUser className="mr-2" />}
            {client.name}
            {isEnhanced && <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Enhanced</span>}
          </h2>
          <p className="text-gray-600 text-sm">
            ID: {client.id} • Klient od: {formatDate(client.dateAdded)}
          </p>
        </div>
        <div className="flex space-x-2">
          {onEdit && (
            <button
              onClick={() => onEdit(client)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <FiEdit3 className="mr-2" />
              Edytuj
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Zamknij
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEWA KOLUMNA */}
        <div className="space-y-6">
          
          {/* PODSTAWOWE INFORMACJE */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <FiUser className="mr-2" />
              Podstawowe Informacje
            </h3>
            
            {client.email && (
              <div className="mb-2 flex items-center">
                <FiMail className="mr-2 text-gray-500" />
                <span className="text-gray-700">{client.email}</span>
              </div>
            )}
            
            {isEnhanced && client.companyInfo?.isCompany && (
              <div className="mt-3 p-3 bg-blue-50 rounded-md">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                  <FiBuilding className="mr-2" />
                  Dane Firmowe
                </h4>
                {client.companyInfo.companyName && (
                  <p className="text-blue-700 text-sm">Firma: {client.companyInfo.companyName}</p>
                )}
                {client.companyInfo.nip && (
                  <p className="text-blue-700 text-sm">NIP: {client.companyInfo.nip}</p>
                )}
                {client.companyInfo.regon && (
                  <p className="text-blue-700 text-sm">REGON: {client.companyInfo.regon}</p>
                )}
              </div>
            )}
          </div>

          {/* TELEFONY */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <FiPhone className="mr-2" />
              Numery Telefonów
            </h3>
            
            {phones.filter(p => p.number).map((phone, index) => (
              <div key={index} className="mb-2 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="font-mono text-gray-800">
                    {formatPhoneNumber(phone.number)}
                  </span>
                  {phone.isPrimary && (
                    <FiStar className="ml-2 text-yellow-500" size={16} />
                  )}
                </div>
                <div className="text-right">
                  {phone.label && (
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                      {phone.label}
                    </span>
                  )}
                  {phone.notes && (
                    <p className="text-xs text-gray-500 mt-1">{phone.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ADRESY */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <FiMapPin className="mr-2" />
              Adresy
            </h3>
            
            {addresses.filter(a => a.address).map((address, index) => (
              <div key={index} className="mb-3 p-3 border border-gray-200 rounded-md bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-800">{address.address}</p>
                    {address.notes && (
                      <p className="text-xs text-gray-500 mt-1">{address.notes}</p>
                    )}
                  </div>
                  <div className="ml-3 flex items-center">
                    {address.isPrimary && (
                      <FiStar className="text-yellow-500 mr-2" size={16} />
                    )}
                    {address.label && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {address.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TAGI */}
          {isEnhanced && client.tags && client.tags.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <FiTag className="mr-2" />
                Tagi
              </h3>
              <div className="flex flex-wrap gap-2">
                {client.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* PRAWA KOLUMNA */}
        <div className="space-y-6">
          
          {/* DOSTĘPNOŚĆ */}
          {isEnhanced && client.availability && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <FiClock className="mr-2" />
                Dostępność
              </h3>
              
              {client.availability.preferredContactTime && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">Preferowany czas: </span>
                  <span className="text-gray-800">{client.availability.preferredContactTime}</span>
                </div>
              )}
              
              {client.availability.notes && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">Uwagi: </span>
                  <span className="text-gray-800">{client.availability.notes}</span>
                </div>
              )}
              
              {client.availability.workingHours && client.availability.workingHours.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Harmonogram:</h4>
                  <div className="space-y-1">
                    {client.availability.workingHours.slice(0, 3).map((schedule, index) => (
                      <div key={index} className="text-xs text-gray-600">
                        <span className="capitalize">{schedule.dayOfWeek}</span>: {' '}
                        {schedule.periods.map(p => `${p.from}-${p.to} (${p.label})`).join(', ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PREFERENCJE */}
          {isEnhanced && client.preferences && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Preferencje</h3>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Płatność: </span>
                  <span>{getPaymentMethodLabel(client.preferences.preferredPaymentMethod)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Komunikacja: </span>
                  <span>{getCommunicationLabel(client.preferences.preferredCommunication)}</span>
                </div>
                {client.preferences.invoiceRequired && (
                  <div className="text-blue-700">
                    📄 Wymaga faktury
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STATYSTYKI */}
          {isEnhanced && client.stats && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <FiCalendar className="mr-2" />
                Statystyki
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Zamówienia: </span>
                  <span className="text-gray-800">{client.stats.totalOrders || 0}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Zakończone: </span>
                  <span className="text-green-600">{client.stats.completedOrders || 0}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Anulowane: </span>
                  <span className="text-red-600">{client.stats.cancelledOrders || 0}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Śr. wartość: </span>
                  <span className="text-gray-800">{client.stats.averageOrderValue || 0} zł</span>
                </div>
              </div>
              
              {client.stats.lastOrderDate && (
                <div className="mt-2 text-xs text-gray-600">
                  Ostatnie zamówienie: {formatDate(client.stats.lastOrderDate)}
                </div>
              )}
            </div>
          )}

          {/* NOTATKI */}
          {isEnhanced && client.notes && client.notes.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <FiMessageSquare className="mr-2" />
                  Notatki ({client.notes.length})
                </h3>
                <button
                  onClick={() => setShowAllNotes(!showAllNotes)}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  {showAllNotes ? <FiEyeOff className="mr-1" /> : <FiEye className="mr-1" />}
                  {showAllNotes ? 'Ukryj' : 'Pokaż wszystkie'}
                </button>
              </div>
              
              <div className="space-y-3">
                {(showAllNotes ? client.notes : client.notes.slice(0, 2)).map((note) => (
                  <div key={note.id} className="p-3 bg-white border border-gray-200 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-blue-600 font-medium">
                        {getNoteTypeLabel(note.type)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(note.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-800 text-sm">{note.content}</p>
                    <p className="text-xs text-gray-500 mt-1">Autor: {note.createdBy}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HISTORIA KONTAKTÓW */}
          {isEnhanced && client.contactHistory && client.contactHistory.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">
                  Historia Kontaktów ({client.contactHistory.length})
                </h3>
                <button
                  onClick={() => setShowContactHistory(!showContactHistory)}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  {showContactHistory ? <FiEyeOff className="mr-1" /> : <FiEye className="mr-1" />}
                  {showContactHistory ? 'Ukryj' : 'Pokaż'}
                </button>
              </div>
              
              {showContactHistory && (
                <div className="space-y-2">
                  {client.contactHistory.slice(0, 5).map((contact) => (
                    <div key={contact.id} className="p-2 bg-white border border-gray-200 rounded-md text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">
                          {contact.type === 'phone_call' ? '📞' : 
                           contact.type === 'email' ? '📧' : 
                           contact.type === 'sms' ? '📱' : '📝'} 
                          {contact.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(contact.date)}
                        </span>
                      </div>
                      {contact.notes && (
                        <p className="text-gray-700 mt-1">{contact.notes}</p>
                      )}
                      {contact.duration && (
                        <p className="text-xs text-gray-500">
                          Czas trwania: {Math.floor(contact.duration / 60)}:{(contact.duration % 60).toString().padStart(2, '0')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* STOPKA Z INFORMACJAMI TECHNICZNYMI */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex justify-between items-center">
          <div>
            {isEnhanced ? (
              <span className="text-green-600">
                ✅ Struktura rozszerzona {client.enhancedVersion} • {formatDate(client.enhancedDate)}
              </span>
            ) : (
              <span className="text-gray-500">
                📋 Struktura podstawowa • Można rozszerzyć
              </span>
            )}
          </div>
          <div>
            {client.migrated && (
              <span>
                🔄 Migrowany z {client.legacyId} • {formatDate(client.migrationDate)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedClientDetails;