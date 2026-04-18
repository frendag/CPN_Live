/**
 * AthleteCharts.tsx  — v3
 * Migration vers victory-native (SVG natif) — supprime les 3 WebViews Chart.js.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { VictoryAxis, VictoryBar, VictoryChart, VictoryLine, VictoryScatter } from 'victory-native';
import { COLORS } from '../utils/constants';
import { AthleteEvolutionRow } from '../utils/types';

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

// ─── Couleurs nage ────────────────────────────────────────────────────────────
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

// ─── Styles axes partagés ─────────────────────────────────────────────────────
const axisStyle = {
  tickLabels: { fill: '#6a8ba5', fontSize: 10 },
  grid:       { stroke: 'rgba(26,52,84,0.6)' },
  axis:       { stroke: 'rgba(26,52,84,0.6)' },
};

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

// ─── Graphique 1 : Évolution des points (Bar + Line) ─────────────────────────
function EvoChart({ evo }: { evo: AthleteEvolutionRow[] }) {
  const { width } = useWindowDimensions();
  const chartWidth = width - 48;
  const maxMoy = Math.max(...evo.map(d => d.moy));
  const maxNb  = Math.max(...evo.map(d => d.nb));
  // Barres mises à l'échelle pour cohabiter visuellement avec les lignes de points
  const barData = evo.map((d, i) => ({
    x: String(d.Annee),
    y: (d.nb / maxNb) * maxMoy * 0.35,
    isLast: i === evo.length - 1,
  }));

  return (
    <VictoryChart
      width={chartWidth}
      height={220}
      padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
      domainPadding={{ x: 20 }}
    >
      <VictoryAxis style={axisStyle} />
      <VictoryAxis dependentAxis style={axisStyle} />
      <VictoryBar
        data={barData}
        style={{
          data: {
            fill:        ({ datum }: any) => datum.isLast ? 'rgba(255,209,102,0.55)' : 'rgba(29,111,164,0.45)',
            stroke:      ({ datum }: any) => datum.isLast ? '#ffd166' : '#1d6fa4',
            strokeWidth: 1,
          },
        }}
        cornerRadius={{ top: 4 }}
      />
      <VictoryLine
        data={evo.map(d => ({ x: String(d.Annee), y: d.moy }))}
        style={{ data: { stroke: '#00c9a7', strokeWidth: 2.5 } }}
        interpolation="catmullRom"
      />
      <VictoryScatter
        data={evo.map(d => ({ x: String(d.Annee), y: d.moy }))}
        size={5}
        style={{ data: { fill: '#00c9a7', stroke: '#0d2035', strokeWidth: 1.5 } }}
      />
      <VictoryLine
        data={evo.map(d => ({ x: String(d.Annee), y: d.maxi }))}
        style={{ data: { stroke: 'rgba(255,209,102,0.6)', strokeWidth: 1.5, strokeDasharray: [5, 3] as any } }}
        interpolation="catmullRom"
      />
    </VictoryChart>
  );
}

// ─── Graphique 2 : Suivi des temps (Line + Projection) ───────────────────────
function TempsChart({ ep }: { ep: EvoTempsEntry }) {
  const { width } = useWindowDimensions();
  const chartWidth = width - 48;
  const col = ep.color || NC[ep.nage] || '#1d6fa4';

  const n = ep.sec.length;
  const projLabels = ep.proj.map((_, i) => `Proj.+${i + 1}`);
  const allLabels  = [...ep.dates, ...projLabels];

  const realData = ep.sec.map((y, i) => ({ x: i, y, comp: ep.comp[i] }));
  const projData = [
    { x: n - 1, y: ep.sec[n - 1] },
    ...ep.proj.map((y, i) => ({ x: n + i, y })),
  ];

  const allY   = [...ep.sec, ...(ep.proj.length ? ep.proj : [])];
  const minY   = Math.min(...allY);
  const maxY   = Math.max(...allY);
  const pad    = (maxY - minY) * 0.12 || 1;

  return (
    <VictoryChart
      width={chartWidth}
      height={200}
      padding={{ top: 20, bottom: 50, left: 55, right: 20 }}
      // Y inversé : temps plus bas = meilleur = en haut
      domain={{ y: [maxY + pad, minY - pad] }}
    >
      <VictoryAxis
        tickFormat={(i: number) => allLabels[Math.round(i)] ?? ''}
        style={{ ...axisStyle, tickLabels: { fill: '#6a8ba5', fontSize: 9, angle: -30 } }}
      />
      <VictoryAxis
        dependentAxis
        tickFormat={(v: number) => secToStr(v)}
        style={axisStyle}
      />
      <VictoryLine
        data={realData}
        style={{ data: { stroke: col, strokeWidth: 2.5 } }}
        interpolation="catmullRom"
      />
      {ep.proj.length > 0 && (
        <VictoryLine
          data={projData}
          style={{ data: { stroke: col + '80', strokeWidth: 2, strokeDasharray: [8, 4] as any } }}
          interpolation="catmullRom"
        />
      )}
      <VictoryScatter
        data={realData}
        size={6}
        style={{
          data: {
            fill:        ({ datum }: any) =>
              datum.comp === '[INT]' ? '#ff6b6b' : datum.comp === '[NAT]' ? '#ffa748' : col,
            stroke:      '#0d2035',
            strokeWidth: 1.5,
          },
        }}
      />
    </VictoryChart>
  );
}

// ─── Graphique 3 : Fréquence d'activité (Bar) ────────────────────────────────
function FreqChart({ freq }: { freq: FreqRow[] }) {
  const { width } = useWindowDimensions();
  const chartWidth = width - 48;

  return (
    <VictoryChart
      width={chartWidth}
      height={160}
      padding={{ top: 20, bottom: 40, left: 45, right: 20 }}
      domainPadding={{ x: 15 }}
    >
      <VictoryAxis style={axisStyle} />
      <VictoryAxis dependentAxis style={axisStyle} />
      <VictoryBar
        data={freq.map((d, i) => ({
          x: String(d.Annee),
          y: d.nb,
          isLast: i === freq.length - 1,
        }))}
        style={{
          data: {
            fill:        ({ datum }: any) => datum.isLast ? 'rgba(0,201,167,0.6)' : 'rgba(29,111,164,0.45)',
            stroke:      ({ datum }: any) => datum.isLast ? '#00c9a7' : '#1d6fa4',
            strokeWidth: 1,
          },
        }}
        cornerRadius={{ top: 4 }}
      />
    </VictoryChart>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function AthleteCharts({ evo, evo_temps, freq }: Props) {
  const [bassin, setBassin]         = useState<'25m' | '50m'>('50m');
  const [selectedEp, setSelectedEp] = useState<string>('');

  const epKeys50 = Object.keys(evo_temps || {}).filter(k => k.includes('· 50m'));
  const epKeys25 = Object.keys(evo_temps || {}).filter(k => k.includes('· 25m'));
  const epKeys   = bassin === '50m' ? epKeys50 : epKeys25;

  useEffect(() => {
    if (epKeys50.length === 0 && epKeys25.length > 0) setBassin('25m');
  }, [evo_temps]);

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
          <EvoChart evo={evo!} />

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
              const ep  = evo_temps![k];
              const col = ep.color || NC[ep.nage] || '#1d6fa4';
              const label  = k.replace(` · ${bassin}`, '');
              const active = k === selectedEp;
              return (
                <Pressable
                  key={k}
                  onPress={() => setSelectedEp(k)}
                  style={[
                    styles.epTab,
                    {
                      borderColor:     active ? col : COLORS.border,
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
              <TempsChart ep={currentEp} />

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
          <FreqChart freq={freq!} />
          <View style={styles.statsRow}>
            <StatBox label="TOTAL"       value={freq!.reduce((s, d) => s + d.nb, 0)} />
            <StatBox label="RECORD"      value={Math.max(...freq!.map(d => d.nb))} color={COLORS.accent} />
            <StatBox label="CETTE ANNÉE" value={freq![freq!.length - 1]?.nb} color={COLORS.warning} />
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
  sectionTitle:  { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  sectionSub:    { color: COLORS.muted, fontSize: 11, marginTop: 1 },
  chevron:       { color: COLORS.muted, fontSize: 16 },
  sectionBody:   { padding: 12, gap: 10 },

  bassinRow: { flexDirection: 'row', gap: 6 },
  bassinBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  bassinBtnOn:     { backgroundColor: COLORS.accentDim, borderColor: COLORS.accentGlow },
  bassinBtnText:   { color: COLORS.muted, fontSize: 13, fontWeight: '800' },
  bassinBtnTextOn: { color: COLORS.accent },

  epRow:    { gap: 6, paddingRight: 4, paddingVertical: 2 },
  epTab:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  epTabText:{ fontSize: 12, fontWeight: '800' },

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

  bestCompBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 9,
    gap: 3,
  },
  bestCompLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '700' },
  bestCompVal:   { color: COLORS.textMid, fontSize: 12, fontWeight: '700' },

  legendRow:  { flexDirection: 'row', gap: 12, paddingLeft: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: COLORS.muted, fontSize: 10 },
});
