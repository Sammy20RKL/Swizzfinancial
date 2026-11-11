import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "flowbite-react";


import logo from "../../../assets/rubanilogo.jpeg";






const SummaryCard = ({ title, value }) => {
    const safeValue =
        value !== undefined && value !== null && !isNaN(value)
            ? Number(value).toLocaleString()
            : "0";

    return (
        <div className="bg-white rounded-xl shadow p-6">
            <p className="text-slate-500 text-sm">{title}</p>
            <p className="text-2xl font-bold text-slate-800 mt-2">
                {safeValue}
            </p>
        </div>
    );
};



export default function LoanCalculator() {
    const [schedule, setSchedule] = useState([]);
    const [loanAmount, setLoanAmount] = useState("");
    const [interestRate, setInterestRate] = useState("");
    const [loanTerm, setLoanTerm] = useState("");
    const [paymentFrequency, setPaymentFrequency] = useState("12");
    const [interestMode, setInterestMode] = useState("reducing");
    const [customers, setCustomers] = useState([]);
    const [searchValue, setSearchValue] = useState("");
    const [form, setForm] = useState({});
    const [openScheduleDrawer, setOpenScheduleDrawer] = useState(false);

    const [openCustomerModal, setOpenCustomerModal] = useState(false);
    const [customerQuery, setCustomerQuery] = useState("");


    useEffect(() => {
        fetch(`${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/customers`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) setCustomers(data.data || []);
            })
            .catch(() => {
                Swal.fire("Error", "Failed to load customers", "error");
            });
    }, []);

    const handleCustomerSelect = (value) => {
        setSearchValue(value);
        const selected = customers.find(
            (c) =>
                `${c.IndividualFirstName} | ${c.IdentificationNumber} | ${c.IndividualPayrollNumbers}` === value
        );
        if (!selected) return;
        setForm({
            CustomerId: selected.Id,
            CustomerFullName: `${selected.IndividualFirstName} ${selected.IndividualLastName}`,
            CustomerIndividualIdentityCardNumber: selected.IndividualIdentityCardNumber || "",
            CustomerIndividualPayrollNumbers: selected.IndividualPayrollNumbers || "",
            CustomerPersonalIdentificationNumber: selected.PersonalIdentificationNumber || "",
            CustomerAddressMobileLine: selected.AddressMobileLine || "",
            CustomerAddressEmail: selected.AddressEmail || "",
        });
    };

    const calculateLoan = () => {
        const principal = Number(loanAmount);
        const annualRate = Number(interestRate) / 100;
        const years = Number(loanTerm);
        const frequency = Number(paymentFrequency);

        if (!principal || !annualRate || !years || !frequency) {
            Swal.fire("Error", "Please fill all loan fields correctly", "error");
            return;
        }

        const periods = years * frequency;
        const rate = annualRate / frequency;
        let balance = principal;
        let payment = 0;

        if (interestMode === "reducing") {
            payment =
                (principal * rate * Math.pow(1 + rate, periods)) /
                (Math.pow(1 + rate, periods) - 1);
        } else if (interestMode === "flat") {
            const totalInterestFlat = principal * annualRate * years;
            payment = (principal + totalInterestFlat) / periods;
        } else { // simple interest
            payment = (principal + principal * annualRate * years) / periods;
        }

        const rows = [];
        let currentDate = new Date();

        for (let i = 1; i <= periods; i++) {
            let interest;
            if (interestMode === "reducing") {
                interest = balance * rate;
            } else if (interestMode === "flat") {
                interest = (principal * annualRate * years) / periods;
            } else {
                interest = (principal * annualRate) / frequency;
            }

            const principalPart = payment - interest;
            const endBalance = Math.max(balance - principalPart, 0);

            rows.push({
                paymentNumber: i,
                date: new Date(currentDate).toLocaleDateString(),
                beginningBalance: balance.toFixed(2),
                payment: payment.toFixed(2),
                principal: principalPart.toFixed(2),
                interest: interest.toFixed(2),
                endingBalance: endBalance.toFixed(2),
            });

            balance = endBalance;
            currentDate.setMonth(currentDate.getMonth() + 12 / frequency);
            if (balance <= 0) break;
        }

        setSchedule(rows);
        setSchedule(rows);

        setTimeout(() => {
            setOpenScheduleDrawer(true);
        }, 0);

        //setOpenScheduleDrawer(true);

    };

    const totalInterest = schedule
        .reduce((sum, r) => sum + Number(r.interest), 0)
        .toFixed(2);
    const totalPayable = schedule
        .reduce((sum, r) => sum + Number(r.payment), 0)
        .toFixed(2);

    const downloadSchedule = () => {
        if (!schedule.length) {
            Swal.fire("Error", "No schedule to download", "error");
            return;
        }

        // const doc = new jsPDF("p", "mm", "a4");

        // // HEADER
        // doc.setFontSize(14);
        // doc.text("RUBANI SACCO", 105, 15, { align: "center" });
        // doc.setFontSize(10);
        // doc.text("Rubani House, Off Airport North Embakasi", 105, 21, { align: "center" });
        // doc.text("rubanisacco@gmail.com", 105, 26, { align: "center" });
        // doc.line(15, 30, 195, 30);

        const doc = new jsPDF("p", "mm", "a4");

        // ===== HEADER WITH LOGO =====

        // Logo (left)
        doc.addImage(logo, "JPEG", 15, 10, 35, 15);

        // SACCO Name (centered)
        doc.setFont("times", "bold");
        doc.setFontSize(14);
        doc.text("RUBANI SACCO", 105, 15, { align: "center" });

        // Address
        doc.setFontSize(10);
        doc.setFont("times", "normal");
        doc.text("Rubani House, Off Airport North Embakasi", 105, 21, { align: "center" });

        // Email
        doc.text("rubanisacco@gmail.com", 105, 26, { align: "center" });

        // Divider line
        doc.line(15, 32, 195, 32);


        // REPORT TITLE
        // doc.setFontSize(12);
        // doc.text("LOAN REPAYMENT SCHEDULE", 105, 38, { align: "center" });

        doc.setFontSize(12);
        doc.setFont("times", "bold");
        doc.text("LOAN REPAYMENT SCHEDULE", 105, 40, { align: "center" });

        doc.setFontSize(10);
        doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 15, 44);

        // CUSTOMER DETAILS
        doc.setFontSize(10);
        doc.text(`Customer Name: ${form.CustomerFullName || ""}`, 15, 54);
        doc.text(`ID Number: ${form.CustomerIndividualIdentityCardNumber || ""}`, 15, 60);
        doc.text(`Payroll No: ${form.CustomerIndividualPayrollNumbers || ""}`, 15, 66);
        doc.text(`Loan Amount: ${Number(loanAmount).toLocaleString()}`, 120, 54);
        doc.text(`Interest Rate: ${interestRate}%`, 120, 60);
        doc.text(`Loan Term: ${loanTerm} Years`, 120, 66);

        // TABLE
        const tableColumn = ["#", "Date", "Beginning", "Payment", "Principal", "Interest", "Ending"];
        const tableRows = schedule.map(r => [
            r.paymentNumber,
            r.date,
            Number(r.beginningBalance).toLocaleString(),
            Number(r.payment).toLocaleString(),
            Number(r.principal).toLocaleString(),
            Number(r.interest).toLocaleString(),
            Number(r.endingBalance).toLocaleString()
        ]);



        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 75,
            styles: { fontSize: 8, halign: "right" },
            headStyles: { fillColor: [30, 64, 175], halign: "center" },
            columnStyles: {
                0: { halign: "center" },
                1: { halign: "left" }
            },
            theme: "grid",
            margin: { top: 75 }
        });


        // TOTALS
        const finalY = doc.lastAutoTable?.finalY
            ? doc.lastAutoTable.finalY + 10
            : 85;

        doc.setFontSize(10);
        doc.text(`Total Interest: ${Number(totalInterest).toLocaleString()}`, 15, finalY);
        doc.text(`Total Payable: ${Number(totalPayable).toLocaleString()}`, 15, finalY + 6);

        // FOOTER
        doc.setFontSize(8);
        doc.text("This is a system generated report.", 105, 285, { align: "center" });
        doc.text("For any queries, contact: rubanisacco@gmail.com", 105, 290, { align: "center" });

        doc.save("Loan_Repayment_Schedule.pdf");
    };

    return (
        <div className="min-h-screen bg-gray-50 py-4 m-5 rounded-lg">

            {/* HEADER */}
            <div className="bg-indigo-800 rounded-xl shadow p-4 max-w-6xl m-4">
                <h1 className="text-2xl font-bold text-gray-50">
                    Loan Calculator & Repayment Schedule
                </h1>
                <p className="text-gray-200">
                    Calculate loan repayments and view full amortization plan
                </p>
            </div>

            <div className=" bg-gray-200  rounded-lg m-4 p-4">

                <div className="max-w-6xl mx-auto space-y-8">


                    {/* CUSTOMER DETAILS */}

                    {/* CUSTOMER DETAILS */}
                    <div className="bg-white rounded-xl shadow p-6">
                        <h2 className="text-lg font-semibold mb-4 rounded-lg bg-indigo-700 text-gray-50 p-3">
                            Applicant Details
                        </h2>

                        <button
                            onClick={() => setOpenCustomerModal(true)}
                            className="w-full p-3 border rounded mb-4 text-left bg-gray-50 hover:bg-gray-100"
                        >
                            {form.CustomerFullName
                                ? `${form.CustomerFullName} | ${form.CustomerIndividualIdentityCardNumber} | ${form.CustomerIndividualPayrollNumbers}`
                                : "Select customer (Name | ID | Payroll)"}
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input className="p-2 rounded border" readOnly value={form.CustomerFullName || ""} placeholder="Full Name" />
                            <input className="p-2 rounded border" readOnly value={form.CustomerIndividualIdentityCardNumber || ""} placeholder="ID Number" />
                            <input className="p-2 rounded border" readOnly value={form.CustomerIndividualPayrollNumbers || ""} placeholder="Payroll Number" />
                            <input className="p-2 rounded border" readOnly value={form.CustomerPersonalIdentificationNumber || ""} placeholder="KRA PIN" />
                            <input className="p-2 rounded border" readOnly value={form.CustomerAddressMobileLine || ""} placeholder="Mobile" />
                            <input className="p-2 rounded border" readOnly value={form.CustomerAddressEmail || ""} placeholder="Email" />
                        </div>
                    </div>


                    {/* LOAN DETAILS */}
                    <div className="bg-white rounded-xl shadow p-6">
                        <h2 className="text-lg font-semibold mb-4 rounded-lg bg-indigo-700 text-gray-50 p-3">Loan Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="number"
                                className="p-2 rounded border"
                                value={loanAmount}
                                onChange={(e) => setLoanAmount(e.target.value)}
                                placeholder="Loan Amount"
                            />
                            <input
                                type="number"
                                className="p-2 rounded border"
                                value={interestRate}
                                onChange={(e) => setInterestRate(e.target.value)}
                                placeholder="Annual Interest (%)"
                            />
                            <input
                                type="number"
                                className="p-2 rounded border"
                                value={loanTerm}
                                onChange={(e) => setLoanTerm(e.target.value)}
                                placeholder="Loan Term (Years)"
                            />
                            <select className="p-2 rounded border" value={paymentFrequency} onChange={(e) => setPaymentFrequency(e.target.value)}>
                                <option value="12">Monthly</option>
                                <option value="4">Quarterly</option>
                                <option value="1">Annually</option>
                            </select>
                            <select className="p-2 rounded border" value={interestMode} onChange={(e) => setInterestMode(e.target.value)}>
                                <option value="reducing">Reducing Balance</option>
                                <option value="simple">Simple Interest</option>
                                <option value="flat">Flat Rate</option>
                            </select>
                        </div>

                        <button
                            onClick={calculateLoan}
                            className="mt-6 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold"
                        >
                            Calculate Loan
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {openScheduleDrawer && schedule.length > 0 && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            className="fixed inset-0 bg-black z-40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpenScheduleDrawer(false)}
                        />

                        {/* Drawer */}
                        <motion.div
                            className="fixed top-5 right-5 w-[90vw] max-w-[1050px] h-[94vh]
                           bg-white shadow-2xl z-50 flex flex-col rounded-2xl overflow-hidden"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 260, damping: 26 }}
                        >
                            {/* Header */}
                            <div className="p-4 bg-indigo-700 text-white flex justify-between items-center m-4 rounded-2xl">
                                <h2 className="font-bold text-lg">
                                    Loan Repayment Schedule
                                </h2>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-gray-100 bg-indigo-500"
                                    onClick={() => setOpenScheduleDrawer(false)}
                                >
                                    Close
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="p-5 overflow-y-auto flex-1 space-y-6 bg-gray-200 m-4 rounded-2xl">

                                {/* SUMMARY */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <SummaryCard
                                        title="Periodic Payment"
                                        value={schedule[0]?.payment}
                                    />
                                    <SummaryCard
                                        title="Total Interest"
                                        value={totalInterest}
                                    />
                                    <SummaryCard
                                        title="Total Payable"
                                        value={totalPayable}
                                    />
                                </div>

                                {/* TABLE */}
                                <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold">
                                            Full Repayment Schedule
                                        </h3>

                                        <button
                                            onClick={downloadSchedule}
                                            className="bg-blue-700 hover:bg-blue-800
                                           text-white px-5 py-2 rounded-lg font-semibold"
                                        >
                                            Download Schedule
                                        </button>
                                    </div>

                                    <table className="min-w-full text-sm border">
                                        <thead className="bg-slate-800 text-white">
                                            <tr>
                                                <th className="p-2">#</th>
                                                <th className="p-2">Date</th>
                                                <th className="p-2">Beginning</th>
                                                <th className="p-2">Payment</th>
                                                <th className="p-2">Principal</th>
                                                <th className="p-2">Interest</th>
                                                <th className="p-2">Ending</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {schedule.map((row, i) => (
                                                <tr key={i} className={i % 2 ? "bg-indigo-100" : ""}>
                                                    <td className="p-2 text-center">
                                                        {row.paymentNumber}
                                                    </td>
                                                    <td className="p-2">{row.date}</td>
                                                    <td className="p-2 text-right">
                                                        {Number(row.beginningBalance).toLocaleString()}
                                                    </td>
                                                    <td className="p-2 text-right">
                                                        {Number(row.payment).toLocaleString()}
                                                    </td>
                                                    <td className="p-2 text-right">
                                                        {Number(row.principal).toLocaleString()}
                                                    </td>
                                                    <td className="p-2 text-right">
                                                        {Number(row.interest).toLocaleString()}
                                                    </td>
                                                    <td className="p-2 text-right">
                                                        {Number(row.endingBalance).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>













            {/**select modal */}

            <AnimatePresence>
                {openCustomerModal && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            className="fixed inset-0 bg-black z-40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpenCustomerModal(false)}
                        />

                        {/* Modal */}
                        <motion.div
                            className="fixed top-1/2 left-1/2 z-50 w-[90vw] max-w-lg
                   -translate-x-1/2 -translate-y-1/2
                   bg-white rounded-2xl shadow-xl overflow-hidden p-3"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            {/* Header */}
                            <div className="bg-indigo-700 text-white p-4 flex justify-between items-center rounded-2xl">
                                <h3 className="font-semibold">Select Customer</h3>
                                <button onClick={() => setOpenCustomerModal(false)}>✕</button>
                            </div>

                            {/* Search */}
                            <div className="p-4 border-b">
                                <input
                                    className="w-full p-2 border rounded"
                                    placeholder="Search by name, ID, payroll..."
                                    value={customerQuery}
                                    onChange={(e) => setCustomerQuery(e.target.value)}
                                />
                            </div>

                            {/* List */}
                            <div className="max-h-[300px] overflow-y-auto divide-y">
                                {customers
                                    .filter(c =>
                                        `${c.IndividualFirstName} ${c.IndividualLastName} ${c.IdentificationNumber} ${c.IndividualPayrollNumbers}`
                                            .toLowerCase()
                                            .includes(customerQuery.toLowerCase())
                                    )
                                    .map(c => (
                                        <button
                                            key={c.Id}
                                            onClick={() => {
                                                setForm({
                                                    CustomerId: c.Id,
                                                    CustomerFullName: `${c.IndividualFirstName} ${c.IndividualLastName}`,
                                                    CustomerIndividualIdentityCardNumber: c.IndividualIdentityCardNumber || "",
                                                    CustomerIndividualPayrollNumbers: c.IndividualPayrollNumbers || "",
                                                    CustomerPersonalIdentificationNumber: c.PersonalIdentificationNumber || "",
                                                    CustomerAddressMobileLine: c.AddressMobileLine || "",
                                                    CustomerAddressEmail: c.AddressEmail || "",
                                                });
                                                setOpenCustomerModal(false);
                                                setCustomerQuery("");
                                            }}
                                            className="w-full text-left p-3 hover:bg-indigo-50"
                                        >
                                            <div className="font-medium">
                                                {c.IndividualFirstName} {c.IndividualLastName}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {/* ID: {c.IdentificationNumber}*/} Payroll: {c.IndividualPayrollNumbers}
                                            </div>
                                        </button>
                                    ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>


        </div>
    );
}

