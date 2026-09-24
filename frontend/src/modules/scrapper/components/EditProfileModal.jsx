import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import { scrapperProfileAPI, uploadAPI, publicAPI } from '../../shared/utils/api';
import { useAuth } from '../../shared/context/AuthContext';

const EditProfileModal = ({ isOpen, onClose, initialData, onSuccess }) => {
    const staticTexts = [
        "Edit Profile",
        "Update your personal and vehicle details",
        "Name",
        "Vehicle Type",
        "Vehicle Number",
        "Save Changes",
        "Cancel",
        "Saving...",
        "Bike",
        "Truck",
        "Van",
        "Three Wheeler",
        "Other",
        "Profile updated successfully",
        "Failed to update profile",
        "Enter valid vehicle number",
        "Vehicle photo",
        "Click to upload vehicle photo",
        "Uploading photo...",
        "Business Address",
        "Address can only be changed via request. Admin will review.",
        "Request Address Change",
        "New address (required)",
        "Submit Request",
        "Request submitted. Admin will review and update your location.",
        "Failed to submit request",
        "You already have a pending request.",
        "Name should only contain letters",
        "Minimum 3 characters required",
        "Enter valid vehicle number (e.g. DL10AB1234)"
    ];
    const { getTranslatedText } = usePageTranslation(staticTexts);
    const { user } = useAuth();
    const autocompleteRef = useRef(null);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: ['places']
    });

    const [formData, setFormData] = useState({
        name: '',
        vehicleType: 'bike',
        vehicleNumber: '',
        vehiclePhotoUrl: '',
        businessAddress: '',
        city: '',
        state: '',
        businessCoordinates: null,
        dealCategories: []
    });
    const [vehiclePhotoFile, setVehiclePhotoFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [availableCategories, setAvailableCategories] = useState([]);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [requestAddress, setRequestAddress] = useState('');
    const [requestCoordinates, setRequestCoordinates] = useState(null);
    const [requestCity, setRequestCity] = useState('');
    const [requestState, setRequestState] = useState('');
    const [requestLoading, setRequestLoading] = useState(false);
    const requestAutocompleteRef = useRef(null);

    // vehicle types options
    const vehicleTypes = ['cycle', 'thela', 'e_rickshaw', 'tempo', 'bike', 'auto', 'truck'];

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                vehicleType: initialData.vehicleInfo?.type || 'bike',
                vehicleNumber: initialData.vehicleInfo?.number || '',
                vehiclePhotoUrl: initialData.vehicleInfo?.photoUrl || '',
                businessAddress: initialData.businessLocation?.address || '',
                city: initialData.businessLocation?.city || '',
                state: initialData.businessLocation?.state || '',
                businessCoordinates: initialData.businessLocation?.coordinates || null,
                dealCategories: initialData.dealCategories || []
            });
            setVehiclePhotoFile(null);
        }
    }, [initialData, isOpen]);

    // Fetch dynamic categories from admin price feed based on scrapper role
    useEffect(() => {
        const role = initialData?.scrapperType;
        if (!role || !['dukandaar', 'wholesaler', 'industrial'].includes(role)) return;

        const fetchCategories = async () => {
            try {
                const response = await publicAPI.getScrapperCategories(role);
                if (response.success && response.data?.categories?.length > 0) {
                    const iconMap = {
                        'Paper': '📄', 'Plastic': '♻️', 'Metal': '⛓️',
                        'Electronics': '💻', 'Furniture': '🪑', 'Iron': '⛓️',
                        'Copper': '⛓️', 'Battery': '🔋', 'Others': '📦'
                    };
                    
                    // Custom normalization to match what backend saves
                    const normalizeCat = (val) => {
                        const lower = String(val).toLowerCase().trim();
                        if (['paper', 'raddi', 'paper / raddi'].includes(lower)) return 'paper';
                        if (['electronics', 'electronic', 'e-waste', 'e_waste'].includes(lower)) return 'electronic';
                        if (['others', 'furniture', 'furniture / others', 'vehicle scrap', 'vehicle_scrap', 'home appliance', 'home_appliance'].includes(lower)) return 'furniture';
                        return lower;
                    };

                    setAvailableCategories(response.data.categories.map(c => ({
                        id: normalizeCat(c.name),
                        originalName: c.name,
                        label: c.name,
                        icon: c.icon || iconMap[c.name] || '♻️'
                    })));
                }
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };

        fetchCategories();
    }, [initialData?.scrapperType]);

    const handlePlaceSelect = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry) {
                // Extract City and State
                const components = place.address_components || [];
                let city = '';
                let state = '';
                components.forEach(c => {
                    if (c.types.includes('locality')) city = c.long_name;
                    if (c.types.includes('administrative_area_level_1')) state = c.long_name;
                });

                setFormData({
                    ...formData,
                    businessAddress: place.formatted_address,
                    city: city,
                    state: state,
                    businessCoordinates: [
                        place.geometry.location.lng(),
                        place.geometry.location.lat()
                    ]
                });
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Name Validation: Only letters and spaces, min 3 chars
        const nameRegex = /^[a-zA-Z\s]+$/;
        const trimmedName = formData.name.trim();
        if (!trimmedName) {
            setError(getTranslatedText("Name is required"));
            setLoading(false);
            return;
        }
        if (!nameRegex.test(trimmedName)) {
            setError(getTranslatedText("Name should only contain letters"));
            setLoading(false);
            return;
        }
        if (trimmedName.length < 3) {
            setError(getTranslatedText("Minimum 3 characters required"));
            setLoading(false);
            return;
        }

        // Vehicle Number Validation: Indian Standard Regex
        // Format: DL 10 AB 1234 (Spaces optional but allowed here for validation)
        const vehicleRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/;
        const sanitizedVehicle = formData.vehicleNumber.trim().replace(/\s+/g, '').toUpperCase();
        
        if (!sanitizedVehicle) {
            setError(getTranslatedText("Enter valid vehicle number"));
            setLoading(false);
            return;
        }

        // Validate only for motorized vehicles (Cycle/Thela might not have registered numbers)
        if (!['cycle', 'thela'].includes(formData.vehicleType)) {
            if (!vehicleRegex.test(sanitizedVehicle)) {
                setError(getTranslatedText("Enter valid vehicle number (e.g. DL10AB1234)"));
                setLoading(false);
                return;
            }
        }

        try {
            let photoUrl = formData.vehiclePhotoUrl ? formData.vehiclePhotoUrl : null;
            if (vehiclePhotoFile) {
                const uploadRes = await uploadAPI.uploadOrderImages([vehiclePhotoFile]);
                const files = uploadRes.data?.files || [];
                if (files[0]?.url) photoUrl = files[0].url;
            }

            const payload = {
                name: trimmedName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' '),
                vehicleInfo: {
                    type: formData.vehicleType,
                    number: sanitizedVehicle, // Standardize to uppercase and no spaces
                    photoUrl: photoUrl ?? null
                },
                dealCategories: formData.dealCategories,
                city: formData.city,
                state: formData.state
            };

            // Only big can update businessLocation from here; dukandaar/wholesaler use "Request Address Change"
            if (initialData?.scrapperType === 'big') {
                payload.businessLocation = {
                    type: 'Point',
                    coordinates: formData.businessCoordinates || [0, 0],
                    address: formData.businessAddress
                };
            }

            const response = await scrapperProfileAPI.updateMyProfile(payload);

            if (response.success) {
                // Success
                onSuccess(response.data.scrapper); // Pass back updated object
                onClose();
            } else {
                setError(response.message || getTranslatedText("Failed to update profile"));
            }
        } catch (err) {
            console.error('Update profile error:', err);
            setError(err.message || getTranslatedText("Failed to update profile"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-md max-h-[90vh] rounded-2xl shadow-xl overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <div className="min-w-0">
                                    <h3 className="font-bold text-lg text-slate-800 truncate">{getTranslatedText("Edit Profile")}</h3>
                                    <p className="text-xs text-slate-500">{getTranslatedText("Update your personal and vehicle details")}</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="flex-shrink-0 p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-600"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Body - scrollable */}
                            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                                <div className="flex-1 min-h-0 min-w-0 overflow-y-auto p-6 space-y-4">
                                    {error && (
                                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    {/* Name */}
                                    <div className="space-y-1.5 min-w-0">
                                        <label className="text-sm font-medium text-slate-700 block">
                                            {getTranslatedText("Name")}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all text-slate-800"
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    {/* Vehicle Type */}
                                    <div className="space-y-1.5 min-w-0">
                                        <label className="text-sm font-medium text-slate-700 block">
                                            {getTranslatedText("Vehicle Type")}
                                        </label>
                                        <div className="grid gap-2 min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                                            {vehicleTypes.map(type => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, vehicleType: type })}
                                                    className={`min-w-0 px-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all border truncate ${formData.vehicleType === type
                                                        ? 'bg-sky-50 border-sky-500 text-sky-700'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <span className="capitalize block truncate">{type.replace('_', ' ')}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Vehicle Number */}
                                    <div className="space-y-1.5 min-w-0">
                                        <label className="text-sm font-medium text-slate-700 block">
                                            {getTranslatedText("Vehicle Number")}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.vehicleNumber}
                                            onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all text-slate-800 uppercase"
                                            placeholder="UP14 AB 1234"
                                        />
                                    </div>

                                    {/* Vehicle Photo */}
                                    <div className="space-y-1.5 min-w-0">
                                        <label className="text-sm font-medium text-slate-700 block">
                                            {getTranslatedText("Vehicle photo")}
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <label className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors overflow-hidden">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0];
                                                        if (f) setVehiclePhotoFile(f);
                                                    }}
                                                />
                                                {(vehiclePhotoFile || formData.vehiclePhotoUrl) ? (
                                                    <img
                                                        src={vehiclePhotoFile ? URL.createObjectURL(vehiclePhotoFile) : formData.vehiclePhotoUrl}
                                                        alt="Vehicle"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-slate-400 text-xs text-center px-1">{getTranslatedText("Click to upload vehicle photo")}</span>
                                                )}
                                            </label>
                                            {(vehiclePhotoFile || formData.vehiclePhotoUrl) && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setVehiclePhotoFile(null); setFormData(prev => ({ ...prev, vehiclePhotoUrl: '' })); }}
                                                    className="text-xs text-slate-500 hover:text-red-600"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Business Location (B2B): dukandaar/wholesaler/industrial = read-only + Request; big = editable */}
                                    {['big', 'dukandaar', 'wholesaler', 'industrial'].includes(initialData?.scrapperType) && (
                                        <div className="pt-2 border-t border-slate-100 space-y-3 min-w-0">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Business Details (B2B)</p>

                                            {['dukandaar', 'wholesaler', 'industrial'].includes(initialData?.scrapperType) ? (
                                                <>
                                                    <div className="space-y-1.5">
                                                        <label className="text-sm font-medium text-slate-700 block">{getTranslatedText("Business Address")}</label>
                                                        <p className="text-sm text-slate-600 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
                                                            {formData.businessAddress || '—'}
                                                        </p>
                                                        <p className="text-xs text-slate-500">{getTranslatedText("Address can only be changed via request. Admin will review.")}</p>
                                                    </div>
                                                    {!showRequestForm ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowRequestForm(true)}
                                                            className="w-full py-2.5 rounded-xl border-2 border-sky-500 bg-sky-50 text-sky-700 font-medium flex items-center justify-center gap-2"
                                                        >
                                                            {getTranslatedText("Request Address Change")}
                                                        </button>
                                                    ) : (
                                                        <div className="space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                                                            <label className="text-sm font-medium text-slate-700 block">{getTranslatedText("New address (required)")}</label>
                                                            {isLoaded ? (
                                                                <Autocomplete
                                                                    onLoad={(ref) => { requestAutocompleteRef.current = ref; }}
                                                                    onPlaceChanged={() => {
                                                                        const place = requestAutocompleteRef.current?.getPlace();
                                                                        if (place?.geometry) {
                                                                            setRequestAddress(place.formatted_address || '');
                                                                            setRequestCoordinates([place.geometry.location.lng(), place.geometry.location.lat()]);

                                                                            const components = place.address_components || [];
                                                                            let city = '';
                                                                            let state = '';
                                                                            components.forEach(c => {
                                                                                if (c.types.includes('locality')) city = c.long_name;
                                                                                if (c.types.includes('administrative_area_level_1')) state = c.long_name;
                                                                            });
                                                                            setRequestCity(city);
                                                                            setRequestState(state);
                                                                        }
                                                                    }}
                                                                >
                                                                    <input
                                                                        type="text"
                                                                        value={requestAddress}
                                                                        onChange={(e) => setRequestAddress(e.target.value)}
                                                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800"
                                                                        placeholder="Search new address"
                                                                    />
                                                                </Autocomplete>
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    value={requestAddress}
                                                                    onChange={(e) => setRequestAddress(e.target.value)}
                                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800"
                                                                    placeholder="Enter new address"
                                                                />
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (navigator.geolocation) {
                                                                        navigator.geolocation.getCurrentPosition(
                                                                            (pos) => setRequestCoordinates([pos.coords.longitude, pos.coords.latitude]),
                                                                            () => alert('Failed to get location')
                                                                        );
                                                                    }
                                                                }}
                                                                className="w-full py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm"
                                                            >
                                                                Use current location
                                                            </button>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { setShowRequestForm(false); setRequestAddress(''); setRequestCoordinates(null); }}
                                                                    className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={requestLoading || !requestAddress.trim()}
                                                                    onClick={async () => {
                                                                        setRequestLoading(true);
                                                                        try {
                                                                            const res = await scrapperProfileAPI.requestAddressChange({
                                                                                address: requestAddress.trim(),
                                                                                coordinates: requestCoordinates || [0, 0],
                                                                                city: requestCity,
                                                                                state: requestState
                                                                            });
                                                                            if (res.success) {
                                                                                alert(getTranslatedText("Request submitted. Admin will review and update your location."));
                                                                                setShowRequestForm(false);
                                                                                setRequestAddress('');
                                                                                setRequestCoordinates(null);
                                                                            } else {
                                                                                alert(res.message || getTranslatedText("Failed to submit request"));
                                                                            }
                                                                        } catch (err) {
                                                                            alert(err.message || getTranslatedText("Failed to submit request"));
                                                                            if (err.message && err.message.includes('pending')) {
                                                                                setShowRequestForm(false);
                                                                            }
                                                                        } finally {
                                                                            setRequestLoading(false);
                                                                        }
                                                                    }}
                                                                    className="flex-1 py-2 rounded-xl bg-sky-600 text-white font-medium disabled:opacity-50"
                                                                >
                                                                    {requestLoading ? '...' : getTranslatedText("Submit Request")}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <div className="space-y-1.5">
                                                        <label className="text-sm font-medium text-slate-700 block">{getTranslatedText("Business Address")}</label>
                                                        {isLoaded ? (
                                                            <Autocomplete onLoad={(ref) => autocompleteRef.current = ref} onPlaceChanged={handlePlaceSelect}>
                                                                <input
                                                                    type="text"
                                                                    value={formData.businessAddress || ''}
                                                                    onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all text-slate-800"
                                                                    placeholder="Search shop location"
                                                                />
                                                            </Autocomplete>
                                                        ) : (
                                                            <textarea
                                                                value={formData.businessAddress || ''}
                                                                onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                                                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-sky-500 bg-slate-50 text-slate-800 text-sm resize-none"
                                                                rows="2"
                                                                placeholder="Enter full shop/warehouse address"
                                                            />
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-medium text-slate-500 block">City</label>
                                                            <input
                                                                type="text"
                                                                value={formData.city || ''}
                                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                                                                placeholder="e.g. Patna"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-medium text-slate-500 block">State</label>
                                                            <input
                                                                type="text"
                                                                value={formData.state || ''}
                                                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                                                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                                                                placeholder="e.g. Bihar"
                                                            />
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (navigator.geolocation) {
                                                                navigator.geolocation.getCurrentPosition(
                                                                    (position) => {
                                                                        setFormData({
                                                                            ...formData,
                                                                            businessCoordinates: [position.coords.longitude, position.coords.latitude]
                                                                        });
                                                                    },
                                                                    (error) => alert("Failed to get location")
                                                                );
                                                            }
                                                        }}
                                                        className={`w-full py-2.5 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${formData.businessCoordinates ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                                                    >
                                                        <span className="text-base">📍</span>
                                                        {formData.businessCoordinates ? "Location Set" : "Update Shop Location"}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {['dukandaar', 'wholesaler', 'industrial'].includes(initialData?.scrapperType) && (
                                        <>
                                            {/* Deal Categories Selection */}
                                            <div className="pt-2 border-t border-slate-100 space-y-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-sm font-medium text-slate-700">
                                                        {getTranslatedText("Deal Categories (Specialties)")}
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, dealCategories: availableCategories.map(c => c.id) })}
                                                            className="text-[10px] px-2 py-1 bg-sky-100 text-sky-600 rounded hover:bg-sky-200 transition"
                                                        >
                                                            Select All
                                                        </button>
                                                        {formData.dealCategories?.length > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, dealCategories: [] })}
                                                                className="text-[10px] px-2 py-1 bg-red-50 text-red-400 rounded hover:bg-red-100 transition"
                                                            >
                                                                Clear
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                                    {availableCategories.map((cat) => (
                                                        <button
                                                            key={cat.id}
                                                            type="button"
                                                            onClick={() => {
                                                                const current = formData.dealCategories || [];
                                                                if (current.includes(cat.id)) {
                                                                    setFormData({ ...formData, dealCategories: current.filter(c => c !== cat.id) });
                                                                } else {
                                                                    setFormData({ ...formData, dealCategories: [...current, cat.id] });
                                                                }
                                                            }}
                                                            className={`flex items-center gap-2 px-2 py-2 rounded-lg border transition-all ${
                                                                formData.dealCategories?.includes(cat.id)
                                                                    ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm'
                                                                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                                            }`}
                                                        >
                                                            {cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('/')) ? (
                                                                <img src={cat.icon} alt={cat.label} className="w-5 h-5 object-contain flex-shrink-0" />
                                                            ) : (
                                                                <span className="text-base flex-shrink-0">{cat.icon}</span>
                                                            )}
                                                            <span className="text-[11px] font-medium truncate text-left w-full">{cat.label}</span>
                                                        </button>
                                                    ))}
                                                    {availableCategories.length === 0 && (
                                                        <p className="col-span-2 text-center text-xs text-slate-400 py-3">Loading categories...</p>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-400 italic">
                                                    * {getTranslatedText("Selection will filter available orders in your area.")}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Footer Actions - fixed at bottom */}
                                <div className="flex-shrink-0 p-6 pt-4 flex items-center gap-3 border-t border-slate-100 bg-white">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 py-3 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        {getTranslatedText("Cancel")}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-3 rounded-xl font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                    >
                                        {loading ? getTranslatedText("Saving...") : getTranslatedText("Save Changes")}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default EditProfileModal;
