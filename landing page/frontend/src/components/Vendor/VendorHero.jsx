import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';

const VendorHero = () => {
    return (
        <section id="home" className="hero" style={{
            position: 'relative',
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            paddingTop: '60px', // Navbar height
            margin: 0,
            background: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://i.pinimg.com/1200x/42/0f/3e/420f3e69fe3699748307dccaf902e4eb.jpg') no-repeat center center/cover`,
            color: 'white'
        }}>
            <div className="container" style={{ position: 'relative', zIndex: 1, padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', marginLeft: '0' }}>
                <div className="hero-content">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="hero-badge"
                        style={{ display: 'inline-flex', background: '#10b981', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '1rem' }}
                    >
                        ● Vendor Partnership Program
                    </motion.div>

                    <motion.h1
                        className="hero-title"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1.1, marginBottom: '1.5rem', color: 'white' }}
                    >
                        Join Junkar as a <br />
                        <span style={{ color: '#34d399' }}>Scrap Vendor</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{ fontSize: '1.2rem', maxWidth: '600px', marginBottom: '2.5rem', color: 'rgba(255,255,255,0.9)' }}
                    >
                        Receive nearby scrap pickup requests and grow your scrap collection business with our digital platform.
                    </motion.p>

                    <motion.div
                        className="hero-ctas"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
                    >
                        <a href="#app" className="btn btn-primary" style={{ padding: '0.8rem 2rem', background: '#10b981', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.8rem', color: 'white' }}>
                            <Smartphone size={20} />
                            Get App
                        </a>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default VendorHero;
