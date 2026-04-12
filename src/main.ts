import { createApp } from "vue";
import { createPinia } from "pinia";
import "@/assets/styles/index.scss";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import App from "@/App.vue";
import router from "@/router";
import pixelDissolve from "@/directives/pixelDissolve";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);
app.use(router);
app.use(pinia);
app.directive("dissolve-btn", pixelDissolve);

app.mount("#app");
