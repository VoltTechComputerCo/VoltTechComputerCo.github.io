import { getAccountClient } from './account-session.js';

const allowedKinds = new Set(['quote','invoice','build','order','service','proforma']);

export async function emailCustomerDocument(kind, sourceId) {
  if (!allowedKinds.has(String(kind || '')) || !sourceId) throw new Error('Unsupported document request.');
  const client = await getAccountClient();
  const { error } = await client.functions.invoke('send-document-email', { body: { kind, source_id: sourceId } });
  if (error) throw error;
  return true;
}
