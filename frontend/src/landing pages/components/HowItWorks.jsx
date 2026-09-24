import { motion } from 'framer-motion';
import { MousePointerClick, CalendarCheck, Truck, Wallet } from 'lucide-react';
import { usePageTranslation } from '../../hooks/usePageTranslation';

const steps = [
    {
        title: 'Select Scrap Type',
        desc: 'Choose from various categories like plastic, metal, electronics, etc.',
        icon: <MousePointerClick size={32} />
    },
    {
        title: 'Schedule Pickup',
        desc: 'Pick a date and time that works best for you.',
        icon: <CalendarCheck size={32} />
    },
    {
        title: 'Doorstep Collection',
        desc: 'Our verified scrapper will arrive at your location for collection.',
        icon: <Truck size={32} />
    },
    {
        title: 'Get Paid Instantly',
        desc: 'Receive immediate payment via cash or UPI after weighing.',
        icon: <Wallet size={32} />
    }
];

const HowItWorks = () => {
    const { getTranslatedText } = usePageTranslation([
        "Process", "HOW IT WORKS", "Four simple steps to turn your junk into cash and help the environment.",
        "Select Scrap Type", "Choose from various categories like plastic, metal, electronics, etc.",
        "Schedule Pickup", "Pick a date and time that works best for you.",
        "Doorstep Collection", "Our verified scrapper will arrive at your location for collection.",
        "Get Paid Instantly", "Receive immediate payment via cash or UPI after weighing."
    ]);

    return (
        <section id="how-it-works" className="section" style={{ background: '#f8fafc' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
                <div className="section-header" style={{ textAlign: 'center' }}>
                    <span className="section-tag" style={{ color: 'var(--primary)', display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>{getTranslatedText("Process")}</span>
                    <h2 className="section-title" style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem', color: '#1e293b' }}>{getTranslatedText("HOW IT WORKS")}</h2>
                    <p style={{ color: '#64748b', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>{getTranslatedText("Four simple steps to turn your junk into cash and help the environment.")}</p>
                </div>

                <div className="steps-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '2rem',
                    position: 'relative'
                }}>
                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            className="step-card-modern-user"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15 }}
                            style={{
                                textAlign: 'center',
                                background: 'white',
                                padding: '3rem 1.5rem',
                                borderRadius: '24px',
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                                border: '1px solid #f1f5f9',
                                position: 'relative',
                                zIndex: 1,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                            whileHover={{ y: -10, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', borderColor: 'var(--primary)' }}
                        >
                            <div className="step-number-badge" style={{
                                position: 'absolute',
                                top: '-20px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'var(--primary)',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.4)'
                            }}>
                                {i + 1}
                            </div>

                            <div className="icon-wrapper" style={{
                                width: '70px',
                                height: '70px',
                                background: '#f0f9ff',
                                color: 'var(--primary)',
                                borderRadius: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                                transition: 'all 0.3s ease'
                            }}>
                                {step.icon}
                            </div>

                            <h3 className="step-title" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.8rem', color: '#1e293b' }}>{getTranslatedText(step.title)}</h3>
                            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>{getTranslatedText(step.desc)}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            <style>{`
                .step-card-modern-user:hover .icon-wrapper {
                    background: var(--primary) !important;
                    color: white !important;
                    transform: rotate(12deg);
                }
                @media (max-width: 768px) {
                    section#how-it-works { padding: 1rem 0 !important; }
                    section#how-it-works .section-header { margin-bottom: 1.5rem !important; }
                    .section-title { font-size: 2.25rem !important; }
                }
            `}</style>
        </section>
    );
};

export default HowItWorks;
