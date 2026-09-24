import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { kycAPI, subscriptionAPI, reviewAPI, scrapperProfileAPI, earningsAPI } from '../../shared/utils/api';
import RatingDisplay from '../../shared/components/RatingDisplay';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import EditProfileModal from './EditProfileModal';
import ScrapperBottomNav from './ScrapperBottomNav';

const ScrapperProfile = () => {
  const staticTexts = [
    "Loading profile...",
    "Scrapper Profile",
    "Close",
    "Scrapper",
    "Phone not set",
    "Logout",
    "Verified",
    "Pending",
    "Rejected",
    "Not Submitted",
    "No subscription",
    "{planName} active",
    "Vehicle not set",
    "Profile details",
    "Edit profile",
    "Name",
    "Phone",
    "Vehicle",
    "Vehicle photo",
    "Not provided",
    "Heard about Junkar",
    "Profile editing will be available soon.",
    "KYC status",
    "View",
    "Subscription",
    "{planName} • ₹{price}/month",
    "No active subscription",
    "Manage",
    "Active requests",
    "View and manage current pickups",
    "Earnings & history",
    "Check completed pickups and payouts",
    "Refer & Earn",
    "Share your code and earn extra on pickups",
    "Terms & Conditions",
    "Read how Junkar works for scrappers",
    "Terms & Conditions screen will be added later.",
    "Help & Support",
    "Get help for any issue",
    "My Scrap Statistics",
    "Total Weight Purchased",
    "Category-wise Breakdown",
    "No scrap purchased yet",
    "Weight",
    "Fixed Price",
    "Negotiable",
    "Donate",
    "Delete Account",
    "Are you sure you want to completely delete your account? This action cannot be undone and all your details will be wiped out forever."
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [kycStatus, setKycStatus] = useState('not_submitted');
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scrapperUser, setScrapperUser] = useState(user);
  const [rating, setRating] = useState({ average: 0, count: 0, breakdown: null });
  const [showKycInfo, setShowKycInfo] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [scrapStats, setScrapStats] = useState({ totalWeight: 0, categoryStats: [] });
  const [showStats, setShowStats] = useState(false);
  const [showCategoryRequestModal, setShowCategoryRequestModal] = useState(false);
  const [categoryRequestText, setCategoryRequestText] = useState('');
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const handleSendCategoryRequest = async () => {
    if (!categoryRequestText.trim()) return;
    setIsSendingRequest(true);
    try {
      const res = await scrapperProfileAPI.requestNewCategory(categoryRequestText);
      if (res.success) {
        alert("Request sent successfully!");
        setShowCategoryRequestModal(false);
        setCategoryRequestText('');
      } else {
        alert(res.error || "Failed to send request.");
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "Error sending request.");
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleProfileUpdate = (updatedScrapper) => {
    // 1. Update local state
    setScrapperUser(prev => ({
      ...prev,
      ...updatedScrapper
    }));

    // 2. Update LocalStorage (so Navbar/Header updates immediately on refresh/reload)
    // Merge with existing user data in storage to avoid losing irrelevant keys
    try {
      const storedUser = JSON.parse(localStorage.getItem('scrapperUser') || '{}');
      const newStoredUser = { ...storedUser, ...updatedScrapper };
      localStorage.setItem('scrapperUser', JSON.stringify(newStoredUser));
    } catch (e) {
      console.error("Local storage update error", e);
    }

    // 3. Close Modal
    setIsEditModalOpen(false);
  };

  useEffect(() => {
    const fetchScrapperData = async () => {
      try {
        setLoading(true);

        // Verify authentication
        if (!user || user.role !== 'scrapper') {
          navigate('/scrapper/login', { replace: true });
          return;
        }

        setScrapperUser(user);

        // Fetch KYC status from API
        try {
          const kycResponse = await kycAPI.getMy();
          if (kycResponse.success && kycResponse.data?.kyc) {
            setKycStatus(kycResponse.data.kyc.status || 'not_submitted');
          }
        } catch (kycError) {
          console.error('Error fetching KYC:', kycError);
          setKycStatus('not_submitted');
        }

        // Fetch subscription status from API
        try {
          const subResponse = await subscriptionAPI.getMySubscription();
          if (subResponse.success && subResponse.data?.subscription) {
            const sub = subResponse.data.subscription;
            setSubscription({
              status: sub.status,
              planId: sub.planId?._id || sub.planId,
              planName: sub.planId?.name || 'Unknown Plan',
              price: sub.planId?.price || 0,
              startDate: sub.startDate,
              expiryDate: sub.expiryDate,
              autoRenew: sub.autoRenew
            });
          }
        } catch (subError) {
          console.error('Error fetching subscription:', subError);
          setSubscription(null);
        }

        // Fetch detailed Scrapper Profile (including ratings)
        try {
          const profileResponse = await scrapperProfileAPI.getMyProfile();
          if (profileResponse.success && profileResponse.data?.scrapper) {
            const scrapperData = profileResponse.data.scrapper;

            // Update scrapper user with more details if needed
            setScrapperUser(prev => ({ ...prev, ...scrapperData }));

            // Set Rating
            if (scrapperData.rating) {
              setRating({
                average: parseFloat(scrapperData.rating.average || 0),
                count: scrapperData.rating.count || 0,
                breakdown: scrapperData.rating.breakdown || null
              });
            }
          }
        } catch (profileError) {
          console.error('Error fetching scrapper profile:', profileError);
        }

        // Fetch Scrap Statistics
        try {
          const statsResponse = await earningsAPI.getScrapStats();
          if (statsResponse.success) {
            setScrapStats({
              totalWeight: statsResponse.data.totalWeight || 0,
              categoryStats: statsResponse.data.categoryStats || []
            });
          }
        } catch (statsError) {
          console.error('Error fetching scrap stats:', statsError);
        }
      } catch (error) {
        console.error('Error fetching scrapper data:', error);
        navigate('/scrapper/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchScrapperData();
  }, [user, navigate]);

  const handleLogout = () => {
    // Clear scrapper flags plus global auth
    localStorage.removeItem('scrapperAuthenticated');
    localStorage.removeItem('scrapperUser');
    logout();
    navigate('/scrapper/login', { replace: true });
  };

  const handleDeleteAccount = async () => {
    const confirmMessage = getTranslatedText("Are you sure you want to completely delete your account? This action cannot be undone and all your details will be wiped out forever.");
    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
      const res = await scrapperProfileAPI.deleteMyAccount();
      if (res.success) {
        handleLogout();
      } else {
        alert("Failed to delete account. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("Error deleting account.");
    } finally {
      setLoading(false);
    }
  };

  const getKycLabel = () => {
    switch (kycStatus) {
      case 'verified':
        return { label: getTranslatedText('Verified'), className: 'bg-sky-100 text-sky-700' };
      case 'pending':
        return { label: getTranslatedText('Pending'), className: 'bg-orange-100 text-orange-700' };
      case 'rejected':
        return { label: getTranslatedText('Rejected'), className: 'bg-red-100 text-red-700' };
      default:
        return { label: getTranslatedText('Not Submitted'), className: 'bg-slate-100 text-slate-500' };
    }
  };

  const kycConfig = getKycLabel();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e0f2fe]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-sky-200 border-t-sky-600 mx-auto mb-4 animate-spin" />
          <p className="text-sky-800 font-medium">{getTranslatedText("Loading profile...")}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pb-20 md:pb-0"
      style={{ background: "linear-gradient(to bottom, #7dd3fc, #e0f2fe)" }}
    >
      {/* Sticky header similar to user profile */}
      <div className="sticky top-0 z-40 px-4 md:px-6 lg:px-8 py-4 md:py-6 bg-white/20 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1
            className="text-xl md:text-2xl font-bold text-white"
          >
            {getTranslatedText("Scrapper Profile")}
          </h1>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Profile header card – align with user profile style */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-4 md:mb-6"
        >
          <div
            className="rounded-2xl p-3.5 shadow-lg backdrop-blur-sm bg-white/95"
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 relative bg-sky-50 border-4 border-sky-200"
              >
                <span
                  className="text-2xl font-bold text-sky-600"
                >
                  {(scrapperUser?.name || 'S')[0].toUpperCase()}
                </span>
              </div>

              {/* Scrapper basic info + badges */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div>
                    <h2
                      className="text-lg font-bold text-slate-800"
                    >
                      {scrapperUser?.name || getTranslatedText('Scrapper')}
                    </h2>
                    <p
                      className="text-sm text-slate-500"
                    >
                      {scrapperUser?.phone || getTranslatedText('Phone not set')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border flex-shrink-0 border-sky-200 text-sky-600 bg-sky-50 hover:bg-sky-100 transition-colors"
                  >
                    {getTranslatedText("Logout")}
                  </button>
                </div>

                {/* Rating Display */}
                {rating.count > 0 && (
                  <div className="mt-2 mb-2">
                    <RatingDisplay
                      averageRating={rating.average}
                      totalReviews={rating.count}
                      breakdown={rating.breakdown}
                      showBreakdown={false}
                      size="sm"
                    />
                  </div>
                )}

                <div className="flex items-center flex-wrap gap-2 mt-2">
                  {/* KYC badge */}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${kycConfig.className}`}
                  >
                    {getTranslatedText("KYC:")} {kycConfig.label}
                  </span>
                  {/* Scrapper Type badge */}
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                    {scrapperUser?.scrapperType === 'feri_wala' ? '🚲 फेरी वाला' : scrapperUser?.scrapperType === 'dukandaar' ? '🏪 दुकानदार' : scrapperUser?.scrapperType === 'wholesaler' ? '🏭 थोक व्यापारी' : scrapperUser?.scrapperType === 'big' ? '🏭 Dealer' : '🚲 Feri Wala'}
                  </span>
                  {/* Subscription badge */}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${subscription ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {subscription ? getTranslatedText("{planName} active", { planName: subscription.planName }) : getTranslatedText('No subscription')}
                  </span>
                  {/* Vehicle info small badge */}
                  <span
                    className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize"
                  >
                    {scrapperUser?.vehicleInfo
                      ? `${scrapperUser.vehicleInfo.type} • ${scrapperUser.vehicleInfo.number || 'NA'}`
                      : getTranslatedText('Vehicle not set')}
                  </span>
                  {/* Jodhpur Trusted Scrap Dealer badge – rating 4.5+ */}
                  {rating.average >= 4.5 && rating.count > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1" style={{ backgroundColor: '#fef3c7', color: '#b45309' }} title="Rating 4.5+">
                      <span aria-hidden>🛡️</span>
                      Jodhpur Trusted Scrap Dealer
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Details + navigation list – follow user profile feel */}
        <div className="space-y-4 md:space-y-5 pb-4 md:pb-8">
          {/* Compact details card */}
          <div className="rounded-xl border border-slate-200 bg-white backdrop-blur-sm p-3.5 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">
                {getTranslatedText("Profile details")}
              </p>
              <button
                type="button"
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200 transition-colors"
                onClick={() => setIsEditModalOpen(true)}
              >
                {getTranslatedText("Edit profile")}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <span className="text-slate-600">{getTranslatedText("Name")}</span>
              <span className="font-semibold text-right text-slate-900">
                {scrapperUser?.name || '-'}
              </span>
              <span className="text-slate-600">{getTranslatedText("Phone")}</span>
              <span className="font-semibold text-right text-slate-900">
                {scrapperUser?.phone || '-'}
              </span>
              <span className="text-slate-600">{getTranslatedText("Vehicle")}</span>
              <span className="font-semibold text-right text-slate-900">
                {scrapperUser?.vehicleInfo
                  ? <span className="capitalize">{scrapperUser.vehicleInfo.type} • {scrapperUser.vehicleInfo.number || 'NA'}</span>
                  : getTranslatedText('Not provided')}
              </span>
              {scrapperUser?.vehicleInfo?.photoUrl && (
                <>
                  <span className="text-slate-600">{getTranslatedText("Vehicle photo")}</span>
                  <span className="text-right min-w-0 flex justify-end">
                    <img
                      src={scrapperUser.vehicleInfo.photoUrl.startsWith('http') ? scrapperUser.vehicleInfo.photoUrl : `${window.location.origin}${scrapperUser.vehicleInfo.photoUrl}`}
                      alt="Vehicle"
                      className="max-w-full max-h-14 w-14 h-14 rounded-lg object-contain border border-slate-200 inline-block"
                    />
                  </span>
                </>
              )}
              {['big', 'dukandaar', 'wholesaler'].includes(scrapperUser?.scrapperType) && scrapperUser?.businessLocation?.address && (
                <>
                  <span className="text-slate-600">{getTranslatedText("Business Address")}</span>
                  <span className="font-semibold text-right text-slate-900">
                    {scrapperUser.businessLocation.address}
                  </span>
                </>
              )}
              {scrapperUser?.heardFrom && (
                <>
                  <span className="text-slate-600">{getTranslatedText("Heard about Junkar")}</span>
                  <span className="font-semibold text-right text-slate-900">
                    {scrapperUser.heardFrom.startsWith('other:')
                      ? scrapperUser.heardFrom.replace('other:', '')
                      : scrapperUser.heardFrom}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* All actions / links in one list */}
          <div className="rounded-xl border border-slate-200 bg-white backdrop-blur-sm divide-y divide-slate-100 shadow-sm">
            {/* KYC status */}
            <div className="flex flex-col border-b border-slate-100 last:border-0">
              <button
                type="button"
                onClick={() => {
                  if (kycStatus === 'not_submitted') {
                    navigate('/scrapper/kyc');
                  } else {
                    setShowKycInfo(!showKycInfo);
                  }
                }}
                className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-slate-50 transition-colors bg-white rounded-t-xl"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {getTranslatedText("KYC status")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {kycConfig.label}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold ${kycConfig.className}`}
                  >
                    {getTranslatedText("View")}
                  </span>
                </div>
              </button>

              {/* Inline KYC Details Card */}
              {showKycInfo && kycStatus !== 'not_submitted' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4 bg-slate-50/50 overflow-hidden"
                >
                  <div className="p-3 mt-1 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">{getTranslatedText("Status")}</span>
                      <span className={`font-bold ${kycConfig.className.replace('bg-', 'text-').split(' ')[1]}`}>
                        {kycConfig.label}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                        {getTranslatedText("Submitted Documents")}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                          {getTranslatedText("Aadhaar Card")}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                          {getTranslatedText("PAN Card")}
                        </div>
                      </div>
                    </div>

                    {kycStatus === 'rejected' && (
                      <button
                        onClick={() => navigate('/scrapper/kyc')}
                        className="w-full mt-2 py-2 text-xs font-semibold bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                      >
                        {getTranslatedText("Resubmit KYC")}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Subscription */}
            <div className="flex flex-col border-b border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/scrapper/subscription')}
                className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {getTranslatedText("Subscription")}
                  </p>
                  <div className="mt-0.5">
                    {subscription ? (
                      <div className="space-y-0.5">
                        <p className="text-xs text-sky-700 font-medium">
                          {subscription.planName} • ₹{subscription.price}/month
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          <p className="text-[10px] text-slate-500">
                            {getTranslatedText("Active from:")} {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : '-'}
                          </p>
                          <p className={`text-[10px] font-semibold ${subscription.status === 'expired' ? 'text-red-500' : 'text-slate-500'}`}>
                            {getTranslatedText("Expires on:")} {subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : '-'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        {getTranslatedText('No active subscription')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {subscription?.status === 'expired' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 border border-red-200">
                      EXPIRED
                    </span>
                  )}
                  <span
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-700"
                  >
                    {getTranslatedText("Manage")}
                  </span>
                </div>
              </button>
            </div>

            {/* Scrap Statistics */}
            <div className="flex flex-col border-b border-slate-100">
              <button
                type="button"
                onClick={() => setShowStats(!showStats)}
                className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {getTranslatedText("My Scrap Statistics")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {getTranslatedText("Total Weight Purchased")}: {scrapStats.totalWeight.toFixed(2)} kg
                  </p>
                </div>
                <span className="text-slate-400 transform transition-transform" style={{ rotate: showStats ? '90deg' : '0deg' }}>
                  ›
                </span>
              </button>

              <AnimatePresence>
                {showStats && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 bg-slate-50/50 overflow-hidden"
                  >
                    <div className="p-3 mt-1 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        {getTranslatedText("Category-wise Breakdown")}
                      </p>
                      {scrapStats.categoryStats.length > 0 ? (
                        <div className="space-y-2">
                          {scrapStats.categoryStats.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-600 font-medium">{getTranslatedText(item.category)}</span>
                                {item.pricingType === 'donate' ? (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-tighter">
                                    {getTranslatedText("Donate")}
                                  </span>
                                ) : item.pricingType === 'negotiable' ? (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-tighter">
                                    {getTranslatedText("Negotiable")}
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-sky-100 text-sky-700 border border-sky-200 uppercase tracking-tighter">
                                    {getTranslatedText("Fixed Price")}
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-slate-800">{item.weight.toFixed(2)} kg</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic text-center py-2">
                          {getTranslatedText("No scrap purchased yet")}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Request for New Category (Dukandaar & Wholesaler only) */}
            {['dukandaar', 'wholesaler'].includes(scrapperUser?.scrapperType) && (
              <div className="flex flex-col border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCategoryRequestModal(!showCategoryRequestModal)}
                  className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Request for New Category
                    </p>
                    <p className="text-xs text-slate-500">
                      Ask admin to add a new scrap category
                    </p>
                  </div>
                  <span className="text-slate-400 transform transition-transform" style={{ rotate: showCategoryRequestModal ? '90deg' : '0deg' }}>
                    ›
                  </span>
                </button>

                <AnimatePresence>
                  {showCategoryRequestModal && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 bg-slate-50/50 overflow-hidden"
                    >
                      <div className="p-3 mt-1 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                        <p className="text-xs text-slate-600 font-medium">Which category do you want to add?</p>
                        <input
                          type="text"
                          value={categoryRequestText}
                          onChange={(e) => setCategoryRequestText(e.target.value)}
                          placeholder="e.g. Broken Glass, Iron Scraps..."
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => {
                              setShowCategoryRequestModal(false);
                              setCategoryRequestText('');
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSendCategoryRequest}
                            disabled={!categoryRequestText.trim() || isSendingRequest}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isSendingRequest ? "Sending..." : "Send Request"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Requests & history */}
            <button
              type="button"
              onClick={() => navigate('/scrapper/my-active-requests')}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-slate-50 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {getTranslatedText("Active requests")}
                </p>
                <p className="text-xs text-slate-500">
                  {getTranslatedText("View and manage current pickups")}
                </p>
              </div>
              <span className="text-slate-400">
                ›
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/scrapper/my-sent-requests')}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-slate-50 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800 font-black text-sky-600">
                  {getTranslatedText("My Sent Requests")}
                </p>
                <p className="text-xs text-slate-500">
                  {getTranslatedText("Track your bulk scrap sell requests")}
                </p>
              </div>
              <span className="text-sky-400">
                ›
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/scrapper/earnings')}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-slate-50 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {getTranslatedText("Earnings & history")}
                </p>
                <p className="text-xs text-slate-500">
                  {getTranslatedText("Check completed pickups and payouts")}
                </p>
              </div>
              <span className="text-slate-400">
                ›
              </span>
            </button>

            {/* Refer & legal */}
            <button
              type="button"
              onClick={() => navigate('/scrapper/refer')}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-slate-50 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {getTranslatedText("Refer & Earn")}
                </p>
                <p className="text-xs text-slate-500">
                  {getTranslatedText("Share your code and earn extra on pickups")}
                </p>
              </div>
              <span className="text-slate-400">
                ›
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/scrapper/terms')}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-slate-50 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {getTranslatedText("Terms & Conditions")}
                </p>
                <p className="text-xs text-slate-500">
                  {getTranslatedText("Read how Junkar works for scrappers")}
                </p>
              </div>
              <span className="text-slate-400">
                ›
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/scrapper/help')}
              className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-slate-50 transition-colors rounded-b-xl"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {getTranslatedText("Help & Support")}
                </p>
                <p className="text-xs text-slate-500">
                  {getTranslatedText("Get help for any issue")}
                </p>
              </div>
              <span className="text-slate-400">
                ›
              </span>
            </button>
          </div>

          {/* Delete Account Action */}
          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-3.5 mt-4 text-red-600 font-semibold bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors shadow-sm"
          >
            <span aria-hidden>🗑️</span>
            {getTranslatedText("Delete Account")}
          </button>
        </div>
      </div>
      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={scrapperUser}
        onSuccess={handleProfileUpdate}
      />

      <div className="md:hidden">
        <ScrapperBottomNav />
      </div>
    </motion.div >
  );
};

export default ScrapperProfile;


