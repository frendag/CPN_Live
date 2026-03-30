export type StrokeCode = 'NL' | 'BRASSE' | 'PAPILLON' | 'DOS' | '4N';
export type StartMode = 'PLOT' | 'EAU';
export type PoolLength = 25 | 50;
export type TrainingState = 'idle' | 'running' | 'stopped';

export interface TrainingAthlete {
  id: number;
  label: string;
  name: string;
}

export interface TrainingSplit {
  distance_m: number;
  time_ms: number;
  order_index: number;
}

export interface TrainingPerfPayload {
  athlete_id?: number;
  athlete_name: string;
  stroke_code: StrokeCode;
  distance_m: number;
  pool_length_m: PoolLength;
  start_mode: StartMode;
  final_time_ms: number;
  splits: TrainingSplit[];
  performed_at: string;
}

export interface TrainingPerfResponse {
  success?: boolean;
  id?: number;
  message?: string;
}
