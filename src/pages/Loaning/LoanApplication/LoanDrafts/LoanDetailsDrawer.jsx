import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function LoanDetailsDrawer({ open, onClose, loan }) {
    if (!loan) return null;

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
                        className="fixed top-3 right-3 w-[85vw] max-w-[900px] bg-white shadow-2xl z-50 rounded-2xl flex flex-col overflow-y-auto max-h-[90vh]"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        <div className="p-3 m-1 space-y-4">

                            {/* Header */}
                            <div className="flex justify-between bg-indigo-600 p-2 rounded-2xl mb-2 text-white font-semibold">
                                <span className="flex items-center ml-3">
                                    Loan Case Number - {loan.CaseNumber?.toString()} Details
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="text-gray-600"
                                >
                                    Close
                                </Button>
                            </div>

                            {/* Customer Info */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-2">
                                <h3 className="font-bold text-white bg-gray-600 p-2 pl-4 rounded-lg mb-4">
                                    Customer Information
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span><b>Name:</b> {loan.CustomerIndividualFirstName + " " + loan.CustomerIndividualLastName}</span>
                                    <span><b>ID Number:</b> {loan.CustomerIndividualIdentityCardNumber}</span>
                                    <span><b>Email:</b> {loan.CustomerAddressEmail}</span>
                                    <span><b>Phone:</b> {loan.CustomerAddressMobileLine}</span>
                                    <span><b>Employer:</b> {loan.CustomerStationZoneDivisionEmployerDescription}</span>
                                    <span><b>Branch:</b> {loan.BranchDescription}</span>
                                </div>
                            </div>

                            {/* Loan Info */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-2">
                                <h3 className="font-bold text-white bg-gray-600 p-2 pl-4 rounded-lg mb-4">
                                    Loan Information
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span><b>Loan Product:</b> {loan.LoanProductDescription}</span>
                                    <span><b>Status:</b> {loan.StatusDescription}</span>
                                    <span><b>Amount Applied:</b> Ksh {loan.AmountApplied}</span>
                                    <span><b>Interest Rate (%):</b> {loan.LoanInterestAnnualPercentageRate}</span>
                                    <span><b>Term (Months):</b> {loan.LoanRegistrationTermInMonths}</span>
                                    <span><b>Payment Frequency:</b> {loan.LoanRegistrationPaymentFrequencyPerYearDescription}</span>
                                    <span><b>Received Date:</b> {new Date(loan.ReceivedDate).toLocaleString()}</span>
                                    {/* <span><b>Case Reference:</b> {loan.Reference}</span> */}
                                </div>
                            </div>

                            {/* Financial Appraisal */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-2">
                                <h3 className="font-bold text-white bg-gray-600 p-2 pl-4 rounded-lg mb-4">
                                    Financial Appraisal
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {/* <span><b>System Appraised Amount:</b> {loan.SystemAppraisedAmount}</span> */}
                                    <span><b>Appraised Amount:</b> {loan.AppraisedAmount}</span>
                                    <span><b>Approved Amount:</b> {loan.ApprovedAmount}</span>
                                    <span><b>Monthly Payback:</b> {loan.MonthlyPaybackAmount}</span>
                                    <span><b>Total Payback:</b> {loan.TotalPaybackAmount}</span>
                                    {/* <span><b>Ability to Pay:</b> {loan.AppraisedAbility}</span> */}
                                </div>
                            </div>



                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
