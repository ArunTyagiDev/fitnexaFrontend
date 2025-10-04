import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import api from '../lib/api';

const GymQRGenerator = ({ gym, onClose, isOpen }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    address: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && gym) {
      getCurrentLocation();
    }
  }, [isOpen, gym]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({
          latitude,
          longitude,
          address: gym?.address || 'Gym Location'
        });
        generateQRCode(latitude, longitude);
      },
      (error) => {
        console.error('Error getting location:', error);
        setError('Unable to get current location. Please enable location access.');
        // Generate QR code without location for now
        generateQRCode(null, null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const generateQRCode = async (lat, lng) => {
    if (!gym) return;

    try {
      setIsGenerating(true);
      setError('');
      
      // Always update gym location to current location when generating QR
      if (lat && lng) {
        try {
          console.log('Updating gym location to current location:', lat, lng);
          await api.put(`/owner/gyms/${gym.id}/location`, {
            latitude: lat,
            longitude: lng
          });
          console.log('Gym location updated successfully to current location');
        } catch (error) {
          console.error('Failed to update gym location:', error);
          // Continue with QR generation even if location update fails
        }
      } else {
        console.warn('No location available for QR generation');
      }
      
      // Create QR code data with gym and location information
      const qrData = JSON.stringify({
        gymId: gym.id,
        gymName: gym.name,
        gymAddress: gym.address,
        type: 'gym_attendance',
        location: {
          latitude: lat,
          longitude: lng,
          address: gym.address
        },
        timestamp: new Date().toISOString(),
        validRadius: 100 // 100 meters radius for valid attendance
      });

      const dataUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a');
      link.download = `${gym.name}_Gym_QR_Code.png`;
      link.href = qrCodeDataUrl;
      link.click();
    }
  };

  const regenerateQRCode = () => {
    getCurrentLocation();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gym Attendance QR Code</h2>
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

        <div className="p-6 space-y-6">
          {/* Gym Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Gym Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Gym Name:</span>
                <span className="ml-2 font-medium">{gym?.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Address:</span>
                <span className="ml-2 font-medium">{gym?.address}</span>
              </div>
              <div>
                <span className="text-gray-600">Location:</span>
                <span className="ml-2 font-medium">
                  {location.latitude && location.longitude 
                    ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                    : 'Location not available'
                  }
                </span>
              </div>
              <div>
                <span className="text-gray-600">Valid Radius:</span>
                <span className="ml-2 font-medium">100 meters</span>
              </div>
            </div>
          </div>

          {/* QR Code Display */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance QR Code</h3>
            
            {isGenerating ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Generating QR Code...</p>
              </div>
            ) : error ? (
              <div className="text-center">
                <div className="text-red-600 mb-4">{error}</div>
                <button
                  onClick={regenerateQRCode}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            ) : qrCodeDataUrl ? (
              <div className="space-y-6">
                {/* QR Code Display */}
                <div className="bg-gray-50 p-8 rounded-lg inline-block">
                  <img
                    src={qrCodeDataUrl}
                    alt="Gym Attendance QR Code"
                    className="mx-auto"
                  />
                </div>
                
                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-blue-900 mb-3">How to Use</h4>
                  <div className="text-left space-y-2 text-blue-800">
                    <div className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                      <p>Display this QR code at your gym entrance</p>
                    </div>
                    <div className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                      <p>Members scan it when entering/leaving the gym</p>
                    </div>
                    <div className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                      <p>Attendance is only recorded when scanned at gym location</p>
                    </div>
                    <div className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                      <p>System tracks in/out times automatically</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={downloadQRCode}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download QR Code
                  </button>
                  <button
                    onClick={regenerateQRCode}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate QR Code
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">
                No QR code available
              </div>
            )}
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-lg font-semibold text-yellow-800 mb-2">Important Notes</h4>
                <ul className="text-yellow-700 space-y-1 text-sm">
                  <li>• This QR code contains location data for attendance validation</li>
                  <li>• Members must be within 100 meters of the gym to mark attendance</li>
                  <li>• Gym location is automatically updated to current location when generating QR</li>
                  <li>• Keep the QR code displayed prominently at the gym entrance</li>
                  <li>• Regenerate the QR code if you move the gym location</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GymQRGenerator;
