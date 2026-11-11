import { useEffect, useMemo, useState, useRef } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    Plus,
    Trash2,
    AlertTriangle,
    Search,
    Eye,
    Printer,
} from "lucide-react";
import MemberSelectModal from "./MemberSelectModal";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";
import logo from "../../../assets/rubanilogo.jpeg";

const EMPTY_LINE = {
    customerAccountId: "",
    customerId: "",
    accountName: "",
    description: "",
    amount: "",
    availableBalance: 0,
};

const money = (n) =>
    Number(n || 0).toLocaleString(undefined, {
        style: "currency",
        currency: "KSH",
    });

// Fixed: Proper number to words conversion
const numberToWords = (num) => {
    if (num === 0) return "Zero";
    
    const ones = [
        "", "One", "Two", "Three", "Four", "Five",
        "Six", "Seven", "Eight", "Nine", "Ten",
        "Eleven", "Twelve", "Thirteen", "Fourteen",
        "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const convertHundreds = (n) => {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
        if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convertHundreds(n % 100) : "");
        if (n < 1000000) return convertHundreds(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convertHundreds(n % 1000) : "");
        if (n < 1000000000) return convertHundreds(Math.floor(n / 1000000)) + " Million" + (n % 1000000 ? " " + convertHundreds(n % 1000000) : "");
        return "";
    };

    const numStr = num.toFixed(2);
    const parts = numStr.split('.');
    const wholeNumber = parseInt(parts[0]);
    const cents = parseInt(parts[1]);

    let result = convertHundreds(wholeNumber);
    if (cents > 0) {
        result += " and " + convertHundreds(cents) + " Cents";
    }
    return result.trim();
};

// PDF Preview Modal Component
function PdfPreviewModal({ open, onClose, onConfirm, pdfData }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const iframeRef = useRef(null);

    useEffect(() => {
        if (open && pdfData) {
            setIsGenerating(true);
            // Generate PDF and display in iframe
            const doc = pdfData();
            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            
            if (iframeRef.current) {
                iframeRef.current.src = pdfUrl;
            }
            setIsGenerating(false);
        }
    }, [open, pdfData]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-indigo-700 rounded-t-2xl px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-white text-xl font-bold flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Receipt Preview
                        </h2>
                        <p className="text-white/80 text-sm mt-1">Review the receipt before printing</p>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-white/70 text-2xl">✕</button>
                </div>

                {/* PDF Preview */}
                <div className="flex-1 p-4 bg-gray-100 overflow-hidden">
                    {isGenerating ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <iframe
                            ref={iframeRef}
                            className="w-full h-full border-0 rounded-lg bg-white"
                            title="Receipt Preview"
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="border-t p-4 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
                        <Printer className="h-4 w-4" />
                        Print Receipt
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function Receipting() {
    const [date] = useState(() => new Date().toISOString().slice(0, 10));
    const [reference, setReference] = useState("");
    const [memberName, setMemberName] = useState("");
    const [customerNo, setCustomerNo] = useState("");
    const [memberId, setMemberId] = useState("");

    const [branchId, setBranchId] = useState("");
    const [bankId, setBankId] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("CASH");

    const [accounts, setAccounts] = useState([]);
    const [branches, setBranches] = useState([]);

    const [lines, setLines] = useState([{ ...EMPTY_LINE }]);
    const [members, setMembers] = useState([]);
    const [selectedMemberId, setSelectedMemberId] = useState("");

    const [loading, setLoading] = useState(false);

    const [banks, setBanks] = useState([]);
    const [selectedBankId, setSelectedBankId] = useState("");

    const [customerAccount, setCustomerAccount] = useState([]);

    const [memberModalOpen, setMemberModalOpen] = useState(false);

    const [postedDate, setPostedDate] = useState(() => new Date().toISOString().slice(0, 10));

    // Search state
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);

    // PDF Preview state - initialized to false
    const [previewOpen, setPreviewOpen] = useState(false);
    const [pendingPrint, setPendingPrint] = useState(false);

    const totalAmount = useMemo(
        () => lines.reduce((s, l) => s + Number(l.amount || 0), 0),
        [lines]
    );

    const addLine = () => setLines((p) => [...p, { ...EMPTY_LINE }]);
    const removeLine = (i) => setLines((p) => p.filter((_, idx) => idx !== i));
    const updateLine = (i, patch) =>
        setLines((p) => p.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

    // Fetch chart of accounts and branches
    useEffect(() => {
        fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/GetChartOfAccount`)
            .then((r) => r.json())
            .then((d) => d.Success && setAccounts(d.Data.map((a) => ({ id: a.Id, name: a.AccountName }))));

        fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/branches`)
            .then((r) => r.json())
            .then((d) => d.Success && setBranches(d.Data));
    }, []);

    // Fetch members with the new endpoint
    const fetchMembers = async (search = "", pageIndex = 0, pageSize = 200) => {
        setIsSearching(true);
        try {
            const url = `${import.meta.env.VITE_APP_FIN_URL}/api/values/GetMembersWithDetails?search=${encodeURIComponent(search)}&pageIndex=${pageIndex}&pageSize=${pageSize}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.Success && data.Data) {
                const mappedMembers = data.Data.members.map(member => ({
                    Id: member.id,
                    IndividualFirstName: member.firstName,
                    IndividualLastName: member.lastName,
                    FullName: member.fullName,
                    Reference2: member.memberNumber,
                    MemberNumber: member.memberNumber,
                    PayrollNumber: member.payrollNumber,
                    Email: member.address?.email || "",
                    Phone: member.address?.mobileLine || "",
                    accounts: member.accounts || [],
                    IsActive: member.recordStatus === 1,
                    recordStatus: member.recordStatus,
                    ...member
                }));
                
                setMembers(mappedMembers);
            } else {
                setMembers([]);
                console.error("Failed to fetch members:", data.Message);
            }
        } catch (error) {
            console.error("Error fetching members:", error);
            setMembers([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Initial fetch of members
    useEffect(() => {
        fetchMembers();
    }, []);

    // Fetch banks with linkages
    useEffect(() => {
        fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/getBankWithLinkages`)
            .then((r) => r.json())
            .then((d) => {
                if (d.Success) {
                    setBanks(d.Data);
                    console.log("Banks loaded:", d.Data);
                }
            })
            .catch(err => console.error("Error fetching banks:", err));
    }, []);

    // Get customer accounts from the selected member's data
    useEffect(() => {
        if (!selectedMemberId) {
            setCustomerAccount([]);
            return;
        }

        const selectedMember = members.find(m => m.Id === selectedMemberId);
        if (selectedMember && selectedMember.accounts) {
            // Filter to only show Savings accounts (not Loan accounts)
            const savingsAccounts = selectedMember.accounts.filter(account => 
                account.accountType === "Savings" || 
                account.productDescription === "DEPOSITS" ||
                account.productDescription === "M-Wallet" ||
                account.productDescription === "ENTRANCE FEE" ||
                account.productDescription === "SHARE CAPITAL"
            );

            const mappedAccounts = savingsAccounts.map(account => ({
                Id: account.accountId,
                CustomerId: selectedMemberId,
                CustomerAccountTypeTargetProductDescription: account.productDescription,
                CustomerAccountTypeProductCodeDescription: account.accountType || "Savings",
                AvailableBalance: account.balance > 0 ? account.balance : 0,
                BookBalance: account.balance,
                StatusDescription: account.accountStatus === 0 ? "Active" : "Inactive",
                AccountNumber: account.accountId,
                Balance: account.balance,
                ProductCode: account.productCode,
                TargetProductId: account.targetProductId,
                ChartOfAccountId: account.chartOfAccountId,
                accountType: account.accountType,
                totalCredits: account.totalCredits,
                totalWithdrawals: account.totalWithdrawals,
            }));
            setCustomerAccount(mappedAccounts);
        } else {
            setCustomerAccount([]);
        }
    }, [selectedMemberId, members]);

    // Handler when bank is selected
    const onBankSelect = (bankLinkageId) => {
        const bankLinkage = banks.find((b) => b.id === bankLinkageId || b.Id === bankLinkageId);
        if (!bankLinkage) return;

        console.log("Selected bank linkage:", bankLinkage);

        const bankAccountId = bankLinkage.bankId || bankLinkage.BankId;
        const branchIdValue = bankLinkage.branchId || bankLinkage.BranchId;

        setBankId(bankAccountId);
        setBranchId(branchIdValue);
        setSelectedBankId(bankLinkageId);
    };

    // Handler when member is selected
    const onMemberSelect = (memberId) => {
        setSelectedMemberId(memberId);
        setMemberId(memberId);

        const member = members.find(m => m.Id === memberId);
        if (!member) return;

        const name = member.FullName || `${member.IndividualFirstName || ''} ${member.IndividualLastName || ''}`.trim();
        setMemberName(name || "Unknown Member");
        setCustomerNo(member.MemberNumber || member.Reference2 || "");
    };

    // Handle search with debounce
    const handleSearch = (value) => {
        setSearchTerm(value);
        
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const timeout = setTimeout(() => {
            fetchMembers(value);
        }, 500);
        
        setSearchTimeout(timeout);
    };

    // Generate PDF (returns the doc object for preview)
    const generateReceiptPDF = (returnDoc = false) => {
        const doc = new jsPDF("p", "mm", "a4");

        const left = 15;
        const right = 195;
        let y = 15;

        const logoWidth = 35;
        const logoHeight = 15;
        const pageCenterX = 105;
        const logoX = pageCenterX - logoWidth / 2;

        doc.addImage(logo, "PNG", logoX, y, logoWidth, logoHeight);

        y += logoHeight + 6;

        doc.setFontSize(12);
        doc.setFont("times", "bold");
        doc.text("RUBANI SACCO", pageCenterX, y, { align: "center" });

        y += 6;
        doc.setFontSize(9);
        doc.setFont("times", "normal");
        doc.text("Giving wings to your savings", pageCenterX, y, { align: "center" });

        y += 8;
        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text("CASH RECEIPT", pageCenterX, y, { align: "center" });

        doc.line(left, y + 2, right, y + 2);
        y += 10;

        doc.setFontSize(9);
        doc.setFont("times", "normal");

        doc.text(`Member No: ${customerNo}`, left, y + 6);
        doc.text(`Staff No: ${customerNo}`, left, y + 12);
        doc.text(`Name: ${memberName}`, left, y + 18);

        doc.text(`Deposited/Receipt Date: ${date}`, 110, y);
        doc.text(`Posted Date: ${date}`, 110, y + 6);
        doc.text(`Payment Mode: ${paymentMethod}`, 110, y + 12);
        doc.text(`Ref No: ${customerNo || "-"}`, 110, y + 18);

        y += 30;

        doc.setFont("times", "bold");
        doc.text("Amount:", 110, y);
        doc.text(`Ksh: ${totalAmount.toLocaleString()}.00`, 150, y);

        y += 8;

        const amountInWords = numberToWords(totalAmount);
        doc.setFont("times", "normal");
        const wordsText = `Amount In Words: (Ksh ${amountInWords} Only)`;
        
        if (wordsText.length > 60) {
            const midPoint = Math.floor(wordsText.length / 2);
            const firstPart = wordsText.substring(0, midPoint);
            const secondPart = wordsText.substring(midPoint);
            doc.text(firstPart, left, y);
            y += 6;
            doc.text(secondPart, left, y);
        } else {
            doc.text(wordsText, left, y);
        }

        y += 10;
        doc.line(left, y, right, y);

        y += 6;

        doc.setFont("times", "bold");
        doc.text("Being Payment of:", left, y);
        doc.text("Amount", 150, y);

        y += 6;
        doc.setFont("times", "normal");

        lines.forEach((l) => {
            doc.text(l.accountName || "DEPOSITS", left, y);
            doc.text(Number(l.amount).toLocaleString(), 150, y);
            y += 6;
        });

        doc.line(left, y, right, y);

        y += 6;
        doc.setFont("times", "bold");
        doc.text("Total", left, y);
        doc.text(totalAmount.toLocaleString(), 150, y);

        y += 18;

        doc.setFont("times", "normal");
        doc.text("Prepared By: mtey", left, y);
        doc.text("Signed: ____________________", 90, y);

        y += 10;
        doc.text("Stamp: ____________________", 90, y);

        y += 12;
        doc.setFontSize(8);
        doc.text(`"Giving wings to your savings!"`, 105, y, { align: "center" });

        if (returnDoc) {
            return doc;
        } else {
            doc.save(`Cash-Receipt-${customerNo}-${date}.pdf`);
        }
    };

    // Confirm print from preview
    const handleConfirmPrint = () => {
        setPreviewOpen(false);
        // Generate and download the PDF
        generateReceiptPDF(false);
        setPendingPrint(false);
        // Reset the form after printing
        setLines([{ ...EMPTY_LINE }]);
        setReference("");
        setSelectedMemberId("");
        setMemberId("");
        setMemberName("");
        setCustomerNo("");
        setLoading(false);
    };

    // Handle preview close
    const handlePreviewClose = () => {
        setPreviewOpen(false);
        setPendingPrint(false);
        // Reset form when preview is closed without printing
        setLines([{ ...EMPTY_LINE }]);
        setReference("");
        setSelectedMemberId("");
        setMemberId("");
        setMemberName("");
        setCustomerNo("");
        setLoading(false);
    };

    const postReceipt = async () => {
        setLoading(true);

        if (!branchId || !bankId) {
            Swal.fire("Error", "Branch and Bank Account are required", "warning");
            setLoading(false);
            return;
        }

        if (!lines.length || lines.some(l => !l.amount || !l.customerAccountId || !l.customerId)) {
            Swal.fire("Error", "Each receipt line must have an account, customer and amount", "warning");
            setLoading(false);
            return;
        }

        const payload = {
            branchId,
            bankAccountId: bankId,
            postingPeriodId: "2F1DA0E0-B1DB-F011-B575-80CE62222714",
            primaryDescription: "Customer cash deposits batch",
            reference: reference || "BATCH-DEP-AUTO",
            postedDate: postedDate,

            receipts: lines.map((l) => ({
                totalValue: Number(l.amount),
                customerAccount: {
                    id: l.customerAccountId,
                },
                customerDTO: {
                    id: l.customerId,
                },
            })),
        };

        console.log("POST PAYLOAD:", payload);

        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_FIN_URL}/api/values/CustomerReceipt`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await res.json();
            console.log("Response data:", data);

            if (data.success) {
                // Show success popup with print option
                Swal.fire({
                    icon: "success",
                    title: "Receipt Posted Successfully",
                    text: "Would you like to print the receipt?",
                    showCancelButton: true,
                    confirmButtonText: "Print Receipt",
                    cancelButtonText: "Close",
                    confirmButtonColor: "#4f46e5",
                    cancelButtonColor: "#6b7280",
                }).then((result) => {
                    if (result.isConfirmed) {
                        // Open preview for printing
                        setPendingPrint(true);
                        setPreviewOpen(true);
                        setLoading(false);
                    } else {
                        // Close without printing - reset form
                        setLines([{ ...EMPTY_LINE }]);
                        setReference("");
                        setSelectedMemberId("");
                        setMemberId("");
                        setMemberName("");
                        setCustomerNo("");
                        setLoading(false);
                    }
                });

                // Don't reset immediately - wait for user action
                // The reset will happen in the confirm print or cancel callback
                // setLoading(false) is called in the callbacks above

            } else {
                Swal.fire("Error", data.message || "Failed to post receipt", "error");
                setLoading(false);
            }

        } catch (err) {
            console.error("Post Error:", err);
            Swal.fire("Error", err.message || "Network error. Please try again.", "error");
            setLoading(false);
        }
    };

    // Filter only savings accounts for receipting
    const activeCustomerAccounts = useMemo(() => {
        return customerAccount.filter(a => 
            a.StatusDescription !== "Inactive" && 
            (a.accountType === "Savings" || a.CustomerAccountTypeProductCodeDescription === "Savings")
        );
    }, [customerAccount]);

    return (
        <div className="bg-gray-300 p-6">
            <div className="mx-auto max-w-4xl bg-white shadow-2xl border rounded-md">
                {/* HEADER */}
                <div className="border-b p-6 flex justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">RECEIPT</h1>
                        <p className="text-sm text-gray-600">Member Payment Receipt</p>
                    </div>
                    <div className="text-sm">
                        <div>Date: {date}</div>
                    </div>
                </div>

                {/* BODY */}
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4 bg-gray-200 rounded-lg p-3">
                        <div>
                            <Label>Received From</Label>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-start bg-white"
                                onClick={() => setMemberModalOpen(true)}
                            >
                                {memberName || "Select member"}
                            </Button>
                        </div>

                        <div>
                            <Label>Member No</Label>
                            <Input value={customerNo} disabled className="bg-white" />
                        </div>

                        <div>
                            <Label>Bank Account</Label>
                            <Select value={selectedBankId} onValueChange={onBankSelect}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Select Bank Account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {banks.length === 0 ? (
                                        <div className="px-3 py-2 text-sm text-gray-500">
                                            No bank accounts available
                                        </div>
                                    ) : (
                                        banks.map((b) => (
                                            <SelectItem key={b.id || b.Id} value={b.id || b.Id}>
                                                {b.accountName || b.AccountName} - {b.bankName || b.BankName} ({b.bankBranchName || b.BankBranchName})
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {selectedBankId && (
                                <div className="mt-1 text-xs text-gray-500">
                                    Account: {banks.find(b => (b.id || b.Id) === selectedBankId)?.bankAccountNumber || banks.find(b => (b.id || b.Id) === selectedBankId)?.BankAccountNumber || ''}
                                </div>
                            )}
                        </div>

                        <div>
                            <Label>Branch</Label>
                            <Select value={branchId} onValueChange={setBranchId}>
                                <SelectTrigger className="bg-white">
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
                            <Label>Payment Method</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">Cash</SelectItem>
                                    <SelectItem value="BANK">Bank</SelectItem>
                                    <SelectItem value="MOBILE">Mobile Money</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Posted Date</Label>
                            <Input
                                type="date"
                                value={postedDate}
                                onChange={(e) => setPostedDate(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                    </div>

                    {/* LINE ITEMS */}
                    <div className="border rounded-sm overflow-x-auto">
                        <div className="grid grid-cols-12 bg-gray-600 text-white border-b text-xs font-semibold uppercase rounded-t-sm min-w-[800px]">
                            <div className="col-span-3 p-2 border-r">Account</div>
                            <div className="col-span-3 p-2 border-r text-right">Acc Balance</div>
                            <div className="col-span-3 p-2 border-r">Description</div>
                            <div className="col-span-2 p-2 text-right">Amount</div>
                            <div className="col-span-1 p-2 text-center">Action</div>
                        </div>

                        {lines.map((l, i) => (
                            <div key={i} className="grid grid-cols-12 border-b bg-gray-200 items-center min-w-[800px]">
                                <div className="col-span-3 p-2">
                                    <Select
                                        value={
                                            l.customerAccountId
                                                ? `${l.customerAccountId}|${l.customerId}|${l.accountName}`
                                                : ""
                                        }
                                        onValueChange={(v) => {
                                            const [customerAccountId, customerId, accountName] = v.split("|");

                                            const selectedAccount = customerAccount.find(
                                                (a) => a.Id === customerAccountId
                                            );

                                            let balance = 0;

                                            if (selectedAccount) {
                                                balance = selectedAccount.Balance || selectedAccount.AvailableBalance || 0;
                                            }

                                            updateLine(i, {
                                                customerAccountId,
                                                customerId,
                                                accountName,
                                                availableBalance: balance,
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Select Account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {activeCustomerAccounts.length === 0 ? (
                                                <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                                    No savings/deposit accounts available
                                                </div>
                                            ) : (
                                                activeCustomerAccounts.map((a) => (
                                                    <SelectItem
                                                        key={a.Id}
                                                        value={`${a.Id}|${a.CustomerId}|${a.CustomerAccountTypeTargetProductDescription}`}
                                                    >
                                                        {a.CustomerAccountTypeTargetProductDescription} 
                                                        {a.Balance !== undefined && ` (${money(a.Balance)})`}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="col-span-3 p-2">
                                    <div className="bg-gray-50 w-full px-3 py-1.5 rounded-md shadow text-right font-mono text-sm whitespace-nowrap overflow-x-auto">
                                        {money(l.availableBalance)}
                                    </div>
                                </div>

                                <div className="col-span-3 p-2">
                                    <Input
                                        placeholder="Description"
                                        className="bg-white"
                                        value={l.description}
                                        onChange={(e) => updateLine(i, { description: e.target.value })}
                                    />
                                </div>

                                <div className="col-span-2 p-2">
                                    <Input
                                        type="number"
                                        className="bg-white text-right"
                                        placeholder="0.00"
                                        value={l.amount}
                                        onChange={(e) => updateLine(i, { amount: e.target.value })}
                                    />
                                </div>

                                <div className="col-span-1 p-2 flex items-center justify-center">
                                    {lines.length > 1 && (
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            onClick={() => removeLine(i)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}

                        <div className="p-3 bg-gray-50 border-t flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                            <span className="text-lg font-bold text-indigo-700">{money(totalAmount)}</span>
                        </div>
                    </div>

                    <Button variant="outline" onClick={addLine} className="bg-gray-600 hover:bg-gray-600 text-white hover:text-white">
                        <Plus className="mr-2 h-4 w-4" /> Add line
                    </Button>

                    <div className="flex justify-between items-center border-t pt-4">
                        <Badge variant="secondary">
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Ready to post
                        </Badge>

                        <div className="flex gap-3">
                            <Button onClick={postReceipt} className="bg-indigo-700">
                                {loading ? "Posting..." : "Post Receipt"}
                            </Button>
                        </div>
                    </div>
                </div>

                <MemberSelectModal
                    open={memberModalOpen}
                    onClose={setMemberModalOpen}
                    members={members}
                    onSelect={onMemberSelect}
                    onSearch={handleSearch}
                    searchTerm={searchTerm}
                    isSearching={isSearching}
                    selectedId={selectedMemberId}
                />
            </div>

            {/* PDF Preview Modal - only shows when user clicks "Print Receipt" after successful post */}
            <PdfPreviewModal
                open={previewOpen}
                onClose={handlePreviewClose}
                onConfirm={handleConfirmPrint}
                pdfData={() => generateReceiptPDF(true)}
            />
        </div>
    );
}