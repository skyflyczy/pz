import CryptoJS from "crypto-js";

// AES-CBC encryption (generic)
export function aesEncrypt(rawData: string, keyHex: string): string {
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(rawData, CryptoJS.enc.Hex.parse(keyHex), {
    iv,
    mode: (CryptoJS as any).mode.CBC,
    padding: (CryptoJS as any).pad.Pkcs7,
  });

  return CryptoJS.enc.Base64.stringify(iv.concat(encrypted.ciphertext));
}

// AES-CBC decryption (generic)
export function aesDecrypt(encryptedData: string, keyHex: string): string {
  const decoded = CryptoJS.enc.Base64.parse(encryptedData);
  const iv = CryptoJS.lib.WordArray.create(decoded.words.slice(0, 4), 16);
  const ciphertext = CryptoJS.lib.WordArray.create(
    decoded.words.slice(4),
    decoded.sigBytes - 16,
  );

  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext },
    CryptoJS.enc.Hex.parse(keyHex),
    { iv, mode: (CryptoJS as any).mode.CBC, padding: (CryptoJS as any).pad.Pkcs7 },
  );

  return decrypted.toString(CryptoJS.enc.Utf8);
}

export function encryptDataWithKey(rawData: string, keyHex: string): string {
  return aesEncrypt(rawData, keyHex);
}

export function decryptDataWithKey(encryptedData: string, keyHex: string): string {
  return aesDecrypt(encryptedData, keyHex);
}

