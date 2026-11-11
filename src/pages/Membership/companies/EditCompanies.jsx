import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Swal from "sweetalert2";

export default function EditCompanies({ open, onClose, data, refresh }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({});

    // Auto-fill form with selected row data

    const normalizeCompany = (data) => ({
        id: data.Id,
        description: data.Description,
        vision: data.Vision,
        mission: data.Mission,
        motto: data.Motto,
        registrationNumber: data.RegistrationNumber,
        personalIdentificationNumber: data.PersonalIdentificationNumber,
        applicationDisplayName: data.ApplicationDisplayName,
        recoveryPriority: data.RecoveryPriority,

        addressAddressLine1: data.AddressAddressLine1,
        addressAddressLine2: data.AddressAddressLine2,
        addressStreet: data.AddressStreet,
        addressPostalCode: data.AddressPostalCode,
        addressCity: data.AddressCity,
        addressEmail: data.AddressEmail,
        addressLandLine: data.AddressLandLine,
        addressMobileLine: data.AddressMobileLine,

        transactionReceiptTopIndentation: data.TransactionReceiptTopIndentation,
        transactionReceiptLeftIndentation: data.TransactionReceiptLeftIndentation,
        transactionReceiptFooter: data.TransactionReceiptFooter,

        fingerprintBiometricThreshold: data.FingerprintBiometricThreshold,
        membershipTerminationNoticePeriod: data.MembershipTerminationNoticePeriod,
        timeDurationStartTime: data.TimeDurationStartTime,
        timeDurationEndTime: data.TimeDurationEndTime,

        applicationMembershipTextAlertsEnabled: data.ApplicationMembershipTextAlertsEnabled,
        enforceCustomerAccountMakerChecker: data.EnforceCustomerAccountMakerChecker,

        bypassJournalVoucherAudit: data.BypassJournalVoucherAudit,
        bypassCreditBatchAudit: data.BypassCreditBatchAudit,
        bypassDebitBatchAudit: data.BypassDebitBatchAudit,
        bypassRefundBatchAudit: data.BypassRefundBatchAudit,
        bypassWireTransferBatchAudit: data.BypassWireTransferBatchAudit,
        bypassLoanDisbursementBatchAudit: data.BypassLoanDisbursementBatchAudit,
        bypassJournalReversalBatchAudit: data.BypassJournalReversalBatchAudit,
        bypassInterAccountTransferBatchAudit: data.BypassInterAccountTransferBatchAudit,
        bypassExpensePayableAudit: data.BypassExpensePayableAudit,
        bypassGeneralLedgerAudit: data.BypassGeneralLedgerAudit,

        excludeChargesInTransactionReceipt: data.ExcludeChargesInTransactionReceipt,
        excludeChequeMaturityDateInTransactionReceipt: data.ExcludeChequeMaturityDateInTransactionReceipt,

        trackGuarantorCommittedInvestments: data.TrackGuarantorCommittedInvestments,
        transferNetRefundableAmountToSavingsAccountOnDeathClaimSettlement:
            data.TransferNetRefundableAmountToSavingsAccountOnDeathClaimSettlement,

        receiveLoanRequestBeforeLoanRegistration: data.ReceiveLoanRequestBeforeLoanRegistration,
        localizeOnlineNotifications: data.LocalizeOnlineNotifications,

        isWithholdingTaxAgent: data.IsWithholdingTaxAgent,
        enforceBudgetControl: data.EnforceBudgetControl,
        isFileTrackingEnforced: data.IsFileTrackingEnforced,
        excludeCustomerAccountBalanceInTransactionReceipt:
            data.ExcludeCustomerAccountBalanceInTransactionReceipt,

        enforceFixedDepositBands: data.EnforceFixedDepositBands,
        enforceBiometricsForCashWithdrawal: data.EnforceBiometricsForCashWithdrawal,
        enforceTwoFactorAuthentication: data.EnforceTwoFactorAuthentication,

        recoverArrearsOnCashDeposit: data.RecoverArrearsOnCashDeposit,
        recoverArrearsOnExternalChequeClearance: data.RecoverArrearsOnExternalChequeClearance,
        recoverArrearsOnFixedDepositPayment: data.RecoverArrearsOnFixedDepositPayment,

        allowDebitBatchToOverdrawAccount: data.AllowDebitBatchToOverdrawAccount,
        enforceSystemLock: data.EnforceSystemLock,
        enforceTellerLimits: data.EnforceTellerLimits,
        enforceTellerCashTransferAcknowledgement: data.EnforceTellerCashTransferAcknowledgement,
        enforceSingleUserSession: data.EnforceSingleUserSession,

        customerMembershipTextAlertsEnabled: data.CustomerMembershipTextAlertsEnabled,
        enforceInvestmentProductExemptions: data.EnforceInvestmentProductExemptions,
        enforceMobileToBankReconciliationVerification:
            data.EnforceMobileToBankReconciliationVerification,

        isLocked: data.IsLocked,
        createdBy: data.CreatedBy,
        createdDate: data.CreatedDate,
    });

    useEffect(() => {
        if (data) {
            const camel = normalizeCompany(data);
            setForm(camel);
        }
    }, [data]);




    const update = (key, value) => {
        setForm({ ...form, [key]: value });
    };

    const next = () => setStep((s) => s + 1);
    const back = () => setStep((s) => s - 1);

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/companies/${form.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(form),
                }
            );

            if (!response.ok) throw new Error("Failed to update company");

            Swal.fire("Updated!", "Company updated successfully", "success");

            refresh();
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
                    {/* BACKDROP */}
                    <motion.div
                        className="fixed inset-0 bg-black z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* DRAWER */}
                    <motion.div
                        className="fixed top-3 right-3 w-[85vw] max-w-[1150px] bg-white shadow-2xl 
              z-50 flex flex-col rounded-2xl"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 280, damping: 28 }}
                    >
                        {/* HEADER */}
                        <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
                            <h2 className="font-bold text-xl text-white">Edit Company</h2>
                            <Button variant="outline" size="sm" onClick={onClose}>
                                Close
                            </Button>
                        </div>

                        <div className="grid grid-cols-12 h-[78vh] overflow-hidden p-3 bg-gray-300 rounded-2xl m-2">
                            {/* SIDE NAV */}
                            <aside className="col-span-3 bg-gray-300 p-3 rounded-lg">
                                {[
                                    "Company Profile",
                                    "Address Information",
                                    "Receipt Settings",
                                    "System Enforcements",
                                    "Security Settings",
                                ].map((label, index) => (
                                    <Card
                                        key={index}
                                        className={`p-3 mb-2 cursor-pointer border 
                      ${step === index + 1
                                                ? "bg-indigo-700 border-indigo-500 text-white"
                                                : "hover:bg-gray-100"
                                            }`}
                                        onClick={() => setStep(index + 1)}
                                    >
                                        <p className="font-medium text-sm">{label}</p>
                                    </Card>
                                ))}
                            </aside>

                            {/* MAIN CONTENT */}
                            <main className="col-span-9 px-6 pb-6 pt-6 overflow-y-auto bg-gray-50 mx-1 rounded-xl">
                                {/* STEP 1 – PROFILE */}
                                {step === 1 && (
                                    <section>
                                        <h3 className="text-lg font-semibold mb-3 bg-indigo-700 text-white p-3 rounded-2xl">
                                            Company Profile
                                        </h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                ["description", "Description"],
                                                ["vision", "Vision"],
                                                ["mission", "Mission"],
                                                ["motto", "Motto"],
                                                ["registrationNumber", "Registration Number"],
                                                ["personalIdentificationNumber", "PIN"],
                                                ["applicationDisplayName", "App Display Name"],
                                                ["recoveryPriority", "Recovery Priority"],
                                            ].map(([key, label]) => (
                                                <div key={key}>
                                                    <Label>{label}</Label>
                                                    <Input
                                                        value={form[key] || ""}
                                                        onChange={(e) => update(key, e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* STEP 2 – ADDRESS */}
                                {step === 2 && (
                                    <section>
                                        <h3 className="text-lg font-semibold mb-3 bg-indigo-700 text-white p-3 rounded-2xl">
                                            Address Information
                                        </h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                ["addressAddressLine1", "Address Line 1"],
                                                ["addressAddressLine2", "Address Line 2"],
                                                ["addressStreet", "Street"],
                                                ["addressPostalCode", "Postal Code"],
                                                ["addressCity", "City"],
                                                ["addressEmail", "Email"],
                                                ["addressLandLine", "Landline"],
                                                ["addressMobileLine", "Mobile"],
                                            ].map(([key, label]) => (
                                                <div key={key}>
                                                    <Label>{label}</Label>
                                                    <Input
                                                        value={form[key] || ""}
                                                        onChange={(e) => update(key, e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* STEP 3 – RECEIPT SETTINGS */}
                                {step === 3 && (
                                    <section>
                                        <h3 className="text-lg font-semibold mb-3 bg-indigo-700 text-white p-3 rounded-2xl">
                                            Receipt Settings
                                        </h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Top Indentation</Label>
                                                <Input
                                                    type="number"
                                                    value={
                                                        form.transactionReceiptTopIndentation || 0
                                                    }
                                                    onChange={(e) =>
                                                        update(
                                                            "transactionReceiptTopIndentation",
                                                            Number(e.target.value)
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label>Left Indentation</Label>
                                                <Input
                                                    type="number"
                                                    value={
                                                        form.transactionReceiptLeftIndentation || 0
                                                    }
                                                    onChange={(e) =>
                                                        update(
                                                            "transactionReceiptLeftIndentation",
                                                            Number(e.target.value)
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Label>Receipt Footer</Label>
                                                <Input
                                                    value={form.transactionReceiptFooter || ""}
                                                    onChange={(e) =>
                                                        update(
                                                            "transactionReceiptFooter",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </section>
                                )}

                                {/* STEP 4 – SYSTEM ENFORCEMENTS */}
                                {step === 4 && (
                                    <section>
                                        <h3 className="text-lg font-semibold mb-3 bg-indigo-700 text-white p-3 rounded-2xl">
                                            System Enforcements
                                        </h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                "enforceBudgetControl",
                                                "trackGuarantorCommittedInvestments",
                                                "receiveLoanRequestBeforeLoanRegistration",
                                                "localizeOnlineNotifications",
                                                "enforceFixedDepositBands",
                                                "recoverArrearsOnCashDeposit",
                                            ].map((key) => (
                                                <div key={key} className="flex gap-2 items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={form[key] || false}
                                                        onChange={(e) =>
                                                            update(key, e.target.checked)
                                                        }
                                                    />
                                                    <Label className="capitalize">
                                                        {key.replace(/([A-Z])/g, " $1")}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* STEP 5 – SECURITY SETTINGS */}
                                {step === 5 && (
                                    <section>
                                        <h3 className="text-lg font-semibold mb-3 bg-indigo-700 text-white p-3 rounded-2xl">
                                            Security Settings
                                        </h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                "enforceBiometricsForCashWithdrawal",
                                                "enforceTwoFactorAuthentication",
                                                "enforceSystemLock",
                                                "enforceTellerLimits",
                                                "enforceSingleUserSession",
                                                "isWithholdingTaxAgent",
                                            ].map((key) => (
                                                <div key={key} className="flex gap-2 items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={form[key] || false}
                                                        onChange={(e) =>
                                                            update(key, e.target.checked)
                                                        }
                                                    />
                                                    <Label className="capitalize">
                                                        {key.replace(/([A-Z])/g, " $1")}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* NAVIGATION BUTTONS */}
                                <div className="flex justify-between mt-10">
                                    {step > 1 ? (
                                        <Button variant="outline" onClick={back}>
                                            Back
                                        </Button>
                                    ) : (
                                        <span></span>
                                    )}

                                    {step < 5 ? (
                                        <Button onClick={next}>Next</Button>
                                    ) : (
                                        <Button onClick={handleUpdate} disabled={loading}>
                                            {loading ? "Updating..." : "Update Company"}
                                        </Button>
                                    )}
                                </div>
                            </main>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
