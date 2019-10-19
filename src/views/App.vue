<template>
  <div id="app">
    <game-table ref="gameTable" />
    <div id="YoutubePlayerContainer">
      <div class="unUse"><div id="YoutubePlayer001"></div></div>
      <div class="unUse"><div id="YoutubePlayer002"></div></div>
      <div class="unUse"><div id="YoutubePlayer003"></div></div>
      <div class="unUse"><div id="YoutubePlayer004"></div></div>
    </div>
    <Menu />
    <right-pane />
    <window-area />
    <context />
    <div id="wheelMarker" :class="{ hide: !isMapWheeling }"></div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import BaseInput from "@/app/core/component/BaseInput.vue";
import { Action, Getter } from "vuex-class";
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
import { CreateRoomInfo, RoomInfoWithPassword } from "@/@types/room";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import LifeCycle from "@/app/core/decorator/LifeCycle";

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
  @Getter("isMapWheeling") private isMapWheeling!: boolean;
  @Action("presetImageLoad") private presetImageLoad: any;

  @LifeCycle
  public async created() {
    await this.presetImageLoad();
  }

  @LifeCycle
  private async beforeMount() {
    CssManager.instance.setGlobalCss();
  }

  @LifeCycle
  private destroyed() {
    SocketFacade.instance.destroy();
  }

  @LifeCycle
  public async mounted() {
    await TaskManager.instance.ignition<WindowOpenInfo<never>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "test-window"
      }
    });
    await TaskManager.instance.ignition<WindowOpenInfo<number>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "sample-window",
        args: 1
      }
    });
    await TaskManager.instance.ignition<WindowOpenInfo<never>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "bgm-setting-window"
      }
    });
    await TaskManager.instance.ignition<WindowOpenInfo<never>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "login-window"
      }
    });
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

  @TaskProcessor("socket-connect-finished")
  private async socketConnectFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    window.console.log("socket-connect-finished");
    task.resolve();
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

  @TaskProcessor("input-create-room-finished")
  private async inputCreateRoomFinished(
    task: Task<CreateRoomInfo, RoomInfoWithPassword>
  ): Promise<TaskResult<RoomInfoWithPassword>[] | void> {
    const arg = { order: task.value!.no };
    try {
      await SocketFacade.instance.socketCommunication("touch-room", arg);
    } catch (err) {
      task.reject(err);
      return;
    }

    try {
      const roomInfoList = await TaskManager.instance.ignition<
        WindowOpenInfo<never>,
        RoomInfoWithPassword
      >({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "create-new-room-window"
        }
      });
      task.resolve(roomInfoList);
    } catch (err) {
      task.reject(err);
      return;
    }
  }
}
</script>

<style lang="scss">
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
</style>
