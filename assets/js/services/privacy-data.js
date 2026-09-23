import { getAccountClient, loadAccountNotifications } from './account-session.js';

const safe = async (name, promise) => {
  try {
    const result = await promise;
    return { name, error: result.error?.message || '', data: result.error ? [] : (result.data ?? []) };
  } catch (error) {
    return { name, error: error?.message || 'Unavailable', data: [] };
  }
};

export async function requirePrivacyCustomer() {
  const client = await getAccountClient();
  const { data: { session } } = await client.auth.getSession();
  if (!session?.user) {
    location.replace(`account.html?returnTo=${encodeURIComponent('/privacy-center.html')}`);
    return null;
  }
  await loadAccountNotifications(client);
  return { client, user: session.user };
}

export async function loadDeletionRequest(client, userId) {
  return client.from('account_deletion_requests')
    .select('id,status,requested_at,recovery_until,cancelled_at,completed_at,export_confirmed,updated_at')
    .eq('user_id', userId).maybeSingle();
}

export async function requestAccountDeletion(client, user) {
  const { data, error } = await client.from('account_deletion_requests')
    .upsert({ user_id: user.id, status: 'requested', export_confirmed: true }, { onConflict: 'user_id' })
    .select('id,status,requested_at,recovery_until,cancelled_at,completed_at,export_confirmed,updated_at')
    .single();
  if (!error && data?.id) {
    try { await client.functions.invoke('send-document-email', { body: { kind: 'account_deletion_requested', source_id: data.id } }); } catch {}
  }
  return { data, error };
}

export async function cancelAccountDeletion(client, id) {
  return client.from('account_deletion_requests').update({ status: 'cancelled' }).eq('id', id)
    .select('id,status,requested_at,recovery_until,cancelled_at,completed_at,export_confirmed,updated_at').single();
}

export async function collectPersonalData(client, user) {
  const requests = [
    safe('profile', client.from('profiles').select('*').eq('id', user.id).maybeSingle()),
    safe('addresses', client.from('customer_addresses').select('*').eq('user_id', user.id)),
    safe('saved_builds', client.from('saved_builds').select('*').eq('user_id', user.id)),
    safe('quotes', client.from('quotes').select('*,quote_items(*)').eq('user_id', user.id)),
    safe('quote_acceptances', client.from('quote_acceptances').select('*').eq('user_id', user.id)),
    safe('quote_events', client.from('quote_events').select('*').eq('user_id', user.id)),
    safe('invoices', client.from('invoices').select('*,invoice_items(*)').eq('user_id', user.id)),
    safe('payments', client.from('payments').select('*').eq('user_id', user.id)),
    safe('orders', client.from('orders').select('*,order_items(*)').eq('user_id', user.id)),
    safe('service_jobs', client.from('service_jobs').select('*,service_job_updates(*)').eq('user_id', user.id)),
    safe('proformas', client.from('proformas').select('*').eq('user_id', user.id)),
    safe('customer_documents', client.from('customer_documents').select('*').eq('user_id', user.id)),
    safe('notifications', client.from('notifications').select('*').eq('recipient_role', 'customer').eq('recipient_user_id', user.id)),
    safe('email_delivery_log', client.from('email_delivery_log').select('*').eq('user_id', user.id))
  ];
  const results = await Promise.all(requests);
  const output = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at, last_sign_in_at: user.last_sign_in_at },
    volttech_data: {}
  };
  for (const item of results) output.volttech_data[item.name] = item.error ? { unavailable: item.error } : item.data;
  return output;
}
