import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


export default function LoanGuarantorsDrawer({ open, onClose, loanCaseId, loan }) {
    const [loading, setLoading] = useState(false);
    const [guarantors, setGuarantors] = useState([]);

    // --- Filters & Pagination ---
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;


    useEffect(() => {
        if (!open || !loanCaseId) return;

        const fetchGuarantors = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_APP_LOANING_URL}/api/GuarantorManagement/GetLoanGuarantors/${loanCaseId}`
                );
                const data = await res.json();
                setGuarantors(data?.Data || []);
            } catch (err) {
                console.error("Failed to fetch guarantors", err);
            } finally {
                setLoading(false);
            }
        };

        fetchGuarantors();
    }, [open, loanCaseId]);

    // --- Filtered list based on search ---
    const filteredGuarantors = useMemo(() => {
        return guarantors.filter(g => {
            const text = `${g.CustomerIndividualFirstName} ${g.CustomerIndividualLastName} ${g.CustomerIndividualIdentityCardNumber} ${g.CustomerAddressMobileLine}`.toLowerCase();
            return text.includes(search.toLowerCase());
        });
    }, [guarantors, search]);

    // --- Pagination ---
    const totalPages = Math.ceil(filteredGuarantors.length / rowsPerPage);
    const paginatedGuarantors = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredGuarantors.slice(start, start + rowsPerPage);
    }, [filteredGuarantors, currentPage]);

    // Reset page when search changes
    useEffect(() => setCurrentPage(1), [search]);


    console.log("Guarantors:", guarantors);

    console.log("Loan:", loan);





    // --- PDF download ---
    const downloadPDF = () => {
        if (!filteredGuarantors.length || !loan) return;

        const doc = new jsPDF("p", "mm", "a4");
        doc.setFontSize(16);
        doc.text(`Loan Guarantors - ${loan.CustomerIndividualFirstName} ${loan.CustomerIndividualLastName}`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

        // --- Loan Summary ---
        const loanSummaryY = 30;
        doc.setFontSize(12);
        doc.text("Loan Summary", 14, loanSummaryY);
        doc.setFontSize(10);

        const loanSummaryData = [
            ["Member", `${loan.CustomerIndividualFirstName} ${loan.CustomerIndividualLastName}`],
            ["Member No", loan.CustomerReference2],
            ["Loan Product", loan.LoanProductDescription],
            ["Status", loan.StatusDescription],
            ["Approved Amount", `Ksh ${loan.ApprovedAmount?.toLocaleString()}`],
            ["Disbursed Amount", `Ksh ${loan.DisbursedAmount?.toLocaleString()}`],
            ["Monthly Payback", `Ksh ${loan.MonthlyPaybackAmount?.toLocaleString()} / month`],
            ["Term", `${loan.LoanRegistrationTermInMonths} months`],
            ["Interest Rate", `${loan.LoanInterestAnnualPercentageRate}% p.a`],
            ["Total Payback", `Ksh ${loan.TotalPaybackAmount?.toLocaleString()}`],
            ["Loan Balance", `Ksh ${loan.LoanProductLoanBalance?.toLocaleString()}`],
            ["Branch", loan.BranchDescription],
            ["Disbursed On", loan.DisbursedDate ? new Date(loan.DisbursedDate).toLocaleDateString() : "-"]
        ];

        autoTable(doc, {
            startY: loanSummaryY + 3,
            body: loanSummaryData,
            theme: "grid",
            styles: { fontSize: 10 },
            columnStyles: { 0: { fontStyle: "bold" }, 1: { halign: "left" } },
            margin: { left: 14, right: 14 },
            tableWidth: 'auto'
        });

        // --- Guarantors Table ---
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 5,
            head: [["#", "Guarantor", "ID No", "Phone", "Guaranteed", "Shares", "Status"]],
            body: filteredGuarantors.map((g, idx) => [
                idx + 1,
                `${g.CustomerIndividualFirstName} ${g.CustomerIndividualLastName}`,
                g.CustomerIndividualIdentityCardNumber,
                g.CustomerAddressMobileLine,
                g.AmountGuaranteed?.toLocaleString(),
                g.TotalShares?.toLocaleString(),
                g.StatusDescription
            ]),
            theme: "striped",
            headStyles: { fillColor: [55, 65, 81], textColor: 255 },
            styles: { fontSize: 10 },
            columnStyles: { 4: { halign: "right" }, 5: { halign: "right" } },
            margin: { left: 14, right: 14 },
        });

        doc.save(`Loan_${loan.CustomerReference2}_Guarantors.pdf`);
    };



    // ⬇️ SAFE early return (after hooks)
    if (!open || !loan) return null;

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Overlay */}
                    <motion.div
                        className="fixed inset-0 bg-black z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        className="fixed top-5 right-5 w-[920px] min-h-80vh bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {/* Header */}
                        <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
                            <h2 className="font-bold text-lg text-white">Loan Guarantors</h2>
                            <div className="flex justify-around items-center gap-4">
                                <Button size="sm" onClick={downloadPDF} className="bg-gray-600 hover:bg-gray-700 text-white">
                                    Download PDF
                                </Button>
                                <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
                            </div>
                        </div>
                        <div className="flex gap-2">

                        </div>


                        {/* ================= LOAN SUMMARY ================= */}
                        <div className="bg-gray-700 border rounded-xl p-4 mb-4 mx-2 text-sm">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                                <div>
                                    <p className="text-gray-400">Member</p>
                                    <p className="font-semibold text-gray-200">
                                        {loan?.CustomerIndividualFirstName} {loan?.CustomerIndividualLastName}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Member No: {loan?.CustomerReference2}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-400">Loan Product</p>
                                    <p className="font-semibold text-gray-200">{loan?.LoanProductDescription}</p>
                                    <Badge className="mt-1" variant="secondary">
                                        {loan?.StatusDescription}
                                    </Badge>
                                </div>

                                <div>
                                    <p className="text-gray-400">Approved Amount</p>
                                    <p className="font-semibold text-green-300">
                                        Ksh {loan?.ApprovedAmount?.toLocaleString()}
                                    </p>
                                    {/* <p className="text-xs text-gray-400">
                                        Disbursed: Ksh {loan?.DisbursedAmount?.toLocaleString()}
                                    </p> */}
                                </div>

                                <div>
                                    <p className="text-gray-400">Repayment</p>
                                    <p className="font-semibold text-gray-200">
                                        Ksh {loan?.MonthlyPaybackAmount?.toLocaleString()} / month
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {loan?.LoanRegistrationTermInMonths} months · {loan?.LoanInterestAnnualPercentageRate}% p.a
                                    </p>
                                </div>

                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4  pt-3 bg-gray-600 rounded-md p-4">
                                <div>
                                    <p className="text-gray-400">Total Payback</p>
                                    <p className="font-semibold text-gray-200">
                                        Ksh {loan?.TotalPaybackAmount?.toLocaleString()}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-400">Loan Balance</p>
                                    <p className="font-semibold text-red-300">
                                        Ksh {loan?.LoanProductLoanBalance?.toLocaleString()}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-400">Branch</p>
                                    <p className="font-semibold text-gray-200">{loan?.BranchDescription}</p>
                                </div>

                                <div>
                                    <p className="text-gray-400">Received Date</p>
                                    <p className="font-semibold text-gray-200">
                                        {loan?.ReceivedDate
                                            ? new Date(loan.ReceivedDate).toLocaleDateString()
                                            : "-"}
                                    </p>
                                </div>
                            </div>
                        </div>


                        {/* Search */}
                        <div className="mb-3 mx-2">
                            <input
                                type="text"
                                placeholder="Search by name, ID or phone..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full border-2 rounded p-2"
                            />
                        </div>

                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3 mx-2 text-xs">
                            <span className="col-span-1">#</span>
                            <span className="col-span-3">Guarantor</span>
                            <span className="col-span-2">ID No</span>
                            <span className="col-span-2">Phone</span>
                            <span className="col-span-2">Guaranteed</span>
                            <span className="col-span-1">Shares</span>
                            <span className="col-span-1 text-center">Status</span>
                        </div>

                        {/* Table Body */}
                        <div className="flex-1 overflow-y-auto mx-2">
                            {loading && <p className="text-sm text-muted-foreground">Loading guarantors...</p>}
                            {!loading && filteredGuarantors.length === 0 && (
                                <p className="text-sm text-muted-foreground">No guarantors found.</p>
                            )}

                            {!loading && filteredGuarantors.length > 0 && (
                                <div className="space-y-2 bg-gray-300 p-2 rounded-lg">
                                    {paginatedGuarantors.map((g, idx) => (
                                        <div
                                            key={`${g.Id || "guarantor"}-${idx}`}
                                            className="grid grid-cols-12 gap-3 items-center bg-white border rounded-lg px-3 py-2 hover:shadow-md transition text-xs"
                                        >
                                            <span className="col-span-1 font-medium text-indigo-600">{(currentPage - 1) * rowsPerPage + idx + 1}</span>
                                            <span className="col-span-3">{g.CustomerIndividualFirstName} {g.CustomerIndividualLastName}</span>
                                            <span className="col-span-2">{g.CustomerIndividualIdentityCardNumber}</span>
                                            <span className="col-span-2">{g.CustomerAddressMobileLine}</span>
                                            <span className="col-span-2 font-semibold text-green-700">Ksh {g.AmountGuaranteed?.toLocaleString()}</span>
                                            <span className={`col-span-1 font-semibold ${g.TotalShares < g.AmountGuaranteed ? "text-red-600" : "text-gray-700"}`}>{g.TotalShares?.toLocaleString()}</span>
                                            <span className="col-span-1 text-center"><Badge variant="outline">{g.StatusDescription}</Badge></span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {filteredGuarantors.length > rowsPerPage && (
                            <div className="flex justify-center items-center mt-3 space-x-2">
                                <Button
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Prev
                                </Button>
                                <span>{currentPage} / {totalPages}</span>
                                <Button
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
