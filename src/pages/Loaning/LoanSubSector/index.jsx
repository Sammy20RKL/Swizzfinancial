import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaIndustry, FaPlus } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import AddLoanSubSector from "./AddLoanSubSector";

export default function LoanSubSector() {
    const [subSectors, setSubSectors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addDrawerOpen, setAddDrawerOpen] = useState(false);
    const [search, setSearch] = useState("");

    const fetchLoanSubSectors = () => {
        setLoading(true);
        fetch(`${import.meta.env.VITE_APP_LOANING_URL}/api/Loansetups/GetAllLoanSubSector`)
            .then((res) => res.json())
            .then((data) => {
                setSubSectors(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchLoanSubSectors();
    }, []);

    // 🔍 Search filter
    const filteredSubSectors = subSectors.filter((sub) =>
        `${sub.SubSectorCode} ${sub.SubSectorName}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaIndustry /> Loan Sub Sectors
                </h2>

                <Button
                    onClick={() => setAddDrawerOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                >
                    <FaPlus /> Add Sub Sector
                </Button>
            </div>

            {/* 🔍 Search */}
            <div className="mb-4">
                <Input
                    placeholder="Search by sub sector code or name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-md"
                />
            </div>

            {/* Table */}
            <div className="bg-gray-200 p-6 rounded-xl">
                <div className="grid grid-cols-3 gap-6 bg-gray-700 text-gray-100 font-semibold px-5 py-3 rounded-lg mb-4">
                    <span>Sub Sector Code</span>
                    <span>Sub Sector Name</span>
                    <span>Status</span>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-3 gap-4 bg-gray-50 p-6 rounded"
                            >
                                <div className="h-4 bg-gray-200 rounded"></div>
                                <div className="h-4 bg-gray-200 rounded"></div>
                                <div className="h-4 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredSubSectors.length > 0 ? (
                    <div className="space-y-2">
                        {filteredSubSectors.map((sub) => (
                            <div
                                key={sub.Id}
                                className="grid grid-cols-3 gap-4 items-center bg-white px-5 py-4 hover:bg-gray-50 transition-all rounded-2xl"
                            >
                                <span className="font-semibold text-indigo-700">
                                    {sub.SubSectorCode}
                                </span>

                                <span>{sub.SubSectorName}</span>

                                <span>
                                    <span
                                        className={`px-3 py-1 text-sm rounded-full font-medium ${sub.IsActive
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {sub.IsActive ? "Active" : "Inactive"}
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500 text-center mt-4">
                        <img
                            src={NotFoundImage}
                            alt="Not Found"
                            className="mx-auto w-42 h-auto"
                        />
                        <p className="font-medium text-gray-400">
                            No loan sub sectors match your search.
                        </p>
                    </div>
                )}
            </div>

            {/* Add Drawer */}
            <AddLoanSubSector
                open={addDrawerOpen}
                onClose={() => setAddDrawerOpen(false)}
                onSuccess={fetchLoanSubSectors}
            />

        </div>
    );
}
