import type { WalletProvider, Tag, TurboUploadResult } from "./types";

let TurboFactory: any = null;
let isTurboLoaded = false;
let turboInstance: any = null;

export function isSubtleCryptoAvailable(): boolean {
  return typeof window !== "undefined" && !!window.crypto && !!window.crypto.subtle;
}

async function ensureTurboLoaded(): Promise<boolean> {
  if (TurboFactory || isTurboLoaded) return !!TurboFactory;
  try {
    const turboModule = await import("@ardrive/turbo-sdk/web");
    TurboFactory = turboModule.TurboFactory;
    isTurboLoaded = true;
    return true;
  } catch (e) {
    console.error("Failed to load TurboFactory:", e);
    isTurboLoaded = true;
    return false;
  }
}

/**
 * Initializes the Turbo client with the provided wallet provider and address.
 * @param provider
 * @param address
 */
export async function initTurbo(
  provider: WalletProvider,
  address: string,
): Promise<boolean> {
  if (!isSubtleCryptoAvailable()) return false;
  //... Ensure TurboFactory is loaded
  return true;
}

export async function uploadFile(
  data: string,
  tags: Tag[],
  provider: WalletProvider,
  address: string,
): Promise<
  | (TurboUploadResult & {
      hasDataCaches: boolean;
      hasFastFinality: boolean;
      uploadSize: number;
    })
  | false
> {
  if (!isSubtleCryptoAvailable()) return false;
  if (!provider) return false;
  if (!address) return false;

  if (!turboInstance) {
    const ok = await initTurbo(provider, address);
    if (!ok || !turboInstance) return false;
  }

  const dataBlob = new Blob([data], { type: "text/plain; charset=utf-8" });

  const defaultTags: Tag[] = [
    { name: "Content-Type", value: "text/plain; charset=utf-8" },
    { name: "Upload-Type", value: "encrypted-text" },
    { name: "Upload-From", value: "Philosophical_Zombie" },
  ];

  const mergedTags = [...defaultTags, ...tags];

  const uploadRes = await turboInstance.uploadFile({
    fileStreamFactory: () => dataBlob.stream(),
    fileSizeFactory: () => dataBlob.size,
    dataItemOpts: { tags: mergedTags },
  });

  if (uploadRes && uploadRes.id) {
    const hasDataCaches =
      uploadRes.dataCaches && uploadRes.dataCaches.length > 0;
    const hasFastFinality =
      uploadRes.fastFinalityIndexes &&
      uploadRes.fastFinalityIndexes.length > 0;

    return {
      ...(uploadRes as TurboUploadResult),
      hasDataCaches,
      hasFastFinality,
      uploadSize: dataBlob.size,
    };
  }

  return false;
}

