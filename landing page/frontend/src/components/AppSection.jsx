import React from 'react';
import { motion } from 'framer-motion';
import { Download, Apple } from 'lucide-react';

const AppSection = () => {
    return (
        <section id="app" className="section" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', overflow: 'hidden' }}>
            <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                >
                    <span className="section-tag" style={{ color: 'var(--primary-light)' }}>Get the App</span>
                    <h2 className="section-title" style={{ color: 'white', fontSize: '3rem' }}>Experience Smarter Scrap Selling</h2>
                    <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
                        Download the Junkar app to track live prices, manage your requests, and get instant notifications on the go. Available for Android and iOS.
                    </p>

                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            className="btn"
                            style={{ background: 'white', color: 'black', padding: '0.8rem 1.5rem', borderRadius: '12px' }}
                        >
                            <Apple size={24} />
                            <div style={{ textAlign: 'left', lineHeight: 1 }}>
                                <p style={{ fontSize: '0.7rem' }}>Download on the</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 800 }}>App Store</p>
                            </div>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            className="btn"
                            style={{ background: 'white', color: 'black', padding: '0.8rem 1.5rem', borderRadius: '12px' }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.523 15.3414C17.523 16.3533 16.6853 17.1643 15.6603 17.1643C14.6353 17.1643 13.7977 16.3533 13.7977 15.3414C13.7977 14.3295 14.6353 13.5186 15.6603 13.5186C16.6853 13.5186 17.523 14.3295 17.523 15.3414ZM8.3308 17.1643C7.3058 17.1643 6.4681 16.3533 6.4681 15.3414C6.4681 14.3295 7.3058 13.5186 8.3308 13.5186C9.3558 13.5186 10.1935 14.3295 10.1935 15.3414C10.1935 16.3533 9.3558 17.1643 8.3308 17.1643ZM17.9351 9.0744L19.9825 5.5323C20.1098 5.3094 20.0385 5.0253 19.8156 4.898C19.5927 4.7707 19.3086 4.842 19.1813 5.0649L17.1009 8.6656C15.548 7.9566 13.8247 7.5457 12.0001 7.5457C10.1754 7.5457 8.4522 7.9566 6.8993 8.6656L4.8189 5.0649C4.6915 4.842 4.4074 4.7707 4.1845 4.898C3.9616 5.0253 3.8903 5.3094 4.0177 5.5323L6.065 9.0744C2.6596 10.9412 0.3013 14.4828 0 18.6631H24C23.6987 14.4828 21.3404 10.9412 17.9351 9.0744Z" fill="#3DDC84" />
                            </svg>
                            <div style={{ textAlign: 'left', lineHeight: 1 }}>
                                <p style={{ fontSize: '0.7rem' }}>Get it on</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 800 }}>Google Play</p>
                            </div>
                        </motion.button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}
                >
                    {/* Mockup for Phone */}
                    <div style={{
                        width: '240px',
                        height: '480px',
                        background: '#000',
                        borderRadius: '40px',
                        border: '8px solid #334155',
                        boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ background: 'var(--primary)', height: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.3)', margin: '0 auto', borderRadius: '10px' }}></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ width: '100px', height: '20px', background: 'rgba(255,255,255,0.3)', borderRadius: '4px' }}></div>
                                <div style={{ width: '20px', height: '20px', background: 'rgba(255,255,255,0.3)', borderRadius: '50%' }}></div>
                            </div>
                            <div style={{ height: '130px', background: 'white', borderRadius: '12px', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <img src="/junker.png" alt="Junkar Logo" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {[1, 2, 3, 4].map(i => <div key={i} style={{ height: '70px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px' }}></div>)}
                            </div>
                        </div>
                    </div>

                    {/* Floating elements around phone */}
                    <motion.div
                        animate={{ y: [0, -15, 0] }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        style={{ position: 'absolute', top: '20%', right: '10%', background: 'var(--primary)', color: 'white', padding: '1rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(16,185,129,0.3)' }}
                    >
                        <Download size={24} />
                    </motion.div>
                </motion.div>
            </div>

            <style>{`
        @media (max-width: 991px) {
          section#app > div { grid-template-columns: 1fr; text-align: center; }
          section#app div { justify-content: center; }
        }
      `}</style>
        </section>
    );
};

export default AppSection;
