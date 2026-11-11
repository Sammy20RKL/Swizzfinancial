import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";
import { FaUser, FaWallet, FaUsers } from "react-icons/fa";

import MemberInfoTab from "./MemberInfoTab";
import MemberAccountsTab from "./MemberAccountsTab";
import MemberNextOfKinTab from "./MemberNextOfKinTab";

export default function MemberDetailsDrawer({ open, onClose, member }) {
    if (!open || !member) return null;

    // Transform the new flat structure to the old nested structure
    const transformedMember = {
        Customer: {
            Id: member.id || "",
            Reference2: member.memberNumber || member.Reference2 || "",
            Reference1: member.reference1 || "",
            Reference3: member.pfNumber || "",
            IndividualFirstName: member.firstName || "",
            IndividualLastName: member.lastName || "",
            IndividualIdentityCardNumber: member.idNumber || "",
            IndividualIdentityCardTypeDescription: member.idCardType === 1 ? "National ID" : member.idCardType === 2 ? "Passport" : "Not specified",
            IndividualPayrollNumbers: member.payrollNumber || "",
            PersonalIdentificationNumber: member.personalIdentificationNumber || member.pin || "",
            AddressMobileLine: member.address?.mobileLine || "",
            AddressLandLine: member.address?.landLine || "",
            AddressEmail: member.address?.email || "",
            AddressCity: member.address?.city || "",
            AddressAddressLine1: member.address?.addressLine1 || "",
            AddressAddressLine2: member.address?.addressLine2 || "",
            AddressPostalCode: member.address?.postalCode || "",
            RegistrationDate: member.registrationDate || "",
            IndividualBirthDate: member.birthDate || "",
            IndividualGenderDescription: member.gender === 1 ? "Male" : member.gender === 2 ? "Female" : "Not specified",
            IndividualMaritalStatusDescription: member.maritalStatus === 1 ? "Single" : member.maritalStatus === 2 ? "Married" : member.maritalStatus === 3 ? "Divorced" : member.maritalStatus === 4 ? "Widowed" : "Not specified",
            IndividualSalutationDescription: member.salutation === 1 ? "Mr." : member.salutation === 2 ? "Mrs." : member.salutation === 3 ? "Ms." : member.salutation === 4 ? "Dr." : member.salutation === 5 ? "Prof." : member.salutation === 6 ? "Rev." : "Not specified",
            IndividualNationalityDescription: member.nationality || "Kenyan",
            IndividualEmploymentDesignation: member.employmentDesignation || "",
            IndividualEmploymentTermsOfServiceDescription: member.employmentTerms === 1 ? "Permanent" : member.employmentTerms === 2 ? "Contract" : member.employmentTerms === 3 ? "Temporary" : "Not specified",
            StationDescription: member.station?.name || "",
            StationZoneDescription: member.station?.zone || "",
            StationZoneDivisionDescription: member.station?.division || "",
            StationZoneDivisionEmployerDescription: member.station?.employer || "",
            IndividualClassificationDescription: member.classification === 1 ? "Member" : "Non-Member",
            IsLocked: member.isLocked || false,
            IsDefaulter: member.isDefaulter || false,
            RecordStatus: member.recordStatus || 1,
            BankName: member.bankName || "",
            BranchName: member.branchName || "",
        },
        Accounts: member.accounts || [],
        NextOfKin: member.nextOfKin || [],
        Age: member.age || 0,
    };

    const { Customer, Accounts, NextOfKin, Age } = transformedMember;

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
                        className="fixed top-3 right-3 w-[85vw] max-w-[1000px] bg-white shadow-2xl z-50 
                                   flex flex-col rounded-2xl h-[94vh] overflow-hidden"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 26 }}
                    >
                        <div className="bg-gray-100 m-2 rounded-xl h-full flex flex-col">

                            {/* HEADER */}
                            <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-xl m-2">
                                <div>
                                    <h2 className="font-bold text-xl text-white">
                                        Member – {Customer?.IndividualFirstName} {Customer?.IndividualLastName}
                                    </h2>
                                    <p className="text-indigo-200 text-sm">
                                        Member No: {Customer?.Reference2} | {Customer?.BankName && `Bank: ${Customer?.BankName}`}
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" onClick={onClose}>
                                    Close
                                </Button>
                            </div>

                            {/* CONTENT */}
                            <div className="p-5 flex-1 overflow-y-auto">

                                <Tabs defaultValue="details">
                                    <TabsList className="flex justify-center gap-3 bg-indigo-800 text-white rounded-xl p-6 mb-6 shadow-inner">

                                        <TabsTrigger value="details" className="flex items-center gap-2 px-4 py-2">
                                            <FaUser /> Member Details
                                        </TabsTrigger>
                                        <TabsTrigger value="nok" className="flex items-center gap-2 px-4 py-2">
                                            <FaUsers /> Next of Kin ({NextOfKin?.length || 0})
                                        </TabsTrigger>
                                        <TabsTrigger value="accounts" className="flex items-center gap-2 px-4 py-2">
                                            <FaWallet /> Accounts ({Accounts?.length || 0})
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="details">
                                        <MemberInfoTab customer={Customer} age={Age} />
                                    </TabsContent>

                                    <TabsContent value="accounts">
                                        <MemberAccountsTab accounts={Accounts} memberName={`${Customer.IndividualFirstName} ${Customer.IndividualLastName}`} />
                                    </TabsContent>

                                    <TabsContent value="nok">
                                        <MemberNextOfKinTab nextOfKin={NextOfKin} memberName={`${Customer.IndividualFirstName} ${Customer.IndividualLastName}`} />
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}