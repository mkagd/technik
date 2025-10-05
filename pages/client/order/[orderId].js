import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { statusToUI } from '../../../utils/fieldMapping';
import { 
  FiArrowLeft, 
  FiPackage, 
  FiUser, 
  FiPhone, 
  FiMapPin,
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiAlertCircle,
  FiCheckCircle,
  FiTool,
  FiStar,
  FiImage,
  FiX,
  FiMessageCircle
} from 'react-icons/fi';

/**
 * Client Order Details Page
 * Szczegółowy widok zamówienia dla klienta
 */
export default function ClientOrderDetails() {
  const router = useRouter();
  const { orderId } = router.query;
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Sprawdź token
  useEffect(() => {
    const token = localStorage.getItem('clientToken');
    if (!token) {
      router.push('/client/login');
    }
  }, [router]);

  // Pobierz dane zamówienia
  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('clientToken');
        
        const response = await fetch(`/api/client/orders?orderId=${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.success) {
          setOrder(data.order);
        } else {
          setError(data.message || 'Nie znaleziono zamówienia');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Błąd pobierania danych zamówienia');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  // Anuluj zamówienie
  const handleCancelOrder = async () => {
    if (!cancelReason.trim() || cancelReason.trim().length < 5) {
      alert('Podaj przyczynę anulowania (minimum 5 znaków)');
      return;
    }

    if (!confirm('Czy na pewno chcesz anulować to zamówienie?')) {
      return;
    }

    try {
      setCancelling(true);
      const token = localStorage.getItem('clientToken');
      
      const response = await fetch('/api/client/cancel-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: order.id,
          reason: cancelReason
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Zamówienie zostało anulowane');
        setShowCancelModal(false);
        window.location.reload(); // Odśwież stronę
      } else {
        alert(data.message || 'Błąd podczas anulowania zamówienia');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert('Błąd połączenia z serwerem');
    } finally {
      setCancelling(false);
    }
  };

  // Wyślij ocenę
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('clientToken');
      
      const response = await fetch('/api/client/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId,
          rating: review.rating,
          comment: review.comment
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Dziękujemy za wystawienie oceny!');
        setShowReviewForm(false);
        // Odśwież dane zamówienia
        window.location.reload();
      } else {
        alert(data.message || 'Błąd podczas wysyłania oceny');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Błąd połączenia z serwerem');
    }
  };

  // Status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        label: statusToUI('pending'), 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: <FiClock /> 
      },
      'in-progress': { 
        label: statusToUI('in-progress'), 
        color: 'bg-blue-100 text-blue-800', 
        icon: <FiTool /> 
      },
      completed: { 
        label: statusToUI('completed'), 
        color: 'bg-green-100 text-green-800', 
        icon: <FiCheckCircle /> 
      },
      scheduled: { 
        label: statusToUI('scheduled'), 
        color: 'bg-purple-100 text-purple-800', 
        icon: <FiCalendar /> 
      },
      cancelled: { 
        label: statusToUI('cancelled'), 
        color: 'bg-red-100 text-red-800', 
        icon: <FiX /> 
      }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  // Priority badge
  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      normal: { label: 'Normalny', color: 'bg-gray-100 text-gray-800' },
      high: { label: 'Wysoki', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Pilny', color: 'bg-red-100 text-red-800' }
    };

    const config = priorityConfig[priority] || priorityConfig.normal;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Nie określono';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie szczegółów zamówienia...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <FiAlertCircle className="text-red-600 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Nie znaleziono zamówienia'}
          </h2>
          <Link href="/client/dashboard">
            <span className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
              ← Powrót do panelu
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Zamówienie {order.id} - Panel Klienta</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/client/dashboard">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <FiArrowLeft className="text-xl text-gray-600" />
                  </button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Zamówienie #{order.id}
                  </h1>
                  <p className="text-gray-600 text-sm mt-1">
                    Utworzono: {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Przyciski akcji */}
                {order.status === 'pending' && (
                  <Link href={`/client/edit-order/${order.id}`}>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                      <FiTool className="text-sm" />
                      Edytuj
                    </button>
                  </Link>
                )}
                
                {['pending', 'scheduled', 'zaplanowane'].includes(order.status) && (
                  <button 
                    onClick={() => setShowCancelModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <FiX className="text-sm" />
                    Anuluj
                  </button>
                )}
                
                {getStatusBadge(order.status)}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Device Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FiPackage className="text-2xl text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {order.deviceType}
                    </h2>
                    <div className="space-y-2 text-gray-600">
                      <p><strong>Marka:</strong> {order.brand}</p>
                      <p><strong>Model:</strong> {order.model || 'Nie podano'}</p>
                      {order.serialNumber && (
                        <p><strong>Numer seryjny:</strong> {order.serialNumber}</p>
                      )}
                    </div>
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Opis problemu:
                      </p>
                      <p className="text-gray-600">
                        {order.issueDescription || 'Brak opisu'}
                      </p>
                    </div>
                  </div>
                  {getPriorityBadge(order.priority)}
                </div>
              </motion.div>

              {/* Status History */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiClock className="text-blue-600" />
                  Historia Statusów
                </h3>
                <div className="space-y-4">
                  {order.statusHistory && order.statusHistory.length > 0 ? (
                    order.statusHistory.map((history, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-blue-600' : 'bg-gray-300'
                          }`}></div>
                          {index < order.statusHistory.length - 1 && (
                            <div className="w-0.5 h-12 bg-gray-200"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between mb-1">
                            {getStatusBadge(history.status)}
                            <span className="text-sm text-gray-500">
                              {formatDate(history.changedAt)}
                            </span>
                          </div>
                          {history.notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              {history.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">Brak historii statusów</p>
                  )}
                </div>
              </motion.div>

              {/* Change History */}
              {order.changeHistory && order.changeHistory.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FiMessageCircle className="text-blue-600" />
                    Historia Zmian
                  </h3>
                  <div className="space-y-4">
                    {order.changeHistory.map((change, index) => (
                      <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {change.action === 'edited' && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                ✏️ Edycja
                              </span>
                            )}
                            {change.action === 'cancelled' && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                                🗑️ Anulowanie
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {change.changedBy === 'client' ? 'Klient' : 'Pracownik'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(change.changedAt)}
                          </span>
                        </div>

                        {change.changes && change.changes.length > 0 && (
                          <div className="space-y-2 mb-2">
                            {change.changes.map((ch, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="font-medium text-gray-700">
                                  {ch.fieldName}:
                                </span>
                                <div className="ml-4 mt-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-red-600 line-through">
                                      {ch.oldValue}
                                    </span>
                                    <span className="text-gray-400">→</span>
                                    <span className="text-green-600 font-medium">
                                      {ch.newValue}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {change.note && (
                          <p className="text-sm text-gray-600 italic">
                            {change.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Photos */}
              {order.photos && order.photos.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FiImage className="text-blue-600" />
                    Zdjęcia
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {order.photos.map((photo, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedImage(photo)}
                        className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={photo}
                          alt={`Zdjęcie ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Review Section */}
              {order.status === 'completed' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FiStar className="text-blue-600" />
                    Ocena Usługi
                  </h3>
                  
                  {order.review ? (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={`text-xl ${
                              i < order.review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-gray-600 font-medium ml-2">
                          {order.review.rating}/5
                        </span>
                      </div>
                      {order.review.comment && (
                        <p className="text-gray-600 mt-2">{order.review.comment}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        Wystawiono: {formatDate(order.review.createdAt)}
                      </p>
                    </div>
                  ) : showReviewForm ? (
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ocena (1-5 gwiazdek)
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReview({ ...review, rating: star })}
                              className="focus:outline-none"
                            >
                              <FiStar
                                className={`text-3xl transition-colors ${
                                  star <= review.rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300 hover:text-yellow-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Komentarz (opcjonalnie)
                        </label>
                        <textarea
                          value={review.comment}
                          onChange={(e) => setReview({ ...review, comment: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Podziel się swoją opinią..."
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Wyślij Ocenę
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowReviewForm(false)}
                          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Anuluj
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <FiStar />
                      Wystaw Ocenę
                    </button>
                  )}
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Technician Info */}
              {order.assignedToName && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FiUser className="text-blue-600" />
                    Technik
                  </h3>
                  <div className="space-y-3">
                    <p className="font-medium text-gray-900">{order.assignedToName}</p>
                    {order.technicianPhone && (
                      <a
                        href={`tel:${order.technicianPhone}`}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                      >
                        <FiPhone />
                        {order.technicianPhone}
                      </a>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Dates */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiCalendar className="text-blue-600" />
                  Terminy
                </h3>
                <div className="space-y-3">
                  {order.scheduledDate && (
                    <div>
                      <p className="text-sm text-gray-600">Zaplanowana wizyta</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(order.scheduledDate)}
                      </p>
                    </div>
                  )}
                  {order.completedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Data zakończenia</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(order.completedAt)}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Costs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiDollarSign className="text-blue-600" />
                  Koszty
                </h3>
                <div className="space-y-3">
                  {order.estimatedCost && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Szacowany koszt</span>
                      <span className="font-medium">{order.estimatedCost} zł</span>
                    </div>
                  )}
                  {order.finalCost && (
                    <div className="flex justify-between pt-3 border-t border-gray-200">
                      <span className="text-gray-900 font-medium">Koszt końcowy</span>
                      <span className="text-xl font-bold text-blue-600">
                        {order.finalCost} zł
                      </span>
                    </div>
                  )}
                  {!order.estimatedCost && !order.finalCost && (
                    <p className="text-gray-500 text-sm">
                      Koszty nie zostały jeszcze określone
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Address */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiMapPin className="text-blue-600" />
                  Adres
                </h3>
                <p className="text-gray-600 whitespace-pre-line">
                  {order.clientAddress || 'Nie podano adresu'}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <FiAlertCircle className="text-2xl text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Anuluj zamówienie
                  </h3>
                  <p className="text-sm text-gray-600">
                    Zamówienie #{order.id}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Powód anulowania *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Podaj powód anulowania zamówienia (minimum 5 znaków)..."
                  disabled={cancelling}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {cancelReason.length}/5 znaków minimum
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Uwaga:</strong> Anulowanie zamówienia jest nieodwracalne. 
                  Po anulowaniu nie będziesz mógł edytować tego zamówienia.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Zamknij
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling || cancelReason.trim().length < 5}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Anulowanie...
                    </>
                  ) : (
                    <>
                      <FiX />
                      Anuluj zamówienie
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
            >
              <FiX className="text-2xl" />
            </button>
            <img
              src={selectedImage}
              alt="Podgląd"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
