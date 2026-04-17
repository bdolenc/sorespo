<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import FieldSelect from '$lib/core/ui/FieldSelect.svelte';
  import FieldText from '$lib/core/ui/FieldText.svelte';
  import Section from '$lib/core/ui/Section.svelte';
  import { L3VPN_VPN_SERVICE_TOPOLOGY_OPTIONS } from '$lib/modules/l3vpn-vpn-service/model';

  import type { L3VpnVpnServiceDraft } from '$lib/modules/l3vpn-vpn-service/model';

  export let draft: L3VpnVpnServiceDraft;
  export let errors: Record<string, string> = {};
  export let validationKey = 0;

  const dispatch = createEventDispatcher<{ change: L3VpnVpnServiceDraft; touch: void }>();

  function patch(values: Partial<L3VpnVpnServiceDraft>): void {
    dispatch('change', {
      ...draft,
      ...values
    });
  }
</script>

<div class="editor">
  <Section
    title="Identity"
    description="Core IETF L3VPN service identifiers and customer metadata."
    yangPath="ietf-l3vpn-svc:vpn-service"
  >
    <div class="editor__grid editor__grid--2col">
      <FieldText
        label="VPN ID"
        required={true}
        value={draft.vpnId}
        error={errors.vpnId}
        {validationKey}
        placeholder="e.g., acme-65501"
        yangType="svc-id (key)"
        mono={true}
        on:change={(event) => patch({ vpnId: event.detail })}
        on:touch={() => dispatch('touch')}
      />
      <FieldText
        label="Customer name"
        value={draft.customerName}
        error={errors.customerName}
        {validationKey}
        placeholder="e.g., CUSTOMER-1"
        yangType="string"
        help="Optional in the model, but recommended for readable service inventory."
        on:change={(event) => patch({ customerName: event.detail })}
        on:touch={() => dispatch('touch')}
      />
    </div>
  </Section>

  <Section
    title="Topology"
    description="Select the service-wide VPN topology requested by the customer."
    yangPath="ietf-l3vpn-svc:vpn-service/vpn-service-topology"
  >
    <div class="editor__grid">
      <FieldSelect
        label="VPN service topology"
        value={draft.topology}
        options={L3VPN_VPN_SERVICE_TOPOLOGY_OPTIONS}
        error={errors.topology}
        {validationKey}
        yangType="identityref"
        help="`any-to-any` is the YANG default and matches the existing quicklab sample."
        on:change={(event) => patch({ topology: event.detail as L3VpnVpnServiceDraft['topology'] })}
        on:touch={() => dispatch('touch')}
      />
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

  @media (max-width: 720px) {
    .editor__grid--2col {
      grid-template-columns: 1fr;
    }
  }
</style>
