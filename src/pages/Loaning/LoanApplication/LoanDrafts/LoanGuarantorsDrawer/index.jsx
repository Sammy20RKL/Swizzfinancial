import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function LoanGuarantorsDrawer({ open, onClose, loanCaseId, loan }) {
    const [loading, setLoading] = useState(false);
    const [guarantors, setGuarantors] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [customerSearchTerm, setCustomerSearchTerm] = useState("");
    
    // Replacement modal state
    const [replaceModalOpen, setReplaceModalOpen] = useState(false);
    const [selectedGuarantor, setSelectedGuarantor] = useState(null);
    const [selectedNewGuarantor, setSelectedNewGuarantor] = useState(null);
    const [replacementAmount, setReplacementAmount] = useState("");
    const [replacementRemarks, setReplacementRemarks] = useState("");
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    
    // --- Filters & Pagination ---
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // Prevent body scroll when any modal is open
    useEffect(() => {
        if (replaceModalOpen || customerModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [replaceModalOpen, customerModalOpen]);

    // Fetch customers for replacement using the new API
    useEffect(() => {
        if (open) {
            setIsLoadingCustomers(true);
            // Use the new API endpoint with pagination
            fetch(`${import.meta.env.VITE_APP_LOANING_URL}/api/values/GetMembersWithDetails?search=${searchTerm}&pageIndex=0&pageSize=200`)
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                    }
                    return res.json();
                })
                .then(data => {
                    if (data.Success) {
                        // The data is in Data.members array
                        const members = data.Data?.members || [];
                        setCustomers(members);
                    } else {
                        setCustomers([]);
                    }
                    setIsLoadingCustomers(false);
                })
                .catch(err => {
                    console.error("Error fetching members:", err);
                    Swal.fire("Error", "Failed to load members: " + err.message, "error");
                    setIsLoadingCustomers(false);
                });
        }
    }, [open, searchTerm]);

    useEffect(() => {
        if (!open || !loanCaseId) return;

        const fetchGuarantors = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_APP_LOANING_URL}/api/GuarantorManagement/GetLoanGuarantors/${loanCaseId}`,
                    { headers: { "ngrok-skip-browser-warning": "true" } }
                );
                const data = await res.json();
                console.log("Fetched guarantors:", data);
                setGuarantors(data?.Data || []);
            } catch (err) {
                console.error("Failed to fetch guarantors", err);
            } finally {
                setLoading(false);
            }
        };

        fetchGuarantors();
    }, [open, loanCaseId]);

    // --- Filtered list based on search ---
    const filteredGuarantors = useMemo(() => {
        return guarantors.filter(g => {
            const text = `${g.CustomerIndividualFirstName} ${g.CustomerIndividualLastName} ${g.CustomerIndividualIdentityCardNumber} ${g.CustomerAddressMobileLine}`.toLowerCase();
            return text.includes(search.toLowerCase());
        });
    }, [guarantors, search]);

    // Filter customers for replacement modal - updated for new data structure
    const filteredCustomers = useMemo(() => {
        if (!customers.length) return [];
        
        return customers.filter(member => {
            // Skip if this is the current guarantor
            if (selectedGuarantor && member.id === selectedGuarantor.CustomerId) return false;
            // Skip if this is the loan applicant (they can't guarantee their own loan)
            if (loan && member.id === loan.CustomerId) return false;
            
            if (customerSearchTerm) {
                const searchText = `${member.firstName} ${member.lastName} ${member.idNumber} ${member.payrollNumber}`.toLowerCase();
                return searchText.includes(customerSearchTerm.toLowerCase());
            }
            
            return true;
        }).sort((a, b) => {
            const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
            const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [customers, customerSearchTerm, selectedGuarantor, loan]);

    // --- Pagination ---
    const totalPages = Math.ceil(filteredGuarantors.length / rowsPerPage);
    const paginatedGuarantors = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredGuarantors.slice(start, start + rowsPerPage);
    }, [filteredGuarantors, currentPage]);

    useEffect(() => setCurrentPage(1), [search]);

    // Get customer's deposit balance from accounts
    const getDepositBalance = (member) => {
        if (!member.accounts) return 0;
        const depositAccount = member.accounts.find(
            acc => acc.productDescription === "DEPOSITS"
        );
        return depositAccount ? Math.abs(depositAccount.balance) : 0;
    };

    const handleReplaceGuarantor = async () => {
        if (!selectedGuarantor || !selectedNewGuarantor) {
            Swal.fire("Error", "Please select both old and new guarantor", "error");
            return;
        }

        if (!replacementAmount || Number(replacementAmount) <= 0) {
            Swal.fire("Error", "Please enter a valid guaranteed amount", "error");
            return;
        }

        // Get the correct customer IDs
        const oldGuarantorId = selectedGuarantor.CustomerId;
        const newGuarantorId = selectedNewGuarantor.id;
        
        console.log("Old Guarantor ID:", oldGuarantorId);
        console.log("New Guarantor ID:", newGuarantorId);
        console.log("Loan Case ID:", loanCaseId);
        console.log("Amount:", Number(replacementAmount));

        const payload = {
            loanCaseId: loanCaseId,
            oldGuarantorCustomerId: oldGuarantorId,
            newGuarantorCustomerId: newGuarantorId,
            amountGuaranteed: Number(replacementAmount),
            remarks: replacementRemarks || "Guarantor replacement",
            replacedBy: "admin"
        };

        console.log("Sending payload:", payload);

        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_APP_LOANING_URL}/api/GuarantorManagement/ReplaceGuarantor`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true"
                    },
                    body: JSON.stringify(payload)
                }
            );

            const data = await response.json();
            console.log("Response:", data);

            if (data.Success || data.success) {
                Swal.fire("Success", "Guarantor replaced successfully", "success");
                // Refresh guarantors list
                const res = await fetch(
                    `${import.meta.env.VITE_APP_LOANING_URL}/api/GuarantorManagement/GetLoanGuarantors/${loanCaseId}`,
                    { headers: { "ngrok-skip-browser-warning": "true" } }
                );
                const newData = await res.json();
                setGuarantors(newData?.Data || []);
                setReplaceModalOpen(false);
                setSelectedGuarantor(null);
                setSelectedNewGuarantor(null);
                setReplacementAmount("");
                setReplacementRemarks("");
                setCustomerSearchTerm("");
            } else {
                Swal.fire("Error", data.Message || data.message || "Failed to replace guarantor", "error");
            }
        } catch (err) {
            console.error("Error replacing guarantor:", err);
            Swal.fire("Error", "An error occurred while replacing guarantor: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const openReplaceModal = (guarantor) => {
        console.log("Selected guarantor for replacement:", guarantor);
        setSelectedGuarantor(guarantor);
        setReplacementAmount(guarantor.AmountGuaranteed?.toString() || "");
        setCustomerSearchTerm("");
        setSelectedNewGuarantor(null);
        setReplaceModalOpen(true);
    };

    const downloadPDF = () => {
        if (!filteredGuarantors.length || !loan) return;

        const doc = new jsPDF("p", "mm", "a4");
        doc.setFontSize(16);
        doc.text(`Loan Guarantors - ${loan.CustomerIndividualFirstName} ${loan.CustomerIndividualLastName}`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

        const loanSummaryY = 30;
        doc.setFontSize(12);
        doc.text("Loan Summary", 14, loanSummaryY);
        doc.setFontSize(10);

        const loanSummaryData = [
            ["Member", `${loan.CustomerIndividualFirstName} ${loan.CustomerIndividualLastName}`],
            ["Member No", loan.CustomerReference2],
            ["Loan Product", loan.LoanProductDescription],
            ["Status", loan.StatusDescription],
            ["Approved Amount", `Ksh ${loan.ApprovedAmount?.toLocaleString()}`],
            ["Disbursed Amount", `Ksh ${loan.DisbursedAmount?.toLocaleString()}`],
            ["Monthly Payback", `Ksh ${loan.MonthlyPaybackAmount?.toLocaleString()} / month`],
            ["Term", `${loan.LoanRegistrationTermInMonths} months`],
            ["Interest Rate", `${loan.LoanInterestAnnualPercentageRate}% p.a`],
            ["Total Payback", `Ksh ${loan.TotalPaybackAmount?.toLocaleString()}`],
            ["Loan Balance", `Ksh ${loan.LoanProductLoanBalance?.toLocaleString()}`],
            ["Branch", loan.BranchDescription],
            ["Disbursed On", loan.DisbursedDate ? new Date(loan.DisbursedDate).toLocaleDateString() : "-"]
        ];

        autoTable(doc, {
            startY: loanSummaryY + 3,
            body: loanSummaryData,
            theme: "grid",
            styles: { fontSize: 10 },
            columnStyles: { 0: { fontStyle: "bold" }, 1: { halign: "left" } },
            margin: { left: 14, right: 14 },
            tableWidth: 'auto'
        });

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 5,
            head: [["#", "Guarantor", "ID No", "Phone", "Guaranteed", "Shares", "Status"]],
            body: filteredGuarantors.map((g, idx) => [
                idx + 1,
                `${g.CustomerIndividualFirstName} ${g.CustomerIndividualLastName}`,
                g.CustomerIndividualIdentityCardNumber,
                g.CustomerAddressMobileLine,
                g.AmountGuaranteed?.toLocaleString(),
                g.TotalShares?.toLocaleString(),
                g.StatusDescription
            ]),
            theme: "striped",
            headStyles: { fillColor: [55, 65, 81], textColor: 255 },
            styles: { fontSize: 10 },
            columnStyles: { 4: { halign: "right" }, 5: { halign: "right" } },
            margin: { left: 14, right: 14 },
        });

        doc.save(`Loan_${loan.CustomerReference2}_Guarantors.pdf`);
    };

    if (!open || !loan) return null;

    return (
        <>
            {/* Main Drawer */}
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black z-40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                        />
                        <motion.div
                            className="fixed top-5 right-5 w-[920px] h-[calc(100vh-40px)] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            {/* Header */}
                            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2 flex-shrink-0">
                                <h2 className="font-bold text-lg text-white">Loan Guarantors</h2>
                                <div className="flex justify-around items-center gap-4">
                                    <Button size="sm" onClick={downloadPDF} className="bg-gray-600 hover:bg-gray-700 text-white">
                                        Download PDF
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
                                </div>
                            </div>

                            {/* Loan Summary */}
                            <div className="bg-gray-700 border rounded-xl p-4 mb-4 mx-2 text-sm flex-shrink-0">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-gray-400">Member</p>
                                        <p className="font-semibold text-gray-200">
                                            {loan?.CustomerIndividualFirstName} {loan?.CustomerIndividualLastName}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Member No: {loan?.CustomerReference2}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Loan Product</p>
                                        <p className="font-semibold text-gray-200">{loan?.LoanProductDescription}</p>
                                        <Badge className="mt-1" variant="secondary">
                                            {loan?.StatusDescription}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Approved Amount</p>
                                        <p className="font-semibold text-green-300">
                                            Ksh {loan?.ApprovedAmount?.toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Repayment</p>
                                        <p className="font-semibold text-gray-200">
                                            Ksh {loan?.MonthlyPaybackAmount?.toLocaleString()} / month
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {loan?.LoanRegistrationTermInMonths} months · {loan?.LoanInterestAnnualPercentageRate}% p.a
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-3 bg-gray-600 rounded-md p-4">
                                    <div>
                                        <p className="text-gray-400">Total Payback</p>
                                        <p className="font-semibold text-gray-200">
                                            Ksh {loan?.TotalPaybackAmount?.toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Loan Balance</p>
                                        <p className="font-semibold text-red-300">
                                            Ksh {loan?.LoanProductLoanBalance?.toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Branch</p>
                                        <p className="font-semibold text-gray-200">{loan?.BranchDescription}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Received Date</p>
                                        <p className="font-semibold text-gray-200">
                                            {loan?.ReceivedDate ? new Date(loan.ReceivedDate).toLocaleDateString() : "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="mb-3 mx-2 flex-shrink-0">
                                <input
                                    type="text"
                                    placeholder="Search by name, ID or phone..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full border-2 rounded p-2"
                                />
                            </div>

                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3 mx-2 text-xs flex-shrink-0">
                                <span className="col-span-1">#</span>
                                <span className="col-span-3">Guarantor</span>
                                <span className="col-span-2">ID No</span>
                                <span className="col-span-2">Phone</span>
                                <span className="col-span-2">Guaranteed</span>
                                <span className="col-span-1">Shares</span>
                                <span className="col-span-1 text-center">Actions</span>
                            </div>

                            {/* Table Body */}
                            <div className="flex-1 overflow-y-auto mx-2">
                                {loading && <p className="text-sm text-muted-foreground">Loading guarantors...</p>}
                                {!loading && filteredGuarantors.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No guarantors found.</p>
                                )}
                                {!loading && filteredGuarantors.length > 0 && (
                                    <div className="space-y-2 bg-gray-300 p-2 rounded-lg">
                                        {paginatedGuarantors.map((g, idx) => (
                                            <div
                                                key={`${g.Id || "guarantor"}-${idx}`}
                                                className="grid grid-cols-12 gap-3 items-center bg-white border rounded-lg px-3 py-2 hover:shadow-md transition text-xs"
                                            >
                                                <span className="col-span-1 font-medium text-indigo-600">{(currentPage - 1) * rowsPerPage + idx + 1}</span>
                                                <span className="col-span-3">{g.CustomerIndividualFirstName} {g.CustomerIndividualLastName}</span>
                                                <span className="col-span-2">{g.CustomerIndividualIdentityCardNumber}</span>
                                                <span className="col-span-2">{g.CustomerAddressMobileLine}</span>
                                                <span className="col-span-2 font-semibold text-green-700">Ksh {g.AmountGuaranteed?.toLocaleString()}</span>
                                                <span className="col-span-1 font-semibold text-gray-700">{g.TotalShares?.toLocaleString()}</span>
                                                <span className="col-span-1 text-center">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600"
                                                        onClick={() => openReplaceModal(g)}
                                                    >
                                                        Replace
                                                    </Button>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {filteredGuarantors.length > rowsPerPage && (
                                <div className="flex justify-center items-center mt-3 space-x-2 flex-shrink-0">
                                    <Button size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Prev</Button>
                                    <span>{currentPage} / {totalPages}</span>
                                    <Button size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Replacement Modal - Fixed position on top */}
            {replaceModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <motion.div
                        className="absolute inset-0 bg-black/60"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            setReplaceModalOpen(false);
                            setCustomerSearchTerm("");
                            setSelectedNewGuarantor(null);
                        }}
                    />
                    <motion.div
                        className="relative bg-white rounded-xl shadow-xl p-6 w-[90vw] max-w-lg max-h-[90vh] overflow-y-auto"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    >
                        <h3 className="font-semibold text-lg mb-4 bg-indigo-800 text-white p-3 rounded-lg shadow-md">
                            Replace Guarantor
                        </h3>

                        <div className="space-y-4">
                            <Card className="p-3 bg-gray-50">
                                <Label className="text-gray-500">Current Guarantor</Label>
                                <p className="font-semibold text-lg">
                                    {selectedGuarantor?.CustomerIndividualFirstName} {selectedGuarantor?.CustomerIndividualLastName}
                                </p>
                                <p className="text-sm text-gray-600">
                                    ID: {selectedGuarantor?.CustomerIndividualIdentityCardNumber} | 
                                    Phone: {selectedGuarantor?.CustomerAddressMobileLine}
                                </p>
                                <p className="text-sm text-green-600 font-semibold">
                                    Amount Guaranteed: Ksh {selectedGuarantor?.AmountGuaranteed?.toLocaleString()}
                                </p>
                            </Card>

                            <div>
                                <Label>Search Members</Label>
                                <Input
                                    placeholder="Search by name, ID or payroll..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label>Select New Guarantor *</Label>
                                <div className="flex gap-2 mt-1">
                                    <Input
                                        placeholder="Select new guarantor"
                                        value={selectedNewGuarantor ? `${selectedNewGuarantor.firstName} ${selectedNewGuarantor.lastName}` : ""}
                                        readOnly
                                    />
                                    <Button type="button" onClick={() => setCustomerModalOpen(true)}>
                                        Browse
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <Label>Amount Guaranteed *</Label>
                                <Input
                                    type="number"
                                    placeholder="Enter guaranteed amount"
                                    value={replacementAmount}
                                    onChange={(e) => setReplacementAmount(e.target.value)}
                                />
                            </div>

                            <div>
                                <Label>Remarks</Label>
                                <Input
                                    placeholder="Reason for replacement (optional)"
                                    value={replacementRemarks}
                                    onChange={(e) => setReplacementRemarks(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <Button variant="outline" onClick={() => {
                                    setReplaceModalOpen(false);
                                    setCustomerSearchTerm("");
                                    setSelectedNewGuarantor(null);
                                }}>
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleReplaceGuarantor}
                                    disabled={!selectedNewGuarantor || !replacementAmount || loading}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {loading ? "Replacing..." : "Replace Guarantor"}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Customer Select Modal - Fixed position on top */}
            {customerModalOpen && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center">
                    <motion.div
                        className="absolute inset-0 bg-black/60"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            setCustomerModalOpen(false);
                            setCustomerSearchTerm("");
                        }}
                    />
                    <motion.div
                        className="relative bg-white rounded-xl shadow-xl p-4 w-[90vw] max-w-xl max-h-[90vh] overflow-y-auto"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    >
                        <h3 className="font-semibold text-lg mb-3 bg-indigo-800 text-white p-3 rounded-lg shadow-md">
                            Select New Guarantor
                        </h3>

                        <Input
                            placeholder="Search by name, ID or payroll..."
                            value={customerSearchTerm}
                            onChange={(e) => setCustomerSearchTerm(e.target.value)}
                            className="mb-3"
                            autoFocus
                        />

                        <div className="max-h-96 overflow-y-auto border rounded-lg">
                            {isLoadingCustomers ? (
                                <div className="flex flex-col items-center justify-center p-8 space-y-3">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    <p className="text-sm text-gray-500">Loading members...</p>
                                </div>
                            ) : (
                                <>
                                    {filteredCustomers.length === 0 && (
                                        <p className="text-center text-sm text-gray-500 p-4">
                                            No available members found
                                        </p>
                                    )}
                                    {filteredCustomers.map(member => {
                                        const depositBalance = getDepositBalance(member);
                                        return (
                                            <div
                                                key={member.id}
                                                onClick={() => {
                                                    setSelectedNewGuarantor(member);
                                                    setCustomerModalOpen(false);
                                                    setCustomerSearchTerm("");
                                                    Swal.fire({
                                                        title: "Guarantor Selected",
                                                        html: `
                                                            <p><strong>${member.firstName} ${member.lastName}</strong></p>
                                                            <p>ID: ${member.idNumber}</p>
                                                            <p>Payroll: ${member.payrollNumber}</p>
                                                            <p>Deposits: Ksh ${depositBalance.toLocaleString()}</p>
                                                        `,
                                                        icon: "success",
                                                        timer: 1500,
                                                        showConfirmButton: false
                                                    });
                                                }}
                                                className="p-3 cursor-pointer hover:bg-indigo-50 border-b transition-colors duration-150"
                                            >
                                                <p className="font-medium">
                                                    {member.firstName} {member.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    ID: {member.idNumber} | Payroll: {member.payrollNumber}
                                                </p>
                                                <p className="text-xs text-green-600 font-semibold">
                                                    Deposits: Ksh {depositBalance.toLocaleString()}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>

                        <div className="flex justify-end mt-4">
                            <Button variant="outline" onClick={() => {
                                setCustomerModalOpen(false);
                                setCustomerSearchTerm("");
                            }}>
                                Close
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
}