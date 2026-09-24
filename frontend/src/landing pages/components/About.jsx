import React from 'react';
import { motion } from 'framer-motion';
import { Recycle, Target, Waves } from 'lucide-react';
import { usePageTranslation } from '../../hooks/usePageTranslation';

const About = () => {
    const { getTranslatedText } = usePageTranslation([
        "Our Mission",
        "Making Sustainability Simple & Profitable",
        "Junkar is a digital platform that connects households with verified scrap collectors. Our goal is to make recycling easy, transparent, and profitable while helping the environment.",
        "Our Vision",
        "To become the world's most trusted marketplace for scrap and recycling materials.",
        "Eco-Impact",
        "Saving thousands of tons of waste from reaching landfills every month.",
        "Recycling Reimagined",
        "Leading the way to a circular economy."
    ]);

    return (
        <section id="about" className="section container">
            <div className="about-grid">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    style={{
                        background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
                        height: '400px',
                        borderRadius: '32px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    className="hide-mobile"
                >
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', textAlign: 'center' }}>
                        <Recycle size={150} opacity={0.2} />
                    </div>
                    <div style={{ position: 'absolute', bottom: '40px', left: '40px', color: 'white', textAlign: 'left' }}>
                        <h3 style={{ fontSize: '2rem' }}>{getTranslatedText("Recycling Reimagined")}</h3>
                        <p style={{ opacity: 0.8 }}>{getTranslatedText("Leading the way to a circular economy.")}</p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                >
                    <span className="section-tag">{getTranslatedText("Our Mission")}</span>
                    <h2 className="section-title">{getTranslatedText("Making Sustainability Simple & Profitable")}</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        {getTranslatedText("Junkar is a digital platform that connects households with verified scrap collectors. Our goal is to make recycling easy, transparent, and profitable while helping the environment.")}
                    </p>

                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ background: '#f0fdf4', color: 'var(--primary)', padding: '10px', borderRadius: '10px' }}>
                                <Target size={20} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: '1.1rem' }}>{getTranslatedText("Our Vision")}</h4>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{getTranslatedText("To become the world's most trusted marketplace for scrap and recycling materials.")}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ background: '#f0fdf4', color: 'var(--primary)', padding: '10px', borderRadius: '10px' }}>
                                <Waves size={20} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: '1.1rem' }}>{getTranslatedText("Eco-Impact")}</h4>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{getTranslatedText("Saving thousands of tons of waste from reaching landfills every month.")}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <style>{`
        .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
        @media (max-width: 991px) {
          .about-grid { grid-template-columns: 1fr !important; padding: 0 1.5rem !important; gap: 2rem !important; }
          .hide-mobile { display: none; }
        }
        @media (max-width: 768px) {
           section#about { padding: 1.5rem 0 !important; }
        }
      `}</style>
        </section>
    );
};

export default About;
