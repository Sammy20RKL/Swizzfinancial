

import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function MemberStatement({ customer }) {
    const [loading, setLoading] = useState(false);
    const [statementData, setStatementData] = useState(null);
    const [error, setError] = useState(null);

    /* ================= SEARCH & PAGINATION ================= */
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;

    const startDate = "2010-12-01";
    const endDate = "2027-12-31";

    console.log(customer.Id);

    useEffect(() => {
        if (!customer?.Id) return;

        const fetchStatement = async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch(
                    `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/customer-statement/by-customer/${customer.Id}?startDate=${startDate}&endDate=${endDate}`
                    //`${import.meta.env.VITE_APP_LOANING_URL}/api/customer-statement/by-customer/ef44e954-3db9-4123-bcb9-6567d4d0059c?startDate=2024-12-01&endDate=2026-12-31`
                );

                const data = await res.json();

                if (!data.success) {
                    throw new Error(data.message || "Failed to load statement");
                }

                setStatementData(data.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStatement();
    }, [customer?.Id]);


    /* ================= FILTER ================= */
    const filteredStatement = useMemo(() => {
        if (!statementData?.statement) return [];
        const term = search.toLowerCase();

        return statementData.statement.filter((row) =>
            row.Description?.toLowerCase().includes(term) ||
            row.Product?.toLowerCase().includes(term) ||
            row.Reference?.toLowerCase().includes(term)
        );
    }, [search, statementData]);

    /* ================= PAGINATION ================= */
    const totalPages = Math.ceil(filteredStatement.length / pageSize);
    const paginatedStatement = filteredStatement.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );


    const downloadPDF = async () => {
        if (!customer?.Id) return;

        try {
            const url = `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/customer-statement/pdf/${customer.Id}?startDate=${startDate}&endDate=${endDate}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Failed to download PDF");
            }

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `Account_Statement_${customerInfo?.Reference2 || customer.Id}.pdf`;

            document.body.appendChild(link);
            link.click();

            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error(error);
            alert("Unable to download statement");
        }
    };








    if (loading) return <p>Loading Entries...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!statementData) return null;

    const { customer: customerInfo, summary } = statementData;



    console.log(statementData);

    return (
        <div className="space-y-6 w">
            {/* ================= MEMBER INFO ================= */}
            {/* <div className="flex justify-end">
                <button
                    onClick={downloadPDF}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                    Download Full Statement PDF
                </button>

            </div> */}

            <div className="bg-gray-200 rounded-md p-3">
                <div className="border rounded p-4 bg-gray-50">
                    <h3 className="font-semibold mb-2 bg-gray-600 p-3 rounded-md text-white">Member Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <p><strong>Name:</strong> {customer.IndividualFirstName} {customer.IndividualLastName}</p>
                        <p><strong>ID No:</strong> {customerInfo.IndividualIdentityCardNumber}</p>
                        <p><strong>Phone:</strong> {customerInfo.AddressMobileLine}</p>
                        <p><strong>Acc No:</strong> {customerInfo.Reference1}</p>
                        <p><strong>Member No:</strong> {customerInfo.Reference2}</p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-200 rounded-2xl p-2 ">
                {/* ================= SEARCH + PDF ================= */}
                <div className="flex flex-col md:flex-row justify-between gap-3 p-4">
                    <input
                        type="text"
                        placeholder="Search by product, description or ref"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2 border rounded-lg text-sm w-full md:max-w-sm bg-gray-50"
                    />

                    {/* <button
                        onClick={downloadPDF}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                        Download PDF
                    </button> */}
                </div>

                {/* ================= TABLE ================= */}
                <div className="border rounded p-4 overflow-x-auto bg-gray-200">
                    <table className="w-full text-sm border">
                        <thead className="bg-gray-600 text-white">
                            <tr>
                                <th className="border border-gray-300 px-2 py-1">Date</th>
                                <th className="border border-gray-300 px-2 py-1">Product</th>
                                <th className="border border-gray-300 px-2 py-1">Description</th>
                                <th className="border border-gray-300 px-2 py-1">Ref</th>
                                <th className="border border-gray-300 px-2 py-1">Debit Amount</th>
                                <th className="border border-gray-300 px-2 py-1">Credit Amount</th>
                                <th className="border border-gray-300 px-2 py-1">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedStatement.map((row, index) => (
                                <tr key={index} className="bg-gray-50 border-t">
                                    <td className="border border-gray-600 px-2 py-1">{new Date(row.TransactionDate).toLocaleDateString()}</td>
                                    <td className="border border-gray-600 px-2 py-1">{row.Product}</td>
                                    <td className="border border-gray-600 px-2 py-1">{row.Description}</td>
                                    <td className="border border-gray-600 px-2 py-1">{row.Reference}</td>
                                    <td className="border border-gray-600 px-2 py-1">{row.Debit ? row.Debit.toLocaleString() : "-"}</td>
                                    <td className="border border-gray-600 px-2 py-1">{row.Credit ? row.Credit.toLocaleString() : "-"}</td>
                                    <td className="border border-gray-600 px-2 py-1">{row.RunningTotal.toLocaleString()}</td>

                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* ================= PAGINATION ================= */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-4">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => p - 1)}
                                className="px-3 py-1 border rounded disabled:opacity-50 bg-gray-800 text-white"
                            >
                                Prev
                            </button>

                            <span className="text-sm">
                                Page {currentPage} of {totalPages}
                            </span>

                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => p + 1)}
                                className="px-3 py-1 border rounded disabled:opacity-50 bg-gray-800 text-white"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ================= SUMMARY ================= */}
            <div className="bg-gray-400 rounded-md p-3">
                <div className="border rounded p-4 bg-gray-50">
                    <h3 className="font-semibold mb-2 bg-gray-600 p-3 rounded-md text-white">Entries Summary</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <p><strong>Total Transactions:</strong> {summary.TotalTransactions}</p>
                        <p><strong>Total Debit:</strong> {summary.TotalDebit.toLocaleString()}</p>
                        <p><strong>Total Credit:</strong> {summary.TotalCredit.toLocaleString()}</p>
                        <p><strong>Opening Balance:</strong> {summary.OpeningBalance.toLocaleString()}</p>
                        <p><strong>Closing Balance:</strong> {summary.ClosingBalance.toLocaleString()}</p>
                        <p><strong>Net Balance:</strong> {summary.NetBalance.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MemberStatement;
