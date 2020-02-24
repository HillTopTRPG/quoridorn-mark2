<template>
  <component v-bind:is="tag" v-bind="$attrs" v-on="listeners" class="line">
    <template v-for="(span, idx) in spans">
      <span :key="idx" v-if="span.type === '.'">{{ span.value }}</span>
      <i :key="idx" v-if="span.type === 'i'">{{ span.value }}</i>
      <b :key="idx" v-if="span.type === 'b'">{{ span.value }}</b>
      <b :key="idx" v-if="span.type === 'bi'">
        <i>{{ span.value }}</i>
      </b>
      <pre :key="idx" class="inline" v-if="span.type === '`'">{{
        span.value
      }}</pre>
      <label :key="idx" v-if="span.type === 'check'">
        <input
          type="checkbox"
          class="input"
          :checked="span.value"
          @change="onChangeChecked(span.index, $event.target.checked)"
        />
      </label>
      <label :key="idx" v-if="span.type === 'select'">
        <select @change="onChangeSelect(span.index, $event.target.value)">
          <option value="" disabled v-if="span.title">{{ span.title }}</option>
          <option
            v-for="(optionValue, idx) in span.list"
            :key="idx"
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
import { Component, Prop, Vue } from "vue-property-decorator";
import VueEvent from "../../core/decorator/VueEvent";

@Component({
  components: {}
})
export default class OtherTextSpanComponent extends Vue {
  @Prop({ type: String, required: true })
  private tag!: string;

  @Prop({ type: Array, required: true })
  private spans!: any[];

  private get listeners() {
    return {
      ...this.$listeners
    };
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

<style lang="scss">
@import "../../../assets/common";
.line {
  line-height: 1.5em;
}
pre {
  &.inline {
    display: inline;
  }
}
</style>
