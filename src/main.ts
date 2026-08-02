import "@fontsource/nunito-sans/latin-400.css";
import "@fontsource/nunito-sans/vietnamese-400.css";
import "@fontsource/nunito-sans/latin-600.css";
import "@fontsource/nunito-sans/vietnamese-600.css";
import "@fontsource/nunito-sans/latin-700.css";
import "@fontsource/nunito-sans/vietnamese-700.css";
import "@fontsource/nunito-sans/latin-800.css";
import "@fontsource/nunito-sans/vietnamese-800.css";
import "@/styles/vendor/phoenix-theme.min.css";
import "@/styles/main.scss";

import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "@/App.vue";
import { configureRequest } from "@/request";
import { createCmsRouter } from "@/router";
import { authenStore } from "@/stores/app-authen";

const app = createApp(App);
const pinia = createPinia();
const router = createCmsRouter();

app.use(pinia);
app.use(router);

configureRequest({
  onUnauthorized: () => {
    const auth = authenStore(pinia);
    auth.logout();
    if (router.currentRoute.value.name !== "login") {
      void router.replace({ name: "login", query: { redirect: router.currentRoute.value.fullPath } });
    }
  },
});

app.mount("#app");
