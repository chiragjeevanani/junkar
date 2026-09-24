import { Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import vendorHeroBg from '../../../assets/landing/vendor_hero_bg_premium.png';

const VendorHero = () => {
    const { getTranslatedText } = usePageTranslation([
        "Vendor Partnership Program", "Join Junkar as a", "Scrap Vendor", "Get App",
        "Receive nearby scrap pickup requests and grow your scrap collection business with our digital platform."
    ]);

    return (
        <section id="home" className="hero" style={{
            position: 'relative',
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            paddingTop: '60px', // Navbar height
            margin: 0,
            background: `url(${vendorHeroBg}) no-repeat center center/cover`,
            color: 'white'
        }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.3) 100%)' }}></div>
            <div className="container" style={{ position: 'relative', zIndex: 1, padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', marginLeft: '0' }}>
                <div className="hero-content">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="hero-badge"
                        style={{ display: 'inline-flex', background: '#10b981', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '1rem' }}
                    >
                        ● {getTranslatedText("Vendor Partnership Program")}
                    </motion.div>

                    <motion.h1
                        className="hero-title"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', lineHeight: 1.1, marginBottom: '1.5rem', color: 'white' }}
                    >
                        {getTranslatedText("Join Junkar as a")} <br />
                        <span style={{ color: '#34d399' }}>{getTranslatedText("Scrap Vendor")}</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{ fontSize: '1.1rem', maxWidth: '600px', marginBottom: '2.5rem', color: 'rgba(255,255,255,0.9)' }}
                    >
                        {getTranslatedText("Receive nearby scrap pickup requests and grow your scrap collection business with our digital platform.")}
                    </motion.p>

                    <motion.div
                        className="hero-ctas"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
                    >
                        <a href="https://play.google.com/store/apps/details?id=com.company.junkarpartner" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '0.8rem 2rem', background: '#10b981', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.8rem', color: 'white' }}>
                            <Smartphone size={20} />
                            {getTranslatedText("Get App")}
                        </a>
                    </motion.div>
                </div>
            </div>
            <style>{`
                @media (max-width: 768px) {
                    section#home.hero { 
                        min-height: 80vh !important; 
                        text-align: center !important; 
                        padding: 6rem 1.5rem 3rem !important; 
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                    }
                    section#home.hero .container { margin: 0 auto !important; }
                    section#home.hero .hero-ctas { justify-content: center !important; }
                    section#home.hero .hero-title { font-size: 2.5rem !important; }
                    section#home.hero .hero-badge { margin-bottom: 0.5rem !important; }
                }
            `}</style>
        </section>
    );
};

export default VendorHero;
