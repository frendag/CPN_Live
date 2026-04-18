/**
 * app/training.tsx
 * Orchestrateur de la section Training.
 * Gère la navigation interne entre :
 *   - TrainingHub  (choix du mode)
 *   - TrainingScreen (Mesurer)
 *   - TrainingSuivi  (Suivi athlète)
 *
 * Pas d'expo-router push ici : navigation locale par état React
 * pour éviter tout crash hors contexte router (cf. principe useFocusEffect).
 */
import React, { useState } from 'react';
import TrainingHub from '../src/components/TrainingHub';
import TrainingScreen from '../src/components/TrainingScreen';
import TrainingSuivi from '../src/components/TrainingSuivi';

type TrainingView = 'hub' | 'mesurer' | 'suivi';

export default function TrainingRoute() {
  const [view, setView] = useState<TrainingView>('hub');

  if (view === 'mesurer') {
    return <TrainingScreen onBack={() => setView('hub')} />;
  }

  if (view === 'suivi') {
    return <TrainingSuivi onBack={() => setView('hub')} />;
  }

  return (
    <TrainingHub
      onSelect={(mode) => setView(mode === 'mesurer' ? 'mesurer' : 'suivi')}
    />
  );
}
