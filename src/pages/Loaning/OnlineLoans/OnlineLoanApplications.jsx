import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, Eye, Download, FileText, User, DollarSign, Clock, Users,
  CheckCircle, XCircle, AlertCircle, Printer, ChevronLeft, ChevronRight,
  RefreshCw, Loader2, FileDown, FileCheck, Send, Briefcase, PenTool,
  Upload, AlertTriangle, Fingerprint,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";
import { useNavigate } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import logo from "../../../assets/rubanilogo.jpeg";

const API_BASE_URL = import.meta.env.VITE_APP_LOANING_URL || 'https://localhost:44327';

export default function OnlineLoanApplications() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [signaturePadRef, setSignaturePadRef] = useState(null);
  const [signatureData, setSignatureData] = useState(null);
  const [signatureMethod, setSignatureMethod] = useState('Draw');
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Credit Committee Modal States
  const [showCreditCommitteeModal, setShowCreditCommitteeModal] = useState(false);
  const [committeeRemarks, setCommitteeRemarks] = useState('');
  const [submittingToCommittee, setSubmittingToCommittee] = useState(false);
  const [signatureError, setSignatureError] = useState('');
  const [signatureSaved, setSignatureSaved] = useState(false);

  const [signatureStatus, setSignatureStatus] = useState({
    officerCount: 0,
    requiredCount: 2,
    signatures: [],
    isComplete: false,
  });

  // ── Utilities ────────────────────────────────────────────────────────
  const blurActiveElement = () => {
    if (document.activeElement && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  // Safe alert — always resolves, never fights Radix Dialog focus trap
  const safeAlert = async (options) => {
    blurActiveElement();
    try {
      if (Swal.isVisible()) Swal.close();
      await Swal.fire({
        ...options,
        allowOutsideClick: options.allowOutsideClick ?? true,
        allowEscapeKey: options.allowEscapeKey ?? true,
        confirmButtonText: options.confirmButtonText || 'OK',
        confirmButtonColor: options.confirmButtonColor || '#4f46e5',
        returnFocus: false,
        didClose: () => {
          try { document.body.focus(); } catch (_) {}
        },
      });
    } catch (e) {
      console.warn('Swal error (non-fatal):', e);
      try { window.alert(options.text || options.title || ''); } catch (_) {}
    }
  };

  // ── Fetch applications ───────────────────────────────────────────────
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/MemberPortal/OnlineLoanapplication`,
        {
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );

      const data = await response.json();
      console.log('Online Loan Applications:', data);

      if (data.Success && data.Data && data.Data.Loans) {
        setApplications(data.Data.Loans);
        setFilteredApplications(data.Data.Loans);
        setTotalCount(data.Data.TotalCount || data.Data.Loans.length);
      } else {
        setApplications([]);
        setFilteredApplications([]);
        await safeAlert({
          title: 'No Applications Found',
          text: data.Message || 'No online loan applications available.',
          icon: 'info',
        });
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      await safeAlert({
        title: 'Error',
        text: 'Failed to load online loan applications. Please try again.',
        icon: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Search filter ────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredApplications(applications);
      return;
    }
    const search = searchTerm.toLowerCase().trim();
    const filtered = applications.filter(app => {
      const loanee = app.loanee || {};
      const fullName = `${loanee.firstName || ''} ${loanee.lastName || ''}`.toLowerCase();
      return (
        fullName.includes(search) ||
        (loanee.memberNumber || '').toLowerCase().includes(search) ||
        (loanee.payrollNumber || '').toLowerCase().includes(search) ||
        (loanee.idNumber || '').toLowerCase().includes(search) ||
        (loanee.mobile || '').toLowerCase().includes(search) ||
        (app.loanReference || '').toLowerCase().includes(search) ||
        (app.loanProductName || '').toLowerCase().includes(search) ||
        (app.statusDescription || '').toLowerCase().includes(search)
      );
    });
    setFilteredApplications(filtered);
    setCurrentPage(1);
  }, [searchTerm, applications]);

  // ── Pagination ───────────────────────────────────────────────────────
  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApplications.slice(start, start + pageSize);
  }, [filteredApplications, currentPage, pageSize]);

  const totalFilteredPages = Math.ceil(filteredApplications.length / pageSize);

  // ── Formatters ───────────────────────────────────────────────────────
  const formatCurrency = (amount) => {
    if (!amount) return 'KES 0.00';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency', currency: 'KES',
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === '0001-01-01T00:00:00') return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-KE', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'Pending Review': { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: <Clock className="h-3 w-3" /> },
      'Approved':       { color: 'bg-green-100 text-green-800 border-green-300',   icon: <CheckCircle className="h-3 w-3" /> },
      'Rejected':       { color: 'bg-red-100 text-red-800 border-red-300',         icon: <XCircle className="h-3 w-3" /> },
      'Disbursed':      { color: 'bg-blue-100 text-blue-800 border-blue-300',      icon: <CheckCircle className="h-3 w-3" /> },
      'Appraised':      { color: 'bg-purple-100 text-purple-800 border-purple-300',icon: <FileCheck className="h-3 w-3" /> },
      'Draft':          { color: 'bg-gray-100 text-gray-800 border-gray-300',      icon: <FileText className="h-3 w-3" /> },
      'Pending':        { color: 'bg-orange-100 text-orange-800 border-orange-300',icon: <Clock className="h-3 w-3" /> },
      'Submitted':      { color: 'bg-cyan-100 text-cyan-800 border-cyan-300',      icon: <Send className="h-3 w-3" /> },
    };
    const fallback = { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: <AlertCircle className="h-3 w-3" /> };
    const info = map[status] || fallback;
    return (
      <Badge className={`${info.color} border px-3 py-1 text-xs font-medium flex items-center gap-1.5 w-fit`}>
        {info.icon}{status || 'Unknown'}
      </Badge>
    );
  };

  const viewDetails = (application) => {
    blurActiveElement();
    setSelectedApplication(application);
    setDetailModalOpen(true);
  };

  // ── Signature handlers ───────────────────────────────────────────────
  const handleSignatureClear = () => {
    if (signaturePadRef) signaturePadRef.clear();
    setSignatureData(null);
    setSignatureSaved(false);
    setSignatureError('');
  };

  const handleSignatureSave = () => {
    if (signaturePadRef && !signaturePadRef.isEmpty()) {
      const dataUrl = signaturePadRef.toDataURL();
      setSignatureData(dataUrl);
      setSignatureSaved(true);
      setSignatureError('');
      safeAlert({
        icon: 'success',
        title: 'Signature Saved',
        text: 'Your signature has been captured successfully.',
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      setSignatureError('Please draw your signature first');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setSignatureError('Please upload an image file (PNG, JPG, JPEG)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSignatureError('File size should be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      setSignatureData(dataUrl);
      setSignaturePreview(dataUrl);
      setSignatureFile(file);
      setSignatureSaved(true);
      setSignatureMethod('Upload');
      setSignatureError('');
      safeAlert({
        icon: 'success',
        title: 'Signature Uploaded',
        text: `Successfully uploaded ${file.name}`,
        timer: 1500,
        showConfirmButton: false,
      });
    };
    reader.readAsDataURL(file);
  };

  const triggerFileUpload = () => fileInputRef.current?.click();

  const removeUploadedFile = () => {
    setSignatureData(null);
    setSignaturePreview(null);
    setSignatureFile(null);
    setSignatureSaved(false);
    setSignatureMethod('Draw');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Open committee modal ─────────────────────────────────────────────
  const openCreditCommitteeModal = (application) => {
    blurActiveElement();
    setSelectedApplication(application);
    setCommitteeRemarks('');
    setSignatureData(null);
    setSignatureSaved(false);
    setSignatureError('');
    setSignatureMethod('Draw');
    setSignaturePreview(null);
    setSignatureFile(null);
    if (signaturePadRef) signaturePadRef.clear();
    setSignatureStatus({ officerCount: 0, requiredCount: 2, signatures: [], isComplete: false });
    setShowCreditCommitteeModal(true);
  };

  // ── Submit to Credit Committee ───────────────────────────────────────
  const submitToCreditCommittee = async () => {
    if (!selectedApplication) return;

    if (!committeeRemarks.trim()) {
      await safeAlert({
        title: 'Remarks Required',
        text: 'Please provide remarks before submitting to credit committee.',
        icon: 'warning',
      });
      return;
    }

    if (!signatureSaved || !signatureData) {
      await safeAlert({
        title: 'Signature Required',
        text: 'Please provide your signature before submitting to credit committee.',
        icon: 'warning',
      });
      return;
    }

    let userData = {};
    try {
      userData = JSON.parse(localStorage.getItem('rubaniUser') || '{}');
    } catch (e) {
      console.error('Failed to parse rubaniUser:', e);
    }
    const username = userData.username || userData.email || userData.memberNo;
    const assignedBy = userData.fullName || userData.fullNames || userData.name || username;

    if (!username) {
      await safeAlert({
        title: 'Login Required',
        text: 'Could not identify your user account. Please log in again to continue.',
        icon: 'error',
      });
      return;
    }

    try {
      setSubmittingToCommittee(true);

      const requestBody = {
        loanCaseId: selectedApplication.loanCaseId,
        username,
        assignedBy: assignedBy || username,
        remarks: committeeRemarks.trim(),
        signatureData,
        signatureMethod,
        signatureFileName: signatureFile ? signatureFile.name : null,
        signatureFileType: signatureFile ? signatureFile.type : null,
      };

      console.log('Submitting to Credit Committee:', {
        ...requestBody,
        signatureData: requestBody.signatureData ? '[base64 truncated]' : null,
      });

      const response = await fetch(
        `${API_BASE_URL}/api/MemberPortal/AssignToCreditCommittee`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        throw new Error(`Invalid response from server (HTTP ${response.status}).`);
      }

      console.log('Credit Committee Response:', data);

      if (response.ok) {
        const messageText = data.message || data.Message || '';
        const summary = data.signatureSummary || data.SignatureSummary || null;

        const stillNeeded = summary
          ? Number(summary.stillNeeded ?? 0)
          : /minimum of 2 officer signatures/i.test(messageText) ? 1 : 0;

        const collected = summary
          ? Number(summary.officerSignatures ?? (2 - stillNeeded))
          : 2 - stillNeeded;

        const loanAdvanced = data.loanAdvanced ?? data.LoanAdvanced ?? (stillNeeded === 0);

        // ── CRITICAL: close Radix Dialog BEFORE opening Swal ──
        setShowCreditCommitteeModal(false);
        blurActiveElement();
        await new Promise((resolve) => setTimeout(resolve, 50));

        if (stillNeeded > 0) {
          await safeAlert({
            title: '⏳ Partial Signature Recorded',
            html: `
              <div style="text-align: left; padding: 10px;">
                <div style="background: #fef3c7; padding: 12px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 10px;">
                  <p style="color: #92400e; font-weight: bold;">${messageText || 'Signature recorded.'}</p>
                </div>
                <div style="background: #f0f4ff; padding: 12px; border-radius: 8px; margin: 10px 0;">
                  <p style="color: #1e40af; font-size: 13px;"><strong>Signatures Collected:</strong> ${collected} / 2</p>
                  <p style="color: #1e40af; font-size: 13px;"><strong>Signed By:</strong> ${assignedBy || username}</p>
                  <p style="color: #1e40af; font-size: 13px;"><strong>Status:</strong> Waiting for ${stillNeeded} more officer signature${stillNeeded > 1 ? 's' : ''}</p>
                </div>
                <p style="color: #4b5563; font-size: 14px;">Your signature has been saved. Please wait for another officer to sign before the loan can be submitted to the credit committee.</p>
              </div>
            `,
            icon: 'info',
          });
        } else {
          await safeAlert({
            title: '✅ Success!',
            html: `
              <div style="text-align: left; padding: 10px;">
                <p style="color: #059669; font-weight: bold; margin-bottom: 10px;">
                  ${messageText || 'Loan successfully assigned to credit committee for review.'}
                </p>
                <div style="background: #f0f4ff; padding: 12px; border-radius: 8px; margin-top: 10px;">
                  <p style="color: #1e40af; font-size: 13px;"><strong>Loan Case ID:</strong> ${selectedApplication.loanCaseId}</p>
                  <p style="color: #1e40af; font-size: 13px;"><strong>Status:</strong> ${loanAdvanced ? 'Sent to Credit Committee' : 'Pending'}</p>
                  <p style="color: #1e40af; font-size: 13px;"><strong>Signed By:</strong> ${assignedBy || username}</p>
                  <p style="color: #1e40af; font-size: 13px;"><strong>Total Signatures:</strong> ${collected} / 2 ✅</p>
                </div>
              </div>
            `,
            icon: 'success',
          });
        }

        setSignatureStatus({
          officerCount: collected,
          requiredCount: 2,
          signatures: [...signatureStatus.signatures, { officer: assignedBy || username, date: new Date() }],
          isComplete: stillNeeded === 0,
        });

        setCommitteeRemarks('');
        setSignatureData(null);
        setSignatureSaved(false);
        setSignatureMethod('Draw');
        setSignaturePreview(null);
        setSignatureFile(null);
        if (signaturePadRef) signaturePadRef.clear();

        fetchApplications();

        if (loanAdvanced) {
          setTimeout(() => {
            try { navigate('/Loaning/LoanApplication'); } catch (e) { console.warn(e); }
          }, 150);
        }
      } else {
        let errorMsg = data.message || data.Message || `Submission failed (HTTP ${response.status}).`;
        const lower = String(errorMsg).toLowerCase();

        if (lower.includes('loan case not found'))          errorMsg = 'Loan application not found. Please refresh and try again.';
        else if (lower.includes('wrong status'))            errorMsg = `Invalid loan status. Loan must be "Pending Review". ${data.foundStatus ? `Current: ${data.foundStatus}` : ''}`;
        else if (lower.includes('username is required'))    errorMsg = 'You must be logged in to sign. Please login again.';
        else if (lower.includes('system user') && lower.includes('not found'))   errorMsg = data.message || 'Your user account was not found. Please contact support.';
        else if (lower.includes('system user') && lower.includes('inactive'))    errorMsg = data.message || 'Your user account is inactive. Please contact support.';
        else if (lower.includes('no signature provided'))   errorMsg = 'Please provide your signature.';
        else if (lower.includes('already signed'))          errorMsg = 'You have already signed this loan. Please wait for another officer.';
        else if (lower.includes('no applicant signature') || lower.includes('applicant has not signed')) errorMsg = 'The applicant has not signed the loan application yet.';
        else if (lower.includes('no guarantor'))            errorMsg = 'At least one guarantor must have signed before assigning to the credit committee.';
        else if (lower.includes('minimum of 2 officer signatures')) errorMsg = 'Additional officer signatures are required. Please wait for another officer to sign.';

        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error submitting to credit committee:', error);

      const errorMessage =
        error?.message && error.message !== 'Failed to submit to credit committee'
          ? error.message
          : 'Failed to submit loan to credit committee. Please try again.';

      // Close Radix first, then alert
      setShowCreditCommitteeModal(false);
      blurActiveElement();
      await new Promise((resolve) => setTimeout(resolve, 50));

      await safeAlert({
        title: '❌ Submission Failed',
        html: `
          <div style="text-align: left; padding: 10px;">
            <p style="color: #dc2626; margin-bottom: 8px;">${errorMessage}</p>
            ${errorMessage.includes('Additional officer signatures') ? `
              <div style="background: #fef3c7; padding: 12px; border-radius: 8px; margin-top: 10px; border-left: 4px solid #f59e0b;">
                <p style="color: #92400e; font-size: 13px;">💡 Your signature has been saved. Please ask another officer to sign.</p>
              </div>
            ` : ''}
          </div>
        `,
        icon: 'error',
      });
    } finally {
      setSubmittingToCommittee(false);
    }
  };

  // ── Number-to-words ──────────────────────────────────────────────────
  const numberToWords = (num) => {
    if (!num) return 'Zero';
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const inWords = (n) => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + inWords(n % 100) : '');
      if (n < 1000000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
      return '';
    };
    return inWords(Math.round(num)) + ' Shillings';
  };

  // ── PDF generation ───────────────────────────────────────────────────
  const generateLoanPDF = (application) => {
    if (!application) return;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 15;
    const loanee = application.loanee || {};

    try {
      doc.addImage(logo, 'PNG', (pageWidth - 40) / 2, y, 40, 18);
    } catch (e) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RUBANI SACCO', pageWidth / 2, y + 10, { align: 'center' });
    }
    y += 24;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LOAN APPLICATION FORM', pageWidth / 2, y, { align: 'center' });
    y += 8;

    const personalInfo = [
      ['NAME', loanee.fullName || 'N/A'],
      ['EMAIL', loanee.email || 'N/A'],
      ['ID/PASSPORT NO', loanee.idNumber || 'N/A'],
      ['DATE OF BIRTH', loanee.dateOfBirth ? formatDate(loanee.dateOfBirth) : 'N/A'],
      ['PHONE', loanee.mobile || 'N/A'],
      ['EMPLOYER', loanee.employer || 'N/A'],
      ['STAFF NUMBER', loanee.payrollNumber || 'N/A'],
      ['MEMBER NUMBER', loanee.memberNumber || 'N/A'],
    ];
    if (loanee.bankName && loanee.bankName !== 'N/A') personalInfo.push(['BANK NAME', loanee.bankName]);
    if (loanee.bankBranch && loanee.bankBranch !== 'N/A') personalInfo.push(['BRANCH NAME', loanee.bankBranch]);
    if (loanee.bankAccount && loanee.bankAccount !== 'N/A') personalInfo.push(['ACCOUNT NUMBER', loanee.bankAccount]);

    autoTable(doc, {
      startY: y, body: personalInfo, theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 45, fillColor: [240, 240, 240] },
        1: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin }, tableWidth: 'auto',
    });
    y = doc.lastAutoTable.finalY + 6;

    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('LOAN DETAILS', margin, y); y += 5;

    autoTable(doc, {
      startY: y,
      body: [
        ['LOAN PRODUCT', application.loanProductName || 'N/A'],
        ['AMOUNT APPLIED', formatCurrency(application.amountApplied)],
        ['IN WORDS', numberToWords(application.amountApplied)],
        ['RECOVERABLE IN', `${application.termMonths || 0} MONTHS`],
        ['COMMENCING FROM', formatDate(application.applicationDate)],
      ],
      theme: 'grid', styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50, fillColor: [240, 240, 240] },
        1: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin }, tableWidth: 'auto',
    });
    y = doc.lastAutoTable.finalY + 6;

    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('REPAYMENT GUARANTEE', margin, y); y += 4;

    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    const guarantee = 'We the undersigned hereby accept jointly and severally, liability for payment of the loan in the event of borrower\'s default. We understand that the amount in default may be recovered by an offset against our shares in the Society or by attachment of our salary or other property and that we shall not be eligible for loans unless the amount in default has been paid in full.';
    const splitG = doc.splitTextToSize(guarantee, pageWidth - margin * 2);
    doc.text(splitG, margin, y);
    y += splitG.length * 4 + 4;

    const guarantors = application.guarantors || [];
    const sigPositions = [];
    const rows = [];
    for (let i = 0; i < Math.max(guarantors.length, 5); i++) {
      const g = guarantors[i];
      if (g) {
        const hasSig = g.signature && g.signature.signatureData;
        rows.push([
          (i + 1).toString(),
          g.fullName || 'N/A',
          g.idNumber || 'N/A',
          g.mobile || 'N/A',
          formatCurrency(g.amountGuaranteed || 0),
          hasSig ? '___SIG___' : '',
        ]);
        if (hasSig) sigPositions.push({ row: i, data: g.signature.signatureData });
      } else {
        rows.push([(i + 1).toString(), '', '', '', '', '']);
      }
    }

    autoTable(doc, {
      startY: y,
      head: [['NO', 'NAMES', 'ID NO', 'MOBILE NO', 'DEPOSITS', 'SIGNATURE']],
      body: rows, theme: 'grid',
      headStyles: { fillColor: [55, 65, 81], textColor: 255, fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 12 }, 1: { cellWidth: 45 }, 2: { cellWidth: 30 },
        3: { cellWidth: 30 }, 4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 25, halign: 'center' },
      },
      margin: { left: margin, right: margin }, tableWidth: 'auto',
      didDrawCell: (data) => {
        if (data.column.index === 5 && data.cell.raw === '___SIG___') {
          const sp = sigPositions.find(p => p.row === data.row.index);
          if (sp) {
            try {
              doc.addImage(
                sp.data, 'PNG',
                data.cell.x + 2, data.cell.y + 2,
                Math.min(data.cell.width - 4, 20),
                Math.min(data.cell.height - 4, 12)
              );
            } catch {
              doc.setFontSize(7); doc.setTextColor(100);
              doc.text('✓', data.cell.x + 2, data.cell.y + 8);
            }
          }
        }
      },
    });
    y = doc.lastAutoTable.finalY + 6;

    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    const decl = 'I hereby declare that the foregoing particulars are true to the best of my knowledge and belief and agree to abide by the by-laws of the society and any variations by the Credit Committee in respect to the amount of loan applied and the repayment period. I authorize the necessary recoveries in repayment of the loan to be made from my salary/bank account.';
    const splitD = doc.splitTextToSize(decl, pageWidth - margin * 2);
    doc.text(splitD, margin, y);
    y += splitD.length * 4 + 4;

    autoTable(doc, {
      startY: y,
      body: [['APPLICANT\'S SIGNATURE', 'DATE']],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4, minCellHeight: 30 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 80 } },
      margin: { left: margin, right: margin }, tableWidth: 'auto',
    });

    const sigY = doc.lastAutoTable.finalY - 22;
    if (loanee.signature && loanee.signature.signatureData) {
      try {
        doc.addImage(loanee.signature.signatureData, 'PNG', margin + 5, sigY, 60, 22);
      } catch {
        doc.setFontSize(9);
        doc.text('(Signature captured)', margin + 5, sigY + 10);
      }
    } else {
      doc.setFontSize(9);
      doc.text('_________________________', margin + 5, sigY + 10);
    }
    doc.setFontSize(9);
    doc.text(formatDate(application.applicationDate) || new Date().toLocaleDateString(), margin + 85, sigY + 10);
    y = doc.lastAutoTable.finalY + 6;

    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('LOAN APPROVAL (OFFICIAL USE ONLY)', margin, y); y += 6;

    const statusUpper = application.statusDescription?.toUpperCase();
    const approvalStatus = statusUpper === 'APPROVED' ? 'APPROVED' : statusUpper === 'REJECTED' ? 'NOT APPROVED' : 'PENDING';

    autoTable(doc, {
      startY: y,
      body: [['Approved/Not approved (delete as appropriate)', approvalStatus]],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4, minCellHeight: 12 },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold' },
        1: { cellWidth: 80, halign: 'center' },
      },
      margin: { left: margin, right: margin }, tableWidth: 'auto',
    });
    y = doc.lastAutoTable.finalY + 6;

    autoTable(doc, {
      startY: y,
      body: [
        ['Amount Approved:', formatCurrency(application.approvedAmount)],
        ['Monthly Repayment:', formatCurrency(application.monthlyPayback)],
        ['Total Payback:', formatCurrency(application.totalPayback)],
        ['Interest:', formatCurrency(application.totalInterest)],
        ['APR:', `${application.apr || 0}%`],
        ['Term:', `${application.termMonths || 0} months`],
      ],
      theme: 'grid', styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50, fillColor: [240, 240, 240] },
        1: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin }, tableWidth: 'auto',
    });
    y = doc.lastAutoTable.finalY + 8;

    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('CREDIT COMMITTEE SIGNATURES', margin, y); y += 5;

    const committeeSigs = application.creditCommitteeSignatures || application.officerSignatures || [];
    const sigRows = committeeSigs.length > 0
      ? committeeSigs.map((s, i) => [
          (i + 1).toString(),
          s.officerName || s.assignedBy || 'Unknown',
          s.username || 'N/A',
          formatDate(s.signatureDate || s.createdDate || new Date()),
          (s.signatureData || s.signature) ? '___SIG___' : 'Not Signed',
        ])
      : [
          ['1', '___________', '___________', '___________', '___________'],
          ['2', '___________', '___________', '___________', '___________'],
        ];

    autoTable(doc, {
      startY: y,
      head: [['#', 'Officer Name', 'Username', 'Date', 'Signature']],
      body: sigRows, theme: 'grid',
      headStyles: { fillColor: [55, 65, 81], textColor: 255, fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 10 }, 1: { cellWidth: 50 }, 2: { cellWidth: 30 },
        3: { cellWidth: 40 }, 4: { cellWidth: 50, halign: 'center' },
      },
      margin: { left: margin, right: margin }, tableWidth: 'auto',
      didDrawCell: (data) => {
        if (data.column.index === 4 && data.cell.raw === '___SIG___') {
          const s = committeeSigs[data.row.index];
          const sigData = s?.signatureData || s?.signature;
          if (sigData) {
            try {
              doc.addImage(
                sigData, 'PNG',
                data.cell.x + 2, data.cell.y + 2,
                Math.min(data.cell.width - 4, 25),
                Math.min(data.cell.height - 4, 15)
              );
            } catch {
              doc.setFontSize(7);
              doc.text('✓ Signed', data.cell.x + 2, data.cell.y + 8);
            }
          }
        }
      },
    });

    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setFontSize(8); doc.setFont('helvetica', 'italic');
    doc.text('This is a system-generated document. For official use only.', pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Loan Case ID: ${application.loanCaseId || 'N/A'}`, pageWidth / 2, footerY + 5, { align: 'center' });

    doc.save(`Loan_Application_Form_${application.loanCaseId?.substring(0, 8) || 'Unknown'}.pdf`);
  };

  // ── Print ────────────────────────────────────────────────────────────
  const printApplication = (application) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      safeAlert({ title: 'Error', text: 'Unable to open print window. Please check popup settings.', icon: 'error' });
      return;
    }

    const loanee = application.loanee || {};
    const sigHtml = loanee.signature?.signatureData
      ? `<img src="${loanee.signature.signatureData}" style="height:50px;border:1px solid #ddd;padding:5px;background:white;object-fit:contain;" />`
      : '<span style="color:#999;">No signature provided</span>';

    const guarantorRows = (application.guarantors || []).map((g, i) => {
      const sig = g.signature?.signatureData
        ? `<img src="${g.signature.signatureData}" style="height:30px;border:1px solid #ddd;padding:2px;background:white;object-fit:contain;" />`
        : '—';
      return `<tr>
        <td>${i + 1}</td><td>${g.fullName || 'N/A'}</td>
        <td>${g.memberNumber || 'N/A'}</td><td>${g.idNumber || 'N/A'}</td>
        <td>${formatCurrency(g.amountGuaranteed)}</td>
        <td>${g.statusDescription || 'Pending'}</td><td>${sig}</td>
      </tr>`;
    }).join('');

    const committeeSigs = application.creditCommitteeSignatures || application.officerSignatures || [];
    const committeeRows = committeeSigs.length > 0
      ? committeeSigs.map((s, i) => {
          const sig = (s.signatureData || s.signature)
            ? `<img src="${s.signatureData || s.signature}" style="height:30px;border:1px solid #ddd;padding:2px;background:white;" />`
            : '—';
          return `<tr>
            <td>${i + 1}</td><td>${s.officerName || s.assignedBy || 'Unknown'}</td>
            <td>${s.username || 'N/A'}</td>
            <td>${formatDate(s.signatureDate || s.createdDate)}</td>
            <td>${sig}</td>
          </tr>`;
        }).join('')
      : '';

    const content = `<!DOCTYPE html><html><head><title>Loan Application - ${application.loanCaseId}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:40px;color:#333}
        .header{text-align:center;border-bottom:2px solid #4f46e5;padding-bottom:20px;margin-bottom:30px}
        .header h1{color:#4f46e5;margin:0}
        .section{margin-bottom:25px}
        .section h2{color:#4f46e5;border-bottom:1px solid #e5e7eb;padding-bottom:8px}
        .row{display:flex;padding:6px 0;border-bottom:1px solid #f3f4f6}
        .label{font-weight:bold;width:200px;flex-shrink:0;color:#4b5563}
        .value{flex:1}
        .status-badge{display:inline-block;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;background:#dbeafe;color:#1e40af}
        .guarantors-table{width:100%;border-collapse:collapse;margin-top:10px}
        .guarantors-table th{background:#f3f4f6;padding:8px;border:1px solid #e5e7eb;text-align:left;font-size:12px}
        .guarantors-table td{padding:8px;border:1px solid #e5e7eb;font-size:12px;vertical-align:middle}
        .footer{margin-top:40px;text-align:center;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb;padding-top:20px}
        .committee-section{margin-top:20px;border-top:2px solid #4f46e5;padding-top:15px}
        @media print { body{margin:20px} .no-print{display:none} }
      </style></head><body>
      <div class="header">
        <h1>RUBANI SACCO</h1>
        <p>Loan Application Form</p>
        <p style="font-size:12px">Generated: ${new Date().toLocaleString()}</p>
      </div>
      <div class="section"><h2>Personal Information</h2>
        <div class="row"><span class="label">Name:</span><span class="value">${loanee.fullName || 'N/A'}</span></div>
        <div class="row"><span class="label">Member Number:</span><span class="value">${loanee.memberNumber || 'N/A'}</span></div>
        <div class="row"><span class="label">ID/Passport No:</span><span class="value">${loanee.idNumber || 'N/A'}</span></div>
        <div class="row"><span class="label">Phone Number:</span><span class="value">${loanee.mobile || 'N/A'}</span></div>
        <div class="row"><span class="label">Email:</span><span class="value">${loanee.email || 'N/A'}</span></div>
        <div class="row"><span class="label">Employer:</span><span class="value">${loanee.employer || 'N/A'}</span></div>
        <div class="row"><span class="label">Staff Number:</span><span class="value">${loanee.payrollNumber || 'N/A'}</span></div>
        ${loanee.bankName && loanee.bankName !== 'N/A' ? `<div class="row"><span class="label">Bank Name:</span><span class="value">${loanee.bankName}</span></div>` : ''}
        ${loanee.bankBranch && loanee.bankBranch !== 'N/A' ? `<div class="row"><span class="label">Branch:</span><span class="value">${loanee.bankBranch}</span></div>` : ''}
        ${loanee.bankAccount && loanee.bankAccount !== 'N/A' ? `<div class="row"><span class="label">Account No:</span><span class="value">${loanee.bankAccount}</span></div>` : ''}
      </div>
      <div class="section"><h2>Loan Details</h2>
        <div class="row"><span class="label">Product:</span><span class="value">${application.loanProductName || 'N/A'}</span></div>
        <div class="row"><span class="label">Amount Applied:</span><span class="value">${formatCurrency(application.amountApplied)}</span></div>
        <div class="row"><span class="label">In Words:</span><span class="value">${numberToWords(application.amountApplied)}</span></div>
        <div class="row"><span class="label">Term:</span><span class="value">${application.termMonths || 0} months</span></div>
        <div class="row"><span class="label">Status:</span><span class="value"><span class="status-badge">${application.statusDescription || 'Pending'}</span></span></div>
        <div class="row"><span class="label">Application Date:</span><span class="value">${formatDate(application.applicationDate)}</span></div>
      </div>
      ${(application.guarantors || []).length > 0 ? `
        <div class="section"><h2>Guarantors</h2>
          <table class="guarantors-table"><thead><tr>
            <th>#</th><th>Name</th><th>Member No</th><th>ID No</th><th>Amount</th><th>Status</th><th>Signature</th>
          </tr></thead><tbody>${guarantorRows}</tbody></table>
        </div>` : ''}
      <div class="section"><h2>Applicant Signature</h2>
        <div class="row"><span class="label">Signature:</span><span class="value">${sigHtml}</span></div>
        <div class="row"><span class="label">Method:</span><span class="value">${loanee.signature?.signatureMethod || 'N/A'}</span></div>
        <div class="row"><span class="label">Signed Date:</span><span class="value">${formatDate(loanee.signature?.createdDate)}</span></div>
      </div>
      <div class="section committee-section"><h2>Loan Approval (Official Use Only)</h2>
        <div class="row"><span class="label">Status:</span><span class="value"><span class="status-badge">${application.statusDescription || 'Pending'}</span></span></div>
        <div class="row"><span class="label">Approved Amount:</span><span class="value">${formatCurrency(application.approvedAmount)}</span></div>
        <div class="row"><span class="label">Monthly Repayment:</span><span class="value">${formatCurrency(application.monthlyPayback)}</span></div>
        <div class="row"><span class="label">Total Payback:</span><span class="value">${formatCurrency(application.totalPayback)}</span></div>
        <div class="row"><span class="label">Interest:</span><span class="value">${formatCurrency(application.totalInterest)}</span></div>
        <div class="row"><span class="label">APR:</span><span class="value">${application.apr || 0}%</span></div>
        <div class="row"><span class="label">Term:</span><span class="value">${application.termMonths || 0} months</span></div>
      </div>
      ${committeeSigs.length > 0 ? `
        <div class="section committee-section"><h2>Credit Committee Signatures</h2>
          <table class="guarantors-table"><thead><tr>
            <th>#</th><th>Officer Name</th><th>Username</th><th>Date</th><th>Signature</th>
          </tr></thead><tbody>${committeeRows}</tbody></table>
        </div>` : ''}
      <div class="footer">
        This is a system-generated document. For official use only.<br>
        Loan Case ID: ${application.loanCaseId || 'N/A'}
      </div>
      <div class="no-print" style="text-align:center;margin-top:20px;">
        <button onclick="window.print()" style="padding:10px 30px;background:#4f46e5;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;">🖨️ Print</button>
        <button onclick="window.close()" style="padding:10px 30px;background:#6b7280;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;margin-left:10px;">Close</button>
      </div>
    </body></html>`;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => { printWindow.focus(); printWindow.print(); }, 500);
    };
  };

  const handleRefresh = async () => {
    blurActiveElement();
    setRefreshing(true);
    await fetchApplications();
  };

  // ── Loading state ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-lg">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-600 text-lg font-medium">Loading online loan applications...</p>
        <p className="text-gray-400 text-sm">Please wait while we fetch your applications</p>
      </div>
    );
  }

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-gradient-to-r from-indigo-700 to-indigo-900 px-6 py-5 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-xl">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Online Loan Applications</h2>
            <p className="text-indigo-200 text-sm">
              {totalCount} application{totalCount !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <Button
            variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name, member number, loan reference, product, status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      {filteredApplications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <FileText className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Applications Found</h3>
          <p className="text-gray-400 text-sm">
            {searchTerm ? 'Try adjusting your search criteria' : 'No online loan applications available'}
          </p>
        </div>
      ) : (
        <>
          <div className="border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700">#</TableHead>
                    <TableHead className="font-semibold text-gray-700">Loanee</TableHead>
                    <TableHead className="font-semibold text-gray-700">Product</TableHead>
                    <TableHead className="font-semibold text-gray-700">Amount</TableHead>
                    <TableHead className="font-semibold text-gray-700">Monthly</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Date</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedApplications.map((app, index) => {
                    const globalIndex = (currentPage - 1) * pageSize + index + 1;
                    const loanee = app.loanee || {};
                    const canSendToCommittee =
                      app.loanStatus === 48832 || app.loanStatus === 48831 ||
                      app.statusDescription === 'Appraised' || app.statusDescription === 'Pending Review';

                    return (
                      <TableRow key={app.loanCaseId || index} className="hover:bg-indigo-50/50 transition-colors">
                        <TableCell className="font-medium text-gray-500">{globalIndex}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800">{loanee.fullName || 'N/A'}</span>
                            <span className="text-xs text-gray-500">Member: {loanee.memberNumber || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell><span className="text-sm">{app.loanProductName || 'N/A'}</span></TableCell>
                        <TableCell>
                          <span className="font-medium text-indigo-600">{formatCurrency(app.amountApplied)}</span>
                        </TableCell>
                        <TableCell>
                          {app.monthlyPayback > 0
                            ? <span className="text-green-600 font-medium">{formatCurrency(app.monthlyPayback)}</span>
                            : <span className="text-gray-400 text-sm">Pending</span>}
                        </TableCell>
                        <TableCell>{getStatusBadge(app.statusDescription)}</TableCell>
                        <TableCell><span className="text-xs text-gray-600">{formatDate(app.applicationDate)}</span></TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost" size="sm" onClick={() => viewDetails(app)}
                              className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm"
                                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                  title="More Options">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => generateLoanPDF(app)} className="flex items-center gap-2 cursor-pointer">
                                  <FileDown className="h-4 w-4 text-indigo-600" />
                                  <span>Download PDF</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => printApplication(app)} className="flex items-center gap-2 cursor-pointer">
                                  <Printer className="h-4 w-4 text-gray-600" />
                                  <span>Print</span>
                                </DropdownMenuItem>
                                {canSendToCommittee && (
                                  <DropdownMenuItem
                                    onClick={() => openCreditCommitteeModal(app)}
                                    className="flex items-center gap-2 cursor-pointer text-indigo-600 hover:text-indigo-800 border-t border-gray-100 pt-2 mt-1"
                                  >
                                    <Send className="h-4 w-4" />
                                    <span>Send to Credit Committee</span>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {totalFilteredPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredApplications.length)} of {filteredApplications.length} results
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1} className="h-8 px-3">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-gray-700">Page {currentPage} of {totalFilteredPages}</span>
                <Button variant="outline" size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalFilteredPages))}
                  disabled={currentPage === totalFilteredPages} className="h-8 px-3">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-indigo-600" />
              Loan Application Details
            </DialogTitle>
            <DialogDescription>
              View complete loan application details including loanee information, loan details, and guarantors.
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Loan Case ID</p>
                  <p className="font-mono text-sm font-semibold text-indigo-700">{selectedApplication.loanCaseId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Loan Reference</p>
                  <p className="font-mono text-sm">{selectedApplication.loanReference || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {getStatusBadge(selectedApplication.statusDescription)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Product</p>
                  <p className="font-medium">{selectedApplication.loanProductName}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-indigo-600" /> Loanee Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div><p className="text-xs text-gray-500">Full Name</p><p className="font-medium">{selectedApplication.loanee?.fullName || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-500">Member Number</p><p className="font-mono">{selectedApplication.loanee?.memberNumber || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-500">Payroll Number</p><p className="font-mono">{selectedApplication.loanee?.payrollNumber || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-500">ID Number</p><p className="font-mono">{selectedApplication.loanee?.idNumber || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-500">Mobile</p><p className="font-mono">{selectedApplication.loanee?.mobile || 'N/A'}</p></div>
                  {selectedApplication.loanee?.signature && (
                    <div>
                      <p className="text-xs text-gray-500">Signature</p>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {selectedApplication.loanee.signature.signatureMethod || 'Provided'}
                      </Badge>
                    </div>
                  )}
                </div>
                {selectedApplication.loanee?.signature?.signatureData && (
                  <div className="mt-4 p-3 bg-white border rounded-lg">
                    <p className="text-xs text-gray-500 mb-2">Signature Image</p>
                    <img src={selectedApplication.loanee.signature.signatureData} alt="Applicant Signature"
                      className="h-16 w-auto border rounded" style={{ objectFit: 'contain' }} />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-indigo-600" /> Loan Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div><p className="text-xs text-gray-500">Product</p><p className="font-medium">{selectedApplication.loanProductName}</p></div>
                  <div><p className="text-xs text-gray-500">Amount Applied</p><p className="font-bold text-indigo-600">{formatCurrency(selectedApplication.amountApplied)}</p></div>
                  <div><p className="text-xs text-gray-500">Approved</p><p className="font-medium">{formatCurrency(selectedApplication.approvedAmount)}</p></div>
                  <div><p className="text-xs text-gray-500">Disbursed</p><p className="font-medium">{formatCurrency(selectedApplication.disbursedAmount)}</p></div>
                  <div><p className="text-xs text-gray-500">Monthly Payback</p><p className="font-medium text-green-600">{formatCurrency(selectedApplication.monthlyPayback)}</p></div>
                  <div><p className="text-xs text-gray-500">Total Payback</p><p className="font-medium">{formatCurrency(selectedApplication.totalPayback)}</p></div>
                  <div><p className="text-xs text-gray-500">Total Interest</p><p className="font-medium">{formatCurrency(selectedApplication.totalInterest)}</p></div>
                  <div><p className="text-xs text-gray-500">Total Balance</p><p className="font-medium">{formatCurrency(selectedApplication.totalLoansBalance)}</p></div>
                  <div><p className="text-xs text-gray-500">Term</p><p className="font-medium">{selectedApplication.termMonths || 0} months</p></div>
                  <div><p className="text-xs text-gray-500">APR</p><p className="font-medium">{selectedApplication.apr || 0}%</p></div>
                  <div><p className="text-xs text-gray-500">Guarantors</p><p className="font-medium">{selectedApplication.guarantorCount || 0}</p></div>
                  <div><p className="text-xs text-gray-500">Total Guaranteed</p><p className="font-medium">{formatCurrency(selectedApplication.totalGuaranteed)}</p></div>
                  <div><p className="text-xs text-gray-500">Application Date</p><p className="text-sm">{formatDate(selectedApplication.applicationDate)}</p></div>
                </div>
              </div>

              {(selectedApplication.guarantors || []).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" /> Guarantors ({selectedApplication.guarantors.length})
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="text-xs">#</TableHead>
                          <TableHead className="text-xs">Name</TableHead>
                          <TableHead className="text-xs">Member No</TableHead>
                          <TableHead className="text-xs">ID No</TableHead>
                          <TableHead className="text-xs">Amount</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Signature</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedApplication.guarantors.map((g, idx) => {
                          const hasSignature = g.signature && g.signature.signatureData;
                          return (
                            <TableRow key={g.guarantorId || idx}>
                              <TableCell className="text-xs">{idx + 1}</TableCell>
                              <TableCell className="text-sm font-medium">{g.fullName || 'N/A'}</TableCell>
                              <TableCell className="text-xs font-mono">{g.memberNumber || 'N/A'}</TableCell>
                              <TableCell className="text-xs font-mono">{g.idNumber || 'N/A'}</TableCell>
                              <TableCell className="text-xs font-medium text-indigo-600">{formatCurrency(g.amountGuaranteed)}</TableCell>
                              <TableCell>
                                <Badge className={`text-xs ${
                                  g.statusDescription === 'Approved' ? 'bg-green-100 text-green-800' :
                                  g.statusDescription === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>{g.statusDescription || 'Pending'}</Badge>
                              </TableCell>
                              <TableCell>
                                {hasSignature
                                  ? <img src={g.signature.signatureData} alt="Guarantor Signature"
                                      className="h-8 w-auto border rounded object-contain bg-white" />
                                  : <span className="text-gray-400 text-xs">—</span>}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => selectedApplication && generateLoanPDF(selectedApplication)} className="flex items-center gap-2">
              <FileDown className="h-4 w-4" /> Download PDF
            </Button>
            <Button variant="outline" onClick={() => selectedApplication && printApplication(selectedApplication)} className="flex items-center gap-2">
              <Printer className="h-4 w-4" /> Print
            </Button>
            {selectedApplication && (selectedApplication.loanStatus === 48832 || selectedApplication.loanStatus === 48831 || selectedApplication.statusDescription === 'Appraised' || selectedApplication.statusDescription === 'Pending Review') && (
              <Button variant="default"
                onClick={() => { setDetailModalOpen(false); openCreditCommitteeModal(selectedApplication); }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Send className="h-4 w-4" /> Send to Credit Committee
              </Button>
            )}
            <Button onClick={() => setDetailModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credit Committee Modal */}
      <Dialog open={showCreditCommitteeModal} onOpenChange={setShowCreditCommitteeModal}>
        <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Briefcase className="h-5 w-5 text-indigo-600" />
              Send to Credit Committee
            </DialogTitle>
            <DialogDescription>
              Review the loan details and provide your signature to submit to the credit committee.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600"><span className="font-semibold">Loanee:</span> {selectedApplication?.loanee?.fullName || 'N/A'}</p>
              <p className="text-sm text-gray-600"><span className="font-semibold">Product:</span> {selectedApplication?.loanProductName || 'N/A'}</p>
              <p className="text-sm text-gray-600"><span className="font-semibold">Amount:</span> {formatCurrency(selectedApplication?.amountApplied)}</p>
              <p className="text-sm text-gray-600"><span className="font-semibold">Case ID:</span> {selectedApplication?.loanCaseId || 'N/A'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                value={committeeRemarks}
                onChange={(e) => setCommitteeRemarks(e.target.value)}
                placeholder="Enter remarks for credit committee review..."
                className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Fingerprint className="h-5 w-5 text-indigo-600" />
                <span className="font-semibold text-gray-700">Officer Signature</span>
                <span className="text-red-500">*</span>
              </div>

              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    signatureMethod === 'Draw'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setSignatureMethod('Draw');
                    setSignatureData(null);
                    setSignatureSaved(false);
                    setSignaturePreview(null);
                    if (signaturePadRef) signaturePadRef.clear();
                  }}
                >
                  <PenTool className="h-4 w-4 inline mr-1" /> Draw Signature
                </button>
                <button
                  type="button"
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    signatureMethod === 'Upload'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setSignatureMethod('Upload');
                    setSignatureData(null);
                    setSignatureSaved(false);
                    if (signaturePadRef) signaturePadRef.clear();
                  }}
                >
                  <Upload className="h-4 w-4 inline mr-1" /> Upload Signature
                </button>
              </div>

              {signatureStatus.officerCount > 0 && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">Signature Status</span>
                    <span className="text-sm font-bold text-blue-800">
                      {signatureStatus.officerCount} / {signatureStatus.requiredCount}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(signatureStatus.officerCount / signatureStatus.requiredCount) * 100}%` }} />
                  </div>
                  {signatureStatus.signatures.length > 0 && (
                    <div className="mt-2 text-xs text-blue-600">
                      Signed by: {signatureStatus.signatures.map(s => s.officer).join(', ')}
                    </div>
                  )}
                  {signatureStatus.isComplete && (
                    <div className="mt-2 text-xs text-green-600 font-medium">✅ All signatures collected!</div>
                  )}
                </div>
              )}

              {signatureMethod === 'Draw' && (
                <div className="space-y-3">
                  <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                    <SignatureCanvas
                      ref={(ref) => setSignaturePadRef(ref)}
                      canvasProps={{
                        className: 'signature-canvas w-full',
                        height: 120,
                        style: { width: '100%', height: '120px' },
                      }}
                      backgroundColor="rgb(255,255,255)"
                      penColor="rgb(0,0,0)"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleSignatureClear}
                      className="text-red-600 border-red-300 hover:bg-red-50">
                      Clear
                    </Button>
                    <Button type="button" size="sm" onClick={handleSignatureSave}
                      className="bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle className="h-4 w-4 mr-1" /> Save Signature
                    </Button>
                    {signatureSaved && (
                      <span className="text-sm text-green-600 font-medium flex items-center ml-2">
                        <CheckCircle className="h-4 w-4 mr-1" /> Signed
                      </span>
                    )}
                  </div>
                </div>
              )}

              {signatureMethod === 'Upload' && (
                <div className="space-y-3">
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileUpload} className="hidden" />
                  {signaturePreview ? (
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <img src={signaturePreview} alt="Uploaded signature"
                        className="h-20 w-auto mx-auto border rounded object-contain bg-white" />
                      <div className="flex justify-center gap-2 mt-2">
                        <Button type="button" variant="outline" size="sm" onClick={triggerFileUpload} className="text-indigo-600">
                          <Upload className="h-4 w-4 mr-1" /> Change
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={removeUploadedFile}
                          className="text-red-600 border-red-300 hover:bg-red-50">
                          <XCircle className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={triggerFileUpload}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors bg-gray-50 hover:bg-gray-100">
                      <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload signature image</p>
                      <p className="text-xs text-gray-400">PNG, JPG, JPEG (Max 5MB)</p>
                    </div>
                  )}
                </div>
              )}

              {signatureError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {signatureError}
                </div>
              )}

              {signatureSaved && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Signature saved successfully!
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>This action requires your signature. The loan will be sent to the Credit Committee for review after a minimum of 2 officer signatures are collected.</span>
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline"
              onClick={() => { blurActiveElement(); setShowCreditCommitteeModal(false); }}
              disabled={submittingToCommittee}>
              Cancel
            </Button>
            <Button
              onClick={submitToCreditCommittee}
              disabled={submittingToCommittee || !committeeRemarks.trim() || !signatureSaved}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {submittingToCommittee ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="h-4 w-4" /> Send to Committee</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}