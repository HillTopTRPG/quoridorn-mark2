import Vue from "vue";
import ChatLog from "./ChatLog.vue";

Vue.config.productionTip = false;

const app = new Vue({
  render: h => h(ChatLog)
}).$mount("#app");
