import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Logo from "../../images/Logo2.png";
import {
  faTimes,
  faFilePdf,
  faDownload,
  faPrint,
  faClipboard,
  faNotesMedical,
  faPills,
} from "@fortawesome/free-solid-svg-icons";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/** Convert an imported image to Base64 for jsPDF */
const loadImageAsBase64 = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = src;
  });

export default function PatientReportModal({ open, details, formatDate, onClose }) {
  const modalRef = useRef(null);
  const [reportNotes, setReportNotes] = useState(details?.notes || "");

  useEffect(() => setReportNotes(details?.notes || ""), [details]);

  const medicationText = useMemo(() => {
    if (!details?.medicationList?.length) return "None";
    return details.medicationList.join(", ");
  }, [details]);

  // ESC + focus trap
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose();

      if (e.key === "Tab") {
        const focusable = modalRef.current?.querySelectorAll(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleCopy = async () => {
    const text = [
      "PATIENT REPORT",
      "----------------",
      `Name: ${details?.name ?? "N/A"}`,
      `ID: ${details?.id ?? "N/A"}`,
      `Age: ${details?.age ?? "N/A"}`,
      `Gender: ${details?.gender ?? "N/A"}`,
      `Contact: ${details?.contact ?? "N/A"}`,
      `Doctor: ${details?.assignedDoctorName ?? "N/A"}`,
      `Doctor Reg No: ${details?.doctorRegNo ?? "N/A"}`,
      `Last Clinic: ${formatDate(details?.lastClinicDate)}`,
      `Next Clinic: ${formatDate(details?.nextClinicDate)}`,
      `Medication: ${medicationText}`,
      `Notes: ${reportNotes || "None"}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.prompt("Copy report text", text);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Patient Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { font-size: 20px; margin: 0 0 8px; }
            .muted { color:#6b7280; font-size:12px; margin-bottom:12px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; }
            p { margin: 6px 0; font-size: 14px; }
            .label { font-weight: 700; display:inline-block; width:150px; }
          </style>
        </head>
        <body>
          <h1>Patient Report</h1>
          <div class="muted">Generated: ${new Date().toLocaleString()}</div>

          <div class="grid">
            <div class="card">
              <p><span class="label">Name:</span> ${escapeHtml(details?.name ?? "N/A")}</p>
              <p><span class="label">ID:</span> ${escapeHtml(details?.id ?? "N/A")}</p>
              <p><span class="label">Age:</span> ${escapeHtml(String(details?.age ?? "N/A"))}</p>
              <p><span class="label">Gender:</span> ${escapeHtml(details?.gender ?? "N/A")}</p>
              <p><span class="label">Contact:</span> ${escapeHtml(details?.contact ?? "N/A")}</p>
            </div>

            <div class="card">
              <p><span class="label">Doctor:</span> ${escapeHtml(details?.assignedDoctorName ?? "N/A")}</p>
              <p><span class="label">Doctor Reg No:</span> ${escapeHtml(details?.doctorRegNo ?? "N/A")}</p>
              <p><span class="label">Last Clinic:</span> ${escapeHtml(formatDate(details?.lastClinicDate))}</p>
              <p><span class="label">Next Clinic:</span> ${escapeHtml(formatDate(details?.nextClinicDate))}</p>
            </div>
          </div>

          <div class="card" style="margin-top:12px;">
            <p><span class="label">Medication:</span> ${escapeHtml(medicationText)}</p>
            <p><span class="label">Notes:</span> ${escapeHtml(reportNotes || "None")}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // ✅ Letterhead PDF (with upgraded Patient Info Box)
  const handleDownloadPDF = async () => {
    if (!details) return;

    const doc = new jsPDF("p", "pt", "a4");
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const BLUE = [15, 82, 186];
    const LIGHT_BG = [245, 248, 255];
    const BORDER = [210, 220, 235];
    const TEXT_DARK = [20, 30, 45];
    const margin = 36;

    // Header bar
    doc.setFillColor(...BLUE);
    doc.rect(0, 0, pageW, 78, "F");

    // Logo
    let logoBase64 = null;
    try {
      logoBase64 = await loadImageAsBase64(Logo);
    } catch {
      logoBase64 = null;
    }

    // White rounded background for logo
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, 18, 42, 42, 10, 10, "F");

    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", margin + 4, 22, 34, 34);
    } else {
      doc.setTextColor(...BLUE);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("K", margin + 14, 46);
    }

    // Header text
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("KneeCare Software", margin + 55, 34);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Improving Knee Health, Enhancing Quality of Life.", margin + 55, 54);

    // Right contact
    const rightX = pageW - margin - 150;
    doc.setFontSize(9);
    doc.text("Tele: +94 77 123 4567", rightX, 28);
    doc.text("Email: kneecare@report.com", rightX, 42);
    doc.text("Web: www.kneecare.com", rightX, 56);

    // Body start
    let y = 100;

    doc.setTextColor(...TEXT_DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Patient Details", margin, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 110, 140);
    doc.text(`Report No: ${details?.id || "N/A"}`, pageW - margin, y, { align: "right" });
    y += 12;
    doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, pageW - margin, y, { align: "right" });

    y += 16;

    // ======================================================
    // ✅ UPGRADED PATIENT BOX (2-column grid + divider)
    // ======================================================
    doc.setDrawColor(...BORDER);
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(margin, y, pageW - margin * 2, 92, 12, 12, "FD");

    // center divider
    doc.setDrawColor(220, 230, 245);
    doc.setLineWidth(1);
    doc.line(pageW / 2, y + 14, pageW / 2, y + 92 - 14);

    const leftX = margin + 16;
    const rightX2 = pageW / 2 + 16;

    const labelColor = [90, 110, 140];
    const valueColor = TEXT_DARK;

    const rowY = (i) => y + 28 + i * 22;

    const kv = (x, yy, label, value) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...labelColor);
      doc.text(label, x, yy);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...valueColor);
      doc.text(String(value ?? "N/A"), x + 70, yy);
    };

    kv(leftX, rowY(0), "Patient:", details?.name);
    kv(leftX, rowY(1), "Gender:", details?.gender);
    kv(leftX, rowY(2), "Age:", details?.age);

    kv(rightX2, rowY(0), "Contact:", details?.contact);
    kv(rightX2, rowY(1), "Doctor:", details?.assignedDoctorName);
    kv(rightX2, rowY(2), "Dr Reg:", details?.doctorRegNo);

    y += 112;

    // Test title
    doc.setTextColor(...TEXT_DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("COMPLETE BLOOD COUNT", margin, y);
    y += 8;

    // Table rows (use details.results if available)
    const rows =
      details?.results?.length
        ? details.results.map((r) => [r.test || "", r.result || "", r.unit || "", r.ref || "", r.flag || ""])
        : [
            ["WBC", "7.0", "x10⁹/L", "4.0 - 11.0", ""],
            ["RBC", "5.1", "x10¹²/L", "4.5 - 5.9", ""],
            ["HGB", "15.2", "g/dL", "13.5 - 17.5", ""],
            ["HCT", "45", "%", "41 - 53", ""],
            ["Platelet", "250", "x10⁹/L", "150 - 450", ""],
          ];

    autoTable(doc, {
      startY: y + 8,
      head: [["TEST", "RESULT", "UNIT", "REFERENCE", "FLAG"]],
      body: rows,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 9,
        textColor: TEXT_DARK,
        cellPadding: 6,
        lineColor: BORDER,
        lineWidth: 0.7,
      },
      headStyles: {
        fillColor: BLUE,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 160 },
        1: { cellWidth: 80 },
        2: { cellWidth: 80 },
        3: { cellWidth: 140 },
        4: { cellWidth: 50, halign: "center" },
      },
      margin: { left: margin, right: margin },
    });

    y = doc.lastAutoTable.finalY + 16;

    // Medication & Notes box
    doc.setDrawColor(...BORDER);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, y, pageW - margin * 2, 78, 10, 10, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_DARK);
    doc.text("Medication", margin + 12, y + 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(70, 85, 110);
    doc.text(doc.splitTextToSize(medicationText || "None", pageW - margin * 2 - 24), margin + 12, y + 34);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_DARK);
    doc.text("Notes", margin + 12, y + 58);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(70, 85, 110);
    doc.text(doc.splitTextToSize(reportNotes || "None", pageW - margin * 2 - 24), margin + 12, y + 72);

    y += 98;

    // Signatures
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_DARK);
    doc.text("Authorized By", margin, y);
    doc.text("Consultant / Pathologist", pageW - margin, y, { align: "right" });

    doc.setDrawColor(160, 180, 210);
    doc.line(margin, y + 30, margin + 180, y + 30);
    doc.line(pageW - margin - 180, y + 30, pageW - margin, y + 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(90, 110, 140);
    doc.text("Signature", margin, y + 44);
    doc.text("Signature", pageW - margin, y + 44, { align: "right" });

    // Footer
    doc.setDrawColor(...BORDER);
    doc.line(margin, pageH - 44, pageW - margin, pageH - 44);
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 150);
    doc.text(
      "NOTE: This is a computer generated report. If you have concerns, consult your physician.",
      margin,
      pageH - 26
    );

    doc.save(`patient_report_${details?.id || "unknown"}.pdf`);
  };

  if (!open || !details) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-6"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-[28px] shadow-[0_18px_60px_rgba(0,0,0,0.25)] w-full max-w-3xl relative"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-6 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          title="Close"
          aria-label="Close"
        >
          <FontAwesomeIcon icon={faTimes} size="lg" />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <FontAwesomeIcon icon={faFilePdf} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-extrabold text-slate-900">Patient Report</h2>

                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700">
                  ID: {details?.id ?? "N/A"}
                </span>

                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
                  Active
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Downloaded PDF will be a lab-style letterhead report.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wide mb-3">
                Patient Details
              </div>
              <div className="space-y-2 text-sm text-slate-700">
                <p><span className="font-extrabold text-slate-800 w-[150px] inline-block">Name:</span>{details?.name ?? "N/A"}</p>
                <p><span className="font-extrabold text-slate-800 w-[150px] inline-block">Age:</span>{details?.age ?? "N/A"}</p>
                <p><span className="font-extrabold text-slate-800 w-[150px] inline-block">Gender:</span>{details?.gender ?? "N/A"}</p>
                <p><span className="font-extrabold text-slate-800 w-[150px] inline-block">Contact:</span>{details?.contact ?? "N/A"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wide mb-3">
                Clinical Details
              </div>
              <div className="space-y-2 text-sm text-slate-700">
                <p><span className="font-extrabold text-slate-800 w-[150px] inline-block">Doctor:</span>{details?.assignedDoctorName ?? "N/A"}</p>
                <p><span className="font-extrabold text-slate-800 w-[150px] inline-block">Doctor Reg No:</span>{details?.doctorRegNo ?? "N/A"}</p>
                <p><span className="font-extrabold text-slate-800 w-[150px] inline-block">Last Clinic:</span>{formatDate(details?.lastClinicDate)}</p>
                <p><span className="font-extrabold text-slate-800 w-[150px] inline-block">Next Clinic:</span>{formatDate(details?.nextClinicDate)}</p>
              </div>
            </div>
          </div>

          {/* Medication preview */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faPills} className="text-orange-500" />
                <h3 className="text-sm font-extrabold text-slate-900">Medication</h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {details?.medicationList?.length ? `${details.medicationList.length} item(s)` : "None"}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-700">{medicationText}</p>
          </div>

          {/* Notes */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <FontAwesomeIcon icon={faNotesMedical} className="text-slate-600" />
              <h3 className="text-sm font-extrabold text-slate-900">Notes</h3>
            </div>
            <textarea
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-slate-300"
              placeholder="Add notes for this patient..."
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-8 pb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 px-6 py-3 text-[15px] font-extrabold text-slate-700 hover:bg-slate-200"
            >
              <FontAwesomeIcon icon={faClipboard} />
              Copy
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-6 py-3 text-[15px] font-extrabold text-white hover:bg-sky-700"
            >
              <FontAwesomeIcon icon={faPrint} />
              Print
            </button>

            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-[15px] font-extrabold text-white hover:bg-emerald-700"
            >
              <FontAwesomeIcon icon={faDownload} />
              Download PDF
            </button>

            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full bg-slate-100 px-6 py-3 text-[15px] font-extrabold text-slate-700 hover:bg-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
