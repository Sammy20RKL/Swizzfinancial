import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import NotFoundImage from "/assets/scopefinding.png";

const today = new Date();
const todayStr = today.toISOString().split("T")[0];
const firstOfMonthStr = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-US", { style: "currency", currency: "KES" });

const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtTime = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

export default function AccountDrawer({ account, open, onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [loadingTx, setLoadingTx] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [debitTotal, setDebitTotal] = useState(0);
  const [creditTotal, setCreditTotal] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [balanceBroughtForward, setBalanceBroughtForward] = useState(0);
  const [balanceCarriedForward, setBalanceCarriedForward] = useState(0);
  const [fromDate, setFromDate] = useState();
  const [toDate, setToDate] = useState();

  const requestIdRef = useRef(0);

  useEffect(() => {
    setPageIndex(0);
    setSearch("");
    setFromDate();
    setToDate();
    setShowFilters(false);
  }, [account?.Id]);

  console.log("account Id:", account?.Id);

  useEffect(() => {
    if (!account?.Id) return;

    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    setLoadingTx(true);

    const params = new URLSearchParams({ chartOfAccountId: account.Id, pageIndex, pageSize });
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);
    fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/GeneralLedgerTransactions?${params}`, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (requestId !== requestIdRef.current) return;
        const payload = data?.Data || {};
        const collection = Array.isArray(payload.Transactions) ? payload.Transactions : [];
        console.log("Transaction with member data:", collection); // Debug log
        setTransactions(collection);
        setDebitTotal(payload.TotalDebits || 0);
        setCreditTotal(payload.TotalCredits || 0);
        setTotalRecords(payload.ItemsCount || 0);
        setBalanceBroughtForward(payload.BookBalanceBroughtFoward || 0);
        setBalanceCarriedForward(payload.BookBalanceCarriedForward || 0);
      })
      .catch((err) => { if (err.name !== "AbortError") console.error(err); })
      .finally(() => { if (!controller.signal.aborted) setLoadingTx(false); });

    return () => controller.abort();
  }, [account?.Id, pageIndex, pageSize, fromDate, toDate]);

  useEffect(() => { setPageIndex(0); }, [search, pageSize]);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      search.trim() === "" ||
      tx.JournalPrimaryDescription?.toLowerCase().includes(search.toLowerCase()) ||
      tx.JournalReference?.toLowerCase().includes(search.toLowerCase()) ||
      tx.ContraGLAccountDescription?.toLowerCase().includes(search.toLowerCase()) ||
      tx.CustomerFullName?.toLowerCase().includes(search.toLowerCase()) ||
      tx.CustomerReference2?.toLowerCase().includes(search.toLowerCase());

    const txDate = tx.JournalValueDate ? new Date(tx.JournalValueDate) : null;
    const matchesFrom = !fromDate || !txDate || txDate >= new Date(fromDate);
    const matchesTo = !toDate || !txDate || txDate <= new Date(toDate + "T23:59:59");

    return matchesSearch && matchesFrom && matchesTo;
  });

  const startItem = totalRecords === 0 ? 0 : pageIndex * pageSize + 1;
  const endItem = Math.min((pageIndex + 1) * pageSize, totalRecords);
  const totalPages = Math.ceil(totalRecords / pageSize);

  const handleExportPDF = () => {
    if (!account) return;
    const doc = new jsPDF("l", "mm", "a4");
    doc.setFontSize(13);
    doc.text(`Account Statement – ${account.Description}`, 14, 15);
    doc.setFontSize(9);
    doc.text(`Code: ${account.Code}   |   Balance: ${fmt(account.Balance)}`, 14, 22);
    doc.text(`Total Debit: ${fmt(debitTotal)}   |   Total Credit: ${fmt(creditTotal)}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);
    autoTable(doc, {
      startY: 40,
      head: [["Date", "Description", "Reference", "Contra Account", "Member Name", "Member No", "Debit", "Credit", "Balance"]],
      body: filteredTransactions.map((tx) => [
        fmtDate(tx.JournalValueDate),
        tx.JournalPrimaryDescription || "",
        tx.JournalReference || "",
        tx.ContraGLAccountDescription || "",
        tx.CustomerFullName || "—",
        tx.CustomerReference2 || "—",
        tx.Debit ? fmt(tx.Debit) : "",
        tx.Credit ? fmt(tx.Credit) : "",
        fmt(tx.RunningBalance),
      ]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      columnStyles: { 6: { halign: "right" }, 7: { halign: "right" }, 8: { halign: "right" } },
    });
    doc.save(`Statement_${account.Code}.pdf`);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* BACKDROP */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* DRAWER */}
          <motion.div
            className="fixed top-3 right-3 bottom-3 w-[92vw] max-w-[1300px] bg-white z-50
                       flex flex-col rounded-2xl shadow-2xl overflow-hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          >
            {/* ── HEADER ────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-4 bg-indigo-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-lg select-none">
                  {account?.Description?.[0] ?? "A"}
                </div>
                <div>
                  <h2 className="text-white font-bold text-base leading-tight">{account?.Description}</h2>
                  <p className="text-indigo-200 text-xs mt-0.5">
                    {account?.TypeDescription}
                    {account?.Code ? ` · Code ${account.Code}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Export PDF
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ── SUMMARY CARDS ─────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3 px-6 py-4 bg-indigo-700 border-b flex-shrink-0">
              <StatCard label="Account Balance" value={fmt(account?.Balance)} accent="green" />
              <StatCard label="Total Credits" value={fmt(creditTotal)} accent="" />
              <StatCard label="Total Debits" value={fmt(debitTotal)} accent="" />
            </div>

            {/* ── TOOLBAR ───────────────────────────────────────── */}
            <div className="px-6 py-3 border-b bg-white flex-shrink-0 space-y-2">
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search description, reference, member name or number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                {/* Filter toggle */}
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${showFilters ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2" />
                  </svg>
                  Filters
                  {(fromDate || toDate) && (
                    <span className="ml-1 w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                  )}
                </button>

                {/* Rows per page */}
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-2 bg-gray-50 focus:outline-none"
                >
                  {[10, 20, 50, 100, 1000].map((s) => <option key={s} value={s}>{s} rows</option>)}
                </select>

                <span className="text-xs text-gray-400 ml-auto">
                  {totalRecords === 0 ? "No records" : `${startItem}–${endItem} of ${totalRecords}`}
                </span>
              </div>

              {/* Date filter row (collapsible) */}
              {showFilters && (
                <div className="flex items-center gap-2 pt-1">
                  <label className="text-xs text-gray-500 font-medium w-14">From</label>
                  <input
                    type="date" value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <label className="text-xs text-gray-500 font-medium w-6">To</label>
                  <input
                    type="date" value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  {(fromDate || toDate) && (
                    <button
                      onClick={() => { setFromDate(""); setToDate(""); }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Clear dates
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── TABLE ─────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">
              {/* Column headers */}
              <div className="grid grid-cols-[1.2fr_2.5fr_1.8fr_1.5fr_1.2fr_1.2fr_1.2fr] gap-0 px-6 py-2.5
                              bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide sticky top-0 z-10">
                <span>Date</span>
                <span>Description</span>
                <span>Contra Account</span>
                <span>Member Name</span>
                <span>Member No</span>
                <span className="text-right">Debit</span>
                <span className="text-right">Credit</span>
              </div>

              {loadingTx ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <svg className="w-6 h-6 animate-spin mb-3 text-indigo-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <p className="text-sm">Loading transactions…</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <img src={NotFoundImage} className="w-24 mb-4 opacity-50" alt="" />
                  <p className="text-sm font-medium">No transactions found</p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <p className="text-sm">No transactions match your search or date filter</p>
                  <button onClick={() => { setSearch(""); setFromDate(""); setToDate(""); }} className="mt-2 text-xs text-indigo-500 hover:underline">
                    Clear filters
                  </button>
                </div>
              ) : (
                filteredTransactions.map((tx, i) => {
                  const isDebit = Number(tx.Debit || 0) > 0;
                  const isCredit = Number(tx.Credit || 0) > 0;
                  const hasMember = tx.CustomerFullName || tx.CustomerReference2;
                  
                  return (
                    <div
                      key={tx.Id ?? i}
                      className={`grid grid-cols-[1.2fr_2.5fr_1.8fr_1.5fr_1.2fr_1.2fr_1.2fr] gap-0 px-6 py-3.5
                                 border-b border-gray-100 hover:bg-indigo-50/40 transition-colors items-center
                                 ${hasMember ? 'bg-indigo-50/20' : ''}`}
                    >
                      {/* Date */}
                      <div>
                        <p className="text-sm font-medium text-gray-700">{fmtDate(tx.JournalValueDate)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{fmtTime(tx.JournalValueDate)}</p>
                      </div>

                      {/* Description */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${isDebit ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                          }`}>
                          {isDebit ? "DR" : "CR"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {tx.JournalPrimaryDescription || "—"}
                          </p>
                          {tx.JournalReference && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">Ref: {tx.JournalReference}</p>
                          )}
                        </div>
                      </div>

                      {/* Contra Account */}
                      <div className="min-w-0">
                        <p className="text-sm text-gray-600 truncate">
                          {tx.ContraGLAccountDescription || tx.ContraGLAccountName || "—"}
                        </p>
                      </div>

                      {/* Member Name */}
                      <div className="min-w-0">
                        {tx.CustomerFullName ? (
                          <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <p className="text-sm font-medium text-indigo-700 truncate">
                              {tx.CustomerFullName}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>

                      {/* Member Number */}
                      <div className="min-w-0">
                        {tx.CustomerReference2 ? (
                          <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                            <p className="text-sm font-mono text-gray-700 truncate">
                              {tx.CustomerReference2}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>

                      {/* Debit */}
                      <div className="text-right">
                        {isDebit ? (
                          <span className="text-sm font-semibold text-red-600">{fmt(tx.Debit)}</span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </div>

                      {/* Credit */}
                      <div className="text-right">
                        {isCredit ? (
                          <span className="text-sm font-semibold text-green-600">{fmt(tx.Credit)}</span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── PAGINATION FOOTER ─────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-3 border-t bg-white flex-shrink-0">
              <p className="text-xs text-gray-500">
                {totalRecords === 0
                  ? "No records"
                  : `Showing ${startItem}–${endItem} of ${totalRecords} transactions`}
              </p>
              <div className="flex items-center gap-1">
                <PaginationBtn
                  disabled={pageIndex === 0}
                  onClick={() => setPageIndex((p) => p - 1)}
                  label="← Previous"
                />
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = Math.max(0, Math.min(pageIndex - 2, totalPages - 5)) + i;
                  return (
                    <button
                      key={page}
                      onClick={() => setPageIndex(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === pageIndex
                        ? "bg-indigo-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                      {page + 1}
                    </button>
                  );
                })}
                <PaginationBtn
                  disabled={pageIndex >= totalPages - 1}
                  onClick={() => setPageIndex((p) => p + 1)}
                  label="Next →"
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatCard({ label, value, accent }) {
  const colors = {
    indigo: "border-l-indigo-500 bg-indigo-50",
    red: "border-l-red-400   bg-red-50",
    green: "border-l-green-500 bg-green-50",
    gray: "border-l-gray-400  bg-white",
  };
  const textColors = {
    indigo: "text-indigo-700",
    red: "text-red-600",
    green: "text-green-700",
    gray: "text-gray-700",
  };
  return (
    <div className={`rounded-xl px-4 py-3 shadow-sm ${colors[accent] ?? colors.gray}`}>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-bold mt-1 truncate ${textColors[accent] ?? textColors.gray}`}>{value}</p>
    </div>
  );
}

function PaginationBtn({ onClick, disabled, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 h-8 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100
                 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {label}
    </button>
  );
}