<template>
  <div class="conversation-container">
    <div class="tip-content-container" ref="tipContentContainerRef">
      <div class="tip-content">
        <div class="tip-content-inner">
          <div v-for="(tip, index) in tipStore.tipList" :key="index" :data-index="index" class="tip-item"
               :class="[tip.type]">
            <div class="tip-text">
              {{ tip.message }}
              <span v-if="tip.isLoad" class="loading-dots"></span>
              <span v-if="tip.type === 'submit' && tip.txId" class="txid">{{tip.txId }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div class="message-container animate__animated animate__fadeInUp animate__slow">
      <!-- Top loading indicator for history messages -->
      <div v-if="isLoadingHistoryRef" class="loading-message-top">
        <three-point-loading-animation size="0.2rem"></three-point-loading-animation>
      </div>
      <!-- Fixed system message -->
      <div class="message-item system-message">
        <div class="message-avatar">
          <div class="avatar-icon">
            <img src="@/assets/images/msg_head.png" alt="user" />
          </div>
        </div>
        <div class="message-item-box-booder">
          <div class="message-item-box-describe">
            <span class="author">{{ systemMessageAuthor }}</span>
          </div>
          <div class="message-item-box">
            <div class="message-content">
              <div class="message-content-text">{{ firstMessageValue }}</div>
            </div>
          </div>
        </div>
      </div>
      <!-- for user message -->
      <div v-for="item in messageListRef" :key="item.id" class="message-item" :class="item.messageType">
        <!-- Profile Picture -->
        <div class="message-avatar">
          <div class="avatar-icon">
            <img v-if="'user-message' === item.messageType" src="@/assets/images/msg_head_user.png" alt="user" />
            <img v-else src="@/assets/images/msg_head.png" alt="user" />
          </div>
        </div>
        <div class="message-item-box-booder">
          <div class="message-item-box-describe">
            <span class="author">{{ item.author }}</span>
            <span class="time">{{ item.time }}</span>
          </div>
          <!-- Message content -->
          <div class="message-item-box">
            <!-- Execution process -->
            <div v-if="item.isExecute" class="execute-process">
              <p class="executeContent" v-for="executeItem in item.executeProcess?.list" :key="executeItem.id">
                {{ executeItem.executeContent }}
                <span v-if="executeItem.isFinished" class="finished">
                  <img src="@/assets/images/icon-check.svg" alt="check" />
                </span>
              </p>
              <p class="execute-hash">TxId: {{ item.executeProcess?.txId }}</p>
            </div>
            <div v-if="!item.isExecute" class="message-content">
              <div class="message-content-text">{{ item.showMessageContent }} <span
                  v-if="item.messageType === 'system-message' && item.isTyping" class="cursor">|</span></div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="showLoading" class="loading-message loading-message-buttom">
        <div class="avatar-icon">
          <img src="@/assets/images/msg_head.png" alt="user" />
        </div>
      </div>
    </div>
    <footer class="animate__animated animate__fadeInUp animate__slow">
      <!-- Bottom info bar -->
      <div class="inpit-box" :class="{ 'is-focused': isInputFocusedRef }">
        <textarea type="text" v-model="inputValueRef" placeholder="Hit Enter to send. Great posts may earn bonus" maxlength="300"
                  @keyup.enter="handleQuestion" :disabled="!canChat" @focus="isInputFocusedRef = true"
                  @blur="isInputFocusedRef = false" />
        <div v-if="!canChat" class="disabled-click-layer" @click="handleDisabledClick"></div>
        <div class="input-icons">
          <span class="pz-iconfont icon-voice icon-01"></span>
          <span class="pz-iconfont icon-fasong" @click="handleQuestion"></span>
        </div>
      </div>

      <div class="encryption-notice">
        Philosophical Zombie is completely free during the beta. Pricing will be introduced in the official version. All
        revenue generated will be used for rewards and burns.
      </div>
      <!--       Action buttons-->
      <div class="action-buttons">
        <pz-button class="btn-check" bg-color="var(--color-000)" text-color="var(--color-white)"
                   border-color="var(--color-white)" hover-bg-color="var(--color-white)" hover-text-color="var(--color-000)"
                   @click="handleNavigateTo('Records')">
          Records
        </pz-button>
        <pz-button class="btn-submit" :disabled="isSubmittingRef">
          <template v-if="isContinueRef">
            <span @click="handleContinue">Continue</span>
          </template>
          <template v-else>
            <span  @click="handleSubmit"  v-if="!isSubmittingRef" >Put on-chain</span>
            <CircleLoadingAnimation v-else size="0.28rem" color="#ffffff" />
          </template>
        </pz-button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import {nextTick, onMounted, onUnmounted, ref, watch} from "vue";
import {useRouter} from "vue-router";
import {ElMessage} from "element-plus";
import { apiChatLimit, getAllTxid, saveTx, setChat } from "@/api";
import { useWalletStore } from "@/store/wallet";
import { useChatStore } from "@/store/chat";
import { useTipStore } from "@/store/tip";
import { useTxidListStore } from "@/store/txidList";
import { formatTime, sleep } from "@/utils";
import { systemMessageAuthor } from "@/config";
import PzButton from "@/components/PzButton.vue";
import CircleLoadingAnimation from "@/components/CircleLoadingAnimation.vue";
import ThreePointLoadingAnimation from "@/components/ThreePointLoadingAnimation.vue";

const router                                 = useRouter();
const walletStore                            = useWalletStore();
const chatStore                              = useChatStore();
const tipStore                               = useTipStore();
const txidListStore                          = useTxidListStore();

interface ExecuteProcessItem {
  id: string | number;
  executeContent: string;
  isFinished: boolean;
}

interface ExecuteProcess {
  list: ExecuteProcessItem[];
  txId?: string | '';
}

interface MessageItem {
  id: string;
  isExecute: boolean;
  author: string;
  time: string;
  isWaitOnChain: boolean;
  showMessageContent: string;
  messageContent: string;
  messageType: "user-message" | "system-message";
  flag?: string;
  isTyping?: boolean;
  executeProcess?: ExecuteProcess;
  modelResult?: string;
}

interface TipItem {
  id?: string | number;
  message: string;
  type: string;
  isLoad: boolean;
  txid?: string;
}

interface UploadResult {
  id: string;
  winc?: string;
  uploadSize?: number;
}

interface WalletData {
  address?: string;
  _signDerivedKey?: string;
  [key: string]: any;
}

const firstMessageValue                      = "Philosophical Zombie builds you a reusable, transferable, and evolving digital consciousness—designed to handle more personalized tasks based on your preferences.\n\nBacked by cross-disciplinary testing, the initial version takes shape after 75 to 90 days of 20 high-quality conversations each day. Every piece of data is encrypted with your signature and stored permanently on the Arweave chain. We don't cache anything. Only you can decrypt and view it.\n\nStart building now.";
const canChat                                = ref<boolean>(false);
const inputValueRef                          = ref<string>("");
const showLoading                            = ref<boolean>(false);
const isShowConnectedInfoRef                 = ref<boolean>(false);
const isSubmittingRef                        = ref<boolean>(false);
const txidListRef                            = ref<string[]>([]);
const currentPageRef                         = ref<number>(1);
const isLoadingHistoryRef                    = ref<boolean>(false);
const hasMoreHistoryRef                      = ref<boolean>(true);
const tipContentContainerRef                 = ref<HTMLElement | null>(null);
const messageListRef                         = ref<MessageItem[]>([]);
const isContinueRef                          = ref<boolean>(false);
const isInputFocusedRef                      = ref(false);
const isCanCallRef                           = ref(false);

watch(() => (tipStore.tipList as TipItem[]), (newVal) => {
  if (newVal.length && tipContentContainerRef.value) {
    nextTick(() => {
      if (tipContentContainerRef.value) {
        tipContentContainerRef.value.scrollTop = tipContentContainerRef.value.scrollHeight;
      }
    });
  }
}, { immediate: true, deep: true });

const scrollToBottom = async (): Promise<void> => {
  await nextTick();
  const messageContainer = document.querySelector<HTMLDivElement>(".message-container");
  if (messageContainer) {
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }
};

const handleDisabledClick = async (): Promise<void> => {
  const isConnected = await walletStore.walletConnectedStatus();
  if (!isConnected) {
    ElMessage.error("Connect Wallet First.");
  }
};

const handleQuestion = async (): Promise<void> => {
  const value = inputValueRef.value.trim();
  if (!value) {
    return;
  }
  await aiChart(value);
};

const generateMessageItem = async (
                              author: string = '',
                              isExecute: boolean,
                              isWaitOnChain: boolean,
                              messageContent: string = '' ,
                              messageType: "user-message" | "system-message",
                              showMessageContent: string = '',
                              flag: string,
                              isTyping: boolean = false,
                              modelResult: string = '',
): Promise<MessageItem> => {
  const nowDate = Date.now();
  return {
    id: nowDate + "_" + messageListRef.value.length + 1,
    author: author,
    isExecute: isExecute,
    isWaitOnChain: isWaitOnChain,
    messageContent: messageContent,
    messageType: messageType,
    showMessageContent: showMessageContent,
    time: formatTime(nowDate),
    flag: flag,
    isTyping: isTyping,
    modelResult: modelResult
  };
};

const aiChart = async (msg: string | null, flag: string = "dialogue"): Promise<void> => {
  const isConnected = await walletStore.walletConnectedStatus();
  if (!isConnected) {
    ElMessage.error("Connect Wallet First.");
    return;
  }
  canChat.value = false;

  let author = walletStore.walletData.address;
  if (author) author = author.slice(0, 5) + "..." + author.slice(-5);

  inputValueRef.value = "";
  showLoading.value = true;

  if (msg != null && msg !== "") {
    const userMessageItem = await generateMessageItem(author, false, true, msg, "user-message", msg, flag);
    messageListRef.value.push(userMessageItem);
    chatStore.addChatLocalCache(userMessageItem);
  }

  await scrollToBottom();

  // submit question and get answer
  await setChat({
    address: walletStore.walletData.address,
    msg: msg,
    flag: flag,
    chatTime: formatTime(Date.now(), "YYYY-MM-dd HH:mm:ss")
  })
      .then(async (res) => {
       showLoading.value = false;
        if (res.code === 200) {
          const fullText = res.data?.content || "";
          const modelResult = res.data?.modelResult || "";
          const systemMessageItem = await generateMessageItem(systemMessageAuthor,false, true, fullText, "system-message", '', flag, true, modelResult);
          messageListRef.value.push(systemMessageItem);
          const currentSystemMessageItem = messageListRef.value.find((item) => item.id === systemMessageItem.id);
          if (currentSystemMessageItem) {
            for (let i = 0; i < fullText.length; i++) {
              await sleep(10);
              currentSystemMessageItem.showMessageContent += fullText[i];
              await scrollToBottom();
            }
            currentSystemMessageItem.isTyping = false;
            chatStore.addChatLocalCache(currentSystemMessageItem);
          }

          if (flag === 'dialogue') {
            isCanCallRef.value = true;
            canChat.value = isCanCallRef.value;
          }
        } else if (res.code === 201) {
          if (flag === 'dialogue') {
            isCanCallRef.value = false;
            canChat.value = isCanCallRef.value;
            if (!isCanCallRef.value) {
              await callLimitTip();
            }
          }
        }
      })
      .finally(() => {
        showLoading.value = false;
      });
};

const callLimitTip = async (): Promise<void> => {
  const fullText = "20 conversations completed today. Training paused for now. We'll continue tomorrow.\nYour consciousness model is taking shape.";
  const systemMessageItem = await generateMessageItem(systemMessageAuthor,false,false, fullText, "system-message" ,'','dialogue', true);
  messageListRef.value.push(systemMessageItem);

  const currentSystemMessageItem = messageListRef.value.find((item) => item.id === systemMessageItem.id);
  if (currentSystemMessageItem) {
    for (let i = 0; i < fullText.length; i++) {
      await sleep(10);
      currentSystemMessageItem.showMessageContent += fullText[i];
      await scrollToBottom();
    }
    currentSystemMessageItem.isTyping = false;
  }
};

const fetchHistoryByPage = async (page: number): Promise<void> => {
  if (isLoadingHistoryRef.value) return;
  if (page > txidListRef.value.length) {
    hasMoreHistoryRef.value = false;
    return;
  }

  isLoadingHistoryRef.value = true;

  try {
    const txId = txidListRef.value[page - 1];
    const data = await walletStore.getHistoryByTxid(txId);

    if (data && data.length > 0) {
      // Get current scroll position before adding messages
      const messageContainer = document.querySelector(".message-container");
      const currentScrollTop = messageContainer ? messageContainer.scrollTop : 0;

      // Parse the returned message data and add it to the front of the list
      const historyMessages: MessageItem[] = data.map((item: any, index: number) => ({
        id: `history_${page}_${index}`,
        isExecute: false,
        messageContent: item.content,
        showMessageContent: item.content,
        messageType: item.type === "user-message" ? "user-message" : "system-message",
        author: item.author || '',
        time: item.time || '',
        flag: item.flag || '',
        isWaitOnChain: false,
      }));

      // Add to the front of the array
      messageListRef.value.unshift(...historyMessages);
      currentPageRef.value = page;

      // After adding messages, adjust scroll position
      await nextTick();
      if (messageContainer) {
        // Calculate the height of the added messages
        const newScrollTop = currentScrollTop + 100;// Scroll down a bit to show new content
        messageContainer.scrollTop = newScrollTop;
        if (page === 1) await scrollToBottom();
      }
    }
  } catch (error) {
    console.error("Failed to retrieve historical messages:", error);
  } finally {
    isLoadingHistoryRef.value = false;
  }
};

// Handle scroll events
const handleScroll = (event: Event): void => {
  const messageContainer = event.target as HTMLDivElement;
  if (
      messageContainer.scrollTop === 0 &&
      hasMoreHistoryRef.value &&
      !isLoadingHistoryRef.value
  ) {
    const nextPage = currentPageRef.value + 1;
    if (nextPage <= txidListRef.value.length) {
      fetchHistoryByPage(nextPage);
    }
  }
};

const handleNavigateTo = (routeName: string): void => {
  router.push({ name: routeName });
};

const handleContinue = (): void => {
  aiChart("", "dialogue");
  isContinueRef.value = false;
};

const handleSubmit = async (): Promise<void> => {
  if (isSubmittingRef.value) return;
  if (showLoading.value) return;

  const isConnected = await walletStore.walletConnectedStatus();
  if (!isConnected) {
    ElMessage.error(
        "Wallet is not properly connected. Please connect it before uploading.",
    );
    return;
  }

  const localCache = chatStore.getChatLocalCacheList();
  if (!localCache.length) {
    ElMessage.warning("No chat records found. Please start a conversation.");
    return;
  }

  if (!messageListRef.value.some(msg => msg.isWaitOnChain && msg.messageType === "user-message")) {
    ElMessage.warning("No chat records found. Please start a conversation.");
    return;
  }

  isSubmittingRef.value = true;
  canChat.value = false;

  tipStore.updateCurrentTipLoad(false);
  tipStore.currentTipId = tipStore.addTip("Updating your consciousness model");

  const finalMsg = messageListRef.value[messageListRef.value.length - 1];
  if (!finalMsg.flag || finalMsg.flag !== 'summary') {
    await aiChart("", "summary");
  }

  try {
    // Step 1: Data Encryption
    tipStore.addSuccessTip("Success!");
    tipStore.updateCurrentTipLoad(false);
    tipStore.currentTipId = tipStore.addTip("Encrypting consciousness data (AES-CBC)");

    const messages = messageListRef.value
        .filter((msg) => msg.isWaitOnChain)
        .map((msg) => ({
          type: msg.messageType,
          content: msg.messageContent,
          flag: msg.flag,
          author: msg.author,
          time: msg.time,
        }));

    const dataToEncrypt = JSON.stringify(messages);
    const encryptedData = await walletStore.encryptData(dataToEncrypt);

    if (!encryptedData) {
      ElMessage.error("Data encryption failed. Please try again.");
      tipStore.updateCurrentTipLoad(false);
      tipStore.addFailTip("Failed:Operation failed.");
      return;
    }

    // Step 2: Submit to the blockchain
    tipStore.addSuccessTip("Success!");
    const uploadRes = await walletStore.uploadFile(encryptedData) as UploadResult;
    tipStore.updateCurrentTipLoad(false);

    if (!uploadRes) {
      isSubmittingRef.value = false;
      canChat.value = isCanCallRef.value;
      return;
    }

    // Step 3: Chain completed
    await saveTx({
      address: walletStore.walletData?.address,
      arTxId: uploadRes.id,
      modelResult: messageListRef.value[messageListRef.value.length - 1].modelResult,
      gas: uploadRes.winc,
      uploadSize: uploadRes.uploadSize,
      createTime: formatTime(Date.now(), "YYYY-MM-dd HH:mm:ss")
    }).then(() => {
      chatStore.clearChatLocalCache();
      txidListStore.add(uploadRes.id);
    });

    tipStore.updateCurrentTipLoad(false);
    tipStore.addSuccessTip("Success!");
    tipStore.addTip("", "submit", "Arweave storage task created. A hash credential (Arweave TxID) will be provided upon completion");

    if (isCanCallRef.value) {
      isContinueRef.value = true;
    }
  } catch (error) {
    canChat.value = isCanCallRef.value;
    (tipStore.updateCurrentTipLoad as (isLoad: boolean) => void)(false);
  } finally {
    isSubmittingRef.value = false;
  }
};

const initPage = async (): Promise<void> => {

  tipStore.clear();
  const isConnected = await walletStore.walletConnectedStatus();
  if (!isConnected || !walletStore.walletData?.address) {
    ElMessage.error("Connect Wallet First.");
    return;
  }

  tipStore.currentTipId = tipStore.addTip("Connecting to the Arweave decentralized storage network");

  const address = walletStore.walletData?.address;
  let newUser = false;

  try {
    tipStore.updateCurrentTipLoad(false);
    tipStore.addTip("Success!", "success");
    tipStore.currentTipId = tipStore.addTip("Retrieving your historical consciousness data from the blockchain. This might take a moment");

    const res = await getAllTxid(address);
    if (res.code === 200 && res.data) {
      txidListRef.value = res.data;
      hasMoreHistoryRef.value = txidListRef.value.length > 0;

      if (txidListRef.value.length > 0 && currentPageRef.value === 1) {
        await fetchHistoryByPage(1);
        tipStore.updateCurrentTipLoad(false);
        tipStore.addTip("Success!", "success");
        tipStore.addTip("Your consciousness data has been successfully retrieved", "yes");
        tipStore.currentTipId = tipStore.addTip("You can now proceed with constructing your consciousness", "yes");
        await loadTxidUntilScrollable();
      } else {
        tipStore.updateCurrentTipLoad(false);
        tipStore.addTip("Your consciousness data has been retrieved", "yes");
        tipStore.addTip("It looks like this is your first time using Philosophical Zombie", "yes");
        tipStore.currentTipId = tipStore.addTip("You can now begin your first consciousness exploration", "yes");
        await aiChart(null);
        newUser = true;
      }
    } else {
      tipStore.updateCurrentTipLoad(false);
      ElMessage.error(res.message || "Failed to retrieve historical data. Please try again.");
    }
  } catch (error) {
    tipStore.updateCurrentTipLoad(false);
    ElMessage.error("Failed to retrieve historical data. Please try again.");
  }

  const localCache = chatStore.getChatLocalCacheList() ? chatStore.getChatLocalCacheList() : [];
  if (localCache.length > 0 && !newUser) {
    const validLocalCache = localCache.map((item) => ({
      id: item.id || Date.now().toString(),
      isExecute: item.isExecute || false,
      author: item.author || '',
      time: item.time || '',
      isWaitOnChain: item.isWaitOnChain || false,
      showMessageContent: item.showMessageContent || '',
      messageContent: item.messageContent || '',
      messageType: item.messageType,
      flag: item.flag,
      isTyping: item.isTyping || false,
      executeProcess: item.executeProcess,
      modelResult: item.modelResult,
    }));
    messageListRef.value.push(...validLocalCache);
    await nextTick();
    await sleep(300);
    await scrollToBottom();
  }


  try {
    const res = await apiChatLimit({
      address: address,
      chatTime: formatTime(Date.now(), "YYYY-MM-dd HH:mm:ss")
    });

    if (res.code === 200) {
      isCanCallRef.value = res.data === 1;
      canChat.value = isCanCallRef.value;
      if (!canChat.value) {
        await callLimitTip();
      }
    } else {
      ElMessage.error(res.message || "Failed to check chat limit. Please try again.");
    }
  } catch (error) {
    ElMessage.error("Failed to check chat limit. Please try again.");
  }

  if (canChat.value && messageListRef.value.length > 0) {
    const finalMsg = messageListRef.value[messageListRef.value.length - 1];
    if (finalMsg.flag === 'summary' && finalMsg.messageType === "system-message") {
      isContinueRef.value = true;
      canChat.value = false;
    }
  }
};

const loadTxidUntilScrollable = async (): Promise<void> => {
  let currentPage = currentPageRef.value + 1;
  let hasMore = currentPage <= txidListRef.value.length;

  while (hasMore) {
    await fetchHistoryByPage(currentPage);
    await nextTick();

    setTimeout(() => {
      scrollToBottom();
    }, 1000);

    const messageContainer = document.querySelector(".message-container");
    if (messageContainer) {
      const hasScrollbar = messageContainer.scrollHeight > messageContainer.clientHeight;
      if (hasScrollbar) {
        break;
      }
    }

    currentPage++;
    hasMore = currentPage <= txidListRef.value.length;
  }
};

const pageDataClear = (): void => {
  tipStore.clear();
  chatStore.clearChatLocalCache();
  messageListRef.value = [];
  isShowConnectedInfoRef.value = false;
  canChat.value = false;
  showLoading.value = false;
  isShowConnectedInfoRef.value = false;
  isSubmittingRef.value = false;
  isCanCallRef.value = false;

  txidListRef.value = [];
  currentPageRef.value = 1;
  isLoadingHistoryRef.value = false;
  hasMoreHistoryRef.value = true;
  tipContentContainerRef.value = null;
};

watch(
    () => (walletStore.walletData as WalletData)._signDerivedKey,
    async (newAddress) => {
      pageDataClear();
      if (newAddress) {
        await nextTick();
        await initPage();
        isShowConnectedInfoRef.value = false;
      }
    },
    { immediate: false }
);

onMounted(async () => {
  await nextTick();
  await initPage();

  //Add scroll event listener
  const messageContainer = document.querySelector(".message-container");
  if (messageContainer) {
    messageContainer.addEventListener("scroll", handleScroll);
  }
});

onUnmounted(() => {
  // Remove scroll event listener
  const messageContainer = document.querySelector(".message-container");
  if (messageContainer) {
    messageContainer.removeEventListener("scroll", handleScroll);
  }
});
</script>

<style scoped lang="scss">
@import "@/assets/styles/conversation.scss";
</style>