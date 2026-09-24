import React from 'react';
import { motion } from 'framer-motion';
import { Download, ArrowRight, Play, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePageTranslation } from '../../hooks/usePageTranslation';
import heroBg from '../../assets/landing/user_hero_bg_premium.png';

const Hero = () => {
    const { getTranslatedText } = usePageTranslation([
        "Direct Doorstep Pickup",
        "Turn Your",
        "Trash",
        "into",
        "Cash!",
        "Sell your scrap easily with real-time market rates and hassle-free doorstep pickup. Join the green revolution today!",
        "Request Pickup",
        "Download App",
        "Active Sellers",
        "Verified Scrappers",
        "Cash Paid Out"
    ]);

    return (
        <section id="home" className="hero" style={{
            position: 'relative',
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'flex-start',
            paddingTop: '6rem',
            background: `url(${heroBg}) no-repeat center center/cover`,
            color: 'white' // Assuming we need contrast with background, or dark text depending on the image. Lantan is white on dark.
        }}>
            {/* Adding an overlay to ensure text is readable if image is complex */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.4) 100%)' }}></div>

            <div className="container" style={{ position: 'relative', zIndex: 1, padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', marginLeft: '0' }}>
                <div className="hero-content">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="hero-badge"
                        style={{ display: 'inline-flex', background: 'var(--primary)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '1rem' }}
                    >
                        <span className="bullet">●</span> {getTranslatedText("Direct Doorstep Pickup")}
                    </motion.div>

                    <motion.h1
                        className="hero-title"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1, marginBottom: '1rem', color: 'white' }}
                    >
                        {getTranslatedText("Turn Your")} <span style={{ color: 'var(--primary-light)' }}>{getTranslatedText("Trash")}</span> <br />
                        {getTranslatedText("into")} <span style={{ color: 'var(--primary-light)' }}>{getTranslatedText("Cash!")}</span>
                    </motion.h1>

                    <motion.p
                        className="hero-subtitle"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{ fontSize: '1.1rem', maxWidth: '600px', marginBottom: '2rem', color: 'rgba(255,255,255,0.8)' }}
                    >
                        {getTranslatedText("Sell your scrap easily with real-time market rates and hassle-free doorstep pickup. Join the green revolution today!")}
                    </motion.p>

                    <motion.div
                        className="hero-ctas"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
                    >
                        <Link to="/user/add-scrap/category" style={{ textDecoration: 'none' }}>
                            <button className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>
                                {getTranslatedText("Request Pickup")} <ArrowRight size={20} />
                            </button>
                        </Link>
                        <a href="https://play.google.com/store/apps/details?id=com.company.junkar" target="_blank" rel="noopener noreferrer">
                            <button className="btn" style={{ background: 'transparent', border: '2px solid white', color: 'white', padding: '0.8rem 2rem' }}>
                                <Download size={20} />
                                {getTranslatedText("Download App")}
                            </button>
                        </a>
                    </motion.div>

                    <motion.div
                        className="hero-stats"
                        style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '2rem' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <div className="stat-item">
                            <h3 style={{ fontSize: '1.8rem', color: 'white' }}>10k+</h3>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>{getTranslatedText("Active Sellers")}</p>
                        </div>
                        <div className="stat-divider" style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
                        <div className="stat-item">
                            <h3 style={{ fontSize: '1.8rem', color: 'white' }}>50+</h3>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>{getTranslatedText("Verified Scrappers")}</p>
                        </div>
                        <div className="stat-divider" style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
                        <div className="stat-item">
                            <h3 style={{ fontSize: '1.8rem', color: 'white' }}>₹1.2Cr+</h3>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>{getTranslatedText("Cash Paid Out")}</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section >
    );
};

export default Hero;
