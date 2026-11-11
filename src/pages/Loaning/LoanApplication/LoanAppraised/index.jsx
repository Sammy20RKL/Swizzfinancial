import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaUser,
    FaBuilding,
    FaChevronDown,
    FaChevronUp,
    FaPaperPlane,
} from "react-icons/fa";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import LoanDetailsDrawer from "./LoanDetailsDrawer";
import LoanGuarantorsDrawer from "./LoanGuarantorsDrawer";

export default function LoanAppraised() {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);
    const [submitting, setSubmitting] = useState(null);
    const [refresh, setRefresh] = useState(true);
    const [pageIndex, setPageIndex] = useState(0);
    const [auditOptions, setAuditOptions] = useState({}); // Store selected option per loan
    const pageSize = 10;

    const [searchTerm, setSearchTerm] = useState("");

    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);

    const [showGuarantors, setShowGuarantors] = useState(false);
    const [selectedLoanCaseId, setSelectedLoanCaseId] = useState(null);

    const fetchLoanDrafts = () => {
        setLoading(true);
        fetch(
            `${import.meta.env.VITE_APP_LOANING_URL}/api/Loaning/GetLoansBy?status=audited&filterType=1&pageIndex=${pageIndex}&pageSize=${pageSize}`
        )
            .then((res) => res.json())
            .then((data) => {
                setLoans(data.items || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchLoanDrafts();
    }, [refresh, pageIndex]);

    const handleApprovalAction = async (id, loanCaseNumber) => {
        console.log(id);

        // Open SweetAlert modal for action selection
        const { value: selectedOption, isConfirmed } = await Swal.fire({
            title: 'Approval Action',
            text: `Select action for Loan #${loanCaseNumber.toString().padStart(7, "0")}`,
            input: 'radio',
            inputOptions: {
                1: '✅ Approve Loan',
                2: '❌ Reject Loan',
                4: '⏸️ Defer Decision',
            },
            html: `
                <div style="display:flex; flex-direction:column; gap:1rem; margin-top: 1rem;">
                    <label style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 500;">Action Date:</span>
                        <input type="date" id="auditDate" class="swal2-input" style="margin: 0;" />
                    </label>
                    <label style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 500;">Remarks (Optional):</span>
                        <input type="text" id="remarks" class="swal2-input" placeholder="Enter remarks here..." style="margin: 0; width: 60%;" />
                    </label>
                </div>
            `,
            didOpen: () => {
                document.getElementById('auditDate').value = new Date().toISOString().split('T')[0];
                document.getElementById('remarks').value = '';
            },
            inputValidator: (value) => {
                if (!value) return 'Please select an action!';
            },
            showCancelButton: true,
            confirmButtonText: 'Submit Action',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#6b7280',
            width: '500px',
        });

        if (!isConfirmed || !selectedOption) return; // user cancelled

        setSubmitting(id);

        const auditDate = document.getElementById('auditDate').value;
        const remarks = document.getElementById('remarks').value;

        const payload = {
            Id: id,
            loanAuditOption: parseInt(selectedOption),
            AuditDate: auditDate,
            Remarks: remarks || null,
        };
        
        console.log("Sending payload:", payload);

        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_LOANING_URL}/api/Loaning/Approve`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                }
            );

            const message = await res.json();
            console.log(message);

            if (res.ok) {
                if (message.Success) {
                    // Show different success messages based on action
                    let successMessage = '';
                    switch (parseInt(selectedOption)) {
                        case 1:
                            successMessage = 'Loan has been approved successfully!';
                            break;
                        case 2:
                            successMessage = 'Loan has been rejected successfully.';
                            break;
                        case 4:
                            successMessage = 'Loan decision has been deferred.';
                            break;
                        default:
                            successMessage = message.Message;
                    }
                    Swal.fire('Success!', successMessage, 'success');
                    setRefresh(!refresh);
                } else {
                    Swal.fire('Error!', message.Message, 'error');
                }
            } else {
                Swal.fire('Error!', message.Message || 'Something went wrong.', 'error');
            }
        } catch (err) {
            Swal.fire('Error!', 'Something went wrong.', 'error');
        } finally {
            setSubmitting(null);
        }
    };

    const handleOptionChange = (loanId, value) => {
        setAuditOptions({ ...auditOptions, [loanId]: parseInt(value) });
    };

    const filteredLoans = loans.filter((loan) => {
        const term = searchTerm.toLowerCase();
        return (
            loan.CaseNumber?.toString().includes(term) ||
            `${loan.CustomerIndividualFirstName} ${loan.CustomerIndividualLastName}`
                .toLowerCase()
                .includes(term) ||
            loan.BranchDescription?.toLowerCase().includes(term) ||
            loan.StatusDescription?.toLowerCase().includes(term)
        );
    });

    // Get action button text and style based on current status
    const getActionButtonProps = (loan) => {
        const status = loan.StatusDescription?.toLowerCase() || '';
        if (status.includes('approve') || status.includes('approved')) {
            return { text: 'Approved', disabled: true, className: 'bg-green-600 cursor-not-allowed' };
        } else if (status.includes('reject') || status.includes('rejected')) {
            return { text: 'Rejected', disabled: true, className: 'bg-red-600 cursor-not-allowed' };
        } else if (status.includes('defer') || status.includes('deferred')) {
            return { text: 'Deferred', disabled: true, className: 'bg-yellow-600 cursor-not-allowed' };
        }
        return { text: 'Take Action', disabled: false, className: 'bg-indigo-600 hover:bg-indigo-700' };
    };

    return (
        <div className="bg-white py-8 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <input
                    type="text"
                    placeholder="Search by loan no, customer, branch, status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-1/3 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <Button
                    size="sm"
                    variant="outline"
                    className="bg-gray-600 text-white hover:bg-gray-700"
                    onClick={() => setRefresh(!refresh)}
                >
                    Refresh
                </Button>
            </div>

            <div className="bg-gray-200 p-4 rounded-sm">
                <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-1">Loan No.</span>
                    <span className="col-span-2">Customer</span>
                    <span className="col-span-2">Branch</span>
                    <span className="col-span-2">Status</span>
                    <span className="col-span-2">Amount</span>
                    <span className="col-span-3 text-right">Actions</span>
                </div>

                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-6 gap-2 bg-gray-50 py-4 px-6 rounded"
                            >
                                {Array.from({ length: 6 }).map((__, j) => (
                                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : filteredLoans.length > 0 ? (
                    <div className="space-y-2">
                        {filteredLoans.map((loan) => {
                            const actionProps = getActionButtonProps(loan);
                            return (
                                <div
                                    key={loan.Id}
                                    className="bg-white rounded-lg shadow-lg border"
                                >
                                    <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                                        <span className="font-medium text-indigo-700 col-span-1">
                                            {loan.CaseNumber.toString().padStart(7, "0")}
                                        </span>
                                        <span className="flex items-center gap-2 col-span-2">
                                            {loan.CustomerIndividualFirstName + " " + loan.CustomerIndividualLastName}
                                        </span>
                                        <span className="flex items-center gap-2 col-span-2">
                                            {loan.BranchDescription}
                                        </span>
                                        <span className={`text-sm w-28 rounded-2xl col-span-2 text-center flex items-center justify-center p-1 ${
                                            loan.StatusDescription?.toLowerCase().includes('approve') 
                                                ? 'bg-green-500' 
                                                : loan.StatusDescription?.toLowerCase().includes('reject')
                                                ? 'bg-red-500'
                                                : loan.StatusDescription?.toLowerCase().includes('defer')
                                                ? 'bg-yellow-500'
                                                : 'bg-gray-500'
                                        } text-white`}>
                                            {loan.StatusDescription}
                                        </span>
                                        <span className="font-semibold col-span-2">
                                            Ksh {loan.AmountApplied?.toLocaleString()}
                                        </span>

                                        <div className="flex gap-2 col-span-3 justify-end">
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className={actionProps.className}
                                                onClick={() => handleApprovalAction(loan.Id, loan.CaseNumber)}
                                                disabled={submitting === loan.Id || actionProps.disabled}
                                            >
                                                {submitting === loan.Id ? "Processing..." : actionProps.text}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="bg-gray-700 text-white hover:bg-gray-600"
                                                onClick={() => {
                                                    setSelectedLoan(loan);
                                                    setDetailsOpen(true);
                                                }}
                                            >
                                                View Details
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="bg-green-700 text-white hover:bg-green-700"
                                                onClick={() => {
                                                    setSelectedLoanCaseId(loan.Id);
                                                    setSelectedLoan(loan);
                                                    setShowGuarantors(true);
                                                }}
                                            >
                                                View Guarantors
                                            </Button>
                                        </div>
                                    </div>

                                    {expandedRow === loan.Id && (
                                        <div className="border-t bg-gray-300 p-4 mx-1 mb-1 rounded-b-lg space-y-4">
                                            <div className="bg-white p-4 rounded-lg shadow border">
                                                <h3 className="font-semibold text-white bg-indigo-700 p-3 rounded-xl mb-2 flex items-center gap-2">
                                                    Loan Details
                                                </h3>
                                                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-700">
                                                    <div>Loan Product: {loan.LoanProductDescription}</div>
                                                    <div>Customer Email: {loan.CustomerAddressEmail}</div>
                                                    <div>Phone: {loan.CustomerAddressMobileLine}</div>
                                                    <div>Amount Applied: Ksh {loan.AmountApplied?.toLocaleString()}</div>
                                                    <div>Received Date: {loan.ReceivedDate ? new Date(loan.ReceivedDate).toLocaleDateString() : '-'}</div>
                                                    <div>Status: {loan.StatusDescription}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-gray-500 text-center mt-4">
                        <img
                            src={NotFoundImage}
                            alt="Not Found"
                            className="mx-auto w-42 h-auto"
                        />
                        <p className="font-medium text-gray-400">No Loan Drafts found.</p>
                    </div>
                )}
            </div>

            <div className="flex justify-between mt-4">
                <Button
                    size="sm"
                    variant="outline"
                    disabled={pageIndex === 0}
                    onClick={() => setPageIndex(pageIndex - 1)}
                >
                    Previous
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPageIndex(pageIndex + 1)}
                >
                    Next
                </Button>
            </div>
            
            <LoanDetailsDrawer
                open={detailsOpen}
                loan={selectedLoan}
                onClose={() => setDetailsOpen(false)}
            />
            
            <LoanGuarantorsDrawer
                open={showGuarantors}
                loanCaseId={selectedLoanCaseId}
                loan={selectedLoan}
                onClose={() => setShowGuarantors(false)}
            />
        </div>
    );
}