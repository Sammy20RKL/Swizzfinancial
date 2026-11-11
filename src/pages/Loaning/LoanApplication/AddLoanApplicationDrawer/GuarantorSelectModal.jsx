import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMemo, useState, useEffect } from "react";

export default function GuarantorSelectModal({
    open,
    onClose,
    customers,
    applicantId,
    allowSelfGuarantee = false,
    selectedGuarantorIds = [],
    onSelect,
}) {
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setIsLoading(true);
            const timer = setTimeout(() => {
                setIsLoading(false);
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setSearch("");
            setIsLoading(false);
        }
    }, [open]);

    // Helper functions to safely access customer data
    const getCustomerId = (customer) => {
        return customer.id || customer.Id || customer.Customer?.Id || "";
    };

    const getCustomerName = (customer) => {
        if (!customer) return "Unknown";
        if (customer.firstName && customer.lastName) {
            return `${customer.firstName} ${customer.lastName}`;
        }
        if (customer.Customer?.IndividualFirstName && customer.Customer?.IndividualLastName) {
            return `${customer.Customer.IndividualFirstName} ${customer.Customer.IndividualLastName}`;
        }
        if (customer.fullName || customer.FullName) {
            return customer.fullName || customer.FullName;
        }
        return "Unknown";
    };

    const getCustomerIdNumber = (customer) => {
        return customer.idNumber || customer.idNumber || customer.Customer?.IndividualIdentityCardNumber || "";
    };

    const getCustomerMemberNumber = (customer) => {
        return customer.memberNumber || customer.Reference2 || customer.Customer?.Reference2 || "";
    };

    const getCustomerPayroll = (customer) => {
        return customer.payrollNumber || customer.Reference3 || customer.Customer?.Reference3 || "";
    };

    const getMemberDeposits = (member) => {
        const accounts = member.accounts || member.Accounts || [];
        return accounts
            .filter(a => 
                (a.productDescription === "DEPOSITS" || a.ProductDescription === "DEPOSITS") && 
                (a.accountType === "Savings" || a.AccountType === "Savings")
            )
            .reduce((sum, a) => sum + (Number(a.balance || a.AccountBalance || 0) || 0), 0);
    };

    const filtered = useMemo(() => {
        if (!customers || !Array.isArray(customers) || customers.length === 0) return [];
        
        // Filter customers based on criteria
        const filteredCustomers = customers.filter(m => {
            const memberId = getCustomerId(m);
            const name = getCustomerName(m).toLowerCase();

            // ❌ prevent applicant ONLY if self-guarantee is NOT allowed
            if (!allowSelfGuarantee && memberId === applicantId) {
                return false;
            }

            // ❌ prevent duplicate guarantors (always)
            if (selectedGuarantorIds.includes(memberId)) {
                return false;
            }

            const text = (
                name + ' ' +
                getCustomerMemberNumber(m) + ' ' +
                getCustomerPayroll(m) + ' ' +
                getCustomerIdNumber(m)
            ).toLowerCase();

            return text.includes(search.toLowerCase());
        });

        // Sort alphabetically by full name
        return filteredCustomers.sort((a, b) => {
            const nameA = getCustomerName(a).toLowerCase();
            const nameB = getCustomerName(b).toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [customers, search, applicantId, allowSelfGuarantee, selectedGuarantorIds]);

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
                        <div
                            className="w-[90vw] max-w-xl bg-white rounded-xl shadow-xl p-4 pointer-events-auto max-h-[90vh] flex flex-col"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        >
                            <h3 className="font-semibold text-lg mb-3 bg-indigo-800 text-white p-3 rounded-lg shadow-md">
                                Select Guarantor
                            </h3>

                            <Input
                                placeholder="Search by name, ID or payroll"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="mb-3"
                            />

                            <div className="flex-1 overflow-y-auto border rounded-lg min-h-[200px] max-h-72">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center p-8 space-y-3">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                        <p className="text-sm text-gray-500">Loading guarantors...</p>
                                    </div>
                                ) : (
                                    <>
                                        {filtered.map((m, idx) => {
                                            const id = getCustomerId(m);
                                            const name = getCustomerName(m);
                                            const deposits = getMemberDeposits(m);
                                            const memberNo = getCustomerMemberNumber(m);
                                            const idNumber = getCustomerIdNumber(m);
                                            
                                            return (
                                                <div
                                                    key={id || idx}
                                                    onClick={() => {
                                                        onSelect(m, deposits);
                                                        onClose();
                                                    }}
                                                    className="p-3 cursor-pointer hover:bg-indigo-50 border-b transition-colors duration-150 last:border-b-0"
                                                >
                                                    <p className="font-medium">{name}</p>
                                                    <p className="text-xs text-gray-500 flex gap-3 flex-wrap">
                                                        {memberNo && <span>Member: {memberNo}</span>}
                                                        {idNumber && <span>ID: {idNumber}</span>}
                                                        <span className="text-green-700 font-semibold">
                                                            Deposits: {deposits.toLocaleString()}
                                                        </span>
                                                    </p>
                                                </div>
                                            );
                                        })}

                                        {filtered.length === 0 && !isLoading && (
                                            <p className="text-center text-sm text-gray-500 p-4">
                                                No available guarantors found
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="flex justify-end mt-4 pt-3 border-t">
                                <Button variant="outline" onClick={onClose}>
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