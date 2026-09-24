import { useAuth } from '../shared/context/AuthContext';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ScrapperLogin from './components/ScrapperLogin';
import ScrapperDashboard from './components/ScrapperDashboard';
import KYCUploadPage from './components/KYCUploadPage';
import KYCStatusPage from './components/KYCStatusPage';
import SubscriptionPlanPage from './components/SubscriptionPlanPage';
import ActiveRequestsPage from './components/ActiveRequestsPage';
import ActiveRequestDetailsPage from './components/ActiveRequestDetailsPage';
import RequestManagementPage from './components/RequestManagementPage';
import RequestListPage from './components/RequestListPage';
import ReferAndEarn from './components/ReferAndEarn';
import ScrapperHelpSupport from './components/ScrapperHelpSupport';
import ScrapperProfile from './components/ScrapperProfile';
import ScrapperTerms from './components/ScrapperTerms';
import ChatPage from './components/ChatPage';
import ChatListPage from './components/ChatListPage';
import ScrapperWallet from './components/ScrapperWallet';
import ScrapperEarningsPage from './components/ScrapperEarningsPage';
import SellScrapPage from './components/SellScrapPage';
import ScrapperCategoryListPage from './components/ScrapperCategoryListPage';
import ScrapperPartnerListPage from './components/ScrapperPartnerListPage';
import MySentRequestsPage from './components/MySentRequestsPage';
import SentRequestStatusPage from './components/SentRequestStatusPage';
import { authAPI } from '../shared/utils/api';
import { FaHome, FaList, FaRegComments, FaUser, FaWallet } from 'react-icons/fa';
import WebViewHeader from '../shared/components/WebViewHeader';

// Helper function to check KYC status
const getKYCStatus = () => {
  const kycStatus = localStorage.getItem('scrapperKYCStatus');
  const kycData = localStorage.getItem('scrapperKYC');

  if (!kycData && kycStatus !== 'skipped') return 'not_submitted';
  if (kycStatus === 'skipped') return 'skipped';
  if (kycStatus === 'verified') return 'verified';
  if (kycStatus === 'pending') return 'pending';
  if (kycStatus === 'rejected') return 'rejected';
  if (kycStatus === 'resend_required') return 'resend_required';
  return 'not_submitted';
};

// Helper function to check subscription status
const getSubscriptionStatus = () => {
  const subscriptionStatus = localStorage.getItem('scrapperSubscriptionStatus');
  const subscriptionData = localStorage.getItem('scrapperSubscription');

  if (!subscriptionData || !subscriptionStatus) return 'not_subscribed';
  if (subscriptionStatus === 'active') {
    const sub = JSON.parse(subscriptionData);
    const expiryDate = new Date(sub.expiryDate);
    const now = new Date();
    if (expiryDate > now) {
      return 'active';
    } else {
      return 'expired';
    }
  }
  return 'not_subscribed';
};

// Guard: redirect to KYC/subscription if not allowed; else render children (Option B – protect all app panels)
const RequireKycAndSubscription = ({ children }) => {
  const kycStatus = getKYCStatus();
  const subscriptionStatus = getSubscriptionStatus();
  if (kycStatus === 'not_submitted' || kycStatus === 'rejected' || kycStatus === 'resend_required') {
    return <Navigate to="/scrapper/kyc" replace />;
  }
  if (kycStatus === 'pending') {
    return <Navigate to="/scrapper/kyc-status" replace />;
  }
  if (kycStatus === 'verified' && subscriptionStatus !== 'active') {
    return <Navigate to="/scrapper/subscription" replace />;
  }
  return children; // allows 'skipped' to pass through to dashboard
};

const ScrapperModule = () => {
  const { isAuthenticated, user, login, logout } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [scrapperIsAuthenticated, setScrapperIsAuthenticated] = useState(false);

  // Verify authentication - re-check when isAuthenticated or user changes
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    const verifyScrapperAuth = async () => {
      const token = localStorage.getItem('token');
      const scrapperAuth = localStorage.getItem('scrapperAuthenticated');
      const scrapperUser = localStorage.getItem('scrapperUser');

      // If no token or scrapper flags, not authenticated
      if (!token || scrapperAuth !== 'true' || !scrapperUser) {
        if (isMounted) {
          setScrapperIsAuthenticated(false);
          setIsVerifying(false);
        }
        return;
      }

      // If we already have authenticated user from context and it's a scrapper, use it
      if (isAuthenticated && user && user.role === 'scrapper') {
        if (isMounted) {
          setScrapperIsAuthenticated(true);
          setIsVerifying(false);
        }
        return;
      }

      setIsVerifying(true);

      try {
        // Verify token with backend
        const response = await authAPI.getMe();

        if (!isMounted) return;

        if (response.success && response.data?.user) {
          const userData = response.data.user;

          // Check if user has scrapper role
          if (userData.role === 'scrapper') {
            // Update auth context if needed
            if (!isAuthenticated || !user) {
              login(userData, token);
            }

            // Update scrapper-specific localStorage
            localStorage.setItem('scrapperAuthenticated', 'true');
            localStorage.setItem('scrapperUser', JSON.stringify(userData));

            // Sync KYC and Subscription status if available in userData
            if (response.data.scrapper) {
              const scr = response.data.scrapper;
              if (scr.kyc) {
                localStorage.setItem('scrapperKYCStatus', scr.kyc.status || 'pending');
                localStorage.setItem('scrapperKYC', JSON.stringify(scr.kyc));
              }
              if (scr.subscription) {
                localStorage.setItem('scrapperSubscriptionStatus', scr.subscription.status || 'expired');
                localStorage.setItem('scrapperSubscription', JSON.stringify(scr.subscription));
              }
            }

            // Check if scrapper is blocked
            const scrapperStatus = localStorage.getItem('scrapperStatus') || 'active';
            if (scrapperStatus === 'blocked') {
              setScrapperIsAuthenticated(false);
              logout();
              localStorage.removeItem('scrapperAuthenticated');
              localStorage.removeItem('scrapperUser');
            } else {
              setScrapperIsAuthenticated(true);
            }
          } else {
            // User doesn't have scrapper role
            console.warn('User does not have scrapper role:', userData.role);
            setScrapperIsAuthenticated(false);
            logout();
            localStorage.removeItem('scrapperAuthenticated');
            localStorage.removeItem('scrapperUser');
          }
        } else {
          // Token invalid
          setScrapperIsAuthenticated(false);
          logout();
          localStorage.removeItem('scrapperAuthenticated');
          localStorage.removeItem('scrapperUser');
        }
      } catch (error) {
        if (!isMounted) return;

        console.error('Auth verification failed:', error);
        // On 401, clear everything
        if (error.status === 401) {
          setScrapperIsAuthenticated(false);
          logout();
          localStorage.removeItem('scrapperAuthenticated');
          localStorage.removeItem('scrapperUser');
        } else {
          // For other errors, check localStorage as fallback
          const scrapperAuth = localStorage.getItem('scrapperAuthenticated');
          const scrapperUser = localStorage.getItem('scrapperUser');
          const scrapperStatus = localStorage.getItem('scrapperStatus') || 'active';
          setScrapperIsAuthenticated(
            scrapperAuth === 'true' &&
            scrapperUser !== null &&
            scrapperStatus !== 'blocked'
          );
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    };

    // Add a small delay to allow login to complete
    timeoutId = setTimeout(() => {
      verifyScrapperAuth();
    }, 100);

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAuthenticated, user, login, logout]); // Re-check when auth state changes

  const kycStatus = scrapperIsAuthenticated ? getKYCStatus() : 'not_submitted';
  const subscriptionStatus = scrapperIsAuthenticated && kycStatus === 'verified' ? getSubscriptionStatus() : 'not_subscribed';

  // Show loading while verifying (but allow navigation if we have token and user)
  const hasToken = !!localStorage.getItem('token');
  const hasScrapperAuth = localStorage.getItem('scrapperAuthenticated') === 'true';

  if (isVerifying && hasToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated as scrapper, show login / public routes
  // But check if we're in the process of logging in (has token but not yet verified)
  if (!scrapperIsAuthenticated && (!hasToken || !hasScrapperAuth)) {
    return (
      <Routes>
        {/* Public routes (no scrapper auth required) */}
        <Route path="/login" element={<ScrapperLogin />} />
        <Route path="/register" element={<ScrapperLogin isRegisterMode={true} />} />
        <Route path="/kyc" element={<KYCUploadPage />} />
        <Route path="/terms" element={<ScrapperTerms />} />

        {/* Default redirect to login */}
        <Route path="/" element={<Navigate to="/scrapper/login" replace />} />
        {/* Catch all other routes and redirect to login */}
        <Route path="*" element={<Navigate to="/scrapper/login" replace />} />
      </Routes>
    );
  }

  // If authenticated, check KYC status and route accordingly
  // Always register all routes, but use Navigate for redirects

  const navItems = [
    { label: 'Dashboard', path: '/scrapper/dashboard', icon: FaHome },
    { label: 'Active Requests', path: '/scrapper/active-requests', icon: FaList },
    { label: 'Chats', path: '/scrapper/chats', icon: FaRegComments },
    { label: 'Wallet', path: '/scrapper/wallet', icon: FaWallet }, // Added Wallet Option
    { label: 'Profile', path: '/scrapper/profile', icon: FaUser },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50">
      <WebViewHeader navItems={navItems} userRole="scrapper" />
      <Routes>
        {/* KYC Upload Route */}
        <Route path="/kyc" element={<KYCUploadPage />} />

        {/* KYC Status Route */}
        <Route path="/kyc-status" element={<KYCStatusPage />} />

        {/* Subscription Plan Route */}
        <Route path="/subscription" element={<SubscriptionPlanPage />} />

        {/* Protected routes – require KYC verified + subscription active (Option B guard) */}
        <Route path="/" element={<RequireKycAndSubscription><ScrapperDashboard /></RequireKycAndSubscription>} />
        <Route path="/dashboard" element={<RequireKycAndSubscription><ScrapperDashboard /></RequireKycAndSubscription>} />
        <Route path="/active-requests" element={<RequireKycAndSubscription><ActiveRequestsPage /></RequireKycAndSubscription>} />
        <Route path="/request-list" element={<RequireKycAndSubscription><RequestListPage /></RequireKycAndSubscription>} />
        <Route path="/my-active-requests" element={<RequireKycAndSubscription><RequestManagementPage /></RequireKycAndSubscription>} />
        <Route path="/active-request/:requestId" element={<RequireKycAndSubscription><ActiveRequestDetailsPage /></RequireKycAndSubscription>} />
        <Route path="/help" element={<RequireKycAndSubscription><ScrapperHelpSupport /></RequireKycAndSubscription>} />
        <Route path="/profile" element={<RequireKycAndSubscription><ScrapperProfile /></RequireKycAndSubscription>} />
        <Route path="/terms" element={<ScrapperTerms />} />
        <Route path="/refer" element={<RequireKycAndSubscription><ReferAndEarn /></RequireKycAndSubscription>} />
        <Route path="/chats" element={<RequireKycAndSubscription><ChatListPage /></RequireKycAndSubscription>} />
        <Route path="/chat/:chatId" element={<RequireKycAndSubscription><ChatPage /></RequireKycAndSubscription>} />
        <Route path="/chat" element={<RequireKycAndSubscription><ChatPage /></RequireKycAndSubscription>} />
        <Route path="/wallet" element={<RequireKycAndSubscription><ScrapperWallet /></RequireKycAndSubscription>} />
        <Route path="/earnings" element={<RequireKycAndSubscription><ScrapperEarningsPage /></RequireKycAndSubscription>} />
        <Route path="/sell-scrap" element={<RequireKycAndSubscription><SellScrapPage /></RequireKycAndSubscription>} />
        <Route path="/sell-scrap/categories" element={<RequireKycAndSubscription><ScrapperCategoryListPage /></RequireKycAndSubscription>} />
        <Route path="/sell-scrap/partners" element={<RequireKycAndSubscription><ScrapperPartnerListPage /></RequireKycAndSubscription>} />
        <Route path="/my-sent-requests" element={<RequireKycAndSubscription><MySentRequestsPage /></RequireKycAndSubscription>} />
        <Route path="/sent-request-status/:orderId" element={<RequireKycAndSubscription><SentRequestStatusPage /></RequireKycAndSubscription>} />

        {/* Redirect logic based on KYC and Subscription status */}
        <Route path="*" element={
          kycStatus === 'not_submitted' ? (
            <Navigate to="/scrapper/kyc" replace />
          ) : kycStatus === 'rejected' ? (
            <Navigate to="/scrapper/kyc" replace />
          ) : kycStatus === 'resend_required' ? (
            <Navigate to="/scrapper/kyc" replace />
          ) : kycStatus === 'pending' ? (
            <Navigate to="/scrapper/kyc-status" replace />
          ) : kycStatus === 'verified' && subscriptionStatus !== 'active' ? (
            <Navigate to="/scrapper/subscription" replace />
          ) : (kycStatus === 'verified' && subscriptionStatus === 'active') || kycStatus === 'skipped' ? (
            <Navigate to="/scrapper" replace />
          ) : (
            <Navigate to="/scrapper/kyc" replace />
          )
        } />
      </Routes>
    </div>
  );
};

export default ScrapperModule;

