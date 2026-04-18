/**
 * athletesCache.ts
 * Cache singleton pour la liste des athlètes.
 *
 * Stratégie : stale-while-revalidate
 *   1. Retourne immédiatement la valeur en mémoire (si disponible)
 *   2. Sinon, lit AsyncStorage (persisté entre sessions) et la retourne
 *   3. Lance en parallèle un fetch réseau
 *   4. Met à jour mémoire + AsyncStorage quand le fetch revient
 *
 * Ainsi l'utilisateur voit la liste INSTANTANÉMENT dès le 2e lancement,
 * pendant que la mise à jour se fait silencieusement.
 *
 * Usage : importé par useAthleteData ET useTrainingAthletes
 * → un seul appel réseau même si les deux hooks sont montés simultanément.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildApiUrl } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CachedAthlete {
  id: number;
  label: string;
  name: string;
}

type Listener = (athletes: CachedAthlete[]) => void;

// ─── Constantes ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'cpn:athletes:v1';
const STALE_MS    = 5 * 60 * 1000; // 5 min : on revalide si les données ont plus de 5 min

// ─── État interne du singleton ────────────────────────────────────────────────

let memCache:    CachedAthlete[] | null = null;
let lastFetchAt: number                 = 0;
let fetchPromise: Promise<CachedAthlete[]> | null = null;   // déduplique les appels simultanés
const listeners = new Set<Listener>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function notify(athletes: CachedAthlete[]) {
  listeners.forEach((fn) => fn(athletes));
}

function normalize(
  raw: Array<string | { id?: number; athlete_id?: number; nom?: string; name?: string; label?: string }>,
): CachedAthlete[] {
  return raw
    .map((entry, index) => {
      if (typeof entry === 'string') {
        return { id: index + 1, label: entry, name: entry };
      }
      const id    = Number(entry.id ?? entry.athlete_id ?? index + 1);
      const label = String(entry.label ?? entry.nom ?? entry.name ?? `Athlète ${index + 1}`);
      return { id, label, name: label };
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));
}

// ─── Lecture AsyncStorage (silencieuse) ───────────────────────────────────────

async function readStorage(): Promise<{ athletes: CachedAthlete[]; ts: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { athletes: CachedAthlete[]; ts: number };
  } catch {
    return null;
  }
}

async function writeStorage(athletes: CachedAthlete[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ athletes, ts: Date.now() }));
  } catch {
    // Silencieux : le cache disque est best-effort
  }
}

// ─── Fetch réseau ─────────────────────────────────────────────────────────────

async function fetchFromNetwork(): Promise<CachedAthlete[]> {
  const response = await fetch(buildApiUrl('/api/athletes'), {
    headers: { Accept: 'application/json' },
  });
  const text = await response.text();
  const json = JSON.parse(text) as { athletes?: unknown[] };
  const raw  = Array.isArray(json.athletes) ? json.athletes : [];
  return normalize(raw as Parameters<typeof normalize>[0]);
}

// ─── API publique ─────────────────────────────────────────────────────────────

/**
 * Souscrit aux mises à jour de la liste. Retourne une fonction de désinscription.
 */
export function subscribeAthletes(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Lance le chargement de la liste.
 *
 * @param forceRefresh - true pour ignorer le cache et recharger depuis le réseau
 * @returns La liste (depuis mémoire/cache) + déclenche un refresh en arrière-plan si besoin
 */
export async function loadAthletes(forceRefresh = false): Promise<CachedAthlete[]> {
  // 1. Mémoire disponible et fraîche → retour immédiat
  if (!forceRefresh && memCache !== null && Date.now() - lastFetchAt < STALE_MS) {
    return memCache;
  }

  // 2. Mémoire disponible mais potentiellement stale → retour immédiat + refresh en fond
  if (!forceRefresh && memCache !== null) {
    _refreshInBackground();
    return memCache;
  }

  // 3. Pas de mémoire → essai AsyncStorage d'abord (rapide)
  if (!forceRefresh) {
    const stored = await readStorage();
    if (stored && stored.athletes.length > 0) {
      memCache    = stored.athletes;
      lastFetchAt = stored.ts;
      notify(memCache);
      // Si données stales, on rafraîchit en fond
      if (Date.now() - stored.ts > STALE_MS) {
        _refreshInBackground();
      }
      return memCache;
    }
  }

  // 4. Rien en cache → fetch bloquant (premier lancement ou forceRefresh)
  return _fetchAndStore();
}

/**
 * Rafraîchissement en arrière-plan — dédupliqué si déjà en cours.
 */
function _refreshInBackground() {
  if (fetchPromise) return; // déjà en vol
  _fetchAndStore().catch(() => { /* silencieux */ });
}

async function _fetchAndStore(): Promise<CachedAthlete[]> {
  // Déduplique les appels simultanés (ex: useAthleteData + useTrainingAthletes montés ensemble)
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const athletes = await fetchFromNetwork();
      memCache    = athletes;
      lastFetchAt = Date.now();
      notify(athletes);
      writeStorage(athletes); // fire-and-forget
      return athletes;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

/**
 * Vide le cache mémoire et disque (utile pour les tests ou un "reset total").
 */
export async function clearAthletesCache() {
  memCache    = null;
  lastFetchAt = 0;
  fetchPromise = null;
  try { await AsyncStorage.removeItem(STORAGE_KEY); } catch { /* silencieux */ }
}
