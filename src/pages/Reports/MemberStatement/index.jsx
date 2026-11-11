import React, { useState, useEffect, useMemo } from "react";
import {
    FaSearch,
    FaCalendarAlt,
    FaUser,
    FaDownload,
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
//import { downloadMemberStatement } from "./downloadMemberStatement"; // optional extract
import MemberStatementPreviewModal from "./MemberStatementPreviewModal";




// ===== Fetch Customers =====
const fetchCustomers = async () => {
    try {
        const response = await fetch(`${import.meta.env.VITE_APP_REPORT_URL}/api/Customers`);
        const result = await response.json();

        console.log("Fetch customers result:", result);

        if (result.success && Array.isArray(result.data)) {
            return result.data.map((c) => ({
                id: c.Id,
                name: `${c.IndividualFirstName || ""} ${c.IndividualLastName || ""}`.trim(),
                serialNumber: c.PaddedSerialNumber,
                idNumber: c.IndividualIdentityCardNumber,
                phone: c.AddressMobileLine,
                email: c.AddressEmail,
            }));
        }
        return [];
    } catch (error) {
        console.error("Fetch customers error:", error);
        return [];
    }
};

export default function MemberStatementPage() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [startDate, setStartDate] = useState(new Date("2024-01-01"));
    const [endDate, setEndDate] = useState(new Date());

    const [previewOpen, setPreviewOpen] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetchCustomers().then((data) => {
            setCustomers(data);
            setLoading(false);
        });
    }, []);

    const filteredCustomers = useMemo(() => {
        if (!searchTerm.trim()) return customers;
        const term = searchTerm.toLowerCase();
        return customers.filter(
            (c) =>
                c.name.toLowerCase().includes(term) ||
                c.serialNumber?.toLowerCase().includes(term) ||
                c.idNumber?.toLowerCase().includes(term) ||
                c.phone?.toLowerCase().includes(term)
        );
    }, [customers, searchTerm]);

    const handleGenerate = async () => {
        if (!selectedCustomer) {
            alert("Please select a member");
            return;
        }
        await downloadMemberStatement(
            selectedCustomer.id,
            startDate,
            endDate
        );
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen m-8 rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="bg-indigo-700 text-white px-6 py-4 rounded-xl mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <FaUser /> Member Statement
                </h2>
                <p className="text-indigo-200 text-sm">
                    Select a member and date range to generate statement
                </p>
            </div>

            <div className="bg-gray-200 rounded-2xl p-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-4 items-end">

                    {/* Search */}
                    <div className="flex-1">
                        <label className="text-sm font-medium mb-1 block">
                            Search Member
                        </label>
                        <input
                            className="w-full px-4 py-3 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                            placeholder="Search by name, serial, ID or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Start Date */}
                    <div className="w-full sm:w-48">
                        <label className="text-sm font-medium mb-1 block">
                            Start Date
                        </label>
                        <DatePicker
                            selected={startDate}
                            onChange={setStartDate}
                            className="w-full border px-3 py-2 rounded-lg bg-white"
                            dateFormat="yyyy-MM-dd"
                        />
                    </div>

                    {/* End Date */}
                    <div className="w-full sm:w-48">
                        <label className="text-sm font-medium mb-1 block">
                            End Date
                        </label>
                        <DatePicker
                            selected={endDate}
                            onChange={setEndDate}
                            className="w-full border px-3 py-2 rounded-lg bg-white"
                            dateFormat="yyyy-MM-dd"
                        />
                    </div>

                </div>
            </div>


            {/* Customers */}
            <div className=" rounded-xl border p-4 mb-6 max-h-96 overflow-y-auto bg-gray-300">
                {loading ? (
                    <p className="text-center py-6">Loading members...</p>
                ) : filteredCustomers.length === 0 ? (
                    <p className="text-center py-6 text-gray-500">
                        No members found
                    </p>
                ) : (
                    filteredCustomers.map((c) => (
                        <div
                            key={c.id}
                            onClick={() => {
                                setSelectedCustomer(c);
                                setPreviewOpen(true);
                            }}

                            className={`p-3 rounded-lg cursor-pointer mb-2 border-2 transition text-gray-600 flex justify-between ${selectedCustomer?.id === c.id
                                ? "bg-gray-100 border-indigo-500"
                                : "hover:border-indigo-600 bg-white"
                                }`}
                        >
                            <div>
                                <p className="font-medium">{c.name}</p>
                                <p className="text-sm text-gray-60">
                                    Serial: {c.serialNumber} | ID: {c.idNumber}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {c.phone} • {c.email}
                                </p>
                            </div>
                            <div>
                                {selectedCustomer?.id === c.id && (
                                    <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded">
                                        Selected
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>


            <MemberStatementPreviewModal
                isOpen={previewOpen}
                onClose={() => setPreviewOpen(false)}
                member={selectedCustomer}
                startDate={startDate}
                endDate={endDate}
            />

        </div>
    );
}
