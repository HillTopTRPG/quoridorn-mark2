<template>
  <div id="app" @scroll.prevent.stop>
    <!-- 最も後ろの背景 (z-index: 0) -->
    <div id="back-scene"></div>

    <template v-if="roomInitialized">
      <!-- プレイマット (z-index: 1) -->
      <game-table ref="gameTable" />
      <!-- メニュー (z-index: 5) -->
      <Menu :roomInfo="roomInfo" />
      <!-- 右ペイン (z-index: 2) -->
      <right-pane />
      <!-- 右クリックメニュー (z-index: 4) -->
      <context />
    </template>
    <!-- 小画面エリア (z-index: 3) -->
    <window-area />
    <!-- その他欄 (z-index: 6) -->
    <other-text-frame
      :otherTextViewInfo="otherTextViewInfo"
      @hide="otherTextHide"
      v-if="otherTextViewInfo"
    />
    <!-- 放物線シミュレータ (z-index: 7) -->
    <throw-parabola-simulator v-if="throwParabola" />
    <!-- 放物線シミュレータ (z-index: 8) -->
    <throw-parabola-container />
    <!-- お部屋作成中 (z-index: 10) -->
    <div id="loading-create-room" v-if="isCreatingRoomMode">
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
import GameTable from "@/app/basic/map/GameTable.vue";
import Menu from "@/app/basic/menu/Menu.vue";
import TaskManager from "@/app/core/task/TaskManager";
import Context from "@/app/core/context/Context.vue";
import EventProcessor from "@/app/core/event/EventProcessor";
import WindowArea from "@/app/core/window/WindowArea.vue";
import WindowManager from "@/app/core/window/WindowManager";
import { Point, Size } from "address";
import { createPoint, createSize, getEventPoint } from "@/app/core/Coordinate";
import RightPane from "@/app/core/pane/RightPane.vue";
import CssManager from "@/app/core/css/CssManager";
import { WindowOpenInfo } from "@/@types/window";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import {
  ClientRoomInfo,
  GetRoomListResponse,
  LoginWindowInput,
  RoomViewResponse,
  SendDataRequest,
  ServerTestResult
} from "@/@types/socket";
import { StoreUseData } from "@/@types/store";
import BgmManager from "@/app/basic/music/BgmManager";
import OtherTextFrame from "@/app/basic/other-text/OtherTextFrame.vue";
import { OtherTextViewInfo } from "@/@types/gameObject";
import { ModeInfo } from "mode";
import ThrowParabolaSimulator from "@/app/core/throwParabola/ThrowParabolaSimulator.vue";
import ThrowParabolaContainer from "@/app/core/throwParabola/ThrowParabolaContainer.vue";
import { BgmPlayInfo, TabMoveInfo, ThrowParabolaInfo } from "task-info";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { CutInDeclareInfo } from "@/@types/room";
import { disableBodyScroll } from "body-scroll-lock";

@Component({
  components: {
    ThrowParabolaContainer,
    ThrowParabolaSimulator,
    OtherTextFrame,
    RightPane,
    WindowArea,
    Context,
    Menu,
    GameTable,
    BaseInput
  }
})
export default class App extends Vue {
  private readonly key = "App";
  private roomInitialized: boolean = false;
  private isCreatingRoomMode: boolean = false;
  private isMounted: boolean = false;

  private isModal: boolean = false;

  private roomInfo: ClientRoomInfo | null = null;
  private otherTextViewInfo: OtherTextViewInfo | null = null;
  private throwParabola: boolean = false;

  private cutInList = GameObjectManager.instance.cutInList;

  private static get elm(): HTMLElement {
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
    SocketFacade.instance.destroy().then();
    WindowManager.instance.destroy().then();
  }

  @LifeCycle
  public async mounted() {
    disableBodyScroll();
    document.documentElement.style.setProperty(
      "--background-background-color",
      "transparent"
    );
    document.documentElement.style.setProperty(
      "--background-background-image",
      "none"
    );

    // // 検証用
    // await TaskManager.instance.ignition<WindowOpenInfo<never>, never>({
    //   type: "window-open",
    //   owner: "Quoridorn",
    //   value: {
    //     type: "edit-other-text-window"
    //   }
    // });
    SocketFacade.instance.socketOn<SendDataRequest<any>>(
      "send-data",
      async (err, data) => {
        const dataType = data.dataType;
        if (dataType === "throw-parabola") {
          // 投射通知
          await TaskManager.instance.ignition<ThrowParabolaInfo, never>({
            type: "throw-parabola",
            owner: data.owner,
            value: data.data as ThrowParabolaInfo
          });
        } else if (dataType === "bgm-stand-by") {
          // BGMスタンバイ通知
        } else if (dataType === "bgm-play") {
          // BGM再生通知
          const info = data.data as BgmPlayInfo;
          await BgmManager.instance.callBgm({
            targetId: info.id,
            data: null
          });
        }
      }
    );

    // ログイン画面の表示
    const serverInfo = await SocketFacade.instance.socketCommunication<
      string,
      GetRoomListResponse
    >("get-room-list", process.env.VUE_APP_VERSION);
    SocketFacade.instance.socketOn<RoomViewResponse[]>(
      "result-room-view",
      (err, changeList) => {
        changeList.forEach(change => {
          if (change.changeType === "removed") {
            const index = serverInfo.roomList!.findIndex(
              (info: StoreUseData<ClientRoomInfo>) => info.id === change.id
            );
            serverInfo.roomList!.splice(index, 1, {
              order: index,
              exclusionOwner: null,
              lastExclusionOwner: null,
              owner: null,
              permission: null,
              status: null,
              createTime: new Date(),
              updateTime: null,
              id: null
            });
          } else {
            const index = change.data!.order;
            serverInfo.roomList!.splice(index, 1, {
              ...change.data!,
              id: change.id
            });
          }
        });
      }
    );
    let resp: ServerTestResult;
    const url = SocketFacade.instance.appServerUrl;
    try {
      resp = await SocketFacade.instance.testServer(url);
    } catch (err) {
      window.console.warn(`${err}. url:${url}`);
      return;
    }

    await TaskManager.instance.ignition<
      WindowOpenInfo<LoginWindowInput>,
      never
    >({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "login-window",
        args: {
          ...serverInfo,
          serverTestResult: resp
        }
      }
    });
    this.isMounted = true;
  }

  @Watch("cutInList", { deep: true, immediate: true })
  private async onChangeCutInList() {
    const openWindowFunc = async (
      c: StoreUseData<CutInDeclareInfo>
    ): Promise<void> => {
      const targetId = c.id!;
      const windowKeyList: (string | null)[] = [];
      BgmManager.instance.standByWindowList.push({
        targetId,
        windowKeyList
      });
      for (let i = 0; i < 3; i++) {
        windowKeyList.push(null);
        await BgmManager.openStandByWindow(targetId);
      }
    };

    await this.cutInList
      .filter(c => c.data!.isStandBy)
      .filter(
        c =>
          !BgmManager.instance.standByWindowList.filter(
            s => s.targetId === c.id
          )[0]
      )
      .map((c: StoreUseData<CutInDeclareInfo>) => () => openWindowFunc(c))
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());
  }

  /**
   * 画面サイズ変更イベント
   */
  @EventProcessor("resize", window)
  private async resize() {
    await TaskManager.instance.ignition<Size, never>({
      type: "resize",
      owner: "Quoridorn",
      value: createSize(window.innerWidth, window.innerHeight)
    });
  }

  /**
   * キーダウンイベント
   * @param event
   */
  @EventProcessor("keydown")
  private async keyDown(event: KeyboardEvent) {
    if (event.metaKey || event.ctrlKey) {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        const activeWindowInfo = WindowManager.instance.activeWindow;
        if (activeWindowInfo) {
          await TaskManager.instance.ignition<TabMoveInfo, never>({
            type: "tab-move",
            owner: "Quoridorn",
            value: {
              windowKey: activeWindowInfo.key,
              addIndex: event.key === "ArrowRight" ? 1 : -1
            }
          });
        }
        return;
      }
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        const activeWindowInfo = WindowManager.instance.activeWindow;
        if (activeWindowInfo) {
          await TaskManager.instance.ignition<TabMoveInfo, never>({
            type: "row-select",
            owner: "Quoridorn",
            value: {
              windowKey: activeWindowInfo.key,
              addIndex: event.key === "ArrowDown" ? 1 : -1
            }
          });
        }
        return;
      }
    }
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
      return;
    }

    if (event.key === "Shift" && event.ctrlKey) {
      await TaskManager.instance.ignition<ModeInfo, never>({
        type: "mode-change",
        owner: "Quoridorn",
        value: {
          type: "throw-parabola",
          value: this.throwParabola ? "off" : "on"
        }
      });
      return;
    }
    // window.console.log(event.key);
  }

  // @EventProcessor("keyup")
  // private async keyUp(event: KeyboardEvent) {
  //   if (event.key === "Shift") {
  //     await TaskManager.instance.ignition<ModeInfo, never>({
  //       type: "mode-change",
  //       owner: "Quoridorn",
  //       value: {
  //         type: "throw-parabola",
  //         value: "off"
  //       }
  //     });
  //     return;
  //   }
  // }

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

  @Watch("isMounted")
  @Watch("isModal")
  private onChangeIsModal() {
    App.elm.style.setProperty("--filter", this.isModal ? "blur(3px)" : "none");
  }

  @TaskProcessor("socket-connect-finished")
  private async socketConnectFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    window.console.log("socket-connect-finished");
    task.resolve();
  }

  @TaskProcessor("other-text-view-finished")
  private async otherTextView(
    task: Task<OtherTextViewInfo, never>
  ): Promise<TaskResult<never> | void> {
    this.otherTextViewInfo = task.value;
    task.resolve();
  }

  private otherTextHide() {
    this.otherTextViewInfo = null;
  }

  @TaskProcessor("room-initialize-finished")
  private async roomInitializeFinished(
    task: Task<ClientRoomInfo, never>
  ): Promise<TaskResult<never> | void> {
    // 部屋に接続できた
    this.roomInitialized = true;
    this.roomInfo = task.value!;
    task.resolve();
  }

  @TaskProcessor("mode-change-finished")
  private async modeChangeFinished(
    task: Task<ModeInfo, never>
  ): Promise<TaskResult<never> | void> {
    const type: string = task.value!.type;
    const value: string = task.value!.value;
    if (type === "create-room") {
      this.isCreatingRoomMode = value === "on";
      task.resolve();
    }
    if (type === "modal") {
      this.isModal = value === "on";
      task.resolve();
    }
    if (type === "throw-parabola") {
      this.throwParabola = value === "on";
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
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-size: 14px;
  background-color: #92a8b3;
}

table {
  border-collapse: collapse;
  border-spacing: 0;
}

/* サイズ調整（コンテンツを比率を変えずに内側にフィット） */
img {
  object-fit: contain;
}

div.img {
  /*opacity: 0;*/
  background-size: contain;
  background: no-repeat center;
}

hr {
  margin: 3px 0;
}

.anime {
  /*opacity: 0;*/
}

label {
  cursor: inherit;
}

#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
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

#back-scene {
  position: fixed;
  background-size: cover;
  background-position: center;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  filter: blur(var(--mask-blur));
  z-index: 0;
  /* JavaScriptで設定されるプロパティ
  background-image
  background-color
  transform
  */
}

#gameTableContainer {
  z-index: 1;
}

#menu {
  z-index: 5;
}

#right-pane {
  z-index: 2;
}

#context {
  z-index: 4;
}

#window-area {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 3;
}

.other-text-frame {
  z-index: 6;
}

#throw-parabola-simulator {
  z-index: 7;
}

#throw-parabola-container {
  z-index: 8;
}

#loading-create-room {
  @include flex-box(column, center, center);
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 10;

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
