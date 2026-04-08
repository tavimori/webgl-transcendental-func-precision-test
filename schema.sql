CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT DEFAULT (datetime('now')),
  gpu_vendor TEXT NOT NULL,
  gpu_renderer TEXT NOT NULL,
  user_agent TEXT,
  device_model TEXT,
  os_name TEXT,
  zoom INTEGER NOT NULL,
  tile_res INTEGER NOT NULL,
  precision TEXT NOT NULL,
  num_samples INTEGER NOT NULL,
  sin_max_err REAL,
  cos_max_err REAL,
  sin_step_back REAL,
  cos_step_back REAL,
  trig_earth_err REAL,
  exp_sin_max_err REAL,
  exp_cos_max_err REAL,
  exp_sin_step_back REAL,
  exp_cos_step_back REAL,
  exp_earth_err REAL
);

CREATE INDEX IF NOT EXISTS idx_results_created_at ON results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_results_gpu_renderer ON results(gpu_renderer);
CREATE INDEX IF NOT EXISTS idx_results_precision ON results(precision);
CREATE INDEX IF NOT EXISTS idx_results_zoom ON results(zoom);
