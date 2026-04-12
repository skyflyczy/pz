// 声明 Solana web3.js 模块
declare module '@solana/web3.js' {
  export class PublicKey {
    constructor(address: string);
  }
}

// 扩展 Window 接口以包含钱包提供者
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
}

// 声明 crypto-js 模块（如果需要）
declare module 'crypto-js' {
  export const AES: any;
  export const enc: any;
  export const lib: any;
  export const SHA256: (message: string) => { toString(): string };
}
