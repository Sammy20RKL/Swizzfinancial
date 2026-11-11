import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    FaChevronDown,
    FaChevronUp,
    FaLayerGroup,
    FaEllipsisV,
    FaSpinner,
    FaFileUpload,
    FaUpload,
    FaFileExcel,
    FaCheckCircle,
    FaTimesCircle,
    FaExclamationTriangle,
    FaInfoCircle,
    FaLightbulb,
    FaUndo,
} from "react-icons/fa";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import AddCreditBatchDrawer from "./AddCreditBatchDrawer";
import CreditBatchEntriesDrawer from "./CreditBatchEntriesDrawer";

const API_URL = import.meta.env.VITE_APP_FIN_URL;

// ─────────────────────────────────────────────────────────────────────────────
// TOLERANT RESPONSE UNWRAPPER
// Handles: { Success, Data: [...] }, { success, data: [...] }, raw array
// ─────────────────────────────────────────────────────────────────────────────
function unwrapList(json) {
    if (json == null) return [];
    if (Array.isArray(json)) return json;

    const data = json.Data ?? json.data;
    if (Array.isArray(data)) return data;

    if (data && typeof data === "object") {
        const inner =
            data.items ?? data.Items ??
            data.results ?? data.Results ??
            data.records ?? data.Records;
        if (Array.isArray(inner)) return inner;
    }
    return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// SMOOTH PROGRESS HOOK
// ─────────────────────────────────────────────────────────────────────────────
function useSmoothProgress() {
    const [progress, setProgress] = useState(0);
    const [message, setMessage]     = useState("");
    const intervalRef               = useRef(null);
    const currentRef                = useRef(0);

    const STAGES = [
        { at: 5,  msg: "Uploading file to server..." },
        { at: 15, msg: "Reading CSV rows..." },
        { at: 30, msg: "Validating member payroll numbers..." },
        { at: 45, msg: "Matching customer accounts..." },
        { at: 58, msg: "Calculating interest & principal splits..." },
        { at: 70, msg: "Processing DEP splits (entrance fee / share capital)..." },
        { at: 80, msg: "Writing batch entries to database..." },
        { at: 88, msg: "Logging discrepancies..." },
        { at: 93, msg: "Almost done..." },
    ];

    const start = () => {
        currentRef.current = 0;
        setProgress(0);
        setMessage("Starting import...");

        let stageIdx = 0;

        intervalRef.current = setInterval(() => {
            currentRef.current += 0.4;
            const val = Math.min(currentRef.current, 94);

            setProgress(val);

            if (stageIdx < STAGES.length && val >= STAGES[stageIdx].at) {
                setMessage(STAGES[stageIdx].msg);
                stageIdx++;
            }
        }, 40);
    };

    const setCustomMessage = (msg) => {
        setMessage(msg);
    };

    const setCustomProgress = (val) => {
        currentRef.current = val;
        setProgress(Math.min(val, 100));
    };

    const complete = (msg = "Import complete!") => {
        clearInterval(intervalRef.current);
        currentRef.current = 100;
        setProgress(100);
        setMessage(msg);
    };

    const fail = (msg = "Import failed.") => {
        clearInterval(intervalRef.current);
        setMessage(msg);
    };

    const reset = () => {
        clearInterval(intervalRef.current);
        currentRef.current = 0;
        setProgress(0);
        setMessage("");
    };

    useEffect(() => () => clearInterval(intervalRef.current), []);

    return { progress, message, start, complete, fail, reset, setCustomMessage, setCustomProgress };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS OVERLAY
// ─────────────────────────────────────────────────────────────────────────────
function ProgressOverlay({ progress, message, status, title, onClose, details }) {
    const getBarColor = () => {
        if (status === "error")    return "bg-red-500";
        if (status === "complete") return "bg-green-500";
        return "bg-indigo-500";
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-[60]">
            <div className="bg-white rounded-2xl p-8 w-[420px] shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                    <div className={`p-4 rounded-full ${status === "error" ? "bg-red-50" : status === "complete" ? "bg-green-50" : "bg-indigo-50"}`}>
                        {status === "complete"
                            ? <FaCheckCircle className="text-green-600 text-2xl" />
                            : status === "error"
                            ? <FaTimesCircle className="text-red-600 text-2xl" />
                            : <FaUpload className="text-indigo-600 text-2xl" />
                        }
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{message}</p>
                        {details && (
                            <p className="text-xs text-gray-400 mt-1">{details}</p>
                        )}
                    </div>
                </div>

                <div className="mb-3">
                    <div className="flex justify-between mb-1">
                        <span className="text-xs text-gray-500">Progress</span>
                        <span className="text-xs font-bold text-gray-700">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-100 ${getBarColor()} ${
                                status !== "complete" && status !== "error" ? "animate-pulse" : ""
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                </div>

                <div className="text-center text-sm mt-4">
                    {status === "complete" && (
                        <p className="text-green-600 font-semibold">✓ {message}</p>
                    )}
                    {status === "error" && (
                        <p className="text-red-600 font-semibold">✗ {message}</p>
                    )}
                    {status !== "complete" && status !== "error" && (
                        <p className="text-gray-400 text-xs">Please wait — do not close this window</p>
                    )}
                </div>

                {(status === "complete" || status === "error") && (
                    <div className="mt-5 flex justify-end">
                        <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={onClose}
                        >
                            Close
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// POST RESULT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function PostResultModal({ open, onClose, data }) {
    if (!open || !data) return null;

    const totalEntries = data.TotalEntries || data.totalEntries || data.TotalRows || data.totalRows || 0;
    const posted = data.Posted || data.posted || data.PostedCount || data.postedCount || 0;
    const skipped = data.Skipped || data.skipped || data.SkippedCount || data.skippedCount || 0;
    const failed = data.Failed || data.failed || data.FailedCount || data.failedCount || 0;
    const discrepancies = data.Discrepancies || data.discrepancies || data.Mismatches || data.mismatches || [];
    const batchId = data.BatchId || data.batchId || "N/A";

    const hasIssues = failed > 0 || skipped > 0 || (discrepancies && discrepancies.length > 0);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
                <div className={`rounded-t-2xl px-6 py-4 flex justify-between items-center ${hasIssues ? "bg-orange-600" : "bg-green-600"}`}>
                    <div>
                        <h2 className="text-white text-xl font-bold flex items-center gap-2">
                            {hasIssues
                                ? <><FaExclamationTriangle /> Post Completed with Issues</>
                                : <><FaCheckCircle /> Post Successful</>
                            }
                        </h2>
                        <p className="text-white/80 text-sm mt-1">
                            Batch #{typeof batchId === 'string' ? batchId.substring(0, 8) : batchId} — {totalEntries} total entries
                        </p>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-white/70 text-2xl">✕</button>
                </div>

                <div className="grid grid-cols-4 gap-3 p-4 border-b">
                    <div className="bg-gray-50 border rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500">Total Entries</p>
                        <p className="text-2xl font-bold text-gray-800">{totalEntries}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500">Posted</p>
                        <p className="text-2xl font-bold text-green-600">{posted}</p>
                    </div>
                    <div className={`border rounded-xl p-3 text-center ${skipped > 0 ? "bg-yellow-50 border-yellow-200" : "bg-gray-50"}`}>
                        <p className="text-xs text-gray-500">Skipped</p>
                        <p className={`text-2xl font-bold ${skipped > 0 ? "text-yellow-600" : "text-gray-400"}`}>{skipped}</p>
                    </div>
                    <div className={`border rounded-xl p-3 text-center ${failed > 0 ? "bg-red-50 border-red-200" : "bg-gray-50"}`}>
                        <p className="text-xs text-gray-500">Failed</p>
                        <p className={`text-2xl font-bold ${failed > 0 ? "text-red-600" : "text-gray-400"}`}>{failed}</p>
                    </div>
                </div>

                {discrepancies && discrepancies.length > 0 && (
                    <div className="flex-1 overflow-y-auto p-4">
                        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <FaExclamationTriangle className="text-orange-500" /> Discrepancies ({discrepancies.length})
                        </h4>
                        <div className="space-y-2">
                            {discrepancies.map((item, idx) => (
                                <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-800">
                                                {item.MemberName || item.memberName || item.PayrollNumber || item.payrollNumber || "Unknown"}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-0.5">{item.Reason || item.reason || item.Remarks || item.remarks || "No details provided"}</p>
                                        </div>
                                        {(item.Amount || item.amount) && (
                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                KES {Number(item.Amount || item.amount || 0).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!hasIssues && posted > 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center py-12">
                        <FaCheckCircle className="text-green-500 text-5xl mb-4" />
                        <p className="text-xl font-bold text-green-600">All {posted} entries posted successfully!</p>
                        <p className="text-gray-500 mt-2">No discrepancies or errors found.</p>
                    </div>
                )}

                {!hasIssues && posted === 0 && totalEntries === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center py-12">
                        <FaInfoCircle className="text-blue-500 text-5xl mb-4" />
                        <p className="text-xl font-bold text-blue-600">No entries to post</p>
                        <p className="text-gray-500 mt-2">This batch has no entries that need to be posted.</p>
                    </div>
                )}

                <div className="border-t p-4 flex justify-between items-center bg-gray-50 rounded-b-2xl">
                    <p className="text-sm text-gray-500">
                        {hasIssues
                            ? `${failed} failed, ${skipped} skipped — review discrepancies above`
                            : posted > 0 ? "All entries posted successfully" : "No entries processed"
                        }
                    </p>
                    <Button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPORT RESULT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ImportResultModal({ open, onClose, data }) {
    const [tab, setTab]       = useState("summary");
    const [search, setSearch] = useState("");

    if (!open || !data) return null;

    const errors     = data.Errors     || [];
    const mismatches = data.Mismatches || [];
    const hasIssues  = errors.length > 0 || mismatches.length > 0;

    const filteredErrors = errors.filter(e => {
        const term = search.toLowerCase();
        return (
            e.PayrollNumber?.toLowerCase().includes(term) ||
            e.MemberName?.toLowerCase().includes(term)   ||
            e.Remarks?.toLowerCase().includes(term)      ||
            e.ErrorCategory?.toLowerCase().includes(term)
        );
    });

    const getCategoryBadge = (category) => {
        const map = {
            "Member Not Found":    "bg-red-100 text-red-700",
            "Account Not Found":   "bg-orange-100 text-orange-700",
            "No Active Loan":      "bg-yellow-100 text-yellow-700",
            "Invalid Data":        "bg-pink-100 text-pink-700",
            "Duplicate Records":   "bg-purple-100 text-purple-700",
            "No Standing Order":   "bg-blue-100 text-blue-700",
            "Excess Payment":      "bg-cyan-100 text-cyan-700",
            "Configuration Error": "bg-gray-100 text-gray-700",
            "Other Error":         "bg-red-100 text-red-700",
        };
        return map[category] || "bg-gray-100 text-gray-700";
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">

                <div className={`rounded-t-2xl px-6 py-4 flex justify-between items-center ${hasIssues ? "bg-orange-600" : "bg-green-600"}`}>
                    <div>
                        <h2 className="text-white text-xl font-bold flex items-center gap-2">
                            {hasIssues
                                ? <><FaExclamationTriangle /> Import Completed with Issues</>
                                : <><FaCheckCircle /> Import Successful</>
                            }
                        </h2>
                        <p className="text-white/80 text-sm mt-1">
                            {data.TotalRows} rows processed — {data.PostedCount} posted — {data.MismatchCount} mismatches — {errors.length} errors
                        </p>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-white/70 text-2xl">✕</button>
                </div>

                <div className="grid grid-cols-4 gap-3 p-4 border-b">
                    <div className="bg-gray-50 border rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500">Total Rows</p>
                        <p className="text-2xl font-bold text-gray-800">{data.TotalRows || 0}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500">Posted</p>
                        <p className="text-2xl font-bold text-green-600">{data.PostedCount || 0}</p>
                    </div>
                    <div className={`border rounded-xl p-3 text-center ${data.MatchedCount > 0 ? "bg-blue-50 border-blue-200" : "bg-gray-50"}`}>
                        <p className="text-xs text-gray-500">Matched</p>
                        <p className={`text-2xl font-bold ${data.MatchedCount > 0 ? "text-blue-600" : "text-gray-400"}`}>{data.MatchedCount || 0}</p>
                    </div>
                    <div className={`border rounded-xl p-3 text-center ${errors.length > 0 ? "bg-red-50 border-red-200" : "bg-gray-50"}`}>
                        <p className="text-xs text-gray-500">Errors</p>
                        <p className={`text-2xl font-bold ${errors.length > 0 ? "text-red-600" : "text-gray-400"}`}>{errors.length}</p>
                    </div>
                </div>

                <div className="px-4 py-2 border-b bg-indigo-50">
                    <p className="text-sm text-gray-600">
                        Total Amount Posted:
                        <span className="font-bold text-indigo-700 text-lg ml-2">
                            KES {(data.TotalAmountPosted || 0).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                        </span>
                    </p>
                </div>

                {hasIssues && (
                    <div className="flex gap-2 px-4 pt-3">
                        <button
                            onClick={() => { setTab("summary"); setSearch(""); }}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                tab === "summary" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            Summary
                        </button>
                        {errors.length > 0 && (
                            <button
                                onClick={() => { setTab("errors"); setSearch(""); }}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                    tab === "errors" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                ❌ Errors ({errors.length})
                            </button>
                        )}
                        {mismatches.length > 0 && (
                            <button
                                onClick={() => { setTab("mismatches"); setSearch(""); }}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                    tab === "mismatches" ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                ⚠️ Mismatches ({mismatches.length})
                            </button>
                        )}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4">

                    {tab === "summary" && (
                        <div className="space-y-3">
                            {!hasIssues ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <FaCheckCircle className="text-green-500 text-6xl mb-4" />
                                    <p className="text-xl font-bold text-green-600">All records processed successfully!</p>
                                    <p className="text-gray-500 mt-2">
                                        {data.PostedCount} entries were posted with a total of KES {(data.TotalAmountPosted || 0).toLocaleString()}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {errors.length > 0 && (
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                            <h4 className="font-bold text-red-700 mb-2 flex items-center gap-2">
                                                <FaTimesCircle /> {errors.length} Failed Records
                                            </h4>
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {errors.map((e, idx) => (
                                                    <div key={idx} className="bg-white rounded-lg p-3 border border-red-100">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1">
                                                                <p className="font-semibold text-gray-800 text-sm">
                                                                    {e.MemberName || e.PayrollNumber || "Unknown"}
                                                                    {e.MemberName && e.PayrollNumber && (
                                                                        <span className="text-gray-400 font-normal ml-1">({e.PayrollNumber})</span>
                                                                    )}
                                                                </p>
                                                                <p className="text-xs text-gray-600 mt-0.5">{e.Remarks}</p>
                                                                {e.Solution && (
                                                                    <p className="text-xs text-amber-700 mt-1">
                                                                        💡 {e.Solution}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {e.Amount && (
                                                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                                                    KES {Number(e.Amount || 0).toLocaleString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {errors.length > 3 && (
                                                <button
                                                    onClick={() => setTab("errors")}
                                                    className="mt-2 text-xs text-red-600 underline"
                                                >
                                                    View all {errors.length} errors →
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {mismatches.length > 0 && (
                                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                            <h4 className="font-bold text-orange-700 mb-2 flex items-center gap-2">
                                                <FaExclamationTriangle /> {mismatches.length} Mismatches
                                            </h4>
                                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                                {mismatches.map((m, idx) => (
                                                    <div key={idx} className="bg-white rounded p-2 border border-orange-100 text-sm">
                                                        <span className="font-bold text-orange-600">Row {m.Row}:</span>
                                                        <span className="text-gray-700 ml-1">{m.Reason}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {tab === "errors" && (
                        <div>
                            <input
                                type="text"
                                placeholder="Search by payroll, name, category..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-400"
                            />
                            <div className="space-y-3">
                                {filteredErrors.length === 0 ? (
                                    <p className="text-center text-gray-400 py-8">No matching errors found</p>
                                ) : filteredErrors.map((e, idx) => (
                                    <div key={idx} className="bg-red-50 border border-red-200 rounded-xl p-4">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex items-center gap-2">
                                                <FaTimesCircle className="text-red-500 flex-shrink-0" />
                                                <div>
                                                    <p className="font-bold text-gray-800">
                                                        {e.MemberName || e.PayrollNumber || "Unknown Member"}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 mt-0.5">
                                                        {e.PayrollNumber && (
                                                            <span className="text-xs text-gray-500">
                                                                Payroll: <strong>{e.PayrollNumber}</strong>
                                                            </span>
                                                        )}
                                                        {e.MemberMobile && (
                                                            <span className="text-xs text-gray-500">
                                                                📞 {e.MemberMobile}
                                                            </span>
                                                        )}
                                                        {e.Amount && (
                                                            <span className="text-xs text-gray-500">
                                                                KES <strong>{Number(e.Amount || 0).toLocaleString()}</strong>
                                                            </span>
                                                        )}
                                                        {e.ProductCode && (
                                                            <span className="text-xs text-gray-500">
                                                                Product: <strong>{e.ProductCode}</strong>
                                                            </span>
                                                        )}
                                                        {e.Reference && (
                                                            <span className="text-xs text-gray-500">
                                                                Ref: <strong>{e.Reference}</strong>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap flex-shrink-0 ${getCategoryBadge(e.ErrorCategory)}`}>
                                                {e.ErrorCategory || "Error"}
                                            </span>
                                        </div>

                                        <div className="bg-white rounded-lg p-3 mb-2 border border-gray-100">
                                            <div className="flex items-start gap-2">
                                                <FaInfoCircle className="text-gray-400 mt-0.5 flex-shrink-0 text-sm" />
                                                <div>
                                                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Reason</p>
                                                    <p className="text-sm text-gray-700">{e.Remarks}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {e.Solution && (
                                            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                                                <div className="flex items-start gap-2">
                                                    <FaLightbulb className="text-amber-500 mt-0.5 flex-shrink-0 text-sm" />
                                                    <div>
                                                        <p className="text-xs text-amber-700 font-semibold uppercase mb-1">How to fix</p>
                                                        <p className="text-sm text-amber-800">{e.Solution}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tab === "mismatches" && (
                        <div className="space-y-2">
                            {mismatches.map((m, idx) => (
                                <div key={idx} className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                                    <div className="flex items-center gap-2">
                                        <FaExclamationTriangle className="text-orange-500 flex-shrink-0" />
                                        <div>
                                            <span className="font-bold text-orange-700">Row {m.Row}: </span>
                                            <span className="text-gray-700 text-sm">{m.Reason}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t p-4 flex justify-between items-center bg-gray-50 rounded-b-2xl">
                    <p className="text-sm text-gray-500">
                        {hasIssues
                            ? `${errors.length + mismatches.length} issue(s) found — fix and re-import affected rows`
                            : "All records imported successfully"
                        }
                    </p>
                    <Button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// REVERSE ENTRIES RESULT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ReverseEntriesResultModal({ open, onClose, data }) {
    if (!open || !data) return null;

    const isSuccess = data.success === true;
    const entriesRemoved = data.entriesRemoved || data.EntriesRemoved || 0;
    const discrepanciesCleared = data.discrepanciesCleared || data.DiscrepanciesCleared || 0;
    const postedEntriesKept = data.postedEntriesKept || data.PostedEntriesKept || 0;
    const batchReset = data.batchStatusReset || data.BatchStatusReset || false;
    const batchReference = data.batchReference || data.BatchReference || data.batchId || "N/A";
    const message = data.message || data.Message || "";

    const isInfo = !isSuccess && entriesRemoved === 0;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className={`rounded-t-2xl px-6 py-4 flex justify-between items-center ${
                    isSuccess ? "bg-green-600" : isInfo ? "bg-blue-600" : "bg-orange-600"
                }`}>
                    <div>
                        <h2 className="text-white text-xl font-bold flex items-center gap-2">
                            {isSuccess ? (
                                <><FaCheckCircle /> Entries Reversed</>
                            ) : isInfo ? (
                                <><FaInfoCircle /> Information</>
                            ) : (
                                <><FaExclamationTriangle /> Action Failed</>
                            )}
                        </h2>
                        <p className="text-white/80 text-sm mt-1">
                            Batch: {batchReference}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-white/70 text-2xl">✕</button>
                </div>

                <div className="p-6">
                    <p className="text-gray-700 mb-4">{message}</p>

                    {isSuccess && (
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                                <p className="text-xs text-gray-500">Entries Removed</p>
                                <p className="text-2xl font-bold text-green-600">{entriesRemoved}</p>
                            </div>
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
                                <p className="text-xs text-gray-500">Discrepancies Cleared</p>
                                <p className="text-2xl font-bold text-orange-600">{discrepanciesCleared}</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center col-span-2">
                                <p className="text-xs text-gray-500">Posted Entries Kept</p>
                                <p className="text-2xl font-bold text-blue-600">{postedEntriesKept}</p>
                            </div>
                            {batchReset && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center col-span-2">
                                    <p className="text-xs text-gray-500">Batch Status</p>
                                    <p className="text-sm font-bold text-yellow-600">Reset to Pending</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="border-t p-4 flex justify-end bg-gray-50 rounded-b-2xl">
                    <Button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function Creditbatches() {
    const [batches, setBatches]                 = useState([]);
    const [loading, setLoading]                 = useState(true);
    const [expandedBatch, setExpandedBatch]     = useState(null);
    const [addDrawerOpen, setAddDrawerOpen]     = useState(false);
    const [fileModalOpen, setFileModalOpen]     = useState(false);
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [entriesDrawerOpen, setEntriesDrawerOpen] = useState(false);
    const [selectedBatch, setSelectedBatch]     = useState(null);

    // Import result modal
    const [resultModalOpen, setResultModalOpen] = useState(false);
    const [resultData, setResultData]           = useState(null);

    // Post result modal
    const [postResultModalOpen, setPostResultModalOpen] = useState(false);
    const [postResultData, setPostResultData]           = useState(null);

    // Reverse entries result modal
    const [reverseResultModalOpen, setReverseResultModalOpen] = useState(false);
    const [reverseResultData, setReverseResultData]           = useState(null);

    // Import Progress overlay state
    const [importProgressVisible, setImportProgressVisible] = useState(false);
    const [importProgressStatus, setImportProgressStatus]   = useState("idle");
    const [importDetails, setImportDetails]                 = useState("");
    const smoothProgress = useSmoothProgress();

    // Post Progress overlay state
    const [postProgressVisible, setPostProgressVisible] = useState(false);
    const [postProgressStatus, setPostProgressStatus]   = useState("idle");
    const [postProgressValue, setPostProgressValue]     = useState(0);
    const [postProgressMessage, setPostProgressMessage] = useState("");
    const [postDetails, setPostDetails]                 = useState("");

    // Polling refs
    const importPollIntervalRef = useRef(null);
    const postPollIntervalRef = useRef(null);
    const isImportPollingRef = useRef(false);
    const isPostPollingRef = useRef(false);

    const updateBatchStatus = (batchId, newStatus, newStatusDescription) => {
        setBatches(prev =>
            prev.map(b =>
                b.Id === batchId
                    ? { ...b, Status: newStatus, StatusDescription: newStatusDescription }
                    : b
            )
        );
    };

    // ── FIXED: unwrap the PascalCase envelope { Success, Data: [...] } ──
    const fetchCreditBatches = () => {
        setLoading(true);
        fetch(`${API_URL}/api/values/creditbatches`)
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                const text = await res.text();
                try {
                    return text ? JSON.parse(text) : null;
                } catch {
                    throw new Error(
                        `Server returned non-JSON (HTTP ${res.status}). ` +
                        `Check VITE_APP_FIN_URL and the endpoint path. ` +
                        `Body preview: ${text.slice(0, 120)}`
                    );
                }
            })
            .then((json) => {
                const list = unwrapList(json);
                setBatches(list);
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch Credit Batches Error:", err);
                setBatches([]);
                setLoading(false);
                Swal.fire({
                    title: "Error Loading Batches",
                    text: err.message,
                    icon: "error",
                    confirmButtonColor: "#4f46e5",
                });
            });
    };

    useEffect(() => {
        fetchCreditBatches();
    }, []);

    // ===== HANDLE REVERSE ENTRIES =====
    const handleReverseEntries = async (batchId, batchReference) => {
        const result = await Swal.fire({
            title: "Reverse Unposted Entries?",
            html: `This will remove all <strong>unposted</strong> entries from batch <strong>${batchReference}</strong>.<br/><br/>Posted entries will be kept.<br/><br/>This action cannot be undone.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Reverse Entries",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#4f46e5",
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(
                `${API_URL}/api/values/creditbatch/${batchId}/entries`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        ...(import.meta.env.DEV && { "ngrok-skip-browser-warning": "true" })
                    }
                }
            );

            let data = null;
            let responseText = null;

            try {
                const responseClone = response.clone();
                responseText = await responseClone.text();

                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error("Failed to parse JSON:", responseText);
                    throw new Error(`Server returned invalid JSON. Response: ${responseText.substring(0, 200)}...`);
                }
            } catch (parseError) {
                console.error("Error reading response:", parseError);
                throw new Error("Failed to read server response");
            }

            setReverseResultData(data);
            setReverseResultModalOpen(true);

            if (response.ok && data.success !== false) {
                fetchCreditBatches();
            }

        } catch (err) {
            console.error("Reverse Entries Error:", err);

            let errorMessage = err.message || "Failed to reverse entries";
            if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
                errorMessage = "Cannot connect to server. Please check your connection.";
            }

            Swal.fire({
                title: "Action Failed",
                text: errorMessage,
                icon: "error",
                confirmButtonColor: "#4f46e5",
            });
        }
    };

    // ===== HANDLE IMPORT WITH POLLING =====
    const handleChooseFile = async (batchId, file) => {
        if (!file) return;
        if (isImportPollingRef.current) {
            Swal.fire({
                title: "Import in Progress",
                text: "Please wait for the current import to complete.",
                icon: "info",
                confirmButtonColor: "#4f46e5",
            });
            return;
        }

        const warningResult = await Swal.fire({
            title: "⚠️ WARNING! Database Modification",
            html: `
                <div style="text-align: left; padding: 10px 0;">
                    <p style="color: #dc2626; font-weight: bold; font-size: 16px;">
                        You are about to make changes to the database!
                    </p>
                    <p style="margin-top: 12px;">
                        <strong>Important:</strong> Please ensure you have backed up the database
                        before proceeding with this import.
                    </p>
                    <div style="margin-top: 16px; padding: 12px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                        <p style="color: #92400e; font-size: 14px;">
                            <strong>⚠️ This action will:</strong><br>
                            • Import data into the credit batch<br>
                            • Create new entries in the system<br>
                            • Cannot be undone easily
                        </p>
                    </div>
                    <p style="margin-top: 12px; color: #6b7280; font-size: 13px;">
                        Do you want to continue?
                    </p>
                </div>
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Continue with Import",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            reverseButtons: true,
            width: 500,
        });

        if (!warningResult.isConfirmed) {
            return;
        }

        setImportProgressVisible(true);
        setImportProgressStatus("importing");
        smoothProgress.start();
        setImportDetails("Preparing file...");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const submitResponse = await fetch(
                `${API_URL}/api/values/creditbatch/${batchId}/import`,
                {
                    method: "POST",
                    body: formData,
                    headers: {
                        "Accept": "application/json",
                        ...(import.meta.env.DEV && { "ngrok-skip-browser-warning": "true" })
                    }
                }
            );

            if (!submitResponse.ok) {
                let errorMessage = `HTTP ${submitResponse.status}: ${submitResponse.statusText}`;
                try {
                    const errorData = await submitResponse.json();
                    if (errorData.Message) errorMessage = errorData.Message;
                    else if (errorData.message) errorMessage = errorData.message;
                    else if (errorData.title) errorMessage = errorData.title;
                } catch (e) {}
                throw new Error(errorMessage);
            }

            const submitData = await submitResponse.json();
            const jobId = submitData.jobId || submitData.JobId;

            if (!jobId) {
                throw new Error("No job ID returned from server");
            }

            console.log("Import submitted, jobId:", jobId);
            isImportPollingRef.current = true;
            setImportDetails(`Processing job ${jobId.substring(0, 8)}...`);

            let isComplete = false;
            let pollCount = 0;
            const maxPolls = 300;

            if (importPollIntervalRef.current) {
                clearInterval(importPollIntervalRef.current);
                importPollIntervalRef.current = null;
            }

            importPollIntervalRef.current = setInterval(async () => {
                pollCount++;

                try {
                    const statusResponse = await fetch(
                        `${API_URL}/api/values/import/status/${jobId}`,
                        {
                            headers: {
                                "Accept": "application/json",
                                ...(import.meta.env.DEV && { "ngrok-skip-browser-warning": "true" })
                            }
                        }
                    );

                    if (!statusResponse.ok) {
                        console.error("Status check failed:", statusResponse.status);
                        return;
                    }

                    const statusData = await statusResponse.json();
                    console.log("Import Status update:", statusData);

                    const percentComplete = statusData.percentComplete || statusData.PercentComplete || 0;
                    const processedRows = statusData.processedRows || statusData.ProcessedRows || 0;
                    const totalRows = statusData.totalRows || statusData.TotalRows || 0;
                    const matchedCount = statusData.matchedCount || statusData.MatchedCount || 0;
                    const mismatchCount = statusData.mismatchCount || statusData.MismatchCount || 0;

                    smoothProgress.setCustomProgress(percentComplete);

                    let details = `Processed: ${processedRows}/${totalRows} rows`;
                    if (matchedCount > 0) details += ` | Matched: ${matchedCount}`;
                    if (mismatchCount > 0) details += ` | Mismatches: ${mismatchCount}`;
                    setImportDetails(details);

                    if (percentComplete < 20) {
                        smoothProgress.setCustomMessage("Uploading and processing file...");
                    } else if (percentComplete < 40) {
                        smoothProgress.setCustomMessage(`Validating data... (${processedRows}/${totalRows} rows)`);
                    } else if (percentComplete < 60) {
                        smoothProgress.setCustomMessage(`Matching records... (${processedRows}/${totalRows} rows)`);
                    } else if (percentComplete < 80) {
                        smoothProgress.setCustomMessage(`Processing entries... (${processedRows}/${totalRows} rows)`);
                    } else if (percentComplete < 95) {
                        smoothProgress.setCustomMessage(`Finalizing import... (${processedRows}/${totalRows} rows)`);
                    } else {
                        smoothProgress.setCustomMessage("Almost done...");
                    }

                    if (statusData.isComplete || statusData.IsComplete || statusData.status === "Complete" || statusData.status === "complete") {
                        isComplete = true;
                        isImportPollingRef.current = false;
                        if (importPollIntervalRef.current) {
                            clearInterval(importPollIntervalRef.current);
                            importPollIntervalRef.current = null;
                        }

                        try {
                            const resultResponse = await fetch(
                                `${API_URL}/api/values/import/result/${jobId}`,
                                {
                                    headers: {
                                        "Accept": "application/json",
                                        ...(import.meta.env.DEV && { "ngrok-skip-browser-warning": "true" })
                                    }
                                }
                            );

                            if (!resultResponse.ok) {
                                throw new Error(`Failed to fetch result: ${resultResponse.status}`);
                            }

                            const resultData = await resultResponse.json();
                            console.log("Import result:", resultData);

                            const normalizedData = {
                                BatchId: resultData.BatchId || resultData.batchId || "",
                                FileName: resultData.FileName || resultData.fileName || "",
                                SavedPath: resultData.SavedPath || resultData.savedPath || "",
                                TotalRows: resultData.TotalRows || resultData.totalRows || 0,
                                MatchedCount: resultData.MatchedCount || resultData.matchedCount || 0,
                                MismatchCount: resultData.MismatchCount || resultData.mismatchCount || 0,
                                PostedCount: resultData.PostedCount || resultData.postedCount || 0,
                                TotalAmountPosted: resultData.TotalAmountPosted || resultData.totalAmountPosted || 0,
                                Mismatches: resultData.Mismatches || resultData.mismatches || [],
                                Errors: resultData.Errors || resultData.errors || []
                            };

                            const hasIssues = (normalizedData.Errors?.length > 0) || (normalizedData.Mismatches?.length > 0);
                            const postedCount = normalizedData.PostedCount || 0;
                            const errorCount = normalizedData.Errors?.length || 0;
                            const mismatchCount = normalizedData.MismatchCount || 0;

                            if (errorCount > 0 || mismatchCount > 0) {
                                await Swal.fire({
                                    icon: "warning",
                                    title: "⚠️ Unimported Records Found",
                                    html: `
                                        <div style="text-align: left;">
                                            <p><strong>${errorCount + mismatchCount}</strong> records were not imported:</p>
                                            <ul style="margin: 12px 0; padding-left: 20px;">
                                                <li>❌ <strong>${errorCount}</strong> error(s) - records that failed completely</li>
                                                <li>⚠️ <strong>${mismatchCount}</strong> mismatch(es) - records with data issues</li>
                                            </ul>
                                            <p style="margin-top: 12px; color: #6b7280;">
                                                These records need to be reviewed and fixed before they can be imported.
                                            </p>
                                            <p style="margin-top: 8px; color: #6b7280;">
                                                <strong>Total rows processed:</strong> ${normalizedData.TotalRows}<br>
                                                <strong>Successfully posted:</strong> ${postedCount}
                                            </p>
                                        </div>
                                    `,
                                    confirmButtonText: "View Details",
                                    confirmButtonColor: "#4f46e5",
                                    width: 500,
                                });
                            }

                            let completionMsg = "";
                            if (hasIssues) {
                                completionMsg = `Done — ${postedCount} posted, ${mismatchCount + errorCount} issues found (${mismatchCount} mismatches, ${errorCount} errors)`;
                            } else {
                                completionMsg = `All ${postedCount} records posted successfully!`;
                            }

                            smoothProgress.complete(completionMsg);
                            setImportProgressStatus("complete");
                            setImportDetails(`Completed in ${Math.round(pollCount * 3)} seconds`);

                            setTimeout(() => {
                                setImportProgressVisible(false);
                                smoothProgress.reset();
                                setImportProgressStatus("idle");
                                setImportDetails("");
                                setResultData(normalizedData);
                                setResultModalOpen(true);
                                fetchCreditBatches();
                            }, 1200);

                        } catch (resultError) {
                            console.error("Error fetching result:", resultError);
                            throw new Error("Failed to fetch import result");
                        }
                    }

                    if (statusData.status === "Error" || statusData.status === "error" || statusData.isError) {
                        isImportPollingRef.current = false;
                        if (importPollIntervalRef.current) {
                            clearInterval(importPollIntervalRef.current);
                            importPollIntervalRef.current = null;
                        }
                        throw new Error(statusData.errorMessage || statusData.ErrorMessage || "Import failed with error");
                    }

                    if (pollCount >= maxPolls) {
                        isImportPollingRef.current = false;
                        if (importPollIntervalRef.current) {
                            clearInterval(importPollIntervalRef.current);
                            importPollIntervalRef.current = null;
                        }
                        throw new Error("Import is taking too long. Please check status manually.");
                    }

                } catch (pollError) {
                    console.error("Polling error:", pollError);
                    if (pollError.message && (
                        pollError.message.includes("Failed to fetch") ||
                        pollError.message.includes("NetworkError") ||
                        pollError.message.includes("timeout")
                    )) {
                        isImportPollingRef.current = false;
                        if (importPollIntervalRef.current) {
                            clearInterval(importPollIntervalRef.current);
                            importPollIntervalRef.current = null;
                        }
                        throw pollError;
                    }
                }
            }, 3000);

        } catch (err) {
            console.error("Upload Error:", err);

            isImportPollingRef.current = false;
            if (importPollIntervalRef.current) {
                clearInterval(importPollIntervalRef.current);
                importPollIntervalRef.current = null;
            }

            let errorMessage = err.message || "Import failed";

            if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
                errorMessage = "Cannot connect to server. Please check:\n• Server is running\n• Your internet connection\n• CORS settings\n• The API URL is correct";
            } else if (errorMessage.includes("404")) {
                errorMessage = "Server endpoint not found. Please check the API URL.";
            } else if (errorMessage.includes("500")) {
                errorMessage = "Server error occurred. Please try again later.";
            } else if (errorMessage.includes("413")) {
                errorMessage = "File is too large. Please try a smaller file.";
            } else if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("Connection refused")) {
                errorMessage = "Server is not responding. Please make sure the server is running.";
            } else if (errorMessage.includes("CORS")) {
                errorMessage = "CORS error: The server is not allowing requests from this origin. Check server CORS configuration.";
            }

            smoothProgress.fail(errorMessage);
            setImportProgressStatus("error");
            setImportDetails("Import failed");

            setTimeout(() => {
                setImportProgressVisible(false);
                smoothProgress.reset();
                setImportProgressStatus("idle");
                setImportDetails("");
                Swal.fire({
                    title: "Import Failed",
                    html: errorMessage.replace(/\n/g, '<br>'),
                    icon: "error",
                    confirmButtonColor: "#4f46e5",
                    width: 500,
                });
            }, 2000);
        }
    };

    // ===== HANDLE POST WITH POLLING =====
    const handlePostBatch = async (batchId) => {
        const warningResult = await Swal.fire({
            title: "⚠️ WARNING! Post Credit Batch",
            html: `
                <div style="text-align: left; padding: 10px 0;">
                    <p style="color: #dc2626; font-weight: bold; font-size: 16px;">
                        You are about to post this credit batch!
                    </p>
                    <p style="margin-top: 12px;">
                        <strong>Important:</strong> Please ensure you have backed up the database
                        before proceeding with this post.
                    </p>
                    <div style="margin-top: 16px; padding: 12px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                        <p style="color: #92400e; font-size: 14px;">
                            <strong>⚠️ This action will:</strong><br>
                            • Post all pending entries in this batch<br>
                            • Update account balances<br>
                            • Create journal entries<br>
                            • <strong>Cannot be undone</strong>
                        </p>
                    </div>
                    <p style="margin-top: 12px; color: #6b7280; font-size: 13px;">
                        Are you sure you want to continue?
                    </p>
                </div>
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Post Batch",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            reverseButtons: true,
            width: 500,
        });

        if (!warningResult.isConfirmed) {
            return;
        }

        if (isPostPollingRef.current) {
            Swal.fire({
                title: "Post in Progress",
                text: "Please wait for the current post operation to complete.",
                icon: "info",
                confirmButtonColor: "#4f46e5",
            });
            return;
        }

        setPostProgressVisible(true);
        setPostProgressStatus("processing");
        setPostProgressMessage("Starting post operation...");
        setPostProgressValue(0);
        setPostDetails("Initializing...");

        try {
            const startResponse = await fetch(
                `${API_URL}/api/values/creditbatch/${batchId}/post`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        ...(import.meta.env.DEV && { "ngrok-skip-browser-warning": "true" })
                    }
                }
            );

            if (!startResponse.ok) {
                let errorMessage = `HTTP ${startResponse.status}: ${startResponse.statusText}`;
                try {
                    const errorData = await startResponse.json();
                    if (errorData.Message) errorMessage = errorData.Message;
                    else if (errorData.message) errorMessage = errorData.message;
                } catch (e) {}
                throw new Error(errorMessage);
            }

            const startData = await startResponse.json();
            const jobId = startData.jobId || startData.JobId;

            if (!jobId) {
                throw new Error("No job ID returned from server");
            }

            const totalEntries = startData.totalEntries || startData.TotalEntries || 0;
            console.log("Post job started, jobId:", jobId, "Total entries:", totalEntries);
            isPostPollingRef.current = true;
            setPostDetails(`Total entries: ${totalEntries} | Processing...`);

            let isComplete = false;
            let pollCount = 0;
            const maxPolls = 300;

            if (postPollIntervalRef.current) {
                clearInterval(postPollIntervalRef.current);
                postPollIntervalRef.current = null;
            }

            postPollIntervalRef.current = setInterval(async () => {
                pollCount++;

                try {
                    const statusResponse = await fetch(
                        `${API_URL}/api/values/poststatus/${jobId}`,
                        {
                            headers: {
                                "Accept": "application/json",
                                ...(import.meta.env.DEV && { "ngrok-skip-browser-warning": "true" })
                            }
                        }
                    );

                    if (!statusResponse.ok) {
                        console.error("Post status check failed:", statusResponse.status);
                        return;
                    }

                    const statusData = await statusResponse.json();
                    console.log("Post Status update:", statusData);

                    const percentComplete = statusData.percentComplete || statusData.PercentComplete || 0;
                    const processedEntries = statusData.processedEntries || statusData.ProcessedEntries || 0;
                    const postedCount = statusData.postedCount || statusData.PostedCount || 0;
                    const totalEntries = statusData.totalEntries || statusData.TotalEntries || 0;
                    const skippedCount = statusData.skippedCount || statusData.SkippedCount || 0;
                    const failedCount = statusData.failedCount || statusData.FailedCount || 0;

                    setPostProgressValue(percentComplete);

                    let details = `Processed: ${processedEntries}/${totalEntries} entries`;
                    if (postedCount > 0) details += ` | Posted: ${postedCount}`;
                    if (skippedCount > 0) details += ` | Skipped: ${skippedCount}`;
                    if (failedCount > 0) details += ` | Failed: ${failedCount}`;
                    setPostDetails(details);

                    if (percentComplete < 25) {
                        setPostProgressMessage("Validating batch entries...");
                    } else if (percentComplete < 50) {
                        setPostProgressMessage(`Posting entries... (${postedCount} posted)`);
                    } else if (percentComplete < 75) {
                        setPostProgressMessage(`Updating account balances... (${postedCount} posted)`);
                    } else if (percentComplete < 95) {
                        setPostProgressMessage(`Finalizing post... (${postedCount} posted)`);
                    } else {
                        setPostProgressMessage("Almost done...");
                    }

                    if (statusData.isComplete || statusData.IsComplete || statusData.status === "Complete" || statusData.status === "complete") {
                        isComplete = true;
                        isPostPollingRef.current = false;
                        if (postPollIntervalRef.current) {
                            clearInterval(postPollIntervalRef.current);
                            postPollIntervalRef.current = null;
                        }

                        try {
                            const resultResponse = await fetch(
                                `${API_URL}/api/values/postresult/${jobId}`,
                                {
                                    headers: {
                                        "Accept": "application/json",
                                        ...(import.meta.env.DEV && { "ngrok-skip-browser-warning": "true" })
                                    }
                                }
                            );

                            if (!resultResponse.ok) {
                                throw new Error(`Failed to fetch post result: ${resultResponse.status}`);
                            }

                            const resultData = await resultResponse.json();
                            console.log("Post result:", resultData);

                            const normalizedResult = {
                                BatchId: resultData.BatchId || resultData.batchId || batchId,
                                TotalEntries: resultData.TotalEntries || resultData.totalEntries || resultData.TotalRows || resultData.totalRows || 0,
                                Posted: resultData.Posted || resultData.posted || resultData.PostedCount || resultData.postedCount || 0,
                                Skipped: resultData.Skipped || resultData.skipped || resultData.SkippedCount || resultData.skippedCount || 0,
                                Failed: resultData.Failed || resultData.failed || resultData.FailedCount || resultData.failedCount || 0,
                                Discrepancies: resultData.Discrepancies || resultData.discrepancies || resultData.Mismatches || resultData.mismatches || [],
                                ...resultData
                            };

                            setPostProgressValue(100);
                            setPostProgressMessage("Batch posted successfully!");
                            setPostProgressStatus("complete");
                            setPostDetails(`Completed in ${Math.round(pollCount * 3)} seconds`);

                            setTimeout(() => {
                                setPostProgressVisible(false);
                                setPostProgressStatus("idle");
                                setPostProgressValue(0);
                                setPostProgressMessage("");
                                setPostDetails("");

                                setPostResultData(normalizedResult);
                                setPostResultModalOpen(true);
                                fetchCreditBatches();
                            }, 1200);

                        } catch (resultError) {
                            console.error("Error fetching post result:", resultError);
                            throw new Error("Failed to fetch post result");
                        }
                    }

                    if (statusData.status === "Error" || statusData.status === "error" || statusData.isError) {
                        isPostPollingRef.current = false;
                        if (postPollIntervalRef.current) {
                            clearInterval(postPollIntervalRef.current);
                            postPollIntervalRef.current = null;
                        }
                        throw new Error(statusData.errorMessage || statusData.ErrorMessage || "Post failed with error");
                    }

                    if (pollCount >= maxPolls) {
                        isPostPollingRef.current = false;
                        if (postPollIntervalRef.current) {
                            clearInterval(postPollIntervalRef.current);
                            postPollIntervalRef.current = null;
                        }
                        throw new Error("Post is taking too long. Please check status manually.");
                    }

                } catch (pollError) {
                    console.error("Polling error:", pollError);
                    if (pollError.message && (
                        pollError.message.includes("Failed to fetch") ||
                        pollError.message.includes("NetworkError") ||
                        pollError.message.includes("timeout")
                    )) {
                        isPostPollingRef.current = false;
                        if (postPollIntervalRef.current) {
                            clearInterval(postPollIntervalRef.current);
                            postPollIntervalRef.current = null;
                        }
                        throw pollError;
                    }
                }
            }, 3000);

        } catch (err) {
            console.error("Post Error:", err);

            isPostPollingRef.current = false;
            if (postPollIntervalRef.current) {
                clearInterval(postPollIntervalRef.current);
                postPollIntervalRef.current = null;
            }

            let errorMessage = err.message || "Post failed";
            if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
                errorMessage = "Cannot connect to server. Please check your connection.";
            } else if (errorMessage.includes("404")) {
                errorMessage = "Server endpoint not found. Please check the API URL.";
            } else if (errorMessage.includes("500")) {
                errorMessage = "Server error occurred. Please try again later.";
            }

            setPostProgressMessage("Post failed: " + errorMessage);
            setPostProgressStatus("error");
            setPostDetails("Post failed");

            setTimeout(() => {
                setPostProgressVisible(false);
                setPostProgressStatus("idle");
                setPostProgressValue(0);
                setPostProgressMessage("");
                setPostDetails("");
                Swal.fire({
                    title: "Post Failed",
                    text: errorMessage,
                    icon: "error",
                    confirmButtonColor: "#4f46e5",
                });
            }, 2000);
        }
    };

    useEffect(() => {
        return () => {
            if (importPollIntervalRef.current) {
                clearInterval(importPollIntervalRef.current);
                importPollIntervalRef.current = null;
            }
            if (postPollIntervalRef.current) {
                clearInterval(postPollIntervalRef.current);
                postPollIntervalRef.current = null;
            }
            isImportPollingRef.current = false;
            isPostPollingRef.current = false;
        };
    }, []);

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg">

            {importProgressVisible && (
                <ProgressOverlay
                    progress={smoothProgress.progress}
                    message={smoothProgress.message}
                    status={importProgressStatus}
                    title="Importing File..."
                    details={importDetails}
                    onClose={() => {
                        if (importProgressStatus === "complete" || importProgressStatus === "error") {
                            setImportProgressVisible(false);
                            smoothProgress.reset();
                            setImportProgressStatus("idle");
                            setImportDetails("");
                        }
                    }}
                />
            )}

            {postProgressVisible && (
                <ProgressOverlay
                    progress={postProgressValue}
                    message={postProgressMessage}
                    status={postProgressStatus}
                    title="Posting Batch..."
                    details={postDetails}
                    onClose={() => {
                        if (postProgressStatus === "complete" || postProgressStatus === "error") {
                            setPostProgressVisible(false);
                            setPostProgressStatus("idle");
                            setPostProgressValue(0);
                            setPostProgressMessage("");
                            setPostDetails("");
                        }
                    }}
                />
            )}

            <ImportResultModal
                open={resultModalOpen}
                onClose={() => { setResultModalOpen(false); setResultData(null); }}
                data={resultData}
            />

            <PostResultModal
                open={postResultModalOpen}
                onClose={() => { setPostResultModalOpen(false); setPostResultData(null); }}
                data={postResultData}
            />

            <ReverseEntriesResultModal
                open={reverseResultModalOpen}
                onClose={() => { setReverseResultModalOpen(false); setReverseResultData(null); }}
                data={reverseResultData}
            />

            <div className="flex justify-between items-center mb-6 bg-indigo-700 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaLayerGroup /> Credit Batches
                </h2>
                <Button onClick={() => setAddDrawerOpen(true)} className="bg-indigo-500 hover:bg-indigo-600 flex items-center gap-2">
                    + New Credit Batch
                </Button>
            </div>

            <div className="bg-gray-200 p-4 rounded-sm">
                <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-3">Batch No</span>
                    <span className="col-span-3">Credit Type</span>
                    <span className="col-span-2">Posting Period</span>
                    <span className="col-span-2">Status</span>
                    <span className="col-span-2 text-right">Actions</span>
                </div>

                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                                {Array.from({ length: 12 }).map((__, j) => (
                                    <div key={j} className="h-4 bg-gray-200 rounded" />
                                ))}
                            </div>
                        ))}
                    </div>
                ) : batches.length > 0 ? (
                    <div className="space-y-2">
                        {batches.map((batch) => {
                            const isPosted = batch.Status === 2;
                            const batchNoDisplay =
                                batch.PaddedBatchNumber ??
                                String(batch.BatchNumber ?? "").padStart(4, "0");
                            const statusDisplay =
                                batch.StatusDescription ??
                                (batch.Status === 1 ? "Pending" : batch.Status === 2 ? "Posted" : "Unknown");

                            return (
                                <div key={batch.Id} className="bg-white rounded-lg shadow-lg border">
                                    <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                                        <span className="font-medium text-green-700 col-span-3">{batchNoDisplay}</span>
                                        <span className="col-span-3">{batch.CreditTypeDescription}</span>
                                        <span className="col-span-2">{batch.PostingPeriodDescription ?? "—"}</span>
                                        <span className={`text-sm col-span-2 px-2 py-1 rounded-full text-center ${
                                            isPosted ? "bg-green-600 text-white" : "bg-yellow-500 text-white"
                                        }`}>
                                            {statusDisplay}
                                        </span>

                                        <span className="col-span-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="bg-gray-700 hover:bg-gray-600 text-white"
                                                onClick={() => setExpandedBatch(expandedBatch === batch.Id ? null : batch.Id)}
                                            >
                                                {expandedBatch === batch.Id
                                                    ? <><FaChevronUp /> Hide</>
                                                    : <><FaChevronDown /> View</>
                                                }
                                            </Button>
                                        </span>

                                        <span className="col-span-1 flex justify-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                                        <FaEllipsisV className="h-4 w-4 text-gray-600" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="bg-indigo-700 hover:bg-indigo-500 text-white w-full"
                                                            onClick={() => { setSelectedBatchId(batch.Id); setFileModalOpen(true); }}
                                                            disabled={isPosted}
                                                        >
                                                            <FaFileUpload className="mr-2" /> Upload File
                                                        </Button>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-white w-full bg-gray-700 hover:bg-gray-500"
                                                            onClick={() => { setSelectedBatchId(batch.Id); setSelectedBatch(batch); setEntriesDrawerOpen(true); }}
                                                        >
                                                            View Entries
                                                        </Button>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="bg-green-600 text-white w-full hover:bg-green-500"
                                                            disabled={isPosted}
                                                            onClick={() => handlePostBatch(batch.Id)}
                                                        >
                                                            Post Batch
                                                        </Button>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className={`w-full ${isPosted ? "bg-gray-400 text-gray-600 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700"}`}
                                                            disabled={isPosted}
                                                            onClick={() => handleReverseEntries(batch.Id, batch.PaddedBatchNumber ?? batchNoDisplay)}
                                                        >
                                                            <FaUndo className="mr-2" /> Reverse Entries
                                                        </Button>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </span>
                                    </div>

                                    {expandedBatch === batch.Id && (
                                        <div className="border-t bg-gray-50 p-4 grid grid-cols-3 gap-4 text-sm">
                                            <div><strong>Reference:</strong><p>{batch.Reference}</p></div>
                                            <div>
                                                <strong>Month:</strong>
                                                <p>
                                                    {batch.MonthDescription ??
                                                        (batch.Month
                                                            ? ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(batch.Month) - 1] ?? batch.Month
                                                            : "—")}
                                                </p>
                                            </div>
                                            <div><strong>Priority:</strong><p>{batch.PriorityDescription ?? batch.Priority ?? "—"}</p></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-gray-500 text-center mt-4">
                        <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42 h-auto" />
                        <p className="font-medium text-gray-400">No Credit Batches Found.</p>
                    </div>
                )}
            </div>

            <AddCreditBatchDrawer
                open={addDrawerOpen}
                onClose={() => setAddDrawerOpen(false)}
                onSuccess={fetchCreditBatches}
            />

            {fileModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
                    <div className="bg-white rounded-2xl p-6 w-96 relative">
                        <div className="flex justify-between items-center bg-indigo-600 p-3 rounded-2xl text-white mb-3">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <FaFileExcel /> Upload File
                            </h3>
                            <button onClick={() => setFileModalOpen(false)} className="text-gray-100 hover:text-gray-200">✕</button>
                        </div>
                        <div className="p-4 border-8 rounded-2xl flex justify-around items-center">
                            <input
                                type="file"
                                id={`fileInput-${selectedBatchId}`}
                                className="hidden"
                                accept=".csv,.xlsx,.xls"
                                onChange={(e) => {
                                    if (e.target.files[0]) {
                                        handleChooseFile(selectedBatchId, e.target.files[0]);
                                        setFileModalOpen(false);
                                    }
                                }}
                            />
                            <label
                                htmlFor={`fileInput-${selectedBatchId}`}
                                className="cursor-pointer px-6 py-3 border-2 border-dashed rounded-lg text-sm text-indigo-600 border-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"
                            >
                                <FaFileUpload /> Choose File (CSV/Excel)
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-2">Supported: .csv, .xlsx, .xls</p>
                    </div>
                </div>
            )}

            <CreditBatchEntriesDrawer
                open={entriesDrawerOpen}
                creditBatchId={selectedBatchId}
                batch={selectedBatch}
                onClose={() => setEntriesDrawerOpen(false)}
                onBatchPosted={updateBatchStatus}
            />
        </div>
    );
}