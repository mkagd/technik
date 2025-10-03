// components/StatusHistoryTimeline.js

import React from 'react';
import { 
  FiClock, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiPlay, 
  FiPause, 
  FiUser,
  FiFileText,
  FiTool,
  FiPhone,
  FiMapPin
} from 'react-icons/fi';

const StatusHistoryTimeline = ({ statusHistory = [], type = 'order', title = 'Historia statusów' }) => {
  if (!statusHistory || statusHistory.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiClock className="h-5 w-5 mr-2 text-gray-500" />
          {title}
        </h3>
        <div className="text-center py-8">
          <FiClock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Brak historii statusów</p>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status) => {
    const statusConfigs = {
      // Order statuses
      pending: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300', 
        icon: <FiClock className="h-4 w-4" />,
        label: 'Oczekujące',
        dotColor: 'bg-yellow-400'
      },
      in_progress: { 
        color: 'bg-blue-100 text-blue-800 border-blue-300', 
        icon: <FiPlay className="h-4 w-4" />,
        label: 'W realizacji',
        dotColor: 'bg-blue-400'
      },
      completed: { 
        color: 'bg-green-100 text-green-800 border-green-300', 
        icon: <FiCheckCircle className="h-4 w-4" />,
        label: 'Zakończone',
        dotColor: 'bg-green-400'
      },
      cancelled: { 
        color: 'bg-red-100 text-red-800 border-red-300', 
        icon: <FiAlertCircle className="h-4 w-4" />,
        label: 'Anulowane',
        dotColor: 'bg-red-400'
      },
      on_hold: { 
        color: 'bg-orange-100 text-orange-800 border-orange-300', 
        icon: <FiPause className="h-4 w-4" />,
        label: 'Wstrzymane',
        dotColor: 'bg-orange-400'
      },
      // Visit statuses
      scheduled: { 
        color: 'bg-purple-100 text-purple-800 border-purple-300', 
        icon: <FiClock className="h-4 w-4" />,
        label: 'Zaplanowana',
        dotColor: 'bg-purple-400'
      },
      in_route: { 
        color: 'bg-indigo-100 text-indigo-800 border-indigo-300', 
        icon: <FiMapPin className="h-4 w-4" />,
        label: 'W drodze',
        dotColor: 'bg-indigo-400'
      },
      on_site: { 
        color: 'bg-cyan-100 text-cyan-800 border-cyan-300', 
        icon: <FiTool className="h-4 w-4" />,
        label: 'Na miejscu',
        dotColor: 'bg-cyan-400'
      }
    };

    return statusConfigs[status] || {
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      icon: <FiClock className="h-4 w-4" />,
      label: status,
      dotColor: 'bg-gray-400'
    };
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${date.toLocaleTimeString('pl-PL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })} (${Math.floor(diffInHours)}h temu)`;
    } else {
      return date.toLocaleString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Sortuj chronologicznie (najnowsze pierwsze)
  const sortedHistory = [...statusHistory].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <FiClock className="h-5 w-5 mr-2 text-gray-500" />
        {title}
        <span className="ml-2 text-sm font-normal text-gray-500">
          ({statusHistory.length} {statusHistory.length === 1 ? 'wpis' : 'wpisów'})
        </span>
      </h3>

      <div className="flow-root">
        <ul className="-mb-8">
          {sortedHistory.map((entry, index) => {
            const config = getStatusConfig(entry.status);
            const isLast = index === sortedHistory.length - 1;

            return (
              <li key={entry.timestamp + index}>
                <div className="relative pb-8">
                  {!isLast && (
                    <span 
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" 
                      aria-hidden="true" 
                    />
                  )}
                  
                  <div className="relative flex space-x-3">
                    {/* Status dot with icon */}
                    <div>
                      <span className={`${config.dotColor} h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white`}>
                        <span className="text-white">
                          {config.icon}
                        </span>
                      </span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
                            {config.label}
                          </span>
                          {entry.source && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {entry.source}
                            </span>
                          )}
                        </div>
                        <time className="text-sm text-gray-500">
                          {formatTimestamp(entry.timestamp)}
                        </time>
                      </div>
                      
                      {/* Employee info */}
                      {entry.employeeId && (
                        <div className="mt-1 flex items-center text-sm text-gray-600">
                          <FiUser className="h-4 w-4 mr-1" />
                          Pracownik: {entry.employeeId}
                        </div>
                      )}
                      
                      {/* Notes */}
                      {entry.notes && (
                        <div className="mt-2 text-sm text-gray-700 bg-gray-50 rounded-md p-3">
                          <div className="flex items-start">
                            <FiFileText className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                            <p>{entry.notes}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Additional data */}
                      {entry.data && (
                        <div className="mt-2 text-xs text-gray-500">
                          <details className="cursor-pointer">
                            <summary className="hover:text-gray-700">
                              Szczegóły techniczne
                            </summary>
                            <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(entry.data, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Timeline summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {statusHistory.length}
            </div>
            <div className="text-xs text-gray-500">Łączne zmiany</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {statusHistory.filter(h => h.status === 'completed').length}
            </div>
            <div className="text-xs text-gray-500">Zakończone</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {statusHistory.filter(h => h.status === 'in_progress' || h.status === 'on_site').length}
            </div>
            <div className="text-xs text-gray-500">W trakcie</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">
              {new Set(statusHistory.map(h => h.employeeId).filter(Boolean)).size}
            </div>
            <div className="text-xs text-gray-500">Pracowników</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusHistoryTimeline;