import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { orderAPI, paymentAPI } from '../../../modules/shared/utils/api';
import { useAuth } from '../../../modules/shared/context/AuthContext';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import useRazorpay from '../../../hooks/useRazorpay';


const RequestStatusPage = () => {
  const staticTexts = [
    "Request Status",
    "Pending",
    "Waiting for scrapper to accept",
    "Accepted",
    "Scrapper has accepted your request",
    "On the Way",
    "Scrapper is coming to your location",
    "Arrived",
    "Scrapper has arrived at your location",
    "Completed",
    "Pickup completed successfully",
    "Progress",
    "Request ID:",
    "Payment",
    "Complete payment after scrapper confirms your request.",
    "Processing...",
    "Pay Now",
    "Status: Pending",
    "Status: Failed — please retry payment.",
    "Timeline",
    "Request Sent",
    "In progress...",
    "Assigned Scrapper",
    "ETA:",
    "Request Details",
    "Service Type:",
    "Categories:",
    "Weight:",
    "kg",
    "Images:",
    "photos",
    "Service Slot:",
    "Pickup Slot:",
    "Service Fee:",
    "Estimated Payout:",
    "Chat with Scrapper",
    "Back to Home",
    "Payment will be available once the request is confirmed by scrapper.",
    "Failed to initiate payment. Please try again.",
    "Payment verification failed. Please contact support.",
    "Plastic", "Metal", "Paper", "Electronics", "Glass", "Other"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [requestData, setRequestData] = useState(null);
  const [status, setStatus] = useState('pending'); // pending, accepted, on_way, completed
  const [scrapperInfo, setScrapperInfo] = useState(null);
  const [eta, setEta] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [showAcceptanceAlert, setShowAcceptanceAlert] = useState(false);

  // Refs for tracking status changes
  const prevStatusRef = useRef(null);
  const isFirstLoadRef = useRef(true);

  const mapStatus = (backendStatus) => {
    switch (backendStatus) {
      case 'pending':
        return 'pending';
      case 'confirmed':
        return 'accepted';
      case 'on_way':
        return 'on_way';
      case 'arrived':
      case 'in_progress':
        return 'arrived';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  };

  // Monitor status changes for Alert
  useEffect(() => {
    if (status) {
      // First load: just set the ref and skip
      if (isFirstLoadRef.current) {
        prevStatusRef.current = status;
        isFirstLoadRef.current = false;
        return;
      }

      // Subsequent updates: check for transition
      const prev = prevStatusRef.current;
      // If we moved from pending to accepted or on_way
      if (prev === 'pending' && ['accepted', 'on_way'].includes(status)) {
        setShowAcceptanceAlert(true);
      }

      prevStatusRef.current = status;
    }
  }, [status]);

  const { initializePayment } = useRazorpay();


  useEffect(() => {
    const initial = location.state?.requestData;
    if (!initial) {
      navigate('/user/my-requests');
      return;
    }

    setRequestData(initial);
    if (initial.status) {
      setStatus(mapStatus(initial.status));
    }
    if (initial.scrapper) {
      setScrapperInfo({
        name: initial.scrapper.name,
        phone: initial.scrapper.phone
      });
    }

    if (!initial._id) {
      return;
    }

    let isMounted = true;
    const fetchOrder = async () => {
      try {
        const res = await orderAPI.getById(initial._id);
        const order = res.data?.order;
        if (!order || !isMounted) return;
        setRequestData(order);
        setStatus(mapStatus(order.status));
        if (order.scrapper) {
          setScrapperInfo({
            name: order.scrapper.name,
            phone: order.scrapper.phone
          });
        }
      } catch (err) {
        console.error('Failed to fetch order status', err);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [location.state, navigate]);

  const handlePay = async () => {
    if (!requestData?._id || isPaying) return;
    // Only allow when backend status is confirmed/in_progress
    const backendStatus = requestData.status;
    if (!['confirmed', 'in_progress'].includes(backendStatus)) {
      alert(getTranslatedText('Payment will be available once the request is confirmed by scrapper.'));
      return;
    }

    try {
      setIsPaying(true);

      const createRes = await paymentAPI.createPaymentOrder(requestData._id);
      const { orderId: razorpayOrderId, amount, currency, keyId } = createRes.data || {};

      const options = {
        key: keyId,
        amount,
        currency: currency || 'INR',
        name: 'Junkar',
        description: 'Pickup payment',
        order_id: razorpayOrderId,
        prefill: {
          name: user?.name || 'User',
          email: user?.email || 'user@example.com',
          contact: user?.phone || ''
        },
        theme: {
          color: '#38bdf8'
        }
      };

      await initializePayment(options, async (response) => {
        try {
          await paymentAPI.verifyPayment({
            orderId: requestData._id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          // Refresh order status
          const refreshed = await orderAPI.getById(requestData._id);
          const order = refreshed.data?.order;
          if (order) {
            setRequestData(order);
            setStatus(mapStatus(order.status));
            if (order.scrapper) {
              setScrapperInfo({
                name: order.scrapper.name,
                phone: order.scrapper.phone
              });
            }
          }
        } catch (err) {
          console.error('Payment verify failed', err);
          alert(getTranslatedText(err.message || 'Payment verification failed. Please contact support.'));
        } finally {
          setIsPaying(false);
        }
      }, (err) => {
        console.error('Razorpay Error:', err);
        setIsPaying(false);
      });

    } catch (error) {
      console.error('Payment error:', error);
      alert(getTranslatedText(error.message || 'Failed to initiate payment. Please try again.'));
      setIsPaying(false);
    }
  };

  // Modern SVG Icons Component
  const StatusIcon = ({ status, color }) => {
    const iconSize = 32;
    const icons = {
      pending: (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" opacity="0.2" />
          <path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      accepted: (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
          <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      on_way: (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 17h14l-1-7H6l-1 7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={color} fillOpacity="0.1" />
          <circle cx="7" cy="19" r="1.5" fill={color} />
          <circle cx="17" cy="19" r="1.5" fill={color} />
          <path d="M3 12h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      arrived: (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
          <circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.2" />
        </svg>
      ),
      completed: (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
          <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 2v4M12 18v4M22 12h-4M6 12H2" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        </svg>
      ),
      cancelled: (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
          <path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    };
    return icons[status] || icons.pending;
  };

  const statusConfig = {
    pending: {
      label: 'Pending',
      color: '#f59e0b',
      description: 'Waiting for scrapper to accept',
      progress: 20
    },
    accepted: {
      label: requestData?.isDonation ? 'Donation Accepted' : 'Accepted',
      color: '#38bdf8',
      description: requestData?.isDonation ? 'A scrapper will pick up your donation for free' : 'Scrapper has accepted your request',
      progress: 40
    },
    on_way: {
      label: requestData?.isDonation ? 'Scrapper Coming for Donation' : 'On the Way',
      color: '#3b82f6',
      description: requestData?.isDonation ? 'Scrapper is on the way to pick up your donation' : 'Scrapper is coming to your location',
      progress: 60
    },
    arrived: {
      label: 'Arrived',
      color: '#8b5cf6',
      description: 'Scrapper has arrived at your location',
      progress: 80
    },
    completed: {
      label: 'Completed',
      color: '#0ea5e9',
      description: 'Pickup completed successfully',
      progress: 100
    },
    cancelled: {
      label: 'Cancelled',
      color: '#ef4444',
      description: requestData?.cancellationReason || 'The request was cancelled',
      progress: 0
    }
  };

  const currentStatus = statusConfig[status];

  const timelineSteps = status === 'cancelled'
    ? [
        { id: 'pending', label: 'Request Sent', completed: true },
        { id: 'cancelled', label: 'Cancelled', completed: true }
      ]
    : [
        { id: 'pending', label: 'Request Sent', completed: true },
        { id: 'accepted', label: 'Accepted', completed: status !== 'pending' },
        { id: 'on_way', label: 'On the Way', completed: ['on_way', 'arrived', 'completed'].includes(status) },
        { id: 'arrived', label: 'Arrived', completed: ['arrived', 'completed'].includes(status) },
        { id: 'completed', label: 'Completed', completed: status === 'completed' }
      ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: '#f4ebe2' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 md:p-6 border-b" style={{ borderColor: 'rgba(100, 148, 110, 0.2)' }}>
        <button
          onClick={() => navigate('/user')}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white transition-colors"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: '#2d3748' }}>
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <h2
          className="text-lg md:text-2xl font-bold"
          style={{ color: '#2d3748' }}
        >
          {getTranslatedText("Request Status")}
        </h2>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl p-4 md:p-6 mb-4 md:mb-6 shadow-lg relative overflow-hidden"
          style={{ backgroundColor: '#ffffff' }}
        >
          {/* Background Pattern */}
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -mr-16 -mt-16"
            style={{ backgroundColor: currentStatus.color }}
          />

          <div className="relative z-10">
            {/* Status Icon & Label */}
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${currentStatus.color}20` }}
              >
                <StatusIcon status={status} color={currentStatus.color} />
              </motion.div>
              <div className="flex-1">
                <h3
                  className="text-xl md:text-2xl font-bold mb-1"
                  style={{ color: currentStatus.color }}
                >
                  {getTranslatedText(currentStatus.label)}
                </h3>
                <p className="text-xs md:text-sm" style={{ color: '#718096' }}>
                  {getTranslatedText(currentStatus.description)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs md:text-sm font-medium" style={{ color: '#718096' }}>
                  {getTranslatedText("Progress")}
                </span>
                <span className="text-xs md:text-sm font-bold" style={{ color: currentStatus.color }}>
                  {currentStatus.progress}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(100, 148, 110, 0.1)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${currentStatus.progress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: currentStatus.color }}
                />
              </div>
            </div>

            {/* Request ID */}
            <div className="pt-4 border-t" style={{ borderColor: 'rgba(100, 148, 110, 0.2)' }}>
              <p className="text-xs md:text-sm" style={{ color: '#718096' }}>
                {getTranslatedText("Request ID:")} <span className="font-semibold" style={{ color: '#2d3748' }}>#{Date.now().toString().slice(-8)}</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Payment CTA */}
        {requestData?.status && !['completed', 'cancelled'].includes(requestData.status) && requestData?.paymentStatus !== 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl p-4 md:p-5 mb-4 md:mb-6 shadow-lg border"
            style={{ backgroundColor: '#ffffff', borderColor: 'rgba(100,148,110,0.2)' }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#2d3748' }}>{getTranslatedText("Payment")}</p>
                <p className="text-xs" style={{ color: '#718096' }}>
                  {getTranslatedText("Complete payment after scrapper confirms your request.")}
                </p>
              </div>
              <button
                type="button"
                onClick={handlePay}
                disabled={isPaying || !['confirmed', 'in_progress'].includes(requestData.status)}
                className="px-4 py-2 rounded-full text-sm font-semibold shadow-md transition-all duration-300 disabled:opacity-50"
                style={{ backgroundColor: '#38bdf8', color: '#ffffff', display: requestData?.orderType === 'cleaning_service' ? 'block' : 'none' }}
              >
                {isPaying ? getTranslatedText('Processing...') : getTranslatedText('Pay Now')}
              </button>
            </div>
            {requestData.paymentStatus === 'pending' && (
              <p className="mt-2 text-xs" style={{ color: '#f59e0b' }}>
                {getTranslatedText("Status: Pending")}
              </p>
            )}
            {requestData.paymentStatus === 'failed' && (
              <p className="mt-2 text-xs" style={{ color: '#dc2626' }}>
                {getTranslatedText("Status: Failed — please retry payment.")}
              </p>
            )}
          </motion.div>
        )}

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl p-4 md:p-6 mb-4 md:mb-6 shadow-lg"
          style={{ backgroundColor: '#ffffff' }}
        >
          <h3 className="text-base md:text-lg font-bold mb-4" style={{ color: '#2d3748' }}>
            {getTranslatedText("Timeline")}
          </h3>
          <div className="space-y-4">
            {timelineSteps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-3">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${step.completed ? 'shadow-md' : ''
                      }`}
                    style={{
                      backgroundColor: step.completed ? '#38bdf8' : 'rgba(100, 148, 110, 0.2)',
                      border: step.completed ? '2px solid #ffffff' : '2px solid transparent'
                    }}
                  />
                  {index < timelineSteps.length - 1 && (
                    <div
                      className={`w-0.5 flex-1 mt-1 ${step.completed ? '' : 'opacity-30'
                        }`}
                      style={{
                        backgroundColor: step.completed ? '#38bdf8' : 'rgba(100, 148, 110, 0.2)',
                        minHeight: '40px'
                      }}
                    />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 pb-4">
                  <p
                    className={`text-sm md:text-base font-semibold mb-1 ${step.completed ? '' : 'opacity-50'
                      }`}
                    style={{ color: step.completed ? '#2d3748' : '#718096' }}
                  >
                    {getTranslatedText(step.label)}
                  </p>
                  {step.id === status && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs md:text-sm"
                      style={{ color: '#38bdf8' }}
                    >
                      {getTranslatedText("In progress...")}
                    </motion.p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Scrapper Info (if assigned) */}
        {scrapperInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-2xl p-4 md:p-6 mb-4 md:mb-6 shadow-lg"
            style={{ backgroundColor: '#ffffff' }}
          >
            <h3 className="text-base md:text-lg font-bold mb-4" style={{ color: '#2d3748' }}>
              {getTranslatedText("Assigned Scrapper")}
            </h3>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-xl md:text-2xl font-bold"
                style={{ backgroundColor: 'rgba(100, 148, 110, 0.1)', color: '#38bdf8' }}
              >
                {scrapperInfo.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-base md:text-lg font-semibold" style={{ color: '#2d3748' }}>
                    {scrapperInfo.name}
                  </h4>
                  <div className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#fbbf24" stroke="#fbbf24" strokeWidth="1" />
                    </svg>
                    <span className="text-xs md:text-sm font-semibold" style={{ color: '#38bdf8' }}>
                      {scrapperInfo.rating}
                    </span>
                  </div>
                </div>
                <p className="text-xs md:text-sm mb-2" style={{ color: '#718096' }}>
                  {scrapperInfo.vehicle}
                </p>
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#718096" strokeWidth="2" fill="none" />
                    <circle cx="12" cy="10" r="3" stroke="#718096" strokeWidth="2" fill="none" />
                  </svg>
                  <p className="text-xs md:text-sm" style={{ color: '#718096' }}>
                    {scrapperInfo.distance}
                  </p>
                </div>
                {eta && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-1.5 mt-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="#38bdf8" strokeWidth="2" fill="none" />
                      <path d="M12 6v6l4 2" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-xs md:text-sm font-semibold" style={{ color: '#38bdf8' }}>
                      {getTranslatedText("ETA:")} {eta}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Request Summary */}
        {requestData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="rounded-2xl p-4 md:p-6 mb-4 md:mb-6 shadow-lg"
            style={{ backgroundColor: '#ffffff' }}
          >
            <h3 className="text-base md:text-lg font-bold mb-4" style={{ color: '#2d3748' }}>
              {getTranslatedText("Request Details")}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs md:text-sm" style={{ color: '#718096' }}>
                  {requestData.orderType === 'cleaning_service' ? getTranslatedText('Service Type:') : getTranslatedText('Categories:')}
                </span>
                <span className="text-xs md:text-sm font-semibold" style={{ color: '#2d3748' }}>
                  {requestData.orderType === 'cleaning_service'
                    ? getTranslatedText(requestData.serviceDetails?.serviceType)
                    : (requestData.categories
                      ? requestData.categories.map(c => getTranslatedText(c.name)).join(', ')
                      : (requestData.scrapItems
                        ? requestData.scrapItems.map(item => getTranslatedText(item.name || item.category.charAt(0).toUpperCase() + item.category.slice(1))).join(', ')
                        : '')
                    )
                  }
                </span>
              </div>
              {requestData.orderType !== 'cleaning_service' && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm" style={{ color: '#718096' }}>{getTranslatedText("Weight Details:")}</span>
                    <span className="text-xs md:text-sm font-semibold" style={{ color: '#2d3748' }}>
                      {requestData.weight || requestData.totalWeight || 0} {getTranslatedText("kg")}
                    </span>
                  </div>
                  {requestData.scrapItems?.length > 1 && (
                    <div className="pl-4 space-y-1">
                      {requestData.scrapItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] md:text-xs italic">
                          <span style={{ color: '#94a3b8' }}>{getTranslatedText(item.name)}:</span>
                          <span style={{ color: '#64748b' }}>
                            {item.pricingType === 'negotiable'
                              ? getTranslatedText("Negotiable")
                              : `${item.weight} ${getTranslatedText("kg")}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xs md:text-sm" style={{ color: '#718096' }}>{getTranslatedText("Images:")}</span>
                <span className="text-xs md:text-sm font-semibold" style={{ color: '#2d3748' }}>
                  {requestData.images?.length || 0} {getTranslatedText("photos")}
                </span>
              </div>
              {(requestData.pickupSlot || requestData.preferredTime) && (
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm" style={{ color: '#718096' }}>
                    {requestData.orderType === 'cleaning_service' ? getTranslatedText('Service Slot:') : getTranslatedText('Pickup Slot:')}
                  </span>
                  <span className="text-xs md:text-sm font-semibold text-right" style={{ color: '#2d3748' }}>
                    {requestData.pickupSlot
                      ? `${getTranslatedText(requestData.pickupSlot.dayName)}, ${requestData.pickupSlot.date} • ${getTranslatedText(requestData.pickupSlot.slot)}`
                      : getTranslatedText(requestData.preferredTime)}
                  </span>
                </div>
              )}
              <div className="pt-3 border-t" style={{ borderColor: 'rgba(100, 148, 110, 0.2)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-base md:text-lg font-bold" style={{ color: '#2d3748' }}>
                    {requestData.orderType === 'cleaning_service' ? getTranslatedText('Service Fee:') : getTranslatedText('Estimated Payout:')}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="text-xl md:text-2xl font-bold" style={{ color: '#38bdf8' }}>
                      {requestData.orderType === 'cleaning_service'
                        ? `₹${requestData.serviceFee || 0}`
                        : (requestData.scrapItems?.some(i => i.pricingType === 'negotiable')
                          ? (requestData.scrapItems?.every(i => i.pricingType === 'negotiable')
                            ? (requestData.scrapItems?.[0]?.expectedPrice ? `₹${requestData.scrapItems[0].expectedPrice}` : getTranslatedText('Negotiable'))
                            : `₹${requestData.totalAmount?.toFixed(0) || 0} + ${getTranslatedText('Negotiable')}`)
                          : `₹${requestData.totalAmount?.toFixed(0) || 0}`)
                      }
                    </span>
                    {(requestData.isNegotiated || requestData.scrapItems?.some(i => i.pricingType === 'negotiable')) && (
                      <span className="text-[10px] md:text-xs font-medium" style={{ color: '#718096' }}>
                        {requestData.scrapItems?.[0]?.expectedPrice ? `(${getTranslatedText('Expected')})` : getTranslatedText('Vendor will quote')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {scrapperInfo && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onClick={() => navigate('/chat', { state: { scrapperInfo } })}
              className="w-full py-3 md:py-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm md:text-base shadow-md hover:shadow-lg transition-all duration-300"
              style={{ backgroundColor: '#38bdf8', color: '#ffffff' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5a8263'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#38bdf8'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#ffffff' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {getTranslatedText("Chat with Scrapper")}
            </motion.button>
          )}

          {/* Track Order Button */}
          {['accepted', 'on_way', 'arrived'].includes(status) && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              onClick={() => navigate(`/user/track-order/${requestData._id}`)}
              className="w-full py-3 md:py-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm md:text-base shadow-md hover:shadow-lg transition-all duration-300"
              style={{ backgroundColor: '#ffffff', color: '#ea580c', border: '2px solid #ea580c' }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#ea580c';
                e.target.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#ffffff';
                e.target.style.color = '#ea580c';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              {getTranslatedText("View Scrapper Location")}
            </motion.button>
          )}

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={() => navigate('/user')}
            className="w-full py-3 md:py-4 rounded-xl border-2 font-semibold text-sm md:text-base transition-all duration-300"
            style={{ borderColor: '#38bdf8', color: '#38bdf8', backgroundColor: 'transparent' }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(100, 148, 110, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            {getTranslatedText("Back to Home")}
          </motion.button>
        </div>
      </div>
      {/* Acceptance Alert Modal */}
      {showAcceptanceAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center relative overflow-hidden"
          >
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: '#38bdf8' }} />

            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm" style={{ backgroundColor: 'rgba(100, 148, 110, 0.1)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            <h3 className="text-xl font-bold mb-2" style={{ color: '#2d3748' }}>
              {getTranslatedText("Request Accepted!")}
            </h3>
            <p className="text-sm mb-6 px-2" style={{ color: '#718096' }}>
              {getTranslatedText("Your scrapper is on the way. tap below to track their live location.")}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowAcceptanceAlert(false); // Close first to avoid stacking issues logic
                  navigate(`/user/track-order/${requestData._id}`);
                }}
                className="w-full py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                style={{ backgroundColor: '#38bdf8' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {getTranslatedText("View Scrapper Location")}
              </button>

              <button
                onClick={() => setShowAcceptanceAlert(false)}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-colors"
                style={{ color: '#718096', backgroundColor: '#f7fafc' }}
              >
                {getTranslatedText("Dismiss")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>

  );
};

export default RequestStatusPage;


