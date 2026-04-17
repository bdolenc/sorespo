# StratoWeave Web UI

This frontend is now a SvelteKit application with an adapter-node build target.

## Setup

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000`.

## Route Areas

- `/devices`
- `/operations/config-queue`
- `/services`

## API Integration

The browser only talks to SvelteKit routes under `/api/*`.

- `/api/*` proxies to the existing StratoWeave backend on `http://localhost:15000`
- `/api/restconf/*` proxies to the backend RESTCONF interface

The upstream origin can be overridden with `STRATOWEAVE_API_ORIGIN`.
