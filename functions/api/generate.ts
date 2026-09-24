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
    const { prompt, model = 'dall-e-3', quality = 'standard', style = 'vivid', size = '1024x1024', n = 1, images } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = customBase?.trim() || 'https://api.openai.com/v1';

    // If input/reference images are provided, use /v1/images/edits
    if (images && Array.isArray(images) && images.length > 0) {
      const endpoint = `${baseUrl.replace(/\/+$/, '')}/images/edits`;
      const formData = new FormData();
      formData.append('prompt', prompt.trim());
      
      // dall-e-3 does not support image editing; default to gpt-image-1.5 or keep model if already gpt-image/dall-e-2
      const editModel = model === 'dall-e-3' ? 'gpt-image-1.5' : model;
      formData.append('model', editModel);
      formData.append('size', size || '1024x1024');
      formData.append('n', String(Math.min(Math.max(1, n), editModel === 'dall-e-2' ? 4 : 1)));

      for (let i = 0; i < images.length; i++) {
        const dataUrl = images[i];
        if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
          const parts = dataUrl.split(',');
          const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
          const binary = atob(parts[1]);
          const u8 = new Uint8Array(binary.length);
          for (let j = 0; j < binary.length; j++) {
            u8[j] = binary.charCodeAt(j);
          }
          const blob = new Blob([u8], { type: mime });
          const ext = mime.split('/')[1] || 'png';
          formData.append('image', blob, `ref_${i}.${ext}`);
        }
      }

      const openAiResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
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
    }

    // Standard text-to-image generation via /v1/images/generations
    const endpoint = `${baseUrl.replace(/\/+$/, '')}/images/generations`;

    const payload: any = {
      model,
      prompt: prompt.trim(),
      n: Math.min(Math.max(1, n), model === 'dall-e-2' ? 4 : 1),
      size: size || '1024x1024',
    };

    // style and quality are strictly supported only for dall-e-3 by OpenAI
    if (model === 'dall-e-3') {
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
