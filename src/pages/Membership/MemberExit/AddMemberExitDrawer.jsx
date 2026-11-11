import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import SelectCustomerModal from "./SelectCustomerModal";
import SelectBranchModal from "./SelectBranchModal";

const API_URL = `${import.meta.env.VITE_APP_MEMBERSHIP_URL}`;

export default function AddMemberExitDrawer({ open, onClose, refresh }) {
    const [loading, setLoading] = useState(false);
    const [selectCustomerOpen, setSelectCustomerOpen] = useState(false);
    const [selectBranchOpen, setSelectBranchOpen] = useState(false);
    const [accounts, setAccounts] = useState([]);

    // Get default remarks based on category
    const getDefaultRemarks = (category) => {
        switch(category) {
            case 1793:
                return "Member has submitted voluntary withdrawal request.";
            case 1794:
                return "Member has reached retirement age and requested exit.";
            case 1792:
                return "Member is deceased - processing death claim settlement.";
            default:
                return "Member exit request processed.";
        }
    };

    const [form, setForm] = useState({
        customerId: "",           // Changed to camelCase
        branchId: "",             // Changed to camelCase
        category: 1793,
        remarks: "Member has submitted voluntary withdrawal request.",
        settlementType: 1,        // 1 = Normal, 2 = Express, 4 = Waiver
        createdBy: "system.ui",
        maturityDate: null        // Optional
    });

    // UI display fields (not sent to API)
    const [displayFields, setDisplayFields] = useState({
        customerFullName: "",
        customerReference2: "",
        customerIndividualFirstName: "",
        customerIndividualLastName: "",
        customerIndividualIdentityCardNumber: "",
        customerAddressMobileLine: "",
        customerAddressEmail: "",
        branchDescription: ""
    });

    // Update remarks when category changes
    const handleCategoryChange = (categoryValue) => {
        const newRemarks = getDefaultRemarks(categoryValue);
        setForm((prev) => ({
            ...prev,
            category: categoryValue,
            remarks: newRemarks
        }));
    };

    // Fetch accounts whenever a customer is selected
    useEffect(() => {
        if (!form.customerId) {
            setAccounts([]);
            return;
        }
        fetch(
            `${import.meta.env.VITE_APP_FIN_URL}/api/values/CustomerAccount/by-customer?customerId=${form.customerId}`
        )
            .then((res) => res.json())
            .then((data) => setAccounts(Array.isArray(data) ? data : []))
            .catch(() => setAccounts([]));
    }, [form.customerId]);

    // Handle customer selection
    const handleCustomerSelect = (member) => {
        setForm((prev) => ({
            ...prev,
            customerId: member.Id
        }));
        
        setDisplayFields((prev) => ({
            ...prev,
            customerFullName: `${member.IndividualFirstName} ${member.IndividualLastName}`,
            customerIndividualFirstName: member.IndividualFirstName || "",
            customerIndividualLastName: member.IndividualLastName || "",
            customerFullName: `${member.IndividualFirstName} ${member.IndividualLastName}`,
            customerIndividualIdentityCardNumber: member.IndividualIdentityCardNumber || "",
            customerAddressMobileLine: member.AddressMobileLine || "",
            customerAddressEmail: member.AddressEmail || "",
            customerReference2: member.Reference2 || "",
        }));
    };

    // Handle branch selection
    const handleBranchSelect = (branch) => {
        setForm((prev) => ({
            ...prev,
            branchId: branch.Id
        }));
        
        setDisplayFields((prev) => ({
            ...prev,
            branchDescription: branch.Description
        }));
    };

    const updateDisplayField = (key, value) => setDisplayFields((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async () => {
        // Validation
        if (!form.customerId) {
            Swal.fire("Error", "Please select a member", "error");
            return;
        }
        
        if (!form.branchId) {
            Swal.fire("Error", "Please select a branch", "error");
            return;
        }
        
        if (!form.remarks) {
            Swal.fire("Error", "Remarks are required", "error");
            return;
        }
        
        setLoading(true);
        try {
            // Prepare payload matching your API exactly
            const payload = {
                customerId: form.customerId,
                branchId: form.branchId,
                category: form.category,
                remarks: form.remarks,
                settlementType: form.settlementType,
                createdBy: form.createdBy
            };
            
            // Add maturityDate only if provided
            if (form.maturityDate) {
                payload.maturityDate = form.maturityDate;
            }

            console.log("Sending payload:", payload);

            const res = await fetch(`${API_URL}/api/values/create-withdrawal-notification`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            
            if (!data.Success) {
                throw new Error(data.Message || data.Errors || "Failed to create member exit");
            }

            Swal.fire("Success", data.Message || "Member exit created successfully", "success");
            refresh?.();
            onClose();
            
            // Reset form
            setForm({
                customerId: "",
                branchId: "",
                category: 1793,
                remarks: "Member has submitted voluntary withdrawal request.",
                settlementType: 1,
                createdBy: "system.ui",
                maturityDate: null
            });
            setDisplayFields({
                customerFullName: "",
                customerReference2: "",
                customerIndividualFirstName: "",
                customerIndividualLastName: "",
                customerIndividualIdentityCardNumber: "",
                customerAddressMobileLine: "",
                customerAddressEmail: "",
                branchDescription: ""
            });
            
        } catch (err) {
            console.error("Error:", err);
            Swal.fire("Error", err.message, "error");
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
                        onClick={loading ? undefined : onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        className="fixed top-3 right-3 w-[85vw] max-w-[900px] bg-white shadow-2xl z-50 rounded-2xl flex flex-col overflow-y-auto max-h-[90vh]"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-3 m-1 space-y-4">
                            {/* Header */}
                            <div className="flex justify-between bg-indigo-600 p-2 rounded-2xl text-white font-semibold">
                                <span className="ml-3">Member Exit</span>
                                <Button variant="outline" onClick={onClose} disabled={loading} className="text-gray-600">
                                    Close
                                </Button>
                            </div>

                            {/* Form */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border">
                                <div className="grid grid-cols-2 gap-4 text-sm">

                                    {/* Member selector */}
                                    <div>
                                        <Label>Member *</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full justify-start bg-white"
                                            onClick={() => setSelectCustomerOpen(true)}
                                        >
                                            {displayFields.customerFullName || "Click to select member"}
                                        </Button>
                                    </div>

                                    <div>
                                        <Label>Member No.</Label>
                                        <Input
                                            value={displayFields.customerReference2}
                                            readOnly
                                            className="bg-gray-100"
                                            placeholder="Auto-filled on selection"
                                        />
                                    </div>

                                    <div>
                                        <Label>First Name</Label>
                                        <Input
                                            value={displayFields.customerIndividualFirstName}
                                            onChange={(e) => updateDisplayField("customerIndividualFirstName", e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label>Last Name</Label>
                                        <Input
                                            value={displayFields.customerIndividualLastName}
                                            onChange={(e) => updateDisplayField("customerIndividualLastName", e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label>ID Number</Label>
                                        <Input
                                            value={displayFields.customerIndividualIdentityCardNumber}
                                            onChange={(e) => updateDisplayField("customerIndividualIdentityCardNumber", e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label>Phone</Label>
                                        <Input
                                            value={displayFields.customerAddressMobileLine}
                                            onChange={(e) => updateDisplayField("customerAddressMobileLine", e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            value={displayFields.customerAddressEmail}
                                            onChange={(e) => updateDisplayField("customerAddressEmail", e.target.value)}
                                        />
                                    </div>

                                    {/* Accounts display */}
                                    {accounts.length > 0 && (
                                        <div className="mt-2 bg-white border rounded-lg p-3 col-span-2">
                                            <h3 className="font-semibold mb-2 bg-indigo-500 p-3 rounded-xl text-gray-50">
                                                Customer Accounts
                                            </h3>
                                            <div className="space-y-2 bg-gray-300 p-3 rounded-lg">
                                                {accounts.map((acc) => (
                                                    <div
                                                        key={acc.Id}
                                                        className="border rounded p-2 text-sm flex justify-between items-center bg-gray-50"
                                                    >
                                                        <div>
                                                            <div className="font-medium">
                                                                {acc.CustomerAccountTypeTargetProductDescription}
                                                            </div>
                                                            <div className="text-xs text-gray-600">
                                                                {acc.FullAccountNumber}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-semibold">
                                                                {Number(acc.AvailableBalance || 0).toLocaleString()}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {acc.StatusDescription}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Maturity Date - Optional */}
                                    <div>
                                        <Label>Maturity Date (Optional)</Label>
                                        <Input
                                            type="date"
                                            value={form.maturityDate?.split("T")[0] || ""}
                                            onChange={(e) => setForm(prev => ({ ...prev, maturityDate: e.target.value ? `${e.target.value}T00:00:00Z` : null }))}
                                        />
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <Label>Category *</Label>
                                        <select
                                            value={form.category}
                                            onChange={(e) => handleCategoryChange(parseInt(e.target.value))}
                                            className="w-full border rounded px-2 py-1"
                                            required
                                        >
                                            <option value={1793}>Voluntary</option>
                                            <option value={1794}>Retiree</option>
                                            <option value={1792}>Deceased</option>
                                        </select>
                                    </div>

                                    {/* Settlement Type */}
                                    <div>
                                        <Label>Settlement Type *</Label>
                                        <select
                                            value={form.settlementType}
                                            onChange={(e) => setForm(prev => ({ ...prev, settlementType: parseInt(e.target.value) }))}
                                            className="w-full border rounded px-2 py-1"
                                            required
                                        >
                                            <option value={1}>Normal</option>
                                            <option value={2}>Express</option>
                                            <option value={4}>Waiver</option>
                                        </select>
                                    </div>

                                    {/* Remarks */}
                                    <div className="col-span-2">
                                        <Label>Remarks *</Label>
                                        <Input
                                            value={form.remarks}
                                            onChange={(e) => setForm(prev => ({ ...prev, remarks: e.target.value }))}
                                            placeholder="Enter remarks"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Branch selection */}
                                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                                    <div className="flex justify-center items-end w-full">
                                        <Button
                                            variant="secondary"
                                            className="bg-gray-500 hover:bg-gray-500 text-gray-50 hover:text-gray-50 w-full border-2 border-gray-400"
                                            onClick={() => setSelectBranchOpen(true)}
                                        >
                                            Select Branch
                                        </Button>
                                    </div>
                                    <div>
                                        <Label>Branch *</Label>
                                        <Input 
                                            value={displayFields.branchDescription} 
                                            readOnly 
                                            placeholder="No branch selected"
                                            className={!displayFields.branchDescription ? "bg-gray-50 text-gray-400" : ""}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={onClose} disabled={loading}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSubmit} disabled={loading}>
                                    {loading ? "Submitting..." : "Create Exit"}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}

            <SelectBranchModal
                open={selectBranchOpen}
                onClose={() => setSelectBranchOpen(false)}
                onSelect={handleBranchSelect}
            />

            <SelectCustomerModal
                open={selectCustomerOpen}
                onClose={() => setSelectCustomerOpen(false)}
                onSelect={handleCustomerSelect}
            />
        </AnimatePresence>
    );
}