import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import SelectChartOfAccountModal from "../AddInsurance/SelectChartOfAccountModal";

export default function EditInsurance({ open, onClose, data, refresh }) {
    const [loading, setLoading] = useState(false);
    const [openChartModal, setOpenChartModal] = useState(false);

    const [form, setForm] = useState({
        Id: "",
        ChartOfAccountId: "",
        ChartOfAccountAccountType: "",
        ChartOfAccountAccountCode: "",
        ChartOfAccountAccountName: "",
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

    /* 🔹 Prefill when editing */
    useEffect(() => {
        if (data && open) {
            setForm({
                Id: data.Id,
                ChartOfAccountId: data.ChartOfAccountId,
                ChartOfAccountAccountType: data.ChartOfAccountAccountType,
                ChartOfAccountAccountCode: data.ChartOfAccountAccountCode,
                ChartOfAccountAccountName: data.ChartOfAccountAccountName,
                Description: data.Description,
                AddressAddressLine1: data.AddressAddressLine1,
                AddressAddressLine2: data.AddressAddressLine2,
                AddressStreet: data.AddressStreet,
                AddressPostalCode: data.AddressPostalCode,
                AddressCity: data.AddressCity,
                AddressEmail: data.AddressEmail,
                AddressLandLine: data.AddressLandLine,
                AddressMobileLine: data.AddressMobileLine,
                IsLocked: data.IsLocked,
            });
        }
    }, [data, open]);

    const update = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleChartSelect = (account) => {
        setForm(prev => ({
            ...prev,
            ChartOfAccountId: account.Id,
            ChartOfAccountAccountType: account.AccountType,
            ChartOfAccountAccountCode: account.AccountCode,
            ChartOfAccountAccountName: account.AccountName,
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                "http://95.216.225.26:8006/api/MemberExit/UpdateInsuranceCompany",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...form,
                        ChartOfAccountAccountType: Number(form.ChartOfAccountAccountType),
                        ChartOfAccountAccountCode: Number(form.ChartOfAccountAccountCode),
                    }),
                }
            );

            if (!res.ok) throw new Error("Failed to update insurance company");

            Swal.fire("Updated!", "Insurance company updated successfully.", "success");
            refresh?.();
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
                        className="fixed top-3 right-3 w-[85vw] max-w-[950px] bg-white shadow-2xl z-50 rounded-2xl flex flex-col"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        {/* Header */}
                        <div className="bg-indigo-700 p-4 rounded-2xl flex justify-between items-center m-3">
                            <h2 className="text-xl font-bold text-white">
                                Edit Insurance Company
                            </h2>
                            <Button variant="outline" size="sm" onClick={onClose}>
                                Close
                            </Button>
                        </div>

                        {/* Body */}
                        <div className="p-4 m-4 rounded-lg overflow-y-auto h-[72vh] bg-gray-200">
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                <div>
                                    <Label>Insurance Name</Label>
                                    <Input
                                        value={form.Description}
                                        onChange={e => update("Description", e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label>Chart Of Account</Label>
                                    <div className="flex gap-2">
                                        <Input value={form.ChartOfAccountAccountName} readOnly />
                                        <Button
                                            variant="outline"
                                            onClick={() => setOpenChartModal(true)}
                                        >
                                            Change
                                        </Button>
                                    </div>
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
                                            value={form[key] || ""}
                                            onChange={e => update(key, e.target.value)}
                                        />
                                    </div>
                                ))}

                                <div className="flex items-center gap-2 mt-4">
                                    <input
                                        type="checkbox"
                                        checked={form.IsLocked}
                                        onChange={e => update("IsLocked", e.target.checked)}
                                    />
                                    <Label>Is Locked</Label>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end mt-6">
                                <Button onClick={handleSubmit} disabled={loading}>
                                    {loading ? "Updating..." : "Update"}
                                </Button>
                            </div>
                        </div>

                        <SelectChartOfAccountModal
                            open={openChartModal}
                            onClose={() => setOpenChartModal(false)}
                            onSelect={handleChartSelect}
                        />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
