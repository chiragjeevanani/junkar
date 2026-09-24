import { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import { usePageTranslation } from "../../../hooks/usePageTranslation";
import { publicAPI } from "../../shared/utils/api";

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([
    {
      name: "R.K.",
      rating: 5,
      text: "Great service! Got best price for my scrap metal.",
    },
    {
      name: "S.P.",
      rating: 5,
      text: "Quick pickup and fair pricing. Highly recommended!",
    },
    {
      name: "A.M.",
      rating: 5,
      text: "Easy to use app and verified collectors.",
    },
    {
      name: "P.S.",
      rating: 5,
      text: "Best platform for selling scrap. Very satisfied!",
    },
    {
      name: "M.K.",
      rating: 5,
      text: "Fast and reliable service. Will use again!",
    },
  ]);

  useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      try {
        const response = await publicAPI.getHomepageReviews();
        if (isMounted && response.success && response.data && response.data.length > 0) {
          setTestimonials(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch homepage reviews", error);
      }
    };
    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, []);

  const staticTexts = [
    "What Our Users Say",
    ...testimonials.map((t) => t.text),
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  return (
    <div className="mb-6 md:mb-8">
      <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-5 text-center" style={{ color: "#1e293b" }}>
        {getTranslatedText("What Our Users Say")}
      </h3>

      {/* Horizontal Scrolling Container */}
      <div className="relative mb-5 -mx-4 md:mx-0">
        <div
          className="flex gap-2.5 md:gap-3 overflow-x-auto scrollbar-hide pb-2 px-4 md:px-0"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}>
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-[45%] sm:w-60 md:w-64">
              {/* Compact Card */}
              <div
                className="rounded-xl p-3 md:p-3.5 border hover:shadow-md transition-all duration-300"
                style={{
                  backgroundColor: "#f0f9ff",
                  borderColor: "#e0f2fe",
                  boxShadow: "0 2px 8px rgba(14, 165, 233, 0.06)",
                }}>
                {/* Name */}
                <p
                  className="font-bold mb-1 text-xs md:text-sm"
                  style={{ color: "#1e293b" }}>
                  {testimonial.name}
                </p>

                {/* Star Rating */}
                <div className="flex gap-0.5 mb-1.5">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg
                      key={i}
                      width="11"
                      height="11"
                      className="md:w-3 md:h-3"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      style={{ color: "#fbbf24" }}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>

                {/* Testimonial Text */}
                <p
                  className="text-[10px] md:text-xs leading-snug line-clamp-2"
                  style={{ color: "#64748b" }}>
                  "{getTranslatedText(testimonial.text)}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Testimonials;

