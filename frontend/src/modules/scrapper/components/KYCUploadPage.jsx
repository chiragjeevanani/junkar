import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { kycAPI, scrapperProfileAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const KYCUploadPage = () => {
  const staticTexts = [
    "Checking status...",
    "Please enter a valid 12-digit Aadhaar number",
    "Please upload Aadhaar photo",
    "Please upload selfie photo",
    "Please enter a valid PAN number",
    "Please upload PAN photo",
    "Please upload Shop License photo",
    "Failed to submit KYC. Please try again.",
    "KYC Verification",
    "Complete your KYC to start receiving pickup requests",
    "Step 1 of 1",
    "Aadhaar Number",
    "Enter 12-digit Aadhaar number",
    "Masked: {masked}",
    "Aadhaar Card Photo",
    "Click to upload",
    "Aadhaar photo",
    "PNG, JPG or JPEG (MAX. 50MB)",
    "Remove Photo",
    "Selfie Photo",
    "selfie photo",
    "PAN Number",
    "Enter 10-digit PAN number",
    "PAN Card Photo",
    "PAN photo",
    "Remove PAN",
    "Shop License",
    "Shop License Photo",
    "shop license photo",
    "Remove License",
    "Shop Photo",
    "Shop Photo (required for shopkeeper)",
    "shop photo",
    "Remove Shop Photo",
    "Important Information",
    "Your KYC documents will be verified by our admin team",
    "Verification usually takes 24-48 hours",
    "You can start receiving requests after verification",
    "All documents are securely stored and encrypted",
    "Submitting...",
    "Submit KYC",
    "KYC Submitted Successfully!",
    "Your KYC documents have been submitted for verification.",
    "Verification Time:",
    "Usually takes 24-48 hours. You'll be notified once verification is complete.",
    "File is too large (Max 50MB)",
    "GST Number",
    "Enter 15-digit GST number",
    "GST Certificate Photo",
    "gst certificate photo",
    "Remove GST Certificate"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarPhoto, setAadhaarPhoto] = useState(null);
  const [aadhaarBackPhoto, setAadhaarBackPhoto] = useState(null);
  const [selfiePhoto, setSelfiePhoto] = useState(null);
  const [panNumber, setPanNumber] = useState('');
  const [panPhoto, setPanPhoto] = useState(null);
  const [shopLicenseFile, setShopLicenseFile] = useState(null);
  const [shopPhotoFile, setShopPhotoFile] = useState(null);
  const [gstNumber, setGstNumber] = useState('');
  const [gstCertificate, setGstCertificate] = useState(null);
  const [scrapperType, setScrapperType] = useState(null);
  const [aadhaarPreview, setAadhaarPreview] = useState(null);
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [panPreview, setPanPreview] = useState(null);
  const [shopLicensePreview, setShopLicensePreview] = useState(null);
  const [shopPhotoPreview, setShopPhotoPreview] = useState(null);
  const [gstPreview, setGstPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoadingCheck, setIsLoadingCheck] = useState(true);

  // Check current status on mount and fetch scrapperType for dukandaar Shop Photo field
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const [res, profileRes] = await Promise.all([
          kycAPI.getMy(),
          scrapperProfileAPI.getMyProfile().catch(() => ({ data: { scrapper: {} } }))
        ]);
        const kyc = res.data?.kyc;
        const status = kyc?.status || 'not_submitted';
        const type = profileRes?.data?.scrapper?.scrapperType || 'feri_wala';
        setScrapperType(type);

        if (status === 'pending') {
          if (kyc?.aadhaarPhotoUrl) {
            localStorage.setItem('scrapperKYCStatus', 'pending');
            localStorage.setItem('scrapperKYC', JSON.stringify(kyc));
            navigate('/scrapper/kyc-status', { replace: true });
          }
        } else if (status === 'resend_required') {
          // Allow scrapper to stay on upload page to re-submit docs
          localStorage.setItem('scrapperKYCStatus', 'resend_required');
          localStorage.setItem('scrapperKYC', JSON.stringify(kyc));
        } else if (status === 'verified') {
          localStorage.setItem('scrapperKYCStatus', 'verified');
          localStorage.setItem('scrapperKYC', JSON.stringify(kyc));
          navigate('/scrapper', { replace: true });
        }
      } catch (error) {
        console.error('Failed to check status:', error);
      } finally {
        setIsLoadingCheck(false);
      }
    };
    checkStatus();
  }, [navigate]);

  if (isLoadingCheck) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-4 border-sky-500" />
          <p className="text-sm font-semibold text-white">{getTranslatedText("Checking status...")}</p>
        </div>
      </div>
    );
  }

  // Helper to check for duplicate document uploads
  const isDocumentDuplicate = (newFile, currentFieldName) => {
    const allFiles = [
      { file: aadhaarPhoto, name: 'Aadhaar Front' },
      { file: aadhaarBackPhoto, name: 'Aadhaar Back' },
      { file: selfiePhoto, name: 'Selfie' },
      { file: panPhoto, name: 'PAN' },
      { file: shopLicenseFile, name: 'Shop License' },
      { file: shopPhotoFile, name: 'Shop Photo' },
      { file: gstCertificate, name: 'GST Certificate' }
    ].filter(f => f.file && f.name !== currentFieldName);

    for (const f of allFiles) {
      // Basic check using name, size and type
      if (f.file.name === newFile.name && f.file.size === newFile.size && f.file.type === newFile.type) {
        return f.name;
      }
    }
    return null;
  };

  // Modern Client-Side Image Compression Utility
  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;
          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handleAadhaarPhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const duplicateOrigin = isDocumentDuplicate(file, 'Aadhaar Front');
      if (duplicateOrigin) {
        alert(`This image is already uploaded as ${duplicateOrigin}. Please upload a unique document.`);
        e.target.value = '';
        return;
      }
      const compressed = await compressImage(file);
      setAadhaarPhoto(compressed);
      const reader = new FileReader();
      reader.onloadend = () => setAadhaarPreview(reader.result);
      reader.readAsDataURL(compressed);
    }
  };

  const handleAadhaarBackPhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const duplicateOrigin = isDocumentDuplicate(file, 'Aadhaar Back');
      if (duplicateOrigin) {
        alert(`This image is already uploaded as ${duplicateOrigin}. Please upload a unique document.`);
        e.target.value = '';
        return;
      }
      const compressed = await compressImage(file);
      setAadhaarBackPhoto(compressed);
      const reader = new FileReader();
      reader.onloadend = () => setAadhaarBackPreview(reader.result);
      reader.readAsDataURL(compressed);
    }
  };

  const handleSelfiePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const duplicateOrigin = isDocumentDuplicate(file, 'Selfie');
      if (duplicateOrigin) {
        alert(`${getTranslatedText('This image is already uploaded as')} ${duplicateOrigin}. ${getTranslatedText('Please upload a unique document.')}`);
        e.target.value = '';
        return;
      }
      const compressed = await compressImage(file);
      setSelfiePhoto(compressed);
      const reader = new FileReader();
      reader.onloadend = () => setSelfiePreview(reader.result);
      reader.readAsDataURL(compressed);
    }
  };

  const handlePanPhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const duplicateOrigin = isDocumentDuplicate(file, 'PAN');
      if (duplicateOrigin) {
        alert(`${getTranslatedText('This image is already uploaded as')} ${duplicateOrigin}. ${getTranslatedText('Please upload a unique document.')}`);
        e.target.value = '';
        return;
      }
      const compressed = await compressImage(file);
      setPanPhoto(compressed);
      const reader = new FileReader();
      reader.onloadend = () => setPanPreview(reader.result);
      reader.readAsDataURL(compressed);
    }
  };

  const handleShopLicensePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const duplicateOrigin = isDocumentDuplicate(file, 'Shop License');
      if (duplicateOrigin) {
        alert(`${getTranslatedText('This image is already uploaded as')} ${duplicateOrigin}. ${getTranslatedText('Please upload a unique document.')}`);
        e.target.value = '';
        return;
      }
      const compressed = await compressImage(file);
      setShopLicenseFile(compressed);
      const reader = new FileReader();
      reader.onloadend = () => setShopLicensePreview(reader.result);
      reader.readAsDataURL(compressed);
    }
  };

  const handleShopPhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const duplicateOrigin = isDocumentDuplicate(file, 'Shop Photo');
      if (duplicateOrigin) {
        alert(`${getTranslatedText('This image is already uploaded as')} ${duplicateOrigin}. ${getTranslatedText('Please upload a unique document.')}`);
        e.target.value = '';
        return;
      }
      const compressed = await compressImage(file);
      setShopPhotoFile(compressed);
      const reader = new FileReader();
      reader.onloadend = () => setShopPhotoPreview(reader.result);
      reader.readAsDataURL(compressed);
    }
  };

  const handleGstCertificateChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const duplicateOrigin = isDocumentDuplicate(file, 'GST Certificate');
      if (duplicateOrigin) {
        alert(`${getTranslatedText('This image is already uploaded as')} ${duplicateOrigin}. ${getTranslatedText('Please upload a unique document.')}`);
        e.target.value = '';
        return;
      }
      const compressed = await compressImage(file);
      setGstCertificate(compressed);
      const reader = new FileReader();
      reader.onloadend = () => setGstPreview(reader.result);
      reader.readAsDataURL(compressed);
    }
  };

  const handleAadhaarNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
    setAadhaarNumber(value);
  };

  const handlePanNumberChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setPanNumber(value);
  };

  const handleGstNumberChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    setGstNumber(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Aadhaar Number is mandatory
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      alert(getTranslatedText('Please enter a valid 12-digit Aadhaar number'));
      return;
    }

    if (!aadhaarPhoto) {
      alert(getTranslatedText('Please upload Aadhaar photo'));
      return;
    }

    if (!aadhaarBackPhoto) {
      alert('Please upload Aadhaar back photo (which shows your address)');
      return;
    }

    if (!selfiePhoto) {
      alert(getTranslatedText('Please upload selfie photo'));
      return;
    }

    // PAN is now optional
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (panNumber && !panRegex.test(panNumber)) {
      alert(getTranslatedText('Please enter a valid PAN number in format (e.g., ABCDE1234F)'));
      return;
    }

    // Shop License is now optional
    // Shop Photo (Dukandaar) is now optional
    // GST Details (Wholesaler/Industrial) are now optional

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('aadhaarNumber', aadhaarNumber);
      formData.append('aadhaar', aadhaarPhoto);
      formData.append('aadhaarBack', aadhaarBackPhoto);
      formData.append('selfie', selfiePhoto);
      formData.append('panNumber', panNumber);
      formData.append('pan', panPhoto);
      formData.append('shopLicense', shopLicenseFile);
      if (scrapperType === 'dukandaar' && shopPhotoFile) {
        formData.append('shopPhoto', shopPhotoFile);
      }
      if (['wholesaler', 'industrial'].includes(scrapperType)) {
        formData.append('gstNumber', gstNumber);
        if (gstCertificate) formData.append('gstCertificate', gstCertificate);
      }

      const res = await kycAPI.submit(formData);
      const kyc = res.data?.kyc;

      // Persist minimal KYC state locally for routing guard compatibility
      if (kyc) {
        localStorage.setItem('scrapperKYCStatus', kyc.status || 'pending');
        localStorage.setItem('scrapperKYC', JSON.stringify(kyc));
      } else {
        localStorage.setItem('scrapperKYCStatus', 'pending');
      }

      setIsSubmitting(false);
      setShowSuccess(true);

      setTimeout(() => {
        navigate('/scrapper/kyc-status');
      }, 1200);
    } catch (error) {
      console.error('KYC submit failed:', error);
      alert(error.message || getTranslatedText('Failed to submit KYC. Please try again.'));
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('skipKyc', 'true');
      
      // Send a dummy file or empty string just in case the backend multer complains about empty form data
      // Actually multer handles empty form data if fields aren't strictly required
      const res = await kycAPI.submit(formData);
      const kyc = res.data?.kyc;

      if (kyc) {
        localStorage.setItem('scrapperKYCStatus', kyc.status || 'skipped');
        localStorage.setItem('scrapperKYC', JSON.stringify(kyc));
      } else {
        localStorage.setItem('scrapperKYCStatus', 'skipped');
      }

      setIsSubmitting(false);
      navigate('/scrapper'); // Redirect to dashboard
    } catch (error) {
      console.error('KYC skip failed:', error);
      alert(error.message || getTranslatedText('Failed to skip KYC. Please try again.'));
      setIsSubmitting(false);
    }
  };

  const maskedAadhaar = aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1-****-$3');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen w-full p-4 md:p-6 bg-gradient-to-br from-zinc-900 via-gray-900 to-black"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate('/scrapper/login')}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors mb-4 bg-zinc-900"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">
            {getTranslatedText("KYC Verification")}
          </h1>
          <p className="text-sm md:text-base text-gray-400">
            {getTranslatedText("Complete your KYC to start receiving pickup requests")}
          </p>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-2 rounded-full bg-sky-900/30">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="h-full rounded-full bg-sky-500"
              />
            </div>
            <span className="text-xs md:text-sm text-gray-400">{getTranslatedText("Step 1 of 1")}</span>
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 md:p-8 shadow-xl space-y-6 bg-zinc-900 border border-white/10"
        >
          {/* Aadhaar Number */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-white">
              {getTranslatedText("Aadhaar Number")}
            </label>
            <input
              type="text"
              value={aadhaarNumber}
              onChange={handleAadhaarNumberChange}
              placeholder={getTranslatedText("Enter 12-digit Aadhaar number")}
              maxLength={12}
              className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-sm md:text-base bg-black text-white placeholder-gray-600 ${aadhaarNumber.length === 12 ? 'border-sky-500' : 'border-zinc-700'}`}
            />
            {aadhaarNumber.length === 12 && (
              <p className="text-xs mt-1 text-gray-400">
                {getTranslatedText("Masked: {masked}", { masked: maskedAadhaar })}
              </p>
            )}
          </div>

          {/* Aadhaar Photo Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-white">
              {getTranslatedText("Aadhaar Card Photo")} <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-sky-500 bg-black ${aadhaarPhoto ? 'border-sky-500' : 'border-zinc-700'}`}
              >
                {aadhaarPreview ? (
                  <img src={aadhaarPreview} alt="Aadhaar preview" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-3 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-400">
                      <span className="font-semibold">{getTranslatedText("Click to upload")}</span> {getTranslatedText("Aadhaar photo")}
                    </p>
                    <p className="text-xs text-gray-500">{getTranslatedText("PNG, JPG or JPEG (MAX. 50MB)")}</p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAadhaarPhotoChange}
                  required
                />
              </label>
              {aadhaarPhoto && (
                <button
                  type="button"
                  onClick={() => {
                    setAadhaarPhoto(null);
                    setAadhaarPreview(null);
                  }}
                  className="text-xs font-semibold"
                  style={{ color: '#ef4444' }}
                >
                  {getTranslatedText("Remove Photo")}
                </button>
              )}
            </div>
          </div>

          {/* Aadhaar Back Photo Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-white">
              Aadhaar Card Back Photo <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-sky-500 bg-black ${aadhaarBackPhoto ? 'border-sky-500' : 'border-zinc-700'}`}>
                {aadhaarBackPreview ? (
                  <img src={aadhaarBackPreview} alt="Aadhaar Back preview" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-3 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-400">
                      <span className="font-semibold">Click to upload</span> Aadhaar back photo
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 50MB)</p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAadhaarBackPhotoChange}
                  required
                />
              </label>
              {aadhaarBackPhoto && (
                <button
                  type="button"
                  onClick={() => {
                    setAadhaarBackPhoto(null);
                    setAadhaarBackPreview(null);
                  }}
                  className="text-xs font-semibold"
                  style={{ color: '#ef4444' }}
                >
                  Remove Back Photo
                </button>
              )}
            </div>
          </div>

          {/* Selfie Photo Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-white">
              {getTranslatedText("Selfie Photo")} <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-sky-500 bg-black ${selfiePhoto ? 'border-sky-500' : 'border-zinc-700'}`}
              >
                {selfiePreview ? (
                  <img src={selfiePreview} alt="Selfie preview" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-3 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-400">
                      <span className="font-semibold">{getTranslatedText("Click to upload")}</span> {getTranslatedText("selfie photo")}
                    </p>
                    <p className="text-xs text-gray-500">{getTranslatedText("PNG, JPG or JPEG (MAX. 50MB)")}</p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleSelfiePhotoChange}
                  required
                />
              </label>
              {selfiePhoto && (
                <button
                  type="button"
                  onClick={() => {
                    setSelfiePhoto(null);
                    setSelfiePreview(null);
                  }}
                  className="text-xs font-semibold"
                  style={{ color: '#ef4444' }}
                >
                  {getTranslatedText("Remove Photo")}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-white">
              {getTranslatedText("PAN Number")}
            </label>
            <input
              type="text"
              value={panNumber}
              onChange={handlePanNumberChange}
              placeholder={getTranslatedText("Enter 10-digit PAN number")}
              maxLength={10}
              className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-sm md:text-base bg-black text-white placeholder-gray-600 ${panNumber.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber) ? 'border-sky-500' : panNumber.length > 0 && (panNumber.length < 10 || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) ? 'border-red-500/50' : 'border-zinc-700'}`}
            />
            <p className="text-[10px] mt-1 text-gray-400">
              Format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)
            </p>
          </div>

          {/* PAN Photo Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-white">
              {getTranslatedText("PAN Card Photo")}
            </label>
            <div className="space-y-3">
              <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-sky-500 bg-black ${panPhoto ? 'border-sky-500' : 'border-zinc-700'}`}
              >
                {panPreview ? (
                  <img src={panPreview} alt="PAN preview" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-3 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-400">
                      <span className="font-semibold">{getTranslatedText("Click to upload")}</span> {getTranslatedText("PAN photo")}
                    </p>
                    <p className="text-xs text-gray-500">{getTranslatedText("PNG, JPG or JPEG (MAX. 50MB)")}</p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePanPhotoChange}
                />
              </label>
              {panPhoto && (
                <button
                  type="button"
                  onClick={() => {
                    setPanPhoto(null);
                    setPanPreview(null);
                  }}
                  className="text-xs font-semibold"
                  style={{ color: '#ef4444' }}
                >
                  {getTranslatedText("Remove PAN")}
                </button>
              )}
            </div>
          </div>

          {/* Shop License Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-white">
              {getTranslatedText("Shop License")}
            </label>
            <div className="space-y-3">
              <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-sky-500 bg-black ${shopLicenseFile ? 'border-sky-500' : 'border-zinc-700'}`}
              >
                {shopLicensePreview ? (
                  <img src={shopLicensePreview} alt="Shop License preview" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-3 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-400">
                      <span className="font-semibold">{getTranslatedText("Click to upload")}</span> {getTranslatedText("shop license photo")}
                    </p>
                    <p className="text-xs text-gray-500">{getTranslatedText("PNG, JPG or JPEG (MAX. 50MB)")}</p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleShopLicensePhotoChange}
                />
              </label>
              {shopLicenseFile && (
                <button
                  type="button"
                  onClick={() => {
                    setShopLicenseFile(null);
                    setShopLicensePreview(null);
                  }}
                  className="text-xs font-semibold"
                  style={{ color: '#ef4444' }}
                >
                  {getTranslatedText("Remove License")}
                </button>
              )}
            </div>
          </div>

          {/* Shop Photo (Dukandaar only) - backend expects key "shopPhoto" and saves to kyc.shopPhotoUrl */}
          {scrapperType === 'dukandaar' && (
            <div>
              <label className="block text-sm font-semibold mb-2 text-white">
                {getTranslatedText("Shop Photo")}
              </label>
              <div className="space-y-3">
                <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-sky-500 bg-black ${shopPhotoFile ? 'border-sky-500' : 'border-zinc-700'}`}
                >
                  {shopPhotoPreview ? (
                    <img src={shopPhotoPreview} alt="Shop photo preview" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 mb-3 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                      </svg>
                      <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold">{getTranslatedText("Click to upload")}</span> {getTranslatedText("shop photo")}
                      </p>
                      <p className="text-xs text-gray-500">{getTranslatedText("Shop Photo (required for shopkeeper)")}</p>
                      <p className="text-xs text-gray-500 mt-1">{getTranslatedText("PNG, JPG or JPEG (MAX. 50MB)")}</p>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleShopPhotoChange}
                  />
                </label>
                {shopPhotoFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setShopPhotoFile(null);
                      setShopPhotoPreview(null);
                    }}
                    className="text-xs font-semibold"
                    style={{ color: '#ef4444' }}
                  >
                    {getTranslatedText("Remove Shop Photo")}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* GST Details (Wholesaler/Industrial only) */}
          {['wholesaler', 'industrial'].includes(scrapperType) && (
            <div className="space-y-6 pt-4 border-t border-zinc-800">
              <h3 className="text-lg font-bold text-sky-500">
                {getTranslatedText("Business Details (GST)")}
              </h3>

              {/* GST Number */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-white">
                  {getTranslatedText("GST Number")}
                </label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={handleGstNumberChange}
                  placeholder={getTranslatedText("Enter 15-digit GST number")}
                  maxLength={15}
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-sm md:text-base bg-black text-white placeholder-gray-600 ${gstNumber.length === 15 ? 'border-sky-500' : 'border-zinc-700'}`}
                />
              </div>

              {/* GST Certificate Photo */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-white">
                  {getTranslatedText("GST Certificate Photo")}
                </label>
                <div className="space-y-3">
                  <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-sky-500 bg-black ${gstCertificate ? 'border-sky-500' : 'border-zinc-700'}`}
                  >
                    {gstPreview ? (
                      <img src={gstPreview} alt="GST preview" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-10 h-10 mb-3 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="mb-2 text-sm text-gray-400">
                          <span className="font-semibold">{getTranslatedText("Click to upload")}</span> {getTranslatedText("gst certificate photo")}
                        </p>
                        <p className="text-xs text-gray-500">{getTranslatedText("PNG, JPG or JPEG (MAX. 50MB)")}</p>
                      </div>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleGstCertificateChange}
                    />
                  </label>
                  {gstCertificate && (
                    <button
                      type="button"
                      onClick={() => {
                        setGstCertificate(null);
                        setGstPreview(null);
                      }}
                      className="text-xs font-semibold"
                      style={{ color: '#ef4444' }}
                    >
                      {getTranslatedText("Remove GST Certificate")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 rounded-xl bg-zinc-800/50">
            <div className="flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-sky-400 shrink-0 mt-0.5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor" />
              </svg>
              <div>
                <p className="text-sm font-semibold mb-1 text-white">
                  {getTranslatedText("Important Information")}
                </p>
                <ul className="text-xs space-y-1 text-gray-400">
                  <li>• {getTranslatedText("Your KYC documents will be verified by our admin team")}</li>
                  <li>• {getTranslatedText("Verification usually takes 24-48 hours")}</li>
                  <li>• {getTranslatedText("You can start receiving requests after verification")}</li>
                  <li>• {getTranslatedText("All documents are securely stored and encrypted")}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting || !aadhaarNumber || aadhaarNumber.length !== 12 || !aadhaarPhoto || !aadhaarBackPhoto || !selfiePhoto}
              className="w-full py-4 md:py-5 rounded-xl font-bold text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-sky-600 text-white hover:bg-sky-700"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                  />
                  <span>{getTranslatedText("Submitting...")}</span>
                </div>
              ) : (
                getTranslatedText('Submit KYC')
              )}
            </motion.button>

            <motion.button
              type="button"
              onClick={handleSkip}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              className="w-full py-3 md:py-4 rounded-xl font-bold text-sm md:text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-zinc-700 text-gray-300 hover:bg-zinc-800"
            >
              {getTranslatedText("Skip for Now")}
            </motion.button>
          </div>
        </motion.form>

        {/* Success Toast */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
            >
              <div className="rounded-2xl p-6 shadow-2xl bg-zinc-900 border-2 border-sky-500">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-sky-900/30">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="#0ea5e9" strokeWidth="2" fill="#0ea5e9" fillOpacity="0.1" />
                      <path d="M9 12l2 2 4-4" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1 text-white">
                      {getTranslatedText("KYC Submitted Successfully!")}
                    </h3>
                    <p className="text-sm mb-2 text-gray-400">
                      {getTranslatedText("Your KYC documents have been submitted for verification.")}
                    </p>
                    <div className="p-3 rounded-lg bg-sky-900/20">
                      <p className="text-xs font-semibold mb-1 text-white">
                        ⏱️ {getTranslatedText("Verification Time:")}
                      </p>
                      <p className="text-xs text-sky-400">
                        {getTranslatedText("Usually takes 24-48 hours. You'll be notified once verification is complete.")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default KYCUploadPage;

