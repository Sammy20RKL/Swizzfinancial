import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MdPayments } from "react-icons/md";
import IncomeStatement from "./IncomeStatement";
import ConsolidatedBalanceSheet from "./ConsolidatedBalanceSheet";
import ConsolidatedTrialBalance from "./ConsolidatedTrialBalance";
import SASRAForm6 from "./SASRAForm6";



export default function FinanceReports() {
    const [selectedUserId, setSelectedUserId] = useState(null);


    const users = [
        { id: 1, name: "Income Statement", subtitle: "Profit & Loss Statement" },
        { id: 2, name: "Consolidated Balance Sheet", subtitle: "Statement of Financial Position" },
        { id: 3, name: "Consolidated Trial Balance", subtitle: "Debit & Credit Balances" },
        // { id: 4, name: "SASRAForm", subtitle: "Form" },
    ];

    const user = users.find((u) => u.id === selectedUserId) || users[0];

    const renderContent = () => {
        switch (user.name) {
            case "Income Statement":
                return <IncomeStatement />;
            case "Consolidated Balance Sheet":
                return <ConsolidatedBalanceSheet />;
            case "Consolidated Trial Balance":
                return <ConsolidatedTrialBalance />;
            // case "SASRAForm":
            //     return <SASRAForm6 />;
            default:
                return (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">Select an option from the sidebar</p>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-screen bg-slate-50">
            {/* RIGHT SIDEBAR */}
            <aside className="w-72 border-r bg-white p-4 flex flex-col shadow-lg">
                <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <MdPayments className="text-white" /> Finance Reports
                    </h2>
                </div>

                <ScrollArea className="flex-1">
                    <div className="space-y-2 p-2 bg-gray-200 rounded-xl">
                        {users.map((u) => (
                            <Card
                                key={u.id}
                                onClick={() => setSelectedUserId(u.id)}
                                className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
                                    user.id === u.id 
                                        ? "bg-indigo-800 text-white border-indigo-800" 
                                        : "hover:bg-gray-50"
                                }`}
                            >
                                <p className="text-sm font-medium">{u.name}</p>
                                <p
                                    className={`text-xs ${
                                        user.id === u.id
                                            ? "text-indigo-100"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    {u.subtitle}
                                </p>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
                
                {/* Footer with info */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        Financial Reports System
                    </p>
                    <p className="text-xs text-gray-400 text-center mt-1">
                        Rubani Sacco Limited
                    </p>
                </div>
            </aside>
            
            {/* MAIN CONTENT */}
            <main className="flex-1 overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
}