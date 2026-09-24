import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import UserModule from './modules/user';
import AdminModule from './modules/admin';
import ScrapperModule from './modules/scrapper';
import { initializePushNotifications, setupForegroundNotificationHandler } from './services/pushNotificationService';
import UserLanding from './landing pages/pages/UserLanding/UserLanding';
import VendorLanding from './landing pages/pages/VendorLanding/VendorLanding';
import PrivacyPolicy from './landing pages/pages/Legal/PrivacyPolicy';
import TermsOfService from './landing pages/pages/Legal/TermsOfService';
import ScrollToTop from './components/ScrollToTop';
import './App.css';

function App() {
  useEffect(() => {
    initializePushNotifications();
    setupForegroundNotificationHandler((payload) => {
      console.log('Foreground notification:', payload);
    });
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Landing Pages */}
        <Route path="/" element={<UserLanding />} />
        <Route path="/vendor" element={<VendorLanding />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        {/* Scrapper Module Routes - Must come before catch-all */}
        <Route path="/scrapper/*" element={<ScrapperModule />} />

        {/* Admin Module Routes */}
        <Route path="/admin/*" element={<AdminModule />} />

        {/* User Module Routes */}
        <Route path="/user/*" element={<UserModule />} />

        {/* Legacy Redirects for User Module */}
        <Route path="/my-profile" element={<Navigate to="/user/my-profile" replace />} />
        <Route path="/my-requests" element={<Navigate to="/user/my-requests" replace />} />
        <Route path="/chats" element={<Navigate to="/user/chats" replace />} />
        <Route path="/add-scrap/*" element={<Navigate to="/user/add-scrap/category" replace />} />

        {/* Catch-all for unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
