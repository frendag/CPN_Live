import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, NAGE_FILTERS, STATUS_LABELS, TYPE_FILTERS } from '../utils/constants';
import { Avatar, LiveBadge } from '../components/Atoms';
import AthleteHub from '../components/AthleteHub';
import VueProgramme from '../components/VueProgramme';
import VueResultats from '../components/VueResultats';
import { useCompetV2 } from '../hooks/useCompetV2';
import {
  filterProgrammeReunions,
  filterResultRows,
  formatClock,
  formatCompetitionDates,
  getStatusTone,
  isCompetitionLive,
  normalizeText,
} from '../utils/helpers';
import { AppSection, CompetitionStatus, CompetitionTab, NageFilter, TypeFilter } from '../utils/types';

const STATUS_ORDER: CompetitionStatus[] = ['en_cours', 'a_venir', 'passee'];

export default function HomeScreen() {
  const {
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
  } = useCompetV2();

  const [section, setSection] = useState<AppSection>('competition');
  const [tab, setTab] = useState<CompetitionTab>('programme');
  const [searchCompet, setSearchCompet] = useState('');
  const [searchAthlete, setSearchAthlete] = useState('');
  const [nageFilter, setNageFilter] = useState<NageFilter>('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('');
  const [reunionFilter, setReunionFilter] = useState<number | ''>('');
  const [autoLive, setAutoLive] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  const activeMeta = resultats?.competition || programme?.competition || null;
  const activeCid = selectedCompetition?.cid || activeMeta?.cid || '';

  useEffect(() => {
    setReunionFilter('');
    setSearchAthlete('');
    setNageFilter('');
    setTypeFilter('');
    setTab('programme');
  }, [selectedCompetitionId]);

  useEffect(() => {
    setReunionFilter('');
  }, [tab]);

  useEffect(() => {
    if (!autoLive || !resultats?.competition?.next_refresh_sec || !selectedCompetitionId || !isCompetitionLive(resultats.competition)) {
      setCountdown(resultats?.competition?.next_refresh_sec ?? null);
      return;
    }
    setCountdown(resultats.competition.next_refresh_sec);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          refreshResultats();
          return resultats.competition.next_refresh_sec ?? null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoLive, resultats, refreshResultats, selectedCompetitionId]);

  const filteredCompetitions = useMemo(() => {
    const q = normalizeText(searchCompet);
    return competitions.filter((item) => {
      if (!q) return true;
      return [item.nom, item.lieu, item.cid, item.label_sidebar].some((value) => normalizeText(value).includes(q));
    });
  }, [competitions, searchCompet]);

  const displayedReunions = tab === 'programme' ? (programme?.reunions || []) : (resultats?.reunions || []);

  const programmeReunions = useMemo(
    () => filterProgrammeReunions(programme?.reunions || [], reunionFilter, nageFilter, typeFilter, searchAthlete),
    [programme, reunionFilter, nageFilter, typeFilter, searchAthlete],
  );

  const resultRows = useMemo(
    () => filterResultRows(resultats?.reunions || [], reunionFilter, nageFilter, typeFilter, searchAthlete),
    [resultats, reunionFilter, nageFilter, typeFilter, searchAthlete],
  );

  const resultAthletesCount = useMemo(() => new Set(resultRows.map((row) => `${row.athlete_nom}__${row.annee_naiss || ''}`)).size, [resultRows]);

  const competitionCounts = useMemo(() => ({
    programme: programme?.reunions.reduce((sum, reunion) => sum + reunion.lignes.length, 0) || 0,
    resultats: resultats?.reunions.reduce((sum, reunion) => sum + reunion.lignes.length, 0) || 0,
  }), [programme, resultats]);

  const openLiveffn = () => {
    if (!activeCid) return;
    Linking.openURL(`https://www.liveffn.com/cgi-bin/resultats.php?competition=${activeCid}&langue=fra`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.topbar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>🏊 CPN Compét Live</Text>
          <Text style={styles.topSubtitle}>Compétition v2 + fiche Athlète mobile</Text>
        </View>
        {section === 'competition' ? (
          <Pressable onPress={loadCompetitions} style={styles.reloadBtn}>
            <Text style={styles.reloadBtnText}>↻ Liste</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.sectionTabsWrap}>
        <Pressable style={[styles.sectionTab, section === 'competition' && styles.sectionTabActive]} onPress={() => setSection('competition')}>
          <Text style={[styles.sectionTabText, section === 'competition' && styles.sectionTabTextActive]}>🏁 Competition</Text>
        </Pressable>
        <Pressable style={[styles.sectionTab, section === 'athlete' && styles.sectionTabActive]} onPress={() => setSection('athlete')}>
          <Text style={[styles.sectionTabText, section === 'athlete' && styles.sectionTabTextActive]}>👤 Athlète</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {section === 'competition' ? (
          <>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Compétitions</Text>
              <TextInput
                value={searchCompet}
                onChangeText={setSearchCompet}
                placeholder="Rechercher une compétition, un lieu ou un CID…"
                placeholderTextColor={COLORS.subtle}
                style={styles.searchInput}
              />

              {loadingList && competitions.length === 0 ? (
                <View style={styles.centerState}>
                  <ActivityIndicator color={COLORS.primaryLight} />
                  <Text style={styles.centerStateText}>Chargement des compétitions…</Text>
                </View>
              ) : null}

              {STATUS_ORDER.map((status) => {
                const items = filteredCompetitions.filter((item) => item.status === status);
                if (!items.length) return null;
                return (
                  <View key={status} style={styles.groupWrap}>
                    <Text style={styles.groupTitle}>{STATUS_LABELS[status]}</Text>
                    <View style={styles.competitionList}>
                      {items.map((item) => {
                        const selected = item.id === selectedCompetitionId;
                        const tone = getStatusTone(item.status);
                        return (
                          <Pressable
                            key={item.id}
                            style={[styles.competitionCard, selected && styles.competitionCardActive]}
                            onPress={() => loadCompetition(item.id, false)}
                          >
                            <View style={styles.competitionCardTop}>
                              <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
                                <Text style={[styles.statusPillText, { color: tone.text }]}>{STATUS_LABELS[item.status]}</Text>
                              </View>
                              <Text style={styles.cidText}>#{item.cid}</Text>
                            </View>
                            <Text style={styles.competitionName} numberOfLines={2}>{item.nom}</Text>
                            <Text style={styles.competitionMeta}>{[item.lieu, item.bassin, formatCompetitionDates(item)].filter(Boolean).join(' · ')}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>

            {selectedCompetition && activeMeta ? (
              <View style={styles.sectionBlock}>
                <View style={styles.detailHeader}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={styles.detailTitle}>{activeMeta.nom}</Text>
                    <Text style={styles.detailMeta}>{[activeMeta.lieu, activeMeta.bassin, formatCompetitionDates(activeMeta)].filter(Boolean).join(' · ')}</Text>
                    <Text style={styles.detailSub}>CID liveffn : {activeMeta.cid}</Text>
                  </View>
                  {isCompetitionLive(activeMeta) ? <LiveBadge countdown={countdown} /> : null}
                </View>

                <View style={styles.kpiRow}>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiValue}>{programme?.reunions.length || 0}</Text>
                    <Text style={styles.kpiLabel}>Réunions</Text>
                  </View>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiValue}>{competitionCounts.programme}</Text>
                    <Text style={styles.kpiLabel}>Programme</Text>
                  </View>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiValue}>{competitionCounts.resultats}</Text>
                    <Text style={styles.kpiLabel}>Résultats</Text>
                  </View>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiValue}>{resultAthletesCount}</Text>
                    <Text style={styles.kpiLabel}>Athlètes</Text>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <Pressable style={styles.primaryBtn} onPress={() => loadCompetition(selectedCompetition.id)}>
                    <Text style={styles.primaryBtnText}>{loadingDetail ? 'Chargement…' : '⟳ Recharger'}</Text>
                  </Pressable>
                  <Pressable style={[styles.secondaryBtn, autoLive && styles.secondaryBtnActive]} onPress={() => setAutoLive((prev) => !prev)}>
                    <Text style={[styles.secondaryBtnText, autoLive && styles.secondaryBtnTextActive]}>{autoLive ? '⚡ Auto ON' : '⚡ Auto OFF'}</Text>
                  </Pressable>
                  <Pressable style={styles.secondaryBtn} onPress={openLiveffn}>
                    <Text style={styles.secondaryBtnText}>liveffn ↗</Text>
                  </Pressable>
                </View>

                <View style={styles.tabRow}>
                  {[
                    { key: 'programme' as const, label: '📋 Programme', count: competitionCounts.programme },
                    { key: 'resultats' as const, label: '⚡ Résultats', count: competitionCounts.resultats },
                  ].map((item) => (
                    <Pressable key={item.key} style={[styles.tabBtn, tab === item.key && styles.tabBtnActive]} onPress={() => setTab(item.key)}>
                      <Text style={[styles.tabBtnText, tab === item.key && styles.tabBtnTextActive]}>{item.label}</Text>
                      <View style={[styles.tabCount, tab === item.key && styles.tabCountActive]}>
                        <Text style={[styles.tabCountText, tab === item.key && styles.tabCountTextActive]}>{item.count}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.filtersCard}>
                  <TextInput
                    value={searchAthlete}
                    onChangeText={setSearchAthlete}
                    placeholder="🔍 Rechercher un nageur…"
                    placeholderTextColor={COLORS.subtle}
                    style={styles.filterInput}
                  />

                  <Text style={styles.filterGroupTitle}>Réunion</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                    <FilterChip label="Toutes" active={reunionFilter === ''} onPress={() => setReunionFilter('')} />
                    {displayedReunions.map((reunion) => (
                      <FilterChip
                        key={`reunion-chip-${reunion.reunion_num}`}
                        label={`R${reunion.reunion_num}${reunion.reunion_moment ? ` · ${reunion.reunion_moment}` : ''}`}
                        active={reunionFilter === reunion.reunion_num}
                        onPress={() => setReunionFilter(reunion.reunion_num)}
                      />
                    ))}
                  </ScrollView>

                  <Text style={styles.filterGroupTitle}>Nage</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                    {NAGE_FILTERS.map((item) => (
                      <FilterChip key={item.key || 'all-nage'} label={item.label} active={nageFilter === item.key} onPress={() => setNageFilter(item.key)} />
                    ))}
                  </ScrollView>

                  <Text style={styles.filterGroupTitle}>Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                    {TYPE_FILTERS.map((item) => (
                      <FilterChip key={item.key || 'all-type'} label={item.label} active={typeFilter === item.key} onPress={() => setTypeFilter(item.key)} />
                    ))}
                  </ScrollView>
                </View>

                {loadingDetail && !programme && !resultats ? (
                  <View style={styles.centerState}>
                    <ActivityIndicator color={COLORS.primaryLight} />
                    <Text style={styles.centerStateText}>Chargement de la compétition…</Text>
                  </View>
                ) : null}

                {tab === 'programme' ? (
                  <VueProgramme reunions={programmeReunions} reunionFilter={reunionFilter} />
                ) : (
                  <VueResultats rows={resultRows} reunionsCount={displayedReunions.length} />
                )}

                {lastRefresh ? <Text style={styles.refreshText}>Dernière mise à jour : {formatClock(lastRefresh)}</Text> : null}
              </View>
            ) : (
              !loadingList && !error ? (
                <View style={styles.emptyState}>
                  <Avatar name="CPN" size={64} />
                  <Text style={styles.emptyStateTitle}>Sélectionnez une compétition</Text>
                  <Text style={styles.emptyStateSub}>L’app utilise désormais les routes `/api/compet_v2/list`, `/programme` et `/resultats` du backend.</Text>
                </View>
              ) : null
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Erreur</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </>
        ) : (
          <AthleteHub />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.filterChip, active && styles.filterChipActive]} onPress={onPress}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  topbar: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  topTitle: { color: '#fff', fontSize: 19, fontWeight: '900' },
  topSubtitle: { color: 'rgba(255,255,255,.72)', fontSize: 12, marginTop: 4 },
  reloadBtn: {
    backgroundColor: 'rgba(255,255,255,.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.22)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reloadBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  sectionTabsWrap: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 12,
    backgroundColor: COLORS.primary,
  },
  sectionTab: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.18)',
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
  },
  sectionTabActive: { backgroundColor: '#fff', borderColor: '#fff' },
  sectionTabText: { color: '#dbe7f6', fontWeight: '900', fontSize: 14 },
  sectionTabTextActive: { color: COLORS.primary },
  content: { padding: 14, gap: 16, backgroundColor: COLORS.bg },
  sectionBlock: { gap: 12 },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  searchInput: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 14,
  },
  groupWrap: { gap: 10 },
  groupTitle: { color: COLORS.muted, fontWeight: '800', fontSize: 13, textTransform: 'uppercase' },
  competitionList: { gap: 10 },
  competitionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 8,
  },
  competitionCardActive: { borderColor: COLORS.primaryLight, borderWidth: 2 },
  competitionCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  statusPillText: { fontSize: 11, fontWeight: '800' },
  cidText: { color: COLORS.subtle, fontSize: 12, fontWeight: '700' },
  competitionName: { color: COLORS.text, fontSize: 15, fontWeight: '900' },
  competitionMeta: { color: COLORS.muted, fontSize: 12, lineHeight: 18 },
  detailHeader: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  detailTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  detailMeta: { color: COLORS.muted, fontSize: 13, lineHeight: 19 },
  detailSub: { color: COLORS.subtle, fontSize: 12 },
  kpiRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  kpiCard: {
    flexGrow: 1,
    minWidth: 72,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  kpiValue: { color: COLORS.primaryLight, fontSize: 20, fontWeight: '900' },
  kpiLabel: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  primaryBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryBtnText: { color: '#fff', fontWeight: '900' },
  secondaryBtn: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryBtnActive: { borderColor: COLORS.primaryLight, backgroundColor: '#eff6ff' },
  secondaryBtnText: { color: COLORS.text, fontWeight: '800' },
  secondaryBtnTextActive: { color: COLORS.primaryLight },
  tabRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tabBtnActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primaryLight },
  tabBtnText: { color: COLORS.text, fontWeight: '900' },
  tabBtnTextActive: { color: '#fff' },
  tabCount: { backgroundColor: '#eff6ff', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,.18)' },
  tabCountText: { color: COLORS.primaryLight, fontWeight: '800', fontSize: 11 },
  tabCountTextActive: { color: '#fff' },
  filtersCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 10,
  },
  filterInput: {
    backgroundColor: COLORS.neutralBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: COLORS.text,
    fontSize: 14,
  },
  filterGroupTitle: { color: COLORS.muted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  chipsRow: { gap: 8, paddingRight: 14 },
  filterChip: {
    backgroundColor: COLORS.neutralBg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primaryLight },
  filterChipText: { color: COLORS.text, fontWeight: '700', fontSize: 12 },
  filterChipTextActive: { color: '#fff' },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 22, gap: 8 },
  centerStateText: { color: COLORS.muted, fontSize: 13 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyStateTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  emptyStateSub: { color: COLORS.muted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  refreshText: { color: COLORS.subtle, fontSize: 12, textAlign: 'center', paddingBottom: 10 },
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
