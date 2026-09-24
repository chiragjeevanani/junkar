import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { walletService } from '../../shared/services/wallet.service';
import { orderAPI, authAPI, uploadAPI } from '../../shared/utils/api';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { useRef } from 'react';
import { usePageTranslation } from "../../../hooks/usePageTranslation";
import ReferAndEarn from './ReferAndEarn';
import UserBottomNav from './UserBottomNav';
import {
  FaCheckCircle,
  FaBox,
  FaWallet,
  FaStar,
  FaChartLine,
  FaEdit,

  FaUser,
  FaPhone,
  FaSignOutAlt,
  FaGift,
  FaCommentAlt,
  FaBell,
  FaQuestionCircle,
  FaCog
} from 'react-icons/fa';
import {
  HiTrendingUp,
  HiCollection,
  HiCash,
  HiLocationMarker
} from 'react-icons/hi';
import {
  MdCategory,
  MdPayment,
  MdCheckCircleOutline,
  MdAssignment
} from 'react-icons/md';

const MyProfilePage = () => {
  const staticTexts = [
    "My Profile",
    "Verified",
    "Full Name",
    "Phone Number",
    "Cancel",
    "Save Changes",
    "Overview",
    "Activity",
    "Analysis",
    "Refer & Earn",
    "Quick Stats",
    "Total Requests",
    "Completed",
    "Total Earnings",
    "Total Weight",
    "kg",
    "Avg Rating",
    "Top Category",
    "Wallet Balance",
    "View All",
    "Available balance",
    "Pickup Completed",
    "Metal scrap pickup completed successfully",
    "New Request Created",
    "Plastic scrap pickup requested",
    "Payment Received",
    "Amount credited to wallet",
    "Request Accepted",
    "Scrapper accepted your pickup request",
    "Electronics scrap pickup completed",
    "Monthly Requests & Earnings",
    "Requests",
    "Earnings",
    "Category Distribution",
    "No activity yet.",
    "Start by creating a new pickup request!",
    "Go back",
    "User Name",
    "+91 98765 43210",
    "Metal",
    "Plastic",
    "Electronics",
    "Paper",
    "Saved Addresses",
    "Manage pickup locations",
    "My Requests",
    "View pickup history & status",
    "Chat",
    "Messages with scrappers",
    "Notifications",
    "Manage notification settings",
    "Help & Support",
    "FAQ, contact support",
    "Settings",
    "Terms & Conditions",
    "Quick Actions",
    "Location Details",
    "City",
    "Pincode",
    "State",
    "Search Address",
    "View Offers",
    "No Data"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const { user, logout, login } = useAuth();
  const [activeTab, setActiveTab] = useState("overview"); // overview, activity, analysis
  const [isEditMode, setIsEditMode] = useState(false);
  const autocompleteRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const [formData, setFormData] = useState({
    name: user?.name || getTranslatedText("User Name"),
    phone: user?.phone || getTranslatedText("+91 98765 43210"),
    street: user?.address?.street || "",
    city: user?.address?.city || "",
    state: user?.address?.state || "",
    pincode: user?.address?.pincode || "",
    profilePicture: null,
  });
  const [walletBalance, setWalletBalance] = useState(0);
  const [activities, setActivities] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || 'User Name',
        phone: user.phone || '+91 98765 43210',
        street: user.address?.street || "",
        city: user.address?.city || "",
        state: user.address?.state || "",
        pincode: user.address?.pincode || "",
        profilePicture: null,
      });

      const fetchData = async () => {
        setLoadingActivity(true);
        try {
          // 1. Fetch Wallet Profile (Balance + Transactions)
          const walletData = await walletService.getWalletProfile();
          if (walletData.success && walletData.data) {
            setWalletBalance(walletData.data.balance || 0);
          }

          const transactions = walletData.data?.transactions || [];

          // 2. Fetch Orders (Requests)
          const ordersRes = await orderAPI.getMy();
          const orders = ordersRes.success && ordersRes.data?.orders ? ordersRes.data.orders : [];

          // 3. Calculate Stats
          const completedOrders = orders.filter(o => o.status === 'completed');
          const cancelledOrders = orders.filter(o => o.status === 'cancelled');

          const calculatedTotalWeight = completedOrders.reduce((sum, o) => sum + (o.totalWeight || 0), 0);

          // Calculate Total Earnings (Sum of CREDIT transactions)
          const calculatedTotalEarnings = transactions
            .filter(tx => tx.type === 'CREDIT')
            .reduce((sum, tx) => sum + (tx.amount || 0), 0);

          // Find Favorite Category
          const categoryCount = {};
          completedOrders.forEach(order => {
            if (order.scrapItems) {
              order.scrapItems.forEach(item => {
                const cat = item.category || 'Other';
                categoryCount[cat] = (categoryCount[cat] || 0) + 1;
              });
            }
          });

          let favCategory = "-";
          let maxCount = 0;
          Object.entries(categoryCount).forEach(([cat, count]) => {
            if (count > maxCount) {
              maxCount = count;
              favCategory = cat;
            }
          });

          setStats({
            totalRequests: orders.length,
            completedRequests: completedOrders.length,
            totalEarnings: calculatedTotalEarnings,
            averageRating: user?.rating || 5.0,
            totalWeight: calculatedTotalWeight,
            favoriteCategory: favCategory !== "-" ? favCategory.charAt(0).toUpperCase() + favCategory.slice(1) : "-"
          });

          // 4. Transform and Merge for Activity Feed
          const mappedTransactions = transactions.map(tx => ({
            id: tx._id || tx.trxId,
            type: 'transaction',
            title: tx.type === 'CREDIT' ? getTranslatedText("Payment Received") : getTranslatedText("Payment Sent"),
            description: tx.description || getTranslatedText(tx.category),
            amount: `₹${tx.amount}`,
            timestamp: new Date(tx.createdAt),
            displayTime: new Date(tx.createdAt).toLocaleDateString(),
            icon: tx.type === 'CREDIT' ? FaWallet : FaCheckCircle,
            color: tx.type === 'CREDIT' ? "#0ea5e9" : "#ef4444"
          }));

          const mappedOrders = orders.map(order => ({
            id: order._id,
            type: 'order',
            title: order.status === 'completed' ? getTranslatedText("Pickup Completed") : getTranslatedText("New Request Created"),
            description: `${getTranslatedText("Status")}: ${order.status}`,
            amount: order.totalAmount ? `₹${order.totalAmount}` : null,
            timestamp: new Date(order.createdAt),
            displayTime: new Date(order.createdAt).toLocaleDateString(),
            icon: FaBox,
            color: "#3b82f6"
          }));

          // Merge and Sort by Date (Newest First)
          const allActivities = [...mappedTransactions, ...mappedOrders]
            .sort((a, b) => b.timestamp - a.timestamp);

          setActivities(allActivities);

          // 5. Calculate Analysis Data (Monthly Stats & Category Dist)

          // Monthly Stats (Last 6 Months)
          const last6Months = [];
          for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            last6Months.push({
              month: d.toLocaleString('en-IN', { month: 'short' }),
              year: d.getFullYear(),
              monthIndex: d.getMonth(),
              requests: 0,
              earnings: 0
            });
          }

          // Aggregate Requests
          orders.forEach(order => {
            const d = new Date(order.createdAt);
            const mIndex = d.getMonth();
            const year = d.getFullYear();
            const period = last6Months.find(p => p.monthIndex === mIndex && p.year === year);
            if (period) {
              period.requests += 1;
            }
          });

          // Aggregate Earnings (Credit Transactions)
          transactions.forEach(tx => {
            if (tx.type === 'CREDIT') {
              const d = new Date(tx.createdAt);
              const mIndex = d.getMonth();
              const year = d.getFullYear();
              const period = last6Months.find(p => p.monthIndex === mIndex && p.year === year);
              if (period) {
                period.earnings += (tx.amount || 0);
              }
            }
          });

          setMonthlyStats(last6Months);

          // Category Distribution (Already calculated counts in step 3, refining here)
          const catDist = [];
          const totalItems = Object.values(categoryCount).reduce((a, b) => a + b, 0);

          const colors = ["#38bdf8", "#5a8263", "#4a7c5a", "#3a6c4a", "#2d5a3f"];
          let colorIndex = 0;

          Object.entries(categoryCount).forEach(([cat, count]) => {
            catDist.push({
              name: getTranslatedText(cat.charAt(0).toUpperCase() + cat.slice(1)),
              value: totalItems > 0 ? Math.round((count / totalItems) * 100) : 0,
              count: count,
              color: colors[colorIndex % colors.length]
            });
            colorIndex++;
          });

          // If empty, show default empty state or nothing
          if (catDist.length === 0) {
            catDist.push({ name: getTranslatedText("No Data"), value: 100, color: "#e2e8f0" });
          }

          setCategoryStats(catDist);

        } catch (err) {
          console.error('Failed to fetch profile data:', err);
        } finally {
          setLoadingActivity(false);
        }
      };

      fetchData();
    }
  }, [user]);

  const handleSave = async () => {
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode
        }
      };

      const response = await authAPI.updateProfile(payload);
      if (response.success) {
        login(response.data.user, localStorage.getItem('token'));
        setIsEditMode(false);
      } else {
        alert(response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error('Update profile error:', error);
      alert(error.message || "Something went wrong while updating profile");
    }
  };

  const handlePlaceSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const components = place.address_components || [];
        let city = '';
        let state = '';
        let pincode = '';

        components.forEach(c => {
          if (c.types.includes('locality')) city = c.long_name;
          if (c.types.includes('administrative_area_level_1')) state = c.long_name;
          if (c.types.includes('postal_code')) pincode = c.long_name;
        });

        setFormData({
          ...formData,
          street: place.formatted_address,
          city,
          state,
          pincode
        });
      }
    }
  };

  // Activity feed is now managing state 'activities'

  // Stats state
  const [stats, setStats] = useState({
    totalRequests: 0,
    completedRequests: 0,
    totalEarnings: 0,
    averageRating: user?.rating || 4.8, // Default or user rating if available
    totalWeight: 0,
    favoriteCategory: "-"
  });



  const quickActions = [
    {
      icon: <HiLocationMarker />,
      title: getTranslatedText("Saved Addresses"),
      desc: getTranslatedText("Manage pickup locations"),
      action: () => navigate("/user/saved-addresses"),
      color: "#0ea5e9"
    },
    {
      icon: <MdAssignment />,
      title: getTranslatedText("My Requests"),
      desc: getTranslatedText("View pickup history & status"),
      action: () => navigate("/user/my-requests"),
      color: "#0ea5e9"
    },
    {
      icon: <FaCommentAlt />,
      title: getTranslatedText("Chat"),
      desc: getTranslatedText("Messages with scrappers"),
      action: () => navigate("/user/chats"),
      color: "#0ea5e9"
    },
    {
      icon: <FaBell />,
      title: getTranslatedText("Notifications"),
      desc: getTranslatedText("Manage notification settings"),
      action: () => navigate("/user/notifications"),
      color: "#0ea5e9"
    },
    {
      icon: <FaQuestionCircle />,
      title: getTranslatedText("Help & Support"),
      desc: getTranslatedText("FAQ, contact support"),
      action: () => navigate("/user/help"),
      color: "#0ea5e9"
    },
    {
      icon: <FaCog />,
      title: getTranslatedText("Terms & Conditions"),
      desc: getTranslatedText("Read platform terms & conditions"),
      action: () => navigate("/user/terms"),
      color: "#0ea5e9"
    }
  ];

  return (
    <div
      className="min-h-screen pb-20 md:pb-0"
      style={{ background: "linear-gradient(to bottom, #7dd3fc, #e0f2fe)" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-40 px-3 md:px-6 lg:px-8 py-3 md:py-6"
        style={{ backgroundColor: "transparent" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1
            className="text-lg md:text-2xl font-bold"
            style={{ color: "#ffffff" }}>
            {getTranslatedText("My Profile")}
          </h1>

        </div>
      </div>

      <div className="px-3 md:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Profile Header Card */}
        <div className="mb-3 md:mb-6">
          <div
            className="rounded-xl md:rounded-2xl p-3 md:p-6 shadow-lg backdrop-blur-sm"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}>
            <AnimatePresence mode="wait">
              {!isEditMode ? (
                <div
                  key="view"
                  className="flex items-center gap-3 md:gap-4">
                  {/* Profile Picture */}
                  <div
                    className="w-12 h-12 md:w-20 md:h-20 rounded-full flex items-center justify-center flex-shrink-0 relative shadow-inner"
                    style={{
                      backgroundColor: '#f0f9ff',
                      border: '2px solid #0ea5e9'
                    }}
                  >
                    {formData.profilePicture ? (
                      <img
                        src={URL.createObjectURL(formData.profilePicture)}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className="text-lg md:text-3xl font-bold"
                        style={{ color: "#0284c7" }}>
                        {formData.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h2
                      className="text-base md:text-xl font-bold mb-0.5"
                      style={{ color: "#1e293b" }}>
                      {formData.name}
                    </h2>
                    <p
                      className="text-xs md:text-base mb-0.5"
                      style={{ color: "#64748b" }}>
                      {formData.phone}
                    </p>
                    {(formData.city || formData.state) && (
                      <p className="items-center gap-1 text-[10px] md:text-xs mb-1 font-medium" style={{ color: "#94a3b8" }}>
                        <HiLocationMarker className="inline mr-0.5" />
                        {formData.city}{formData.city && formData.state ? ', ' : ''}{formData.state}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] md:text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: '#f0f9ff',
                          color: '#0284c7'
                        }}
                      >
                        {getTranslatedText("Verified")}
                      </span>
                      <span
                        className="text-[10px] md:text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-medium"
                        style={{
                          backgroundColor: '#f0f9ff',
                          color: '#0284c7'
                        }}
                      >
                        {stats.averageRating} <FaStar size={8} />
                      </span>
                    </div>

                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="p-1.5 md:p-2 rounded-lg hover:bg-emerald-50 transition-colors flex-shrink-0"
                    style={{
                      color: '#0284c7'
                    }}
                  >
                    <FaEdit size={14} className="md:w-5 md:h-5" />
                  </button>
                </div>
              ) : (
                <div
                  key="edit"
                  className="space-y-3 md:space-y-4">
                  {/* Profile Picture Upload */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div
                        className="w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center relative overflow-hidden shadow-inner"
                        style={{
                          backgroundColor: '#f0f9ff',
                          border: '2px solid #0ea5e9'
                        }}
                      >
                        {formData.profilePicture ? (
                          <img
                            src={URL.createObjectURL(formData.profilePicture)}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span
                            className="text-xl md:text-4xl font-bold"
                            style={{ color: "#0284c7" }}>
                            {formData.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <label
                        htmlFor="profile-picture"
                        className="absolute bottom-0 right-0 w-6 h-6 md:w-10 md:h-10 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-110"
                        style={{
                          backgroundColor: '#0ea5e9',
                          color: '#ffffff'
                        }}
                      >
                        <FaEdit size={10} className="md:w-3.5 md:h-3.5" />
                        <input
                          id="profile-picture"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setFormData({
                                ...formData,
                                profilePicture: e.target.files[0],
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Name Input */}
                  <div>
                    <label
                      className="block text-xs md:text-sm font-medium mb-1"
                      style={{ color: "#475569" }}>
                      {getTranslatedText("Full Name")}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                        setFormData({ ...formData, name: value });
                      }}
                      className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-xs md:text-base border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      style={{
                        borderColor: '#e2e8f0',
                        color: '#1e293b',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>

                  {/* Phone Input */}
                  <div>
                    <label
                      className="block text-xs md:text-sm font-medium mb-1"
                      style={{ color: "#475569" }}>
                      {getTranslatedText("Phone Number")}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setFormData({ ...formData, phone: value });
                      }}
                      className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-xs md:text-base border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      style={{
                        borderColor: '#e2e8f0',
                        color: '#1e293b',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>

                  {/* Address Section */}
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{getTranslatedText("Location Details")}</p>

                    {/* Search Address */}
                    <div className="mb-3">
                      <label className="block text-xs md:text-sm font-medium mb-1" style={{ color: "#475569" }}>{getTranslatedText("Search Address")}</label>
                      {isLoaded ? (
                        <Autocomplete
                          onLoad={(ref) => autocompleteRef.current = ref}
                          onPlaceChanged={handlePlaceSelect}
                        >
                          <input
                            type="text"
                            value={formData.street}
                            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                            placeholder="Search or enter locality"
                            className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-xs md:text-base border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            style={{ borderColor: '#e2e8f0', color: '#1e293b', backgroundColor: '#ffffff' }}
                          />
                        </Autocomplete>
                      ) : (
                        <input
                          type="text"
                          value={formData.street}
                          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                          placeholder="Enter locality"
                          className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-xs md:text-base border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          style={{ borderColor: '#e2e8f0', color: '#1e293b', backgroundColor: '#ffffff' }}
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">{getTranslatedText("City")}</label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                            setFormData({ ...formData, city: value });
                          }}
                          className="w-full px-3 py-2 rounded-lg text-xs border focus:outline-none"
                          style={{ borderColor: '#e2e8f0', color: '#1e293b', backgroundColor: '#ffffff' }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase">{getTranslatedText("Pincode")}</label>
                        <input
                          type="text"
                          value={formData.pincode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                            setFormData({ ...formData, pincode: value });
                          }}
                          className="w-full px-3 py-2 rounded-lg text-xs border focus:outline-none"
                          style={{ borderColor: '#e2e8f0', color: '#1e293b', backgroundColor: '#ffffff' }}
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase">{getTranslatedText("State")}</label>
                        <input
                          type="text"
                          value={formData.state}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                            setFormData({ ...formData, state: value });
                          }}
                          className="w-full px-3 py-2 rounded-lg text-xs border focus:outline-none"
                        style={{ borderColor: '#e2e8f0', color: '#1e293b', backgroundColor: '#ffffff' }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 md:gap-3 pt-2">
                    <button
                      onClick={() => setIsEditMode(false)}
                      className="flex-1 py-1.5 md:py-2.5 px-3 rounded-lg font-semibold text-xs md:text-base transition-all hover:bg-slate-50"
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        color: '#64748b'
                      }}
                    >
                      {getTranslatedText("Cancel")}
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 py-1.5 md:py-2.5 px-3 rounded-lg font-semibold text-xs md:text-base text-white transition-all shadow-md hover:shadow-lg"
                      style={{ backgroundColor: "#0ea5e9" }}>
                      {getTranslatedText("Save Changes")}
                    </button>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-3 md:mb-6 overflow-x-auto scrollbar-hide pb-1">
          {[
            { id: "overview", label: getTranslatedText("Overview") },
            { id: "activity", label: getTranslatedText("Activity") },
            {
              id: "refer",
              label: getTranslatedText("Refer & Earn"),
              icon: FaGift,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all flex items-center justify-center gap-1.5 shadow-sm ${activeTab === tab.id ? 'text-white' : 'text-slate-600'
                }`}
              style={{
                backgroundColor: activeTab === tab.id ? "#0ea5e9" : "#ffffff",
                border: "none",
                boxShadow: activeTab === tab.id ? "0 4px 6px -1px rgba(16, 185, 129, 0.3)" : "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
              }}>
              {tab.icon && <tab.icon className="text-sm" />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <div
              key="overview"
              className="space-y-3 md:space-y-6">

              {/* Wallet Balance */}
              <div
                className="rounded-2xl p-4 shadow-xl border-2 border-slate-100 transition-shadow hover:shadow-2xl relative overflow-hidden"
                style={{ backgroundColor: "#ffffff" }}
              >
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-base text-slate-800">
                      {getTranslatedText("Wallet Balance")}
                    </h3>
                    <button
                      onClick={() => navigate('/user/wallet')}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        backgroundColor: "#f0f9ff",
                        color: "#0ea5e9"
                      }}
                    >
                      {getTranslatedText("View All")}
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                      style={{
                        background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
                      }}
                    >
                      <HiCash className="text-2xl text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-2xl font-bold text-slate-800">
                        ₹{walletBalance.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        {getTranslatedText("Available balance")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions - Merged from old Profile.jsx */}
              <div
                className="rounded-2xl p-4 shadow-xl border-2 border-slate-100 transition-shadow hover:shadow-2xl"
                style={{ backgroundColor: '#ffffff' }}
              >
                <h3
                  className="font-bold text-base mb-3"
                  style={{ color: "#1e293b" }}>
                  {getTranslatedText("Quick Actions")}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className="p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-md hover:shadow-lg"
                      style={{
                        backgroundColor: "#ffffff",
                        border: "2px solid #cbd5e1"
                      }}
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
                        style={{
                          background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
                          color: "#0284c7"
                        }}
                      >
                        <span className="text-lg">{action.icon}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-700 text-center leading-tight">{action.title}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div key="activity">
              {loadingActivity ? (
                <div className="text-center py-10">
                  <p className="text-slate-500">{getTranslatedText("Loading activity...")}</p>
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-2xl p-4 shadow-lg border-2 border-slate-100 transition-shadow hover:shadow-xl"
                      style={{ backgroundColor: "#ffffff" }}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                          style={{
                            backgroundColor: "#f0f9ff",
                            border: "2px solid #e0f2fe"
                          }}>
                          <item.icon
                            className="text-xl"
                            style={{ color: "#0ea5e9" }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4
                              className="font-bold text-sm leading-tight"
                              style={{ color: "#1e293b" }}>
                              {item.title}
                            </h4>
                            <span
                              className="text-xs whitespace-nowrap font-medium ml-2"
                              style={{ color: "#94a3b8" }}>
                              {item.displayTime}
                            </span>
                          </div>
                          <p
                            className="text-xs leading-tight font-medium"
                            style={{ color: "#64748b" }}>
                            {item.description}
                          </p>
                        </div>
                      </div>
                      {item.amount && (
                        <div className="mt-3">
                          <div
                            className="w-full px-4 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md"
                            style={{
                              background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
                            }}>
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xl font-bold text-white">
                              {item.amount}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4">
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg"
                    style={{
                      backgroundColor: "#f0f9ff",
                      border: "3px solid #e0f2fe"
                    }}>
                    <FaChartLine
                      className="text-4xl"
                      style={{ color: "#0ea5e9" }}
                    />
                  </div>
                  <h3
                    className="text-xl font-bold mb-2"
                    style={{ color: "#1e293b" }}>
                    {getTranslatedText("No activity yet.")}
                  </h3>
                  <p className="text-base font-medium" style={{ color: "#64748b" }}>
                    {getTranslatedText("Start by creating a new pickup request!")}
                  </p>
                </div>
              )}
            </div>
          )}


          {activeTab === "refer" && (
            <div
              key="refer"
            >
              <ReferAndEarn getTranslatedText={getTranslatedText} />
            </div>
          )}
        </AnimatePresence>

        {/* Logout Button */}
        <div className="mt-6 mb-8 text-center">
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
            style={{
              background: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)",
              color: "#ffffff",
            }}>
            <FaSignOutAlt />
            {getTranslatedText("Logout")}
          </button>
        </div>
      </div>
      <UserBottomNav />
    </div>
  );
};

export default MyProfilePage;

