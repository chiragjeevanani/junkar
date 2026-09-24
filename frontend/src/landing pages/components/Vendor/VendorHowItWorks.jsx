import { UserPlus, CheckCircle, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const VendorHowItWorks = () => {
    const { getTranslatedText } = usePageTranslation([
        "The Process", "HOW TO START?", "Three simple steps to join our network and grow your scrap business.",
        "Register as Vendor", "Create your account and complete the verification process.",
        "Get Approved", "Our team will verify your details and activate your profile.",
        "Receive Pickup Requests", "Start getting nearby scrap pickup notifications on your dashboard."
    ]);

    const steps = [
        {
            title: 'Register as Vendor',
            desc: 'Create your account and complete the verification process.',
            icon: <UserPlus size={32} />
        },
        {
            title: 'Get Approved',
            desc: 'Our team will verify your details and activate your profile.',
            icon: <CheckCircle size={32} />
        },
        {
            title: 'Receive Pickup Requests',
            desc: 'Start getting nearby scrap pickup notifications on your dashboard.',
            icon: <Smartphone size={32} />
        }
    ];

    return (
        <section id="how-it-works" className="section vendor-how-it-works">
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
                <div className="section-header" style={{ textAlign: 'center' }}>
                    <span className="section-tag" style={{ color: '#059669', display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>{getTranslatedText("The Process")}</span>
                    <h2 className="section-title" style={{ fontWeight: 800, color: '#1e293b' }}>{getTranslatedText("HOW TO START?")}</h2>
                    <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>{getTranslatedText("Three simple steps to join our network and grow your scrap business.")}</p>
                </div>

                <div className="steps-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '2.5rem',
                    position: 'relative'
                }}>
                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            className="step-card-modern"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.2 }}
                            style={{
                                textAlign: 'center',
                                background: 'white',
                                padding: '3.5rem 2rem',
                                borderRadius: '24px',
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                                border: '1px solid #f1f5f9',
                                position: 'relative',
                                zIndex: 1,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                            whileHover={{ y: -10, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', borderColor: '#10b981' }}
                        >
                            <div className="step-number-badge" style={{
                                position: 'absolute',
                                top: '-20px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#10b981',
                                width: '45px',
                                height: '45px',
                                borderRadius: '50%',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '1.25rem',
                                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)'
                            }}>
                                {i + 1}
                            </div>

                            <div className="icon-wrapper" style={{
                                width: '80px',
                                height: '80px',
                                background: '#f0fdf4',
                                color: '#059669',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                                transition: 'all 0.3s ease'
                            }}>
                                {step.icon}
                            </div>

                            <h3 className="step-title" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#1e293b' }}>{getTranslatedText(step.title)}</h3>
                            <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.6 }}>{getTranslatedText(step.desc)}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            <style>{`
                .vendor-how-it-works { padding: 6rem 0; }
                .vendor-how-it-works .section-header { margin-bottom: 4rem; }
                .vendor-how-it-works .section-title { fontSize: 3rem; marginBottom: 1rem; }
                
                .step-card-modern:hover .icon-wrapper {
                    background: #10b981 !important;
                    color: white !important;
                    transform: rotate(12deg);
                }
                @media (max-width: 768px) {
                    .vendor-how-it-works { padding: 1.5rem 0 !important; }
                    .vendor-how-it-works .section-header { margin-bottom: 1.5rem !important; }
                    .vendor-how-it-works .section-title { font-size: 2rem !important; margin-bottom: 0.5rem !important; }
                    .vendor-how-it-works .steps-grid { gap: 1.5rem !important; padding-top: 1rem !important; }
                    .step-card-modern { padding: 2.5rem 1.5rem !important; }
                }
            `}</style>
        </section>
    );
};

export default VendorHowItWorks;
