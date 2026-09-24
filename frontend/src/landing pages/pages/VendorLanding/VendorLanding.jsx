import React from 'react';
import '../../styles/landing-global.css';
import '../../styles/landing-main.css';
import VendorNavbar from '../../components/Vendor/VendorNavbar';
import VendorHero from '../../components/Vendor/VendorHero';
import VendorBenefits from '../../components/Vendor/VendorBenefits';
import VendorHowItWorks from '../../components/Vendor/VendorHowItWorks';
import About from '../../components/About';
import Contact from '../../components/Contact';
import Footer from '../../components/Footer';
import AppSection from '../../components/AppSection';
import VendorKYCChecklist from '../../components/Vendor/VendorKYCChecklist';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const VendorLanding = () => {
    const navigate = useNavigate();
    const { getTranslatedText } = usePageTranslation([
        "Ready to Grow Your Business?", "Join 50+ verified vendors already earning with Junkar.",
        "Apply to Become a Vendor"
    ]);

    return (
        <div className="landing-page-container">
            <div className="app-container vendor-theme">
                <VendorNavbar />
                <main>
                    <VendorHero />
                    <VendorHowItWorks />
                    <VendorBenefits />
                    <About />
                    <AppSection />
                    <VendorKYCChecklist />
                    <Contact />

                    {/* CTA Section */}
                    <section className="section vendor-cta" style={{ background: '#10b981', color: 'white', textAlign: 'center' }}>
                        <div className="container">
                            <h2 className="section-title cta-title" style={{ color: 'white' }}>{getTranslatedText("Ready to Grow Your Business?")}</h2>
                            <p className="cta-subtitle" style={{ fontSize: '1.2rem', opacity: 0.9 }}>{getTranslatedText("Join 50+ verified vendors already earning with Junkar.")}</p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/scrapper/register')}
                                className="btn cta-btn"
                                style={{ background: 'white', color: '#10b981', fontWeight: 700, borderRadius: '50px' }}
                            >
                                {getTranslatedText("Apply to Become a Vendor")}
                            </motion.button>
                        </div>
                    </section>
                </main>
                <Footer />
            </div>
            <style>{`
                .vendor-cta { padding: 5rem 0; }
                .cta-title { margin-bottom: 1.5rem; }
                .cta-subtitle { margin-bottom: 2.5rem; }
                .cta-btn { padding: 1rem 3rem; font-size: 1.2rem; }
                @media (max-width: 768px) {
                    .vendor-cta { padding: 2rem 1.5rem !important; }
                    .cta-title { font-size: 1.75rem !important; margin-bottom: 1rem !important; }
                    .cta-subtitle { font-size: 1rem !important; margin-bottom: 1.5rem !important; }
                    .cta-btn { padding: 0.8rem 2rem !important; font-size: 1rem !important; width: 100% !important; }
                }
            `}</style>
        </div>
    );
};

export default VendorLanding;
