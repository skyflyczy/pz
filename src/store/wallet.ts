import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import binance from "@/assets/images/icon-binance.png";
import phantom from "@/assets/images/icon-phantom.png";
import solflare from "@/assets/images/icon-solflare.png";
import backpack from "@/assets/images/icon-backpack.png";

import { useTipStore } from "./tip";
import {
  getWalletProvider as getWalletProviderFromSelection,
  getWalletProviderByType,
  isWalletInstalled,
  openWalletNetwork,
} from "@/store/wallet/providers";
import { generateSignatureKey } from "./wallet/signatureKey";
import { initTurbo as initTurboClient, uploadFile as uploadFileClient } from "./wallet/turboClient";
import { getHistoryByTxid as getHistoryByTxidClient } from "./wallet/history";
import { aesDecrypt as aesDecryptImpl, aesEncrypt as aesEncryptImpl } from "./wallet/crypto";
import type {
  SolanaWalletProvider,
  Tag,
  TurboUploadResult,
  UploadResult,
  Wallet,
  WalletData,
  WalletType,
} from "./wallet/types";

const WALLET_TYPES: WalletType[] = ["phantom", "binance", "okx"];

export const useWalletStore = defineStore(
  "wallet",
  () => {
    const selectedWallet = ref<Wallet | null>(null);
    const walletData = ref<WalletData>({
      address: "",
      _signDerivedKey: "",
    });


    let walletProvider: SolanaWalletProvider | null = null;
    const uploadResult = ref<UploadResult>({
      txId: "",
      hasDataCaches: null,
      hasFastFinality: null,
      winc: "",
    });
    const wallets = ref<Wallet[]>([
      {
        id: "phantom",
        name: "Phantom Wallet",
        icon: phantom,
        network: "https://phantom.com",
      },
      {
        id: "binance",
        name: "Binance Wallet",
        icon: binance,
        network: "https://www.binance.com/web3wallet",
      },
      {
        id: "solflare",
        name: "Solflare Wallet",
        icon: solflare,
        network: "https://www.solflare.com/download",
      },
      {
        id: "backpack",
        name: "Backpack Wallet",
        icon: backpack,
        network: "https://backpack.app/download",
      },
    ]);
    const balance = ref<number>(0);

    // Getters
    const getWalletData = computed(() => walletData.value);
    const getUploadResult = computed(() => uploadResult.value);
    const getSelectedWallet = computed(() => selectedWallet.value);
    const getWallets = computed(() => wallets.value);
    // Actions

    function setWalletData(data: WalletData) {
      walletData.value = data;
    }

    function setUploadResult(result: UploadResult) {
      uploadResult.value = result;
    }

    function setSelectedWallet(wallet: Wallet | null) {
      selectedWallet.value = wallet;
    }


    function jumpNetwork(walletType: WalletType) {
      selectedWallet.value = null;
      openWalletNetwork(wallets.value, walletType);
    }

    function getWalletProvider(): SolanaWalletProvider | null {
      return getWalletProviderFromSelection(selectedWallet.value);
    }

    async function walletConnectedStatus(): Promise<boolean> {
      const walletType = selectedWallet.value?.id;
      if (!walletType) {
        return false;
      }
      const provider = getWalletProviderByType(walletType);
      if (!provider || provider.publicKey === null || !provider.isConnected) {
        return await connectWallet(walletType);
      }
      return true;
    }

    async function connectWallet(walletType: WalletType): Promise<boolean> {
      if (!WALLET_TYPES.includes(walletType)) return false;

      if (typeof window === "undefined") return false;
      try {
        const installed = isWalletInstalled(walletType);
        if (!installed) {
          jumpNetwork(walletType);
          return false;
        }
        walletProvider = getWalletProviderByType(walletType);
        if (walletProvider == null) {
          return false;
        }

        await walletProvider.connect();
        if (!walletProvider.publicKey) return false;
        const address = walletProvider.publicKey.toString();
        let needSignature = !walletData.value._signDerivedKey;
        if (!walletData.value.address || address !== walletData.value.address) {
          needSignature = true;
        }
        if (needSignature) {
          walletData.value._signDerivedKey = await generateSignatureKey(
            walletProvider,
            address,
          );
        }
        walletData.value.address = walletProvider.publicKey.toString();
        walletData.value.connected = true;
        // Initialize Turbo only when SubtleCrypto is available.
        if (isSubtleCryptoAvailable()) {
          await initTurbo();
        }
        return true;
      } catch (innerError: any) {
        disconnectWallet();
        const errMsg = innerError?.message ? String(innerError.message) : "";
        if (/user rejected/i.test(errMsg)) {
          ElMessage.error("You denied the wallet authorization.");
        } else if (/locked/i.test(errMsg)) {
          ElMessage.error("The wallet is locked. Please unlock it first.");
        } else if (/no accounts/i.test(errMsg)) {
          ElMessage.error(
            "No account found in the wallet. Please create or import one first.",
          );
        } else {
          ElMessage.error("Wallet connection failed.");
        }
        return false;
      }
    }
    function isSubtleCryptoAvailable(): boolean {
      return (
        typeof window !== "undefined" && !!window.crypto && !!window.crypto.subtle
      );
    }

    /** Initialize the Turbo client with the connected wallet. */
    async function initTurbo(): Promise<boolean> {
      if (!isSubtleCryptoAvailable()) {
        console.warn(
          "SubtleCrypto is not available. Turbo initialization skipped.",
        );
        return false;
      }

      if (!walletData.value.address) {
        if (!selectedWallet.value) return false;
        const walletType = selectedWallet.value.id;
        await connectWallet(walletType);
        if (!walletData.value.address) return false;
      }

      if (!walletProvider) {
        const provider = getWalletProvider();
        if (!provider) return false;
        walletProvider = provider;
      }

      if (!walletProvider || !walletData.value.address) return false;

      return await initTurboClient(walletProvider, walletData.value.address);
    }

    async function uploadFile(
      data: string,
      tags: Tag[] = [],
    ): Promise<
      | (TurboUploadResult & {
          hasDataCaches: boolean;
          hasFastFinality: boolean;
          uploadSize: number;
        })
      | false
    > {
      const tipStore = useTipStore();
      try {
        if (!isSubtleCryptoAvailable()) {
          ElMessage.error(
            "SubtleCrypto is unavailable. Upload functionality is disabled.",
          );
          return false;
        }

        await walletConnectedStatus();
        tipStore.updateCurrentTipLoad(false);
        tipStore.currentTipId = tipStore.addTip("Wallet authorization");

        const provider = walletProvider ?? getWalletProvider();
        if (!provider) return false;

        const address = walletData.value.address;
        if (!address) return false;

        const uploadRes = await uploadFileClient(data, tags, provider, address);

        if (uploadRes && uploadRes.id) {
          uploadResult.value.txId = uploadRes.id;
          uploadResult.value.hasDataCaches = uploadRes.hasDataCaches;
          uploadResult.value.hasFastFinality = uploadRes.hasFastFinality;
          uploadResult.value.winc = uploadRes.winc;
          uploadResult.value.uploadSize = uploadRes.uploadSize;
          ElMessage.success("Data successfully uploaded to Arweave.");
          return uploadRes;
        }

        ElMessage.error("Failed to upload data to the blockchain.");
        return false;
      } catch (error: unknown) {
        const errMsg =
          error && typeof error === "object" && "message" in error
            ? String((error as { message: unknown }).message)
            : "";
        tipStore.updateCurrentTipLoad(false);
        if (/402/i.test(errMsg) || /insufficient balance/i.test(errMsg)) {
          tipStore.addFailTip("Failed:Upload failed.");
          ElMessage.error("Upload failed.");
        } else if (/user rejected/i.test(errMsg)) {
          ElMessage.error("Signature authorization was canceled.");
          tipStore.addFailTip("Failed:Signature authorization was canceled.");
        } else {
          tipStore.addFailTip("Failed:Upload failed.");
          ElMessage.error("Upload failed.");
        }
        return false;
      }
    }

    const aesEncrypt = aesEncryptImpl;
    const aesDecrypt = aesDecryptImpl;

    // Encrypted data
    async function encryptData(rawData: string): Promise<string | false> {
      if (!walletData.value._signDerivedKey) {
        ElMessage.warning(
          "Signature key not found. Please reconnect your wallet.",
        );
        return false;
      }
      const aesKey = walletData.value._signDerivedKey;
      return aesEncrypt(rawData, aesKey);
    }

    // Decrypt Data
    async function decryptData(encryptedData: string): Promise<string | false> {
      if (!walletData.value._signDerivedKey) {
        ElMessage.warning(
          "Signature key not found. Please reconnect your wallet.",
        );
        return false;
      }
      const aesKey = walletData.value._signDerivedKey;
      return aesDecrypt(encryptedData, aesKey);
    }

    async function getHistoryByTxid(txId: string): Promise<any[]> {
      if (!walletData.value._signDerivedKey) {
        ElMessage.warning(
          "Signature key not found. Please reconnect your wallet.",
        );
        return [];
      }

      return await getHistoryByTxidClient(
        txId,
        walletData.value._signDerivedKey,
      );
    }

    const disconnectWallet = () => {
      selectedWallet.value = null;
      walletProvider = null;
      walletData.value = {
        address: "",
        connected: false,
        _signDerivedKey: "",
      };
      balance.value = 0;
      uploadResult.value = {
        txId: "",
        hasDataCaches: null,
        hasFastFinality: null,
        winc: "",
        uploadSize: undefined,
      };
    };

    // --------

    return {
      selectedWallet,
      walletData,
      uploadResult,
      wallets,
      balance,
      // Getters
      getWalletData,
      getUploadResult,
      getSelectedWallet,
      getWallets,
      // Actions
      getHistoryByTxid,
      setWalletData,
      setUploadResult,
      setSelectedWallet,
      connectWallet,
      initTurbo,
      // Method
      getWalletProvider,
      uploadFile,
      encryptData,
      decryptData,
      aesEncrypt,
      aesDecrypt,
      disconnectWallet,
      walletConnectedStatus,
    };
  },
  {
    persist: {
      key: "walletPiniaStore",
      storage: localStorage,
    },
  },
);