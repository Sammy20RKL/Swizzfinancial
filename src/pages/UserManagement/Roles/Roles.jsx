import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaUserShield,
    FaPlus,
    FaTrash,
    FaEdit,
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
import AddRole from "./AddRoles";
import EditRole from "./EditRole";
import * as authApi from "@/apis/auth/authApi";

export default function Roles() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openAdd, setOpenAdd] = useState(false);
    const [editingRole, setEditingRole] = useState(null);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const res = await authApi.getRoles();
            const json = res.data;
            if (json.success) {
                setRoles(json.data);
            }
        } catch (err) {
            console.error("Fetch Roles Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        Swal.fire({
            title: "Delete Role?",
            text: "This action cannot be undone. Deletion fails if the role is still assigned to a user.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Delete",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await authApi.deleteRole(id);
                    setRoles((prev) => prev.filter((r) => r.Id !== id));
                    Swal.fire("Deleted!", "Role removed successfully.", "success");
                } catch (err) {
                    const message = err.response?.data?.message || err.message;
                    Swal.fire("Error", message, "error");
                }
            }
        });
    };

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaUserShield /> Roles
                </h2>


                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                    onClick={() => setOpenAdd(true)}
                >
                    <FaPlus /> Add Role
                </Button>
            </div>

            <div className="bg-gray-200 p-4 rounded-sm">
                {/* Table Header */}
                <div className="grid grid-cols-9 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-4">Role Name</span>
                    <span className="col-span-4">Description</span>
                    <span className="col-span-1 text-right">Actions</span>
                </div>

                {/* Loading Skeleton */}
                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-10 gap-2 bg-gray-50 p-6 rounded"
                            >
                                {Array.from({ length: 10 }).map((__, j) => (
                                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : roles.length > 0 ? (
                    <div className="space-y-2">
                        {roles.map((role) => (
                            <div
                                key={role.Id}
                                className="bg-white rounded-lg shadow-lg border"
                            >
                                <div className="grid grid-cols-9 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                                    <span className="font-medium text-indigo-700 col-span-4">
                                        {role.RoleName}
                                    </span>

                                    <span className="col-span-4">
                                        {role.Description || "N/A"}
                                    </span>

                                    <div className="col-span-1 flex justify-end">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <FaEllipsisV className="h-4 w-4 text-gray-600" />
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="end" className="w-32">
                                                <DropdownMenuItem onClick={() => setEditingRole(role)}>
                                                    <FaEdit className="mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => handleDelete(role.Id)}
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
                        <img
                            src={NotFoundImage}
                            alt="Not Found"
                            className="mx-auto w-42"
                        />
                        <p className="font-medium text-gray-400">
                            No Roles Found.
                        </p>
                    </div>
                )}
            </div>
            <AddRole
                open={openAdd}
                onClose={() => setOpenAdd(false)}
                refresh={fetchRoles}
            />
            <EditRole
                open={!!editingRole}
                role={editingRole}
                onClose={() => setEditingRole(null)}
                refresh={fetchRoles}
            />
        </div>
    );
}
