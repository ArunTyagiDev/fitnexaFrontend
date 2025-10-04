import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import api from '../../lib/api';

const QRCodePage = () => {
  const [user, setUser] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data } = await api.get('/member/profile');
      setUser(data);
      generateQRCode(data);
    } catch (err) {
      setError('Failed to load user data');
      console.error('Error loading user data:', err);
    }
  };

  const generateQRCode = async (userData) => {
    if (!userData) return;

    try {
      setIsGenerating(true);
      setError('');
      
      // Create QR code data with member information
      const qrData = JSON.stringify({
        memberId: userData.id,
        memberName: userData.name,
        type: 'member_payment',
        timestamp: new Date().toISOString()
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
      link.download = `${user?.name}_Payment_QR.png`;
      link.href = qrCodeDataUrl;
      link.click();
    }
  };

  const regenerateQRCode = () => {
    if (user) {
      generateQRCode(user);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment QR Code</h1>
          <p className="text-gray-600">Show this QR code to your gym owner for payment processing</p>
        </div>

        {/* Member Info Card */}
        {user && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Member Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-lg text-gray-900">{user.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-lg text-gray-900">{user.email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-lg text-gray-900">{user.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Member ID</label>
                <p className="mt-1 text-lg text-gray-900">#{user.id}</p>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Payment QR Code</h2>
            
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
                    alt="Payment QR Code"
                    className="mx-auto"
                  />
                </div>
                
                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use</h3>
                  <div className="text-left space-y-2 text-blue-800">
                    <div className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                      <p>Show this QR code to your gym owner or staff</p>
                    </div>
                    <div className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                      <p>They will scan it with their payment scanner</p>
                    </div>
                    <div className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                      <p>Enter the payment amount and process the payment</p>
                    </div>
                    <div className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                      <p>You'll receive a notification when payment is processed</p>
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
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Notes</h3>
              <ul className="text-yellow-700 space-y-1">
                <li>• Keep your QR code secure and don't share it with others</li>
                <li>• The QR code contains your member information for payment processing</li>
                <li>• Make sure your phone screen is bright and clean when showing the QR code</li>
                <li>• If you lose access to this QR code, you can regenerate it anytime</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodePage;
