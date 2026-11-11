import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";

const RAW_FIN_BASE = import.meta.env.VITE_APP_FIN_URL;
const FIN_BASE = (RAW_FIN_BASE || "").replace(/\/+$/, "");

// Fail loudly & visibly if the env var wasn't set — otherwise fetches
// silently become relative URLs against Vite and fail as HTML errors.
if (!FIN_BASE) {
    // eslint-disable-next-line no-console
    console.error(
        "🚨 VITE_APP_FIN_URL is not set. Credit batch drawer cannot reach the API. " +
        "Add it to .env and restart `npm run dev`."
    );
}

/**
 * Safe JSON parse — surfaces a useful error instead of a cryptic
 * "Unexpected token '<'" when the server returns HTML (e.g. Vite 404).
 */
async function parseJsonResponse(res, label) {
    const text = await res.text();
    try {
        return text ? JSON.parse(text) : null;
    } catch {
        throw new Error(
            `${label} returned non-JSON (HTTP ${res.status}). ` +
            `Check VITE_APP_FIN_URL and the endpoint path. ` +
            `Body preview: ${text.slice(0, 120)}`
        );
    }
}

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

export default function AddCreditBatchDrawer({ open, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);

    const [creditTypes, setCreditTypes] = useState([]);
    const [creditTypeDisplay, setCreditTypeDisplay] = useState("");
    const [creditTypesLoading, setCreditTypesLoading] = useState(false);
    const [creditTypesError, setCreditTypesError] = useState("");

    const [branches, setBranches] = useState([]);
    const [branchDisplay, setBranchDisplay] = useState("");
    const [branchesLoading, setBranchesLoading] = useState(false);
    const [branchesError, setBranchesError] = useState("");

    const [postingPeriods, setPostingPeriods] = useState([]);
    const [postingPeriodDisplay, setPostingPeriodDisplay] = useState("");
    const [postingPeriodsLoading, setPostingPeriodsLoading] = useState(false);
    const [postingPeriodsError, setPostingPeriodsError] = useState("");
    const [postingPeriodLocked, setPostingPeriodLocked] = useState(false);

    const CREDIT_BATCH_TYPES = [
        { label: "Payout", value: "56026" },
        { label: "CheckOff", value: "56027" },
        { label: "Cash Pickup", value: "56028" },
        { label: "Sundry Payments", value: "56029" },
    ];

    const [formData, setFormData] = useState({
        creditTypeId: "",
        branchId: "",
        type: "56027",
        postingPeriodId: "",
        reference: "",
        totalValue: 0,
        month: new Date().getMonth() + 1,
        valueDate: new Date().toISOString().split("T")[0],
    });

    useEffect(() => {
        if (!open) return;

        // Reset so re-opening the drawer always starts from a clean slate
        setCreditTypesError("");
        setBranchesError("");
        setPostingPeriodsError("");
        setPostingPeriodLocked(false);
        setPostingPeriodDisplay("");
        setFormData((prev) => ({
            ...prev,
            creditTypeId: "",
            branchId: "",
            postingPeriodId: "",
        }));

        // ── Credit Types ──
        const fetchCreditTypes = async () => {
            setCreditTypesLoading(true);
            try {
                const res = await fetch(`${FIN_BASE}/api/values/credittypes`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await parseJsonResponse(res, "Credit types");
                const list = unwrapList(json);
                setCreditTypes(list);

                const checkOff = list.find((ct) => {
                    const d = String(ct.Description || "").toLowerCase();
                    return d === "check-off" || d === "checkoff";
                });
                if (checkOff) {
                    setCreditTypeDisplay(checkOff.Description);
                    setFormData((prev) => ({
                        ...prev,
                        creditTypeId: prev.creditTypeId || checkOff.Id,
                    }));
                }
            } catch (err) {
                console.error("Fetch credit types error:", err);
                setCreditTypesError(err.message || "Failed to load credit types");
                setCreditTypes([]);
            } finally {
                setCreditTypesLoading(false);
            }
        };

        // ── Branches ──
        const fetchBranches = async () => {
            setBranchesLoading(true);
            try {
                const res = await fetch(`${FIN_BASE}/api/values/branches`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await parseJsonResponse(res, "Branches");
                const list = unwrapList(json);
                setBranches(list);

                if (list.length === 1) {
                    setBranchDisplay(list[0].Description);
                    setFormData((prev) => ({
                        ...prev,
                        branchId: prev.branchId || list[0].Id,
                    }));
                }
            } catch (err) {
                console.error("Fetch branches error:", err);
                setBranchesError(err.message || "Failed to load branches");
                setBranches([]);
            } finally {
                setBranchesLoading(false);
            }
        };

        // ── Posting Periods ──
        const fetchPostingPeriods = async () => {
            setPostingPeriodsLoading(true);
            try {
                const res = await fetch(`${FIN_BASE}/api/values/GetPostingPeriods`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await parseJsonResponse(res, "Posting periods");
                const list = unwrapList(json);
                setPostingPeriods(list);

                const active = list.find(
                    (pp) =>
                        pp.IsActive === true ||
                        pp.isActive === true ||
                        String(pp.IsActive).toLowerCase() === "true"
                );

                if (active) {
                    setPostingPeriodDisplay(active.Description || "");
                    setPostingPeriodLocked(true);
                    setFormData((prev) => ({
                        ...prev,
                        postingPeriodId: active.Id,
                    }));
                }
            } catch (err) {
                console.error("Fetch posting periods error:", err);
                setPostingPeriodsError(err.message || "Failed to load posting periods");
                setPostingPeriods([]);
            } finally {
                setPostingPeriodsLoading(false);
            }
        };

        fetchCreditTypes();
        fetchBranches();
        fetchPostingPeriods();
    }, [open]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.creditTypeId) {
            Swal.fire("Validation", "Please select a valid Credit Type from the list.", "warning");
            return;
        }
        if (!formData.branchId) {
            Swal.fire("Validation", "Please select a valid Branch from the list.", "warning");
            return;
        }
        if (!formData.postingPeriodId) {
            Swal.fire("Validation", "No active posting period available.", "warning");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${FIN_BASE}/api/values/creditbatch/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    totalValue: Number(formData.totalValue),
                    month: Number(formData.month),
                }),
            });
            const data = await parseJsonResponse(res, "Credit batch create").catch(() => ({}));
            if (!res.ok) {
                throw new Error(data?.message || data?.Message || "Failed to create credit batch");
            }

            Swal.fire("Success", "Credit Batch created successfully", "success");
            onSuccess?.();
            onClose();
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="fixed top-5 right-3 w-[700px] bg-white shadow-xl z-50 rounded-2xl p-3"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                    >
                        <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl mb-4">
                            <h2 className="font-bold text-lg text-white">Add Credit Batch</h2>
                            <Button variant="outline" size="sm" onClick={onClose}>
                                Close
                            </Button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4 p-4 grid grid-cols-2 gap-5"
                        >
                            {/* Credit Type */}
                            <div className="relative">
                                <Label>Credit Type</Label>
                                <Input
                                    list="credit-types"
                                    placeholder={
                                        creditTypesLoading
                                            ? "Loading..."
                                            : creditTypesError
                                                ? "Failed to load — see banner"
                                                : "Select or search credit type"
                                    }
                                    value={creditTypeDisplay}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setCreditTypeDisplay(value);
                                        const match = creditTypes.find(
                                            (ct) =>
                                                String(ct.Description || "").toLowerCase() ===
                                                value.toLowerCase()
                                        );
                                        handleChange("creditTypeId", match ? match.Id : "");
                                    }}
                                    required
                                />
                                <datalist id="credit-types">
                                    {creditTypes.map((ct) => (
                                        <option key={ct.Id} value={ct.Description} />
                                    ))}
                                </datalist>
                                {creditTypesError && (
                                    <p className="mt-1 text-[11px] text-red-600">
                                        {creditTypesError}
                                    </p>
                                )}
                            </div>

                            {/* Branch */}
                            <div className="relative">
                                <Label>Branch</Label>
                                <Input
                                    list="branches"
                                    placeholder={
                                        branchesLoading
                                            ? "Loading..."
                                            : branchesError
                                                ? "Failed to load — see banner"
                                                : "Select or search branch"
                                    }
                                    value={branchDisplay}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setBranchDisplay(value);
                                        const match = branches.find(
                                            (b) =>
                                                String(b.Description || "").toLowerCase() ===
                                                value.toLowerCase()
                                        );
                                        handleChange("branchId", match ? match.Id : "");
                                    }}
                                    required
                                />
                                <datalist id="branches">
                                    {branches.map((b) => (
                                        <option key={b.Id} value={b.Description} />
                                    ))}
                                </datalist>
                                {branchesError && (
                                    <p className="mt-1 text-[11px] text-red-600">
                                        {branchesError}
                                    </p>
                                )}
                            </div>

                            {/* Type */}
                            <div>
                                <Label>Type</Label>
                                <select
                                    className="w-full border rounded-md px-3 py-2 text-sm"
                                    value={formData.type}
                                    onChange={(e) => handleChange("type", e.target.value)}
                                    required
                                >
                                    <option value="">Select Type</option>
                                    {CREDIT_BATCH_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Posting Period */}
                            <div className="relative">
                                <Label>
                                    Posting Period
                                    {postingPeriodLocked && (
                                        <span className="ml-2 text-[11px] font-normal text-emerald-600">
                                            (active period — auto-selected)
                                        </span>
                                    )}
                                </Label>
                                <Input
                                    list={postingPeriodLocked ? undefined : "posting-periods"}
                                    placeholder={
                                        postingPeriodsLoading
                                            ? "Loading..."
                                            : postingPeriodsError
                                                ? "Failed to load — see banner"
                                                : postingPeriodLocked
                                                    ? postingPeriodDisplay || "No active period"
                                                    : "Select or search posting period"
                                    }
                                    value={postingPeriodDisplay}
                                    onChange={(e) => {
                                        if (postingPeriodLocked) return;
                                        const value = e.target.value;
                                        setPostingPeriodDisplay(value);
                                        const match = postingPeriods.find(
                                            (pp) =>
                                                String(pp.Description || "").toLowerCase() ===
                                                value.toLowerCase()
                                        );
                                        handleChange("postingPeriodId", match ? match.Id : "");
                                    }}
                                    readOnly={postingPeriodLocked}
                                    className={
                                        postingPeriodLocked
                                            ? "bg-emerald-50 border-emerald-300 cursor-not-allowed"
                                            : ""
                                    }
                                    required
                                />
                                {!postingPeriodLocked && (
                                    <datalist id="posting-periods">
                                        {postingPeriods.map((pp) => (
                                            <option key={pp.Id} value={pp.Description} />
                                        ))}
                                    </datalist>
                                )}
                                {postingPeriodsError && (
                                    <p className="mt-1 text-[11px] text-red-600">
                                        {postingPeriodsError}
                                    </p>
                                )}
                                {postingPeriodLocked && (
                                    <p className="mt-1 text-[11px] text-emerald-600">
                                        Only the active posting period is used for new credit batches.
                                    </p>
                                )}
                                {!postingPeriodLocked &&
                                    !postingPeriodsLoading &&
                                    !postingPeriodsError &&
                                    postingPeriods.length === 0 && (
                                        <p className="mt-1 text-[11px] text-amber-600">
                                            No active posting period found. Please open one before creating a batch.
                                        </p>
                                    )}
                            </div>

                            {/* Reference */}
                            <div>
                                <Label>Reference</Label>
                                <Input
                                    value={formData.reference}
                                    onChange={(e) => handleChange("reference", e.target.value)}
                                    required
                                />
                            </div>

                            {/* Month */}
                            <div>
                                <Label>Month</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={formData.month}
                                    onChange={(e) => handleChange("month", e.target.value)}
                                    required
                                />
                            </div>

                            {/* Value Date */}
                            <div>
                                <Label>Value Date</Label>
                                <Input
                                    type="date"
                                    value={formData.valueDate}
                                    onChange={(e) => handleChange("valueDate", e.target.value)}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 col-span-2"
                            >
                                {loading ? "Saving..." : "Save Credit Batch"}
                            </Button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}