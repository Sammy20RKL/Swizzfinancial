import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserX, Clock } from "lucide-react";
import { useEffect, useState } from "react";

export default function Membership() {
    const [members, setMembers] = useState([]);
    const [exits, setExits] = useState([]);
    const [products, setProducts] = useState([]);
    const [insurance, setInsurance] = useState([]);
    const [branches, setBranches] = useState([])
    const [stations, setStations] = useState([])
    const [loading, setLoading] = useState(false);

    // ---------------- FETCHERS ----------------
    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/values/GetMembersWithDetails`
            );
            const json = await res.json();
            console.log(json);
            setMembers(json.Data?.Members || []);
        } catch (err) {
            console.error("Fetch Members Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMemberExits = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                "http://95.216.225.26:8006/api/MemberExit/GetAll",
                {
                    headers: {
                        "ngrok-skip-browser-warning": "true",
                    },
                }
            );

            const json = await res.json();
            setExits(json.Data?.PageCollection || []);
        } catch (err) {
            console.error("Fetch Member Exit Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/savings-products`,
                { headers: { "ngrok-skip-browser-warning": "true" } }
            );

            const json = await res.json();
            setProducts(json.data || []);
        } catch (err) {
            console.error("Fetch Savings Products Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchInsurance = async () => {
        try {
            const res = await fetch(
                "http://95.216.225.26:8006/api/MemberExit/GetAllInsuarance"
            );
            const json = await res.json();
            setInsurance(json.Data || []);
        } catch (error) {
            console.error("Fetch Insurance Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/branches`,
                { headers: { "ngrok-skip-browser-warning": "true" } }
            );
            const json = await res.json();
            setBranches(json.data || []);
        } catch (err) {
            console.error("Fetch Branches Error:", err);
        } finally {
            setLoading(false);
        }
    };
    const fetchStations = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/stations`,
                { headers: { "ngrok-skip-browser-warning": "true" } }
            );
            const json = await res.json();
            if (json.success) setStations(json.data);
        } catch (err) {
            console.error("Fetch Stations Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers()
        fetchMemberExits()
        fetchProducts()
        fetchInsurance()
        fetchBranches()
        fetchStations()
    }, []);

    console.log(members.length)
    // ---------------- STATS ----------------
    const stats = [
        {
            label: "Total Members",
            value: members.length,
            icon: Users,
            color: "bg-indigo-100 text-indigo-600",
        },
        {
            label: "Exited Members",
            value: exits.length,
            icon: UserX,
            color: "bg-rose-100  text-rose-600",
        },
        {
            label: "Saving Products",
            value: products.length,
            icon: Clock,
            color: "bg-amber-100 text-amber-600",
        },
        {
            label: "Insurance Company",
            value: insurance.length,
            icon: UserCheck,
            color: "bg-emerald-100 text-emerald-600",
        },
    ];

    return (
        <div className="bg-gray-50 p-6 m-8 rounded-xl shadow-2xl">
            {/* Header */}
            <div className="mb-6 bg-indigo-600 p-5 rounded-xl">
                <h1 className="text-2xl font-bold text-white">
                    Membership Dashboard
                </h1>
                <p className="text-indigo-100">
                    Overview of member registrations and status
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 bg-gray-200 p-4 rounded-2xl">
                {stats.map((s, i) => (
                    <Card key={i} className="shadow-sm">
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className={`p-3 rounded-xl ${s.color}`}>
                                <s.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">{s.label}</p>
                                <p className="text-2xl font-bold">{s.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="rounded-2xl shadow-md bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                    <CardContent className="p-6">
                        <p className="text-sm opacity-80">Rubani Branches</p>
                        <h2 className="text-3xl font-bold mt-2">{branches.length}</h2>
                        <p className="text-xs mt-4 opacity-70">Branches</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-md bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    <CardContent className="p-6">
                        <p className="text-sm opacity-80">Stations</p>
                        <h2 className="text-3xl font-bold mt-2">{stations.length}</h2>
                        <p className="text-xs mt-4 opacity-70">Currently active</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-md bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                    <CardContent className="p-6">
                        <p className="text-sm opacity-80">Savings Product</p>
                        <h2 className="text-3xl font-bold mt-2">{products.length}</h2>
                        <p className="text-xs mt-4 opacity-70">Product</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-md bg-gradient-to-br from-rose-500 to-rose-600 text-white">
                    <CardContent className="p-6">
                        <p className="text-sm opacity-80">Insurance Company</p>
                        <h2 className="text-3xl font-bold mt-2">{insurance.length}</h2>
                        <p className="text-xs mt-4 opacity-70">company</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

