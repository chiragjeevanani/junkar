import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserLanding from './pages/UserLanding/UserLanding';
import VendorLanding from './pages/VendorLanding/VendorLanding';
import './App.css';

import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<UserLanding />} />
          <Route path="/vendor" element={<VendorLanding />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
