import { decryptDataWithKey } from "./crypto";

export async function getHistoryByTxid(
  txId: string,
  aesKey: string,
): Promise<any[]> {
  if (!txId) return [];
  if (!aesKey) return [];

  const gateways = [
    { name: "Arweave Gateway", url: `https://arweave.net/${txId}` },
    { name: "ArDrive Gateway", url: `https://ardrive.net/${txId}` },
    { name: "Turbo Gateway", url: `https://turbo-gateway.com/${txId}` },
  ];

  let encryptedDataFromChain = "";
  for (const gw of gateways) {
    try {
      const res = await fetch(gw.url);
      if (!res.ok) continue;

      const text = await res.text();
      if (text) {
        encryptedDataFromChain = text;
        break;
      }
    } catch (_) {
      // Try next gateway
      continue;
    }
  }

  if (!encryptedDataFromChain) {
    throw new Error(
      "No data found, please try again later (newly uploaded data may take a few minutes to sync to Arweave)",
    );
  }

  const decryptRes = decryptDataWithKey(encryptedDataFromChain, aesKey);
  if (!decryptRes) return [];

  try {
    return JSON.parse(decryptRes);
  } catch (parseErr) {
    console.error("Failed to parse decrypted data:", parseErr);
    return [];
  }
}

