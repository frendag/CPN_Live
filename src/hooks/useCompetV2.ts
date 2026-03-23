import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../utils/constants';
import { CompetitionSummary, CompetitionsListResponse, ProgrammeResponse, ResultatsResponse } from '../utils/types';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Réponse serveur invalide.');
  }
  if (!res.ok) {
    throw new Error(json?.error || `Erreur HTTP ${res.status}`);
  }
  if (json?.error) {
    throw new Error(json.error);
  }
  return json as T;
}

export function useCompetV2() {
  const [competitions, setCompetitions] = useState<CompetitionSummary[]>([]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<number | null>(null);
  const [programme, setProgramme] = useState<ProgrammeResponse | null>(null);
  const [resultats, setResultats] = useState<ResultatsResponse | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadCompetitions = useCallback(async () => {
    setLoadingList(true);
    try {
      const payload = await fetchJson<CompetitionsListResponse>(`${API_BASE}/api/compet_v2/list`);
      setCompetitions(payload.competitions || []);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Impossible de charger les compétitions.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadCompetition = useCallback(async (competitionId: number, keepOldData = true) => {
    setSelectedCompetitionId(competitionId);
    setLoadingDetail(true);
    if (!keepOldData) {
      setProgramme(null);
      setResultats(null);
    }
    try {
      const [prog, res] = await Promise.all([
        fetchJson<ProgrammeResponse>(`${API_BASE}/api/compet_v2/programme?competition_id=${competitionId}`),
        fetchJson<ResultatsResponse>(`${API_BASE}/api/compet_v2/resultats?competition_id=${competitionId}`),
      ]);
      setProgramme(prog);
      setResultats(res);
      setLastRefresh(new Date());
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Impossible de charger la compétition.');
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const refreshResultats = useCallback(async () => {
    if (!selectedCompetitionId) return;
    try {
      const res = await fetchJson<ResultatsResponse>(`${API_BASE}/api/compet_v2/resultats?competition_id=${selectedCompetitionId}`);
      setResultats(res);
      setLastRefresh(new Date());
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Impossible d’actualiser les résultats.');
    }
  }, [selectedCompetitionId]);

  useEffect(() => {
    loadCompetitions();
  }, [loadCompetitions]);

  useEffect(() => {
    if (!competitions.length || selectedCompetitionId) return;
    const pick = competitions.find((item) => item.status === 'en_cours')
      || competitions.find((item) => item.status === 'a_venir')
      || competitions[0];
    if (pick) {
      loadCompetition(pick.id, false);
    }
  }, [competitions, selectedCompetitionId, loadCompetition]);

  const selectedCompetition = useMemo(
    () => competitions.find((item) => item.id === selectedCompetitionId) || null,
    [competitions, selectedCompetitionId],
  );

  return {
    competitions,
    selectedCompetition,
    selectedCompetitionId,
    programme,
    resultats,
    loadingList,
    loadingDetail,
    error,
    lastRefresh,
    loadCompetitions,
    loadCompetition,
    refreshResultats,
    setSelectedCompetitionId,
  };
}
