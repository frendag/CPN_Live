import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Linking, Pressable,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, NAGE_FILTERS, STATUS_LABELS, TYPE_FILTERS } from '../utils/constants';
import { Avatar, KpiCard, LiveBadge, SectionCard, SectionHeader, StatusPill } from '../components/Atoms';
import AthleteHub from '../components/AthleteHub';
import BottomSheet from '../components/BottomSheet';
import EmptyState from '../components/EmptyState';
import VueProgramme from '../components/VueProgramme';
import VueResultats from '../components/VueResultats';
import NotificationPanel from '../components/NotificationPanel';
import { useTabAnimation } from '../hooks/useTabAnimation';
import { useCompetV2 } from '../hooks/useCompetV2';
import {
  filterProgrammeReunions, filterResultRows, formatClock,
  formatCompetitionDates, isCompetitionLive, normalizeText,
} from '../utils/helpers';
import { AppSection, CompetitionStatus, CompetitionTab, NageFilter, TypeFilter } from '../utils/types';

const STATUS_ORDER: CompetitionStatus[] = ['en_cours', 'a_venir', 'passee'];

// ─── Overlay zIndex pour les panneaux flottants ───────────────────────────────
const OVERLAY_Z = 999;

// ─── Reusable pill chip ───────────────────────────────────────────────────────
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.93, duration: 70, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 70, useNativeDriver: true }),
    ]).start();
    onPress();
  };
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable style={[styles.chip, active && styles.chipActive]} onPress={handlePress}>
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Collapsible group ────────────────────────────────────────────────────────
function CollapsGroup({
  title, count, defaultOpen = true, accentColor, children,
}: {
  title: string; count: number; defaultOpen?: boolean;
  accentColor?: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const rotAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const toggle = () => {
    setOpen(v => {
      Animated.spring(rotAnim, { toValue: v ? 0 : 1, useNativeDriver: true, tension: 100, friction: 12 }).start();
      return !v;
    });
  };

  const chevronRot = rotAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });

  return (
    <View style={styles.groupWrap}>
      <Pressable style={styles.groupHeader} onPress={toggle}>
        <View style={[styles.groupDot, accentColor ? { backgroundColor: accentColor } : {}]} />
        <Text style={styles.groupLabel}>{title}</Text>
        <View style={styles.groupCountBadge}>
          <Text style={styles.groupCountText}>{count}</Text>
        </View>
        <Animated.Text style={[styles.groupChevron, { transform: [{ rotate: chevronRot }] }]}>›</Animated.Text>
      </Pressable>
      {open ? <View style={styles.groupBody}>{children}</View> : null}
    </View>
  );
}

// ─── Competition card ─────────────────────────────────────────────────────────
function CompetCard({
  item, selected, onPress,
}: { item: any; selected: boolean; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }),
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

// ─── Tab button ───────────────────────────────────────────────────────────────
function TabBtn({
  label, active, count, onPress,
}: { label: string; active: boolean; count: number; onPress: () => void }) {
  const underline = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(underline, { toValue: active ? 1 : 0, useNativeDriver: false, tension: 80, friction: 12 }).start();
  }, [active]);

  return (
    <Pressable style={[styles.tabBtn, active && styles.tabBtnActive]} onPress={onPress}>
      <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{label}</Text>
      <View style={[styles.tabCount, active && styles.tabCountActive]}>
        <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>{count}</Text>
      </View>
    </Pressable>
  );
}

// ─── Section nav tab ──────────────────────────────────────────────────────────
function NavTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.navTab, active && styles.navTabActive]} onPress={onPress}>
      <Text style={[styles.navTabText, active && styles.navTabTextActive]}>{label}</Text>
      {active && <View style={styles.navIndicator} />}
    </Pressable>
  );
}

// ─── Main HomeScreen ──────────────────────────────────────────────────────────
interface HomeScreenProps {
  initialSection?: AppSection;
}

export default function HomeScreen({ initialSection = 'competition' }: HomeScreenProps) {
  const {
    competitions, selectedCompetition, selectedCompetitionId,
    programme, resultats, loadingList, loadingDetail, error,
    lastRefresh, loadCompetitions, loadCompetition, refreshResultats,
  } = useCompetV2();

  const [section, setSection]           = useState<AppSection>(initialSection);
  const [tab, setTab]                   = useState<CompetitionTab>('programme');
  const [searchCompet, setSearchCompet] = useState('');
  const [searchAthlete, setSearchAthlete] = useState('');
  const [nageFilter, setNageFilter]     = useState<NageFilter>('');
  const [typeFilter, setTypeFilter]     = useState<TypeFilter>('');
  const [reunionFilter, setReunionFilter] = useState<number | ''>('');
  const [autoLive, setAutoLive]         = useState(true);
  const [countdown, setCountdown]       = useState<number | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Tab content fade/slide
  const { opacity: tabOpacity, translateX: tabSlide } = useTabAnimation(tab);

  const activeMeta = resultats?.competition || programme?.competition || null;
  const activeCid  = selectedCompetition?.cid || activeMeta?.cid || '';

  // Reset filters on competition change
  useEffect(() => {
    setReunionFilter(''); setSearchAthlete(''); setNageFilter(''); setTypeFilter(''); setTab('programme');
  }, [selectedCompetitionId]);

  useEffect(() => { setReunionFilter(''); }, [tab]);

  // Auto-refresh countdown
  useEffect(() => {
    if (!autoLive || !resultats?.competition?.next_refresh_sec || !selectedCompetitionId || !isCompetitionLive(resultats.competition)) {
      setCountdown(resultats?.competition?.next_refresh_sec ?? null);
      return;
    }
    setCountdown(resultats.competition.next_refresh_sec);
    const iv = setInterval(() => setCountdown(prev => {
      if (prev === null) return null;
      if (prev <= 1) { refreshResultats(); return resultats.competition.next_refresh_sec ?? null; }
      return prev - 1;
    }), 1000);
    return () => clearInterval(iv);
  }, [autoLive, resultats, refreshResultats, selectedCompetitionId]);

  // Filtered data
  const filteredCompetitions = useMemo(() => {
    const q = normalizeText(searchCompet);
    return competitions.filter(c => !q || [c.nom, c.lieu, c.cid, c.label_sidebar].some(v => normalizeText(v).includes(q)));
  }, [competitions, searchCompet]);

  const displayedReunions   = tab === 'programme' ? (programme?.reunions || []) : (resultats?.reunions || []);
  const programmeReunions   = useMemo(() => filterProgrammeReunions(programme?.reunions || [], reunionFilter, nageFilter, typeFilter, searchAthlete), [programme, reunionFilter, nageFilter, typeFilter, searchAthlete]);
  const resultRows          = useMemo(() => filterResultRows(resultats?.reunions || [], reunionFilter, nageFilter, typeFilter, searchAthlete), [resultats, reunionFilter, nageFilter, typeFilter, searchAthlete]);
  const resultAthletesCount = useMemo(() => new Set(resultRows.map(r => `${r.athlete_nom}__${r.annee_naiss || ''}`)).size, [resultRows]);
  const competitionCounts   = useMemo(() => ({
    programme: programme?.reunions.reduce((s, r) => s + r.lignes.length, 0) || 0,
    resultats: resultats?.reunions.reduce((s, r) => s + r.lignes.length, 0) || 0,
  }), [programme, resultats]);

  const activeFiltersCount = [nageFilter, typeFilter, reunionFilter !== '' ? '1' : '', searchAthlete].filter(Boolean).length;

  const resetFilters = useCallback(() => {
    setReunionFilter(''); setNageFilter(''); setTypeFilter(''); setSearchAthlete('');
  }, []);

  const groupColors: Record<string, string> = {
    en_cours: COLORS.success,
    a_venir:  COLORS.warning,
    passee:   COLORS.subtle,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* ─── Top Bar ─── */}
      <LinearGradient colors={['#001a33', '#071829']} style={styles.topbar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        {/* Logo compact CPN */}
        <View style={styles.topLeft}>
          {/* Icône mark */}
          <View style={styles.logoMark}>
            <View style={styles.logoWave} />
            <View style={styles.logoCurve} />
            <Text style={styles.logoMarkText}>CPN</Text>
          </View>
          {/* Texte */}
          <View style={styles.logoTextBlock}>
            <Text style={styles.logoTextMain}>CERGY PONTOISE</Text>
            <View style={styles.logoRedLine} />
            <View style={styles.logoBottomRow}>
              <Text style={styles.logoTextNata}>NATATION</Text>
              <Text style={styles.logoTextAnalytics}>Analytics</Text>
            </View>
          </View>
        </View>
        {section === 'competition' && (
          <View style={styles.topRight}>
            <View style={{ zIndex: OVERLAY_Z }}>
              <NotificationPanel
                competitionId={selectedCompetitionId}
                isLive={!!(selectedCompetitionId && resultats?.competition && isCompetitionLive(resultats.competition))}
              />
            </View>
            <Pressable style={styles.reloadBtn} onPress={loadCompetitions}>
              {loadingList
                ? <ActivityIndicator size="small" color={COLORS.accent} />
                : <Text style={styles.reloadBtnText}>↻</Text>
              }
            </Pressable>
          </View>
        )}
      </LinearGradient>

      {/* ─── Nav ─── */}
      <View style={styles.navBar}>
        <NavTab label="🏁 Compétition" active={section === 'competition'} onPress={() => setSection('competition')} />
        <NavTab label="👤 Athlète"     active={section === 'athlete'}     onPress={() => setSection('athlete')} />
      </View>

      {/* ─── Content ─── */}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {section === 'competition' ? (
          <>
            {/* Competition list */}
            <SectionCard>
              <SectionHeader
                title="Compétitions"
                sub={`${competitions.length} disponible${competitions.length !== 1 ? 's' : ''}`}
              />
              <View style={styles.searchPad}>
                <View style={styles.searchRow}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    value={searchCompet}
                    onChangeText={setSearchCompet}
                    placeholder="Nom, lieu ou CID…"
                    placeholderTextColor={COLORS.subtle}
                    style={styles.searchInput}
                    returnKeyType="search"
                    clearButtonMode="while-editing"
                  />
                </View>
              </View>

              {loadingList && competitions.length === 0 ? (
                <View style={styles.centerState}>
                  <ActivityIndicator color={COLORS.accent} />
                  <Text style={styles.centerStateText}>Chargement des compétitions…</Text>
                </View>
              ) : null}

              <View style={styles.groupsPad}>
                {STATUS_ORDER.map(status => {
                  const items = filteredCompetitions.filter(c => c.status === status);
                  if (!items.length) return null;
                  return (
                    <CollapsGroup
                      key={status}
                      title={STATUS_LABELS[status]}
                      count={items.length}
                      defaultOpen={status !== 'passee'}
                      accentColor={groupColors[status]}
                    >
                      {items.map(item => (
                        <CompetCard
                          key={item.id}
                          item={item}
                          selected={item.id === selectedCompetitionId}
                          onPress={() => loadCompetition(item.id, false)}
                        />
                      ))}
                    </CollapsGroup>
                  );
                })}
              </View>
            </SectionCard>

            {/* ─── Competition detail ─── */}
            {selectedCompetition && activeMeta ? (
              <>
                {/* Hero detail */}
                <SectionCard>
                  <LinearGradient colors={['#0c2540', '#071829']} style={styles.detailGrad}>
                    <View style={styles.detailTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailTitle} numberOfLines={2}>{activeMeta.nom}</Text>
                        <Text style={styles.detailMeta}>{[activeMeta.lieu, activeMeta.bassin, formatCompetitionDates(activeMeta)].filter(Boolean).join(' · ')}</Text>
                        <Text style={styles.detailCid}>CID liveffn : {activeMeta.cid}</Text>
                      </View>
                      {isCompetitionLive(activeMeta) && <LiveBadge countdown={countdown} />}
                    </View>

                    <View style={styles.kpiRow}>
                      <KpiCard label="Réunions" value={programme?.reunions.length || 0} />
                      <KpiCard label="Programme" value={competitionCounts.programme} />
                      <KpiCard label="Résultats" value={competitionCounts.resultats} accent={competitionCounts.resultats > 0} />
                      <KpiCard label="Athlètes"  value={resultAthletesCount} />
                    </View>

                    <View style={styles.actionsRow}>
                      <Pressable style={styles.primaryBtn} onPress={() => loadCompetition(selectedCompetition.id)}>
                        {loadingDetail
                          ? <ActivityIndicator size="small" color="#071829" />
                          : <Text style={styles.primaryBtnText}>⟳ Recharger</Text>
                        }
                      </Pressable>
                      <Pressable
                        style={[styles.secondaryBtn, autoLive && styles.secondaryBtnOn]}
                        onPress={() => setAutoLive(v => !v)}
                      >
                        <Text style={[styles.secondaryBtnText, autoLive && styles.secondaryBtnOnText]}>
                          ⚡ Auto {autoLive ? 'ON' : 'OFF'}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.secondaryBtn}
                        onPress={() => activeCid && Linking.openURL(`https://www.liveffn.com/cgi-bin/resultats.php?competition=${activeCid}&langue=fra`)}
                      >
                        <Text style={styles.secondaryBtnText}>liveffn ↗</Text>
                      </Pressable>
                    </View>
                  </LinearGradient>
                </SectionCard>

                {/* Tab row */}
                <View style={styles.tabRow}>
                  <TabBtn
                    label="📋 Programme"
                    active={tab === 'programme'}
                    count={competitionCounts.programme}
                    onPress={() => setTab('programme')}
                  />
                  <TabBtn
                    label="⚡ Résultats"
                    active={tab === 'resultats'}
                    count={competitionCounts.resultats}
                    onPress={() => setTab('resultats')}
                  />
                </View>

                {/* Filter trigger */}
                <Pressable style={styles.filtersTrigger} onPress={() => setFiltersVisible(true)}>
                  <Text style={styles.filtersTriggerIcon}>🔧</Text>
                  <Text style={styles.filtersTriggerText}>Filtres</Text>
                  {activeFiltersCount > 0 && (
                    <View style={styles.filtersBadge}>
                      <Text style={styles.filtersBadgeText}>{activeFiltersCount}</Text>
                    </View>
                  )}
                  {searchAthlete ? (
                    <Text style={styles.filtersPreview} numberOfLines={1}>« {searchAthlete} »</Text>
                  ) : null}
                  <Text style={styles.filtersChevron}>›</Text>
                </Pressable>

                {/* Loading spinner */}
                {loadingDetail && !programme && !resultats ? (
                  <View style={styles.centerState}>
                    <ActivityIndicator color={COLORS.accent} />
                    <Text style={styles.centerStateText}>Chargement de la compétition…</Text>
                  </View>
                ) : null}

                {/* Tab content with animation */}
                <Animated.View style={{ opacity: tabOpacity, transform: [{ translateX: tabSlide }] }}>
                  {tab === 'programme' ? (
                    <VueProgramme reunions={programmeReunions} reunionFilter={reunionFilter} />
                  ) : (
                    <VueResultats rows={resultRows} reunionsCount={displayedReunions.length} />
                  )}
                </Animated.View>

                {lastRefresh && (
                  <Text style={styles.refreshText}>
                    Mise à jour : {formatClock(lastRefresh)}
                  </Text>
                )}
              </>
            ) : (
              !loadingList && !error
                ? <EmptyState icon="🏁" title="Sélectionnez une compétition" sub="Choisissez une compétition dans la liste ci-dessus pour accéder au programme et aux résultats en temps réel." />
                : null
            )}

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>⚠ Erreur</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </>
        ) : (
          <AthleteHub />
        )}
      </ScrollView>

      {/* ─── Bottom Sheet Filters ─── */}
      <BottomSheet
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        title="🔧 Filtres"
      >
        {/* Athlete search */}
        <View style={styles.sheetSection}>
          <Text style={styles.sheetLabel}>NAGEUR</Text>
          <View style={styles.sheetSearchRow}>
            <Text style={{ fontSize: 14 }}>🏊</Text>
            <TextInput
              value={searchAthlete}
              onChangeText={setSearchAthlete}
              placeholder="Rechercher un nageur…"
              placeholderTextColor={COLORS.subtle}
              style={styles.sheetSearchInput}
            />
            {searchAthlete ? (
              <Pressable onPress={() => setSearchAthlete('')}>
                <Text style={styles.sheetClearBtn}>✕</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Reunion filter */}
        <View style={styles.sheetSection}>
          <Text style={styles.sheetLabel}>RÉUNION</Text>
          <View style={styles.sheetChips}>
            <Chip label="Toutes" active={reunionFilter === ''} onPress={() => setReunionFilter('')} />
            {displayedReunions.map(r => (
              <Chip
                key={`r-${r.reunion_num}`}
                label={`R${r.reunion_num}${r.reunion_moment ? ` · ${r.reunion_moment}` : ''}`}
                active={reunionFilter === r.reunion_num}
                onPress={() => setReunionFilter(r.reunion_num)}
              />
            ))}
          </View>
        </View>

        {/* Nage filter */}
        <View style={styles.sheetSection}>
          <Text style={styles.sheetLabel}>NAGE</Text>
          <View style={styles.sheetChips}>
            {NAGE_FILTERS.map(f => (
              <Chip key={f.key || 'all-n'} label={f.label} active={nageFilter === f.key} onPress={() => setNageFilter(f.key)} />
            ))}
          </View>
        </View>

        {/* Type filter */}
        <View style={styles.sheetSection}>
          <Text style={styles.sheetLabel}>TYPE</Text>
          <View style={styles.sheetChips}>
            {TYPE_FILTERS.map(f => (
              <Chip key={f.key || 'all-t'} label={f.label} active={typeFilter === f.key} onPress={() => setTypeFilter(f.key)} />
            ))}
          </View>
        </View>

        {/* Reset */}
        {activeFiltersCount > 0 && (
          <Pressable style={styles.resetBtn} onPress={() => { resetFilters(); setFiltersVisible(false); }}>
            <Text style={styles.resetBtnText}>✕ Réinitialiser les filtres</Text>
          </Pressable>
        )}

        {/* Apply */}
        <Pressable style={styles.applyBtn} onPress={() => setFiltersVisible(false)}>
          <Text style={styles.applyBtnText}>
            {activeFiltersCount > 0 ? `Appliquer (${activeFiltersCount} filtre${activeFiltersCount > 1 ? 's' : ''})` : 'Fermer'}
          </Text>
        </Pressable>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryDark },

  // Top bar + Logo
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 8, paddingBottom: 10, gap: 10, zIndex: OVERLAY_Z, overflow: 'visible' },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },

  // Icône mark
  logoMark: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#001a33', overflow: 'hidden', position: 'relative', justifyContent: 'flex-end', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  logoWave:  { position: 'absolute', bottom: 0, left: 0, right: 0, height: 10, backgroundColor: '#0055AA', opacity: 0.85 },
  logoCurve: { position: 'absolute', top: 8, left: 6, right: 6, height: 20, borderColor: '#FF0000', borderTopWidth: 2.5, borderRadius: 2, transform: [{ rotate: '-15deg' }] },
  logoMarkText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5, paddingBottom: 2, zIndex: 1 },

  // Bloc texte logo
  logoTextBlock: { flex: 1, gap: 1 },
  logoTextMain: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', letterSpacing: 1, fontStyle: 'italic' },
  logoRedLine:  { height: 1.5, backgroundColor: '#FF0000', width: '85%', opacity: 0.9 },
  logoBottomRow:{ flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  logoTextNata: { color: '#FF0000', fontSize: 11, fontWeight: '700', letterSpacing: 4 },
  logoTextAnalytics: { color: '#FFD54A', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  topRight:  { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  reloadBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.accentDim, borderWidth: 1, borderColor: COLORS.accentGlow, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  reloadBtnText: { color: COLORS.accent, fontSize: 20, fontWeight: '700' },

  // Nav bar
  navBar: { flexDirection: 'row', backgroundColor: COLORS.primary, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  navTab: { flex: 1, paddingVertical: 13, alignItems: 'center', position: 'relative' },
  navTabActive: {},
  navTabText: { color: COLORS.muted, fontWeight: '800', fontSize: 13 },
  navTabTextActive: { color: COLORS.accent },
  navIndicator: { position: 'absolute', bottom: 0, left: '18%', right: '18%', height: 2, backgroundColor: COLORS.accent, borderTopLeftRadius: 2, borderTopRightRadius: 2 },

  // Content
  content: { padding: 12, gap: 12, paddingBottom: 44, backgroundColor: COLORS.bg },

  // Search
  searchPad: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 10 },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },

  // Groups
  groupsPad: { padding: 12, gap: 12 },
  groupWrap: { gap: 0 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  groupDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
  groupLabel: { flex: 1, color: COLORS.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  groupCountBadge: { backgroundColor: COLORS.surface, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  groupCountText: { color: COLORS.muted, fontSize: 10, fontWeight: '800' },
  groupChevron: { color: COLORS.subtle, fontSize: 18, fontWeight: '300' },
  groupBody: { gap: 8, paddingLeft: 14, paddingTop: 6 },

  // Competition card
  competCard: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, gap: 6, overflow: 'hidden' },
  competCardActive: { borderColor: COLORS.accent, borderWidth: 2 },
  competActiveBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: COLORS.accent },
  competCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cidText: { color: COLORS.subtle, fontSize: 11, fontWeight: '700' },
  competName: { color: COLORS.text, fontSize: 14, fontWeight: '900', lineHeight: 20 },
  competMeta: { color: COLORS.muted, fontSize: 11, lineHeight: 17 },

  // Detail
  detailGrad: { gap: 14, padding: 16 },
  detailTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  detailTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900', lineHeight: 24 },
  detailMeta: { color: COLORS.muted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  detailCid: { color: COLORS.subtle, fontSize: 11, marginTop: 3 },
  kpiRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },

  // Action buttons
  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  primaryBtn: { backgroundColor: COLORS.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, minWidth: 110, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
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
  tabCountActive: { backgroundColor: COLORS.accentDim },
  tabCountText: { color: COLORS.muted, fontWeight: '800', fontSize: 11 },
  tabCountTextActive: { color: COLORS.accent },

  // Filter trigger (inline bar)
  filtersTrigger: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 11 },
  filtersTriggerIcon: { fontSize: 14 },
  filtersTriggerText: { color: COLORS.textMid, fontWeight: '800', fontSize: 13 },
  filtersBadge: { backgroundColor: COLORS.accentDim, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  filtersBadgeText: { color: COLORS.accent, fontSize: 11, fontWeight: '900' },
  filtersPreview: { flex: 1, color: COLORS.muted, fontSize: 12, fontStyle: 'italic' },
  filtersChevron: { color: COLORS.muted, fontSize: 18 },

  // States
  centerState: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  centerStateText: { color: COLORS.muted, fontSize: 13 },
  refreshText: { color: COLORS.subtle, fontSize: 11, textAlign: 'center', paddingBottom: 8 },
  errorBox: { backgroundColor: COLORS.dangerBg, borderRadius: 14, borderWidth: 1, borderColor: COLORS.dangerBorder, padding: 14, gap: 5 },
  errorTitle: { color: COLORS.danger, fontSize: 14, fontWeight: '900' },
  errorText: { color: COLORS.danger, fontSize: 12, lineHeight: 17 },

  // Bottom sheet internals
  chip: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  chipText: { color: COLORS.muted, fontWeight: '700', fontSize: 12 },
  chipTextActive: { color: '#071829', fontWeight: '800' },
  sheetSection: { marginBottom: 18, gap: 8 },
  sheetLabel: { color: COLORS.subtle, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  sheetChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sheetSearchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 10 },
  sheetSearchInput: { flex: 1, color: COLORS.text, fontSize: 14 },
  sheetClearBtn: { color: COLORS.muted, fontSize: 14, fontWeight: '700' },
  resetBtn: { backgroundColor: COLORS.dangerBg, borderRadius: 10, paddingVertical: 11, alignItems: 'center', marginBottom: 8 },
  resetBtnText: { color: COLORS.danger, fontSize: 13, fontWeight: '800' },
  applyBtn: { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  applyBtnText: { color: '#071829', fontSize: 14, fontWeight: '900' },
});
