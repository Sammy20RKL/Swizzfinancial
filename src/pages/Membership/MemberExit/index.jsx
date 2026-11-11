import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaSignOutAlt,
    FaChevronLeft,
    FaChevronRight,
    FaEye,
    FaCheckCircle,
    FaFileInvoiceDollar,
    FaCalendarAlt,
} from "react-icons/fa";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import MemberExitDetailsDrawer from "./MemberExitDetailsDrawer";
import AddMemberExitDrawer from "./AddMemberExitDrawer";
import SettlementDetailsDrawer from "./SettlementDetailsDrawer";

// Status constants based on your enums
const WithdrawalNotificationStatus = {
    Registered: 1,
    Approved: 2,
    Audited: 4,
    WithdrawalSettled: 8,
    Deferred: 16,
    DeathClaimSettled: 32
};

const MembershipWithdrawalSettlementType = {
    Normal: 1,
    Express: 2,
    Waiver: 4
};

export default function MemberExit() {
    const [exits, setExits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [openDetailsDrawer, setOpenDetailsDrawer] = useState(false);
    const [selectedExit, setSelectedExit] = useState(null);
    const [openAddExit, setOpenAddExit] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [openSettlementDrawer, setOpenSettlementDrawer] = useState(false);

    useEffect(() => {
        fetchMemberExits();
    }, []);

    const fetchMemberExits = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/MemberExit/GetAll`,
                {
                    headers: {
                        "ngrok-skip-browser-warning": "true",
                    },
                }
            );
            const json = await res.json();
            setExits(json.Data?.PageCollection || []);
        } catch (err) {
            console.error("Fetch Member Exit Error:", err);
            Swal.fire("Error", "Failed to load member exits", "error");
        } finally {
            setLoading(false);
        }
    };

    const getFullName = (m) =>
        `${m.CustomerIndividualFirstName || ""} ${m.CustomerIndividualLastName || ""}`.trim();

    const formatDate = (date) =>
        date && date !== "0001-01-01T00:00:00"
            ? new Date(date).toLocaleDateString()
            : "-";

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return "0.00";
        return amount.toLocaleString('en-KE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Calculate days remaining until maturity (30 days from created date)
    const calculateDaysRemaining = (createdDate) => {
        if (!createdDate || createdDate === "0001-01-01T00:00:00") return null;
        
        const created = new Date(createdDate);
        const maturityDate = new Date(created);
        maturityDate.setDate(created.getDate() + 30);
        
        const today = new Date();
        const diffTime = maturityDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
            daysRemaining: diffDays,
            maturityDate: maturityDate,
            isOverdue: diffDays < 0,
            isNearMaturity: diffDays <= 7 && diffDays >= 0,
            isMature: diffDays <= 0
        };
    };

    // Get maturity status color and message
    const getMaturityInfo = (createdDate) => {
        const info = calculateDaysRemaining(createdDate);
        if (!info) return { color: "text-gray-500", message: "No date set", badgeColor: "bg-gray-100" };
        
        if (info.isOverdue) {
            return { 
                color: "text-red-600", 
                message: `Overdue by ${Math.abs(info.daysRemaining)} days`,
                badgeColor: "bg-red-100 text-red-800"
            };
        } else if (info.isMature) {
            return { 
                color: "text-green-600", 
                message: "Mature - Ready for settlement",
                badgeColor: "bg-green-100 text-green-800"
            };
        } else if (info.isNearMaturity) {
            return { 
                color: "text-orange-600", 
                message: `${info.daysRemaining} days remaining (Due soon)`,
                badgeColor: "bg-orange-100 text-orange-800"
            };
        } else {
            return { 
                color: "text-blue-600", 
                message: `${info.daysRemaining} days remaining`,
                badgeColor: "bg-blue-100 text-blue-800"
            };
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            [WithdrawalNotificationStatus.Registered]: { color: "bg-blue-100 text-blue-800", label: "Registered" },
            [WithdrawalNotificationStatus.Approved]: { color: "bg-purple-100 text-purple-800", label: "Approved" },
            [WithdrawalNotificationStatus.Audited]: { color: "bg-yellow-100 text-yellow-800", label: "Verified" },
            [WithdrawalNotificationStatus.Deferred]: { color: "bg-orange-100 text-orange-800", label: "Deferred" },
            [WithdrawalNotificationStatus.WithdrawalSettled]: { color: "bg-green-100 text-green-800", label: "Withdrawal Settled" },
            [WithdrawalNotificationStatus.DeathClaimSettled]: { color: "bg-gray-100 text-gray-800", label: "Death Claim Settled" }
        };
        const config = statusMap[status] || { color: "bg-gray-100 text-gray-800", label: "Unknown" };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const canSettle = (status) => {
        return status === WithdrawalNotificationStatus.Audited;
    };

    const isSettled = (status) => {
        return status === WithdrawalNotificationStatus.WithdrawalSettled || 
               status === WithdrawalNotificationStatus.DeathClaimSettled;
    };

    const handleSettle = async (exit) => {
        // Check if notification is in Audited status (4)
        if (!canSettle(exit.Status)) {
            let requiredAction = "";
            if (exit.Status === WithdrawalNotificationStatus.Registered) {
                requiredAction = "This notification needs to be approved first.";
            } else if (exit.Status === WithdrawalNotificationStatus.Approved) {
                requiredAction = "This notification needs to be verified first.";
            } else if (exit.Status === WithdrawalNotificationStatus.Deferred) {
                requiredAction = "This notification has been deferred. It needs to be re-approved and verified.";
            } else if (isSettled(exit.Status)) {
                requiredAction = "This notification has already been settled.";
            }
            
            Swal.fire({
                title: "Cannot Settle",
                html: `<p>Notification is in <strong>${getStatusBadge(exit.Status).props.children}</strong> state.</p>
                       <p class="text-sm text-gray-600 mt-2">${requiredAction || "Only Verified notifications can be settled."}</p>`,
                icon: "warning",
                confirmButtonColor: "#3085d6"
            });
            return;
        }

        // Check if member has active loan guarantees
        let hasActiveGuarantees = false;
        let guarantorDetails = [];
        try {
            const guarantorRes = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/LoanGuarantor/GetByCustomerId/${exit.CustomerId}`,
                { headers: { "ngrok-skip-browser-warning": "true" } }
            );
            const guarantorData = await guarantorRes.json();
            if (guarantorData.Success && guarantorData.Data) {
                const activeGuarantees = guarantorData.Data.filter(g => g.RecordStatus === 1);
                hasActiveGuarantees = activeGuarantees.length > 0;
                guarantorDetails = activeGuarantees;
            }
        } catch (err) {
            console.error("Error checking guarantees:", err);
        }
        
        let replacementGuarantorData = {};
        if (hasActiveGuarantees) {
            const guarantorListHtml = guarantorDetails.map(g => 
                `<li class="text-sm">Loan ${g.LoanCaseNumber || 'N/A'} - Borrower: ${g.BorrowerName || 'Unknown'}</li>`
            ).join('');
            
            const { value: guarantorForm } = await Swal.fire({
                title: "Replacement Guarantor Required",
                html: `
                    <div class="text-left mb-4">
                        <p class="text-red-600 mb-2">⚠️ This member is guaranteeing the following active loan(s):</p>
                        <ul class="list-disc pl-5 mb-4">${guarantorListHtml}</ul>
                        <p class="mb-4">Please provide replacement guarantor details to proceed with settlement.</p>
                    </div>
                    <input type="text" id="guarantorName" class="swal2-input" placeholder="Replacement Guarantor Name" required>
                    <input type="text" id="guarantorId" class="swal2-input" placeholder="Replacement Guarantor Customer ID (GUID)" required>
                `,
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonText: "Proceed with Settlement",
                preConfirm: () => {
                    const name = document.getElementById("guarantorName").value;
                    const id = document.getElementById("guarantorId").value;
                    if (!name || !id) {
                        Swal.showValidationMessage("Please provide both guarantor name and ID");
                        return false;
                    }
                    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    if (!guidRegex.test(id)) {
                        Swal.showValidationMessage("Please enter a valid GUID for Customer ID");
                        return false;
                    }
                    return { name, id };
                },
            });
            
            if (!guarantorForm) return;
            replacementGuarantorData = {
                hasReplacementGuarantor: true,
                replacementGuarantorCustomerId: guarantorForm.id,
                replacementGuarantorName: guarantorForm.name
            };
        }

        // Calculate maturity info for display
        const maturityInfo = getMaturityInfo(exit.CreatedDate);
        
        // Settlement type selection
        const { value: settlementType } = await Swal.fire({
            title: "Select Settlement Type",
            html: `
                <div class="text-left">
                    <div class="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fas fa-calendar-alt text-indigo-600"></i>
                            <span class="font-semibold">Maturity Information</span>
                        </div>
                        <div class="space-y-1 text-sm">
                            <p><strong>Request Date:</strong> ${formatDate(exit.CreatedDate)}</p>
                            <p><strong>Maturity Date:</strong> ${maturityInfo.message.includes('No date') ? 'N/A' : new Date(new Date(exit.CreatedDate).setDate(new Date(exit.CreatedDate).getDate() + 30)).toLocaleDateString()}</p>
                            <p class="${maturityInfo.color} font-semibold">
                                <strong>Status:</strong> ${maturityInfo.message}
                            </p>
                        </div>
                    </div>
                    <p class="mb-3 font-semibold">Choose settlement type:</p>
                    <div class="space-y-2">
                        <label class="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" name="settlementType" value="1" class="mr-3 mt-1">
                            <div>
                                <strong>Normal Settlement</strong>
                                <p class="text-sm text-gray-600">Standard exit processing with regular fees</p>
                                <p class="text-xs text-green-500 mt-1">✓ Standard 30-day notice period applies</p>
                            </div>
                        </label>
                        <label class="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" name="settlementType" value="2" class="mr-3 mt-1">
                            <div>
                                <strong>Express Settlement</strong>
                                <p class="text-sm text-gray-600">Early exit with penalty fees applied</p>
                                <p class="text-xs text-amber-500 mt-1">💰 Early settlement penalty applies</p>
                            </div>
                        </label>
                        <label class="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" name="settlementType" value="4" class="mr-3 mt-1">
                            <div>
                                <strong>Waiver Settlement</strong>
                                <p class="text-sm text-gray-600">Special case - No fees deducted</p>
                                <p class="text-xs text-green-500 mt-1">✨ Management approval required</p>
                            </div>
                        </label>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: "Continue",
            preConfirm: () => {
                const selected = document.querySelector('input[name="settlementType"]:checked');
                if (!selected) {
                    Swal.showValidationMessage("Please select a settlement type");
                    return false;
                }
                return parseInt(selected.value);
            }
        });

        if (!settlementType) return;

        // Get settlement remarks
        const { value: remarks } = await Swal.fire({
            title: "Settlement Remarks",
            input: "textarea",
            inputPlaceholder: "Enter settlement remarks (optional)",
            showCancelButton: true
        });

        const settlementTypeText = settlementType === 1 ? "Normal" : settlementType === 2 ? "Express" : "Waiver";

        // Confirm settlement
        const confirm = await Swal.fire({
            title: "Confirm Settlement",
            html: `
                <div class="text-left space-y-2">
                    <p><strong>Member:</strong> ${getFullName(exit)}</p>
                    <p><strong>Member No:</strong> ${exit.PaddedCustomerSerialNumber || '-'}</p>
                    <p><strong>Request Date:</strong> ${formatDate(exit.CreatedDate)}</p>
                    <p><strong>Maturity Status:</strong> ${maturityInfo.message}</p>
                    <p><strong>Settlement Type:</strong> ${settlementTypeText}</p>
                    ${replacementGuarantorData.hasReplacementGuarantor ? `<p><strong>Replacement Guarantor:</strong> ${replacementGuarantorData.replacementGuarantorName}</p>` : ""}
                    <p><strong>Remarks:</strong> ${remarks || 'No remarks provided'}</p>
                    <hr class="my-3">
                    <div class="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <p class="text-sm text-yellow-800">
                            <strong>Note:</strong> Upon settlement:
                            <br/>• Deposit balance will be used to clear any outstanding loans
                            <br/>• Any excess deposit will be transferred to account 31700006
                            <br/>• Share capital remains untouched
                            <br/>• All accounts will be frozen
                        </p>
                    </div>
                    <p class="text-red-600 font-semibold mt-3">⚠️ This action cannot be undone!</p>
                </div>
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            confirmButtonText: "Yes, Settle Member",
            cancelButtonText: "Cancel"
        });

        if (!confirm.isConfirmed) return;

        // Show loading
        Swal.fire({
            title: "Processing Settlement...",
            text: "Please wait while we process the member exit",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const res = await fetch(`${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/values/settle-withdrawal-notification/${exit.Id}`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify({
                    moduleNavigationItemCode: 100,
                    settlementRemarks: remarks || `Member exit settled on ${new Date().toLocaleString()}`,
                    createdBy: "System.UI"
                }),
            });

            const result = await res.json();

            if (result.Success) {
                const data = result.Data;
                Swal.fire({
                    title: "Success!",
                    html: `
                        <div class="text-left">
                            <p class="mb-2">${result.Message || "Member exit settled successfully"}</p>
                            <div class="bg-green-50 p-3 rounded-lg mt-3">
                                <p><strong>Customer:</strong> ${data.customerName}</p>
                                <p><strong>Initial Deposit:</strong> ${formatCurrency(data.initialDepositBalance)} KSH</p>
                                ${data.totalLoanBalance > 0 ? `<p><strong>Loans Cleared:</strong> ${formatCurrency(data.totalLoanBalance)} KSH</p>` : ""}
                                <p><strong>Transferred to Account 31700006:</strong> ${formatCurrency(data.amountTransferredTo31700006)} KSH</p>
                                <p><strong>Status:</strong> ${data.transferDescription}</p>
                                <p class="text-sm text-gray-500 mt-2">${data.notes}</p>
                            </div>
                        </div>
                    `,
                    icon: "success",
                    confirmButtonColor: "#3085d6",
                    confirmButtonText: "OK"
                });
                fetchMemberExits();
            } else {
                Swal.fire({
                    title: "Settlement Failed",
                    text: result.Errors || result.Message || "Failed to settle member exit",
                    icon: "error",
                    confirmButtonColor: "#d33"
                });
            }
        } catch (err) {
            console.error("Settlement Error:", err);
            Swal.fire({
                title: "Error",
                text: err.message || "An unexpected error occurred",
                icon: "error"
            });
        }
    };

    // Search filter
    const filteredExits = exits.filter((m) => {
        const term = search.toLowerCase();
        return (
            getFullName(m).toLowerCase().includes(term) ||
            (m.CustomerIndividualIdentityCardNumber || "").toLowerCase().includes(term) ||
            (m.CustomerAddressMobileLine || "").toLowerCase().includes(term) ||
            (m.PaddedCustomerSerialNumber || "").toLowerCase().includes(term)
        );
    });

    // Pagination
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = filteredExits.slice(startIndex, startIndex + pageSize);
    const totalPages = Math.ceil(filteredExits.length / pageSize);

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaSignOutAlt /> Member Exits
                </h2>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => {
                        setSelectedCustomerId("PUT_CUSTOMER_ID_HERE");
                        setOpenAddExit(true);
                    }}
                >
                    Add Member Exit
                </Button>
            </div>

            {/* Search */}
            <div className="flex justify-start mb-6">
                <input
                    type="text"
                    placeholder="Search by name, ID, phone or Member No"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full max-w-md px-4 py-3 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* Table */}
            <div className="bg-gray-200 p-4 rounded-sm overflow-x-auto">
                <div className="grid grid-cols-13 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 min-w-[900px]">
                    <div className="col-span-2">Member No</div>
                    <div className="col-span-2">Full Name</div>
                    <div className="col-span-2">ID No</div>
                    <div className="col-span-2">Phone</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-2">Maturity</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {loading ? (
                    <div className="p-6 text-center text-gray-500">
                        Loading member exits...
                    </div>
                ) : paginatedData.length === 0 ? (
                    <div className="flex flex-col justify-center items-center p-10">
                        <img src={NotFoundImage} className="w-40 opacity-70" alt="No records" />
                        <p className="mt-4 text-gray-500">No Member Exit Records Found</p>
                    </div>
                ) : (
                    paginatedData.map((m) => {
                        const maturityInfo = getMaturityInfo(m.CreatedDate);
                        return (
                            <div key={m.Id} className="bg-white shadow-sm rounded-lg p-4 mb-4">
                                <div className="grid grid-cols-13 gap-4 items-center min-w-[900px]">
                                    <div className="col-span-2 font-semibold truncate">
                                        {m.PaddedCustomerSerialNumber || '-'}
                                    </div>
                                    <div className="col-span-2 font-semibold truncate">
                                        {getFullName(m)}
                                    </div>
                                    <div className="col-span-2 truncate">
                                        {m.CustomerIndividualIdentityCardNumber || "-"}
                                    </div>
                                    <div className="col-span-2 truncate">
                                        {m.CustomerAddressMobileLine || "-"}
                                    </div>
                                    <div className="col-span-1">
                                        {getStatusBadge(m.Status)}
                                    </div>
                                    <div className="col-span-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${maturityInfo.badgeColor}`}>
                                            {maturityInfo.message}
                                        </span>
                                    </div>
                                    <div className="col-span-2 flex gap-2 justify-end flex-wrap">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-gray-600 hover:bg-gray-700 text-white border-none"
                                            onClick={() => {
                                                setSelectedExit(m);
                                                setOpenDetailsDrawer(true);
                                            }}
                                        >
                                            <FaEye className="mr-1" /> View
                                        </Button>

                                        {!isSettled(m.Status) && (
                                            <Button
                                                size="sm"
                                                className={`text-white ${
                                                    canSettle(m.Status)
                                                        ? "bg-green-600 hover:bg-green-700"
                                                        : "bg-yellow-600 hover:bg-yellow-700 opacity-50 cursor-not-allowed"
                                                }`}
                                                onClick={() => handleSettle(m)}
                                                disabled={!canSettle(m.Status)}
                                                title={!canSettle(m.Status) ? "Notification must be verified first" : "Settle member exit"}
                                            >
                                                <FaCheckCircle className="mr-1" /> Settle
                                            </Button>
                                        )}

                                        {(m.Status === WithdrawalNotificationStatus.WithdrawalSettled || 
                                          m.Status === WithdrawalNotificationStatus.DeathClaimSettled) && (
                                            <Button
                                                size="sm"
                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                                onClick={() => { 
                                                    setSelectedExit(m); 
                                                    setOpenSettlementDrawer(true); 
                                                }}
                                            >
                                                <FaFileInvoiceDollar className="mr-1" /> Settlement
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                    >
                        <FaChevronLeft /> Prev
                    </Button>
                    <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                    >
                        Next <FaChevronRight />
                    </Button>
                </div>
            )}

            <AddMemberExitDrawer
                open={openAddExit}
                onClose={() => setOpenAddExit(false)}
                customerId={selectedCustomerId}
                refresh={fetchMemberExits}
            />

            <MemberExitDetailsDrawer
                open={openDetailsDrawer}
                onClose={() => setOpenDetailsDrawer(false)}
                exit={selectedExit}
            />

            <SettlementDetailsDrawer
                open={openSettlementDrawer}
                onClose={() => setOpenSettlementDrawer(false)}
                exitId={selectedExit?.Id}
            />
        </div>
    );
}