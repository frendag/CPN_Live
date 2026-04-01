/**
 * useTrainingAthletes.ts  — v2
 * Branché sur le même singleton athletesCache que useAthleteData.
 * → Zéro appel réseau supplémentaire si useAthleteData a déjà chargé la liste.
 * → Liste disponible instantanément depuis AsyncStorage dès le 2e lancement.
 */
import { useCallback, useEffect, useState } from 'react';
import { TrainingAthlete } from '../utils/trainingTypes';
import { CachedAthlete, loadAthletes, subscribeAthletes } from '../utils/athletesCache';

function toTrainingAthlete(a: CachedAthlete): TrainingAthlete {
  return { id: a.id, label: a.label, name: a.name };
}

export function useTrainingAthletes() {
  const [athletes, setAthletes] = useState<TrainingAthlete[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const applyList = useCallback((cached: CachedAthlete[]) => {
    setAthletes(cached.map(toTrainingAthlete));
  }, []);

  useEffect(() => {
    let mounted = true;

    // Souscription aux mises à jour du cache (refresh en fond)
    const unsub = subscribeAthletes((cached) => {
      if (mounted) applyList(cached);
    });

    // Charge depuis cache/réseau
    setLoading(true);
    loadAthletes()
      .then((cached) => { if (mounted) applyList(cached); })
      .catch((err)   => { if (mounted) setError(err instanceof Error ? err.message : 'Erreur chargement athlètes.'); })
      .finally(()    => { if (mounted) setLoading(false); });

    return () => { mounted = false; unsub(); };
  }, [applyList]);

  // Reload manuel : force le réseau
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cached = await loadAthletes(true);
      applyList(cached);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les athlètes.');
    } finally {
      setLoading(false);
    }
  }, [applyList]);

  return { athletes, loading, error, reload };
}
