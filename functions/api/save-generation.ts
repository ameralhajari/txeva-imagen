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

export async function onRequestPost(context: any) {
  const client = getClient(context);
  if (!client) {
    return new Response(JSON.stringify({ error: 'Turso not configured', fallback: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    await ensureTables(client);
    const body = await context.request.json();
    const { id, sessionId, prompt, revisedPrompt, model, quality, style, size, imageUrl } = body;

    const genId = id || (crypto.randomUUID ? crypto.randomUUID() : 'gen_' + Date.now());
    const now = Date.now();

    await client.batch([
      {
        sql: `INSERT INTO generations (id, session_id, prompt, revised_prompt, model, quality, style, size, image_url, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          genId,
          sessionId,
          prompt,
          revisedPrompt || null,
          model,
          quality || null,
          style || null,
          size,
          imageUrl,
          now
        ]
      },
      {
        sql: `UPDATE sessions SET updated_at = ? WHERE id = ?`,
        args: [now, sessionId]
      }
    ], 'write');

    return new Response(
      JSON.stringify({
        success: true,
        generation: {
          id: genId,
          sessionId,
          prompt,
          revisedPrompt,
          model,
          quality,
          style,
          size,
          imageUrl,
          createdAt: now
        }
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
