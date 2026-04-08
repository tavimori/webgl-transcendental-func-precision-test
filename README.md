# WebGL Transcendental Function Precision Test (Cloudflare Workers + D1)

This project benchmarks GPU precision of WebGL transcendental functions used in web map globe
rendering. It evaluates `sin`, `cos`, and `exp` math paths and reports worst-case Earth-surface
positional error in meters, with a community dashboard for cross-GPU comparison.

- Benchmark page: `/` (run WebGL precision benchmark, then optionally share)
- Dashboard page: `/dashboard` (explore and filter community benchmark results)
- API: `/api/results` (POST submit, GET list + aggregates)

## What does "error in meters" mean for map rendering?

Web map renderers in globe view evaluate GLSL transcendental functions (`sin`, `cos`, `exp`) to
project every vertex and pixel onto the sphere. Any floating-point error in those functions
translates directly to positional error on the Earth's surface: an error ε in `sin` or `cos`
displaces a point by roughly ε × R meters (R = 6 371 000 m).

Whether that error is visible depends on the pixel size at a given zoom level.

### Meters per pixel at the equator (512 × 512 tiles)

At zoom level z with 512 px tiles, there are 2^z × 512 pixels across the equator (circumference
≈ 40 075 km). Each pixel covers:

| Zoom | Pixels across equator | Meters / pixel | Visible if error > |
| ---- | --------------------: | -------------: | -----------------: |
| 8    |             131 072   |        305.7   |           ~306 m   |
| 9    |             262 144   |        152.9   |           ~153 m   |
| 10   |             524 288   |         76.4   |            ~76 m   |
| 11   |           1 048 576   |         38.2   |            ~38 m   |
| 12   |           2 097 152   |         19.1   |            ~19 m   |
| 13   |           4 194 304   |          9.6   |            ~10 m   |
| 14   |           8 388 608   |          4.8   |             ~5 m   |
| 15   |          16 777 216   |          2.4   |           ~2.4 m   |
| 16   |          33 554 432   |          1.2   |           ~1.2 m   |

**Reading the table:** if the benchmark reports a worst-case error of 5 m, that error could shift
a point by one full pixel at z ≈ 14. At z = 11 (where the Mali bug in
[maplibre-gl-js#7419](https://github.com/maplibre/maplibre-gl-js/issues/7419) is visible), a
pixel spans ~38 m, so only errors ≥ 38 m would cause a one-pixel jump — but errors can still
accumulate or interact with monotonicity violations (step-backs) to produce visual artifacts at
sub-pixel scales.

### Two math paths tested

1. **Direct `sin`/`cos`** — used in globe-view spherical math to convert longitude/latitude to
   3D coordinates. Sampled over [0, 2π].
2. **`exp`-algebraic path** — computes `t = exp(π − y·2π)` from a normalized Mercator y
   coordinate, then derives sin/cos algebraically as `(t²−1)/(t²+1)` and `2t/(t²+1)`. This
   avoids calling `sin`/`cos` directly but depends on `exp` precision.

Both paths report worst-case error and monotonicity violations (places where the GPU output steps
backward when the true function is strictly increasing or decreasing — these can cause tile seams
and overlapping geometry even when the absolute error seems small).

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