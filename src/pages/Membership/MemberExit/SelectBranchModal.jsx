import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const API_URL = `${import.meta.env.VITE_APP_MEMBERSHIP_URL}`;

export default function SelectBranchModal({ open, onClose, onSelect }) {
    const [branches, setBranches] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;

        const fetchBranches = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/api/branches`);
                const json = await res.json();
                setBranches(json?.data ?? []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchBranches();
    }, [open]);

    const filtered = branches.filter((b) =>
        b.Description?.toLowerCase().includes(search.toLowerCase()) ||
        b.PaddedCode?.includes(search)
    );

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <motion.div
                        className="fixed top-1/2 right-3 z-50 w-[520px] max-h-[80vh]
                                   -translate-x-1/2 -translate-y-1/2 bg-white
                                   rounded-xl shadow-xl flex flex-col"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b font-semibold">
                            Select Branch
                        </div>

                        <div className="p-3">
                            <Input
                                placeholder="Search by branch name or code"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {loading && <p className="text-sm">Loading branches...</p>}

                            {!loading &&
                                filtered.map((branch) => (
                                    <div
                                        key={branch.Id}
                                        className="border rounded-md p-3 cursor-pointer hover:bg-gray-100"
                                        onClick={() => {
                                            onSelect(branch);
                                            onClose();
                                        }}
                                    >
                                        <div className="font-medium">
                                            {branch.Description}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            Code: {branch.PaddedCode}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            City: {branch.AddressCity}
                                        </div>
                                    </div>
                                ))}
                        </div>

                        <div className="p-3 border-t flex justify-end">
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
