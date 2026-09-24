import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import plasticImage from '../../../modules/user/assets/plastic.jpg';
import metalImage from '../../../modules/user/assets/metal1.jpg';
import copperImage from '../../../modules/user/assets/metal.jpg';
import aluminiumImage from '../../../modules/user/assets/Aluminium.jpg';
import brassImage from '../../../modules/user/assets/brass.jpg';
import steelImage from '../../../modules/user/assets/metal2.jpg';
import scrapImage2 from '../../../modules/user/assets/scrab.png';
import electronicImage from '../../../modules/user/assets/electronicbg.png';
import woodTableImage from '../../../modules/user/assets/wooditem/table.jpg';
import woodChairImage from '../../../modules/user/assets/wooditem/chair.jpg';
import woodBedImage from '../../../modules/user/assets/wooditem/Beds.jpg';
import woodOtherImage from '../../../modules/user/assets/wooditem/other_furniture.jpg';
import woodAnotherImage from '../../../modules/user/assets/wooditem/wood_another.jpg';
import v2WheelerImage from '../../../modules/user/assets/vehicle_categry/2 wheecle.png';
import v4WheelerImage from '../../../modules/user/assets/vehicle_categry/4 wheecle.jpg';
import vAutoPartsImage from '../../../modules/user/assets/vehicle_categry/autoparts.png';
import vTyreImage from '../../../modules/user/assets/vehicle_categry/tyre.jpg';
import vBatteryImage from '../../../modules/user/assets/vehicle_categry/baterry.jpg';
import vOtherVehicleImage from '../../../modules/user/assets/vehicle_categry/other_vehical_parts.jpg';
import hACImage from '../../../modules/user/assets/home_appliance/Ac.jpg';
import hFridgeImage from '../../../modules/user/assets/home_appliance/Fridge.jpg';
import hWMImage from '../../../modules/user/assets/home_appliance/washing_machine.jpg';
import hTVImage from '../../../modules/user/assets/home_appliance/TV.jpg';
import hMicroImage from '../../../modules/user/assets/home_appliance/Microwave.jpg';
import hOtherApplianceImage from '../../../modules/user/assets/home_appliance/other.jpg';
import eBatteryImage from '../../../modules/user/assets/e-waste/battery.png';
import eCablesImage from '../../../modules/user/assets/e-waste/cables.png';
import eComputerImage from '../../../modules/user/assets/e-waste/computer.png';
import eLaptopImage from '../../../modules/user/assets/e-waste/laptop.png';
import eMotherboardImage from '../../../modules/user/assets/e-waste/motherboar.png';
import eOtherEWasteImage from '../../../modules/user/assets/e-waste/other_e-waste.png';





import { publicAPI } from '../../../modules/shared/utils/api';
import { getEffectivePriceFeed, NEGOTIABLE_CATEGORIES } from '../../../modules/shared/utils/priceFeedUtils';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const CategorySelectionPage = () => {
  const staticTexts = [
    "Select Scrap Category",
    "Step 1 of 5",
    "Continue with",
    "Category",
    "Categories",
    "Selected:",
    "Select one or more categories to continue",
    "kg",
    "Plastic",
    "Metal",
    "Paper",
    "Copper",
    "Aluminium",
    "Steel",
    "Brass",
    "E-Waste",
    "Scrap Iron",
    "Raddi",
    "Furniture",
    "Vehicle Scrap",
    "Home Appliance",
    "Table",
    "Chair",
    "Sofa",
    "Bed",
    "Wooden Items",
    "Other Furniture",
    "AC",
    "Fridge",
    "Washing Machine",
    "TV",
    "Microwave",
    "Other Appliance",
    "2-Wheeler",
    "4-Wheeler",
    "Auto Parts",
    "Tyre",
    "Battery",
    "Other Vehicle Parts"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to get image based on category name
  const getCategoryImage = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("plastic")) return plasticImage;
    if (lowerName.includes("aluminium")) return aluminiumImage;
    if (lowerName.includes("copper")) return copperImage;
    if (lowerName.includes("brass")) return brassImage;
    if (lowerName.includes("steel")) return steelImage;
    if (lowerName.includes("iron") || lowerName.includes("metal")) return metalImage;
    if (lowerName.includes("paper") || lowerName.includes("book") || lowerName.includes("raddi")) return scrapImage2;
    if (lowerName.includes("laptop") || lowerName.includes("mobile")) return eLaptopImage;
    if (lowerName.includes("battery")) return vBatteryImage;
    if (lowerName.includes("ac")) return hACImage;
    if (lowerName.includes("fridge")) return hFridgeImage;
    if (lowerName.includes("washing machine")) return hWMImage;
    if (lowerName.includes("vehicle") || lowerName.includes("car") || lowerName.includes("bike")) return v4WheelerImage;
    return plasticImage; // Default fallback
  };

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);

      try {
        const response = await publicAPI.getPrices();

        if (response.success && response.data?.prices) {
          const apiMaterials = response.data.prices.filter(p => p.isActive !== false && (!p.type || p.type === 'material'));

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

          const mapped = apiMaterials.map(p => ({
            id: p._id,
            name: formatCategoryName(p.category),
            image: p.image || getCategoryImage(p.category),
            price: p.pricePerKg || p.price || 0,
            minPrice: p.minPrice,
            maxPrice: p.maxPrice,
            unit: p.unit || 'kg',
            pricingType: p.isNegotiable ? 'negotiable' : 'kg_based'
          }));

          setCategories(mapped);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const currentLevelCategories = categories;

  // Modal for "Other" category input
  const [showOtherModal, setShowOtherModal] = useState(false);
  const [otherItemInput, setOtherItemInput] = useState('');
  const [activeOtherCategory, setActiveOtherCategory] = useState(null);
  const [otherIsNegotiable, setOtherIsNegotiable] = useState(true);

  const handleSomethingElse = () => {
    setActiveOtherCategory({
      id: 'general_other',
      name: 'Other Item',
      pricingType: 'negotiable',
      price: 0,
      image: eOtherEWasteImage // Default fallback icon
    });
    setOtherItemInput('');
    setOtherIsNegotiable(true);
    setShowOtherModal(true);
  };

  const handleCategoryClick = (category) => {
    // If it's a special "Other" item trigger
    if (category.isCustomTrigger) {
      handleSomethingElse();
      return;
    }

    // Check if it's an "Other" category (from DB or preset)
    if (category.id?.endsWith('_other')) {
      setActiveOtherCategory(category);
      setOtherItemInput('');
      setOtherIsNegotiable(true);
      setShowOtherModal(true);
      return;
    }

    setSelectedCategories(prev => {
      // Toggle selection
      const isSelected = prev.some(cat => cat.id === category.id);
      if (isSelected) {
        return prev.filter(cat => cat.id !== category.id);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleOtherSubmit = (e) => {
    e.preventDefault();
    if (otherItemInput.trim()) {
      const customCategory = {
        ...activeOtherCategory,
        name: otherItemInput.trim(), // Replace generic name with user input
        pricingType: otherIsNegotiable ? 'negotiable' : 'kg_based',
        id: `${activeOtherCategory.id}_${Date.now()}` // Unique ID for this specific selection
      };
      setSelectedCategories(prev => [...prev, customCategory]);
      setShowOtherModal(false);
      setActiveOtherCategory(null);
    }
  };

  const handleContinue = () => {
    if (selectedCategories.length > 0) {
      // Store selected categories in sessionStorage for next step
      sessionStorage.setItem('selectedCategories', JSON.stringify(selectedCategories));
      // Navigate to next step (will be Stage 2: Image Upload)
      navigate('/user/add-scrap/weight');
    }
  };

  const isCategorySelected = (categoryId) => {
    return selectedCategories.some(cat => cat.id === categoryId || (typeof cat.id === 'string' && cat.id.startsWith(categoryId + '_')));
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: '#f0f9ff' }}
    >
      {/* Compact Header */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b shadow-sm" style={{ borderColor: '#e0f2fe', backgroundColor: '#ffffff' }}>
        <button
          onClick={() => navigate('/user')}
          className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
          style={{ backgroundColor: '#ffffff', border: '1.5px solid #e0f2fe' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: '#000000' }}>
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <h2
          className="text-lg md:text-xl font-bold"
          style={{ color: '#1e293b' }}
        >
          {getTranslatedText("Select Scrap Category")}
        </h2>
        <div className="w-9"></div>
      </div>

      {/* Compact Progress Indicator */}
      <div className="px-3 md:px-4 pt-3 bg-white">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: '#e0f2fe' }}>
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '20%' }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full"
              style={{ backgroundColor: '#0ea5e9' }}
            />
          </div>
          <span className="text-xs font-bold" style={{ color: '#1e293b' }}>{getTranslatedText("Step 1 of 5")}</span>
        </div>
      </div>

      {/* Optimized Categories Grid */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 pb-24 md:pb-6">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {categories.map((category, index) => (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className="cursor-pointer flex flex-col items-center"
            >
              {/* Compact Circular Image */}
              <div
                className="relative w-16 h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full overflow-hidden shadow-md hover:shadow-lg transition-all duration-200"
                style={{
                  border: isCategorySelected(category.id) ? '2.5px solid #0ea5e9' : '1.5px solid #e0f2fe',
                  backgroundColor: 'white'
                }}
              >
                <img
                  src={category.image}
                  alt={getTranslatedText(category.name)}
                  className="w-full h-full object-contain p-1"
                  loading="lazy"
                />
                {isCategorySelected(category.id) && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(14, 165, 233, 0.25)' }}
                  >
                    <div
                      className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center shadow-md"
                      style={{ backgroundColor: '#0ea5e9' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white md:w-5 md:h-5">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* Compact Category Info */}
              <div className="mt-1.5 md:mt-2 text-center w-full px-1 flex flex-col items-center">
                <div className="w-full min-h-[32px] mb-1 flex items-start justify-center">
                  <p
                    className="text-[11px] md:text-xs font-bold leading-tight text-center"
                    style={{ 
                      color: '#1e293b', 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      whiteSpace: 'normal'
                    }}
                  >
                    {getTranslatedText(category.name)}
                  </p>
                </div>
                <p
                  className="text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-md inline-block"
                  style={{
                    color: category.pricingType === 'negotiable' ? '#92400e' : '#000000',
                    backgroundColor: category.pricingType === 'negotiable' ? '#fef3c7' : '#f1f5f9'
                  }}
                >
                  {category.pricingType === 'negotiable'
                    ? (
                      <div className="flex flex-col items-center gap-0.5">
                        {category.unit && (category.unit.toLowerCase().includes('pic') || category.unit.toLowerCase().includes('pc')) && (
                          <span className="text-[9px] md:text-[10px] font-bold" style={{ color: '#1e293b' }}>
                             {category.minPrice && category.maxPrice 
                              ? `₹${category.minPrice}-${category.maxPrice}/${getTranslatedText(category.unit)}`
                              : `₹${category.price || 0}/${getTranslatedText(category.unit)}`}
                          </span>
                        )}
                        <span className="flex items-center gap-1"><span className="text-amber-500 text-[8px] md:text-[10px]">💛</span> {getTranslatedText('Negotiable')}</span>
                      </div>
                    )
                    : (
                      category.minPrice && category.maxPrice 
                        ? `₹${category.minPrice} - ${category.maxPrice}/${getTranslatedText(category.unit || 'kg')}`
                        : `₹${category.price}/${getTranslatedText(category.unit || 'kg')}`
                    )
                  }
                </p>
              </div>
            </div>
          ))}
          {/* Logical placement: "Something else" always at the end of the list */}
          <div
            onClick={handleSomethingElse}
            className="cursor-pointer flex flex-col items-center group"
          >
            <div
              className="relative w-16 h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm border-2 border-dashed border-sky-400 bg-sky-50 group-hover:bg-sky-100 group-hover:border-sky-500"
            >
              <span className="text-2xl text-sky-500">➕</span>
            </div>
            <div className="mt-1.5 md:mt-2 text-center w-full px-1 flex flex-col items-center">
              <div className="w-full min-h-[32px] mb-1 flex items-start justify-center">
                <p className="text-[10px] md:text-xs font-bold text-sky-600 line-clamp-2 leading-tight">
                  {getTranslatedText("Something else?")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* "Other" Item Input Modal */}
      {showOtherModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-slate-800">
                {getTranslatedText("Specify Item")}
              </h3>
              <button onClick={() => setShowOtherModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              {getTranslatedText("Please enter the name of the item you want to sell.")}
            </p>
            <form onSubmit={handleOtherSubmit}>
              <input
                autoFocus
                type="text"
                placeholder={getTranslatedText("e.g. Broken Scanner, Iron Chair...")}
                value={otherItemInput}
                onChange={(e) => setOtherItemInput(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-100 focus:border-sky-500 focus:outline-none transition-colors text-lg font-medium mb-4"
              />

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl mb-6 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setOtherIsNegotiable(!otherIsNegotiable)}>
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${otherIsNegotiable ? 'bg-sky-500 border-sky-500' : 'bg-white border-slate-300'}`}>
                  {otherIsNegotiable && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700">{getTranslatedText("Negotiable Price")}</p>
                  <p className="text-[10px] text-slate-500">{getTranslatedText("Price decided after scrapper survey")}</p>
                </div>
                <span className="text-xl">{otherIsNegotiable ? '💛' : '⚖️'}</span>
              </div>

              <button
                type="submit"
                disabled={!otherItemInput.trim()}
                className="w-full py-4 rounded-2xl bg-sky-500 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:shadow-none"
              >
                {getTranslatedText("Add Item")}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Compact Footer */}
      <div
        className="fixed md:relative bottom-0 left-0 right-0 p-3 md:p-4 border-t z-50 shadow-lg"
        style={{
          borderColor: '#e0f2fe',
          backgroundColor: '#ffffff'
        }}
      >
        {selectedCategories.length > 0 ? (
          <div>
            <button
              onClick={handleContinue}
              className="w-full py-2.5 md:py-3 rounded-full text-white font-bold text-sm md:text-base shadow-lg hover:shadow-xl transition-shadow duration-200"
              style={{ backgroundColor: '#0ea5e9' }}
            >
              {getTranslatedText("Continue with")} {selectedCategories.length} {selectedCategories.length === 1 ? getTranslatedText("Category") : getTranslatedText("Categories")}
            </button>
            <p
              className="text-xs text-center mt-1.5 font-semibold truncate px-2"
              style={{ color: '#1e293b' }}
            >
              {getTranslatedText("Selected:")} {selectedCategories.map(cat => getTranslatedText(cat.name)).join(', ')}
            </p>
          </div>
        ) : (
          <p
            className="text-xs text-center font-semibold"
            style={{ color: '#64748b' }}
          >
            {getTranslatedText("Select one or more categories to continue")}
          </p>
        )}
      </div>
    </div>
  );
};

export default CategorySelectionPage;


