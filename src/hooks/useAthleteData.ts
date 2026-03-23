import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildApiUrl, errorMessage, fetchJson } from '../utils/api';
import { AthleteRankingResponse, AthleteResponse, AthletesListResponse } from '../utils/types';

export function useAthleteData() {
  const [athletes, setAthletes] = useState<string[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<string>('');
  const [athlete, setAthlete] = useState<AthleteResponse | null>(null);
  const [ranking25, setRanking25] = useState<AthleteRankingResponse | null>(null);
  const [ranking50, setRanking50] = useState<AthleteRankingResponse | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAthletes = useCallback(async () => {
    setLoadingList(true);
    try {
      const payload = await fetchJson<AthletesListResponse>(buildApiUrl('/api/athletes'));
      const nextAthletes = (payload.athletes || []).slice().sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
      setAthletes(nextAthletes);
      setError(null);
      if (!selectedAthlete && nextAthletes.length) {
        setSelectedAthlete(nextAthletes[0]);
      }
    } catch (error: unknown) {
      setError(errorMessage(error, 'Impossible de charger la liste des athlètes.'));
    } finally {
      setLoadingList(false);
    }
  }, [selectedAthlete]);

  const loadAthlete = useCallback(async (name: string) => {
    if (!name) return;
    setLoadingDetail(true);
    setLoadingRankings(true);
    try {
      const detail = await fetchJson<AthleteResponse>(buildApiUrl(`/api/athlete?nom=${encodeURIComponent(name)}`));
      setAthlete(detail);
      setError(null);
    } catch (error: unknown) {
      setAthlete(null);
      setRanking25(null);
      setRanking50(null);
      setError(errorMessage(error, 'Impossible de charger la fiche athlète.'));
      setLoadingDetail(false);
      setLoadingRankings(false);
      return;
    } finally {
      setLoadingDetail(false);
    }

    try {
      const [rank25, rank50] = await Promise.all([
        fetchJson<AthleteRankingResponse>(buildApiUrl(`/api/athlete_ranking?nom=${encodeURIComponent(name)}&idbas=25`)).catch(() => ({ nom: name, saison: '', bassin: '25', rows: [] })),
        fetchJson<AthleteRankingResponse>(buildApiUrl(`/api/athlete_ranking?nom=${encodeURIComponent(name)}&idbas=50`)).catch(() => ({ nom: name, saison: '', bassin: '50', rows: [] })),
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
    loadAthletes();
  }, [loadAthletes]);

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
    loadAthletes,
    loadAthlete,
    setSelectedAthlete,
  };
}
