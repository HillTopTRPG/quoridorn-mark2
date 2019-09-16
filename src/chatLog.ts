import Vue from "vue";
import ChatLog from "./ChatLog.vue";
import store from "./app/store/store_chat_log";

Vue.config.productionTip = false;

const app = new Vue({
  store,
  render: h => h(ChatLog)
}).$mount("#app");
