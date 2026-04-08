<script lang="ts">
  import Controls from "./components/Controls.svelte";
  import HeroResult from "./components/HeroResult.svelte";
  import DetailPanel from "./components/DetailPanel.svelte";
  import ViolationTable from "./components/ViolationTable.svelte";
  import { analyze, analyzeExpPath, getEarthErrorMeters, getTotalSteps, toSci } from "../lib/analysis";
  import { getDeviceInfo, normalizeGpuInfo } from "../lib/device-info";
  import { getGL, getGPUInfo, runExpTest, runTrigTest } from "../lib/webgl";
  import type { BenchmarkPayload, FunctionAnalysis } from "../lib/types";
  import type { GlslPrecision } from "../lib/shaders";

  let zoom = 13;
  let tileRes = 512;
  let precision: GlslPrecision = "highp";
  let status = 'Ready. Click "Run All Analyses" to start.';
  let progress = 0;
  let running = false;
  let shareResults = true;
  let submitPending = false;
  let submitStatus = "";
  let lastSubmissionId: number | null = null;

  let gpuVendor = "";
  let gpuRenderer = "";

  let sinResult: FunctionAnalysis | null = null;
  let cosResult: FunctionAnalysis | null = null;
  let expResult: Awaited<ReturnType<typeof analyzeExpPath>> | null = null;
  let trigEarthErr = 0;
  let expEarthErr = 0;
  let numSamples = 0;
  let angleStep = 0;
  let mercStep = 0;

  let payloadForSubmit: BenchmarkPayload | null = null;

  async function runTest(): Promise<void> {
    running = true;
    submitStatus = "";
    lastSubmissionId = null;
    progress = 0;
    sinResult = null;
    cosResult = null;
    expResult = null;
    payloadForSubmit = null;
    status = "Initializing...";

    try {
      const totalSteps = getTotalSteps(zoom, tileRes);
      numSamples = totalSteps + 1;
      angleStep = (2 * Math.PI) / totalSteps;
      mercStep = 1 / totalSteps;

      const angles = new Float32Array(numSamples);
      const mercYs = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i += 1) {
        angles[i] = i * angleStep;
        mercYs[i] = i * mercStep;
      }

      const gl = getGL();
      const gpuInfo = normalizeGpuInfo(getGPUInfo(gl));
      gpuVendor = gpuInfo.vendor;
      gpuRenderer = gpuInfo.renderer;

      const trigResult = await runTrigTest(gl, angles, precision, {
        onStatus: (message) => (status = message),
        onProgress: (pct) => (progress = pct)
      });
      const expGpuResult = await runExpTest(gl, mercYs, precision, {
        onStatus: (message) => (status = message),
        onProgress: (pct) => (progress = pct)
      });

      status = "Analyzing sin(x)...";
      sinResult = await analyze(angles, trigResult.gpuSin, "sin", (message) => (status = message));
      progress = 82;

      status = "Analyzing cos(x)...";
      cosResult = await analyze(angles, trigResult.gpuCos, "cos", (message) => (status = message));
      progress = 90;

      status = "Analyzing exp-algebraic path...";
      expResult = await analyzeExpPath(
        mercYs,
        expGpuResult.gpuT,
        expGpuResult.gpuSinAlg,
        expGpuResult.gpuCosAlg,
        (message) => (status = message)
      );

      trigEarthErr = getEarthErrorMeters(
        sinResult.maxErr,
        cosResult.maxErr,
        sinResult.maxStepBack,
        cosResult.maxStepBack
      );
      expEarthErr = getEarthErrorMeters(
        expResult.sinAlgResult.maxErr,
        expResult.cosAlgResult.maxErr,
        expResult.sinAlgResult.maxStepBack,
        expResult.cosAlgResult.maxStepBack
      );

      const device = getDeviceInfo();
      payloadForSubmit = {
        gpuVendor,
        gpuRenderer,
        userAgent: device.userAgent,
        deviceModel: device.deviceModel,
        osName: device.osName,
        zoom,
        tileRes,
        precision,
        numSamples,
        sinMaxErr: sinResult.maxErr,
        cosMaxErr: cosResult.maxErr,
        sinStepBack: sinResult.maxStepBack,
        cosStepBack: cosResult.maxStepBack,
        trigEarthErr,
        expSinMaxErr: expResult.sinAlgResult.maxErr,
        expCosMaxErr: expResult.cosAlgResult.maxErr,
        expSinStepBack: expResult.sinAlgResult.maxStepBack,
        expCosStepBack: expResult.cosAlgResult.maxStepBack,
        expEarthErr
      };

      progress = 100;
      status = `Done. ${numSamples.toLocaleString()} samples analyzed.`;
      if (shareResults) {
        await submitResults();
      } else {
        submitStatus = "Auto-share is disabled. Result was not uploaded.";
      }
    } catch (error) {
      status = `Error: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      running = false;
    }
  }

  async function submitResults(): Promise<void> {
    if (!payloadForSubmit || submitPending) return;
    submitPending = true;
    submitStatus = "Submitting benchmark result...";
    try {
      const response = await fetch("/api/results", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payloadForSubmit)
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }
      const json = (await response.json()) as { id: number };
      lastSubmissionId = json.id;
      submitStatus = "Result submitted successfully.";
    } catch (error) {
      submitStatus = `Submit failed: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      submitPending = false;
    }
  }
</script>

<h1>WebGL Transcendental Function Precision Test</h1>
<p>
  Tests GPU-side <code>sin</code>, <code>cos</code>, and <code>exp</code> precision across the
  input ranges used by web map renderers. The direct path evaluates <code>sin</code>/<code>cos</code>
  for globe-view coordinates, while the exp-algebraic path derives <code>sin</code>/<code>cos</code>
  from <code>exp</code> for Mercator-to-globe conversion. Results are reported as worst-case
  Earth-surface positional error in meters.
  <a href="/dashboard">Open dashboard</a>.
</p>

<Controls bind:zoom bind:tileRes bind:precision bind:shareResults bind:running onRun={runTest} />

<div class="progress"><div class="progress-bar" style="width: {progress}%"></div></div>
<div class="mono status">{status}</div>
{#if submitStatus}
  <div class="mono submit-status">{submitStatus}</div>
{/if}
{#if lastSubmissionId !== null}
  <div class="mono submit-status">Submission id: {lastSubmissionId}</div>
{/if}

{#if gpuRenderer}
  <div class="panel mono">GPU: <b>{gpuRenderer}</b> | Vendor: {gpuVendor}</div>
{/if}

{#if sinResult && cosResult}
  <HeroResult title="Worst-case Earth-surface error (direct sin/cos)" valueMeters={trigEarthErr} {gpuRenderer} />
  <DetailPanel title="Advanced: direct sin/cos summary">
    <ul>
      <li>sin max error: {toSci(sinResult.maxErr)} (step-back: {toSci(sinResult.maxStepBack)})</li>
      <li>cos max error: {toSci(cosResult.maxErr)} (step-back: {toSci(cosResult.maxStepBack)})</li>
      <li>samples: {numSamples.toLocaleString()} | angle step: {toSci(angleStep)}</li>
    </ul>
    <h3>sin top monotonicity violations</h3>
    <ViolationTable rows={sinResult.breaks} />
    <h3>cos top monotonicity violations</h3>
    <ViolationTable rows={cosResult.breaks} />
  </DetailPanel>
{/if}

{#if expResult}
  <HeroResult title="Worst-case Earth-surface error (exp-algebraic path)" valueMeters={expEarthErr} {gpuRenderer} />
  <DetailPanel title="Advanced: exp path summary">
    <ul>
      <li>sin_alg max error: {toSci(expResult.sinAlgResult.maxErr)}</li>
      <li>cos_alg max error: {toSci(expResult.cosAlgResult.maxErr)}</li>
      <li>exp_t max error (raw): {toSci(expResult.tResult.maxErr)}</li>
      <li>mercator_y step: {toSci(mercStep)}</li>
    </ul>
    <h3>sin_alg top monotonicity violations</h3>
    <ViolationTable rows={expResult.sinAlgResult.breaks} />
    <h3>cos_alg top monotonicity violations</h3>
    <ViolationTable rows={expResult.cosAlgResult.breaks} />
  </DetailPanel>
{/if}

<style>
  h1 {
    margin: 0 0 8px;
    font-size: 24px;
  }

  p {
    color: var(--muted);
  }

  .progress {
    width: 100%;
    height: 6px;
    background: var(--border);
    border-radius: 3px;
    overflow: hidden;
    margin: 8px 0;
  }

  .progress-bar {
    height: 100%;
    background: var(--accent);
    transition: width 0.15s;
  }

  .status {
    color: var(--muted);
    font-size: 13px;
    margin-bottom: 10px;
  }

  h3 {
    color: var(--accent);
    font-size: 14px;
    margin-top: 14px;
  }

  .submit-status {
    margin: 4px 0 0;
    color: var(--muted);
  }
</style>
