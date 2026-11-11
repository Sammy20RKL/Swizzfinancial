import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Swal from "sweetalert2";

export default function ParentLoanSelectModal({
    open,
    onClose,
    customers = [],
    selectedCustomerId,
    onSelect,
}) {
    const [loading, setLoading] = useState(false);
    const [loans, setLoans] = useState([]);

    // Safe function to get customer ID
    const getCustomerId = (customer) => {
        return customer?.id || customer?.Id || customer?.Customer?.Id || "";
    };

    // Safe function to get member number
    const getMemberNumber = (customer) => {
        if (!customer) return "";
        return customer?.memberNumber || 
               customer?.Reference2 || 
               customer?.MemberNumber || 
               customer?.reference2 || 
               customer?.Customer?.Reference2 || 
               "";
    };

    // Find the selected customer by ID from the customers array
    const selectedCustomer = customers?.find(c => getCustomerId(c) === selectedCustomerId);
    const memberNo = getMemberNumber(selectedCustomer);

    useEffect(() => {
        if (!open || !memberNo) {
            setLoans([]);
            return;
        }

        setLoading(true);
        fetch(
            `${import.meta.env.VITE_APP_LOANING_URL}/api/Loaning/GetAllLoanByMemberNo?MemberNo=${memberNo}`
        )
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                console.log("Raw loans data:", data);
                // Handle different response formats
                let loanList = [];
                if (Array.isArray(data)) {
                    loanList = data;
                } else if (data?.Data && Array.isArray(data.Data)) {
                    loanList = data.Data;
                } else if (data?.data && Array.isArray(data.data)) {
                    loanList = data.data;
                } else if (data?.loans && Array.isArray(data.loans)) {
                    loanList = data.loans;
                } else if (data?.Success && data?.Data) {
                    loanList = data.Data;
                } else if (data?.success && data?.data) {
                    loanList = data.data;
                }
                // Filter out loans without an ID and sort by created date (newest first)
                const filteredLoans = loanList
                    .filter(l => l?.Id || l?.id)
                    .sort((a, b) => {
                        const dateA = a?.CreatedDate || a?.createdDate || a?.Created || a?.created || '';
                        const dateB = b?.CreatedDate || b?.createdDate || b?.Created || b?.created || '';
                        return new Date(dateB) - new Date(dateA);
                    });
                setLoans(filteredLoans);
            })
            .catch((err) => {
                console.error("Error fetching parent loans:", err);
                Swal.fire("Error", "Failed to load parent loans", "error");
                setLoans([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [open, memberNo]);

    // Get loan details safely
    const getLoanId = (loan) => loan?.Id || loan?.id || "";
    const getLoanProductDescription = (loan) => {
        return loan?.LoanProductDescription || 
               loan?.productDescription || 
               loan?.ProductDescription || 
               loan?.description || 
               loan?.Description || 
               "N/A";
    };
    const getLoanBalance = (loan) => {
        const balance = loan?.TotalLoansBalance || 
                        loan?.totalLoansBalance || 
                        loan?.balance || 
                        loan?.Balance || 
                        loan?.loanBalance || 
                        0;
        return Number(balance).toLocaleString();
    };
    const getLoanStatus = (loan) => {
        return loan?.StatusDescription || 
               loan?.statusDescription || 
               loan?.status || 
               loan?.Status || 
               "N/A";
    };
    const getLoanDate = (loan) => {
        const date = loan?.CreatedDate || 
                     loan?.createdDate || 
                     loan?.Created || 
                     loan?.created || 
                     "";
        if (date) {
            return new Date(date).toLocaleDateString();
        }
        return "";
    };
    const getLoanAmount = (loan) => {
        const amount = loan?.Amount || 
                       loan?.amount || 
                       loan?.OriginalLoanAmount || 
                       loan?.originalLoanAmount || 
                       0;
        return Number(amount).toLocaleString();
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop - full screen overlay */}
                    <motion.div
                        className="fixed inset-0 bg-black/50 z-[999]"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Modal - centered on screen */}
                    <motion.div
                        className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Card className="w-[90vw] max-w-md bg-white rounded-xl shadow-xl p-4 pointer-events-auto max-h-[90vh] flex flex-col">
                            <h3 className="font-semibold mb-3 bg-indigo-700 text-white p-2 rounded-lg text-center">
                                Select Parent Loan
                                {memberNo && <span className="block text-xs font-normal text-indigo-200">Member: {memberNo}</span>}
                            </h3>

                            {!memberNo && (
                                <p className="text-sm text-yellow-600 mb-2 bg-yellow-50 p-2 rounded">
                                    ⚠️ Please select a customer first
                                </p>
                            )}

                            {loading && (
                                <div className="flex flex-col items-center justify-center p-8 space-y-3">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    <p className="text-sm text-gray-500">Loading loans…</p>
                                </div>
                            )}

                            {!loading && !memberNo && (
                                <p className="text-sm text-gray-500 text-center py-8">
                                    No customer selected
                                </p>
                            )}

                            {!loading && memberNo && loans.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-sm text-gray-500">No previous loans found for this member</p>
                                    <p className="text-xs text-gray-400 mt-1">Member Number: {memberNo}</p>
                                </div>
                            )}

                            {!loading && loans.length > 0 && (
                                <div className="flex-1 overflow-y-auto max-h-64 space-y-2 min-h-[200px]">
                                    {loans.map((loan, index) => {
                                        const loanId = getLoanId(loan);
                                        const productDesc = getLoanProductDescription(loan);
                                        const balance = getLoanBalance(loan);
                                        const status = getLoanStatus(loan);
                                        const date = getLoanDate(loan);
                                        const amount = getLoanAmount(loan);
                                        
                                        return (
                                            <div
                                                key={loanId || `loan-${index}`}
                                                className="border rounded-md p-3 flex justify-between items-center hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">
                                                        {productDesc}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Balance: {balance} KSH
                                                        {amount > 0 && <span className="ml-2">Original: {amount} KSH</span>}
                                                        {date && <span className="ml-2">Date: {date}</span>}
                                                    </p>
                                                    <p className="text-xs">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                                                            status.toLowerCase().includes('active') || status.toLowerCase().includes('approved') 
                                                                ? 'bg-green-100 text-green-700' 
                                                                : status.toLowerCase().includes('pending') 
                                                                ? 'bg-yellow-100 text-yellow-700'
                                                                : status.toLowerCase().includes('closed') || status.toLowerCase().includes('completed')
                                                                ? 'bg-gray-100 text-gray-700'
                                                                : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            {status}
                                                        </span>
                                                    </p>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    className="ml-2 flex-shrink-0"
                                                    onClick={() => {
                                                        onSelect(loan);
                                                        onClose();
                                                    }}
                                                >
                                                    Select
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="flex justify-end mt-4 pt-3 border-t">
                                <Button variant="outline" onClick={onClose}>
                                    Close
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}