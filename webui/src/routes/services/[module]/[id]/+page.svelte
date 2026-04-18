<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { onDestroy, onMount } from 'svelte';

  import { createDraftStore } from '$lib/core/drafts/draft-store.svelte';
  import { getServiceModule } from '$lib/core/registry/service-modules';
  import { getDraftKey } from '$lib/core/registry/types';
  import { getListEntryPath, restconfDelete, restconfGetJson, restconfPutJson } from '$lib/core/restconf/client';
  import ConfirmDialog from '$lib/core/ui/ConfirmDialog.svelte';
  import ServiceWorkspace from '$lib/core/workspace/ServiceWorkspace.svelte';

  export let data: { moduleId: string; serviceId: string };

  let serviceModule = resolveServiceModule(data.moduleId);
  let store = createDraftStore(serviceModule.createDraft(), serviceModule.validate);
  let draft = serviceModule.createDraft();
  let validation = serviceModule.validate(draft);
  let dirty = false;
  let saving = false;
  let deleting = false;
  let loading = true;
  let validationActive = false;
  let validationKey = 0;
  let confirmDeleteOpen = false;
  let statusMessage: { type: 'success' | 'error'; text: string } | null = null;
  let lastRouteKey = '';

  let unsubscribeDraft = () => {};
  let unsubscribeValidation = () => {};
  let unsubscribeDirty = () => {};

  bindStore(store);

  onDestroy(() => {
    unbindStore();
  });

  $: routeKey = `${data.moduleId}:${data.serviceId}`;
  $: if (browser && routeKey !== lastRouteKey) {
    lastRouteKey = routeKey;
    initializeModule(data.moduleId);
    loadDraft();
  }

  onMount(() => {
    const handleRefresh = () => loadDraft(true);
    window.addEventListener('global-refresh', handleRefresh);

    return () => {
      window.removeEventListener('global-refresh', handleRefresh);
    };
  });

  function resolveServiceModule(moduleId: string) {
    const module = getServiceModule(moduleId);

    if (!module) {
      throw new Error(`Unknown service module: ${moduleId}`);
    }

    return module;
  }

  function unbindStore(): void {
    unsubscribeDraft();
    unsubscribeValidation();
    unsubscribeDirty();
  }

  function bindStore(nextStore: ReturnType<typeof createDraftStore>): void {
    unbindStore();

    store = nextStore;
    unsubscribeDraft = store.draft.subscribe((value) => {
      draft = value;
    });
    unsubscribeValidation = store.validation.subscribe((value) => {
      validation = value;
    });
    unsubscribeDirty = store.dirty.subscribe((value) => {
      dirty = value;
    });
  }

  function initializeModule(moduleId: string): void {
    serviceModule = resolveServiceModule(moduleId);
    bindStore(createDraftStore(serviceModule.createDraft(), serviceModule.validate));
    saving = false;
    deleting = false;
    loading = true;
    validationActive = false;
    validationKey += 1;
    confirmDeleteOpen = false;
    statusMessage = null;
  }

  async function loadDraft(silent = false): Promise<void> {
    const requestKey = routeKey;
    try {
      if (!silent) {
        loading = true;
      }

      statusMessage = null;
      const response = await restconfGetJson(getListEntryPath(serviceModule.restconfRoot, data.serviceId));
      if (requestKey !== routeKey) return;
      store.replace(serviceModule.parse(response));
      validationActive = false;
      validationKey += 1;
    } catch (loadError) {
      if (requestKey !== routeKey) return;
      statusMessage = {
        type: 'error',
        text: loadError instanceof Error ? loadError.message : 'Failed to load service draft.'
      };
    } finally {
      if (requestKey === routeKey) {
        loading = false;
      }
    }
  }

  async function handleSave(): Promise<void> {
    const key = getDraftKey(serviceModule, draft);

    if (!key) {
      statusMessage = {
        type: 'error',
        text: `The "${serviceModule.keyParam}" field is required before saving.`
      };
      return;
    }

    try {
      saving = true;
      statusMessage = null;
      const snapshot = draft;
      const payload = serviceModule.serialize(snapshot);
      await restconfPutJson(getListEntryPath(serviceModule.restconfRoot, key), payload);
      store.markSaved(snapshot);
      statusMessage = {
        type: 'success',
        text: `Saved ${key} successfully.`
      };
    } catch (saveError) {
      statusMessage = {
        type: 'error',
        text: saveError instanceof Error ? saveError.message : 'Failed to save service draft.'
      };
    } finally {
      saving = false;
    }
  }

  async function handleDelete(): Promise<void> {
    if (!serviceModule.deletable) {
      return;
    }

    try {
      deleting = true;
      statusMessage = null;
      await restconfDelete(getListEntryPath(serviceModule.restconfRoot, data.serviceId));
      await goto(`/services/${serviceModule.id}`, {
        invalidateAll: true
      });
    } catch (deleteError) {
      statusMessage = {
        type: 'error',
        text: deleteError instanceof Error ? deleteError.message : 'Failed to delete service draft.'
      };
    } finally {
      deleting = false;
    }
  }

  async function confirmDelete(): Promise<void> {
    confirmDeleteOpen = false;
    await handleDelete();
  }

  function handleReset(): void {
    validationActive = false;
    validationKey += 1;
    statusMessage = null;
    store.reset();
  }
</script>

<div class="page-header">
  <div>
    <div class="breadcrumb">
      <a href="/services">Services</a>
      <span>›</span>
      <a href={`/services/${serviceModule.id}`}>{serviceModule.title}</a>
      <span>›</span>
      <span class="monospace">{data.serviceId}</span>
    </div>
  </div>
</div>

<ServiceWorkspace
  module={serviceModule}
  title={`${serviceModule.title} · ${data.serviceId}`}
  subtitle="Edit an existing RESTCONF list entry using the shared service workspace."
  {draft}
  {validation}
  {dirty}
  {saving}
  {deleting}
  {loading}
  {validationActive}
  {validationKey}
  saveDisabled={!validation.ok || !getDraftKey(serviceModule, draft)}
  showDelete={serviceModule.deletable ?? false}
  deleteDisabled={loading}
  {statusMessage}
  on:change={(event) => store.set(event.detail)}
  on:touch={() => (validationActive = true)}
  on:reset={handleReset}
  on:save={handleSave}
  on:delete={() => (confirmDeleteOpen = true)}
/>

<ConfirmDialog
  open={confirmDeleteOpen}
  title={`Remove ${data.serviceId}?`}
  message="This removes the RESTCONF entry for this service."
  confirmLabel="Remove"
  on:cancel={() => (confirmDeleteOpen = false)}
  on:confirm={confirmDelete}
/>

<style>
  .breadcrumb {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    color: var(--text-muted);
    font-size: 0.95rem;
  }

  .breadcrumb a {
    color: var(--brand);
    text-decoration: none;
  }
</style>
