import type { GlslPrecision } from "./shaders";

export const EARTH_RADIUS = 6_371_000;
export const VISUAL_OK_METERS = 5;

export type TestConfig = {
  zoom: number;
  tileRes: number;
  precision: GlslPrecision;
};

export type FunctionBreak = {
  idx: number;
  x: number;
  gpuPrev: number;
  gpuCur: number;
  cpuPrev: number;
  cpuCur: number;
  stepBack: number;
};

export type FunctionAnalysis = {
  fnName: string;
  maxErr: number;
  maxErrIdx: number;
  maxErrX: number;
  maxErrGpu: number;
  maxErrCpu: number;
  breaks: FunctionBreak[];
  breakCount: number;
  dupCount: number;
  maxStepBack: number;
};

export type ExpPathAnalysis = {
  tResult: FunctionAnalysis;
  sinAlgResult: FunctionAnalysis;
  cosAlgResult: FunctionAnalysis;
  worstOfSinCosResult: FunctionAnalysis;
};

export type BenchmarkPayload = {
  gpuVendor: string;
  gpuRenderer: string;
  userAgent: string;
  deviceModel: string;
  osName: string;
  zoom: number;
  tileRes: number;
  precision: GlslPrecision;
  numSamples: number;
  sinMaxErr: number;
  cosMaxErr: number;
  sinStepBack: number;
  cosStepBack: number;
  trigEarthErr: number;
  expSinMaxErr: number;
  expCosMaxErr: number;
  expSinStepBack: number;
  expCosStepBack: number;
  expEarthErr: number;
};

export type DashboardRow = BenchmarkPayload & {
  id: number;
  createdAt: string;
};
