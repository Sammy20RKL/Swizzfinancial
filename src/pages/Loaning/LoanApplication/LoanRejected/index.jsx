
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

export default function LoanRejected() {
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
            `${import.meta.env.VITE_APP_LOANING_URL}/api/Loaning/GetLoansBy?status=Rejected&filterType=1&pageIndex=${pageIndex}&pageSize=${pageSize}`
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

    const handleSubmitForAppraisal = async (id) => {
        // Open SweetAlert modal for option selection
        const { value: selectedOption } = await Swal.fire({
            title: 'Select Audit Option',
            input: 'radio',
            inputOptions: {
                1: 'Verify',
                2: 'Reject',
                4: 'Defer',
            },
            inputValidator: (value) => {
                if (!value) return 'You need to choose an option!';
            },
            showCancelButton: true,
            confirmButtonText: 'Submit',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#6b7280',
        });

        if (!selectedOption) return; // user cancelled

        setSubmitting(id);
        const payload = {
            loanCaseId: id,
            loanAuditOption: parseInt(selectedOption),
        };

        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_LOANING_URL}/api/Loaning/loan/appraisal`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                }
            );
            if (res.ok) {
                Swal.fire('Success!', 'Loan sent for appraisal.', 'success');
                setRefresh(!refresh);
            } else {
                Swal.fire('Error!', 'Failed to submit loan.', 'error');
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
                    <span className="col-span-2 text-right">Actions</span>
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
                        {filteredLoans.map((loan) => (
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
                                    <span className="text-sm w-28 rounded-2xl col-span-2 text-center flex items-center justify-center p-1 bg-gray-500 text-white">
                                        {loan.StatusDescription}
                                    </span>
                                    <span className="font-semibold col-span-2">
                                        Ksh {loan.AmountApplied}
                                    </span>



                                    <div className="flex gap-2 col-span-3 justify-end">
                                        <Button
                                            size="sm"
                                            variant="default"
                                            className="bg-indigo-600 text-white"
                                            onClick={() => handleSubmitForAppraisal(loan.Id)}
                                            disabled={submitting === loan.Id}
                                        >
                                            {submitting === loan.Id ? "Submitting..." : "Appraise"}
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-green-700 text-white hover:bg-green-700"
                                            onClick={() => {
                                                setSelectedLoanCaseId(loan.Id);
                                                setShowGuarantors(true);
                                            }}
                                        >
                                            View Guarantors
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


                                    </div>

                                </div>

                            </div>
                        ))}
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

        </div>
    );
}
