<script lang="ts">
  import { browser } from '$app/environment';

  import {
    fetchDevice,
    fetchDeviceRunningConfig,
    fetchDeviceTargetConfig,
    type DeviceInfo
  } from '$lib/core/orchestron/client';

  export let data: { deviceId: string };

  let deviceId = data.deviceId;
  let lastLoadedId = '';

  let device: DeviceInfo | null = null;
  let configViewMode: 'running' | 'target' = 'running';
  let configFormat = 'xml';
  let configData = '';
  let loadingConfig = false;
  let loading = true;
  let error = '';

  $: deviceId = data.deviceId;
  $: if (browser && deviceId && deviceId !== lastLoadedId) {
    lastLoadedId = deviceId;
    loadDevice();
  }

  async function loadDevice(): Promise<void> {
    const requestId = data.deviceId;
    try {
      loading = true;
      error = '';
      const info = await fetchDevice(requestId);
      if (requestId !== data.deviceId) return;
      device = info;
      await loadConfigView('running', requestId);
    } catch (loadError) {
      if (requestId !== data.deviceId) return;
      error = loadError instanceof Error ? loadError.message : 'Failed to load device.';
    } finally {
      if (requestId === data.deviceId) {
        loading = false;
      }
    }
  }

  async function loadConfigView(mode: 'running' | 'target', requestId = data.deviceId): Promise<void> {
    try {
      loadingConfig = true;
      configViewMode = mode;
      configData = '';

      const fetcher = mode === 'running' ? fetchDeviceRunningConfig : fetchDeviceTargetConfig;
      const result = await fetcher(requestId, configFormat);
      if (requestId !== data.deviceId) return;
      configData = result;
    } catch (loadError) {
      if (requestId !== data.deviceId) return;
      configData = `# Error loading ${mode} configuration: ${
        loadError instanceof Error ? loadError.message : 'Unknown failure'
      }`;
    } finally {
      if (requestId === data.deviceId) {
        loadingConfig = false;
      }
    }
  }

  async function changeFormat(format: string): Promise<void> {
    configFormat = format;
    await loadConfigView(configViewMode);
  }
</script>

<div class="page-header">
  <div>
    <div class="breadcrumb">
      <a href="/devices">Devices</a>
      <span>›</span>
      <a href={`/devices/${deviceId}`}>{device?.name || deviceId}</a>
      <span>›</span>
      <span>Configuration</span>
    </div>
    <h2>Device Configuration</h2>
    <p>Inspect the running or target configuration in JSON, XML, GData, or AData form.</p>
  </div>
</div>

{#if loading}
  <div class="loading-state">Loading device...</div>
{:else if error}
  <div class="error-state">{error}</div>
{:else if device}
  <div class="card config-page">
    <div class="config-page__header">
      <h3>{device.name || device.id}</h3>
      <div class="config-page__controls">
        <div class="config-page__control-group">
          <span>View</span>
          <div class="segmented">
            <button class:active={configViewMode === 'running'} type="button" on:click={() => loadConfigView('running')}>Running</button>
            <button class:active={configViewMode === 'target'} type="button" on:click={() => loadConfigView('target')}>Target</button>
          </div>
        </div>

        <div class="config-page__control-group">
          <span>Format</span>
          <div class="segmented">
            <button class:active={configFormat === 'json'} type="button" on:click={() => changeFormat('json')}>JSON</button>
            <button class:active={configFormat === 'xml'} type="button" on:click={() => changeFormat('xml')}>XML</button>
            <button class:active={configFormat === 'gdata'} type="button" on:click={() => changeFormat('gdata')}>GData</button>
            <button class:active={configFormat === 'adata'} type="button" on:click={() => changeFormat('adata')}>AData</button>
          </div>
        </div>
      </div>
    </div>

    <div class="config-page__content">
      {#if loadingConfig}
        <div class="loading-state">Loading configuration...</div>
      {:else}
        <pre>{configData}</pre>
      {/if}
    </div>
  </div>
{/if}

<style>
  .breadcrumb {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 0.7rem;
    color: var(--text-muted);
    font-size: 0.95rem;
  }

  .breadcrumb a {
    color: var(--sw-accent);
    text-decoration: none;
  }

  .breadcrumb a:hover {
    color: var(--sw-text-primary);
  }

  .config-page {
    display: grid;
    gap: 1.25rem;
    padding: 1.5rem;
  }

  .config-page__header {
    display: grid;
    gap: 1rem;
  }

  .config-page__header h3 {
    margin: 0;
  }

  .config-page__controls {
    display: flex;
    gap: 1.25rem;
    flex-wrap: wrap;
  }

  .config-page__control-group {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-wrap: wrap;
  }

  .config-page__control-group > span {
    color: var(--text-muted);
    font-weight: 600;
  }

  .segmented {
    display: flex;
    gap: 2px;
    padding: 3px;
    border-radius: var(--sw-radius-md);
    background: var(--sw-bg-deep);
  }

  .segmented button {
    padding: 7px 14px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--sw-text-secondary);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .segmented button:hover {
    color: var(--sw-text-primary);
  }

  .segmented button.active {
    background: var(--sw-bg-elevated);
    color: var(--sw-accent);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }

  .config-page__content pre {
    margin: 0;
    padding: 1rem;
    min-height: 26rem;
    overflow: auto;
    border-radius: var(--sw-radius-md);
    background: var(--sw-bg-deep);
    border: 1px solid var(--sw-border-subtle);
    color: var(--sw-text-secondary);
  }
</style>
