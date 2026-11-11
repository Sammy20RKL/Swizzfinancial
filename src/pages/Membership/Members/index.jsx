import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    FaUserAlt,
    FaPlus,
    FaChevronLeft,
    FaChevronRight,
    FaEllipsisV,
    FaFilePdf,
    FaFileExcel,
    FaFilter,
    FaTimes,
    FaWallet,
    FaMoneyBillWave,
    FaUpload,
} from "react-icons/fa";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import MemberRegistrationDrawer from "./MemberRegistrationDrawer";
import { MemberRegistrationProvider } from "./MemberRegistrationContext";
import MemberDetailsDrawer from "./MemberDetailDrawer";
import MemberEditDrawer from "./MemberEditDrawer";
import MemberBulkUploadModal from "./MemberBulkUploadModal";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from "@/context/AuthContext";

const MEMBERS_API_URL = `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/values/GetMembersWithDetails`;
const ACCOUNTS_API_URL = `${import.meta.env.VITE_APP_LOANING_URL}/api/customer-accounts`;
const PRODUCTS_API_URL = `${import.meta.env.VITE_APP_LOANING_URL}/api/savings-products`;
const BRANCHES_API_URL = `${import.meta.env.VITE_APP_LOANING_URL}/api/branches`;

export default function Members() {
    // Get auth context
    const { token, logout, isAuthenticated, companyId, userData } = useAuth();
    
    // allMembers holds the full dataset fetched once from the API
    const [allMembers, setAllMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Separate filter state for each column — applied client-side
    const [filters, setFilters] = useState({
        memberNo: "",
        fullName: "",
        idNo: "",
        phone: "",
        RegistrationDate: "",
    });

    // Track which filter popover is open
    const [activeFilter, setActiveFilter] = useState(null);

    const [openAddDrawer, setOpenAddDrawer] = useState(false);
    const [openEditDrawer, setOpenEditDrawer] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);

    const [openDetailsDrawer, setOpenDetailsDrawer] = useState(false);
    const [detailMember, setDetailMember] = useState(null);

    // Bulk Upload state
    const [openBulkUploadModal, setOpenBulkUploadModal] = useState(false);

    // Add Account states
    const [showAddAccountModal, setShowAddAccountModal] = useState(false);
    const [accountMember, setAccountMember] = useState(null);
    const [products, setProducts] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [selectedBranch, setSelectedBranch] = useState("");
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [addingAccount, setAddingAccount] = useState(false);

    // Helper function to get auth headers
    const getAuthHeaders = () => {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    // Fetch all members once on mount
    useEffect(() => {
        if (isAuthenticated && token && companyId) {
            fetchMembers();
        } else if (token && !companyId) {
            console.warn("Token exists but CompanyId is missing. Attempting to fetch from stored user data.");
            // Try to get companyId from stored user data if available
            if (userData?.CompanyId) {
                fetchMembers();
            }
        }
    }, [isAuthenticated, token, companyId, userData]);

    // Reset to page 0 when filters or page size change
    useEffect(() => {
        setCurrentPage(0);
    }, [filters, pageSize]);

    const fetchMembers = async () => {
        setLoading(true);
        
        try {
            if (!token) {
                console.error("No token available");
                Swal.fire("Authentication Error", "Please login again.", "error");
                setLoading(false);
                return;
            }

            // Get companyId from auth context or from localStorage as fallback
            let currentCompanyId = companyId;
            if (!currentCompanyId) {
                // Try to get from userData in auth context
                if (userData?.CompanyId) {
                    currentCompanyId = userData.CompanyId;
                } else {
                    // Fallback: try to get from localStorage
                    try {
                        const storedUser = localStorage.getItem('userData');
                        if (storedUser) {
                            const parsedUser = JSON.parse(storedUser);
                            currentCompanyId = parsedUser.CompanyId;
                        }
                    } catch (e) {
                        console.error("Error parsing stored user data:", e);
                    }
                }
            }

            if (!currentCompanyId) {
                console.error("No Company ID available");
                Swal.fire("Error", "Company information not found. Please login again.", "error");
                setLoading(false);
                return;
            }

            console.log("Token being used:", token.substring(0, 20) + "...");
            console.log("Company ID being used:", currentCompanyId);

            // Add query parameters with CompanyId
            const url = new URL(MEMBERS_API_URL);
            url.searchParams.append('testCompanyId', currentCompanyId);
            url.searchParams.append('includeNextOfKin', 'true');
            url.searchParams.append('includeAccounts', 'true');
            url.searchParams.append('search', '');
            url.searchParams.append('pageIndex', '0');
            url.searchParams.append('pageSize', '50');

            console.log("Fetching members from:", url.toString());

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: getAuthHeaders()
            });

            console.log("Response status:", response.status);

            if (response.status === 401 || response.status === 403) {
                Swal.fire("Session Expired", "Your session has expired. Please login again.", "error")
                    .then(() => {
                        logout();
                    });
                setLoading(false);
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const json = await response.json();
            console.log("Members Response:", json);

            if (json.Success && json.Data) {
                setAllMembers(json.Data.members || []);
            } else {
                setAllMembers([]);
                if (json.Message) {
                    Swal.fire("Error", json.Message, "error");
                }
            }
        } catch (err) {
            console.error("Fetch Members Error:", err);
            Swal.fire("Error", "Failed to fetch members: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // Handle bulk upload success
    const handleBulkUploadSuccess = () => {
        fetchMembers(); // Refresh the member list after successful upload
    };

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            // Get companyId from auth context or fallback
            let currentCompanyId = companyId;
            if (!currentCompanyId) {
                try {
                    const storedUser = localStorage.getItem('userData');
                    if (storedUser) {
                        const parsedUser = JSON.parse(storedUser);
                        currentCompanyId = parsedUser.CompanyId;
                    }
                } catch (e) {
                    console.error("Error parsing stored user data:", e);
                }
            }

            const url = new URL(PRODUCTS_API_URL);
            if (currentCompanyId) {
                url.searchParams.append('testCompanyId', currentCompanyId);
            }

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (response.status === 401 || response.status === 403) {
                Swal.fire("Session Expired", "Please login again.", "error")
                    .then(() => {
                        logout();
                    });
                setLoadingProducts(false);
                return;
            }

            const json = await response.json();
            console.log("Products Response:", json);
            
            if (json.success) {
                setProducts(json.data || []);
            } else {
                Swal.fire("Error", json.message || "Failed to fetch products.", "error");
            }
        } catch (err) {
            console.error("Fetch Products Error:", err);
            Swal.fire("Error", "Failed to fetch products.", "error");
        } finally {
            setLoadingProducts(false);
        }
    };

    const fetchBranches = async () => {
        setLoadingBranches(true);
        try {
            // Get companyId from auth context or fallback
            let currentCompanyId = companyId;
            if (!currentCompanyId) {
                try {
                    const storedUser = localStorage.getItem('userData');
                    if (storedUser) {
                        const parsedUser = JSON.parse(storedUser);
                        currentCompanyId = parsedUser.CompanyId;
                    }
                } catch (e) {
                    console.error("Error parsing stored user data:", e);
                }
            }

            const url = new URL(BRANCHES_API_URL);
            if (currentCompanyId) {
                url.searchParams.append('testCompanyId', currentCompanyId);
            }

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (response.status === 401 || response.status === 403) {
                Swal.fire("Session Expired", "Please login again.", "error")
                    .then(() => {
                        logout();
                    });
                setLoadingBranches(false);
                return;
            }

            const json = await response.json();
            console.log("Branches Response:", json);
            
            if (json.success) {
                setBranches(json.data || []);
                if (json.data && json.data.length > 0) {
                    setSelectedBranch(json.data[0].Id);
                }
            } else {
                Swal.fire("Error", json.message || "Failed to fetch branches.", "error");
            }
        } catch (err) {
            console.error("Fetch Branches Error:", err);
            Swal.fire("Error", "Failed to fetch branches.", "error");
        } finally {
            setLoadingBranches(false);
        }
    };

    // Open Add Account Modal
    const handleAddAccount = async (member) => {
        setAccountMember(member);
        setSelectedProduct("");
        setSelectedBranch("");
        await Promise.all([fetchProducts(), fetchBranches()]);
        setShowAddAccountModal(true);
    };

    // Submit Add Account
    const handleSubmitAccount = async () => {
        if (!selectedProduct) {
            Swal.fire("Error", "Please select a product.", "error");
            return;
        }

        if (!selectedBranch) {
            Swal.fire("Error", "Please select a branch.", "error");
            return;
        }

        if (!accountMember) {
            Swal.fire("Error", "No member selected.", "error");
            return;
        }

        // Find the selected product by Code
        const product = products.find(p => p.Code === parseInt(selectedProduct));
        if (!product) {
            Swal.fire("Error", "Selected product could not be found.", "error");
            return;
        }

        try {
            setAddingAccount(true);

            // Get companyId from auth context or fallback
            let currentCompanyId = companyId;
            if (!currentCompanyId) {
                try {
                    const storedUser = localStorage.getItem('userData');
                    if (storedUser) {
                        const parsedUser = JSON.parse(storedUser);
                        currentCompanyId = parsedUser.CompanyId;
                    }
                } catch (e) {
                    console.error("Error parsing stored user data:", e);
                }
            }

            const requestBody = {
                customerId: accountMember.id,
                branchId: selectedBranch,
                customerAccountTypeProductCode: product.Code,
                customerAccountTypeTargetProductId: product.Id,
            };

            // Add CompanyId to request body if available
            if (currentCompanyId) {
                requestBody.testCompanyId = currentCompanyId;
            }

            console.log("Creating account with request:", requestBody);

            const response = await fetch(ACCOUNTS_API_URL, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(requestBody),
            });

            if (response.status === 401 || response.status === 403) {
                Swal.fire("Session Expired", "Please login again.", "error")
                    .then(() => {
                        logout();
                    });
                setAddingAccount(false);
                return;
            }

            const data = await response.json();
            console.log("Account creation response:", data);

            if (data.success) {
                const productName = product.Description || "Account";

                const branch = branches.find(b => b.Id === selectedBranch);
                const branchName = branch?.Description || "Unknown Branch";

                await Swal.fire({
                    title: "Success!",
                    html: `
                        <p><strong>${productName}</strong> account created successfully.</p>
                        <p style="font-size: 13px; color: #666; margin-top: 8px;">
                            Member: ${accountMember.firstName} ${accountMember.lastName}
                            <br>Member No: ${accountMember.memberNumber || "N/A"}
                            <br>Branch: ${branchName}
                            ${data.data?.CustomerReference2 ? `<br>Account Number: ${data.data.CustomerReference2}` : ''}
                        </p>
                    `,
                    icon: "success",
                    confirmButtonColor: "#4f46e5"
                });

                setShowAddAccountModal(false);
                setAccountMember(null);
                setSelectedProduct("");
                setSelectedBranch("");
                await fetchMembers();
            } else {
                throw new Error(data.message || "Failed to create account");
            }
        } catch (error) {
            console.error("Error creating account:", error);

            let errorMessage = error.message || "Failed to create account. Please try again.";

            if (error.message?.includes("CustomerId")) {
                errorMessage = "Invalid customer ID. Please try again.";
            } else if (error.message?.includes("TargetProductId") || error.message?.includes("ProductCode")) {
                errorMessage = "Invalid product selected. Please choose a different product.";
            } else if (error.message?.includes("BranchId")) {
                errorMessage = "Invalid branch selected. Please choose a different branch.";
            }

            Swal.fire({
                title: "Error",
                text: errorMessage,
                icon: "error",
                confirmButtonColor: "#4f46e5"
            });
        } finally {
            setAddingAccount(false);
        }
    };

    const filteredMembers = useMemo(() => {
        if (!Array.isArray(allMembers) || allMembers.length === 0) {
            return [];
        }

        return allMembers.filter((m) => {
            if (!m) return false;

            const fullName = `${m.firstName || ""} ${m.lastName || ""}`.toLowerCase();

            if (filters.memberNo && !(m.memberNumber || "").toLowerCase().includes(filters.memberNo.toLowerCase())) return false;
            if (filters.fullName && !fullName.includes(filters.fullName.toLowerCase())) return false;
            if (filters.idNo && !(m.idNumber || "").includes(filters.idNo)) return false;
            if (filters.phone && !(m.address?.mobileLine || m.address?.landLine || "").includes(filters.phone)) return false;
            if (filters.RegistrationDate && !(m.registrationDate || "").startsWith(filters.RegistrationDate)) return false;
            return true;
        });
    }, [allMembers, filters]);

    const totalCount = filteredMembers.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const members = filteredMembers.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
    const isLastPage = currentPage + 1 >= totalPages;

    const getFullName = (m) => {
        if (!m) return "";
        return `${m.firstName || ""} ${m.lastName || ""}`.trim();
    };

    const formatDate = (date) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString();
    };

    const getGenderLabel = (gender) => {
        if (gender === 1 || gender === "1") return "Male";
        if (gender === 2 || gender === "2") return "Female";
        return gender || "N/A";
    };

    // Helper function to get account balances for a member
    const getAccountBalances = (member) => {
        if (!member || !member.accounts || !Array.isArray(member.accounts) || member.accounts.length === 0) {
            return { share: 0, deposit: 0, totalBalance: 0, accountDetails: [] };
        }

        let share = 0;
        let deposit = 0;
        const accountDetails = [];

        member.accounts.forEach(account => {
            const balance = account.balance || 0;
            const productDesc = account.productDescription || "Unknown";
            const accountNumber = account.accountId || "N/A";
            const accountType = account.accountType || "Unknown";
            
            if (productDesc.toUpperCase().includes('SHARE CAPITAL') && accountType === 'Savings') {
                share += balance;
            } 
            else if (productDesc.toUpperCase().includes('DEPOSITS') && accountType === 'Savings') {
                deposit += balance;
            }
            
            if (accountType === 'Savings' && 
                !productDesc.toUpperCase().includes('ENTRANCE FEE') && 
                !productDesc.toUpperCase().includes('RBF') &&
                !productDesc.toUpperCase().includes('M-WALLET')) {
                accountDetails.push({
                    productName: productDesc,
                    accountNumber: accountNumber,
                    balance: balance
                });
            }
        });

        return { 
            share, 
            deposit, 
            totalBalance: share + deposit,
            accountDetails 
        };
    };

    // Helper function to get loan balances for a member
    const getLoanBalances = (member) => {
        if (!member || !member.accounts || !Array.isArray(member.accounts) || member.accounts.length === 0) {
            return { totalBalance: 0, loanCount: 0, loanDetails: [] };
        }

        let totalBalance = 0;
        const loanDetails = [];

        member.accounts.forEach(account => {
            if (account.accountType === 'Loan') {
                const balance = account.balance || 0;
                const productDesc = account.productDescription || "Unknown";
                const accountNumber = account.accountId || "N/A";
                const status = account.accountStatus === 0 ? "Active" : "Closed";
                
                totalBalance += balance;
                
                loanDetails.push({
                    loanType: productDesc,
                    loanNumber: accountNumber,
                    balance: balance,
                    status: status
                });
            }
        });

        return { 
            totalBalance, 
            loanCount: loanDetails.length,
            loanDetails 
        };
    };

    // Client-side PDF generation for Members List
    const handlePrintPDF = () => {
        try {
            if (!filteredMembers || filteredMembers.length === 0) {
                Swal.fire("Error", "No members to export.", "error");
                return;
            }

            Swal.fire({
                title: 'Generating PDF...',
                text: `Generating report for ${filteredMembers.length} members...`,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const doc = new jsPDF('landscape', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            
            doc.setFontSize(16);
            doc.setTextColor(40, 40, 80);
            doc.text('SUPREME SACCO', pageWidth / 2, 15, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setTextColor(80, 80, 80);
            doc.text('SUPREME House, Off Airport North Embakasi', pageWidth / 2, 22, { align: 'center' });
            doc.text('SUPREMEsacco@gmail.com', pageWidth / 2, 28, { align: 'center' });
            
            doc.setFontSize(14);
            doc.setTextColor(40, 40, 80);
            doc.text('MEMBERS LIST REPORT', pageWidth / 2, 36, { align: 'center' });

            const tableData = filteredMembers.map((member, index) => {
                const accountBalances = getAccountBalances(member);
                
                let accountsStr = "";
                if (accountBalances.accountDetails && accountBalances.accountDetails.length > 0) {
                    accountsStr = accountBalances.accountDetails.map(a => 
                        `${a.productName}: KES ${a.balance.toFixed(2)}`
                    ).join('; ');
                } else {
                    accountsStr = "No savings accounts";
                }

                return [
                    index + 1,
                    member.memberNumber || "N/A",
                    getFullName(member),
                    member.idNumber || "N/A",
                    getGenderLabel(member.gender),
                    member.address?.mobileLine || member.address?.landLine || "N/A",
                    member.address?.email || "N/A",
                    `Share: KES ${accountBalances.share.toFixed(2)}\nDeposit: KES ${accountBalances.deposit.toFixed(2)}`,
                    `KES ${accountBalances.totalBalance.toFixed(2)}`,
                    accountsStr
                ];
            });

            const headers = [
                'No.', 'Member No', 'Full Name', 'ID Number', 'Gender',
                'Phone', 'Email', 'Accounts', 'Total Balance', 'Account Details'
            ];

            autoTable(doc, {
                head: [headers],
                body: tableData,
                startY: 42,
                styles: {
                    fontSize: 7,
                    cellPadding: 2,
                    lineColor: [200, 200, 200],
                    lineWidth: 0.1,
                },
                headStyles: {
                    fillColor: [60, 60, 120],
                    textColor: [255, 255, 255],
                    fontSize: 8,
                    fontStyle: 'bold',
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 255],
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' },
                    1: { cellWidth: 22 },
                    2: { cellWidth: 35 },
                    3: { cellWidth: 22 },
                    4: { cellWidth: 18, halign: 'center' },
                    5: { cellWidth: 22 },
                    6: { cellWidth: 30 },
                    7: { cellWidth: 35 },
                    8: { cellWidth: 22, halign: 'right' },
                    9: { cellWidth: 45 },
                },
                didDrawPage: function (data) {
                    const totalPages = doc.internal.getNumberOfPages ? doc.internal.getNumberOfPages() : data.pageCount;
                    const currentPage = data.pageNumber;
                    
                    doc.setFontSize(7);
                    doc.setTextColor(120, 120, 120);
                    
                    doc.text(
                        `Printed on: ${new Date().toLocaleDateString()} | Page: ${currentPage} of ${totalPages}`,
                        14,
                        pageHeight - 8
                    );
                    
                    doc.text(
                        'This is a system generated report. For any queries, contact: SUPREMEsacco@gmail.com',
                        pageWidth / 2,
                        
                        pageHeight - 8,
                        { align: 'center' }
                    );
                    
                    if (currentPage === 1) {
                        doc.text(
                            `Total Members: ${filteredMembers.length}`,
                            pageWidth - 14,
                            pageHeight - 8,
                            { align: 'right' }
                        );
                    }
                },
                margin: { top: 42, bottom: 15, left: 10, right: 10 },
            });

            const pdfBlob = doc.output('blob');
            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Members_List_${new Date().toISOString().slice(0,10)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            Swal.close();
            
            Swal.fire({
                title: "Success!",
                text: `PDF exported successfully with ${filteredMembers.length} members.`,
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            Swal.close();
            console.error("Export PDF Error:", err);
            Swal.fire("Error", "Failed to generate PDF: " + err.message, "error");
        }
    };

    // Export to Excel - Members List
    const handleExportExcel = () => {
        try {
            if (!filteredMembers || filteredMembers.length === 0) {
                Swal.fire("Error", "No members to export.", "error");
                return;
            }

            Swal.fire({
                title: 'Generating Excel...',
                text: `Exporting ${filteredMembers.length} members...`,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const excelData = filteredMembers.map((member, index) => {
                const fullName = getFullName(member);
                const gender = getGenderLabel(member.gender);
                const accountBalances = getAccountBalances(member);
                
                let accountDetails = "";
                if (accountBalances.accountDetails && accountBalances.accountDetails.length > 0) {
                    accountDetails = accountBalances.accountDetails.map(a => 
                        `${a.productName}: KES ${a.balance.toFixed(2)}`
                    ).join('; ');
                } else {
                    accountDetails = "No savings accounts";
                }

                return {
                    '#': index + 1,
                    'Member Number': member.memberNumber || "N/A",
                    'Full Name': fullName,
                    'ID Number': member.idNumber || "N/A",
                    'Gender': gender,
                    'Phone': member.address?.mobileLine || member.address?.landLine || "N/A",
                    'Email': member.address?.email || "N/A",
                    'Share Accounts': `KES ${accountBalances.share.toFixed(2)}`,
                    'Deposit Accounts': `KES ${accountBalances.deposit.toFixed(2)}`,
                    'Total Balance': `KES ${accountBalances.totalBalance.toFixed(2)}`,
                    'Account Details': accountDetails
                };
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(excelData);

            const colWidths = [
                { wch: 5 }, { wch: 18 }, { wch: 30 }, { wch: 18 }, { wch: 12 },
                { wch: 18 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 60 }
            ];
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, "Members");
            
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Members_List_${new Date().toISOString().slice(0,10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            Swal.close();
            
            Swal.fire({
                title: "Success!",
                text: `Exported ${filteredMembers.length} members successfully.`,
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            Swal.close();
            console.error("Export Excel Error:", err);
            Swal.fire("Error", "Failed to export Excel file: " + err.message, "error");
        }
    };

    // Export to PDF - Members with Loan Balances
    const handlePrintLoanPDF = () => {
        try {
            const membersWithLoans = filteredMembers.filter(m => {
                if (!m.accounts || !Array.isArray(m.accounts)) return false;
                return m.accounts.some(account => account.accountType === 'Loan' && account.balance > 0);
            });

            if (!membersWithLoans || membersWithLoans.length === 0) {
                Swal.fire("Info", "No members with active loans found to export.", "info");
                return;
            }

            Swal.fire({
                title: 'Generating Loan Report PDF...',
                text: `Generating report for ${membersWithLoans.length} members with loans...`,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const doc = new jsPDF('landscape', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            
            doc.setFontSize(16);
            doc.setTextColor(40, 40, 80);
            doc.text('SUPREME SACCO', pageWidth / 2, 15, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setTextColor(80, 80, 80);
            doc.text('SUPREME House, Off Airport North Embakasi', pageWidth / 2, 22, { align: 'center' });
            doc.text('SUPREMEsacco@gmail.com', pageWidth / 2, 28, { align: 'center' });
            
            doc.setFontSize(14);
            doc.setTextColor(40, 40, 80);
            doc.text('MEMBERS LOAN BALANCES REPORT', pageWidth / 2, 36, { align: 'center' });

            const tableData = membersWithLoans.map((member, index) => {
                const loanBalances = getLoanBalances(member);
                
                let loanDetailsStr = "";
                if (loanBalances.loanDetails && loanBalances.loanDetails.length > 0) {
                    loanDetailsStr = loanBalances.loanDetails.map(l => 
                        `${l.loanType}: KES ${l.balance.toFixed(2)} [${l.status}]`
                    ).join('\n');
                } else {
                    loanDetailsStr = "No loans";
                }

                return [
                    index + 1,
                    member.memberNumber || "N/A",
                    getFullName(member),
                    member.idNumber || "N/A",
                    getGenderLabel(member.gender),
                    member.address?.mobileLine || member.address?.landLine || "N/A",
                    member.address?.email || "N/A",
                    loanBalances.loanCount,
                    `KES ${loanBalances.totalBalance.toFixed(2)}`,
                    loanDetailsStr
                ];
            });

            const headers = [
                'No.', 'Member No', 'Full Name', 'ID Number', 'Gender',
                'Phone', 'Email', 'Loan Count', 'Total Loan Balance', 'Loan Details'
            ];

            autoTable(doc, {
                head: [headers],
                body: tableData,
                startY: 42,
                styles: {
                    fontSize: 7,
                    cellPadding: 2,
                    lineColor: [200, 200, 200],
                    lineWidth: 0.1,
                },
                headStyles: {
                    fillColor: [180, 40, 40],
                    textColor: [255, 255, 255],
                    fontSize: 8,
                    fontStyle: 'bold',
                },
                alternateRowStyles: {
                    fillColor: [255, 245, 245],
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' },
                    1: { cellWidth: 22 },
                    2: { cellWidth: 35 },
                    3: { cellWidth: 22 },
                    4: { cellWidth: 18, halign: 'center' },
                    5: { cellWidth: 22 },
                    6: { cellWidth: 30 },
                    7: { cellWidth: 18, halign: 'center' },
                    8: { cellWidth: 25, halign: 'right' },
                    9: { cellWidth: 50 },
                },
                didDrawPage: function (data) {
                    const totalPages = doc.internal.getNumberOfPages ? doc.internal.getNumberOfPages() : data.pageCount;
                    const currentPage = data.pageNumber;
                    
                    doc.setFontSize(7);
                    doc.setTextColor(120, 120, 120);
                    
                    doc.text(
                        `Printed on: ${new Date().toLocaleDateString()} | Page: ${currentPage} of ${totalPages}`,
                        14,
                        pageHeight - 8
                    );
                    
                    doc.text(
                        'This is a system generated report. For any queries, contact: SUPREMEsacco@gmail.com',
                        pageWidth / 2,
                        pageHeight - 8,
                        { align: 'center' }
                    );
                    
                    if (currentPage === 1) {
                        doc.text(
                            `Total Members with Loans: ${membersWithLoans.length}`,
                            pageWidth - 14,
                            pageHeight - 8,
                            { align: 'right' }
                        );
                    }
                },
                margin: { top: 42, bottom: 15, left: 10, right: 10 },
            });

            const pdfBlob = doc.output('blob');
            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Members_Loan_Balances_${new Date().toISOString().slice(0,10)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            Swal.close();
            
            Swal.fire({
                title: "Success!",
                text: `Loan report PDF exported successfully with ${membersWithLoans.length} members.`,
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            Swal.close();
            console.error("Export Loan PDF Error:", err);
            Swal.fire("Error", "Failed to generate Loan PDF: " + err.message, "error");
        }
    };

    // Export to Excel - Members with Loan Balances
    const handleExportLoanExcel = () => {
        try {
            const membersWithLoans = filteredMembers.filter(m => {
                if (!m.accounts || !Array.isArray(m.accounts)) return false;
                return m.accounts.some(account => account.accountType === 'Loan' && account.balance > 0);
            });

            if (!membersWithLoans || membersWithLoans.length === 0) {
                Swal.fire("Info", "No members with active loans found to export.", "info");
                return;
            }

            Swal.fire({
                title: 'Generating Loan Report Excel...',
                text: `Exporting ${membersWithLoans.length} members with loans...`,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const excelData = membersWithLoans.map((member, index) => {
                const fullName = getFullName(member);
                const gender = getGenderLabel(member.gender);
                const loanBalances = getLoanBalances(member);
                
                let loanDetails = "";
                if (loanBalances.loanDetails && loanBalances.loanDetails.length > 0) {
                    loanDetails = loanBalances.loanDetails.map(l => 
                        `${l.loanType}: KES ${l.balance.toFixed(2)} [${l.status}]`
                    ).join('; ');
                } else {
                    loanDetails = "No loans";
                }

                return {
                    '#': index + 1,
                    'Member Number': member.memberNumber || "N/A",
                    'Full Name': fullName,
                    'ID Number': member.idNumber || "N/A",
                    'Gender': gender,
                    'Phone': member.address?.mobileLine || member.address?.landLine || "N/A",
                    'Email': member.address?.email || "N/A",
                    'Number of Loans': loanBalances.loanCount,
                    'Total Loan Balance': `KES ${loanBalances.totalBalance.toFixed(2)}`,
                    'Loan Details': loanDetails
                };
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(excelData);

            const colWidths = [
                { wch: 5 }, { wch: 18 }, { wch: 30 }, { wch: 18 }, { wch: 12 },
                { wch: 18 }, { wch: 30 }, { wch: 18 }, { wch: 22 }, { wch: 60 }
            ];
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, "Members with Loans");
            
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Members_Loan_Balances_${new Date().toISOString().slice(0,10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            Swal.close();
            
            Swal.fire({
                title: "Success!",
                text: `Loan report Excel exported successfully with ${membersWithLoans.length} members.`,
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            Swal.close();
            console.error("Export Loan Excel Error:", err);
            Swal.fire("Error", "Failed to export Loan Excel file: " + err.message, "error");
        }
    };

    const updateFilter = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const clearFilter = (key) => {
        setFilters((prev) => ({ ...prev, [key]: "" }));
        setActiveFilter(null);
    };

    const clearAllFilters = () => {
        setFilters({ memberNo: "", fullName: "", idNo: "", phone: "", RegistrationDate: "" });
        setActiveFilter(null);
    };

    const hasActiveFilters = Object.values(filters).some((v) => v !== "");

    const FilterButton = ({ filterKey, label, inputType = "text", placeholder }) => {
        const isActive = filters[filterKey] !== "";
        const isOpen = activeFilter === filterKey;

        return (
            <div className="relative inline-block">
                <button
                    onClick={() => setActiveFilter(isOpen ? null : filterKey)}
                    className={`ml-1 p-0.5 rounded transition-colors ${isActive
                        ? "text-yellow-300 bg-yellow-400/20"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                        }`}
                    title={`Filter by ${label}`}
                >
                    <FaFilter size={10} />
                </button>

                {isOpen && (
                    <div
                        className="absolute top-7 left-0 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-[200px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            Filter by {label}
                        </p>
                        <input
                            type={inputType}
                            autoFocus
                            value={filters[filterKey]}
                            onChange={(e) => updateFilter(filterKey, e.target.value)}
                            placeholder={placeholder || `Enter ${label}...`}
                            className="w-full px-3 py-2 text-sm border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === "Escape") setActiveFilter(null);
                            }}
                        />
                        <div className="flex justify-between mt-2">
                            <button
                                onClick={() => clearFilter(filterKey)}
                                className="text-xs text-red-500 hover:text-red-700"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => setActiveFilter(null)}
                                className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative"
            onClick={() => activeFilter && setActiveFilter(null)}
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaUserAlt /> Members
                </h2>
                <div className="flex gap-3 flex-wrap">
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                        onClick={() => setOpenAddDrawer(true)}
                    >
                        <FaPlus /> Add Member
                    </Button>
                    <Button
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                        onClick={() => setOpenBulkUploadModal(true)}
                    >
                        <FaUpload /> Bulk Upload
                    </Button>
                    <Button
                        variant="outline"
                        className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                        onClick={handlePrintPDF}
                    >
                        <FaFilePdf /> Export PDF
                    </Button>
                    <Button
                        variant="outline"
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                        onClick={handleExportExcel}
                    >
                        <FaFileExcel /> Export Excel
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2"
                            >
                                <FaMoneyBillWave /> Loan Reports
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={handlePrintLoanPDF}>
                                <FaFilePdf className="mr-2 text-red-600" /> Export Loan Report (PDF)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportLoanExcel}>
                                <FaFileExcel className="mr-2 text-green-600" /> Export Loan Report (Excel)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mb-4 items-center">
                    <span className="text-sm text-gray-500 font-medium">Active filters:</span>
                    {Object.entries(filters).map(([key, value]) => {
                        if (!value) return null;
                        const labels = {
                            memberNo: "Member No",
                            fullName: "Full Name",
                            idNo: "ID No",
                            phone: "Phone",
                            RegistrationDate: "Registration Date",
                        };
                        return (
                            <span
                                key={key}
                                className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full"
                            >
                                {labels[key]}: <strong>{value}</strong>
                                <button onClick={() => clearFilter(key)} className="ml-1 hover:text-red-500">
                                    <FaTimes size={10} />
                                </button>
                            </span>
                        );
                    })}
                    <button
                        onClick={clearAllFilters}
                        className="text-xs text-red-500 hover:text-red-700 underline ml-1"
                    >
                        Clear all
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="bg-gray-200 p-4 rounded-sm" onClick={(e) => e.stopPropagation()}>
                {/* Table Header with per-column filters */}
                <div className="grid grid-cols-14 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <div className="col-span-2 flex items-center">
                        Member No
                        <FilterButton filterKey="memberNo" label="Member No" placeholder="e.g. 000113" />
                    </div>
                    <div className="col-span-2 flex items-center">
                        Full Name
                        <FilterButton filterKey="fullName" label="Full Name" placeholder="e.g. John Doe" />
                    </div>
                    <div className="col-span-2 flex items-center">
                        ID No
                        <FilterButton filterKey="idNo" label="ID No" placeholder="e.g. 12345678" />
                    </div>
                    <div className="col-span-2 flex items-center">
                        Gender
                    </div>
                    <div className="col-span-2 flex items-center">
                        Phone
                        <FilterButton filterKey="phone" label="Phone" placeholder="e.g. 0712..." />
                    </div>
                    <div className="col-span-2 flex items-center">
                        Registration Date
                        <FilterButton filterKey="RegistrationDate" label="Registration Date" inputType="date" />
                    </div>
                    <span className="col-span-2 text-right">Actions</span>
                </div>

                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                                {Array.from({ length: 12 }).map((__, j) => (
                                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : members.length === 0 ? (
                    <div className="flex flex-col justify-center items-center p-10">
                        <img src={NotFoundImage} className="w-40 opacity-70" alt="Not found" />
                        <p className="mt-4 text-gray-500">No Members Found</p>
                    </div>
                ) : (
                    members.map((m) => (
                        <div
                            key={m.id}
                            className="bg-white shadow-sm rounded-lg p-4 mb-4 transition hover:shadow-md"
                        >
                            <div className="grid grid-cols-14 gap-4 items-center">
                                <span className="col-span-2 font-semibold text-indigo-700">
                                    {m.memberNumber || "N/A"}
                                </span>
                                <span className="col-span-2 font-semibold truncate">
                                    {getFullName(m)}
                                </span>
                                <span className="col-span-2 text-gray-600">
                                    {m.idNumber || "N/A"}
                                </span>
                                <span className="col-span-2 text-gray-600">
                                    {getGenderLabel(m.gender)}
                                </span>
                                <span className="col-span-2 text-gray-600">
                                    {m.address?.mobileLine || m.address?.landLine || "N/A"}
                                </span>
                                <span className="col-span-2 text-gray-500 text-sm">
                                    {formatDate(m.registrationDate)}
                                </span>

                                <div className="col-span-2 flex items-center gap-2 justify-end">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-gray-700 hover:bg-gray-600 text-white"
                                        onClick={() => {
                                            setDetailMember(m);
                                            setOpenDetailsDrawer(true);
                                        }}
                                    >
                                        <FaChevronRight /> More Info
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="p-2 rounded hover:bg-gray-100 transition">
                                                <FaEllipsisV className="cursor-pointer text-gray-500" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem
                                                className="text-green-600"
                                                onClick={() => handleAddAccount(m)}
                                            >
                                                <FaWallet className="mr-2" /> Add Account
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setSelectedMember(m);
                                                    setOpenEditDrawer(true);
                                                }}
                                            >
                                                Edit
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Rows per page</span>
                        <Select
                            value={String(pageSize)}
                            onValueChange={(value) => setPageSize(Number(value))}
                        >
                            <SelectTrigger className="w-24">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {totalCount > 0 && (
                        <span className="text-sm text-gray-500">
                            {Math.min(currentPage * pageSize + 1, totalCount)}–
                            {Math.min((currentPage + 1) * pageSize, totalCount)} of {totalCount} members
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 0}
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
                    >
                        <FaChevronLeft /> Prev
                    </Button>

                    <span className="text-sm text-gray-600">
                        Page {currentPage + 1}
                        {totalPages ? ` of ${totalPages}` : ""}
                    </span>

                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isLastPage}
                        onClick={() => setCurrentPage((p) => p + 1)}
                    >
                        Next <FaChevronRight />
                    </Button>
                </div>
            </div>

            {/* Drawers */}
            <MemberDetailsDrawer
                open={openDetailsDrawer}
                onClose={() => setOpenDetailsDrawer(false)}
                member={detailMember}
            />
            <MemberRegistrationProvider>
                <MemberRegistrationDrawer
                    open={openAddDrawer}
                    onClose={() => setOpenAddDrawer(false)}
                    refresh={fetchMembers}
                />
            </MemberRegistrationProvider>
            <MemberEditDrawer
                open={openEditDrawer}
                onClose={() => setOpenEditDrawer(false)}
                refresh={fetchMembers}
                member={selectedMember}
            />

            {/* Bulk Upload Modal */}
            <MemberBulkUploadModal
                isOpen={openBulkUploadModal}
                onClose={() => setOpenBulkUploadModal(false)}
                onSuccess={handleBulkUploadSuccess}
            />

            {/* Add Account Modal */}
            {showAddAccountModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddAccountModal(false)}>
                    <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <FaWallet className="text-indigo-600" />
                                Add Account
                            </h3>
                            <button
                                onClick={() => setShowAddAccountModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-gray-500">Member</p>
                                <p className="font-medium text-gray-800">
                                    {getFullName(accountMember)}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Member No: {accountMember?.memberNumber || "N/A"}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Branch <span className="text-red-500">*</span>
                                </label>
                                {loadingBranches ? (
                                    <div className="flex items-center justify-center py-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                        <span className="ml-2 text-sm text-gray-500">Loading branches...</span>
                                    </div>
                                ) : (
                                    <select
                                        value={selectedBranch}
                                        onChange={(e) => setSelectedBranch(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">Select a branch...</option>
                                        {branches.map((branch) => (
                                            <option key={branch.Id} value={branch.Id}>
                                                {branch.Description} ({branch.PaddedCode})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Account Type <span className="text-red-500">*</span>
                                </label>
                                {loadingProducts ? (
                                    <div className="flex items-center justify-center py-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                        <span className="ml-2 text-sm text-gray-500">Loading products...</span>
                                    </div>
                                ) : (
                                    <>
                                        <select
                                            value={selectedProduct}
                                            onChange={(e) => setSelectedProduct(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="">Select a product...</option>
                                            {products
                                                .filter(p => {
                                                    if (accountMember && accountMember.accounts && Array.isArray(accountMember.accounts)) {
                                                        const hasProduct = accountMember.accounts.some(account => 
                                                            account.productCode === p.Code || 
                                                            account.productDescription === p.Description
                                                        );
                                                        if (hasProduct) {
                                                            return false;
                                                        }
                                                    }
                                                    return true;
                                                })
                                                .map((product) => (
                                                    <option key={product.Id} value={product.Code}>
                                                        {product.Description} (Code: {product.PaddedCode})
                                                    </option>
                                                ))
                                            }
                                        </select>
                                        
                                        {products.filter(p => {
                                            if (accountMember && accountMember.accounts && Array.isArray(accountMember.accounts)) {
                                                const hasProduct = accountMember.accounts.some(account => 
                                                    account.productCode === p.Code || 
                                                    account.productDescription === p.Description
                                                );
                                                if (hasProduct) {
                                                    return false;
                                                }
                                            }
                                            return true;
                                        }).length === 0 && (
                                            <p className="text-sm text-amber-600 mt-2">
                                                <span className="font-medium">Note:</span> This member already has all available account types.
                                            </p>
                                        )}
                                        
                                        <p className="text-xs text-gray-400 mt-1">
                                            Select the type of account to create for this member.
                                        </p>
                                    </>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowAddAccountModal(false)}
                                    disabled={addingAccount}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                                    onClick={handleSubmitAccount}
                                    disabled={!selectedProduct || !selectedBranch || addingAccount}
                                >
                                    {addingAccount ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <FaPlus /> Create Account
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}