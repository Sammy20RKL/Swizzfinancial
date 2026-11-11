import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";

export default function SettlementDetailsDrawer({ open, onClose, exitId }) {
    const [settlement, setSettlement] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && exitId) {
            fetchSettlement(exitId);
        }
    }, [open, exitId]);

    const fetchSettlement = async (id) => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/MemberExit/GetAllSettlementsById?Id=${id}`);
            const json = await res.json();

            if (json.Success && json.Data.length > 0) {
                setSettlement(json.Data[0]);
            } else {
                setSettlement(null);
            }
        } catch (err) {
            console.error("Fetch Settlement Error:", err);
            Swal.fire("Error", "Failed to load settlement details", "error");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) =>
        date ? new Date(date).toLocaleString() : "-";

    if (!exitId) return null;

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
                        className="fixed top-3 right-3 w-[85vw] max-w-[700px] bg-white shadow-2xl z-50 rounded-2xl flex flex-col overflow-y-auto max-h-[90vh]"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                    >
                        <div className="p-4 space-y-4">

                            {/* Header */}
                            <div className="flex justify-between bg-indigo-600 p-2 rounded-2xl text-white font-semibold">
                                <span className="ml-3">Settlement Details</span>
                                <Button variant="outline" className="text-gray-600" onClick={onClose}>Close</Button>
                            </div>

                            <div className="bg-gray-300 p-3 rounded-lg">
                                {loading ? (
                                    <div className="text-center p-6">Loading settlement details...</div>
                                ) : settlement ? (
                                    <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-2">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <span><b>Account Number:</b> {settlement.FullAccountNumber}</span>
                                            <span><b>Product:</b> {settlement.ProductDescription}</span>
                                            <span><b>Chart of Account:</b> {settlement.ProductChartOfAccountName} ({settlement.ProductChartOfAccountCode})</span>
                                            <span><b>Principal:</b> KES {settlement.Principal?.toLocaleString()}</span>
                                            <span><b>Interest:</b> KES {settlement.Interest?.toLocaleString()}</span>
                                            <span><b>Carry Forwards:</b> KES {settlement.CarryForwards?.toLocaleString()}</span>
                                            <span className="col-span-2"><b>Reference:</b> {settlement.Reference}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center p-6">No settlement details found.</div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
