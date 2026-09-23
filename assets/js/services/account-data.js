export const money = value => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(Number(value || 0));
export const date = value => value ? new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium' }).format(new Date(value)) : '—';

export async function loadProfile(client, user) {
  const { data, error } = await client.from('profiles')
    .select('full_name,phone,suburb,billing_email,preferred_contact,company_name')
    .eq('id', user.id).maybeSingle();
  if (error) throw error;
  const fallbackName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '';
  return {
    full_name: data?.full_name || fallbackName,
    phone: data?.phone || '',
    suburb: data?.suburb || '',
    billing_email: data?.billing_email || user.email || '',
    preferred_contact: data?.preferred_contact || 'whatsapp',
    company_name: data?.company_name || ''
  };
}

export async function saveProfile(client, userId, profile) {
  return client.from('profiles').upsert({
    id: userId,
    full_name: profile.full_name || null,
    phone: profile.phone || null,
    suburb: profile.suburb || null,
    billing_email: profile.billing_email || null,
    company_name: profile.company_name || null,
    preferred_contact: profile.preferred_contact || 'whatsapp',
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' });
}

export async function listAddresses(client) {
  return client.from('customer_addresses').select('*')
    .order('is_default_shipping', { ascending: false })
    .order('created_at', { ascending: true });
}

export async function saveAddress(client, address) {
  return client.rpc('customer_save_address_v1', {
    p_address_id: address.id || null,
    p_label: address.label || 'Delivery address',
    p_recipient_name: address.recipient_name || null,
    p_phone: address.phone || null,
    p_address_line1: address.address_line1,
    p_address_line2: address.address_line2 || null,
    p_suburb: address.suburb || null,
    p_city: address.city,
    p_province: address.province || null,
    p_postal_code: address.postal_code || null,
    p_country: address.country || 'South Africa',
    p_is_default_shipping: address.is_default_shipping === true
  });
}

export async function deleteAddress(client, id) {
  return client.from('customer_addresses').delete().eq('id', id);
}

async function countRows(client, table) {
  const { count, error } = await client.from(table).select('id', { count: 'exact', head: true });
  return error ? null : (count || 0);
}

export async function loadOverview(client, userId) {
  const [builds, quotes, invoices, orders, jobs, quoteRows, invoiceRows, deletion] = await Promise.all([
    countRows(client, 'saved_builds'), countRows(client, 'quotes'), countRows(client, 'invoices'),
    countRows(client, 'orders'), countRows(client, 'service_jobs'),
    client.from('quotes').select('id,quote_number,title,status,total,created_at').in('status', ['sent', 'viewed']).order('created_at', { ascending: false }).limit(3),
    client.from('invoices').select('id,invoice_number,status,total,due_at,issued_at').order('issued_at', { ascending: false }).limit(10),
    client.from('account_deletion_requests').select('status,recovery_until,requested_at').eq('user_id', userId).maybeSingle()
  ]);

  const nonPayable = new Set(['paid', 'void', 'cancelled', 'canceled', 'cancelled_by_admin']);
  const unpaid = (invoiceRows.data || []).filter(row => !nonPayable.has(String(row.status || '').toLowerCase()));
  const waiting = quoteRows.data || [];
  const now = Date.now();
  const overdue = unpaid.find(row => {
    if (!row.due_at) return false;
    const value = String(row.due_at).includes('T') ? row.due_at : `${row.due_at}T23:59:59`;
    const time = new Date(value).getTime();
    return Number.isFinite(time) && time < now;
  });

  let action = { tone: 'clear', kicker: 'All clear', title: "You're all caught up.", body: 'No quotes or unpaid invoices currently need your attention.', href: '', label: '' };
  if (overdue) action = { tone: 'urgent', kicker: 'Payment overdue', title: `Invoice ${overdue.invoice_number} is overdue`, body: 'Please review the invoice and payment details as soon as possible.', href: `invoice.html?id=${encodeURIComponent(overdue.id)}`, label: 'Open overdue invoice' };
  else if (unpaid.length) action = { tone: 'attention', kicker: 'Payment required', title: `Invoice ${unpaid[0].invoice_number} is awaiting payment`, body: 'Open the invoice to review the amount and payment status.', href: `invoice.html?id=${encodeURIComponent(unpaid[0].id)}`, label: 'Open invoice' };
  else if (waiting.length) action = { tone: 'attention', kicker: 'Decision required', title: `${waiting[0].quote_number} is waiting for your decision`, body: waiting[0].title || 'VoltTech quotation', href: `quote.html?id=${encodeURIComponent(waiting[0].id)}`, label: 'Review quote' };

  return {
    counts: { builds, quotes, invoices, orders, jobs },
    action,
    deletion: !deletion.error && deletion.data?.status === 'requested' ? deletion.data : null
  };
}
