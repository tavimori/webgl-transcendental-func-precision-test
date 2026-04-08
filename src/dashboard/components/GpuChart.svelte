<script lang="ts">
  import { Chart, BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip } from "chart.js";
  import { onDestroy, onMount } from "svelte";
  import type { GpuAggregate } from "../types";

  Chart.register(BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

  export let aggregates: GpuAggregate[] = [];

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  function renderChart(): void {
    chart?.destroy();
    if (!canvas || aggregates.length === 0) return;

    const top = aggregates.slice(0, 10);
    chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: top.map((item) => item.gpuRenderer),
        datasets: [
          {
            label: "Avg Direct Error (m)",
            data: top.map((item) => item.avgTrigEarthErr),
            backgroundColor: "rgba(96, 165, 250, 0.6)"
          },
          {
            label: "Avg Exp Error (m)",
            data: top.map((item) => item.avgExpEarthErr),
            backgroundColor: "rgba(248, 113, 113, 0.6)"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  onMount(renderChart);
  $: renderChart();

  onDestroy(() => chart?.destroy());
</script>

<div class="panel">
  <h2>Top GPUs by Average Error</h2>
  <div class="chart-wrap">
    <canvas bind:this={canvas}></canvas>
  </div>
</div>

<style>
  h2 {
    margin: 0 0 8px;
  }
  .chart-wrap {
    height: 320px;
  }
</style>
