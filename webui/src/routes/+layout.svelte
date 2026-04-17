<script lang="ts">
  import '../app.css';

  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  import { listServiceModuleMeta } from '$lib/core/registry/service-modules';
  import { fetchAllDeviceQueues } from '$lib/core/orchestron/client';

  const serviceModules = listServiceModuleMeta();

  let totalPendingCount = 0;
  let pollHandle: ReturnType<typeof setInterval> | null = null;

  async function refreshPendingCount(): Promise<void> {
    try {
      totalPendingCount = (await fetchAllDeviceQueues()).length;
    } catch (error) {
      console.error('Failed to fetch queue counts:', error);
    }
  }

  async function handleRefresh(): Promise<void> {
    window.dispatchEvent(new CustomEvent('global-refresh'));
    await Promise.all([refreshPendingCount(), invalidateAll()]);
  }

  onMount(() => {
    refreshPendingCount();
    pollHandle = setInterval(refreshPendingCount, 1000);

    return () => {
      if (pollHandle) {
        clearInterval(pollHandle);
      }
    };
  });

  /** Derive a YANG-path breadcrumb from the current route */
  function getYangSegments(pathname: string): { label: string; current: boolean }[] {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return [{ label: 'dashboard', current: true }];

    return parts.map((p, i) => ({
      label: p,
      current: i === parts.length - 1
    }));
  }

  $: currentPathname = $page.url.pathname;
  $: yangSegments = getYangSegments(currentPathname);
</script>

<svelte:head>
  <title>StratoWeave</title>
</svelte:head>

<div class="app-shell">
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-logo">
      <div class="logo-mark">SW</div>
      <span class="logo-text">StratoWeave</span>
      <span class="logo-version">v0.9</span>
    </div>
    <nav class="sidebar-nav" aria-label="Primary navigation">
      <div class="nav-section">
        <div class="nav-section-label">Overview</div>
        <a
          class="nav-item"
          class:active={currentPathname === '/'}
          href="/"
        >
          <span class="nav-icon">◉</span>
          Dashboard
        </a>
      </div>

      <div class="nav-section">
        <div class="nav-section-label">Network Infra</div>
        <a
          class="nav-item"
          class:active={currentPathname.startsWith('/devices')}
          href="/devices"
        >
          <span class="nav-icon">⬡</span>
          Devices
        </a>
      </div>

      <div class="nav-section">
        <div class="nav-section-label">Operations</div>
        <a
          class="nav-item"
          class:active={currentPathname.startsWith('/operations/config-queue')}
          href="/operations/config-queue"
        >
          <span class="nav-icon">◇</span>
          Config Queue
          {#if totalPendingCount > 0}
            <span class="nav-badge">{totalPendingCount}</span>
          {/if}
        </a>
      </div>

      <div class="nav-section">
        <div class="nav-section-label">Services</div>
        <a
          class="nav-item"
          class:active={currentPathname.startsWith('/services')}
          href="/services"
        >
          <span class="nav-icon">◈</span>
          Service Modules
        </a>

        <div class="nav-subsection">
          {#each serviceModules as serviceModule}
            <a
              class="nav-item nav-item--sub"
              class:active={currentPathname.startsWith(`/services/${serviceModule.id}`)}
              href={`/services/${serviceModule.id}`}
            >
              <span class="nav-icon">·</span>
              {serviceModule.title}
            </a>
          {/each}
        </div>
      </div>
    </nav>
  </aside>

  <!-- Main area -->
  <div class="app-main-wrap">
    <header class="app-header">
      <div class="yang-path">
        {#each yangSegments as seg, i}
          {#if i > 0}
            <span class="separator">/</span>
          {/if}
          <span class="segment" class:current={seg.current}>{seg.label}</span>
        {/each}
      </div>

      <div class="header-actions">
        <button class="btn btn-ghost btn-sm" type="button" on:click={handleRefresh}>
          ⟳ Refresh
        </button>
      </div>
    </header>

    <main class="app-content">
      <slot />
    </main>
  </div>
</div>

<style>
  .nav-subsection {
    display: grid;
    gap: 2px;
    margin-top: 4px;
    padding-left: 12px;
  }

  .nav-item--sub {
    font-size: 12px;
    padding-left: 28px;
    color: var(--sw-text-muted);
  }

  .nav-item--sub .nav-icon {
    width: 12px;
    font-size: 14px;
  }
</style>
