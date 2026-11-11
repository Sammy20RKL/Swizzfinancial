import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaWallet,
    FaPlus,
    FaChevronDown,
    FaChevronUp,
    FaEllipsisV,
    FaTrash,
    FaPercentage,
    FaBalanceScale,
    FaLink,
    FaSearch,
    FaFilter,
    FaEdit,
    FaSave,
    FaTimes,
    FaUnlink,
} from "react-icons/fa";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import AddProducts from "./AddProducts";
import LinkProductDrawer from "./LinkProductDrawer";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);
    const [openDrawer, setOpenDrawer] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editMode, setEditMode] = useState({});

    //linkage product
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [linkedCompanies, setLinkedCompanies] = useState({});
    const [loadingLinks, setLoadingLinks] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [coaFilter, setCoaFilter] = useState("all");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");
    const [showFilters, setShowFilters] = useState(false);
    const [uniqueCOAs, setUniqueCOAs] = useState([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (products.length > 0) {
            const coas = [...new Set(products
                .map(product => {
                    const coa = product.ChartOfAccountName;
                    return coa ? String(coa).trim() : "";
                })
                .filter(coa => coa && coa !== "")
            )];
            setUniqueCOAs(coas);
        }
        applyFilters();
    }, [products, searchQuery, statusFilter, coaFilter, sortBy, sortOrder]);

    // Fetch linked companies for each product
    useEffect(() => {
        if (products.length > 0) {
            fetchLinkedCompaniesForAllProducts();
        }
    }, [products]);

    const fetchLinkedCompaniesForAllProducts = async () => {
        setLoadingLinks(true);
        try {
            const linksMap = {};
            for (const product of products) {
                try {
                    const res = await fetch(
                        `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/company-attached-products/by-product/${product.Id}`,
                        { headers: { "ngrok-skip-browser-warning": "true" } }
                    );
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success) {
                            linksMap[product.Id] = data.data || [];
                        } else {
                            linksMap[product.Id] = [];
                        }
                    } else {
                        linksMap[product.Id] = [];
                    }
                } catch (err) {
                    console.error(`Error fetching links for product ${product.Id}:`, err);
                    linksMap[product.Id] = [];
                }
            }
            setLinkedCompanies(linksMap);
        } catch (err) {
            console.error("Error fetching linked companies:", err);
        } finally {
            setLoadingLinks(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/savings-products`,
                { headers: { "ngrok-skip-browser-warning": "true" } }
            );

            const json = await res.json();
            setProducts(json.data || []);
        } catch (err) {
            console.error("Fetch Savings Products Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...products];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(product => {
                const description = String(product.Description || "").toLowerCase();
                const paddedCode = String(product.PaddedCode || "").toLowerCase();
                const chartOfAccountName = String(product.ChartOfAccountName || "").toLowerCase();
                const chartOfAccountAccountCode = String(product.ChartOfAccountAccountCode || "").toLowerCase();
                const chartOfAccountAccountName = String(product.ChartOfAccountAccountName || "").toLowerCase();
                
                return description.includes(query) ||
                       paddedCode.includes(query) ||
                       chartOfAccountName.includes(query) ||
                       chartOfAccountAccountCode.includes(query) ||
                       chartOfAccountAccountName.includes(query);
            });
        }

        if (statusFilter !== "all") {
            if (statusFilter === "default") {
                filtered = filtered.filter(product => product.IsDefault);
            } else if (statusFilter === "mandatory") {
                filtered = filtered.filter(product => product.IsMandatory);
            } else if (statusFilter === "locked") {
                filtered = filtered.filter(product => product.IsLocked);
            } else if (statusFilter === "active") {
                filtered = filtered.filter(product => !product.IsLocked);
            }
        }

        if (coaFilter !== "all") {
            filtered = filtered.filter(product => 
                String(product.ChartOfAccountName || "") === coaFilter
            );
        }

        filtered.sort((a, b) => {
            let valueA, valueB;

            switch (sortBy) {
                case "name":
                    valueA = String(a.Description || "").toLowerCase();
                    valueB = String(b.Description || "").toLowerCase();
                    break;
                case "code":
                    valueA = String(a.PaddedCode || "").toLowerCase();
                    valueB = String(b.PaddedCode || "").toLowerCase();
                    break;
                case "apy":
                    valueA = parseFloat(a.AnnualPercentageYield) || 0;
                    valueB = parseFloat(b.AnnualPercentageYield) || 0;
                    break;
                case "coa":
                    valueA = String(a.ChartOfAccountName || "").toLowerCase();
                    valueB = String(b.ChartOfAccountName || "").toLowerCase();
                    break;
                case "maxDeposit":
                    valueA = parseFloat(a.MaximumAllowedDeposit) || 0;
                    valueB = parseFloat(b.MaximumAllowedDeposit) || 0;
                    break;
                case "minBalance":
                    valueA = parseFloat(a.MinimumBalance) || 0;
                    valueB = parseFloat(b.MinimumBalance) || 0;
                    break;
                default:
                    valueA = String(a.Description || "").toLowerCase();
                    valueB = String(b.Description || "").toLowerCase();
            }

            if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
            if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        setFilteredProducts(filtered);
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
        setCoaFilter("all");
        setSortBy("name");
        setSortOrder("asc");
    };

    // ── EDIT FUNCTIONS ──
    const handleEdit = (product) => {
        setEditingProduct({ ...product });
        setEditMode({ [product.Id]: true });
    };

    const handleEditChange = (field, value) => {
        setEditingProduct(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveEdit = async () => {
        if (!editingProduct) return;

        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/savings-products/${editingProduct.Id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true"
                    },
                    body: JSON.stringify(editingProduct),
                }
            );

            if (!res.ok) throw new Error("Failed to update product");

            const data = await res.json();
            
            if (data.success) {
                Swal.fire({
                    icon: "success",
                    title: "Product Updated",
                    text: "Product details have been updated successfully.",
                    confirmButtonColor: "#4f46e5",
                });
                
                setProducts(prev => prev.map(p => 
                    p.Id === editingProduct.Id ? editingProduct : p
                ));
                setEditMode({});
                setEditingProduct(null);
                await fetchProducts();
            } else {
                throw new Error(data.message || "Update failed");
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Update Failed",
                text: error.message,
                confirmButtonColor: "#4f46e5",
            });
        }
    };

    const handleCancelEdit = () => {
        setEditMode({});
        setEditingProduct(null);
    };

    // ── LINKAGE FUNCTIONS ──
    const openLinkageDrawer = (p) => {
        setSelectedProduct(p);
        setDrawerOpen(true);
    };

    // ── REMOVE LINK FUNCTION ──
    const handleRemoveLink = async (productId, linkId) => {
        const result = await Swal.fire({
            title: "Remove Link?",
            text: "This will remove the company link from this product.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Remove Link",
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/company-attached-products/${linkId}`,
                    {
                        method: "DELETE",
                        headers: { 
                            "ngrok-skip-browser-warning": "true",
                            "Content-Type": "application/json"
                        }
                    }
                );

                if (!res.ok) throw new Error("Failed to remove link");

                await fetchLinkedCompaniesForAllProducts();
                
                Swal.fire({
                    icon: "success",
                    title: "Link Removed",
                    text: "Company link has been removed successfully.",
                    confirmButtonColor: "#4f46e5",
                });
            } catch (error) {
                Swal.fire({
                    icon: "error",
                    title: "Remove Failed",
                    text: error.message,
                    confirmButtonColor: "#4f46e5",
                });
            }
        }
    };

    // ── RENDER ──
    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaWallet className="text-white" /> Savings Products
                    <span className="text-sm font-normal ml-2">
                        ({filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'})
                    </span>
                </h2>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                    onClick={() => setOpenDrawer(true)}
                >
                    <FaPlus /> Add Product
                </Button>
            </div>

            {/* Search and Filter Bar */}
            <div className="mb-6 bg-gray-100 p-4 rounded-lg">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search products by name, code, COA name, or account code..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>

                    <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FaFilter />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </Button>

                    {(searchQuery || statusFilter !== "all" || coaFilter !== "all") && (
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status Filter
                            </label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Products</option>
                                <option value="default">Default Products</option>
                                <option value="mandatory">Mandatory Products</option>
                                <option value="locked">Locked Products</option>
                                <option value="active">Active Products</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Chart of Account
                            </label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={coaFilter}
                                onChange={(e) => setCoaFilter(e.target.value)}
                            >
                                <option value="all">All COAs</option>
                                {uniqueCOAs.map((coa, index) => (
                                    <option key={index} value={coa}>
                                        {coa.length > 40 ? `${coa.substring(0, 40)}...` : coa}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sort By
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {['name', 'code', 'apy', 'coa', 'maxDeposit', 'minBalance'].map((field) => (
                                    <Button
                                        key={field}
                                        size="sm"
                                        variant={sortBy === field ? "default" : "outline"}
                                        className="capitalize"
                                        onClick={() => handleSort(field)}
                                    >
                                        {field === 'apy' ? 'APY' : 
                                         field === 'maxDeposit' ? 'Max Deposit' :
                                         field === 'minBalance' ? 'Min Balance' :
                                         field === 'coa' ? 'COA' : field}
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
                <div className="grid grid-cols-14 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-3">Description</span>
                    <span className="col-span-2">Code</span>
                    <span className="col-span-3">COA</span>
                    <span className="col-span-2">APY</span>
                    <span className="col-span-2">Linked Companies</span>
                    <span className="col-span-2 text-right">Actions</span>
                </div>

                {/* Loading State */}
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
                ) : filteredProducts.length > 0 ? (
                    <div className="space-y-2">
                        {filteredProducts.map((p) => {
                            const isEditing = editMode[p.Id];
                            const productLinks = linkedCompanies[p.Id] || [];
                            
                            return (
                                <div key={p.Id} className="bg-white rounded-lg shadow-lg border">
                                    {/* Main Row */}
                                    <div className="grid grid-cols-14 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                                        {isEditing ? (
                                            // Edit Mode
                                            <>
                                                <div className="col-span-3">
                                                    <input
                                                        type="text"
                                                        className="w-full p-1 border rounded"
                                                        value={editingProduct?.Description || ""}
                                                        onChange={(e) => handleEditChange("Description", e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <input
                                                        type="text"
                                                        className="w-full p-1 border rounded"
                                                        value={editingProduct?.PaddedCode || ""}
                                                        onChange={(e) => handleEditChange("PaddedCode", e.target.value)}
                                                        disabled
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <input
                                                        type="text"
                                                        className="w-full p-1 border rounded"
                                                        value={editingProduct?.ChartOfAccountName || ""}
                                                        onChange={(e) => handleEditChange("ChartOfAccountName", e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <input
                                                        type="number"
                                                        className="w-full p-1 border rounded"
                                                        value={editingProduct?.AnnualPercentageYield || 0}
                                                        onChange={(e) => handleEditChange("AnnualPercentageYield", parseFloat(e.target.value))}
                                                        step="0.01"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-sm text-gray-500">
                                                        {productLinks.length} linked
                                                    </span>
                                                </div>
                                                <div className="col-span-2 flex justify-end gap-1">
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                        onClick={handleSaveEdit}
                                                    >
                                                        <FaSave />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 border-red-600 hover:bg-red-50"
                                                        onClick={handleCancelEdit}
                                                    >
                                                        <FaTimes />
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            // View Mode
                                            <>
                                                <span className="font-medium text-indigo-700 col-span-3">
                                                    {p.Description || "N/A"}
                                                </span>

                                                <span className="col-span-2">{p.PaddedCode || "N/A"}</span>

                                                <span className="col-span-3 truncate" title={p.ChartOfAccountName || ""}>
                                                    {p.ChartOfAccountName && p.ChartOfAccountName.length > 40 
                                                        ? `${String(p.ChartOfAccountName).substring(0, 40)}...` 
                                                        : String(p.ChartOfAccountName || "N/A")}
                                                </span>

                                                <span className="col-span-2 flex gap-1 items-center">
                                                    {p.AnnualPercentageYield || 0}%
                                                </span>

                                                <span className="col-span-2 text-sm">
                                                    {productLinks.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">
                                                                {productLinks.length} company(ies)
                                                            </span>
                                                            {productLinks.length <= 2 && productLinks.map((link) => (
                                                                <button
                                                                    key={link.id || link.Id}
                                                                    className="text-xs text-red-500 hover:text-red-700 ml-1"
                                                                    onClick={() => handleRemoveLink(p.Id, link.id || link.Id)}
                                                                    title="Remove link"
                                                                >
                                                                    <FaUnlink className="h-3 w-3" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">No links</span>
                                                    )}
                                                </span>

                                                {/* Actions */}
                                                <div className="col-span-2 flex justify-end items-center gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                                        onClick={() => openLinkageDrawer(p)}
                                                    >
                                                        <FaLink />
                                                    </Button>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <FaEllipsisV className="h-4 w-4 text-gray-600" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-32">
                                                            <DropdownMenuItem onClick={() => handleEdit(p)}>
                                                                <FaEdit className="mr-2" /> Edit
                                                            </DropdownMenuItem>
                                                            {/* DELETE OPTION REMOVED */}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Expanded Section */}
                                    {expanded === p.Id && !isEditing && (
                                        <div className="border-t bg-gray-400 p-4 mx-1 mb-1 rounded-b-lg space-y-4">
                                            {/* Basic Details */}
                                            <div className="bg-white p-4 rounded-lg shadow border">
                                                <h3 className="font-bold text-white bg-indigo-700 p-3 rounded-xl mb-2 flex items-center gap-2">
                                                    Product Details
                                                </h3>

                                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border text-sm">
                                                    <span><b>Max Deposit:</b> {p.MaximumAllowedDeposit || "N/A"}</span>
                                                    <span><b>Max Withdrawal:</b> {p.MaximumAllowedWithdrawal || "N/A"}</span>
                                                    <span><b>Min Balance:</b> {p.MinimumBalance || "N/A"}</span>
                                                    <span><b>Operating Balance:</b> {p.OperatingBalance || "N/A"}</span>
                                                    <span><b>Notice Amount:</b> {p.WithdrawalNoticeAmount || "N/A"}</span>
                                                    <span><b>Notice Period:</b> {p.WithdrawalNoticePeriod || "N/A"} days</span>
                                                    <span><b>Interval:</b> {p.WithdrawalInterval || "N/A"} days</span>
                                                </div>
                                            </div>

                                            {/* Account Mapping */}
                                            <div className="bg-white p-4 rounded-lg shadow border">
                                                <h3 className="font-bold text-white bg-indigo-700 p-3 rounded-xl mb-2 flex items-center gap-2">
                                                    Chart of Accounts
                                                </h3>

                                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border text-sm">
                                                    <span><b>Account Code:</b> {p.ChartOfAccountAccountCode || "N/A"}</span>
                                                    <span><b>Account Name:</b> {p.ChartOfAccountAccountName || "N/A"}</span>
                                                    <span><b>Full COA:</b> {p.ChartOfAccountName || "N/A"}</span>
                                                    <span><b>Type:</b> {p.ChartOfAccountAccountType || "N/A"}</span>
                                                </div>
                                            </div>

                                            {/* Settings */}
                                            <div className="bg-white p-4 rounded-lg shadow border">
                                                <h3 className="font-bold text-white bg-indigo-700 p-3 rounded-xl mb-2 flex items-center gap-2">
                                                    Settings
                                                </h3>

                                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border text-sm">
                                                    <span><b>Default:</b> {p.IsDefault ? "Yes" : "No"}</span>
                                                    <span><b>Mandatory:</b> {p.IsMandatory ? "Yes" : "No"}</span>
                                                    <span><b>Locked:</b> {p.IsLocked ? "Yes" : "No"}</span>
                                                    <span><b>Auto Fee:</b> {p.AutomateLedgerFeeCalculation ? "On" : "Off"}</span>
                                                    <span><b>Throttle OTC:</b> {p.ThrottleOverTheCounterWithdrawals ? "Yes" : "No"}</span>
                                                    <span><b>Charge Type:</b> {p.ChargeTypeDescription || "N/A"}</span>
                                                </div>
                                            </div>

                                            {/* Linked Companies */}
                                            <div className="bg-white p-4 rounded-lg shadow border">
                                                <h3 className="font-bold text-white bg-indigo-700 p-3 rounded-xl mb-2 flex items-center gap-2">
                                                    <FaLink /> Linked Companies
                                                    <Button
                                                        size="sm"
                                                        className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white"
                                                        onClick={() => openLinkageDrawer(p)}
                                                    >
                                                        <FaPlus className="mr-1" /> Add Link
                                                    </Button>
                                                </h3>

                                                <div className="bg-gray-50 p-4 rounded-xl border">
                                                    {productLinks.length === 0 ? (
                                                        <p className="text-gray-400 text-center py-4">
                                                            No companies linked to this product
                                                        </p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {productLinks.map((link) => (
                                                                <div key={link.id || link.Id} className="flex justify-between items-center bg-white p-2 rounded-lg border">
                                                                    <span>{link.Company?.Description || "Unknown Company"}</span>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                        onClick={() => handleRemoveLink(p.Id, link.id || link.Id)}
                                                                    >
                                                                        <FaUnlink className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
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
                        <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
                        <p className="font-medium text-gray-400">
                            {searchQuery || statusFilter !== "all" || coaFilter !== "all" 
                                ? "No products match your search criteria." 
                                : "No Savings Products Found."}
                        </p>
                        {(searchQuery || statusFilter !== "all" || coaFilter !== "all") && (
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
            
            {/* ADD PRODUCT DRAWER*/}
            <AddProducts
                open={openDrawer}
                onClose={() => setOpenDrawer(false)}
                refresh={fetchProducts}
            />
            
            {/* Linkage Drawer */}
            <LinkProductDrawer
                open={drawerOpen}
                product={selectedProduct}
                onClose={() => {
                    setDrawerOpen(false);
                    setSelectedProduct(null);
                    if (products.length > 0) {
                        fetchLinkedCompaniesForAllProducts();
                    }
                }}
                onSuccess={() => {
                    fetchLinkedCompaniesForAllProducts();
                    fetchProducts();
                }}
            />
        </div>
    );
}