# Customer checkout workspace

Customer Account now prominently lists owned hardware requests and non-draft quotes, with progress, latest update and next action. Store requests also appear in Activity. Opening a request by ID requires sign-in and verifies its owner before resolving the current private status link. Customers do not need to retain an email link. Accepted quotes and invoices expose the generic payment portal only after the server workflow gate and store launch flag permit it.

The existing notification bell and email outbox receive paired events for reservation, price confirmation, quote sent/revised, customer approval, payment release/status, preparation, courier booking, waybill sent/approved, collection, transit, delivery and completion. Guests receive email and see updates on their private status page; their records do not become accessible to other accounts. Existing account quote/invoice notifications are preserved. SMTP/provider delivery is asynchronous and its status remains visible to the admin.

Waybill approval is separate from marking the email sent. Admin confirms supplier approval; customer tracking and courier collection remain blocked until approval. Historical shipments are not silently marked approved.

Tests use fixtures and rolled-back SQL. No real payment, courier booking or test customer email is sent. Coverage: next actions, escaping, dual-channel queueing, owner-only links, privacy, payment and waybill gates, and 390/1440px layouts.

## Catalogue selection

The public catalogue contains only real supplier-backed gaming products. Feed imports apply the shared gaming policy before updating or inserting products. Database visibility also checks supplier association and the gaming policy. NVIDIA cards start at RTX 30 series; AMD cards start at RX 6000 and Intel Arc cards are accepted. Server, office, legacy and unrelated products are excluded. Desktop DDR4/DDR5, current gaming CPUs, suitable components and gaming/streaming peripherals remain. Feed stock still requires manual reservation before payment. The one-time customer/document reset and catalogue cleanup are not recurring migration actions.
