import { PublicKey } from "@solana/web3.js";
import type { SolanaWalletProvider, Tag, TurboUploadResult } from "./types";
import { normalizeSignatureBytes } from "./signatureKey";

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
    console.warn("Failed to load TurboFactory:", e);
    isTurboLoaded = true;
    return false;
  }
}

export async function initTurbo(
  provider: SolanaWalletProvider,
  address: string,
): Promise<boolean> {
  if (!isSubtleCryptoAvailable()) return false;
  const loaded = await ensureTurboLoaded();
  if (!loaded || !TurboFactory) return false;

  const publicKey = new PublicKey(address);
  const walletAdapter = {
    publicKey,
    signMessage: async (messageBytes: Uint8Array) => {
      const { signature } = await provider.signMessage(messageBytes, "utf8");
      return normalizeSignatureBytes(signature);
    },
    signTransaction: async (transaction: unknown) => {
      return await provider.signTransaction(transaction);
    },
  };

  turboInstance = TurboFactory.authenticated({
    token: "solana",
    walletAdapter,
    gatewayUrl: "https://rpc.ankr.com/solana",
  });
  return true;
}

export async function uploadFile(
  data: string,
  tags: Tag[],
  provider: SolanaWalletProvider,
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
    { name: "Upload-From", value: "_localhost_test" },
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

