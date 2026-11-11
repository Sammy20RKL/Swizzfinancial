import React, { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function MemberAccountsTab({ accounts, memberName }) {
    const [search, setSearch] = useState("");
    const accountList = accounts ?? [];

    const [showDateModal, setShowDateModal] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    /* ================= SEARCH FILTER ================= */
    const filteredAccounts = useMemo(() => {
        const term = search.toLowerCase();
        return accountList.filter((acc) => {
            const productDesc = acc.productDescription || acc.ProductDescription || "";
            return productDesc.toLowerCase().includes(term);
        });
    }, [search, accountList]);

    /* ================= HELPER: Get Account Balance ================= */
    const getBalance = (acc) => {
        return Number(acc.balance || acc.AccountBalance || 0);
    };

    /* ================= HELPER: Get Status Badge Color ================= */
    const getBalanceStatus = (acc) => {
        const balance = getBalance(acc);
        const productDesc = acc.productDescription || acc.ProductDescription || "";
        
        // For DEPOSITS, SHARE CAPITAL, and M-Wallet, show green if positive
        if (productDesc === "DEPOSITS" || productDesc === "SHARE CAPITAL" || productDesc === "M-Wallet") {
            return balance > 0 ? "text-green-600" : balance < 0 ? "text-red-600" : "text-gray-400";
        }
        // For other accounts, show red if negative
        return balance > 0 ? "text-green-600" : balance < 0 ? "text-red-600" : "text-gray-400";
    };

    /* ================= HELPER: Get formatted balance ================= */
    const getFormattedBalance = (acc) => {
        const balance = getBalance(acc);
        return `Ksh ${Math.abs(balance).toLocaleString()}`;
    };

    /* ================= PDF EXPORT ================= */
    const handleDownloadPDF = () => {
        const doc = new jsPDF("p", "mm", "a4");

        doc.setFontSize(16);
        doc.text("Member Accounts", 14, 15);

        if (memberName) {
            doc.setFontSize(12);
            doc.text(memberName, 14, 23);
        }

        doc.setFontSize(10);
        doc.text(
            `Generated on: ${new Date().toLocaleDateString()}`,
            14,
            memberName ? 29 : 22
        );

        // Show ALL accounts (including zero balance)
        const allAccounts = filteredAccounts;

        autoTable(doc, {
            startY: memberName ? 36 : 30,
            head: [["Product", "Balance"]],
            body: allAccounts.map((acc) => {
                const balance = getBalance(acc);
                return [
                    acc.productDescription || acc.ProductDescription || "N/A",
                    balance === 0 ? "0.00" : Math.abs(balance).toLocaleString(),
                ];
            }),
            theme: "striped",
            headStyles: {
                fillColor: [55, 65, 81],
                textColor: 255,
            },
            styles: {
                fontSize: 10,
            },
            columnStyles: {
                1: { halign: "right" },
            },
        });

        doc.save("Member_Accounts.pdf");
    };

    // Show ALL accounts (no filtering by zero balance)
    const displayAccounts = useMemo(() => {
        return filteredAccounts;
    }, [filteredAccounts]);

    if (accountList.length === 0) {
        return <p className="text-sm text-gray-500">No accounts available</p>;
    }

    const downloadRowPDF = async () => {
        if (!selectedAccountId || !startDate || !endDate) {
            alert("Please select start and end dates");
            return;
        }

        try {
            const url =
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}` +
                `/api/values/GetCustomerShareStatement/${selectedAccountId}` +
                `?startDate=${startDate}` +
                `&endDate=${endDate}` +
                `&downloadPdf=true`;

            const res = await fetch(url, {
                headers: { "ngrok-skip-browser-warning": "true" },
            });

            if (!res.ok) throw new Error("Failed to download PDF");

            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `Statement_${selectedAccountId}.pdf`;
            document.body.appendChild(link);
            link.click();

            link.remove();
            URL.revokeObjectURL(blobUrl);

            setShowDateModal(false);
            setStartDate("");
            setEndDate("");
        } catch (err) {
            console.error(err);
            alert("Unable to download PDF");
        }
    };

    return (
        <div className="border rounded-lg bg-gray-200 p-4">
            <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Search by product name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:max-w-xs px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                />

                <button
                    onClick={handleDownloadPDF}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow"
                >
                    Download PDF
                </button>
            </div>

            <div className="overflow-x-auto rounded-lg">
                <table className="w-full text-sm">
                    <thead className="bg-gray-700 text-white">
                        <tr>
                            <th className="p-2 text-left">Product</th>
                            <th className="p-2 text-right">Balance</th>
                            <th className="p-2 text-center">Action</th>
                        </tr>
                    </thead>

                    <tbody className="bg-gray-50">
                        {displayAccounts.map((acc, i) => {
                            const accountId = acc.accountId || acc.AccountId || acc.Id || acc.id;
                            const productDesc = acc.productDescription || acc.ProductDescription || "N/A";
                            const balance = getBalance(acc);
                            const statusColor = getBalanceStatus(acc);
                            const formattedBalance = getFormattedBalance(acc);
                            
                            return (
                                <tr key={i} className="border-t hover:bg-gray-100">
                                    <td className="p-2 font-medium">{productDesc}</td>
                                    <td className={`p-2 text-right font-semibold ${statusColor}`}>
                                        {formattedBalance}
                                    </td>
                                    <td className="p-2 text-center space-x-2">
                                        {balance !== 0 && (
                                            <button
                                                onClick={() => {
                                                    setSelectedAccountId(accountId);
                                                    setShowDateModal(true);
                                                }}
                                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-white text-xs"
                                            >
                                                Account Statement PDF
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {showDateModal && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-20 flex items-center justify-end pr-10 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-5">
                        <h3 className="text-lg font-semibold mb-4">
                            Select Statement Period
                        </h3>

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-gray-600">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-gray-600">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-5">
                            <button
                                onClick={() => setShowDateModal(false)}
                                className="px-4 py-2 text-sm rounded-md border"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={downloadRowPDF}
                                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
                            >
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}