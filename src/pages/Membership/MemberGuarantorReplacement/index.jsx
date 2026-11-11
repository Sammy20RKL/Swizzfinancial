// C:\Project\RUBANISwizzfinancial-main\src\pages\Membership\MemberGuarantorReplacement\index.jsx

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaUserShield,
    FaChevronLeft,
    FaChevronRight,
    FaExchangeAlt,
    FaHistory,
    FaUserCheck,
    FaUserTimes,
    FaCalendarAlt,
    FaSearch,
    FaTimes
} from "react-icons/fa";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import GuarantorReplacementDrawer from "./GuarantorReplacementDrawer";
import GuarantorReplacementHistoryDrawer from "./GuarantorReplacementHistoryDrawer";

// Status constants
const GuarantorSubstitutionStatus = {
    All: 0,
    Pending: 1,
    Completed: 2,
    Failed: 4
};

export default function MemberGuarantorReplacement() {
    const [substitutions, setSubstitutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedSubstitution, setSelectedSubstitution] = useState(null);
    const [openHistoryDrawer, setOpenHistoryDrawer] = useState(false);
    const [openReplacementDrawer, setOpenReplacementDrawer] = useState(false);
    
    // Date filter state
    const [statusFilter, setStatusFilter] = useState(0); // 0 = All
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1); // Default to 1 month ago
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [showFilters, setShowFilters] = useState(false);
    
    const pageSize = 10;

    // Fetch guarantor substitution history on component mount and when filters change
    useEffect(() => {
        fetchSubstitutionHistory();
    }, [currentPage, statusFilter, startDate, endDate, search]);

    const fetchSubstitutionHistory = async () => {
        setLoading(true);
        try {
            // Build URL with query parameters
            const params = new URLSearchParams();
            params.append('status', statusFilter);
            params.append('startDate', startDate);
            params.append('endDate', endDate);
            params.append('text', search);
            params.append('pageIndex', currentPage);
            params.append('pageSize', pageSize);
            
            const url = `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/MemberExit/GetGuarantorSubstitutionHistory?${params.toString()}`;
            
            console.log("Fetching URL:", url);
            
            const res = await fetch(url, {
                headers: {
                    "ngrok-skip-browser-warning": "true",
                },
            });

            const json = await res.json();
            
            if (json.Success && json.Data) {
                // Handle paginated response
                setSubstitutions(json.Data.PageCollection || []);
                // You might also want to store total count for pagination
                // setTotalPages(Math.ceil(json.Data.TotalCount / pageSize));
            } else {
                setSubstitutions([]);
            }
        } catch (err) {
            console.error("Fetch Guarantor Substitution Error:", err);
            Swal.fire("Error", "Failed to load guarantor substitution records", "error");
            setSubstitutions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchSubstitutionHistory();
    };

    const handleResetFilters = () => {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        setStatusFilter(0);
        setStartDate(oneMonthAgo.toISOString().split('T')[0]);
        setEndDate(new Date().toISOString().split('T')[0]);
        setSearch("");
        setCurrentPage(1);
    };

    // Helper function to get member full name
    const getFullName = (record) => {
        const firstName = record.CustomerIndividualFirstName || "";
        const lastName = record.CustomerIndividualLastName || "";
        return `${firstName} ${lastName}`.trim() || "N/A";
    };

    // Helper function to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString || dateString === "0001-01-01T00:00:00") return "-";
        return new Date(dateString).toLocaleDateString();
    };

    // Get status badge for history records
    const getStatusBadge = (status) => {
        const statusMap = {
            0: { color: "bg-gray-100 text-gray-800", label: "All" },
            1: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
            2: { color: "bg-green-100 text-green-800", label: "Completed" },
            4: { color: "bg-red-100 text-red-800", label: "Failed" }
        };
        const config = statusMap[status] || { color: "bg-gray-100 text-gray-800", label: "Unknown" };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
                {config.label}
            </span>
        );
    };

    // Get account type badge color
    const getAccountTypeBadge = (productCode, productDescription) => {
        const typeMap = {
            1: { color: "bg-blue-100 text-blue-800", label: "Savings" },
            2: { color: "bg-red-100 text-red-800", label: "Loan" },
            3: { color: "bg-purple-100 text-purple-800", label: "Investment" },
            4: { color: "bg-orange-100 text-orange-800", label: "Microcredit" },
            5: { color: "bg-teal-100 text-teal-800", label: "Special" },
            9: { color: "bg-indigo-100 text-indigo-800", label: "Fixed Deposit" },
            11: { color: "bg-pink-100 text-pink-800", label: "Recurring Deposit" },
            13: { color: "bg-emerald-100 text-emerald-800", label: "Education Fund" }
        };
        
        const config = typeMap[productCode] || { color: "bg-gray-100 text-gray-800", label: productDescription || "Account" };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
                {config.label}
            </span>
        );
    };

    // Get loan limit status badge
    const getLoanLimitBadge = (limit) => {
        if (!limit || limit === 0) {
            return <span className="text-gray-400">No limit</span>;
        }
        
        if (limit >= 5000000) {
            return <span className="text-green-600 font-semibold">{formatCurrency(limit)}</span>;
        } else if (limit >= 1000000) {
            return <span className="text-blue-600 font-semibold">{formatCurrency(limit)}</span>;
        } else {
            return <span className="text-orange-600 font-semibold">{formatCurrency(limit)}</span>;
        }
    };

    // Handle new replacement
    const handleNewReplacement = () => {
        setOpenReplacementDrawer(true);
    };

    // Handle view history/details
    const handleViewDetails = (record) => {
        setSelectedSubstitution(record);
        setOpenHistoryDrawer(true);
    };

    // Pagination (if using client-side pagination)
    const totalPages = Math.ceil(substitutions.length / pageSize);
    const paginatedData = substitutions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaUserShield /> Guarantor Replacement Management
                </h2>
                <div className="flex gap-3">
                    <Button
                        className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                        onClick={handleNewReplacement}
                    >
                        <FaExchangeAlt /> New Guarantor Replacement
                    </Button>
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                        onClick={() => fetchSubstitutionHistory()}
                    >
                        <FaHistory /> Refresh
                    </Button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <FaUserCheck className="text-blue-600 mt-1" size={20} />
                    <div>
                        <p className="font-semibold text-blue-800">About Guarantor Replacement</p>
                        <p className="text-sm text-blue-700">
                            Use this feature to replace a guarantor for a member who is exiting the SACCO. 
                            The replacement guarantor must be an active member in good standing with sufficient 
                            share capital and not exceed their maximum guarantee limit.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter Toggle Button */}
            <div className="mb-4">
                <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                >
                    <FaCalendarAlt /> {showFilters ? "Hide Filters" : "Show Filters"}
                </Button>
            </div>

            {/* Filters Section */}
            {showFilters && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value={0}>All Status</option>
                                <option value={1}>Pending</option>
                                <option value={2}>Completed</option>
                                <option value={4}>Failed</option>
                            </select>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Search Text */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Search
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Name, ID, Phone..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <Button
                                    onClick={handleSearch}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    <FaSearch />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Filter Actions */}
                    <div className="mt-4 flex justify-end">
                        <Button
                            variant="outline"
                            onClick={handleResetFilters}
                            className="flex items-center gap-2"
                        >
                            <FaTimes /> Reset Filters
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* Search Bar (Simple) */}
            <div className="flex justify-start mb-6">
                <div className="relative w-full max-w-md">
                    <input
                        type="text"
                        placeholder="Quick search by name, ID, phone, Member No..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full px-4 py-3 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-12"
                    />
                    <Button
                        onClick={handleSearch}
                        className="absolute right-1 top-1 bg-indigo-600 hover:bg-indigo-700 rounded-full p-2"
                    >
                        <FaSearch className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-gray-200 p-4 rounded-sm overflow-x-auto">
                <div className="grid grid-cols-13 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 min-w-[1100px]">
                    <div className="col-span-2">Member No</div>
                    <div className="col-span-2">Full Name</div>
                    <div className="col-span-2">ID Number</div>
                    <div className="col-span-2">Phone</div>
                    <div className="col-span-2">Account Type</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1">Loan Limit</div>
                    <div className="col-span-1 text-center">Actions</div>
                </div>

                {loading ? (
                    <div className="p-6 text-center text-gray-500">
                        <div className="animate-pulse">Loading guarantor records...</div>
                    </div>
                ) : paginatedData.length === 0 ? (
                    <div className="flex flex-col justify-center items-center p-10">
                        <img src={NotFoundImage} className="w-40 opacity-70" alt="No records" />
                        <p className="mt-4 text-gray-500">No Guarantor Records Found</p>
                        <p className="text-sm text-gray-400 mt-2">
                            Try adjusting your filters or date range
                        </p>
                        <Button 
                            className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                            onClick={handleNewReplacement}
                        >
                            <FaExchangeAlt className="mr-2" /> Start New Replacement
                        </Button>
                    </div>
                ) : (
                    paginatedData.map((record, idx) => (
                        <motion.div
                            key={record.Id || idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white shadow-sm rounded-lg p-4 mb-4 hover:shadow-md transition-shadow"
                        >
                            <div className="grid grid-cols-13 gap-4 items-center min-w-[1100px]">
                                <div className="col-span-2">
                                    <div className="font-mono text-sm font-semibold text-indigo-600">
                                        {record.PaddedCustomerSerialNumber || record.PaddedSerialNumber || "-"}
                                    </div>
                                    {record.CustomerReference2 && (
                                        <div className="text-xs text-gray-400">
                                            Ref: {record.CustomerReference2}
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <div className="font-semibold text-gray-800">
                                        {getFullName(record)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {record.CustomerIndividualTypeDescription || "Member"}
                                    </div>
                                </div>
                                <div className="col-span-2 text-sm text-gray-600">
                                    {record.CustomerIndividualIdentityCardNumber || "-"}
                                </div>
                                <div className="col-span-2 text-sm text-gray-600">
                                    {record.CustomerAddressMobileLine || "-"}
                                </div>
                                <div className="col-span-2">
                                    {getAccountTypeBadge(
                                        record.CustomerAccountTypeProductCode,
                                        record.CustomerAccountTypeTargetProductDescription
                                    )}
                                    <div className="text-xs text-gray-500 mt-1 font-mono">
                                        {record.FullAccountNumber}
                                    </div>
                                </div>
                                <div className="col-span-1">
                                    {getStatusBadge(record.Status || 0)}
                                </div>
                                <div className="col-span-1">
                                    {getLoanLimitBadge(record.ScoredLoanLimit)}
                                </div>
                                <div className="col-span-1 text-center">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-indigo-600 hover:text-white hover:bg-indigo-600 border-indigo-300"
                                        onClick={() => handleViewDetails(record)}
                                    >
                                        <FaHistory className="mr-1" /> Details
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Additional info for members with high loan limits */}
                            {record.ScoredLoanLimit && record.ScoredLoanLimit > 1000000 && (
                                <div className="mt-3 pt-2 border-t border-gray-100">
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="text-gray-500">
                                            <FaUserShield className="inline mr-1" size={12} />
                                            Guarantor since: {formatDate(record.CreatedDate)}
                                        </span>
                                        {record.ScoredLoanLimitRemarks && (
                                            <span className="text-gray-400">
                                                Note: {record.ScoredLoanLimitRemarks}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))
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
                        className="border-gray-300"
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
                        className="border-gray-300"
                    >
                        Next <FaChevronRight />
                    </Button>
                </div>
            )}

            {/* Statistics Summary */}
            {!loading && substitutions.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600">
                                {substitutions.length}
                            </div>
                            <div className="text-xs text-gray-500">Total Records</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {substitutions.filter(s => s.ScoredLoanLimit > 0).length}
                            </div>
                            <div className="text-xs text-gray-500">Have Loan Limit</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {substitutions.filter(s => s.ScoredLoanLimit >= 5000000).length}
                            </div>
                            <div className="text-xs text-gray-500">High Value (Over 5M)</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                                {substitutions.filter(s => s.CustomerIsDefaulter).length}
                            </div>
                            <div className="text-xs text-gray-500">Defaulters</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Drawers */}
            <GuarantorReplacementDrawer
                open={openReplacementDrawer}
                onClose={() => {
                    setOpenReplacementDrawer(false);
                    fetchSubstitutionHistory();
                }}
                refresh={fetchSubstitutionHistory}
            />

            <GuarantorReplacementHistoryDrawer
                open={openHistoryDrawer}
                onClose={() => setOpenHistoryDrawer(false)}
                record={selectedSubstitution}
            />
        </div>
    );
}