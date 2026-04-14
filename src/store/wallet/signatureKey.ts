import CryptoJS from "crypto-js";
import type { WalletProvider } from "./types";

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
  provider: WalletProvider,
  address: string,
): Promise<string> {
 //... Generate a unique message to sign, incorporating the address
}

