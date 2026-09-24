import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { FaGift, FaChartLine, FaCheck, FaBell, FaArrowLeft, FaTimes } from 'react-icons/fa';
import socketClient from '../../shared/utils/socketClient';
import PriceTicker from '../../user/components/PriceTicker';
import ScrapperSolutions from './ScrapperSolutions';
import { getActiveRequestsCount, getScrapperAssignedRequests, migrateOldActiveRequest } from '../../shared/utils/scrapperRequestUtils';
import { earningsAPI, scrapperOrdersAPI, subscriptionAPI, kycAPI, scrapperProfileAPI, notificationAPI, orderAPI } from '../../shared/utils/api';
import BannerSlider from '../../shared/components/BannerSlider';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import LanguageSelector from '../../shared/components/LanguageSelector';
import ScrapperBottomNav from './ScrapperBottomNav';
import { showBrowserNotification } from '../../../services/pushNotificationService';
const siteLogo = '/junkar.png';

const ScrapperDashboard = () => {
  const staticTexts = [
    "Loading dashboard...",
    "Welcome, {name}! 👋",
    "Ready to start earning?",
    "Available for Pickups",
    "Currently Offline",
    "You will receive requests",
    "Turn on to receive requests",
    "ON",
    "OFF",
    "Market Price Add‑On",
    "Unlock real‑time scrap rates",
    "View plans",
    "Earnings Summary",
    "Today",
    "This Week",
    "This Month",
    "Total",
    "Quick Stats",
    "Completed",
    "Rating",
    "Active",
    "Active Requests",
    "View All",
    "Unknown User",
    "Scrap",
    "Time not specified",
    "Accepted",
    "Picked Up",
    "Payment Pending",
    "View {count} more request",
    "View {count} more requests",
    "Subscription Status",
    "Active until {date}",
    "Recent Activity",
    "Order ID: {id}",
    "Estimated Earnings",
    "No activity recorded yet.",
    "Verified",
    "Pending",
    "Rejected",
    "Not Submitted",
    "Hi, Scrapper!",
    "Scrapper",
    "View Earnings",
    "Scrap Pickup",
    "User",
    "Invite scrappers and earn rewards",
    "Orders History",
    "order",
    "orders",
    "No Completed Orders Yet",
    "Your completed orders will appear here",
    "Completed on:"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isReadyForRequests, setIsReadyForRequests] = useState(() => {
    return localStorage.getItem('scrapperReceptionMode') === 'true';
  });
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [dismissedRequestIds, setDismissedRequestIds] = useState(() => {
    try {
      const saved = sessionStorage.getItem('scrapperDismissedRequestIds');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  });
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [kycStatus, setKycStatus] = useState(null); // Backend KYC status
  const [subscriptionData, setSubscriptionData] = useState(null); // Backend subscription data
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [detailOrder, setDetailOrder] = useState(null); // Full order data for detail modal
  const [loadingDetailId, setLoadingDetailId] = useState(null); // orderId currently being fetched

  // Load earnings and stats from localStorage
  const [earnings, setEarnings] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0
  });

  const [stats, setStats] = useState({
    completedPickups: 0,
    rating: 4.8,
    activeRequests: 0
  });
  const [marketSubStatus, setMarketSubStatus] = useState('inactive'); // for real-time market price subscription

  const [completedOrders, setCompletedOrders] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [targetedRequests, setTargetedRequests] = useState([]);

  useEffect(() => {
    sessionStorage.setItem('scrapperDismissedRequestIds', JSON.stringify(dismissedRequestIds));
  }, [dismissedRequestIds]);

  // Function to load and update dashboard data
  const loadDashboardData = async () => {
    try {
      // Load earnings from backend
      const earningsResponse = await earningsAPI.getSummary();
      if (earningsResponse.success && earningsResponse.data?.summary) {
        const summary = earningsResponse.data.summary;
        setEarnings({
          today: summary.today || 0,
          week: summary.week || 0,
          month: summary.month || 0,
          total: summary.total || 0
        });
        setStats(prev => ({
          ...prev,
          completedPickups: summary.completedOrders || 0,
          rating: summary.rating || 5.0
        }));
      } else {
        // Fallback to localStorage if backend fails
        const earningsData = JSON.parse(localStorage.getItem('scrapperEarnings') || '{"today": 0, "week": 0, "month": 0, "total": 0}');
        setEarnings({
          today: earningsData.today || 0,
          week: earningsData.week || 0,
          month: earningsData.month || 0,
          total: earningsData.total || 0
        });
        // We persist stats in a separate key or just keep previous/default
      }
    } catch (error) {
      console.error('Failed to load earnings from backend:', error);
      // Fallback to localStorage
      const earningsData = JSON.parse(localStorage.getItem('scrapperEarnings') || '{"today": 0, "week": 0, "month": 0, "total": 0}');
      setEarnings({
        today: earningsData.today || 0,
        week: earningsData.week || 0,
        month: earningsData.month || 0,
        total: earningsData.total || 0
      });
    }

    try {
      // Load completed orders from backend (earnings history)
      const historyResponse = await earningsAPI.getHistory('limit=100');
      if (historyResponse.success && historyResponse.data?.history) {
        const sortedOrders = historyResponse.data.history;
        setCompletedOrders(sortedOrders);
        setStats(prev => ({
          ...prev,
          completedPickups: sortedOrders.length
        }));
      } else {
        // Fallback to localStorage
        const orders = JSON.parse(localStorage.getItem('scrapperCompletedOrders') || '[]');
        const sortedOrders = orders.sort((a, b) => {
          const dateA = new Date(a.completedAt || a.pickedUpAt || 0);
          const dateB = new Date(b.completedAt || b.pickedUpAt || 0);
          return dateB - dateA;
        });
        setCompletedOrders(sortedOrders);
        setStats(prev => ({
          ...prev,
          completedPickups: orders.length
        }));
      }
    } catch (error) {
      console.error('Failed to load earnings history from backend:', error);
      // Fallback to localStorage
      const orders = JSON.parse(localStorage.getItem('scrapperCompletedOrders') || '[]');
      const sortedOrders = orders.sort((a, b) => {
        const dateA = new Date(a.completedAt || a.pickedUpAt || 0);
        const dateB = new Date(b.completedAt || b.pickedUpAt || 0);
        return dateB - dateA;
      });
      setCompletedOrders(sortedOrders);
    }

    try {
      // Load active requests from backend
      const activeResponse = await scrapperOrdersAPI.getMyAssigned();
      if (activeResponse.success && activeResponse.data?.orders) {
        const active = activeResponse.data.orders.filter(o => {
          const s = o.status?.toLowerCase();
          return s !== 'completed' && s !== 'cancelled';
        });
        setActiveRequests(active);
        setStats(prev => ({
          ...prev,
          activeRequests: active.length
        }));
      } else {
        // Fallback to localStorage
        const requests = getScrapperAssignedRequests();
        const activeCount = requests.filter(req => {
          const s = req.status?.toLowerCase();
          return s !== 'completed' && s !== 'cancelled';
        }).length;
        setActiveRequests(requests.filter(req => {
          const s = req.status?.toLowerCase();
          return s !== 'completed' && s !== 'cancelled';
        }));
        setStats(prev => ({
          ...prev,
          activeRequests: activeCount
        }));
      }
    } catch (error) {
      console.error('Failed to load active requests from backend:', error);
      // Fallback to localStorage
      const requests = getScrapperAssignedRequests();
      const activeCount = requests.filter(req => {
        const s = req.status?.toLowerCase();
        return s !== 'completed' && s !== 'cancelled';
      }).length;
      setActiveRequests(requests.filter(req => {
        const s = req.status?.toLowerCase();
        return s !== 'completed' && s !== 'cancelled';
      }));
      setStats(prev => ({
        ...prev,
        activeRequests: activeCount
      }));
    }

    // Load targeted requests for big scrappers
    if (['big', 'wholesaler', 'dukandaar'].includes(user?.scrapperType)) {
      try {
        const targetedResponse = await scrapperOrdersAPI.getTargeted();
        if (targetedResponse.success && targetedResponse.data?.orders) {
          setTargetedRequests(targetedResponse.data.orders);
        }
      } catch (error) {
        console.error('Failed to load targeted requests:', error);
      }
    }

    // Load separate market price subscription status (different from onboarding subscription)
    const marketStatus =
      localStorage.getItem('scrapperMarketPriceSubscriptionStatus') || 'inactive';
    setMarketSubStatus(marketStatus);
  };



  const handleReceptionToggle = async () => {
    const newState = !isReadyForRequests;
    setIsReadyForRequests(newState);
    localStorage.setItem('scrapperReceptionMode', newState);
    // When turning off, clear the current count
    if (!newState) {
      setPendingRequestsCount(0);
    }
    
    // Sync with backend so push notifications work correctly
    try {
      await scrapperProfileAPI.updateMyProfile({ 
        receptionMode: newState,
        isOnline: newState
      });
    } catch (error) {
      console.error('Failed to update availability status via reception toggle:', error);
    }
  };

  // Socket listener for new requests (Active only when Ready Mode is ON)
  useEffect(() => {
    if (!isReadyForRequests) return;

    const jwtToken = localStorage.getItem('token');
    if (!jwtToken) return;

    // Connect socket (idempotent - won't reconnect if already connected)
    const socket = socketClient.connect(jwtToken);
    const notifiedOrderIds = new Set();

    const notifyForRequest = async (request) => {
      const orderId = request?.orderId;
      if (!orderId || notifiedOrderIds.has(orderId)) return;

      notifiedOrderIds.add(orderId);

      await showBrowserNotification('New Request Alert!', {
        body: `${request.userName || 'Customer'} - ${request.addressPreview || request.city || 'Location available on map'}`,
        data: {
          orderId,
          type: 'new_order',
          link: `/scrapper/active-requests?highlight=${orderId}`
        },
        tag: `new-order-${orderId}`
      });
    };

    const handleNewOrder = (data) => {
      console.log('🔔 Dashboard: New Request Received!', data);
      const newRequest = {
        orderId: data.orderId,
        userName: data.userName || 'Customer',
        city: data.city || '',
        addressPreview: data.addressPreview || data.message || 'New pickup request',
        receivedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
      
      setPendingRequests(prev => {
        if (prev.some(r => r.orderId === newRequest.orderId)) return prev;
        return [...prev, newRequest];
      });
      setPendingRequestsCount(prev => prev + 1);
      notifyForRequest(newRequest).catch(console.error);
    };

    socket.on('new_order_request', handleNewOrder);
    
    // SYNC: Fetch existing available order notifications from DB on load
    const syncNotifications = async () => {
      try {
        const response = await notificationAPI.getNotifications('limit=10');
        if (response.success && response.data?.notifications) {
          const freshNotifications = response.data.notifications
            .filter(n => (n.type === 'new_order_request' || n.type === 'new_order' || n.title?.includes('New')) && !n.isRead)
            .map(n => ({
              notificationId: n._id,
              orderId: n.data?.orderId || n.orderId,
              userName: n.data?.userName || n.title?.split('from ')[1] || 'Customer',
              city: n.data?.city || '',
              addressPreview: n.data?.addressPreview || n.message || 'New pickup request',
              receivedAt: new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            }));
          
          if (freshNotifications.length > 0) {
            setPendingRequests(prev => {
              // Merge and avoid duplicates by orderId
              const existingIds = new Set(prev.map(p => p.orderId));
              const uniqueNew = freshNotifications.filter(
                n => n.orderId && !existingIds.has(n.orderId) && !dismissedRequestIds.includes(n.orderId)
              );
              uniqueNew.forEach(req => {
                notifyForRequest(req).catch(console.error);
              });
              return [...prev, ...uniqueNew];
            });
            setPendingRequestsCount(prev => freshNotifications.length);
          }
        }
      } catch (err) {
        console.error('Failed to sync notifications:', err);
      }
    };
    syncNotifications();

    // LIVE POLLING: Same as Desktop View to guarantee UI consistency in Mobile
    const fetchLiveOrders = async () => {
      try {
        let queryParams = '';
        if (navigator.geolocation) {
          try {
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 60000 });
            });
            queryParams = `lat=${position.coords.latitude}&lng=${position.coords.longitude}`;
          } catch (geoErr) {
            console.warn('Geolocation failed for Dashboard sync:', geoErr);
          }
        }
        
        const { scrapperOrdersAPI } = await import('../../shared/utils/api');
        const response = await scrapperOrdersAPI.getAvailable(queryParams);
        const orders = response?.data?.orders || response?.orders || [];
        
        if (orders && orders.length > 0) {
          const liveOrders = orders.map(order => ({
            notificationId: null, // Real-time fetch, no DB notification id
            orderId: order._id || order.id,
            userName: order.user?.name || 'Customer',
            city: order.pickupAddress?.city || '',
            addressPreview: [order.pickupAddress?.street, order.pickupAddress?.city].filter(Boolean).join(', ') || 'New pickup request',
            receivedAt: new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          }));

          setPendingRequests(prevArray => {
            const existingIds = new Set(prevArray.map(p => p.orderId));
            const uniqueNew = liveOrders.filter(
              n => n.orderId && !existingIds.has(n.orderId) && !dismissedRequestIds.includes(n.orderId)
            );
            
            if (uniqueNew.length > 0) {
              uniqueNew.forEach(req => {
                notifyForRequest(req).catch(console.error);
              });
              setPendingRequestsCount(prevCount => prevCount + uniqueNew.length);
              return [...uniqueNew, ...prevArray];
            }
            return prevArray;
          });
        }
      } catch (err) {
        console.error('Failed to fetch live orders:', err);
      }
    };
    fetchLiveOrders();
    const interval = setInterval(fetchLiveOrders, 15000);

    return () => {
      socket.off('new_order_request', handleNewOrder);
      clearInterval(interval);
    };
  }, [isReadyForRequests, dismissedRequestIds]);

  // FCM Registration and Setup - runs ONCE on mount only
  useEffect(() => {
    let active = true;
    import('../../../services/pushNotificationService').then(({ registerFCMToken }) => {
      if (!active) return;
      // Refresh token registration for this scrapper on dashboard mount
      registerFCMToken();
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  // Verify authentication and fetch KYC/Subscription status from backend
  useEffect(() => {
    const verifyAndFetchStatus = async () => {
      // Check if user is authenticated as scrapper
      const token = localStorage.getItem('token');
      const scrapperAuth = localStorage.getItem('scrapperAuthenticated');
      const scrapperUser = localStorage.getItem('scrapperUser');

      if (!token || scrapperAuth !== 'true' || !scrapperUser) {
        navigate('/scrapper/login', { replace: true });
        return;
      }

      // Verify token with backend
      try {
        const { authAPI } = await import('../../shared/utils/api');
        const response = await authAPI.getMe();

        if (!response.success || !response.data?.user) {
          // Token invalid
          navigate('/scrapper/login', { replace: true });
          return;
        }

        const userData = response.data.user;

        // Check if user has scrapper role
        if (userData.role !== 'scrapper') {
          console.warn('User does not have scrapper role:', userData.role);
          navigate('/scrapper/login', { replace: true });
          return;
        }

        // Update scrapper-specific localStorage
        localStorage.setItem('scrapperAuthenticated', 'true');
        localStorage.setItem('scrapperUser', JSON.stringify(userData));

        // Check if scrapper is blocked
        const scrapperStatus = localStorage.getItem('scrapperStatus') || 'active';
        if (scrapperStatus === 'blocked') {
          navigate('/scrapper/login', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        // On 401, redirect to login
        if (error.status === 401) {
          navigate('/scrapper/login', { replace: true });
          return;
        }
        // For other errors, continue with localStorage check
      }

      // Fetch KYC and Subscription status from backend
      setIsLoadingStatus(true);
      try {


        // Fetch KYC
        const kycRes = await kycAPI.getMy();
        const kyc = kycRes.data?.kyc;

        // Fetch Subscriptions
        const subRes = await subscriptionAPI.getMySubscription();
        const subscription = subRes.data?.subscription;
        const marketSubscription = subRes.data?.marketSubscription;

        if (kyc) {
          setKycStatus(kyc.status || 'not_submitted');
          localStorage.setItem('scrapperKYCStatus', kyc.status || 'not_submitted');
          localStorage.setItem('scrapperKYC', JSON.stringify(kyc));
        } else {
          setKycStatus('not_submitted');
        }

        // Handle Subscriptions
        const platformSubActive = subscription?.status === 'active' && new Date(subscription.expiryDate) > new Date();
        const marketSubActive = marketSubscription?.status === 'active' && new Date(marketSubscription.expiryDate) > new Date();

        setSubscriptionData({
          platform: subscription,
          market: marketSubscription,
          isPlatformActive: platformSubActive,
          isMarketActive: marketSubActive
        });

        localStorage.setItem('scrapperSubscriptionStatus', platformSubActive ? 'active' : 'expired');
        // We might want to store market status too
        if (marketSubActive) {
          localStorage.setItem('scrapperMarketPriceSubscriptionStatus', 'active');
        } else {
          localStorage.setItem('scrapperMarketPriceSubscriptionStatus', 'inactive');
        }

        // Redirect based on REAL backend data
        const backendKycStatus = kyc?.status || 'not_submitted';

        // If KYC not submitted or rejected, redirect to KYC page
        if (!kyc || backendKycStatus === 'rejected' || backendKycStatus === 'not_submitted') {
          navigate('/scrapper/kyc', { replace: true });
          return;
        }

        // If KYC is pending, redirect to status page
        if (backendKycStatus === 'pending') {
          navigate('/scrapper/kyc-status', { replace: true });
          return;
        }

        // If KYC is verified but platform subscription not active, redirect to subscription page
        // Note: Market price subscription is optional, so we don't block access if missing
        if (backendKycStatus === 'verified') {
          if (!platformSubActive) {
            navigate('/scrapper/subscription', { replace: true });
            return;
          }
        }

        // If KYC not verified or skipped, redirect to status page
        if (backendKycStatus !== 'verified' && backendKycStatus !== 'skipped') {
          navigate('/scrapper/kyc-status', { replace: true });
          return;
        }

        // If all checks pass (KYC verified + Platform Subscription active), allow dashboard to render
        migrateOldActiveRequest();
        loadDashboardData();
        
        // Ensure local reception state is synced to backend on load
        const localReception = localStorage.getItem('scrapperReceptionMode') === 'true';
        if (localReception) {
            import('../../shared/utils/api').then(({ scrapperProfileAPI }) => {
                scrapperProfileAPI.updateMyProfile({ receptionMode: true }).catch(console.error);
            });
        }
        
      } catch (error) {
        console.error('Error fetching KYC/Subscription status:', error);
        // On error, check localStorage as fallback
        const fallbackKycStatus = localStorage.getItem('scrapperKYCStatus');
        if (!fallbackKycStatus || fallbackKycStatus === 'not_submitted') {
          navigate('/scrapper/kyc', { replace: true });
          return;
        }
        if (fallbackKycStatus === 'pending') {
          navigate('/scrapper/kyc-status', { replace: true });
          return;
        }

        // Reconstruct basic subscription data from localStorage
        const storedSubStatus = localStorage.getItem('scrapperSubscriptionStatus');
        const storedMarketStatus = localStorage.getItem('scrapperMarketPriceSubscriptionStatus');

        setSubscriptionData({
          isPlatformActive: storedSubStatus === 'active',
          isMarketActive: storedMarketStatus === 'active'
        });

        // If verified in localStorage, allow dashboard
        loadDashboardData();
      } finally {
        setIsLoadingStatus(false);
      }
    };

    // Call the verifier on mount
    verifyAndFetchStatus();
  }, [navigate]);

  // Poll for KYC/Subscription status updates (every 10 seconds)
  useEffect(() => {
    if (isLoadingStatus) return; // Don't poll while initial load

    const interval = setInterval(async () => {
      try {
        // Fetch KYC
        const kycRes = await kycAPI.getMy();
        const kyc = kycRes.data?.kyc;

        // Fetch Subscriptions
        const subRes = await subscriptionAPI.getMySubscription();
        const subscription = subRes.data?.subscription;
        const marketSubscription = subRes.data?.marketSubscription;

        if (kyc) {
          setKycStatus(kyc.status || 'not_submitted');
          localStorage.setItem('scrapperKYCStatus', kyc.status || 'not_submitted');
          localStorage.setItem('scrapperKYC', JSON.stringify(kyc));
        }

        const platformSubActive = subscription?.status === 'active' && new Date(subscription.expiryDate) > new Date();
        const marketSubActive = marketSubscription?.status === 'active' && new Date(marketSubscription.expiryDate) > new Date();

        setSubscriptionData({
          platform: subscription,
          market: marketSubscription,
          isPlatformActive: platformSubActive,
          isMarketActive: marketSubActive
        });

        localStorage.setItem('scrapperSubscriptionStatus', platformSubActive ? 'active' : 'expired');
        if (marketSubActive) {
          localStorage.setItem('scrapperMarketPriceSubscriptionStatus', 'active');
        } else {
          localStorage.setItem('scrapperMarketPriceSubscriptionStatus', 'inactive');
        }

      } catch (error) {
        console.error('Error polling KYC/Subscription status:', error);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [isLoadingStatus]);

  // Load data from localStorage on mount and when component updates
  useEffect(() => {
    if (!isLoadingStatus) {
      loadDashboardData();
    }
  }, [isLoadingStatus]);

  // Listen for storage changes and page visibility to update dashboard in real-time
  useEffect(() => {
    // Listen for storage events (when localStorage changes in other tabs/windows)
    window.addEventListener('storage', loadDashboardData);

    // Also check on focus (when user comes back to this tab)
    window.addEventListener('focus', loadDashboardData);

    // Check when page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDashboardData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', loadDashboardData);
      window.removeEventListener('focus', loadDashboardData);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Dismiss a single notification
  const dismissRequestLocally = (orderId) => {
    if (!orderId) return;
    setDismissedRequestIds(prev => [...new Set([...prev, orderId])]);
    setPendingRequests(prev => prev.filter(r => r.orderId !== orderId));
    setPendingRequestsCount(prev => Math.max(0, prev - 1));
  };

  const handleClearAllRequests = async () => {
    const idsToDismiss = pendingRequests.map(req => req.orderId).filter(Boolean);

    if (idsToDismiss.length > 0) {
      setDismissedRequestIds(prev => [...new Set([...prev, ...idsToDismiss])]);
    }

    setPendingRequests([]);
    setPendingRequestsCount(0);
    setShowNotificationDropdown(false);

    try {
      await notificationAPI.markAllRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleDismissRequest = async (e, orderId, notificationId) => {
    e.stopPropagation(); // Don't navigate to map
    
    // 1. Update UI immediately
    dismissRequestLocally(orderId);
    
    // 2. Mark as read in backend if we have a notificationId
    if (notificationId) {
      try {
        await notificationAPI.markRead(notificationId);
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
  };

  // Smart Reject: Permanently saves rejection in DB so this order never comes back to this scrapper
  const handleRejectRequestShortcut = async (e, req) => {
    e.stopPropagation(); 
    try {
      // 1. Permanently reject in DB (works for both B2B and B2C)
      if (req.orderId) {
        await scrapperOrdersAPI.reject(req.orderId);
      }

      // 2. Clear from UI immediately
      dismissRequestLocally(req.orderId);

      // 3. Mark notification as read in DB
      if (req.notificationId) {
        notificationAPI.markRead(req.notificationId).catch(console.error);
      }
    } catch (err) {
      console.error('Reject error:', err);
      // Even if API fails, clear from UI for UX
      dismissRequestLocally(req.orderId);
    }
  };

  // Shortcut to accept request from dashboard notification
  const handleAcceptRequestShortcut = async (e, req) => {
    e.stopPropagation(); // Don't navigate to map
    try {
      const response = await scrapperOrdersAPI.accept(req.orderId);
      if (response.success || response.order) {
        // Remove from pending list
        dismissRequestLocally(req.orderId);
        
        // Mark notification as read
        if (req.notificationId) {
          notificationAPI.markRead(req.notificationId).catch(console.error);
        }
        
        // Navigate directly to my active requests
        setShowNotificationDropdown(false);
        navigate(`/scrapper/my-active-requests`);
      }
    } catch (err) {
      console.error('Accept error:', err);
      alert(err.message || getTranslatedText('Failed to accept order'));
    }
  };

  // Fetch full order details for the detail bottom sheet
  const handleViewRequestDetail = async (e, orderId) => {
    e.stopPropagation(); // Don't navigate to map
    if (!orderId || loadingDetailId) return;
    setLoadingDetailId(orderId);
    try {
      const response = await orderAPI.getById(orderId);
      const order = response?.data?.order || response?.order || null;
      if (order) {
        setDetailOrder(order);
      } else {
        alert('Could not load request details');
      }
    } catch (err) {
      console.error('Failed to fetch order detail:', err);
      alert(err.message || 'Failed to load request details');
    } finally {
      setLoadingDetailId(null);
    }
  };

  const capitalizeFirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
  };

  // Show loading state while fetching status from backend
  if (isLoadingStatus) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen w-full flex items-center justify-center bg-black"
        style={{ backgroundColor: '#000000' }}
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-full border-4 border-t-transparent mx-auto mb-4 border-sky-600"
          />
          <p className="text-sm font-semibold text-slate-800">
            {getTranslatedText("Loading dashboard...")}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen w-full text-slate-800"
      style={{ background: "linear-gradient(to bottom, #7dd3fc, #e0f2fe)" }}
    >
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <img src={siteLogo} alt="Junkar" className="h-20 md:h-24 w-auto object-contain object-left -ml-3" />
          </div>
          <div className="flex items-center gap-4 md:hidden">
            {/* Bell Icon with Badge + Notification Dropdown */}
            <div className="relative">
              <div
                className="cursor-pointer w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md border border-slate-100 transition-transform active:scale-95"
                onClick={() => setShowNotificationDropdown(prev => !prev)}
              >
                <FaBell className={`text-xl ${pendingRequestsCount > 0 ? 'text-sky-600 animate-bounce' : 'text-slate-400'}`} />
                {pendingRequestsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                    {pendingRequestsCount > 10 ? '10+' : pendingRequestsCount}
                  </span>
                )}
              </div>

              {/* Full Page Notification Drawer (Side Panel) */}
              <AnimatePresence>
                {showNotificationDropdown && (
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-[9999] bg-[#f4f7fe] flex flex-col"
                  >
                    {/* Drawer Header */}
                    <div className="bg-white p-4 flex items-center justify-between border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setShowNotificationDropdown(false)}
                          className="p-2 rounded-full bg-slate-100/50 text-slate-600 active:scale-90 transition-transform"
                        >
                          <FaArrowLeft size={18} />
                        </button>
                        <h2 className="text-lg font-extrabold text-[#111827]">New Pickup Requests 🔔</h2>
                      </div>
                      {pendingRequests.length > 0 && (
                        <button
                          onClick={handleClearAllRequests}
                          className="text-sm font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {/* Drawer Body - Notification Cards */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                      {pendingRequests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <FaBell className="text-slate-200 text-4xl" />
                          </div>
                          <p className="text-slate-400 font-bold">No new requests</p>
                          <p className="text-slate-300 text-xs mt-1">Check back later for new orders</p>
                        </div>
                      ) : (
                        pendingRequests.slice().reverse().map((req, idx) => (
                          <motion.div
                            key={req.orderId || idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => {
                              setPendingRequestsCount(0);
                              setPendingRequests([]);
                              setShowNotificationDropdown(false);
                              navigate(`/scrapper/active-requests${req.orderId ? `?highlight=${req.orderId}` : ''}`);
                            }}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer hover:shadow-md group"
                          >
                            <div className="absolute left-0 top-0 w-1 h-full bg-sky-500" />
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                                  <FaBell size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-extrabold text-slate-800">New Request Alert!</h4>
                                  <p className="text-[10px] text-slate-400 font-medium">{req.receivedAt}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded-md bg-green-50 text-green-600 text-[10px] font-bold">New</span>
                                <button 
                                  onClick={(e) => handleDismissRequest(e, req.orderId, req.notificationId)}
                                  className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                  title="Dismiss"
                                >
                                  <FaTimes size={12} />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">👤</div>
                                <p className="text-xs font-bold text-slate-700">From: <span className="text-sky-600">{req.userName}</span></p>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mt-0.5">📍</div>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed flex-1">
                                  {req.addressPreview || req.city || 'Location available on map'}
                                </p>
                              </div>
                            </div>

                            {/* View Request Detail Button */}
                            <button
                              onClick={(e) => handleViewRequestDetail(e, req.orderId)}
                              disabled={loadingDetailId === req.orderId}
                              className="mt-3 w-full py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[11px] flex items-center justify-center gap-1.5 hover:bg-indigo-100 active:scale-95 transition-all disabled:opacity-60"
                            >
                              {loadingDetailId === req.orderId ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                                  </svg>
                                  View Request Detail
                                </>
                              )}
                            </button>

                            <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between gap-2">
                              <div className="flex gap-2 flex-grow">
                                <button 
                                  onClick={(e) => handleAcceptRequestShortcut(e, req)}
                                  className="flex-1 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm active:scale-95 text-center"
                                >
                                  {getTranslatedText("Accept Pickup")}
                                </button>
                                <button 
                                  onClick={(e) => handleRejectRequestShortcut(e, req)}
                                  className="px-3 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-[11px] font-bold transition-all active:scale-95"
                                >
                                  {getTranslatedText("Reject")}
                                </button>
                              </div>
                              <div className="flex items-center gap-1 transition-transform group-hover:translate-x-1 flex-shrink-0">
                                <span className="text-[10px] font-bold text-sky-500">Map</span>
                                <div className="w-5 h-5 rounded-full bg-sky-50 flex items-center justify-center text-sky-500">
                                  <span className="text-sm font-bold leading-none">›</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {!showNotificationDropdown && (
              <>
                <LanguageSelector />
                <button
                  type="button"
                  onClick={() => navigate('/scrapper/profile')}
                  className="focus:outline-none"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow bg-sky-600"
                  >
                    <span className="text-white font-bold text-lg">
                      {(user?.name || 'S')[0].toUpperCase()}
                    </span>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Availability Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between p-4 rounded-xl shadow-md bg-white border border-slate-200"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${isReadyForRequests ? 'animate-pulse bg-sky-500' : 'bg-red-500'}`}
            />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {isReadyForRequests ? getTranslatedText('Available for Pickups') : getTranslatedText('Currently Offline')}
              </p>
              <p className="text-xs text-slate-500">
                {isReadyForRequests ? getTranslatedText('You will receive requests') : getTranslatedText('Turn on to receive requests')}
              </p>
            </div>
          </div>
                  {/* New Toggle Button for Premium Feel (Center Ready Mode) */}
          <div className="flex flex-col items-center justify-center pl-8">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Reception</p>
            <motion.div
              initial={false}
              onClick={handleReceptionToggle}
              className={`w-14 h-7 rounded-full p-1 cursor-pointer flex items-center transition-colors duration-300 ${isReadyForRequests ? 'bg-green-500 shadow-lg shadow-green-500/20' : 'bg-slate-300 shadow-inner'}`}
            >
              <motion.div
                animate={{ x: isReadyForRequests ? 28 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-5 h-5 bg-white rounded-full shadow-lg flex items-center justify-center"
              >
                {isReadyForRequests && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />}
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Live Market Prices - Hidden as per request */}
        {/* <div className="mt-4 relative">
          <PriceTicker />
        </div> */}

        {/* Ad Banners */}
        <div className="mt-4">
          <BannerSlider audience="scrapper" />
        </div>

        {/* Market Price Management Card */}
        {/* Market Price Management Card - Hidden as per request */}
        {/* <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={() => navigate('/scrapper/subscription')}
          className="mt-3 rounded-2xl shadow-md p-4 md:p-5 border border-gray-800 cursor-pointer relative overflow-hidden group"
          style={{ backgroundColor: '#020617' }}
        >
          <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:left-full transition-all duration-1000 ease-in-out"></div>

          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex gap-3">
              <div className="mt-1 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: subscriptionData?.isMarketActive ? 'rgba(14, 165, 233, 0.2)' : 'rgba(148, 163, 184, 0.15)' }}>
                {subscriptionData?.isMarketActive ? (
                  <FaCheck className="text-sky-400" />
                ) : (
                  <FaChartLine className="text-sky-400" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: subscriptionData?.isMarketActive ? '#38bdf8' : '#a5b4fc' }}>
                  {subscriptionData?.isMarketActive ? getTranslatedText("Active Subscription") : getTranslatedText("Market Price Add‑On")}
                </p>
                <h3 className="text-sm md:text-base font-bold mb-1" style={{ color: '#e5e7eb' }}>
                  {subscriptionData?.isMarketActive
                    ? getTranslatedText("You have access to live rates")
                    : getTranslatedText("Unlock real‑time scrap rates")}
                </h3>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                type="button"
                className="mt-1 px-3 py-1.5 rounded-full text-[11px] md:text-xs font-semibold border transition-colors"
                style={{
                  borderColor: subscriptionData?.isMarketActive ? '#38bdf8' : '#4b5563',
                  color: subscriptionData?.isMarketActive ? '#38bdf8' : '#e5e7eb',
                  backgroundColor: subscriptionData?.isMarketActive ? 'rgba(14, 165, 233, 0.1)' : 'transparent'
                }}
              >
                {subscriptionData?.isMarketActive ? getTranslatedText("Manage Plan") : getTranslatedText("View plans")}
              </button>
            </div>
          </div>
        </motion.div> */}
      </div>

      {/* Content */}
      <div className="p-4 pb-24 md:p-6 space-y-3">
        {/* Earnings Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-3 shadow-lg bg-white"
        >
          <h2 className="text-base font-bold mb-2.5 text-slate-800">
            {getTranslatedText("Earnings Summary")}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-white border-2 border-sky-200">
              <p className="text-[10px] font-medium mb-0.5 text-slate-500">{getTranslatedText("Today")}</p>
              <p className="text-lg font-bold text-slate-800">
                ₹{earnings.today.toLocaleString()}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-white border-2 border-sky-200">
              <p className="text-[10px] font-medium mb-0.5 text-slate-500">{getTranslatedText("This Week")}</p>
              <p className="text-lg font-bold text-slate-800">
                ₹{earnings.week.toLocaleString()}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-white border-2 border-sky-200">
              <p className="text-[10px] font-medium mb-0.5 text-slate-500">{getTranslatedText("This Month")}</p>
              <p className="text-lg font-bold text-slate-800">
                ₹{earnings.month.toLocaleString()}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-white border-2 border-sky-200">
              <p className="text-[10px] font-medium mb-0.5 text-slate-500">{getTranslatedText("Total")}</p>
              <p className="text-lg font-bold text-slate-800">
                ₹{earnings.total.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>



        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-3 shadow-lg bg-white"
        >
          <h2 className="text-base font-bold mb-2.5 text-slate-800">
            {getTranslatedText("Quick Stats")}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-white border-2 border-sky-200">
              <p className="text-xl font-bold mb-0.5 text-slate-800">
                {stats.completedPickups}
              </p>
              <p className="text-[10px] font-medium text-slate-500">{getTranslatedText("Completed")}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-white border-2 border-amber-200">
              <div className="flex items-center justify-center gap-0.5 mb-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#fbbf24" />
                </svg>
                <p className="text-xl font-bold text-slate-800">
                  {stats.rating}
                </p>
              </div>
              <p className="text-[10px] font-medium text-slate-500">{getTranslatedText("Rating")}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-white border-2 border-slate-200">
              <p className="text-xl font-bold mb-0.5 text-slate-800">
                {stats.activeRequests}
              </p>
              <p className="text-[10px] font-medium text-slate-500">{getTranslatedText("Active")}</p>
            </div>
          </div>
        </motion.div>



        {/* Bottom Navigation for Mobile */}
        <div className="md:hidden">
          <ScrapperBottomNav />
        </div>

        {/* Scrapper Solutions Section */}
        <div className="px-2">
          <ScrapperSolutions />
        </div>

        {/* Targeted B2B Requests (For Big Scrappers) */}
        {['big', 'wholesaler', 'dukandaar'].includes(user?.scrapperType) && targetedRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 shadow-lg bg-sky-900 text-white border border-sky-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <h2 className="text-lg font-bold">Direct B2B Requests</h2>
              </div>
              <span className="bg-sky-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                New
              </span>
            </div>
            <div className="space-y-3">
              {targetedRequests.slice(0, 2).map((req) => (
                <div
                  key={req._id}
                  onClick={() => navigate(`/scrapper/active-requests`, { state: { filter: 'targeted' } })}
                  className="p-3 rounded-xl bg-sky-800/50 border border-sky-700/50 flex items-center justify-between gap-3 cursor-pointer hover:bg-sky-800 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{req.user?.name || 'Retailer'}</p>
                    <p className="text-[10px] text-sky-300 font-medium">Approx. {req.totalWeight}kg • {req.scrapItems?.map(i => i.category).join(', ')}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-xs font-bold text-sky-400">View Detail</p>
                    <p className="text-[10px] text-sky-300">Targeted to you</p>
                  </div>
                </div>
              ))}
              {targetedRequests.length > 2 && (
                <button
                  onClick={() => navigate('/scrapper/active-requests', { state: { filter: 'targeted' } })}
                  className="w-full text-center text-[11px] font-bold text-sky-300 py-1"
                >
                  +{targetedRequests.length - 2} more targeted requests
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Active Requests List */}
        {
          activeRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-2xl p-4 md:p-6 shadow-lg bg-white border border-slate-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-bold text-slate-800">
                  {getTranslatedText("Active Requests")}
                </h2>
                <button
                  onClick={() => navigate('/scrapper/my-active-requests')}
                  className="text-xs md:text-sm font-semibold px-3 py-1.5 rounded-full transition-colors bg-sky-50 text-sky-700 hover:bg-sky-100"
                >
                  {getTranslatedText("View All")}
                </button>
              </div>
              <div className="space-y-3">
                {activeRequests.slice(0, 3).map((request, index) => {
                  const statusColors = {
                    accepted: { bg: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', label: getTranslatedText('Accepted') },
                    on_way: { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', label: getTranslatedText('On the Way') },
                    arrived: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', label: getTranslatedText('Reached') },
                    picked_up: { bg: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04', label: getTranslatedText('Picked Up') },
                    payment_pending: { bg: 'rgba(249, 115, 22, 0.1)', color: '#f97316', label: getTranslatedText('Payment Pending') }
                  };
                  const statusConfig = statusColors[request.status] || statusColors.accepted;
                  const pickupTime = request.pickupSlot
                    ? `${getTranslatedText(request.pickupSlot.dayName)}, ${request.pickupSlot.date} • ${request.pickupSlot.slot}`
                    : request.preferredTime || getTranslatedText('Time not specified');

                  return (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      onClick={() => navigate(`/scrapper/active-request/${request.id}`, { state: { request }, replace: false })}
                      className="p-3 md:p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md bg-white border-slate-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-sky-100">
                              <span className="text-xs font-bold text-sky-600">
                                {request.userName?.[0]?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate text-slate-800">
                                {request.userName || getTranslatedText('Unknown User')}
                              </p>
                              <p className="text-xs truncate text-slate-500">
                                {getTranslatedText(request.scrapType || 'Scrap')}
                              </p>
                            </div>
                          </div>
                          <div className="ml-10 space-y-1">
                            {request.location?.address && (
                              <div className="flex items-center gap-1">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-slate-500 flex-shrink-0">
                                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" />
                                </svg>
                                <p className="text-xs truncate text-slate-500">
                                  {request.location.address}
                                </p>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-slate-400 flex-shrink-0">
                                <path d="M8 2v2M16 2v2M5 7h14M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <p className="text-xs truncate text-slate-400">
                                {pickupTime}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold mb-1" style={{ color: '#38bdf8' }}>
                            {request.estimatedEarnings || '₹0'}
                          </p>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                            style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              {activeRequests.length > 3 && (
                <button
                  onClick={() => navigate('/scrapper/my-active-requests')}
                  className="w-full mt-3 py-2 rounded-lg text-sm font-semibold transition-colors bg-sky-500/10 text-sky-700"
                >
                  {activeRequests.length - 3 > 1
                    ? getTranslatedText("View {count} more requests", { count: activeRequests.length - 3 })
                    : getTranslatedText("View {count} more request", { count: activeRequests.length - 3 })}
                </button>
              )}
            </motion.div>
          )
        }

        {/* Subscription Status - Only show if KYC is verified AND subscription is active (from backend) */}
        {
          (() => {
            // Use backend data (state) instead of localStorage
            // Only show subscription card if KYC is verified from backend
            if (!kycStatus || kycStatus !== 'verified') {
              return null;
            }

            // Check subscription from backend data
            if (!subscriptionData || subscriptionData.status !== 'active') {
              return null;
            }

            // Check if subscription is not expired
            const expiryDate = subscriptionData.expiryDate ? new Date(subscriptionData.expiryDate) : null;
            const now = new Date();

            if (!expiryDate || expiryDate <= now) {
              return null;
            }

            // Subscription is active and not expired - show card
            const formattedDate = expiryDate.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl p-4 md:p-6 shadow-lg bg-black border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base md:text-lg font-bold mb-1 text-white">
                      {getTranslatedText("Subscription Status")}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-400">
                      {getTranslatedText("Active until {date}", { date: formattedDate })}
                    </p>
                  </div>
                  <div className="px-4 py-2 rounded-full bg-sky-500/10">
                    <p className="text-xs md:text-sm font-semibold text-sky-500">
                      {getTranslatedText("Active")}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })()
        }

        {/* Recent Activity (Completed Orders History) */}
        {
          completedOrders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl p-3.5 shadow-lg bg-black border border-white/10"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-white">
                  {getTranslatedText("Recent Activity")}
                </h2>
                <button
                  onClick={() => navigate('/scrapper/earnings')}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors bg-zinc-800 text-sky-400 hover:bg-zinc-700"
                >
                  {getTranslatedText("View Earnings")}
                </button>
              </div>
              <div className="space-y-2.5">
                {completedOrders.slice(0, 5).map((order, index) => {
                  const date = new Date(order.completedAt || order.createdAt);

                  return (
                    <motion.div
                      key={order.id || order.orderId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="p-3 rounded-xl border flex items-center justify-between bg-zinc-950 border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-sky-900/20"
                        >
                          <span className="text-sm font-bold text-sky-500">
                            ✓
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {getTranslatedText(order.scrapType || 'Scrap Pickup')}
                          </p>
                          <p className="text-xs text-gray-400">
                            {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • from {order.userName || getTranslatedText('User')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-sky-400">
                          ₹{order.amount || order.totalAmount || 0}
                        </p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-semibold">
                          {getTranslatedText("Completed")}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )
        }

        {/* Refer & Earn Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-2xl p-3.5 shadow-lg cursor-pointer bg-black border border-white/10"
          onClick={() => navigate('/scrapper/refer')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center bg-sky-900/20"
              >
                <FaGift className="text-xl text-sky-500" />
              </div>
              <div>
                <h3 className="text-base font-bold mb-0.5 text-white">
                  {getTranslatedText("Refer & Earn")}
                </h3>
                <p className="text-xs text-gray-400">
                  {getTranslatedText("Invite scrappers and earn rewards")}
                </p>
              </div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </motion.div>

        {/* Orders History - Full Width */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 px-4">
            <h2 className="text-lg font-bold text-slate-800">
              {getTranslatedText("Orders History")}
            </h2>
            {completedOrders.length > 0 && (
              <span className="text-xs px-3 py-1 rounded-full bg-sky-100 text-sky-700">
                {completedOrders.length} {completedOrders.length === 1 ? getTranslatedText('order') : getTranslatedText('orders')}
              </span>
            )}
          </div>

          {completedOrders.length === 0 ? (
            <div className="text-center py-8 md:py-12 bg-white mx-4 rounded-xl border border-dashed border-slate-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-sky-100">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 17h14l-1-7H6l-1 7z" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <circle cx="7" cy="19" r="1.5" fill="#0ea5e9" />
                  <circle cx="17" cy="19" r="1.5" fill="#0ea5e9" />
                  <path d="M3 12h18" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-base md:text-lg font-bold mb-2 text-slate-800">
                {getTranslatedText("No Completed Orders Yet")}
              </h3>
              <p className="text-sm md:text-base text-slate-500">
                {getTranslatedText("Your completed orders will appear here")}
              </p>
            </div>
          ) : (
            <div className="bg-white border-y-2 border-sky-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
              {completedOrders.map((order, index) => {
                const completedDate = order.completedAt ? new Date(order.completedAt) : null;
                const formattedDate = completedDate
                  ? completedDate.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                  : 'Date not available';

                const amount = order.amount !== undefined ? order.amount : 0;
                const amountValue = amount;

                return (
                  <div key={order.id || order.orderId || index}>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-sky-100 text-sky-600">
                              <span className="text-xs font-bold">
                                {order.userName?.[0]?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate text-slate-800">
                                {order.userName || getTranslatedText('Unknown User')}
                              </p>
                              <p className="text-xs truncate text-slate-500">
                                {order.orderId || order.id || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="ml-10 space-y-1">
                            <p className="text-xs font-medium text-slate-800">
                              {getTranslatedText(order.scrapType || 'Scrap')}
                            </p>
                            {order.location?.address && (
                              <div className="flex items-center gap-1">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-slate-400 flex-shrink-0">
                                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" />
                                </svg>
                                <p className="text-xs truncate text-slate-500">
                                  {order.location.address}
                                </p>
                              </div>
                            )}
                            {/* Scrap Images */}
                            {order.images && order.images.length > 0 && (
                              <div className="mt-2">
                                <div className="flex gap-1.5">
                                  {order.images.slice(0, 4).map((image, imgIdx) => (
                                    <div
                                      key={image.id || imgIdx}
                                      className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-sky-50"
                                    >
                                      <img
                                        src={image.preview || image}
                                        alt={`Scrap ${imgIdx + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.src = 'https://via.placeholder.com/48?text=Scrap';
                                        }}
                                      />
                                    </div>
                                  ))}
                                  {order.images.length > 4 && (
                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-sky-100">
                                      <span className="text-xs font-bold text-sky-600">
                                        +{order.images.length - 4}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-base font-bold mb-1 text-slate-800">
                            {`₹${amountValue}`}
                          </p>
                          <div className="flex items-center justify-end gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-sky-600">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="text-xs font-semibold text-sky-600">
                              {getTranslatedText("Completed")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <p className="text-xs text-slate-500">
                          {getTranslatedText("Completed on:")} {formattedDate}
                        </p>
                      </div>
                    </div>
                    {index < completedOrders.length - 1 && (
                      <div className="border-b border-slate-200" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div >

      {/* ========== Request Detail Bottom Sheet Modal ========== */}
      <AnimatePresence>
        {detailOrder && (() => {
          const o = detailOrder;
          const orderId = o._id || o.id;
          const reqId = `REQ-${orderId.toString().slice(-6).toUpperCase()}`;

          return (
            <>
              {/* Backdrop */}
              <motion.div
                key="detail-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-[99999]"
                onClick={() => setDetailOrder(null)}
              />

              {/* Bottom Sheet */}
              <motion.div
                key="detail-sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed inset-x-0 bottom-0 z-[100000] bg-white rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl"
              >
                {/* Handle Bar */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-gray-300" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Request Detail</h2>
                    <p className="text-[11px] text-gray-400">{reqId}</p>
                  </div>
                  <button
                    onClick={() => setDetailOrder(null)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-left">

                  {/* Customer Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-700 font-bold text-base">
                        {(o.user?.name || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{o.user?.name || 'Customer'}</p>
                      <p className="text-xs text-gray-400">{o.user?.phone || ''}</p>
                    </div>
                    <div className="text-right">
                      {o.isDonation ? (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-bold">🎁 Donation</span>
                      ) : (
                        <p className="font-bold text-emerald-600 text-lg">₹{o.totalAmount || 0}</p>
                      )}
                    </div>
                  </div>

                  {/* ---- Scrap Items Detail ---- */}
                  <div className="bg-gray-50 rounded-2xl p-3.5">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2.5">📦 Items Detail</h3>
                    <div className="space-y-2.5">
                      {Array.isArray(o.scrapItems) && o.scrapItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100">
                          {/* Item Icon */}
                          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                            <span className="text-base">
                              {item.category === 'plastic' ? '♻️' :
                               item.category === 'metal' ? '🔩' :
                               item.category === 'paper' || item.category === 'raddi' ? '📄' :
                               item.category === 'electronic' || item.category === 'e_waste' ? '💻' :
                               item.category === 'glass' ? '🪟' :
                               item.category === 'furniture' ? '🪑' :
                               item.category === 'vehicle_scrap' ? '🚗' :
                               item.category === 'home_appliance' ? '🏠' :
                               item.category === 'scrap_iron' ? '⚙️' : '📦'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm truncate">
                              {item.name || capitalizeFirst(item.category)}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.pricingType === 'negotiable' ? (
                                <span className="text-[11px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded font-medium">🤝 Negotiable</span>
                              ) : (
                                <>
                                  {item.weight > 0 && (
                                    <span className="text-[11px] text-gray-400">{item.weight} kg</span>
                                  )}
                                  {item.rate > 0 && (
                                    <span className="text-[11px] text-gray-400">@ ₹{item.rate}/kg</span>
                                  )}
                                </>
                              )}
                              {item.itemCondition && (
                                <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                                  item.itemCondition === 'good' ? 'bg-green-50 text-green-700' :
                                  item.itemCondition === 'average' ? 'bg-yellow-50 text-yellow-700' :
                                  'bg-red-50 text-red-700'
                                }`}>
                                  {capitalizeFirst(item.itemCondition)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {item.pricingType === 'negotiable' ? (
                              <p className="text-sm font-bold text-amber-600">
                                {item.expectedPrice ? `₹${item.expectedPrice}` : '—'}
                              </p>
                            ) : (
                              <p className="text-sm font-bold text-emerald-600">₹{item.total || 0}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total row */}
                    {!o.isDonation && (
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-200">
                        <span className="text-xs font-bold text-gray-600 uppercase">Total Amount</span>
                        <span className="text-base font-extrabold text-emerald-600">₹{o.totalAmount || 0}</span>
                      </div>
                    )}
                  </div>

                  {/* ---- Photos ---- */}
                  {Array.isArray(o.images) && o.images.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">📷 Photos</h3>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {o.images.map((img, idx) => (
                          <div key={idx} className="flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                            <img
                              src={img.url}
                              alt={`Scrap photo ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ---- Pickup Info ---- */}
                  <div className="bg-gray-50 rounded-2xl p-3.5 space-y-2.5">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">📍 Pickup Info</h3>
                    {/* Address */}
                    <div className="flex items-start gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-red-400 mt-0.5 flex-shrink-0">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" />
                      </svg>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {(() => {
                          if (!o.pickupAddress) return 'Location not available';
                          const parts = [o.pickupAddress.street, o.pickupAddress.city].filter(Boolean);
                          return parts.join(', ') || 'Location on Map';
                        })()}
                        {o.pickupAddress?.state && `, ${o.pickupAddress.state}`}
                        {o.pickupAddress?.pincode && ` - ${o.pickupAddress.pincode}`}
                      </p>
                    </div>
                    {/* Time */}
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-blue-400 flex-shrink-0">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <p className="text-xs text-gray-700">
                        {o.pickupSlot
                          ? `${o.pickupSlot.dayName || ''} ${o.pickupSlot.date || ''} • ${o.pickupSlot.slot || ''}`.trim()
                          : o.preferredTime || 'Time not specified'}
                      </p>
                    </div>
                    {/* Quantity Type */}
                    {o.quantityType && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📏</span>
                        <p className="text-xs text-gray-700">Quantity: <span className="font-semibold capitalize">{o.quantityType}</span></p>
                      </div>
                    )}
                  </div>

                  {/* ---- Notes ---- */}
                  {o.notes && o.notes.trim() && (
                    <div className="bg-yellow-50 rounded-2xl p-3.5 border border-yellow-100">
                      <h3 className="text-xs font-bold text-yellow-700 uppercase tracking-wide mb-1">📝 Notes</h3>
                      <p className="text-xs text-yellow-800 leading-relaxed">{o.notes}</p>
                    </div>
                  )}
                </div>

                {/* Bottom Action */}
                <div className="px-5 py-4 border-t border-gray-100 bg-white flex gap-3">
                  <button
                    onClick={() => {
                      const oid = o._id || o.id;
                      // Accept directly via scrapperOrdersAPI (since we're already viewing it)
                      // First close the modal and then accept. Notification from socket should hit but we'll manually route.
                      setDetailOrder(null);
                      
                      // Using accept logic
                      scrapperOrdersAPI.accept(oid).then(res => {
                          if(res.success || res.order) {
                              dismissRequestLocally(oid);
                              setShowNotificationDropdown(false);
                              navigate(`/scrapper/my-active-requests`);
                          }
                      }).catch((err) => {
                          console.error(err);
                          alert(err.message || 'Failed to accept order');
                      });
                    }}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Accept Pickup
                  </button>
                  <button
                    onClick={() => {
                      const oid = o._id || o.id;
                      setDetailOrder(null);
                      // Clear the active dropdown and navigate to map
                      setShowNotificationDropdown(false);
                      navigate(`/scrapper/active-requests?highlight=${oid}`);
                    }}
                    className="flex-1 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-100 active:scale-95 transition-all"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-10l6 3m0 10l4.553 2.276A1 1 0 0021 21.382V10.618a1 1 0 00-.553-.894L15 7m0 13V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    View Map
                  </button>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

    </motion.div >
  );
};

export default ScrapperDashboard;

