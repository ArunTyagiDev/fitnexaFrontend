import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';

const GymQRScanner = ({ onScan, onClose, isOpen }) => {
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [showManualQR, setShowManualQR] = useState(false);
  const [manualQRData, setManualQRData] = useState('');

  useEffect(() => {
    if (isOpen && videoRef.current) {
      // Reset states when opening
      setLocation(null);
      setLocationError('');
      setError('');
      getCurrentLocation();
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  // Debug effect to track location state changes
  useEffect(() => {
    console.log('Location state changed:', location);
  }, [location]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    console.log('Requesting location permission...');
    setLocationError(''); // Clear any previous errors
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Location obtained:', position.coords);
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        console.log('Setting location state:', newLocation);
        setLocation(newLocation);
        setLocationError('');
      },
      (error) => {
        console.error('Location error:', error);
        let errorMessage = 'Unable to get current location. ';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'Please enable location access and try again.';
            break;
        }
        
        setLocationError(errorMessage);
        setLocation(null); // Clear location on error
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };

  const startScanner = async () => {
    try {
      setError('');
      setIsScanning(true);

      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        setError('No camera found. Please ensure you have a camera connected.');
        setIsScanning(false);
        return;
      }

      console.log('Starting QR scanner...');

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('Gym QR Code detected:', result);
          handleQRScan(result.data);
        },
        {
          onDecodeError: (error) => {
            // Don't show decode errors as they're frequent during scanning
            console.log('Decode error:', error);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Use back camera
          maxScansPerSecond: 5,
        }
      );

      console.log('QR scanner created, starting...');
      await qrScannerRef.current.start();
      console.log('QR scanner started successfully');
    } catch (err) {
      console.error('Scanner error:', err);
      let errorMessage = 'Failed to start camera. ';
      
      if (err.message.includes('https')) {
        errorMessage += 'Camera requires HTTPS. Please use a secure connection.';
      } else if (err.message.includes('permission')) {
        errorMessage += 'Please allow camera access and try again.';
      } else {
        errorMessage += 'Please check camera permissions and try again.';
      }
      
      setError(errorMessage);
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };


  const handleManualQRSubmit = () => {
    if (!manualQRData.trim()) {
      setError('Please enter QR code data.');
      return;
    }
    
    try {
      handleQRScan(manualQRData);
    } catch (err) {
      setError('Invalid QR code data. Please check the data and try again.');
    }
  };

  const handleQRScan = (qrData) => {
    try {
      const gymData = JSON.parse(qrData);
      console.log('QR Code data:', gymData);
      
      if (gymData.type !== 'gym_attendance') {
        setError('Invalid QR code. Please scan a gym attendance QR code.');
        return;
      }

      if (!location) {
        setError('Location not available. Please enable location access and try again.');
        return;
      }

      console.log('Member location:', location);
      console.log('Gym location from QR:', gymData.location);

      // Check if member is within valid radius
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        gymData.location.latitude,
        gymData.location.longitude
      );

      console.log('Calculated distance:', distance, 'meters');

      const validRadius = gymData.validRadius || 100; // Default 100 meters

      if (distance > validRadius) {
        setError(`You are ${Math.round(distance)}m away from the gym. Please move closer to scan attendance. Distance: ${Math.round(distance)}m, Required: ${validRadius}m`);
        return;
      }

      // Location is valid, proceed with attendance
      onScan({
        gymId: gymData.gymId,
        gymName: gymData.gymName,
        gymAddress: gymData.gymAddress,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy
        },
        distance: Math.round(distance)
      });

      stopScanner();
    } catch (err) {
      console.error('QR scan error:', err);
      setError('Invalid QR code format. Please scan a valid gym attendance QR code.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Scan Gym QR Code</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Location Status */}
          <div className="mb-4 p-3 rounded-lg bg-gray-50">
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-gray-700">
                {location ? 
                  `Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 
                  locationError ? 'Location failed' : 'Getting location...'
                }
              </span>
              {location && (
                <span className="text-green-600 text-xs">✓ Ready to scan</span>
              )}
              {/* Debug info */}
              <div className="text-xs text-gray-500 mt-1">
                Debug: location={location ? 'set' : 'null'}, error={locationError ? 'yes' : 'no'}
              </div>
            </div>
            {locationError && (
              <div className="text-red-600 text-xs mt-1">
                {locationError}
                <button
                  onClick={getCurrentLocation}
                  className="ml-2 text-blue-600 hover:text-blue-800 underline"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {error ? (
            <div className="text-center">
              <div className="text-red-600 mb-4 p-3 bg-red-50 rounded">{error}</div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setError('');
                    getCurrentLocation();
                    startScanner();
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2"
                >
                  Try Again
                </button>
                <button
                  onClick={() => setShowManualQR(true)}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Enter QR Data Manually
                </button>
              </div>
            </div>
          ) : showManualQR ? (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-center">Enter QR Code Data</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    QR Code Data
                  </label>
                  <textarea
                    value={manualQRData}
                    onChange={(e) => setManualQRData(e.target.value)}
                    placeholder="Paste the QR code data here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleManualQRSubmit}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Process QR Data
                  </button>
                  <button
                    onClick={() => setShowManualQR(false)}
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-gray-100 rounded"
                style={{ objectFit: 'cover' }}
              />
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded">
                    Scanning...
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600">
            <p>• Point the camera at the gym's QR code</p>
            <p>• Make sure you're within 100 meters of the gym</p>
            <p>• The scan will happen automatically</p>
            <p>• Location will be verified before marking attendance</p>
            <p>• Allow location access when prompted by your browser</p>
            <div className="mt-2">
              <button
                onClick={() => setShowManualQR(true)}
                className="text-blue-600 hover:text-blue-800 underline text-xs"
              >
                Having trouble scanning? Enter QR data manually
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GymQRScanner;
