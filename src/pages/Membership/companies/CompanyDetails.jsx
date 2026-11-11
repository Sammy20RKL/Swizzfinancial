import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
    FaUsers, 
    FaMale, 
    FaFemale, 
    FaUserCheck, 
    FaUserTimes,
    FaBuilding,
    FaUserFriends,
    FaChartPie,
    FaTimes,
    FaPhone,
    FaEnvelope,
    FaMapMarkerAlt,
    FaSpinner,
} from "react-icons/fa";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";

const API_URL = import.meta.env.VITE_APP_MEMBERSHIP_URL;

export default function CompanyDetails({ open, onClose, companyId }) {
    const [loading, setLoading] = useState(false);
    const [company, setCompany] = useState(null);
    const [statistics, setStatistics] = useState(null);

    useEffect(() => {
        if (open && companyId) {
            fetchCompanyDetails();
            fetchCompanyStatistics();
        }
    }, [open, companyId]);

    const fetchCompanyDetails = async () => {
        try {
            const res = await fetch(
                `${API_URL}/api/companies/${companyId}`,
                { headers: { "ngrok-skip-browser-warning": "true" } }
            );
            const data = await res.json();
            if (data.success) {
                setCompany(data.data);
            }
        } catch (err) {
            console.error("Error fetching company details:", err);
        }
    };

    const fetchCompanyStatistics = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${API_URL}/api/companies/${companyId}/statistics`,
                { headers: { "ngrok-skip-browser-warning": "true" } }
            );
            const data = await res.json();
            if (data.success) {
                setStatistics(data.data);
            }
        } catch (err) {
            console.error("Error fetching company statistics:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    // Helper to safely get values with fallbacks
    const getStat = (key) => statistics?.[key] ?? 0;

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/60 z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        className="fixed top-3 right-3 w-[85vw] max-w-[500px] bg-white shadow-2xl z-50 flex flex-col rounded-2xl max-h-[90vh]"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        {/* Header */}
                        <div className="p-4 bg-indigo-700 rounded-2xl m-2">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="font-bold text-xl text-white flex items-center gap-2">
                                        <FaBuilding className="text-white" />
                                        {loading ? "Loading..." : company?.Description || "Company Details"}
                                    </h2>
                                    {company && (
                                        <p className="text-indigo-200 text-sm mt-1">
                                            {company.RegistrationNumber || "No registration number"}
                                        </p>
                                    )}
                                </div>
                                <Button variant="outline" size="sm" onClick={onClose}>
                                    <FaTimes />
                                </Button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 overflow-y-auto flex-1">
                            {loading ? (
                                <div className="flex justify-center items-center h-32">
                                    <FaSpinner className="h-8 w-8 text-indigo-600 animate-spin" />
                                </div>
                            ) : statistics ? (
                                <div className="space-y-4">
                                    {/* Total Members */}
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <FaUsers className="text-indigo-600" />
                                                Total Members
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-3xl font-bold text-indigo-700">
                                                {getStat('TotalMembers')}
                                            </p>
                                            {getStat('TotalMembers') === 0 && (
                                                <p className="text-sm text-gray-400 mt-1">No members registered yet</p>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Gender Distribution - only show if there are members */}
                                    {getStat('TotalMembers') > 0 && (
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <FaChartPie className="text-indigo-600" />
                                                    Gender Distribution
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="flex items-center gap-1">
                                                            <FaMale className="text-blue-500" /> Male
                                                        </span>
                                                        <span className="font-medium">
                                                            {getStat('MaleMembers')} ({getStat('MalePercentage')}%)
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                        <div 
                                                            className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" 
                                                            style={{ width: `${getStat('MalePercentage')}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="flex items-center gap-1">
                                                            <FaFemale className="text-pink-500" /> Female
                                                        </span>
                                                        <span className="font-medium">
                                                            {getStat('FemaleMembers')} ({getStat('FemalePercentage')}%)
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                        <div 
                                                            className="bg-pink-500 h-2.5 rounded-full transition-all duration-500" 
                                                            style={{ width: `${getStat('FemalePercentage')}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Member Status - only show if there are members */}
                                    {getStat('TotalMembers') > 0 && (
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <FaUserFriends className="text-indigo-600" />
                                                    Member Status
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="grid grid-cols-2 gap-3">
                                                <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
                                                    <FaUserCheck className="text-green-600 mx-auto h-6 w-6" />
                                                    <p className="text-2xl font-bold text-green-700">
                                                        {getStat('ActiveMembers')}
                                                    </p>
                                                    <p className="text-xs text-green-600">Active</p>
                                                    <p className="text-xs text-green-500">
                                                        {getStat('ActivePercentage')}%
                                                    </p>
                                                </div>
                                                <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-center">
                                                    <FaUserTimes className="text-red-600 mx-auto h-6 w-6" />
                                                    <p className="text-2xl font-bold text-red-700">
                                                        {getStat('InactiveMembers')}
                                                    </p>
                                                    <p className="text-xs text-red-600">Inactive</p>
                                                    <p className="text-xs text-red-500">
                                                        {getStat('InactivePercentage')}%
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Member Types - only show if there are members */}
                                    {getStat('TotalMembers') > 0 && (
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <FaUserFriends className="text-indigo-600" />
                                                    Member Types
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="grid grid-cols-2 gap-2">
                                                <div className="bg-gray-50 p-2 rounded border text-center">
                                                    <p className="text-xs text-gray-500">Individual</p>
                                                    <p className="text-lg font-bold text-indigo-600">
                                                        {getStat('IndividualMembers')}
                                                    </p>
                                                </div>
                                                <div className="bg-gray-50 p-2 rounded border text-center">
                                                    <p className="text-xs text-gray-500">Corporate</p>
                                                    <p className="text-lg font-bold text-indigo-600">
                                                        {getStat('CorporateMembers')}
                                                    </p>
                                                </div>
                                                <div className="bg-gray-50 p-2 rounded border text-center">
                                                    <p className="text-xs text-gray-500">Partnership</p>
                                                    <p className="text-lg font-bold text-indigo-600">
                                                        {getStat('PartnershipMembers')}
                                                    </p>
                                                </div>
                                                <div className="bg-gray-50 p-2 rounded border text-center">
                                                    <p className="text-xs text-gray-500">MicroCredit</p>
                                                    <p className="text-lg font-bold text-indigo-600">
                                                        {getStat('MicroCreditMembers')}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Company Address */}
                                    {company && (
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <FaMapMarkerAlt className="text-indigo-600" />
                                                    Address
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="text-sm space-y-1">
                                                {company.AddressAddressLine1 && (
                                                    <p>{company.AddressAddressLine1}</p>
                                                )}
                                                {company.AddressAddressLine2 && (
                                                    <p>{company.AddressAddressLine2}</p>
                                                )}
                                                <p>
                                                    {company.AddressCity && `${company.AddressCity}, `}
                                                    {company.AddressPostalCode}
                                                </p>
                                                {company.AddressEmail && (
                                                    <p className="flex items-center gap-2">
                                                        <FaEnvelope className="text-gray-400" />
                                                        {company.AddressEmail}
                                                    </p>
                                                )}
                                                {company.AddressMobileLine && (
                                                    <p className="flex items-center gap-2">
                                                        <FaPhone className="text-gray-400" />
                                                        {company.AddressMobileLine}
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No statistics available for this company.
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t p-4 flex justify-end bg-gray-50 rounded-b-2xl">
                            <Button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                Close
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}