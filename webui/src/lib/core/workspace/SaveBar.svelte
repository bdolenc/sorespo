<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let dirty = false;
  export let saving = false;
  export let saveDisabled = false;
  export let saveLabel = 'Save';

  const dispatch = createEventDispatcher<{
    save: void;
    reset: void;
  }>();
</script>

<div class="save-bar card">
  <div class="card-body save-bar__inner">
    <div class="save-bar__status">
      <strong class:dirty>{dirty ? 'Unsaved changes' : 'Draft is up to date'}</strong>
      <span>{dirty ? 'Review the validation panel and save when ready.' : 'No pending edits in this workspace.'}</span>
    </div>

    <div class="save-bar__actions">
      <button class="btn" type="button" disabled={!dirty || saving} on:click={() => dispatch('reset')}>
        Reset
      </button>
      <button class="btn btn-primary" type="button" disabled={saveDisabled || saving} on:click={() => dispatch('save')}>
        {saving ? 'Saving...' : saveLabel}
      </button>
    </div>
  </div>
</div>

<style>
  .save-bar__inner {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
  }

  .save-bar__status {
    display: grid;
    gap: 2px;
  }

  .save-bar__status strong {
    font-size: 13px;
    color: var(--sw-text-primary);
  }

  .save-bar__status strong.dirty {
    color: var(--sw-warning);
  }

  .save-bar__status span {
    color: var(--sw-text-muted);
    font-size: 12px;
  }

  .save-bar__actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  @media (max-width: 720px) {
    .save-bar__inner {
      flex-direction: column;
      align-items: stretch;
    }

    .save-bar__actions {
      justify-content: stretch;
    }

    .save-bar__actions :global(.btn) {
      flex: 1;
    }
  }
</style>
