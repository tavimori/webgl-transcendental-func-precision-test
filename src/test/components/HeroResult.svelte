<script lang="ts">
  import { VISUAL_OK_METERS } from "../../lib/types";

  export let title: string;
  export let valueMeters: number;
  export let gpuRenderer = "";
</script>

<div class="hero {valueMeters > VISUAL_OK_METERS ? 'problem' : 'good'}">
  <div class="hero-title">{title}</div>
  <div class="hero-value">{valueMeters.toFixed(3)} m</div>
  <div class="hero-subtitle">
    {#if valueMeters > VISUAL_OK_METERS}
      Above visual threshold ({VISUAL_OK_METERS} m)
    {:else}
      Visually fine (within {VISUAL_OK_METERS} m threshold)
    {/if}
  </div>
  {#if gpuRenderer}
    <div class="hero-meta">GPU: {gpuRenderer}</div>
  {/if}
</div>

<style>
  .hero {
    border-radius: 12px;
    margin: 10px 0;
    padding: 14px 16px;
    border: 1px solid;
  }
  .hero.problem {
    background: rgba(248, 113, 113, 0.1);
    border-color: rgba(248, 113, 113, 0.3);
    color: var(--bad);
  }
  .hero.good {
    background: rgba(74, 222, 128, 0.1);
    border-color: rgba(74, 222, 128, 0.3);
    color: var(--ok);
  }
  .hero-title {
    color: var(--muted);
    font-size: 14px;
  }
  .hero-value {
    font-size: clamp(34px, 11vw, 56px);
    line-height: 1.05;
    font-weight: 800;
  }
  .hero-subtitle {
    color: var(--text);
    margin-top: 8px;
  }
  .hero-meta {
    margin-top: 6px;
    color: var(--muted);
    font-size: 12px;
  }
</style>
