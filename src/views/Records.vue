<template>
  <div class="history-container">
    <div class="bonus-tag animate__animated animate__fadeInUp animate__slow">
      <img src="@/assets/images/icon-gift.svg" alt="" />
      <span>Bonus: {{ totalRevenue }}</span>
    </div>
    <div class="dividing-line animate__animated animate__fadeInUp animate__slow"></div>
    <div class="search-box animate__animated animate__fadeInUp animate__slow">
      <input type="text" v-model="searchValueRef" placeholder="Search TxID" @keyup.enter="seacherData" />
    </div>
    <div class="history-table animate__animated animate__fadeInUp animate__slow">
      <div class="table-header">
        <div class="cell number-cell">Number</div>
        <div class="cell time-cell">Time</div>
        <div class="cell hash-cell">TxID<i class="icon pz-iconfont icon-wenhaoxiao">
            <div class="tipmsg">
              TxID (transaction hash) is the unique identifier for each transaction or data upload. You can use it to
              look up your record on the blockchain.
            </div>
          </i>
        </div>
        <div class="cell gas-cell">Size</div>
        <div class="cell gas-cell">Gas</div>
        <div class="cell bonus-cell">Bonus</div>
      </div>
      <div class="table-body">
        <ul class="table-row" v-for="(item, index) in tableList" :key="index">
          <li class="cell number-cell">
            <div class="cell-content">{{ index + 1 }}</div>
          </li>
          <li class="cell time-cell">
            <div class="cell-content">{{ item.time }}</div>
          </li>
          <li class="cell hash-cell"  @mouseenter="handleMouseEnter(index)" @mouseleave="handleMouseLeave(index)">
            <span v-if="item.status === TaskStatusTypes.PENDING" class="txid-pending cell-content">Storing data on Arweave chain <i class="loading-dots"></i></span>
            <span v-else class="cell-content ar-tx-id" @click="handleGoPageClick(`https://viewblock.io/arweave/tx/${item.arTxId}`, '_blank')">{{ item.arTxId }}</span>
            <span v-if="item.status === TaskStatusTypes.CHAINED && copyStates[index] === 'show'" class="copy pz-iconfont icon-copy" @click="handleCopyClick(item.arTxId, index)"></span>
            <span v-else-if="item.status === TaskStatusTypes.CHAINED && copyStates[index] === 'copied'" class="copy pz-iconfont icon-duihao"></span>
          </li>
          <li class="cell gas-cell">
            <div class="cell-content">{{ item.size }}</div>
          </li>
          <li class="cell gas-cell">
            <div class="cell-content">{{ item.gas }}</div>
          </li>
          <li class="cell bonus-cell">
            <div class="cell-content" :class="[item.bonus ? 'bonus-value' : 'bonus-none']">
              {{ item.bonus || "-" }}
            </div>
          </li>
        </ul>
      </div>
      <div class="load-container">
        <three-point-loading-animation v-if="isLoading" size="0.8rem"></three-point-loading-animation>
      </div>
    </div>
    <div class="pagination animate__animated animate__fadeInUp animate__slow" v-if="totalPages > 1">
      <button v-if="currentPage > 1" class="page-btn" @click="changePage(currentPage - 1)">
        &laquo;
      </button>
      <button v-for="page in totalPages" :key="page" class="page-btn" :class="{ active: page === currentPage }"
        @click="changePage(page)">
        {{ page }}
      </button>
      <button v-if="currentPage < totalPages" class="page-btn" @click="changePage(currentPage + 1)">
        &raquo;
      </button>
    </div>
    <div class="awaken-btn animate__animated animate__fadeInUp animate__slow">
      <pz-button @click="handleGoPageClick('Conversation')" class="btn">Awaken
        <span class="icon pz-iconfont icon-forwardo"> </span>
      </pz-button>
    </div>
    <div class="footer-text">
      <div class="placeholder"></div>
      <p class="text">
        Your wallet signature is the only private key that can decrypt your data. Only you—and anyone you explicitly authorize—can access the plaintext.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import { getTableList, getTotalRevenue, apiGetTaskStatus } from "@/api/index.js";
import { useRouter } from "vue-router";
import { useWalletStore } from "@/store/wallet";
import { useTxidListStore } from "@/store/txidList";
import { TaskStatusTypes } from "@/config/index.js";
import PzButton from "@/components/PzButton.vue";
import ThreePointLoadingAnimation from "@/components/ThreePointLoadingAnimation.vue";

interface TableItem {
  arTxId: string;
  time: string;
  size: string;
  gas: string;
  bonus?: string;
  status: string;
}

interface ApiResponse {
  code: number;
  data: any;
}

interface TxidItem {
  arTxId: string;
  status: string;
}

const router                            = useRouter();
const walletStore                       = useWalletStore();
const txidListStore                     = useTxidListStore();
const totalRevenue                      = ref<number>(0);
const currentPage                       = ref<number>(1);
const totalPages                        = ref<number>(0);
const tableList                         = ref<TableItem[]>([]);
const isLoading                         = ref<boolean>(false);
const searchValueRef                    = ref<string>("");
const copyStates                        = ref<Record<number, string>>({});

const handleGoPageClick = (url: string, target: string): void => {
  if (url.startsWith("http")) {
    window.open(url, target);
  } else {
    router.push({ name: url });
  }
};

const handleMouseEnter = (index: number): void => {
  copyStates.value[index] = 'show';
};

const handleMouseLeave = (index: number): void => {
  setTimeout(() => {
    copyStates.value[index] = '';
  }, 50);
};

const handleCopyClick = (arTxId: string, index: number): void => {
  navigator.clipboard.writeText(arTxId).then(() => {
    copyStates.value[index] = 'copied';
  });
};

const changePage = (page: number): void => {
  if (page === currentPage.value) return;
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    getData();
  }
};

const seacherData = async (): Promise<void> => {
  currentPage.value = 1;
  getData();
};

const getData = async (): Promise<void> => {
  isLoading.value = true;
  try {
    const isConnected = await walletStore.walletConnectedStatus();
    if (!isConnected) {
      isLoading.value = false;
      return;
    }
    const res = await getTableList({
      arTxId: searchValueRef.value,
      current: currentPage.value,
      size: 10,
      address: walletStore.walletData?.address,
    });
    isLoading.value = false;
    if (res.code === 200) {
      totalPages.value = res.data.pages;
      const list = res.data.list || [];
      tableList.value = list;
    }
  } catch (error) {
    isLoading.value = false;
  }
};

const queryTotalRevenue = async (): Promise<void> => {
  const isConnected = await walletStore.walletConnectedStatus();
  if (!isConnected) {
    return;
  }
  const res = await getTotalRevenue(walletStore.walletData?.address);
  if (res.code === 200) {
    totalRevenue.value = res.data;
  }
};

watch(
  () => walletStore.walletData._signDerivedKey,
  async (newAddress: string | undefined, oldAddress: string | undefined) => {
    if (newAddress) {
      await nextTick();
      await initPage();
    } else {
      tableList.value = [];
      totalRevenue.value = 0;
      currentPage.value = 1;
      totalPages.value = 0;
    }
  },
  { immediate: false },
);

// 监听全局txid列表变化，同步更新本页状态
watch(
  () => txidListStore.txidList,
  (newTxidList: TxidItem[]) => {
    if (tableList.value.length === 0) return;
    
    // 创建txid到状态的映射
    const statusMap = new Map<string, string>();
    newTxidList.forEach(item => {
      statusMap.set(item.arTxId, item.status);
    });
    
    // 更新本页数据的状态
    let hasChanges = false;
    tableList.value.forEach(item => {
      if (statusMap.has(item.arTxId) && item.status !== statusMap.get(item.arTxId) && item.status === TaskStatusTypes.PENDING) {
        item.status = statusMap.get(item.arTxId) || item.status;
        hasChanges = true;
      }
    });
    
    // 触发状态更新
    if (hasChanges) {
      tableList.value = [...tableList.value];
    }
  },
  { deep: true }
);

const initPage = async (): Promise<void> => {
  await getData();
  await queryTotalRevenue();
};

onMounted(() => {
  initPage();
});

</script>

<style scoped lang="scss">
.load-container {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.history-container {
  max-width: var(--max-width);
  border-radius: 0.08rem;
  margin: 0 auto;
  padding: 0.2rem;
  color: white;
  height: calc(100% - 3rem);

  .dividing-line {
    width: 100%;
    height: 0.01rem;
    background-color: rgba(255, 255, 255, 0.2);
    margin: 0.4rem 0;
  }

  .bonus-tag {
    background-color: var(--color-D0F505);
    color: #000000;
    font-weight: bold;
    padding: 0.2rem;
    border-radius: 0.1rem;
    display: flex;
    align-items: center;
    margin-bottom: 0.15rem;
    width: 2rem;
    height: 0.66rem;

    img {
      width: 0.3rem;
      height: 0.3rem;
    }

    span {
      position: relative;
      top: 0.02rem;
      margin-left: 0.1rem;
      font-weight: bold;
    }
  }

  .search-box {
    margin-bottom: 0.4rem;

    input {
      width: 2rem;
      padding: 0.1rem 0.2rem;
      background-color: #1a1a1a;
      border: none;
      border-radius: 0.3rem;
      color: white;
      height: 0.3rem;
      outline: none;

      &::placeholder {
        color: #393a39;
      }
    }
  }

  .history-table {
    width: 100%;
    margin-bottom: 20px;
    font-weight: 400;
    font-size: 0.14rem;
    min-height: 2rem;
    color: var(--color-white);
    position: relative;
    // height: calc(100% - 3.3rem);
    overflow: auto;

    .cell {
      padding: 0.12rem 0.08rem;
      color: rgba(153, 153, 153, 1);
      font-weight: 500;
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      &.number-cell {
        width: 1.2rem;
        min-width: 1.2rem;
      }

      &.time-cell {
        width: 2.2rem;
        min-width: 2.2rem;
      }

      &.hash-cell {
        position: relative;
        flex: 1;
        min-width: 2rem;
        position: relative;
        overflow: visible;
        display: flex;
        align-items: center;
        .copy {
          position: absolute;
          margin-left: 0.05rem;
          cursor: pointer;
          right: 0.2rem;
          top: 0.1rem;
        }

        .icon {
          font-size: .14rem;
          cursor: pointer;
          margin-left: 0.05rem;
          position: relative;

          &:hover {
            .tipmsg {
              display: block;
            }
          }
        }

        .tipmsg {
          position: absolute;
          top: -0.17rem;
          left: .35rem;
          padding: 0.1rem;
          background-color: #1a1a1a;
          border-radius: 0.1rem;
          color: rgba(113, 109, 109, 1);
          font-size: 0.14rem;
          line-height: 1.7;
          white-space: normal;
          width: 3.7rem;
          // opacity: 0;
          transition: opacity 0.3s ease;
          display: none;
          z-index: 10;

          &::before {
            content: '';
            position: absolute;
            top: 0.12rem;
            left: -0.22rem;
            border-width: 0.12rem;
            border-style: solid;
            border-color: transparent #1a1a1a transparent transparent;
          }
        }
      }

      &.tail-cell {
        flex: 1;
        min-width: 2rem;
      }

      &.status-cell {
        width: 1.2rem;
        min-width: 1.2rem;
      }

      &.gas-cell {
        width: 1.2rem;
        min-width: 1.2rem;
      }

      &.bonus-cell {
        width: 2.2rem;
        min-width: 2.2rem;
        text-align: right;
      }
    }

    .table-header {
      display: flex;
      width: 100%;

      .cell {
        height: 0.6rem;
        color: rgba(153, 153, 153, 1);
      }
    }

    .table-body {
      width: 100%;

      .table-row {
        display: flex;
        width: 100%;
        list-style: none;
        margin: 0;
        padding: 0;
        transition: background-color 0.2s ease;

        &:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }

        .cell {
          .cell-content {
            display: block;
            text-align: left;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: var(--color-white);

            &.bonus-value {
              color: #d0f505;
              font-weight: bold;
              text-align: right;
            }

            &.bonus-none {
              color: rgba(255, 255, 255, 0.5);
              text-align: right;
            }

            &.ar-tx-id {
              cursor: pointer;
            }
            &.txid-pending {
              color: #D0F505;
              .loading-dots {
                  display: inline-block;
                  position: relative;
                  width: 0.3rem;
                  height: 0.12rem;

                  &::after {
                      content: '';
                      animation: dots 1.5s infinite;
                  }
              }
            }
          }
        }
      }
    }
  }

  .pagination {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.1rem;
    margin-top: 0.05rem;

    .page-btn {
      background-color: rgba(255, 255, 255, 0.1);
      border: 0.01rem solid rgba(255, 255, 255, 0.2);
      border-radius: 0.04rem;
      color: white;
      padding: 0.05rem 0.1rem;
      cursor: pointer;

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }

      &.active {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
        color: var(--color-000);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}

.awaken-btn {
  display: flex;
  justify-content: center;
  align-items: center;

  --icon-color: var(--color-white);

  .btn {
    border-radius: 0.3rem;
    display: flex;
    align-items: center;
    width: 1.3rem;
    font-weight: 700;
    font-size: 0.16rem;

    :deep(.icon) {
      display: inline-block;
      margin-left: 0.05rem;
      width: 0.2rem;
      height: 0.2rem;
      font-weight: 700;
      font-size: 0.18rem;
      position: relative;
      top: 0.01rem;
    }

    &:hover {
      --icon-color: var(--color-000);
    }
  }
}

.footer-text {
  height: 0.7rem;

  .text {
    position: fixed;
    margin: 0 auto;
    bottom: 0.1rem;
    left: 0;
    right: 0;
    color: rgba(113, 109, 109, 1);
    font-size: 0.14rem;
    height: 0.4rem;
    line-height: 1.5;
    text-align: center;
  }
}
</style>
