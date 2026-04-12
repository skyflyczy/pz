declare module "@solana/web3.js" {
  export class PublicKey {
    constructor(address: string);
  }
}

/** Browser wallet injection points (Phantom, Binance Web3, OKX). */
declare interface Window {
  phantom?: {
    solana?: {
      isPhantom: boolean;
      isConnected: boolean;
      connect(): Promise<void>;
      signMessage(message: Uint8Array, type: string): Promise<{ signature: Uint8Array }>;
      signTransaction(transaction: any): Promise<any>;
      publicKey: { toString(): string };
    };
  };
  binancew3w?: {
    solana?: {
      isConnected: boolean;
      connect(): Promise<void>;
      signMessage(message: Uint8Array, type: string): Promise<{ signature: Uint8Array }>;
      signTransaction(transaction: any): Promise<any>;
      publicKey: { toString(): string };
    };
  };
  okxwallet?: {
    solana?: {
      isConnected: boolean;
      connect(): Promise<void>;
      signMessage(message: Uint8Array, type: string): Promise<{ signature: Uint8Array }>;
      signTransaction(transaction: any): Promise<any>;
      publicKey: { toString(): string };
    };
  };
  backpack?: {
    solana?: {
      isConnected: boolean;
      connect(): Promise<void>;
      signMessage(message: Uint8Array, type: string): Promise<{ signature: Uint8Array }>;
      signTransaction(transaction: any): Promise<any>;
      publicKey: { toString(): string };
    };
  };
}

declare module "crypto-js" {
  export const AES: any;
  export const enc: any;
  export const lib: any;
  export const SHA256: (message: string) => { toString(): string };
}
