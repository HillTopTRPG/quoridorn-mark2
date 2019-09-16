<template>
  <label @contextmenu.prevent>
    <span v-if="label && labelSide === 'left'">{{ label }}</span>
    <input
      type="checkbox"
      v-model="value"
      @change.stop="event => onChange(event.target.checked)"
      :style="{ backgroundColor: value ? color : 'white' }"
      :disabled="disabled"
      @keydown.enter.stop
      @keyup.enter.stop
      @keydown.229.stop
      @keyup.229.stop
    />
    <span class="designed"></span>
    <span v-if="label && labelSide !== 'left'">{{ label }}</span>
  </label>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue, Watch } from "vue-property-decorator";
import { Getter } from "vuex-class";

@Component
export default class ColorCheckBox extends Vue {
  @Prop({ type: Boolean, default: false })
  private checked!: boolean;

  @Prop({ type: String, default: "" })
  private label!: string;

  @Prop({ type: String, default: "left" })
  private labelSide!: string;

  @Prop({ type: String, default: "#000000" })
  private color!: string;

  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

  mounted() {
    this.value = this.checked;
  }

  @Emit("change")
  onChange(checked: boolean) {}

  @Watch("checked")
  private onChangeChecked(checked: boolean) {
    this.value = checked;
  }

  private value: boolean = false;
}
</script>

<style scoped lang="scss">
input[type="checkbox"] {
  outline: none;
  border: solid 1px lightgray;
  background-color: white;
  -webkit-appearance: none;
  appearance: none;
  width: 1.4em;
  height: 1.4em;
  font-size: 1em;
  border-radius: 3px;
  display: inline-flex;
  align-items: flex-end;

  &:checked:before {
    content: "✔";
    color: white;
    margin-left: 1px;
    margin-top: 1px;
    position: absolute;
  }
}
</style>
