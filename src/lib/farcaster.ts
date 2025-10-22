import { sdk } from "@farcaster/miniapp-sdk";

export async function readyMiniApp() {
  try {
    await sdk.actions.ready();
  } catch (e) {
    console.error("ready() failed", e);
  }
}

async function hapticSuccess() {
  try {
    const caps = await (sdk as any).getCapabilities?.();
    if (Array.isArray(caps) && caps.includes("haptics.notificationOccurred")) {
      await (sdk as any).haptics?.notificationOccurred?.("success");
    }
  } catch {}
}

type PostCastResult =
  | { cancelled: true }
  | { ok: true; composed: boolean; fallback?: boolean; url?: string };

async function canComposeCast() {
  try {
    const caps = await (sdk as any).getCapabilities?.();
    return Array.isArray(caps) && caps.includes("actions.composeCast");
  } catch {
    return false;
  }
}

function openWarpcastComposer(msg: string) {
  const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(msg)}`;

  try {
    if (sdk.actions?.openUrl) {
      sdk.actions.openUrl(url);
    } else if (typeof window !== "undefined" && typeof window.open === "function") {
      const win = window.open(url, "_blank", "noopener,noreferrer");
      if (!win && typeof window !== "undefined") {
        window.location.href = url;
      }
    }
  } catch (err) {
    console.warn("openUrl fallback failed, redirecting", err);
    if (typeof window !== "undefined") {
      window.location.href = url;
    }
  }

  return { ok: true, composed: false, fallback: true, url } as const;
}

export async function postCastFarcaster(text: string): Promise<PostCastResult> {
  const msg = text?.trim();
  if (!msg) throw new Error("Empty cast text");

  const supportsCompose =
    typeof sdk.actions.composeCast === "function" && (await canComposeCast());

  if (supportsCompose) {
    try {
      const result = await sdk.actions.composeCast({ text: msg });
      if (!result || result.cast === null) {
        return { cancelled: true };
      }
      await hapticSuccess();
      return { ok: true, composed: true };
    } catch (err) {
      console.warn("composeCast failed, falling back to Warpcast composer", err);
    }
  }

  return openWarpcastComposer(msg);
}

export async function isInMiniApp(): Promise<boolean> {
  try {
    return !!(await (sdk as any).isInMiniApp?.());
  } catch {
    return false;
  }
}
