import Vue from "vue";
import router from "./router";
import MainVue from "./MainVue.vue";
import store from "@/app/store/store";
import ImageDirective from "@/app/basic/common/directive/Image";
import CutInSettingWindow from "@/app/basic/music/CutInSettingWindow.vue";
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
import VueI18n from "vue-i18n";
import LanguageManager from "@/LanguageManager";
import LoginRoomWindow from "@/app/basic/login/LoginRoomWindow.vue";
import VersionInfoWindow from "@/app/basic/login/VersionInfoWindow.vue";
import RoomInfoWindow from "@/app/basic/login/RoomInfoWindow.vue";
import AddMapMaskWindow from "@/app/basic/map-object/map-mask/AddMapMaskWindow.vue";
import EditMapMaskWindow from "@/app/basic/map-object/map-mask/EditMapMaskWindow.vue";
import AddChitWindow from "@/app/basic/map-object/chit/AddChitWindow.vue";
import InputImagePasswordWindow from "@/app/core/component/InputImagePasswordWindow.vue";
import { markdown } from "@/app/core/markdown/markdown";
import EditOtherTextWindow from "@/app/basic/other-text/EditOtherTextWindow.vue";
import EditChitWindow from "@/app/basic/map-object/chit/EditChitWindow.vue";

Vue.config.productionTip = false;
Vue.use(ImageDirective);
Vue.use(VueI18n);

SocketFacade.instance;
BCDiceFacade.instance;
YoutubeManager.instance;

Vue.component("cut-in-setting-window", CutInSettingWindow);
Vue.component("play-youtube-window", PlayYoutubeWindow);
Vue.component("login-window", LoginWindow);
Vue.component("create-new-room-window", CreateNewRoomWindow);
Vue.component("user-login-window", UserLoginWindow);
Vue.component("app-server-setting-window", AppServerSettingWindow);
Vue.component("terms-of-use-window", TermsOfUseWindow);
Vue.component("delete-room-window", DeleteRoomWindow);
Vue.component("confirm-window", ConfirmWindow);
Vue.component("login-room-window", LoginRoomWindow);
Vue.component("version-info-window", VersionInfoWindow);
Vue.component("room-info-window", RoomInfoWindow);
Vue.component("add-map-mask-window", AddMapMaskWindow);
Vue.component("edit-map-mask-window", EditMapMaskWindow);
Vue.component("add-chit-window", AddChitWindow);
Vue.component("edit-chit-window", EditChitWindow);
Vue.component("input-image-password-window", InputImagePasswordWindow);
Vue.component("edit-other-text-window", EditOtherTextWindow);

LanguageManager.instance.init().then((i18n: any) => {
  const app = new Vue({
    // @ts-ignore
    router,
    i18n,
    store,
    render: (h: any) => h(MainVue)
  });
  app.$mount("#app");
});

window.console.log(markdown(`_a_`));
