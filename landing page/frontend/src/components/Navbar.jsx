import React, { useState, useEffect } from 'react';
import { Globe, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const { t, language, setLanguage } = useLanguage();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { id: 'Home', label: t('nav_home') },
        { id: 'About', label: t('nav_about') },
        { id: 'Contact', label: t('nav_contact') },
        { id: 'App', label: t('nav_app') }
    ];

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
                <div className="flex items-center gap-2 cursor-pointer">
                    <img
                        src="/junker.png"
                        alt="Junkar"
                        style={{ height: '4rem', width: 'auto', objectFit: 'contain', objectPosition: 'left', marginLeft: '-0.5rem' }}
                    />
                </div>

                <div className="nav-right-section" style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                    <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        {navItems.map((item, i) => (
                            <motion.a
                                key={item.id}
                                href={`#${item.id.toLowerCase()}`}
                                className="nav-link"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{ color: '#64748b', fontWeight: 600, fontFamily: 'Poppins' }}
                            >
                                {item.label}
                            </motion.a>
                        ))}
                    </div>

                    <motion.div
                        className="nav-actions"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}
                    >
                        <div className="language-selector" style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#64748b', fontWeight: 600 }}>
                            <Globe size={18} />
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                style={{ border: 'none', background: 'transparent', fontWeight: 600, outline: 'none', color: '#64748b' }}
                            >
                                <option value="en">EN</option>
                                <option value="hi">HI</option>
                            </select>
                        </div>
                        <a href="#app" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0ea5e9', textDecoration: 'none', color: 'white' }}>
                            <Smartphone size={18} />
                            {t('nav_get_app')}
                        </a>
                    </motion.div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
