import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaLocationArrow, FaSearchLocation } from 'react-icons/fa';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { useRef } from 'react';

const AddressInputPage = () => {
    const staticTexts = [
        "Pickup Address",
        "Step 4 of 5",
        "Getting Location...",
        "Get My Current Location",
        "Location Detected",
        "Latitude:",
        "Longitude:",
        "Pickup Address *",
        "Enter your complete pickup address (House/Flat No, Street, Landmark, City, Pincode)",
        "Please provide a detailed address so the scrapper can easily find your location",
        "Request Summary",
        "Categories:",
        "selected",
        "Images:",
        "uploaded",
        "Weight:",
        "kg",
        "Continue to Confirmation",
        "Please allow location access or enter manually",
        "Enter your pickup address to continue",
        "Geolocation is not supported by your browser",
        "Location permission denied. Please enable location access in your browser settings.",
        "Location information is unavailable.",
        "Location request timed out.",
        "An unknown error occurred.",
        "Please enter your pickup address",
        "Please allow location access or enter your location manually",
        "Enable Device Location",
        "To find your address automatically, please enable your device location and allow browser access.",
        "Enable Now",
        "Maybe Later",
        "Search your pickup location (e.g. Lajpat Nagar)",
    ];
    const { getTranslatedText } = usePageTranslation(staticTexts);
    const navigate = useNavigate();
    const [address, setAddress] = useState('');
    const [coordinates, setCoordinates] = useState(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [uploadedImages, setUploadedImages] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [weightData, setWeightData] = useState(null);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const autocompleteRef = useRef(null);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: ['places']
    });

    // Load data from sessionStorage
    useEffect(() => {
        const storedImages = sessionStorage.getItem('uploadedImages');
        const storedCategories = sessionStorage.getItem('selectedCategories');
        const storedWeight = sessionStorage.getItem('weightData');
        const storedAddress = sessionStorage.getItem('addressData');

        if (storedImages) setUploadedImages(JSON.parse(storedImages));
        if (storedCategories) setSelectedCategories(JSON.parse(storedCategories));
        if (storedWeight) setWeightData(JSON.parse(storedWeight));

        // Load saved address if exists
        if (storedAddress) {
            const addressData = JSON.parse(storedAddress);
            setAddress(addressData.address || '');
            setCoordinates(addressData.coordinates || null);
        }

        // Redirect if missing required data
        if (!storedCategories || !storedImages || !storedWeight) {
            navigate('/user/add-scrap/category');
        }
    }, [navigate]);

    // Persist address data whenever it changes
    useEffect(() => {
        if (address.trim() || coordinates) {
            const addressData = {
                address: address.trim(),
                coordinates: coordinates,
                timestamp: new Date().toISOString()
            };
            sessionStorage.setItem('addressData', JSON.stringify(addressData));
        }
    }, [address, coordinates]);

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError(getTranslatedText('Geolocation is not supported by your browser'));
            return;
        }

        setIsGettingLocation(true);
        setLocationError('');

        // Show permission prompt if needed (UI nudge)
        // Note: Browsers will still show their native prompt
        // This is a custom UI to explain "Enable device location"
        if (!coordinates && !sessionStorage.getItem('location_hint_shown')) {
            setShowPermissionModal(true);
            setIsGettingLocation(false);
            return;
        }

        performLocationFetch();
    };

    const performLocationFetch = () => {
        setIsGettingLocation(true);
        setLocationError('');
        setShowPermissionModal(false);
        sessionStorage.setItem('location_hint_shown', 'true');
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setCoordinates(coords);

                // Reverse geocode using Photon (Komoot) API - Free & High Detail
                try {
                    const response = await fetch(`https://photon.komoot.io/reverse?lat=${coords.lat}&lon=${coords.lng}`);
                    const data = await response.json();

                    if (data && data.features && data.features.length > 0) {
                        const props = data.features[0].properties;

                        // Construct address from available fields
                        const parts = [
                            props.housenumber,    // House/Building Number
                            props.street,         // Street Name
                            props.name,           // Building/Landmark Name
                            props.district,
                            props.city,           // City
                            props.state,          // State
                            props.postcode,       // Pincode
                            props.country         // Country
                        ].filter(Boolean); // Remove empty values

                        // Remove duplicates and join
                        const uniqueParts = [...new Set(parts)];
                        setAddress(uniqueParts.join(', '));
                    } else {
                        // Fallback if API returns no features
                        setAddress(`Lat: ${coords.lat.toFixed(6)}, Lng: ${coords.lng.toFixed(6)}`);
                    }
                } catch (error) {
                    console.error("Reverse geocoding error:", error);
                    // Fallback if API call fails
                    setAddress(`Lat: ${coords.lat.toFixed(6)}, Lng: ${coords.lng.toFixed(6)}`);
                } finally {
                    setIsGettingLocation(false);
                }
            },
            (error) => {
                console.error("Geolocation Error:", error);
                setIsGettingLocation(false);

                // Use standard error codes: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
                switch (error.code) {
                    case 1: // PERMISSION_DENIED
                        setLocationError(getTranslatedText('Browser blocked location. Please click the lock icon in your URL bar and select "Allow" for Location.'));
                        break;
                    case 2: // POSITION_UNAVAILABLE
                        setLocationError(getTranslatedText('Location information is unavailable.'));
                        break;
                    case 3: // TIMEOUT
                        setLocationError(getTranslatedText('Location request timed out.'));
                        break;
                    default:
                        // Log the specific unknown error message for debugging
                        console.error("Unknown location error:", error.message);
                        setLocationError(getTranslatedText('An unknown error occurred.'));
                        break;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 0
            }
        );
    };

    const handlePlaceSelect = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry) {
                const coords = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                };
                setCoordinates(coords);
                setAddress(place.formatted_address || '');
            }
        }
    };

    const handleContinue = () => {
        if (!address.trim()) {
            alert(getTranslatedText('Please enter your pickup address'));
            return;
        }

        if (!coordinates) {
            // ⚠️ Warn user but don't block — order can still be placed without GPS
            const proceed = window.confirm(
                'Location not detected. Without GPS, we cannot send your request to the NEAREST scrapper — any available scrapper may pick it up.\n\nContinue anyway?'
            );
            if (!proceed) return;
        }

        // Save address data to sessionStorage
        const addressData = {
            address: address.trim(),
            coordinates: coordinates, // null if not captured — handled gracefully in backend
            timestamp: new Date().toISOString()
        };
        sessionStorage.setItem('addressData', JSON.stringify(addressData));

        // Navigate to confirmation page
        navigate('/user/add-scrap/confirm');
    };

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
                    onClick={() => navigate('/user/add-scrap/upload')}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: '#2d3748' }}>
                        <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <h2
                    className="text-lg md:text-2xl font-bold"
                    style={{ color: '#2d3748' }}
                >
                    {getTranslatedText("Pickup Address")}
                </h2>
                <div className="w-10"></div> {/* Spacer for centering */}
            </div>

            {/* Progress Indicator */}
            <div className="px-3 md:px-6 pt-3 md:pt-4">
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'rgba(100, 148, 110, 0.2)' }}>
                        <motion.div
                            initial={{ width: '60%' }}
                            animate={{ width: '80%' }}
                            transition={{ duration: 0.5 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: '#38bdf8' }}
                        />
                    </div>
                    <span className="text-xs md:text-sm" style={{ color: '#718096' }}>{getTranslatedText("Step 4 of 5")}</span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-24 md:pb-6">
                {/* Location Button */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 md:mb-6"
                >
                    <button
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation}
                        className="w-full py-4 rounded-xl font-semibold text-base shadow-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                        style={{ backgroundColor: '#38bdf8', color: '#ffffff' }}
                    >
                        {isGettingLocation ? (
                            <>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                                />
                                {getTranslatedText("Getting Location...")}
                            </>
                        ) : (
                            <>
                                <FaLocationArrow />
                                {getTranslatedText("Get My Current Location")}
                            </>
                        )}
                    </button>
                </motion.div>

                {/* Add Search Bar for Address Suggestion */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="mb-4 md:mb-6"
                >
                    {isLoaded && (
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-sky-500">
                                <FaSearchLocation className="text-xl" />
                            </div>
                            <Autocomplete
                                onLoad={(ref) => (autocompleteRef.current = ref)}
                                onPlaceChanged={handlePlaceSelect}
                            >
                                <input
                                    type="text"
                                    placeholder={getTranslatedText("Search your pickup location (e.g. Lajpat Nagar)")}
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 bg-white font-medium text-sm md:text-base shadow-md focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition-all placeholder-gray-400"
                                    style={{ color: '#2d3748' }}
                                />
                            </Autocomplete>
                        </div>
                    )}
                </motion.div>

                {/* Location Error */}
                {locationError && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 rounded-xl"
                        style={{ backgroundColor: '#fee2e2' }}
                    >
                        <p className="text-sm" style={{ color: '#dc2626' }}>
                            {locationError}
                        </p>
                    </motion.div>
                )}

                {/* Coordinates Display */}
                {coordinates && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 rounded-xl"
                        style={{ backgroundColor: 'rgba(100, 148, 110, 0.1)' }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <FaMapMarkerAlt style={{ color: '#38bdf8' }} />
                            <p className="text-sm font-semibold" style={{ color: '#2d3748' }}>
                                {getTranslatedText("Location Detected")}
                            </p>
                        </div>
                        <p className="text-xs" style={{ color: '#718096' }}>
                            {getTranslatedText("Latitude:")} {coordinates.lat.toFixed(6)}
                        </p>
                        <p className="text-xs" style={{ color: '#718096' }}>
                            {getTranslatedText("Longitude:")} {coordinates.lng.toFixed(6)}
                        </p>
                    </motion.div>
                )}

                {/* Address Input */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl p-4 md:p-6 mb-4"
                    style={{ backgroundColor: '#ffffff' }}
                >
                    <label className="block text-sm md:text-base font-semibold mb-2" style={{ color: '#2d3748' }}>
                        {getTranslatedText("Pickup Address *")}
                    </label>
                    <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={getTranslatedText("Enter your complete pickup address (House/Flat No, Street, Landmark, City, Pincode)")}
                        rows={5}
                        className="w-full py-3 px-4 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all resize-none text-sm md:text-base"
                        style={{
                            borderColor: address ? '#38bdf8' : 'rgba(100, 148, 110, 0.3)',
                            color: '#2d3748',
                            backgroundColor: '#f9f9f9'
                        }}
                    />
                    <p className="text-xs mt-2" style={{ color: '#718096' }}>
                        {getTranslatedText("Please provide a detailed address so the scrapper can easily find your location")}
                    </p>
                </motion.div>

                {/* Summary Info */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl p-4 md:p-6"
                    style={{ backgroundColor: '#ffffff' }}
                >
                    <h3 className="text-base font-bold mb-3" style={{ color: '#2d3748' }}>
                        {getTranslatedText("Request Summary")}
                    </h3>
                    <div className="space-y-4">
                        {/* Categories & Weights Breakdown */}
                        <div className="space-y-2">
                            {selectedCategories.map((cat) => {
                                // Find weight for this category if non-negotiable
                                const weightInfo = weightData?.categoryWeights?.find(w => w.categoryId === cat.id);
                                const isNegotiable = weightData?.negotiableCategories?.some(nw => nw.categoryId === cat.id);

                                return (
                                    <div key={cat.id} className="flex justify-between items-start text-sm">
                                        <span style={{ color: '#718096' }}>{getTranslatedText(cat.name)}:</span>
                                        <span className="font-semibold text-right" style={{ color: '#2d3748' }}>
                                            {isNegotiable
                                                ? <span style={{ color: '#b45309' }}>{getTranslatedText("Negotiable")}</span>
                                                : weightInfo
                                                    ? `${weightInfo.weight} ${getTranslatedText("kg")}`
                                                    : `- ${getTranslatedText("kg")}`
                                            }
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="h-px bg-gray-100" />

                        <div className="flex justify-between text-sm">
                            <span style={{ color: '#718096' }}>{getTranslatedText("Images:")}</span>
                            <span className="font-semibold" style={{ color: '#2d3748' }}>
                                {uploadedImages.length} {getTranslatedText("uploaded")}
                            </span>
                        </div>

                        {!weightData?.negotiableCategories?.length && weightData?.weight > 0 && (
                            <div className="flex justify-between text-sm">
                                <span style={{ color: '#718096' }}>{getTranslatedText("Total Weight:")}</span>
                                <span className="font-semibold" style={{ color: '#38bdf8' }}>
                                    {weightData.weight} {getTranslatedText("kg")}
                                </span>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Footer with Continue Button - Fixed on Mobile */}
            <div
                className="fixed md:relative bottom-0 left-0 right-0 p-3 md:p-6 border-t z-50"
                style={{
                    borderColor: 'rgba(100, 148, 110, 0.2)',
                    backgroundColor: '#f4ebe2'
                }}
            >
                {address.trim() ? (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={handleContinue}
                        className="w-full py-3 md:py-4 rounded-full text-white font-semibold text-sm md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        style={{ backgroundColor: coordinates ? '#38bdf8' : '#f59e0b' }}
                    >
                        {coordinates
                            ? getTranslatedText("Continue to Confirmation")
                            : '⚠️ Continue without GPS Location'}
                    </motion.button>
                ) : (
                    <p
                        className="text-xs md:text-sm text-center"
                        style={{ color: '#718096' }}
                    >
                        {!coordinates
                            ? getTranslatedText('Please allow location access or enter manually')
                            : getTranslatedText('Enter your pickup address to continue')}
                    </p>
                )}
            </div>
            {/* Location Permission Modal */}
            <AnimatePresence>
                {showPermissionModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                        >
                            <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaLocationArrow className="text-2xl text-sky-500" />
                            </div>
                            <h3 className="text-xl font-bold text-center mb-2" style={{ color: '#2d3748' }}>
                                {getTranslatedText("Enable Device Location")}
                            </h3>
                            <p className="text-sm text-center mb-6" style={{ color: '#718096' }}>
                                {getTranslatedText("To find your address automatically, please enable your device location and allow browser access.")}
                            </p>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={performLocationFetch}
                                    className="w-full py-3 rounded-xl bg-sky-500 text-white font-bold shadow-lg shadow-sky-200"
                                >
                                    {getTranslatedText("Enable Now")}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPermissionModal(false);
                                        setIsGettingLocation(false);
                                    }}
                                    className="w-full py-3 rounded-xl border border-gray-200 text-gray-500 font-semibold"
                                >
                                    {getTranslatedText("Maybe Later")}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AddressInputPage;

