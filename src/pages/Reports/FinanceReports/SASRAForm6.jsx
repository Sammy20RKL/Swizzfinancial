import React, { useEffect, useState } from "react";
import logo from "../../../assets/rubanilogo.jpeg";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function SASRAForm6() {
    const [data, setData] = useState(null);
    const [startDate, setStartDate] = useState("2026-01-20");
    const [endDate, setEndDate] = useState("2026-01-20");


    // useEffect(() => {
    //     fetch(
    //         "http://95.216.225.26:8006/api/reporting/SASRAForm6?startDate=2026-01-20&endDate=2026-01-20",
    //         { headers: { "ngrok-skip-browser-warning": "true" } }
    //     )
    //         .then((res) => res.json())
    //         .then(setData)
    //         .catch(console.error);
    // }, []);

    useEffect(() => {
        if (!startDate || !endDate) return;

        setData(null); // loading state

        fetch(
            `https://localhost:44327/api/reporting/SASRAForm6?startDate=${startDate}&endDate=${endDate}`,
            { headers: { "ngrok-skip-browser-warning": "true" } }
        )
            .then(res => res.json())
            .then(setData)
            .catch(console.error);
    }, [startDate, endDate]);


    if (!data) return <p>Loading...</p>;

    // Group by ReportSection
    const groupedData = data.ReportLines.reduce((acc, item) => {
        if (!acc[item.ReportSection]) acc[item.ReportSection] = [];
        acc[item.ReportSection].push(item);
        return acc;
    }, {});

    const handleDownloadPDF = () => {
        const doc = new jsPDF("p", "pt", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 20;

        const img = new Image();
        img.src = logo;
        img.onload = () => {
            const imgWidth = 130;
            const imgHeight = 60;
            doc.addImage(img, "JPEG", (pageWidth - imgWidth) / 2, y, imgWidth, imgHeight);
            y += imgHeight + 15;

            // Header title
            doc.setFontSize(16);
            doc.setFont("times", "bold");
            doc.text(data.Metadata.SaccoName, pageWidth / 2, y, { align: "center" });

            y += 20;

            doc.setFontSize(12);
            doc.setFont("times", "normal");
            doc.text(
                `SASRA Form 6 - Period From ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`,
                pageWidth / 2,
                y,
                { align: "center" }
            );


            y += 30;

            // Loop through sections
            Object.keys(groupedData).forEach((section) => {
                doc.setFont("times", "bold");
                doc.setFontSize(12);
                doc.text(section.replace(/_/g, " "), 40, y);
                y += 10;

                const tableData = groupedData[section].map((item) => [
                    item.LineItem,
                    item.Amount !== null
                        ? item.Amount.toLocaleString(undefined, { minimumFractionDigits: 2 })
                        : "",
                ]);

                autoTable(doc, {
                    startY: y,
                    head: [["Line Item", "Amount"]],
                    body: tableData,
                    theme: "grid",
                    headStyles: { fillColor: [11, 168, 230] },
                    styles: { font: "times", fontSize: 10 },
                    margin: { left: 40, right: 40 },
                });

                y = doc.lastAutoTable.finalY + 15;
            });

            doc.save("SASRAForm6.pdf");
        };
    };

    return (
        <div className="p-6 bg-gray-200 min-h-screen">
            {/* <div className="flex justify-end gap-3 mb-4">
                <button
                    onClick={handleDownloadPDF}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                    Download PDF
                </button>
            </div> */}

            <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 px-6 rounded-lg">
                <div className="flex gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="border rounded px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="border rounded px-3 py-2"
                        />
                    </div>
                </div>

                <button
                    onClick={handleDownloadPDF}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                    Download PDF
                </button>
            </div>


            <div className="bg-white p-8 shadow-lg max-w-5xl mx-auto">
                {/* HEADER */}
                <div className="flex flex-col items-center justify-center gap-4 mb-4">
                    <img src={logo} alt="Company Logo" className="h-16 w-auto" />
                    <div className="text-center">
                        <h1 className="text-lg font-bold">{data.Metadata.SaccoName}</h1>
                        {/* <h2 className="text-sm">
                            SASRA Form 6 - Period Ending{" "}
                            {new Date(data.Metadata.PeriodEndingDate).toLocaleDateString()}
                        </h2> */}
                        <h2 className="text-sm">
                            SASRA Form 6 - Period From{" "}
                            {new Date(startDate).toLocaleDateString()}{" "}
                            to{" "}
                            {new Date(endDate).toLocaleDateString()}
                        </h2>


                    </div>
                </div>

                <hr className="border-black mb-4" />

                {/* TABLE PREVIEW */}
                {Object.keys(groupedData).map((section) => (
                    <div key={section} className="mb-6">
                        <h3 className="font-bold text-base mb-2">{section.replace(/_/g, " ")}</h3>

                        <div className="grid grid-cols-[3fr_1fr] border-b-2 border-black font-semibold py-2">
                            <div>Line Item</div>
                            <div className="text-right">Amount</div>
                        </div>

                        {groupedData[section].map((item, idx) => (
                            <div
                                key={idx}
                                className="grid grid-cols-[3fr_1fr] border-b border-gray-200 py-1 last:border-none"
                            >
                                <div>{item.LineItem}</div>
                                <div className="text-right tabular-nums">
                                    {item.Amount !== null
                                        ? item.Amount.toLocaleString(undefined, { minimumFractionDigits: 2 })
                                        : ""}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SASRAForm6;
