
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";

export default function EditBranch({ open, onClose, data, refresh }) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        Id: "",
        CompanyId: "",
        Code: "",
        Description: "",
        AddressAddressLine1: "",
        AddressAddressLine2: "",
        AddressStreet: "",
        AddressPostalCode: "",
        AddressCity: "",
        AddressEmail: "",
        AddressLandLine: "",
        AddressMobileLine: "",
        IsLocked: false,
    });

    const [companies, setCompanies] = useState([]);

    useEffect(() => {
        if (data) {
            setForm({
                Id: data.Id,
                CompanyId: data.CompanyId || "",
                Code: data.Code || "",
                Description: data.Description || "",
                AddressAddressLine1: data.AddressAddressLine1 || "",
                AddressAddressLine2: data.AddressAddressLine2 || "",
                AddressStreet: data.AddressStreet || "",
                AddressPostalCode: data.AddressPostalCode || "",
                AddressCity: data.AddressCity || "",
                AddressEmail: data.AddressEmail || "",
                AddressLandLine: data.AddressLandLine || "",
                AddressMobileLine: data.AddressMobileLine || "",
                IsLocked: data.IsLocked || false,
            });
        }
    }, [data]);

    useEffect(() => {
        // Fetch companies for dropdown
        const fetchCompanies = async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/companies`
                );
                const json = await res.json();
                if (json.success) setCompanies(json.data);
            } catch (err) {
                console.error("Failed to fetch companies", err);
            }
        };
        fetchCompanies();
    }, []);

    const update = (key, value) => {
        setForm({ ...form, [key]: value });
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/branches/${form.Id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(form),
                }
            );

            console.log(res);
            console.log(form);

            if (!res.ok) throw new Error("Failed to update branch");

            Swal.fire("Success!", "Branch updated successfully", "success");
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
                                <h2 className="font-bold text-xl text-white">Edit Branch</h2>
                                <Button variant="outline" size="sm" onClick={onClose}>
                                    Close
                                </Button>
                            </div>

                            <div className="p-5 overflow-y-auto h-[75vh] bg-gray-50 rounded-xl m-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Company</Label>
                                        <select
                                            className="w-full border rounded p-2"
                                            value={form.CompanyId}
                                            onChange={(e) => update("CompanyId", e.target.value)}
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
                                            type="number"
                                            value={form.Code}
                                            onChange={(e) => update("Code", Number(e.target.value))}
                                        />
                                    </div>

                                    <div>
                                        <Label>Description</Label>
                                        <Input
                                            value={form.Description}
                                            onChange={(e) => update("Description", e.target.value)}
                                        />
                                    </div>

                                    {[
                                        ["AddressAddressLine1", "Address Line 1"],
                                        ["AddressAddressLine2", "Address Line 2"],
                                        ["AddressStreet", "Street"],
                                        ["AddressPostalCode", "Postal Code"],
                                        ["AddressCity", "City"],
                                        ["AddressEmail", "Email"],
                                        ["AddressLandLine", "Landline"],
                                        ["AddressMobileLine", "Mobile Line"],
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
                                            checked={form.IsLocked}
                                            onChange={(e) => update("IsLocked", e.target.checked)}
                                        />
                                        <Label>Is Locked?</Label>
                                    </div>
                                </div>

                                <div className="flex justify-end mt-8">
                                    <Button onClick={handleUpdate} disabled={loading}>
                                        {loading ? "Updating..." : "Update Branch"}
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
