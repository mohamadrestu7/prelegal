"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import MndaChat from "./MndaChat";
import MndaDocument from "./MndaDocument";
import { MndaFormData, defaultFormData } from "@/types/mnda";

function generateTextDocument(data: MndaFormData): string {
  const mndaTermText =
    data.mndaTermType === "fixed"
      ? `Expires ${data.mndaTermYears} year${data.mndaTermYears === "1" ? "" : "s"} from Effective Date`
      : "Continues until terminated in accordance with the terms of the MNDA";

  const confidentialityText =
    data.confidentialityTermType === "fixed"
      ? `${data.confidentialityTermYears} year${data.confidentialityTermYears === "1" ? "" : "s"} from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws`
      : "In perpetuity";

  const effectiveDateDisplay = data.effectiveDate
    ? new Date(data.effectiveDate + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "[Effective Date]";

  const pad = (s: string, n: number) => s.padEnd(n);

  return `MUTUAL NON-DISCLOSURE AGREEMENT
Common Paper Mutual NDA — Version 1.0
=====================================

COVER PAGE
----------

Purpose:
${data.purpose || "[Not specified]"}

Effective Date: ${effectiveDateDisplay}

MNDA Term: ${mndaTermText}

Term of Confidentiality: ${confidentialityText}

Governing Law: ${data.governingLaw || "[Not specified]"}

Jurisdiction: ${data.jurisdiction || "[Not specified]"}
${data.modifications.trim() ? `\nMNDA Modifications:\n${data.modifications}\n` : ""}
By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.

                    PARTY 1                          PARTY 2
Signature:
Print Name:         ${pad(data.party1PrintName, 33)}${data.party2PrintName}
Title:              ${pad(data.party1Title, 33)}${data.party2Title}
Company:            ${pad(data.party1Company, 33)}${data.party2Company}
Notice Address:     ${pad(data.party1Address, 33)}${data.party2Address}
Date:


STANDARD TERMS
--------------

1. Introduction. This Mutual Non-Disclosure Agreement (which incorporates these Standard Terms and the Cover Page) ("MNDA") allows each party ("Disclosing Party") to disclose or make available information in connection with the Purpose which (1) the Disclosing Party identifies to the receiving party ("Receiving Party") as "confidential", "proprietary", or the like or (2) should be reasonably understood as confidential or proprietary due to its nature and the circumstances of its disclosure ("Confidential Information"). Each party's Confidential Information also includes the existence and status of the parties' discussions and information on the Cover Page. Confidential Information includes technical or business information, product designs or roadmaps, requirements, pricing, security and compliance documentation, technology, inventions and know-how. To use this MNDA, the parties must complete and sign a cover page incorporating these Standard Terms ("Cover Page"). Each party is identified on the Cover Page and capitalized terms have the meanings given herein or on the Cover Page.

2. Use and Protection of Confidential Information. The Receiving Party shall: (a) use Confidential Information solely for the Purpose; (b) not disclose Confidential Information to third parties without the Disclosing Party's prior written approval, except that the Receiving Party may disclose Confidential Information to its employees, agents, advisors, contractors and other representatives having a reasonable need to know for the Purpose, provided these representatives are bound by confidentiality obligations no less protective of the Disclosing Party than the applicable terms in this MNDA and the Receiving Party remains responsible for their compliance with this MNDA; and (c) protect Confidential Information using at least the same protections the Receiving Party uses for its own similar information but no less than a reasonable standard of care.

3. Exceptions. The Receiving Party's obligations in this MNDA do not apply to information that it can demonstrate: (a) is or becomes publicly available through no fault of the Receiving Party; (b) it rightfully knew or possessed prior to receipt from the Disclosing Party without confidentiality restrictions; (c) it rightfully obtained from a third party without confidentiality restrictions; or (d) it independently developed without using or referencing the Confidential Information.

4. Disclosures Required by Law. The Receiving Party may disclose Confidential Information to the extent required by law, regulation or regulatory authority, subpoena or court order, provided (to the extent legally permitted) it provides the Disclosing Party reasonable advance notice of the required disclosure and reasonably cooperates, at the Disclosing Party's expense, with the Disclosing Party's efforts to obtain confidential treatment for the Confidential Information.

5. Term and Termination. This MNDA commences on the Effective Date and expires at the end of the MNDA Term. Either party may terminate this MNDA for any or no reason upon written notice to the other party. The Receiving Party's obligations relating to Confidential Information will survive for the Term of Confidentiality, despite any expiration or termination of this MNDA.

6. Return or Destruction of Confidential Information. Upon expiration or termination of this MNDA or upon the Disclosing Party's earlier request, the Receiving Party will: (a) cease using Confidential Information; (b) promptly after the Disclosing Party's written request, destroy all Confidential Information in the Receiving Party's possession or control or return it to the Disclosing Party; and (c) if requested by the Disclosing Party, confirm its compliance with these obligations in writing. As an exception to subsection (b), the Receiving Party may retain Confidential Information in accordance with its standard backup or record retention policies or as required by law, but the terms of this MNDA will continue to apply to the retained Confidential Information.

7. Proprietary Rights. The Disclosing Party retains all of its intellectual property and other rights in its Confidential Information and its disclosure to the Receiving Party grants no license under such rights.

8. Disclaimer. ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS", WITH ALL FAULTS, AND WITHOUT WARRANTIES, INCLUDING THE IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.

9. Governing Law and Jurisdiction. This MNDA and all matters relating hereto are governed by, and construed in accordance with, the laws of the State of Governing Law, without regard to the conflict of laws provisions of such Governing Law. Any legal suit, action, or proceeding relating to this MNDA must be instituted in the federal or state courts located in Jurisdiction. Each party irrevocably submits to the exclusive jurisdiction of such Jurisdiction in any such suit, action, or proceeding.

10. Equitable Relief. A breach of this MNDA may cause irreparable harm for which monetary damages are an insufficient remedy. Upon a breach of this MNDA, the Disclosing Party is entitled to seek appropriate equitable relief, including an injunction, in addition to its other remedies.

11. General. Neither party has an obligation under this MNDA to disclose Confidential Information to the other or proceed with any proposed transaction. Neither party may assign this MNDA without the prior written consent of the other party, except that either party may assign this MNDA in connection with a merger, reorganization, acquisition or other transfer of all or substantially all its assets or voting securities. Any assignment in violation of this Section is null and void. This MNDA will bind and inure to the benefit of each party's permitted successors and assigns. Waivers must be signed by the waiving party's authorized representative and cannot be implied from conduct. If any provision of this MNDA is held unenforceable, it will be limited to the minimum extent necessary so the rest of this MNDA remains in effect. This MNDA (including the Cover Page) constitutes the entire agreement of the parties with respect to its subject matter, and supersedes all prior and contemporaneous understandings, agreements, representations, and warranties, whether written or oral, regarding such subject matter. This MNDA may only be amended, modified, waived, or supplemented by an agreement in writing signed by both parties. Notices, requests and approvals under this MNDA must be sent in writing to the email or postal addresses on the Cover Page and are deemed delivered on receipt. This MNDA may be executed in counterparts, including electronic copies, each of which is deemed an original and which together form the same agreement.

---
Common Paper Mutual Non-Disclosure Agreement Version 1.0
Free to use under CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/
Source: https://commonpaper.com/standards/mutual-nda/1.0/
`;
}

export default function MndaApp() {
  const router = useRouter();
  const [formData, setFormData] = useState<MndaFormData>(defaultFormData);
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("loggedIn");
    router.push("/login/");
  };

  const handleDownloadPdf = useCallback(async () => {
    const element = document.getElementById("mnda-document");
    if (!element) return;

    setPdfLoading(true);
    try {
      const { toPng } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const naturalWidth = element.scrollWidth * 2;
      const naturalHeight = element.scrollHeight * 2;

      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (naturalHeight * pageWidth) / naturalWidth;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("mutual-nda.pdf");
    } finally {
      setPdfLoading(false);
    }
  }, []);

  const handleDownloadText = useCallback(() => {
    const text = generateTextDocument(formData);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mutual-nda.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [formData]);

  return (
    <div className="flex flex-col h-screen print:h-auto print:block">
      {/* Header */}
      <header className="flex-none bg-brand-navy px-4 py-3 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">
            Mutual NDA Creator
          </h1>
          <p className="text-xs text-white/60">
            Common Paper Mutual NDA — Version 1.0
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadText}
            className="px-3 py-1.5 text-sm border border-white/30 rounded text-white hover:bg-white/10 transition-colors"
          >
            Download .txt
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
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
          <MndaChat formData={formData} onFormDataChange={setFormData} />
        </aside>

        {/* Document panel */}
        <main
          className={`w-full lg:w-3/5 xl:w-2/3 overflow-y-auto bg-gray-100 print:bg-white ${
            mobileTab === "chat" ? "hidden lg:block" : ""
          }`}
        >
          <div className="py-6 px-4 print:p-0">
            <MndaDocument data={formData} />
          </div>
        </main>
      </div>
    </div>
  );
}
