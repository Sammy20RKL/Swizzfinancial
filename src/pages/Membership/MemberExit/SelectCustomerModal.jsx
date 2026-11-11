import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function SelectCustomerModal({ open, onClose, onSelect }) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!open) return;
        setSearch("");
        setLoading(true);
        fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/customers`)
            .then((res) => res.json())
            .then((d) => setMembers(d.success ? d.data : []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [open]);

    const filtered = useMemo(() => {
        const term = search.toLowerCase();
        return members.filter((m) =>
            `${m.IndividualFirstName} ${m.IndividualLastName}`.toLowerCase().includes(term) ||
            (m.Reference2 || "").toLowerCase().includes(term) ||
            (m.IndividualIdentityCardNumber || "").includes(term)
        );
    }, [members, search]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/20 z-[60]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed top-1/2 left-4/6 w-[80vw] max-w-[500px] bg-white shadow-2xl z-[60] flex flex-col rounded-2xl -translate-x-1/2 -translate-y-1/2"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 flex justify-between items-center bg-indigo-700 text-white rounded-t-2xl">
                            <h2 className="font-bold text-lg">Select Member</h2>
                            <Button variant="outline" size="sm" className="text-gray-800" onClick={onClose}>
                                Close
                            </Button>
                        </div>

                        {/* Search */}
                        <div className="p-4 bg-gray-50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    className="pl-9"
                                    placeholder="Search by name, member no. or ID number..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto max-h-[50vh] border-t bg-white rounded-b-2xl divide-y divide-gray-100">
                            {loading ? (
                                <div className="p-6 text-center text-sm text-gray-500">Loading members...</div>
                            ) : filtered.length === 0 ? (
                                <div className="p-6 text-center text-sm text-gray-500">No members found</div>
                            ) : (
                                filtered.map((m) => {
                                    const initials = `${m.IndividualFirstName?.[0] ?? ""}${m.IndividualLastName?.[0] ?? ""}`.toUpperCase();
                                    return (
                                        <button
                                            key={m.Id}
                                            onClick={() => { onSelect(m); onClose(); }}
                                            className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors flex items-center gap-3"
                                        >
                                            {/* Avatar */}
                                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex-shrink-0 flex items-center justify-center text-sm font-bold">
                                                {initials}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-800 truncate">
                                                    {m.IndividualFirstName} {m.IndividualLastName}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                    <span className="text-xs text-gray-500">
                                                        Member No:{" "}
                                                        <span className="font-semibold text-indigo-600">
                                                            {m.Reference2 || "—"}
                                                        </span>
                                                    </span>
                                                    <span className="text-gray-300 text-xs">|</span>
                                                    <span className="text-xs text-gray-500">
                                                        ID:{" "}
                                                        <span className="font-medium text-gray-700">
                                                            {m.IndividualIdentityCardNumber || "—"}
                                                        </span>
                                                    </span>
                                                    {m.AddressMobileLine && (
                                                        <>
                                                            <span className="text-gray-300 text-xs">|</span>
                                                            <span className="text-xs text-gray-500">{m.AddressMobileLine}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Arrow */}
                                            <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
