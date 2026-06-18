"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import DocumentChat from "./DocumentChat";
import DocumentPreview from "./DocumentPreview";
import { clearToken, apiFetch } from "@/lib/api";

interface SavedDocument {
  id: number;
  doc_type: string;
  doc_name: string;
  fields: Record<string, string>;
  updated_at: string;
}

interface Props {
  userName: string;
}

export default function DocumentApp({ userName }: Props) {
  const router = useRouter();
  const [docType, setDocType] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<SavedDocument[]>([]);
  const historyRef = useRef<HTMLDivElement>(null);
  const skipSaveRef = useRef(false);

  const handleLogout = () => {
    clearToken();
    router.push("/login/");
  };

  // Load history from backend
  const loadHistory = useCallback(async () => {
    try {
      const res = await apiFetch("/api/documents");
      if (res.ok) setHistory(await res.json());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Auto-save when fields change (skip when restoring from history)
  useEffect(() => {
    if (!docType || Object.keys(fields).length === 0) return;
    if (skipSaveRef.current) { skipSaveRef.current = false; return; }
    const docEntry = CATALOG_NAMES[docType] ?? docType.replace(".md", "").replace(/-/g, " ");
    apiFetch("/api/documents", {
      method: "POST",
      body: JSON.stringify({ docType, docName: docEntry, fields }),
    }).then(() => loadHistory()).catch(() => {});
  }, [fields, docType, loadHistory]);

  // Close history dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setHistoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLoadDocument = (doc: SavedDocument) => {
    skipSaveRef.current = true;
    setDocType(doc.doc_type);
    setFields(doc.fields);
    setHistoryOpen(false);
  };

  const handleDownloadPdf = useCallback(async () => {
    const element = document.getElementById("doc-preview");
    if (!element) return;
    setPdfLoading(true);
    try {
      const { toPng } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");
      const dataUrl = await toPng(element, { pixelRatio: 2, backgroundColor: "#ffffff" });
      const naturalWidth = element.scrollWidth * 2;
      const naturalHeight = element.scrollHeight * 2;
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (naturalHeight * pageW) / naturalWidth;
      let remaining = imgH;
      let pos = 0;
      pdf.addImage(dataUrl, "PNG", 0, pos, pageW, imgH);
      remaining -= pageH;
      while (remaining > 0) {
        pos -= pageH;
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, pos, pageW, imgH);
        remaining -= pageH;
      }
      const stem = docType ? docType.replace(".md", "") : "document";
      pdf.save(`${stem}.pdf`);
    } finally {
      setPdfLoading(false);
    }
  }, [docType]);

  const docLabel = docType
    ? (CATALOG_NAMES[docType] ?? docType.replace(".md", "").replace(/-/g, " "))
    : null;

  return (
    <div className="flex flex-col h-screen print:h-auto print:block">
      {/* Header */}
      <header className="flex-none bg-brand-navy px-4 py-0 flex items-center justify-between print:hidden h-14">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <div>
            <span className="text-white font-semibold text-sm">prelegal</span>
            {docLabel && (
              <span className="ml-2 text-white/50 text-xs hidden sm:inline">· {docLabel}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Document history dropdown */}
          <div className="relative" ref={historyRef}>
            <button
              onClick={() => setHistoryOpen((o) => !o)}
              className="px-3 py-1.5 text-xs border border-white/20 rounded text-white/80 hover:bg-white/10 transition-colors flex items-center gap-1"
            >
              <span>My Documents</span>
              {history.length > 0 && (
                <span className="ml-1 bg-brand-blue text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {history.length}
                </span>
              )}
            </button>

            {historyOpen && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-brand-navy uppercase tracking-wide">
                    Recent Documents
                  </span>
                  <button
                    onClick={() => { setDocType(null); setFields({}); setHistoryOpen(false); }}
                    className="text-xs text-brand-blue hover:underline"
                  >
                    + New
                  </button>
                </div>
                {history.length === 0 ? (
                  <p className="px-4 py-4 text-xs text-gray-400">No documents yet.</p>
                ) : (
                  <ul className="max-h-64 overflow-y-auto">
                    {history.map((doc) => (
                      <li key={doc.id}>
                        <button
                          onClick={() => handleLoadDocument(doc)}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                        >
                          <p className="text-sm font-medium text-gray-800 truncate">{doc.doc_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(doc.updated_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading || !docType}
            className="px-3 py-1.5 text-xs bg-brand-purple text-white rounded hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pdfLoading ? "Generating…" : "Download PDF"}
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-xs border border-white/20 rounded text-white/80 hover:bg-white/10 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Mobile tabs */}
      <div className="flex-none flex border-b border-gray-200 bg-white lg:hidden print:hidden">
        <button
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            mobileTab === "chat"
              ? "text-brand-blue border-b-2 border-brand-blue"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setMobileTab("chat")}
        >
          Chat
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            mobileTab === "preview"
              ? "text-brand-blue border-b-2 border-brand-blue"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setMobileTab("preview")}
        >
          Document
        </button>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden print:overflow-visible print:block">
        <aside
          className={`w-full lg:w-2/5 xl:w-1/3 bg-white border-r border-gray-100 flex flex-col print:hidden ${
            mobileTab === "preview" ? "hidden lg:flex" : ""
          }`}
        >
          <DocumentChat
            docType={docType}
            fields={fields}
            onDocTypeChange={setDocType}
            onFieldsChange={setFields}
          />
        </aside>

        <main
          className={`w-full lg:w-3/5 xl:w-2/3 overflow-y-auto bg-gray-50 print:bg-white ${
            mobileTab === "chat" ? "hidden lg:block" : ""
          }`}
        >
          <DocumentPreview docType={docType} fields={fields} />
        </main>
      </div>
    </div>
  );
}

// Friendly display names for document types
const CATALOG_NAMES: Record<string, string> = {
  "Mutual-NDA.md": "Mutual NDA",
  "Mutual-NDA-coverpage.md": "Mutual NDA Cover Page",
  "CSA.md": "Cloud Service Agreement",
  "design-partner-agreement.md": "Design Partner Agreement",
  "sla.md": "Service Level Agreement",
  "psa.md": "Professional Services Agreement",
  "DPA.md": "Data Processing Agreement",
  "Software-License-Agreement.md": "Software License Agreement",
  "Partnership-Agreement.md": "Partnership Agreement",
  "Pilot-Agreement.md": "Pilot Agreement",
  "BAA.md": "Business Associate Agreement",
  "AI-Addendum.md": "AI Addendum",
};
