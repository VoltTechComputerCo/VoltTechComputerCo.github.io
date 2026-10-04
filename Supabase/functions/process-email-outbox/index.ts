import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SITE = "https://volttechcomputerco.co.za";

function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function firstName(fullName: unknown) {
  const value = String(fullName ?? "").trim();
  return value ? value.split(/\s+/)[0] : "there";
}
function layout(eyebrow: string, headline: string, body: string, cta: string, href: string, accent="#36e6d3") {
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="IE=edge"></head>
<body style="margin:0;background-color:#031012;font-family:Arial,Helvetica,sans-serif;color:#f4fffd;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" bgcolor="#031012"><tr><td align="center" style="padding-top:32px;padding-right:16px;padding-bottom:32px;padding-left:16px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:600px;background-color:#07181a;border:1px solid ${accent};">
<tr><td bgcolor="#07181a" style="padding-top:28px;padding-right:28px;padding-bottom:18px;padding-left:28px;">
<p style="margin-top:0;margin-right:0;margin-bottom:8px;margin-left:0;font-size:12px;line-height:18px;color:${accent};font-family:Arial,Helvetica,sans-serif;font-weight:700;letter-spacing:1.2px;">${esc(eyebrow)}</p>
<h1 style="margin-top:0;margin-right:0;margin-bottom:14px;margin-left:0;font-size:28px;line-height:34px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">${esc(headline)}</h1>
<p style="margin-top:0;margin-right:0;margin-bottom:22px;margin-left:0;font-size:16px;line-height:25px;color:#b9d8d4;font-family:Arial,Helvetica,sans-serif;">${body}</p>
<table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td bgcolor="${accent}" style="padding-top:12px;padding-right:18px;padding-bottom:12px;padding-left:18px;">
<a href="${esc(href)}" style="font-size:15px;line-height:20px;color:#031012;font-family:Arial,Helvetica,sans-serif;font-weight:700;text-decoration:none;">${esc(cta)}</a>
</td></tr></table>
</td></tr>
<tr><td style="padding-top:18px;padding-right:28px;padding-bottom:26px;padding-left:28px;border-top:1px solid #173a3d;">
<p style="margin-top:0;margin-right:0;margin-bottom:6px;margin-left:0;font-size:12px;line-height:18px;color:#7fa7a2;font-family:Arial,Helvetica,sans-serif;">Performance / Precision / Possibility</p>
<p style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;font-size:12px;line-height:18px;color:#648b86;font-family:Arial,Helvetica,sans-serif;">VoltTech Computer Co. · Pretoria, South Africa</p>
</td></tr></table></td></tr></table></body></html>`;
  const text = `${headline}\n\n${body.replace(/<[^>]+>/g, "")}\n\n${cta}: ${href}\n\nVoltTech Computer Co.`;
  return { html, text };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) {
    return Response.json({ error: "Supabase runtime secrets unavailable" }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: expectedToken, error: tokenError } = await admin.rpc("vt_get_mailer_cron_token");
  const suppliedToken = req.headers.get("x-volttech-mailer-token") || "";
  if (tokenError || !expectedToken || suppliedToken !== expectedToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let limit = 10;
  try {
    const body = await req.json();
    if (Number.isFinite(Number(body?.limit))) limit = Math.max(1, Math.min(25, Number(body.limit)));
  } catch {}

  const { data: apiKey, error: keyError } = await admin.rpc("vt_get_resend_api_key");
  if (keyError || !apiKey) return Response.json({ error: "Resend API key unavailable" }, { status: 500 });

  const { data: rows, error: claimError } = await admin.rpc("vt_claim_email_outbox", { p_limit: limit });
  if (claimError) return Response.json({ error: claimError.message }, { status: 500 });

  const results: unknown[] = [];

  for (const row of rows ?? []) {
    try {
      let customerName: string | null = null;
      if (row.recipient_user_id) {
        const { data } = await admin.rpc("vt_email_customer_name", { p_user_id: row.recipient_user_id });
        customerName = data || null;
      }

      let headline = row.subject || "VoltTech update";
      let subject = row.subject || "VoltTech update";
      let body = esc(row.payload?.message || "There is a new update in your VoltTech account.");
      let cta = "Open My VoltTech";
      let href = SITE + "/account.html";
      let eyebrow = "VOLTTECH COMPUTER CO.";
      let from = "VoltTech Computer Co. <accounts@volttechcomputerco.co.za>";

      if (row.message_kind === "account_welcome") {
        subject = "Welcome to VoltTech Computer Co.";
        headline = `Welcome to VoltTech, ${firstName(customerName)}.`;
        body = "Your account is ready. Your builds, quotes, invoices, documents and notifications now live in one place.";
      } else if (["quote_ready","quote_document"].includes(row.message_kind)) {
        const { data: quote } = await admin.rpc("vt_email_quote_context", { p_quote_id: row.source_id });
        const number = quote?.quote_number || "";
        subject = number ? `Your VoltTech quote ${number} is ready` : "Your VoltTech quote is ready";
        headline = "Your quote is ready.";
        body = `We’ve prepared ${esc(number || "your quotation")}${quote?.title ? " for " + esc(quote.title) : ""}. Review the details, pricing and next steps securely in My VoltTech.`;
        cta = "Review Quote";
        href = SITE + "/quote.html?id=" + encodeURIComponent(row.source_id || "");
        eyebrow = "VOLTTECH / QUOTATION";
        from = "VoltTech Quotes <quotes@volttechcomputerco.co.za>";
      } else if (["invoice_issued","invoice_document"].includes(row.message_kind)) {
        const { data: invoice } = await admin.rpc("vt_email_invoice_context", { p_invoice_id: row.source_id });
        const number = invoice?.invoice_number || "";
        subject = number ? `Your VoltTech invoice ${number}` : "Your VoltTech invoice is ready";
        headline = "Your invoice is ready.";
        body = `Invoice ${esc(number || "")} has been issued. Review the amount due, due date and related documents securely in My VoltTech.`;
        cta = "View Invoice";
        href = SITE + "/invoice.html?id=" + encodeURIComponent(row.source_id || "");
        eyebrow = "VOLTTECH / INVOICE";
        from = "VoltTech Billing <billing@volttechcomputerco.co.za>";
      } else if (row.message_kind === "payment_received") {
        const { data: invoice } = await admin.rpc("vt_email_invoice_context", { p_invoice_id: row.source_id });
        subject = "Payment received — VoltTech";
        headline = "Payment received.";
        body = `Thanks — your payment${invoice?.invoice_number ? " for " + esc(invoice.invoice_number) : ""} has been recorded. Your receipt is ready in My VoltTech.`;
        cta = "View Receipt";
        href = SITE + "/receipt.html?id=" + encodeURIComponent(row.source_id || "");
        eyebrow = "VOLTTECH / PAYMENT";
        from = "VoltTech Billing <billing@volttechcomputerco.co.za>";
      }

      const content = layout(eyebrow, headline, body, cta, href);
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": String(row.dedupe_key || row.id)
        },
        body: JSON.stringify({
          from,
          to: [row.recipient_email],
          subject,
          html: content.html,
          text: content.text,
          tags: [
            { name: "kind", value: String(row.message_kind).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 256) },
            { name: "source", value: String(row.source_type || "system").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 256) }
          ]
        })
      });

      const responseBody = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(responseBody?.message || `Resend HTTP ${response.status}`);

      const providerId = responseBody?.id || null;
      await admin.rpc("vt_mark_email_sent", { p_id: row.id, p_provider_message_id: providerId });
      results.push({ id: row.id, status: "sent", provider_id: providerId });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await admin.rpc("vt_mark_email_failed", { p_id: row.id, p_error: message });
      results.push({ id: row.id, status: "failed", error: message });
    }
  }

  return Response.json({ processed: results.length, results });
});
