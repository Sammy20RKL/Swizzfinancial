import React, { useState } from "react";
import {
    FaFileExcel,
    FaFilePdf,
    FaFileWord,
    FaEye,
    FaTimes,
    FaSpinner,
    FaPrint,
} from "react-icons/fa";
import { FaDownload } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const reports = [
    {
        id: 1,
        name: "CIC Rubani SACCO Renewal Template 2025",
        type: "excel",
        size: "1.2 MB",
        date: "12.01.2026",
        api: "renewal",
    },
    {
        id: 2,
        name: "CIC Rubani Yearly Data Renew Template",
        type: "excel",
        size: "850 KB",
        date: "11.01.2026",
        api: "yearly",
    },
    {
        id: 3,
        name: "CIC-RUBANI-MONTHLYLOANS REPORTS",
        type: "excel",
        size: "1.2 MB",
        date: "12.01.2026",
        api: "monthlyLoans",
    },
];

const fileIcon = (type) => {
    switch (type) {
        case "excel":
            return <FaFileExcel className="text-green-600 text-4xl" />;
        case "pdf":
            return <FaFilePdf className="text-red-600 text-4xl" />;
        case "doc":
            return <FaFileWord className="text-blue-600 text-4xl" />;
        default:
            return null;
    }
};

// Format currency helper
const formatCurrency = (amount) => {
    return (amount || 0).toLocaleString("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

// ===== CIC Monthly Loans API Download =====
const downloadCICMonthlyLoansExcel = async () => {
    try {
        const res = await fetch(
            "https://localhost:44327/api/reporting/GetLoanSummary",
            { headers: { "ngrok-skip-browser-warning": "true" } }
        );
        const data = await res.json();

        if (!data || !data.length) {
            alert("No data found to generate Excel file");
            return;
        }

        const headers = ["Member Name", "ID Number", "Member Number", "Loan Amount", "Repayment Period (Months)", "Date Loan Granted"];
        const worksheetData = [
            headers,
            ...data.map(item => [
                item.MemberName || "",
                item.IdNumber || "",
                item.MemberNumber || "",
                item.LoanAmount || 0,
                item.RepaymentPeriodMonths || "",
                item.DateLoanGranted ? new Date(item.DateLoanGranted).toLocaleDateString() : "",
            ]),
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        worksheet["!cols"] = [
            { wch: 25 },
            { wch: 15 },
            { wch: 12 },
            { wch: 15 },
            { wch: 20 },
            { wch: 18 },
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "CIC Monthly Loans");

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const file = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(file, "CIC_RUBANI_MONTHLY_LOANS_REPORT.xlsx");
    } catch (error) {
        console.error(error);
        alert("Failed to generate Excel file");
    }
};

// ===== CIC Renewal API Download =====
const downloadCICRenewalExcel = async () => {
    try {
        const res = await fetch(
            "https://localhost:44327/api/reporting/CICRUBANISACCODATARENEWALTEMPLATE",
            { headers: { "ngrok-skip-browser-warning": "true" } }
        );
        const data = await res.json();

        const worksheetData = [
            [
                "Total Membership",
                "Main Members Occupation",
                "Total Outstanding Loans (Active)",
                "Maximum Loan Repayment",
                "Maximum Outstanding Individual Loan",
                "Total Outstanding Loans For Members Above 75",
            ],
            [
                data.TotalMembership,
                data.MainMembersOccupation,
                data.TotalOutstandingLoansForActive,
                data.MaximumLoanRepayment,
                data.MaximumOutstandingIndividualLoan,
                data.TotalOutstandingLoansForMembersAbove75,
            ],
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        worksheet["!cols"] = [
            { wch: 20 },
            { wch: 28 },
            { wch: 35 },
            { wch: 25 },
            { wch: 38 },
            { wch: 40 },
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "CIC Renewal Data 2025");

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const file = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(file, "CIC_RUBANI_SACCO_RENEWAL_TEMPLATE_2025.xlsx");
    } catch (error) {
        console.error(error);
        alert("Failed to generate Excel file");
    }
};

// ===== CIC Yearly Data API Download =====
const downloadCICYearlyRenewExcel = async () => {
    try {
        const res = await fetch(
            "https://localhost:44327/api/reporting/CICRUBANIYEARLYDATARENEWTEMPLATE",
            { headers: { "ngrok-skip-browser-warning": "true" } }
        );
        const data = await res.json();

        if (!data || !data.length) {
            alert("No data found to generate Excel file");
            return;
        }

        const headers = [
            "Full Name",
            "ID Number",
            "Member Number",
            "Date of Birth",
            "Gender",
            "Original Loan Term",
            "Loan Issue Date",
            "Original Loan Amount",
            "Outstanding Loan Balance",
            "Outstanding Loan Term",
            "Outstanding Deposit Balance",
            "Interest Rate Applicable",
        ];

        const worksheetData = [
            headers,
            ...data.map(member => [
                member.FullName || "",
                member.IdNumber || "",
                member.MemberNumber || "",
                member.DateOfBirth ? new Date(member.DateOfBirth).toLocaleDateString() : "",
                member.Gender === "1" ? "Male" : member.Gender === "2" ? "Female" : "",
                member.OriginalLoanTerm || 0,
                member.LoanIssueDate ? new Date(member.LoanIssueDate).toLocaleDateString() : "",
                member.OriginalLoanAmount || 0,
                member.OutstandingLoanBalance || 0,
                member.OutstandingLoanTerm || 0,
                member.OutstandingDepositBalance || 0,
                member.InterestRateApplicable || "",
            ]),
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        worksheet["!cols"] = [
            { wch: 20 },
            { wch: 15 },
            { wch: 12 },
            { wch: 15 },
            { wch: 8 },
            { wch: 12 },
            { wch: 15 },
            { wch: 18 },
            { wch: 20 },
            { wch: 18 },
            { wch: 22 },
            { wch: 18 },
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "CIC Yearly Data Renew 2025");

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const file = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(file, "CIC_RUBANI_YEARLY_DATA_RENEW_TEMPLATE_2025.xlsx");
    } catch (error) {
        console.error(error);
        alert("Failed to generate Excel file");
    }
};

// ===== Preview Data Fetch Functions =====
const fetchRenewalPreview = async () => {
    const res = await fetch(
        "https://localhost:44327/api/reporting/CICRUBANISACCODATARENEWALTEMPLATE",
        { headers: { "ngrok-skip-browser-warning": "true" } }
    );
    return await res.json();
};

const fetchYearlyPreview = async () => {
    const res = await fetch(
        "https://localhost:44327/api/reporting/CICRUBANIYEARLYDATARENEWTEMPLATE",
        { headers: { "ngrok-skip-browser-warning": "true" } }
    );
    return await res.json();
};

const fetchMonthlyLoansPreview = async () => {
    const res = await fetch(
        "https://localhost:44327/api/reporting/GetLoanSummary",
        { headers: { "ngrok-skip-browser-warning": "true" } }
    );
    return await res.json();
};

// Preview Modal Component (Similar to PDF preview style)
const PreviewModal = ({ isOpen, onClose, title, data, type, loading, onPrint, onDownload }) => {
    if (!isOpen) return null;

    const renderPreviewContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-20">
                    <FaSpinner className="animate-spin text-indigo-600 text-5xl mb-4" />
                    <p className="text-gray-600">Loading preview data...</p>
                </div>
            );
        }

        if (!data || (Array.isArray(data) && data.length === 0)) {
            return (
                <div className="text-center py-20">
                    <p className="text-gray-500">No data available for preview</p>
                </div>
            );
        }

        // Render Renewal Preview (Single row data)
        if (type === "renewal") {
            return (
                <div className="bg-white rounded-lg">
                    <h3 className="font-bold text-lg mb-4 text-indigo-800">Renewal Summary Report</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <p className="text-sm text-gray-600 mb-1">Total Membership</p>
                            <p className="text-2xl font-bold text-indigo-700">{data.TotalMembership?.toLocaleString() || 0}</p>
                        </div>
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <p className="text-sm text-gray-600 mb-1">Main Members Occupation</p>
                            <p className="text-lg font-semibold">{data.MainMembersOccupation || "-"}</p>
                        </div>
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <p className="text-sm text-gray-600 mb-1">Total Outstanding Loans (Active)</p>
                            <p className="text-xl font-bold text-orange-600">KES {formatCurrency(data.TotalOutstandingLoansForActive)}</p>
                        </div>
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <p className="text-sm text-gray-600 mb-1">Maximum Loan Repayment</p>
                            <p className="text-xl font-bold text-green-600">KES {formatCurrency(data.MaximumLoanRepayment)}</p>
                        </div>
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <p className="text-sm text-gray-600 mb-1">Maximum Outstanding Individual Loan</p>
                            <p className="text-xl font-bold text-red-600">KES {formatCurrency(data.MaximumOutstandingIndividualLoan)}</p>
                        </div>
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <p className="text-sm text-gray-600 mb-1">Total Outstanding Loans For Members Above 75</p>
                            <p className="text-xl font-bold text-purple-600">KES {formatCurrency(data.TotalOutstandingLoansForMembersAbove75)}</p>
                        </div>
                    </div>
                </div>
            );
        }

        // Render Yearly Preview (Array of members)
        if (type === "yearly" && Array.isArray(data)) {
            const previewData = data.slice(0, 15);
            return (
                <div className="bg-white rounded-lg">
                    <h3 className="font-bold text-lg mb-4 text-indigo-800">Yearly Renewal Data Preview</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 text-sm">
                            <thead className="bg-indigo-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left font-semibold text-indigo-700 border">#</th>
                                    <th className="px-3 py-2 text-left font-semibold text-indigo-700 border">Full Name</th>
                                    <th className="px-3 py-2 text-left font-semibold text-indigo-700 border">ID Number</th>
                                    <th className="px-3 py-2 text-left font-semibold text-indigo-700 border">Member No</th>
                                    <th className="px-3 py-2 text-left font-semibold text-indigo-700 border">Gender</th>
                                    <th className="px-3 py-2 text-left font-semibold text-indigo-700 border">Original Loan Amount</th>
                                    <th className="px-3 py-2 text-left font-semibold text-indigo-700 border">Outstanding Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.map((member, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 border">{idx + 1}</td>
                                        <td className="px-3 py-2 border">{member.FullName || "-"}</td>
                                        <td className="px-3 py-2 border">{member.IdNumber || "-"}</td>
                                        <td className="px-3 py-2 border">{member.MemberNumber || "-"}</td>
                                        <td className="px-3 py-2 border">
                                            {member.Gender === "1" ? "Male" : member.Gender === "2" ? "Female" : "-"}
                                        </td>
                                        <td className="px-3 py-2 border">KES {formatCurrency(member.OriginalLoanAmount)}</td>
                                        <td className="px-3 py-2 border">KES {formatCurrency(member.OutstandingLoanBalance)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {data.length > 15 && (
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Showing 15 of {data.length} records. Download full report for complete data.
                            </p>
                        )}
                    </div>
                </div>
            );
        }

        // Render Monthly Loans Preview (Array of loans)
        if (type === "monthlyLoans" && Array.isArray(data)) {
            const previewData = data.slice(0, 15);
            return (
                <div className="bg-white rounded-lg">
                    <h3 className="font-bold text-lg mb-4 text-indigo-800">Monthly Loans Report Preview</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 text-sm">
                            <thead className="bg-indigo-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left font-semibold text-indigo-700 border">#</th>
                                    <th className="px-3 py-2 text-left font-semibold text-indigo-700 border">Member Name</th>
                                    <th className="px-3 py-2 text-left font-semibold text-indigo-700 border">ID Number</th>
                                    <th className="px-3 py-2 text-left font-semibold text-indigo-700 border">Member Number</th>
                                    <th className="px-3 py-2 text-left font-semibold text-indigo-700 border">Loan Amount</th>
                                    <th className="px-3 py-2 text-left font-semibold text-indigo-700 border">Repayment Period</th>
                                    <th className="px-3 py-2 text-left font-semibold text-indigo-700 border">Date Granted</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.map((loan, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 border">{idx + 1}</td>
                                        <td className="px-3 py-2 border">{loan.MemberName || "-"}</td>
                                        <td className="px-3 py-2 border">{loan.IdNumber || "-"}</td>
                                        <td className="px-3 py-2 border">{loan.MemberNumber || "-"}</td>
                                        <td className="px-3 py-2 border">KES {formatCurrency(loan.LoanAmount)}</td>
                                        <td className="px-3 py-2 border">{loan.RepaymentPeriodMonths || "-"} months</td>
                                        <td className="px-3 py-2 border">
                                            {loan.DateLoanGranted ? new Date(loan.DateLoanGranted).toLocaleDateString() : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {data.length > 15 && (
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Showing 15 of {data.length} records. Download full report for complete data.
                            </p>
                        )}
                    </div>
                </div>
            );
        }

        return <p className="text-center py-20 text-gray-500">Preview not available for this report type</p>;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/60 z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="fixed z-50 top-1/2 left-1/2 w-[95vw] max-w-6xl h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col"
                        initial={{ scale: 0.9, opacity: 0, y: "-50%", x: "-50%" }}
                        animate={{ scale: 1, opacity: 1, y: "-50%", x: "-50%" }}
                        exit={{ scale: 0.9, opacity: 0, y: "-50%", x: "-50%" }}
                        style={{ transform: "translate(-50%, -50%)" }}
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-4 border-b bg-indigo-700 rounded-t-xl">
                            <h3 className="text-lg font-semibold text-white">
                                Preview: {title}
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={onPrint}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md flex items-center gap-2 transition"
                                >
                                    <FaPrint /> Print
                                </button>
                                <button
                                    onClick={onClose}
                                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md transition"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content - Scrollable Preview */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
                            <div className="bg-white p-6 shadow-lg rounded-lg mx-auto">
                                {renderPreviewContent()}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
                            <Button
                                variant="outline"
                                onClick={onClose}
                            >
                                Close
                            </Button>
                            <Button
                                onClick={onPrint}
                                className="bg-gray-600 hover:bg-gray-700"
                            >
                                <FaPrint className="mr-2" /> Print
                            </Button>
                            <Button
                                onClick={onDownload}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <FaDownload className="mr-2" /> Download Excel
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default function LoanReports() {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [previewTitle, setPreviewTitle] = useState("");
    const [previewType, setPreviewType] = useState("");
    const [previewLoading, setPreviewLoading] = useState(false);
    const [currentReport, setCurrentReport] = useState(null);

    const handlePreview = async (report) => {
        setPreviewOpen(true);
        setPreviewTitle(report.name);
        setPreviewType(report.api);
        setPreviewLoading(true);
        setPreviewData(null);
        setCurrentReport(report);

        try {
            let data = null;
            if (report.api === "renewal") {
                data = await fetchRenewalPreview();
            } else if (report.api === "yearly") {
                data = await fetchYearlyPreview();
            } else if (report.api === "monthlyLoans") {
                data = await fetchMonthlyLoansPreview();
            }
            setPreviewData(data);
        } catch (error) {
            console.error("Preview error:", error);
            setPreviewData(null);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleClosePreview = () => {
        setPreviewOpen(false);
        setPreviewData(null);
        setPreviewTitle("");
        setPreviewType("");
        setPreviewLoading(false);
        setCurrentReport(null);
    };

    const handlePrint = () => {
        const printContent = document.querySelector('.flex-1.overflow-y-auto');
        if (printContent) {
            const originalTitle = document.title;
            document.title = previewTitle;
            
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${previewTitle}</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                padding: 20px;
                            }
                            table {
                                border-collapse: collapse;
                                width: 100%;
                            }
                            th, td {
                                border: 1px solid #ddd;
                                padding: 8px;
                                text-align: left;
                            }
                            th {
                                background-color: #f2f2f2;
                            }
                            @media print {
                                body {
                                    padding: 0;
                                }
                                button {
                                    display: none;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        ${printContent.innerHTML}
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
            document.title = originalTitle;
        }
    };

    const handleDownload = () => {
        if (currentReport) {
            if (currentReport.api === "renewal") {
                downloadCICRenewalExcel();
            } else if (currentReport.api === "yearly") {
                downloadCICYearlyRenewExcel();
            } else if (currentReport.api === "monthlyLoans") {
                downloadCICMonthlyLoansExcel();
            }
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen m-8 rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">Loan Reports</h2>
            </div>

            {/* Files Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 bg-gray-300 rounded-2xl p-4">
                {reports.map((file) => (
                    <div key={file.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition p-4 relative">
                        <div className="flex justify-center mb-4">{fileIcon(file.type)}</div>

                        <div className="text-center mb-4">
                            <p className="font-medium text-sm truncate">{file.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{file.size} • {file.date}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            {/* Preview Button */}
                            <button
                                onClick={() => handlePreview(file)}
                                className="flex items-center justify-center gap-2 flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg transition"
                            >
                                <FaEye />
                                Preview
                            </button>

                            {/* Download Button */}
                            {file.api === "renewal" ? (
                                <button onClick={downloadCICRenewalExcel} className="flex items-center justify-center gap-2 flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition">
                                    <FaDownload />
                                    Download
                                </button>
                            ) : file.api === "yearly" ? (
                                <button onClick={downloadCICYearlyRenewExcel} className="flex items-center justify-center gap-2 flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition">
                                    <FaDownload />
                                    Download
                                </button>
                            ) : file.api === "monthlyLoans" ? (
                                <button onClick={downloadCICMonthlyLoansExcel} className="flex items-center justify-center gap-2 flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition">
                                    <FaDownload />
                                    Download
                                </button>
                            ) : (
                                <a
                                    href={file.url}
                                    download
                                    className="flex items-center justify-center gap-2 flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition"
                                >
                                    <FaDownload />
                                    Download
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Preview Modal */}
            <PreviewModal
                isOpen={previewOpen}
                onClose={handleClosePreview}
                title={previewTitle}
                data={previewData}
                type={previewType}
                loading={previewLoading}
                onPrint={handlePrint}
                onDownload={handleDownload}
            />
        </div>
    );
}