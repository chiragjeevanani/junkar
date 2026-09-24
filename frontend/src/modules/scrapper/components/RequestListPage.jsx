import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { scrapperOrdersAPI } from '../../shared/utils/api';
import ScrapperBottomNav from './ScrapperBottomNav';

const RequestListPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null); // order to show in detail modal

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Get scrapper's current location to fetch only nearby requests (10km radius)
      let queryParams = '';
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { 
              timeout: 5000, 
              maximumAge: 60000 
            });
          });
          queryParams = `lat=${position.coords.latitude}&lng=${position.coords.longitude}`;
        } catch (geoErr) {
          console.warn('Geolocation failed, fetching all available orders:', geoErr);
        }
      }

      const response = await scrapperOrdersAPI.getAvailable(queryParams);
      const list = response?.data?.orders || response?.orders || [];
      setOrders(list);
    } catch (err) {
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Refresh every 15s
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenOnMap = (orderId) => {
    // Navigate to active-requests map page; pass orderId so map can highlight it
    navigate(`/scrapper/active-requests?highlight=${orderId}`);
  };

  const formatAddress = (pickupAddress) => {
    if (!pickupAddress) return 'Location not available';
    const parts = [pickupAddress.street, pickupAddress.city].filter(Boolean);
    return parts.join(', ') || 'Location on Map';
  };

  const formatTime = (order) => {
    if (order.pickupSlot) {
      return `${order.pickupSlot.dayName || ''} ${order.pickupSlot.date || ''} • ${order.pickupSlot.slot || ''}`.trim();
    }
    return order.preferredTime || 'Time not specified';
  };

  const capitalizeFirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">New Requests</h1>
            <p className="text-xs text-gray-500">
              {loading ? 'Refreshing...' : `${orders.length} available near you`}
            </p>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center hover:bg-emerald-100 transition-colors"
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              className={`text-emerald-600 ${loading ? 'animate-spin' : ''}`}
            >
              <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 pb-24">
        {loading && orders.length === 0 ? (
          /* Skeleton Loader */
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-12" />
                </div>
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-10 bg-gray-100 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-gray-600 font-medium">{error}</p>
            <button
              onClick={fetchOrders}
              className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl font-semibold text-sm"
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-gray-700 font-semibold text-lg mb-1">No new requests</h3>
            <p className="text-gray-400 text-sm">New scrap pickup requests will appear here</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {orders.map((order, idx) => {
                const orderId = order._id || order.id;
                const reqId = `REQ-${orderId.toString().slice(-6).toUpperCase()}`;
                const category = Array.isArray(order.scrapItems)
                  ? order.scrapItems.map(i => i.category).join(', ')
                  : 'Scrap';

                return (
                  <motion.div
                    key={orderId}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    {/* Card Top */}
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-700 font-bold text-sm">
                            {(order.user?.name || 'U')[0].toUpperCase()}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 truncate text-sm">
                              {order.user?.name || 'Customer'}
                            </p>
                            {order.isDonation && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">
                                🎁 Donation
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate">{category}</p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-emerald-600 text-sm">₹{order.totalAmount || 0}</p>
                          <p className="text-[10px] text-gray-400">{reqId}</p>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="flex items-start gap-2 mb-3 bg-gray-50 rounded-xl p-2.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gray-400 mt-0.5 flex-shrink-0">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" />
                        </svg>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {formatAddress(order.pickupAddress)}
                        </p>
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-500">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        {formatTime(order)}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {/* View Request Detail Button */}
                        <button
                          onClick={() => setDetailOrder(order)}
                          className="flex-1 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-blue-100 active:scale-95 transition-all"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                          </svg>
                          View Detail
                        </button>
                        {/* View on Map Button */}
                        <button
                          onClick={() => handleOpenOnMap(orderId)}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-emerald-700 active:scale-95 transition-all"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                            <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-10l6 3m0 10l4.553 2.276A1 1 0 0021 21.382V10.618a1 1 0 00-.553-.894L15 7m0 13V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Map &amp; Accept
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* ========== Request Detail Bottom Sheet Modal ========== */}
      <AnimatePresence>
        {detailOrder && (() => {
          const o = detailOrder;
          const orderId = o._id || o.id;
          const reqId = `REQ-${orderId.toString().slice(-6).toUpperCase()}`;

          return (
            <>
              {/* Backdrop */}
              <motion.div
                key="detail-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setDetailOrder(null)}
              />

              {/* Bottom Sheet */}
              <motion.div
                key="detail-sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl"
              >
                {/* Handle Bar */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-gray-300" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Request Detail</h2>
                    <p className="text-[11px] text-gray-400">{reqId}</p>
                  </div>
                  <button
                    onClick={() => setDetailOrder(null)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

                  {/* Customer Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-700 font-bold text-base">
                        {(o.user?.name || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{o.user?.name || 'Customer'}</p>
                      <p className="text-xs text-gray-400">{o.user?.phone || ''}</p>
                    </div>
                    <div className="text-right">
                      {o.isDonation ? (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-bold">🎁 Donation</span>
                      ) : (
                        <p className="font-bold text-emerald-600 text-lg">₹{o.totalAmount || 0}</p>
                      )}
                    </div>
                  </div>

                  {/* ---- Scrap Items Detail ---- */}
                  <div className="bg-gray-50 rounded-2xl p-3.5">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2.5">📦 Items Detail</h3>
                    <div className="space-y-2.5">
                      {Array.isArray(o.scrapItems) && o.scrapItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100">
                          {/* Item Icon */}
                          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                            <span className="text-base">
                              {item.category === 'plastic' ? '♻️' :
                               item.category === 'metal' ? '🔩' :
                               item.category === 'paper' || item.category === 'raddi' ? '📄' :
                               item.category === 'electronic' || item.category === 'e_waste' ? '💻' :
                               item.category === 'glass' ? '🪟' :
                               item.category === 'furniture' ? '🪑' :
                               item.category === 'vehicle_scrap' ? '🚗' :
                               item.category === 'home_appliance' ? '🏠' :
                               item.category === 'scrap_iron' ? '⚙️' : '📦'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm truncate">
                              {item.name || capitalizeFirst(item.category)}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.pricingType === 'negotiable' ? (
                                <span className="text-[11px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded font-medium">🤝 Negotiable</span>
                              ) : (
                                <>
                                  {item.weight > 0 && (
                                    <span className="text-[11px] text-gray-400">{item.weight} kg</span>
                                  )}
                                  {item.rate > 0 && (
                                    <span className="text-[11px] text-gray-400">@ ₹{item.rate}/kg</span>
                                  )}
                                </>
                              )}
                              {item.itemCondition && (
                                <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                                  item.itemCondition === 'good' ? 'bg-green-50 text-green-700' :
                                  item.itemCondition === 'average' ? 'bg-yellow-50 text-yellow-700' :
                                  'bg-red-50 text-red-700'
                                }`}>
                                  {capitalizeFirst(item.itemCondition)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {item.pricingType === 'negotiable' ? (
                              <p className="text-sm font-bold text-amber-600">
                                {item.expectedPrice ? `₹${item.expectedPrice}` : '—'}
                              </p>
                            ) : (
                              <p className="text-sm font-bold text-emerald-600">₹{item.total || 0}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total row */}
                    {!o.isDonation && (
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-200">
                        <span className="text-xs font-bold text-gray-600 uppercase">Total Amount</span>
                        <span className="text-base font-extrabold text-emerald-600">₹{o.totalAmount || 0}</span>
                      </div>
                    )}
                  </div>

                  {/* ---- Photos ---- */}
                  {Array.isArray(o.images) && o.images.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">📷 Photos</h3>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {o.images.map((img, idx) => (
                          <div key={idx} className="flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                            <img
                              src={img.url}
                              alt={`Scrap photo ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ---- Pickup Info ---- */}
                  <div className="bg-gray-50 rounded-2xl p-3.5 space-y-2.5">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">📍 Pickup Info</h3>
                    {/* Address */}
                    <div className="flex items-start gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-red-400 mt-0.5 flex-shrink-0">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" />
                      </svg>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {formatAddress(o.pickupAddress)}
                        {o.pickupAddress?.state && `, ${o.pickupAddress.state}`}
                        {o.pickupAddress?.pincode && ` - ${o.pickupAddress.pincode}`}
                      </p>
                    </div>
                    {/* Time */}
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-blue-400 flex-shrink-0">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <p className="text-xs text-gray-700">{formatTime(o)}</p>
                    </div>
                    {/* Quantity Type */}
                    {o.quantityType && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📏</span>
                        <p className="text-xs text-gray-700">Quantity: <span className="font-semibold capitalize">{o.quantityType}</span></p>
                      </div>
                    )}
                  </div>

                  {/* ---- Notes ---- */}
                  {o.notes && o.notes.trim() && (
                    <div className="bg-yellow-50 rounded-2xl p-3.5 border border-yellow-100">
                      <h3 className="text-xs font-bold text-yellow-700 uppercase tracking-wide mb-1">📝 Notes</h3>
                      <p className="text-xs text-yellow-800 leading-relaxed">{o.notes}</p>
                    </div>
                  )}
                </div>

                {/* Bottom Action */}
                <div className="px-5 py-4 border-t border-gray-100 bg-white flex gap-3">
                  <button
                    onClick={() => {
                      const oid = o._id || o.id;
                      setDetailOrder(null);
                      handleOpenOnMap(oid);
                    }}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-10l6 3m0 10l4.553 2.276A1 1 0 0021 21.382V10.618a1 1 0 00-.553-.894L15 7m0 13V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Map &amp; Accept
                  </button>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* Bottom Nav */}
      <ScrapperBottomNav />
    </div>
  );
};

export default RequestListPage;
