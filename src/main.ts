import Vue from "vue";
import router from "./router";
import MainVue from "./MainVue.vue";
import VueI18n from "vue-i18n";
import ChitEditWindow from "./app/basic/object/chit/ChitEditWindow.vue";
import MapMastEditWindow from "./app/basic/object/map-mask/MapMaskEditWindow.vue";
import ResourceMasterAddWindow from "./app/basic/initiative/ResourceMasterAddWindow.vue";
import VersionInfoWindow from "./app/basic/login/VersionInfoWindow.vue";
import EditSceneWindow from "./app/basic/map/EditSceneWindow.vue";
import UserLoginWindow from "./app/basic/login/UserLoginWindow.vue";
import SceneListWindow from "./app/basic/map/SceneListWindow.vue";
import ChatTabAddWindow from "./app/basic/chat/tab/ChatTabAddWindow.vue";
import ResourceMasterListWindow from "./app/basic/initiative/ResourceMasterListWindow.vue";
import PlayerBoxWindow from "./app/basic/object/actor/PlayerBoxWindow.vue";
import CharacterEditWindow from "./app/basic/object/character/CharacterEditWindow.vue";
import CreateNewRoomWindow from "./app/basic/login/CreateNewRoomWindow.vue";
import DeleteRoomWindow from "./app/basic/login/DeleteRoomWindow.vue";
import RoomInfoWindow from "./app/basic/login/RoomInfoWindow.vue";
import ActorEditWindow from "./app/basic/object/actor/ActorEditWindow.vue";
import AppServerSettingWindow from "./app/basic/login/AppServerSettingWindow.vue";
import ActorAddWindow from "./app/basic/object/actor/ActorAddWindow.vue";
import ChatWindow from "./app/basic/chat/ChatWindow.vue";
import EditOtherTextWindow from "./app/basic/other-text/EditOtherTextWindow.vue";
import InitiativeWindow from "./app/basic/initiative/InitiativeWindow.vue";
import TermsOfUseWindow from "./app/basic/login/TermsOfUseWindow.vue";
import MapMastAddWindow from "./app/basic/object/map-mask/MapMaskAddWindow.vue";
import LoginRoomWindow from "./app/basic/login/LoginRoomWindow.vue";
import ChitAddWindow from "./app/basic/object/chit/ChitAddWindow.vue";
import BgmAddWindow from "./app/basic/cut-in/bgm/BgmAddWindow.vue";
import CardDeckListWindow from "./app/basic/card/CardDeckListWindow.vue";
import BgmEditWindow from "./app/basic/cut-in/bgm/BgmEditWindow.vue";
import LoginWindow from "./app/basic/login/LoginWindow.vue";
import CutInListWindow from "./app/basic/cut-in/CutInListWindow.vue";
import CharacterAddWindow from "./app/basic/object/character/CharacterAddWindow.vue";
import store from "./app/store/store";
import ChatTabEditWindow from "./app/basic/chat/tab/ChatTabEditWindow.vue";
import MediaListWindow from "./app/basic/media/MediaListWindow.vue";
import MediaUploadWindow from "./app/basic/media/MediaUploadWindow.vue";
import BcdiceApiServerSettingWindow from "./app/basic/login/BcdiceApiServerSettingWindow.vue";
import CardDeckSmallEditWindow from "./app/basic/card/CardDeckSmallEditWindow.vue";
import LanguageManager from "./LanguageManager";
import ResourceMasterEditWindow from "./app/basic/initiative/ResourceMasterEditWindow.vue";
import ChmodWindow from "./app/basic/chmod/ChmodWindow.vue";
import PlayYoutubeWindow from "./app/basic/cut-in/bgm/PlayYoutubeWindow.vue";
import ConfirmWindow from "./app/core/window/ConfirmWindow.vue";
import PlayBgmFileWindow from "./app/basic/cut-in/bgm/PlayBgmFileWindow.vue";
import ReadAloudManager from "./ReadAloudManager";
import ChatSettingWindow from "./app/basic/chat/ChatSettingWindow.vue";

Vue.config.productionTip = false;
Vue.use(VueI18n);

let isYoutubeApiReady = false;

(window as any).onYouTubeIframeAPIReady = () => {
  isYoutubeApiReady = true;
};

async function main(): Promise<void> {
  // 最初に読み上げ音声一覧を取得する
  await ReadAloudManager.init();

  Vue.component("cut-in-list-window", CutInListWindow);
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
  Vue.component("map-mask-add-window", MapMastAddWindow);
  Vue.component("map-mask-edit-window", MapMastEditWindow);
  Vue.component("chit-add-window", ChitAddWindow);
  Vue.component("chit-edit-window", ChitEditWindow);
  Vue.component("edit-other-text-window", EditOtherTextWindow);
  Vue.component("scene-list-window", SceneListWindow);
  Vue.component("edit-scene-window", EditSceneWindow);
  Vue.component("chmod-window", ChmodWindow);
  Vue.component("bgm-add-window", BgmAddWindow);
  Vue.component("bgm-edit-window", BgmEditWindow);
  Vue.component("chat-window", ChatWindow);
  Vue.component("chat-setting-window", ChatSettingWindow);
  Vue.component("chat-tab-add-window", ChatTabAddWindow);
  Vue.component("chat-tab-edit-window", ChatTabEditWindow);
  Vue.component("actor-add-window", ActorAddWindow);
  Vue.component("actor-edit-window", ActorEditWindow);
  Vue.component("player-box-window", PlayerBoxWindow);
  Vue.component("card-deck-list-window", CardDeckListWindow);
  Vue.component("media-list-window", MediaListWindow);
  Vue.component("media-upload-window", MediaUploadWindow);
  Vue.component("card-deck-small-edit-window", CardDeckSmallEditWindow);
  Vue.component("play-bgm-file-window", PlayBgmFileWindow);
  Vue.component("character-add-window", CharacterAddWindow);
  Vue.component("character-edit-window", CharacterEditWindow);
  Vue.component("initiative-window", InitiativeWindow);
  Vue.component("resource-master-add-window", ResourceMasterAddWindow);
  Vue.component("resource-master-edit-window", ResourceMasterEditWindow);
  Vue.component("resource-master-list-window", ResourceMasterListWindow);
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
