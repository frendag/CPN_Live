/**
 * TrainingScreen.tsx  — v2
 * Ajout : édition du temps final (et des splits) après arrêt du chrono,
 * avant la sauvegarde en base.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CpnLogo } from './CpnLogo';
import { useTrainingAthletes } from '../hooks/useTrainingAthletes';
import { useAppTheme } from '../utils/theme';
import {
  formatPerformedAt,
  formatMs,
  getAvailableDistances,
  getExpectedSplitDistances,
  saveTrainingPerf,
} from '../utils/training';
import { PoolLength, StartMode, StrokeCode, TrainingSplit } from '../utils/trainingTypes';

// ─── ChoiceChip ───────────────────────────────────────────────────────────────
type ChoiceChipProps<T extends string | number> = {
  value: T;
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: (value: T) => void;
  accent: string;
};
function ChoiceChip<T extends string | number>({ value, label, selected, disabled, onPress, accent }: ChoiceChipProps<T>) {
  return (
    <Pressable
      onPressIn={() => !disabled && onPress(value)}
      disabled={disabled}
      hitSlop={10}
      style={({ pressed }) => [
        styles.choiceChip,
        { borderColor: selected ? accent : 'rgba(255,255,255,0.08)', opacity: disabled ? 0.4 : 1 },
        selected && { backgroundColor: `${accent}22` },
        pressed && !disabled && styles.choiceChipPressed,
      ]}
    >
      <Text style={[styles.choiceChipText, selected && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

// ─── StopwatchButton ──────────────────────────────────────────────────────────
type StopwatchButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  fullWidth?: boolean;
};
function StopwatchButton({ label, onPress, disabled, icon, textColor, backgroundColor, borderColor }: StopwatchButtonProps) {
  return (
    <Pressable
      onPressIn={() => !disabled && onPress()}
      delayLongPress={0}
      disabled={disabled}
      hitSlop={24}
      pressRetentionOffset={24}
      style={({ pressed }) => [
        styles.actionBtn,
        { backgroundColor, borderColor, opacity: disabled ? 0.45 : 1 },
        pressed && !disabled && styles.actionBtnPressed,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={30} color={textColor} />
      <Text style={[styles.actionText, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

// ─── TimeEditModal (inline) ───────────────────────────────────────────────────
/**
 * Champ d'édition du temps final affiché en mode "stopped".
 * Format attendu : MM:SS.cc  (ex. 01:23.45)
 */
function TimeEditor({
  valueMs,
  onChange,
  accent,
}: {
  valueMs: number;
  onChange: (ms: number) => void;
  accent: string;
}) {
  const [raw, setRaw] = useState(formatMs(valueMs));
  const [error, setError] = useState(false);

  const commit = () => {
    // Parser MM:SS.cc ou SS.cc
    const m = raw.trim().match(/^(?:(\d{1,2}):)?(\d{1,2})\.(\d{2})$/);
    if (!m) { setError(true); return; }
    const minutes = parseInt(m[1] ?? '0', 10);
    const seconds = parseInt(m[2], 10);
    const centis  = parseInt(m[3], 10);
    const ms = minutes * 60000 + seconds * 1000 + centis * 10;
    setError(false);
    onChange(ms);
  };

  return (
    <View style={styles.timeEditorWrap}>
      <MaterialCommunityIcons name="pencil-outline" size={16} color={accent} />
      <TextInput
        value={raw}
        onChangeText={(t) => { setRaw(t); setError(false); }}
        onBlur={commit}
        onSubmitEditing={commit}
        style={[
          styles.timeEditorInput,
          { color: error ? '#ff6b6b' : '#fff', borderColor: error ? '#ff6b6b' : `${accent}66` },
        ]}
        keyboardType="numeric"
        autoCapitalize="none"
        selectTextOnFocus
      />
      <Text style={{ color: error ? '#ff6b6b' : '#6a8ba5', fontSize: 11 }}>
        {error ? 'Format : MM:SS.cc' : 'MM:SS.cc'}
      </Text>
    </View>
  );
}

// ─── Split editor ─────────────────────────────────────────────────────────────
function SplitEditor({
  split,
  onEdit,
  accent,
}: {
  split: TrainingSplit;
  onEdit: (order_index: number, ms: number) => void;
  accent: string;
}) {
  const [raw, setRaw] = useState(formatMs(split.time_ms));
  const [error, setError] = useState(false);

  const commit = () => {
    const m = raw.trim().match(/^(?:(\d{1,2}):)?(\d{1,2})\.(\d{2})$/);
    if (!m) { setError(true); return; }
    const minutes = parseInt(m[1] ?? '0', 10);
    const seconds = parseInt(m[2], 10);
    const centis  = parseInt(m[3], 10);
    const ms = minutes * 60000 + seconds * 1000 + centis * 10;
    setError(false);
    onEdit(split.order_index, ms);
  };

  return (
    <TextInput
      value={raw}
      onChangeText={(t) => { setRaw(t); setError(false); }}
      onBlur={commit}
      onSubmitEditing={commit}
      style={[
        styles.splitTimeEdit,
        { color: error ? '#ff6b6b' : accent, borderColor: error ? '#ff6b6b' : `${accent}44` },
      ]}
      keyboardType="numeric"
      selectTextOnFocus
    />
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STROKE_LABELS: Record<StrokeCode, string> = {
  NL: 'Nage libre',
  BRASSE: 'Brasse',
  PAPILLON: 'Papillon',
  DOS: 'Dos',
  '4N': '4 nages',
};

// ─── Main ─────────────────────────────────────────────────────────────────────

type Props = {
  onBack: () => void;
};

export default function TrainingScreen({ onBack }: Props) {
  const { palette } = useAppTheme();
  const { athletes, loading, error, reload } = useTrainingAthletes();
  const [poolLength, setPoolLength] = useState<PoolLength | null>(null);
  const [stroke, setStroke] = useState<StrokeCode | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [startMode, setStartMode] = useState<StartMode | null>(null);
  const [athleteId, setAthleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'stopped'>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [splits, setSplits] = useState<TrainingSplit[]>([]);
  const [saving, setSaving] = useState(false);
  const [performedAt, setPerformedAt] = useState<string>('');

  // ── Editing mode (after stop) ──
  const [editingTime, setEditingTime] = useState(false);

  const startRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const distances = useMemo(() => getAvailableDistances(stroke), [stroke]);
  const expectedSplits = useMemo(() => getExpectedSplitDistances(distance, poolLength), [distance, poolLength]);
  const selectedAthlete = athletes.find((item) => item.id === athleteId) || null;
  const filteredAthletes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return athletes.filter((item) => !q || item.label.toLowerCase().includes(q));
  }, [athletes, search]);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const resetTiming = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    startRef.current = null;
    setElapsedMs(0);
    setSplits([]);
    setPerformedAt('');
    setStatus('idle');
    setEditingTime(false);
  };

  const start = async () => {
    if (!poolLength || !stroke || !distance || !startMode || !selectedAthlete) {
      Alert.alert('Sélection incomplète', 'Choisis le bassin, la nage, la distance, le départ et l\'athlète avant de démarrer.');
      return;
    }
    if (status === 'running') return;
    const now = Date.now();
    startRef.current = now;
    setPerformedAt(formatPerformedAt(new Date(now)));
    setElapsedMs(0);
    setSplits([]);
    setStatus('running');
    setEditingTime(false);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (startRef.current === null) return;
      setElapsedMs(Date.now() - startRef.current);
    }, 30);
  };

  const captureSplit = async () => {
    if (status !== 'running' || startRef.current === null) return;
    const splitIndex = splits.length;
    const distanceM = expectedSplits[splitIndex];
    if (!distanceM) return;
    const timeMs = Date.now() - startRef.current;
    setSplits((prev) => [...prev, { distance_m: distanceM, time_ms: timeMs, order_index: prev.length + 1 }]);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };

  const stop = async () => {
    if (status !== 'running' || startRef.current === null) return;
    const timeMs = Date.now() - startRef.current;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setElapsedMs(timeMs);
    setStatus('stopped');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  };

  // ── Correction après arrêt ──
  const editFinalTime = (ms: number) => setElapsedMs(ms);

  const editSplit = (orderIndex: number, ms: number) => {
    setSplits((prev) =>
      prev.map((s) => (s.order_index === orderIndex ? { ...s, time_ms: ms } : s)),
    );
  };

  const save = async () => {
    if (!poolLength || !stroke || !distance || !startMode || !selectedAthlete || status !== 'stopped') {
      Alert.alert('Enregistrement impossible', 'Termine une prise chronométrique avant l\'enregistrement.');
      return;
    }
    setSaving(true);
    try {
      await saveTrainingPerf({
        athlete_id: selectedAthlete.id,
        athlete_name: selectedAthlete.name,
        stroke_code: stroke,
        distance_m: distance,
        pool_length_m: poolLength,
        start_mode: startMode,
        final_time_ms: elapsedMs,
        splits,
        performed_at: performedAt || formatPerformedAt(),
      });
      Alert.alert('Performance enregistrée', `${selectedAthlete.label} • ${formatMs(elapsedMs)}`);
      resetTiming();
    } catch (err) {
      Alert.alert('Erreur API', err instanceof Error ? err.message : 'Impossible d\'enregistrer la performance.');
    } finally {
      setSaving(false);
    }
  };

  const canSplit = status === 'running' && splits.length < expectedSplits.length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[palette.background, palette.backgroundAlt]} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backBtn} hitSlop={12}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={palette.accent} />
            <Text style={[styles.backText, { color: palette.accent }]}>Training</Text>
          </Pressable>
          <View style={[styles.liveChip, { borderColor: palette.glow, backgroundColor: `${palette.accent}11` }]}>
            <MaterialCommunityIcons name="timer-outline" size={16} color={palette.accent} />
            <Text style={[styles.liveChipText, { color: palette.accent }]}>Mesurer</Text>
          </View>
        </View>

        {/* Sélection */}
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Sélection</Text>
          <Text style={[styles.cardSub, { color: palette.textMuted }]}>Bassin → Nage → Distance → Départ → Athlète</Text>

          <Text style={[styles.stepLabel, { color: palette.textMuted }]}>1. Bassin</Text>
          <View style={styles.rowWrap}>
            {[25, 50].map((value) => (
              <ChoiceChip key={value} value={value as PoolLength} label={`${value} m`} selected={poolLength === value}
                onPress={(next) => { setPoolLength(next as PoolLength); setStroke(null); setDistance(null); setStartMode(null); setAthleteId(null); resetTiming(); }} accent={palette.accent} />
            ))}
          </View>

          <Text style={[styles.stepLabel, { color: palette.textMuted }]}>2. Nage</Text>
          <View style={styles.rowWrap}>
            {(Object.keys(STROKE_LABELS) as StrokeCode[]).map((value) => (
              <ChoiceChip key={value} value={value} label={STROKE_LABELS[value]} selected={stroke === value} disabled={!poolLength}
                onPress={(next) => { setStroke(next as StrokeCode); setDistance(null); setStartMode(null); setAthleteId(null); resetTiming(); }} accent={palette.accent} />
            ))}
          </View>

          <Text style={[styles.stepLabel, { color: palette.textMuted }]}>3. Distance</Text>
          <View style={styles.rowWrap}>
            {distances.map((value) => (
              <ChoiceChip key={value} value={value} label={`${value} m`} selected={distance === value} disabled={!stroke}
                onPress={(next) => { setDistance(next as number); setStartMode(null); setAthleteId(null); resetTiming(); }} accent={palette.accent} />
            ))}
          </View>

          <Text style={[styles.stepLabel, { color: palette.textMuted }]}>4. Départ</Text>
          <View style={styles.rowWrap}>
            {(['PLOT', 'EAU'] as StartMode[]).map((value) => (
              <ChoiceChip key={value} value={value} label={value === 'PLOT' ? 'Plot' : 'Dans l\'eau'} selected={startMode === value} disabled={!distance}
                onPress={(next) => { setStartMode(next as StartMode); setAthleteId(null); resetTiming(); }} accent={palette.accent} />
            ))}
          </View>

          <Text style={[styles.stepLabel, { color: palette.textMuted }]}>5. Athlète</Text>
          <View style={[styles.searchWrap, { borderColor: palette.cardBorder, backgroundColor: palette.surfaceHigh }]}>
            <MaterialCommunityIcons name="account-search-outline" size={18} color={palette.textMuted} />
            <TextInput value={search} onChangeText={setSearch} placeholder="Rechercher un nageur" placeholderTextColor={palette.textMuted}
              style={[styles.searchInput, { color: palette.text }]} editable={!!startMode} />
          </View>
          {loading ? <ActivityIndicator color={palette.accent} style={{ marginTop: 12 }} /> : null}
          {error ? <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text> : null}
          <View style={styles.rowWrap}>
            {filteredAthletes.slice(0, 18).map((item) => (
              <ChoiceChip key={item.id} value={item.id} label={item.label} selected={athleteId === item.id} disabled={!startMode}
                onPress={(next) => { setAthleteId(next as number); resetTiming(); }} accent={palette.accent} />
            ))}
          </View>
          <Pressable onPress={reload} style={styles.reloadAthletes}>
            <Text style={{ color: palette.accent, fontWeight: '700' }}>Recharger les athlètes</Text>
          </Pressable>
        </View>

        {/* Chronomètre */}
        <View style={[styles.timerCard, { backgroundColor: palette.surface, borderColor: `${palette.accent}44`, shadowColor: palette.accent }]}>
          <Text style={[styles.timerLabel, { color: palette.textMuted }]}>Chronomètre sportif</Text>

          {/* Temps : lecture seule en running/idle, éditable en stopped */}
          {status === 'stopped' && editingTime ? (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <TimeEditor valueMs={elapsedMs} onChange={editFinalTime} accent={palette.accent} />
            </View>
          ) : (
            <Text style={[styles.timerValue, { color: palette.text }]}>{formatMs(elapsedMs)}</Text>
          )}

          {/* Bouton correction visible uniquement après arrêt */}
          {status === 'stopped' && (
            <Pressable
              onPress={() => setEditingTime((v) => !v)}
              style={[styles.editTimeBtn, { borderColor: `${palette.accent}55`, backgroundColor: `${palette.accent}11` }]}
            >
              <MaterialCommunityIcons name={editingTime ? 'check' : 'pencil-outline'} size={14} color={palette.accent} />
              <Text style={[styles.editTimeBtnText, { color: palette.accent }]}>
                {editingTime ? 'Valider la correction' : 'Corriger le temps'}
              </Text>
            </Pressable>
          )}

          <Text style={[styles.timerMeta, { color: palette.textMuted }]}>
            {selectedAthlete ? `${selectedAthlete.label} • ` : ''}
            {stroke ? `${STROKE_LABELS[stroke]} • ` : ''}
            {distance ? `${distance}m • ` : ''}
            {poolLength ? `Bassin ${poolLength}m` : 'Prêt'}
          </Text>

          <View style={styles.actionsWrap}>
            <View style={styles.actionRow}>
              <StopwatchButton label="DÉMARRER" onPress={start} disabled={status === 'running'}
                icon="play" textColor={palette.accent} backgroundColor={`${palette.accent}22`} borderColor={`${palette.accent}66`} />
              <StopwatchButton label="SPLIT" onPress={captureSplit} disabled={!canSplit}
                icon="flag-variant-outline" textColor={palette.text} backgroundColor="rgba(255,255,255,0.05)" borderColor={palette.cardBorder} />
            </View>
            <View style={styles.actionRow}>
              <StopwatchButton label="ARRÊTER" onPress={stop} disabled={status !== 'running'}
                icon="stop" textColor="#ff6b6b" backgroundColor="rgba(255,107,107,0.14)" borderColor="rgba(255,107,107,0.4)" />
              <StopwatchButton label="RESET" onPress={resetTiming} disabled={status === 'running'}
                icon="restart" textColor={palette.textMuted} backgroundColor="rgba(255,255,255,0.04)" borderColor={palette.cardBorder} />
            </View>
          </View>
        </View>

        {/* Intermédiaires */}
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Intermédiaires & validation</Text>
          <Text style={[styles.cardSub, { color: palette.textMuted }]}>
            Horodatage : {performedAt || '—'}
          </Text>

          {/* Note d'édition si mode stopped */}
          {status === 'stopped' && (
            <View style={[styles.editHint, { backgroundColor: `${palette.accent}0d`, borderColor: `${palette.accent}33` }]}>
              <MaterialCommunityIcons name="information-outline" size={14} color={palette.accent} />
              <Text style={[styles.editHintText, { color: palette.accent }]}>
                Appuie sur un temps intermédiaire pour le corriger avant l'enregistrement.
              </Text>
            </View>
          )}

          <View style={styles.splitList}>
            {expectedSplits.length === 0 ? (
              <Text style={[styles.emptyLine, { color: palette.textMuted }]}>Aucun intermédiaire attendu pour cette configuration.</Text>
            ) : expectedSplits.map((distanceM, index) => {
              const found = splits[index];
              return (
                <View key={distanceM} style={[styles.splitRow, { borderColor: palette.cardBorder }]}>
                  <Text style={[styles.splitDistance, { color: palette.text }]}>{distanceM} m</Text>
                  {found && status === 'stopped' ? (
                    <SplitEditor split={found} onEdit={editSplit} accent={palette.accent} />
                  ) : (
                    <Text style={[styles.splitTime, { color: found ? palette.accent : palette.textMuted }]}>
                      {found ? formatMs(found.time_ms) : '—'}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* Résumé */}
          <View style={[styles.summaryCard, { backgroundColor: palette.surfaceHigh, borderColor: palette.cardBorder }]}>
            <Text style={[styles.summaryLine, { color: palette.text }]}>Athlète : <Text style={{ color: palette.accent }}>{selectedAthlete?.label || '—'}</Text></Text>
            <Text style={[styles.summaryLine, { color: palette.text }]}>Nage : <Text style={{ color: palette.accent }}>{stroke ? STROKE_LABELS[stroke] : '—'}</Text></Text>
            <Text style={[styles.summaryLine, { color: palette.text }]}>Format : <Text style={{ color: palette.accent }}>{distance ? `${distance}m` : '—'} / {poolLength ? `${poolLength}m` : '—'} / {startMode || '—'}</Text></Text>
            <Text style={[styles.summaryLine, { color: palette.text }]}>Final : <Text style={{ color: palette.accent }}>{status === 'stopped' ? formatMs(elapsedMs) : '—'}</Text></Text>
          </View>

          <Pressable
            onPress={save}
            disabled={saving || status !== 'stopped'}
            style={[styles.saveBtn, { backgroundColor: palette.accent, opacity: saving || status !== 'stopped' ? 0.45 : 1 }]}
          >
            {saving ? <ActivityIndicator color="#04111f" /> : <Text style={styles.saveText}>Enregistrer la performance</Text>}
          </Pressable>
        </View>
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
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  liveChipText: { fontWeight: '800' },
  card: { borderRadius: 24, borderWidth: 1, padding: 18, gap: 10 },
  cardTitle: { fontSize: 20, fontWeight: '800' },
  cardSub: { fontSize: 13, lineHeight: 18 },
  stepLabel: { marginTop: 6, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  choiceChip: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.03)' },
  choiceChipPressed: { transform: [{ scale: 0.98 }] },
  choiceChipText: { color: '#b9ccdd', fontWeight: '700' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 15 },
  reloadAthletes: { paddingVertical: 8, alignSelf: 'flex-start' },
  errorText: { fontSize: 13, marginTop: 8 },

  timerCard: { borderRadius: 32, borderWidth: 1, padding: 22, alignItems: 'center', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  timerLabel: { fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: '800' },
  timerValue: { fontSize: 54, fontWeight: '900', marginTop: 6 },
  timerMeta: { marginTop: 6, fontSize: 13, textAlign: 'center' },

  // ── Time editor ──
  timeEditorWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 6 },
  timeEditorInput: {
    fontSize: 42, fontWeight: '900', textAlign: 'center',
    borderBottomWidth: 2, paddingBottom: 2, minWidth: 160,
  },
  editTimeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, marginTop: 6,
  },
  editTimeBtnText: { fontWeight: '700', fontSize: 13 },

  actionsWrap: { marginTop: 22, marginBottom: 6, alignItems: 'center', width: '100%' },
  actionRow: { flexDirection: 'row', gap: 14, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 8 },
  actionBtn: { minWidth: 148, minHeight: 104, borderRadius: 28, borderWidth: 2, paddingHorizontal: 20, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', gap: 10 },
  actionBtnPressed: { transform: [{ scale: 0.97 }] },
  actionText: { fontWeight: '900', fontSize: 20, letterSpacing: 0.8 },

  // ── Edit hint ──
  editHint: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, borderWidth: 1, padding: 10 },
  editHintText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '600' },

  splitList: { gap: 8 },
  emptyLine: { fontSize: 14 },
  splitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  splitDistance: { fontWeight: '700' },
  splitTime: { fontWeight: '800' },
  splitTimeEdit: {
    fontWeight: '800', fontSize: 15, borderBottomWidth: 1,
    paddingBottom: 2, minWidth: 90, textAlign: 'right',
  },

  summaryCard: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 6, marginTop: 6 },
  summaryLine: { fontSize: 14 },
  saveBtn: { marginTop: 10, borderRadius: 18, paddingVertical: 16, alignItems: 'center' },
  saveText: { color: '#04111f', fontWeight: '900', fontSize: 15 },
});
