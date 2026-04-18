import { buildApiUrl } from './api';
import { PoolLength, StrokeCode, TrainingPerfPayload, TrainingPerfResponse } from './trainingTypes';

export const STROKE_DISTANCES: Record<StrokeCode, number[]> = {
  NL: [10, 25, 50, 100, 200, 400, 800, 1500],
  BRASSE: [10, 25, 50, 100, 200],
  PAPILLON: [10, 25, 50, 100, 200],
  DOS: [10, 25, 50, 100, 200],
  '4N': [100, 200, 400],
};

export function getAvailableDistances(stroke?: StrokeCode | null): number[] {
  return stroke ? STROKE_DISTANCES[stroke] : [];
}

export function getExpectedSplitDistances(distanceM?: number | null, poolLengthM?: PoolLength | null): number[] {
  if (!distanceM || !poolLengthM || distanceM <= poolLengthM) return [];
  const splits: number[] = [];
  for (let current = poolLengthM; current < distanceM; current += poolLengthM) {
    splits.push(current);
  }
  return splits;
}

export function formatMs(ms: number): string {
  const total = Math.max(0, Math.floor(ms));
  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const centiseconds = Math.floor((total % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

export function formatPerformedAt(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export async function saveTrainingPerf(payload: TrainingPerfPayload): Promise<TrainingPerfResponse> {
  const response = await fetch(buildApiUrl('/api/training_perf'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();

  let json: TrainingPerfResponse & { error?: string };
  try {
    json = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error(`Réponse serveur invalide: ${rawText || '(vide)'}`);
  }

  if (!response.ok) {
    throw new Error(json?.message || json?.error || `Erreur HTTP ${response.status}`);
  }

  if (!json?.success) {
    throw new Error(json?.message || json?.error || 'Erreur API');
  }

  return json;
}
