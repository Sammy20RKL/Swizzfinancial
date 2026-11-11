import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const DRAFT_KEY = "member_registration_draft";

const initialCustomerState = {
    stationId: "",
    // companyId: "", // Added companyId
    // branchId: "",
    type: "",
    serialNumber: 0,
    personalIdentificationNumber: "",
    individualType: 1,
    individualFirstName: "",
    individualLastName: "",
    individualIdentityCardType: 1,
    individualIdentityCardNumber: "",
    individualPayrollNumbers: "",
    individualSalutation: 1,
    individualGender: "",
    individualMaritalStatus: "",
    individualNationality: "",
    individualBirthDate: "",
    individualEmploymentDesignation: "",
    individualEmploymentTermsOfService: "",
    individualEmploymentDate: "",
    addressAddressLine1: "",
    addressAddressLine2: "",
    addressStreet: "",
    addressPostalCode: "",
    addressCity: "",
    addressEmail: "",
    addressLandLine: "",
    addressMobileLine: "",
    passportImageId: null,
    signatureImageId: null,
    identityCardFrontSideImageId: null,
    identityCardBackSideImageId: null,
    remarks: "",
    recruitedBy: "SYSTEM",
    recordStatus: 1,
    createdBy: "SYSTEM",
    createdDate: new Date().toISOString().split("T")[0],
    reference1: "",
    bankName: "",
    branchName: "",
    registrationDate: new Date().toISOString().split("T")[0],
};

const initialNextOfKin = {
    salutation: "",
    gender: "",
    relationship: "",
    firstName: "",
    lastName: "",
    identityCardType: 1,
    identityCardNumber: "",
    addressAddressLine1: "",
    addressStreet: "",
    addressPostalCode: "",
    addressCity: "",
    addressEmail: "",
    addressMobileLine: "",
    nominatedPercentage: 0,
    remarks: "",
    createdBy: "SYSTEM",
};

const MemberRegistrationContext = createContext(null);

export function MemberRegistrationProvider({ children }) {
    const [customer, setCustomer] = useState(initialCustomerState);
    const [nextOfKins, setNextOfKins] = useState([{ ...initialNextOfKin }]);
    const [step, setStep] = useState(1);
    const isLoaded = useRef(false);

    // Load draft from localStorage once on mount
    useEffect(() => {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.customer) setCustomer(parsed.customer);
                if (parsed.nextOfKins) setNextOfKins(parsed.nextOfKins);
                if (parsed.step) setStep(parsed.step);
            } catch {
                // corrupt data — ignore
            }
        }
        isLoaded.current = true;
    }, []);

    // Auto-save on every state change
    useEffect(() => {
        if (!isLoaded.current) return;
        localStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({ customer, nextOfKins, step, lastSaved: new Date().toISOString() })
        );
    }, [customer, nextOfKins, step]);

    const hasDraft = Boolean(
        customer.individualFirstName ||
        customer.individualLastName ||
        customer.individualIdentityCardNumber
    );

    const clearDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        setCustomer({ 
            ...initialCustomerState, 
            createdDate: new Date().toISOString().split("T")[0], 
            registrationDate: new Date().toISOString().split("T")[0]
            // companyId: "" // Reset companyId
        });
        setNextOfKins([{ ...initialNextOfKin }]);
        setStep(1);
        isLoaded.current = false;
        // allow auto-save to resume after next user action
        setTimeout(() => { isLoaded.current = true; }, 0);
    };

    // Helper function to get payload with both stationId and companyId
    const getSubmitPayload = () => {
        return {
            customer: {
                ...customer
                // Keep stationId as is (from dropdown)
                // Add companyId mapped from stationId if companyId is empty
                // companyId: customer.companyId || customer.stationId, // samuel
            },
            nextOfKins: nextOfKins,
        };
    };

    return (
        <MemberRegistrationContext.Provider
            value={{ 
                customer, 
                setCustomer, 
                nextOfKins, 
                setNextOfKins, 
                step, 
                setStep, 
                hasDraft, 
                clearDraft, 
                initialNextOfKin,
                getSubmitPayload // Expose the helper function
            }}
        >
            {children}
        </MemberRegistrationContext.Provider>
    );
}

export function useMemberRegistration() {
    const ctx = useContext(MemberRegistrationContext);
    if (!ctx) throw new Error("useMemberRegistration must be used inside MemberRegistrationProvider");
    return ctx;
}