import Vue from "vue";
import router from "./router";
import MainVue from "./MainVue.vue";
import VueI18n from "vue-i18n";
import ChitAddWindow from "./app/basic/object/chit/ChitAddWindow.vue";
import ChitEditWindow from "./app/basic/object/chit/ChitEditWindow.vue";
import MapMaskAddWindow from "./app/basic/object/map-mask/MapMaskAddWindow.vue";
import MapMaskEditWindow from "./app/basic/object/map-mask/MapMaskEditWindow.vue";
import MapMarkerAddWindow from "./app/basic/object/map-marker/MapMarkerAddWindow.vue";
import MapMarkerEditWindow from "./app/basic/object/map-marker/MapMarkerEditWindow.vue";
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
import InitiativeWindow from "./app/basic/initiative/InitiativeWindow.vue";
import TermsOfUseWindow from "./app/basic/login/TermsOfUseWindow.vue";
import LoginRoomWindow from "./app/basic/login/LoginRoomWindow.vue";
import CutInAddWindow from "./app/basic/cut-in/CutInAddWindow.vue";
import CardDeckListWindow from "./app/basic/card/CardDeckListWindow.vue";
import CutInEditWindow from "./app/basic/cut-in/CutInEditWindow.vue";
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
import ChmodInputWindow from "./app/basic/chmod/ChmodInputWindow.vue";
import PlayYoutubeWindow from "./app/basic/cut-in/bgm/PlayYoutubeWindow.vue";
import ConfirmWindow from "./app/core/window/ConfirmWindow.vue";
import PlayBgmFileWindow from "./app/basic/cut-in/bgm/PlayBgmFileWindow.vue";
import ReadAloudManager from "./ReadAloudManager";
import ChatSettingWindow from "./app/basic/chat/ChatSettingWindow.vue";
import ChatPaletteAddWindow from "./app/basic/chat-palette/ChatPaletteAddWindow.vue";
import ChatPaletteWindow from "./app/basic/chat-palette/ChatPaletteWindow.vue";
import ChatPaletteEditWindow from "./app/basic/chat-palette/ChatPaletteEditWindow.vue";
import DiceSymbolEditWindow from "@/app/basic/object/dice-symbol/DiceSymbolEditWindow.vue";
import DiceSymbolAddWindow from "@/app/basic/object/dice-symbol/DiceSymbolAddWindow.vue";
import SecretDiceRollWindow from "@/app/basic/chat/secret-dice/SecretDiceRollWindow.vue";
import SimpleTextInputWindow from "@/app/core/window/SimpleTextInputWindow.vue";
import MemoTabSettingWindow from "@/app/basic/other-text/MemoTabSettingWindow.vue";
import ChatPaletteTabSettingWindow from "@/app/basic/chat-palette/ChatPaletteTabSettingWindow.vue";
import PublicMemoAddWindow from "@/app/basic/public-memo/PublicMemoAddWindow.vue";
import PublicMemoEditWindow from "@/app/basic/public-memo/PublicMemoEditWindow.vue";
import LikeAddWindow from "@/app/basic/chat/like/LikeAddWindow.vue";
import LikeEditWindow from "@/app/basic/chat/like/LikeEditWindow.vue";
import ImageViewWindow from "@/app/basic/cut-in/ImageViewWindow.vue";
import MediaUrlAddWindow from "@/app/basic/media/url/MediaUrlAddWindow.vue";
import MediaUrlEditWindow from "@/app/basic/media/url/MediaUrlEditWindow.vue";
import CounterRemoconAddWindow from "@/app/basic/counter-remocon/CounterRemoconAddWindow.vue";
import CounterRemoconEditWindow from "@/app/basic/counter-remocon/CounterRemoconEditWindow.vue";
import CounterRemoconWindow from "@/app/basic/counter-remocon/CounterRemoconWindow.vue";

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
  Vue.component("map-mask-add-window", MapMaskAddWindow);
  Vue.component("map-mask-edit-window", MapMaskEditWindow);
  Vue.component("map-marker-add-window", MapMarkerAddWindow);
  Vue.component("map-marker-edit-window", MapMarkerEditWindow);
  Vue.component("chit-add-window", ChitAddWindow);
  Vue.component("chit-edit-window", ChitEditWindow);
  Vue.component("scene-list-window", SceneListWindow);
  Vue.component("edit-scene-window", EditSceneWindow);
  Vue.component("chmod-window", ChmodWindow);
  Vue.component("cut-in-add-window", CutInAddWindow);
  Vue.component("cut-in-edit-window", CutInEditWindow);
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
  Vue.component("chat-palette-window", ChatPaletteWindow);
  Vue.component("chat-palette-add-window", ChatPaletteAddWindow);
  Vue.component("chat-palette-edit-window", ChatPaletteEditWindow);
  Vue.component("dice-symbol-add-window", DiceSymbolAddWindow);
  Vue.component("dice-symbol-edit-window", DiceSymbolEditWindow);
  Vue.component("secret-dice-roll-window", SecretDiceRollWindow);
  Vue.component(
    "bcdice-api-server-setting-window",
    BcdiceApiServerSettingWindow
  );
  Vue.component("chmod-input-window", ChmodInputWindow);
  Vue.component("simple-text-input-window", SimpleTextInputWindow);
  Vue.component("memo-tab-setting-window", MemoTabSettingWindow);
  Vue.component("chat-palette-tab-setting-window", ChatPaletteTabSettingWindow);
  Vue.component("public-memo-add-window", PublicMemoAddWindow);
  Vue.component("public-memo-edit-window", PublicMemoEditWindow);
  Vue.component("like-add-window", LikeAddWindow);
  Vue.component("like-edit-window", LikeEditWindow);
  Vue.component("image-view-window", ImageViewWindow);
  Vue.component("media-url-add-window", MediaUrlAddWindow);
  Vue.component("media-url-edit-window", MediaUrlEditWindow);
  Vue.component("counter-remocon-add-window", CounterRemoconAddWindow);
  Vue.component("counter-remocon-edit-window", CounterRemoconEditWindow);
  Vue.component("counter-remocon-window", CounterRemoconWindow);

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
