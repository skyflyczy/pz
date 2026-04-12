import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

/** Application routes (register view components here). */
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
