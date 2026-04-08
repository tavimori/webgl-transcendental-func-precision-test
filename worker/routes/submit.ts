import { Hono } from "hono";
import type { Bindings } from "../types";

type SubmissionBody = {
  gpuVendor: string;
  gpuRenderer: string;
  userAgent: string;
  deviceModel: string;
  osName: string;
  zoom: number;
  tileRes: number;
  precision: "highp" | "mediump";
  numSamples: number;
  sinMaxErr: number;
  cosMaxErr: number;
  sinStepBack: number;
  cosStepBack: number;
  trigEarthErr: number;
  expSinMaxErr: number;
  expCosMaxErr: number;
  expSinStepBack: number;
  expCosStepBack: number;
  expEarthErr: number;
};

export const submitRoute = new Hono<{ Bindings: Bindings }>();

submitRoute.post("/results", async (c) => {
  let payload: SubmissionBody;
  try {
    payload = (await c.req.json()) as SubmissionBody;
  } catch {
    return c.json({ error: "Invalid JSON body." }, 400);
  }

  const validationError = validatePayload(payload);
  if (validationError) {
    return c.json({ error: validationError }, 400);
  }

  const info = await c.env.DB.prepare(
    `INSERT INTO results (
      gpu_vendor, gpu_renderer, user_agent, device_model, os_name,
      zoom, tile_res, precision, num_samples,
      sin_max_err, cos_max_err, sin_step_back, cos_step_back, trig_earth_err,
      exp_sin_max_err, exp_cos_max_err, exp_sin_step_back, exp_cos_step_back, exp_earth_err
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      payload.gpuVendor,
      payload.gpuRenderer,
      payload.userAgent,
      payload.deviceModel,
      payload.osName,
      payload.zoom,
      payload.tileRes,
      payload.precision,
      payload.numSamples,
      payload.sinMaxErr,
      payload.cosMaxErr,
      payload.sinStepBack,
      payload.cosStepBack,
      payload.trigEarthErr,
      payload.expSinMaxErr,
      payload.expCosMaxErr,
      payload.expSinStepBack,
      payload.expCosStepBack,
      payload.expEarthErr
    )
    .run();

  return c.json({ id: info.meta.last_row_id });
});

function validatePayload(body: SubmissionBody): string | null {
  const requiredStrings: Array<keyof SubmissionBody> = [
    "gpuVendor",
    "gpuRenderer",
    "userAgent",
    "deviceModel",
    "osName"
  ];
  for (const key of requiredStrings) {
    if (typeof body[key] !== "string") {
      return `Expected string field: ${key}`;
    }
  }

  if (body.precision !== "highp" && body.precision !== "mediump") {
    return "precision must be highp or mediump";
  }

  const requiredNumbers: Array<keyof SubmissionBody> = [
    "zoom",
    "tileRes",
    "numSamples",
    "sinMaxErr",
    "cosMaxErr",
    "sinStepBack",
    "cosStepBack",
    "trigEarthErr",
    "expSinMaxErr",
    "expCosMaxErr",
    "expSinStepBack",
    "expCosStepBack",
    "expEarthErr"
  ];

  for (const key of requiredNumbers) {
    if (typeof body[key] !== "number" || !Number.isFinite(body[key] as number)) {
      return `Expected finite number field: ${key}`;
    }
  }
  return null;
}
