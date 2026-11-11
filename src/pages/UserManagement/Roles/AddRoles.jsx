import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import * as authApi from "@/apis/auth/authApi";

export default function AddRole({ open, onClose, refresh }) {
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        roleName: "",
        description: "",
    });

    const update = (field, value) => {
        setForm({ ...form, [field]: value });
    };

    const handleSubmit = async () => {
        if (!form.roleName.trim()) {
            Swal.fire("Missing Field", "Role Name is required.", "warning");
            return;
        }

        setLoading(true);

        try {
            const response = await authApi.createRole(form);
            const data = response.data;

            if (data?.success === false) {
                throw new Error(data.message || "Failed to create role");
            }

            Swal.fire("Success!", "Role created successfully", "success");

            setForm({ roleName: "", description: "" });
            refresh();
            onClose();
        } catch (err) {
            const message = err.response?.data?.message || err.message;
            Swal.fire("Error", message, "error");
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
                        className="fixed top-3 right-3 w-[80vw] max-w-[500px] bg-white shadow-2xl z-50 flex flex-col rounded-2xl"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        <div className="bg-gray-200 m-2 rounded-xl">
                            {/* Header */}
                            <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
                                <h2 className="font-bold text-xl text-white">
                                    Add New Role
                                </h2>
                                <Button variant="outline" size="sm" onClick={onClose}>
                                    Close
                                </Button>
                            </div>

                            {/* Form */}
                            <div className="p-6 bg-gray-50 rounded-xl m-3 space-y-5">

                                {/* Role Name */}
                                <div>
                                    <Label>Role Name</Label>
                                    <Input
                                        type="text"
                                        value={form.roleName}
                                        onChange={(e) =>
                                            update("roleName", e.target.value)
                                        }
                                        placeholder="Enter role name"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <Label>Description</Label>
                                    <Input
                                        type="text"
                                        value={form.description}
                                        onChange={(e) =>
                                            update("description", e.target.value)
                                        }
                                        placeholder="Enter description"
                                    />
                                </div>

                                {/* Submit */}
                                <div className="flex justify-end pt-4">
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        {loading ? "Creating..." : "Create Role"}
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
