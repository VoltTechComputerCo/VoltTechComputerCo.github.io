# VoltTech operations architecture

Baseline: main 29a69ecacd984a399dd1b06e67be4a1542286b8b.

One admin route (admin.html) contains the inbox, filters and selected job workspace. Existing requests, quotes, invoices, saved builds and service jobs remain authoritative. Linked records resolve to one canonical job rather than appearing as duplicate tasks. Catalogue and supplier tools are embedded in the hub.

An admin-only operations record stores per-line reservations (supplier, SKU, reserved quantity, cost, reference or physical local stock), milestones and a timestamped audit history. Feed availability is informative only. New requests start unreserved. Historical records are never silently marked reserved.

Store stages: request → reserve every item → price/delivery quote → customer acceptance of that exact total → explicit payment release → verified Yoco payment → supplier order → manual Bob Go booking → waybill sent → collection → transit → delivery → archive. Backend gates enforce this independently of the UI. Payment providers and signed webhook remain intact.

Customer status returns a whitelist of milestones and selling amounts. The private operations table is inaccessible to customers. Private links use existing hashed tokens. No supplier data, costs, margin, internal notes or reservation references enter public responses.

Notifications/outbox use existing infrastructure and alias routing. Actions write history and next-action tasks. Courier booking is manual PAYG; no Bob Go API is invoked. Sending the waybill opens a prepared email; the administrator attaches the downloaded PDF and records it as sent after sending.

Quote/account paths retain existing commercial document acceptance and invoice mechanisms; the workspace incorporates them. Stock and final pricing must be verified before issuing a new payment checkout. Paid historical records are preserved and proceed to fulfilment without taking another payment.
