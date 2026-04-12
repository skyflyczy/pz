import { defineStore } from "pinia";
import { ref } from "vue";

interface Tip {
  id: string;
  message: string;
  type: string;
  isLoad: boolean;
  txId?: string;
  [key: string]: any;
}

export const useTipStore = defineStore(
    "tip",
    () => {
        const tipList = ref<Tip[]>([]);
        const currentTipId = ref<string>('');

        const clear = () => {
            tipList.value  = []
        }
        const addTip = (message: string, type: string = 'describe', txid: string = ''): string => {
            const tip: Tip = {
                id: Date.now() + '_' + tipList.value.length,
                message,
                type,
                isLoad: type === 'describe'
            };
            if (type === 'submit') {
                tip.txid = txid
            }
            tipList.value.push(tip);
            return tip.id;
        };

        const addFailTip = (message: string): string => {
            return addTip(message, "failed");
        };
        const addSuccessTip = (message: string): string => {
            return addTip(message, "success");
        };
        const updateTip  = (tipId: string, key: string, value: any) => {
            const tip = tipList.value.find(item => item.id === tipId);
            if (tip) tip[key] = value;
        };
        const updateCurrentTipLoad = (value: boolean) => {
            if(currentTipId && currentTipId.value) {
                updateTip(currentTipId.value,"isLoad", value);
            }
        };
        return {
            tipList,
            currentTipId,
            // Actions
            addTip,
            addFailTip,
            addSuccessTip,
            updateCurrentTipLoad,
            clear
        };
    },
);
