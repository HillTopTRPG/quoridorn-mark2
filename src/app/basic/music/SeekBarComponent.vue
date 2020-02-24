<template>
  <label class="seek-bar-area" @contextmenu.prevent ref="elm">
    <input
      class="seek-bar input"
      type="range"
      min="0"
      :max="Math.round(duration * 100) / 100"
      step="0.01"
      v-model="useSeek"
      @input="seekTo($event.target.valueAsNumber, false)"
      @change="seekTo($event.target.valueAsNumber, true)"
      @keydown.enter.stop
      @keyup.enter.stop
      @keydown.229.stop
      @keyup.229.stop
    />
    <span class="seek-text">
      {{ time }}
    </span>
  </label>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import { zeroPadding } from "@/app/core/Utility";
import CssManager from "@/app/core/css/CssManager";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import VueEvent from "@/app/core/decorator/VueEvent";
import { CutInDeclareInfo } from "@/@types/room";

@Component({
  components: { CtrlButton }
})
export default class SeekBarComponent extends Vue {
  @Prop({ type: Object, required: true })
  private bgmInfo!: CutInDeclareInfo;
  @Prop({ type: Number, required: true })
  private duration!: number;
  @Prop({ type: Number, required: true })
  private seek!: number;

  private isSeekInputting: boolean = false;
  private isMounted: boolean = false;
  private isPlay: boolean = false;

  private useSeek: number = 0;

  private get time() {
    const isHour = this.duration >= 3600;

    const getTime = (num: number): string => {
      num = Math.round(num);
      const hour = Math.floor(num / 3600);
      const minute = Math.floor((num % 3600) / 60);
      const second = num % 60;
      let result = `${zeroPadding(minute, 2)}:${zeroPadding(second, 2)}`;
      if (isHour) result = `${hour}:` + result;
      return result;
    };
    return `${getTime(this.seek)}/${getTime(this.duration)}`;
  }

  @LifeCycle
  private mounted() {
    this.elm.style.setProperty(
      "--seek-base-color",
      CssManager.getCss("--uni-color-gray")
    );
    this.elm.style.setProperty(
      "--seek-font-color",
      CssManager.getCss("--uni-color-white")
    );
    this.useSeek = this.seek;
    this.isMounted = true;
  }

  @VueEvent
  private seekTo(seek: number, allowSeekAhead: boolean) {
    this.$emit("seekTo", seek, allowSeekAhead);
    this.changePlay(true);
    this.isSeekInputting = !allowSeekAhead;
  }

  private get elm(): HTMLDivElement {
    return this.$refs.elm as HTMLDivElement;
  }

  @Watch("seek")
  @Watch("duration")
  private onChangeSeekPer() {
    const per = (this.seek * 100) / this.duration;
    this.elm.style.setProperty("--seek-per", `${per}%`);
    setTimeout(() => {
      this.useSeek = this.seek;
    });
    // if (!this.isSeekInputting) this.seek = this.seek;
  }

  @Watch("isMounted")
  @Watch("isPlay")
  private onChangeIsPlay(isPlay: boolean) {
    this.elm.style.setProperty(
      "--seek-color",
      isPlay
        ? CssManager.getCss("--uni-color-blue")
        : CssManager.getCss("--uni-color-orange")
    );
  }

  private changePlay(isPlay = !this.isPlay): void {
    this.isPlay = isPlay;
    this.$emit(isPlay ? "play" : "pause");
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.seek-bar-area {
  position: relative;
  @include flex-box(row, center, flex-end);
  grid-row: 2 / 2;
  grid-column: 1 / 2;
}

.seek-bar {
  background: linear-gradient(
    to right,
    var(--seek-color) 0%,
    var(--seek-color) var(--seek-per),
    var(--seek-base-color) var(--seek-per),
    var(--seek-base-color) 100%
  );
}

input[type="range"] {
  -webkit-appearance: none;
  flex: 1;
  margin: 0;
  position: relative;
  /*background: rgba(0, 0, 0, 0);*/
  box-sizing: border-box;
  outline: 0;
  cursor: pointer;
}

input[type="range"] {
  width: 100%; /* 調整中 */
  height: 100%;
}
input[type="range"]::-webkit-slider-runnable-track {
  background: rgba(0, 0, 0, 0);
  box-sizing: border-box;
}
input[type="range"]::-webkit-slider-thumb {
  position: relative;
  -webkit-appearance: none;
  cursor: pointer;
  box-sizing: border-box;
  font-size: 12px;
  width: 2em;
  height: 2em;
  border: none;
  background-color: var(--uni-color-black);
}
.seek-text {
  position: absolute;
  right: 8px;
  transform-origin: right bottom;
  /*transform: scale(0.7);*/
  color: var(--seek-font-color);
  pointer-events: none;
  /*align-self: flex-end;*/
}
</style>
