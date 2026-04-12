import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

//配置路由信息
const routes: RouteRecordRaw[] = [

];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
