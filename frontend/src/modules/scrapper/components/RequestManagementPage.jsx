import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { scrapperOrdersAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import ScrapperBottomNav from './ScrapperBottomNav';

const RequestManagementPage = () => {
    const staticTexts = [
        "My Requests",
        "Incoming",
        "Forwarded",
        "{count} request",
        "{count} requests",
        "Go Online",
        "No Incoming Requests",
        "You don't have any active requests from users.",
        "Go Online to Receive Requests",
        "No Forwarded Requests",
        "You haven't forwarded any requests to big scrappers yet.",
        "Accepted",
        "Picked Up",
        "In Progress",
        "Completed",
        "Pending",
        "Location",
        "Pickup Time",
        "View Details",
        "Time not specified",
        "User",
        "Big Scrapper",
        "Scrap",
        "Address not available",
        "Unknown User",
        "Loading...",
        "Failed to load requests",
        "Forwarded on"
    ];
    const { getTranslatedText } = usePageTranslation(staticTexts);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' or 'forwarded'
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [forwardedRequests, setForwardedRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Check authentication
    useEffect(() => {
        const scrapperAuth = localStorage.getItem('scrapperAuthenticated');
        const scrapperUser = localStorage.getItem('scrapperUser');
        if (scrapperAuth !== 'true' || !scrapperUser) {
            navigate('/scrapper/login', { replace: true });
            return;
        }

        // Load active tab from localStorage
        const savedTab = localStorage.getItem('requestManagementTab');
        if (savedTab) {
            setActiveTab(savedTab);
        }
    }, [navigate]);

    // Map order to request format
    const mapOrderToRequest = (order, isForwarded = false) => {
        if (!order) return null;

        const categories = Array.isArray(order.scrapItems)
            ? order.scrapItems.map((item) => item.category).filter(Boolean)
            : [];

        const addressParts = [
            order.pickupAddress?.street,
            order.pickupAddress?.city,
            order.pickupAddress?.state,
            order.pickupAddress?.pincode
        ].filter(Boolean);

        const address = addressParts.join(', ');

        const statusLower = order.status?.toLowerCase();
        const paymentStatusLower = order.paymentStatus?.toLowerCase();

        let uiStatus = 'accepted'; // Default status

        if (isForwarded) {
            // For forwarded requests
            if (statusLower === 'completed') {
                uiStatus = 'completed';
            } else if (statusLower === 'in_progress') {
                uiStatus = 'in_progress';
            } else if (order.scrapper) {
                uiStatus = 'accepted'; // Big scrapper accepted
            } else {
                uiStatus = 'pending'; // Waiting for big scrapper
            }
        } else {
            // For incoming requests
            if (statusLower === 'completed') {
                uiStatus = 'completed';
            } else if (statusLower === 'in_progress') {
                if (paymentStatusLower === 'paid' || paymentStatusLower === 'completed') {
                    uiStatus = 'payment_done';
                } else {
                    uiStatus = 'picked_up';
                }
            }
        }

        const estimatedAmount =
            typeof order.totalAmount === 'number'
                ? `₹${order.totalAmount.toFixed(0)}`
                : order.totalAmount || '₹0';

        return {
            id: order._id,
            orderId: order._id,
            userId: order.user?._id || order.user,
            userName: order.user?.name || getTranslatedText('User'),
            userPhone: order.user?.phone || '',
            bigScrapperName: order.scrapper?.name || null,
            bigScrapperPhone: order.scrapper?.phone || '',
            scrapType: categories.map(c => c).join(', ') || getTranslatedText('Scrap'),
            weight: order.totalWeight,
            pickupSlot: order.pickupSlot,
            preferredTime: order.preferredTime,
            images: (order.images || []).map((img) => img.url || img.preview || img),
            location: {
                address: address || getTranslatedText('Address not available'),
                lat: order.pickupAddress?.coordinates?.lat || 19.076,
                lng: order.pickupAddress?.coordinates?.lng || 72.8777
            },
            estimatedEarnings: estimatedAmount,
            status: uiStatus,
            createdAt: order.createdAt,
            notes: order.notes || '',
            isForwarded: isForwarded,
            isDonation: order.isDonation || order.scrapItems?.some(item => item.pricingType === 'donate'),
            isNegotiated: order.isNegotiated || order.scrapItems?.some(item => item.pricingType === 'negotiable'),
            hasNegotiableItems: order.isNegotiated || order.scrapItems?.some(item => item.pricingType === 'negotiable'),
        };
    };

    // Load incoming requests
    const loadIncomingRequests = async () => {
        try {
            const response = await scrapperOrdersAPI.getMyAssigned();
            const rawOrders = response?.data?.orders || response?.orders || response || [];

            const mapped = (rawOrders || [])
                .filter(o => {
                    const s = o.status?.toLowerCase();
                    return s !== 'completed' && s !== 'cancelled';
                })
                .map(o => mapOrderToRequest(o, false))
                .filter(Boolean);

            // Sort by acceptedAt (newest first)
            mapped.sort((a, b) => {
                const dateA = new Date(a.acceptedAt || a.createdAt || 0);
                const dateB = new Date(b.acceptedAt || b.createdAt || 0);
                return dateB - dateA;
            });

            setIncomingRequests(mapped);
        } catch (err) {
            console.error('Failed to load incoming requests:', err);
            setError(err?.message || getTranslatedText('Failed to load requests'));
        }
    };

    // Load forwarded requests
    const loadForwardedRequests = async () => {
        try {
            const response = await scrapperOrdersAPI.getMyForwarded();
            const rawOrders = response?.data?.orders || response?.orders || response || [];

            const mapped = (rawOrders || [])
                .map(o => mapOrderToRequest(o, true))
                .filter(Boolean);

            // Sort by createdAt (newest first)
            mapped.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA;
            });

            setForwardedRequests(mapped);
        } catch (err) {
            console.error('Failed to load forwarded requests:', err);
            setError(err?.message || getTranslatedText('Failed to load requests'));
        }
    };

    // Load requests based on active tab
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError('');
            if (activeTab === 'incoming') {
                await loadIncomingRequests();
            } else {
                await loadForwardedRequests();
            }
            setLoading(false);
        };

        loadData();

        // Refresh on focus/visibility
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                loadData();
            }
        };

        const handleFocus = () => {
            loadData();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('storage', loadData);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('storage', loadData);
        };
    }, [activeTab]);

    // Save active tab to localStorage
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        localStorage.setItem('requestManagementTab', tab);
    };

    const getStatusConfig = (status) => {
        const configs = {
            accepted: {
                bg: 'rgba(59, 130, 246, 0.1)',
                color: '#2563eb',
                label: getTranslatedText('Accepted'),
                icon: '✓'
            },
            picked_up: {
                bg: 'rgba(234, 179, 8, 0.1)',
                color: '#ca8a04',
                label: getTranslatedText('Picked Up'),
                icon: '📦'
            },
            in_progress: {
                bg: 'rgba(249, 115, 22, 0.1)',
                color: '#f97316',
                label: getTranslatedText('In Progress'),
                icon: '🔄'
            },
            completed: {
                bg: 'rgba(107, 114, 128, 0.1)',
                color: '#6b7280',
                label: getTranslatedText('Completed'),
                icon: '✓'
            },
            pending: {
                bg: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
                label: getTranslatedText('Pending'),
                icon: '⏳'
            },
            payment_done: {
                bg: 'rgba(34, 197, 94, 0.1)',
                color: '#16a34a',
                label: getTranslatedText('Completed'),
                icon: '✓'
            }
        };
        return configs[status] || configs.accepted;
    };

    const formatPickupTime = (request) => {
        if (request.pickupSlot) {
            return `${request.pickupSlot.dayName}, ${request.pickupSlot.date} • ${request.pickupSlot.slot}`;
        }
        if (request.preferredTime) {
            return request.preferredTime;
        }
        return getTranslatedText('Time not specified');
    };

    const currentRequests = activeTab === 'incoming' ? incomingRequests : forwardedRequests;

    if (loading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[#e0f2fe]">
                <p className="text-sky-800 font-medium">{getTranslatedText("Loading...")}</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen w-full pb-20 md:pb-0"
            style={{ background: "linear-gradient(to bottom, #7dd3fc, #e0f2fe)" }}
        >
            {/* Header */}
            <div className="sticky top-0 z-40 px-4 md:px-6 lg:px-8 py-4 md:py-6 border-b border-transparent bg-transparent">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                                {getTranslatedText("My Requests")}
                            </h1>
                            <p className="text-xs md:text-sm mt-1 text-slate-600">
                                {currentRequests.length === 1
                                    ? getTranslatedText("{count} request", { count: currentRequests.length })
                                    : getTranslatedText("{count} requests", { count: currentRequests.length })}
                            </p>
                            {error && (
                                <p className="text-[11px] md:text-xs mt-1 text-red-600">
                                    {error}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/scrapper/active-requests')}
                        className="px-4 py-2 rounded-full text-sm font-semibold transition-colors bg-sky-600 text-white shadow-lg hover:bg-sky-700"
                    >
                        {getTranslatedText("Go Online")}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => handleTabChange('incoming')}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm md:text-base transition-all ${activeTab === 'incoming'
                            ? 'bg-white text-sky-700 shadow-md'
                            : 'bg-white/50 text-slate-600 hover:bg-white/70'
                            }`}
                    >
                        {getTranslatedText("Incoming")}
                        {incomingRequests.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-sky-100 text-sky-700">
                                {incomingRequests.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => handleTabChange('forwarded')}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm md:text-base transition-all ${activeTab === 'forwarded'
                            ? 'bg-white text-sky-700 shadow-md'
                            : 'bg-white/50 text-slate-600 hover:bg-white/70'
                            }`}
                    >
                        {getTranslatedText("Forwarded")}
                        {forwardedRequests.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-sky-100 text-sky-700">
                                {forwardedRequests.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto py-6">
                {currentRequests.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-12 md:py-16"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-100">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h3 className="text-lg md:text-xl font-bold mb-2 text-slate-800">
                            {activeTab === 'incoming'
                                ? getTranslatedText("No Incoming Requests")
                                : getTranslatedText("No Forwarded Requests")}
                        </h3>
                        <p className="text-sm md:text-base mb-6 text-slate-500">
                            {activeTab === 'incoming'
                                ? getTranslatedText("You don't have any active requests from users.")
                                : getTranslatedText("You haven't forwarded any requests to big scrappers yet.")}
                        </p>
                        {activeTab === 'incoming' && (
                            <button
                                onClick={() => navigate('/scrapper/active-requests')}
                                className="px-6 py-3 rounded-full font-semibold text-sm md:text-base transition-all bg-sky-600 text-white shadow-lg hover:bg-sky-700"
                            >
                                {getTranslatedText("Go Online to Receive Requests")}
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {currentRequests.map((request, index) => {
                            const statusConfig = getStatusConfig(request.status);
                            const pickupTime = formatPickupTime(request);

                            return (
                                <motion.div
                                    key={request.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => navigate(`/scrapper/active-request/${request.id}`, { state: { request } })}
                                    className="rounded-2xl p-4 md:p-6 shadow-md cursor-pointer transition-all hover:shadow-xl border bg-white border-slate-200 hover:border-sky-200"
                                >
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            {/* Avatar */}
                                            <div
                                                className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-sky-50 text-sky-600 font-bold text-lg md:text-xl"
                                            >
                                                {request.userName?.[0]?.toUpperCase() || 'U'}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-base md:text-lg font-bold truncate text-slate-800">
                                                        {request.userName || getTranslatedText('Unknown User')}
                                                    </h3>
                                                    <span
                                                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                                                        style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
                                                    >
                                                        {statusConfig.icon} {statusConfig.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm md:text-base mb-2 text-slate-500">
                                                    {request.scrapType || getTranslatedText('Scrap')}
                                                </p>
                                                <div className="flex items-center gap-2 mb-2">
                                                   {request.isDonation ? (
                                                     <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                                                       DONATE
                                                     </span>
                                                   ) : request.isNegotiated || request.hasNegotiableItems ? (
                                                     <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                       NEGOTIABLE
                                                     </span>
                                                   ) : (
                                                     <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 border border-sky-200">
                                                       FIXED PRICE
                                                     </span>
                                                   )}
                                                </div>
                                                <p className="text-lg md:text-xl font-bold text-sky-600">
                                                  {request.isDonation ? (
                                                    <span className="text-green-600">Donation</span>
                                                  ) : (
                                                    request.hasNegotiableItems ? (
                                                       <span className="text-amber-600">Negotiable</span>
                                                    ) : (
                                                       request.estimatedEarnings || '₹0'
                                                    )
                                                  )}
                                                </p>
                                                {/* Show big scrapper name if forwarded and accepted */}
                                                {request.isForwarded && request.bigScrapperName && (
                                                    <p className="text-xs mt-1 text-blue-600">
                                                        {getTranslatedText("Big Scrapper")}: {request.bigScrapperName}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
                                        {/* Location */}
                                        {request.location?.address && (
                                            <div className="flex items-start gap-2">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-slate-400 mt-0.5 shrink-0">
                                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" />
                                                </svg>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-slate-400 mb-0.5">{getTranslatedText("Location")}</p>
                                                    <p className="text-sm font-medium truncate text-slate-600">
                                                        {request.location.address}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Pickup Time */}
                                        <div className="flex items-start gap-2">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-slate-400 mt-0.5 shrink-0">
                                                <path d="M8 2v2M16 2v2M5 7h14M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-slate-400 mb-0.5">{getTranslatedText("Pickup Time")}</p>
                                                <p className="text-sm font-medium truncate text-slate-600">
                                                    {pickupTime}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/scrapper/active-request/${request.id}`, { state: { request } });
                                            }}
                                            className="w-full py-3 rounded-xl font-semibold text-sm md:text-base transition-all bg-sky-600 text-white hover:bg-sky-700 shadow-md hover:shadow-lg"
                                        >
                                            {getTranslatedText("View Details")}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="md:hidden">
                <ScrapperBottomNav />
            </div>
        </motion.div>
    );
};

export default RequestManagementPage;
