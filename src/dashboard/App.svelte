<script lang="ts">
  import Filters from "./components/Filters.svelte";
  import GpuChart from "./components/GpuChart.svelte";
  import ResultsTable from "./components/ResultsTable.svelte";
  import type { DashboardRow, GpuAggregate } from "./types";

  let gpu = "";
  let precision = "";
  let zoom = "";
  let rows: DashboardRow[] = [];
  let aggregates: GpuAggregate[] = [];
  let loading = false;
  let status = "Loading results...";
  let page = 1;
  const limit = 50;
  let total = 0;

  async function loadData(): Promise<void> {
    loading = true;
    status = "Fetching results...";
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
      });
      if (gpu.trim()) params.set("gpu", gpu.trim());
      if (precision) params.set("precision", precision);
      if (zoom) params.set("zoom", zoom);

      const response = await fetch(`/api/results?${params.toString()}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }

      const json = (await response.json()) as {
        total: number;
        results: DashboardRow[];
        aggregates: GpuAggregate[];
      };
      rows = json.results ?? [];
      aggregates = json.aggregates ?? [];
      total = json.total ?? 0;
      status = `Loaded ${rows.length} / ${total} rows.`;
    } catch (error) {
      status = `Failed to load results: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      loading = false;
    }
  }

  function applyFilters(): void {
    page = 1;
    void loadData();
  }

  function nextPage(): void {
    if (page * limit >= total) return;
    page += 1;
    void loadData();
  }

  function prevPage(): void {
    if (page === 1) return;
    page -= 1;
    void loadData();
  }

  void loadData();
</script>

<h1>GPU Precision Results Dashboard</h1>
<p>
  Community submissions for the sin/cos precision test. <a href="/">Back to benchmark</a>.
</p>

<Filters bind:gpu bind:precision bind:zoom onApply={applyFilters} />

<div class="panel toolbar">
  <div class="status mono">{status}</div>
  <div class="pager">
    <button on:click={prevPage} disabled={loading || page === 1}>Previous</button>
    <span>Page {page}</span>
    <button on:click={nextPage} disabled={loading || page * limit >= total}>Next</button>
  </div>
</div>

<GpuChart {aggregates} />
<ResultsTable rows={rows} />

<style>
  h1 {
    margin: 0 0 8px;
    font-size: 24px;
  }

  p {
    color: var(--muted);
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .status {
    color: var(--muted);
  }

  .pager {
    display: flex;
    align-items: center;
    gap: 8px;
  }
</style>
