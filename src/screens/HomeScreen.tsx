import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Linking, Pressable,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, NAGE_FILTERS, STATUS_LABELS, TYPE_FILTERS } from '../utils/constants';
import { Avatar, KpiCard, LiveBadge, SectionCard, SectionHeader, StatusPill } from '../components/Atoms';
import AthleteHub from '../components/AthleteHub';
import VueProgramme from '../components/VueProgramme';
import VueResultats from '../components/VueResultats';
import { useCompetV2 } from '../hooks/useCompetV2';
import {
  filterProgrammeReunions, filterResultRows, formatClock,
  formatCompetitionDates, getStatusTone, isCompetitionLive, normalizeText,
} from '../utils/helpers';
import { AppSection, CompetitionStatus, CompetitionTab, NageFilter, TypeFilter } from '../utils/types';

const STATUS_ORDER: CompetitionStatus[] = ['en_cours', 'a_venir', 'passee'];

// ─── Filter chip ─────────────────────────────────────────────────────────────
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

// ─── Collapsible group ───────────────────────────────────────────────────────
function CollapsGroup({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <View style={styles.groupWrap}>
      <Pressable style={styles.groupHeader} onPress={() => setOpen(v => !v)}>
        <View style={styles.groupDot} />
        <Text style={styles.groupTitle}>{title}</Text>
        <View style={styles.groupCount}><Text style={styles.groupCountText}>{count}</Text></View>
        <Text style={styles.groupChevron}>{open ? '▾' : '▸'}</Text>
      </Pressable>
      {open ? <View style={styles.groupBody}>{children}</View> : null}
    </View>
  );
}

// ─── Competition card ────────────────────────────────────────────────────────
function CompetCard({ item, selected, onPress }: { item: any; selected: boolean; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start();
    onPress();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable onPress={handlePress} style={[styles.competCard, selected && styles.competCardActive]}>
        {selected && <View style={styles.competActiveBar} />}
        <View style={styles.competCardTop}>
          <StatusPill status={item.status} />
          <Text style={styles.cidText}>#{item.cid}</Text>
        </View>
        <Text style={styles.competName} numberOfLines={2}>{item.nom}</Text>
        <Text style={styles.competMeta}>{[item.lieu, item.bassin, formatCompetitionDates(item)].filter(Boolean).join(' · ')}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Tab button ──────────────────────────────────────────────────────────────
function TabBtn({ label, active, count, onPress }: { label: string; active: boolean; count: number; onPress: () => void }) {
  return (
    <Pressable style={[styles.tabBtn, active && styles.tabBtnActive]} onPress={onPress}>
      <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{label}</Text>
      <View style={[styles.tabCount, active && styles.tabCountActive]}>
        <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>{count}</Text>
      </View>
    </Pressable>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { competitions, selectedCompetition, selectedCompetitionId, programme, resultats, loadingList, loadingDetail, error, lastRefresh, loadCompetitions, loadCompetition, refreshResultats } = useCompetV2();
  const [section, setSection] = useState<AppSection>('competition');
  const [tab, setTab]         = useState<CompetitionTab>('programme');
  const [searchCompet, setSearchCompet] = useState('');
  const [searchAthlete, setSearchAthlete] = useState('');
  const [nageFilter, setNageFilter]       = useState<NageFilter>('');
  const [typeFilter, setTypeFilter]       = useState<TypeFilter>('');
  const [reunionFilter, setReunionFilter] = useState<number | ''>('');
  const [autoLive, setAutoLive]           = useState(true);
  const [countdown, setCountdown]         = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen]     = useState(false);

  const activeMeta = resultats?.competition || programme?.competition || null;
  const activeCid  = selectedCompetition?.cid || activeMeta?.cid || '';

  useEffect(() => { setReunionFilter(''); setSearchAthlete(''); setNageFilter(''); setTypeFilter(''); setTab('programme'); }, [selectedCompetitionId]);
  useEffect(() => { setReunionFilter(''); }, [tab]);
  useEffect(() => {
    if (!autoLive || !resultats?.competition?.next_refresh_sec || !selectedCompetitionId || !isCompetitionLive(resultats.competition)) {
      setCountdown(resultats?.competition?.next_refresh_sec ?? null); return;
    }
    setCountdown(resultats.competition.next_refresh_sec);
    const iv = setInterval(() => setCountdown(prev => {
      if (prev === null) return null;
      if (prev <= 1) { refreshResultats(); return resultats.competition.next_refresh_sec ?? null; }
      return prev - 1;
    }), 1000);
    return () => clearInterval(iv);
  }, [autoLive, resultats, refreshResultats, selectedCompetitionId]);

  const filteredCompetitions = useMemo(() => {
    const q = normalizeText(searchCompet);
    return competitions.filter(c => !q || [c.nom, c.lieu, c.cid, c.label_sidebar].some(v => normalizeText(v).includes(q)));
  }, [competitions, searchCompet]);

  const displayedReunions   = tab === 'programme' ? (programme?.reunions || []) : (resultats?.reunions || []);
  const programmeReunions   = useMemo(() => filterProgrammeReunions(programme?.reunions || [], reunionFilter, nageFilter, typeFilter, searchAthlete), [programme, reunionFilter, nageFilter, typeFilter, searchAthlete]);
  const resultRows          = useMemo(() => filterResultRows(resultats?.reunions || [], reunionFilter, nageFilter, typeFilter, searchAthlete), [resultats, reunionFilter, nageFilter, typeFilter, searchAthlete]);
  const resultAthletesCount = useMemo(() => new Set(resultRows.map(r => `${r.athlete_nom}__${r.annee_naiss || ''}`)).size, [resultRows]);
  const competitionCounts   = useMemo(() => ({ programme: programme?.reunions.reduce((s, r) => s + r.lignes.length, 0) || 0, resultats: resultats?.reunions.reduce((s, r) => s + r.lignes.length, 0) || 0 }), [programme, resultats]);

  const activeFiltersCount = [nageFilter, typeFilter, reunionFilter !== '' ? 1 : null, searchAthlete].filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* ─── Top bar ─── */}
      <LinearGradient colors={['#040f18', '#071829']} style={styles.topbar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <View style={styles.topLeft}>
          <Text style={styles.topLogo}>🏊</Text>
          <View>
            <Text style={styles.topTitle}>CPN Live</Text>
            <Text style={styles.topSub}>Cergy Pontoise Natation</Text>
          </View>
        </View>
        {section === 'competition' ? (
          <Pressable style={styles.reloadBtn} onPress={loadCompetitions}>
            {loadingList ? <ActivityIndicator size="small" color={COLORS.accent} /> : <Text style={styles.reloadBtnText}>↻</Text>}
          </Pressable>
        ) : null}
      </LinearGradient>

      {/* ─── Section tabs ─── */}
      <LinearGradient colors={['#071829', '#060e18']} style={styles.navWrap}>
        {(['competition', 'athlete'] as AppSection[]).map(s => (
          <Pressable key={s} style={[styles.navTab, section === s && styles.navTabActive]} onPress={() => setSection(s)}>
            <Text style={[styles.navTabText, section === s && styles.navTabTextActive]}>
              {s === 'competition' ? '🏁 Compétition' : '👤 Athlète'}
            </Text>
            {section === s && <View style={styles.navTabIndicator} />}
          </Pressable>
        ))}
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {section === 'competition' ? (
          <>
            {/* Competition list */}
            <SectionCard>
              <SectionHeader title="Compétitions" sub={`${competitions.length} au total`} right={null} />
              <View style={styles.searchRow}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput value={searchCompet} onChangeText={setSearchCompet} placeholder="Nom, lieu, CID…" placeholderTextColor={COLORS.subtle} style={styles.searchInput} />
              </View>

              {loadingList && competitions.length === 0 ? (
                <View style={styles.centerState}><ActivityIndicator color={COLORS.accent} /><Text style={styles.centerStateText}>Chargement…</Text></View>
              ) : null}

              <View style={styles.listPad}>
                {STATUS_ORDER.map(status => {
                  const items = filteredCompetitions.filter(c => c.status === status);
                  if (!items.length) return null;
                  return (
                    <CollapsGroup key={status} title={STATUS_LABELS[status]} count={items.length}>
                      {items.map(item => (
                        <CompetCard key={item.id} item={item} selected={item.id === selectedCompetitionId} onPress={() => loadCompetition(item.id, false)} />
                      ))}
                    </CollapsGroup>
                  );
                })}
              </View>
            </SectionCard>

            {/* Selected competition detail */}
            {selectedCompetition && activeMeta ? (
              <>
                {/* Detail header */}
                <SectionCard>
                  <LinearGradient colors={['#0c2540', '#071829']} style={styles.detailGrad}>
                    <View style={styles.detailTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailTitle}>{activeMeta.nom}</Text>
                        <Text style={styles.detailMeta}>{[activeMeta.lieu, activeMeta.bassin, formatCompetitionDates(activeMeta)].filter(Boolean).join(' · ')}</Text>
                        <Text style={styles.detailCid}>CID liveffn : {activeMeta.cid}</Text>
                      </View>
                      {isCompetitionLive(activeMeta) ? <LiveBadge countdown={countdown} /> : null}
                    </View>

                    {/* KPIs */}
                    <View style={styles.kpiRow}>
                      <KpiCard label="Réunions" value={programme?.reunions.length || 0} />
                      <KpiCard label="Programme" value={competitionCounts.programme} />
                      <KpiCard label="Résultats" value={competitionCounts.resultats} accent={competitionCounts.resultats > 0} />
                      <KpiCard label="Athlètes" value={resultAthletesCount} />
                    </View>

                    {/* Actions */}
                    <View style={styles.actionsRow}>
                      <Pressable style={styles.primaryBtn} onPress={() => loadCompetition(selectedCompetition.id)}>
                        <Text style={styles.primaryBtnText}>{loadingDetail ? '…' : '⟳ Recharger'}</Text>
                      </Pressable>
                      <Pressable style={[styles.secondaryBtn, autoLive && styles.secondaryBtnOn]} onPress={() => setAutoLive(v => !v)}>
                        <Text style={[styles.secondaryBtnText, autoLive && styles.secondaryBtnOnText]}>⚡ Auto {autoLive ? 'ON' : 'OFF'}</Text>
                      </Pressable>
                      <Pressable style={styles.secondaryBtn} onPress={() => activeCid && Linking.openURL(`https://www.liveffn.com/cgi-bin/resultats.php?competition=${activeCid}&langue=fra`)}>
                        <Text style={styles.secondaryBtnText}>liveffn ↗</Text>
                      </Pressable>
                    </View>
                  </LinearGradient>
                </SectionCard>

                {/* Tab row */}
                <View style={styles.tabRow}>
                  <TabBtn label="📋 Programme" active={tab === 'programme'} count={competitionCounts.programme} onPress={() => setTab('programme')} />
                  <TabBtn label="⚡ Résultats" active={tab === 'resultats'} count={competitionCounts.resultats} onPress={() => setTab('resultats')} />
                </View>

                {/* Filters accordion */}
                <SectionCard>
                  <Pressable onPress={() => setFiltersOpen(v => !v)} style={styles.filtersToggle}>
                    <Text style={styles.filtersToggleText}>🔧 Filtres</Text>
                    {activeFiltersCount > 0 ? (
                      <View style={styles.filtersBadge}><Text style={styles.filtersBadgeText}>{activeFiltersCount}</Text></View>
                    ) : null}
                    <Text style={styles.groupChevron}>{filtersOpen ? '▾' : '▸'}</Text>
                  </Pressable>

                  {filtersOpen ? (
                    <View style={styles.filtersBody}>
                      <View style={styles.filterSearchRow}>
                        <Text style={styles.filterIcon}>🏊</Text>
                        <TextInput value={searchAthlete} onChangeText={setSearchAthlete} placeholder="Rechercher un nageur…" placeholderTextColor={COLORS.subtle} style={styles.filterSearchInput} />
                      </View>

                      <Text style={styles.filterGroupLabel}>RÉUNION</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                        <Chip label="Toutes" active={reunionFilter === ''} onPress={() => setReunionFilter('')} />
                        {displayedReunions.map(r => (
                          <Chip key={`r-${r.reunion_num}`} label={`R${r.reunion_num}${r.reunion_moment ? ` · ${r.reunion_moment}` : ''}`} active={reunionFilter === r.reunion_num} onPress={() => setReunionFilter(r.reunion_num)} />
                        ))}
                      </ScrollView>

                      <Text style={styles.filterGroupLabel}>NAGE</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                        {NAGE_FILTERS.map(f => (
                          <Chip key={f.key || 'all-n'} label={f.label} active={nageFilter === f.key} onPress={() => setNageFilter(f.key)} />
                        ))}
                      </ScrollView>

                      <Text style={styles.filterGroupLabel}>TYPE</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                        {TYPE_FILTERS.map(f => (
                          <Chip key={f.key || 'all-t'} label={f.label} active={typeFilter === f.key} onPress={() => setTypeFilter(f.key)} />
                        ))}
                      </ScrollView>

                      {activeFiltersCount > 0 ? (
                        <Pressable style={styles.resetBtn} onPress={() => { setReunionFilter(''); setNageFilter(''); setTypeFilter(''); setSearchAthlete(''); }}>
                          <Text style={styles.resetBtnText}>✕ Réinitialiser les filtres</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : null}
                </SectionCard>

                {/* Content loading */}
                {loadingDetail && !programme && !resultats ? (
                  <View style={styles.centerState}><ActivityIndicator color={COLORS.accent} /><Text style={styles.centerStateText}>Chargement…</Text></View>
                ) : null}

                {tab === 'programme' ? (
                  <VueProgramme reunions={programmeReunions} reunionFilter={reunionFilter} />
                ) : (
                  <VueResultats rows={resultRows} reunionsCount={displayedReunions.length} />
                )}

                {lastRefresh ? <Text style={styles.refreshText}>Mise à jour : {formatClock(lastRefresh)}</Text> : null}
              </>
            ) : (
              !loadingList && !error ? (
                <View style={styles.emptyState}>
                  <Avatar name="CPN" size={72} />
                  <Text style={styles.emptyTitle}>Sélectionnez une compétition</Text>
                  <Text style={styles.emptySub}>Choisissez une compétition dans la liste ci-dessus pour voir le programme et les résultats.</Text>
                </View>
              ) : null
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>⚠ Erreur</Text>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryDark },

  // Topbar
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12, gap: 10 },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topLogo: { fontSize: 28 },
  topTitle: { color: COLORS.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  topSub: { color: COLORS.muted, fontSize: 11, marginTop: 1 },
  reloadBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.accentDim, borderWidth: 1, borderColor: COLORS.accentGlow, alignItems: 'center', justifyContent: 'center' },
  reloadBtnText: { color: COLORS.accent, fontSize: 20, fontWeight: '700' },

  // Nav tabs
  navWrap: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 0, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  navTab: { flex: 1, paddingVertical: 13, alignItems: 'center', position: 'relative' },
  navTabActive: {},
  navTabText: { color: COLORS.muted, fontWeight: '800', fontSize: 13 },
  navTabTextActive: { color: COLORS.accent },
  navTabIndicator: { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2, backgroundColor: COLORS.accent, borderTopLeftRadius: 2, borderTopRightRadius: 2 },

  // Content
  content: { padding: 12, gap: 12, backgroundColor: COLORS.bg, paddingBottom: 40 },

  // Search
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 14, marginTop: 10, marginBottom: 6, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 10 },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },

  // Group
  listPad: { padding: 12, gap: 10 },
  groupWrap: { gap: 8 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
  groupTitle: { color: COLORS.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, flex: 1 },
  groupCount: { backgroundColor: COLORS.surface, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  groupCountText: { color: COLORS.muted, fontSize: 10, fontWeight: '800' },
  groupChevron: { color: COLORS.subtle, fontSize: 14 },
  groupBody: { gap: 8, paddingLeft: 14 },

  // Compet card
  competCard: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, gap: 6, overflow: 'hidden' },
  competCardActive: { borderColor: COLORS.accent, borderWidth: 2 },
  competActiveBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: COLORS.accent },
  competCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cidText: { color: COLORS.subtle, fontSize: 11, fontWeight: '700' },
  competName: { color: COLORS.text, fontSize: 14, fontWeight: '900' },
  competMeta: { color: COLORS.muted, fontSize: 11, lineHeight: 17 },

  // Detail
  detailGrad: { gap: 14, padding: 16 },
  detailTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  detailTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  detailMeta: { color: COLORS.muted, fontSize: 12, marginTop: 3, lineHeight: 17 },
  detailCid: { color: COLORS.subtle, fontSize: 11, marginTop: 3 },

  kpiRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  primaryBtn: { backgroundColor: COLORS.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  primaryBtnText: { color: '#071829', fontWeight: '900', fontSize: 13 },
  secondaryBtn: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  secondaryBtnOn: { borderColor: COLORS.accentGlow, backgroundColor: COLORS.accentDim },
  secondaryBtnText: { color: COLORS.textMid, fontWeight: '800', fontSize: 13 },
  secondaryBtnOnText: { color: COLORS.accent },

  // Tabs
  tabRow: { flexDirection: 'row', gap: 10 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 12 },
  tabBtnActive: { backgroundColor: COLORS.primaryMid, borderColor: COLORS.borderLight },
  tabBtnText: { color: COLORS.muted, fontWeight: '900', fontSize: 13 },
  tabBtnTextActive: { color: COLORS.text },
  tabCount: { backgroundColor: COLORS.surface, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  tabCountActive: { backgroundColor: 'rgba(0,201,167,0.15)' },
  tabCountText: { color: COLORS.muted, fontWeight: '800', fontSize: 11 },
  tabCountTextActive: { color: COLORS.accent },

  // Filters
  filtersToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  filtersToggleText: { flex: 1, color: COLORS.textMid, fontWeight: '800', fontSize: 13 },
  filtersBadge: { backgroundColor: COLORS.accentDim, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  filtersBadgeText: { color: COLORS.accent, fontSize: 11, fontWeight: '900' },
  filtersBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  filterSearchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 11, paddingVertical: 9, marginTop: 10 },
  filterIcon: { fontSize: 13 },
  filterSearchInput: { flex: 1, color: COLORS.text, fontSize: 13 },
  filterGroupLabel: { color: COLORS.subtle, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  chipRow: { gap: 6, paddingRight: 14, paddingVertical: 2 },
  chip: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  chipText: { color: COLORS.muted, fontWeight: '700', fontSize: 12 },
  chipTextActive: { color: '#071829', fontWeight: '800' },
  resetBtn: { marginTop: 6, alignSelf: 'flex-start', backgroundColor: COLORS.dangerBg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  resetBtnText: { color: COLORS.danger, fontSize: 12, fontWeight: '800' },

  // States
  centerState: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  centerStateText: { color: COLORS.muted, fontSize: 13 },
  emptyState: { alignItems: 'center', paddingVertical: 50, gap: 14 },
  emptyTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  emptySub: { color: COLORS.muted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  refreshText: { color: COLORS.subtle, fontSize: 11, textAlign: 'center', paddingBottom: 12 },
  errorBox: { backgroundColor: COLORS.dangerBg, borderRadius: 14, borderWidth: 1, borderColor: COLORS.dangerBorder, padding: 14, gap: 5 },
  errorTitle: { color: COLORS.danger, fontSize: 14, fontWeight: '900' },
  errorText: { color: COLORS.danger, fontSize: 12 },
});
