import type {
  SolanaWalletProvider,
  Wallet,
  WalletType,
  WalletWindow,
} from "@/store/wallet/types";

function getWalletWindow(): WalletWindow | null {
  return typeof window === "undefined" ? null : (window as WalletWindow);
}

export function isWalletInstalled(walletType: WalletType): boolean {
  const walletWindow = getWalletWindow();
  if (!walletWindow) return false;

  switch (walletType) {
    case "phantom":
      return !!walletWindow.phantom?.solana?.isPhantom;
    case "binance":
      return !!walletWindow.binancew3w?.solana;
    case "solflare":
      return !!walletWindow.solflare;
    case "backpack":
      return !!walletWindow.backpack?.solana;
    default:
      return false;
  }
}

export function getWalletProviderByType(
  walletType: WalletType,
): SolanaWalletProvider | null {
  const walletWindow = getWalletWindow();
  if (!walletWindow) return null;

  switch (walletType) {
    case "phantom":
      return walletWindow.phantom?.solana ?? null;
    case "binance":
      return walletWindow.binancew3w?.solana ?? null;
    case "solflare":
      return walletWindow.solflare ?? null;
    case "backpack":
      return walletWindow.backpack?.solana ?? null;
    default:
      return null;
  }
}

export function getWalletProvider(
  selectedWallet: Wallet | null,
): SolanaWalletProvider | null {
  if (!selectedWallet) return null;
  return getWalletProviderByType(selectedWallet.id);
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

