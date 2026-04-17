<script lang="ts">
  import { onMount } from 'svelte';

  import { getServiceModule } from '$lib/core/registry/service-modules';
  import { getListEntryPath, restconfDelete, restconfGetJson } from '$lib/core/restconf/client';
  import ConfirmDialog from '$lib/core/ui/ConfirmDialog.svelte';

  export let data: { moduleId: string; title: string; description: string };

  const serviceModule = getServiceModule(data.moduleId);

  let loading = Boolean(serviceModule?.list);
  let removingId = '';
  let error = '';
  let statusMessage: { type: 'success' | 'error'; text: string } | null = null;
  let pendingRemoval: { id: string; label: string } | null = null;
  let items: { id: string; label: string; description?: string }[] = [];

  onMount(() => {
    if (!serviceModule?.list) {
      loading = false;
      return;
    }

    loadItems();
  });

  async function loadItems(): Promise<void> {
    if (!serviceModule?.list) {
      return;
    }

    try {
      loading = true;
      error = '';
      const response = await restconfGetJson(serviceModule.collectionRestconfRoot ?? serviceModule.restconfRoot);
      items = serviceModule.list(response);
    } catch (loadError) {
      error = loadError instanceof Error ? loadError.message : 'Failed to load existing services.';
    } finally {
      loading = false;
    }
  }

  function openRemoval(item: { id: string; label: string }): void {
    pendingRemoval = item;
  }

  async function confirmRemoval(): Promise<void> {
    if (!serviceModule?.deletable || !pendingRemoval) {
      return;
    }

    const item = pendingRemoval;
    pendingRemoval = null;

    try {
      removingId = item.id;
      error = '';
      statusMessage = null;
      await restconfDelete(getListEntryPath(serviceModule.restconfRoot, item.id));
      await loadItems();
      statusMessage = {
        type: 'success',
        text: `Removed ${item.id}.`
      };
    } catch (removeError) {
      statusMessage = {
        type: 'error',
        text: removeError instanceof Error ? removeError.message : 'Failed to remove service.'
      };
    } finally {
      removingId = '';
    }
  }
</script>

{#if serviceModule}
  <div class="page-header">
    <div>
      <h2>{serviceModule.title}</h2>
      <p>{serviceModule.description}</p>
    </div>
    <div>
      <a class="btn btn-primary" href={`/services/${serviceModule.id}/new`}>Create new</a>
    </div>
  </div>

  {#if statusMessage}
    <div class:service-status--error={statusMessage.type === 'error'} class:service-status--success={statusMessage.type === 'success'} class="service-status">
      {statusMessage.text}
    </div>
  {/if}

  {#if loading}
    <div class="loading-state">Loading {serviceModule.collectionLabel.toLowerCase()}...</div>
  {:else if error}
    <div class="error-state">{error}</div>
  {:else if !serviceModule.list}
    <div class="empty-state">This module does not expose a collection view yet.</div>
  {:else if items.length === 0}
    <div class="empty-state">No existing {serviceModule.collectionLabel.toLowerCase()} were returned by RESTCONF.</div>
  {:else}
    <div class="service-list">
      {#each items as item}
        <article class="card service-list__item">
          <a class="service-list__link" href={`/services/${serviceModule.id}/${encodeURIComponent(item.id)}`}>
            <div class="service-list__copy">
              <h3>{item.label}</h3>
              {#if item.description}
                <p>{item.description}</p>
              {/if}
            </div>
            <span class="pill monospace">{item.id}</span>
          </a>

          {#if serviceModule.deletable}
            <div class="service-list__actions">
              <button class="btn btn-danger btn-sm" type="button" disabled={Boolean(removingId)} on:click={() => openRemoval(item)}>
                {removingId === item.id ? 'Removing...' : 'Remove'}
              </button>
            </div>
          {/if}
        </article>
      {/each}
    </div>
  {/if}

  <ConfirmDialog
    open={pendingRemoval !== null}
    title={pendingRemoval ? `Remove ${pendingRemoval.id}?` : 'Remove service?'}
    message="This removes the RESTCONF entry for this service."
    confirmLabel="Remove"
    on:cancel={() => (pendingRemoval = null)}
    on:confirm={confirmRemoval}
  />
{/if}

<style>
  .service-status {
    margin-bottom: 1rem;
    padding: 0.9rem 1rem;
    border-radius: var(--sw-radius-md);
    border: 1px solid var(--sw-border-default);
    background: var(--sw-bg-card);
  }

  .service-status--success {
    border-color: rgba(34, 197, 94, 0.24);
    background: var(--sw-success-dim);
    color: var(--sw-success);
  }

  .service-status--error {
    border-color: rgba(239, 68, 68, 0.28);
    background: var(--sw-danger-dim);
    color: var(--sw-danger);
  }

  .service-list {
    display: grid;
    gap: 1rem;
  }

  .service-list__item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.2rem;
  }

  .service-list__link {
    display: flex;
    flex: 1;
    min-width: 0;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    text-decoration: none;
  }

  .service-list__copy {
    min-width: 0;
  }

  .service-list__copy h3,
  .service-list__copy p {
    margin: 0;
  }

  .service-list__copy p {
    margin-top: 0.35rem;
    color: var(--text-muted);
  }

  .service-list__actions {
    flex-shrink: 0;
  }

  @media (max-width: 720px) {
    .service-list__item {
      flex-direction: column;
      align-items: stretch;
    }

    .service-list__actions {
      display: flex;
      justify-content: flex-end;
    }
  }
</style>
