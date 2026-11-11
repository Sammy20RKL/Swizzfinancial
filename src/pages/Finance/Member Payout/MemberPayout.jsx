import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaMoneyBillWave,
    FaChevronLeft,
    FaChevronRight,
    FaPrint,
    FaCheckCircle,
    FaTimesCircle,
    FaWallet,
    FaCalendarAlt,
    FaBuilding,
    FaSearch,
    FaSync,
    FaMoneyBill,
    FaUniversity,
} from "react-icons/fa";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import PaymentPayoutDrawer from "./PaymentPayoutDrawer";

const API_URL = import.meta.env.VITE_APP_MEMBERSHIP_URL;

export default function MemberPayout() {
    const [payouts, setPayouts]           = useState([]);
    const [settlements, setSettlements]   = useState([]);
    const [loading, setLoading]           = useState(true);
    const [selectedRows, setSelectedRows] = useState([]);
    const [selectAll, setSelectAll]       = useState(false);
    const [search, setSearch]             = useState("");
    const [currentPage, setCurrentPage]   = useState(1);
    const [summary, setSummary]           = useState({ totalCount: 0, totalAmount: 0 });
    const [drawerOpen, setDrawerOpen]     = useState(false);
    const [selectedPayout, setSelectedPayout]       = useState(null);
    const [selectedLoan, setSelectedLoan]           = useState(null);
    const [activeTab, setActiveTab]                 = useState("normal"); // "normal" | "loan"
    const pageSize = 10;

    useEffect(() => {
        if (activeTab === "normal") {
            fetchPendingPayouts();
        } else {
            fetchPendingSettlements();
        }
        // reset on tab switch
        setSelectedRows([]);
        setSelectAll(false);
        setSearch("");
        setCurrentPage(1);
    }, [activeTab]);

    // ================== FETCH MEMBERSHIP PAYOUTS ==================
    const fetchPendingPayouts = async () => {
        setLoading(true);
        try {
            const res  = await fetch(`${API_URL}/api/values/get-pending-payouts`, {
                headers: { "ngrok-skip-browser-warning": "true" }
            });
            const json = await res.json();

            if (json.Success) {
                const mapped = (json.Data || []).map(p => ({
                    settlementId:             p.SettlementId,
                    withdrawalNotificationId: p.WithdrawalNotificationId,
                    customerAccountId:        p.CustomerAccountId,
                    customerId:               p.CustomerId,
                    customerName:             p.CustomerName,
                    memberNumber:             p.MemberNumber,
                    pfNumber:                 p.PFNumber,
                    accountCode:              p.AccountCode,
                    accountDescription:       p.AccountDescription,
                    principal:                p.Principal,
                    interest:                 p.Interest,
                    carryForwards:            p.CarryForwards,
                    settlementDate:           p.SettlementDate,
                    settledDate:              p.SettledDate,
                    remarks:                  p.Remarks,
                    payoutAmount:             p.CarryForwards || p.Principal || 0
                }));

                setPayouts(mapped);
                setSummary({
                    totalCount:  json.TotalCount || mapped.length,
                    totalAmount: mapped.reduce((sum, p) => sum + p.payoutAmount, 0)
                });
            }
        } catch (err) {
            console.error("Fetch Payouts Error:", err);
            Swal.fire("Error", "Failed to load pending payouts", "error");
        } finally {
            setLoading(false);
        }
    };

    // ================== FETCH LOAN SETTLEMENTS ==================
    const fetchPendingSettlements = async () => {
        setLoading(true);
        try {
            const res  = await fetch(
                `${API_URL}/api/GetLoanSettlements?processed=false&page=1&pageSize=200`,
                { headers: { "ngrok-skip-browser-warning": "true" } }
            );
            const json = await res.json();

            if (json.success) {
                // Map the data to ensure consistent field names
                const mappedSettlements = (json.data || []).map(s => ({
                    settlementId: s.settlementId,
                    withdrawalNotificationId: s.withdrawalNotificationId,
                    customerAccountId: s.customerAccountId,
                    customerId: s.customerId,
                    customerName: s.customerName,
                    memberNumber: s.memberNumber,
                    mobile: s.mobile,
                    principal: s.principal || 0,
                    interest: s.interest || 0,
                    carryForwards: s.carryForwards || 0,
                    totalAmount: s.totalAmount || s.principal || 0,
                    loanNumber: s.reference, // Store reference as loanNumber
                    reference: s.reference,
                    disbursementType: s.disbursementType || "Normal",
                    createdBy: s.createdBy,
                    createdDate: s.createdDate,
                    processedDate: s.processedDate,
                    processedBy: s.processedBy,
                    isProcessed: s.isProcessed
                }));
                
                setSettlements(mappedSettlements);
                setSummary({
                    totalCount: json.totalCount || 0,
                    totalAmount: mappedSettlements.reduce((sum, s) => sum + (s.principal || 0), 0)
                });
            } else {
                Swal.fire("Error", json.message || "Failed to load settlements", "error");
            }
        } catch (err) {
            console.error("Fetch Settlements Error:", err);
            Swal.fire("Error", "Failed to load loan settlements", "error");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return "0.00";
        return Number(amount).toLocaleString("en-KE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const formatDate = (date) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString();
    };

    const handleSelectRow = (id) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedRows([]);
        } else {
            setSelectedRows(paginatedData.map(r => r.settlementId));
        }
        setSelectAll(!selectAll);
    };

    const openPaymentDrawer = (payout) => {
        setSelectedPayout(payout);
        setDrawerOpen(true);
    };

    const openLoanDrawer = (settlement) => {
        setSelectedLoan({
            settlementId: settlement.settlementId,
            customerName: settlement.customerName,
            memberNumber: settlement.memberNumber,
            loanNumber: settlement.loanNumber, // Use loan number
            reference: settlement.reference,
            principal: settlement.principal,
            interest: settlement.interest,
            carryForwards: settlement.carryForwards,
            totalAmount: settlement.totalAmount,
            disbursementType: settlement.disbursementType,
            mobile: settlement.mobile,
            processedBy: "System.UI"
        });
        setDrawerOpen(true);
    };

    const handleSuccess = () => {
        if (activeTab === "normal") {
            fetchPendingPayouts();
        } else {
            fetchPendingSettlements();
        }
        setSelectedRows([]);
        setSelectAll(false);
    };

    const handlePrint = () => {
        const data  = activeTab === "normal" ? filteredPayouts : filteredSettlements;
        const title = activeTab === "normal" ? "Normal Payouts Report" : "Loan Payouts Report";

        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
            <html>
                <head>
                    <title>${title}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .total { margin-top: 20px; text-align: right; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>${title}</h2>
                        <p>Generated: ${new Date().toLocaleString()}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Loan Number</th>
                                <th>Member Name</th>
                                <th>Member No</th>
                                <th>Type</th>
                                <th>Principal (KSH)</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(r => `
                                <tr>
                                    <td>${r.loanNumber || r.reference || "-"}</td>
                                    <td>${r.customerName || "-"}</td>
                                    <td>${r.memberNumber || "-"}</td>
                                    <td>${r.disbursementType || "Payout"}</td>
                                    <td>${formatCurrency(r.principal || r.payoutAmount)} KSH</td>
                                    <td>${formatDate(r.createdDate || r.settledDate)}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                    <div class="total">
                        <p>Total Records: ${data.length}</p>
                        <p>Total Amount: ${formatCurrency(
                            data.reduce((sum, r) => sum + (r.principal || r.payoutAmount || 0), 0)
                        )} KSH</p>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    // ================== FILTER + PAGINATE ==================
    const filteredPayouts = payouts.filter(p => {
        const term = search.toLowerCase();
        return (
            (p.customerName || "").toLowerCase().includes(term) ||
            (p.memberNumber || "").toLowerCase().includes(term) ||
            (p.pfNumber || "").toLowerCase().includes(term) ||
            (p.accountCode || "").toLowerCase().includes(term) ||
            (p.accountDescription || "").toLowerCase().includes(term)
        );
    });

    const filteredSettlements = settlements.filter(s => {
        const term = search.toLowerCase();
        return (
            (s.customerName || "").toLowerCase().includes(term) ||
            (s.memberNumber || "").toLowerCase().includes(term) ||
            (s.loanNumber || "").toLowerCase().includes(term) ||
            (s.disbursementType || "").toLowerCase().includes(term)
        );
    });

    const activeData   = activeTab === "normal" ? filteredPayouts : filteredSettlements;
    const startIndex   = (currentPage - 1) * pageSize;
    const paginatedData = activeData.slice(startIndex, startIndex + pageSize);
    const totalPages   = Math.ceil(activeData.length / pageSize);

    useEffect(() => {
        if (selectAll) {
            const ids = paginatedData.map(r => r.settlementId);
            setSelectedRows(prev => {
                const same =
                    prev.length === ids.length &&
                    prev.every((id, i) => id === ids[i]);
                return same ? prev : ids;
            });
        }
    }, [selectAll, currentPage, search, payouts, settlements]);

    return (
        <div className="bg-gray-100 min-h-screen p-6">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-green-700 to-green-800 px-6 py-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <FaMoneyBillWave className="text-3xl" />
                            Member Payout
                        </h2>
                        <div className="flex gap-3">
                            <Button
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={activeTab === "normal" ? fetchPendingPayouts : fetchPendingSettlements}
                            >
                                <FaSync className="mr-2" /> Refresh
                            </Button>
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={handlePrint}
                            >
                                <FaPrint className="mr-2" /> Print
                            </Button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => setActiveTab("normal")}
                            className={`px-5 py-2 rounded-lg font-semibold text-sm transition-colors ${
                                activeTab === "normal"
                                    ? "bg-white text-green-700"
                                    : "bg-green-600 text-white hover:bg-green-500"
                            }`}
                        >
                            <FaWallet className="inline mr-2" />
                            Normal Payout
                        </button>
                        <button
                            onClick={() => setActiveTab("loan")}
                            className={`px-5 py-2 rounded-lg font-semibold text-sm transition-colors ${
                                activeTab === "loan"
                                    ? "bg-white text-green-700"
                                    : "bg-green-600 text-white hover:bg-green-500"
                            }`}
                        >
                            <FaUniversity className="inline mr-2" />
                            Loan Payout
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-3">
                                <FaWallet className="text-blue-600 text-2xl" />
                                <div>
                                    <p className="text-sm text-gray-600">
                                        {activeTab === "normal" ? "Pending Payouts" : "Pending Loan Payouts"}
                                    </p>
                                    <p className="text-2xl font-bold text-blue-700">{summary.totalCount}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="flex items-center gap-3">
                                <FaMoneyBillWave className="text-green-600 text-2xl" />
                                <div>
                                    <p className="text-sm text-gray-600">Total Amount</p>
                                    <p className="text-2xl font-bold text-green-700">
                                        {formatCurrency(summary.totalAmount)} KSH
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <div className="flex items-center gap-3">
                                <FaCheckCircle className="text-purple-600 text-2xl" />
                                <div>
                                    <p className="text-sm text-gray-600">Selected</p>
                                    <p className="text-2xl font-bold text-purple-700">{selectedRows.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                        <div className="flex-1 min-w-[300px]">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={
                                        activeTab === "normal"
                                            ? "Search by name, member number, PF number or account..."
                                            : "Search by name, member number or loan number..."
                                    }
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-gray-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <div className="min-w-[900px]">

                                {/* ── NORMAL PAYOUTS TABLE ── */}
                                {activeTab === "normal" && (
                                    <>
                                        <div className="grid grid-cols-8 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 text-sm">
                                            <div className="col-span-1 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectAll && paginatedData.length > 0}
                                                    onChange={handleSelectAll}
                                                    className="w-4 h-4 cursor-pointer rounded"
                                                />
                                            </div>
                                            <div className="col-span-2">Member Details</div>
                                            <div className="col-span-2">Account</div>
                                            <div className="col-span-1">Settlement Date</div>
                                            <div className="col-span-1">Amount (KSH)</div>
                                            <div className="col-span-1">Action</div>
                                        </div>

                                        {loading ? (
                                            <div className="p-12 text-center text-gray-500">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                                                Loading pending payouts...
                                            </div>
                                        ) : paginatedData.length === 0 ? (
                                            <div className="flex flex-col justify-center items-center p-12">
                                                <img src={NotFoundImage} className="w-40 opacity-70" alt="No records" />
                                                <p className="mt-4 text-gray-500">No Pending Payouts Found</p>
                                            </div>
                                        ) : (
                                            paginatedData.map((payout) => (
                                                <div key={payout.settlementId} className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                                    <div className="grid grid-cols-8 gap-3 items-center p-3 text-sm">
                                                        <div className="col-span-1 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedRows.includes(payout.settlementId)}
                                                                onChange={() => handleSelectRow(payout.settlementId)}
                                                                className="w-4 h-4 cursor-pointer rounded"
                                                            />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <div className="font-semibold text-gray-800">{payout.customerName}</div>
                                                            <div className="text-xs text-gray-500 mt-1">Member No: {payout.memberNumber || "-"}</div>
                                                            <div className="text-xs text-gray-500">PF No: {payout.pfNumber || "-"}</div>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <div className="font-mono text-sm font-semibold text-gray-700">
                                                                Code: {payout.accountCode || "-"}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {payout.accountDescription || "Savings Account"}
                                                            </div>
                                                            <div className="text-xs font-bold text-green-600 mt-1">
                                                                Amount: {formatCurrency(payout.payoutAmount)} KSH
                                                            </div>
                                                        </div>
                                                        <div className="col-span-1">
                                                            <div className="flex items-center gap-1 text-gray-600">
                                                                <FaCalendarAlt className="text-xs" />
                                                                <span>{formatDate(payout.settledDate)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="col-span-1">
                                                            <div className="text-lg font-bold text-green-600">
                                                                {formatCurrency(payout.payoutAmount)} KSH
                                                            </div>
                                                        </div>
                                                        <div className="col-span-1">
                                                            <Button
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700 text-white w-full"
                                                                onClick={() => openPaymentDrawer(payout)}
                                                            >
                                                                <FaMoneyBill className="mr-1" /> Pay
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </>
                                )}

                                {/* ── LOAN PAYOUTS TABLE ── */}
                                {activeTab === "loan" && (
                                    <>
                                        <div className="grid grid-cols-9 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 text-sm">
                                            <div className="col-span-1 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectAll && paginatedData.length > 0}
                                                    onChange={handleSelectAll}
                                                    className="w-4 h-4 cursor-pointer rounded"
                                                />
                                            </div>
                                            <div className="col-span-2">Member Details</div>
                                            <div className="col-span-1">Loan Number</div>
                                            <div className="col-span-1">Type</div>
                                            <div className="col-span-1">Principal</div>
                                            <div className="col-span-1">Interest</div>
                                            <div className="col-span-1">Date</div>
                                            <div className="col-span-1">Action</div>
                                        </div>

                                        {loading ? (
                                            <div className="p-12 text-center text-gray-500">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                                Loading pending loan payouts...
                                            </div>
                                        ) : paginatedData.length === 0 ? (
                                            <div className="flex flex-col justify-center items-center p-12">
                                                <img src={NotFoundImage} className="w-40 opacity-70" alt="No records" />
                                                <p className="mt-4 text-gray-500">No Pending Loan Payouts Found</p>
                                            </div>
                                        ) : (
                                            paginatedData.map((s) => (
                                                <div key={s.settlementId} className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                                    <div className="grid grid-cols-9 gap-3 items-center p-3 text-sm">
                                                        <div className="col-span-1 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedRows.includes(s.settlementId)}
                                                                onChange={() => handleSelectRow(s.settlementId)}
                                                                className="w-4 h-4 cursor-pointer rounded"
                                                            />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <div className="font-semibold text-gray-800">{s.customerName}</div>
                                                            <div className="text-xs text-gray-500 mt-1">Member No: {s.memberNumber || "-"}</div>
                                                        </div>
                                                        <div className="col-span-1">
                                                            <div className="font-mono text-sm font-semibold text-blue-600">
                                                                {s.loanNumber || "-"}
                                                            </div>
                                                        </div>
                                                        <div className="col-span-1">
                                                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                                                s.disbursementType === "Refinance"
                                                                    ? "bg-purple-100 text-purple-700"
                                                                    : s.disbursementType === "Boosted"
                                                                    ? "bg-yellow-100 text-yellow-700"
                                                                    : "bg-green-100 text-green-700"
                                                            }`}>
                                                                {s.disbursementType || "Normal"}
                                                            </span>
                                                        </div>
                                                        <div className="col-span-1">
                                                            <div className="font-bold text-green-600 text-sm">
                                                                {formatCurrency(s.principal)} KSH
                                                            </div>
                                                        </div>
                                                        <div className="col-span-1">
                                                            <div className="text-sm text-gray-700">
                                                                {formatCurrency(s.interest)} KSH
                                                            </div>
                                                        </div>
                                                        <div className="col-span-1">
                                                            <div className="flex items-center gap-1 text-gray-600 text-xs">
                                                                <FaCalendarAlt className="text-xs" />
                                                                <span>{formatDate(s.createdDate)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="col-span-1">
                                                            <Button
                                                                size="sm"
                                                                className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                                                                onClick={() => openLoanDrawer(s)}
                                                            >
                                                                <FaUniversity className="mr-1" /> Pay
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-6">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(currentPage - 1)}
                                className="border-gray-300"
                            >
                                <FaChevronLeft /> Prev
                            </Button>
                            <span className="text-sm text-gray-600">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(currentPage + 1)}
                                className="border-gray-300"
                            >
                                Next <FaChevronRight />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment / Loan Drawer */}
            <PaymentPayoutDrawer
                open={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false);
                    setSelectedPayout(null);
                    setSelectedLoan(null);
                }}
                payout={activeTab === "normal" ? selectedPayout : null}
                loan={activeTab === "loan"   ? selectedLoan   : null}
                mode={activeTab === "normal" ? "payout"       : "loan"}
                onSuccess={handleSuccess}
            />
        </div>
    );
}