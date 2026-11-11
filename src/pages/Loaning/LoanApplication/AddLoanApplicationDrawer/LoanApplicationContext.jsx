import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const DRAFTS_KEY = "loan_application_drafts";

export const initialForm = {
    CustomerId: "",
    CustomerPersonalIdentificationNumber: "",
    CustomerIndividualIdentityCardNumber: "",
    CustomerIndividualPayrollNumbers: "",
    CustomerFullName: "",
    CustomerAddressMobileLine: "",
    CustomerAddressEmail: "",
    LoanProductId: "",
    LoanProductDescription: "",
    LoanRegistrationTermInMonths: 0,
    LoanInterestAnnualPercentageRate: 0,
    LoanInterestChargeModeDescription: "",
    LoanInterestCalculationModeDescription: "",
    LoanRegistrationLoanProductCategoryDescription: "",
    LoanRegistrationMaximumAmount: 0,
    LoanRegistrationMinimumInterestAmount: 0,
    LoanRegistrationInvestmentsMultiplier: 0,
    LoanRegistrationStandingOrderTriggerDescription: "",
    LoanRegistrationMinimumGuarantors: 0,
    LoanRegistrationMaximumGuarantees: 0,
    LoanRegistrationAllowSelfGuarantee: false,
    LoanPurposeDescription: "",
    Remarks: "",
    AmountApplied: 0,
    Reference: "",
    IsBatched: false,
    receivedDate: new Date().toISOString().split("T")[0],
    LoanRegistrationNetIncome: 0,
    LoanRegistrationTotalAllowance: 0,
    LoanRegistrationTotalDeduction: 0,
    LoanRegistrationTotalIncome: 0,
    SectorCode: "",
    SubSectorCode: "",
    parentId: "",
};

export const initialGuarantor = {
    CustomerId: "",
    searchValue: "",
    AmountGuaranteed: 0,
    PersonalIdentificationNumber: "",
    IndividualIdentityCardNumber: "",
    IndividualPayrollNumbers: "",
    AddressEmail: "",
    AddressMobileLine: "",
    FullName: "",
    Remarks: "",
};

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const LoanApplicationContext = createContext(null);

export function LoanApplicationProvider({ children }) {
    const [form, setForm] = useState({ 
        ...initialForm, 
        receivedDate: new Date().toISOString().split("T")[0] 
    });
    const [guarantors, setGuarantors] = useState([{ ...initialGuarantor }]);
    const [selectedAccounts, setSelectedAccounts] = useState([]);
    const [boosted, setBoosted] = useState(false);
    const [selectedParentLoan, setSelectedParentLoan] = useState(null);
    const [maxTermMonths, setMaxTermMonths] = useState(0);

    // Lazy init: reads localStorage synchronously before first render
    const [drafts, setDrafts] = useState(() => {
        try {
            const saved = localStorage.getItem(DRAFTS_KEY);
            if (!saved) return [];
            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });

    const [activeDraftId, setActiveDraftId] = useState(null);

    // Only true while loadDraft / newForm is resetting state
    const isRestoring = useRef(false);

    // Always persist the drafts array whenever it changes
    useEffect(() => {
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    }, [drafts]);

    // Auto-save every form change back into the active draft
    useEffect(() => {
        if (!activeDraftId || isRestoring.current) return;
        const ts = new Date().toISOString();
        setDrafts(prev =>
            prev.map(d =>
                d.id === activeDraftId
                    ? { 
                        ...d, 
                        form, 
                        guarantors, 
                        selectedAccounts, 
                        boosted, 
                        selectedParentLoan, 
                        maxTermMonths, 
                        lastSaved: ts 
                      }
                    : d
            )
        );
    }, [form, guarantors, selectedAccounts, boosted, selectedParentLoan, maxTermMonths, activeDraftId]);

    const hasDraft = Boolean(form.CustomerId || form.CustomerFullName || form.LoanProductId);
    const activeDraft = drafts.find(d => d.id === activeDraftId) || null;

    // Create a new draft entry from the current form state
    const saveNewDraft = (label) => {
        const id = generateId();
        const ts = new Date().toISOString();
        const draft = {
            id,
            label: label || form.CustomerFullName || `Draft ${drafts.length + 1}`,
            createdAt: ts,
            lastSaved: ts,
            form: { ...form },
            guarantors: [...guarantors],
            selectedAccounts: [...selectedAccounts],
            boosted,
            selectedParentLoan,
            maxTermMonths,
        };
        setDrafts(prev => [draft, ...prev]);
        setActiveDraftId(id);
        return draft;
    };

    // Load a saved draft into the form
    const loadDraft = (id) => {
        const draft = drafts.find(d => d.id === id);
        if (!draft) return;
        isRestoring.current = true;
        setForm(draft.form);
        setGuarantors(draft.guarantors || [{ ...initialGuarantor }]);
        setSelectedAccounts(draft.selectedAccounts || []);
        setBoosted(draft.boosted || false);
        setSelectedParentLoan(draft.selectedParentLoan || null);
        setMaxTermMonths(draft.maxTermMonths || 0);
        setActiveDraftId(id);
        setTimeout(() => { 
            isRestoring.current = false; 
        }, 0);
    };

    // Remove one draft from the list
    const deleteDraft = (id) => {
        setDrafts(prev => prev.filter(d => d.id !== id));
        if (activeDraftId === id) setActiveDraftId(null);
    };

    // Reset the form and detach from any active draft (start fresh)
    const newForm = () => {
        isRestoring.current = true;
        setForm({ 
            ...initialForm, 
            receivedDate: new Date().toISOString().split("T")[0] 
        });
        setGuarantors([{ ...initialGuarantor }]);
        setSelectedAccounts([]);
        setBoosted(false);
        setSelectedParentLoan(null);
        setMaxTermMonths(0);
        setActiveDraftId(null);
        setTimeout(() => { 
            isRestoring.current = false; 
        }, 0);
    };

    return (
        <LoanApplicationContext.Provider value={{
            form,
            setForm,
            guarantors,
            setGuarantors,
            selectedAccounts,
            setSelectedAccounts,
            boosted,
            setBoosted,
            selectedParentLoan,
            setSelectedParentLoan,
            maxTermMonths,
            setMaxTermMonths,
            hasDraft,
            drafts,
            activeDraftId,
            activeDraft,
            saveNewDraft,
            loadDraft,
            deleteDraft,
            newForm,
        }}>
            {children}
        </LoanApplicationContext.Provider>
    );
}

export function useLoanApplication() {
    const ctx = useContext(LoanApplicationContext);
    if (!ctx) throw new Error("useLoanApplication must be used inside LoanApplicationProvider");
    return ctx;
}