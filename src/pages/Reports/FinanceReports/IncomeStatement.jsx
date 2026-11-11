import React, { useEffect, useState, useRef, useMemo } from "react";
import logo from "../../../assets/rubanilogo.jpeg";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FaEye, FaDownload, FaTimes, FaPrint, FaSync } from "react-icons/fa";
import Swal from "sweetalert2";

function IncomeStatement() {
    const [data, setData] = useState(null);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [startDate, setStartDate] = useState(() => {
        const currentYear = new Date().getFullYear();
        return `${currentYear}-01-01`;
    });
    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const printRef = useRef();

    // ---- Fetch income statement whenever dates change ----
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [endDate, startDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_APP_REPORT_URL}/api/reporting/IncomeStatement?startDate=${startDate}&endDate=${endDate}`,
                {
                    headers: {
                        "ngrok-skip-browser-warning": "true",
                    },
                }
            );
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error("Error fetching income statement:", error);
            Swal.fire("Error", "Failed to fetch income statement.", "error");
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return "";
        const num = Number(amount);
        if (Number.isNaN(num)) return "";
        return num.toLocaleString("en-KE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // ---- Memoized section extraction ----
    const sections = useMemo(() => {
        if (!data?.Sections) {
            return { income: [], expenses: [], net: null };
        }
        const income =
            data.Sections.find((s) => s.SectionName === "INCOME")?.Lines || [];
        const expenses =
            data.Sections.find((s) => s.SectionName === "EXPENSES")?.Lines || [];
        const netSection = data.Sections.find((s) => s.SectionName === "NET");
        const net = netSection?.Lines?.[0] || null;
        return { income, expenses, net };
    }, [data]);

    const hasData =
        sections.income.length > 0 ||
        sections.expenses.length > 0 ||
        !!sections.net;

    const generatePDF = (autoPrint = false) => {
        const doc = new jsPDF("p", "pt", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const LEFT = 40;
        const RIGHT = 40;
        const TABLE_WIDTH = pageWidth - LEFT - RIGHT;

        const { income, expenses, net } = sections;

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
                    `INCOME STATEMENT FOR THE PERIOD FROM ${new Date(
                        startDate
                    ).toLocaleDateString()} TO ${new Date(
                        endDate
                    ).toLocaleDateString()}`,
                    pageWidth / 2,
                    y,
                    { align: "center" }
                );

                y += 25;

                const buildBody = (lines) =>
                    lines.map((line) => [
                        line.AccNo || "",
                        line.AccName || "",
                        line.Balance === null || line.Balance === undefined
                            ? ""
                            : formatCurrency(line.Balance),
                    ]);

                const renderTable = (lines, startY) => {
                    if (!lines.length) return startY;
                    autoTable(doc, {
                        startY,
                        head: [["AccNo", "AccName", "AMOUNT (KES)"]],
                        body: buildBody(lines),
                        theme: "plain",
                        tableWidth: TABLE_WIDTH,
                        styles: {
                            font: "times",
                            fontSize: 9,
                            cellPadding: 3,
                            lineWidth: 0.5,
                            lineColor: [200, 200, 200],
                        },
                        headStyles: {
                            fillColor: [255, 255, 255],
                            textColor: [0, 0, 0],
                            fontStyle: "bold",
                            lineWidth: 1,
                        },
                        columnStyles: {
                            0: { cellWidth: 80 },
                            1: { cellWidth: 260 },
                            2: {
                                cellWidth: TABLE_WIDTH - 340,
                                halign: "right",
                                fontStyle: "normal",
                            },
                        },
                        didParseCell: function (cellData) {
                            const row = lines[cellData.row.index];
                            if (!row) return;
                            switch (row.RowType) {
                                case "SectionTitle":
                                    cellData.cell.styles.fontStyle = "bold";
                                    cellData.cell.styles.fillColor = [220, 220, 220];
                                    break;
                                case "SectionHeader":
                                    cellData.cell.styles.fontStyle = "bold";
                                    cellData.cell.styles.fillColor = [240, 240, 240];
                                    break;
                                case "SectionTotal":
                                    cellData.cell.styles.fontStyle = "bold";
                                    cellData.cell.styles.lineWidth = { top: 1 };
                                    break;
                                case "GrandTotal":
                                    cellData.cell.styles.fontStyle = "bold";
                                    cellData.cell.styles.lineWidth = { top: 2, bottom: 1 };
                                    break;
                                default:
                                    break;
                            }
                        },
                        margin: { left: LEFT, right: RIGHT },
                    });
                    return doc.lastAutoTable.finalY + 10;
                };

                if (income.length) y = renderTable(income, y);
                if (expenses.length) y = renderTable(expenses, y);

                if (net) {
                    autoTable(doc, {
                        startY: y,
                        body: [
                            [
                                "",
                                net.AccName || "PROFIT / LOSS FOR THE YEAR",
                                formatCurrency(net.Balance || 0),
                            ],
                        ],
                        theme: "plain",
                        tableWidth: TABLE_WIDTH,
                        styles: {
                            font: "times",
                            fontSize: 11,
                            fontStyle: "bold",
                            lineWidth: { top: 2, bottom: 2 },
                        },
                        columnStyles: {
                            0: { cellWidth: 80 },
                            1: { cellWidth: 260 },
                            2: { cellWidth: TABLE_WIDTH - 340, halign: "right" },
                        },
                        margin: { left: LEFT, right: RIGHT },
                    });
                }

                if (autoPrint) {
                    doc.autoPrint();
                    window.open(doc.output("bloburl"), "_blank");
                } else {
                    doc.save(`IncomeStatement_${startDate}_to_${endDate}.pdf`);
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

    const getRowStyle = (rowType) => {
        switch (rowType) {
            case "SectionTitle":
                return "bg-gray-300 font-bold uppercase tracking-wide";
            case "SectionHeader":
                return "bg-gray-100 font-bold";
            case "SectionTotal":
                return "border-t border-gray-400 font-bold";
            case "GrandTotal":
                return "border-t-2 border-b border-black font-bold";
            case "NetIncome":
                return "border-t-2 border-b-2 border-black font-bold text-base";
            default:
                return "";
        }
    };

    // ---- Reusable table renderer (used in inline view + modal) ----
    const renderSectionTable = (lines) => {
        if (!lines.length) return null;
        return (
            <div className="mb-6">
                <div className="grid grid-cols-[20%_1fr_150px] border-b-2 border-black font-semibold py-2 mb-2">
                    <div>AccNo</div>
                    <div>AccName</div>
                    <div className="text-right">AMOUNT (KES)</div>
                </div>
                {lines.map((line, idx) => (
                    <div
                        key={idx}
                        className={`grid grid-cols-[20%_1fr_150px] py-1 ${getRowStyle(
                            line.RowType
                        )}`}
                    >
                        <div>{line.AccNo || ""}</div>
                        <div>{line.AccName || ""}</div>
                        <div className="text-right tabular-nums">
                            {line.Balance === null || line.Balance === undefined
                                ? ""
                                : formatCurrency(line.Balance)}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderNetRow = () => {
        if (!sections.net) return null;
        return (
            <div className="border-t-2 border-black mt-4">
                <div className="grid grid-cols-[20%_1fr_150px] font-bold text-base py-2">
                    <div></div>
                    <div>
                        {sections.net.AccName || "PROFIT / LOSS FOR THE YEAR"}
                    </div>
                    <div className="text-right tabular-nums">
                        {formatCurrency(sections.net.Balance || 0)}
                    </div>
                </div>
            </div>
        );
    };

    const StatementBody = () => (
        <div className="w-full text-sm text-gray-800">
            {renderSectionTable(sections.income)}
            {renderSectionTable(sections.expenses)}
            {renderNetRow()}
        </div>
    );

    const StatementHeader = () => (
        <>
            <div className="flex flex-col items-center justify-center gap-4 mb-4">
                <img src={logo} alt="Company Logo" className="h-16 w-auto" />
                <div className="text-center">
                    <h1 className="text-lg font-bold">RUBANI SACCO LIMITED</h1>
                    <h2 className="text-sm">
                        INCOME STATEMENT FOR THE PERIOD FROM{" "}
                        {new Date(startDate).toLocaleDateString()} TO{" "}
                        {new Date(endDate).toLocaleDateString()}
                    </h2>
                </div>
            </div>
            <hr className="border-black mb-4" />
        </>
    );

    return (
        <div className="p-6 bg-gray-200 min-h-screen">
            {/* Header Controls */}
            <div className="flex flex-wrap justify-between gap-4 mb-4 items-end bg-white p-3 px-6 rounded-lg shadow-md">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <button
                        onClick={fetchData}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <FaSync /> Refresh
                    </button>
                </div>

                <div className="flex gap-2">
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
                    Loading income statement...
                </div>
            ) : !hasData ? (
                <div className="p-6 text-center text-gray-500">
                    No income statement data found for the selected date range.
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
                                    Income Statement Preview -{" "}
                                    {new Date(startDate).toLocaleDateString()} to{" "}
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
                                <div className="bg-white p-8 shadow-lg max-w-5xl mx-auto">
                                    <StatementHeader />
                                    <StatementBody />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowPreview(false)}
                                >
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

export default IncomeStatement;