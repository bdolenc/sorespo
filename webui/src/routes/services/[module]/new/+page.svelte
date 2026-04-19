<script lang="ts">
  import { goto } from '$app/navigation';
  import { onDestroy, untrack } from 'svelte';

  import { createDraftStore } from '$lib/core/drafts/draft-store.svelte';
  import { getServiceModule } from '$lib/core/registry/service-modules';
  import { getDraftKey } from '$lib/core/registry/types';
  import { getListEntryPath, restconfPutJson } from '$lib/core/restconf/client';
  import ServiceWorkspace from '$lib/core/workspace/ServiceWorkspace.svelte';

  let { data }: { data: { moduleId: string } } = $props();

  let serviceModule = $state(untrack(() => resolveServiceModule(data.moduleId)));
  let store = $state(untrack(() => createDraftStore(serviceModule.createDraft(), serviceModule.validate)));
  let lastModuleId = $state(untrack(() => data.moduleId));

  let draft = $state(untrack(() => serviceModule.createDraft()));
  let validation = $state(untrack(() => serviceModule.validate(draft)));
  let dirty = $state(false);
  let saving = $state(false);
  let validationActive = $state(false);
  let validationKey = $state(0);
  let statusMessage: { type: 'success' | 'error'; text: string } | null = $state(null);

  let unsubscribeDraft = () => {};
  let unsubscribeValidation = () => {};
  let unsubscribeDirty = () => {};

  untrack(() => bindStore(store));

  onDestroy(() => {
    unbindStore();
  });

  $effect(() => {
    if (data.moduleId === lastModuleId) return;
    lastModuleId = data.moduleId;
    initializeModule(data.moduleId);
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

      await goto(`/services/${serviceModule.id}/${encodeURIComponent(key)}`, {
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
    onchange={(next) => store.set(next)}
    ontouch={() => (validationActive = true)}
    onreset={handleReset}
    onsave={handleSave}
  />
{/if}
