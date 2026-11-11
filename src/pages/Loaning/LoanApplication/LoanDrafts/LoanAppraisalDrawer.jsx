import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function LoanAppraisalDrawer({
    open,
    onClose,
    loanCaseId,
    loan,
    onSuccess,
}) {

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        loanAuditOption: "",
        AppraisalRemarks: "ok for appraisal",
        AppraisedAmount: 0,
        AppraisedAmountRemarks: "",
        AppraisedNetIncome: 0,
        AppraisedAbility: 0,
        AppraisedDate: new Date().toISOString().split("T")[0],

        LoanRegistrationMaximumEntitled: 0,
        LoanRegistrationNetIncome: 0,
        LoanRegistrationTotalAllowance: 0,
        LoanRegistrationTotalDeduction: 0,
        LoanRegistrationTotalIncome: 0,
        LoanRegistrationAbilityToPay: 0,
        LoanRegistrationAbilityToPayOverLoanTerm: 0,
        LoanRegistrationLoanPlusInterest: 0,

        TotalLoansBalance: 0,
        LoanProductInvestmentsBalance: 0,
        LoanProductTotalSharesInvestmentsBalance: 0,

        LoanAppraisalOptionDescription: "",
    });

    // Set initial values when loan data is loaded
    useEffect(() => {
        if (loan && open) {
            setForm(prev => ({
                ...prev,
                AppraisedAmount: loan.AmountApplied || 0,
            }));
        }
    }, [loan, open]);

    // Auto-calculate Appraised Ability using Net Take-Home Pay (1/3) * loan term
    useEffect(() => {
        const calculateAppraisedAbility = () => {
            // Use Net Take-Home Pay (Total Income after deductions)
            const netTakeHomePay = Number(form.LoanRegistrationTotalIncome || 0);
            const loanTerm = loan?.LoanRegistrationTermInMonths || 12;
            
            // Calculate 1/3 of Net Take-Home Pay * loan term
            const oneThirdOfNetPay = netTakeHomePay / 3;
            const salaryAppraisalAmount = oneThirdOfNetPay * loanTerm;
            
            // Get the proposed loan amount
            const proposedLoanAmount = Number(form.AppraisedAmount || 0);
            
            // Calculate ability percentage based on how much of the salary appraisal amount is being used
            let abilityPercentage = 0;
            if (proposedLoanAmount > 0 && salaryAppraisalAmount > 0) {
                abilityPercentage = (proposedLoanAmount / salaryAppraisalAmount) * 100;
                // Cap at 100%
                abilityPercentage = Math.min(abilityPercentage, 100);
            } else if (proposedLoanAmount === 0) {
                abilityPercentage = 0;
            } else if (salaryAppraisalAmount <= 0) {
                abilityPercentage = 100;
            }
            
            return Math.round(abilityPercentage);
        };
        
        const newAbility = calculateAppraisedAbility();
        if (newAbility !== form.AppraisedAbility) {
            setForm(prev => ({ ...prev, AppraisedAbility: newAbility }));
        }
    }, [form.LoanRegistrationTotalIncome, form.AppraisedAmount, loan]);

    const update = (key, value) => {
        setForm(prev => {
            const updated = {
                ...prev,
                [key]: key.startsWith("LoanRegistration") || (key.startsWith("Appraised") && key !== "AppraisedDate")
                    ? Number(value)
                    : value
            };

            // Recalculate Total Income if relevant fields change
            if (
                key === "LoanRegistrationNetIncome" ||
                key === "LoanRegistrationTotalAllowance" ||
                key === "LoanRegistrationTotalDeduction"
            ) {
                updated.LoanRegistrationTotalIncome =
                    (updated.LoanRegistrationNetIncome || 0) +
                    (updated.LoanRegistrationTotalAllowance || 0) -
                    (updated.LoanRegistrationTotalDeduction || 0);

                // Sync appraisal fields
                updated.AppraisedNetIncome = updated.LoanRegistrationNetIncome;
            }

            return updated;
        });
    };

    const payload = {
        Id: loanCaseId,
        loanAuditOption: Number(form.loanAuditOption),
        AppraisalRemarks: form.AppraisalRemarks,
        AppraisedAmount: Number(form.AppraisedAmount),
        AppraisedAmountRemarks: form.AppraisedAmountRemarks || null,
        AppraisedNetIncome: Number(form.AppraisedNetIncome),
        AppraisedAbility: Number(form.AppraisedAbility),
        AppraisedDate: form.AppraisedDate ? new Date(form.AppraisedDate) : null,
        LoanRegistrationMaximumEntitled: Number(form.LoanRegistrationMaximumEntitled),
        LoanRegistrationNetIncome: Number(form.LoanRegistrationNetIncome),
        LoanRegistrationTotalAllowance: Number(form.LoanRegistrationTotalAllowance),
        LoanRegistrationTotalDeduction: Number(form.LoanRegistrationTotalDeduction),
        LoanRegistrationTotalIncome: Number(form.LoanRegistrationTotalIncome),
        LoanRegistrationAbilityToPay: Number(form.LoanRegistrationAbilityToPay),
        LoanRegistrationAbilityToPayOverLoanTerm: Number(form.LoanRegistrationAbilityToPayOverLoanTerm),
        LoanRegistrationLoanPlusInterest: Number(form.LoanRegistrationLoanPlusInterest),
        TotalLoansBalance: Number(form.TotalLoansBalance),
        LoanProductInvestmentsBalance: Number(form.LoanProductInvestmentsBalance),
        LoanProductTotalSharesInvestmentsBalance: Number(form.LoanProductTotalSharesInvestmentsBalance),
        LoanAppraisalOptionDescription: form.LoanAppraisalOptionDescription,
    };

    // Calculate monthly repayment for a loan amount
    const calculateMonthlyRepayment = (loanAmount) => {
        const loanTerm = loan?.LoanRegistrationTermInMonths || 12;
        const interestRate = (loan?.LoanInterestAnnualPercentageRate || 12) / 100 / 12;
        
        if (loanAmount > 0 && loanTerm > 0) {
            if (interestRate > 0) {
                return loanAmount * interestRate * Math.pow(1 + interestRate, loanTerm) / (Math.pow(1 + interestRate, loanTerm) - 1);
            } else {
                return loanAmount / loanTerm;
            }
        }
        return 0;
    };

    // Calculate ability based on Net Take-Home Pay (1/3) * loan term
    const calculateSalaryAppraisal = () => {
        // Use Net Take-Home Pay (Total Income after deductions)
        const netTakeHomePay = Number(form.LoanRegistrationTotalIncome || 0);
        const loanTerm = loan?.LoanRegistrationTermInMonths || 12;
        const proposedLoanAmount = Number(form.AppraisedAmount || 0);
        
        // 1/3 of Net Take-Home Pay
        const oneThirdOfNetPay = netTakeHomePay / 3;
        // Salary Appraisal Amount = (Net Take-Home Pay ÷ 3) × Loan Term
        const salaryAppraisalAmount = oneThirdOfNetPay * loanTerm;
        
        // Calculate ability percentage
        let abilityPercentage = 0;
        if (proposedLoanAmount > 0 && salaryAppraisalAmount > 0) {
            abilityPercentage = (proposedLoanAmount / salaryAppraisalAmount) * 100;
            abilityPercentage = Math.min(abilityPercentage, 100);
        }
        
        return {
            netTakeHomePay,
            oneThirdOfNetPay,
            loanTerm,
            salaryAppraisalAmount,
            proposedLoanAmount,
            abilityPercentage: Math.round(abilityPercentage),
            isAffordable: proposedLoanAmount <= salaryAppraisalAmount,
            shortfall: Math.max(0, proposedLoanAmount - salaryAppraisalAmount)
        };
    };

    // 2/3 RULE CALCULATION (Kenyan Labor Law)
    const calculateTwoThirdRule = () => {
        const basicSalary = Number(form.LoanRegistrationNetIncome || 0);
        const allowance = Number(form.LoanRegistrationTotalAllowance || 0);
        const totalDeductions = Number(form.LoanRegistrationTotalDeduction || 0);
        const existingLoanDeductions = Number(form.TotalLoansBalance || 0);

        const grossSalary = basicSalary + allowance;
        const maxAllowedDeduction = (2 / 3) * grossSalary;
        const minimumTakeHome = (1 / 3) * grossSalary;
        
        const currentTotalDeductions = totalDeductions + existingLoanDeductions;
        const availableForNewLoan = Math.max(0, maxAllowedDeduction - currentTotalDeductions);
        
        const proposedLoanAmount = Number(form.AppraisedAmount || 0);
        const proposedMonthlyRepayment = calculateMonthlyRepayment(proposedLoanAmount);
        
        const totalWithNewLoan = currentTotalDeductions + proposedMonthlyRepayment;
        const isTwoThirdRuleBroken = totalWithNewLoan > maxAllowedDeduction;
        
        return {
            grossSalary,
            maxAllowedDeduction,
            minimumTakeHome,
            currentTotalDeductions,
            availableForNewLoan,
            proposedMonthlyRepayment,
            totalWithNewLoan,
            isTwoThirdRuleBroken,
            excessAmount: Math.max(0, totalWithNewLoan - maxAllowedDeduction)
        };
    };

    const handleSubmit = async () => {
        if (!form.loanAuditOption) {
            Swal.fire("Validation", "Please select an appraise option", "warning");
            return;
        }

        // Check ability rating based on Net Take-Home Pay (1/3) * loan term
        const salaryAppraisal = calculateSalaryAppraisal();
        
        if (form.AppraisedAmount > 0 && !salaryAppraisal.isAffordable) {
            const result = await Swal.fire({
                title: "⚠️ Loan Amount Exceeds Salary Appraisal",
                html: `
                    <div style="text-align: left;">
                        <h4 style="color: #e11d48; margin-bottom: 10px;">The proposed loan exceeds the member's salary appraisal amount</h4>
                        
                        <p><strong>Calculation Method:</strong></p>
                        <p style="margin-bottom: 15px; padding: 8px; background: #f3f4f6; border-radius: 5px;">
                            Salary Appraisal Amount = (Net Take-Home Pay ÷ 3) × Loan Term
                        </p>
                        
                        <p><strong>Member's Salary Appraisal Calculation:</strong></p>
                        <ul style="margin-bottom: 15px;">
                            <li>Net Take-Home Pay: <strong>KES ${salaryAppraisal.netTakeHomePay.toLocaleString()}</strong></li>
                            <li>One-Third of Net Pay: <strong>KES ${Math.round(salaryAppraisal.oneThirdOfNetPay).toLocaleString()}</strong></li>
                            <li>Loan Term: <strong>${salaryAppraisal.loanTerm} months</strong></li>
                            <li style="color: #10b981;">Salary Appraisal Amount: <strong>KES ${Math.round(salaryAppraisal.salaryAppraisalAmount).toLocaleString()}</strong></li>
                        </ul>
                        
                        <p><strong>Proposed Loan:</strong></p>
                        <ul style="margin-bottom: 15px;">
                            <li>Proposed Amount: <strong>KES ${salaryAppraisal.proposedLoanAmount.toLocaleString()}</strong></li>
                            <li style="color: #e11d48;">Exceeds Salary Appraisal by: <strong>KES ${Math.round(salaryAppraisal.shortfall).toLocaleString()}</strong></li>
                        </ul>
                        
                        <p style="color: #e11d48; margin-top: 15px;">
                            ⚠️ This loan amount exceeds the member's salary appraisal amount.
                        </p>
                        
                        <hr style="margin: 15px 0;">
                        
                        <p class="text-sm text-gray-600">
                            The member's ability to pay is ${salaryAppraisal.abilityPercentage}%. 
                            Do you still want to proceed with this appraisal?
                        </p>
                    </div>
                `,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Proceed Anyway",
                cancelButtonText: "Review Amount",
                confirmButtonColor: "#e11d48",
                cancelButtonColor: "#4f46e5",
                width: "550px"
            });

            if (!result.isConfirmed) {
                return;
            }
        }

        // ===== 2/3 RULE VALIDATION =====
        const twoThirdRule = calculateTwoThirdRule();
        
        if (form.AppraisedAmount > 0 && twoThirdRule.isTwoThirdRuleBroken) {
            const result = await Swal.fire({
                title: "⚠️ 2/3 Rule Compliance Warning",
                html: `
                    <div style="text-align: left;">
                        <h4 style="color: #e11d48; margin-bottom: 10px;">The proposed loan violates the 2/3 Rule</h4>
                        
                        <p><strong>Salary Summary:</strong></p>
                        <ul style="margin-bottom: 15px;">
                            <li>Gross Salary: <strong>KES ${twoThirdRule.grossSalary.toLocaleString()}</strong></li>
                            <li>Minimum Take-Home (⅓): <strong>KES ${twoThirdRule.minimumTakeHome.toLocaleString()}</strong></li>
                            <li>Maximum Allowed Deductions (⅔): <strong>KES ${twoThirdRule.maxAllowedDeduction.toLocaleString()}</strong></li>
                        </ul>
                        
                        <p><strong>Deductions Summary:</strong></p>
                        <ul style="margin-bottom: 15px;">
                            <li>Current Deductions (Taxes + Other Loans): <strong>KES ${twoThirdRule.currentTotalDeductions.toLocaleString()}</strong></li>
                            <li>Proposed Monthly Repayment: <strong>KES ${Math.round(twoThirdRule.proposedMonthlyRepayment).toLocaleString()}</strong></li>
                            <li style="color: #e11d48;">Total with New Loan: <strong>KES ${Math.round(twoThirdRule.totalWithNewLoan).toLocaleString()}</strong></li>
                        </ul>
                        
                        <p style="color: #e11d48; margin-top: 15px;">
                            ⚠️ Total deductions would exceed the legal limit by 
                            <strong>KES ${Math.round(twoThirdRule.excessAmount).toLocaleString()}</strong>
                        </p>
                        
                        <hr style="margin: 15px 0;">
                        
                        <p class="text-sm text-gray-600">
                            According to Kenyan labor laws, your net take-home pay must be at least ⅓ of your gross salary.
                            Do you still want to proceed with this appraisal?
                        </p>
                    </div>
                `,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Proceed Anyway",
                cancelButtonText: "Review Amount",
                confirmButtonColor: "#e11d48",
                cancelButtonColor: "#4f46e5",
                width: "550px"
            });

            if (!result.isConfirmed) {
                return;
            }
            
            await Swal.fire({
                title: "Proceeding with 2/3 Rule Violation",
                text: "Please note that this loan may be rejected by the system or require additional approval.",
                icon: "info",
                confirmButtonText: "Continue",
                confirmButtonColor: "#e11d48"
            });
        }

        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_LOANING_URL}/api/Loaning/loan/appraisal`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await res.json();

            if (data.Success) {
                Swal.fire("Success", data.Message, "success");
                onSuccess?.();
                onClose();
            } else {
                Swal.fire("Error", data.Message, "error");
            }
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handlePrintPDF = () => {
        const pdf = new jsPDF("p", "mm", "a4");
        const twoThirdRule = calculateTwoThirdRule();
        const salaryAppraisal = calculateSalaryAppraisal();

        pdf.setFontSize(16);
        pdf.text("Loan Appraisal Report", 14, 20);

        pdf.setFontSize(10);
        pdf.text(`Case Number: ${loan?.CaseNumber || loanCaseId}`, 14, 28);
        pdf.text(`Date: ${new Date().toLocaleDateString()}`, 150, 28);

        autoTable(pdf, {
            startY: 35,
            head: [["Field", "Value"]],
            body: [
                ["Customer", loan?.CustomerFullName?.replace(/^(mr|mrs|ms|miss|dr|prof)\.?\s+/i, "").trim() || ""],
                ["Loan Product", loan?.LoanProductDescription || ""],
                ["Loan Purpose", loan?.LoanPurposeDescription || ""],
                ["Amount Applied", `Ksh ${loan?.AmountApplied?.toLocaleString() || 0}`],
                ["Received Date", loan?.ReceivedDate ? new Date(loan.ReceivedDate).toLocaleDateString() : ""],
                ["Status", loan?.StatusDescription || ""],
            ],
            theme: "grid",
            headStyles: { fillColor: [79, 70, 229] },
        });

        // Add Salary Appraisal section (Net Take-Home Pay based)
        autoTable(pdf, {
            startY: pdf.lastAutoTable.finalY + 8,
            head: [["Salary Appraisal Analysis", "Value"]],
            body: [
                ["Net Take-Home Pay", `KES ${salaryAppraisal.netTakeHomePay.toLocaleString()}`],
                ["One-Third of Net Pay (Net ÷ 3)", `KES ${Math.round(salaryAppraisal.oneThirdOfNetPay).toLocaleString()}`],
                ["Loan Term", `${salaryAppraisal.loanTerm} months`],
                ["Salary Appraisal Amount ((Net ÷ 3) × Term)", `KES ${Math.round(salaryAppraisal.salaryAppraisalAmount).toLocaleString()}`],
                ["Proposed Loan Amount", `KES ${salaryAppraisal.proposedLoanAmount.toLocaleString()}`],
                ["Ability Percentage", `${salaryAppraisal.abilityPercentage}%`],
                ["Status", salaryAppraisal.isAffordable ? "✅ Within Salary Appraisal" : "⚠️ Exceeds Salary Appraisal"],
            ],
            theme: "grid",
            headStyles: { fillColor: [79, 70, 229] },
            styles: { fontSize: 9 },
        });

        autoTable(pdf, {
            startY: pdf.lastAutoTable.finalY + 8,
            head: [["Salary & 2/3 Rule Analysis", "Value"]],
            body: [
                ["Basic Salary", `KES ${twoThirdRule.grossSalary.toLocaleString()}`],
                ["Total Allowance", `KES ${form.LoanRegistrationTotalAllowance?.toLocaleString() || 0}`],
                ["Gross Salary", `KES ${twoThirdRule.grossSalary.toLocaleString()}`],
                ["Minimum Take-Home (⅓ of Gross)", `KES ${twoThirdRule.minimumTakeHome.toLocaleString()}`],
                ["Maximum Allowed Deductions (⅔ of Gross)", `KES ${twoThirdRule.maxAllowedDeduction.toLocaleString()}`],
                ["Current Deductions (Taxes + Other Loans)", `KES ${twoThirdRule.currentTotalDeductions.toLocaleString()}`],
                ["Available for New Loan", `KES ${twoThirdRule.availableForNewLoan.toLocaleString()}`],
                ["Proposed Monthly Repayment", `KES ${Math.round(twoThirdRule.proposedMonthlyRepayment).toLocaleString()}`],
                ["Status", twoThirdRule.isTwoThirdRuleBroken ? "⚠️ Violates 2/3 Rule" : "✅ Complies with 2/3 Rule"],
            ],
            theme: "grid",
            headStyles: { fillColor: [79, 70, 229] },
            styles: { fontSize: 9 },
        });

        autoTable(pdf, {
            startY: pdf.lastAutoTable.finalY + 8,
            head: [["Appraisal Field", "Value"]],
            body: [
                ["Audit Option", form.loanAuditOption === "1" ? "Approve" : form.loanAuditOption === "2" ? "Reject" : "Defer"],
                ["Appraised Amount", `Ksh ${form.AppraisedAmount?.toLocaleString() || 0}`],
                ["Appraised Basic Income", `Ksh ${form.AppraisedNetIncome?.toLocaleString() || 0}`],
                ["Appraised Ability", `${form.AppraisedAbility || 0}%`],
                ["Appraisal Remarks", form.AppraisalRemarks || "-"],
                ["Appraised Date", form.AppraisedDate ? new Date(form.AppraisedDate).toLocaleDateString() : "-"],
            ],
            theme: "grid",
            headStyles: { fillColor: [79, 70, 229] },
        });

        const pageHeight = pdf.internal.pageSize.height;
        pdf.setFontSize(9);
        pdf.text("Generated by Loan Management System", 14, pageHeight - 10);
        pdf.save(`Loan_Appraisal_${loan?.CaseNumber || loanCaseId}.pdf`);
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
                        className="fixed top-3 right-3 w-[900px] bg-white shadow-2xl z-50 rounded-2xl flex flex-col"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
                            <h2 className="font-bold text-xl text-white">Loan Appraisal</h2>
                            <Button variant="outline" onClick={onClose}>Close</Button>
                        </div>

                        <div className="p-6 overflow-y-auto h-[85vh] space-y-6">
                            {/* READ-ONLY LOAN DETAILS */}
                            {loan && (
                                <Card className="p-4 bg-gray-200 border space-y-3">
                                    <h3 className="font-semibold text-white bg-indigo-700 p-3 rounded-xl">
                                        Loan Details (Read Only)
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                                        <div>
                                            <Label>Loan Product</Label>
                                            <Input value={loan.LoanProductDescription} readOnly className="bg-gray-100 cursor-not-allowed" />
                                        </div>

                                        <div>
                                            <Label>Customer</Label>
                                            <Input value={loan.CustomerIndividualFirstName + " " + loan.CustomerIndividualLastName} readOnly className="bg-gray-100 cursor-not-allowed" />
                                        </div>

                                        <div>
                                            <Label>Customer Email</Label>
                                            <Input value={loan.CustomerAddressEmail} readOnly className="bg-gray-100 cursor-not-allowed" />
                                        </div>

                                        <div>
                                            <Label>Phone</Label>
                                            <Input value={loan.CustomerAddressMobileLine} readOnly className="bg-gray-100 cursor-not-allowed" />
                                        </div>

                                        <div>
                                            <Label>Amount Applied</Label>
                                            <Input value={`Ksh ${loan.AmountApplied?.toLocaleString()}`} readOnly className="bg-gray-100 cursor-not-allowed" />
                                        </div>

                                        <div>
                                            <Label>Received Date</Label>
                                            <Input value={loan.ReceivedDate ? new Date(loan.ReceivedDate).toLocaleDateString() : ""} readOnly className="bg-gray-100 cursor-not-allowed" />
                                        </div>

                                        <div>
                                            <Label>Status</Label>
                                            <Input value={loan.StatusDescription} readOnly className="bg-gray-100 cursor-not-allowed" />
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* SALARY INFORMATION SECTION */}
                            <div className="bg-gray-200 rounded-md p-4">
                                <h3 className="font-semibold text-white bg-indigo-700 p-3 rounded-xl">
                                    Salary Analysis & Appraisal
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                    <div>
                                        <Label>Basic Salary (Gross)</Label>
                                        <Input 
                                            type="number"
                                            value={form.LoanRegistrationNetIncome}
                                            onChange={e => update("LoanRegistrationNetIncome", e.target.value)}
                                            className="bg-white"
                                            placeholder="Enter basic salary"
                                        />
                                    </div>
                                    <div>
                                        <Label>Total Allowance</Label>
                                        <Input 
                                            type="number"
                                            value={form.LoanRegistrationTotalAllowance}
                                            onChange={e => update("LoanRegistrationTotalAllowance", e.target.value)}
                                            className="bg-white"
                                            placeholder="Enter allowances"
                                        />
                                    </div>
                                    <div>
                                        <Label>Total Deductions (Taxes + Existing Loans)</Label>
                                        <Input 
                                            type="number"
                                            value={form.LoanRegistrationTotalDeduction}
                                            onChange={e => update("LoanRegistrationTotalDeduction", e.target.value)}
                                            className="bg-white"
                                            placeholder="Enter total deductions"
                                        />
                                    </div>
                                    <div>
                                        <Label>Net Take-Home Pay</Label>
                                        <Input
                                            type="number"
                                            value={form.LoanRegistrationTotalIncome}
                                            readOnly
                                            className="bg-gray-100 cursor-not-allowed font-semibold text-indigo-700"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Basic Salary + Allowance - Deductions
                                        </p>
                                    </div>
                                </div>

                                {form.LoanRegistrationTotalIncome > 0 && (
                                    <div className="mt-4 p-4 bg-white rounded-lg border">
                                        <h4 className="font-semibold text-indigo-700 mb-3">Salary Appraisal Calculator</h4>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Formula: <strong>(Net Take-Home Pay ÷ 3) × Loan Term = Salary Appraisal Amount</strong>
                                        </p>
                                        {(() => {
                                            const appraisal = calculateSalaryAppraisal();
                                            return (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                    <div>
                                                        <p className="text-gray-600">Net Take-Home Pay:</p>
                                                        <p className="font-semibold">KES {appraisal.netTakeHomePay.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">One-Third of Net Pay:</p>
                                                        <p className="font-semibold">KES {Math.round(appraisal.oneThirdOfNetPay).toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Loan Term:</p>
                                                        <p className="font-semibold">{appraisal.loanTerm} months</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Salary Appraisal Amount:</p>
                                                        <p className="font-semibold text-indigo-700">KES {Math.round(appraisal.salaryAppraisalAmount).toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Proposed Loan Amount:</p>
                                                        <p className={`font-semibold ${!appraisal.isAffordable ? 'text-red-600' : 'text-green-600'}`}>
                                                            KES {appraisal.proposedLoanAmount.toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Ability Percentage:</p>
                                                        <p className={`font-semibold ${appraisal.abilityPercentage > 100 ? 'text-red-600' : 'text-green-600'}`}>
                                                            {appraisal.abilityPercentage}%
                                                        </p>
                                                    </div>
                                                    {!appraisal.isAffordable && (
                                                        <div className="col-span-2">
                                                            <p className="text-red-600 text-sm">
                                                                ⚠️ Warning: Loan amount exceeds Salary Appraisal by KES {Math.round(appraisal.shortfall).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    )}
                                                    <div className="col-span-2 mt-2 p-2 bg-gray-100 rounded">
                                                        <p className="text-xs text-gray-600">
                                                            <strong>Calculation:</strong> (KES {appraisal.netTakeHomePay.toLocaleString()} ÷ 3) × {appraisal.loanTerm} months = KES {Math.round(appraisal.salaryAppraisalAmount).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {form.LoanRegistrationNetIncome > 0 && (
                                    <div className="mt-4 p-4 bg-white rounded-lg border">
                                        <h4 className="font-semibold text-indigo-700 mb-3">2/3 Rule Calculator (Kenyan Labor Law)</h4>
                                        {(() => {
                                            const rule = calculateTwoThirdRule();
                                            return (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                    <div>
                                                        <p className="text-gray-600">Gross Salary:</p>
                                                        <p className="font-semibold">KES {rule.grossSalary.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Minimum Take-Home (⅓):</p>
                                                        <p className="font-semibold">KES {rule.minimumTakeHome.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Maximum Deductions Allowed (⅔):</p>
                                                        <p className="font-semibold">KES {rule.maxAllowedDeduction.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Current Deductions:</p>
                                                        <p className={`font-semibold ${rule.currentTotalDeductions > rule.maxAllowedDeduction ? 'text-red-600' : 'text-green-600'}`}>
                                                            KES {rule.currentTotalDeductions.toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Monthly Repayment Capacity:</p>
                                                        <p className="font-semibold text-green-600">KES {Math.round(rule.availableForNewLoan).toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Proposed Monthly Repayment:</p>
                                                        <p className={`font-semibold ${rule.proposedMonthlyRepayment > rule.availableForNewLoan ? 'text-red-600' : 'text-green-600'}`}>
                                                            KES {Math.round(rule.proposedMonthlyRepayment).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    {rule.currentTotalDeductions > rule.maxAllowedDeduction && (
                                                        <div className="col-span-2">
                                                            <p className="text-red-600 text-sm">
                                                                ⚠️ Warning: Current deductions exceed the legal limit by KES {(rule.currentTotalDeductions - rule.maxAllowedDeduction).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>

                            <Card className="p-4 space-y-6">
                                <h3 className="font-semibold text-white bg-indigo-700 p-3 rounded-xl">
                                    Appraisal Decision
                                </h3>

                                <div>
                                    <Label>Appraised Option</Label>
                                    <select
                                        className="w-full border rounded-md p-2"
                                        value={form.loanAuditOption}
                                        onChange={e => update("loanAuditOption", e.target.value)}
                                    >
                                        <option value="">Select option</option>
                                        <option value="1">Approve</option>
                                        <option value="2">Reject</option>
                                        <option value="4">Defer</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label>Appraised Amount</Label>
                                        <div className="flex items-center gap-2">
                                            <Input 
                                                type="number" 
                                                value={form.AppraisedAmount}
                                                onChange={e => update("AppraisedAmount", e.target.value)} 
                                                placeholder="Enter appraised amount"
                                                className="flex-1"
                                            />
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => update("AppraisedAmount", loan?.AmountApplied || 0)}
                                                className="whitespace-nowrap"
                                            >
                                                Match Applied
                                            </Button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Amount Applied: KES {loan?.AmountApplied?.toLocaleString() || 0}
                                        </p>
                                        {form.AppraisedAmount > 0 && (() => {
                                            const appraisal = calculateSalaryAppraisal();
                                            if (!appraisal.isAffordable) {
                                                return (
                                                    <p className="text-xs text-red-600 mt-1">
                                                        ⚠️ Exceeds Salary Appraisal by KES {Math.round(appraisal.shortfall).toLocaleString()}
                                                    </p>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>

                                    <div>
                                        <Label>Appraised Basic Income</Label>
                                        <Input 
                                            type="number" 
                                            value={form.AppraisedNetIncome}
                                            onChange={e => update("AppraisedNetIncome", e.target.value)} 
                                        />
                                    </div>

                                    <div>
                                        <Label>Appraised Ability (%)</Label>
                                        <Input 
                                            type="number" 
                                            value={form.AppraisedAbility}
                                            readOnly
                                            className="bg-gray-100 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Calculated as: (Proposed Amount ÷ Salary Appraisal Amount) × 100
                                        </p>
                                    </div>

                                    <div>
                                        <Label>Appraisal Remarks</Label>
                                        <Input 
                                            value={form.AppraisalRemarks}
                                            onChange={e => update("AppraisalRemarks", e.target.value)} 
                                            placeholder="Enter remarks"
                                        />
                                    </div>

                                    <div>
                                        <Label>Appraised Date</Label>
                                        <Input
                                            value={form.AppraisedDate}
                                            onChange={e => update("AppraisedDate", e.target.value)}
                                            type="date"
                                            className="bg-white"
                                        />
                                    </div>
                                </div>
                            </Card>

                            {/* ACTIONS */}
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={handlePrintPDF}>
                                    Print PDF
                                </Button>
                                <Button variant="outline" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSubmit} disabled={loading}>
                                    {loading ? "Submitting..." : "Submit Appraisal"}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}