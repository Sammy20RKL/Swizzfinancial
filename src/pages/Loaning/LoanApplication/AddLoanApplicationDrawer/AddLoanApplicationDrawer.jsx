import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Swal from "sweetalert2";
import CustomerSelectModal from "./CustomerSelectModal";
import LoanProductSelectModal from "./LoanProductSelectModal";
import GuarantorSelectModal from "./GuarantorSelectModal";
import ParentLoanSelectModal from "./ParentLoanSelectModal";
import { useLoanApplication } from "./LoanApplicationContext";

export default function AddLoanApplicationDrawer({ open, onClose }) {
    const {
        form, setForm,
        guarantors, setGuarantors,
        selectedAccounts, setSelectedAccounts,
        boosted, setBoosted,
        selectedParentLoan, setSelectedParentLoan,
        maxTermMonths, setMaxTermMonths,
        hasDraft,
        drafts, activeDraftId, activeDraft,
        saveNewDraft, loadDraft, deleteDraft, newForm,
    } = useLoanApplication();

    const [loading, setLoading] = useState(false);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [searchValue, setSearchValue] = useState("");
    const [loanProducts, setLoanProducts] = useState([]);
    const [loanProductSearch, setLoanProductSearch] = useState("");
    const [loanSectors, setLoanSectors] = useState([]);
    const [loanSubSectors, setLoanSubSectors] = useState([]);
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [loanProductModalOpen, setLoanProductModalOpen] = useState(false);
    const [guarantorModalIndex, setGuarantorModalIndex] = useState(null);
    const [parentLoanModalOpen, setParentLoanModalOpen] = useState(false);
    const [draftsOpen, setDraftsOpen] = useState(false);
    const [hasOffset, setHasOffset] = useState(false);
    const [excessConfirmed, setExcessConfirmed] = useState(false);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_APP_LOANING_URL}/api/Loansetups/GetLoanproducts`)
            .then(res => res.json())
            .then(data => {
                if (data.Success) {
                    setLoanProducts(data.Data || []);
                }
            })
            .catch(() => {
                Swal.fire("Error", "Failed to load loan products", "error");
            });
    }, []);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_APP_LOANING_URL}/api/Loansetups/GetAllloanSector`)
            .then(res => res.json())
            .then(data => setLoanSectors(data || []))
            .catch(() => {
                Swal.fire("Error", "Failed to load loan sectors", "error");
            });
    }, []);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_APP_LOANING_URL}/api/Loansetups/GetAllLoanSubSector`)
            .then(res => res.json())
            .then(data => setLoanSubSectors(data || []))
            .catch(() => {
                Swal.fire("Error", "Failed to load loan sub sectors", "error");
            });
    }, []);

    const filteredSubSectors = loanSubSectors.filter(
        s =>
            s.IsActive &&
            form.SectorCode &&
            s.SubSectorCode.startsWith(form.SectorCode)
    );

    /* ================= FETCH CUSTOMERS WITH SEARCH ================= */
        const fetchCustomers = async (search = "") => {
            setIsLoadingCustomers(true);
            try {
                const url = `${import.meta.env.VITE_APP_LOANING_URL}/api/values/GetMembersWithDetails?search=${encodeURIComponent(search)}&pageIndex=0&pageSize=1000`;
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.Success) {
                    const membersList = data.Data?.members || [];
                    console.log(`Fetched ${membersList.length} members${search ? ` for search: "${search}"` : ''}`);
                    setCustomers(membersList);
                } else {
                    setCustomers([]);
                }
            } catch (error) {
                console.error("Error fetching members:", error);
                Swal.fire("Error", "Failed to load members", "error");
                setCustomers([]);
            } finally {
                setIsLoadingCustomers(false);
            }
        };

        // Initial fetch when drawer opens
        useEffect(() => {
            if (open) {
                fetchCustomers();
            }
        }, [open]);

        // Handle search from modal
        const handleCustomerSearch = async (searchTerm) => {
            if (searchTerm.trim().length > 0) {
                await fetchCustomers(searchTerm);
            } else {
                await fetchCustomers();
            }
        };

    const update = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    // When a draft with a parent loan is loaded, show the offset section automatically
    useEffect(() => {
        if (selectedParentLoan) setHasOffset(true);
    }, [selectedParentLoan]);

    const handleSafeClose = () => {
        if (hasDraft && !activeDraftId) {
            Swal.fire({
                title: "Unsaved changes",
                text: "Save as a draft before closing?",
                icon: "question",
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonColor: "#4f46e5",
                denyButtonColor: "#6b7280",
                confirmButtonText: "Save Draft",
                denyButtonText: "Discard & Close",
                cancelButtonText: "Stay",
            }).then(r => {
                if (r.isConfirmed) { saveNewDraft(); onClose(); }
                else if (r.isDenied) { newForm(); onClose(); }
            });
        } else {
            onClose();
        }
    };

    const handleSaveDraft = () => {
        if (activeDraftId) {
            Swal.fire({ icon: "success", title: "Draft updated", timer: 1200, showConfirmButton: false });
        } else {
            const label = form.CustomerFullName
                ? `${form.CustomerFullName}${form.LoanProductDescription ? " — " + form.LoanProductDescription : ""}`
                : `Draft ${drafts.length + 1}`;
            saveNewDraft(label);
            Swal.fire({ icon: "success", title: "Draft saved", timer: 1200, showConfirmButton: false });
        }
    };

    /* ================= CUSTOMER SELECT ================= */
    const totalAvailableBalance = selectedAccounts
        .filter(a => a.CustomerAccountType_ProductCode === 1)
        .reduce((sum, a) => sum + (Number(a.AccountBalance) || 0), 0);

    // FIXED: Use correct field names from the flat API structure
    const memberDeposits = useMemo(() => {
        return selectedAccounts
            .filter(acc =>
                acc.productDescription === "DEPOSITS" && 
                acc.accountType === "Savings" && 
                (Number(acc.balance) || 0) > 0
            )
            .reduce((sum, acc) => sum + Number(acc.balance || 0), 0);
    }, [selectedAccounts]);

    const totalSavings = memberDeposits * 4;

    // Helper function to get customer display value from flat structure
    const getCustomerDisplayValue = (member) => {
        const fullName = member.fullName || member.FullName || `${member.firstName || ''} ${member.lastName || ''}`;
        const idNumber = member.idNumber || member.IndividualIdentityCardNumber || '';
        const payroll = member.payrollNumber || member.Reference3 || '';
        return `${fullName} | ${idNumber} | ${payroll}`;
    };

    // FIXED: Handle flat customer structure
    const handleCustomerSelect = (value) => {
        setSearchValue(value);

        const selectedMember = customers.find(m => {
            const displayValue = getCustomerDisplayValue(m);
            return displayValue === value;
        });

        if (!selectedMember) return;

        // Extract customer data from flat structure
        const c = {
            Id: selectedMember.id || selectedMember.Id || '',
            IndividualFirstName: selectedMember.firstName || selectedMember.IndividualFirstName || '',
            IndividualLastName: selectedMember.lastName || selectedMember.IndividualLastName || '',
            IndividualIdentityCardNumber: selectedMember.idNumber || selectedMember.IndividualIdentityCardNumber || '',
            Reference3: selectedMember.payrollNumber || selectedMember.Reference3 || '',
            PersonalIdentificationNumber: selectedMember.personalIdentificationNumber || selectedMember.PersonalIdentificationNumber || '',
            AddressMobileLine: selectedMember.address?.mobileLine || selectedMember.AddressMobileLine || '',
            AddressEmail: selectedMember.address?.email || selectedMember.AddressEmail || '',
            Reference2: selectedMember.memberNumber || selectedMember.Reference2 || '',
        };

        const accounts = selectedMember.accounts || selectedMember.Accounts || [];

        setSelectedAccounts(accounts);

        setForm({
            CustomerId: c.Id,
            CustomerFullName: `${c.IndividualFirstName} ${c.IndividualLastName}` || "",
            CustomerIndividualIdentityCardNumber: c.IndividualIdentityCardNumber || "",
            CustomerIndividualPayrollNumbers: c.Reference3 || "",
            CustomerPersonalIdentificationNumber: c.PersonalIdentificationNumber || "",
            CustomerAddressMobileLine: c.AddressMobileLine || "",
            CustomerAddressEmail: c.AddressEmail || "",
            Reference: "",
            LoanProductId: "",
            LoanProductDescription: "",
            LoanRegistrationTermInMonths: 0,
            LoanInterestAnnualPercentageRate: 0,
            LoanInterestChargeModeDescription: "",
            LoanInterestCalculationModeDescription: "",
            LoanRegistrationLoanProductCategoryDescription: "",
            LoanRegistrationMaximumAmount: 0,
            LoanRegistrationMinimumInterestAmount: 0,
            LoanRegistrationInvestmentsMultiplier: 0,
            LoanRegistrationStandingOrderTriggerDescription: "",
            LoanRegistrationMinimumGuarantors: 0,
            LoanRegistrationMaximumGuarantees: 0,
            LoanRegistrationAllowSelfGuarantee: false,
            LoanPurposeDescription: "",
            Remarks: "",
            AmountApplied: 0,
            receivedDate: new Date().toISOString().split('T')[0],
            LoanRegistrationNetIncome: 0,
            LoanRegistrationTotalAllowance: 0,
            LoanRegistrationTotalDeduction: 0,
            LoanRegistrationTotalIncome: 0,
            SectorCode: "",
            SubSectorCode: ""
        });
    };

    const handleLoanProductSelect = (value) => {
        setLoanProductSearch(value);

        const selected = loanProducts.find(p =>
            `${p.PaddedCode} | ${p.Description}` === value
        );

        if (!selected) return;

        setForm(prev => ({
            ...prev,
            LoanProductId: selected.Id,
            LoanProductDescription: selected.Description,
            LoanRegistrationTermInMonths: selected.LoanRegistrationTermInMonths,
            LoanInterestAnnualPercentageRate: selected.LoanInterestAnnualPercentageRate,
            LoanInterestChargeModeDescription: selected.LoanInterestChargeModeDescription,
            LoanInterestCalculationModeDescription: selected.LoanInterestCalculationModeDescription,
            LoanRegistrationLoanProductCategoryDescription: selected.LoanRegistrationLoanProductCategoryDescription,
            LoanRegistrationMaximumAmount: selected.LoanRegistrationMaximumAmount,
            LoanRegistrationMinimumInterestAmount: selected.LoanRegistrationMinimumInterestAmount,
            LoanRegistrationInvestmentsMultiplier: selected.LoanRegistrationInvestmentsMultiplier,
            LoanRegistrationStandingOrderTriggerDescription: selected.LoanRegistrationStandingOrderTriggerDescription,
            LoanRegistrationMinimumGuarantors: selected.LoanRegistrationMinimumGuarantors,
            LoanRegistrationMaximumGuarantees: selected.LoanRegistrationMaximumGuarantees,
            LoanRegistrationAllowSelfGuarantee: selected.LoanRegistrationAllowSelfGuarantee,
        }));

        setMaxTermMonths(selected.LoanRegistrationTermInMonths || 0);

        const min = selected.LoanRegistrationMinimumGuarantors || 0;

        setGuarantors(
            Array.from({ length: min }, () => ({
                CustomerId: "",
                searchValue: "",
                AmountGuaranteed: 0,
                PersonalIdentificationNumber: "",
                IndividualIdentityCardNumber: "",
                IndividualPayrollNumbers: "",
                AddressEmail: "",
                AddressMobileLine: "",
                FullName: "",
                Remarks: "",
                MemberDeposits: 0
            }))
        );
    };

    const updateGuarantor = (index, key, value) => {
        const copy = [...guarantors];
        copy[index][key] = value;
        setGuarantors(copy);
    };

    const addGuarantor = () => {
        setGuarantors(prev => [
            ...prev,
            {
                searchValue: "",
                AmountGuaranteed: 0,
                PersonalIdentificationNumber: "",
                IndividualIdentityCardNumber: "",
                IndividualPayrollNumbers: "",
                AddressEmail: "",
                AddressMobileLine: "",
                FullName: "",
                Remarks: "",
                MemberDeposits: 0
            },
        ]);
    };

    const removeGuarantor = (index) => {
        const min = form.LoanRegistrationMinimumGuarantors || 0;

        if (guarantors.length <= min) {
            Swal.fire(
                "Not Allowed",
                `Minimum ${min} guarantor(s) required for this loan`,
                "warning"
            );
            return;
        }

        setGuarantors(prev => prev.filter((_, i) => i !== index));
    };

    // FIXED: Handle flat structure for guarantor selection
    const handleGuarantorSelect = (index, value) => {
        const selected = customers.find(m => {
            const displayValue = getCustomerDisplayValue(m);
            return displayValue === value;
        });

        if (!selected) {
            updateGuarantor(index, "searchValue", value);
            return;
        }

        const copy = [...guarantors];

        // Extract customer data from flat structure
        const c = {
            Id: selected.id || selected.Id || '',
            IndividualFirstName: selected.firstName || selected.IndividualFirstName || '',
            IndividualLastName: selected.lastName || selected.IndividualLastName || '',
            IndividualIdentityCardNumber: selected.idNumber || selected.IndividualIdentityCardNumber || '',
            Reference3: selected.payrollNumber || selected.Reference3 || '',
            PersonalIdentificationNumber: selected.personalIdentificationNumber || selected.PersonalIdentificationNumber || '',
            AddressMobileLine: selected.address?.mobileLine || selected.AddressMobileLine || '',
            AddressEmail: selected.address?.email || selected.AddressEmail || '',
        };

        // Calculate guarantor's total deposits
        const accounts = selected.accounts || selected.Accounts || [];
        const guarantorDeposits = accounts
            .filter(acc => 
                acc.productDescription === "DEPOSITS" && 
                acc.accountType === "Savings"
            )
            .reduce((sum, acc) => sum + (Number(acc.balance || 0) || 0), 0);

        copy[index] = {
            ...copy[index],
            searchValue: value,
            FullName: `${c.IndividualFirstName} ${c.IndividualLastName}`,
            IndividualIdentityCardNumber: c.IndividualIdentityCardNumber || "",
            IndividualPayrollNumbers: c.Reference3 || "",
            PersonalIdentificationNumber: c.PersonalIdentificationNumber || "",
            AddressMobileLine: c.AddressMobileLine || "",
            AddressEmail: c.AddressEmail || "",
            CustomerId: c.Id,
            MemberDeposits: guarantorDeposits
        };

        setGuarantors(copy);
    };

    const payload = {
        ...form,
        Guarantors: guarantors,
    };

    const handleSubmit = async () => {
        if (guarantors.length < form.LoanRegistrationMinimumGuarantors) {
            Swal.fire(
                "Validation Error",
                `This loan requires at least ${form.LoanRegistrationMinimumGuarantors} guarantor(s)`,
                "error"
            );
            return;
        }

        const totalGuaranteed = guarantors.reduce(
            (sum, g) => sum + (Number(g.AmountGuaranteed) || 0),
            0
        );

        if (totalGuaranteed > Number(form.AmountApplied)) {
            Swal.fire(
                "Validation Error",
                "Total guaranteed amount cannot exceed the amount applied",
                "error"
            );
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_APP_LOANING_URL}/api/Loaning/LoanApplication`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();

            if (data.success || data.Success) {
                Swal.fire(data.message, data.Data, "success");
            } else {
                Swal.fire(data.message, data.Data, "error");
            }

            if (data.success || data.Success) {
                deleteDraft(activeDraftId);
                newForm();
            }
            onClose();
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const net = Number(form.LoanRegistrationNetIncome) || 0;
        const allowance = Number(form.LoanRegistrationTotalAllowance) || 0;
        const deduction = Number(form.LoanRegistrationTotalDeduction) || 0;

        const totalIncome = net + allowance - deduction;

        setForm(prev => ({
            ...prev,
            LoanRegistrationTotalIncome: totalIncome,
        }));
    }, [
        form.LoanRegistrationNetIncome,
        form.LoanRegistrationTotalAllowance,
        form.LoanRegistrationTotalDeduction,
    ]);

    const totalGuaranteedAmount = useMemo(() => {
        return guarantors.reduce(
            (sum, g) => sum + (Number(g.AmountGuaranteed) || 0),
            0
        );
    }, [guarantors]);

    const qualifyingAmount = useMemo(() => {
        return (memberDeposits + (Number(form.Reference) || 0)) * 4;
    }, [memberDeposits, form.Reference]);

    // FIXED: Use correct field names for loan balance
    const totalBookBalance = useMemo(() => {
        return selectedAccounts
            .filter(acc => acc.accountType === "Loan")
            .reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
    }, [selectedAccounts]);

    const remainingEligibleAmount = useMemo(() => {
        return Math.max(qualifyingAmount - totalBookBalance, 0);
    }, [totalBookBalance, qualifyingAmount]);

    // FIXED: Deduplicate accounts using accountId
    const uniqueAccounts = useMemo(() => {
        const seen = new Set();
        return selectedAccounts.filter(acc => {
            const id = acc.accountId || acc.Id || acc.id;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });
    }, [selectedAccounts]);

    // Format date to DD/MM/YYYY for display
    const formatDateForDisplay = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Parse date from DD/MM/YYYY to YYYY-MM-DD for storage
    const parseDateFromDisplay = (dateString) => {
        if (!dateString) return "";
        const parts = dateString.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateString;
    };

    const handleDateChange = (e) => {
        const displayDate = e.target.value;
        const isoDate = parseDateFromDisplay(displayDate);
        if (isoDate && !isNaN(new Date(isoDate).getTime())) {
            update("receivedDate", isoDate);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* BACKDROP */}
                    <motion.div
                        className="fixed inset-0 bg-black z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={handleSafeClose}
                    />

                    {/* DRAWER */}
                    <motion.div
                        className="fixed top-3 right-3 w-[90vw] max-w-[1100px] bg-white shadow-2xl z-50 rounded-2xl flex flex-col"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        {/* HEADER */}
                        <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
                            <h2 className="font-bold text-xl text-white flex items-center gap-3">
                                Loan Application
                                {activeDraft && (
                                    <span className="text-xs font-normal bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full max-w-[200px] truncate">
                                        {activeDraft.label}
                                    </span>
                                )}
                            </h2>
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={() => setDraftsOpen(o => !o)}
                                    className="relative flex items-center gap-1 text-sm bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1.5 rounded-lg"
                                >
                                    Drafts
                                    {drafts.length > 0 && (
                                        <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 rounded-full">
                                            {drafts.length}
                                        </span>
                                    )}
                                </button>
                                {hasDraft && (
                                    <Button
                                        variant="outline"
                                        className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white text-xs"
                                        onClick={handleSaveDraft}
                                    >
                                        {activeDraftId ? "Saved ✓" : "Save Draft"}
                                    </Button>
                                )}
                                {hasDraft && !activeDraftId && (
                                    <Button
                                        variant="outline"
                                        className="border-gray-500 text-gray-400 hover:bg-gray-600 hover:text-gray-100 text-xs"
                                        onClick={() => { newForm(); }}
                                    >
                                        New Form
                                    </Button>
                                )}
                                <Button variant="outline" onClick={handleSafeClose}>
                                    Close
                                </Button>
                            </div>
                        </div>

                        {/* DRAFTS PANEL */}
                        {draftsOpen && (
                            <div className="mx-4 mb-2 border border-indigo-200 rounded-xl bg-indigo-50 shadow-inner overflow-hidden">
                                <div className="flex justify-between items-center px-4 py-2 bg-indigo-100 border-b border-indigo-200">
                                    <span className="font-semibold text-indigo-800 text-sm">Saved Drafts</span>
                                    <button
                                        onClick={() => { handleSaveDraft(); }}
                                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg"
                                    >
                                        + Save Current as Draft
                                    </button>
                                </div>
                                {drafts.length === 0 ? (
                                    <p className="text-center text-gray-500 text-sm py-4">No drafts saved yet.</p>
                                ) : (
                                    <ul className="max-h-56 overflow-y-auto divide-y divide-indigo-100">
                                        {drafts.map((d, idx) => (
                                            <li
                                                key={d.id || `draft-${idx}`}
                                                className={`flex items-center justify-between px-4 py-2 text-sm transition ${activeDraftId === d.id ? "bg-indigo-100" : "hover:bg-white"}`}
                                            >
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <p className="font-medium text-indigo-900 truncate">{d.label}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {d.lastSaved ? new Date(d.lastSaved).toLocaleString() : "—"}
                                                        {activeDraftId === d.id && (
                                                            <span className="ml-2 text-indigo-600 font-semibold">● Active</span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    <button
                                                        onClick={() => { loadDraft(d.id); setDraftsOpen(false); }}
                                                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded"
                                                    >
                                                        Load
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            Swal.fire({
                                                                title: "Delete draft?",
                                                                text: `"${d.label}" will be permanently removed.`,
                                                                icon: "warning",
                                                                showCancelButton: true,
                                                                confirmButtonColor: "#d33",
                                                                confirmButtonText: "Delete",
                                                            }).then(r => { if (r.isConfirmed) deleteDraft(d.id); });
                                                        }}
                                                        className="text-xs bg-red-100 hover:bg-red-500 hover:text-white text-red-600 px-2 py-1 rounded"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {/* CONTENT */}
                        <div className="p-6 overflow-y-auto h-[88vh]">
                            <div className="bg-gray-200 rounded-lg p-3">
                                {/* CUSTOMER DETAILS */}
                                <Card className="p-4 mb-6">
                                    <h3 className="font-semibold mb-4">Applicant Details</h3>

                                    <div className="mb-4">
                                        <Label>Select Customer</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Select customer"
                                                value={form.CustomerFullName}
                                                readOnly
                                            />
                                            <Button
                                                type="button"
                                                onClick={() => setCustomerModalOpen(true)}
                                                disabled={isLoadingCustomers}
                                            >
                                                {isLoadingCustomers ? "Loading..." : "Select"}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Input label="Full Name" placeholder="Full Name" value={form.CustomerFullName} readOnly />
                                        <Input label="ID Number" placeholder="ID Number" value={form.CustomerIndividualIdentityCardNumber} readOnly />
                                        <Input label="Payroll Number" placeholder="Payroll Number" value={form.CustomerIndividualPayrollNumbers} readOnly />
                                        <Input label="KRA PIN" placeholder="KRA PIN" value={form.CustomerPersonalIdentificationNumber} readOnly />
                                        <Input label="Mobile" placeholder="Mobile" value={form.CustomerAddressMobileLine} readOnly />
                                        <Input label="Email" placeholder="Email" value={form.CustomerAddressEmail} readOnly />
                                    </div>
                                </Card>

                                {/* ACCOUNTS SUMMARY */}
                                <Card className="p-4 mb-6">
                                    <div className="flex justify-between items-center bg-indigo-600 text-white rounded-md px-5 py-3 mb-4">
                                        <h3 className="font-semibold">Member Accounts & Balances</h3>
                                    </div>

                                    {uniqueAccounts.length === 0 && (
                                        <p className="text-sm text-gray-500">No accounts found. Please select a customer.</p>
                                    )}

                                    <div className="max-h-64 overflow-y-auto bg-gray-200 p-4 rounded-lg">
                                        {uniqueAccounts.length === 0 ? (
                                            <div className="text-center py-8 text-gray-400">
                                                <p>No accounts available</p>
                                                <p className="text-xs mt-1">Select a customer to view their accounts</p>
                                            </div>
                                        ) : (
                                            uniqueAccounts
                                                .filter(acc => {
                                                    const desc = (acc.productDescription || "").toLowerCase();
                                                    if (
                                                        desc.includes("entrance") ||
                                                        desc.includes("share capital") ||
                                                        desc.includes("benevolent") ||
                                                        desc.includes("benovelent")
                                                    ) return false;
                                                    return true;
                                                })
                                                .map((acc, idx) => {
                                                    const uniqueKey = acc.accountId || acc.Id || acc.id || `account-${idx}`;
                                                    const balance = Number(acc.balance || 0);
                                                    const isLoan = acc.accountType === "Loan";
                                                    const isSavings = acc.accountType === "Savings";
                                                    const productDesc = acc.productDescription || "N/A";
                                                    
                                                    return (
                                                        <div
                                                            key={uniqueKey}
                                                            className="border rounded-lg p-3 mb-2 flex justify-between items-center bg-gray-50"
                                                        >
                                                            <div>
                                                                <p className="text-xs text-gray-500">
                                                                    {productDesc}
                                                                    {acc.productCode && ` · Code: ${acc.productCode}`}
                                                                </p>
                                                                <p className="text-xs text-gray-400">
                                                                    {acc.accountType || "Unknown Type"}
                                                                    {acc.accountStatus === 0 ? " · Active" : " · Inactive"}
                                                                </p>
                                                            </div>

                                                            <div className="text-right">
                                                                {isLoan && (
                                                                    <p className={`text-sm ${balance < 0 ? 'text-red-700' : 'text-red-500'}`}>
                                                                        Balance: <b>{balance.toLocaleString()}</b>
                                                                    </p>
                                                                )}

                                                                {isSavings && (
                                                                    <p className={`text-sm ${balance > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                                                                        Balance: <b>{balance.toLocaleString()}</b>
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                        )}
                                    </div>
                                </Card>

                                {/* LOAN DETAILS */}
                                <Card className="p-4 mb-6">
                                    <div className="flex justify-between items-center bg-indigo-600 text-white rounded-md px-2 py-2 mb-4">
                                        <h1 className="font-semibold px-4">Loan Details</h1>
                                        <div className="flex gap-4 justify-between items-center bg-indigo-600 text-white rounded-md px-1 py-1 mb-1">
                                            <div className="flex gap-4">
                                                <div className="bg-indigo-700 p-3 rounded-lg flex items-center justify-center text-sm">
                                                    Qualifying Amount
                                                    <span className="bg-indigo-500 px-4 py-2 rounded-md ml-2">
                                                        {qualifyingAmount.toLocaleString()}
                                                    </span>
                                                </div>

                                                <div className="bg-red-700 p-3 rounded-lg flex items-center justify-center text-sm">
                                                    Total Loan Book
                                                    <span className="bg-red-500 px-4 py-2 rounded-md ml-2">
                                                        {totalBookBalance.toLocaleString()}
                                                    </span>
                                                </div>

                                                <div className="bg-green-700 p-3 rounded-lg flex items-center justify-center text-sm">
                                                    Remaining Eligibility
                                                    <span className="bg-green-500 px-4 py-2 rounded-md ml-2">
                                                        {remainingEligibleAmount.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-4">
                                            <Label>Select Loan Product</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Select loan product"
                                                    value={form.LoanProductDescription}
                                                    readOnly
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={() => setLoanProductModalOpen(true)}
                                                >
                                                    Select
                                                </Button>
                                            </div>
                                        </div>

                                        <div>
                                            <Label>Loan Product</Label>
                                            <Input
                                                value={form.LoanProductDescription}
                                                onChange={e => update("LoanProductDescription", e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <Label>Purpose</Label>
                                            <Input
                                                value={form.LoanPurposeDescription}
                                                onChange={e => update("LoanPurposeDescription", e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <Label>
                                                Amount Applied
                                                {form.LoanRegistrationMaximumAmount > 0 && (
                                                    <span className="ml-2 text-xs text-gray-500 font-normal">
                                                        max {Number(form.LoanRegistrationMaximumAmount).toLocaleString()}
                                                    </span>
                                                )}
                                            </Label>
                                            <Input
                                                inputMode="numeric"
                                                value={form.AmountApplied ? Number(form.AmountApplied).toLocaleString() : ""}
                                                onChange={e => {
                                                    const raw = e.target.value.replace(/,/g, "");
                                                    if (!/^\d*$/.test(raw)) return;
                                                    const val = raw === "" ? 0 : Number(raw);
                                                    
                                                    if (form.LoanRegistrationMaximumAmount > 0 && val > form.LoanRegistrationMaximumAmount) {
                                                        Swal.fire(
                                                            "Amount Exceeded",
                                                            `Amount applied cannot exceed the maximum of ${Number(form.LoanRegistrationMaximumAmount).toLocaleString()}`,
                                                            "warning"
                                                        );
                                                        return;
                                                    }
                                                    
                                                    // Check against qualifying amount with confirmation
                                                    if (remainingEligibleAmount > 0 && val > remainingEligibleAmount) {
                                                        setExcessConfirmed(false);
                                                        
                                                        Swal.fire({
                                                            title: "⚠️ Amount Exceeds Eligibility",
                                                            html: `
                                                                <div style="text-align: left;">
                                                                    <p><strong>Amount Applied:</strong> ${val.toLocaleString()} KSH</p>
                                                                    <p><strong>Qualifying Amount:</strong> ${qualifyingAmount.toLocaleString()} KSH</p>
                                                                    <p><strong>Current Loan Book:</strong> ${totalBookBalance.toLocaleString()} KSH</p>
                                                                    <p><strong>Remaining Eligibility:</strong> ${remainingEligibleAmount.toLocaleString()} KSH</p>
                                                                    <hr style="margin: 15px 0;">
                                                                    <p style="color: #e74c3c;">The amount you're applying for exceeds your remaining eligible amount by ${(val - remainingEligibleAmount).toLocaleString()} KSH.</p>
                                                                    <p>Do you still want to proceed with this application?</p>
                                                                </div>
                                                            `,
                                                            icon: "warning",
                                                            showCancelButton: true,
                                                            confirmButtonText: "Yes, Proceed Anyway",
                                                            cancelButtonText: "No, Adjust Amount",
                                                            confirmButtonColor: "#e74c3c",
                                                            cancelButtonColor: "#4f46e5",
                                                            reverseButtons: true
                                                        }).then((result) => {
                                                            if (result.isConfirmed) {
                                                                setExcessConfirmed(true);
                                                                update("AmountApplied", val);
                                                                Swal.fire({
                                                                    title: "Proceeding with Over-limit Application",
                                                                    text: "Please note that this application may require additional approval and review.",
                                                                    icon: "info",
                                                                    timer: 2500,
                                                                    showConfirmButton: false
                                                                });
                                                            }
                                                        });
                                                        return;
                                                    }
                                                    
                                                    setExcessConfirmed(false);
                                                    update("AmountApplied", val);
                                                }}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Maximum eligible: {remainingEligibleAmount.toLocaleString()} KSH
                                            </p>
                                            {form.AmountApplied > remainingEligibleAmount && remainingEligibleAmount > 0 && (
                                                <p className="text-xs text-red-600 mt-1">
                                                    ⚠️ Warning: Amount exceeds your eligible limit by {(form.AmountApplied - remainingEligibleAmount).toLocaleString()} KSH
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label>
                                                Loan Term (Months)
                                                {maxTermMonths > 0 && (
                                                    <span className="ml-2 text-xs text-gray-500 font-normal">
                                                        max {maxTermMonths}
                                                    </span>
                                                )}
                                            </Label>
                                            <Input
                                                type="number"
                                                value={form.LoanRegistrationTermInMonths}
                                                onChange={e => {
                                                    const val = Number(e.target.value);
                                                    if (maxTermMonths > 0 && val > maxTermMonths) {
                                                        Swal.fire(
                                                            "Term Exceeded",
                                                            `Loan term cannot exceed ${maxTermMonths} months for this product`,
                                                            "warning"
                                                        );
                                                        return;
                                                    }
                                                    update("LoanRegistrationTermInMonths", val);
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <Label>Interest Rate (%)</Label>
                                            <Input
                                                type="number"
                                                disabled
                                                value={form.LoanInterestAnnualPercentageRate}
                                            />
                                        </div>

                                        <div>
                                            <Label>Loan Category</Label>
                                            <Input
                                                value={form.LoanRegistrationLoanProductCategoryDescription}
                                                disabled
                                            />
                                        </div>

                                        <div>
                                            <Label>Maximum Amount</Label>
                                            <Input
                                                type="number"
                                                disabled
                                                value={form.LoanRegistrationMaximumAmount}
                                            />
                                        </div>

                                        <div>
                                            <Label>Investments Multiplier</Label>
                                            <Input
                                                type="number"
                                                disabled
                                                value={form.LoanRegistrationInvestmentsMultiplier}
                                            />
                                        </div>

                                        <div>
                                            <Label>Standing Order Trigger</Label>
                                            <Input
                                                value={form.LoanRegistrationStandingOrderTriggerDescription}
                                                disabled
                                            />
                                        </div>

                                        <div>
                                            <Label>Min Guarantors</Label>
                                            <Input
                                                type="number"
                                                disabled
                                                value={form.LoanRegistrationMinimumGuarantors}
                                            />
                                        </div>

                                        <div>
                                            <Label>Max Guarantees</Label>
                                            <Input
                                                type="number"
                                                disabled
                                                value={form.LoanRegistrationMaximumGuarantees}
                                            />
                                        </div>

                                        <div>
                                            <Label>Allow Self Guarantee</Label>
                                            <Input
                                                value={form.LoanRegistrationAllowSelfGuarantee ? "Yes" : "No"}
                                                readOnly
                                            />
                                        </div>
                                        <div>
                                            <Label>Application Date (DD/MM/YYYY)</Label>
                                            <Input
                                                type="text"
                                                placeholder="DD/MM/YYYY"
                                                value={formatDateForDisplay(form.receivedDate)}
                                                onChange={handleDateChange}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div className="flex items-center gap-2 p-2">
                                            <input
                                                type="checkbox"
                                                checked={boosted}
                                                onChange={(e) => {
                                                    const isBoosted = e.target.checked;
                                                    setBoosted(isBoosted);
                                                    setForm(prev => ({
                                                        ...prev,
                                                        IsBatched: !isBoosted,
                                                        Remarks: isBoosted
                                                            ? prev.Remarks
                                                                ? `${prev.Remarks} - boosted`
                                                                : "boosted"
                                                            : prev.Remarks.replace(/\s?-?\s?boosted/i, "").trim(),
                                                    }));
                                                }}
                                            />
                                            <Label>Is Boosted Loan?</Label> <br />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            {boosted && (
                                                <div>
                                                    <Label>Reference Amount</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="Enter boosted amount"
                                                        value={form.Reference}
                                                        onChange={(e) => {
                                                            const val = Number(e.target.value);
                                                            if (form.AmountApplied > 0 && val > Number(form.AmountApplied)) {
                                                                Swal.fire(
                                                                    "Amount Exceeded",
                                                                    `Boost amount cannot exceed the amount applied (${Number(form.AmountApplied).toLocaleString()})`,
                                                                    "warning"
                                                                );
                                                                return;
                                                            }
                                                            update("Reference", e.target.value);
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            {boosted && (
                                                <div>
                                                    <Label>Remarks</Label>
                                                    <Input
                                                        className="w-full"
                                                        value={form.Remarks}
                                                        readOnly={boosted}
                                                        onChange={e => update("Remarks", e.target.value)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div>
                                                <div className="flex items-center gap-2 p-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={hasOffset}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            setHasOffset(checked);
                                                            if (!checked) {
                                                                setSelectedParentLoan(null);
                                                                update("parentId", "");
                                                            }
                                                        }}
                                                    />
                                                    <Label>Loan Refinance</Label>
                                                </div>

                                                {hasOffset && (
                                                    <div className="flex gap-2 mt-1">
                                                        <Input
                                                            value={selectedParentLoan?.LoanProductDescription || ""}
                                                            placeholder="Select Loan to Offset"
                                                            readOnly
                                                        />
                                                        <Button
                                                            type="button"
                                                            onClick={() => setParentLoanModalOpen(true)}
                                                        >
                                                            Select
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Loan Sector */}
                                <Card className="p-4 mb-6">
                                    <h3 className="font-semibold mb-4">Loan Sector</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Loan Sector</Label>
                                            <select
                                                className="w-full border rounded-md p-2"
                                                value={form.SectorCode}
                                                onChange={(e) => {
                                                    update("SectorCode", e.target.value);
                                                    update("SubSectorCode", "");
                                                }}
                                            >
                                                <option value="">Select Sector</option>
                                                {loanSectors.map((sector, idx) => (
                                                    <option key={sector.Id || `sector-${idx}`} value={sector.SectorCode}>
                                                        {sector.SectorCode} - {sector.SectorName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <Label>Loan Sub Sector</Label>
                                            <select
                                                className="w-full border rounded-md p-2"
                                                value={form.SubSectorCode}
                                                onChange={(e) => update("SubSectorCode", e.target.value)}
                                                disabled={!form.SectorCode}
                                            >
                                                <option value="">Select Sub Sector</option>
                                                {filteredSubSectors.map((sub, idx) => (
                                                    <option key={sub.Id || `subsector-${idx}`} value={sub.SubSectorCode}>
                                                        {sub.SubSectorCode} - {sub.SubSectorName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </Card>

                                {/* GUARANTORS */}
                                <Card className="p-4">
                                    <div className="flex justify-between items-center bg-indigo-600 text-white rounded-md px-5 py-3 mb-4">
                                        <h3 className="font-semibold">Guarantors</h3>
                                        <div className="text-sm text-gray-50">
                                            Guaranteed: <b>{totalGuaranteedAmount.toLocaleString()}</b> /{" "}
                                            {Number(form.AmountApplied).toLocaleString()}
                                        </div>
                                    </div>

                                    {guarantors.map((g, index) => (
                                        <div key={g.CustomerId || `guarantor-${index}`} className="border rounded-lg p-4 mb-4">
                                            <div className="flex justify-between mb-2">
                                                <h4 className="font-medium">
                                                    Guarantor {index + 1}
                                                </h4>

                                                {guarantors.length > form.LoanRegistrationMinimumGuarantors && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-red-600 text-white"
                                                        onClick={() => removeGuarantor(index)}
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="md:col-span-3">
                                                    <Label>Select Guarantor</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="Select guarantor"
                                                            value={g.FullName}
                                                            readOnly
                                                        />
                                                        <Button
                                                            type="button"
                                                            onClick={() => setGuarantorModalIndex(index)}
                                                        >
                                                            Select
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label>Full Name</Label>
                                                    <Input
                                                        placeholder="Full Name"
                                                        value={g.FullName}
                                                        readOnly
                                                    />
                                                </div>
                                                <div>
                                                    <Label>ID Number</Label>
                                                    <Input
                                                        placeholder="ID Number"
                                                        value={g.IndividualIdentityCardNumber}
                                                        readOnly
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Payroll Number</Label>
                                                    <Input
                                                        placeholder="Payroll Number"
                                                        value={g.IndividualPayrollNumbers}
                                                        readOnly
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Mobile</Label>
                                                    <Input
                                                        placeholder="Mobile"
                                                        value={g.AddressMobileLine}
                                                        readOnly
                                                    />
                                                </div>

                                                <div>
                                                    <Label>Email</Label>
                                                    <Input
                                                        placeholder="Email"
                                                        value={g.AddressEmail}
                                                        readOnly
                                                    />
                                                </div>

                                                <div>
                                                    <Label>
                                                        Amount
                                                        {g.MemberDeposits > 0 && (
                                                            <span className="ml-2 text-xs text-green-700 font-normal">
                                                                (Deposits: {Number(g.MemberDeposits).toLocaleString()})
                                                            </span>
                                                        )}
                                                    </Label>
                                                    <Input
                                                        placeholder="Amount Guaranteed"
                                                        inputMode="numeric"
                                                        value={g.AmountGuaranteed ? Number(g.AmountGuaranteed).toLocaleString() : ""}
                                                        onChange={(e) => {
                                                            const raw = e.target.value.replace(/,/g, "");
                                                            if (!/^\d*$/.test(raw)) return;
                                                            const value = raw === "" ? 0 : Number(raw);

                                                            const checkGuarantorDeposit = () => {
                                                                if (g.MemberDeposits > 0 && value > g.MemberDeposits) {
                                                                    Swal.fire({
                                                                        title: "Insufficient Deposits",
                                                                        html: `<p>This guarantor only has <b>${Number(g.MemberDeposits).toLocaleString()} KSH</b> in deposits.</p>
                                                                               <p>Would you like to proceed with the maximum amount of <b>${Number(g.MemberDeposits).toLocaleString()} KSH</b> instead?</p>`,
                                                                        icon: "warning",
                                                                        showCancelButton: true,
                                                                        confirmButtonText: "Yes, use max amount",
                                                                        cancelButtonText: "No, let me change",
                                                                        confirmButtonColor: "#4f46e5"
                                                                    }).then((result) => {
                                                                        if (result.isConfirmed) {
                                                                            updateGuarantor(index, "AmountGuaranteed", g.MemberDeposits);
                                                                        }
                                                                    });
                                                                    return false;
                                                                }
                                                                return true;
                                                            };

                                                            if (!checkGuarantorDeposit()) return;

                                                            const otherGuarantorsTotal = guarantors.reduce(
                                                                (sum, g, i) =>
                                                                    i === index ? sum : sum + (Number(g.AmountGuaranteed) || 0),
                                                                0
                                                            );

                                                            if (otherGuarantorsTotal + value > Number(form.AmountApplied)) {
                                                                Swal.fire(
                                                                    "Amount Exceeded",
                                                                    "Total guaranteed amount cannot exceed Amount Applied",
                                                                    "warning"
                                                                );
                                                                return;
                                                            }

                                                            updateGuarantor(index, "AmountGuaranteed", value);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <Button variant="outline" onClick={addGuarantor}>
                                        + Add Guarantor
                                    </Button>
                                </Card>
                            </div>

                            {/* ACTIONS */}
                            <div className="flex justify-between items-center mt-8">
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleSaveDraft}
                                        disabled={!hasDraft}
                                        className="border-indigo-400 text-indigo-700 hover:bg-indigo-50"
                                    >
                                        {activeDraftId ? "Draft Saved ✓" : "Save as Draft"}
                                    </Button>
                                    {hasDraft && (
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                Swal.fire({
                                                    title: "Start a new form?",
                                                    text: activeDraftId
                                                        ? "Current form is saved in drafts. You can reload it later."
                                                        : "Unsaved changes will be lost.",
                                                    icon: "question",
                                                    showCancelButton: true,
                                                    confirmButtonColor: "#4f46e5",
                                                    confirmButtonText: "New Form",
                                                }).then(r => { if (r.isConfirmed) newForm(); });
                                            }}
                                            className="border-gray-400 text-gray-600 hover:bg-gray-50"
                                        >
                                            New Form
                                        </Button>
                                    )}
                                </div>
                                <Button onClick={handleSubmit} disabled={loading}>
                                    {loading ? "Submitting..." : "Submit Loan Application"}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
            
            <CustomerSelectModal
                open={customerModalOpen}
                onClose={() => setCustomerModalOpen(false)}
                customers={customers}
                onSelect={(member) => {
                    // Handle flat structure - extract customer data
                    const c = {
                        Id: member.id || member.Id || '',
                        IndividualFirstName: member.firstName || member.IndividualFirstName || '',
                        IndividualLastName: member.lastName || member.IndividualLastName || '',
                        IndividualIdentityCardNumber: member.idNumber || member.IndividualIdentityCardNumber || '',
                        Reference3: member.payrollNumber || member.Reference3 || '',
                        PersonalIdentificationNumber: member.personalIdentificationNumber || member.PersonalIdentificationNumber || '',
                        AddressMobileLine: member.address?.mobileLine || member.AddressMobileLine || '',
                        AddressEmail: member.address?.email || member.AddressEmail || '',
                        Reference2: member.memberNumber || member.Reference2 || '',
                    };
                    
                    // Get accounts from the member
                    const accounts = member.accounts || member.Accounts || [];
                    
                    // Set selected accounts
                    setSelectedAccounts(accounts);
                    
                    // Update form with customer details
                    setForm(prev => ({
                        ...prev,
                        CustomerId: c.Id,
                        CustomerFullName: `${c.IndividualFirstName} ${c.IndividualLastName}`,
                        CustomerIndividualIdentityCardNumber: c.IndividualIdentityCardNumber || "",
                        CustomerIndividualPayrollNumbers: c.Reference3 || "",
                        CustomerPersonalIdentificationNumber: c.PersonalIdentificationNumber || "",
                        CustomerAddressMobileLine: c.AddressMobileLine || "",
                        CustomerAddressEmail: c.AddressEmail || "",
                        Reference: "",
                    }));
                    
                    // Reset parent loan selection
                    setSelectedParentLoan(null);
                    update("parentId", "");
                }}
                onSearch={handleCustomerSearch}
            />

            <LoanProductSelectModal
                open={loanProductModalOpen}
                onClose={() => setLoanProductModalOpen(false)}
                loanProducts={loanProducts}
                onSelect={(selected) => {
                    setForm(prev => ({
                        ...prev,
                        LoanProductId: selected.Id,
                        LoanProductDescription: selected.Description,
                        LoanRegistrationTermInMonths: selected.LoanRegistrationTermInMonths,
                        LoanInterestAnnualPercentageRate: selected.LoanInterestAnnualPercentageRate,
                        LoanInterestChargeModeDescription: selected.LoanInterestChargeModeDescription,
                        LoanInterestCalculationModeDescription: selected.LoanInterestCalculationModeDescription,
                        LoanRegistrationLoanProductCategoryDescription: selected.LoanRegistrationLoanProductCategoryDescription,
                        LoanRegistrationMaximumAmount: selected.LoanRegistrationMaximumAmount,
                        LoanRegistrationMinimumInterestAmount: selected.LoanRegistrationMinimumInterestAmount,
                        LoanRegistrationInvestmentsMultiplier: selected.LoanRegistrationInvestmentsMultiplier,
                        LoanRegistrationStandingOrderTriggerDescription: selected.LoanRegistrationStandingOrderTriggerDescription,
                        LoanRegistrationMinimumGuarantors: selected.LoanRegistrationMinimumGuarantors,
                        LoanRegistrationMaximumGuarantees: selected.LoanRegistrationMaximumGuarantees,
                        LoanRegistrationAllowSelfGuarantee: selected.LoanRegistrationAllowSelfGuarantee,
                    }));
                    setMaxTermMonths(selected.LoanRegistrationTermInMonths || 0);
                    const min = selected.LoanRegistrationMinimumGuarantors || 0;
                    setGuarantors(
                        Array.from({ length: min }, () => ({
                            CustomerId: "",
                            searchValue: "",
                            AmountGuaranteed: 0,
                            PersonalIdentificationNumber: "",
                            IndividualIdentityCardNumber: "",
                            IndividualPayrollNumbers: "",
                            AddressEmail: "",
                            AddressMobileLine: "",
                            FullName: "",
                            Remarks: "",
                            MemberDeposits: 0
                        }))
                    );
                }}
            />

            <GuarantorSelectModal
                open={guarantorModalIndex !== null}
                onClose={() => setGuarantorModalIndex(null)}
                customers={customers}
                applicantId={form.CustomerId}
                allowSelfGuarantee={form.LoanRegistrationAllowSelfGuarantee}
                selectedGuarantorIds={guarantors
                    .map(g => g.CustomerId)
                    .filter(Boolean)}
                onSelect={(member, deposits) => {
                    const c = {
                        Id: member.id || member.Id || '',
                        IndividualFirstName: member.firstName || member.IndividualFirstName || '',
                        IndividualLastName: member.lastName || member.IndividualLastName || '',
                        IndividualIdentityCardNumber: member.idNumber || member.IndividualIdentityCardNumber || '',
                        Reference3: member.payrollNumber || member.Reference3 || '',
                        PersonalIdentificationNumber: member.personalIdentificationNumber || member.PersonalIdentificationNumber || '',
                        AddressMobileLine: member.address?.mobileLine || member.AddressMobileLine || '',
                        AddressEmail: member.address?.email || member.AddressEmail || '',
                    };
                    
                    const guarantorDeposits = deposits || 0;
                    
                    setGuarantors(prev => {
                        const copy = [...prev];
                        copy[guarantorModalIndex] = {
                            ...copy[guarantorModalIndex],
                            CustomerId: c.Id,
                            FullName: `${c.IndividualFirstName} ${c.IndividualLastName}`,
                            IndividualIdentityCardNumber: c.IndividualIdentityCardNumber || "",
                            IndividualPayrollNumbers: c.Reference3 || "",
                            PersonalIdentificationNumber: c.PersonalIdentificationNumber || "",
                            AddressMobileLine: c.AddressMobileLine || "",
                            AddressEmail: c.AddressEmail || "",
                            MemberDeposits: guarantorDeposits,
                            AmountGuaranteed: 0,
                        };
                        return copy;
                    });
                }}
            />

            <ParentLoanSelectModal
                open={parentLoanModalOpen}
                onClose={() => setParentLoanModalOpen(false)}
                customers={customers}
                selectedCustomerId={form.CustomerId}
                onSelect={(loan) => {
                    setSelectedParentLoan(loan);
                    setForm(prev => ({
                        ...prev,
                        parentId: loan.Id,
                        Remarks: prev.Remarks
                    }));
                    setParentLoanModalOpen(false);
                }}
            />
        </AnimatePresence>
    );
}