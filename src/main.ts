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
import LoginWindow from "@/app/basic/login/LoginWindow.vue";
import CreateNewRoomWindow from "@/app/basic/login/CreateNewRoomWindow.vue";
import BCDiceFacade from "@/app/core/api/bcdice/BCDiceFacade";
import UserLoginWindow from "@/app/basic/login/UserLoginWindow.vue";
import AppServerSettingWindow from "@/app/basic/login/AppServerSettingWindow.vue";
import TermsOfUseWindow from "@/app/basic/login/TermsOfUseWindow.vue";
import DeleteRoomWindow from "@/app/basic/login/DeleteRoomWindow.vue";
import ConfirmWindow from "@/app/core/window/ConfirmWindow.vue";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";

Vue.config.productionTip = false;
Vue.use(ImageDirective);

SocketFacade.instance;
BCDiceFacade.instance;
YoutubeManager.instance;

Vue.component("test-window", TestWindow);
Vue.component("sample-window", SampleWindow);
Vue.component("bgm-setting-window", BgmSettingWindow);
Vue.component("play-youtube-window", PlayYoutubeWindow);
Vue.component("login-window", LoginWindow);
Vue.component("create-new-room-window", CreateNewRoomWindow);
Vue.component("user-login-window", UserLoginWindow);
Vue.component("app-server-setting-window", AppServerSettingWindow);
Vue.component("terms-of-use-window", TermsOfUseWindow);
Vue.component("delete-room-window", DeleteRoomWindow);
Vue.component("confirm-window", ConfirmWindow);

const app = new Vue({
  // @ts-ignore
  router,
  store,
  render: (h: any) => h(MainVue)
});
app.$mount("#app");
