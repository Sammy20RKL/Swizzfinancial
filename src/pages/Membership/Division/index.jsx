import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaBuilding,
    FaPlus,
    FaChevronDown,
    FaChevronUp,
    FaTrash,
    FaEllipsisV,
} from "react-icons/fa";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import AddDivision from "./AddDivision";
import EditDivision from "./EditDivision";

// import AddDivision from "./AddDivision"; // Drawer for adding
// import EditDivision from "./EditDivision"; // Drawer for editing

export default function Division() {
    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedDivision, setExpandedDivision] = useState(null);
    const [openAdd, setOpenAdd] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [selectedDivision, setSelectedDivision] = useState(null);

    useEffect(() => {
        fetchDivisions();
    }, []);

    const fetchDivisions = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/divisions`
            );
            const json = await res.json();
            if (json.success) setDivisions(json.data);
        } catch (err) {
            console.error("Fetch Divisions Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        Swal.fire({
            title: "Delete Division?",
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
                        `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/divisions/${id}`,
                        { method: "DELETE" }
                    );
                    if (!res.ok) throw new Error("Failed to delete division");

                    setDivisions((prev) => prev.filter((d) => d.Id !== id));
                    Swal.fire("Deleted!", "Division removed successfully.", "success");
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
                    <FaBuilding className="text-white" /> Divisions
                </h2>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                    onClick={() => setOpenAdd(true)}
                >
                    <FaPlus /> Add Division
                </Button>
            </div>

            {/* Table */}
            <div className="bg-gray-200 p-4 rounded-sm">
                <div className="grid grid-cols-10 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-3">Division</span>
                    <span className="col-span-3">Employer</span>
                    <span className="col-span-2">Created Date</span>
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
                ) : divisions.length > 0 ? (
                    <div className="space-y-2">
                        {divisions.map((division) => (
                            <div key={division.Id} className="bg-white rounded-lg shadow-lg border">
                                <div className="grid grid-cols-10 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                                    <span className="font-medium text-indigo-700 col-span-3">
                                        {division.Description}
                                    </span>
                                    <span className="col-span-3">{division.EmployerDescription}</span>
                                    <span className="col-span-2">
                                        {new Date(division.CreatedDate).toLocaleDateString()}
                                    </span>


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
                                                        setSelectedDivision(division);
                                                        setOpenEdit(true);
                                                    }}
                                                >
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => handleDelete(division.Id)}
                                                >
                                                    <FaTrash className="mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>


                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500 text-center mt-4">
                        <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
                        <p className="font-medium text-gray-400">No Divisions Found.</p>
                    </div>
                )}
            </div>

            <AddDivision open={openAdd} onClose={() => setOpenAdd(false)} refresh={fetchDivisions} />

            <EditDivision open={openEdit} onClose={() => setOpenEdit(false)} data={selectedDivision} refresh={fetchDivisions} />

        </div>
    );
}
