/**
 * TrainingSuivi.tsx
 * Tableau de bord de suivi d'un athlète en entraînement.
 * - Sélecteur athlète (search + chips)
 * - 3 KPI : meilleur temps, dernière séance, tendance
 * - Graphique Chart.js (évolution des temps) via ChartWebView
 * - Filtres : nage · bassin · distance
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CpnLogo } from './CpnLogo';
import { useTrainingAthletes } from '../hooks/useTrainingAthletes';
import { useAppTheme } from '../utils/theme';
import { buildApiUrl } from '../utils/api';
import { formatMs } from '../utils/training';
import { PoolLength, StrokeCode } from '../utils/trainingTypes';
import ChartWebView from './ChartWebView';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrainingEntry {
  id: number;
  performed_at: string;       // "2025-04-01 10:23:00"
  stroke_code: StrokeCode;
  distance_m: number;
  pool_length_m: PoolLength;
  start_mode: string;
  final_time_ms: number;
}

interface AthleteTrainingResponse {
  athlete_id: number;
  athlete_name: string;
  entries: TrainingEntry[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STROKE_LABELS: Record<StrokeCode, string> = {
  NL: 'Nage libre',
  BRASSE: 'Brasse',
  PAPILLON: 'Papillon',
  DOS: 'Dos',
  '4N': '4 nages',
};

const STROKE_COLORS: Record<StrokeCode, string> = {
  NL: '#5ab4e8',
  BRASSE: '#34c778',
  PAPILLON: '#a35eea',
  DOS: '#00c9a7',
  '4N': '#ffa748',
};

function dateLabel(isoStr: string): string {
  const d = new Date(isoStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function msToSec(ms: number): number {
  return Math.round(ms / 10) / 100; // 2 decimal places
}

function trendSymbol(entries: TrainingEntry[]): { label: string; color: string; icon: string } {
  if (entries.length < 2)
    return { label: 'Insuffisant', color: '#6a8ba5', icon: 'minus-circle-outline' };
  const last3 = entries.slice(-3).map((e) => e.final_time_ms);
  const avg = last3.reduce((a, b) => a + b, 0) / last3.length;
  const prev3 = entries.slice(-6, -3);
  if (prev3.length === 0)
    return { label: 'Insuffisant', color: '#6a8ba5', icon: 'minus-circle-outline' };
  const prevAvg = prev3.reduce((a, b) => a + b.final_time_ms, 0) / prev3.length;
  const delta = ((avg - prevAvg) / prevAvg) * 100;
  if (delta < -1) return { label: `${Math.abs(delta).toFixed(1)}% ↓`, color: '#00c9a7', icon: 'trending-down' };
  if (delta > 1) return { label: `${delta.toFixed(1)}% ↑`, color: '#ff6b6b', icon: 'trending-up' };
  return { label: 'Stable', color: '#ffd166', icon: 'minus-circle-outline' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterChip({
  label,
  selected,
  accent,
  onPress,
}: {
  label: string;
  selected: boolean;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        selected && { backgroundColor: `${accent}22`, borderColor: `${accent}88` },
      ]}
    >
      <Text style={[styles.chipText, selected && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <View style={[styles.kpiCard, { borderColor: `${accent}33`, backgroundColor: `${accent}0d` }]}>
      <MaterialCommunityIcons name={icon} size={20} color={accent} style={{ marginBottom: 4 }} />
      <Text style={[styles.kpiLabel, { color: '#6a8ba5' }]}>{label}</Text>
      <Text style={[styles.kpiValue, { color: '#e8f0f8' }]}>{value}</Text>
      {sub ? <Text style={[styles.kpiSub, { color: accent }]}>{sub}</Text> : null}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  onBack: () => void;
};

export default function TrainingSuivi({ onBack }: Props) {
  const { palette } = useAppTheme();
  const { athletes, loading: loadingAthletes, error: athleteError, reload } = useTrainingAthletes();

  const [search, setSearch] = useState('');
  const [athleteId, setAthleteId] = useState<number | null>(null);
  const [entries, setEntries] = useState<TrainingEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [entriesError, setEntriesError] = useState<string | null>(null);

  // Filters
  const [filterStroke, setFilterStroke] = useState<StrokeCode | ''>('');
  const [filterPool, setFilterPool] = useState<PoolLength | 0>(0);
  const [filterDist, setFilterDist] = useState<number>(0);

  const selectedAthlete = athletes.find((a) => a.id === athleteId) ?? null;

  const filteredAthletes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return athletes.filter((a) => !q || a.label.toLowerCase().includes(q));
  }, [athletes, search]);

  // Load entries when athlete changes — on requête par nom (plus stable que l'id positional)
  const loadEntries = useCallback(async (name: string) => {
    setLoadingEntries(true);
    setEntriesError(null);
    try {
      const res = await fetch(
        buildApiUrl(`/api/training_perf/athlete_name/${encodeURIComponent(name)}`),
        { headers: { Accept: 'application/json' } },
      );
      const text = await res.text();
      const json: AthleteTrainingResponse = JSON.parse(text);
      setEntries(Array.isArray(json.entries) ? json.entries : []);
    } catch (err) {
      setEntriesError(err instanceof Error ? err.message : 'Impossible de charger les données.');
      setEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAthlete !== null) loadEntries(selectedAthlete.name);
    else setEntries([]);
  }, [selectedAthlete, loadEntries]);

  // Derived: available filter values
  const availableStrokes = useMemo(() => {
    const s = new Set(entries.map((e) => e.stroke_code));
    return Array.from(s) as StrokeCode[];
  }, [entries]);

  const availablePools = useMemo(() => {
    const p = new Set(entries.map((e) => e.pool_length_m));
    return Array.from(p) as PoolLength[];
  }, [entries]);

  const availableDists = useMemo(() => {
    const d = new Set(entries.map((e) => e.distance_m));
    return Array.from(d).sort((a, b) => a - b);
  }, [entries]);

  // Filtered entries
  const filtered = useMemo(() => {
    return entries
      .filter((e) => !filterStroke || e.stroke_code === filterStroke)
      .filter((e) => !filterPool || e.pool_length_m === filterPool)
      .filter((e) => !filterDist || e.distance_m === filterDist)
      .sort((a, b) => a.performed_at.localeCompare(b.performed_at));
  }, [entries, filterStroke, filterPool, filterDist]);

  // KPI calculations
  const bestEntry = useMemo(
    () => filtered.reduce<TrainingEntry | null>((best, e) => (!best || e.final_time_ms < best.final_time_ms ? e : best), null),
    [filtered],
  );

  const lastEntry = filtered.length > 0 ? filtered[filtered.length - 1] : null;
  const trend = useMemo(() => trendSymbol(filtered), [filtered]);
  const sessionCount = new Set(filtered.map((e) => e.performed_at.slice(0, 10))).size;

  // Chart config
  const chartConfig = useMemo(() => {
    if (filtered.length === 0) return null;
    const labels = filtered.map((e) => dateLabel(e.performed_at));
    const data = filtered.map((e) => msToSec(e.final_time_ms));
    const strokeKey = filterStroke || (availableStrokes[0] ?? 'NL');
    const color = STROKE_COLORS[strokeKey as StrokeCode] ?? palette.accent;
    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: filterStroke ? STROKE_LABELS[filterStroke] : 'Temps (s)',
            data,
            borderColor: color,
            backgroundColor: `${color}22`,
            pointBackgroundColor: color,
            pointRadius: 5,
            pointHoverRadius: 7,
            tension: 0.35,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => ` ${ctx.parsed.y.toFixed(2)} s`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#6a8ba5', maxRotation: 45, font: { size: 10 } },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
          y: {
            ticks: {
              color: '#6a8ba5',
              font: { size: 10 },
              callback: (v: number) => `${v.toFixed(1)}s`,
            },
            grid: { color: 'rgba(255,255,255,0.06)' },
            reverse: true, // lower = better
          },
        },
      },
    };
  }, [filtered, filterStroke, availableStrokes, palette.accent]);

  const hasAthlete = selectedAthlete !== null;
  const hasData = filtered.length > 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[palette.background, palette.backgroundAlt]} style={StyleSheet.absoluteFillObject} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backBtn} hitSlop={12}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={palette.accent} />
            <Text style={[styles.backText, { color: palette.accent }]}>Training</Text>
          </Pressable>
          <View style={[styles.badge, { borderColor: palette.glow, backgroundColor: `${palette.accent}11` }]}>
            <MaterialCommunityIcons name="chart-line-variant" size={14} color="#a35eea" />
            <Text style={[styles.badgeText, { color: '#a35eea' }]}>Suivi</Text>
          </View>
        </View>

        {/* Sélecteur athlète */}
        <View style={[styles.card, { borderColor: palette.cardBorder, backgroundColor: palette.surface }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Choisir un athlète</Text>
          <View style={[styles.searchWrap, { borderColor: palette.cardBorder, backgroundColor: palette.surfaceHigh }]}>
            <MaterialCommunityIcons name="account-search-outline" size={18} color={palette.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher un nageur…"
              placeholderTextColor={palette.textMuted}
              style={[styles.searchInput, { color: palette.text }]}
            />
          </View>

          {loadingAthletes ? (
            <ActivityIndicator color={palette.accent} />
          ) : athleteError ? (
            <Text style={[styles.errorText, { color: palette.danger }]}>{athleteError}</Text>
          ) : (
            <View style={styles.rowWrap}>
              {filteredAthletes.slice(0, 20).map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() => { setAthleteId(a.id); setFilterStroke(''); setFilterPool(0); setFilterDist(0); }}
                  style={[
                    styles.chip,
                    athleteId === a.id && {
                      backgroundColor: `${'#a35eea'}22`,
                      borderColor: `${'#a35eea'}88`,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, athleteId === a.id && { color: '#fff' }]}>{a.label}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Pressable onPress={reload} style={styles.reloadBtn}>
            <Text style={[styles.reloadText, { color: palette.accent }]}>Recharger</Text>
          </Pressable>
        </View>

        {/* Dashboard : visible uniquement si athlète sélectionné */}
        {hasAthlete && (
          <>
            {/* Titre athlète */}
            <View style={styles.athleteHeader}>
              <MaterialCommunityIcons name="account-circle-outline" size={28} color="#a35eea" />
              <Text style={[styles.athleteName, { color: palette.text }]}>{selectedAthlete.label}</Text>
            </View>

            {loadingEntries ? (
              <ActivityIndicator color={palette.accent} style={{ marginVertical: 24 }} />
            ) : entriesError ? (
              <Text style={[styles.errorText, { color: palette.danger }]}>{entriesError}</Text>
            ) : (
              <>
                {/* ── Filtres ─────────────────────────────────────────────── */}
                <View style={[styles.card, { borderColor: palette.cardBorder, backgroundColor: palette.surface }]}>
                  <Text style={[styles.filterGroupLabel, { color: palette.textMuted }]}>Nage</Text>
                  <View style={styles.rowWrap}>
                    <FilterChip label="Toutes" selected={filterStroke === ''} accent="#a35eea" onPress={() => setFilterStroke('')} />
                    {availableStrokes.map((s) => (
                      <FilterChip key={s} label={STROKE_LABELS[s]} selected={filterStroke === s} accent={STROKE_COLORS[s]} onPress={() => setFilterStroke(s)} />
                    ))}
                  </View>

                  <Text style={[styles.filterGroupLabel, { color: palette.textMuted, marginTop: 10 }]}>Bassin</Text>
                  <View style={styles.rowWrap}>
                    <FilterChip label="Tous" selected={filterPool === 0} accent="#a35eea" onPress={() => setFilterPool(0)} />
                    {availablePools.map((p) => (
                      <FilterChip key={p} label={`${p} m`} selected={filterPool === p} accent="#5ab4e8" onPress={() => setFilterPool(p)} />
                    ))}
                  </View>

                  <Text style={[styles.filterGroupLabel, { color: palette.textMuted, marginTop: 10 }]}>Distance</Text>
                  <View style={styles.rowWrap}>
                    <FilterChip label="Toutes" selected={filterDist === 0} accent="#a35eea" onPress={() => setFilterDist(0)} />
                    {availableDists.map((d) => (
                      <FilterChip key={d} label={`${d} m`} selected={filterDist === d} accent="#ffa748" onPress={() => setFilterDist(d)} />
                    ))}
                  </View>
                </View>

                {/* ── KPI cards ───────────────────────────────────────────── */}
                {hasData ? (
                  <>
                    <View style={styles.kpiRow}>
                      <KpiCard
                        icon="trophy-outline"
                        label="Meilleur temps"
                        value={bestEntry ? formatMs(bestEntry.final_time_ms) : '—'}
                        sub={bestEntry ? dateLabel(bestEntry.performed_at) : undefined}
                        accent="#ffd166"
                      />
                      <KpiCard
                        icon="clock-outline"
                        label="Dernière séance"
                        value={lastEntry ? formatMs(lastEntry.final_time_ms) : '—'}
                        sub={lastEntry ? dateLabel(lastEntry.performed_at) : undefined}
                        accent="#5ab4e8"
                      />
                      <KpiCard
                        icon={trend.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        label="Tendance"
                        value={trend.label}
                        sub={`${sessionCount} séance${sessionCount > 1 ? 's' : ''}`}
                        accent={trend.color}
                      />
                    </View>

                    {/* ── Graphique ─────────────────────────────────────── */}
                    <View style={[styles.card, { borderColor: palette.cardBorder, backgroundColor: palette.surface }]}>
                      <Text style={[styles.cardTitle, { color: palette.text }]}>Évolution des temps</Text>
                      <Text style={[styles.cardSub, { color: palette.textMuted }]}>
                        {filtered.length} mesure{filtered.length > 1 ? 's' : ''}
                        {filterStroke ? ` · ${STROKE_LABELS[filterStroke]}` : ''}
                        {filterPool ? ` · ${filterPool}m` : ''}
                        {filterDist ? ` · ${filterDist}m` : ''}
                      </Text>

                      {chartConfig && (
                        <View style={styles.chartWrap}>
                          <ChartWebView config={chartConfig} height={240} />
                        </View>
                      )}

                      {/* Mini table des 5 dernières mesures */}
                      <View style={styles.miniTable}>
                        {filtered
                          .slice(-5)
                          .reverse()
                          .map((e) => (
                            <View key={e.id} style={[styles.miniRow, { borderColor: palette.cardBorder }]}>
                              <Text style={[styles.miniDate, { color: palette.textMuted }]}>{dateLabel(e.performed_at)}</Text>
                              <Text style={[styles.miniStroke, { color: STROKE_COLORS[e.stroke_code] ?? palette.accent }]}>
                                {STROKE_LABELS[e.stroke_code]} {e.distance_m}m/{e.pool_length_m}m
                              </Text>
                              <Text style={[styles.miniTime, { color: e.id === bestEntry?.id ? '#ffd166' : palette.text }]}>
                                {formatMs(e.final_time_ms)}
                                {e.id === bestEntry?.id ? ' 🏆' : ''}
                              </Text>
                            </View>
                          ))}
                      </View>
                    </View>
                  </>
                ) : (
                  <View style={[styles.emptyBox, { borderColor: palette.cardBorder, backgroundColor: palette.surface }]}>
                    <MaterialCommunityIcons name="database-off-outline" size={36} color={palette.textMuted} />
                    <Text style={[styles.emptyText, { color: palette.textMuted }]}>
                      Aucune mesure trouvée pour cette configuration.
                    </Text>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 18, gap: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontWeight: '700', fontSize: 15 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7,
  },
  badgeText: { fontWeight: '800', fontSize: 12 },

  card: { borderRadius: 22, borderWidth: 1, padding: 16, gap: 10 },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  cardSub: { fontSize: 12, marginTop: -6 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  chipText: { color: '#b9ccdd', fontWeight: '700', fontSize: 13 },
  reloadBtn: { alignSelf: 'flex-start', paddingVertical: 4 },
  reloadText: { fontWeight: '700', fontSize: 13 },
  errorText: { fontSize: 13 },

  athleteHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  athleteName: { fontSize: 22, fontWeight: '900' },

  filterGroupLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

  kpiRow: { flexDirection: 'row', gap: 10 },
  kpiCard: {
    flex: 1, borderRadius: 16, borderWidth: 1,
    padding: 12, alignItems: 'center', gap: 2,
  },
  kpiLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.6 },
  kpiValue: { fontSize: 16, fontWeight: '900', textAlign: 'center' },
  kpiSub: { fontSize: 12, fontWeight: '700', textAlign: 'center' },

  chartWrap: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },

  miniTable: { marginTop: 10, gap: 6 },
  miniRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9,
  },
  miniDate: { fontSize: 12, fontWeight: '700', width: 44 },
  miniStroke: { fontSize: 12, fontWeight: '600', flex: 1, paddingHorizontal: 6 },
  miniTime: { fontSize: 13, fontWeight: '900' },

  emptyBox: {
    borderRadius: 22, borderWidth: 1, padding: 32,
    alignItems: 'center', gap: 12,
  },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
