# GPU sin/cos Precision Test (Cloudflare Workers + D1)

This project rewrites the original single-page benchmark into a modular app:

- Benchmark page: `/` (run GPU precision test, then opt-in submit)
- Dashboard page: `/dashboard` (browse and filter submitted results)
- API: `/api/results` (POST submit, GET list + aggregates)

## Stack

- Frontend: Svelte + Vite (multi-page)
- Backend: Hono on Cloudflare Workers
- Database: Cloudflare D1

## Project Layout

- `src/test` benchmark UI
- `src/dashboard` dashboard UI
- `src/lib` shared WebGL/analysis/device modules
- `worker` Hono routes + worker entry
- `schema.sql` canonical DB schema
- `migrations/0001_init.sql` D1 migration

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start frontend dev server:

```bash
npm run dev
```

3. Optional type-check:

```bash
npm run typecheck
```

## Cloudflare Setup

1. Create D1 database (once):

```bash
wrangler d1 create gpu_precision_db
```

2. Copy the returned database ID into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "gpu_precision_db"
database_id = "YOUR_DATABASE_ID"
```

3. Apply migration:

```bash
npm run d1:migrate:remote
```

## Build and Deploy

Build static assets:

```bash
npm run build
```

Deploy worker + static assets:

```bash
npm run deploy
```

## API Reference

### `POST /api/results`

Accepts benchmark payload fields:
- device/GPU info (`gpuVendor`, `gpuRenderer`, `deviceModel`, `osName`, `userAgent`)
- test config (`zoom`, `tileRes`, `precision`, `numSamples`)
- result metrics (direct path + exp path errors/step-backs + earth error meters)

Returns:

```json
{ "id": 123 }
```

### `GET /api/results`

Query params:
- `gpu` (substring filter on renderer)
- `precision` (`highp` or `mediump`)
- `zoom` (integer)
- `page` (default 1)
- `limit` (default 50, max 200)

Returns paginated rows plus per-GPU aggregates.