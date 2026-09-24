import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderAPI, uploadAPI, publicAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const SellScrapPage = () => {
    const { getTranslatedText } = usePageTranslation(["Sell Bulk Scrap", "Select Categories", "Approx Weight (kg)", "Upload Images", "Self-delivery to Partner's Location", "Create Request", "Processing...", "Request Created Successfully!", "Self-delivery to Wholesaler's Location", "Nearby Wholesalers"]);
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [categoryWeights, setCategoryWeights] = useState({});
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [nearbyPartners, setNearbyPartners] = useState([]);
    const [selectedPartnerIds, setSelectedPartnerIds] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [isLocating, setIsLocating] = useState(false);

    // City Search States
    const [citySearchQuery, setCitySearchQuery] = useState('');
    const [citySearchResults, setCitySearchResults] = useState([]);
    const [isSearchingCity, setIsSearchingCity] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);

    // Role detection
    const scrapperUserStr = localStorage.getItem('scrapperUser');
    let scrapperRole = 'dukandaar'; // default
    if (scrapperUserStr) {
        const scrapperUser = JSON.parse(scrapperUserStr);
        scrapperRole = scrapperUser.scrapperType || scrapperRole;
    }

    const location = useLocation();
    
    // Helper to render icon correctly
    const renderCategoryIcon = (iconStr, name) => {
        if (!iconStr) return <span>📦</span>;
        if (iconStr.startsWith('http') || iconStr.startsWith('/')) {
            return <img src={iconStr} alt={name || 'Category'} className="w-8 h-8 object-contain" />;
        }
        return <span>{iconStr}</span>;
    };

    // Dynamic categories from backend
    const [availableCategories, setAvailableCategories] = useState([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);

    // Initialize state from location if returning from View All pages
    useEffect(() => {
        if (location.state) {
            if (location.state.categories) setCategories(location.state.categories);
            if (location.state.categoryWeights) setCategoryWeights(location.state.categoryWeights);
            if (location.state.selectedPartnerIds) setSelectedPartnerIds(location.state.selectedPartnerIds);
            if (location.state.citySearchQuery) {
                setCitySearchQuery(location.state.citySearchQuery);
                setCitySearchResults(location.state.citySearchResults || []);
                setSearchPerformed(true);
            }
        }
    }, [location.state]);

    // Fetch dynamic categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                // Get role from local storage
                const role = scrapperRole;

                const response = await publicAPI.getScrapperCategories(role);
                if (response.success && response.data?.categories) {
                    // Fallback icons if no image is provided by backend
                    const defaultIcons = {
                        plastic: '🥤', metal: '⚙️', paper: '📄', 
                        electronic: '🔌', default: '📦'
                    };
                    const formatCategoryName = (name) => {
                        if(!name) return '';
                        const fixes = {
                            'Bettry': 'Battery', 'Leptop': 'Laptop', 'Human haire': 'Human Hair',
                            'Iran / MS Scrap / Lokhand': 'Iron / MS Scrap / Lokhand', 
                            'Iran / MS Scrap / Lokhan': 'Iron / MS Scrap / Lokhand',
                            'Ac': 'AC', 'Fridge Defridge': 'Fridge / Deep Freezer',
                            '4 Wheelers comercial vehicle': '4 Wheelers Commercial Vehicles',
                            '4 Wheelers Comercial Vehicles': '4 Wheelers Commercial Vehicles'
                        };
                        if(fixes[name]) return fixes[name];
                        return name.replace('Bettry', 'Battery').replace('Leptop', 'Laptop').replace('Human haire', 'Human Hair').replace('Iran', 'Iron').replace('Comercial', 'Commercial');
                    };

                    const formattedCategories = response.data.categories.map(cat => ({
                        ...cat,
                        name: formatCategoryName(cat.name),
                        // Store only strings: URL or emoji
                        icon: cat.icon ? cat.icon : (defaultIcons[cat.id] || defaultIcons.default)
                    }));
                    setAvailableCategories(formattedCategories);
                }
            } catch (error) {
                console.error("Failed to fetch scrapper categories", error);
                // Fallback to empty or could provide basic static list
            } finally {
                setIsLoadingCategories(false);
            }
        };

        fetchCategories();
    }, []);

    const handleCategoryToggle = (catId) => {
        if (categories.includes(catId)) {
            setCategories(categories.filter(c => c !== catId));
            const newWeights = { ...categoryWeights };
            delete newWeights[catId];
            setCategoryWeights(newWeights);
        } else {
            setCategories([...categories, catId]);
            setCategoryWeights({ ...categoryWeights, [catId]: '' });
        }
    };

    const handleWeightChange = (catId, value) => {
        setCategoryWeights({ ...categoryWeights, [catId]: value });
    };

    // Calculate Total Weight for UI display
    const totalWeightCalculated = Object.values(categoryWeights).reduce((sum, w) => sum + (Number(w) || 0), 0);

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setLoading(true);
        try {
            const response = await uploadAPI.uploadOrderImages(files);
            if (response.success) {
                setImages([...images, ...response.data.files]);
            }
        } catch (error) {
            console.error("Upload failed", error);
            alert("Image upload failed");
        } finally {
            setLoading(false);
        }
    };

    // Discovery Logic: Get nearby partners
    useEffect(() => {
        const fetchNearbyPartners = async (lat, lng) => {
            try {
                const { scrapperProfileAPI } = await import('../../shared/utils/api');
                const response = await scrapperProfileAPI.getNearbyBig(lat, lng);
                if (response.success) {
                    setNearbyPartners(response.data.scrappers);
                }
            } catch (error) {
                console.error("Failed to fetch nearby partners", error);
            }
        };

        if (navigator.geolocation) {
            setIsLocating(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ latitude, longitude });
                    fetchNearbyPartners(latitude, longitude);
                    setIsLocating(false);
                },
                (error) => {
                    console.error("Geolocation error", error);
                    setIsLocating(false);
                }
            );
        }
    }, []);

    // Auto-search when city search query changes (debounced)
    useEffect(() => {
        const query = citySearchQuery.trim();
        const timeoutId = setTimeout(async () => {
            if (query.length >= 2) {
                setIsSearchingCity(true);
                setSearchPerformed(true);
                try {
                    const { scrapperProfileAPI } = await import('../../shared/utils/api');
                    const response = await scrapperProfileAPI.searchByCity(query);
                    if (response.success) {
                        setCitySearchResults(response.data.scrappers);
                    }
                } catch (error) {
                    console.error("City search failed:", error);
                    setCitySearchResults([]);
                } finally {
                    setIsSearchingCity(false);
                }
            } else if (query.length === 0) {
                setCitySearchResults([]);
                setSearchPerformed(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [citySearchQuery]);

    const handlePartnerToggle = (partnerId) => {
        if (selectedPartnerIds.includes(partnerId)) {
            setSelectedPartnerIds(selectedPartnerIds.filter(id => id !== partnerId));
        } else {
            setSelectedPartnerIds([...selectedPartnerIds, partnerId]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (categories.length === 0) {
            alert("Please select at least one category (Plastic, Metal, etc.) at the top.");
            return;
        }

        const missingWeight = categories.some(catId => !categoryWeights[catId] || Number(categoryWeights[catId]) <= 0);
        if (missingWeight) {
            alert("Please enter a valid weight for all selected categories.");
            return;
        }

        setLoading(true);
        try {
            const scrapItems = categories.map(catId => ({
                category: catId,
                weight: Number(categoryWeights[catId]),
                rate: 0,
                total: 0
            }));

            const payload = {
                scrapItems: scrapItems,
                totalWeight: totalWeightCalculated,
                pickupAddress: { 
                    street: 'Self-delivery',
                    coordinates: {
                        lat: userLocation?.latitude || 22.7196, // Fallback to Indore/Dev location if null
                        lng: userLocation?.longitude || 75.8577
                    }
                },
                images: images,
                quantityType: 'large',
                targetScrapperIds: selectedPartnerIds,
                notes: 'Scrapper Bulk Request'
            };

            const response = await orderAPI.create(payload);
            if (response.success) {
                alert(getTranslatedText("Request Created Successfully!"));
                navigate('/scrapper/my-sent-requests', { replace: true });
            }
        } catch (error) {
            console.error("Creation failed", error);
            alert(error.message || "Failed to create request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-3 pb-24">
            <header className="mb-4 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm">
                    ⬅️
                </button>
                <h1 className="text-xl font-bold text-slate-800">{getTranslatedText("Sell Bulk Scrap")}</h1>
            </header>

            <form onSubmit={handleSubmit} className="space-y-3">
                {/* Categories */}
                <section className="bg-white p-3.5 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-2.5">
                        <h2 className="text-sm font-semibold text-slate-700">{getTranslatedText("Select Categories")}</h2>
                        {availableCategories.length > 5 && (
                            <button
                                type="button"
                                onClick={() => navigate('/scrapper/sell-scrap/categories', { 
                                    state: { 
                                        categories, 
                                        categoryWeights,
                                        availableCategories // Pass the full list to avoid refetching
                                    } 
                                })}
                                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                            >
                                View All <span>→</span>
                            </button>
                        )}
                    </div>
                    
                    {isLoadingCategories ? (
                        <div className="flex justify-center p-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2.5">
                            {availableCategories.slice(0, 5).map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleCategoryToggle(cat.id)}
                                className={`p-2.5 rounded-lg flex flex-col items-center gap-1.5 border-2 transition-all ${categories.includes(cat.id)
                                    ? 'border-sky-500 bg-sky-50 text-sky-700'
                                    : 'border-slate-200 bg-slate-50 text-slate-500'
                                    }`}
                            >
                                <span className="text-2xl">{renderCategoryIcon(cat.icon, cat.name)}</span>
                                <span className="text-xs font-medium">{cat.name}</span>
                            </button>
                            ))}
                        </div>
                    )}
                </section>

                {/* Weight Inputs (Dynamic per category) */}
                {categories.length > 0 && (
                    <section className="bg-white p-3.5 rounded-xl shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-700">{getTranslatedText("Approx Weight (kg)")}</h2>
                            {totalWeightCalculated > 0 && (
                                <div className="bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                                    <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">Total: {totalWeightCalculated} KG</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            {categories.map(catId => {
                                const catInfo = availableCategories.find(c => c.id === catId);
                                return (
                                    <div key={catId} className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-xl shadow-sm">
                                            {renderCategoryIcon(catInfo?.icon, catInfo?.name)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">{catInfo?.name}</p>
                                            <div className="relative mt-0.5">
                                                <input
                                                    type="number"
                                                    value={categoryWeights[catId] || ''}
                                                    onChange={(e) => handleWeightChange(catId, e.target.value)}
                                                    placeholder="0"
                                                    className="w-full bg-transparent border-b-2 border-slate-200 focus:border-sky-500 outline-none py-1 font-bold text-slate-700 transition-colors"
                                                    required
                                                />
                                                <span className="absolute right-0 bottom-1 text-[10px] font-bold text-slate-400">KG</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Self Delivery Notice Box */}
                <section className="bg-sky-50 p-4 rounded-xl border-l-4 border-sky-500 shadow-sm flex items-start gap-3">
                    <div className="mt-0.5">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-sky-900 leading-tight">
                            {scrapperRole === 'dukandaar' ? getTranslatedText("Self-delivery to Wholesaler's Location") : getTranslatedText("Self-delivery to Partner's Location")}
                        </h2>
                        <p className="text-[11px] text-sky-700 mt-1 font-medium italic">
                            Note: No pickup will be provided. You (Retailer) must deliver scrap to the {scrapperRole === 'dukandaar' ? 'wholesaler' : 'partner'} after acceptance.
                        </p>
                    </div>
                </section>

                {/* Nearby Partners Discovery */}
                <section className="bg-white p-3.5 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-slate-700">
                            {scrapperRole === 'dukandaar' ? getTranslatedText("Nearby Wholesalers") : getTranslatedText("Nearby Partners")}
                        </h2>
                        {isLocating && <span className="text-[10px] text-sky-500 animate-pulse">Locating...</span>}
                    </div>

                    {nearbyPartners.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                            {nearbyPartners.map(partner => (
                                <div
                                    key={partner._id}
                                    onClick={() => handlePartnerToggle(partner._id)}
                                    className={`p-3 rounded-lg border-2 transition-all flex items-center justify-between cursor-pointer ${selectedPartnerIds.includes(partner._id)
                                        ? 'border-sky-500 bg-sky-50'
                                        : 'border-slate-100 bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm relative">
                                            🏢
                                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${partner.receptionMode ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-xs font-bold text-slate-800">{partner.name || 'Big Scrapper'}</p>
                                                {!partner.receptionMode && (
                                                    <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-medium uppercase tracking-tight">Offline</span>
                                                )}
                                                {partner.receptionMode && (
                                                    <span className="text-[9px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded font-bold uppercase tracking-tight">Ready</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                                                    ⭐ {partner.rating?.average || '0.0'}
                                                </span>
                                                <span className="text-[10px] text-sky-600 font-semibold">{partner.distance?.toFixed(1) || '0.0'} km (Store)</span>
                                            </div>
                                            {partner.businessLocation?.address && (
                                                <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic max-w-[200px]">
                                                    📍 {partner.businessLocation.address}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedPartnerIds.includes(partner._id)
                                        ? 'border-sky-500 bg-sky-500'
                                        : 'border-slate-300 bg-white'
                                        }`}>
                                        {selectedPartnerIds.includes(partner._id) && (
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-lg">
                            <p className="text-xs text-slate-400 italic">
                                {isLocating ? 'Searching for nearby partners...' : 'No partners found nearby yet.'}
                            </p>
                        </div>
                    )}
                    {selectedPartnerIds.length > 0 && (
                        <p className="mt-2.5 text-[11px] text-green-600 font-medium flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            Direct request will be sent to {selectedPartnerIds.length} partner(s)
                        </p>
                    )}
                </section>

                {/* City Search Block - Hidden for Wholesalers */}
                {scrapperRole !== 'wholesaler' && (
                    <section className="bg-white p-3.5 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-sm font-semibold text-slate-700">Search by City</h2>
                            {isSearchingCity && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-500"></div>
                            )}
                        </div>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={citySearchQuery}
                                onChange={(e) => setCitySearchQuery(e.target.value)}
                                placeholder="E.g., Indore"
                                className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 transition-colors"
                            />
                            {citySearchResults.length > 3 && (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    type="button"
                                    onClick={() => navigate('/scrapper/sell-scrap/partners', {
                                        state: {
                                            categories,
                                            categoryWeights,
                                            selectedPartnerIds,
                                            citySearchQuery,
                                            citySearchResults
                                        }
                                    })}
                                    className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-1 shadow-sm"
                                >
                                    View All <span>→</span>
                                </motion.button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                            {searchPerformed && citySearchResults.length === 0 ? (
                                <div className="py-4 text-center border-2 border-dashed border-slate-100 rounded-lg">
                                    <p className="text-xs text-slate-400 italic">No partners found in "{citySearchQuery}"</p>
                                </div>
                            ) : (
                                citySearchResults.slice(0, 3).map(partner => (
                                    <div
                                        key={partner._id}
                                        onClick={() => handlePartnerToggle(partner._id)}
                                        className={`flex items-center justify-between p-2.5 rounded-lg border-2 cursor-pointer transition-all ${selectedPartnerIds.includes(partner._id)
                                            ? 'border-sky-500 bg-sky-50 shadow-sm'
                                            : 'border-slate-100 hover:border-sky-200 bg-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl shadow-inner relative">
                                                🏢
                                                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white shadow-sm ${partner.receptionMode ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{partner.name || 'Partner'}</p>
                                                    {!partner.receptionMode && (
                                                        <span className="text-[9px] px-1 py-0.5 bg-slate-200 text-slate-500 rounded font-medium uppercase tracking-tight">Offline</span>
                                                    )}
                                                    {partner.receptionMode && (
                                                        <span className="text-[9px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded font-bold uppercase tracking-tight">Ready</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                                                        ⭐ {partner.rating?.average || '0.0'}
                                                    </span>
                                                </div>
                                                {partner.businessLocation?.city && (
                                                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic max-w-[200px]">
                                                        📍 {partner.businessLocation.city}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedPartnerIds.includes(partner._id)
                                            ? 'border-sky-500 bg-sky-500'
                                            : 'border-slate-300 bg-white'
                                            }`}>
                                            {selectedPartnerIds.includes(partner._id) && (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                )}

                {/* Images */}
                <section className="bg-white p-3.5 rounded-xl shadow-sm">
                    <h2 className="text-sm font-semibold mb-2.5 text-slate-700">{getTranslatedText("Upload Images")}</h2>
                    <div className="flex gap-2.5 overflow-x-auto pb-2">
                        <label className="w-20 h-20 flex-shrink-0 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-colors">
                            <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                            <span className="text-3xl">+</span>
                        </label>
                        {images.map((img, idx) => (
                            <img key={idx} src={img.url} alt="preview" className="w-20 h-20 object-cover rounded-lg border-2 border-slate-200" />
                        ))}
                    </div>
                </section>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-sky-600 text-white rounded-xl font-bold text-base shadow-lg disabled:opacity-50 hover:bg-sky-700 transition-colors"
                >
                    {loading ? getTranslatedText("Processing...") : getTranslatedText("Create Request")}
                </motion.button>
            </form>
        </div>
    );
};

export default SellScrapPage;
