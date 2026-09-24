import { motion } from "framer-motion";
import { usePageTranslation } from "../../../hooks/usePageTranslation";

const TrustSignals = () => {
  const signals = [
    {
      text: "KYC Verified Scrappers",
      icon: (
        <svg
          className="w-full h-full"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2">
          <path
            d="M9 12l2 2 4-4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
          <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" />
          <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3" />
          <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3" />
        </svg>
      ),
    },
    {
      text: "Secure Payments",
      icon: (
        <svg
          className="w-full h-full"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
    {
      text: "4.8 Avg Rating",
      icon: (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
    },
    {
      text: "24/7 Support",
      icon: (
        <svg
          className="w-full h-full"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
  ];

  const { getTranslatedText } = usePageTranslation(signals.map((s) => s.text));

  return (
    <div className="mb-6 md:mb-8">
      <div className="grid grid-cols-2 gap-2.5 md:gap-3 max-w-3xl mx-auto">
        {signals.map((signal, index) => (
          <div
            key={index}
            className="flex items-center gap-2.5 px-3.5 py-2.5 md:px-4 md:py-3 rounded-xl transition-all duration-300 hover:shadow-md"
            style={{
              backgroundColor: "#f0f9ff",
              border: "1.5px solid #e0f2fe",
              boxShadow: "0 2px 8px rgba(14, 165, 233, 0.06)",
            }}>
            <div
              className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-lg flex-shrink-0"
              style={{
                backgroundColor: "#f0f9ff",
                color: "#0ea5e9",
              }}>
              <div className="w-4.5 h-4.5 md:w-5 md:h-5">
                {signal.icon}
              </div>
            </div>

            <span
              className="text-xs md:text-sm font-bold truncate"
              style={{ color: "#1e293b" }}>
              {getTranslatedText(signal.text)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrustSignals;

