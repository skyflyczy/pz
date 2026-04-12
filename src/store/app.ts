import { defineStore } from "pinia";
import { ref } from "vue";


export const useAppStore = defineStore(
    "app",
    () => {
        const isShowVideoRef = ref(true);

        // Actions
        const setIsShowVideo = (data: boolean) => {
            isShowVideoRef.value = data;
        };
        const getIsShowVideo = (): boolean => {
            return isShowVideoRef.value;
        };

        return {
            isShowVideoRef,
            // Actions
            setIsShowVideo,
            getIsShowVideo,
        };
    },
);
