import { defineStore } from "pinia";
import { ref } from "vue";

interface ChatMessage {
  [key: string]: any;
}

export const useChatStore = defineStore(
  "chat",
  () => {
    const chatLocalCacheList = ref<ChatMessage[]>([]);

    // Getters
    // const getWalletData = computed(() => walletData.value);

    // Actions
    const setChatLocalCacheList = (data: ChatMessage[]) => {
      chatLocalCacheList.value = data;
    };
    const getChatLocalCacheList = (): ChatMessage[] => {
      return chatLocalCacheList.value;
    };
    const addChatLocalCache = (data: ChatMessage) => {
      chatLocalCacheList.value.push(data);
    };
    const clearChatLocalCache = () => {
      chatLocalCacheList.value = [];
    };

    return {
      chatLocalCacheList,
      // Actions
      setChatLocalCacheList,
      getChatLocalCacheList,
      addChatLocalCache,
      clearChatLocalCache,
    };
  },
  {
    persist: {
      key: "chatPiniaStore",
      storage: localStorage,
    },
  },
);
