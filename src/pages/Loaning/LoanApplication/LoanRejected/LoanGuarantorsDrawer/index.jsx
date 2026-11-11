// import { useEffect, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";

// export default function LoanGuarantorsDrawer({
//     open,
//     onClose,
//     loanCaseId,
// }) {
//     const [loading, setLoading] = useState(false);
//     const [guarantors, setGuarantors] = useState([]);

//     useEffect(() => {
//         if (!open || !loanCaseId) return;

//         const fetchGuarantors = async () => {
//             setLoading(true);
//             try {
//                 const res = await fetch(
//                     `http://95.216.225.26:8006/api/GuarantorManagement/GetLoanGuarantors/${loanCaseId}`,
//                     {
//                         headers: {
//                             "ngrok-skip-browser-warning": "true",
//                         },
//                     }
//                 );

//                 const data = await res.json();
//                 setGuarantors(data?.Data || []);
//             } catch (err) {
//                 console.error("Failed to fetch guarantors", err);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchGuarantors();
//     }, [open, loanCaseId]);

//     console.log("Guarantors:", guarantors);

//     return (
//         <AnimatePresence>
//             {open && (
//                 <>
//                     {/* Overlay */}
//                     <motion.div
//                         className="fixed inset-0 bg-black z-40"
//                         initial={{ opacity: 0 }}
//                         animate={{ opacity: 0.4 }}
//                         exit={{ opacity: 0 }}
//                         onClick={onClose}
//                     />

//                     {/* Drawer */}
//                     <motion.div
//                         className="fixed top-5 right-5 w-[920px] min-h-80vh
//                                    bg-white shadow-xl z-50 flex flex-col
//                                    rounded-2xl p-3"
//                         initial={{ x: "100%" }}
//                         animate={{ x: 0 }}
//                         exit={{ x: "100%" }}
//                         transition={{
//                             type: "spring",
//                             stiffness: 300,
//                             damping: 30,
//                         }}
//                     >
//                         {/* Header */}
//                         <div className="p-4 flex justify-between items-center
//                                         bg-indigo-600 rounded-2xl m-2">
//                             <h2 className="font-bold text-lg text-white">
//                                 Loan Guarantors
//                             </h2>
//                             <Button
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={onClose}
//                             >
//                                 Close
//                             </Button>
//                         </div>

//                         {/* Content */}
//                         <div className="p-3 flex-1 overflow-y-auto">
//                             <div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3 text-xs">
//                                 <span className="col-span-1">#</span>
//                                 <span className="col-span-3">Guarantor</span>
//                                 <span className="col-span-2">ID No</span>
//                                 <span className="col-span-2">Phone</span>
//                                 <span className="col-span-2">Guaranteed</span>
//                                 <span className="col-span-1">Shares</span>
//                                 <span className="col-span-1 text-center">Status</span>
//                             </div>

//                             {loading && (
//                                 <p className="text-sm text-muted-foreground">
//                                     Loading guarantors...
//                                 </p>
//                             )}

//                             {!loading && guarantors.length === 0 && (
//                                 <p className="text-sm text-muted-foreground">
//                                     No guarantors found for this loan.
//                                 </p>
//                             )}

//                             {!loading && guarantors.length > 0 && (
//                                 <div className="space-y-2">
//                                     {guarantors.map((g, idx) => (
//                                         <div
//                                             key={g.Id}
//                                             className="grid grid-cols-12 gap-3 items-center
//                            bg-white border rounded-lg px-3 py-2
//                            hover:shadow-md transition text-xs"
//                                         >
//                                             {/* Index */}
//                                             <span className="col-span-1 font-medium text-indigo-600">
//                                                 {idx + 1}
//                                             </span>

//                                             {/* Name */}
//                                             <span className="col-span-3">
//                                                 {g.CustomerIndividualFirstName}{" "}
//                                                 {g.CustomerIndividualLastName}
//                                             </span>

//                                             {/* ID */}
//                                             <span className="col-span-2">
//                                                 {g.CustomerIndividualIdentityCardNumber}
//                                             </span>

//                                             {/* Phone */}
//                                             <span className="col-span-2">
//                                                 {g.CustomerAddressMobileLine}
//                                             </span>

//                                             {/* Amount Guaranteed */}
//                                             <span className="col-span-2 font-semibold text-green-700">
//                                                 Ksh {g.AmountGuaranteed?.toLocaleString()}
//                                             </span>

//                                             {/* Shares */}
//                                             <span
//                                                 className={`col-span-1 font-semibold ${g.TotalShares < g.AmountGuaranteed
//                                                     ? "text-red-600"
//                                                     : "text-gray-700"
//                                                     }`}
//                                             >
//                                                 {g.TotalShares?.toLocaleString()}
//                                             </span>

//                                             {/* Status */}
//                                             <span className="col-span-1 text-center">
//                                                 <Badge variant="outline">
//                                                     {g.StatusDescription}
//                                                 </Badge>
//                                             </span>
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}


//                         </div>
//                     </motion.div>
//                 </>
//             )}
//         </AnimatePresence>
//     );
// }









import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LoanGuarantorsDrawer({ open, onClose, loanCaseId }) {
    const [loading, setLoading] = useState(false);
    const [guarantors, setGuarantors] = useState([]);

    // --- Filters & Pagination ---
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    useEffect(() => {
        if (!open || !loanCaseId) return;

        const fetchGuarantors = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_APP_LOANING_URL}/api/GuarantorManagement/GetLoanGuarantors/${loanCaseId}`
                );
                const data = await res.json();
                setGuarantors(data?.Data || []);
            } catch (err) {
                console.error("Failed to fetch guarantors", err);
            } finally {
                setLoading(false);
            }
        };

        fetchGuarantors();
    }, [open, loanCaseId]);

    // --- Filtered list based on search ---
    const filteredGuarantors = useMemo(() => {
        return guarantors.filter(g => {
            const text = `${g.CustomerIndividualFirstName} ${g.CustomerIndividualLastName} ${g.CustomerIndividualIdentityCardNumber} ${g.CustomerAddressMobileLine}`.toLowerCase();
            return text.includes(search.toLowerCase());
        });
    }, [guarantors, search]);

    // --- Pagination ---
    const totalPages = Math.ceil(filteredGuarantors.length / rowsPerPage);
    const paginatedGuarantors = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredGuarantors.slice(start, start + rowsPerPage);
    }, [filteredGuarantors, currentPage]);

    // Reset page when search changes
    useEffect(() => setCurrentPage(1), [search]);


    console.log("Guarantors:", guarantors);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Overlay */}
                    <motion.div
                        className="fixed inset-0 bg-black z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        className="fixed top-5 right-5 w-[920px] min-h-80vh bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {/* Header */}
                        <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
                            <h2 className="font-bold text-lg text-white">Loan Guarantors</h2>
                            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
                        </div>

                        {/* Search */}
                        <div className="mb-3">
                            <input
                                type="text"
                                placeholder="Search by name, ID or phone..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full border-2 rounded p-2"
                            />
                        </div>

                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3 text-xs">
                            <span className="col-span-1">#</span>
                            <span className="col-span-3">Guarantor</span>
                            <span className="col-span-2">ID No</span>
                            <span className="col-span-2">Phone</span>
                            <span className="col-span-2">Guaranteed</span>
                            <span className="col-span-1">Shares</span>
                            <span className="col-span-1 text-center">Status</span>
                        </div>

                        {/* Table Body */}
                        <div className="flex-1 overflow-y-auto">
                            {loading && <p className="text-sm text-muted-foreground">Loading guarantors...</p>}
                            {!loading && filteredGuarantors.length === 0 && (
                                <p className="text-sm text-muted-foreground">No guarantors found.</p>
                            )}

                            {!loading && filteredGuarantors.length > 0 && (
                                <div className="space-y-2 bg-gray-300 p-2 rounded-lg">
                                    {paginatedGuarantors.map((g, idx) => (
                                        <div
                                            key={g.Id}
                                            className="grid grid-cols-12 gap-3 items-center bg-white border rounded-lg px-3 py-2 hover:shadow-md transition text-xs"
                                        >
                                            <span className="col-span-1 font-medium text-indigo-600">{(currentPage - 1) * rowsPerPage + idx + 1}</span>
                                            <span className="col-span-3">{g.CustomerIndividualFirstName} {g.CustomerIndividualLastName}</span>
                                            <span className="col-span-2">{g.CustomerIndividualIdentityCardNumber}</span>
                                            <span className="col-span-2">{g.CustomerAddressMobileLine}</span>
                                            <span className="col-span-2 font-semibold text-green-700">Ksh {g.AmountGuaranteed?.toLocaleString()}</span>
                                            <span className={`col-span-1 font-semibold ${g.TotalShares < g.AmountGuaranteed ? "text-red-600" : "text-gray-700"}`}>{g.TotalShares?.toLocaleString()}</span>
                                            <span className="col-span-1 text-center"><Badge variant="outline">{g.StatusDescription}</Badge></span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {filteredGuarantors.length > rowsPerPage && (
                            <div className="flex justify-center items-center mt-3 space-x-2">
                                <Button
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Prev
                                </Button>
                                <span>{currentPage} / {totalPages}</span>
                                <Button
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
