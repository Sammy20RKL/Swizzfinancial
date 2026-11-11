import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaIndustry, FaPlus } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import AddLoanSector from "./AddLoanSector";

export default function LoanSector() {
    const [sectors, setSectors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addDrawerOpen, setAddDrawerOpen] = useState(false);
    const [search, setSearch] = useState("");

    const fetchLoanSectors = () => {
        setLoading(true);
        fetch(`${import.meta.env.VITE_APP_LOANING_URL}/api/Loansetups/GetAllloanSector`)
            .then((res) => res.json())
            .then((data) => {
                setSectors(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchLoanSectors();
    }, []);

    // 🔍 Filter logic
    const filteredSectors = sectors.filter((sector) =>
        `${sector.SectorCode} ${sector.SectorName}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaIndustry /> Loan Sectors
                </h2>

                <Button
                    onClick={() => setAddDrawerOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                >
                    <FaPlus /> Add Sector
                </Button>
            </div>

            {/* 🔍 Search */}
            <div className="mb-4">
                <Input
                    placeholder="Search by sector code or name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-md"
                />
            </div>

            {/* Table */}
            <div className="bg-gray-200 p-6 rounded-xl">
                <div className="grid grid-cols-3 gap-6 bg-gray-700 text-gray-100 font-semibold px-5 py-3 rounded-lg mb-4">
                    <span>Sector Code</span>
                    <span>Sector Name</span>
                    <span>Status</span>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-3 gap-4 bg-gray-50 p-6 rounded">
                                <div className="h-4 bg-gray-200 rounded"></div>
                                <div className="h-4 bg-gray-200 rounded"></div>
                                <div className="h-4 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredSectors.length > 0 ? (
                    <div className="space-y-2">
                        {filteredSectors.map((sector) => (
                            <div
                                key={sector.Id}
                                className="grid grid-cols-3 gap-4 items-center bg-white px-5 py-4 hover:bg-gray-50 transition-all rounded-2xl"
                            >
                                <span className="font-semibold text-indigo-700">
                                    {sector.SectorCode}
                                </span>
                                <span>{sector.SectorName}</span>
                                <span>
                                    <span
                                        className={`px-3 py-1 text-sm rounded-full font-medium ${sector.IsActive
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {sector.IsActive ? "Active" : "Inactive"}
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500 text-center mt-4">
                        <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42 h-auto" />
                        <p className="font-medium text-gray-400">
                            No loan sectors match your search.
                        </p>
                    </div>
                )}
            </div>

            <AddLoanSector
                open={addDrawerOpen}
                onClose={() => setAddDrawerOpen(false)}
                onSuccess={fetchLoanSectors}
            />
        </div>
    );
}
