import { defineStore } from "pinia";
import { ref } from "vue";

interface Txid {
  arTxId: string;
  time: number;
  status: string;
}

export const useTxidListStore = defineStore(
    "txidList",
    () => {
        const txidList = ref<Txid[]>([]);

        // Actions
        const clear = () => {
            txidList.value  = []
        }
        const add = (arTxId: string) => {
            txidList.value.push({
                arTxId,
                time: Date.now(),
                status: 'PENDING'
            });
        };
        const setList = (list: Txid[]) => {
            txidList.value = list
        }
        const update = (arTxId: string, status: string) => {
            const item = txidList.value.find((item) => item.arTxId === arTxId);
            if (item) {
                item.status = status;
            }
        };
        const removeItem = (item: Txid) => {
            txidList.value = txidList.value.filter((i) => i.arTxId !== item.arTxId);
        }

        return {
            txidList,
            // Actions
            clear,
            add,
            setList,
            update,
            removeItem,
        };
    },
);
