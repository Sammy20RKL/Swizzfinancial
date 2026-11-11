import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaUser, FaFileAlt, FaCalendar, FaMoneyBill, FaPercent, FaUsers, FaCheckCircle, FaClock, FaInfoCircle } from "react-icons/fa";
import { Button } from "flowbite-react";

export default function LoanCaseDetailsDrawer({ open, loan, onClose }) {
  const [loading, setLoading] = useState(false);

  const fmt = (n) =>
    Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('disbursed')) return 'bg-green-100 text-green-800 border-green-200';
    if (s.includes('approved')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (s.includes('deferred')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (s.includes('pending')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (s.includes('cleared')) return 'bg-gray-100 text-gray-800 border-gray-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const getGuarantorStatusColor = (status) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('approved')) return 'bg-green-100 text-green-800';
    if (s.includes('pending')) return 'bg-yellow-100 text-yellow-800';
    if (s.includes('rejected')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-600';
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === '0001-01-01T00:00:00') return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  if (!loan) return null;

  // Use guarantors from the loan object directly
  const guarantors = loan.guarantors || [];
  const member = loan.member || {};

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed top-0 right-0 h-full w-full max-w-3xl bg-white shadow-2xl z-50 overflow-y-auto"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">Loan Case Details</h2>
                  <p className="text-indigo-200 text-sm mt-1">
                    Case #{loan.caseNumber || loan.PaddedCaseNumber || 'N/A'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Loan Status Banner */}
              <div className={`p-4 rounded-lg border-2 ${getStatusColor(loan.statusDescription || loan.LoanStatus)}`}>
                <div className="flex items-center gap-3">
                  <FaInfoCircle className="text-lg" />
                  <div>
                    <p className="font-semibold">Status: {loan.statusDescription || loan.LoanStatus || 'Unknown'}</p>
                    <p className="text-sm opacity-75">
                      {loan.statusDescription?.toLowerCase().includes('disbursed') 
                        ? 'This loan has been disbursed to the member'
                        : loan.statusDescription?.toLowerCase().includes('approved')
                        ? 'This loan has been approved and is awaiting disbursement'
                        : loan.statusDescription?.toLowerCase().includes('deferred')
                        ? 'This loan has been deferred and is pending further review'
                        : 'Loan status information'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Member Information */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <FaUser className="text-indigo-600" /> Member Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Full Name</p>
                    <p className="font-medium text-gray-800">{member.fullName || loan.CustomerIndividualFirstName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Member Number</p>
                    <p className="font-medium text-gray-800 font-mono">{member.memberNumber || loan.CustomerIndividualMemberNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ID Number</p>
                    <p className="font-medium text-gray-800 font-mono">{member.idNumber || loan.CustomerIndividualIdentityCardNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Mobile</p>
                    <p className="font-medium text-gray-800">{member.mobile || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium text-gray-800">{member.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Registration Date</p>
                    <p className="font-medium text-gray-800">{formatDate(member.registrationDate)}</p>
                  </div>
                </div>
              </div>

              {/* Loan Details */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <FaFileAlt className="text-indigo-600" /> Loan Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Product</p>
                    <p className="font-medium text-gray-800">{loan.loanProductName || loan.LoanProductDescription || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Product Code</p>
                    <p className="font-medium text-gray-800 font-mono">{loan.loanProductCode || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Case Number</p>
                    <p className="font-medium text-gray-800 font-mono">#{loan.caseNumber || loan.PaddedCaseNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Loan Reference</p>
                    <p className="font-medium text-gray-800 font-mono">{loan.loanReference || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Amount Applied</p>
                    <p className="font-medium text-gray-800">KES {fmt(loan.amountApplied || loan.AmountApplied || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Approved Amount</p>
                    <p className="font-medium text-gray-800">KES {fmt(loan.approvedAmount || loan.ApprovedAmount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Disbursed Amount</p>
                    <p className="font-medium text-gray-800">KES {fmt(loan.disbursedAmount || loan.DisbursedAmount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Balance</p>
                    <p className={`font-bold ${Number(loan.totalLoansBalance || loan.TotalLoansBalance || 0) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      KES {fmt(loan.totalLoansBalance || loan.TotalLoansBalance || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Payback</p>
                    <p className="font-medium text-gray-800">KES {fmt(loan.totalPayback || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Interest</p>
                    <p className="font-medium text-gray-800">KES {fmt(loan.totalInterest || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Monthly Payback</p>
                    <p className="font-medium text-gray-800">KES {fmt(loan.monthlyPayback || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Term (Months)</p>
                    <p className="font-medium text-gray-800">{loan.termMonths || 0} months</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Interest Rate (APR)</p>
                    <p className="font-medium text-gray-800">{loan.apr || loan.LoanInterestAnnualPercentageRate || 0}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Guarantor Count</p>
                    <p className="font-medium text-gray-800">{loan.guarantorCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Guaranteed</p>
                    <p className="font-medium text-gray-800">KES {fmt(loan.totalGuaranteed || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <FaCalendar className="text-indigo-600" /> Important Dates
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Application Date</p>
                    <p className="font-medium text-gray-800">{formatDate(loan.applicationDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Approved Date</p>
                    <p className="font-medium text-gray-800">{formatDate(loan.approvedDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Audited Date</p>
                    <p className="font-medium text-gray-800">{formatDate(loan.auditedDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Disbursed Date</p>
                    <p className="font-medium text-gray-800">{formatDate(loan.disbursedDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created Date</p>
                    <p className="font-medium text-gray-800">{formatDate(loan.createdDate)}</p>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {loan.remarks && (
                <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-200">
                  <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                    <FaInfoCircle /> Remarks
                  </h3>
                  <p className="text-gray-700">{loan.remarks}</p>
                </div>
              )}

              {/* Guarantors */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <FaUsers className="text-indigo-600" /> Guarantors ({guarantors.length})
                </h3>
                {guarantors.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">No guarantors for this loan</p>
                ) : (
                  <div className="space-y-3">
                    {guarantors.map((guarantor, index) => (
                      <div key={guarantor.guarantorId || index} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-800">{guarantor.fullName}</p>
                            <p className="text-sm text-gray-500">Member #{guarantor.memberNumber}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getGuarantorStatusColor(guarantor.statusDescription)}`}>
                            {guarantor.statusDescription || 'Unknown'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <div>
                            <span className="text-gray-500">ID:</span>
                            <span className="ml-1 text-gray-700 font-mono">{guarantor.idNumber || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Mobile:</span>
                            <span className="ml-1 text-gray-700">{guarantor.mobile || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Amount Guaranteed:</span>
                            <span className="ml-1 text-gray-700 font-semibold">KES {fmt(guarantor.amountGuaranteed)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Amount Pledged:</span>
                            <span className="ml-1 text-gray-700 font-semibold">KES {fmt(guarantor.amountPledged)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={onClose}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Close
                </Button>
                {loan.loanCaseId && (
                  <Button
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => {
                      // Navigate to schedule or other action
                      onClose();
                    }}
                  >
                    View Schedule
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}