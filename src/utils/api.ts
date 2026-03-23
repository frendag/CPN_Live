import { API_BASE } from './constants';

export function buildApiUrl(path: string): string {
  if (!path.startsWith('/')) return `${API_BASE}/${path}`;
  return `${API_BASE}${path}`;
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  const text = await response.text();

  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Réponse serveur invalide.');
  }

  if (!response.ok) {
    throw new Error(json?.error || `Erreur HTTP ${response.status}`);
  }
  if (json?.error) {
    throw new Error(json.error);
  }
  return json as T;
}
