<script lang="ts">
  import { goto } from '$app/navigation';
  import { onDestroy } from 'svelte';

  import { createDraftStore } from '$lib/core/drafts/draft-store.svelte';
  import { getServiceModule } from '$lib/core/registry/service-modules';
  import { getDraftKey } from '$lib/core/registry/types';
  import { getListEntryPath, restconfPutJson } from '$lib/core/restconf/client';
  import ServiceWorkspace from '$lib/core/workspace/ServiceWorkspace.svelte';

  export let data: { moduleId: string };

  let serviceModule = resolveServiceModule(data.moduleId);
  let store = createDraftStore(serviceModule.createDraft(), serviceModule.validate);
  let lastModuleId = data.moduleId;

  let draft = serviceModule.createDraft();
  let validation = serviceModule.validate(draft);
  let dirty = false;
  let saving = false;
  let validationActive = false;
  let validationKey = 0;
  let statusMessage: { type: 'success' | 'error'; text: string } | null = null;

  let unsubscribeDraft = () => {};
  let unsubscribeValidation = () => {};
  let unsubscribeDirty = () => {};

  bindStore(store);

  onDestroy(() => {
    unbindStore();
  });

  $: if (data.moduleId !== lastModuleId) {
    lastModuleId = data.moduleId;
    initializeModule(data.moduleId);
  }

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
    validationActive = false;
    validationKey += 1;
    saving = false;
    statusMessage = null;
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

      const destination = serviceModule.list
        ? `/services/${serviceModule.id}`
        : `/services/${serviceModule.id}/${encodeURIComponent(key)}`;

      await goto(destination, {
        invalidateAll: true
      });
    } catch (saveError) {
      statusMessage = {
        type: 'error',
        text: saveError instanceof Error ? saveError.message : 'Failed to save service draft.'
      };
    } finally {
      saving = false;
    }
  }

  function handleReset(): void {
    validationActive = false;
    validationKey += 1;
    statusMessage = null;
    store.reset();
  }
</script>

{#if serviceModule}
  <ServiceWorkspace
    module={serviceModule}
    title={`Create ${serviceModule.title}`}
    subtitle="Start from an empty draft, validate it locally, and save directly into RESTCONF."
    {draft}
    {validation}
    {dirty}
    {saving}
    {validationActive}
    {validationKey}
    saveDisabled={!validation.ok || !getDraftKey(serviceModule, draft)}
    {statusMessage}
    on:change={(event) => store.set(event.detail)}
    on:touch={() => (validationActive = true)}
    on:reset={handleReset}
    on:save={handleSave}
  />
{/if}
