import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaBuilding,
    FaPlus,
    FaPhone,
    FaEnvelope,
    FaTrash,
    FaChevronDown,
    FaChevronUp,
    FaEllipsisV,
    FaMapMarkerAlt,
    FaSearch,
    FaFilter,
} from "react-icons/fa";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import AddBranch from "./AddBranch";
import EditBranch from "./EditBranch";

export default function Branches() {
    const [branches, setBranches] = useState([]);
    const [filteredBranches, setFilteredBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedBranch, setExpandedBranch] = useState(null);
    const [openEdit, setOpenEdit] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [openBranch, setOpenBranch] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [companyFilter, setCompanyFilter] = useState("all");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");
    const [showFilters, setShowFilters] = useState(false);
    const [uniqueCompanies, setUniqueCompanies] = useState([]);

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        if (branches.length > 0) {
            // Extract unique companies for filter dropdown
            const companies = [...new Set(branches
                .map(branch => branch.CompanyDescription)
                .filter(company => company && company.trim() !== "")
            )];
            setUniqueCompanies(companies);
        }
        applyFilters();
    }, [branches, searchQuery, companyFilter, sortBy, sortOrder]);

    const fetchBranches = async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/branches`
            );
            const json = await res.json();
            setBranches(json.data || []);
        } catch (err) {
            console.error("Fetch Branches Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...branches];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(branch =>
                branch.Description?.toLowerCase().includes(query) ||
                branch.AddressEmail?.toLowerCase().includes(query) ||
                branch.AddressMobileLine?.toLowerCase().includes(query) ||
                branch.CompanyDescription?.toLowerCase().includes(query) ||
                branch.AddressCity?.toLowerCase().includes(query) ||
                branch.AddressStreet?.toLowerCase().includes(query)
            );
        }

        // Company filter
        if (companyFilter !== "all") {
            filtered = filtered.filter(branch =>
                branch.CompanyDescription === companyFilter
            );
        }

        // Sorting
        filtered.sort((a, b) => {
            let valueA, valueB;

            switch (sortBy) {
                case "name":
                    valueA = a.Description || "";
                    valueB = b.Description || "";
                    break;
                case "email":
                    valueA = a.AddressEmail || "";
                    valueB = b.AddressEmail || "";
                    break;
                case "company":
                    valueA = a.CompanyDescription || "";
                    valueB = b.CompanyDescription || "";
                    break;
                case "phone":
                    valueA = a.AddressMobileLine || "";
                    valueB = b.AddressMobileLine || "";
                    break;
                case "city":
                    valueA = a.AddressCity || "";
                    valueB = b.AddressCity || "";
                    break;
                default:
                    valueA = a.Description || "";
                    valueB = b.Description || "";
            }

            if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
            if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        setFilteredBranches(filtered);
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("asc");
        }
    };

    const clearFilters = () => {
        setSearchQuery("");
        setCompanyFilter("all");
        setSortBy("name");
        setSortOrder("asc");
    };

    // DELETE /api/branches/{id}
    const handleDelete = async (id) => {
        Swal.fire({
            title: "Delete Branch?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Delete",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(
                        `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/branches/${id}`,
                        {
                            method: "DELETE"
                        }
                    );

                    if (!res.ok) throw new Error("Failed to delete branch");

                    setBranches((prev) => prev.filter((b) => b.Id !== id));

                    Swal.fire("Deleted!", "Branch removed successfully.", "success");
                } catch (error) {
                    Swal.fire("Error", error.message, "error");
                }
            }
        });
    };

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaBuilding className="text-white" /> Branches
                    <span className="text-sm font-normal ml-2">
                        ({filteredBranches.length} {filteredBranches.length === 1 ? 'branch' : 'branches'})
                    </span>
                </h2>
                <Button
                    onClick={() => setOpenBranch(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                >
                    <FaPlus /> Add Branch
                </Button>
            </div>

            {/* Search and Filter Bar */}
            <div className="mb-6 bg-gray-100 p-4 rounded-lg">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Input */}
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search branches by name, email, phone, company, city, or street..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>

                    {/* Filter Toggle Button */}
                    <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FaFilter />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </Button>

                    {/* Clear Filters Button */}
                    {(searchQuery || companyFilter !== "all") && (
                        <Button
                            variant="ghost"
                            onClick={clearFilters}
                            className="text-gray-600 hover:text-gray-800"
                        >
                            Clear Filters
                        </Button>
                    )}
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Company Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Company
                            </label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={companyFilter}
                                onChange={(e) => setCompanyFilter(e.target.value)}
                            >
                                <option value="all">All Companies</option>
                                {uniqueCompanies.map((company, index) => (
                                    <option key={index} value={company}>
                                        {company}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sort Options */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sort By
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {['name', 'company', 'email', 'phone', 'city'].map((field) => (
                                    <Button
                                        key={field}
                                        size="sm"
                                        variant={sortBy === field ? "default" : "outline"}
                                        className="capitalize"
                                        onClick={() => handleSort(field)}
                                    >
                                        {field}
                                        {sortBy === field && (
                                            <span className="ml-1">
                                                {sortOrder === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Table Header */}
            <div className="bg-gray-200 p-4 rounded-sm">
                <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-3">Branch</span>
                    <span className="col-span-3">Email</span>
                    <span className="col-span-2">Phone</span>
                    <span className="col-span-2">Company</span>
                    <span className="col-span-2 text-right">Actions</span>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                                {Array.from({ length: 12 }).map((_, j) => (
                                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : filteredBranches.length > 0 ? (
                    <div className="space-y-2">
                        {filteredBranches.map((branch) => (
                            <div key={branch.Id} className="bg-white rounded-lg shadow-lg border">
                                {/* Main Row */}
                                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                                    <span className="font-medium text-indigo-700 col-span-3">
                                        {branch.Description}
                                    </span>

                                    <span className="col-span-3 truncate">
                                        <FaEnvelope className="inline mr-1 text-gray-500" />
                                        {branch.AddressEmail}
                                    </span>

                                    <span className="col-span-2 flex items-center gap-2">
                                        <FaPhone className="text-gray-500" />
                                        {branch.AddressMobileLine}
                                    </span>

                                    <span className="col-span-2 text-sm text-gray-600">
                                        {branch.CompanyDescription}
                                    </span>

                                    {/* Expand */}
                                    <span className="col-span-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-gray-700 hover:bg-gray-600 text-white"
                                            onClick={() =>
                                                setExpandedBranch(
                                                    expandedBranch === branch.Id ? null : branch.Id
                                                )
                                            }
                                        >
                                            {expandedBranch === branch.Id ? (
                                                <>
                                                    <FaChevronUp /> Hide Details
                                                </>
                                            ) : (
                                                <>
                                                    <FaChevronDown /> View Details
                                                </>
                                            )}
                                        </Button>
                                    </span>

                                    {/* Actions */}
                                    <div className="col-span-1 flex justify-end">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <FaEllipsisV className="h-4 w-4 text-gray-600" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-32">
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelectedBranch(branch);
                                                        setOpenEdit(true);
                                                    }}
                                                >
                                                    Edit
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => handleDelete(branch.Id)}
                                                >
                                                    <FaTrash className="mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Expanded Section */}
                                {expandedBranch === branch.Id && (
                                    <div className="border-t bg-gray-400 p-4 mx-1 mb-1 rounded-b-lg space-y-4">
                                        {/* Address */}
                                        <div className="bg-white p-4 rounded-lg shadow border">
                                            <div className="bg-gray-200 rounded-xl p-3">
                                                <h3 className="font-bold text-white bg-indigo-700 p-3 rounded-xl mb-2 flex items-center gap-2">
                                                    <FaMapMarkerAlt /> Address
                                                </h3>
                                                <div className="grid grid-cols-2 p-3 bg-gray-50 rounded-xl border-2 gap-3 text-sm text-gray-700">
                                                    <span><b>Line 1:</b> {branch.AddressAddressLine1}</span>
                                                    <span><b>Line 2:</b> {branch.AddressAddressLine2}</span>
                                                    <span><b>Street:</b> {branch.AddressStreet}</span>
                                                    <span><b>Postal Code:</b> {branch.AddressPostalCode}</span>
                                                    <span><b>City:</b> {branch.AddressCity}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Company Info */}
                                        <div className="bg-white p-4 rounded-lg shadow border">
                                            <div className="bg-gray-200 rounded-xl p-3">
                                                <h3 className="font-bold text-white bg-indigo-700 p-3 rounded-xl mb-2">
                                                    Parent Company
                                                </h3>
                                                <div className="grid grid-cols-2 p-3 bg-gray-50 rounded-xl border-2 gap-3 text-sm text-gray-700">
                                                    <span><b>Company:</b> {branch.CompanyDescription}</span>
                                                    <span><b>Email:</b> {branch.CompanyAddressEmail}</span>
                                                    <span><b>City:</b> {branch.CompanyAddressCity}</span>
                                                    <span><b>Street:</b> {branch.CompanyAddressStreet}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500 text-center mt-4">
                        <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
                        <p className="font-medium text-gray-400">
                            {searchQuery || companyFilter !== "all"
                                ? "No branches match your search criteria."
                                : "No Branches Found."}
                        </p>
                        {(searchQuery || companyFilter !== "all") && (
                            <Button
                                variant="outline"
                                className="mt-2"
                                onClick={clearFilters}
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Drawers */}
            <AddBranch
                open={openBranch}
                onClose={() => setOpenBranch(false)}
                refresh={fetchBranches}
            />

            <EditBranch
                open={openEdit}
                onClose={() => setOpenEdit(false)}
                data={selectedBranch}
                refresh={fetchBranches}
            />
        </div>
    );
}