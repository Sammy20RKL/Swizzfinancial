import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Swal from "sweetalert2";
import CustomerSelectModal from "../AddLoanApplicationDrawer/CustomerSelectModal";
import LoanProductSelectModal from "../AddLoanApplicationDrawer/LoanProductSelectModal";
import GuarantorSelectModal from "../AddLoanApplicationDrawer/GuarantorSelectModal";
import ParentLoanSelectModal from "../AddLoanApplicationDrawer/ParentLoanSelectModal";

const emptyGuarantor = () => ({
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
});

function loanToForm(loan) {
    if (!loan) return {};
    return {
        // Customer (editable via modal)
        CustomerId: loan.CustomerId ?? "",
        CustomerPersonalIdentificationNumber: loan.CustomerPersonalIdentificationNumber ?? "",
        CustomerIndividualIdentityCardNumber: loan.CustomerIndividualIdentityCardNumber ?? "",
        CustomerIndividualPayrollNumbers: loan.CustomerIndividualPayrollNumbers ?? "",
        CustomerFullName: `${loan.CustomerIndividualFirstName ?? ""} ${loan.CustomerIndividualLastName ?? ""}`.trim(),
        CustomerAddressMobileLine: loan.CustomerAddressMobileLine ?? "",
        CustomerAddressEmail: loan.CustomerAddressEmail ?? "",
        // Loan product (editable via modal)
        LoanProductId: loan.LoanProductId ?? "",
        LoanProductDescription: loan.LoanProductDescription ?? "",
        // Loan product readonly info (displayed only)
        LoanRegistrationTermInMonths: loan.LoanRegistrationTermInMonths ?? 0,
        LoanInterestAnnualPercentageRate: loan.LoanInterestAnnualPercentageRate ?? 0,
        LoanInterestChargeModeDescription: loan.LoanInterestChargeModeDescription ?? "",
        LoanInterestCalculationModeDescription: loan.LoanInterestCalculationModeDescription ?? "",
        LoanRegistrationLoanProductCategoryDescription: loan.LoanRegistrationLoanProductCategoryDescription ?? "",
        LoanRegistrationMaximumAmount: loan.LoanRegistrationMaximumAmount ?? 0,
        LoanRegistrationMinimumInterestAmount: loan.LoanRegistrationMinimumInterestAmount ?? 0,
        LoanRegistrationInvestmentsMultiplier: loan.LoanRegistrationInvestmentsMultiplier ?? 0,
        LoanRegistrationStandingOrderTriggerDescription: loan.LoanRegistrationStandingOrderTriggerDescription ?? "",
        LoanRegistrationMinimumGuarantors: loan.LoanRegistrationMinimumGuarantors ?? 0,
        LoanRegistrationMaximumGuarantees: loan.LoanRegistrationMaximumGuarantees ?? 0,
        LoanRegistrationAllowSelfGuarantee: loan.LoanRegistrationAllowSelfGuarantee ?? false,
        // Editable fields
        LoanPurposeId: loan.LoanPurposeId ?? null,
        LoanPurposeDescription: loan.LoanPurposeDescription ?? "",
        Remarks: loan.Remarks ?? "",
        AmountApplied: loan.AmountApplied ?? 0,
        Reference: loan.Reference ?? "",
        IsBatched: loan.IsBatched ?? false,
        receivedDate: loan.ReceivedDate
            ? loan.ReceivedDate.split("T")[0]
            : new Date().toISOString().split("T")[0],
        LoanRegistrationNetIncome: loan.LoanRegistrationNetIncome ?? 0,
        LoanRegistrationTotalAllowance: loan.LoanRegistrationTotalAllowance ?? 0,
        LoanRegistrationTotalDeduction: loan.LoanRegistrationTotalDeduction ?? 0,
        LoanRegistrationTotalIncome: loan.LoanRegistrationTotalIncome ?? 0,
        SectorCode: loan.SectorCode ?? "",
        SubSectorCode: loan.SubSectorCode ?? "",
        parentId: loan.ParentId ?? null,
    };
}

export default function UpdateLoanDraftDrawer({ open, loan, onClose, onSuccess }) {
    const [form, setForm] = useState({});
    const [guarantors, setGuarantors] = useState([emptyGuarantor()]);
    const [selectedAccounts, setSelectedAccounts] = useState([]);
    const [boosted, setBoosted] = useState(false);
    const [hasOffset, setHasOffset] = useState(false);
    const [selectedParentLoan, setSelectedParentLoan] = useState(null);
    const [maxTermMonths, setMaxTermMonths] = useState(0);
    const [loading, setLoading] = useState(false);

    const [customers, setCustomers] = useState([]);
    const [loanProducts, setLoanProducts] = useState([]);
    const [loanSectors, setLoanSectors] = useState([]);
    const [loanSubSectors, setLoanSubSectors] = useState([]);

    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [loanProductModalOpen, setLoanProductModalOpen] = useState(false);
    const [guarantorModalIndex, setGuarantorModalIndex] = useState(null);
    const [parentLoanModalOpen, setParentLoanModalOpen] = useState(false);

    /* ── initialise form from loan prop ── */
    useEffect(() => {
        if (!loan) return;
        setForm(loanToForm(loan));
        setBoosted(!!loan.Reference && Number(loan.Reference) > 0);
        setHasOffset(!!loan.ParentId);
        setMaxTermMonths(loan.LoanRegistrationTermInMonths ?? 0);
        setGuarantors([emptyGuarantor()]);
        setSelectedParentLoan(null);
    }, [loan]);

    /* ── static dropdowns ── */
    useEffect(() => {
        fetch(`${import.meta.env.VITE_APP_LOANING_URL}/api/Loansetups/GetLoanproducts`)
            .then(r => r.json())
            .then(d => { if (d.Success) setLoanProducts(d.Data || []); })
            .catch(() => { });
    }, []);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_APP_LOANING_URL}/api/Loansetups/GetAllloanSector`)
            .then(r => r.json())
            .then(d => setLoanSectors(d || []))
            .catch(() => { });
    }, []);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_APP_LOANING_URL}/api/Loansetups/GetAllLoanSubSector`)
            .then(r => r.json())
            .then(d => setLoanSubSectors(d || []))
            .catch(() => { });
    }, []);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/values/GetMembersWithDetails`)
            .then(r => r.json())
            .then(d => { if (d.Success) setCustomers(d.Data || []); })
            .catch(() => { });
    }, []);

    /* ── helpers ── */
    const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const filteredSubSectors = loanSubSectors.filter(
        s => s.IsActive && form.SectorCode && s.SubSectorCode?.startsWith(form.SectorCode)
    );

    /* ── total income auto-calc ── */
    useEffect(() => {
        const net = Number(form.LoanRegistrationNetIncome) || 0;
        const allowance = Number(form.LoanRegistrationTotalAllowance) || 0;
        const deduction = Number(form.LoanRegistrationTotalDeduction) || 0;
        setForm(prev => ({ ...prev, LoanRegistrationTotalIncome: net + allowance - deduction }));
    }, [form.LoanRegistrationNetIncome, form.LoanRegistrationTotalAllowance, form.LoanRegistrationTotalDeduction]);

    /* ── derived ── */
    const memberDeposits = useMemo(() =>
        selectedAccounts
            .filter(a => a.ProductType === "Savings" && a.ProductDescription === "DEPOSITS" && Number(a.AccountBalance) > 0)
            .reduce((s, a) => s + Number(a.AccountBalance || 0), 0),
        [selectedAccounts]
    );

    const qualifyingAmount = useMemo(() =>
        (memberDeposits + (Number(form.Reference) || 0)) * 4,
        [memberDeposits, form.Reference]
    );

    const totalBookBalance = useMemo(() =>
        selectedAccounts.filter(a => a.ProductType === "Loan").reduce((s, a) => s + Number(a.AccountBalance || 0), 0),
        [selectedAccounts]
    );

    const remainingEligibleAmount = useMemo(() => Math.max(qualifyingAmount - totalBookBalance, 0), [qualifyingAmount, totalBookBalance]);

    const totalGuaranteedAmount = useMemo(() =>
        guarantors.reduce((s, g) => s + (Number(g.AmountGuaranteed) || 0), 0),
        [guarantors]
    );

    const updateGuarantor = (index, key, value) => {
        const copy = [...guarantors];
        copy[index][key] = value;
        setGuarantors(copy);
    };

    const addGuarantor = () => setGuarantors(prev => [...prev, emptyGuarantor()]);

    const removeGuarantor = (index) => {
        const min = form.LoanRegistrationMinimumGuarantors || 0;
        if (guarantors.length <= min) {
            Swal.fire("Not Allowed", `Minimum ${min} guarantor(s) required`, "warning");
            return;
        }
        setGuarantors(prev => prev.filter((_, i) => i !== index));
    };

    /* ── submit ── */
    const handleSubmit = async () => {
        if (guarantors.length < (form.LoanRegistrationMinimumGuarantors || 0)) {
            Swal.fire("Validation Error", `At least ${form.LoanRegistrationMinimumGuarantors} guarantor(s) required`, "error");
            return;
        }

        if (totalGuaranteedAmount > Number(form.AmountApplied)) {
            Swal.fire("Validation Error", "Total guaranteed amount cannot exceed the amount applied", "error");
            return;
        }

        // Build exact payload shape the API expects
        const payload = {
            Id: loan.Id,
            ParentId: form.parentId || null,
            BranchId: loan.BranchId,
            CustomerId: form.CustomerId,
            CustomerPersonalIdentificationNumber: form.CustomerPersonalIdentificationNumber,
            CustomerIndividualIdentityCardNumber: form.CustomerIndividualIdentityCardNumber,
            CustomerIndividualPayrollNumbers: form.CustomerIndividualPayrollNumbers,
            CustomerAddressMobileLine: form.CustomerAddressMobileLine,
            CustomerAddressEmail: form.CustomerAddressEmail,
            LoanProductId: form.LoanProductId,
            LoanProductDescription: form.LoanProductDescription,
            LoanPurposeId: form.LoanPurposeId || null,
            LoanPurposeDescription: form.LoanPurposeDescription,
            SavingsProductId: loan.SavingsProductId ?? null,
            RegistrationRemarkId: loan.RegistrationRemarkId ?? "00000000-0000-0000-0000-000000000000",
            Remarks: form.Remarks,
            AmountApplied: Number(form.AmountApplied),
            ReceivedDate: form.receivedDate ? `${form.receivedDate}T00:00:00` : loan.ReceivedDate,
            Reference: form.Reference ?? "",
            IsBatched: form.IsBatched ?? false,
            LoanRegistrationTermInMonths: Number(form.LoanRegistrationTermInMonths),
            LoanInterestAnnualPercentageRate: Number(form.LoanInterestAnnualPercentageRate),
            LoanInterestChargeMode: loan.LoanInterestChargeMode ?? 0,
            LoanInterestRecoveryMode: loan.LoanInterestRecoveryMode ?? 0,
            LoanInterestCalculationMode: loan.LoanInterestCalculationMode ?? 0,
            LoanRegistrationMinimumAmount: loan.LoanRegistrationMinimumAmount ?? 0,
            LoanRegistrationMaximumAmount: loan.LoanRegistrationMaximumAmount ?? 0,
            LoanRegistrationMinimumInterestAmount: loan.LoanRegistrationMinimumInterestAmount ?? 0,
            LoanRegistrationLoanProductSection: loan.LoanRegistrationLoanProductSection ?? 0,
            LoanRegistrationLoanProductCategory: loan.LoanRegistrationLoanProductCategory ?? 0,
            LoanRegistrationConsecutiveIncome: loan.LoanRegistrationConsecutiveIncome ?? 0,
            LoanRegistrationInvestmentsMultiplier: loan.LoanRegistrationInvestmentsMultiplier ?? 0,
            LoanRegistrationMinimumGuarantors: loan.LoanRegistrationMinimumGuarantors ?? 0,
            LoanRegistrationMaximumGuarantees: loan.LoanRegistrationMaximumGuarantees ?? 0,
            LoanRegistrationRejectIfMemberHasBalance: loan.LoanRegistrationRejectIfMemberHasBalance ?? false,
            LoanRegistrationSecurityRequired: loan.LoanRegistrationSecurityRequired ?? false,
            LoanRegistrationAllowSelfGuarantee: loan.LoanRegistrationAllowSelfGuarantee ?? false,
            LoanRegistrationGracePeriod: loan.LoanRegistrationGracePeriod ?? 0,
            LoanRegistrationMinimumMembershipPeriod: loan.LoanRegistrationMinimumMembershipPeriod ?? 0,
            LoanRegistrationPaymentFrequencyPerYear: loan.LoanRegistrationPaymentFrequencyPerYear ?? 0,
            LoanRegistrationPaymentDueDate: loan.LoanRegistrationPaymentDueDate ?? 0,
            LoanRegistrationPayoutRecoveryMode: loan.LoanRegistrationPayoutRecoveryMode ?? 0,
            LoanRegistrationPayoutRecoveryPercentage: loan.LoanRegistrationPayoutRecoveryPercentage ?? 0,
            LoanRegistrationAggregateCheckOffRecoveryMode: loan.LoanRegistrationAggregateCheckOffRecoveryMode ?? 0,
            LoanRegistrationChargeClearanceFee: loan.LoanRegistrationChargeClearanceFee ?? false,
            LoanRegistrationMicrocredit: loan.LoanRegistrationMicrocredit ?? false,
            LoanRegistrationStandingOrderTrigger: loan.LoanRegistrationStandingOrderTrigger ?? 0,
            LoanRegistrationTrackArrears: loan.LoanRegistrationTrackArrears ?? false,
            LoanRegistrationChargeArrearsFee: loan.LoanRegistrationChargeArrearsFee ?? false,
            LoanRegistrationEnforceSystemAppraisalRecommendation: loan.LoanRegistrationEnforceSystemAppraisalRecommendation ?? false,
            LoanRegistrationBypassAudit: loan.LoanRegistrationBypassAudit ?? false,
            LoanRegistrationMaximumSelfGuaranteeEligiblePercentage: loan.LoanRegistrationMaximumSelfGuaranteeEligiblePercentage ?? 0,
            LoanRegistrationGuarantorSecurityMode: loan.LoanRegistrationGuarantorSecurityMode ?? 0,
            LoanRegistrationRoundingType: loan.LoanRegistrationRoundingType ?? 0,
            LoanRegistrationDisburseMicroLoanLessDeductions: loan.LoanRegistrationDisburseMicroLoanLessDeductions ?? false,
            LoanRegistrationExcludeOutstandingLoansOnMaximumEntitlement: loan.LoanRegistrationExcludeOutstandingLoansOnMaximumEntitlement ?? false,
            LoanRegistrationConsiderInvestmentsBalanceForIncomeBasedLoanAppraisal: loan.LoanRegistrationConsiderInvestmentsBalanceForIncomeBasedLoanAppraisal ?? false,
            LoanRegistrationThrottleScheduledArrearsRecovery: loan.LoanRegistrationThrottleScheduledArrearsRecovery ?? false,
            LoanRegistrationCreateStandingOrderOnLoanAudit: loan.LoanRegistrationCreateStandingOrderOnLoanAudit ?? false,
            MaximumAmountPercentage: loan.MaximumAmountPercentage ?? 0,
            TakeHomeType: loan.TakeHomeType ?? 0,
            TakeHomePercentage: loan.TakeHomePercentage ?? 0,
            TakeHomeFixedAmount: loan.TakeHomeFixedAmount ?? 0,
            LoanProductInvestmentsBalance: loan.LoanProductInvestmentsBalance ?? 0,
            LoanProductLoanBalance: loan.LoanProductLoanBalance ?? 0,
            TotalLoansBalance: loan.TotalLoansBalance ?? 0,
            LoanProductLatestIncome: loan.LoanProductLatestIncome ?? 0,
            LoanRegistrationNetIncome: Number(form.LoanRegistrationNetIncome) ?? 0,
            LoanRegistrationTotalAllowance: Number(form.LoanRegistrationTotalAllowance) ?? 0,
            LoanRegistrationTotalDeduction: Number(form.LoanRegistrationTotalDeduction) ?? 0,
            LoanRegistrationTotalIncome: Number(form.LoanRegistrationTotalIncome) ?? 0,
            SectorCode: form.SectorCode ?? "",
            SubSectorCode: form.SubSectorCode ?? "",
            Guarantors: guarantors.map(g => ({
                CustomerId: g.CustomerId,
                AmountGuaranteed: Number(g.AmountGuaranteed) || 0,
                Remarks: g.Remarks ?? "",
                FullName: g.FullName ?? "",
                IndividualIdentityCardNumber: g.IndividualIdentityCardNumber ?? "",
                IndividualPayrollNumbers: g.IndividualPayrollNumbers ?? "",
                AddressMobileLine: g.AddressMobileLine ?? "",
                AddressEmail: g.AddressEmail ?? "",
                MemberDeposits: Number(g.MemberDeposits) || 0,
            })),
        };

        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_LOANING_URL}/api/Loaning/UpdateLoanCase`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );
            const data = await res.json();

            if (data.Success || data.success) {
                Swal.fire({ icon: "success", title: "Updated", text: data.Message || "Loan case updated successfully.", timer: 2000, showConfirmButton: false });
                onSuccess?.();
                onClose();
            } else {
                Swal.fire("Error", data.Message || data.message || "Update failed", "error");
            }
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    if (!loan) return null;

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* BACKDROP */}
                    <motion.div
                        className="fixed inset-0 bg-black z-40"
                        initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* DRAWER */}
                    <motion.div
                        className="fixed top-3 right-3 w-[90vw] max-w-[1100px] bg-white shadow-2xl z-50 rounded-2xl flex flex-col"
                        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        {/* HEADER */}
                        <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
                            <div>
                                <h2 className="font-bold text-xl text-white">Update Loan Application</h2>
                                <p className="text-indigo-200 text-xs mt-0.5">
                                    Case #{String(loan.CaseNumber).padStart(7, "0")} · {form.CustomerFullName}
                                </p>
                            </div>
                            <Button variant="outline" onClick={onClose} className="text-white border-white hover:bg-indigo-600">
                                Close
                            </Button>
                        </div>

                        {/* CONTENT */}
                        <div className="p-6 overflow-y-auto h-[88vh]">
                            <div className="bg-gray-200 rounded-lg p-3 space-y-6">

                                {/* APPLICANT DETAILS */}
                                <Card className="p-4">
                                    <h3 className="font-semibold mb-4">Applicant Details</h3>
                                    <div className="mb-4">
                                        <Label>Select Customer</Label>
                                        <div className="flex gap-2">
                                            <Input value={form.CustomerFullName} readOnly placeholder="Customer" />
                                            <Button type="button" onClick={() => setCustomerModalOpen(true)}>Select</Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Input placeholder="Full Name" value={form.CustomerFullName} readOnly />
                                        <Input placeholder="ID Number" value={form.CustomerIndividualIdentityCardNumber} readOnly />
                                        <Input placeholder="Payroll Number" value={form.CustomerIndividualPayrollNumbers} readOnly />
                                        <Input placeholder="KRA PIN" value={form.CustomerPersonalIdentificationNumber} readOnly />
                                        <Input placeholder="Mobile" value={form.CustomerAddressMobileLine} readOnly />
                                        <Input placeholder="Email" value={form.CustomerAddressEmail} readOnly />
                                    </div>
                                </Card>

                                {/* ACCOUNTS SUMMARY */}
                                {selectedAccounts.length > 0 && (
                                    <Card className="p-4">
                                        <div className="flex justify-between items-center bg-indigo-600 text-white rounded-md px-5 py-3 mb-4">
                                            <h3 className="font-semibold">Member Accounts & Balances</h3>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto bg-gray-200 p-3 rounded-lg space-y-2">
                                            {selectedAccounts
                                                .filter(a => {
                                                    const d = (a.ProductDescription || "").toLowerCase();
                                                    if (d.includes("entrance") || d.includes("share capital") || d.includes("benevolent") || d.includes("benovelent")) return false;
                                                    if (a.ProductType === "Loan" && !(Number(a.AccountBalance) > 0)) return false;
                                                    return true;
                                                })
                                                .map(a => (
                                                    <div key={a.Id} className="border rounded-lg p-3 flex justify-between bg-gray-50 text-sm">
                                                        <p className="text-gray-500">{a.ProductDescription} · {a.ProductType}</p>
                                                        <p className={a.ProductType === "Loan" ? "text-red-700 font-semibold" : "text-green-700 font-semibold"}>
                                                            {Number(a.AccountBalance || 0).toLocaleString()}
                                                        </p>
                                                    </div>
                                                ))}
                                        </div>
                                    </Card>
                                )}

                                {/* LOAN DETAILS */}
                                <Card className="p-4">
                                    <div className="flex justify-between items-center bg-indigo-600 text-white rounded-md px-3 py-2 mb-4">
                                        <h3 className="font-semibold px-2">Loan Details</h3>
                                        <div className="flex gap-3 text-sm">
                                            <div className="bg-indigo-700 px-3 py-2 rounded-lg flex items-center gap-2">
                                                Qualifying Amount
                                                <span className="bg-indigo-500 px-3 py-1 rounded-md">{qualifyingAmount.toLocaleString()}</span>
                                            </div>
                                            <div className="bg-red-700 px-3 py-2 rounded-lg flex items-center gap-2">
                                                Loan Book
                                                <span className="bg-red-500 px-3 py-1 rounded-md">{totalBookBalance.toLocaleString()}</span>
                                            </div>
                                            <div className="bg-green-700 px-3 py-2 rounded-lg flex items-center gap-2">
                                                Remaining
                                                <span className="bg-green-500 px-3 py-1 rounded-md">{remainingEligibleAmount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-4">
                                            <Label>Select Loan Product</Label>
                                            <div className="flex gap-2">
                                                <Input value={form.LoanProductDescription} readOnly placeholder="Loan product" />
                                                <Button type="button" onClick={() => setLoanProductModalOpen(true)}>Select</Button>
                                            </div>
                                        </div>

                                        <div>
                                            <Label>Purpose</Label>
                                            <Input value={form.LoanPurposeDescription} onChange={e => update("LoanPurposeDescription", e.target.value)} />
                                        </div>

                                        <div>
                                            <Label>
                                                Amount Applied
                                                {form.LoanRegistrationMaximumAmount > 0 && (
                                                    <span className="ml-1 text-xs text-gray-500 font-normal">max {Number(form.LoanRegistrationMaximumAmount).toLocaleString()}</span>
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
                                                        Swal.fire("Amount Exceeded", `Cannot exceed maximum of ${Number(form.LoanRegistrationMaximumAmount).toLocaleString()}`, "warning");
                                                        return;
                                                    }
                                                    update("AmountApplied", val);
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <Label>
                                                Loan Term (Months)
                                                {maxTermMonths > 0 && <span className="ml-1 text-xs text-gray-500 font-normal">max {maxTermMonths}</span>}
                                            </Label>
                                            <Input
                                                type="number"
                                                value={form.LoanRegistrationTermInMonths}
                                                onChange={e => {
                                                    const val = Number(e.target.value);
                                                    if (maxTermMonths > 0 && val > maxTermMonths) {
                                                        Swal.fire("Term Exceeded", `Cannot exceed ${maxTermMonths} months`, "warning");
                                                        return;
                                                    }
                                                    update("LoanRegistrationTermInMonths", val);
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <Label>Interest Rate (%)</Label>
                                            <Input type="number" disabled value={form.LoanInterestAnnualPercentageRate} />
                                        </div>

                                        <div>
                                            <Label>Loan Category</Label>
                                            <Input disabled value={form.LoanRegistrationLoanProductCategoryDescription} />
                                        </div>

                                        <div>
                                            <Label>Maximum Amount</Label>
                                            <Input type="number" disabled value={form.LoanRegistrationMaximumAmount} />
                                        </div>

                                        <div>
                                            <Label>Investments Multiplier</Label>
                                            <Input type="number" disabled value={form.LoanRegistrationInvestmentsMultiplier} />
                                        </div>

                                        <div>
                                            <Label>Standing Order Trigger</Label>
                                            <Input disabled value={form.LoanRegistrationStandingOrderTriggerDescription} />
                                        </div>

                                        <div>
                                            <Label>Min Guarantors</Label>
                                            <Input type="number" disabled value={form.LoanRegistrationMinimumGuarantors} />
                                        </div>

                                        <div>
                                            <Label>Max Guarantees</Label>
                                            <Input type="number" disabled value={form.LoanRegistrationMaximumGuarantees} />
                                        </div>

                                        <div>
                                            <Label>Allow Self Guarantee</Label>
                                            <Input readOnly value={form.LoanRegistrationAllowSelfGuarantee ? "Yes" : "No"} />
                                        </div>

                                        <div>
                                            <Label>Application Date</Label>
                                            <Input type="date" value={form.receivedDate} onChange={e => update("receivedDate", e.target.value)} />
                                        </div>
                                    </div>

                                    {/* Boosted + Refinance */}
                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={boosted}
                                                onChange={e => {
                                                    const v = e.target.checked;
                                                    setBoosted(v);
                                                    setForm(prev => ({
                                                        ...prev,
                                                        IsBatched: !v,
                                                        Remarks: v
                                                            ? (prev.Remarks ? `${prev.Remarks} - boosted` : "boosted")
                                                            : prev.Remarks.replace(/\s?-?\s?boosted/i, "").trim(),
                                                    }));
                                                }}
                                            />
                                            <Label>Is Boosted Loan?</Label>
                                        </div>

                                        {boosted && (
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <Label>Reference Amount</Label>
                                                    <Input
                                                        type="number"
                                                        value={form.Reference}
                                                        onChange={e => {
                                                            const val = Number(e.target.value);
                                                            if (form.AmountApplied > 0 && val > Number(form.AmountApplied)) {
                                                                Swal.fire("Amount Exceeded", `Boost cannot exceed amount applied (${Number(form.AmountApplied).toLocaleString()})`, "warning");
                                                                return;
                                                            }
                                                            update("Reference", e.target.value);
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Remarks</Label>
                                                    <Input value={form.Remarks} readOnly />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={hasOffset}
                                                onChange={e => {
                                                    const v = e.target.checked;
                                                    setHasOffset(v);
                                                    if (!v) { setSelectedParentLoan(null); update("parentId", ""); }
                                                }}
                                            />
                                            <Label>Loan Refinance</Label>
                                        </div>

                                        {hasOffset && (
                                            <div className="flex gap-2">
                                                <Input value={selectedParentLoan?.LoanProductDescription || ""} placeholder="Select Loan to Offset" readOnly />
                                                <Button type="button" onClick={() => setParentLoanModalOpen(true)}>Select</Button>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* LOAN SECTOR */}
                                <Card className="p-4">
                                    <h3 className="font-semibold mb-4">Loan Sector</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Loan Sector</Label>
                                            <select
                                                className="w-full border rounded-md p-2"
                                                value={form.SectorCode}
                                                onChange={e => { update("SectorCode", e.target.value); update("SubSectorCode", ""); }}
                                            >
                                                <option value="">Select Sector</option>
                                                {loanSectors.map(s => (
                                                    <option key={s.Id} value={s.SectorCode}>{s.SectorCode} - {s.SectorName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Loan Sub Sector</Label>
                                            <select
                                                className="w-full border rounded-md p-2"
                                                value={form.SubSectorCode}
                                                onChange={e => update("SubSectorCode", e.target.value)}
                                                disabled={!form.SectorCode}
                                            >
                                                <option value="">Select Sub Sector</option>
                                                {filteredSubSectors.map(s => (
                                                    <option key={s.Id} value={s.SubSectorCode}>{s.SubSectorCode} - {s.SubSectorName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </Card>

                                {/* GUARANTORS */}
                                <Card className="p-4">
                                    <div className="flex justify-between items-center bg-indigo-600 text-white rounded-md px-5 py-3 mb-4">
                                        <h3 className="font-semibold">Guarantors</h3>
                                        <span className="text-sm text-gray-100">
                                            Guaranteed: <b>{totalGuaranteedAmount.toLocaleString()}</b> / {Number(form.AmountApplied).toLocaleString()}
                                        </span>
                                    </div>

                                    {guarantors.map((g, i) => (
                                        <div key={i} className="border rounded-lg p-4 mb-4">
                                            <div className="flex justify-between mb-2">
                                                <h4 className="font-medium">Guarantor {i + 1}</h4>
                                                {guarantors.length > (form.LoanRegistrationMinimumGuarantors || 0) && (
                                                    <Button size="sm" className="bg-red-600 text-white" onClick={() => removeGuarantor(i)}>Remove</Button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="md:col-span-3">
                                                    <Label>Select Guarantor</Label>
                                                    <div className="flex gap-2">
                                                        <Input placeholder="Guarantor" value={g.FullName} readOnly />
                                                        <Button type="button" onClick={() => setGuarantorModalIndex(i)}>Select</Button>
                                                    </div>
                                                </div>
                                                <div><Label>Full Name</Label><Input value={g.FullName} readOnly /></div>
                                                <div><Label>ID Number</Label><Input value={g.IndividualIdentityCardNumber} readOnly /></div>
                                                <div><Label>Payroll Number</Label><Input value={g.IndividualPayrollNumbers} readOnly /></div>
                                                <div><Label>Mobile</Label><Input value={g.AddressMobileLine} readOnly /></div>
                                                <div><Label>Email</Label><Input value={g.AddressEmail} readOnly /></div>
                                                <div>
                                                    <Label>Amount Guaranteed</Label>
                                                    <Input
                                                        inputMode="numeric"
                                                        value={g.AmountGuaranteed ? Number(g.AmountGuaranteed).toLocaleString() : ""}
                                                        onChange={e => {
                                                            const raw = e.target.value.replace(/,/g, "");
                                                            if (!/^\d*$/.test(raw)) return;
                                                            const val = raw === "" ? 0 : Number(raw);
                                                            const otherTotal = guarantors.reduce((s, gg, idx) => idx === i ? s : s + (Number(gg.AmountGuaranteed) || 0), 0);
                                                            if (otherTotal + val > Number(form.AmountApplied)) {
                                                                Swal.fire("Amount Exceeded", "Total guaranteed cannot exceed Amount Applied", "warning");
                                                                return;
                                                            }
                                                            updateGuarantor(i, "AmountGuaranteed", val);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <Button variant="outline" onClick={addGuarantor}>+ Add Guarantor</Button>
                                </Card>
                            </div>

                            {/* ACTIONS */}
                            <div className="flex justify-end mt-6">
                                <Button onClick={handleSubmit} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
                                    {loading ? "Updating..." : "Update Loan Application"}
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* MODALS */}
                    <CustomerSelectModal
                        open={customerModalOpen}
                        onClose={() => setCustomerModalOpen(false)}
                        customers={customers}
                        onSelect={(member) => {
                            const c = member.Customer;
                            setSelectedAccounts(member.Accounts || []);
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
                            setSelectedParentLoan(null);
                            update("parentId", "");
                        }}
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
                            setGuarantors(Array.from({ length: min }, emptyGuarantor));
                        }}
                    />

                    <GuarantorSelectModal
                        open={guarantorModalIndex !== null}
                        onClose={() => setGuarantorModalIndex(null)}
                        customers={customers}
                        applicantId={form.CustomerId}
                        allowSelfGuarantee={form.LoanRegistrationAllowSelfGuarantee}
                        selectedGuarantorIds={guarantors.map(g => g.CustomerId).filter(Boolean)}
                        onSelect={(member, deposits) => {
                            const c = member.Customer;
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
                                    MemberDeposits: deposits || 0,
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
                        onSelect={(loanItem) => {
                            setSelectedParentLoan(loanItem);
                            setForm(prev => ({ ...prev, parentId: loanItem.Id }));
                            setParentLoanModalOpen(false);
                        }}
                    />
                </>
            )}
        </AnimatePresence>
    );
}
