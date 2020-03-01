<template>
  <div class="root" ref="component">
    <label class="front">
      <input
        type="text"
        class="input text-input"
        :class="{ pending: isPending || isSelectMode }"
        v-model="inputText"
        @input.prevent="onTextInput($event.target.value)"
        @keydown.up.self.prevent="onKeyDown(-1)"
        @keydown.down.self.prevent="onKeyDown(1)"
        @keydown.esc="onEscInput"
        @keydown.229.stop
        @keyup.229.stop
        ref="input"
      />
      <span
        class="select-button"
        @click="openSelection()"
        v-if="!isSelectMode"
      ></span>
    </label>
    <div class="item-container" v-if="isSelectMode">
      <div
        class="dice-bot-item"
        v-for="(info, index) in filteredSystemList"
        :key="index"
        @click="selectItem(info)"
        @focus="onFocus(info)"
        @keydown.up.self.prevent="onKeyDown(-1)"
        @keydown.down.self.prevent="onKeyDown(1)"
        @keydown.enter.self="onEnter"
        @keydown.esc.stop="onEsc()"
        tabindex="0"
        ref="items"
      >
        {{ info.name }}（{{ info.system }}）
      </div>
    </div>
    <!-- 幅をとるために設置 -->
    <ctrl-select
      :title="helpMessage"
      :value="JSON.stringify(localValue)"
      @input="val => (localValue = JSON.parse(val))"
      :optionInfoList="
        systemList.map(systemObj => ({
          key: systemObj.system,
          value: JSON.stringify(systemObj),
          text: systemObj.name,
          disabled: false
        }))
      "
      :test="test"
      :maxWidth="19"
      :disabled="true"
      class="base"
    />
    <span
      class="icon-sphere"
      @mouseenter="$emit('onMouseEnterUrl', true)"
      @mouseleave="$emit('onMouseEnterUrl', false)"
      @click="onClickUrlSetting()"
    ></span>
  </div>
</template>

<script lang="ts">
import { Prop, Watch } from "vue-property-decorator";
import CtrlSelect from "@/app/core/component/CtrlSelect.vue";
import BCDiceFacade from "@/app/core/api/bcdice/BCDiceFacade";
import { BcdiceSystemInfo, DiceSystem } from "@/@types/bcdice";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import LanguageManager from "@/LanguageManager";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Component, Mixins } from "vue-mixin-decorator";
import BaseInput from "@/app/core/component/BaseInput.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { Point, Rectangle, Size } from "address";
import { createPoint, createRectangle } from "@/app/core/Coordinate";
import { WindowInfo, WindowMoveInfo, WindowOpenInfo } from "@/@types/window";
import DiceBotSelect from "@/app/basic/common/components/select/DiceBotSelect.vue";
import { getCssPxNum } from "@/app/core/Css";
import TaskManager from "@/app/core/task/TaskManager";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { clone } from "@/app/core/Utility";

type FilterInfo = {
  list: DiceSystem[];
  isSystemEquals: boolean;
  isNameEquals: boolean;
};

@Component({ components: { DiceBotSelect, BaseInput, CtrlSelect } })
export default class DiceBotInput2 extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: Object, required: true })
  private windowInfo!: WindowInfo<any>;

  @Prop({ type: Object, required: true })
  private value!: DiceSystem;

  @Prop({ type: String, required: true })
  private url!: string;

  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

  @Prop({ type: Boolean, default: false })
  private isPending!: boolean;

  @Prop({ type: Boolean, default: false })
  private test!: boolean;

  private selectionPoint: Point = createPoint(0, 0);
  private volatileItem: DiceSystem | null = null;

  private isSelectMode: boolean = false;
  private isMounted: boolean = false;
  private localUrl: string = "";

  public get localValue(): DiceSystem {
    return this.value;
  }

  public set localValue(value: DiceSystem) {
    this.input(value);
    for (let i: number = 0; i < this.filteredSystemList.length; i++) {
      const info = this.filteredSystemList[i];
      if (info.system === value.system) {
        this.setInputValue(info.name);
        this.onTextInput(info.name);
        this.isSelectMode = false;
        break;
      }
    }
  }

  @Watch("url", { immediate: true })
  private onChangeUrl(value: string) {
    this.localUrl = value;
  }

  @Watch("localUrl")
  private onChangeLocalUrl(value: string) {
    this.$emit("update:url", value);
  }

  @VueEvent
  private openSelection() {
    this.isSelectMode = true;
    setTimeout(() => {
      const index = this.filteredSystemList.findIndex(
        item => item.system === this.localValue.system
      );
      const itemElmList: HTMLElement[] = this.$refs.items as HTMLElement[];
      itemElmList[index].focus();
    });
  }

  input(system: DiceSystem) {
    this.$emit("input", system);
  }

  private systemList: DiceSystem[] = [];
  private noTarget: string = LanguageManager.instance.getText(
    "label.no-target"
  );
  private inputText: string = "";

  @LifeCycle
  private mounted() {
    this.isMounted = true;
    if (BCDiceFacade.instance.isReady()) {
      BCDiceFacade.instance.diceSystemList.forEach(info => {
        info = clone(info)!;
        if (info.system === "DiceBot") info.name = this.noTarget;
        this.systemList.push(info);
        if (info.system === this.localValue.system) {
          this.inputText = info.name;
        }
      });
    }
    const rect = DiceBotInput2.getRect(this.inputElm);
    this.selectionPoint = createPoint(rect.x, rect.y + rect.height);
  }

  private get elm(): HTMLElement {
    return this.$refs.component as HTMLElement;
  }

  private getComponentSize(): Size {
    const b = this.elm.getBoundingClientRect();
    return {
      width: b.width,
      height: b.height
    };
  }

  @LifeCycle
  private updated() {
    this.updateLocation();
  }

  private updateLocation() {
    const inputElmRect = DiceBotInput2.getRect(this.inputElm);
    const windowRect = DiceBotInput2.getRect(
      document.getElementById(this.windowInfo.key)
    );
    const sceneHeight = window.innerHeight;
    const menuHeight = getCssPxNum("--menu-bar-height");
    const itemHeight = getCssPxNum("--select-item-height", this.elm);
    const inputBottom =
      sceneHeight - menuHeight - inputElmRect.y - inputElmRect.height;
    const contentsHeight =
      Math.min(this.filteredSystemList.length, 10) * itemHeight;
    const y =
      inputBottom >= contentsHeight
        ? inputElmRect.y + inputElmRect.height - 2
        : inputElmRect.y - contentsHeight + 1;

    this.selectionPoint = createPoint(
      inputElmRect.x - windowRect.x,
      y - windowRect.y
    );

    this.elm.style.setProperty("--point-x", `${this.selectionPoint.x}px`);
    this.elm.style.setProperty("--point-y", `${this.selectionPoint.y}px`);
    this.elm.style.setProperty("--rect-height", `${contentsHeight}px`);
    this.elm.style.setProperty(
      "--item-width",
      `${this.getComponentSize().width}px`
    );
  }

  @TaskProcessor("window-move-end-finished")
  private async windowMoveEndFinished(
    task: Task<WindowMoveInfo, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value!.windowKey !== this.windowInfo.key) return;
    if (!this.isMounted) return;
    this.updateLocation();
  }

  @TaskProcessor("window-font-size-finished")
  private async windowFontSizeFinished(
    task: Task<{ key: string; size: number }, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value!.key !== this.windowInfo.key) return;
    if (!this.isMounted) return;
    this.elm.style.setProperty("--font-size", `${task.value!.size}px`);
  }

  private get inputElm(): any {
    return this.$refs.input;
  }

  private static getRect(elm: any): Rectangle {
    if ("getBoundingClientRect" in elm) {
      const b: any = elm.getBoundingClientRect();
      return createRectangle(b.x, b.y, b.width, b.height);
    }
    return createRectangle(0, 0, 0, 0);
  }

  private setInputValue(text: string) {
    this.inputText = text;
    this.inputElm.focus();
  }

  @Watch("localValue", { immediate: true })
  private async onChangeCurrentSystem() {
    if (this.localValue.name === "DiceBot") {
      this.localValue.name = this.noTarget;
    }
    const system = this.localValue.system;
    if (system === "DiceBot") {
      this.helpMessage =
        this.baseHelpMessage +
        `==【ダイスボット(指定なし)専用】====================\n` +
        "ゲーム固有の判定がある場合はこの場所に記載されます。";
      return;
    }
    if (!system) return;

    try {
      const info: BcdiceSystemInfo = await BCDiceFacade.getBcdiceSystemInfo(
        SocketFacade.instance.connectInfo.bcdiceServer,
        system
      );
      this.helpMessage =
        this.baseHelpMessage +
        `==【${info.name}専用】====================\n` +
        info.info;
    } catch (err) {
      window.console.error(err);
      this.helpMessage = "ヘルプ文言の取得に失敗しました。";
    }
  }

  @VueEvent
  private onTextInput(text: string) {
    this.inputText = text;
    const filterInfo = this.getFilterInfo(text);
    this.isSelectMode = !filterInfo.isNameEquals;
    this.volatileItem = null;
  }

  @VueEvent
  private onKeyDown(direction: number) {
    if (!this.filteredSystemList.length) return;
    if (!this.isSelectMode) {
      this.openSelection();
      return;
    }
    let index: number = 0;
    if (this.volatileItem) {
      index = this.filteredSystemList.findIndex(
        item => item.system === this.volatileItem!.system
      );
      if (index === -1) index = 0;
      index += direction;
      if (index < 0) index = this.filteredSystemList.length - 1;
      if (index >= this.filteredSystemList.length) index = 0;
    }

    this.volatileItem = this.filteredSystemList[index];

    setTimeout(() => {
      const itemElmList: HTMLElement[] = this.$refs.items as HTMLElement[];
      itemElmList[index].focus();
    });
  }

  @VueEvent
  private onEsc() {
    this.volatileItem = null;
    this.inputText = this.localValue.name;
    this.isSelectMode = false;
    this.inputElm.focus();
  }

  @VueEvent
  private onEscInput(event: KeyboardEvent) {
    if (this.isSelectMode) {
      this.onEsc();
      event.stopPropagation();
    }
  }

  @VueEvent
  private selectItem(system: DiceSystem) {
    this.localValue = system;
    this.volatileItem = null;
  }

  @VueEvent
  private onFocus(system: DiceSystem) {
    this.volatileItem = system;
  }

  @VueEvent
  private onEnter(event: InputEvent) {
    if (this.volatileItem) {
      event.preventDefault();
      this.selectItem(this.volatileItem);
    }
  }

  private getFilterInfo(text: string): FilterInfo {
    let isSystemEquals: boolean = false;
    let isNameEquals: boolean = false;
    text = text.toLowerCase();
    const list = this.systemList.filter(info => {
      const name = info.name;
      const system = info.system.toLowerCase();

      isNameEquals = isNameEquals || name === text;
      isSystemEquals = isSystemEquals || system === text;
      const systemIndex = system.indexOf(text);
      const nameIndex = name.indexOf(text);
      return systemIndex > -1 || nameIndex > -1;
    });
    return {
      isNameEquals,
      isSystemEquals,
      list
    };
  }

  private get filteredSystemList() {
    if (this.inputText === this.noTarget || this.inputText === "DiceBot") {
      return this.systemList;
    }
    const filterInfo = this.getFilterInfo(this.inputText);
    const list = filterInfo.list;
    if (list.length === 0 || filterInfo.isNameEquals) return this.systemList;
    return list;
  }

  public focus() {
    const elm = this.$refs.component as CtrlSelect;
    elm.focus();
  }

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.noTarget = LanguageManager.instance.getText("label.no-target");
    const index = this.systemList.findIndex(s => s.system === "DiceBot");
    this.systemList[index].name = this.noTarget;
    task.resolve();
  }

  @TaskProcessor("bcdice-ready-finished")
  private async bcdiceReadyFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.mounted();
    task.resolve();
  }

  @VueEvent
  private async onClickUrlSetting() {
    this.localUrl = (
      await TaskManager.instance.ignition<WindowOpenInfo<string>, string>({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "bcdice-api-server-setting-window",
          args: this.url
        }
      })
    )[0];
  }

  /*
   * data
   */
  private helpMessage: string = "";

  /** ダイスボットの説明文の定型部分 */
  private baseHelpMessage: string =
    "【ダイスボット】チャットにダイス用の文字を入力するとダイスロールが可能\n" +
    "入力例）2d6+1 攻撃！\n" +
    "上記のようにダイス文字の後ろに空白を入れて発信することも可能\n" +
    "以下、使用例\n" +
    "　3D6+1>=9 ：3d6+1で目標値9以上かの判定\n" +
    "　1D100<=50 ：D100で50%目標の下方ロールの例\n" +
    "　3U6[5] ：3d6のダイス目が5以上の場合に振り足しして合計する(上方無限)\n" +
    "　3B6 ：3d6のダイス目をバラバラのまま出力する（合計しない）\n" +
    "　10B6>=4 ：10d6を振り4以上のダイス目の個数を数える\n" +
    "　(8/2)D(4+6)<=(5*3) ：個数・ダイス・達成値には四則演算も使用可能\n" +
    "　C(10-4*3/2+2) ：C(計算式)で計算だけの実行も可能\n" +
    "　choice[a,b,c] ：列挙した要素から一つを選択表示。ランダム攻撃対象決定などに\n" +
    "　S3d6 ：各コマンドの先頭に「S」を付けると他人から結果が見えないシークレットロール\n" +
    "　3d6/2 ：ダイス出目を割り算（切り捨て）。切り上げは /2U、四捨五入は /2R。\n" +
    "　D66 ：D66ダイス。順序はゲームに依存。D66N：そのまま、D66S：昇順\n";
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";
.root {
  @include inline-flex-box(row, flex-start, center);
  position: relative;
  overflow: visible;

  .base {
    z-index: 1;

    select {
      padding: 0;
    }
  }

  .front {
    display: inline-block;
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    right: calc(2em + 0.5rem);
    z-index: 3;

    .text-input {
      height: 2em;
      width: 100%;
      font-size: inherit;
      box-sizing: border-box;

      &:read-only {
        outline: none;
      }
    }

    .select-button {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 2em;
      border: 1px solid rgb(169, 169, 169);
      border-left-color: rgba(0, 0, 0, 0.2);
      box-sizing: border-box;
      background: linear-gradient(
        to bottom,
        rgb(255, 255, 255) 0%,
        rgb(240, 240, 240) 40%,
        rgb(225, 225, 225) 100%
      );

      /* 三角形 */
      &:before {
        content: "";
        position: absolute;
        top: 50%;
        bottom: 0;
        transform: translateY(-50%) translateX(50%);
        right: 10px;
        width: 0;
        height: 0;
        padding: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 6px solid black;
        pointer-events: none;
        z-index: 2;
      }
    }
  }

  .icon-sphere {
    @include inline-flex-box(row, center, center);
    width: 2em;
    height: 2em;
    border-radius: 50%;
    margin-left: 0.5rem;
    border: 1px dotted gray;
    box-sizing: border-box;
    cursor: pointer;
    background-color: white;

    &:hover {
      background-color: var(--uni-color-light-skyblue);
    }

    &:active {
      background-color: var(--uni-color-skyblue);
    }
  }

  .item-container {
    @include inline-flex-box(column, flex-start, flex-start);
    position: fixed;
    top: var(--point-y);
    left: var(--point-x);
    min-width: var(--item-width);
    height: calc(var(--rect-height) + 2px);
    font-size: var(--font-size);
    z-index: 9999999;
    overflow-y: auto;
    border: 1px solid gray;
    box-sizing: border-box;
  }

  .dice-bot-item {
    @include inline-flex-box(row, flex-start, center);
    width: 100%;
    background-color: white;
    height: var(--select-item-height);
    min-height: var(--select-item-height);
    outline: none;
    cursor: pointer;

    &:hover {
      background-color: var(--uni-color-light-skyblue);
    }

    &:focus {
      background-color: var(--uni-color-skyblue);
    }

    &:not(:first-child) {
      border-top: none;
    }
  }
}
</style>
