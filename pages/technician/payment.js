import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import TechnicianLayout from '../../components/TechnicianLayout';

// Component to select visit for payment
function VisitSelector() {
  const router = useRouter();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const token = localStorage.getItem('technicianToken');
        const empData = localStorage.getItem('technicianEmployee');
        
        if (!token || !empData) {
          router.push('/technician/login');
          return;
        }

        const emp = JSON.parse(empData);
        setEmployee(emp);

        // Fetch all orders and filter visits for this technician
        const res = await fetch('/api/orders');
        const data = await res.json();

        if (data.success) {
          const technicianVisits = [];
          data.orders.forEach(order => {
            order.visits.forEach(visit => {
              // Only completed visits without payment
              if (visit.assignedTo === emp.id && 
                  visit.status === 'completed' && 
                  !visit.paymentInfo) {
                technicianVisits.push({
                  ...visit,
                  orderId: order.orderId,
                  clientName: order.clientName,
                  clientAddress: order.clientAddress
                });
              }
            });
          });
          setVisits(technicianVisits);
        }
      } catch (err) {
        console.error('Error fetching visits:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVisits();
  }, [router]);

  const selectVisit = (visit) => {
    router.push(`/technician/payment?orderId=${visit.orderId}&visitId=${visit.visitId}`);
  };

  return (
    <TechnicianLayout employee={employee} currentPage="payment">
      <div className="mb-6">
        <p className="text-gray-600">Wybierz wizytę do rozliczenia z klientem</p>
      </div>

      <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Ładowanie wizyt...</p>
            </div>
          ) : visits.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Brak wizyt do rozliczenia</h2>
              <p className="text-gray-600 mb-6">
                Nie masz żadnych zakończonych wizyt, które wymagają rozliczenia płatności.
              </p>
              <Link href="/technician/visits" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Zobacz wszystkie wizyty
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                  <strong>📋 Wizyty do rozliczenia: {visits.length}</strong>
                  <br />
                  Kliknij na wizytę aby rozpocząć proces przyjęcia płatności
                </p>
              </div>

              {visits.map(visit => (
                <div
                  key={visit.visitId}
                  onClick={() => selectVisit(visit)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-blue-500 hover:shadow-md cursor-pointer transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{visit.clientName}</h3>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-semibold">
                          ✅ Zakończona
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>📍 <strong>Adres:</strong> {visit.clientAddress}</p>
                        <p>🔧 <strong>Opis:</strong> {visit.description || 'Brak opisu'}</p>
                        <p>📅 <strong>Data:</strong> {new Date(visit.scheduledDate).toLocaleDateString('pl-PL')}</p>
                        <p>🆔 <strong>ID wizyty:</strong> {visit.visitId}</p>
                        {visit.totalCost && (
                          <p className="text-lg font-bold text-green-600 mt-2">
                            💵 Do zapłaty: {visit.totalCost} PLN
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="ml-4">
                      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                        Rozlicz →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </TechnicianLayout>
  );
}

export default function PaymentPage() {
  const router = useRouter();
  const { orderId, visitId } = router.query;
  
  const [employee, setEmployee] = useState(null);
  const [order, setOrder] = useState(null);
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Payment data
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [blikAmount, setBlikAmount] = useState('');
  
  // Security data
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [photoProof, setPhotoProof] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // Digital signature
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [hasSignature, setHasSignature] = useState(false);
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Get GPS location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setGpsError(null);
        },
        (error) => {
          setGpsError('Nie można pobrać lokalizacji GPS. Upewnij się, że masz włączoną lokalizację.');
          console.error('GPS Error:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setGpsError('Twoja przeglądarka nie obsługuje geolokalizacji.');
    }
  }, []);

  // Fetch order and visit data
  useEffect(() => {
    // If no orderId/visitId, stay on loading to show visit selection
    if (!orderId || !visitId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('technicianToken');
        const empData = localStorage.getItem('technicianEmployee');
        
        if (!token || !empData) {
          router.push('/technician/login');
          return;
        }

        const emp = JSON.parse(empData);
        setEmployee(emp);

        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();

        if (data.success) {
          setOrder(data.order);
          const foundVisit = data.order.visits.find(v => v.visitId === visitId);
          setVisit(foundVisit);
          
          // Pre-fill amount
          if (foundVisit?.totalCost) {
            setCashAmount(foundVisit.totalCost.toString());
          }
        } else {
          setError('Nie znaleziono zlecenia');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Błąd podczas pobierania danych');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId, visitId, router]);

  // Canvas signature handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      setSignatureData(canvas.toDataURL('image/png'));
    }
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
    setHasSignature(false);
  };

  // Photo upload handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Zdjęcie jest zbyt duże (max 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoProof(reader.result);
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Calculate total amount
  const getTotalAmount = () => {
    const cash = parseFloat(cashAmount) || 0;
    const card = parseFloat(cardAmount) || 0;
    const blik = parseFloat(blikAmount) || 0;
    return cash + card + blik;
  };

  // Validate form
  const validateForm = () => {
    if (!gpsLocation) {
      setError('❌ Brak lokalizacji GPS. Odśwież stronę i włącz lokalizację.');
      return false;
    }

    if (gpsLocation.accuracy > 100) {
      setError('⚠️ Dokładność GPS jest zbyt niska. Przejdź na otwartą przestrzeń.');
      return false;
    }

    const totalAmount = getTotalAmount();
    if (totalAmount <= 0) {
      setError('❌ Wprowadź kwotę płatności');
      return false;
    }

    // For cash payments, require digital signature
    if ((paymentMethod === 'cash' || parseFloat(cashAmount) > 0) && !hasSignature) {
      setError('❌ Dla płatności gotówką wymagany jest PODPIS KLIENTA');
      return false;
    }

    // For card/blik payments, require photo proof
    if ((paymentMethod === 'card' || paymentMethod === 'blik' || parseFloat(cardAmount) > 0 || parseFloat(blikAmount) > 0) && !photoProof) {
      setError('❌ Dla płatności bezgotówkowych wymagane jest ZDJĘCIE DOWODU');
      return false;
    }

    return true;
  };

  // Submit payment
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('technicianToken');
      const employeeData = JSON.parse(localStorage.getItem('technicianEmployee'));

      // Prepare payment data
      const paymentData = {
        orderId,
        visitId,
        paymentMethod,
        cashAmount: parseFloat(cashAmount) || 0,
        cardAmount: parseFloat(cardAmount) || 0,
        blikAmount: parseFloat(blikAmount) || 0,
        totalAmount: getTotalAmount(),
        digitalSignature: signatureData,
        photoProof: photoProof,
        gpsLocation: gpsLocation,
        employeeId: employeeData.id,
        timestamp: new Date().toISOString()
      };

      const res = await fetch('/api/technician/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/technician/visits`);
        }, 2000);
      } else {
        setError(data.error || 'Błąd podczas zapisywania płatności');
      }
    } catch (err) {
      console.error('Error submitting payment:', err);
      setError('Błąd podczas wysyłania danych');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <TechnicianLayout employee={employee} currentPage="payment">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Ładowanie...</p>
          </div>
        </div>
      </TechnicianLayout>
    );
  }

  // If no orderId/visitId, show visit selector
  if (!orderId || !visitId) {
    return <VisitSelector />;
  }

  if (!order || !visit) {
    return (
      <TechnicianLayout employee={employee} currentPage="payment">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 text-xl">❌ Nie znaleziono wizyty</p>
          </div>
        </div>
      </TechnicianLayout>
    );
  }

  return (
    <TechnicianLayout employee={employee} currentPage="payment">
      <div className="max-w-4xl mx-auto">

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-semibold">✅ Płatność zapisana pomyślnie!</p>
              <p className="text-green-600 text-sm mt-1">Przekierowywanie...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          )}

          {/* GPS Status */}
          <div className={`mb-6 border rounded-lg p-4 ${gpsLocation ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{gpsLocation ? '✅' : '⏳'}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Lokalizacja GPS</h3>
                {gpsLocation ? (
                  <>
                    <p className="text-sm text-gray-600 mt-1">
                      📍 Szerokość: {gpsLocation.lat.toFixed(6)}, Długość: {gpsLocation.lng.toFixed(6)}
                    </p>
                    <p className="text-sm text-gray-600">
                      🎯 Dokładność: ±{Math.round(gpsLocation.accuracy)}m
                      {gpsLocation.accuracy > 50 && <span className="text-orange-600"> (Niska dokładność)</span>}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-600 mt-1">
                    {gpsError || 'Pobieranie lokalizacji...'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">📋 Informacje o wizycie</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Klient</p>
                <p className="font-semibold">{order.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Adres</p>
                <p className="font-semibold">{order.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Urządzenie</p>
                <p className="font-semibold">{order.deviceType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Całkowity koszt</p>
                <p className="font-semibold text-lg text-green-600">{visit.totalCost || 0} PLN</p>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment Method Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">💰 Metoda płatności</h2>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-4 rounded-lg border-2 transition ${
                    paymentMethod === 'cash'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-3xl mb-2">💵</div>
                  <div className="font-semibold">Gotówka</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-lg border-2 transition ${
                    paymentMethod === 'card'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-3xl mb-2">💳</div>
                  <div className="font-semibold">Karta</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('blik')}
                  className={`p-4 rounded-lg border-2 transition ${
                    paymentMethod === 'blik'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-3xl mb-2">📱</div>
                  <div className="font-semibold">BLIK</div>
                </button>
              </div>

              {/* Amount Inputs */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">💵 Gotówka</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">💳 Karta</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📱 BLIK</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={blikAmount}
                    onChange={(e) => setBlikAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Total Amount */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Łączna kwota:</span>
                  <span className="text-2xl font-bold text-green-600">{getTotalAmount().toFixed(2)} PLN</span>
                </div>
              </div>
            </div>

            {/* Digital Signature (for cash payments) */}
            {(paymentMethod === 'cash' || parseFloat(cashAmount) > 0) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-2">✍️ Podpis klienta (WYMAGANY)</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Poproś klienta o podpisanie palcem w polu poniżej
                </p>
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={200}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full cursor-crosshair"
                    style={{ touchAction: 'none' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="mt-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  🗑️ Wyczyść podpis
                </button>
                {hasSignature && (
                  <p className="mt-2 text-sm text-green-600 font-semibold">✅ Podpis wprowadzony</p>
                )}
              </div>
            )}

            {/* Photo Proof (for card/blik payments) */}
            {(paymentMethod === 'card' || paymentMethod === 'blik' || parseFloat(cardAmount) > 0 || parseFloat(blikAmount) > 0) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-2">📸 Zdjęcie dowodu płatności (WYMAGANE)</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Zrób zdjęcie potwierdzenia transakcji z terminala POS
                </p>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                {photoPreview && (
                  <div className="mt-4">
                    <img src={photoPreview} alt="Dowód płatności" className="max-w-xs rounded-lg border-2 border-green-500" />
                    <p className="mt-2 text-sm text-green-600 font-semibold">✅ Zdjęcie dodane</p>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                ← Anuluj
              </button>
              <button
                type="submit"
                disabled={submitting || !gpsLocation}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {submitting ? '⏳ Zapisywanie...' : '✅ Potwierdź płatność'}
              </button>
            </div>
          </form>

          {/* Security Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">🔒 Zabezpieczenia</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ Lokalizacja GPS jest weryfikowana</li>
              <li>✅ Podpis cyfrowy klienta jest zapisywany</li>
              <li>✅ Wszystkie transakcje są logowane</li>
              <li>✅ Dane są szyfrowane i niemutowalne</li>
            </ul>
          </div>
        </div>
    </TechnicianLayout>
  );
}
