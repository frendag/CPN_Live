/**
 * AthleteCharts.tsx  — v2
 * Graphiques de suivi athlète via Chart.js dans des WebViews inline.
 * Fidèle à la version web (app.py) :
 *   1. Évolution des points  (bar + line)       → données `evo`
 *   2. Suivi des temps par épreuve (line + proj) → données `evo_temps`
 *   3. Fréquence d'activité (bar)               → données `freq`
 */
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../utils/constants';
import { AthleteEvolutionRow } from '../utils/types';
import ChartWebView from './ChartWebView';

// ─── Types ────────────────────────────────────────────────────────────────────
interface EvoTempsEntry {
  dates: string[];
  sec:   number[];
  temps: string[];
  pts:   number[];
  comp:  string[];
  lieu:  string[];
  nage:  string;
  color: string;
  proj:  number[];
}
interface FreqRow { Annee: number; nb: number; }
interface Props {
  evo?:       AthleteEvolutionRow[];
  evo_temps?: Record<string, EvoTempsEntry>;
  freq?:      FreqRow[];
}

// ─── Couleurs nage (identiques au web) ───────────────────────────────────────
const NC: Record<string, string> = {
  NL:  '#5ab4e8',
  Dos: '#00c9a7',
  Bra: '#34c778',
  Pap: '#a35eea',
  '4N':'#ffa748',
};

function secToStr(s: number): string {
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}:${(s % 60).toFixed(2).padStart(5, '0')}` : s.toFixed(2);
}

// ─── Section repliable ────────────────────────────────────────────────────────
function ChartSection({
  title, sub, children, defaultOpen = true,
}: {
  title: string; sub?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.section}>
      <Pressable style={styles.sectionHeader} onPress={() => setOpen(v => !v)}>
        <View style={styles.sectionAccent} />
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {sub ? <Text style={styles.sectionSub}>{sub}</Text> : null}
        </View>
        <Text style={styles.chevron}>{open ? '▾' : '▸'}</Text>
      </Pressable>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

// ─── Stat mini-card ───────────────────────────────────────────────────────────
function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

// ─── Config Chart.js : Évolution points ──────────────────────────────────────
function buildEvoConfig(evo: AthleteEvolutionRow[]) {
  return {
    type: 'bar',
    data: {
      labels: evo.map(d => d.Annee),
      datasets: [
        {
          type: 'line',
          label: 'Points moyens',
          data: evo.map(d => d.moy),
          borderColor: '#00c9a7',
          backgroundColor: 'rgba(0,201,167,0.12)',
          borderWidth: 2.5,
          pointRadius: 5,
          pointBackgroundColor: '#00c9a7',
          pointBorderColor: '#0d2035',
          pointBorderWidth: 1.5,
          fill: true,
          tension: 0.3,
          yAxisID: 'y1',
          order: 0,
        },
        {
          type: 'line',
          label: 'Points max',
          data: evo.map(d => d.maxi),
          borderColor: 'rgba(255,209,102,0.6)',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderDash: [5, 3],
          pointRadius: 3,
          tension: 0.3,
          yAxisID: 'y1',
          order: 0,
        },
        {
          type: 'bar',
          label: 'Nb performances',
          data: evo.map(d => d.nb),
          backgroundColor: evo.map((_, i) =>
            i === evo.length - 1 ? 'rgba(255,209,102,0.55)' : 'rgba(29,111,164,0.45)'
          ),
          borderColor: evo.map((_, i) =>
            i === evo.length - 1 ? '#ffd166' : '#1d6fa4'
          ),
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: 'y2',
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600 },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: '#a8c2d8', font: { size: 10 }, boxWidth: 12, padding: 10 },
        },
        tooltip: {
          backgroundColor: '#0d2035',
          borderColor: '#1a3454',
          borderWidth: 1,
          titleColor: '#e8f0f8',
          bodyColor: '#a8c2d8',
          callbacks: {
            afterBody: (ctx: any[]) => {
              const d = evo[ctx[0].dataIndex];
              if (d?.delta && d.delta !== 0) {
                const s = d.delta > 0 ? '▲' : '▼';
                return [`Progression : ${s} ${d.delta > 0 ? '+' : ''}${d.delta} pts`];
              }
              return [];
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#6a8ba5', font: { size: 10 } },
          grid: { color: 'rgba(26,52,84,0.6)' },
        },
        y1: {
          position: 'left',
          title: { display: true, text: 'Points', color: '#6a8ba5', font: { size: 10 } },
          ticks: { color: '#6a8ba5', font: { size: 10 } },
          grid: { color: 'rgba(26,52,84,0.6)' },
          beginAtZero: false,
        },
        y2: {
          position: 'right',
          title: { display: true, text: 'Perfs', color: '#6a8ba5', font: { size: 10 } },
          ticks: { color: '#6a8ba5', font: { size: 10 } },
          grid: { drawOnChartArea: false },
          beginAtZero: true,
        },
      },
    },
  };
}

// ─── Config Chart.js : Suivi temps ───────────────────────────────────────────
function buildTempsConfig(ep: EvoTempsEntry) {
  const col = ep.color || NC[ep.nage] || '#1d6fa4';
  const n = ep.sec.length;
  const projLabels = ep.proj.map((_, i) => `Proj.+${i + 1}`);
  const allLabels = [...ep.dates, ...projLabels];
  const realData  = [...ep.sec,  ...Array(projLabels.length).fill(null)];
  const projData  = [...Array(n - 1).fill(null), ep.sec[n - 1], ...ep.proj];

  // Couleur points selon type compétition (INT rouge, NAT orange, autre = couleur nage)
  const ptColors = ep.comp.map(c =>
    c === '[INT]' ? '#ff6b6b' : c === '[NAT]' ? '#ffa748' : col
  );

  const datasets: any[] = [
    {
      label: 'Performances',
      data: realData,
      borderColor: col,
      backgroundColor: col + '18',
      borderWidth: 2.5,
      pointRadius: 6,
      pointBackgroundColor: ptColors,
      pointBorderColor: '#0d2035',
      pointBorderWidth: 1.5,
      fill: true,
      tension: 0.3,
      spanGaps: false,
    },
  ];

  if (ep.proj.length > 0) {
    datasets.push({
      label: 'Tendance / Projection',
      data: projData,
      borderColor: col + '80',
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderDash: [8, 4],
      pointRadius: 4,
      pointStyle: 'triangle',
      pointBackgroundColor: col + '80',
      tension: 0.3,
      spanGaps: false,
    });
  }

  return {
    type: 'line',
    data: { labels: allLabels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500 },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: '#a8c2d8', font: { size: 10 }, boxWidth: 12, padding: 8 },
        },
        tooltip: {
          backgroundColor: '#0d2035',
          borderColor: col,
          borderWidth: 1,
          titleColor: '#e8f0f8',
          bodyColor: '#a8c2d8',
          callbacks: {
            label: (ctx: any) => {
              if (ctx.raw === null) return null;
              const s = ctx.raw as number;
              return ` ${secToStr(s)}`;
            },
            afterLabel: (ctx: any) => {
              const i = ctx.dataIndex;
              if (i < ep.pts.length) return ` ${ep.pts[i]} pts`;
              return null;
            },
            footer: (ctxArr: any[]) => {
              const i = ctxArr[0]?.dataIndex;
              if (i !== undefined && i < ep.comp.length && ep.comp[i]) {
                return `${ep.comp[i]}${ep.lieu[i] ? ' · ' + ep.lieu[i] : ''}`;
              }
              return '';
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#6a8ba5', font: { size: 9 }, maxRotation: 30 },
          grid: { color: 'rgba(26,52,84,0.6)' },
        },
        y: {
          ticks: {
            color: '#6a8ba5',
            font: { size: 10 },
            callback: (v: number) => secToStr(v),
          },
          grid: { color: 'rgba(26,52,84,0.6)' },
          reverse: true,   // temps plus bas = meilleur = en haut
        },
      },
    },
  };
}

// ─── Config Chart.js : Fréquence ─────────────────────────────────────────────
function buildFreqConfig(freq: FreqRow[]) {
  return {
    type: 'bar',
    data: {
      labels: freq.map(d => d.Annee),
      datasets: [{
        label: 'Performances',
        data: freq.map(d => d.nb),
        backgroundColor: freq.map((_, i) =>
          i === freq.length - 1 ? 'rgba(0,201,167,0.6)' : 'rgba(29,111,164,0.45)'
        ),
        borderColor: freq.map((_, i) =>
          i === freq.length - 1 ? '#00c9a7' : '#1d6fa4'
        ),
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d2035',
          borderColor: '#1a3454',
          borderWidth: 1,
          titleColor: '#e8f0f8',
          bodyColor: '#a8c2d8',
        },
      },
      scales: {
        x: {
          ticks: { color: '#6a8ba5', font: { size: 10 } },
          grid: { color: 'rgba(26,52,84,0.6)' },
        },
        y: {
          ticks: { color: '#6a8ba5', font: { size: 10 } },
          grid: { color: 'rgba(26,52,84,0.6)' },
          beginAtZero: true,
        },
      },
    },
  };
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function AthleteCharts({ evo, evo_temps, freq }: Props) {
  const [bassin, setBassin]       = useState<'25m' | '50m'>('50m');
  const [selectedEp, setSelectedEp] = useState<string>('');

  const epKeys50 = Object.keys(evo_temps || {}).filter(k => k.includes('· 50m'));
  const epKeys25 = Object.keys(evo_temps || {}).filter(k => k.includes('· 25m'));
  const epKeys   = bassin === '50m' ? epKeys50 : epKeys25;

  // Bassin auto : 50m si dispo, sinon 25m
  useEffect(() => {
    if (epKeys50.length === 0 && epKeys25.length > 0) setBassin('25m');
  }, [evo_temps]);

  // Épreuve sélectionnée par défaut
  useEffect(() => {
    if (epKeys.length > 0 && (!selectedEp || !epKeys.includes(selectedEp))) {
      setSelectedEp(epKeys[0]);
    }
  }, [bassin, evo_temps]);

  const hasEvo   = evo && evo.length >= 2;
  const hasTemps = epKeys.length > 0;
  const hasFreq  = freq && freq.length >= 2;
  const currentEp = evo_temps?.[selectedEp];

  if (!hasEvo && !hasTemps && !hasFreq) return null;

  return (
    <View style={styles.wrap}>

      {/* ── 1. Évolution des points ── */}
      {hasEvo && (
        <ChartSection
          title="Évolution des points"
          sub={`${evo!.length} années · barres = nb perfs · ligne = pts moyens`}
        >
          <ChartWebView config={buildEvoConfig(evo!)} height={220} />

          <View style={styles.statsRow}>
            <StatBox
              label="MEILLEUR"
              value={`${Math.max(...evo!.map(d => d.moy))} pts`}
              color={COLORS.accent}
            />
            <StatBox
              label="CETTE ANNÉE"
              value={`${evo![evo!.length - 1]?.moy} pts`}
              color={COLORS.warning}
            />
            <StatBox
              label="PROGRESSION"
              value={(() => {
                const last = evo![evo!.length - 1];
                if (!last?.delta) return '—';
                return `${last.delta > 0 ? '+' : ''}${last.delta}`;
              })()}
              color={(() => {
                const d = evo![evo!.length - 1]?.delta ?? 0;
                return d > 0 ? COLORS.success : d < 0 ? COLORS.danger : COLORS.muted;
              })()}
            />
          </View>
        </ChartSection>
      )}

      {/* ── 2. Suivi des temps ── */}
      {hasTemps && (
        <ChartSection
          title="Suivi des temps"
          sub="Meilleure performance par trimestre"
        >
          {/* Sélecteur bassin */}
          <View style={styles.bassinRow}>
            {epKeys50.length > 0 && (
              <Pressable
                style={[styles.bassinBtn, bassin === '50m' && styles.bassinBtnOn]}
                onPress={() => { setBassin('50m'); setSelectedEp(''); }}
              >
                <Text style={[styles.bassinBtnText, bassin === '50m' && styles.bassinBtnTextOn]}>50m</Text>
              </Pressable>
            )}
            {epKeys25.length > 0 && (
              <Pressable
                style={[styles.bassinBtn, bassin === '25m' && styles.bassinBtnOn]}
                onPress={() => { setBassin('25m'); setSelectedEp(''); }}
              >
                <Text style={[styles.bassinBtnText, bassin === '25m' && styles.bassinBtnTextOn]}>25m</Text>
              </Pressable>
            )}
          </View>

          {/* Sélecteur épreuve */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.epRow}>
            {epKeys.map(k => {
              const ep = evo_temps![k];
              const col = ep.color || NC[ep.nage] || '#1d6fa4';
              const label = k.replace(` · ${bassin}`, '');
              const active = k === selectedEp;
              return (
                <Pressable
                  key={k}
                  onPress={() => setSelectedEp(k)}
                  style={[
                    styles.epTab,
                    {
                      borderColor: active ? col : COLORS.border,
                      backgroundColor: active ? col + '22' : COLORS.surface,
                    },
                  ]}
                >
                  <Text style={[styles.epTabText, { color: active ? col : COLORS.muted }]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Graphique temps */}
          {currentEp ? (
            <>
              <ChartWebView
                key={selectedEp}
                config={buildTempsConfig(currentEp)}
                height={200}
              />

              {/* Stats rapides */}
              <View style={styles.statsRow}>
                <StatBox
                  label="MEILLEUR"
                  value={currentEp.temps[currentEp.sec.indexOf(Math.min(...currentEp.sec))]}
                  color={COLORS.success}
                />
                <StatBox
                  label="DERNIER"
                  value={currentEp.temps[currentEp.temps.length - 1]}
                />
                <StatBox
                  label="MAX PTS"
                  value={Math.max(...currentEp.pts)}
                  color={COLORS.accent}
                />
                {currentEp.proj.length > 0 && (
                  <StatBox
                    label="OBJECTIF"
                    value={secToStr(currentEp.proj[0])}
                    color={currentEp.color || COLORS.warning}
                  />
                )}
              </View>

              {/* Meilleure compétition */}
              {(() => {
                const bestIdx = currentEp.sec.indexOf(Math.min(...currentEp.sec));
                const comp = currentEp.comp[bestIdx];
                const lieu = currentEp.lieu[bestIdx];
                if (!comp) return null;
                return (
                  <View style={styles.bestCompBox}>
                    <Text style={styles.bestCompLabel}>🏆 Meilleur temps réalisé à</Text>
                    <Text style={styles.bestCompVal}>
                      {comp}{lieu ? ` · ${lieu}` : ''}
                    </Text>
                  </View>
                );
              })()}

              {/* Légende couleurs compétition */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#ff6b6b' }]} />
                  <Text style={styles.legendText}>[INT]</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#ffa748' }]} />
                  <Text style={styles.legendText}>[NAT]</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: currentEp.color || COLORS.primaryLight }]} />
                  <Text style={styles.legendText}>Autre</Text>
                </View>
              </View>
            </>
          ) : null}
        </ChartSection>
      )}

      {/* ── 3. Fréquence d'activité ── */}
      {hasFreq && (
        <ChartSection
          title="Fréquence d'activité"
          sub="Nombre de performances par année"
          defaultOpen={false}
        >
          <ChartWebView config={buildFreqConfig(freq!)} height={160} />
          <View style={styles.statsRow}>
            <StatBox label="TOTAL"        value={freq!.reduce((s, d) => s + d.nb, 0)} />
            <StatBox label="RECORD"       value={Math.max(...freq!.map(d => d.nb))} color={COLORS.accent} />
            <StatBox label="CETTE ANNÉE"  value={freq![freq!.length - 1]?.nb} color={COLORS.warning} />
          </View>
        </ChartSection>
      )}

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrap: { gap: 10 },

  section: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionAccent: { width: 3, height: 18, backgroundColor: COLORS.accent, borderRadius: 2 },
  sectionTitle: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  sectionSub: { color: COLORS.muted, fontSize: 11, marginTop: 1 },
  chevron: { color: COLORS.muted, fontSize: 16 },
  sectionBody: { padding: 12, gap: 10 },

  // Bassin
  bassinRow: { flexDirection: 'row', gap: 6 },
  bassinBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  bassinBtnOn: { backgroundColor: COLORS.accentDim, borderColor: COLORS.accentGlow },
  bassinBtnText: { color: COLORS.muted, fontSize: 13, fontWeight: '800' },
  bassinBtnTextOn: { color: COLORS.accent },

  // Épreuve tabs
  epRow: { gap: 6, paddingRight: 4, paddingVertical: 2 },
  epTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  epTabText: { fontSize: 12, fontWeight: '800' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statBox: {
    flex: 1,
    minWidth: 70,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 9,
    alignItems: 'center',
    gap: 3,
  },
  statLabel: {
    color: COLORS.subtle,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: { color: COLORS.text, fontSize: 14, fontWeight: '900' },

  // Best comp
  bestCompBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 9,
    gap: 3,
  },
  bestCompLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '700' },
  bestCompVal: { color: COLORS.textMid, fontSize: 12, fontWeight: '700' },

  // Legend
  legendRow: { flexDirection: 'row', gap: 12, paddingLeft: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: COLORS.muted, fontSize: 10 },
});
