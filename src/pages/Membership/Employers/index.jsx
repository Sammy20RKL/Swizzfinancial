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

import AddEmployer from "./AddEmployer";
import EditEmployer from "./EditEmployer";

export default function Employers() {
    const [employers, setEmployers] = useState([]);
    const [filteredEmployers, setFilteredEmployers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedEmployer, setExpandedEmployer] = useState(null);
    const [openAdd, setOpenAdd] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [selectedEmployer, setSelectedEmployer] = useState(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchEmployers();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [employers, searchQuery, statusFilter, sortBy, sortOrder]);

    const fetchEmployers = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/employers`
            );
            const json = await res.json();
            if (json.success) setEmployers(json.data);
        } catch (err) {
            console.error("Fetch Employers Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...employers];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(employer =>
                employer.Description?.toLowerCase().includes(query) ||
                employer.Code?.toLowerCase().includes(query) ||
                employer.AddressEmail?.toLowerCase().includes(query) ||
                employer.AddressMobileLine?.toLowerCase().includes(query) ||
                employer.AddressCity?.toLowerCase().includes(query) ||
                employer.AddressStreet?.toLowerCase().includes(query)
            );
        }

        // Status filter
        if (statusFilter !== "all") {
            if (statusFilter === "active") {
                filtered = filtered.filter(employer => !employer.IsLocked);
            } else if (statusFilter === "inactive") {
                filtered = filtered.filter(employer => employer.IsLocked);
            }
        }

        // Sorting
        filtered.sort((a, b) => {
            let valueA, valueB;

            switch (sortBy) {
                case "name":
                    valueA = a.Description || "";
                    valueB = b.Description || "";
                    break;
                case "code":
                    valueA = a.Code || "";
                    valueB = b.Code || "";
                    break;
                case "email":
                    valueA = a.AddressEmail || "";
                    valueB = b.AddressEmail || "";
                    break;
                case "phone":
                    valueA = a.AddressMobileLine || "";
                    valueB = b.AddressMobileLine || "";
                    break;
                case "status":
                    valueA = a.IsLocked ? 1 : 0;
                    valueB = b.IsLocked ? 1 : 0;
                    break;
                case "retirement":
                    valueA = a.RetirementAge || 0;
                    valueB = b.RetirementAge || 0;
                    break;
                default:
                    valueA = a.Description || "";
                    valueB = b.Description || "";
            }

            if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
            if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        setFilteredEmployers(filtered);
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
        setStatusFilter("all");
        setSortBy("name");
        setSortOrder("asc");
    };

    const handleDelete = async (id) => {
        Swal.fire({
            title: "Delete Employer?",
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
                        `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/employers/${id}`,
                        { method: "DELETE" }
                    );
                    if (!res.ok) throw new Error("Failed to delete employer");

                    setEmployers((prev) => prev.filter((e) => e.Id !== id));
                    Swal.fire("Deleted!", "Employer removed successfully.", "success");
                } catch (err) {
                    Swal.fire("Error", err.message, "error");
                }
            }
        });
    };

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaBuilding className="text-white" /> Employers
                    <span className="text-sm font-normal ml-2">
                        ({filteredEmployers.length} {filteredEmployers.length === 1 ? 'employer' : 'employers'})
                    </span>
                </h2>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                    onClick={() => setOpenAdd(true)}
                >
                    <FaPlus /> Add Employer
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
                            placeholder="Search employers by name, code, email, phone, city, or street..."
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
                    {(searchQuery || statusFilter !== "all") && (
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
                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status Filter
                            </label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Employers</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>
                        </div>

                        {/* Sort Options */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sort By
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {['name', 'code', 'email', 'phone', 'status', 'retirement'].map((field) => (
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

            {/* Table */}
            <div className="bg-gray-200 p-4 rounded-sm">
                <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-2">Name</span>
                    <span className="col-span-1">Code</span>
                    <span className="col-span-2">Phone</span>
                    <span className="col-span-3">Email</span>
                    <span className="col-span-1">Status</span>
                    <span className="col-span-2 text-right">Actions</span>
                </div>

                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                                {Array.from({ length: 12 }).map((__, j) => (
                                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : filteredEmployers.length > 0 ? (
                    <div className="space-y-2">
                        {filteredEmployers.map((employer) => (
                            <div key={employer.Id} className="bg-white rounded-lg shadow-lg border">
                                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                                    <span className="font-medium text-indigo-700 col-span-2">
                                        {employer.Description}
                                    </span>
                                    <span className="col-span-1">{employer.Code || "N/A"}</span>
                                    <span className="flex items-center gap-2 col-span-2">
                                        {employer.AddressMobileLine}
                                    </span>
                                    <span className="col-span-3 truncate">{employer.AddressEmail}</span>
                                    <span
                                        className={`text-sm rounded-2xl text-center flex items-center justify-center p-1 col-span-1 ${employer.IsLocked ? "text-white bg-red-600" : "text-white bg-green-600"
                                            }`}
                                    >
                                        {employer.IsLocked ? "Inactive" : "Active"}
                                    </span>

                                    {/* Expand/Collapse Button */}
                                    <div className="col-span-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-gray-700 hover:bg-gray-600 text-white"
                                            onClick={() =>
                                                setExpandedEmployer(
                                                    expandedEmployer === employer.Id ? null : employer.Id
                                                )
                                            }
                                        >
                                            {expandedEmployer === employer.Id ? (
                                                <>
                                                    <FaChevronUp /> Hide
                                                </>
                                            ) : (
                                                <>
                                                    <FaChevronDown /> View
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    {/* Actions Menu */}
                                    <div className="col-span-2 flex justify-end">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <FaEllipsisV className="h-4 w-4 text-gray-600" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-32">
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelectedEmployer(employer);
                                                        setOpenEdit(true);
                                                    }}
                                                >
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => handleDelete(employer.Id)}
                                                >
                                                    <FaTrash className="mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {expandedEmployer === employer.Id && (
                                    <div className="border-t bg-gray-200 p-2 rounded-b-lg">
                                        <div className="bg-gray-50 flex rounded-md">
                                            <p className="text-sm text-gray-700 px-6 py-2">
                                                <span className="font-medium">Address:</span> {employer.AddressAddressLine1}, {employer.AddressStreet}, {employer.AddressCity}
                                            </p>
                                            <p className="text-sm text-gray-700 px-6 py-2">
                                                <span className="font-medium">Retirement Age:</span> {employer.RetirementAge} | Retired: {employer.EnforceRetirementAge ? "Yes" : "No"}
                                            </p>
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
                            {searchQuery || statusFilter !== "all"
                                ? "No employers match your search criteria."
                                : "No Employers Found."}
                        </p>
                        {(searchQuery || statusFilter !== "all") && (
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

            {/* Add Employer Drawer */}
            <AddEmployer open={openAdd} onClose={() => setOpenAdd(false)} refresh={fetchEmployers} />

            {/* Edit Employer Drawer */}
            <EditEmployer
                open={openEdit}
                onClose={() => setOpenEdit(false)}
                data={selectedEmployer}
                refresh={fetchEmployers}
            />
        </div>
    );
}