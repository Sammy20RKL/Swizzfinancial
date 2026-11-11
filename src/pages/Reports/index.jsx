import React from "react";
import {
    FaFileExcel,
    FaFilePdf,
    FaFileWord,
} from "react-icons/fa";
import { FaDownload } from "react-icons/fa";
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
        api: "monthlyLoans", // <-- new API flag
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
// ===== CIC Monthly Loans API Download =====
const downloadCICMonthlyLoansExcel = async () => {
    try {
        const res = await fetch(
            `${import.meta.env.VITE_APP_REPORT_URL}/api/reporting/GetLoanSummary`,
            { headers: { "ngrok-skip-browser-warning": "true" } }
        );
        const data = await res.json();

        if (!data || !data.length) {
            alert("No data found to generate Excel file");
            return;
        }

        const headers = ["Member Name", "ID Number", "Loan Amount", "Repayment Period (Months)", "Date Loan Granted"];
        const worksheetData = [
            headers,
            ...data.map(item => [
                item.MemberName || "",
                item.IdNumber || "",
                item.LoanAmount || 0,
                item.RepaymentPeriodMonths || "",
                item.DateLoanGranted ? new Date(item.DateLoanGranted).toLocaleDateString() : "",
            ]),
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        worksheet["!cols"] = [
            { wch: 25 },
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
            `${import.meta.env.VITE_APP_REPORT_URL}/api/reporting/CICRUBANISACCODATARENEWALTEMPLATE`,
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
            `${import.meta.env.VITE_APP_REPORT_URL}/api/reporting/CICRUBANIYEARLYDATARENEWTEMPLATE`,
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


export default function Reports() {
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

                        {/* Download Button */}
                        {file.api === "renewal" ? (
                            <button onClick={downloadCICRenewalExcel} className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition">
                                <FaDownload />
                                Download Excel
                            </button>
                        ) : file.api === "yearly" ? (
                            <button onClick={downloadCICYearlyRenewExcel} className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition">
                                <FaDownload />
                                Download Excel
                            </button>
                        ) : file.api === "monthlyLoans" ? (
                            <button onClick={downloadCICMonthlyLoansExcel} className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition">
                                <FaDownload />
                                Download Excel
                            </button>
                        ) : (
                            <a
                                href={file.url}
                                download
                                className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition"
                            >
                                <FaDownload />
                                Download Excel
                            </a>
                        )}


                    </div>
                ))}
            </div>
        </div>
    );
}
