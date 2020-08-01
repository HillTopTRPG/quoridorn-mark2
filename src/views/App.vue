<template>
  <div
    id="app"
    @scroll.prevent.stop
    @drop.prevent.stop="dropFile"
    @dragover.prevent.stop
    @dragenter.prevent.stop="onDragEnter"
    @dragleave.prevent.stop="onDragLeave"
    dropzone="move"
  >
    <!-- 最も後ろの背景 (z-index: 0) -->
    <div id="back-scene"></div>

    <!-- 最も手前でドロップを受ける領域 (z-index: 100) -->
    <drop-area :isDropping="isDropping" />

    <template v-if="roomInitialized">
      <!-- プレイマット (z-index: 1) -->
      <game-table ref="gameTable" />
      <!-- メニュー (z-index: 5) -->
      <Menu />
      <!-- 右ペイン (z-index: 2) -->
      <right-pane />
      <!-- 右クリックメニュー (z-index: 4) -->
      <Context />
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
    <!-- カードデッキビルダー (z-index: 9) -->
    <card-deck-builder v-if="cardView" :cardDeckId="cardDeckId" />
    <!-- お部屋作成中 (z-index: 10) -->
    <div id="progress-message-area" v-if="progressMessage">
      <div class="message">{{ progressMessage }}</div>
      <img
        draggable="false"
        src="https://quoridorn.com/img/mascot/struggle/mascot_struggle.png"
        alt=""
      />
      <div
        id="progress-bar"
        :style="{ '--ratio': `${(progressCurrent * 100) / progressAll}%` }"
        v-if="progressAll"
      ></div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { Point, Size } from "address";
import { Task, TaskResult } from "task";
import { ModeInfo } from "mode";
import { disableBodyScroll } from "body-scroll-lock";
import LifeCycle from "../app/core/decorator/LifeCycle";
import TaskProcessor from "../app/core/task/TaskProcessor";
import { OtherTextViewInfo } from "../@types/gameObject";
import {
  createPoint,
  createSize,
  getEventPoint
} from "../app/core/utility/CoordinateUtility";
import {
  ClientRoomInfo,
  GetRoomListResponse,
  LoginWindowInput,
  RoomViewResponse,
  SendDataRequest,
  ServerTestResult
} from "../@types/socket";
import {
  BgmPlayInfo,
  DropPieceInfo,
  TabMoveInfo,
  ThrowParabolaInfo
} from "task-info";
import { getDropFileList } from "../app/core/utility/DropFileUtility";
import WindowManager from "../app/core/window/WindowManager";
import { StoreUseData } from "../@types/store";
import CssManager from "../app/core/css/CssManager";
import GameObjectManager from "../app/basic/GameObjectManager";
import { CutInDeclareInfo, MediaUploadInfo } from "../@types/room";
import SocketFacade from "../app/core/api/app-server/SocketFacade";
import VueEvent from "../app/core/decorator/VueEvent";
import { convertNumberZero } from "../app/core/utility/PrimaryDataUtility";
import YoutubeManager from "../app/basic/cut-in/bgm/YoutubeManager";
import TaskManager from "../app/core/task/TaskManager";
import LanguageManager from "../LanguageManager";
import { WindowOpenInfo } from "../@types/window";
import EventProcessor from "../app/core/event/EventProcessor";
import BcdiceManager from "../app/core/api/bcdice/BcdiceManager";
import BgmManager from "../app/basic/cut-in/bgm/BgmManager";
import DropArea from "../app/basic/media/DropArea.vue";
import GameTable from "../app/basic/map/GameTable.vue";
import Menu from "../app/basic/menu/Menu.vue";
import RightPane from "../app/core/pane/RightPane.vue";
import Context from "../app/core/context/Context.vue";
import WindowArea from "../app/core/window/WindowArea.vue";
import OtherTextFrame from "../app/basic/other-text/OtherTextFrame.vue";
import ThrowParabolaSimulator from "../app/core/throwParabola/ThrowParabolaSimulator.vue";
import ThrowParabolaContainer from "../app/core/throwParabola/ThrowParabolaContainer.vue";
import CardDeckBuilder from "../app/basic/card/builder/CardDeckBuilder.vue";

@Component({
  components: {
    CardDeckBuilder,
    ThrowParabolaContainer,
    ThrowParabolaSimulator,
    OtherTextFrame,
    WindowArea,
    Context,
    RightPane,
    Menu,
    GameTable,
    DropArea
  }
})
export default class App extends Vue {
  private readonly key = "App";
  private roomInitialized: boolean = false;
  private progressMessage: string = "";
  private isMounted: boolean = false;

  private isModal: boolean = false;

  private otherTextViewInfo: OtherTextViewInfo | null = null;
  private throwParabola: boolean = false;
  private cardView: boolean = false;
  private cardDeckId: string = "";

  private cutInList = GameObjectManager.instance.cutInList;
  private isDropPiece: boolean = false;
  private isDropping: boolean = false;
  private progressAll: number = 0;
  private progressCurrent: number = 0;

  private static get elm(): HTMLElement {
    return document.getElementById("app") as HTMLElement;
  }

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
    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: {
        type: "view-progress",
        value: {
          message: LanguageManager.instance.getText(
            "message.setting-up-quoridorn"
          ),
          all: 0,
          current: 0
        }
      }
    });
    performance.mark("app-init-start");
    await SocketFacade.instance.init();
    const bcdiceServer = SocketFacade.instance.connectInfo.bcdiceServer;
    await BcdiceManager.instance.init(bcdiceServer);
    YoutubeManager.init();
    performance.mark("app-init-end");
    performance.measure("app-init-time", "app-init-start", "app-init-end");
    const durationMs = performance.getEntriesByName("app-init-time")[0]
      .duration;
    const durationS = Math.round(durationMs / 100) / 10;
    console.log(`アプリのセットアップにかかった時間：${durationS}秒`);

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
    SocketFacade.instance.socketOn<{ all: number; current: number }>(
      "notify-progress",
      async (err, { all, current }) => {
        const flag: boolean = all > 0 && all !== current;
        const message = flag
          ? LanguageManager.instance.getText("message.processing")
          : "";
        await TaskManager.instance.ignition<ModeInfo, never>({
          type: "mode-change",
          owner: "Quoridorn",
          value: {
            type: "view-progress",
            value: {
              message,
              all,
              current
            }
          }
        });
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
              ownerType: null,
              owner: null,
              order: index,
              exclusionOwner: null,
              lastExclusionOwner: null,
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
      console.warn(`${err}. url:${url}`);
      return;
    }

    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: {
        type: "view-progress",
        value: { message: "", all: 0, current: 0 }
      }
    });

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

  @VueEvent
  private async dropFile(event: DragEvent) {
    // コマをドロップインしている場合
    if (this.isDropPiece) {
      await TaskManager.instance.ignition<DropPieceInfo, never>({
        type: "drop-piece",
        owner: "Quoridorn",
        value: {
          type: event.dataTransfer!.getData("dropType"),
          dropWindow: event.dataTransfer!.getData("dropWindow"),
          offsetX: convertNumberZero(event.dataTransfer!.getData("offsetX")),
          offsetY: convertNumberZero(event.dataTransfer!.getData("offsetY")),
          pageX: event.pageX,
          pageY: event.pageY
        }
      });
      return;
    }

    // ファイルをドロップインしている場合
    const resultList = await getDropFileList(event.dataTransfer!);

    await TaskManager.instance.ignition<WindowOpenInfo<MediaUploadInfo>, never>(
      {
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "media-upload-window",
          args: { resultList }
        }
      }
    );

    this.isDropping = false;
  }

  @VueEvent
  private onDragEnter() {
    if (this.isDropPiece) return;
    this.isDropping = true;
  }

  @VueEvent
  private onDragLeave(event: DragEvent) {
    if (this.isDropPiece) return;
    const p = createPoint(event.pageX, event.pageY);
    const s = createSize(window.innerWidth, window.innerHeight);

    // 画面外に出た時に座標が (0, 0) になるが、ここはあえて幻想の厳密さで書こうと思う。
    if (p.x <= 0 || s.width < p.x || p.y <= 0 || s.height < p.y) {
      this.isDropping = false;
    }
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
      .filter(
        c =>
          c.data!.isStandBy &&
          !BgmManager.instance.standByWindowList.some(s => s.targetId === c.id)
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
      console.log("GLOBAL enter");
      await TaskManager.instance.ignition<never, never>({
        type: "global-enter",
        owner: "Quoridorn",
        value: null
      });
      return;
    }

    if (event.key === "Shift" && event.ctrlKey) {
      // TODO ブーケトス機能
      await TaskManager.instance.ignition<ModeInfo, never>({
        type: "mode-change",
        owner: "Quoridorn",
        value: {
          type: "throw-parabola",
          value: (this.throwParabola ? "off" : "on") as "on" | "off"
        }
      });
      return;
    }
    // console.log(event.key);
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
    console.log("socket-connect-finished");
    task.resolve();
  }

  @TaskProcessor("other-text-view-finished")
  private async otherTextView(
    task: Task<OtherTextViewInfo, never>
  ): Promise<TaskResult<never> | void> {
    this.otherTextViewInfo = task.value;
    task.resolve();
  }

  @VueEvent
  private otherTextHide() {
    this.otherTextViewInfo = null;
  }

  public static async openSimpleWindow(type: string) {
    await TaskManager.instance.ignition<WindowOpenInfo<void>, null>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type
      }
    });
  }

  @TaskProcessor("room-initialize-finished")
  private async roomInitializeFinished(
    task: Task<void, never>
  ): Promise<TaskResult<never> | void> {
    // 部屋に接続できた
    this.roomInitialized = true;
    await App.openSimpleWindow("chat-window");
    await App.openSimpleWindow("initiative-window");

    task.resolve();
  }

  @TaskProcessor("mode-change-finished")
  private async modeChangeFinished(
    task: Task<ModeInfo, never>
  ): Promise<TaskResult<never> | void> {
    const taskValue = task.value!;
    if (taskValue.type === "modal") {
      const value: string = taskValue.value;
      this.isModal = value === "on";
      task.resolve();
    }
    if (taskValue.type === "throw-parabola") {
      const value: string = taskValue.value;
      this.throwParabola = value === "on";
      task.resolve();
    }
    if (taskValue.type === "view-card-deck") {
      const flag: string = taskValue.value.flag;
      const cardDeckId: string = taskValue.value.cardDeckId;
      this.cardView = flag === "on";
      this.cardDeckId = cardDeckId;
      task.resolve();
    }
    if (taskValue.type === "drop-piece") {
      const value: string = taskValue.value;
      this.isDropPiece = value === "on";
      task.resolve();
    }
    if (taskValue.type === "special-drag") {
      const value: string = taskValue.value;
      this.isDropPiece = value === "on";
      task.resolve();
    }
    if (taskValue.type === "view-progress") {
      const all: number = taskValue.value.all;
      const current: number = taskValue.value.current;
      this.progressAll = all;
      this.progressCurrent = current;
      this.progressMessage = taskValue.value.message;
      if (all) console.log(`PROGRESS: (${current} / ${all})`);
      task.resolve();
    }
  }

  @TaskProcessor("socket-connect-error-finished")
  private async socketConnectErrorFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    console.warn("socket-connect-error-finished");
    task.resolve();
  }

  @TaskProcessor("socket-reconnecting-finished")
  private async socketReconnectingFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    console.warn("socket-reconnecting-finished");
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

input {
  margin: 0;
  padding: 0;
  box-sizing: border-box;

  &:disabled,
  &:read-only {
    cursor: not-allowed !important;
  }
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
  background-size: cover;
  background-position: center;
  position: fixed;
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

#drop-area {
  z-index: 100;
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

#other-text-frame {
  z-index: 6;
}

#throw-parabola-simulator {
  z-index: 7;
}

#throw-parabola-container {
  z-index: 8;
}

#card-deck-builder {
  z-index: 9;
}

#progress-message-area {
  @include flex-box(column, center, center);
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
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

#progress-bar {
  position: relative;
  height: 2em;
  width: 18em;
  background-color: var(--uni-color-white);
  border: 1px solid gray;
  border-radius: 0.5em;

  &:before {
    content: "";
    width: var(--ratio);
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    border-radius: 0.5em;
    background-color: var(--uni-color-orange);
  }
}
</style>
