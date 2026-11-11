import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, UserCheck, RefreshCw, AlertTriangle } from "lucide-react";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import SelectCustomerModal from "../MemberExit/SelectCustomerModal";
import SelectBranchModal from "../MemberExit/SelectBranchModal";

const API_URL = `${import.meta.env.VITE_APP_MEMBERSHIP_URL}`;

export default function GuarantorReplacementDrawer({ open, onClose, refresh, exitingMemberId }) {
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [substituting, setSubstituting] = useState(false);
    const [selectExitingMemberOpen, setSelectExitingMemberOpen] = useState(false);
    const [selectReplacementOpen, setSelectReplacementOpen] = useState(false);
    const [selectBranchOpen, setSelectBranchOpen] = useState(false);
    
    const [activeGuarantees, setActiveGuarantees] = useState([]);
    const [verificationComplete, setVerificationComplete] = useState(false);
    const [branchCode, setBranchCode] = useState(0);

    const [form, setForm] = useState({
        ExitingMemberCustomerId: "",
        ExitingMemberFullName: "",
        ExitingMemberReference2: "",
        ExitingMemberIndividualIdentityCardNumber: "",
        ReplacementGuarantorCustomerId: "",
        ReplacementGuarantorFullName: "",
        ReplacementGuarantorReference2: "",
        ReplacementGuarantorIndividualIdentityCardNumber: "",
        ReplacementGuarantorAddressMobileLine: "",
        ReplacementGuarantorAddressEmail: "",
        ModuleNavigationItemCode: 0,
        Remarks: "",
    });

    useEffect(() => {
        if (exitingMemberId && open) {
            setForm(prev => ({ ...prev, ExitingMemberCustomerId: exitingMemberId }));
        }
    }, [exitingMemberId, open]);

    useEffect(() => {
        if (!open) {
            resetForm();
        }
    }, [open]);

    const resetForm = () => {
        setForm({
            ExitingMemberCustomerId: "",
            ExitingMemberFullName: "",
            ExitingMemberReference2: "",
            ExitingMemberIndividualIdentityCardNumber: "",
            ReplacementGuarantorCustomerId: "",
            ReplacementGuarantorFullName: "",
            ReplacementGuarantorReference2: "",
            ReplacementGuarantorIndividualIdentityCardNumber: "",
            ReplacementGuarantorAddressMobileLine: "",
            ReplacementGuarantorAddressEmail: "",
            ModuleNavigationItemCode: 0,
            Remarks: "",
        });
        setActiveGuarantees([]);
        setVerificationComplete(false);
        setBranchCode(0);
    };

    const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const handleExitingMemberSelect = (member) => {
        setForm(prev => ({
            ...prev,
            ExitingMemberCustomerId: member.Id,
            ExitingMemberFullName: `${member.IndividualFirstName} ${member.IndividualLastName}`,
            ExitingMemberReference2: member.Reference2 || "",
            ExitingMemberIndividualIdentityCardNumber: member.IndividualIdentityCardNumber || "",
        }));
        setActiveGuarantees([]);
        setVerificationComplete(false);
    };

    const handleReplacementSelect = (member) => {
        setForm(prev => ({
            ...prev,
            ReplacementGuarantorCustomerId: member.Id,
            ReplacementGuarantorFullName: `${member.IndividualFirstName} ${member.IndividualLastName}`,
            ReplacementGuarantorReference2: member.Reference2 || "",
            ReplacementGuarantorIndividualIdentityCardNumber: member.IndividualIdentityCardNumber || "",
            ReplacementGuarantorAddressMobileLine: member.AddressMobileLine || "",
            ReplacementGuarantorAddressEmail: member.AddressEmail || "",
        }));
    };

    const handleBranchSelect = (branch) => {
        setBranchCode(branch.Code);
        setForm(prev => ({ ...prev, ModuleNavigationItemCode: branch.Code }));
    };

    const handleVerifyGuarantees = async () => {
        if (!form.ExitingMemberCustomerId) {
            Swal.fire("Error", "Please select the exiting member first", "error");
            return;
        }

        setVerifying(true);
        try {
            // Use the correct API endpoint
            const response = await fetch(
                `${API_URL}/api/MemberExit/GetLoanGuaranteed?customerId=${form.ExitingMemberCustomerId}`,
                {
                    headers: {
                        "ngrok-skip-browser-warning": "true",
                    },
                }
            );

            const result = await response.json();

            if (!result.Success) {
                throw new Error(result.Message || "Failed to fetch loan guarantees");
            }

            const guarantees = result.Data || [];
            
            // Filter active guarantees (Status = 0 means "Attached")
            // From the data: Status: 0 = Attached, 1 = Released
            const active = guarantees.filter(g => g.Status === 0 || g.StatusDescription === "Attached");

            setActiveGuarantees(active);
            setVerificationComplete(true);

            if (active.length === 0) {
                Swal.fire({
                    title: "No Active Guarantees",
                    text: "This member has no active loan guarantees. No replacement is needed.",
                    icon: "info",
                    confirmButtonColor: "#4f46e5",
                });
            } else {
                Swal.fire({
                    title: `${active.length} Active Guarantee(s) Found`,
                    text: `Member is currently guaranteeing ${active.length} loan(s). Please select a replacement guarantor to proceed.`,
                    icon: "warning",
                    confirmButtonColor: "#4f46e5",
                });
            }
        } catch (err) {
            console.error("Verification error:", err);
            Swal.fire("Error", err.message || "Failed to verify guarantees", "error");
            setVerificationComplete(false);
        } finally {
            setVerifying(false);
        }
    };

    const handleSubstitute = async () => {
        if (!form.ExitingMemberCustomerId) {
            Swal.fire("Error", "Exiting member is required", "error");
            return;
        }

        if (!form.ReplacementGuarantorCustomerId) {
            Swal.fire("Error", "Please select a replacement guarantor", "error");
            return;
        }

        if (form.ExitingMemberCustomerId === form.ReplacementGuarantorCustomerId) {
            Swal.fire("Error", "The exiting member and replacement guarantor cannot be the same person", "error");
            return;
        }

        if (!form.ModuleNavigationItemCode) {
            Swal.fire("Error", "Please select a branch", "error");
            return;
        }

        if (activeGuarantees.length === 0) {
            Swal.fire("Info", "No active guarantees to substitute", "info");
            return;
        }

        setSubstituting(true);

        try {
            const payload = {
                ExitingMemberCustomerId: form.ExitingMemberCustomerId,
                ReplacementGuarantorCustomerId: form.ReplacementGuarantorCustomerId,
                ModuleNavigationItemCode: form.ModuleNavigationItemCode,
            };

            const response = await fetch(`${API_URL}/api/MemberExit/SubstituteGuarantor`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!result.Success) {
                throw new Error(result.Message || result.Errors || "Substitution failed");
            }

            Swal.fire({
                title: "Success!",
                text: result.Message || "Guarantor replacement completed successfully",
                icon: "success",
                confirmButtonColor: "#4f46e5",
            });

            refresh?.();
            onClose();
        } catch (err) {
            Swal.fire({
                title: "Substitution Failed",
                text: err.message,
                icon: "error",
                confirmButtonColor: "#4f46e5",
            });
        } finally {
            setSubstituting(false);
        }
    };

    const getStatusBadge = (status, description) => {
        // Status: 0 = Attached (Active), 1 = Released (Inactive)
        const isActive = status === 0 || description === "Attached";
        return isActive ? (
            <Badge className="bg-yellow-500 hover:bg-yellow-600">Active</Badge>
        ) : (
            <Badge variant="outline" className="text-gray-500">Released</Badge>
        );
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 2
        }).format(amount || 0);
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
                        onClick={loading || substituting ? undefined : onClose}
                    />

                    <motion.div
                        className="fixed top-3 right-3 w-[85vw] max-w-[1000px] bg-white shadow-2xl z-50 rounded-2xl flex flex-col overflow-y-auto max-h-[90vh]"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-3 m-1 space-y-4">
                            <div className="flex justify-between bg-indigo-600 p-3 rounded-2xl text-white font-semibold">
                                <div className="flex items-center gap-2 ml-3">
                                    <UserCheck className="h-5 w-5" />
                                    <span>Guarantor Replacement</span>
                                </div>
                                <Button variant="ghost" onClick={onClose} disabled={substituting} className="text-white hover:text-white hover:bg-indigo-700">
                                    Close
                                </Button>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-4">
                                
                                {/* Step 1 */}
                                <div className="border-b pb-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                                        <h3 className="font-semibold text-gray-800">Select Exiting Member (Guarantor to be Released)</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Exiting Member</Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full justify-start bg-white"
                                                onClick={() => setSelectExitingMemberOpen(true)}
                                                disabled={substituting}
                                            >
                                                {form.ExitingMemberFullName || "Click to select member"}
                                            </Button>
                                        </div>
                                        <div>
                                            <Label>Member Number</Label>
                                            <Input value={form.ExitingMemberReference2} readOnly className="bg-gray-100" />
                                        </div>
                                        <div>
                                            <Label>ID Number</Label>
                                            <Input value={form.ExitingMemberIndividualIdentityCardNumber} readOnly className="bg-gray-100" />
                                        </div>
                                        <div className="flex items-end">
                                            <Button
                                                onClick={handleVerifyGuarantees}
                                                disabled={!form.ExitingMemberCustomerId || verifying || substituting}
                                                className="bg-indigo-600 hover:bg-indigo-700 w-full"
                                            >
                                                {verifying ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : <><AlertCircle className="mr-2 h-4 w-4" /> Verify Guarantees</>}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Guarantees List */}
                                {verificationComplete && activeGuarantees.length > 0 && (
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="bg-amber-50 p-3 border-b">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                                                <h3 className="font-semibold text-amber-800">Active Guarantees ({activeGuarantees.length})</h3>
                                            </div>
                                            <p className="text-xs text-amber-600 mt-1">
                                                These loans will be transferred to the replacement guarantor
                                            </p>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-100 sticky top-0">
                                                    <tr>
                                                        <th className="text-left p-2">Loan Number</th>
                                                        <th className="text-left p-2">Borrower</th>
                                                        <th className="text-right p-2">Loan Amount</th>
                                                        <th className="text-right p-2">Amount Guaranteed</th>
                                                        <th className="text-center p-2">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {activeGuarantees.map((guarantee) => (
                                                        <tr key={guarantee.Id} className="border-t hover:bg-gray-50">
                                                            <td className="p-2 font-mono text-xs">
                                                                {guarantee.LoanCasePaddedCaseNumber || guarantee.LoanCase?.PaddedCaseNumber || "N/A"}
                                                            </td>
                                                            <td className="p-2">
                                                                {guarantee.LoaneeCustomerIndividualFirstName && guarantee.LoaneeCustomerIndividualLastName 
                                                                    ? `${guarantee.LoaneeCustomerIndividualFirstName} ${guarantee.LoaneeCustomerIndividualLastName}`
                                                                    : guarantee.LoanCase?.Customer?.IndividualFirstName || "N/A"}
                                                            </td>
                                                            <td className="p-2 text-right">
                                                                {formatCurrency(guarantee.LoanCaseAmountApplied || guarantee.LoanCase?.AmountApplied || 0)}
                                                            </td>
                                                            <td className="p-2 text-right">
                                                                {formatCurrency(guarantee.AmountGuaranteed || 0)}
                                                            </td>
                                                            <td className="p-2 text-center">
                                                                {getStatusBadge(guarantee.Status, guarantee.StatusDescription)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                             </table>
                                        </div>
                                    </div>
                                )}

                                {/* No Active Guarantees */}
                                {verificationComplete && activeGuarantees.length === 0 && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                                        <CheckCircle className="h-6 w-6 text-green-600" />
                                        <div>
                                            <p className="font-semibold text-green-800">No Active Guarantees</p>
                                            <p className="text-sm text-green-700">This member is not currently guaranteeing any loans. No replacement is needed.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2 */}
                                {verificationComplete && activeGuarantees.length > 0 && (
                                    <div className="border-b pb-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                                            <h3 className="font-semibold text-gray-800">Select Replacement Guarantor</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Replacement Guarantor</Label>
                                                <Button type="button" variant="outline" className="w-full justify-start bg-white" onClick={() => setSelectReplacementOpen(true)} disabled={substituting}>
                                                    {form.ReplacementGuarantorFullName || "Click to select replacement"}
                                                </Button>
                                            </div>
                                            <div>
                                                <Label>Member Number</Label>
                                                <Input value={form.ReplacementGuarantorReference2} readOnly className="bg-gray-100" />
                                            </div>
                                            <div>
                                                <Label>ID Number</Label>
                                                <Input value={form.ReplacementGuarantorIndividualIdentityCardNumber} readOnly className="bg-gray-100" />
                                            </div>
                                            <div>
                                                <Label>Phone</Label>
                                                <Input value={form.ReplacementGuarantorAddressMobileLine} readOnly className="bg-gray-100" />
                                            </div>
                                            <div className="col-span-2">
                                                <Label>Email</Label>
                                                <Input value={form.ReplacementGuarantorAddressEmail} readOnly className="bg-gray-100" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3 */}
                                {verificationComplete && activeGuarantees.length > 0 && (
                                    <div className="border-b pb-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                                            <h3 className="font-semibold text-gray-800">Branch Information</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Button variant="secondary" className="bg-gray-500 hover:bg-gray-600 text-white w-full" onClick={() => setSelectBranchOpen(true)} disabled={substituting}>
                                                    Select Branch
                                                </Button>
                                            </div>
                                            <div>
                                                <Label>Branch Code</Label>
                                                <Input value={branchCode || ""} readOnly className="bg-gray-100" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Remarks */}
                                {verificationComplete && activeGuarantees.length > 0 && (
                                    <div>
                                        <Label>Remarks (Optional)</Label>
                                        <Textarea value={form.Remarks} onChange={(e) => update("Remarks", e.target.value)} placeholder="Enter any additional notes about the guarantor replacement" rows={3} disabled={substituting} />
                                    </div>
                                )}

                                {/* Warning */}
                                {verificationComplete && activeGuarantees.length > 0 && form.ReplacementGuarantorCustomerId && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                        <p className="text-sm text-yellow-800 flex items-start gap-2">
                                            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                            <span><strong>Confirmation Required:</strong> The replacement guarantor must have sufficient Deposit, not exceed their maximum guarantee limit, and be an active member in good standing to qualify as a guarantor.</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            {verificationComplete && activeGuarantees.length > 0 && (
                                <div className="flex justify-end gap-3">
                                    <Button variant="outline" onClick={onClose} disabled={substituting}>Cancel</Button>
                                    <Button onClick={handleSubstitute} disabled={substituting || !form.ReplacementGuarantorCustomerId || !form.ModuleNavigationItemCode} className="bg-green-600 hover:bg-green-700">
                                        {substituting ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : <><RefreshCw className="mr-2 h-4 w-4" /> Substitute Guarantor</>}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}

            <SelectCustomerModal open={selectExitingMemberOpen} onClose={() => setSelectExitingMemberOpen(false)} onSelect={handleExitingMemberSelect} />
            <SelectCustomerModal open={selectReplacementOpen} onClose={() => setSelectReplacementOpen(false)} onSelect={handleReplacementSelect} />
            <SelectBranchModal open={selectBranchOpen} onClose={() => setSelectBranchOpen(false)} onSelect={handleBranchSelect} />
        </AnimatePresence>
    );
}