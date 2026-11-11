


import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FaUniversity, FaPlus, FaDollarSign } from "react-icons/fa";
import AddBankWithLinkagesDrawer from "./AddBankWithLinkagesDrawer";
import NotFoundImage from "/assets/scopefinding.png";

export default function BankLinkages() {
  const [linkages, setLinkages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchLinkages = () => {
    fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/getBankWithLinkages`)
      .then((res) => res.json())
      .then((data) => {
        setLinkages(data.Data || []);
        setLoading(false);
        console.log("API response:", data);
        console.log("Data.Data:", data.Data, Array.isArray(data.Data));
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLinkages();
  }, []);



  console.log(linkages)


  return (
    <div className="bg-white px-8 py-8  rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaUniversity /> Banks
        </h2>
        <Button
          onClick={() => setDrawerOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
        >
          <FaPlus /> Add Bank
        </Button>
      </div>

      {/* Table Header */}
      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-6 gap-2 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span>No</span>
          <span>Bank Name</span>
          <span>Branch</span>
          <span>Address</span>
          <span>Chart Of Account</span>
          <span className="text-right">Balance</span>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-6 gap-2 bg-gray-50 p-3 rounded"
              >
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        ) : linkages.length > 0 ? (
          <div className="space-y-2">
            {linkages && linkages.map((link, idx) => (
              <div
                key={link.Id}
                className="grid grid-cols-6 gap-2 items-center bg-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer border"
              >
                <span className="font-medium text-indigo-700">{idx + 1}</span>
                <span className="font-medium text-gray-900">{link.BankName}</span>
                <span>{link.BankBranchName}</span>
                <span>{link.Address}</span>
                <span className="text-gray-600">{link.ChartOfAccountName}</span>
                <span
                  className={`text-right font-semibold bg-gray-100 rounded-lg py-2 px-4 ${link.BankLinkageBalance >= 0
                    ? "text-green-600"
                    : "text-red-600"
                    }`}
                >
                  <FaDollarSign className="inline mr-1" />
                  {link.BankLinkageBalance.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img
              src={NotFoundImage}
              alt="Not Found"
              className="mx-auto w-42 h-auto"
            />
            <p className="font-medium text-gray-400">No banks found.</p>
          </div>
        )}
      </div>
      {/* Drawer */}
      <AddBankWithLinkagesDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          fetchLinkages(); // refresh after adding
        }}
      />
    </div>
  );
}
