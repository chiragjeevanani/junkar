import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import { motion } from 'framer-motion';

const ScrapperPartnerListPage = () => {
    const { getTranslatedText } = usePageTranslation(["Select Partners", "Done"]);
    const navigate = useNavigate();
    const location = useLocation();

    // Data passed from SellScrapPage
    const initialState = location.state || {
        categories: [],             // to preserve form state
        categoryWeights: {},        // to preserve form state
        selectedPartnerIds: [],
        citySearchQuery: '',
        citySearchResults: []       // all Scrappers returned from the API
    };

    const [selectedPartnerIds, setSelectedPartnerIds] = useState(initialState.selectedPartnerIds);
    const searchResults = initialState.citySearchResults;
    const city = initialState.citySearchQuery;

    const handlePartnerToggle = (partnerId) => {
        if (selectedPartnerIds.includes(partnerId)) {
            setSelectedPartnerIds(selectedPartnerIds.filter(id => id !== partnerId));
        } else {
            setSelectedPartnerIds([...selectedPartnerIds, partnerId]);
        }
    };

    const handleSave = () => {
        // Pass back all form state along with updated partner selections
        navigate('/scrapper/sell-scrap', {
            state: {
                ...initialState,
                selectedPartnerIds
            }
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 p-3 pb-24">
            <header className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={handleSave} className="p-2 bg-white rounded-full shadow-sm">
                        ⬅️
                    </button>
                    <h1 className="text-xl font-bold text-slate-800 line-clamp-1">Partners in "{city}"</h1>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    className="px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg shadow-sm flex-shrink-0"
                >
                    {getTranslatedText("Done")}
                </motion.button>
            </header>

            <section className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-xs text-slate-500 mb-4">{searchResults.length} partner(s) found in {city}. Select the ones you want to send your request to.</p>
                <div className="flex flex-col gap-3">
                    {searchResults.map(partner => (
                        <div
                            key={partner._id}
                            onClick={() => handlePartnerToggle(partner._id)}
                            className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedPartnerIds.includes(partner._id)
                                ? 'border-sky-500 bg-sky-50 shadow-sm'
                                : 'border-slate-100 hover:border-sky-200 bg-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl shadow-inner relative flex-shrink-0">
                                    🏢
                                    <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${partner.isOnline ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-slate-800 line-clamp-1">{partner.name || 'Partner'}</p>
                                        {!partner.isOnline && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded font-medium uppercase tracking-tight">Offline</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                            ⭐ {partner.rating?.average || '0.0'} ({partner.rating?.count || 0})
                                        </span>
                                    </div>
                                    {partner.businessLocation?.city && (
                                        <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-1 italic max-w-[200px]">
                                            📍 {partner.businessLocation.city}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${selectedPartnerIds.includes(partner._id)
                                ? 'border-sky-500 bg-sky-500'
                                : 'border-slate-300 bg-white'
                                }`}>
                                {selectedPartnerIds.includes(partner._id) && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default ScrapperPartnerListPage;
