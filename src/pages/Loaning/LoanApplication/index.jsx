import * as React from "react";
import { useState } from "react";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";
import {
    FaFileAlt,
    FaPaperPlane,
    FaCheckCircle,
    FaTimesCircle,
    FaPlus,
    FaListAlt,
    FaMoneyCheckAlt,
} from "react-icons/fa";
import { Button } from "@/components/ui/button";

/* Loan process components */
import LoanDrafts from "./LoanDrafts";
import LoanApproved from "./LoanApproved";
import LoanDisbursed from "./LoanDisbursed";
import LoanRejected from "./LoanRejected";
import LoanAppraised from "./LoanAppraised";
import AddLoanApplicationDrawer from "./AddLoanApplicationDrawer/AddLoanApplicationDrawer";
import { LoanApplicationProvider } from "./AddLoanApplicationDrawer/LoanApplicationContext";
import RestructuredLoans from "./RestructuredLoans";

export default function LoanApplication() {
    const [addDrawerOpen, setAddDrawerOpen] = useState(false);

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative flex flex-col">

            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-4 rounded-2xl shadow">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaListAlt /> Loan Applications
                </h2>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                    onClick={() => setAddDrawerOpen(true)}
                >
                    <FaPlus /> New Loan Application
                </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="draft">
                <TabsList className="flex flex-wrap justify-center gap-3 bg-indigo-800 text-white rounded-xl p-2 min-h-15 shadow-inner">

                    <TabsTrigger
                        value="draft"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg 
            data-[state=active]:bg-indigo-600 data-[state=active]:text-white hover:bg-indigo-600 hover:text-white transition"
                    >
                        <FaFileAlt /> Draft
                    </TabsTrigger>

                    <TabsTrigger
                        value="appraised"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg 
            data-[state=active]:bg-indigo-600 data-[state=active]:text-white hover:bg-indigo-600 hover:text-white transition"
                    >
                        <FaPaperPlane /> Appraised
                    </TabsTrigger>

                    <div className="flex bg-gray-100 rounded-lg p-1 shadow-md">
                        <TabsTrigger
                            value="approved"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg 
              data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-indigo-700 hover:text-white hover:bg-indigo-600 transition"
                        >
                            <FaCheckCircle /> Approved
                        </TabsTrigger>

                        <span className="px-2 text-indigo-700 font-semibold">|</span>

                        <TabsTrigger
                            value="rejected"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg 
              data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-indigo-700 hover:text-white hover:bg-indigo-600 transition"
                        >
                            <FaTimesCircle /> Rejected
                        </TabsTrigger>
                    </div>



                    <TabsTrigger
                        value="disbursed"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg 
            data-[state=active]:bg-indigo-600 data-[state=active]:text-white  hover:bg-indigo-600 hover:text-white transition"
                    >
                        <FaMoneyCheckAlt /> Disbursed
                    </TabsTrigger>
                    <TabsTrigger
                        value="Restructured"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg 
            data-[state=active]:bg-indigo-600 data-[state=active]:text-white  hover:bg-indigo-600 hover:text-white transition"
                    >
                        <FaMoneyCheckAlt /> Restructured
                    </TabsTrigger>
                </TabsList>

                {/* Tab Contents */}
                <TabsContent value="draft">
                    <LoanDrafts />
                </TabsContent>

                <TabsContent value="appraised">
                    <LoanAppraised />
                </TabsContent>

                <TabsContent value="approved">
                    <LoanApproved />
                </TabsContent>

                <TabsContent value="disbursed">
                    <LoanDisbursed />
                </TabsContent>

                <TabsContent value="rejected">
                    <LoanRejected />
                </TabsContent>
                <TabsContent value="Restructured">
                    <RestructuredLoans />
                </TabsContent>
            </Tabs>

            {/* Drawer */}
            <LoanApplicationProvider>
                <AddLoanApplicationDrawer
                    open={addDrawerOpen}
                    onClose={() => setAddDrawerOpen(false)}
                />
            </LoanApplicationProvider>
        </div>
    );
}
