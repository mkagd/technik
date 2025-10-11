/**
 * Przykład integracji PostalCodeService w formularzu rezerwacji
 * 
 * Ten plik pokazuje jak dodać auto-uzupełnianie miasta po kodzie pocztowym
 * do istniejącego formularza rezerwacji.
 */

import { usePostalCode } from '@/lib/postal-code/usePostalCode';
import { useState, useCallback } from 'react';
import debounce from 'lodash/debounce';

// ============================================================
// PRZYKŁAD 1: Prosty (bez debounce)
// ============================================================

export function SimplePostalCodeInput() {
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  
  const { getCityFromPostalCode, isLoading, error } = usePostalCode();

  const handlePostalCodeChange = async (e) => {
    const value = e.target.value;
    setPostalCode(value);

    // Sprawdź czy kod jest kompletny (format: 12-345 lub 12345)
    const cleanCode = value.replace(/\s/g, '');
    if (/^\d{2}-?\d{3}$/.test(cleanCode)) {
      const result = await getCityFromPostalCode(value);
      
      if (result && result.city) {
        setCity(result.city);
      }
    }
  };

  return (
    <>
      <div className="form-group">
        <label>Kod pocztowy</label>
        <input
          type="text"
          value={postalCode}
          onChange={handlePostalCodeChange}
          placeholder="00-000"
          maxLength={6}
          className="form-control"
        />
        {isLoading && <small className="text-info">🔍 Wyszukuję miasto...</small>}
        {error && <small className="text-danger">{error}</small>}
      </div>

      <div className="form-group">
        <label>Miasto</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Będzie uzupełnione automatycznie"
          className="form-control"
        />
      </div>
    </>
  );
}

// ============================================================
// PRZYKŁAD 2: Z Debounce (zalecane dla produkcji)
// ============================================================

export function DebouncedPostalCodeInput() {
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  
  const { getCityFromPostalCode, isLoading } = usePostalCode();

  // Debounce wyszukiwania (czeka 500ms po przestaniu pisać)
  const debouncedLookup = useCallback(
    debounce(async (code) => {
      const result = await getCityFromPostalCode(code);
      if (result?.city) {
        setCity(result.city);
      }
    }, 500),
    []
  );

  const handlePostalCodeChange = (e) => {
    const value = e.target.value;
    setPostalCode(value);
    
    const cleanCode = value.replace(/\s/g, '');
    if (/^\d{2}-?\d{3}$/.test(cleanCode)) {
      debouncedLookup(value);
    }
  };

  return (
    <>
      <div className="form-group">
        <label>Kod pocztowy</label>
        <div className="input-with-icon">
          <input
            type="text"
            value={postalCode}
            onChange={handlePostalCodeChange}
            placeholder="00-000"
            maxLength={6}
            className="form-control"
          />
          {isLoading && <span className="input-icon">⏳</span>}
        </div>
      </div>

      <div className="form-group">
        <label>Miasto</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="form-control"
        />
      </div>
    </>
  );
}

// ============================================================
// PRZYKŁAD 3: Integracja z istniejącym formularzem rezerwacji
// ============================================================

export function RezerwacjaWithPostalCode() {
  const [formData, setFormData] = useState({
    postalCode: '',
    city: '',
    street: '',
    name: '',
    phone: '',
    email: ''
  });
  
  const { getCityFromPostalCode, isLoading } = usePostalCode();

  // Handler dla kodu pocztowego
  const handlePostalCodeChange = async (e) => {
    const value = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      postalCode: value
    }));

    // Auto-uzupełnij miasto
    const cleanCode = value.replace(/\s/g, '');
    if (/^\d{2}-?\d{3}$/.test(cleanCode)) {
      const result = await getCityFromPostalCode(value);
      
      if (result?.city) {
        setFormData(prev => ({
          ...prev,
          city: result.city
        }));
      }
    }
  };

  // Handler dla innych pól
  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <form className="reservation-form">
      <h2>Krok 2: Lokalizacja</h2>
      
      <div className="form-row">
        <div className="form-group col-md-4">
          <label>Kod pocztowy *</label>
          <input
            type="text"
            value={formData.postalCode}
            onChange={handlePostalCodeChange}
            placeholder="00-000"
            maxLength={6}
            required
          />
          {isLoading && <small>🔍 Wyszukuję...</small>}
        </div>

        <div className="form-group col-md-4">
          <label>Miasto *</label>
          <input
            type="text"
            value={formData.city}
            onChange={handleInputChange('city')}
            placeholder="Warszawa"
            required
          />
        </div>

        <div className="form-group col-md-4">
          <label>Ulica *</label>
          <input
            type="text"
            value={formData.street}
            onChange={handleInputChange('street')}
            placeholder="ul. Przykładowa 1"
            required
          />
        </div>
      </div>

      <h2>Krok 3: Dane kontaktowe</h2>
      
      <div className="form-row">
        <div className="form-group col-md-6">
          <label>Imię i nazwisko *</label>
          <input
            type="text"
            value={formData.name}
            onChange={handleInputChange('name')}
            required
          />
        </div>

        <div className="form-group col-md-6">
          <label>Telefon *</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={handleInputChange('phone')}
            placeholder="+48 123 456 789"
            required
          />
        </div>
      </div>

      <button type="submit" className="btn btn-primary">
        Wyślij rezerwację
      </button>
    </form>
  );
}

// ============================================================
// PRZYKŁAD 4: Panel statystyk (Admin)
// ============================================================

export function PostalCodeStats() {
  const { stats, clearCache } = usePostalCode();

  const handleClearCache = () => {
    if (confirm('Czy na pewno chcesz wyczyścić cache kodów pocztowych?')) {
      clearCache();
      alert('Cache wyczyszczony!');
    }
  };

  return (
    <div className="stats-panel card">
      <div className="card-header">
        <h4>📊 Statystyki Geocoding</h4>
      </div>
      <div className="card-body">
        <table className="table">
          <tbody>
            <tr>
              <td>📦 Cache</td>
              <td><strong>{stats.cacheSize}</strong> kodów pocztowych</td>
            </tr>
            <tr>
              <td>🔍 OSM</td>
              <td>
                {stats.osmEnabled ? (
                  <span className="badge badge-success">Włączony (darmowy)</span>
                ) : (
                  <span className="badge badge-secondary">Wyłączony</span>
                )}
              </td>
            </tr>
            <tr>
              <td>🗺️ Google API</td>
              <td>
                {stats.googleEnabled ? (
                  <span className="badge badge-success">Włączony</span>
                ) : (
                  <span className="badge badge-secondary">Wyłączony</span>
                )}
              </td>
            </tr>
            <tr>
              <td>📈 Dzisiaj (Google)</td>
              <td>
                <strong>{stats.googleRequests}</strong> / {stats.googleLimit}
                <div className="progress mt-1">
                  <div 
                    className={`progress-bar ${stats.googleUsagePercent > 80 ? 'bg-danger' : 'bg-success'}`}
                    style={{width: `${stats.googleUsagePercent}%`}}
                  >
                    {stats.googleUsagePercent}%
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {stats.googleUsagePercent > 80 && (
          <div className="alert alert-warning">
            ⚠️ Zbliżasz się do dziennego limitu Google API!
          </div>
        )}

        <button 
          onClick={handleClearCache}
          className="btn btn-outline-danger btn-sm"
        >
          🗑️ Wyczyść cache
        </button>
      </div>
    </div>
  );
}

// ============================================================
// PRZYKŁAD 5: API Route
// ============================================================

/**
 * pages/api/postal-code-lookup.js
 * 
 * import { PostalCodeService } from '@/lib/postal-code/service.ts';
 * 
 * export default async function handler(req, res) {
 *   if (req.method !== 'GET') {
 *     return res.status(405).json({ error: 'Method not allowed' });
 *   }
 * 
 *   const { code } = req.query;
 * 
 *   if (!code) {
 *     return res.status(400).json({ error: 'Brak kodu pocztowego' });
 *   }
 * 
 *   try {
 *     const service = PostalCodeService.getInstance();
 *     const result = await service.getCityFromPostalCode(code);
 * 
 *     if (result) {
 *       return res.status(200).json(result);
 *     } else {
 *       return res.status(404).json({ error: 'Nie znaleziono miasta' });
 *     }
 *   } catch (error) {
 *     console.error('Error:', error);
 *     return res.status(500).json({ error: 'Błąd serwera' });
 *   }
 * }
 */

// ============================================================
// STYLE CSS
// ============================================================

/**
 * Dodaj do swojego CSS:
 * 
 * .input-with-icon {
 *   position: relative;
 * }
 * 
 * .input-icon {
 *   position: absolute;
 *   right: 10px;
 *   top: 50%;
 *   transform: translateY(-50%);
 *   font-size: 14px;
 * }
 * 
 * .form-control:disabled {
 *   background-color: #f5f5f5;
 * }
 * 
 * .text-info {
 *   color: #17a2b8;
 *   font-size: 12px;
 *   margin-top: 4px;
 *   display: block;
 * }
 * 
 * .text-danger {
 *   color: #dc3545;
 *   font-size: 12px;
 *   margin-top: 4px;
 *   display: block;
 * }
 */
