import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMapMarkerAlt, FaSearch, FaFilter, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { adminAPI } from '../../shared/utils/api';
import toast from 'react-hot-toast';

const AddressChangeRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ address: '', coordinates: '' });
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParts = [`page=${page}`, 'limit=20'];
      if (statusFilter && statusFilter !== 'all') queryParts.push(`status=${statusFilter}`);
      if (search.trim()) queryParts.push(`q=${encodeURIComponent(search.trim())}`);
      const query = queryParts.join('&');
      const res = await adminAPI.getAddressChangeRequests(`?${query}`);
      if (res.success) {
        setRequests(res.data.requests || []);
        setTotalPages(res.data.pagination?.pages || 1);
      } else {
        toast.error(res.message || 'Failed to load requests');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  const openModal = (req, mode = 'approve') => {
    setSelected({ ...req, mode });
    setForm({
      address: req.requestedAddress || req.scrapper?.businessLocation?.address || '',
      coordinates: req.requestedCoordinates?.length === 2
        ? `${req.requestedCoordinates[1]}, ${req.requestedCoordinates[0]}`
        : ''
    });
  };

  const handleApprove = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      let coords = selected.requestedCoordinates || [0, 0];
      if (form.coordinates.trim()) {
        const parts = form.coordinates.split(',').map(p => Number(p.trim()));
        if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
          coords = [parts[1], parts[0]]; // [lng, lat]
        }
      }

      const res = await adminAPI.approveAddressChangeRequest(selected._id, {
        address: form.address.trim(),
        coordinates: coords
      });
      if (res.success) {
        toast.success('Address updated successfully');
        setSelected(null);
        fetchData();
      } else {
        toast.error(res.message || 'Failed to approve');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to approve');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selected || !form.address.trim()) return;
    setProcessing(true);
    try {
      const res = await adminAPI.rejectAddressChangeRequest(selected._id, {
        reason: form.address.trim()
      });
      if (res.success) {
        toast.success('Request rejected');
        setSelected(null);
        fetchData();
      } else {
        toast.error(res.message || 'Failed to reject');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to reject');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FaMapMarkerAlt className="text-emerald-600" /> Address Change Requests
          </h1>
          <p className="text-slate-500 text-sm">
            Review and update business locations for dukandaar / wholesaler scrappers.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
            <FaSearch className="text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); fetchData(); } }}
              placeholder="Search by name / phone / address"
              className="outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
            <FaFilter className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-transparent text-sm outline-none"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-slate-100">
          <FaMapMarkerAlt className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-700">No address change requests</h3>
          <p className="text-slate-500 mt-1">New requests will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="p-3 font-semibold">Scrapper</th>
                  <th className="p-3 font-semibold">Current Address</th>
                  <th className="p-3 font-semibold">Requested Address</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Requested At</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-800">
                          {req.scrapper?.name || 'N/A'}
                        </p>
                        <p className="text-xs text-slate-500">
                          📱 {req.scrapper?.phone || '—'} • {req.scrapper?.scrapperType || '—'}
                        </p>
                      </div>
                    </td>
                    <td className="p-3 text-xs text-slate-600 max-w-xs">
                      {req.scrapper?.businessLocation?.address || '—'}
                    </td>
                    <td className="p-3 text-xs text-slate-700 max-w-xs">
                      {req.requestedAddress || '—'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                          ${req.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : req.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-500">
                      {formatDate(req.createdAt)}
                    </td>
                    <td className="p-3 text-right">
                      {req.status === 'pending' ? (
                        <div className="inline-flex gap-2">
                          <button
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                            title="Approve and update address"
                            onClick={() => openModal(req, 'approve')}
                          >
                            <FaCheckCircle size={18} />
                          </button>
                          <button
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                            title="Reject"
                            onClick={() => openModal(req, 'reject')}
                          >
                            <FaTimesCircle size={18} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Action taken
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex justify-center gap-2 text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <span className="px-3 py-1 text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Approve / Reject Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4"
            >
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FaMapMarkerAlt className={selected.mode === 'approve' ? 'text-emerald-600' : 'text-red-600'} />
                {selected.mode === 'approve' ? 'Approve & Update Address' : 'Reject Address Change'}
              </h2>

              <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1 text-slate-600">
                <div className="flex justify-between gap-3">
                  <span className="font-semibold">Scrapper:</span>
                  <span>{selected.scrapper?.name} ({selected.scrapper?.phone})</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="font-semibold">Current:</span>
                  <span className="text-right">{selected.scrapper?.businessLocation?.address || '—'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="font-semibold">Requested:</span>
                  <span className="text-right">{selected.requestedAddress || '—'}</span>
                </div>
              </div>

              {selected.mode === 'approve' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Final Address</label>
                    <textarea
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                      rows={3}
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Coordinates (lat, lng) – optional
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                      placeholder="23.12345, 77.12345"
                      value={form.coordinates}
                      onChange={(e) => setForm((f) => ({ ...f, coordinates: e.target.value }))}
                    />
                    <p className="text-[11px] text-slate-500">
                      Keep empty to use requested coordinates. This helps Google Maps pin the shop exactly.
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Rejection Reason</label>
                  <textarea
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none"
                    rows={3}
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    placeholder="Reason for rejection..."
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 font-medium"
                  onClick={() => setSelected(null)}
                  disabled={processing}
                >
                  Cancel
                </button>
                {selected.mode === 'approve' ? (
                  <button
                    type="button"
                    className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-semibold disabled:opacity-60"
                    onClick={handleApprove}
                    disabled={processing || !form.address.trim()}
                  >
                    {processing ? 'Saving...' : 'Approve & Update'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="flex-1 py-2 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-60"
                    onClick={handleReject}
                    disabled={processing || !form.address.trim()}
                  >
                    {processing ? 'Saving...' : 'Reject Request'}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddressChangeRequests;

