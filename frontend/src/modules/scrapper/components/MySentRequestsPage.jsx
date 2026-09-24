import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaHistory, FaClock, FaCheckCircle, FaTimesCircle, FaMapMarkerAlt } from 'react-icons/fa';
import { scrapperOrdersAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const MySentRequestsPage = () => {
    const staticTexts = [
        "My Sent Requests",
        "Track your bulk scrap sell requests",
        "All",
        "Pending",
        "Accepted",
        "Completed",
        "Cancelled",
        "No requests found",
        "You haven't sent any bulk scrap requests yet.",
        "Order ID:",
        "Sent:",
        "Accepted by:",
        "View Status",
        "Loading your requests..."
    ];

    const { getTranslatedText } = usePageTranslation(staticTexts);
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    const tabs = [
        { id: 'all', label: getTranslatedText('All') },
        { id: 'pending', label: getTranslatedText('Pending') },
        { id: 'accepted', label: getTranslatedText('Accepted') },
        { id: 'completed', label: getTranslatedText('Completed') }
    ];

    useEffect(() => {
        const fetchSentRequests = async () => {
            try {
                setLoading(true);
                const response = await scrapperOrdersAPI.getMySentRequests();
                if (response.success && response.data?.orders) {
                    setRequests(response.data.orders);
                }
            } catch (error) {
                console.error("Failed to fetch sent requests:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSentRequests();
    }, []);

    const filteredRequests = activeTab === 'all' 
        ? requests 
        : requests.filter(req => req.status.toLowerCase() === activeTab.toLowerCase());

    const getStatusStyle = (status) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'accepted':
            case 'confirmed': return 'bg-blue-100 text-blue-700';
            case 'in_progress': return 'bg-sky-100 text-sky-700';
            case 'completed': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-rose-100 text-rose-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white sticky top-0 z-10 shadow-sm">
                <div className="p-4 flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/scrapper/profile', { replace: true })}
                        className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
                    >
                        <FaArrowLeft />
                    </button>
                    <div>
                        <h1 className="font-bold text-slate-800 text-lg uppercase tracking-tight">
                            {getTranslatedText("My Sent Requests")}
                        </h1>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
                                activeTab === tab.id ? 'text-sky-600' : 'text-slate-500'
                            }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div 
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-slate-500 text-sm">{getTranslatedText("Loading your requests...")}</p>
                    </div>
                ) : filteredRequests.length > 0 ? (
                    <div className="grid gap-4">
                        {filteredRequests.map((req) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={req._id}
                                onClick={() => navigate(`/scrapper/sent-request-status/${req._id}`)}
                                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 active:scale-[0.98] transition-transform"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getStatusStyle(req.status)}`}>
                                                {req.status}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                #{req._id.toString().slice(-6).toUpperCase()}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-800">
                                            {req.scrapItems?.map(i => i.category).join(', ') || 'Bulk Scrap'}
                                        </h3>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                                        <FaHistory />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <FaClock className="text-slate-300" />
                                        <span>{new Date(req.createdAt).toLocaleDateString()} • {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    
                                    {req.scrapper && (
                                        <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center text-[10px] font-bold text-white">
                                                    {req.scrapper.name?.[0]?.toUpperCase() || 'P'}
                                                </div>
                                                <span className="text-[11px] font-bold text-slate-700">{req.scrapper.name}</span>
                                            </div>
                                            <span className="text-[10px] text-sky-600 font-bold uppercase tracking-wider">{getTranslatedText("Accepted") }</span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-50">
                                        <div className="flex items-center gap-1 text-sky-600">
                                            <FaMapMarkerAlt size={10} />
                                            <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">
                                                {req.pickupAddress?.city || 'Partner Location'}
                                            </span>
                                        </div>
                                        <button className="text-xs font-bold text-sky-600 flex items-center gap-1">
                                            {getTranslatedText("View Status")} →
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-10">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-4">
                            <FaHistory size={24} />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-1">{getTranslatedText("No requests found")}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            {getTranslatedText("You haven't sent any bulk scrap requests yet.")}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MySentRequestsPage;
