/**
 * NotificationPanel — Surveillance d'athlètes et alertes de qualification
 * 
 * Fonctionnement :
 * - L'utilisateur tape les noms d'athlètes à surveiller (persistés AsyncStorage)
 * - Polling sur /api/compet_v2/notifications toutes les 30s pendant la compétition
 * - Badge rouge sur le bouton 🔔 si nouveaux résultats
 * - Chaque notification affiche le temps, tendance et niveau qualif
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../utils/constants';
import { API_BASE } from '../utils/constants';

const STORAGE_KEY  = 'cpn_watched_athletes';
const POLL_INTERVAL = 30_000; // 30s

const NIV_COLORS: Record<string, string> = {
  CF: '#ff6b6b', CN: '#ffa748', MN: '#ffd166', Web: '#00c9a7', 'Régional': '#5ab4e8',
};

interface Notification {
  id: number;
  athlete_nom: string;
  epreuve_label: string;
  temps_result: string;
  points?: string;
  rang_general?: string;
  delta_sec?: number | null;
  tendance?: string;
  niveau_atteint?: string | null;
  niveau_superieur?: string | null;
  next_delta_pct?: number | null;
  next_temps?: string | null;
  message: string;
  updated_at?: string;
}

interface Props {
  competitionId: number | null;
  isLive: boolean;
}

export default function NotificationPanel({ competitionId, isLive }: Props) {
  const [open,       setOpen]       = useState(false);
  const [watched,    setWatched]    = useState<string[]>([]);
  const [inputVal,   setInputVal]   = useState('');
  const [notifs,     setNotifs]     = useState<Notification[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [newCount,   setNewCount]   = useState(0);
  const [lastTs,     setLastTs]     = useState<string>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideY   = useRef(new Animated.Value(-300)).current;
  const opacity  = useRef(new Animated.Value(0)).current;

  // ── Persistance liste de surveillance ────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(v => {
      if (v) try { setWatched(JSON.parse(v)); } catch {}
    });
  }, []);

  const saveWatched = (list: string[]) => {
    setWatched(list);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const addAthlete = () => {
    const name = inputVal.trim();
    if (!name || watched.includes(name)) { setInputVal(''); return; }
    saveWatched([...watched, name]);
    setInputVal('');
  };

  const removeAthlete = (name: string) => saveWatched(watched.filter(w => w !== name));

  // ── Fetch notifications ───────────────────────────────────────────────────
  const fetchNotifs = useCallback(async (isInit = false) => {
    if (!competitionId || watched.length === 0) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        competition_id: String(competitionId),
        athletes: watched.join(','),
      });
      if (lastTs && !isInit) params.set('since', lastTs);

      const res  = await fetch(`${API_BASE}/api/compet_v2/notifications?${params}`);
      const data = await res.json();
      const items: Notification[] = data.notifications || [];

      if (isInit) {
        setNotifs(items);
      } else if (items.length > 0) {
        setNotifs(prev => {
          const ids = new Set(prev.map(n => n.id));
          const fresh = items.filter(n => !ids.has(n.id));
          if (fresh.length > 0) setNewCount(c => c + fresh.length);
          return [...fresh, ...prev];
        });
      }
      if (data.ts) setLastTs(data.ts);
    } catch {}
    setLoading(false);
  }, [competitionId, watched, lastTs]);

  // ── Polling ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isLive || !competitionId || watched.length === 0) return;
    fetchNotifs(true);
    timerRef.current = setInterval(() => fetchNotifs(false), POLL_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isLive, competitionId, watched.length]);

  // ── Animation panneau ─────────────────────────────────────────────────────
  const toggleOpen = () => {
    const toOpen = !open;
    setOpen(toOpen);
    if (toOpen) setNewCount(0);
    Animated.parallel([
      Animated.spring(slideY, { toValue: toOpen ? 0 : -300, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacity,{ toValue: toOpen ? 1 : 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  // ── Rendu badge tendance ──────────────────────────────────────────────────
  const trendIcon = (tendance?: string) => {
    if (!tendance) return null;
    if (tendance.includes('PR') || tendance === 'better') return { icon: '🏆', color: COLORS.success };
    if (tendance === 'worse') return { icon: '▲', color: COLORS.danger };
    return null;
  };

  return (
    <View style={s.container}>
      {/* Bouton 🔔 */}
      <Pressable style={s.bellBtn} onPress={toggleOpen}>
        <Text style={s.bellIcon}>🔔</Text>
        {newCount > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeTxt}>{newCount > 9 ? '9+' : newCount}</Text>
          </View>
        )}
      </Pressable>

      {/* Panneau glissant */}
      {open && (
        <Animated.View style={[s.panel, { transform: [{ translateY: slideY }], opacity }]}>
          <View style={s.panelHeader}>
            <Text style={s.panelTitle}>🔔 Surveillance athlètes</Text>
            <Pressable onPress={toggleOpen} style={s.closeBtn}>
              <Text style={s.closeTxt}>✕</Text>
            </Pressable>
          </View>

          {/* Ajout athlète */}
          <View style={s.addRow}>
            <TextInput
              style={s.addInput}
              value={inputVal}
              onChangeText={setInputVal}
              placeholder="Nom de l'athlète…"
              placeholderTextColor={COLORS.subtle}
              returnKeyType="done"
              onSubmitEditing={addAthlete}
            />
            <Pressable style={s.addBtn} onPress={addAthlete}>
              <Text style={s.addBtnTxt}>+ Suivre</Text>
            </Pressable>
          </View>

          {/* Liste surveillés */}
          {watched.length > 0 && (
            <View style={s.watchedRow}>
              {watched.map(w => (
                <Pressable key={w} style={s.watchedChip} onPress={() => removeAthlete(w)}>
                  <Text style={s.watchedTxt}>{w}</Text>
                  <Text style={s.watchedX}>✕</Text>
                </Pressable>
              ))}
            </View>
          )}

          {watched.length === 0 && (
            <Text style={s.emptyWatched}>Ajoutez des athlètes à surveiller pour recevoir leurs alertes.</Text>
          )}

          {/* Notifications */}
          {watched.length > 0 && (
            <>
              <View style={s.notifHeader}>
                <Text style={s.notifTitle}>Derniers résultats</Text>
                {loading && <ActivityIndicator size="small" color={COLORS.accent} />}
              </View>

              {notifs.length === 0 && !loading && (
                <Text style={s.noNotif}>
                  {isLive ? 'En attente des résultats…' : 'Compétition non en cours.'}
                </Text>
              )}

              <ScrollView style={s.notifList} showsVerticalScrollIndicator={false}>
                {notifs.map(n => {
                  const tr = trendIcon(n.tendance);
                  return (
                    <View key={n.id} style={[s.notifCard, n.niveau_atteint && s.notifCardQualif]}>
                      {/* Nom + épreuve */}
                      <View style={s.notifTop}>
                        <Text style={s.notifName}>{n.athlete_nom}</Text>
                        <Text style={s.notifEp}>{n.epreuve_label}</Text>
                      </View>
                      {/* Temps + tendance */}
                      <View style={s.notifMid}>
                        <Text style={[s.notifTemps, n.niveau_atteint && { color: '#ffd166' }]}>
                          {n.temps_result}
                        </Text>
                        {n.points && <Text style={s.notifPts}>{n.points}</Text>}
                        {tr && <Text style={{ color: tr.color, fontSize: 14 }}>{tr.icon}</Text>}
                        {n.rang_general && <Text style={s.notifRang}>#{n.rang_general}</Text>}
                      </View>
                      {/* Qualification */}
                      {(n.niveau_atteint || n.niveau_superieur) && (
                        <View style={s.notifQualif}>
                          {n.niveau_atteint && (
                            <View style={[s.qualifBadge, { borderColor: NIV_COLORS[n.niveau_atteint] || COLORS.accent, backgroundColor: (NIV_COLORS[n.niveau_atteint] || COLORS.accent) + '22' }]}>
                              <Text style={[s.qualifBadgeTxt, { color: NIV_COLORS[n.niveau_atteint] || COLORS.accent }]}>
                                ✅ {n.niveau_atteint}
                              </Text>
                            </View>
                          )}
                          {n.niveau_superieur && n.next_delta_pct !== null && n.next_delta_pct !== undefined && (
                            <View style={[s.qualifNext, { borderColor: NIV_COLORS[n.niveau_superieur] || COLORS.muted }]}>
                              <Text style={[s.qualifNextTxt, { color: NIV_COLORS[n.niveau_superieur] || COLORS.muted }]}>
                                {n.niveau_superieur} : {n.next_delta_pct > 0 ? '+' : ''}{n.next_delta_pct.toFixed(1)}% {n.next_temps ? `(seuil ${n.next_temps})` : ''}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { position: 'relative' },

  bellBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.accentDim,
             borderWidth: 1, borderColor: COLORS.accentGlow, alignItems: 'center', justifyContent: 'center' },
  bellIcon: { fontSize: 18 },
  badge:    { position: 'absolute', top: -4, right: -4, backgroundColor: COLORS.danger,
              borderRadius: 8, minWidth: 16, paddingHorizontal: 3, alignItems: 'center' },
  badgeTxt: { color: '#fff', fontSize: 9, fontWeight: '900' },

  panel: {
    position: 'absolute', top: 44, right: 0, width: 320,
    backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1,
    borderColor: COLORS.border, zIndex: 999, maxHeight: 480,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                 paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  panelTitle: { color: COLORS.text, fontSize: 13, fontWeight: '800' },
  closeBtn:   { width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.surface,
                alignItems: 'center', justifyContent: 'center' },
  closeTxt:   { color: COLORS.muted, fontSize: 12, fontWeight: '700' },

  addRow:   { flexDirection: 'row', gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  addInput: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 8, borderWidth: 1,
              borderColor: COLORS.border, paddingHorizontal: 10, paddingVertical: 7,
              color: COLORS.text, fontSize: 13 },
  addBtn:   { backgroundColor: COLORS.accent, borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center' },
  addBtnTxt:{ color: '#071829', fontWeight: '800', fontSize: 12 },

  watchedRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  watchedChip:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.accentDim,
                  borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
                  borderWidth: 1, borderColor: COLORS.accentGlow },
  watchedTxt:   { color: COLORS.accent, fontSize: 11, fontWeight: '700' },
  watchedX:     { color: COLORS.accent, fontSize: 10, opacity: 0.7 },

  emptyWatched: { color: COLORS.muted, fontSize: 11, textAlign: 'center', padding: 14, lineHeight: 17 },

  notifHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                 paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 },
  notifTitle:  { color: COLORS.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  noNotif:     { color: COLORS.subtle, fontSize: 12, textAlign: 'center', padding: 16 },

  notifList: { maxHeight: 280, paddingHorizontal: 8, paddingBottom: 10 },
  notifCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 10, marginBottom: 8,
               borderWidth: 1, borderColor: COLORS.border, gap: 4 },
  notifCardQualif: { borderColor: 'rgba(255,209,102,0.4)', backgroundColor: 'rgba(255,209,102,0.05)' },

  notifTop:   { gap: 2 },
  notifName:  { color: COLORS.text, fontSize: 12, fontWeight: '800' },
  notifEp:    { color: COLORS.muted, fontSize: 10 },
  notifMid:   { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  notifTemps: { color: COLORS.text, fontSize: 15, fontWeight: '900' },
  notifPts:   { color: COLORS.muted, fontSize: 11 },
  notifRang:  { color: COLORS.subtle, fontSize: 11 },

  notifQualif:    { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  qualifBadge:    { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  qualifBadgeTxt: { fontSize: 10, fontWeight: '800' },
  qualifNext:     { borderWidth: 1, borderStyle: 'dashed', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  qualifNextTxt:  { fontSize: 10, fontWeight: '700' },
});
