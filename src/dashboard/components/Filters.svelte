<script lang="ts">
  export let gpu = "";
  export let precision = "";
  export let zoom = "";
  export let onApply: () => void;
</script>

<div class="panel filters">
  <label>
    GPU contains
    <input bind:value={gpu} placeholder="e.g. Adreno, Apple, Mali" />
  </label>
  <label>
    Precision
    <select bind:value={precision}>
      <option value="">All</option>
      <option value="highp">highp</option>
      <option value="mediump">mediump</option>
    </select>
  </label>
  <label>
    Zoom
    <input bind:value={zoom} type="number" min="0" max="22" />
  </label>
  <button on:click={onApply}>Apply Filters</button>
</div>

<style>
  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 12px;
  }

  label {
    color: var(--muted);
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
  }

  input,
  select {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text);
    padding: 6px 8px;
  }
</style>
