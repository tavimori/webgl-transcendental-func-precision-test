import { Hono } from "hono";
import { cors } from "hono/cors";
import { resultsRoute } from "./routes/results";
import { submitRoute } from "./routes/submit";
import type { Bindings } from "./types";

const app = new Hono<{ Bindings: Bindings }>();

app.use("/api/*", cors());
app.get("/api/health", (c) => c.json({ ok: true }));
app.route("/api", submitRoute);
app.route("/api", resultsRoute);

app.get("*", async (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
