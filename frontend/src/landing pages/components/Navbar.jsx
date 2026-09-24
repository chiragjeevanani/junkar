import React, { useState, useEffect } from 'react';
import { Globe, Smartphone, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { usePageTranslation } from '../../hooks/usePageTranslation';
import LanguageSelector from '../../modules/shared/components/LanguageSelector';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const { getTranslatedText } = usePageTranslation([
        'Home', 'About', 'Contact', 'App', 'Get App', 'ScrapperPartner'
    ]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} style={{
            background: 'white',
            borderBottom: '1px solid #f1f5f9',
            position: 'fixed',
            top: 0,
            width: '100%',
            left: 0,
            zIndex: 100,
            transition: 'all 0.3s ease',
            boxShadow: scrolled ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 3rem', width: '100%' }}>
                <Link to="/" className="flex items-center gap-2 cursor-pointer">
                    <img
                        src="/junkar.png"
                        alt="Junkar"
                        style={{ height: '5rem', width: 'auto', objectFit: 'contain', objectPosition: 'left', marginLeft: '-0.5rem' }}
                    />
                </Link>

                <div className="nav-right-section" style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                    <div className="nav-links desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <Link to="/" className="nav-link" style={{ color: '#64748b', fontWeight: 600, fontFamily: 'Poppins' }}>{getTranslatedText('Home')}</Link>
                        <a href="/#about" className="nav-link" style={{ color: '#64748b', fontWeight: 600, fontFamily: 'Poppins' }}>{getTranslatedText('About')}</a >
                        <a href="/#contact" className="nav-link" style={{ color: '#64748b', fontWeight: 600, fontFamily: 'Poppins' }}>{getTranslatedText('Contact')}</a >
                        <a href="/#app" className="nav-link" style={{ color: '#64748b', fontWeight: 600, fontFamily: 'Poppins' }}>{getTranslatedText('App')}</a >
                        <Link to="/vendor" className="nav-link" style={{ color: '#64748b', fontWeight: 600, fontFamily: 'Poppins' }}>{getTranslatedText('ScrapperPartner')}</Link>
                    </div>

                    <div className="nav-utility-section" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <motion.div
                            className="nav-actions desktop-only"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}
                        >
                            <div className="language-selector">
                                <LanguageSelector variant="light" />
                            </div>
                            <a href="#app" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0ea5e9', textDecoration: 'none', color: 'white' }}>
                                <Smartphone size={18} />
                                {getTranslatedText('Get App')}
                            </a>
                        </motion.div>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#1e293b',
                                cursor: 'pointer',
                                display: 'none', // Managed by CSS media query
                                padding: '0.5rem'
                            }}
                        >
                            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            <motion.div
                initial={false}
                animate={isMenuOpen ? "open" : "closed"}
                variants={{
                    open: { x: 0, opacity: 1, visibility: 'visible' },
                    closed: { x: '100%', opacity: 0, transitionEnd: { visibility: 'hidden' } }
                }}
                className="mobile-sidebar"
                style={{
                    position: 'fixed',
                    top: '60px',
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    background: 'white',
                    zIndex: 99,
                    padding: '3.5rem 2rem 2rem',
                    overflowY: 'auto'
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="mobile-nav-links" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <Link to="/" onClick={() => setIsMenuOpen(false)} className="nav-link" style={{ fontSize: '1.2rem', fontWeight: 600 }}>{getTranslatedText('Home')}</Link>
                        <a href="/#about" onClick={() => setIsMenuOpen(false)} className="nav-link" style={{ fontSize: '1.2rem', fontWeight: 600 }}>{getTranslatedText('About')}</a>
                        <a href="/#contact" onClick={() => setIsMenuOpen(false)} className="nav-link" style={{ fontSize: '1.2rem', fontWeight: 600 }}>{getTranslatedText('Contact')}</a>
                        <a href="/#app" onClick={() => setIsMenuOpen(false)} className="nav-link" style={{ fontSize: '1.2rem', fontWeight: 600 }}>{getTranslatedText('App')}</a>
                        <Link to="/vendor" onClick={() => setIsMenuOpen(false)} className="nav-link" style={{ fontSize: '1.2rem', fontWeight: 600 }}>{getTranslatedText('ScrapperPartner')}</Link>
                    </div>
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="flex items-center gap-2">
                            <span style={{ fontWeight: 600 }}>Select Language:</span>
                            <LanguageSelector variant="light" />
                        </div>
                        <a href="#app" onClick={() => setIsMenuOpen(false)} className="btn btn-primary" style={{ padding: '0.8rem', justifyContent: 'center', width: '100%' }}>
                            <Smartphone size={20} />
                            {getTranslatedText('Get App')}
                        </a>
                    </div>
                </div>
            </motion.div>
        </nav>
    );
};

export default Navbar;
