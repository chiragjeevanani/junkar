import React from 'react';
import { motion } from 'framer-motion';
import { IdCard, FileText, Home, Camera } from 'lucide-react';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const VendorKYCChecklist = () => {
    const { getTranslatedText } = usePageTranslation([
        "Documents Required for Verification",
        "Keep these documents ready for a smooth registration process.",
        "Aadhar Card", "PAN Card", "Business Proof", "Live Selfie Image",
        "Identity Proof", "Tax Verification", "Shop/GST Image", "Identity Verification"
    ]);

    const documents = [
        {
            icon: <IdCard size={32} />,
            title: "Aadhar Card",
            desc: "Identity Proof",
            color: "#10b981"
        },
        {
            icon: <FileText size={32} />,
            title: "PAN Card",
            desc: "Tax Verification",
            color: "#059669"
        },
        {
            icon: <Home size={32} />,
            title: "Business Proof",
            desc: "Shop/GST Image",
            color: "#047857"
        },
        {
            icon: <Camera size={32} />,
            title: "Live Selfie Image",
            desc: "Identity Verification",
            color: "#065f46"
        }
    ];

    return (
        <section className="section kyc-checklist-section" style={{ background: 'white', padding: '5rem 0' }}>
            <div className="container">
                <div className="section-header" style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <span className="section-tag" style={{ color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{getTranslatedText("Transparency")}</span>
                    <h2 className="section-title" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b' }}>{getTranslatedText("Documents Required for Verification")}</h2>
                    <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>{getTranslatedText("Keep these documents ready for a smooth registration process.")}</p>
                </div>

                <div className="kyc-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '2rem'
                }}>
                    {documents.map((doc, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="kyc-card"
                            style={{
                                background: '#f8fafc',
                                padding: '2.5rem 2rem',
                                borderRadius: '24px',
                                textAlign: 'center',
                                border: '1px solid #f1f5f9',
                                transition: 'all 0.3s ease'
                            }}
                            whileHover={{ y: -10, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', background: '#f0fdf4' }}
                        >
                            <div className="kyc-icon-wrapper" style={{
                                width: '70px',
                                height: '70px',
                                background: 'white',
                                color: doc.color,
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                            }}>
                                {doc.icon}
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>{getTranslatedText(doc.title)}</h3>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>{getTranslatedText(doc.desc)}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .kyc-checklist-section { padding: 2rem 1.5rem !important; }
                    .kyc-checklist-section .section-header { margin-bottom: 2rem !important; }
                    .kyc-checklist-section .section-title { font-size: 1.75rem !important; text-align: center !important; }
                    .kyc-card { padding: 1.5rem !important; border-radius: 16px !important; }
                    .kyc-grid { 
                        display: flex !important;
                        flex-direction: column !important;
                        gap: 1rem !important; 
                    }
                    .kyc-icon-wrapper { width: 55px !important; height: 55px !important; margin-bottom: 1rem !important; }
                    .kyc-icon-wrapper svg { width: 24px !important; height: 24px !important; }
                }
            `}</style>
        </section>
    );
};

export default VendorKYCChecklist;
