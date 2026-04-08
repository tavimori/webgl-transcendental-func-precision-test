<script lang="ts">
  import type { DashboardRow } from "../types";

  export let rows: DashboardRow[] = [];
</script>

<div class="panel">
  <h2>Submissions</h2>
  <div class="table-wrap">
    <table class="mono">
      <thead>
        <tr>
          <th>ID</th>
          <th>Created</th>
          <th>GPU</th>
          <th>Vendor</th>
          <th>Device</th>
          <th>OS</th>
          <th>Precision</th>
          <th>Zoom</th>
          <th>Direct Error (m)</th>
          <th>Exp Error (m)</th>
        </tr>
      </thead>
      <tbody>
        {#if rows.length === 0}
          <tr><td colspan="10" class="empty">No rows yet.</td></tr>
        {:else}
          {#each rows as row}
            <tr>
              <td>{row.id}</td>
              <td>{row.created_at}</td>
              <td>{row.gpu_renderer}</td>
              <td>{row.gpu_vendor}</td>
              <td>{row.device_model}</td>
              <td>{row.os_name}</td>
              <td>{row.precision}</td>
              <td>{row.zoom}</td>
              <td>{row.trig_earth_err?.toFixed?.(3) ?? "-"}</td>
              <td>{row.exp_earth_err?.toFixed?.(3) ?? "-"}</td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>

<style>
  h2 {
    margin: 0 0 8px;
  }
  .table-wrap {
    max-height: 60vh;
    overflow: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid var(--border);
  }
  th,
  td {
    border-bottom: 1px solid var(--border);
    font-size: 11px;
    white-space: nowrap;
    text-align: right;
    padding: 6px 8px;
  }
  th {
    background: #26303a;
    position: sticky;
    top: 0;
  }
  .empty {
    text-align: center;
    color: var(--muted);
  }
</style>
