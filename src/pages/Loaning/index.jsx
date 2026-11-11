




import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, Clock, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import LoanRejected from "./LoanApplication/LoanRejected";
import { useNavigate } from "react-router-dom";


export default function Loaning() {
    const [loans, setLoans] = useState([]);
    const [loansApppraised, setLoansApppraised] = useState([]);
    const [loansAppproved, setLoansAppproved] = useState([]);
    const [loansRejected, setLoansRejected] = useState([])
    const [loansDisbursed, setLoansDisbursed] = useState([])
    const [products, setProducts] = useState([])
    const [sectors, setSectors] = useState([])
    const [subSectors, setSubSectors] = useState([])
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();


    const fetchLoanDrafts = () => {
        setLoading(true);
        fetch(
            `${import.meta.env.VITE_APP_LOANING_URL}/api/Loaning/GetLoansBy?status=Registered`
        )
            .then((res) => res.json())
            .then((data) => {
                setLoans(data.items || []);

            })
            .catch(() => setLoading(false));
    };


    const fetchLoanAppraised = () => {
        setLoading(true);
        fetch(
            `${import.meta.env.VITE_APP_LOANING_URL}/api/Loaning/GetLoansBy?status=audited`
        )
            .then((res) => res.json())
            .then((data) => {
                setLoansApppraised(data.items || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const fetchLoanApproved = () => {
        setLoading(true);
        fetch(
            `${import.meta.env.VITE_APP_LOANING_URL}/api/Loaning/GetLoansBy?status=Approved`,

        )
            .then((res) => res.json())
            .then((data) => {
                setLoansAppproved(data.items || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const fetchLoanRejected = () => {
        setLoading(true);
        fetch(
            `${import.meta.env.VITE_APP_LOANING_URL}/api/Loaning/GetLoansBy?status=Rejected`,

        )
            .then((res) => res.json())
            .then((data) => {
                setLoansRejected(data.items || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const fetchLoanDisbursed = () => {
        setLoading(true);
        fetch(
            `${import.meta.env.VITE_APP_LOANING_URL}/api/Loaning/GetLoansBy?status=disbursed`,

        )
            .then((res) => res.json())
            .then((data) => {
                setLoansDisbursed(data.items || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_LOANING_URL}/api/Loansetups/GetLoanProducts`
            );
            const json = await res.json();
            setProducts(json.Data || []);

        } catch (err) {
            console.error("Fetch Loan Products Error:", err);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };


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
        fetchLoanDrafts();
        fetchLoanAppraised();
        fetchLoanApproved();
        fetchLoanRejected();
        fetchLoanDisbursed();
        fetchProducts();
        fetchLoanSectors();
        fetchLoanSubSectors();
    }, []);

    const stats = [
        { label: "Drafted Loan", value: loans.length, icon: Users, color: "bg-pink-100" },
        { label: "Appraised Loan", value: loansApppraised.length, icon: Users, color: "bg-blue-100" },
        { label: "Approved Loan", value: loansAppproved.length, icon: Users, color: "bg-purple-100" },
        { label: "Rejected Loan", value: loansRejected.length, icon: Clock, color: "bg-green-100" },
        { label: "Disbursed Loan", value: loansDisbursed.length, icon: Users, color: "bg-blue-100" },

    ];

    return (
        <div className=" bg-gray-50 p-6 m-8 rounded-lg shadow-2xl">
            {/* Header */}
            <div className="mb-6 bg-indigo-600 p-5 rounded-lg">
                <h1 className="text-2xl font-bold text-gray-50">Loan Management Dashboard</h1>
                <p className="text-gray-200">Overview of loan performance and operations</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 bg-gray-200 p-3 rounded-2xl">
                {stats.map((s, i) => (
                    <Card key={i} className="shadow-sm">
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className={`p-3 rounded-xl ${s.color}`}>
                                <s.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">{s.label}</p>
                                <p className="text-xl font-bold">{s.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Loans */}
                <Card className="rounded-2xl shadow-md bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                    <CardContent className="p-6">
                        <p className="text-sm opacity-80">Total Products</p>
                        <h2 className="text-3xl font-bold mt-2">{products.length}</h2>
                        <p className="text-xs mt-4 opacity-70">Available</p>
                    </CardContent>
                </Card>

                {/* Active Borrowers */}
                <Card className="rounded-2xl shadow-md bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    <CardContent className="p-6">
                        <p className="text-sm opacity-80">Sector</p>
                        <h2 className="text-3xl font-bold mt-2">{sectors.length}</h2>
                        <p className="text-xs mt-4 opacity-70">Active</p>
                    </CardContent>
                </Card>

                {/* Total Amount */}
                <Card className="rounded-2xl shadow-md bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                    <CardContent className="p-6">
                        <p className="text-sm opacity-80">Sub Sector</p>
                        <h2 className="text-3xl font-bold mt-2">{subSectors.length}</h2>
                        <p className="text-xs mt-4 opacity-70">Active</p>
                    </CardContent>
                </Card>

                {/* Overdue Loans */}
                <Card
                    className="rounded-2xl shadow-md bg-gradient-to-br from-rose-500 to-rose-600 text-white"
                    onClick={() => navigate("/Loaning/LoanCalculator")}
                >
                    <CardContent className="p-6">
                        {/* <p className="text-sm opacity-80">Loan calculator</p> */}
                        <h2 className="text-3xl font-bold mt-2">Loan Calculator</h2>
                        <p className="text-xs mt-4 opacity-70">Link</p>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
