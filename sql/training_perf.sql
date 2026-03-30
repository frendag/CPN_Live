CREATE TABLE IF NOT EXISTS training_perf (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  athlete_id BIGINT NOT NULL,
  stroke_code VARCHAR(20) NOT NULL,
  distance_m INT NOT NULL,
  pool_length_m INT NOT NULL,
  start_mode VARCHAR(10) NOT NULL,
  final_time_ms BIGINT NOT NULL,
  split_count INT NOT NULL DEFAULT 0,
  splits_json JSON,
  performed_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (pool_length_m IN (25, 50)),
  CHECK (start_mode IN ('PLOT', 'EAU'))
);

CREATE INDEX idx_training_perf_athlete ON training_perf (athlete_id);
CREATE INDEX idx_training_perf_performed_at ON training_perf (performed_at);
CREATE INDEX idx_training_perf_analysis 
  ON training_perf (athlete_id, stroke_code, distance_m, pool_length_m);
