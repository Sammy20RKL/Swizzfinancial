import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { useState } from "react";

const API_URL = `${import.meta.env.VITE_APP_MEMBERSHIP_URL}`;

export default function MemberExitDetailsDrawer({ open, onClose, exit, refresh }) {
    const [approving, setApproving] = useState(false);
    const [auditing, setAuditing] = useState(false);
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);
    const [showAuditDialog, setShowAuditDialog] = useState(false);
    const [approvalRemarks, setApprovalRemarks] = useState("");
    const [auditRemarks, setAuditRemarks] = useState("");
    const [selectedApprovalOption, setSelectedApprovalOption] = useState(1); // 1 = Approve, 2 = Defer
    const [selectedAuditOption, setSelectedAuditOption] = useState(1); // 1 = Approve, 2 = Defer

    if (!exit) return null;

    const formatDate = (date) =>
        date && date !== "0001-01-01T00:00:00"
            ? new Date(date).toLocaleString()
            : "-";

    const handleApproval = async () => {
        if (!approvalRemarks.trim()) {
            Swal.fire("Warning", "Please enter approval remarks", "warning");
            return;
        }

        setApproving(true);
        try {
            const payload = {
                withdrawalNotificationId: exit.Id,
                approvalOption: selectedApprovalOption,
                approvalRemarks: approvalRemarks
            };

            const response = await fetch(`${API_URL}/api/MemberExit/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.Message || "Approval failed");

            if (data.Success) {
                Swal.fire(
                    "Success", 
                    selectedApprovalOption === 1 ? "Exit approved successfully" : "Exit deferred successfully", 
                    "success"
                );
                setShowApprovalDialog(false);
                setApprovalRemarks("");
                
                // If approved, ask user to audit immediately
                if (selectedApprovalOption === 1) {
                    const result = await Swal.fire({
                        title: "Proceed to Audit?",
                        text: "The exit has been approved. Would you like to audit it now?",
                        icon: "question",
                        showCancelButton: true,
                        confirmButtonText: "Yes, Audit Now",
                        cancelButtonText: "Later",
                        confirmButtonColor: "#3085d6",
                        cancelButtonColor: "#6c757d"
                    });
                    
                    if (result.isConfirmed) {
                        setShowAuditDialog(true);
                    } else {
                        refresh?.();
                        onClose();
                    }
                } else {
                    refresh?.();
                    onClose();
                }
            } else {
                throw new Error(data.Message || "Approval failed");
            }
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setApproving(false);
        }
    };

    const handleAudit = async () => {
        if (!auditRemarks.trim()) {
            Swal.fire("Warning", "Please enter audit remarks", "warning");
            return;
        }

        setAuditing(true);
        try {
            const payload = {
                withdrawalNotificationId: exit.Id,
                auditOption: selectedAuditOption,
                auditRemarks: auditRemarks
            };

            const response = await fetch(`${API_URL}/api/MemberExit/audit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.Message || "Audit failed");

            if (data.Success) {
                Swal.fire(
                    "Success", 
                    selectedAuditOption === 1 ? "Exit verified successfully. Ready for settlement." : "Audit deferred", 
                    "success"
                );
                setShowAuditDialog(false);
                setAuditRemarks("");
                refresh?.();
                onClose();
            } else {
                throw new Error(data.Message || "Audit failed");
            }
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setAuditing(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Overlay */}
                    <motion.div
                        className="fixed inset-0 bg-black z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        className="fixed top-3 right-3 w-[85vw] max-w-[900px] bg-white shadow-2xl z-50 rounded-2xl flex flex-col overflow-y-auto max-h-[90vh]"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        <div className="p-3 m-1 space-y-4">

                            {/* Header */}
                            <div className="flex justify-between bg-indigo-600 p-2 rounded-2xl mb-2 text-white font-semibold">
                                <span className="flex items-center ml-3">
                                    Member Exit Details
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowApprovalDialog(true)}
                                        className="bg-white hover:bg-gray-100"
                                        disabled={approving || auditing}
                                    >
                                        {approving ? "Processing..." : "Approval"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowAuditDialog(true)}
                                        className="bg-white hover:bg-gray-100"
                                        disabled={approving || auditing}
                                    >
                                        {auditing ? "Processing..." : "Audit"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={onClose}
                                        className="text-gray-600"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>

                            {/* Member Information */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-2">
                                <h3 className="font-bold text-white bg-gray-600 p-2 pl-4 rounded-lg mb-4">
                                    Member Information
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span><b>Full Name:</b> {exit.CustomerIndividualFirstName} {exit.CustomerIndividualLastName}</span>
                                    <span><b>Member No:</b> {exit.PaddedCustomerSerialNumber}</span>
                                    <span><b>ID Number:</b> {exit.CustomerIndividualIdentityCardNumber}</span>
                                    <span><b>Gender:</b> {exit.CustomerIndividualGenderDescription}</span>
                                    <span><b>Marital Status:</b> {exit.CustomerIndividualMaritalStatusDescription}</span>
                                    <span><b>Payroll No:</b> {exit.CustomerIndividualPayrollNumbers}</span>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-2">
                                <h3 className="font-bold text-white bg-gray-600 p-2 pl-4 rounded-lg mb-4">
                                    Contact Information
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span><b>Phone:</b> {exit.CustomerAddressMobileLine}</span>
                                    <span><b>Email:</b> {exit.CustomerAddressEmail}</span>
                                    <span><b>City:</b> {exit.CustomerAddressCity}</span>
                                    <span><b>Street:</b> {exit.CustomerAddressStreet}</span>
                                </div>
                            </div>

                            {/* Exit Details */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-2">
                                <h3 className="font-bold text-white bg-gray-600 p-2 pl-4 rounded-lg mb-4">
                                    Exit Details
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span><b>Branch:</b> {exit.BranchDescription}</span>
                                    <span><b>Status:</b> {exit.StatusDescription}</span>
                                    <span><b>Settlement Type:</b> {exit.SettlementTypeDescription}</span>
                                    <span><b>Exit Category:</b> {exit.CategoryDescription || "-"}</span>
                                    <span><b>Created On:</b> {formatDate(exit.CreatedDate)}</span>
                                    <span><b>Maturity Date:</b> {formatDate(exit.MaturityDate)}</span>
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-2">
                                <h3 className="font-bold text-white bg-gray-600 p-2 pl-4 rounded-lg mb-4">
                                    Financial Summary
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span><b>Net Refundable:</b> KES {exit.NetRefundable?.toLocaleString()}</span>
                                    <span><b>Total Loans Guaranteed:</b> {exit.TotalLoansGuaranteed}</span>
                                </div>
                            </div>

                            {/* Remarks */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-2">
                                <h3 className="font-bold text-white bg-gray-600 p-2 pl-4 rounded-lg mb-4">
                                    Remarks
                                </h3>
                                <p className="text-sm">
                                    {exit.Remarks || "No remarks provided"}
                                </p>
                            </div>

                        </div>
                    </motion.div>
                </>
            )}

            {/* Approval Dialog Modal */}
            <AnimatePresence>
                {showApprovalDialog && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !approving && setShowApprovalDialog(false)}
                        />

                        <motion.div
                            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-[400px] max-w-[90vw]"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div className="p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Member Exit Approval
                                </h3>

                                <div className="space-y-2">
                                    <Label>Approval Option</Label>
                                    <select
                                        value={selectedApprovalOption}
                                        onChange={(e) => setSelectedApprovalOption(parseInt(e.target.value))}
                                        className="w-full border rounded px-3 py-2"
                                        disabled={approving}
                                    >
                                        <option value={1}>Approve</option>
                                        <option value={2}>Defer</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Remarks</Label>
                                    <textarea
                                        value={approvalRemarks}
                                        onChange={(e) => setApprovalRemarks(e.target.value)}
                                        className="w-full border rounded px-3 py-2 min-h-[100px]"
                                        placeholder="Enter approval/deferral remarks..."
                                        disabled={approving}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowApprovalDialog(false)}
                                        disabled={approving}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleApproval}
                                        disabled={approving}
                                        className={selectedApprovalOption === 1 ? "bg-green-600 hover:bg-green-700" : "bg-yellow-600 hover:bg-yellow-700"}
                                    >
                                        {approving ? "Processing..." : (selectedApprovalOption === 1 ? "Approve" : "Defer")}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Audit Dialog Modal */}
            <AnimatePresence>
                {showAuditDialog && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !auditing && setShowAuditDialog(false)}
                        />

                        <motion.div
                            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-[400px] max-w-[90vw]"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div className="p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Member Exit Audit
                                </h3>

                                <div className="space-y-2">
                                    <Label>Audit Option</Label>
                                    <select
                                        value={selectedAuditOption}
                                        onChange={(e) => setSelectedAuditOption(parseInt(e.target.value))}
                                        className="w-full border rounded px-3 py-2"
                                        disabled={auditing}
                                    >
                                        <option value={1}>Approve</option>
                                        <option value={2}>Defer</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Remarks</Label>
                                    <textarea
                                        value={auditRemarks}
                                        onChange={(e) => setAuditRemarks(e.target.value)}
                                        className="w-full border rounded px-3 py-2 min-h-[100px]"
                                        placeholder="Enter audit remarks..."
                                        disabled={auditing}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowAuditDialog(false)}
                                        disabled={auditing}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleAudit}
                                        disabled={auditing}
                                        className={selectedAuditOption === 1 ? "bg-green-600 hover:bg-green-700" : "bg-yellow-600 hover:bg-yellow-700"}
                                    >
                                        {auditing ? "Processing..." : (selectedAuditOption === 1 ? "Approve Audit" : "Defer Audit")}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </AnimatePresence>
    );
}