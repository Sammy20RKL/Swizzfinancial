import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { Search, X, ChevronDown, ChevronUp, Eye } from "lucide-react";

export default function AddProductModal({ open, onClose, refresh }) {
    const [loading, setLoading] = useState(false);
    const [chartofAccount, setChartofAccount] = useState([]);
    
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

    const [form, setForm] = useState({
        code: "",
        description: "",
        priority: 1,
        chartOfAccountId: "",
        interestReceivedChartOfAccountId: "",
        interestReceivableChartOfAccountId: "",
        interestChargedChartOfAccountId: "",

        maximumAllowedDeposit: 0,
        maximumAllowedWithdrawal: 0,
        minimumBalance: 0,
        operatingBalance: 0,

        withdrawalNoticeAmount: 0,
        withdrawalNoticePeriod: 0,
        withdrawalInterval: 0,
        annualPercentageYield: 0,

        isLocked: false,
        isDefault: false,
        isMandatory: false,
        automateLedgerFeeCalculation: false,
        throttleOverTheCounterWithdrawals: false,

        createdDate: new Date().toISOString(),
        chargeBenefactor: 1,
        chargeType: 1,
    });

    const update = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    // Filter accounts based on search term
    const filterAccounts = (accounts, searchTerm) => {
        if (!searchTerm) return accounts;
        const term = searchTerm.toLowerCase();
        return accounts.filter(acc => 
            acc.AccountCode?.toString().toLowerCase().includes(term) ||
            acc.AccountName?.toLowerCase().includes(term)
        );
    };

    // Get filtered accounts for each modal
    const getFilteredChartAccounts = () => filterAccounts(chartofAccount, chartSearch);
    const getFilteredInterestReceivedAccounts = () => filterAccounts(chartofAccount, interestReceivedSearch);
    const getFilteredInterestReceivableAccounts = () => filterAccounts(chartofAccount, interestReceivableSearch);
    const getFilteredInterestChargedAccounts = () => filterAccounts(chartofAccount, interestChargedSearch);

    // Handle account selection from modal
    const selectChartAccount = (account) => {
        update("chartOfAccountId", account.Id);
        setChartDisplay(`${account.AccountCode} - ${account.AccountName}`);
        setChartModalOpen(false);
        setChartSearch("");
    };

    const selectInterestReceivedAccount = (account) => {
        update("interestReceivedChartOfAccountId", account.Id);
        setInterestReceivedDisplay(`${account.AccountCode} - ${account.AccountName}`);
        setInterestReceivedModalOpen(false);
        setInterestReceivedSearch("");
    };

    const selectInterestReceivableAccount = (account) => {
        update("interestReceivableChartOfAccountId", account.Id);
        setInterestReceivableDisplay(`${account.AccountCode} - ${account.AccountName}`);
        setInterestReceivableModalOpen(false);
        setInterestReceivableSearch("");
    };

    const selectInterestChargedAccount = (account) => {
        update("interestChargedChartOfAccountId", account.Id);
        setInterestChargedDisplay(`${account.AccountCode} - ${account.AccountName}`);
        setInterestChargedModalOpen(false);
        setInterestChargedSearch("");
    };

    // Clear selection
    const clearChartSelection = () => {
        update("chartOfAccountId", "");
        setChartDisplay("");
        setChartSearch("");
    };

    const clearInterestReceivedSelection = () => {
        update("interestReceivedChartOfAccountId", "");
        setInterestReceivedDisplay("");
        setInterestReceivedSearch("");
    };

    const clearInterestReceivableSelection = () => {
        update("interestReceivableChartOfAccountId", "");
        setInterestReceivableDisplay("");
        setInterestReceivableSearch("");
    };

    const clearInterestChargedSelection = () => {
        update("interestChargedChartOfAccountId", "");
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

    /* FETCH CHART OF ACCOUNTS */
    useEffect(() => {
        if (!open) return;

        const fetchChartOfAccounts = async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/chartofaccounts`,
                    { headers: { "ngrok-skip-browser-warning": "true" } }
                );
                const json = await res.json();
                if (json.success) {
                    setChartofAccount(json.data);
                }
            } catch (err) {
                console.error("Failed to fetch chart of accounts", err);
            }
        };

        fetchChartOfAccounts();
    }, [open]);

    /* SUBMIT */
    const handleSubmit = async () => {
        // Validate required fields
        if (!form.chartOfAccountId) {
            Swal.fire("Error", "Please select a Main Chart of Account", "error");
            return;
        }
        if (!form.interestReceivedChartOfAccountId) {
            Swal.fire("Error", "Please select an Interest Received Account", "error");
            return;
        }
        if (!form.interestReceivableChartOfAccountId) {
            Swal.fire("Error", "Please select an Interest Receivable Account", "error");
            return;
        }
        if (!form.interestChargedChartOfAccountId) {
            Swal.fire("Error", "Please select an Interest Charged Account", "error");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/savings-products`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true",
                    },
                    body: JSON.stringify(form),
                }
            );

            const data = await res.json();
            console.log(data);
            if (!res.ok) throw new Error(data.message || "Failed to add product");

            Swal.fire("Success", "Savings product added successfully", "success");
            refresh();
            onClose();
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // Get account type label
    const getAccountTypeLabel = (type) => {
        const types = {
            1000: "Asset",
            2000: "Liability",
            3000: "Equity",
            4000: "Income",
            5000: "Expense"
        };
        return types[type] || "Unknown";
    };

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
                                    {filtered.length === 0 ? (
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
                                                                {acc.AccountCode} - {acc.AccountName}
                                                            </div>
                                                            <div className="flex gap-3 mt-1">
                                                                <span className="text-xs text-gray-500">
                                                                    Type: {getAccountTypeLabel(acc.AccountType)}
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
                    >
                        <span className={displayValue ? 'text-gray-900' : 'text-gray-400'}>
                            {displayValue || placeholder}
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
            {/* MAIN MODAL - Add Product */}
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
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                                {/* HEADER */}
                                <div className="p-6 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-t-2xl">
                                    <h2 className="font-bold text-xl text-white flex items-center gap-2">
                                        <span className="text-2xl">💰</span>
                                        Add Savings Product
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
                                    {/* BASIC INFORMATION */}
                                    <section className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                                            Basic Information
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4 bg-white p-4 rounded-lg border border-gray-200">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-700">Code</Label>
                                                <Input 
                                                    value={form.code} 
                                                    onChange={(e) => update("code", e.target.value)} 
                                                    className="bg-white mt-1"
                                                    placeholder="Enter product code"
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-sm font-medium text-gray-700">Description</Label>
                                                <Input 
                                                    value={form.description} 
                                                    onChange={(e) => update("description", e.target.value)} 
                                                    className="bg-white mt-1"
                                                    placeholder="Enter product description"
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-sm font-medium text-gray-700">Annual Percentage Yield</Label>
                                                <Input 
                                                    type="number" 
                                                    value={form.annualPercentageYield} 
                                                    onChange={(e) => update("annualPercentageYield", Number(e.target.value))} 
                                                    className="bg-white mt-1"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    {/* CHART OF ACCOUNTS */}
                                    <section className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                                            Chart of Accounts
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4 bg-white p-4 rounded-lg border border-gray-200">
                                            {/* Main Chart of Account */}
                                            <AccountSelector
                                                label="Main Chart of Account"
                                                required={true}
                                                displayValue={chartDisplay}
                                                onSelectClick={() => setChartModalOpen(true)}
                                                onClear={clearChartSelection}
                                                placeholder="Click to select account..."
                                            />

                                            {/* Interest Received Account */}
                                            <AccountSelector
                                                label="Interest Received Account"
                                                required={true}
                                                displayValue={interestReceivedDisplay}
                                                onSelectClick={() => setInterestReceivedModalOpen(true)}
                                                onClear={clearInterestReceivedSelection}
                                                placeholder="Click to select account..."
                                            />

                                            {/* Interest Receivable Account */}
                                            <AccountSelector
                                                label="Interest Receivable Account"
                                                required={true}
                                                displayValue={interestReceivableDisplay}
                                                onSelectClick={() => setInterestReceivableModalOpen(true)}
                                                onClear={clearInterestReceivableSelection}
                                                placeholder="Click to select account..."
                                            />

                                            {/* Interest Charged Account */}
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

                                    {/* FLAGS */}
                                    <section className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                                            Settings
                                        </h3>
                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={form.isLocked} 
                                                        onChange={(e) => update("isLocked", e.target.checked)} 
                                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-gray-700">Is Locked</span>
                                                </label>

                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={form.isDefault} 
                                                        onChange={(e) => update("isDefault", e.target.checked)} 
                                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-gray-700">Is Default</span>
                                                </label>

                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={form.isMandatory} 
                                                        onChange={(e) => update("isMandatory", e.target.checked)} 
                                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-gray-700">Is Mandatory</span>
                                                </label>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* FOOTER */}
                                <div className="p-6 bg-white border-t border-gray-200 rounded-b-2xl flex justify-end gap-3">
                                    <Button 
                                        variant="outline" 
                                        onClick={onClose}
                                        className="px-6"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        onClick={handleSubmit} 
                                        disabled={loading}
                                        className="px-6 bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="inline-block animate-spin mr-2">⟳</span>
                                                Submitting...
                                            </>
                                        ) : (
                                            'Save Product'
                                        )}
                                    </Button>
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
                accounts={chartofAccount}
                searchValue={chartSearch}
                setSearchValue={setChartSearch}
                onSelect={selectChartAccount}
                selectedId={form.chartOfAccountId}
            />

            <AccountSelectionModal
                isOpen={interestReceivedModalOpen}
                onClose={() => setInterestReceivedModalOpen(false)}
                title="Select Interest Received Account"
                accounts={chartofAccount}
                searchValue={interestReceivedSearch}
                setSearchValue={setInterestReceivedSearch}
                onSelect={selectInterestReceivedAccount}
                selectedId={form.interestReceivedChartOfAccountId}
            />

            <AccountSelectionModal
                isOpen={interestReceivableModalOpen}
                onClose={() => setInterestReceivableModalOpen(false)}
                title="Select Interest Receivable Account"
                accounts={chartofAccount}
                searchValue={interestReceivableSearch}
                setSearchValue={setInterestReceivableSearch}
                onSelect={selectInterestReceivableAccount}
                selectedId={form.interestReceivableChartOfAccountId}
            />

            <AccountSelectionModal
                isOpen={interestChargedModalOpen}
                onClose={() => setInterestChargedModalOpen(false)}
                title="Select Interest Charged Account"
                accounts={chartofAccount}
                searchValue={interestChargedSearch}
                setSearchValue={setInterestChargedSearch}
                onSelect={selectInterestChargedAccount}
                selectedId={form.interestChargedChartOfAccountId}
            />
        </>
    );
}