import React, { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const RELATIONSHIP_MAP = {
    0: "Spouse",
    1: "Spouse",
    2: "Parent",
    3: "Guardian",
    4: "Child",
    5: "Sibling",
    6: "Other",
};

const GENDER_MAP = {
    0: "Not specified",
    1: "Male",
    2: "Female",
};

function getFullName(nok) {
    // Handle both old and new structure
    const firstName = nok.firstName || nok.FirstName || "";
    const lastName = nok.lastName || nok.LastName || "";
    return [firstName, lastName].filter(Boolean).join(" ");
}

function getRelationship(nok) {
    const relationship = nok.relationship !== undefined ? nok.relationship : nok.Relationship;
    return RELATIONSHIP_MAP[relationship] ?? `Unknown (${relationship})`;
}

function getGender(nok) {
    const gender = nok.gender !== undefined ? nok.gender : nok.Gender;
    return GENDER_MAP[gender] ?? "Unknown";
}

function getIdNumber(nok) {
    return nok.identityCardNumber || nok.IdentityCardNumber || nok.idNumber || "N/A";
}

function getPhone(nok) {
    // Handle nested address object
    if (nok.address) {
        return nok.address.mobileLine || nok.address.MobileLine || "N/A";
    }
    return nok.AddressMobileLine || nok.mobileLine || "N/A";
}

function getAddress(nok) {
    if (nok.address) {
        return nok.address.addressLine1 || nok.address.AddressLine1 || "";
    }
    return nok.AddressAddressLine1 || "";
}

function getPercentage(nok) {
    return nok.nominatedPercentage || nok.NominatedPercentage || 0;
}

export default function MemberNextOfKinTab({ nextOfKin, memberName }) {
    const [search, setSearch] = useState("");
    const nokList = nextOfKin ?? [];

    const filteredNextOfKin = useMemo(() => {
        const term = search.toLowerCase();
        return nokList.filter((nok) =>
            getFullName(nok).toLowerCase().includes(term) ||
            getRelationship(nok).toLowerCase().includes(term) ||
            getPhone(nok).toLowerCase().includes(term) ||
            getIdNumber(nok).toLowerCase().includes(term)
        );
    }, [search, nokList]);

    const handleDownloadPDF = () => {
        const doc = new jsPDF("p", "mm", "a4");

        doc.setFontSize(16);
        doc.text("Next of Kin List", 14, 15);

        if (memberName) {
            doc.setFontSize(12);
            doc.text(memberName, 14, 23);
        }

        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, memberName ? 29 : 22);

        autoTable(doc, {
            startY: memberName ? 36 : 30,
            head: [["Name", "Gender", "Relationship", "ID Number", "Phone", "Address", "Percentage"]],
            body: filteredNextOfKin.map((nok) => [
                getFullName(nok),
                getGender(nok),
                getRelationship(nok),
                getIdNumber(nok),
                getPhone(nok),
                getAddress(nok),
                `${getPercentage(nok)}%`,
            ]),
            theme: "striped",
            headStyles: { fillColor: [75, 85, 99], textColor: 255 },
            styles: { fontSize: 8 },
            columnStyles: {
                5: { cellWidth: 40 },
            },
        });

        doc.save("Next_of_Kin_List.pdf");
    };

    if (nokList.length === 0) {
        return <p className="text-sm text-gray-500">No next of kin recorded</p>;
    }

    return (
        <div className="border rounded-lg bg-gray-200 p-4">
            <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Search by name, relationship, ID or phone"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:max-w-xs px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                />

                <button
                    onClick={handleDownloadPDF}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow"
                >
                    Download PDF
                </button>
            </div>

            <div className="overflow-x-auto rounded-lg">
                <table className="w-full text-sm">
                    <thead className="bg-gray-600 text-white">
                        <tr>
                            <th className="p-2 text-left">Name</th>
                            <th className="p-2 text-left">Gender</th>
                            <th className="p-2 text-left">Relationship</th>
                            <th className="p-2 text-left">ID Number</th>
                            <th className="p-2 text-left">Phone</th>
                            <th className="p-2 text-left">Address</th>
                            <th className="p-2 text-left">Percentage</th>
                        </tr>
                    </thead>

                    <tbody className="bg-gray-50">
                        {filteredNextOfKin.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="p-4 text-center text-gray-500">
                                    No matching records
                                </td>
                            </tr>
                        ) : (
                            filteredNextOfKin.map((nok, index) => (
                                <tr key={nok.id || nok.Id || index} className="border-t hover:bg-gray-100">
                                    <td className="p-2 font-medium">{getFullName(nok)}</td>
                                    <td className="p-2">{getGender(nok)}</td>
                                    <td className="p-2">{getRelationship(nok)}</td>
                                    <td className="p-2">{getIdNumber(nok)}</td>
                                    <td className="p-2">{getPhone(nok)}</td>
                                    <td className="p-2 max-w-[100px] truncate" title={getAddress(nok)}>
                                        {getAddress(nok) || "—"}
                                    </td>
                                    <td className="p-2">{getPercentage(nok)}%</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}