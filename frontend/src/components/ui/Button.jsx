// frontend/src/components/ui/Button.jsx
import React from 'react';

export const Button = ({ 
  children, 
  type = 'button', 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  disabled = false, 
  onClick,
  className = '',
  ...props 
}) => {
  const baseStyles = 'font-medium rounded-md focus:outline-none transition duration-150 ease-in-out';
  
  const variantStyles = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
    outline: 'border border-primary-500 text-primary-600 hover:bg-primary-50 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
    ghost: 'text-primary-600 hover:bg-primary-50 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  };
  
  const sizeStyles = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg',
  };
  
  const widthStyles = fullWidth ? 'w-full' : '';
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  const buttonClasses = `
    ${baseStyles} 
    ${variantStyles[variant]} 
    ${sizeStyles[size]} 
    ${widthStyles} 
    ${disabledStyles}
    ${className}
  `;
  
  return (
    <button
      type={type}
      disabled={disabled}
      className={buttonClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};