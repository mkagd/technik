import React, { useState, useEffect } from 'react';
import { FiPhone, FiMapPin, FiPlus, FiTrash2, FiStar, FiEdit3, FiClock, FiTag, FiUser, FiBuilding } from 'react-icons/fi';

/**
 * 🎯 ENHANCED CLIENT FORM COMPONENT
 * 
 * Komponent do zarządzania rozszerzoną strukturą klienta z:
 * - Multiple telefony z etykietami
 * - Multiple adresy z etykietami  
 * - Notatki z typami i datami
 * - Tagi kategoryzujące
 * - Harmonogram dostępności
 * - Dane firmowe
 * - Preferencje klienta
 * 
 * Zachowuje pełną kompatybilność z poprzednią wersją.
 */

const EnhancedClientForm = ({ 
  client = null, 
  onSave, 
  onCancel, 
  isEditing = false 
}) => {
  // PODSTAWOWE POLA (kompatybilność wsteczna)
  const [name, setName] = useState(client?.name || '');
  const [email, setEmail] = useState(client?.email || '');
  
  // ENHANCED POLA - MULTIPLE KONTAKTY
  const [phones, setPhones] = useState(client?.phones || [
    { number: client?.phone || '', label: 'Główny', isPrimary: true, notes: '' }
  ]);
  
  const [addresses, setAddresses] = useState(client?.addresses || [
    { address: client?.address || '', label: 'Główny', isPrimary: true, coordinates: null, notes: '' }
  ]);
  
  // ENHANCED POLA - NOTATKI I TAGI
  const [notes, setNotes] = useState(client?.notes || []);
  const [tags, setTags] = useState(client?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState('general');
  
  // ENHANCED POLA - DOSTĘPNOŚĆ
  const [availability, setAvailability] = useState(client?.availability || {
    workingHours: [],
    preferredContactTime: '',
    notes: ''
  });
  
  // ENHANCED POLA - FIRMA
  const [companyInfo, setCompanyInfo] = useState(client?.companyInfo || {
    isCompany: false,
    companyName: '',
    nip: '',
    regon: '',
    krs: ''
  });
  
  // ENHANCED POLA - PREFERENCJE
  const [preferences, setPreferences] = useState(client?.preferences || {
    preferredPaymentMethod: 'cash',
    invoiceRequired: false,
    preferredCommunication: 'phone',
    language: 'pl'
  });

  // FUNKCJE POMOCNICZE - TELEFONY
  const addPhone = () => {
    setPhones([...phones, { number: '', label: '', isPrimary: false, notes: '' }]);
  };

  const removePhone = (index) => {
    const newPhones = phones.filter((_, i) => i !== index);
    setPhones(newPhones);
  };

  const updatePhone = (index, field, value) => {
    const newPhones = [...phones];
    newPhones[index][field] = value;
    
    // Jeśli ustawiamy jako główny, usuń główny status z innych
    if (field === 'isPrimary' && value) {
      newPhones.forEach((phone, i) => {
        if (i !== index) phone.isPrimary = false;
      });
    }
    
    setPhones(newPhones);
  };

  // FUNKCJE POMOCNICZE - ADRESY
  const addAddress = () => {
    setAddresses([...addresses, { address: '', label: '', isPrimary: false, coordinates: null, notes: '' }]);
  };

  const removeAddress = (index) => {
    const newAddresses = addresses.filter((_, i) => i !== index);
    setAddresses(newAddresses);
  };

  const updateAddress = (index, field, value) => {
    const newAddresses = [...addresses];
    newAddresses[index][field] = value;
    
    // Jeśli ustawiamy jako główny, usuń główny status z innych
    if (field === 'isPrimary' && value) {
      newAddresses.forEach((addr, i) => {
        if (i !== index) addr.isPrimary = false;
      });
    }
    
    setAddresses(newAddresses);
  };

  // FUNKCJE POMOCNICZE - TAGI
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // FUNKCJE POMOCNICZE - NOTATKI
  const addNote = () => {
    if (newNote.trim()) {
      const note = {
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: newNote.trim(),
        type: newNoteType,
        createdAt: new Date().toISOString(),
        createdBy: 'user'
      };
      setNotes([...notes, note]);
      setNewNote('');
    }
  };

  const removeNote = (noteId) => {
    setNotes(notes.filter(note => note.id !== noteId));
  };

  // FUNKCJA ZAPISU
  const handleSave = async () => {
    // Przygotuj dane zachowując kompatybilność wsteczną
    const primaryPhone = phones.find(p => p.isPrimary) || phones[0];
    const primaryAddress = addresses.find(a => a.isPrimary) || addresses[0];
    
    const clientData = {
      // ZACHOWANE POLA (kompatybilność wsteczna)
      ...(client || {}),
      name: name.trim(),
      phone: primaryPhone?.number || '',
      email: email.trim(),
      address: primaryAddress?.address || '',
      city: primaryAddress?.address ? primaryAddress.address.split(',').pop()?.trim() || '' : '',
      street: primaryAddress?.address ? primaryAddress.address.split(',')[0]?.trim() || '' : '',
      
      // NOWE POLA
      phones: phones.filter(p => p.number.trim()),
      addresses: addresses.filter(a => a.address.trim()),
      notes,
      tags,
      availability,
      companyInfo,
      preferences,
      
      // METADATA
      enhanced: true,
      enhancedDate: isEditing ? client?.enhancedDate : new Date().toISOString(),
      enhancedVersion: '2.0.0',
      lastModified: new Date().toISOString()
    };

    if (onSave) {
      await onSave(clientData);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {isEditing ? '✏️ Edytuj Klienta' : '➕ Dodaj Nowego Klienta'}
      </h2>

      {/* PODSTAWOWE INFORMACJE */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FiUser className="mr-2" />
          Podstawowe Informacje
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nazwa / Imię i Nazwisko *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Jan Kowalski"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="jan@example.com"
            />
          </div>
        </div>
      </div>

      {/* DANE FIRMOWE */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FiBuilding className="mr-2" />
          Dane Firmowe
        </h3>
        
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={companyInfo.isCompany}
              onChange={(e) => setCompanyInfo({...companyInfo, isCompany: e.target.checked})}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">To jest firma</span>
          </label>
        </div>
        
        {companyInfo.isCompany && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa firmy</label>
              <input
                type="text"
                value={companyInfo.companyName}
                onChange={(e) => setCompanyInfo({...companyInfo, companyName: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="ABC Sp. z o.o."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIP</label>
              <input
                type="text"
                value={companyInfo.nip}
                onChange={(e) => setCompanyInfo({...companyInfo, nip: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="1234567890"
              />
            </div>
          </div>
        )}
      </div>

      {/* MULTIPLE TELEFONY */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FiPhone className="mr-2" />
          Numery Telefonów
        </h3>
        
        {phones.map((phone, index) => (
          <div key={index} className="mb-3 p-4 border border-gray-200 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <div>
                <input
                  type="tel"
                  value={phone.number}
                  onChange={(e) => updatePhone(index, 'number', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="123456789"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={phone.label}
                  onChange={(e) => updatePhone(index, 'label', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Komórka"
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={phone.isPrimary}
                    onChange={(e) => updatePhone(index, 'isPrimary', e.target.checked)}
                    className="mr-2"
                  />
                  <FiStar className={`${phone.isPrimary ? 'text-yellow-500' : 'text-gray-400'}`} />
                  <span className="text-sm ml-1">Główny</span>
                </label>
              </div>
              <div>
                {phones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePhone(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
            </div>
            {phone.notes && (
              <div className="mt-2">
                <input
                  type="text"
                  value={phone.notes}
                  onChange={(e) => updatePhone(index, 'notes', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Notatki o numerze..."
                />
              </div>
            )}
          </div>
        ))}
        
        <button
          type="button"
          onClick={addPhone}
          className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md"
        >
          <FiPlus className="mr-2" />
          Dodaj telefon
        </button>
      </div>

      {/* MULTIPLE ADRESY */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FiMapPin className="mr-2" />
          Adresy
        </h3>
        
        {addresses.map((address, index) => (
          <div key={index} className="mb-3 p-4 border border-gray-200 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <div className="md:col-span-2">
                <input
                  type="text"
                  value={address.address}
                  onChange={(e) => updateAddress(index, 'address', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="ul. Główna 1, 00-001 Warszawa"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={address.label}
                  onChange={(e) => updateAddress(index, 'label', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Dom"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={address.isPrimary}
                    onChange={(e) => updateAddress(index, 'isPrimary', e.target.checked)}
                    className="mr-2"
                  />
                  <FiStar className={`${address.isPrimary ? 'text-yellow-500' : 'text-gray-400'}`} />
                  <span className="text-sm ml-1">Główny</span>
                </label>
                {addresses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAddress(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        <button
          type="button"
          onClick={addAddress}
          className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md"
        >
          <FiPlus className="mr-2" />
          Dodaj adres
        </button>
      </div>

      {/* TAGI */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FiTag className="mr-2" />
          Tagi
        </h3>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Dodaj tag..."
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FiPlus />
          </button>
        </div>
      </div>

      {/* NOTATKI */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FiEdit3 className="mr-2" />
          Notatki
        </h3>
        
        <div className="space-y-3 mb-4">
          {notes.map((note) => (
            <div key={note.id} className="p-3 border border-gray-200 rounded-md">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-gray-800">{note.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {note.type} • {new Date(note.createdAt).toLocaleString('pl-PL')} • {note.createdBy}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeNote(note.id)}
                  className="text-red-600 hover:text-red-800 ml-2"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2">
          <select
            value={newNoteType}
            onChange={(e) => setNewNoteType(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="general">Ogólne</option>
            <option value="contact">Kontakt</option>
            <option value="technical">Techniczne</option>
            <option value="payment">Płatności</option>
            <option value="complaint">Reklamacja</option>
          </select>
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addNote()}
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Dodaj notatkę..."
          />
          <button
            type="button"
            onClick={addNote}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FiPlus />
          </button>
        </div>
      </div>

      {/* DOSTĘPNOŚĆ */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FiClock className="mr-2" />
          Dostępność
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferowany czas kontaktu
            </label>
            <input
              type="text"
              value={availability.preferredContactTime}
              onChange={(e) => setAvailability({...availability, preferredContactTime: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Po 17:00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Uwagi o dostępności
            </label>
            <input
              type="text"
              value={availability.notes}
              onChange={(e) => setAvailability({...availability, notes: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Najlepiej dzwonić wieczorem"
            />
          </div>
        </div>
      </div>

      {/* PREFERENCJE */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Preferencje</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferowana płatność
            </label>
            <select
              value={preferences.preferredPaymentMethod}
              onChange={(e) => setPreferences({...preferences, preferredPaymentMethod: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="cash">Gotówka</option>
              <option value="transfer">Przelew</option>
              <option value="card">Karta</option>
              <option value="invoice">Faktura</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferowana komunikacja
            </label>
            <select
              value={preferences.preferredCommunication}
              onChange={(e) => setPreferences({...preferences, preferredCommunication: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="phone">Telefon</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.invoiceRequired}
                onChange={(e) => setPreferences({...preferences, invoiceRequired: e.target.checked})}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Wymaga faktury</span>
            </label>
          </div>
        </div>
      </div>

      {/* PRZYCISKI AKCJI */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Anuluj
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {isEditing ? 'Zapisz zmiany' : 'Dodaj klienta'}
        </button>
      </div>
    </div>
  );
};

export default EnhancedClientForm;