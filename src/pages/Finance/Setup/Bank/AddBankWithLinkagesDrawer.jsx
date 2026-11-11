import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Swal from "sweetalert2";

export default function AddBankWithLinkagesDrawer({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    Description: "",
    BankName: "",
    Address: "",
    City: "",
    SwiftCode: "",
    IbanNo: "",
    Branches: [
      {
        Description: "",
        AddressAddressLine1: "",
        AddressAddressLine2: "",
        AddressStreet: "",
        AddressPostalCode: "",
        AddressCity: "",
        AddressEmail: "",
        AddressLandLine: "",
        AddressMobileLine: "",
        ContactPerson: "",
        PhoneNumber: "",
      },
    ],
  });

  const [linkageForm, setLinkageForm] = useState({
    BankAccountNumber: "",
    BranchId: "",
    ChartOfAccountId: "",
    Remarks: "",
    IsLocked: false,
    ChartOfAccountCostCenterId: "",
  });

  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchChartOfAccounts = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_APP_FIN_URL}/api/values/GetChartOfAccount`
        );
        const data = await res.json();

        console.log(data)
        if (data.Success) setChartOfAccounts(data.Data);
      } catch (err) {
        console.error("Error fetching chart of accounts:", err);
      }
    };
    fetchChartOfAccounts();
  }, []);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_APP_FIN_URL}/api/values/branches`
        );
        const data = await res.json();
        console.log(data);
        if (data.Success) setBranches(data.Data);
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };
    fetchBranches();
  }, []);

  const updateBranchField = (idx, field, value) => {
    const newBranches = [...formData.Branches];
    newBranches[idx][field] = value;
    setFormData({ ...formData, Branches: newBranches });
  };

  const addBranch = () => {
    setFormData({
      ...formData,
      Branches: [
        ...formData.Branches,
        {
          Description: "",
          AddressAddressLine1: "",
          AddressAddressLine2: "",
          AddressStreet: "",
          AddressPostalCode: "",
          AddressCity: "",
          AddressEmail: "",
          AddressLandLine: "",
          AddressMobileLine: "",
          ContactPerson: "",
          PhoneNumber: "",
        },
      ],
    });
  };

  const removeBranch = (idx) => {
    const newBranches = formData.Branches.filter((_, i) => i !== idx);
    setFormData({ ...formData, Branches: newBranches });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const createdDate = new Date().toISOString();
    const payload = {
      CreatedDate: createdDate,
      BankName: formData.BankName,
      Description: formData.BankName,
      Address: formData.Address,
      City: formData.City,
      SwiftCode: formData.SwiftCode,
      IbanNo: formData.IbanNo,
      BankBranchesDTO: formData.Branches.map((b, idx) => ({
        ...b,
        Code: 0, // auto-generated on server
        PaddedCode: "",
        BankCode: 0,
        BankDescription: formData.Description,
        CreatedDate: createdDate,
      })),
      BankBranchName: "Westlands Branch",
      BankAccountNumber: linkageForm.BankAccountNumber,
      Remarks: linkageForm.Remarks,
      IsLocked: linkageForm.IsLocked,
      BranchId: linkageForm.BranchId,
      ChartOfAccountId: linkageForm.ChartOfAccountId,
      ChartOfAccountAccountType: 1000,
      ChartOfAccountCostCenterId: linkageForm.ChartOfAccountCostCenterId,
    };

    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_FIN_URL}/api/values/AddBankWithLinkages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Failed to add bank linkage");

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Bank with linkages added successfully!",
        confirmButtonColor: "#2563eb",
      });

      setFormData({
        Description: "",
        BankName: "",
        Address: "",
        City: "",
        SwiftCode: "",
        IbanNo: "",
        Branches: [
          {
            Description: "",
            AddressAddressLine1: "",
            AddressAddressLine2: "",
            AddressStreet: "",
            AddressPostalCode: "",
            AddressCity: "",
            AddressEmail: "",
            AddressLandLine: "",
            AddressMobileLine: "",
            ContactPerson: "",
            PhoneNumber: "",
          },
        ],
      });
      setLinkageForm({
        BankAccountNumber: "",
        BranchId: "",
        ChartOfAccountId: "",
        Remarks: "",
        IsLocked: false,
        ChartOfAccountCostCenterId: "",
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add bank with linkages. Please try again.",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 right-0 h-full w-[720px] bg-white shadow-xl z-50 flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center border-b">
              <h2 className="font-bold text-lg">Add Bank with Linkages</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Bank Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Bank Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Bank Name"
                      value={formData.BankName}
                      onChange={(e) =>
                        setFormData({ ...formData, BankName: e.target.value })
                      }
                      required
                    />

                    <Input
                      placeholder="Address"
                      value={formData.Address}
                      onChange={(e) =>
                        setFormData({ ...formData, Address: e.target.value })
                      }
                    />
                    <Input
                      placeholder="City"
                      value={formData.City}
                      onChange={(e) =>
                        setFormData({ ...formData, City: e.target.value })
                      }
                    />
                    <Input
                      placeholder="SwiftCode"
                      value={formData.SwiftCode}
                      onChange={(e) =>
                        setFormData({ ...formData, SwiftCode: e.target.value })
                      }
                    />
                    <Input
                      placeholder="IbanNo"
                      value={formData.IbanNo}
                      onChange={(e) =>
                        setFormData({ ...formData, IbanNo: e.target.value })
                      }
                    />
                  </CardContent>
                </Card>

                {/* Branches */}
                {formData.Branches.map((branch, idx) => (
                  <Card key={idx}>
                    <CardHeader className="flex justify-between items-center">
                      <CardTitle>Branch {idx + 1}</CardTitle>
                      {formData.Branches.length > 1 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeBranch(idx)}
                        >
                          Remove
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Branch Name"
                        value={branch.Description}
                        onChange={(e) =>
                          updateBranchField(idx, "Description", e.target.value)
                        }
                        required
                      />
                      <Input
                        placeholder="Address Line 1"
                        value={branch.AddressAddressLine1}
                        onChange={(e) =>
                          updateBranchField(idx, "AddressAddressLine1", e.target.value)
                        }
                      />
                      <Input
                        placeholder="Address Line 2"
                        value={branch.AddressAddressLine2}
                        onChange={(e) =>
                          updateBranchField(idx, "AddressAddressLine2", e.target.value)
                        }
                      />
                      <Input
                        placeholder="Street"
                        value={branch.AddressStreet}
                        onChange={(e) =>
                          updateBranchField(idx, "AddressStreet", e.target.value)
                        }
                      />
                      <Input
                        placeholder="Postal Code"
                        value={branch.AddressPostalCode}
                        onChange={(e) =>
                          updateBranchField(idx, "AddressPostalCode", e.target.value)
                        }
                      />
                      <Input
                        placeholder="City"
                        value={branch.AddressCity}
                        onChange={(e) =>
                          updateBranchField(idx, "AddressCity", e.target.value)
                        }
                      />
                      <Input
                        placeholder="Email"
                        value={branch.AddressEmail}
                        onChange={(e) =>
                          updateBranchField(idx, "AddressEmail", e.target.value)
                        }
                      />
                      <Input
                        placeholder="Landline"
                        value={branch.AddressLandLine}
                        onChange={(e) =>
                          updateBranchField(idx, "AddressLandLine", e.target.value)
                        }
                      />
                      <Input
                        placeholder="Mobile"
                        value={branch.AddressMobileLine}
                        onChange={(e) =>
                          updateBranchField(idx, "AddressMobileLine", e.target.value)
                        }
                      />
                      <Input
                        placeholder="Contact Person"
                        value={branch.ContactPerson}
                        onChange={(e) =>
                          updateBranchField(idx, "ContactPerson", e.target.value)
                        }
                      />
                      <Input
                        placeholder="Phone Number"
                        value={branch.PhoneNumber}
                        onChange={(e) =>
                          updateBranchField(idx, "PhoneNumber", e.target.value)
                        }
                      />
                    </CardContent>
                  </Card>
                ))}

                <Button variant="outline" className="mt-2" onClick={addBranch}>
                  Add Branch
                </Button>

                {/* Bank Linkage */}
                <Card>
                  <CardHeader>
                    <CardTitle>Bank Linkage Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Bank Account Number"
                      value={linkageForm.BankAccountNumber}
                      onChange={(e) =>
                        setLinkageForm({
                          ...linkageForm,
                          BankAccountNumber: e.target.value,
                        })
                      }
                    />

                    {/* Branch Dropdown */}
                    <div className="flex flex-col">
                      <Label>Branch</Label>
                      <Select
                        value={linkageForm.BranchId}
                        onValueChange={(value) =>
                          setLinkageForm({ ...linkageForm, BranchId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Branch" />
                        </SelectTrigger>
                        <SelectContent className="max-h-100 overflow-y-auto">
                          {branches.map((b) => (
                            <SelectItem key={b.Id} value={b.Id}>
                              {b.Description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Chart of Account Dropdown */}
                    <div className="flex flex-col">
                      <Label>Chart Of Account</Label>
                      <Select
                        value={linkageForm.ChartOfAccountId}
                        onValueChange={(value) =>
                          setLinkageForm({ ...linkageForm, ChartOfAccountId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Account" />
                        </SelectTrigger>
                        <SelectContent className="max-h-100 overflow-y-auto">
                          {chartOfAccounts.map((account) => (
                            <SelectItem key={account.Id} value={account.Id}>
                              {account.AccountName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Input
                      placeholder="Remarks"
                      value={linkageForm.Remarks}
                      onChange={(e) =>
                        setLinkageForm({ ...linkageForm, Remarks: e.target.value })
                      }
                    />

                    <div className="flex items-center gap-2 mt-2">
                      <Checkbox
                        checked={linkageForm.IsLocked}
                        onCheckedChange={(checked) =>
                          setLinkageForm({ ...linkageForm, IsLocked: checked })
                        }
                      />
                      <Label>Locked</Label>
                    </div>
                  </CardContent>
                </Card>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Saving..." : "Save Bank"}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}




// import { useEffect, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Checkbox } from "@/components/ui/checkbox";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import Swal from "sweetalert2";
// import { FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa";

// export default function AddBankWithLinkagesDrawer({ open, onClose, onSuccess }) {
//   const [formData, setFormData] = useState({
//     Description: "",
//     BankName: "",
//     Address: "",
//     City: "",
//     SwiftCode: "",
//     IbanNo: "",
//     Branches: [
//       {
//         Description: "",
//         AddressAddressLine1: "",
//         AddressAddressLine2: "",
//         AddressStreet: "",
//         AddressPostalCode: "",
//         AddressCity: "",
//         AddressEmail: "",
//         AddressLandLine: "",
//         AddressMobileLine: "",
//         ContactPerson: "",
//         PhoneNumber: "",
//       },
//     ],
//     Linkages: [],
//   });

//   const [expandedBranch, setExpandedBranch] = useState(null);
//   const [expandedLinkage, setExpandedLinkage] = useState(null);
//   const [chartOfAccounts, setChartOfAccounts] = useState([]);
//   const [branches, setBranches] = useState([]);
//   const [loading, setLoading] = useState(false);

//   // Sub-drawer state for linkages
//   const [linkageDrawerOpen, setLinkageDrawerOpen] = useState(false);
//   const [newLinkage, setNewLinkage] = useState({
//     BankAccountNumber: "",
//     BranchId: "",
//     ChartOfAccountId: "",
//     Remarks: "",
//     IsLocked: false,
//     ChartOfAccountCostCenterId: "",
//   });

//   // Fetch chart of accounts
//   useEffect(() => {
//     const fetchChartOfAccounts = async () => {
//       try {
//         const res = await fetch(
//           `${import.meta.env.VITE_APP_FIN_URL}/api/values/GetChartOfAccount`,
//           { headers: { "ngrok-skip-browser-warning": "true" } }
//         );
//         const data = await res.json();
//         if (data.Success) setChartOfAccounts(data.Data);
//       } catch (err) {
//         console.error("Error fetching chart of accounts:", err);
//       }
//     };
//     fetchChartOfAccounts();
//   }, []);

//   // Fetch branches
//   useEffect(() => {
//     const fetchBranches = async () => {
//       try {
//         const res = await fetch(
//           `${import.meta.env.VITE_APP_FIN_URL}/api/values/branches`,
//           { headers: { "ngrok-skip-browser-warning": "true" } }
//         );
//         const data = await res.json();
//         if (data.Success) setBranches(data.Data);
//       } catch (err) {
//         console.error("Error fetching branches:", err);
//       }
//     };
//     fetchBranches();
//   }, []);

//   // Branch handlers
//   const updateBranchField = (idx, field, value) => {
//     const newBranches = [...formData.Branches];
//     newBranches[idx][field] = value;
//     setFormData({ ...formData, Branches: newBranches });
//   };

//   const addBranch = () => {
//     setFormData({
//       ...formData,
//       Branches: [
//         ...formData.Branches,
//         {
//           Description: "",
//           AddressAddressLine1: "",
//           AddressAddressLine2: "",
//           AddressStreet: "",
//           AddressPostalCode: "",
//           AddressCity: "",
//           AddressEmail: "",
//           AddressLandLine: "",
//           AddressMobileLine: "",
//           ContactPerson: "",
//           PhoneNumber: "",
//         },
//       ],
//     });
//     setExpandedBranch(formData.Branches.length); // auto expand
//   };

//   const removeBranch = (idx) => {
//     const newBranches = formData.Branches.filter((_, i) => i !== idx);
//     setFormData({ ...formData, Branches: newBranches });
//     setExpandedBranch(null);
//   };

//   // Linkage handlers
//   const addLinkage = () => {
//     setFormData({
//       ...formData,
//       Linkages: [...formData.Linkages, newLinkage],
//     });
//     setNewLinkage({
//       BankAccountNumber: "",
//       BranchId: "",
//       ChartOfAccountId: "",
//       Remarks: "",
//       IsLocked: false,
//       ChartOfAccountCostCenterId: "",
//     });
//     setLinkageDrawerOpen(false);
//   };

//   const removeLinkage = (idx) => {
//     const newLinkages = formData.Linkages.filter((_, i) => i !== idx);
//     setFormData({ ...formData, Linkages: newLinkages });
//     setExpandedLinkage(null);
//   };

//   // Submit handler
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     const createdDate = new Date().toISOString();
//     const payload = {
//       CreatedDate: createdDate,
//       BankName: formData.BankName,
//       Description: formData.BankName,
//       Address: formData.Address,
//       City: formData.City,
//       SwiftCode: formData.SwiftCode,
//       IbanNo: formData.IbanNo,
//       BankBranchesDTO: formData.Branches.map((b) => ({
//         ...b,
//         Code: 0,
//         PaddedCode: "",
//         BankCode: 0,
//         BankDescription: formData.Description,
//         CreatedDate: createdDate,
//       })),
//       Linkages: formData.Linkages,
//     };

//     try {
//       const res = await fetch(
//         `${import.meta.env.VITE_APP_FIN_URL}/api/values/AddBankWithLinkages`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
//           body: JSON.stringify(payload),
//         }
//       );

//       if (!res.ok) throw new Error("Failed to add bank linkage");

//       Swal.fire("Success", "Bank with linkages added successfully!", "success");

//       // reset
//       setFormData({
//         Description: "",
//         BankName: "",
//         Address: "",
//         City: "",
//         SwiftCode: "",
//         IbanNo: "",
//         Branches: [
//           {
//             Description: "",
//             AddressAddressLine1: "",
//             AddressAddressLine2: "",
//             AddressStreet: "",
//             AddressPostalCode: "",
//             AddressCity: "",
//             AddressEmail: "",
//             AddressLandLine: "",
//             AddressMobileLine: "",
//             ContactPerson: "",
//             PhoneNumber: "",
//           },
//         ],
//         Linkages: [],
//       });

//       if (onSuccess) onSuccess();
//       onClose();
//     } catch (err) {
//       console.error(err);
//       Swal.fire("Error", "Failed to add bank with linkages.", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <AnimatePresence>
//       {open && (
//         <>
//           {/* Backdrop */}
//           <motion.div
//             className="fixed inset-0 bg-black z-40"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 0.4 }}
//             exit={{ opacity: 0 }}
//             onClick={onClose}
//           />
//           {/* Main Drawer */}
//           <motion.div
//             className="fixed top-5 right-3 w-[600px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
//             initial={{ x: "100%" }}
//             animate={{ x: 0 }}
//             exit={{ x: "100%" }}
//             transition={{ type: "spring", stiffness: 300, damping: 30 }}
//           >
//             <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
//               <h2 className="font-bold text-lg text-white">Add Bank with Linkages</h2>
//               <Button variant="outline" size="sm" onClick={onClose}>
//                 Close
//               </Button>
//             </div>

//             <div className="p-3 flex-1 overflow-y-auto">
//               <form onSubmit={handleSubmit} className="space-y-4">
//                 {/* Bank Info */}
//                 <Input
//                   placeholder="Bank Name"
//                   value={formData.BankName}
//                   onChange={(e) => setFormData({ ...formData, BankName: e.target.value })}
//                   required
//                 />
//                 <Input placeholder="Address" value={formData.Address} onChange={(e) => setFormData({ ...formData, Address: e.target.value })} />
//                 <Input placeholder="City" value={formData.City} onChange={(e) => setFormData({ ...formData, City: e.target.value })} />
//                 <Input placeholder="Swift Code" value={formData.SwiftCode} onChange={(e) => setFormData({ ...formData, SwiftCode: e.target.value })} />
//                 <Input placeholder="Iban No" value={formData.IbanNo} onChange={(e) => setFormData({ ...formData, IbanNo: e.target.value })} />

//                 {/* Branch Section */}
//                 <div className="space-y-2">
//                   {formData.Branches.map((branch, idx) => (
//                     <div key={idx} className="border rounded-lg">
//                       <div
//                         className="flex justify-between items-center p-2 bg-gray-100 cursor-pointer"
//                         onClick={() => setExpandedBranch(expandedBranch === idx ? null : idx)}
//                       >
//                         <span className="font-semibold">
//                           Branch {idx + 1} - {branch.Description || "New Branch"}
//                         </span>
//                         <div className="flex items-center gap-3">
//                           {formData.Branches.length > 1 && (
//                             <button
//                               type="button"
//                               className="text-red-600 hover:text-red-800"
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 removeBranch(idx);
//                               }}
//                             >
//                               <FaTrash />
//                             </button>
//                           )}
//                           {expandedBranch === idx ? <FaChevronUp /> : <FaChevronDown />}
//                         </div>
//                       </div>
//                       <AnimatePresence>
//                         {expandedBranch === idx && (
//                           <motion.div
//                             initial={{ height: 0, opacity: 0 }}
//                             animate={{ height: "auto", opacity: 1 }}
//                             exit={{ height: 0, opacity: 0 }}
//                             className="overflow-hidden p-2 grid grid-cols-1 md:grid-cols-2 gap-2"
//                           >
//                             <Input placeholder="Branch Name" value={branch.Description} onChange={(e) => updateBranchField(idx, "Description", e.target.value)} />
//                             <Input placeholder="Address Line 1" value={branch.AddressAddressLine1} onChange={(e) => updateBranchField(idx, "AddressAddressLine1", e.target.value)} />
//                             <Input placeholder="City" value={branch.AddressCity} onChange={(e) => updateBranchField(idx, "AddressCity", e.target.value)} />
//                             <Input placeholder="Contact Person" value={branch.ContactPerson} onChange={(e) => updateBranchField(idx, "ContactPerson", e.target.value)} />
//                             <Input placeholder="Phone Number" value={branch.PhoneNumber} onChange={(e) => updateBranchField(idx, "PhoneNumber", e.target.value)} />
//                           </motion.div>
//                         )}
//                       </AnimatePresence>
//                     </div>
//                   ))}
//                   <Button type="button" onClick={addBranch} className="bg-indigo-600 w-full">
//                     + Add Branch
//                   </Button>
//                 </div>

//                 {/* Linkages Section */}
//                 <div className="space-y-2">
//                   {formData.Linkages.map((link, idx) => (
//                     <div key={idx} className="border rounded-lg">
//                       <div
//                         className="flex justify-between items-center p-2 bg-gray-100 cursor-pointer"
//                         onClick={() => setExpandedLinkage(expandedLinkage === idx ? null : idx)}
//                       >
//                         <span className="font-semibold">
//                           Linkage {idx + 1} - {link.BankAccountNumber || "New Linkage"}
//                         </span>
//                         <div className="flex items-center gap-3">
//                           <button
//                             type="button"
//                             className="text-red-600 hover:text-red-800"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               removeLinkage(idx);
//                             }}
//                           >
//                             <FaTrash />
//                           </button>
//                           {expandedLinkage === idx ? <FaChevronUp /> : <FaChevronDown />}
//                         </div>
//                       </div>
//                       <AnimatePresence>
//                         {expandedLinkage === idx && (
//                           <motion.div
//                             initial={{ height: 0, opacity: 0 }}
//                             animate={{ height: "auto", opacity: 1 }}
//                             exit={{ height: 0, opacity: 0 }}
//                             className="overflow-hidden p-2 space-y-2"
//                           >
//                             <p><strong>Account:</strong> {link.BankAccountNumber}</p>
//                             <p><strong>Branch:</strong> {branches.find(b => b.Id === link.BranchId)?.Description}</p>
//                             <p><strong>Account:</strong> {chartOfAccounts.find(c => c.Id === link.ChartOfAccountId)?.AccountName}</p>
//                             <p><strong>Remarks:</strong> {link.Remarks}</p>
//                             <p><strong>Locked:</strong> {link.IsLocked ? "Yes" : "No"}</p>
//                           </motion.div>
//                         )}
//                       </AnimatePresence>
//                     </div>
//                   ))}
//                   <Button type="button" onClick={() => setLinkageDrawerOpen(true)} className="bg-indigo-600 w-full">
//                     + Add Linkage
//                   </Button>
//                 </div>

//                 <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
//                   {loading ? "Saving..." : "Save Bank with Linkages"}
//                 </Button>
//               </form>
//             </div>
//           </motion.div>

//           {/* Sub-Drawer for Linkage */}
//           <AnimatePresence>
//             {linkageDrawerOpen && (
//               <>
//                 <motion.div
//                   className="fixed inset-0 bg-black z-50"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 0.4 }}
//                   exit={{ opacity: 0 }}
//                   onClick={() => setLinkageDrawerOpen(false)}
//                 />
//                 <motion.div
//                   className="fixed top-5 right-3 w-[500px] bg-white shadow-xl z-60 flex flex-col rounded-2xl p-3"
//                   initial={{ x: "100%" }}
//                   animate={{ x: 0 }}
//                   exit={{ x: "100%" }}
//                   transition={{ type: "spring", stiffness: 300, damping: 30 }}
//                 >
//                   <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
//                     <h2 className="font-bold text-lg text-white">Add Linkage</h2>
//                     <Button variant="outline" size="sm" onClick={() => setLinkageDrawerOpen(false)}>Close</Button>
//                   </div>
//                   <div className="p-3 flex-1 overflow-y-auto space-y-3">
//                     <Input placeholder="Bank Account Number" value={newLinkage.BankAccountNumber} onChange={(e) => setNewLinkage({ ...newLinkage, BankAccountNumber: e.target.value })} />
//                     <div>
//                       <Label>Branch</Label>
//                       <Select value={newLinkage.BranchId} onValueChange={(value) => setNewLinkage({ ...newLinkage, BranchId: value })}>
//                         <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
//                         <SelectContent>
//                           {branches.map((b) => (
//                             <SelectItem key={b.Id} value={b.Id}>{b.Description}</SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>
//                     <div>
//                       <Label>Chart of Account</Label>
//                       <Select value={newLinkage.ChartOfAccountId} onValueChange={(value) => setNewLinkage({ ...newLinkage, ChartOfAccountId: value })}>
//                         <SelectTrigger><SelectValue placeholder="Select Account" /></SelectTrigger>
//                         <SelectContent>
//                           {chartOfAccounts.map((a) => (
//                             <SelectItem key={a.Id} value={a.Id}>{a.AccountName}</SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>
//                     <Input placeholder="Remarks" value={newLinkage.Remarks} onChange={(e) => setNewLinkage({ ...newLinkage, Remarks: e.target.value })} />
//                     <div className="flex items-center gap-2">
//                       <Checkbox checked={newLinkage.IsLocked} onCheckedChange={(checked) => setNewLinkage({ ...newLinkage, IsLocked: checked })} />
//                       <span>Locked</span>
//                     </div>
//                   </div>
//                   <div className="p-3">
//                     <Button onClick={addLinkage} className="w-full bg-indigo-600 hover:bg-indigo-700">Save Linkage</Button>
//                   </div>
//                 </motion.div>
//               </>
//             )}
//           </AnimatePresence>
//         </>
//       )}
//     </AnimatePresence>
//   );
// }
