// frontend/src/components/ui/Modal.jsx
import React, { Fragment } from 'react';
import { XMarkIcon } from 'lucide-react';

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md',
  className = '',
}) => {
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };
  
  const handleBackdropClick = (e) => {
    if (e.target.id === 'modal-backdrop') {
      onClose();
    }
  };

  return (
    <Fragment>
      <div 
        id="modal-backdrop"
        className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto"
        onClick={handleBackdropClick}
      >
        <div className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} ${className}`}>
          {title && (
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={onClose}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          )}
          
          <div className="px-4 py-5 sm:p-6">{children}</div>
          
          {footer && (
            <div className="px-4 py-3 sm:px-6 border-t border-gray-200 bg-gray-50">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Fragment>
  );
};