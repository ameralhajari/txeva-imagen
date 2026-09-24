import { createClient } from '@libsql/client/web';
import { ensureTables } from '../_db';

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
  const id = context.params.id;

  if (!client) {
    return new Response(JSON.stringify({ error: 'Turso not configured', fallback: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    await ensureTables(client);

    const sessionRes = await client.execute({
      sql: 'SELECT id, title, model, created_at as createdAt, updated_at as updatedAt FROM sessions WHERE id = ?',
      args: [id]
    });

    if (sessionRes.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sessionRow = sessionRes.rows[0];

    const genRes = await client.execute({
      sql: `SELECT id, session_id as sessionId, prompt, revised_prompt as revisedPrompt, 
                   model, quality, style, size, image_url as imageUrl, created_at as createdAt 
            FROM generations WHERE session_id = ? ORDER BY created_at ASC`,
      args: [id]
    });

    const generations = genRes.rows.map(row => ({
      id: String(row.id),
      sessionId: String(row.sessionId),
      prompt: String(row.prompt),
      revisedPrompt: row.revisedPrompt ? String(row.revisedPrompt) : undefined,
      model: String(row.model),
      quality: row.quality ? String(row.quality) : undefined,
      style: row.style ? String(row.style) : undefined,
      size: String(row.size),
      imageUrl: String(row.imageUrl),
      createdAt: Number(row.createdAt)
    }));

    return new Response(
      JSON.stringify({
        id: String(sessionRow.id),
        title: String(sessionRow.title),
        model: String(sessionRow.model),
        createdAt: Number(sessionRow.createdAt),
        updatedAt: Number(sessionRow.updatedAt),
        generations
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete(context: any) {
  const client = getClient(context);
  const id = context.params.id;

  if (!client) {
    return new Response(JSON.stringify({ error: 'Turso not configured', fallback: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    await ensureTables(client);
    await client.batch([
      { sql: 'DELETE FROM generations WHERE session_id = ?', args: [id] },
      { sql: 'DELETE FROM sessions WHERE id = ?', args: [id] }
    ], 'write');

    return new Response(JSON.stringify({ success: true, id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPatch(context: any) {
  const client = getClient(context);
  const id = context.params.id;

  if (!client) {
    return new Response(JSON.stringify({ error: 'Turso not configured', fallback: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    await ensureTables(client);
    const body = await context.request.json();
    const { title } = body;
    const now = Date.now();

    await client.execute({
      sql: 'UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?',
      args: [title, now, id]
    });

    return new Response(JSON.stringify({ success: true, id, title }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
