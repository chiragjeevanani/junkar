import { TrendingUp, ArrowUpRight } from 'lucide-react';
import { usePageTranslation } from '../../hooks/usePageTranslation';

const prices = [
    { material: 'Plastic', price: '₹55/kg', trend: '+2%' },
    { material: 'Metal', price: '₹60/kg', trend: '+1.5%' },
    { material: 'Paper', price: '₹20/kg', trend: '+0.5%' },
    { material: 'Electronics', price: '₹100/kg', trend: '+5%' },
    { material: 'Copper', price: '₹50/kg', trend: '+3%' },
    { material: 'Aluminium', price: '₹180/kg', trend: '+2.5%' },
    { material: 'Steel', price: '₹15/kg', trend: '+1%' },
    { material: 'Brass', price: '₹350/kg', trend: '+4%' },
];

const LivePrices = () => {
    const { getTranslatedText } = usePageTranslation([
        "Live Market Rates", "Plastic", "Metal", "Paper", "Electronics", "Copper", "Aluminium", "Steel", "Brass"
    ]);

    return (
        <div className="market-prices">
            <div className="container">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
                    <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '0.05em' }}>{getTranslatedText("Live Market Rates")}</span>
                </div>
            </div>

            <div className="price-ticker-container">
                <div className="price-ticker">
                    {[...prices, ...prices].map((item, i) => (
                        <div key={i} className="price-card">
                            <TrendingUp size={16} color="#10b981" />
                            <span className="price-label">{getTranslatedText(item.material)}</span>
                            <span className="price-value">{item.price}</span>
                            <span className="price-trend">
                                <ArrowUpRight size={14} />
                                {item.trend}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
        </div>
    );
};

export default LivePrices;
