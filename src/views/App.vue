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
    <div id="back-scene" @contextmenu.prevent></div>

    <!-- 最も手前でドロップを受ける領域 (z-index: 100) -->
    <drop-area @drop.prevent.stop="dropFile" :isDropping="isDropping" />

    <template v-if="roomInitialized">
      <!-- プレイマット (z-index: 1) -->
      <game-table ref="gameTable" />
      <!-- メニュー (z-index: 5) -->
      <Menu />
      <!-- 右ペイン (z-index: 2) -->
      <!-- 著しいレイアウト崩れが発生する環境があるようなので、一旦OFF
      <right-pane />
      -->
      <!-- 右クリックメニュー (z-index: 7) -->
      <Context />
      <!-- マップ描画コントロール (z-index: 3) -->
      <map-draw-controller v-if="screenMode === 'draw-map'" />
    </template>
    <!-- 共有メモエリア (z-index: 3) -->
    <public-memo-area :offset-x="screenMode === 'draw-map' ? '20em' : '0em'" />
    <!-- 小画面エリア (z-index: 4) -->
    <window-area />
    <!-- その他欄 (z-index: 8) -->
    <other-text-frame
      :windowKey="key"
      :otherTextViewInfo="otherTextViewInfo"
      @hide="otherTextHide"
      v-if="otherTextViewInfo"
    />
    <!-- 放物線シミュレータ (z-index: 9) -->
    <throw-parabola-simulator v-if="throwParabola" />
    <!-- 放物線シミュレータ (z-index: 10) -->
    <throw-parabola-container />
    <!-- カードデッキビルダー (z-index: 11) -->
    <card-deck-builder v-if="cardView" :cardDeckKey="cardDeckKey" />
    <!-- お部屋作成中 (z-index: 12) -->
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
import { Task, TaskResult } from "task";
import { ModeInfo, ScreenModeType } from "mode";
import { disableBodyScroll } from "body-scroll-lock";
import { CounterRemoconModifyType, CutInStore } from "@/@types/store-data";
import {
  createPoint,
  createSize,
  getEventPoint
} from "@/app/core/utility/CoordinateUtility";
import {
  GetRoomListResponse,
  LoginWindowInput,
  RoomViewResponse,
  SendDataRequest,
  ServerTestResult
} from "@/@types/socket";
import {
  BgmPlayInfo,
  ChatInputtingInfo,
  DropPieceInfo,
  TabMoveInfo,
  ThrowParabolaInfo,
  UpdateResourceInfo
} from "task-info";
import { getDropFileList } from "@/app/core/utility/DropFileUtility";
import { MediaUploadInfo, PlayBgmInfo } from "@/@types/room";
import {
  convertNumberNull,
  convertNumberZero
} from "@/app/core/utility/PrimaryDataUtility";
import { WindowOpenInfo } from "@/@types/window";
import PublicMemoArea from "@/app/basic/public-memo/PublicMemoArea.vue";
import { findByKey, findRequireByKey } from "@/app/core/utility/Utility";
import { importInjection } from "@/app/core/utility/ImportUtility";
import {
  OtherTextViewInfo,
  Point,
  Size,
  WindowSettings
} from "@/@types/store-data-optional";
import { sendSystemChatLog } from "@/app/core/utility/ChatUtility";
import MapDrawController from "@/app/basic/map/MapDrawController.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import GameTable from "@/app/basic/map/GameTable.vue";
import ThrowParabolaContainer from "@/app/core/throwParabola/ThrowParabolaContainer.vue";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import ThrowParabolaSimulator from "@/app/core/throwParabola/ThrowParabolaSimulator.vue";
import RightPane from "@/app/core/pane/RightPane.vue";
import WindowManager from "@/app/core/window/WindowManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import WindowArea from "@/app/core/window/WindowArea.vue";
import YoutubeManager from "@/app/basic/cut-in/bgm/YoutubeManager";
import OtherTextFrame from "@/app/basic/other-text/OtherTextFrame.vue";
import TaskManager from "@/app/core/task/TaskManager";
import DropArea from "@/app/basic/media/DropArea.vue";
import CssManager from "@/app/core/css/CssManager";
import GameObjectManager from "@/app/basic/GameObjectManager";
import EventProcessor from "@/app/core/event/EventProcessor";
import BcdiceManager from "@/app/core/api/bcdice/BcdiceManager";
import Menu from "@/app/basic/menu/Menu.vue";
import CardDeckBuilder from "@/app/basic/card/builder/CardDeckBuilder.vue";
import BgmManager from "@/app/basic/cut-in/bgm/BgmManager";
import Context from "@/app/core/context/Context.vue";

@Component({
  components: {
    MapDrawController,
    PublicMemoArea,
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
  private cardDeckKey: string = "";

  private cutInList = GameObjectManager.instance.cutInList;
  private isDropPiece: boolean = false;
  private isDropping: boolean = false;
  private screenMode: ScreenModeType = "normal";
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
          message: this.$t("message.setting-up-quoridorn")!.toString(),
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
          const cutInKey = info.key;
          const cutIn = findRequireByKey(this.cutInList, cutInKey);
          if (cutIn.data!.isUseBgm) {
            await BgmManager.instance.callBgm({
              targetKey: info.key,
              data: null
            });
          }
          if (cutIn.data!.isUseImage) {
            await TaskManager.instance.ignition<
              WindowOpenInfo<PlayBgmInfo>,
              never
            >({
              type: "window-open",
              owner: "Quoridorn",
              value: {
                type: "image-view-window",
                args: {
                  targetKey: cutInKey,
                  data: null
                }
              }
            });
          }
        } else if (dataType === "chat-inputting") {
          await TaskManager.instance.ignition<ChatInputtingInfo, never>({
            type: "chat-inputting-notify",
            owner: "Quoridorn",
            value: data.data as ChatInputtingInfo
          });
        }
      }
    );
    SocketFacade.instance.socketOn<{ all: number; current: number }>(
      "notify-progress",
      async (err, { all, current }) => {
        const flag: boolean = all > 0 && all !== current;
        const message = flag ? this.$t("message.processing")!.toString() : "";
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
        if (err) {
          console.error(err);
          return;
        }
        changeList.forEach(change => {
          if (change.changeType === "removed") {
            const index = serverInfo.roomList!.findIndex(
              info => info.id === change.id
            );
            serverInfo.roomList!.splice(index, 1, {
              id: "",
              collection: "room-volatile",
              key: "",
              order: index,
              ownerType: null,
              owner: null,
              exclusionOwner: null,
              lastExclusionOwner: null,
              permission: null,
              status: null,
              createTime: new Date(),
              updateTime: null,
              refList: []
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
    // TODO idを独自化
    await importInjection(resultList);

    if (resultList.length) {
      await TaskManager.instance.ignition<
        WindowOpenInfo<MediaUploadInfo>,
        never
      >({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "media-upload-window",
          args: { resultList }
        }
      });
    }

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
    const openWindowFunc = async (c: StoreData<CutInStore>): Promise<void> => {
      const targetKey = c.key;
      const windowKeyList: (string | null)[] = [];
      BgmManager.instance.standByWindowList.push({
        targetKey,
        windowKeyList
      });
      for (let i = 0; i < 3; i++) {
        windowKeyList.push(null);
        await BgmManager.openStandByWindow(targetKey);
      }
    };

    await this.cutInList
      .filter(
        c =>
          c.data!.isStandBy &&
          !BgmManager.instance.standByWindowList.some(
            s => s.targetKey === c.key
          )
      )
      .map((c: StoreData<CutInStore>) => () => openWindowFunc(c))
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

    // if (event.key === "Shift" && event.ctrlKey) {
    //   // TODO ブーケトス機能
    //   await TaskManager.instance.ignition<ModeInfo, never>({
    //     type: "mode-change",
    //     owner: "Quoridorn",
    //     value: {
    //       type: "throw-parabola",
    //       value: (this.throwParabola ? "off" : "on") as "on" | "off"
    //     }
    //   });
    //   return;
    // }
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
  private taskTimeoutId: number | null = null;
  private waitTimeoutId: number | null = null;
  @EventProcessor("touchmove")
  @EventProcessor("mousemove")
  private async mouseTouchMove(event: MouseEvent | TouchEvent): Promise<void> {
    const point = getEventPoint(event);
    if (point.x === this.mouse.x && point.y === this.mouse.y) return;

    const time = 60;
    const func = () => {
      TaskManager.instance.ignition<Point, never>({
        type: "mouse-moving",
        owner: "Quoridorn",
        value: point
      });
      this.waitTimeoutId = window.setTimeout(() => {
        this.waitTimeoutId = null;
      }, time);
      this.taskTimeoutId = null;
    };
    if (this.waitTimeoutId !== null) {
      if (this.taskTimeoutId !== null) {
        window.clearTimeout(this.taskTimeoutId);
      }
      this.taskTimeoutId = window.setTimeout(() => {
        if (this.waitTimeoutId === null) {
          func();
        }
      }, time);
      return;
    }
    if (this.taskTimeoutId !== null) {
      window.clearTimeout(this.taskTimeoutId);
    }
    func();
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

  public static async openSimpleWindow(type: string): Promise<boolean> {
    const result = await TaskManager.instance.ignition<
      WindowOpenInfo<void>,
      boolean
    >({
      type: "window-open",
      owner: "Quoridorn",
      value: { type }
    });
    return result ? result[0] : false;
  }

  @TaskProcessor("room-initialize-finished")
  private async roomInitializeFinished(
    task: Task<void, never>
  ): Promise<TaskResult<never> | void> {
    // 部屋に接続できた
    this.roomInitialized = true;

    const windowSettings =
      GameObjectManager.instance.roomData.settings.windowSettings;

    const openWindowFunc = async (windowType: keyof WindowSettings) => {
      if (
        windowSettings[windowType] === "init-view" ||
        windowSettings[windowType] === "always-open"
      ) {
        await App.openSimpleWindow(`${windowType}-window`);
      }
    };
    await openWindowFunc("chat");
    await openWindowFunc("initiative");
    await openWindowFunc("chat-palette");
    await openWindowFunc("counter-remocon");
    if (
      GameObjectManager.instance.keepBcdiceDiceRollResultList.some(
        kbdrr =>
          kbdrr.data!.type === "secret-dice-roll" &&
          kbdrr.owner === SocketFacade.instance.userKey
      )
    ) {
      await App.openSimpleWindow("secret-dice-roll-window");
    }

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
      const cardDeckKey: string = taskValue.value.cardDeckKey;
      this.cardView = flag === "on";
      this.cardDeckKey = cardDeckKey;
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
    if (taskValue.type === "screen-mode") {
      this.screenMode = taskValue.value;
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

  @TaskProcessor("counter-remocon-execute-finished")
  private async counterRemoconExecuteFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    const cc = SocketFacade.instance.resourceCC();
    const resourceMaster = findRequireByKey(
      GameObjectManager.instance.resourceMasterList,
      task.value.resourceMasterKey
    );
    const targetKey = task.value.targetKey;
    const targetType = task.value.targetType;
    let orgValue = task.value.value as string;
    let value = task.value.value as string;

    const resource = GameObjectManager.instance.resourceList.find(
      r =>
        r.ownerType === targetType &&
        r.owner === targetKey &&
        r.data!.resourceMasterKey === resourceMaster.key
    )!;

    const before = resource.data!.value;
    if (task.value.modifyType === "substitute") {
      if (resourceMaster.data!.type === "number") {
        if (resourceMaster.data!.min! > convertNumberZero(value))
          value = resourceMaster.data!.min!.toString();
        if (resourceMaster.data!.max! < convertNumberZero(value))
          value = resourceMaster.data!.max!.toString();
      }
      resource.data!.value = value;
    } else {
      let valueNum = convertNumberZero(value);
      let afterValue = convertNumberZero(resource.data!.value) + valueNum;
      const minDiff = resourceMaster.data!.min! - afterValue;
      const maxDiff = afterValue - resourceMaster.data!.max!;
      if (minDiff > 0) {
        afterValue += minDiff;
        valueNum += minDiff;
      }
      if (maxDiff > 0) {
        afterValue -= maxDiff;
        valueNum -= maxDiff;
      }
      resource.data!.value = afterValue.toString();
      value = valueNum.toString();
    }
    await cc.updatePackage([
      {
        key: resource.key,
        data: resource.data!
      }
    ]);

    const target = findRequireByKey(
      GameObjectManager.instance.getList(targetType)!,
      targetKey
    );
    const message = App.createCounterRemoconMessage(
      task.value.messageFormat,
      (target.data! as any).name,
      resourceMaster.data!.name,
      task.value.modifyType,
      value,
      before,
      orgValue
    );
    await sendSystemChatLog(message, GameObjectManager.instance.mySelfActorKey);
  }

  public static createCounterRemoconMessage(
    format: string,
    who: string,
    what: string,
    type: CounterRemoconModifyType,
    value: string,
    before: string,
    orgValue: string = value
  ) {
    format = format.replace("{0}", who);
    format = format.replace("{1}", what);
    let prefix = type === "substitute" ? "=" : "";
    if (type !== "substitute" && convertNumberZero(value) > 0) prefix = "+";
    format = format.replace("{2}", `${prefix}${orgValue}`);
    let after =
      type === "substitute"
        ? value
        : convertNumberZero(before) + convertNumberZero(value);
    format = format.replace("{3}", `${before} -> ${after}`);
    return format;
  }

  @TaskProcessor("resource-update-finished")
  private async resourceUpdateFinished(
    task: Task<UpdateResourceInfo, never>
  ): Promise<TaskResult<never> | void> {
    const resourceMasterKey = task.value!.resourceMasterKey;
    const ownerType = task.value!.ownerType;
    const ownerKey = task.value!.ownerKey;
    const operationType = task.value!.operationType;
    const value = task.value!.value;

    const resourceCC = SocketFacade.instance.resourceCC();
    const resourceList = GameObjectManager.instance.resourceList;
    const resourceMasterList = GameObjectManager.instance.resourceMasterList;
    const resource = resourceList.find(
      r =>
        r.ownerType === ownerType &&
        r.owner === ownerKey &&
        r.data!.resourceMasterKey === resourceMasterKey
    );
    if (!resource) return;
    const resourceValue = resource.data!.value;
    if (operationType === "set") {
      resource.data!.value = value;
    } else if (operationType === "add") {
      const resourceMaster = findByKey(resourceMasterList, resourceMasterKey);
      if (!resourceMaster) return;
      if (resourceMaster.data!.type !== "number") return;
      const resourceNumValue = convertNumberNull(resourceValue);
      const addValue = convertNumberNull(value);
      if (resourceNumValue === null || addValue === null) return;
      resource.data!.value = (resourceNumValue + addValue).toString();
    }
    await resourceCC.updatePackage([
      { key: resource.key, data: resource.data! }
    ]);
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

#map-draw-controller {
  z-index: 3;
  width: 20em;
}

#context {
  z-index: 7;
}

#public-memo-area {
  z-index: 3;
  display: contents;
}

#window-area {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 4;
}

#other-text-frame {
  z-index: 8;
}

#throw-parabola-simulator {
  z-index: 9;
}

#throw-parabola-container {
  z-index: 10;
}

#card-deck-builder {
  z-index: 11;
}

#progress-message-area {
  @include flex-box(column, center, center);
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 12;

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
