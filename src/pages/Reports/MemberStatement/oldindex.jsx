import React, { useState, useEffect, useMemo } from "react";
import {
    FaFileExcel,
    FaFilePdf,
    FaFileWord,
    FaDownload,
    FaSearch,
    FaCalendarAlt,
    FaUser
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Updated reports array with only the Member Statement Report
const reports = [
    {
        id: 1,
        name: "Member Statement Report",
        type: "pdf",
        size: "Varies",
        date: new Date().toLocaleDateString('en-GB'),
        api: "memberStatement",
    },
];

const fileIcon = (type) => {
    switch (type) {
        case "excel":
            return <FaFileExcel className="text-green-600 text-4xl" />;
        case "pdf":
            return <FaFilePdf className="text-red-600 text-4xl" />;
        case "doc":
            return <FaFileWord className="text-blue-600 text-4xl" />;
        default:
            return null;
    }
};

// ===== Member Statement Download Function =====
const downloadMemberStatement = async (customerId, startDate, endDate) => {
    try {
        // Format dates to YYYY-MM-DD
        const formatDate = (date) => {
            return date.toISOString().split('T')[0];
        };

        const startDateStr = formatDate(startDate);
        const endDateStr = formatDate(endDate);

        // Build the URL with parameters
        const url = `https://localhost:44327/api/values/GetMemberStatement/${customerId}?startDate=${startDateStr}&endDate=${endDateStr}&downloadPdf=true`;

        console.log("Fetching member statement from:", url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/pdf',
                'ngrok-skip-browser-warning': 'true'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get the PDF blob
        const pdfBlob = await response.blob();
        
        // Create filename with member name and date range
        const filename = `Member_Statement_${customerId}_${startDateStr}_to_${endDateStr}.pdf`;
        
        // Save the file
        saveAs(pdfBlob, filename);
        
        return true;
    } catch (error) {
        console.error("Error downloading member statement:", error);
        alert(`Failed to download member statement: ${error.message}`);
        return false;
    }
};

// ===== Fetch Customers Function =====
const fetchCustomers = async () => {
    try {
        const response = await fetch("http://95.216.225.26:8006/api/Customers", {
            headers: { "ngrok-skip-browser-warning": "true" }
        });
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
            return result.data.map(customer => ({
                id: customer.Id,
                name: `${customer.IndividualFirstName || ''} ${customer.IndividualLastName || ''}`.trim(),
                serialNumber: customer.PaddedSerialNumber,
                idNumber: customer.IndividualIdentityCardNumber,
                phone: customer.AddressMobileLine,
                email: customer.AddressEmail
            }));
        }
        return [];
    } catch (error) {
        console.error("Error fetching customers:", error);
        return [];
    }
};

// ===== Member Statement Modal Component =====
const MemberStatementModal = ({ isOpen, onClose, onGenerate }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [startDate, setStartDate] = useState(new Date("2024-01-01"));
    const [endDate, setEndDate] = useState(new Date("2024-12-31"));

    // Filter customers based on search
    const filteredCustomers = useMemo(() => {
        if (!searchTerm.trim()) return customers;
        
        const term = searchTerm.toLowerCase();
        return customers.filter(customer => 
            customer.name.toLowerCase().includes(term) ||
            customer.serialNumber?.toLowerCase().includes(term) ||
            customer.idNumber?.toLowerCase().includes(term) ||
            customer.phone?.toLowerCase().includes(term)
        );
    }, [customers, searchTerm]);

    // Load customers on modal open
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            fetchCustomers().then(data => {
                setCustomers(data);
                setLoading(false);
            });
        }
    }, [isOpen]);

    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8">
                {/* Modal Header */}
                <div className="bg-indigo-700 px-6 py-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                            <FaUser /> Generate Member Statement
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 text-2xl bg-transparent border-none cursor-pointer"
                        >
                            &times;
                        </button>
                    </div>
                    <p className="text-indigo-200 text-sm mt-1">
                        Select a member and date range to generate statement
                    </p>
                </div>

                {/* Modal Body */}
                <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, serial number, ID number, or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Date Range Selection */}
                    <div className="mb-6">
                        <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <FaCalendarAlt /> Select Date Range
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Date
                                </label>
                                <DatePicker
                                    selected={startDate}
                                    onChange={(date) => setStartDate(date)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    dateFormat="yyyy-MM-dd"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    End Date
                                </label>
                                <DatePicker
                                    selected={endDate}
                                    onChange={(date) => setEndDate(date)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    dateFormat="yyyy-MM-dd"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Customers List */}
                    <div className="mb-6">
                        <h4 className="font-medium text-gray-700 mb-3">
                            Select Member {selectedCustomer && `- ${selectedCustomer.name}`}
                        </h4>
                        
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700 mx-auto"></div>
                                <p className="mt-2 text-gray-600">Loading customers...</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                                {filteredCustomers.length === 0 ? (
                                    <p className="text-center py-4 text-gray-500">
                                        {searchTerm ? "No members found matching your search" : "No customers available"}
                                    </p>
                                ) : (
                                    filteredCustomers.map(customer => (
                                        <div
                                            key={customer.id}
                                            onClick={() => setSelectedCustomer(customer)}
                                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                                selectedCustomer?.id === customer.id
                                                    ? 'bg-indigo-100 border-2 border-indigo-500'
                                                    : 'hover:bg-gray-100 border border-gray-200'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">{customer.name}</p>
                                                    <p className="text-sm text-gray-600">
                                                        Serial: {customer.serialNumber} | ID: {customer.idNumber}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {customer.phone} • {customer.email}
                                                    </p>
                                                </div>
                                                {selectedCustomer?.id === customer.id && (
                                                    <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded">
                                                        Selected
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Validation Message */}
                    {!selectedCustomer && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        Please select a member to generate the statement.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (selectedCustomer) {
                                    onGenerate(selectedCustomer.id, startDate, endDate);
                                } else {
                                    alert("Please select a member first");
                                }
                            }}
                            disabled={!selectedCustomer}
                            className={`px-5 py-2.5 rounded-lg text-white flex items-center gap-2 transition-colors ${
                                selectedCustomer
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-red-400 cursor-not-allowed'
                            }`}
                        >
                            <FaDownload />
                            Generate PDF Statement
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function LoanReports() {
    const [showMemberStatementModal, setShowMemberStatementModal] = useState(false);

    const handleMemberStatementClick = () => {
        setShowMemberStatementModal(true);
    };

    const handleGenerateStatement = async (customerId, startDate, endDate) => {
        const success = await downloadMemberStatement(customerId, startDate, endDate);
        if (success) {
            setShowMemberStatementModal(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen m-8 rounded-2xl shadow-2xl relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">Member Statement Reports</h2>
            </div>

            {/* Files Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 bg-gray-300 rounded-2xl p-4">
                {reports.map((file) => (
                    <div key={file.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition p-4 relative">
                        <div className="flex justify-center mb-4">{fileIcon(file.type)}</div>

                        <div className="text-center mb-4">
                            <p className="font-medium text-sm truncate">{file.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{file.size} • {file.date}</p>
                        </div>

                        {/* Download Button */}
                        {file.api === "memberStatement" ? (
                            <button 
                                onClick={handleMemberStatementClick} 
                                className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded-lg transition"
                            >
                                <FaDownload />
                                Generate Statement
                            </button>
                        ) : null}
                    </div>
                ))}
            </div>

            {/* Member Statement Modal */}
            <MemberStatementModal
                isOpen={showMemberStatementModal}
                onClose={() => setShowMemberStatementModal(false)}
                onGenerate={handleGenerateStatement}
            />
        </div>
    );
}