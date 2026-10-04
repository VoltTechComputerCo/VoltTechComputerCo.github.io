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
const LOGO = SITE + "/brand/VoltTech_Full_Logo_Transparent.png";

function brandify(value: unknown) {
  const safe = esc(value);
  return safe.replace(/VoltTech/gi,
    '<span style="color:#f2f8f7;">Volt</span><span style="color:#35ead7;text-shadow:0 0 14px rgba(53,234,215,.45);">Tech</span>'
  );
}

function layout(eyebrow: string, headline: string, body: string, cta: string, href: string, accent="#35ead7") {
  const safeHref = esc(href);
  const safeAccent = esc(accent);
  const brandedHeadline = brandify(headline);
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin:0;background-color:#02090a;font-family:Arial,Helvetica,sans-serif;color:#f2f8f7;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" bgcolor="#02090a">
<tr><td align="center" style="padding:30px 14px 36px 14px;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:640px;background-color:#031012;border:1px solid rgba(53,234,215,.38);box-shadow:0 0 26px rgba(53,234,215,.10);">

  <tr>
    <td style="padding:26px 28px 22px 28px;background-color:#020d0f;border-bottom:1px solid rgba(53,234,215,.18);">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>
          <td align="center" valign="middle">
            <img src="${LOGO}" width="250" alt="VoltTech Computer Co." style="display:block;width:250px;max-width:86%;height:auto;margin:0 auto;border:0;outline:none;text-decoration:none;">
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="height:3px;line-height:3px;font-size:1px;background-color:#35ead7;box-shadow:0 0 16px rgba(53,234,215,.85);">&nbsp;</td>
  </tr>

  <tr>
    <td style="padding:30px 30px 10px 30px;background:linear-gradient(180deg,#07171a 0%,#041315 100%);">
      <p style="margin:0 0 12px 0;color:#72fff0;font-size:11px;line-height:16px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">// ${esc(eyebrow)}</p>
      <h1 style="margin:0 0 16px 0;font-size:32px;line-height:38px;font-weight:800;letter-spacing:-.7px;color:#f2f8f7;font-family:Arial,Helvetica,sans-serif;">${brandedHeadline}</h1>
      <div style="width:70px;height:2px;background-color:#35ead7;box-shadow:0 0 12px rgba(53,234,215,.65);margin:0 0 20px 0;"></div>
      <p style="margin:0;color:#a9beba;font-size:16px;line-height:26px;font-family:Arial,Helvetica,sans-serif;">${body}</p>
    </td>
  </tr>

  <tr>
    <td style="padding:24px 30px 30px 30px;background-color:#041315;">
      <table cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>
          <td bgcolor="#35ead7" style="border:1px solid #72fff0;background:linear-gradient(135deg,#1cafa1 0%,#35ead7 50%,#72fff0 100%);box-shadow:0 0 12px rgba(53,234,215,.42),0 0 26px rgba(53,234,215,.20);">
            <a href="${safeHref}" style="display:inline-block;padding:14px 22px;color:#02090a;font-size:14px;line-height:18px;font-family:Arial,Helvetica,sans-serif;font-weight:900;letter-spacing:.4px;text-decoration:none;text-transform:uppercase;">${esc(cta)} &nbsp;→</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:18px 30px;background-color:#061518;border-top:1px solid rgba(53,234,215,.16);">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>
          <td style="color:#78918d;font-size:11px;line-height:17px;font-family:Arial,Helvetica,sans-serif;letter-spacing:.3px;">
            <span style="color:#f2f8f7;font-weight:800;letter-spacing:.5px;">South Africa builds differently.</span>
          </td>
          <td align="right"><table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr>
<td style="padding-left:6px;"><a href="https://www.instagram.com/volttechcomputerco/" style="display:block;padding:6px;background-color:#d62976;border:1px solid rgba(255,255,255,.16);"><img src="https://volttechcomputerco.co.za/instagram-logo.svg" width="18" height="18" alt="Instagram" style="display:block;width:18px;height:18px;border:0;"></a></td>
<td style="padding-left:6px;"><a href="https://www.tiktok.com/@volttechcomputerco" style="display:block;padding:6px;background-color:#111111;border:1px solid rgba(255,255,255,.16);"><img src="https://volttechcomputerco.co.za/tiktok-logo.svg" width="18" height="18" alt="TikTok" style="display:block;width:18px;height:18px;border:0;"></a></td>
<td style="padding-left:6px;"><a href="https://www.facebook.com/share/1MEoYu4i8N/" style="display:block;padding:6px;background-color:#1877f2;border:1px solid rgba(255,255,255,.16);"><img src="https://volttechcomputerco.co.za/facebook-logo.svg" width="18" height="18" alt="Facebook" style="display:block;width:18px;height:18px;border:0;"></a></td>
<td style="padding-left:6px;"><a href="https://wa.me/27618435775" style="display:block;padding:6px;background-color:#25d366;border:1px solid rgba(255,255,255,.16);"><img src="https://volttechcomputerco.co.za/whatsapp-logo.svg" width="18" height="18" alt="WhatsApp" style="display:block;width:18px;height:18px;border:0;"></a></td>
</tr></table></td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:14px 30px 22px 30px;background-color:#031012;">
      <p style="margin:0;color:#526d68;font-size:10px;line-height:16px;font-family:Arial,Helvetica,sans-serif;">
        <span style="color:#f2f8f7;font-weight:700;">Volt</span><span style="color:#35ead7;font-weight:700;">Tech</span> Computer Co. · Secure customer communication
      </p>
    </td>
  </tr>

</table>

</td></tr>
</table>
</body>
</html>`;

  const text = `${headline}\n\n${body.replace(/<[^>]+>/g, "")}\n\n${cta}: ${href}\n\nVoltTech Computer Co.\nSouth Africa builds differently.`;
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
