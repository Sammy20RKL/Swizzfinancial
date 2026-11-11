


import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../../../assets/rubanilogo.jpeg";


function ViewDetailPostedReceipt({ open, onClose, receiptId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !receiptId) return;

        const fetchDetails = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_APP_FIN_URL}/api/customer-receipts/${receiptId}/with-details`,
                );
                const json = await res.json();
                setData(json.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [open, receiptId]);

    /* ================= PDF DOWNLOAD ================= */
    const downloadPDF = () => {
        if (!data) return;

        const doc = new jsPDF("p", "mm", "a4");

        const left = 15;
        const right = 195;
        let y = 15;

        /* ===== LOGO / HEADER (MATCHES generateReceiptPDF) ===== */

        // Logo dimensions
        const logoWidth = 35;
        const logoHeight = 15;

        // Page center
        const pageCenterX = 105;
        const logoX = pageCenterX - logoWidth / 2;

        // Add logo (TOP CENTER)
        doc.addImage(logo, "PNG", logoX, y, logoWidth, logoHeight);

        // Move cursor below logo
        y += logoHeight + 6;

        // SACCO name
        doc.setFontSize(12);
        doc.setFont("times", "bold");
        doc.text("RUBANI SACCO", pageCenterX, y, { align: "center" });

        y += 6;
        doc.setFontSize(9);
        doc.setFont("times", "normal");
        doc.text("Giving wings to your savings", pageCenterX, y, { align: "center" });

        y += 8;
        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text("POSTED RECEIPT", pageCenterX, y, { align: "center" });

        // Divider line
        doc.line(left, y + 2, right, y + 2);
        y += 10;



        /* ===== RECEIPT DETAILS (SIDE BY SIDE) ===== */

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Receipt Details", left, y);
        y += 8;

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");

        // Column positions
        const col1LabelX = left;
        const col1ValueX = left + 35;

        const col2LabelX = 110;
        const col2ValueX = col2LabelX + 35;

        // Row 1
        doc.setFont("helvetica", "bold");
        doc.text("Reference:", col1LabelX, y);
        doc.text("Posting Period:", col2LabelX, y);

        doc.setFont("helvetica", "normal");
        doc.text(data.receipt.Reference, col1ValueX, y);
        doc.text(data.receipt.PostingPeriodDescription, col2ValueX, y);

        y += 6;

        // Row 2
        doc.setFont("helvetica", "bold");
        doc.text("Branch:", col1LabelX, y);
        doc.text("Transaction:", col2LabelX, y);

        doc.setFont("helvetica", "normal");
        doc.text(data.receipt.BranchDescription, col1ValueX, y);
        doc.text(data.receipt.TransactionCodeDescription, col2ValueX, y);

        y += 6;

        // Row 3
        doc.setFont("helvetica", "bold");
        doc.text("Total Amount (KES):", col1LabelX, y);

        doc.setFont("helvetica", "normal");
        doc.text(
            Number(data.receipt.TotalValue).toLocaleString(),
            col1ValueX,
            y
        );

        y += 10;


        // y = doc.lastAutoTable.finalY + 10;
        // Divider line
        doc.line(left, y + 2, right, y + 2);
        y += 10;

        /* ===== JOURNAL ENTRIES ===== */
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Journal Entries", left, y);
        y += 5;

        autoTable(doc, {
            startY: y,
            head: [["Account", "Contra Account", "Amount"]],
            body: data.entries.map((e) => [
                e.ChartOfAccountName,
                e.ContraChartOfAccountName,
                Number(e.Amount).toLocaleString(),
            ]),
            theme: "striped",
            styles: { fontSize: 9 },
            headStyles: {
                fillColor: [79, 70, 229],
                textColor: 255,
                fontStyle: "bold",
            },
            columnStyles: {
                2: { halign: "right" },
            },
            margin: { left, right: 15 },
        });

        y = doc.lastAutoTable.finalY + 10;

        /* ===== FOOTER ===== */
        const pages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont("times", "normal");
            doc.text(
                `Generated on ${new Date().toLocaleString()} | Page ${i} of ${pages}`,
                105,
                290,
                { align: "center" }
            );
        }

        doc.save(`Receipt_${data.receipt.Reference}.pdf`);
    };


    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/30 z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onClose(false)}
                    />

                    {/* DRAWER */}
                    <motion.div
                        className="fixed top-3 right-3 w-[85vw] max-w-[900px] bg-white shadow-2xl z-50 flex flex-col rounded-2xl h-[94vh] overflow-hidden"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 26 }}
                    >
                        {/* Header */}
                        <div className="bg-gray-200 m-3 rounded-md">
                            <div className="p-4 bg-indigo-700 text-white flex justify-between items-center m-3 rounded-md">
                                <h2 className="font-bold text-lg">Receipt Details</h2>

                                <div className="flex gap-2">


                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-gray-800"
                                        onClick={() => onClose(false)}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5 overflow-y-auto flex-1">
                                {loading ? (
                                    <p className="text-sm text-gray-500">Loading receipt...</p>
                                ) : !data ? (
                                    <p className="text-sm text-gray-500">No data found</p>
                                ) : (
                                    <>
                                        {/* Receipt Header */}
                                        <div className="bg-white p-4 rounded-lg border mb-4 text-sm grid grid-cols-2">
                                            <p className="p-2"><strong>Reference:</strong> {data.receipt.Reference}</p>
                                            <p className="p-2"><strong>Branch:</strong> {data.receipt.BranchDescription}</p>
                                            <p className="p-2"><strong>Posting Period:</strong> {data.receipt.PostingPeriodDescription}</p>
                                            <p className="p-2"><strong>Transaction:</strong> {data.receipt.TransactionCodeDescription}</p>
                                            <p className="font-semibold text-green-700 p-2">
                                                Amount: KES {data.receipt.TotalValue.toLocaleString()}
                                            </p>
                                        </div>

                                        {/* Journal Entries */}
                                        <div className="bg-white p-4 rounded-lg border mb-4">
                                            <h4 className="font-semibold mb-2">Journal Entries</h4>
                                            <table className="w-full text-sm border">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="border px-2 py-1">Account</th>
                                                        <th className="border px-2 py-1">Contra</th>
                                                        <th className="border px-2 py-1 text-right">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.entries.map((e) => (
                                                        <tr key={e.Id}>
                                                            <td className="border px-2 py-1">{e.ChartOfAccountName}</td>
                                                            <td className="border px-2 py-1">{e.ContraChartOfAccountName}</td>
                                                            <td
                                                                className={`border px-2 py-1 text-right font-medium ${e.Amount < 0 ? "text-red-600" : "text-green-700"
                                                                    }`}
                                                            >
                                                                {e.Amount.toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Summary */}
                                        <div className="bg-white p-4 rounded-lg border text-sm">
                                            <p><strong>Total Entries:</strong> {data.summary.TotalEntries}</p>
                                            {/* <p><strong>Min:</strong> {data.summary.MinAmount}</p>
                                            <p><strong>Max:</strong> {data.summary.MaxAmount}</p>
                                            <p><strong>Average:</strong> {data.summary.AverageAmount}</p> */}
                                        </div>
                                        <div className="mt-3 flex items-center justify-end">
                                            <Button
                                                size="sm"
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                                onClick={downloadPDF}
                                                disabled={!data}
                                            >
                                                Download PDF
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default ViewDetailPostedReceipt;
