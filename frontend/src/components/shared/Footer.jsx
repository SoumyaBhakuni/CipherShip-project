import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start">
            <Link to="/" className="text-xl font-bold">Cipher Ship</Link>
          </div>
          
          <div className="mt-8 md:mt-0">
            <p className="text-center md:text-right text-sm">
              &copy; {currentYear} Cipher Ship. All rights reserved.
            </p>
          </div>
        </div>
        
        <div className="mt-8 border-t border-gray-700 pt-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Privacy Policy</span>
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Terms of Service</span>
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Contact</span>
                Contact
              </a>
            </div>
            
            <div className="mt-4 md:mt-0">
              <p className="text-center md:text-right text-sm text-gray-400">
                Secure package delivery with encrypted customer information
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;