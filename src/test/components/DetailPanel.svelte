<script lang="ts">
  export let title: string;
</script>

<details>
  <summary>{title}</summary>
  <div class="panel">
    <slot />
  </div>
</details>

<style>
  summary {
    cursor: pointer;
    color: var(--accent);
    margin: 8px 0;
  }
</style>
