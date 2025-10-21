import { sdk } from "@farcaster/miniapp-sdk";

export async function readyMiniApp() {
  try { await sdk.actions.ready(); } catch (e) { console.error("ready() failed", e); }
}

async function hapticSuccess() {
  try {
    const caps = await (sdk as any).getCapabilities?.();
    if (Array.isArray(caps) && caps.includes("haptics.notificationOccurred")) {
      await (sdk as any).haptics?.notificationOccurred?.("success");
    }
  } catch {}
}

export async function postCastFarcaster(text: string) {
  const msg = text?.trim();
  if (!msg) throw new Error("Empty cast text");

  if (sdk.actions.requestPermissions) {
    const granted = await sdk.actions.requestPermissions(["cast"]);
    if (!granted?.includes?.("cast")) throw new Error("Cast permission not granted");
  }
  if (sdk.actions.composeCast) {
    const r = await sdk.actions.composeCast({ text: msg });
    if (r === null) return { cancelled: true };
    await hapticSuccess();
    return { ok: true, composed: true };
  }
  await (sdk as any).actions?.cast?.(msg);
  await hapticSuccess();
  return { ok: true, composed: false };
}

export async function isInMiniApp(): Promise<boolean> {
  try { return !!(await (sdk as any).isInMiniApp?.()); } catch { return false; }
}
