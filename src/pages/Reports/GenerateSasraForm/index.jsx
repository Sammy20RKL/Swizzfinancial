import React, { useState, useEffect } from "react";
import {
    FaFilePdf,
    FaDownload,
    FaEye,
    FaTimes,
    FaFileExcel,
    FaChartLine,
    FaSync,
    FaCheckCircle,
    FaExclamationTriangle,
    FaPrint,
} from "react-icons/fa";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../../assets/rubanilogo.jpeg";

const API_BASE_URL = import.meta.env.VITE_APP_REPORT_URL;

/**
 * kind drives which fetch/build path a report uses:
 *  - "liquidity"           -> GetLiquidityStatement + buildLiquidityPdf
 *  - "sections"            -> generic Sections/Lines GL-style payload (Form 5, Sectoral)
 *  - "incomeStatement"     -> Form 2F flat lines {refNo, description, amount, isTotal}
 *  - "financialPosition"   -> Form 2G flat lines {refNo, description, kind, amount}
 *  - "returnOnInvestment"  -> Form 2E flat lines {refNo, description, kind, value}
 *  - "deposits"            -> Form 2C bands layout
 *  - "riskClassification"  -> Form 2D portfolio layout
 *  - "otherDisclosures"    -> Form 2H current vs prior year
 *  - "insiderLending"      -> Insider Lending & Performance report (landscape)
 *
 * columnLabels (optional): overrides the 3-column header used by the "sections" builder.
 */
const sasraReports = [
    // ── Liquidity (special JSON endpoint) ──
    { id: 1, name: "SASRA Form 2 - Liquidity", api: "GetLiquidityStatement", kind: "liquidity" },

    // ── Sections-based ──
    { id: 2, name: "SASRA Form 5 - Investment", api: "GenerateSasraForm5InvestmentPdf", kind: "sections" },
    {
        id: 3,
        name: "Sectoral Loan Classification Return",
        api: "GenerateSectoralLoanClassificationPdf",
        kind: "sections",
        columnLabels: ["Code", "Economic Sector", "Amount (KES)"],
    },

    // ── Fixed-layout returns (must match backend route names) ──
    { id: 4, name: "SASRA Form 2C - Statement of Deposits", api: "GenerateDepositReturnForm2C", kind: "deposits" },
    { id: 5, name: "SASRA Form 2D - Risk Classification", api: "GenerateRiskClassificationForm2D", kind: "riskClassification" },
    { id: 6, name: "SASRA Form 2E - Return on Investment", api: "GenerateReturnOnInvestmentForm2E", kind: "returnOnInvestment" },
    { id: 7, name: "SASRA Form 2F - Income Statement", api: "GenerateIncomeStatementForm2F", kind: "incomeStatement" },
    { id: 8, name: "SASRA Form 2G - Financial Position", api: "GenerateFinancialPositionForm2G", kind: "financialPosition" },
    { id: 9, name: "SASRA Form 2H - Other Disclosures", api: "GenerateSasraForm2HOtherDisclosuresPdf", kind: "otherDisclosures" },

    // ── Insider lending ──
    { id: 10, name: "Insider Lending & Performance Report", api: "GenerateInsiderLendingPerformancePdf", kind: "insiderLending" },
];

export default function GenerateSasraForm() {
    const [startDate, setStartDate] = useState(() => {
        const y = new Date().getFullYear();
        return `${y}-01-01`;
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [financialYear, setFinancialYear] = useState(new Date().getFullYear());
    const [loadingId, setLoadingId] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewTitle, setPreviewTitle] = useState("");
    const [liquidityData, setLiquidityData] = useState(null);
    const [loadingLiquidity, setLoadingLiquidity] = useState(false);
    const [showLiquidityDetails, setShowLiquidityDetails] = useState(false);

    /* ─────────── cleanup preview URL on unmount ─────────── */
    useEffect(() => {
        return () => {
            if (previewUrl) window.URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    /* ─────────── helpers ─────────── */
    const fmt = (n) =>
        Number(n || 0).toLocaleString("en-KE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const fmtSigned = (n) => {
        const num = Number(n || 0);
        const abs = Math.abs(num).toLocaleString("en-KE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return num < 0 ? `(${abs})` : abs;
    };

    const fmtVal = (v) => {
        if (v === null || v === undefined || v === "") return "";
        if (typeof v === "string") return v;
        return fmt(v);
    };

    const fmtPct = (v) => {
        if (v === null || v === undefined || v === "") return "";
        if (typeof v === "string") return v;
        return `${(Number(v) * 100).toFixed(2)}%`;
    };

    /* ─────────── read-once error helper ─────────── */
    const readErrorDetail = async (res) => {
        let detail = `HTTP ${res.status}`;
        try {
            const raw = await res.text();
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    detail =
                        parsed.ExceptionMessage ||
                        parsed.Message ||
                        parsed.message ||
                        parsed.title ||
                        parsed.detail ||
                        raw;
                } catch {
                    detail = raw.substring(0, 500);
                }
            }
        } catch {
            /* ignore */
        }
        return detail;
    };

    /* ─────────── Form 2 (Liquidity) fetch ─────────── */
    const fetchLiquidityData = async () => {
        const url = `${API_BASE_URL}/api/reporting/GetLiquidityStatement?startDate=${startDate}&endDate=${endDate}`;
        console.log("Fetching liquidity data from:", url);

        const res = await fetch(url, {
            headers: { "ngrok-skip-browser-warning": "true" },
        });

        if (!res.ok) {
            const detail = await readErrorDetail(res);
            console.error(`[Liquidity] HTTP ${res.status} from ${url}\n${detail}`);
            throw new Error(`Failed to fetch liquidity data (HTTP ${res.status}): ${detail}`);
        }

        const result = await res.json();
        if (!result.success) throw new Error(result.message || "Failed to fetch liquidity data");
        return result.data;
    };

    /* ─────────── Generic report fetch ─────────── */
    const fetchReportJson = async (report) => {
        const url = `${API_BASE_URL}/api/reporting/${report.api}?startDate=${startDate}&endDate=${endDate}`;
        console.log(`Fetching ${report.name} from:`, url);

        const res = await fetch(url, {
            headers: { "ngrok-skip-browser-warning": "true" },
        });

        const contentType = res.headers.get("content-type") || "";

        // PDF short-circuit
        if (res.ok && contentType.includes("application/pdf")) {
            return { isPdf: true, blob: await res.blob() };
        }

        if (!res.ok) {
            const detail = await readErrorDetail(res);
            console.error(`[${report.name}] HTTP ${res.status} from ${url}\n${detail}`);
            throw new Error(`HTTP ${res.status}: ${detail}`);
        }

        try {
            const json = await res.json();
            return { isPdf: false, json };
        } catch {
            throw new Error("Backend returned non-JSON response (expected JSON). See console.");
        }
    };

    /* ─────────── shared header block ─────────── */
    const drawFormHeader = (doc, pageWidth, LEFT, RIGHT, formNumber, formName, header) => {
        let y = 30;
        doc.addImage(logo, "JPEG", (pageWidth - 110) / 2, y, 110, 50);
        y += 70;

        doc.setFont("times", "bold");
        doc.setFontSize(11);
        doc.text(formNumber, pageWidth / 2, y, { align: "center" });
        y += 16;
        doc.setFontSize(14);
        doc.text(formName, pageWidth / 2, y, { align: "center" });
        y += 18;

        doc.setFont("times", "normal");
        doc.setFontSize(10);
        doc.text(`SACCO Name: ${header?.saccoName || "N/A"}`, LEFT, y);
        doc.text(`CS Number: ${header?.saccoCsNumber || "N/A"}`, pageWidth - RIGHT, y, { align: "right" });
        y += 14;
        doc.text(`Financial Year: ${header?.financialYear || financialYear || "N/A"}`, LEFT, y);
        doc.text(
            `Period: ${new Date(header?.startDate || startDate).toLocaleDateString()} – ${new Date(
                header?.endDate || endDate
            ).toLocaleDateString()}`,
            pageWidth - RIGHT,
            y,
            { align: "right" }
        );
        y += 18;
        return y;
    };

    /* ─────────── Form 2 (Liquidity) builder ─────────── */
    const buildLiquidityPdf = (p) => {
        const doc = new jsPDF("p", "pt", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const LEFT = 40;
        const RIGHT = 40;
        const TABLE_WIDTH = pageWidth - LEFT - RIGHT;

        let y = 30;
        doc.addImage(logo, "JPEG", (pageWidth - 110) / 2, y, 110, 50);
        y += 70;

        doc.setFont("times", "bold");
        doc.setFontSize(11);
        doc.text(p.header?.formNumber || "FORM 2B  (r.15(1))", pageWidth / 2, y, { align: "center" });
        y += 16;
        doc.setFontSize(14);
        doc.text(p.header?.formName || "LIQUIDITY STATEMENT RETURN", pageWidth / 2, y, { align: "center" });
        y += 18;

        doc.setFont("times", "normal");
        doc.setFontSize(10);
        doc.text(`SACCO Name: ${p.header?.saccoName || "N/A"}`, LEFT, y);
        doc.text(`CS Number: ${p.header?.saccoCsNumber || "N/A"}`, pageWidth - RIGHT, y, { align: "right" });
        y += 14;
        doc.text(`Financial Year: ${p.header?.financialYear || "N/A"}`, LEFT, y);
        doc.text(
            `Period: ${new Date(p.header?.startDate || startDate).toLocaleDateString()} – ${new Date(
                p.header?.endDate || endDate
            ).toLocaleDateString()}`,
            pageWidth - RIGHT,
            y,
            { align: "right" }
        );
        y += 18;

        const body = [
            [{ content: "1. NOTES AND COINS", colSpan: 2, styles: { fontStyle: "bold", fillColor: [220, 220, 230] } }, ""],
            ["   Local notes and coins", fmt(p.section1_notesAndCoins?.localNotesAndCoins)],
            ["   Foreign notes and coins", fmt(p.section1_notesAndCoins?.foreignNotesAndCoins)],
            [{ content: "   Total (1)", styles: { fontStyle: "bold" } }, { content: fmt(p.section1_notesAndCoins?.total), styles: { fontStyle: "bold" } }],

            [{ content: "2. BANK BALANCES", colSpan: 2, styles: { fontStyle: "bold", fillColor: [220, 220, 230] } }, ""],
            ["   Balances with commercial banks", fmtSigned(p.section2_bankBalances?.balancesWithCommercialBanks)],
            ["   Time deposits over 90 days", fmt(p.section2_bankBalances?.timeDepositsOver90Days)],
            ["   Overdrafts and matured loans", fmt(p.section2_bankBalances?.overdraftsAndMaturedLoans)],
            [{ content: "   Net bank balances (2)", styles: { fontStyle: "bold" } }, { content: fmtSigned(p.section2_bankBalances?.netBankBalances), styles: { fontStyle: "bold" } }],

            [{ content: "3. FINANCIAL INSTITUTIONS", colSpan: 2, styles: { fontStyle: "bold", fillColor: [220, 220, 230] } }, ""],
            ["   Balances with SACCO societies", fmt(p.section3_financialInstitutions?.balancesWithSaccoSocieties)],
            ["   Balances with other financial institutions", fmt(p.section3_financialInstitutions?.balancesWithOtherFinancialInst)],
            ["   Balances due to SACCO societies", fmt(p.section3_financialInstitutions?.balancesDueToSaccoSocieties)],
            ["   Balances due to other financial institutions", fmt(p.section3_financialInstitutions?.balancesDueToOtherFinancialInst)],
            ["   Matured loans from financial institutions", fmt(p.section3_financialInstitutions?.maturedLoansFromFinancialInst)],

            [{ content: "4. GOVERNMENT SECURITIES", colSpan: 2, styles: { fontStyle: "bold", fillColor: [220, 220, 230] } }, ""],
            ["   Treasury bills", fmt(p.section4_governmentSecurities?.treasuryBills)],
            ["   Treasury bonds", fmt(p.section4_governmentSecurities?.treasuryBonds)],
            [{ content: "   Total (4)", styles: { fontStyle: "bold" } }, { content: fmt(p.section4_governmentSecurities?.total), styles: { fontStyle: "bold" } }],

            [{ content: "5. NET LIQUID ASSETS", colSpan: 2, styles: { fontStyle: "bold", fillColor: [200, 220, 200] } }, ""],
            [{ content: "   Net liquid assets (1+2+3+4)", styles: { fontStyle: "bold" } }, { content: fmtSigned(p.section5_netLiquidAssets?.amount), styles: { fontStyle: "bold" } }],

            [{ content: "6. OTHER LIABILITIES", colSpan: 2, styles: { fontStyle: "bold", fillColor: [220, 220, 230] } }, ""],
            ["   Matured liabilities", fmt(p.section6_otherLiabilities?.maturedLiabilities)],
            ["   Liabilities maturing in 91 days", fmt(p.section6_otherLiabilities?.liabilitiesMaturingIn91Days)],
            [{ content: "   Total other liabilities (6)", styles: { fontStyle: "bold" } }, { content: fmt(p.section6_otherLiabilities?.totalOtherLiabilities), styles: { fontStyle: "bold" } }],

            [{ content: "7. LIQUIDITY RATIO", colSpan: 2, styles: { fontStyle: "bold", fillColor: [200, 220, 200] } }, ""],
            ["   Net liquid assets", fmtSigned(p.section7_liquidityRatio?.netLiquidAssets)],
            ["   Total short-term liabilities", fmt(p.section7_liquidityRatio?.totalShortTermLiabilities)],
            [{ content: "   Liquidity ratio", styles: { fontStyle: "bold" } }, { content: p.section7_liquidityRatio?.ratioPercentage || "0.0000%", styles: { fontStyle: "bold" } }],
            ["   Minimum SASRA requirement", p.section7_liquidityRatio?.minimumRequirementPct || "10.0%"],
            [
                { content: "   Excess / (Deficit)", styles: { fontStyle: "bold" } },
                {
                    content:
                        p.section7_liquidityRatio?.excessDeficit < 0
                            ? `(${Math.abs((p.section7_liquidityRatio?.excessDeficit || 0) * 100).toFixed(2)}%)`
                            : `${((p.section7_liquidityRatio?.excessDeficit || 0) * 100).toFixed(2)}%`,
                    styles: { fontStyle: "bold" },
                },
            ],
            [
                { content: "   Compliance status", styles: { fontStyle: "bold" } },
                {
                    content: p.section7_liquidityRatio?.complianceStatus || "N/A",
                    styles: {
                        fontStyle: "bold",
                        textColor:
                            p.section7_liquidityRatio?.complianceStatus === "COMPLIANT"
                                ? [0, 128, 0]
                                : [200, 0, 0],
                    },
                },
            ],
        ];

        autoTable(doc, {
            startY: y,
            head: [["Description", "Amount (KES)"]],
            body,
            theme: "grid",
            tableWidth: TABLE_WIDTH,
            styles: { font: "times", fontSize: 9, cellPadding: 4, lineWidth: 0.25, lineColor: [150, 150, 150] },
            headStyles: { fillColor: [30, 30, 60], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
            columnStyles: { 0: { cellWidth: TABLE_WIDTH - 150 }, 1: { cellWidth: 150, halign: "right" } },
            margin: { left: LEFT, right: RIGHT },
        });

        y = doc.lastAutoTable.finalY + 15;
        doc.setFont("times", "bold");
        doc.setFontSize(10);
        if (p.section7_liquidityRatio?.complianceStatus === "COMPLIANT") doc.setTextColor(0, 128, 0);
        else doc.setTextColor(200, 0, 0);
        doc.text(p.section7_liquidityRatio?.complianceMessage || "", LEFT, y, { maxWidth: TABLE_WIDTH });

        return doc;
    };

    /* ─────────── Sections-based builder (Form 5, Sectoral) ─────────── */
    const buildSectionsPdf = (json, title, columnLabels) => {
        const doc = new jsPDF("p", "pt", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const LEFT = 40;
        const RIGHT = 40;
        const TABLE_WIDTH = pageWidth - LEFT - RIGHT;
        const [colA, colB, colC] = columnLabels || ["Acc No", "Account Name", "Amount (KES)"];

        let y = 30;
        doc.addImage(logo, "JPEG", (pageWidth - 110) / 2, y, 110, 50);
        y += 70;

        doc.setFont("times", "bold");
        doc.setFontSize(14);
        doc.text((json.SaccoName || "RUBANI SACCO LIMITED").toUpperCase(), pageWidth / 2, y, { align: "center" });
        y += 16;
        doc.setFontSize(11);
        doc.text(title.toUpperCase(), pageWidth / 2, y, { align: "center" });
        y += 12;
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        if (json.SaccoCsNumber) {
            doc.text(`CS No: ${json.SaccoCsNumber}`, pageWidth / 2, y, { align: "center" });
            y += 12;
        }
        doc.text(
            `Period: ${new Date(startDate).toLocaleDateString()} – ${new Date(endDate).toLocaleDateString()}`,
            pageWidth / 2,
            y,
            { align: "center" }
        );
        y += 20;

        const body = [];
        const meta = [];

        (json.Sections || []).forEach((section, sIdx) => {
            if (sIdx > 0) {
                body.push(["", "", ""]);
                meta.push("spacer");
            }

            body.push(["", section.SectionName.toUpperCase(), ""]);
            meta.push("sectionTitle");

            (section.Lines || []).forEach((line) => {
                body.push([
                    line.AccNo || "",
                    line.AccName || "",
                    line.Balance === null || line.Balance === undefined ? "" : fmt(line.Balance),
                ]);

                switch (line.RowType) {
                    case "SectionTitle": meta.push("sectionTitle"); break;
                    case "SectionHeader": meta.push("sectionHeader"); break;
                    case "SectionTotal": meta.push("subtotal"); break;
                    case "GrandTotal": meta.push("grandtotal"); break;
                    case "NetIncome": meta.push("net"); break;
                    default: meta.push("leaf");
                }
            });
        });

        autoTable(doc, {
            startY: y,
            head: [[colA, colB, colC]],
            body,
            theme: "grid",
            tableWidth: TABLE_WIDTH,
            styles: { font: "times", fontSize: 9, cellPadding: 3, lineWidth: 0.25, lineColor: [180, 180, 180] },
            headStyles: { fillColor: [30, 30, 60], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { cellWidth: TABLE_WIDTH - 230 },
                2: { cellWidth: 150, halign: "right" },
            },
            didParseCell: (cell) => {
                const kind = meta[cell.row.index];
                if (!kind) return;
                switch (kind) {
                    case "sectionTitle":
                        cell.cell.styles.fontStyle = "bold";
                        cell.cell.styles.fillColor = [220, 220, 230];
                        break;
                    case "sectionHeader":
                        cell.cell.styles.fontStyle = "bold";
                        cell.cell.styles.fillColor = [240, 240, 245];
                        break;
                    case "subtotal":
                        cell.cell.styles.fontStyle = "bold";
                        cell.cell.styles.lineWidth = { top: 1 };
                        break;
                    case "grandtotal":
                        cell.cell.styles.fontStyle = "bold";
                        cell.cell.styles.fillColor = [200, 220, 200];
                        cell.cell.styles.lineWidth = { top: 1.5, bottom: 1.5 };
                        break;
                    case "net":
                        cell.cell.styles.fontStyle = "bold";
                        cell.cell.styles.fillColor = [230, 230, 255];
                        cell.cell.styles.lineWidth = { top: 1.5, bottom: 1.5 };
                        break;
                    case "spacer":
                        cell.cell.styles.lineWidth = 0;
                        break;
                    default: break;
                }
            },
            margin: { left: LEFT, right: RIGHT },
        });

        return doc;
    };

    /* ─────────── Form 2C – Statement of Deposits ─────────── */
    const buildDepositsPdf = (p) => {
        const doc = new jsPDF("p", "pt", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const LEFT = 40;
        const RIGHT = 40;
        const TABLE_WIDTH = pageWidth - LEFT - RIGHT;

        const y = drawFormHeader(doc, pageWidth, LEFT, RIGHT, "FORM 2C", "STATEMENT OF DEPOSIT RETURN", p.header);

        // Backend returns { bands, totalNoOfAccounts, totalAmount }
        const bands = p.bands || [];
        const body = bands.map((r) => [
            r.no ?? "",
            r.range ?? "",
            r.typeOfDeposit ?? "",
            r.noOfAccounts ?? 0,
            fmt(r.amount),
        ]);
        body.push([
            { content: "TOTAL", colSpan: 3, styles: { fontStyle: "bold" } },
            { content: p.totalNoOfAccounts ?? 0, styles: { fontStyle: "bold" } },
            { content: fmt(p.totalAmount), styles: { fontStyle: "bold" } },
        ]);

        autoTable(doc, {
            startY: y,
            head: [["No.", "Range", "Type of Deposit", "No. of A/Cs", "Amount (KES)"]],
            body,
            theme: "grid",
            tableWidth: TABLE_WIDTH,
            styles: { font: "times", fontSize: 9, cellPadding: 4, lineWidth: 0.25, lineColor: [150, 150, 150] },
            headStyles: { fillColor: [30, 30, 60], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 130 },
                2: { cellWidth: 130 },
                3: { cellWidth: TABLE_WIDTH - 30 - 130 - 130 - 130, halign: "right" },
                4: { cellWidth: 130, halign: "right" },
            },
            margin: { left: LEFT, right: RIGHT },
        });

        return doc;
    };

    /* ─────────── Form 2D – Risk Classification ─────────── */
    const buildRiskClassificationPdf = (p) => {
        const doc = new jsPDF("p", "pt", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const LEFT = 40;
        const RIGHT = 40;
        const TABLE_WIDTH = pageWidth - LEFT - RIGHT;

        const y = drawFormHeader(doc, pageWidth, LEFT, RIGHT, "FORM 2D", "RISK CLASSIFICATION OF ASSETS AND PROVISIONING", p.header);

        // Backend fields: portfolio, portfolioSubtotal, rescheduledLoans, rescheduledSubtotal, grandTotal
        const rowFor = (r) => [
            r.no ?? "",
            r.classification ?? "",
            r.noOfAccounts ?? "",
            fmt(r.outstandingAmount),
            fmtPct(r.provisionRate),
            fmt(r.provisionAmount),
        ];

        const body = [
            [{ content: "PORTFOLIO AGEING REPORT", colSpan: 6, styles: { fontStyle: "bold", fillColor: [220, 220, 230] } }, "", "", "", "", ""],
            ...((p.portfolio || []).map(rowFor)),
            [
                { content: "Subtotal", colSpan: 2, styles: { fontStyle: "bold" } },
                { content: p.portfolioSubtotal?.noOfAccounts ?? 0, styles: { fontStyle: "bold" } },
                { content: fmt(p.portfolioSubtotal?.outstandingAmount), styles: { fontStyle: "bold" } },
                "",
                { content: fmt(p.portfolioSubtotal?.provisionAmount), styles: { fontStyle: "bold" } },
            ],
            [{ content: "RESCHEDULED / RENEGOTIATED LOANS", colSpan: 6, styles: { fontStyle: "bold", fillColor: [220, 220, 230] } }, "", "", "", "", ""],
            ...((p.rescheduledLoans || []).map(rowFor)),
            [
                { content: "Subtotal", colSpan: 2, styles: { fontStyle: "bold" } },
                { content: p.rescheduledSubtotal?.noOfAccounts ?? 0, styles: { fontStyle: "bold" } },
                { content: fmt(p.rescheduledSubtotal?.outstandingAmount), styles: { fontStyle: "bold" } },
                "",
                { content: fmt(p.rescheduledSubtotal?.provisionAmount), styles: { fontStyle: "bold" } },
            ],
            [
                { content: "GRAND TOTAL", colSpan: 2, styles: { fontStyle: "bold", fillColor: [200, 220, 200] } },
                { content: p.grandTotal?.noOfAccounts ?? 0, styles: { fontStyle: "bold", fillColor: [200, 220, 200] } },
                { content: fmt(p.grandTotal?.outstandingAmount), styles: { fontStyle: "bold", fillColor: [200, 220, 200] } },
                { content: "", styles: { fillColor: [200, 220, 200] } },
                { content: fmt(p.grandTotal?.provisionAmount), styles: { fontStyle: "bold", fillColor: [200, 220, 200] } },
            ],
        ];

        autoTable(doc, {
            startY: y,
            head: [["No.", "Classification", "No. of A/Cs", "Outstanding Portfolio (KES)", "Required Provision %", "Required Provision Amount (KES)"]],
            body,
            theme: "grid",
            tableWidth: TABLE_WIDTH,
            styles: { font: "times", fontSize: 8.5, cellPadding: 3.5, lineWidth: 0.25, lineColor: [150, 150, 150] },
            headStyles: { fillColor: [30, 30, 60], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
            columnStyles: {
                2: { halign: "right" },
                3: { halign: "right" },
                4: { halign: "right" },
                5: { halign: "right" },
            },
            margin: { left: LEFT, right: RIGHT },
        });

        return doc;
    };

    /* ─────────── Form 2E – Return on Investment ─────────── */
    const buildReturnOnInvestmentPdf = (p) => {
        const doc = new jsPDF("p", "pt", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const LEFT = 40;
        const RIGHT = 40;
        const TABLE_WIDTH = pageWidth - LEFT - RIGHT;

        const y = drawFormHeader(doc, pageWidth, LEFT, RIGHT, "FORM 2E", "RETURN ON INVESTMENT", p.header);

        // Backend: lines [{ refNo, description, kind: Amount|Ratio|Limit|Excess, value }]
        const renderValue = (line) => {
            if (line.value === null || line.value === undefined) return "";
            if (line.kind === "Ratio" || line.kind === "Limit" || line.kind === "Excess") return fmtPct(line.value);
            return fmt(line.value);
        };

        const body = (p.lines || []).map((line) => [
            line.refNo || "",
            line.description || "",
            renderValue(line),
            line.kind || "",
        ]);

        if (p.unmappedInputLines?.length) {
            body.push([
                { content: `⚠ Unmapped input lines: ${p.unmappedInputLines.join(", ")}`, colSpan: 4, styles: { textColor: [200, 0, 0], fontStyle: "bold" } },
                "", "", "",
            ]);
        }

        autoTable(doc, {
            startY: y,
            head: [["Ref", "Description", "Value", "Kind"]],
            body,
            theme: "grid",
            tableWidth: TABLE_WIDTH,
            styles: { font: "times", fontSize: 9, cellPadding: 3.5, lineWidth: 0.25, lineColor: [150, 150, 150] },
            headStyles: { fillColor: [30, 30, 60], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
            columnStyles: {
                0: { cellWidth: 55 },
                1: { cellWidth: TABLE_WIDTH - 55 - 120 - 70 },
                2: { cellWidth: 120, halign: "right" },
                3: { cellWidth: 70, halign: "center" },
            },
            didParseCell: (cell) => {
                const line = p.lines?.[cell.row.index];
                if (line?.kind === "Limit" || line?.kind === "Excess") {
                    cell.cell.styles.fontStyle = "bold";
                    cell.cell.styles.fillColor = [240, 240, 245];
                }
            },
            margin: { left: LEFT, right: RIGHT },
        });

        return doc;
    };

    /* ─────────── Form 2F – Income Statement ─────────── */
    const buildIncomeStatementPdf = (p) => {
        const doc = new jsPDF("p", "pt", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const LEFT = 40;
        const RIGHT = 40;
        const TABLE_WIDTH = pageWidth - LEFT - RIGHT;

        const y = drawFormHeader(doc, pageWidth, LEFT, RIGHT, "FORM 2F  (r.15(1))", "INCOME STATEMENT RETURN", p.header);

        let startY = y;
        if (p.unmappedAccounts?.length) {
            doc.setTextColor(200, 0, 0);
            doc.setFontSize(9);
            doc.text(
                `⚠ ${p.unmappedAccounts.length} GL account(s) have movement but no Form 2F mapping.`,
                LEFT, startY, { maxWidth: TABLE_WIDTH }
            );
            doc.setTextColor(0, 0, 0);
            startY += 14;
        }

        // Backend: lines [{ refNo, description, amount, isTotal }]
        const body = (p.lines || []).map((line) => [
            line.refNo || "",
            line.description || "",
            fmt(line.amount),
            line.isTotal ? "T" : "",
        ]);

        autoTable(doc, {
            startY,
            head: [["Ref", "Description", "Amount (KES)", "Total"]],
            body,
            theme: "grid",
            tableWidth: TABLE_WIDTH,
            styles: { font: "times", fontSize: 9, cellPadding: 3.5, lineWidth: 0.25, lineColor: [150, 150, 150] },
            headStyles: { fillColor: [30, 30, 60], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
            columnStyles: {
                0: { cellWidth: 50 },
                1: { cellWidth: TABLE_WIDTH - 50 - 130 - 50 },
                2: { cellWidth: 130, halign: "right" },
                3: { cellWidth: 50, halign: "center" },
            },
            didParseCell: (cell) => {
                const line = p.lines?.[cell.row.index];
                if (line?.isTotal) {
                    cell.cell.styles.fontStyle = "bold";
                    cell.cell.styles.fillColor = [220, 220, 230];
                }
            },
            margin: { left: LEFT, right: RIGHT },
        });

        return doc;
    };

    /* ─────────── Form 2G – Financial Position ─────────── */
    const buildFinancialPositionPdf = (p) => {
        const doc = new jsPDF("p", "pt", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const LEFT = 40;
        const RIGHT = 40;
        const TABLE_WIDTH = pageWidth - LEFT - RIGHT;

        const y = drawFormHeader(doc, pageWidth, LEFT, RIGHT, "FORM 2G  (r.15(1))", "STATEMENT OF FINANCIAL POSITION", p.header);

        let startY = y;
        if (!p.isBalanced) {
            doc.setTextColor(200, 0, 0);
            doc.setFontSize(9);
            doc.text(
                `⚠ Balance sheet does NOT balance. Difference: ${fmtSigned(p.difference)}. Do not submit.`,
                LEFT, startY, { maxWidth: TABLE_WIDTH }
            );
            doc.setTextColor(0, 0, 0);
            startY += 14;
        }
        if (p.unmappedAccounts?.length) {
            doc.setTextColor(200, 0, 0);
            doc.setFontSize(9);
            doc.text(
                `⚠ ${p.unmappedAccounts.length} balance-sheet account(s) have a balance but no Form 2G mapping.`,
                LEFT, startY, { maxWidth: TABLE_WIDTH }
            );
            doc.setTextColor(0, 0, 0);
            startY += 14;
        }

        // Backend: lines [{ refNo, description, kind: Line|Subtotal|Total, amount }]
        const body = (p.lines || []).map((line) => [
            line.refNo || "",
            line.description || "",
            fmtSigned(line.amount),
        ]);

        autoTable(doc, {
            startY,
            head: [["Ref", "Description", "Amount (KES)"]],
            body,
            theme: "grid",
            tableWidth: TABLE_WIDTH,
            styles: { font: "times", fontSize: 9, cellPadding: 3.5, lineWidth: 0.25, lineColor: [150, 150, 150] },
            headStyles: { fillColor: [30, 30, 60], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
            columnStyles: {
                0: { cellWidth: 60 },
                1: { cellWidth: TABLE_WIDTH - 60 - 150 },
                2: { cellWidth: 150, halign: "right" },
            },
            didParseCell: (cell) => {
                const line = p.lines?.[cell.row.index];
                if (line?.kind === "Total") {
                    cell.cell.styles.fontStyle = "bold";
                    cell.cell.styles.fillColor = [200, 220, 200];
                } else if (line?.kind === "Subtotal") {
                    cell.cell.styles.fontStyle = "bold";
                    cell.cell.styles.fillColor = [240, 240, 245];
                }
            },
            margin: { left: LEFT, right: RIGHT },
        });

        return doc;
    };

    /* ─────────── Form 2H – Other Disclosures ─────────── */
    const buildOtherDisclosuresPdf = (p) => {
        const doc = new jsPDF("p", "pt", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const LEFT = 40;
        const RIGHT = 40;
        const TABLE_WIDTH = pageWidth - LEFT - RIGHT;

        const y = drawFormHeader(doc, pageWidth, LEFT, RIGHT, "FORM 2H", "STATEMENT OF OTHER DISCLOSURES", p.header);

        const row = (label, node, bold) => [
            { content: label, styles: bold ? { fontStyle: "bold" } : {} },
            { content: fmtVal(node?.current), styles: bold ? { fontStyle: "bold" } : { halign: "right" } },
            { content: fmtVal(node?.prior), styles: bold ? { fontStyle: "bold" } : { halign: "right" } },
        ];

        const npl = p.nonPerformingLoans || {};
        const ins = p.insiderLoans || {};
        const obs = p.offBalanceSheet || {};
        const cap = p.capitalStrength || {};
        const liq = p.liquidity || {};

        const body = [
            [{ content: "1. NON PERFORMING LOAN AND ADVANCES", colSpan: 3, styles: { fontStyle: "bold", fillColor: [220, 220, 230] } }, "", ""],
            row("   1.1 Gross Non Performing Loans and Advances", npl.grossNPL),
            row("   1.2 Interest in Suspense", npl.interestInSuspense),
            row("   1.3 Total NPL (1.1 - 1.2)", npl.totalNPL, true),
            row("   1.4 Allowance for Loan Loss", npl.allowanceForLoanLoss),
            row("   1.5 Net Non Performing Loans (1.3 - 1.4)", npl.netNPL, true),

            [{ content: "2. INSIDER LOANS AND ADVANCES", colSpan: 3, styles: { fontStyle: "bold", fillColor: [220, 220, 230] } }, "", ""],
            row("   2.1 Directors", ins.directors),
            row("   2.2 Employees", ins.employees),
            row("   2.3 Total Insider Loans, Advances and Other Facilities", ins.total, true),

            [{ content: "3. OFF BALANCE SHEET ITEMS", colSpan: 3, styles: { fontStyle: "bold", fillColor: [220, 220, 230] } }, "", ""],
            row("   3.1 Guarantees and Commitments", obs.guaranteesAndCommitments),
            row("   3.2 Other Contingent Liabilities", obs.otherContingentLiabilities),
            row("   3.3 Total Contingent Liabilities", obs.totalContingentLiabilities, true),

            [{ content: "4. CAPITAL STRENGTH", colSpan: 3, styles: { fontStyle: "bold", fillColor: [200, 220, 200] } }, "", ""],
            row("   4.1 Core Capital", cap.coreCapital),
            row("   4.3 Core Capital to Total Asset Ratio", cap.coreCapitalToAssetsRatio),
            row("   4.4 Minimum Statutory Ratio", cap.minStatutoryRatio1),
            row("   4.5 Excess/(Deficiency) (4.3 - 4.4)", cap.excessDeficiency1, true),
            row("   4.6 Core Capital / Deposits Liabilities Ratio", cap.coreCapitalToDepositsRatio),
            row("   4.7 Minimum Statutory Ratio", cap.minStatutoryRatio2),
            row("   4.8 Excess/(Deficiency) (4.6 - 4.7)", cap.excessDeficiency2, true),

            [{ content: "5. LIQUIDITY", colSpan: 3, styles: { fontStyle: "bold", fillColor: [200, 220, 200] } }, "", ""],
            row("   5.1 Liquidity Ratio", liq.liquidityRatio),
            row("   5.2 Minimum Statutory Ratio", liq.minStatutoryRatio),
            row("   5.3 Excess/(Deficiency) (5.1 - 5.2)", liq.excessDeficiency, true),
        ];

        autoTable(doc, {
            startY: y,
            head: [["Other Disclosures", "Current Year (KES)", "Prior Year (KES)"]],
            body,
            theme: "grid",
            tableWidth: TABLE_WIDTH,
            styles: { font: "times", fontSize: 9, cellPadding: 4, lineWidth: 0.25, lineColor: [150, 150, 150] },
            headStyles: { fillColor: [30, 30, 60], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
            columnStyles: {
                0: { cellWidth: TABLE_WIDTH - 150 - 150 },
                1: { cellWidth: 150, halign: "right" },
                2: { cellWidth: 150, halign: "right" },
            },
            margin: { left: LEFT, right: RIGHT },
        });

        return doc;
    };

    /* ─────────── Insider Lending (landscape) ─────────── */
    const buildInsiderLendingPdf = (p) => {
        const doc = new jsPDF("l", "pt", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const LEFT = 30;
        const RIGHT = 30;
        const TABLE_WIDTH = pageWidth - LEFT - RIGHT;

        let y = 25;
        doc.addImage(logo, "JPEG", (pageWidth - 90) / 2, y, 90, 40);
        y += 55;

        doc.setFont("times", "bold");
        doc.setFontSize(12);
        doc.text("INSIDER LENDING AND PERFORMANCE RETURN (r.36(5))", pageWidth / 2, y, { align: "center" });
        y += 16;

        doc.setFont("times", "normal");
        doc.setFontSize(9);
        doc.text(`SACCO Name: ${p.header?.saccoName || "N/A"}`, LEFT, y);
        doc.text(`CS Number: ${p.header?.saccoCsNumber || "N/A"}`, pageWidth - RIGHT, y, { align: "right" });
        y += 12;
        doc.text(
            `Period: ${new Date(p.header?.startDate || startDate).toLocaleDateString()} – ${new Date(
                p.header?.endDate || endDate
            ).toLocaleDateString()}`,
            LEFT,
            y
        );
        y += 14;

        const newLoansCols = [
            "#", "Name of Borrower", "Member No.", "Position Held", "Loan Type",
            "Amount Applied For", "Amount Granted", "Date Approved", "BOSA Deposits",
            "Security", "Repayment Due Date", "Repayment Period", "Remarks",
        ];

        doc.setFont("times", "bold");
        doc.setFontSize(10);
        doc.text("A. New Loans Granted", LEFT, y);
        y += 6;

        const newLoansBody = (p.newLoansGranted || []).map((r, idx) => [
            idx + 1,
            r.name || "",
            r.memberNumber || "",
            r.positionHeld || "",
            r.loanType || "",
            fmt(r.amountAppliedFor),
            fmt(r.amountGranted),
            r.dateApproved || "",
            fmt(r.bosaDeposits),
            r.securityNature || "",
            r.repaymentDueDate || "",
            r.repaymentPeriod || "",
            r.remarks || "",
        ]);
        newLoansBody.push([
            { content: "TOTAL LOANS GRANTED FOR INSIDERS", colSpan: 6, styles: { fontStyle: "bold" } },
            { content: fmt(p.totalNewLoansGranted), styles: { fontStyle: "bold" } },
            "", "", "", "", "", "",
        ]);

        autoTable(doc, {
            startY: y + 6,
            head: [newLoansCols],
            body: newLoansBody,
            theme: "grid",
            tableWidth: TABLE_WIDTH,
            styles: { font: "times", fontSize: 7, cellPadding: 2.5, lineWidth: 0.25, lineColor: [150, 150, 150], overflow: "linebreak" },
            headStyles: { fillColor: [30, 30, 60], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
            margin: { left: LEFT, right: RIGHT },
        });

        let y2 = doc.lastAutoTable.finalY + 20;
        doc.setFont("times", "bold");
        doc.setFontSize(10);
        doc.text("B. Performance of Insider Outstanding Loan(s) Previously Granted", LEFT, y2);

        const perfCols = [
            "#", "Name of Borrower", "Member No.", "Position Held", "Loan Type",
            "Amount Applied For", "Amount Granted", "Date Approved", "BOSA Deposits",
            "Security", "Due Date", "Repayment Period", "Outstanding Amount", "Performance Category",
        ];

        const perfBody = (p.outstandingLoansPerformance || []).map((r, idx) => [
            idx + 1,
            r.name || "",
            r.memberNumber || "",
            r.positionHeld || "",
            r.loanType || "",
            fmt(r.amountAppliedFor),
            fmt(r.amountGranted),
            r.dateApproved || "",
            fmt(r.bosaDeposits),
            r.securityNature || "",
            r.repaymentDueDate || "",
            r.repaymentPeriod || "",
            fmt(r.outstandingAmount),
            r.performanceCategory || "",
        ]);
        perfBody.push([
            { content: "TOTAL OUTSTANDING LOANS FOR INSIDERS", colSpan: 12, styles: { fontStyle: "bold" } },
            { content: fmt(p.totalOutstandingLoans), styles: { fontStyle: "bold" } },
            "",
        ]);

        autoTable(doc, {
            startY: y2 + 6,
            head: [perfCols],
            body: perfBody,
            theme: "grid",
            tableWidth: TABLE_WIDTH,
            styles: { font: "times", fontSize: 6.5, cellPadding: 2.5, lineWidth: 0.25, lineColor: [150, 150, 150], overflow: "linebreak" },
            headStyles: { fillColor: [30, 30, 60], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 6.5 },
            margin: { left: LEFT, right: RIGHT },
        });

        return doc;
    };

    /* ─────────── dispatch ─────────── */
    const buildPdfForReport = (report, payload) => {
        switch (report.kind) {
            case "deposits": return buildDepositsPdf(payload);
            case "riskClassification": return buildRiskClassificationPdf(payload);
            case "returnOnInvestment": return buildReturnOnInvestmentPdf(payload);
            case "incomeStatement": return buildIncomeStatementPdf(payload);
            case "financialPosition": return buildFinancialPositionPdf(payload);
            case "otherDisclosures": return buildOtherDisclosuresPdf(payload);
            case "insiderLending": return buildInsiderLendingPdf(payload);
            case "sections":
            default:
                return buildSectionsPdf(payload, report.name, report.columnLabels);
        }
    };

    /* ─────────── Preview ─────────── */
    const previewPdf = async (report) => {
        if (!startDate || !endDate) {
            Swal.fire("Error", "Please select start and end dates", "error");
            return;
        }

        setLoadingId(report.id);
        Swal.fire({
            title: "Generating PDF...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        try {
            if (report.kind === "liquidity") {
                const data = await fetchLiquidityData();
                const doc = buildLiquidityPdf(data);
                if (previewUrl) window.URL.revokeObjectURL(previewUrl);
                setPreviewUrl(doc.output("bloburl"));
                setPreviewTitle(report.name);
                Swal.close();
                return;
            }

            const result = await fetchReportJson(report);

            if (result.isPdf) {
                if (previewUrl) window.URL.revokeObjectURL(previewUrl);
                setPreviewUrl(window.URL.createObjectURL(result.blob));
                setPreviewTitle(report.name);
                Swal.close();
                return;
            }

            const doc = buildPdfForReport(report, result.json);
            if (previewUrl) window.URL.revokeObjectURL(previewUrl);
            setPreviewUrl(doc.output("bloburl"));
            setPreviewTitle(report.name);
            Swal.close();
        } catch (err) {
            console.error(err);
            Swal.fire("Error", err.message || "Failed to preview PDF", "error");
        } finally {
            setLoadingId(null);
        }
    };

    /* ─────────── Download ─────────── */
    const downloadPdf = async (report) => {
        if (!startDate || !endDate) {
            Swal.fire("Error", "Please select start and end dates", "error");
            return;
        }

        setLoadingId(report.id);
        Swal.fire({
            title: "Generating PDF...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        try {
            if (report.kind === "liquidity") {
                const data = await fetchLiquidityData();
                const doc = buildLiquidityPdf(data);
                doc.save(`SASRA_Form2_Liquidity_${startDate}_to_${endDate}.pdf`);
                Swal.fire("Success", "PDF downloaded successfully", "success");
                return;
            }

            const result = await fetchReportJson(report);

            if (result.isPdf) {
                const url = window.URL.createObjectURL(result.blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${report.name.replace(/\s+/g, "_")}_${startDate}_${endDate}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                setTimeout(() => window.URL.revokeObjectURL(url), 1000);
                Swal.fire("Success", "PDF downloaded successfully", "success");
                return;
            }

            const doc = buildPdfForReport(report, result.json);
            doc.save(`${report.name.replace(/\s+/g, "_")}_${startDate}_${endDate}.pdf`);
            Swal.fire("Success", "PDF downloaded successfully", "success");
        } catch (err) {
            console.error(err);
            Swal.fire("Error", err.message || "Failed to download PDF", "error");
        } finally {
            setLoadingId(null);
        }
    };

    /* ─────────── Print ─────────── */
    const printPdf = async (report) => {
        if (!startDate || !endDate) {
            Swal.fire("Error", "Please select start and end dates", "error");
            return;
        }

        setLoadingId(report.id);
        try {
            if (report.kind === "liquidity") {
                const data = await fetchLiquidityData();
                const doc = buildLiquidityPdf(data);
                doc.autoPrint();
                window.open(doc.output("bloburl"), "_blank");
                return;
            }

            const result = await fetchReportJson(report);
            if (result.isPdf) {
                window.open(window.URL.createObjectURL(result.blob), "_blank");
                return;
            }

            const doc = buildPdfForReport(report, result.json);
            doc.autoPrint();
            window.open(doc.output("bloburl"), "_blank");
        } catch (err) {
            console.error(err);
            Swal.fire("Error", err.message || "Failed to print", "error");
        } finally {
            setLoadingId(null);
        }
    };

    /* ─────────── Excel helpers ─────────── */
    const downloadWorkbook = (rows, sheetName, colWidths, filename) => {
        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws["!cols"] = colWidths;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 30));
        const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([buf], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const exportDepositsExcel = (p) => {
        const rows = [
            ["FORM 2C"],
            ["STATEMENT OF DEPOSIT RETURN"],
            ["Name of Sacco Society:", p.header?.saccoName || "N/A"],
            ["Sacco Society CS Number:", p.header?.saccoCsNumber || "N/A"],
            [],
            ["No.", "Range", "Type of Deposit", "No. of A/Cs", "Amount (KES)"],
            ...((p.bands || []).map((r) => [r.no ?? "", r.range ?? "", r.typeOfDeposit ?? "", r.noOfAccounts ?? 0, r.amount ?? 0])),
            ["", "", "TOTAL", p.totalNoOfAccounts || 0, p.totalAmount || 0],
        ];
        downloadWorkbook(rows, "Deposits",
            [{ wch: 8 }, { wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 18 }],
            `SASRA_Form2C_Deposits_${startDate}_${endDate}.xlsx`);
    };

    const exportRiskClassificationExcel = (p) => {
        const rowFor = (r) => [
            r.no ?? "",
            r.classification ?? "",
            r.noOfAccounts ?? "",
            r.outstandingAmount ?? 0,
            r.provisionRate ?? "",
            r.provisionAmount ?? 0,
        ];
        const rows = [
            ["FORM 2D"],
            ["RISK CLASSIFICATION OF ASSETS AND PROVISIONING"],
            ["Name of Sacco Society:", p.header?.saccoName || "N/A"],
            [],
            ["No.", "Classification", "No. of A/Cs", "Outstanding Portfolio (KES)", "Required Provision %", "Required Provision Amount (KES)"],
            ["PORTFOLIO AGEING REPORT"],
            ...((p.portfolio || []).map(rowFor)),
            ["", "Subtotal", p.portfolioSubtotal?.noOfAccounts || 0, p.portfolioSubtotal?.outstandingAmount || 0, "", p.portfolioSubtotal?.provisionAmount || 0],
            ["RESCHEDULED / RENEGOTIATED LOANS"],
            ...((p.rescheduledLoans || []).map(rowFor)),
            ["", "Subtotal", p.rescheduledSubtotal?.noOfAccounts || 0, p.rescheduledSubtotal?.outstandingAmount || 0, "", p.rescheduledSubtotal?.provisionAmount || 0],
            ["", "GRAND TOTAL", p.grandTotal?.noOfAccounts || 0, p.grandTotal?.outstandingAmount || 0, "", p.grandTotal?.provisionAmount || 0],
        ];
        downloadWorkbook(rows, "Risk Classification",
            [{ wch: 8 }, { wch: 25 }, { wch: 12 }, { wch: 20 }, { wch: 16 }, { wch: 22 }],
            `SASRA_Form2D_RiskClassification_${startDate}_${endDate}.xlsx`);
    };

    const exportReturnOnInvestmentExcel = (p) => {
        const rows = [
            ["FORM 2E"],
            ["RETURN ON INVESTMENT"],
            ["Name of Sacco Society:", p.header?.saccoName || "N/A"],
            ["CS Number:", p.header?.saccoCsNumber || "N/A"],
            [],
            ["Ref", "Description", "Kind", "Value"],
            ...((p.lines || []).map((line) => [
                line.refNo || "",
                line.description || "",
                line.kind || "",
                line.value ?? "",
            ])),
            [],
            ["Complete:", p.isComplete ? "Yes" : `No - unmapped: ${(p.unmappedInputLines || []).join(", ")}`],
        ];
        downloadWorkbook(rows, "Return on Investment",
            [{ wch: 8 }, { wch: 55 }, { wch: 12 }, { wch: 20 }],
            `SASRA_Form2E_ReturnOnInvestment_${startDate}_${endDate}.xlsx`);
    };

    const exportIncomeStatementExcel = (p) => {
        const rows = [
            ["FORM 2F - INCOME STATEMENT RETURN"],
            ["Name of Sacco Society:", p.header?.saccoName || "N/A"],
            ["CS Number:", p.header?.saccoCsNumber || "N/A"],
            ["Period:", `${p.header?.startDate || startDate} to ${p.header?.endDate || endDate}`],
            [],
            ["Ref", "Description", "Amount (KES)", "Total"],
            ...((p.lines || []).map((line) => [
                line.refNo || "",
                line.description || "",
                line.amount ?? 0,
                line.isTotal ? "T" : "",
            ])),
            [],
            ["Complete:", p.isComplete ? "Yes" : `No - ${p.unmappedAccounts?.length || 0} unmapped GL account(s)`],
        ];
        downloadWorkbook(rows, "Income Statement",
            [{ wch: 8 }, { wch: 55 }, { wch: 20 }, { wch: 8 }],
            `SASRA_Form2F_IncomeStatement_${startDate}_${endDate}.xlsx`);
    };

    const exportFinancialPositionExcel = (p) => {
        const rows = [
            ["FORM 2G - STATEMENT OF FINANCIAL POSITION"],
            ["Name of Sacco Society:", p.header?.saccoName || "N/A"],
            ["CS Number:", p.header?.saccoCsNumber || "N/A"],
            ["As at:", p.header?.endDate || endDate],
            [],
            ["Ref", "Description", "Kind", "Amount (KES)"],
            ...((p.lines || []).map((line) => [
                line.refNo || "",
                line.description || "",
                line.kind || "",
                line.amount ?? 0,
            ])),
            [],
            ["Balanced:", p.isBalanced ? "Yes" : `No - difference ${p.difference}`],
            ["Complete:", p.isComplete ? "Yes" : "No - unmapped accounts exist"],
        ];
        downloadWorkbook(rows, "Financial Position",
            [{ wch: 8 }, { wch: 55 }, { wch: 12 }, { wch: 20 }],
            `SASRA_Form2G_FinancialPosition_${startDate}_${endDate}.xlsx`);
    };

    const exportOtherDisclosuresExcel = (p) => {
        const npl = p.nonPerformingLoans || {};
        const ins = p.insiderLoans || {};
        const obs = p.offBalanceSheet || {};
        const cap = p.capitalStrength || {};
        const liq = p.liquidity || {};
        const row = (label, node) => [label, node?.current ?? "", node?.prior ?? ""];
        const rows = [
            ["FORM 2H"],
            ["STATEMENT OF OTHER DISCLOSURES"],
            ["Name of Sacco Society:", p.header?.saccoName || "N/A"],
            [],
            ["Other Disclosures", "Current Year (KES)", "Prior Year (KES)"],
            ["1. NON PERFORMING LOAN AND ADVANCES"],
            row("1.1 Gross Non Performing Loans and Advances", npl.grossNPL),
            row("1.2 Interest in Suspense", npl.interestInSuspense),
            row("1.3 Total NPL (1.1 - 1.2)", npl.totalNPL),
            row("1.4 Allowance for Loan Loss", npl.allowanceForLoanLoss),
            row("1.5 Net Non Performing Loans (1.3 - 1.4)", npl.netNPL),
            ["2. INSIDER LOANS AND ADVANCES"],
            row("2.1 Directors", ins.directors),
            row("2.2 Employees", ins.employees),
            row("2.3 Total Insider Loans, Advances and Other Facilities", ins.total),
            ["3. OFF BALANCE SHEET ITEMS"],
            row("3.1 Guarantees and Commitments", obs.guaranteesAndCommitments),
            row("3.2 Other Contingent Liabilities", obs.otherContingentLiabilities),
            row("3.3 Total Contingent Liabilities", obs.totalContingentLiabilities),
            ["4. CAPITAL STRENGTH"],
            row("4.1 Core Capital", cap.coreCapital),
            row("4.3 Core Capital to Total Asset Ratio", cap.coreCapitalToAssetsRatio),
            row("4.4 Minimum Statutory Ratio", cap.minStatutoryRatio1),
            row("4.5 Excess/(Deficiency) (4.3 - 4.4)", cap.excessDeficiency1),
            row("4.6 Core Capital / Deposits Liabilities Ratio", cap.coreCapitalToDepositsRatio),
            row("4.7 Minimum Statutory Ratio", cap.minStatutoryRatio2),
            row("4.8 Excess/(Deficiency) (4.6 - 4.7)", cap.excessDeficiency2),
            ["5. LIQUIDITY"],
            row("5.1 Liquidity Ratio", liq.liquidityRatio),
            row("5.2 Minimum Statutory Ratio", liq.minStatutoryRatio),
            row("5.3 Excess/(Deficiency) (5.1 - 5.2)", liq.excessDeficiency),
        ];
        downloadWorkbook(rows, "Other Disclosures",
            [{ wch: 55 }, { wch: 20 }, { wch: 20 }],
            `SASRA_Form2H_OtherDisclosures_${startDate}_${endDate}.xlsx`);
    };

    const exportInsiderLendingExcel = (p) => {
        const cols = ["#", "Name", "Member No.", "Position Held", "Loan Type", "Amount Applied For", "Amount Granted", "Date Approved", "BOSA Deposits", "Security", "Due Date", "Repayment Period", "Outstanding Amount", "Performance Category", "Remarks"];
        const rows = [
            ["INSIDER LENDING AND PERFORMANCE RETURN (r.36(5))"],
            ["Name of Sacco Society:", p.header?.saccoName || "N/A"],
            [],
            ["A. NEW LOANS GRANTED"],
            cols.slice(0, 13),
            ...((p.newLoansGranted || []).map((r, idx) => [
                idx + 1, r.name || "", r.memberNumber || "", r.positionHeld || "", r.loanType || "",
                r.amountAppliedFor || 0, r.amountGranted || 0, r.dateApproved || "", r.bosaDeposits || 0,
                r.securityNature || "", r.repaymentDueDate || "", r.repaymentPeriod || "", r.remarks || "",
            ])),
            ["", "", "", "", "", "", "TOTAL LOANS GRANTED FOR INSIDERS", "", "", "", "", "", p.totalNewLoansGranted || 0],
            [],
            ["B. PERFORMANCE OF INSIDER OUTSTANDING LOAN(S) PREVIOUSLY GRANTED"],
            cols,
            ...((p.outstandingLoansPerformance || []).map((r, idx) => [
                idx + 1, r.name || "", r.memberNumber || "", r.positionHeld || "", r.loanType || "",
                r.amountAppliedFor || 0, r.amountGranted || 0, r.dateApproved || "", r.bosaDeposits || 0,
                r.securityNature || "", r.repaymentDueDate || "", r.repaymentPeriod || "", r.outstandingAmount || 0, r.performanceCategory || "",
            ])),
            ["", "", "", "", "", "", "", "", "", "", "", "TOTAL OUTSTANDING", p.totalOutstandingLoans || 0, ""],
        ];
        downloadWorkbook(rows, "Insider Lending", cols.map(() => ({ wch: 16 })),
            `Insider_Lending_Performance_${startDate}_${endDate}.xlsx`);
    };

    const exportLiquidityExcel = (p) => {
        const rows = [];
        rows.push(["FORM 2B (r.15(1))"]);
        rows.push(["LIQUIDITY STATEMENT RETURN"]);
        rows.push([]);
        rows.push(["Name of Sacco Society:", p.header?.saccoName || "N/A"]);
        rows.push(["Sacco Society CS Number:", p.header?.saccoCsNumber || "N/A"]);
        rows.push(["Financial Year:", p.header?.financialYear || financialYear]);
        rows.push(["Start Date:", p.header?.startDate || startDate]);
        rows.push(["End Date:", p.header?.endDate || endDate]);
        rows.push([]);
        rows.push(["Item", "Description", "AMOUNT (KSHS)"]);

        rows.push(["1", "NOTES AND COINS", ""]);
        rows.push(["1.1", "Local Notes and Coins", p.section1_notesAndCoins?.localNotesAndCoins || 0]);
        rows.push(["1.2", "Foreign Notes and Coins", p.section1_notesAndCoins?.foreignNotesAndCoins || 0]);
        rows.push(["", "Total", p.section1_notesAndCoins?.total || 0]);
        rows.push([]);

        rows.push(["2", "BANK BALANCES", ""]);
        rows.push(["2.1", "Balances with Commercial Banks", p.section2_bankBalances?.balancesWithCommercialBanks || 0]);
        rows.push(["2.2", "Time Deposits over 90 days", p.section2_bankBalances?.timeDepositsOver90Days || 0]);
        rows.push(["2.3", "Overdrafts and Matured Loans", p.section2_bankBalances?.overdraftsAndMaturedLoans || 0]);
        rows.push(["", "Net Bank Balances", p.section2_bankBalances?.netBankBalances || 0]);
        rows.push([]);

        rows.push(["3", "BALANCES WITH FINANCIAL INSTITUTIONS OTHER THAN BANKS AND SACCO SOCIETIES", ""]);
        rows.push(["3.1", "Balances with other Sacco Societies", p.section3_financialInstitutions?.balancesWithSaccoSocieties || 0]);
        rows.push(["3.2", "Balances with other Financial Institutions", p.section3_financialInstitutions?.balancesWithOtherFinancialInst || 0]);
        rows.push(["3.3", "Balances Due to other Sacco Societies", p.section3_financialInstitutions?.balancesDueToSaccoSocieties || 0]);
        rows.push(["3.4", "Balances Due to Financial Institutions other than banks", p.section3_financialInstitutions?.balancesDueToOtherFinancialInst || 0]);
        rows.push(["3.5", "Matured Loans and Advances received", p.section3_financialInstitutions?.maturedLoansFromFinancialInst || 0]);
        rows.push([]);

        rows.push(["4", "GOVERNMENT SECURITIES", ""]);
        rows.push(["4.1", "Treasury Bills", p.section4_governmentSecurities?.treasuryBills || 0]);
        rows.push(["4.2", "Treasury Bonds / Bearer Bonds", p.section4_governmentSecurities?.treasuryBonds || 0]);
        rows.push(["", "Total", p.section4_governmentSecurities?.total || 0]);
        rows.push([]);

        rows.push(["5", "NET LIQUID ASSETS", p.section5_netLiquidAssets?.amount || 0]);
        rows.push([]);

        rows.push(["6", "OTHER LIABILITIES", ""]);
        rows.push(["6.1", "Matured Liabilities", p.section6_otherLiabilities?.maturedLiabilities || 0]);
        rows.push(["6.2", "Liabilities Maturing within 91 Days", p.section6_otherLiabilities?.liabilitiesMaturingIn91Days || 0]);
        rows.push(["6.3", "Total Other Liabilities", p.section6_otherLiabilities?.totalOtherLiabilities || 0]);
        rows.push([]);

        rows.push(["7", "LIQUIDITY RATIO", ""]);
        rows.push(["7.1", "Net Liquid Assets (Item 5)", p.section7_liquidityRatio?.netLiquidAssets || 0]);
        rows.push(["7.2", "Total Short Term Liabilities (6.3)", p.section7_liquidityRatio?.totalShortTermLiabilities || 0]);
        rows.push(["7.3", "Ratio of (7.1 / 7.2)%", p.section7_liquidityRatio?.ratioPercentage || "0%"]);
        rows.push(["7.4", "Minimum Liquid Assets Requirement", p.section7_liquidityRatio?.minimumRequirementPct || "10.0%"]);
        rows.push(["7.5", "Excess / Deficit (7.3 - 7.4)", p.section7_liquidityRatio?.excessDeficit || 0]);
        rows.push(["", "Compliance Status", p.section7_liquidityRatio?.complianceStatus || "CHECKING"]);
        rows.push([]);
        rows.push(["Note: This return should be received on or before the 15th day of the month following end of every quarter"]);
        rows.push([]);
        rows.push(["AUTHORIZATION:"]);
        rows.push(["We declare that this return, to the best of our knowledge and belief, is correct."]);
        rows.push(["Name of Authorizing Officer"]);
        rows.push(["Name of Countersigning Officer"]);

        downloadWorkbook(rows, "Liquidity Statement",
            [{ wch: 8 }, { wch: 60 }, { wch: 20 }],
            `SASRA_Form2_Liquidity_${financialYear || startDate}.xlsx`);
    };

    /* ─────────── Excel Export dispatcher ─────────── */
    const exportExcel = async (report) => {
        setLoadingId(report.id);
        Swal.fire({
            title: "Generating Excel...",
            text: "Please wait",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        try {
            if (report.kind === "liquidity") {
                const p = await fetchLiquidityData();
                exportLiquidityExcel(p);
                Swal.fire("Success", "Excel file downloaded successfully", "success");
                return;
            }

            const result = await fetchReportJson(report);
            if (result.isPdf) throw new Error("Backend returned a PDF, cannot export to Excel.");

            const p = result.json;

            switch (report.kind) {
                case "deposits": exportDepositsExcel(p); break;
                case "riskClassification": exportRiskClassificationExcel(p); break;
                case "returnOnInvestment": exportReturnOnInvestmentExcel(p); break;
                case "incomeStatement": exportIncomeStatementExcel(p); break;
                case "financialPosition": exportFinancialPositionExcel(p); break;
                case "otherDisclosures": exportOtherDisclosuresExcel(p); break;
                case "insiderLending": exportInsiderLendingExcel(p); break;
                case "sections":
                default: {
                    const [colA, colB, colC] = report.columnLabels || ["Acc No", "Account Name", "Amount (KES)"];
                    const rows = [
                        [report.name.toUpperCase()],
                        [`Period: ${startDate} to ${endDate}`],
                        [`Generated: ${new Date().toLocaleString()}`],
                        [],
                        [colA, colB, colC],
                    ];
                    (p.Sections || []).forEach((section) => {
                        rows.push([section.SectionName.toUpperCase(), "", ""]);
                        (section.Lines || []).forEach((line) => {
                            rows.push([
                                line.AccNo || "",
                                line.AccName || "",
                                line.Balance === null || line.Balance === undefined ? "" : Number(line.Balance),
                            ]);
                        });
                        rows.push([]);
                        rows.push([]);
                    });
                    downloadWorkbook(rows, report.name.substring(0, 30),
                        [{ wch: 15 }, { wch: 55 }, { wch: 20 }],
                        `${report.name.replace(/\s+/g, "_")}_${startDate}_${endDate}.xlsx`);
                }
            }

            Swal.fire("Success", "Excel file downloaded successfully", "success");
        } catch (err) {
            console.error(err);
            Swal.fire("Error", err.message || "Failed to export Excel", "error");
        } finally {
            setLoadingId(null);
        }
    };

    /* ─────────── Liquidity inline card ─────────── */
    const previewLiquidityStatement = async () => {
        try {
            setLoadingLiquidity(true);
            const data = await fetchLiquidityData();
            setLiquidityData(data);
            setShowLiquidityDetails(true);
            Swal.fire("Success", "Liquidity statement loaded successfully", "success");
        } catch (error) {
            console.error(error);
            Swal.fire("Error", error.message || "Failed to load liquidity statement", "error");
        } finally {
            setLoadingLiquidity(false);
        }
    };

    const closePreview = () => {
        if (previewUrl) window.URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewTitle("");
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return "0.00";
        return Number(amount).toLocaleString("en-KE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const getComplianceColor = (status) => {
        switch (status) {
            case "COMPLIANT": return "text-green-600 bg-green-50 border-green-200";
            case "NON-COMPLIANT": return "text-red-600 bg-red-50 border-red-200";
            default: return "text-yellow-600 bg-yellow-50 border-yellow-200";
        }
    };

    const getComplianceIcon = (status) => {
        switch (status) {
            case "COMPLIANT": return <FaCheckCircle className="text-green-600" />;
            case "NON-COMPLIANT": return <FaExclamationTriangle className="text-red-600" />;
            default: return <FaSync className="text-yellow-600" />;
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen m-8 rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <FaChartLine /> SASRA Reports
                </h2>
                <button
                    onClick={previewLiquidityStatement}
                    disabled={loadingLiquidity}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                    <FaSync className={loadingLiquidity ? "animate-spin" : ""} />
                    {loadingLiquidity ? "Loading..." : "Load Statement"}
                </button>
            </div>

            {/* Date Filters */}
            <div className="flex flex-wrap gap-4 mb-6 bg-white p-4 rounded-xl shadow">
                <div>
                    <label className="block text-sm font-medium mb-1">Financial Year</label>
                    <input
                        type="number"
                        value={financialYear}
                        onChange={(e) => setFinancialYear(parseInt(e.target.value))}
                        className="border rounded-lg px-3 py-2 w-32"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border rounded-lg px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border rounded-lg px-3 py-2"
                    />
                </div>
                <div className="flex items-end">
                    <button
                        onClick={previewLiquidityStatement}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>

            {/* Liquidity inline preview */}
            {showLiquidityDetails && liquidityData && (
                <div className="mb-6 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 flex justify-between items-center">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <FaChartLine /> Liquidity Statement Details
                        </h3>
                        <button onClick={() => setShowLiquidityDetails(false)} className="text-white hover:text-gray-200">
                            <FaTimes />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 bg-gray-50 p-4 rounded-lg">
                            <div>
                                <p className="text-xs text-gray-500">Form</p>
                                <p className="font-semibold">{liquidityData.header?.formNumber || "FORM 2B"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">SACCO Name</p>
                                <p className="font-semibold">{liquidityData.header?.saccoName || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">CS Number</p>
                                <p className="font-semibold">{liquidityData.header?.saccoCsNumber || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Financial Year</p>
                                <p className="font-semibold">{liquidityData.header?.financialYear || "N/A"}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <p className="text-xs text-gray-600">Notes & Coins</p>
                                <p className="text-lg font-bold text-blue-700">
                                    {formatCurrency(liquidityData.section1_notesAndCoins?.total)}
                                </p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <p className="text-xs text-gray-600">Bank Balances</p>
                                <p className="text-lg font-bold text-green-700">
                                    {formatCurrency(liquidityData.section2_bankBalances?.netBankBalances)}
                                </p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                <p className="text-xs text-gray-600">Net Liquid Assets</p>
                                <p className="text-lg font-bold text-purple-700">
                                    {formatCurrency(liquidityData.section5_netLiquidAssets?.amount)}
                                </p>
                            </div>
                            <div
                                className={`p-4 rounded-lg border ${
                                    liquidityData.section7_liquidityRatio?.complianceStatus === "COMPLIANT"
                                        ? "bg-green-50 border-green-200"
                                        : "bg-red-50 border-red-200"
                                }`}
                            >
                                <p className="text-xs text-gray-600">Liquidity Ratio</p>
                                <p className="text-lg font-bold">
                                    {liquidityData.section7_liquidityRatio?.ratioPercentage || "0%"}
                                </p>
                                <p
                                    className={`text-xs font-semibold ${
                                        liquidityData.section7_liquidityRatio?.complianceStatus === "COMPLIANT"
                                            ? "text-green-600"
                                            : "text-red-600"
                                    }`}
                                >
                                    {liquidityData.section7_liquidityRatio?.complianceStatus || "CHECKING"}
                                </p>
                            </div>
                        </div>

                        {liquidityData.section7_liquidityRatio?.complianceMessage && (
                            <div
                                className={`p-3 rounded-lg mb-4 ${
                                    liquidityData.section7_liquidityRatio?.complianceStatus === "COMPLIANT"
                                        ? "bg-green-50 border border-green-200"
                                        : "bg-red-50 border border-red-200"
                                }`}
                            >
                                <p className="text-sm">{liquidityData.section7_liquidityRatio?.complianceMessage}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white border rounded-lg overflow-hidden">
                                <div className="bg-blue-50 px-4 py-2 border-b">
                                    <h4 className="font-semibold text-sm text-blue-800">1. Notes and Coins</h4>
                                </div>
                                <div className="divide-y">
                                    <div className="flex justify-between px-4 py-2 text-sm">
                                        <span className="text-gray-600">Local Notes and Coins</span>
                                        <span>{formatCurrency(liquidityData.section1_notesAndCoins?.localNotesAndCoins)}</span>
                                    </div>
                                    <div className="flex justify-between px-4 py-2 text-sm">
                                        <span className="text-gray-600">Foreign Notes and Coins</span>
                                        <span>{formatCurrency(liquidityData.section1_notesAndCoins?.foreignNotesAndCoins)}</span>
                                    </div>
                                    <div className="flex justify-between px-4 py-2 text-sm bg-gray-50 font-bold">
                                        <span>Total</span>
                                        <span className="text-blue-700">{formatCurrency(liquidityData.section1_notesAndCoins?.total)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border rounded-lg overflow-hidden">
                                <div className="bg-blue-50 px-4 py-2 border-b">
                                    <h4 className="font-semibold text-sm text-blue-800">2. Bank Balances</h4>
                                </div>
                                <div className="divide-y">
                                    <div className="flex justify-between px-4 py-2 text-sm">
                                        <span className="text-gray-600">Balances with Commercial Banks</span>
                                        <span>{formatCurrency(liquidityData.section2_bankBalances?.balancesWithCommercialBanks)}</span>
                                    </div>
                                    <div className="flex justify-between px-4 py-2 text-sm text-red-600">
                                        <span>Less: Time Deposits over 90 days</span>
                                        <span>({formatCurrency(liquidityData.section2_bankBalances?.timeDepositsOver90Days)})</span>
                                    </div>
                                    <div className="flex justify-between px-4 py-2 text-sm bg-gray-50 font-bold">
                                        <span>Net Bank Balances</span>
                                        <span className="text-green-700">{formatCurrency(liquidityData.section2_bankBalances?.netBankBalances)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border rounded-lg overflow-hidden">
                                <div className="bg-green-50 px-4 py-2 border-b">
                                    <h4 className="font-semibold text-sm text-green-800">5. Net Liquid Assets</h4>
                                </div>
                                <div className="p-4 text-center">
                                    <p className="text-2xl font-bold text-green-700">
                                        {formatCurrency(liquidityData.section5_netLiquidAssets?.amount)}
                                    </p>
                                    <p className="text-xs text-gray-500">Total Net Liquid Assets</p>
                                </div>
                            </div>

                            <div className="bg-white border rounded-lg overflow-hidden">
                                <div className="bg-purple-50 px-4 py-2 border-b">
                                    <h4 className="font-semibold text-sm text-purple-800">7. Liquidity Ratio</h4>
                                </div>
                                <div className="divide-y p-4">
                                    <div className="flex justify-between text-sm py-1">
                                        <span className="text-gray-600">Net Liquid Assets</span>
                                        <span>{formatCurrency(liquidityData.section7_liquidityRatio?.netLiquidAssets)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm py-1">
                                        <span className="text-gray-600">Short Term Liabilities</span>
                                        <span>{formatCurrency(liquidityData.section7_liquidityRatio?.totalShortTermLiabilities)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm py-1 font-bold">
                                        <span>Ratio</span>
                                        <span className="text-purple-700">{liquidityData.section7_liquidityRatio?.ratioPercentage || "0%"}</span>
                                    </div>
                                    <div className={`flex justify-between text-sm py-1 px-2 rounded ${getComplianceColor(liquidityData.section7_liquidityRatio?.complianceStatus)}`}>
                                        <span>Status</span>
                                        <span className="font-semibold flex items-center gap-2">
                                            {getComplianceIcon(liquidityData.section7_liquidityRatio?.complianceStatus)}
                                            {liquidityData.section7_liquidityRatio?.complianceStatus || "CHECKING"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reports Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-gray-300 rounded-2xl p-4">
                {sasraReports.map((report) => (
                    <div key={report.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition p-4">
                        <div className="flex justify-center mb-4">
                            <FaFilePdf className="text-red-600 text-4xl" />
                        </div>

                        <p className="text-center font-medium text-sm mb-4">{report.name}</p>

                        <div className="flex flex-col w-full gap-2">
                            <button
                                onClick={() => previewPdf(report)}
                                disabled={loadingId === report.id}
                                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2 rounded-lg transition disabled:opacity-50"
                            >
                                <FaEye /> Preview
                            </button>

                            <button
                                onClick={() => downloadPdf(report)}
                                disabled={loadingId === report.id}
                                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-lg transition disabled:opacity-50"
                            >
                                <FaDownload /> Download PDF
                            </button>

                            <button
                                onClick={() => printPdf(report)}
                                disabled={loadingId === report.id}
                                className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white text-sm py-2 rounded-lg transition disabled:opacity-50"
                            >
                                <FaPrint /> Print
                            </button>

                            <button
                                onClick={() => exportExcel(report)}
                                disabled={loadingId === report.id}
                                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm py-2 rounded-lg transition disabled:opacity-50"
                            >
                                <FaFileExcel /> Download Excel
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* PDF Preview Modal */}
            {previewUrl && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-11/12 md:w-4/5 h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="font-semibold">{previewTitle}</h3>
                            <button onClick={closePreview} className="hover:text-red-600">
                                <FaTimes className="text-gray-600" />
                            </button>
                        </div>

                        <iframe src={previewUrl} title="PDF Preview" className="flex-1 w-full" />
                    </div>
                </div>
            )}
        </div>
    );
}