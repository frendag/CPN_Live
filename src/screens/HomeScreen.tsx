import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView,
  Platform, StatusBar, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCompet } from '../hooks/useCompet';
import { COLORS } from '../utils/constants';
import { parseRangGeneral, ptsNum, isAbsence, formatTime } from '../utils/helpers';
import { LiveBadge } from '../components/Atoms';
import VueAthletes from '../components/VueAthletes';
import VueEpreuves from '../components/VueEpreuves';
import VuePodiums  from '../components/VuePodiums';
import { ViewMode } from '../utils/types';

export default function HomeScreen() {
  const [cid, setCid]       = useState('');
  const [filter, setFilter] = useState('');
  const [vue, setVue]       = useState<ViewMode>('athletes');
  const { data, loading, error, lastRefresh, autoOn, countdown, load, refresh, startAuto } = useCompet();

  const handleLoad = () => { if (cid.trim()) load(cid.trim()); };

  const filteredRows = filter
    ? (data?.rows ?? []).filter(r =>
        r.athlete.toLowerCase().includes(filter.toLowerCase()) ||
        r.epreuve.toLowerCase().includes(filter.toLowerCase()))
    : (data?.rows ?? []);

  const nbAth  = new Set((data?.rows ?? []).map(r => r.athlete)).size;
  const nbEp   = new Set((data?.rows ?? []).map(r => r.epreuve)).size;
  const nbPod  = (data?.rows ?? []).filter(r => {
    const p = parseRangGeneral(r.rang_general).pos;
    return p && p <= 3 && r.temps_result && !isAbsence(r.temps_result);
  }).length;
  const nbWait = (data?.rows ?? []).filter(r => !r.temps_result).length;
  const nbPerf = (data?.rows ?? []).filter(r => r.temps_result && !isAbsence(r.temps_result)).length;

  const TABS: { k: ViewMode; lbl: string; n: number; hi?: boolean }[] = [
    { k: 'athletes', lbl: '👤 Athlètes', n: nbAth },
    { k: 'epreuves', lbl: '🏊 Épreuves', n: nbEp },
    { k: 'podiums',  lbl: '🏆 Podiums',  n: nbPod, hi: nbPod > 0 },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* ── TOPBAR ──────────────────────────────────────────────────── */}
        <View style={styles.topbar}>
          <Text style={styles.topTitle}>🏊 CPN Compét Live</Text>
          <View style={styles.topInputRow}>
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>ID</Text>
              <TextInput
                value={cid}
                onChangeText={setCid}
                onSubmitEditing={handleLoad}
                placeholder="ex: 92073"
                placeholderTextColor="rgba(255,255,255,.4)"
                keyboardType="numeric"
                style={styles.input}
                returnKeyType="search"
              />
            </View>
            <Pressable onPress={handleLoad} disabled={loading} style={[styles.btnLoad, loading && styles.btnDisabled]}>
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.btnText}>🔍 Charger</Text>}
            </Pressable>
            {data && (
              <Pressable onPress={refresh} disabled={loading} style={styles.btnRefresh}>
                <Text style={styles.btnRefreshText}>🔄</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ── EN-TÊTE COMPET ───────────────────────────────────────────── */}
        {data && (
          <View style={styles.compHeader}>
            <View style={styles.compHeaderLeft}>
              <View style={styles.compTitleRow}>
                <Text style={styles.compTitle} numberOfLines={2}>{data.nom}</Text>
                {data.has_partial && <LiveBadge />}
              </View>
              <Text style={styles.compMeta}>
                {[data.lieu, data.bassin].filter(Boolean).join('  ·  ')}
              </Text>
            </View>

            {/* KPIs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiScroll}>
              {[
                { lbl: 'Athlètes', v: nbAth,  c: COLORS.primaryLight },
                { lbl: 'Perfs',    v: nbPerf,  c: COLORS.success },
                { lbl: 'Podiums',  v: nbPod,   c: COLORS.warning },
                ...(nbWait > 0 ? [{ lbl: 'En attente', v: nbWait, c: COLORS.subtle }] : []),
              ].map(k => (
                <View key={k.lbl} style={styles.kpi}>
                  <Text style={[styles.kpiVal, { color: k.c }]}>{k.v}</Text>
                  <Text style={styles.kpiLbl}>{k.lbl}</Text>
                </View>
              ))}
              {lastRefresh && (
                <View style={styles.kpi}>
                  <Text style={styles.kpiTime}>{formatTime(lastRefresh)}</Text>
                  <Text style={styles.kpiLbl}>mis à jour</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* ── BARRE FILTRES ────────────────────────────────────────────── */}
        {data && (
          <View style={styles.toolbar}>
            <TextInput
              value={filter}
              onChangeText={setFilter}
              placeholder="🔍 Filtrer nom ou épreuve…"
              placeholderTextColor={COLORS.subtle}
              style={styles.filterInput}
            />
            <Pressable
              onPress={() => startAuto(!autoOn)}
              style={[styles.autoBtn, autoOn && styles.autoBtnOn]}
            >
              <Text style={[styles.autoBtnText, autoOn && styles.autoBtnTextOn]}>
                {autoOn ? `⚡ ${countdown}s` : '⚡ Auto'}
              </Text>
            </Pressable>
            {data && (
              <Pressable
                onPress={() => Linking.openURL(
                  `https://www.liveffn.com/cgi-bin/resultats.php?competition=${cid}&langue=fra`
                )}
                style={styles.liveBtn}
              >
                <Text style={styles.liveBtnText}>liveffn ↗</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* ── TABS ─────────────────────────────────────────────────────── */}
        {data && (
          <View style={styles.tabs}>
            {TABS.map(t => (
              <Pressable key={t.k} onPress={() => setVue(t.k)} style={[styles.tab, vue === t.k && styles.tabActive]}>
                <Text style={[styles.tabText, vue === t.k && styles.tabTextActive]}>{t.lbl}</Text>
                {t.n > 0 && (
                  <View style={[styles.tabBadge,
                    vue === t.k ? styles.tabBadgeActive :
                    t.hi ? styles.tabBadgeHi : {}]}>
                    <Text style={[styles.tabBadgeText,
                      vue === t.k ? { color: '#fff' } :
                      t.hi ? { color: '#b45309' } : {}]}>{t.n}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* ── CONTENU ──────────────────────────────────────────────────── */}
        {!data && !loading && !error && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏊</Text>
            <Text style={styles.emptyTitle}>Saisir un ID de compétition</Text>
            <Text style={styles.emptySub}>Retrouve l'ID sur liveffn.com</Text>
          </View>
        )}

        {loading && !data && (
          <View style={styles.empty}>
            <ActivityIndicator size="large" color={COLORS.primaryLight} />
            <Text style={styles.loadingText}>Connexion à liveffn.com…</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>❌ {error}</Text>
            <Pressable onPress={handleLoad} style={styles.retryBtn}>
              <Text style={styles.retryText}>Réessayer</Text>
            </Pressable>
          </View>
        )}

        {data && !data.rows?.length && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏊</Text>
            <Text style={styles.emptyTitle}>Aucun résultat CPN</Text>
            <Text style={styles.emptySub}>Vérifiez l'ID ou réessayez plus tard</Text>
          </View>
        )}

        {data && !!data.rows?.length && (
          <View style={{ flex: 1 }}>
            {vue === 'athletes' && <VueAthletes rows={filteredRows} />}
            {vue === 'epreuves' && <VueEpreuves rows={filteredRows} />}
            {vue === 'podiums'  && <VuePodiums  rows={filteredRows} />}
          </View>
        )}

        {/* Avertissement résultats partiels */}
        {data?.has_partial && (
          <View style={styles.partialWarn}>
            <Text style={styles.partialText}>⚠️ Résultats partiels — certaines épreuves sont encore en cours</Text>
          </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },

  // Topbar
  topbar: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4,
    gap: 10,
  },
  topTitle: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.2 },
  topInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,.14)', borderRadius: 8,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,.25)',
    overflow: 'hidden',
  },
  inputLabel: { paddingHorizontal: 10, color: 'rgba(255,255,255,.55)', fontSize: 12, fontWeight: '700' },
  input: { flex: 1, color: '#fff', fontWeight: '800', fontSize: 15, paddingVertical: 9, paddingRight: 10 },
  btnLoad: {
    backgroundColor: '#10b981', borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    shadowColor: '#10b981', shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  btnDisabled: { backgroundColor: '#475569' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  btnRefresh: {
    backgroundColor: 'rgba(255,255,255,.16)', borderRadius: 8,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,.3)',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  btnRefreshText: { fontSize: 16 },

  // Compet header
  compHeader: {
    backgroundColor: COLORS.card, paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    borderLeftWidth: 4, borderLeftColor: COLORS.primaryLight,
    gap: 8,
  },
  compHeaderLeft: { gap: 3 },
  compTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  compTitle: { fontSize: 14.5, fontWeight: '900', color: COLORS.navy, flex: 1 },
  compMeta: { fontSize: 11.5, color: COLORS.subtle },
  kpiScroll: { flexGrow: 0 },
  kpi: { alignItems: 'center', marginRight: 18 },
  kpiVal: { fontSize: 20, fontWeight: '900' },
  kpiLbl: { fontSize: 9, color: COLORS.subtle, fontWeight: '700', textTransform: 'uppercase' },
  kpiTime: { fontSize: 13, fontWeight: '700', color: COLORS.muted },

  // Toolbar
  toolbar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  filterInput: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 9,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: 13, paddingVertical: 8,
    fontSize: 13, color: COLORS.navy,
  },
  autoBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: COLORS.card, borderRadius: 9,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  autoBtnOn: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  autoBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.muted },
  autoBtnTextOn: { color: '#16a34a' },
  liveBtn: {
    paddingHorizontal: 11, paddingVertical: 8,
    backgroundColor: COLORS.card, borderRadius: 9,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  liveBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.primaryLight },

  // Tabs
  tabs: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8,
    gap: 6, backgroundColor: COLORS.bg,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 8, borderRadius: 9, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  tabActive: {
    backgroundColor: COLORS.primaryLight, borderColor: 'transparent',
    shadowColor: COLORS.primaryLight, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tabText: { fontSize: 12, fontWeight: '700', color: COLORS.muted },
  tabTextActive: { color: '#fff' },
  tabBadge: { backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 1 },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,.25)' },
  tabBadgeHi: { backgroundColor: '#fef9c3' },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.subtle },

  // Empty / Error
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: COLORS.bg },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.muted, textAlign: 'center' },
  emptySub: { fontSize: 13, color: COLORS.subtle, marginTop: 6, textAlign: 'center' },
  loadingText: { marginTop: 16, fontSize: 14, color: COLORS.muted },
  errorBox: {
    margin: 16, padding: 16, backgroundColor: '#fee2e2', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#fca5a5', alignItems: 'center', gap: 10,
  },
  errorText: { fontSize: 14, color: '#b91c1c', fontWeight: '700', textAlign: 'center' },
  retryBtn: { backgroundColor: '#dc2626', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Partial warn
  partialWarn: {
    margin: 10, marginTop: 0, padding: 10,
    backgroundColor: '#fff7ed', borderRadius: 9,
    borderWidth: 1.5, borderColor: '#fed7aa',
  },
  partialText: { fontSize: 12, color: '#c2410c', fontWeight: '700', textAlign: 'center' },
});
