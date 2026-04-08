import { Hono } from "hono";
import type { Bindings } from "../types";

export const resultsRoute = new Hono<{ Bindings: Bindings }>();

resultsRoute.get("/results", async (c) => {
  const gpu = c.req.query("gpu")?.trim();
  const precision = c.req.query("precision")?.trim();
  const zoom = c.req.query("zoom")?.trim();
  const page = Math.max(1, Number(c.req.query("page") ?? 1) || 1);
  const limit = Math.min(200, Math.max(1, Number(c.req.query("limit") ?? 50) || 50));
  const offset = (page - 1) * limit;

  const where: string[] = [];
  const params: Array<string | number> = [];
  if (gpu) {
    where.push("gpu_renderer LIKE ?");
    params.push(`%${gpu}%`);
  }
  if (precision === "highp" || precision === "mediump") {
    where.push("precision = ?");
    params.push(precision);
  }
  if (zoom && Number.isFinite(Number(zoom))) {
    where.push("zoom = ?");
    params.push(Number(zoom));
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const rowsQuery = `
    SELECT
      id,
      created_at,
      gpu_vendor,
      gpu_renderer,
      user_agent,
      device_model,
      os_name,
      zoom,
      tile_res,
      precision,
      num_samples,
      sin_max_err,
      cos_max_err,
      sin_step_back,
      cos_step_back,
      trig_earth_err,
      exp_sin_max_err,
      exp_cos_max_err,
      exp_sin_step_back,
      exp_cos_step_back,
      exp_earth_err
    FROM results
    ${whereSql}
    ORDER BY id DESC
    LIMIT ?
    OFFSET ?
  `;

  const rows = await c.env.DB.prepare(rowsQuery)
    .bind(...params, limit, offset)
    .all();

  const countQuery = `SELECT COUNT(*) AS count FROM results ${whereSql}`;
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first<{ count: number }>();
  const total = countResult?.count ?? 0;

  const aggregate = await c.env.DB.prepare(
    `SELECT
      gpu_renderer AS gpuRenderer,
      COUNT(*) AS sampleCount,
      AVG(trig_earth_err) AS avgTrigEarthErr,
      AVG(exp_earth_err) AS avgExpEarthErr
     FROM results
     GROUP BY gpu_renderer
     ORDER BY sampleCount DESC, gpu_renderer ASC
     LIMIT 100`
  ).all();

  return c.json({
    page,
    limit,
    total,
    results: rows.results ?? [],
    aggregates: aggregate.results ?? []
  });
});
