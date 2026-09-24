import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import { useState, useEffect } from "react";
import { publicAPI } from "../../shared/utils/api";
import {
    getEffectivePriceFeed,
    PRICE_TYPES,
} from "../../shared/utils/priceFeedUtils";
import { usePageTranslation } from "../../../hooks/usePageTranslation";
import { useDynamicTranslation } from "../../../hooks/useDynamicTranslation";
import plasticImage from "../assets/plastic.jpg";
import metalImage from "../assets/metal2.jpg";
import copperImage from "../assets/metal.jpg";
import aluminiumImage from "../assets/Aluminium.jpg";
import scrapImage2 from "../assets/scrab.png";
import electronicImage from "../assets/electronicbg.png";
import UserBottomNav from "./UserBottomNav";

const PriceListPage = () => {
    const navigate = useNavigate();
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const staticTexts = [
        "Scrap Prices",
        "Current market rates for scrap materials",
        "Search",
        "Go back",
        "Category",
        "Price",
        "Unit",
        "No prices found",
        "Try a different search term",
        "Loading...",
        "Per"
    ];

    const { getTranslatedText } = usePageTranslation(staticTexts);
    // We can use dynamic translation for category names if needed, 
    // but usually they come from backend possibly already localized or we translate them on the fly.
    const { translateBatch } = useDynamicTranslation();

    // Helper to get image
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
            lowerName.includes("cardboard")
        )
            return scrapImage2;
        if (
            lowerName.includes("electron") ||
            lowerName.includes("device") ||
            lowerName.includes("computer") ||
            lowerName.includes("phone")
        )
            return electronicImage;
        return scrapImage2;
    };

    useEffect(() => {
        const fetchPrices = async () => {
            setLoading(true);
            try {
                const response = await publicAPI.getPrices();
                if (
                    response.success &&
                    response.data?.prices
                ) {
                    const allItems = response.data.prices;
                    // Filter active Materials only
                    const materials = allItems.filter(
                        (p) => (!p.type || p.type === PRICE_TYPES.MATERIAL) && p.isActive !== false
                    );

                    const mappedPrices = materials.map((price) => ({
                        id: price._id || price.id,
                        name: price.category,
                        price: price.pricePerKg || price.price || 0,
                        minPrice: price.minPrice,
                        maxPrice: price.maxPrice,
                        unit: price.unit || 'kg',
                        isNegotiable: price.isNegotiable || false,
                        image: price.image || getCategoryImage(price.category),
                    }));
                    setPrices(mappedPrices);
                } else {
                    setPrices([]);
                }
            } catch (error) {
                console.error("Failed to fetch prices:", error);
                setPrices([]);
            } finally {
                setLoading(false);
            }
        };
        fetchPrices();
    }, []);

    const filteredPrices = prices.filter(p =>
        p.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );

    return (
        <div
            className="min-h-screen w-full relative z-0 pb-20 md:pb-0 overflow-x-hidden"
            style={{ background: "linear-gradient(to bottom, #7dd3fc, #e0f2fe)" }}>
            {/* Compact Sticky Header */}
            <div
                className="sticky top-0 z-40 px-4 md:px-6 py-3 md:py-4 backdrop-blur-sm"
                style={{ backgroundColor: "rgba(125, 211, 252, 0.95)" }}>
                <div className="max-w-7xl mx-auto mb-3">
                    <h1
                        className="text-lg md:text-xl font-bold mb-1"
                        style={{ color: "#ffffff" }}>
                        {getTranslatedText("Scrap Prices")}
                    </h1>
                    <p
                        className="text-xs md:text-sm"
                        style={{ color: "#f0f9ff" }}>
                        {getTranslatedText("Current market rates for scrap materials")}
                    </p>
                </div>

                {/* Compact Search Bar */}
                <div className="max-w-7xl mx-auto relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                        type="text"
                        placeholder={getTranslatedText("Search") + "..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border-none shadow-sm focus:ring-2 focus:ring-sky-400 outline-none text-sm"
                        style={{ backgroundColor: "white" }}
                    />
                </div>
            </div>

            {/* Optimized Price List */}
            <div className="px-4 md:px-6 max-w-7xl mx-auto pb-6">
                {loading ? (
                    <div className="text-center py-8 text-slate-600 font-medium text-sm">{getTranslatedText("Loading...")}</div>
                ) : filteredPrices.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2.5">
                        {filteredPrices.map((item, index) => (
                            <div
                                key={item.id || index}
                                className="bg-white rounded-lg p-2.5 shadow-md hover:shadow-lg flex items-center gap-2.5 border border-slate-200 transition-all duration-200"
                            >
                                <div
                                    className="w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-sky-50 to-blue-50 flex-shrink-0 border border-sky-100"
                                >
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3
                                        className="font-bold text-sm mb-0.5 truncate"
                                        style={{ color: "#1e293b" }}
                                    >
                                        {getTranslatedText(item.name)}
                                    </h3>
                                    <p className="text-xs text-slate-500">{getTranslatedText("Per")} {getTranslatedText(item.unit)}</p>
                                </div>

                                <div className="text-right bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200 flex flex-col items-end justify-center min-h-[44px]">
                                    {((item.minPrice && item.maxPrice) || item.price > 0) && (
                                        <p className="text-sm font-bold" style={{ color: "#000000" }}>
                                            {item.minPrice && item.maxPrice
                                                ? `₹${item.minPrice} - ₹${item.maxPrice}`
                                                : `₹${item.price}`}
                                        </p>
                                    )}
                                    {item.isNegotiable && (
                                        <span className="flex items-center mt-0.5 gap-1 font-bold text-[10px] bg-[#fef3c7] text-[#92400e] px-1.5 py-0.5 rounded border border-amber-200 shadow-sm leading-none">
                                            <span className="text-amber-500">💛</span> {getTranslatedText('Negotiable')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-base font-bold text-slate-700">{getTranslatedText("No prices found")}</p>
                        <p className="text-xs text-slate-500 mt-1">{getTranslatedText("Try a different search term")}</p>
                    </div>
                )}
            </div>
            <UserBottomNav />
        </div>
    );
};

export default PriceListPage;

