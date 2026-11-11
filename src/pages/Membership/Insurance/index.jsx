import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaBuilding,
    FaPhone,
    FaEnvelope,
    FaChevronDown,
    FaChevronUp,
    FaMapMarkerAlt,
    FaSearch,
    FaPlus,
} from "react-icons/fa";

import NotFoundImage from "/assets/scopefinding.png";
import AddInsurance from "./AddInsurance/AddInsurance";
import EditInsurance from "./EditInsurance/EditInsurance";

export default function Insurance() {
    const [insurance, setInsurance] = useState([]);
    const [filteredInsurance, setFilteredInsurance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [openBranch, setOpenBranch] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [selectedInsurance, setSelectedInsurance] = useState(null);


    useEffect(() => {
        fetchInsurance();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [insurance, searchQuery]);

    const fetchInsurance = async () => {
        try {
            const res = await fetch(
                "http://95.216.225.26:8006/api/MemberExit/GetAllInsuarance"
            );
            const json = await res.json();
            setInsurance(json.Data || []);
        } catch (error) {
            console.error("Fetch Insurance Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...insurance];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.Description?.toLowerCase().includes(q) ||
                item.AddressEmail?.toLowerCase().includes(q) ||
                item.AddressMobileLine?.toLowerCase().includes(q) ||
                item.AddressCity?.toLowerCase().includes(q) ||
                item.ChartOfAccountAccountName?.toLowerCase().includes(q)
            );
        }

        setFilteredInsurance(filtered);
    };

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaBuilding /> Insurance Companies
                    <span className="text-sm font-normal ml-2">
                        ({filteredInsurance.length})
                    </span>
                </h2>
                <Button
                    onClick={() => setOpenBranch(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                >
                    <FaPlus /> Add Insurance Company
                </Button>
            </div>

            {/* Search */}
            <div className="mb-6 bg-gray-100 p-4 rounded-lg">
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by insurance name, email, phone, city, or account..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-gray-200 rounded-2xl p-4">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 bg-gray-700 text-white font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-3">Insurance</span>
                    <span className="col-span-2">Email</span>
                    <span className="col-span-2">Phone</span>
                    <span className="col-span-2">Account</span>
                    <span className="col-span-2 text-right">Details</span>
                </div>

                {/* Content */}
                {loading ? (
                    <p className="text-center text-gray-500">Loading insurance companies...</p>
                ) : filteredInsurance.length > 0 ? (
                    <div className="space-y-3">
                        {filteredInsurance.map((item) => (
                            <div key={item.Id} className="bg-white border rounded-lg shadow">
                                {/* Main Row */}
                                <div className="grid grid-cols-12 gap-4 items-center px-6 py-4">
                                    <span className="col-span-3 font-semibold text-indigo-700">
                                        {item.Description}
                                    </span>

                                    <span className="col-span-2 truncate">
                                        {item.AddressEmail}
                                    </span>

                                    <span className="col-span-2">
                                        {item.AddressMobileLine}
                                    </span>

                                    <span className="col-span-2 text-sm text-gray-600 truncate">
                                        {item.ChartOfAccountAccountName}
                                    </span>

                                    <div className="col-span-3 flex items-center gap-3 text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-gray-600 hover:bg-gray-800 text-white hover:text-white"
                                            onClick={() => {
                                                setSelectedInsurance(item);
                                                setOpenEdit(true);
                                            }}
                                        >
                                            Edit Insurance
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-gray-600 hover:bg-gray-800 text-white hover:text-white"
                                            onClick={() =>
                                                setExpandedRow(
                                                    expandedRow === item.Id ? null : item.Id
                                                )
                                            }
                                        >
                                            {expandedRow === item.Id ? (
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
                                </div>

                                {/* Expanded Section */}
                                {expandedRow === item.Id && (
                                    <div className="bg-gray-300 border-t p-4 space-y-4 border-2 border-gray-50 rounded-lg">
                                        {/* Address */}
                                        <div className="bg-white p-4 rounded-lg shadow">
                                            <h3 className="font-bold text-indigo-700 mb-2 flex items-center gap-2">
                                                <FaMapMarkerAlt /> Address
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <span><b>Line 1:</b> {item.AddressAddressLine1}</span>
                                                <span><b>Line 2:</b> {item.AddressAddressLine2}</span>
                                                <span><b>Street:</b> {item.AddressStreet}</span>
                                                <span><b>Postal Code:</b> {item.AddressPostalCode}</span>
                                                <span><b>City:</b> {item.AddressCity}</span>
                                            </div>
                                        </div>

                                        {/* Account Info */}
                                        <div className="bg-white p-4 rounded shadow">
                                            <h3 className="font-bold text-indigo-700 mb-2">
                                                Chart of Account
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <span><b>Account Code:</b> {item.ChartOfAccountAccountCode}</span>
                                                <span><b>Account Type:</b> {item.ChartOfAccountAccountType}</span>
                                                <span><b>Account Name:</b> {item.ChartOfAccountAccountName}</span>
                                                <span><b>Locked:</b> {item.IsLocked ? "Yes" : "No"}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 mt-6">
                        <img src={NotFoundImage} className="mx-auto w-40" />
                        <p>No Insurance Companies Found</p>
                    </div>
                )}
            </div>
            <AddInsurance
                open={openBranch}
                onClose={() => setOpenBranch(false)}
                refresh={fetchInsurance}
            />
            <EditInsurance
                open={openEdit}
                onClose={() => setOpenEdit(false)}
                data={selectedInsurance}
                refresh={fetchInsurance}
            />

        </div>
    );
}
