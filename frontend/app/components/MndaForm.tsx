"use client";

import { MndaFormData } from "@/types/mnda";

interface Props {
  data: MndaFormData;
  onChange: (data: MndaFormData) => void;
}

function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-gray-700 mb-0.5">
        {label}
      </label>
      {hint && <p className="text-xs text-gray-500 mb-1">{hint}</p>}
      {children}
    </div>
  );
}

const inputClass =
  "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent";

export default function MndaForm({ data, onChange }: Props) {
  const update = (field: keyof MndaFormData, value: string) =>
    onChange({ ...data, [field]: value });

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <FieldGroup label="Purpose" hint="How Confidential Information may be used">
        <textarea
          className={inputClass + " resize-none"}
          rows={3}
          value={data.purpose}
          onChange={(e) => update("purpose", e.target.value)}
          placeholder="Evaluating whether to enter into a business relationship..."
        />
      </FieldGroup>

      <FieldGroup label="Effective Date">
        <input
          type="date"
          className={inputClass}
          value={data.effectiveDate}
          onChange={(e) => update("effectiveDate", e.target.value)}
        />
      </FieldGroup>

      <FieldGroup label="MNDA Term" hint="How long this agreement lasts">
        <div className="space-y-2 text-sm">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="mndaTermType"
              className="mt-1 shrink-0"
              checked={data.mndaTermType === "fixed"}
              onChange={() => update("mndaTermType", "fixed")}
            />
            <div className="flex items-center gap-1 flex-wrap">
              <span>Expires</span>
              <input
                type="number"
                min="1"
                max="99"
                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:bg-gray-100 disabled:text-gray-400"
                value={data.mndaTermYears}
                onChange={(e) => update("mndaTermYears", e.target.value)}
                disabled={data.mndaTermType !== "fixed"}
              />
              <span>year(s) from Effective Date</span>
            </div>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="mndaTermType"
              checked={data.mndaTermType === "at-will"}
              onChange={() => update("mndaTermType", "at-will")}
            />
            <span>Continues until terminated</span>
          </label>
        </div>
      </FieldGroup>

      <FieldGroup
        label="Term of Confidentiality"
        hint="How long Confidential Information is protected"
      >
        <div className="space-y-2 text-sm">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="confidentialityTermType"
              className="mt-1 shrink-0"
              checked={data.confidentialityTermType === "fixed"}
              onChange={() => update("confidentialityTermType", "fixed")}
            />
            <div className="flex items-center gap-1 flex-wrap">
              <input
                type="number"
                min="1"
                max="99"
                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:bg-gray-100 disabled:text-gray-400"
                value={data.confidentialityTermYears}
                onChange={(e) => update("confidentialityTermYears", e.target.value)}
                disabled={data.confidentialityTermType !== "fixed"}
              />
              <span>year(s) from Effective Date (+ trade secrets)</span>
            </div>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="confidentialityTermType"
              checked={data.confidentialityTermType === "perpetual"}
              onChange={() => update("confidentialityTermType", "perpetual")}
            />
            <span>In perpetuity</span>
          </label>
        </div>
      </FieldGroup>

      <FieldGroup label="Governing Law" hint="State whose laws govern the MNDA">
        <input
          type="text"
          className={inputClass}
          value={data.governingLaw}
          onChange={(e) => update("governingLaw", e.target.value)}
          placeholder="e.g. Delaware"
        />
      </FieldGroup>

      <FieldGroup label="Jurisdiction" hint="Where disputes will be resolved">
        <input
          type="text"
          className={inputClass}
          value={data.jurisdiction}
          onChange={(e) => update("jurisdiction", e.target.value)}
          placeholder='e.g. courts located in New Castle, DE'
        />
      </FieldGroup>

      <FieldGroup
        label="Modifications (optional)"
        hint="Any modifications to the standard terms"
      >
        <textarea
          className={inputClass + " resize-none"}
          rows={3}
          value={data.modifications}
          onChange={(e) => update("modifications", e.target.value)}
          placeholder="List any modifications to the standard terms..."
        />
      </FieldGroup>

      <div className="border-t border-gray-200 pt-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Party 1</h3>
        <div className="space-y-3">
          {[
            { field: "party1PrintName" as const, label: "Print Name", placeholder: "Full name" },
            { field: "party1Title" as const, label: "Title", placeholder: "e.g. CEO" },
            { field: "party1Company" as const, label: "Company", placeholder: "Company name" },
            {
              field: "party1Address" as const,
              label: "Notice Address",
              placeholder: "Email or postal address",
            },
          ].map(({ field, label, placeholder }) => (
            <div key={field}>
              <label className="block text-xs text-gray-600 mb-1">{label}</label>
              <input
                type="text"
                className={inputClass}
                value={data[field]}
                onChange={(e) => update(field, e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Party 2</h3>
        <div className="space-y-3">
          {[
            { field: "party2PrintName" as const, label: "Print Name", placeholder: "Full name" },
            { field: "party2Title" as const, label: "Title", placeholder: "e.g. CEO" },
            { field: "party2Company" as const, label: "Company", placeholder: "Company name" },
            {
              field: "party2Address" as const,
              label: "Notice Address",
              placeholder: "Email or postal address",
            },
          ].map(({ field, label, placeholder }) => (
            <div key={field}>
              <label className="block text-xs text-gray-600 mb-1">{label}</label>
              <input
                type="text"
                className={inputClass}
                value={data[field]}
                onChange={(e) => update(field, e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
