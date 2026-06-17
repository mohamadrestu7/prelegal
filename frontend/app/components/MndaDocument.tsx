'use client'

import { MndaFormData } from '@/types/mnda'

interface Props {
  data: MndaFormData
}

function CoverpageRef({ children }: { children: string }) {
  return (
    <span className="italic text-blue-700 print:text-black print:not-italic print:underline">
      {children}
    </span>
  )
}

function FilledField({
  value,
  placeholder,
}: {
  value: string
  placeholder: string
}) {
  if (!value.trim()) {
    return <span className="text-gray-400 italic print:text-black">[{placeholder}]</span>
  }
  return <span className="font-semibold">{value}</span>
}

export default function MndaDocument({ data }: Props) {
  const mndaTermYearsLabel = `${data.mndaTermYears} year${data.mndaTermYears === '1' ? '' : 's'}`
  const confidentialityYearsLabel = `${data.confidentialityTermYears} year${data.confidentialityTermYears === '1' ? '' : 's'}`

  const effectiveDateDisplay = data.effectiveDate
    ? new Date(data.effectiveDate + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <div
      id="mnda-document"
      className="bg-white text-black font-serif text-sm leading-relaxed max-w-3xl mx-auto p-8 shadow-sm print:shadow-none print:p-0 print:max-w-none"
    >
      {/* ── Cover Page ── */}
      <div className="mb-12">
        <h1 className="text-2xl font-bold text-center mb-1">
          Mutual Non-Disclosure Agreement
        </h1>
        <p className="text-center text-xs text-gray-500 mb-8">
          Common Paper Mutual NDA — Version 1.0
        </p>

        <div className="border border-gray-300 p-6 space-y-5 text-sm">
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-0.5">
              Purpose
            </p>
            <p className="text-xs italic text-gray-400 mb-1">
              How Confidential Information may be used
            </p>
            <p>
              <FilledField
                value={data.purpose}
                placeholder="How Confidential Information may be used"
              />
            </p>
          </section>

          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-0.5">
              Effective Date
            </p>
            {effectiveDateDisplay ? (
              <p className="font-semibold">{effectiveDateDisplay}</p>
            ) : (
              <p className="text-gray-400 italic print:text-black">[Today&apos;s date]</p>
            )}
          </section>

          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-0.5">
              MNDA Term
            </p>
            <p className="text-xs italic text-gray-400 mb-1">The length of this MNDA</p>
            <p className="flex items-start gap-1">
              <span className="shrink-0">
                {data.mndaTermType === 'fixed' ? '☑' : '☐'}
              </span>
              {data.mndaTermType === 'fixed' ? (
                <>
                  Expires <strong>{mndaTermYearsLabel}</strong> from Effective Date.
                </>
              ) : (
                <span className="text-gray-500">
                  Expires {mndaTermYearsLabel} from Effective Date.
                </span>
              )}
            </p>
            <p className="flex items-start gap-1 mt-1">
              <span className="shrink-0">
                {data.mndaTermType === 'at-will' ? '☑' : '☐'}
              </span>
              {data.mndaTermType === 'at-will' ? (
                <strong>Continues until terminated in accordance with the terms of the MNDA.</strong>
              ) : (
                <span className="text-gray-500">
                  Continues until terminated in accordance with the terms of the MNDA.
                </span>
              )}
            </p>
          </section>

          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-0.5">
              Term of Confidentiality
            </p>
            <p className="text-xs italic text-gray-400 mb-1">
              How long Confidential Information is protected
            </p>
            <p className="flex items-start gap-1">
              <span className="shrink-0">
                {data.confidentialityTermType === 'fixed' ? '☑' : '☐'}
              </span>
              {data.confidentialityTermType === 'fixed' ? (
                <>
                  <strong>{confidentialityYearsLabel}</strong> from Effective Date, but in the case
                  of trade secrets until Confidential Information is no longer considered a trade
                  secret under applicable laws.
                </>
              ) : (
                <span className="text-gray-500">
                  {confidentialityYearsLabel} from Effective Date, but in the case of trade secrets
                  until Confidential Information is no longer considered a trade secret under
                  applicable laws.
                </span>
              )}
            </p>
            <p className="flex items-start gap-1 mt-1">
              <span className="shrink-0">
                {data.confidentialityTermType === 'perpetual' ? '☑' : '☐'}
              </span>
              {data.confidentialityTermType === 'perpetual' ? (
                <strong>In perpetuity.</strong>
              ) : (
                <span className="text-gray-500">In perpetuity.</span>
              )}
            </p>
          </section>

          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-0.5">
              Governing Law &amp; Jurisdiction
            </p>
            <p>
              Governing Law:{' '}
              <FilledField value={data.governingLaw} placeholder="Fill in state" />
            </p>
            <p className="mt-1">
              Jurisdiction:{' '}
              <FilledField
                value={data.jurisdiction}
                placeholder='e.g. "courts located in New Castle, DE"'
              />
            </p>
          </section>

          {data.modifications.trim() && (
            <section>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-0.5">
                MNDA Modifications
              </p>
              <p>{data.modifications}</p>
            </section>
          )}

          {/* Signature table */}
          <section>
            <p className="mb-4">
              By signing this Cover Page, each party agrees to enter into this MNDA as of the
              Effective Date.
            </p>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2 bg-gray-50 text-left w-1/3" />
                  <th className="border border-gray-300 p-2 bg-gray-50 text-center">PARTY 1</th>
                  <th className="border border-gray-300 p-2 bg-gray-50 text-center">PARTY 2</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Signature</td>
                  <td className="border border-gray-300 p-2 h-12" />
                  <td className="border border-gray-300 p-2 h-12" />
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Print Name</td>
                  <td className="border border-gray-300 p-2">
                    <FilledField value={data.party1PrintName} placeholder="Name" />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <FilledField value={data.party2PrintName} placeholder="Name" />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Title</td>
                  <td className="border border-gray-300 p-2">
                    <FilledField value={data.party1Title} placeholder="Title" />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <FilledField value={data.party2Title} placeholder="Title" />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Company</td>
                  <td className="border border-gray-300 p-2">
                    <FilledField value={data.party1Company} placeholder="Company" />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <FilledField value={data.party2Company} placeholder="Company" />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">
                    Notice Address
                  </td>
                  <td className="border border-gray-300 p-2">
                    <FilledField
                      value={data.party1Address}
                      placeholder="Email or postal address"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <FilledField
                      value={data.party2Address}
                      placeholder="Email or postal address"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Date</td>
                  <td className="border border-gray-300 p-2 h-10" />
                  <td className="border border-gray-300 p-2 h-10" />
                </tr>
              </tbody>
            </table>
          </section>

          <p className="text-xs text-gray-500 text-center">
            Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under CC BY 4.0.
          </p>
        </div>
      </div>

      {/* ── Standard Terms ── */}
      <div>
        <h2 className="text-xl font-bold text-center mb-6">Standard Terms</h2>
        <ol className="space-y-4 list-none">
          <li>
            <strong>1. Introduction.</strong> This Mutual Non-Disclosure Agreement (which
            incorporates these Standard Terms and the Cover Page (defined below)) (
            &ldquo;<strong>MNDA</strong>&rdquo;) allows each party (&ldquo;
            <strong>Disclosing Party</strong>&rdquo;) to disclose or make available information in
            connection with the <CoverpageRef>Purpose</CoverpageRef> which (1) the Disclosing
            Party identifies to the receiving party (&ldquo;<strong>Receiving Party</strong>&rdquo;)
            as &ldquo;confidential&rdquo;, &ldquo;proprietary&rdquo;, or the like or (2) should be
            reasonably understood as confidential or proprietary due to its nature and the
            circumstances of its disclosure (&ldquo;<strong>Confidential Information</strong>&rdquo;
            ). Each party&rsquo;s Confidential Information also includes the existence and status of
            the parties&rsquo; discussions and information on the Cover Page. Confidential
            Information includes technical or business information, product designs or roadmaps,
            requirements, pricing, security and compliance documentation, technology, inventions and
            know-how. To use this MNDA, the parties must complete and sign a cover page
            incorporating these Standard Terms (&ldquo;<strong>Cover Page</strong>&rdquo;). Each
            party is identified on the Cover Page and capitalized terms have the meanings given
            herein or on the Cover Page.
          </li>
          <li>
            <strong>2. Use and Protection of Confidential Information.</strong> The Receiving Party
            shall: (a) use Confidential Information solely for the{' '}
            <CoverpageRef>Purpose</CoverpageRef>; (b) not disclose Confidential Information to
            third parties without the Disclosing Party&rsquo;s prior written approval, except that
            the Receiving Party may disclose Confidential Information to its employees, agents,
            advisors, contractors and other representatives having a reasonable need to know for the{' '}
            <CoverpageRef>Purpose</CoverpageRef>, provided these representatives are bound by
            confidentiality obligations no less protective of the Disclosing Party than the
            applicable terms in this MNDA and the Receiving Party remains responsible for their
            compliance with this MNDA; and (c) protect Confidential Information using at least the
            same protections the Receiving Party uses for its own similar information but no less
            than a reasonable standard of care.
          </li>
          <li>
            <strong>3. Exceptions.</strong> The Receiving Party&rsquo;s obligations in this MNDA
            do not apply to information that it can demonstrate: (a) is or becomes publicly
            available through no fault of the Receiving Party; (b) it rightfully knew or possessed
            prior to receipt from the Disclosing Party without confidentiality restrictions; (c) it
            rightfully obtained from a third party without confidentiality restrictions; or (d) it
            independently developed without using or referencing the Confidential Information.
          </li>
          <li>
            <strong>4. Disclosures Required by Law.</strong> The Receiving Party may disclose
            Confidential Information to the extent required by law, regulation or regulatory
            authority, subpoena or court order, provided (to the extent legally permitted) it
            provides the Disclosing Party reasonable advance notice of the required disclosure and
            reasonably cooperates, at the Disclosing Party&rsquo;s expense, with the Disclosing
            Party&rsquo;s efforts to obtain confidential treatment for the Confidential Information.
          </li>
          <li>
            <strong>5. Term and Termination.</strong> This MNDA commences on the{' '}
            <CoverpageRef>Effective Date</CoverpageRef> and expires at the end of the{' '}
            <CoverpageRef>MNDA Term</CoverpageRef>. Either party may terminate this MNDA for any or
            no reason upon written notice to the other party. The Receiving Party&rsquo;s
            obligations relating to Confidential Information will survive for the{' '}
            <CoverpageRef>Term of Confidentiality</CoverpageRef>, despite any expiration or
            termination of this MNDA.
          </li>
          <li>
            <strong>6. Return or Destruction of Confidential Information.</strong> Upon expiration
            or termination of this MNDA or upon the Disclosing Party&rsquo;s earlier request, the
            Receiving Party will: (a) cease using Confidential Information; (b) promptly after the
            Disclosing Party&rsquo;s written request, destroy all Confidential Information in the
            Receiving Party&rsquo;s possession or control or return it to the Disclosing Party; and
            (c) if requested by the Disclosing Party, confirm its compliance with these obligations
            in writing. As an exception to subsection (b), the Receiving Party may retain
            Confidential Information in accordance with its standard backup or record retention
            policies or as required by law, but the terms of this MNDA will continue to apply to
            the retained Confidential Information.
          </li>
          <li>
            <strong>7. Proprietary Rights.</strong> The Disclosing Party retains all of its
            intellectual property and other rights in its Confidential Information and its
            disclosure to the Receiving Party grants no license under such rights.
          </li>
          <li>
            <strong>8. Disclaimer.</strong> ALL CONFIDENTIAL INFORMATION IS PROVIDED &ldquo;AS
            IS&rdquo;, WITH ALL FAULTS, AND WITHOUT WARRANTIES, INCLUDING THE IMPLIED WARRANTIES
            OF TITLE, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
          </li>
          <li>
            <strong>9. Governing Law and Jurisdiction.</strong> This MNDA and all matters relating
            hereto are governed by, and construed in accordance with, the laws of the State of{' '}
            <CoverpageRef>Governing Law</CoverpageRef>, without regard to the conflict of laws
            provisions of such <CoverpageRef>Governing Law</CoverpageRef>. Any legal suit, action,
            or proceeding relating to this MNDA must be instituted in the federal or state courts
            located in <CoverpageRef>Jurisdiction</CoverpageRef>. Each party irrevocably submits to
            the exclusive jurisdiction of such <CoverpageRef>Jurisdiction</CoverpageRef> in any
            such suit, action, or proceeding.
          </li>
          <li>
            <strong>10. Equitable Relief.</strong> A breach of this MNDA may cause irreparable harm
            for which monetary damages are an insufficient remedy. Upon a breach of this MNDA, the
            Disclosing Party is entitled to seek appropriate equitable relief, including an
            injunction, in addition to its other remedies.
          </li>
          <li>
            <strong>11. General.</strong> Neither party has an obligation under this MNDA to
            disclose Confidential Information to the other or proceed with any proposed transaction.
            Neither party may assign this MNDA without the prior written consent of the other party,
            except that either party may assign this MNDA in connection with a merger,
            reorganization, acquisition or other transfer of all or substantially all its assets or
            voting securities. Any assignment in violation of this Section is null and void. This
            MNDA will bind and inure to the benefit of each party&rsquo;s permitted successors and
            assigns. Waivers must be signed by the waiving party&rsquo;s authorized representative
            and cannot be implied from conduct. If any provision of this MNDA is held unenforceable,
            it will be limited to the minimum extent necessary so the rest of this MNDA remains in
            effect. This MNDA (including the Cover Page) constitutes the entire agreement of the
            parties with respect to its subject matter, and supersedes all prior and contemporaneous
            understandings, agreements, representations, and warranties, whether written or oral,
            regarding such subject matter. This MNDA may only be amended, modified, waived, or
            supplemented by an agreement in writing signed by both parties. Notices, requests and
            approvals under this MNDA must be sent in writing to the email or postal addresses on
            the Cover Page and are deemed delivered on receipt. This MNDA may be executed in
            counterparts, including electronic copies, each of which is deemed an original and which
            together form the same agreement.
          </li>
        </ol>

        <p className="text-xs text-gray-500 text-center mt-8">
          Common Paper Mutual Non-Disclosure Agreement{' '}
          <a
            href="https://commonpaper.com/standards/mutual-nda/1.0/"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            Version 1.0
          </a>{' '}
          free to use under{' '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 4.0
          </a>
          .
        </p>
      </div>
    </div>
  )
}
