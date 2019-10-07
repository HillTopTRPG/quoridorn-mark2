import Vue from "vue";
import router from "./router";
import MainVue from "./MainVue.vue";
import store from "@/app/store/store";
import ImageDirective from "@/app/basic/common/directive/Image";
import TestWindow from "@/app/basic/common/window/TestWindow.vue";
import SampleWindow from "@/app/basic/common/window/SampleWindow.vue";
import BgmSettingWindow from "@/app/basic/music/BgmSettingWindow.vue";
import YoutubeManager from "@/app/basic/music/YoutubeManager";
import PlayYoutubeWindow from "@/app/basic/music/PlayYoutubeWindow.vue";

Vue.config.productionTip = false;
Vue.use(ImageDirective);

YoutubeManager.instance;

Vue.component("test-window", TestWindow);
Vue.component("sample-window", SampleWindow);
Vue.component("bgm-setting-window", BgmSettingWindow);
Vue.component("play-youtube-window", PlayYoutubeWindow);

const app = new Vue({
  router,
  store,
  render: (h: any) => h(MainVue)
});
app.$mount("#app");
