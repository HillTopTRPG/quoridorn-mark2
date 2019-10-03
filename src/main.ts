import Vue from "vue";
import router from "./router";
import MainVue from "./MainVue.vue";
import store from "@/app/store/store";
import ImageDirective from "@/app/basic/common/directive/Image";
import TestWindow from "@/app/basic/common/window/TestWindow.vue";
import SampleWindow from "@/app/basic/common/window/SampleWindow.vue";
import BgmSettingWindow from "@/app/basic/music/BgmSettingWindow.vue";

Vue.config.productionTip = false;
Vue.use(ImageDirective);

Vue.component("test-window", TestWindow);
Vue.component("sample-window", SampleWindow);
Vue.component("bgm-setting-window", BgmSettingWindow);

const app = new Vue({
  router,
  store,
  render: h => h(MainVue)
});
app.$mount("#app");
