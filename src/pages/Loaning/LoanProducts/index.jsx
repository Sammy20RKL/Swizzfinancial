// import { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import {
//     FaWallet,
//     FaPlus,
//     FaChevronDown,
//     FaChevronUp,
//     FaEllipsisV,
//     FaTrash,
//     FaLink,
//     FaPercentage,
//     FaChevronLeft,
// } from "react-icons/fa";

// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

// import Swal from "sweetalert2";
// import NotFoundImage from "/assets/scopefinding.png";
// import AddProducts from "./AddLoanProducts";
// import LoanProductDetailsDrawer from "./LoanProductDetailsDrawer";

// export default function LoanProducts() {
//     const [products, setProducts] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [expanded, setExpanded] = useState(null);

//     const [openDrawer, setOpenDrawer] = useState(false);

//     // linkage drawer
//     const [drawerOpen, setDrawerOpen] = useState(false);
//     const [selectedProduct, setSelectedProduct] = useState(null);
//     const [detailDrawerOpen, setDetailDrawerOpen] = useState(false); // For product details

//     useEffect(() => {
//         fetchProducts();
//     }, []);

//     const fetchProducts = async () => {
//         try {
//             const res = await fetch(
//                 `${import.meta.env.VITE_APP_LOANING_URL}/api/Loansetups/GetLoanproducts`,
//                 { headers: { "ngrok-skip-browser-warning": "true" } }
//             );
//             const json = await res.json();
//             setProducts(json.Data || []);
//         } catch (err) {
//             console.error("Fetch Loan Products Error:", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleDelete = async (id) => {
//         Swal.fire({
//             title: "Delete Loan Product?",
//             text: "This action cannot be undone.",
//             icon: "warning",
//             showCancelButton: true,
//             confirmButtonColor: "#dc2626",
//             cancelButtonColor: "#6b7280",
//             confirmButtonText: "Delete",
//         }).then(async (result) => {
//             if (result.isConfirmed) {
//                 Swal.fire("Error", "Delete API not provided.", "error");
//             }
//         });
//     };

//     const openLinkageDrawer = (p) => {
//         setSelectedProduct(p);
//         setDrawerOpen(true);
//     };

//     const openDetailDrawer = (p) => {
//         setSelectedProduct(p);
//         setDetailDrawerOpen(true);
//     };

//     return (
//         <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
//             {/* Header */}
//             <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
//                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
//                     <FaWallet className="text-white" /> Loan Products
//                 </h2>
//                 <Button
//                     className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
//                     onClick={() => setOpenDrawer(true)}
//                 >
//                     <FaPlus /> Add Loan Product
//                 </Button>
//             </div>

//             {/* Table Header */}
//             <div className="bg-gray-200 p-4 rounded-sm">
//                 <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
//                     <span className="col-span-3">Description</span>
//                     <span className="col-span-2">Code</span>
//                     <span className="col-span-3">Priority</span>
//                     <span className="col-span-2">Interest %</span>
//                     <span className="col-span-2 text-right">Actions</span>
//                 </div>

//                 {/* Loading */}
//                 {loading ? (
//                     <div className="space-y-2 animate-pulse">
//                         {[1, 2, 3].map((i) => (
//                             <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
//                                 {Array.from({ length: 12 }).map((_, j) => (
//                                     <div key={j} className="h-4 bg-gray-200 rounded"></div>
//                                 ))}
//                             </div>
//                         ))}
//                     </div>
//                 ) : products.length > 0 ? (
//                     <div className="space-y-2">
//                         {products.map((p) => (
//                             <div key={p.Id} className="bg-white rounded-lg shadow-lg border">
//                                 {/* Main Row */}
//                                 <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
//                                     <span className="font-medium text-indigo-700 col-span-3">
//                                         {p.Description}
//                                     </span>
//                                     <span className="col-span-2">{p.PaddedCode}</span>
//                                     <span className="col-span-3">{p.Priority}</span>
//                                     <span className="col-span-2 flex gap-1 items-center">
//                                         {p.LoanInterestAnnualPercentageRate}%
//                                     </span>

//                                     {/* Details Drawer */}
//                                     <span className="col-span-1">
//                                         <Button
//                                             size="sm"
//                                             variant="outline"
//                                             className="bg-gray-700 hover:bg-gray-600 text-white"
//                                             onClick={() => openDetailDrawer(p)}
//                                         >
//                                             <FaChevronLeft /> Details
//                                         </Button>
//                                     </span>

//                                     {/* Expand */}
//                                     {/* <span className="col-span-1">
//                                         <Button
//                                             size="sm"
//                                             variant="outline"
//                                             className="bg-gray-700 hover:bg-gray-600 text-white"
//                                             onClick={() => setExpanded(expanded === p.Id ? null : p.Id)}
//                                         >
//                                             {expanded === p.Id ? (
//                                                 <>
//                                                     <FaChevronUp /> Hide
//                                                 </>
//                                             ) : (
//                                                 <>
//                                                     <FaChevronDown /> Details
//                                                 </>
//                                             )}
//                                         </Button>
//                                     </span> */}



//                                     {/*
//                                     <div className="col-span-1 flex justify-end">
//                                         <DropdownMenu>
//                                             <DropdownMenuTrigger asChild>
//                                                 <Button variant="ghost" size="icon" className="h-8 w-8">
//                                                     <FaEllipsisV className="h-4 w-4 text-gray-600" />
//                                                 </Button>
//                                             </DropdownMenuTrigger>
//                                             <DropdownMenuContent align="end" className="w-32">
//                                                 <DropdownMenuItem>Edit</DropdownMenuItem>
//                                                 <DropdownMenuItem
//                                                     className="text-red-600"
//                                                     onClick={() => handleDelete(p.Id)}
//                                                 >
//                                                     <FaTrash className="mr-2" /> Delete
//                                                 </DropdownMenuItem>
//                                             </DropdownMenuContent>
//                                         </DropdownMenu>
//                                     </div> */}
//                                 </div>

//                                 {/* Expanded Section */}

//                             </div>
//                         ))}
//                     </div>
//                 ) : (
//                     <div className="text-gray-500 text-center mt-4">
//                         <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
//                         <p className="font-medium text-gray-400">No Loan Products Found.</p>
//                     </div>
//                 )}
//             </div>

//             {/* ADD PRODUCT DRAWER */}
//             <AddProducts
//                 open={openDrawer}
//                 onClose={() => setOpenDrawer(false)}
//                 refresh={fetchProducts}
//             />

//             {/* Details Drawer */}
//             <LoanProductDetailsDrawer
//                 open={detailDrawerOpen}
//                 onClose={() => setDetailDrawerOpen(false)}
//                 product={selectedProduct}
//             />


//         </div>
//     );
// }








import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaWallet,
    FaPlus,
    FaChevronLeft,
    FaChevronRight,
    FaChevronDown,
    FaChevronUp,
} from "react-icons/fa";
import AddProducts from "./AddLoanProducts";
import LoanProductDetailsDrawer from "./LoanProductDetailsDrawer";
import NotFoundImage from "/assets/scopefinding.png";

export default function LoanProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDrawer, setOpenDrawer] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

    // Pagination & search
    const [search, setSearch] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchProducts();
    }, [search, pageIndex, pageSize]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_LOANING_URL}/api/Loansetups/GetLoanProducts?search=${search}&pageIndex=${pageIndex}&pageSize=${pageSize}`
            );
            const json = await res.json();
            setProducts(json.Data || []);
            // Assuming API also provides total count in a field; if not, fallback
            setTotalCount(json.TotalCount || (json.Data ? json.Data.length : 0));
        } catch (err) {
            console.error("Fetch Loan Products Error:", err);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPageIndex(0); // reset to first page on new search
    };

    const handlePageChange = (newIndex) => {
        if (newIndex >= 0 && newIndex * pageSize < totalCount) {
            setPageIndex(newIndex);
        }
    };

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setPageIndex(0); // reset page index
    };

    const openDetailDrawerFn = (p) => {
        setSelectedProduct(p);
        setDetailDrawerOpen(true);
    };

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaWallet /> Loan Products
                </h2>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                    onClick={() => setOpenDrawer(true)}
                >
                    <FaPlus /> Add Loan Product
                </Button>
            </div>

            {/* Search & Page Size */}
            <div className="flex justify-between items-center mb-4">
                <input
                    type="text"
                    placeholder="Search Loan Products..."
                    value={search}
                    onChange={handleSearchChange}
                    className="border p-2 rounded-lg w-1/3"
                />
                <select
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    className="border p-2 rounded-lg"
                >
                    {[5, 10, 20, 50].map((s) => (
                        <option key={s} value={s}>
                            {s} per page
                        </option>
                    ))}
                </select>
            </div>

            {/* Table Header */}
            <div className="bg-gray-200 p-4 rounded-sm">
                <div className="grid grid-cols-9 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-3">Description</span>
                    <span className="col-span-2">Code</span>
                    {/* <span className="col-span-3">Priority</span> */}
                    <span className="col-span-2">Interest %</span>
                    <span className="col-span-2 text-right">Actions</span>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                                {Array.from({ length: 12 }).map((_, j) => (
                                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <div className="space-y-2">
                        {products.map((p) => (
                            <div key={p.Id} className="bg-white rounded-lg shadow-lg border">
                                <div className="grid grid-cols-9 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                                    <span className="font-medium text-indigo-700 col-span-3">{p.Description}</span>
                                    <span className="col-span-2">{p.PaddedCode}</span>
                                    {/* <span className="col-span-3">{p.Priority}</span> */}
                                    <span className="col-span-2 flex gap-1 items-center">{p.LoanInterestAnnualPercentageRate}%</span>
                                    <span className="col-span-2 text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-gray-700 hover:bg-gray-600 text-white"
                                            onClick={() => openDetailDrawerFn(p)}
                                        >
                                            Details
                                        </Button>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500 text-center mt-4">
                        <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
                        <p className="font-medium text-gray-400">No Loan Products Found.</p>
                    </div>
                )}

                {/* Pagination */}
                <div className="flex justify-center items-center mt-4">
                    <Button
                        size="sm"
                        disabled={pageIndex === 0}
                        onClick={() => handlePageChange(pageIndex - 1)}
                        className="flex items-center gap-1 m-2"
                    >
                        <FaChevronLeft /> Prev
                    </Button>
                    <span>
                        Page {pageIndex + 1} of {Math.ceil(totalCount / pageSize)}
                    </span>
                    <Button
                        size="sm"
                        disabled={(pageIndex + 1) * pageSize >= totalCount}
                        onClick={() => handlePageChange(pageIndex + 1)}
                        className="flex items-center gap-1 m-2"
                    >
                        Next <FaChevronRight />
                    </Button>
                </div>
            </div>

            {/* ADD PRODUCT DRAWER */}
            <AddProducts open={openDrawer} onClose={() => setOpenDrawer(false)} refresh={fetchProducts} />

            {/* Details Drawer */}
            <LoanProductDetailsDrawer open={detailDrawerOpen} onClose={() => setDetailDrawerOpen(false)} product={selectedProduct} />
        </div>
    );
}
