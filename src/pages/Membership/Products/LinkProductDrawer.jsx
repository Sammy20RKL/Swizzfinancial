import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus, CheckCircle2, Loader2, Check, Square } from "lucide-react";
import Swal from "sweetalert2";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

const API_URL = import.meta.env.VITE_APP_MEMBERSHIP_URL;

// Helper function with ngrok header
const fetchWithNgrok = (url, options = {}) => {
    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            "ngrok-skip-browser-warning": "true",
            "Content-Type": "application/json",
        },
    });
};

export default function LinkProductDrawer({ open, onClose, product, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState("");
    const [productType, setProductType] = useState("1");
    const [selectedCompanies, setSelectedCompanies] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [existingLinks, setExistingLinks] = useState([]);
    const [loadingLinks, setLoadingLinks] = useState(false);
    const [error, setError] = useState(null);
    const [companyMap, setCompanyMap] = useState({});
    const [selectAll, setSelectAll] = useState(false);

    // Fetch companies
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await fetchWithNgrok(`${API_URL}/api/companies`);
                const data = await res.json();
                if (data.success) {
                    setCompanies(data.data);
                    // Create a map for quick lookup
                    const map = {};
                    data.data.forEach(company => {
                        map[company.Id] = company.Description;
                    });
                    setCompanyMap(map);
                }
            } catch (err) {
                console.error("Failed to fetch companies", err);
                setError("Failed to load companies");
            }
        };
        if (open) {
            fetchCompanies();
        }
    }, [open]);

    // Fetch existing links for this product
    useEffect(() => {
        if (open && product && product.Id) {
            fetchExistingLinks();
        } else if (open && product) {
            console.warn("Product ID is missing:", product);
            setError("Product ID is missing. Please refresh and try again.");
        }
    }, [open, product]);

    const fetchExistingLinks = async () => {
        setLoadingLinks(true);
        setError(null);
        try {
            const endpoint = `${API_URL}/api/company-attached-products/by-product/${product.Id}`;
            console.log("Fetching existing links from:", endpoint);
            
            const res = await fetchWithNgrok(endpoint);
            
            if (res.ok) {
                const data = await res.json();
                console.log("Existing links response:", data);
                if (data.success) {
                    const links = data.data || [];
                    setExistingLinks(links);
                    // Extract company IDs that are already linked
                    const linkedCompanyIds = links.map(link => link.companyId);
                    setSelectedCompanies(linkedCompanyIds);
                    console.log(`Found ${links.length} existing links for product ${product.Id}`);
                } else {
                    setExistingLinks([]);
                    setSelectedCompanies([]);
                }
            } else {
                console.warn(`Failed to fetch links: ${res.status}`);
                setExistingLinks([]);
                setSelectedCompanies([]);
            }
        } catch (err) {
            console.error("Failed to fetch existing links", err);
            setExistingLinks([]);
            setSelectedCompanies([]);
        } finally {
            setLoadingLinks(false);
        }
    };

    if (!open || !product) return null;

    // Get available companies (not yet linked)
    const availableCompanies = companies.filter(
        company => !selectedCompanies.includes(company.Id)
    );

    // Get company name from the map
    const getCompanyName = (id) => {
        return companyMap[id] || "Unknown Company";
    };

    const handleAddCompany = () => {
        if (!selectedCompanyId) {
            Swal.fire("Missing Field", "Please select a company", "warning");
            return;
        }

        if (selectedCompanies.includes(selectedCompanyId)) {
            Swal.fire("Already Added", "This company is already linked", "info");
            return;
        }

        setSelectedCompanies([...selectedCompanies, selectedCompanyId]);
        setSelectedCompanyId("");
        setSelectAll(false);
    };

    const handleRemoveCompany = (companyId) => {
        setSelectedCompanies(selectedCompanies.filter(id => id !== companyId));
        setSelectAll(false);
    };

    // Handle Select All
    const handleSelectAll = () => {
        if (selectAll) {
            // Deselect all - keep only already linked ones
            const linkedIds = existingLinks.map(link => link.companyId);
            setSelectedCompanies(linkedIds);
        } else {
            // Select all companies
            const allCompanyIds = companies.map(c => c.Id);
            setSelectedCompanies(allCompanyIds);
        }
        setSelectAll(!selectAll);
    };

    const handleSubmit = async () => {
        if (selectedCompanies.length === 0) {
            Swal.fire("Missing Field", "Please add at least one company", "warning");
            return;
        }

        if (!product || !product.Id) {
            Swal.fire("Error", "Product ID is missing. Please refresh and try again.", "error");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // First, get existing links to avoid duplicates
            const existingRes = await fetchWithNgrok(
                `${API_URL}/api/company-attached-products/by-product/${product.Id}`
            );
            
            let existingCompanyIds = [];
            if (existingRes.ok) {
                const existingData = await existingRes.json();
                if (existingData.success) {
                    existingCompanyIds = (existingData.data || []).map(link => link.companyId);
                }
            }

            // Filter out companies that are already linked
            const newCompanyIds = selectedCompanies.filter(id => !existingCompanyIds.includes(id));

            if (newCompanyIds.length === 0) {
                Swal.fire({
                    icon: "info",
                    title: "No New Companies",
                    text: "All selected companies are already linked to this product.",
                    confirmButtonColor: "#4f46e5",
                });
                setLoading(false);
                return;
            }

            // Create links for new companies only
            const payloads = newCompanyIds.map(companyId => ({
                companyId,
                productCode: Number(productType),
                targetProductId: product.Id,
                createdDate: new Date().toISOString(),
                createdBy: "SYSTEM",
            }));

            console.log(`Linking ${newCompanyIds.length} new companies:`, payloads);

            const promises = payloads.map(payload =>
                fetchWithNgrok(`${API_URL}/api/company-attached-products`, {
                    method: "POST",
                    body: JSON.stringify(payload),
                })
            );

            const responses = await Promise.all(promises);
            
            const successCount = responses.filter(res => res.ok).length;
            const conflictCount = responses.filter(res => res.status === 409).length;
            const otherFailures = responses.filter(res => !res.ok && res.status !== 409).length;

            let message = "";
            let icon = "success";
            let title = "Success!";

            if (successCount > 0) {
                message = `Successfully linked ${successCount} new company(ies)`;
                if (conflictCount > 0) {
                    message += `, ${conflictCount} already existed`;
                    icon = "warning";
                }
                if (otherFailures > 0) {
                    message += `, ${otherFailures} failed`;
                    icon = "warning";
                }
                if (successCount === newCompanyIds.length && conflictCount === 0 && otherFailures === 0) {
                    icon = "success";
                    title = "Success!";
                }
            } else if (conflictCount > 0) {
                message = `All ${conflictCount} selected company(ies) are already linked to this product.`;
                icon = "info";
                title = "Already Linked";
            } else {
                throw new Error("Failed to link products");
            }

            await Swal.fire({
                icon: icon,
                title: title,
                text: message,
                confirmButtonColor: "#4f46e5",
            });

            if (successCount > 0) {
                if (onSuccess) onSuccess();
                // Refresh existing links
                await fetchExistingLinks();
            }
        } catch (err) {
            console.error("Submit Error:", err);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: err.message || "Failed to link product",
                confirmButtonColor: "#4f46e5",
            });
        } finally {
            setLoading(false);
        }
    };

    // Get the list of companies to display in the "Companies to Link" section
    const companiesToDisplay = selectedCompanies.map(companyId => {
        const isExisting = existingLinks.some(link => link.companyId === companyId);
        return {
            id: companyId,
            name: getCompanyName(companyId),
            isExisting: isExisting
        };
    });

    return (
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
                        className="fixed top-3 right-3 w-[80vw] max-w-[600px] bg-white shadow-2xl z-50 flex flex-col rounded-2xl"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        <div className="bg-gray-200 m-2 rounded-xl">
                            <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
                                <div>
                                    <h2 className="font-bold text-xl text-white">
                                        Link Product to Companies
                                    </h2>
                                    <p className="text-indigo-200 text-sm mt-1">
                                        {product.Description || "Product"}
                                    </p>
                                    {product.Id && (
                                        <p className="text-indigo-300 text-xs mt-0.5">
                                            ID: {product.Id.substring(0, 8)}...
                                        </p>
                                    )}
                                </div>
                                <Button variant="outline" size="sm" onClick={onClose}>
                                    Close
                                </Button>
                            </div>

                            <div className="p-5 overflow-y-auto max-h-[70vh] bg-gray-50 rounded-xl m-3">
                                {error ? (
                                    <div className="text-center py-8 text-red-500">
                                        <p>{error}</p>
                                        <Button 
                                            variant="outline" 
                                            className="mt-4"
                                            onClick={fetchExistingLinks}
                                        >
                                            Retry
                                        </Button>
                                    </div>
                                ) : loadingLinks ? (
                                    <div className="text-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                                        <p className="mt-2 text-gray-500">Loading existing links...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Product Type */}
                                        <div>
                                            <Label>Product Type</Label>
                                            <Select
                                                value={productType}
                                                onValueChange={(val) => setProductType(val)}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Select Product Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">Savings</SelectItem>
                                                    <SelectItem value="2">Loan</SelectItem>
                                                    <SelectItem value="3">Investment</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Existing Links */}
                                        {existingLinks.length > 0 && (
                                            <div>
                                                <Label className="text-gray-500 text-sm">Currently Linked Companies ({existingLinks.length})</Label>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {existingLinks.map((link) => (
                                                        <Badge key={link.id || link.Id} variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            {link.Company?.Description || getCompanyName(link.companyId)}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Add Company Section */}
                                        <div>
                                            <Label>Add Company</Label>
                                            <div className="flex gap-2 mt-1">
                                                <Select
                                                    onValueChange={(value) => setSelectedCompanyId(value)}
                                                    value={selectedCompanyId}
                                                >
                                                    <SelectTrigger className="flex-1">
                                                        <SelectValue placeholder={availableCompanies.length > 0 ? "Select company to add" : "All companies linked"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableCompanies.length === 0 ? (
                                                            <div className="px-3 py-2 text-sm text-gray-500">
                                                                All companies are already linked
                                                            </div>
                                                        ) : (
                                                            availableCompanies.map((c) => (
                                                                <SelectItem key={c.Id} value={c.Id}>
                                                                    {c.Description}
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <Button 
                                                    onClick={handleAddCompany}
                                                    disabled={!selectedCompanyId || availableCompanies.length === 0}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Selected Companies List with Select All */}
                                        {selectedCompanies.length > 0 && (
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <Label className="text-gray-500 text-sm">
                                                        Companies to Link ({selectedCompanies.length})
                                                    </Label>
                                                    {companies.length > 0 && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleSelectAll}
                                                            className="flex items-center gap-1 text-xs"
                                                        >
                                                            {selectAll ? (
                                                                <>
                                                                    <Square className="h-3 w-3" />
                                                                    Deselect All
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Check className="h-3 w-3" />
                                                                    Select All
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg border max-h-48 overflow-y-auto">
                                                    {selectedCompanies.map((companyId) => {
                                                        const isExisting = existingLinks.some(link => link.companyId === companyId);
                                                        const companyName = getCompanyName(companyId);
                                                        return (
                                                            <Badge 
                                                                key={companyId} 
                                                                variant="secondary" 
                                                                className={`pr-1 ${isExisting ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-indigo-100 text-indigo-700 border-indigo-300'}`}
                                                            >
                                                                {companyName}
                                                                {isExisting && (
                                                                    <span className="ml-1 text-xs text-gray-400">(linked)</span>
                                                                )}
                                                                {!isExisting && (
                                                                    <span className="ml-1 text-xs text-green-500">(new)</span>
                                                                )}
                                                                <button
                                                                    onClick={() => handleRemoveCompany(companyId)}
                                                                    className="ml-1 hover:text-red-600 transition-colors"
                                                                    type="button"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>
                                                {availableCompanies.length === 0 && selectedCompanies.length > 0 && (
                                                    <p className="text-xs text-green-600 mt-1">
                                                        ✓ All companies are selected
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!loadingLinks && !error && (
                                    <div className="flex justify-end mt-8 space-x-2">
                                        <Button 
                                            onClick={handleSubmit} 
                                            disabled={loading || selectedCompanies.length === 0}
                                            className="bg-indigo-700 hover:bg-indigo-800"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    Linking...
                                                </>
                                            ) : (
                                                `Link ${selectedCompanies.length} Company(ies)`
                                            )}
                                        </Button>
                                        <Button variant="outline" onClick={onClose}>
                                            Cancel
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}