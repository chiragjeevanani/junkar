import { Facebook, Twitter, Instagram, Linkedin, ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { usePageTranslation } from '../../hooks/usePageTranslation';

const Footer = () => {
    const location = useLocation();
    const isVendorPage = location.pathname.startsWith('/vendor');
    const basePath = isVendorPage ? '/vendor' : ''; 

    const { getTranslatedText } = usePageTranslation([
        "Revolutionizing the scrap industry with transparency, efficiency, and sustainability. Turn your trash into cash and contribute to a greener planet.",
        "Quick Links", "Support", "Newsletter", "Home", "About Us", "How it Works", "ScrapperPartner", "FAQ", "Contact Us", "Privacy Policy", "Terms of Service",
        "Subscribe to get latest market rates and eco-tips.", "Email address", "Privacy", "Terms", "Cookies", "All rights reserved."
    ]);

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <div className="logo footer-logo" style={{ color: 'white' }}>
                            <img src="/junkar.png" alt="Junkar" style={{ height: '4rem', filter: 'brightness(0) invert(1)' }} />
                        </div>
                        <p className="footer-text">
                            {getTranslatedText("Revolutionizing the scrap industry with transparency, efficiency, and sustainability. Turn your trash into cash and contribute to a greener planet.")}
                        </p>
                        <div className="footer-socials">
                            {[
                                { Icon: Facebook, link: "https://www.facebook.com/share/1Ctd3wjnSE/" },
                                { Icon: Twitter, link: "https://x.com/Junkar_in" },
                                { Icon: Instagram, link: "https://www.instagram.com/junkar.in?utm_source=qr&igsh=MW04ajVnYmN2Yzh1ag==" },
                                { Icon: Linkedin, link: "https://www.linkedin.com/in/junkar-india-19a7903b5?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" }
                            ].map((social, i) => (
                                <a 
                                    key={i} 
                                    href={social.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="social-link"
                                >
                                    <social.Icon size={20} color="white" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="footer-heading">{getTranslatedText("Quick Links")}</h4>
                        <ul className="footer-links">
                            <li><Link to={`${basePath}/`} className="footer-link">{getTranslatedText("Home")}</Link></li>
                            <li><a href={`${basePath}/#about`} className="footer-link">{getTranslatedText("About Us")}</a></li>
                            <li><a href={`${basePath}/#how-it-works`} className="footer-link">{getTranslatedText("How it Works")}</a></li>
                            <li><Link to="/vendor" className="footer-link">{getTranslatedText("ScrapperPartner")}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="footer-heading">{getTranslatedText("Support")}</h4>
                        <ul className="footer-links">
                            <li><Link to="/user/help" className="footer-link">{getTranslatedText("FAQ")}</Link></li>
                            <li><a href="/#contact" className="footer-link">{getTranslatedText("Contact Us")}</a></li>
                            <li><Link to="/privacy-policy" className="footer-link">{getTranslatedText("Privacy Policy")}</Link></li>
                            <li><Link to="/terms-of-service" className="footer-link">{getTranslatedText("Terms of Service")}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="footer-heading">{getTranslatedText("Newsletter")}</h4>
                        <p className="footer-text" style={{ fontSize: '0.875rem' }}>{getTranslatedText("Subscribe to get latest market rates and eco-tips.")}</p>
                        <div style={{ position: 'relative', marginTop: '1rem' }}>
                            <input
                                type="email"
                                placeholder={getTranslatedText("Email address")}
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
                    <p>© {new Date().getFullYear()} Junkar. {getTranslatedText("All rights reserved.")}</p>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <Link to="/privacy-policy">{getTranslatedText("Privacy")}</Link>
                        <Link to="/terms-of-service">{getTranslatedText("Terms")}</Link>
                        <a href="#">{getTranslatedText("Cookies")}</a>
                    </div>
                </div>
            </div>
            <style>{`
        @media (max-width: 768px) {
          .footer { padding: 3rem 0 1.5rem !important; }
          .footer-logo { margin-bottom: 0.5rem !important; }
          .footer-logo img { height: 3.5rem !important; }
          .footer-text { margin-bottom: 1rem !important; font-size: 0.9rem !important; }
          .footer-heading { margin-bottom: 1rem !important; margin-top: 1rem !important; }
          .footer-grid { margin-bottom: 2rem !important; gap: 1.5rem !important; }
          .footer-bottom { padding-top: 1.5rem !important; }
        }
        @media (max-width: 480px) {
          .footer { text-align: center; }
          .footer-socials { justify-content: center; }
          .footer-logo { margin: 0 auto 1.5rem; }
          .footer-bottom div { justify-content: center; }
        }
      `}</style>
        </footer>
    );
};

export default Footer;
