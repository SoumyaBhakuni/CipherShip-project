import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode.react';

/**
 * QRCodeGenerator component for generating and displaying QR codes
 * 
 * @param {Object} props
 * @param {Object} props.data - The data to encode in the QR code
 * @param {boolean} props.encrypted - Whether the data is already encrypted
 * @param {string} props.size - The size of the QR code (default: 256)
 * @param {string} props.level - Error correction level ('L', 'M', 'Q', 'H')
 * @param {Function} props.onGenerated - Callback when QR code is generated
 * @returns {JSX.Element}
 */
const QRCodeGenerator = ({ 
  data, 
  encrypted = false, 
  size = 256, 
  level = 'H',
  onGenerated = () => {} 
}) => {
  const [qrData, setQrData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const qrRef = useRef(null);

  useEffect(() => {
    if (!data) return;
    
    const generateQRCode = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let dataToEncode = data;
        
        // If data is not already encrypted and needs to be
        if (!encrypted) {
          // In a real app, you would encrypt the data here or call an API
          // This is a placeholder for demonstration
          dataToEncode = JSON.stringify(data);
        }
        
        setQrData(dataToEncode);
        onGenerated(dataToEncode);
      } catch (err) {
        console.error('Error generating QR code:', err);
        setError('Failed to generate QR code');
      } finally {
        setIsLoading(false);
      }
    };

    generateQRCode();
  }, [data, encrypted, onGenerated]);

  // Function to download QR code as PNG
  const downloadQRCode = () => {
    if (!qrRef.current) return;
    
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;
    
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cipher-ship-qrcode.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-4">Generating QR code...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!qrData) {
    return <div className="p-4">No data provided for QR code generation</div>;
  }

  return (
    <div className="flex flex-col items-center" ref={qrRef}>
      <div className="border border-gray-300 rounded p-4 bg-white">
        <QRCode
          value={qrData}
          size={size}
          level={level}
          includeMargin={true}
          renderAs="canvas"
        />
      </div>
      
      <button
        onClick={downloadQRCode}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Download QR Code
      </button>
    </div>
  );
};

export default QRCodeGenerator;