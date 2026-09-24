import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../modules/shared/context/AuthContext';
import { checkAndProcessMilestone } from '../../../modules/shared/utils/referralUtils';
import { orderAPI } from '../../../modules/shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import { FaCalendarAlt, FaClock, FaBolt, FaRegCalendarAlt } from 'react-icons/fa';
import Calendar from 'react-calendar';
import TimePicker from 'react-time-picker';
import 'react-calendar/dist/Calendar.css';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';

const PriceConfirmationPage = () => {
  const staticTexts = [
    "Confirm & Apply",
    "Step 5 of 5",
    "Request Summary",
    "Categories:",
    "Images:",
    "Weight:",
    "kg",
    "(Auto-detected)",
    "Pickup Address:",
    "📍 Location:",
    "Price Breakdown:",
    "Estimated Payout:",
    "for",
    "Additional Notes (Optional)",
    "Add any special instructions or details about your scrap...",
    "Preferred Pickup Date & Time",
    "Select a day (today or upcoming days)",
    "Or type a specific date",
    "Select a time window",
    "Or type a specific time",
    "You selected:",
    "Submitting Request...",
    "Apply for Pickup -",
    "By applying, you agree to our terms and conditions",
    "Please select a pickup date and time slot before applying.",
    "Please login to place a pickup request.",
    "Failed to submit request. Please try again.",
    "Address not provided",
    "Plastic",
    "Metal",
    "Paper",
    "Electronics",
    "Copper",
    "Aluminium",
    "Steel",
    "Brass",
    "9:00 AM - 11:00 AM",
    "11:00 AM - 1:00 PM",
    "1:00 PM - 3:00 PM",
    "3:00 PM - 5:00 PM",
    "5:00 PM - 7:00 PM",
    "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
    "Select Date", "Select Time", "Selected Time",
    "When for?", "Right Now", "Schedule", "Scrapper will come immediately",
    "Negotiable Item",
    "Condition:",
    "Good", "Average", "Damaged",
    "Expected Price:",
    "Vendor will decide",
    "Apply for Pickup",
    "Donate this Scrap",
    "Yes, I want to donate",
    "This will be picked up for free to help someone in need.",
    "Free Donation"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pickupMode, setPickupMode] = useState('scheduled'); // 'immediate' | 'scheduled'
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [weightData, setWeightData] = useState(null);
  const [notes, setNotes] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // ISO date string
  const [selectedSlot, setSelectedSlot] = useState("10:00");
  const [marketPrices, setMarketPrices] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedPayout, setEstimatedPayout] = useState(0);
  const [addressData, setAddressData] = useState(null);
  const [isDonation, setIsDonation] = useState(false);

  // Load all data from sessionStorage
  useEffect(() => {
    const storedCategories = sessionStorage.getItem('selectedCategories');
    const storedImages = sessionStorage.getItem('uploadedImages');
    const storedWeight = sessionStorage.getItem('weightData');
    const storedAddress = sessionStorage.getItem('addressData');
    const storedConfirmation = sessionStorage.getItem('confirmationData');

    if (storedCategories) {
      setSelectedCategories(JSON.parse(storedCategories));
    }
    if (storedImages) {
      setUploadedImages(JSON.parse(storedImages));
    }
    if (storedWeight) {
      const weight = JSON.parse(storedWeight);
      setWeightData(weight);
      setEstimatedPayout(weight.estimatedPayout || 0);
    }
    if (storedAddress) {
      setAddressData(JSON.parse(storedAddress));
    }

    // Restore page-specific inputs on refresh
    if (storedConfirmation) {
      try {
        const conf = JSON.parse(storedConfirmation);
        if (conf.pickupMode) setPickupMode(conf.pickupMode);
        if (conf.notes) setNotes(conf.notes);
        if (conf.isDonation !== undefined) setIsDonation(conf.isDonation);
        if (conf.selectedDate) setSelectedDate(conf.selectedDate);
        if (conf.selectedSlot) setSelectedSlot(conf.selectedSlot);
      } catch (err) {
        console.error("Error parsing confirmation data:", err);
      }
    }

    // Redirect if missing required data
    if (!storedCategories || !storedImages || !storedWeight || !storedAddress) {
      navigate('/user/add-scrap/category');
    }
  }, [navigate]);

  // Handle auto-save for Confirmation page inputs
  useEffect(() => {
    const confirmationData = {
      pickupMode,
      notes,
      isDonation,
      selectedDate,
      selectedSlot,
      timestamp: new Date().toISOString()
    };
    sessionStorage.setItem('confirmationData', JSON.stringify(confirmationData));
  }, [pickupMode, notes, isDonation, selectedDate, selectedSlot]);

  // Fetch market prices from backend
  useEffect(() => {
    const fetchMarketPrices = async () => {
      try {
        const { publicAPI } = await import('../../../modules/shared/utils/api');
        const response = await publicAPI.getPrices();

        if (response.success && response.data?.prices) {
          // Convert prices array to object for easy lookup
          const pricesMap = {};
          response.data.prices.forEach(price => {
            pricesMap[price.category] = price;
          });
          setMarketPrices(pricesMap);
        } else {
          // Fallback to default prices if API fails
          setMarketPrices({
            'Plastic': 45,
            'Metal': 180,
            'Paper': 12,
            'Electronics': 85,
            'Copper': 650,
            'Aluminium': 180,
            'Steel': 35,
            'Brass': 420,
          });
        }
      } catch (error) {
        console.error('Failed to fetch market prices:', error);
        // Fallback to default prices
        setMarketPrices({
          'Plastic': 45,
          'Metal': 180,
          'Paper': 12,
          'Electronics': 85,
          'Copper': 650,
          'Aluminium': 180,
          'Steel': 35,
          'Brass': 420,
        });
      }
    };

    fetchMarketPrices();
  }, []);

  // Helper: generate next 7 days (including today)
  const dayOptions = useMemo(() => {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const iso = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay()];
      const display = `${getTranslatedText(dayName)}, ${date.getDate()}`;
      days.push({ iso, dayName, display });
    }
    return days;
  }, [getTranslatedText]);

  const mapCategoryToBackend = (cat) => {
    const id = (cat.id || '').toLowerCase();
    const name = (cat.name || '').toLowerCase();
    // New categories and their sub-category prefixes
    if (id === 'e_waste' || id.startsWith('ew_')) return 'e_waste';
    if (id === 'scrap_iron') return 'scrap_iron';
    if (id === 'raddi') return 'raddi';
    if (id === 'furniture' || id.startsWith('furn_')) return 'furniture';
    if (id === 'vehicle_scrap' || id.startsWith('vs_')) return 'vehicle_scrap';
    if (id === 'home_appliance' || id.startsWith('ha_')) return 'home_appliance';
    // Original categories
    if (id.includes('metal') || name === 'metal') return 'metal';
    if (id.includes('plastic') || name === 'plastic') return 'plastic';
    if (id.includes('paper') || name === 'paper') return 'paper';
    if (id.includes('electronic') || name === 'electronics' || name === 'electronic') return 'electronic';
    if (id.includes('glass') || name === 'glass') return 'glass';
    if (id.includes('copper') || name === 'copper') return 'metal';
    if (id.includes('aluminium') || name === 'aluminium') return 'metal';
    if (id.includes('steel') || name === 'steel') return 'metal';
    if (id.includes('brass') || name === 'brass') return 'metal';
    return 'other';
  };

  const handleSubmit = useCallback(async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isSubmitting) {
      console.log('Already submitting, ignoring click');
      return;
    }

    console.log('handleSubmit called');
    setIsSubmitting(true);

    if (pickupMode === 'scheduled' && (!selectedDate || !selectedSlot)) {
      alert(getTranslatedText('Please select a pickup date and time slot before applying.'));
      setIsSubmitting(false);
      return;
    }

    if (!user) {
      alert(getTranslatedText('Please login to place a pickup request.'));
      setIsSubmitting(false);
      return;
    }

    let pickupSlotData = {};
    const dateObj = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if (pickupMode === 'immediate') {
      const dayName = dayNames[dateObj.getDay()];
      const isoDate = dateObj.toISOString().split('T')[0];
      const hours = dateObj.getHours();
      const minutes = dateObj.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedTime = `${hours % 12 || 12}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;

      pickupSlotData = {
        date: isoDate,
        dayName,
        slot: "Immediate"
      };
      // We can also set preferredTime for display consistency, though it's technically "Immediate"
    } else {
      const scheduledDateObj = new Date(selectedDate);
      const dayName = dayNames[scheduledDateObj.getDay()];
      pickupSlotData = {
        date: selectedDate,
        dayName,
        slot: selectedSlot
      };
    }

    const pricingType = weightData?.pricingType || 'kg_based';
    const isNegotiableOrder = pricingType === 'negotiable' || pricingType === 'mixed';

    const scrapItems = selectedCategories.map((cat) => {
      const category = mapCategoryToBackend(cat);
      const isCatNegotiable = weightData?.negotiableCategories?.some(nw => nw.categoryId === cat.id);

      if (isCatNegotiable) {
        return {
          category,
          name: cat.name,
          pricingType: 'negotiable',
          weight: 0,
          rate: 0,
          total: 0,
          itemCondition: weightData?.itemCondition || 'average',
          expectedPrice: weightData?.expectedPrice || null,
          quantity: isCatNegotiable ? (weightData?.negotiableCategories?.find(nw => nw.categoryId === cat.id)?.quantity || 0) : 0
        };
      } else {
        // Find specific weight/quantity for this category
        const catWeightData = weightData?.categoryWeights?.find(w => w.categoryId === cat.id);
        const weightValue = catWeightData ? Number(catWeightData.weight) : (Number(weightData?.weight || 0) / selectedCategories.length);
        const quantityValue = catWeightData ? Number(catWeightData.quantity) : 0;

        const rateNode = marketPrices[cat.name];
        const rate = (typeof rateNode === 'object' ? rateNode.pricePerKg : rateNode) || cat.price || 0;
        const total = weightValue * rate;

        return {
          category,
          name: cat.name,
          pricingType: 'kg_based',
          weight: weightValue,
          quantity: quantityValue,
          rate,
          total
        };
      }
    });

    const images = uploadedImages.map((img) => ({
      url: img.url || img.preview,
      publicId: img.publicId || null
    }));

    // Prepare pickup address from addressData
    // ⚠️ IMPORTANT: Only include coordinates if genuinely captured (not 0,0 fallback)
    const hasCoords = addressData?.coordinates?.lat && addressData?.coordinates?.lng &&
      addressData.coordinates.lat !== 0 && addressData.coordinates.lng !== 0;

    const pickupAddress = {
      street: addressData?.address || getTranslatedText('Address not provided'),
      ...(hasCoords && {
        coordinates: {
          lat: addressData.coordinates.lat,
          lng: addressData.coordinates.lng
        }
      })
    };

    // Warn user if no location — nearest scrapper won't be found accurately
    if (!hasCoords) {
      console.warn('[Order] No GPS coordinates captured. Nearest scrapper detection will be approximate.');
    }

    const payload = {
      scrapItems,
      preferredTime: pickupMode === 'immediate' ? 'Immediate Pickup' : preferredTime,
      pickupSlot: pickupSlotData,
      pickupAddress,
      images,
      notes,
      quantityType: weightData?.quantityType || 'small',
      isNegotiated: isNegotiableOrder,
      isDonation: isDonation
    };

    try {
      const response = await orderAPI.create(payload);
      const createdOrder = response.data?.order || null;

      if (createdOrder) {
        try {
          checkAndProcessMilestone(user.phone || user.id, 'user', 'firstRequest');
        } catch (err) {
          console.error('Error processing milestone:', err);
        }
      }

      // Clear flow-specific session data on success
      sessionStorage.removeItem('selectedCategories');
      sessionStorage.removeItem('uploadedImages');
      sessionStorage.removeItem('weightData');
      sessionStorage.removeItem('addressData');
      sessionStorage.removeItem('confirmationData');
      // location_hint_shown is fine to keep for session UX, but optional

      navigate('/user/request-status', {
        state: { requestData: createdOrder || payload },
        replace: true
      });
    } catch (error) {
      console.error('Error submitting request:', error);
      console.error('Error stack:', error.stack);
      alert(getTranslatedText(error.message || 'Failed to submit request. Please try again.'));
      setIsSubmitting(false);
    }
  }, [isSubmitting, selectedDate, selectedSlot, selectedCategories, uploadedImages, weightData, addressData, preferredTime, user, navigate, marketPrices, getTranslatedText, pickupMode, isDonation]);

  const timeSlots = [
    '9:00 AM - 11:00 AM',
    '11:00 AM - 1:00 PM',
    '1:00 PM - 3:00 PM',
    '3:00 PM - 5:00 PM',
    '5:00 PM - 7:00 PM'
  ];

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
          onClick={() => navigate('/user/add-scrap/address')}
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
          {getTranslatedText("Confirm & Apply")}
        </h2>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      {/* Progress Indicator */}
      <div className="px-3 md:px-6 pt-3 md:pt-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'rgba(100, 148, 110, 0.2)' }}>
            <motion.div
              initial={{ width: '80%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full"
              style={{ backgroundColor: '#38bdf8' }}
            />
          </div>
          <span className="text-xs md:text-sm" style={{ color: '#718096' }}>{getTranslatedText("Step 5 of 5")}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-24 md:pb-6">
        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 md:p-6 mb-4 md:mb-6 shadow-lg"
          style={{ backgroundColor: '#ffffff' }}
        >
          <h3 className="text-base md:text-lg font-bold mb-4" style={{ color: '#2d3748' }}>
            {getTranslatedText("Request Summary")}
          </h3>

          {/* Selected Categories */}
          <div className="mb-4">
            <p className="text-xs md:text-sm mb-2" style={{ color: '#718096' }}>
              {getTranslatedText("Categories:")}
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((cat) => (
                <span
                  key={cat.id}
                  className="px-3 py-1.5 rounded-full text-xs md:text-sm font-medium"
                  style={{ backgroundColor: 'rgba(100, 148, 110, 0.1)', color: '#38bdf8' }}
                >
                  {getTranslatedText(cat.name)}
                </span>
              ))}
            </div>
          </div>

          {/* Images Preview */}
          {uploadedImages.length > 0 && (
            <div className="mb-4">
              <p className="text-xs md:text-sm mb-2" style={{ color: '#718096' }}>
                {getTranslatedText("Images")} ({uploadedImages.length}):
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {uploadedImages.map((image) => (
                  <div
                    key={image.id}
                    className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden shadow-md"
                  >
                    <img
                      src={image.preview}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weight or Condition Details */}
          {weightData && (
            <div className="mb-4">
              {/* If any negotiable items, show condition */}
              {weightData.negotiableCategories?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs md:text-sm mb-1" style={{ color: '#718096' }}>
                    {getTranslatedText("Item Condition (Negotiable):")}
                  </p>
                  <p className="text-base md:text-lg font-semibold capitalize" style={{ color: '#b45309' }}>
                    {weightData.itemCondition === 'good' ? '✅ ' : weightData.itemCondition === 'average' ? '⚠️ ' : '🔧 '}
                    {getTranslatedText(weightData.itemCondition === 'good' ? 'Good' : weightData.itemCondition === 'average' ? 'Average' : 'Damaged')}
                  </p>
                </div>
              )}

              {/* If any weight items, show weights */}
              {weightData.categoryWeights?.length > 0 && (
                <div>
                  <p className="text-xs md:text-sm mb-1" style={{ color: '#718096' }}>
                    {getTranslatedText("Weights Breakdown:")}
                  </p>
                  <div className="space-y-1">
                    {weightData.categoryWeights.map(w => (
                      <p key={w.categoryId} className="text-sm font-semibold" style={{ color: '#2d3748' }}>
                        {getTranslatedText(w.categoryName)}: 
                        {w.weight > 0 && ` ${w.weight} ${getTranslatedText("kg")}`}
                        {w.weight > 0 && w.quantity > 0 && " + "}
                        {w.quantity > 0 && ` ${w.quantity} ${getTranslatedText("Nos/Units")}`}
                      </p>
                    ))}
                    {weightData.categoryWeights.length > 1 && weightData.weight > 0 && (
                      <p className="text-base font-bold mt-1 pt-1 border-t" style={{ color: '#38bdf8' }}>
                        {getTranslatedText("Total Weight:")} {weightData.weight} {getTranslatedText("kg")}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Check for negotiable items details if they exist */}
              {weightData.negotiableCategories?.some(nw => nw.quantity > 0 || nw.weight > 0) && (
                <div className="mt-3">
                  <p className="text-xs md:text-sm mb-1" style={{ color: '#718096' }}>
                    {getTranslatedText("Items Details (Negotiable):")}
                  </p>
                  <div className="space-y-1">
                    {weightData.negotiableCategories.filter(nw => nw.quantity > 0 || nw.weight > 0).map(nw => (
                      <p key={nw.categoryId} className="text-sm font-semibold" style={{ color: '#2d3748' }}>
                        {getTranslatedText(nw.categoryName)}: 
                        {nw.weight > 0 && ` ${nw.weight} ${getTranslatedText("kg")}`}
                        {nw.weight > 0 && nw.quantity > 0 && " + "}
                        {nw.quantity > 0 && ` ${nw.quantity} ${getTranslatedText("Nos")}`}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pickup Address */}
          {addressData && (
            <div className="mb-4 pb-4 border-b" style={{ borderColor: 'rgba(100, 148, 110, 0.2)' }}>
              <p className="text-xs md:text-sm mb-1" style={{ color: '#718096' }}>
                {getTranslatedText("Pickup Address:")}
              </p>
              <p className="text-sm md:text-base font-semibold mb-2" style={{ color: '#2d3748' }}>
                {addressData.address}
              </p>
              {addressData.coordinates && (
                <p className="text-xs" style={{ color: '#718096' }}>
                  📍 {getTranslatedText("Location:")} {addressData.coordinates.lat.toFixed(6)}, {addressData.coordinates.lng.toFixed(6)}
                </p>
              )}
            </div>
          )}

          {/* Price Breakdown or Negotiation Info */}
          {weightData?.pricingType === 'negotiable' ? (
            <div className="mb-4 pb-4 border-b" style={{ borderColor: 'rgba(100, 148, 110, 0.2)' }}>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
              >
                <span className="text-xl">🤝</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#b45309' }}>
                    {getTranslatedText("Negotiation Required")}
                  </p>
                  <p className="text-xs" style={{ color: '#92400e' }}>
                    {getTranslatedText("Vendor will decide")}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 pb-4 border-b" style={{ borderColor: 'rgba(100, 148, 110, 0.2)' }}>
                <p className="text-xs md:text-sm mb-2" style={{ color: '#718096' }}>
                  {getTranslatedText("Price Breakdown:")}
                </p>
                {selectedCategories.map((cat) => {
                  const isNegotiable = weightData?.negotiableCategories?.some(nw => nw.categoryId === cat.id);
                  const weightInfo = weightData?.categoryWeights?.find(w => w.categoryId === cat.id);

                  return (
                    <div key={cat.id} className="flex justify-between items-center mb-1">
                      <span className="text-xs md:text-sm" style={{ color: '#2d3748' }}>
                        {getTranslatedText(cat.name)}
                        {weightInfo && ` (${weightInfo.weight}kg)`}
                      </span>
                      <span className="text-xs md:text-sm font-medium" style={{ color: isNegotiable ? '#b45309' : '#38bdf8' }}>
                        {isNegotiable ? (
                          getTranslatedText("Negotiable")
                        ) : (() => {
                          const info = marketPrices[cat.name];
                          if (info && (info.minPrice || info.maxPrice)) {
                            return `₹${info.minPrice || info.pricePerKg || info} - ₹${info.maxPrice || info.pricePerKg || info}`;
                          }
                          const price = info?.pricePerKg || info || cat.price || 0;
                          return `₹${price}/${getTranslatedText("kg")}`;
                        })()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Total Estimated Payout */}
              <div className="pt-4">
                <p className="text-xs md:text-sm mb-2" style={{ color: '#718096' }}>
                  {getTranslatedText("Estimated Payout:")}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl md:text-4xl font-bold" style={{ color: '#38bdf8' }}>
                    {isDonation
                      ? `₹0 (${getTranslatedText('Free Donation')})`
                      : weightData?.pricingType === 'negotiable'
                        ? (weightData.expectedPrice ? `₹${weightData.expectedPrice}` : getTranslatedText('Negotiable'))
                        : weightData?.pricingType === 'mixed'
                          ? `₹${estimatedPayout.toFixed(0)} + ${getTranslatedText('Negotiable')}`
                          : `₹${estimatedPayout.toFixed(0)}`}
                  </span>
                  <span className="text-sm md:text-base" style={{ color: '#718096' }}>
                    {weightData?.pricingType === 'negotiable'
                      ? (weightData.expectedPrice ? `(${getTranslatedText('Expected')})` : getTranslatedText('Quote Pending'))
                      : weightData?.pricingType === 'mixed'
                        ? `${getTranslatedText("for")} ${weightData?.weight || 0} ${getTranslatedText("kg")} + ${weightData?.negotiableCategories?.length || 0} ${getTranslatedText("Items")}`
                        : `${getTranslatedText("for")} ${weightData?.weight || 0} ${getTranslatedText("kg")}`}
                  </span>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Additional Options */}
        <div className="space-y-4 md:space-y-6">
          {/* Donation Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-xl p-4 md:p-6 border-2 transition-all cursor-pointer flex items-start gap-4 ${isDonation ? 'border-sky-500 bg-sky-50 shadow-md' : 'border-transparent bg-white shadow-sm hover:shadow-md'}`}
            onClick={() => setIsDonation(!isDonation)}
          >
            <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded border flex items-center justify-center transition-colors ${isDonation ? 'bg-sky-500 border-sky-500 text-white' : 'bg-gray-50 border-gray-300'}`}>
              {isDonation && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
            </div>
            <div>
              <h4 className={`text-sm md:text-base font-bold ${isDonation ? 'text-sky-700' : 'text-gray-800'}`}>
                {getTranslatedText("Donate this Scrap")} 🎁
              </h4>
              <p className={`text-xs md:text-sm mt-1 leading-relaxed ${isDonation ? 'text-sky-600' : 'text-gray-500'}`}>
                {getTranslatedText("This will be picked up for free to help someone in need.")}
              </p>
            </div>
          </motion.div>

          {/* Notes Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-4 md:p-6"
            style={{ backgroundColor: '#ffffff' }}
          >
            <label className="block text-sm md:text-base font-semibold mb-2" style={{ color: '#2d3748' }}>
              {getTranslatedText("Additional Notes (Optional)")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={getTranslatedText("Add any special instructions or details about your scrap...")}
              rows={4}
              className="w-full py-2 px-3 md:py-3 md:px-4 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all resize-none text-sm md:text-base"
              style={{
                borderColor: notes ? '#38bdf8' : 'rgba(100, 148, 110, 0.3)',
                color: '#2d3748',
                backgroundColor: '#f9f9f9'
              }}
            />
          </motion.div>

          {/* Preferred Pickup Date & Time Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-4 md:p-6"
            style={{ backgroundColor: '#ffffff' }}
          >
            <label className="block text-sm md:text-base font-semibold mb-4" style={{ color: '#2d3748' }}>
              {getTranslatedText("Preferred Pickup Date & Time")}
            </label>

            {/* Mode Selection */}
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setPickupMode('immediate')}
                className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${pickupMode === 'immediate'
                  ? 'border-sky-600 bg-sky-50 text-sky-700 shadow-md'
                  : 'border-gray-200 text-gray-500 hover:border-sky-200 hover:bg-sky-50/50'
                  }`}
              >
                <FaBolt className={`text-2xl mb-2 ${pickupMode === 'immediate' ? 'text-sky-600' : 'text-gray-400'}`} />
                <span className="font-bold text-sm">{getTranslatedText("Right Now")}</span>
              </button>

              <button
                type="button"
                onClick={() => setPickupMode('scheduled')}
                className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${pickupMode === 'scheduled'
                  ? 'border-sky-600 bg-sky-50 text-sky-700 shadow-md'
                  : 'border-gray-200 text-gray-500 hover:border-sky-200 hover:bg-sky-50/50'
                  }`}
              >
                <FaRegCalendarAlt className={`text-2xl mb-2 ${pickupMode === 'scheduled' ? 'text-sky-600' : 'text-gray-400'}`} />
                <span className="font-bold text-sm">{getTranslatedText("Schedule")}</span>
              </button>
            </div>

            {pickupMode === 'immediate' ? (
              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg flex items-center gap-3">
                <FaBolt className="text-yellow-600 text-xl" />
                <p className="text-sm text-yellow-800 font-medium">
                  {getTranslatedText("Scrapper will come immediately")}
                </p>
              </div>
            ) : (
              <>
                {/* Date selection */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FaCalendarAlt className="text-sky-600" />
                    {getTranslatedText("Select Date")}
                  </h4>
                  <div className="flex justify-center">
                    <Calendar
                      onChange={(date) => {
                        // Fix timezone offset issue
                        const offset = date.getTimezoneOffset();
                        const dateObj = new Date(date.getTime() - (offset * 60 * 1000));
                        const isoDate = dateObj.toISOString().split('T')[0];
                        setSelectedDate(isoDate);

                        // Update preferred time string
                        if (selectedSlot) {
                          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                          const dayName = dayNames[date.getDay()];
                          const [h, m] = selectedSlot.split(':');
                          const hour = parseInt(h);
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          const formattedTime = `${hour % 12 || 12}:${m} ${ampm}`;
                          setPreferredTime(`${getTranslatedText(dayName)}, ${isoDate} • ${formattedTime}`);
                        }
                      }}
                      value={selectedDate ? new Date(selectedDate) : new Date()}
                      minDate={new Date()}
                      className="w-full border-none shadow-sm rounded-lg"
                    />
                  </div>
                </div>

                {/* Time selection */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FaClock className="text-sky-600" />
                    {getTranslatedText("Select Time")}
                  </h4>
                  <div className="flex flex-col gap-2">
                    <TimePicker
                      onChange={(value) => {
                        setSelectedSlot(value);
                        if (selectedDate && value) {
                          const dateObj = new Date(selectedDate);
                          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                          const dayName = dayNames[dateObj.getDay()];
                          const [h, m] = value.split(':');
                          const hour = parseInt(h);
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          const formattedTime = `${hour % 12 || 12}:${m} ${ampm}`;
                          setPreferredTime(`${getTranslatedText(dayName)}, ${selectedDate} • ${formattedTime}`);
                        } else {
                          setPreferredTime('');
                        }
                      }}
                      value={selectedSlot}
                      className="w-full"
                      clearIcon={null}
                      clockIcon={<FaClock className="text-sky-600" />}
                      disableClock={false}
                      format="h:mm a"
                    />

                    {selectedSlot && (
                      <p className="text-sm text-gray-600 mt-2 text-center">
                        {(() => {
                          const [h, m] = selectedSlot.split(':');
                          const hour = parseInt(h);
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          return `${getTranslatedText("Selected Time")}: ${hour % 12 || 12}:${m} ${ampm}`;
                        })()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Small summary line when both selected */}
                {selectedDate && selectedSlot && (
                  <p className="mt-3 text-xs md:text-sm" style={{ color: '#718096' }}>
                    {getTranslatedText("You selected:")} <span className="font-semibold" style={{ color: '#2d3748' }}>{preferredTime}</span>
                  </p>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Footer with Apply Button - Fixed on Mobile */}
      <div
        className="fixed md:relative bottom-0 left-0 right-0 p-3 md:p-6 border-t"
        style={{
          borderColor: 'rgba(100, 148, 110, 0.2)',
          backgroundColor: '#f4ebe2',
          pointerEvents: 'auto',
          WebkitTapHighlightColor: 'transparent',
          zIndex: 9999
        }}
      >
        {isSubmitting ? (
          <div className="w-full py-3 md:py-4 rounded-full flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-6 h-6 md:w-8 md:h-8 rounded-full border-4"
              style={{ borderTopColor: '#38bdf8', borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' }}
            />
            <span className="ml-3 text-sm md:text-base font-semibold" style={{ color: '#38bdf8' }}>
              {getTranslatedText("Submitting Request...")}
            </span>
          </div>
        ) : (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => {
              console.log('Button clicked, isSubmitting:', isSubmitting, 'selectedDate:', selectedDate, 'selectedSlot:', selectedSlot);
              e.preventDefault();
              e.stopPropagation();
              if (!isSubmitting) {
                console.log('Calling handleSubmit');
                handleSubmit(e);
              } else {
                console.log('Already submitting, ignoring click');
              }
            }}
            type="button"
            disabled={isSubmitting}
            className="w-full py-4 md:py-5 rounded-full text-white font-bold text-base md:text-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#38bdf8',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              pointerEvents: 'auto',
              zIndex: 50,
              position: 'relative'
            }}
            whileTap={{ scale: 0.98 }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = '#5a8263';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = '#38bdf8';
              }
            }}
          >
            {weightData?.pricingType === 'negotiable'
              ? getTranslatedText("Apply for Pickup")
              : `${getTranslatedText("Apply for Pickup -")} ₹${estimatedPayout.toFixed(0)}`
            }
          </motion.button>
        )}
        <p className="text-xs md:text-sm text-center mt-3" style={{ color: '#718096' }}>
          {getTranslatedText("By applying, you agree to our terms and conditions")}
        </p>
      </div>
    </motion.div>
  );
};

export default PriceConfirmationPage;

