import {
  expVertexShader,
  noopFragmentShader,
  trigVertexShader,
  type GlslPrecision
} from "./shaders";

export type ProgressHandlers = {
  onStatus?: (message: string) => void;
  onProgress?: (percent: number) => void;
};

export type GpuInfo = {
  vendor: string;
  renderer: string;
};

export type TrigGpuResult = {
  gpuSin: Float32Array;
  gpuCos: Float32Array;
};

export type ExpGpuResult = {
  gpuT: Float32Array;
  gpuSinAlg: Float32Array;
  gpuCosAlg: Float32Array;
};

export function getGL(): WebGL2RenderingContext {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const gl = canvas.getContext("webgl2", { antialias: false });
  if (!gl) {
    throw new Error("WebGL2 not available.");
  }
  return gl;
}

export function getGPUInfo(gl: WebGL2RenderingContext): GpuInfo {
  const ext = gl.getExtension("WEBGL_debug_renderer_info");
  return {
    vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
    renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
  };
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertSrc: string,
  fragSrc: string,
  varyings: string[],
  tfMode: number
): WebGLProgram {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  if (!vs) throw new Error("Failed to create vertex shader.");
  gl.shaderSource(vs, vertSrc);
  gl.compileShader(vs);
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    throw new Error(`Vertex shader:\n${gl.getShaderInfoLog(vs)}`);
  }

  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  if (!fs) throw new Error("Failed to create fragment shader.");
  gl.shaderSource(fs, fragSrc);
  gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    throw new Error(`Fragment shader:\n${gl.getShaderInfoLog(fs)}`);
  }

  const prog = gl.createProgram();
  if (!prog) throw new Error("Failed to create GL program.");
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.transformFeedbackVaryings(prog, varyings, tfMode);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(`Link:\n${gl.getProgramInfoLog(prog)}`);
  }
  return prog;
}

export async function runTrigTest(
  gl: WebGL2RenderingContext,
  angles: Float32Array,
  precision: GlslPrecision,
  handlers: ProgressHandlers = {}
): Promise<TrigGpuResult> {
  const gpuSin = new Float32Array(angles.length);
  const gpuCos = new Float32Array(angles.length);

  const prog = createProgram(
    gl,
    trigVertexShader(precision),
    noopFragmentShader(precision),
    ["v_sin", "v_cos"],
    gl.INTERLEAVED_ATTRIBS
  );
  gl.useProgram(prog);

  const attributeLoc = gl.getAttribLocation(prog, "a_angle");
  const batchSize = 1 << 18;
  const numBatches = Math.ceil(angles.length / batchSize);

  for (let batch = 0; batch < numBatches; batch += 1) {
    const offset = batch * batchSize;
    const count = Math.min(batchSize, angles.length - offset);
    handlers.onStatus?.(`sin/cos GPU batch ${batch + 1}/${numBatches}...`);

    const inBuf = gl.createBuffer();
    if (!inBuf) throw new Error("Failed to create input buffer.");
    gl.bindBuffer(gl.ARRAY_BUFFER, inBuf);
    gl.bufferData(gl.ARRAY_BUFFER, angles.subarray(offset, offset + count), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(attributeLoc);
    gl.vertexAttribPointer(attributeLoc, 1, gl.FLOAT, false, 0, 0);

    const outBuf = gl.createBuffer();
    if (!outBuf) throw new Error("Failed to create output buffer.");
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, outBuf);
    gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER, count * 8, gl.STATIC_READ);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, outBuf);

    gl.enable(gl.RASTERIZER_DISCARD);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, count);
    gl.endTransformFeedback();
    gl.disable(gl.RASTERIZER_DISCARD);

    const interleaved = new Float32Array(count * 2);
    gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, interleaved);
    for (let i = 0; i < count; i += 1) {
      gpuSin[offset + i] = interleaved[i * 2];
      gpuCos[offset + i] = interleaved[i * 2 + 1];
    }

    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    gl.deleteBuffer(inBuf);
    gl.deleteBuffer(outBuf);

    handlers.onProgress?.(Math.floor(((batch + 1) / numBatches) * 50));
    await tick();
  }

  return { gpuSin, gpuCos };
}

export async function runExpTest(
  gl: WebGL2RenderingContext,
  mercYs: Float32Array,
  precision: GlslPrecision,
  handlers: ProgressHandlers = {}
): Promise<ExpGpuResult> {
  const gpuT = new Float32Array(mercYs.length);
  const gpuSinAlg = new Float32Array(mercYs.length);
  const gpuCosAlg = new Float32Array(mercYs.length);

  const prog = createProgram(
    gl,
    expVertexShader(precision),
    noopFragmentShader(precision),
    ["v_t", "v_sin_alg", "v_cos_alg"],
    gl.INTERLEAVED_ATTRIBS
  );
  gl.useProgram(prog);
  const attributeLoc = gl.getAttribLocation(prog, "a_merc_y");
  const batchSize = 1 << 18;
  const numBatches = Math.ceil(mercYs.length / batchSize);

  for (let batch = 0; batch < numBatches; batch += 1) {
    const offset = batch * batchSize;
    const count = Math.min(batchSize, mercYs.length - offset);
    handlers.onStatus?.(`exp GPU batch ${batch + 1}/${numBatches}...`);

    const inBuf = gl.createBuffer();
    if (!inBuf) throw new Error("Failed to create input buffer.");
    gl.bindBuffer(gl.ARRAY_BUFFER, inBuf);
    gl.bufferData(gl.ARRAY_BUFFER, mercYs.subarray(offset, offset + count), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(attributeLoc);
    gl.vertexAttribPointer(attributeLoc, 1, gl.FLOAT, false, 0, 0);

    const outBuf = gl.createBuffer();
    if (!outBuf) throw new Error("Failed to create output buffer.");
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, outBuf);
    gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER, count * 12, gl.STATIC_READ);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, outBuf);

    gl.enable(gl.RASTERIZER_DISCARD);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, count);
    gl.endTransformFeedback();
    gl.disable(gl.RASTERIZER_DISCARD);

    const interleaved = new Float32Array(count * 3);
    gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, interleaved);
    for (let i = 0; i < count; i += 1) {
      gpuT[offset + i] = interleaved[i * 3];
      gpuSinAlg[offset + i] = interleaved[i * 3 + 1];
      gpuCosAlg[offset + i] = interleaved[i * 3 + 2];
    }

    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    gl.deleteBuffer(inBuf);
    gl.deleteBuffer(outBuf);

    handlers.onProgress?.(50 + Math.floor(((batch + 1) / numBatches) * 25));
    await tick();
  }

  return { gpuT, gpuSinAlg, gpuCosAlg };
}

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
