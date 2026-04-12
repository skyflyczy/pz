import { defineStore } from "pinia";
import { ref } from "vue";

export type TipKind =
  | "describe"
  | "submit"
  | "failed"
  | "success"
  | "yes"
  | string;

export interface Tip {
  id: string;
  message: string;
  type: TipKind;
  isLoad: boolean;
  txId?: string;
  [key: string]: unknown;
}

export const useTipStore = defineStore("tip", () => {
  const tipList = ref<Tip[]>([]);
  const currentTipId = ref<string>("");

  const clear = (): void => {
    tipList.value = [];
  };

  const addTip = (
    message: string,
    type: TipKind = "describe",
    txid = "",
  ): string => {
    const tip: Tip = {
      id: `${Date.now()}_${tipList.value.length}`,
      message,
      type,
      isLoad: type === "describe",
    };
    if (type === "submit") {
      tip.txId = txid;
    }
    tipList.value.push(tip);
    return tip.id;
  };

  const addFailTip = (message: string): string => addTip(message, "failed");

  const addSuccessTip = (message: string): string =>
    addTip(message, "success");

  const updateTip = (tipId: string, key: string, value: unknown): void => {
    const tip = tipList.value.find((item) => item.id === tipId);
    if (tip) {
      (tip as Record<string, unknown>)[key] = value;
    }
  };

  const updateCurrentTipLoad = (value: boolean): void => {
    if (currentTipId.value) {
      updateTip(currentTipId.value, "isLoad", value);
    }
  };

  return {
    tipList,
    currentTipId,
    addTip,
    addFailTip,
    addSuccessTip,
    updateCurrentTipLoad,
    clear,
  };
});
