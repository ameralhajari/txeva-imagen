import type { Session, Generation, AppSettings } from '../types';

const SETTINGS_KEY = 'txeva_imagen_settings_v1';
const LOCAL_SESSIONS_KEY = 'txeva_imagen_sessions_v1';

export const defaultSettings: AppSettings = {
  openaiApiKey: '',
  apiBaseUrl: '',
  tursoDatabaseUrl: '',
  tursoAuthToken: '',
  defaultModel: 'dall-e-3',
  defaultQuality: 'standard',
  defaultStyle: 'vivid',
  defaultSize: '1024x1024',
  language: 'ar',
};

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Local storage fallback helpers
function getLocalSessions(): Session[] {
  try {
    const raw = localStorage.getItem(LOCAL_SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalSessions(sessions: Session[]): void {
  localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(sessions));
}

// Unified Storage Layer: Tries Turso Backend (/api/sessions) first, falls back to LocalStorage
export async function fetchSessions(): Promise<{ sessions: Session[]; isTurso: boolean }> {
  const settings = getStoredSettings();
  try {
    const headers: Record<string, string> = {};
    if (settings.tursoDatabaseUrl) headers['x-turso-url'] = settings.tursoDatabaseUrl;
    if (settings.tursoAuthToken) headers['x-turso-token'] = settings.tursoAuthToken;

    const res = await fetch('/api/sessions', { headers });
    if (res.ok) {
      const data = await res.json();
      return { sessions: data, isTurso: true };
    }
  } catch {
    // API endpoint not reachable (e.g. running plain vite dev without wrangler)
  }

  // Fallback to localStorage
  const local = getLocalSessions();
  return { sessions: local, isTurso: false };
}

export async function fetchSessionDetails(id: string): Promise<Session | null> {
  const settings = getStoredSettings();
  try {
    const headers: Record<string, string> = {};
    if (settings.tursoDatabaseUrl) headers['x-turso-url'] = settings.tursoDatabaseUrl;
    if (settings.tursoAuthToken) headers['x-turso-token'] = settings.tursoAuthToken;

    const res = await fetch(`/api/sessions/${id}`, { headers });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // ignore
  }

  const local = getLocalSessions();
  return local.find((s) => s.id === id) || null;
}

export async function createSession(title: string, model: Session['model'] = 'dall-e-3'): Promise<Session> {
  const settings = getStoredSettings();
  const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = Date.now();

  const newSession: Session = {
    id: sessionId,
    title,
    model,
    createdAt: now,
    updatedAt: now,
    generations: [],
  };

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (settings.tursoDatabaseUrl) headers['x-turso-url'] = settings.tursoDatabaseUrl;
    if (settings.tursoAuthToken) headers['x-turso-token'] = settings.tursoAuthToken;

    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers,
      body: JSON.stringify(newSession),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback to local
  }

  const local = getLocalSessions();
  local.unshift(newSession);
  saveLocalSessions(local);
  return newSession;
}

export async function saveGeneration(generation: Generation): Promise<void> {
  const settings = getStoredSettings();

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (settings.tursoDatabaseUrl) headers['x-turso-url'] = settings.tursoDatabaseUrl;
    if (settings.tursoAuthToken) headers['x-turso-token'] = settings.tursoAuthToken;

    const res = await fetch('/api/save-generation', {
      method: 'POST',
      headers,
      body: JSON.stringify(generation),
    });

    if (res.ok) return;
  } catch {
    // ignore
  }

  // Update in local storage
  const local = getLocalSessions();
  const sessIndex = local.findIndex((s) => s.id === generation.sessionId);
  if (sessIndex !== -1) {
    if (!local[sessIndex].generations) local[sessIndex].generations = [];
    local[sessIndex].generations!.push(generation);
    local[sessIndex].updatedAt = Date.now();
    saveLocalSessions(local);
  }
}

export async function deleteSession(id: string): Promise<void> {
  const settings = getStoredSettings();
  try {
    const headers: Record<string, string> = {};
    if (settings.tursoDatabaseUrl) headers['x-turso-url'] = settings.tursoDatabaseUrl;
    if (settings.tursoAuthToken) headers['x-turso-token'] = settings.tursoAuthToken;

    const res = await fetch(`/api/sessions/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (res.ok) return;
  } catch {
    // ignore
  }

  const local = getLocalSessions().filter((s) => s.id !== id);
  saveLocalSessions(local);
}

export async function updateSessionTitle(id: string, title: string): Promise<void> {
  const settings = getStoredSettings();
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (settings.tursoDatabaseUrl) headers['x-turso-url'] = settings.tursoDatabaseUrl;
    if (settings.tursoAuthToken) headers['x-turso-token'] = settings.tursoAuthToken;

    const res = await fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ title }),
    });
    if (res.ok) return;
  } catch {
    // ignore
  }

  const local = getLocalSessions();
  const sess = local.find((s) => s.id === id);
  if (sess) {
    sess.title = title;
    sess.updatedAt = Date.now();
    saveLocalSessions(local);
  }
}
