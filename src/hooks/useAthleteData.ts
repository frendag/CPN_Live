/**
 * useAthleteData.ts  — v2
 * Utilise le singleton athletesCache pour :
 *   - afficher la liste instantanément depuis AsyncStorage dès le 2e lancement
 *   - éviter les doubles appels réseau si useTrainingAthletes est aussi monté
 *   - se mettre à jour automatiquement quand le cache réseau revient
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildApiUrl, errorMessage, fetchJson } from '../utils/api';
import { AthleteRankingResponse, AthleteResponse, AthletesListResponse } from '../utils/types';
import { CachedAthlete, loadAthletes, subscribeAthletes } from '../utils/athletesCache';

export function useAthleteData() {
  const [athletes, setAthletes]           = useState<string[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<string>('');
  const [athlete, setAthlete]             = useState<AthleteResponse | null>(null);
  const [ranking25, setRanking25]         = useState<AthleteRankingResponse | null>(null);
  const [ranking50, setRanking50]         = useState<AthleteRankingResponse | null>(null);
  const [loadingList, setLoadingList]     = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  // ── Conversion CachedAthlete[] → string[] (format attendu par AthleteHub) ──
  const applyList = useCallback((cached: CachedAthlete[]) => {
    const names = cached.map((a) => a.label);
    setAthletes(names);
    setSelectedAthlete((prev) => prev || (names.length ? names[0] : ''));
  }, []);

  // ── Chargement initial + souscription aux mises à jour du cache ──
  useEffect(() => {
    let mounted = true;

    // Souscription aux updates (refresh en fond)
    const unsub = subscribeAthletes((cached) => {
      if (mounted) applyList(cached);
    });

    // Charge depuis cache/réseau
    setLoadingList(true);
    loadAthletes()
      .then((cached) => { if (mounted) applyList(cached); })
      .catch((err)   => { if (mounted) setError(errorMessage(err, 'Impossible de charger la liste.')); })
      .finally(()    => { if (mounted) setLoadingList(false); });

    return () => { mounted = false; unsub(); };
  }, [applyList]);

  // ── Reload manuel (bouton ↻) : force le réseau ──
  const loadAthletesList = useCallback(async () => {
    setLoadingList(true);
    try {
      const cached = await loadAthletes(true); // forceRefresh
      applyList(cached);
      setError(null);
    } catch (err) {
      setError(errorMessage(err, 'Impossible de charger la liste des athlètes.'));
    } finally {
      setLoadingList(false);
    }
  }, [applyList]);

  // ── Chargement de la fiche athlète (inchangé) ──
  const loadAthlete = useCallback(async (name: string) => {
    if (!name) return;
    setLoadingDetail(true);
    setLoadingRankings(true);
    try {
      const detail = await fetchJson<AthleteResponse>(
        buildApiUrl(`/api/athlete?nom=${encodeURIComponent(name)}`),
      );
      setAthlete(detail);
      setError(null);
    } catch (err) {
      setAthlete(null);
      setRanking25(null);
      setRanking50(null);
      setError(errorMessage(err, 'Impossible de charger la fiche athlète.'));
      setLoadingDetail(false);
      setLoadingRankings(false);
      return;
    } finally {
      setLoadingDetail(false);
    }

    try {
      const [rank25, rank50] = await Promise.all([
        fetchJson<AthleteRankingResponse>(
          buildApiUrl(`/api/athlete_ranking?nom=${encodeURIComponent(name)}&idbas=25`),
        ).catch(() => ({ nom: name, saison: '', bassin: '25', rows: [] })),
        fetchJson<AthleteRankingResponse>(
          buildApiUrl(`/api/athlete_ranking?nom=${encodeURIComponent(name)}&idbas=50`),
        ).catch(() => ({ nom: name, saison: '', bassin: '50', rows: [] })),
      ]);
      setRanking25(rank25);
      setRanking50(rank50);
    } catch {
      setRanking25({ nom: name, saison: '', bassin: '25', rows: [] });
      setRanking50({ nom: name, saison: '', bassin: '50', rows: [] });
    } finally {
      setLoadingRankings(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedAthlete || !athletes.includes(selectedAthlete)) return;
    if (athlete?.nom === selectedAthlete) return;
    loadAthlete(selectedAthlete);
  }, [selectedAthlete, athletes, athlete?.nom, loadAthlete]);

  const hasRankings = useMemo(
    () => Boolean((ranking25?.rows?.length || 0) + (ranking50?.rows?.length || 0)),
    [ranking25, ranking50],
  );

  return {
    athletes,
    selectedAthlete,
    athlete,
    ranking25,
    ranking50,
    loadingList,
    loadingDetail,
    loadingRankings,
    error,
    hasRankings,
    loadAthletes: loadAthletesList,
    loadAthlete,
    setSelectedAthlete,
  };
}
