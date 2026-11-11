import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import Swal from "sweetalert2";
import { Search, X, ChevronDown, ChevronUp } from "lucide-react";

const LEDGER_API = `${import.meta.env.VITE_APP_LOANING_URL}/api/values/GetGeneralLeadgersBalances`;

export default function AddLoanProducts({ open, onClose, refresh }) {
    const [loading, setLoading] = useState(false);
    const [ledgers, setLedgers] = useState([]);
    const [loadingLedgers, setLoadingLedgers] = useState(false);

    // Modal states for each account type
    const [chartModalOpen, setChartModalOpen] = useState(false);
    const [interestReceivedModalOpen, setInterestReceivedModalOpen] = useState(false);
    const [interestReceivableModalOpen, setInterestReceivableModalOpen] = useState(false);
    const [interestChargedModalOpen, setInterestChargedModalOpen] = useState(false);

    // Search states for each account type
    const [chartSearch, setChartSearch] = useState("");
    const [interestReceivedSearch, setInterestReceivedSearch] = useState("");
    const [interestReceivableSearch, setInterestReceivableSearch] = useState("");
    const [interestChargedSearch, setInterestChargedSearch] = useState("");

    // Selected account display values
    const [chartDisplay, setChartDisplay] = useState("");
    const [interestReceivedDisplay, setInterestReceivedDisplay] = useState("");
    const [interestReceivableDisplay, setInterestReceivableDisplay] = useState("");
    const [interestChargedDisplay, setInterestChargedDisplay] = useState("");

    useEffect(() => {
        const fetchLedgers = async () => {
            try {
                setLoadingLedgers(true);
                const res = await fetch(LEDGER_API, { headers: { "ngrok-skip-browser-warning": "true" } });
                const json = await res.json();

                if (json?.Success) {
                    // OPTIONAL: only allow POSTABLE accounts
                    const postable = json.Data.filter(
                        (l) => l.CategoryDescription === "Detail Account (Postable)"
                    );
                    setLedgers(postable);
                }
            } catch (err) {
                console.error("Failed to load ledgers", err);
            } finally {
                setLoadingLedgers(false);
            }
        };

        fetchLedgers();
    }, []);

    const enumBindings = {
        LoanRegistrationLoanProductSection: { 0: "FOSA", 1: "BOSA" },
        LoanRegistrationLoanProductCategory: { 0: "Short-Term", 1: "Long-Term" },
        LoanInterestChargeMode: { 300: "Upfront", 301: "Periodic" },
        LoanInterestRecoveryMode: { 400: "Upfront", 401: "Periodic" },
        LoanInterestCalculationMode: {
            200: "Reducing Balance",
            201: "Straight Line",
            202: "Amortization (Straight Line)",
            203: "Amortization (Diminishing Balance)",
            204: "Fixed Interest",
        },
        LoanRegistrationPaymentFrequencyPerYear: {
            1: "Annual",
            2: "Semi-Annual",
            3: "Tri-Annual",
            4: "Quarterly",
            6: "Bi-Monthly",
            12: "Monthly",
            24: "Semi-Monthly",
            26: "Bi-Weekly",
            52: "Weekly",
            365: "Daily",
        },
        LoanRegistrationPaymentDueDate: { 0: "End of Period", 1: "Beginning of Period" },
        LoanRegistrationStandingOrderTrigger: { 0: "Payout", 1: "Check-Off", 2: "Schedule", 3: "Sweep", 4: "Microloan" },
        LoanRegistrationGuarantorSecurityMode: { 0: "Income", 1: "Investments" },
        LoanRegistrationPayoutRecoveryMode: { 700: "Per Standing Order", 701: "Outstanding Percentage" },
        LoanRegistrationAggregateCheckOffRecoveryMode: { 0: "Outstanding Balance", 1: "Per Standing Order" },
        LoanRegistrationRoundingType: { 0: "None", 1: "Nearest", 2: "Up", 3: "Down" },
    };

    const [form, setForm] = useState({
        Code: "",
        Description: "",
        ChartOfAccountId: "",
        InterestReceivedChartOfAccountId: "",
        InterestReceivableChartOfAccountId: "",
        InterestChargedChartOfAccountId: "",
        LoanRegistrationLoanProductSection: "",
        LoanRegistrationLoanProductCategory: "",
        LoanRegistrationMicrocredit: false,
        LoanInterestAnnualPercentageRate: 0,
        LoanRegistrationMinimumInterestAmount: 0,
        LoanInterestChargeMode: "",
        LoanInterestRecoveryMode: "",
        LoanInterestCalculationMode: "",
        LoanRegistrationMinimumAmount: 0,
        LoanRegistrationMaximumAmount: 0,
        LoanRegistrationTermInMonths: 0,
        LoanRegistrationMinimumMembershipPeriod: 0,
        LoanRegistrationConsecutiveIncome: 0,
        LoanRegistrationInvestmentsMultiplier: 0,
        LoanRegistrationExcludeOutstandingLoansOnMaximumEntitlement: false,
        LoanRegistrationPaymentFrequencyPerYear: "",
        LoanRegistrationPaymentDueDate: "",
        LoanRegistrationGracePeriod: 0,
        LoanRegistrationStandingOrderTrigger: "",
        LoanRegistrationCreateStandingOrderOnLoanAudit: false,
        LoanRegistrationMinimumGuarantors: 0,
        LoanRegistrationMaximumGuarantees: 0,
        LoanRegistrationGuarantorSecurityMode: "",
        LoanRegistrationMaximumSelfGuaranteeEligiblePercentage: 0,
        LoanRegistrationAllowSelfGuarantee: false,
        LoanRegistrationSecurityRequired: false,
        LoanRegistrationPayoutRecoveryMode: "",
        LoanRegistrationPayoutRecoveryPercentage: 0,
        LoanRegistrationAggregateCheckOffRecoveryMode: "",
        LoanRegistrationTrackArrears: false,
        LoanRegistrationChargeArrearsFee: false,
        LoanRegistrationThrottleScheduledArrearsRecovery: false,
        LoanRegistrationRoundingType: "",
        Priority: 0,
        LoanRegistrationBypassAudit: false,
        LoanRegistrationEnforceSystemAppraisalRecommendation: false,
        IsLocked: false,
    });

    const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    // Filter accounts based on search term
    const filterAccounts = (accounts, searchTerm) => {
        if (!searchTerm) return accounts;
        const term = searchTerm.toLowerCase();
        return accounts.filter(acc =>
            acc.Code?.toString().toLowerCase().includes(term) ||
            acc.Name?.toLowerCase().includes(term) ||
            acc.AccountCode?.toString().toLowerCase().includes(term) ||
            acc.AccountName?.toLowerCase().includes(term)
        );
    };

    // Get filtered accounts for each modal
    const getFilteredChartAccounts = () => filterAccounts(ledgers, chartSearch);
    const getFilteredInterestReceivedAccounts = () => filterAccounts(ledgers, interestReceivedSearch);
    const getFilteredInterestReceivableAccounts = () => filterAccounts(ledgers, interestReceivableSearch);
    const getFilteredInterestChargedAccounts = () => filterAccounts(ledgers, interestChargedSearch);

    // Handle account selection from modal
    const selectChartAccount = (account) => {
        update("ChartOfAccountId", account.Id);
        setChartDisplay(`${account.Code || account.AccountCode} - ${account.Name || account.AccountName}`);
        setChartModalOpen(false);
        setChartSearch("");
    };

    const selectInterestReceivedAccount = (account) => {
        update("InterestReceivedChartOfAccountId", account.Id);
        setInterestReceivedDisplay(`${account.Code || account.AccountCode} - ${account.Name || account.AccountName}`);
        setInterestReceivedModalOpen(false);
        setInterestReceivedSearch("");
    };

    const selectInterestReceivableAccount = (account) => {
        update("InterestReceivableChartOfAccountId", account.Id);
        setInterestReceivableDisplay(`${account.Code || account.AccountCode} - ${account.Name || account.AccountName}`);
        setInterestReceivableModalOpen(false);
        setInterestReceivableSearch("");
    };

    const selectInterestChargedAccount = (account) => {
        update("InterestChargedChartOfAccountId", account.Id);
        setInterestChargedDisplay(`${account.Code || account.AccountCode} - ${account.Name || account.AccountName}`);
        setInterestChargedModalOpen(false);
        setInterestChargedSearch("");
    };

    // Clear selection
    const clearChartSelection = () => {
        update("ChartOfAccountId", "");
        setChartDisplay("");
        setChartSearch("");
    };

    const clearInterestReceivedSelection = () => {
        update("InterestReceivedChartOfAccountId", "");
        setInterestReceivedDisplay("");
        setInterestReceivedSearch("");
    };

    const clearInterestReceivableSelection = () => {
        update("InterestReceivableChartOfAccountId", "");
        setInterestReceivableDisplay("");
        setInterestReceivableSearch("");
    };

    const clearInterestChargedSelection = () => {
        update("InterestChargedChartOfAccountId", "");
        setInterestChargedDisplay("");
        setInterestChargedSearch("");
    };

    // Clear search when component closes
    useEffect(() => {
        if (!open) {
            setChartSearch("");
            setInterestReceivedSearch("");
            setInterestReceivableSearch("");
            setInterestChargedSearch("");
        }
    }, [open]);

    const handleSubmit = async () => {
        // Validate required fields
        if (!form.ChartOfAccountId) {
            Swal.fire("Error", "Please select a Main Chart of Account", "error");
            return;
        }
        if (!form.InterestReceivedChartOfAccountId) {
            Swal.fire("Error", "Please select an Interest Received Account", "error");
            return;
        }
        if (!form.InterestReceivableChartOfAccountId) {
            Swal.fire("Error", "Please select an Interest Receivable Account", "error");
            return;
        }
        if (!form.InterestChargedChartOfAccountId) {
            Swal.fire("Error", "Please select an Interest Charged Account", "error");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_LOANING_URL}/api/Loansetups/AddLoanproducts`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!data.Success) throw new Error(data.Message);
            Swal.fire("Success", "Loan product added successfully", "success");
            refresh();
            onClose();
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const renderSelect = (label, field, options) => (
        <div>
            <Label>{label}</Label>
            <Select value={form[field]} onValueChange={val => update(field, val)}>
                <SelectTrigger>
                    <SelectValue placeholder={`Select ${label}`} />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(options).map(([val, lbl]) => (
                        <SelectItem key={val} value={val}>{lbl}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

    const renderCheckbox = (label, field) => (
        <label className="flex items-center gap-2 cursor-pointer">
            <input 
                type="checkbox" 
                checked={form[field]} 
                onChange={e => update(field, e.target.checked)} 
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">{label}</span>
        </label>
    );

    const renderInput = (label, field, type = "text", step) => (
        <div>
            <Label>{label}</Label>
            <Input
                type={type}
                step={step}
                value={form[field]}
                onChange={e => update(field, type === "number" ? Number(e.target.value) : e.target.value)}
                className="mt-1"
            />
        </div>
    );

    // Account Selection Modal Component
    const AccountSelectionModal = ({
        isOpen,
        onClose,
        title,
        accounts,
        searchValue,
        setSearchValue,
        onSelect,
        selectedId
    }) => {
        const filtered = filterAccounts(accounts, searchValue);

        return (
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                        />

                        {/* Modal */}
                        <motion.div
                            className="fixed inset-0 flex items-center justify-center z-[101] p-4"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                                {/* Header */}
                                <div className="p-6 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-t-2xl">
                                    <h3 className="font-bold text-xl text-white">
                                        {title}
                                    </h3>
                                    <button
                                        onClick={onClose}
                                        className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="p-4 border-b border-gray-200">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                        <input
                                            type="text"
                                            placeholder="Search by account code or name..."
                                            value={searchValue}
                                            onChange={(e) => setSearchValue(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                        Showing {filtered.length} of {accounts.length} accounts
                                    </div>
                                </div>

                                {/* Account List */}
                                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                                    {loadingLedgers ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
                                            <p className="text-lg font-medium">Loading accounts...</p>
                                        </div>
                                    ) : filtered.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <Search className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                            <p className="text-lg font-medium">No accounts found</p>
                                            <p className="text-sm">Try adjusting your search terms</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-2">
                                            {filtered.map((acc) => (
                                                <div
                                                    key={acc.Id}
                                                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                                                        selectedId === acc.Id
                                                            ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200'
                                                            : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                                                    }`}
                                                    onClick={() => onSelect(acc)}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <div className="font-medium text-gray-900">
                                                                {acc.Code || acc.AccountCode} - {acc.Name || acc.AccountName}
                                                            </div>
                                                            <div className="flex gap-3 mt-1">
                                                                <span className="text-xs text-gray-500">
                                                                    Type: {acc.CategoryDescription || acc.AccountType || 'N/A'}
                                                                </span>
                                                                {acc.AccountType && (
                                                                    <span className="text-xs text-gray-500">
                                                                        Code: {acc.AccountCode}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {selectedId === acc.Id && (
                                                            <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                                                Selected
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl flex justify-end">
                                    <Button
                                        variant="outline"
                                        onClick={onClose}
                                        className="px-6"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        );
    };

    // Account Selector Component
    const AccountSelector = ({
        label,
        displayValue,
        onSelectClick,
        onClear,
        required = false,
        placeholder = "No account selected"
    }) => {
        return (
            <div>
                <Label className="text-sm font-medium text-gray-700">
                    {label} {required && <span className="text-red-500">*</span>}
                </Label>
                <div className="flex items-center gap-2 mt-1">
                    <button
                        type="button"
                        onClick={onSelectClick}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md hover:border-indigo-500 transition-colors bg-white text-left flex items-center justify-between"
                        disabled={loadingLedgers}
                    >
                        <span className={displayValue ? 'text-gray-900' : 'text-gray-400'}>
                            {loadingLedgers ? 'Loading accounts...' : (displayValue || placeholder)}
                        </span>
                        <Search className="h-4 w-4 text-gray-400" />
                    </button>
                    {displayValue && (
                        <button
                            type="button"
                            onClick={onClear}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded-md"
                            title="Clear selection"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            {/* MAIN MODAL - Add Loan Product */}
            <AnimatePresence>
                {open && (
                    <>
                        {/* BACKDROP */}
                        <motion.div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                        />

                        {/* MODAL */}
                        <motion.div
                            className="fixed inset-0 flex items-center justify-center z-50 p-4"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                                {/* HEADER */}
                                <div className="p-6 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-t-2xl">
                                    <h2 className="font-bold text-xl text-white flex items-center gap-2">
                                        <span className="text-2xl">🏦</span>
                                        Add Loan Product
                                    </h2>
                                    <button
                                        onClick={onClose}
                                        className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                {/* CONTENT */}
                                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                                    {/* PRODUCT IDENTITY */}
                                    <section className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                                            Product Identity
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-gray-200">
                                            {renderInput("Product Code", "Code", "number")}
                                            {renderInput("Product Name", "Description")}
                                            
                                            <div>
                                                <Label>Product Section</Label>
                                                <Select
                                                    value={String(form.LoanRegistrationLoanProductSection)}
                                                    onValueChange={(value) =>
                                                        update("LoanRegistrationLoanProductSection", Number(value))
                                                    }
                                                >
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Select Product Section" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="0">FOSA</SelectItem>
                                                        <SelectItem value="1">BOSA</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label>Product Category</Label>
                                                <Select
                                                    value={String(form.LoanRegistrationLoanProductCategory)}
                                                    onValueChange={(value) =>
                                                        update("LoanRegistrationLoanProductCategory", Number(value))
                                                    }
                                                >
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Select Product Category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="0">Short-Term</SelectItem>
                                                        <SelectItem value="1">Long-Term</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="col-span-full">
                                                {renderCheckbox("Microcredit Product", "LoanRegistrationMicrocredit")}
                                            </div>
                                        </div>
                                    </section>

                                    {/* INTEREST & PRICING */}
                                    <section className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                                            Interest & Pricing
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-gray-200">
                                            {renderInput("Annual Interest Rate (%)", "LoanInterestAnnualPercentageRate", "number", "0.01")}
                                            {renderInput("Minimum Interest Amount", "LoanRegistrationMinimumInterestAmount", "number", "0.01")}
                                            
                                            <div>
                                                <Label>Interest Charge Mode</Label>
                                                <Select
                                                    value={String(form.LoanInterestChargeMode)}
                                                    onValueChange={(value) =>
                                                        update("LoanInterestChargeMode", Number(value))
                                                    }
                                                >
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Select Interest Charge Mode" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="300">Upfront</SelectItem>
                                                        <SelectItem value="301">Periodic</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label>Interest Recovery Mode</Label>
                                                <Select
                                                    value={String(form.LoanInterestRecoveryMode)}
                                                    onValueChange={(value) =>
                                                        update("LoanInterestRecoveryMode", Number(value))
                                                    }
                                                >
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Select Interest Recovery Mode" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="400">Upfront</SelectItem>
                                                        <SelectItem value="401">Periodic</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="md:col-span-2">
                                                <Label>Interest Calculation Mode</Label>
                                                <Select
                                                    value={String(form.LoanInterestCalculationMode)}
                                                    onValueChange={(value) =>
                                                        update("LoanInterestCalculationMode", Number(value))
                                                    }
                                                >
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Select Interest Calculation Mode" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="200">Reducing Balance</SelectItem>
                                                        <SelectItem value="201">Straight Line</SelectItem>
                                                        <SelectItem value="202">Amortization (Straight Line)</SelectItem>
                                                        <SelectItem value="203">Amortization (Diminishing Balance)</SelectItem>
                                                        <SelectItem value="204">Fixed Interest</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </section>

                                    {/* LIMITS */}
                                    <section className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                                            Loan Limits
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-gray-200">
                                            {renderInput("Minimum Loan Amount", "LoanRegistrationMinimumAmount", "number", "0.01")}
                                            {renderInput("Maximum Loan Amount", "LoanRegistrationMaximumAmount", "number", "0.01")}
                                            {renderInput("Loan Term (Months)", "LoanRegistrationTermInMonths", "number")}
                                            {renderInput("Min Membership (Months)", "LoanRegistrationMinimumMembershipPeriod", "number")}
                                            {renderInput("Consecutive Income Periods", "LoanRegistrationConsecutiveIncome", "number")}
                                            {renderInput("Investment Multiplier", "LoanRegistrationInvestmentsMultiplier", "number", "0.01")}
                                            <div className="col-span-full">
                                                {renderCheckbox("Exclude Outstanding Loans from Entitlement", "LoanRegistrationExcludeOutstandingLoansOnMaximumEntitlement")}
                                            </div>
                                        </div>
                                    </section>

                                    {/* REPAYMENT */}
                                    <section className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                                            Repayment
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-gray-200">
                                            <div>
                                                <Label>Payment Frequency</Label>
                                                <Select
                                                    value={String(form.LoanRegistrationPaymentFrequencyPerYear)}
                                                    onValueChange={(value) =>
                                                        update("LoanRegistrationPaymentFrequencyPerYear", Number(value))
                                                    }
                                                >
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Select Payment Frequency" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="1">Annual</SelectItem>
                                                        <SelectItem value="2">Semi-Annual</SelectItem>
                                                        <SelectItem value="3">Tri-Annual</SelectItem>
                                                        <SelectItem value="4">Quarterly</SelectItem>
                                                        <SelectItem value="6">Bi-Monthly</SelectItem>
                                                        <SelectItem value="12">Monthly</SelectItem>
                                                        <SelectItem value="24">Semi-Monthly</SelectItem>
                                                        <SelectItem value="26">Bi-Weekly</SelectItem>
                                                        <SelectItem value="52">Weekly</SelectItem>
                                                        <SelectItem value="365">Daily</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label>Payment Due Date</Label>
                                                <Select
                                                    value={String(form.LoanRegistrationPaymentDueDate)}
                                                    onValueChange={(value) =>
                                                        update("LoanRegistrationPaymentDueDate", Number(value))
                                                    }
                                                >
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Select Due Date Rule" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="0">End of Period</SelectItem>
                                                        <SelectItem value="1">Beginning of Period</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {renderInput("Grace Period (Days)", "LoanRegistrationGracePeriod", "number")}

                                            <div>
                                                <Label>Standing Order Trigger</Label>
                                                <Select
                                                    value={String(form.LoanRegistrationStandingOrderTrigger)}
                                                    onValueChange={(value) =>
                                                        update("LoanRegistrationStandingOrderTrigger", Number(value))
                                                    }
                                                >
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Select Standing Order Trigger" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="0">Payout</SelectItem>
                                                        <SelectItem value="1">Check-Off</SelectItem>
                                                        <SelectItem value="2">Schedule</SelectItem>
                                                        <SelectItem value="3">Sweep</SelectItem>
                                                        <SelectItem value="4">Microloan</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="col-span-full">
                                                {renderCheckbox("Create Standing Order on Loan Audit", "LoanRegistrationCreateStandingOrderOnLoanAudit")}
                                            </div>
                                        </div>
                                    </section>

                                    {/* CHART OF ACCOUNTS */}
                                    <section className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                                            Chart of Accounts
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-gray-200">
                                            <AccountSelector
                                                label="Main Chart of Account"
                                                required={true}
                                                displayValue={chartDisplay}
                                                onSelectClick={() => setChartModalOpen(true)}
                                                onClear={clearChartSelection}
                                                placeholder="Click to select account..."
                                            />

                                            <AccountSelector
                                                label="Interest Received Account"
                                                required={true}
                                                displayValue={interestReceivedDisplay}
                                                onSelectClick={() => setInterestReceivedModalOpen(true)}
                                                onClear={clearInterestReceivedSelection}
                                                placeholder="Click to select account..."
                                            />

                                            <AccountSelector
                                                label="Interest Receivable Account"
                                                required={true}
                                                displayValue={interestReceivableDisplay}
                                                onSelectClick={() => setInterestReceivableModalOpen(true)}
                                                onClear={clearInterestReceivableSelection}
                                                placeholder="Click to select account..."
                                            />

                                            <AccountSelector
                                                label="Interest Charged Account"
                                                required={true}
                                                displayValue={interestChargedDisplay}
                                                onSelectClick={() => setInterestChargedModalOpen(true)}
                                                onClear={clearInterestChargedSelection}
                                                placeholder="Click to select account..."
                                            />
                                        </div>
                                    </section>

                                    {/* SECURITY */}
                                    <section className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                                            Security
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-gray-200">
                                            {renderInput("Minimum Guarantors", "LoanRegistrationMinimumGuarantors", "number")}
                                            {renderInput("Maximum Guarantees", "LoanRegistrationMaximumGuarantees", "number")}
                                            
                                            <div>
                                                <Label>Guarantor Security Mode</Label>
                                                <Select
                                                    value={String(form.LoanRegistrationGuarantorSecurityMode)}
                                                    onValueChange={(value) =>
                                                        update("LoanRegistrationGuarantorSecurityMode", Number(value))
                                                    }
                                                >
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Select Guarantor Security Mode" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="0">Income</SelectItem>
                                                        <SelectItem value="1">Investments</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {renderInput("Max Self Guarantee (%)", "LoanRegistrationMaximumSelfGuaranteeEligiblePercentage", "number", "0.01")}

                                            <div className="col-span-full flex gap-6 flex-wrap">
                                                {renderCheckbox("Allow Self-Guarantee", "LoanRegistrationAllowSelfGuarantee")}
                                                {renderCheckbox("Security Required", "LoanRegistrationSecurityRequired")}
                                            </div>
                                        </div>
                                    </section>

                                    {/* RECOVERY */}
                                    <section className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                                            Recovery
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-gray-200">
                                            {renderSelect("Payout Recovery Mode", "LoanRegistrationPayoutRecoveryMode", enumBindings.LoanRegistrationPayoutRecoveryMode)}
                                            {renderInput("Payout Recovery %", "LoanRegistrationPayoutRecoveryPercentage", "number", "0.01")}
                                            {renderSelect("Aggregate Check-Off Mode", "LoanRegistrationAggregateCheckOffRecoveryMode", enumBindings.LoanRegistrationAggregateCheckOffRecoveryMode)}
                                            
                                            <div className="col-span-full flex gap-6 flex-wrap">
                                                {renderCheckbox("Track Arrears", "LoanRegistrationTrackArrears")}
                                                {renderCheckbox("Charge Arrears Fee", "LoanRegistrationChargeArrearsFee")}
                                                {renderCheckbox("Throttle Arrears Recovery", "LoanRegistrationThrottleScheduledArrearsRecovery")}
                                            </div>
                                        </div>
                                    </section>

                                    {/* GOVERNANCE */}
                                    <section className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                                            Governance
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-gray-200">
                                            {renderSelect("Rounding Type", "LoanRegistrationRoundingType", enumBindings.LoanRegistrationRoundingType)}
                                            
                                            <div>
                                                <Label>Recovery Priority</Label>
                                                <Select
                                                    value={String(form.Priority)}
                                                    onValueChange={(value) => update("Priority", Number(value))}
                                                >
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Select Recovery Priority" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="0">High</SelectItem>
                                                        <SelectItem value="1">Medium</SelectItem>
                                                        <SelectItem value="2">Low</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="col-span-full flex gap-6 flex-wrap">
                                                {renderCheckbox("Bypass Audit", "LoanRegistrationBypassAudit")}
                                                {renderCheckbox("Enforce System Appraisal", "LoanRegistrationEnforceSystemAppraisalRecommendation")}
                                                {renderCheckbox("Lock Product", "IsLocked")}
                                            </div>
                                        </div>
                                    </section>

                                    {/* SUBMIT */}
                                    <div className="flex justify-end">
                                        <Button onClick={handleSubmit} disabled={loading} className="px-8">
                                            {loading ? "Submitting..." : "Save Loan Product"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ACCOUNT SELECTION MODALS */}
            <AccountSelectionModal
                isOpen={chartModalOpen}
                onClose={() => setChartModalOpen(false)}
                title="Select Main Chart of Account"
                accounts={ledgers}
                searchValue={chartSearch}
                setSearchValue={setChartSearch}
                onSelect={selectChartAccount}
                selectedId={form.ChartOfAccountId}
            />

            <AccountSelectionModal
                isOpen={interestReceivedModalOpen}
                onClose={() => setInterestReceivedModalOpen(false)}
                title="Select Interest Received Account"
                accounts={ledgers}
                searchValue={interestReceivedSearch}
                setSearchValue={setInterestReceivedSearch}
                onSelect={selectInterestReceivedAccount}
                selectedId={form.InterestReceivedChartOfAccountId}
            />

            <AccountSelectionModal
                isOpen={interestReceivableModalOpen}
                onClose={() => setInterestReceivableModalOpen(false)}
                title="Select Interest Receivable Account"
                accounts={ledgers}
                searchValue={interestReceivableSearch}
                setSearchValue={setInterestReceivableSearch}
                onSelect={selectInterestReceivableAccount}
                selectedId={form.InterestReceivableChartOfAccountId}
            />

            <AccountSelectionModal
                isOpen={interestChargedModalOpen}
                onClose={() => setInterestChargedModalOpen(false)}
                title="Select Interest Charged Account"
                accounts={ledgers}
                searchValue={interestChargedSearch}
                setSearchValue={setInterestChargedSearch}
                onSelect={selectInterestChargedAccount}
                selectedId={form.InterestChargedChartOfAccountId}
            />
        </>
    );
}