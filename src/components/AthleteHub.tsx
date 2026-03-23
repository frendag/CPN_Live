import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/constants';
import { useAthleteData } from '../hooks/useAthleteData';
import { normalizeText } from '../utils/helpers';
import { AthleteRankingResponse, AthleteSaisonRow, AthleteTopRow } from '../utils/types';
import { Avatar, Divider, KpiCard, SectionCard, SectionHeader } from './Atoms';

function fmt(v?: number | null) {
  if (typeof v !== 'number' || Number.isNaN(v)) return '—';
  return `${v > 0 ? '+' : ''}${String(v).replace('.', ',')}%`;
}
function toneForPct(v?: number | null) {
  if (typeof v !== 'number' || Number.isNaN(v)) return { color: COLORS.muted, bg: COLORS.neutralBg };
  if (v < 0) return { color: COLORS.success, bg: COLORS.successBg };
  if (v > 0) return { color: COLORS.danger, bg: COLORS.dangerBg };
  return { color: COLORS.muted, bg: COLORS.neutralBg };
}

// ─── Search chip ─────────────────────────────────────────────────────────────
function AthleteChip({ name, active, onPress }: { name: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{name}</Text>
    </Pressable>
  );
}

// ─── Collapsible section ─────────────────────────────────────────────────────
function CollapseSection({ title, sub, children, defaultOpen = true }: { title: string; sub?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const anim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;
  const toggle = () => {
    setOpen(v => {
      Animated.spring(anim, { toValue: v ? 0 : 1, useNativeDriver: false, tension: 80, friction: 14 }).start();
      return !v;
    });
  };
  return (
    <SectionCard>
      <Pressable onPress={toggle}>
        <SectionHeader title={title} sub={sub} right={
          <Animated.Text style={[styles.chevron, { transform: [{ rotate: anim.interpolate({ inputRange: [0,1], outputRange: ['0deg','90deg'] }) }] }]}>›</Animated.Text>
        } />
      </Pressable>
      <Animated.View style={{ opacity: anim, overflow: 'hidden' }}>
        {open ? children : null}
      </Animated.View>
    </SectionCard>
  );
}

// ─── Saison row ──────────────────────────────────────────────────────────────
function SaisonRow({ row, last }: { row: AthleteSaisonRow; last: boolean }) {
  const tone = toneForPct(row.Prog_pct);
  return (
    <View style={[styles.listRow, !last && styles.rowDivider]}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.rowTitle}>{row.Epreuve}</Text>
        <Text style={styles.rowSub}>{[row.Bassin, row.Temps_N, row.Pts_N ? `${row.Pts_N} pts` : null].filter(Boolean).join(' · ')}</Text>
        <Text style={styles.rowDetail}>{[row.Temps_Nm1 && row.Temps_Nm1 !== '-' ? `N-1 ${row.Temps_Nm1}` : null, row.Niveau ? `Niv. ${row.Niveau}` : null].filter(Boolean).join(' · ') || '—'}</Text>
      </View>
      <View style={styles.sideCol}>
        <View style={[styles.pctPill, { backgroundColor: tone.bg }]}>
          <Text style={[styles.pctText, { color: tone.color }]}>{fmt(row.Prog_pct)}</Text>
        </View>
        {row.Next_niveau && row.Next_niveau !== '—' ? <Text style={styles.sideHint}>→ {row.Next_niveau}</Text> : null}
      </View>
    </View>
  );
}

// ─── Best row ────────────────────────────────────────────────────────────────
function BestRow({ row, last }: { row: AthleteTopRow; last: boolean }) {
  return (
    <View style={[styles.listRow, !last && styles.rowDivider]}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.rowTitle}>{row.Epreuve}</Text>
        <Text style={styles.rowSub}>{[row.Bassin, row.Temps, row.Pts ? `${row.Pts} pts` : null].filter(Boolean).join(' · ')}</Text>
        <Text style={styles.rowDetail}>{[row.Date, row.Competition, row.Lieu].filter(Boolean).join(' · ') || '—'}</Text>
      </View>
    </View>
  );
}

// ─── Ranking section ─────────────────────────────────────────────────────────
function RankingBlock({ title, payload }: { title: string; payload: AthleteRankingResponse | null }) {
  if (!payload?.rows?.length) return null;
  return (
    <CollapseSection title={title} sub={`${payload.rows.length} épreuve${payload.rows.length > 1 ? 's' : ''}`}>
      <View style={styles.listBody}>
        {payload.rows.map((row, i) => (
          <View key={i} style={[styles.listRow, i > 0 && styles.rowDivider]}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.rowTitle}>{row.epreuve}</Text>
              <Text style={styles.rowSub}>{[row.bassin, row.temps, row.pts ? `${row.pts} pts` : null].filter(Boolean).join(' · ')}</Text>
              <Text style={styles.rowDetail}>Nat {row.rang_nat ?? '—'} · Rég {row.rang_reg ?? '—'} · Dép {row.rang_dept ?? '—'}</Text>
            </View>
            {row.ffn_url ? (
              <Pressable style={styles.linkBtn} onPress={() => Linking.openURL(row.ffn_url || '')}>
                <Text style={styles.linkBtnText}>FFN ↗</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>
    </CollapseSection>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AthleteHub() {
  const { athletes, selectedAthlete, athlete, ranking25, ranking50, loadingList, loadingDetail, loadingRankings, error, hasRankings, loadAthletes, setSelectedAthlete } = useAthleteData();
  const [search, setSearch] = useState('');
  const query = normalizeText(search);

  const filtered = useMemo(() => {
    const base = !query ? athletes : athletes.filter(n => normalizeText(n).includes(query));
    return base.slice(0, query ? 60 : 24);
  }, [athletes, query]);

  const hidden = useMemo(() => {
    if (!query) return Math.max(0, athletes.length - filtered.length);
    return Math.max(0, athletes.filter(n => normalizeText(n).includes(query)).length - filtered.length);
  }, [athletes, filtered.length, query]);

  const age = athlete?.annee_naissance && athlete?.annee_qualif
    ? athlete.annee_qualif - athlete.annee_naissance
    : athlete?.kpis?.annee_naissance && athlete?.annee_qualif
      ? athlete.annee_qualif - athlete.kpis.annee_naissance : null;

  const subtitleParts = [athlete?.kpis?.total_perfs ? `${athlete.kpis.total_perfs} perfs` : null, athlete?.kpis?.periode, athlete?.kpis?.specialite].filter(Boolean);

  return (
    <View style={styles.wrap}>
      {/* Search card */}
      <SectionCard>
        <SectionHeader title="Recherche athlète" sub={query ? `${filtered.length} résultat${filtered.length > 1 ? 's' : ''}` : `${athletes.length} athlètes`} right={
          <Pressable style={styles.refreshBtn} onPress={loadAthletes}>
            {loadingList ? <ActivityIndicator size="small" color={COLORS.accent} /> : <Text style={styles.refreshBtnText}>↻</Text>}
          </Pressable>
        } />
        <View style={styles.searchWrap}>
          <View style={styles.searchRow}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput value={search} onChangeText={setSearch} placeholder="Taper un nom…" placeholderTextColor={COLORS.subtle} style={styles.searchInput} />
          </View>
          {hidden > 0 ? <Text style={styles.searchHint}>{hidden} autres résultats</Text> : null}
          <View style={styles.chipsWrap}>
            {filtered.map(name => (
              <AthleteChip key={name} name={name} active={name === selectedAthlete} onPress={() => setSelectedAthlete(name)} />
            ))}
          </View>
        </View>
      </SectionCard>

      {/* Loading detail */}
      {loadingDetail && !athlete ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={COLORS.accent} />
          <Text style={styles.centerStateText}>Chargement de la fiche…</Text>
        </View>
      ) : null}

      {/* Empty */}
      {!selectedAthlete && !loadingList ? (
        <View style={styles.emptyState}>
          <Avatar name="CPN" size={64} />
          <Text style={styles.emptyTitle}>Sélectionnez un athlète</Text>
          <Text style={styles.emptySub}>Recherchez ou choisissez un nageur dans la liste ci-dessus.</Text>
        </View>
      ) : null}

      {/* Athlete profile */}
      {athlete ? (
        <>
          {/* Hero card */}
          <SectionCard>
            <LinearGradient colors={['#0c2540', '#071829']} style={styles.heroGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.heroInner}>
                <Avatar name={athlete.nom || selectedAthlete || ''} size={56} />
                <View style={{ flex: 1, gap: 5 }}>
                  <Text style={styles.heroName}>{athlete.nom || selectedAthlete}</Text>
                  <Text style={styles.heroSub}>{subtitleParts.join(' · ') || 'Fiche athlète'}</Text>
                  <View style={styles.heroPills}>
                    {athlete.kpis?.sexe ? <View style={styles.heroPill}><Text style={styles.heroPillText}>{athlete.kpis.sexe}</Text></View> : null}
                    {typeof age === 'number' ? <View style={styles.heroPill}><Text style={styles.heroPillText}>{age} ans</Text></View> : null}
                    {athlete.kpis?.annee_naissance ? <View style={styles.heroPill}><Text style={styles.heroPillText}>Né(e) {athlete.kpis.annee_naissance}</Text></View> : null}
                    {athlete.webconf_serie?.serie ? <View style={styles.accentPill}><Text style={styles.accentPillText}>WebConf S{athlete.webconf_serie.serie}</Text></View> : null}
                  </View>
                </View>
                {loadingDetail ? <ActivityIndicator color={COLORS.accent} /> : null}
              </View>
              {athlete.webconf_serie?.detail ? (
                <View style={styles.webconfBox}>
                  <Text style={styles.webconfLabel}>QUALIFICATION WEBCONF</Text>
                  <Text style={styles.webconfText}>{athlete.webconf_serie.detail}</Text>
                </View>
              ) : null}
            </LinearGradient>
          </SectionCard>

          {/* KPIs */}
          <View style={styles.kpiRow}>
            <KpiCard label="Perfs" value={athlete.kpis?.total_perfs ?? '—'} accent />
            <KpiCard label="Moy pts" value={athlete.kpis?.moy_pts ?? '—'} />
            <KpiCard label="Max pts" value={athlete.kpis?.max_pts ?? '—'} />
            <KpiCard label="Nages" value={athlete.kpis?.nb_nages ?? '—'} />
            <KpiCard label="[NAT]" value={athlete.kpis?.nb_nat ?? '—'} />
            <KpiCard label="[INT]" value={athlete.kpis?.nb_int ?? '—'} />
          </View>

          {/* Saison */}
          {(athlete.mp_saison || []).length > 0 ? (
            <CollapseSection title={`Saison ${athlete.annee_N || 'N'}`} sub={`${Math.min((athlete.mp_saison || []).length, 12)} meilleures perfs`}>
              <View style={styles.listBody}>
                {(athlete.mp_saison || []).slice(0, 12).map((row, i, arr) => (
                  <SaisonRow key={`${row.Epreuve}-${i}`} row={row} last={i === arr.length - 1} />
                ))}
              </View>
            </CollapseSection>
          ) : null}

          {/* Top perfs */}
          {(athlete.top5 || []).length > 0 ? (
            <CollapseSection title="Top performances" sub={`${Math.min((athlete.top5 || []).length, 10)} entrées`} defaultOpen={false}>
              <View style={styles.listBody}>
                {(athlete.top5 || []).slice(0, 10).map((row, i, arr) => (
                  <BestRow key={`${row.Epreuve}-${i}`} row={row} last={i === arr.length - 1} />
                ))}
              </View>
            </CollapseSection>
          ) : null}

          {/* Rankings */}
          {loadingRankings ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={COLORS.accent} />
              <Text style={styles.centerStateText}>Classements FFN…</Text>
            </View>
          ) : null}
          {hasRankings ? (
            <>
              <RankingBlock title="Classements FFN · 25m" payload={ranking25} />
              <RankingBlock title="Classements FFN · 50m" payload={ranking50} />
            </>
          ) : null}
        </>
      ) : null}

      {/* Error */}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>⚠ Erreur</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },

  chevron: { color: COLORS.muted, fontSize: 22, fontWeight: '300' },

  refreshBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.accentDim, alignItems: 'center', justifyContent: 'center' },
  refreshBtnText: { color: COLORS.accent, fontSize: 18, fontWeight: '700' },

  searchWrap: { padding: 14, gap: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 10 },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },
  searchHint: { color: COLORS.muted, fontSize: 11 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  chip: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  chipText: { color: COLORS.textMid, fontWeight: '700', fontSize: 12 },
  chipTextActive: { color: '#071829' },

  centerState: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  centerStateText: { color: COLORS.muted, fontSize: 13 },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  emptySub: { color: COLORS.muted, fontSize: 13, textAlign: 'center', lineHeight: 19 },

  // Hero
  heroGrad: { overflow: 'hidden' },
  heroInner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 },
  heroName: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  heroSub: { color: COLORS.muted, fontSize: 12 },
  heroPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  heroPill: { backgroundColor: 'rgba(168,194,216,0.1)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  heroPillText: { color: COLORS.textMid, fontSize: 11, fontWeight: '700' },
  accentPill: { backgroundColor: COLORS.accentDim, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  accentPillText: { color: COLORS.accent, fontSize: 11, fontWeight: '800' },
  webconfBox: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  webconfLabel: { color: COLORS.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  webconfText: { color: COLORS.textMid, fontSize: 12, lineHeight: 17 },

  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  // List
  listBody: { paddingHorizontal: 14, paddingBottom: 6 },
  listRow: { paddingVertical: 12, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  rowDivider: { borderTopWidth: 1, borderTopColor: COLORS.border },
  rowTitle: { color: COLORS.text, fontSize: 13, fontWeight: '800' },
  rowSub: { color: COLORS.textMid, fontSize: 12 },
  rowDetail: { color: COLORS.muted, fontSize: 11 },
  sideCol: { alignItems: 'flex-end', gap: 4, minWidth: 68 },
  pctPill: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  pctText: { fontSize: 11, fontWeight: '900' },
  sideHint: { color: COLORS.subtle, fontSize: 10, textAlign: 'right' },
  linkBtn: { backgroundColor: COLORS.accentDim, borderColor: COLORS.accentGlow, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  linkBtnText: { color: COLORS.accent, fontWeight: '800', fontSize: 11 },

  errorBox: { backgroundColor: COLORS.dangerBg, borderRadius: 14, borderWidth: 1, borderColor: COLORS.dangerBorder, padding: 14, gap: 5 },
  errorTitle: { color: COLORS.danger, fontSize: 14, fontWeight: '900' },
  errorText: { color: COLORS.danger, fontSize: 12 },
});
