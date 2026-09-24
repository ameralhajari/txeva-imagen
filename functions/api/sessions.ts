import { createClient } from '@libsql/client/web';
import { ensureTables } from './_db';

function getClient(context: any) {
  const { request, env } = context;
  const headerUrl = request.headers.get('x-turso-url');
  const headerToken = request.headers.get('x-turso-token');

  const url = headerUrl || env.TURSO_DATABASE_URL;
  const authToken = headerToken || env.TURSO_AUTH_TOKEN;

  if (!url) return null;
  return createClient({ url, authToken: authToken || '' });
}

export async function onRequestGet(context: any) {
  const client = getClient(context);
  if (!client) {
    return new Response(
      JSON.stringify({ error: 'Turso database is not configured', fallback: true }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    await ensureTables(client);
    const result = await client.execute({
      sql: 'SELECT id, title, model, created_at as createdAt, updated_at as updatedAt FROM sessions ORDER BY updated_at DESC',
      args: []
    });

    const sessions = result.rows.map(row => ({
      id: String(row.id),
      title: String(row.title),
      model: String(row.model),
      createdAt: Number(row.createdAt),
      updatedAt: Number(row.updatedAt)
    }));

    return new Response(JSON.stringify(sessions), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to fetch sessions from Turso' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequestPost(context: any) {
  const client = getClient(context);
  if (!client) {
    return new Response(
      JSON.stringify({ error: 'Turso database is not configured', fallback: true }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    await ensureTables(client);
    const body = await context.request.json();
    const { id, title = 'New Generation Session', model = 'dall-e-3' } = body;
    const sessionId = id || (crypto.randomUUID ? crypto.randomUUID() : 'sess_' + Date.now());
    const now = Date.now();

    await client.execute({
      sql: 'INSERT INTO sessions (id, title, model, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      args: [sessionId, title, model, now, now]
    });

    const session = {
      id: sessionId,
      title,
      model,
      createdAt: now,
      updatedAt: now,
      generations: []
    };

    return new Response(JSON.stringify(session), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to create session in Turso' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
