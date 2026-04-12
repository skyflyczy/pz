import CryptoJS from "crypto-js";
import type { SolanaWalletProvider } from "./types";

export function normalizeSignatureBytes(
  signature: Uint8Array | ArrayLike<number>,
): Uint8Array {
  return signature instanceof Uint8Array
    ? signature
    : new Uint8Array(signature);
}

export function bytesToHex(bytes: ArrayLike<number>): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function generateSignatureKey(
  provider: SolanaWalletProvider,
  address: string,
): Promise<string> {
  const msgBytes = new TextEncoder().encode(address);
  const { signature } = await provider.signMessage(msgBytes, "utf8");
  const signatureBytes = normalizeSignatureBytes(signature);
  const sigHex = bytesToHex(signatureBytes);
  return CryptoJS.SHA256(sigHex).toString();
}

