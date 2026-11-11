
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaBuilding,
    FaPlus,
    FaTrash,
    FaChevronDown,
    FaChevronUp,
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

//import EditParents from "./EditParents";
import AddParents from "./AddParents";
import AddChild from "./AddChild"; // <-- New Child Drawer

export default function Administrative() {
    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedDivision, setExpandedDivision] = useState(null);

    const [openAddParent, setOpenAddParent] = useState(false);
    const [openAddChild, setOpenAddChild] = useState(false); // <-- Add child state
    const [openEdit, setOpenEdit] = useState(false);
    const [selectedDivision, setSelectedDivision] = useState(null);
    const [selectedParentForChild, setSelectedParentForChild] = useState(null); // <-- Track parent

    useEffect(() => {
        fetchDivisions();
    }, []);

    const fetchDivisions = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/administrative-divisions`
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
                        `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/administrative-divisions/${id}`,
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

    const parents = divisions.filter((d) => !d.ParentId);
    const getChildren = (parentId) => divisions.filter((d) => d.ParentId === parentId);

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Administrative Divisions
                </h2>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                    onClick={() => setOpenAddParent(true)}
                >
                    <FaPlus /> Add Division
                </Button>
            </div>

            {/* Table */}
            <div className="bg-gray-200 p-4 rounded-sm">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-4">Division Name</span>
                    <span className="col-span-4">Remarks</span>
                    <span className="col-span-2 text-center">Expand</span>
                    <span className="col-span-2 text-center">Actions</span>
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
                ) : parents.length > 0 ? (
                    <div className="space-y-2">
                        {parents.map((parent) => {
                            const children = getChildren(parent.Id);
                            return (
                                <div key={parent.Id} className="bg-white rounded-lg shadow-lg border">
                                    {/* Parent Row */}
                                    <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                                        <span className="font-medium text-indigo-700 col-span-4">
                                            {parent.Description}
                                        </span>
                                        <span className="col-span-4">{parent.Remarks || "N/A"}</span>

                                        {/* Expand/Collapse Section */}
                                        <div className="col-span-2 flex justify-end gap-2">
                                            {children.length > 0 && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="bg-gray-700 hover:bg-gray-600 text-white"
                                                    onClick={() =>
                                                        setExpandedDivision(
                                                            expandedDivision === parent.Id ? null : parent.Id
                                                        )
                                                    }
                                                >
                                                    {expandedDivision === parent.Id ? (
                                                        <>
                                                            <FaChevronUp /> Hide
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaChevronDown /> View
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="bg-green-600 text-white hover:bg-green-700"
                                                onClick={() => {
                                                    setSelectedParentForChild(parent);
                                                    setOpenAddChild(true);
                                                }}
                                            >
                                                Add Child
                                            </Button>
                                        </div>

                                        {/* Actions */}
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
                                                            setSelectedDivision(parent);
                                                            setOpenEdit(true);
                                                        }}
                                                    >
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() => handleDelete(parent.Id)}
                                                    >
                                                        <FaTrash className="mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* Children Rows */}
                                    {expandedDivision === parent.Id && children.length > 0 && (
                                        <div className="border-t bg-gray-100 p-2 rounded-b-lg space-y-2">
                                            {children.map((child) => (
                                                <div
                                                    key={child.Id}
                                                    className="grid grid-cols-12 gap-2 items-center py-2 px-6 bg-gray-50 rounded"
                                                >
                                                    <span className="col-span-4 font-medium text-gray-700">
                                                        {child.Description}
                                                    </span>
                                                    <span className="col-span-4">{child.Remarks || "N/A"}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-gray-500 text-center mt-4">
                        <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
                        <p className="font-medium text-gray-400">No Administrative Divisions Found.</p>
                    </div>
                )}
            </div>

            {/* Add Parent Drawer */}
            <AddParents
                open={openAddParent}
                onClose={() => setOpenAddParent(false)}
                refresh={fetchDivisions}
            />

            {/* Add Child Drawer */}
            {selectedParentForChild && (
                <AddChild
                    open={openAddChild}
                    onClose={() => setOpenAddChild(false)}
                    refresh={fetchDivisions}
                    parent={selectedParentForChild} // Pass selected parent
                />
            )}

            {/* Edit Division Drawer */}
            {/* <EditParents
                open={openEdit}
                onClose={() => setOpenEdit(false)}
                data={selectedDivision}
                refresh={fetchDivisions}
            /> */}
        </div>
    );
}
