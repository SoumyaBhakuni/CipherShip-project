// frontend/src/components/delivery-agent/ScanQR.jsx
import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Alert } from '../shared/Alert';
import { Modal } from '../ui/Modal';
import { QrScanIcon, CheckCircleIcon, XCircleIcon, Camera, FlipCameraIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useQRCode } from '../../hooks/useQRCode';
import * as trackingService from '../../services/tracking';

const ScanQR = () => {
  const { user } = useAuth();
  const { verifyQRCode } = useQRCode();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [packageData, setPackageData] = useState(null);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: 'in-transit',
    details: '',
  });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  // Get available cameras
  useEffect(() => {
    const getVideoDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        setVideoDevices(videoInputs);
        if (videoInputs.length > 0) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      } catch (err) {
        setError('Failed to access camera devices: ' + err.message);
      }
    };

    getVideoDevices();
  }, []);

  // Start the camera when scanning is toggled on
  useEffect(() => {
    if (scanning && selectedDeviceId) {
      startCamera();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [scanning, selectedDeviceId]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start processing frames for QR code detection
        intervalRef.current = setInterval(() => {
          processVideoFrame();
        }, 500); // Process every 500ms
      }
    } catch (err) {
      setError('Failed to start camera: ' + err.message);
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const processVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Match canvas size to video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Here we would normally use a QR code library to detect and decode the QR code
      // For demonstration, let's assume we got a QR code value
      // In a real implementation, you would use a library like jsQR
      
      // Assuming we've detected a QR code and it contains an encrypted string
      // For demo purposes, we'll prompt for manual input if needed
      
      // For now, let's simulate a scan after 3 seconds
      setTimeout(() => {
        // This is just for simulation - in a real app, you'd actually scan a QR code
        const mockQrCodeData = prompt("Enter QR code data (for testing):");
        if (mockQrCodeData) {
          handleQRCodeDetected(mockQrCodeData);
        }
      }, 3000);
    } catch (err) {
      console.error("Error processing video frame:", err);
      setError("Error processing video frame: " + err.message);
    }
  };

  const handleQRCodeDetected = async (encryptedData) => {
    // Stop scanning while processing
    setScanning(false);
    
    try {
      // Verify the QR code with backend
      const result = await verifyQRCode(encryptedData);
      
      if (result.success) {
        setSuccess('QR code verified successfully!');
        
        // Get package details
        const packageResponse = await trackingService.getPackageByTrackingNumber(result.data.trackingNumber);
        setPackageData(packageResponse.data.data);
        setShowPackageModal(true);
      } else {
        setError('Invalid QR code');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify QR code');
    }
  };

  const handleUpdateStatus = async () => {
    if (!packageData || !statusUpdate.status) {
      setError('Invalid status update');
      return;
    }
    
    try {
      await trackingService.updatePackageStatus(
        packageData._id,
        statusUpdate.status,
        statusUpdate.details
      );
      
      setSuccess(`Package status updated to: ${statusUpdate.status}`);
      setShowPackageModal(false);
      
      // Reset state for next scan
      setPackageData(null);
      setStatusUpdate({
        status: 'in-transit',
        details: '',
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update package status');
    }
  };

  const handleToggleScanning = () => {
    if (scanning) {
      setScanning(false);
    } else {
      setError(null);
      setSuccess(null);
      setScanning(true);
    }
  };

  const handleDeviceChange = (e) => {
    setSelectedDeviceId(e.target.value);
    if (scanning) {
      // Restart camera with new device
      stopScanning();
      setScanning(true);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Scan QR Code</h1>
      
      {error && <Alert type="error" message={error} className="mb-6" />}
      {success && <Alert type="success" message={success} className="mb-6" />}
      
      <Card className="mb-6">
        <div className="text-center mb-4">
          <QrScanIcon className="w-16 h-16 mx-auto text-primary-500 mb-4" />
          <h2 className="text-xl font-medium mb-2">QR Code Scanner</h2>
          <p className="text-gray-600 mb-4">
            Scan package QR codes to update delivery status
          </p>
          
          {videoDevices.length > 1 && (
            <div className="mb-4">
              <label htmlFor="cameraSelect" className="block text-sm font-medium text-gray-700 mb-1">
                Select Camera
              </label>
              <select
                id="cameraSelect"
                value={selectedDeviceId || ''}
                onChange={handleDeviceChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                {videoDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <Button
            onClick={handleToggleScanning}
            className="flex items-center mx-auto"
          >
            {scanning ? (
              <>
                <XCircleIcon className="w-5 h-5 mr-2" />
                Stop Scanning
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 mr-2" />
                Start Scanning
              </>
            )}
          </Button>
        </div>
        
        <div className="relative">
          {scanning && (
            <div className="aspect-video max-w-lg mx-auto bg-black relative">
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full hidden"
              />
              <div className="absolute inset-0 border-2 border-primary-500 border-dashed opacity-70 pointer-events-none"></div>
            </div>
          )}
        </div>
      </Card>
      
      {/* Package Update Modal */}
      <Modal
        isOpen={showPackageModal}
        onClose={() => setShowPackageModal(false)}
        title="Update Package Status"
        size="md"
        footer={
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowPackageModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus}>
              Update Status
            </Button>
          </div>
        }
      >
        {packageData && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Package Details</h3>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Tracking Number:</div>
                <div>{packageData.trackingNumber}</div>
                
                <div className="text-gray-500">Recipient:</div>
                <div>{packageData.recipient.name}</div>
                
                <div className="text-gray-500">Address:</div>
                <div>{packageData.recipient.address}</div>
                
                <div className="text-gray-500">Current Status:</div>
                <div>{packageData.status}</div>
              </div>
            </div>
            
            <div>
              <label htmlFor="statusSelect" className="block text-sm font-medium text-gray-700 mb-1">
                Update Status
              </label>
              <select
                id="statusSelect"
                value={statusUpdate.status}
                onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="in-transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="statusDetails" className="block text-sm font-medium text-gray-700 mb-1">
                Details (optional)
              </label>
              <textarea
                id="statusDetails"
                rows="3"
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Add any additional details about this status update..."
                value={statusUpdate.details}
                onChange={(e) => setStatusUpdate({ ...statusUpdate, details: e.target.value })}
              ></textarea>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ScanQR;