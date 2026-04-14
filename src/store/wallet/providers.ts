import type {
  WalletProvider,
  Wallet,
  WalletType,
  WalletWindow,
} from "@/store/wallet/types";

function getWalletWindow(): WalletWindow | null {
  return typeof window === "undefined" ? null : (window as WalletWindow);
}

export function isWalletInstalled(walletType: WalletType): boolean {
  //...
}

export function getWalletProviderByType(
  walletType: WalletType,
): WalletProvider | null {
 //...
}

export function getWalletProvider(
  selectedWallet: Wallet | null,
): WalletProvider | null {
 //...
}

export function getWalletNetwork(
  wallets: Wallet[],
  walletType: WalletType,
): string | null {
  return wallets.find((w) => w.id === walletType)?.network ?? null;
}

export function openWalletNetwork(wallets: Wallet[], walletType: WalletType) {
  if (typeof window === "undefined") return;
  const url = getWalletNetwork(wallets, walletType);
  if (!url) return;
  window.open(url, "_blank");
}

