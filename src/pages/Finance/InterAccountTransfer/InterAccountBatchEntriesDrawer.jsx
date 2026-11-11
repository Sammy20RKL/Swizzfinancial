import { useEffect, useState } from "react";
import { Button } from "flowbite-react";
import Swal from "sweetalert2";

const API_BASE = `${import.meta.env.VITE_APP_FIN_URL}/api/values`;

export default function InterAccountBatchEntriesDrawer({
    open,
    onClose,
    batchId
}) {
    const [loading, setLoading] = useState(false);
    const [batch, setBatch] = useState(null);

    useEffect(() => {
        if (!open || !batchId) return;

        const fetchEntries = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    //`${API_BASE}/FindInterTransferBatchesEntries?batchId=${batchId}`
                    `${API_BASE}/FindInterTransferBatchesEntries?batchId=${batchId}`
                );

                if (!res.ok) {
                    throw new Error("Failed to fetch");
                }

                const json = await res.json();
                setBatch(json); // ✅ OBJECT, not array
            } catch (err) {
                Swal.fire("Error", "Failed to load batch entries", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchEntries();
    }, [open, batchId]);

    return (
        <div
            className={`fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300
            ${open ? "translate-x-0" : "translate-x-full"}`}
        >
            {/* HEADER */}
            <div className="flex justify-between items-center px-6 py-4 bg-indigo-700 text-white">
                <h3 className="text-lg font-bold">
                    Batch Reference: {batch?.reference || ""}
                </h3>
                <Button color="gray" size="sm" onClick={onClose}>
                    ✕
                </Button>
            </div>

            {/* BODY */}
            <div className="p-6 overflow-y-auto h-full">
                {loading ? (
                    <p className="text-gray-500">Loading entries...</p>
                ) : batch?.interAccountBatchEntries?.length > 0 ? (
                    <>
                        {/* Batch Info */}
                        <div className="mb-5 text-sm space-y-1 border-b pb-3">
                            <p>
                                <span className="font-semibold">Reference:</span>{" "}
                                {batch.reference}
                            </p>
                        </div>

                        {/* Entries */}
                        <div className="space-y-4">
                            {batch.interAccountBatchEntries.map((entry, index) => (
                                <div
                                    key={index}
                                    className="border rounded-lg p-4 bg-gray-50 hover:shadow transition"
                                >
                                    <p className="font-semibold text-indigo-700">
                                        {entry.primaryDescription}
                                    </p>

                                    <p className="text-sm text-gray-600">
                                        {entry.secondaryDescription || "-"}
                                    </p>

                                    <div className="text-sm mt-3 space-y-1">
                                        <p>
                                            <span className="font-semibold">Principal:</span>{" "}
                                            {entry.principal}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Interest:</span>{" "}
                                            {entry.interest}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Reference:</span>{" "}
                                            {entry.reference}
                                        </p>
                                    </div>

                                    <p className="text-xs text-gray-400 mt-2">
                                        Created by {entry.createdBy}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <p className="text-gray-500 text-center mt-10">
                        No entries found for this batch
                    </p>
                )}
            </div>
        </div>
    );
}
