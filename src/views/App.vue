<template>
  <div id="app" @wheel.passive="onWheel">
    <game-table ref="gameTable" />
    <div id="wheelMarker" :class="{ hide: !isMapWheeling }"></div>
    <!--
    <img alt="Vue logo" src="../assets/logo.png" />
    -->
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import BaseInput from "@/app/basic/common/components/BaseInput.vue";
import { Action, Getter, Mutation } from "vuex-class";
import { Task } from "@/app/store/EventQueue";
import GameTable from "@/app/basic/map/GameTable.vue";

@Component({
  components: {
    GameTable,
    BaseInput
  }
})
export default class App extends Vue {
  @Action("resistTask") private resistTask: any;
  @Mutation("addTaskListener") private addTaskListener: any;
  @Getter("mapBackgroundColor") private mapBackgroundColor: any;
  @Getter("taskQueue") private taskQueue: any;
  @Getter("isMapWheeling") private isMapWheeling!: boolean;
  @Mutation("setIsWheeling") private setIsWheeling: any;
  @Action("presetImageLoad") private presetImageLoad: any;

  private wheelTimer: number | null = null;

  private async created() {
    window.console.log("created");
    await this.presetImageLoad();
    window.console.log("画像ロード終わり");
  }

  private async mounted() {
    window.console.log("mounted");
    await this.resistTask({
      type: "system-initialize",
      owner: "Quoridorn",
      isPrivate: true,
      isExclusion: false,
      statusList: ["presetLoad", "accessRoom", "finished"]
    });
  }

  /**
   * ホイールイベント
   * @param event
   */
  private async onWheel(this: any, event: any) {
    await this.resistTask({
      type: "action-wheel",
      owner: "Quoridorn",
      isPrivate: true,
      isExclusion: false,
      value: event.wheelDelta,
      statusList: ["finished"]
    });
  }

  @Watch("mapBackgroundColor", { immediate: true })
  private onChangeMapBackgroundColor(mapBackgroundColor: string): void {
    document.body.style.backgroundColor = mapBackgroundColor;
  }

  // private async clickButton1() {
  //   window.console.log("【click button1】");
  //
  //   const result = await this.resistTask({
  //     type: "sample",
  //     owner: "HillTop",
  //     isPrivate: false,
  //     isExclusion: false,
  //     value: "this is test",
  //     statusList: [
  //       "unapproved",
  //       "processing",
  //       "status01",
  //       "status02",
  //       "status03",
  //       "finished"
  //     ]
  //   });
  //   window.console.log("【end of button1】", result);
  // }
  //
  // private clickButton2() {
  //   window.console.log("click button2");
  //   window.console.log(this.taskQueue);
  // }
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
  font-size: 16px;
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
