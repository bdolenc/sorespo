<script lang="ts">
  export let draft: unknown;
  export let payload: unknown;
  export let Preview: any = null;
</script>

<section class="preview-panel card">
  <div class="card-header">
    <h4 style="margin:0; font-size:14px; font-weight:600;">Preview</h4>
    <span class="card-badge" style="margin-left:auto;">RESTCONF payload</span>
  </div>

  <div class="card-body">
    {#if Preview}
      <svelte:component this={Preview} {draft} {payload} />
    {:else}
      <pre>{JSON.stringify(payload, null, 2)}</pre>
    {/if}
  </div>
</section>
