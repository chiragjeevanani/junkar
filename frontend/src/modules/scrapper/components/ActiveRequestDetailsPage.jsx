import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import {
  getScrapperRequestById,
} from '../../shared/utils/scrapperRequestUtils';
import { orderAPI, scrapperOrdersAPI } from '../../shared/utils/api';
import { walletService } from '../../shared/services/wallet.service';
import ScrapperMap from './GoogleMaps/ScrapperMap';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import socketClient from '../../shared/utils/socketClient';
import useRazorpay from '../../../hooks/useRazorpay';

// Razorpay utility now handled via hook


const ActiveRequestDetailsPage = () => {
  const staticTexts = [
    "Loading request details...",
    "Active Request",
    "Pickup Details",
    "Scrap Images",
    "Area Images",
    "Pickup Slot:",
    "Collect Payment",
    "Make Payment",
    "Estimated Amount",
    "Enter Amount Received",
    "Enter Amount Paid",
    "Amount (₹)",
    "Confirm Payment",
    "Payment Status",
    "Collected ✓",
    "Paid ✓",
    "Complete Order",
    "Order Completed!",
    "Redirecting to dashboard...",
    "Start Service",
    "Pickup Scrap",
    "Call Customer",
    "Message",
    "Chat",
    "Confirm Action",
    "Cancel",
    "Confirm",
    "Please enter a valid amount",
    "Order ID not found",
    "Failed to update order status",
    "Failed to update payment status",
    "Failed to complete order",
    "Failed to process. Please try again.",
    "Have you arrived and started the cleaning service?",
    "Have you picked up the scrap from the customer?",
    "Have you received ₹{amount} from the customer?",
    "Have you paid ₹{amount} to the customer?",
    "Are you sure you want to complete this order?",
    "You collected ₹{amount} from the customer",
    "You will pay ₹{amount} to the customer",
    "Payment of ₹{amount} collected successfully",
    "Payment of ₹{amount} made successfully to customer",
    "User",
    "Scrap",
    "Cleaning Service",
    "Address not available",
    "of",
    "Yes, Confirm",
    "Processing...",
    "Pay ₹{amount} to User?",
    "Report Fake Lead",
    "Reason",
    "Wrong item",
    "Wrong address",
    "Not available",
    "Customer not available",
    "Other",
    "Notes (optional)",
    "Submit Report",
    "Fake lead reported. Admin will review.",
    "This order was already reported.",
    "Failed to submit report.",
    "Complete Donation",
    "This is a donation request. No payment is required.",
    "Confirm Pickup & Thank User",
    "Confirm Partner Arrival",
    "Partner is on the way. Tracking active.",
    "Qty:",
    "Nos",
    "Units",
    "Navigate"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const location = useLocation();
  const { requestId } = useParams();
  const { user } = useAuth();
  const { initializePayment } = useRazorpay();

  const [isMinimized, setIsMinimized] = useState(false);
  const [requestData, setRequestData] = useState(null);
  const [scrapperLocation, setScrapperLocation] = useState(null);
  const [userLiveLocation, setUserLiveLocation] = useState(null);
  const [isPickedUp, setIsPickedUp] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, paid, completed
  const [finalAmount, setFinalAmount] = useState(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [showPaymentInput, setShowPaymentInput] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'pickup', 'payment', 'complete'
  const [confirmMessage, setConfirmMessage] = useState('');
  const [allActiveRequests, setAllActiveRequests] = useState([]);
  const [currentRequestIndex, setCurrentRequestIndex] = useState(-1);

  // Wallet State
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [partnerLocation, setPartnerLocation] = useState(null);
  const [isB2B, setIsB2B] = useState(false);
  const [stage, setStage] = useState('request');
  const [isNegotiated, setIsNegotiated] = useState(false);
  const [dealType, setDealType] = useState('Cash');
  const [showFakeLeadModal, setShowFakeLeadModal] = useState(false);
  const [fakeLeadReason, setFakeLeadReason] = useState('wrong_item');
  const [fakeLeadNotes, setFakeLeadNotes] = useState('');
  const [fakeLeadSubmitting, setFakeLeadSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('scrapperUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  // Check authentication first
  useEffect(() => {
    const scrapperAuth = localStorage.getItem('scrapperAuthenticated');
    const scrapperUser = localStorage.getItem('scrapperUser');
    if (scrapperAuth !== 'true' || !scrapperUser) {
      navigate('/scrapper/login', { replace: true });
      return;
    }
  }, [navigate]);

  // Fetch Wallet Balance
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const data = await walletService.getWalletProfile();
        if (data.success && data.data) {
          setWalletBalance(data.data.balance || 0);
        }
      } catch (error) {
        console.error('Failed to fetch wallet:', error);
      }
    };
    fetchWallet();
  }, []);

  // Load order data from backend
  const loadOrderData = useCallback(async () => {
    if (!requestId) {
      // Try navigation state first
      if (location.state?.request) {
        const request = location.state.request;
        setRequestData(request);
        setUserLiveLocation({
          lat: Number(request.location?.lat) || 19.0760,
          lng: Number(request.location?.lng) || 72.8777
        });
        return;
      }
      navigate('/scrapper/my-active-requests', { replace: true });
      return;
    }

    try {
      // Load order from backend
      const response = await orderAPI.getById(requestId);

      if (response.success && response.data?.order) {
        const order = response.data.order;
        setIsB2B(order.userModel === 'Scrapper');
        setIsCompleted(order.status === 'completed');

        // Map backend order to frontend format
        const mappedRequest = {
          id: order._id || order.id,
          _id: order._id || order.id,
          requestId: `REQ - ${(order._id || order.id).toString().slice(-6).toUpperCase()}`,
          orderType: order.orderType || 'scrap_sell',
          serviceDetails: order.serviceDetails,
          userName: order.user?.name || 'User',
          userPhone: order.user?.phone || '',
          userEmail: order.user?.email || '',
          scrapType: order.orderType === 'cleaning_service'
            ? (getTranslatedText(order.serviceDetails?.serviceType || 'Cleaning Service'))
            : (order.scrapItems?.map(item => getTranslatedText(item.category)).join(', ') || getTranslatedText('Scrap')),
          weight: order.totalWeight,
          pickupSlot: order.pickupSlot || null,
          preferredTime: order.preferredTime || null,
          images: order.images?.map(img => ({
            id: img.publicId || img.url,
            preview: img.url,
            url: img.url
          })) || [],
          location: {
            address: [
              order.pickupAddress?.street,
              order.pickupAddress?.city,
              order.pickupAddress?.state,
              order.pickupAddress?.pincode
            ].filter(Boolean).join(', ') || 'Address not available',
            lat: order.pickupAddress?.coordinates?.lat || 19.0760,
            lng: order.pickupAddress?.coordinates?.lng || 72.8777
          },
          estimatedEarnings: order.orderType === 'cleaning_service'
            ? `₹${order.serviceFee || 0}`
            : `₹${order.totalAmount || 0}`,
          status: order.status,
          paymentStatus: order.paymentStatus,
          // Backend fields
          assignmentStatus: order.assignmentStatus,
          acceptedAt: order.acceptedAt,
          notes: order.notes || '',
          // Model B fields
          isNegotiated: order.isNegotiated || order.scrapItems?.some(item => item.pricingType === 'negotiable'),
          scrapItems: order.scrapItems || [],
          isDonation: order.isDonation || order.scrapItems?.some(item => item.pricingType === 'donate'),
          hasNegotiableItems: order.isNegotiated || order.scrapItems?.some(item => item.pricingType === 'negotiable')
        };

        setRequestData(mappedRequest);
        setUserLiveLocation({
          lat: Number(mappedRequest.location.lat),
          lng: Number(mappedRequest.location.lng)
        });

        // Check if already picked up (status is in_progress or completed)
        if (order.status === 'in_progress' || order.status === 'completed') {
          setIsPickedUp(true);
          setPaymentStatus(order.paymentStatus || 'pending');
          const amount = order.orderType === 'cleaning_service' ? (order.serviceFee || 0) : (order.totalAmount || 0);
          setFinalAmount(`₹${amount}`);
        }

        // Load all active requests for navigation
        const allActiveResponse = await scrapperOrdersAPI.getMyAssigned('status=IN_PROGRESS');
        if (allActiveResponse.success && allActiveResponse.data?.orders) {
          const allRequests = allActiveResponse.data.orders
            .map(o => ({
              id: o._id || o.id,
              status: o.status
            }))
            .filter(req => req.status !== 'completed');
          setAllActiveRequests(allRequests);
          const index = allRequests.findIndex(req => req.id === mappedRequest.id);
          setCurrentRequestIndex(index >= 0 ? index : 0);
        }
      } else {
        throw new Error(getTranslatedText('Order not found'));
      }
    } catch (error) {
      console.error('Failed to load order:', error);
      // Fallback to localStorage if backend fails
      const localRequest = getScrapperRequestById(requestId);
      if (localRequest) {
        setRequestData(localRequest);
        setUserLiveLocation({
          lat: Number(localRequest.location?.lat) || 19.0760,
          lng: Number(localRequest.location?.lng) || 72.8777
        });
      } else {
        navigate('/scrapper/my-active-requests', { replace: true });
      }
    }
  }, [requestId, location, navigate, getTranslatedText]);

  useEffect(() => {
    loadOrderData();
  }, [loadOrderData]);

  // Socket setup for tracking and status updates
  useEffect(() => {
    if (requestData?.id || requestData?._id) {
      const orderId = requestData._id || requestData.id;
      socketClient.joinTracking(orderId);

      // Listen for partner's location if it's a B2B order
      const handleLocationUpdate = (data) => {
        if (data.orderId === orderId) {
          setPartnerLocation(data.location || data.coords);
          if (stage !== 'pickup' && !isPickedUp) {
            setStage('pickup');
          }
        }
      };

      const handleStatusUpdate = (data) => {
        if (data.orderId === orderId) {
          loadOrderData();
        }
      };

      socketClient.on('scrapper_location_update', handleLocationUpdate);
      socketClient.on('order_status_update', handleStatusUpdate);

      return () => {
        socketClient.leaveTracking(orderId);
        socketClient.off('order_status_update', handleStatusUpdate);
        socketClient.off('scrapper_location_update', handleLocationUpdate);
      };
    }
  }, [requestData?._id, requestData?.id, stage, isPickedUp, loadOrderData]);

  // Refresh request data from backend periodically
  useEffect(() => {
    if (!requestData?._id && !requestData?.id) return;

    const refreshRequest = async () => {
      const orderId = requestData._id || requestData.id;
      try {
        const response = await orderAPI.getById(orderId);
        if (response.success && response.data?.order) {
          const order = response.data.order;

          // Map backend order to frontend format
          const mappedRequest = {
            id: order._id || order.id,
            _id: order._id || order.id,
            requestId: `REQ - ${(order._id || order.id).toString().slice(-6).toUpperCase()}`,
            orderType: order.orderType || 'scrap_sell',
            serviceDetails: order.serviceDetails,
            userName: order.user?.name || 'User',
            userPhone: order.user?.phone || '',
            userEmail: order.user?.email || '',
            scrapType: order.orderType === 'cleaning_service'
              ? (getTranslatedText(order.serviceDetails?.serviceType || 'Cleaning Service'))
              : (order.scrapItems?.map(item => getTranslatedText(item.category)).join(', ') || getTranslatedText('Scrap')),
            weight: order.totalWeight,
            pickupSlot: order.pickupSlot || null,
            preferredTime: order.preferredTime || null,
            images: order.images?.map(img => ({
              id: img.publicId || img.url,
              preview: img.url,
              url: img.url
            })) || [],
            location: {
              address: [
                order.pickupAddress?.street,
                order.pickupAddress?.city,
                order.pickupAddress?.state,
                order.pickupAddress?.pincode
              ].filter(Boolean).join(', ') || 'Address not available',
              lat: order.pickupAddress?.coordinates?.lat || 19.0760,
              lng: order.pickupAddress?.coordinates?.lng || 72.8777
            },
            estimatedEarnings: order.orderType === 'cleaning_service'
              ? `₹${order.serviceFee || 0}`
              : `₹${order.totalAmount || 0}`,
            status: order.status,
            paymentStatus: order.paymentStatus,
            notes: order.notes || '',
            // Model B fields
            isNegotiated: order.isNegotiated || order.scrapItems?.some(item => item.pricingType === 'negotiable'),
            scrapItems: order.scrapItems || [],
            isDonation: order.isDonation || order.scrapItems?.some(item => item.pricingType === 'donate'),
            hasNegotiableItems: order.isNegotiated || order.scrapItems?.some(item => item.pricingType === 'negotiable')
          };

          setRequestData(mappedRequest);

          // Update state based on new order status
          if (order.status === 'in_progress' || order.status === 'completed') {
            setIsPickedUp(true);
            setPaymentStatus(order.paymentStatus || 'pending');
            const amount = order.orderType === 'cleaning_service' ? (order.serviceFee || 0) : (order.totalAmount || 0);
            setFinalAmount(`₹${amount}`);
          }
        }
      } catch (error) {
        console.error('Failed to refresh order:', error);
      }
    };

    // Refresh on focus/visibility
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshRequest();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', refreshRequest);

    // Also refresh every 10 seconds (reduced from 5s to alleviate server load)
    const interval = setInterval(refreshRequest, 10000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', refreshRequest);
      clearInterval(interval);
    };
  }, [requestData?._id, requestData?.id, requestId]); // Ensure stable dependencies

  // Auto-redirect if order is completed
  useEffect(() => {
    if (requestData?.status === 'completed') {
      const timer = setTimeout(() => {
        navigate('/scrapper', { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Sync map stage with order status
    if (requestData?.status === 'on_way' || requestData?.status === 'in_progress') {
      setStage('pickup');
    } else if (requestData?.status === 'arrived') {
      setStage('arrived');
    } else if (requestData?.status === 'confirmed' || requestData?.status === 'pending') {
      setStage('request');
    }
  }, [requestData?.status, navigate]);

  // Get scrapper's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setScrapperLocation({
            lat: Number(position.coords.latitude),
            lng: Number(position.coords.longitude)
          });
        },
        (error) => {
          // Silence verbose console logging for expected GPS unavailability
          // Default location (Mumbai)
          setScrapperLocation({
            lat: 19.0760,
            lng: 72.8777
          });
        }
      );

      // Watch position for live updates
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setScrapperLocation({
            lat: Number(position.coords.latitude),
            lng: Number(position.coords.longitude)
          });
        },
        (error) => {
          // Silent failure for watchPosition to prevent log spamming
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      // Default location if geolocation not supported
      setScrapperLocation({
        lat: 19.0760,
        lng: 72.8777
      });
    }
  }, []);

  const renderPickupSlot = () => {
    const slot = requestData.pickupSlot;
    if (!slot && !requestData.preferredTime) return null;

    const label = slot
      ? `${slot.dayName}, ${slot.date} • ${slot.slot}`
      : requestData.preferredTime;

    return (
      <div className="mb-4">
        <p className="text-xs md:text-sm mb-1" style={{ color: '#718096' }}>
          {getTranslatedText("Pickup Slot:")}
        </p>
        <p className="text-sm md:text-base font-semibold" style={{ color: '#2d3748' }}>
          {label}
        </p>
      </div>
    );
  };

  if (!requestData) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">{getTranslatedText("Loading request details...")}</p>
      </div>
    );
  }

  const handleCall = () => {
    window.location.href = `tel:${requestData.userPhone || '+919876543210'}`;
  };

  const handleMessage = () => {
    window.location.href = `sms:${requestData.userPhone || '+919876543210'}`;
  };

  const handleChat = () => {
    if (requestData?.id || requestData?._id) {
      const oid = requestData.id || requestData._id;
      navigate(`/scrapper/chat?orderId=${oid}`, {
        state: { orderId: oid }
      });
    }
  };

  const handleOpenGoogleMaps = () => {
    // User / Destination Location
    let destLat = isB2B ? scrapperLocation?.lat : userLiveLocation?.lat;
    let destLng = isB2B ? scrapperLocation?.lng : userLiveLocation?.lng;

    // Fallbacks if above coordinates are not yet resolved
    if (!destLat || !destLng) {
      destLat = requestData?.location?.lat;
      destLng = requestData?.location?.lng;
    }

    // Scrapper / Origin Location (partnerLocation in B2B or scrapperLocation in normal flows)
    let originLat = isB2B ? partnerLocation?.lat : scrapperLocation?.lat;
    let originLng = isB2B ? partnerLocation?.lng : scrapperLocation?.lng;

    // Fallbacks if above coordinates are not yet resolved
    if (!originLat || !originLng) {
      if (isB2B) {
        originLat = requestData?.location?.lat;
        originLng = requestData?.location?.lng;
      }
    }

    if (!destLat || !destLng) {
      alert(getTranslatedText("Destination location not found."));
      return;
    }

    let url = "";
    if (originLat && originLng) {
      url = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
    }

    window.open(url, '_blank');
  };

  const handleStartJourney = () => {
    setConfirmAction('start_journey');
    setConfirmMessage(getTranslatedText('Are you starting the journey to the pickup location?'));
    setShowConfirmModal(true);
  };

  const handleArrived = () => {
    setConfirmAction('arrived');
    setConfirmMessage(getTranslatedText('Have you arrived at the pickup location?'));
    setShowConfirmModal(true);
  };

  const handleScrapPickedUp = () => {
    setConfirmAction('pickup');
    const isService = requestData.orderType === 'cleaning_service';
    setConfirmMessage(isService
      ? getTranslatedText('Have you started the cleaning service?')
      : getTranslatedText('Have you picked up the scrap from the customer?')
    );
    setShowConfirmModal(true);
  };

  const handlePaymentMade = () => {
    if (!requestData.isDonation && (!paidAmount || parseFloat(paidAmount) <= 0)) {
      alert(getTranslatedText('Please enter a valid amount'));
      return;
    }

    // Determine Logic based on Type
    const isCleaning = requestData.orderType === 'cleaning_service';

    // For Scrap Sell (Scrapper Pays)
    if (!isCleaning) {
      if (requestData.isDonation) {
        setConfirmAction('payment_scrap');
        setConfirmMessage(getTranslatedText("Confirm complete donation pickup?"));
        setShowConfirmModal(true);
        return;
      }
      // Logic handled in handleRazorpayPayment or handleWalletPayment
      setConfirmAction('payment_scrap');
      setConfirmMessage(isB2B 
        ? getTranslatedText("Pay ₹{amount} to Partner?", { amount: paidAmount })
        : getTranslatedText("Pay ₹{amount} to User?", { amount: paidAmount })
      );
      setShowConfirmModal(true);
      return;
    }

    // For Cleaning Service (User Pays)
    setConfirmAction('payment_cleaning');
    setConfirmMessage(getTranslatedText("Have you collected ₹{amount} from the customer?", { amount: paidAmount }));
    setShowConfirmModal(true);
  };

  // Payment Logic for Scrap Sell (Scrapper Pays User)
  const processScrapPayment = async () => {
    const isDonation = requestData.isDonation;
    const amount = isDonation ? 0 : Number(paidAmount);

    // Case 1: Cash Payment (No wallet transfer to user) or Donation
    if (dealType === 'Cash' || isDonation) {
      setIsProcessingPayment(true);
      await completePaymentSuccess(amount);
      return;
    }

    // Case 2: Wallet Payment
    if (useWallet) {
      if (walletBalance >= amount) {
        // Pay via Wallet
        try {
          setIsProcessingPayment(true);
          await walletService.payOrderViaWallet((requestData._id || requestData.id), amount);
          await completePaymentSuccess(amount);
        } catch (error) {
          alert(error.response?.data?.message || 'Wallet payment failed');
          setIsProcessingPayment(false);
        }
      } else {
        alert(getTranslatedText("Insufficient balance for this deal."));
      }
    } else {
      // Case 3: Pay via Razorpay (Online)
      try {
        setIsProcessingPayment(true);
        
        // Recharge wallet first (Amount to ensure success on backend)
        const rechargeAmount = amount;
        const orderData = await walletService.createRechargeOrder(rechargeAmount);

        const options = {
          key: orderData.data.keyId,
          amount: orderData.data.amount,
          currency: orderData.data.currency,
          name: "Junkar",
          description: "Order Payment to User",
          order_id: orderData.data.orderId,
          prefill: {
            name: "Scrapper",
            contact: user?.phone
          },
          theme: {
            color: "#22c55e"
          }
        };

        await initializePayment(options, async (response) => {
          try {
            // Verify and Complete
            await walletService.verifyRecharge({
              ...response,
              amount: rechargeAmount
            });

            // Now that wallet is recharged, actually PAY the order
            await walletService.payOrderViaWallet((requestData._id || requestData.id), amount);

            await completePaymentSuccess(amount);
          } catch (err) {
            console.error("Payment Error:", err);
            alert(err.response?.data?.message || 'Payment processing failed. If money was deducted, it is in your wallet.');
            setIsProcessingPayment(false);
          }
        }, (err) => {
          console.error("Razorpay Error:", err);
          setIsProcessingPayment(false);
        });

      } catch (error) {
        console.error(error);
        setIsProcessingPayment(false);
      }

    }
  };

  const completePaymentSuccess = async (amount) => {
    const orderId = requestData._id || requestData.id;
    // Update order status
    const targetStatus = (requestData.isDonation || amount === 0) ? 'completed' : 'in_progress';
    try {
      await orderAPI.updateStatus(orderId, targetStatus, 'completed', amount, {
        isNegotiated,
        dealType,
        finalPrice: amount
      });
      setPaymentStatus('completed');
      setShowPaymentInput(false);
      setIsProcessingPayment(false);
      
      if (targetStatus === 'completed') {
        // Redirect or show success
        alert(getTranslatedText('Order Completed!'));
        navigate('/scrapper/dashboard');
      } else {
        setRequestData({
          ...requestData,
          status: targetStatus,
          paymentStatus: 'completed',
          paidAmount: amount
        });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update order status');
      setIsProcessingPayment(false);
    }
  };

  const handleCompleteOrder = () => {
    setConfirmAction('complete');
    setConfirmMessage(getTranslatedText('Are you sure you want to complete this order?'));
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    const orderId = requestData._id || requestData.id;
    if (!orderId) {
      alert(getTranslatedText('Order ID not found'));
      return;
    }

    try {
      if (confirmAction === 'start_journey') {
        const response = await orderAPI.updateStatus(orderId, 'on_way');
        if (response.success) {
          setRequestData({
            ...requestData,
            status: 'on_way'
          });
          setStage('pickup');
        } else {
          throw new Error(getTranslatedText('Failed to update order status'));
        }
      } else if (confirmAction === 'arrived') {
        const response = await orderAPI.updateStatus(orderId, 'arrived');
        if (response.success) {
          setRequestData({
            ...requestData,
            status: 'arrived'
          });
          setStage('arrived');
        } else {
          throw new Error(getTranslatedText('Failed to update order status'));
        }
      } else if (confirmAction === 'pickup') {
        const response = await orderAPI.updateStatus(orderId, 'in_progress');

        if (response.success) {
          setIsPickedUp(true);
          const isService = requestData.orderType === 'cleaning_service';
          const amount = isService ? (requestData.estimatedEarnings || '₹0') : (requestData.estimatedEarnings || '₹450');
          // Strip currency symbol for state
          setFinalAmount(amount);

          setPaymentStatus('pending');
          setShowPaymentInput(true);

          setRequestData({
            ...requestData,
            status: 'in_progress',
            paymentStatus: 'pending'
          });
        } else {
          throw new Error(getTranslatedText('Failed to update order status'));
        }
      } else if (confirmAction === 'payment_scrap') {
        setShowConfirmModal(false);
        processScrapPayment(); // Trigger the logic
        return;
      } else if (confirmAction === 'payment_cleaning') {
        // Update order status to in_progress (just in case) and paymentStatus to completed
        const response = await orderAPI.updateStatus(orderId, 'in_progress', 'completed', Number(paidAmount), {
          dealType: 'Cash' // Cleaning is always cash collected for now or handled separately
        });

        if (response.success) {
          setPaymentStatus('completed');
          setShowPaymentInput(false);

          // Update local state
          setRequestData({
            ...requestData,
            status: 'in_progress',
            paymentStatus: 'completed',
            paidAmount: paidAmount
          });
        } else {
          throw new Error(getTranslatedText('Failed to update payment status'));
        }
      } else if (confirmAction === 'complete') {
        // Update order status to completed
        const response = await orderAPI.updateStatus(orderId, 'completed');

        if (response.success) {
          setPaymentStatus('completed');
          setTimeout(() => {
            navigate('/scrapper', { replace: true });
          }, 1500);
        } else {
          throw new Error(getTranslatedText('Failed to complete order'));
        }
      }

      setShowConfirmModal(false);
      setConfirmAction(null);
      setConfirmMessage('');
    } catch (error) {
      console.error('Failed to confirm action:', error);
      alert(error.message || getTranslatedText('Failed to process. Please try again.'));
      setShowConfirmModal(false);
      setConfirmAction(null);
      setConfirmMessage('');
    }
  };

  const handleCancelOrder = async () => {
    const orderId = requestData._id || requestData.id;
    if (!orderId) return;

    if (window.confirm(getTranslatedText("Are you sure you want to cancel this order? This action cannot be undone."))) {
      try {
        const response = await orderAPI.cancel(orderId, "Cancelled by scrapper");
        if (response.success) {
          alert(getTranslatedText("Order cancelled successfully!"));
          navigate('/scrapper');
        }
      } catch (error) {
        console.error("Cancellation failed:", error);
        alert(error.message || getTranslatedText("Failed to cancel order"));
      }
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  const handleForwardToBigScrapper = async () => {
    const orderId = requestData._id || requestData.id;
    if (!orderId) return;

    if (window.confirm(getTranslatedText("Are you sure you want to forward this request to Big Scrappers? It will be removed from your active list."))) {
      try {
        const response = await orderAPI.forwardToBigScrapper(orderId);
        if (response.success) {
          alert(getTranslatedText("Request forwarded successfully!"));
          navigate('/scrapper/my-active-requests');
        }
      } catch (error) {
        console.error("Forwarding failed:", error);
        alert(error.message || getTranslatedText("Failed to forward request"));
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen w-full relative flex flex-col"
      style={{ background: "linear-gradient(to bottom, #72c688ff, #dcfce7)" }}
    >
      {/* Header with Back Button and Navigation */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/scrapper/my-active-requests')}
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-md bg-white text-slate-800 hover:bg-slate-50 border border-slate-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-current">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {requestData?.isDonation ? 'Donation Pickup' : (requestData?.requestId || getTranslatedText("Active Request"))}
            </h1>
            {allActiveRequests.length > 1 && (
              <p className="text-xs text-slate-500">
                {currentRequestIndex + 1} {getTranslatedText("of")} {allActiveRequests.length}
              </p>
            )}
          </div>
        </div>

        {/* Navigation between requests */}
        {allActiveRequests.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentRequestIndex > 0) {
                  const prevRequest = allActiveRequests[currentRequestIndex - 1];
                  navigate(`/scrapper/active-request/${prevRequest.id}`, {
                    state: { request: prevRequest },
                    replace: true
                  });
                }
              }}
              disabled={currentRequestIndex <= 0}
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-opacity disabled:opacity-30 bg-white text-slate-800 border border-slate-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-current">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (currentRequestIndex < allActiveRequests.length - 1) {
                  const nextRequest = allActiveRequests[currentRequestIndex + 1];
                  navigate(`/scrapper/active-request/${nextRequest.id}`, {
                    state: { request: nextRequest },
                    replace: true
                  });
                }
              }}
              disabled={currentRequestIndex >= allActiveRequests.length - 1}
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-opacity disabled:opacity-30 bg-white text-slate-800 border border-slate-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-current">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Map Container - Full Screen */}
      <div className="w-full h-screen">
        <ScrapperMap
          stage={isB2B ? 'pickup' : (stage || 'pickup')}
          orderId={requestData?.id || requestData?._id}
          // In B2B, the viewer is scrapper (Dukandar) but tracking THEIR partner (Pheriwala)
          // FALLBACK: Use requestData.location (Pheriwala's pickup address) instead of viewer's scrapperLocation
          scrapperLocation={isB2B ? (partnerLocation || requestData?.location) : scrapperLocation}
          userLocation={isB2B ? scrapperLocation : userLiveLocation}
          userName={requestData?.userName}
          enableTracking={true}
          hideRoute={isB2B}
        />
      </div>

      {/* Payment Page - Full Screen */}
      {
        showPaymentInput ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-40 flex flex-col"
            style={{ backgroundColor: '#ffffff' }}
          >
            {/* Header */}
            <div
              className="p-4 flex items-center gap-4 border-b"
              style={{ borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}
            >
              <button
                onClick={() => {
                  setShowPaymentInput(false);
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-md border border-slate-100"
                style={{ backgroundColor: '#ffffff' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: '#1e293b' }}>
                  <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <h1 className="text-xl font-bold" style={{ color: '#1e293b' }}>
                {requestData.orderType === 'cleaning_service' ? getTranslatedText('Collect Payment') : getTranslatedText('Make Payment')}
              </h1>
            </div>

            {/* Payment Content */}
            <div className="flex-1 overflow-y-auto p-6" style={{ background: "linear-gradient(to bottom, #f8fafc, #ffffff)" }}>
              <div className="max-w-md mx-auto">
                {/* Customer Info */}
                <div className="mb-6 p-4 rounded-xl border border-slate-200 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ecfdf5' }}>
                      <span className="text-lg font-bold" style={{ color: '#0ea5e9' }}>
                        {requestData.userName[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold" style={{ color: '#1e293b' }}>{requestData.userName}</p>
                      <p className="text-sm" style={{ color: '#64748b' }}>{requestData.scrapType}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: '#f1f5f9' }}>
                    <p className="text-xs mb-1" style={{ color: '#64748b' }}>
                      {requestData.isDonation ? "Request Type" : getTranslatedText("Estimated Amount")}
                    </p>
                    <p className="text-xl font-bold" style={{ color: '#0ea5e9' }}>
                      {requestData.isDonation ? <span className="text-green-600">DONATION</span> : (finalAmount || requestData?.estimatedEarnings || '₹450')}
                    </p>
                  </div>
                </div>

                {/* Payment Input */}
                <div className="mb-6 p-6 rounded-2xl shadow-md border border-slate-100" style={{ backgroundColor: '#ffffff' }}>
                  <h2 className="text-lg font-bold mb-4" style={{ color: '#1e293b' }}>
                    {requestData.isDonation ? getTranslatedText('Complete Donation') : (requestData.orderType === 'cleaning_service' ? getTranslatedText('Enter Amount Received') : getTranslatedText('Enter Amount Paid'))}
                  </h2>

                  {/* Payment Mode Selection for Scrap Pickup - Hidden for Cleaning Service */}
                  {requestData.orderType !== 'cleaning_service' && !requestData.isDonation && (
                    <div className="mb-6 space-y-4">
                      {/* Wallet Balance Section */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-slate-500 text-sm">{getTranslatedText("Wallet Balance")}</span>
                          <span className="text-slate-800 font-bold">₹{walletBalance}</span>
                        </div>

                        {paidAmount && !requestData.isDonation && (() => {
                          const amount = Number(paidAmount);
                          const isOnlineDeal = dealType === 'Online';

                          // Case 1: Wallet Payment
                          if (isOnlineDeal && useWallet && walletBalance < amount) {
                            return <p className="text-red-500 text-xs mb-2">{getTranslatedText("Insufficient Balance. Please recharge.")}</p>;
                          }
                          return null;
                        })()}

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setUseWallet(true);
                              setDealType('Online');
                            }}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${dealType === 'Online' && useWallet ? 'bg-sky-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                          >
                            {getTranslatedText("Wallet")}
                          </button>
                          <button
                            onClick={() => {
                              setUseWallet(false);
                              setDealType('Online');
                            }}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${dealType === 'Online' && !useWallet ? 'bg-sky-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                          >
                            {getTranslatedText("Online")}
                          </button>
                          <button
                            onClick={() => {
                              setDealType('Cash');
                              setUseWallet(false); // No wallet needed for cash
                            }}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${dealType === 'Cash' ? 'bg-amber-500 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                          >
                            {getTranslatedText("Cash")}
                          </button>
                        </div>
                      </div>

                      {/* Negotiation Checkbox */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                        <input
                          type="checkbox"
                          id="negotiated"
                          checked={isNegotiated}
                          onChange={(e) => setIsNegotiated(e.target.checked)}
                          className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                        />
                        <label htmlFor="negotiated" className="text-sm font-semibold text-amber-900">
                          {isB2B ? getTranslatedText("Price Negotiated with Partner?") : getTranslatedText("Price Negotiated with User?")}
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Amount Input */}
                  {requestData.isDonation ? (
                    <div className="mb-6">
                      <div className="p-4 rounded-xl bg-green-50 border border-green-100 mb-4">
                        <p className="text-sm font-semibold text-green-800 text-center">
                          {getTranslatedText("This is a donation request. No payment is required.")}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handlePaymentMade}
                        disabled={isProcessingPayment}
                        className="w-full py-4 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2"
                        style={{ backgroundColor: '#22c55e', color: '#ffffff' }}
                      >
                        {isProcessingPayment ? (
                          <span>{getTranslatedText("Processing...")}</span>
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" />
                            </svg>
                            {getTranslatedText("Confirm Pickup & Thank User")}
                          </>
                        )}
                      </motion.button>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                        {getTranslatedText("Amount (₹)")}
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-4 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-2xl font-bold text-center bg-transparent"
                        style={{
                          borderColor: paidAmount ? '#22c55e' : '#cbd5e1',
                          color: '#1e293b'
                        }}
                        min="0"
                        step="0.01"
                        autoFocus
                      />
                      {paidAmount && (
                        <p className="text-sm mt-2 text-center" style={{ color: '#64748b' }}>
                          {requestData.orderType === 'cleaning_service'
                            ? getTranslatedText("You collected ₹{amount} from the customer", { amount: parseFloat(paidAmount) || 0 })
                            : (isB2B 
                                ? getTranslatedText("You will pay ₹{amount} to the partner", { amount: parseFloat(paidAmount) || 0 }) 
                                : getTranslatedText("You will pay ₹{amount} to the customer", { amount: parseFloat(paidAmount) || 0 }))
                          }
                        </p>
                      )}
                    </div>
                  )}

                  {!requestData.isDonation && (
                    <>
                      {/* Quick Amount Buttons */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[100, 200, 300, 400, 500, 1000].map((amount) => (
                          <motion.button
                            key={amount}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setPaidAmount(amount.toString())}
                            className="py-2 rounded-lg font-semibold text-sm border"
                            style={{
                              backgroundColor: paidAmount === amount.toString() ? '#22c55e' : '#f1f5f9',
                              borderColor: paidAmount === amount.toString() ? '#22c55e' : '#e2e8f0',
                              color: paidAmount === amount.toString() ? '#ffffff' : '#475569'
                            }}
                          >
                            ₹{amount}
                          </motion.button>
                        ))}
                      </div>

                      {/* Final Confirm Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handlePaymentMade}
                        disabled={!paidAmount || parseFloat(paidAmount) <= 0 || isProcessingPayment}
                        className="w-full py-4 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#22c55e', color: '#ffffff' }}
                      >
                        {isProcessingPayment ? (
                          <span>{getTranslatedText("Processing...")}</span>
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" />
                            </svg>
                            {getTranslatedText("Confirm Payment")}
                          </>
                        )}
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div >
        ) : (
          <>
            {/* Request Details & Contact Info - Bottom Slide (when payment not pending) */}
            <motion.div
              key="details-sheet"
              initial={{ y: '100%' }}
              animate={{ y: isMinimized ? 'calc(100% - 100px)' : 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="sheet-container absolute bottom-0 left-0 right-0 z-30 rounded-t-2xl shadow-2xl flex flex-col bg-white border-t border-slate-200"
              style={{ height: '65vh', overflow: 'hidden', touchAction: 'none' }}
            >
              {/* Slide Handle */}
              <div 
                className="w-full py-4 cursor-pointer"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <div className="w-12 h-1.5 mx-auto rounded-full flex-shrink-0 bg-slate-300" />
              </div>

              {/* Request Content - Compact - Scrollable */}
              <div className="p-4 pb-2 overflow-y-auto flex-1" style={{ minHeight: 0, WebkitOverflowScrolling: 'touch' }}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-slate-800">{getTranslatedText("Pickup Details")}</h2>
                </div>

                {/* Request Details - Compact */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-sky-50">
                      <span className="text-sm font-bold text-sky-600">
                        {requestData.userName[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-slate-800">
                        {requestData.userName}
                        {requestData.userModel === 'Scrapper' && (
                          <span className="text-[10px] ml-1.5 px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded font-bold uppercase tracking-wider border border-sky-100">
                            Partner Store
                          </span>
                        )}
                      </p>
                      {isPickedUp && requestData.userPhone && (
                        <p className="text-[10px] font-bold text-slate-500 mb-0.5">{requestData.userPhone}</p>
                      )}
                      <p className="text-xs truncate text-slate-500">
                        {requestData.scrapType}
                        {requestData.weight ? ` (${requestData.weight} Kg)` : ''}
                        {requestData.scrapItems?.some(item => item.quantity > 0) && ` (${requestData.scrapItems.filter(item => item.quantity > 0).map(item => `${item.quantity} Nos`).join(', ')})`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-sky-600">
                        {requestData.isDonation ? (
                          <span className="text-green-600 font-extrabold">DONATE</span>
                        ) : requestData.hasNegotiableItems ? (
                          <span className="text-amber-600">Negotiable</span>
                        ) : (
                          requestData.estimatedEarnings
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Negotiable Order Info (Model B) */}
                  {(requestData.isNegotiated || requestData.scrapItems?.some(item => item.pricingType === 'negotiable')) && (
                    <div className="mt-2 p-3 rounded-xl border" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🤝</span>
                        <span className="text-xs font-bold" style={{ color: '#b45309' }}>Negotiation Required</span>
                      </div>
                      {requestData.scrapItems?.filter(item => item.pricingType === 'negotiable').map((item, idx) => (
                        <div key={idx} className="text-xs space-y-1" style={{ color: '#4a5568' }}>
                          {item.itemCondition && (
                            <p>
                              <span className="font-semibold">Condition:</span>{' '}
                              {item.itemCondition === 'good' ? '✅ Good' : item.itemCondition === 'average' ? '⚠️ Average' : '🔧 Damaged'}
                            </p>
                          )}
                          {item.expectedPrice && (
                            <p>
                              <span className="font-semibold">Expected Price:</span> ₹{item.expectedPrice}
                            </p>
                          )}
                          {item.weight > 0 && (
                            <p>
                              <span className="font-semibold">{getTranslatedText("Weight")}:</span> {item.weight} {getTranslatedText("kg")}
                            </p>
                          )}
                          {item.quantity > 0 && (
                            <p>
                              <span className="font-semibold">{getTranslatedText("Quantity")}:</span> {item.quantity} {getTranslatedText("Nos")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {renderPickupSlot()}

                  {/* User Notes */}
                  {requestData.notes && (
                    <div className="mb-4">
                      <p className="text-xs md:text-sm mb-1" style={{ color: '#718096' }}>
                        {getTranslatedText("Note from User:")}
                      </p>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="text-sm md:text-base italic" style={{ color: '#4a5568' }}>
                          "{requestData.notes}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Scrap Images */}
                  {requestData.images && requestData.images.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold mb-2" style={{ color: '#475569' }}>
                        {requestData.orderType === 'cleaning_service' ? getTranslatedText('Area Images') : getTranslatedText('Scrap Images')}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {requestData.images.slice(0, 6).map((image, idx) => (
                          <motion.div
                            key={image.id || idx}
                            whileHover={{ scale: 1.05 }}
                            className="relative aspect-square rounded-lg overflow-hidden bg-slate-100"
                          >
                            <img
                              src={image.preview || image}
                              alt={`Scrap ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to placeholder if image fails to load
                                e.target.src = 'https://via.placeholder.com/150?text=Scrap';
                              }}
                            />
                            {requestData.images.length > 6 && idx === 5 && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  +{requestData.images.length - 6}
                                </span>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Made Status */}
                {(paymentStatus === 'paid' || paymentStatus === 'completed') && requestData?.status !== 'completed' && (
                  <div className="mb-3 p-4 rounded-xl bg-sky-50 border border-sky-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-sky-800">{getTranslatedText("Payment Status")}</span>
                      <span className="text-sm font-bold text-sky-600">
                        {requestData.orderType === 'cleaning_service' ? getTranslatedText('Collected ✓') : getTranslatedText('Paid ✓')}
                      </span>
                    </div>
                    <p className="text-xs mb-3 text-slate-600">
                      {requestData.orderType === 'cleaning_service'
                        ? getTranslatedText("Payment of ₹{amount} collected successfully", { amount: paidAmount || requestData?.paidAmount || '0' })
                        : getTranslatedText("Payment of ₹{amount} made successfully to customer", { amount: paidAmount || requestData?.paidAmount || '0' })
                      }
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCompleteOrder}
                      className="w-full py-3 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#22c55e', color: '#ffffff' }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {getTranslatedText("Complete Order")}
                    </motion.button>
                  </div>
                )}

                {/* Order Completed Status */}
                {requestData?.status === 'completed' && (
                  <div className="mb-3 p-4 rounded-xl text-center bg-sky-50 border border-sky-100">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2 text-sky-500">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-sm font-bold mb-1 text-sky-800">{getTranslatedText("Order Completed!")}</p>
                    <p className="text-xs text-slate-500">{getTranslatedText("Redirecting to dashboard...")}</p>
                  </div>
                )}
              </div>

              {/* Contact Buttons - Fixed at Bottom */}
              <div
                className="px-4 pb-4 pt-2 border-t border-slate-200 flex-shrink-0 bg-white"
              >
                {/* Scrap Picked Up Button - Primary Action */}
                {/* FORWARD BUTTON (Small Scrappers Only) */}
                {['small', 'feri_wala'].includes(currentUser?.scrapperType) && !isPickedUp && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleForwardToBigScrapper}
                    className="w-full mb-3 py-3 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  >
                    <span className="text-xl">⏩</span>
                    {getTranslatedText("Forward to Big Scrapper")}
                  </motion.button>
                )}

                {/* Dynamic Tracking Step Buttons */}
                {!isPickedUp ? (
                  <>
                    {(requestData?.status === 'confirmed' || requestData?.status === 'pending' || requestData?.assignmentStatus === 'accepted') && requestData?.status !== 'on_way' && requestData?.status !== 'arrived' && requestData?.status !== 'in_progress' ? (
                      // IF Self Delivery, Receiver shouldn't start journey
                      requestData?.pickupAddress?.street === 'Self-delivery' ? (
                        <div className="w-full mb-3 py-3 rounded-xl font-bold text-sm text-center bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {getTranslatedText('Waiting for Partner to Arrive...')}
                        </div>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleStartJourney}
                          className="w-full mb-3 py-3 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {getTranslatedText('Start Journey')}
                        </motion.button>
                      )
                    ) : requestData?.status === 'on_way' ? (
                      requestData?.pickupAddress?.street === 'Self-delivery' ? (
                        <div className="w-full mb-3 py-3 rounded-xl font-bold text-sm text-center bg-amber-50 text-amber-700 border border-amber-100">
                          {getTranslatedText('Partner is on the way...')}
                        </div>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleArrived}
                          className="w-full mb-3 py-3 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2 bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="10" r="3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {getTranslatedText('Reached Location')}
                        </motion.button>
                      )
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleScrapPickedUp}
                        className="w-full mb-3 py-3 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2 bg-sky-600 text-white hover:bg-sky-700 transition-colors"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: '#ffffff' }}>
                          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {isB2B 
                          ? getTranslatedText('Confirm Partner Arrival') 
                          : (requestData.orderType === 'cleaning_service' ? getTranslatedText('Start Service') : getTranslatedText('Pickup Scrap'))
                        }
                      </motion.button>
                    )}
                  </>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (paymentStatus === 'completed') {
                        handleCompleteOrder();
                      } else {
                        setShowPaymentInput(true);
                      }
                    }}
                    className={`w-full mb-3 py-3 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2 ${paymentStatus === 'completed' ? 'bg-sky-600' : 'bg-emerald-600'} text-white transition-colors`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: '#ffffff' }}>
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {paymentStatus === 'completed' 
                      ? getTranslatedText('Complete Order') 
                      : (requestData.isDonation ? getTranslatedText('Complete Donation') : getTranslatedText('Make Payment / Complete'))
                    }
                  </motion.button>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCall}
                    className="py-3 rounded-xl font-semibold text-xs shadow-md flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-sky-500">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {getTranslatedText("Call")}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleChat}
                    className="py-3 rounded-xl font-semibold text-xs shadow-md flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-blue-500">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {getTranslatedText("Chat")}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleOpenGoogleMaps}
                    className="py-3 rounded-xl font-semibold text-xs shadow-md flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-emerald-500">
                      <path d="M3 11l19-9-9 19-2-8-8-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {getTranslatedText("Navigate")}
                  </motion.button>
                </div>
                {!isCompleted && !isPickedUp && (
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setShowFakeLeadModal(true)}
                      className="flex-1 py-3 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                    >
                      {getTranslatedText("Report Fake Lead")}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelOrder}
                      className="flex-1 py-3 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                    >
                      {getTranslatedText("Cancel Order")}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )
      }

      {/* Report Fake Lead Modal */}
      <AnimatePresence>
        {showFakeLeadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-2xl p-6 bg-white shadow-2xl"
            >
              <h3 className="text-lg font-bold mb-4 text-slate-800">
                {getTranslatedText("Report Fake Lead")}
              </h3>
              <div className="space-y-3 mb-4">
                <label className="block text-sm font-medium text-slate-700">{getTranslatedText("Reason")}</label>
                <select
                  value={fakeLeadReason}
                  onChange={(e) => setFakeLeadReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-sm"
                >
                  <option value="wrong_item">{getTranslatedText("Wrong item")}</option>
                  <option value="wrong_address">{getTranslatedText("Wrong address")}</option>
                  <option value="not_available">{getTranslatedText("Not available")}</option>
                  <option value="customer_not_available">{getTranslatedText("Customer not available")}</option>
                  <option value="other">{getTranslatedText("Other")}</option>
                </select>
                <label className="block text-sm font-medium text-slate-700">{getTranslatedText("Notes (optional)")}</label>
                <textarea
                  value={fakeLeadNotes}
                  onChange={(e) => setFakeLeadNotes(e.target.value)}
                  placeholder="..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-sm resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowFakeLeadModal(false); setFakeLeadNotes(''); }}
                  className="flex-1 py-2.5 rounded-xl font-semibold bg-slate-100 text-slate-700"
                >
                  {getTranslatedText("Cancel")}
                </button>
                <button
                  type="button"
                  disabled={fakeLeadSubmitting}
                  onClick={async () => {
                    const orderId = requestData?._id || requestData?.id;
                    if (!orderId) return;
                    setFakeLeadSubmitting(true);
                    try {
                      const res = await orderAPI.reportFakeLead(orderId, { reason: fakeLeadReason, notes: fakeLeadNotes.trim() });
                      if (res.success) {
                        alert(getTranslatedText("Fake lead reported. Admin will review."));
                        setShowFakeLeadModal(false);
                        setFakeLeadNotes('');
                      } else {
                        alert(res.message || getTranslatedText("Failed to submit report."));
                      }
                    } catch (err) {
                      const msg = err?.message || '';
                      alert(msg.includes('already') ? getTranslatedText("This order was already reported.") : (msg || getTranslatedText("Failed to submit report.")));
                    } finally {
                      setFakeLeadSubmitting(false);
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  {fakeLeadSubmitting ? getTranslatedText("Processing...") : getTranslatedText("Submit Report")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-2xl p-6 bg-white shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-4 text-slate-800">
                {getTranslatedText("Confirm Action")}
              </h3>
              <p className="mb-6 text-base text-slate-600">
                {confirmMessage}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 rounded-xl font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  {getTranslatedText("Cancel")}
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3 rounded-xl font-bold bg-sky-600 text-white hover:bg-sky-700 transition-colors"
                >
                  {getTranslatedText("Yes, Confirm")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div >
  );
};

export default ActiveRequestDetailsPage;

