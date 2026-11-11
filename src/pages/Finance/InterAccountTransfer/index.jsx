import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import {
    FaExchangeAlt,
    FaChevronDown,
    FaChevronUp,
} from "react-icons/fa";
import AddInterAccountBatchDrawer from "./AddInterAccountTransfer";
import NotFoundImage from "/assets/scopefinding.png";
import InterAccountBatchEntriesDrawer from "./InterAccountBatchEntriesDrawer";

const API_BASE = `${import.meta.env.VITE_APP_FIN_URL}/api/values`;

export default function InterAccountTransferBatchIndex() {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedBatch, setExpandedBatch] = useState(null);
    const [openDrawer, setOpenDrawer] = useState(false);
    const [entriesDrawerOpen, setEntriesDrawerOpen] = useState(false);
    const [selectedBatchId, setSelectedBatchId] = useState(null);


    const fetchBatches = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/FindInterTransferBatches`, {
                headers: { "ngrok-skip-browser-warning": "true" },
            });
            const json = await res.json();
            setBatches(json?.data || []);
        } catch {
            Swal.fire("Error", "Failed to load batches", "error");
        } finally {
            setLoading(false);
        }
    };

    const postBatch = async (batchId) => {
        const confirm = await Swal.fire({
            title: "Post Batch?",
            text: "This action will post all entries in this batch.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Post",
            cancelButtonText: "Cancel",
        });

        if (!confirm.isConfirmed) return;

        try {
            Swal.fire({
                title: "Posting...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const res = await fetch(
                `${import.meta.env.VITE_APP_FIN_URL}/api/values/PostinterAccount?batchId=${batchId}`,
                {
                    method: "POST",
                }
            );

            if (!res.ok) {
                throw new Error("Post failed");
            }

            Swal.fire("Success", "Batch posted successfully", "success");
            fetchBatches(); // ✅ refresh list
        } catch (err) {
            Swal.fire("Error", "Failed to post batch", "error");
        }
    };


    useEffect(() => {
        fetchBatches();
    }, []);

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-700 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaExchangeAlt /> Inter-Account Transfer Batches
                </h2>
                <Button
                    onClick={() => setOpenDrawer(true)}
                    className="bg-indigo-500 hover:bg-indigo-600"
                >
                    + New Batch
                </Button>
            </div>

            <div className="bg-gray-200 rounded-2xl p-3">
                {/* Column Headings */}
                <div className="grid grid-cols-15 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
                    <span className="col-span-2">Batch No</span>
                    <span className="col-span-3">Customer</span>
                    <span className="col-span-2">Account</span>
                    <span className="col-span-2">Status</span>
                    <span className="col-span-2">Created</span>
                    <span className="col-span-2">Reference</span>
                    <span className="col-span-2">Posted Entries</span>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="space-y-3 animate-pulse">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
                        ))}
                    </div>
                ) : batches.length > 0 ? (
                    <div className="space-y-3">
                        {batches.map((b) => (
                            <div
                                key={b.Id}
                                className="bg-white border rounded-lg shadow hover:shadow-xl transition"
                            >
                                {/* Main Row */}
                                <div className="grid grid-cols-19 gap-4 items-center px-6 py-4">
                                    <span className="col-span-2 font-semibold text-indigo-700">
                                        {b.PaddedBatchNumber}
                                    </span>

                                    <span className="col-span-3 truncate">
                                        {b.CustomerAccountCustomerFullName}
                                    </span>

                                    <span className="col-span-2 text-gray-600 text-sm truncate">
                                        {b.CustomerAccountFullAccountNumber}
                                    </span>

                                    <span
                                        className={`col-span-2 px-2 py-1 rounded-full text-xs font-semibold text-center
                    ${b.StatusDescription === "Posted"
                                                ? "bg-green-600 text-white"
                                                : "bg-yellow-500 text-white"}`}
                                    >
                                        {b.StatusDescription}
                                    </span>

                                    <span className="col-span-2 text-sm text-gray-500">
                                        {new Date(b.CreatedDate).toLocaleDateString()}
                                    </span>

                                    <span className="col-span-2 text-sm text-gray-500">
                                        {b.Reference || "-"}
                                    </span>
                                    <span className="col-span-2 text-sm text-gray-500">
                                        {b.PostedEntries}
                                    </span>
                                    <span className="col-span-2">
                                        <Button
                                            className="bg-gray-800"
                                            onClick={() => {
                                                setSelectedBatchId(b.Id);
                                                setEntriesDrawerOpen(true);
                                            }}
                                        >
                                            Entries
                                        </Button>
                                    </span>

                                    <span className="col-span-2">
                                        <Button
                                            className="bg-green-600 hover:bg-green-700"

                                            disabled={b.StatusDescription === "Posted"}
                                            onClick={() => postBatch(b.Id)}
                                        >
                                            {b.StatusDescription === "Posted" || b.PostedEntries === 0 ? "Posted" : "Post"}
                                        </Button>
                                    </span>

                                </div>


                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 mt-10">
                        <img
                            src={NotFoundImage}
                            className="mx-auto w-40 mb-4"
                        />
                        <p className="font-medium">No Transfer Batches Found</p>
                    </div>
                )}
            </div>
            {/* Drawer */}
            <AddInterAccountBatchDrawer
                open={openDrawer}
                onClose={() => setOpenDrawer(false)}
                onSuccess={fetchBatches}
            />
            <InterAccountBatchEntriesDrawer
                open={entriesDrawerOpen}
                batchId={selectedBatchId}
                onClose={() => setEntriesDrawerOpen(false)}
            />

        </div>
    );
}
