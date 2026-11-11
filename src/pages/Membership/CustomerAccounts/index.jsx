import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaUser,
    FaPlus,
    FaPhone,
    FaEnvelope,
    FaChevronDown,
    FaChevronUp,
    FaEllipsisV,
    FaIdCard,
    FaUniversity,
} from "react-icons/fa";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";

export default function CustomerAccounts() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedAccount, setExpandedAccount] = useState(null);

    // Fetch Accounts
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/customeraccounts/all`
            );
            const json = await res.json();

            setAccounts(json?.data || []);
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: "Delete Customer Account?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Delete",
        }).then((result) => {
            if (result.isConfirmed) {
                setAccounts((prev) =>
                    prev.filter((acc) => acc.Id !== id)
                );

                Swal.fire("Deleted!", "Customer account removed.", "success");
            }
        });
    };

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaUser className="text-white" /> Customer Accounts
                </h2>
                <Button className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
                    <FaPlus /> Add Account
                </Button>
            </div>

            {/* Loading Skeleton */}
            {loading && (
                <div className="flex justify-center items-center py-10">
                    <div className="animate-spin h-10 w-10 border-4 border-indigo-700 border-t-transparent rounded-full"></div>
                </div>
            )}

            {/* Empty State */}
            {!loading && accounts.length === 0 && (
                <div className="text-center py-10">
                    <img
                        src={NotFoundImage}
                        className="w-48 mx-auto opacity-70"
                    />
                    <p className="mt-4 text-gray-600">
                        No customer accounts found.
                    </p>
                </div>
            )}

            {/* Accounts List */}
            {!loading && accounts.length > 0 && (
                <div className="space-y-4">
                    {accounts.map((acc, index) => (
                        <div
                            key={acc.Id}
                            className="bg-gray-100 p-4 rounded-lg shadow-lg border border-gray-300"
                        >
                            <div className="flex justify-between items-center">
                                {/* Basic Info */}
                                <div className="flex gap-6">
                                    <h3 className="text-lg font-semibold text-indigo-900">
                                        {acc.CustomerFullName}
                                    </h3>

                                    <p className="text-sm text-gray-700 flex items-center gap-2">
                                        <FaIdCard /> {acc.CustomerIdentificationNumber}
                                    </p>

                                    <p className="text-sm text-gray-700 flex items-center gap-2">
                                        <FaPhone /> {acc.CustomerAddressMobileLine}
                                    </p>

                                    <p className="text-sm text-gray-700 flex items-center gap-2">
                                        <FaEnvelope /> {acc.CustomerAddressEmail}
                                    </p>
                                </div>

                                {/* Expand + Actions */}
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() =>
                                            setExpandedAccount(
                                                expandedAccount === acc.Id
                                                    ? null
                                                    : acc.Id
                                            )
                                        }
                                        className="text-indigo-700 hover:text-indigo-900"
                                    >
                                        {expandedAccount === acc.Id ? (
                                            <FaChevronUp size={22} />
                                        ) : (
                                            <FaChevronDown size={22} />
                                        )}
                                    </button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger>
                                            <FaEllipsisV className="cursor-pointer text-gray-700" />
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent>
                                            <DropdownMenuItem>Edit</DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={() => handleDelete(acc.Id)}
                                            >
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* Expanded Section */}
                            {expandedAccount === acc.Id && (
                                <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200 shadow-inner">
                                    <h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2">
                                        <FaUniversity /> Account Details
                                    </h4>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <p>
                                            <strong>Account Number:</strong>{" "}
                                            {acc.FullAccountNumber}
                                        </p>

                                        <p>
                                            <strong>Product:</strong>{" "}
                                            {acc.CustomerAccountTypeProductCodeDescription}
                                        </p>

                                        <p>
                                            <strong>Balance:</strong>{" "}
                                            {acc.AvailableBalance}
                                        </p>

                                        <p>
                                            <strong>Status:</strong>{" "}
                                            {acc.StatusDescription}
                                        </p>

                                        <p>
                                            <strong>Branch:</strong>{" "}
                                            {acc.BranchDescription}
                                        </p>

                                        <p>
                                            <strong>Company:</strong>{" "}
                                            {acc.BranchCompanyDescription}
                                        </p>

                                        <p>
                                            <strong>Created:</strong>{" "}
                                            {new Date(acc.CreatedDate).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
