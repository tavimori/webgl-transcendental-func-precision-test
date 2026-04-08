import { EARTH_RADIUS, type ExpPathAnalysis, type FunctionAnalysis } from "./types";

const PI = Math.PI;

export function toSci(value: number, digits = 8): string {
  return Number.isFinite(value) ? value.toExponential(digits) : "n/a";
}

export function getTotalSteps(zoom: number, tileRes: number): number {
  return (1 << zoom) * tileRes;
}

export function getEarthErrorMeters(...values: number[]): number {
  return Math.max(...values) * EARTH_RADIUS;
}

export async function analyze(
  angles: Float32Array,
  gpuValues: Float32Array,
  fnName: "sin" | "cos",
  onProgress?: (msg: string) => void
): Promise<FunctionAnalysis> {
  const cpuFn = fnName === "sin" ? Math.sin : Math.cos;
  return analyzeWithCpuFn(angles, gpuValues, fnName, cpuFn, onProgress);
}

export async function analyzeExpPath(
  mercYs: Float32Array,
  gpuT: Float32Array,
  gpuSinAlg: Float32Array,
  gpuCosAlg: Float32Array,
  onProgress?: (msg: string) => void
): Promise<ExpPathAnalysis> {
  const tResult = await analyzeWithCpuFn(
    mercYs,
    gpuT,
    "exp_t",
    (x) => Math.exp(PI - x * 2 * PI),
    onProgress
  );
  const sinAlgResult = await analyzeWithCpuFn(
    mercYs,
    gpuSinAlg,
    "sin_alg(exp)",
    (x) => {
      const t = Math.exp(PI - x * 2 * PI);
      const t2 = t * t;
      return (t2 - 1) / (t2 + 1);
    },
    onProgress
  );
  const cosAlgResult = await analyzeWithCpuFn(
    mercYs,
    gpuCosAlg,
    "cos_alg(exp)",
    (x) => {
      const t = Math.exp(PI - x * 2 * PI);
      const t2 = t * t;
      return (2 * t) / (t2 + 1);
    },
    onProgress
  );
  const worstOfSinCosResult = sinAlgResult.maxErr >= cosAlgResult.maxErr ? sinAlgResult : cosAlgResult;
  return { tResult, sinAlgResult, cosAlgResult, worstOfSinCosResult };
}

async function analyzeWithCpuFn(
  xs: Float32Array,
  gpuVals: Float32Array,
  fnName: string,
  cpuFn: (x: number) => number,
  onProgress?: (msg: string) => void
): Promise<FunctionAnalysis> {
  const result: FunctionAnalysis = {
    fnName,
    maxErr: 0,
    maxErrIdx: -1,
    maxErrX: 0,
    maxErrGpu: 0,
    maxErrCpu: 0,
    breaks: [],
    breakCount: 0,
    dupCount: 0,
    maxStepBack: 0
  };

  let prevCpu = cpuFn(xs[0]);
  updateMaxError(0, xs[0], gpuVals[0], prevCpu, result);

  for (let i = 1; i < xs.length; i += 1) {
    const cpu = cpuFn(xs[i]);
    updateMaxError(i, xs[i], gpuVals[i], cpu, result);

    const expectedDir = Math.sign(cpu - prevCpu);
    const gpuDelta = gpuVals[i] - gpuVals[i - 1];
    const gpuDir = Math.sign(gpuDelta);

    if (gpuDelta === 0 && expectedDir !== 0) {
      result.dupCount += 1;
    }

    if (expectedDir !== 0 && gpuDir !== 0 && gpuDir !== expectedDir) {
      result.breakCount += 1;
      const stepBack = Math.abs(gpuDelta);
      if (stepBack > result.maxStepBack) {
        result.maxStepBack = stepBack;
      }
      if (result.breaks.length < 5000) {
        result.breaks.push({
          idx: i,
          x: xs[i],
          gpuPrev: gpuVals[i - 1],
          gpuCur: gpuVals[i],
          cpuPrev: prevCpu,
          cpuCur: cpu,
          stepBack
        });
      }
    }

    prevCpu = cpu;
    if (i % 500_000 === 0) {
      onProgress?.(`Analyzing ${fnName}... ${Math.floor((i / xs.length) * 100)}%`);
      await tick();
    }
  }

  result.breaks.sort((a, b) => b.stepBack - a.stepBack);
  if (result.maxErrIdx >= 0) {
    result.maxErrX = xs[result.maxErrIdx];
    result.maxErrGpu = gpuVals[result.maxErrIdx];
    result.maxErrCpu = cpuFn(xs[result.maxErrIdx]);
  }
  return result;
}

function updateMaxError(
  idx: number,
  x: number,
  gpuValue: number,
  cpuValue: number,
  result: FunctionAnalysis
): void {
  const err = Math.abs(gpuValue - cpuValue);
  if (err > result.maxErr) {
    result.maxErr = err;
    result.maxErrIdx = idx;
    result.maxErrX = x;
    result.maxErrGpu = gpuValue;
    result.maxErrCpu = cpuValue;
  }
}

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
