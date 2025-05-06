// frontend/src/components/ui/Card.jsx
import React from 'react';

export const Card = ({ 
  children, 
  title,
  footer,
  className = '',
  ...props 
}) => {
  return (
    <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`} {...props}>
      {title && (
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          {typeof title === 'string' ? (
            <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
          ) : (
            title
          )}
        </div>
      )}
      <div className="px-4 py-5 sm:p-6">{children}</div>
      {footer && (
        <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
};