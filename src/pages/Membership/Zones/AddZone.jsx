import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";


export default function AddZone({ open, onClose, refresh }) {
    const [loading, setLoading] = useState(false);
    const [divisions, setDivisions] = useState([]);

    const [form, setForm] = useState({
        divisionId: "",
        divisionEmployerId: "",
        description: "",
        createdDate: new Date().toISOString().slice(0, 16),
    });

    const update = (field, value) => {
        setForm({ ...form, [field]: value });
    };

    const fetchDivisions = async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/divisions`
            );
            const json = await res.json();
            if (json.success) setDivisions(json.data);
        } catch (err) {
            console.error("Division fetch error:", err);
        }
    };

    useEffect(() => {
        fetchDivisions();
    }, []);

    // Autofill employerId when division changes
    useEffect(() => {
        if (form.divisionId) {
            const selected = divisions.find((d) => d.Id === form.divisionId);
            if (selected) {
                update("divisionEmployerId", selected.EmployerId || selected.DivisionEmployerId);
            }
        }
    }, [form.divisionId]);

    const handleSubmit = async () => {
        if (!form.divisionId || !form.description) {
            Swal.fire("Missing Fields", "Please fill all required fields.", "warning");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/zones`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...form,
                    createdDate: new Date(form.createdDate).toISOString(),
                }),
            });

            if (!response.ok) throw new Error("Failed to add zone");

            Swal.fire("Success!", "Zone added successfully", "success");
            refresh();
            onClose();
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    console.log(form);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />


                    {/* Drawer */}
                    <motion.div
                        className="fixed top-3 right-3 w-[80vw] max-w-[600px] bg-white shadow-2xl z-50 flex flex-col rounded-2xl"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        <div className="bg-gray-200 m-2 rounded-xl">

                            {/* Header */}
                            <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
                                <h2 className="font-bold text-xl text-white">Add New Zone</h2>
                                <Button variant="outline" size="sm" onClick={onClose}>
                                    Close
                                </Button>
                            </div>

                            {/* Form */}
                            <div className="p-5 overflow-y-auto h-[48vh] bg-gray-50 rounded-xl m-3">
                                <div className="grid grid-cols-1 gap-4">

                                    {/* Zone Description */}
                                    <div>
                                        <Label>Description</Label>
                                        <Input
                                            type="text"
                                            value={form.description}
                                            onChange={(e) => update("description", e.target.value)}
                                        />
                                    </div>

                                    {/* Select Division */}
                                    <div>
                                        <Label>Division</Label>
                                        <Select
                                            value={form.divisionId}
                                            onValueChange={(value) => update("divisionId", value)}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Select Division" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {divisions.map((div) => (
                                                    <SelectItem key={div.Id} value={div.Id}>
                                                        {div.Description}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Auto-filled Employer (Readonly) */}
                                    <div style={{ display: "none" }}>
                                        <Label>Division Employer (Auto-filled)</Label>
                                        <Input
                                            type="text"
                                            value={form.divisionEmployerId}
                                            disabled
                                            className="bg-gray-200"
                                        />
                                    </div>

                                    {/* Created Date */}
                                    <div>
                                        <Label>Created Date</Label>
                                        <Input
                                            type="datetime-local"
                                            value={form.createdDate}
                                            onChange={(e) => update("createdDate", e.target.value)}
                                        />
                                    </div>

                                </div>

                                {/* Submit Button */}
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
