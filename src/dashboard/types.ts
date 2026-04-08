export type DashboardRow = {
  id: number;
  created_at: string;
  gpu_renderer: string;
  gpu_vendor: string;
  device_model: string;
  os_name: string;
  precision: string;
  zoom: number;
  trig_earth_err: number;
  exp_earth_err: number;
};

export type GpuAggregate = {
  gpuRenderer: string;
  sampleCount: number;
  avgTrigEarthErr: number;
  avgExpEarthErr: number;
};
