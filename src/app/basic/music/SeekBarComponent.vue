<template>
  <div class="seek-bar-area" @contextmenu.prevent ref="elm">
    <input
      class="seek-bar"
      type="range"
      min="0"
      :max="Math.round(bgmInfo.duration * 100) / 100"
      step="0.01"
      v-model="seek"
      @input="seekTo(false)"
      @change="seekTo(true)"
    />
    <span class="seek-text">
      {{ bgmInfo | time }}
    </span>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import { zeroPadding } from "@/app/core/Utility";
import CssManager from "@/app/core/css/CssManager";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component({
  components: { CtrlButton },
  filters: {
    time: (bgmInfo: BgmInfo) => {
      const isHour = bgmInfo.duration >= 3600;
      const seek = Math.round(bgmInfo.seek);
      const duration = Math.round(bgmInfo.duration);

      const getTime = (num: number): string => {
        const hour = Math.floor(num / 3600);
        const minute = Math.floor((num % 3600) / 60);
        const second = num % 60;
        let result = `${zeroPadding(minute, 2)}:${zeroPadding(second, 2)}`;
        if (isHour) result = `${hour}:` + result;
        return result;
      };
      return `${getTime(seek)}/${getTime(duration)}`;
    }
  }
})
export default class SeekBarComponent extends Vue {
  @Prop({ type: Object, required: true })
  private bgmInfo!: BgmInfo;

  private seek: number = 0;
  private isSeekInputting: boolean = false;
  private isMounted: boolean = false;

  private fadeInTable: number[] = [];
  private fadeOutTable: number[] = [];

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
    this.isMounted = true;
  }

  @VueEvent
  private seekTo(allowSeekAhead: boolean) {
    this.$emit("seekTo", this.seek, allowSeekAhead);
    this.changePlay(true);
    this.isSeekInputting = !allowSeekAhead;
  }

  private get elm(): HTMLDivElement {
    return this.$refs.elm as HTMLDivElement;
  }

  @Watch("bgmInfo.seek")
  @Watch("bgmInfo.duration")
  private onChangeSeekPer() {
    const per = (this.bgmInfo.seek * 100) / this.bgmInfo.duration;
    this.elm.style.setProperty("--seek-per", `${per}%`);
    if (!this.isSeekInputting) this.seek = this.bgmInfo.seek;
  }

  @Watch("isMounted")
  @Watch("bgmInfo.isPlay")
  private onChangeIsPlay(isPlay: boolean) {
    this.elm.style.setProperty(
      "--seek-color",
      isPlay
        ? CssManager.getCss("--uni-color-blue")
        : CssManager.getCss("--uni-color-orange")
    );
  }

  private changePlay(isPlay = !this.bgmInfo.isPlay): void {
    this.bgmInfo.isPlay = isPlay;
    this.$emit(isPlay ? "play" : "pause");
  }

  @Watch("bgmInfo.duration")
  private setDuration(duration: number): void {
    window.console.log("setDuration");
    this.fadeInTable = [];
    for (let i = 0; i <= this.bgmInfo.fadeIn; i++) {
      this.fadeInTable.push(this.bgmStart + i / 10);
    }

    this.fadeOutTable = [];
    for (let i = 0; i <= this.bgmInfo.fadeOut; i++) {
      this.fadeOutTable.push(this.bgmEnd - (this.bgmInfo.fadeOut - i) / 10);
    }
  }

  private get bgmStart(): number {
    let start = 0;
    if (this.bgmInfo.start > 0) {
      start = this.bgmInfo.start;
    } else if (this.bgmInfo.start < 0) {
      start = this.bgmInfo.duration + this.bgmInfo.start;
    }
    if (start > this.bgmInfo.duration) start = this.bgmInfo.duration;
    if (start < 0) start = 0;
    return start;
  }

  private get bgmEnd(): number {
    let end = this.bgmInfo.duration;
    if (this.bgmInfo.end > 0) {
      end = this.bgmInfo.end;
    } else if (this.bgmInfo.end < 0) {
      end = this.bgmInfo.duration + this.bgmInfo.end;
    }
    if (end > this.bgmInfo.duration) end = this.bgmInfo.duration;
    if (end < 0) end = 0;
    return end;
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
.seek-bar-area {
  position: relative;
  @include flex-box(row, center, flex-end);
  width: 100%;
  height: 16px;
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
input[type="range"]::-webkit-slider-thumb {
  position: relative;
  -webkit-appearance: none;
  cursor: pointer;
}
input[type="range"].volume::-webkit-slider-thumb {
  background: black;
  width: 6px;
  height: 20px;
  margin-top: -4px;
  margin-bottom: -4px;
  box-sizing: border-box;
  border: 2px solid black;
}

input[type="range"] {
  height: 16px;
}
input[type="range"]::-webkit-slider-runnable-track {
  background: rgba(0, 0, 0, 0);
  box-sizing: border-box;
}
input[type="range"]::-webkit-slider-thumb {
  box-sizing: border-box;
  width: 16px;
  height: 16px;
  background-color: var(--uni-color-black);
}
.seek-text {
  position: absolute;
  right: 8px;
  transform-origin: right bottom;
  /*transform: scale(0.7);*/
  color: var(--seek-font-color);
  pointer-events: none;
  font-size: 10px;
  /*align-self: flex-end;*/
}
</style>
