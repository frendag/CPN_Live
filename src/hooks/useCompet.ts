import { useState, useCallback, useRef, useEffect } from 'react';
import { API_BASE } from '../utils/constants';
import { CompetData } from '../utils/types';

export function useCompet() {
  const [data, setData]         = useState<CompetData | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoOn, setAutoOn]     = useState(false);
  const [countdown, setCountdown] = useState(0);
  const cdRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const cidRef  = useRef<string>('');

  const load = useCallback(async (cid: string, isRefresh = false) => {
    if (!cid.trim()) return;
    cidRef.current = cid;
    setLoading(true);
    if (!isRefresh) setError(null);

    try {
      const url = `${API_BASE}/api/compet?competition=${encodeURIComponent(cid)}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const txt = await res.text();
      let json: CompetData;
      try {
        json = JSON.parse(txt);
      } catch {
        throw new Error('Réponse serveur invalide (non-JSON)');
      }
      if (json.error) throw new Error(json.error);
      setData(json);
      setLastRefresh(new Date());
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    if (cidRef.current) load(cidRef.current, true);
  }, [load]);

  const startAuto = useCallback((on: boolean, secs = 60) => {
    if (cdRef.current) { clearInterval(cdRef.current); cdRef.current = null; }
    setAutoOn(on);
    if (!on) { setCountdown(0); return; }
    let rem = secs;
    setCountdown(rem);
    cdRef.current = setInterval(() => {
      rem--;
      setCountdown(rem);
      if (rem <= 0) {
        rem = secs;
        setCountdown(secs);
        refresh();
      }
    }, 1000);
  }, [refresh]);

  useEffect(() => () => {
    if (cdRef.current) clearInterval(cdRef.current);
  }, []);

  return { data, loading, error, lastRefresh, autoOn, countdown, load, refresh, startAuto };
}
