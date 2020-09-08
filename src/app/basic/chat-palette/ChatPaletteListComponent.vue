<template>
  <div class="palette-container">
    <div
      class="palette-line"
      :class="{ odd: !(idx % 2), even: idx % 2 }"
      v-for="(line, idx) in paletteList"
      :key="idx"
      @click="$emit('selectLine', line)"
      @dblclick="$emit('sendLine')"
    >
      {{ line }}
    </div>
    <div
      class="palette-line-margin"
      :class="{
        odd: !(paletteList.length % 2),
        even: paletteList.length % 2
      }"
    ></div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";

@Component
export default class ChatPaletteListComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private paletteText!: string;

  private paletteList: string[] = [];

  @Watch("paletteText", { immediate: true })
  private onChangePaletteTest() {
    this.createPaletteList();
  }

  private createPaletteList() {
    if (!this.paletteText.trim().length) {
      this.paletteList = [];
      return;
    }
    this.paletteList = this.paletteText.split("\n");
    // .map(s => s.replace(/&lt;[bB][rR] *\/?&gt;/g, "<br />"));
    // console.log(JSON.stringify(this.paletteList, null, "  "));
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.palette-container {
  @include inline-flex-box(column, stretch, flex-start);
  overflow-y: scroll;
  flex: 1;
}

.palette-line {
  @include inline-flex-box(row, flex-start, center);
  min-height: 2em;
  word-wrap: break-word;
  white-space: pre-wrap;
  flex-shrink: 0;

  &.even {
    background-color: white;
  }
  &.odd {
    background-color: rgb(247, 247, 247);
  }
  &:hover {
    background-color: lightblue;
  }
}

.palette-line-margin {
  min-height: 2em;
  flex: 1;

  &.even {
    background-size: calc(var(--table-row-height) * 2)
      calc(var(--table-row-height) * 2);
    background-image: linear-gradient(0deg, rgb(247, 247, 247) 50%, white 51%);
  }
  &.odd {
    background-size: calc(var(--table-row-height) * 2)
      calc(var(--table-row-height) * 2);
    background-image: linear-gradient(0deg, white 50%, rgb(247, 247, 247) 51%);
  }
}
</style>
