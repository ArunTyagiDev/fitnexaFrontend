import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const QRCodeGenerator = ({ memberId, memberName, onClose, isOpen }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen && memberId) {
      generateQRCode();
    }
  }, [isOpen, memberId]);

  const generateQRCode = async () => {
    try {
      setIsGenerating(true);
      
      // Create QR code data with member information
      const qrData = JSON.stringify({
        memberId: memberId,
        memberName: memberName,
        type: 'member_payment',
        timestamp: new Date().toISOString()
      });

      const dataUrl = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a');
      link.download = `${memberName}_QR_Code.png`;
      link.href = qrCodeDataUrl;
      link.click();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Member QR Code</h3>
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

        <div className="p-6 text-center">
          {isGenerating ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Generating QR Code...</p>
            </div>
          ) : qrCodeDataUrl ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <img
                  src={qrCodeDataUrl}
                  alt="Member QR Code"
                  className="mx-auto"
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>Member:</strong> {memberName}</p>
                <p><strong>ID:</strong> {memberId}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={downloadQRCode}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Download QR Code
                </button>
                <button
                  onClick={generateQRCode}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Regenerate
                </button>
              </div>
            </div>
          ) : (
            <div className="text-red-600">
              Failed to generate QR code
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500">
            <p>This QR code contains member information for payment processing</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
