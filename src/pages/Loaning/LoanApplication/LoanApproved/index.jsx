import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import NotFoundImage from "/assets/scopefinding.png";
import LoanDetailsDrawer from "./LoanDetailsDrawer";
import LoanGuarantorsDrawer from "./LoanGuarantorsDrawer";

function DisbursementModal({ open, preview, bankAccounts, onConfirm, onCancel, submitting }) {
  const [bankId, setBankId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setBankId(bankAccounts.length > 0 ? String(bankAccounts[0].Id) : "");
      setDate(new Date().toISOString().split("T")[0]);
      setError("");
    }
  }, [open, bankAccounts]);

  if (!open || !preview) return null;

  const handleConfirm = () => {
    if (!bankId) return setError("Bank account is required.");
    if (!date) return setError("Disbursement date is required.");
    setError("");
    onConfirm({ bankId, date });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Loan Disbursement</h2>

        {/* Bank Account */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Bank Account</label>
          <select
            value={bankId}
            onChange={(e) => setBankId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {bankAccounts.map((b) => (
              <option key={b.Id} value={String(b.Id)}>
                {b.BankName} - {b.BankAccountNumber}
              </option>
            ))}
          </select>
        </div>

        {/* Disbursement Date */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Disbursement Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <hr className="my-3 border-gray-200" />

        {/* Loan Preview */}
        <div className="bg-gray-50 rounded-lg p-4 shadow-inner text-sm">
          <h3 className="font-semibold text-indigo-700 mb-3">Loan Preview</h3>
          <div className="grid grid-cols-2 gap-y-2 gap-x-3">
            <span className="font-medium text-gray-600">Loan Type:</span>
            <span>{preview.LoanCase}</span>
            <span className="font-medium text-gray-600">Member:</span>
            <span>{preview.Memberfullname}</span>
            <span className="font-medium text-gray-600">Loan Applied:</span>
            <span>KES {preview.LoanAmountApplied.toLocaleString()}</span>
            <span className="font-medium text-gray-600">Settlement:</span>
            <span>KES {preview.SettlementAmount.toLocaleString()}</span>
            {/* <span className="font-medium text-gray-600">Top-Up:</span> 
            <span>KES {preview.TopUpAmount.toLocaleString()}</span>*/}
            <span className="font-medium text-gray-600">Boost Principal:</span>
            <span>KES {preview.BoostPrincipal.toLocaleString()}</span>
            <span className="font-medium text-gray-600">Boost Interest:</span>
            <span>KES {preview.BoostInterest.toLocaleString()}</span>
            <span className="font-semibold text-green-700">Bank Disbursement:</span>
            <span className="font-semibold text-green-700">KES {preview.BankDisbursement.toLocaleString()}</span>
            <span className="font-medium text-blue-700">Affected Loan Accounts:</span>
            <span className="text-blue-700">{preview.AffectedGLs?.LoanAccountGL}</span>
            <span className="font-medium text-blue-700">Affected Bank GL:</span>
            <span className="text-blue-700">{preview.AffectedGLs?.BankGL}</span>
            {/* <span className="font-medium text-blue-700">Affected Savings Accounts:</span>
            <span className="text-blue-700">{preview.AffectedGLs?.SavingsGL}</span> */}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-60"
          >
            {submitting ? "Processing..." : "Disburse Loan"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoanApproved() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [refresh, setRefresh] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [previewAmounts, setPreviewAmounts] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showGuarantors, setShowGuarantors] = useState(false);
  const [selectedLoanCaseId, setSelectedLoanCaseId] = useState(null);
  const [disbursalModal, setDisbursalModal] = useState({ open: false, loanCaseId: null });
  const [statusModal, setStatusModal] = useState({ open: false, type: "", message: "" });

  const pageSize = 10;

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_APP_LOANING_URL}/api/values/getBankWithLinkages`
        );
        const data = await res.json();
        if (data.Success) setBankAccounts(data.Data);
      } catch (err) {
        console.error("Failed to load banks", err);
      }
    };
    fetchBanks();
  }, []);

  const fetchLoanDrafts = () => {
    setLoading(true);
    fetch(
      `${import.meta.env.VITE_APP_LOANING_URL}/api/Loaning/GetLoansBy?status=Approved&filterType=1&pageIndex=${pageIndex}&pageSize=${pageSize}`
    )
      .then((res) => res.json())
      .then((data) => {
        setLoans(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLoanDrafts();
  }, [refresh, pageIndex]);

  const fetchPreviewAmount = async (loanId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_LOANING_URL}/api/LoanDisbursement/Preview?loanCaseID=${loanId}`
      );
      const result = await res.json();
      if (result?.success) {
        setPreviewAmounts((prev) => ({ ...prev, [loanId]: result.data }));
      }
    } catch {
      console.error("Preview fetch failed", loanId);
    }
  };

  useEffect(() => {
    loans.forEach((l) => fetchPreviewAmount(l.Id));
  }, [loans]);

  const handleDisbursement = (loanCaseId) => {
    const preview = previewAmounts[loanCaseId];
    if (!preview) {
      setStatusModal({ open: true, type: "error", message: "Preview amounts not available yet. Please wait." });
      return;
    }
    setDisbursalModal({ open: true, loanCaseId });
  };

  const handleDisbursalConfirm = async ({ bankId, date }) => {
    const { loanCaseId } = disbursalModal;
    setSubmitting(loanCaseId);
    setDisbursalModal({ open: false, loanCaseId: null });

    const payload = {
      caseNumber: 0,
      loanCaseID: loanCaseId,
      action: 1,
      disbursedBy: "system",
      disbursmentDate: new Date(date).toISOString(),
      bankAccountId: bankId,
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_APP_LOANING_URL}/api/LoanDisbursement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const msg = await res.json();
      console.log(msg, "Disbursement response");
      if (res.ok || msg.Success) {
        setStatusModal({ open: true, type: "success", message: msg.Message || msg.message || "Loan disbursed successfully." });
        setRefresh((r) => !r);
      } else {
        setStatusModal({ open: true, type: "error", message: msg.Message || msg.message || "Disbursement failed." });
      }
    } catch {
      setStatusModal({ open: true, type: "error", message: "Disbursement failed. Please try again." });
    } finally {
      setSubmitting(null);
    }
  };

  const filteredLoans = loans.filter((l) => {
    const t = searchTerm.toLowerCase();
    return (
      l.CaseNumber?.toString().includes(t) ||
      `${l.CustomerIndividualFirstName} ${l.CustomerIndividualLastName}`.toLowerCase().includes(t)
    );
  });

  return (
    <div className="bg-white py-8 rounded-xl">
      {/* Search + Refresh */}
      <div className="flex justify-between items-center mb-6">
        <input
          placeholder="Search by loan no, customer, branch, status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-1/3 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <Button
          size="sm"
          variant="outline"
          className="bg-gray-700 text-white hover:bg-gray-800"
          onClick={() => setRefresh(!refresh)}
        >
          Refresh
        </Button>
      </div>

      {/* Loan Grid */}
      <div className="overflow-x-auto bg-gray-200 p-3 rounded-2xl">
        <div className="grid grid-cols-12 gap-4 bg-gray-800 text-gray-100 font-semibold p-3 rounded-lg mb-3 text-sm">
          <span className="col-span-1">Loan No.</span>
          <span className="col-span-2">Customer</span>
          <span className="col-span-2">Branch</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2">Amount</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-2 bg-gray-100 py-4 px-6 rounded">
                {Array.from({ length: 6 }).map((__, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        ) : filteredLoans.length ? (
          filteredLoans.map((loan) => (
            <div
              key={loan.Id}
              className="bg-white rounded-lg shadow-md border hover:shadow-xl transition-all mb-2"
            >
              <div className="grid grid-cols-12 gap-2 items-center py-4 px-6">
                <span className="font-medium text-indigo-700 col-span-1">
                  {loan.CaseNumber.toString().padStart(7, "0")}
                </span>
                <span className="col-span-2 truncate">
                  {loan.CustomerIndividualFirstName} {loan.CustomerIndividualLastName}
                </span>
                <span className="col-span-2">{loan.BranchDescription}</span>
                <span className="col-span-2 text-center">
                  <span className="px-2 py-1 rounded-full text-white text-xs bg-gray-500">
                    {loan.StatusDescription}
                  </span>
                </span>
                <span className="font-semibold col-span-3">
                  Ksh {loan.AmountApplied.toLocaleString()}
                </span>

                <div className="flex gap-2 col-span-2 justify-end">
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                    onClick={() => handleDisbursement(loan.Id)}
                    disabled={submitting === loan.Id}
                  >
                    {submitting === loan.Id ? "Processing..." : "Disburse"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-green-700 text-white hover:bg-green-800"
                    onClick={() => {
                      setSelectedLoanCaseId(loan.Id);
                      setShowGuarantors(true);
                    }}
                  >
                    Guarantors
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-gray-700 text-white hover:bg-gray-800"
                    onClick={() => {
                      setSelectedLoan(loan);
                      setDetailsOpen(true);
                    }}
                  >
                    Details
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-400 mt-6">
            <img src={NotFoundImage} className="mx-auto w-40" />
            <p className="mt-2 font-medium">No Approved Loans Found.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between mt-4">
        <Button
          size="sm"
          variant="outline"
          disabled={pageIndex === 0}
          onClick={() => setPageIndex(pageIndex - 1)}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPageIndex(pageIndex + 1)}
        >
          Next
        </Button>
      </div>

      {/* Drawers */}
      <LoanDetailsDrawer
        open={detailsOpen}
        loan={selectedLoan}
        onClose={() => setDetailsOpen(false)}
      />
      <LoanGuarantorsDrawer
        open={showGuarantors}
        loanCaseId={selectedLoanCaseId}
        onClose={() => setShowGuarantors(false)}
      />

      {/* Disbursement Modal */}
      <DisbursementModal
        open={disbursalModal.open}
        preview={previewAmounts[disbursalModal.loanCaseId]}
        bankAccounts={bankAccounts}
        onConfirm={handleDisbursalConfirm}
        onCancel={() => setDisbursalModal({ open: false, loanCaseId: null })}
        submitting={submitting !== null}
      />

      {/* Status Modal */}
      {statusModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className={`text-4xl mb-3 ${statusModal.type === "success" ? "text-green-500" : "text-red-500"}`}>
              {statusModal.type === "success" ? "✓" : "✕"}
            </div>
            <h3 className={`text-lg font-bold mb-2 ${statusModal.type === "success" ? "text-green-700" : "text-red-700"}`}>
              {statusModal.type === "success" ? "Success" : "Error"}
            </h3>
            <p className="text-gray-600 text-sm mb-5">{statusModal.message}</p>
            <button
              onClick={() => setStatusModal({ open: false, type: "", message: "" })}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}