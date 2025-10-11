import { useState } from 'react';
import { FiX, FiUser, FiPhone, FiMail, FiMapPin, FiShoppingCart, FiCalendar, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';

/**
 * ClientMatchModal - Modal showing matched clients
 * Used when creating new reservation to detect existing clients
 */
export default function ClientMatchModal({ isOpen, matches, onSelectClient, onCreateNew, searchType = 'address' }) {
  const [selectedClientId, setSelectedClientId] = useState(matches?.[0]?.clientId || null);

  if (!isOpen) return null;

  const selectedClient = matches?.find(c => c.clientId === selectedClientId);

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      completed: { icon: FiCheckCircle, color: 'text-green-600 bg-green-50', label: 'Zakończone' },
      scheduled: { icon: FiClock, color: 'text-blue-600 bg-blue-50', label: 'Zaplanowane' },
      in_progress: { icon: FiClock, color: 'text-yellow-600 bg-yellow-50', label: 'W trakcie' },
      cancelled: { icon: FiXCircle, color: 'text-red-600 bg-red-50', label: 'Anulowane' },
      pending: { icon: FiClock, color: 'text-gray-600 bg-gray-50', label: 'Oczekujące' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCreateNew();
        }
      }}
    >
      <div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <FiUser className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {matches?.length === 1 ? 'Znaleziono klienta!' : `Znaleziono ${matches?.length} klientów`}
              </h2>
              <p className="text-sm text-blue-100">
                {searchType === 'address' ? 'Klient z tym adresem już istnieje w bazie' : 'Klient z tym numerem już istnieje w bazie'}
              </p>
            </div>
          </div>
          <button
            onClick={onCreateNew}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
          >
            <FiX className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Client selection (if multiple) */}
          {matches?.length > 1 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Wybierz klienta:
              </label>
              <div className="space-y-3">
                {matches.map((client) => (
                  <label
                    key={client.clientId}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                      selectedClientId === client.clientId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="selectedClient"
                      value={client.clientId}
                      checked={selectedClientId === client.clientId}
                      onChange={() => setSelectedClientId(client.clientId)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">{client.name}</span>
                        <span className="text-xs text-gray-500">ID: {client.clientId}</span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FiPhone className="w-4 h-4" />
                          <span>{client.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiMapPin className="w-4 h-4" />
                          <span>{client.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-600">
                          <FiShoppingCart className="w-4 h-4" />
                          <span>{client.orderCount} {client.orderCount === 1 ? 'zlecenie' : 'zleceń'}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">Ostatnie: {new Date(client.lastOrderDate).toLocaleDateString('pl-PL')}</span>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Selected client details */}
          {selectedClient && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <FiUser className="w-4 h-4" />
                    <span className="text-sm font-medium">Imię i nazwisko</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{selectedClient.name}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <FiPhone className="w-4 h-4" />
                    <span className="text-sm font-medium">Telefon</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{selectedClient.phone}</p>
                </div>

                {selectedClient.email && (
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <FiMail className="w-4 h-4" />
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    <p className="text-sm text-gray-900">{selectedClient.email}</p>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <FiMapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">Adres</span>
                  </div>
                  <p className="text-sm text-gray-900">{selectedClient.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-blue-700">
                  <FiShoppingCart className="w-4 h-4" />
                  <span className="font-medium">{selectedClient.orderCount} {selectedClient.orderCount === 1 ? 'zlecenie' : 'zleceń'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <FiCalendar className="w-4 h-4" />
                  <span>Ostatnie: {new Date(selectedClient.lastOrderDate).toLocaleDateString('pl-PL')}</span>
                </div>
                <div className="text-xs text-gray-500">
                  ID: {selectedClient.clientId}
                </div>
              </div>
            </div>
          )}

          {/* Order history */}
          {selectedClient && selectedClient.orders && selectedClient.orders.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiShoppingCart className="w-4 h-4" />
                Historia zleceń ({selectedClient.orders.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedClient.orders.map((order, index) => (
                  <div
                    key={order.orderId || index}
                    className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {order.deviceType || 'Brak typu'}
                            {order.deviceBrand && ` ${order.deviceBrand}`}
                          </span>
                          <StatusBadge status={order.status} />
                        </div>
                        {order.problem && (
                          <p className="text-sm text-gray-600 mb-1">{order.problem}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="font-medium">{order.orderNumber}</span>
                          <span>•</span>
                          <span>{new Date(order.date).toLocaleDateString('pl-PL')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 mb-2">
              <strong>💡 Informacja:</strong>
            </p>
            <p className="text-sm text-blue-800">
              Jeśli wybierzesz tego klienta, jego dane zostaną automatycznie wypełnione w formularzu. 
              Możesz zmienić numer telefonu lub email jeśli dzwoni inna osoba (np. żona/mąż).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3 border-t">
          <button
            onClick={() => {
              if (selectedClient) {
                onSelectClient(selectedClient);
              }
            }}
            disabled={!selectedClient}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition flex items-center justify-center gap-2"
          >
            <FiCheckCircle className="w-5 h-5" />
            Tak, dodaj zlecenie do tego klienta
          </button>
          <button
            onClick={onCreateNew}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition"
          >
            🆕 To nowy klient
          </button>
        </div>
      </div>
    </div>
  );
}
