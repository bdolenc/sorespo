<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import PreviewPanel from '$lib/core/workspace/PreviewPanel.svelte';
  import SaveBar from '$lib/core/workspace/SaveBar.svelte';
  import ValidationPanel from '$lib/core/workspace/ValidationPanel.svelte';

  import type { ServiceModule } from '$lib/core/registry/types';
  import type { ValidationResult } from '$lib/core/validation/types';

  export let module: ServiceModule;
  export let title = module.title;
  export let subtitle = module.description;
  export let draft: unknown;
  export let validation: ValidationResult;
  export let dirty = false;
  export let saving = false;
  export let deleting = false;
  export let saveDisabled = false;
  export let loading = false;
  export let validationActive = false;
  export let validationKey = 0;
  export let statusMessage: { type: 'success' | 'error'; text: string } | null = null;
  export let showDelete = false;
  export let deleteDisabled = false;
  export let deleteLabel = 'Delete';

  const dispatch = createEventDispatcher();
  let Editor: any;

  $: Editor = module.Editor;
  $: payload = module.serialize(draft);

  function forwardChange(event: CustomEvent<unknown>): void {
    dispatch('change', event.detail);
  }
</script>

<div class="workspace">
  <div class="page-header">
    <div>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
    <div class="workspace__meta">
      <span class="pill">{module.collectionLabel}</span>
      <span class:success={validationActive && validation.ok} class:warning={validationActive && !validation.ok} class="pill">
        <span class="dot"></span>
        {#if !validationActive}
          Awaiting input
        {:else if validation.ok}
          Valid
        {:else}
          Needs fixes
        {/if}
      </span>
    </div>
  </div>

  {#if statusMessage}
    <div class="flash {statusMessage.type}">{statusMessage.text}</div>
  {/if}

  {#if loading}
    <div class="loading-state">Loading service data...</div>
  {:else}
    <div class="workspace__grid">
      <section class="workspace__editor card">
        <div class="card-header">
          <h3>Editor</h3>
          <span class="card-badge">{module.id}</span>
          {#if module.Summary}
            <div style="margin-left: auto;">
              <svelte:component this={module.Summary} {draft} />
            </div>
          {/if}
        </div>

        <div class="card-body">
          <svelte:component
            this={Editor}
            {draft}
            errors={validation.errors}
            {validationKey}
            on:change={(event: Event) => forwardChange(event as CustomEvent<unknown>)}
            on:touch={() => dispatch('touch')}
          />
        </div>
      </section>

      <div class="workspace__sidebar">
        <ValidationPanel {validation} active={validationActive} />
        <PreviewPanel {draft} {payload} Preview={module.Preview} />
      </div>
    </div>
  {/if}

  <SaveBar
    {dirty}
    {saving}
    {deleting}
    {saveDisabled}
    {showDelete}
    {deleteDisabled}
    {deleteLabel}
    on:save={() => dispatch('save')}
    on:reset={() => dispatch('reset')}
    on:delete={() => dispatch('delete')}
  />
</div>

<style>
  .workspace {
    display: grid;
    gap: 20px;
  }

  .workspace__meta {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  .workspace__grid {
    display: grid;
    gap: 20px;
    grid-template-columns: minmax(0, 1.7fr) minmax(300px, 0.9fr);
  }

  .workspace__editor,
  .workspace__sidebar {
    min-width: 0;
  }

  .workspace__sidebar {
    display: grid;
    gap: 16px;
    align-content: start;
  }

  @media (max-width: 980px) {
    .workspace__grid {
      grid-template-columns: 1fr;
    }
  }
</style>
