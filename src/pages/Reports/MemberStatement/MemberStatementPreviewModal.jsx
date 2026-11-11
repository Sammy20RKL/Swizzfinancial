


import { FaTimes, FaPrint, FaDownload, FaUser } from "react-icons/fa";
import { useState, useEffect } from "react";
import { saveAs } from "file-saver";

export default function MemberStatementPreviewModal({
    isOpen,
    onClose,
    member,
    startDate,
    endDate,
}) {
    const [loading, setLoading] = useState(false);
    const [pdfBlob, setPdfBlob] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);

    const formatDate = (date) => date.toISOString().split("T")[0];

    const fetchPdf = async () => {
        if (!member) return;

        setLoading(true);
        try {
            const url = `${import.meta.env.VITE_APP_REPORT_URL}/api/values/GetMemberStatement/${member.id
                }?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}&downloadPdf=true`;

            const response = await fetch(url, {
                headers: {
                    Accept: "application/pdf",
                },
            });

            if (!response.ok) throw new Error("Failed to load PDF");

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            setPdfBlob(blob);
            setPdfUrl(blobUrl);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && member) {
            fetchPdf();
        }

        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [isOpen, member, startDate, endDate]);

    // ✅ SAFE early return (after hooks)
    if (!isOpen || !member) return null;

    const handleDownload = () => {
        if (!pdfBlob) return;
        saveAs(
            pdfBlob,
            `Member_Statement_${member.name}_${formatDate(startDate)}_to_${formatDate(endDate)}.pdf`
        );
    };

    const handlePrint = () => {
        if (!pdfUrl) return;
        const win = window.open(pdfUrl, "_blank");
        win.onload = () => win.print();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full min-w-3xl h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center bg-indigo-700 px-6 py-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <FaUser /> Member Statement — {member.name}
                    </h3>
                    <button onClick={onClose} className="text-white text-xl">
                        <FaTimes />
                    </button>
                </div>

                {/* Info */}
                <div className="px-6 py-3 bg-gray-100 text-sm text-gray-700">
                    Period: <strong>{formatDate(startDate)}</strong> →{" "}
                    <strong>{formatDate(endDate)}</strong>
                </div>

                {/* Body */}
                <div className="flex-1 bg-gray-200">
                    {!pdfUrl ? (
                        <div className="h-full flex items-center justify-center text-gray-600">
                            {loading ? "Loading statement preview…" : "Preparing document…"}
                        </div>
                    ) : (
                        <iframe
                            title="Member Statement Preview"
                            src={pdfUrl}
                            className="w-full h-full border-none"
                        />
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
                    <button
                        onClick={handlePrint}
                        disabled={!pdfUrl}
                        className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50"
                    >
                        <FaPrint /> Print
                    </button>

                    <button
                        onClick={handleDownload}
                        disabled={!pdfBlob}
                        className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
                    >
                        <FaDownload /> Download
                    </button>
                </div>
            </div>
        </div>
    );
}
