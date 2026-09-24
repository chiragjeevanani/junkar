import React from 'react';
import { Leaf, Facebook, Twitter, Instagram, Linkedin, ArrowRight } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <div className="logo footer-logo" style={{ color: 'white' }}>
                            <img src="/junker.png" alt="Junkar" style={{ height: '3rem', filter: 'brightness(0) invert(1)' }} />
                        </div>
                        <p className="footer-text">
                            Revolutionizing the scrap industry with transparency, efficiency, and sustainability. Turn your trash into cash and contribute to a greener planet.
                        </p>
                        <div className="footer-socials">
                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                <a key={i} href="#" className="social-link">
                                    <Icon size={20} color="white" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="footer-heading">Quick Links</h4>
                        <ul className="footer-links">
                            {['Home', 'About Us', 'How it Works', 'Market Prices'].map((link) => (
                                <li key={link}><a href="#" className="footer-link">{link}</a></li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="footer-heading">Support</h4>
                        <ul className="footer-links">
                            {['FAQ', 'Contact Us', 'Privacy Policy', 'Terms of Service'].map((link) => (
                                <li key={link}><a href="#" className="footer-link">{link}</a></li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="footer-heading">Newsletter</h4>
                        <p className="footer-text" style={{ fontSize: '0.875rem' }}>Subscribe to get latest market rates and eco-tips.</p>
                        <div style={{ position: 'relative', marginTop: '1rem' }}>
                            <input
                                type="email"
                                placeholder="Email address"
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 1rem',
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    outline: 'none'
                                }}
                            />
                            <button
                                style={{
                                    position: 'absolute',
                                    right: '5px',
                                    top: '5px',
                                    bottom: '5px',
                                    background: 'var(--primary)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    width: '35px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <ArrowRight size={18} color="white" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© {new Date().getFullYear()} Junkar. All rights reserved.</p>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <a href="#">Privacy</a>
                        <a href="#">Terms</a>
                        <a href="#">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
