import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import PriceTicker from "./PriceTicker";
import TrustSignals from "./TrustSignals";
import Testimonials from "./Testimonials";
import OTPModal from "./OTPModal";

import { usePageTranslation } from "../../../hooks/usePageTranslation";
import { useDynamicTranslation } from "../../../hooks/useDynamicTranslation";
import scrapImage from "../assets/truck.png";
import scrapImage2 from "../assets/scrab.png";
import scrapImage3 from "../assets/scrap5.png";
import plasticImage from "../assets/plastic.jpg";
import metalImage from "../assets/metal1.jpg";
import copperImage from "../assets/metal.jpg";
import electronicImage from "../assets/electronicbg.png";
import aluminiumImage from "../assets/Aluminium.jpg";
import brassImage from "../assets/brass.jpg";
import steelImage from "../assets/metal2.jpg";

// Specific Category Images
import vehicleImage from "../assets/vehicle_categry/4 wheecle.jpg";
import furnitureImage from "../assets/wooditem/chair.jpg";
import homeApplianceImage from "../assets/home_appliance/washing_machine.jpg";
import eWasteImage from "../assets/e-waste/motherboar.png";
import paperImage from "../assets/scrap5.png";

import BannerSlider from "../../shared/components/BannerSlider";
import { publicAPI } from "../../shared/utils/api";
import { getEffectivePriceFeed, PRICE_TYPES } from "../../shared/utils/priceFeedUtils";

const Hero = () => {
  const navigate = useNavigate();
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isWebView, setIsWebView] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: null, lng: null });
  const [locationAddress, setLocationAddress] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const heroRef = useRef(null);
  const bannerIntervalRef = useRef(null);
  const locationInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const { translateObject, translateBatch } = useDynamicTranslation();

  const originalBanners = useMemo(
    () => [
      {
        title: "REDUCE REUSE RECYCLE",
        description:
          "Learn tips to apply these 3 steps and earn money from your scrap.",
        image: scrapImage,
      },
      {
        title: "GET BEST PRICES",
        description:
          "Real-time market rates ensure you get the maximum value for your scrap materials.",
        image: scrapImage2,
      },
      {
        title: "VERIFIED COLLECTORS",
        description:
          "All our scrappers are KYC verified and background checked for your safety.",
        image: scrapImage3,
      },
    ],
    []
  );



  const [banners, setBanners] = useState(originalBanners);
  const [rawCategories, setRawCategories] = useState([]);
  const [activeCategories, setActiveCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Helper to get image based on category name
  const getCategoryImage = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("plastic")) return plasticImage;
    if (lowerName.includes("aluminium")) return aluminiumImage;
    if (lowerName.includes("copper")) return copperImage;
    if (
      lowerName.includes("metal") ||
      lowerName.includes("iron") ||
      lowerName.includes("steel") ||
      lowerName.includes("brass")
    )
      return metalImage;
    if (
      lowerName.includes("paper") ||
      lowerName.includes("book") ||
      lowerName.includes("cardboard") ||
      lowerName.includes("raddi")
    )
      return scrapImage2;
    if (
      lowerName.includes("electron") ||
      lowerName.includes("device") ||
      lowerName.includes("computer") ||
      lowerName.includes("phone") ||
      lowerName.includes("e-waste")
    )
      return eWasteImage;
    if (lowerName.includes("appliance")) return homeApplianceImage;
    if (lowerName.includes("furniture")) return furnitureImage;
    if (lowerName.includes("vehicle")) return vehicleImage;
    return scrapImage2; // Default fallback
  };

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);

      try {
        const response = await publicAPI.getPrices();
        if (response.success && response.data?.prices) {
          const apiMaterials = response.data.prices.filter(p => p.isActive !== false && (!p.type || p.type === 'material'));
          
          const mapped = apiMaterials.map(p => ({
            name: p.category,
            originalName: p.category,
            // Use admin-uploaded image or fallback to local icons
            image: p.image || getCategoryImage(p.category)
          }));

          setRawCategories(mapped);
          setActiveCategories(mapped);
        } else {
          setRawCategories([]);
          setActiveCategories([]);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setRawCategories([]);
        setActiveCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Effect to translate categories when language changes
  useEffect(() => {
    const translateCategories = async () => {
      if (rawCategories.length === 0) return;

      try {
        const names = rawCategories.map(c => c.originalName);
        const translatedNames = await translateBatch(names);

        const translatedCats = rawCategories.map((c, i) => ({
          ...c,
          name: translatedNames[i] || c.originalName
        }));
        setActiveCategories(translatedCats);
      } catch (error) {
        console.error("Error translating categories:", error);
      }
    };
    translateCategories();
  }, [rawCategories, translateBatch]);
  const { getTranslatedText } = usePageTranslation([
    "Current Location",
    "Enter location manually",
    "Loading...",
    "Sell Scrap",
    "Book a Pickup",
    "How it works",
    "Learn more",
    "Get started",
    "Sell Your Scrap",
    "We'll Pick It Up",
    "Real-time market prices. Verified scrappers. Cash on pickup.",
    "Learn how to get the best value for your scrap materials.",
    "Request Pickup Now",
    "Tap to set location",
    "Getting your location...",
    "Type to search location...",
    "Home Services",
    "Waste Collection",
    "Professional deep cleaning service including floor scrubbing, cobweb removal, and bathroom cleaning.",
    "Fixed Price: ₹1200",
    "Verified Pros",
    "New",
    "Scrap Categories",
    "See all",
    "Plastic",
    "Paper",
    "Glass",
    "Metal",
    "Electronics",
    "Textile",
    "Free Pickup",
    "No pickup charges. We reach your doorstep without any extra cost.",
    "Best Rates",
    "Highest market rates with real-time pricing so every deal stays fair.",
    "Verified & Safe",
    "KYC-verified partners with reliable pickups for a worry-free experience.",
    "Premium",
    "Experience a spotless home with our professional deep cleaning. Verified experts & eco-friendly products.",
    "Verified",
    "Iron",
    "Steel",
    "Copper",
    "Brass",
    "Aluminium",
    "Cardboard",
    "Books",
    "Newspaper",
    "Old Books",
    "Cartons",
    "E-Waste",
    "Batteries",
    "Cables",
    "Book Now",
    "Scrap Iron",
    "Raddi",
    "Furniture",
    "Vehicle Scrap",
    "Home Appliance"
  ]);

  useEffect(() => {
    const translateBanners = async () => {
      const translated = await Promise.all(
        originalBanners.map((banner) =>
          translateObject(banner, ["title", "description"])
        )
      );
      setBanners(translated);
    };
    translateBanners();
  }, [originalBanners, translateObject]);
  const getLiveLocation = () => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      setShowSuggestions(false);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });

          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            if (data && data.display_name) {
              // Extract a shorter address
              const address =
                data.display_name.split(",").slice(0, 3).join(", ") ||
                data.display_name;
              setLocationAddress(address);
              setSearchQuery(address);
            } else {
              const coords = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
              setLocationAddress(coords);
              setSearchQuery(coords);
            }
          } catch (error) {
            console.error("Error reverse geocoding:", error);
            const coords = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setLocationAddress(coords);
            setSearchQuery(coords);
          }
          setIsLoadingLocation(false);
          setIsEditingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationAddress("Location not available");
          setIsLoadingLocation(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
      setIsLoadingLocation(false);
    }
  };

  // Fetch location suggestions
  const fetchLocationSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&addressdetails=1&countrycodes=in`
      );
      const data = await response.json();
      if (data && Array.isArray(data)) {
        setLocationSuggestions(data);
        setShowSuggestions(true);
      } else {
        setLocationSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Debounced search for suggestions
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (isEditingLocation && searchQuery) {
      debounceTimerRef.current = setTimeout(() => {
        fetchLocationSuggestions(searchQuery);
      }, 300);
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, isEditingLocation]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Detect if running in webview
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isWebViewDetected =
      /wv/i.test(userAgent) || // Android WebView
      /WebView/i.test(userAgent) || // iOS WebView
      window.ReactNativeWebView !== undefined; // React Native WebView

    setIsWebView(isWebViewDetected);
  }, []);

  // Auto-rotate banners
  useEffect(() => {
    bannerIntervalRef.current = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % 3);
    }, 4000); // Change banner every 4 seconds

    return () => {
      if (bannerIntervalRef.current) {
        clearInterval(bannerIntervalRef.current);
      }
    };
  }, []);

  const handleLocationClick = () => {
    setIsEditingLocation(true);
    setSearchQuery(locationAddress);
    setTimeout(() => {
      locationInputRef.current?.focus();
    }, 100);
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setLocationAddress(value);
  };

  const handleLocationBlur = () => {
    // Delay to allow suggestion click
    setTimeout(() => {
      if (locationAddress.trim()) {
        setIsEditingLocation(false);
        setShowSuggestions(false);
      }
    }, 200);
  };

  const handleLocationKeyPress = (e) => {
    if (e.key === "Enter") {
      if (locationSuggestions.length > 0) {
        handleSelectSuggestion(locationSuggestions[0]);
      } else {
        setIsEditingLocation(false);
        setShowSuggestions(false);
        locationInputRef.current?.blur();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setIsEditingLocation(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    const address =
      suggestion.display_name.split(",").slice(0, 3).join(", ") ||
      suggestion.display_name;
    setLocationAddress(address);
    setSearchQuery(address);
    setUserLocation({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    });
    setShowSuggestions(false);
    setIsEditingLocation(false);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        <div
          ref={heroRef}
          className="min-h-screen relative z-0 pb-20 md:pb-0 overflow-x-hidden md:-mt-[1px]"
          style={{ background: "linear-gradient(to bottom, #7dd3fc, #e0f2fe)" }}>

          {/* Header */}
          <Header />

          {/* Location Bar */}
          <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto mb-4 md:mb-6">
            <motion.div
              initial={{ y: 5 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative">
              <div
                className={`flex items-center rounded-2xl px-5 py-4 md:py-5 border-2 transition-all shadow-lg hover:shadow-xl ${isEditingLocation ? "" : "cursor-pointer"}`}
                style={{
                  backgroundColor: "#ffffff",
                  borderColor: isEditingLocation ? "#0ea5e9" : "#e0f2fe",
                }}
                onClick={
                  !isEditingLocation ? handleLocationClick : undefined
                }>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mr-3 flex-shrink-0"
                  style={{ color: "#38bdf8" }}>
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                    fill="currentColor"
                  />
                </svg>
                <div className="flex-1 relative min-w-0">
                  {isLoadingLocation ? (
                    <div
                      className="flex items-center gap-2 text-sm md:text-base"
                      style={{ color: "#a0aec0" }}>
                      <span className="animate-pulse">
                        {getTranslatedText("Getting your location...")}
                      </span>
                    </div>
                  ) : (
                    <>
                      {isEditingLocation ? (
                        <input
                          ref={locationInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={handleLocationChange}
                          onBlur={handleLocationBlur}
                          onKeyDown={handleLocationKeyPress}
                          className="flex-1 bg-transparent border-none outline-none text-sm md:text-base w-full"
                          style={{ color: "#2d3748" }}
                          placeholder={getTranslatedText(
                            "Type to search location..."
                          )}
                          autoComplete="off"
                        />
                      ) : (
                        <div
                          className="text-sm md:text-base truncate"
                          style={{ color: "#2d3748" }}>
                          {locationAddress ||
                            getTranslatedText("Tap to set location")}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {!isLoadingLocation && (
                  <>
                    {isEditingLocation ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          getLiveLocation();
                        }}
                        className="ml-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg flex-shrink-0"
                        style={{
                          backgroundColor: "#0ea5e9",
                          color: "#ffffff",
                        }}
                        title="Get current location">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none">
                          <path
                            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                            fill="currentColor"
                          />
                        </svg>
                        <span className="hidden sm:inline">Live</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          getLiveLocation();
                        }}
                        className="ml-2 p-1.5 rounded-lg transition-all flex-shrink-0"
                        style={{
                          backgroundColor: "transparent",
                          color: "#38bdf8",
                        }}
                        title="Get current location">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none">
                          <path
                            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                            fill="currentColor"
                          />
                        </svg>
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Location Suggestions Dropdown */}
              {showSuggestions && locationSuggestions.length > 0 && (
                <motion.div
                  ref={suggestionsRef}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border z-50 max-h-64 overflow-y-auto"
                  style={{ borderColor: "#e5ddd4" }}>
                  {locationSuggestions.map((suggestion, index) => {
                    const address =
                      suggestion.display_name
                        .split(",")
                        .slice(0, 3)
                        .join(", ") || suggestion.display_name;
                    return (
                      <motion.div
                        key={suggestion.place_id || index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-b-0"
                        style={{ borderColor: "#e5ddd4" }}>
                        <div className="flex items-start gap-3">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="mt-0.5 flex-shrink-0"
                            style={{ color: "#38bdf8" }}>
                            <path
                              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                              fill="currentColor"
                            />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: "#2d3748" }}>
                              {address}
                            </p>
                            {suggestion.address && (
                              <p
                                className="text-xs mt-0.5 truncate"
                                style={{ color: "#718096" }}>
                                {suggestion.address.city ||
                                  suggestion.address.town ||
                                  suggestion.address.village ||
                                  ""}
                                {suggestion.address.state
                                  ? `, ${suggestion.address.state}`
                                  : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Main Hero Content */}
          <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Value Proposition Section - Hidden on mobile, shown on desktop */}
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-3 md:mt-6 lg:mt-12 xl:mt-16 hidden md:block">
              <div className="flex flex-row items-center md:items-start gap-3 md:gap-6 lg:gap-8">
                {/* Left Side - Text Only */}
                <div className="flex-1 text-left">
                  <p
                    className="text-base md:text-lg lg:text-xl xl:text-2xl mb-4 md:mb-6 lg:mb-8 max-w-2xl"
                    style={{ color: "#4a5568" }}>
                    {getTranslatedText(
                      "Real-time market prices. Verified scrappers. Cash on pickup."
                    )}
                    <br />
                    <span
                      className="text-sm md:text-base lg:text-lg mt-2 block"
                      style={{ color: "#718096" }}>
                      {getTranslatedText(
                        "Learn how to get the best value for your scrap materials."
                      )}
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Banner Section - "Turn Your Trash into Cash!" */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-4 md:mt-8 mb-6 md:mb-8">
              <div
                className="rounded-3xl p-5 md:p-6 relative overflow-hidden"
                style={{
                  background: "linear-gradient(to right, #3b82f6 0%, #7dd3fc 60%, #bae6fd 100%)",
                  boxShadow: "0 8px 24px rgba(59, 130, 246, 0.4), 0 4px 12px rgba(125, 211, 252, 0.3)"
                }}>
                {/* Enhanced Geometric Pattern Background - More Prominent */}
                <div className="absolute inset-0">
                  {/* Large circles - highly visible with darker opacity */}
                  <div className="absolute top-0 left-0 w-48 h-48 bg-white opacity-40 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute bottom-0 right-0 w-56 h-56 bg-white opacity-40 rounded-full translate-x-1/3 translate-y-1/3"></div>
                  <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-white opacity-35 rounded-full"></div>
                  <div className="absolute bottom-1/3 left-1/3 w-36 h-36 bg-white opacity-35 rounded-full"></div>

                  {/* Recycling symbols pattern - much darker and prominent */}
                  <div className="absolute top-1/4 left-1/4 text-white text-7xl opacity-60 font-bold">♻</div>
                  <div className="absolute bottom-1/4 right-1/3 text-white text-6xl opacity-60 font-bold">♻</div>
                  <div className="absolute top-1/2 left-1/2 text-white text-5xl opacity-50 font-bold">♻</div>

                  {/* Geometric shapes - highly prominent */}
                  <div className="absolute top-1/3 right-1/2 w-32 h-32 bg-white opacity-50 rotate-45"></div>
                  <div className="absolute bottom-1/2 left-1/4 w-28 h-28 bg-white opacity-45 rotate-12"></div>
                </div>

                <div className="relative z-10">
                  {/* Banner Text */}
                  <div className="mb-4 text-center md:text-left">
                    <h2
                      className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 flex items-center justify-center md:justify-start gap-2"
                      style={{
                        color: "#1e3a8a",
                        textShadow: "1px 1px 2px rgba(255, 255, 255, 0.5)"
                      }}>
                      Turn Your Trash into Cash!
                    </h2>
                    <p
                      className="text-sm md:text-base lg:text-lg"
                      style={{
                        color: "#1e40af",
                        textShadow: "1px 1px 2px rgba(255, 255, 255, 0.3)"
                      }}>
                      Get the best rates for your scrap at your doorstep
                    </p>
                  </div>

                  {/* Request Pickup Button - Inside Banner, Centered */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => navigate("/user/add-scrap/category")}
                      className="relative inline-flex items-center justify-center text-white font-bold py-2.5 px-6 md:py-3 md:px-10 rounded-full text-sm md:text-base shadow-2xl transform hover:-translate-y-1 hover:shadow-3xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-white/30"
                      style={{
                        backgroundColor: "#000000",
                      }}>
                      {getTranslatedText("Request Pickup Now")}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Scrap Categories */}
          <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
            <motion.div
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-2 md:mt-4 mb-4 md:mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3
                  className="text-lg md:text-xl font-bold"
                  style={{ color: "#2d3748" }}>
                  {getTranslatedText("Scrap Categories")}
                </h3>
                <button
                  onClick={() => navigate("/user/categories")}
                  className="text-xs md:text-sm font-semibold hover:opacity-80 transition-opacity"
                  style={{ color: "#2d3748" }}>
                  {getTranslatedText("See all")}
                </button>
              </div>
              {/* Horizontal Scrolling Container */}
              <div className="relative -mx-4 md:mx-0">
                <div
                  className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-3 px-4 md:px-0"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    WebkitOverflowScrolling: "touch",
                  }}>
                  {activeCategories.map((category, index) => (
                    <div
                      key={category.name}
                      className="cursor-pointer flex flex-col items-center flex-shrink-0 w-[30%] md:w-32"
                      onClick={() =>
                        navigate("/user/add-scrap/category", {
                          state: { preSelectedCategory: category.originalName },
                        })
                      }>
                      {/* Circular Image Container */}
                      <div
                        className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 mb-2 bg-white"
                        style={{ border: "2px solid #e0f2fe" }}>
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      {/* Category Name Below Circle */}
                      <p
                        className="text-xs md:text-sm font-bold text-center"
                        style={{ color: "#1e293b" }}>
                        {category.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Live Price Ticker */}
          <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto mb-8">
            <PriceTicker />
          </div>

          {/* Promotional Banner Carousel (New Section) */}
          <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto mb-8">
            <div className="relative">
              <BannerSlider audience="user" />
            </div>
          </div>

          {/* Customer Solutions */}


          {/* Trust Signals */}
          <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
            <TrustSignals />
          </div>

          {/* Why Junkar Section */}
          <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mt-6 md:mt-8 mb-6 md:mb-8">
              <h3
                className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center"
                style={{ color: "#1e293b" }}>
                Why Junkar?
              </h3>
              <div className="flex flex-col gap-3 md:grid md:grid-cols-3 md:gap-4">
                {[
                  {
                    icon: (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5">
                        <polyline points="22 2 11 13 6 8"></polyline>
                      </svg>
                    ),
                    title: "Free Pickup",
                    desc: "No pickup charges. We reach your doorstep without any extra cost.",
                  },
                  {
                    icon: (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                    ),
                    title: "Best Rates",
                    desc: "Highest market rates with real-time pricing so every deal stays fair.",
                  },
                  {
                    icon: (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                    ),
                    title: "Verified & Safe",
                    desc: "KYC-verified partners with reliable pickups for a worry-free experience.",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="w-full">
                    <div
                      className="rounded-xl md:rounded-2xl p-4 md:p-5 h-full transition-all duration-300 border hover:shadow-md"
                      style={{
                        backgroundColor: "#f0f9ff",
                        borderColor: "#e0f2fe",
                        boxShadow: "0 2px 8px rgba(14, 165, 233, 0.06)",
                      }}>
                      <div className="flex items-start gap-3">
                        <div
                          className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: "#f0f9ff",
                            color: "#0ea5e9",
                          }}>
                          {item.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4
                            className="font-bold text-base md:text-lg mb-1"
                            style={{ color: "#1e293b" }}>
                            {getTranslatedText(item.title)}
                          </h4>
                          <p
                            className="text-xs md:text-sm leading-relaxed"
                            style={{ color: "#64748b" }}>
                            {getTranslatedText(item.desc)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Social Proof - Testimonials */}
          <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
            <Testimonials />
          </div>

          {/* OTP Modal */}
          {showOTPModal && (
            <OTPModal onClose={() => setShowOTPModal(false)} />
          )}
        </div>

      </AnimatePresence>

      {/* Bottom Navigation (Mobile Only - Fixed to Viewport) - Always visible */}
      {/* Bottom Navigation (Mobile Only - Fixed to Viewport) */}
      <div className="fixed md:hidden bottom-0 left-0 right-0 z-[9999]">
        {/* Background Container - Black */}
        <div className="absolute inset-0 bg-black border-t border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"></div>

        <div className="relative flex justify-between items-end pb-2 pt-2 px-4">
          {/* Home Tab */}
          <div
            className="flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform duration-200 py-2"
            onClick={() => navigate('/user')}
          >
            <div className="p-1.5 rounded-xl transition-colors duration-300 bg-gray-800 text-sky-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <span className="text-[10px] font-semibold tracking-wide text-sky-300">Home</span>
          </div>

          {/* Price Tab */}
          <div
            className="flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform duration-200 py-2"
            onClick={() => navigate('/user/prices')}
          >
            <div className="p-1.5 rounded-xl text-gray-400 hover:text-sky-300 transition-colors duration-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
            </div>
            <span className="text-[10px] font-semibold tracking-wide text-gray-400">Price</span>
          </div>

          {/* Center Action Button (Floating) - SELL */}
          <div className="flex-1 flex flex-col items-center justify-end relative z-10 -top-5 group"
            onClick={() => navigate('/user/add-scrap/category')}>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/30 transform group-active:scale-95 transition-all duration-300 border-4 border-black">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white transform group-hover:rotate-180 transition-transform duration-500">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-sky-300 mt-1 tracking-wide">Sell</span>
          </div>

          {/* Refer Tab */}
          <div
            className="flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform duration-200 py-2"
            onClick={() => navigate('/user/refer-earn')}
          >
            <div className="p-1.5 rounded-xl text-gray-400 hover:text-sky-300 transition-colors duration-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22 4 12"></polyline>
                <rect x="2" y="7" width="20" height="5"></rect>
                <line x1="12" y1="22" x2="12" y2="7"></line>
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
              </svg>
            </div>
            <span className="text-[10px] font-semibold tracking-wide text-gray-400">Refer</span>
          </div>

          {/* Profile Tab */}
          <div
            className="flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform duration-200 py-2"
            onClick={() => navigate('/user/my-profile')}
          >
            <div className="p-1.5 rounded-xl text-gray-400 hover:text-sky-300 transition-colors duration-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <span className="text-[10px] font-semibold tracking-wide text-gray-400">Profile</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Hero;

