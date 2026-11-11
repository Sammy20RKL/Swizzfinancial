import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import Swal from "sweetalert2";

export default function EditDivision({ open, onClose, data, refresh }) {
    const [loading, setLoading] = useState(false);
    const [employers, setEmployers] = useState([]);

    const [form, setForm] = useState({
        employerId: "",
        description: "",
        createdDate: "",
    });

    useEffect(() => {
        if (open && data) {
            setForm({
                employerId: data.EmployerId,
                description: data.Description,
                createdDate: data.CreatedDate?.slice(0, 16),
            });
            fetchEmployers();
        }
    }, [open]);

    const update = (key, value) => {
        setForm({ ...form, [key]: value });
    };

    const fetchEmployers = async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/employers`
            );
            const json = await res.json();
            if (json.success) setEmployers(json.data);
        } catch (err) {
            console.error("Employer fetch error:", err);
        }
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const payload = {
                employerId: form.employerId,
                description: form.description,
                createdDate: new Date(form.createdDate).toISOString(),
            };

            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/divisions/${data.Id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            if (!res.ok) throw new Error("Failed to update division");

            Swal.fire("Success!", "Division updated successfully", "success");
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
                    {/* BACKDROP */}
                    <motion.div
                        className="fixed inset-0 bg-black z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* DRAWER */}
                    <motion.div
                        className="fixed top-3 right-3 w-[80vw] max-w-[700px] bg-white shadow-2xl z-50 flex flex-col rounded-2xl"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        <div className="bg-gray-200 m-2 rounded-xl">

                            {/* HEADER */}
                            <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
                                <h2 className="font-bold text-xl text-white">
                                    Edit Division
                                </h2>
                                <Button variant="outline" size="sm" onClick={onClose}>
                                    Close
                                </Button>
                            </div>

                            {/* FORM AREA */}
                            <div className="p-5 overflow-y-auto h-[78vh] bg-gray-50 rounded-xl m-3">
                                <div className="grid grid-cols-1 gap-4">

                                    {/* Employer */}
                                    <div>
                                        <Label>Employer</Label>
                                        <Select
                                            value={form.employerId}
                                            onValueChange={(v) => update("employerId", v)}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Select Employer" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {employers.map((emp) => (
                                                    <SelectItem key={emp.Id} value={emp.Id}>
                                                        {emp.Description}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <Label>Description</Label>
                                        <Input
                                            value={form.description}
                                            onChange={(e) =>
                                                update("description", e.target.value)
                                            }
                                        />
                                    </div>

                                    {/* Created Date */}
                                    <div>
                                        <Label>Created Date</Label>
                                        <Input
                                            type="datetime-local"
                                            value={form.createdDate}
                                            onChange={(e) =>
                                                update("createdDate", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>

                                {/* SUBMIT */}
                                <div className="flex justify-end mt-8">
                                    <Button onClick={handleUpdate} disabled={loading}>
                                        {loading ? "Updating..." : "Update Division"}
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
