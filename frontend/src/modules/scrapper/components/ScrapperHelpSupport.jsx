import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../shared/context/AuthContext';
import { supportAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const ScrapperHelpSupport = () => {
  const staticTexts = [
    "Help & Support",
    "Facing an issue with pickups, payments, or the app? Create a support request and the admin team will review it.",
    "Category",
    "Select an issue",
    "Pickup routing / request assignment",
    "Payout / payment issue",
    "Subscription / billing",
    "KYC / verification",
    "App not working",
    "Other",
    "Describe your issue",
    "Please include request ID, approximate time, and any details that can help us...",
    "Submitting your ticket...",
    "Your ticket has been submitted. Redirecting you to dashboard...",
    "Submitting...",
    "Submit Ticket",
    "Scrapper"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // After successful submit, show black status box and then redirect to scrapper home
  useEffect(() => {
    if (success) {
      setStatusMessage(getTranslatedText('Your ticket has been submitted. Redirecting you to dashboard...'));
      const timer = setTimeout(() => {
        navigate('/scrapper', { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || !message.trim()) return;
    if (submitting) return;

    setSubmitting(true);
    setStatusMessage(getTranslatedText('Submitting your ticket...'));

    // Map frontend categories to backend generic types
    let backendType = 'general';
    let subject = 'Scrapper Support Request';

    switch (category) {
      case 'pickup_routing':
        backendType = 'issue';
        subject = 'Pickup Routing/Assignment Issue';
        break;
      case 'payment_payout':
        backendType = 'payment';
        subject = 'Payout/Payment Issue';
        break;
      case 'subscription':
        backendType = 'account';
        subject = 'Subscription/Billing Issue';
        break;
      case 'kyc':
        backendType = 'account';
        subject = 'KYC/Verification Issue';
        break;
      case 'app_bug':
        backendType = 'issue';
        subject = 'App Bug Report';
        break;
      default:
        backendType = 'general';
        subject = 'Support Request';
    }

    try {
      await supportAPI.create({
        subject: subject,
        type: backendType,
        message: message.trim(),
        role: 'scrapper'
      });
      setSuccess(true);
      setMessage('');
      setCategory('');
    } catch (error) {
      console.error("Failed to submit ticket:", error);
      setStatusMessage(getTranslatedText('Failed to submit. Please try again.'));
      // Reset submitting status after a delay
      setTimeout(() => setSubmitting(false), 2000);
    } finally {
      if (!success) {
        setSubmitting(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen w-full p-4 md:p-6"
      style={{ background: "linear-gradient(to bottom, #7dd3fc, #e0f2fe)" }}
    >
      <div className="w-full p-2 md:p-4">
        <h2 className="text-xl md:text-2xl font-bold mb-2 text-slate-800">
          {getTranslatedText("Help & Support")}
        </h2>
        <p className="text-xs md:text-sm mb-4 text-slate-500">
          {getTranslatedText("Facing an issue with pickups, payments, or the app? Create a support request and the admin team will review it.")}
        </p>

        {(submitting || success) && statusMessage && (
          <div
            className="mb-4 text-xs md:text-sm rounded-xl p-3 md:p-4 bg-slate-900 text-gray-100"
          >
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
              {getTranslatedText("Category")}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-sm md:text-base border-sky-100 bg-slate-50 text-slate-800 focus:border-sky-500"
            >
              <option value="">{getTranslatedText("Select an issue")}</option>
              <option value="pickup_routing">{getTranslatedText("Pickup routing / request assignment")}</option>
              <option value="payment_payout">{getTranslatedText("Payout / payment issue")}</option>
              <option value="subscription">{getTranslatedText("Subscription / billing")}</option>
              <option value="kyc">{getTranslatedText("KYC / verification")}</option>
              <option value="app_bug">{getTranslatedText("App not working")}</option>
              <option value="other">{getTranslatedText("Other")}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
              {getTranslatedText("Describe your issue")}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder={getTranslatedText("Please include request ID, approximate time, and any details that can help us...")}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-sm md:text-base resize-none border-sky-100 bg-slate-50 text-slate-800 focus:border-sky-500"
            />
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={submitting || !category || !message.trim()}
            className="w-full py-3 md:py-4 rounded-xl font-bold text-sm md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-sky-600 text-white hover:bg-sky-700"
          >
            {submitting ? getTranslatedText('Submitting...') : getTranslatedText('Submit Ticket')}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
};

export default ScrapperHelpSupport;


