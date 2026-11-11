import { motion, AnimatePresence } from "framer-motion";
import { Button } from "flowbite-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { FaFilePdf, FaFileCsv, FaTimes, FaDownload } from "react-icons/fa";

// loanUtils.js
export const fmt = (n) =>
    Number(n || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

export const generateRepaymentSchedule = (
    principal,
    annualRate,
    termMonths,
    monthlyPayback = null
) => {
    const schedule = [];
    const r = annualRate / 12 / 100;
    const n = termMonths;

    // Use provided monthly payback or calculate it
    let monthlyPayment;
    if (monthlyPayback && monthlyPayback > 0) {
        monthlyPayment = monthlyPayback;
    } else if (r === 0 || n === 0) {
        monthlyPayment = n > 0 ? principal / n : 0;
    } else {
        monthlyPayment = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    let balance = principal;

    for (let i = 1; i <= n; i++) {
        const interest = balance * r;
        const principalPayment = Math.min(monthlyPayment - interest, balance);
        balance -= principalPayment;

        schedule.push({
            month: i,
            payment: monthlyPayment,
            principal: principalPayment,
            interest: interest,
            balance: balance > 0 ? balance : 0,
        });

        if (balance <= 0) break;
    }

    return schedule;
};

export default function LoanScheduleDrawer({ open, loan, onClose }) {
    if (!loan) return null;

    // Get values from new API structure with fallbacks
    const caseNumber = loan.caseNumber || loan.PaddedCaseNumber || 'N/A';
    const amountApplied = loan.amountApplied || loan.AmountApplied || 0;
    const disbursedAmount = loan.disbursedAmount || loan.DisbursedAmount || 0;
    const apr = loan.apr || loan.LoanInterestAnnualPercentageRate || 0;
    const termMonths = loan.termMonths || loan.LoanRegistrationTermInMonths || 0;
    const monthlyPayback = loan.monthlyPayback || 0;
    const totalPayback = loan.totalPayback || 0;
    const totalInterest = loan.totalInterest || 0;
    const totalLoansBalance = loan.totalLoansBalance || loan.TotalLoansBalance || 0;
    const loanProductName = loan.loanProductName || loan.LoanProductDescription || 'N/A';
    const memberName = loan.member?.fullName || loan.CustomerIndividualFirstName || 'N/A';
    const memberNumber = loan.member?.memberNumber || 'N/A';

    // Generate schedule using actual values
    const schedule = generateRepaymentSchedule(
        disbursedAmount > 0 ? disbursedAmount : amountApplied,
        apr,
        termMonths,
        monthlyPayback
    );

    const exportPDF = () => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        let startY = 20;

        // Header
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Repayment Schedule", pageWidth / 2, startY, { align: "center" });
        startY += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Case Number: ${caseNumber}`, 14, startY);
        startY += 6;
        doc.text(`Member: ${memberName} (${memberNumber})`, 14, startY);
        startY += 6;
        doc.text(`Product: ${loanProductName}`, 14, startY);
        startY += 6;
        doc.text(`Amount: KES ${fmt(amountApplied)}`, 14, startY);
        startY += 6;
        doc.text(`Interest Rate: ${apr}%`, 14, startY);
        startY += 6;
        doc.text(`Term: ${termMonths} months`, 14, startY);
        startY += 6;

        if (totalLoansBalance > 0) {
            doc.text(`Remaining Balance: KES ${fmt(totalLoansBalance)}`, 14, startY);
            startY += 6;
        }

        doc.line(14, startY, pageWidth - 14, startY);
        startY += 8;

        // Summary Box
        const summaryY = startY;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Loan Summary", 14, summaryY);
        doc.setFont("helvetica", "normal");
        doc.text(`Total Payback: KES ${fmt(totalPayback || schedule.reduce((sum, s) => sum + s.payment, 0))}`, 14, summaryY + 6);
        doc.text(`Total Interest: KES ${fmt(totalInterest || schedule.reduce((sum, s) => sum + s.interest, 0))}`, 14, summaryY + 12);
        doc.text(`Monthly Payment: KES ${fmt(monthlyPayback || (schedule.length > 0 ? schedule[0].payment : 0))}`, 14, summaryY + 18);
        
        startY = summaryY + 28;

        // Table
        const tableData = schedule.map((s) => [
            s.month,
            fmt(s.payment),
            fmt(s.principal),
            fmt(s.interest),
            fmt(s.balance),
        ]);

        doc.autoTable({
            startY: startY,
            head: [["Month", "Payment (KES)", "Principal (KES)", "Interest (KES)", "Balance (KES)"]],
            body: tableData,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [79, 70, 229], textColor: 255 },
            columnStyles: {
                1: { halign: "right" },
                2: { halign: "right" },
                3: { halign: "right" },
                4: { halign: "right" },
            },
            margin: { left: 14, right: 14 },
            didDrawPage: (data) => {
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.text(
                    `Page ${doc.internal.getNumberOfPages()} - Generated: ${new Date().toLocaleString()}`,
                    data.settings.margin.left,
                    doc.internal.pageSize.height - 10
                );
            },
        });

        doc.save(`${caseNumber}-schedule.pdf`);
    };

    const exportCSV = () => {
        const headers = ["Month", "Payment (KES)", "Principal (KES)", "Interest (KES)", "Balance (KES)"];
        const rows = schedule.map((s) => [
            s.month,
            s.payment.toFixed(2),
            s.principal.toFixed(2),
            s.interest.toFixed(2),
            s.balance.toFixed(2),
        ]);

        const csvContent = [
            `Loan Schedule - Case ${caseNumber}`,
            `Member: ${memberName} (${memberNumber})`,
            `Product: ${loanProductName}`,
            `Amount: ${fmt(amountApplied)}`,
            `Interest Rate: ${apr}%`,
            `Term: ${termMonths} months`,
            '',
            headers.join(","),
            ...rows.map((r) => r.join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${caseNumber}-schedule.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Calculate totals
    const totalPayment = schedule.reduce((sum, s) => sum + s.payment, 0);
    const totalInterestCalc = schedule.reduce((sum, s) => sum + s.interest, 0);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/50 z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        className="fixed top-4 right-4 w-[92vw] max-w-[900px] h-[92vh]
                       bg-white shadow-2xl z-50 rounded-2xl flex flex-col overflow-hidden"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white p-5 flex-shrink-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold">Repayment Schedule</h2>
                                    <p className="text-indigo-200 text-sm">
                                        Case #{caseNumber} · {loanProductName}
                                    </p>
                                    <p className="text-indigo-200 text-xs mt-1">
                                        {memberName} ({memberNumber})
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={exportPDF}
                                        className="bg-white/20 hover:bg-white/30 text-white border-0"
                                    >
                                        <FaFilePdf className="mr-1" /> PDF
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={exportCSV}
                                        className="bg-white/20 hover:bg-white/30 text-white border-0"
                                    >
                                        <FaFileCsv className="mr-1" /> CSV
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={onClose}
                                        className="bg-white/20 hover:bg-white/30 text-white border-0"
                                    >
                                        <FaTimes className="mr-1" /> Close
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 border-b flex-shrink-0">
                            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                                <p className="text-xs text-gray-500">Total Payment</p>
                                <p className="text-lg font-bold text-indigo-700">KES {fmt(totalPayment)}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                                <p className="text-xs text-gray-500">Total Interest</p>
                                <p className="text-lg font-bold text-orange-600">KES {fmt(totalInterestCalc)}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                                <p className="text-xs text-gray-500">Monthly Payment</p>
                                <p className="text-lg font-bold text-green-600">KES {fmt(monthlyPayback || (schedule.length > 0 ? schedule[0].payment : 0))}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                                <p className="text-xs text-gray-500">Remaining Balance</p>
                                <p className={`text-lg font-bold ${totalLoansBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    KES {fmt(totalLoansBalance)}
                                </p>
                            </div>
                        </div>

                        {/* Body - Scrollable Table */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-800 text-white sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 text-left">#</th>
                                                <th className="px-4 py-3 text-right">Payment</th>
                                                <th className="px-4 py-3 text-right">Principal</th>
                                                <th className="px-4 py-3 text-right">Interest</th>
                                                <th className="px-4 py-3 text-right">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {schedule.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                                        No schedule available
                                                    </td>
                                                </tr>
                                            ) : (
                                                schedule.map((s, i) => (
                                                    <motion.tr
                                                        key={i}
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.01 }}
                                                        className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                                            }`}
                                                    >
                                                        <td className="px-4 py-2.5 font-mono text-xs text-gray-500">
                                                            {s.month}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right font-medium">
                                                            {fmt(s.payment)}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right text-gray-700">
                                                            {fmt(s.principal)}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right text-orange-600">
                                                            {fmt(s.interest)}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right font-bold">
                                                            <span className={s.balance <= 0 ? 'text-green-600' : 'text-gray-800'}>
                                                                {fmt(s.balance)}
                                                            </span>
                                                        </td>
                                                    </motion.tr>
                                                ))
                                            )}
                                        </tbody>
                                        {/* Footer row with totals */}
                                        {schedule.length > 0 && (
                                            <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                                                <tr>
                                                    <td className="px-4 py-2.5 font-bold text-gray-700">Totals</td>
                                                    <td className="px-4 py-2.5 text-right font-bold text-indigo-700">
                                                        {fmt(totalPayment)}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-bold text-gray-700">
                                                        {fmt(amountApplied)}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-bold text-orange-700">
                                                        {fmt(totalInterestCalc)}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-bold text-green-700">
                                                        {fmt(0)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>

                            {/* Loan Info Footer */}
                            <div className="mt-4 text-xs text-gray-400 text-center">
                                <p>
                                    Generated on {new Date().toLocaleString()} · 
                                    Case #{caseNumber} · 
                                    {schedule.length} payments · 
                                    Interest Rate: {apr}% · 
                                    Term: {termMonths} months
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}