// frontend/src/components/shared/Alert.jsx
import React from 'react';
import { XCircleIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from 'lucide-react';

export const Alert = ({ 
  type = 'info', 
  message,
  title,
  onClose,
  className = '',
}) => {
  const typeStyles = {
    success: {
      containerClass: 'bg-green-50 border-green-400 text-green-800',
      icon: <CheckCircleIcon className="h-5 w-5 text-green-400" />,
      titleClass: 'text-green-800',
    },
    error: {
      containerClass: 'bg-red-50 border-red-400 text-red-800',
      icon: <XCircleIcon className="h-5 w-5 text-red-400" />,
      titleClass: 'text-red-800',
    },
    warning: {
      containerClass: 'bg-yellow-50 border-yellow-400 text-yellow-800',
      icon: <ExclamationCircleIcon className="h-5 w-5 text-yellow-400" />,
      titleClass: 'text-yellow-800',
    },
    info: {
      containerClass: 'bg-blue-50 border-blue-400 text-blue-800',
      icon: <InformationCircleIcon className="h-5 w-5 text-blue-400" />,
      titleClass: 'text-blue-800',
    },
  };

  const styles = typeStyles[type];

  return (
    <div 
      className={`border-l-4 p-4 rounded ${styles.containerClass} ${className}`}
      role="alert"
    >
      <div className="flex">
        <div className="flex-shrink-0">{styles.icon}</div>
        <div className="ml-3">
          {title && (
            <h3 className={`text-sm font-medium ${styles.titleClass}`}>{title}</h3>
          )}
          <div className={`text-sm ${title ? 'mt-2' : ''}`}>
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  type === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-600' :
                  type === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' :
                  type === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600' :
                  'text-blue-500 hover:bg-blue-100 focus:ring-blue-600'
                }`}
                onClick={onClose}
              >
                <span className="sr-only">Dismiss</span>
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
