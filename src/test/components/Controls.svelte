<script lang="ts">
  import type { GlslPrecision } from "../../lib/shaders";

  export let zoom = 13;
  export let tileRes = 512;
  export let precision: GlslPrecision = "highp";
  export let shareResults = true;
  export let running = false;

  export let onRun: () => void;
</script>

<div class="panel controls">
  <label>
    Tile zoom
    <select bind:value={zoom} disabled={running}>
      <option value={10}>z = 10 (524 K)</option>
      <option value={11}>z = 11 (1.0 M)</option>
      <option value={12}>z = 12 (2.1 M)</option>
      <option value={13}>z = 13 (4.2 M)</option>
      <option value={14}>z = 14 (8.4 M)</option>
    </select>
  </label>
  <label>
    Tile resolution
    <select bind:value={tileRes} disabled={running}>
      <option value={256}>256</option>
      <option value={512}>512</option>
      <option value={1024}>1024</option>
    </select>
  </label>
  <label>
    GLSL precision
    <select bind:value={precision} disabled={running}>
      <option value="highp">highp</option>
      <option value="mediump">mediump</option>
    </select>
  </label>
  <button on:click={onRun} disabled={running}>
    {running ? "Running..." : "Run All Analyses"}
  </button>
  <label class="check">
    <input type="checkbox" bind:checked={shareResults} disabled={running} />
    Share results to public dashboard
  </label>
</div>

<style>
  .controls {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: end;
  }

  label {
    color: var(--muted);
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
  }

  select {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text);
    padding: 6px 8px;
  }

  .check {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    color: var(--text);
    font-size: 13px;
    margin-left: 2px;
  }
</style>
