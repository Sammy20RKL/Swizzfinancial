import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SelectChartOfAccountModal({ open, onClose, onSelect }) {
    const [accounts, setAccounts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;

        const fetchAccounts = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    "http://95.216.225.26:8006/api/chartofaccounts"
                );
                const json = await res.json();

                if (json.success) {
                    setAccounts(json.data);
                }
            } catch (err) {
                console.error("Failed to fetch chart of accounts", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAccounts();
    }, [open]);

    const filtered = accounts.filter(a =>
        `${a.AccountCode} ${a.AccountName}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed top left-1/2 w-[700px] max-w-[90vw] bg-white rounded-xl shadow-2xl z-50"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ transform: "translate(-50%, -50%)" }}
                    >
                        {/* Header */}
                        <div className="p-4 border-b flex justify-between items-center bg-indigo-700 rounded-t-xl">
                            <h3 className="text-white font-bold">
                                Select Chart Of Account
                            </h3>
                            <Button size="sm" variant="outline" onClick={onClose}>
                                Close
                            </Button>
                        </div>

                        {/* Search */}
                        <div className="p-4">
                            <Input
                                placeholder="Search by account code or name..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto px-4 pb-4">
                            {loading ? (
                                <p className="text-gray-500 text-center py-6">
                                    Loading accounts...
                                </p>
                            ) : filtered.length > 0 ? (
                                filtered.map(acc => (
                                    <div
                                        key={acc.Id}
                                        className="border rounded-lg p-3 mb-2 cursor-pointer hover:bg-indigo-50 transition"
                                        onClick={() => {
                                            onSelect(acc);
                                            onClose();
                                        }}
                                    >
                                        <div className="font-semibold text-indigo-700">
                                            {/* {acc.AccountCode} – */}
                                            {acc.AccountName}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {acc.AccountTypeDescription} •{" "}
                                            {acc.AccountCategoryDescription}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-6">
                                    No accounts found
                                </p>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
