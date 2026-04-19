<script lang="ts">
  import type { Component } from 'svelte';

  interface Props {
    draft: unknown;
    payload: unknown;
    Preview?: Component<{ draft: unknown; payload: unknown }> | null;
  }

  let { draft, payload, Preview = null }: Props = $props();
</script>

<section class="preview-panel card">
  <div class="card-header">
    <h4 style="margin:0; font-size:14px; font-weight:600;">Preview</h4>
    <span class="card-badge" style="margin-left:auto;">RESTCONF payload</span>
  </div>

  <div class="card-body">
    {#if Preview}
      <Preview {draft} {payload} />
    {:else}
      <pre>{JSON.stringify(payload, null, 2)}</pre>
    {/if}
  </div>
</section>
