import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaBolt, FaWallet, FaUser } from 'react-icons/fa';

const ScrapperBottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [scrapperType, setScrapperType] = React.useState('feri_wala');

    React.useEffect(() => {
        const user = JSON.parse(localStorage.getItem('scrapperUser') || '{}');
        setScrapperType(user.scrapperType || 'feri_wala');
    }, []);

    const navItems = [
        { id: 'home', icon: FaHome, label: 'Home', path: '/scrapper' },
        { id: 'active', icon: FaBolt, label: 'Request', path: '/scrapper/my-active-requests' },
        { id: 'wallet', icon: FaWallet, label: 'Wallet', path: '/scrapper/wallet' },
        { id: 'profile', icon: FaUser, label: 'Profile', path: '/scrapper/profile' },
    ];

    if (scrapperType === 'small' || scrapperType === 'feri_wala') {
        // Insert Sell button in the middle
        navItems.splice(2, 0, {
            id: 'sell',
            icon: () => <span className="text-2xl">➕</span>,
            label: 'Sell Scrap',
            path: '/scrapper/sell-scrap',
            isSpecial: true
        });
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 px-6 py-3 flex justify-between items-center z-50 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.5)]">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.id === 'home' && location.pathname === '/scrapper');

                return (
                    <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className={`flex flex-col items-center gap-1 w-16 ${item.isSpecial ? '-mt-6' : ''}`}
                    >
                        {item.isSpecial ? (
                            <div className="w-14 h-14 rounded-full bg-sky-500 shadow-lg flex items-center justify-center text-black border-4 border-black">
                                <item.icon />
                            </div>
                        ) : (
                            <div className={`text-xl mb-0.5 transition-colors ${isActive ? 'text-sky-400' : 'text-gray-500'}`}>
                                <item.icon />
                            </div>
                        )}

                        <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-sky-400' : 'text-gray-500'}`}>
                            {item.label}
                        </span>
                        {isActive && !item.isSpecial && (
                            <div className="absolute top-0 w-8 h-0.5 bg-sky-500 rounded-b-full" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default ScrapperBottomNav;
