import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Button } from "flowbite-react";
import LoanCaseDetailsDrawer from "./LoanCaseDetailsDrawer";
import LoanScheduleDrawer from "./LoanScheduleDrawer";
import { FaSearch, FaFilter, FaEye, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaExclamationTriangle, FaUser, FaMoneyBill, FaUsers, FaCheckCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function LoanRegister() {
  const [loans, setLoans] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [scheduleLoan, setScheduleLoan] = useState(null);
  const [openSchedule, setOpenSchedule] = useState(false);
  const [balanceStatus, setBalanceStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [transferringLoan, setTransferringLoan] = useState(null);
  const [showTransferPreview, setShowTransferPreview] = useState(false);
  const [transferPreviewData, setTransferPreviewData] = useState(null);
  const [transferRemarks, setTransferRemarks] = useState("");
  const [transferring, setTransferring] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Get unique products for filter
  const uniqueProducts = useMemo(() => {
    const products = loans.map(l => l.loanProductName).filter(Boolean);
    return [...new Set(products)];
  }, [loans]);

  // Get unique statuses for filter
  const uniqueStatuses = useMemo(() => {
    const statuses = loans.map(l => l.statusDescription).filter(Boolean);
    return [...new Set(statuses)];
  }, [loans]);

  useEffect(() => {
    fetchLoans();
  }, [currentPage, pageSize]);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const url = new URL(`${import.meta.env.VITE_APP_LOANING_URL}/api/Loaning/GetAllLoans`);
      url.searchParams.append('page', currentPage);
      url.searchParams.append('pageSize', pageSize);
      
      if (search) url.searchParams.append('search', search);
      if (statusFilter) url.searchParams.append('status', statusFilter);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setLoans(data.loans || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      } else {
        Swal.fire("Error", data.message || "Failed to load loans", "error");
      }
    } catch (error) {
      console.error("Error fetching loans:", error);
      Swal.fire("Error", "Failed to load loans", "error");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters on search/status change
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchLoans();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, statusFilter, productFilter]);

  const filtered = useMemo(() => {
    let result = loans;
    
    // Filter by product
    if (productFilter) {
      result = result.filter(l => l.loanProductName === productFilter);
    }
    
    // Filter by balance status
    if (balanceStatus) {
      result = result.filter(l => {
        const balance = Number(l.totalLoansBalance || 0);
        return balanceStatus === "cleared" ? balance <= 0 : balance > 0;
      });
    }
    
    return result;
  }, [loans, productFilter, balanceStatus]);

  const fmt = (n) =>
    Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('disbursed')) return 'bg-green-100 text-green-800';
    if (s.includes('approved')) return 'bg-blue-100 text-blue-800';
    if (s.includes('deferred')) return 'bg-yellow-100 text-yellow-800';
    if (s.includes('pending')) return 'bg-orange-100 text-orange-800';
    if (s.includes('cleared')) return 'bg-gray-100 text-gray-800';
    if (s.includes('unknown')) return 'bg-gray-100 text-gray-500';
    return 'bg-gray-100 text-gray-600';
  };

  const getBalanceColor = (balance) => {
    const b = Number(balance || 0);
    if (b <= 0) return 'text-green-600';
    if (b > 100000) return 'text-red-600';
    return 'text-orange-600';
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setProductFilter("");
    setBalanceStatus("");
    setCurrentPage(1);
  };

  // Transfer to Defaulters
  const handleTransferToDefaulters = async (loan) => {
    if (!loan.guarantors || loan.guarantors.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Guarantors',
        text: 'This loan has no guarantors to transfer to.',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    // Show preview
    const guarantors = loan.guarantors;
    const balance = Number(loan.totalLoansBalance || 0);
    const sharePerGuarantor = balance / guarantors.length;

    setTransferPreviewData({
      loan: loan,
      guarantors: guarantors,
      balance: balance,
      sharePerGuarantor: sharePerGuarantor,
    });
    setTransferringLoan(loan);
    setTransferRemarks("");
    setShowTransferPreview(true);
  };

  const confirmTransfer = async () => {
    if (!transferringLoan) return;
    
    setTransferring(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_APP_LOANING_URL}/api/Loaning/TransferToDefaulters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loanCaseId: transferringLoan.loanCaseId || transferringLoan.Id,
          transferredBy: localStorage.getItem('userName') || 'System User',
          remarks: transferRemarks || `Transferred to ${transferringLoan.guarantors?.length || 0} guarantor(s)`
        })
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Transfer Successful',
          html: `
            <div class="text-left">
              <p><strong>${data.message}</strong></p>
              <p class="mt-2">Original Loan: ${data.originalReference}</p>
              <p>Balance: KES ${fmt(data.originalBalance)}</p>
              <p>Guarantors: ${data.guarantorCount}</p>
              <p>Share per Guarantor: KES ${fmt(data.sharePerGuarantor)}</p>
              <div class="mt-3 border-t pt-3">
                <p class="font-semibold">Defaulter Loans Created:</p>
                ${data.defaulterLoansCreated.map(d => 
                  `<p class="text-sm">• ${d.guarantorName}: KES ${fmt(d.amountAssigned)} (Case #${d.caseNumber})</p>`
                ).join('')}
              </div>
            </div>
          `,
          confirmButtonColor: '#4f46e5',
          confirmButtonText: 'OK'
        });
        
        // Refresh loans
        fetchLoans();
        setShowTransferPreview(false);
        setTransferringLoan(null);
        setTransferPreviewData(null);
        setTransferRemarks("");
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Transfer Failed',
          text: data.message || 'An error occurred during transfer',
          confirmButtonColor: '#4f46e5'
        });
      }
    } catch (error) {
      console.error('Transfer error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Transfer Failed',
        text: error.message || 'An error occurred during transfer',
        confirmButtonColor: '#4f46e5'
      });
    } finally {
      setTransferring(false);
    }
  };

  // Transfer Preview Modal
  const TransferPreviewModal = () => {
    if (!showTransferPreview || !transferPreviewData) return null;

    const { loan, guarantors, balance, sharePerGuarantor } = transferPreviewData;

    return (
      <AnimatePresence>
        {showTransferPreview && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!transferring) setShowTransferPreview(false);
              }}
            />
            <motion.div
              className="fixed z-50 top-1/2 left-1/2 w-[95vw] max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
              initial={{ scale: 0.9, opacity: 0, y: "-50%", x: "-50%" }}
              animate={{ scale: 1, opacity: 1, y: "-50%", x: "-50%" }}
              exit={{ scale: 0.9, opacity: 0, y: "-50%", x: "-50%" }}
              style={{ transform: "translate(-50%, -50%)" }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-5 rounded-t-xl flex-shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <FaExclamationTriangle /> Transfer to Defaulters
                    </h3>
                    <p className="text-orange-100 text-sm mt-1">
                      Case #{loan.caseNumber || loan.PaddedCaseNumber} · {loan.loanProductName}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (!transferring) setShowTransferPreview(false);
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                    disabled={transferring}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm flex items-start gap-2">
                    <FaExclamationTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Warning:</strong> This action will transfer the outstanding loan balance 
                      to the guarantors as individual defaulter loans. This action cannot be undone.
                    </span>
                  </p>
                </div>

                {/* Loan Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-3">Loan Summary</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Member</p>
                      <p className="font-medium text-gray-800">{loan.member?.fullName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Member Number</p>
                      <p className="font-medium text-gray-800">{loan.member?.memberNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Outstanding Balance</p>
                      <p className="text-lg font-bold text-red-600">KES {fmt(balance)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Guarantors</p>
                      <p className="font-medium text-gray-800">{guarantors.length} guarantors</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Share per Guarantor</p>
                      <p className="font-semibold text-indigo-600">KES {fmt(sharePerGuarantor)}</p>
                    </div>
                  </div>
                </div>

                {/* Guarantors List */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FaUsers /> Guarantors ({guarantors.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {guarantors.map((g, idx) => (
                      <div key={g.guarantorId || idx} className="bg-white rounded-lg p-3 border border-gray-200 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">{g.fullName}</p>
                          <p className="text-xs text-gray-500">Member #{g.memberNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-red-600">KES {fmt(sharePerGuarantor)}</p>
                          <p className="text-xs text-gray-400">will be assigned</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Remarks (Optional)</label>
                  <textarea
                    value={transferRemarks}
                    onChange={(e) => setTransferRemarks(e.target.value)}
                    placeholder="e.g., Member has not paid for 6 months"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    rows={3}
                    disabled={transferring}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!transferring) setShowTransferPreview(false);
                  }}
                  disabled={transferring}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmTransfer}
                  disabled={transferring}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {transferring ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Transferring...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="mr-2" /> Confirm Transfer
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 m-5 rounded-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-xl shadow-lg p-6 max-w-7xl mx-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Loan Register</h1>
            <p className="text-indigo-200 text-sm mt-1">
              {totalCount > 0 ? `${totalCount} loans found` : 'Loading loans...'}
            </p>
          </div>
          <div className="flex gap-2">
            <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow p-4 max-w-7xl mx-auto mt-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by member name, ID, case number..."
              className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <FaFilter className="text-gray-500" />
            <span>Filters</span>
            {(statusFilter || productFilter || balanceStatus) && (
              <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">!</span>
            )}
          </button>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="w-32 p-3 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          >
            {[10, 20, 50, 100].map(size => (
              <option key={size} value={size}>{size} rows</option>
            ))}
          </select>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  >
                    <option value="">All Statuses</option>
                    {uniqueStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Product</label>
                  <select
                    value={productFilter}
                    onChange={(e) => setProductFilter(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  >
                    <option value="">All Products</option>
                    {uniqueProducts.map(product => (
                      <option key={product} value={product}>{product}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Balance</label>
                  <select
                    value={balanceStatus}
                    onChange={(e) => setBalanceStatus(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  >
                    <option value="">All Loans</option>
                    <option value="cleared">Cleared</option>
                    <option value="outstanding">Outstanding</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end mt-3">
                <button
                  onClick={clearFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow p-4 max-w-7xl mx-auto mt-4 overflow-x-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-500">Loading loans...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-400 text-lg">No loans found</p>
            <button
              onClick={clearFilters}
              className="mt-2 text-indigo-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left rounded-tl-lg">Case</th>
                    <th className="px-4 py-3 text-left">Member</th>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-right">Applied</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                    <th className="px-4 py-3 text-center">Rate %</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Guarantors</th>
                    <th className="px-4 py-3 text-center rounded-tr-lg">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((l, i) => (
                    <motion.tr
                      key={l.loanCaseId || l.Id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className={`border-b border-gray-100 hover:bg-indigo-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        #{l.caseNumber || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">
                          {l.member?.fullName || l.CustomerIndividualFirstName || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {l.member?.memberNumber || ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {l.member?.idNumber || l.CustomerIndividualIdentityCardNumber || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                          {l.loanProductName || l.LoanProductDescription || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {fmt(l.amountApplied || l.AmountApplied || 0)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${getBalanceColor(l.totalLoansBalance || l.TotalLoansBalance || 0)}`}>
                          {Number(l.totalLoansBalance || l.TotalLoansBalance || 0) <= 0 ? (
                            <span className="text-green-600">✓ Cleared</span>
                          ) : (
                            fmt(l.totalLoansBalance || l.TotalLoansBalance || 0)
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium">
                          {l.apr || l.LoanInterestAnnualPercentageRate || 0}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(l.statusDescription || l.LoanStatus)}`}>
                          {l.statusDescription || l.LoanStatus || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="flex items-center justify-center gap-1">
                          <FaUsers className="text-indigo-600" />
                          <span className="font-medium">{l.guarantorCount || 0}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          <button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors"
                            onClick={() => {
                              setSelectedLoan(l);
                              setOpenDrawer(true);
                            }}
                          >
                            <FaEye className="text-xs" /> Details
                          </button>
                          <button
                            className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setScheduleLoan(l);
                              setOpenSchedule(true);
                            }}
                          >
                            <FaCalendarAlt className="text-xs" /> Schedule
                          </button>
                          {Number(l.totalLoansBalance || 0) > 0 && l.guarantorCount > 0 && (
                            <button
                              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors"
                              onClick={() => handleTransferToDefaulters(l)}
                            >
                              <FaExclamationTriangle className="text-xs" /> Transfer
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * pageSize) + 1} – {Math.min(currentPage * pageSize, totalCount)} of {totalCount} loans
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-1"
                >
                  <FaChevronLeft className="text-xs" /> Previous
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-lg text-sm transition-colors ${currentPage === pageNum
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'hover:bg-gray-100'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-1"
                >
                  Next <FaChevronRight className="text-xs" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Drawers */}
      <LoanCaseDetailsDrawer
        open={openDrawer}
        loan={selectedLoan}
        onClose={() => setOpenDrawer(false)}
      />
      <LoanScheduleDrawer
        open={openSchedule}
        loan={scheduleLoan}
        onClose={() => setOpenSchedule(false)}
      />

      {/* Transfer Preview Modal */}
      <TransferPreviewModal />
    </div>
  );
}