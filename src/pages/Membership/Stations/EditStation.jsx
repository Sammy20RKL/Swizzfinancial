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

export default function EditStation({ open, onClose, refresh, station }) {
    const [loading, setLoading] = useState(false);
    const [zones, setZones] = useState([]);

    const [form, setForm] = useState({
        ZoneId: "",
        ZoneDivisionId: "",
        ZoneDivisionEmployerId: "",
        Description: "",
        AddressAddressLine1: "",
        AddressAddressLine2: "",
        AddressStreet: "",
        AddressPostalCode: "",
        AddressCity: "",
        AddressEmail: "",
        AddressLandLine: "",
        AddressMobileLine: "",
    });

    const update = (field, value) => setForm({ ...form, [field]: value });

    // Load zones
    const fetchZones = async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/zones`
            );
            const json = await res.json();
            if (json.success) setZones(json.data);
        } catch (err) {
            console.error("Zone fetch error:", err);
        }
    };

    useEffect(() => {
        fetchZones();
    }, []);

    // Prefill form when station changes
    useEffect(() => {
        if (station) {
            setForm({
                ZoneId: station.ZoneId || "",
                ZoneDivisionId: station.ZoneDivisionId || "",
                ZoneDivisionEmployerId: station.ZoneDivisionEmployerId || "",
                Description: station.Description || "",
                AddressAddressLine1: station.AddressAddressLine1 || "",
                AddressAddressLine2: station.AddressAddressLine2 || "",
                AddressStreet: station.AddressStreet || "",
                AddressPostalCode: station.AddressPostalCode || "",
                AddressCity: station.AddressCity || "",
                AddressEmail: station.AddressEmail || "",
                AddressLandLine: station.AddressLandLine || "",
                AddressMobileLine: station.AddressMobileLine || "",
            });
        }
    }, [station]);

    // Auto-fill Division + Employer when Zone changes
    useEffect(() => {
        if (form.ZoneId) {
            const z = zones.find((x) => x.Id === form.ZoneId);
            if (z) {
                update("ZoneDivisionId", z.ZoneDivisionId || "");
                update("ZoneDivisionEmployerId", z.ZoneDivisionEmployerId || "");
            }
        }
    }, [form.ZoneId]);

    const handleSubmit = async () => {
        if (!form.ZoneId || !form.Description) {
            Swal.fire("Missing Fields", "Zone and Description are required.", "warning");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/stations/${station.Id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                }
            );

            if (!res.ok) throw new Error("Failed to update station");

            Swal.fire("Success!", "Station updated successfully", "success");
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
                        className="fixed top-3 right-3 w-[80vw] max-w-[650px] bg-white shadow-2xl z-50 flex flex-col rounded-2xl"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        <div className="bg-gray-200 m-2 rounded-xl">
                            {/* Header */}
                            <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
                                <h2 className="font-bold text-xl text-white">Edit Station</h2>
                                <Button variant="outline" size="sm" onClick={onClose}>
                                    Close
                                </Button>
                            </div>

                            {/* Form */}
                            <div className="p-5 overflow-y-auto h-[78vh] bg-gray-50 rounded-xl m-3">
                                <div className="grid grid-cols-1 gap-4">
                                    {/* Description */}
                                    <div>
                                        <Label>Station Name</Label>
                                        <Input
                                            value={form.Description}
                                            onChange={(e) => update("Description", e.target.value)}
                                        />
                                    </div>

                                    {/* Zone */}
                                    <div>
                                        <Label>Zone</Label>
                                        <Select
                                            value={form.ZoneId}
                                            onValueChange={(value) => update("ZoneId", value)}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Select Zone" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {zones.map((z) => (
                                                    <SelectItem key={z.Id} value={z.Id}>
                                                        {z.Description}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Address Fields */}
                                    <div>
                                        <Label>Address Line 1</Label>
                                        <Input
                                            value={form.AddressAddressLine1}
                                            onChange={(e) => update("AddressAddressLine1", e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label>Address Line 2</Label>
                                        <Input
                                            value={form.AddressAddressLine2}
                                            onChange={(e) => update("AddressAddressLine2", e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label>Street</Label>
                                        <Input
                                            value={form.AddressStreet}
                                            onChange={(e) => update("AddressStreet", e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label>Postal Code</Label>
                                        <Input
                                            value={form.AddressPostalCode}
                                            onChange={(e) => update("AddressPostalCode", e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label>City</Label>
                                        <Input
                                            value={form.AddressCity}
                                            onChange={(e) => update("AddressCity", e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            value={form.AddressEmail}
                                            onChange={(e) => update("AddressEmail", e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label>Landline</Label>
                                        <Input
                                            value={form.AddressLandLine}
                                            onChange={(e) => update("AddressLandLine", e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label>Mobile Line</Label>
                                        <Input
                                            value={form.AddressMobileLine}
                                            onChange={(e) => update("AddressMobileLine", e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="flex justify-end mt-8">
                                    <Button onClick={handleSubmit} disabled={loading}>
                                        {loading ? "Saving..." : "Save Changes"}
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
