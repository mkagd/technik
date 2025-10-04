import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';

/**
 * VisitAuditTimeline Component
 * Displays chronological timeline of visit changes with rollback functionality
 */
export default function VisitAuditTimeline({ visitId, orderId, onRollback }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rollbackConfirm, setRollbackConfirm] = useState(null);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const { showToast } = useToast();

  // Load audit logs
  useEffect(() => {
    if (!visitId) return;
    
    loadAuditLogs();
  }, [visitId]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        visitId,
        limit: 100,
        offset: 0
      });

      const response = await fetch(`/api/visits/audit-log?${params}`);
      const data = await response.json();

      if (data.success) {
        // Sort by timestamp descending (newest first)
        const sortedLogs = (data.logs || []).sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        setLogs(sortedLogs);
      } else {
        setError(data.error || 'Nie udało się załadować historii');
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (log) => {
    if (!rollbackConfirm || rollbackConfirm !== log.id) {
      setRollbackConfirm(log.id);
      return;
    }

    try {
      setRollbackLoading(true);

      const response = await fetch('/api/visits/audit-log/rollback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logId: log.id,
          visitId: log.visitId,
          userId: 'admin', // TODO: Get from session
          userName: 'Administrator',
          reason: `Przywrócono stan sprzed: ${log.reason}`
        })
      });

      const data = await response.json();

      if (data.success) {
        showToast('Zmiany zostały przywrócone', 'success');
        setRollbackConfirm(null);
        
        // Reload logs
        await loadAuditLogs();
        
        // Notify parent to reload visit
        if (onRollback) {
          onRollback(data.visit);
        }
      } else {
        showToast(data.error || 'Nie udało się przywrócić zmian', 'error');
      }
    } catch (err) {
      console.error('Rollback failed:', err);
      showToast('Błąd połączenia z serwerem', 'error');
    } finally {
      setRollbackLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'created':
        return '➕';
      case 'updated':
        return '✏️';
      case 'deleted':
        return '🗑️';
      case 'rollback':
        return '↩️';
      default:
        return '📝';
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case 'created':
        return 'Utworzono';
      case 'updated':
        return 'Zaktualizowano';
      case 'deleted':
        return 'Usunięto';
      case 'rollback':
        return 'Przywrócono';
      default:
        return 'Zmiana';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'created':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'updated':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'deleted':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'rollback':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Tak' : 'Nie';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Ładowanie historii...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-800">{error}</p>
        <button
          onClick={loadAuditLogs}
          className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">Brak historii zmian dla tej wizyty</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Historia zmian ({logs.length})
        </h3>
        <button
          onClick={loadAuditLogs}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          🔄 Odśwież
        </button>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {/* Timeline items */}
        <div className="space-y-6">
          {logs.map((log, index) => (
            <div key={log.id} className="relative pl-12">
              {/* Timeline dot */}
              <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center text-lg border-2 ${getActionColor(log.action)}`}>
                {getActionIcon(log.action)}
              </div>

              {/* Log card */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getActionColor(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{log.userName}</span>
                      {log.reason && `: ${log.reason}`}
                    </p>
                  </div>

                  {/* Rollback button (only for non-rollback actions) */}
                  {log.action !== 'rollback' && (
                    <div>
                      {rollbackConfirm === log.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRollback(log)}
                            disabled={rollbackLoading}
                            className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            {rollbackLoading ? '⏳' : '✓ Potwierdź'}
                          </button>
                          <button
                            onClick={() => setRollbackConfirm(null)}
                            disabled={rollbackLoading}
                            className="px-3 py-1 bg-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-400 disabled:opacity-50"
                          >
                            ✗ Anuluj
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRollback(log)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
                          title="Przywróć ten stan"
                        >
                          ↩️ Przywróć
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Changes list */}
                {log.changes && log.changes.length > 0 && (
                  <div className="space-y-2">
                    {log.changes.map((change, changeIndex) => (
                      <div key={changeIndex} className="bg-gray-50 rounded p-3 text-sm">
                        <div className="font-medium text-gray-700 mb-1">
                          {change.displayName || change.field}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-red-600 line-through">
                            {formatValue(change.oldValue)}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="text-green-600 font-medium">
                            {formatValue(change.newValue)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Metadata */}
                {log.metadata && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <details className="text-xs text-gray-500">
                      <summary className="cursor-pointer hover:text-gray-700">
                        Szczegóły techniczne
                      </summary>
                      <div className="mt-2 space-y-1 pl-4">
                        {log.metadata.ip && (
                          <div>IP: {log.metadata.ip}</div>
                        )}
                        {log.metadata.source && (
                          <div>Źródło: {log.metadata.source}</div>
                        )}
                        {log.metadata.rolledBackLogId && (
                          <div>ID cofniętego logu: {log.metadata.rolledBackLogId}</div>
                        )}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
