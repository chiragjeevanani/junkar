import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "../../shared/context/AuthContext";
import {
  getOrGenerateReferralCode,
  getUserReferralStats,
  getReferralSettings,
  updateReferralSettings,
  getUserTier,
  updateTierConfig,
  processMonthlyTierBonus,
} from "../../shared/utils/referralUtils";
import { publicAPI } from "../../shared/utils/api";
import QRCodeGenerator from "../../shared/components/QRCodeGenerator";
import { usePageTranslation } from "../../../hooks/usePageTranslation";
import { useDynamicTranslation } from "../../../hooks/useDynamicTranslation";
import {
  FaGift,
  FaCopy,
  FaShareAlt,
  FaWhatsapp,
  FaEnvelope,
  FaQrcode,
  FaUsers,
  FaRupeeSign,
  FaCheckCircle,
  FaClock,
  FaTrophy,
  FaFacebook,
  FaTwitter,
  FaInstagram,
} from "react-icons/fa";

const ReferAndEarn = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState("");
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalEarnings: 0,
    referrals: [],
  });
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [tierInfo, setTierInfo] = useState(null);

  const staticTexts = [
    "Refer & Earn",
    "Invite friends and earn rewards",
    "Your Referral Code",
    "Referral Code",
    "Copied!",
    "Copy",
    "Share Link",
    "Hide",
    "Show",
    "QR Code",
    "WhatsApp",
    "SMS",
    "Email",
    "Facebook",
    "Twitter",
    "Instagram",
    "Message copied! Paste it in your Instagram story or post.",
    "Monthly Tier Bonus",
    "Claim Bonus",
    "Unable to process monthly bonus",
    "Total Referrals",
    "Total Earnings",
    "How It Works",
    "Share Your Code",
    "Share your referral code or link with friends",
    "They Sign Up",
    "Your friend signs up using your code",
    "You Both Earn",
    "Your Referrals",
    "more referrals to reach {tier}",
    "You get ₹{amount} and they get ₹{bonus} welcome bonus",
    "Active",
    "Pending",
    "Referred User"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const { translateText: translateDynamic } = useDynamicTranslation();

  useEffect(() => {
    const fetchConfigAndStats = async () => {
      try {
        // Fetch real-time config from backend
        const configResp = await publicAPI.getReferralConfig();
        if (configResp.success && configResp.data) {
          const { tiers, settings } = configResp.data;
          // Dynamically update local storage for utilities to use
          if (tiers) updateTierConfig(tiers);
          if (settings) updateReferralSettings(settings);
        }
      } catch (err) {
        console.error('Failed to sync referral config:', err);
      }

      if (user) {
        const code = getOrGenerateReferralCode(user.phone || user.id, "user");
        setReferralCode(code);
        setShareLink(`${window.location.origin}?ref=${code}`);

        const referralStats = getUserReferralStats(user.phone || user.id, "user");
        setStats(referralStats);

        const tier = getUserTier(user.phone || user.id, "user");
        setTierInfo(tier);
      }
    };

    fetchConfigAndStats();
  }, [user]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (method) => {
    const message = `Join ScrapConnect and get ₹100 welcome bonus! Use my referral code: ${referralCode}\n${shareLink}`;

    switch (method) {
      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(message)}`,
          "_blank"
        );
        break;
      case "sms":
        window.open(`sms:?body=${encodeURIComponent(message)}`, "_blank");
        break;
      case "email":
        window.open(
          `mailto:?subject=Join ScrapConnect&body=${encodeURIComponent(
            message
          )}`,
          "_blank"
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            shareLink
          )}`,
          "_blank"
        );
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            message
          )}&url=${encodeURIComponent(shareLink)}`,
          "_blank"
        );
        break;
      case "instagram":
        // Instagram doesn't support direct sharing, show message
        navigator.clipboard.writeText(
          `${message}\n\nCopy this message and share on Instagram!`
        );
        alert(
          getTranslatedText(
            "Message copied! Paste it in your Instagram story or post."
          )
        );
        break;
      default:
        break;
    }
  };

  const settings = getReferralSettings();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="rounded-2xl shadow-xl p-4 backdrop-blur-sm border-2 border-emerald-100"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.98)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: "rgba(100, 148, 110, 0.15)" }}>
            <FaGift className="text-2xl" style={{ color: "#38bdf8" }} />
          </div>
          <div className="flex-1 min-w-0">
            <h1
              className="text-xl md:text-2xl font-bold leading-tight"
              style={{ color: "#1e293b" }}>
              {getTranslatedText("Refer & Earn")}
            </h1>
            <p className="text-xs md:text-sm font-medium leading-tight mt-0.5" style={{ color: "#64748b" }}>
              {getTranslatedText("Invite friends and earn rewards")}
            </p>
          </div>
          {tierInfo && (
            <div
              className="px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md flex-shrink-0"
              style={{
                backgroundColor: `${tierInfo.color}20`,
                border: `2px solid ${tierInfo.color}`,
              }}>
              <FaTrophy className="text-sm" style={{ color: tierInfo.color }} />
              <span
                className="font-bold text-xs"
                style={{ color: tierInfo.color }}>
                {tierInfo.name}
              </span>
            </div>
          )}
        </div>

        {/* Tier Progress */}
        {tierInfo && tierInfo.nextTier && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium" style={{ color: "#64748b" }}>
                {getTranslatedText("more referrals to reach {tier}", {
                  tier: tierInfo.nextTier.name
                })}
              </span>
              <span className="font-bold" style={{ color: "#1e293b" }}>
                {tierInfo.totalReferrals}/{tierInfo.nextTier.minReferrals}
              </span>
            </div>
            <div
              className="h-2 rounded-full shadow-inner"
              style={{ backgroundColor: "rgba(100, 148, 110, 0.15)" }}>
              <div
                className="h-full rounded-full shadow-md transition-all duration-300"
                style={{
                  backgroundColor: tierInfo.color,
                  width: `${(tierInfo.totalReferrals / tierInfo.nextTier.minReferrals) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Referral Code Card */}
      <div
        className="rounded-2xl shadow-xl p-4 backdrop-blur-sm border-2 border-emerald-100 transition-shadow hover:shadow-2xl"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.98)" }}>
        <h2
          className="text-base md:text-lg font-bold mb-3"
          style={{ color: "#1e293b" }}>
          {getTranslatedText("Your Referral Code")}
        </h2>

        {/* Code Display */}
        <div className="mb-3">
          <div
            className="flex items-center justify-between p-3 rounded-xl border-3 shadow-lg"
            style={{
              backgroundColor: "rgba(100, 148, 110, 0.08)",
              borderColor: "#38bdf8",
              borderWidth: "3px"
            }}>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold leading-tight" style={{ color: "#64748b" }}>
                {getTranslatedText("Referral Code")}
              </p>
              <p
                className="text-xl md:text-2xl font-bold tracking-wider leading-tight mt-0.5"
                style={{ color: "#38bdf8" }}>
                {referralCode}
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-shadow hover:shadow-lg flex-shrink-0"
              style={{ backgroundColor: "#38bdf8", color: "#ffffff" }}>
              {copied ? (
                <>
                  <FaCheckCircle />
                  {getTranslatedText("Copied!")}
                </>
              ) : (
                <>
                  <FaCopy />
                  {getTranslatedText("Copy")}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Share Link */}
        <div className="mb-3">
          <label
            className="block text-sm font-bold mb-1.5"
            style={{ color: "#1e293b" }}>
            {getTranslatedText("Share Link")}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareLink}
              readOnly
              className="flex-1 px-3 py-2 rounded-xl border-2 text-sm font-medium shadow-sm"
              style={{
                borderColor: "#e2e8f0",
                backgroundColor: "#f8fafc",
                color: "#1e293b",
              }}
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 rounded-xl font-semibold text-sm transition-shadow hover:shadow-lg flex-shrink-0"
              style={{ backgroundColor: "#f1f5f9", color: "#1e293b" }}>
              <FaCopy />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowQR(!showQR)}
            className="px-3 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-shadow shadow-md hover:shadow-lg"
            style={{ backgroundColor: "#f1f5f9", color: "#1e293b" }}>
            <FaQrcode className="text-base" />
            <span>{showQR ? getTranslatedText("Hide") : getTranslatedText("Show")} QR</span>
          </button>
          <button
            onClick={() => handleShare("whatsapp")}
            className="px-3 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-shadow shadow-lg hover:shadow-xl"
            style={{ backgroundColor: "#25D366", color: "#ffffff" }}>
            <FaWhatsapp className="text-lg" />
            <span>{getTranslatedText("WhatsApp")}</span>
          </button>
        </div>

        {/* QR Code Display */}
        {showQR && (
          <div className="flex justify-center p-3 bg-white rounded-xl shadow-inner mt-3">
            <QRCodeGenerator value={shareLink} size={180} />
          </div>
        )}
      </div>

      {/* Monthly Tier Bonus */}
      {tierInfo && tierInfo.monthlyBonus > 0 && (
        <div
          className="rounded-2xl shadow-lg p-4 md:p-6 backdrop-blur-sm" style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h3
                className="text-base md:text-lg font-bold mb-1"
                style={{ color: "#2d3748" }}>
                {getTranslatedText("Monthly Tier Bonus")}
              </h3>
              <p className="text-sm" style={{ color: "#718096" }}>
                You're eligible for ₹{tierInfo.monthlyBonus} monthly bonus as{" "}
                {tierInfo.name} tier member
              </p>
            </div>
            <button
              onClick={() => {
                const result = processMonthlyTierBonus(
                  user.phone || user.id,
                  "user"
                );
                if (result.success) {
                  alert(`Monthly tier bonus of ₹${result.amount} credited!`);
                  // Reload stats
                  const referralStats = getUserReferralStats(
                    user.phone || user.id,
                    "user"
                  );
                  setStats(referralStats);
                } else {
                  alert(
                    result.error ||
                    getTranslatedText("Unable to process monthly bonus")
                  );
                }
              }}
              className="px-4 py-2 rounded-xl font-semibold text-sm transition-shadow hover:shadow-lg"
              style={{ backgroundColor: "#38bdf8", color: "#ffffff" }}>
              {getTranslatedText("Claim Bonus")}
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-2xl shadow-xl p-3 backdrop-blur-sm border-2 border-emerald-100 transition-shadow hover:shadow-2xl"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.98)" }}>
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
              style={{ backgroundColor: "rgba(100, 148, 110, 0.15)" }}>
              <FaUsers className="text-lg" style={{ color: "#38bdf8" }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-tight" style={{ color: "#64748b" }}>
                {getTranslatedText("Total Referrals")}
              </p>
              <p
                className="text-2xl font-bold leading-tight"
                style={{ color: "#1e293b" }}>
                {stats.totalReferrals}
              </p>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl shadow-xl p-3 backdrop-blur-sm border-2 border-emerald-100 transition-shadow hover:shadow-2xl"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.98)" }}>
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
              style={{ backgroundColor: "rgba(100, 148, 110, 0.15)" }}>
              <FaRupeeSign className="text-lg" style={{ color: "#38bdf8" }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-tight" style={{ color: "#64748b" }}>
                {getTranslatedText("Total Earnings")}
              </p>
              <p
                className="text-2xl font-bold leading-tight"
                style={{ color: "#1e293b" }}>
                ₹{stats.totalEarnings}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Benefits */}
      {tierInfo && tierInfo.bonusPercent > 0 && (
        <div
          className="rounded-2xl shadow-lg p-4 md:p-6 backdrop-blur-sm" style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}>
          <div className="flex items-center gap-3 mb-4">
            <FaTrophy className="text-2xl" style={{ color: tierInfo.color }} />
            <h2
              className="text-lg md:text-xl font-bold"
              style={{ color: "#2d3748" }}>
              {tierInfo.name} Tier Benefits
            </h2>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FaCheckCircle style={{ color: "#0ea5e9" }} />
              <span className="text-sm" style={{ color: "#2d3748" }}>
                {tierInfo.bonusPercent}% bonus on all referral rewards
              </span>
            </div>
            {tierInfo.monthlyBonus > 0 && (
              <div className="flex items-center gap-2">
                <FaCheckCircle style={{ color: "#0ea5e9" }} />
                <span className="text-sm" style={{ color: "#2d3748" }}>
                  ₹{tierInfo.monthlyBonus} monthly tier bonus
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div
        className="rounded-2xl shadow-xl p-4 backdrop-blur-sm border-2 border-emerald-100 transition-shadow hover:shadow-2xl"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.98)" }}>
        <h2
          className="text-lg font-bold mb-4"
          style={{ color: "#1e293b" }}>
          {getTranslatedText("How It Works")}
        </h2>
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
                <span className="font-bold text-sm text-white">1</span>
              </div>
              <div
                className="absolute top-8 left-1/2 w-0.5 h-6"
                style={{
                  transform: "translateX(-50%)",
                  background: "linear-gradient(to bottom, rgba(16, 185, 129, 0.3), transparent)"
                }}></div>
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="font-bold text-sm mb-1" style={{ color: "#1e293b" }}>
                {getTranslatedText("Share Your Code")}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                {getTranslatedText("Share your referral code or link with friends")}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}>
                <span className="font-bold text-sm text-white">2</span>
              </div>
              <div
                className="absolute top-8 left-1/2 w-0.5 h-6"
                style={{
                  transform: "translateX(-50%)",
                  background: "linear-gradient(to bottom, rgba(59, 130, 246, 0.3), transparent)"
                }}></div>
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="font-bold text-sm mb-1" style={{ color: "#1e293b" }}>
                {getTranslatedText("They Sign Up")}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                {getTranslatedText("Your friend signs up using your code")}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}>
                <span className="font-bold text-sm text-white">3</span>
              </div>
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="font-bold text-sm mb-1" style={{ color: "#1e293b" }}>
                {getTranslatedText("You Both Earn")}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                {getTranslatedText("You get ₹{amount} and they get ₹{bonus} welcome bonus", {
                  amount: settings.userRewards.signupBonus,
                  bonus: settings.userRewards.refereeWelcomeBonus
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Referrals List with Milestones */}
      {stats.referrals.length > 0 && (
        <div
          className="rounded-2xl shadow-lg p-4 md:p-6 backdrop-blur-sm" style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}>
          <h2
            className="text-lg md:text-xl font-bold mb-4"
            style={{ color: "#2d3748" }}>
            {getTranslatedText("Your Referrals")}
          </h2>
          <div className="space-y-4">
            {stats.referrals.map((referral, index) => {
              const milestones = referral.milestones || {};
              const rewards = referral.rewards?.referrerRewards || [];
              const totalEarned = rewards.reduce(
                (sum, r) => sum + (r.amount || 0),
                0
              );

              return (
                <div
                  key={referral.id || index}
                  className="p-4 rounded-xl border"
                  style={{
                    backgroundColor: "#f7fafc",
                    borderColor: "#e2e8f0",
                  }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "rgba(100, 148, 110, 0.1)" }}>
                        <FaUsers style={{ color: "#38bdf8" }} />
                      </div>
                      <div>
                        <p
                          className="font-semibold text-sm"
                          style={{ color: "#2d3748" }}>
                          {getTranslatedText("Referred User")}
                        </p>
                        <p className="text-xs" style={{ color: "#718096" }}>
                          {new Date(referral.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-sm font-semibold mb-1"
                        style={{ color: "#38bdf8" }}>
                        ₹{totalEarned}
                      </p>
                      <p className="text-xs" style={{ color: "#718096" }}>
                        {referral.status === "active" ? (
                          <span className="flex items-center gap-1">
                            <FaCheckCircle />
                            {getTranslatedText("Active")}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <FaClock />
                            {getTranslatedText("Pending")}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Milestone Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: "#718096" }}>Milestones:</span>
                      <span
                        className="font-semibold"
                        style={{ color: "#2d3748" }}>
                        {Object.values(milestones).filter(Boolean).length}/3
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${milestones.refereeRegistered
                            ? "bg-green-500"
                            : "bg-gray-300"
                            }`}
                        />
                        <span className="text-xs" style={{ color: "#718096" }}>
                          Registered {milestones.refereeRegistered ? "✓" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${milestones.refereeFirstRequest
                            ? "bg-green-500"
                            : "bg-gray-300"
                            }`}
                        />
                        <span className="text-xs" style={{ color: "#718096" }}>
                          First Request{" "}
                          {milestones.refereeFirstRequest ? "✓" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${milestones.refereeFirstCompletion
                            ? "bg-green-500"
                            : "bg-gray-300"
                            }`}
                        />
                        <span className="text-xs" style={{ color: "#718096" }}>
                          First Completion{" "}
                          {milestones.refereeFirstCompletion ? "✓" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferAndEarn;

