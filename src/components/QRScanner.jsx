import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';

const QRScanner = ({ onScan, onClose, isOpen }) => {
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setError('');
      setIsScanning(true);

      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        setError('No camera found. Please ensure you have a camera connected.');
        return;
      }

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code detected:', result);
          onScan(result.data);
          stopScanner();
        },
        {
          onDecodeError: (error) => {
            // Don't show decode errors as they're frequent during scanning
            console.log('Decode error:', error);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      await qrScannerRef.current.start();
    } catch (err) {
      console.error('Scanner error:', err);
      setError('Failed to start camera. Please check permissions.');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Scan Member QR Code</h3>
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
          {error ? (
            <div className="text-center">
              <div className="text-red-600 mb-4">{error}</div>
              <button
                onClick={startScanner}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Try Again
              </button>
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
            <p>• Point the camera at the member's QR code</p>
            <p>• Make sure the QR code is clearly visible</p>
            <p>• The scan will happen automatically</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
