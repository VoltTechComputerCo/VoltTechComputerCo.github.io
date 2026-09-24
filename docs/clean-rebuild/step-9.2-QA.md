# Step 9.2 QA

Parent branch head entering Step 9.2: `e00ff610a7e31459ddc5c2a411fde7fbc5a0e057`.

Step 9.1 is verified green at **24/24 gates**.

Step 9.2 adds browser-level responsive/device interaction and role-flow QA without changing customer-facing copy, design, launch flags, payment state, Supabase data or customer records.

Automated browser coverage:
- 360 px mobile, 768 px tablet, 1024 px desktop and 1440 px desktop viewports;
- representative Home, PC Repair, Signal Scan, STATIC and read-only Account inspection surfaces;
- document/body horizontal-overflow checks;
- mobile navigation progressive disclosure, `aria-expanded`, Escape close and focus return;
- desktop navigation visibility;
- PC Repair → Signal Scan handoff;
- full answer-based Signal Scan completion and WhatsApp/email result routes;
- read-only customer Account inspection with all account form controls disabled;
- preview Account sign-in boundary fails closed without exposing the customer hub;
- Admin preview remains `noindex` and hidden without authenticated bootstrap.

The workflow blocks external requests so the test cannot read or mutate production Supabase/customer data. It uses the intentional non-production Account inspection path rather than simulating a real user session.

Evidence is stored in the `volttech-step-9.2-device-role-qa` artifact, including summary JSON/Markdown, HTTP-server log and representative mobile/desktop screenshots.

Manual visual approval is still required on the nominated GitHack pages after the automated workflow passes. Step 9.3 does not begin until both automated and manual Step 9.2 checks are approved.
