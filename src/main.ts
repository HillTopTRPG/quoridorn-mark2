import Vue from "vue";
import router from "./router";
import MainVue from "./MainVue.vue";
import store from "@/app/store/store";
import ImageDirective from "@/app/basic/common/directive/Image";

Vue.config.productionTip = false;
Vue.use(ImageDirective);

const app = new Vue({
  router,
  store,
  render: h => h(MainVue)
});
app.$mount("#app");
