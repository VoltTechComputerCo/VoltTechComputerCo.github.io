import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_ORIGIN = "https://volttechcomputerco.co.za";
const ALLOWED_ORIGINS = new Set([
  SITE_ORIGIN,
  "https://www.volttechcomputerco.co.za",
  "https://volttechcomputerco.github.io"
]);

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : SITE_ORIGIN,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
}

function reply(body: string, status = 200, origin: string | null = null) {
  return new Response(body, { status, headers: corsHeaders(origin) });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { status: 200, headers: corsHeaders(origin) });
    }
    if (req.method !== "POST") return reply("Method not allowed", 405, origin);
    if (origin && !ALLOWED_ORIGINS.has(origin)) return reply("Origin not allowed", 403, origin);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return reply("Unauthorized", 401, origin);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const yocoKey = Deno.env.get("YOCO_LIVE_SECRET_KEY") || Deno.env.get("YOCO_TEST_SECRET_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey || !yocoKey) {
      return reply("Missing server configuration", 500, origin);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return reply("Unauthorized", 401, origin);

    const body = await req.json();
    const invoiceId = body?.invoice_id;
    if (!invoiceId) return reply("Missing invoice_id", 400, origin);

    const { data: invoice, error: invoiceError } = await admin
      .from("invoices")
      .select("id,user_id,invoice_number,total,currency,status")
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) return reply("Invoice not found", 404, origin);
    if (invoice.user_id !== user.id) return reply("Forbidden", 403, origin);

    const status = String(invoice.status || "").toLowerCase();
    const payableStatuses = new Set([
      "issued", "sent", "due", "overdue", "unpaid",
      "partially_paid", "partial", "open", "pending", "payment_due"
    ]);

    if (status === "paid") return reply("Invoice already paid", 409, origin);
    if (!payableStatuses.has(status)) return reply("Invoice is not payable", 409, origin);
    if (invoice.currency !== "ZAR") return reply("Unsupported currency", 400, origin);

    const gate = await admin.rpc("operations_payment_ready", {p_kind:"invoice",p_id:invoice.id});
    if(gate.error || gate.data!==true) return reply("Stock and final quote must be confirmed and payment released in Operations",409,origin);

    const { data: existing } = await admin.from("payments")
      .select("id,provider_checkout_id,status,metadata")
      .eq("invoice_id", invoice.id)
      .eq("provider", "yoco")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.provider_checkout_id && existing?.metadata?.redirect_url) {
      return new Response(JSON.stringify({
        checkout_id: existing.provider_checkout_id,
        redirect_url: existing.metadata.redirect_url,
        reused: true
      }), { status: 200, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } });
    }

    const amountCents = Math.round(Number(invoice.total) * 100);
    if (!Number.isSafeInteger(amountCents) || amountCents < 200) {
      return reply("Invalid invoice amount", 400, origin);
    }

    const { count: attemptCount, error: attemptCountError } = await admin.from("payments")
      .select("id", { count: "exact", head: true })
      .eq("invoice_id", invoice.id)
      .eq("provider", "yoco");
    if (attemptCountError) return reply("Could not prepare payment", 500, origin);
    const attemptNo = (attemptCount || 0) + 1;

    const checkoutResponse = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${yocoKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `invoice-${invoice.id}-${amountCents}-${attemptNo}`
      },
      body: JSON.stringify({
        amount: amountCents,
        currency: "ZAR",
        successUrl: `${SITE_ORIGIN}/documents.html?payment=success`,
        cancelUrl: `${SITE_ORIGIN}/documents.html?payment=cancelled`,
        failureUrl: `${SITE_ORIGIN}/documents.html?payment=failed`,
        metadata: {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          user_id: user.id
        }
      })
    });

    const checkoutText = await checkoutResponse.text();
    let checkout: any = null;
    try { checkout = JSON.parse(checkoutText); } catch { checkout = null; }

    if (!checkoutResponse.ok) return reply("Yoco checkout creation failed", 502, origin);
    if (!checkout?.id || !checkout?.redirectUrl) return reply("Invalid Yoco checkout response", 502, origin);

    const { error: paymentError } = await admin.from("payments").insert({
      invoice_id: invoice.id,
      user_id: user.id,
      provider: "yoco",
      provider_checkout_id: checkout.id,
      amount: invoice.total,
      currency: "ZAR",
      status: "pending",
      metadata: { redirect_url: checkout.redirectUrl }
    });

    if (paymentError) return reply("Could not record payment", 500, origin);

    return new Response(JSON.stringify({
      checkout_id: checkout.id,
      redirect_url: checkout.redirectUrl
    }), {
      status: 200,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("create-yoco-checkout fatal error", err);
    return reply("Internal server error", 500, origin);
  }
});
