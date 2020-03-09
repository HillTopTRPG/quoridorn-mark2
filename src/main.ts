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
import BcdiceManager from "@/app/core/api/bcdice/BcdiceManager";
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
import EditOtherTextWindow from "@/app/basic/other-text/EditOtherTextWindow.vue";
import EditChitWindow from "@/app/basic/map-object/chit/EditChitWindow.vue";
import SceneListWindow from "@/app/basic/map/SceneListWindow.vue";
import EditSceneWindow from "@/app/basic/map/EditSceneWindow.vue";
import ChmodWindow from "@/app/basic/chmod/ChmodWindow.vue";
import AddBgmWindow from "@/app/basic/music/AddBgmWindow.vue";
import EditBgmWindow from "@/app/basic/music/EditBgmWindow.vue";
import BcdiceApiServerSettingWindow from "@/app/basic/login/BcdiceApiServerSettingWindow.vue";
import ChatWindow from "@/app/basic/chat/ChatWindow.vue";

Vue.config.productionTip = false;
Vue.use(ImageDirective);
Vue.use(VueI18n);

let isYoutubeApiReady = false;

(window as any).onYouTubeIframeAPIReady = () => {
  isYoutubeApiReady = true;
};

async function init(): Promise<void> {
  return new Promise(async resolve => {
    await SocketFacade.instance.init();
    const bcdiceServer = SocketFacade.instance.connectInfo.bcdiceServer;
    await BcdiceManager.instance.init(bcdiceServer);
    YoutubeManager.init();

    const intervalId = window.setInterval(() => {
      if (!isYoutubeApiReady) return;
      clearInterval(intervalId);
      resolve();
    }, 100);
  });
}

async function main(): Promise<void> {
  await init();

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
  Vue.component("scene-list-window", SceneListWindow);
  Vue.component("edit-scene-window", EditSceneWindow);
  Vue.component("chmod-window", ChmodWindow);
  Vue.component("add-bgm-window", AddBgmWindow);
  Vue.component("edit-bgm-window", EditBgmWindow);
  Vue.component("chat-window", ChatWindow);
  Vue.component(
    "bcdice-api-server-setting-window",
    BcdiceApiServerSettingWindow
  );

  const i18n: VueI18n = await LanguageManager.instance.init();

  const app = new Vue({
    // @ts-ignore
    router,
    i18n,
    store,
    render: (h: any) => h(MainVue)
  });
  app.$mount("#app");
}
main().then();
