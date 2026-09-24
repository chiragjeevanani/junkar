import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const UserBottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Helper to determine if a path is active
    const isActive = (path) => {
        if (path === '/user' && location.pathname === '/user') return true;
        if (path !== '/user' && location.pathname.startsWith(path)) return true;
        return false;
    };

    const { getTranslatedText } = usePageTranslation(['Home', 'Price', 'Sell', 'Refer', 'Profile']);

    return (
        <div className="fixed md:hidden bottom-0 left-0 right-0 z-[9999]">
            {/* Background Container - Black */}
            <div className="absolute inset-0 bg-black border-t border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"></div>

            <div className="relative flex justify-between items-end pb-2 pt-2 px-4">
                {/* Home Tab */}
                <div
                    className="flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform duration-200 py-2"
                    onClick={() => navigate('/user')}
                >
                    <div className={`p-1.5 rounded-xl transition-colors duration-300 ${isActive('/user') ? 'bg-gray-800 text-sky-300' : 'text-gray-400 hover:text-sky-300'}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                    </div>
                    <span className={`text-[10px] font-semibold tracking-wide ${isActive('/user') ? 'text-sky-300' : 'text-gray-400'}`}>{getTranslatedText('Home')}</span>
                </div>

                {/* Price Tab */}
                <div
                    className="flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform duration-200 py-2"
                    onClick={() => navigate('/user/prices')}
                >
                    <div className={`p-1.5 rounded-xl transition-colors duration-300 ${isActive('/user/prices') ? 'bg-gray-800 text-sky-300' : 'text-gray-400 hover:text-sky-300'}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                            <line x1="7" y1="7" x2="7.01" y2="7"></line>
                        </svg>
                    </div>
                    <span className={`text-[10px] font-semibold tracking-wide ${isActive('/user/prices') ? 'text-sky-300' : 'text-gray-400'}`}>{getTranslatedText('Price')}</span>
                </div>

                {/* Center Action Button (Floating) - SELL */}
                <div className="flex-1 flex flex-col items-center justify-end relative z-10 -top-5 group"
                    onClick={() => navigate('/user/add-scrap/category')}>
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/30 transform group-active:scale-95 transition-all duration-300 border-4 border-black">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white transform group-hover:rotate-180 transition-transform duration-500">
                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="text-[10px] font-bold text-sky-300 mt-1 tracking-wide">{getTranslatedText('Sell')}</span>
                </div>

                {/* Refer Tab */}
                <div
                    className="flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform duration-200 py-2"
                    onClick={() => navigate('/user/refer-earn')}
                >
                    <div className={`p-1.5 rounded-xl transition-colors duration-300 ${isActive('/user/refer-earn') ? 'bg-gray-800 text-sky-300' : 'text-gray-400 hover:text-sky-300'}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 12 20 22 4 22 4 12"></polyline>
                            <rect x="2" y="7" width="20" height="5"></rect>
                            <line x1="12" y1="22" x2="12" y2="7"></line>
                            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                        </svg>
                    </div>
                    <span className={`text-[10px] font-semibold tracking-wide ${isActive('/user/refer-earn') ? 'text-sky-300' : 'text-gray-400'}`}>{getTranslatedText('Refer')}</span>
                </div>

                {/* Profile Tab */}
                <div
                    className="flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform duration-200 py-2"
                    onClick={() => navigate('/user/my-profile')}
                >
                    <div className={`p-1.5 rounded-xl transition-colors duration-300 ${isActive('/user/my-profile') ? 'bg-gray-800 text-sky-300' : 'text-gray-400 hover:text-sky-300'}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>
                    <span className={`text-[10px] font-semibold tracking-wide ${isActive('/user/my-profile') ? 'text-sky-300' : 'text-gray-400'}`}>{getTranslatedText('Profile')}</span>
                </div>
            </div>
        </div>
    );
};

export default UserBottomNav;

