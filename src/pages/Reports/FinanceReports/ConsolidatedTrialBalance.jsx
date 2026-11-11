import React, { useEffect, useState } from "react";
import logo from "../../../assets/rubanilogo.jpeg";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    FaEye,
    FaDownload,
    FaTimes,
    FaSync,
    FaPrint,
    FaCheckCircle,
    FaExclamationTriangle,
} from "react-icons/fa";
import Swal from "sweetalert2";

function ConsolidatedTrialBalance() {
    const [data, setData] = useState(null);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // ---- Fetch trial balance whenever endDate changes ----
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [endDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_APP_REPORT_URL}/api/reporting/ConsolidatedTrialBalance?endDate=${endDate}`,
                { headers: { "ngrok-skip-browser-warning": "true" } }
            );
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const result = await response.json();
            console.log("API Response:", result);
            setData(result);
        } catch (error) {
            console.error("Error fetching trial balance:", error);
            Swal.fire("Error", "Failed to fetch trial balance.", "error");
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined || amount === 0) return "-";
        return Number(amount).toLocaleString("en-KE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const getGroupedEntries = () => {
        if (!data?.Entries) return [];
        const order = ["Assets", "Liabilities", "Equity", "Income", "Expenses"];
        const map = {};
        data.Entries.forEach((e) => {
            const key = e.AccountTypeCode;
            if (!map[key]) map[key] = [];
            map[key].push(e);
        });
        return order
            .filter((name) => map[name] && map[name].length > 0)
            .map((name) => ({ name, entries: map[name] }));
    };

    const getSectionTotals = (entries) => {
        const totalDebit = entries.reduce((s, e) => s + Number(e.Debit || 0), 0);
        const totalCredit = entries.reduce((s, e) => s + Number(e.Credit || 0), 0);
        return { totalDebit, totalCredit };
    };

    const hasData = !!data?.Entries && data.Entries.length > 0;

    // ── PDF ──
    const generatePDF = (autoPrint = false) => {
        const doc = new jsPDF("p", "pt", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const LEFT = 40;
        const RIGHT = 40;
        const TABLE_WIDTH = pageWidth - LEFT - RIGHT;

        const img = new Image();
        img.src = logo;

        return new Promise((resolve) => {
            img.onload = () => {
                let y = 30;

                doc.addImage(img, "JPEG", (pageWidth - 130) / 2, y, 130, 60);
                y += 80;

                doc.setFont("times", "bold");
                doc.setFontSize(14);
                doc.text("RUBANI SACCO LIMITED", pageWidth / 2, y, { align: "center" });

                y += 18;
                doc.setFont("times", "normal");
                doc.setFontSize(11);
                doc.text(
                    `CONSOLIDATED TRIAL BALANCE AS AT ${new Date(endDate).toLocaleDateString()}`,
                    pageWidth / 2,
                    y,
                    { align: "center" }
                );

                y += 20;

                const body = [];
                const rowMeta = [];

                const grouped = getGroupedEntries();

                grouped.forEach(({ name, entries }, sectionIdx) => {
                    if (sectionIdx > 0) {
                        body.push(["", "", "", ""]);
                        rowMeta.push({ type: "spacer" });
                    }

                    body.push(["", name.toUpperCase(), "", ""]);
                    rowMeta.push({ type: "section" });

                    entries.forEach((e) => {
                        body.push([
                            e.AccountCode || "",
                            e.AccountName || "",
                            e.Debit ? formatCurrency(e.Debit) : "",
                            e.Credit ? formatCurrency(e.Credit) : "",
                        ]);
                        rowMeta.push({ type: "leaf" });
                    });

                    const t = getSectionTotals(entries);
                    body.push([
                        "",
                        `Total ${name}`,
                        formatCurrency(t.totalDebit),
                        formatCurrency(t.totalCredit),
                    ]);
                    rowMeta.push({ type: "subtotal" });
                });

                body.push([
                    "",
                    "GRAND TOTALS",
                    formatCurrency(data.TotalDebit),
                    formatCurrency(data.TotalCredit),
                ]);
                rowMeta.push({ type: "grandtotal" });

                autoTable(doc, {
                    startY: y,
                    head: [["AccNo", "Account Name", "DEBIT (KES)", "CREDIT (KES)"]],
                    body,
                    theme: "grid",
                    tableWidth: TABLE_WIDTH,
                    styles: {
                        font: "times",
                        fontSize: 9,
                        cellPadding: 3,
                        lineWidth: 0.25,
                        lineColor: [180, 180, 180],
                        textColor: [0, 0, 0],
                    },
                    headStyles: {
                        fillColor: [30, 30, 60],
                        textColor: [255, 255, 255],
                        fontStyle: "bold",
                        fontSize: 9,
                        lineWidth: 0.5,
                    },
                    columnStyles: {
                        0: { cellWidth: 70 },
                        1: { cellWidth: 250 },
                        2: { cellWidth: 105, halign: "right" },
                        3: { cellWidth: 105, halign: "right" },
                    },
                    didParseCell: (cellData) => {
                        const meta = rowMeta[cellData.row.index];
                        if (!meta) return;
                        switch (meta.type) {
                            case "section":
                                cellData.cell.styles.fontStyle = "bold";
                                cellData.cell.styles.fillColor = [220, 220, 230];
                                break;
                            case "subtotal":
                                cellData.cell.styles.fontStyle = "bold";
                                cellData.cell.styles.fillColor = [240, 240, 245];
                                cellData.cell.styles.lineWidth = { top: 0.75 };
                                break;
                            case "grandtotal":
                                cellData.cell.styles.fontStyle = "bold";
                                cellData.cell.styles.fillColor = [200, 220, 200];
                                cellData.cell.styles.lineWidth = { top: 1.5, bottom: 1.5 };
                                break;
                            case "spacer":
                                cellData.cell.styles.lineWidth = 0;
                                break;
                            default:
                                break;
                        }
                    },
                    margin: { left: LEFT, right: RIGHT },
                });

                y = doc.lastAutoTable.finalY + 15;

                doc.setFont("times", "bold");
                doc.setFontSize(11);
                if (data.IsBalanced) {
                    doc.setTextColor(0, 128, 0);
                    doc.text("TRIAL BALANCE IS BALANCED", LEFT, y);
                } else {
                    doc.setTextColor(200, 0, 0);
                    const diff = Math.abs(
                        (data.TotalDebit || 0) - (data.TotalCredit || 0)
                    );
                    doc.text(
                        `TRIAL BALANCE IS NOT BALANCED — Difference: ${formatCurrency(diff)}`,
                        LEFT,
                        y
                    );
                }

                if (autoPrint) {
                    doc.autoPrint();
                    window.open(doc.output("bloburl"), "_blank");
                } else {
                    doc.save(`TrialBalance_${endDate}.pdf`);
                }
                resolve();
            };
            img.onerror = () => {
                console.error("Failed to load logo image for PDF");
                resolve();
            };
        });
    };

    const handlePreview = () => setShowPreview(true);
    const handleDownload = () => generatePDF(false);
    const handlePrint = () => generatePDF(true);

    // ── Shared statement pieces (used inline + in modal) ──
    const StatementHeader = () => (
        <>
            <div className="flex flex-col items-center justify-center gap-4 mb-4">
                <img src={logo} alt="Company Logo" className="h-16 w-auto" />
                <div className="text-center">
                    <h1 className="text-lg font-bold">RUBANI SACCO LIMITED</h1>
                    <h2 className="text-sm">
                        CONSOLIDATED TRIAL BALANCE AS AT{" "}
                        {new Date(endDate).toLocaleDateString()}
                    </h2>
                </div>
            </div>
            <hr className="border-black mb-4" />
        </>
    );

    const StatementTable = () => (
        <div className="w-full text-sm text-gray-800 border border-gray-300">
            <div className="grid grid-cols-[110px_1fr_140px_140px] bg-gray-800 text-white font-semibold py-2 px-2">
                <div>AccNo</div>
                <div>Account Name</div>
                <div className="text-right">DEBIT (KES)</div>
                <div className="text-right">CREDIT (KES)</div>
            </div>

            {getGroupedEntries().map(({ name, entries }, sectionIdx) => {
                const t = getSectionTotals(entries);
                return (
                    <React.Fragment key={name}>
                        {sectionIdx > 0 && <div className="h-3 bg-white" />}

                        <div className="grid grid-cols-[110px_1fr_140px_140px] bg-gray-200 font-bold py-1.5 px-2 border-y border-gray-300">
                            <div></div>
                            <div className="uppercase tracking-wide">{name}</div>
                            <div></div>
                            <div></div>
                        </div>

                        {entries.map((item, idx) => (
                            <div
                                key={idx}
                                className="grid grid-cols-[110px_1fr_140px_140px] py-1 px-2 border-b border-gray-100 hover:bg-gray-50"
                            >
                                <div className="text-gray-600">
                                    {item.AccountCode || ""}
                                </div>
                                <div className="truncate">
                                    {item.AccountName || ""}
                                </div>
                                <div className="text-right tabular-nums">
                                    {item.Debit ? formatCurrency(item.Debit) : ""}
                                </div>
                                <div className="text-right tabular-nums">
                                    {item.Credit ? formatCurrency(item.Credit) : ""}
                                </div>
                            </div>
                        ))}

                        <div className="grid grid-cols-[110px_1fr_140px_140px] bg-gray-100 font-bold py-1.5 px-2 border-y border-gray-400">
                            <div></div>
                            <div>Total {name}</div>
                            <div className="text-right tabular-nums">
                                {formatCurrency(t.totalDebit)}
                            </div>
                            <div className="text-right tabular-nums">
                                {formatCurrency(t.totalCredit)}
                            </div>
                        </div>
                    </React.Fragment>
                );
            })}

            <div className="grid grid-cols-[110px_1fr_140px_140px] bg-green-100 font-bold py-2 px-2 border-y-2 border-black">
                <div></div>
                <div className="uppercase tracking-wide">GRAND TOTALS</div>
                <div className="text-right tabular-nums">
                    {formatCurrency(data.TotalDebit)}
                </div>
                <div className="text-right tabular-nums">
                    {formatCurrency(data.TotalCredit)}
                </div>
            </div>
        </div>
    );

    const BalanceStatus = () =>
        data.IsBalanced ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 text-green-800 font-semibold">
                <FaCheckCircle /> Trial Balance is Balanced
            </div>
        ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-800 font-semibold">
                <FaExclamationTriangle /> Not Balanced — Difference:{" "}
                {formatCurrency(
                    Math.abs((data.TotalDebit || 0) - (data.TotalCredit || 0))
                )}
            </div>
        );

    const StatementBody = () => (
        <>
            <StatementTable />
            <div className="mt-6 flex items-center justify-center">
                <BalanceStatus />
            </div>
        </>
    );

    return (
        <div className="p-6 bg-gray-200 min-h-screen">
            {/* Header Controls */}
            <div className="flex flex-wrap justify-between items-end gap-4 mb-4 bg-white p-3 px-6 rounded-lg shadow-md">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <button
                        onClick={fetchData}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <FaSync /> Refresh
                    </button>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handlePreview}
                        disabled={!hasData}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FaEye /> Preview
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={!hasData}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FaPrint /> Print
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={!hasData}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FaDownload /> Download PDF
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="p-6 text-center text-gray-600">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    Loading trial balance...
                </div>
            ) : !hasData ? (
                <div className="p-6 text-center text-gray-500">
                    No trial balance data found for the selected date.
                </div>
            ) : (
                <div className="bg-white p-8 shadow-lg max-w-5xl mx-auto rounded-lg">
                    <StatementHeader />
                    <StatementBody />
                </div>
            )}

            {/* Preview Modal */}
            <AnimatePresence>
                {showPreview && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/60 z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPreview(false)}
                        />
                        <motion.div
                            className="fixed z-50 top-1/2 left-1/2 w-[95vw] max-w-6xl h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col"
                            initial={{ scale: 0.9, opacity: 0, y: "-50%", x: "-50%" }}
                            animate={{ scale: 1, opacity: 1, y: "-50%", x: "-50%" }}
                            exit={{ scale: 0.9, opacity: 0, y: "-50%", x: "-50%" }}
                            style={{ transform: "translate(-50%, -50%)" }}
                        >
                            <div className="flex justify-between items-center p-4 border-b bg-indigo-700 rounded-t-xl">
                                <h3 className="text-lg font-semibold text-white">
                                    Trial Balance Preview -{" "}
                                    {new Date(endDate).toLocaleDateString()}
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handlePrint}
                                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md flex items-center gap-2"
                                    >
                                        <FaPrint /> Print
                                    </button>
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
                                <div className="bg-white p-8 shadow-lg max-w-5xl mx-auto rounded-lg">
                                    <StatementHeader />
                                    <StatementBody />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
                                <Button variant="outline" onClick={() => setShowPreview(false)}>
                                    Close
                                </Button>
                                <Button
                                    onClick={handlePrint}
                                    className="bg-gray-600 hover:bg-gray-700"
                                >
                                    <FaPrint className="mr-2" /> Print
                                </Button>
                                <Button
                                    onClick={handleDownload}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    <FaDownload className="mr-2" /> Download PDF
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ConsolidatedTrialBalance;