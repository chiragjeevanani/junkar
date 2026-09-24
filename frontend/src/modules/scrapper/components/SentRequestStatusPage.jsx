import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaMapMarkerAlt, FaStore, FaClock, FaCheckCircle, FaTrash, FaPhone, FaComment } from 'react-icons/fa';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { orderAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import socketClient from '../../shared/utils/socketClient';

const mapContainerStyle = {
    width: '100%',
    height: '100%'
};

const mapStyles = [
    {
        "featureType": "landscape.natural",
        "elementType": "geometry.fill",
        "stylers": [{ "visibility": "on" }, { "color": "#e0efef" }]
    },
    { "featureType": "poi", "elementType": "geometry.fill", "stylers": [{ "color": "#c0e8e8" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "lightness": 100 }] },
    { "featureType": "water", "elementType": "all", "stylers": [{ "color": "#7dcdcd" }] }
];

const GOOGLE_MAPS_LIBRARIES = ['places'];

const SentRequestStatusPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [currentPos, setCurrentPos] = useState(null);
    const [watchId, setWatchId] = useState(null);
    const [directions, setDirections] = useState(null);

    const staticTexts = [
        "Request Status",
        "Targeting Partner...",
        "Accepted by Partner",
        "In Progress",
        "Accepted!",
        "Completed",
        "Cancelled",
        "Are you sure you want to cancel this request?",
        "Failed to fetch order details:",
        "Failed to cancel request",
        "Request Status",
        "Items:",
        "Estimated Amount:",
        "Store Location",
        "Loading...",
        "Start Journey to Shop",
        "On the Way",
        "Wholesaler Location",
        "Start Journey to Wholesaler",
        "Wholesaler is reviewing your request."
    ];

    const { getTranslatedText } = usePageTranslation(staticTexts);
    const [isMinimized, setIsMinimized] = useState(false);

    const getTargetCoordinates = () => {
        if (!order) return null;
        // If it's a B2B order (sender is scrapper), target is the assigned Dukandar's shop
        if (order.userModel === 'Scrapper' && order.scrapper?.businessLocation?.coordinates) {
            const [lng, lat] = order.scrapper.businessLocation.coordinates;
            // Only use if not [0,0]
            if (lat !== 0 || lng !== 0) {
                return { lat, lng };
            }
        }
        // Fallback to the order's pickup address (used for B2C or if B2B shop not set)
        return order.pickupAddress?.coordinates || { lat: 19.0760, lng: 72.8777 };
    };

    const targetCoords = getTargetCoordinates();

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES
    });
    const fetchOrder = useCallback(async () => {
        try {
            const response = await orderAPI.getById(orderId);
            if (response.success && response.data?.order) {
                setOrder(response.data.order);
            }
        } catch (error) {
            console.error("Failed to fetch order details:", error);
        } finally {
            setLoading(false);
        }
    }, [orderId]);


    const startTracking = useCallback(async () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        // Update status to 'on_way' so it persists on refresh
        try {
            await orderAPI.updateStatus(orderId, 'on_way');
            fetchOrder(); // Sync local state
        } catch (error) {
            console.error("Failed to update status to on_way:", error);
        }

        const id = navigator.geolocation.watchPosition(
            (position) => {
                const newPos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setCurrentPos(newPos);
                
                // Emit to partner (Dukandar) using standard wrapper
                socketClient.sendLocationUpdate({
                    orderId,
                    location: newPos,
                    heading: position.coords.heading || 0
                });
            },
            (error) => console.error(error),
            { enableHighAccuracy: true, distanceFilter: 10 }
        );
        setWatchId(id);
        setIsTracking(true);
    }, [orderId, fetchOrder]);

    const stopTracking = useCallback(() => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
        setIsTracking(false);
    }, [watchId]);

    const handleReached = async () => {
        try {
            await orderAPI.updateStatus(orderId, 'arrived');
            stopTracking();
            fetchOrder();
        } catch (error) {
            console.error("Failed to update status to arrived:", error);
        }
    };

    useEffect(() => {
        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [watchId]);

    useEffect(() => {
        // Show directions as soon as we have both positions, regardless of tracking status
        if (isLoaded && currentPos && targetCoords) {
            const directionsService = new window.google.maps.DirectionsService();

            directionsService.route(
                {
                    origin: currentPos,
                    destination: targetCoords,
                    travelMode: window.google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (status === window.google.maps.DirectionsStatus.OK) {
                        setDirections(result);
                    }
                }
            );
        } else if (!currentPos) {
            setDirections(null);
        }
    }, [isLoaded, currentPos, targetCoords]);

    // Initial position fetch for marker visibility
    useEffect(() => {
        if (navigator.geolocation && !currentPos) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCurrentPos({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => console.error("Initial pos fetch failed:", error)
            );
        }
    }, [currentPos]);

    const [map, setMap] = useState(null);
    useEffect(() => {
        if (map && currentPos && targetCoords) {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(currentPos);
            bounds.extend(targetCoords);
            map.fitBounds(bounds, 80); // 80px padding
        }
    }, [map, currentPos, targetCoords]);



    useEffect(() => {
        fetchOrder();
        
        // Socket updates for real-time status changes
        const token = localStorage.getItem('token');
        if (token) {
            if (!socketClient.getConnectionStatus()) socketClient.connect(token);
            socketClient.joinTracking(orderId);
            
            const handleStatusUpdate = (data) => {
                if (data.orderId === orderId) {
                    fetchOrder();
                }
            };

            socketClient.on('order_status_update', handleStatusUpdate);

            return () => {
                socketClient.leaveTracking(orderId);
                socketClient.off('order_status_update', handleStatusUpdate);
            };
        }
    }, [orderId, fetchOrder]);

    // Auto-restart tracking if order is in progress
    useEffect(() => {
        if (order?.status === 'on_way' && !isTracking) {
             startTracking();
        }
    }, [order?.status, isTracking, startTracking]);

    const handleCancel = async () => {
        if (window.confirm(getTranslatedText("Are you sure you want to cancel this request?"))) {
            try {
                setIsCancelling(true);
                const response = await orderAPI.cancel(orderId, "Cancelled by Sender");
                if (response.success) {
                    // Update state to show cancelled status instead of navigating
                    await fetchOrder();
                }
            } catch (error) {
                alert(error.message || "Failed to cancel request");
            } finally {
                setIsCancelling(false);
            }
        }
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-white">
            <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!order) return <div className="p-10 text-center">Request not found</div>;

    const currentStatus = order.status.toLowerCase();
    const isCompleted = currentStatus === 'completed';
    const isCancelled = currentStatus === 'cancelled';
    const isAccepted = order.assignmentStatus === 'accepted';

    const getTimelineStep = () => {
        if (isCancelled) return 0;
        if (isCompleted) return 5;
        if (currentStatus === 'in_progress') return 4;
        if (currentStatus === 'arrived') return 3;
        if (currentStatus === 'on_way' || isTracking) return 2;
        if (isAccepted) return 1;
        return 0; // Pending
    };

    const step = getTimelineStep();

    const targetLabel = (order?.userModel === 'Scrapper' && order?.scrapper?.businessLocation?.address) 
        ? order.scrapper.businessLocation.address 
        : `${order?.pickupAddress?.street || ''}, ${order?.pickupAddress?.city || ''}`;

    return (
        <div className="h-screen bg-slate-50 relative overflow-hidden">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center gap-3 pointer-events-none">
                <button 
                    onClick={() => navigate('/scrapper/my-sent-requests', { replace: true })}
                    className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-slate-800 pointer-events-auto"
                >
                    <FaArrowLeft />
                </button>
                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md pointer-events-auto">
                    <h1 className="font-bold text-slate-800 text-sm tracking-tight capitalize">
                        {getTranslatedText("Request Status")} • #{order._id.toString().slice(-6).toUpperCase()}
                    </h1>
                </div>
            </div>

            {/* Map Section - Full Height Background */}
            <div className="absolute inset-0 z-0">
                {isLoaded ? (
                    <GoogleMap
                        onLoad={setMap}
                        mapContainerStyle={mapContainerStyle}
                        zoom={14}
                        center={currentPos || targetCoords}
                        options={{ styles: mapStyles, disableDefaultUI: true }}
                    >
                        {/* Target Location Marker (Dukandar Store) */}
                        <Marker 
                            position={targetCoords}
                            label={{
                                text: getTranslatedText("Dukandar Shop"),
                                color: "#ef4444",
                                fontWeight: "bold",
                                fontSize: "14px"
                            }}
                            icon={{
                                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                    <svg width="40" height="48" viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20 0 C11 0 4 7 4 16 C4 28 20 48 20 48 C20 48 36 28 36 16 C36 7 29 0 20 0 Z" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
                                        <circle cx="20" cy="16" r="6" fill="#ffffff"/>
                                    </svg>
                                `),
                                scaledSize: new window.google.maps.Size(40, 48),
                                anchor: new window.google.maps.Point(20, 48),
                                labelOrigin: new window.google.maps.Point(20, -15)
                            }}
                        />

                        {/* Pheriwala's Blue Pulsating Location Marker */}
                        {currentPos && (
                             <Marker 
                                position={currentPos}
                                label={{
                                    text: getTranslatedText("You"),
                                    color: "#3b82f6",
                                    fontWeight: "bold",
                                    fontSize: "14px"
                                }}
                                icon={{
                                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="20" cy="20" r="15" fill="rgba(59, 130, 246, 0.2)">
                                                <animate attributeName="r" from="10" to="18" dur="2s" repeatCount="indefinite" />
                                                <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                                            </circle>
                                            <circle cx="20" cy="20" r="8" fill="#3b82f6" stroke="white" stroke-width="3"/>
                                        </svg>
                                    `),
                                    scaledSize: new window.google.maps.Size(40, 40),
                                    anchor: new window.google.maps.Point(20, 20),
                                    labelOrigin: new window.google.maps.Point(20, -15)
                                }}
                            />
                        )}

                        {/* Route Line */}
                        {directions && (
                            <DirectionsRenderer
                                directions={directions}
                                options={{
                                    suppressMarkers: true,
                                    polylineOptions: {
                                        strokeColor: "#0284c7",
                                        strokeOpacity: 0.8,
                                        strokeWeight: 6,
                                    },
                                }}
                            />
                        )}
                    </GoogleMap>
                ) : (
                    <div className="w-full h-full bg-slate-200 animate-pulse" />
                )}
                
                {/* Floating Store Info Box */}
                {!isMinimized && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-[62vh] left-4 right-4 z-10"
                    >
                        <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/50 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
                                <FaMapMarkerAlt />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">{order.userModel === 'Scrapper' ? getTranslatedText("Shop Location") : getTranslatedText("Store Location")}</p>
                                <p className="text-xs font-bold text-slate-800 line-clamp-1">{targetLabel}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
                
                {isMinimized && (
                    <div className="absolute bottom-[140px] left-4 right-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
                                <FaMapMarkerAlt />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">
                                    {order.scrapper?.scrapperType === 'wholesaler' ? getTranslatedText("Wholesaler Location") : 
                                     order.userModel === 'Scrapper' ? getTranslatedText("Shop Location") : 
                                     getTranslatedText("Store Location")}
                                </p>
                                <p className="text-xs font-bold text-slate-800 line-clamp-1">{targetLabel}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Status Timeline Container (Collapsible Sheet) */}
            <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: isMinimized ? 'calc(100% - 120px)' : '0%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-10 p-6 flex flex-col"
                style={{ height: '60vh', touchAction: 'none' }}
            >
                {/* Handle / Tap area for toggle */}
                <div 
                    className="w-full py-2 cursor-pointer mb-2 flex-shrink-0"
                    onClick={() => setIsMinimized(!isMinimized)}
                >
                    <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto" />
                </div>

                <div className="overflow-y-auto flex-1 pb-10 custom-scrollbar">
                    {/* Current Highlighted Status */}
                    <div className="text-center mb-6">
                        <h2 className={`text-2xl font-black mb-1 ${isCancelled ? 'text-rose-600' : 'text-slate-900'}`}>
                            {isCancelled ? getTranslatedText("Cancelled") : 
                            isCompleted ? getTranslatedText("Completed") :
                            isAccepted ? (isTracking ? getTranslatedText("On the Way") : getTranslatedText("Accepted by Partner")) :
                            getTranslatedText("Targeting Partner...")}
                        </h2>
                        <p className="text-sm font-medium text-slate-500">
                            {isAccepted 
                                ? `Order is being handled by ${order.scrapper?.name}` 
                                : (order.scrapper && (order.scrapper.scrapperType === 'wholesaler' || order.scrapper.scrapperType === 'big') 
                                    ? getTranslatedText("Wholesaler is reviewing your request.") 
                                    : getTranslatedText("Dukhandar is reviewing your request."))}
                        </p>
                    </div>

                    {/* Start Journey / Reached Buttons */}
                    {isAccepted && !isCompleted && !isCancelled && (
                        <div className="flex flex-col gap-3 mb-8">
                            {!isTracking && currentStatus !== 'on_way' && currentStatus !== 'arrived' && currentStatus !== 'in_progress' && (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={startTracking}
                                    className="w-full py-4 rounded-2xl bg-sky-600 text-white font-black text-sm flex items-center justify-center gap-3 shadow-lg shadow-sky-100"
                                >
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                    {order.scrapper?.scrapperType === 'wholesaler' 
                                        ? getTranslatedText("Start Journey to Wholesaler") 
                                        : getTranslatedText("Start Journey to Shop")}
                                </motion.button>
                            )}

                            {isTracking && currentStatus === 'on_way' && (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleReached}
                                    className="w-full py-4 rounded-2xl bg-amber-500 text-white font-black text-sm flex items-center justify-center gap-3 shadow-lg shadow-amber-100"
                                >
                                    <FaCheckCircle />
                                    {getTranslatedText("I Have Reached")}
                                </motion.button>
                            )}

                            {(isTracking || currentStatus === 'on_way' || currentStatus === 'arrived') && (
                                <button
                                    onClick={stopTracking}
                                    className="w-full py-3 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs"
                                >
                                    {getTranslatedText("Stop Sharing Location")}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Timeline Steps */}
                    <div className="relative pl-8 mb-10">
                        {/* Vertical Line */}
                        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />
                        <div 
                            className="absolute left-[11px] top-2 w-0.5 bg-sky-600 transition-all duration-700 ease-in-out"
                            style={{ height: `${(step - 1) * 33}%` }}
                        />

                        {/* Steps */}
                        <TimelineStep index={0} currentStep={step} label={getTranslatedText("Request Sent")} time={new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                        <TimelineStep index={1} currentStep={step} label={getTranslatedText("Accepted By Partner")} />
                        <TimelineStep index={2} currentStep={step} label={getTranslatedText("On the Way")} />
                        <TimelineStep index={3} currentStep={step} label={getTranslatedText("Arrived at Shop")} />
                        <TimelineStep index={4} currentStep={step} label={getTranslatedText("Stock Verification")} />
                        <TimelineStep index={5} currentStep={step} label={getTranslatedText("Completed")} />
                    </div>

                    {/* Partner Details Card */}
                    {order.scrapper && (
                        <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-sky-600 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-sky-200">
                                        {order.scrapper.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800">{order.scrapper.name}</h4>
                                        {isAccepted && (
                                            <p className="text-[10px] font-bold text-slate-500 mb-0.5">{order.scrapper.phone}</p>
                                        )}
                                        <div className="flex items-center gap-1 text-sky-600 text-[11px] font-bold uppercase">
                                            <FaStore />
                                            <span>{order.scrapper.scrapperType || 'Partner Store'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <a 
                                        href={`tel:${order.scrapper.phone}`}
                                        className="w-10 h-10 rounded-full bg-white text-green-600 shadow-sm flex items-center justify-center border border-slate-100 active:scale-90 transition-transform"
                                    >
                                        <FaPhone size={14} />
                                    </a>
                                    <button
                                        onClick={() => navigate(`/scrapper/chat?orderId=${order._id}`, { state: { orderId: order._id } })}
                                        className="w-10 h-10 rounded-full bg-white text-sky-600 shadow-sm flex items-center justify-center border border-slate-100 active:scale-90 transition-transform"
                                    >
                                        <FaComment size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Order Summary */}
                    <div className="bg-white rounded-3xl border-2 border-dashed border-slate-100 p-5 mb-8">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{getTranslatedText("Order Summary")}</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-600">{getTranslatedText("Items:")}</span>
                                <span className="text-sm font-black text-slate-800">
                                    {order.scrapItems?.map(i => `${i.category}${i.weight ? ` (${i.weight} Kg)` : ''}`).join(', ') || order.scrapType}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-600">{getTranslatedText("Estimated Amount:")}</span>
                                <span className="text-lg font-black text-sky-600">₹{order.totalAmount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Cancel Button */}
                    {!isCompleted && !isCancelled && !isTracking && (
                        <button
                            disabled={isCancelling}
                            onClick={handleCancel}
                            className="w-full py-4 rounded-2xl bg-rose-50 text-rose-600 font-black text-sm flex items-center justify-center gap-2 border border-rose-100 active:scale-95 transition-transform disabled:opacity-50"
                        >
                            {isCancelling ? <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent animate-spin rounded-full" /> : <FaTrash />}
                            {getTranslatedText("Cancel Request")}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const TimelineStep = ({ index, currentStep, label, time }) => {
    const isPassed = currentStep > index;
    const isCurrent = currentStep === index;

    return (
        <div className={`relative mb-8 last:mb-0 transition-all duration-300 ${isPassed || isCurrent ? 'opacity-100' : 'opacity-30'}`}>
            <div className={`absolute -left-[30px] w-[24px] h-[24px] rounded-full border-4 flex items-center justify-center z-10 transition-colors shadow-sm ${
                isPassed ? 'bg-sky-600 border-sky-100 text-white' : 
                isCurrent ? 'bg-white border-sky-600 text-sky-600 animate-pulse' : 'bg-white border-slate-100 text-slate-300'
            }`}>
                {isPassed ? <FaCheckCircle size={12} /> : index}
            </div>
            <div className="flex flex-col">
                <span className={`text-sm font-black ${
                    isCurrent ? 'text-sky-600 transition-colors' : 'text-slate-800'
                }`}>
                    {label}
                </span>
                {time && <span className="text-[10px] font-bold text-slate-400 uppercase">{time}</span>}
            </div>
        </div>
    );
};

export default SentRequestStatusPage;
