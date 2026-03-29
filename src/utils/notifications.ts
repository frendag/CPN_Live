/**
 * notifications.ts — Gestion des push notifications CPN Live
 * 
 * Flux :
 * 1. setupNotifications() au démarrage → demande permission + configure channel Android
 * 2. sendLocalNotification() déclenche une notif native immédiate
 *    (son + vibration + badge + écran verrouillé)
 * 3. NotificationPanel appelle sendLocalNotification() sur chaque nouveau résultat
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// ── Configuration du comportement en foreground ───────────────────────────────
// Afficher la bannière même quand l'app est au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// ── Setup initial (à appeler au démarrage de l'app) ───────────────────────────
export async function setupNotifications(): Promise<boolean> {
  if (!Device.isDevice) {
    // Simulateur : pas de push natif
    console.log('[notifications] simulateur, skip setup');
    return false;
  }

  // Android : créer le channel avec son et vibration
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('cpn-resultats', {
      name:               'Résultats CPN',
      description:        'Alertes en temps réel des résultats de compétition',
      importance:         Notifications.AndroidImportance.HIGH,
      sound:              'default',
      vibrationPattern:   [0, 250, 100, 250],
      enableVibrate:      true,
      showBadge:          true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    await Notifications.setNotificationChannelAsync('cpn-qualif', {
      name:               'Qualifications CPN',
      description:        'Alertes de qualification atteinte',
      importance:         Notifications.AndroidImportance.MAX,
      sound:              'default',
      vibrationPattern:   [0, 400, 200, 400, 200, 400],
      enableVibrate:      true,
      showBadge:          true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  // Demander la permission
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: false,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[notifications] permission refusée');
    return false;
  }

  console.log('[notifications] setup OK');
  return true;
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface NotifPayload {
  athleteNom:       string;
  epreuveLabel:     string;
  tempsResult:      string;
  points?:          string | null;
  rangGeneral?:     string | null;
  deltaSec?:        number | null;
  tendance?:        string | null;
  niveauAtteint?:   string | null;
  niveauSuperieur?: string | null;
  nextDeltaPct?:    number | null;
  nextTemps?:       string | null;
}

// ── Envoi d'une notification locale ──────────────────────────────────────────
export async function sendLocalNotification(payload: NotifPayload): Promise<void> {
  const isQualif = !!payload.niveauAtteint;
  const channel  = isQualif ? 'cpn-qualif' : 'cpn-resultats';

  // Titre
  const title = isQualif
    ? `🏆 ${payload.athleteNom} — ${payload.niveauAtteint} ✅`
    : `⚡ ${payload.athleteNom}`;

  // Corps du message
  const parts: string[] = [
    `${payload.epreuveLabel} : ${payload.tempsResult}`,
  ];
  if (payload.points)      parts.push(payload.points);
  if (payload.rangGeneral) parts.push(`Classé ${payload.rangGeneral}`);
  if (payload.deltaSec !== null && payload.deltaSec !== undefined) {
    const sign = payload.deltaSec < 0 ? '▼' : '▲';
    parts.push(`${sign} ${Math.abs(payload.deltaSec).toFixed(2)}s`);
  }
  if (payload.niveauSuperieur && payload.nextDeltaPct !== null && payload.nextDeltaPct !== undefined) {
    parts.push(`À ${payload.nextDeltaPct > 0 ? '+' : ''}${payload.nextDeltaPct.toFixed(1)}% du ${payload.niveauSuperieur}`);
    if (payload.nextTemps) parts.push(`(seuil : ${payload.nextTemps})`);
  }

  const body = parts.join(' · ');

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound:    'default',
      badge:    1,
      priority: isQualif
        ? Notifications.AndroidNotificationPriority.MAX
        : Notifications.AndroidNotificationPriority.HIGH,
      ...(Platform.OS === 'android' && { channelId: channel }),
      data: { athleteNom: payload.athleteNom, niveauAtteint: payload.niveauAtteint },
    },
    trigger: null,   // null = immédiat
  });
}

// ── Réinitialiser le badge ────────────────────────────────────────────────────
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}
