<template>
  <div class="chat-option-selector" @contextmenu.prevent>
    <!-- 選択部分 -->
    <ul class="list">
      <!-- タイトル -->
      <li class="title">
        <span v-t="`${bt}${title}`"></span>
        <span>{{ pageMax > 1 ? ` (${page} / ${pageMax})` : "" }}</span>
      </li>

      <li v-if="pageMax > 1 && page === 1" v-t="`${bt}goto-tail`"></li>
      <li v-if="pageMax > 1 && page !== 1" v-t="`${bt}options.goto-last`"></li>

      <li
        v-for="item in pagedList"
        :key="item.value"
        tabindex="-1"
        :class="{ active: item.id === localValue }"
      >
        {{ item.data.name }}
      </li>

      <li v-if="pageMax > 1 && page !== pageMax" v-t="`${bt}goto-next`"></li>
      <li v-if="pageMax > 1 && page === pageMax" v-t="`${bt}goto-head`"></li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { StoreUseData } from "@/@types/store";

@Component
export default class ChatOptionSelector extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private title!: string;

  @Prop({ type: Array, required: true })
  private list!: StoreUseData<any>[];

  @Prop({ type: Number, required: true })
  private max!: number;

  @Prop({ type: String })
  private value!: string;

  public get localValue(): string {
    return this.value;
  }

  public set localValue(value: string) {
    this.input(value);
  }

  private input(value: string) {
    this.$emit("input", value);
  }

  private bt = "chat-window.options.";

  /**
   * 現在のページ番号
   */
  private get page(): number {
    const index = this.list.findIndex(item => item.id === this.localValue);
    return Math.floor(index / this.max) + 1;
  }

  /**
   * ページ数
   */
  private get pageMax(): number {
    return Math.ceil(this.list.length / this.max);
  }

  private get pagedList(): StoreUseData<any>[] {
    const firstIdx = (this.page - 1) * this.max;
    const endIdx = firstIdx + this.max;
    return this.list.slice(firstIdx, endIdx);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.chat-option-selector {
  position: absolute;
  top: 0;
  left: 0;
  transform: translateY(-100%);
  z-index: 10;
  background-color: var(--uni-color-light-green);
  padding: 0.2rem;
  border: 1px solid gray;
}

.list {
  display: block;
  padding: 0;
  margin: 0;
}

.active {
  background-color: var(--uni-color-light-skyblue);
}

li {
  @include flex-box(row, flex-start, center);
  list-style: none;
  height: 2em;
  padding: 0 0.2rem;
  background-color: white;

  &.title {
    font-weight: bold;
    height: auto;
    padding-bottom: 0.2rem;
    background-color: transparent;
  }
}
</style>
