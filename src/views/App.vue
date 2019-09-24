<template>
  <div id="app">
    <game-table ref="gameTable" />
    <div id="wheelMarker" :class="{ hide: !isMapWheeling }"></div>
    <window-area />
    <Menu />
    <context />
    <!--
    <img alt="Vue logo" src="../assets/logo.png" />
    -->
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import BaseInput from "@/app/basic/common/components/BaseInput.vue";
import { Action, Getter, Mutation } from "vuex-class";
import GameTable from "@/app/basic/map/GameTable.vue";
import Menu from "@/app/basic/menu/Menu.vue";
import TaskManager from "@/app/core/task/TaskManager";
import Context from "@/app/basic/common/context/Context.vue";
import EventProcessor from "@/app/core/event/EventProcessor";
import { nekostore_test_client } from "@/app/core/nekostore_test";
import { WindowTaskInfo } from "@/@types/window";
import WindowArea from "@/app/basic/common/window/WindowArea.vue";
import WindowManager from "@/app/core/window/WindowManager";
import { Point } from "@/@types/address";

@Component({
  components: {
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

  constructor() {
    super();
    // nekostore_test_client();
  }

  /**
   * ライフサイクル
   */
  public async created() {
    await this.presetImageLoad();
  }

  /**
   * ライフサイクル
   */
  public async mounted() {
    await WindowManager.instance.resistWindowOpenTask("test-window");
    await WindowManager.instance.resistWindowOpenTask("test-window");
  }

  /**
   * ホイールイベント
   * @param event
   */
  @EventProcessor("wheel")
  private async onWheel(event: any) {
    await TaskManager.instance.resistTask({
      type: "action-wheel",
      owner: "Quoridorn",
      isPrivate: true,
      isExclusion: false,
      isIgniteWithParam: false,
      isLastValueCapture: false,
      value: event.wheelDelta > 0,
      statusList: ["finished"]
    });
  }

  /**
   * マウス移動イベント
   * @param event
   */
  @EventProcessor("mousemove")
  private mouseMove(event: any): void {
    App.setMouseLocateOnPage(event.pageX, event.pageY);
  }

  /**
   * タッチ移動イベント
   * @param event
   */
  @EventProcessor("touchmove")
  private touchMove(event: any): void {
    App.setMouseLocateOnPage(
      event.changedTouches[0].pageX,
      event.changedTouches[0].pageY
    );
  }

  private static async setMouseLocateOnPage(
    pageX: number,
    pageY: number
  ): Promise<void> {
    TaskManager.instance.resistTask<Point>({
      type: "mouse-move",
      owner: "Quoridorn",
      isPrivate: true,
      isExclusion: false,
      isIgniteWithParam: true,
      isLastValueCapture: true,
      value: {
        x: pageX,
        y: pageY
      },
      statusList: ["finished"]
    });
  }

  /**
   * マウスボタン離上イベント
   * @param event
   */
  @EventProcessor("mouseup")
  private async mouseUp(event: MouseEvent): Promise<void> {
    if (event.button === 0 || event.button === 2) {
      await TaskManager.instance.resistTask<Point>({
        type: event.button === 0 ? "mouse-left-up" : "mouse-right-up",
        owner: "Quoridorn",
        isPrivate: true,
        isExclusion: false,
        isIgniteWithParam: false,
        isLastValueCapture: true,
        value: {
          x: event.pageX,
          y: event.pageY
        },
        statusList: ["finished"]
      });
    }
  }

  @Watch("mapBackgroundColor", { immediate: true })
  private onChangeMapBackgroundColor(mapBackgroundColor: string): void {
    document.body.style.backgroundColor = mapBackgroundColor;
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
  font-size: 14px;
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
