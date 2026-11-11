import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    FaFileExcel,
    FaTimes,
    FaUpload,
    FaDownload,
    FaExclamationTriangle,
    FaSpinner,
    FaInfoCircle,
} from "react-icons/fa";
import Swal from "sweetalert2";
import * as XLSX from 'xlsx';
import { useAuth } from "@/context/AuthContext";

// Sends parsed JSON rows, not the raw file — server no longer needs to
// open/parse Excel itself (removes the ClosedXML / System.ValueTuple
// dependency chain on the API side entirely).
const BULK_CREATE_URL = `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/customers/bulk-create`;

export default function MemberBulkUploadModal({ isOpen, onClose, onSuccess }) {
    const { token, companyId, userData, logout } = useAuth();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [validationErrors, setValidationErrors] = useState([]);
    const [previewData, setPreviewData] = useState([]);
    const [fileName, setFileName] = useState("");
    const [rowCount, setRowCount] = useState(0);

    // Holds the FULL parsed row set (not just the 5-row preview) so
    // handleSubmit can send everything, even though only a slice is shown
    // in the preview table.
    const filteredDataRef = useRef([]);

    const getCompanyId = () => {
        let currentCompanyId = companyId;
        if (!currentCompanyId) {
            try {
                const storedUser = localStorage.getItem('userData');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    currentCompanyId = parsedUser.CompanyId;
                }
            } catch (e) {
                console.error("Error parsing stored user data:", e);
            }
        }
        return currentCompanyId;
    };

    // Download template with instructions
    const handleDownloadTemplate = () => {
        try {
            const instructionsData = [
                ['SwiftFin - Customer / Member Registration Template'],
                [''],
                ['Data Upload Template - Instructions'],
                [''],
                ['Purpose:'],
                ['Used to bulk-register individual or non-individual (organization) customers/members. Each row represents one customer.'],
                [''],
                ['How to use this template:'],
                ['1. Row 1 is the column header - do not rename, remove, or reorder columns.'],
                ['2. Row 2 (highlighted green) is a sample row showing the expected format - delete this row before uploading your real data.'],
                ['3. Enter one record per row starting from the first data row.'],
                ['4. Columns highlighted in yellow in the header are required fields.'],
                ['5. Do not merge cells, insert extra header rows, or change date/number formats.'],
                ['6. Save the file as .xlsx and upload it through the system.'],
                [''],
                ['Field Legend:'],
                ['Type - REQUIRED. Either "Individual" or "NonIndividual" (business/organization member).'],
                ['BranchCode - REQUIRED. Must be the numeric branch code (e.g. 1, 2, 3) matching an existing branch already set up for your organization.'],
                ['PersonalIdentificationNumber - REQUIRED. National ID/PIN number, must be unique within your organization.'],
                ['Individual_Salutation - e.g. Mr, Mrs, Dr - leave blank for NonIndividual rows.'],
                ['Individual_FirstName - Required if Type = Individual.'],
                ['Individual_LastName - Required if Type = Individual.'],
                ['Individual_Gender - Male / Female - leave blank for NonIndividual rows.'],
                ['Individual_MaritalStatus - Single / Married / Divorced / Widowed.'],
                ['Individual_Nationality - e.g. Kenyan.'],
                ['Individual_BirthDate - Format YYYY-MM-DD. Required if Type = Individual.'],
                ['Individual_IdentityCardType - e.g. National ID, Passport, Alien ID.'],
                ['Individual_IdentityCardNumber - ID/Passport number.'],
                ['Individual_IdentityCardSerialNumber - Serial number on the ID document.'],
                ['Individual_PayrollNumbers - Payroll numbers, comma-separated if more than one.'],
                ['Individual_EmploymentDesignation - Job title.'],
                ['Individual_EmploymentTermsOfService - e.g. Permanent, Contract, Casual.'],
                ['Individual_EmploymentDate - Format YYYY-MM-DD.'],
                ['Individual_Classification - Internal classification/category.'],
                ['NonIndividual_Description - Business/organization name - required if Type = NonIndividual.'],
                ['NonIndividual_RegistrationNumber - Business registration number - required if Type = NonIndividual.'],
                ['NonIndividual_RegistrationSerialNumber - Registration certificate serial number.'],
                ['NonIndividual_DateEstablished - Format YYYY-MM-DD.'],
                ['Address_AddressLine1 - Primary address line.'],
                ['Address_AddressLine2 - Secondary address line (optional).'],
                ['Address_Street - Street name.'],
                ['Address_City - City/Town.'],
                ['Address_PostalCode - Postal/ZIP code.'],
                ['Address_Email - Contact email.'],
                ['Address_LandLine - Landline number (optional).'],
                ['Address_MobileLine - Mobile contact number. REQUIRED.'],
                ['RegistrationDate - REQUIRED. Format YYYY-MM-DD.'],
                ['Reference1 - Optional free-text reference field.'],
                ['Remarks - Optional notes about this customer.'],
                ['BankName - External bank name.'],
                ['BranchName - External bank branch name.'],
                [''],
                ['Notes:'],
                ['- Fill either the Individual_* columns OR the NonIndividual_* columns per row - never both.'],
                ['- Photos, signatures, ID scans, and biometric data must be captured separately.'],
                ['- PersonalIdentificationNumber must be unique within your organization.'],
                ['- Member numbers are generated automatically by the system on upload and must not be entered here.'],
            ];

            const templateData = [
                {
                    'Type': 'Individual',
                    'BranchCode': '1',
                    'PersonalIdentificationNumber': '12345678',
                    'Individual_Salutation': 'Mr',
                    'Individual_FirstName': 'John',
                    'Individual_LastName': 'Doe',
                    'Individual_Gender': 'Male',
                    'Individual_MaritalStatus': 'Married',
                    'Individual_Nationality': 'Kenyan',
                    'Individual_BirthDate': '1990-01-01',
                    'Individual_IdentityCardType': 'National ID',
                    'Individual_IdentityCardNumber': '12345678',
                    'Individual_IdentityCardSerialNumber': 'ABC123456',
                    'Individual_PayrollNumbers': 'PAY001,PAY002',
                    'Individual_EmploymentDesignation': 'Manager',
                    'Individual_EmploymentTermsOfService': 'Permanent',
                    'Individual_EmploymentDate': '2015-06-01',
                    'Individual_Classification': 'Staff',
                    'NonIndividual_Description': '',
                    'NonIndividual_RegistrationNumber': '',
                    'NonIndividual_RegistrationSerialNumber': '',
                    'NonIndividual_DateEstablished': '',
                    'Address_AddressLine1': '123 Main Street',
                    'Address_AddressLine2': 'Suite 100',
                    'Address_Street': 'Kenyatta Avenue',
                    'Address_City': 'Nairobi',
                    'Address_PostalCode': '00100',
                    'Address_Email': 'john.doe@email.com',
                    'Address_LandLine': '020-1234567',
                    'Address_MobileLine': '0712345678',
                    'RegistrationDate': '2024-01-15',
                    'Reference1': 'REF001',
                    'Remarks': 'Initial registration',
                    'BankName': 'Equity Bank',
                    'BranchName': 'Nairobi Branch',
                },
                {
                    'Type': 'NonIndividual',
                    'BranchCode': '2',
                    'PersonalIdentificationNumber': '87654321',
                    'Individual_Salutation': '',
                    'Individual_FirstName': '',
                    'Individual_LastName': '',
                    'Individual_Gender': '',
                    'Individual_MaritalStatus': '',
                    'Individual_Nationality': '',
                    'Individual_BirthDate': '',
                    'Individual_IdentityCardType': '',
                    'Individual_IdentityCardNumber': '',
                    'Individual_IdentityCardSerialNumber': '',
                    'Individual_PayrollNumbers': '',
                    'Individual_EmploymentDesignation': '',
                    'Individual_EmploymentTermsOfService': '',
                    'Individual_EmploymentDate': '',
                    'Individual_Classification': '',
                    'NonIndividual_Description': 'ABC Corporation Ltd',
                    'NonIndividual_RegistrationNumber': 'CPR/2023/12345',
                    'NonIndividual_RegistrationSerialNumber': 'SER987654',
                    'NonIndividual_DateEstablished': '2010-05-15',
                    'Address_AddressLine1': '456 Business Park',
                    'Address_AddressLine2': 'Floor 5',
                    'Address_Street': 'Mombasa Road',
                    'Address_City': 'Nairobi',
                    'Address_PostalCode': '00200',
                    'Address_Email': 'info@abccorp.com',
                    'Address_LandLine': '020-7654321',
                    'Address_MobileLine': '0723456789',
                    'RegistrationDate': '2024-01-20',
                    'Reference1': 'ORG001',
                    'Remarks': 'Corporate member',
                    'BankName': 'KCB Bank',
                    'BranchName': 'Industrial Area Branch',
                }
            ];

            const wb = XLSX.utils.book_new();

            const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData.map(row => [row]));
            XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

            const wsTemplate = XLSX.utils.json_to_sheet(templateData);
            const colWidths = [
                { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 18 }, { wch: 15 },
                { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
                { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 20 },
                { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 25 }, { wch: 22 },
                { wch: 22 }, { wch: 18 }, { wch: 25 }, { wch: 25 }, { wch: 18 },
                { wch: 18 }, { wch: 14 }, { wch: 25 }, { wch: 18 }, { wch: 18 },
                { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }
            ];
            wsTemplate['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, wsTemplate, "Template");

            XLSX.writeFile(wb, `SwiftFin_Member_Upload_Template.xlsx`);

            Swal.fire({
                title: 'Template Downloaded',
                text: 'The template file with instructions has been downloaded successfully.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error downloading template:', error);
            Swal.fire('Error', 'Failed to download template. Please try again.', 'error');
        }
    };

    // Handle file selection
    const handleFileUpload = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls'].includes(fileExtension)) {
            Swal.fire('Error', 'Please upload an Excel file (.xlsx, .xls).', 'error');
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
            Swal.fire('Error', 'File size exceeds 5MB limit. Please compress your file.', 'error');
            return;
        }

        setFile(selectedFile);
        setFileName(selectedFile.name);
        setValidationErrors([]);
        setPreviewData([]);
        setRowCount(0);
        filteredDataRef.current = [];

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                let templateSheet = null;
                let sheetName = '';

                if (workbook.SheetNames.length > 1) {
                    const templateSheetName = workbook.SheetNames.find(name =>
                        name.toLowerCase().includes('template')
                    );
                    if (templateSheetName) {
                        sheetName = templateSheetName;
                        templateSheet = workbook.Sheets[templateSheetName];
                    } else {
                        sheetName = workbook.SheetNames[1];
                        templateSheet = workbook.Sheets[sheetName];
                    }
                } else {
                    sheetName = workbook.SheetNames[0];
                    templateSheet = workbook.Sheets[sheetName];
                }

                if (!templateSheet) {
                    Swal.fire('Error', 'No template sheet found in the file.', 'error');
                    setFile(null);
                    setFileName("");
                    return;
                }

                const jsonData = XLSX.utils.sheet_to_json(templateSheet);

                const filteredData = jsonData.filter(row => {
                    const hasData = Object.values(row).some(val => val && val.toString().trim() !== '');
                    const isSample = (row.Individual_FirstName === 'John' && row.Individual_LastName === 'Doe') ||
                                   (row.NonIndividual_Description === 'ABC Corporation Ltd');
                    return hasData && !isSample;
                });

                if (filteredData.length === 0) {
                    Swal.fire('Error', 'No data rows found in the template. Please add your data and remove the sample row.', 'error');
                    setFile(null);
                    setFileName("");
                    return;
                }

                // Normalize every value to a string so the payload the API
                // receives is consistent, regardless of how SheetJS typed
                // a given cell (numbers, dates, etc.).
                const normalizedData = filteredData.map(row => {
                    const normalized = {};
                    Object.keys(row).forEach(key => {
                        normalized[key] = row[key] === undefined || row[key] === null
                            ? ''
                            : String(row[key]).trim();
                    });
                    return normalized;
                });

                filteredDataRef.current = normalizedData;
                setRowCount(normalizedData.length);
                setPreviewData(normalizedData.slice(0, 5));

                const errors = validateData(normalizedData);
                setValidationErrors(errors);

                if (errors.length > 0) {
                    Swal.fire({
                        title: 'Validation Warnings',
                        html: `
                            <div style="text-align: left;">
                                <p style="font-weight: 600; margin-bottom: 10px;">Found ${errors.length} validation issue(s):</p>
                                ${errors.slice(0, 15).map(err => `<div style="font-size: 13px; padding: 3px 0;">⚠️ ${err}</div>`).join('')}
                                ${errors.length > 15 ? `<div style="font-size: 13px; padding: 3px 0; color: #666;">... and ${errors.length - 15} more issues</div>` : ''}
                            </div>
                        `,
                        icon: 'warning',
                        confirmButtonColor: '#4f46e5',
                        confirmButtonText: 'I understand'
                    });
                } else {
                    Swal.fire({
                        title: 'File Loaded Successfully',
                        text: `${normalizedData.length} rows loaded and validated. Ready to upload.`,
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            } catch (error) {
                console.error('Error reading file:', error);
                Swal.fire('Error', 'Failed to read the Excel file. Please check the format.', 'error');
                setFile(null);
                setFileName("");
            }
        };
        reader.readAsArrayBuffer(selectedFile);
    };

    // Validate data before upload
    const validateData = (data) => {
        const errors = [];

        data.forEach((row, index) => {
            const rowNum = index + 3; // +2 header/sample rows, +1 for 1-based

            if (!row.Type || row.Type.trim() === '') {
                errors.push(`Row ${rowNum}: Type is required (Individual or NonIndividual).`);
            } else if (!['Individual', 'NonIndividual'].includes(row.Type.trim())) {
                errors.push(`Row ${rowNum}: Type must be 'Individual' or 'NonIndividual'.`);
            }

            if (!row.BranchCode || row.BranchCode.trim() === '') {
                errors.push(`Row ${rowNum}: BranchCode is required.`);
            } else if (!/^\d+$/.test(row.BranchCode.trim())) {
                errors.push(`Row ${rowNum}: BranchCode must be a number (e.g. 1, 2, 3).`);
            }

            if (!row.PersonalIdentificationNumber || row.PersonalIdentificationNumber.trim() === '') {
                errors.push(`Row ${rowNum}: PersonalIdentificationNumber is required.`);
            }

            if (!row.RegistrationDate || row.RegistrationDate.trim() === '') {
                errors.push(`Row ${rowNum}: RegistrationDate is required.`);
            } else if (!row.RegistrationDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                errors.push(`Row ${rowNum}: RegistrationDate must be in YYYY-MM-DD format.`);
            }

            const type = row.Type?.trim();
            if (type === 'Individual') {
                if (!row.Individual_FirstName || row.Individual_FirstName.trim() === '') {
                    errors.push(`Row ${rowNum}: Individual_FirstName is required for Individual type.`);
                }
                if (!row.Individual_LastName || row.Individual_LastName.trim() === '') {
                    errors.push(`Row ${rowNum}: Individual_LastName is required for Individual type.`);
                }
                if (!row.Individual_BirthDate || row.Individual_BirthDate.trim() === '') {
                    errors.push(`Row ${rowNum}: Individual_BirthDate is required for Individual type.`);
                } else if (!row.Individual_BirthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    errors.push(`Row ${rowNum}: Individual_BirthDate must be in YYYY-MM-DD format.`);
                }
                if (row.Individual_Gender && row.Individual_Gender.trim() !== '' &&
                    !['Male', 'Female'].includes(row.Individual_Gender.trim())) {
                    errors.push(`Row ${rowNum}: Individual_Gender must be 'Male' or 'Female'.`);
                }
            }

            if (type === 'NonIndividual') {
                if (!row.NonIndividual_Description || row.NonIndividual_Description.trim() === '') {
                    errors.push(`Row ${rowNum}: NonIndividual_Description is required for NonIndividual type.`);
                }
                if (!row.NonIndividual_RegistrationNumber || row.NonIndividual_RegistrationNumber.trim() === '') {
                    errors.push(`Row ${rowNum}: NonIndividual_RegistrationNumber is required for NonIndividual type.`);
                }
            }

            if (row.Address_Email && row.Address_Email.trim() !== '' &&
                !row.Address_Email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                errors.push(`Row ${rowNum}: Invalid email format.`);
            }

            if (!row.Address_MobileLine || row.Address_MobileLine.trim() === '') {
                errors.push(`Row ${rowNum}: Address_MobileLine is required.`);
            } else if (!row.Address_MobileLine.match(/^[0-9]{10,15}$/)) {
                errors.push(`Row ${rowNum}: Address_MobileLine should be 10-15 digits.`);
            }
        });

        return errors;
    };

    // Submit bulk upload — sends parsed JSON rows, not the raw file
    const handleSubmit = async () => {
        if (!file || filteredDataRef.current.length === 0) {
            Swal.fire('Error', 'Please select a file to upload.', 'error');
            return;
        }

        const currentCompanyId = getCompanyId();
        if (!currentCompanyId) {
            Swal.fire('Error', 'Company information not found. Please login again.', 'error');
            
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + 10;
            });
        }, 500);

        try {
            const url = new URL(BULK_CREATE_URL);
            url.searchParams.append('testCompanyId', currentCompanyId);

            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(filteredDataRef.current),
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (response.status === 401 || response.status === 403) {
                Swal.fire('Session Expired', 'Your session has expired. Please login again.', 'error')
                    .then(() => logout());
                setUploading(false);
                return;
            }

            const result = await response.json();

            if (result.success) {
                const rows = result.data || [];
                const successCount = rows.filter(r => r.success).length;
                const errorCount = rows.filter(r => !r.success).length;

                const failedRowsHtml = errorCount > 0
                    ? `<div style="text-align:left; max-height:200px; overflow-y:auto; margin-top:8px;">
                         ${rows.filter(r => !r.success).slice(0, 15)
                            .map(r => `<div style="font-size:13px; padding:2px 0;">⚠️ Row ${r.row}: ${r.error}</div>`).join('')}
                         ${errorCount > 15 ? `<div style="font-size:13px; padding:2px 0; color:#666;">... and ${errorCount - 15} more</div>` : ''}
                       </div>`
                    : '';

                await Swal.fire({
                    title: 'Upload Complete',
                    html: `
                        <div style="text-align: left; font-size: 14px;">
                            <p style="font-weight: 600; margin-bottom: 8px;">Upload Summary:</p>
                            <p>✅ ${successCount} members added successfully</p>
                            ${errorCount > 0 ? `<p>❌ ${errorCount} members had errors</p>${failedRowsHtml}` : ''}
                        </div>
                    `,
                    icon: errorCount > 0 ? 'warning' : 'success',
                    confirmButtonColor: '#4f46e5',
                    confirmButtonText: 'OK'
                });

                setFile(null);
                setFileName("");
                setPreviewData([]);
                setValidationErrors([]);
                setUploadProgress(0);
                setRowCount(0);
                filteredDataRef.current = [];

                onClose();
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                Swal.fire({
                    title: 'Upload Failed',
                    text: result.message || 'Failed to upload members.',
                    icon: 'error',
                    confirmButtonColor: '#4f46e5'
                });
            }
        } catch (error) {
            clearInterval(progressInterval);
            console.error('Bulk upload error:', error);

            let errorMsg = error.message || 'Failed to upload members. Please try again.';
            if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
                errorMsg = 'Network error. Please check your internet connection and try again.';
            }

            Swal.fire({
                title: 'Error',
                text: errorMsg,
                icon: 'error',
                confirmButtonColor: '#4f46e5'
            });
        } finally {
            setUploading(false);
            setUploadProgress(0);
            clearInterval(progressInterval);
        }
    };

    // Remove selected file
    const handleRemoveFile = () => {
        setFile(null);
        setFileName("");
        setPreviewData([]);
        setValidationErrors([]);
        setUploadProgress(0);
        setRowCount(0);
        filteredDataRef.current = [];
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                        <FaFileExcel className="text-green-600" />
                        Bulk Member Upload
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={uploading}
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        <FaInfoCircle className="text-blue-600" /> Instructions
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                        <li>Download the template file which includes instructions and sample data</li>
                        <li>The template has two sheets: <strong>Instructions</strong> and <strong>Template</strong></li>
                        <li>Use the <strong>Template</strong> sheet for your data</li>
                        <li><span className="font-bold text-red-600">Delete the sample row (Row 2)</span> before uploading your data</li>
                        <li>Required fields: <strong>Type, BranchCode, PersonalIdentificationNumber, Address_MobileLine, RegistrationDate</strong></li>
                        <li><strong>BranchCode</strong> must be a number matching an existing branch in your organization</li>
                        <li>For <strong>Individual</strong> type: FirstName, LastName, BirthDate are required</li>
                        <li>For <strong>NonIndividual</strong> type: Description, RegistrationNumber are required</li>
                        <li>Fill either Individual_* columns OR NonIndividual_* columns - never both</li>
                        <li>Save the file as .xlsx and upload it</li>
                    </ul>
                </div>

                {/* Download Template */}
                <div className="mb-6">
                    <Button
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                        onClick={handleDownloadTemplate}
                        disabled={uploading}
                    >
                        <FaDownload /> Download Template with Instructions
                    </Button>
                </div>

                {/* File Upload Area */}
                <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-indigo-400'
                }`}>
                    <input
                        id="file-upload"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                    />
                    <label
                        htmlFor="file-upload"
                        className={`cursor-pointer block ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        <FaFileExcel className={`text-6xl mx-auto mb-4 ${file ? 'text-green-500' : 'text-gray-400'}`} />
                        {file ? (
                            <div>
                                <p className="text-green-600 font-medium">{fileName}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {rowCount} rows detected • Click to change file
                                </p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-gray-600 font-medium">Click to upload or drag and drop</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Supported formats: .xlsx, .xls (Max 5MB)
                                </p>
                            </div>
                        )}
                    </label>
                </div>

                {/* File Info */}
                {file && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FaFileExcel className="text-green-600 text-2xl" />
                            <div>
                                <p className="font-medium text-gray-800">{fileName}</p>
                                <p className="text-sm text-gray-500">
                                    {(file.size / 1024).toFixed(2)} KB
                                    {rowCount > 0 && ` • ${rowCount} rows`}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleRemoveFile}
                            className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                            disabled={uploading}
                        >
                            <FaTimes />
                        </button>
                    </div>
                )}

                {/* Preview Data */}
                {previewData.length > 0 && (
                    <div className="mt-6">
                        <h4 className="font-semibold text-gray-700 mb-3">Preview (First 5 rows)</h4>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {Object.keys(previewData[0]).slice(0, 8).map((key, idx) => (
                                            <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                {key}
                                            </th>
                                        ))}
                                        {Object.keys(previewData[0]).length > 8 && (
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                ...
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {previewData.map((row, idx) => (
                                        <tr key={idx}>
                                            {Object.entries(row).slice(0, 8).map(([key, value], colIdx) => (
                                                <td key={colIdx} className="px-3 py-2 text-sm text-gray-700 max-w-[150px] truncate">
                                                    {value || '-'}
                                                </td>
                                            ))}
                                            {Object.keys(row).length > 8 && (
                                                <td className="px-3 py-2 text-sm text-gray-400">...</td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            Showing preview of first {previewData.length} of {rowCount} rows
                        </p>
                    </div>
                )}

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                            <FaExclamationTriangle className="text-amber-600" /> Validation Warnings ({validationErrors.length})
                        </h4>
                        <div className="max-h-40 overflow-y-auto">
                            {validationErrors.slice(0, 15).map((error, idx) => (
                                <p key={idx} className="text-sm text-amber-700 py-0.5">
                                    • {error}
                                </p>
                            ))}
                            {validationErrors.length > 15 && (
                                <p className="text-sm text-amber-700 py-0.5">
                                    ... and {validationErrors.length - 15} more warnings
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Progress */}
                {uploading && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                            <span className="flex items-center gap-2">
                                <FaSpinner className="animate-spin" /> Uploading...
                            </span>
                            <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Please wait while your members are being processed...
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={uploading}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                        onClick={handleSubmit}
                        disabled={!file || uploading || validationErrors.length > 0}
                    >
                        {uploading ? (
                            <>
                                <FaSpinner className="animate-spin" /> Uploading...
                            </>
                        ) : (
                            <>
                                <FaUpload /> Upload Members
                            </>
                        )}
                    </Button>
                </div>
                {validationErrors.length > 0 && (
                    <p className="text-xs text-amber-600 text-right mt-2">
                        Please fix validation issues before uploading
                    </p>
                )}
            </div>
        </div>
    );
}