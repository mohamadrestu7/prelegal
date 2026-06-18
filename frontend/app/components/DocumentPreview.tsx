"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface Props {
  docType: string | null;
  fields: Record<string, string>;
}

const FIELD_LINK_CLASSES = new Set([
  "coverpage_link",
  "keyterms_link",
  "orderform_link",
  "businessterms_link",
  "sow_link",
]);

function substituteFields(content: string, fields: Record<string, string>): string {
  return content.replace(
    /<span class="([^"]+)">([^<]+)<\/span>/g,
    (match, cls, fieldName) => {
      if (!FIELD_LINK_CLASSES.has(cls)) return match;
      const value = fields[fieldName.trim()]?.trim();
      return value
        ? `<mark class="field-filled">${value}</mark>`
        : `<em class="field-empty">[${fieldName}]</em>`;
    }
  );
}

export default function DocumentPreview({ docType, fields }: Props) {
  const [templateContent, setTemplateContent] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!docType) {
      setTemplateContent(null);
      setFetchError(null);
      return;
    }
    setFetchError(null);
    setTemplateContent(null);
    fetch(`/api/templates/${encodeURIComponent(docType)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} for ${docType}`);
        return r.text();
      })
      .then(setTemplateContent)
      .catch((e: Error) => setFetchError(e.message));
  }, [docType]);

  if (!docType) {
    return (
      <div className="flex items-center justify-center h-full py-24 px-8 text-center">
        <p className="text-brand-gray text-sm max-w-xs">
          Your document preview will appear here once we identify the document type.
        </p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="py-6 px-4">
        <p className="text-sm text-red-500">Could not load template: {fetchError}</p>
      </div>
    );
  }

  if (!templateContent) {
    return (
      <div className="py-6 px-4">
        <p className="text-sm text-brand-gray">Loading document...</p>
      </div>
    );
  }

  const rendered = substituteFields(templateContent, fields);

  return (
    <div className="py-6 px-4 print:p-0">
      <div
        id="doc-preview"
        className="bg-white text-black font-serif text-sm leading-relaxed max-w-3xl mx-auto p-8 shadow-sm print:shadow-none print:p-0 print:max-w-none"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {rendered}
        </ReactMarkdown>
      </div>
    </div>
  );
}
