import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { FaTimes, FaCheckCircle, FaTimesCircle, FaUserShield, FaPhone, FaIdCard, FaCar, FaEdit, FaSave } from 'react-icons/fa';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import { adminAPI, uploadAPI } from '../../shared/utils/api';

const KYCDetailModal = ({ kyc, onClose, onApprove, onReject, onResend }) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendReason, setResendReason] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [panPhotoFile, setPanPhotoFile] = useState(null);
  const [shopLicenseFile, setShopLicenseFile] = useState(null);
  const [editForm, setEditForm] = useState({
    name: kyc.scrapperName || '',
    phone: kyc.scrapperPhone || '',
    aadhaarNumber: kyc.aadhaarNumber && kyc.aadhaarNumber !== 'N/A' ? kyc.aadhaarNumber.replace(/[^0-9]/g, '') : '',
    panNumber: kyc.panNumber === 'N/A' || !kyc.panNumber ? '' : kyc.panNumber,
    gstNumber: kyc.gstNumber === 'N/A' || !kyc.gstNumber ? '' : kyc.gstNumber,
  });
  const staticTexts = [
    "Error: Scrapper ID is missing",
    "Please provide a reason for rejection",
    "Are you sure you want to reject this KYC?",
    "KYC Verification Details",
    "Review all documents before making a decision",
    "Scrapper Information",
    "Name",
    "Phone",
    "Aadhaar Number",
    "Vehicle Info",
    "Documents",
    "Aadhaar Card Photo",
    "Selfie Photo",
    "Rejection Reason *",
    "Please provide a reason for rejection...",
    "✓ Verified on {date}",
    "✗ Rejected on {date}",
    "Reason: {reason}",
    "Reject",
    "Approve",
    "Cancel",
    "Confirm Rejection",
    "Close",
    "Request Resend",
    "Confirm Resend Request",
    "Please provide a reason for resend request...",
    "Resend Request Reason *",
    "PAN Number",
    "PAN Photo",
    "Shop License",
    "Shop Photo",
    "Driving License",
    "GST Number",
    "GST Certificate"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  const handleApprove = () => {
    // Add logging
    console.log('Approve clicked for KYC:', kyc);
    const scrapperId = kyc.scrapperId || kyc.id;
    console.log('Scrapper ID:', scrapperId);

    if (!scrapperId) {
      alert(getTranslatedText('Error: Scrapper ID is missing'));
      return;
    }

    // Removed window.confirm to debug blocking issue
    setIsProcessing(true);
    onApprove(scrapperId).finally(() => {
      setIsProcessing(false);
    });
  };

  const handleReject = () => {
    console.log('Reject button clicked', { rejectionReason, scrapperId: kyc.scrapperId || kyc.id });
    if (!rejectionReason.trim()) {
      alert(getTranslatedText('Please provide a reason for rejection'));
      return;
    }

    setIsProcessing(true);
    // Use scrapperId if available, otherwise fallback to id
    const scrapperId = kyc.scrapperId || kyc.id;
    onReject(scrapperId, rejectionReason).finally(() => {
      setIsProcessing(false);
    });
  };

  const handleResend = () => {
    console.log('Resend button clicked', { resendReason, scrapperId: kyc.scrapperId || kyc.id });
    if (!resendReason.trim()) {
      alert(getTranslatedText('Please provide a reason for resend request'));
      return;
    }

    setIsProcessing(true);
    const scrapperId = kyc.scrapperId || kyc.id;
    onResend(scrapperId, resendReason).finally(() => {
      setIsProcessing(false);
    });
  };

  const handleSaveDetails = async () => {
    try {
      setIsProcessing(true);
      const scrapperId = kyc.scrapperId || kyc.id;
      
      // Validate Phone Format (10 digits)
      const phoneDigits = editForm.phone.replace(/[^0-9]/g, '');
      if (phoneDigits.length !== 10) {
        alert("Please enter a valid 10-digit phone number.");
        setIsProcessing(false);
        return;
      }

      // Validate Aadhaar Format (12 digits) if provided
      if (editForm.aadhaarNumber) {
        const aadhaarDigits = editForm.aadhaarNumber.replace(/[^0-9]/g, '');
        if (aadhaarDigits.length !== 12) {
          alert("Please enter a valid 12-digit Aadhaar number.");
          setIsProcessing(false);
          return;
        }
      }

      // Validate PAN format if provided
      if (editForm.panNumber) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(editForm.panNumber)) {
          alert("Please enter a valid PAN number format (e.g., ABCDE1234F)");
          setIsProcessing(false);
          return;
        }
      }

      // Validate GST format if provided
      if (editForm.gstNumber) {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstRegex.test(editForm.gstNumber.toUpperCase())) {
          alert("Please enter a valid GST number format (e.g., 22AAAAA0000A1Z5)");
          setIsProcessing(false);
          return;
        }
      }

      let panPhotoUrl = kyc.panPhotoUrl;
      let shopLicenseUrl = kyc.shopLicenseUrl;

      if (panPhotoFile) {
        const panRes = await uploadAPI.uploadOrderImages([panPhotoFile]);
        if (panRes.success && panRes.data.files && panRes.data.files.length > 0) {
          panPhotoUrl = panRes.data.files[0].url;
        }
      }

      if (shopLicenseFile) {
        const shopRes = await uploadAPI.uploadOrderImages([shopLicenseFile]);
        if (shopRes.success && shopRes.data.files && shopRes.data.files.length > 0) {
          shopLicenseUrl = shopRes.data.files[0].url;
        }
      }

      const payload = {
        name: editForm.name,
        phone: editForm.phone,
        kyc: {
          aadhaarNumber: editForm.aadhaarNumber,
          panNumber: editForm.panNumber,
          panPhotoUrl,
          shopLicenseUrl,
          gstNumber: editForm.gstNumber
        }
      };

      await adminAPI.updateScrapper(scrapperId, payload);
      alert(getTranslatedText("Details updated successfully."));
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      console.error('Update error:', error);
      alert(error.message || 'Failed to update details');
    } finally {
      setIsProcessing(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    
    // Prefix relative URLs with backend base URL
    // API_BASE_URL is 'http://localhost:7000/api', we want 'http://localhost:7000'
    const baseUrl = API_BASE_URL.replace(/\/api$/, '');
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b p-4 md:p-6 flex items-center justify-between z-10" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#f7fafc' }}
              >
                <FaUserShield style={{ color: '#64946e', fontSize: '24px' }} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: '#2d3748' }}>
                  {getTranslatedText("KYC Verification Details")}
                </h2>
                <p className="text-sm" style={{ color: '#718096' }}>
                  {getTranslatedText("Review all documents before making a decision")}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <FaTimes style={{ color: '#718096' }} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6 space-y-6">
            {/* Scrapper Information */}
            <div className="bg-gray-50 rounded-xl p-4 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold" style={{ color: '#2d3748' }}>
                  {getTranslatedText("Scrapper Information")}
                </h3>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors bg-white border"
                    style={{ color: '#0369a1', borderColor: '#bae6fd' }}
                  >
                    <FaEdit />
                    {getTranslatedText("Edit Details")}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setIsEditing(false); }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors bg-white border"
                      style={{ color: '#718096', borderColor: '#e2e8f0' }}
                    >
                      <FaTimes />
                      {getTranslatedText("Cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDetails}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors bg-sky-600 text-white border"
                      style={{ borderColor: '#0284c7' }}
                    >
                      <FaSave />
                      {getTranslatedText("Save")}
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <FaUserShield style={{ color: '#64946e' }} />
                  <div className="w-full">
                    <p className="text-xs" style={{ color: '#718096' }}>{getTranslatedText("Name")}</p>
                    {isEditing ? (
                      <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="mt-1 w-full px-2 py-1 border rounded" />
                    ) : (
                      <p className="font-semibold" style={{ color: '#2d3748' }}>{kyc.scrapperName}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaPhone style={{ color: '#64946e' }} />
                  <div className="w-full">
                    <p className="text-xs" style={{ color: '#718096' }}>{getTranslatedText("Phone")}</p>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editForm.phone} 
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                          setEditForm({ ...editForm, phone: val });
                        }} 
                        placeholder="9876543210"
                        className="mt-1 w-full px-2 py-1 border rounded focus:ring-1 focus:ring-sky-500" 
                      />
                    ) : (
                      <p className="font-semibold" style={{ color: '#2d3748' }}>{kyc.scrapperPhone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaIdCard style={{ color: '#64946e' }} />
                  <div className="w-full">
                    <p className="text-xs" style={{ color: '#718096' }}>{getTranslatedText("Aadhaar Number")}</p>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editForm.aadhaarNumber} 
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 12);
                          setEditForm({ ...editForm, aadhaarNumber: val });
                        }} 
                        placeholder="123456789012"
                        className="mt-1 w-full px-2 py-1 border rounded focus:ring-1 focus:ring-sky-500" 
                      />
                    ) : (
                      <p className="font-semibold" style={{ color: '#2d3748' }}>{kyc.aadhaarNumber}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaCar style={{ color: '#64946e' }} />
                  <div className="w-full min-w-0">
                    <p className="text-xs" style={{ color: '#718096' }}>{getTranslatedText("Vehicle Info")}</p>
                    <p className="font-semibold" style={{ color: '#2d3748' }}>{kyc.vehicleInfo}</p>
                    {kyc.vehiclePhotoUrl && (
                      <img
                        src={getImageUrl(kyc.vehiclePhotoUrl)}
                        alt="Vehicle"
                        className="mt-1.5 max-w-full max-h-20 w-20 h-20 rounded-lg object-contain border border-slate-200"
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaIdCard style={{ color: '#64946e' }} />
                  <div className="w-full">
                    <p className="text-xs" style={{ color: '#718096' }}>{getTranslatedText("PAN Number")}</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.panNumber}
                        onChange={e => setEditForm({ ...editForm, panNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) })}
                        placeholder="ABCDE1234F"
                        className="mt-1 w-full px-2 py-1 border rounded"
                      />
                    ) : (
                      <p className="font-semibold" style={{ color: '#2d3748' }}>{kyc.panNumber || getTranslatedText('N/A')}</p>
                    )}
                  </div>
                </div>
                {['wholesaler', 'industrial'].includes(kyc.scrapperType) && (
                  <div className="flex items-center gap-3">
                    <FaIdCard style={{ color: '#64946e' }} />
                    <div className="w-full">
                      <p className="text-xs" style={{ color: '#718096' }}>{getTranslatedText("GST Number")}</p>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editForm.gstNumber} 
                          onChange={e => {
                            const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
                            setEditForm({ ...editForm, gstNumber: val });
                          }} 
                          placeholder="22AAAAA0000A1Z5"
                          className="mt-1 w-full px-2 py-1 border rounded focus:ring-1 focus:ring-sky-500" 
                        />
                      ) : (
                        <p className="font-semibold" style={{ color: '#2d3748' }}>{kyc.gstNumber || getTranslatedText('N/A')}</p>
                      )}
                    </div>
                  </div>
                )}
                {['big', 'dukandaar', 'wholesaler', 'industrial'].includes(kyc.scrapperType) && kyc.businessLocation && (
                  <div className="flex items-start gap-3 md:col-span-2">
                    <FaUserShield style={{ color: '#64946e', marginTop: '4px' }} />
                    <div>
                      <p className="text-xs" style={{ color: '#718096' }}>{getTranslatedText("Business Location")}</p>
                      <p className="font-semibold" style={{ color: '#2d3748' }}>{kyc.businessLocation.address || getTranslatedText('N/A')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Documents Section */}
            <div className="space-y-8">
              {/* Photo & Aadhaar Match Verification (Side-by-Side View) */}
              <div className="bg-sky-50/60 border border-sky-200 rounded-2xl p-4 md:p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                  <h3 className="text-lg font-bold" style={{ color: '#0369a1' }}>
                    📸 {getTranslatedText("Photo & Aadhaar Match Verification")}
                  </h3>
                  <span className="text-xs font-semibold px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg inline-block text-center border border-yellow-200">
                    {getTranslatedText("Please verify faces match")}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Aadhaar Photo (Front) */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold" style={{ color: '#0c4a6e' }}>
                      {getTranslatedText("Aadhaar Card Front")}
                    </label>
                    <div className="relative rounded-xl overflow-hidden border-2 hover:border-sky-400 transition-colors" style={{ borderColor: '#bae6fd' }}>
                      <img
                        src={getImageUrl(kyc.aadhaarPhotoUrl)}
                        alt="Aadhaar Card"
                        className="w-full h-64 object-contain bg-white cursor-pointer hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x300?text=Aadhaar+Card';
                        }}
                        onClick={() => window.open(kyc.aadhaarPhotoUrl, '_blank')}
                      />
                    </div>
                  </div>

                  {/* Aadhaar Photo (Back) */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold" style={{ color: '#0c4a6e' }}>
                      {getTranslatedText("Aadhaar Card Back")}
                    </label>
                    <div className="relative rounded-xl overflow-hidden border-2 hover:border-sky-400 transition-colors" style={{ borderColor: '#bae6fd' }}>
                      <img
                        src={getImageUrl(kyc.aadhaarBackPhotoUrl)}
                        alt="Aadhaar Card Back"
                        className="w-full h-64 object-contain bg-white cursor-pointer hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x300?text=Aadhaar+Back';
                        }}
                        onClick={() => window.open(kyc.aadhaarBackPhotoUrl, '_blank')}
                      />
                    </div>
                  </div>

                  {/* Selfie Photo (Live) */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold" style={{ color: '#0c4a6e' }}>
                      {getTranslatedText("Scrapper Selfie (Live)")}
                    </label>
                    <div className="relative rounded-xl overflow-hidden border-2 hover:border-sky-400 transition-colors" style={{ borderColor: '#bae6fd' }}>
                      <img
                        src={getImageUrl(kyc.selfieUrl)}
                        alt="Selfie"
                        className="w-full h-64 object-contain bg-white cursor-pointer hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x400?text=Selfie';
                        }}
                        onClick={() => window.open(kyc.selfieUrl, '_blank')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Documents */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold" style={{ color: '#2d3748' }}>
                  {getTranslatedText("Other Documents")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Driving License */}
                  {kyc.licenseUrl && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" style={{ color: '#2d3748' }}>
                        {getTranslatedText("Driving License")}
                      </label>
                      <div className="relative rounded-xl overflow-hidden border-2" style={{ borderColor: '#e2e8f0' }}>
                        <img
                          src={getImageUrl(kyc.licenseUrl)}
                          alt="Driving License"
                          className="w-full h-64 object-contain bg-gray-50"
                          onClick={() => window.open(kyc.licenseUrl, '_blank')}
                        />
                      </div>
                    </div>
                  )}

                  {/* PAN Photo */}
                  {(kyc.panPhotoUrl || isEditing) && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" style={{ color: '#2d3748' }}>
                        {getTranslatedText("PAN Photo")}
                      </label>
                      <div className="relative rounded-xl overflow-hidden border-2" style={{ borderColor: '#e2e8f0' }}>
                        <img
                          src={panPhotoFile ? URL.createObjectURL(panPhotoFile) : (getImageUrl(kyc.panPhotoUrl) || 'https://via.placeholder.com/400x300?text=No+Image')}
                          alt="PAN Card"
                          className="w-full h-64 object-contain bg-gray-50 cursor-pointer"
                          onClick={() => {
                            if (!isEditing && kyc.panPhotoUrl) window.open(kyc.panPhotoUrl, '_blank');
                          }}
                        />
                        {isEditing && (
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <label className="cursor-pointer bg-white text-gray-800 font-semibold py-2 px-4 rounded shadow">
                              {getTranslatedText("Upload New")}
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                if (e.target.files[0]) setPanPhotoFile(e.target.files[0]);
                              }} />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Shop License */}
                  {(kyc.shopLicenseUrl || isEditing) && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" style={{ color: '#2d3748' }}>
                        {getTranslatedText("Shop License")}
                      </label>
                      <div className="relative rounded-xl overflow-hidden border-2" style={{ borderColor: '#e2e8f0' }}>
                        <img
                          src={shopLicenseFile ? URL.createObjectURL(shopLicenseFile) : (getImageUrl(kyc.shopLicenseUrl) || 'https://via.placeholder.com/400x300?text=No+Image')}
                          alt="Shop License"
                          className="w-full h-64 object-contain bg-gray-50 cursor-pointer"
                          onClick={() => {
                            if (!isEditing && kyc.shopLicenseUrl) window.open(kyc.shopLicenseUrl, '_blank');
                          }}
                        />
                        {isEditing && (
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <label className="cursor-pointer bg-white text-gray-800 font-semibold py-2 px-4 rounded shadow">
                              {getTranslatedText("Upload New")}
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                if (e.target.files[0]) setShopLicenseFile(e.target.files[0]);
                              }} />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Shop Photo (for Dukandaar / shopkeeper) */}
                  {kyc.scrapperType === 'dukandaar' && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" style={{ color: '#2d3748' }}>
                        {getTranslatedText("Shop Photo")}
                      </label>
                      <div className="relative rounded-xl overflow-hidden border-2" style={{ borderColor: '#e2e8f0' }}>
                        <img
                          src={kyc.shopPhotoUrl ? getImageUrl(kyc.shopPhotoUrl) : 'https://via.placeholder.com/400x300?text=Shop+Photo+not+provided'}
                          alt="Shop Photo"
                          className="w-full h-64 object-contain bg-gray-50 cursor-pointer"
                          onClick={() => {
                            if (kyc.shopPhotoUrl) window.open(kyc.shopPhotoUrl, '_blank');
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* GST Certificate */}
                  {['wholesaler', 'industrial'].includes(kyc.scrapperType) && kyc.gstCertificateUrl && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" style={{ color: '#2d3748' }}>
                        {getTranslatedText("GST Certificate")}
                      </label>
                      <div className="relative rounded-xl overflow-hidden border-2" style={{ borderColor: '#e2e8f0' }}>
                        <img
                          src={getImageUrl(kyc.gstCertificateUrl)}
                          alt="GST Certificate"
                          className="w-full h-64 object-contain bg-gray-50 cursor-pointer"
                          onClick={() => window.open(kyc.gstCertificateUrl, '_blank')}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Rejection Reason Form */}
            {showRejectForm && (
              <div className="space-y-2 animate-fadeIn">
                <label className="block text-sm font-semibold" style={{ color: '#2d3748' }}>
                  {getTranslatedText("Rejection Reason *")}
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={getTranslatedText("Please provide a reason for rejection...")}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: '#e2e8f0',
                    focusBorderColor: '#64946e',
                    focusRingColor: '#64946e'
                  }}
                  autoFocus
                />
              </div>
            )}

            {/* Resend Reason Form */}
            {showResendForm && (
              <div className="space-y-2 animate-fadeIn">
                <label className="block text-sm font-semibold" style={{ color: '#2d3748' }}>
                  {getTranslatedText("Resend Request Reason *")}
                </label>
                <textarea
                  value={resendReason}
                  onChange={(e) => setResendReason(e.target.value)}
                  placeholder={getTranslatedText("Please provide a reason for resend request...")}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: '#e2e8f0',
                    focusBorderColor: '#64946e',
                    focusRingColor: '#64946e'
                  }}
                  autoFocus
                />
              </div>
            )}

            {/* Status History */}
            {kyc.verifiedAt && (
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-sm" style={{ color: '#059669' }}>
                  {getTranslatedText("✓ Verified on {date}", { date: new Date(kyc.verifiedAt).toLocaleString() })}
                </p>
              </div>
            )}
            {kyc.rejectedAt && (
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-sm font-semibold mb-1" style={{ color: '#dc2626' }}>
                  {getTranslatedText("✗ Rejected on {date}", { date: new Date(kyc.rejectedAt).toLocaleString() })}
                </p>
                {kyc.rejectionReason && (
                  <p className="text-sm" style={{ color: '#991b1b' }}>
                    {getTranslatedText("Reason: {reason}", { reason: kyc.rejectionReason })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white border-t p-4 md:p-6 flex flex-col sm:flex-row gap-3 justify-end" style={{ borderColor: '#e2e8f0' }}>
            {kyc.status === 'pending' && (
              <>
                {!showRejectForm && !showResendForm ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowResendForm(true)}
                      className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all"
                      style={{ backgroundColor: '#fff7ed', color: '#c2410c' }}
                      disabled={isProcessing}
                    >
                      <FaEdit />
                      {getTranslatedText("Request Resend")}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowRejectForm(true)}
                      className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all"
                      style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
                      disabled={isProcessing}
                    >
                      <FaTimesCircle />
                      {getTranslatedText("Reject")}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleApprove}
                      className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all"
                      style={{ backgroundColor: '#64946e', color: '#ffffff' }}
                      disabled={isProcessing}
                    >
                      <FaCheckCircle />
                      {getTranslatedText("Approve")}
                    </motion.button>
                  </>
                ) : showRejectForm ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectionReason('');
                      }}
                      className="px-6 py-3 rounded-xl font-semibold transition-all"
                      style={{ backgroundColor: '#f7fafc', color: '#2d3748' }}
                      disabled={isProcessing}
                    >
                      {getTranslatedText("Cancel")}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleReject}
                      className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                      disabled={isProcessing || !rejectionReason.trim()}
                    >
                      <FaTimesCircle />
                      {getTranslatedText("Confirm Rejection")}
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowResendForm(false);
                        setResendReason('');
                      }}
                      className="px-6 py-3 rounded-xl font-semibold transition-all"
                      style={{ backgroundColor: '#f7fafc', color: '#2d3748' }}
                      disabled={isProcessing}
                    >
                      {getTranslatedText("Cancel")}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleResend}
                      className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#c2410c', color: '#ffffff' }}
                      disabled={isProcessing || !resendReason.trim()}
                    >
                      <FaEdit />
                      {getTranslatedText("Confirm Resend Request")}
                    </motion.button>
                  </>
                )}
              </>
            )}
            {kyc.status !== 'pending' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-semibold transition-all"
                style={{ backgroundColor: '#64946e', color: '#ffffff' }}
              >
                {getTranslatedText("Close")}
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default KYCDetailModal;

