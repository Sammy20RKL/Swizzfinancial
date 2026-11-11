import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import LoanGuarantorsDrawer from "./LoanGuarantorsDrawer";
import LoanDetailsDrawer from "./LoanDetailsDrawer";

export default function LoanDisbursed() {
  const [loans, setLoans] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // drawers
  const [showGuarantors, setShowGuarantors] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(
      `${import.meta.env.VITE_APP_LOANING_URL}/api/Loaning/GetLoansBy?status=disbursed&filterType=1&pageIndex=${pageIndex}&pageSize=${pageSize}`
    )
      .then((res) => res.json())
      .then((data) => {
        setLoans(data.items || []);
        setTotalCount(data.totalCount ?? data.total ?? data.TotalCount ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [refresh, pageIndex]);

  const branches = useMemo(
    () => [...new Set(loans.map((l) => l.BranchDescription).filter(Boolean))].sort(),
    [loans]
  );

  const hasActiveFilters = fromDate || toDate || minAmount || maxAmount || branchFilter;

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setMinAmount("");
    setMaxAmount("");
    setBranchFilter("");
  };

  const filteredLoans = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return loans.filter((loan) => {
      const fullName = `${loan.CustomerIndividualFirstName ?? ""} ${loan.CustomerIndividualLastName ?? ""}`.toLowerCase();
      const matchesSearch =
        !term ||
        loan.CaseNumber?.toString().includes(term) ||
        fullName.includes(term) ||
        loan.BranchDescription?.toLowerCase().includes(term) ||
        loan.StatusDescription?.toLowerCase().includes(term);

      const matchesBranch =
        !branchFilter || loan.BranchDescription === branchFilter;

      const loanDate = loan.DisbursementDate || loan.CreatedDate || loan.ApplicationDate;
      const matchesFrom = !fromDate || !loanDate || new Date(loanDate) >= new Date(fromDate);
      const matchesTo = !toDate || !loanDate || new Date(loanDate) <= new Date(toDate + "T23:59:59");

      const amount = Number(loan.AmountApplied || 0);
      const matchesMin = !minAmount || amount >= Number(minAmount);
      const matchesMax = !maxAmount || amount <= Number(maxAmount);

      return matchesSearch && matchesBranch && matchesFrom && matchesTo && matchesMin && matchesMax;
    });
  }, [loans, searchTerm, branchFilter, fromDate, toDate, minAmount, maxAmount]);

  const handleDownloadPdf = async (customerId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_LOANING_URL}/api/values/GetLoanStatement/${customerId}?downloadPdf=true`
      );
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Loan_Statement_${customerId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      Swal.fire("Error", "Failed to download loan statement", "error");
    }
  };

  return (
    <div className="bg-white py-8 rounded-xl">

      {/* Search + Filters toggle + Refresh */}
      <div className="flex justify-between items-center mb-4 gap-3">
        <input
          type="text"
          placeholder="Search by loan no, customer, branch, status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-1/3 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className={`flex items-center gap-1.5 ${showFilters || hasActiveFilters ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-white text-gray-700 hover:bg-gray-100"}`}
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {hasActiveFilters && <span className="ml-1 w-2 h-2 rounded-full bg-yellow-300 inline-block" />}
          </Button>
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-500 border-red-200 hover:bg-red-50 flex items-center gap-1"
              onClick={clearFilters}
            >
              <X className="w-3 h-3" /> Clear
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="bg-gray-700 text-white hover:bg-gray-800"
            onClick={() => setRefresh((r) => !r)}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 p-4 bg-gray-100 border border-gray-200 rounded-xl">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Min Amount</label>
            <input
              type="number"
              placeholder="0"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Max Amount</label>
            <input
              type="number"
              placeholder="Any"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Branch</label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Loan Grid */}
      <div className="overflow-x-auto bg-gray-200 p-3 rounded-2xl">
        <div className="grid grid-cols-12 gap-4 bg-gray-800 text-gray-100 font-semibold p-3 rounded-lg mb-3 text-sm">
          <span className="col-span-1">Loan No.</span>
          <span className="col-span-2">Customer</span>
          <span className="col-span-2">Branch</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2">Amount</span>
          <span className="col-span-3 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-2 bg-gray-100 py-4 px-6 rounded">
                {Array.from({ length: 6 }).map((__, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded" />
                ))}
              </div>
            ))}
          </div>
        ) : filteredLoans.length > 0 ? (
          filteredLoans.map((loan) => (
            <div
              key={loan.Id}
              className="bg-white rounded-lg shadow-md border hover:shadow-xl transition-all mb-2"
            >
              <div className="grid grid-cols-12 gap-2 items-center py-4 px-6">
                <span className="font-medium text-indigo-700 col-span-1">
                  {loan.CaseNumber?.toString().padStart(7, "0")}
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
                <span className="font-semibold col-span-2">
                  Ksh {Number(loan.AmountApplied || 0).toLocaleString()}
                </span>
                <div className="flex gap-2 col-span-3 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-red-600 text-white hover:bg-red-700"
                    onClick={() => handleDownloadPdf(loan.CustomerId)}
                    disabled={submitting === loan.CustomerId}
                  >
                    Statement
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-green-700 text-white hover:bg-green-800"
                    onClick={() => {
                      setSelectedLoan(loan);
                      setSelectedCustomerId(loan.CustomerId);
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
            <img src={NotFoundImage} className="mx-auto w-40" alt="Not found" />
            <p className="mt-2 font-medium">
              {hasActiveFilters || searchTerm ? "No loans match your filters." : "No Disbursed Loans Found."}
            </p>
            {(hasActiveFilters || searchTerm) && (
              <button
                onClick={() => { clearFilters(); setSearchTerm(""); }}
                className="mt-1 text-sm text-indigo-500 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-gray-500">
          {totalCount > 0
            ? `Page ${pageIndex + 1} · ${filteredLoans.length} of ${totalCount} records`
            : `${filteredLoans.length} record${filteredLoans.length !== 1 ? "s" : ""}`}
        </span>
        <div className="flex gap-2">
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
            disabled={loans.length < pageSize}
            onClick={() => setPageIndex(pageIndex + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Drawers */}
      <LoanGuarantorsDrawer
        open={showGuarantors}
        customerId={selectedCustomerId}
        loan={selectedLoan}
        onClose={() => setShowGuarantors(false)}
      />
      <LoanDetailsDrawer
        open={detailsOpen}
        loan={selectedLoan}
        onClose={() => setDetailsOpen(false)}
      />
    </div>
  );
}
