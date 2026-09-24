import type { GenerationRequestParams } from '../types';
import { getStoredSettings } from './storage';

export interface GenerationResult {
  url: string;
  revisedPrompt?: string;
}

export async function generateImage(params: GenerationRequestParams): Promise<GenerationResult[]> {
  const settings = getStoredSettings();

  // Try Cloudflare Pages Function endpoint first
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (settings.openaiApiKey) {
      headers['x-openai-key'] = settings.openaiApiKey.trim();
    }
    if (settings.apiBaseUrl) {
      headers['x-openai-base'] = settings.apiBaseUrl.trim();
    }

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (response.ok) {
      const data = await response.json();
      return (data.data || []).map((item: any) => ({
        url: item.url,
        revisedPrompt: item.revised_prompt,
      }));
    }

    // If server returned explicit error (like missing key or OpenAI rejected prompt)
    if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 429) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Generation failed with status ${response.status}`);
    }
  } catch (err: any) {
    // If not a network error reaching /api/generate, rethrow
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('404')) {
      throw err;
    }
  }

  // Fallback: Direct OpenAI client-side call if user provided key in settings
  if (!settings.openaiApiKey) {
    throw new Error('مفتاح OpenAI API غير محدد. يرجى إضافته من الإعدادات أو ضبط OPENAI_API_KEY على سيرفر Cloudflare Pages.');
  }

  const baseUrl = settings.apiBaseUrl?.trim() || 'https://api.openai.com/v1';

  if (params.images && params.images.length > 0) {
    const endpoint = `${baseUrl.replace(/\/+$/, '')}/images/edits`;
    const formData = new FormData();
    formData.append('prompt', params.prompt.trim());
    const editModel = params.model === 'dall-e-3' ? 'gpt-image-1.5' : params.model;
    formData.append('model', editModel);
    formData.append('size', params.size || '1024x1024');
    formData.append('n', String(Math.min(Math.max(1, params.n || 1), editModel === 'dall-e-2' ? 4 : 1)));

    for (let i = 0; i < params.images.length; i++) {
      const dataUrl = params.images[i];
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

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.openaiApiKey.trim()}`,
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || `OpenAI error: ${res.status}`);
    }

    return (data.data || []).map((item: any) => ({
      url: item.url,
      revisedPrompt: item.revised_prompt,
    }));
  }

  const endpoint = `${baseUrl.replace(/\/+$/, '')}/images/generations`;

  const payload: any = {
    model: params.model,
    prompt: params.prompt.trim(),
    n: params.model === 'dall-e-2' ? (params.n || 1) : 1,
    size: params.size || '1024x1024',
  };

  // style and quality are strictly supported only for dall-e-3 by OpenAI
  if (params.model === 'dall-e-3') {
    if (params.quality) payload.quality = params.quality;
    if (params.style) payload.style = params.style;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.openaiApiKey.trim()}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `OpenAI error: ${res.status}`);
  }

  return (data.data || []).map((item: any) => ({
    url: item.url,
    revisedPrompt: item.revised_prompt,
  }));
}
