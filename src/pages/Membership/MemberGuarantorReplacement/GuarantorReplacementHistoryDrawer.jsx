import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FaUserShield, FaHistory, FaTimes, FaFileInvoiceDollar, FaIdCard, FaPhone, FaEnvelope } from "react-icons/fa";
import { format } from "date-fns";

export default function GuarantorReplacementHistoryDrawer({ open, onClose, record }) {
    if (!record) return null;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString || dateString === "0001-01-01T00:00:00") return "N/A";
        try {
            return format(new Date(dateString), "dd MMM yyyy, HH:mm");
        } catch {
            return dateString;
        }
    };

    const getAccountTypeInfo = (productCode) => {
        const types = {
            1: { label: "Savings Account", color: "bg-blue-100 text-blue-800" },
            2: { label: "Loan Account", color: "bg-red-100 text-red-800" },
            3: { label: "Investment Account", color: "bg-purple-100 text-purple-800" },
            4: { label: "Microcredit Account", color: "bg-orange-100 text-orange-800" },
            5: { label: "Special Account", color: "bg-teal-100 text-teal-800" },
            9: { label: "Fixed Deposit", color: "bg-indigo-100 text-indigo-800" },
            11: { label: "Recurring Deposit", color: "bg-pink-100 text-pink-800" },
            13: { label: "Education Fund", color: "bg-emerald-100 text-emerald-800" }
        };
        return types[productCode] || { label: "Other Account", color: "bg-gray-100 text-gray-800" };
    };

    const accountType = getAccountTypeInfo(record.CustomerAccountTypeProductCode);

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
                        className="fixed top-3 right-3 w-[85vw] max-w-[600px] bg-white shadow-2xl z-50 rounded-2xl flex flex-col overflow-y-auto max-h-[90vh]"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        <div className="p-3 m-1 space-y-4">
                            {/* Header */}
                            <div className="flex justify-between bg-indigo-600 p-3 rounded-2xl text-white font-semibold">
                                <div className="flex items-center gap-2 ml-3">
                                    <FaHistory className="h-5 w-5" />
                                    <span>Guarantor Details</span>
                                </div>
                                <Button variant="ghost" onClick={onClose} className="text-white hover:text-white hover:bg-indigo-700">
                                    <FaTimes />
                                </Button>
                            </div>

                            {/* Member Information */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-4">
                                <div className="border-b pb-3">
                                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                        <FaUserShield className="text-indigo-600" />
                                        Member Information
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-gray-500 text-xs">Member Number</Label>
                                        <div className="font-mono font-semibold text-indigo-600 mt-1">
                                            {record.PaddedCustomerSerialNumber || "N/A"}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-gray-500 text-xs">Reference Number</Label>
                                        <div className="font-mono text-sm mt-1">
                                            {record.CustomerReference2 || "N/A"}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-gray-500 text-xs">Full Name</Label>
                                        <div className="font-semibold text-gray-800 text-lg mt-1">
                                            {record.CustomerIndividualFirstName} {record.CustomerIndividualLastName}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-gray-500 text-xs flex items-center gap-1">
                                            <FaIdCard size={12} /> ID Number
                                        </Label>
                                        <div className="mt-1">{record.CustomerIndividualIdentityCardNumber || "N/A"}</div>
                                    </div>
                                    <div>
                                        <Label className="text-gray-500 text-xs">ID Type</Label>
                                        <div className="mt-1">{record.CustomerIndividualIdentityCardTypeDescription || "N/A"}</div>
                                    </div>
                                    <div>
                                        <Label className="text-gray-500 text-xs flex items-center gap-1">
                                            <FaPhone size={12} /> Phone
                                        </Label>
                                        <div className="mt-1">{record.CustomerAddressMobileLine || "N/A"}</div>
                                    </div>
                                    <div>
                                        <Label className="text-gray-500 text-xs flex items-center gap-1">
                                            <FaEnvelope size={12} /> Email
                                        </Label>
                                        <div className="mt-1">{record.CustomerAddressEmail || "N/A"}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Account Information */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-4">
                                <div className="border-b pb-3">
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                        <FaFileInvoiceDollar className="text-indigo-600" />
                                        Account Information
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <Label className="text-gray-500 text-xs">Account Type</Label>
                                        <div className="mt-2">
                                            <Badge className={accountType.color}>
                                                {accountType.label}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-gray-500 text-xs">Full Account Number</Label>
                                        <div className="font-mono text-sm bg-gray-100 p-2 rounded mt-1">
                                            {record.FullAccountNumber || "N/A"}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-gray-500 text-xs">Product Code</Label>
                                        <div className="mt-1">{record.CustomerAccountTypeProductCode || "N/A"}</div>
                                    </div>
                                    <div>
                                        <Label className="text-gray-500 text-xs">Product Description</Label>
                                        <div className="mt-1">{record.CustomerAccountTypeTargetProductDescription || "N/A"}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Loan Information */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-4">
                                <div className="border-b pb-3">
                                    <h3 className="font-bold text-gray-800">Loan Information</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-gray-500 text-xs">Loan Product Code</Label>
                                        <div className="mt-1">{record.ScoredLoanDisbursementProductCode || "N/A"}</div>
                                    </div>
                                    <div>
                                        <Label className="text-gray-500 text-xs">Scored Loan Limit</Label>
                                        <div className={`mt-1 font-semibold ${record.ScoredLoanLimit >= 5000000 ? 'text-green-600' : record.ScoredLoanLimit >= 1000000 ? 'text-blue-600' : 'text-orange-600'}`}>
                                            {formatCurrency(record.ScoredLoanLimit)}
                                        </div>
                                    </div>
                                    {record.ScoredLoanLimitRemarks && (
                                        <div className="col-span-2">
                                            <Label className="text-gray-500 text-xs">Loan Limit Remarks</Label>
                                            <div className="mt-1 text-sm text-gray-600">{record.ScoredLoanLimitRemarks}</div>
                                        </div>
                                    )}
                                    {record.ScoredLoanLimitDate && (
                                        <div>
                                            <Label className="text-gray-500 text-xs">Limit Date</Label>
                                            <div className="mt-1">{formatDate(record.ScoredLoanLimitDate)}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Employment & Branch Information */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-4">
                                <div className="border-b pb-3">
                                    <h3 className="font-bold text-gray-800">Employment & Branch</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <Label className="text-gray-500 text-xs">Employer</Label>
                                        <div className="mt-1 font-medium">{record.CustomerStationZoneDivisionEmployerDescription || "N/A"}</div>
                                    </div>
                                    <div>
                                        <Label className="text-gray-500 text-xs">Payroll Number</Label>
                                        <div className="mt-1">{record.CustomerIndividualPayrollNumbers || "N/A"}</div>
                                    </div>
                                    <div>
                                        <Label className="text-gray-500 text-xs">Branch</Label>
                                        <div className="mt-1">{record.BranchDescription || "N/A"}</div>
                                    </div>
                                    <div>
                                        <Label className="text-gray-500 text-xs">Status</Label>
                                        <div className="mt-1">
                                            <Badge variant={record.Status === 0 ? "default" : "secondary"}>
                                                {record.StatusDescription || "Normal"}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-gray-500 text-xs">Record Status</Label>
                                        <div className="mt-1">
                                            <Badge variant="outline">{record.RecordStatusDescription || "N/A"}</Badge>
                                        </div>
                                    </div>
                                    {record.CustomerIsDefaulter && (
                                        <div className="col-span-2">
                                            <div className="bg-red-50 border border-red-200 rounded p-2 text-red-700 text-sm">
                                                ⚠️ This member is marked as a defaulter
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-gray-500 text-xs">Created Date</Label>
                                        <div className="text-sm mt-1">{formatDate(record.CreatedDate)}</div>
                                    </div>
                                    <div>
                                        <Label className="text-gray-500 text-xs">Last Modified</Label>
                                        <div className="text-sm mt-1">{formatDate(record.ModifiedDate)}</div>
                                    </div>
                                    <div>
                                        <Label className="text-gray-500 text-xs">Created By</Label>
                                        <div className="text-sm mt-1">{record.CreatedBy || "System"}</div>
                                    </div>
                                    <div>
                                        <Label className="text-gray-500 text-xs">Modified By</Label>
                                        <div className="text-sm mt-1">{record.ModifiedBy || "N/A"}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Close Button */}
                            <div className="flex justify-end">
                                <Button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700">
                                    Close
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}