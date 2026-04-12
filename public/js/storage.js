// 存储用户交互状态，用于跨页面共享
window._storage = {
  // 设置交互状态
  setInteracted: () => {
    localStorage.setItem("video_user_interacted", "true");
  },
  // 获取交互状态
  getInteracted: () => {
    return localStorage.getItem("video_user_interacted") === "true";
  },
  // 清除交互状态（可选）
  clearInteracted: () => {
    localStorage.removeItem("video_user_interacted");
  },
};
