import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMemo, useState, useEffect } from "react";

export default function CustomerSelectModal({
    open,
    onClose,
    customers,
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
        }
    }, [open]);

    // Debug: Log customers when they change
    useEffect(() => {
        if (customers && Array.isArray(customers)) {
            console.log("CustomerSelectModal - Customers received:", customers.length);
            if (customers.length > 0) {
                console.log("First customer sample:", customers[0]);
            }
        }
    }, [customers]);

    // Get customer name from various possible structures
    const getCustomerName = (customer) => {
        if (!customer) return "Unknown";
        // New flat structure
        if (customer.firstName && customer.lastName) {
            return `${customer.firstName} ${customer.lastName}`;
        }
        // Old nested structure
        if (customer.Customer?.IndividualFirstName && customer.Customer?.IndividualLastName) {
            return `${customer.Customer.IndividualFirstName} ${customer.Customer.IndividualLastName}`;
        }
        // Full name field
        if (customer.fullName || customer.FullName) {
            return customer.fullName || customer.FullName;
        }
        return "Unknown";
    };

    const getCustomerId = (customer) => {
        return customer.id || customer.Id || customer.Customer?.Id || "";
    };

    const getCustomerIdNumber = (customer) => {
        return customer.idNumber || customer.IndividualIdentityCardNumber || customer.Customer?.IndividualIdentityCardNumber || "";
    };

    const getCustomerMemberNumber = (customer) => {
        return customer.memberNumber || customer.Reference2 || customer.Customer?.Reference2 || "";
    };

    const getCustomerPayroll = (customer) => {
        return customer.payrollNumber || customer.Reference3 || customer.Customer?.Reference3 || "";
    };

    // Filter and sort customers
    const filtered = useMemo(() => {
        if (!customers || !Array.isArray(customers) || customers.length === 0) return [];
        
        // Sort customers alphabetically by full name
        const sortedCustomers = [...customers].sort((a, b) => {
            const nameA = getCustomerName(a).toLowerCase();
            const nameB = getCustomerName(b).toLowerCase();
            return nameA.localeCompare(nameB);
        });

        // If no search term, return all sorted customers
        if (!search.trim()) {
            return sortedCustomers;
        }

        // Filter based on search
        const searchLower = search.toLowerCase().trim();
        return sortedCustomers.filter(m => {
            const name = getCustomerName(m).toLowerCase();
            const idNumber = getCustomerIdNumber(m).toLowerCase();
            const memberNo = getCustomerMemberNumber(m).toLowerCase();
            const payroll = getCustomerPayroll(m).toLowerCase();
            
            return name.includes(searchLower) ||
                   idNumber.includes(searchLower) ||
                   memberNo.includes(searchLower) ||
                   payroll.includes(searchLower);
        });
    }, [customers, search]);

    // If no customers, show a message
    if (!customers || !Array.isArray(customers) || customers.length === 0) {
        return (
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/50 z-[999]"
                            onClick={onClose}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />
                        <motion.div
                            className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="w-[90vw] max-w-xl bg-white rounded-xl shadow-xl p-4 pointer-events-auto">
                                <h3 className="font-semibold text-lg mb-3 bg-indigo-800 text-white p-3 rounded-lg shadow-md">
                                    Select Customer
                                </h3>
                                <div className="text-center py-8 text-gray-500">
                                    <p>No customers available</p>
                                    <p className="text-xs mt-1">Please try again later</p>
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
                                Select Customer
                                {customers.length > 0 && (
                                    <span className="ml-2 text-sm font-normal text-indigo-200">
                                        ({customers.length} available)
                                    </span>
                                )}
                            </h3>

                            <Input
                                placeholder="Search by name, ID or payroll..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="mb-3"
                                autoFocus
                            />

                            <div className="flex-1 overflow-y-auto border rounded-lg min-h-[200px] max-h-72">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center p-8 space-y-3">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                        <p className="text-sm text-gray-500">Loading customers...</p>
                                    </div>
                                ) : filtered.length > 0 ? (
                                    filtered.map((m, idx) => {
                                        const id = getCustomerId(m);
                                        const name = getCustomerName(m);
                                        const idNumber = getCustomerIdNumber(m);
                                        const memberNo = getCustomerMemberNumber(m);
                                        const payroll = getCustomerPayroll(m);
                                        
                                        // For debugging
                                        if (idx === 0) {
                                            console.log("Rendering first customer:", { id, name, idNumber, memberNo, payroll });
                                        }
                                        
                                        return (
                                            <div
                                                key={id || idx}
                                                onClick={() => {
                                                    console.log("Selected customer:", m);
                                                    onSelect(m);
                                                    onClose();
                                                }}
                                                className="p-3 cursor-pointer hover:bg-indigo-50 border-b last:border-b-0 transition-colors duration-150"
                                            >
                                                <p className="font-medium">{name}</p>
                                                <p className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                                                    {memberNo && <span>Member: <span className="font-mono">{memberNo}</span></span>}
                                                    {idNumber && <span>ID: <span className="font-mono">{idNumber}</span></span>}
                                                    {payroll && <span>Payroll: <span className="font-mono">{payroll}</span></span>}
                                                    {!memberNo && !idNumber && !payroll && (
                                                        <span className="text-gray-400">No additional info</span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Click to select
                                                </p>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                                        {search ? (
                                            <>
                                                <p className="text-sm">No matching members found for "{search}"</p>
                                                <p className="text-xs mt-1">Try adjusting your search</p>
                                            </>
                                        ) : (
                                            <p className="text-sm">No customers available</p>
                                        )}
                                    </div>
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