import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS } from '../utils/constants';
import { useAthleteData } from '../hooks/useAthleteData';
import { normalizeText } from '../utils/helpers';
import { AthleteRankingResponse, AthleteSaisonRow, AthleteTopRow } from '../utils/types';
import { Avatar, SectionCard } from './Atoms';

function formatSignedPct(value?: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${String(value).replace('.', ',')}%`;
}

function toneForProgress(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return { color: COLORS.muted, bg: COLORS.neutralBg };
  if (value < 0) return { color: COLORS.success, bg: COLORS.successBg };
  if (value > 0) return { color: COLORS.danger, bg: COLORS.dangerBg };
  return { color: COLORS.muted, bg: COLORS.neutralBg };
}

function SmallKpi({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function AthleteChoice({ name, active, onPress }: { name: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.choiceChip, active && styles.choiceChipActive]} onPress={onPress}>
      <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>{name}</Text>
    </Pressable>
  );
}

function RankingSection({ title, payload }: { title: string; payload: AthleteRankingResponse | null }) {
  if (!payload?.rows?.length) return null;
  return (
    <SectionCard>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderTitle}>{title}</Text>
        <Text style={styles.sectionHeaderSub}>{payload.rows.length} épreuve{payload.rows.length > 1 ? 's' : ''}</Text>
      </View>
      <View style={styles.sectionBody}>
        {payload.rows.map((row, index) => (
          <View key={`${title}-${row.epreuve}-${row.bassin}-${index}`} style={[styles.listRow, index > 0 && styles.listRowDivider]}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.listTitle}>{row.epreuve}</Text>
              <Text style={styles.listSub}>{[row.bassin, row.temps || '—', row.pts ? `${row.pts} pts` : null].filter(Boolean).join(' · ')}</Text>
              <Text style={styles.rankLine}>Nat {row.rang_nat ?? '—'} · Rég {row.rang_reg ?? '—'} · Dép {row.rang_dept ?? '—'}</Text>
            </View>
            {row.ffn_url ? (
              <Pressable style={styles.linkBtn} onPress={() => Linking.openURL(row.ffn_url || '')}>
                <Text style={styles.linkBtnText}>FFN ↗</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

function SaisonSection({ annee, rows }: { annee?: number; rows: AthleteSaisonRow[] }) {
  if (!rows.length) return null;
  return (
    <SectionCard>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderTitle}>Saison {annee || 'N'}</Text>
        <Text style={styles.sectionHeaderSub}>{rows.length} meilleure{rows.length > 1 ? 's' : ''} perf{rows.length > 1 ? 's' : ''}</Text>
      </View>
      <View style={styles.sectionBody}>
        {rows.map((row, index) => {
          const tone = toneForProgress(row.Prog_pct);
          return (
            <View key={`${row.Epreuve}-${row.Bassin}-${index}`} style={[styles.listRow, index > 0 && styles.listRowDivider]}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.listTitle}>{row.Epreuve}</Text>
                <Text style={styles.listSub}>{[row.Bassin, row.Temps_N, row.Pts_N ? `${row.Pts_N} pts` : null].filter(Boolean).join(' · ')}</Text>
                <Text style={styles.detailLine}>{[row.Temps_Nm1 && row.Temps_Nm1 !== '-' ? `N-1 ${row.Temps_Nm1}` : null, row.Niveau ? `Niveau ${row.Niveau}` : null].filter(Boolean).join(' · ') || '—'}</Text>
              </View>
              <View style={styles.sideColumn}>
                <View style={[styles.progressPill, { backgroundColor: tone.bg }]}>
                  <Text style={[styles.progressPillText, { color: tone.color }]}>{formatSignedPct(row.Prog_pct)}</Text>
                </View>
                {row.Next_niveau && row.Next_niveau !== '—' ? <Text style={styles.sideHint}>→ {row.Next_niveau}</Text> : null}
              </View>
            </View>
          );
        })}
      </View>
    </SectionCard>
  );
}

function BestSection({ title, rows }: { title: string; rows: AthleteTopRow[] }) {
  if (!rows.length) return null;
  return (
    <SectionCard>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderTitle}>{title}</Text>
        <Text style={styles.sectionHeaderSub}>{rows.length} ligne{rows.length > 1 ? 's' : ''}</Text>
      </View>
      <View style={styles.sectionBody}>
        {rows.map((row, index) => (
          <View key={`${row.Epreuve}-${row.Bassin}-${index}`} style={[styles.listRow, index > 0 && styles.listRowDivider]}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.listTitle}>{row.Epreuve}</Text>
              <Text style={styles.listSub}>{[row.Bassin, row.Temps, row.Pts ? `${row.Pts} pts` : null].filter(Boolean).join(' · ')}</Text>
              <Text style={styles.detailLine}>{[row.Date, row.Competition, row.Lieu].filter(Boolean).join(' · ') || '—'}</Text>
            </View>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

export default function AthleteHub() {
  const {
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
    setSelectedAthlete,
  } = useAthleteData();

  const [search, setSearch] = useState('');
  const query = normalizeText(search);

  const filteredAthletes = useMemo(() => {
    const base = !query ? athletes : athletes.filter((name) => normalizeText(name).includes(query));
    return base.slice(0, query ? 60 : 24);
  }, [athletes, query]);

  const hiddenCount = useMemo(() => {
    if (!query) return Math.max(0, athletes.length - filteredAthletes.length);
    const total = athletes.filter((name) => normalizeText(name).includes(query)).length;
    return Math.max(0, total - filteredAthletes.length);
  }, [athletes, filteredAthletes.length, query]);

  const subtitleParts = [
    athlete?.kpis?.total_perfs ? `${athlete.kpis.total_perfs} performances` : null,
    athlete?.kpis?.periode || null,
    athlete?.kpis?.specialite || null,
  ].filter(Boolean);

  const age = athlete?.annee_naissance && athlete?.annee_qualif
    ? athlete.annee_qualif - athlete.annee_naissance
    : athlete?.kpis?.annee_naissance && athlete?.annee_qualif
      ? athlete.annee_qualif - athlete.kpis.annee_naissance
      : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.actionsRow}>
        <Pressable style={styles.primaryBtn} onPress={loadAthletes}>
          <Text style={styles.primaryBtnText}>{loadingList ? 'Chargement…' : '↻ Athlètes'}</Text>
        </Pressable>
      </View>

      <SectionCard>
        <View style={styles.selectorBody}>
          <Text style={styles.selectorTitle}>Recherche athlète</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Taper un nom…"
            placeholderTextColor={COLORS.subtle}
            style={styles.searchInput}
          />
          <Text style={styles.selectorHint}>
            {query ? `${filteredAthletes.length} résultat${filteredAthletes.length > 1 ? 's' : ''}` : `${athletes.length} athlètes disponibles`}
            {hiddenCount > 0 ? ` · ${hiddenCount} autres` : ''}
          </Text>
          <View style={styles.choiceWrap}>
            {filteredAthletes.map((name) => (
              <AthleteChoice key={name} name={name} active={name === selectedAthlete} onPress={() => setSelectedAthlete(name)} />
            ))}
          </View>
        </View>
      </SectionCard>

      {loadingDetail && !athlete ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={COLORS.primaryLight} />
          <Text style={styles.centerStateText}>Chargement de la fiche athlète…</Text>
        </View>
      ) : null}

      {!selectedAthlete && !loadingList ? (
        <View style={styles.emptyState}>
          <Avatar name="CPN" size={64} />
          <Text style={styles.emptyStateTitle}>Sélectionnez un athlète</Text>
          <Text style={styles.emptyStateSub}>La liste provient de l’API `/api/athletes`, puis la fiche détaillée de `/api/athlete`.</Text>
        </View>
      ) : null}

      {athlete ? (
        <>
          <SectionCard>
            <View style={styles.heroHeader}>
              <View style={styles.heroIdentity}>
                <Avatar name={athlete.nom || selectedAthlete} size={54} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.heroTitle}>{athlete.nom || selectedAthlete}</Text>
                  <Text style={styles.heroSub}>{subtitleParts.join(' · ') || 'Fiche athlète'}</Text>
                  <View style={styles.metaPillsWrap}>
                    {athlete.kpis?.sexe ? <Text style={styles.metaPill}>{athlete.kpis.sexe}</Text> : null}
                    {typeof age === 'number' ? <Text style={styles.metaPill}>{age} ans</Text> : null}
                    {athlete.kpis?.annee_naissance ? <Text style={styles.metaPill}>Né(e) {athlete.kpis.annee_naissance}</Text> : null}
                    {athlete.webconf_serie?.serie ? <Text style={[styles.metaPill, styles.webconfPill]}>WebConf série {athlete.webconf_serie.serie}</Text> : null}
                  </View>
                </View>
              </View>
              {loadingDetail ? <ActivityIndicator color={COLORS.primaryLight} /> : null}
            </View>
            {athlete.webconf_serie?.detail ? (
              <View style={styles.webconfBox}>
                <Text style={styles.webconfTitle}>Qualification WebConf</Text>
                <Text style={styles.webconfText}>{athlete.webconf_serie.detail}</Text>
              </View>
            ) : null}
          </SectionCard>

          <View style={styles.kpiRow}>
            <SmallKpi label="Perfs" value={athlete.kpis?.total_perfs ?? '—'} />
            <SmallKpi label="Moy pts" value={athlete.kpis?.moy_pts ?? '—'} />
            <SmallKpi label="Max pts" value={athlete.kpis?.max_pts ?? '—'} />
            <SmallKpi label="Nages" value={athlete.kpis?.nb_nages ?? '—'} />
            <SmallKpi label="[NAT]" value={athlete.kpis?.nb_nat ?? '—'} />
            <SmallKpi label="[INT]" value={athlete.kpis?.nb_int ?? '—'} />
          </View>

          <SaisonSection annee={athlete.annee_N} rows={(athlete.mp_saison || []).slice(0, 12)} />
          <BestSection title="Top performances" rows={(athlete.top5 || []).slice(0, 10)} />

          {loadingRankings ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={COLORS.primaryLight} />
              <Text style={styles.centerStateText}>Recherche des classements FFN…</Text>
            </View>
          ) : null}

          {hasRankings ? (
            <>
              <RankingSection title="Classements FFN · 25m" payload={ranking25} />
              <RankingSection title="Classements FFN · 50m" payload={ranking50} />
            </>
          ) : null}
        </>
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  actionsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  primaryBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryBtnText: { color: '#fff', fontWeight: '900' },
  selectorBody: { padding: 14, gap: 10 },
  selectorTitle: { color: COLORS.text, fontSize: 16, fontWeight: '900' },
  selectorHint: { color: COLORS.muted, fontSize: 12 },
  searchInput: {
    backgroundColor: COLORS.neutralBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: COLORS.text,
    fontSize: 14,
  },
  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceChip: {
    backgroundColor: COLORS.neutralBg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  choiceChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primaryLight },
  choiceChipText: { color: COLORS.text, fontWeight: '700', fontSize: 12 },
  choiceChipTextActive: { color: '#fff' },
  heroHeader: { padding: 14, gap: 12 },
  heroIdentity: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  heroTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  heroSub: { color: COLORS.muted, fontSize: 13, lineHeight: 18 },
  metaPillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  metaPill: {
    backgroundColor: COLORS.neutralBg,
    color: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 11,
    fontWeight: '800',
  },
  webconfPill: { backgroundColor: '#eef6ff', color: COLORS.primaryLight },
  webconfBox: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fbfdff',
    gap: 4,
  },
  webconfTitle: { color: COLORS.primarySoft, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  webconfText: { color: COLORS.muted, fontSize: 13, lineHeight: 18 },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: {
    flexGrow: 1,
    minWidth: 92,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  kpiValue: { color: COLORS.primaryLight, fontSize: 18, fontWeight: '900' },
  kpiLabel: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  sectionHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fbfdff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  sectionHeaderTitle: { color: COLORS.text, fontSize: 15, fontWeight: '900' },
  sectionHeaderSub: { color: COLORS.muted, fontSize: 12 },
  sectionBody: { paddingHorizontal: 14, paddingVertical: 8 },
  listRow: { paddingVertical: 10, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  listRowDivider: { borderTopWidth: 1, borderTopColor: COLORS.border },
  listTitle: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  listSub: { color: COLORS.primarySoft, fontSize: 12, lineHeight: 18 },
  detailLine: { color: COLORS.muted, fontSize: 12, lineHeight: 17 },
  rankLine: { color: COLORS.muted, fontSize: 12, lineHeight: 17 },
  sideColumn: { alignItems: 'flex-end', gap: 6, minWidth: 76 },
  progressPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  progressPillText: { fontSize: 11, fontWeight: '900' },
  sideHint: { color: COLORS.subtle, fontSize: 11, textAlign: 'right' },
  linkBtn: {
    backgroundColor: COLORS.neutralBg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  linkBtnText: { color: COLORS.primaryLight, fontWeight: '800', fontSize: 12 },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 22, gap: 8 },
  centerStateText: { color: COLORS.muted, fontSize: 13 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36, gap: 12 },
  emptyStateTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  emptyStateSub: { color: COLORS.muted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  errorBox: {
    backgroundColor: COLORS.dangerBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f5c2c7',
    padding: 14,
    gap: 6,
  },
  errorTitle: { color: COLORS.danger, fontSize: 15, fontWeight: '900' },
  errorText: { color: COLORS.danger, fontSize: 13, lineHeight: 18 },
});
