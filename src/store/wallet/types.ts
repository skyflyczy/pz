export type WalletType = "phantom" | "binance" | "okx";

export type SolanaWalletProvider = {
  isConnected: boolean;
  publicKey: { toString(): string } | null;
  connect: () => Promise<void>;
  signMessage: (
    message: Uint8Array,
    encoding: string,
  ) => Promise<{ signature: Uint8Array | ArrayLike<number> }>;
  signTransaction: (transaction: unknown) => Promise<unknown>;
};

export type WalletWindow = Window & {
  phantom?: { solana?: SolanaWalletProvider & { isPhantom?: boolean } };
  binancew3w?: { solana?: SolanaWalletProvider };
  okxwallet?: { solana?: SolanaWalletProvider };
};

export interface Wallet {
  id: WalletType;
  name: string;
  icon: string;
  network: string;
}

export interface WalletData {
  address: string;
  _signDerivedKey: string;
  connected?: boolean;
}

export interface UploadResult {
  txId: string;
  hasDataCaches: boolean | null;
  hasFastFinality: boolean | null;
  winc: string;
  uploadSize?: number;
}

export interface Tag {
  name: string;
  value: string;
}

export interface TurboUploadResult {
  id: string;
  dataCaches?: any[];
  fastFinalityIndexes?: any[];
  winc: string;
}

