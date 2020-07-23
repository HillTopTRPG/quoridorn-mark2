<template>
  <div
    class="ctrl-select-wrapper"
    :disabled="disabled"
    @contextmenu.prevent
    :class="{ multiple, disabled: disabled || readonly }"
  >
    <select
      class="input"
      :class="{ pending: isPending }"
      v-model="localValue"
      :id="id || undefined"
      ref="component"
      :disabled="disabled || readonly"
      :style="{
        webkitTextFillColor: fontColor,
        mozTextFillColor: fontColor,
        maxWidth: maxWidth ? `${maxWidth}em` : undefined
      }"
      :multiple="multiple"
      @dblclick="onDblClick"
      @mousedown.stop
      @mouseup.stop
      @keydown.enter.stop
      @keyup.enter.stop
      @keydown.229.stop
      @keyup.229.stop
      :tabindex="disabled ? -1 : 0"
    >
      <option
        v-for="optionInfo in optionInfoList"
        :key="optionInfo.key"
        :value="optionInfo.value"
        :disabled="optionInfo.disabled"
      >
        {{ optionInfo.text }}
      </option>
    </select>
    <div class="background-area"></div>
  </div>
</template>

<script lang="ts">
import { Prop, Watch } from "vue-property-decorator";
import { Component } from "vue-mixin-decorator";
import { Rectangle } from "address";
import { createRectangle } from "../utility/CoordinateUtility";
import { HtmlOptionInfo } from "../../../@types/window";
import SelectMixin from "../../basic/common/components/select/base/SelectMixin";
import VueEvent from "../decorator/VueEvent";

@Component
export default class CtrlSelect extends SelectMixin {
  @Prop({ type: Array, required: true })
  private optionInfoList!: HtmlOptionInfo[];

  @Prop({ type: Number, default: 0 })
  private maxWidth!: number;

  private fontColor: string = "";

  public focus(): void {
    const elm: HTMLSelectElement = this.$refs.component as HTMLSelectElement;
    elm.focus();
  }

  public getRect(): Rectangle {
    const elm: HTMLSelectElement = this.$refs.component as HTMLSelectElement;
    const r: any = elm.getBoundingClientRect();
    return createRectangle(r.x, r.y, r.width, r.height);
  }

  @VueEvent
  private onDblClick() {
    if (!this.multiple) return;
    this.localValue = [];
  }

  @Watch("optionInfoList", { immediate: true })
  onChangeOptionInfoList() {
    if (this["test"]) {
      window.console.log(this.optionInfoList);
    }
  }

  @Watch("value", { immediate: true })
  onChangeValue(value: string | string[]) {
    const optionInfo: HtmlOptionInfo = this.optionInfoList.filter(
      optionInfo => {
        if (typeof value === "string") return optionInfo.value === value;
        else return value.findIndex(v => v === optionInfo.value) > -1;
      }
    )[0];
    this.fontColor = optionInfo && optionInfo.disabled ? "#999999" : "#000000";
  }
}
</script>

<style scoped lang="scss">
@import "Ctrl";

.ctrl-select-wrapper {
  position: relative;

  &:not(.multiple) {
    @include ctrl-select();
  }

  &.multiple {
    select {
      display: inline-block;
      font-size: inherit;
      width: 99%;
      height: 100%;
      cursor: pointer;

      &:disabled {
        color: gray;
        -webkit-text-fill-color: gray !important;
        cursor: default;
      }

      option {
        @include flex-box(row, flex-start, center);
        font-size: inherit;
        color: inherit;
        -webkit-text-fill-color: inherit;
        cursor: inherit;
        height: 2em;
      }

      option[disabled="disabled"] {
        display: none;
      }
    }
  }
}
</style>
