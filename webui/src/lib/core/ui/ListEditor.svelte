<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let label = 'Items';
  export let items: string[] = [];
  export let placeholder = 'New item';
  export let emptyLabel = 'No items added yet.';

  const dispatch = createEventDispatcher<{ change: string[] }>();

  let pending = '';

  function updateItem(index: number, value: string): void {
    dispatch(
      'change',
      items.map((item, itemIndex) => (itemIndex === index ? value : item))
    );
  }

  function addItem(): void {
    if (!pending.trim()) {
      return;
    }

    dispatch('change', [...items, pending.trim()]);
    pending = '';
  }

  function removeItem(index: number): void {
    dispatch(
      'change',
      items.filter((_, itemIndex) => itemIndex !== index)
    );
  }
</script>

<div class="list-editor">
  <div class="list-editor__header">
    <strong>{label}</strong>
    <span class="list-editor__count">{items.length}</span>
  </div>

  {#if items.length === 0}
    <p class="list-editor__empty">{emptyLabel}</p>
  {:else}
    <div class="list-editor__items">
      {#each items as item, index}
        <div class="list-editor__row">
          <span class="list-editor__drag">⋮⋮</span>
          <input
            type="text"
            value={item}
            on:input={(event) => updateItem(index, (event.currentTarget as HTMLInputElement).value)}
          />
          <button type="button" class="list-editor__remove" on:click={() => removeItem(index)}>✕</button>
        </div>
      {/each}
    </div>
  {/if}

  <div class="list-editor__add-row">
    <input
      type="text"
      bind:value={pending}
      {placeholder}
      on:keydown={(e) => e.key === 'Enter' && addItem()}
    />
    <button type="button" class="btn btn-sm" on:click={addItem}>Add</button>
  </div>
</div>

<style>
  .list-editor {
    display: grid;
    gap: 10px;
  }

  .list-editor__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    font-weight: 500;
    color: var(--sw-text-label);
  }

  .list-editor__count {
    font-family: var(--sw-font-mono);
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    background: var(--sw-bg-elevated);
    color: var(--sw-text-muted);
  }

  .list-editor__empty {
    margin: 0;
    padding: 12px;
    text-align: center;
    color: var(--sw-text-muted);
    font-size: 12px;
    border: 1px dashed var(--sw-border-default);
    border-radius: var(--sw-radius-md);
  }

  .list-editor__items {
    display: grid;
    gap: 6px;
  }

  .list-editor__row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border: 1px solid var(--sw-border-subtle);
    border-radius: var(--sw-radius-md);
    background: var(--sw-bg-elevated);
    transition: border-color 0.15s;
  }

  .list-editor__row:hover {
    border-color: var(--sw-border-default);
  }

  .list-editor__drag {
    color: var(--sw-text-muted);
    cursor: grab;
    font-size: 11px;
    letter-spacing: 1px;
    user-select: none;
    flex-shrink: 0;
  }

  .list-editor__row input {
    flex: 1;
    padding: 6px 8px;
    background: var(--sw-bg-input);
    border: 1px solid var(--sw-border-default);
    border-radius: var(--sw-radius-sm);
    color: var(--sw-text-primary);
    font-family: var(--sw-font-mono);
    font-size: 12px;
    outline: none;
    transition: border-color 0.15s;
  }

  .list-editor__row input:focus {
    border-color: var(--sw-accent);
  }

  .list-editor__remove {
    background: none;
    border: none;
    color: var(--sw-text-muted);
    cursor: pointer;
    padding: 4px 6px;
    border-radius: var(--sw-radius-sm);
    font-size: 12px;
    transition: all 0.15s;
    opacity: 0;
    flex-shrink: 0;
  }

  .list-editor__row:hover .list-editor__remove {
    opacity: 1;
  }

  .list-editor__remove:hover {
    color: var(--sw-danger);
    background: var(--sw-danger-dim);
  }

  .list-editor__add-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
  }

  .list-editor__add-row input {
    width: 100%;
    padding: 8px 12px;
    background: var(--sw-bg-input);
    border: 1px solid var(--sw-border-default);
    border-radius: var(--sw-radius-md);
    color: var(--sw-text-primary);
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s;
  }

  .list-editor__add-row input::placeholder {
    color: var(--sw-text-muted);
  }

  .list-editor__add-row input:focus {
    border-color: var(--sw-accent);
  }
</style>
