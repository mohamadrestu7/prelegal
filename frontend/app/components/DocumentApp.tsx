"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DocumentChat from "./DocumentChat";
import DocumentPreview from "./DocumentPreview";

export default function DocumentApp() {
  const router = useRouter();
  const [docType, setDocType] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("loggedIn");
    router.push("/login/");
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
    ? docType.replace(".md", "").replace(/-/g, " ")
    : "Legal Document Assistant";

  return (
    <div className="flex flex-col h-screen print:h-auto print:block">
      {/* Header */}
      <header className="flex-none bg-brand-navy px-4 py-3 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">prelegal</h1>
          <p className="text-xs text-white/60">{docLabel}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading || !docType}
            className="px-3 py-1.5 text-sm bg-brand-purple text-white rounded hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pdfLoading ? "Generating..." : "Download PDF"}
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm border border-white/30 rounded text-white hover:bg-white/10 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Mobile tab bar */}
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

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden print:overflow-visible print:block">
        {/* Chat panel */}
        <aside
          className={`w-full lg:w-2/5 xl:w-1/3 bg-white border-r border-gray-200 flex flex-col print:hidden ${
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

        {/* Document preview */}
        <main
          className={`w-full lg:w-3/5 xl:w-2/3 overflow-y-auto bg-gray-100 print:bg-white ${
            mobileTab === "chat" ? "hidden lg:block" : ""
          }`}
        >
          <DocumentPreview docType={docType} fields={fields} />
        </main>
      </div>
    </div>
  );
}
