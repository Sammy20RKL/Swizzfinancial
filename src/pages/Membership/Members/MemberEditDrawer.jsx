import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Swal from "sweetalert2";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

export default function MemberEditDrawer({ open, onClose, refresh, member }) {
    const [branches, setBranches] = useState([]);
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [updatingNextOfKin, setUpdatingNextOfKin] = useState(false);
    const [errors, setErrors] = useState({
        addressEmail: "",
        addressMobileLine: "",
        personalIdentificationNumber: "",
    });

    // ========================
    // MASTER FORM STATE - Uses original API structure
    // ========================
    const [customer, setCustomer] = useState({
        Id: "",
        StationId: "",
        BranchId: "",
        Type: "",
        SerialNumber: "",
        PersonalIdentificationNumber: "",
        IndividualType: 1,
        IndividualFirstName: "",
        IndividualLastName: "",
        IndividualIdentityCardType: 1,
        IndividualIdentityCardNumber: "",
        IndividualIdentityCardSerialNumber: "",
        IndividualPayrollNumbers: "",
        IndividualSalutation: "1",
        IndividualGender: "",
        IndividualMaritalStatus: "",
        IndividualNationality: "",
        IndividualBirthDate: "",
        IndividualEmploymentDesignation: "",
        IndividualEmploymentTermsOfService: "",
        IndividualEmploymentDate: "",
        IndividualClassification: "",
        NonIndividualDescription: "",
        NonIndividualRegistrationNumber: "",
        NonIndividualRegistrationSerialNumber: "",
        NonIndividualDateEstablished: "",
        AddressAddressLine1: "",
        AddressAddressLine2: "",
        AddressStreet: "",
        AddressPostalCode: "",
        AddressCity: "",
        AddressEmail: "",
        AddressLandLine: "",
        AddressMobileLine: "",
        PassportImageId: null,
        SignatureImageId: null,
        IdentityCardFrontSideImageId: null,
        IdentityCardBackSideImageId: null,
        RegistrationDate: "",
        Reference1: "",
        Reference2: "",
        Reference3: "",
        Remarks: "",
        IsDefaulter: false,
        IsLocked: false,
        InhibitGuaranteeing: false,
        RecruitedBy: "SYSTEM",
        RecordStatus: 1,
        ModifiedBy: "SYSTEM",
        ModifiedDate: new Date().toISOString(),
        BankName: "",
        BranchName: "",
    });

    const [nextOfKins, setNextOfKins] = useState([]);
    const [step, setStep] = useState(1);
    const next = () => setStep(s => s + 1);
    const back = () => setStep(s => s - 1);

    // Load member data when drawer opens - Map flat structure to API structure
    useEffect(() => {
        if (member && open) {
            // Map flat structure to the original API structure
            setCustomer({
                Id: member.id || "",
                StationId: member.stationId || "",
                BranchId: member.branchId || "",
                Type: member.type || "",
                SerialNumber: member.serialNumber || "",
                PersonalIdentificationNumber: member.pin || member.PersonalIdentificationNumber || "",
                IndividualType: member.individualType || 1,
                IndividualFirstName: member.firstName || "",
                IndividualLastName: member.lastName || "",
                IndividualIdentityCardType: member.idCardType || 1,
                IndividualIdentityCardNumber: member.idNumber || "",
                IndividualIdentityCardSerialNumber: member.idCardSerialNumber || "",
                IndividualPayrollNumbers: member.payrollNumber || "",
                IndividualSalutation: member.salutation?.toString() || "1",
                IndividualGender: member.gender?.toString() || "",
                IndividualMaritalStatus: member.maritalStatus?.toString() || "",
                IndividualNationality: member.nationality || "",
                IndividualBirthDate: member.birthDate ? new Date(member.birthDate).toISOString().split('T')[0] : "",
                IndividualEmploymentDesignation: member.employmentDesignation || "",
                IndividualEmploymentTermsOfService: member.employmentTerms?.toString() || "",
                IndividualEmploymentDate: member.employmentDate ? new Date(member.employmentDate).toISOString().split('T')[0] : "",
                IndividualClassification: member.classification?.toString() || "",
                NonIndividualDescription: "",
                NonIndividualRegistrationNumber: "",
                NonIndividualRegistrationSerialNumber: "",
                NonIndividualDateEstablished: "",
                AddressAddressLine1: member.address?.addressLine1 || "",
                AddressAddressLine2: member.address?.addressLine2 || "",
                AddressStreet: member.address?.street || "",
                AddressPostalCode: member.address?.postalCode || "",
                AddressCity: member.address?.city || "",
                AddressEmail: member.address?.email || "",
                AddressLandLine: member.address?.landLine || "",
                AddressMobileLine: member.address?.mobileLine || "",
                PassportImageId: member.passportImageId || null,
                SignatureImageId: member.signatureImageId || null,
                IdentityCardFrontSideImageId: member.idFrontImageId || null,
                IdentityCardBackSideImageId: member.idBackImageId || null,
                RegistrationDate: member.registrationDate ? new Date(member.registrationDate).toISOString().split('T')[0] : "",
                Reference1: member.reference1 || "",
                Reference2: member.memberNumber || member.Reference2 || "",
                Reference3: member.reference3 || "",
                Remarks: member.remarks || "",
                IsDefaulter: member.isDefaulter || false,
                IsLocked: member.isLocked || false,
                InhibitGuaranteeing: member.inhibitGuaranteeing || false,
                RecruitedBy: member.recruitedBy || "SYSTEM",
                RecordStatus: member.recordStatus || 1,
                ModifiedBy: "SYSTEM",
                ModifiedDate: new Date().toISOString(),
                BankName: member.bankName || "",
                BranchName: member.branchName || "",
            });

            // Handle Next of Kin - Map flat to API structure
            if (member.nextOfKin && member.nextOfKin.length > 0) {
                const mappedNextOfKins = member.nextOfKin.map(nok => ({
                    Id: nok.id || "",
                    CustomerId: nok.customerId || member.id,
                    Salutation: nok.salutation?.toString() || "",
                    Gender: nok.gender?.toString() || "",
                    Relationship: nok.relationship?.toString() || "",
                    FirstName: nok.firstName || "",
                    LastName: nok.lastName || "",
                    IdentityCardType: nok.identityCardType || 1,
                    IdentityCardNumber: nok.identityCardNumber || "",
                    AddressAddressLine1: nok.address?.addressLine1 || "",
                    AddressAddressLine2: nok.address?.addressLine2 || "",
                    AddressStreet: nok.address?.street || "",
                    AddressPostalCode: nok.address?.postalCode || "",
                    AddressCity: nok.address?.city || "",
                    AddressEmail: nok.address?.email || "",
                    AddressLandLine: nok.address?.landLine || "",
                    AddressMobileLine: nok.address?.mobileLine || "",
                    NominatedPercentage: nok.nominatedPercentage || 0,
                    Remarks: nok.remarks || "",
                }));

                setNextOfKins(mappedNextOfKins);
            } else {
                setNextOfKins([{
                    Id: "",
                    CustomerId: member.id,
                    Salutation: "",
                    Gender: "",
                    Relationship: "",
                    FirstName: "",
                    LastName: "",
                    IdentityCardType: 1,
                    IdentityCardNumber: "",
                    AddressAddressLine1: "",
                    AddressAddressLine2: "",
                    AddressStreet: "",
                    AddressPostalCode: "",
                    AddressCity: "",
                    AddressEmail: "",
                    AddressLandLine: "",
                    AddressMobileLine: "",
                    NominatedPercentage: 0,
                    Remarks: "",
                }]);
            }
        }
    }, [member, open]);

    const updateCustomer = (key, value) => {
        setCustomer(prev => ({ ...prev, [key]: value }));
    };

    const updateNextOfKin = (index, key, value) => {
        const updated = [...nextOfKins];
        updated[index][key] = value;
        setNextOfKins(updated);
    };

    const addNextOfKin = () => {
        if (totalNokPercentage >= 100) {
            Swal.fire("Limit reached", "Total nominated percentage is already 100%", "warning");
            return;
        }

        setNextOfKins([
            ...nextOfKins,
            {
                Id: "",
                CustomerId: customer.Id,
                Salutation: "",
                Gender: "",
                Relationship: "",
                FirstName: "",
                LastName: "",
                IdentityCardType: 1,
                IdentityCardNumber: "",
                AddressAddressLine1: "",
                AddressAddressLine2: "",
                AddressStreet: "",
                AddressPostalCode: "",
                AddressCity: "",
                AddressEmail: "",
                AddressLandLine: "",
                AddressMobileLine: "",
                NominatedPercentage: 0,
                Remarks: "",
            },
        ]);
    };

    const removeNextOfKin = (index) => {
        if (nextOfKins.length === 1) return;
        setNextOfKins(prev => prev.filter((_, i) => i !== index));
    };

    // ========================
    // SUBMIT HANDLER FOR CUSTOMER - Uses original API structure
    // ========================
    const handleCustomerUpdate = async () => {
        setLoading(true);

        try {
            const payload = {
                Id: customer.Id,
                StationId: customer.StationId,
                BranchId: customer.BranchId,
                Type: parseInt(customer.Type) || 1,
                SerialNumber: customer.SerialNumber,
                PersonalIdentificationNumber: customer.PersonalIdentificationNumber,
                IndividualType: parseInt(customer.IndividualType) || 1,
                IndividualFirstName: customer.IndividualFirstName,
                IndividualLastName: customer.IndividualLastName,
                IndividualSalutation: parseInt(customer.IndividualSalutation) || 1,
                IndividualGender: parseInt(customer.IndividualGender) || 1,
                IndividualMaritalStatus: parseInt(customer.IndividualMaritalStatus) || 1,
                IndividualNationality: customer.IndividualNationality,
                IndividualIdentityCardType: parseInt(customer.IndividualIdentityCardType) || 1,
                IndividualIdentityCardNumber: customer.IndividualIdentityCardNumber,
                IndividualIdentityCardSerialNumber: customer.IndividualIdentityCardSerialNumber,
                IndividualPayrollNumbers: customer.IndividualPayrollNumbers,
                IndividualBirthDate: customer.IndividualBirthDate,
                IndividualEmploymentDesignation: customer.IndividualEmploymentDesignation,
                IndividualEmploymentTermsOfService: parseInt(customer.IndividualEmploymentTermsOfService) || 0,
                IndividualEmploymentDate: customer.IndividualEmploymentDate,
                IndividualClassification: customer.IndividualClassification,
                AddressAddressLine1: customer.AddressAddressLine1,
                AddressAddressLine2: customer.AddressAddressLine2,
                AddressStreet: customer.AddressStreet,
                AddressCity: customer.AddressCity,
                AddressPostalCode: customer.AddressPostalCode,
                AddressEmail: customer.AddressEmail,
                AddressLandLine: customer.AddressLandLine,
                AddressMobileLine: customer.AddressMobileLine,
                RegistrationDate: customer.RegistrationDate,
                Reference1: customer.Reference1,
                Reference2: customer.Reference2,
                Reference3: customer.Reference3,
                Remarks: customer.Remarks,
                IsDefaulter: customer.IsDefaulter,
                IsLocked: customer.IsLocked,
                InhibitGuaranteeing: customer.InhibitGuaranteeing,
                RecordStatus: customer.RecordStatus,
                RecruitedBy: customer.RecruitedBy || "SYSTEM",
                BankName: customer.BankName,
                BranchName: customer.BranchName,
                ModifiedBy: "SYSTEM",
                ModifiedDate: new Date().toISOString(),
            };

            const response = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/customers/${customer.Id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Customer update error response:", errorText);
                throw new Error(`Failed to update customer: ${errorText}`);
            }

            const data = await response.json();

            if (data.Success || data.success) {
                Swal.fire("Success", "Customer updated successfully", "success");
                return true;
            } else {
                Swal.fire("Error", data.message || "Failed to update customer", "error");
                return false;
            }
        } catch (err) {
            console.error("Customer update error:", err);
            Swal.fire("Error", err.message || "Failed to update customer", "error");
            return false;
        } finally {
            setLoading(false);
        }
    };

    // ========================
    // SUBMIT HANDLER FOR NEXT OF KIN - Uses original API structure
    // ========================
    const handleNextOfKinUpdates = async () => {
        setUpdatingNextOfKin(true);
        let allSuccessful = true;

        try {
            for (const nok of nextOfKins) {
                const payload = {
                    customerId: customer.Id,
                    salutation: parseInt(nok.Salutation) || 1,
                    gender: parseInt(nok.Gender) || 1,
                    relationship: parseInt(nok.Relationship) || 1,
                    firstName: nok.FirstName,
                    lastName: nok.LastName,
                    identityCardType: parseInt(nok.IdentityCardType) || 1,
                    identityCardNumber: nok.IdentityCardNumber,
                    addressAddressLine1: nok.AddressAddressLine1 || "",
                    addressAddressLine2: nok.AddressAddressLine2 || "",
                    addressStreet: nok.AddressStreet || "",
                    addressPostalCode: nok.AddressPostalCode || "",
                    addressCity: nok.AddressCity || "",
                    addressEmail: nok.AddressEmail || "",
                    addressLandLine: nok.AddressLandLine || "",
                    addressMobileLine: nok.AddressMobileLine || "",
                    nominatedPercentage: parseFloat(nok.NominatedPercentage) || 0,
                    remarks: nok.Remarks || "",
                    createdBy: "admin@example.com"
                };

                const response = await fetch(
                    `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/nextofkin`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "ngrok-skip-browser-warning": "true",
                        },
                        body: JSON.stringify(payload),
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("NOK Error:", errorText);
                    allSuccessful = false;
                }
            }

            if (allSuccessful) {
                Swal.fire("Success", "Next of Kin records processed successfully", "success");
                return true;
            } else {
                Swal.fire("Partial Success", "Some Next of Kin records failed to update", "warning");
                return true;
            }
        } catch (err) {
            console.error("Next of Kin update error:", err);
            Swal.fire("Error", err.message || "Failed to update Next of Kin", "error");
            return false;
        } finally {
            setUpdatingNextOfKin(false);
        }
    };

    // ========================
    // MAIN SUBMIT HANDLER
    // ========================
    const handleSubmit = async () => {
        if (step === 1) {
            const success = await handleCustomerUpdate();
            if (success) {
                refresh();
                onClose();
            }
            return;
        }

        if (step === 2) {
            if (totalNokPercentage > 100) {
                Swal.fire(
                    "Invalid Allocation",
                    `Next of Kin percentages cannot exceed 100%. Current: ${totalNokPercentage}%`,
                    "error"
                );
                return;
            }

            const customerSuccess = await handleCustomerUpdate();
            if (!customerSuccess) return;

            const nokSuccess = await handleNextOfKinUpdates();
            if (nokSuccess) {
                refresh();
                onClose();
            }
            return;
        }

        if (step === 3) {
            const success = await handleCustomerUpdate();
            if (success) {
                refresh();
                onClose();
            }
            return;
        }
    };

    const fetchBranches = async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/branches`,
                { headers: { "ngrok-skip-browser-warning": "true" } }
            );
            const json = await res.json();
            setBranches(json.data || []);
        } catch (err) {
            console.error("Fetch Branches Error:", err);
        }
    };

    const loadStations = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/stations`);
            const json = await res.json();
            if (json.success) {
                setStations(json.data);
            }
        } catch (err) {
            console.error("Failed to load stations", err);
        }
    };

    useEffect(() => {
        if (open) {
            loadStations();
            fetchBranches();
        }
    }, [open]);

    const totalNokPercentage = nextOfKins.reduce(
        (sum, k) => sum + Number(k.NominatedPercentage || 0),
        0
    );

    const getSubmitButtonText = () => {
        if (loading || updatingNextOfKin) {
            return "Updating...";
        }
        if (step === 1) {
            return "Update Customer";
        }
        if (step === 2) {
            return "Update Customer & Next of Kin";
        }
        if (step === 3) {
            return "Update Customer";
        }
        return "Update";
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
                        className="fixed top-3 right-3 w-[85vw] max-w-[1150px] bg-white shadow-2xl z-50 flex flex-col rounded-2xl"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 280, damping: 28 }}
                    >

                        {/* HEADER */}
                        <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
                            <h2 className="font-bold text-xl text-white">
                                Edit Member - {customer.IndividualFirstName} {customer.IndividualLastName}
                            </h2>
                            <Button variant="outline" size="sm" onClick={onClose}>
                                Close
                            </Button>
                        </div>

                        <div className="grid grid-cols-12 h-[88vh] overflow-hidden p-3">
                            {/* LEFT STEPS NAVIGATION */}
                            <aside className="col-span-3 bg-gray-200 p-3 rounded-lg">
                                {["Personal Details", "Next of Kin", "Uploads"].map((label, index) => (
                                    <Card
                                        key={index}
                                        className={`p-3 mb-2 cursor-pointer border 
                                        ${step === index + 1
                                                ? "bg-indigo-700 border-indigo-500 text-white"
                                                : "hover:bg-gray-100"
                                            }
                                        `}
                                        onClick={() => setStep(index + 1)}
                                    >
                                        <p className="font-medium text-sm">{label}</p>
                                    </Card>
                                ))}
                            </aside>

                            {/* RIGHT CONTENT */}
                            <main className="col-span-9 p-6 overflow-y-auto">
                                {/* STEP 1 – PERSONAL INFO */}
                                {step === 1 && (
                                    <section>
                                        <h3 className="text-lg font-semibold mb-3 bg-indigo-700 text-white p-3 rounded-2xl">
                                            Personal Information
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div>
                                                <Label>Member Type</Label>
                                                <select
                                                    value={customer.Type}
                                                    onChange={(e) => updateCustomer("Type", e.target.value)}
                                                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="">Select Type</option>
                                                    <option value="1">Individual</option>
                                                    <option value="2">Partnership</option>
                                                    <option value="3">Corporation</option>
                                                    <option value="4">MicroCredit</option>
                                                </select>
                                            </div>

                                            <div>
                                                <Label>Surname</Label>
                                                <Input
                                                    value={customer.IndividualLastName}
                                                    onChange={e => updateCustomer("IndividualLastName", e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <Label>First Name</Label>
                                                <Input
                                                    value={customer.IndividualFirstName}
                                                    onChange={e => updateCustomer("IndividualFirstName", e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <Label>ID Number</Label>
                                                <Input
                                                    value={customer.IndividualIdentityCardNumber}
                                                    onChange={e => updateCustomer("IndividualIdentityCardNumber", e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <Label>Date of Birth</Label>
                                                <Input
                                                    type="date"
                                                    value={customer.IndividualBirthDate}
                                                    onChange={e => updateCustomer("IndividualBirthDate", e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <Label>Mobile</Label>
                                                <Input
                                                    placeholder="+2547XXXXXXXX"
                                                    value={customer.AddressMobileLine}
                                                    onChange={(e) => {
                                                        updateCustomer("AddressMobileLine", e.target.value);
                                                        setErrors(prev => ({ ...prev, addressMobileLine: "" }));
                                                    }}
                                                    onBlur={() => {
                                                        if (customer.AddressMobileLine &&
                                                            !/^\+254(7|1)\d{8}$/.test(customer.AddressMobileLine)) {
                                                            setErrors(prev => ({
                                                                ...prev,
                                                                addressMobileLine: "Phone must start with +254 and be 12 digits",
                                                            }));
                                                        }
                                                    }}
                                                    className={errors.addressMobileLine ? "border-red-500" : ""}
                                                />
                                                {errors.addressMobileLine && (
                                                    <p className="text-sm text-red-500 mt-1">{errors.addressMobileLine}</p>
                                                )}
                                            </div>

                                            <div>
                                                <Label>Landline</Label>
                                                <Input
                                                    value={customer.AddressLandLine}
                                                    onChange={(e) => updateCustomer("AddressLandLine", e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <Label>Email</Label>
                                                <Input
                                                    type="email"
                                                    value={customer.AddressEmail}
                                                    onChange={(e) => {
                                                        updateCustomer("AddressEmail", e.target.value);
                                                        setErrors(prev => ({ ...prev, addressEmail: "" }));
                                                    }}
                                                    onBlur={() => {
                                                        if (customer.AddressEmail &&
                                                            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.AddressEmail)) {
                                                            setErrors(prev => ({
                                                                ...prev,
                                                                addressEmail: "Enter a valid email address",
                                                            }));
                                                        }
                                                    }}
                                                    className={errors.addressEmail ? "border-red-500" : ""}
                                                />
                                                {errors.addressEmail && (
                                                    <p className="text-sm text-red-500 mt-1">{errors.addressEmail}</p>
                                                )}
                                            </div>

                                            <div>
                                                <Label>Marital Status</Label>
                                                <select
                                                    value={customer.IndividualMaritalStatus}
                                                    onChange={(e) => updateCustomer("IndividualMaritalStatus", e.target.value)}
                                                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="">Select Status</option>
                                                    <option value="1">Single</option>
                                                    <option value="2">Married</option>
                                                    <option value="3">Divorced</option>
                                                    <option value="4">Widowed</option>
                                                    <option value="5">Separated</option>
                                                </select>
                                            </div>

                                            <div>
                                                <Label>PIN</Label>
                                                <Input
                                                    placeholder="A123456789B"
                                                    value={customer.PersonalIdentificationNumber}
                                                    onChange={(e) => {
                                                        updateCustomer("PersonalIdentificationNumber", e.target.value.toUpperCase());
                                                        setErrors(prev => ({ ...prev, personalIdentificationNumber: "" }));
                                                    }}
                                                    onBlur={() => {
                                                        if (customer.PersonalIdentificationNumber &&
                                                            !/^[A-Z]\d{9}[A-Z]$/.test(customer.PersonalIdentificationNumber)) {
                                                            setErrors(prev => ({
                                                                ...prev,
                                                                personalIdentificationNumber: "KRA PIN must be in format A123456789B",
                                                            }));
                                                        }
                                                    }}
                                                    className={errors.personalIdentificationNumber ? "border-red-500" : ""}
                                                />
                                                {errors.personalIdentificationNumber && (
                                                    <p className="text-sm text-red-500 mt-1">{errors.personalIdentificationNumber}</p>
                                                )}
                                            </div>

                                            <div>
                                                <Label>Gender</Label>
                                                <select
                                                    value={customer.IndividualGender}
                                                    onChange={(e) => updateCustomer("IndividualGender", e.target.value)}
                                                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="">Select Gender</option>
                                                    <option value="1">Male</option>
                                                    <option value="2">Female</option>
                                                </select>
                                            </div>

                                            <div>
                                                <Label>City</Label>
                                                <Input
                                                    value={customer.AddressCity}
                                                    onChange={e => updateCustomer("AddressCity", e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <Label>Postal Code</Label>
                                                <Input
                                                    value={customer.AddressPostalCode}
                                                    onChange={e => updateCustomer("AddressPostalCode", e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <Label>Address</Label>
                                                <Input
                                                    value={customer.AddressStreet}
                                                    onChange={(e) => updateCustomer("AddressStreet", e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <Label>Nationality</Label>
                                                <Input
                                                    value={customer.IndividualNationality}
                                                    onChange={e => updateCustomer("IndividualNationality", e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <Label>Payroll Number</Label>
                                                <Input
                                                    value={customer.IndividualPayrollNumbers}
                                                    onChange={e => updateCustomer("IndividualPayrollNumbers", e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <Label>Branch</Label>
                                                <Select
                                                    onValueChange={(value) => updateCustomer("BranchId", value)}
                                                    value={customer.BranchId}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select branch" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {branches.map((b) => (
                                                            <SelectItem key={b.Id} value={b.Id}>
                                                                {b.Description}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label>Station</Label>
                                                <Select
                                                    onValueChange={(value) => updateCustomer("StationId", value)}
                                                    value={customer.StationId}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select station" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {stations.map((s) => (
                                                            <SelectItem key={s.Id} value={s.Id}>
                                                                {s.Description}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label>Designation</Label>
                                                <Input
                                                    value={customer.IndividualEmploymentDesignation}
                                                    onChange={e => updateCustomer("IndividualEmploymentDesignation", e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <Label>Terms of Service</Label>
                                                <select
                                                    value={customer.IndividualEmploymentTermsOfService}
                                                    onChange={e => updateCustomer("IndividualEmploymentTermsOfService", e.target.value)}
                                                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="">Select Terms</option>
                                                    <option value="1">Permanent</option>
                                                    <option value="2">Contract</option>
                                                    <option value="3">Casual</option>
                                                    <option value="4">Self-Employed</option>
                                                    <option value="5">Unemployed</option>
                                                </select>
                                            </div>

                                            <div>
                                                <Label>Registration Date</Label>
                                                <Input
                                                    type="date"
                                                    value={customer.RegistrationDate}
                                                    onChange={e => updateCustomer("RegistrationDate", e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <Label>Bank Account</Label>
                                                <Input
                                                    value={customer.Reference1}
                                                    onChange={e => updateCustomer("Reference1", e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <Label>Bank Name</Label>
                                                <select
                                                    value={customer.BankName}
                                                    onChange={e => updateCustomer("BankName", e.target.value)}
                                                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="">Select Bank</option>
                                                    <option value="KCB">KCB</option>
                                                    <option value="EQUITY">EQUITY</option>
                                                    <option value="Cooperative">Cooperative</option>
                                                </select>
                                            </div>

                                            <div>
                                                <Label>Bank Branch</Label>
                                                <Input
                                                    value={customer.BranchName}
                                                    onChange={e => updateCustomer("BranchName", e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <Label>Member Number</Label>
                                                <Input
                                                    value={customer.Reference2}
                                                    onChange={e => updateCustomer("Reference2", e.target.value)}
                                                    disabled
                                                />
                                            </div>

                                            <div className="col-span-4">
                                                <Label>Remarks</Label>
                                                <Input
                                                    value={customer.Remarks}
                                                    onChange={e => updateCustomer("Remarks", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </section>
                                )}

                                {/* STEP 2 – NEXT OF KIN */}
                                {step === 2 && (
                                    <section>
                                        <h3 className="text-lg font-semibold mb-2 bg-indigo-700 text-white p-3 rounded-2xl">Next of Kin</h3>
                                        <div className="flex justify-end items-center p-2">
                                            <p className={`mt-4 font-semibold ${totalNokPercentage === 100 ? "text-green-600" : "text-red-600"}`}>
                                                Total Allocation: {totalNokPercentage}% / 100%
                                            </p>
                                        </div>

                                        {nextOfKins.map((nok, index) => (
                                            <div key={index} className="mb-6 p-4 border rounded-lg">
                                                {nextOfKins.length > 1 && (
                                                    <div className="flex justify-between items-center bg-gray-200 rounded-md p-2 px-4 mb-3">
                                                        <h3 className="font-medium">Next of Kin {index + 1}</h3>
                                                        <Button
                                                            onClick={() => removeNextOfKin(index)}
                                                            className="text-sm bg-red-600 hover:bg-red-800 text-red-100 hover:text-red-100"
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div>
                                                        <Label>First Name</Label>
                                                        <Input
                                                            value={nok.FirstName}
                                                            onChange={(e) => updateNextOfKin(index, "FirstName", e.target.value)}
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label>Last Name</Label>
                                                        <Input
                                                            value={nok.LastName}
                                                            onChange={(e) => updateNextOfKin(index, "LastName", e.target.value)}
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label>Gender</Label>
                                                        <select
                                                            value={nok.Gender}
                                                            onChange={(e) => updateNextOfKin(index, "Gender", e.target.value)}
                                                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                        >
                                                            <option value="">Select Gender</option>
                                                            <option value="0">Not Specified</option>
                                                            <option value="1">Male</option>
                                                            <option value="2">Female</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <Label>Relationship</Label>
                                                        <select
                                                            value={nok.Relationship}
                                                            onChange={(e) => updateNextOfKin(index, "Relationship", e.target.value)}
                                                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                        >
                                                            <option value="">Select Relationship</option>
                                                            <option value="0">Not Specified</option>
                                                            <option value="1">Spouse</option>
                                                            <option value="2">Parent</option>
                                                            <option value="3">Guardian</option>
                                                            <option value="4">Child</option>
                                                            <option value="5">Sibling</option>
                                                            <option value="6">Other</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <Label>Percentage</Label>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            step="0.1"
                                                            value={nok.NominatedPercentage}
                                                            onChange={(e) => {
                                                                const newValue = Number(e.target.value);
                                                                const otherTotal = nextOfKins.reduce(
                                                                    (sum, k, i) => i === index ? sum : sum + Number(k.NominatedPercentage || 0),
                                                                    0
                                                                );

                                                                if (otherTotal + newValue > 100) {
                                                                    Swal.fire({
                                                                        icon: "warning",
                                                                        title: "Invalid Percentage",
                                                                        text: `Total percentage cannot exceed 100%. Remaining: ${100 - otherTotal}%`,
                                                                    });
                                                                    return;
                                                                }

                                                                updateNextOfKin(index, "NominatedPercentage", newValue);
                                                            }}
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label>ID Number</Label>
                                                        <Input
                                                            value={nok.IdentityCardNumber}
                                                            onChange={(e) => updateNextOfKin(index, "IdentityCardNumber", e.target.value)}
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label>Email</Label>
                                                        <Input
                                                            type="email"
                                                            value={nok.AddressEmail}
                                                            onChange={(e) => updateNextOfKin(index, "AddressEmail", e.target.value)}
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label>Mobile</Label>
                                                        <Input
                                                            value={nok.AddressMobileLine}
                                                            onChange={(e) => updateNextOfKin(index, "AddressMobileLine", e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="col-span-4">
                                                        <Label>Remarks</Label>
                                                        <Input
                                                            value={nok.Remarks}
                                                            onChange={(e) => updateNextOfKin(index, "Remarks", e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <Button variant="outline" className="bg-indigo-600 text-white" onClick={addNextOfKin}>
                                            + Add Next of Kin
                                        </Button>
                                    </section>
                                )}

                                {/* STEP 3 – UPLOADS */}
                                {step === 3 && (
                                    <section>
                                        <h3 className="text-lg font-semibold mb-3">Member Documents</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>ID Front Image</Label>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            updateCustomer("IdentityCardFrontSideImageId", file.name);
                                                        }
                                                    }}
                                                />
                                                {customer.IdentityCardFrontSideImageId && (
                                                    <p className="text-green-600 text-sm mt-1">
                                                        {customer.IdentityCardFrontSideImageId}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <Label>ID Back Image</Label>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            updateCustomer("IdentityCardBackSideImageId", file.name);
                                                        }
                                                    }}
                                                />
                                                {customer.IdentityCardBackSideImageId && (
                                                    <p className="text-green-600 text-sm mt-1">
                                                        {customer.IdentityCardBackSideImageId}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <Label>Passport Image</Label>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            updateCustomer("PassportImageId", file.name);
                                                        }
                                                    }}
                                                />
                                                {customer.PassportImageId && (
                                                    <p className="text-green-600 text-sm mt-1">
                                                        {customer.PassportImageId}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <Label>Signature Image</Label>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            updateCustomer("SignatureImageId", file.name);
                                                        }
                                                    }}
                                                />
                                                {customer.SignatureImageId && (
                                                    <p className="text-green-600 text-sm mt-1">
                                                        {customer.SignatureImageId}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </section>
                                )}

                                {/* NAVIGATION BUTTONS */}
                                <div className="flex justify-between mt-10">
                                    {step > 1 ? (
                                        <Button variant="outline" onClick={back} disabled={loading || updatingNextOfKin}>
                                            Back
                                        </Button>
                                    ) : <span></span>}

                                    {step < 3 ? (
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => {
                                                    if (step === 2 && totalNokPercentage > 100) {
                                                        Swal.fire(
                                                            "Invalid Allocation",
                                                            `Next of Kin percentages cannot exceed 100%. Current: ${totalNokPercentage}%`,
                                                            "error"
                                                        );
                                                        return;
                                                    }
                                                    next();
                                                }}
                                                disabled={loading || updatingNextOfKin}
                                            >
                                                Next
                                            </Button>
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={loading || updatingNextOfKin}
                                                variant="outline"
                                                className="bg-green-600 text-white hover:bg-green-700"
                                            >
                                                {getSubmitButtonText()}
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button onClick={handleSubmit} disabled={loading || updatingNextOfKin}>
                                            {getSubmitButtonText()}
                                        </Button>
                                    )}
                                </div>
                            </main>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}