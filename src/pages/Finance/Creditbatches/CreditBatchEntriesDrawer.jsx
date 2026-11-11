import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    FaChevronLeft,
    FaChevronRight,
    FaSpinner,
    FaList,
    FaFileExcel,
    FaChevronDown,
    FaChevronUp,
    FaExclamationTriangle,
    FaTimes,
    FaUser,
    FaMoneyBillWave,
    FaInfoCircle,
    FaCheckCircle,
} from "react-icons/fa";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function CreditBatchEntriesDrawer({
    open,
    onClose,
    creditBatchId,
    batch,
    onBatchPosted,
}) {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [batchStatus, setBatchStatus] = useState(null);
    const [batchStatusDescription, setBatchStatusDescription] = useState("");
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState(null);
    const [expandedMember, setExpandedMember] = useState(null);
    const [hasErrors, setHasErrors] = useState(false);
    const [errorCount, setErrorCount] = useState(0);
    
    // Errors/Discrepancies state
    const [showErrorsModal, setShowErrorsModal] = useState(false);
    const [discrepancies, setDiscrepancies] = useState([]);
    const [discrepanciesSummary, setDiscrepanciesSummary] = useState(null);
    const [loadingDiscrepancies, setLoadingDiscrepancies] = useState(false);
    const [discrepancyError, setDiscrepancyError] = useState(null);
    
    // Pagination state
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 50,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    });

    const fetchEntries = async (page = 1) => {
        if (!creditBatchId) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const url = `${import.meta.env.VITE_APP_FIN_URL}/api/values/creditbatch/${creditBatchId}/entries?page=${page}&pageSize=50`;
            console.log("Fetching entries from:", url);
            
            const response = await fetch(url, {
                headers: { "ngrok-skip-browser-warning": "true" }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("Entries API Response:", data);
            
            // Handle the response structure
            if (data.Success && data.Data) {
                // New structure with Data wrapper
                setEntries(data.Data.Members || []);
                setSummary(data.Data.Summary || null);
                setPagination({
                    page: data.Data.Page || 1,
                    pageSize: data.Data.PageSize || 50,
                    totalCount: data.Data.TotalCount || 0,
                    totalPages: data.Data.TotalPages || 0,
                    hasNextPage: data.Data.HasNextPage || false,
                    hasPreviousPage: data.Data.HasPreviousPage || false,
                });
                
                // Check if any entries have errors
                const members = data.Data.Members || [];
                const hasErrorEntries = members.some(m => m.status === 2 || m.statusDescription === "Error");
                setHasErrors(hasErrorEntries);
                
                // Count error entries
                const errorEntries = members.filter(m => m.status === 2 || m.statusDescription === "Error");
                setErrorCount(errorEntries.length);
                
            } else if (data.Members) {
                // Alternative structure without Data wrapper
                setEntries(data.Members || []);
                setSummary(data.Summary || null);
                setPagination({
                    page: data.Page || 1,
                    pageSize: data.PageSize || 50,
                    totalCount: data.TotalCount || 0,
                    totalPages: data.TotalPages || 0,
                    hasNextPage: data.HasNextPage || false,
                    hasPreviousPage: data.HasPreviousPage || false,
                });
                
                const members = data.Members || [];
                const hasErrorEntries = members.some(m => m.status === 2 || m.statusDescription === "Error");
                setHasErrors(hasErrorEntries);
                const errorEntries = members.filter(m => m.status === 2 || m.statusDescription === "Error");
                setErrorCount(errorEntries.length);
                
            } else if (Array.isArray(data)) {
                // Old structure - array of entries
                setEntries(data);
                setSummary(null);
                setPagination({
                    page: 1,
                    pageSize: data.length,
                    totalCount: data.length,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPreviousPage: false,
                });
            } else {
                console.warn("Unexpected data format:", data);
                setEntries([]);
            }
        } catch (err) {
            console.error("Error fetching entries:", err);
            setError(err.message || "Failed to load entries");
            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchDiscrepancies = async () => {
        if (!creditBatchId) return;
        
        setLoadingDiscrepancies(true);
        setDiscrepancyError(null);
        
        try {
            const url = `${import.meta.env.VITE_APP_FIN_URL}/api/values/creditbatch/${creditBatchId}/discrepancies`;
            console.log("Fetching discrepancies from:", url);
            
            const response = await fetch(url, {
                headers: { "ngrok-skip-browser-warning": "true" }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("Discrepancies API Response:", data);
            
            if (data.Success && data.Data) {
                setDiscrepancies(data.Data.Records || []);
                setDiscrepanciesSummary({
                    totalCount: data.Data.TotalCount || 0,
                    errorCount: data.Data.ErrorCount || 0,
                    auditCount: data.Data.AuditCount || 0,
                    batchId: data.Data.BatchId,
                });
            } else {
                setDiscrepancies([]);
                setDiscrepancyError(data.Message || "Failed to fetch discrepancies");
            }
        } catch (err) {
            console.error("Error fetching discrepancies:", err);
            setDiscrepancyError(err.message || "Failed to load discrepancies");
            setDiscrepancies([]);
        } finally {
            setLoadingDiscrepancies(false);
        }
    };

    const handleViewErrors = () => {
        setShowErrorsModal(true);
        fetchDiscrepancies();
    };

    useEffect(() => {
        if (!open || !creditBatchId) return;
        fetchEntries(1);
    }, [open, creditBatchId]);

    useEffect(() => {
        if (batch) {
            // Update status from batch prop
            setBatchStatus(batch.Status);
            setBatchStatusDescription(batch.StatusDescription || "");
            
            // Also check if batch has errors
            if (batch.HasErrors !== undefined) {
                setHasErrors(batch.HasErrors);
            }
            if (batch.ErrorCount !== undefined) {
                setErrorCount(batch.ErrorCount);
            }
        }
    }, [batch]);

    const handlePostBatch = async () => {
        const result = await Swal.fire({
            title: "Post Credit Batch?",
            text: "This action will post the batch and cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Post",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#4f46e5",
        });

        if (!result.isConfirmed) return;

        try {
            Swal.fire({
                title: "Posting...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const res = await fetch(
                `${import.meta.env.VITE_APP_FIN_URL}/api/values/creditbatch/${creditBatchId}/post`,
                { 
                    method: "POST",
                    headers: { "ngrok-skip-browser-warning": "true" }
                }
            );

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || "Failed to post batch");

            // Update status to Posted (2)
            setBatchStatus(2);
            setBatchStatusDescription("Posted");
            if (onBatchPosted) onBatchPosted(creditBatchId, 2, "Posted");

            // Re-fetch entries
            fetchEntries(pagination.page);

            Swal.fire("Success", "Credit batch posted successfully", "success");
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > pagination.totalPages) return;
        fetchEntries(newPage);
    };

    const toggleMemberExpand = (customerId) => {
        setExpandedMember(expandedMember === customerId ? null : customerId);
    };

    const handleExportToExcel = () => {
        if (!entries || entries.length === 0) {
            Swal.fire("No Data", "No entries to export", "info");
            return;
        }

        try {
            const exportData = entries.map((member, index) => ({
                "#": index + 1,
                "Member Name": member.memberName || "N/A",
                "Payroll Number": member.payrollNumber || "-",
                "Member Number": member.memberNumber || "-",
                "PF Number": member.pfNumber || "-",
                "Mobile": member.mobile || "-",
                "Entries": member.entryCount || 0,
                "Total Principal": member.totalPrincipal || 0,
                "Total Interest": member.totalInterest || 0,
                "Total Amount": member.totalAmount || 0,
                "Status": member.statusDescription || "Imported",
                "Last Reference": member.lastReference || "-",
                "Last Entry Date": member.lastEntryDate ? new Date(member.lastEntryDate).toLocaleString() : "-",
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Batch Entries");

            const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
            const file = new Blob([excelBuffer], { 
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
            });
            saveAs(file, `CreditBatch_${creditBatchId}_Entries.xlsx`);

            Swal.fire("Success", "Export completed successfully", "success");
        } catch (err) {
            console.error("Export error:", err);
            Swal.fire("Error", "Failed to export data", "error");
        }
    };

    const handleExportErrorsToExcel = () => {
        if (!discrepancies || discrepancies.length === 0) {
            Swal.fire("No Data", "No errors to export", "info");
            return;
        }

        try {
            const exportData = discrepancies.map((record, index) => ({
                "#": index + 1,
                "Payroll Number": record.payrollNumber || "-",
                "Member Name": record.memberName || "N/A",
                "Mobile": record.memberMobile || "-",
                "Amount": record.amount || 0,
                "Product Code": record.productCode || "-",
                "Reference": record.reference || "-",
                "Error Category": record.errorCategory || "-",
                "Remarks": record.remarks || "-",
                "Solution": record.solution || "-",
                "Status": record.isError ? "Error" : "Audit",
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Discrepancies");

            const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
            const file = new Blob([excelBuffer], { 
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
            });
            saveAs(file, `CreditBatch_${creditBatchId}_Errors.xlsx`);

            Swal.fire("Success", "Export completed successfully", "success");
        } catch (err) {
            console.error("Export error:", err);
            Swal.fire("Error", "Failed to export data", "error");
        }
    };

    const formatCurrency = (amount) => {
        return (amount || 0).toLocaleString("en-KE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // Determine status based on multiple sources
    const getStatusInfo = () => {
        // If we have batchStatus from the batch prop or update, use it
        if (batchStatus !== null) {
            // Check if there are errors in the entries
            if (hasErrors) {
                return {
                    label: "Has Errors",
                    color: "bg-red-500",
                    textColor: "text-white",
                    description: `Has ${errorCount} errors`
                };
            }
            
            // Status mapping
            const statusMap = {
                0: { label: "Draft", color: "bg-gray-500", textColor: "text-white", description: "Draft" },
                1: { label: "Pending", color: "bg-yellow-500", textColor: "text-white", description: "Pending Approval" },
                2: { label: "Posted", color: "bg-green-600", textColor: "text-white", description: "Posted" },
                3: { label: "Rejected", color: "bg-red-600", textColor: "text-white", description: "Rejected" },
                4: { label: "Cancelled", color: "bg-gray-600", textColor: "text-white", description: "Cancelled" },
            };
            
            const statusInfo = statusMap[batchStatus] || statusMap[1];
            return {
                label: statusInfo.label,
                color: statusInfo.color,
                textColor: statusInfo.textColor,
                description: statusInfo.description
            };
        }
        
        // Fallback to batch prop
        if (batch) {
            const statusMap = {
                0: { label: "Draft", color: "bg-gray-500", textColor: "text-white" },
                1: { label: "Pending", color: "bg-yellow-500", textColor: "text-white" },
                2: { label: "Posted", color: "bg-green-600", textColor: "text-white" },
                3: { label: "Rejected", color: "bg-red-600", textColor: "text-white" },
                4: { label: "Cancelled", color: "bg-gray-600", textColor: "text-white" },
            };
            
            const statusInfo = statusMap[batch.Status] || statusMap[1];
            return {
                label: statusInfo.label,
                color: statusInfo.color,
                textColor: statusInfo.textColor,
                description: batch.StatusDescription || statusInfo.label
            };
        }
        
        // Default
        return {
            label: "Unknown",
            color: "bg-gray-500",
            textColor: "text-white",
            description: "Unknown"
        };
    };

    const statusInfo = getStatusInfo();

    // Get status color for error records
    const getErrorStatusColor = (isError) => {
        return isError ? "bg-red-100 text-red-700 border-red-300" : "bg-yellow-100 text-yellow-700 border-yellow-300";
    };

    return (
        <>
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
                            className="fixed top-5 right-3 w-[1200px] max-w-[95vw] bg-white shadow-xl z-50 rounded-2xl p-3"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "tween", duration: 0.3 }}
                        >
                            {/* Header */}
                            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl mb-4">
                                <div className="flex items-center gap-3">
                                    <h2 className="font-bold text-lg text-white">
                                        Credit Batch Entries
                                    </h2>
                                    {batch && (
                                        <span
                                            className={`text-xs px-3 py-1 rounded-full text-white font-semibold ${statusInfo.color}`}
                                            title={statusInfo.description}
                                        >
                                            {statusInfo.label}
                                        </span>
                                    )}
                                    {hasErrors && errorCount > 0 && (
                                        <span className="text-xs px-3 py-1 rounded-full bg-red-500 text-white font-semibold">
                                            {errorCount} Errors
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* View Errors Button */}
                                    <Button
                                        size="sm"
                                        className="bg-red-500 hover:bg-red-400 text-white"
                                        onClick={handleViewErrors}
                                    >
                                        <FaExclamationTriangle className="mr-1" /> View Errors
                                    </Button>
                                    {batchStatus === 1 && (
                                        <Button
                                            size="sm"
                                            className="bg-green-500 hover:bg-green-400 text-white"
                                            onClick={handlePostBatch}
                                        >
                                            Post Batch
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-blue-500 hover:bg-blue-400 text-white border-0"
                                        onClick={handleExportToExcel}
                                    >
                                        <FaFileExcel className="mr-1" /> Export
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onClose}
                                        className="bg-white hover:bg-gray-100"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>

                            {/* Summary Cards */}
                            {summary && (
                                <div className="grid grid-cols-4 gap-4 mb-4">
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                        <p className="text-xs text-blue-600 font-medium">Total Members</p>
                                        <p className="text-xl font-bold text-blue-700">{summary.TotalMembers}</p>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                        <p className="text-xs text-green-600 font-medium">Total Entries</p>
                                        <p className="text-xl font-bold text-green-700">{summary.TotalEntries}</p>
                                    </div>
                                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                        <p className="text-xs text-purple-600 font-medium">Total Principal</p>
                                        <p className="text-xl font-bold text-purple-700">KES {formatCurrency(summary.TotalPrincipal)}</p>
                                    </div>
                                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                                        <p className="text-xs text-amber-600 font-medium">Total Amount</p>
                                        <p className="text-xl font-bold text-amber-700">KES {formatCurrency(summary.TotalAmount)}</p>
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                    <p className="text-red-600">⚠️ {error}</p>
                                    <Button 
                                        size="sm" 
                                        className="mt-2 bg-red-500 hover:bg-red-400 text-white"
                                        onClick={() => fetchEntries(pagination.page)}
                                    >
                                        Retry
                                    </Button>
                                </div>
                            )}

                            {/* Content */}
                            <div className="p-4 max-h-[60vh] overflow-y-auto">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <FaSpinner className="animate-spin text-indigo-600 text-3xl mr-3" />
                                        <p className="text-gray-500">Loading entries...</p>
                                    </div>
                                ) : entries.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500 text-lg">No entries found</p>
                                        <p className="text-gray-400 text-sm mt-1">This batch has no entries yet</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Table Header */}
                                        <div className="grid grid-cols-8 gap-3 bg-gray-700 text-white p-3 rounded-lg font-semibold text-sm mb-2">
                                            <span className="col-span-2">Member</span>
                                            <span>Payroll No</span>
                                            <span>Member No</span>
                                            <span>Entries</span>
                                            <span>Total Amount</span>
                                            <span>Status</span>
                                            <span className="text-center">Actions</span>
                                        </div>

                                        {/* Rows */}
                                        {entries.map((member) => (
                                            <div key={member.customerId} className="mb-1">
                                                <div
                                                    className={`grid grid-cols-8 gap-3 p-3 rounded-lg text-sm border hover:shadow-md transition-all cursor-pointer ${
                                                        member.status === 2 || member.statusDescription === "Error"
                                                            ? "bg-red-50 hover:bg-red-100 border-red-300"
                                                            : "bg-gray-50 hover:bg-gray-100"
                                                    }`}
                                                    onClick={() => toggleMemberExpand(member.customerId)}
                                                >
                                                    <span className={`col-span-2 font-medium truncate ${
                                                        member.status === 2 || member.statusDescription === "Error"
                                                            ? "text-red-700"
                                                            : "text-indigo-700"
                                                    }`}>
                                                        {member.memberName || "N/A"}
                                                        {member.status === 2 || member.statusDescription === "Error" && (
                                                            <span className="ml-1 text-xs text-red-500">⚠️</span>
                                                        )}
                                                    </span>

                                                    <span className="text-gray-600">
                                                        {member.payrollNumber || "-"}
                                                    </span>

                                                    <span className="text-gray-600">
                                                        {member.memberNumber || "-"}
                                                    </span>

                                                    <span className="text-center font-semibold">
                                                        {member.entryCount || 0}
                                                    </span>

                                                    <span className="font-semibold text-indigo-600">
                                                        KES {formatCurrency(member.totalAmount || 0)}
                                                    </span>

                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs text-center h-7 w-20 ${
                                                            member.status === 2 || member.statusDescription === "Error"
                                                                ? "bg-red-500 text-white"
                                                                : member.status === 0 || member.status === 1
                                                                ? "bg-yellow-500 text-white"
                                                                : "bg-green-600 text-white"
                                                        }`}
                                                    >
                                                        {member.statusDescription || "Imported"}
                                                    </span>

                                                    <span className="text-center">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border-indigo-300"
                                                        >
                                                            {expandedMember === member.customerId ? (
                                                                <FaChevronUp />
                                                            ) : (
                                                                <FaChevronDown />
                                                            )}
                                                        </Button>
                                                    </span>
                                                </div>

                                                {/* Expanded Account Breakdown */}
                                                {expandedMember === member.customerId && member.accountBreakdown && member.accountBreakdown.length > 0 && (
                                                    <div className="ml-8 mt-1 mb-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                                        <h5 className="font-semibold text-indigo-700 text-sm mb-2">Account Breakdown</h5>
                                                        <div className="grid grid-cols-6 gap-2 text-xs">
                                                            <span className="font-semibold text-gray-600">Account</span>
                                                            <span className="font-semibold text-gray-600">GL Code</span>
                                                            <span className="font-semibold text-gray-600">Product</span>
                                                            <span className="font-semibold text-gray-600 text-right">Principal</span>
                                                            <span className="font-semibold text-gray-600 text-right">Amount</span>
                                                            <span className="font-semibold text-gray-600">Reference</span>
                                                        </div>
                                                        {member.accountBreakdown.map((item, idx) => (
                                                            <div key={idx} className="grid grid-cols-6 gap-2 text-xs py-1 border-b border-indigo-100 last:border-0">
                                                                <span className="font-medium text-indigo-600 truncate">
                                                                    {item.glAccountName || "N/A"}
                                                                </span>
                                                                <span className="text-gray-600">{item.glAccountCode || "-"}</span>
                                                                <span className="text-gray-600">{item.targetProductCode || "-"}</span>
                                                                <span className="text-right font-semibold text-green-600">
                                                                    KES {formatCurrency(item.principal)}
                                                                </span>
                                                                <span className="text-right font-semibold text-indigo-600">
                                                                    KES {formatCurrency(item.amount)}
                                                                </span>
                                                                <span className="text-gray-500 truncate" title={item.reference}>
                                                                    {item.reference || "-"}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {member.mobile && (
                                                            <div className="mt-2 text-xs text-gray-500">
                                                                📱 {member.mobile} • Last: {member.lastEntryDate ? new Date(member.lastEntryDate).toLocaleString() : "N/A"}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Pagination */}
                                        {pagination.totalPages > 1 && (
                                            <div className="flex items-center justify-between mt-4 pt-3 border-t">
                                                <span className="text-sm text-gray-500">
                                                    Showing {((pagination.page - 1) * pagination.pageSize) + 1} -{" "}
                                                    {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of{" "}
                                                    {pagination.totalCount} entries
                                                </span>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handlePageChange(pagination.page - 1)}
                                                        disabled={!pagination.hasPreviousPage}
                                                    >
                                                        <FaChevronLeft className="mr-1" /> Previous
                                                    </Button>
                                                    <span className="flex items-center px-3 text-sm">
                                                        Page {pagination.page} of {pagination.totalPages}
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handlePageChange(pagination.page + 1)}
                                                        disabled={!pagination.hasNextPage}
                                                    >
                                                        Next <FaChevronRight className="ml-1" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Errors/Discrepancies Modal */}
            <AnimatePresence>
                {showErrorsModal && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/60 z-[60]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowErrorsModal(false)}
                        />
                        <motion.div
                            className="fixed z-[60] top-1/2 left-1/2 w-[1100px] max-w-[95vw] max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col"
                            initial={{ scale: 0.9, opacity: 0, y: "-50%", x: "-50%" }}
                            animate={{ scale: 1, opacity: 1, y: "-50%", x: "-50%" }}
                            exit={{ scale: 0.9, opacity: 0, y: "-50%", x: "-50%" }}
                            style={{ transform: "translate(-50%, -50%)" }}
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-4 border-b bg-red-600 rounded-t-xl">
                                <div className="flex items-center gap-3">
                                    <FaExclamationTriangle className="text-white text-xl" />
                                    <h3 className="text-lg font-semibold text-white">
                                        Discrepancies / Errors
                                    </h3>
                                    {discrepanciesSummary && (
                                        <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                                            {discrepanciesSummary.errorCount} errors
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {discrepancies.length > 0 && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-blue-500 hover:bg-blue-400 text-white border-0"
                                            onClick={handleExportErrorsToExcel}
                                        >
                                            <FaFileExcel className="mr-1" /> Export Errors
                                        </Button>
                                    )}
                                    <button
                                        onClick={() => setShowErrorsModal(false)}
                                        className="text-white hover:text-gray-200 p-1"
                                    >
                                        <FaTimes size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {loadingDiscrepancies ? (
                                    <div className="flex items-center justify-center py-12">
                                        <FaSpinner className="animate-spin text-red-600 text-3xl mr-3" />
                                        <p className="text-gray-500">Loading discrepancies...</p>
                                    </div>
                                ) : discrepancyError ? (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-red-600">⚠️ {discrepancyError}</p>
                                    </div>
                                ) : discrepancies.length === 0 ? (
                                    <div className="text-center py-12">
                                        <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
                                        <p className="text-gray-600 text-lg">No discrepancies found</p>
                                        <p className="text-gray-400 text-sm">All records were processed successfully</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Summary Cards */}
                                        {discrepanciesSummary && (
                                            <div className="grid grid-cols-3 gap-4 mb-4">
                                                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                                    <p className="text-xs text-red-600 font-medium">Total Discrepancies</p>
                                                    <p className="text-xl font-bold text-red-700">{discrepanciesSummary.totalCount}</p>
                                                </div>
                                                <div className="bg-rose-50 p-3 rounded-lg border border-rose-200">
                                                    <p className="text-xs text-rose-600 font-medium">Errors</p>
                                                    <p className="text-xl font-bold text-rose-700">{discrepanciesSummary.errorCount}</p>
                                                </div>
                                                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                                                    <p className="text-xs text-amber-600 font-medium">Audit Logs</p>
                                                    <p className="text-xl font-bold text-amber-700">{discrepanciesSummary.auditCount}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Table */}
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 border">#</th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 border">Payroll</th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 border">Member</th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 border">Amount</th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 border">Product</th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 border">Category</th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 border">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {discrepancies.map((record, index) => (
                                                        <tr key={index} className="hover:bg-gray-50 border-b">
                                                            <td className="px-4 py-2 text-sm text-gray-600 border">{index + 1}</td>
                                                            <td className="px-4 py-2 text-sm font-mono text-gray-700 border">
                                                                {record.payrollNumber || "-"}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-700 border">
                                                                {record.memberName || "N/A"}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm font-semibold text-red-600 border">
                                                                KES {formatCurrency(record.amount)}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-600 border">
                                                                {record.productCode || "-"}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm border">
                                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
                                                                    {record.errorCategory || "Unknown"}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2 text-sm border">
                                                                <span className={`px-2 py-1 rounded-full text-xs border ${getErrorStatusColor(record.isError)}`}>
                                                                    {record.isError ? "Error" : "Audit"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Detail View for Selected Error */}
                                        <div className="mt-4">
                                            <h5 className="font-semibold text-gray-700 mb-2">Error Details</h5>
                                            <div className="grid grid-cols-1 gap-3">
                                                {discrepancies.slice(0, 5).map((record, index) => (
                                                    <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <p className="text-sm font-semibold text-gray-700">
                                                                    {record.payrollNumber} - {record.memberName || "Unknown Member"}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    <span className="font-medium">Remarks:</span> {record.remarks}
                                                                </p>
                                                                {record.solution && (
                                                                    <p className="text-xs text-blue-600 mt-1">
                                                                        <span className="font-medium">Solution:</span> {record.solution}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-red-500 font-semibold ml-2">
                                                                KES {formatCurrency(record.amount)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {discrepancies.length > 5 && (
                                                    <p className="text-sm text-gray-500 text-center">
                                                        Showing 5 of {discrepancies.length} errors. Download Excel for full list.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end p-4 border-t bg-gray-50 rounded-b-xl">
                                <Button
                                    onClick={() => setShowErrorsModal(false)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Close
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}