import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaMapMarkerAlt,
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

import AddStation from "./AddStation";
import EditStation from "./EditStation";

export default function Stations() {
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedStation, setExpandedStation] = useState(null);
    const [openAdd, setOpenAdd] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [selectedStation, setSelectedStation] = useState(null);

    useEffect(() => {
        fetchStations();
    }, []);

    const fetchStations = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/stations`
            );
            const json = await res.json();
            if (json.success) setStations(json.data);
        } catch (err) {
            console.error("Fetch Stations Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        Swal.fire({
            title: "Delete Station?",
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
                        `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/stations/${id}`,
                        { method: "DELETE" }
                    );
                    if (!res.ok) throw new Error("Failed to delete station");

                    setStations((prev) => prev.filter((s) => s.Id !== id));
                    Swal.fire("Deleted!", "Station removed successfully.", "success");
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
                    <FaMapMarkerAlt className="text-white" /> Stations
                </h2>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                    onClick={() => setOpenAdd(true)}
                >
                    <FaPlus /> Add Station
                </Button>
            </div>

            <div className="bg-gray-200 p-4 rounded-sm">
                <div className="grid grid-cols-10 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-4">Station</span>
                    <span className="col-span-3">Zone</span>
                    <span className="col-span-1">Code</span>
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
                ) : stations.length > 0 ? (
                    <div className="space-y-2">
                        {stations.map((station) => (
                            <div key={station.Id} className="bg-white rounded-lg shadow-lg border">
                                <div className="grid grid-cols-10 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                                    <span className="font-medium text-indigo-700 col-span-4">
                                        {station.Description}
                                    </span>

                                    <span className="col-span-3">
                                        {station.ZoneDescription}
                                    </span>

                                    <span className="col-span-1">
                                        {station.Code || "N/A"}
                                    </span>

                                    <div className="col-span-1 flex justify-end">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-gray-700 hover:bg-gray-600 text-white"
                                            onClick={() =>
                                                setExpandedStation(
                                                    expandedStation === station.Id ? null : station.Id
                                                )
                                            }
                                        >
                                            {expandedStation === station.Id ? (
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

                                    <div className="col-span-1 flex justify-end">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <FaEllipsisV className="h-4 w-4 text-gray-600" />
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="end" className="w-32">
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelectedStation(station);
                                                        setOpenEdit(true);
                                                    }}
                                                >
                                                    Edit
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => handleDelete(station.Id)}
                                                >
                                                    <FaTrash className="mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Expandable Extra Info */}
                                {expandedStation === station.Id && (
                                    <div className="border-t bg-gray-200 p-2 rounded-b-lg m-1">
                                        <div className="bg-white shadow-md rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
                                            {/* Left Column */}
                                            <div className="space-y-2 border-r-6">
                                                <p><span className="font-semibold text-gray-800">Address Line 1:</span> {station.AddressAddressLine1 || "N/A"}</p>
                                                <p><span className="font-semibold text-gray-800">Street:</span> {station.AddressStreet || "N/A"}</p>
                                                <p><span className="font-semibold text-gray-800">City:</span> {station.AddressCity || "N/A"}</p>
                                                <p><span className="font-semibold text-gray-800">Postal Code:</span> {station.AddressPostalCode || "N/A"}</p>
                                                <p><span className="font-semibold text-gray-800">Created:</span> {new Date(station.CreatedDate).toLocaleString()}</p>
                                            </div>

                                            {/* Right Column */}
                                            <div className="space-y-2">
                                                <p><span className="font-semibold text-gray-800">Email:</span> {station.AddressEmail || "N/A"}</p>
                                                <p><span className="font-semibold text-gray-800">Mobile:</span> {station.AddressMobileLine || "N/A"}</p>
                                                <p><span className="font-semibold text-gray-800">Landline:</span> {station.AddressLandLine || "N/A"}</p>
                                                <p><span className="font-semibold text-gray-800">Division:</span> {station.ZoneDivisionDescription || "N/A"}</p>
                                                <p><span className="font-semibold text-gray-800">Employer:</span> {station.ZoneDivisionEmployerDescription || "N/A"}</p>
                                            </div>
                                        </div>

                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500 text-center mt-4">
                        <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
                        <p className="font-medium text-gray-400">No Stations Found.</p>
                    </div>
                )}
            </div>

            <AddStation open={openAdd} onClose={() => setOpenAdd(false)} refresh={fetchStations} />

            <EditStation
                open={openEdit}
                onClose={() => setOpenEdit(false)}
                station={selectedStation}
                onUpdate={fetchStations}
            />
        </div>
    );
}
