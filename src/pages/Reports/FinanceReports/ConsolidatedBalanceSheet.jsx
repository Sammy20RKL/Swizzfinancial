import React, { useEffect, useState } from "react";
import logo from "../../../assets/rubanilogo.jpeg";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FaEye, FaDownload, FaTimes, FaPrint } from "react-icons/fa";
import Swal from "sweetalert2";

function ConsolidatedBalanceSheet() {
    const [data, setData] = useState(null);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // ---- Fetch balance sheet whenever endDate changes ----
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [endDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_APP_REPORT_URL}/api/reporting/ConsolidatedBalanceSheet?endDate=${endDate}`,
                { headers: { "ngrok-skip-browser-warning": "true" } }
            );
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error("Error fetching balance sheet:", error);
            Swal.fire("Error", "Failed to fetch balance sheet.", "error");
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return "";
        return Number(amount).toLocaleString("en-KE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const getSections = () => {
        if (!data?.Sections) return [];
        const order = ["ASSETS", "LIABILITIES", "EQUITY"];
        return order
            .map((name) => data.Sections.find((s) => s.SectionName === name))
            .filter(Boolean);
    };

    const hasData = !!data?.Sections && getSections().length > 0;

    const getRowStyle = (rowType) => {
        switch (rowType) {
            case "SectionTitle":
                return "bg-gray-300 font-bold uppercase tracking-wide";
            case "SectionHeader":
                return "bg-gray-100 font-bold text-gray-800";
            case "SectionTotal":
                return "border-t border-gray-400 font-bold bg-gray-50";
            case "GrandTotal":
                return "border-t-2 border-b border-black font-bold bg-gray-100";
            case "NetSurplus":
                return "border-t border-gray-400 font-bold bg-blue-50 text-blue-800";
            case "BalanceCheck":
                return "border-t-2 border-black font-bold bg-green-50 text-green-800";
            default:
                return "";
        }
    };

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
                    `CONSOLIDATED BALANCE SHEET AS AT ${new Date(endDate).toLocaleDateString()}`,
                    pageWidth / 2,
                    y,
                    { align: "center" }
                );

                y += 25;

                const sections = getSections();

                sections.forEach((section) => {
                    doc.setFont("times", "bold");
                    doc.setFontSize(12);
                    doc.text(section.SectionName, LEFT, y);
                    y += 10;

                    const lines = (section.Lines || []).filter(
                        (l) =>
                            !(
                                l.RowType === "SectionHeader" &&
                                (!l.AccName || l.AccName.trim() === "")
                            )
                    );

                    const tableBody = lines.map((line) => [
                        line.AccNo || "",
                        line.AccName || "",
                        line.Balance === null || line.Balance === undefined
                            ? ""
                            : formatCurrency(line.Balance),
                    ]);

                    autoTable(doc, {
                        startY: y,
                        head: [["AccNo", "AccName", "AMOUNT (KES)"]],
                        body: tableBody,
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
                            1: { cellWidth: 280 },
                            2: { cellWidth: TABLE_WIDTH - 360, halign: "right" },
                        },
                        didParseCell: function (cellData) {
                            const rowData = lines[cellData.row.index];
                            if (!rowData) return;
                            switch (rowData.RowType) {
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
                                case "NetSurplus":
                                    cellData.cell.styles.fontStyle = "bold";
                                    cellData.cell.styles.textColor = [0, 0, 255];
                                    break;
                                case "BalanceCheck":
                                    cellData.cell.styles.fontStyle = "bold";
                                    cellData.cell.styles.textColor = [0, 128, 0];
                                    break;
                                default:
                                    break;
                            }
                        },
                        margin: { left: LEFT, right: RIGHT },
                    });

                    y = doc.lastAutoTable.finalY + 15;
                });

                if (autoPrint) {
                    doc.autoPrint();
                    window.open(doc.output("bloburl"), "_blank");
                } else {
                    doc.save(`BalanceSheet_${endDate}.pdf`);
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

    const renderSection = (section) => {
        const lines = (section.Lines || []).filter(
            (l) =>
                !(
                    l.RowType === "SectionHeader" &&
                    (!l.AccName || l.AccName.trim() === "")
                )
        );

        return (
            <div className="mb-8" key={section.SectionName}>
                <h3 className="font-bold text-base mb-2 bg-gray-100 p-2">
                    {section.SectionName}
                </h3>
                <div className="grid grid-cols-[20%_1fr_150px] border-b-2 border-black font-semibold py-2">
                    <div>AccNo</div>
                    <div>AccName</div>
                    <div className="text-right">AMOUNT (KES)</div>
                </div>
                {lines.map((item, idx) => (
                    <div
                        key={idx}
                        className={`grid grid-cols-[20%_1fr_150px] py-1 ${getRowStyle(item.RowType)}`}
                    >
                        <div>{item.AccNo || ""}</div>
                        <div className={item.RowType === "SectionHeader" ? "font-bold" : ""}>
                            {item.AccName || ""}
                        </div>
                        <div className="text-right tabular-nums">
                            {item.Balance === null || item.Balance === undefined
                                ? ""
                                : formatCurrency(item.Balance)}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const StatementHeader = () => (
        <>
            <div className="flex flex-col items-center justify-center gap-4 mb-4">
                <img src={logo} alt="Company Logo" className="h-16 w-auto" />
                <div className="text-center">
                    <h1 className="text-lg font-bold">RUBANI SACCO LIMITED</h1>
                    <h2 className="text-sm">
                        CONSOLIDATED BALANCE SHEET AS AT{" "}
                        {new Date(endDate).toLocaleDateString()}
                    </h2>
                </div>
            </div>
            <hr className="border-black mb-4" />
        </>
    );

    const StatementBody = () => <>{getSections().map(renderSection)}</>;

    return (
        <div className="p-6 bg-gray-200 min-h-screen">
            {/* Header Controls */}
            <div className="flex flex-wrap justify-between items-end gap-4 mb-4 bg-white p-3 px-6 rounded-lg shadow-md">
                <div className="flex flex-wrap gap-4">
                    {/* End Date */}
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
                    Loading balance sheet...
                </div>
            ) : !hasData ? (
                <div className="p-6 text-center text-gray-500">
                    No balance sheet data found for the selected date.
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
                                    Balance Sheet Preview - {new Date(endDate).toLocaleDateString()}
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
                                <Button variant="outline" onClick={() => setShowPreview(false)}>
                                    Close
                                </Button>
                                <Button onClick={handlePrint} className="bg-gray-600 hover:bg-gray-700">
                                    <FaPrint className="mr-2" /> Print
                                </Button>
                                <Button onClick={handleDownload} className="bg-red-600 hover:bg-red-700">
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

export default ConsolidatedBalanceSheet;