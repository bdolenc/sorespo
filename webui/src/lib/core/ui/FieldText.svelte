<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let label = '';
  export let value = '';
  export let placeholder = '';
  export let error = '';
  export let help = '';
  export let yangType = '';
  export let required = false;
  export let disabled = false;
  export let mono = false;

  const dispatch = createEventDispatcher<{ change: string }>();
</script>

<label class="field">
  <span class="field__label">
    {label}
    {#if required}
      <span class="field__required">*</span>
    {/if}
    {#if yangType}
      <span class="field__yang-type">{yangType}</span>
    {/if}
  </span>
  <input
    type="text"
    class:mono
    class:has-error={!!error}
    {value}
    {placeholder}
    {disabled}
    on:input={(event) => dispatch('change', (event.currentTarget as HTMLInputElement).value)}
  />
  {#if help}
    <small class="field__help">{help}</small>
  {/if}
  {#if error}
    <span class="field__error">{error}</span>
  {/if}
</label>

<style>
  .field {
    display: grid;
    gap: 6px;
  }

  .field__label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    color: var(--sw-text-label);
  }

  .field__required {
    color: var(--sw-danger);
    font-weight: 700;
    font-size: 14px;
    line-height: 1;
  }

  .field__yang-type {
    margin-left: auto;
    font-family: var(--sw-font-mono);
    font-size: 10px;
    color: var(--sw-text-muted);
    background: var(--sw-bg-deep);
    padding: 1px 6px;
    border-radius: 3px;
  }

  input {
    width: 100%;
    padding: 9px 12px;
    background: var(--sw-bg-input);
    border: 1px solid var(--sw-border-default);
    border-radius: var(--sw-radius-md);
    color: var(--sw-text-primary);
    font-size: 13px;
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
  }

  input::placeholder {
    color: var(--sw-text-muted);
  }

  input:focus {
    border-color: var(--sw-accent);
    box-shadow: 0 0 0 3px var(--sw-accent-glow);
  }

  input.has-error {
    border-color: var(--sw-danger);
    box-shadow: 0 0 0 3px var(--sw-danger-dim);
  }

  input.mono {
    font-family: var(--sw-font-mono);
    font-size: 12px;
  }

  input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .field__help {
    font-size: 11px;
    color: var(--sw-text-muted);
  }

  .field__error {
    font-size: 11px;
    color: var(--sw-danger);
    display: flex;
    align-items: center;
    gap: 4px;
  }
</style>
