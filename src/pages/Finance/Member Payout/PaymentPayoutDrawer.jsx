import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { 
  FaMoneyBillWave, 
  FaBook,
  FaTimesCircle,
  FaCheckCircle,
  FaUniversity,
  FaPercent
} from "react-icons/fa";

const API_URL = import.meta.env.VITE_APP_MEMBERSHIP_URL;
const FIN_URL  = import.meta.env.VITE_APP_FIN_URL;

// mode: "payout" | "loan"
export default function PaymentPayoutDrawer({ open, onClose, payout, loan, mode = "payout", onSuccess }) {
  const [loading, setLoading]                   = useState(false);
  const [chartOfAccounts, setChartOfAccounts]   = useState([]);
  const [showAccountSelect, setShowAccountSelect] = useState(false);
  const [accountSearch, setAccountSearch]       = useState("");
  const [bankAccounts, setBankAccounts]         = useState([]);

  const [formData, setFormData] = useState({
    // shared
    paymentChartOfAccountId:   "",
    paymentChartOfAccountName: "",
    // payout-specific
    settlementId:              "",
    payoutAmount:              "",
    moduleNavigationItemCode:  100,
    createdBy:                 "System.UI",
    // loan-specific
    loanSettlementId:          "",
    bankAccountId:             "",
    bankAccountName:           "",
    bankAccountNumber:         "",
    chartOfAccountId:          "",
    chartOfAccountName:        "",
    // NEW: loan payment amount for partial payments
    loanPaymentAmount:         "",
    isPartialPayment:          false
  });

  // ── seed form when drawer opens ──────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    setShowAccountSelect(false);
    setAccountSearch("");
    
    if (mode === "loan") {
      fetchBankAccounts();
      // Set default loan payment amount to full amount
      if (loan) {
        const totalAmount = loan.totalAmount || 
          ((loan.principal || 0) + (loan.interest || 0) + (loan.carryForwards || 0));
        setFormData(prev => ({
          ...prev,
          loanSettlementId:          loan.settlementId,
          bankAccountId:             loan.bankAccountId || "",
          bankAccountName:           loan.bankAccountName || "",
          bankAccountNumber:         loan.bankAccountNumber || "",
          chartOfAccountId:          loan.chartOfAccountId || "",
          chartOfAccountName:        loan.chartOfAccountName || "",
          loanPaymentAmount:         totalAmount.toString(),
          isPartialPayment:          false
        }));
      }
    } else {
      fetchChartOfAccounts();
    }

    if (mode === "payout" && payout) {
      setFormData(prev => ({
        ...prev,
        settlementId:             payout.settlementId,
        payoutAmount:             payout.payoutAmount?.toString() || "",
        paymentChartOfAccountId:  "",
        paymentChartOfAccountName:""
      }));
    }
  }, [open, payout, loan, mode]);

  const fetchChartOfAccounts = async () => {
    try {
      const res  = await fetch(`${FIN_URL}/api/values/GetChartOfAccount`);
      const data = await res.json();
      setChartOfAccounts(Array.isArray(data) ? data : data.Data || []);
    } catch (err) {
      console.error("Fetch Chart of Accounts Error:", err);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const res = await fetch(`${FIN_URL}/api/GetBankLinkages`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });
      const data = await res.json();
      
      if (data.success) {
        const accounts = data.data || [];
        setBankAccounts(accounts);
      } else {
        console.error("Failed to fetch bank linkages:", data.message);
        Swal.fire("Error", data.message || "Failed to load bank accounts", "error");
      }
    } catch (err) {
      console.error("Fetch Bank Accounts Error:", err);
      Swal.fire("Error", "Failed to load bank accounts", "error");
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0.00";
    return Number(amount).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleChange = (field, value) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleBankAccountSelect = (account) => {
    setFormData(prev => ({
      ...prev,
      bankAccountId:        account.id,
      bankAccountName:      account.displayName || `${account.bankName} - ${account.bankAccountNumber}`,
      bankAccountNumber:    account.bankAccountNumber,
      chartOfAccountId:     account.chartOfAccountId,
      chartOfAccountName:   account.chartOfAccountName
    }));
    setShowAccountSelect(false);
    setAccountSearch("");
  };

  const handleChartOfAccountSelect = (account) => {
    setFormData(prev => ({
      ...prev,
      paymentChartOfAccountId:   account.Id,
      paymentChartOfAccountName: account.AccountName || account.Description || account.Name
    }));
    setShowAccountSelect(false);
    setAccountSearch("");
  };

  const handlePartialAmount = () => {
    const maxAmount = mode === "payout" 
      ? payout?.payoutAmount 
      : loan ? (loan.totalAmount || ((loan.principal || 0) + (loan.interest || 0) + (loan.carryForwards || 0))) : 0;

    Swal.fire({
      title: mode === "payout" ? "Enter Partial Amount" : "Enter Partial Payment Amount",
      input: "number",
      inputLabel: `Amount to pay (KSH) - Max: ${formatCurrency(maxAmount)} KSH`,
      inputValue: mode === "payout" ? formData.payoutAmount : formData.loanPaymentAmount,
      inputAttributes: { step: "0.01", min: "0.01", max: maxAmount },
      showCancelButton: true,
      confirmButtonText: "Set Amount",
      preConfirm: (value) => {
        const amount = parseFloat(value);
        if (isNaN(amount) || amount <= 0) {
          Swal.showValidationMessage("Please enter a valid amount");
          return false;
        }
        if (amount > maxAmount) {
          Swal.showValidationMessage(
            `Amount cannot exceed ${formatCurrency(maxAmount)} KSH`
          );
          return false;
        }
        return amount;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        if (mode === "payout") {
          handleChange("payoutAmount", result.value.toString());
        } else {
          handleChange("loanPaymentAmount", result.value.toString());
          handleChange("isPartialPayment", parseFloat(result.value) < maxAmount);
        }
      }
    });
  };

  // ── SUBMIT ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "loan") {
      if (!formData.bankAccountId) {
        Swal.fire("Error", "Please select a bank account for disbursement", "error");
        return;
      }
      if (!formData.loanPaymentAmount || parseFloat(formData.loanPaymentAmount) <= 0) {
        Swal.fire("Error", "Please enter a valid payment amount", "error");
        return;
      }
    } else {
      if (!formData.paymentChartOfAccountId) {
        Swal.fire("Error", "Please select the source Chart of Account", "error");
        return;
      }
      if (!formData.payoutAmount || parseFloat(formData.payoutAmount) <= 0) {
        Swal.fire("Error", "Please enter a valid amount", "error");
        return;
      }
    }

    setLoading(true);
    Swal.fire({
      title: mode === "loan" ? "Processing Loan Payment..." : "Processing Payout...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      // ── LOAN PAYMENT (DISBURSEMENT) ──────────────────────────────────
      if (mode === "loan") {
        const paymentAmount = parseFloat(formData.loanPaymentAmount);
        const totalAmount = loan.totalAmount || 
          ((loan.principal || 0) + (loan.interest || 0) + (loan.carryForwards || 0));
        const isPartial = paymentAmount < totalAmount;

        const payload = {
          settlementId: formData.loanSettlementId,
          bankAccountId: formData.bankAccountId,
          paymentAmount: paymentAmount,
          isPartialPayment: isPartial,
          processedBy: "System.UI",
          remarks: isPartial ? `Partial payment of ${formatCurrency(paymentAmount)} KSH` : "Full payment"
        };

        console.log("Loan Payment Payload:", payload);

        const res = await fetch(`${API_URL}/api/ProcessDisbursement`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true"
          },
          body: JSON.stringify(payload)
        });

        const result = await res.json();
        console.log("Loan Payment Response:", result);

        if (result.success) {
          Swal.fire({
            title: isPartial ? "Partial Payment Successful!" : "Full Payment Successful!",
            html: `
              <div class="text-center">
                <p class="mb-3">${result.message || "Loan payment processed successfully"}</p>
                <div class="mt-3 p-3 bg-green-50 rounded-lg text-left">
                  <p><strong>Member:</strong> ${loan?.customerName || "N/A"}</p>
                  <p><strong>Loan Number:</strong> ${loan?.loanNumber || loan?.reference || "N/A"}</p>
                  <p><strong>Payment Amount:</strong> ${formatCurrency(paymentAmount)} KSH</p>
                  <p><strong>Payment Type:</strong> ${isPartial ? "Partial Payment" : "Full Payment"}</p>
                  ${isPartial ? `<p><strong>Remaining Balance:</strong> ${formatCurrency(totalAmount - paymentAmount)} KSH</p>` : ''}
                  <p><strong>Bank:</strong> ${formData.bankAccountName}</p>
                  <p><strong>Account Number:</strong> ${formData.bankAccountNumber || "N/A"}</p>
                  <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                </div>
              </div>
            `,
            icon: "success",
            confirmButtonText: "OK",
            confirmButtonColor: "#22c55e"
          });

          if (onSuccess) onSuccess();
          onClose();
        } else {
          const errorText = Array.isArray(result.errors)
            ? result.errors.join("<br/>")
            : result.message || "Failed to process payment";
          
          if (result.message === "Bank GL not configured") {
            Swal.fire({
              title: "Configuration Error",
              html: `
                <p class="mb-3">Bank account is not properly configured for payment.</p>
                <div class="mt-3 p-3 bg-yellow-50 rounded-lg text-left">
                  <p class="text-sm"><strong>Please ensure:</strong></p>
                  <ul class="text-sm list-disc list-inside mt-2">
                    <li>The selected bank account is active</li>
                    <li>The bank account has valid GL linkages</li>
                    <li>The loan settlement record is valid</li>
                  </ul>
                  <p class="text-sm mt-2"><strong>Selected Bank:</strong> ${formData.bankAccountName}</p>
                  <p class="text-sm"><strong>Bank Account ID:</strong> ${formData.bankAccountId}</p>
                </div>
              `,
              icon: "error",
              confirmButtonText: "OK",
              confirmButtonColor: "#ef4444"
            });
          } else {
            Swal.fire("Error", errorText, "error");
          }
        }

      // ── MEMBERSHIP PAYOUT ──────────────────────────────────────────────
      } else {
        const res = await fetch(
          `${API_URL}/api/values/process-payout/${formData.settlementId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true"
            },
            body: JSON.stringify({
              payoutAmount:              parseFloat(formData.payoutAmount),
              paymentChartOfAccountId:   formData.paymentChartOfAccountId,
              moduleNavigationItemCode:  formData.moduleNavigationItemCode,
              createdBy:                 formData.createdBy
            })
          }
        );

        const result = await res.json();

        if (result.Success) {
          const data = result.Data;
          Swal.fire({
            title: "Success!",
            html: `
              <div class="text-center">
                <p class="mb-3">${result.Message}</p>
                <div class="mt-3 p-3 bg-green-50 rounded-lg text-left">
                  <p><strong>Member:</strong> ${data.CustomerName || "N/A"}</p>
                  <p><strong>Member No:</strong> ${data.MemberNumber || "N/A"}</p>
                  <p><strong>Amount:</strong> ${formatCurrency(data.PayoutAmount)} KSH</p>
                  <p><strong>Source Account:</strong> ${formData.paymentChartOfAccountName}</p>
                  <p><strong>Previous Balance:</strong> ${formatCurrency(data.PreviousBalance)} KSH</p>
                  <p><strong>Remaining Balance:</strong> ${formatCurrency(data.RemainingBalance)} KSH</p>
                  <p><strong>Status:</strong> ${data.IsFullPayout ? "Full Payment" : "Partial Payment"}</p>
                  <p><strong>Date:</strong> ${new Date(data.PayoutDate).toLocaleString()}</p>
                </div>
              </div>
            `,
            icon: "success",
            confirmButtonText: "OK",
            confirmButtonColor: "#22c55e"
          });

          if (onSuccess) onSuccess();
          onClose();
        } else {
          Swal.fire(
            "Error",
            result.Errors || result.Message || "Failed to process payout",
            "error"
          );
        }
      }
    } catch (err) {
      console.error("Submit Error:", err);
      Swal.fire("Error", err.message || "An unexpected error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── filtered accounts ────────────────────────────────────────────────────
  const accountsToShow = mode === "loan" ? bankAccounts : chartOfAccounts;
  
  const filteredAccounts = accountsToShow.filter((account) => {
    const term = accountSearch.toLowerCase();
    
    if (mode === "loan") {
      return (
        (account.bankName || "").toLowerCase().includes(term) ||
        (account.bankBranchName || "").toLowerCase().includes(term) ||
        (account.bankAccountNumber || "").toLowerCase().includes(term) ||
        (account.chartOfAccountName || "").toLowerCase().includes(term) ||
        (account.displayName || "").toLowerCase().includes(term) ||
        (account.chartOfAccountCode || "").toLowerCase().includes(term)
      );
    } else {
      return (
        (account.AccountName || account.Description || account.Name || "")
          .toLowerCase().includes(term) ||
        (account.Code || "").toString().toLowerCase().includes(term)
      );
    }
  });

  // ── derived values ───────────────────────────────────────────────────
  const totalLoanAmount = mode === "loan" && loan ? 
    (loan.totalAmount || ((loan.principal || 0) + (loan.interest || 0) + (loan.carryForwards || 0))) : 0;
  
  const remainingLoanAmount = mode === "loan" && formData.loanPaymentAmount ?
    totalLoanAmount - parseFloat(formData.loanPaymentAmount || 0) : 0;
  
  const isFullLoanPayment = mode === "loan" && formData.loanPaymentAmount ?
    remainingLoanAmount === 0 && parseFloat(formData.loanPaymentAmount) > 0 : false;

  const remainingAmount = mode === "payout"
    ? (payout?.payoutAmount || 0) - parseFloat(formData.payoutAmount || 0)
    : 0;
  const isFullPayout = remainingAmount === 0 && parseFloat(formData.payoutAmount) > 0;

  if (mode === "payout" && !payout) return null;
  if (mode === "loan"   && !loan)   return null;

  // ── header / label helpers ───────────────────────────────────────────────
  const drawerTitle     = mode === "loan" ? "Process Loan Payment" : "Process Payout";
  const accountLabel    = mode === "loan" ? "Select Bank Account *" : "Payment Source Account *";
  const submitLabel     = mode === "loan" ? "Process Payment" : "Process Payment";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed top-5 right-3 w-[550px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh] overflow-y-auto"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className={`p-4 flex justify-between items-center rounded-2xl m-2 bg-gradient-to-r ${
              mode === "loan"
                ? "from-blue-700 to-blue-800"
                : "from-green-700 to-green-800"
            }`}>
              <h2 className="font-bold text-lg text-white flex items-center gap-2">
                {mode === "loan" ? <FaUniversity /> : <FaMoneyBillWave />} 
                {drawerTitle}
              </h2>
              <Button variant="outline" size="sm" onClick={onClose} className="bg-white/10 text-white hover:bg-white/20">
                Close
              </Button>
            </div>

            <div className="p-3 flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* ── INFO CARD ── */}
                {mode === "payout" && payout && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="font-semibold text-gray-800">{payout.customerName}</p>
                    <p className="text-sm text-gray-600">Member No: {payout.memberNumber}</p>
                    <p className="text-sm text-gray-600">Account: {payout.accountDescription}</p>
                    <p className="text-lg font-bold text-green-700 mt-2">
                      Due Amount: {formatCurrency(payout.payoutAmount)} KSH
                    </p>
                  </div>
                )}

                {mode === "loan" && loan && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="font-semibold text-gray-800">{loan.customerName}</p>
                    <p className="text-sm text-gray-600">Member No: {loan.memberNumber}</p>
                    <p className="text-sm text-gray-600">
                      Loan Number: <span className="font-medium text-blue-600">{loan.loanNumber || loan.reference || "N/A"}</span>
                    </p>
                    <p className="text-lg font-bold text-blue-700 mt-2">
                      Total Amount Due: {formatCurrency(totalLoanAmount)} KSH
                    </p>
                    {loan.interest > 0 && (
                      <p className="text-sm text-gray-600">
                        Interest: {formatCurrency(loan.interest)} KSH
                      </p>
                    )}
                    {loan.carryForwards > 0 && (
                      <p className="text-sm text-gray-600">
                        Carry Forwards: {formatCurrency(loan.carryForwards)} KSH
                      </p>
                    )}
                  </div>
                )}

                {/* ── BANK ACCOUNT SELECTOR (LOAN) / CHART OF ACCOUNT (PAYOUT) ── */}
                <div>
                  <Label className="text-sm font-semibold">{accountLabel}</Label>
                  {!showAccountSelect ? (
                    <div className="flex gap-2">
                      <Input
                        value={mode === "loan" ? formData.bankAccountName : formData.paymentChartOfAccountName || ""}
                        readOnly
                        className="bg-gray-100 cursor-pointer"
                        onClick={() => setShowAccountSelect(true)}
                        placeholder={`Click to select ${mode === "loan" ? "bank account" : "account"}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAccountSelect(true)}
                      >
                        <FaBook className="mr-1" /> Browse
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder={`Search ${mode === "loan" ? "bank accounts" : "accounts"} by name or code...`}
                          className="flex-1"
                          value={accountSearch}
                          onChange={(e) => setAccountSearch(e.target.value)}
                          autoFocus
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowAccountSelect(false);
                            setAccountSearch("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                      <div className="border rounded-md max-h-60 overflow-y-auto">
                        {filteredAccounts.length === 0 ? (
                          <p className="p-3 text-gray-500 text-sm text-center">
                            {accountsToShow.length === 0
                              ? `Loading ${mode === "loan" ? "bank accounts" : "accounts"}...`
                              : `No ${mode === "loan" ? "bank accounts" : "accounts"} found`}
                          </p>
                        ) : (
                          filteredAccounts.map((account) => (
                            <div
                              key={account.id}
                              className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 transition-colors"
                              onClick={() => mode === "loan" ? handleBankAccountSelect(account) : handleChartOfAccountSelect(account)}
                            >
                              {mode === "loan" ? (
                                <>
                                  <p className="font-medium text-sm">
                                    {account.displayName || `${account.bankName} - ${account.bankAccountNumber}`}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Bank: {account.bankName} | Branch: {account.bankBranchName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Account: {account.bankAccountNumber} | GL: {account.chartOfAccountCode} - {account.chartOfAccountName}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="font-medium text-sm">
                                    {account.AccountName || account.Description || account.Name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Code: {account.Code} | Type: {account.TypeDescription || account.AccountType || "N/A"}
                                  </p>
                                  {account.Balance !== undefined && (
                                    <p className="text-xs text-gray-400">
                                      Balance: {formatCurrency(account.Balance)} KSH
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                  {(formData.paymentChartOfAccountName || formData.bankAccountName) && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <FaCheckCircle className="text-xs" /> Selected:{" "}
                      {formData.bankAccountName || formData.paymentChartOfAccountName}
                    </p>
                  )}
                </div>

                {/* ── AMOUNT ── */}
                <div>
                  <Label className="text-sm font-semibold">
                    {mode === "payout" ? "Amount (KSH) *" : "Payment Amount (KSH) *"}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={mode === "payout" ? formData.payoutAmount : formData.loanPaymentAmount}
                      onChange={(e) => {
                        if (mode === "payout") {
                          handleChange("payoutAmount", e.target.value);
                        } else {
                          const value = e.target.value;
                          handleChange("loanPaymentAmount", value);
                          // Check if it's a partial payment
                          if (value && parseFloat(value) > 0) {
                            const isPartial = parseFloat(value) < totalLoanAmount;
                            handleChange("isPartialPayment", isPartial);
                          }
                        }
                      }}
                      className="bg-white flex-1"
                      step="0.01"
                      min="0.01"
                      max={mode === "payout" ? payout?.payoutAmount : totalLoanAmount}
                      placeholder="Enter amount"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePartialAmount}
                      className="whitespace-nowrap"
                    >
                      <FaPercent className="mr-1" /> Partial
                    </Button>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Min: 0.01 KSH</span>
                    <span>Max: {formatCurrency(mode === "payout" ? payout?.payoutAmount : totalLoanAmount)} KSH</span>
                  </div>
                  {mode === "loan" && formData.loanPaymentAmount && parseFloat(formData.loanPaymentAmount) > 0 && (
                    <div className="mt-1">
                      {parseFloat(formData.loanPaymentAmount) < totalLoanAmount ? (
                        <span className="text-xs text-orange-600 flex items-center gap-1">
                          <FaPercent className="text-xs" /> 
                          Partial Payment - Remaining: {formatCurrency(remainingLoanAmount)} KSH
                        </span>
                      ) : parseFloat(formData.loanPaymentAmount) === totalLoanAmount ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <FaCheckCircle className="text-xs" /> Full Payment
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* ── MODULE CODE (payout only) ── */}
                {mode === "payout" && (
                  <div>
                    <Label className="text-sm font-semibold">Module Code</Label>
                    <Input
                      type="number"
                      value={formData.moduleNavigationItemCode}
                      onChange={(e) =>
                        handleChange("moduleNavigationItemCode", parseInt(e.target.value) || 100)
                      }
                      className="bg-white"
                      placeholder="Module code (e.g., 100)"
                    />
                  </div>
                )}

                {/* ── SUMMARY ── */}
                <div className="bg-gray-100 p-3 rounded-lg">
                  <h4 className="font-semibold mb-2">
                    {mode === "loan" ? "Payment Summary" : "Payment Summary"}
                  </h4>
                  <div className="space-y-2 text-sm">

                    {mode === "payout" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Due Amount:</span>
                          <span className="font-semibold">
                            {formatCurrency(payout?.payoutAmount)} KSH
                          </span>
                        </div>
                        <div className="flex justify-between text-green-600 font-bold">
                          <span>Paying:</span>
                          <span>
                            {formatCurrency(parseFloat(formData.payoutAmount || 0))} KSH
                          </span>
                        </div>
                        {remainingAmount > 0 && (
                          <div className="flex justify-between text-orange-600 pt-2 border-t">
                            <span>Remaining Balance:</span>
                            <span className="font-semibold">
                              {formatCurrency(remainingAmount)} KSH
                            </span>
                          </div>
                        )}
                        {isFullPayout && (
                          <div className="flex justify-between text-green-600 pt-2 border-t">
                            <span>Status:</span>
                            <span className="font-semibold">✓ Full Payment</span>
                          </div>
                        )}
                      </>
                    )}

                    {mode === "loan" && loan && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Amount Due:</span>
                          <span className="font-semibold">
                            {formatCurrency(totalLoanAmount)} KSH
                          </span>
                        </div>
                        <div className="flex justify-between text-blue-600 font-bold">
                          <span>Paying:</span>
                          <span>
                            {formatCurrency(parseFloat(formData.loanPaymentAmount || 0))} KSH
                          </span>
                        </div>
                        {remainingLoanAmount > 0 && (
                          <div className="flex justify-between text-orange-600 pt-2 border-t">
                            <span>Remaining Balance:</span>
                            <span className="font-semibold">
                              {formatCurrency(remainingLoanAmount)} KSH
                            </span>
                          </div>
                        )}
                        {isFullLoanPayment && (
                          <div className="flex justify-between text-green-600 pt-2 border-t">
                            <span>Status:</span>
                            <span className="font-semibold">✓ Full Payment</span>
                          </div>
                        )}
                        {!isFullLoanPayment && remainingLoanAmount > 0 && (
                          <div className="flex justify-between text-orange-600 pt-2 border-t">
                            <span>Status:</span>
                            <span className="font-semibold">Partial Payment</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-1 border-t">
                          <span className="text-gray-600">Type:</span>
                          <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${
                            loan.disbursementType === "Refinance"
                              ? "bg-purple-100 text-purple-700"
                              : loan.disbursementType === "Boosted"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}>
                            {loan.disbursementType || "Normal"}
                          </span>
                        </div>
                      </>
                    )}

                    {(formData.paymentChartOfAccountName || formData.bankAccountName) && (
                      <div className="flex justify-between pt-1 border-t">
                        <span className="text-gray-600">
                          {mode === "loan" ? "Bank Account:" : "Source Account:"}
                        </span>
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">
                          {formData.bankAccountName || formData.paymentChartOfAccountName}
                        </span>
                      </div>
                    )}
                    
                    {mode === "loan" && formData.bankAccountNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account Number:</span>
                        <span className="text-xs font-mono text-gray-500">
                          {formData.bankAccountNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── ACTIONS ── */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <FaTimesCircle className="mr-1" /> Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 text-white ${
                      mode === "loan"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Processing...
                      </div>
                    ) : (
                      <>
                        {mode === "loan" ? <FaUniversity className="mr-1" /> : <FaMoneyBillWave className="mr-1" />} 
                        {submitLabel}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}