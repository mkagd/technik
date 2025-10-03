// components/NotificationCard.js

import React from 'react';
import { FiCheckCircle, FiAlertTriangle, FiInfo, FiX, FiXCircle } from 'react-icons/fi';

const NotificationCard = ({ notification, onClose }) => {
  if (!notification) return null;

  const getNotificationConfig = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: <FiCheckCircle className="h-5 w-5" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-500',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700'
        };
      case 'error':
        return {
          icon: <FiXCircle className="h-5 w-5" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-500',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700'
        };
      case 'warning':
        return {
          icon: <FiAlertTriangle className="h-5 w-5" />,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-500',
          titleColor: 'text-yellow-800',
          messageColor: 'text-yellow-700'
        };
      case 'info':
      default:
        return {
          icon: <FiInfo className="h-5 w-5" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-500',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700'
        };
    }
  };

  const config = getNotificationConfig(notification.type);

  return (
    <div className={`fixed top-4 right-4 max-w-sm w-full ${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg z-50 transform transition-all duration-300 ease-in-out`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${config.iconColor}`}>
            {config.icon}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${config.titleColor}`}>
              {notification.title || getDefaultTitle(notification.type)}
            </p>
            <p className={`mt-1 text-sm ${config.messageColor}`}>
              {notification.message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onClose}
              className={`inline-flex ${config.iconColor} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500`}
            >
              <span className="sr-only">Zamknij</span>
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const getDefaultTitle = (type) => {
  switch (type) {
    case 'success':
      return 'Sukces';
    case 'error':
      return 'Błąd';
    case 'warning':
      return 'Ostrzeżenie';
    case 'info':
    default:
      return 'Informacja';
  }
};

export default NotificationCard;