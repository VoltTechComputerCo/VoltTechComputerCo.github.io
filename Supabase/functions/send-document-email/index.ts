import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    return Response.json({ error: "Supabase runtime configuration unavailable" }, { status: 500 });
  }

  const authorization = req.headers.get("Authorization") || "";
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false }
  });

  let body: any = {};
  try { body = await req.json(); } catch {}
  const kind = String(body?.kind || body?.type || "").toLowerCase();
  const sourceId = String(body?.source_id || body?.id || "");

  if (!["quote","invoice"].includes(kind) || !sourceId) {
    return Response.json({ error: "kind and source_id are required" }, { status: 400 });
  }

  const { data: outboxId, error } = await client.rpc("admin_queue_document_email", {
    p_kind: kind,
    p_source_id: sourceId
  });

  if (error) return Response.json({ error: error.message }, { status: 403 });

  return Response.json({
    queued: true,
    outbox_id: outboxId,
    message: "Email queued for delivery."
  });
});
