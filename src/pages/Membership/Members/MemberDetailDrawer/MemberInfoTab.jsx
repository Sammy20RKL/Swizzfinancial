import React from "react";
import jsPDF from "jspdf";

export default function MemberInfoTab({ customer, age }) {

    const handlePrintPDF = () => {
        const doc = new jsPDF("p", "mm", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();

        let y = 20;

        /* ================= HEADER ================= */
        doc.setFillColor(79, 70, 229); // indigo
        doc.rect(0, 0, pageWidth, 35, "F");

        doc.setTextColor(255);
        doc.setFontSize(18);
        doc.text("MEMBER PROFILE", 14, 22);

        doc.setFontSize(10);
        doc.text(
            `Generated on: ${new Date().toLocaleDateString()}`,
            pageWidth - 14,
            22,
            { align: "right" }
        );

        y = 45;
        doc.setTextColor(0);

        /* ================= HELPERS ================= */
        const drawSection = (title, fields) => {
            // Section title background
            doc.setFillColor(243, 244, 246); // light gray
            doc.rect(14, y, pageWidth - 28, 8, "F");

            doc.setFontSize(12);
            doc.setTextColor(55, 65, 81);
            doc.text(title.toUpperCase(), 16, y + 6);

            y += 12;

            doc.setFontSize(10);
            doc.setTextColor(0);

            let leftX = 16;
            let rightX = pageWidth / 2 + 4;
            let rowHeight = 6;

            fields.forEach((field, index) => {
                const x = index % 2 === 0 ? leftX : rightX;
                const currentY = y + Math.floor(index / 2) * rowHeight;

                doc.setFont(undefined, "bold");
                doc.text(`${field.label}:`, x, currentY);

                doc.setFont(undefined, "normal");
                doc.text(
                    `${field.value ?? "N/A"}`,
                    x + 35,
                    currentY,
                    { maxWidth: pageWidth / 2 - 45 }
                );
            });

            y += Math.ceil(fields.length / 2) * rowHeight + 6;

            // Page break
            if (y > 260) {
                doc.addPage();
                y = 20;
            }
        };

        /* ================= SECTIONS ================= */
        drawSection("Personal Details", [
            { label: "Member No", value: customer.Reference2 },
            { label: "Full Name", value: `${customer.IndividualFirstName} ${customer.IndividualLastName}` },
            { label: "Salutation", value: customer.IndividualSalutationDescription },
            { label: "Gender", value: customer.IndividualGenderDescription },
            { label: "Marital Status", value: customer.IndividualMaritalStatusDescription },
            { label: "Nationality", value: customer.IndividualNationalityDescription },
            { label: "Birth Date", value: customer.IndividualBirthDate && new Date(customer.IndividualBirthDate).toLocaleDateString() },
            { label: "Age", value: age },
            { label: "Registration Date", value: customer.RegistrationDate && new Date(customer.RegistrationDate).toLocaleDateString() },
        ]);

        drawSection("Identification", [
            { label: "ID Type", value: customer.IndividualIdentityCardTypeDescription },
            { label: "ID Number", value: customer.IndividualIdentityCardNumber },
            { label: "Payroll No.", value: customer.IndividualPayrollNumbers },
            { label: "PIN", value: customer.PersonalIdentificationNumber },
            { label: "File Number", value: customer.Reference3 },
        ]);

        drawSection("Employment & Bank", [
            { label: "Designation", value: customer.IndividualEmploymentDesignation },
            { label: "Terms of Service", value: customer.IndividualEmploymentTermsOfServiceDescription },
            { label: "Bank", value: customer.BankName },
            { label: "Branch", value: customer.BranchName },
        ]);

        drawSection("Contact & Address", [
            { label: "Mobile", value: customer.AddressMobileLine },
            { label: "Email", value: customer.AddressEmail },
            { label: "City", value: customer.AddressCity },
            { label: "Address", value: customer.AddressAddressLine1 },
        ]);

        /* ================= FOOTER ================= */
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(120);
            doc.text(
                `Page ${i} of ${pageCount}`,
                pageWidth / 2,
                290,
                { align: "center" }
            );
        }

        doc.save(`Member_Profile_${customer.IndividualIdentityCardNumber}.pdf`);
    };

    if (!customer) return null;

    const Field = ({ label, value }) => (
        <p className="text-sm">
            <span className="font-medium">{label}: </span>
            {value ?? "N/A"}
        </p>
    );

    const Section = ({ title, children }) => (
        <div className="border rounded-xl bg-white shadow-sm mb-6 overflow-hidden">
            <div className="bg-gray-600 px-4 py-2 font-semibold text-white">
                {title}
            </div>
            <div className="p-4 grid grid-cols-2 gap-4 text-gray-700">
                {children}
            </div>
        </div>
    );

    return (
        <>
            <div className="flex justify-end mb-4">
                {/* <button
                    onClick={handlePrintPDF}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow"
                >
                    Export PDF
                </button> */}
            </div>

            <Section title="Personal Details">
                <Field label="Member No" value={customer.Reference2} />
                <Field label="Full Name" value={`${customer.IndividualFirstName} ${customer.IndividualLastName}`} />
                <Field label="Salutation" value={customer.IndividualSalutationDescription} />
                <Field label="Gender" value={customer.IndividualGenderDescription} />
                <Field label="Marital Status" value={customer.IndividualMaritalStatusDescription} />
                <Field label="Nationality" value={customer.IndividualNationalityDescription} />
                <Field label="Birth Date" value={customer.IndividualBirthDate && new Date(customer.IndividualBirthDate).toLocaleDateString()} />
                <Field label="Age" value={age} />
                <Field label="Registration Date" value={customer.RegistrationDate && new Date(customer.RegistrationDate).toLocaleDateString()} />
            </Section>

            <Section title="Identification">
                <Field label="ID Type" value={customer.IndividualIdentityCardTypeDescription} />
                <Field label="ID Number" value={customer.IndividualIdentityCardNumber} />
                <Field label="Payroll No." value={customer.IndividualPayrollNumbers} />
                <Field label="PIN" value={customer.PersonalIdentificationNumber} />
                <Field label="File Number" value={customer.Reference3} />
            </Section>

            <Section title="Employment & Bank">
                <Field label="Designation" value={customer.IndividualEmploymentDesignation} />
                <Field label="Terms of Service" value={customer.IndividualEmploymentTermsOfServiceDescription} />
                <Field label="Bank" value={customer.BankName} />
                <Field label="Branch" value={customer.BranchName} />
            </Section>

            <Section title="Contact & Address">
                <Field label="Mobile" value={customer.AddressMobileLine} />
                <Field label="Email" value={customer.AddressEmail} />
                <Field label="City" value={customer.AddressCity} />
                <Field label="Address" value={customer.AddressAddressLine1} />
            </Section>
        </>
    );
}