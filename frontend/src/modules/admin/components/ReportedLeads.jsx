import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFlag, FaCheckCircle, FaSearch, FaFilter } from 'react-icons/fa';
import { adminAPI } from '../../shared/utils/api';
import toast from 'react-hot-toast';

const REASON_LABELS = {
  wrong_item: 'Wrong item',
  wrong_address: 'Wrong address',
  not_available: 'Not available',
  customer_not_available: 'Customer not available',
  other: 'Other'
};

const ReportedLeads = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = `page=${page}&limit=20${statusFilter ? `&status=${statusFilter}` : ''}`;
      const res = await adminAPI.getReportedLeads(`?${query}`);
      if (res.success) {
        setReports(res.data.reports || []);
        setTotalPages(res.data.pagination?.pages || 1);
      } else {
        toast.error(res.message || 'Failed to load reported leads');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to load reported leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, page]);

  const handleMarkReviewed = async (reportId) => {
    try {
      const res = await adminAPI.markReportedLeadReviewed(reportId);
      if (res.success) {
        toast.success('Marked as reviewed');
        fetchData();
      } else {
        toast.error(res.message || 'Failed');
      }
    } catch (err) {
      toast.error(err.message || 'Failed');
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleString() : '—');
  const addressStr = (addr) => {
    if (!addr) return '—';
    const parts = [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean);
    return parts.length ? parts.join(', ') : '—';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FaFlag className="text-amber-600" /> Reported Fake Leads
          </h1>
          <p className="text-slate-500 text-sm">
            Leads reported by scrappers (wrong item, wrong address, not available, etc.)
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
          <FaFilter className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-transparent text-sm outline-none"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-slate-100">
          <FaFlag className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-700">No reported leads</h3>
          <p className="text-slate-500 mt-1">Reports from scrappers will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="p-3 font-semibold">Order / User</th>
                  <th className="p-3 font-semibold">Scrapper</th>
                  <th className="p-3 font-semibold">Reason</th>
                  <th className="p-3 font-semibold">Notes</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Reported At</th>
                  <th className="p-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <p className="font-medium text-slate-800">Order #{r.order?._id?.toString().slice(-6) || '—'}</p>
                        <p className="text-xs text-slate-500">{r.order?.user?.name} • {r.order?.user?.phone || '—'}</p>
                        <p className="text-xs text-slate-600 max-w-xs truncate">{addressStr(r.order?.pickupAddress)}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-slate-800">{r.scrapper?.name || '—'}</p>
                      <p className="text-xs text-slate-500">{r.scrapper?.phone} • {r.scrapper?.scrapperType || '—'}</p>
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-amber-700">{REASON_LABELS[r.reason] || r.reason}</span>
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">{r.notes || '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${r.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-500">{formatDate(r.createdAt)}</td>
                    <td className="p-3 text-right">
                      {r.status === 'pending' && (
                        <button
                          onClick={() => handleMarkReviewed(r._id)}
                          className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                        >
                          Mark reviewed
                        </button>
                      )}
                      {r.status === 'reviewed' && <span className="text-xs text-slate-400 italic">Reviewed</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex justify-center gap-2 text-sm">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
              <span className="px-3 py-1 text-slate-600">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportedLeads;
