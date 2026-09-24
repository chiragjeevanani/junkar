import { useEffect, useState } from "react";
import { publicAPI } from "../../shared/utils/api";
import { usePageTranslation } from "../../../hooks/usePageTranslation";
import { useDynamicTranslation } from "../../../hooks/useDynamicTranslation";
const PriceTicker = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getTranslatedText } = usePageTranslation([
    "Price",
    "Source: Admin price feed",
    "No prices found",
    "Failed to fetch live prices, using default:",
  ]);
  const { translate } = useDynamicTranslation();

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await publicAPI.getPrices();
        if (response.success && response.data?.prices) {
          const materials = response.data.prices.filter(p => p.isActive !== false && (!p.type || p.type === 'material'));
          
          const updated = (await Promise.all(
            materials.map(async (item) => ({
              id: item._id,
              type: await translate(item.category),
              originalType: item.category,
              price: item.pricePerKg || 0,
              minPrice: item.minPrice,
              maxPrice: item.maxPrice,
              unit: item.unit || 'kg',
              isNegotiable: item.isNegotiable || false,
              change: null
            }))
          ));
          setPrices(updated);
        } else {
          setPrices([]);
        }
      } catch (error) {
        console.error("Failed to fetch live prices:", error);
        setPrices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, [translate]);

  if (loading || prices.length === 0) return null;

  return (
    <div className="mb-6 md:mb-8">
      {/* Header with gradient background */}
      <div className="flex items-center justify-between mb-5 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-sky-400 to-blue-500"></div>
          <h3
            className="text-xl md:text-2xl font-bold"
            style={{ color: "#0f172a" }}>
            {getTranslatedText("Price")}
          </h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
          style={{
            backgroundColor: "#ffffff",
            borderColor: "#e0f2fe",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span
            className="text-xs font-medium"
            style={{ color: "#64748b" }}>
            Live Rates
          </span>
        </div>
      </div>

      {/* Horizontal Scrolling Price Cards */}
      <div className="relative -mx-4 md:mx-0">
        <div
          className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-3 px-4 md:px-0"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}>
          {prices.map((item, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-[30%] md:w-48 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow duration-300"
              style={{ backgroundColor: "#f0f9ff" }}>
              {/* Category Name */}
              <p
                className="text-sm md:text-base mb-2 font-semibold"
                style={{ color: "#94a3b8" }}>
                {item.type}
              </p>

              {/* Price */}
              <p
                className="text-sm md:text-base font-bold"
                style={{ color: "#1e293b" }}>
                {item.isNegotiable ? (
                  <div className="flex flex-col items-start gap-1">
                    {item.unit && (item.unit.toLowerCase().includes('pic') || item.unit.toLowerCase().includes('pc')) && (
                      <span className="text-[10px] md:text-xs font-bold text-slate-700">
                         {item.minPrice && item.maxPrice 
                           ? `₹${item.minPrice}-${item.maxPrice}/${item.unit}` 
                           : `₹${item.price.toFixed(0)}/${item.unit}`}
                      </span>
                    )}
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#fef3c7] text-[#92400e] border border-amber-200 w-fit">
                      <span className="text-amber-500 text-[10px]">💛</span> {getTranslatedText('Negotiable')}
                    </div>
                  </div>
                ) : (
                  item.minPrice && item.maxPrice
                    ? `₹${item.minPrice}-${item.maxPrice}/${item.unit}`
                    : `₹${item.price.toFixed(0)}/${item.unit}`
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PriceTicker;

