import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Swal from "sweetalert2";

export default function AddBranch({ open, onClose, refresh }) {
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState([]);
    const [form, setForm] = useState({
        companyId: "",
        code: "",
        description: "",
        addressAddressLine1: "",
        addressAddressLine2: "",
        addressStreet: "",
        addressPostalCode: "",
        addressCity: "",
        addressEmail: "",
        addressLandLine: "",
        addressMobileLine: "",
        isLocked: false,
    });

    const update = (key, value) => {
        setForm({ ...form, [key]: value });
    };

    // Fetch companies for the dropdown
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/companies`
                );
                const data = await res.json();
                if (data.success) {
                    setCompanies(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch companies", err);
            }
        };
        fetchCompanies();
    }, []);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/branches`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true",
                    },
                    body: JSON.stringify(form),
                }
            );

            if (!response.ok) throw new Error("Failed to add branch");

            Swal.fire("Success!", "Branch added successfully", "success");
            refresh();
            onClose();
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <motion.div
                        className="fixed top-3 right-3 w-[80vw] max-w-[950px] bg-white shadow-2xl z-50 flex flex-col rounded-2xl"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        <div className="bg-gray-200 m-2 rounded-xl">
                            <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
                                <h2 className="font-bold text-xl text-white">Add New Branch</h2>
                                <Button variant="outline" size="sm" onClick={onClose}>
                                    Close
                                </Button>
                            </div>

                            <div className="p-5 overflow-y-auto h-[75vh] bg-gray-50 rounded-xl m-3">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Company Select */}
                                    <div>
                                        <Label>Company</Label>
                                        <select
                                            className="w-full border rounded p-2"
                                            value={form.companyId}
                                            onChange={(e) => update("companyId", e.target.value)}
                                        >
                                            <option value="">Select Company</option>
                                            {companies.map((c) => (
                                                <option key={c.Id} value={c.Id}>
                                                    {c.Description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <Label>Code</Label>
                                        <Input
                                            value={form.code}
                                            onChange={(e) => update("code", e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label>Description</Label>
                                        <Input
                                            value={form.description}
                                            onChange={(e) => update("description", e.target.value)}
                                        />
                                    </div>

                                    {[
                                        ["addressAddressLine1", "Address Line 1"],
                                        ["addressAddressLine2", "Address Line 2"],
                                        ["addressStreet", "Street"],
                                        ["addressPostalCode", "Postal Code"],
                                        ["addressCity", "City"],
                                        ["addressEmail", "Email"],
                                        ["addressLandLine", "Landline"],
                                        ["addressMobileLine", "Mobile Line"],
                                    ].map(([key, label]) => (
                                        <div key={key}>
                                            <Label>{label}</Label>
                                            <Input
                                                value={form[key]}
                                                onChange={(e) => update(key, e.target.value)}
                                            />
                                        </div>
                                    ))}

                                    <div className="flex items-center gap-2 mt-4">
                                        <input
                                            type="checkbox"
                                            checked={form.isLocked}
                                            onChange={(e) => update("isLocked", e.target.checked)}
                                        />
                                        <Label>Is Locked?</Label>
                                    </div>
                                </div>

                                <div className="flex justify-end mt-8">
                                    <Button onClick={handleSubmit} disabled={loading}>
                                        {loading ? "Submitting..." : "Submit"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
