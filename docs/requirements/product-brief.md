# Aesthetic clinic: research and product brief

Prepared for Emre Baskan | 25 October 2026

## Recommendation

Build a mobile-first, multilingual patient-consent and treatment-record application in React. Its central experience is a calm guided patient form, connected to a practical clinic workspace for signed documents, treatments performed, before/after photographs, and follow-up appointments.

The first release should complete this clinical and administrative journey end to end. Online commerce, a public booking marketplace, loyalty, and accounting can follow if the clinic needs them. These are product recommendations, not requirements stated in the recording.

This brief is the research and product-definition phase. The accompanying screen study is a visual concept, not a production clinical system or an approved consent document.

## 1. What the client requested

The uploaded Turkish recording is approximately 52 seconds long. The following are paraphrases of its clear requirements; uncertain closing conversation is excluded.

| Requirement heard in the recording | Product consequence |
| --- | --- |
| An online patient consent form | A patient can complete and sign from a phone or clinic tablet. |
| Identify the procedure to be performed, with Botox given as an example | A visit contains planned treatments and the corresponding consent templates. |
| Before and after photographs | Photographs belong to the patient and treatment episode, with explicit before/after labels. |
| A separate section for which treatments were performed | The clinician records actual treatment independently from what the patient initially consented to. |
| Contact information | Patient profile with international phone and email details, preferred language, and communication choices. |
| Next appointment and reminders | Follow-up scheduling and reliable reminder delivery are part of the core workflow. |

Emre additionally requested React, mobile-first design, a beautiful and easy interface, ten languages, and coverage of lip filler, jawline/chin filler, Botox, and lifting procedures.

## 2. What the uploaded form contains

The two-page PDF is a scanned Botox information and consent form, followed by a personal-data explicit-consent page. It is not a complete template library for all proposed treatments.

Page 1 includes patient name, date of birth, information date, procedure information, health questions, an educational/scientific photo/video clause, and patient, witness, and responsible-doctor signatures. Its footnote mentions a legal guardian signing for a minor.

The sixteen source screening topics are:

| Source topic | Proposed digital treatment |
| --- | --- |
| Pregnancy risk; breastfeeding | Separate questions with no default answers; route relevant answers to clinician review. |
| Infection at treatment site; systemic infection; active skin disease | Separate stable question IDs; conditional details and review markers. |
| Medication use; aminoglycoside antibiotics or muscle relaxants; aspirin or blood thinners | Preserve distinct source topics and ask for details when indicated. |
| Diabetes; bleeding tendency; allergies | Explicit answers and space to describe relevant history. |
| Previous underarm surgery | Show for the applicable treatment context after clinician approval of branching rules. |
| Migraine attacks | Preserve when clinically relevant to the selected Botox protocol. |
| Cosmetics applied to the treatment area | Include when relevant to preparation or in-clinic confirmation. |
| Previous filler and any allergy or unexpected event | Split the compound question into treatment history and adverse-reaction detail. |
| HBsAg, HCV, or HIV positivity | Preserve as a source-field mapping; the clinician must decide necessity and wording before publication. |

Page 2 separately covers processing/filing, sharing with authorized persons, international transfer/communications, and telephone, SMS, email, and WhatsApp contact preferences. It also has a handwritten acknowledgment and patient/representative identity and signature areas.

Design implications:

- Do not render the scan as tiny text with checkboxes over it. Build semantic, accessible fields and generate an archival document from the submitted record.
- Create distinct, approved templates for Botox, dermal filler with the applicable anatomical area, and each defined lifting procedure.
- Clarify whether "face lift" means surgery, threads, an energy-based treatment, or another procedure. These must not share one generic consent.
- Keep treatment consent, privacy notice acknowledgment, applicable data permissions, clinical photography, educational/publication use, marketing use, and communication choices distinct.
- The paper refers to a separate privacy information notice. The upload does not supply that complete notice; obtain the clinic's current version.
- A signature and an "I have questions" action must support a real consent discussion. Form completion alone must not automatically authorize treatment.

## 3. Comparable products reviewed

Research used official product pages, help documentation, and available public screenshots. It did not include a signed-in trial, independent security audit, or hands-on performance test. Documented capabilities below are vendor descriptions, not verified compliance claims.

| Product | Documented pattern relevant to this project | Recommended adoption |
| --- | --- | --- |
| Pabau | Consent templates can be associated with services and completed forms appear in patient records. [1] | Select forms from the visit's actual planned treatments. |
| Fresha | Automatic or manual forms, service attachment, in-person completion, incomplete-form reminders, and downloadable completed forms. [2] | Support both advance phone completion and a reception-tablet route. |
| Aesthetic Nurse Software | Medical history, signatures, before/after comparison, photo consent, time-stamped treatment notes, and product lot/batch details. [3] | Connect consent, photographs, and treatment documentation within one visit. |
| Aesthetic Record | Consents linked to services; optional page initials/witness signatures; a restricted iPad mode for patient completion. [4][5] | Model conditional signers and a server-enforced patient-only tablet session. |
| Consentz | Treatment-specific disclosure, signatures, retained form versions, patient-record association, and aftercare workflows. [6] | Preserve exactly what was signed and make it easy to retrieve. |

Product opportunity: offer the clinic these useful workflows through a particularly clear multilingual mobile experience. This is our design judgment; the research does not establish that competitors lack multilingual features.

## 4. Two connected experiences

### Patient experience

Patients enter through a clinic-issued link or a restricted tablet session. A generic reception QR code opens only a neutral start page; it must never expose a named patient's record. When a visit already exists, the clinician-assigned treatment is preselected for confirmation.

Use a welcome/language page followed by five logical stages:

| Stage | Patient task | Behavior |
| --- | --- | --- |
| About you | Confirm the visit and enter identity/contact details. | International names and phones; no Turkish citizenship number requirement for foreign patients. |
| Health history | Answer small groups of related screening questions. | Yes / No / Not sure, initially unanswered; details appear when relevant. |
| Your treatment | Read approved information for every planned procedure and ask questions. | Short readable sections plus full wording; treatment-specific risks, alternatives, and aftercare authored by the clinic. |
| Your permissions | Make the relevant privacy, photography, sharing, and contact choices. | Clear optionality; no preselected optional permissions; separate purposes. |
| Review and sign | Review answers, correct details, confirm understanding, and sign. | Touch signature with an appropriate accessible alternative; clinician/witness/representative requirements configured per approved workflow. |

After submission, show receipt, clinician-review status, access to the document, and the next step. Treatment-specific aftercare and the confirmed follow-up visit appear when the clinician has recorded them.

Group two to four short related questions per screen where practical. The health stage may contain smaller subpages with accurate progress. Avoid turning sixteen questions into sixteen unnecessary navigation steps. W3C recommends logical grouping, visible progress, and preserving data when revisiting completed steps. [7]

Save draft changes on the server within the patient's authorized session. Show whether saving succeeded and provide a resume route. Connection loss must preserve in-memory edits and offer retry; sensitive answers should not be written to persistent browser storage by default. Completing a form should not be subject to an unexplained countdown.

A returning patient may confirm or update prior health history. Never carry old treatment consent forward as consent for a new visit.

### Clinic experience

The mobile navigation has four destinations: Today, Patients, Visits, and More. On desktop, use a compact sidebar and a broader work area. More contains templates, translations, team permissions, and settings.

Today shows real operational work: appointments, incomplete forms, reviews awaiting a clinician, and follow-ups. Avoid decorative revenue metrics in the first release.

Each patient has a visit timeline. Each visit has clearly separate sections for Consent, Treatment performed, Photos, and Follow-up. Reception can manage contact details and scheduling; clinicians access health history and record treatment. Roles and record ownership must be enforced by the API.

The treatment entry includes actual procedure and area, clinician, date/time, notes, and applicable product/quantity/unit/lot/batch/expiry details. Product requirements vary by procedure. The performed treatment must be reconciled with the consented plan; a material change requires the correct new consent before proceeding.

Use distinct consent and visit statuses. For example, a consent can be Draft, Patient signed, Awaiting clinician review, or Finalized; a visit can be Planned, Completed, or Follow-up due. "Signed" must not be presented as clinical clearance.

## 5. Photography and follow-ups

Photographs are a first-release feature because the client explicitly requested them.

- Store each image against the correct patient, visit, procedure, date, stage, and angle.
- Provide guided capture or upload, with front/left/right views when applicable.
- Offer side-by-side before/after comparison and a mobile-friendly image viewer.
- Preserve trustworthy originals; remove unnecessary location metadata from distributed derivatives.
- Store photographs privately and authorize each access. Avoid public image URLs and sensitive data in filenames.
- Record clinical documentation permission separately from educational, publication, or marketing permissions. Declining public use does not imply declining treatment.

Follow-up scheduling is also a first-release feature. Staff set the appropriate interval or actual appointment; the app does not infer medical intervals from a generic treatment name. A proposed reminder default is 24 hours before a confirmed visit, with clinic configuration and the patient's permitted channel.

Use a persistent server job queue, cancellation/rescheduling checks, deduplication, delivery status, and retry. A completed scheduler task is not proof of a delivered message. Appointment messages should contain minimal information and a secure link where needed.

Store timestamps in UTC and the clinic's IANA time zone. Display the clinic time zone clearly for international patients; optionally also show the patient's local time. If the clinic is in Turkey, configure Europe/Istanbul.

## 6. Ten-language launch strategy

The following is a proposed international-clinic launch set, not a measured global popularity ranking or a claim about this clinic's actual patient mix.

| Language | Locale | Native label |
| --- | --- | --- |
| Turkish | tr | Türkçe |
| English | en | English |
| Arabic | ar | العربية |
| Russian | ru | Русский |
| German | de | Deutsch |
| French | fr | Français |
| Spanish | es | Español |
| Italian | it | Italiano |
| Brazilian Portuguese | pt-BR | Português |
| Simplified Chinese | zh-Hans | 简体中文 |

Support the patient and staff interfaces through the same localization architecture. Staff can default to Turkish or English. Confirm the final ten against the clinic's patient history before commissioning professional translations.

Rules:

- Detect a likely browser language, then let the patient choose. Display language names in their own script rather than using flags as the sole selector.
- Support Arabic layout direction using semantic `dir` attributes and CSS logical properties; isolate international phone numbers and mixed-direction input correctly. [8]
- Keep field IDs and answer values independent of their displayed language. Switching language must preserve the meaning of existing answers.
- Translate validation, empty/error states, dates, reminder templates, documents, and clinical text as well as navigation.
- Use i18next namespaces for common UI, validation, patient forms, clinic screens, and treatment content. Load only the required resources. [9]
- Keep clinician-approved consent wording as versioned content per procedure and locale. Require medical/legal and competent-language review before activating a translation.
- If approved clinical content is missing in a locale, stop that signing path and offer language assistance. Do not silently substitute English medical consent.
- Preserve the exact language and wording signed. A Turkish staff translation can assist review but must not replace the authoritative signed snapshot. Any machine translation of patient free text must be identified and retain the original.
- Embed appropriate fonts in generated documents and verify Arabic shaping, Cyrillic, Chinese, and Turkish characters.

## 7. Visual direction

Use a warm, restrained premium-clinic aesthetic. The patient form should feel welcoming and readable; the staff workspace should feel efficient and orderly.

Proposed light-theme tokens:

| Purpose | Direction |
| --- | --- |
| Background | Warm ivory, approximately #FAF7F2 |
| Primary action and headings | Deep plum, approximately #382A36 |
| Accent | Muted terracotta, approximately #B77D67 |
| Main text | Warm charcoal, approximately #302B2D |
| Secondary surface | Soft stone, approximately #EEE8E1 |
| Display typography | A restrained editorial serif for welcome headings only |
| Body and inputs | A highly legible sans serif with appropriate multilingual fallbacks |

Final color combinations require contrast measurement. Use at least 16px editable text and approximately 48px principal touch controls as design targets. Make visible focus, keyboard operation, error summaries, labels, and status announcements part of the components. WCAG 2.2 AA target-size requirements have a smaller formal minimum with exceptions; the larger target here is a deliberate mobile usability choice. [10]

Use a single-column patient form, comfortably limited in width on large screens. Place one prominent Continue action in a bottom action area that respects safe areas and the software keyboard, without covering content. Show Back, the current stage, and a recognizable clinic identity. Keep optional choices visually neutral and avoid a brighter Accept than Decline.

Use authentic clinic imagery only where it supports orientation. Keep photographic marketing out of the questionnaire itself. Avoid unapproved treatment illustrations or generated before/after photographs.

## 8. Recommended implementation

| Layer | Proposed choice and reason |
| --- | --- |
| Frontend | React + TypeScript with Vite for a focused web application. Vite supplies an official React/TypeScript template. [11] |
| Forms | React Hook Form with shared schema validation such as Zod. The official form library documents wizard and conditional-field patterns. [12] |
| UI | Accessible primitives with a small custom design-token layer; Tailwind can implement the design consistently. |
| Server state | TanStack Query for fetching, invalidation, and recoverable mutation states. Keep wizard state explicit and modest. |
| Localization | react-i18next for UI; a separate versioned content store for approved medical templates. |
| Backend | A TypeScript modular monolith, such as NestJS, with clear modules for patients, visits, consent, media, and notifications. [13] |
| Records | PostgreSQL for structured patient/visit/consent relationships and transaction-safe status changes. |
| Documents and photos | Private object storage with server-side authorization and short-lived download access. |
| Reminders | A durable job queue with a separate worker and replaceable SMS/email/WhatsApp adapters. Exact providers are a deployment decision. |
| PDF generation | Server-side generation from the immutable signed snapshot, with matching template and translation versions. |

Start with one application and one modular backend. A public search-optimized marketing website, if later needed, can use a separate rendering strategy. A PWA install experience can follow; confidential records should not be indiscriminately cached for offline use.

Core records: Patient, Visit, PlannedTreatment, PerformedTreatment, TemplateVersion, LocalizedTemplateVersion, FormSubmission, ConsentDecision, Signature, MediaAsset, FollowUpAppointment, NotificationJob, and AuditEvent.

Freeze the form text, answer labels/values, permissions, signers, and language at signing. Store server timestamps and a content digest to detect unexpected modification. A digest is an integrity check, not a qualified electronic signature. Corrections become attributed amendments; signed originals stay retrievable under the applicable retention policy.

## 9. Production requirements that affect the design

The PDF collects health data and refers to Turkish personal-data legislation. The application therefore needs an appropriate clinical-data design from the beginning.

- Authenticate staff, enforce permissions on every API and file access, and keep patient links scoped to the relevant visit with expiry and revocation.
- Give shared tablets a patient-only session with staff reauthentication to return to clinic screens. Hiding the sidebar alone is insufficient.
- Keep health answers, signatures, and photographs out of analytics, URLs, logs, and error telemetry.
- Record access and meaningful edits, maintain recoverable backups, and implement the clinic's approved retention/export/deletion process.
- Validate file types and sizes, control uploads, and avoid exposing a patient's other records through a visit link.
- Have the clinic approve the privacy notice, lawful bases, consent wording, signatory process, data-processing vendors, and hosting/transfers before collecting real patient data.

KVKK's rules distinguish the information obligation from obtaining explicit consent when consent is the processing basis. [14] Its current guidance also addresses amended rules for special-category data and overseas transfers. [15][16] The source paper's broad checkboxes are not a sufficient basis for choosing the app's hosting and communication vendors without that review. This brief does not certify compliance or the legal equivalence of any proposed electronic-signature method.

## 10. Delivery scope and order

| Stage | Deliverable |
| --- | --- |
| Design and validation | Confirm clinic branding, exact procedures, final ten locales, approved wording, staff roles, and reminder channels. Validate the patient journey with clinic staff and representative patients. |
| Core build | Patient wizard, versioned consent, clinician review, patient/visit records, treatment-performed entry, before/after images, signed-document retrieval, simple follow-up calendar, and reminder worker. |
| Launch verification | Complete translation review; test mobile/RTL/accessibility; validate records, security boundaries, document output, and real provider delivery. |
| Expansion | Public booking, deposits, inventory, detailed treatment maps, advanced reporting, and marketing only when their value is established. |

No estimate is supplied because team capacity, existing infrastructure, clinical content ownership, integration requirements, and review times are unknown.

## 11. Acceptance criteria for the core build

1. A patient can enter from a phone link, complete the appropriate questionnaire, review the full approved text, sign, and retrieve the record.
2. Language changes retain stable answers and input values. All ten locales render without clipped labels, including Arabic RTL.
3. A missing approved clinical translation cannot silently fall back and be signed.
4. Optional photography/publication/marketing choices remain independently selectable and do not prevent the valid treatment-consent path when declined.
5. Required unanswered questions and empty signatures are handled explicitly. Declining consent or requesting a discussion produces a useful clinic handoff.
6. Refresh/reconnect/resume and failed saves do not falsely show success or silently lose submitted information.
7. Signed documents retain the wording, language, signers, and choices from that moment after template updates. Later material changes require the appropriate renewed consent.
8. Patient-scoped access, reception permissions, clinician permissions, and shared-tablet exit are enforced beyond the UI.
9. Before/after images cannot be viewed through another patient's session and remain linked to the correct visit and angle.
10. Performed treatment is stored separately from planned treatment and requires reconciliation when changed.
11. Rescheduling or canceling an appointment invalidates stale reminder jobs; retries do not create duplicate messages; delivery failures are visible.
12. Generated documents render all supported scripts correctly. Appointment time-zone conversion is correct for international patients.

## 12. Inputs still needed for implementation

These do not prevent selecting the direction in this brief: clinic name/logo, exact lifting procedures, approved filler and lifting consent text, the missing privacy notice, authoritative translations, final locale mix, hosting jurisdiction and vendor review, existing patient-data/import needs, staff roles, and the desired communication providers. Use example data only while these are being resolved.

## Sources

Uploaded source A: HASTA BİLGILENDİRME ve ONAM FORMU.pdf, two scanned pages supplied in this conversation.

Uploaded source B: New Recording.m4a, approximately 52 seconds, Turkish, supplied in this conversation. Requirements above are normalized paraphrases of the clear portion of the recording.

Public sources accessed 25 October 2026:

1. Pabau, How to Create a Consent Form: https://support.pabau.com/en/pabau2/how-to-create-the-different-types-of-medical-forms-consent-form
2. Fresha, Client forms overview: https://www.fresha.com/help-center/knowledge-base/clients/607-client-forms-overview
3. Aesthetic Nurse Software, Patient Records: https://www.aestheticnursesoftware.com/patient-records/
4. Aesthetic Record, Manage Consent Forms: https://learn.aestheticrecord.com/en/articles/9269627-manage-consent-forms
5. Aesthetic Record, Use Lock Mode for Consent Signing and Questionnaires: https://learn.aestheticrecord.com/en/articles/9244544-use-lock-mode-for-consent-signing-and-questionnaires
6. Consentz, Digital Consent Form Software: https://www.consentz.com/directory/business/consent/digital-consent-form-software/
7. W3C WAI, Multi-page Forms: https://www.w3.org/WAI/tutorials/forms/multi-page/
8. W3C Internationalization, Structural markup and right-to-left text in HTML: https://www.w3.org/International/questions/qa-html-dir
9. i18next, Namespaces: https://www.i18next.com/principles/namespaces
10. W3C WAI, Understanding Target Size Minimum: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
11. Vite, Getting Started: https://vite.dev/guide/
12. React Hook Form, Advanced Usage: https://react-hook-form.com/advanced-usage
13. NestJS, Documentation: https://docs.nestjs.com/
14. KVKK, information-obligation communiqué: https://www.kvkk.gov.tr/Icerik/4132/aydinlatma-yukumlulugunun-yerine-getirilmesinde-uyulacak-usul-ve-esaslar-hakkinda-teblig
15. KVKK, Guidance on Special-Category Data: https://www.kvkk.gov.tr/Icerik/8184/Ozel-Nitelikli-Kisisel-Verilerin-Islenmesine-Iliskin-Rehber
16. KVKK, Overseas Transfers Guidance: https://www.kvkk.gov.tr/Icerik/8143/Kisisel-Verilerin-Yurt-Disina-Aktarilmasi-Rehberi
