<script lang="ts">
  import type { FunctionBreak } from "../../lib/types";

  export let rows: FunctionBreak[] = [];
</script>

{#if rows.length > 0}
  <div class="table-wrap">
    <table class="mono">
      <thead>
        <tr>
          <th>#</th>
          <th>idx</th>
          <th>x</th>
          <th>GPU[i-1]</th>
          <th>GPU[i]</th>
          <th>CPU[i-1]</th>
          <th>CPU[i]</th>
          <th>step back</th>
        </tr>
      </thead>
      <tbody>
        {#each rows.slice(0, 30) as row, i}
          <tr class="violation">
            <td>{i + 1}</td>
            <td>{row.idx.toLocaleString()}</td>
            <td>{row.x.toExponential(8)}</td>
            <td>{row.gpuPrev.toExponential(10)}</td>
            <td>{row.gpuCur.toExponential(10)}</td>
            <td>{row.cpuPrev.toExponential(10)}</td>
            <td>{row.cpuCur.toExponential(10)}</td>
            <td>{row.stepBack.toExponential(8)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<style>
  .table-wrap {
    overflow: auto;
    max-height: 50vh;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid var(--border);
    background: var(--panel);
  }
  th,
  td {
    border-bottom: 1px solid var(--border);
    padding: 6px 8px;
    text-align: right;
    white-space: nowrap;
    font-size: 11px;
  }
  th {
    background: var(--th-bg);
    position: sticky;
    top: 0;
  }
  .violation {
    background: rgba(248, 113, 113, 0.12);
  }
</style>
