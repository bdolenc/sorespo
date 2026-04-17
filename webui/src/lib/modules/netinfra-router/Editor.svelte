<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import FieldCheckbox from '$lib/core/ui/FieldCheckbox.svelte';
  import FieldNumber from '$lib/core/ui/FieldNumber.svelte';
  import FieldText from '$lib/core/ui/FieldText.svelte';
  import Section from '$lib/core/ui/Section.svelte';

  import type { NetinfraRouterDraft } from '$lib/modules/netinfra-router/model';

  export let draft: NetinfraRouterDraft;
  export let errors: Record<string, string> = {};

  const dispatch = createEventDispatcher<{ change: NetinfraRouterDraft }>();

  function emit(next: NetinfraRouterDraft): void {
    dispatch('change', next);
  }

  function patch(values: Partial<NetinfraRouterDraft>): void {
    emit({
      ...draft,
      ...values,
      featureFlags: {
        ...draft.featureFlags,
        ...(values.featureFlags ?? {})
      }
    });
  }
</script>

<div class="editor">
  <Section title="Identity" description="Core YANG list keys and platform selection." yangPath="netinfra:router">
    <div class="editor__grid editor__grid--2col">
      <FieldText
        label="Router name"
        required={true}
        value={draft.name}
        error={errors.name}
        placeholder="e.g., pe-ams-01"
        yangType="string (key)"
        mono={true}
        on:change={(event) => patch({ name: event.detail })}
      />
      <FieldNumber
        label="Router ID"
        required={true}
        value={draft.id}
        error={errors.id}
        min={1}
        max={4294967295}
        yangType="uint32"
        on:change={(event) => patch({ id: event.detail })}
      />
      <FieldText
        label="Platform type"
        required={true}
        value={draft.type}
        error={errors.type}
        placeholder="e.g., SR Linux, cRPD, Arista EOS"
        yangType="string"
        on:change={(event) => patch({ type: event.detail })}
      />
      <FieldNumber
        label="ASN"
        required={true}
        value={draft.asn}
        error={errors.asn}
        min={1}
        max={4294967295}
        yangType="inet:as-number"
        on:change={(event) => patch({ asn: event.detail })}
      />
    </div>
  </Section>

  <Section title="Operational behavior" description="Optional metadata and behavior flags." yangPath="netinfra:router/*">
    <div class="editor__grid">
      <FieldText
        label="Role"
        value={draft.role}
        error={errors.role}
        placeholder="e.g., PE, P, RR"
        yangType="string"
        help="Optional role metadata used by the service model."
        on:change={(event) => patch({ role: event.detail })}
      />

      <div class="editor__toggles">
        <FieldCheckbox
          label="Mock router"
          checked={draft.mock}
          help="Marks this entry as a mock target in the netinfra model."
          on:change={(event) => patch({ mock: event.detail })}
        />
        <FieldCheckbox
          label="Approval required"
          checked={draft.approvalRequired}
          help="Requires human approval for device queue application."
          on:change={(event) => patch({ approvalRequired: event.detail })}
        />
        <FieldCheckbox
          label="Runtime schema fetch"
          checked={draft.featureFlags.runtimeSchemaFetch}
          help="Enables the feature-flags/runtime-schema-fetch leaf."
          on:change={(event) =>
            patch({
              featureFlags: {
                runtimeSchemaFetch: event.detail
              }
            })}
        />
      </div>
    </div>
  </Section>
</div>

<style>
  .editor {
    display: grid;
    gap: 20px;
  }

  .editor__grid {
    display: grid;
    gap: 16px;
  }

  .editor__grid--2col {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .editor__toggles {
    display: grid;
    gap: 12px;
    padding: 16px;
    border-radius: var(--sw-radius-md);
    background: var(--sw-bg-elevated);
    border: 1px solid var(--sw-border-subtle);
  }

  @media (max-width: 720px) {
    .editor__grid--2col {
      grid-template-columns: 1fr;
    }
  }
</style>
