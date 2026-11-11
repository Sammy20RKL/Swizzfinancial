import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";

export default function AddLoanSector({ open, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        sectorCode: "",
        sectorName: "",
        isActive: true,
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_LOANING_URL}/api/Loansetups/LoanSector`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true",
                    },
                    body: JSON.stringify(formData),
                }
            );

            if (!res.ok) throw new Error("Failed to add loan sector");

            Swal.fire("Success", "Loan sector added successfully!", "success");

            setFormData({
                sectorCode: "",
                sectorName: "",
                isActive: true,
            });

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to add loan sector.", "error");
        } finally {
            setLoading(false);
        }
    };

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
                        className="fixed top-5 right-5 w-[480px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {/* Header */}
                        <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
                            <h2 className="font-bold text-lg text-white">
                                Add Loan Sector
                            </h2>
                            <Button variant="outline" size="sm" onClick={onClose}>
                                Close
                            </Button>
                        </div>

                        {/* Form */}
                        <div className="p-3 flex-1">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label>Sector Code</Label>
                                    <Input
                                        placeholder="e.g AGR"
                                        value={formData.sectorCode}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                sectorCode: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>

                                <div>
                                    <Label>Sector Name</Label>
                                    <Input
                                        placeholder="e.g Agriculture"
                                        value={formData.sectorName}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                sectorName: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {loading ? "Saving..." : "Save Loan Sector"}
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
