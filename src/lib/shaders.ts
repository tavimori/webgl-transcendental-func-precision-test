export type GlslPrecision = "highp" | "mediump";

export function trigVertexShader(precision: GlslPrecision): string {
  return `#version 300 es
precision ${precision} float;
in float a_angle;
out float v_sin;
out float v_cos;
void main() {
  v_sin = sin(a_angle);
  v_cos = cos(a_angle);
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
  gl_PointSize = 1.0;
}`;
}

export function expVertexShader(precision: GlslPrecision): string {
  return `#version 300 es
precision ${precision} float;
const float PI = 3.141592653589793;
in float a_merc_y;
out float v_t;
out float v_sin_alg;
out float v_cos_alg;
void main() {
  float t = exp(PI - a_merc_y * 2.0 * PI);
  float t2 = t * t;
  float denom = t2 + 1.0;
  v_t = t;
  v_sin_alg = (t2 - 1.0) / denom;
  v_cos_alg = (2.0 * t) / denom;
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
  gl_PointSize = 1.0;
}`;
}

export function noopFragmentShader(precision: GlslPrecision): string {
  return `#version 300 es
precision ${precision} float;
out vec4 fragColor;
void main() {
  fragColor = vec4(0.0);
}`;
}
