import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import { ITEM_CONDITIONS, NEGOTIABLE_CATEGORIES } from '../../../modules/shared/utils/priceFeedUtils';

const WeightInputPage = () => {
  const staticTexts = [
    "Enter Weight",
    "Step 1 of 5",
    "Uploaded Images",
    "Auto Detect",
    "Manual Input",
    "Analyzing Images...",
    "Detecting weight from your images",
    "Auto-detected Weight",
    "Based on image analysis",
    "Edit",
    "Click \"Auto Detect\" to analyze your images",
    "Enter Weight (kg)",
    "kg",
    "Quick Select:",
    "Estimated Payout",
    "for",
    "Enter weight to continue",
    "Continue with",
    "Plastic",
    "Metal",
    "Paper",
    "Electronics",
    "Copper",
    "Aluminium",
    "Steel",
    "Brass",
    "Note: The final payout will be determined by the scrap partner after inspection based on the material's quality, quantity, and condition. The displayed amount is only an estimate and may vary.",
    // Model B texts
    "Item Details",
    "Item Condition",
    "Select condition...",
    "Good Condition",
    "Average Condition",
    "Damaged / Broken",
    "Expected Price (₹)",
    "Enter your expected price",
    "Optional - Vendor will send you a quote",
    "Note: For this category, the final price will be decided by the vendor after inspection. Upload clear images for an accurate quote.",
    "Select item condition to continue",
    "Continue",
    "Negotiable",
    "Price decided by vendor",
    "Household",
    "Commercial",
    "Small Quantity",
    "Bulk (>100kg)",
    "Request Type:",
    "For commercial requests, total weight must be at least 100kg",
    "Enter weight for all materials to continue"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const location = useLocation();
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [marketPrices, setMarketPrices] = useState({});
  const [requestType, setRequestType] = useState('household');

  // Per-category weight state: { [categoryId]: string }
  const [categoryWeights, setCategoryWeights] = useState({});
  // Per-category quantity state (for items like AC/Fridge): { [categoryId]: string }
  const [categoryQuantities, setCategoryQuantities] = useState({});
  
  // Model B states (negotiable)
  const [itemCondition, setItemCondition] = useState('');
  const [expectedPrice, setExpectedPrice] = useState('');

  // Split categories into non-negotiable (need weight) and negotiable (need condition)
  const nonNegotiableCategories = selectedCategories.filter(cat =>
    cat.pricingType !== 'negotiable' && !NEGOTIABLE_CATEGORIES.includes(cat.id)
  );
  const negotiableCategories = selectedCategories.filter(cat =>
    cat.pricingType === 'negotiable' || NEGOTIABLE_CATEGORIES.includes(cat.id)
  );

  const hasMixed = nonNegotiableCategories.length > 0 && negotiableCategories.length > 0;
  const isOnlyNegotiable = nonNegotiableCategories.length === 0 && negotiableCategories.length > 0;
  const isOnlyKgBased = nonNegotiableCategories.length > 0 && negotiableCategories.length === 0;

  // Load data from sessionStorage
  useEffect(() => {
    const storedImages = sessionStorage.getItem('uploadedImages');
    let storedCategories = sessionStorage.getItem('selectedCategories');
    const storedWeightData = sessionStorage.getItem('weightData');

    if (storedImages) {
      setUploadedImages(JSON.parse(storedImages));
    }

    if (location.state?.preSelectedCategory) {
      const cat = { id: location.state.preSelectedCategory.toLowerCase(), name: location.state.preSelectedCategory };
      setSelectedCategories([cat]);
      sessionStorage.setItem('selectedCategories', JSON.stringify([cat]));
    } else if (storedCategories) {
      setSelectedCategories(JSON.parse(storedCategories));
    }

    // Hydrate weight/negotiable data if it exists (for handle Refresh)
    if (storedWeightData) {
      try {
        const parsed = JSON.parse(storedWeightData);
        if (parsed.categoryWeights) {
          const weightsMap = {};
          const quantitiesMap = {};
          parsed.categoryWeights.forEach(item => {
            if (item.weight) weightsMap[item.categoryId] = item.weight.toString();
            if (item.quantity) quantitiesMap[item.categoryId] = item.quantity.toString();
          });
          setCategoryWeights(weightsMap);
          setCategoryQuantities(quantitiesMap);
        }
        if (parsed.itemCondition) setItemCondition(parsed.itemCondition);
        if (parsed.expectedPrice) setExpectedPrice(parsed.expectedPrice.toString());
        if (parsed.quantityType) setRequestType(parsed.quantityType === 'large' ? 'commercial' : 'household');
      } catch (err) {
        console.error('Error parsing stored weight data:', err);
      }
    }
  }, [navigate, location.state]);

  // Handle auto-save for Persistence
  useEffect(() => {
    if (selectedCategories.length === 0) return;

    const currentWeightData = {
      weight: totalWeight,
      mode: 'manual',
      estimatedPayout: totalEstimatedPayout,
      pricingType: hasMixed ? 'mixed' : (isOnlyNegotiable ? 'negotiable' : 'kg_based'),
      quantityType: requestType === 'commercial' ? 'large' : 'small',
      categoryWeights: nonNegotiableCategories.map(cat => ({
        categoryId: cat.id,
        categoryName: cat.name,
        weight: parseFloat(categoryWeights[cat.id]) || 0,
        quantity: parseInt(categoryQuantities[cat.id]) || 0,
        price: getCategoryPrice(cat),
        estimatedPayout: (parseFloat(categoryWeights[cat.id]) || 0) * getCategoryPrice(cat),
      })),
      negotiableCategories: negotiableCategories.map(cat => ({
        categoryId: cat.id,
        categoryName: cat.name,
        quantity: parseInt(categoryQuantities[cat.id]) || 0,
      })),
      itemCondition: negotiableCategories.length > 0 ? itemCondition : null,
      expectedPrice: expectedPrice ? parseFloat(expectedPrice) : null,
    };

    sessionStorage.setItem('weightData', JSON.stringify(currentWeightData));
  }, [categoryWeights, categoryQuantities, itemCondition, expectedPrice, requestType, selectedCategories]);

  // Fetch market prices from backend
  useEffect(() => {
    const fetchMarketPrices = async () => {
      try {
        const { publicAPI } = await import('../../../modules/shared/utils/api');
        const response = await publicAPI.getPrices();

        if (response.success && response.data?.prices) {
          const pricesMap = {};
          response.data.prices.forEach(price => {
            pricesMap[price.category] = price.pricePerKg;
          });
          setMarketPrices(pricesMap);
        } else {
          setMarketPrices({
            'Plastic': 45, 'Metal': 180, 'Paper': 12, 'Electronics': 85,
            'Copper': 650, 'Aluminium': 180, 'Steel': 35, 'Brass': 420,
          });
        }
      } catch (error) {
        console.error('Failed to fetch market prices:', error);
        setMarketPrices({
          'Plastic': 45, 'Metal': 180, 'Paper': 12, 'Electronics': 85,
          'Copper': 650, 'Aluminium': 180, 'Steel': 35, 'Brass': 420,
        });
      }
    };
    fetchMarketPrices();
  }, []);

  // Helper: get price for a category
  const getCategoryPrice = (cat) => {
    const apiInfo = marketPrices[cat.name];
    return (typeof apiInfo === 'object' ? apiInfo.pricePerKg : (apiInfo || 0)) || cat.price || 0;
  };

  // Per-category estimated payout
  const getCategoryPayout = (cat) => {
    const weight = parseFloat(categoryWeights[cat.id]) || 0;
    return weight * getCategoryPrice(cat);
  };

  // Total estimated payout (only for non-negotiable)
  const totalEstimatedPayout = nonNegotiableCategories.reduce((sum, cat) => sum + getCategoryPayout(cat), 0);

  // Total weight across all non-negotiable categories
  const totalWeight = nonNegotiableCategories.reduce((sum, cat) => sum + (parseFloat(categoryWeights[cat.id]) || 0), 0);

  const handleWeightChange = (catId, value) => {
    const regex = /^\d*\.?\d*$/;
    if (regex.test(value) || value === '') {
      setCategoryWeights(prev => ({ ...prev, [catId]: value }));
    }
  };

  const handleQuickWeight = (catId, weight) => {
    setCategoryWeights(prev => ({ ...prev, [catId]: weight.toString() }));
  };

  const handleExpectedPriceChange = (value) => {
    const regex = /^\d*$/;
    if (regex.test(value) || value === '') {
      setExpectedPrice(value);
    }
  };

  const handleQuantityChange = (catId, value) => {
    const regex = /^\d*$/;
    if (regex.test(value) || value === '') {
      setCategoryQuantities(prev => ({ ...prev, [catId]: value }));
    }
  };

  // Commercial validation: total weight must be >= 100kg for commercial requests (if items are kg-based)
  const isWeightValidForRequestType = (requestType === 'commercial' && nonNegotiableCategories.length > 0)
    ? totalWeight >= 100
    : true;

  // canContinue logic: Check if each non-negotiable category has either weight or quantity filled
  const allKgInputsFilled = nonNegotiableCategories.every(cat =>
    (parseFloat(categoryWeights[cat.id]) > 0) || (parseInt(categoryQuantities[cat.id]) > 0)
  );

  // For negotiable items, condition is mandatory
  const conditionFilled = negotiableCategories.length === 0 || !!itemCondition;

  const canContinue = (nonNegotiableCategories.length === 0 || allKgInputsFilled) && conditionFilled && isWeightValidForRequestType;

  const handleContinue = () => {
    if (!canContinue) return;

    let pricingType = 'kg_based';
    if (hasMixed) pricingType = 'mixed';
    else if (isOnlyNegotiable) pricingType = 'negotiable';

    // Build per-category weight details (for non-negotiable)
    const categoryWeightDetails = nonNegotiableCategories.map(cat => ({
      categoryId: cat.id,
      categoryName: cat.name,
      weight: parseFloat(categoryWeights[cat.id]) || 0,
      quantity: parseInt(categoryQuantities[cat.id]) || 0,
      price: getCategoryPrice(cat),
      estimatedPayout: getCategoryPayout(cat),
    }));

    const negotiableCategoryDetails = negotiableCategories.map(cat => ({
      categoryId: cat.id,
      categoryName: cat.name,
      weight: parseFloat(categoryWeights[cat.id]) || 0,
      quantity: parseInt(categoryQuantities[cat.id]) || 0,
    }));

    const weightData = {
      // Backward-compatible fields for PriceConfirmationPage
      weight: totalWeight,
      mode: 'manual',
      estimatedPayout: totalEstimatedPayout,
      pricingType,
      quantityType: requestType === 'commercial' ? 'large' : 'small',

      // New structured per-category data
      categoryWeights: categoryWeightDetails,
      negotiableCategories: negotiableCategoryDetails,

      // Negotiable-specific
      itemCondition: negotiableCategories.length > 0 ? itemCondition : null,
      expectedPrice: expectedPrice ? parseFloat(expectedPrice) : null,
    };

    sessionStorage.setItem('weightData', JSON.stringify(weightData));
    navigate('/user/add-scrap/upload');
  };

  const quickWeights = [5, 10, 15, 20, 25, 30];

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
          onClick={() => navigate('/user/add-scrap/category')}
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
          {isOnlyNegotiable ? getTranslatedText("Item Details") : getTranslatedText("Enter Weight")}
        </h2>
        <div className="w-10"></div>
      </div>

      {/* Progress Indicator */}
      <div className="px-3 md:px-6 pt-3 md:pt-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'rgba(100, 148, 110, 0.2)' }}>
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '20%' }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full"
              style={{ backgroundColor: '#38bdf8' }}
            />
          </div>
          <span className="text-xs md:text-sm" style={{ color: '#718096' }}>{getTranslatedText("Step 1 of 5")}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-24 md:pb-6">
        {/* Image Preview */}
        {uploadedImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 md:mb-6"
          >
            <p className="text-xs md:text-sm mb-2" style={{ color: '#718096' }}>
              {getTranslatedText("Uploaded Images")} ({uploadedImages.length})
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {uploadedImages.slice(0, 3).map((image) => (
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
              {uploadedImages.length > 3 && (
                <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg flex items-center justify-center bg-gray-200">
                  <span className="text-xs md:text-sm font-semibold" style={{ color: '#718096' }}>
                    +{uploadedImages.length - 3}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Request Type Selection */}
        <div className="mb-6">
          <p className="text-xs md:text-sm mb-2" style={{ color: '#718096' }}>
            {getTranslatedText("Request Type:")}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setRequestType('household')}
              className={`flex-1 p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${requestType === 'household'
                ? 'border-sky-600 bg-sky-50 text-sky-700 shadow-md transform scale-[1.02]'
                : 'border-slate-200 bg-white text-slate-500 hover:border-sky-200'
                }`}
            >
              <span className="text-2xl">🏠</span>
              <span className="text-sm font-bold">{getTranslatedText("Household")}</span>
              <span className="text-[10px] opacity-75">{getTranslatedText("Small Quantity")}</span>
            </button>

            <button
              onClick={() => setRequestType('commercial')}
              className={`flex-1 p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${requestType === 'commercial'
                ? 'border-sky-600 bg-sky-50 text-sky-700 shadow-md transform scale-[1.02]'
                : 'border-slate-200 bg-white text-slate-500 hover:border-sky-200'
                }`}
            >
              <span className="text-2xl">🏭</span>
              <span className="text-sm font-bold">{getTranslatedText("Commercial")}</span>
              <span className="text-[10px] opacity-75">{getTranslatedText("Bulk (>100kg)")}</span>
            </button>
          </div>
        </div>

        {/* ============ SECTION 1: KG-BASED (per category weight) ============ */}
        {nonNegotiableCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            {hasMixed && (
              <p className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: '#38bdf8' }}>
                ⚖️ Enter Weight per Material
              </p>
            )}

            <div className="space-y-4">
              {nonNegotiableCategories.map((cat) => {
                const price = getCategoryPrice(cat);
                const weight = parseFloat(categoryWeights[cat.id]) || 0;
                const payout = weight * price;

                return (
                  <div
                    key={cat.id}
                    className="rounded-xl p-4 md:p-5"
                    style={{ backgroundColor: '#ffffff' }}
                  >
                    {/* Category label row */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#2d3748' }}>{cat.name}</p>
                        <p className="text-xs" style={{ color: '#718096' }}>₹{price}/{getTranslatedText("kg")}</p>
                      </div>
                      {weight > 0 && (
                        <span className="text-sm font-bold" style={{ color: '#38bdf8' }}>
                          ≈ ₹{payout.toFixed(0)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      {/* Weight Input */}
                      <div className="relative">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{getTranslatedText("Weight")}</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={categoryWeights[cat.id] || ''}
                            onChange={(e) => handleWeightChange(cat.id, e.target.value)}
                            placeholder="0.0"
                            className="w-full py-3 px-3 text-lg font-bold rounded-lg border-2 focus:outline-none focus:ring-2 transition-all"
                            style={{
                              borderColor: categoryWeights[cat.id] ? '#38bdf8' : 'rgba(100, 148, 110, 0.3)',
                              color: '#2d3748',
                              backgroundColor: '#f9f9f9'
                            }}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: '#718096' }}>
                            {getTranslatedText("kg")}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Input */}
                      <div className="relative">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{getTranslatedText("Quantity")}</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={categoryQuantities[cat.id] || ''}
                            onChange={(e) => handleQuantityChange(cat.id, e.target.value)}
                            placeholder="0"
                            className="w-full py-3 px-3 text-lg font-bold rounded-lg border-2 focus:outline-none focus:ring-2 transition-all"
                            style={{
                              borderColor: categoryQuantities[cat.id] ? '#38bdf8' : 'rgba(100, 148, 110, 0.2)',
                              color: '#2d3748',
                              backgroundColor: '#f9f9f9'
                            }}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: '#718096' }}>
                            {getTranslatedText("Nos")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Weight Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {quickWeights.map((w) => (
                        <button
                          key={w}
                          onClick={() => handleQuickWeight(cat.id, w)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 border-2"
                          style={{
                            borderColor: categoryWeights[cat.id] === w.toString() ? '#38bdf8' : 'rgba(100, 148, 110, 0.3)',
                            backgroundColor: categoryWeights[cat.id] === w.toString() ? '#38bdf8' : 'transparent',
                            color: categoryWeights[cat.id] === w.toString() ? '#ffffff' : '#38bdf8'
                          }}
                        >
                          {w} {getTranslatedText("kg")}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Estimated Payout (only when all weights are filled) */}
            {totalEstimatedPayout > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-4 md:p-5 mt-4"
                style={{ backgroundColor: 'rgba(100, 148, 110, 0.1)' }}
              >
                <p className="text-xs md:text-sm mb-2" style={{ color: '#718096' }}>
                  {getTranslatedText("Estimated Payout")}
                </p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl md:text-3xl font-bold" style={{ color: '#38bdf8' }}>
                    ₹{totalEstimatedPayout.toFixed(0)}
                  </span>
                  <span className="text-sm" style={{ color: '#718096' }}>
                    {getTranslatedText("for")} {totalWeight.toFixed(1)} {getTranslatedText("kg")}
                  </span>
                </div>
                <div className="text-xs" style={{ color: '#718096' }}>
                  {nonNegotiableCategories.map((cat, idx) => {
                    const price = getCategoryPrice(cat);
                    return (
                      <span key={cat.id}>
                        {getTranslatedText(cat.name)} @ ₹{price}/{getTranslatedText("kg")}
                        {idx < nonNegotiableCategories.length - 1 && ' • '}
                      </span>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Disclaimer */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl border-l-4 shadow-sm"
              style={{ backgroundColor: 'rgba(56, 189, 248, 0.08)', borderColor: '#38bdf8' }}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </div>
                <p className="text-xs md:text-sm leading-relaxed" style={{ color: '#4a5568', fontWeight: '500' }}>
                  <span style={{ color: '#38bdf8', fontWeight: '700' }}>Note:</span> {getTranslatedText("Note: The final payout will be determined by the scrap partner after inspection based on the material's quality, quantity, and condition. The displayed amount is only an estimate and may vary.")}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Divider for mixed */}
        {hasMixed && (
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(100, 148, 110, 0.3)' }} />
            <span className="text-xs font-semibold" style={{ color: '#718096' }}>+ NEGOTIABLE ITEMS</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(100, 148, 110, 0.3)' }} />
          </div>
        )}

        {/* ============ SECTION 2: NEGOTIABLE (condition form) ============ */}
        {negotiableCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Show negotiable category names */}
            {hasMixed && (
              <div className="flex flex-wrap gap-2 mb-1">
                {negotiableCategories.map(cat => (
                  <span key={cat.id} className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#b45309' }}>
                    {cat.name}
                  </span>
                ))}
              </div>
            )}

            <div className="rounded-xl p-4 md:p-6" style={{ backgroundColor: '#ffffff' }}>
              <p className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: '#38bdf8' }}>
                📏 Enter Item Details (Fill either or both)
              </p>
              <div className="space-y-6">
                {negotiableCategories.map(cat => (
                  <div key={cat.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                    <p className="text-sm font-bold mb-3 text-slate-800">{cat.name}</p>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Weight for Negotiable */}
                      <div className="relative">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{getTranslatedText("Weight")}</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={categoryWeights[cat.id] || ''}
                            onChange={(e) => handleWeightChange(cat.id, e.target.value)}
                            placeholder="0.0"
                            className="w-full py-2 px-3 text-sm font-bold rounded-lg border-2 focus:outline-none focus:ring-2 transition-all bg-white"
                            style={{
                              borderColor: categoryWeights[cat.id] ? '#38bdf8' : 'rgba(100, 148, 110, 0.2)',
                              color: '#2d3748'
                            }}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                            {getTranslatedText("kg")}
                          </span>
                        </div>
                      </div>

                      {/* Quantity for Negotiable */}
                      <div className="relative">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{getTranslatedText("Quantity")}</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={categoryQuantities[cat.id] || ''}
                            onChange={(e) => handleQuantityChange(cat.id, e.target.value)}
                            placeholder="0"
                            className="w-full py-2 px-3 text-sm font-bold rounded-lg border-2 focus:outline-none focus:ring-2 transition-all bg-white"
                            style={{
                              borderColor: categoryQuantities[cat.id] ? '#38bdf8' : 'rgba(100, 148, 110, 0.2)',
                              color: '#2d3748'
                            }}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                            {getTranslatedText("Nos")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Negotiable Badge */}
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
            >
              <span className="text-xl">🤝</span>
              <div>
                <p className="text-sm font-bold" style={{ color: '#b45309' }}>
                  {getTranslatedText("Negotiable")}
                </p>
                <p className="text-xs" style={{ color: '#92400e' }}>
                  {getTranslatedText("Price decided by vendor")}
                </p>
              </div>
            </div>

            {/* Item Condition Dropdown */}
            <div className="rounded-xl p-4 md:p-6" style={{ backgroundColor: '#ffffff' }}>
              <label className="block text-xs md:text-sm font-semibold mb-3" style={{ color: '#2d3748' }}>
                {getTranslatedText("Item Condition")} <span style={{ color: '#e53e3e' }}>*</span>
              </label>
              <div className="flex flex-col gap-2">
                {ITEM_CONDITIONS.map((condition) => (
                  <button
                    key={condition.value}
                    onClick={() => setItemCondition(condition.value)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${itemCondition === condition.value
                      ? 'border-sky-500 bg-sky-50 shadow-md'
                      : 'border-slate-200 bg-white hover:border-sky-200'
                      }`}
                  >
                    <span className="text-xl">
                      {condition.value === 'good' ? '✅' : condition.value === 'average' ? '⚠️' : '🔧'}
                    </span>
                    <span className={`text-sm font-semibold ${itemCondition === condition.value ? 'text-sky-700' : 'text-slate-600'}`}>
                      {getTranslatedText(condition.label)}
                    </span>
                    {itemCondition === condition.value && (
                      <svg className="ml-auto w-5 h-5 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Expected Price Input (Optional) */}
            <div className="rounded-xl p-4 md:p-6" style={{ backgroundColor: '#ffffff' }}>
              <label className="block text-xs md:text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                {getTranslatedText("Expected Price (₹)")}
              </label>
              <p className="text-xs mb-3" style={{ color: '#a0aec0' }}>
                {getTranslatedText("Optional - Vendor will send you a quote")}
              </p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg md:text-xl font-semibold" style={{ color: '#718096' }}>₹</span>
                <input
                  type="text"
                  value={expectedPrice}
                  onChange={(e) => handleExpectedPriceChange(e.target.value)}
                  placeholder="0"
                  className="w-full py-3 md:py-4 pl-10 pr-4 text-2xl md:text-3xl font-bold rounded-lg border-2 focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: expectedPrice ? '#38bdf8' : 'rgba(100, 148, 110, 0.3)',
                    color: '#2d3748',
                    backgroundColor: '#f9f9f9'
                  }}
                />
              </div>
            </div>

            {/* Negotiable Note */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border-l-4 shadow-sm"
              style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: '#f59e0b' }}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </div>
                <p className="text-xs md:text-sm leading-relaxed" style={{ color: '#4a5568', fontWeight: '500' }}>
                  <span style={{ color: '#b45309', fontWeight: '700' }}>Note:</span> {getTranslatedText("Note: For this category, the final price will be decided by the vendor after inspection. Upload clear images for an accurate quote.")}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Footer with Continue Button - Fixed on Mobile */}
      <div
        className="fixed md:relative bottom-0 left-0 right-0 p-3 md:p-6 border-t z-50"
        style={{
          borderColor: 'rgba(100, 148, 110, 0.2)',
          backgroundColor: '#f4ebe2'
        }}
      >
        {canContinue ? (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleContinue}
            className="w-full py-3 md:py-4 rounded-full text-white font-semibold text-sm md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            style={{ backgroundColor: '#38bdf8' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#5a8263'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#38bdf8'}
          >
            {isOnlyNegotiable
              ? getTranslatedText("Continue")
              : hasMixed
                ? `${getTranslatedText("Continue with")} ${totalWeight.toFixed(1)} ${getTranslatedText("kg")} + ${negotiableCategories.length} Negotiable`
                : `${getTranslatedText("Continue with")} ${totalWeight.toFixed(1)} ${getTranslatedText("kg")}`
            }
          </motion.button>
        ) : (
          <p
            className="text-xs md:text-sm text-center"
            style={{ color: '#718096' }}
          >
            {requestType === 'commercial' && nonNegotiableCategories.length > 0 && totalWeight < 100
              ? getTranslatedText("For commercial requests, total weight must be at least 100kg")
              : isOnlyNegotiable
                ? getTranslatedText("Select item condition to continue")
                : hasMixed && !allKgWeightsFilled
                  ? getTranslatedText("Enter weight for all materials to continue")
                  : hasMixed && !conditionFilled
                    ? getTranslatedText("Select item condition to continue")
                    : getTranslatedText("Enter weight or quantity to continue")
            }
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default WeightInputPage;
