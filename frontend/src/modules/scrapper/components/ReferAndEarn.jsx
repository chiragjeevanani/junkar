import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import {
  getOrGenerateReferralCode,
  getUserReferralStats,
  getReferralSettings,
  getUserTier,
  processMonthlyTierBonus
} from '../../shared/utils/referralUtils';
import QRCodeGenerator from '../../shared/components/QRCodeGenerator';
import usePageTranslation from '../../../hooks/usePageTranslation';
// Trigger rebuild for ReferenceError: usePageTranslation
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
  FaInstagram
} from 'react-icons/fa';

const ReferAndEarn = () => {
  const staticTexts = [
    "Refer & Earn",
    "Invite other scrappers and earn rewards",
    "{count} more referrals to reach {tierName}",
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
    "Monthly Tier Bonus",
    "You're eligible for ₹{amount} monthly bonus as {tierName} tier member",
    "Claim Bonus",
    "Total Referrals",
    "Total Earnings",
    "{tierName} Tier Benefits",
    "{percent}% bonus on all referral rewards",
    "₹{amount} monthly tier bonus",
    "How It Works",
    "Share Your Code",
    "Share your referral code or link with other scrappers",
    "They Join & Complete KYC",
    "Your referral signs up and completes KYC verification",
    "You Both Earn",
    "You get ₹{signupBonus} when they sign up, ₹{kycBonus} when KYC verified, and more when they subscribe!",
    "Your Referrals",
    "Referred Scrapper",
    "Active",
    "Pending",
    "Milestones:",
    "Registered",
    "KYC Verified",
    "Subscribed",
    "First Pickup",
    "Message copied! Paste it in your Instagram story or post.",
    "Join ScrapConnect as a Scrapper and earn money! Use my referral code: {code}\n{link}",
    "Monthly tier bonus of ₹{amount} credited!",
    "Unable to process monthly bonus"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalEarnings: 0,
    referrals: []
  });
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [tierInfo, setTierInfo] = useState(null);

  useEffect(() => {
    const scrapperUser = JSON.parse(localStorage.getItem('scrapperUser') || '{}');
    if (scrapperUser.phone || scrapperUser.id) {
      const code = getOrGenerateReferralCode(scrapperUser.phone || scrapperUser.id, 'scrapper');
      setReferralCode(code);
      setShareLink(`${window.location.origin}/scrapper/login?ref=${code}`);

      const referralStats = getUserReferralStats(scrapperUser.phone || scrapperUser.id, 'scrapper');
      setStats(referralStats);

      const tier = getUserTier(scrapperUser.phone || scrapperUser.id, 'scrapper');
      setTierInfo(tier);
    }
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
    const message = getTranslatedText('Join ScrapConnect as a Scrapper and earn money! Use my referral code: {code}\n{link}', { code: referralCode, link: shareLink });

    switch (method) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        break;
      case 'sms':
        window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=Join ScrapConnect as Scrapper&body=${encodeURIComponent(message)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(shareLink)}`, '_blank');
        break;
      case 'instagram':
        navigator.clipboard.writeText(`${message}\n\nCopy this message and share on Instagram!`);
        alert(getTranslatedText('Message copied! Paste it in your Instagram story or post.'));
        break;
      default:
        break;
    }
  };

  const settings = getReferralSettings();

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-4"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center bg-sky-500/10"
          >
            <FaGift className="text-2xl text-sky-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold leading-tight text-slate-800">
              {getTranslatedText("Refer & Earn")}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 leading-tight mt-0.5">
              {getTranslatedText("Invite other scrappers and earn rewards")}
            </p>
          </div>
          {tierInfo && (
            <div
              className="px-3 py-1.5 rounded-xl flex items-center gap-1.5 flex-shrink-0"
              style={{ backgroundColor: `${tierInfo.color}20`, border: `2px solid ${tierInfo.color}` }}
            >
              <FaTrophy className="text-sm" style={{ color: tierInfo.color }} />
              <span className="font-bold text-xs" style={{ color: tierInfo.color }}>
                {tierInfo.name}
              </span>
            </div>
          )}
        </div>

        {/* Tier Progress */}
        {tierInfo && tierInfo.nextTier && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-500">
                {getTranslatedText("{count} more referrals to reach {tierName}", { count: tierInfo.nextTier.referralsNeeded, tierName: tierInfo.nextTier.name })}
              </span>
              <span className="font-semibold text-slate-800">
                {tierInfo.totalReferrals}/{tierInfo.nextTier.minReferrals}
              </span>
            </div>
            <div className="h-2 rounded-full bg-sky-500/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(tierInfo.totalReferrals / tierInfo.nextTier.minReferrals) * 100}%` }}
                className="h-full rounded-full"
                style={{ backgroundColor: tierInfo.color }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Referral Code Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-4"
      >
        <h2 className="text-base md:text-lg font-bold mb-3 text-slate-800">
          {getTranslatedText("Your Referral Code")}
        </h2>

        {/* Code Display */}
        <div className="mb-3">
          <div
            className="flex items-center justify-between p-3 rounded-xl border-2 bg-sky-500/5 border-sky-500"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 leading-tight">{getTranslatedText("Referral Code")}</p>
              <p className="text-xl md:text-2xl font-bold text-sky-600 leading-tight mt-0.5">
                {referralCode}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyCode}
              className="px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all bg-sky-600 text-white flex-shrink-0"
            >
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
            </motion.button>
          </div>
        </div>

        {/* Share Link */}
        <div className="mb-3">
          <label className="block text-sm font-semibold mb-1.5 text-slate-800">
            {getTranslatedText("Share Link")}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareLink}
              readOnly
              className="flex-1 px-3 py-2 rounded-xl border-2 text-sm border-slate-200 bg-slate-50 text-slate-800"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyLink}
              className="px-3 py-2 rounded-xl font-semibold text-sm transition-all bg-slate-50 text-slate-800 flex-shrink-0"
            >
              <FaCopy />
            </motion.button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowQR(!showQR)}
            className="px-3 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-slate-50 text-slate-800"
          >
            <FaQrcode className="text-base" />
            <span>{showQR ? getTranslatedText('Hide') : getTranslatedText('Show')} QR</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleShare('whatsapp')}
            className="px-3 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg text-white"
            style={{ backgroundColor: '#25D366' }}
          >
            <FaWhatsapp className="text-lg" />
            <span>{getTranslatedText("WhatsApp")}</span>
          </motion.button>
        </div>

        {/* QR Code Display */}
        {showQR && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex justify-center p-3 bg-white rounded-xl shadow-inner mt-3"
          >
            <QRCodeGenerator value={shareLink} size={180} />
          </motion.div>
        )}
      </motion.div>

      {/* Monthly Tier Bonus */}
      {
        tierInfo && tierInfo.monthlyBonus > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base md:text-lg font-bold mb-1 text-slate-800">
                  {getTranslatedText("Monthly Tier Bonus")}
                </h3>
                <p className="text-sm text-slate-500">
                  {getTranslatedText("You're eligible for ₹{amount} monthly bonus as {tierName} tier member", { amount: tierInfo.monthlyBonus, tierName: tierInfo.name })}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const scrapperUser = JSON.parse(localStorage.getItem('scrapperUser') || '{}');
                  const userId = scrapperUser.phone || scrapperUser.id;
                  const result = processMonthlyTierBonus(userId, 'scrapper');
                  if (result.success) {
                    alert(getTranslatedText("Monthly tier bonus of ₹{amount} credited!", { amount: result.amount }));
                    // Reload stats
                    const referralStats = getUserReferralStats(userId, 'scrapper');
                    setStats(referralStats);
                    const tier = getUserTier(userId, 'scrapper');
                    setTierInfo(tier);
                  } else {
                    alert(result.error || getTranslatedText('Unable to process monthly bonus'));
                  }
                }}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition-all bg-sky-600 text-white"
              >
                {getTranslatedText("Claim Bonus")}
              </motion.button>
            </div>
          </motion.div>
        )
      }

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-3"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-500/10 flex-shrink-0"
            >
              <FaUsers className="text-lg text-sky-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 leading-tight">{getTranslatedText("Total Referrals")}</p>
              <p className="text-2xl font-bold text-slate-800 leading-tight">
                {stats.totalReferrals}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-3"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-500/10 flex-shrink-0"
            >
              <FaRupeeSign className="text-lg text-sky-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 leading-tight">{getTranslatedText("Total Earnings")}</p>
              <p className="text-2xl font-bold text-slate-800 leading-tight">
                ₹{stats.totalEarnings}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tier Benefits */}
      {
        tierInfo && tierInfo.bonusPercent > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <FaTrophy className="text-2xl" style={{ color: tierInfo.color }} />
              <h2 className="text-lg md:text-xl font-bold text-slate-800">
                {getTranslatedText("{tierName} Tier Benefits", { tierName: tierInfo.name })}
              </h2>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-sky-500" />
                <span className="text-sm text-slate-800">
                  {getTranslatedText("{percent}% bonus on all referral rewards", { percent: tierInfo.bonusPercent })}
                </span>
              </div>
              {tierInfo.monthlyBonus > 0 && (
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-sky-500" />
                  <span className="text-sm text-slate-800">
                    {getTranslatedText("₹{amount} monthly tier bonus", { amount: tierInfo.monthlyBonus })}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )
      }

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-lg p-4"
      >
        <h2 className="text-lg font-bold mb-4 text-slate-800">
          {getTranslatedText("How It Works")}
        </h2>
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-md">
                <span className="font-bold text-sm text-white">1</span>
              </div>
              <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gradient-to-b from-sky-300 to-transparent"></div>
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="font-bold text-sm text-slate-800 mb-1">
                {getTranslatedText("Share Your Code")}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {getTranslatedText("Share your referral code or link with other scrappers")}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                <span className="font-bold text-sm text-white">2</span>
              </div>
              <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gradient-to-b from-blue-300 to-transparent"></div>
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="font-bold text-sm text-slate-800 mb-1">
                {getTranslatedText("They Join & Complete KYC")}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {getTranslatedText("Your referral signs up and completes KYC verification")}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                <span className="font-bold text-sm text-white">3</span>
              </div>
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="font-bold text-sm text-slate-800 mb-1">
                {getTranslatedText("You Both Earn")}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {getTranslatedText("You get ₹{signupBonus} when they sign up, ₹{kycBonus} when KYC verified, and more when they subscribe!", { signupBonus: settings.scrapperRewards.signupBonus, kycBonus: settings.scrapperRewards.refereeWelcomeBonus })}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Referrals List with Milestones */}
      {
        stats.referrals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
          >
            <h2 className="text-lg md:text-xl font-bold mb-4 text-slate-800">
              {getTranslatedText("Your Referrals")}
            </h2>
            <div className="space-y-4">
              {stats.referrals.map((referral, index) => {
                const milestones = referral.milestones || {};
                const rewards = referral.rewards?.referrerRewards || [];
                const totalEarned = rewards.reduce((sum, r) => sum + (r.amount || 0), 0);

                return (
                  <div
                    key={referral.id || index}
                    className="p-4 rounded-xl border bg-slate-50 border-slate-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center bg-sky-500/10"
                        >
                          <FaUsers className="text-sky-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-800">
                            {getTranslatedText("Referred Scrapper")}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(referral.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold mb-1 text-sky-600">
                          ₹{totalEarned}
                        </p>
                        <p className="text-xs text-slate-500">
                          {referral.status === 'active' ? (
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
                        <span className="text-slate-500">{getTranslatedText("Milestones:")}</span>
                        <span className="font-semibold text-slate-800">
                          {Object.values(milestones).filter(Boolean).length}/4
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${milestones.refereeRegistered ? 'bg-sky-500' : 'bg-gray-300'}`} />
                          <span className="text-xs text-slate-500">
                            {getTranslatedText("Registered")} {milestones.refereeRegistered ? '✓' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${milestones.refereeKYCVerified ? 'bg-sky-500' : 'bg-gray-300'}`} />
                          <span className="text-xs text-slate-500">
                            {getTranslatedText("KYC Verified")} {milestones.refereeKYCVerified ? '✓' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${milestones.refereeSubscribed ? 'bg-sky-500' : 'bg-gray-300'}`} />
                          <span className="text-xs text-slate-500">
                            {getTranslatedText("Subscribed")} {milestones.refereeSubscribed ? '✓' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${milestones.refereeFirstPickup ? 'bg-sky-500' : 'bg-gray-300'}`} />
                          <span className="text-xs text-slate-500">
                            {getTranslatedText("First Pickup")} {milestones.refereeFirstPickup ? '✓' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )
      }
    </div >
  );
};

export default ReferAndEarn;

