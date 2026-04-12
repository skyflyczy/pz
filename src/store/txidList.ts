import { defineStore } from "pinia";
import { ref } from "vue";

export interface Txid {
  arTxId: string;
  time: number;
  status: string;
}

export const useTxidListStore = defineStore("txidList", () => {
  const txidList = ref<Txid[]>([]);

  const clear = (): void => {
    txidList.value = [];
  };

  const add = (arTxId: string): void => {
    txidList.value.push({
      arTxId,
      time: Date.now(),
      status: "PENDING",
    });
  };

  const setList = (list: Txid[]): void => {
    txidList.value = list;
  };

  const update = (arTxId: string, status: string): void => {
    const item = txidList.value.find((entry) => entry.arTxId === arTxId);
    if (item) {
      item.status = status;
    }
  };

  const removeItem = (item: Txid): void => {
    txidList.value = txidList.value.filter((i) => i.arTxId !== item.arTxId);
  };

  return {
    txidList,
    clear,
    add,
    setList,
    update,
    removeItem,
  };
});
