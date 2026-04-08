import type { GpuInfo } from "./webgl";

export type DeviceInfo = {
  userAgent: string;
  osName: string;
  deviceModel: string;
};

export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent ?? "";
  return {
    userAgent: ua,
    osName: detectOS(ua),
    deviceModel: detectDeviceModel(ua)
  };
}

export function normalizeGpuInfo(gpuInfo: GpuInfo): GpuInfo {
  return {
    vendor: gpuInfo.vendor || "unknown-vendor",
    renderer: gpuInfo.renderer || "unknown-renderer"
  };
}

function detectOS(ua: string): string {
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/windows nt/i.test(ua)) return "Windows";
  if (/mac os x/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Unknown";
}

function detectDeviceModel(ua: string): string {
  const androidMatch = ua.match(/Android[\s/][^;]*;\s*([^;)\]]+)/i);
  if (androidMatch?.[1]) return androidMatch[1].trim();

  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  return navigator.platform || "Unknown Device";
}
