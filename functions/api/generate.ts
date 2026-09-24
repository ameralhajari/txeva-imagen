export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const clientKey = request.headers.get('x-openai-key');
    const customBase = request.headers.get('x-openai-base');
    const apiKey = clientKey || env.OPENAI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'OpenAI API key missing. Please provide it in application settings or configure OPENAI_API_KEY in Cloudflare Pages environment variables.'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { prompt, model = 'dall-e-3', quality = 'standard', style = 'vivid', size = '1024x1024', n = 1 } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = customBase?.trim() || 'https://api.openai.com/v1';
    const endpoint = `${baseUrl.replace(/\/+$/, '')}/images/generations`;

    const payload: any = {
      model,
      prompt: prompt.trim(),
      n: Math.min(Math.max(1, n), model === 'dall-e-2' ? 4 : 1),
      size,
    };

    if (model !== 'dall-e-2') {
      if (quality) payload.quality = quality;
      if (style) payload.style = style;
    }

    const openAiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await openAiResponse.json();

    if (!openAiResponse.ok) {
      return new Response(
        JSON.stringify({
          error: data.error?.message || `OpenAI API returned status ${openAiResponse.status}`
        }),
        { status: openAiResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error while generating image' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
