
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Swal from "sweetalert2";

export default function AddCompanies({ open, onClose, refresh }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        description: "",
        vision: "",
        mission: "",
        motto: "",
        registrationNumber: "",
        personalIdentificationNumber: "",
        applicationDisplayName: "",
        recoveryPriority: "",
        addressAddressLine1: "",
        addressAddressLine2: "",
        addressStreet: "",
        addressPostalCode: "",
        addressCity: "",
        addressEmail: "",
        addressLandLine: "",
        addressMobileLine: "",
        transactionReceiptTopIndentation: 10,
        transactionReceiptLeftIndentation: 15,
        transactionReceiptFooter: "",
        fingerprintBiometricThreshold: 65,
        membershipTerminationNoticePeriod: 30,
        timeDurationStartTime: "",
        timeDurationEndTime: "",
        applicationMembershipTextAlertsEnabled: true,
        enforceCustomerAccountMakerChecker: true,
        bypassJournalVoucherAudit: false,
        bypassCreditBatchAudit: false,
        bypassDebitBatchAudit: false,
        bypassRefundBatchAudit: false,
        bypassWireTransferBatchAudit: false,
        bypassLoanDisbursementBatchAudit: false,
        bypassJournalReversalBatchAudit: false,
        bypassInterAccountTransferBatchAudit: false,
        bypassExpensePayableAudit: false,
        bypassGeneralLedgerAudit: false,
        excludeChargesInTransactionReceipt: false,
        excludeChequeMaturityDateInTransactionReceipt: false,
        trackGuarantorCommittedInvestments: true,
        transferNetRefundableAmountToSavingsAccountOnDeathClaimSettlement: true,
        receiveLoanRequestBeforeLoanRegistration: true,
        localizeOnlineNotifications: true,
        isWithholdingTaxAgent: true,
        enforceBudgetControl: true,
        isFileTrackingEnforced: true,
        excludeCustomerAccountBalanceInTransactionReceipt: false,
        enforceFixedDepositBands: true,
        enforceBiometricsForCashWithdrawal: true,
        enforceTwoFactorAuthentication: true,
        recoverArrearsOnCashDeposit: true,
        recoverArrearsOnExternalChequeClearance: true,
        recoverArrearsOnFixedDepositPayment: true,
        allowDebitBatchToOverdrawAccount: false,
        enforceSystemLock: true,
        enforceTellerLimits: true,
        enforceTellerCashTransferAcknowledgement: true,
        enforceSingleUserSession: true,
        customerMembershipTextAlertsEnabled: true,
        enforceInvestmentProductExemptions: true,
        enforceMobileToBankReconciliationVerification: true,
        isLocked: false,
        createdBy: "AdminUser"
    });

    const update = (key, value) => {
        setForm({ ...form, [key]: value });
    };

    const next = () => setStep((s) => s + 1);
    const back = () => setStep((s) => s - 1);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/companies`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",

                    },
                    body: JSON.stringify(form),
                }
            );

            if (!response.ok) throw new Error("Failed to add company");

            Swal.fire("Success!", "Company added successfully", "success");

            // Refresh table in parent
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
                            <h2 className="font-bold text-xl text-white">Add New Company</h2>
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

                            {/* RIGHT CONTENT */}
                            <main className="col-span-9 px-6 pb-6 pt-6 overflow-y-auto bg-gray-50 mx-1 rounded-xl">
                                {/* STEP 1 – COMPANY PROFILE */}
                                {step === 1 && (
                                    <section>
                                        <h3 className="text-lg font-semibold mb-3 bg-indigo-700 text-white p-3 rounded-2xl">Company Profile</h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Description</Label>
                                                <Input
                                                    value={form.description}
                                                    onChange={(e) => update("description", e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label>Vision</Label>
                                                <Input
                                                    value={form.vision}
                                                    onChange={(e) => update("vision", e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label>Mission</Label>
                                                <Input
                                                    value={form.mission}
                                                    onChange={(e) => update("mission", e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label>Motto</Label>
                                                <Input
                                                    value={form.motto}
                                                    onChange={(e) => update("motto", e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label>Registration Number</Label>
                                                <Input
                                                    value={form.registrationNumber}
                                                    onChange={(e) =>
                                                        update("registrationNumber", e.target.value)
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label>PIN</Label>
                                                <Input
                                                    value={form.personalIdentificationNumber}
                                                    onChange={(e) =>
                                                        update(
                                                            "personalIdentificationNumber",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label>App Display Name</Label>
                                                <Input
                                                    value={form.applicationDisplayName}
                                                    onChange={(e) =>
                                                        update("applicationDisplayName", e.target.value)
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label>Recovery Priority</Label>
                                                <Input
                                                    value={form.recoveryPriority}
                                                    onChange={(e) =>
                                                        update("recoveryPriority", e.target.value)
                                                    }
                                                />
                                            </div>
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
                                                        value={form[key]}
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
                                                    value={form.transactionReceiptTopIndentation}
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
                                                    value={form.transactionReceiptLeftIndentation}
                                                    onChange={(e) =>
                                                        update(
                                                            "transactionReceiptLeftIndentation",
                                                            Number(e.target.value)
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Label>Receipt Footer Text</Label>
                                                <Input
                                                    value={form.transactionReceiptFooter}
                                                    onChange={(e) =>
                                                        update("transactionReceiptFooter", e.target.value)
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
                                                "enforceFileTracking",
                                                "trackGuarantorCommittedInvestments",
                                                "receiveLoanRequestBeforeLoanRegistration",
                                                "localizeOnlineNotifications",
                                                "enforceFixedDepositBands",
                                                "recoverArrearsOnCashDeposit",
                                            ].map((key) => (
                                                <div key={key} className="flex gap-2 items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={form[key]}
                                                        onChange={(e) => update(key, e.target.checked)}
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
                                                        checked={form[key]}
                                                        onChange={(e) => update(key, e.target.checked)}
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
                                        <Button onClick={handleSubmit} disabled={loading}>
                                            {loading ? (
                                                <div className="flex items-center gap-2">
                                                    <svg
                                                        className="animate-spin h-5 w-5"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <circle
                                                            className="opacity-25"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                        />
                                                        <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                                        />
                                                    </svg>
                                                    Submitting...
                                                </div>
                                            ) : (
                                                "Submit"
                                            )}
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
