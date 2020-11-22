<template>
  <component
    v-bind:is="useTag"
    v-bind="$attrs"
    v-on="listeners"
    class="line"
    :class="{ 'table-reverse': isTableReverse }"
  >
    <template v-for="(span, index) in spans">
      <span
        :key="index"
        v-if="span.type === '.'"
        v-html="span.value.replace(/\\n/g, '<br />')"
      ></span>
      <i :key="index" v-if="span.type === 'i'">{{ span.value }}</i>
      <b :key="index" v-if="span.type === 'b'">{{ span.value }}</b>
      <b :key="index" v-if="span.type === 'bi'">
        <i>{{ span.value }}</i>
      </b>
      <pre :key="index" class="inline" v-if="span.type === '`'">{{
        span.value
      }}</pre>
      <label :key="index" v-if="span.type === 'check'">
        <input
          type="checkbox"
          class="input"
          :disabled="disabled"
          :checked="span.value"
          @change="onChangeChecked(span.index, $event.target.checked)"
        />
      </label>
      <label :key="index" v-if="span.type === 'select'">
        <select
          @change="onChangeSelect(span.index, $event.target.value)"
          :disabled="disabled"
        >
          <option value="" disabled v-if="span.title">{{ span.title }}</option>
          <option
            v-for="(optionValue, index) in span.list"
            :key="index"
            :value="optionValue"
            :selected="span.value === optionValue"
          >
            {{ optionValue }}
          </option>
        </select>
      </label>
    </template>
  </component>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import VueEvent from "../../core/decorator/VueEvent";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";
import BaseInput from "@/app/core/component/BaseInput.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";

@Component({
  components: { BaseInput }
})
export default class OtherTextSpanComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private tag!: string;

  @Prop({ type: Boolean, required: true })
  private disabled!: boolean;

  @Prop({ type: Array, required: true })
  private spans!: any[];

  private get listeners() {
    return {
      ...this.$listeners
    };
  }

  private isMounted: boolean = false;
  private useTag: string = "";
  private isTableReverse: boolean = false;

  @LifeCycle
  private mounted() {
    this.isMounted = true;
  }

  @Watch("isMounted")
  @Watch("spans", { deep: true })
  private onChangeSpans() {
    if (!this.isMounted) return;
    this.fixBeforeTdConvert();
    this.fixBeforeTableReverse();
  }

  private fixBeforeTdConvert() {
    this.useTag = this.tag;

    if (this.tag !== "td") return;
    if (!this.spans.length) return;

    const value = this.spans[0].value;
    if (!value || typeof value !== "string") return;
    if (value.startsWith("◇")) {
      this.useTag = "th";
      this.spans[0].value = value.substr(1);
    }
  }

  private fixBeforeTableReverse() {
    this.isTableReverse = false;

    if (this.tag !== "th" && this.tag !== "td") return;
    if (!this.spans.length) return;

    const value = this.spans[0].value;
    if (!value || typeof value !== "string") return;
    if (value.startsWith("◆")) {
      this.isTableReverse = true;
      this.spans[0].value = value.substr(1);
    }
  }

  @VueEvent
  private onChangeChecked(index: number, value: boolean) {
    this.$emit("check", index, value);
  }

  @VueEvent
  private onChangeSelect(index: number, value: string) {
    this.$emit("select", index, value);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.line {
  line-height: 1.5em;
  vertical-align: middle;
}
pre {
  &.inline {
    display: inline;
  }
}
label {
  @include inline-flex-box(row, flex-start, center);
}

.table-reverse {
  background-color: black;
  color: white;
}
</style>
