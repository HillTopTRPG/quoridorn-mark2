<template>
  <div id="app">
    <div id="back-screen"></div>
    <div id="YoutubePlayerContainer">
      <div class="unUse"><div id="YoutubePlayer001"></div></div>
      <div class="unUse"><div id="YoutubePlayer002"></div></div>
      <div class="unUse"><div id="YoutubePlayer003"></div></div>
      <div class="unUse"><div id="YoutubePlayer004"></div></div>
    </div>

    <template v-if="roomInitialized">
      <game-table ref="gameTable" />
      <Menu :roomInfo="roomInfo" />
      <right-pane />
      <context />
    </template>
    <window-area />
    <div id="wheelMarker" :class="{ hide: !isMapWheeling }"></div>
    <div id="loadingCreateRoom" v-if="isCreatingRoomMode">
      <div class="message">お部屋を作成しています！</div>
      <img
        src="http://quoridorn.com/img/mascot/struggle/mascot_struggle.png"
        alt=""
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import BaseInput from "@/app/core/component/BaseInput.vue";
import { Getter } from "vuex-class";
import GameTable from "@/app/basic/map/GameTable.vue";
import Menu from "@/app/basic/menu/Menu.vue";
import TaskManager from "@/app/core/task/TaskManager";
import Context from "@/app/core/context/Context.vue";
import EventProcessor from "@/app/core/event/EventProcessor";
import WindowArea from "@/app/core/window/WindowArea.vue";
import WindowManager from "@/app/core/window/WindowManager";
import { Point } from "@/@types/address";
import { createPoint, getEventPoint } from "@/app/core/Coordinate";
import RightPane from "@/app/core/pane/RightPane.vue";
import CssManager from "@/app/core/css/CssManager";
import { WindowOpenInfo } from "@/@types/window";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "@/@types/task";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import {
  ClientRoomInfo,
  GetRoomListResponse,
  RoomViewResponse
} from "@/@types/socket";
import { StoreObj, StoreUseData } from "@/@types/store";
import QuerySnapshot from "nekostore/lib/QuerySnapshot";
import BgmManager from "@/app/basic/music/BgmManager";

@Component({
  components: {
    RightPane,
    WindowArea,
    Context,
    Menu,
    GameTable,
    BaseInput
  }
})
export default class App extends Vue {
  @Getter("mapBackgroundColor") private mapBackgroundColor: any;

  private readonly key = "App";
  private isMapWheeling: boolean = false;
  private roomInitialized: boolean = false;
  private isCreatingRoomMode: boolean = false;
  private isMounted: boolean = false;

  private isModal: boolean = false;

  private roomInfo: ClientRoomInfo | null = null;

  private get elm(): HTMLElement {
    return document.getElementById("app") as HTMLElement;
  }

  @LifeCycle
  public async created() {}

  @LifeCycle
  private async beforeMount() {
    CssManager.instance.setGlobalCss();
  }

  @LifeCycle
  private destroyed() {
    SocketFacade.instance.destroy();
    WindowManager.instance.destroy();
  }

  @LifeCycle
  public async mounted() {
    document.documentElement.style.setProperty(
      "--background-background-color",
      "transparent"
    );
    document.documentElement.style.setProperty(
      "--background-background-image",
      "none"
    );
    // ログイン画面の表示
    const serverInfo = await SocketFacade.instance.socketCommunication<
      never,
      GetRoomListResponse
    >("get-room-list");
    SocketFacade.instance.socketOn<RoomViewResponse[]>(
      "result-room-view",
      (err, changeList) => {
        changeList.forEach(change => {
          if (change.changeType === "removed") {
            const index = serverInfo.roomList.findIndex(
              (info: StoreUseData<ClientRoomInfo>) => info.id === change.id
            );
            serverInfo.roomList.splice(index, 1, {
              order: index,
              exclusionOwner: null,
              status: null,
              createTime: new Date(),
              updateTime: null,
              id: null
            });
          } else {
            const index = change.data!.order;
            serverInfo.roomList.splice(index, 1, {
              ...change.data!,
              id: change.id
            });
          }
        });
      }
    );
    await TaskManager.instance.ignition<
      WindowOpenInfo<GetRoomListResponse>,
      never
    >({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "login-window",
        args: serverInfo
      }
    });
    this.isMounted = true;
  }

  private async cutInDbInspection() {
    /* カットインを再生処理 */
    const privatePlayListCC = SocketFacade.instance.privatePlayListCC();

    const playCutIn = async (targetId: string) => {
      try {
        const data = await privatePlayListCC.getData(targetId);
        if (!data) {
          await privatePlayListCC.touch(targetId);
          await privatePlayListCC.add(targetId, "exist");
        }
        const cutInDataCC = SocketFacade.instance.cutInDataCC();
        const cutInData = await cutInDataCC.getData(targetId);
        if (BgmManager.isYoutube(cutInData!.data!)) {
          // カットインがYoutube動画だったらYoutube動画再生する
          await TaskManager.instance.ignition<WindowOpenInfo<string>, never>({
            type: "window-open",
            owner: "Quoridorn",
            value: {
              type: "play-youtube-window",
              args: targetId
            }
          });
        }
      } catch (err) {
        window.console.warn(err);
      }
    };

    (await privatePlayListCC.getList(false)).forEach(async item => {
      await playCutIn(item.id!);
    });
    const playListCC = SocketFacade.instance.playListCC();
    await playListCC.setCollectionSnapshot(
      "App",
      (snapshot: QuerySnapshot<StoreObj<CutInPlayingInfo>>) => {
        snapshot.docs.forEach(async doc => {
          const targetId = doc.ref.id;
          if (doc.type === "modified") {
            const status = doc.data!.status;
            if (
              status === "added" ||
              status === "modified" ||
              status === "touched-released"
            )
              await playCutIn(targetId);
          }
          if (doc.type === "removed") {
            const privatePlayData = await privatePlayListCC.getData(targetId);
            if (privatePlayData) {
              try {
                await privatePlayListCC.touchModify(targetId);
              } catch (err) {
                window.console.warn(err);
                return;
              }
              await privatePlayListCC.delete(targetId);
            }
          }
        });
      }
    );
  }

  /**
   * キーダウンイベント
   * @param event
   */
  @EventProcessor("keydown")
  private async keyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      // Escが押下されたとき、入力画面がアクティブ画面だったら、それを閉じる
      const activeWindowInfo = WindowManager.instance.activeWindow;
      if (activeWindowInfo && activeWindowInfo.declare.isInputWindow) {
        await TaskManager.instance.ignition<string, never>({
          type: "window-close",
          owner: "Quoridorn",
          value: activeWindowInfo.key
        });
      }
      return;
    }
    if (event.key === "Enter") {
      window.console.log("GLOBAL enter");
      await TaskManager.instance.ignition<never, never>({
        type: "global-enter",
        owner: "Quoridorn",
        value: null
      });
    }
  }

  /**
   * ホイールイベント
   * @param event
   */
  @EventProcessor("wheel")
  private async onWheel(event: WheelEvent) {
    await TaskManager.instance.ignition<boolean, never>({
      type: "action-wheel",
      owner: "Quoridorn",
      value: event.deltaY < 0
    });
  }

  private mouse: Point = createPoint(0, 0);

  /**
   * マウス移動イベント
   * @param event
   */
  @EventProcessor("mousedown")
  private mouseDown(event: MouseEvent | TouchEvent): void {
    this.mouse = getEventPoint(event);
  }

  /**
   * マウス移動/タッチ移動イベント
   * @param event
   */
  @EventProcessor("touchmove")
  @EventProcessor("mousemove")
  private async mouseTouchMove(event: MouseEvent | TouchEvent): Promise<void> {
    const point = getEventPoint(event);
    if (point.x === this.mouse.x && point.y === this.mouse.y) return;
    await TaskManager.instance.ignition<Point, never>({
      type: "mouse-moving",
      owner: "Quoridorn",
      value: point
    });
  }

  /**
   * マウスボタン離上イベント
   * @param event
   */
  @EventProcessor("mouseup")
  @EventProcessor("touchend")
  @EventProcessor("touchcancel")
  private async mouseUp(event: MouseEvent | TouchEvent): Promise<void> {
    let type: string | null = null;
    if ("touches" in event) {
      type = "mouse-move-end-left";
    } else {
      if (event.button <= 2) {
        type =
          event.button === 2 ? "mouse-move-end-right" : "mouse-move-end-left";
      }
    }
    if (type) {
      await TaskManager.instance.ignition<Point, never>({
        type,
        owner: "Quoridorn",
        value: getEventPoint(event)
      });
    }
  }

  @Watch("mapBackgroundColor", { immediate: true })
  private onChangeMapBackgroundColor(mapBackgroundColor: string): void {
    document.body.style.backgroundColor = mapBackgroundColor;
  }

  @Watch("isMounted")
  @Watch("isModal")
  private onChangeIsModal() {
    this.elm.style.setProperty("--filter", this.isModal ? "blur(3px)" : "none");
  }

  @TaskProcessor("socket-connect-finished")
  private async socketConnectFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    window.console.log("socket-connect-finished");
    task.resolve();
  }

  @TaskProcessor("room-initialize-finished")
  private async roomInitializeFinished(
    task: Task<ClientRoomInfo, never>
  ): Promise<TaskResult<never> | void> {
    // 部屋に接続できた
    this.roomInitialized = true;
    this.roomInfo = task.value!;
    await this.cutInDbInspection();
    task.resolve();
  }

  @TaskProcessor("mode-change-finished")
  private async modeChangeFinished(
    task: Task<ModeInfo, never>
  ): Promise<TaskResult<never> | void> {
    const type: string = task.value!.type;
    const value: string = task.value!.value;
    if (type === "wheel") {
      this.isMapWheeling = value === "on";
      task.resolve();
    }
    if (type === "create-room") {
      this.isCreatingRoomMode = value === "on";
      task.resolve();
    }
    if (task.value!.type === "modal") {
      this.isModal = task.value!.value === "on";
      task.resolve();
    }
  }

  @TaskProcessor("socket-connect-error-finished")
  private async socketConnectErrorFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    window.console.warn("socket-connect-error-finished");
    task.resolve();
  }

  @TaskProcessor("socket-reconnecting-finished")
  private async socketReconnectingFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    window.console.warn("socket-reconnecting-finished");
    task.resolve();
  }

  @TaskProcessor("window-open-finished")
  private async windowOpenOpening(
    task: Task<WindowOpenInfo<unknown>, never>
  ): Promise<TaskResult<never> | void> {
    task.value!.key = WindowManager.instance.open(task.value!, task.key);
  }
}
</script>

<style lang="scss">
@import "../assets/common";

html,
body {
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-size: 14px;
}

/* サイズ調整（コンテンツを比率を変えずに内側にフィット） */
img {
  object-fit: contain;
}

div.img {
  opacity: 0;
  background-size: contain;
  background: no-repeat center;
}

hr {
  margin: 3px 0;
}

.anime {
  opacity: 0;
}

#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  position: relative;
  width: 100%;
  height: 100%;
  perspective: 1000px;
  display: flex;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
  user-select: none;
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;

  #back-screen {
    position: absolute;
    background-image: var(--background-image);
    background-color: var(--background-color);
    background-size: cover;
    background-position: center;
    width: 100%;
    height: 100%;
    filter: blur(var(--mask-blur));
    transform: var(--background-transform);
  }
}

.selectable {
  user-select: text;
  -ms-user-select: text;
  -moz-user-select: text;
  -webkit-user-select: text;
}

.flexCenter {
  display: flex;
  justify-content: center;
  align-items: center;
}

.public-memo-tile:hover + .public-memo-fukidashi {
  visibility: visible;
}

#wheelMarker {
  pointer-events: none;
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  transition: all 0.3s linear;
  z-index: 12;

  &.hide {
    opacity: 0;
  }

  &:before,
  &:after {
    position: absolute;
    content: "";
    display: block;
  }
  &:before {
    top: calc(50% - 1px);
    left: calc(50% - 15px);
    right: calc(50% - 15px);
    border-top: 2px rgba(0, 0, 0, 0.8) dotted;
  }
  &:after {
    left: calc(50% - 1px);
    top: calc(50% - 15px);
    bottom: calc(50% - 15px);
    border-left: 2px rgba(0, 0, 0, 0.8) dotted;
  }
}

#loadingCreateRoom {
  @include flex-box(column, center, center);
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);

  img {
    width: 200px;
    height: 200px;
  }

  .message {
    position: relative;
    font-size: 200%;
    background-color: white;
    border-radius: 0.3em;
    padding: 0.4em;
    margin-bottom: 1rem;

    &:before {
      content: "";
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%) translateY(100%);
      border-color: transparent;
      border-width: 1rem;
      border-style: solid;
      border-top-color: white;
    }
  }
}
</style>
