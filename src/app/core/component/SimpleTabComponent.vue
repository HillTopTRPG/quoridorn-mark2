<template>
  <div class="simple-tab-component">
    <div class="tab-area">
      <div
        class="tab"
        v-for="(tab, index) in tabList"
        :class="{ isActive: tab.text === localValue.text }"
        :key="index"
        @click="localValue = tab"
      >
        {{ tab.text }}
      </div>
    </div>
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-mixin-decorator";
import { Emit, Prop, Vue } from "vue-property-decorator";
import { TabInfo } from "@/@types/window";
import SimpleTableComponent from "@/app/core/component/table/SimpleTableComponent.vue";

@Component({
  components: { SimpleTableComponent }
})
export default class SimpleTabComponent extends Vue {
  @Prop({ type: Array, required: true })
  private tabList!: TabInfo[];
  @Prop({ type: Boolean, required: false, default: false })
  private selectLock!: boolean;
  @Prop({ type: Object, required: false, default: null })
  public value!: TabInfo | null;

  @Emit("input")
  public input(value: TabInfo | null) {}

  private get localValue(): TabInfo | null {
    return this.value;
  }

  private set localValue(value: TabInfo | null) {
    this.input(value);
  }
}
</script>

<style lang="scss">
@import "../../../assets/common";
.simple-tab-component {
  @include flex-box(column, flex-start, flex-start);
}
.tab-area {
  @include flex-box(row, flex-start, center);

  .tab {
    @include flex-box(row, center, center);
    background: linear-gradient(
      to bottom,
      rgba(240, 240, 240, 1),
      rgba(200, 200, 200, 1)
    );
    border: 1px solid gray;
    box-sizing: content-box;
    cursor: pointer;
    border-bottom-width: 0;
    border-radius: 5px 5px 0 0;
    padding: 0 0.5em;
    height: var(--table-row-height);
    min-width: var(--table-row-height);
    font-weight: bold;

    &.isActive {
      background: white;
      border-color: #0092ed;
    }
  }
}
</style>
